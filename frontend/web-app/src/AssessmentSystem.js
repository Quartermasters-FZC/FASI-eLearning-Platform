import React, { useState, useEffect } from 'react';

// Mock data for assessments and certifications
const mockAssessments = {
  available: [
    {
      id: 1,
      title: "Urdu Proficiency Assessment",
      type: "proficiency",
      level: "Intermediate",
      duration: 90,
      sections: ["Speaking", "Listening", "Reading", "Writing"],
      description: "Comprehensive assessment of Urdu language skills for diplomatic personnel",
      passingScore: 80,
      attempts: 3,
      validFor: 365,
      certificationEligible: true
    },
    {
      id: 2,
      title: "Cultural Competency Evaluation",
      type: "cultural",
      level: "Advanced",
      duration: 60,
      sections: ["Cultural Awareness", "Protocol Knowledge", "Communication Styles"],
      description: "Assessment of cultural understanding and diplomatic protocol knowledge",
      passingScore: 85,
      attempts: 2,
      validFor: 730,
      certificationEligible: true
    },
    {
      id: 3,
      title: "Business Communication Skills",
      type: "communication",
      level: "Professional",
      duration: 45,
      sections: ["Formal Writing", "Presentation Skills", "Negotiation"],
      description: "Evaluation of professional communication abilities in diplomatic contexts",
      passingScore: 75,
      attempts: 3,
      validFor: 365,
      certificationEligible: false
    }
  ],
  completed: [
    {
      id: 4,
      title: "Basic Urdu Conversation",
      type: "proficiency",
      level: "Beginner",
      completedDate: "2024-06-15",
      score: 88,
      passingScore: 70,
      status: "passed",
      certificationIssued: true,
      validUntil: "2025-06-15",
      instructor: "Dr. Fatima Khan"
    },
    {
      id: 5,
      title: "Diplomatic Etiquette",
      type: "cultural",
      level: "Intermediate",
      completedDate: "2024-06-10",
      score: 92,
      passingScore: 80,
      status: "passed",
      certificationIssued: true,
      validUntil: "2026-06-10",
      instructor: "Prof. Ahmed Hassan"
    }
  ],
  inProgress: [
    {
      id: 6,
      title: "Advanced Urdu Literature",
      type: "proficiency",
      level: "Advanced",
      startedDate: "2024-06-20",
      progress: 65,
      timeRemaining: 45,
      nextSection: "Poetry Analysis",
      instructor: "Dr. Maria Rodriguez"
    }
  ]
};

const mockCertifications = [
  {
    id: 1,
    name: "FSI Urdu Language Proficiency",
    level: "Intermediate (S-2/R-2)",
    issueDate: "2024-06-15",
    expiryDate: "2025-06-15",
    status: "active",
    credentialId: "FSI-URD-2024-001234",
    issuer: "Foreign Service Institute",
    verificationUrl: "https://fsi.state.gov/verify/001234",
    requirements: ["Proficiency Assessment", "Oral Interview", "Cultural Competency"],
    digitalBadge: true
  },
  {
    id: 2,
    name: "Diplomatic Protocol Certification",
    level: "Advanced",
    issueDate: "2024-06-10",
    expiryDate: "2026-06-10",
    status: "active",
    credentialId: "DPC-2024-567890",
    issuer: "Diplomatic Training Institute",
    verificationUrl: "https://dti.state.gov/verify/567890",
    requirements: ["Cultural Assessment", "Protocol Knowledge", "Communication Skills"],
    digitalBadge: true
  },
  {
    id: 3,
    name: "Business Urdu Communication",
    level: "Professional",
    issueDate: "2024-05-20",
    expiryDate: "2025-05-20",
    status: "expiring_soon",
    credentialId: "BUC-2024-789012",
    issuer: "Professional Language Institute",
    verificationUrl: "https://pli.edu/verify/789012",
    requirements: ["Business Communication Assessment", "Industry Knowledge"],
    digitalBadge: false
  }
];

const mockPerformanceAnalytics = {
  overallScore: 86.5,
  trending: "up",
  assessmentCount: 12,
  certificationCount: 3,
  strengths: ["Speaking", "Cultural Awareness", "Protocol Knowledge"],
  improvementAreas: ["Advanced Grammar", "Technical Writing", "Formal Presentations"],
  monthlyProgress: [
    { month: "Jan", score: 78 },
    { month: "Feb", score: 81 },
    { month: "Mar", score: 83 },
    { month: "Apr", score: 85 },
    { month: "May", score: 86 },
    { month: "Jun", score: 87 }
  ],
  skillBreakdown: [
    { skill: "Speaking", score: 92, improvement: "+5%" },
    { skill: "Listening", score: 89, improvement: "+3%" },
    { skill: "Reading", score: 84, improvement: "+2%" },
    { skill: "Writing", score: 81, improvement: "+7%" },
    { skill: "Culture", score: 95, improvement: "+1%" },
    { skill: "Protocol", score: 88, improvement: "+4%" }
  ]
};

// Assessment Dashboard Component
export const AssessmentDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('available');
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const renderAvailableAssessments = () => (
    <div className="assessments-grid">
      {mockAssessments.available.map(assessment => (
        <div key={assessment.id} className="assessment-card">
          <div className="assessment-header">
            <h4>{assessment.title}</h4>
            <span className={`level-badge ${assessment.level.toLowerCase()}`}>
              {assessment.level}
            </span>
          </div>
          <div className="assessment-details">
            <p>{assessment.description}</p>
            <div className="assessment-meta">
              <div className="meta-item">
                <span className="meta-label">Duration:</span>
                <span>{assessment.duration} minutes</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Passing Score:</span>
                <span>{assessment.passingScore}%</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Attempts:</span>
                <span>{assessment.attempts} remaining</span>
              </div>
            </div>
            <div className="assessment-sections">
              <span className="sections-label">Sections:</span>
              <div className="sections-list">
                {assessment.sections.map((section, index) => (
                  <span key={index} className="section-tag">{section}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="assessment-actions">
            <button 
              className="btn secondary"
              onClick={() => setSelectedAssessment(assessment)}
            >
              View Details
            </button>
            <button className="btn primary">
              Start Assessment
            </button>
          </div>
          {assessment.certificationEligible && (
            <div className="certification-eligible">
              <span className="cert-icon">🏆</span>
              <span>Certification Eligible</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderCompletedAssessments = () => (
    <div className="completed-assessments">
      {mockAssessments.completed.map(assessment => (
        <div key={assessment.id} className="completed-assessment-card">
          <div className="assessment-info">
            <h4>{assessment.title}</h4>
            <p>Completed on {assessment.completedDate}</p>
            <p>Instructor: {assessment.instructor}</p>
          </div>
          <div className="score-display">
            <div className={`score-circle ${assessment.status}`}>
              <span className="score-number">{assessment.score}%</span>
              <span className="score-label">Score</span>
            </div>
            <div className="passing-score">
              Passing: {assessment.passingScore}%
            </div>
          </div>
          <div className="assessment-status">
            <span className={`status-badge ${assessment.status}`}>
              {assessment.status === 'passed' ? 'PASSED' : 'FAILED'}
            </span>
            {assessment.certificationIssued && (
              <span className="cert-badge">Certificate Issued</span>
            )}
          </div>
          <div className="assessment-actions">
            <button className="btn secondary">View Report</button>
            <button className="btn primary">Retake</button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderInProgressAssessments = () => (
    <div className="in-progress-assessments">
      {mockAssessments.inProgress.map(assessment => (
        <div key={assessment.id} className="progress-assessment-card">
          <div className="assessment-info">
            <h4>{assessment.title}</h4>
            <p>Started on {assessment.startedDate}</p>
            <p>Instructor: {assessment.instructor}</p>
          </div>
          <div className="progress-display">
            <div className="progress-circle">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${assessment.progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{assessment.progress}%</span>
            </div>
            <div className="next-section">
              <span>Next: {assessment.nextSection}</span>
              <span>{assessment.timeRemaining} min remaining</span>
            </div>
          </div>
          <div className="assessment-actions">
            <button className="btn primary">Continue</button>
            <button className="btn secondary">Save & Exit</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="assessment-dashboard">
      <div className="dashboard-header">
        <h2>Language Assessment Center</h2>
        <p>Track your progress and earn certifications</p>
      </div>

      <div className="assessment-tabs">
        <button 
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available ({mockAssessments.available.length})
        </button>
        <button 
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({mockAssessments.completed.length})
        </button>
        <button 
          className={`tab ${activeTab === 'in-progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in-progress')}
        >
          In Progress ({mockAssessments.inProgress.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'available' && renderAvailableAssessments()}
        {activeTab === 'completed' && renderCompletedAssessments()}
        {activeTab === 'in-progress' && renderInProgressAssessments()}
      </div>
    </div>
  );
};

// Certification Management Component
export const CertificationManagement = ({ user }) => {
  const [selectedCert, setSelectedCert] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'expiring_soon': return '#f59e0b';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="certification-management">
      <div className="dashboard-header">
        <h2>My Certifications</h2>
        <p>Manage your professional language certifications</p>
      </div>

      <div className="certifications-grid">
        {mockCertifications.map(cert => (
          <div key={cert.id} className="certification-card">
            <div className="cert-header">
              <h4>{cert.name}</h4>
              <span 
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(cert.status) }}
              ></span>
            </div>
            
            <div className="cert-details">
              <div className="cert-level">
                <span className="level-badge">{cert.level}</span>
              </div>
              
              <div className="cert-dates">
                <div className="date-item">
                  <span className="date-label">Issued:</span>
                  <span>{cert.issueDate}</span>
                </div>
                <div className="date-item">
                  <span className="date-label">Expires:</span>
                  <span>{cert.expiryDate}</span>
                </div>
              </div>

              <div className="cert-issuer">
                <span className="issuer-label">Issued by:</span>
                <span>{cert.issuer}</span>
              </div>

              <div className="cert-id">
                <span className="id-label">Credential ID:</span>
                <span className="credential-id">{cert.credentialId}</span>
              </div>
            </div>

            <div className="cert-requirements">
              <span className="req-label">Requirements Met:</span>
              <ul className="requirements-list">
                {cert.requirements.map((req, index) => (
                  <li key={index} className="requirement-item">
                    <span className="check-mark">✓</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="cert-actions">
              <button className="btn secondary">
                View Certificate
              </button>
              <button className="btn primary">
                Verify Online
              </button>
              {cert.digitalBadge && (
                <button className="btn badge-btn">
                  Download Badge
                </button>
              )}
            </div>

            {cert.status === 'expiring_soon' && (
              <div className="expiry-warning">
                <span className="warning-icon">⚠️</span>
                <span>Expires in 30 days - Renewal recommended</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="certification-actions">
        <button className="btn primary large">
          Browse Available Certifications
        </button>
        <button className="btn secondary large">
          Request Custom Certification
        </button>
      </div>
    </div>
  );
};

// Performance Analytics Component
export const PerformanceAnalytics = ({ user }) => {
  const [timeframe, setTimeframe] = useState('6months');

  return (
    <div className="performance-analytics">
      <div className="dashboard-header">
        <h2>Performance Analytics</h2>
        <p>Track your learning progress and identify areas for improvement</p>
      </div>

      <div className="analytics-controls">
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="timeframe-selector"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      <div className="analytics-overview">
        <div className="overview-card">
          <div className="metric-value">{mockPerformanceAnalytics.overallScore}</div>
          <div className="metric-label">Overall Score</div>
          <div className={`trend ${mockPerformanceAnalytics.trending}`}>
            {mockPerformanceAnalytics.trending === 'up' ? '↗️' : '↘️'} Trending {mockPerformanceAnalytics.trending}
          </div>
        </div>
        
        <div className="overview-card">
          <div className="metric-value">{mockPerformanceAnalytics.assessmentCount}</div>
          <div className="metric-label">Assessments Completed</div>
        </div>
        
        <div className="overview-card">
          <div className="metric-value">{mockPerformanceAnalytics.certificationCount}</div>
          <div className="metric-label">Active Certifications</div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-section">
          <h3>Monthly Progress Trend</h3>
          <div className="progress-chart">
            {mockPerformanceAnalytics.monthlyProgress.map((month, index) => (
              <div key={index} className="chart-bar">
                <div 
                  className="bar-fill" 
                  style={{ height: `${month.score}%` }}
                ></div>
                <span className="bar-label">{month.month}</span>
                <span className="bar-value">{month.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="skills-breakdown">
          <h3>Skills Performance Breakdown</h3>
          <div className="skills-list">
            {mockPerformanceAnalytics.skillBreakdown.map((skill, index) => (
              <div key={index} className="skill-item">
                <div className="skill-info">
                  <span className="skill-name">{skill.skill}</span>
                  <span className="skill-improvement">{skill.improvement}</span>
                </div>
                <div className="skill-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${skill.score}%` }}
                    ></div>
                  </div>
                  <span className="skill-score">{skill.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="insights-section">
        <div className="strengths-section">
          <h3>Your Strengths</h3>
          <div className="strength-tags">
            {mockPerformanceAnalytics.strengths.map((strength, index) => (
              <span key={index} className="strength-tag">{strength}</span>
            ))}
          </div>
        </div>

        <div className="improvement-section">
          <h3>Areas for Improvement</h3>
          <div className="improvement-tags">
            {mockPerformanceAnalytics.improvementAreas.map((area, index) => (
              <span key={index} className="improvement-tag">{area}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="recommendations">
        <h3>Personalized Recommendations</h3>
        <div className="recommendation-cards">
          <div className="recommendation-card">
            <h4>Advanced Grammar Course</h4>
            <p>Based on your assessment results, this course will help strengthen your grammar skills.</p>
            <button className="btn primary">Enroll Now</button>
          </div>
          <div className="recommendation-card">
            <h4>Technical Writing Workshop</h4>
            <p>Improve your professional writing skills with this specialized workshop.</p>
            <button className="btn primary">Learn More</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Assessment Taking Interface Component
export const AssessmentInterface = ({ assessmentId, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(5400); // 90 minutes in seconds

  // Mock questions for demonstration
  const mockQuestions = [
    {
      id: 1,
      type: "multiple_choice",
      section: "Speaking",
      question: "What is the most appropriate greeting for a formal diplomatic meeting?",
      options: [
        "السلام علیکم (Assalamu Alaikum)",
        "آداب (Aadab)",  
        "نمسکار (Namaskaar)",
        "ہیلو (Hello)"
      ],
      correct: 1,
      points: 5
    },
    {
      id: 2,
      type: "audio_response",
      section: "Speaking",
      question: "Record yourself introducing your diplomatic role in Urdu (2 minutes maximum)",
      instructions: "Speak clearly and use formal language appropriate for diplomatic settings",
      maxDuration: 120,
      points: 15
    },
    {
      id: 3,
      type: "text_input",
      section: "Writing",
      question: "Write a formal diplomatic correspondence in Urdu regarding trade discussions",
      placeholder: "یہاں اپنا جواب لکھیں...",
      minWords: 150,
      points: 20
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          onComplete(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitAssessment = () => {
    onComplete(answers);
  };

  const question = mockQuestions[currentQuestion];

  const renderQuestion = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="question-content">
            <h3>{question.question}</h3>
            <div className="options-list">
              {question.options.map((option, index) => (
                <label key={index} className="option-label">
                  <input 
                    type="radio" 
                    name={`question_${question.id}`}
                    value={index}
                    checked={answers[question.id] === index}
                    onChange={() => handleAnswer(question.id, index)}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'audio_response':
        return (
          <div className="question-content">
            <h3>{question.question}</h3>
            <p className="instructions">{question.instructions}</p>
            <div className="audio-recorder">
              <button className="btn record-btn">
                🎤 Start Recording
              </button>
              <div className="recording-controls">
                <span>Max Duration: {question.maxDuration}s</span>
              </div>
            </div>
          </div>
        );

      case 'text_input':
        return (
          <div className="question-content">
            <h3>{question.question}</h3>
            <textarea 
              className="text-response"
              placeholder={question.placeholder}
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              rows="10"
            />
            <div className="word-count">
              Words: {(answers[question.id] || '').split(' ').filter(w => w).length} / {question.minWords} minimum
            </div>
          </div>
        );

      default:
        return <div>Question type not supported</div>;
    }
  };

  return (
    <div className="assessment-interface">
      <div className="assessment-header">
        <div className="progress-info">
          <span>Question {currentQuestion + 1} of {mockQuestions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestion + 1) / mockQuestions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="timer">
          <span className="time-label">Time Remaining:</span>
          <span className="time-value">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      <div className="question-section">
        <div className="section-badge">{question.section}</div>
        <div className="points-badge">{question.points} points</div>
        {renderQuestion()}
      </div>

      <div className="navigation-controls">
        <button 
          className="btn secondary"
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
        >
          Previous
        </button>
        
        <div className="question-indicators">
          {mockQuestions.map((_, index) => (
            <button
              key={index}
              className={`question-indicator ${index === currentQuestion ? 'current' : ''} ${answers[mockQuestions[index].id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestion < mockQuestions.length - 1 ? (
          <button 
            className="btn primary"
            onClick={nextQuestion}
          >
            Next
          </button>
        ) : (
          <button 
            className="btn primary submit-btn"
            onClick={submitAssessment}
          >
            Submit Assessment
          </button>
        )}
      </div>
    </div>
  );
};