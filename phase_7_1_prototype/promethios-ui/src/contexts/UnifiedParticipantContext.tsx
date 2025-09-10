/**
 * UnifiedParticipantContext - Provides real-time participant updates across the application
 * Manages participant state and synchronization for unified collaboration
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { unifiedParticipantService, UnifiedParticipant } from '../services/UnifiedParticipantService';

export interface UnifiedParticipantContextType {
  // Current participants
  participants: UnifiedParticipant[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Current user info
  currentUserId?: string;
  isHost: boolean;
  
  // Participant management
  addAIAgent: (agentConfig: {
    id: string;
    name: string;
    provider?: string;
    model?: string;
    systemPrompt?: string;
    color?: string;
    hotkey?: string;
    avatar?: string;
  }) => Promise<void>;
  
  removeParticipant: (participantId: string) => Promise<void>;
  
  // Permission checks
  canAddAgents: boolean;
  canRemoveParticipant: (participantId: string) => boolean;
  
  // Utility functions
  getParticipantById: (id: string) => UnifiedParticipant | undefined;
  getActiveParticipants: () => UnifiedParticipant[];
  getPendingParticipants: () => UnifiedParticipant[];
  getHumanParticipants: () => UnifiedParticipant[];
  getAIAgentParticipants: () => UnifiedParticipant[];
  
  // Connection status
  isConnected: boolean;
  lastUpdate: Date | null;
}

const UnifiedParticipantContext = createContext<UnifiedParticipantContextType | undefined>(undefined);

export interface UnifiedParticipantProviderProps {
  children: React.ReactNode;
  conversationId: string;
  currentUserId: string;
  enabled?: boolean; // Flag to enable/disable the unified system
}

export const UnifiedParticipantProvider: React.FC<UnifiedParticipantProviderProps> = ({
  children,
  conversationId,
  currentUserId,
  enabled = true
}) => {
  const [participants, setParticipants] = useState<UnifiedParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Derived state
  const currentUser = participants.find(p => p.id === currentUserId);
  const isHost = currentUser?.permissions.isHost || false;
  const canAddAgents = currentUser?.permissions.canAddAgents || false;

  // Initialize and subscribe to participant updates
  useEffect(() => {
    if (!enabled || !conversationId || !currentUserId) {
      console.log('🔕 [UnifiedParticipantContext] Not enabled or missing required props');
      return;
    }

    console.log('🔔 [UnifiedParticipantContext] Setting up participant subscription:', {
      conversationId,
      currentUserId,
      enabled
    });

    setLoading(true);
    setError(null);

    // Subscribe to real-time updates
    const unsubscribe = unifiedParticipantService.subscribeToParticipants(
      conversationId,
      (updatedParticipants) => {
        console.log('🔔 [UnifiedParticipantContext] Received participant update:', {
          count: updatedParticipants.length,
          participants: updatedParticipants.map(p => ({ id: p.id, name: p.name, status: p.status }))
        });

        setParticipants(updatedParticipants);
        setIsConnected(true);
        setLastUpdate(new Date());
        setLoading(false);
        setError(null);
      }
    );

    // Handle connection errors
    const handleError = (err: any) => {
      console.error('❌ [UnifiedParticipantContext] Subscription error:', err);
      setError('Failed to connect to participant updates');
      setIsConnected(false);
      setLoading(false);
    };

    // Cleanup subscription on unmount
    return () => {
      console.log('🔕 [UnifiedParticipantContext] Cleaning up participant subscription');
      unsubscribe();
    };
  }, [conversationId, currentUserId, enabled]);

  // Add AI agent
  const addAIAgent = useCallback(async (agentConfig: {
    id: string;
    name: string;
    provider?: string;
    model?: string;
    systemPrompt?: string;
    color?: string;
    hotkey?: string;
    avatar?: string;
  }) => {
    try {
      console.log('🤖 [UnifiedParticipantContext] Adding AI agent:', agentConfig.name);
      
      await unifiedParticipantService.addAIAgentParticipant(
        conversationId,
        agentConfig.id,
        agentConfig.name,
        currentUserId,
        agentConfig
      );
      
      console.log('✅ [UnifiedParticipantContext] AI agent added successfully');
      
    } catch (error) {
      console.error('❌ [UnifiedParticipantContext] Failed to add AI agent:', error);
      setError(`Failed to add AI agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [conversationId, currentUserId]);

  // Remove participant
  const removeParticipant = useCallback(async (participantId: string) => {
    try {
      console.log('🗑️ [UnifiedParticipantContext] Removing participant:', participantId);
      
      await unifiedParticipantService.removeParticipant(
        conversationId,
        participantId,
        currentUserId
      );
      
      console.log('✅ [UnifiedParticipantContext] Participant removed successfully');
      
    } catch (error) {
      console.error('❌ [UnifiedParticipantContext] Failed to remove participant:', error);
      setError(`Failed to remove participant: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [conversationId, currentUserId]);

  // Check if current user can remove a specific participant
  const canRemoveParticipant = useCallback((participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return false;

    const hostUserId = participants.find(p => p.permissions.isHost)?.id;
    if (!hostUserId) return false;

    const permissionCheck = unifiedParticipantService.validateParticipantPermissions(
      currentUserId,
      participant,
      hostUserId,
      'remove'
    );

    return permissionCheck.allowed;
  }, [participants, currentUserId]);

  // Utility functions
  const getParticipantById = useCallback((id: string) => {
    return participants.find(p => p.id === id);
  }, [participants]);

  const getActiveParticipants = useCallback(() => {
    return participants.filter(p => p.status === 'active');
  }, [participants]);

  const getPendingParticipants = useCallback(() => {
    return participants.filter(p => p.status === 'pending');
  }, [participants]);

  const getHumanParticipants = useCallback(() => {
    return participants.filter(p => p.type === 'human');
  }, [participants]);

  const getAIAgentParticipants = useCallback(() => {
    return participants.filter(p => p.type === 'ai_agent');
  }, [participants]);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const contextValue: UnifiedParticipantContextType = {
    participants,
    loading,
    error,
    currentUserId,
    isHost,
    addAIAgent,
    removeParticipant,
    canAddAgents,
    canRemoveParticipant,
    getParticipantById,
    getActiveParticipants,
    getPendingParticipants,
    getHumanParticipants,
    getAIAgentParticipants,
    isConnected,
    lastUpdate
  };

  return (
    <UnifiedParticipantContext.Provider value={contextValue}>
      {children}
    </UnifiedParticipantContext.Provider>
  );
};

// Hook to use the unified participant context
export const useUnifiedParticipants = (): UnifiedParticipantContextType => {
  const context = useContext(UnifiedParticipantContext);
  if (context === undefined) {
    throw new Error('useUnifiedParticipants must be used within a UnifiedParticipantProvider');
  }
  return context;
};

// Hook with optional usage (returns null if not within provider)
export const useUnifiedParticipantsOptional = (): UnifiedParticipantContextType | null => {
  const context = useContext(UnifiedParticipantContext);
  return context || null;
};

export default UnifiedParticipantContext;

