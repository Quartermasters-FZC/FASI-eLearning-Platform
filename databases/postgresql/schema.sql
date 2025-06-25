-- =================================================================
-- AI-POWERED ELEARNING PLATFORM - MULTI-LANGUAGE DATABASE SCHEMA
-- Designed by: Quartermasters FZC Team
-- Support: All 70+ FSI Languages with Universal Script Support
-- =================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =================================================================
-- CORE SYSTEM TABLES
-- =================================================================

-- Languages supported by the platform (70+ FSI Languages)
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    iso_code VARCHAR(10) NOT NULL UNIQUE, -- e.g., 'ur', 'ar', 'zh-CN'
    name_english VARCHAR(100) NOT NULL, -- English name
    name_native VARCHAR(100) NOT NULL, -- Native name in original script
    script_type VARCHAR(50) NOT NULL, -- 'latin', 'arabic', 'chinese', 'cyrillic', etc.
    writing_direction VARCHAR(10) NOT NULL DEFAULT 'ltr', -- 'ltr', 'rtl', 'ttb'
    fsi_category INTEGER NOT NULL CHECK (fsi_category BETWEEN 1 AND 5), -- FSI difficulty category
    is_tonal BOOLEAN DEFAULT FALSE, -- For Chinese, Vietnamese, Thai
    has_cases BOOLEAN DEFAULT FALSE, -- For Russian, German, etc.
    region VARCHAR(50), -- Geographic region
    country_codes TEXT[], -- Array of country codes where spoken
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'beta', 'planned'
    ai_model_version VARCHAR(50), -- Current AI model version for this language
    cultural_context JSONB, -- Cultural notes and context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert core FSI languages
INSERT INTO languages (iso_code, name_english, name_native, script_type, writing_direction, fsi_category, is_tonal, has_cases, region, country_codes) VALUES
-- Category I (Easiest)
('es', 'Spanish', 'Español', 'latin', 'ltr', 1, FALSE, FALSE, 'Europe/Americas', ARRAY['ES', 'MX', 'AR', 'CO']),
('fr', 'French', 'Français', 'latin', 'ltr', 1, FALSE, FALSE, 'Europe/Africa', ARRAY['FR', 'CA', 'BE', 'CH']),
('it', 'Italian', 'Italiano', 'latin', 'ltr', 1, FALSE, FALSE, 'Europe', ARRAY['IT', 'CH', 'SM']),
('pt', 'Portuguese', 'Português', 'latin', 'ltr', 1, FALSE, FALSE, 'Europe/Americas', ARRAY['PT', 'BR', 'AO', 'MZ']),

-- Category II
('de', 'German', 'Deutsch', 'latin', 'ltr', 2, FALSE, TRUE, 'Europe', ARRAY['DE', 'AT', 'CH', 'LI']),
('id', 'Indonesian', 'Bahasa Indonesia', 'latin', 'ltr', 2, FALSE, FALSE, 'Southeast Asia', ARRAY['ID']),

-- Category III
('ru', 'Russian', 'Русский', 'cyrillic', 'ltr', 3, FALSE, TRUE, 'Eastern Europe/Asia', ARRAY['RU', 'BY', 'KZ', 'KG']),
('hi', 'Hindi', 'हिन्दी', 'devanagari', 'ltr', 3, FALSE, TRUE, 'South Asia', ARRAY['IN']),
('ur', 'Urdu', 'اردو', 'arabic', 'rtl', 3, FALSE, TRUE, 'South Asia', ARRAY['PK', 'IN']),
('fa', 'Persian', 'فارسی', 'arabic', 'rtl', 3, FALSE, FALSE, 'Middle East', ARRAY['IR', 'AF', 'TJ']),
('he', 'Hebrew', 'עברית', 'hebrew', 'rtl', 3, FALSE, FALSE, 'Middle East', ARRAY['IL']),
('th', 'Thai', 'ไทย', 'thai', 'ltr', 3, TRUE, FALSE, 'Southeast Asia', ARRAY['TH']),
('vi', 'Vietnamese', 'Tiếng Việt', 'latin', 'ltr', 3, TRUE, FALSE, 'Southeast Asia', ARRAY['VN']),

-- Category IV (Most Difficult)
('ar', 'Arabic', 'العربية', 'arabic', 'rtl', 4, FALSE, TRUE, 'Middle East/North Africa', ARRAY['SA', 'EG', 'AE', 'JO']),
('zh-CN', 'Chinese (Mandarin)', '中文', 'chinese', 'ltr', 4, TRUE, FALSE, 'East Asia', ARRAY['CN', 'TW', 'SG']),
('ja', 'Japanese', '日本語', 'japanese', 'ltr', 4, FALSE, FALSE, 'East Asia', ARRAY['JP']),
('ko', 'Korean', '한국어', 'korean', 'ltr', 4, FALSE, FALSE, 'East Asia', ARRAY['KR']);

-- =================================================================
-- USER MANAGEMENT TABLES
-- =================================================================

-- User types and roles
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin', 'super_admin', 'cor');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

-- Core users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    status user_status NOT NULL DEFAULT 'pending_verification',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    avatar_url TEXT,
    phone VARCHAR(50),
    government_id VARCHAR(100), -- For government employees
    security_clearance VARCHAR(50), -- Security clearance level
    organization VARCHAR(200), -- U.S. Embassy, etc.
    department VARCHAR(200), -- Consular, Administrative, etc.
    job_title VARCHAR(200),
    preferred_language_id UUID REFERENCES languages(id),
    timezone VARCHAR(50) DEFAULT 'UTC',
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User language preferences and progress
CREATE TABLE user_languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'learning', 'teaching', 'native'
    current_fsi_speaking_level DECIMAL(2,1), -- 0.0 to 5.0 (S-0 to S-5)
    current_fsi_reading_level DECIMAL(2,1), -- 0.0 to 5.0 (R-0 to R-5)
    current_fsi_listening_level DECIMAL(2,1), -- 0.0 to 5.0 (L-0 to L-5)
    current_fsi_writing_level DECIMAL(2,1), -- 0.0 to 5.0 (W-0 to W-5)
    target_fsi_speaking_level DECIMAL(2,1),
    target_fsi_reading_level DECIMAL(2,1),
    target_fsi_listening_level DECIMAL(2,1),
    target_fsi_writing_level DECIMAL(2,1),
    proficiency_test_date DATE,
    certification_status VARCHAR(50), -- 'pending', 'certified', 'expired'
    learning_goals TEXT[],
    preferred_learning_style VARCHAR(50), -- 'visual', 'auditory', 'kinesthetic', 'mixed'
    daily_study_time_minutes INTEGER DEFAULT 30,
    is_primary BOOLEAN DEFAULT FALSE,
    started_learning_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, language_id, role)
);

-- =================================================================
-- COURSE AND CONTENT MANAGEMENT
-- =================================================================

-- Course categories aligned with FSI structure
CREATE TABLE course_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert FSI-aligned course categories
INSERT INTO course_categories (name, description) VALUES
('Survival Language', 'Basic survival language skills for immediate needs'),
('Beginner Level', 'Foundational language skills and basic communication'),
('Intermediate Level', 'Expanded vocabulary and complex sentence structures'),
('Advanced Level', 'Professional proficiency and nuanced communication'),
('Specialized Courses', 'Job-specific and specialized professional language'),
('Cultural Training', 'Cultural awareness and context understanding'),
('Test Preparation', 'FSI proficiency test preparation'),
('Professional Development', 'Advanced professional and diplomatic language');

-- Courses table with multi-language support
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    short_description VARCHAR(1000),
    language_id UUID NOT NULL REFERENCES languages(id),
    category_id UUID NOT NULL REFERENCES course_categories(id),
    instructor_id UUID NOT NULL REFERENCES users(id),
    level VARCHAR(50) NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'specialized'
    fsi_level_min DECIMAL(2,1), -- Minimum FSI level required
    fsi_level_max DECIMAL(2,1), -- Maximum FSI level targeted
    duration_weeks INTEGER,
    estimated_hours DECIMAL(5,2),
    max_students INTEGER DEFAULT 20,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    course_image_url TEXT,
    course_video_url TEXT,
    syllabus_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    enrollment_start_date TIMESTAMP WITH TIME ZONE,
    enrollment_end_date TIMESTAMP WITH TIME ZONE,
    course_start_date TIMESTAMP WITH TIME ZONE,
    course_end_date TIMESTAMP WITH TIME ZONE,
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_model_version VARCHAR(50),
    content_version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course modules/chapters
CREATE TABLE course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    module_number INTEGER NOT NULL,
    estimated_duration_minutes INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    unlock_conditions JSONB, -- Conditions to unlock this module
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, module_number)
);

-- Individual lessons within modules
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    lesson_number INTEGER NOT NULL,
    lesson_type VARCHAR(50) NOT NULL, -- 'video', 'audio', 'text', 'interactive', 'exercise'
    content_url TEXT,
    content_data JSONB, -- Structured lesson content
    transcript TEXT, -- For audio/video lessons
    estimated_duration_minutes INTEGER,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    learning_objectives TEXT[],
    vocabulary_focus TEXT[], -- Key vocabulary words
    grammar_focus TEXT[], -- Grammar points covered
    cultural_notes TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_analysis_data JSONB, -- AI analysis of lesson content
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(module_id, lesson_number)
);

-- =================================================================
-- ASSESSMENT AND PROGRESS TRACKING
-- =================================================================

-- Assessment types
CREATE TYPE assessment_type AS ENUM ('quiz', 'test', 'oral_exam', 'writing_assignment', 'listening_test', 'speaking_test');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'fill_blank', 'essay', 'audio_response', 'speaking', 'matching');

-- Assessments
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    course_id UUID REFERENCES courses(id),
    module_id UUID REFERENCES course_modules(id),
    lesson_id UUID REFERENCES lessons(id),
    assessment_type assessment_type NOT NULL,
    language_id UUID NOT NULL REFERENCES languages(id),
    fsi_skill_focus VARCHAR(20), -- 'speaking', 'reading', 'listening', 'writing'
    fsi_level_target DECIMAL(2,1),
    max_score DECIMAL(8,2) DEFAULT 100.00,
    passing_score DECIMAL(8,2) DEFAULT 70.00,
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 3,
    instructions TEXT,
    grading_criteria JSONB,
    ai_graded BOOLEAN DEFAULT FALSE,
    ai_model_version VARCHAR(50),
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment questions
CREATE TABLE assessment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type question_type NOT NULL,
    question_text TEXT NOT NULL,
    question_audio_url TEXT,
    question_image_url TEXT,
    options JSONB, -- For multiple choice, matching, etc.
    correct_answer TEXT,
    explanation TEXT,
    points DECIMAL(5,2) DEFAULT 1.00,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    tags TEXT[],
    ai_generated BOOLEAN DEFAULT FALSE,
    cultural_context TEXT,
    pronunciation_guide TEXT, -- For pronunciation-focused questions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assessment_id, question_number)
);

-- Student assessment attempts and responses
CREATE TABLE student_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    attempt_number INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(8,2),
    max_score DECIMAL(8,2),
    percentage_score DECIMAL(5,2),
    fsi_level_achieved DECIMAL(2,1),
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'submitted', 'graded', 'expired'
    time_spent_minutes INTEGER,
    ai_feedback JSONB, -- AI-generated feedback
    instructor_feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(student_id, assessment_id, attempt_number)
);

-- Individual question responses
CREATE TABLE student_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_assessment_id UUID NOT NULL REFERENCES student_assessments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id),
    response_text TEXT,
    response_audio_url TEXT, -- For speaking responses
    response_data JSONB, -- Structured response data
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2),
    ai_analysis JSONB, -- AI analysis of response (pronunciation, grammar, etc.)
    feedback TEXT,
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- AI LEARNING ANALYTICS AND PERSONALIZATION
-- =================================================================

-- Student learning patterns and AI insights
CREATE TABLE learning_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    language_id UUID NOT NULL REFERENCES languages(id),
    analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
    study_time_minutes INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    assessments_taken INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    fsi_progress_delta DECIMAL(3,2), -- Progress change
    engagement_score INTEGER CHECK (engagement_score BETWEEN 0 AND 100),
    difficulty_preference INTEGER CHECK (difficulty_preference BETWEEN 1 AND 5),
    learning_velocity DECIMAL(5,2), -- Lessons per week
    retention_rate DECIMAL(5,2), -- Percentage of material retained
    prediction_accuracy DECIMAL(5,2), -- How accurate AI predictions were
    recommended_study_time INTEGER, -- AI-recommended daily study time
    risk_factors TEXT[], -- AI-identified risk factors
    improvement_suggestions TEXT[], -- AI suggestions
    ai_model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, language_id, analytics_date)
);

-- AI-generated learning paths
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    language_id UUID NOT NULL REFERENCES languages(id),
    path_name VARCHAR(200) NOT NULL,
    current_fsi_level DECIMAL(2,1),
    target_fsi_level DECIMAL(2,1),
    estimated_completion_weeks INTEGER,
    path_data JSONB NOT NULL, -- Detailed learning path structure
    ai_generated BOOLEAN DEFAULT TRUE,
    ai_model_version VARCHAR(50),
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- VIRTUAL CLASSROOM AND COMMUNICATION
-- =================================================================

-- Virtual classroom sessions
CREATE TABLE classroom_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id),
    instructor_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    session_type VARCHAR(50) DEFAULT 'live_class', -- 'live_class', 'office_hours', 'practice_session'
    language_id UUID NOT NULL REFERENCES languages(id),
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER DEFAULT 20,
    meeting_url TEXT, -- Video conference URL
    meeting_id VARCHAR(200),
    meeting_password VARCHAR(100),
    recording_url TEXT,
    session_notes TEXT,
    attendance_required BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session attendance tracking
CREATE TABLE session_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES classroom_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    attendance_status VARCHAR(20), -- 'present', 'absent', 'late', 'excused'
    participation_score INTEGER CHECK (participation_score BETWEEN 0 AND 100),
    ai_engagement_analysis JSONB, -- AI analysis of participation
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- =================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =================================================================

-- User and authentication indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_organization ON users(organization);
CREATE INDEX idx_user_languages_user_id ON user_languages(user_id);
CREATE INDEX idx_user_languages_language_id ON user_languages(language_id);

-- Course and content indexes
CREATE INDEX idx_courses_language_id ON courses(language_id);
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX idx_lessons_module_id ON lessons(module_id);

-- Assessment indexes
CREATE INDEX idx_assessments_course_id ON assessments(course_id);
CREATE INDEX idx_assessments_language_id ON assessments(language_id);
CREATE INDEX idx_student_assessments_student_id ON student_assessments(student_id);
CREATE INDEX idx_student_assessments_assessment_id ON student_assessments(assessment_id);

-- Analytics indexes
CREATE INDEX idx_learning_analytics_user_language ON learning_analytics(user_id, language_id);
CREATE INDEX idx_learning_analytics_date ON learning_analytics(analytics_date);
CREATE INDEX idx_learning_paths_user_id ON learning_paths(user_id);

-- Full-text search indexes
CREATE INDEX idx_courses_title_search ON courses USING gin(to_tsvector('english', title));
CREATE INDEX idx_lessons_content_search ON lessons USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- =================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- INITIAL DATA SETUP
-- =================================================================

-- Create default admin user (password: TempAdmin123!)
INSERT INTO users (email, username, password_hash, role, status, first_name, last_name, display_name) VALUES
('admin@quartermasters.me', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdYoB1b3T8HyW', 'super_admin', 'active', 'System', 'Administrator', 'System Admin');

-- =================================================================
-- COMMENTS AND DOCUMENTATION
-- =================================================================

COMMENT ON TABLE languages IS 'Comprehensive language support table for all 70+ FSI languages with script and cultural metadata';
COMMENT ON TABLE users IS 'Core user management with government employee support and security clearance tracking';
COMMENT ON TABLE user_languages IS 'User language relationships with FSI proficiency tracking and learning goals';
COMMENT ON TABLE courses IS 'Multi-language course catalog with FSI alignment and AI content generation support';
COMMENT ON TABLE assessments IS 'Comprehensive assessment system with AI grading and FSI skill evaluation';
COMMENT ON TABLE learning_analytics IS 'AI-powered learning analytics for personalized education and progress prediction';
COMMENT ON TABLE classroom_sessions IS 'Virtual classroom management with multi-language session support';

-- End of schema