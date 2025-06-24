/**
 * Authentication Middleware
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * JWT authentication and authorization middleware
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                organization?: string;
                securityClearance?: string;
            };
        }
    }
}

/**
 * Authentication middleware - verifies JWT token
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Authorization header is missing'
            });
            return;
        }

        const token = extractTokenFromHeader(authHeader);
        if (!token) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Bearer token is missing'
            });
            return;
        }

        // Verify JWT token
        const payload = verifyAccessToken(token);
        
        // Get user from database to ensure account is still active
        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!user) {
            res.status(401).json({
                error: 'User not found',
                message: 'The user associated with this token no longer exists'
            });
            return;
        }

        if (user.status !== 'active') {
            res.status(403).json({
                error: 'Account not active',
                message: 'Your account is not active. Please contact administrator.',
                status: user.status
            });
            return;
        }

        // Update last active time
        await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() }
        });

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            organization: user.organization,
            securityClearance: user.securityClearance
        };

        next();
    } catch (error) {
        logger.error('Authentication middleware error:', error);
        res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid or expired token'
        });
    }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(allowedRoles: string | string[]) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate first'
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                message: `This endpoint requires one of the following roles: ${roles.join(', ')}`,
                userRole: req.user.role,
                requiredRoles: roles
            });
            return;
        }

        next();
    };
}

/**
 * Security clearance authorization middleware
 */
export function requireSecurityClearance(requiredClearance: string) {
    const clearanceLevels = {
        'PUBLIC': 0,
        'CONFIDENTIAL': 1,
        'SECRET': 2,
        'TOP_SECRET': 3
    };

    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate first'
            });
            return;
        }

        const userClearanceLevel = clearanceLevels[req.user.securityClearance as keyof typeof clearanceLevels] ?? -1;
        const requiredClearanceLevel = clearanceLevels[requiredClearance as keyof typeof clearanceLevels] ?? 999;

        if (userClearanceLevel < requiredClearanceLevel) {
            res.status(403).json({
                error: 'Insufficient security clearance',
                message: `This endpoint requires ${requiredClearance} clearance or higher`,
                userClearance: req.user.securityClearance || 'PUBLIC',
                requiredClearance
            });
            return;
        }

        next();
    };
}

/**
 * Organization-based authorization middleware
 */
export function requireOrganization(allowedOrganizations: string | string[]) {
    const organizations = Array.isArray(allowedOrganizations) ? allowedOrganizations : [allowedOrganizations];
    
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate first'
            });
            return;
        }

        if (!req.user.organization || !organizations.includes(req.user.organization)) {
            res.status(403).json({
                error: 'Organization access denied',
                message: `This endpoint is restricted to specific organizations`,
                userOrganization: req.user.organization || 'None',
                allowedOrganizations: organizations
            });
            return;
        }

        next();
    };
}

/**
 * Optional authentication middleware - adds user to request if token is valid
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            next();
            return;
        }

        const token = extractTokenFromHeader(authHeader);
        if (!token) {
            next();
            return;
        }

        const payload = verifyAccessToken(token);
        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (user && user.status === 'active') {
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                organization: user.organization,
                securityClearance: user.securityClearance
            };

            // Update last active time
            await prisma.user.update({
                where: { id: user.id },
                data: { lastActiveAt: new Date() }
            });
        }

        next();
    } catch (error) {
        // Silently fail for optional auth
        logger.debug('Optional auth middleware failed (continuing):', error);
        next();
    }
}

/**
 * Admin role check middleware
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Super admin role check middleware
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Instructor role check middleware
 */
export const requireInstructor = requireRole(['instructor', 'admin', 'super_admin']);

/**
 * Student or higher role check middleware
 */
export const requireStudent = requireRole(['student', 'instructor', 'admin', 'super_admin']);

/**
 * COR (Contracting Officer Representative) role check middleware
 */
export const requireCOR = requireRole(['cor', 'admin', 'super_admin']);

/**
 * Self or admin access middleware - allows users to access their own data or admins to access any data
 */
export function requireSelfOrAdmin(userIdParam: string = 'userId') {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate first'
            });
            return;
        }

        const targetUserId = req.params[userIdParam];
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
        const isSelf = req.user.id === targetUserId;

        if (!isAdmin && !isSelf) {
            res.status(403).json({
                error: 'Access denied',
                message: 'You can only access your own data or you need admin privileges'
            });
            return;
        }

        next();
    };
}

/**
 * Rate limiting bypass for authenticated users with higher limits
 */
export function authRateLimitBypass(req: Request, res: Response, next: NextFunction): void {
    if (req.user) {
        // Authenticated users get higher limits
        req.rateLimit = {
            limit: req.user.role === 'admin' ? 1000 : 500, // Higher limits for admin
            current: 0,
            remaining: req.user.role === 'admin' ? 1000 : 500,
            resetTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        };
    }
    next();
}