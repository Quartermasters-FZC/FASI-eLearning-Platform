const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to the backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding to backend
      },
      logLevel: 'warn', // Reduce logging noise
    })
  );

  // Handle WebSocket connections for development hot reload
  // This prevents WebSocket connection errors by properly configuring the proxy
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'ws://localhost:3100',
      ws: true, // Enable WebSocket proxy
      changeOrigin: true,
      logLevel: 'warn',
      onError: (err, req, res) => {
        // Silently handle WebSocket errors to prevent console spam
        console.warn('WebSocket proxy error (this is expected in development):', err.message);
      },
    })
  );
};