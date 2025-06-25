import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Types
interface User {
  id: number;
  email: string;
  name: string;
  title: string;
  department: string;
  clearanceLevel: string;
}

interface Course {
  id: number;
  title: string;
  language: string;
  level: string;
  duration: string;
  description: string;
  instructor: string;
  rating: number;
}

// Components
const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, coursesRes] = await Promise.all([
          axios.get('http://localhost:3002/api/profile'),
          axios.get('http://localhost:3003/api/courses')
        ]);
        setUser(userRes.data.user);
        setCourses(coursesRes.data.courses);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading Diplomatic Platform...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h1>🏛️ Welcome to the Diplomatic Language Platform</h1>
        {user && (
          <div className="user-info">
            <h2>Welcome, {user.name}</h2>
            <p className="title">{user.title} • {user.department}</p>
            <p className="clearance">Clearance Level: <span className="badge">{user.clearanceLevel}</span></p>
          </div>
        )}
      </div>

      <div className="courses-section">
        <h3>📚 Available Language Courses</h3>
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-header">
                <h4>{course.title}</h4>
                <span className="language-badge">{course.language}</span>
              </div>
              <div className="course-details">
                <p className="level">Level: {course.level}</p>
                <p className="duration">Duration: {course.duration}</p>
                <p className="instructor">Instructor: {course.instructor}</p>
                <div className="rating">
                  Rating: {"⭐".repeat(Math.floor(course.rating))} {course.rating}
                </div>
              </div>
              <p className="description">{course.description}</p>
              <button className="enroll-btn">Enroll Now</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/login', {
        email,
        password
      });
      setMessage(`✅ Login successful! Welcome ${response.data.user.name}`);
    } catch (error) {
      setMessage('❌ Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🏛️ Diplomatic Language Platform</h1>
          <h2>Secure Access Portal</h2>
          <p>For authorized diplomatic personnel only</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="diplomat@state.gov"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="login-btn">
            🔐 Secure Login
          </button>
        </form>

        {message && <div className="message">{message}</div>}
        
        <div className="demo-credentials">
          <h4>Demo Credentials:</h4>
          <p>Email: diplomat@state.gov</p>
          <p>Password: any password</p>
        </div>
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userRes, progressRes] = await Promise.all([
          axios.get('http://localhost:3002/api/profile'),
          axios.get('http://localhost:3002/api/progress')
        ]);
        setUser(userRes.data.user);
        setProgress(progressRes.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  if (!user) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="profile-page">
      <h1>👤 Diplomatic Profile</h1>
      
      <div className="profile-grid">
        <div className="profile-section">
          <h3>Personal Information</h3>
          <div className="info-grid">
            <div><strong>Name:</strong> {user.name}</div>
            <div><strong>Title:</strong> {user.title}</div>
            <div><strong>Department:</strong> {user.department}</div>
            <div><strong>Clearance:</strong> <span className="badge">{user.clearanceLevel}</span></div>
            <div><strong>Assignment:</strong> {user.assignment?.location}</div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Language Portfolio</h3>
          <div className="languages">
            <div><strong>Native:</strong> {user.languages?.native}</div>
            <div><strong>Learning:</strong> {user.languages?.learning?.join(', ')}</div>
            <div className="proficiency">
              <strong>Proficiency Levels:</strong>
              {user.languages?.proficiency && Object.entries(user.languages.proficiency).map(([lang, level]: [string, any]) => (
                <div key={lang} className="proficiency-item">
                  {lang}: <span className="level-badge">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {progress && (
          <div className="profile-section">
            <h3>Learning Progress</h3>
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-number">{progress.overall.coursesCompleted}</span>
                <span className="stat-label">Courses Completed</span>
              </div>
              <div className="stat">
                <span className="stat-number">{progress.overall.hoursStudied}</span>
                <span className="stat-label">Hours Studied</span>
              </div>
              <div className="stat">
                <span className="stat-number">{progress.overall.currentStreak}</span>
                <span className="stat-label">Day Streak</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/">🏛️ Diplomatic Platform</Link>
          </div>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/login">Login</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>🏛️ Diplomatic Language Platform • Built for American Diplomatic Community</p>
          <p>Powered by Quartermasters FZC • Secure • Compliant • Professional</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;