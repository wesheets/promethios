/**
 * User Interactions Hook
 * 
 * React hook for managing all types of user interactions through the unified registry
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  userInteractionRegistry,
  UserInteraction,
  InteractionType,
  InteractionMetadata,
  UserInteractionStats,
  UserRelationship,
  RelationshipType,
  RelationshipMetadata
} from '../services/UserInteractionRegistry';

export interface UseUserInteractionsReturn {
  // Data
  pendingInteractions: UserInteraction[];
  sentInteractions: UserInteraction[];
  interactionStats: UserInteractionStats | null;
  
  // Relationship data
  relationships: UserRelationship[];
  mutualConnections: UserRelationship[];
  
  // Category-based notifications
  socialNotifications: UserInteraction[];
  professionalNotifications: UserInteraction[];
  marketplaceNotifications: UserInteraction[];
  collaborationNotifications: UserInteraction[];
  chatNotifications: UserInteraction[];
  
  // Loading states
  loading: boolean;
  sendingInteraction: boolean;
  respondingToInteraction: boolean;
  relationshipsLoading: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  sendInteraction: (
    type: InteractionType,
    toUserId: string,
    metadata: InteractionMetadata
  ) => Promise<boolean>;
  acceptInteraction: (interactionId: string) => Promise<boolean>;
  declineInteraction: (interactionId: string) => Promise<boolean>;
  
  // Relationship actions
  createRelationship: (
    toUserId: string,
    relationshipType: RelationshipType,
    metadata?: Partial<RelationshipMetadata>
  ) => Promise<boolean>;
  getRelationshipWith: (userId: string) => UserRelationship | null;
  updateRelationshipStrength: (userId: string, strengthDelta: number) => Promise<void>;
  
  // Utilities
  getPendingByType: (type: InteractionType) => UserInteraction[];
  getSentByType: (type: InteractionType) => UserInteraction[];
  getPendingByCategory: (category: 'social' | 'professional' | 'marketplace' | 'collaboration' | 'chat') => UserInteraction[];
  hasPendingInteractionFrom: (userId: string, type?: InteractionType) => boolean;
  hasSentInteractionTo: (userId: string, type?: InteractionType) => boolean;
  hasRelationshipWith: (userId: string, relationshipType?: RelationshipType) => boolean;
  getConnectionStrength: (userId: string) => number;
  refreshInteractions: () => Promise<void>;
  refreshRelationships: () => Promise<void>;
}

export const useUserInteractions = (): UseUserInteractionsReturn => {
  const { currentUser } = useAuth();
  
  // State
  const [pendingInteractions, setPendingInteractions] = useState<UserInteraction[]>([]);
  const [sentInteractions, setSentInteractions] = useState<UserInteraction[]>([]);
  const [interactionStats, setInteractionStats] = useState<UserInteractionStats | null>(null);
  
  // Relationship state
  const [relationships, setRelationships] = useState<UserRelationship[]>([]);
  const [mutualConnections, setMutualConnections] = useState<UserRelationship[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [sendingInteraction, setSendingInteraction] = useState(false);
  const [respondingToInteraction, setRespondingToInteraction] = useState(false);
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Category-based notification getters (computed from pendingInteractions)
  const socialNotifications = pendingInteractions.filter(interaction => 
    ['friend_request', 'follow_request', 'post_like', 'post_comment', 'post_share', 'group_invitation', 'event_invitation'].includes(interaction.type)
  );

  const professionalNotifications = pendingInteractions.filter(interaction => 
    ['professional_connection', 'skill_endorsement', 'recommendation_request', 'job_referral', 'business_proposal', 'mentorship_request'].includes(interaction.type)
  );

  const marketplaceNotifications = pendingInteractions.filter(interaction => 
    ['buy_request', 'sell_offer', 'price_negotiation', 'transaction_request', 'review_request', 'item_inquiry'].includes(interaction.type)
  );

  const collaborationNotifications = pendingInteractions.filter(interaction => 
    ['collaboration_invitation', 'collaboration_request', 'connection_request', 'team_invitation', 'project_invitation'].includes(interaction.type)
  );

  const chatNotifications = pendingInteractions.filter(interaction => 
    ['chat_invitation', 'meeting_request'].includes(interaction.type)
  );

  // Load initial data
  const loadInteractionData = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔗 [useUserInteractions] Loading interaction data for user:', currentUser.uid);
      
      const [pending, sent] = await Promise.all([
        userInteractionRegistry.getPendingInteractions(currentUser.uid),
        userInteractionRegistry.getSentInteractions(currentUser.uid)
      ]);
      
      setPendingInteractions(pending);
      setSentInteractions(sent);
      
      // Calculate interaction stats
      const stats: UserInteractionStats = {
        totalInteractions: pending.length + sent.length,
        pendingRequests: pending.length,
        sentRequests: sent.length,
        acceptedInteractions: sent.filter(i => i.status === 'accepted').length,
        declinedInteractions: sent.filter(i => i.status === 'declined').length,
        responseRate: sent.length > 0 ? 
          (sent.filter(i => i.status !== 'pending').length / sent.length) * 100 : 0,
        averageResponseTime: 15 // Mock for now, would calculate from timestamps
      };
      setInteractionStats(stats);
      
      console.log(`🔗 [useUserInteractions] Loaded: ${pending.length} pending, ${sent.length} sent`);
      
    } catch (err) {
      console.error('🔗 [useUserInteractions] Error loading data:', err);
      setError('Failed to load interaction data');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  // Load relationship data
  const loadRelationshipData = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    setRelationshipsLoading(true);
    
    try {
      console.log('🔗 [useUserInteractions] Loading relationship data for user:', currentUser.uid);
      
      const userRelationships = await userInteractionRegistry.getRelationships(currentUser.uid);
      setRelationships(userRelationships);
      
      console.log(`🔗 [useUserInteractions] Loaded ${userRelationships.length} relationships`);
      
    } catch (err) {
      console.error('🔗 [useUserInteractions] Error loading relationships:', err);
    } finally {
      setRelationshipsLoading(false);
    }
  }, [currentUser?.uid]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentUser?.uid) return;

    console.log('🔗 [useUserInteractions] Setting up real-time subscriptions');

    // Subscribe to pending interactions
    const unsubscribePending = userInteractionRegistry.subscribeToInteractions(
      currentUser.uid,
      (interactions) => {
        console.log(`🔗 [useUserInteractions] Received ${interactions.length} pending interactions`);
        setPendingInteractions(interactions);
      }
    );

    // Subscribe to relationships
    const unsubscribeRelationships = userInteractionRegistry.subscribeToRelationships(
      currentUser.uid,
      (relationships) => {
        console.log(`🔗 [useUserInteractions] Received ${relationships.length} relationships`);
        setRelationships(relationships);
      }
    );

    // Load initial data
    loadInteractionData();
    loadRelationshipData();

    return () => {
      console.log('🔗 [useUserInteractions] Cleaning up subscriptions');
      unsubscribePending();
      unsubscribeRelationships();
    };
  }, [currentUser?.uid, loadInteractionData, loadRelationshipData]);

  // Actions
  const sendInteraction = useCallback(async (
    type: InteractionType,
    toUserId: string,
    metadata: InteractionMetadata
  ): Promise<boolean> => {
    if (!currentUser?.uid) return false;

    setSendingInteraction(true);
    setError(null);

    try {
      console.log(`🔗 [useUserInteractions] Sending ${type} to ${toUserId}`);
      
      const result = await userInteractionRegistry.sendInteraction(
        type,
        currentUser.uid,
        toUserId,
        metadata
      );

      if (result.success) {
        console.log(`✅ [useUserInteractions] ${type} sent successfully`);
        // Refresh sent interactions
        const sent = await userInteractionRegistry.getSentInteractions(currentUser.uid);
        setSentInteractions(sent);
        return true;
      } else {
        setError(result.error || `Failed to send ${type}`);
        return false;
      }

    } catch (err) {
      console.error(`❌ [useUserInteractions] Error sending ${type}:`, err);
      setError(`Failed to send ${type}`);
      return false;
    } finally {
      setSendingInteraction(false);
    }
  }, [currentUser?.uid]);

  const acceptInteraction = useCallback(async (interactionId: string): Promise<boolean> => {
    if (!currentUser?.uid) return false;

    setRespondingToInteraction(true);
    setError(null);

    try {
      console.log(`🔗 [useUserInteractions] Accepting interaction: ${interactionId}`);
      
      const result = await userInteractionRegistry.respondToInteraction(
        interactionId,
        currentUser.uid,
        'accepted'
      );

      if (result.success) {
        console.log(`✅ [useUserInteractions] Interaction accepted: ${interactionId}`);
        return true;
      } else {
        setError(result.error || 'Failed to accept interaction');
        return false;
      }

    } catch (err) {
      console.error(`❌ [useUserInteractions] Error accepting interaction:`, err);
      setError('Failed to accept interaction');
      return false;
    } finally {
      setRespondingToInteraction(false);
    }
  }, [currentUser?.uid]);

  const declineInteraction = useCallback(async (interactionId: string): Promise<boolean> => {
    if (!currentUser?.uid) return false;

    setRespondingToInteraction(true);
    setError(null);

    try {
      console.log(`🔗 [useUserInteractions] Declining interaction: ${interactionId}`);
      
      const result = await userInteractionRegistry.respondToInteraction(
        interactionId,
        currentUser.uid,
        'declined'
      );

      if (result.success) {
        console.log(`✅ [useUserInteractions] Interaction declined: ${interactionId}`);
        return true;
      } else {
        setError(result.error || 'Failed to decline interaction');
        return false;
      }

    } catch (err) {
      console.error(`❌ [useUserInteractions] Error declining interaction:`, err);
      setError('Failed to decline interaction');
      return false;
    } finally {
      setRespondingToInteraction(false);
    }
  }, [currentUser?.uid]);

  // Utilities
  const getPendingByType = useCallback((type: InteractionType): UserInteraction[] => {
    return pendingInteractions.filter(interaction => interaction.type === type);
  }, [pendingInteractions]);

  const getSentByType = useCallback((type: InteractionType): UserInteraction[] => {
    return sentInteractions.filter(interaction => interaction.type === type);
  }, [sentInteractions]);

  const hasPendingInteractionFrom = useCallback((userId: string, type?: InteractionType): boolean => {
    return pendingInteractions.some(interaction => 
      interaction.fromUserId === userId && 
      (!type || interaction.type === type)
    );
  }, [pendingInteractions]);

  const hasSentInteractionTo = useCallback((userId: string, type?: InteractionType): boolean => {
    return sentInteractions.some(interaction => 
      interaction.toUserId === userId && 
      interaction.status === 'pending' &&
      (!type || interaction.type === type)
    );
  }, [sentInteractions]);

  const refreshInteractions = useCallback(async (): Promise<void> => {
    await loadInteractionData();
  }, [loadInteractionData]);

  // Relationship actions
  const createRelationship = useCallback(async (
    toUserId: string,
    relationshipType: RelationshipType,
    metadata: Partial<RelationshipMetadata> = {}
  ): Promise<boolean> => {
    if (!currentUser?.uid) return false;

    try {
      console.log(`🔗 [useUserInteractions] Creating ${relationshipType} relationship with ${toUserId}`);
      
      const result = await userInteractionRegistry.createRelationship(
        currentUser.uid,
        toUserId,
        relationshipType,
        metadata
      );

      if (result.success) {
        console.log(`✅ [useUserInteractions] Relationship created: ${result.relationshipId}`);
        await loadRelationshipData(); // Refresh relationships
        return true;
      } else {
        setError(result.error || 'Failed to create relationship');
        return false;
      }

    } catch (err) {
      console.error(`❌ [useUserInteractions] Error creating relationship:`, err);
      setError('Failed to create relationship');
      return false;
    }
  }, [currentUser?.uid, loadRelationshipData]);

  const getRelationshipWith = useCallback((userId: string): UserRelationship | null => {
    return relationships.find(rel => 
      (rel.userId1 === userId && rel.userId2 === currentUser?.uid) ||
      (rel.userId2 === userId && rel.userId1 === currentUser?.uid)
    ) || null;
  }, [relationships, currentUser?.uid]);

  const updateRelationshipStrength = useCallback(async (userId: string, strengthDelta: number): Promise<void> => {
    if (!currentUser?.uid) return;

    try {
      await userInteractionRegistry.updateRelationshipStrength(
        currentUser.uid,
        userId,
        strengthDelta
      );
    } catch (err) {
      console.error(`❌ [useUserInteractions] Error updating relationship strength:`, err);
    }
  }, [currentUser?.uid]);

  // Enhanced utilities
  const getPendingByCategory = useCallback((category: 'social' | 'professional' | 'marketplace' | 'collaboration' | 'chat'): UserInteraction[] => {
    switch (category) {
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
      default:
        return [];
    }
  }, [socialNotifications, professionalNotifications, marketplaceNotifications, collaborationNotifications, chatNotifications]);

  const hasRelationshipWith = useCallback((userId: string, relationshipType?: RelationshipType): boolean => {
    const relationship = getRelationshipWith(userId);
    if (!relationship) return false;
    
    if (relationshipType) {
      return relationship.relationshipType.includes(relationshipType);
    }
    
    return true;
  }, [getRelationshipWith]);

  const getConnectionStrength = useCallback((userId: string): number => {
    const relationship = getRelationshipWith(userId);
    return relationship?.connectionStrength || 0;
  }, [getRelationshipWith]);

  const refreshRelationships = useCallback(async (): Promise<void> => {
    await loadRelationshipData();
  }, [loadRelationshipData]);

  return {
    // Data
    pendingInteractions,
    sentInteractions,
    interactionStats,
    
    // Relationship data
    relationships,
    mutualConnections,
    
    // Category-based notifications
    socialNotifications,
    professionalNotifications,
    marketplaceNotifications,
    collaborationNotifications,
    chatNotifications,
    
    // Loading states
    loading,
    sendingInteraction,
    respondingToInteraction,
    relationshipsLoading,
    
    // Error states
    error,
    
    // Actions
    sendInteraction,
    acceptInteraction,
    declineInteraction,
    
    // Relationship actions
    createRelationship,
    getRelationshipWith,
    updateRelationshipStrength,
    
    // Utilities
    getPendingByType,
    getSentByType,
    getPendingByCategory,
    hasPendingInteractionFrom,
    hasSentInteractionTo,
    hasRelationshipWith,
    getConnectionStrength,
    refreshInteractions,
    refreshRelationships
  };
};

