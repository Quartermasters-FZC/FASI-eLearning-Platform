import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Diplomatic Language Platform - API Gateway', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Platform info endpoint
app.get('/', (req, res) => {
  res.json({
    platform: '🏛️ Diplomatic Language Platform',
    description: 'AI-Powered Language & Cultural Training for American Diplomatic Community',
    version: '1.0.0',
    services: {
      auth: '/api/auth',
      users: '/api/users', 
      content: '/api/content',
      ai: {
        speech: '/api/ai/speech',
        nlp: '/api/ai/nlp',
        translation: '/api/ai/translation'
      }
    },
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Service proxies
app.use('/api/auth', createProxyMiddleware({
  target: 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' }
}));

app.use('/api/users', createProxyMiddleware({
  target: 'http://user-service:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' }
}));

app.use('/api/content', createProxyMiddleware({
  target: 'http://content-service:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/content': '' }
}));

app.use('/api/ai/speech', createProxyMiddleware({
  target: 'http://speech-service:8001',
  changeOrigin: true,
  pathRewrite: { '^/api/ai/speech': '' }
}));

app.use('/api/ai/nlp', createProxyMiddleware({
  target: 'http://nlp-service:8002',
  changeOrigin: true,
  pathRewrite: { '^/api/ai/nlp': '' }
}));

app.use('/api/ai/translation', createProxyMiddleware({
  target: 'http://translation-service:8003',
  changeOrigin: true,
  pathRewrite: { '^/api/ai/translation': '' }
}));

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🏛️ Diplomatic Language Platform - Gateway Service`);
});