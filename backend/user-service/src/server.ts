/**
 * User Service Server
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * User management and language preferences microservice
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { profileRoutes } from './routes/profile';
import { languagesRoutes } from './routes/languages';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

const prisma = new PrismaClient();
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

async function initializeServer() {
    try {
        // Connect to Redis
        await redisClient.connect();
        logger.info('Redis connected successfully');

        // Test database connection
        await prisma.$connect();
        logger.info('Database connected successfully');

        // =================================================================
        // SECURITY MIDDLEWARE
        // =================================================================

        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));

        // Rate limiting
        const generalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 200, // Limit each IP to 200 requests per windowMs
            message: {
                error: 'Too many requests, please try again later.'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        app.use(generalLimiter);

        // =================================================================
        // BASIC MIDDLEWARE
        // =================================================================

        // CORS configuration
        app.use(cors({
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);
                
                const allowedOrigins = [
                    'http://localhost:3000',
                    'http://localhost:3100',
                    'http://localhost:3200',
                    process.env.FRONTEND_URL,
                    process.env.ADMIN_URL
                ].filter(Boolean);

                if (allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        app.use(compression());

        app.use(morgan('combined', {
            stream: {
                write: (message: string) => logger.info(message.trim())
            }
        }));

        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // =================================================================
        // API ROUTES
        // =================================================================

        // Health check
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'User Service',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Profile management routes
        app.use('/', profileRoutes);

        // Language management routes
        app.use('/', languagesRoutes);

        // API documentation
        app.get('/api-docs', (req, res) => {
            res.json({
                service: 'User Service',
                version: '1.0.0',
                description: 'User management and language preferences service',
                developer: 'Quartermasters FZC',
                endpoints: {
                    profile: {
                        'GET /profile/:userId': 'Get user profile',
                        'PUT /profile/:userId': 'Update user profile',
                        'POST /profile/:userId/avatar': 'Upload user avatar',
                        'DELETE /profile/:userId/avatar': 'Remove user avatar',
                        'GET /profile/:userId/analytics': 'Get user learning analytics'
                    },
                    languages: {
                        'GET /languages': 'Get all available languages',
                        'GET /languages/popular': 'Get popular languages',
                        'GET /users/:userId/languages': 'Get user languages',
                        'POST /users/:userId/languages': 'Add language to user profile',
                        'PUT /users/:userId/languages/:userLanguageId': 'Update user language settings',
                        'DELETE /users/:userId/languages/:userLanguageId': 'Remove language from profile'
                    }
                },
                features: [
                    'User profile management',
                    'Avatar upload and processing',
                    'Language preference management',
                    'Learning progress tracking',
                    'FSI proficiency level tracking',
                    'Learning analytics and insights',
                    '70+ language support'
                ]
            });
        });

        // Catch-all route
        app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
                suggestion: 'Please check the API documentation at /api-docs'
            });
        });

        // =================================================================
        // ERROR HANDLING
        // =================================================================

        app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            logger.error('Error occurred:', {
                error: error.message,
                stack: error.stack,
                url: req.url,
                method: req.method,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });

            let statusCode = error.statusCode || 500;
            let message = error.message || 'Internal server error';

            // Handle specific error types
            if (error.name === 'ValidationError') {
                statusCode = 400;
                message = 'Validation failed';
            } else if (error.name === 'JsonWebTokenError') {
                statusCode = 401;
                message = 'Invalid token';
            } else if (error.name === 'TokenExpiredError') {
                statusCode = 401;
                message = 'Token expired';
            }

            // Security: Don't expose sensitive information in production
            if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
                message = 'Internal server error';
            }

            res.status(statusCode).json({
                success: false,
                error: {
                    message: message,
                    statusCode: statusCode,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    method: req.method
                }
            });
        });

        // =================================================================
        // SERVER STARTUP
        // =================================================================

        const gracefulShutdown = async () => {
            logger.info('Starting graceful shutdown...');
            
            try {
                await prisma.$disconnect();
                logger.info('Database connection closed');
                
                await redisClient.quit();
                logger.info('Redis connection closed');
                
                process.exit(0);
            } catch (error) {
                logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            gracefulShutdown();
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown();
        });

        // Start server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 User Service started on port ${PORT}`);
            logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
            logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
            logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🌐 CORS enabled for frontend applications`);
            logger.info(`🛡️  Security headers and rate limiting active`);
        });

        server.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use`);
            } else {
                logger.error('Server error:', error);
            }
            process.exit(1);
        });

    } catch (error) {
        logger.error('Failed to initialize server:', error);
        process.exit(1);
    }
}

initializeServer();

export default app;