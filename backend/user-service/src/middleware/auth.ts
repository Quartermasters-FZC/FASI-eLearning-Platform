/**
 * Authentication Middleware for User Service
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * JWT verification and user context middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

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
 * Extract token from Authorization header
 */
function extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Verify JWT token
 */
function verifyToken(token: string): any {
    try {
        return jwt.verify(token, process.env.JWT_SECRET!, {
            issuer: 'elearning-platform',
            audience: 'elearning-users',
        });
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

        const payload = verifyToken(token);
        
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
                message: 'Your account is not active',
                status: user.status
            });
            return;
        }

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
                message: `This endpoint requires one of the following roles: ${roles.join(', ')}`
            });
            return;
        }

        next();
    };
}

/**
 * Self or admin access middleware
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
                message: 'You can only access your own data or need admin privileges'
            });
            return;
        }

        next();
    };
}