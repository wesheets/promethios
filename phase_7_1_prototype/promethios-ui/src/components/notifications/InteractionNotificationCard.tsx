/**
 * Interaction Notification Card
 * 
 * Reusable component for displaying individual interaction notifications
 * with type-specific styling and actions
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  Box,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import {
  Check,
  Close,
  Visibility,
  MoreVert,
  AutoAwesome,
  People,
  Business,
  ShoppingCart,
  Chat,
  Handshake,
  Message,
  VideoCall,
  Share,
  ThumbUp,
  Comment,
  Group,
  Event,
  MonetizationOn,
  Work,
  School,
  Star,
  TrendingUp
} from '@mui/icons-material';

import { UserInteraction, InteractionType } from '../../services/UserInteractionRegistry';

// Interaction type styling configuration
interface InteractionTypeConfig {
  color: string;
  backgroundColor: string;
  icon: React.ReactNode;
  category: 'social' | 'professional' | 'marketplace' | 'collaboration' | 'chat' | 'connection';
}

const INTERACTION_TYPE_CONFIG: Record<InteractionType, InteractionTypeConfig> = {
  // Core interactions
  'connection_request': {
    color: '#1976d2',
    backgroundColor: alpha('#1976d2', 0.1),
    icon: <Handshake />,
    category: 'connection'
  },
  'collaboration_invitation': {
    color: '#9c27b0',
    backgroundColor: alpha('#9c27b0', 0.1),
    icon: <AutoAwesome />,
    category: 'collaboration'
  },
  'chat_invitation': {
    color: '#4caf50',
    backgroundColor: alpha('#4caf50', 0.1),
    icon: <Message />,
    category: 'chat'
  },
  'meeting_request': {
    color: '#4caf50',
    backgroundColor: alpha('#4caf50', 0.1),
    icon: <VideoCall />,
    category: 'chat'
  },
  'file_share_request': {
    color: '#ff9800',
    backgroundColor: alpha('#ff9800', 0.1),
    icon: <Share />,
    category: 'collaboration'
  },
  'team_invitation': {
    color: '#9c27b0',
    backgroundColor: alpha('#9c27b0', 0.1),
    icon: <Group />,
    category: 'collaboration'
  },
  'project_invitation': {
    color: '#9c27b0',
    backgroundColor: alpha('#9c27b0', 0.1),
    icon: <Work />,
    category: 'collaboration'
  },
  
  // Social interactions
  'friend_request': {
    color: '#e91e63',
    backgroundColor: alpha('#e91e63', 0.1),
    icon: <People />,
    category: 'social'
  },
  'follow_request': {
    color: '#e91e63',
    backgroundColor: alpha('#e91e63', 0.1),
    icon: <TrendingUp />,
    category: 'social'
  },
  'post_like': {
    color: '#e91e63',
    backgroundColor: alpha('#e91e63', 0.1),
    icon: <ThumbUp />,
    category: 'social'
  },
  'post_comment': {
    color: '#e91e63',
    backgroundColor: alpha('#e91e63', 0.1),
    icon: <Comment />,
    category: 'social'
  },
  'post_share': {
    color: '#e91e63',
    backgroundColor: alpha('#e91e63', 0.1),
    icon: <Share />,
    category: 'social'
  },
  'group_invitation': {
    color: '#e91e63',
    backgroundColor: alpha('#e91e63', 0.1),
    icon: <Group />,
    category: 'social'
  },
  'event_invitation': {
    color: '#e91e63',
    backgroundColor: alpha('#e91e63', 0.1),
    icon: <Event />,
    category: 'social'
  },
  
  // Marketplace interactions
  'buy_request': {
    color: '#ff9800',
    backgroundColor: alpha('#ff9800', 0.1),
    icon: <ShoppingCart />,
    category: 'marketplace'
  },
  'sell_offer': {
    color: '#ff9800',
    backgroundColor: alpha('#ff9800', 0.1),
    icon: <MonetizationOn />,
    category: 'marketplace'
  },
  'price_negotiation': {
    color: '#ff9800',
    backgroundColor: alpha('#ff9800', 0.1),
    icon: <MonetizationOn />,
    category: 'marketplace'
  },
  'transaction_request': {
    color: '#ff9800',
    backgroundColor: alpha('#ff9800', 0.1),
    icon: <MonetizationOn />,
    category: 'marketplace'
  },
  'review_request': {
    color: '#ff9800',
    backgroundColor: alpha('#ff9800', 0.1),
    icon: <Star />,
    category: 'marketplace'
  },
  'item_inquiry': {
    color: '#ff9800',
    backgroundColor: alpha('#ff9800', 0.1),
    icon: <ShoppingCart />,
    category: 'marketplace'
  },
  
  // Professional interactions
  'professional_connection': {
    color: '#0077b5',
    backgroundColor: alpha('#0077b5', 0.1),
    icon: <Business />,
    category: 'professional'
  },
  'skill_endorsement': {
    color: '#0077b5',
    backgroundColor: alpha('#0077b5', 0.1),
    icon: <Star />,
    category: 'professional'
  },
  'recommendation_request': {
    color: '#0077b5',
    backgroundColor: alpha('#0077b5', 0.1),
    icon: <Business />,
    category: 'professional'
  },
  'job_referral': {
    color: '#0077b5',
    backgroundColor: alpha('#0077b5', 0.1),
    icon: <Work />,
    category: 'professional'
  },
  'business_proposal': {
    color: '#0077b5',
    backgroundColor: alpha('#0077b5', 0.1),
    icon: <Business />,
    category: 'professional'
  },
  'mentorship_request': {
    color: '#0077b5',
    backgroundColor: alpha('#0077b5', 0.1),
    icon: <School />,
    category: 'professional'
  }
};

interface InteractionNotificationCardProps {
  interaction: UserInteraction;
  onAccept?: (interactionId: string) => Promise<void>;
  onDecline?: (interactionId: string) => Promise<void>;
  onView?: (interaction: UserInteraction) => void;
  loading?: boolean;
  compact?: boolean;
  showActions?: boolean;
}

export const InteractionNotificationCard: React.FC<InteractionNotificationCardProps> = ({
  interaction,
  onAccept,
  onDecline,
  onView,
  loading = false,
  compact = false,
  showActions = true
}) => {
  const theme = useTheme();
  const config = INTERACTION_TYPE_CONFIG[interaction.type];

  const getInteractionMessage = (): string => {
    const { type, fromUserName, metadata } = interaction;
    
    switch (type) {
      case 'connection_request':
        return `${fromUserName} wants to connect with you`;
      case 'collaboration_invitation':
        return `${fromUserName} invited you to join AI conversation "${metadata.conversationName}"`;
      case 'chat_invitation':
        return `${fromUserName} invited you to chat`;
      case 'friend_request':
        return `${fromUserName} sent you a friend request`;
      case 'follow_request':
        return `${fromUserName} wants to follow you`;
      case 'post_like':
        return `${fromUserName} liked your post`;
      case 'post_comment':
        return `${fromUserName} commented on your post`;
      case 'buy_request':
        return `${fromUserName} wants to buy "${metadata.itemTitle}"`;
      case 'professional_connection':
        return `${fromUserName} wants to connect professionally`;
      case 'skill_endorsement':
        return `${fromUserName} endorsed your ${metadata.skill} skills`;
      case 'meeting_request':
        return `${fromUserName} wants to schedule a meeting`;
      default:
        return `${fromUserName} sent you a ${type.replace('_', ' ')}`;
    }
  };

  const getInteractionDetails = (): string[] => {
    const { metadata } = interaction;
    const details: string[] = [];
    
    if (metadata.message) {
      details.push(metadata.message);
    }
    
    if (metadata.mutualConnections) {
      details.push(`${metadata.mutualConnections} mutual connections`);
    }
    
    if (metadata.price && metadata.currency) {
      details.push(`Price: ${metadata.currency}${metadata.price}`);
    }
    
    if (metadata.agentName) {
      details.push(`AI Agent: ${metadata.agentName}`);
    }
    
    return details;
  };

  const formatTimeAgo = (timestamp: any): string => {
    const now = new Date();
    const time = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const handleAccept = async () => {
    if (onAccept) {
      await onAccept(interaction.id);
    }
  };

  const handleDecline = async () => {
    if (onDecline) {
      await onDecline(interaction.id);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(interaction);
    }
  };

  return (
    <Card
      sx={{
        mb: compact ? 1 : 2,
        border: `1px solid ${alpha(config.color, 0.2)}`,
        borderLeft: `4px solid ${config.color}`,
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ pb: compact ? 1 : 2 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {/* User Avatar with Type Icon */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={interaction.fromUserPhoto}
              sx={{ 
                width: compact ? 40 : 48, 
                height: compact ? 40 : 48,
                border: `2px solid ${config.color}`
              }}
            >
              {interaction.fromUserName.charAt(0).toUpperCase()}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: config.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${theme.palette.background.paper}`,
                '& svg': { fontSize: 12 }
              }}
            >
              {config.icon}
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant={compact ? "body2" : "body1"} 
              fontWeight="medium"
              sx={{ mb: 0.5 }}
            >
              {getInteractionMessage()}
            </Typography>

            {/* Details */}
            {getInteractionDetails().map((detail, index) => (
              <Typography
                key={index}
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                {detail}
              </Typography>
            ))}

            {/* Metadata */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(interaction.createdAt)}
              </Typography>
              <Chip
                label={interaction.type.replace('_', ' ')}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  bgcolor: config.backgroundColor,
                  color: config.color,
                  border: `1px solid ${alpha(config.color, 0.3)}`
                }}
              />
            </Stack>
          </Box>

          {/* Quick Actions */}
          {!compact && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="More options">
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      </CardContent>

      {/* Action Buttons */}
      {showActions && (
        <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Check />}
              onClick={handleAccept}
              disabled={loading}
              sx={{
                bgcolor: config.color,
                '&:hover': {
                  bgcolor: alpha(config.color, 0.8)
                }
              }}
            >
              Accept
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Close />}
              onClick={handleDecline}
              disabled={loading}
              color="error"
            >
              Decline
            </Button>
            <Button
              variant="text"
              size="small"
              startIcon={<Visibility />}
              onClick={handleView}
              sx={{ ml: 'auto' }}
            >
              View
            </Button>
          </Stack>
        </CardActions>
      )}
    </Card>
  );
};

export default InteractionNotificationCard;

