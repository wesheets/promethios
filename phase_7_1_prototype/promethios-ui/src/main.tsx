// Add early logging to catch initialization errors
console.log('Starting application initialization...');

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GovernanceProvider } from './context/GovernanceContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NewLandingPage from './components/landing/NewLandingPage';
import NewHeader from './components/navigation/NewHeader';
import Footer from './components/layout/Footer';
import LoginWaitlistPage from './components/auth/LoginWaitlistPage';
import EmailVerification from './components/auth/EmailVerification';
import FeedbackWidget from './components/common/FeedbackWidget';

// Create a simplified AppContent component with real routes
const AppContent = () => {
  console.log('Rendering AppContent with real routes');
  
  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900">
      <NewHeader />
      <div className="flex-grow pt-16">
        <Routes>
          <Route path="/" element={
            <ErrorBoundary fallback={<div>Error in NewLandingPage</div>}>
              <NewLandingPage />
            </ErrorBoundary>
          } />
          <Route path="/signup" element={
            <ErrorBoundary fallback={<div>Error in LoginWaitlistPage</div>}>
              <LoginWaitlistPage />
            </ErrorBoundary>
          } />
          <Route path="/waitlist" element={
            <ErrorBoundary fallback={<div>Error in LoginWaitlistPage</div>}>
              <LoginWaitlistPage />
            </ErrorBoundary>
          } />
          <Route path="/login" element={
            <ErrorBoundary fallback={<div>Error in LoginWaitlistPage</div>}>
              <LoginWaitlistPage />
            </ErrorBoundary>
          } />
          <Route path="/verify-email" element={
            <ErrorBoundary fallback={<div>Error in EmailVerification</div>}>
              <EmailVerification />
            </ErrorBoundary>
          } />
          <Route path="/onboarding" element={
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">Onboarding</h1>
              <p>Onboarding is currently unavailable. Please check back later.</p>
            </div>
          } />
          <Route path="/dashboard" element={
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
              <p>Dashboard is currently unavailable. Please check back later.</p>
            </div>
          } />
          <Route path="/ui/*" element={
            <ErrorBoundary fallback={<div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">UI Integration Error</h1>
              <p>An error occurred while loading the UI Integration.</p>
              <p>Please try refreshing the page or contact support if the issue persists.</p>
            </div>}>
              {React.createElement(React.lazy(() => import('./UIIntegration')))}
            </ErrorBoundary>
          } />
          <Route path="*" element={
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
              <p>The page you are looking for does not exist.</p>
            </div>
          } />
        </Routes>
      </div>
      <Footer />
      <FeedbackWidget />
    </div>
  );
};

// Log before rendering
console.log('Starting ReactDOM.createRoot...');

try {
  const rootElement = document.getElementById('root');
  console.log('Root element found:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found in the DOM');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  console.log('Root created successfully, about to render...');
  
  // Render with core providers and real components
  root.render(
    <React.StrictMode>
      <ErrorBoundary fallback={<div>Error in ThemeProvider</div>}>
        <ThemeProvider>
          <ErrorBoundary fallback={<div>Error in AuthProvider</div>}>
            <AuthProvider>
              <ErrorBoundary fallback={<div>Error in GovernanceProvider</div>}>
                <GovernanceProvider>
                  <ErrorBoundary fallback={<div>Error in Router</div>}>
                    <Router>
                      <ErrorBoundary fallback={<div>Error in AppContent</div>}>
                        <AppContent />
                      </ErrorBoundary>
                    </Router>
                  </ErrorBoundary>
                </GovernanceProvider>
              </ErrorBoundary>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log('Render completed successfully');
} catch (error) {
  console.error('Error during rendering:', error);
  
  // Try to render a fallback directly to the DOM if React rendering fails
  try {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">
          <h2>React Rendering Error</h2>
          <p>An error occurred during application initialization:</p>
          <pre style="background-color: #f1f1f1; padding: 10px; border-radius: 4px; overflow: auto;">${error?.message || 'Unknown error'}</pre>
          <p>Check the console for more details.</p>
        </div>
      `;
    }
  } catch (fallbackError) {
    console.error('Error rendering fallback UI:', fallbackError);
  }
}
