import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ObserverProvider } from './context/ObserverContext';
import MainLayoutProxy from './proxies/MainLayoutProxy';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardProxy from './proxies/DashboardProxy';
import AgentsProxy from './proxies/AgentsProxy';
import GovernanceProxy from './proxies/GovernanceProxy';
import DeployProxy from './proxies/DeployProxy';
import SettingsProxy from './proxies/SettingsProxy';

/**
 * UIIntegration Component with MainLayoutProxy, ProtectedRoute, DashboardProxy,
 * AgentsProxy, GovernanceProxy, DeployProxy, and SettingsProxy
 * 
 * This is an incremental update to the UIIntegration component that adds
 * the AgentsProxy, GovernanceProxy, DeployProxy, and SettingsProxy components with robust error handling.
 */
const UIIntegration: React.FC = () => {
  // Add logging for component lifecycle
  console.log('UIIntegration: Component rendering started');
  
  // Add state for error tracking
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Log component mount and unmount
  useEffect(() => {
    console.log('UIIntegration: Component mounted');
    
    return () => {
      console.log('UIIntegration: Component unmounting');
    };
  }, []);
  
  // Error handler function
  const handleError = (error: Error) => {
    console.error('UIIntegration: Error caught:', error);
    setHasError(true);
    setErrorMessage(error.message);
  };
  
  // If we've detected an error, show a fallback UI
  if (hasError) {
    return (
      <div className="container mx-auto p-4 bg-red-50 border border-red-200 rounded-md">
        <h1 className="text-2xl font-bold text-red-700 mb-4">Error in UI Integration</h1>
        <p className="mb-2">An error occurred while loading this component:</p>
        <pre className="bg-red-100 p-3 rounded text-red-800 mb-4 overflow-auto">{errorMessage}</pre>
        <button 
          onClick={() => setHasError(false)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  try {
    console.log('UIIntegration: Rendering component tree');
    
    // Using MainLayoutProxy with ProtectedRoute and various proxies with error boundaries
    return (
      <ErrorBoundary fallback={<div className="p-4">Error in ObserverProvider</div>}>
        <ObserverProvider>
          <ErrorBoundary fallback={<div className="p-4">Error in Routes</div>}>
            <Routes>
              {/* Dashboard route with ProtectedRoute, MainLayoutProxy, and DashboardProxy */}
              <Route path="dashboard" element={
                <ErrorBoundary fallback={<div className="p-4">Error in ProtectedRoute</div>}>
                  <ProtectedRoute requireOnboarding={false}>
                    <ErrorBoundary fallback={<div className="p-4">Error in MainLayoutProxy</div>}>
                      <MainLayoutProxy>
                        <ErrorBoundary fallback={<div className="p-4">Error in DashboardProxy</div>}>
                          <DashboardProxy />
                        </ErrorBoundary>
                      </MainLayoutProxy>
                    </ErrorBoundary>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              
              {/* Agents route with ProtectedRoute, MainLayoutProxy, and AgentsProxy */}
              <Route path="agents" element={
                <ErrorBoundary fallback={<div className="p-4">Error in ProtectedRoute</div>}>
                  <ProtectedRoute requireOnboarding={false}>
                    <ErrorBoundary fallback={<div className="p-4">Error in MainLayoutProxy</div>}>
                      <MainLayoutProxy>
                        <ErrorBoundary fallback={<div className="p-4">Error in AgentsProxy</div>}>
                          <AgentsProxy />
                        </ErrorBoundary>
                      </MainLayoutProxy>
                    </ErrorBoundary>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              
              {/* Governance route with ProtectedRoute, MainLayoutProxy, and GovernanceProxy */}
              <Route path="governance" element={
                <ErrorBoundary fallback={<div className="p-4">Error in ProtectedRoute</div>}>
                  <ProtectedRoute requireOnboarding={false}>
                    <ErrorBoundary fallback={<div className="p-4">Error in MainLayoutProxy</div>}>
                      <MainLayoutProxy>
                        <ErrorBoundary fallback={<div className="p-4">Error in GovernanceProxy</div>}>
                          <GovernanceProxy />
                        </ErrorBoundary>
                      </MainLayoutProxy>
                    </ErrorBoundary>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              
              {/* Deploy route with ProtectedRoute, MainLayoutProxy, and DeployProxy */}
              <Route path="deploy" element={
                <ErrorBoundary fallback={<div className="p-4">Error in ProtectedRoute</div>}>
                  <ProtectedRoute requireOnboarding={false}>
                    <ErrorBoundary fallback={<div className="p-4">Error in MainLayoutProxy</div>}>
                      <MainLayoutProxy>
                        <ErrorBoundary fallback={<div className="p-4">Error in DeployProxy</div>}>
                          <DeployProxy />
                        </ErrorBoundary>
                      </MainLayoutProxy>
                    </ErrorBoundary>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              
              {/* Settings route with ProtectedRoute, MainLayoutProxy, and SettingsProxy */}
              <Route path="settings" element={
                <ErrorBoundary fallback={<div className="p-4">Error in ProtectedRoute</div>}>
                  <ProtectedRoute requireOnboarding={false}>
                    <ErrorBoundary fallback={<div className="p-4">Error in MainLayoutProxy</div>}>
                      <MainLayoutProxy>
                        <ErrorBoundary fallback={<div className="p-4">Error in SettingsProxy</div>}>
                          <SettingsProxy />
                        </ErrorBoundary>
                      </MainLayoutProxy>
                    </ErrorBoundary>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              
              {/* Onboarding route without requiring onboarding (to prevent loops) */}
              <Route path="onboarding/*" element={
                <ErrorBoundary fallback={<div className="p-4">Error in Onboarding</div>}>
                  <MainLayoutProxy>
                    <div className="container mx-auto p-4">
                      <h1 className="text-2xl font-bold mb-4">Onboarding</h1>
                      <p>This is a placeholder for the onboarding flow.</p>
                    </div>
                  </MainLayoutProxy>
                </ErrorBoundary>
              } />
              
              {/* Firebase Test route for validation */}
              <Route path="firebase-test" element={
                <ErrorBoundary fallback={<div className="p-4">Error in Firebase Test</div>}>
                  <ProtectedRoute requireOnboarding={false}>
                    <ErrorBoundary fallback={<div className="p-4">Error in MainLayoutProxy</div>}>
                      <MainLayoutProxy>
                        <div className="container mx-auto p-4">
                          <h1 className="text-2xl font-bold mb-4">Firebase Integration Test</h1>
                          <div className="mt-6">
                            {React.createElement(React.lazy(() => import('./components/testing/FirebasePersistenceTest')))}
                          </div>
                        </div>
                      </MainLayoutProxy>
                    </ErrorBoundary>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={
                <Navigate to="dashboard" replace />
              } />
            </Routes>
          </ErrorBoundary>
        </ObserverProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('UIIntegration: Error during render:', error);
    // Handle any synchronous errors during rendering
    handleError(error as Error);
    
    return (
      <div className="container mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h1 className="text-2xl font-bold text-yellow-700 mb-4">Rendering Error</h1>
        <p>An unexpected error occurred while rendering the UI Integration component.</p>
        <p>Please try refreshing the page.</p>
      </div>
    );
  }
};

export default UIIntegration;
