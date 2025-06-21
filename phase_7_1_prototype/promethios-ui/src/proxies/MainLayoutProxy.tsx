import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useAdminCheck } from '../hooks/useAdminCheck';

// Import navigation components
import NewHeader from '../components/navigation/NewHeader';
import HeaderNavigation from '../components/HeaderNavigation';
import CollapsibleNavigation from '../components/CollapsibleNavigation';
import SimpleObserverAgent from '../components/SimpleObserverAgent';
import TestAuth from '../components/TestAuth';

/**
 * MainLayoutProxy Component
 * 
 * This proxy component serves as a bridge to the navigation system.
 * It conditionally renders different navigation based on authentication state:
 * - Logged-out users: See the existing NewHeader
 * - Logged-in users: See the new HeaderNavigation and CollapsibleNavigation
 */
interface MainLayoutProxyProps {
  children: ReactNode;
}

const MainLayoutProxy: React.FC<MainLayoutProxyProps> = ({ children }) => {
  console.log("MainLayoutProxy rendering...");
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { preferences } = useUserPreferences();
  const { isAdmin } = useAdminCheck();

  // Debug authentication state
  console.log("Current user:", currentUser);
  console.log("Is admin:", isAdmin);
  console.log("Location:", location.pathname);

  // For logged-out users, show existing NewHeader
  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <CssBaseline />
        <NewHeader />
        <TestAuth />
        <Box 
          component="main" 
          sx={{
            mt: '64px', 
            p: 3,
            backgroundColor: '#1a202c',
            minHeight: 'calc(100vh - 64px)',
            color: 'white',
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // For logged-in users, show new navigation
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Header Navigation Bar for logged-in users */}
      <HeaderNavigation 
        isLoggedIn={true}
        userName={currentUser.displayName || currentUser.email || 'User'}
        userRole="User"
        unreadNotifications={0}
      />
      
      {/* Collapsible Left Navigation for logged-in users */}
      <CollapsibleNavigation 
        userPermissions={['view']}
        isAdmin={isAdmin}
      />
      
      {/* Simple Observer Agent Test */}
      <SimpleObserverAgent />
      
      {/* Main content area - adjust margin to account for fixed header and collapsible nav */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px', // Header height
          ml: preferences.navigationCollapsed ? '60px' : '260px',
          transition: theme => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          p: 3,
          backgroundColor: '#1a202c', // Dark background to match the theme
          minHeight: 'calc(100vh - 64px)', // Full height minus header
          color: 'white', // Light text for dark background
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayoutProxy;


