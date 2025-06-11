import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import AdminDashboardLayout from './admin/AdminDashboardLayout';
import ObserverHoverBubble from './components/ObserverHoverBubble';
import HeaderNavigation from './components/HeaderNavigation';
import CollapsibleNavigation from './components/CollapsibleNavigation';
import './App.css';

// Placeholder components for main routes
const Dashboard = () => <Box sx={{ p: 3 }}>Dashboard Content</Box>;
const AgentsPage = () => <Box sx={{ p: 3 }}>Agents Content</Box>;
const GovernancePage = () => <Box sx={{ p: 3 }}>Governance Content</Box>;
const TrustMetricsPage = () => <Box sx={{ p: 3 }}>Trust Metrics Content</Box>;
const SettingsPage = () => <Box sx={{ p: 3 }}>Settings Content</Box>;
const HelpPage = () => <Box sx={{ p: 3 }}>Help Content</Box>;

function App() {
  // In a real app, these would come from an auth context or similar
  const isLoggedIn = true;
  const userName = "Admin User";
  const userRole = "Administrator";
  const unreadNotifications = 3;
  const isAdmin = true;
  const userPermissions = ['admin', 'edit', 'view'];

  // State to track if navigation is expanded
  const [navExpanded, setNavExpanded] = useState(() => {
    const savedState = localStorage.getItem('navExpanded');
    return savedState !== null ? savedState === 'true' : true;
  });

  // Calculate content margin based on navigation state
  const contentMarginLeft = navExpanded ? '260px' : '60px';

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Header Navigation Bar */}
      <HeaderNavigation 
        isLoggedIn={isLoggedIn}
        userName={userName}
        userRole={userRole}
        unreadNotifications={unreadNotifications}
      />
      
      {/* Collapsible Left Navigation */}
      <CollapsibleNavigation 
        userPermissions={userPermissions}
        isAdmin={isAdmin}
      />
      
      {/* Main content area - adjust margin to account for fixed header and collapsible nav */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px', // Header height
          ml: contentMarginLeft,
          transition: theme => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          p: 3,
        }}
      >
        <Routes>
          {/* Main routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agents/*" element={<AgentsPage />} />
          <Route path="/governance/*" element={<GovernancePage />} />
          <Route path="/trust-metrics/*" element={<TrustMetricsPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
          <Route path="/help/*" element={<HelpPage />} />
          
          {/* Admin Dashboard Routes */}
          <Route path="/admin/dashboard/*" element={<AdminDashboardLayout />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>
      
      {/* Observer Agent Chat Bubble */}
      <ObserverHoverBubble />
    </Box>
  );
}

export default App;
