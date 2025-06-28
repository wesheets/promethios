import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
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
import GovernanceViolationsPage from './pages/GovernanceViolationsPage';
import GovernanceReportsPage from './pages/GovernanceReportsPage';
import EmotionalVeritasPage from './pages/EmotionalVeritasPage';
import DocumentationPage from './pages/DocumentationPage';
import AtlasDemoPage from './pages/AtlasDemoPage';
import GovernedVsUngoverned from './pages/GovernedVsUngoverned';
import CMUPlaygroundPage from './pages/CMUPlaygroundPage';
import CMUBenchmarkPage from './pages/CMUBenchmarkPage';
import MultiAgentWrappingPage from './pages/MultiAgentWrappingPage';
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
                  <Route path="/governance/violations" element={<GovernanceViolationsPage />} />
                  <Route path="/governance/reports" element={<GovernanceReportsPage />} />
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
                  <Route path="/multi-agent-wrapping" element={<MultiAgentWrappingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/atlas-demo" element={<AtlasDemoPage />} />
                  <Route path="/governed-vs-ungoverned" element={<GovernedVsUngoverned />} />
                  <Route path="/cmu-playground" element={<CMUPlaygroundPage />} />
                  <Route path="/admin/export-waitlist" element={<AdminExportWaitlist />} />
                  
                  {/* UI Integration Routes */}
                  <Route path="/ui/*" element={<UIIntegration />} />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
      </div>
      {/* Only show Footer for non-UI routes */}
      {!isUIRoute && <Footer />}
      <FeedbackWidget />
    </div>
  );
};

const App: React.FC = () => {
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

