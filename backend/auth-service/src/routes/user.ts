/**
 * User Management Routes
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * User profile and preferences management endpoints
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

import { logger } from '../utils/logger';
import { validatePassword, hashPassword, comparePassword } from '../utils/password';
import { authMiddleware, requireSelfOrAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// =================================================================
// USER PROFILE ROUTES
// =================================================================

/**
 * GET /users/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                userLanguages: {
                    include: { language: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User profile not found'
            });
        }

        // Remove sensitive data
        const { passwordHash, twoFactorSecret, ...safeUser } = user;

        // Format response
        const profile = {
            id: safeUser.id,
            email: safeUser.email,
            username: safeUser.username,
            firstName: safeUser.firstName,
            lastName: safeUser.lastName,
            displayName: safeUser.displayName,
            avatarUrl: safeUser.avatarUrl,
            phone: safeUser.phone,
            organization: safeUser.organization,
            department: safeUser.department,
            jobTitle: safeUser.jobTitle,
            role: safeUser.role,
            status: safeUser.status,
            preferredLanguageId: safeUser.preferredLanguageId,
            timezone: safeUser.timezone,
            twoFactorEnabled: safeUser.twoFactorEnabled,
            emailVerified: safeUser.emailVerifiedAt !== null,
            lastLoginAt: safeUser.lastLoginAt,
            lastActiveAt: safeUser.lastActiveAt,
            createdAt: safeUser.createdAt,
            languages: safeUser.userLanguages.map(ul => ({
                id: ul.language.id,
                code: ul.language.isoCode,
                name: ul.language.nameEnglish,
                nativeName: ul.language.nameNative,
                role: ul.role,
                currentLevel: {
                    speaking: ul.currentFsiSpeakingLevel,
                    reading: ul.currentFsiReadingLevel,
                    listening: ul.currentFsiListeningLevel,
                    writing: ul.currentFsiWritingLevel
                },
                targetLevel: {
                    speaking: ul.targetFsiSpeakingLevel,
                    reading: ul.targetFsiReadingLevel,
                    listening: ul.targetFsiListeningLevel,
                    writing: ul.targetFsiWritingLevel
                },
                isPrimary: ul.isPrimary,
                startedLearningAt: ul.startedLearningAt
            }))
        };

        res.json({
            success: true,
            profile
        });

    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve user profile'
        });
    }
}));

/**
 * PUT /users/profile
 * Update user profile
 */
router.put('/profile', [
    authMiddleware,
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name must be 1-100 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name must be 1-100 characters'),
    body('displayName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Display name must be 1-200 characters'),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Invalid phone number'),
    body('timezone')
        .optional()
        .isString()
        .withMessage('Timezone must be a valid string'),
    body('preferredLanguageId')
        .optional()
        .isUUID()
        .withMessage('Preferred language ID must be a valid UUID')
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
            firstName,
            lastName,
            displayName,
            phone,
            timezone,
            preferredLanguageId
        } = req.body;

        // Build update data
        const updateData: any = {};
        
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (phone !== undefined) updateData.phone = phone;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (preferredLanguageId !== undefined) {
            // Verify language exists
            const language = await prisma.language.findUnique({
                where: { id: preferredLanguageId }
            });
            if (!language) {
                return res.status(400).json({
                    error: 'Invalid language',
                    message: 'Preferred language not found'
                });
            }
            updateData.preferredLanguageId = preferredLanguageId;
        }

        // Auto-generate display name if first/last name changed
        if (firstName || lastName) {
            const currentUser = await prisma.user.findUnique({
                where: { id: req.user!.id }
            });
            if (currentUser) {
                const newFirstName = firstName || currentUser.firstName;
                const newLastName = lastName || currentUser.lastName;
                updateData.displayName = `${newFirstName} ${newLastName}`.trim();
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: req.user!.id },
            data: updateData,
            include: {
                userLanguages: {
                    include: { language: true }
                }
            }
        });

        // Remove sensitive data
        const { passwordHash, twoFactorSecret, ...safeUser } = updatedUser;

        logger.info(`User profile updated: ${updatedUser.email}`);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: safeUser
        });

    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update user profile'
        });
    }
}));

/**
 * POST /users/change-password
 * Change user password
 */
router.post('/change-password', [
    authMiddleware,
    body('currentPassword')
        .isLength({ min: 1 })
        .withMessage('Current password is required'),
    body('newPassword')
        .custom((value) => {
            const validation = validatePassword(value);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            return true;
        }),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match');
            }
            return true;
        })
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
        const { currentPassword, newPassword } = req.body;

        // Get current user
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                error: 'Invalid current password',
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
                updatedAt: new Date()
            }
        });

        logger.info(`Password changed for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        logger.error('Change password error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to change password'
        });
    }
}));

// =================================================================
// TWO-FACTOR AUTHENTICATION ROUTES
// =================================================================

/**
 * POST /users/enable-2fa
 * Enable two-factor authentication
 */
router.post('/enable-2fa', authMiddleware, asyncHandler(async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account not found'
            });
        }

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                error: 'Two-factor authentication already enabled',
                message: '2FA is already enabled for this account'
            });
        }

        // Generate 2FA secret
        const secret = speakeasy.generateSecret({
            name: `eLearning Platform (${user.email})`,
            issuer: 'Quartermasters FZC'
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        // Store secret temporarily (not activated until verified)
        await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorSecret: secret.base32 }
        });

        res.json({
            success: true,
            message: 'Two-factor authentication setup initiated',
            qrCode: qrCodeUrl,
            secret: secret.base32,
            backupCodes: [], // In production, generate backup codes
            instructions: 'Scan the QR code with your authenticator app and verify with a token'
        });

    } catch (error) {
        logger.error('Enable 2FA error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to enable two-factor authentication'
        });
    }
}));

/**
 * POST /users/verify-2fa
 * Verify and activate two-factor authentication
 */
router.post('/verify-2fa', [
    authMiddleware,
    body('token')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('Token must be 6 digits')
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
        const { token } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.user!.id }
        });

        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({
                error: 'Two-factor setup not initiated',
                message: 'Please initiate 2FA setup first'
            });
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({
                error: 'Invalid token',
                message: 'The provided token is invalid'
            });
        }

        // Activate 2FA
        await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorEnabled: true }
        });

        logger.info(`Two-factor authentication enabled for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Two-factor authentication enabled successfully'
        });

    } catch (error) {
        logger.error('Verify 2FA error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to verify two-factor authentication'
        });
    }
}));

/**
 * POST /users/disable-2fa
 * Disable two-factor authentication
 */
router.post('/disable-2fa', [
    authMiddleware,
    body('password')
        .isLength({ min: 1 })
        .withMessage('Password is required'),
    body('token')
        .optional()
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('Token must be 6 digits')
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
        const { password, token } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.user!.id }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account not found'
            });
        }

        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                error: 'Two-factor authentication not enabled',
                message: '2FA is not enabled for this account'
            });
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(400).json({
                error: 'Invalid password',
                message: 'Password is incorrect'
            });
        }

        // Verify 2FA token if provided
        if (token && user.twoFactorSecret) {
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token,
                window: 2
            });

            if (!verified) {
                return res.status(400).json({
                    error: 'Invalid token',
                    message: 'The provided 2FA token is invalid'
                });
            }
        }

        // Disable 2FA
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null
            }
        });

        logger.info(`Two-factor authentication disabled for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Two-factor authentication disabled successfully'
        });

    } catch (error) {
        logger.error('Disable 2FA error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to disable two-factor authentication'
        });
    }
}));

export { router as userRoutes };