import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserName: string;
  toUserPhoto?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: {
    fromUserTitle?: string;
    fromUserCompany?: string;
    mutualConnections?: number;
    commonSkills?: string[];
  };
}

export interface Connection {
  id: string;
  userId1: string;
  userId2: string;
  user1Name: string;
  user1Photo?: string;
  user2Name: string;
  user2Photo?: string;
  connectedAt: Timestamp;
  connectionStrength?: number; // Based on interactions
  lastInteraction?: Timestamp;
  collaborationCount?: number;
  messageCount?: number;
  tags?: string[]; // e.g., 'colleague', 'ai-collaborator', 'mentor'
}

export interface ConnectionNotification {
  id: string;
  userId: string;
  type: 'connection_request' | 'connection_accepted' | 'connection_declined';
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  actionUrl?: string;
}

export interface UserConnectionStats {
  totalConnections: number;
  pendingRequests: number;
  sentRequests: number;
  collaborationCount: number;
  averageResponseTime: number;
  connectionRating: number;
}

class FirebaseConnectionService {
  private readonly CONNECTIONS_COLLECTION = 'connections';
  private readonly CONNECTION_REQUESTS_COLLECTION = 'connectionRequests';
  private readonly NOTIFICATIONS_COLLECTION = 'notifications';
  private readonly USERS_COLLECTION = 'users';

  /**
   * Send a connection request to another user
   */
  async sendConnectionRequest(
    fromUserId: string, 
    toUserId: string, 
    message?: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      console.log(`🤝 [Connection] Sending request from ${fromUserId} to ${toUserId}`);

      // Check if users are already connected
      const existingConnection = await this.getConnectionBetweenUsers(fromUserId, toUserId);
      if (existingConnection) {
        return { success: false, error: 'Users are already connected' };
      }

      // Check if there's already a pending request
      const existingRequest = await this.getPendingRequest(fromUserId, toUserId);
      if (existingRequest) {
        return { success: false, error: 'Connection request already sent' };
      }

      // Get user information
      const [fromUser, toUser] = await Promise.all([
        this.getUserInfo(fromUserId),
        this.getUserInfo(toUserId)
      ]);

      if (!fromUser || !toUser) {
        return { success: false, error: 'User information not found' };
      }

      // Create connection request
      const requestId = `${fromUserId}_${toUserId}_${Date.now()}`;
      const connectionRequest: Omit<ConnectionRequest, 'id'> = {
        fromUserId,
        toUserId,
        fromUserName: fromUser.displayName || fromUser.email,
        fromUserPhoto: fromUser.photoURL,
        toUserName: toUser.displayName || toUser.email,
        toUserPhoto: toUser.photoURL,
        message: message || `Hi! I'd like to connect and explore AI collaboration opportunities.`,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        metadata: {
          fromUserTitle: fromUser.profile?.title,
          fromUserCompany: fromUser.profile?.company,
          mutualConnections: await this.getMutualConnectionsCount(fromUserId, toUserId),
          commonSkills: this.getCommonSkills(fromUser.profile?.skills || [], toUser.profile?.skills || [])
        }
      };

      // Save connection request
      await setDoc(doc(db, this.CONNECTION_REQUESTS_COLLECTION, requestId), connectionRequest);

      // Create notification for recipient
      await this.createNotification({
        userId: toUserId,
        type: 'connection_request',
        fromUserId,
        fromUserName: fromUser.displayName || fromUser.email,
        fromUserPhoto: fromUser.photoURL,
        message: `${fromUser.displayName || fromUser.email} wants to connect with you`,
        actionUrl: `/profile/${fromUserId}`
      });

      // Update user stats
      await this.updateUserConnectionStats(fromUserId, { sentRequests: increment(1) });
      await this.updateUserConnectionStats(toUserId, { pendingRequests: increment(1) });

      console.log(`🤝 [Connection] Request sent successfully: ${requestId}`);
      return { success: true, requestId };

    } catch (error) {
      console.error('🤝 [Connection] Error sending request:', error);
      return { success: false, error: 'Failed to send connection request' };
    }
  }

  /**
   * Accept a connection request
   */
  async acceptConnectionRequest(requestId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🤝 [Connection] Accepting request: ${requestId}`);

      const requestDoc = await getDoc(doc(db, this.CONNECTION_REQUESTS_COLLECTION, requestId));
      if (!requestDoc.exists()) {
        return { success: false, error: 'Connection request not found' };
      }

      const request = { id: requestDoc.id, ...requestDoc.data() } as ConnectionRequest;
      
      // Verify user is the recipient
      if (request.toUserId !== userId) {
        return { success: false, error: 'Unauthorized to accept this request' };
      }

      if (request.status !== 'pending') {
        return { success: false, error: 'Request is no longer pending' };
      }

      const batch = writeBatch(db);

      // Create connection
      const connectionId = `${request.fromUserId}_${request.toUserId}`;
      const connection: Omit<Connection, 'id'> = {
        userId1: request.fromUserId,
        userId2: request.toUserId,
        user1Name: request.fromUserName,
        user1Photo: request.fromUserPhoto,
        user2Name: request.toUserName,
        user2Photo: request.toUserPhoto,
        connectedAt: serverTimestamp() as Timestamp,
        connectionStrength: 1,
        collaborationCount: 0,
        messageCount: 0,
        tags: ['ai-collaborator']
      };

      batch.set(doc(db, this.CONNECTIONS_COLLECTION, connectionId), connection);

      // Update request status
      batch.update(doc(db, this.CONNECTION_REQUESTS_COLLECTION, requestId), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      // Update user stats
      const userStatsUpdate = {
        totalConnections: increment(1),
        pendingRequests: increment(-1)
      };
      
      batch.update(doc(db, this.USERS_COLLECTION, request.fromUserId), {
        'stats.connections': increment(1),
        'stats.sentRequests': increment(-1)
      });
      
      batch.update(doc(db, this.USERS_COLLECTION, request.toUserId), {
        'stats.connections': increment(1),
        'stats.pendingRequests': increment(-1)
      });

      await batch.commit();

      // Create notifications
      await Promise.all([
        this.createNotification({
          userId: request.fromUserId,
          type: 'connection_accepted',
          fromUserId: request.toUserId,
          fromUserName: request.toUserName,
          fromUserPhoto: request.toUserPhoto,
          message: `${request.toUserName} accepted your connection request`,
          actionUrl: `/profile/${request.toUserId}`
        }),
        this.createNotification({
          userId: request.toUserId,
          type: 'connection_accepted',
          fromUserId: request.fromUserId,
          fromUserName: request.fromUserName,
          fromUserPhoto: request.fromUserPhoto,
          message: `You are now connected with ${request.fromUserName}`,
          actionUrl: `/profile/${request.fromUserId}`
        })
      ]);

      console.log(`🤝 [Connection] Request accepted: ${requestId}`);
      return { success: true };

    } catch (error) {
      console.error('🤝 [Connection] Error accepting request:', error);
      return { success: false, error: 'Failed to accept connection request' };
    }
  }

  /**
   * Decline a connection request
   */
  async declineConnectionRequest(requestId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🤝 [Connection] Declining request: ${requestId}`);

      const requestDoc = await getDoc(doc(db, this.CONNECTION_REQUESTS_COLLECTION, requestId));
      if (!requestDoc.exists()) {
        return { success: false, error: 'Connection request not found' };
      }

      const request = { id: requestDoc.id, ...requestDoc.data() } as ConnectionRequest;
      
      if (request.toUserId !== userId) {
        return { success: false, error: 'Unauthorized to decline this request' };
      }

      // Update request status
      await updateDoc(doc(db, this.CONNECTION_REQUESTS_COLLECTION, requestId), {
        status: 'declined',
        updatedAt: serverTimestamp()
      });

      // Update user stats
      await this.updateUserConnectionStats(request.toUserId, { pendingRequests: increment(-1) });

      console.log(`🤝 [Connection] Request declined: ${requestId}`);
      return { success: true };

    } catch (error) {
      console.error('🤝 [Connection] Error declining request:', error);
      return { success: false, error: 'Failed to decline connection request' };
    }
  }

  /**
   * Get all connections for a user
   */
  async getUserConnections(userId: string): Promise<Connection[]> {
    try {
      const [connections1, connections2] = await Promise.all([
        getDocs(query(
          collection(db, this.CONNECTIONS_COLLECTION),
          where('userId1', '==', userId),
          orderBy('connectedAt', 'desc')
        )),
        getDocs(query(
          collection(db, this.CONNECTIONS_COLLECTION),
          where('userId2', '==', userId),
          orderBy('connectedAt', 'desc')
        ))
      ]);

      const connections: Connection[] = [];
      
      connections1.forEach(doc => {
        connections.push({ id: doc.id, ...doc.data() } as Connection);
      });
      
      connections2.forEach(doc => {
        connections.push({ id: doc.id, ...doc.data() } as Connection);
      });

      return connections.sort((a, b) => b.connectedAt.toMillis() - a.connectedAt.toMillis());

    } catch (error) {
      console.error('🤝 [Connection] Error getting connections:', error);
      return [];
    }
  }

  /**
   * Get pending connection requests for a user
   */
  async getPendingRequests(userId: string): Promise<ConnectionRequest[]> {
    try {
      const requestsSnapshot = await getDocs(query(
        collection(db, this.CONNECTION_REQUESTS_COLLECTION),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      ));

      return requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ConnectionRequest[];

    } catch (error) {
      console.error('🤝 [Connection] Error getting pending requests:', error);
      return [];
    }
  }

  /**
   * Get sent connection requests for a user
   */
  async getSentRequests(userId: string): Promise<ConnectionRequest[]> {
    try {
      const requestsSnapshot = await getDocs(query(
        collection(db, this.CONNECTION_REQUESTS_COLLECTION),
        where('fromUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      ));

      return requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ConnectionRequest[];

    } catch (error) {
      console.error('🤝 [Connection] Error getting sent requests:', error);
      return [];
    }
  }

  /**
   * Check connection status between two users
   */
  async getConnectionStatus(userId1: string, userId2: string): Promise<'connected' | 'pending' | 'none' | 'blocked'> {
    try {
      // Check if connected
      const connection = await this.getConnectionBetweenUsers(userId1, userId2);
      if (connection) {
        return 'connected';
      }

      // Check for pending requests
      const pendingRequest = await this.getPendingRequest(userId1, userId2);
      if (pendingRequest) {
        return 'pending';
      }

      return 'none';

    } catch (error) {
      console.error('🤝 [Connection] Error checking status:', error);
      return 'none';
    }
  }

  /**
   * Remove/disconnect from a user
   */
  async removeConnection(userId1: string, userId2: string): Promise<{ success: boolean; error?: string }> {
    try {
      const connection = await this.getConnectionBetweenUsers(userId1, userId2);
      if (!connection) {
        return { success: false, error: 'Connection not found' };
      }

      const batch = writeBatch(db);

      // Remove connection
      batch.delete(doc(db, this.CONNECTIONS_COLLECTION, connection.id));

      // Update user stats
      batch.update(doc(db, this.USERS_COLLECTION, userId1), {
        'stats.connections': increment(-1)
      });
      
      batch.update(doc(db, this.USERS_COLLECTION, userId2), {
        'stats.connections': increment(-1)
      });

      await batch.commit();

      console.log(`🤝 [Connection] Connection removed: ${connection.id}`);
      return { success: true };

    } catch (error) {
      console.error('🤝 [Connection] Error removing connection:', error);
      return { success: false, error: 'Failed to remove connection' };
    }
  }

  /**
   * Get mutual connections between two users
   */
  async getMutualConnections(userId1: string, userId2: string): Promise<Connection[]> {
    try {
      const [user1Connections, user2Connections] = await Promise.all([
        this.getUserConnections(userId1),
        this.getUserConnections(userId2)
      ]);

      const user1ConnectedIds = new Set(
        user1Connections.map(conn => 
          conn.userId1 === userId1 ? conn.userId2 : conn.userId1
        )
      );

      const mutualConnections = user2Connections.filter(conn => {
        const connectedUserId = conn.userId1 === userId2 ? conn.userId2 : conn.userId1;
        return user1ConnectedIds.has(connectedUserId);
      });

      return mutualConnections;

    } catch (error) {
      console.error('🤝 [Connection] Error getting mutual connections:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time connection updates
   */
  subscribeToConnectionUpdates(userId: string, callback: (connections: Connection[]) => void): () => void {
    const unsubscribe1 = onSnapshot(
      query(
        collection(db, this.CONNECTIONS_COLLECTION),
        where('userId1', '==', userId)
      ),
      () => {
        this.getUserConnections(userId).then(callback);
      }
    );

    const unsubscribe2 = onSnapshot(
      query(
        collection(db, this.CONNECTIONS_COLLECTION),
        where('userId2', '==', userId)
      ),
      () => {
        this.getUserConnections(userId).then(callback);
      }
    );

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }

  /**
   * Subscribe to real-time connection request updates
   */
  subscribeToConnectionRequests(userId: string, callback: (requests: ConnectionRequest[]) => void): () => void {
    return onSnapshot(
      query(
        collection(db, this.CONNECTION_REQUESTS_COLLECTION),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      ),
      (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ConnectionRequest[];
        callback(requests);
      }
    );
  }

  // Private helper methods

  private async getConnectionBetweenUsers(userId1: string, userId2: string): Promise<Connection | null> {
    try {
      const [query1, query2] = await Promise.all([
        getDocs(query(
          collection(db, this.CONNECTIONS_COLLECTION),
          where('userId1', '==', userId1),
          where('userId2', '==', userId2)
        )),
        getDocs(query(
          collection(db, this.CONNECTIONS_COLLECTION),
          where('userId1', '==', userId2),
          where('userId2', '==', userId1)
        ))
      ]);

      if (!query1.empty) {
        return { id: query1.docs[0].id, ...query1.docs[0].data() } as Connection;
      }
      
      if (!query2.empty) {
        return { id: query2.docs[0].id, ...query2.docs[0].data() } as Connection;
      }

      return null;
    } catch (error) {
      console.error('Error getting connection between users:', error);
      return null;
    }
  }

  private async getPendingRequest(fromUserId: string, toUserId: string): Promise<ConnectionRequest | null> {
    try {
      const requestsSnapshot = await getDocs(query(
        collection(db, this.CONNECTION_REQUESTS_COLLECTION),
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId),
        where('status', '==', 'pending')
      ));

      if (!requestsSnapshot.empty) {
        return { id: requestsSnapshot.docs[0].id, ...requestsSnapshot.docs[0].data() } as ConnectionRequest;
      }

      return null;
    } catch (error) {
      console.error('Error getting pending request:', error);
      return null;
    }
  }

  private async getUserInfo(userId: string): Promise<any> {
    try {
      const userDoc = await getDoc(doc(db, this.USERS_COLLECTION, userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  private async getMutualConnectionsCount(userId1: string, userId2: string): Promise<number> {
    try {
      const mutualConnections = await this.getMutualConnections(userId1, userId2);
      return mutualConnections.length;
    } catch (error) {
      console.error('Error getting mutual connections count:', error);
      return 0;
    }
  }

  private getCommonSkills(skills1: string[], skills2: string[]): string[] {
    return skills1.filter(skill => 
      skills2.some(skill2 => 
        skill.toLowerCase() === skill2.toLowerCase()
      )
    );
  }

  private async createNotification(notification: Omit<ConnectionNotification, 'id' | 'read' | 'createdAt'>): Promise<void> {
    try {
      const notificationId = `${notification.userId}_${Date.now()}`;
      await setDoc(doc(db, this.NOTIFICATIONS_COLLECTION, notificationId), {
        ...notification,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  private async updateUserConnectionStats(userId: string, updates: any): Promise<void> {
    try {
      await updateDoc(doc(db, this.USERS_COLLECTION, userId), {
        ...Object.keys(updates).reduce((acc, key) => {
          acc[`stats.${key}`] = updates[key];
          return acc;
        }, {} as any),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }
}

export const firebaseConnectionService = new FirebaseConnectionService();
export default firebaseConnectionService;

