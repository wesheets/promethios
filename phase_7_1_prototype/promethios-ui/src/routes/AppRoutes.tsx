import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../components/pages/LoginPage';
import DashboardPage from '../components/pages/DashboardPage';
import RegisterPage from '../components/pages/RegisterPage';
import AdminWaitlistPage from '../components/pages/AdminWaitlistPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import WaitlistFormTest from '../components/waitlist/WaitlistFormTest';
import WaitlistForm from '../components/waitlist/WaitlistForm';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// Import the original landing page component
import NewLandingPage from '../components/landing/NewLandingPage';

// Complete AppRoutes with all necessary routes and layout components
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Routes>
          {/* Landing and Waitlist routes */}
          <Route path="/" element={<NewLandingPage />} />
          <Route path="/waitlist" element={<WaitlistForm />} />
          
          {/* Authentication routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/waitlist" element={
            <ProtectedRoute>
              <AdminWaitlistPage />
            </ProtectedRoute>
          } />
          
          {/* Debug routes */}
          <Route path="/debug/waitlist-test" element={<WaitlistFormTest />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default AppRoutes;
