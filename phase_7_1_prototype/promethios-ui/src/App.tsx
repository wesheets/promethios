import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/landing/Hero';
import Features from './components/landing/Features';
import BenchmarkPreview from './components/landing/BenchmarkPreview';
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

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <Router>
            <div className="min-h-screen flex flex-col dark:bg-gray-900">
              <Header />
              <div className="pt-16 flex-grow"> {/* Add padding to account for fixed header */}
                <Routes>
                  <Route path="/" element={
                    <>
                      <Hero />
                      <Features />
                      <BenchmarkPreview />
                    </>
                  } />
                  <Route path="/signup" element={<LoginWaitlistPage />} />
                  <Route path="/waitlist" element={<LoginWaitlistPage />} />
                  <Route path="/login" element={<LoginWaitlistPage />} />
                  <Route path="/verify-email" element={<EmailVerification />} />
                  <Route path="/onboarding" element={<OnboardingFlow />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
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
                  <Route path="/cmu-playground" element={<CMUPlaygroundPage />} />
                </Routes>
              </div>
              <Footer />
              <FeedbackWidget />
            </div>
          </Router>
        </AnalyticsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
