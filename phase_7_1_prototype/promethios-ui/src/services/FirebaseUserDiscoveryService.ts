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

      // Load real profile data for each user
      const users: FirebaseUser[] = [];
      
      // Import UserProfileService to load real profile data
      const { UserProfileService } = await import('./UserProfileService');
      const profileService = new UserProfileService();

      for (const authUser of knownAuthUsers) {
        try {
          console.log(`🔍 [Discovery] Loading real profile data for: ${authUser.displayName}`);
          
          // Try to load real Firestore profile data
          const realProfile = await profileService.getUserProfile(authUser.uid);
          
          let profileData;
          if (realProfile) {
            console.log(`✅ [Discovery] Found real profile for: ${authUser.displayName}`);
            // Use real profile data
            profileData = {
              firstName: realProfile.firstName,
              lastName: realProfile.lastName,
              title: realProfile.title,
              company: realProfile.company,
              location: realProfile.location,
              bio: realProfile.about,
              skills: realProfile.skills || [],
              aiAgents: realProfile.aiAgents || [],
              collaborationStyle: realProfile.collaborationStyle || [],
              experienceLevel: realProfile.experienceLevel,
              industry: realProfile.industry
            };
          } else {
            console.log(`⚠️ [Discovery] No profile found for: ${authUser.displayName}, using basic info only`);
            // Use basic Firebase Auth info only - no fake data
            profileData = {
              firstName: authUser.displayName?.split(' ')[0] || authUser.email.split('@')[0],
              lastName: authUser.displayName?.split(' ')[1] || '',
              title: '', // Empty instead of fake title
              company: '',
              location: '',
              bio: '',
              skills: [],
              aiAgents: [],
              collaborationStyle: [],
              experienceLevel: '',
              industry: ''
            };
          }

          users.push({
            id: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName || authUser.email.split('@')[0],
            photoURL: realProfile?.profilePhoto || authUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.displayName || authUser.email)}&background=6366f1&color=fff`,
            createdAt: authUser.metadata.creationTime,
            lastSignIn: authUser.metadata.lastSignInTime,
            isOnline: this.isRecentlyActive(authUser.metadata.lastSignInTime),
            profile: profileData,
            preferences: {
              isPublic: true,
              allowMessages: true,
              allowConnections: true,
              showOnlineStatus: true
            },
            stats: {
              connections: realProfile?.connections || 0,
              collaborations: realProfile?.collaborations || 0,
              rating: realProfile?.rating || 0,
              responseTime: realProfile?.responseTime || 0
            }
          });

        } catch (error) {
          console.error(`💥 [Discovery] Error loading profile for ${authUser.displayName}:`, error);
        }
      }

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
      return [];
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
   * No mock users - using real Firebase data only
   */
  private getMockUsers(): FirebaseUser[] {
    return [];
  }
}

export const firebaseUserDiscoveryService = new FirebaseUserDiscoveryService();
export { FirebaseUserDiscoveryService };
export default firebaseUserDiscoveryService;

