import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FirebaseAuthTest from '../components/debug/FirebaseAuthTest';

// Add the FirebaseAuthTest component to the routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Add Firebase Auth Test route */}
      <Route path="/debug/firebase-auth-test" element={<FirebaseAuthTest />} />
      
      {/* Existing routes */}
      {/* ... other routes ... */}
      
      {/* Redirect to login if no route matches */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
