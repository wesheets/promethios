import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { usePanelManager } from '../context/PanelManagerContext';
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
import AgentDockerEnhanced from '../components/layout/AgentDockerEnhanced';

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
  const { openPanel, openPanels } = usePanelManager();

  // Check URL parameters for hiding navigation elements
  const urlParams = new URLSearchParams(location.search);
  const hideNav = urlParams.get('hideNav') === 'true';
  const hideDocker = urlParams.get('hideDocker') === 'true';
  
  console.log("🔍 URL Parameters - hideNav:", hideNav, "hideDocker:", hideDocker);

  // Expandable panel state
  const { 
    isOpen: isPanelOpen, 
    route: panelRoute, 
    width: panelWidth,
    openPanel: openExpandablePanel,
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
      
      {/* Agent Docker - Persistent across all pages (hidden if hideDocker=true) */}
      {!hideDocker && (
        <AgentDockerEnhanced 
          onAddAgent={() => {
            // Navigate to agent creation QuickStart
            console.log('🐳 [AgentDocker] Add agent clicked');
            window.location.href = '/ui/chat/setup/quick-start';
          }}
          onAgentClick={(agentId, agentName) => {
            console.log('🐳 [AgentDocker] Agent clicked:', agentName, agentId);
            // Open Command Center in collaboration panel
            openPanel(`agent-${agentId}`, 'agent-command-center', `${agentName} Command Center`);
          }}
          onBehaviorPrompt={(agentId, agentName, behavior) => {
            console.log('🐳 [AgentDocker] Behavior prompt:', agentName, behavior);
            // You can add behavior prompt logic here
          }}
          maxVisibleAgents={8}
          showBehaviorPrompts={true}
        />
      )}
      
      <Box sx={{ display: 'flex', flex: 1, height: '100vh' }}>
        {/* Collapsible Left Navigation for logged-in users (hidden if hideNav=true) */}
        {!hideNav && (
          <CollapsibleNavigationEnhanced 
            userPermissions={['view']}
            isAdmin={isAdmin}
            onOpenExpandablePanel={openExpandablePanel}
          />
        )}
        
        {/* Expandable Left Panel */}
        <ExpandableLeftPanel
          isOpen={isPanelOpen}
          route={panelRoute}
          width={panelWidth}
          onClose={closePanel}
        />
        
        {/* Main content area - adjust margin to account for collapsible nav and stacking drawers */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: (() => {
              // Calculate margin based on navigation and open panels
              const navWidth = hideNav ? '0px' : (preferences.navigationCollapsed ? '60px' : '260px');
              const collaborationPanelOpen = openPanels.some(p => p.type === 'collaboration');
              const nonCollaborationPanels = openPanels.filter(p => p.type !== 'collaboration');
              
              let totalPanelWidth = 0;
              
              // Add collaboration panel width if open
              if (collaborationPanelOpen) {
                totalPanelWidth += 320;
              }
              
              // Add stacking drawer widths
              if (nonCollaborationPanels.length > 0) {
                const availableWidth = `100vw - ${collaborationPanelOpen ? '320px' : '0px'}`;
                if (nonCollaborationPanels.length === 1) {
                  // Single drawer takes full available space
                  return `calc(${navWidth} + ${collaborationPanelOpen ? '320px' : '0px'} + (${availableWidth}))`;
                } else if (nonCollaborationPanels.length >= 2) {
                  // Two drawers take full available space (50% each)
                  return `calc(${navWidth} + ${collaborationPanelOpen ? '320px' : '0px'} + (${availableWidth}))`;
                }
              }
              
              // Fallback for expandable panel (legacy)
              if (isPanelOpen) {
                return `calc(${navWidth} + 50vw)`;
              }
              
              return navWidth;
            })(),
            pt: '60px', // Add top padding to account for AgentDocker
            px: 0, // Remove all horizontal padding for full-width chat interface
            pb: 0, // Remove bottom padding for full-height chat interface
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


