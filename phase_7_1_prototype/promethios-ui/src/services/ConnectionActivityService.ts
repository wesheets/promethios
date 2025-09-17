import { db } from '../firebase/config';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ConnectionActivity, ConnectionActivityUser } from '../components/social/ConnectionActivityPost';

/**
 * ConnectionActivityService - Service for managing connection activities in the social feed
 * 
 * Handles:
 * - Creating connection activity posts when users connect
 * - Fetching connection activities for the social feed
 * - Liking, commenting, and sharing connection activities
 */
export class ConnectionActivityService {
  private currentUserId: string | null = null;

  constructor() {
    // Initialize current user ID from Firebase Auth
    this.initializeCurrentUser();
  }

  /**
   * Initialize current user ID from Firebase Auth
   */
  private async initializeCurrentUser(): Promise<void> {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      
      if (auth.currentUser) {
        this.currentUserId = auth.currentUser.uid;
      }
      
      // Listen for auth state changes
      auth.onAuthStateChanged((user) => {
        this.currentUserId = user?.uid || null;
      });
    } catch (error) {
      console.error('Error initializing current user:', error);
    }
  }

  /**
   * Create a new connection activity post when users connect
   */
  async createConnectionActivity(
    type: 'new_connection' | 'connection_accepted' | 'mutual_connection',
    primaryUserId: string,
    secondaryUserId: string,
    message?: string
  ): Promise<string> {
    try {
      // Get user data for both users
      const primaryUserData = await this.getUserData(primaryUserId);
      const secondaryUserData = await this.getUserData(secondaryUserId);
      
      if (!primaryUserData || !secondaryUserData) {
        throw new Error('User data not found');
      }

      // Get mutual connections if type is mutual_connection
      let mutualConnections: ConnectionActivityUser[] = [];
      if (type === 'mutual_connection') {
        mutualConnections = await this.getMutualConnections(primaryUserId, secondaryUserId);
      }

      // Create the activity document
      const activityData = {
        type,
        primaryUserId,
        secondaryUserId,
        primaryUserData,
        secondaryUserData,
        mutualConnectionsData: mutualConnections,
        message: message || '',
        createdAt: serverTimestamp(),
        metrics: {
          likes: 0,
          comments: 0,
          shares: 0,
        },
        likedBy: [],
        visibility: 'public',
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'connectionActivities'), activityData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating connection activity:', error);
      throw error;
    }
  }

  /**
   * Get recent connection activities for the social feed
   */
  async getRecentConnectionActivities(limitCount = 10): Promise<ConnectionActivity[]> {
    try {
      const activitiesRef = collection(db, 'connectionActivities');
      const q = query(
        activitiesRef,
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const activities: ConnectionActivity[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert Firestore data to ConnectionActivity
        activities.push({
          id: doc.id,
          type: data.type,
          primaryUser: {
            id: data.primaryUserId,
            name: data.primaryUserData.name,
            title: data.primaryUserData.title,
            company: data.primaryUserData.company,
            avatar: data.primaryUserData.avatar,
            isVerified: data.primaryUserData.isVerified || false,
          },
          secondaryUser: {
            id: data.secondaryUserId,
            name: data.secondaryUserData.name,
            title: data.secondaryUserData.title,
            company: data.secondaryUserData.company,
            avatar: data.secondaryUserData.avatar,
            isVerified: data.secondaryUserData.isVerified || false,
          },
          mutualConnections: data.mutualConnectionsData || [],
          message: data.message || '',
          createdAt: (data.createdAt as Timestamp).toDate(),
          metrics: {
            likes: data.metrics.likes || 0,
            comments: data.metrics.comments || 0,
            shares: data.metrics.shares || 0,
          },
          isLiked: data.likedBy?.includes(this.currentUserId || '') || false,
        });
      });

      return activities;
    } catch (error) {
      console.error('Error fetching connection activities:', error);
      return [];
    }
  }

  /**
   * Get user data for connection activities
   */
  private async getUserData(userId: string): Promise<any> {
    try {
      const userProfilesRef = collection(db, 'userProfiles');
      const q = query(userProfilesRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Try to get from Firebase Auth users collection
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('uid', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          return null;
        }
        
        const userData = userSnapshot.docs[0].data();
        return {
          name: userData.displayName || 'Anonymous User',
          title: userData.title || 'Professional',
          company: userData.company || '',
          avatar: userData.photoURL || '',
          isVerified: false,
        };
      }

      const profileData = snapshot.docs[0].data();
      return {
        name: profileData.name || profileData.displayName || 'Anonymous User',
        title: profileData.title || 'Professional',
        company: profileData.company || '',
        avatar: profileData.avatar || profileData.photoURL || '',
        isVerified: profileData.isVerified || false,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  /**
   * Get mutual connections between two users
   */
  private async getMutualConnections(
    userId1: string,
    userId2: string,
    maxConnections = 5
  ): Promise<ConnectionActivityUser[]> {
    try {
      // Get connections for user1
      const connectionsRef = collection(db, 'connections');
      const q1 = query(connectionsRef, where('userId', '==', userId1), where('status', '==', 'connected'));
      const snapshot1 = await getDocs(q1);
      
      const user1Connections = new Set<string>();
      snapshot1.forEach((doc) => {
        const data = doc.data();
        user1Connections.add(data.connectedUserId);
      });

      // Get connections for user2
      const q2 = query(connectionsRef, where('userId', '==', userId2), where('status', '==', 'connected'));
      const snapshot2 = await getDocs(q2);
      
      const mutualConnectionIds: string[] = [];
      snapshot2.forEach((doc) => {
        const data = doc.data();
        if (user1Connections.has(data.connectedUserId)) {
          mutualConnectionIds.push(data.connectedUserId);
        }
      });

      // Limit the number of mutual connections
      const limitedMutualConnectionIds = mutualConnectionIds.slice(0, maxConnections);
      
      // Get user data for mutual connections
      const mutualConnections: ConnectionActivityUser[] = [];
      for (const connectionId of limitedMutualConnectionIds) {
        const userData = await this.getUserData(connectionId);
        if (userData) {
          mutualConnections.push({
            id: connectionId,
            name: userData.name,
            title: userData.title,
            company: userData.company,
            avatar: userData.avatar,
            isVerified: userData.isVerified,
          });
        }
      }

      return mutualConnections;
    } catch (error) {
      console.error('Error fetching mutual connections:', error);
      return [];
    }
  }

  /**
   * Like a connection activity
   */
  async likeActivity(activityId: string): Promise<void> {
    // Implementation would go here
  }

  /**
   * Comment on a connection activity
   */
  async commentOnActivity(activityId: string, comment: string): Promise<void> {
    // Implementation would go here
  }

  /**
   * Share a connection activity
   */
  async shareActivity(activityId: string): Promise<void> {
    // Implementation would go here
  }
}

// Create a singleton instance
export const connectionActivityService = new ConnectionActivityService();

