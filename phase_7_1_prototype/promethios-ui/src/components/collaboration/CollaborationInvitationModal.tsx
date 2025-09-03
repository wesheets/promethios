/**
 * Collaboration Invitation Modal
 * 
 * Modal dialog for accepting or declining AI collaboration invitations
 * Handles routing to command center after acceptance
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Stack,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AutoAwesome,
  People,
  Chat
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { UserInteraction } from '../../services/UserInteractionRegistry';
import { useUserInteractions } from '../../hooks/useUserInteractions';
import { useSharedConversations } from '../../contexts/SharedConversationContext';
import { useAuth } from '../../context/AuthContext';
import ChatbotStorageService from '../../services/ChatbotStorageService';
import SharedConversationService from '../../services/SharedConversationService';

interface CollaborationInvitationModalProps {
  open: boolean;
  onClose: () => void;
  invitation: UserInteraction | null;
  onNotificationPanelClose?: () => void; // Optional callback to close notification panel
}

const CollaborationInvitationModal: React.FC<CollaborationInvitationModalProps> = ({
  open,
  onClose,
  invitation,
  onNotificationPanelClose
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { acceptInteraction, declineInteraction } = useUserInteractions();
  const { refreshSharedConversations } = useSharedConversations();
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sharedConversationService = SharedConversationService.getInstance();
  const chatbotService = ChatbotStorageService.getInstance();

  console.log('🎯 [CollaborationInvitationModal] Rendering modal:', {
    open,
    invitation: invitation ? {
      id: invitation.id,
      type: invitation.type,
      fromUserName: invitation.fromUserName,
      metadata: invitation.metadata
    } : null
  });

  if (!invitation) {
    console.log('🎯 [CollaborationInvitationModal] No invitation provided, not rendering');
    return null;
  }

  const { fromUserName, fromUserPhoto, metadata } = invitation;
  const conversationName = metadata?.conversationName || 'AI Conversation';
  const agentName = metadata?.agentName || 'AI Assistant';

  console.log('🎯 [CollaborationInvitationModal] Modal should be visible:', {
    open,
    conversationName,
    agentName,
    fromUserName
  });

  const handleAccept = async () => {
    setResponding(true);
    setError(null);

    try {
      const success = await acceptInteraction(invitation.id);
      
      if (success) {
        console.log('✅ [CollaborationModal] Invitation accepted, creating shared conversation');
        
        // Create a shared conversation from the collaboration invitation
        // This will automatically appear as a tab across ALL command centers
        const sharedConversation = await sharedConversationService.createSharedConversationFromInvitation({
          invitationId: invitation.id,
          conversationName: metadata?.conversationName || 'AI Collaboration',
          agentName: metadata?.agentName || 'AI Assistant',
          fromUserId: invitation.fromUserId,
          fromUserName: invitation.fromUserName,
          fromUserPhoto: invitation.fromUserPhoto,
          toUserId: invitation.toUserId,
          includeHistory: true
        });
        
        console.log('🎯 [CollaborationModal] Created shared conversation:', sharedConversation);
        
        // Refresh shared conversations to show the new tab
        await refreshSharedConversations();
        console.log('🔄 [CollaborationModal] Refreshed shared conversations');
        
        // Route to command center - the shared conversation tab will be visible
        // Works for users with/without agents - limited command center for those without
        
        // Get user's primary agent to navigate to their command center
        // First check if user is already on an agent page (most reliable)
        let userAgent = null;
        const currentUrl = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        const currentAgent = urlParams.get('agent');
        
        if (currentAgent) {
          // User is already on an agent page - use that agent
          userAgent = currentAgent;
          console.log('🎯 [CollaborationModal] Using current agent from URL:', userAgent);
        } else {
          // Fallback: try to load user's chatbots from storage
          try {
            if (user?.uid) {
              const chatbotProfiles = await chatbotService.getChatbots(user.uid);
              userAgent = chatbotProfiles && chatbotProfiles.length > 0 ? chatbotProfiles[0].id : null;
              console.log('🎯 [CollaborationModal] Found', chatbotProfiles?.length || 0, 'chatbots for user');
            }
          } catch (error) {
            console.warn('⚠️ [CollaborationModal] Could not load user chatbots:', error);
          }
        }
        
        if (!userAgent) {
          // No agent found - show error instead of trying to navigate
          console.error('❌ [CollaborationModal] No agent found - cannot navigate to command center');
          setError('Unable to find your AI agent. Please make sure you have an agent configured.');
          return;
        }
        
        // Navigate to command center with agent and shared conversation
        const commandCenterUrl = `/ui/chat/chatbots?agent=${userAgent}&shared=${sharedConversation.id}`;
        console.log('🎯 [CollaborationModal] Navigating to command center with agent:', userAgent);
        console.log('🚀 [CollaborationModal] Attempting navigation to:', commandCenterUrl);
        
        try {
          navigate(commandCenterUrl);
          console.log('✅ [CollaborationModal] Navigation call completed');
        } catch (navError) {
          console.error('❌ [CollaborationModal] Navigation failed:', navError);
          // Fallback: use window.location
          console.log('🔄 [CollaborationModal] Trying window.location fallback');
          window.location.href = commandCenterUrl;
        }
        
        onClose();
        
        // Close the notification panel after successful acceptance
        if (onNotificationPanelClose) {
          console.log('🔄 [CollaborationModal] Closing notification panel');
          onNotificationPanelClose();
        }
      } else {
        setError('Failed to accept invitation. Please try again.');
      }
    } catch (err) {
      console.error('❌ [CollaborationModal] Error accepting invitation:', err);
      setError('An error occurred while accepting the invitation.');
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    setResponding(true);
    setError(null);

    try {
      const success = await declineInteraction(invitation.id);
      
      if (success) {
        console.log('✅ [CollaborationModal] Invitation declined');
        onClose();
      } else {
        setError('Failed to decline invitation. Please try again.');
      }
    } catch (err) {
      console.error('❌ [CollaborationModal] Error declining invitation:', err);
      setError('An error occurred while declining the invitation.');
    } finally {
      setResponding(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        zIndex: 10000, // Ensure modal appears above everything
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.8)' // Darker backdrop for better visibility
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#1e293b',
          border: '2px solid #22d3ee', // Bright border for debugging
          boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)' // Glowing effect for debugging
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <AutoAwesome sx={{ color: '#22d3ee' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>
            AI Collaboration Invitation
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Stack spacing={3}>
          {/* Invitation Details */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.2)'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Avatar
                src={fromUserPhoto}
                sx={{ width: 48, height: 48 }}
              >
                {fromUserName?.[0] || '?'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                  {fromUserName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  wants to collaborate with you
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Chat sx={{ fontSize: 16, color: '#22d3ee' }} />
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    Conversation
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', ml: 3 }}>
                  "{conversationName}"
                </Typography>
              </Box>

              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <AutoAwesome sx={{ fontSize: 16, color: '#22d3ee' }} />
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    AI Assistant
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', ml: 3 }}>
                  {agentName}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* What happens next */}
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
              <strong>What happens when you accept:</strong>
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <People sx={{ fontSize: 16, color: '#10b981' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  You'll join the AI collaboration session
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chat sx={{ fontSize: 16, color: '#10b981' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Access to shared conversation and chat
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AutoAwesome sx={{ fontSize: 16, color: '#10b981' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Collaborate with the AI assistant together
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)' }}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={responding}
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDecline}
          disabled={responding}
          variant="outlined"
          color="error"
          startIcon={responding ? <CircularProgress size={16} /> : null}
        >
          Decline
        </Button>
        <Button
          onClick={handleAccept}
          disabled={responding}
          variant="contained"
          sx={{
            bgcolor: '#22d3ee',
            color: '#0f172a',
            '&:hover': { bgcolor: '#06b6d4' }
          }}
          startIcon={responding ? <CircularProgress size={16} /> : null}
        >
          Accept & Join
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CollaborationInvitationModal;

