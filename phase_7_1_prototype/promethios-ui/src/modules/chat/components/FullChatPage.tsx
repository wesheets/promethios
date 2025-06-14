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
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  History as HistoryIcon
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

  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showGovernancePanel, setShowGovernancePanel] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [currentMode, setCurrentMode] = useState<ChatMode>(initialMode);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(initialAgentId);
  const [selectedSystemId, setSelectedSystemId] = useState<string | undefined>();
  const [adHocConfig, setAdHocConfig] = useState<AdHocMultiAgentConfig | undefined>(prefilledConfig);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [governanceAlert, setGovernanceAlert] = useState<string | null>(null);
  
  // New state for dropdown menu
  const [sessionsMenuAnchor, setSessionsMenuAnchor] = useState<null | HTMLElement>(null);
  
  // New state for governance and multi-agent toggles
  const [isGovernanceEnabled, setIsGovernanceEnabled] = useState(false);
  const [isMultiAgentEnabled, setIsMultiAgentEnabled] = useState(false);

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

  // Handle mode changes based on toggles
  const handleModeChange = (newMode: ChatMode) => {
    setCurrentMode(newMode);
    
    // Update toggles based on mode
    if (newMode === 'governance') {
      setIsGovernanceEnabled(true);
      setIsMultiAgentEnabled(false);
    } else if (newMode === 'multi-agent') {
      setIsGovernanceEnabled(false);
      setIsMultiAgentEnabled(true);
    } else {
      setIsGovernanceEnabled(false);
      setIsMultiAgentEnabled(false);
    }
  };

  // Handle toggle changes
  const handleGovernanceToggle = (enabled: boolean) => {
    setIsGovernanceEnabled(enabled);
    if (enabled && isMultiAgentEnabled) {
      // Allow both governance and multi-agent to be enabled
      setCurrentMode('multi-agent'); // Keep multi-agent as primary mode
    } else if (enabled) {
      setCurrentMode('governance');
    } else if (isMultiAgentEnabled) {
      setCurrentMode('multi-agent');
    } else {
      setCurrentMode('standard');
    }
  };

  const handleMultiAgentToggle = (enabled: boolean) => {
    setIsMultiAgentEnabled(enabled);
    if (enabled && isGovernanceEnabled) {
      // Allow both governance and multi-agent to be enabled
      setCurrentMode('multi-agent'); // Keep multi-agent as primary mode
    } else if (enabled) {
      setCurrentMode('multi-agent');
    } else if (isGovernanceEnabled) {
      setCurrentMode('governance');
    } else {
      setCurrentMode('standard');
    }
  };

  // Check if governance panel should be shown
  const shouldShowGovernancePanel = isGovernanceEnabled || (isMultiAgentEnabled && isGovernanceEnabled);

  // Handle governance alerts
  const handleGovernanceAlert = (alert: any) => {
    setGovernanceAlert(alert);
  };

  // New sidebar content with governance/multi-agent toggles
  const sidebarContent = (
    <Box sx={{ 
      width: 280, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#2d2d2d',
      color: '#ffffff'
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #404040'
      }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
          Chat Configuration
        </Typography>
        
        {/* Governance Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={isGovernanceEnabled}
              onChange={(e) => handleGovernanceToggle(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#90caf9',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#1976d2',
                },
              }}
            />
          }
          label={
            <Typography sx={{ color: '#ffffff' }}>
              Governance Mode
            </Typography>
          }
          sx={{ mb: 1, width: '100%' }}
        />
        
        {/* Multi-Agent Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={isMultiAgentEnabled}
              onChange={(e) => handleMultiAgentToggle(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#90caf9',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#1976d2',
                },
              }}
            />
          }
          label={
            <Typography sx={{ color: '#ffffff' }}>
              Multi-Agent Mode
            </Typography>
          }
          sx={{ mb: 2, width: '100%' }}
        />
        
        {/* Enhanced Input Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={true}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#90caf9',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#1976d2',
                },
              }}
            />
          }
          label={
            <Typography sx={{ color: '#ffffff' }}>
              Enhanced Input (Copy/Paste)
            </Typography>
          }
          sx={{ mb: 2, width: '100%' }}
        />
      </Box>
      
      {/* Governance Panel in Sidebar */}
      {shouldShowGovernancePanel && (
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          borderBottom: '1px solid #404040'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
            Governance Monitoring
          </Typography>
          
          {/* Compliance Metrics */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff' }}>
              Compliance Metrics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#cccccc' }}>Constitutional Compliance</Typography>
                <Chip label="94%" color="success" size="small" />
              </Box>
              <Typography variant="caption" sx={{ color: '#999999' }}>
                Adherence to constitutional AI principles
              </Typography>
            </Box>
          </Box>
          
          {/* Response Time */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#cccccc' }}>Response Time</Typography>
              <Chip label="97%" color="success" size="small" />
            </Box>
            <Typography variant="caption" sx={{ color: '#999999' }}>
              Average response time performance
            </Typography>
          </Box>
          
          {/* Bias & Fairness */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#cccccc' }}>Bias & Fairness</Typography>
              <Chip label="92%" color="success" size="small" />
            </Box>
            <Typography variant="caption" sx={{ color: '#999999' }}>
              Bias detection and fairness metrics
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      bgcolor: '#1a1a1a', // Dark background
      color: '#ffffff' // White text
    }}>
      {/* Top Bar */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          borderRadius: 0, 
          zIndex: 1,
          bgcolor: '#2d2d2d', // Dark paper background
          color: '#ffffff',
          borderBottom: '1px solid #404040'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isMobile && (
              <IconButton 
                onClick={() => setShowSidebar(!showSidebar)}
                sx={{ color: '#ffffff' }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            {/* Chat Sessions Dropdown */}
            <Button
              onClick={(e) => setSessionsMenuAnchor(e.currentTarget)}
              endIcon={<ExpandMoreIcon />}
              sx={{
                color: '#ffffff',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              {currentSession ? `Chat Session ${currentSession.id}` : 'Promethios Chat'}
            </Button>
            
            <Menu
              anchorEl={sessionsMenuAnchor}
              open={Boolean(sessionsMenuAnchor)}
              onClose={() => setSessionsMenuAnchor(null)}
              PaperProps={{
                sx: {
                  bgcolor: '#2d2d2d',
                  color: '#ffffff',
                  border: '1px solid #404040'
                }
              }}
            >
              <MenuItem 
                onClick={() => {
                  setCurrentSession(null);
                  setSessionsMenuAnchor(null);
                }}
                sx={{ color: '#ffffff' }}
              >
                <ListItemIcon sx={{ color: '#ffffff' }}>
                  <AddIcon />
                </ListItemIcon>
                <ListItemText primary="New Chat" />
              </MenuItem>
              <Divider sx={{ bgcolor: '#404040' }} />
              {[1, 2, 3].map((sessionNum) => (
                <MenuItem 
                  key={sessionNum}
                  onClick={() => {
                    setCurrentSession({ id: sessionNum.toString(), name: `Chat Session ${sessionNum}` } as ChatSession);
                    setSessionsMenuAnchor(null);
                  }}
                  sx={{ color: '#ffffff' }}
                >
                  <ListItemIcon sx={{ color: '#ffffff' }}>
                    <HistoryIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Chat Session ${sessionNum}`}
                    secondary={`${currentMode} mode • 2 hours ago`}
                    secondaryTypographyProps={{ sx: { color: '#cccccc' } }}
                  />
                </MenuItem>
              ))}
            </Menu>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Current Mode Display */}
            <Chip 
              label={
                isGovernanceEnabled && isMultiAgentEnabled 
                  ? 'MULTI-AGENT + GOVERNANCE' 
                  : isGovernanceEnabled 
                    ? 'GOVERNANCE' 
                    : isMultiAgentEnabled 
                      ? 'MULTI-AGENT' 
                      : 'STANDARD'
              } 
              color={
                (isGovernanceEnabled && isMultiAgentEnabled) || isMultiAgentEnabled 
                  ? 'primary' 
                  : isGovernanceEnabled 
                    ? 'secondary' 
                    : 'default'
              }
              variant="outlined"
              sx={{ 
                color: '#ffffff',
                borderColor: '#606060',
                '&.MuiChip-colorPrimary': {
                  borderColor: '#1976d2',
                  color: '#90caf9'
                },
                '&.MuiChip-colorSecondary': {
                  borderColor: '#9c27b0',
                  color: '#ce93d8'
                }
              }}
            />

            {shouldShowGovernancePanel && !isMobile && (
              <IconButton
                onClick={() => setShowGovernancePanel(!showGovernancePanel)}
                color={showGovernancePanel ? 'primary' : 'default'}
                sx={{ color: showGovernancePanel ? '#90caf9' : '#ffffff' }}
              >
                <AssessmentIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', bgcolor: '#1a1a1a' }}>
        {/* Session Sidebar */}
        {!isMobile && showSidebar && (
          <Box sx={{ borderRight: '1px solid #404040' }}>
            {sidebarContent}
          </Box>
        )}

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={isMobile && showSidebar}
          onClose={() => setShowSidebar(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              bgcolor: '#2d2d2d',
              color: '#ffffff'
            }
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* Chat Area */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          bgcolor: '#1a1a1a'
        }}>
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
          <Box sx={{ 
            width: 350, 
            flexShrink: 0, 
            borderLeft: '1px solid #404040'
          }}>
            <Paper 
              elevation={0} 
              sx={{ 
                height: '100%', 
                borderRadius: 0,
                bgcolor: '#2d2d2d',
                color: '#ffffff'
              }}
            >
              <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid #404040', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  Governance Metrics
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowGovernancePanel(false)}
                  sx={{ color: '#ffffff' }}
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
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff' }}>
                    Real-time Metrics
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#cccccc' }}>Trust Score</Typography>
                      <Chip label="94%" color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#cccccc' }}>Compliance</Typography>
                      <Chip label="96%" color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#cccccc' }}>Response Quality</Typography>
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

