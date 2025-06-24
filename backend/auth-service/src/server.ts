/**
 * Authentication Service Server
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * Secure authentication and authorization microservice
 * Supporting government-grade security requirements
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import dotenv from 'dotenv';

// Import custom modules
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { adminRoutes } from './routes/admin';
import { healthRoutes } from './routes/health';
import { passport } from './config/passport';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database and Redis clients
const prisma = new PrismaClient();
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Redis store for sessions
const RedisStore = connectRedis(session);

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

        // Security headers
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

        // Rate limiting for security
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
            message: {
                error: 'Too many authentication attempts, please try again later.'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        const generalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests, please try again later.'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        // Apply general rate limiting to all routes
        app.use(generalLimiter);

        // =================================================================
        // BASIC MIDDLEWARE
        // =================================================================

        // CORS configuration
        app.use(cors({
            origin: function (origin, callback) {
                // Allow requests with no origin (like mobile apps or curl requests)
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

        // Compression
        app.use(compression());

        // Logging
        app.use(morgan('combined', {
            stream: {
                write: (message: string) => logger.info(message.trim())
            }
        }));

        // Body parsing
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Session configuration with Redis store
        app.use(session({
            store: new RedisStore({ client: redisClient }),
            secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'strict'
            },
            name: 'elearning.sid'
        }));

        // Initialize Passport
        app.use(passport.initialize());
        app.use(passport.session());

        // =================================================================
        // API ROUTES
        // =================================================================

        // Health check (no rate limiting)
        app.use('/health', healthRoutes);

        // Authentication routes (with strict rate limiting)
        app.use('/auth', authLimiter, authRoutes);

        // User management routes
        app.use('/users', userRoutes);

        // Admin routes
        app.use('/admin', adminRoutes);

        // API documentation endpoint
        app.get('/api-docs', (req, res) => {
            res.json({
                service: 'Authentication Service',
                version: '1.0.0',
                description: 'Government-grade authentication and authorization service',
                developer: 'Quartermasters FZC',
                endpoints: {
                    auth: {
                        'POST /auth/login': 'User login with email/password',
                        'POST /auth/logout': 'User logout',
                        'POST /auth/register': 'User registration',
                        'POST /auth/forgot-password': 'Password reset request',
                        'POST /auth/reset-password': 'Password reset confirmation',
                        'POST /auth/verify-email': 'Email verification',
                        'POST /auth/enable-2fa': 'Enable two-factor authentication',
                        'POST /auth/verify-2fa': 'Verify 2FA token',
                        'POST /auth/refresh-token': 'Refresh JWT token'
                    },
                    users: {
                        'GET /users/profile': 'Get user profile',
                        'PUT /users/profile': 'Update user profile',
                        'POST /users/change-password': 'Change password',
                        'GET /users/languages': 'Get user language preferences',
                        'PUT /users/languages': 'Update language preferences'
                    },
                    admin: {
                        'GET /admin/users': 'List all users (admin only)',
                        'PUT /admin/users/:id/status': 'Update user status',
                        'GET /admin/analytics': 'Get authentication analytics',
                        'POST /admin/users/bulk-import': 'Bulk import users'
                    }
                },
                security: {
                    authentication: 'JWT with refresh tokens',
                    authorization: 'Role-based access control (RBAC)',
                    twoFactor: 'TOTP-based 2FA support',
                    sessionManagement: 'Redis-backed sessions',
                    rateLimiting: 'IP-based rate limiting',
                    encryption: 'bcrypt for passwords, JWT for tokens'
                }
            });
        });

        // Catch-all route for undefined endpoints
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

        // Global error handler (must be last)
        app.use(errorHandler);

        // =================================================================
        // SERVER STARTUP
        // =================================================================

        // Graceful shutdown handling
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

        // Handle shutdown signals
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        // Handle uncaught exceptions
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
            logger.info(`🚀 Authentication Service started on port ${PORT}`);
            logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
            logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
            logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🌐 CORS enabled for frontend applications`);
            logger.info(`🛡️  Security headers and rate limiting active`);
            logger.info(`🔐 Session management with Redis enabled`);
        });

        // Server error handling
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

// Start the server
initializeServer();

export default app;