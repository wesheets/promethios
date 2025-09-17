import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  organizationName: string;
  createdBy: string;
  createdByName: string;
  isPrivate: boolean;
  memberIds: string[];
  memberCount: number;
  lastActivity?: Date;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  organizationId: string;
  organizationName: string;
  isPrivate: boolean;
  invitedUserIds: string[];
}

/**
 * Firebase service for managing channels in organizations
 */
export class FirebaseChannelService {
  private currentUserId: string | null = null;

  constructor() {
    this.initializeCurrentUser();
  }

  /**
   * Initialize current user ID from Firebase Auth
   */
  private async initializeCurrentUser(): Promise<void> {
    try {
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
   * Create a new channel
   */
  async createChannel(request: CreateChannelRequest): Promise<string> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to create a channel');
      }

      // Get current user's profile for name
      const userProfile = await this.getUserProfile(currentUser.uid);
      const userName = userProfile?.name || currentUser.displayName || 'Unknown User';

      // Create channel document
      const channelData = {
        name: request.name.trim(),
        description: request.description?.trim() || '',
        organizationId: request.organizationId,
        organizationName: request.organizationName,
        createdBy: currentUser.uid,
        createdByName: userName,
        isPrivate: request.isPrivate,
        memberIds: [currentUser.uid, ...request.invitedUserIds],
        memberCount: 1 + request.invitedUserIds.length,
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add channel to Firestore
      const docRef = await addDoc(collection(db, 'channels'), channelData);
      
      // Add channel members
      await this.addChannelMembers(docRef.id, [
        {
          userId: currentUser.uid,
          userName: userName,
          userAvatar: currentUser.photoURL || '',
          role: 'admin',
          joinedAt: new Date()
        },
        ...await this.getUserProfiles(request.invitedUserIds)
      ]);

      console.log('✅ [FirebaseChannelService] Channel created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ [FirebaseChannelService] Error creating channel:', error);
      throw error;
    }
  }

  /**
   * Get channels for a specific organization
   */
  async getOrganizationChannels(organizationId: string): Promise<Channel[]> {
    try {
      const channelsRef = collection(db, 'channels');
      const q = query(
        channelsRef,
        where('organizationId', '==', organizationId),
        orderBy('lastActivity', 'desc')
      );

      const snapshot = await getDocs(q);
      const channels: Channel[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        channels.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          organizationId: data.organizationId,
          organizationName: data.organizationName,
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          isPrivate: data.isPrivate,
          memberIds: data.memberIds || [],
          memberCount: data.memberCount || 0,
          lastActivity: data.lastActivity?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      return channels;
    } catch (error) {
      console.error('❌ [FirebaseChannelService] Error fetching organization channels:', error);
      return [];
    }
  }

  /**
   * Get channels where the current user is a member
   */
  async getUserChannels(): Promise<Channel[]> {
    try {
      if (!this.currentUserId) {
        return [];
      }

      const channelsRef = collection(db, 'channels');
      const q = query(
        channelsRef,
        where('memberIds', 'array-contains', this.currentUserId),
        orderBy('lastActivity', 'desc')
      );

      const snapshot = await getDocs(q);
      const channels: Channel[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        channels.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          organizationId: data.organizationId,
          organizationName: data.organizationName,
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          isPrivate: data.isPrivate,
          memberIds: data.memberIds || [],
          memberCount: data.memberCount || 0,
          lastActivity: data.lastActivity?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      return channels;
    } catch (error) {
      console.error('❌ [FirebaseChannelService] Error fetching user channels:', error);
      return [];
    }
  }

  /**
   * Add members to a channel
   */
  private async addChannelMembers(channelId: string, members: ChannelMember[]): Promise<void> {
    try {
      const membersRef = collection(db, 'channels', channelId, 'members');
      
      for (const member of members) {
        await addDoc(membersRef, {
          userId: member.userId,
          userName: member.userName,
          userAvatar: member.userAvatar,
          role: member.role,
          joinedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('❌ [FirebaseChannelService] Error adding channel members:', error);
      throw error;
    }
  }

  /**
   * Get user profile data
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const userProfilesRef = collection(db, 'userProfiles');
      const q = query(userProfilesRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }

      // Fallback to users collection
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('uid', '==', userId));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        return userSnapshot.docs[0].data();
      }

      return null;
    } catch (error) {
      console.error('❌ [FirebaseChannelService] Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get user profiles for multiple users
   */
  private async getUserProfiles(userIds: string[]): Promise<ChannelMember[]> {
    try {
      const members: ChannelMember[] = [];
      
      for (const userId of userIds) {
        const profile = await this.getUserProfile(userId);
        if (profile) {
          members.push({
            userId,
            userName: profile.name || profile.displayName || 'Unknown User',
            userAvatar: profile.avatar || profile.photoURL || '',
            role: 'member',
            joinedAt: new Date()
          });
        }
      }

      return members;
    } catch (error) {
      console.error('❌ [FirebaseChannelService] Error fetching user profiles:', error);
      return [];
    }
  }

  /**
   * Update channel activity timestamp
   */
  async updateChannelActivity(channelId: string): Promise<void> {
    try {
      const channelRef = doc(db, 'channels', channelId);
      await updateDoc(channelRef, {
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ [FirebaseChannelService] Error updating channel activity:', error);
    }
  }

  /**
   * Delete a channel (admin only)
   */
  async deleteChannel(channelId: string): Promise<void> {
    try {
      if (!this.currentUserId) {
        throw new Error('User must be authenticated');
      }

      // Check if user is admin of the channel
      const channelRef = doc(db, 'channels', channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        throw new Error('Channel not found');
      }

      const channelData = channelDoc.data();
      if (channelData.createdBy !== this.currentUserId) {
        throw new Error('Only channel admin can delete the channel');
      }

      // Delete the channel
      await deleteDoc(channelRef);
      
      console.log('✅ [FirebaseChannelService] Channel deleted:', channelId);
    } catch (error) {
      console.error('❌ [FirebaseChannelService] Error deleting channel:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const firebaseChannelService = new FirebaseChannelService();

