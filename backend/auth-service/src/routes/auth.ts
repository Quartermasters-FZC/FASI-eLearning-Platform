/**
 * Authentication Routes
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * Comprehensive authentication endpoints with government-grade security
 * Features: JWT, 2FA, SSO, password policies, account lockout
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

import { logger } from '../utils/logger';
import { sendEmail } from '../utils/email';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { validatePassword, hashPassword } from '../utils/password';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();
const redis = createClient({ url: process.env.REDIS_URL });

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour

// =================================================================
// VALIDATION SCHEMAS
// =================================================================

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 1 })
        .withMessage('Password is required'),
    body('twoFactorToken')
        .optional()
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('2FA token must be 6 digits')
];

const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 12 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 12 characters with uppercase, lowercase, number, and special character'),
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name is required (1-100 characters)'),
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name is required (1-100 characters)'),
    body('organization')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Organization must be less than 200 characters'),
    body('jobTitle')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Job title must be less than 200 characters'),
    body('securityClearance')
        .optional()
        .isIn(['PUBLIC', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'])
        .withMessage('Invalid security clearance level')
];

const passwordResetValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required')
];

const passwordChangeValidation = [
    body('currentPassword')
        .isLength({ min: 1 })
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 12 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must meet security requirements'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match');
            }
            return true;
        })
];

// =================================================================
// HELPER FUNCTIONS
// =================================================================

/**
 * Check if account is locked due to failed login attempts
 */
async function isAccountLocked(email: string): Promise<boolean> {
    const lockKey = `account_lock:${email}`;
    const lockData = await redis.get(lockKey);
    return lockData !== null;
}

/**
 * Increment failed login attempts and lock account if necessary
 */
async function handleFailedLogin(email: string): Promise<void> {
    const attemptsKey = `login_attempts:${email}`;
    const attempts = await redis.incr(attemptsKey);
    
    if (attempts === 1) {
        await redis.expire(attemptsKey, LOCKOUT_DURATION / 1000);
    }
    
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockKey = `account_lock:${email}`;
        await redis.setex(lockKey, LOCKOUT_DURATION / 1000, 'locked');
        await redis.del(attemptsKey);
        
        logger.warn(`Account locked for ${email} due to ${attempts} failed login attempts`);
        
        // Send security alert email
        try {
            await sendEmail({
                to: email,
                subject: 'Security Alert: Account Locked',
                template: 'account-locked',
                data: { email, lockoutDuration: '30 minutes' }
            });
        } catch (error) {
            logger.error('Failed to send account lock email:', error);
        }
    }
}

/**
 * Clear failed login attempts on successful login
 */
async function clearFailedAttempts(email: string): Promise<void> {
    const attemptsKey = `login_attempts:${email}`;
    await redis.del(attemptsKey);
}

/**
 * Generate and store password reset token
 */
async function generatePasswordResetToken(userId: string): Promise<string> {
    const token = jwt.sign(
        { userId, type: 'password_reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
    );
    
    const tokenKey = `password_reset:${userId}`;
    await redis.setex(tokenKey, PASSWORD_RESET_EXPIRY / 1000, token);
    
    return token;
}

// =================================================================
// AUTHENTICATION ROUTES
// =================================================================

/**
 * POST /auth/login
 * User login with email/password and optional 2FA
 */
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { email, password, twoFactorToken, rememberMe } = req.body;

    // Check if account is locked
    if (await isAccountLocked(email)) {
        return res.status(423).json({
            error: 'Account temporarily locked',
            message: 'Too many failed login attempts. Please try again in 30 minutes.',
            lockoutDuration: LOCKOUT_DURATION
        });
    }

    try {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                userLanguages: {
                    include: { language: true }
                }
            }
        });

        if (!user) {
            await handleFailedLogin(email);
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Check if user account is active
        if (user.status !== 'active') {
            return res.status(403).json({
                error: 'Account not active',
                message: 'Your account is not active. Please contact administrator.',
                status: user.status
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            await handleFailedLogin(email);
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Check 2FA if enabled
        if (user.twoFactorEnabled) {
            if (!twoFactorToken) {
                return res.status(200).json({
                    requiresTwoFactor: true,
                    message: 'Two-factor authentication required'
                });
            }

            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret!,
                encoding: 'base32',
                token: twoFactorToken,
                window: 2 // Allow 2 time steps (±60 seconds)
            });

            if (!verified) {
                await handleFailedLogin(email);
                return res.status(401).json({
                    error: 'Invalid 2FA token',
                    message: 'Two-factor authentication token is invalid'
                });
            }
        }

        // Clear failed attempts on successful login
        await clearFailedAttempts(email);

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token in Redis
        const refreshTokenKey = `refresh_token:${user.id}`;
        const tokenExpiry = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
        await redis.setex(refreshTokenKey, tokenExpiry, refreshToken);

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                lastActiveAt: new Date(),
                failedLoginAttempts: 0
            }
        });

        // Log successful login
        logger.info(`Successful login for user ${user.email} (${user.id})`);

        // Prepare user data for response
        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            role: user.role,
            organization: user.organization,
            department: user.department,
            jobTitle: user.jobTitle,
            avatarUrl: user.avatarUrl,
            preferredLanguage: user.preferredLanguageId,
            languages: user.userLanguages.map(ul => ({
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
                }
            })),
            twoFactorEnabled: user.twoFactorEnabled,
            emailVerified: user.emailVerifiedAt !== null,
            lastLoginAt: user.lastLoginAt
        };

        res.json({
            success: true,
            message: 'Login successful',
            user: userData,
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: 3600 // 1 hour
            }
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred during login'
        });
    }
}));

/**
 * POST /auth/logout
 * User logout - invalidate tokens
 */
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Remove refresh token from Redis
        const refreshTokenKey = `refresh_token:${userId}`;
        await redis.del(refreshTokenKey);

        // Update last active time
        await prisma.user.update({
            where: { id: userId },
            data: { lastActiveAt: new Date() }
        });

        logger.info(`User logged out: ${req.user.email} (${userId})`);

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred during logout'
        });
    }
}));

/**
 * POST /auth/register
 * User registration with email verification
 */
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const {
        email,
        password,
        firstName,
        lastName,
        organization,
        department,
        jobTitle,
        securityClearance,
        governmentId
    } = req.body;

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'An account with this email already exists'
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
                organization: organization || null,
                department: department || null,
                jobTitle: jobTitle || null,
                securityClearance: securityClearance || null,
                governmentId: governmentId || null,
                status: 'pending_verification',
                role: 'student' // Default role
            }
        });

        // Generate email verification token
        const verificationToken = jwt.sign(
            { userId: user.id, type: 'email_verification' },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        // Store verification token in Redis
        const verificationKey = `email_verification:${user.id}`;
        await redis.setex(verificationKey, 24 * 60 * 60, verificationToken);

        // Send verification email
        try {
            await sendEmail({
                to: email,
                subject: 'Verify Your eLearning Platform Account',
                template: 'email-verification',
                data: {
                    firstName,
                    verificationToken,
                    verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
                }
            });
        } catch (emailError) {
            logger.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails
        }

        logger.info(`New user registered: ${email} (${user.id})`);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification instructions.',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                status: user.status
            }
        });

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred during registration'
        });
    }
}));

/**
 * POST /auth/refresh-token
 * Refresh JWT access token
 */
router.post('/refresh-token', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            error: 'Refresh token required',
            message: 'Refresh token is required'
        });
    }

    try {
        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);
        const userId = payload.userId;

        // Check if refresh token exists in Redis
        const refreshTokenKey = `refresh_token:${userId}`;
        const storedToken = await redis.get(refreshTokenKey);

        if (!storedToken || storedToken !== refreshToken) {
            return res.status(401).json({
                error: 'Invalid refresh token',
                message: 'Refresh token is invalid or expired'
            });
        }

        // Get user data
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.status !== 'active') {
            return res.status(401).json({
                error: 'User not found or inactive',
                message: 'User account is not available'
            });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        // Update refresh token in Redis
        await redis.setex(refreshTokenKey, 24 * 60 * 60, newRefreshToken);

        res.json({
            success: true,
            tokens: {
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: 3600
            }
        });

    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(401).json({
            error: 'Token refresh failed',
            message: 'Unable to refresh token'
        });
    }
}));

export { router as authRoutes };