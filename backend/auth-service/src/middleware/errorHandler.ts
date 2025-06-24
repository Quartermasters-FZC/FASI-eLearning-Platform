/**
 * Global Error Handler Middleware
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * Centralized error handling with proper logging and response formatting
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    errors?: any[];
    isOperational?: boolean;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
    error: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Log the error
    logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        timestamp: new Date().toISOString()
    });

    // Default error response
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    let errorCode = error.code || 'INTERNAL_ERROR';
    let details: any = undefined;

    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        errorCode = 'VALIDATION_ERROR';
        details = error.errors;
    } else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
        errorCode = 'CAST_ERROR';
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        errorCode = 'INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
    } else if (error.name === 'MulterError') {
        statusCode = 400;
        message = 'File upload error';
        errorCode = 'UPLOAD_ERROR';
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            message = 'File size too large';
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field';
        }
    } else if (error.code === '23505') { // PostgreSQL unique violation
        statusCode = 409;
        message = 'Resource already exists';
        errorCode = 'DUPLICATE_RESOURCE';
    } else if (error.code === '23503') { // PostgreSQL foreign key violation
        statusCode = 400;
        message = 'Referenced resource not found';
        errorCode = 'FOREIGN_KEY_VIOLATION';
    } else if (error.code === '23502') { // PostgreSQL not null violation
        statusCode = 400;
        message = 'Required field missing';
        errorCode = 'REQUIRED_FIELD_MISSING';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        statusCode = 503;
        message = 'Service temporarily unavailable';
        errorCode = 'SERVICE_UNAVAILABLE';
    } else if (error.code === 'ECONNRESET') {
        statusCode = 502;
        message = 'Connection reset';
        errorCode = 'CONNECTION_RESET';
    }

    // Security: Don't expose sensitive information in production
    if (process.env.NODE_ENV === 'production') {
        // Only expose safe error messages in production
        if (statusCode >= 500) {
            message = 'Internal server error';
            details = undefined;
        }
        
        // Remove stack trace in production
        delete error.stack;
    }

    // Prepare error response
    const errorResponse: any = {
        success: false,
        error: {
            code: errorCode,
            message: message,
            statusCode: statusCode,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        }
    };

    // Add details if available
    if (details) {
        errorResponse.error.details = details;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
        errorResponse.error.stack = error.stack;
    }

    // Add request ID if available
    if (req.headers['x-request-id']) {
        errorResponse.error.requestId = req.headers['x-request-id'];
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
    const error: CustomError = new Error(`Route ${req.method} ${req.originalUrl} not found`);
    error.statusCode = 404;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
}

/**
 * Async error wrapper for async route handlers
 */
export function asyncErrorHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Create custom error with status code
 */
export function createError(message: string, statusCode: number = 500, code?: string): CustomError {
    const error: CustomError = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = true;
    return error;
}

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', {
        promise: promise,
        reason: reason?.stack || reason,
        timestamp: new Date().toISOString()
    });
    
    // Graceful shutdown
    process.exit(1);
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    
    // Graceful shutdown
    process.exit(1);
});

/**
 * Validation error formatter
 */
export function formatValidationErrors(errors: any[]): any[] {
    return errors.map(error => ({
        field: error.param || error.path,
        message: error.msg || error.message,
        value: error.value,
        location: error.location
    }));
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: any): CustomError {
    let customError: CustomError;

    if (error.code === '23505') {
        // Unique constraint violation
        customError = createError('Resource already exists', 409, 'DUPLICATE_RESOURCE');
    } else if (error.code === '23503') {
        // Foreign key constraint violation
        customError = createError('Referenced resource not found', 400, 'FOREIGN_KEY_VIOLATION');
    } else if (error.code === '23502') {
        // Not null constraint violation
        customError = createError('Required field missing', 400, 'REQUIRED_FIELD_MISSING');
    } else if (error.code === '22001') {
        // String data right truncation
        customError = createError('Data too long for field', 400, 'DATA_TOO_LONG');
    } else if (error.code === '22003') {
        // Numeric value out of range
        customError = createError('Numeric value out of range', 400, 'NUMERIC_OUT_OF_RANGE');
    } else {
        // Generic database error
        customError = createError('Database operation failed', 500, 'DATABASE_ERROR');
    }

    return customError;
}

/**
 * Rate limit error handler
 */
export function handleRateLimitError(req: Request, res: Response): void {
    logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        timestamp: new Date().toISOString()
    });

    res.status(429).json({
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            statusCode: 429,
            timestamp: new Date().toISOString(),
            retryAfter: '15 minutes'
        }
    });
}