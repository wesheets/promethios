import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Collapse,
  Fade,
  Avatar,
  Badge,
  Button,
  Divider
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Launch as LaunchIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Minimize as MinimizeIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import { 
  ChatMode, 
  ChatSession, 
  MessageAttachment,
  ChatMessage
} from '../types';
import { ChatContainer } from './ChatContainer';
import { GovernancePanel } from './GovernancePanel';
import { RealTimeAlerts, AlertTemplates } from './RealTimeAlerts';
import { ChatModeService } from '../services/ChatModeService';

interface ChatWidgetProps {
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  userId: string;
  defaultMode?: ChatMode;
  allowModeSwitch?: boolean;
  showGovernance?: boolean;
  onOpenFullChat?: (sessionId?: string) => void;
  onClose?: () => void;
  maxHeight?: number;
  position?: 'embedded' | 'floating';
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  agentId,
  agentName,
  agentAvatar,
  userId,
  defaultMode = ChatMode.STANDARD,
  allowModeSwitch = true,
  showGovernance = false,
  onOpenFullChat,
  onClose,
  maxHeight = 400,
  position = 'embedded'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMode, setCurrentMode] = useState(defaultMode);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [governanceAlerts, setGovernanceAlerts] = useState<any[]>([]);

  // Get mode configuration
  const modeConfig = ChatModeService.getModeConfig(currentMode);
  const isGovernanceMode = currentMode === ChatMode.GOVERNANCE || currentMode === ChatMode.MULTI_AGENT;

  // Handle session changes
  const handleSessionChange = (session: ChatSession | null) => {
    setCurrentSession(session);
  };

  // Handle mode changes
  const handleModeChange = (mode: ChatMode) => {
    if (allowModeSwitch) {
      setCurrentMode(mode);
    }
  };

  // Handle new messages (for unread count when minimized)
  useEffect(() => {
    if (isMinimized && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender !== 'user') {
        setUnreadCount(prev => prev + 1);
      }
    } else {
      setUnreadCount(0);
    }
  }, [messages, isMinimized]);

  // Handle opening widget
  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  // Handle closing widget
  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    onClose?.();
  };

  // Handle minimizing
  const handleMinimize = () => {
    setIsMinimized(true);
  };

  // Handle maximizing
  const handleMaximize = () => {
    setIsMinimized(false);
    setUnreadCount(0);
  };

  // Handle opening full chat
  const handleOpenFullChat = () => {
    onOpenFullChat?.(currentSession?.id);
  };

  // Add sample governance alert
  const addSampleAlert = () => {
    const alert = AlertTemplates.observerSuggestion(
      'Agent response quality is excellent. Consider asking follow-up questions.'
    );
    setGovernanceAlerts(prev => [...prev, alert]);
  };

  // Dismiss alert
  const dismissAlert = (alertId: string) => {
    setGovernanceAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Widget trigger button (when closed)
  if (!isOpen) {
    return (
      <Tooltip title={`Chat with ${agentName}`}>
        <IconButton
          onClick={handleOpen}
          sx={{
            bgcolor: modeConfig.color,
            color: 'white',
            '&:hover': {
              bgcolor: modeConfig.color,
              opacity: 0.8
            },
            ...(position === 'floating' && {
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 1000,
              boxShadow: 3
            })
          }}
        >
          <Badge badgeContent={unreadCount} color="error" max={9}>
            <ChatIcon />
          </Badge>
        </IconButton>
      </Tooltip>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <Paper
        elevation={3}
        sx={{
          position: position === 'floating' ? 'fixed' : 'relative',
          bottom: position === 'floating' ? 20 : 0,
          right: position === 'floating' ? 20 : 0,
          zIndex: position === 'floating' ? 1000 : 1,
          width: 280,
          cursor: 'pointer'
        }}
        onClick={handleMaximize}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            bgcolor: modeConfig.color,
            color: 'white'
          }}
        >
          <Avatar
            src={agentAvatar}
            sx={{ width: 32, height: 32, mr: 1 }}
          >
            {agentName.charAt(0)}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              {agentName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {modeConfig.displayName}
            </Typography>
          </Box>

          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error" max={9}>
              <ChatIcon />
            </Badge>
          )}

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            sx={{ color: 'white', ml: 1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    );
  }

  // Full widget
  return (
    <Paper
      elevation={3}
      sx={{
        position: position === 'floating' ? 'fixed' : 'relative',
        bottom: position === 'floating' ? 20 : 0,
        right: position === 'floating' ? 20 : 0,
        zIndex: position === 'floating' ? 1000 : 1,
        width: 350,
        height: maxHeight,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Widget Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: modeConfig.color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Avatar
            src={agentAvatar}
            sx={{ width: 32, height: 32, mr: 1 }}
          >
            {agentName.charAt(0)}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight="bold" noWrap>
              {agentName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {modeConfig.displayName}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Mode Indicators */}
          {isGovernanceMode && (
            <Tooltip title="Governance monitoring active">
              <SecurityIcon sx={{ fontSize: 16 }} />
            </Tooltip>
          )}

          {currentMode === ChatMode.MULTI_AGENT && (
            <Tooltip title="Multi-agent system">
              <GroupIcon sx={{ fontSize: 16 }} />
            </Tooltip>
          )}

          {/* Action Buttons */}
          <Tooltip title="Open in full chat">
            <IconButton
              size="small"
              onClick={handleOpenFullChat}
              sx={{ color: 'white' }}
            >
              <LaunchIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Minimize">
            <IconButton
              size="small"
              onClick={handleMinimize}
              sx={{ color: 'white' }}
            >
              <MinimizeIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Close">
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: 'white' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Mode Switcher */}
      {allowModeSwitch && (
        <Box sx={{ p: 1, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {Object.values(ChatMode).map((mode) => {
              const config = ChatModeService.getModeConfig(mode);
              return (
                <Chip
                  key={mode}
                  label={config.displayName}
                  size="small"
                  onClick={() => handleModeChange(mode)}
                  sx={{
                    bgcolor: currentMode === mode ? config.color : 'transparent',
                    color: currentMode === mode ? 'white' : 'text.secondary',
                    border: 1,
                    borderColor: config.color,
                    fontSize: '0.7rem',
                    '&:hover': {
                      bgcolor: currentMode === mode ? config.color : `${config.color}20`
                    }
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Governance Alerts */}
      {isGovernanceMode && governanceAlerts.length > 0 && (
        <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
          <RealTimeAlerts
            alerts={governanceAlerts}
            onDismissAlert={dismissAlert}
            compact={true}
            maxVisible={2}
          />
        </Box>
      )}

      {/* Chat Container */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <ChatContainer
          agentId={agentId}
          mode={currentMode}
          userId={userId}
          onSessionChange={handleSessionChange}
          onModeChange={handleModeChange}
          compact={true}
          maxHeight="100%"
        />
      </Box>

      {/* Quick Actions Footer */}
      <Box
        sx={{
          p: 1,
          bgcolor: 'background.default',
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Quick chat with {agentName}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {isGovernanceMode && (
            <Button
              size="small"
              variant="outlined"
              onClick={addSampleAlert}
              sx={{ fontSize: '0.7rem', py: 0.25 }}
            >
              Test Alert
            </Button>
          )}
          
          <Button
            size="small"
            variant="contained"
            onClick={handleOpenFullChat}
            sx={{ fontSize: '0.7rem', py: 0.25 }}
          >
            Full Chat
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

