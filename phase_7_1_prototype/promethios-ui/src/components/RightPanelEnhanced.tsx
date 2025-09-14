/**
 * RightPanelEnhanced - Enhanced right panel with team collaboration integration
 * 
 * Extends the existing right panel to include comprehensive team collaboration features
 * while maintaining backward compatibility with all existing functionality.
 * 
 * New Features:
 * - Team collaboration tab with complete team management
 * - Enhanced chat interface with human-to-human messaging
 * - Guest agent session management
 * - Real-time collaboration notifications
 * - Unified collaboration state management
 * 
 * Maintains all existing tabs:
 * - Chats, Analytics, Customize, Personality, AI Knowledge
 * - Tools, Chat Interface, Integrations, RAG + Policy
 * - Automation, Receipts, Memory, Sandbox, Live Agent
 * - Governance, Workflows, Debug
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Typography,
  Divider
} from '@mui/material';
import {
  Chat as ChatIcon,
  Analytics as AnalyticsIcon,
  Palette as PaletteIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  Build as BuildIcon,
  Forum as ForumIcon,
  Extension as ExtensionIcon,
  Policy as PolicyIcon,
  AutoMode as AutoModeIcon,
  Receipt as ReceiptIcon,
  Memory as MemoryIcon,
  Terminal as TerminalIcon,
  SmartToy as SmartToyIcon,
  Security as SecurityIcon,
  AccountTree as AccountTreeIcon,
  BugReport as BugReportIcon,
  Group as GroupIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

// Import existing components (these would be the existing right panel components)
import ChatHistoryPanel from './chat/ChatHistoryPanel';
import AnalyticsPanel from './analytics/AnalyticsPanel';
import CustomizePanel from './customize/CustomizePanel';
import PersonalityPanel from './personality/PersonalityPanel';
import AIKnowledgePanel from './knowledge/AIKnowledgePanel';
import ToolsPanel from './tools/ToolsPanel';
import ChatInterfacePanel from './chat/ChatInterfacePanel';
import IntegrationsPanel from './integrations/IntegrationsPanel';
import RAGPolicyPanel from './rag/RAGPolicyPanel';
import AutomationPanel from './automation/AutomationPanel';
import ReceiptsPanel from './receipts/ReceiptsPanel';
import MemoryPanel from './memory/MemoryPanel';
import SandboxPanel from './sandbox/SandboxPanel';
import LiveAgentPanel from './agent/LiveAgentPanel';
import GovernancePanel from './governance/GovernancePanel';
import WorkflowsPanel from './workflows/WorkflowsPanel';
import DebugPanel from './debug/DebugPanel';

// Import new team collaboration components
import TeamPanel from './team/TeamPanel';
import TabCustomizationModal, { TabConfig } from './TabCustomizationModal';
import { TeamCollaborationIntegrationService, TeamCollaborationState, CollaborationNotification } from '../services/TeamCollaborationIntegrationService';
import { useUserPreferences } from '../hooks/useUserPreferences';

interface RightPanelEnhancedProps {
  userId: string;
  userName: string;
  currentAgentId?: string;
  currentAgentName?: string;
  onClose?: () => void;
  defaultTab?: string;
}

type RightPanelTab = 
  | 'chats' | 'analytics' | 'customize' | 'personality' | 'ai_knowledge'
  | 'tools' | 'chat_interface' | 'integrations' | 'rag_policy'
  | 'automation' | 'receipts' | 'memory' | 'sandbox' | 'live_agent'
  | 'governance' | 'workflows' | 'team' | 'debug';

interface TabConfig {
  id: RightPanelTab;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  badgeCount?: number;
  disabled?: boolean;
  tooltip?: string;
  isNew?: boolean;
}

const RightPanelEnhanced: React.FC<RightPanelEnhancedProps> = ({
  userId,
  userName,
  currentAgentId,
  currentAgentName,
  onClose,
  defaultTab = 'chats'
}) => {
  // Services
  const [collaborationService] = useState(() => TeamCollaborationIntegrationService.getInstance());
  const { preferences, updateRightPanelState } = useUserPreferences();

  // State
  const [activeTab, setActiveTab] = useState<RightPanelTab>(defaultTab as RightPanelTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab customization state
  const [showTabCustomization, setShowTabCustomization] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<string[]>([]);
  
  // Collaboration state
  const [collaborationState, setCollaborationState] = useState<TeamCollaborationState | null>(null);
  const [notifications, setNotifications] = useState<CollaborationNotification[]>([]);
  const [showNotificationSnackbar, setShowNotificationSnackbar] = useState(false);
  const [latestNotification, setLatestNotification] = useState<CollaborationNotification | null>(null);

  // =====================================
  // INITIALIZATION
  // =====================================

  useEffect(() => {
    initializeCollaboration();
    initializeTabPreferences();
    
    // Cleanup on unmount
    return () => {
      collaborationService.cleanupUserSession(userId);
    };
  }, [userId]);

  useEffect(() => {
    // Set up periodic refresh for collaboration state
    const interval = setInterval(() => {
      refreshCollaborationData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  const initializeCollaboration = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize team collaboration
      const state = await collaborationService.initializeUserCollaboration(userId, userName);
      setCollaborationState(state);

      // Load notifications
      const userNotifications = await collaborationService.getUserNotifications(userId);
      setNotifications(userNotifications);

      // Check for new notifications
      checkForNewNotifications(userNotifications);

    } catch (err) {
      console.error('Error initializing collaboration:', err);
      setError('Failed to initialize team collaboration');
    } finally {
      setLoading(false);
    }
  };

  const refreshCollaborationData = async () => {
    try {
      // Refresh collaboration state
      const updatedState = await collaborationService.refreshUserState(userId);
      if (updatedState) {
        setCollaborationState(updatedState);
      }

      // Refresh notifications
      const userNotifications = await collaborationService.getUserNotifications(userId);
      const previousCount = notifications.length;
      setNotifications(userNotifications);

      // Check for new notifications
      if (userNotifications.length > previousCount) {
        checkForNewNotifications(userNotifications);
      }

    } catch (err) {
      console.error('Error refreshing collaboration data:', err);
    }
  };

  const checkForNewNotifications = (userNotifications: CollaborationNotification[]) => {
    const unreadNotifications = userNotifications.filter(n => !n.read);
    if (unreadNotifications.length > 0) {
      const latest = unreadNotifications[0];
      setLatestNotification(latest);
      setShowNotificationSnackbar(true);
    }
  };

  const initializeTabPreferences = () => {
    try {
      // Load tab preferences from localStorage
      const storageKey = `tab_preferences_${userId}`;
      const savedPreferences = localStorage.getItem(storageKey);
      
      // Check if debug mode is enabled
      const isDebugMode = import.meta.env.DEV || 
                         import.meta.env.VITE_SHOW_DEBUG === 'true' || 
                         window.location.search.includes('debug=true');
      
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        // Filter out debug tabs in production
        const filteredPreferences = isDebugMode 
          ? parsedPreferences 
          : parsedPreferences.filter((tabId: string) => tabId !== 'debug');
        setVisibleTabs(filteredPreferences);
      } else {
        // Default: show all tabs except debug in production
        const allTabIds = getAllTabConfigs().map(tab => tab.id);
        const filteredTabIds = isDebugMode 
          ? allTabIds 
          : allTabIds.filter(tabId => tabId !== 'debug');
        setVisibleTabs(filteredTabIds);
      }
    } catch (err) {
      console.error('Error loading tab preferences:', err);
      // Fallback: show all tabs except debug in production
      const allTabIds = getAllTabConfigs().map(tab => tab.id);
      const isDebugMode = import.meta.env.DEV || 
                         import.meta.env.VITE_SHOW_DEBUG === 'true' || 
                         window.location.search.includes('debug=true');
      const filteredTabIds = isDebugMode 
        ? allTabIds 
        : allTabIds.filter(tabId => tabId !== 'debug');
      setVisibleTabs(filteredTabIds);
    }
  };

  // =====================================
  // TAB CONFIGURATION
  // =====================================

  const getAllTabConfigs = (): TabConfig[] => {
    const unreadMessages = collaborationState?.unreadMessages || 0;
    const pendingApprovals = collaborationState?.pendingApprovals.length || 0;
    const unreadNotifications = notifications.filter(n => !n.read).length;

    return [
      {
        id: 'chats',
        label: 'Chats',
        icon: <ChatIcon />,
        component: ChatHistoryPanel,
        category: 'core',
        badgeCount: unreadMessages
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: <AnalyticsIcon />,
        component: AnalyticsPanel,
        category: 'core'
      },
      {
        id: 'customize',
        label: 'Customize',
        icon: <PaletteIcon />,
        component: CustomizePanel,
        category: 'advanced'
      },
      {
        id: 'personality',
        label: 'Personality',
        icon: <PsychologyIcon />,
        component: PersonalityPanel,
        category: 'advanced'
      },
      {
        id: 'ai_knowledge',
        label: 'AI Knowledge',
        icon: <SchoolIcon />,
        component: AIKnowledgePanel,
        category: 'advanced'
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: <BuildIcon />,
        component: ToolsPanel,
        category: 'core'
      },
      {
        id: 'chat_interface',
        label: 'Chat Interface',
        icon: <ForumIcon />,
        component: ChatInterfacePanel,
        category: 'advanced'
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: <ExtensionIcon />,
        component: IntegrationsPanel,
        category: 'advanced'
      },
      {
        id: 'rag_policy',
        label: 'RAG + Policy',
        icon: <PolicyIcon />,
        component: RAGPolicyPanel,
        category: 'enterprise'
      },
      {
        id: 'automation',
        label: 'Automation',
        icon: <AutoModeIcon />,
        component: AutomationPanel,
        category: 'advanced'
      },
      {
        id: 'receipts',
        label: 'Receipts',
        icon: <ReceiptIcon />,
        component: ReceiptsPanel,
        category: 'advanced'
      },
      {
        id: 'memory',
        label: 'Memory',
        icon: <MemoryIcon />,
        component: MemoryPanel,
        category: 'advanced'
      },
      {
        id: 'sandbox',
        label: 'Sandbox',
        icon: <TerminalIcon />,
        component: SandboxPanel,
        category: 'debug'
      },
      {
        id: 'live_agent',
        label: 'Live Agent',
        icon: <SmartToyIcon />,
        component: LiveAgentPanel,
        category: 'core'
      },
      {
        id: 'governance',
        label: 'Governance',
        icon: <SecurityIcon />,
        component: GovernancePanel,
        category: 'enterprise',
        badgeCount: pendingApprovals
      },
      {
        id: 'workflows',
        label: 'Workflows',
        icon: <AccountTreeIcon />,
        component: WorkflowsPanel,
        category: 'enterprise'
      },
      {
        id: 'team',
        label: 'Team',
        icon: <GroupIcon />,
        component: TeamPanel,
        category: 'enterprise',
        badgeCount: unreadNotifications,
        isNew: true,
        tooltip: 'Team Collaboration - NEW!'
      },
      {
        id: 'debug',
        label: 'Debug',
        icon: <BugReportIcon />,
        component: DebugPanel,
        category: 'debug'
      }
    ];
  };

  const getVisibleTabConfigs = (): TabConfig[] => {
    const allTabs = getAllTabConfigs();
    return allTabs.filter(tab => visibleTabs.includes(tab.id));
  };

  // =====================================
  // EVENT HANDLERS
  // =====================================

  const handleTabChange = (event: React.SyntheticEvent, newValue: RightPanelTab) => {
    setActiveTab(newValue);
    
    // Mark team notifications as read when team tab is opened
    if (newValue === 'team') {
      markTeamNotificationsAsRead();
    }
  };

  const markTeamNotificationsAsRead = async () => {
    try {
      const unreadTeamNotifications = notifications.filter(n => !n.read && n.type !== 'message');
      
      for (const notification of unreadTeamNotifications) {
        await collaborationService.markNotificationRead(userId, notification.id);
      }
      
      // Refresh notifications
      const updatedNotifications = await collaborationService.getUserNotifications(userId);
      setNotifications(updatedNotifications);

    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleTabVisibilityChange = (newVisibleTabs: string[]) => {
    setVisibleTabs(newVisibleTabs);
    
    // If current active tab is now hidden, switch to first visible tab
    if (!newVisibleTabs.includes(activeTab)) {
      const firstVisibleTab = newVisibleTabs[0];
      if (firstVisibleTab) {
        setActiveTab(firstVisibleTab as RightPanelTab);
      }
    }
  };

  const handleNotificationClick = () => {
    setActiveTab('team');
    setShowNotificationSnackbar(false);
    
    if (latestNotification) {
      collaborationService.markNotificationRead(userId, latestNotification.id);
    }
  };

  const handleNotificationClose = () => {
    setShowNotificationSnackbar(false);
  };

  // =====================================
  // RENDER METHODS
  // =====================================

  const renderTabLabel = (config: TabConfig) => {
    const label = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {config.icon}
        <Typography variant="caption" sx={{ display: { xs: 'none', md: 'block' } }}>
          {config.label}
        </Typography>
        {config.isNew && (
          <Box
            sx={{
              bgcolor: 'success.main',
              color: 'white',
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: '0.6rem',
              fontWeight: 'bold'
            }}
          >
            NEW
          </Box>
        )}
      </Box>
    );

    if (config.badgeCount && config.badgeCount > 0) {
      return (
        <Badge badgeContent={config.badgeCount} color="error">
          {label}
        </Badge>
      );
    }

    if (config.tooltip) {
      return (
        <Tooltip title={config.tooltip} arrow>
          {label}
        </Tooltip>
      );
    }

    return label;
  };

  const renderActiveTabContent = () => {
    const tabConfigs = getVisibleTabConfigs();
    const activeConfig = tabConfigs.find(config => config.id === activeTab);
    
    if (!activeConfig) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Tab not found
          </Typography>
        </Box>
      );
    }

    const Component = activeConfig.component;
    
    // Pass appropriate props based on component type
    const commonProps = {
      userId,
      userName,
      currentAgentId,
      currentAgentName
    };

    // Special props for team component
    if (activeConfig.id === 'team') {
      return (
        <Component
          {...commonProps}
          collaborationState={collaborationState}
          notifications={notifications}
          onRefresh={refreshCollaborationData}
        />
      );
    }

    return <Component {...commonProps} />;
  };

  // =====================================
  // MAIN RENDER
  // =====================================

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Initializing team collaboration...
        </Typography>
      </Box>
    );
  }

  const tabConfigs = getVisibleTabConfigs();

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      width: preferences.rightPanelCollapsed ? '60px' : '100%',
      minWidth: preferences.rightPanelCollapsed ? '60px' : '300px',
      transition: 'width 0.3s ease-in-out, min-width 0.3s ease-in-out',
      overflow: preferences.rightPanelCollapsed ? 'hidden' : 'visible'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: preferences.rightPanelCollapsed ? 'center' : 'space-between', 
        alignItems: 'center', 
        p: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        {!preferences.rightPanelCollapsed && (
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            Promethios Control Panel
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!preferences.rightPanelCollapsed && (
            <>
              {/* Tab customization settings */}
              <Tooltip title="Customize tabs">
                <IconButton 
                  size="small" 
                  onClick={() => setShowTabCustomization(true)}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {/* Collaboration status indicator */}
              {collaborationState && (
                <Tooltip title={`${collaborationState.activeCollaborations} active collaborations`}>
                  <Badge badgeContent={collaborationState.activeCollaborations} color="primary">
                    <GroupIcon fontSize="small" />
                  </Badge>
                </Tooltip>
              )}
              
              {/* Notifications indicator */}
              {notifications.filter(n => !n.read).length > 0 && (
                <Tooltip title={`${notifications.filter(n => !n.read).length} unread notifications`}>
                  <IconButton size="small" onClick={() => setActiveTab('team')}>
                    <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                      <NotificationsIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}

          {/* Collapse button */}
          <Tooltip title={preferences.rightPanelCollapsed ? "Expand panel" : "Collapse panel"}>
            <IconButton 
              size="small" 
              onClick={() => updateRightPanelState(!preferences.rightPanelCollapsed)}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {preferences.rightPanelCollapsed ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {!preferences.rightPanelCollapsed && onClose && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && !preferences.rightPanelCollapsed && (
        <Alert severity="error" sx={{ m: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs - only show when not collapsed */}
      {!preferences.rightPanelCollapsed && (
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            minHeight: 48,
            '& .MuiTab-root': {
              minWidth: 'auto',
              minHeight: 48,
              px: 1
            }
          }}
        >
          {tabConfigs.map((config) => (
            <Tab
              key={config.id}
              value={config.id}
              label={renderTabLabel(config)}
              disabled={config.disabled}
              sx={{
                opacity: config.disabled ? 0.5 : 1,
                '&.Mui-selected': {
                  color: config.isNew ? 'success.main' : 'primary.main'
                }
              }}
            />
          ))}
        </Tabs>
      )}

      {/* Tab Content - only show when not collapsed */}
      {!preferences.rightPanelCollapsed && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {renderActiveTabContent()}
        </Box>
      )}

      {/* Collaboration Status Bar - only show when not collapsed */}
      {collaborationState && !preferences.rightPanelCollapsed && (
        <Box sx={{ 
          p: 1, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon fontSize="small" />
            {collaborationState.organizations.length > 0 && (
              <>
                {collaborationState.organizations[0].name} • 
                {collaborationState.teamMembers.length} members • 
                {collaborationState.activeCollaborations} active
              </>
            )}
            {collaborationState.organizations.length === 0 && (
              'No team organization'
            )}
          </Typography>
        </Box>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={showNotificationSnackbar}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleNotificationClose}
          severity="info"
          action={
            <IconButton
              size="small"
              aria-label="view"
              color="inherit"
              onClick={handleNotificationClick}
            >
              <GroupIcon fontSize="small" />
            </IconButton>
          }
        >
          <Typography variant="subtitle2">
            {latestNotification?.title}
          </Typography>
          <Typography variant="body2">
            {latestNotification?.message}
          </Typography>
        </Alert>
      </Snackbar>

      {/* Tab Customization Modal */}
      <TabCustomizationModal
        open={showTabCustomization}
        onClose={() => setShowTabCustomization(false)}
        availableTabs={getAllTabConfigs()}
        visibleTabs={visibleTabs}
        onTabVisibilityChange={handleTabVisibilityChange}
        userId={userId}
      />
    </Box>
  );
};

export default RightPanelEnhanced;

