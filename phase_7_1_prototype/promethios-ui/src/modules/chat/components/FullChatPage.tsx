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
  Snackbar,
  Chip,
  Button,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import type { 
  ChatMode, 
  ChatSession, 
  Message as ChatMessage,
  AdHocMultiAgentConfig 
} from '../types';
import { ChatContainer } from './ChatContainer';
import { GovernancePanel } from './GovernancePanel';

interface FullChatPageProps {
  initialSessionId?: string;
  initialAgentId?: string;
  initialMode?: ChatMode;
  prefilledConfig?: any;
}

export const FullChatPage: React.FC<FullChatPageProps> = ({
  initialSessionId,
  initialAgentId,
  initialMode = 'standard',
  prefilledConfig
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
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

    if (agentId) {
      setSelectedAgentId(agentId);
      setCurrentMode(mode);
    }

    if (prefilledConfig) {
      setAdHocConfig(prefilledConfig);
      setCurrentMode('multi-agent');
    }
  }, [location, initialSessionId, initialAgentId, initialMode, prefilledConfig]);

  // Handle mode change
  const handleModeChange = (mode: ChatMode) => {
    setCurrentMode(mode);
    
    if (mode !== 'multi-agent') {
      setSelectedSystemId(undefined);
      setAdHocConfig(undefined);
    }
    if (mode === 'multi-agent') {
      setSelectedAgentId(undefined);
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
  const isGovernanceActive = currentMode === 'governance' || currentMode === 'multi-agent';

  // Session sidebar content
  const sidebarContent = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Chat Sessions
        </Typography>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<ChatIcon />}
          onClick={() => setCurrentSession(null)}
        >
          New Chat
        </Button>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {/* Mock session list */}
        {[1, 2, 3].map((sessionNum) => (
          <Paper
            key={sessionNum}
            elevation={1}
            sx={{
              p: 2,
              mb: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <Typography variant="subtitle2" noWrap>
              Chat Session {sessionNum}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentMode} mode • 2 hours ago
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Bar */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0, zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isMobile && (
              <IconButton onClick={() => setShowSidebar(!showSidebar)}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6">
              {selectedAgentId ? `Chat with Agent ${selectedAgentId}` : 'Promethios Chat'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={currentMode.replace('-', ' ').toUpperCase()} 
              color={currentMode === 'multi-agent' ? 'primary' : currentMode === 'governance' ? 'secondary' : 'default'}
              variant="outlined"
            />
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={currentMode === 'standard' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleModeChange('standard')}
              >
                Standard
              </Button>
              <Button
                variant={currentMode === 'governance' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleModeChange('governance')}
              >
                Governance
              </Button>
              <Button
                variant={currentMode === 'multi-agent' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleModeChange('multi-agent')}
              >
                Multi-Agent
              </Button>
            </Box>

            {isGovernanceActive && !isMobile && (
              <IconButton
                onClick={() => setShowGovernancePanel(!showGovernancePanel)}
                color={showGovernancePanel ? 'primary' : 'default'}
              >
                <AssessmentIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Session Sidebar */}
        {!isMobile && showSidebar && (
          <Box sx={{ borderRight: 1, borderColor: 'divider' }}>
            {sidebarContent}
          </Box>
        )}

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={isMobile && showSidebar}
          onClose={() => setShowSidebar(false)}
          ModalProps={{ keepMounted: true }}
        >
          {sidebarContent}
        </Drawer>

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <ChatContainer
              agentId={selectedAgentId}
              systemId={selectedSystemId}
              adHocConfig={adHocConfig}
              mode={currentMode}
              userId="test-user"
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
              <Box sx={{ 
                p: 2, 
                borderBottom: 1, 
                borderColor: 'divider', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
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
              
              <Box sx={{ height: 'calc(100% - 64px)', overflow: 'auto', p: 2 }}>
                <GovernancePanel
                  messages={messages}
                  currentMode={currentMode}
                  compact={true}
                />
                
                {/* Mock governance metrics */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Real-time Metrics
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Trust Score</Typography>
                      <Chip label="94%" color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Compliance</Typography>
                      <Chip label="96%" color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Response Quality</Typography>
                      <Chip label="92%" color="primary" size="small" />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Mobile FAB for governance */}
      {isMobile && isGovernanceActive && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowGovernancePanel(!showGovernancePanel)}
        >
          <AssessmentIcon />
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

