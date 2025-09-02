/**
 * Unified Notification Center
 * 
 * Consolidates all user interactions into a single, professional notification experience:
 * - Connection requests
 * - AI collaboration invitations  
 * - Social network interactions
 * - Marketplace transactions
 * - Professional networking
 * - Direct messages and meetings
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Button,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  CardActions,
  useTheme,
  alpha
} from '@mui/material';
import {
  Notifications,
  People,
  Business,
  ShoppingCart,
  AutoAwesome,
  Chat,
  Check,
  Close,
  Visibility,
  MoreVert,
  TrendingUp,
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
  Star
} from '@mui/icons-material';

import { useUserInteractions } from '../../hooks/useUserInteractions';
import { UserInteraction, InteractionType } from '../../services/UserInteractionRegistry';
import CollaborationInvitationModal from '../collaboration/CollaborationInvitationModal';

// Category configuration
interface NotificationCategory {
  id: 'all' | 'social' | 'professional' | 'marketplace' | 'collaboration' | 'chat';
  label: string;
  icon: React.ReactNode;
  color: string;
}

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: 'all',
    label: 'All',
    icon: <Notifications />,
    color: '#1976d2'
  },
  {
    id: 'social',
    label: 'Social',
    icon: <People />,
    color: '#e91e63'
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: <Business />,
    color: '#0077b5' // LinkedIn blue
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: <ShoppingCart />,
    color: '#ff9800'
  },
  {
    id: 'collaboration',
    label: 'AI Collaboration',
    icon: <AutoAwesome />,
    color: '#9c27b0'
  },
  {
    id: 'chat',
    label: 'Messages',
    icon: <Chat />,
    color: '#4caf50'
  }
];

// Interaction type to icon mapping
const INTERACTION_ICONS: Record<InteractionType, React.ReactNode> = {
  // Core interactions
  'connection_request': <Handshake />,
  'collaboration_invitation': <AutoAwesome />,
  'chat_invitation': <Message />,
  'meeting_request': <VideoCall />,
  'file_share_request': <Share />,
  'team_invitation': <Group />,
  'project_invitation': <Work />,
  
  // Social interactions
  'friend_request': <People />,
  'follow_request': <TrendingUp />,
  'post_like': <ThumbUp />,
  'post_comment': <Comment />,
  'post_share': <Share />,
  'group_invitation': <Group />,
  'event_invitation': <Event />,
  
  // Marketplace interactions
  'buy_request': <ShoppingCart />,
  'sell_offer': <MonetizationOn />,
  'price_negotiation': <MonetizationOn />,
  'transaction_request': <MonetizationOn />,
  'review_request': <Star />,
  'item_inquiry': <ShoppingCart />,
  
  // Professional interactions
  'professional_connection': <Business />,
  'skill_endorsement': <Star />,
  'recommendation_request': <Business />,
  'job_referral': <Work />,
  'business_proposal': <Business />,
  'mentorship_request': <School />
};

interface UnifiedNotificationCenterProps {
  open?: boolean;
  onClose?: () => void;
  maxHeight?: number;
  showCategories?: boolean;
}

export const UnifiedNotificationCenter: React.FC<UnifiedNotificationCenterProps> = ({
  open = true,
  onClose,
  maxHeight = 600,
  showCategories = true
}) => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory['id']>('all');
  const [collaborationModalOpen, setCollaborationModalOpen] = useState(false);
  const [selectedCollaborationInvitation, setSelectedCollaborationInvitation] = useState<UserInteraction | null>(null);
  
  const {
    // Category-based notifications
    socialNotifications,
    professionalNotifications,
    marketplaceNotifications,
    collaborationNotifications,
    chatNotifications,
    pendingInteractions,
    
    // Loading states
    loading,
    respondingToInteraction,
    
    // Actions
    acceptInteraction,
    declineInteraction,
    
    // Error state
    error
  } = useUserInteractions();

  // Get notifications for selected category
  const currentNotifications = useMemo(() => {
    switch (selectedCategory) {
      case 'social':
        return socialNotifications;
      case 'professional':
        return professionalNotifications;
      case 'marketplace':
        return marketplaceNotifications;
      case 'collaboration':
        return collaborationNotifications;
      case 'chat':
        return chatNotifications;
      case 'all':
      default:
        return pendingInteractions;
    }
  }, [
    selectedCategory,
    socialNotifications,
    professionalNotifications,
    marketplaceNotifications,
    collaborationNotifications,
    chatNotifications,
    pendingInteractions
  ]);

  // Calculate notification counts for badges
  const notificationCounts = useMemo(() => ({
    all: pendingInteractions.length,
    social: socialNotifications.length,
    professional: professionalNotifications.length,
    marketplace: marketplaceNotifications.length,
    collaboration: collaborationNotifications.length,
    chat: chatNotifications.length
  }), [
    pendingInteractions.length,
    socialNotifications.length,
    professionalNotifications.length,
    marketplaceNotifications.length,
    collaborationNotifications.length,
    chatNotifications.length
  ]);

  const handleAccept = async (interactionId: string) => {
    console.log('🎯 [UnifiedNotificationCenter] Accept button clicked for interaction:', interactionId);
    try {
      const result = await acceptInteraction(interactionId);
      console.log('✅ [UnifiedNotificationCenter] Accept result:', result);
    } catch (error) {
      console.error('❌ [UnifiedNotificationCenter] Accept error:', error);
    }
  };

  const handleDecline = async (interactionId: string) => {
    console.log('🎯 [UnifiedNotificationCenter] Decline button clicked for interaction:', interactionId);
    try {
      const result = await declineInteraction(interactionId);
      console.log('✅ [UnifiedNotificationCenter] Decline result:', result);
    } catch (error) {
      console.error('❌ [UnifiedNotificationCenter] Decline error:', error);
    }
  };

  const handleCollaborationInvitationClick = (interaction: UserInteraction) => {
    console.log('🎯 [UnifiedNotificationCenter] Collaboration invitation clicked:', interaction);
    setSelectedCollaborationInvitation(interaction);
    setCollaborationModalOpen(true);
    console.log('🎯 [UnifiedNotificationCenter] Modal state set - open:', true, 'invitation:', interaction);
  };

  const handleCloseCollaborationModal = () => {
    setCollaborationModalOpen(false);
    setSelectedCollaborationInvitation(null);
  };

  const getInteractionMessage = (interaction: UserInteraction): string => {
    const { type, fromUserName, metadata } = interaction;
    
    switch (type) {
      case 'connection_request':
        return `${fromUserName} wants to connect with you`;
      case 'collaboration_request':
        return `${fromUserName} invited you to join AI conversation "${metadata?.conversationName || 'AI Collaboration'}" with ${metadata?.agentName || 'AI Assistant'}`;
      case 'collaboration_invitation':
        return `${fromUserName} invited you to join AI conversation "${metadata.conversationName}" with ${metadata.agentName}`;
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
        return `${fromUserName} wants to buy "${metadata.itemTitle}" for $${metadata.offerPrice}`;
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

  const getInteractionSubtext = (interaction: UserInteraction): string => {
    const { metadata } = interaction;
    
    if (metadata.message) {
      return metadata.message;
    }
    
    if (metadata.mutualConnections) {
      return `${metadata.mutualConnections} mutual connections`;
    }
    
    return '';
  };

  const formatTimeAgo = (timestamp: any): string => {
    // Simple time formatting - in production, use a library like date-fns
    const now = new Date();
    const time = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (!open) return null;

  return (
    <>
      <Paper
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 480,
        maxHeight,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.05)
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">
            Notifications
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* Category Tabs */}
      {showCategories && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedCategory}
            onChange={(_, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 48 }}
          >
            {NOTIFICATION_CATEGORIES.map((category) => (
              <Tab
                key={category.id}
                value={category.id}
                icon={
                  <Badge
                    badgeContent={notificationCounts[category.id]}
                    color="error"
                    max={99}
                  >
                    {category.icon}
                  </Badge>
                }
                label={category.label}
                sx={{
                  minHeight: 48,
                  textTransform: 'none',
                  fontSize: '0.875rem'
                }}
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Notifications List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : currentNotifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No notifications in this category
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {currentNotifications.map((interaction, index) => (
              <React.Fragment key={interaction.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04)
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={interaction.fromUserPhoto}
                      sx={{
                        bgcolor: NOTIFICATION_CATEGORIES.find(
                          cat => cat.id === selectedCategory
                        )?.color || theme.palette.primary.main
                      }}
                    >
                      {INTERACTION_ICONS[interaction.type]}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight="medium">
                        {getInteractionMessage(interaction)}
                      </Typography>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        {getInteractionSubtext(interaction) && (
                          <Typography variant="body2" color="text.secondary">
                            {getInteractionSubtext(interaction)}
                          </Typography>
                        )}
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(interaction.createdAt)}
                          </Typography>
                          <Chip
                            label={interaction.type.replace('_', ' ')}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Stack>
                      </Stack>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      {(() => {
                        console.log('🔍 [UnifiedNotificationCenter] Rendering interaction:', {
                          id: interaction.id,
                          type: interaction.type,
                          fromUser: interaction.fromUserName,
                          isCollaboration: interaction.type === 'collaboration_request' || interaction.type === 'collaboration_invitation'
                        });
                        
                        return (interaction.type === 'collaboration_request' || interaction.type === 'collaboration_invitation') ? (
                          // Special handling for collaboration invitations - show "View Invitation" button
                          <Tooltip title="View Invitation">
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleCollaborationInvitationClick(interaction)}
                              disabled={respondingToInteraction}
                              startIcon={<AutoAwesome />}
                            >
                              View Invitation
                            </Button>
                          </Tooltip>
                        ) : (
                          // Default accept/decline buttons for other notification types
                          <>
                            <Tooltip title="Accept">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  console.log('🎯 [UnifiedNotificationCenter] Accept button clicked!');
                                  handleAccept(interaction.id);
                                }}
                                disabled={respondingToInteraction}
                              >
                                <Check />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Decline">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  console.log('🎯 [UnifiedNotificationCenter] Decline button clicked!');
                                  handleDecline(interaction.id);
                                }}
                                disabled={respondingToInteraction}
                              >
                                <Close />
                              </IconButton>
                            </Tooltip>
                          </>
                        );
                      })()}
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                
                {index < currentNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer Actions */}
      {currentNotifications.length > 0 && (
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.grey[100], 0.5)
          }}
        >
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button size="small" variant="outlined">
              Mark All Read
            </Button>
            <Button size="small" variant="outlined">
              View All
            </Button>
          </Stack>
        </Box>
      )}
    </Paper>

    {/* Collaboration Invitation Modal */}
    {console.log('🎯 [UnifiedNotificationCenter] Rendering modal - open:', collaborationModalOpen, 'invitation:', selectedCollaborationInvitation)}
    <CollaborationInvitationModal
      open={collaborationModalOpen}
      onClose={handleCloseCollaborationModal}
      invitation={selectedCollaborationInvitation}
    />
    </>
  );
};

export default UnifiedNotificationCenter;

