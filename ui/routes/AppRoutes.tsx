import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import OnboardingLayout from '../layouts/OnboardingLayout';

// Public Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Onboarding Pages
import OnboardingWelcome from '../onboarding/OnboardingWelcome';
import OnboardingGoalSelection from '../onboarding/OnboardingGoalSelection';
import OnboardingGuidedSteps from '../onboarding/OnboardingGuidedSteps';
import OnboardingFeatureHighlights from '../onboarding/OnboardingFeatureHighlights';
import OnboardingComplete from '../onboarding/OnboardingComplete';

// Dashboard Pages
import Dashboard from '../pages/Dashboard';
import AgentWizardPage from '../pages/AgentWizardPage';
import MultiAgentPage from '../pages/MultiAgentPage';
import GovernanceExplorerPage from '../pages/GovernanceExplorerPage';

// Settings Pages
import SettingsProfile from '../pages/settings/SettingsProfile';
import SettingsObserver from '../pages/settings/SettingsObserver';
import SettingsApiKeys from '../pages/settings/SettingsApiKeys';
import SettingsNotifications from '../pages/settings/SettingsNotifications';

// Agent Components
import { MultiAgentWrapper } from '../multi-agent-wrapper/MultiAgentWrapper';
import { AgentWrapper } from '../agent-wrapper/AgentWrapper';
import MyAgentsPage from '../pages/MyAgentsPage';

// Error Pages
import NotFoundPage from '../pages/NotFoundPage';

/**
 * PrivateRoute Component
 * 
 * Wrapper for routes that require authentication.
 * Redirects to login if user is not authenticated.
 */
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user, loading } = useAuth();
  
  // Show loading state while auth state is being determined
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Render the protected component if authenticated
  return element;
};

/**
 * OnboardingRoute Component
 * 
 * Wrapper for onboarding routes.
 * Redirects to dashboard if user has completed onboarding.
 */
const OnboardingRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user, loading, hasCompletedOnboarding } = useAuth();
  
  // Show loading state while auth state is being determined
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Redirect to dashboard if onboarding is complete
  if (hasCompletedOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render the onboarding component if authenticated and onboarding not complete
  return element;
};

/**
 * AppRoutes Component
 * 
 * Main routing component for the application.
 * Handles public, private, and onboarding routes.
 * Now explicitly handles /ui/ prefix for integration with legacy app.
 */
const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="" element={<Navigate to="/auth/login" replace />} />
        </Route>
        
        {/* Onboarding Routes */}
        <Route path="/onboarding" element={
          <OnboardingRoute element={<OnboardingLayout />} />
        }>
          <Route path="welcome" element={<OnboardingWelcome />} />
          <Route path="goals" element={<OnboardingGoalSelection />} />
          <Route path="guided-steps/:stepId" element={<OnboardingGuidedSteps />} />
          <Route path="features" element={<OnboardingFeatureHighlights />} />
          <Route path="complete" element={<OnboardingComplete />} />
          <Route path="" element={<Navigate to="/onboarding/welcome" replace />} />
        </Route>
        
        {/* Private Routes - Standard Path */}
        <Route path="/" element={
          <PrivateRoute element={<MainLayout />} />
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="agent-wizard" element={<AgentWizardPage />} />
          <Route path="multi-agent" element={<MultiAgentPage />} />
          <Route path="governance" element={<GovernanceExplorerPage />} />
          
          {/* Agent Routes */}
          <Route path="agents">
            <Route path="multi-wrapping" element={<MultiAgentWrapper />} />
            <Route path="wrapping" element={<AgentWrapper />} />
            <Route path="profiles" element={<MyAgentsPage />} />
            <Route path="" element={<Navigate to="/agents/wrapping" replace />} />
          </Route>
          
          {/* Settings Routes */}
          <Route path="settings">
            <Route path="profile" element={<SettingsProfile />} />
            <Route path="observer" element={<SettingsObserver />} />
            <Route path="api-keys" element={<SettingsApiKeys />} />
            <Route path="notifications" element={<SettingsNotifications />} />
            <Route path="" element={<Navigate to="/settings/profile" replace />} />
          </Route>
          
          {/* Redirect root to dashboard */}
          <Route path="" element={<Navigate to="/dashboard" replace />} />
        </Route>
        
        {/* Private Routes - With /ui/ Prefix for Legacy Integration */}
        <Route path="/ui" element={
          <PrivateRoute element={<MainLayout />} />
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="agent-wizard" element={<AgentWizardPage />} />
          <Route path="multi-agent" element={<MultiAgentPage />} />
          <Route path="governance" element={<GovernanceExplorerPage />} />
          
          {/* Agent Routes */}
          <Route path="agents">
            <Route path="multi-wrapping" element={<MultiAgentWrapper />} />
            <Route path="wrapping" element={<AgentWrapper />} />
            <Route path="profiles" element={<MyAgentsPage />} />
            <Route path="" element={<Navigate to="/ui/agents/wrapping" replace />} />
          </Route>
          
          {/* Settings Routes */}
          <Route path="settings">
            <Route path="profile" element={<SettingsProfile />} />
            <Route path="observer" element={<SettingsObserver />} />
            <Route path="api-keys" element={<SettingsApiKeys />} />
            <Route path="notifications" element={<SettingsNotifications />} />
            <Route path="" element={<Navigate to="/ui/settings/profile" replace />} />
          </Route>
          
          {/* Redirect root to dashboard */}
          <Route path="" element={<Navigate to="/ui/dashboard" replace />} />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
