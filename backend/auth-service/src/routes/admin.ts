/**
 * Admin Routes
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * Administrative endpoints for user and system management
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

import { logger } from '../utils/logger';
import { hashPassword } from '../utils/password';
import { authMiddleware, requireAdmin, requireSuperAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();
const redis = createClient({ url: process.env.REDIS_URL });

// All admin routes require authentication
router.use(authMiddleware);

// =================================================================
// USER MANAGEMENT ROUTES
// =================================================================

/**
 * GET /admin/users
 * List all users with filtering and pagination
 */
router.get('/users', [
    requireAdmin,
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('role')
        .optional()
        .isIn(['student', 'instructor', 'admin', 'super_admin', 'cor'])
        .withMessage('Invalid role'),
    query('status')
        .optional()
        .isIn(['active', 'inactive', 'suspended', 'pending_verification'])
        .withMessage('Invalid status'),
    query('search')
        .optional()
        .isLength({ min: 2 })
        .withMessage('Search term must be at least 2 characters')
], asyncHandler(async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const { role, status, search } = req.query;

        // Build where clause
        const where: any = {};
        if (role) where.role = role;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { email: { contains: search as string, mode: 'insensitive' } },
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' } },
                { organization: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        // Get users and total count
        const [users, totalUsers] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    userLanguages: {
                        include: { language: true }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        // Remove sensitive data
        const safeUsers = users.map(user => {
            const { passwordHash, twoFactorSecret, ...safeUser } = user;
            return safeUser;
        });

        const totalPages = Math.ceil(totalUsers / limit);

        res.json({
            success: true,
            data: {
                users: safeUsers,
                pagination: {
                    page,
                    limit,
                    totalUsers,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        logger.error('Admin list users error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve users'
        });
    }
}));

/**
 * GET /admin/users/:id
 * Get specific user details
 */
router.get('/users/:id', requireAdmin, asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                userLanguages: {
                    include: { language: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User with specified ID not found'
            });
        }

        // Remove sensitive data
        const { passwordHash, twoFactorSecret, ...safeUser } = user;

        res.json({
            success: true,
            user: safeUser
        });

    } catch (error) {
        logger.error('Admin get user error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve user'
        });
    }
}));

/**
 * PUT /admin/users/:id/status
 * Update user status
 */
router.put('/users/:id/status', [
    requireAdmin,
    body('status')
        .isIn(['active', 'inactive', 'suspended', 'pending_verification'])
        .withMessage('Invalid status'),
    body('reason')
        .optional()
        .isLength({ min: 5, max: 500 })
        .withMessage('Reason must be 5-500 characters')
], asyncHandler(async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User with specified ID not found'
            });
        }

        // Prevent super admins from being modified by regular admins
        if (user.role === 'super_admin' && req.user!.role !== 'super_admin') {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Cannot modify super admin accounts'
            });
        }

        // Update user status
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { 
                status,
                updatedAt: new Date()
            }
        });

        // Log the action
        logger.info(`User status updated by admin:`, {
            adminId: req.user!.id,
            adminEmail: req.user!.email,
            targetUserId: id,
            targetUserEmail: user.email,
            oldStatus: user.status,
            newStatus: status,
            reason
        });

        res.json({
            success: true,
            message: 'User status updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                status: updatedUser.status
            }
        });

    } catch (error) {
        logger.error('Admin update user status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update user status'
        });
    }
}));

/**
 * PUT /admin/users/:id/role
 * Update user role (super admin only)
 */
router.put('/users/:id/role', [
    requireSuperAdmin,
    body('role')
        .isIn(['student', 'instructor', 'admin', 'super_admin', 'cor'])
        .withMessage('Invalid role')
], asyncHandler(async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    try {
        const { id } = req.params;
        const { role } = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User with specified ID not found'
            });
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { 
                role,
                updatedAt: new Date()
            }
        });

        // Log the action
        logger.info(`User role updated by super admin:`, {
            adminId: req.user!.id,
            adminEmail: req.user!.email,
            targetUserId: id,
            targetUserEmail: user.email,
            oldRole: user.role,
            newRole: role
        });

        res.json({
            success: true,
            message: 'User role updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });

    } catch (error) {
        logger.error('Admin update user role error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update user role'
        });
    }
}));

/**
 * POST /admin/users
 * Create new user (admin only)
 */
router.post('/users', [
    requireAdmin,
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 12 })
        .withMessage('Password must be at least 12 characters'),
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name is required (1-100 characters)'),
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name is required (1-100 characters)'),
    body('role')
        .isIn(['student', 'instructor', 'admin', 'cor'])
        .withMessage('Invalid role'),
    body('organization')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Organization must be less than 200 characters')
], asyncHandler(async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    try {
        const {
            email,
            password,
            firstName,
            lastName,
            role,
            organization,
            department,
            jobTitle
        } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'User with this email already exists'
            });
        }

        // Prevent regular admins from creating super admin accounts
        if (role === 'super_admin' && req.user!.role !== 'super_admin') {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Cannot create super admin accounts'
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                displayName: `${firstName} ${lastName}`,
                role,
                organization: organization || null,
                department: department || null,
                jobTitle: jobTitle || null,
                status: 'active', // Admin-created users are active by default
                emailVerifiedAt: new Date() // Admin-created users are pre-verified
            }
        });

        // Log the action
        logger.info(`User created by admin:`, {
            adminId: req.user!.id,
            adminEmail: req.user!.email,
            newUserId: user.id,
            newUserEmail: user.email,
            newUserRole: user.role
        });

        // Remove sensitive data
        const { passwordHash: _, ...safeUser } = user;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: safeUser
        });

    } catch (error) {
        logger.error('Admin create user error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create user'
        });
    }
}));

// =================================================================
// SYSTEM ANALYTICS ROUTES
// =================================================================

/**
 * GET /admin/analytics
 * Get system analytics and statistics
 */
router.get('/analytics', requireAdmin, asyncHandler(async (req, res) => {
    try {
        // Get user statistics
        const [
            totalUsers,
            activeUsers,
            pendingUsers,
            usersByRole,
            usersByOrganization,
            recentLogins
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'active' } }),
            prisma.user.count({ where: { status: 'pending_verification' } }),
            prisma.user.groupBy({
                by: ['role'],
                _count: { role: true }
            }),
            prisma.user.groupBy({
                by: ['organization'],
                _count: { organization: true },
                where: { organization: { not: null } }
            }),
            prisma.user.count({
                where: {
                    lastLoginAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                }
            })
        ]);

        // Get language statistics
        const [
            totalLanguages,
            languageUsage
        ] = await Promise.all([
            prisma.language.count({ where: { status: 'active' } }),
            prisma.userLanguage.groupBy({
                by: ['languageId'],
                _count: { languageId: true }
            })
        ]);

        // Format role statistics
        const roleStats = usersByRole.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
        }, {} as Record<string, number>);

        // Format organization statistics
        const orgStats = usersByOrganization.map(item => ({
            organization: item.organization,
            count: item._count.organization
        }));

        res.json({
            success: true,
            analytics: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    pending: pendingUsers,
                    recentLogins,
                    byRole: roleStats,
                    topOrganizations: orgStats.slice(0, 10)
                },
                languages: {
                    total: totalLanguages,
                    activeUsers: languageUsage.length
                },
                system: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    nodeVersion: process.version,
                    environment: process.env.NODE_ENV
                }
            }
        });

    } catch (error) {
        logger.error('Admin analytics error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve analytics'
        });
    }
}));

/**
 * GET /admin/system-status
 * Get detailed system status
 */
router.get('/system-status', requireAdmin, asyncHandler(async (req, res) => {
    try {
        // Check database connectivity
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbResponseTime = Date.now() - dbStart;

        // Check Redis connectivity
        let redisStatus = 'unknown';
        let redisResponseTime = 0;
        try {
            if (!redis.isOpen) {
                await redis.connect();
            }
            const redisStart = Date.now();
            await redis.ping();
            redisResponseTime = Date.now() - redisStart;
            redisStatus = 'healthy';
        } catch (error) {
            redisStatus = 'unhealthy';
        }

        res.json({
            success: true,
            systemStatus: {
                database: {
                    status: 'healthy',
                    responseTime: dbResponseTime
                },
                redis: {
                    status: redisStatus,
                    responseTime: redisResponseTime
                },
                application: {
                    status: 'healthy',
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage()
                },
                environment: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    environment: process.env.NODE_ENV
                }
            }
        });

    } catch (error) {
        logger.error('Admin system status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve system status'
        });
    }
}));

export { router as adminRoutes };