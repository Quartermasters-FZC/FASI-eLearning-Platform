const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Diplomatic Language Platform - Content Service', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: '📚 Content Management Service',
    description: 'Language courses and cultural training content for diplomatic personnel',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      courses: '/api/courses',
      lessons: '/api/lessons',
      cultural: '/api/cultural',
      assessments: '/api/assessments'
    },
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Mock content management endpoints
app.get('/api/courses', (req, res) => {
  res.json({
    courses: [
      {
        id: 1,
        title: 'Diplomatic Urdu for Embassy Staff',
        language: 'Urdu',
        level: 'Intermediate',
        duration: '120 hours',
        description: 'Comprehensive Urdu language training focused on diplomatic protocols and cultural sensitivity',
        modules: [
          'Basic Diplomatic Phrases',
          'Government Terminology',
          'Cultural Etiquette',
          'Business Meetings',
          'Religious Sensitivity'
        ],
        region: 'South Asia',
        clearanceRequired: 'SECRET',
        instructor: 'Dr. Fatima Khan, FSI Certified',
        enrollment: 45,
        rating: 4.8
      },
      {
        id: 2,
        title: 'Arabic Cultural Immersion',
        language: 'Arabic',
        level: 'Advanced',
        duration: '160 hours',
        description: 'Deep cultural understanding and advanced Arabic for Middle East assignments',
        modules: [
          'Classical vs Modern Arabic',
          'Regional Dialects',
          'Islamic Cultural Context',
          'Negotiation Techniques',
          'Media Terminology'
        ],
        region: 'Middle East',
        clearanceRequired: 'TOP SECRET',
        instructor: 'Ambassador Ahmed Al-Rashid',
        enrollment: 23,
        rating: 4.9
      },
      {
        id: 3,
        title: 'Mandarin for Trade Relations',
        language: 'Mandarin',
        level: 'Beginner',
        duration: '200 hours',
        description: 'Essential Mandarin skills for economic and trade diplomatic missions',
        modules: [
          'Business Mandarin',
          'Economic Terminology',
          'Formal vs Informal Speech',
          'Cultural Protocols',
          'Trade Negotiations'
        ],
        region: 'East Asia',
        clearanceRequired: 'SECRET',
        instructor: 'Dr. Li Wei, Beijing University',
        enrollment: 67,
        rating: 4.7
      }
    ],
    total: 24,
    categories: ['Critical Languages', 'Cultural Training', 'Specialized Courses']
  });
});

app.get('/api/lessons/:courseId', (req, res) => {
  const courseId = req.params.courseId;
  res.json({
    courseId: courseId,
    lessons: [
      {
        id: 1,
        title: 'Introduction to Diplomatic Protocol',
        type: 'video',
        duration: '45 minutes',
        content: 'Basic greetings and formal address in diplomatic contexts',
        resources: ['Video lecture', 'Audio pronunciation', 'Cultural notes'],
        completed: true
      },
      {
        id: 2,
        title: 'Government Terminology Practice',
        type: 'interactive',
        duration: '30 minutes',
        content: 'Key government and political terms with pronunciation guide',
        resources: ['Flashcards', 'Audio exercises', 'Quiz'],
        completed: true
      },
      {
        id: 3,
        title: 'Cultural Sensitivity Workshop',
        type: 'workshop',
        duration: '90 minutes',
        content: 'Understanding cultural nuances in diplomatic communication',
        resources: ['Case studies', 'Role-play scenarios', 'Expert interviews'],
        completed: false
      }
    ]
  });
});

app.get('/api/cultural', (req, res) => {
  res.json({
    culturalModules: [
      {
        region: 'South Asia',
        topics: [
          'Religious Practices and Holidays',
          'Business Etiquette',
          'Family Structure and Values',
          'Communication Styles',
          'Historical Context'
        ],
        sensitivity: 'HIGH',
        lastUpdated: '2024-06-15'
      },
      {
        region: 'Middle East',
        topics: [
          'Islamic Cultural Framework',
          'Tribal and Family Dynamics',
          'Hospitality Customs',
          'Political Sensitivities',
          'Economic Structures'
        ],
        sensitivity: 'CRITICAL',
        lastUpdated: '2024-06-10'
      },
      {
        region: 'East Asia',
        topics: [
          'Hierarchical Relationships',
          'Concept of Face and Honor',
          'Business Protocol',
          'Gift-Giving Customs',
          'Philosophical Influences'
        ],
        sensitivity: 'HIGH',
        lastUpdated: '2024-06-20'
      }
    ]
  });
});

app.get('/api/assessments', (req, res) => {
  res.json({
    assessments: [
      {
        type: 'Oral Proficiency',
        language: 'Urdu',
        level: 'ILR 2+',
        nextScheduled: '2024-07-15',
        estimatedDuration: '45 minutes',
        format: 'Video conference with certified examiner'
      },
      {
        type: 'Cultural Competency',
        region: 'South Asia',
        level: 'Advanced',
        nextScheduled: '2024-07-20',
        estimatedDuration: '60 minutes',
        format: 'Scenario-based evaluation'
      },
      {
        type: 'Written Proficiency',
        language: 'Arabic',
        level: 'ILR 1+',
        nextScheduled: '2024-07-25',
        estimatedDuration: '90 minutes',
        format: 'Secure online examination'
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`📚 Content Service running on port ${PORT}`);
  console.log(`🏛️ Diplomatic Language Platform - Content Service`);
});