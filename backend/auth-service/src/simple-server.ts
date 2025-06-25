import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Diplomatic Language Platform - Authentication Service', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: '🔐 Authentication Service',
    description: 'Secure authentication for diplomatic personnel',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      login: '/api/login',
      register: '/api/register',
      profile: '/api/profile'
    },
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Mock authentication endpoints for testing
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication logic
  if (email && password) {
    res.json({
      success: true,
      user: {
        id: 1,
        email: email,
        name: 'Diplomatic User',
        role: 'diplomat',
        clearanceLevel: 'SECRET',
        department: 'State Department'
      },
      token: 'mock-jwt-token-' + Date.now(),
      message: 'Authentication successful'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }
});

app.post('/api/register', (req, res) => {
  const { email, password, name, department } = req.body;
  
  if (email && password && name) {
    res.json({
      success: true,
      user: {
        id: Date.now(),
        email: email,
        name: name,
        department: department || 'State Department',
        role: 'diplomat',
        status: 'pending_verification'
      },
      message: 'Registration successful - pending security clearance verification'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email, password, and name are required'
    });
  }
});

app.get('/api/profile', (req, res) => {
  res.json({
    user: {
      id: 1,
      email: 'diplomat@state.gov',
      name: 'Diplomatic User',
      role: 'diplomat',
      clearanceLevel: 'SECRET',
      department: 'State Department',
      languages: ['English', 'Urdu', 'Arabic'],
      lastLogin: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`🔐 Authentication Service running on port ${PORT}`);
  console.log(`🏛️ Diplomatic Language Platform - Auth Service`);
});