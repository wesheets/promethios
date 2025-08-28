import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

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
   * Get all users from Firebase Authentication and Firestore profiles
   */
  async getAllUsers(filters?: DiscoveryFilters): Promise<FirebaseUser[]> {
    try {
      console.log('🔍 [Discovery] Fetching users from Firestore...');
      
      let usersQuery = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(50) // Limit to prevent performance issues
      );

      // Apply filters if provided
      if (filters?.isOnline !== undefined) {
        usersQuery = query(usersQuery, where('isOnline', '==', filters.isOnline));
      }

      if (filters?.minRating) {
        usersQuery = query(usersQuery, where('stats.rating', '>=', filters.minRating));
      }

      const querySnapshot = await getDocs(usersQuery);
      const users: FirebaseUser[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Only include users with public profiles
        if (userData.preferences?.isPublic !== false) {
          const user: FirebaseUser = {
            id: doc.id,
            email: userData.email || '',
            displayName: userData.displayName || userData.profile?.firstName + ' ' + userData.profile?.lastName || 'Anonymous User',
            photoURL: userData.photoURL || userData.profile?.photoURL,
            createdAt: userData.createdAt,
            lastSignIn: userData.lastSignIn,
            isOnline: userData.isOnline || false,
            profile: {
              firstName: userData.profile?.firstName || '',
              lastName: userData.profile?.lastName || '',
              title: userData.profile?.title || 'AI Collaboration Professional',
              company: userData.profile?.company || '',
              location: userData.profile?.location || '',
              bio: userData.profile?.bio || 'Exploring AI collaboration opportunities',
              skills: userData.profile?.skills || ['AI Collaboration', 'Strategic Thinking'],
              aiAgents: userData.profile?.aiAgents || ['Claude', 'ChatGPT'],
              collaborationStyle: userData.profile?.collaborationStyle || ['Creative', 'Analytical'],
              experienceLevel: userData.profile?.experienceLevel || 'Intermediate',
              industry: userData.profile?.industry || 'Technology',
              website: userData.profile?.website || '',
              linkedin: userData.profile?.linkedin || '',
              twitter: userData.profile?.twitter || ''
            },
            preferences: {
              isPublic: userData.preferences?.isPublic !== false,
              allowMessages: userData.preferences?.allowMessages !== false,
              allowConnections: userData.preferences?.allowConnections !== false,
              showOnlineStatus: userData.preferences?.showOnlineStatus !== false
            },
            stats: {
              connections: userData.stats?.connections || 0,
              collaborations: userData.stats?.collaborations || 0,
              rating: userData.stats?.rating || 4.0 + Math.random(), // Mock rating for now
              responseTime: userData.stats?.responseTime || Math.floor(Math.random() * 60) + 5 // Mock response time
            }
          };

          // Apply client-side filters
          if (this.matchesFilters(user, filters)) {
            users.push(user);
          }
        }
      });

      console.log(`🔍 [Discovery] Found ${users.length} users matching criteria`);
      return users;

    } catch (error) {
      console.error('🔍 [Discovery] Error fetching users:', error);
      
      // Return mock users if Firebase fails
      return this.getMockUsers();
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
  async getFeaturedUsers(limit: number = 6): Promise<FirebaseUser[]> {
    const users = await this.getAllUsers({ minRating: 4.0, isOnline: true });
    return users.slice(0, limit);
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
          aiAgents: ['Claude', 'ChatGPT'],
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
          aiAgents: ['Claude', 'OpenAI'],
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
export default firebaseUserDiscoveryService;

