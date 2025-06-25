import React, { useState } from 'react';

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
  ]
};

// User Invitation Management Component
export const UserInvitationManagement = () => {
  const [inviteMode, setInviteMode] = useState('overview');
  const [formData, setFormData] = useState({
    email: '',
    role: 'instructor',
    specialization: '',
    location: '',
    notes: ''
  });

  const renderOverview = () => (
    <div className="invitation-overview">
      <div className="invitation-header">
        <h2>User Invitation Management</h2>
        <div className="header-actions">
          <button className="btn secondary" onClick={() => setInviteMode('bulk')}>Bulk Invite</button>
          <button className="btn primary" onClick={() => setInviteMode('single')}>Send Invitation</button>
        </div>
      </div>

      <div className="invitation-stats">
        <div className="stat-card">
          <h3>Pending Invitations</h3>
          <div className="stat-number">{mockInvitations.pending.filter(inv => inv.status === 'pending').length}</div>
          <div className="stat-detail">Awaiting response</div>
        </div>
        <div className="stat-card">
          <h3>Accepted</h3>
          <div className="stat-number">{mockInvitations.pending.filter(inv => inv.status === 'accepted').length}</div>
          <div className="stat-detail">Successfully onboarded</div>
        </div>
        <div className="stat-card">
          <h3>Recently Sent</h3>
          <div className="stat-number">{mockInvitations.sent.length}</div>
          <div className="stat-detail">Last 30 days</div>
        </div>
      </div>

      <div className="invitation-lists">
        <div className="pending-invitations">
          <h3>Pending Invitations</h3>
          <div className="invitation-grid">
            {mockInvitations.pending.map(invitation => (
              <div key={invitation.id} className="invitation-card">
                <div className="invitation-header">
                  <div className="invitation-info">
                    <h4>{invitation.email}</h4>
                    <span className={`role-badge ${invitation.role}`}>{invitation.role}</span>
                  </div>
                  <span className={`status ${invitation.status}`}>{invitation.status}</span>
                </div>
                <div className="invitation-details">
                  <p><strong>Invited by:</strong> {invitation.invitedBy}</p>
                  <p><strong>Date:</strong> {invitation.invitedDate}</p>
                  <p><strong>Expires:</strong> {invitation.expiryDate}</p>
                  {invitation.specialization && (
                    <p><strong>Specialization:</strong> {invitation.specialization}</p>
                  )}
                  {invitation.assignedLocation && (
                    <p><strong>Location:</strong> {invitation.assignedLocation}</p>
                  )}
                  {invitation.diplomaticRank && (
                    <p><strong>Rank:</strong> {invitation.diplomaticRank}</p>
                  )}
                </div>
                <div className="invitation-actions">
                  <button className="btn secondary">View</button>
                  <button className="btn warning">Resend</button>
                  <button className="btn danger">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSingleInvite = () => (
    <div className="single-invite">
      <div className="invite-header">
        <button className="btn secondary" onClick={() => setInviteMode('overview')}>← Back to Overview</button>
        <h2>Send Individual Invitation</h2>
      </div>
      
      <form className="invite-form">
        <div className="form-section">
          <h3>User Information</h3>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="user@organization.com"
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Role</label>
            <select 
              value={formData.role} 
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
              <option value="contractor_admin">Contractor Admin</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Assignment Details</h3>
          {formData.role === 'instructor' && (
            <>
              <div className="form-group">
                <label>Specialization</label>
                <input 
                  type="text" 
                  value={formData.specialization} 
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  placeholder="e.g., Urdu Language & Culture"
                />
              </div>
              <div className="form-group">
                <label>Assigned Location</label>
                <select 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                >
                  <option value="">Select Location</option>
                  <option value="Embassy Islamabad">Embassy Islamabad</option>
                  <option value="Embassy Karachi">Embassy Karachi</option>
                  <option value="Consulate Lahore">Consulate Lahore</option>
                </select>
              </div>
            </>
          )}
          
          <div className="form-group">
            <label>Additional Notes</label>
            <textarea 
              value={formData.notes} 
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Optional notes about the invitation"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={() => setInviteMode('overview')}>Cancel</button>
          <button type="submit" className="btn primary">Send Invitation</button>
        </div>
      </form>
    </div>
  );

  const renderBulkInvite = () => (
    <div className="bulk-invite">
      <div className="invite-header">
        <button className="btn secondary" onClick={() => setInviteMode('overview')}>← Back to Overview</button>
        <h2>Bulk User Invitation</h2>
      </div>
      
      <div className="bulk-options">
        <div className="bulk-method">
          <h3>CSV Upload</h3>
          <p>Upload a CSV file with user information</p>
          <div className="file-upload">
            <input type="file" accept=".csv" />
            <button className="btn secondary">Choose File</button>
          </div>
          <div className="csv-template">
            <p>Download CSV template:</p>
            <button className="btn link">Instructor Template</button>
            <button className="btn link">Student Template</button>
          </div>
        </div>
        
        <div className="bulk-method">
          <h3>Manual Entry</h3>
          <p>Enter multiple email addresses</p>
          <textarea 
            placeholder="Enter email addresses, one per line:
user1@example.com
user2@example.com
user3@example.com"
            rows="8"
          ></textarea>
          <div className="bulk-settings">
            <div className="form-group">
              <label>Default Role</label>
              <select>
                <option value="instructor">Instructor</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div className="form-group">
              <label>Default Location</label>
              <select>
                <option value="">Select Location</option>
                <option value="Embassy Islamabad">Embassy Islamabad</option>
                <option value="Embassy Karachi">Embassy Karachi</option>
                <option value="Consulate Lahore">Consulate Lahore</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bulk-actions">
        <button className="btn secondary" onClick={() => setInviteMode('overview')}>Cancel</button>
        <button className="btn primary">Send Bulk Invitations</button>
      </div>
    </div>
  );

  return (
    <div className="invitation-management">
      {inviteMode === 'overview' && renderOverview()}
      {inviteMode === 'single' && renderSingleInvite()}
      {inviteMode === 'bulk' && renderBulkInvite()}
    </div>
  );
};

// Profile Management Component
export const ProfileManagement = () => {
  const [profileView, setProfileView] = useState('activity');

  const renderActivity = () => (
    <div className="profile-activity">
      <div className="activity-header">
        <h2>Recent Profile Activity</h2>
        <div className="activity-filters">
          <select>
            <option value="all">All Activities</option>
            <option value="profile_update">Profile Updates</option>
            <option value="role_assignment">Role Assignments</option>
            <option value="invitation_accepted">Invitation Accepted</option>
          </select>
          <input type="date" placeholder="Filter by date" />
        </div>
      </div>
      
      <div className="activity-list">
        {mockProfileManagement.recentActivity.map(activity => (
          <div key={activity.id} className="activity-item">
            <div className="activity-icon">
              <span className={`icon ${activity.type}`}></span>
            </div>
            <div className="activity-content">
              <div className="activity-main">
                <h4>{activity.user}</h4>
                <p>{activity.action}</p>
              </div>
              <div className="activity-details">
                <p>{activity.details}</p>
                <span className="timestamp">{activity.timestamp}</span>
              </div>
            </div>
            <div className="activity-actions">
              <button className="btn link">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRoleManagement = () => (
    <div className="role-management">
      <h2>Role & Permission Management</h2>
      
      <div className="role-overview">
        <div className="role-card">
          <h3>Contractor Administrators</h3>
          <div className="role-stats">
            <span className="count">3</span>
            <span className="label">Active Users</span>
          </div>
          <div className="role-permissions">
            <h4>Key Permissions:</h4>
            <ul>
              <li>Manage instructors and students</li>
              <li>View contract analytics</li>
              <li>Generate compliance reports</li>
              <li>Send user invitations</li>
            </ul>
          </div>
          <button className="btn secondary">Manage Role</button>
        </div>
        
        <div className="role-card">
          <h3>Instructors</h3>
          <div className="role-stats">
            <span className="count">12</span>
            <span className="label">Active Users</span>
          </div>
          <div className="role-permissions">
            <h4>Key Permissions:</h4>
            <ul>
              <li>Manage classes and students</li>
              <li>Create and assess content</li>
              <li>Access teaching materials</li>
              <li>Submit performance reports</li>
            </ul>
          </div>
          <button className="btn secondary">Manage Role</button>
        </div>
        
        <div className="role-card">
          <h3>Students</h3>
          <div className="role-stats">
            <span className="count">89</span>
            <span className="label">Active Users</span>
          </div>
          <div className="role-permissions">
            <h4>Key Permissions:</h4>
            <ul>
              <li>Access assigned courses</li>
              <li>Take assessments</li>
              <li>View progress reports</li>
              <li>Access learning resources</li>
            </ul>
          </div>
          <button className="btn secondary">Manage Role</button>
        </div>
      </div>
      
      <div className="permission-matrix">
        <h3>Permission Matrix</h3>
        <div className="matrix-table">
          <table>
            <thead>
              <tr>
                <th>Permission</th>
                <th>Contractor Admin</th>
                <th>Instructor</th>
                <th>Student</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Manage Users</td>
                <td className="permission granted">✓</td>
                <td className="permission denied">✗</td>
                <td className="permission denied">✗</td>
              </tr>
              <tr>
                <td>Create Content</td>
                <td className="permission granted">✓</td>
                <td className="permission granted">✓</td>
                <td className="permission denied">✗</td>
              </tr>
              <tr>
                <td>Take Assessments</td>
                <td className="permission denied">✗</td>
                <td className="permission denied">✗</td>
                <td className="permission granted">✓</td>
              </tr>
              <tr>
                <td>View Analytics</td>
                <td className="permission granted">✓</td>
                <td className="permission limited">Limited</td>
                <td className="permission limited">Personal Only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="profile-management">
      <div className="management-tabs">
        <button 
          className={`tab ${profileView === 'activity' ? 'active' : ''}`}
          onClick={() => setProfileView('activity')}
        >
          Recent Activity
        </button>
        <button 
          className={`tab ${profileView === 'roles' ? 'active' : ''}`}
          onClick={() => setProfileView('roles')}
        >
          Roles & Permissions
        </button>
      </div>
      
      <div className="tab-content">
        {profileView === 'activity' && renderActivity()}
        {profileView === 'roles' && renderRoleManagement()}
      </div>
    </div>
  );
};