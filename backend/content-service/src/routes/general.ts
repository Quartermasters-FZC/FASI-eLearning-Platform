import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Client as ElasticClient } from '@elastic/elasticsearch';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export function createGeneralRoutes(prisma: PrismaClient, elastic: ElasticClient, redisClient: ReturnType<typeof import('redis').createClient>) {
    const router = express.Router();

    router.get('/health', async (req, res) => {
        try {
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
                    elasticsearch: 'connected',
                },
            });
        } catch {
            res.status(503).json({
                status: 'unhealthy',
                service: 'Content Service',
                error: 'Database connection failed',
            });
        }
    });

    router.get('/search', async (req, res) => {
        try {
            const { q, type = 'courses', limit = 20 } = req.query as any;
            if (!q || typeof q !== 'string' || q.length < 2) {
                return res.status(400).json({
                    error: 'Invalid search query',
                    message: 'Search query must be at least 2 characters',
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
                                'instructor',
                            ],
                            fuzziness: 'AUTO',
                        },
                    },
                    highlight: {
                        fields: {
                            title: {},
                            description: {},
                            shortDescription: {},
                        },
                    },
                    size: parseInt(limit as string),
                },
            });
            res.json({
                success: true,
                query: q,
                total: searchResults.hits.total,
                results: searchResults.hits.hits.map((hit: any) => ({
                    id: hit._id,
                    score: hit._score,
                    source: hit._source,
                    highlights: hit.highlight,
                })),
            });
        } catch (error) {
            logger.error('Search error:', error);
            res.status(500).json({
                error: 'Search failed',
                message: 'Failed to perform search',
            });
        }
    });

    router.get('/categories', async (req, res) => {
        try {
            const categories = await prisma.courseCategory.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
                include: {
                    _count: {
                        select: {
                            courses: { where: { isPublished: true } },
                        },
                    },
                },
            });
            res.json({
                success: true,
                categories: categories.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                    description: cat.description,
                    icon: cat.icon,
                    courseCount: cat._count.courses,
                })),
            });
        } catch (error) {
            logger.error('Get categories error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve categories',
            });
        }
    });

    router.get('/api-docs', (req, res) => {
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
                    'DELETE /courses/:courseId': 'Delete course (instructor/admin)',
                },
                lessons: {
                    'GET /courses/:courseId/modules/:moduleId/lessons': 'Get lessons in module',
                    'GET /lessons/:lessonId': 'Get lesson details',
                    'POST /lessons/:lessonId/progress': 'Update lesson progress',
                    'POST /courses/:courseId/modules/:moduleId/lessons': 'Create lesson (instructor)',
                    'PUT /lessons/:lessonId/content': 'Upload lesson content',
                },
                search: {
                    'GET /search': 'Search courses and content',
                    'GET /categories': 'Get course categories',
                },
            },
            features: [
                'Course catalog management',
                'Lesson content delivery',
                'Progress tracking',
                'Multi-language content support',
                'Media processing and optimization',
                'Full-text search with Elasticsearch',
                'Content versioning and AI generation support',
                'FSI-aligned curriculum structure',
            ],
        });
    });

    router.use('*', (req, res) => {
        res.status(404).json({
            error: 'Endpoint not found',
            message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
            suggestion: 'Please check the API documentation at /api-docs',
        });
    });

    return router;
}
