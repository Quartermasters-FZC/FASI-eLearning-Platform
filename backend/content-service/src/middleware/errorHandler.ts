import express from 'express';
import { logger } from '../utils/logger';

export function errorHandler(error: any, req: express.Request, res: express.Response, next: express.NextFunction): void {
    logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString(),
    });

    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';

    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
    } else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
    } else if (error.name === 'MulterError') {
        statusCode = 400;
        message = 'File upload error';
    }

    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
        message = 'Internal server error';
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
        },
    });
}
