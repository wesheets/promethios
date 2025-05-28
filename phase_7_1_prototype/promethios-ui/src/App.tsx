import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import DashboardPage from './pages/DashboardPage';
import GovernancePage from './pages/GovernancePage';
import DocumentationPage from './pages/DocumentationPage';
import LoginWaitlistPage from './components/auth/LoginWaitlistPage';
import InteractiveDemoPage from './pages/demo/InteractiveDemoPage';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/login" element={<LoginWaitlistPage />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/governance" 
                element={
                  <ProtectedRoute>
                    <GovernancePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/documentation" 
                element={
                  <ProtectedRoute>
                    <DocumentationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/demo/interactive" 
                element={
                  <ProtectedRoute>
                    <InteractiveDemoPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
