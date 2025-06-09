import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FirebaseAuthTest from '../components/debug/FirebaseAuthTest';
import LoginPage from '../components/pages/LoginPage';
import DashboardPage from '../components/pages/DashboardPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Complete AppRoutes with all necessary routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Authentication routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      
      {/* Debug routes */}
      <Route path="/debug/firebase-auth-test" element={<FirebaseAuthTest />} />
      
      {/* Redirect to login if no route matches */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
