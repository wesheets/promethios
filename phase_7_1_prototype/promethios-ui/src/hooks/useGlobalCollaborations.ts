/**
 * Global Collaborations Hook
 * 
 * React hook for managing global collaboration state that persists
 * across all command centers for multi-agent users
 */

import { useState, useEffect, useCallback } from 'react';
import { globalCollaborationService, GlobalCollaboration } from '../services/GlobalCollaborationService';
import { UserInteraction } from '../services/UserInteractionRegistry';

export interface UseGlobalCollaborationsReturn {
  // Data
  activeCollaborations: GlobalCollaboration[];
  hasActiveCollaborations: boolean;
  
  // Loading state
  loading: boolean;
  
  // Actions
  addCollaborationFromInvitation: (invitation: UserInteraction) => GlobalCollaboration;
  getCollaboration: (collaborationId: string) => GlobalCollaboration | null;
  updateActivity: (collaborationId: string) => void;
  endCollaboration: (collaborationId: string) => void;
  
  // Utilities
  shouldShowInvitationChatTab: () => boolean;
  getInvitationChatTabData: () => {
    count: number;
    latestCollaboration: GlobalCollaboration | null;
  };
}

export const useGlobalCollaborations = (): UseGlobalCollaborationsReturn => {
  const [activeCollaborations, setActiveCollaborations] = useState<GlobalCollaboration[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to collaboration changes
  useEffect(() => {
    const unsubscribe = globalCollaborationService.subscribe((collaborations) => {
      setActiveCollaborations(collaborations);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Add collaboration from accepted invitation
  const addCollaborationFromInvitation = useCallback((invitation: UserInteraction): GlobalCollaboration => {
    return globalCollaborationService.addCollaborationFromInvitation(invitation);
  }, []);

  // Get specific collaboration
  const getCollaboration = useCallback((collaborationId: string): GlobalCollaboration | null => {
    return globalCollaborationService.getCollaboration(collaborationId);
  }, []);

  // Update activity
  const updateActivity = useCallback((collaborationId: string): void => {
    globalCollaborationService.updateActivity(collaborationId);
  }, []);

  // End collaboration
  const endCollaboration = useCallback((collaborationId: string): void => {
    globalCollaborationService.endCollaboration(collaborationId);
  }, []);

  // Check if should show invitation chat tab
  const shouldShowInvitationChatTab = useCallback((): boolean => {
    return activeCollaborations.length > 0;
  }, [activeCollaborations]);

  // Get invitation chat tab data
  const getInvitationChatTabData = useCallback(() => {
    return {
      count: activeCollaborations.length,
      latestCollaboration: activeCollaborations[0] || null
    };
  }, [activeCollaborations]);

  return {
    // Data
    activeCollaborations,
    hasActiveCollaborations: activeCollaborations.length > 0,
    
    // Loading state
    loading,
    
    // Actions
    addCollaborationFromInvitation,
    getCollaboration,
    updateActivity,
    endCollaboration,
    
    // Utilities
    shouldShowInvitationChatTab,
    getInvitationChatTabData
  };
};

export default useGlobalCollaborations;

