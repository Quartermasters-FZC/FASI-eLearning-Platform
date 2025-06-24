/**
 * Main App Component
 * AI-Powered eLearning Platform - Frontend
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Store and Services
import { store } from './store';
import './i18n';

// Components
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Pages (Lazy loaded for better performance)
const Home = React.lazy(() => import('./pages/Home/Home'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Register = React.lazy(() => import('./pages/Auth/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'));
const Courses = React.lazy(() => import('./pages/Courses/Courses'));
const CourseDetail = React.lazy(() => import('./pages/Courses/CourseDetail'));
const LessonView = React.lazy(() => import('./pages/Lessons/LessonView'));
const Profile = React.lazy(() => import('./pages/Profile/Profile'));
const Settings = React.lazy(() => import('./pages/Settings/Settings'));
const NotFound = React.lazy(() => import('./pages/Error/NotFound'));

// Hooks
import { useAuth } from './hooks/useAuth';
import { getCurrentLanguage, getLanguageDirection, isRTL } from './i18n';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 3,
    },
  },
});

// Global styles for multi-language support
const globalStyles = (
  <GlobalStyles
    styles={(theme) => ({
      // Font loading for different scripts
      '@font-face': [
        {
          fontFamily: 'NotoSans',
          src: 'url(/fonts/NotoSans-Regular.woff2) format("woff2")',
          fontWeight: 400,
          fontStyle: 'normal',
          fontDisplay: 'swap',
        },
        {
          fontFamily: 'NotoSansArabic',
          src: 'url(/fonts/NotoSansArabic-Regular.woff2) format("woff2")',
          fontWeight: 400,
          fontStyle: 'normal',
          fontDisplay: 'swap',
          unicodeRange: 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF',
        },
        {
          fontFamily: 'NotoSansCJK',
          src: 'url(/fonts/NotoSansCJK-Regular.woff2) format("woff2")',
          fontWeight: 400,
          fontStyle: 'normal',
          fontDisplay: 'swap',
          unicodeRange: 'U+3000-30FF, U+31F0-31FF, U+4E00-9FFF, U+AC00-D7AF',
        },
        {
          fontFamily: 'NotoSansDevanagari',
          src: 'url(/fonts/NotoSansDevanagari-Regular.woff2) format("woff2")',
          fontWeight: 400,
          fontStyle: 'normal',
          fontDisplay: 'swap',
          unicodeRange: 'U+0900-097F, U+1CD0-1CFF, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF',
        },
      ],
      // Global typography
      '*': {
        boxSizing: 'border-box',
      },
      body: {
        fontFamily: 'NotoSans, "Helvetica Neue", Helvetica, Arial, sans-serif',
        lineHeight: 1.6,
        margin: 0,
        padding: 0,
        fontSize: '16px',
        // Better text rendering
        '-webkit-font-smoothing': 'antialiased',
        '-moz-osx-font-smoothing': 'grayscale',
        textRendering: 'optimizeLegibility',
      },
      // RTL support
      '[dir="rtl"]': {
        fontFamily: 'NotoSansArabic, NotoSans, Arial, sans-serif',
      },
      // Chinese/Japanese/Korean support
      '[lang^="zh"], [lang^="ja"], [lang^="ko"]': {
        fontFamily: 'NotoSansCJK, NotoSans, Arial, sans-serif',
      },
      // Devanagari script support (Hindi, etc.)
      '[lang^="hi"], [lang^="ne"], [lang^="mr"]': {
        fontFamily: 'NotoSansDevanagari, NotoSans, Arial, sans-serif',
      },
      // Accessibility improvements
      ':focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: '2px',
      },
      // Loading states
      '.loading': {
        cursor: 'wait',
      },
      // Text selection
      '::selection': {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.contrastText,
      },
      // Scrollbar styling
      '::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '::-webkit-scrollbar-track': {
        backgroundColor: theme.palette.grey[100],
      },
      '::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.grey[400],
        borderRadius: '4px',
        '&:hover': {
          backgroundColor: theme.palette.grey[600],
        },
      },
    })}
  />
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  const { i18n } = useTranslation();

  // Create theme based on current language
  const theme = React.useMemo(() => {
    const currentLang = getCurrentLanguage();
    const direction = getLanguageDirection(currentLang);
    const isRTLLang = isRTL(currentLang);

    return createTheme({
      direction: direction,
      palette: {
        mode: 'light',
        primary: {
          main: '#1976d2',
          light: '#42a5f5',
          dark: '#1565c0',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#dc004e',
          light: '#ff5983',
          dark: '#9a0036',
          contrastText: '#ffffff',
        },
        background: {
          default: '#f5f5f5',
          paper: '#ffffff',
        },
        text: {
          primary: isRTLLang ? '#1a1a1a' : '#333333',
          secondary: isRTLLang ? '#4a4a4a' : '#666666',
        },
      },
      typography: {
        fontFamily: isRTLLang
          ? 'NotoSansArabic, NotoSans, Arial, sans-serif'
          : currentLang.startsWith('zh') || currentLang.startsWith('ja') || currentLang.startsWith('ko')
          ? 'NotoSansCJK, NotoSans, Arial, sans-serif'
          : currentLang.startsWith('hi') || currentLang.startsWith('ne')
          ? 'NotoSansDevanagari, NotoSans, Arial, sans-serif'
          : 'NotoSans, "Helvetica Neue", Helvetica, Arial, sans-serif',
        h1: {
          fontSize: '2.5rem',
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: isRTLLang ? '0' : '-0.01562em',
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: isRTLLang ? '0' : '-0.00833em',
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 600,
          lineHeight: 1.4,
        },
        body1: {
          fontSize: '1rem',
          lineHeight: isRTLLang ? 1.8 : 1.6,
          letterSpacing: isRTLLang ? '0' : '0.00938em',
        },
        body2: {
          fontSize: '0.875rem',
          lineHeight: isRTLLang ? 1.7 : 1.5,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              direction: direction,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 500,
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      spacing: 8,
    });
  }, [i18n.language]);

  // Update document direction when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      const direction = getLanguageDirection();
      document.documentElement.dir = direction;
      document.documentElement.lang = getCurrentLanguage();
    };

    // Set initial direction
    handleLanguageChange();

    // Listen for language changes
    window.addEventListener('languageChanged', handleLanguageChange);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              {globalStyles}
              <Router>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route
                      path="/login"
                      element={
                        <PublicRoute>
                          <Login />
                        </PublicRoute>
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <PublicRoute>
                          <Register />
                        </PublicRoute>
                      }
                    />
                    
                    {/* Public course browsing */}
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:courseId" element={<CourseDetail />} />

                    {/* Protected Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Dashboard />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-courses"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Courses enrolled={true} />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/lessons/:lessonId"
                      element={
                        <ProtectedRoute>
                          <LessonView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Profile />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Settings />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Catch-all 404 route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </Router>

              {/* Global Toast Notifications */}
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    direction: getLanguageDirection(),
                  },
                  success: {
                    duration: 3000,
                    style: {
                      background: '#4caf50',
                    },
                  },
                  error: {
                    duration: 5000,
                    style: {
                      background: '#f44336',
                    },
                  },
                }}
              />
            </ThemeProvider>
          </QueryClientProvider>
        </Provider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;