import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboardLayout from './admin/AdminDashboardLayout';
import ObserverHoverBubble from './components/ObserverHoverBubble';
import HeaderNavigation from './components/HeaderNavigation';
import './App.css';

function App() {
  // In a real app, this would come from an auth context or similar
  const isLoggedIn = true;
  const userName = "Admin User";
  const userRole = "Administrator";
  const unreadNotifications = 3;

  return (
    <>
      {/* Header Navigation Bar */}
      <HeaderNavigation 
        isLoggedIn={isLoggedIn}
        userName={userName}
        userRole={userRole}
        unreadNotifications={unreadNotifications}
      />
      
      {/* Main content area - add top margin to account for fixed header */}
      <div style={{ marginTop: '60px' }}>
        <Routes>
          {/* Other routes */}
          
          {/* Admin Dashboard Routes - Critical Fix */}
          <Route path="/admin/dashboard/*" element={<AdminDashboardLayout />} />
          
          {/* Other routes */}
        </Routes>
      </div>
      
      {/* Observer Agent Chat Bubble - Uncomment after navigation is fixed */}
      <ObserverHoverBubble />
    </>
  );
}

export default App;
