/**
 * Collaboration Invitation Panel (Unified)
 * 
 * Now uses the unified notification system for consistent experience
 * Displays collaboration invitations from the UserInteractionRegistry
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  SmartToy,
  AutoAwesome
} from '@mui/icons-material';

// Use unified notification system
import { useUserInteractions } from '../hooks/useUserInteractions';
import { InteractionNotificationCard } from './notifications/InteractionNotificationCard';

interface CollaborationInvitationPanelProps {
  onJoinConversation?: (conversationId: string) => void;
  onViewProfile?: (userId: string) => void;
  showTitle?: boolean;
  maxHeight?: number;
}

export const CollaborationInvitationPanel: React.FC<CollaborationInvitationPanelProps> = ({
  onJoinConversation,
  onViewProfile,
  showTitle = true,
  maxHeight = 400
}) => {
  // Use unified notification system
  const {
    collaborationNotifications,
    acceptInteraction,
    declineInteraction,
    respondingToInteraction,
    loading,
    error
  } = useUserInteractions();

  const handleAccept = async (interactionId: string) => {
    const success = await acceptInteraction(interactionId);
    
    if (success && onJoinConversation) {
      // Find the interaction to get conversation ID
      const interaction = collaborationNotifications.find(inv => inv.id === interactionId);
      if (interaction?.metadata.conversationId) {
        onJoinConversation(interaction.metadata.conversationId);
      }
    }
  };

  const handleDecline = async (interactionId: string) => {
    await declineInteraction(interactionId);
  };

  const handleView = (interaction: any) => {
    if (onViewProfile) {
      onViewProfile(interaction.fromUserId);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, maxHeight, overflow: 'auto' }}>
      {showTitle && (
        <>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <AutoAwesome color="primary" />
            <Typography variant="h6" fontWeight="bold">
              AI Collaboration Invitations
            </Typography>
            {collaborationNotifications.length > 0 && (
              <Chip 
                label={collaborationNotifications.length} 
                color="primary" 
                size="small" 
              />
            )}
          </Stack>
          <Divider sx={{ mb: 2 }} />
        </>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {collaborationNotifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SmartToy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No collaboration invitations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When someone invites you to join an AI conversation, it will appear here
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {collaborationNotifications.map((invitation) => (
            <InteractionNotificationCard
              key={invitation.id}
              interaction={invitation}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onView={handleView}
              loading={respondingToInteraction}
              compact={false}
            />
          ))}
        </Stack>
      )}

      {/* Legacy compatibility info */}
      {collaborationNotifications.length > 0 && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="info.contrastText">
            💡 Tip: All notifications are now unified! Check the main notification center for all your interactions.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CollaborationInvitationPanel;

