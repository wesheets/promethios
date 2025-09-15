import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useAdminCheck } from '../hooks/useAdminCheck';

// Import navigation components
import NewHeader from '../components/navigation/NewHeader';
import HeaderNavigation from '../components/HeaderNavigation';
import CollapsibleNavigationEnhanced from '../components/CollapsibleNavigationEnhanced';
import Footer from '../components/layout/Footer';
import TestAuth from '../components/TestAuth';
import SuperEnhancedObserverButton from '../components/SuperEnhancedObserverButton';

// Import expandable panel system
import ExpandableLeftPanel from '../components/layout/ExpandableLeftPanel';
import { useExpandablePanel } from '../hooks/useExpandablePanel';

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

  // Expandable panel state
  const { 
    isOpen: isPanelOpen, 
    route: panelRoute, 
    width: panelWidth,
    openPanel,
    closePanel 
  } = useExpandablePanel();

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
      
      <Box sx={{ display: 'flex', flex: 1, height: '100vh' }}>
        {/* Collapsible Left Navigation for logged-in users */}
        <CollapsibleNavigationEnhanced 
          userPermissions={['view']}
          isAdmin={isAdmin}
          onOpenExpandablePanel={openPanel}
        />
        
        {/* Expandable Left Panel */}
        <ExpandableLeftPanel
          isOpen={isPanelOpen}
          route={panelRoute}
          width={panelWidth}
          onClose={closePanel}
        />
        
        {/* Main content area - adjust margin to account for collapsible nav and expandable panel */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: isPanelOpen 
              ? `calc(${preferences.navigationCollapsed ? '60px' : '260px'} + 600px)` 
              : (preferences.navigationCollapsed ? '60px' : '260px'),
            pt: 0, // Remove top padding since no header
            px: location.pathname.includes('/chat') || location.pathname.includes('/modern-chat') ? 0 : 2,
            pb: location.pathname.includes('/chat') || location.pathname.includes('/modern-chat') ? 0 : 2,
            transition: theme => theme.transitions.create(['margin-left'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            backgroundColor: '#1a202c',
            height: '100%',
            overflow: 'auto',
            color: 'white',
            minHeight: '100vh', // Full height since no header
            position: 'relative',
          }}
        >
          {children}
        </Box>
      </Box>
      
      {/* Hidden for social AI platform focus - Super Enhanced Observer Button */}
      {/* <SuperEnhancedObserverButton
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
      /> */}
      
      {/* No Footer for logged-in users to prevent chat input positioning issues */}
    </Box>
  );
};

export default MainLayoutProxy;


