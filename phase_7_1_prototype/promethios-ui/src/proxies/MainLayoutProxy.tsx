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
import Footer from '../components/layout/Footer';
import TestAuth from '../components/TestAuth';
import SuperEnhancedObserverButton from '../components/SuperEnhancedObserverButton';

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
        <Footer />
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      
      {/* Header Navigation Bar for logged-in users */}
      <HeaderNavigation 
        isLoggedIn={true}
        userName={currentUser.displayName || currentUser.email || 'User'}
        userRole="User"
        unreadNotifications={0}
      />
      
      <Box sx={{ display: 'flex', flex: 1, height: 'calc(100vh - 64px)' }}>
        {/* Collapsible Left Navigation for logged-in users */}
        <CollapsibleNavigation 
          userPermissions={['view']}
          isAdmin={isAdmin}
        />
        
        {/* Main content area - adjust margin to account for fixed header and collapsible nav */}
        <Box
          key={location.pathname} // Force re-render on route changes
          component="main"
          sx={{
            flexGrow: 1,
            mt: '64px', // Header height
            ml: preferences.navigationCollapsed ? '60px' : '260px',
            transition: theme => theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            // Remove padding for chat page and other pages to allow full height usage
            p: location.pathname.includes('/chat') || location.pathname.includes('/modern-chat') ? 0 : 2,
            backgroundColor: '#1a202c', // Dark background to match the theme
            height: 'calc(100vh - 64px)', // Exact height minus header - no extra space
            maxHeight: 'calc(100vh - 64px)', // Prevent overflow
            overflow: 'auto', // Allow scrolling within the content area if needed
            color: 'white', // Light text for dark background
          }}
        >
          {children}
        </Box>
      </Box>
      
      {/* Super Enhanced Observer Button - Floating on all pages */}
      <SuperEnhancedObserverButton
        currentContext={location.pathname.replace('/ui/', '')}
        dashboardData={{
          trustScore: '85',
          governanceScore: '78%',
          agentCount: '3',
          violations: '3',
          competence: '92%',
          reliability: '88%',
          honesty: '82%',
          transparency: '79%'
        }}
        hasNotifications={true}
      />
      
      {/* No Footer for logged-in users to prevent chat input positioning issues */}
    </Box>
  );
};

export default MainLayoutProxy;


