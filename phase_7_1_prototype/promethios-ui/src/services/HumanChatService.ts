/**
 * HumanChatService - Team messaging and human-to-human collaboration
 * 
 * Provides real-time messaging capabilities between team members,
 * separate from AI agent conversations.
 */

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  role: string;
}

export interface HumanMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'chat_reference';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    chatReference?: string;
  };
}

export interface TeamConversation {
  id: string;
  name: string;
  participants: string[];
  messages: HumanMessage[];
  lastActivity: Date;
  isGroup: boolean;
  createdBy: string;
}

class HumanChatService {
  private static instance: HumanChatService;
  private conversations: Map<string, TeamConversation> = new Map();
  private teamMembers: Map<string, TeamMember> = new Map();
  private currentUserId: string | null = null;

  static getInstance(): HumanChatService {
    if (!HumanChatService.instance) {
      HumanChatService.instance = new HumanChatService();
    }
    return HumanChatService.instance;
  }

  constructor() {
    // Service is ready to use
  }

  /**
   * Initialize the service with current user
   */
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    // Load conversations
    this.loadConversations();
    
    // Load team members (now directly from ConnectionService)
    await this.loadTeamMembers();
    
    console.log('🔄 [HumanChat] Initialized with user:', userId);
  }

  /**
   * Get all team members
   */
  getTeamMembers(): TeamMember[] {
    const members = Array.from(this.teamMembers.values());
    console.log('🔍 [HumanChat] getTeamMembers called - returning', members.length, 'members:', members);
    return members;
  }

  /**
   * Get online team members
   */
  getOnlineMembers(): TeamMember[] {
    return this.getTeamMembers().filter(member => member.status === 'online');
  }

  /**
   * Start a conversation with a team member
   */
  async startConversation(participantId: string): Promise<TeamConversation> {
    if (!this.currentUserId) {
      throw new Error('User not initialized');
    }

    // Check if conversation already exists
    const existingConversation = Array.from(this.conversations.values())
      .find(conv => 
        !conv.isGroup && 
        conv.participants.includes(this.currentUserId!) && 
        conv.participants.includes(participantId)
      );

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const conversation: TeamConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.getConversationName([this.currentUserId, participantId]),
      participants: [this.currentUserId, participantId],
      messages: [],
      lastActivity: new Date(),
      isGroup: false,
      createdBy: this.currentUserId
    };

    this.conversations.set(conversation.id, conversation);
    this.saveConversations();

    console.log('🤝 [HumanChat] Started conversation:', conversation.id);
    return conversation;
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string, 
    content: string, 
    type: 'text' | 'file' | 'image' | 'chat_reference' = 'text',
    metadata?: any
  ): Promise<HumanMessage> {
    if (!this.currentUserId) {
      throw new Error('User not initialized');
    }

    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const currentUser = this.teamMembers.get(this.currentUserId);
    const message: HumanMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: this.currentUserId,
      senderName: currentUser?.name || 'Unknown User',
      content,
      timestamp: new Date(),
      type,
      metadata
    };

    conversation.messages.push(message);
    conversation.lastActivity = new Date();

    this.saveConversations();

    console.log('💬 [HumanChat] Message sent:', message.id);
    return message;
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): TeamConversation | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Get all conversations for current user
   */
  getUserConversations(): TeamConversation[] {
    if (!this.currentUserId) return [];

    return Array.from(this.conversations.values())
      .filter(conv => conv.participants.includes(this.currentUserId!))
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Share a chat reference with team members
   */
  async shareChatReference(
    conversationId: string, 
    chatReference: string, 
    description?: string
  ): Promise<HumanMessage> {
    const content = description 
      ? `Shared chat: ${description}\n\nReference: ${chatReference}`
      : `Shared chat reference: ${chatReference}`;

    return this.sendMessage(conversationId, content, 'chat_reference', {
      chatReference
    });
  }

  /**
   * Update user status
   */
  updateUserStatus(status: 'online' | 'away' | 'offline'): void {
    if (!this.currentUserId) return;

    const user = this.teamMembers.get(this.currentUserId);
    if (user) {
      user.status = status;
      user.lastSeen = new Date();
      this.saveTeamMembers();
    }
  }

  /**
   * Load team members from real connections
   */
  private async loadTeamMembers(): Promise<void> {
    if (!this.currentUserId) {
      console.log('👥 [HumanChat] No current user, using demo members');
      this.initializeDemoTeamMembers();
      return;
    }

    try {
      console.log('👥 [HumanChat] Loading real connections for user:', this.currentUserId);
      
      // Import ConnectionService directly
      const { ConnectionService } = await import('./ConnectionService');
      const connectionService = ConnectionService.getInstance();
      
      // Get real user connections
      const connections = await connectionService.getUserConnections(this.currentUserId);
      console.log('👥 [HumanChat] Found', connections.length, 'real connections');
      
      if (connections.length > 0) {
        // Clear existing team members
        this.teamMembers.clear();
        
        // Convert connections to team members
        connections.forEach(connection => {
          // Determine which user is the connected user (not the current user)
          const isCurrentUserUserId1 = connection.userId1 === this.currentUserId;
          const connectedUserId = isCurrentUserUserId1 ? connection.userId2 : connection.userId1;
          const connectedUserName = isCurrentUserUserId1 ? connection.user2Name : connection.user1Name;
          const connectedUserAvatar = isCurrentUserUserId1 ? connection.user2Avatar : connection.user1Avatar;
          
          const teamMember: TeamMember = {
            id: connectedUserId,
            name: connectedUserName || 'Connected User',
            email: `${connectedUserId}@promethios.com`, // Placeholder email
            avatar: connectedUserAvatar,
            status: 'online', // Default to online, could be enhanced with real status
            lastSeen: new Date(),
            role: 'Team Member' // Default role, could be enhanced
          };
          
          this.teamMembers.set(connectedUserId, teamMember);
        });
        
        console.log('✅ [HumanChat] Loaded', this.teamMembers.size, 'real team members from connections');
        this.saveTeamMembers();
      } else {
        console.log('👥 [HumanChat] No real connections found, using demo members');
        this.initializeDemoTeamMembers();
      }
    } catch (error) {
      console.error('❌ [HumanChat] Error loading real connections:', error);
      console.log('👥 [HumanChat] Falling back to demo members');
      this.initializeDemoTeamMembers();
    }
  }

  /**
   * Save team members to storage
   */
  private saveTeamMembers(): void {
    try {
      const members = Array.from(this.teamMembers.values());
      localStorage.setItem('promethios_team_members', JSON.stringify(members));
    } catch (error) {
      console.error('Error saving team members:', error);
    }
  }

  /**
   * Load conversations from storage
   */
  private loadConversations(): void {
    try {
      const stored = localStorage.getItem('promethios_team_conversations');
      if (stored) {
        const conversations = JSON.parse(stored);
        conversations.forEach((conv: any) => {
          this.conversations.set(conv.id, {
            ...conv,
            lastActivity: new Date(conv.lastActivity),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          });
        });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  /**
   * Save conversations to storage
   */
  private saveConversations(): void {
    try {
      const conversations = Array.from(this.conversations.values());
      localStorage.setItem('promethios_team_conversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }

  /**
   * Initialize demo team members
   */
  private initializeDemoTeamMembers(): void {
    const demoMembers: TeamMember[] = [
      {
        id: 'user_1',
        name: 'Alice Johnson',
        email: 'alice@company.com',
        status: 'online',
        lastSeen: new Date(),
        role: 'Product Manager'
      },
      {
        id: 'user_2',
        name: 'Bob Smith',
        email: 'bob@company.com',
        status: 'away',
        lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        role: 'Developer'
      },
      {
        id: 'user_3',
        name: 'Carol Davis',
        email: 'carol@company.com',
        status: 'online',
        lastSeen: new Date(),
        role: 'Designer'
      }
    ];

    demoMembers.forEach(member => {
      this.teamMembers.set(member.id, member);
    });

    this.saveTeamMembers();
  }

  /**
   * Get conversation name for participants
   */
  private getConversationName(participantIds: string[]): string {
    const names = participantIds
      .map(id => this.teamMembers.get(id)?.name || 'Unknown')
      .filter(name => name !== 'Unknown');
    
    return names.length > 2 
      ? `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`
      : names.join(' & ');
  }
}

export default HumanChatService;

