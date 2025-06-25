const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Diplomatic Language Platform - User Service', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: '👥 User Management Service',
    description: 'User profile and language progress management for diplomatic personnel',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      profile: '/api/profile',
      languages: '/api/languages',
      progress: '/api/progress',
      preferences: '/api/preferences'
    },
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Mock user management endpoints
app.get('/api/profile', (req, res) => {
  res.json({
    user: {
      id: 1,
      email: 'diplomat@state.gov',
      name: 'Ambassador Sarah Wilson',
      title: 'Cultural Attaché',
      department: 'State Department',
      clearanceLevel: 'SECRET',
      languages: {
        native: 'English',
        learning: ['Urdu', 'Arabic', 'Mandarin'],
        proficiency: {
          'Urdu': 'Intermediate',
          'Arabic': 'Beginner',
          'Mandarin': 'Advanced'
        }
      },
      assignment: {
        location: 'Embassy Islamabad',
        startDate: '2024-01-15',
        duration: '2 years'
      },
      lastLogin: new Date().toISOString()
    }
  });
});

app.get('/api/languages', (req, res) => {
  res.json({
    available: [
      { code: 'ur', name: 'Urdu', region: 'South Asia', difficulty: 'Hard' },
      { code: 'ar', name: 'Arabic', region: 'Middle East', difficulty: 'Very Hard' },
      { code: 'zh', name: 'Mandarin Chinese', region: 'East Asia', difficulty: 'Very Hard' },
      { code: 'fa', name: 'Persian/Farsi', region: 'Middle East', difficulty: 'Hard' },
      { code: 'ru', name: 'Russian', region: 'Eastern Europe', difficulty: 'Hard' },
      { code: 'ko', name: 'Korean', region: 'East Asia', difficulty: 'Hard' },
      { code: 'ja', name: 'Japanese', region: 'East Asia', difficulty: 'Very Hard' },
      { code: 'hi', name: 'Hindi', region: 'South Asia', difficulty: 'Hard' }
    ],
    total: 73,
    categories: ['Critical Languages', 'Regional Languages', 'Business Languages']
  });
});

app.get('/api/progress', (req, res) => {
  res.json({
    overall: {
      coursesCompleted: 12,
      totalCourses: 24,
      hoursStudied: 156,
      currentStreak: 15,
      proficiencyGain: '+2 levels this quarter'
    },
    languages: {
      'Urdu': {
        level: 'Intermediate',
        progress: 65,
        modules: {
          'Basic Conversation': 100,
          'Cultural Awareness': 85,
          'Business Terminology': 45,
          'Government Relations': 20
        },
        nextMilestone: 'Advanced Conversation'
      },
      'Arabic': {
        level: 'Beginner',
        progress: 30,
        modules: {
          'Alphabet & Pronunciation': 100,
          'Basic Phrases': 60,
          'Cultural Context': 25,
          'Religious Terminology': 5
        },
        nextMilestone: 'Intermediate Reading'
      }
    }
  });
});

app.get('/api/preferences', (req, res) => {
  res.json({
    preferences: {
      studyTime: 'morning',
      difficultyLevel: 'adaptive',
      culturalFocus: 'high',
      practiceMode: 'immersive',
      notifications: true,
      culturalSensitivity: 'maximum'
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      audioSpeed: 'normal',
      captionsEnabled: true
    }
  });
});

app.listen(PORT, () => {
  console.log(`👥 User Service running on port ${PORT}`);
  console.log(`🏛️ Diplomatic Language Platform - User Service`);
});