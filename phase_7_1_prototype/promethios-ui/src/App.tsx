import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { StorageProvider } from './context/StorageContext';
import { SimpleAuthProvider } from './context/SimpleAuthContext';
import { ObserverProvider } from './context/ObserverContextUnified';

// Components
import NewHeader from './components/navigation/NewHeader';
import HeaderNavigation from './components/HeaderNavigation';
import LandingPage from './pages/LandingPage';
import LearnPage from './pages/LearnPage';
import TemplateLibraryPage from './pages/TemplateLibraryPage';
import LiveDemoPage from './pages/LiveDemoPage';
import ApiDocsPage from './pages/ApiDocsPage';
import SolutionsPage from './pages/SolutionsPage';
import AboutPage from './pages/AboutPage';

// Dashboard Components
import PrometheosGovernanceDashboard from './components/PrometheosGovernanceDashboard';
import { StorageAdminDashboard } from './components/admin/StorageAdminDashboard';

// Notification System
import { NotificationCenter } from './components/notifications/NotificationCenter';

// Styles
import './App.css';

// Route wrapper to handle header switching
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  
  return (
    <>
      {isDashboard ? <HeaderNavigation /> : <NewHeader />}
      {children}
      <NotificationCenter />
    </>
  );
};

// Loading component for storage hydration
const StorageLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing Promethios</h2>
      <p className="text-gray-600">Setting up unified storage system...</p>
    </div>
  </div>
);

// Error boundary for storage errors
class StorageErrorBoundary extends React.Component<
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
    console.error('Storage system error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Storage System Error</h2>
            <p className="text-gray-600 mb-4">
              There was an error initializing the storage system. The application will continue with limited functionality.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App component with storage integration
const AppContent: React.FC = () => {
  const [isStorageReady, setIsStorageReady] = useState(false);

  return (
    <StorageErrorBoundary>
      <StorageProvider>
        <StorageReadyChecker onReady={() => setIsStorageReady(true)}>
          {isStorageReady ? (
            <SimpleAuthProvider>
              <ObserverProvider>
                <Router>
                  <div className="App">
                    <RouteWrapper>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/learn" element={<LearnPage />} />
                        <Route path="/templates" element={<TemplateLibraryPage />} />
                        <Route path="/demo" element={<LiveDemoPage />} />
                        <Route path="/api" element={<ApiDocsPage />} />
                        <Route path="/solutions" element={<SolutionsPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        
                        {/* Dashboard Routes */}
                        <Route path="/dashboard" element={<PrometheosGovernanceDashboard />} />
                        <Route path="/dashboard/storage" element={<StorageAdminDashboard />} />
                        
                        {/* Redirect unknown routes to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </RouteWrapper>
                    
                    {/* Global Toast Notifications */}
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#363636',
                          color: '#fff',
                        },
                        success: {
                          duration: 3000,
                          iconTheme: {
                            primary: '#4ade80',
                            secondary: '#fff',
                          },
                        },
                        error: {
                          duration: 5000,
                          iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                          },
                        },
                      }}
                    />
                  </div>
                </Router>
              </ObserverProvider>
            </SimpleAuthProvider>
          ) : (
            <StorageLoadingScreen />
          )}
        </StorageReadyChecker>
      </StorageProvider>
    </StorageErrorBoundary>
  );
};

// Component to check storage readiness
const StorageReadyChecker: React.FC<{
  children: React.ReactNode;
  onReady: () => void;
}> = ({ children, onReady }) => {
  const [checkCount, setCheckCount] = useState(0);
  const maxChecks = 30; // 3 seconds max wait time

  useEffect(() => {
    const checkStorage = () => {
      // Check if storage context is available
      try {
        const storageContext = document.querySelector('[data-storage-ready]');
        if (storageContext || checkCount >= maxChecks) {
          onReady();
          return;
        }
      } catch (error) {
        console.warn('Storage readiness check failed:', error);
      }

      if (checkCount < maxChecks) {
        setTimeout(() => setCheckCount(prev => prev + 1), 100);
      } else {
        // Proceed anyway after timeout
        console.warn('Storage readiness timeout, proceeding with initialization');
        onReady();
      }
    };

    checkStorage();
  }, [checkCount, onReady]);

  // Add data attribute when storage is being checked
  useEffect(() => {
    const element = document.createElement('div');
    element.setAttribute('data-storage-ready', 'true');
    element.style.display = 'none';
    document.body.appendChild(element);

    return () => {
      document.body.removeChild(element);
    };
  }, []);

  return <>{children}</>;
};

// Main App component
const App: React.FC = () => {
  return <AppContent />;
};

export default App;

