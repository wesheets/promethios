import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  Fab,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Close as CloseIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChatMode, 
  ChatSession, 
  ChatMessage,
  AdHocMultiAgentConfig 
} from '../types';
import { ChatTopBar } from './ChatTopBar';
import { SessionSidebar } from './SessionSidebar';
import { ChatContainer } from './ChatContainer';
import { GovernancePanel } from './GovernancePanel';
import { MetricsDashboard } from './MetricsDashboard';
import { RealTimeAlerts } from './RealTimeAlerts';
import { ChatSessionRegistry } from '../services/ChatSessionRegistry';
import { useAuth } from '../../../hooks/useAuth';

interface FullChatPageProps {
  initialSessionId?: string;
  initialAgentId?: string;
  initialMode?: ChatMode;
  prefilledConfig?: any; // For multi-agent wrapping integration
}

export const FullChatPage: React.FC<FullChatPageProps> = ({
  initialSessionId,
  initialAgentId,
  initialMode = ChatMode.STANDARD,
  prefilledConfig
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [currentMode, setCurrentMode] = useState<ChatMode>(initialMode);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(initialAgentId);
  const [selectedSystemId, setSelectedSystemId] = useState<string | undefined>();
  const [adHocConfig, setAdHocConfig] = useState<AdHocMultiAgentConfig | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [governanceAlerts, setGovernanceAlerts] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showGovernancePanel, setShowGovernancePanel] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from URL params or props
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session') || initialSessionId;
    const agentId = urlParams.get('agent') || initialAgentId;
    const mode = (urlParams.get('mode') as ChatMode) || initialMode;

    if (sessionId) {
      loadSession(sessionId);
    } else if (agentId) {
      setSelectedAgentId(agentId);
      setCurrentMode(mode);
    }

    // Handle prefilled config from multi-agent wrapping
    if (prefilledConfig) {
      setAdHocConfig(prefilledConfig);
      setCurrentMode(ChatMode.MULTI_AGENT);
    }
  }, [location, initialSessionId, initialAgentId, initialMode, prefilledConfig]);

  // Load session
  const loadSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const session = await ChatSessionRegistry.getSession(sessionId);
      if (session) {
        setCurrentSession(session);
        setCurrentMode(session.mode);
        setSelectedAgentId(session.agentId);
        setSelectedSystemId(session.systemId);
        setAdHocConfig(session.adHocConfig);
        
        // Load messages would go here
        // const sessionMessages = await MessageService.getSessionMessages(sessionId);
        // setMessages(sessionMessages);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setError('Failed to load chat session');
    } finally {
      setLoading(false);
    }
  };

  // Create new session
  const createNewSession = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const sessionTitle = `New ${currentMode.replace('_', ' ')} Chat`;
      const newSession = await ChatSessionRegistry.createSession(
        user.uid,
        sessionTitle,
        currentMode,
        selectedAgentId,
        selectedSystemId,
        adHocConfig
      );
      
      setCurrentSession(newSession);
      setMessages([]);
      
      // Update URL
      navigate(`/chat?session=${newSession.id}`, { replace: true });
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create new session');
    } finally {
      setLoading(false);
    }
  };

  // Handle session selection
  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSession(session);
    setCurrentMode(session.mode);
    setSelectedAgentId(session.agentId);
    setSelectedSystemId(session.systemId);
    setAdHocConfig(session.adHocConfig);
    
    // Update URL
    navigate(`/chat?session=${session.id}`, { replace: true });
  };

  // Handle mode change
  const handleModeChange = (mode: ChatMode) => {
    setCurrentMode(mode);
    
    // Clear incompatible selections
    if (mode !== ChatMode.MULTI_AGENT) {
      setSelectedSystemId(undefined);
      setAdHocConfig(undefined);
    }
    if (mode === ChatMode.MULTI_AGENT) {
      setSelectedAgentId(undefined);
    }
  };

  // Handle wrap as system
  const handleWrapAsSystem = (config: AdHocMultiAgentConfig) => {
    // Navigate to multi-agent wrapping with prefilled config
    navigate('/multi-agent-wrapping', {
      state: {
        prefilledConfig: {
          selectedAgents: config.agentIds,
          systemName: config.name,
          flowType: 'sequential', // Default
          governanceSettings: {
            enableGovernance: true,
            complianceLevel: 'standard'
          }
        }
      }
    });
  };

  // Handle save session
  const handleSaveSession = async () => {
    if (!currentSession) return;
    
    try {
      await ChatSessionRegistry.updateSession(currentSession.id, {
        lastActivity: new Date(),
        messageCount: messages.length
      });
      setError(null);
    } catch (error) {
      console.error('Error saving session:', error);
      setError('Failed to save session');
    }
  };

  // Handle governance alerts
  const handleGovernanceAlert = (alert: any) => {
    setGovernanceAlerts(prev => [...prev, alert]);
  };

  // Dismiss alert
  const dismissAlert = (alertId: string) => {
    setGovernanceAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Check if governance mode is active
  const isGovernanceActive = currentMode === ChatMode.GOVERNANCE || currentMode === ChatMode.MULTI_AGENT;

  // Sidebar content
  const sidebarContent = (
    <SessionSidebar
      userId={user?.uid || ''}
      currentSessionId={currentSession?.id}
      onSessionSelect={handleSessionSelect}
      onNewSession={createNewSession}
      compact={isMobile}
    />
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Bar */}
      <ChatTopBar
        currentSession={currentSession}
        currentMode={currentMode}
        selectedAgentId={selectedAgentId}
        selectedSystemId={selectedSystemId}
        adHocConfig={adHocConfig}
        userId={user?.uid || ''}
        onModeChange={handleModeChange}
        onAgentSelect={setSelectedAgentId}
        onSystemSelect={setSelectedSystemId}
        onAdHocConfigChange={setAdHocConfig}
        onWrapAsSystem={handleWrapAsSystem}
        onNewSession={createNewSession}
        onSaveSession={handleSaveSession}
        onShareSession={() => console.log('Share session')}
        onExportSession={() => console.log('Export session')}
        onOpenSettings={() => console.log('Open settings')}
        governanceAlerts={governanceAlerts.length}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
      />

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Session Sidebar */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={showSidebar}
            onClose={() => setShowSidebar(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                width: 320,
                boxSizing: 'border-box'
              }
            }}
          >
            {sidebarContent}
          </Drawer>
        ) : (
          showSidebar && (
            <Box sx={{ width: 320, flexShrink: 0 }}>
              {sidebarContent}
            </Box>
          )
        )}

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Real-time Alerts */}
          {isGovernanceActive && governanceAlerts.length > 0 && (
            <Box sx={{ maxHeight: 120, overflow: 'auto' }}>
              <RealTimeAlerts
                alerts={governanceAlerts}
                onDismissAlert={dismissAlert}
                compact={true}
                maxVisible={3}
              />
            </Box>
          )}

          {/* Main Chat Container */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <ChatContainer
              agentId={selectedAgentId}
              systemId={selectedSystemId}
              adHocConfig={adHocConfig}
              mode={currentMode}
              userId={user?.uid || ''}
              sessionId={currentSession?.id}
              onSessionChange={setCurrentSession}
              onModeChange={handleModeChange}
              onGovernanceAlert={handleGovernanceAlert}
              maxHeight="100%"
            />
          </Box>
        </Box>

        {/* Governance Panel */}
        {isGovernanceActive && showGovernancePanel && !isMobile && (
          <Box sx={{ width: 350, flexShrink: 0, borderLeft: 1, borderColor: 'divider' }}>
            <Paper elevation={0} sx={{ height: '100%', borderRadius: 0 }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  Governance Metrics
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowGovernancePanel(false)}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ height: 'calc(100% - 64px)', overflow: 'auto', p: 1 }}>
                <GovernancePanel
                  messages={messages}
                  currentMode={currentMode}
                  compact={true}
                />
                
                <Box sx={{ mt: 2 }}>
                  <MetricsDashboard
                    messages={messages}
                    realTimeMode={true}
                    compact={true}
                    showTrends={true}
                  />
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Mobile Governance FAB */}
      {isGovernanceActive && isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          onClick={() => setShowGovernancePanel(true)}
        >
          <SettingsIcon />
        </Fab>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

