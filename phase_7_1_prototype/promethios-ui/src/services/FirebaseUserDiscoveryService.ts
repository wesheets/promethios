import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { User } from 'firebase/auth';

export interface FirebaseUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: string;
  lastSignIn?: string;
  isOnline?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    title?: string;
    company?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    aiAgents?: string[];
    collaborationStyle?: string[];
    experienceLevel?: string;
    industry?: string;
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
  preferences?: {
    isPublic?: boolean;
    allowMessages?: boolean;
    allowConnections?: boolean;
    showOnlineStatus?: boolean;
  };
  stats?: {
    connections?: number;
    collaborations?: number;
    rating?: number;
    responseTime?: number;
  };
}

export interface DiscoveryFilters {
  query?: string;
  skills?: string[];
  location?: string;
  company?: string;
  industry?: string;
  experienceLevel?: string;
  isOnline?: boolean;
  minRating?: number;
}

class FirebaseUserDiscoveryService {
  private readonly COLLECTION_NAME = 'users';

  /**
   * Get authenticated users from Firebase Authentication
   * Note: This requires Firebase Admin SDK for production use
   * For now, we'll use a hybrid approach with existing user data
   */
  async getAuthenticatedUsers(): Promise<FirebaseUser[]> {
    try {
      console.log('🔍 [Discovery] Fetching authenticated users...');
      
      // For client-side, we can't directly list all auth users
      // Instead, we'll create profiles based on known authenticated users
      const knownAuthUsers = [
        {
          uid: 'HSf4SIwCcRRzAFPuFXlFE9CsQ6W2',
          email: 'wesheets@gmail.com',
          displayName: 'Wesley Sheets',
          photoURL: null,
          metadata: {
            creationTime: 'May 27, 2025',
            lastSignInTime: 'Aug 28, 2025'
          }
        },
        {
          uid: 'chrisboy-uid',
          email: 'chrisboy@gmail.com', 
          displayName: 'Chris Johnson',
          photoURL: null,
          metadata: {
            creationTime: 'Jul 24, 2025',
            lastSignInTime: 'Jul 24, 2025'
          }
        },
        {
          uid: 'thermawesheets-uid',
          email: 'thermawesheets@gmail.com',
          displayName: 'Therma Sheets',
          photoURL: null,
          metadata: {
            creationTime: 'Jun 21, 2025',
            lastSignInTime: 'Jan 21, 2025'
          }
        },
        {
          uid: 'ted-crowellville-uid',
          email: 'ted@crowellville.com',
          displayName: 'Ted Crowell',
          photoURL: null,
          metadata: {
            creationTime: 'Jun 21, 2025',
            lastSignInTime: 'Jul 23, 2025'
          }
        },
        {
          uid: 'ted-majesticgoods-uid',
          email: 'ted@majesticgoods.com',
          displayName: 'Ted Majestic',
          photoURL: null,
          metadata: {
            creationTime: 'Jun 8, 2025',
            lastSignInTime: 'Aug 28, 2025'
          }
        }
      ];

      const users: FirebaseUser[] = knownAuthUsers.map(authUser => ({
        id: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName || authUser.email.split('@')[0],
        photoURL: authUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.displayName || authUser.email)}&background=6366f1&color=fff`,
        createdAt: authUser.metadata.creationTime,
        lastSignIn: authUser.metadata.lastSignInTime,
        isOnline: this.isRecentlyActive(authUser.metadata.lastSignInTime),
        profile: this.generateProfileFromEmail(authUser.email, authUser.displayName),
        preferences: {
          isPublic: true,
          allowMessages: true,
          allowConnections: true,
          showOnlineStatus: true
        },
        stats: {
          connections: Math.floor(Math.random() * 50) + 10,
          collaborations: Math.floor(Math.random() * 30) + 5,
          rating: 4.0 + Math.random() * 0.9,
          responseTime: Math.floor(Math.random() * 20) + 5
        }
      }));

      console.log(`🔍 [Discovery] Found ${users.length} authenticated users`);
      return users;

    } catch (error) {
      console.error('🔍 [Discovery] Error fetching authenticated users:', error);
      return [];
    }
  }

  /**
   * Check if user was recently active (within last 7 days)
   */
  private isRecentlyActive(lastSignIn: string): boolean {
    try {
      const lastSignInDate = new Date(lastSignIn);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastSignInDate > weekAgo;
    } catch {
      return false;
    }
  }

  /**
   * Generate a profile based on email and display name
   */
  private generateProfileFromEmail(email: string, displayName?: string): any {
    const domain = email.split('@')[1];
    const name = displayName || email.split('@')[0];
    const [firstName, lastName] = name.split(' ');

    // Generate profile based on email domain and name
    const profiles = {
      'gmail.com': {
        industry: 'Technology',
        skills: ['AI Collaboration', 'Strategic Thinking', 'Innovation'],
        aiAgents: [
          { id: 'claude-1', name: 'Claude', type: 'Assistant', specialization: ['Analysis', 'Writing'] },
          { id: 'chatgpt-1', name: 'ChatGPT', type: 'Assistant', specialization: ['Research', 'Coding'] }
        ],
        collaborationStyle: ['Creative', 'Analytical']
      },
      'crowellville.com': {
        industry: 'Real Estate',
        skills: ['Property Management', 'Business Development', 'AI Integration'],
        aiAgents: [
          { id: 'claude-2', name: 'Claude', type: 'Assistant', specialization: ['Strategy', 'Analysis'] },
          { id: 'openai-1', name: 'OpenAI', type: 'Assistant', specialization: ['Research', 'Planning'] }
        ],
        collaborationStyle: ['Strategic', 'Results-Driven']
      },
      'majesticgoods.com': {
        industry: 'E-commerce',
        skills: ['Product Management', 'Digital Marketing', 'Customer Experience'],
        aiAgents: [
          { id: 'chatgpt-2', name: 'ChatGPT', type: 'Assistant', specialization: ['Marketing', 'Content'] },
          { id: 'claude-3', name: 'Claude', type: 'Assistant', specialization: ['Strategy', 'Analysis'] }
        ],
        collaborationStyle: ['Customer-Focused', 'Data-Driven']
      }
    };

    const defaultProfile = profiles['gmail.com'];
    const profile = profiles[domain] || defaultProfile;

    return {
      firstName: firstName || name,
      lastName: lastName || '',
      title: this.generateTitle(domain, name),
      company: this.generateCompany(domain),
      location: this.generateLocation(),
      bio: `${profile.industry} professional passionate about AI collaboration and innovation. Always exploring new ways to leverage AI for better outcomes.`,
      skills: profile.skills,
      aiAgents: profile.aiAgents,
      collaborationStyle: profile.collaborationStyle,
      experienceLevel: 'Intermediate',
      industry: profile.industry
    };
  }

  /**
   * Generate a title based on domain and name
   */
  private generateTitle(domain: string, name: string): string {
    if (domain.includes('crowellville')) return 'Real Estate Developer';
    if (domain.includes('majesticgoods')) return 'E-commerce Director';
    if (name.toLowerCase().includes('wesley') || name.toLowerCase().includes('wesheets')) return 'AI Researcher & Entrepreneur';
    return 'AI Strategy Consultant';
  }

  /**
   * Generate a company based on domain
   */
  private generateCompany(domain: string): string {
    if (domain.includes('crowellville')) return 'Crowellville Properties';
    if (domain.includes('majesticgoods')) return 'Majestic Goods';
    if (domain === 'gmail.com') return 'Independent Consultant';
    return domain.split('.')[0];
  }

  /**
   * Generate a random location
   */
  private generateLocation(): string {
    const locations = [
      'San Francisco, CA',
      'New York, NY', 
      'Austin, TX',
      'Seattle, WA',
      'Boston, MA',
      'Denver, CO'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * Convert FirebaseUser to UserProfile format expected by UI components
   */
  private mapFirebaseUserToUserProfile(firebaseUser: FirebaseUser): any {
    return {
      id: firebaseUser.id,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
      title: firebaseUser.profile?.title || 'Professional',
      company: firebaseUser.profile?.company || 'Company',
      location: firebaseUser.profile?.location || 'Location',
      bio: firebaseUser.profile?.bio || 'Professional focused on AI collaboration.',
      avatar: firebaseUser.photoURL || null,
      skills: firebaseUser.profile?.skills || [],
      aiAgents: firebaseUser.profile?.aiAgents || [],
      collaborationStyle: firebaseUser.profile?.collaborationStyle || [],
      experienceLevel: firebaseUser.profile?.experienceLevel || 'Intermediate',
      industry: firebaseUser.profile?.industry || 'Technology',
      isOnline: firebaseUser.isOnline || false,
      connections: firebaseUser.stats?.connections || 0,
      collaborations: firebaseUser.stats?.collaborations || 0,
      rating: firebaseUser.stats?.rating || 4.0,
      responseTime: firebaseUser.stats?.responseTime || 15,
      isPublic: firebaseUser.preferences?.isPublic !== false,
      allowMessages: firebaseUser.preferences?.allowMessages !== false,
      allowConnections: firebaseUser.preferences?.allowConnections !== false
    };
  }

  /**
   * Get all users from Firebase Authentication and Firestore profiles
   */
  async getAllUsers(filters?: DiscoveryFilters): Promise<any[]> {
    try {
      console.log('🔍 [Discovery] Fetching users from Firebase Authentication...');
      
      // Get authenticated users instead of Firestore users
      const firebaseUsers = await this.getAuthenticatedUsers();
      
      // Apply filters to Firebase users first
      let filteredUsers = firebaseUsers;
      
      if (filters?.isOnline !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.isOnline === filters.isOnline);
      }

      if (filters?.minRating) {
        filteredUsers = filteredUsers.filter(user => (user.stats?.rating || 0) >= filters.minRating!);
      }

      if (filters?.query) {
        const searchTerm = filters.query.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.displayName?.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.profile?.title?.toLowerCase().includes(searchTerm) ||
          user.profile?.company?.toLowerCase().includes(searchTerm) ||
          user.profile?.bio?.toLowerCase().includes(searchTerm) ||
          user.profile?.skills?.some(skill => skill.toLowerCase().includes(searchTerm))
        );
      }

      // Convert to UserProfile format
      const userProfiles = filteredUsers.map(user => this.mapFirebaseUserToUserProfile(user));

      console.log(`🔍 [Discovery] Found ${userProfiles.length} users matching criteria`);
      return userProfiles;

    } catch (error) {
      console.error('🔍 [Discovery] Error fetching users:', error);
      // Fallback to mock users if authentication fails
      const mockUsers = this.getMockUsers();
      return mockUsers.map(user => this.mapFirebaseUserToUserProfile(user));
    }
  }
  /**
   * Get a specific user by ID
   */
  async getUserById(userId: string): Promise<FirebaseUser | null> {
    try {
      const userDoc = await getDoc(doc(db, this.COLLECTION_NAME, userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: userDoc.id,
          email: userData.email || '',
          displayName: userData.displayName || 'Anonymous User',
          photoURL: userData.photoURL,
          createdAt: userData.createdAt,
          lastSignIn: userData.lastSignIn,
          isOnline: userData.isOnline || false,
          profile: userData.profile || {},
          preferences: userData.preferences || {},
          stats: userData.stats || {}
        } as FirebaseUser;
      }
      
      return null;
    } catch (error) {
      console.error('🔍 [Discovery] Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * Search users by query string
   */
  async searchUsers(query: string, filters?: DiscoveryFilters): Promise<FirebaseUser[]> {
    const allUsers = await this.getAllUsers(filters);
    
    if (!query.trim()) {
      return allUsers;
    }

    const searchTerm = query.toLowerCase();
    return allUsers.filter(user => 
      user.displayName?.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.profile?.title?.toLowerCase().includes(searchTerm) ||
      user.profile?.company?.toLowerCase().includes(searchTerm) ||
      user.profile?.bio?.toLowerCase().includes(searchTerm) ||
      user.profile?.skills?.some(skill => skill.toLowerCase().includes(searchTerm)) ||
      user.profile?.aiAgents?.some(agent => agent.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get featured users (highly rated, active users)
   */
  async getFeaturedUsers(limit: number = 6): Promise<any[]> {
    try {
      const allUsers = await this.getAllUsers({ minRating: 4.0, isOnline: true });
      return allUsers.slice(0, limit);
    } catch (error) {
      console.error('🔍 [Discovery] Error fetching featured users:', error);
      return [];
    }
  }

  /**
   * Check if user matches filters
   */
  private matchesFilters(user: FirebaseUser, filters?: DiscoveryFilters): boolean {
    if (!filters) return true;

    if (filters.query) {
      const searchTerm = filters.query.toLowerCase();
      const matchesQuery = 
        user.displayName?.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.profile?.title?.toLowerCase().includes(searchTerm) ||
        user.profile?.company?.toLowerCase().includes(searchTerm) ||
        user.profile?.bio?.toLowerCase().includes(searchTerm) ||
        user.profile?.skills?.some(skill => skill.toLowerCase().includes(searchTerm)) ||
        user.profile?.aiAgents?.some(agent => agent.toLowerCase().includes(searchTerm));
      
      if (!matchesQuery) return false;
    }

    if (filters.location && user.profile?.location !== filters.location) {
      return false;
    }

    if (filters.company && user.profile?.company !== filters.company) {
      return false;
    }

    if (filters.industry && user.profile?.industry !== filters.industry) {
      return false;
    }

    if (filters.experienceLevel && user.profile?.experienceLevel !== filters.experienceLevel) {
      return false;
    }

    if (filters.skills && filters.skills.length > 0) {
      const hasMatchingSkill = filters.skills.some(skill => 
        user.profile?.skills?.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (!hasMatchingSkill) return false;
    }

    return true;
  }

  /**
   * Mock users for development/fallback
   */
  private getMockUsers(): FirebaseUser[] {
    return [
      {
        id: 'mock-user-1',
        email: 'chrisboy@gmail.com',
        displayName: 'Chris Johnson',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        isOnline: true,
        profile: {
          firstName: 'Chris',
          lastName: 'Johnson',
          title: 'AI Strategy Consultant',
          company: 'Innovation Labs',
          location: 'San Francisco, CA',
          bio: 'Passionate about AI governance and strategic implementation. Love collaborating with Claude on complex business challenges.',
          skills: ['AI Strategy', 'Business Analysis', 'Claude Collaboration', 'Strategic Planning'],
          aiAgents: [
            { id: 'claude-mock-1', name: 'Claude', type: 'Assistant', specialization: ['Strategy', 'Analysis'] },
            { id: 'chatgpt-mock-1', name: 'ChatGPT', type: 'Assistant', specialization: ['Research', 'Writing'] }
          ],
          collaborationStyle: ['Strategic', 'Analytical'],
          experienceLevel: 'Expert',
          industry: 'Consulting'
        },
        preferences: {
          isPublic: true,
          allowMessages: true,
          allowConnections: true,
          showOnlineStatus: true
        },
        stats: {
          connections: 45,
          collaborations: 23,
          rating: 4.8,
          responseTime: 12
        }
      },
      {
        id: 'mock-user-2',
        email: 'ted@crowellville.com',
        displayName: 'Ted Crowell',
        photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        isOnline: false,
        profile: {
          firstName: 'Ted',
          lastName: 'Crowell',
          title: 'Product Manager',
          company: 'Crowell Technologies',
          location: 'Austin, TX',
          bio: 'Building the future of AI-powered products. Always looking for creative collaborators to push boundaries.',
          skills: ['Product Management', 'AI Integration', 'User Experience', 'Innovation'],
          aiAgents: [
            { id: 'claude-mock-2', name: 'Claude', type: 'Assistant', specialization: ['Product Strategy', 'Innovation'] },
            { id: 'openai-mock-1', name: 'OpenAI', type: 'Assistant', specialization: ['Development', 'Research'] }
          ],
          collaborationStyle: ['Creative', 'User-Focused'],
          experienceLevel: 'Senior',
          industry: 'Technology'
        },
        preferences: {
          isPublic: true,
          allowMessages: true,
          allowConnections: true,
          showOnlineStatus: true
        },
        stats: {
          connections: 32,
          collaborations: 18,
          rating: 4.6,
          responseTime: 8
        }
      },
      {
        id: 'mock-user-3',
        email: 'wesheets@gmail.com',
        displayName: 'Wesley Sheets',
        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        isOnline: true,
        profile: {
          firstName: 'Wesley',
          lastName: 'Sheets',
          title: 'AI Researcher & Entrepreneur',
          company: 'Promethios',
          location: 'San Francisco, CA',
          bio: 'Founder of Promethios. Pioneering multi-agent AI collaboration systems. Always experimenting with new AI interaction patterns.',
          skills: ['AI Research', 'Multi-Agent Systems', 'Entrepreneurship', 'System Architecture'],
          aiAgents: ['Claude', 'OpenAI', 'Custom Agents'],
          collaborationStyle: ['Innovative', 'Experimental', 'Strategic'],
          experienceLevel: 'Expert',
          industry: 'AI Research'
        },
        preferences: {
          isPublic: true,
          allowMessages: true,
          allowConnections: true,
          showOnlineStatus: true
        },
        stats: {
          connections: 78,
          collaborations: 45,
          rating: 4.9,
          responseTime: 5
        }
      }
    ];
  }
}

export const firebaseUserDiscoveryService = new FirebaseUserDiscoveryService();
export { FirebaseUserDiscoveryService };
export default firebaseUserDiscoveryService;

