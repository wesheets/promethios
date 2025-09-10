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
  const { user, loading: authLoading } = useAuth();
  const { acceptInteraction, declineInteraction } = useUserInteractions();
  const { 
    refreshSharedConversations, 
    addSharedConversation, 
    handleSharedConversationSelect,
    setActiveSharedConversation,
    setIsInSharedMode
  } = useSharedConversations();
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sharedConversationService = SharedConversationService.getInstance();
  const chatbotService = ChatbotStorageService.getInstance();
  console.log('🎯 [CollaborationInvitationModal] Rendering modal:', {
    open,
    invitation: invitation ? {
      id: invitation.id,
      type: invitation.type,
      fromUserId: invitation.fromUserId,
      fromUserName: invitation.fromUserName,
      metadata: invitation.metadata
    } : null,
    user: user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    } : 'undefined',
    authLoading
  });

  // Debug: Log the full invitation metadata
  if (invitation?.metadata) {
    console.log('🔍 [CollaborationInvitationModal] Full metadata:', JSON.stringify(invitation.metadata, null, 2));
    console.log('🔍 [CollaborationInvitationModal] Metadata keys:', Object.keys(invitation.metadata));
    console.log('🔍 [CollaborationInvitationModal] conversationId:', invitation.metadata.conversationId);
    console.log('🔍 [CollaborationInvitationModal] conversationName:', invitation.metadata.conversationName);
    console.log('🔍 [CollaborationInvitationModal] agentName:', invitation.metadata.agentName);
  } else {
    console.log('❌ [CollaborationInvitationModal] No metadata found in invitation');
  }

  if (!invitation) {
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
      console.log('🔍 [CollaborationModal] Starting invitation acceptance...');
      
      // Wait for auth to complete if still loading
      if (authLoading) {
        console.log('🔍 [CollaborationModal] Auth still loading, waiting...');
        setError('Loading user information...');
        setResponding(false);
        return;
      }
      
      // Check if user is available from useAuth hook
      let currentUserId = user?.uid;
      
      // Fallback: try to get user from Firebase auth directly if useAuth fails
      if (!currentUserId) {
        console.log('🔍 [CollaborationModal] useAuth returned no user, trying Firebase auth directly...');
        try {
          // Import Firebase auth
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const firebaseUser = auth.currentUser;
          
          if (firebaseUser) {
            currentUserId = firebaseUser.uid;
            console.log('✅ [CollaborationModal] Found user via Firebase auth:', currentUserId);
          } else {
            console.log('❌ [CollaborationModal] No user in Firebase auth either');
          }
        } catch (error) {
          console.error('❌ [CollaborationModal] Error accessing Firebase auth:', error);
        }
      }
      
      // Final check for user availability
      if (!currentUserId) {
        console.error('❌ [CollaborationModal] No user available for invitation acceptance');
        console.error('❌ [CollaborationModal] Auth state:', { user, authLoading });
        setError('Unable to identify current user. Please try refreshing the page.');
        setResponding(false);
        return;
      }
      
      console.log('✅ [CollaborationModal] User authenticated:', currentUserId);
      
      const success = await acceptInteraction(invitation.id);
      
      if (success) {
        console.log('✅ [CollaborationModal] Invitation accepted successfully');
        console.log('🔄 [CollaborationModal] Using unified approach - no separate shared conversation needed');
        
        // Get the conversation ID from the invitation metadata
        let hostConversationId = invitation.metadata?.conversationId;
        
        if (!hostConversationId && invitation.metadata?.interactionId) {
          console.log('🔍 [CollaborationModal] No conversationId in notification metadata, fetching full interaction data...');
          try {
            // Import UserInteractionRegistry to fetch the full interaction
            const { userInteractionRegistry } = await import('../../services/UserInteractionRegistry');
            const fullInteraction = await userInteractionRegistry.getInteraction(invitation.metadata.interactionId);
            
            if (fullInteraction?.metadata?.conversationId) {
              hostConversationId = fullInteraction.metadata.conversationId;
              console.log('✅ [CollaborationModal] Found conversationId in full interaction:', hostConversationId);
            } else {
              console.error('❌ [CollaborationModal] No conversationId found in full interaction either');
            }
          } catch (error) {
            console.error('❌ [CollaborationModal] Error fetching full interaction:', error);
          }
        }
        
        if (!hostConversationId) {
          console.error('❌ [CollaborationModal] No conversation ID found in invitation or interaction metadata');
          setError('Invalid invitation: missing conversation information');
          setResponding(false);
          return;
        }
        
        console.log('🔍 [CollaborationModal] Host conversation ID:', hostConversationId);
        console.log('✅ [CollaborationModal] Unified system will handle access to host conversation');
        
        // Refresh the shared conversations context to load the new unified guest access
        console.log('🔄 [CollaborationModal] Refreshing shared conversations to load unified guest access');
        await refreshSharedConversations();
        
        // Wait a moment for the context to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Activate the shared conversation - create a guest access object to match the old system
        const guestAccess = {
          id: invitation.id,
          hostUserId: invitation.fromUserId,
          hostUserName: invitation.fromUserName || 'Host',
          conversationId: hostConversationId,
          conversationName: invitation.metadata?.conversationName || 'Shared Chat',
          agentName: invitation.metadata?.agentName,
          lastActivity: new Date(),
          unreadCount: 0,
          status: 'active' as const
        };
        
        console.log('🎯 [CollaborationModal] Activating shared conversation:', guestAccess);
        
        // Trigger the navigation event to activate the shared tab (same as old system)
        window.dispatchEvent(new CustomEvent('navigateToSharedConversation', {
          detail: { conversationId: guestAccess.id }
        }));
        
        // Set the active shared conversation in the context
        setActiveSharedConversation(guestAccess.id);
        setIsInSharedMode(true);
        
        console.log('🎯 [CollaborationModal] Invitation acceptance complete - unified system active');
        
        // Route to command center - the unified "Shared" tab will show the host's conversation
        // Get user's primary agent to navigate to their command center
        let userAgent = null;
        const currentUrl = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        const currentAgent = urlParams.get('agent');
        
        console.log('🔍 [CollaborationModal] Current URL:', currentUrl);
        console.log('🔍 [CollaborationModal] URL params:', Object.fromEntries(urlParams.entries()));
        
        if (currentAgent) {
          // User is already on an agent page - use that agent
          userAgent = currentAgent;
          console.log('🎯 [CollaborationModal] Using current agent from URL:', userAgent);
        } else {
          // Fallback: try to load user's chatbots from storage (same as ChatbotProfilesPageEnhanced)
          try {
            if (currentUserId) {
              console.log('🔍 [CollaborationModal] Attempting to load chatbots for user:', currentUserId);
              console.log('🔍 [CollaborationModal] ChatbotStorageService instance:', chatbotService);
              console.log('🔍 [CollaborationModal] About to call getChatbots method...');
              
              const chatbotProfiles = await chatbotService.getChatbots(currentUserId);
              
              console.log('🔍 [CollaborationModal] getChatbots returned:', chatbotProfiles?.length || 0, 'chatbots');
              console.log('🔍 [CollaborationModal] Raw chatbot response:', chatbotProfiles);
              console.log('🔍 [CollaborationModal] Chatbot data details:', chatbotProfiles);
              
              if (chatbotProfiles && chatbotProfiles.length > 0) {
                const firstChatbot = chatbotProfiles[0];
                console.log('🔍 [CollaborationModal] First chatbot object:', firstChatbot);
                console.log('🔍 [CollaborationModal] First chatbot keys:', Object.keys(firstChatbot));
                console.log('🔍 [CollaborationModal] Checking ID properties:', {
                  id: firstChatbot.id,
                  key: firstChatbot.key,
                  'identity.id': firstChatbot.identity?.id,
                  'identity.key': firstChatbot.identity?.key,
                  name: firstChatbot.name,
                  'identity.name': firstChatbot.identity?.name
                });
                
                // Try multiple possible ID properties
                userAgent = firstChatbot.id || 
                           firstChatbot.key || 
                           firstChatbot.identity?.id || 
                           firstChatbot.identity?.key ||
                           firstChatbot.name ||
                           firstChatbot.identity?.name;
                           
                console.log('🎯 [CollaborationModal] Selected agent ID:', userAgent);
                console.log('🎯 [CollaborationModal] Agent ID source:', 
                  firstChatbot.id ? 'id' :
                  firstChatbot.key ? 'key' :
                  firstChatbot.identity?.id ? 'identity.id' :
                  firstChatbot.identity?.key ? 'identity.key' :
                  firstChatbot.name ? 'name' :
                  firstChatbot.identity?.name ? 'identity.name' : 'none found'
                );
              } else {
                userAgent = null;
                console.log('🎯 [CollaborationModal] No chatbots found in response');
              }
              
              // Additional debugging - check if there are any agents in localStorage or other storage
              const localStorageKeys = Object.keys(localStorage).filter(key => 
                key.includes('chatbot') || key.includes('agent') || key.includes('claude')
              );
              console.log('🔍 [CollaborationModal] LocalStorage keys with agent/chatbot:', localStorageKeys);
              
              // Check if the main page has chatbot data in memory
              if (window && (window as any).chatbotProfiles) {
                console.log('🔍 [CollaborationModal] Found chatbotProfiles in window:', (window as any).chatbotProfiles);
              }
            }
          } catch (error) {
            console.warn('⚠️ [CollaborationModal] Could not load user chatbots:', error);
            console.error('⚠️ [CollaborationModal] Full error details:', error);
          }
        }
        
        if (!userAgent) {
          // No agent found - show error instead of trying to navigate
          console.error('❌ [CollaborationModal] No agent found - cannot navigate to command center');
          console.error('❌ [CollaborationModal] Debug info:', {
            currentUrl,
            urlParams: Object.fromEntries(urlParams.entries()),
            userId: user?.uid,
            userEmail: user?.email
          });
          setError('Unable to find your AI agent. Please make sure you have an agent configured.');
          return;
        }
        
        // Navigate to command center with agent and shared conversation parameter (same as old system)
        const commandCenterUrl = `/ui/chat/chatbots?agent=${userAgent}&shared=${guestAccess.id}`;
        console.log('🎯 [CollaborationModal] Navigating to command center with agent:', userAgent);
        console.log('🎯 [CollaborationModal] Including shared conversation parameter:', guestAccess.id);
        console.log('🚀 [CollaborationModal] Attempting navigation to:', commandCenterUrl);
        console.log('✅ [CollaborationModal] Unified system will show host conversation in Shared tab');
        
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

