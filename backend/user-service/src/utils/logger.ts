/**
 * Logging Utility
 * User Service - AI-Powered eLearning Platform
 */

import winston from 'winston';
import path from 'path';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

const transports = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }),
    new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }),
    new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }),
];

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    levels,
    format,
    transports,
    exitOnError: false,
});

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