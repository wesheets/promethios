/**
 * MultiHumanCollaborationService - Manages complex multi-human multi-AI collaborations
 * Handles participant management, AI agent orchestration, and collaborative governance
 */

export interface CollaborationParticipant {
  id: string;
  name: string;
  email: string;
  role: 'creator' | 'admin' | 'member' | 'observer';
  joinedAt: Date;
  lastActive: Date;
  isOnline: boolean;
  permissions: {
    canInviteHumans: boolean;
    canAddAIAgents: boolean;
    canRemoveParticipants: boolean;
    canChangePrivacy: boolean;
    canManageGovernance: boolean;
  };
  aiAgents: Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    addedAt: Date;
  }>;
}

export interface CollaborationSession {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'paused' | 'archived';
  participants: CollaborationParticipant[];
  totalAIAgents: number;
  activeAIAgents: number;
  governanceSettings: {
    requireApprovalForAI: boolean;
    allowPrivateSegments: boolean;
    enableBehavioralControls: boolean;
    consensusRequired: boolean;
  };
  collaborationMetrics: {
    totalMessages: number;
    humanMessages: number;
    aiMessages: number;
    privateSegments: number;
    governanceEvents: number;
    collaborationScore: number; // 0-100 based on engagement and effectiveness
  };
}

export interface AIAgentCollaboration {
  agentId: string;
  ownerId: string;
  permissions: {
    canObserve: boolean;
    canRespond: boolean;
    canInitiate: boolean;
    canCollaborate: boolean;
  };
  behavioralSettings: {
    responseStyle: 'analytical' | 'creative' | 'supportive' | 'critical';
    collaborationMode: 'active' | 'passive' | 'on-demand';
    interactionLevel: 'high' | 'medium' | 'low';
  };
  collaborationHistory: Array<{
    timestamp: Date;
    action: string;
    result: string;
    effectiveness: number; // 0-100
  }>;
}

export interface CollaborationInvitation {
  id: string;
  sessionId: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  inviteeName?: string;
  role: CollaborationParticipant['role'];
  permissions: CollaborationParticipant['permissions'];
  message?: string;
  historyAccess: {
    level: 'none' | 'recent' | 'full' | 'custom';
    messageCount?: number;
    timeRange?: string;
  };
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sentAt: Date;
}

export interface CollaborationEvent {
  id: string;
  sessionId: string;
  type: 'participant_joined' | 'participant_left' | 'ai_agent_added' | 'ai_agent_removed' | 
        'privacy_changed' | 'governance_updated' | 'collaboration_started' | 'collaboration_ended';
  participantId: string;
  participantName: string;
  details: any;
  timestamp: Date;
}

class MultiHumanCollaborationService {
  private static instance: MultiHumanCollaborationService;
  private collaborationSessions: Map<string, CollaborationSession> = new Map();
  private activeInvitations: Map<string, CollaborationInvitation> = new Map();
  private collaborationEvents: Map<string, CollaborationEvent[]> = new Map();
  private aiCollaborations: Map<string, AIAgentCollaboration[]> = new Map();

  private constructor() {
    console.log('🤝 MultiHumanCollaborationService initialized');
  }

  public static getInstance(): MultiHumanCollaborationService {
    if (!MultiHumanCollaborationService.instance) {
      MultiHumanCollaborationService.instance = new MultiHumanCollaborationService();
    }
    return MultiHumanCollaborationService.instance;
  }

  /**
   * Create a new multi-human collaboration session
   */
  async createCollaborationSession(
    name: string,
    creatorId: string,
    creatorName: string,
    description?: string
  ): Promise<CollaborationSession> {
    const sessionId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const creator: CollaborationParticipant = {
      id: creatorId,
      name: creatorName,
      email: `${creatorId}@example.com`, // In real implementation, get from user service
      role: 'creator',
      joinedAt: new Date(),
      lastActive: new Date(),
      isOnline: true,
      permissions: {
        canInviteHumans: true,
        canAddAIAgents: true,
        canRemoveParticipants: true,
        canChangePrivacy: true,
        canManageGovernance: true
      },
      aiAgents: []
    };

    const session: CollaborationSession = {
      id: sessionId,
      name,
      description,
      createdBy: creatorId,
      createdAt: new Date(),
      lastActivity: new Date(),
      status: 'active',
      participants: [creator],
      totalAIAgents: 0,
      activeAIAgents: 0,
      governanceSettings: {
        requireApprovalForAI: true,
        allowPrivateSegments: true,
        enableBehavioralControls: true,
        consensusRequired: false
      },
      collaborationMetrics: {
        totalMessages: 0,
        humanMessages: 0,
        aiMessages: 0,
        privateSegments: 0,
        governanceEvents: 0,
        collaborationScore: 100
      }
    };

    this.collaborationSessions.set(sessionId, session);
    this.collaborationEvents.set(sessionId, []);
    this.aiCollaborations.set(sessionId, []);

    await this.logCollaborationEvent(sessionId, {
      type: 'collaboration_started',
      participantId: creatorId,
      participantName: creatorName,
      details: { sessionName: name }
    });

    console.log('🤝 Created collaboration session:', sessionId, name);
    return session;
  }

  /**
   * Invite human to collaboration session
   */
  async inviteHumanToCollaboration(
    sessionId: string,
    inviterId: string,
    inviteeEmail: string,
    inviteeName: string,
    role: CollaborationParticipant['role'] = 'member',
    customMessage?: string,
    historyAccess: CollaborationInvitation['historyAccess'] = { level: 'recent', messageCount: 50 }
  ): Promise<CollaborationInvitation> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error('Collaboration session not found');
    }

    const inviter = session.participants.find(p => p.id === inviterId);
    if (!inviter || !inviter.permissions.canInviteHumans) {
      throw new Error('Insufficient permissions to invite humans');
    }

    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const permissions: CollaborationParticipant['permissions'] = {
      canInviteHumans: role === 'admin' || role === 'creator',
      canAddAIAgents: role !== 'observer',
      canRemoveParticipants: role === 'admin' || role === 'creator',
      canChangePrivacy: role === 'admin' || role === 'creator',
      canManageGovernance: role === 'creator'
    };

    const invitation: CollaborationInvitation = {
      id: invitationId,
      sessionId,
      inviterId,
      inviterName: inviter.name,
      inviteeEmail,
      inviteeName,
      role,
      permissions,
      message: customMessage,
      historyAccess,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
      sentAt: new Date()
    };

    this.activeInvitations.set(invitationId, invitation);

    console.log('📧 Sent collaboration invitation:', invitationId, inviteeEmail);
    return invitation;
  }

  /**
   * Accept collaboration invitation
   */
  async acceptCollaborationInvitation(
    invitationId: string,
    acceptingUserId: string
  ): Promise<CollaborationSession> {
    const invitation = this.activeInvitations.get(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      throw new Error('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      throw new Error('Invitation has expired');
    }

    const session = this.collaborationSessions.get(invitation.sessionId);
    if (!session) {
      throw new Error('Collaboration session not found');
    }

    // Add participant to session
    const newParticipant: CollaborationParticipant = {
      id: acceptingUserId,
      name: invitation.inviteeName || 'New Participant',
      email: invitation.inviteeEmail,
      role: invitation.role,
      joinedAt: new Date(),
      lastActive: new Date(),
      isOnline: true,
      permissions: invitation.permissions,
      aiAgents: []
    };

    session.participants.push(newParticipant);
    session.lastActivity = new Date();
    invitation.status = 'accepted';

    await this.logCollaborationEvent(invitation.sessionId, {
      type: 'participant_joined',
      participantId: acceptingUserId,
      participantName: newParticipant.name,
      details: { role: invitation.role }
    });

    console.log('✅ Accepted collaboration invitation:', acceptingUserId, 'joined', invitation.sessionId);
    return session;
  }

  /**
   * Add AI agent to collaboration
   */
  async addAIAgentToCollaboration(
    sessionId: string,
    ownerId: string,
    agentId: string,
    agentName: string,
    agentType: string,
    behavioralSettings?: AIAgentCollaboration['behavioralSettings']
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error('Collaboration session not found');
    }

    const owner = session.participants.find(p => p.id === ownerId);
    if (!owner || !owner.permissions.canAddAIAgents) {
      throw new Error('Insufficient permissions to add AI agents');
    }

    // Check if approval is required
    if (session.governanceSettings.requireApprovalForAI && owner.role !== 'creator') {
      // In real implementation, this would trigger approval workflow
      console.log('🔒 AI agent addition requires approval from creator');
      return;
    }

    // Add agent to owner's agent list
    const newAgent = {
      id: agentId,
      name: agentName,
      type: agentType,
      isActive: true,
      addedAt: new Date()
    };

    owner.aiAgents.push(newAgent);
    session.totalAIAgents++;
    session.activeAIAgents++;

    // Create AI collaboration record
    const aiCollaboration: AIAgentCollaboration = {
      agentId,
      ownerId,
      permissions: {
        canObserve: true,
        canRespond: true,
        canInitiate: false,
        canCollaborate: true
      },
      behavioralSettings: behavioralSettings || {
        responseStyle: 'analytical',
        collaborationMode: 'active',
        interactionLevel: 'medium'
      },
      collaborationHistory: []
    };

    const sessionCollaborations = this.aiCollaborations.get(sessionId) || [];
    sessionCollaborations.push(aiCollaboration);
    this.aiCollaborations.set(sessionId, sessionCollaborations);

    await this.logCollaborationEvent(sessionId, {
      type: 'ai_agent_added',
      participantId: ownerId,
      participantName: owner.name,
      details: { agentName, agentType }
    });

    console.log('🤖 Added AI agent to collaboration:', agentName, 'by', owner.name);
  }

  /**
   * Remove participant from collaboration
   */
  async removeParticipantFromCollaboration(
    sessionId: string,
    removerId: string,
    participantId: string
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error('Collaboration session not found');
    }

    const remover = session.participants.find(p => p.id === removerId);
    if (!remover || !remover.permissions.canRemoveParticipants) {
      throw new Error('Insufficient permissions to remove participants');
    }

    const participantIndex = session.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) {
      throw new Error('Participant not found');
    }

    const participant = session.participants[participantIndex];
    
    // Remove participant's AI agents
    const removedAgentCount = participant.aiAgents.length;
    session.totalAIAgents -= removedAgentCount;
    session.activeAIAgents -= participant.aiAgents.filter(a => a.isActive).length;

    // Remove AI collaborations for this participant
    const sessionCollaborations = this.aiCollaborations.get(sessionId) || [];
    const filteredCollaborations = sessionCollaborations.filter(c => c.ownerId !== participantId);
    this.aiCollaborations.set(sessionId, filteredCollaborations);

    // Remove participant
    session.participants.splice(participantIndex, 1);

    await this.logCollaborationEvent(sessionId, {
      type: 'participant_left',
      participantId,
      participantName: participant.name,
      details: { removedBy: remover.name, aiAgentsRemoved: removedAgentCount }
    });

    console.log('👋 Removed participant from collaboration:', participant.name, 'by', remover.name);
  }

  /**
   * Update collaboration governance settings
   */
  async updateGovernanceSettings(
    sessionId: string,
    updaterId: string,
    settings: Partial<CollaborationSession['governanceSettings']>
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error('Collaboration session not found');
    }

    const updater = session.participants.find(p => p.id === updaterId);
    if (!updater || !updater.permissions.canManageGovernance) {
      throw new Error('Insufficient permissions to update governance');
    }

    session.governanceSettings = { ...session.governanceSettings, ...settings };

    await this.logCollaborationEvent(sessionId, {
      type: 'governance_updated',
      participantId: updaterId,
      participantName: updater.name,
      details: { changes: settings }
    });

    console.log('⚖️ Updated governance settings:', sessionId, settings);
  }

  /**
   * Get collaboration session
   */
  getCollaborationSession(sessionId: string): CollaborationSession | null {
    return this.collaborationSessions.get(sessionId) || null;
  }

  /**
   * Get user's collaboration sessions
   */
  getUserCollaborationSessions(userId: string): CollaborationSession[] {
    return Array.from(this.collaborationSessions.values())
      .filter(session => session.participants.some(p => p.id === userId))
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Get collaboration events
   */
  getCollaborationEvents(sessionId: string): CollaborationEvent[] {
    return this.collaborationEvents.get(sessionId) || [];
  }

  /**
   * Get AI collaborations for session
   */
  getAICollaborations(sessionId: string): AIAgentCollaboration[] {
    return this.aiCollaborations.get(sessionId) || [];
  }

  /**
   * Update collaboration metrics
   */
  async updateCollaborationMetrics(
    sessionId: string,
    metrics: Partial<CollaborationSession['collaborationMetrics']>
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) return;

    session.collaborationMetrics = { ...session.collaborationMetrics, ...metrics };
    session.lastActivity = new Date();

    // Calculate collaboration score based on engagement
    const { totalMessages, humanMessages, aiMessages, governanceEvents } = session.collaborationMetrics;
    const participantCount = session.participants.length;
    const aiAgentCount = session.activeAIAgents;
    
    // Simple scoring algorithm (can be enhanced)
    let score = 50; // Base score
    score += Math.min(totalMessages / 10, 30); // Message activity
    score += Math.min(participantCount * 5, 20); // Human participation
    score += Math.min(aiAgentCount * 3, 15); // AI participation
    score += Math.min(governanceEvents * 2, 10); // Governance activity
    
    session.collaborationMetrics.collaborationScore = Math.min(Math.round(score), 100);
  }

  /**
   * Log collaboration event
   */
  private async logCollaborationEvent(
    sessionId: string,
    eventData: Omit<CollaborationEvent, 'id' | 'sessionId' | 'timestamp'>
  ): Promise<void> {
    const event: CollaborationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      timestamp: new Date(),
      ...eventData
    };

    const events = this.collaborationEvents.get(sessionId) || [];
    events.push(event);
    this.collaborationEvents.set(sessionId, events);

    // Update governance events count
    await this.updateCollaborationMetrics(sessionId, {
      governanceEvents: events.length
    });
  }

  /**
   * Get collaboration statistics
   */
  getCollaborationStatistics(): {
    totalSessions: number;
    activeSessions: number;
    totalParticipants: number;
    totalAIAgents: number;
    averageCollaborationScore: number;
  } {
    const sessions = Array.from(this.collaborationSessions.values());
    const activeSessions = sessions.filter(s => s.status === 'active');
    
    const totalParticipants = sessions.reduce((sum, s) => sum + s.participants.length, 0);
    const totalAIAgents = sessions.reduce((sum, s) => sum + s.totalAIAgents, 0);
    const averageScore = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + s.collaborationMetrics.collaborationScore, 0) / sessions.length
      : 0;

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      totalParticipants,
      totalAIAgents,
      averageCollaborationScore: Math.round(averageScore)
    };
  }
}

export default MultiHumanCollaborationService;

