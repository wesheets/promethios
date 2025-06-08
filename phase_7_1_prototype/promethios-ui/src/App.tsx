import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
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
import CMUPlaygroundPage from './pages/CMUPlaygroundPage';
import UIIntegration from './UIIntegration';

// Create a wrapper component to use the useLocation hook
const AppContent: React.FC = () => {
  const location = useLocation();
  const isUIRoute = location.pathname.startsWith('/ui/');
  
  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900">
      {/* Only show NewHeader for non-UI routes */}
      {!isUIRoute && <NewHeader />}
      <div className={`flex-grow ${!isUIRoute ? 'pt-16' : ''}`}> {/* Add padding only for non-UI routes */}
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
                  {/* CMU Playground disabled as it's no longer needed */}
                  {/* <Route path="/cmu-playground" element={<CMUPlaygroundPage />} /> */}
                  
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

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <Router>
            <AppContent />
          </Router>
        </AnalyticsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
