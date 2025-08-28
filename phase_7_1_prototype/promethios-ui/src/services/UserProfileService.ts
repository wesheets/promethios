/**
 * UserProfileService
 * 
 * Service for managing user profiles, connections, and social features
 * in the Promethios AI collaboration platform.
 */

export interface AIAgent {
  id: string;
  name: string;
  type: 'Claude' | 'OpenAI' | 'Gemini' | 'Custom';
  specialization: string[];
  color: string;
  isActive: boolean;
  createdAt: string;
  lastUsed: string;
}

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  
  // Professional Info
  experience: string;
  education: string;
  skills: string[];
  
  // AI Specialization
  aiAgents: AIAgent[];
  aiSkills: string[];
  collaborationStyle: 'Analytical' | 'Creative' | 'Technical' | 'Strategic' | 'Collaborative';
  
  // Social Info
  connectionCount: number;
  collaborationRating: number;
  totalCollaborations: number;
  isOnline: boolean;
  lastActive: string;
  
  // Privacy
  profileVisibility: 'public' | 'connections' | 'private';
  allowDiscovery: boolean;
  allowDirectMessages: boolean;
  allowCollaborationInvites: boolean;
  
  // Contact
  email?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
  
  // Status
  isConnected: boolean;
  connectionStatus: 'none' | 'pending' | 'connected' | 'blocked';
  mutualConnections: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

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

class UserProfileService {
  private baseUrl = '/api/users';
  
  // Mock data for development
  private mockUsers: UserProfile[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      title: 'Senior Product Manager',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      industry: 'Technology',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      bio: 'Product leader passionate about AI-human collaboration. Building the future of work with intelligent systems.',
      experience: '8 years',
      education: 'Stanford University - MBA',
      skills: ['Product Management', 'AI Strategy', 'User Experience', 'Data Analysis'],
      aiAgents: [
        {
          id: 'claude-1',
          name: 'Strategic Claude',
          type: 'Claude',
          specialization: ['Strategy', 'Analysis', 'Planning'],
          color: '#FF6B35',
          isActive: true,
          createdAt: '2024-01-15',
          lastUsed: '2024-08-27',
        },
        {
          id: 'openai-1',
          name: 'Creative GPT',
          type: 'OpenAI',
          specialization: ['Creative Writing', 'Brainstorming'],
          color: '#00A67E',
          isActive: true,
          createdAt: '2024-02-01',
          lastUsed: '2024-08-26',
        },
      ],
      aiSkills: ['Product Strategy', 'Market Analysis', 'User Research', 'Competitive Intelligence'],
      collaborationStyle: 'Strategic',
      connectionCount: 247,
      collaborationRating: 4.8,
      totalCollaborations: 156,
      isOnline: true,
      lastActive: '2024-08-27T10:30:00Z',
      profileVisibility: 'public',
      allowDiscovery: true,
      allowDirectMessages: true,
      allowCollaborationInvites: true,
      email: 'sarah.chen@techcorp.com',
      linkedin: 'linkedin.com/in/sarahchen',
      isConnected: false,
      connectionStatus: 'none',
      mutualConnections: 12,
      createdAt: '2024-01-01',
      updatedAt: '2024-08-27',
      lastLoginAt: '2024-08-27T10:00:00Z',
    },
    {
      id: '2',
      name: 'Marcus Rodriguez',
      title: 'AI Research Scientist',
      company: 'DeepMind',
      location: 'London, UK',
      industry: 'Research',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Researching the intersection of human creativity and artificial intelligence. Published author on AI collaboration.',
      experience: '12 years',
      education: 'MIT - PhD Computer Science',
      skills: ['Machine Learning', 'Research', 'Python', 'Academic Writing'],
      aiAgents: [
        {
          id: 'gemini-1',
          name: 'Research Gemini',
          type: 'Gemini',
          specialization: ['Research', 'Analysis', 'Academic Writing'],
          color: '#4285F4',
          isActive: true,
          createdAt: '2024-01-10',
          lastUsed: '2024-08-27',
        },
        {
          id: 'custom-1',
          name: 'DataBot',
          type: 'Custom',
          specialization: ['Data Analysis', 'Visualization'],
          color: '#9C27B0',
          isActive: true,
          createdAt: '2024-03-01',
          lastUsed: '2024-08-25',
        },
      ],
      aiSkills: ['Research Methodology', 'Data Analysis', 'Academic Writing', 'Hypothesis Testing'],
      collaborationStyle: 'Analytical',
      connectionCount: 189,
      collaborationRating: 4.9,
      totalCollaborations: 89,
      isOnline: false,
      lastActive: '2024-08-26T18:45:00Z',
      profileVisibility: 'public',
      allowDiscovery: true,
      allowDirectMessages: true,
      allowCollaborationInvites: true,
      email: 'marcus.rodriguez@deepmind.com',
      linkedin: 'linkedin.com/in/marcusrodriguez',
      github: 'github.com/marcusai',
      isConnected: true,
      connectionStatus: 'connected',
      mutualConnections: 8,
      createdAt: '2024-01-05',
      updatedAt: '2024-08-26',
      lastLoginAt: '2024-08-26T18:30:00Z',
    },
    {
      id: '3',
      name: 'Emily Watson',
      title: 'Creative Director',
      company: 'Design Studio',
      location: 'New York, NY',
      industry: 'Design',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      bio: 'Creative professional exploring AI-assisted design. Passionate about human-centered AI collaboration.',
      experience: '6 years',
      education: 'Parsons School of Design - MFA',
      skills: ['Creative Direction', 'Brand Strategy', 'Visual Design', 'User Experience'],
      aiAgents: [
        {
          id: 'claude-2',
          name: 'Creative Claude',
          type: 'Claude',
          specialization: ['Creative Writing', 'Brand Strategy'],
          color: '#FF6B35',
          isActive: true,
          createdAt: '2024-02-15',
          lastUsed: '2024-08-27',
        },
      ],
      aiSkills: ['Creative Brainstorming', 'Brand Development', 'Content Strategy', 'Visual Concepts'],
      collaborationStyle: 'Creative',
      connectionCount: 156,
      collaborationRating: 4.7,
      totalCollaborations: 78,
      isOnline: true,
      lastActive: '2024-08-27T09:15:00Z',
      profileVisibility: 'connections',
      allowDiscovery: true,
      allowDirectMessages: false,
      allowCollaborationInvites: true,
      linkedin: 'linkedin.com/in/emilywatson',
      isConnected: false,
      connectionStatus: 'pending',
      mutualConnections: 5,
      createdAt: '2024-02-01',
      updatedAt: '2024-08-27',
      lastLoginAt: '2024-08-27T09:00:00Z',
    },
  ];

  private mockConnections: Connection[] = [
    {
      id: '1',
      fromUserId: 'current-user',
      toUserId: '2',
      status: 'accepted',
      message: 'Would love to collaborate on AI research projects!',
      createdAt: '2024-08-01T10:00:00Z',
      updatedAt: '2024-08-01T10:30:00Z',
      acceptedAt: '2024-08-01T10:30:00Z',
    },
    {
      id: '2',
      fromUserId: 'current-user',
      toUserId: '3',
      status: 'pending',
      message: 'Interested in exploring AI-assisted creative processes.',
      createdAt: '2024-08-25T14:00:00Z',
      updatedAt: '2024-08-25T14:00:00Z',
    },
  ];

  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(): Promise<UserProfile> {
    // In production, this would fetch from API
    await this.delay(500);
    
    return {
      id: 'current-user',
      name: 'John Doe',
      title: 'Software Engineer',
      company: 'Promethios',
      location: 'San Francisco, CA',
      industry: 'Technology',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      bio: 'Full-stack developer passionate about AI collaboration tools.',
      experience: '5 years',
      education: 'UC Berkeley - BS Computer Science',
      skills: ['JavaScript', 'React', 'Node.js', 'AI Integration'],
      aiAgents: [
        {
          id: 'openai-current',
          name: 'Dev Assistant',
          type: 'OpenAI',
          specialization: ['Code Review', 'Documentation'],
          color: '#00A67E',
          isActive: true,
          createdAt: '2024-01-01',
          lastUsed: '2024-08-27',
        },
      ],
      aiSkills: ['Code Review', 'Technical Documentation', 'Problem Solving'],
      collaborationStyle: 'Technical',
      connectionCount: 89,
      collaborationRating: 4.6,
      totalCollaborations: 45,
      isOnline: true,
      lastActive: '2024-08-27T11:00:00Z',
      profileVisibility: 'public',
      allowDiscovery: true,
      allowDirectMessages: true,
      allowCollaborationInvites: true,
      email: 'john.doe@promethios.com',
      isConnected: false,
      connectionStatus: 'none',
      mutualConnections: 0,
      createdAt: '2024-01-01',
      updatedAt: '2024-08-27',
      lastLoginAt: '2024-08-27T11:00:00Z',
    };
  }

  /**
   * Update current user's profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    await this.delay(1000);
    
    const currentProfile = await this.getCurrentUserProfile();
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return updatedProfile;
  }

  /**
   * Search for users based on filters
   */
  async searchUsers(filters: SearchFilters, page = 1, limit = 20): Promise<SearchResult> {
    await this.delay(800);
    
    let filteredUsers = [...this.mockUsers];
    
    // Apply query filter
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.title.toLowerCase().includes(query) ||
        user.company.toLowerCase().includes(query) ||
        user.skills.some(skill => skill.toLowerCase().includes(query)) ||
        user.aiSkills.some(skill => skill.toLowerCase().includes(query)) ||
        user.aiAgents.some(agent => agent.type.toLowerCase().includes(query))
      );
    }
    
    // Apply location filter
    if (filters.location.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        filters.location.some(location => user.location.includes(location))
      );
    }
    
    // Apply company filter
    if (filters.company.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        filters.company.includes(user.company)
      );
    }
    
    // Apply industry filter
    if (filters.industry.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        filters.industry.includes(user.industry)
      );
    }
    
    // Apply skills filter
    if (filters.skills.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        filters.skills.some(skill => user.skills.includes(skill))
      );
    }
    
    // Apply AI agents filter
    if (filters.aiAgents.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        filters.aiAgents.some(agentType =>
          user.aiAgents.some(agent => agent.type === agentType)
        )
      );
    }
    
    // Apply AI skills filter
    if (filters.aiSkills.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        filters.aiSkills.some(skill => user.aiSkills.includes(skill))
      );
    }
    
    // Apply collaboration style filter
    if (filters.collaborationStyle.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        filters.collaborationStyle.includes(user.collaborationStyle)
      );
    }
    
    // Apply collaboration rating filter
    if (filters.collaborationRating[0] > 0 || filters.collaborationRating[1] < 5) {
      filteredUsers = filteredUsers.filter(user =>
        user.collaborationRating >= filters.collaborationRating[0] &&
        user.collaborationRating <= filters.collaborationRating[1]
      );
    }
    
    // Apply online status filter
    if (filters.isOnline !== null) {
      filteredUsers = filteredUsers.filter(user => user.isOnline === filters.isOnline);
    }
    
    // Apply public profile filter
    if (filters.hasPublicProfile !== null && filters.hasPublicProfile) {
      filteredUsers = filteredUsers.filter(user => user.profileVisibility === 'public');
    }
    
    // Update connection status based on mock connections
    filteredUsers = filteredUsers.map(user => {
      const connection = this.mockConnections.find(conn =>
        (conn.fromUserId === 'current-user' && conn.toUserId === user.id) ||
        (conn.toUserId === 'current-user' && conn.fromUserId === user.id)
      );
      
      if (connection) {
        return {
          ...user,
          isConnected: connection.status === 'accepted',
          connectionStatus: connection.status,
        };
      }
      
      return user;
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);
    
    // Generate facets
    const facets = this.generateFacets(filteredUsers);
    
    return {
      users: paginatedUsers,
      totalCount: filteredUsers.length,
      facets,
    };
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    await this.delay(300);
    
    const user = this.mockUsers.find(u => u.id === userId);
    if (!user) return null;
    
    // Update connection status
    const connection = this.mockConnections.find(conn =>
      (conn.fromUserId === 'current-user' && conn.toUserId === userId) ||
      (conn.toUserId === 'current-user' && conn.fromUserId === userId)
    );
    
    if (connection) {
      return {
        ...user,
        isConnected: connection.status === 'accepted',
        connectionStatus: connection.status,
      };
    }
    
    return user;
  }

  /**
   * Send connection request
   */
  async sendConnectionRequest(userId: string, message?: string): Promise<Connection> {
    await this.delay(500);
    
    const connection: Connection = {
      id: Date.now().toString(),
      fromUserId: 'current-user',
      toUserId: userId,
      status: 'pending',
      message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.mockConnections.push(connection);
    return connection;
  }

  /**
   * Accept connection request
   */
  async acceptConnectionRequest(connectionId: string): Promise<Connection> {
    await this.delay(500);
    
    const connection = this.mockConnections.find(c => c.id === connectionId);
    if (!connection) throw new Error('Connection not found');
    
    connection.status = 'accepted';
    connection.acceptedAt = new Date().toISOString();
    connection.updatedAt = new Date().toISOString();
    
    return connection;
  }

  /**
   * Decline connection request
   */
  async declineConnectionRequest(connectionId: string): Promise<void> {
    await this.delay(500);
    
    const connection = this.mockConnections.find(c => c.id === connectionId);
    if (!connection) throw new Error('Connection not found');
    
    connection.status = 'declined';
    connection.updatedAt = new Date().toISOString();
  }

  /**
   * Get user's connections
   */
  async getUserConnections(userId: string = 'current-user'): Promise<UserProfile[]> {
    await this.delay(500);
    
    const userConnections = this.mockConnections.filter(conn =>
      (conn.fromUserId === userId || conn.toUserId === userId) &&
      conn.status === 'accepted'
    );
    
    const connectedUserIds = userConnections.map(conn =>
      conn.fromUserId === userId ? conn.toUserId : conn.fromUserId
    );
    
    return this.mockUsers.filter(user => connectedUserIds.includes(user.id));
  }

  /**
   * Get pending connection requests
   */
  async getPendingConnectionRequests(): Promise<{ incoming: Connection[]; outgoing: Connection[] }> {
    await this.delay(300);
    
    const incoming = this.mockConnections.filter(conn =>
      conn.toUserId === 'current-user' && conn.status === 'pending'
    );
    
    const outgoing = this.mockConnections.filter(conn =>
      conn.fromUserId === 'current-user' && conn.status === 'pending'
    );
    
    return { incoming, outgoing };
  }

  /**
   * Get collaboration history
   */
  async getCollaborationHistory(userId: string = 'current-user'): Promise<CollaborationHistory[]> {
    await this.delay(500);
    
    // Mock collaboration history
    return [
      {
        id: '1',
        participants: ['current-user', '2'],
        title: 'AI Research Paper Review',
        description: 'Collaborative review of machine learning research paper with AI assistance.',
        aiAgentsUsed: ['Research Gemini', 'Dev Assistant'],
        duration: 120,
        rating: 5,
        feedback: 'Excellent collaboration! Very insightful AI assistance.',
        isPublic: true,
        createdAt: '2024-08-20T10:00:00Z',
        completedAt: '2024-08-20T12:00:00Z',
      },
      {
        id: '2',
        participants: ['current-user', '1'],
        title: 'Product Strategy Session',
        description: 'Strategic planning session for new AI product features.',
        aiAgentsUsed: ['Strategic Claude', 'Dev Assistant'],
        duration: 90,
        rating: 4,
        isPublic: false,
        createdAt: '2024-08-15T14:00:00Z',
        completedAt: '2024-08-15T15:30:00Z',
      },
    ];
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
  async getPublicProfile(userId: string): Promise<UserProfile> {
    try {
      // In production, this would fetch from Firebase
      await this.delay(500);
      
      // For now, return mock data based on userId
      return {
        id: userId,
        name: `User ${userId.slice(0, 8)}`,
        title: 'AI Collaboration Specialist',
        company: 'Promethios',
        location: 'San Francisco, CA',
        industry: 'Technology',
        avatar: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000000)}?w=150`,
        bio: 'Passionate about AI collaboration and human-machine partnerships.',
        skills: ['AI Collaboration', 'Machine Learning', 'Project Management'],
        experience: [
          {
            title: 'AI Collaboration Specialist',
            company: 'Promethios',
            startDate: '2023-01-01',
            current: true,
            description: 'Leading AI collaboration initiatives and partnerships.'
          }
        ],
        education: [
          {
            school: 'Stanford University',
            degree: 'MS',
            field: 'Computer Science',
            startDate: '2020-09-01',
            endDate: '2022-06-01'
          }
        ],
        connections: Math.floor(Math.random() * 500) + 100,
        isOnline: Math.random() > 0.5,
        lastSeen: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
        joinedDate: new Date('2023-01-01'),
        profileViews: Math.floor(Math.random() * 1000) + 50,
        isPublic: true,
        preferences: {
          showEmail: false,
          showPhone: false,
          showOnlineStatus: true
        }
      };
    } catch (error) {
      console.error('Failed to get public profile:', error);
      throw error;
    }
  }

  /**
   * Save user profile to Firebase
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      // In production, this would save to Firebase
      await this.delay(1000);
      
      console.log('Profile saved successfully:', profile.id);
      // TODO: Implement Firebase save operation
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  }

  /**
   * Update specific profile fields
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // In production, this would update Firebase document
      await this.delay(500);
      
      const currentProfile = await this.getCurrentUserProfile();
      const updatedProfile = { ...currentProfile, ...updates };
      
      await this.saveProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile by ID (for authenticated access)
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      // In production, this would check permissions and fetch from Firebase
      await this.delay(500);
      
      if (userId === 'current-user') {
        return this.getCurrentUserProfile();
      }
      
      return this.getPublicProfile(userId);
    } catch (error) {
      console.error('Failed to get user profile:', error);
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

