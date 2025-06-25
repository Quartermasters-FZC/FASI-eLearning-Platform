const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3100', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Diplomatic Language Platform - API Gateway', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    routes: [
      '/api/auth - Authentication Service',
      '/api/users - User Management Service', 
      '/api/content - Content Management Service'
    ]
  });
});

// Platform info endpoint
app.get('/api/status', (req, res) => {
  res.json({
    platform: '🏛️ Diplomatic Language Platform',
    description: 'AI-Powered Language & Cultural Training for American Diplomatic Community',
    version: '1.0.0',
    services: {
      auth: 'http://localhost:3001',
      users: 'http://localhost:3002', 
      content: 'http://localhost:3003'
    },
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Service proxies
app.use('/api/auth', createProxyMiddleware({
  target: 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api' }
}));

app.use('/api/users', createProxyMiddleware({
  target: 'http://user-service:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/api' }
}));

app.use('/api/content', createProxyMiddleware({
  target: 'http://content-service:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/content': '/api' }
}));

// Catch-all route for undefined endpoints
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'This is the Diplomatic Language Platform API Gateway',
    availableRoutes: [
      'GET /health - Gateway health check',
      'GET /api/status - Platform status',
      'POST /api/auth/login - Authentication',
      'GET /api/users/profile - User profile',
      'GET /api/content/courses - Available courses'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🏛️ Diplomatic Language Platform - Gateway Service`);
  console.log(`📍 Health check available at: http://localhost:${PORT}/health`);
});