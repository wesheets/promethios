import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { notificationService } from './NotificationService';

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  fromUserAvatar?: string;
  toUserAvatar?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Connection {
  id: string;
  userId1: string;
  userId2: string;
  user1Name: string;
  user2Name: string;
  user1Avatar?: string;
  user2Avatar?: string;
  connectedAt: Date;
}

export class ConnectionService {
  private static instance: ConnectionService;

  private constructor() {
    // Use the singleton instance instead of creating a new one
  }

  static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  /**
   * Send a connection request
   */
  async sendConnectionRequest(
    fromUserId: string, 
    toUserId: string, 
    fromUserName: string, 
    toUserName: string,
    fromUserAvatar?: string,
    toUserAvatar?: string,
    message?: string
  ): Promise<string> {
    try {
      console.log(`🤝 [Connection] Sending request from ${fromUserName} to ${toUserName}`);

      // Check if request already exists
      const existingRequest = await this.getConnectionRequest(fromUserId, toUserId);
      if (existingRequest) {
        throw new Error('Connection request already exists');
      }

      // Check if already connected
      const isConnected = await this.areUsersConnected(fromUserId, toUserId);
      if (isConnected) {
        throw new Error('Users are already connected');
      }

      // Create connection request
      const requestData = {
        fromUserId,
        toUserId,
        fromUserName,
        toUserName,
        fromUserAvatar: fromUserAvatar || null,
        toUserAvatar: toUserAvatar || null,
        message: message || null,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'connectionRequests'), requestData);
      console.log(`✅ [Connection] Request sent with ID: ${docRef.id}`);

      // Send notification to recipient
      await this.sendConnectionNotification(docRef.id, requestData);

      return docRef.id;
    } catch (error) {
      console.error('❌ [Connection] Error sending request:', error);
      throw error;
    }
  }

  /**
   * Accept a connection request
   */
  async acceptConnectionRequest(requestId: string): Promise<void> {
    try {
      console.log(`✅ [Connection] Accepting request: ${requestId}`);

      // Get the request
      const requestDoc = await getDoc(doc(db, 'connectionRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Connection request not found');
      }

      const request = { id: requestDoc.id, ...requestDoc.data() } as ConnectionRequest;

      // Update request status
      await updateDoc(doc(db, 'connectionRequests', requestId), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      // Create connection
      await this.createConnection(request);

      // Send acceptance notification
      await this.sendAcceptanceNotification(request);

      console.log(`✅ [Connection] Request accepted and connection created`);
    } catch (error) {
      console.error('❌ [Connection] Error accepting request:', error);
      throw error;
    }
  }

  /**
   * Reject a connection request
   */
  async rejectConnectionRequest(requestId: string): Promise<void> {
    try {
      console.log(`❌ [Connection] Rejecting request: ${requestId}`);

      // Get the request
      const requestDoc = await getDoc(doc(db, 'connectionRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Connection request not found');
      }

      const request = { id: requestDoc.id, ...requestDoc.data() } as ConnectionRequest;

      // Update request status
      await updateDoc(doc(db, 'connectionRequests', requestId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });

      // Send rejection notification
      await this.sendRejectionNotification(request);

      console.log(`❌ [Connection] Request rejected`);
    } catch (error) {
      console.error('❌ [Connection] Error rejecting request:', error);
      throw error;
    }
  }

  /**
   * Get connection requests for a user
   */
  async getConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
    try {
      // Validate userId to prevent Firebase errors
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.warn('❌ [Connection] Invalid userId provided to getConnectionRequests:', userId);
        return [];
      }

      const q = query(
        collection(db, 'connectionRequests'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ConnectionRequest[];
    } catch (error) {
      console.error('❌ [Connection] Error fetching requests:', error);
      return [];
    }
  }

  /**
   * Get connections for a user
   */
  async getUserConnections(userId: string): Promise<Connection[]> {
    try {
      // Validate userId to prevent Firebase errors
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.warn('❌ [Connection] Invalid userId provided to getUserConnections:', userId);
        return [];
      }

      console.log(`🔍 [Connection] Getting connections for user: ${userId}`);

      const q1 = query(
        collection(db, 'connections'),
        where('userId1', '==', userId)
      );

      const q2 = query(
        collection(db, 'connections'),
        where('userId2', '==', userId)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      console.log(`🔍 [Connection] getUserConnections query results:`, {
        userId: userId,
        query1Results: snapshot1.size,
        query2Results: snapshot2.size,
        totalConnections: snapshot1.size + snapshot2.size
      });

      const connections: Connection[] = [];
      
      snapshot1.docs.forEach(doc => {
        const data = doc.data();
        console.log(`🔍 [Connection] Found connection (as userId1):`, data);
        connections.push({
          id: doc.id,
          ...data,
          connectedAt: data.connectedAt?.toDate() || new Date()
        } as Connection);
      });

      snapshot2.docs.forEach(doc => {
        const data = doc.data();
        console.log(`🔍 [Connection] Found connection (as userId2):`, data);
        connections.push({
          id: doc.id,
          ...data,
          connectedAt: data.connectedAt?.toDate() || new Date()
        } as Connection);
      });

      console.log(`✅ [Connection] Returning ${connections.length} connections for user ${userId}`);
      return connections;
    } catch (error) {
      console.error('❌ [Connection] Error fetching connections:', error);
      return [];
    }
  }

  /**
   * Check if users are connected
   */
  async areUsersConnected(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Validate userIds to prevent Firebase errors
      if (!userId1 || !userId2 || typeof userId1 !== 'string' || typeof userId2 !== 'string' || 
          userId1.trim() === '' || userId2.trim() === '') {
        console.warn('❌ [Connection] Invalid userIds provided to areUsersConnected:', { userId1, userId2 });
        return false;
      }

      console.log(`🔍 [Connection] Checking connection between users:`, {
        userId1: userId1,
        userId2: userId2,
        userId1Type: typeof userId1,
        userId2Type: typeof userId2,
        userId1Length: userId1.length,
        userId2Length: userId2.length
      });

      const q1 = query(
        collection(db, 'connections'),
        where('userId1', '==', userId1),
        where('userId2', '==', userId2)
      );

      const q2 = query(
        collection(db, 'connections'),
        where('userId1', '==', userId2),
        where('userId2', '==', userId1)
      );

      console.log(`🔍 [Connection] Executing Firebase queries...`);
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      console.log(`🔍 [Connection] Query results:`, {
        query1Results: snapshot1.size,
        query2Results: snapshot2.size,
        query1Empty: snapshot1.empty,
        query2Empty: snapshot2.empty
      });

      // Log some sample connection data for debugging
      if (snapshot1.size > 0) {
        console.log(`🔍 [Connection] Found connection in query1:`, snapshot1.docs[0].data());
      }
      if (snapshot2.size > 0) {
        console.log(`🔍 [Connection] Found connection in query2:`, snapshot2.docs[0].data());
      }

      const isConnected = !snapshot1.empty || !snapshot2.empty;
      console.log(`🔍 [Connection] Final result: ${isConnected}`);
      
      return isConnected;
    } catch (error) {
      console.error('❌ [Connection] Error checking connection:', error);
      return false;
    }
  }

  /**
   * Get connection request between users
   */
  private async getConnectionRequest(fromUserId: string, toUserId: string): Promise<ConnectionRequest | null> {
    try {
      const q = query(
        collection(db, 'connectionRequests'),
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as ConnectionRequest;
    } catch (error) {
      console.error('❌ [Connection] Error fetching request:', error);
      return null;
    }
  }

  /**
   * Create a connection between users
   */
  private async createConnection(request: ConnectionRequest): Promise<void> {
    const connectionData = {
      userId1: request.fromUserId,
      userId2: request.toUserId,
      user1Name: request.fromUserName,
      user2Name: request.toUserName,
      user1Avatar: request.fromUserAvatar || null,
      user2Avatar: request.toUserAvatar || null,
      connectedAt: serverTimestamp()
    };

    await addDoc(collection(db, 'connections'), connectionData);
  }

  /**
   * Send connection request notification
   */
  private async sendConnectionNotification(requestId: string, request: any): Promise<void> {
    notificationService.addNotification({
      id: `connection-request-${requestId}`,
      type: 'info',
      title: 'New Connection Request',
      message: `${request.fromUserName} wants to connect with you`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'medium',
      category: 'social',
      metadata: {
        requestId,
        fromUserId: request.fromUserId,
        fromUserName: request.fromUserName,
        fromUserAvatar: request.fromUserAvatar,
        notificationType: 'connection_request'
      }
    });
  }

  /**
   * Send acceptance notification
   */
  private async sendAcceptanceNotification(request: ConnectionRequest): Promise<void> {
    notificationService.addNotification({
      id: `connection-accepted-${request.id}`,
      type: 'success',
      title: 'Connection Accepted',
      message: `${request.toUserName} accepted your connection request`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'medium',
      category: 'social',
      metadata: {
        connectionUserId: request.toUserId,
        connectionUserName: request.toUserName,
        connectionUserAvatar: request.toUserAvatar
      }
    });
  }

  /**
   * Send rejection notification
   */
  private async sendRejectionNotification(request: ConnectionRequest): Promise<void> {
    notificationService.addNotification({
      id: `connection-rejected-${request.id}`,
      type: 'warning',
      title: 'Connection Request Declined',
      message: `${request.toUserName} declined your connection request`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'low',
      category: 'social',
      metadata: {
        userId: request.toUserId,
        userName: request.toUserName
      }
    });
  }

  /**
   * Subscribe to connection requests for a user
   */
  subscribeToConnectionRequests(userId: string, callback: (requests: ConnectionRequest[]) => void): () => void {
    const q = query(
      collection(db, 'connectionRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    );

    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ConnectionRequest[];

      callback(requests);
    });
  }

  /**
   * Subscribe to connections for a user
   */
  subscribeToConnections(userId: string, callback: (connections: Connection[]) => void): () => void {
    const q1 = query(
      collection(db, 'connections'),
      where('userId1', '==', userId)
    );

    const q2 = query(
      collection(db, 'connections'),
      where('userId2', '==', userId)
    );

    const unsubscribe1 = onSnapshot(q1, () => this.getUserConnections(userId).then(callback));
    const unsubscribe2 = onSnapshot(q2, () => this.getUserConnections(userId).then(callback));

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }
}

export const connectionService = ConnectionService.getInstance();

