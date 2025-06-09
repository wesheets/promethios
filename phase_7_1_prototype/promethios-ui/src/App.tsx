import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GovernanceProvider } from './context/GovernanceContext';
import { useAuth } from './context/AuthContext';
import NewHeader from './components/navigation/NewHeader';
import Footer from './components/layout/Footer';
import NewLandingPage from './components/landing/NewLandingPage';
import LoginWaitlistPage from './components/auth/LoginWaitlistPage';
import EmailVerification from './components/auth/EmailVerification';
import OnboardingFlow from './components/auth/OnboardingFlow';
import CMUBenchmarkDashboard from './components/benchmark/CMUBenchmarkDashboard';
import FeedbackWidget from './components/common/FeedbackWidget';
import AnalyticsProvider from './components/common/AnalyticsProvider';
import InvestorDemoToggle from './components/common/InvestorDemoToggle';
import AdminExportWaitlist from './components/admin/AdminExportWaitlist';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import DashboardPage from './pages/DashboardPage';
import GovernancePage from './pages/GovernancePage';
import DocumentationPage from './pages/DocumentationPage';
import AtlasDemoPage from './pages/AtlasDemoPage';
import GovernedVsUngoverned from './pages/GovernedVsUngoverned';
import UIIntegration from './UIIntegration';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Auth-aware wrapper component
const AuthAwareContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const isUIRoute = location.pathname.startsWith('/ui/');
  
  // Handle automatic redirect after successful authentication
  React.useEffect(() => {
    if (currentUser && !loading) {
      // If user is authenticated and on login/waitlist page, redirect to dashboard
      if (location.pathname === '/login' || location.pathname === '/waitlist' || location.pathname === '/signup') {
        console.log('User authenticated, redirecting to dashboard...');
        // Use a timeout to prevent infinite loops
        const timeoutId = setTimeout(() => {
          navigate('/ui/dashboard', { replace: true });
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentUser, loading, location.pathname, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900">
      {/* Only show NewHeader for non-UI routes */}
      {!isUIRoute && <NewHeader />}
      
      <div className={`flex-grow ${!isUIRoute ? 'pt-16' : ''}`}>
        <Routes>
          <Route path="/" element={<NewLandingPage />} />
          <Route path="/signup" element={<LoginWaitlistPage />} />
          <Route path="/waitlist" element={<LoginWaitlistPage />} />
          <Route path="/login" element={<LoginWaitlistPage />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          {/* Redirect old onboarding to new UI onboarding */}
          <Route path="/onboarding" element={<Navigate to="/ui/onboarding" replace />} />
          {/* Redirect to new dashboard implementation */}
          <Route path="/dashboard" element={<Navigate to="/ui/dashboard" replace />} />
          <Route path="/governance" element={<GovernancePage />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/benchmark" element={
            <>
              <InvestorDemoToggle />
              <CMUBenchmarkDashboard />
            </>
          } />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/atlas-demo" element={<AtlasDemoPage />} />
          <Route path="/governed-vs-ungoverned" element={<GovernedVsUngoverned />} />
          <Route path="/comparison-simulator" element={<GovernedVsUngoverned />} />
          <Route path="/admin/waitlist" element={<AdminExportWaitlist />} />
          
          {/* New UI Integration - Render the new UI components for all /ui/ routes */}
          <Route path="/ui/*" element={<UIIntegration />} />
        </Routes>
      </div>
      
      {/* Only show Footer for non-UI routes */}
      {!isUIRoute && <Footer />}
      {!isUIRoute && <FeedbackWidget />}
    </div>
  );
};

// Create a wrapper component to use the useLocation hook
const AppContent: React.FC = () => {
  return (
    <AuthProvider>
      <AuthAwareContent />
    </AuthProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GovernanceProvider>
          <AnalyticsProvider>
            <Router>
              <AppContent />
            </Router>
          </AnalyticsProvider>
        </GovernanceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
