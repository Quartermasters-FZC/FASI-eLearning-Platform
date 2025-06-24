/**
 * TypeScript Type Definitions
 * AI-Powered eLearning Platform - Frontend
 */

// =================================================================
// USER TYPES
// =================================================================

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  organization?: string;
  department?: string;
  jobTitle?: string;
  role: UserRole;
  status: UserStatus;
  preferredLanguageId?: string;
  timezone: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  createdAt: Date;
  languages: UserLanguage[];
}

export type UserRole = 'student' | 'instructor' | 'admin' | 'super_admin' | 'cor';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface UserLanguage {
  id: string;
  language: Language;
  role: 'learning' | 'teaching' | 'native';
  isPrimary: boolean;
  currentLevel: FSILevels;
  targetLevel: FSILevels;
  learningGoals: string[];
  preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  dailyStudyTimeMinutes: number;
  startedLearningAt: Date;
  lastActivityAt: Date;
  progress: LanguageProgress;
}

export interface FSILevels {
  speaking?: number;
  reading?: number;
  listening?: number;
  writing?: number;
}

export interface LanguageProgress {
  currentAverage: number;
  targetAverage: number;
  completionPercentage: number;
  skillProgress: {
    speaking: number;
    reading: number;
    listening: number;
    writing: number;
  };
}

// =================================================================
// LANGUAGE TYPES
// =================================================================

export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  scriptType: ScriptType;
  writingDirection: 'ltr' | 'rtl' | 'ttb';
  fsiCategory: number;
  isTonal: boolean;
  hasCases: boolean;
  region: string;
  countryCodes: string[];
  status: 'active' | 'beta' | 'planned';
  userCount?: number;
  difficultyLevel?: string;
  estimatedTimeToFluency?: string;
}

export type ScriptType = 'latin' | 'arabic' | 'chinese' | 'cyrillic' | 'devanagari' | 'hebrew' | 'thai' | 'korean' | 'japanese';

// =================================================================
// COURSE TYPES
// =================================================================

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  slug: string;
  language: Language;
  category: CourseCategory;
  instructor: Instructor;
  level: CourseLevel;
  fsiLevel: {
    min: number;
    max: number;
  };
  duration: {
    weeks?: number;
    estimatedHours?: number;
    totalMinutes?: number;
  };
  maxStudents: number;
  prerequisites: string[];
  learningObjectives: string[];
  courseImageUrl?: string;
  courseVideoUrl?: string;
  syllabusUrl?: string;
  tags: string[];
  price: {
    amount: number;
    currency: string;
  };
  stats: {
    enrolledStudents: number;
    totalModules: number;
    totalLessons: number;
    totalDurationMinutes: number;
  };
  enrollment?: {
    isEnrolled: boolean;
    status?: EnrollmentStatus;
    period: {
      start?: Date;
      end?: Date;
    };
  };
  coursePeriod: {
    start?: Date;
    end?: Date;
  };
  modules?: CourseModule[];
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'specialized';
export type EnrollmentStatus = 'active' | 'completed' | 'suspended' | 'withdrawn';

export interface CourseCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  courseCount?: number;
}

export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  organization?: string;
  jobTitle?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  moduleNumber: number;
  estimatedDurationMinutes?: number;
  lessons: Lesson[];
  progress?: ModuleProgress;
}

export interface ModuleProgress {
  status: ProgressStatus;
  completionPercentage: number;
  timeSpentMinutes: number;
  lastAccessedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// =================================================================
// LESSON TYPES
// =================================================================

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  lessonNumber: number;
  type: LessonType;
  contentUrl?: string;
  contentData?: any;
  transcript?: string;
  estimatedDurationMinutes?: number;
  difficultyLevel: number;
  learningObjectives: string[];
  vocabularyFocus: string[];
  grammarFocus: string[];
  culturalNotes?: string;
  isPublished: boolean;
  progress?: LessonProgress;
}

export type LessonType = 'video' | 'audio' | 'text' | 'interactive' | 'exercise';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface LessonProgress {
  status: ProgressStatus;
  completionPercentage: number;
  timeSpentMinutes: number;
  lastAccessedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// =================================================================
// ASSESSMENT TYPES
// =================================================================

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: AssessmentType;
  language: Language;
  fsiSkillFocus: 'speaking' | 'reading' | 'listening' | 'writing';
  fsiLevelTarget: number;
  maxScore: number;
  passingScore: number;
  timeLimitMinutes?: number;
  maxAttempts: number;
  instructions?: string;
  questions: AssessmentQuestion[];
  isPublished: boolean;
}

export type AssessmentType = 'quiz' | 'test' | 'oral_exam' | 'writing_assignment' | 'listening_test' | 'speaking_test';

export interface AssessmentQuestion {
  id: string;
  questionNumber: number;
  type: QuestionType;
  questionText: string;
  questionAudioUrl?: string;
  questionImageUrl?: string;
  options?: any;
  correctAnswer?: string;
  explanation?: string;
  points: number;
  difficultyLevel: number;
  tags: string[];
  culturalContext?: string;
  pronunciationGuide?: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay' | 'audio_response' | 'speaking' | 'matching';

// =================================================================
// ANALYTICS TYPES
// =================================================================

export interface LearningAnalytics {
  timeframe: string;
  overall: {
    totalStudyTimeMinutes: number;
    totalLessonsCompleted: number;
    totalAssessmentsCompleted: number;
    averageEngagementScore: number;
    averageScore: number;
    streakDays: number;
  };
  byLanguage: LanguageAnalytics[];
  dailyData: DailyAnalytics[];
}

export interface LanguageAnalytics {
  language: {
    code: string;
    name: string;
    nativeName: string;
  };
  totalStudyTime: number;
  totalLessons: number;
  totalAssessments: number;
  averageScore: number;
  progressData: ProgressDataPoint[];
}

export interface DailyAnalytics {
  date: Date;
  totalStudyTime: number;
  lessons: number;
  assessments: number;
  averageScore: number;
  engagementScore: number;
}

export interface ProgressDataPoint {
  date: Date;
  studyTime: number;
  lessons: number;
  assessments: number;
  score: number;
  engagementScore: number;
  fsiProgress: number;
}

// =================================================================
// UI TYPES
// =================================================================

export interface NavigationItem {
  label: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
  requiredRole?: UserRole[];
}

export interface SearchFilters {
  search?: string;
  language?: string;
  category?: string;
  level?: CourseLevel;
  fsiLevel?: number;
  sortBy?: 'created' | 'title' | 'level' | 'duration' | 'students';
  order?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

// =================================================================
// FORM TYPES
// =================================================================

export interface LoginForm {
  email: string;
  password: string;
  twoFactorToken?: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  organization?: string;
  department?: string;
  jobTitle?: string;
  securityClearance?: string;
  governmentId?: string;
}

export interface ProfileUpdateForm {
  firstName?: string;
  lastName?: string;
  phone?: string;
  timezone?: string;
  preferredLanguageId?: string;
  jobTitle?: string;
  department?: string;
}

export interface LanguageAddForm {
  languageId: string;
  role: 'learning' | 'teaching' | 'native';
  targetFsiSpeakingLevel?: number;
  targetFsiReadingLevel?: number;
  targetFsiListeningLevel?: number;
  targetFsiWritingLevel?: number;
  learningGoals: string[];
  preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  dailyStudyTimeMinutes: number;
  isPrimary: boolean;
}

// =================================================================
// THEME TYPES
// =================================================================

export interface ThemeMode {
  mode: 'light' | 'dark';
  primaryColor: string;
  language: string;
  direction: 'ltr' | 'rtl';
}

export interface LanguageSettings {
  interfaceLanguage: string;
  contentLanguages: string[];
  defaultScript: ScriptType;
  showNativeNames: boolean;
  enableTransliteration: boolean;
}

// =================================================================
// NOTIFICATION TYPES
// =================================================================

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  createdAt: Date;
}

// =================================================================
// MEDIA TYPES
// =================================================================

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // for audio/video
  dimensions?: {
    width: number;
    height: number;
  }; // for images/video
  uploadedAt: Date;
}

// =================================================================
// SPEECH RECOGNITION TYPES
// =================================================================

export interface SpeechRecognitionSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
}

export interface PronunciationFeedback {
  overallScore: number;
  wordScores: Array<{
    word: string;
    score: number;
    phonemes: Array<{
      phoneme: string;
      score: number;
    }>;
  }>;
  suggestions: string[];
}