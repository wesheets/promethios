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

  // Navigation items with their respective panel widths
  const navItems: NavItem[] = [
    { key: 'team', label: 'Team', icon: <TeamIcon />, panelWidth: 300, badge: unreadCounts.team },
    { key: 'chats', label: 'Chats', icon: <ChatsIcon />, panelWidth: 300, badge: unreadCounts.chats },
    { key: 'analytics', label: 'Analytics', icon: <AnalyticsIcon />, panelWidth: 400 },
    { key: 'repo', label: 'Repo', icon: <RepoIcon />, panelWidth: 300 },
    { key: 'tools', label: 'Tools', icon: <ToolsIcon />, panelWidth: 300 },
    { key: 'chat_interface', label: 'Chat Interface', icon: <ChatInterfaceIcon />, panelWidth: 300 },
    { key: 'rag_policy', label: 'RAG & Policy', icon: <RagPolicyIcon />, panelWidth: 300 },
    { key: 'token_economics', label: 'Token Economics', icon: <TokenEconomicsIcon />, panelWidth: 400 },
    { key: 'mas_collaboration', label: 'MAS Collaboration', icon: <MasCollaborationIcon />, panelWidth: 400 },
    { key: 'customize', label: 'Customize', icon: <CustomizeIcon />, panelWidth: 400 },
    { key: 'personality', label: 'Personality', icon: <PersonalityIcon />, panelWidth: 400 },
    { key: 'ai_knowledge', label: 'AI Knowledge', icon: <AiKnowledgeIcon />, panelWidth: 400 },
    { key: 'integrations', label: 'Integrations', icon: <IntegrationsIcon />, panelWidth: 400 },
    { key: 'automation', label: 'Automation', icon: <AutomationIcon />, panelWidth: 400 },
    { key: 'receipts', label: 'Receipts', icon: <ReceiptsIcon />, panelWidth: 400 },
    { key: 'memory', label: 'Memory', icon: <MemoryIcon />, panelWidth: 300 },
    { key: 'sandbox', label: 'Sandbox', icon: <SandboxIcon />, panelWidth: 300 },
    { key: 'governance', label: 'Governance', icon: <GovernanceIcon />, panelWidth: 250 },
    { key: 'debug', label: 'Debug', icon: <DebugIcon />, panelWidth: 250 }
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
    const item = navItems.find(item => item.key === activePanel);
    return item?.panelWidth || 300;
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
          {navItems.map((item) => (
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

      {/* Sliding Content Panel */}
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
        {activePanel && (
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
                {navItems.find(item => item.key === activePanel)?.label}
              </Typography>
              <IconButton
                onClick={() => setActivePanel(null)}
                sx={{
                  color: '#94a3b8',
                  '&:hover': { color: 'white' }
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>

            {/* Panel Content */}
            <Box sx={{ 
              flex: 1, 
              overflow: 'hidden'
            }}>
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
        )}
      </Drawer>

      {/* Backdrop for mobile */}
      {isMobile && activePanel && (
        <Box
          onClick={() => setActivePanel(null)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1100
          }}
        />
      )}
    </>
  );
};

export default RightNavigationBar;

