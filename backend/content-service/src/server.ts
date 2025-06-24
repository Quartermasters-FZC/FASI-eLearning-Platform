/**
 * Content Service Server
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * Content management and delivery microservice
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Client as ElasticClient } from '@elastic/elasticsearch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { coursesRoutes } from './routes/courses';
import { lessonsRoutes } from './routes/lessons';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

const prisma = new PrismaClient();
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
const elastic = new ElasticClient({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

async function initializeServer() {
    try {
        // Connect to databases
        await Promise.all([
            redisClient.connect(),
            prisma.$connect(),
            mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/content_db')
        ]);

        logger.info('All databases connected successfully');

        // Initialize Elasticsearch indices
        try {
            await initializeElasticsearchIndices();
        } catch (elasticError) {
            logger.warn('Elasticsearch initialization failed, continuing without search:', elasticError);
        }

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

        const generalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 300, // Higher limit for content service
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

        app.use(express.json({ limit: '50mb' }));
        app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // =================================================================
        // API ROUTES
        // =================================================================

        // Health check
        app.get('/health', async (req, res) => {
            try {
                // Check database connections
                await prisma.$queryRaw`SELECT 1`;
                await mongoose.connection.db.admin().ping();
                
                res.json({
                    status: 'healthy',
                    service: 'Content Service',
                    version: '1.0.0',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    databases: {
                        postgresql: 'connected',
                        mongodb: 'connected',
                        redis: redisClient.isOpen ? 'connected' : 'disconnected',
                        elasticsearch: 'connected'
                    }
                });
            } catch (error) {
                res.status(503).json({
                    status: 'unhealthy',
                    service: 'Content Service',
                    error: 'Database connection failed'
                });
            }
        });

        // Content routes
        app.use('/', coursesRoutes);
        app.use('/', lessonsRoutes);

        // Search endpoint
        app.get('/search', async (req, res) => {
            try {
                const { q, type = 'courses', limit = 20 } = req.query;

                if (!q || typeof q !== 'string' || q.length < 2) {
                    return res.status(400).json({
                        error: 'Invalid search query',
                        message: 'Search query must be at least 2 characters'
                    });
                }

                const searchResults = await elastic.search({
                    index: type as string,
                    body: {
                        query: {
                            multi_match: {
                                query: q,
                                fields: [
                                    'title^3',
                                    'description^2',
                                    'shortDescription^2',
                                    'tags',
                                    'language.name',
                                    'category',
                                    'instructor'
                                ],
                                fuzziness: 'AUTO'
                            }
                        },
                        highlight: {
                            fields: {
                                title: {},
                                description: {},
                                shortDescription: {}
                            }
                        },
                        size: parseInt(limit as string)
                    }
                });

                res.json({
                    success: true,
                    query: q,
                    total: searchResults.hits.total,
                    results: searchResults.hits.hits.map((hit: any) => ({
                        id: hit._id,
                        score: hit._score,
                        source: hit._source,
                        highlights: hit.highlight
                    }))
                });

            } catch (error) {
                logger.error('Search error:', error);
                res.status(500).json({
                    error: 'Search failed',
                    message: 'Failed to perform search'
                });
            }
        });

        // Categories endpoint
        app.get('/categories', async (req, res) => {
            try {
                const categories = await prisma.courseCategory.findMany({
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        _count: {
                            select: {
                                courses: {
                                    where: { isPublished: true }
                                }
                            }
                        }
                    }
                });

                res.json({
                    success: true,
                    categories: categories.map(cat => ({
                        id: cat.id,
                        name: cat.name,
                        description: cat.description,
                        icon: cat.icon,
                        courseCount: cat._count.courses
                    }))
                });

            } catch (error) {
                logger.error('Get categories error:', error);
                res.status(500).json({
                    error: 'Internal server error',
                    message: 'Failed to retrieve categories'
                });
            }
        });

        // API documentation
        app.get('/api-docs', (req, res) => {
            res.json({
                service: 'Content Service',
                version: '1.0.0',
                description: 'Content management and delivery service for courses and lessons',
                developer: 'Quartermasters FZC',
                endpoints: {
                    courses: {
                        'GET /courses': 'Browse and search courses',
                        'GET /courses/featured': 'Get featured courses',
                        'GET /courses/:courseId': 'Get course details',
                        'POST /courses': 'Create new course (instructor/admin)',
                        'PUT /courses/:courseId': 'Update course (instructor/admin)',
                        'DELETE /courses/:courseId': 'Delete course (instructor/admin)'
                    },
                    lessons: {
                        'GET /courses/:courseId/modules/:moduleId/lessons': 'Get lessons in module',
                        'GET /lessons/:lessonId': 'Get lesson details',
                        'POST /lessons/:lessonId/progress': 'Update lesson progress',
                        'POST /courses/:courseId/modules/:moduleId/lessons': 'Create lesson (instructor)',
                        'PUT /lessons/:lessonId/content': 'Upload lesson content'
                    },
                    search: {
                        'GET /search': 'Search courses and content',
                        'GET /categories': 'Get course categories'
                    }
                },
                features: [
                    'Course catalog management',
                    'Lesson content delivery',
                    'Progress tracking',
                    'Multi-language content support',
                    'Media processing and optimization',
                    'Full-text search with Elasticsearch',
                    'Content versioning and AI generation support',
                    'FSI-aligned curriculum structure'
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
                await Promise.all([
                    prisma.$disconnect(),
                    redisClient.quit(),
                    mongoose.connection.close()
                ]);
                logger.info('All connections closed');
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
            logger.info(`🚀 Content Service started on port ${PORT}`);
            logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
            logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
            logger.info(`🔍 Search available at http://localhost:${PORT}/search`);
            logger.info(`🗂️  Categories available at http://localhost:${PORT}/categories`);
            logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
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

async function initializeElasticsearchIndices() {
    try {
        // Create courses index
        const coursesIndexExists = await elastic.indices.exists({ index: 'courses' });
        if (!coursesIndexExists) {
            await elastic.indices.create({
                index: 'courses',
                body: {
                    mappings: {
                        properties: {
                            title: { type: 'text', analyzer: 'standard' },
                            description: { type: 'text', analyzer: 'standard' },
                            shortDescription: { type: 'text', analyzer: 'standard' },
                            language: {
                                type: 'object',
                                properties: {
                                    code: { type: 'keyword' },
                                    name: { type: 'text' },
                                    nativeName: { type: 'text' }
                                }
                            },
                            category: { type: 'text' },
                            level: { type: 'keyword' },
                            fsiLevelMin: { type: 'float' },
                            fsiLevelMax: { type: 'float' },
                            tags: { type: 'keyword' },
                            instructor: { type: 'text' },
                            isPublished: { type: 'boolean' },
                            createdAt: { type: 'date' }
                        }
                    }
                }
            });
            logger.info('Elasticsearch courses index created');
        }

        // Create lessons index
        const lessonsIndexExists = await elastic.indices.exists({ index: 'lessons' });
        if (!lessonsIndexExists) {
            await elastic.indices.create({
                index: 'lessons',
                body: {
                    mappings: {
                        properties: {
                            title: { type: 'text', analyzer: 'standard' },
                            description: { type: 'text', analyzer: 'standard' },
                            content: { type: 'text', analyzer: 'standard' },
                            lessonType: { type: 'keyword' },
                            difficultyLevel: { type: 'integer' },
                            vocabularyFocus: { type: 'keyword' },
                            grammarFocus: { type: 'keyword' },
                            course: {
                                type: 'object',
                                properties: {
                                    id: { type: 'keyword' },
                                    title: { type: 'text' },
                                    language: { type: 'keyword' }
                                }
                            },
                            isPublished: { type: 'boolean' },
                            createdAt: { type: 'date' }
                        }
                    }
                }
            });
            logger.info('Elasticsearch lessons index created');
        }

    } catch (error) {
        logger.error('Failed to initialize Elasticsearch indices:', error);
        throw error;
    }
}

initializeServer();

export default app;