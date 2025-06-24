/**
 * Health Check Routes
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * Health monitoring endpoints for service status checks
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();
const redis = createClient({ url: process.env.REDIS_URL });

// =================================================================
// HEALTH CHECK ENDPOINTS
// =================================================================

/**
 * GET /health
 * Basic health check - service is running
 */
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Authentication Service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * GET /health/live
 * Kubernetes liveness probe - service is alive
 */
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /health/ready
 * Kubernetes readiness probe - service is ready to accept traffic
 */
router.get('/ready', async (req, res) => {
    const healthChecks = {
        database: false,
        redis: false,
        environment: false
    };

    let overall = 'healthy';

    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        healthChecks.database = true;
        logger.debug('Database health check: OK');
    } catch (error) {
        logger.error('Database health check failed:', error);
        overall = 'unhealthy';
    }

    try {
        // Check Redis connection
        if (!redis.isOpen) {
            await redis.connect();
        }
        await redis.ping();
        healthChecks.redis = true;
        logger.debug('Redis health check: OK');
    } catch (error) {
        logger.error('Redis health check failed:', error);
        overall = 'unhealthy';
    }

    // Check environment variables
    const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'REDIS_URL'];
    const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
    
    if (missingEnvVars.length === 0) {
        healthChecks.environment = true;
        logger.debug('Environment variables check: OK');
    } else {
        logger.error('Missing environment variables:', missingEnvVars);
        overall = 'unhealthy';
    }

    const statusCode = overall === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
        status: overall,
        timestamp: new Date().toISOString(),
        checks: healthChecks,
        ...(missingEnvVars.length > 0 && { missingEnvVars })
    });
});

/**
 * GET /health/detailed
 * Detailed health information with metrics
 */
router.get('/detailed', async (req, res) => {
    const startTime = Date.now();
    
    const healthData = {
        status: 'healthy',
        service: 'Authentication Service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        checks: {
            database: { status: 'unknown', responseTime: 0, error: null },
            redis: { status: 'unknown', responseTime: 0, error: null },
            environment: { status: 'unknown', missingVars: [] }
        },
        metrics: {
            activeConnections: 0,
            totalRequests: 0,
            errorRate: 0
        }
    };

    // Database health check with timing
    try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        healthData.checks.database = {
            status: 'healthy',
            responseTime: Date.now() - dbStart,
            error: null
        };
    } catch (error) {
        healthData.checks.database = {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: (error as Error).message
        };
        healthData.status = 'unhealthy';
    }

    // Redis health check with timing
    try {
        const redisStart = Date.now();
        if (!redis.isOpen) {
            await redis.connect();
        }
        await redis.ping();
        healthData.checks.redis = {
            status: 'healthy',
            responseTime: Date.now() - redisStart,
            error: null
        };

        // Get Redis info if possible
        try {
            const redisInfo = await redis.info();
            const connections = redisInfo.match(/connected_clients:(\d+)/);
            if (connections) {
                healthData.metrics.activeConnections = parseInt(connections[1]);
            }
        } catch (infoError) {
            logger.debug('Could not get Redis info:', infoError);
        }
    } catch (error) {
        healthData.checks.redis = {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: (error as Error).message
        };
        healthData.status = 'unhealthy';
    }

    // Environment variables check
    const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'REDIS_URL'];
    const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
    
    healthData.checks.environment = {
        status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
        responseTime: 0,
        error: missingEnvVars.length > 0 ? 'Missing environment variables' : null
    };

    if (missingEnvVars.length > 0) {
        (healthData.checks.environment as any).missingVars = missingEnvVars;
        healthData.status = 'unhealthy';
    }

    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
});

/**
 * GET /health/database
 * Database-specific health check
 */
router.get('/database', async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        
        // Get database stats
        const userCount = await prisma.user.count();
        const languageCount = await prisma.language.count();
        
        const responseTime = Date.now() - startTime;

        res.json({
            status: 'healthy',
            database: 'postgresql',
            responseTime,
            timestamp: new Date().toISOString(),
            stats: {
                users: userCount,
                languages: languageCount
            }
        });
    } catch (error) {
        logger.error('Database health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            database: 'postgresql',
            error: (error as Error).message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /health/redis
 * Redis-specific health check
 */
router.get('/redis', async (req, res) => {
    try {
        const startTime = Date.now();
        
        if (!redis.isOpen) {
            await redis.connect();
        }
        
        // Test Redis connection
        const pong = await redis.ping();
        
        // Get Redis info
        const info = await redis.info();
        const responseTime = Date.now() - startTime;

        // Parse useful info from Redis INFO
        const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
        const uptime = info.match(/uptime_in_seconds:(\d+)/)?.[1];
        const memory = info.match(/used_memory_human:([^\r\n]+)/)?.[1];
        const connections = info.match(/connected_clients:(\d+)/)?.[1];

        res.json({
            status: 'healthy',
            service: 'redis',
            responseTime,
            timestamp: new Date().toISOString(),
            ping: pong,
            stats: {
                version,
                uptime: uptime ? parseInt(uptime) : null,
                memory,
                connections: connections ? parseInt(connections) : null
            }
        });
    } catch (error) {
        logger.error('Redis health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            service: 'redis',
            error: (error as Error).message,
            timestamp: new Date().toISOString()
        });
    }
});

export { router as healthRoutes };