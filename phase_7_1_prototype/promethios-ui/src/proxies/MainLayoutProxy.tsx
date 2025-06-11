import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { useAuth } from '../context/AuthContext';

// Import the new navigation components
import HeaderNavigation from '../../../src/components/HeaderNavigation';
import CollapsibleNavigation from '../../../src/components/CollapsibleNavigation';

/**
 * MainLayoutProxy Component
 * 
 * This proxy component serves as a bridge to the new navigation system.
 * It uses the HeaderNavigation and CollapsibleNavigation components from the main src directory
 * to ensure a consistent navigation experience across the application.
 */
interface MainLayoutProxyProps {
  children: ReactNode;
}

const MainLayoutProxy: React.FC<MainLayoutProxyProps> = ({ children }) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  // Mock data for navigation components - in production, this would come from Firebase
  const userName = currentUser?.displayName || "User";
  const userRole = "User"; // This would come from Firestore user profile
  const unreadNotifications = 0; // This would come from a notifications service
  const isAdmin = true; // This would be determined by user role/permissions
  const userPermissions = ['admin', 'edit', 'view']; // This would come from Firestore user profile
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Header Navigation Bar */}
      <HeaderNavigation 
        isLoggedIn={!!currentUser}
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
          ml: (theme) => {
            const navExpanded = localStorage.getItem('navExpanded');
            return navExpanded !== 'false' ? '260px' : '60px';
          },
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
