import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/layout/Header';
import Hero from './components/landing/Hero';
import Features from './components/landing/Features';
import BenchmarkPreview from './components/landing/BenchmarkPreview';
import SignupForm from './components/auth/SignupForm';
import WaitlistForm from './components/auth/WaitlistForm';
import InviteLogin from './components/auth/InviteLogin';
import EmailVerification from './components/auth/EmailVerification';
import OnboardingFlow from './components/auth/OnboardingFlow';
import CMUBenchmarkDashboard from './components/benchmark/CMUBenchmarkDashboard';
import FeedbackWidget from './components/common/FeedbackWidget';
import AnalyticsProvider from './components/common/AnalyticsProvider';
import InvestorDemoToggle from './components/common/InvestorDemoToggle';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AnalyticsProvider>
        <Router>
          <div className="min-h-screen dark:bg-gray-900">
            <Header />
            <div className="pt-16"> {/* Add padding to account for fixed header */}
              <Routes>
                <Route path="/" element={
                  <>
                    <Hero />
                    <Features />
                    <BenchmarkPreview />
                  </>
                } />
                <Route path="/signup" element={<SignupForm />} />
                <Route path="/waitlist" element={<WaitlistForm />} />
                <Route path="/login" element={<InviteLogin />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/onboarding" element={<OnboardingFlow />} />
                <Route path="/benchmark" element={
                  <>
                    <InvestorDemoToggle />
                    <CMUBenchmarkDashboard />
                  </>
                } />
              </Routes>
            </div>
            <FeedbackWidget />
          </div>
        </Router>
      </AnalyticsProvider>
    </ThemeProvider>
  );
};

export default App;
