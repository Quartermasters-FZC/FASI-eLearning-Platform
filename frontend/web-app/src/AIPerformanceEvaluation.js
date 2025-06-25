import React, { useState, useEffect } from 'react';

// Mock AI Performance Data
const mockAIAnalysis = {
  studentProfile: {
    learningStyle: "Visual-Kinesthetic",
    currentLevel: "Intermediate (ILR 2+)",
    progressRate: "Above Average",
    strengths: ["Cultural Awareness", "Pronunciation", "Listening Comprehension"],
    challenges: ["Grammar Complexity", "Formal Writing", "Technical Vocabulary"],
    motivation: "High",
    consistency: "Consistent",
    preferredTimeOfDay: "Morning (9-11 AM)"
  },
  performanceMetrics: {
    overallScore: 82.5,
    confidence: 0.94,
    improvement: "+12% in last 30 days",
    skillDistribution: {
      speaking: { score: 85, trend: "improving", confidence: 0.91 },
      listening: { score: 88, trend: "stable", confidence: 0.96 },
      reading: { score: 79, trend: "improving", confidence: 0.88 },
      writing: { score: 76, trend: "needs_attention", confidence: 0.82 },
      culture: { score: 92, trend: "excellent", confidence: 0.98 },
      protocol: { score: 87, trend: "stable", confidence: 0.93 }
    },
    predictedProficiency: {
      currentILR: "2+",
      nextLevelETA: "4-6 months",
      confidence: 0.87,
      requiredFocus: ["Grammar structures", "Formal register", "Technical vocabulary"]
    }
  },
  adaptiveLearning: {
    currentPath: "Diplomatic Communication Track",
    completionRate: 68,
    adaptations: [
      {
        type: "content_difficulty",
        reason: "Student excelling in current level",
        action: "Increased complexity by 15%",
        date: "2024-06-20"
      },
      {
        type: "learning_modality",
        reason: "Strong visual learning preference detected",
        action: "Added more infographics and visual aids",
        date: "2024-06-18"
      },
      {
        type: "pacing_adjustment",
        reason: "Consistent high performance",
        action: "Accelerated timeline by 2 weeks",
        date: "2024-06-15"
      }
    ],
    nextAdaptations: [
      {
        type: "focus_area",
        suggestion: "Increase writing practice sessions",
        confidence: 0.89,
        expectedImpact: "15-20% improvement in 3 weeks"
      },
      {
        type: "content_type",
        suggestion: "Add more interactive speaking scenarios",
        confidence: 0.85,
        expectedImpact: "Enhanced confidence in formal settings"
      }
    ]
  },
  intelligentInsights: [
    {
      id: 1,
      type: "strength_leverage",
      title: "Leverage Cultural Expertise",
      insight: "Your exceptional cultural awareness (92%) can accelerate language learning. Consider applying cultural context to grammar exercises.",
      actionable: true,
      priority: "high",
      confidence: 0.94
    },
    {
      id: 2,
      type: "weakness_mitigation",
      title: "Grammar Foundation Building",
      insight: "Writing performance indicates need for stronger grammar fundamentals. Focus on sentence structure before complex composition.",
      actionable: true,
      priority: "medium",
      confidence: 0.87
    },
    {
      id: 3,
      type: "learning_optimization",
      title: "Peak Performance Window",
      insight: "Analysis shows 23% higher retention during morning sessions (9-11 AM). Schedule critical learning during this window.",
      actionable: true,
      priority: "medium",
      confidence: 0.91
    },
    {
      id: 4,
      type: "career_alignment",
      title: "Diplomatic Protocol Mastery",
      insight: "Your protocol knowledge (87%) combined with cultural skills positions you for advanced diplomatic roles within 6 months.",
      actionable: false,
      priority: "informational",
      confidence: 0.83
    }
  ],
  personalizedRecommendations: [
    {
      id: 1,
      type: "course",
      title: "Advanced Urdu Grammar Structures",
      description: "Intensive grammar course designed for diplomatic contexts",
      aiReasoning: "Addresses identified weakness in writing performance",
      estimatedTime: "3 weeks",
      difficultyLevel: "Advanced",
      expectedImprovement: "18-25% in writing scores",
      confidence: 0.89,
      priority: 1
    },
    {
      id: 2,
      type: "practice",
      title: "Daily Formal Writing Practice",
      description: "15-minute daily exercises in diplomatic correspondence",
      aiReasoning: "Leverages morning peak performance window",
      estimatedTime: "Daily, 15 min",
      difficultyLevel: "Intermediate",
      expectedImprovement: "12-18% in formal writing",
      confidence: 0.92,
      priority: 2
    },
    {
      id: 3,
      type: "scenario",
      title: "Embassy Meeting Simulations",
      description: "Interactive scenarios combining cultural and language skills",
      aiReasoning: "Builds on cultural strength while improving speaking",
      estimatedTime: "2x weekly, 45 min",
      difficultyLevel: "Advanced",
      expectedImprovement: "Enhanced confidence and fluency",
      confidence: 0.86,
      priority: 3
    },
    {
      id: 4,
      type: "mentor",
      title: "Connect with Dr. Fatima Khan",
      description: "1-on-1 sessions focused on grammar and writing",
      aiReasoning: "Instructor's expertise aligns with improvement needs",
      estimatedTime: "Weekly, 30 min",
      difficultyLevel: "Personalized",
      expectedImprovement: "Targeted skill development",
      confidence: 0.88,
      priority: 4
    }
  ],
  competencyGaps: [
    {
      skill: "Advanced Grammar",
      currentLevel: 2.1,
      targetLevel: 3.0,
      gap: 0.9,
      priority: "critical",
      estimatedTimeToClose: "8-12 weeks",
      requiredActions: [
        "Complete Advanced Grammar Course",
        "Daily practice exercises",
        "Weekly instructor feedback"
      ]
    },
    {
      skill: "Formal Writing",
      currentLevel: 2.3,
      targetLevel: 3.0,
      gap: 0.7,
      priority: "high",
      estimatedTimeToClose: "6-8 weeks",
      requiredActions: [
        "Diplomatic correspondence practice",
        "Peer review sessions",
        "Style guide mastery"
      ]
    },
    {
      skill: "Technical Vocabulary",
      currentLevel: 2.0,
      targetLevel: 2.8,
      gap: 0.8,
      priority: "medium",
      estimatedTimeToClose: "10-14 weeks",
      requiredActions: [
        "Industry-specific word lists",
        "Context-based learning",
        "Regular usage practice"
      ]
    }
  ]
};

const mockPredictiveModeling = {
  sixMonthProjection: {
    overallScore: 91.2,
    confidence: 0.82,
    keyMilestones: [
      { month: 1, event: "Complete Grammar Fundamentals", probability: 0.94 },
      { month: 2, event: "Achieve ILR 2.5 in Writing", probability: 0.87 },
      { month: 3, event: "Pass Diplomatic Protocol Exam", probability: 0.91 },
      { month: 4, event: "Reach Advanced Conversation Level", probability: 0.79 },
      { month: 5, event: "Complete Cultural Immersion Module", probability: 0.85 },
      { month: 6, event: "Achieve ILR 3 Overall Proficiency", probability: 0.76 }
    ]
  },
  riskFactors: [
    {
      factor: "Grammar Complexity Plateau",
      probability: 0.34,
      impact: "Medium",
      mitigation: "Increase practice frequency and add visual learning aids"
    },
    {
      factor: "Motivation Decline",
      probability: 0.18,
      impact: "High",
      mitigation: "Regular achievement celebrations and progress visualization"
    },
    {
      factor: "Schedule Inconsistency",
      probability: 0.22,
      impact: "Medium",
      mitigation: "Flexible learning modules and mobile access"
    }
  ],
  successFactors: [
    {
      factor: "Strong Cultural Foundation",
      contribution: 0.31,
      description: "Exceptional cultural awareness accelerates overall learning"
    },
    {
      factor: "Consistent Practice Schedule",
      contribution: 0.28,
      description: "Regular morning study sessions optimize retention"
    },
    {
      factor: "High Motivation Level",
      contribution: 0.24,
      description: "Strong intrinsic motivation drives self-directed learning"
    },
    {
      factor: "Quality Instruction",
      contribution: 0.17,
      description: "Access to FSI-certified instructors ensures proper guidance"
    }
  ]
};

// AI Performance Dashboard Component
export const AIPerformanceEvaluation = ({ user }) => {
  const [activeView, setActiveView] = useState('overview');
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRefreshAnalysis = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  const renderOverview = () => (
    <div className="ai-overview">
      <div className="ai-header">
        <div className="ai-title">
          <h2>AI Performance Analysis</h2>
          <p>Intelligent insights powered by advanced language learning algorithms</p>
        </div>
        <div className="ai-controls">
          <button 
            className={`btn ${isProcessing ? 'processing' : 'primary'}`}
            onClick={handleRefreshAnalysis}
            disabled={isProcessing}
          >
            {isProcessing ? '🔄 Analyzing...' : '🧠 Refresh Analysis'}
          </button>
        </div>
      </div>

      <div className="student-profile-card">
        <h3>AI-Generated Student Profile</h3>
        <div className="profile-grid">
          <div className="profile-item">
            <span className="profile-label">Learning Style:</span>
            <span className="profile-value">{mockAIAnalysis.studentProfile.learningStyle}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Current Level:</span>
            <span className="profile-value">{mockAIAnalysis.studentProfile.currentLevel}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Progress Rate:</span>
            <span className="profile-value trending-up">{mockAIAnalysis.studentProfile.progressRate}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Motivation:</span>
            <span className="profile-value high-motivation">{mockAIAnalysis.studentProfile.motivation}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Consistency:</span>
            <span className="profile-value consistent">{mockAIAnalysis.studentProfile.consistency}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Peak Hours:</span>
            <span className="profile-value">{mockAIAnalysis.studentProfile.preferredTimeOfDay}</span>
          </div>
        </div>
      </div>

      <div className="performance-overview">
        <div className="ai-score-card">
          <div className="ai-score-main">
            <div className="score-circle">
              <span className="score-number">{mockAIAnalysis.performanceMetrics.overallScore}</span>
              <span className="score-label">AI Score</span>
            </div>
            <div className="confidence-indicator">
              <span>Confidence: {Math.round(mockAIAnalysis.performanceMetrics.confidence * 100)}%</span>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill" 
                  style={{ width: `${mockAIAnalysis.performanceMetrics.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="improvement-metric">
            <span className="improvement-label">30-Day Improvement</span>
            <span className="improvement-value">{mockAIAnalysis.performanceMetrics.improvement}</span>
          </div>
        </div>

        <div className="skills-radar">
          <h4>AI Skills Analysis</h4>
          <div className="radar-chart">
            {Object.entries(mockAIAnalysis.performanceMetrics.skillDistribution).map(([skill, data]) => (
              <div key={skill} className="skill-radar-item">
                <div className="skill-info">
                  <span className="skill-name">{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
                  <span className={`trend-indicator ${data.trend.replace('_', '-')}`}>
                    {data.trend === 'improving' ? '📈' : data.trend === 'stable' ? '➡️' : data.trend === 'excellent' ? '⭐' : '⚠️'}
                  </span>
                </div>
                <div className="skill-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${data.score}%` }}
                    ></div>
                  </div>
                  <span className="skill-score">{data.score}%</span>
                </div>
                <div className="ai-confidence">
                  AI Confidence: {Math.round(data.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="proficiency-prediction">
        <h4>AI Proficiency Prediction</h4>
        <div className="prediction-card">
          <div className="current-status">
            <span className="status-label">Current ILR Level</span>
            <span className="status-value">{mockAIAnalysis.performanceMetrics.predictedProficiency.currentILR}</span>
          </div>
          <div className="prediction-arrow">→</div>
          <div className="predicted-status">
            <span className="status-label">Next Level ETA</span>
            <span className="status-value">{mockAIAnalysis.performanceMetrics.predictedProficiency.nextLevelETA}</span>
            <span className="prediction-confidence">
              {Math.round(mockAIAnalysis.performanceMetrics.predictedProficiency.confidence * 100)}% confidence
            </span>
          </div>
        </div>
        <div className="focus-areas">
          <span className="focus-label">AI Recommended Focus:</span>
          <div className="focus-tags">
            {mockAIAnalysis.performanceMetrics.predictedProficiency.requiredFocus.map((area, index) => (
              <span key={index} className="focus-tag">{area}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="ai-insights">
      <div className="insights-header">
        <h3>Intelligent Insights</h3>
        <p>AI-generated observations and recommendations based on your learning patterns</p>
      </div>

      <div className="insights-grid">
        {mockAIAnalysis.intelligentInsights.map(insight => (
          <div 
            key={insight.id} 
            className={`insight-card ${insight.type} ${insight.priority}`}
            onClick={() => setSelectedInsight(insight)}
          >
            <div className="insight-header">
              <div className="insight-type-badge">
                {insight.type.replace('_', ' ').toUpperCase()}
              </div>
              <div className="insight-priority">
                {insight.priority === 'high' ? '🔴' : insight.priority === 'medium' ? '🟡' : 'ℹ️'}
              </div>
            </div>
            <h4>{insight.title}</h4>
            <p>{insight.insight}</p>
            <div className="insight-footer">
              <span className="confidence-score">
                AI Confidence: {Math.round(insight.confidence * 100)}%
              </span>
              {insight.actionable && (
                <span className="actionable-badge">Actionable</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedInsight && (
        <div className="insight-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedInsight.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedInsight(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{selectedInsight.insight}</p>
              {selectedInsight.actionable && (
                <div className="suggested-actions">
                  <h4>Suggested Actions:</h4>
                  <button className="btn primary">Apply Recommendation</button>
                  <button className="btn secondary">Save for Later</button>
                  <button className="btn tertiary">Get More Details</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRecommendations = () => (
    <div className="ai-recommendations">
      <div className="recommendations-header">
        <h3>Personalized AI Recommendations</h3>
        <p>Tailored learning paths optimized for your specific profile and goals</p>
      </div>

      <div className="recommendations-list">
        {mockAIAnalysis.personalizedRecommendations.map(rec => (
          <div key={rec.id} className="recommendation-card">
            <div className="rec-header">
              <div className="rec-type-badge">{rec.type.toUpperCase()}</div>
              <div className="rec-priority">Priority #{rec.priority}</div>
            </div>
            
            <div className="rec-content">
              <h4>{rec.title}</h4>
              <p>{rec.description}</p>
              
              <div className="ai-reasoning">
                <span className="reasoning-label">🧠 AI Reasoning:</span>
                <span className="reasoning-text">{rec.aiReasoning}</span>
              </div>

              <div className="rec-metrics">
                <div className="metric">
                  <span className="metric-label">Time Investment:</span>
                  <span className="metric-value">{rec.estimatedTime}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Difficulty:</span>
                  <span className="metric-value">{rec.difficultyLevel}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Expected Impact:</span>
                  <span className="metric-value">{rec.expectedImprovement}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">AI Confidence:</span>
                  <span className="metric-value">{Math.round(rec.confidence * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="rec-actions">
              <button className="btn primary">Start Now</button>
              <button className="btn secondary">Schedule</button>
              <button className="btn tertiary">Learn More</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdaptiveLearning = () => (
    <div className="adaptive-learning">
      <div className="adaptive-header">
        <h3>Adaptive Learning Engine</h3>
        <p>Real-time adjustments based on your performance and learning patterns</p>
      </div>

      <div className="current-path">
        <h4>Current Learning Path</h4>
        <div className="path-card">
          <div className="path-info">
            <span className="path-name">{mockAIAnalysis.adaptiveLearning.currentPath}</span>
            <span className="completion-rate">{mockAIAnalysis.adaptiveLearning.completionRate}% Complete</span>
          </div>
          <div className="path-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${mockAIAnalysis.adaptiveLearning.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="recent-adaptations">
        <h4>Recent AI Adaptations</h4>
        <div className="adaptations-list">
          {mockAIAnalysis.adaptiveLearning.adaptations.map((adaptation, index) => (
            <div key={index} className="adaptation-item">
              <div className="adaptation-type">
                <span className="type-badge">{adaptation.type.replace('_', ' ').toUpperCase()}</span>
                <span className="adaptation-date">{adaptation.date}</span>
              </div>
              <div className="adaptation-content">
                <div className="adaptation-reason">
                  <span className="reason-label">Reason:</span>
                  <span>{adaptation.reason}</span>
                </div>
                <div className="adaptation-action">
                  <span className="action-label">Action Taken:</span>
                  <span>{adaptation.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="upcoming-adaptations">
        <h4>Suggested Adaptations</h4>
        <div className="suggestions-list">
          {mockAIAnalysis.adaptiveLearning.nextAdaptations.map((suggestion, index) => (
            <div key={index} className="suggestion-card">
              <div className="suggestion-header">
                <span className="suggestion-type">{suggestion.type.replace('_', ' ').toUpperCase()}</span>
                <span className="suggestion-confidence">
                  {Math.round(suggestion.confidence * 100)}% confidence
                </span>
              </div>
              <div className="suggestion-content">
                <p>{suggestion.suggestion}</p>
                <div className="expected-impact">
                  <span className="impact-label">Expected Impact:</span>
                  <span className="impact-value">{suggestion.expectedImpact}</span>
                </div>
              </div>
              <div className="suggestion-actions">
                <button className="btn primary">Apply</button>
                <button className="btn secondary">Review</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPredictiveModeling = () => (
    <div className="predictive-modeling">
      <div className="predictive-header">
        <h3>Predictive Learning Analytics</h3>
        <p>AI-powered projections and success modeling for your learning journey</p>
      </div>

      <div className="six-month-projection">
        <h4>6-Month Learning Projection</h4>
        <div className="projection-card">
          <div className="projected-score">
            <span className="projected-label">Projected Overall Score</span>
            <span className="projected-value">{mockPredictiveModeling.sixMonthProjection.overallScore}</span>
            <span className="projection-confidence">
              {Math.round(mockPredictiveModeling.sixMonthProjection.confidence * 100)}% confidence
            </span>
          </div>
          
          <div className="milestones-timeline">
            <h5>Key Milestones</h5>
            <div className="timeline">
              {mockPredictiveModeling.sixMonthProjection.keyMilestones.map((milestone, index) => (
                <div key={index} className="milestone-item">
                  <div className="milestone-month">Month {milestone.month}</div>
                  <div className="milestone-event">{milestone.event}</div>
                  <div className="milestone-probability">
                    {Math.round(milestone.probability * 100)}% probability
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="risk-success-analysis">
        <div className="risk-factors">
          <h4>AI-Identified Risk Factors</h4>
          <div className="factors-list">
            {mockPredictiveModeling.riskFactors.map((risk, index) => (
              <div key={index} className={`factor-card risk ${risk.impact.toLowerCase()}`}>
                <div className="factor-header">
                  <span className="factor-name">{risk.factor}</span>
                  <span className="factor-probability">{Math.round(risk.probability * 100)}%</span>
                </div>
                <div className="factor-impact">Impact: {risk.impact}</div>
                <div className="factor-mitigation">
                  <span className="mitigation-label">Mitigation:</span>
                  <span>{risk.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="success-factors">
          <h4>Success Factor Analysis</h4>
          <div className="factors-list">
            {mockPredictiveModeling.successFactors.map((success, index) => (
              <div key={index} className="factor-card success">
                <div className="factor-header">
                  <span className="factor-name">{success.factor}</span>
                  <span className="factor-contribution">{Math.round(success.contribution * 100)}%</span>
                </div>
                <div className="factor-description">{success.description}</div>
                <div className="contribution-bar">
                  <div 
                    className="contribution-fill" 
                    style={{ width: `${success.contribution * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompetencyGaps = () => (
    <div className="competency-gaps">
      <div className="gaps-header">
        <h3>Competency Gap Analysis</h3>
        <p>AI-identified skill gaps and personalized development paths</p>
      </div>

      <div className="gaps-list">
        {mockAIAnalysis.competencyGaps.map((gap, index) => (
          <div key={index} className={`gap-card ${gap.priority}`}>
            <div className="gap-header">
              <h4>{gap.skill}</h4>
              <span className={`priority-badge ${gap.priority}`}>
                {gap.priority.toUpperCase()} PRIORITY
              </span>
            </div>

            <div className="gap-analysis">
              <div className="level-comparison">
                <div className="current-level">
                  <span className="level-label">Current</span>
                  <span className="level-value">{gap.currentLevel}</span>
                </div>
                <div className="gap-indicator">
                  <span className="gap-value">Gap: {gap.gap}</span>
                  <div className="gap-visual">
                    <div className="current-bar" style={{ width: `${(gap.currentLevel / 4) * 100}%` }}></div>
                    <div className="target-bar" style={{ width: `${(gap.targetLevel / 4) * 100}%` }}></div>
                  </div>
                </div>
                <div className="target-level">
                  <span className="level-label">Target</span>
                  <span className="level-value">{gap.targetLevel}</span>
                </div>
              </div>

              <div className="gap-timeline">
                <span className="timeline-label">Estimated Closure Time:</span>
                <span className="timeline-value">{gap.estimatedTimeToClose}</span>
              </div>

              <div className="required-actions">
                <span className="actions-label">Required Actions:</span>
                <ul className="actions-list">
                  {gap.requiredActions.map((action, actionIndex) => (
                    <li key={actionIndex} className="action-item">
                      <span className="action-checkbox">☐</span>
                      <span className="action-text">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="gap-actions">
                <button className="btn primary">Create Development Plan</button>
                <button className="btn secondary">Schedule Assessment</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="ai-performance-evaluation">
      <div className="ai-nav-tabs">
        <button 
          className={`ai-tab ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          AI Overview
        </button>
        <button 
          className={`ai-tab ${activeView === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveView('insights')}
        >
          Intelligent Insights
        </button>
        <button 
          className={`ai-tab ${activeView === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveView('recommendations')}
        >
          AI Recommendations
        </button>
        <button 
          className={`ai-tab ${activeView === 'adaptive' ? 'active' : ''}`}
          onClick={() => setActiveView('adaptive')}
        >
          Adaptive Learning
        </button>
        <button 
          className={`ai-tab ${activeView === 'predictive' ? 'active' : ''}`}
          onClick={() => setActiveView('predictive')}
        >
          Predictive Analytics
        </button>
        <button 
          className={`ai-tab ${activeView === 'gaps' ? 'active' : ''}`}
          onClick={() => setActiveView('gaps')}
        >
          Competency Gaps
        </button>
      </div>

      <div className="ai-content">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'insights' && renderInsights()}
        {activeView === 'recommendations' && renderRecommendations()}
        {activeView === 'adaptive' && renderAdaptiveLearning()}
        {activeView === 'predictive' && renderPredictiveModeling()}
        {activeView === 'gaps' && renderCompetencyGaps()}
      </div>
    </div>
  );
};