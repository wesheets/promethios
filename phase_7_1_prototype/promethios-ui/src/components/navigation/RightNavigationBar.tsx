import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Badge,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  Group as TeamIcon,
  Chat as ChatsIcon,
  Analytics as AnalyticsIcon,
  Code as RepoIcon,
  Build as ToolsIcon,
  Computer as ChatInterfaceIcon,
  Policy as RagPolicyIcon,
  TrendingUp as TokenEconomicsIcon,
  Handshake as MasCollaborationIcon,
  Palette as CustomizeIcon,
  Psychology as PersonalityIcon,
  AutoAwesome as AiKnowledgeIcon,
  Extension as IntegrationsIcon,
  SmartToy as AutomationIcon,
  Receipt as ReceiptsIcon,
  Memory as MemoryIcon,
  Terminal as SandboxIcon,
  Gavel as GovernanceIcon,
  BugReport as DebugIcon
} from '@mui/icons-material';
import RightPanelContent from './RightPanelContent';

interface RightNavigationBarProps {
  onContentChange?: (content: React.ReactNode) => void;
  onStateChange?: (state: { isCollapsed: boolean; activePanel: string | null; panelWidth: number }) => void;
  unreadCounts?: Record<string, number>;
  // Data props for content rendering
  chatMessages?: any[];
  humanParticipants?: any[];
  sharedConversations?: any[];
  selectedChatbot?: any;
  currentBotState?: any;
}

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  panelWidth: number; // Width when panel opens
  badge?: number;
}

const RightNavigationBar: React.FC<RightNavigationBarProps> = ({
  onContentChange,
  onStateChange,
  unreadCounts = {},
  chatMessages = [],
  humanParticipants = [],
  sharedConversations = [],
  selectedChatbot,
  currentBotState
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Notify parent component of state changes
  useEffect(() => {
    if (onStateChange) {
      // For overlay panels, panelWidth should be 0 since they don't affect layout
      const panelWidth = activePanel && isSideBySidePanel(activePanel) ? 
        navigationItems.find(item => item.key === activePanel)?.panelWidth || 0 : 0;
      onStateChange({
        isCollapsed,
        activePanel,
        panelWidth
      });
    }
  }, [isCollapsed, activePanel, onStateChange]);

  // Navigation items with their respective panel widths
  const navigationItems = [
    { key: 'team', label: 'Team', icon: <TeamIcon />, panelWidth: 600, badge: unreadCounts.team },
    { key: 'chats', label: 'Chats', icon: <ChatsIcon />, panelWidth: 600, badge: unreadCounts.chats },
    { key: 'analytics', label: 'Analytics', icon: <AnalyticsIcon />, panelWidth: 800 },
    { key: 'repo', label: 'Repo', icon: <RepoIcon />, panelWidth: 600 },
    { key: 'tools', label: 'Tools', icon: <ToolsIcon />, panelWidth: 600 },
    { key: 'chat_interface', label: 'Chat Interface', icon: <ChatInterfaceIcon />, panelWidth: 600 },
    { key: 'rag_policy', label: 'RAG & Policy', icon: <RagPolicyIcon />, panelWidth: 600 },
    { key: 'token_economics', label: 'Token Economics', icon: <TokenEconomicsIcon />, panelWidth: 800 },
    { key: 'mas_collaboration', label: 'MAS Collaboration', icon: <MasCollaborationIcon />, panelWidth: 800 },
    { key: 'customize', label: 'Customize', icon: <CustomizeIcon />, panelWidth: 800 },
    { key: 'personality', label: 'Personality', icon: <PersonalityIcon />, panelWidth: 800 },
    { key: 'ai_knowledge', label: 'AI Knowledge', icon: <AiKnowledgeIcon />, panelWidth: 800 },
    { key: 'integrations', label: 'Integrations', icon: <IntegrationsIcon />, panelWidth: 800 },
    { key: 'automation', label: 'Automation', icon: <AutomationIcon />, panelWidth: 800 },
    { key: 'receipts', label: 'Receipts', icon: <ReceiptsIcon />, panelWidth: 800 },
    { key: 'memory', label: 'Memory', icon: <MemoryIcon />, panelWidth: 600 },
    { key: 'sandbox', label: 'Sandbox', icon: <SandboxIcon />, panelWidth: 600 },
    { key: 'governance', label: 'Governance', icon: <GovernanceIcon />, panelWidth: 500 },
    { key: 'debug', label: 'Debug', icon: <DebugIcon />, panelWidth: 500 }
  ];

  const handleNavItemClick = (item: NavItem) => {
    if (activePanel === item.key) {
      // Close panel if clicking the same item
      setActivePanel(null);
    } else {
      // Open new panel
      setActivePanel(item.key);
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      // If collapsing, also close any open panel
      setActivePanel(null);
    }
  };

  const getNavBarWidth = () => {
    if (isMobile) return isCollapsed ? '50px' : '160px';
    return isCollapsed ? '60px' : '200px';
  };

  const getPanelWidth = () => {
    if (!activePanel) return 0;
    const item = navigationItems.find(item => item.key === activePanel);
    return item?.panelWidth || 300;
  };

  // Determine if panel should be side-by-side or overlay
  const isSideBySidePanel = (panelKey: string | null) => {
    return panelKey === 'chats'; // Only Chat History uses side-by-side
  };

  // Get overlay panel width (30-40% of screen)
  const getOverlayPanelWidth = () => {
    return Math.min(Math.max(window.innerWidth * 0.35, 400), 600); // 35% of screen, min 400px, max 600px
  };

  return (
    <>
      {/* Right Navigation Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: getNavBarWidth(),
          bgcolor: '#1e293b',
          borderLeft: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1200,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Toggle Button */}
        <Box sx={{ 
          p: 1, 
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: isCollapsed ? 'center' : 'flex-start'
        }}>
          <IconButton
            onClick={handleToggleCollapse}
            sx={{
              color: '#94a3b8',
              '&:hover': { color: 'white', bgcolor: 'rgba(148, 163, 184, 0.1)' }
            }}
          >
            {isCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
          {!isCollapsed && (
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: '#94a3b8', 
                alignSelf: 'center', 
                ml: 1,
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              PANELS
            </Typography>
          )}
        </Box>

        {/* Navigation Items */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1
        }}>
          {navigationItems.map((item) => (
            <Tooltip 
              key={item.key} 
              title={isCollapsed ? item.label : ''} 
              placement="left"
              arrow
            >
              <Box
                onClick={() => handleNavItemClick(item)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: isCollapsed ? 1 : 2,
                  py: 1.5,
                  mx: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  color: activePanel === item.key ? '#3b82f6' : '#94a3b8',
                  bgcolor: activePanel === item.key ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  '&:hover': {
                    color: '#e2e8f0',
                    bgcolor: 'rgba(148, 163, 184, 0.1)'
                  },
                  transition: 'all 0.2s ease-in-out',
                  minHeight: '40px'
                }}
              >
                <Badge 
                  badgeContent={item.badge || 0} 
                  color="error" 
                  invisible={!item.badge}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6rem',
                      height: '16px',
                      minWidth: '16px'
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px'
                  }}>
                    {item.icon}
                  </Box>
                </Badge>
                
                {!isCollapsed && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      ml: 2, 
                      fontSize: '0.8rem',
                      fontWeight: activePanel === item.key ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.label}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Hybrid Panel Rendering */}
      {activePanel && isSideBySidePanel(activePanel) && (
        /* Side-by-Side Panel (Chat History) */
        <Drawer
          anchor="right"
          open={!!activePanel}
          onClose={() => setActivePanel(null)}
          variant="persistent"
          sx={{
            '& .MuiDrawer-paper': {
              width: getPanelWidth(),
              bgcolor: '#1e293b',
              borderLeft: '1px solid #334155',
              right: getNavBarWidth(),
              height: '100vh',
              overflow: 'hidden',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }
          }}
        >
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Panel Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {navigationItems.find(item => item.key === activePanel)?.label}
              </Typography>
              <IconButton
                onClick={() => setActivePanel(null)}
                sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            {/* Panel Content */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <RightPanelContent
                panelType={activePanel}
                chatMessages={chatMessages}
                humanParticipants={humanParticipants}
                sharedConversations={sharedConversations}
                selectedChatbot={selectedChatbot}
                currentBotState={currentBotState}
              />
            </Box>
          </Box>
        </Drawer>
      )}

      {activePanel && !isSideBySidePanel(activePanel) && (
        /* Overlay Panel (All Others) */
        <>
          {/* Backdrop */}
          <Box
            onClick={() => setActivePanel(null)}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 1300,
              backdropFilter: 'blur(2px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          
          {/* Overlay Panel */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: getOverlayPanelWidth(),
              height: '100vh',
              bgcolor: '#1e293b',
              borderLeft: '1px solid #334155',
              zIndex: 1400,
              display: 'flex',
              flexDirection: 'column',
              transform: 'translateX(0)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Panel Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {navigationItems.find(item => item.key === activePanel)?.label}
              </Typography>
              <IconButton
                onClick={() => setActivePanel(null)}
                sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            {/* Panel Content */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <RightPanelContent
                panelType={activePanel}
                chatMessages={chatMessages}
                humanParticipants={humanParticipants}
                sharedConversations={sharedConversations}
                selectedChatbot={selectedChatbot}
                currentBotState={currentBotState}
              />
            </Box>
          </Box>
        </>
      )}
    </>
  );
};

export default RightNavigationBar;

