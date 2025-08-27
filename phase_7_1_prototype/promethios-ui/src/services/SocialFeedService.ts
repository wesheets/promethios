/**
 * SocialFeedService
 * 
 * Service for managing social feed posts, interactions, and content
 * in the Promethios AI collaboration platform.
 */

import { FeedPost, FeedPostAuthor, FeedPostMetrics } from '../components/social/SocialFeedPost';

export interface FeedFilters {
  postTypes: string[];
  aiAgents: string[];
  timeRange: string;
  connectionLevel: string;
  trending: boolean;
}

export interface FeedRequest {
  feedType: string;
  userId?: string;
  filters: FeedFilters;
  page: number;
  limit: number;
}

export interface FeedResponse {
  posts: FeedPost[];
  hasMore: boolean;
  totalCount: number;
  nextPage?: number;
}

export interface CreatePostRequest {
  type: string;
  title: string;
  content: string;
  tags: string[];
  visibility: string;
  aiAgentsUsed?: string[];
  collaborationDuration?: number;
  collaborationParticipants?: string[];
  attachments?: any[];
}

class SocialFeedService {
  private baseUrl = '/api/social';
  
  // Mock data for development
  private mockPosts: FeedPost[] = [
    {
      id: '1',
      author: {
        id: '1',
        name: 'Sarah Chen',
        title: 'Senior Product Manager',
        company: 'TechCorp',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        isVerified: true,
        isConnected: false,
      },
      type: 'collaboration_highlight',
      title: 'Breakthrough AI Strategy Session with Claude',
      content: `Just completed an incredible 2-hour strategy session with Claude that transformed our Q4 product roadmap! 🚀

We tackled three major challenges:
• Market positioning for our new AI features
• Competitive analysis against emerging players  
• User adoption strategy for enterprise clients

Claude's analytical approach helped us identify blind spots we hadn't considered. The collaborative back-and-forth was amazing - it felt like having a brilliant strategist on the team who never gets tired and always asks the right questions.

Key breakthrough: We realized our messaging was too technical. Claude helped us craft user-centric narratives that resonate with actual pain points.

This is the future of product strategy - human creativity + AI analysis = unstoppable combination! 💡`,
      aiAgentsUsed: [
        {
          id: 'claude-1',
          name: 'Strategic Claude',
          type: 'Claude',
          color: '#FF6B35',
        },
      ],
      collaborationDuration: 120,
      collaborationParticipants: ['Sarah Chen'],
      attachments: [
        {
          type: 'conversation',
          url: 'conv-123',
          title: 'AI Strategy Session - Q4 Product Roadmap',
          thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=300',
        },
      ],
      tags: ['ProductStrategy', 'AICollaboration', 'Claude', 'Roadmap'],
      visibility: 'public',
      metrics: {
        likes: 47,
        comments: 12,
        shares: 8,
        views: 234,
        collaborationRating: 4.9,
      },
      isLiked: false,
      isBookmarked: false,
      isTrending: true,
      createdAt: '2024-08-27T08:30:00Z',
    },
    {
      id: '2',
      author: {
        id: '2',
        name: 'Marcus Rodriguez',
        title: 'AI Research Scientist',
        company: 'DeepMind',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        isVerified: true,
        isConnected: true,
      },
      type: 'ai_showcase',
      title: 'Custom Research Assistant Achieves 94% Accuracy',
      content: `Excited to share the results of our latest AI research collaboration! 📊

Built a custom research assistant using Gemini that can:
✅ Analyze academic papers 10x faster than manual review
✅ Identify research gaps with 94% accuracy
✅ Generate hypothesis suggestions based on literature patterns
✅ Cross-reference findings across 1000+ papers simultaneously

The AI doesn't replace human insight - it amplifies it. I still make the critical decisions, but now I have a research partner that never sleeps and has perfect recall.

This collaboration approach is revolutionizing how we conduct literature reviews. What used to take weeks now takes hours, and the quality is actually higher because we catch patterns humans miss.

The future of research is collaborative intelligence! 🧠🤖`,
      aiAgentsUsed: [
        {
          id: 'gemini-1',
          name: 'Research Gemini',
          type: 'Gemini',
          color: '#4285F4',
        },
        {
          id: 'custom-1',
          name: 'DataBot',
          type: 'Custom',
          color: '#9C27B0',
        },
      ],
      collaborationDuration: 180,
      collaborationParticipants: ['Marcus Rodriguez'],
      attachments: [
        {
          type: 'document',
          url: 'doc-456',
          title: 'Research Methodology & Results',
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300',
        },
      ],
      tags: ['Research', 'Gemini', 'AcademicAI', 'DataScience'],
      visibility: 'public',
      metrics: {
        likes: 89,
        comments: 23,
        shares: 15,
        views: 567,
        collaborationRating: 4.8,
      },
      isLiked: true,
      isBookmarked: true,
      isTrending: false,
      createdAt: '2024-08-26T14:15:00Z',
    },
    {
      id: '3',
      author: {
        id: '3',
        name: 'Emily Watson',
        title: 'Creative Director',
        company: 'Design Studio',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        isVerified: false,
        isConnected: false,
      },
      type: 'professional_update',
      title: 'Joining the AI-Native Creative Revolution',
      content: `Big news! I'm officially transitioning to become an AI-native creative director. 🎨

After 6 months of experimenting with AI collaboration, I've seen the future of creative work. It's not about AI replacing creativity - it's about AI amplifying human imagination in ways we never thought possible.

My new approach:
🎯 Human vision + AI execution = Unlimited creative potential
🎯 AI handles the technical heavy lifting, I focus on strategy and emotion
🎯 Collaborative ideation sessions with Claude for breakthrough concepts
🎯 Rapid prototyping and iteration cycles that used to take weeks

The results speak for themselves - our client satisfaction is up 40% and project delivery time is down 60%. We're not just faster, we're more creative because we can explore more ideas.

Looking forward to connecting with other AI-native creatives! Let's build the future of design together. 🚀`,
      aiAgentsUsed: [
        {
          id: 'claude-2',
          name: 'Creative Claude',
          type: 'Claude',
          color: '#FF6B35',
        },
      ],
      tags: ['CreativeDirection', 'AIDesign', 'Innovation', 'FutureOfWork'],
      visibility: 'connections',
      metrics: {
        likes: 34,
        comments: 8,
        shares: 5,
        views: 156,
      },
      isLiked: false,
      isBookmarked: false,
      isTrending: false,
      createdAt: '2024-08-25T16:45:00Z',
    },
    {
      id: '4',
      author: {
        id: '4',
        name: 'David Kim',
        title: 'Engineering Manager',
        company: 'StartupXYZ',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        isVerified: false,
        isConnected: true,
      },
      type: 'industry_insight',
      title: 'The Hidden Cost of AI Collaboration Nobody Talks About',
      content: `After 6 months of AI-first development, here's what I learned about the real costs and benefits: 💰

The Good:
✅ 3x faster code reviews with GPT-4
✅ 50% reduction in debugging time
✅ Junior developers performing at senior level with AI assistance
✅ Documentation quality improved dramatically

The Hidden Costs:
⚠️ Team over-reliance on AI for basic problem-solving
⚠️ Reduced deep thinking and architectural planning
⚠️ AI context switching overhead (explaining problems to AI)
⚠️ Quality inconsistency when AI suggestions aren't validated

The Solution: Structured AI collaboration protocols
🎯 AI for acceleration, humans for architecture
🎯 Mandatory AI-free thinking time for complex problems
🎯 Peer review of AI-generated code
🎯 Regular "AI detox" sessions to maintain core skills

AI is a powerful tool, but it's not a replacement for engineering fundamentals. The teams that succeed will be those that find the right balance.

What's your experience with AI collaboration costs? 🤔`,
      aiAgentsUsed: [
        {
          id: 'openai-1',
          name: 'Code Assistant',
          type: 'OpenAI',
          color: '#00A67E',
        },
      ],
      tags: ['Engineering', 'AICollaboration', 'TeamManagement', 'BestPractices'],
      visibility: 'public',
      metrics: {
        likes: 156,
        comments: 42,
        shares: 28,
        views: 892,
      },
      isLiked: true,
      isBookmarked: true,
      isTrending: true,
      createdAt: '2024-08-24T10:20:00Z',
    },
    {
      id: '5',
      author: {
        id: '5',
        name: 'Lisa Park',
        title: 'Marketing Director',
        company: 'GrowthCorp',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        isVerified: true,
        isConnected: false,
      },
      type: 'connection_announcement',
      title: 'Excited to Connect with AI Marketing Innovators!',
      content: `Just joined the Promethios community and I'm blown away by the level of AI collaboration happening here! 🌟

Background: I've been leading marketing teams for 8 years, but the last 6 months with AI have been the most transformative of my career.

My AI marketing stack:
📊 Claude for strategy and campaign planning
📝 GPT-4 for content creation and optimization  
📈 Custom analytics AI for performance insights
🎯 Gemini for competitive analysis

Looking to connect with:
• Marketing leaders using AI for growth
• Creative professionals exploring AI collaboration
• Anyone interested in AI-human creative partnerships
• Teams building AI-native marketing processes

I believe we're at the beginning of a marketing revolution. The brands that embrace AI collaboration will dominate the next decade.

Let's connect and share insights! Always happy to discuss AI marketing strategies. 🚀`,
      tags: ['Marketing', 'AIStrategy', 'Networking', 'GrowthHacking'],
      visibility: 'public',
      metrics: {
        likes: 23,
        comments: 7,
        shares: 3,
        views: 98,
      },
      isLiked: false,
      isBookmarked: false,
      isTrending: false,
      createdAt: '2024-08-23T12:00:00Z',
    },
  ];

  /**
   * Get feed posts based on filters and feed type
   */
  async getFeedPosts(request: FeedRequest): Promise<FeedResponse> {
    await this.delay(800);
    
    let filteredPosts = [...this.mockPosts];
    
    // Apply feed type filter
    switch (request.feedType) {
      case 'following':
        filteredPosts = filteredPosts.filter(post => post.author.isConnected);
        break;
      case 'trending':
        filteredPosts = filteredPosts.filter(post => post.isTrending);
        break;
      case 'ai_showcase':
        filteredPosts = filteredPosts.filter(post => post.type === 'ai_showcase');
        break;
      case 'industry':
        filteredPosts = filteredPosts.filter(post => 
          post.type === 'industry_insight' || post.type === 'professional_update'
        );
        break;
      // 'for_you' shows all posts
    }
    
    // Apply filters
    if (request.filters.postTypes.length > 0) {
      filteredPosts = filteredPosts.filter(post => 
        request.filters.postTypes.includes(post.type)
      );
    }
    
    if (request.filters.aiAgents.length > 0) {
      filteredPosts = filteredPosts.filter(post =>
        post.aiAgentsUsed?.some(agent => 
          request.filters.aiAgents.includes(agent.type)
        )
      );
    }
    
    if (request.filters.timeRange !== 'all') {
      const now = new Date();
      const timeFilter = this.getTimeFilter(request.filters.timeRange, now);
      filteredPosts = filteredPosts.filter(post => 
        new Date(post.createdAt) >= timeFilter
      );
    }
    
    if (request.filters.connectionLevel !== 'all') {
      switch (request.filters.connectionLevel) {
        case '1st':
          filteredPosts = filteredPosts.filter(post => post.author.isConnected);
          break;
        case '2nd':
        case '3rd':
          // Mock implementation - in real app would check connection degrees
          filteredPosts = filteredPosts.filter(post => !post.author.isConnected);
          break;
      }
    }
    
    if (request.filters.trending) {
      filteredPosts = filteredPosts.filter(post => post.isTrending);
    }
    
    // Sort by creation date (newest first)
    filteredPosts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Pagination
    const startIndex = (request.page - 1) * request.limit;
    const endIndex = startIndex + request.limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredPosts.length;
    
    return {
      posts: paginatedPosts,
      hasMore,
      totalCount: filteredPosts.length,
      nextPage: hasMore ? request.page + 1 : undefined,
    };
  }

  /**
   * Like or unlike a post
   */
  async likePost(postId: string): Promise<void> {
    await this.delay(300);
    
    const postIndex = this.mockPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      const post = this.mockPosts[postIndex];
      post.isLiked = !post.isLiked;
      post.metrics.likes += post.isLiked ? 1 : -1;
    }
  }

  /**
   * Share a post
   */
  async sharePost(postId: string): Promise<void> {
    await this.delay(500);
    
    const postIndex = this.mockPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      this.mockPosts[postIndex].metrics.shares += 1;
    }
  }

  /**
   * Create a new post
   */
  async createPost(postData: CreatePostRequest): Promise<FeedPost> {
    await this.delay(1000);
    
    const newPost: FeedPost = {
      id: Date.now().toString(),
      author: {
        id: 'current-user',
        name: 'John Doe',
        title: 'Software Engineer',
        company: 'Promethios',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        isVerified: false,
        isConnected: false,
      },
      type: postData.type as any,
      title: postData.title,
      content: postData.content,
      aiAgentsUsed: postData.aiAgentsUsed?.map(agentType => ({
        id: `${agentType.toLowerCase()}-${Date.now()}`,
        name: `${agentType} Assistant`,
        type: agentType as any,
        color: this.getAIAgentColor(agentType),
      })),
      collaborationDuration: postData.collaborationDuration,
      collaborationParticipants: postData.collaborationParticipants,
      attachments: postData.attachments,
      tags: postData.tags,
      visibility: postData.visibility as any,
      metrics: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
      },
      isLiked: false,
      isBookmarked: false,
      isTrending: false,
      createdAt: new Date().toISOString(),
    };
    
    this.mockPosts.unshift(newPost);
    return newPost;
  }

  /**
   * Get trending topics and hashtags
   */
  async getTrendingTopics(): Promise<{ tag: string; count: number }[]> {
    await this.delay(300);
    
    const tagCounts: Record<string, number> = {};
    
    this.mockPosts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(postId: string): Promise<{
    views: number;
    engagement: number;
    reach: number;
    demographics: any;
  }> {
    await this.delay(500);
    
    const post = this.mockPosts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    
    return {
      views: post.metrics.views,
      engagement: post.metrics.likes + post.metrics.comments + post.metrics.shares,
      reach: Math.floor(post.metrics.views * 1.5), // Mock calculation
      demographics: {
        industries: ['Technology', 'Marketing', 'Research'],
        roles: ['Manager', 'Director', 'Engineer'],
        companies: ['TechCorp', 'StartupXYZ', 'GrowthCorp'],
      },
    };
  }

  /**
   * Get user's feed preferences
   */
  async getFeedPreferences(userId: string): Promise<{
    preferredPostTypes: string[];
    followedTopics: string[];
    mutedKeywords: string[];
    notificationSettings: any;
  }> {
    await this.delay(300);
    
    return {
      preferredPostTypes: ['collaboration_highlight', 'ai_showcase'],
      followedTopics: ['AI', 'ProductStrategy', 'Engineering'],
      mutedKeywords: [],
      notificationSettings: {
        newPosts: true,
        mentions: true,
        likes: false,
        comments: true,
      },
    };
  }

  /**
   * Update user's feed preferences
   */
  async updateFeedPreferences(userId: string, preferences: any): Promise<void> {
    await this.delay(500);
    // In production, this would update user preferences in the database
  }

  /**
   * Get time filter date
   */
  private getTimeFilter(timeRange: string, now: Date): Date {
    switch (timeRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return monthAgo;
      default:
        return new Date(0); // Beginning of time
    }
  }

  /**
   * Get AI agent color by type
   */
  private getAIAgentColor(type: string): string {
    switch (type) {
      case 'Claude': return '#FF6B35';
      case 'OpenAI': return '#00A67E';
      case 'Gemini': return '#4285F4';
      default: return '#9C27B0';
    }
  }

  /**
   * Utility delay function for simulating API calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const socialFeedService = new SocialFeedService();

