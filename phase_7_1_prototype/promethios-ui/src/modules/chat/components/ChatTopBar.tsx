import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Alert,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Launch as LaunchIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { 
  ChatMode, 
  ChatSession, 
  Agent, 
  MultiAgentSystem,
  AdHocMultiAgentConfig 
} from '../types';
import { AgentSelector } from './AgentSelector';

interface ChatTopBarProps {
  currentSession?: ChatSession;
  currentMode: ChatMode;
  selectedAgentId?: string;
  selectedSystemId?: string;
  adHocConfig?: AdHocMultiAgentConfig;
  userId: string;
  onModeChange: (mode: ChatMode) => void;
  onAgentSelect: (agentId: string) => void;
  onSystemSelect: (systemId: string) => void;
  onAdHocConfigChange: (config: AdHocMultiAgentConfig) => void;
  onWrapAsSystem?: (config: AdHocMultiAgentConfig) => void;
  onNewSession: () => void;
  onSaveSession?: () => void;
  onShareSession?: () => void;
  onExportSession?: () => void;
  onOpenSettings?: () => void;
  governanceAlerts?: number;
  onToggleSidebar?: () => void;
}

export const ChatTopBar: React.FC<ChatTopBarProps> = ({
  currentSession,
  currentMode,
  selectedAgentId,
  selectedSystemId,
  adHocConfig,
  userId,
  onModeChange,
  onAgentSelect,
  onSystemSelect,
  onAdHocConfigChange,
  onWrapAsSystem,
  onNewSession,
  onSaveSession,
  onShareSession,
  onExportSession,
  onOpenSettings,
  governanceAlerts = 0,
  onToggleSidebar
}) => {
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showGovernanceAlert, setShowGovernanceAlert] = useState(false);

  // Show governance alert when there are new alerts
  useEffect(() => {
    if (governanceAlerts > 0) {
      setShowGovernanceAlert(true);
      const timer = setTimeout(() => setShowGovernanceAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [governanceAlerts]);

  // Get current mode configuration
  const getModeConfig = (mode: ChatMode) => {
    switch (mode) {
      case 'standard':
        return { 
          color: '#2196F3', 
          icon: <PersonIcon />, 
          label: 'Standard Chat',
          description: 'Direct conversation with selected agent'
        };
      case 'governance':
        return { 
          color: '#4CAF50', 
          icon: <SecurityIcon />, 
          label: 'Governed Chat',
          description: 'Enhanced monitoring and compliance tracking'
        };
      case 'multi-agent':
        return { 
          color: '#9C27B0', 
          icon: <GroupIcon />, 
          label: 'Multi-Agent',
          description: 'Coordinated multi-agent conversation'
        };
      default:
        return { color: '#757575', icon: <PersonIcon />, label: 'Unknown', description: '' };
    }
  };

  const modeConfig = getModeConfig(currentMode);
  const isGovernanceActive = currentMode === 'governance' || currentMode === 'multi-agent';

  // Get current selection display name
  const getCurrentSelectionName = () => {
    if (currentMode === 'multi-agent' && adHocConfig) {
      return adHocConfig.name || `Ad-hoc (${adHocConfig.agentIds.length} agents)`;
    }
    // This would be populated from actual agent/system data
    return selectedAgentId || selectedSystemId || 'Select Agent/System';
  };

  // Handle menu actions
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <AppBar 
        position="static" 
        elevation={1}
        sx={{ 
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Sidebar Toggle */}
            <IconButton onClick={onToggleSidebar} edge="start">
              <MenuIcon />
            </IconButton>

            {/* Current Mode Indicator */}
            <Chip
              icon={modeConfig.icon}
              label={modeConfig.label}
              sx={{
                bgcolor: modeConfig.color,
                color: 'white',
                fontWeight: 'bold',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />

            {/* Governance Status */}
            {isGovernanceActive && (
              <Tooltip title="Governance monitoring active">
                <Badge badgeContent={governanceAlerts} color="error" max={9}>
                  <SecurityIcon sx={{ color: modeConfig.color }} />
                </Badge>
              </Tooltip>
            )}

            {/* Session Title */}
            {currentSession && (
              <Typography variant="h6" noWrap sx={{ maxWidth: 200 }}>
                {currentSession.title}
              </Typography>
            )}
          </Box>

          {/* Center Section - Agent/System Selection */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setShowAgentSelector(!showAgentSelector)}
              endIcon={showAgentSelector ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ minWidth: 200 }}
            >
              {getCurrentSelectionName()}
            </Button>

            {/* Ad-hoc Wrap Button */}
            {adHocConfig && onWrapAsSystem && (
              <Tooltip title="Convert this ad-hoc chat to a formal multi-agent system">
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onWrapAsSystem(adHocConfig)}
                  startIcon={<SettingsIcon />}
                  sx={{ bgcolor: '#FF9800', '&:hover': { bgcolor: '#F57C00' } }}
                >
                  Wrap as System
                </Button>
              </Tooltip>
            )}
          </Box>

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Quick Actions */}
            <Tooltip title="New session">
              <IconButton onClick={onNewSession}>
                <LaunchIcon />
              </IconButton>
            </Tooltip>

            {currentSession && (
              <Tooltip title="Save session">
                <IconButton onClick={onSaveSession}>
                  <SaveIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Notifications */}
            <Tooltip title="Governance alerts">
              <IconButton>
                <Badge badgeContent={governanceAlerts} color="error" max={9}>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* More Menu */}
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => { onShareSession?.(); handleMenuClose(); }}>
                <ShareIcon sx={{ mr: 1 }} />
                Share Session
              </MenuItem>
              <MenuItem onClick={() => { onExportSession?.(); handleMenuClose(); }}>
                <DownloadIcon sx={{ mr: 1 }} />
                Export Chat
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { onOpenSettings?.(); handleMenuClose(); }}>
                <SettingsIcon sx={{ mr: 1 }} />
                Settings
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>

        {/* Governance Alert Banner */}
        <Collapse in={showGovernanceAlert && isGovernanceActive}>
          <Alert 
            severity="info" 
            onClose={() => setShowGovernanceAlert(false)}
            sx={{ borderRadius: 0 }}
          >
            <Typography variant="body2">
              Governance monitoring is active. {governanceAlerts > 0 && `${governanceAlerts} new alerts.`}
            </Typography>
          </Alert>
        </Collapse>
      </AppBar>

      {/* Agent Selector Dropdown */}
      <Collapse in={showAgentSelector}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <AgentSelector
            userId={userId}
            currentMode={currentMode}
            selectedAgentId={selectedAgentId}
            selectedSystemId={selectedSystemId}
            adHocConfig={adHocConfig}
            onModeChange={onModeChange}
            onAgentSelect={onAgentSelect}
            onSystemSelect={onSystemSelect}
            onAdHocConfigChange={onAdHocConfigChange}
            onWrapAsSystem={onWrapAsSystem}
          />
        </Box>
      </Collapse>
    </>
  );
};

