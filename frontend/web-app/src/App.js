import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { UserInvitationManagement, ProfileManagement } from './InvitationComponents';
import { AssessmentDashboard, CertificationManagement, PerformanceAnalytics, AssessmentInterface } from './AssessmentSystem';
import { AIPerformanceEvaluation } from './AIPerformanceEvaluation';
import './App.css';
import './AssessmentSystem.css';
import './AIPerformanceEvaluation.css';

// Mock data for user invitations and profile management
const mockInvitations = {
  pending: [
    {
      id: 1,
      email: "ahmad.mahmood@stmichael-llc.com",
      role: "instructor",
      organizationId: "stmichael-llc",
      invitedBy: "Robert Stevens",
      invitedDate: "2024-06-20",
      expiryDate: "2024-07-20",
      status: "pending",
      specialization: "Urdu Language & Culture",
      assignedLocation: "Embassy Karachi"
    },
    {
      id: 2,
      email: "john.adams@state.gov",
      role: "student",
      organizationId: "state-dept",
      invitedBy: "System Administrator",
      invitedDate: "2024-06-22",
      expiryDate: "2024-07-22",
      status: "pending",
      diplomaticRank: "Political Officer",
      assignedPosting: "Embassy Islamabad"
    },
    {
      id: 3,
      email: "maria.rodriguez@stmichael-llc.com",
      role: "instructor",
      organizationId: "stmichael-llc",
      invitedBy: "Robert Stevens",
      invitedDate: "2024-06-18",
      expiryDate: "2024-07-18",
      status: "accepted",
      specialization: "Assessment & Evaluation",
      assignedLocation: "Embassy Islamabad"
    }
  ],
  sent: [
    {
      id: 4,
      email: "david.chen@state.gov",
      role: "student",
      organizationId: "state-dept",
      invitedBy: "System Administrator",
      invitedDate: "2024-06-15",
      expiryDate: "2024-07-15",
      status: "sent",
      diplomaticRank: "Consular Officer",
      assignedPosting: "Consulate Lahore"
    }
  ]
};

const mockProfileManagement = {
  recentActivity: [
    {
      id: 1,
      type: "profile_update",
      user: "Dr. Fatima Khan",
      action: "Updated certification status",
      timestamp: "2024-06-25 14:30",
      details: "FSI Certification renewed until 2025-06-30"
    },
    {
      id: 2,
      type: "invitation_accepted",
      user: "maria.rodriguez@stmichael-llc.com",
      action: "Accepted instructor invitation",
      timestamp: "2024-06-24 09:15",
      details: "Role: Instructor, Specialization: Assessment & Evaluation"
    },
    {
      id: 3,
      type: "role_assignment",
      user: "Ambassador Sarah Wilson",
      action: "Assigned to new learning track",
      timestamp: "2024-06-23 16:45",
      details: "Business Urdu track with cultural competency focus"
    }
  ],
  bulkActions: {
    lastBulkInvite: {
      date: "2024-06-20",
      count: 15,
      type: "New diplomatic staff onboarding",
      status: "completed"
    },
    scheduledActions: [
      {
        id: 1,
        action: "Send certification renewal reminders",
        scheduledDate: "2024-07-01",
        targetUsers: 8,
        type: "automated_reminder"
      }
    ]
  }
};

// Enhanced Mock Data for Multi-Tenant SaaS Platform
const mockUserProfiles = {
  contractor: {
    id: 1,
    email: "admin@stmichael-llc.com",
    name: "Robert Stevens",
    role: "contractor_admin",
    organization: {
      name: "St Michael LLC",
      contractId: "19PK3325Q7039",
      contractTitle: "Urdu Language Instructor Services",
      status: "Active",
      startDate: "2024-01-15",
      endDate: "2025-12-31",
      locations: ["Embassy Islamabad", "Embassy Karachi", "Consulate Lahore"],
      languages: ["Urdu", "English"]
    },
    permissions: ["manage_instructors", "view_reports", "manage_students", "view_analytics"]
  },
  instructor: {
    id: 2,
    email: "fatima.khan@stmichael-llc.com",
    name: "Dr. Fatima Khan",
    role: "instructor",
    organization: {
      name: "St Michael LLC",
      contractId: "19PK3325Q7039"
    },
    instructor: {
      employeeId: "SM-URD-001",
      specialization: ["Urdu", "Cultural Training"],
      fsiCertified: true,
      certificationExpiry: "2025-06-30",
      experience: "8 years",
      assignedLocations: ["Embassy Islamabad"],
      currentStudents: 23,
      completedCourses: 45
    },
    permissions: ["manage_classes", "assess_students", "access_materials", "create_content"]
  },
  student: {
    id: 3,
    email: "sarah.wilson@state.gov",
    name: "Ambassador Sarah Wilson",
    role: "student",
    organization: {
      name: "US Department of State"
    },
    student: {
      diplomaticRank: "Ambassador",
      clearanceLevel: "SECRET",
      currentPosting: "Embassy Islamabad, Pakistan",
      assignmentDuration: "2023-08-15 to 2026-08-14",
      learningGoals: ["Business Urdu", "Cultural Competency", "Local Protocols"],
      currentLevel: "Intermediate"
    },
    permissions: ["access_courses", "take_assessments", "view_progress", "access_resources"]
  }
};

const mockContractorData = {
  overview: {
    totalInstructors: 12,
    certifiedInstructors: 10,
    pendingCertifications: 2,
    totalStudents: 89,
    activeClasses: 15,
    completionRate: 87.3,
    contractCompliance: 94.2
  },
  instructors: [
    {
      id: 1,
      name: "Dr. Fatima Khan",
      email: "fatima.khan@stmichael-llc.com",
      specialization: "Urdu Language & Culture",
      fsiCertified: true,
      certificationExpiry: "2025-06-30",
      currentStudents: 23,
      location: "Embassy Islamabad",
      status: "Active",
      performance: 4.8
    },
    {
      id: 2,
      name: "Prof. Ahmed Hassan",
      email: "ahmed.hassan@stmichael-llc.com",
      specialization: "English for Local Nationals",
      fsiCertified: true,
      certificationExpiry: "2025-03-15",
      currentStudents: 18,
      location: "Embassy Islamabad",
      status: "Active",
      performance: 4.7
    },
    {
      id: 3,
      name: "Dr. Maria Rodriguez",
      email: "maria.rodriguez@stmichael-llc.com",
      specialization: "Cultural Integration",
      fsiCertified: false,
      certificationDue: "2024-08-01",
      currentStudents: 0,
      location: "Consulate Lahore",
      status: "Certification Pending",
      performance: null
    }
  ],
  contracts: [
    {
      id: "19PK3325Q7039",
      title: "Urdu Language Instructor Services",
      status: "Active",
      startDate: "2024-01-15",
      endDate: "2025-12-31",
      locations: ["Embassy Islamabad", "Embassy Karachi", "Consulate Lahore"],
      languages: ["Urdu", "English"],
      progress: 67,
      budget: 850000,
      spent: 420000
    }
  ]
};

const mockStudentTeacherData = {
  activeSession: {
    classId: 1,
    className: "Diplomatic Urdu - Advanced",
    instructor: "Dr. Fatima Khan",
    sessionType: "Live Class",
    startTime: "2024-06-26 14:00",
    duration: 90,
    topic: "Business Meeting Protocols",
    participants: 8
  },
  upcomingClasses: [
    {
      id: 1,
      name: "Diplomatic Urdu - Advanced",
      instructor: "Dr. Fatima Khan",
      time: "2024-06-26 14:00",
      duration: 90,
      type: "Live Session",
      topic: "Business Meeting Protocols"
    },
    {
      id: 2,
      name: "Cultural Protocols Training",
      instructor: "Dr. Fatima Khan",
      time: "2024-06-27 16:00",
      duration: 60,
      type: "Workshop",
      topic: "Embassy Etiquette"
    }
  ],
  recentMessages: [
    {
      id: 1,
      from: "Dr. Fatima Khan",
      fromRole: "instructor",
      message: "Great progress on your pronunciation exercises! Focus on the 'qh' sound for tomorrow's session.",
      timestamp: "2024-06-25 16:30",
      type: "feedback"
    },
    {
      id: 2,
      from: "Ambassador Sarah Wilson",
      fromRole: "student",
      message: "Could you recommend additional resources for business vocabulary?",
      timestamp: "2024-06-25 15:45",
      type: "question"
    },
    {
      id: 3,
      from: "Dr. Fatima Khan",
      fromRole: "instructor",
      message: "Tomorrow's class will cover formal meeting introductions. Please review Chapter 8.",
      timestamp: "2024-06-25 14:20",
      type: "announcement"
    }
  ],
  sharedResources: [
    {
      id: 1,
      title: "Business Urdu Vocabulary Guide",
      type: "PDF",
      uploadedBy: "Dr. Fatima Khan",
      uploadDate: "2024-06-20",
      downloads: 12,
      size: "2.3 MB"
    },
    {
      id: 2,
      title: "Pronunciation Practice Audio",
      type: "Audio",
      uploadedBy: "Dr. Fatima Khan",
      uploadDate: "2024-06-22",
      downloads: 8,
      size: "15.7 MB"
    },
    {
      id: 3,
      title: "Cultural Context Notes",
      type: "Document",
      uploadedBy: "Ambassador Sarah Wilson",
      uploadDate: "2024-06-24",
      downloads: 5,
      size: "850 KB"
    }
  ],
  assessments: [
    {
      id: 1,
      title: "Weekly Vocabulary Assessment",
      dueDate: "2024-06-28",
      status: "pending",
      type: "quiz",
      questions: 25,
      timeLimit: 30
    },
    {
      id: 2,
      title: "Speaking Proficiency Evaluation",
      dueDate: "2024-06-30",
      status: "scheduled",
      type: "oral",
      duration: 20,
      format: "One-on-one"
    },
    {
      id: 3,
      title: "Cultural Scenarios Analysis",
      dueDate: "2024-06-25",
      status: "completed",
      type: "written",
      score: "92%",
      feedback: "Excellent understanding of diplomatic protocols"
    }
  ]
};

const mockInstructorData = {
  dashboard: {
    myClasses: 4,
    totalStudents: 23,
    avgProgress: 78.5,
    upcomingDeadlines: 3,
    certificationStatus: "Valid",
    nextRefresher: "2024-09-15"
  },
  classes: [
    {
      id: 1,
      name: "Diplomatic Urdu - Advanced",
      students: 8,
      schedule: "Mon/Wed/Fri 14:00-15:30",
      progress: 82,
      nextSession: "2024-06-26 14:00",
      location: "Embassy Islamabad - Room 205"
    },
    {
      id: 2,
      name: "Cultural Protocols Training",
      students: 6,
      schedule: "Tue/Thu 16:00-17:00",
      progress: 65,
      nextSession: "2024-06-27 16:00",
      location: "Embassy Islamabad - Conference Room"
    },
    {
      id: 3,
      name: "Business Urdu Fundamentals",
      students: 9,
      schedule: "Daily 09:00-10:00",
      progress: 91,
      nextSession: "2024-06-26 09:00",
      location: "Embassy Islamabad - Training Center"
    }
  ],
  certifications: [
    {
      name: "FSI Urdu Language Instructor",
      status: "Valid",
      issueDate: "2023-07-01",
      expiryDate: "2025-06-30",
      renewalRequired: false
    },
    {
      name: "Cultural Sensitivity Training",
      status: "Valid",
      issueDate: "2024-01-15",
      expiryDate: "2025-01-14",
      renewalRequired: false
    },
    {
      name: "Assessment & Evaluation Specialist",
      status: "Renewal Due",
      issueDate: "2022-08-01",
      expiryDate: "2024-07-31",
      renewalRequired: true
    }
  ]
};

// Multi-Tenant Role Selector Component
const RoleSelector = ({ currentUser, onRoleChange }) => {
  const roles = [
    { key: 'contractor', label: 'Contractor Admin', user: mockUserProfiles.contractor },
    { key: 'instructor', label: 'Instructor', user: mockUserProfiles.instructor },
    { key: 'student', label: 'Student', user: mockUserProfiles.student }
  ];

  return (
    <div className="role-selector">
      <h3>Demo: Switch User Role</h3>
      <div className="role-buttons">
        {roles.map(role => (
          <button
            key={role.key}
            className={`role-btn ${currentUser.role === role.user.role ? 'active' : ''}`}
            onClick={() => onRoleChange(role.user)}
          >
            {role.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Instructor Certification Workflow Component
const InstructorCertificationWorkflow = ({ user }) => {
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [certificationStep, setCertificationStep] = useState('overview');
  
  const certificationSteps = [
    { key: 'overview', label: 'Overview', completed: true },
    { key: 'application', label: 'Application', completed: true },
    { key: 'training', label: 'FSI Training', completed: false, current: true },
    { key: 'assessment', label: 'Assessment', completed: false },
    { key: 'certification', label: 'Certification', completed: false }
  ];

  const renderCertificationSteps = () => (
    <div className="certification-workflow">
      <div className="workflow-header">
        <h2>Instructor Certification Workflow</h2>
        <p>FSI Certification Process for {selectedInstructor ? selectedInstructor.name : 'All Instructors'}</p>
      </div>
      
      <div className="workflow-steps">
        {certificationSteps.map((step, index) => (
          <div 
            key={step.key} 
            className={`workflow-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}
            onClick={() => setCertificationStep(step.key)}
          >
            <div className="step-number">
              {step.completed ? 'DONE' : index + 1}
            </div>
            <div className="step-content">
              <h4>{step.label}</h4>
              <p className="step-status">
                {step.completed ? 'Completed' : step.current ? 'In Progress' : 'Pending'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {certificationStep === 'overview' && (
        <div className="certification-overview">
          <div className="cert-stats-grid">
            <div className="cert-stat-card">
              <h3>Total Instructors</h3>
              <div className="stat-number">12</div>
              <div className="stat-detail">Current roster</div>
            </div>
            <div className="cert-stat-card success">
              <h3>FSI Certified</h3>
              <div className="stat-number">10</div>
              <div className="stat-detail">83% certified</div>
            </div>
            <div className="cert-stat-card warning">
              <h3>Pending Certification</h3>
              <div className="stat-number">2</div>
              <div className="stat-detail">In process</div>
            </div>
            <div className="cert-stat-card info">
              <h3>Renewal Due (90 days)</h3>
              <div className="stat-number">3</div>
              <div className="stat-detail">Action required</div>
            </div>
          </div>

          <div className="certification-pipeline">
            <h3>Certification Pipeline</h3>
            <div className="pipeline-instructors">
              {mockContractorData.instructors.map(instructor => (
                <div key={instructor.id} className="pipeline-instructor">
                  <div className="instructor-info">
                    <h4>{instructor.name}</h4>
                    <p>{instructor.specialization}</p>
                  </div>
                  <div className="cert-progress">
                    <div className="progress-steps">
                      {certificationSteps.map(step => (
                        <div 
                          key={step.key} 
                          className={`mini-step ${instructor.fsiCertified && step.key !== 'training' ? 'completed' : ''}`}
                        ></div>
                      ))}
                    </div>
                    <span className="progress-label">
                      {instructor.fsiCertified ? 'Certified' : 'In Training'}
                    </span>
                  </div>
                  <button 
                    className="btn secondary"
                    onClick={() => setSelectedInstructor(instructor)}
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {certificationStep === 'training' && (
        <div className="training-management">
          <h3>FSI Training Program Management</h3>
          <div className="training-modules">
            <div className="module-card">
              <h4>Language Instruction Methodology</h4>
              <div className="module-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '100%'}}></div>
                </div>
                <span>Completed</span>
              </div>
              <div className="module-details">
                <p>Duration: 40 hours</p>
                <p>Format: Online + Practical</p>
                <p>Completion: Required</p>
              </div>
            </div>

            <div className="module-card current">
              <h4>Cultural Competency Training</h4>
              <div className="module-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '75%'}}></div>
                </div>
                <span>75% Complete</span>
              </div>
              <div className="module-details">
                <p>Duration: 24 hours</p>
                <p>Format: Instructor-led</p>
                <p>Next session: June 28, 2024</p>
              </div>
            </div>

            <div className="module-card">
              <h4>Assessment & Evaluation</h4>
              <div className="module-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '30%'}}></div>
                </div>
                <span>30% Complete</span>
              </div>
              <div className="module-details">
                <p>Duration: 16 hours</p>
                <p>Format: Workshop</p>
                <p>Prerequisites: Module 1 & 2</p>
              </div>
            </div>
          </div>

          <div className="training-actions">
            <button className="btn primary">Schedule Training Session</button>
            <button className="btn secondary">View Training Calendar</button>
            <button className="btn secondary">Training Materials</button>
          </div>
        </div>
      )}

      {certificationStep === 'assessment' && (
        <div className="assessment-management">
          <h3>Instructor Assessment Center</h3>
          <div className="assessment-categories">
            <div className="assessment-card">
              <h4>Teaching Demonstration</h4>
              <p>Live classroom instruction evaluation</p>
              <div className="assessment-status pending">Scheduled</div>
              <div className="assessment-details">
                <p>Date: July 5, 2024</p>
                <p>Duration: 2 hours</p>
                <p>Evaluator: FSI Certified Assessor</p>
              </div>
              <button className="btn primary">View Details</button>
            </div>

            <div className="assessment-card">
              <h4>Cultural Knowledge Exam</h4>
              <p>Written examination on regional culture and protocols</p>
              <div className="assessment-status completed">Passed</div>
              <div className="assessment-details">
                <p>Score: 92/100</p>
                <p>Date: June 20, 2024</p>
                <p>Grade: Excellent</p>
              </div>
              <button className="btn secondary">View Results</button>
            </div>

            <div className="assessment-card">
              <h4>Language Proficiency</h4>
              <p>Speaking, listening, and comprehension assessment</p>
              <div className="assessment-status in-progress">In Progress</div>
              <div className="assessment-details">
                <p>Oral Exam: June 30, 2024</p>
                <p>Duration: 90 minutes</p>
                <p>Level: ILR 4 Required</p>
              </div>
              <button className="btn warning">Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (selectedInstructor) {
    return (
      <div className="individual-certification">
        <div className="cert-header">
          <button className="btn secondary" onClick={() => setSelectedInstructor(null)}>
            ← Back to Overview
          </button>
          <h2>{selectedInstructor.name} - Certification Status</h2>
        </div>
        {renderCertificationSteps()}
      </div>
    );
  }

  return renderCertificationSteps();
};

// Contractor Dashboard Component
const ContractorDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data] = useState(mockContractorData);

  const renderOverview = () => (
    <div className="contractor-overview">
      <div className="contract-header">
        <h1>Contract Management Dashboard</h1>
        <div className="contract-info">
          <h2>{user.organization.name}</h2>
          <p>Contract: {user.organization.contractTitle}</p>
          <span className="contract-status active">Active Contract</span>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <h3>Total Instructors</h3>
          <div className="metric-number">{data.overview.totalInstructors}</div>
          <div className="metric-detail">{data.overview.certifiedInstructors} FSI Certified</div>
        </div>
        <div className="metric-card success">
          <h3>Active Students</h3>
          <div className="metric-number">{data.overview.totalStudents}</div>
          <div className="metric-detail">{data.overview.activeClasses} Active Classes</div>
        </div>
        <div className="metric-card warning">
          <h3>Completion Rate</h3>
          <div className="metric-number">{data.overview.completionRate}%</div>
          <div className="metric-detail">Above target (85%)</div>
        </div>
        <div className="metric-card info">
          <h3>Contract Compliance</h3>
          <div className="metric-number">{data.overview.contractCompliance}%</div>
          <div className="metric-detail">Excellent rating</div>
        </div>
      </div>

      <div className="alerts-section">
        <h3>Action Required</h3>
        <div className="alert-list">
          <div className="alert warning">
            <strong>Certification Renewal:</strong> Dr. Maria Rodriguez - Assessment & Evaluation certification expires in 30 days
          </div>
          <div className="alert info">
            <strong>New Assignment:</strong> 5 new diplomatic staff arriving next week requiring Urdu training
          </div>
          <div className="alert success">
            <strong>Milestone:</strong> Contract 19PK3325Q7039 is 67% complete, ahead of schedule
          </div>
        </div>
      </div>
    </div>
  );

  const renderInstructors = () => (
    <div className="instructor-management">
      <div className="section-header">
        <h2>Instructor Management</h2>
        <button className="btn primary">Add New Instructor</button>
      </div>
      
      <div className="instructor-grid">
        {data.instructors.map(instructor => (
          <div key={instructor.id} className="instructor-card">
            <div className="instructor-header">
              <h3>{instructor.name}</h3>
              <span className={`status ${instructor.status.toLowerCase().replace(' ', '-')}`}>
                {instructor.status}
              </span>
            </div>
            <div className="instructor-details">
              <p><strong>Specialization:</strong> {instructor.specialization}</p>
              <p><strong>Location:</strong> {instructor.location}</p>
              <p><strong>Current Students:</strong> {instructor.currentStudents}</p>
              <p><strong>FSI Certified:</strong> {instructor.fsiCertified ? 'Yes' : 'No'}</p>
              {instructor.fsiCertified && (
                <p><strong>Cert. Expires:</strong> {instructor.certificationExpiry}</p>
              )}
              {!instructor.fsiCertified && (
                <p><strong>Cert. Due:</strong> {instructor.certificationDue}</p>
              )}
              {instructor.performance && (
                <p><strong>Performance:</strong> {instructor.performance}/5.0</p>
              )}
            </div>
            <div className="instructor-actions">
              <button className="btn secondary">View Profile</button>
              <button className="btn primary">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="reports-section">
      <h2>Contract Reports & Analytics</h2>
      <div className="report-categories">
        <div className="report-card">
          <h3>Instructor Performance</h3>
          <p>Detailed performance metrics and student feedback</p>
          <button className="btn primary">Generate Report</button>
        </div>
        <div className="report-card">
          <h3>Student Progress</h3>
          <p>Language proficiency advancement and completion rates</p>
          <button className="btn primary">Generate Report</button>
        </div>
        <div className="report-card">
          <h3>Contract Compliance</h3>
          <p>Deliverables, milestones, and regulatory compliance</p>
          <button className="btn primary">Generate Report</button>
        </div>
        <div className="report-card">
          <h3>Financial Summary</h3>
          <p>Budget utilization and cost per student analysis</p>
          <button className="btn primary">Generate Report</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="contractor-dashboard">
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'instructors' ? 'active' : ''}`}
          onClick={() => setActiveTab('instructors')}
        >
          Instructors
        </button>
        <button 
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
        <button 
          className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          Invitations
        </button>
        <button 
          className={`tab ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          Profile Management
        </button>
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
        <button 
          className={`tab ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          Contracts
        </button>
        <button 
          className={`tab ${activeTab === 'certification' ? 'active' : ''}`}
          onClick={() => setActiveTab('certification')}
        >
          Certification
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'instructors' && renderInstructors()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'students' && (
          <div className="students-section">
            <h2>Student Management</h2>
            <p>Student enrollment, progress tracking, and performance analytics</p>
          </div>
        )}
        {activeTab === 'invitations' && <UserInvitationManagement />}
        {activeTab === 'profiles' && <ProfileManagement />}
        {activeTab === 'contracts' && (
          <div className="contracts-section">
            <h2>Contract Portfolio</h2>
            <div className="contract-list">
              {data.contracts.map(contract => (
                <div key={contract.id} className="contract-card">
                  <h3>{contract.title}</h3>
                  <p>Contract ID: {contract.id}</p>
                  <p>Period: {contract.startDate} - {contract.endDate}</p>
                  <p>Locations: {contract.locations.join(', ')}</p>
                  <div className="contract-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${contract.progress}%`}}
                      ></div>
                    </div>
                    <span>{contract.progress}% Complete</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'certification' && (
          <InstructorCertificationWorkflow user={user} />
        )}
      </div>
    </div>
  );
};

// Instructor Dashboard Component
const InstructorDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data] = useState(mockInstructorData);

  const renderDashboard = () => (
    <div className="instructor-overview">
      <div className="instructor-header">
        <h1>Instructor Dashboard</h1>
        <div className="instructor-info">
          <h2>Welcome, {user.name}</h2>
          <p>Employee ID: {user.instructor.employeeId}</p>
          <p>Specialization: {user.instructor.specialization.join(', ')}</p>
          <span className={`cert-status ${user.instructor.fsiCertified ? 'valid' : 'pending'}`}>
            FSI Certification: {user.instructor.fsiCertified ? 'Valid' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="instructor-metrics">
        <div className="metric-card">
          <h3>My Classes</h3>
          <div className="metric-number">{data.dashboard.myClasses}</div>
        </div>
        <div className="metric-card">
          <h3>Total Students</h3>
          <div className="metric-number">{data.dashboard.totalStudents}</div>
        </div>
        <div className="metric-card">
          <h3>Avg Progress</h3>
          <div className="metric-number">{data.dashboard.avgProgress}%</div>
        </div>
        <div className="metric-card">
          <h3>Upcoming Deadlines</h3>
          <div className="metric-number">{data.dashboard.upcomingDeadlines}</div>
        </div>
      </div>

      <div className="upcoming-classes">
        <h3>Today's Schedule</h3>
        <div className="class-list">
          {data.classes.filter(cls => cls.nextSession.includes('2024-06-26')).map(cls => (
            <div key={cls.id} className="class-item">
              <div className="class-info">
                <h4>{cls.name}</h4>
                <p>{cls.nextSession} - {cls.location}</p>
                <p>{cls.students} students</p>
              </div>
              <div className="class-actions">
                <button className="btn primary">Start Class</button>
                <button className="btn secondary">Materials</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderClasses = () => (
    <div className="classes-management">
      <div className="section-header">
        <h2>My Classes</h2>
        <button className="btn primary">Create New Class</button>
      </div>
      
      <div className="classes-grid">
        {data.classes.map(cls => (
          <div key={cls.id} className="class-card">
            <div className="class-header">
              <h3>{cls.name}</h3>
              <span className="student-count">{cls.students} students</span>
            </div>
            <div className="class-details">
              <p><strong>Schedule:</strong> {cls.schedule}</p>
              <p><strong>Location:</strong> {cls.location}</p>
              <p><strong>Next Session:</strong> {cls.nextSession}</p>
              <div className="progress-indicator">
                <span>Progress: {cls.progress}%</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${cls.progress}%`}}
                  ></div>
                </div>
              </div>
            </div>
            <div className="class-actions">
              <button className="btn primary">Manage Class</button>
              <button className="btn secondary">View Students</button>
              <button className="btn secondary">Materials</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCertifications = () => (
    <div className="certifications-section">
      <h2>My Certifications</h2>
      <div className="cert-grid">
        {data.certifications.map((cert, index) => (
          <div key={index} className={`cert-card ${cert.status.toLowerCase().replace(' ', '-')}`}>
            <div className="cert-header">
              <h3>{cert.name}</h3>
              <span className={`cert-status ${cert.status.toLowerCase().replace(' ', '-')}`}>
                {cert.status}
              </span>
            </div>
            <div className="cert-details">
              <p><strong>Issued:</strong> {cert.issueDate}</p>
              <p><strong>Expires:</strong> {cert.expiryDate}</p>
              {cert.renewalRequired && (
                <div className="renewal-notice">
                  <strong>Action Required:</strong> Renewal due soon
                </div>
              )}
            </div>
            <div className="cert-actions">
              {cert.renewalRequired ? (
                <button className="btn warning">Renew Certification</button>
              ) : (
                <button className="btn secondary">View Certificate</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="instructor-portal">
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          My Classes
        </button>
        <button 
          className={`tab ${activeTab === 'certifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('certifications')}
        >
          Certifications
        </button>
        <button 
          className={`tab ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          Teaching Materials
        </button>
        <button 
          className={`tab ${activeTab === 'assessments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assessments')}
        >
          Assessments
        </button>
        <button 
          className={`tab ${activeTab === 'ai-insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-insights')}
        >
          🧠 AI Insights
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'classes' && renderClasses()}
        {activeTab === 'certifications' && renderCertifications()}
        {activeTab === 'materials' && (
          <div className="materials-section">
            <h2>Teaching Materials Library</h2>
            <p>Access lesson plans, cultural guides, and multimedia resources</p>
          </div>
        )}
        {activeTab === 'assessments' && (
          <div className="assessments-section">
            <h2>Student Assessments</h2>
            <p>Create, manage, and grade student assessments</p>
          </div>
        )}
        {activeTab === 'ai-insights' && <AIPerformanceEvaluation user={user} />}
      </div>
    </div>
  );
};

// Student-Teacher Learning Portal Component
const StudentTeacherPortal = ({ user }) => {
  const [activeTab, setActiveTab] = useState('classroom');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  const renderClassroom = () => (
    <div className="learning-classroom">
      <div className="active-session-banner">
        <div className="session-info">
          <h3>Live Session: {mockStudentTeacherData.activeSession.className}</h3>
          <p>Instructor: {mockStudentTeacherData.activeSession.instructor}</p>
          <p>Topic: {mockStudentTeacherData.activeSession.topic}</p>
          <p>{mockStudentTeacherData.activeSession.participants} participants</p>
        </div>
        <div className="session-actions">
          <button className="btn primary session-btn">Join Class</button>
          <div className="session-timer">14:00 - 15:30</div>
        </div>
      </div>

      <div className="classroom-content">
        <div className="main-learning-area">
          <div className="lesson-viewer">
            <h4>Today's Lesson: Business Meeting Protocols</h4>
            <div className="lesson-content">
              <div className="content-placeholder">
                <div className="video-placeholder">
                  <div className="play-button">PLAY</div>
                  <p>Video: Formal Greetings in Business Settings</p>
                </div>
              </div>
              <div className="lesson-controls">
                <button className="btn secondary">Previous</button>
                <button className="btn primary">Next Module</button>
                <button className="btn secondary">Resources</button>
              </div>
            </div>
          </div>

          <div className="interactive-exercises">
            <h4>Practice Exercises</h4>
            <div className="exercise-cards">
              <div className="exercise-card">
                <h5>Pronunciation Practice</h5>
                <p>Practice key business terms</p>
                <button className="btn primary">Start Exercise</button>
              </div>
              <div className="exercise-card">
                <h5>Role Play Scenario</h5>
                <p>Embassy meeting simulation</p>
                <button className="btn secondary">Begin Scenario</button>
              </div>
            </div>
          </div>
        </div>

        <div className="classroom-sidebar">
          <div className="class-participants">
            <h4>Class Participants</h4>
            <div className="participant-list">
              <div className="participant instructor">
                <div className="participant-avatar">FK</div>
                <div className="participant-info">
                  <span>Dr. Fatima Khan</span>
                  <span className="role">Instructor</span>
                </div>
                <div className="participant-status online"></div>
              </div>
              <div className="participant student active">
                <div className="participant-avatar">SW</div>
                <div className="participant-info">
                  <span>Ambassador Wilson</span>
                  <span className="role">You</span>
                </div>
                <div className="participant-status online"></div>
              </div>
              <div className="participant student">
                <div className="participant-avatar">JD</div>
                <div className="participant-info">
                  <span>Consul Davis</span>
                  <span className="role">Student</span>
                </div>
                <div className="participant-status online"></div>
              </div>
            </div>
          </div>

          <div className="quick-tools">
            <h4>Learning Tools</h4>
            <div className="tool-buttons">
              <button className="btn secondary">Dictionary</button>
              <button className="btn secondary">Notes</button>
              <button className="btn secondary">Recording</button>
              <button className="btn secondary">Whiteboard</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommunication = () => (
    <div className="communication-center">
      <div className="message-threads">
        <div className="thread-header">
          <h3>Class Communication</h3>
          <button className="btn primary">New Message</button>
        </div>
        
        <div className="message-list">
          {mockStudentTeacherData.recentMessages.map(message => (
            <div key={message.id} className={`message-item ${message.type}`}>
              <div className="message-header">
                <div className="sender-info">
                  <span className="sender-name">{message.from}</span>
                  <span className={`sender-role ${message.fromRole}`}>
                    {message.fromRole}
                  </span>
                </div>
                <span className="message-time">{message.timestamp}</span>
              </div>
              <div className="message-content">
                <p>{message.message}</p>
              </div>
              <div className="message-actions">
                <button className="btn secondary">Reply</button>
                {message.type === 'question' && (
                  <button className="btn primary">Answer</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="message-composer">
          <div className="composer-header">
            <h4>Send Message</h4>
            <select className="message-type-selector">
              <option value="general">General Message</option>
              <option value="question">Question</option>
              <option value="feedback">Request Feedback</option>
            </select>
          </div>
          <textarea 
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="message-input"
          />
          <div className="composer-actions">
            <button className="btn secondary">Attach File</button>
            <button className="btn primary">Send Message</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="shared-resources">
      <div className="resources-header">
        <h3>Shared Learning Resources</h3>
        <button className="btn primary">Upload Resource</button>
      </div>

      <div className="resource-grid">
        {mockStudentTeacherData.sharedResources.map(resource => (
          <div key={resource.id} className="resource-card">
            <div className="resource-icon">
              {resource.type === 'PDF' && 'PDF'}
              {resource.type === 'Audio' && 'AUDIO'}
              {resource.type === 'Document' && 'DOC'}
            </div>
            <div className="resource-info">
              <h4>{resource.title}</h4>
              <p>Uploaded by: {resource.uploadedBy}</p>
              <p>Date: {resource.uploadDate}</p>
              <p>Size: {resource.size} • {resource.downloads} downloads</p>
            </div>
            <div className="resource-actions">
              <button className="btn primary">Download</button>
              <button className="btn secondary">Preview</button>
            </div>
          </div>
        ))}
      </div>

      <div className="resource-categories">
        <h4>Browse by Category</h4>
        <div className="category-tags">
          <span className="category-tag active">All Resources</span>
          <span className="category-tag">Vocabulary</span>
          <span className="category-tag">Grammar</span>
          <span className="category-tag">Cultural Context</span>
          <span className="category-tag">Audio Practice</span>
          <span className="category-tag">Assessment Prep</span>
        </div>
      </div>
    </div>
  );

  const renderAssessments = () => <AssessmentDashboard user={user} />;

  return (
    <div className="student-teacher-portal">
      <div className="portal-header">
        <h1>Learning Portal</h1>
        <div className="student-info">
          <h2>Welcome, {user.name}</h2>
          <p>{user.student.diplomaticRank} • {user.student.currentPosting}</p>
          <p>Learning Level: {user.student.currentLevel}</p>
        </div>
      </div>

      <div className="learning-goals">
        <h3>My Learning Goals</h3>
        <div className="goals-list">
          {user.student.learningGoals.map((goal, index) => (
            <span key={index} className="goal-tag">{goal}</span>
          ))}
        </div>
      </div>

      <div className="portal-tabs">
        <button 
          className={`tab ${activeTab === 'classroom' ? 'active' : ''}`}
          onClick={() => setActiveTab('classroom')}
        >
          Live Classroom
        </button>
        <button 
          className={`tab ${activeTab === 'communication' ? 'active' : ''}`}
          onClick={() => setActiveTab('communication')}
        >
          Communication
        </button>
        <button 
          className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          Resources
        </button>
        <button 
          className={`tab ${activeTab === 'assessments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assessments')}
        >
          Assessments
        </button>
        <button 
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Schedule
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'classroom' && renderClassroom()}
        {activeTab === 'communication' && renderCommunication()}
        {activeTab === 'resources' && renderResources()}
        {activeTab === 'assessments' && renderAssessments()}
        {activeTab === 'schedule' && (
          <div className="schedule-view">
            <h3>My Class Schedule</h3>
            <div className="upcoming-classes">
              {mockStudentTeacherData.upcomingClasses.map(cls => (
                <div key={cls.id} className="schedule-item">
                  <div className="class-time">{cls.time}</div>
                  <div className="class-details">
                    <h4>{cls.name}</h4>
                    <p>Instructor: {cls.instructor}</p>
                    <p>Topic: {cls.topic}</p>
                    <p>Duration: {cls.duration} minutes</p>
                  </div>
                  <div className="class-actions">
                    <button className="btn primary">Join Class</button>
                    <button className="btn secondary">Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Student Dashboard Component (existing with enhancements)
const StudentDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('learning');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'learning':
        return <StudentTeacherPortal user={user} />;
      case 'assessments':
        return <AssessmentDashboard user={user} />;
      case 'certifications':
        return <CertificationManagement user={user} />;
      case 'analytics':
        return <PerformanceAnalytics user={user} />;
      case 'ai-insights':
        return <AIPerformanceEvaluation user={user} />;
      default:
        return <StudentTeacherPortal user={user} />;
    }
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-navigation">
        <h1>Student Dashboard</h1>
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'learning' ? 'active' : ''}`}
            onClick={() => setActiveTab('learning')}
          >
            Learning Portal
          </button>
          <button 
            className={`nav-tab ${activeTab === 'assessments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assessments')}
          >
            Assessments
          </button>
          <button 
            className={`nav-tab ${activeTab === 'certifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('certifications')}
          >
            Certifications
          </button>
          <button 
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Performance
          </button>
          <button 
            className={`nav-tab ${activeTab === 'ai-insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-insights')}
          >
            🧠 AI Insights
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Loading Screen Component with AI Animation
const LoadingScreen = ({ onComplete }) => {
  const [loadingStage, setLoadingStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const loadingStages = [
    { text: "Initializing FSI Language Training Modules...", duration: 2000 },
    { text: "Loading Cultural Competency Content...", duration: 1500 },
    { text: "Preparing Diplomatic Communication Tools...", duration: 1500 },
    { text: "Activating AI-Powered Language Assessment...", duration: 1500 },
    { text: "Connecting Language Instructors & Students...", duration: 1500 },
    { text: "Welcome to Advanced Diplomatic Language Training", duration: 2000 }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loadingStage < loadingStages.length - 1) {
        setLoadingStage(loadingStage + 1);
        setProgress((loadingStage + 1) * (100 / loadingStages.length));
      } else {
        setTimeout(onComplete, 1000);
      }
    }, loadingStages[loadingStage].duration);

    return () => clearTimeout(timer);
  }, [loadingStage, onComplete]);

  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="logo-animation">
          <img src="/quartermasters-logo.png" alt="Quartermasters" className="animated-logo" />
          <div className="pulse-rings">
            <div className="pulse-ring ring-1"></div>
            <div className="pulse-ring ring-2"></div>
            <div className="pulse-ring ring-3"></div>
          </div>
        </div>
        
        <div className="loading-content">
          <h1 className="brand-title">DIPLOMATIC LANGUAGE PLATFORM</h1>
          <h2 className="platform-subtitle">(DLP)</h2>
          
          <div className="neuro-messaging">
            <div className="ai-badge">
              <span className="ai-icon">AI</span>
              <span>Powered by Advanced AI</span>
            </div>
            <p className="value-proposition">
              Master diplomatic languages with FSI-certified instructors and AI-powered learning
            </p>
          </div>

          <div className="loading-progress">
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>
            <p className="loading-message">{loadingStages[loadingStage].text}</p>
          </div>

          <div className="feature-indicators">
            <div className="indicator">
              <span className="icon">FSI</span>
              <span>FSI Certified Training</span>
            </div>
            <div className="indicator">
              <span className="icon">AI</span>
              <span>AI-Powered Assessment</span>
            </div>
            <div className="indicator">
              <span className="icon">CULT</span>
              <span>Cultural Competency</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Authentication Screen Component
const AuthScreen = ({ onAuthenticate }) => {
  const [authMode, setAuthMode] = useState('welcome'); // welcome, signin, signup
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({});

  const roles = [
    {
      key: 'contractor_admin',
      title: 'Contractor Admin',
      description: 'Manage contracts, instructors, and compliance',
      icon: 'ADMIN',
      benefits: ['Contract Management', 'Instructor Oversight', 'Compliance Reporting', 'Analytics Dashboard']
    },
    {
      key: 'instructor',
      title: 'Instructor',
      description: 'Teach, assess, and track student progress',
      icon: 'TEACH',
      benefits: ['Class Management', 'Student Assessment', 'Resource Library', 'Performance Analytics']
    },
    {
      key: 'student',
      title: 'Student',
      description: 'Learn languages and develop cultural competency',
      icon: 'LEARN',
      benefits: ['Interactive Learning', 'Progress Tracking', 'Cultural Training', 'Assessment Tools']
    }
  ];

  const renderWelcome = () => (
    <div className="auth-welcome">
      <div className="welcome-header">
        <img src="/quartermasters-logo.png" alt="Quartermasters" className="auth-logo" />
        <h1>Welcome to Diplomatic Language Platform</h1>
        <h2>(DLP)</h2>
      </div>

      <div className="value-propositions">
        <div className="value-card">
          <div className="value-icon">SPEED</div>
          <h3>Accelerate Learning</h3>
          <p>AI-powered personalized learning paths reduce training time by 60%</p>
        </div>
        <div className="value-card">
          <div className="value-icon">TARGET</div>
          <h3>Precision Training</h3>
          <p>Role-specific curriculum designed for diplomatic excellence</p>
        </div>
        <div className="value-card">
          <div className="value-icon">ANALYTICS</div>
          <h3>Real-time Analytics</h3>
          <p>Track progress, compliance, and ROI with advanced dashboards</p>
        </div>
      </div>

      <div className="training-features">
        <h3>Advanced Language Training Features</h3>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-badge">FSI</div>
            <h4>FSI-Certified Curriculum</h4>
            <p>Foreign Service Institute approved courses designed for diplomatic excellence</p>
          </div>
          <div className="feature-item">
            <div className="feature-badge">AI</div>
            <h4>AI-Powered Assessment</h4>
            <p>Intelligent evaluation systems that adapt to individual learning styles and progress</p>
          </div>
          <div className="feature-item">
            <div className="feature-badge">CULTURE</div>
            <h4>Cultural Competency Training</h4>
            <p>Deep cultural insights and protocols essential for effective diplomatic communication</p>
          </div>
          <div className="feature-item">
            <div className="feature-badge">IMMERSION</div>
            <h4>Immersive Learning Environment</h4>
            <p>Virtual reality and scenario-based training for real-world diplomatic situations</p>
          </div>
        </div>
      </div>

      <div className="social-proof">
        <h3>Trusted by Leading Organizations</h3>
        <div className="testimonial">
          <p>"Transformed our language training efficiency by 300%. The AI-driven insights are game-changing."</p>
          <span>- Ambassador Sarah Chen, State Department</span>
        </div>
      </div>

      <div className="cta-section">
        <h3>Ready to Transform Your Diplomatic Training?</h3>
        <div className="auth-buttons">
          <button 
            className="btn auth-btn primary"
            onClick={() => setAuthMode('signin')}
          >
            Sign In to Your Account
          </button>
          <button 
            className="btn auth-btn secondary"
            onClick={() => setAuthMode('signup')}
          >
            Request Access
          </button>
        </div>
        <p className="auth-note">
          FedRAMP Authorized • FISMA Compliant • NIST 800-53 Certified
        </p>
      </div>
    </div>
  );

  const renderSignIn = () => (
    <div className="auth-signin">
      <div className="auth-header">
        <button className="btn back-btn" onClick={() => setAuthMode('welcome')}>
          ← Back
        </button>
        <h2>Sign In to Your Account</h2>
        <p>Select your role to access your personalized dashboard</p>
      </div>

      <div className="role-selection">
        <h3>Choose Your Role</h3>
        <div className="role-cards">
          {roles.map(role => (
            <div 
              key={role.key}
              className={`role-card ${selectedRole === role.key ? 'selected' : ''}`}
              onClick={() => setSelectedRole(role.key)}
            >
              <div className="role-icon">{role.icon}</div>
              <h4>{role.title}</h4>
              <p>{role.description}</p>
              <ul className="role-benefits">
                {role.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {selectedRole && (
        <div className="signin-form">
          <h4>Sign In as {roles.find(r => r.key === selectedRole)?.title}</h4>
          <form onSubmit={(e) => {
            e.preventDefault();
            onAuthenticate(mockUserProfiles[selectedRole.replace('_admin', '')]);
          }}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                Keep me signed in
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>
            <button type="submit" className="btn signin-btn primary">
              Access {roles.find(r => r.key === selectedRole)?.title} Dashboard
            </button>
          </form>
        </div>
      )}

      <div className="security-notice">
        <div className="security-badge">
          <span className="security-icon">FISMA</span>
          <div>
            <h5>Federal Security Standards</h5>
            <p>FISMA compliant with NIST 800-53 security controls and CUI protection</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSignUp = () => (
    <div className="auth-signup">
      <div className="auth-header">
        <button className="btn back-btn" onClick={() => setAuthMode('welcome')}>
          ← Back
        </button>
        <h2>Request Platform Access</h2>
        <p>Access to DLP is invitation-only and managed by authorized administrators</p>
      </div>

      <div className="signup-info">
        <div className="access-process">
          <h3>How to Get Access</h3>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Submit Request</h4>
                <p>Provide your organization details and role requirements</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Verification</h4>
                <p>Our team verifies your credentials and organizational needs</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Account Setup</h4>
                <p>Receive personalized onboarding and account configuration</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form">
          <h3>Request Access</h3>
          <form>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" required />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input type="text" required />
              </div>
            </div>
            <div className="form-group">
              <label>Organization *</label>
              <input type="text" placeholder="Embassy, Consulate, or Contracting Company" required />
            </div>
            <div className="form-group">
              <label>Official Email *</label>
              <input type="email" placeholder="Use your official organization email" required />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input type="tel" required />
            </div>
            <div className="form-group">
              <label>Requested Role *</label>
              <select required>
                <option value="">Select your intended role</option>
                <option value="contractor_admin">Contractor Administrator</option>
                <option value="instructor">Language Instructor</option>
                <option value="student">Student/Learner</option>
              </select>
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea 
                placeholder="Describe your training needs and how you plan to use the platform"
                rows="4"
              ></textarea>
            </div>
            <button type="submit" className="btn signup-btn primary">
              Submit Access Request
            </button>
          </form>
        </div>
      </div>

      <div className="platform-benefits">
        <h3>Why Choose Our Platform</h3>
        <div className="benefit-reasons">
          <div className="reason">
            <span className="reason-icon">FSI</span>
            <div>
              <h4>FSI Approved Training</h4>
              <p>Official Foreign Service Institute curriculum and certification</p>
            </div>
          </div>
          <div className="reason">
            <span className="reason-icon">AI</span>
            <div>
              <h4>Personalized Learning</h4>
              <p>AI-driven adaptive learning paths tailored to your diplomatic role</p>
            </div>
          </div>
          <div className="reason">
            <span className="reason-icon">EXPERT</span>
            <div>
              <h4>Expert Instructors</h4>
              <p>Certified language professionals with diplomatic experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-screen">
      <div className="auth-container">
        {authMode === 'welcome' && renderWelcome()}
        {authMode === 'signin' && renderSignIn()}
        {authMode === 'signup' && renderSignUp()}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [appState, setAppState] = useState('loading'); // loading, auth, dashboard
  const [currentUser, setCurrentUser] = useState(null);

  const handleLoadingComplete = () => {
    setAppState('auth');
  };

  const handleAuthentication = (user) => {
    setCurrentUser(user);
    setAppState('dashboard');
  };

  const handleRoleChange = (newUser) => {
    setCurrentUser(newUser);
  };

  const renderDashboard = () => {
    switch (currentUser.role) {
      case 'contractor_admin':
        return <ContractorDashboard user={currentUser} />;
      case 'instructor':
        return <InstructorDashboard user={currentUser} />;
      case 'student':
        return <StudentDashboard user={currentUser} />;
      default:
        return <div>Role not recognized</div>;
    }
  };

  if (appState === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (appState === 'auth') {
    return <AuthScreen onAuthenticate={handleAuthentication} />;
  }

  return (
    <Router>
      <div className="App multi-tenant">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/quartermasters-logo.png" alt="Quartermasters" style={{ height: '32px', width: '32px' }} />
              Diplomatic Language Platform
            </Link>
          </div>
          <div className="nav-user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">{currentUser.role.replace('_', ' ').toUpperCase()}</span>
            <span className="user-org">{currentUser.organization.name}</span>
            <button 
              className="btn logout-btn" 
              onClick={() => {
                setCurrentUser(null);
                setAppState('auth');
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        <main className="main-content">
          <RoleSelector currentUser={currentUser} onRoleChange={handleRoleChange} />
          {renderDashboard()}
        </main>

        <footer className="footer">
          <p>Diplomatic Language Platform (DLP)</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span>Multi-Tenant Solution for GOVCON Language Training Contracts</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
            Developed by Quartermasters FZC
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;