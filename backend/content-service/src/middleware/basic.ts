import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import { logger } from '../utils/logger';

export function applyBasicMiddleware(app: express.Application): void {
    app.use(cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:3100',
                'http://localhost:3200',
                process.env.FRONTEND_URL,
                process.env.ADMIN_URL,
            ].filter(Boolean);
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    app.use(compression());

    app.use(morgan('combined', {
        stream: {
            write: (message: string) => logger.info(message.trim()),
        },
    }));

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
}
