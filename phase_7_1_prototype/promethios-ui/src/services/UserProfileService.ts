/**
 * UserProfileService
 * 
 * Service for managing user profiles, connections, and social features
 * in the Promethios AI collaboration platform.
 */

import { UserProfile, AIAgent, Experience, Education, Skill } from '../types/profile';

export interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  message?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
}

export interface CollaborationHistory {
  id: string;
  participants: string[];
  title: string;
  description: string;
  aiAgentsUsed: string[];
  duration: number; // in minutes
  rating: number;
  feedback?: string;
  isPublic: boolean;
  createdAt: string;
  completedAt: string;
}

export interface SearchFilters {
  query: string;
  location: string[];
  company: string[];
  industry: string[];
  skills: string[];
  aiAgents: string[];
  aiSkills: string[];
  collaborationStyle: string[];
  experienceLevel: string;
  collaborationRating: [number, number];
  connectionLevel: string;
  isOnline: boolean | null;
  hasPublicProfile: boolean | null;
}

export interface SearchResult {
  users: UserProfile[];
  totalCount: number;
  facets: {
    locations: { value: string; count: number }[];
    companies: { value: string; count: number }[];
    industries: { value: string; count: number }[];
    skills: { value: string; count: number }[];
    aiAgents: { value: string; count: number }[];
    aiSkills: { value: string; count: number }[];
  };
}

export class UserProfileService {
  private baseUrl = '/api/users';
  
  // No mock data - using real Firebase data only

  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(): Promise<UserProfile> {
    try {
      // Get current user from Firebase Auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Try to get existing profile from Firestore
      const existingProfile = await this.getUserProfile(user.uid);
      
      if (existingProfile) {
        return existingProfile;
      }
      
      // Create a default profile if none exists
      const defaultProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'New User',
        title: 'AI Collaboration Partner',
        company: 'Independent',
        location: '',
        industry: 'Technology',
        avatar: user.photoURL || '',
        bio: 'Passionate about AI collaboration and human-machine partnerships.',
        experience: '',
        education: '',
        skills: ['AI Collaboration'],
        aiAgents: [
          {
            id: 'claude-1',
            name: 'Claude',
            type: 'Claude',
            specialization: ['Analysis', 'Writing'],
            color: '#7C3AED',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
          }
        ],
        aiSkills: ['AI Collaboration'],
        collaborationStyle: 'Collaborative',
        connectionCount: 0,
        collaborationRating: 4.5,
        totalCollaborations: 0,
        isOnline: true,
        lastActive: new Date().toISOString(),
        profileVisibility: 'public',
        allowDiscovery: true,
        allowDirectMessages: true,
        allowCollaborationInvites: true,
        isConnected: false,
        connectionStatus: 'none',
        mutualConnections: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      
      // Save the default profile
      await this.saveProfile(defaultProfile);
      return defaultProfile;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      // Create document reference
      const profileRef = doc(db, 'userProfiles', userId);
      
      // Get existing profile data
      const existingDoc = await getDoc(profileRef);
      const existingData = existingDoc.exists() ? existingDoc.data() : {};
      
      // Merge updates with existing data
      const updatedProfile = {
        ...existingData,
        ...updates,
        userId,
        updatedAt: serverTimestamp(),
        createdAt: existingData.createdAt || serverTimestamp()
      };
      
      // Save to Firebase
      await setDoc(profileRef, updatedProfile, { merge: true });
      
      console.log('✅ Profile saved to Firebase:', userId);
      
      // Return the updated profile (convert serverTimestamp to string for return)
      return {
        ...updatedProfile,
        updatedAt: new Date().toISOString(),
        createdAt: existingData.createdAt || new Date().toISOString()
      } as UserProfile;
      
    } catch (error) {
      console.error('❌ Failed to save profile to Firebase:', error);
      throw error;
    }
  }

  /**
   * Search for users based on filters
   */
  async searchUsers(filters: SearchFilters, page = 1, limit = 20): Promise<SearchResult> {
    try {
      // Use Firebase for real user search
      const { collection, query, where, orderBy, limit: firestoreLimit, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      let q = query(collection(db, 'userProfiles'));
      
      // Apply filters
      if (filters.query) {
        // Note: Firestore doesn't support full-text search natively
        // For production, consider using Algolia or similar service
        console.log('Searching for:', filters.query);
      }
      
      if (filters.industry.length > 0) {
        q = query(q, where('industry', 'in', filters.industry));
      }
      
      if (filters.isOnline !== null) {
        q = query(q, where('isOnline', '==', filters.isOnline));
      }
      
      q = query(q, firestoreLimit(limit));
      
      const querySnapshot = await getDocs(q);
      const users: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      
      // Generate facets from results
      const facets = this.generateFacets(users);
      
      return {
        users,
        totalCount: users.length,
        facets,
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        users: [],
        totalCount: 0,
        facets: {
          locations: [],
          companies: [],
          industries: [],
          skills: [],
          aiAgents: [],
          aiSkills: [],
        },
      };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('🔍 UserProfileService.getUserProfile called with userId:', userId);
    
    try {
      // Real Firebase implementation
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      console.log('📊 UserProfileService: Creating document reference for:', userId);
      const userDocRef = doc(db, 'userProfiles', userId);
      
      console.log('🔥 UserProfileService: Fetching document from Firestore...');
      const userDoc = await getDoc(userDocRef);
      
      console.log('📋 UserProfileService: Document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const profileData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        console.log('✅ UserProfileService: Profile data found:', profileData);
        return profileData;
      } else {
        console.log('❌ UserProfileService: No document found for userId:', userId);
      }
      
      return null;
    } catch (error) {
      console.error('💥 UserProfileService: Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Send connection request
   */
  async sendConnectionRequest(userId: string, message?: string): Promise<Connection> {
    try {
      // Use Firebase connection service instead of mock data
      const { FirebaseConnectionService } = await import('./FirebaseConnectionService');
      const connectionService = new FirebaseConnectionService();
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      return await connectionService.sendConnectionRequest(userId, message);
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  }

  /**
   * Accept connection request
   */
  async acceptConnectionRequest(connectionId: string): Promise<Connection> {
    try {
      // Use Firebase connection service instead of mock data
      const { FirebaseConnectionService } = await import('./FirebaseConnectionService');
      const connectionService = new FirebaseConnectionService();
      
      return await connectionService.acceptConnectionRequest(connectionId);
    } catch (error) {
      console.error('Error accepting connection request:', error);
      throw error;
    }
  }

  /**
   * Decline connection request
   */
  async declineConnectionRequest(connectionId: string): Promise<void> {
    try {
      // Use Firebase connection service instead of mock data
      const { FirebaseConnectionService } = await import('./FirebaseConnectionService');
      const connectionService = new FirebaseConnectionService();
      
      await connectionService.declineConnectionRequest(connectionId);
    } catch (error) {
      console.error('Error declining connection request:', error);
      throw error;
    }
  }

  /**
   * Get user's connections
   */
  async getUserConnections(userId?: string): Promise<UserProfile[]> {
    try {
      // Use Firebase connection service instead of mock data
      const { FirebaseConnectionService } = await import('./FirebaseConnectionService');
      const connectionService = new FirebaseConnectionService();
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      const targetUserId = userId || currentUser?.uid;
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }
      
      const connections = await connectionService.getUserConnections(targetUserId);
      
      // Convert connections to UserProfile format
      const userProfiles: UserProfile[] = [];
      for (const connection of connections) {
        const profile = await this.getUserProfile(connection.id);
        if (profile) {
          userProfiles.push(profile);
        }
      }
      
      return userProfiles;
    } catch (error) {
      console.error('Error getting user connections:', error);
      return [];
    }
  }

  /**
   * Get pending connection requests
   */
  async getPendingConnectionRequests(): Promise<{ incoming: Connection[]; outgoing: Connection[] }> {
    try {
      // Use Firebase connection service instead of mock data
      const { FirebaseConnectionService } = await import('./FirebaseConnectionService');
      const connectionService = new FirebaseConnectionService();
      
      return await connectionService.getPendingRequests();
    } catch (error) {
      console.error('Error getting pending connection requests:', error);
      return { incoming: [], outgoing: [] };
    }
  }

  /**
   * Get collaboration history
   */
  async getCollaborationHistory(userId?: string): Promise<CollaborationHistory[]> {
    try {
      // Use Firebase for real collaboration history
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      const { getAuth } = await import('firebase/auth');
      
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const targetUserId = userId || currentUser?.uid;
      
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }
      
      const q = query(
        collection(db, 'collaborationHistory'),
        where('participants', 'array-contains', targetUserId),
        orderBy('completedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const collaborations: CollaborationHistory[] = [];
      
      querySnapshot.forEach((doc) => {
        collaborations.push({ id: doc.id, ...doc.data() } as CollaborationHistory);
      });
      
      return collaborations;
    } catch (error) {
      console.error('Error getting collaboration history:', error);
      return [];
    }
  }

  /**
   * Generate search facets
   */
  private generateFacets(users: UserProfile[]) {
    const locations = this.countValues(users.map(u => u.location));
    const companies = this.countValues(users.map(u => u.company));
    const industries = this.countValues(users.map(u => u.industry));
    const skills = this.countValues(users.flatMap(u => u.skills));
    const aiAgents = this.countValues(users.flatMap(u => u.aiAgents.map(a => a.type)));
    const aiSkills = this.countValues(users.flatMap(u => u.aiSkills));
    
    return {
      locations,
      companies,
      industries,
      skills,
      aiAgents,
      aiSkills,
    };
  }

  /**
   * Count values for facets
   */
  private countValues(values: string[]): { value: string; count: number }[] {
    const counts = values.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get public profile for a specific user
   */
  async getPublicProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Use real Firebase implementation
      return await this.getUserProfile(userId);
    } catch (error) {
      console.error('Failed to get public profile:', error);
      return null;
    }
  }

  /**
   * Save user profile to Firebase
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      // Real Firebase implementation
      const { doc, setDoc, updateDoc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const userDocRef = doc(db, 'userProfiles', profile.id);
      
      // Update the updatedAt timestamp
      const dataToSave = {
        ...profile,
        updatedAt: new Date().toISOString()
      };
      
      // Check if document exists
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(userDocRef, dataToSave);
      } else {
        // Create new document
        await setDoc(userDocRef, {
          ...dataToSave,
          createdAt: new Date().toISOString()
        });
      }
      
      console.log('Profile saved successfully to Firebase:', profile.id);
    } catch (error) {
      console.error('Failed to save profile to Firebase:', error);
      throw error;
    }
  }

  /**
   * Utility delay function for simulating API calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const userProfileService = new UserProfileService();

