import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import NewHeader from './components/navigation/NewHeader';
import Footer from './components/layout/Footer';
import NewLandingPage from './components/landing/NewLandingPage';
import FlameLoader from './components/loading/FlameLoader';
import LoginWaitlistPage from './components/auth/LoginWaitlistPage';
import EmailVerification from './components/auth/EmailVerification';
import OnboardingFlow from './components/auth/OnboardingFlow';
import CMUBenchmarkDashboard from './components/benchmark/CMUBenchmarkDashboard';
// import FeedbackWidget from './components/common/FeedbackWidget';
import AnalyticsProvider from './components/common/AnalyticsProvider';
import InvestorDemoToggle from './components/common/InvestorDemoToggle';
import AdminExportWaitlist from './components/admin/AdminExportWaitlist';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import LearnPage from './pages/LearnPage';
import TemplateLibraryPage from './pages/TemplateLibraryPage';
import LiveDemoPage from './pages/LiveDemoPage';
import MockDashboardPage from './pages/MockDashboardPage';
import SolutionsPage from './pages/SolutionsPage';
import ApiDocsPage from './pages/ApiDocsPage';
import PrometheosGovernancePage from './pages/PrometheosGovernancePage';
import PrometheosGovernanceDashboard from './components/governance-demo/PrometheosGovernanceDashboard';
import DashboardPage from './pages/DashboardPage';
import GovernancePage from './pages/GovernancePage';
import GovernanceOverviewPage from './pages/GovernanceOverviewPage';
import GovernancePoliciesPage from './pages/GovernancePoliciesPage';
// Import Enhanced versions for main routes
import EnhancedGovernanceViolationsPage from './pages/EnhancedGovernanceViolationsPage';
import EnhancedGovernanceReportsPage from './pages/EnhancedGovernanceReportsPage';
import EmotionalVeritasPage from './pages/EmotionalVeritasPage';
import DocumentationPage from './pages/DocumentationPage';
import AtlasDemoPage from './pages/AtlasDemoPage';
import GovernedVsUngoverned from './pages/GovernedVsUngoverned';
import CMUPlaygroundPage from './pages/CMUPlaygroundPage';
import CMUBenchmarkPage from './pages/CMUBenchmarkPage';
import UIIntegration from './UIIntegration';
import PublicProfileHandler from './components/profile/PublicProfileHandler';
import ChatWindowManager from './components/social/ChatWindowManager';

// Create a wrapper component to use the useLocation hook
const AppContent: React.FC = () => {
  // Debug counter to track App re-renders
  const appRenderCountRef = useRef(0);
  appRenderCountRef.current += 1;
  
  console.log(`🚀 [DEBUG] AppContent RENDER #${appRenderCountRef.current}`);
  
  const location = useLocation();
  const [loaderComplete, setLoaderComplete] = useState(false);
  
  // Circuit breaker for App component
  const MAX_APP_RENDERS = 50;
  if (appRenderCountRef.current > MAX_APP_RENDERS) {
    console.error(`🚨 [APP CIRCUIT BREAKER] App has rendered ${appRenderCountRef.current} times - stopping infinite loop`);
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#0f172a',
        color: '#ef4444',
        fontSize: '18px',
        textAlign: 'center'
      }}>
        <div>
          <h2>App Infinite Re-render Detected</h2>
          <p>The application has rendered {appRenderCountRef.current} times.</p>
          <p>Please refresh the page and check the console for debug information.</p>
        </div>
      </div>
    );
  }
  
  console.log(`📍 [DEBUG] Current location: ${location.pathname}`);
  console.log(`🔧 [DEBUG] Location search: ${location.search}`);
  console.log(`🔧 [DEBUG] Location key: ${location.key}`);
  console.log(`🔧 [DEBUG] About to render UIIntegration with key: ${location.pathname}`);
  
  // Define isUIRoute to determine if we're on a UI route
  const isUIRoute = location.pathname.startsWith('/ui');
  
  // Show flame loader only on landing page and if not completed
  const showFlameLoader = location.pathname === '/' && !loaderComplete;
  
  const handleLoaderComplete = () => {
    setLoaderComplete(true);
  };

  // If we're showing the flame loader, render only that
  if (showFlameLoader) {
    return <FlameLoader onComplete={handleLoaderComplete} />;
  }
  
  return (
    <ChatWindowManager>
      <div className="min-h-screen flex flex-col bg-gray-900 text-white">
        {/* Only show NewHeader for non-UI routes */}
        {!isUIRoute && <NewHeader />}
        <div className={`flex-grow bg-gray-900 ${!isUIRoute ? 'pt-16' : ''}`}> {/* Add padding only for non-UI routes */}
                <Routes>
                  <Route path="/" element={<NewLandingPage />} />
                  <Route path="/signup" element={<LoginWaitlistPage />} />
                  <Route path="/waitlist" element={<LoginWaitlistPage />} />
                  <Route path="/login" element={<LoginWaitlistPage />} />
                  <Route path="/verify-email" element={<EmailVerification />} />
                             {/* Redirect legacy routes */}
                  <Route path="/onboarding" element={<Navigate to="/ui/onboarding" replace />} />
                  
                  {/* Main Navigation Pages */}
                  <Route path="/learn" element={<LearnPage />} />
                  <Route path="/templates" element={<TemplateLibraryPage />} />
                  <Route path="/live-demo" element={<LiveDemoPage />} />
                  <Route path="/dashboard" element={<MockDashboardPage />} />
                  <Route path="/solutions" element={<SolutionsPage />} />
                  <Route path="/api-docs" element={<ApiDocsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/template-library" element={<TemplateLibraryPage />} />
                  
                  {/* Governance Routes */}
                  <Route path="/governance" element={<GovernancePage />} />
                  <Route path="/governance/overview" element={<GovernanceOverviewPage />} />
                  <Route path="/governance/policies" element={<GovernancePoliciesPage />} />
                  <Route path="/governance/violations" element={<EnhancedGovernanceViolationsPage />} />
                  <Route path="/governance/reports" element={<EnhancedGovernanceReportsPage />} />
                  <Route path="/governance/emotional-veritas" element={<EmotionalVeritasPage />} />
                  
                  <Route path="/documentation" element={<DocumentationPage />} />
                  <Route path="/demo" element={
                    <>
                      <InvestorDemoToggle />
                      <PrometheosGovernanceDashboard />
                    </>
                  } />
                  <Route path="/governance-demo" element={<PrometheosGovernancePage />} />
                  <Route path="/live-demo" element={<PrometheosGovernancePage />} />
                  {/* Legacy redirects */}
                  <Route path="/benchmark" element={<Navigate to="/demo" replace />} />
                  <Route path="/cmu-benchmark" element={<Navigate to="/demo" replace />} />

                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/atlas-demo" element={<AtlasDemoPage />} />
                  <Route path="/governed-vs-ungoverned" element={<GovernedVsUngoverned />} />
                  <Route path="/cmu-playground" element={<CMUPlaygroundPage />} />
                  <Route path="/admin/export-waitlist" element={<AdminExportWaitlist />} />
                  
                  {/* Public Profile Routes */}
                  <Route path="/in/:username" element={<PublicProfileHandler />} />
                  
                  {/* UI Integration Routes */}
                  <Route path="/ui/*" element={<UIIntegration />} />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
        </div>
        {/* Only show Footer for non-UI routes */}
        {!isUIRoute && <Footer />}
        {/* <FeedbackWidget /> */}
      </div>
    </ChatWindowManager>
  );
};

const App: React.FC = () => {
  console.log('🎯 Main App component is executing!');
  return (
    <AnalyticsProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AnalyticsProvider>
  );
};

export default App;

// Force deployment Fri Jul 25 10:04:04 EDT 2025
