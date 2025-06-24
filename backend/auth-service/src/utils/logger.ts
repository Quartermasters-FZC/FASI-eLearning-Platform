/**
 * Logging Utility
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * Production-ready logging with different levels and formats
 */

import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Define transports
const transports = [
    // Console transport for development
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }),
    // File transport for error logs
    new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }),
    // File transport for all logs
    new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }),
];

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    levels,
    format,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
    new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'exceptions.log') 
    })
);

logger.rejections.handle(
    new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'rejections.log') 
    })
);

export { logger };