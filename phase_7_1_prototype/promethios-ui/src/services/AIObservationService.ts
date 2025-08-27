/**
 * AIObservationService - Manages AI agent observation and privacy controls
 * Handles "AI step out" functionality and selective AI participation
 */

export interface AIObservationState {
  conversationId: string;
  isPrivateMode: boolean; // When true, AI agents cannot observe
  allowedAgents: string[]; // AI agents allowed to observe (when not in private mode)
  blockedAgents: string[]; // AI agents explicitly blocked from observing
  privateSegmentStart?: Date; // When private mode started
  lastToggleBy: string; // User who last toggled privacy
  lastToggleAt: Date;
}

export interface PrivacyToggleEvent {
  conversationId: string;
  userId: string;
  userName: string;
  action: 'enable_private' | 'disable_private' | 'allow_agent' | 'block_agent';
  targetAgentId?: string;
  targetAgentName?: string;
  timestamp: Date;
  reason?: string;
}

export interface AIObservationNotification {
  id: string;
  type: 'privacy_enabled' | 'privacy_disabled' | 'agent_blocked' | 'agent_allowed';
  conversationId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
}

class AIObservationService {
  private static instance: AIObservationService;
  private observationStates: Map<string, AIObservationState> = new Map();
  private privacyEventHistory: Map<string, PrivacyToggleEvent[]> = new Map();
  private observationListeners: Set<(state: AIObservationState) => void> = new Set();
  private notificationListeners: Set<(notification: AIObservationNotification) => void> = new Set();

  private constructor() {
    console.log('🔒 AIObservationService initialized');
  }

  public static getInstance(): AIObservationService {
    if (!AIObservationService.instance) {
      AIObservationService.instance = new AIObservationService();
    }
    return AIObservationService.instance;
  }

  /**
   * Enable private mode - AI agents cannot observe
   */
  async enablePrivateMode(
    conversationId: string,
    userId: string,
    userName: string,
    reason?: string
  ): Promise<void> {
    const currentState = this.getObservationState(conversationId);
    
    if (currentState.isPrivateMode) {
      console.log('🔒 Private mode already enabled for conversation:', conversationId);
      return;
    }

    // Update observation state
    const newState: AIObservationState = {
      ...currentState,
      isPrivateMode: true,
      privateSegmentStart: new Date(),
      lastToggleBy: userId,
      lastToggleAt: new Date()
    };

    this.observationStates.set(conversationId, newState);

    // Record privacy event
    const event: PrivacyToggleEvent = {
      conversationId,
      userId,
      userName,
      action: 'enable_private',
      timestamp: new Date(),
      reason
    };

    this.recordPrivacyEvent(conversationId, event);

    // Create notification
    const notification: AIObservationNotification = {
      id: `privacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'privacy_enabled',
      conversationId,
      userId,
      userName,
      message: `${userName} enabled private mode${reason ? `: ${reason}` : ''}`,
      timestamp: new Date()
    };

    this.notifyObservationListeners(newState);
    this.notifyNotificationListeners(notification);

    console.log('🔒 Enabled private mode for conversation:', conversationId, 'by:', userName);
  }

  /**
   * Disable private mode - AI agents can observe again
   */
  async disablePrivateMode(
    conversationId: string,
    userId: string,
    userName: string,
    reason?: string
  ): Promise<void> {
    const currentState = this.getObservationState(conversationId);
    
    if (!currentState.isPrivateMode) {
      console.log('🔓 Private mode already disabled for conversation:', conversationId);
      return;
    }

    // Update observation state
    const newState: AIObservationState = {
      ...currentState,
      isPrivateMode: false,
      privateSegmentStart: undefined,
      lastToggleBy: userId,
      lastToggleAt: new Date()
    };

    this.observationStates.set(conversationId, newState);

    // Record privacy event
    const event: PrivacyToggleEvent = {
      conversationId,
      userId,
      userName,
      action: 'disable_private',
      timestamp: new Date(),
      reason
    };

    this.recordPrivacyEvent(conversationId, event);

    // Create notification
    const notification: AIObservationNotification = {
      id: `privacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'privacy_disabled',
      conversationId,
      userId,
      userName,
      message: `${userName} disabled private mode${reason ? `: ${reason}` : ''}`,
      timestamp: new Date()
    };

    this.notifyObservationListeners(newState);
    this.notifyNotificationListeners(notification);

    console.log('🔓 Disabled private mode for conversation:', conversationId, 'by:', userName);
  }

  /**
   * Allow specific AI agent to observe (even in selective mode)
   */
  async allowAgentObservation(
    conversationId: string,
    agentId: string,
    agentName: string,
    userId: string,
    userName: string,
    reason?: string
  ): Promise<void> {
    const currentState = this.getObservationState(conversationId);
    
    // Remove from blocked list if present
    const blockedAgents = currentState.blockedAgents.filter(id => id !== agentId);
    
    // Add to allowed list if not present
    const allowedAgents = currentState.allowedAgents.includes(agentId) 
      ? currentState.allowedAgents 
      : [...currentState.allowedAgents, agentId];

    const newState: AIObservationState = {
      ...currentState,
      allowedAgents,
      blockedAgents,
      lastToggleBy: userId,
      lastToggleAt: new Date()
    };

    this.observationStates.set(conversationId, newState);

    // Record privacy event
    const event: PrivacyToggleEvent = {
      conversationId,
      userId,
      userName,
      action: 'allow_agent',
      targetAgentId: agentId,
      targetAgentName: agentName,
      timestamp: new Date(),
      reason
    };

    this.recordPrivacyEvent(conversationId, event);

    // Create notification
    const notification: AIObservationNotification = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'agent_allowed',
      conversationId,
      userId,
      userName,
      message: `${userName} allowed ${agentName} to observe${reason ? `: ${reason}` : ''}`,
      timestamp: new Date(),
      agentId,
      agentName
    };

    this.notifyObservationListeners(newState);
    this.notifyNotificationListeners(notification);

    console.log('✅ Allowed agent observation:', agentName, 'in conversation:', conversationId);
  }

  /**
   * Block specific AI agent from observing
   */
  async blockAgentObservation(
    conversationId: string,
    agentId: string,
    agentName: string,
    userId: string,
    userName: string,
    reason?: string
  ): Promise<void> {
    const currentState = this.getObservationState(conversationId);
    
    // Remove from allowed list if present
    const allowedAgents = currentState.allowedAgents.filter(id => id !== agentId);
    
    // Add to blocked list if not present
    const blockedAgents = currentState.blockedAgents.includes(agentId) 
      ? currentState.blockedAgents 
      : [...currentState.blockedAgents, agentId];

    const newState: AIObservationState = {
      ...currentState,
      allowedAgents,
      blockedAgents,
      lastToggleBy: userId,
      lastToggleAt: new Date()
    };

    this.observationStates.set(conversationId, newState);

    // Record privacy event
    const event: PrivacyToggleEvent = {
      conversationId,
      userId,
      userName,
      action: 'block_agent',
      targetAgentId: agentId,
      targetAgentName: agentName,
      timestamp: new Date(),
      reason
    };

    this.recordPrivacyEvent(conversationId, event);

    // Create notification
    const notification: AIObservationNotification = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'agent_blocked',
      conversationId,
      userId,
      userName,
      message: `${userName} blocked ${agentName} from observing${reason ? `: ${reason}` : ''}`,
      timestamp: new Date(),
      agentId,
      agentName
    };

    this.notifyObservationListeners(newState);
    this.notifyNotificationListeners(notification);

    console.log('🚫 Blocked agent observation:', agentName, 'in conversation:', conversationId);
  }

  /**
   * Check if AI agent can observe conversation
   */
  canAgentObserve(conversationId: string, agentId: string): boolean {
    const state = this.getObservationState(conversationId);
    
    // If in private mode, no agents can observe
    if (state.isPrivateMode) {
      return false;
    }
    
    // If agent is explicitly blocked, cannot observe
    if (state.blockedAgents.includes(agentId)) {
      return false;
    }
    
    // If there are allowed agents specified, agent must be in the list
    if (state.allowedAgents.length > 0) {
      return state.allowedAgents.includes(agentId);
    }
    
    // Default: agent can observe if not blocked and not in private mode
    return true;
  }

  /**
   * Get observation state for conversation
   */
  getObservationState(conversationId: string): AIObservationState {
    return this.observationStates.get(conversationId) || {
      conversationId,
      isPrivateMode: false,
      allowedAgents: [],
      blockedAgents: [],
      lastToggleBy: 'system',
      lastToggleAt: new Date()
    };
  }

  /**
   * Get privacy event history for conversation
   */
  getPrivacyEventHistory(conversationId: string): PrivacyToggleEvent[] {
    return this.privacyEventHistory.get(conversationId) || [];
  }

  /**
   * Subscribe to observation state changes
   */
  subscribeToObservationChanges(callback: (state: AIObservationState) => void): () => void {
    this.observationListeners.add(callback);
    
    return () => {
      this.observationListeners.delete(callback);
    };
  }

  /**
   * Subscribe to privacy notifications
   */
  subscribeToNotifications(callback: (notification: AIObservationNotification) => void): () => void {
    this.notificationListeners.add(callback);
    
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  /**
   * Get privacy summary for conversation
   */
  getPrivacySummary(conversationId: string): {
    isPrivate: boolean;
    allowedAgentCount: number;
    blockedAgentCount: number;
    privateModeDuration?: number; // in minutes
    lastToggleBy: string;
    lastToggleAt: Date;
  } {
    const state = this.getObservationState(conversationId);
    
    let privateModeDuration: number | undefined;
    if (state.isPrivateMode && state.privateSegmentStart) {
      privateModeDuration = Math.floor(
        (new Date().getTime() - state.privateSegmentStart.getTime()) / 60000
      );
    }

    return {
      isPrivate: state.isPrivateMode,
      allowedAgentCount: state.allowedAgents.length,
      blockedAgentCount: state.blockedAgents.length,
      privateModeDuration,
      lastToggleBy: state.lastToggleBy,
      lastToggleAt: state.lastToggleAt
    };
  }

  /**
   * Private helper methods
   */
  private recordPrivacyEvent(conversationId: string, event: PrivacyToggleEvent): void {
    const history = this.privacyEventHistory.get(conversationId) || [];
    history.push(event);
    this.privacyEventHistory.set(conversationId, history);
  }

  private notifyObservationListeners(state: AIObservationState): void {
    this.observationListeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in observation listener:', error);
      }
    });
  }

  private notifyNotificationListeners(notification: AIObservationNotification): void {
    this.notificationListeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Bulk privacy operations
   */
  async setConversationPrivacyMode(
    conversationId: string,
    isPrivate: boolean,
    userId: string,
    userName: string,
    reason?: string
  ): Promise<void> {
    if (isPrivate) {
      await this.enablePrivateMode(conversationId, userId, userName, reason);
    } else {
      await this.disablePrivateMode(conversationId, userId, userName, reason);
    }
  }

  /**
   * Reset all privacy settings for conversation
   */
  resetPrivacySettings(conversationId: string, userId: string, userName: string): void {
    const defaultState: AIObservationState = {
      conversationId,
      isPrivateMode: false,
      allowedAgents: [],
      blockedAgents: [],
      lastToggleBy: userId,
      lastToggleAt: new Date()
    };

    this.observationStates.set(conversationId, defaultState);
    this.notifyObservationListeners(defaultState);

    console.log('🔄 Reset privacy settings for conversation:', conversationId);
  }
}

export default AIObservationService;

