import React from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Fade,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  Sync as SyncingIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  SYNCING = 'syncing',
  ERROR = 'error'
}

interface TypingIndicatorProps {
  isTyping: boolean;
  sender?: string;
  avatar?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isTyping,
  sender = 'Agent',
  avatar
}) => {
  return (
    <Fade in={isTyping}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          ml: 1
        }}
      >
        <Avatar
          sx={{
            bgcolor: '#4CAF50',
            width: 32,
            height: 32,
            mr: 1
          }}
          src={avatar}
        >
          {sender.charAt(0)}
        </Avatar>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            minWidth: 80
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                  animation: 'typing-pulse 1.4s infinite',
                  animationDelay: `${index * 0.2}s`,
                  '@keyframes typing-pulse': {
                    '0%, 60%, 100%': {
                      opacity: 0.3,
                      transform: 'scale(1)'
                    },
                    '30%': {
                      opacity: 1,
                      transform: 'scale(1.2)'
                    }
                  }
                }}
              />
            ))}
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            {sender} is typing...
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  lastSeen?: Date;
  onRetry?: () => void;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  lastSeen,
  onRetry
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return {
          icon: <ConnectedIcon />,
          color: '#4CAF50',
          label: 'Connected',
          description: 'Real-time connection active'
        };
      case ConnectionStatus.DISCONNECTED:
        return {
          icon: <DisconnectedIcon />,
          color: '#F44336',
          label: 'Disconnected',
          description: lastSeen ? `Last seen ${lastSeen.toLocaleTimeString()}` : 'Connection lost'
        };
      case ConnectionStatus.CONNECTING:
        return {
          icon: <CircularProgress size={16} />,
          color: '#FF9800',
          label: 'Connecting',
          description: 'Establishing connection...'
        };
      case ConnectionStatus.SYNCING:
        return {
          icon: <SyncingIcon />,
          color: '#2196F3',
          label: 'Syncing',
          description: 'Synchronizing messages...'
        };
      case ConnectionStatus.ERROR:
        return {
          icon: <ErrorIcon />,
          color: '#F44336',
          label: 'Error',
          description: 'Connection error occurred'
        };
      default:
        return {
          icon: <DisconnectedIcon />,
          color: '#757575',
          label: 'Unknown',
          description: 'Connection status unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip title={config.description}>
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        onClick={status === ConnectionStatus.ERROR || status === ConnectionStatus.DISCONNECTED ? onRetry : undefined}
        sx={{
          bgcolor: `${config.color}20`,
          color: config.color,
          border: 1,
          borderColor: `${config.color}40`,
          cursor: (status === ConnectionStatus.ERROR || status === ConnectionStatus.DISCONNECTED) && onRetry ? 'pointer' : 'default',
          '& .MuiChip-icon': {
            color: config.color
          },
          '&:hover': {
            bgcolor: (status === ConnectionStatus.ERROR || status === ConnectionStatus.DISCONNECTED) && onRetry 
              ? `${config.color}30` 
              : `${config.color}20`
          }
        }}
      />
    </Tooltip>
  );
};

interface MultiAgentTypingIndicatorProps {
  typingAgents: Array<{
    id: string;
    name: string;
    avatar?: string;
    activity?: string;
  }>;
}

export const MultiAgentTypingIndicator: React.FC<MultiAgentTypingIndicatorProps> = ({
  typingAgents
}) => {
  if (typingAgents.length === 0) return null;

  return (
    <Fade in={typingAgents.length > 0}>
      <Box sx={{ mb: 2 }}>
        {typingAgents.map((agent) => (
          <Box
            key={agent.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              ml: 1
            }}
          >
            <Avatar
              sx={{
                bgcolor: '#FF9800',
                width: 28,
                height: 28,
                mr: 1,
                fontSize: '0.8rem'
              }}
              src={agent.avatar}
            >
              {agent.name.charAt(0)}
            </Avatar>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'background.paper',
                borderRadius: 2,
                p: 1,
                border: 1,
                borderColor: 'divider',
                minWidth: 120
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.3, mr: 1 }}>
                {[0, 1, 2].map((index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: '#FF9800',
                      animation: 'multi-agent-pulse 1.2s infinite',
                      animationDelay: `${index * 0.15}s`,
                      '@keyframes multi-agent-pulse': {
                        '0%, 60%, 100%': {
                          opacity: 0.4,
                          transform: 'scale(1)'
                        },
                        '30%': {
                          opacity: 1,
                          transform: 'scale(1.3)'
                        }
                      }
                    }}
                  />
                ))}
              </Box>
              
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {agent.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                  {agent.activity || 'processing...'}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Fade>
  );
};

interface GovernanceStatusIndicatorProps {
  isActive: boolean;
  score?: number;
  violations?: number;
  onToggle?: (enabled: boolean) => void;
}

export const GovernanceStatusIndicator: React.FC<GovernanceStatusIndicatorProps> = ({
  isActive,
  score,
  violations = 0,
  onToggle
}) => {
  const getStatusColor = () => {
    if (!isActive) return '#757575';
    if (violations > 0) return '#F44336';
    if (score && score >= 90) return '#4CAF50';
    if (score && score >= 70) return '#FF9800';
    return '#F44336';
  };

  const getStatusIcon = () => {
    if (!isActive) return <DisconnectedIcon />;
    if (violations > 0) return <ErrorIcon />;
    return <CheckCircleIcon />;
  };

  const getStatusLabel = () => {
    if (!isActive) return 'Governance Disabled';
    if (violations > 0) return `${violations} Violation${violations > 1 ? 's' : ''}`;
    if (score) return `Score: ${Math.round(score)}/100`;
    return 'Monitoring Active';
  };

  return (
    <Tooltip title={isActive ? 'Governance monitoring is active' : 'Click to enable governance monitoring'}>
      <Chip
        icon={getStatusIcon()}
        label={getStatusLabel()}
        size="small"
        onClick={() => onToggle?.(!isActive)}
        sx={{
          bgcolor: `${getStatusColor()}20`,
          color: getStatusColor(),
          border: 1,
          borderColor: `${getStatusColor()}40`,
          cursor: onToggle ? 'pointer' : 'default',
          '& .MuiChip-icon': {
            color: getStatusColor()
          },
          '&:hover': {
            bgcolor: onToggle ? `${getStatusColor()}30` : `${getStatusColor()}20`
          }
        }}
      />
    </Tooltip>
  );
};

// Combined status bar component
interface ChatStatusBarProps {
  connectionStatus: ConnectionStatus;
  governanceActive: boolean;
  governanceScore?: number;
  governanceViolations?: number;
  typingAgents?: Array<{
    id: string;
    name: string;
    avatar?: string;
    activity?: string;
  }>;
  onRetryConnection?: () => void;
  onToggleGovernance?: (enabled: boolean) => void;
}

export const ChatStatusBar: React.FC<ChatStatusBarProps> = ({
  connectionStatus,
  governanceActive,
  governanceScore,
  governanceViolations,
  typingAgents = [],
  onRetryConnection,
  onToggleGovernance
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1,
        bgcolor: 'background.default',
        borderTop: 1,
        borderColor: 'divider',
        minHeight: 40
      }}
    >
      {/* Left side - Typing indicators */}
      <Box sx={{ flex: 1 }}>
        {typingAgents.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              {typingAgents.length === 1 
                ? `${typingAgents[0].name} is ${typingAgents[0].activity || 'typing'}...`
                : `${typingAgents.length} agents are active`
              }
            </Typography>
          </Box>
        )}
      </Box>

      {/* Right side - Status indicators */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GovernanceStatusIndicator
          isActive={governanceActive}
          score={governanceScore}
          violations={governanceViolations}
          onToggle={onToggleGovernance}
        />
        
        <ConnectionStatusIndicator
          status={connectionStatus}
          onRetry={onRetryConnection}
        />
      </Box>
    </Box>
  );
};

