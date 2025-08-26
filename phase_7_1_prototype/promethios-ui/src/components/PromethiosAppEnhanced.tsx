/**
 * PromethiosAppEnhanced - Main application component with team collaboration
 * 
 * Integrates the complete team collaboration platform with the existing Promethios
 * application, providing seamless switching between individual AI agent interactions
 * and team collaboration features.
 * 
 * Key Features:
 * - Enhanced chat interface with dropdown for agent/human chat selection
 * - Integrated team collaboration panel in right sidebar
 * - Real-time notifications and collaboration state management
 * - Backward compatibility with all existing Promethios functionality
 * - Enterprise-grade team management and governance
 * 
 * Architecture:
 * - Left: Enhanced chat interface with unified messaging
 * - Right: Enhanced control panel with team collaboration tab
 * - Bottom: Status bar with collaboration indicators
 * - Overlay: Notifications and real-time updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  LinearProgress,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle as AccountCircleIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  SmartToy as SmartToyIcon,
  Chat as ChatIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Help as HelpIcon,
  Feedback as FeedbackIcon,
  Security as SecurityIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

// Import enhanced components
import EnhancedChatInterface from './chat/EnhancedChatInterface';
import RightPanelEnhanced from './RightPanelEnhanced';
import { TeamCollaborationIntegrationService, TeamCollaborationState } from '../services/TeamCollaborationIntegrationService';
import { OrganizationManagementService, Organization } from '../services/OrganizationManagementService';

// Import existing components (these would be existing Promethios components)
import { ChatHistoryService } from '../services/ChatHistoryService';
import { UniversalGovernanceAdapter } from '../services/UniversalGovernanceAdapter';

interface PromethiosAppEnhancedProps {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  currentAgentId?: string;
  currentAgentName?: string;
  onLogout?: () => void;
}

interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

const PromethiosAppEnhanced: React.FC<PromethiosAppEnhancedProps> = ({
  userId,
  userName,
  userEmail,
  userAvatar,
  currentAgentId = 'default_agent',
  currentAgentName = 'Promethios Assistant',
  onLogout
}) => {
  // Services
  const [collaborationService] = useState(() => TeamCollaborationIntegrationService.getInstance());
  const [orgService] = useState(() => OrganizationManagementService.getInstance());
  const [chatHistoryService] = useState(() => ChatHistoryService.getInstance());
  const [governanceAdapter] = useState(() => UniversalGovernanceAdapter.getInstance());

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  
  // Collaboration State
  const [collaborationState, setCollaborationState] = useState<TeamCollaborationState | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  // =====================================
  // INITIALIZATION
  // =====================================

  useEffect(() => {
    initializeApplication();
  }, [userId]);

  const initializeApplication = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize team collaboration
      const collabState = await collaborationService.initializeUserCollaboration(userId, userName);
      setCollaborationState(collabState);
      setOrganizations(collabState.organizations);
      setActiveOrgId(collabState.activeOrgId);

      // Load chat history
      await loadChatHistory();

      // Check if this is first time user
      if (collabState.organizations.length === 0) {
        setShowWelcomeDialog(true);
      }

      // Load app notifications
      await loadAppNotifications();

    } catch (err) {
      console.error('Error initializing application:', err);
      setError('Failed to initialize application');
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const sessions = await chatHistoryService.getChatSessions(userId);
      if (sessions.length > 0) {
        const latestSession = sessions[0];
        setChatMessages(latestSession.messages || []);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  const loadAppNotifications = async () => {
    try {
      // Load system notifications (governance alerts, updates, etc.)
      const notifications: AppNotification[] = [
        {
          id: 'welcome_team',
          type: 'info',
          title: 'Team Collaboration Available',
          message: 'You can now collaborate with team members and share AI agents!',
          timestamp: new Date(),
          read: false
        }
      ];

      setAppNotifications(notifications);
    } catch (err) {
      console.error('Error loading app notifications:', err);
    }
  };

  // =====================================
  // EVENT HANDLERS
  // =====================================

  const handleAgentMessage = async (message: string) => {
    try {
      setIsAgentTyping(true);
      
      // Add user message to chat
      const userMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, userMessage]);

      // Simulate agent response (in real app, this would call the agent service)
      setTimeout(() => {
        const agentMessage = {
          id: `msg_${Date.now()}_agent`,
          role: 'assistant',
          content: `I understand you said: "${message}". How can I help you with that?`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, agentMessage]);
        setIsAgentTyping(false);
      }, 2000);

    } catch (err) {
      console.error('Error handling agent message:', err);
      setIsAgentTyping(false);
    }
  };

  const handleReceiptShare = async (receiptData: any) => {
    try {
      // Handle receipt sharing logic
      console.log('Sharing receipt:', receiptData);
      
      // Show success notification
      setAppNotifications(prev => [...prev, {
        id: `receipt_${Date.now()}`,
        type: 'success',
        title: 'Receipt Shared',
        message: 'Receipt has been shared with your team members',
        timestamp: new Date(),
        read: false
      }]);

    } catch (err) {
      console.error('Error sharing receipt:', err);
    }
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleOrganizationSwitch = async (orgId: string) => {
    try {
      setActiveOrgId(orgId);
      
      // Refresh collaboration state for new organization
      const updatedState = await collaborationService.refreshUserState(userId);
      if (updatedState) {
        setCollaborationState(updatedState);
      }

    } catch (err) {
      console.error('Error switching organization:', err);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      // In real app, this would open a dialog to create organization
      console.log('Creating new organization...');
      
    } catch (err) {
      console.error('Error creating organization:', err);
    }
  };

  // =====================================
  // RENDER METHODS
  // =====================================

  const renderAppBar = () => (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon />
          Promethios
          <Chip 
            label="Enterprise" 
            size="small" 
            color="secondary"
            sx={{ ml: 1 }}
          />
        </Typography>

        {/* Organization Selector */}
        {organizations.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <BusinessIcon fontSize="small" />
            <Typography variant="body2">
              {organizations.find(org => org.orgId === activeOrgId)?.name || 'Personal'}
            </Typography>
          </Box>
        )}

        {/* Collaboration Status */}
        {collaborationState && (
          <Tooltip title={`${collaborationState.activeCollaborations} active collaborations`}>
            <IconButton color="inherit">
              <Badge badgeContent={collaborationState.activeCollaborations} color="secondary">
                <GroupIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        )}

        {/* Notifications */}
        <IconButton
          color="inherit"
          onClick={handleNotificationsClick}
        >
          <Badge badgeContent={appNotifications.filter(n => !n.read).length} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* User Menu */}
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleUserMenuClick}
        >
          <Avatar src={userAvatar} sx={{ width: 32, height: 32 }}>
            {userName.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Toolbar>
    </AppBar>
  );

  const renderUserMenu = () => (
    <Menu
      anchorEl={userMenuAnchor}
      open={Boolean(userMenuAnchor)}
      onClose={handleUserMenuClose}
    >
      <MenuItem disabled>
        <Box>
          <Typography variant="subtitle2">{userName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {userEmail}
          </Typography>
        </Box>
      </MenuItem>
      <Divider />
      
      <MenuItem onClick={() => {/* Open profile settings */}}>
        <AccountCircleIcon sx={{ mr: 1 }} />
        Profile Settings
      </MenuItem>
      
      <MenuItem onClick={() => {/* Open organization settings */}}>
        <BusinessIcon sx={{ mr: 1 }} />
        Organization Settings
      </MenuItem>
      
      <MenuItem onClick={() => {/* Open security settings */}}>
        <SecurityIcon sx={{ mr: 1 }} />
        Security & Privacy
      </MenuItem>
      
      <Divider />
      
      <MenuItem onClick={() => {/* Open help */}}>
        <HelpIcon sx={{ mr: 1 }} />
        Help & Support
      </MenuItem>
      
      <MenuItem onClick={() => {/* Open feedback */}}>
        <FeedbackIcon sx={{ mr: 1 }} />
        Send Feedback
      </MenuItem>
      
      <Divider />
      
      <MenuItem onClick={onLogout}>
        <LogoutIcon sx={{ mr: 1 }} />
        Sign Out
      </MenuItem>
    </Menu>
  );

  const renderNotificationsMenu = () => (
    <Menu
      anchorEl={notificationsAnchor}
      open={Boolean(notificationsAnchor)}
      onClose={handleNotificationsClose}
      PaperProps={{
        sx: { width: 320, maxHeight: 400 }
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Notifications</Typography>
      </Box>
      
      {appNotifications.length === 0 ? (
        <MenuItem disabled>
          <Typography color="text.secondary">No notifications</Typography>
        </MenuItem>
      ) : (
        appNotifications.slice(0, 5).map((notification) => (
          <MenuItem key={notification.id} sx={{ whiteSpace: 'normal', py: 1 }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                {notification.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notification.timestamp.toLocaleString()}
              </Typography>
            </Box>
          </MenuItem>
        ))
      )}
      
      {appNotifications.length > 5 && (
        <MenuItem onClick={() => setRightPanelOpen(true)}>
          <Typography color="primary">View all notifications</Typography>
        </MenuItem>
      )}
    </Menu>
  );

  const renderWelcomeDialog = () => (
    <Dialog open={showWelcomeDialog} onClose={() => setShowWelcomeDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon color="primary" />
          Welcome to Promethios Team Collaboration!
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You now have access to revolutionary team collaboration features:
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>🤖 AI Agent Collaboration</Typography>
          <Typography variant="body2" color="text.secondary">
            Share your AI agents with team members and collaborate on projects together.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>💬 Team Messaging</Typography>
          <Typography variant="body2" color="text.secondary">
            Chat directly with team members and share AI-generated receipts and insights.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>🏢 Organization Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Create organizations, manage team members, and deploy enterprise AI agents.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>📊 Project Repositories</Typography>
          <Typography variant="body2" color="text.secondary">
            Collaborate on AI-generated projects with version control and real-time updates.
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Get Started:</strong> Click the "Team" tab in the right panel to create your first organization 
            and start collaborating with your team!
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowWelcomeDialog(false)}>
          Maybe Later
        </Button>
        <Button 
          variant="contained" 
          onClick={() => {
            setShowWelcomeDialog(false);
            setRightPanelOpen(true);
          }}
        >
          Get Started
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderMainContent = () => (
    <Grid container sx={{ height: 'calc(100vh - 64px)' }}>
      {/* Left Panel - Enhanced Chat Interface */}
      <Grid item xs={12} md={rightPanelOpen ? 8 : 12}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, p: 2 }}>
            <EnhancedChatInterface
              userId={userId}
              userName={userName}
              currentAgentId={currentAgentId}
              currentAgentName={currentAgentName}
              onAgentMessage={handleAgentMessage}
              onReceiptShare={handleReceiptShare}
            />
          </Box>
          
          {/* Status Bar */}
          <Box sx={{ 
            p: 1, 
            borderTop: 1, 
            borderColor: 'divider',
            bgcolor: 'background.default',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<SmartToyIcon />}
                label={`${currentAgentName} - Online`}
                size="small"
                color="success"
                variant="outlined"
              />
              
              {isAgentTyping && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress sx={{ width: 100 }} />
                  <Typography variant="caption" color="text.secondary">
                    Agent is typing...
                  </Typography>
                </Box>
              )}
            </Box>
            
            {collaborationState && (
              <Typography variant="caption" color="text.secondary">
                {collaborationState.teamMembers.length} team members • 
                {collaborationState.activeCollaborations} active collaborations
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* Right Panel - Enhanced Control Panel */}
      {rightPanelOpen && (
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', borderLeft: 1, borderColor: 'divider' }}>
            <RightPanelEnhanced
              userId={userId}
              userName={userName}
              currentAgentId={currentAgentId}
              currentAgentName={currentAgentName}
              onClose={() => setRightPanelOpen(false)}
              defaultTab="team"
            />
          </Paper>
        </Grid>
      )}
    </Grid>
  );

  // =====================================
  // MAIN RENDER
  // =====================================

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <LinearProgress sx={{ width: 300 }} />
        <Typography variant="h6">Initializing Promethios...</Typography>
        <Typography variant="body2" color="text.secondary">
          Loading team collaboration features...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      {renderAppBar()}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ m: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      {renderMainContent()}

      {/* Menus */}
      {renderUserMenu()}
      {renderNotificationsMenu()}

      {/* Welcome Dialog */}
      {renderWelcomeDialog()}
    </Box>
  );
};

export default PromethiosAppEnhanced;

