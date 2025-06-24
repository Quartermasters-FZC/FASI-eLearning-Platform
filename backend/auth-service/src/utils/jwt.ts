/**
 * JWT Utility Functions
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * JWT token generation and verification with government-grade security
 */

import jwt from 'jsonwebtoken';
import { logger } from './logger';

interface User {
    id: string;
    email: string;
    role: string;
    organization?: string;
    securityClearance?: string;
}

interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    organization?: string;
    securityClearance?: string;
    type: 'access' | 'refresh';
    iat?: number;
    exp?: number;
}

/**
 * Generate access and refresh tokens for a user
 */
export function generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'> = {
        userId: user.id,
        email: user.email,
        role: user.role,
        organization: user.organization,
        securityClearance: user.securityClearance,
    };

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
        { ...payload, type: 'access' },
        process.env.JWT_SECRET!,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRY || '1h',
            issuer: 'elearning-platform',
            audience: 'elearning-users',
            subject: user.id,
        }
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
        { ...payload, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
            issuer: 'elearning-platform',
            audience: 'elearning-users',
            subject: user.id,
        }
    );

    return { accessToken, refreshToken };
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): TokenPayload {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
            issuer: 'elearning-platform',
            audience: 'elearning-users',
        }) as TokenPayload;

        if (decoded.type !== 'access') {
            throw new Error('Invalid token type');
        }

        return decoded;
    } catch (error) {
        logger.error('Access token verification failed:', error);
        throw new Error('Invalid or expired access token');
    }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
    try {
        const decoded = jwt.verify(
            token, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
            {
                issuer: 'elearning-platform',
                audience: 'elearning-users',
            }
        ) as TokenPayload;

        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }

        return decoded;
    } catch (error) {
        logger.error('Refresh token verification failed:', error);
        throw new Error('Invalid or expired refresh token');
    }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Generate a password reset token
 */
export function generatePasswordResetToken(userId: string): string {
    return jwt.sign(
        { userId, type: 'password_reset' },
        process.env.JWT_SECRET!,
        {
            expiresIn: '1h',
            issuer: 'elearning-platform',
            audience: 'elearning-users',
            subject: userId,
        }
    );
}

/**
 * Generate an email verification token
 */
export function generateEmailVerificationToken(userId: string): string {
    return jwt.sign(
        { userId, type: 'email_verification' },
        process.env.JWT_SECRET!,
        {
            expiresIn: '24h',
            issuer: 'elearning-platform',
            audience: 'elearning-users',
            subject: userId,
        }
    );
}

/**
 * Verify special purpose tokens (password reset, email verification)
 */
export function verifySpecialToken(token: string, expectedType: string): { userId: string } {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
            issuer: 'elearning-platform',
            audience: 'elearning-users',
        }) as any;

        if (decoded.type !== expectedType) {
            throw new Error(`Invalid token type. Expected: ${expectedType}, Got: ${decoded.type}`);
        }

        return { userId: decoded.userId };
    } catch (error) {
        logger.error(`${expectedType} token verification failed:`, error);
        throw new Error(`Invalid or expired ${expectedType} token`);
    }
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpiration(token: string): number | null {
    try {
        const decoded = jwt.decode(token) as any;
        return decoded?.exp || null;
    } catch (error) {
        logger.error('Failed to decode token for expiration:', error);
        return null;
    }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
    const exp = getTokenExpiration(token);
    if (!exp) return true;
    
    return Date.now() >= exp * 1000;
}