import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  firebaseConnectionService, 
  Connection, 
  ConnectionRequest, 
  UserConnectionStats 
} from '../services/FirebaseConnectionService';

export interface UseConnectionsReturn {
  // Connection data
  connections: Connection[];
  pendingRequests: ConnectionRequest[];
  sentRequests: ConnectionRequest[];
  connectionStats: UserConnectionStats | null;
  
  // Loading states
  loading: boolean;
  sendingRequest: boolean;
  acceptingRequest: boolean;
  decliningRequest: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  sendConnectionRequest: (toUserId: string, message?: string) => Promise<boolean>;
  acceptConnectionRequest: (requestId: string) => Promise<boolean>;
  declineConnectionRequest: (requestId: string) => Promise<boolean>;
  removeConnection: (userId: string) => Promise<boolean>;
  getConnectionStatus: (userId: string) => Promise<'connected' | 'pending' | 'none' | 'blocked'>;
  getMutualConnections: (userId: string) => Promise<Connection[]>;
  
  // Utilities
  isConnectedTo: (userId: string) => boolean;
  hasPendingRequestFrom: (userId: string) => boolean;
  hasSentRequestTo: (userId: string) => boolean;
  refreshConnections: () => Promise<void>;
}

export const useConnections = (): UseConnectionsReturn => {
  const { currentUser: user } = useAuth();
  
  // State
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [connectionStats, setConnectionStats] = useState<UserConnectionStats | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState(false);
  const [decliningRequest, setDecliningRequest] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadConnectionData = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🤝 [useConnections] Loading connection data for user:', user.uid);
      
      const [userConnections, pending, sent] = await Promise.all([
        firebaseConnectionService.getUserConnections(user.uid),
        firebaseConnectionService.getPendingRequests(user.uid),
        firebaseConnectionService.getSentRequests(user.uid)
      ]);
      
      setConnections(userConnections);
      setPendingRequests(pending);
      setSentRequests(sent);
      
      // Calculate connection stats
      const stats: UserConnectionStats = {
        totalConnections: userConnections.length,
        pendingRequests: pending.length,
        sentRequests: sent.length,
        collaborationCount: userConnections.reduce((sum, conn) => sum + (conn.collaborationCount || 0), 0),
        averageResponseTime: 15, // Mock for now
        connectionRating: 4.5 // Mock for now
      };
      setConnectionStats(stats);
      
      console.log(`🤝 [useConnections] Loaded: ${userConnections.length} connections, ${pending.length} pending, ${sent.length} sent`);
      
    } catch (err) {
      console.error('🤝 [useConnections] Error loading data:', err);
      setError('Failed to load connection data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.uid) return;
    
    console.log('🤝 [useConnections] Setting up real-time subscriptions');
    
    // Subscribe to connection updates
    const unsubscribeConnections = firebaseConnectionService.subscribeToConnectionUpdates(
      user.uid,
      (updatedConnections) => {
        console.log('🤝 [useConnections] Real-time connections update:', updatedConnections.length);
        setConnections(updatedConnections);
        
        // Update stats
        setConnectionStats(prev => prev ? {
          ...prev,
          totalConnections: updatedConnections.length,
          collaborationCount: updatedConnections.reduce((sum, conn) => sum + (conn.collaborationCount || 0), 0)
        } : null);
      }
    );
    
    // Subscribe to connection request updates
    const unsubscribeRequests = firebaseConnectionService.subscribeToConnectionRequests(
      user.uid,
      (updatedRequests) => {
        console.log('🤝 [useConnections] Real-time requests update:', updatedRequests.length);
        setPendingRequests(updatedRequests);
        
        // Update stats
        setConnectionStats(prev => prev ? {
          ...prev,
          pendingRequests: updatedRequests.length
        } : null);
      }
    );
    
    return () => {
      console.log('🤝 [useConnections] Cleaning up subscriptions');
      unsubscribeConnections();
      unsubscribeRequests();
    };
  }, [user?.uid]);

  // Load initial data
  useEffect(() => {
    loadConnectionData();
  }, [loadConnectionData]);

  // Actions
  const sendConnectionRequest = useCallback(async (toUserId: string, message?: string): Promise<boolean> => {
    if (!user?.uid) {
      setError('User not authenticated');
      return false;
    }
    
    setSendingRequest(true);
    setError(null);
    
    try {
      console.log('🤝 [useConnections] Sending connection request to:', toUserId);
      
      const result = await firebaseConnectionService.sendConnectionRequest(user.uid, toUserId, message);
      
      if (result.success) {
        console.log('🤝 [useConnections] Connection request sent successfully');
        // Refresh sent requests
        const updated = await firebaseConnectionService.getSentRequests(user.uid);
        setSentRequests(updated);
        return true;
      } else {
        setError(result.error || 'Failed to send connection request');
        return false;
      }
      
    } catch (err) {
      console.error('🤝 [useConnections] Error sending request:', err);
      setError('Failed to send connection request');
      return false;
    } finally {
      setSendingRequest(false);
    }
  }, [user?.uid]);

  const acceptConnectionRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!user?.uid) {
      setError('User not authenticated');
      return false;
    }
    
    setAcceptingRequest(true);
    setError(null);
    
    try {
      console.log('🤝 [useConnections] Accepting connection request:', requestId);
      
      const result = await firebaseConnectionService.acceptConnectionRequest(requestId, user.uid);
      
      if (result.success) {
        console.log('🤝 [useConnections] Connection request accepted successfully');
        // Data will be updated via real-time subscriptions
        return true;
      } else {
        setError(result.error || 'Failed to accept connection request');
        return false;
      }
      
    } catch (err) {
      console.error('🤝 [useConnections] Error accepting request:', err);
      setError('Failed to accept connection request');
      return false;
    } finally {
      setAcceptingRequest(false);
    }
  }, [user?.uid]);

  const declineConnectionRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!user?.uid) {
      setError('User not authenticated');
      return false;
    }
    
    setDecliningRequest(true);
    setError(null);
    
    try {
      console.log('🤝 [useConnections] Declining connection request:', requestId);
      
      const result = await firebaseConnectionService.declineConnectionRequest(requestId, user.uid);
      
      if (result.success) {
        console.log('🤝 [useConnections] Connection request declined successfully');
        // Data will be updated via real-time subscriptions
        return true;
      } else {
        setError(result.error || 'Failed to decline connection request');
        return false;
      }
      
    } catch (err) {
      console.error('🤝 [useConnections] Error declining request:', err);
      setError('Failed to decline connection request');
      return false;
    } finally {
      setDecliningRequest(false);
    }
  }, [user?.uid]);

  const removeConnection = useCallback(async (userId: string): Promise<boolean> => {
    if (!user?.uid) {
      setError('User not authenticated');
      return false;
    }
    
    try {
      console.log('🤝 [useConnections] Removing connection with:', userId);
      
      const result = await firebaseConnectionService.removeConnection(user.uid, userId);
      
      if (result.success) {
        console.log('🤝 [useConnections] Connection removed successfully');
        // Data will be updated via real-time subscriptions
        return true;
      } else {
        setError(result.error || 'Failed to remove connection');
        return false;
      }
      
    } catch (err) {
      console.error('🤝 [useConnections] Error removing connection:', err);
      setError('Failed to remove connection');
      return false;
    }
  }, [user?.uid]);

  const getConnectionStatus = useCallback(async (userId: string): Promise<'connected' | 'pending' | 'none' | 'blocked'> => {
    if (!user?.uid) return 'none';
    
    try {
      return await firebaseConnectionService.getConnectionStatus(user.uid, userId);
    } catch (err) {
      console.error('🤝 [useConnections] Error getting connection status:', err);
      return 'none';
    }
  }, [user?.uid]);

  const getMutualConnections = useCallback(async (userId: string): Promise<Connection[]> => {
    if (!user?.uid) return [];
    
    try {
      return await firebaseConnectionService.getMutualConnections(user.uid, userId);
    } catch (err) {
      console.error('🤝 [useConnections] Error getting mutual connections:', err);
      return [];
    }
  }, [user?.uid]);

  // Utility functions
  const isConnectedTo = useCallback((userId: string): boolean => {
    return connections.some(conn => 
      (conn.userId1 === userId && conn.userId2 === user?.uid) ||
      (conn.userId2 === userId && conn.userId1 === user?.uid)
    );
  }, [connections, user?.uid]);

  const hasPendingRequestFrom = useCallback((userId: string): boolean => {
    return pendingRequests.some(req => req.fromUserId === userId);
  }, [pendingRequests]);

  const hasSentRequestTo = useCallback((userId: string): boolean => {
    return sentRequests.some(req => req.toUserId === userId);
  }, [sentRequests]);

  const refreshConnections = useCallback(async (): Promise<void> => {
    await loadConnectionData();
  }, [loadConnectionData]);

  return {
    // Data
    connections,
    pendingRequests,
    sentRequests,
    connectionStats,
    
    // Loading states
    loading,
    sendingRequest,
    acceptingRequest,
    decliningRequest,
    
    // Error state
    error,
    
    // Actions
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    removeConnection,
    getConnectionStatus,
    getMutualConnections,
    
    // Utilities
    isConnectedTo,
    hasPendingRequestFrom,
    hasSentRequestTo,
    refreshConnections
  };
};

