// Add early logging to catch initialization errors
console.log('Starting application initialization...');

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GovernanceProvider } from './context/GovernanceContext';
import { GamificationProvider } from './context/GamificationContext';
import { HoveringObserverProvider } from './context/HoveringObserverContext';
import AnalyticsProvider from './components/common/AnalyticsProvider';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NewLandingPage from './components/landing/NewLandingPage';
import NewHeader from './components/navigation/NewHeader';
import Footer from './components/layout/Footer';

// Create a simplified AppContent component for testing
const SimplifiedAppContent = () => {
  console.log('Rendering SimplifiedAppContent');
  const location = useLocation();
  console.log('Current location:', location);
  
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
          <Route path="*" element={
            <div className="diagnostic-container">
              <h1>Diagnostic Mode</h1>
              <p>Testing with real routes</p>
              <p>Current path: {location.pathname}</p>
            </div>
          } />
        </Routes>
      </div>
      <Footer />
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
  
  // Test with all providers, Router, Routes, and real components
  root.render(
    <React.StrictMode>
      <ErrorBoundary fallback={<div>Error in ThemeProvider</div>}>
        <ThemeProvider>
          <ErrorBoundary fallback={<div>Error in AuthProvider</div>}>
            <AuthProvider>
              <ErrorBoundary fallback={<div>Error in GovernanceProvider</div>}>
                <GovernanceProvider>
                  <ErrorBoundary fallback={<div>Error in GamificationProvider</div>}>
                    <GamificationProvider>
                      <ErrorBoundary fallback={<div>Error in HoveringObserverProvider</div>}>
                        <HoveringObserverProvider>
                          <ErrorBoundary fallback={<div>Error in AnalyticsProvider</div>}>
                            <AnalyticsProvider>
                              <ErrorBoundary fallback={<div>Error in Router</div>}>
                                <Router>
                                  <ErrorBoundary fallback={<div>Error in SimplifiedAppContent</div>}>
                                    <SimplifiedAppContent />
                                  </ErrorBoundary>
                                </Router>
                              </ErrorBoundary>
                            </AnalyticsProvider>
                          </ErrorBoundary>
                        </HoveringObserverProvider>
                      </ErrorBoundary>
                    </GamificationProvider>
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
