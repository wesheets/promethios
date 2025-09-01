/**
 * Collaboration Invitations Hook (Unified)
 * 
 * Now uses the unified notification system for consistent experience
 * Maintains backward compatibility for existing components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserInteractions } from './useUserInteractions';
import { 
  chatInvitationService,
  CollaborationInvitation,
  AICollaborationInvitationRequest
} from '../services/ChatInvitationService';

export interface UseCollaborationInvitationsReturn {
  // Data
  pendingInvitations: CollaborationInvitation[];
  
  // Loading states
  loading: boolean;
  sendingInvitation: boolean;
  respondingToInvitation: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  sendInvitation: (invitation: AICollaborationInvitationRequest) => Promise<boolean>;
  acceptInvitation: (invitationId: string) => Promise<boolean>;
  declineInvitation: (invitationId: string) => Promise<boolean>;
  
  // Utilities
  hasPendingInvitationFrom: (userId: string) => boolean;
  refreshInvitations: () => Promise<void>;
}

export const useCollaborationInvitations = (): UseCollaborationInvitationsReturn => {
  const { currentUser } = useAuth();
  
  // Use unified notification system
  const {
    collaborationNotifications,
    sendInteraction,
    acceptInteraction,
    declineInteraction,
    loading: unifiedLoading,
    sendingInteraction,
    respondingToInteraction,
    error: unifiedError
  } = useUserInteractions();

  // Local loading states for backward compatibility
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert unified notifications to legacy format for backward compatibility
  const pendingInvitations = useMemo(() => {
    return collaborationNotifications.map(interaction => ({
      id: interaction.id,
      fromUserId: interaction.fromUserId,
      fromUserName: interaction.fromUserName,
      fromUserPhoto: interaction.fromUserPhoto,
      toUserId: interaction.toUserId,
      toUserName: interaction.toUserName,
      toUserPhoto: interaction.toUserPhoto,
      conversationId: interaction.metadata.conversationId || '',
      conversationName: interaction.metadata.conversationName || '',
      agentName: interaction.metadata.agentName,
      message: interaction.metadata.message,
      status: interaction.status as 'pending' | 'accepted' | 'declined',
      createdAt: interaction.createdAt,
      updatedAt: interaction.updatedAt
    }));
  }, [collaborationNotifications]);

  // Actions using unified system
  const sendInvitation = useCallback(async (invitation: AICollaborationInvitationRequest): Promise<boolean> => {
    if (!currentUser?.uid) return false;

    setSendingInvitation(true);
    setError(null);

    try {
      console.log('🤖 [useCollaborationInvitations] Sending invitation via unified system');
      
      // Use the updated ChatInvitationService which uses unified registry
      const result = await chatInvitationService.sendCollaborationInvitation(invitation);

      if (result.success) {
        console.log('✅ [useCollaborationInvitations] Invitation sent successfully');
        return true;
      } else {
        setError(result.error || 'Failed to send invitation');
        return false;
      }

    } catch (err) {
      console.error('❌ [useCollaborationInvitations] Error sending invitation:', err);
      setError('Failed to send invitation');
      return false;
    } finally {
      setSendingInvitation(false);
    }
  }, [currentUser?.uid]);

  const acceptInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    if (!currentUser?.uid) return false;

    try {
      console.log('🤖 [useCollaborationInvitations] Accepting invitation via unified system');
      
      // Use unified system
      const success = await acceptInteraction(invitationId);

      if (success) {
        console.log('✅ [useCollaborationInvitations] Invitation accepted successfully');
      }

      return success;

    } catch (err) {
      console.error('❌ [useCollaborationInvitations] Error accepting invitation:', err);
      setError('Failed to accept invitation');
      return false;
    }
  }, [currentUser?.uid, acceptInteraction]);

  const declineInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    if (!currentUser?.uid) return false;

    try {
      console.log('🤖 [useCollaborationInvitations] Declining invitation via unified system');
      
      // Use unified system
      const success = await declineInteraction(invitationId);

      if (success) {
        console.log('✅ [useCollaborationInvitations] Invitation declined successfully');
      }

      return success;

    } catch (err) {
      console.error('❌ [useCollaborationInvitations] Error declining invitation:', err);
      setError('Failed to decline invitation');
      return false;
    }
  }, [currentUser?.uid, declineInteraction]);

  // Utilities
  const hasPendingInvitationFrom = useCallback((userId: string): boolean => {
    return pendingInvitations.some(invitation => 
      invitation.fromUserId === userId && invitation.status === 'pending'
    );
  }, [pendingInvitations]);

  const refreshInvitations = useCallback(async (): Promise<void> => {
    // The unified system handles real-time updates automatically
    console.log('🤖 [useCollaborationInvitations] Refresh requested - unified system handles this automatically');
  }, []);

  // Sync errors from unified system
  useEffect(() => {
    if (unifiedError) {
      setError(unifiedError);
    }
  }, [unifiedError]);

  return {
    // Data
    pendingInvitations,
    
    // Loading states (combine unified and local states)
    loading: unifiedLoading,
    sendingInvitation: sendingInvitation || sendingInteraction,
    respondingToInvitation,
    
    // Error states
    error: error || unifiedError,
    
    // Actions
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    
    // Utilities
    hasPendingInvitationFrom,
    refreshInvitations
  };
};

export default useCollaborationInvitations;

