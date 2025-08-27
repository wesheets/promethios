/**
 * AIObservationToggle - Privacy control interface for AI agent observation
 * Allows users to toggle private mode and manage AI agent participation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Chip,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip,
  Avatar,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Block as BlockIcon,
  CheckCircle as AllowIcon,
  History as HistoryIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import AIObservationService, { AIObservationState, AIObservationNotification } from '../../services/AIObservationService';

export interface AIObservationToggleProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  participatingAgents: Array<{
    id: string;
    name: string;
    type: string;
    avatar?: string;
  }>;
  onPrivacyChange?: (isPrivate: boolean) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
}

export const AIObservationToggle: React.FC<AIObservationToggleProps> = ({
  conversationId,
  currentUserId,
  currentUserName,
  participatingAgents,
  onPrivacyChange,
  position = 'top-right'
}) => {
  const [observationState, setObservationState] = useState<AIObservationState | null>(null);
  const [notifications, setNotifications] = useState<AIObservationNotification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showAgentControls, setShowAgentControls] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const aiObservationService = AIObservationService.getInstance();

  // Load initial state and subscribe to changes
  useEffect(() => {
    const initialState = aiObservationService.getObservationState(conversationId);
    setObservationState(initialState);

    const unsubscribeState = aiObservationService.subscribeToObservationChanges((state) => {
      if (state.conversationId === conversationId) {
        setObservationState(state);
        onPrivacyChange?.(state.isPrivateMode);
      }
    });

    const unsubscribeNotifications = aiObservationService.subscribeToNotifications((notification) => {
      if (notification.conversationId === conversationId) {
        setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5
      }
    });

    return () => {
      unsubscribeState();
      unsubscribeNotifications();
    };
  }, [conversationId, onPrivacyChange]);

  // Handle privacy mode toggle
  const handlePrivacyToggle = async () => {
    if (!observationState || isProcessing) return;

    setIsProcessing(true);
    try {
      if (observationState.isPrivateMode) {
        await aiObservationService.disablePrivateMode(
          conversationId,
          currentUserId,
          currentUserName,
          'Manual toggle'
        );
      } else {
        await aiObservationService.enablePrivateMode(
          conversationId,
          currentUserId,
          currentUserName,
          'Manual toggle'
        );
      }
    } catch (error) {
      console.error('Failed to toggle privacy mode:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle agent observation toggle
  const handleAgentToggle = async (agentId: string, agentName: string, allow: boolean) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (allow) {
        await aiObservationService.allowAgentObservation(
          conversationId,
          agentId,
          agentName,
          currentUserId,
          currentUserName,
          'Manual agent control'
        );
      } else {
        await aiObservationService.blockAgentObservation(
          conversationId,
          agentId,
          agentName,
          currentUserId,
          currentUserName,
          'Manual agent control'
        );
      }
    } catch (error) {
      console.error('Failed to toggle agent observation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get position styles
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9997, // Below notifications
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: 20, right: 20 };
      case 'top-left':
        return { ...baseStyles, top: 20, left: 20 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 20, right: 20 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 20, left: 20 };
      default:
        return { ...baseStyles, top: 20, right: 20 };
    }
  };

  // Get agent observation status
  const getAgentStatus = (agentId: string) => {
    if (!observationState) return 'unknown';
    
    if (observationState.isPrivateMode) return 'blocked'; // Private mode blocks all
    if (observationState.blockedAgents.includes(agentId)) return 'blocked';
    if (observationState.allowedAgents.length > 0) {
      return observationState.allowedAgents.includes(agentId) ? 'allowed' : 'blocked';
    }
    return 'allowed'; // Default state
  };

  if (!observationState) return null;

  const isPrivate = observationState.isPrivateMode;
  const privacySummary = aiObservationService.getPrivacySummary(conversationId);

  // Inline mode for command center integration
  if (position === 'inline') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Compact Privacy Toggle */}
        <Tooltip title={isPrivate ? 'Enable AI observation' : 'Enable private mode'}>
          <Button
            onClick={handlePrivacyToggle}
            variant="contained"
            size="small"
            startIcon={isPrivate ? <VisibilityOffIcon /> : <VisibilityIcon />}
            sx={{
              bgcolor: isPrivate ? '#ef4444' : '#10b981',
              '&:hover': { bgcolor: isPrivate ? '#dc2626' : '#059669' },
              color: 'white',
              fontWeight: 600,
              borderRadius: 1,
              px: 2,
              py: 0.5,
              minWidth: 120,
              fontSize: '0.75rem'
            }}
            disabled={isProcessing}
          >
            {isPrivate ? 'Private' : 'Public'}
          </Button>
        </Tooltip>

        {/* Agent Controls Button */}
        <Tooltip title="Manage AI agent observation">
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
            sx={{
              bgcolor: '#334155',
              color: 'white',
              '&:hover': { bgcolor: '#475569' },
              width: 32,
              height: 32
            }}
          >
            <SettingsIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        {/* Agent Controls Menu (same as before) */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              bgcolor: '#1e293b',
              color: 'white',
              border: '1px solid #334155',
              borderRadius: 2,
              minWidth: 320,
              maxWidth: 400,
              maxHeight: 600,
              overflow: 'auto'
            }
          }}
        >
          {/* Same menu content as floating mode */}
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SecurityIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                AI Agent Controls
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Manage individual AI agent observation
            </Typography>
          </Box>

          {/* Agent Controls List */}
          <List sx={{ py: 1 }}>
            {participatingAgents.map((agent) => {
              const status = getAgentStatus(agent.id);
              const canObserve = status === 'allowed' && !isPrivate;
              
              return (
                <ListItem key={agent.id} sx={{ py: 0.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}>
                      <AIIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {agent.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {agent.type} • {canObserve ? 'Observing' : 'Not observing'}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      icon={canObserve ? <AllowIcon /> : <BlockIcon />}
                      label={canObserve ? 'Allow' : 'Block'}
                      size="small"
                      onClick={() => handleAgentToggle(agent.id, agent.name, !canObserve)}
                      disabled={isPrivate || isProcessing}
                      sx={{
                        bgcolor: canObserve ? '#10b98120' : '#ef444420',
                        color: canObserve ? '#10b981' : '#ef4444',
                        border: `1px solid ${canObserve ? '#10b981' : '#ef4444'}`,
                        '&:hover': {
                          bgcolor: canObserve ? '#10b98130' : '#ef444430'
                        },
                        height: 24
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </Menu>
      </Box>
    );
  }

  // Floating mode (original implementation)
  return (
    <Box sx={getPositionStyles()}>
      {/* Main Privacy Toggle Button */}
      <Tooltip title={isPrivate ? 'AI agents are not observing' : 'AI agents are observing'}>
        <Button
          onClick={(e) => setAnchorEl(e.currentTarget)}
          variant="contained"
          startIcon={isPrivate ? <VisibilityOffIcon /> : <VisibilityIcon />}
          sx={{
            bgcolor: isPrivate ? '#ef4444' : '#10b981',
            '&:hover': { bgcolor: isPrivate ? '#dc2626' : '#059669' },
            color: 'white',
            fontWeight: 600,
            borderRadius: 2,
            px: 2,
            py: 1,
            minWidth: 140,
            boxShadow: 3
          }}
          disabled={isProcessing}
        >
          {isPrivate ? 'Private Mode' : 'AI Observing'}
        </Button>
      </Tooltip>

      {/* Privacy Control Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: 'white',
            border: '1px solid #334155',
            borderRadius: 2,
            minWidth: 320,
            maxWidth: 400,
            maxHeight: 600,
            overflow: 'auto'
          }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SecurityIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Privacy Controls
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Manage AI agent observation and participation
          </Typography>
        </Box>

        {/* Privacy Mode Toggle */}
        <Box sx={{ p: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isPrivate}
                onChange={handlePrivacyToggle}
                disabled={isProcessing}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#ef4444',
                    '&:hover': { bgcolor: '#ef444420' }
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    bgcolor: '#ef4444'
                  }
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Private Mode
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {isPrivate ? 'AI agents cannot observe' : 'AI agents can observe'}
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Privacy Status Alert */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert
            severity={isPrivate ? 'warning' : 'success'}
            sx={{
              bgcolor: isPrivate ? '#f59e0b20' : '#10b98120',
              border: `1px solid ${isPrivate ? '#f59e0b' : '#10b981'}`,
              '& .MuiAlert-icon': { 
                color: isPrivate ? '#f59e0b' : '#10b981' 
              },
              '& .MuiAlert-message': { color: '#e2e8f0' }
            }}
          >
            {isPrivate ? (
              <>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  🔒 Private conversation active
                </Typography>
                <Typography variant="caption">
                  AI agents cannot see or respond to messages
                  {privacySummary.privateModeDuration && (
                    <> • Active for {privacySummary.privateModeDuration} minutes</>
                  )}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  👁️ AI agents are observing
                </Typography>
                <Typography variant="caption">
                  {privacySummary.allowedAgentCount > 0 
                    ? `${privacySummary.allowedAgentCount} agents allowed`
                    : 'All agents can observe and respond'
                  }
                </Typography>
              </>
            )}
          </Alert>
        </Box>

        <Divider sx={{ bgcolor: '#334155' }} />

        {/* Agent Controls */}
        <MenuItem
          onClick={() => setShowAgentControls(!showAgentControls)}
          sx={{ py: 1.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <AIIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              Agent Controls ({participatingAgents.length})
            </Typography>
            {showAgentControls ? <CollapseIcon /> : <ExpandIcon />}
          </Box>
        </MenuItem>

        <Collapse in={showAgentControls}>
          <List sx={{ py: 0 }}>
            {participatingAgents.map((agent) => {
              const status = getAgentStatus(agent.id);
              const canObserve = status === 'allowed' && !isPrivate;
              
              return (
                <ListItem key={agent.id} sx={{ py: 0.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}>
                      <AIIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {agent.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {agent.type} • {canObserve ? 'Observing' : 'Not observing'}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      icon={canObserve ? <AllowIcon /> : <BlockIcon />}
                      label={canObserve ? 'Allow' : 'Block'}
                      size="small"
                      onClick={() => handleAgentToggle(agent.id, agent.name, !canObserve)}
                      disabled={isPrivate || isProcessing}
                      sx={{
                        bgcolor: canObserve ? '#10b98120' : '#ef444420',
                        color: canObserve ? '#10b981' : '#ef4444',
                        border: `1px solid ${canObserve ? '#10b981' : '#ef4444'}`,
                        '&:hover': {
                          bgcolor: canObserve ? '#10b98130' : '#ef444430'
                        },
                        height: 24
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        <Divider sx={{ bgcolor: '#334155' }} />

        {/* Privacy History */}
        <MenuItem
          onClick={() => setShowHistory(!showHistory)}
          sx={{ py: 1.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <HistoryIcon sx={{ color: '#6b7280', fontSize: 20 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              Privacy History
            </Typography>
            {showHistory ? <CollapseIcon /> : <ExpandIcon />}
          </Box>
        </MenuItem>

        <Collapse in={showHistory}>
          <Box sx={{ px: 2, pb: 2 }}>
            {notifications.length > 0 ? (
              notifications.slice(0, 3).map((notification) => (
                <Box key={notification.id} sx={{ mb: 1, p: 1, bgcolor: '#0f172a', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {notification.timestamp.toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: '0.8rem' }}>
                    {notification.message}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                No privacy events yet
              </Typography>
            )}
          </Box>
        </Collapse>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
          <Typography variant="caption" sx={{ color: '#6b7280' }}>
            Last changed by {privacySummary.lastToggleBy} at{' '}
            {privacySummary.lastToggleAt.toLocaleTimeString()}
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
};

export default AIObservationToggle;

