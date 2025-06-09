import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../components/pages/LoginPage';
import DashboardPage from '../components/pages/DashboardPage';
import RegisterPage from '../components/pages/RegisterPage';
import AdminWaitlistPage from '../components/pages/AdminWaitlistPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import WaitlistFormTest from '../components/waitlist/WaitlistFormTest';
import WaitlistForm from '../components/waitlist/WaitlistForm';
import LandingPage from '../components/pages/LandingPage';

// Complete AppRoutes with all necessary routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing and Waitlist routes */}
      <Route path="/" element={<LandingPage />} />
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
  );
};

export default AppRoutes;
