import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Collapse,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Chat as ChatIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon,
  Launch as LaunchIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { ChatWidget } from './ChatWidget';
import { ChatMode } from '../types';

interface AgentCardWithChatProps {
  agent: {
    id: string;
    name: string;
    description: string;
    avatar?: string;
    category: string;
    rating: number;
    totalChats: number;
    governanceScore?: number;
    isMultiAgent?: boolean;
    capabilities: string[];
    status: 'online' | 'offline' | 'busy';
  };
  userId: string;
  onOpenFullChat?: (agentId: string, sessionId?: string) => void;
  onViewProfile?: (agentId: string) => void;
  onViewMetrics?: (agentId: string) => void;
  compact?: boolean;
}

export const AgentCardWithChat: React.FC<AgentCardWithChatProps> = ({
  agent,
  userId,
  onOpenFullChat,
  onViewProfile,
  onViewMetrics,
  compact = false
}) => {
  const [showChat, setShowChat] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(
    agent.isMultiAgent ? ChatMode.MULTI_AGENT : ChatMode.STANDARD
  );

  // Get status color
  const getStatusColor = () => {
    switch (agent.status) {
      case 'online':
        return '#4CAF50';
      case 'busy':
        return '#FF9800';
      case 'offline':
        return '#757575';
      default:
        return '#757575';
    }
  };

  // Get governance status
  const getGovernanceStatus = () => {
    if (!agent.governanceScore) return null;
    
    if (agent.governanceScore >= 90) {
      return { icon: <CheckCircleIcon />, color: '#4CAF50', label: 'Excellent' };
    } else if (agent.governanceScore >= 70) {
      return { icon: <CheckCircleIcon />, color: '#8BC34A', label: 'Good' };
    } else {
      return { icon: <WarningIcon />, color: '#FF9800', label: 'Needs Review' };
    }
  };

  const governanceStatus = getGovernanceStatus();

  // Handle chat mode selection
  const handleChatModeSelect = (mode: ChatMode) => {
    setChatMode(mode);
    setShowChat(true);
  };

  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)'
        }
      }}
    >
      {/* Agent Header */}
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getStatusColor(),
                  border: 2,
                  borderColor: 'background.paper'
                }}
              />
            }
          >
            <Avatar
              src={agent.avatar}
              sx={{ width: 56, height: 56, mr: 2 }}
            >
              {agent.name.charAt(0)}
            </Avatar>
          </Badge>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                {agent.name}
              </Typography>
              
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {agent.description}
            </Typography>

            {/* Agent Metadata */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={agent.category}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              
              {agent.isMultiAgent && (
                <Chip
                  icon={<GroupIcon />}
                  label="Multi-Agent"
                  size="small"
                  color="primary"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon sx={{ fontSize: 16, color: '#FFD700', mr: 0.25 }} />
                <Typography variant="caption">
                  {agent.rating.toFixed(1)}
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary">
                {agent.totalChats} chats
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Governance Score */}
        {governanceStatus && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <SecurityIcon sx={{ fontSize: 16, mr: 0.5, color: governanceStatus.color }} />
              <Typography variant="caption" color="text.secondary">
                Governance Score
              </Typography>
              <Typography variant="caption" fontWeight="bold" sx={{ ml: 'auto', color: governanceStatus.color }}>
                {agent.governanceScore}/100 ({governanceStatus.label})
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={agent.governanceScore}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: governanceStatus.color,
                  borderRadius: 2
                }
              }}
            />
          </Box>
        )}

        {/* Capabilities */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Capabilities
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              sx={{ ml: 'auto' }}
            >
              {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {agent.capabilities.slice(0, showDetails ? undefined : 3).map((capability) => (
              <Chip
                key={capability}
                label={capability}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.6rem', height: 20 }}
              />
            ))}
            {!showDetails && agent.capabilities.length > 3 && (
              <Chip
                label={`+${agent.capabilities.length - 3} more`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.6rem', height: 20 }}
                onClick={() => setShowDetails(true)}
              />
            )}
          </Box>
        </Box>
      </CardContent>

      {/* Quick Chat Modes */}
      <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ChatIcon />}
            onClick={() => handleChatModeSelect(ChatMode.STANDARD)}
            sx={{ flex: 1, minWidth: 'fit-content' }}
          >
            Quick Chat
          </Button>

          <Button
            size="small"
            variant="outlined"
            startIcon={<SecurityIcon />}
            onClick={() => handleChatModeSelect(ChatMode.GOVERNANCE)}
            sx={{ flex: 1, minWidth: 'fit-content' }}
          >
            Governed
          </Button>

          {agent.isMultiAgent && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={() => handleChatModeSelect(ChatMode.MULTI_AGENT)}
              sx={{ flex: 1, minWidth: 'fit-content' }}
            >
              Multi-Agent
            </Button>
          )}
        </Box>
      </CardActions>

      {/* Additional Actions */}
      <Collapse in={showDetails}>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Button
            size="small"
            startIcon={<LaunchIcon />}
            onClick={() => onOpenFullChat?.(agent.id)}
          >
            Full Chat
          </Button>

          <Button
            size="small"
            startIcon={<AssessmentIcon />}
            onClick={() => onViewMetrics?.(agent.id)}
          >
            Metrics
          </Button>

          <Button
            size="small"
            startIcon={<SettingsIcon />}
            onClick={() => onViewProfile?.(agent.id)}
          >
            Profile
          </Button>
        </CardActions>
      </Collapse>

      {/* Embedded Chat Widget */}
      {showChat && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            bgcolor: 'background.paper'
          }}
        >
          <ChatWidget
            agentId={agent.id}
            agentName={agent.name}
            agentAvatar={agent.avatar}
            userId={userId}
            defaultMode={chatMode}
            allowModeSwitch={true}
            showGovernance={chatMode === ChatMode.GOVERNANCE || chatMode === ChatMode.MULTI_AGENT}
            onOpenFullChat={(sessionId) => onOpenFullChat?.(agent.id, sessionId)}
            onClose={() => setShowChat(false)}
            maxHeight={400}
            position="embedded"
          />
        </Box>
      )}
    </Card>
  );
};

