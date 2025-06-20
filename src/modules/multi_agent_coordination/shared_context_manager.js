/**
 * Shared Context Manager Component
 * 
 * Manages shared conversation context for multi-agent collaboration,
 * enabling agents to see and build upon each other's contributions.
 * 
 * @module src/modules/multi_agent_coordination/shared_context_manager
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Shared Context Manager class
 */
class SharedContextManager {
  /**
   * Create a new Shared Context Manager instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.config = options.config || {};
    
    // Initialize context storage
    this.contexts = new Map();
    
    // Initialize conversation histories
    this.conversations = new Map();
    
    // Initialize agent awareness maps
    this.agentAwareness = new Map();
    
    this.logger.info('Shared Context Manager initialized');
  }
  
  /**
   * Create a shared context for a group of agents
   * 
   * @param {string} contextId - Unique context identifier
   * @param {string[]} agentIds - IDs of agents in the context
   * @param {Object} options - Context options
   * @returns {Object} Created shared context
   */
  createSharedContext(contextId, agentIds, options = {}) {
    const sharedContext = {
      id: contextId,
      agentIds: [...agentIds],
      collaborationModel: options.collaborationModel || 'shared_context',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'active',
      metadata: options.metadata || {}
    };
    
    this.contexts.set(contextId, sharedContext);
    
    // Initialize conversation history for this context
    this.conversations.set(contextId, {
      messages: [],
      participants: new Set(agentIds),
      messageCount: 0,
      lastActivity: new Date().toISOString()
    });
    
    // Initialize agent awareness for each agent
    agentIds.forEach(agentId => {
      this._initializeAgentAwareness(contextId, agentId, agentIds);
    });
    
    this.logger.info('Created shared context', { 
      contextId, 
      agentCount: agentIds.length,
      collaborationModel: sharedContext.collaborationModel
    });
    
    return sharedContext;
  }
  
  /**
   * Add a message to the shared context
   * 
   * @param {string} contextId - Context identifier
   * @param {string} fromAgentId - ID of the agent sending the message
   * @param {Object} message - Message content
   * @returns {Object} Added message with metadata
   */
  addMessage(contextId, fromAgentId, message) {
    if (!this.contexts.has(contextId)) {
      throw new Error(`Shared context not found: ${contextId}`);
    }
    
    const conversation = this.conversations.get(contextId);
    const messageId = uuidv4();
    
    const messageWithMetadata = {
      id: messageId,
      contextId,
      fromAgentId,
      content: message,
      timestamp: new Date().toISOString(),
      messageIndex: conversation.messageCount,
      type: message.type || 'agent_response',
      governanceData: message.governanceData || null
    };
    
    // Add message to conversation history
    conversation.messages.push(messageWithMetadata);
    conversation.messageCount++;
    conversation.lastActivity = messageWithMetadata.timestamp;
    
    // Update context last updated time
    const context = this.contexts.get(contextId);
    context.lastUpdated = messageWithMetadata.timestamp;
    
    // Update agent awareness for all agents in context
    this._updateAgentAwareness(contextId, fromAgentId, messageWithMetadata);
    
    this.logger.info('Added message to shared context', {
      contextId,
      fromAgentId,
      messageId,
      messageType: messageWithMetadata.type
    });
    
    return messageWithMetadata;
  }
  
  /**
   * Get the full conversation history for a context
   * 
   * @param {string} contextId - Context identifier
   * @param {Object} options - Query options
   * @returns {Object} Conversation history
   */
  getConversationHistory(contextId, options = {}) {
    if (!this.contexts.has(contextId)) {
      throw new Error(`Shared context not found: ${contextId}`);
    }
    
    const conversation = this.conversations.get(contextId);
    const context = this.contexts.get(contextId);
    
    let messages = [...conversation.messages];
    
    // Apply filters if specified
    if (options.fromAgentId) {
      messages = messages.filter(msg => msg.fromAgentId === options.fromAgentId);
    }
    
    if (options.messageType) {
      messages = messages.filter(msg => msg.type === options.messageType);
    }
    
    if (options.since) {
      const sinceDate = new Date(options.since);
      messages = messages.filter(msg => new Date(msg.timestamp) > sinceDate);
    }
    
    // Apply limit if specified
    if (options.limit) {
      messages = messages.slice(-options.limit);
    }
    
    return {
      contextId,
      collaborationModel: context.collaborationModel,
      messages,
      totalMessages: conversation.messageCount,
      participants: Array.from(conversation.participants),
      lastActivity: conversation.lastActivity,
      filteredCount: messages.length
    };
  }
  
  /**
   * Get agent-specific view of the shared context
   * 
   * @param {string} contextId - Context identifier
   * @param {string} agentId - ID of the requesting agent
   * @returns {Object} Agent-specific context view
   */
  getAgentContextView(contextId, agentId) {
    if (!this.contexts.has(contextId)) {
      throw new Error(`Shared context not found: ${contextId}`);
    }
    
    const context = this.contexts.get(contextId);
    const conversation = this.conversations.get(contextId);
    const agentAwarenessKey = `${contextId}:${agentId}`;
    const awareness = this.agentAwareness.get(agentAwarenessKey);
    
    if (!awareness) {
      throw new Error(`Agent ${agentId} not found in context ${contextId}`);
    }
    
    // Get messages visible to this agent based on collaboration model
    let visibleMessages = this._getVisibleMessages(contextId, agentId);
    
    // Get information about other agents in the context
    const otherAgents = context.agentIds
      .filter(id => id !== agentId)
      .map(id => ({
        id,
        lastSeen: awareness.lastSeenAgents[id] || null,
        messageCount: conversation.messages.filter(msg => msg.fromAgentId === id).length,
        isActive: this._isAgentActive(contextId, id)
      }));
    
    return {
      contextId,
      agentId,
      collaborationModel: context.collaborationModel,
      messages: visibleMessages,
      otherAgents,
      agentAwareness: {
        totalMessages: conversation.messageCount,
        lastActivity: conversation.lastActivity,
        myMessageCount: conversation.messages.filter(msg => msg.fromAgentId === agentId).length,
        unreadCount: this._getUnreadCount(contextId, agentId)
      },
      contextMetadata: context.metadata
    };
  }
  
  /**
   * Update agent's last seen timestamp
   * 
   * @param {string} contextId - Context identifier
   * @param {string} agentId - ID of the agent
   */
  updateAgentLastSeen(contextId, agentId) {
    const agentAwarenessKey = `${contextId}:${agentId}`;
    const awareness = this.agentAwareness.get(agentAwarenessKey);
    
    if (awareness) {
      awareness.lastSeen = new Date().toISOString();
      awareness.lastReadMessageIndex = this.conversations.get(contextId).messageCount - 1;
    }
  }
  
  /**
   * Get collaboration metrics for a context
   * 
   * @param {string} contextId - Context identifier
   * @returns {Object} Collaboration metrics
   */
  getCollaborationMetrics(contextId) {
    if (!this.contexts.has(contextId)) {
      throw new Error(`Shared context not found: ${contextId}`);
    }
    
    const context = this.contexts.get(contextId);
    const conversation = this.conversations.get(contextId);
    
    // Calculate agent participation metrics
    const agentMetrics = context.agentIds.map(agentId => {
      const agentMessages = conversation.messages.filter(msg => msg.fromAgentId === agentId);
      const agentAwarenessKey = `${contextId}:${agentId}`;
      const awareness = this.agentAwareness.get(agentAwarenessKey);
      
      return {
        agentId,
        messageCount: agentMessages.length,
        participationRate: agentMessages.length / conversation.messageCount,
        lastActivity: agentMessages.length > 0 ? 
          agentMessages[agentMessages.length - 1].timestamp : null,
        isActive: this._isAgentActive(contextId, agentId),
        responsiveness: this._calculateResponsiveness(contextId, agentId)
      };
    });
    
    // Calculate overall collaboration metrics
    const activeAgents = agentMetrics.filter(a => a.isActive).length;
    const averageParticipation = agentMetrics.reduce((sum, a) => sum + a.participationRate, 0) / agentMetrics.length;
    const messageFrequency = this._calculateMessageFrequency(contextId);
    
    return {
      contextId,
      collaborationModel: context.collaborationModel,
      totalMessages: conversation.messageCount,
      totalAgents: context.agentIds.length,
      activeAgents,
      averageParticipation,
      messageFrequency,
      agentMetrics,
      contextDuration: new Date() - new Date(context.createdAt),
      lastActivity: conversation.lastActivity
    };
  }
  
  /**
   * Shutdown the shared context manager
   */
  shutdown() {
    this.logger.info('Shutting down Shared Context Manager');
    
    // Clear all data
    this.contexts.clear();
    this.conversations.clear();
    this.agentAwareness.clear();
  }
  
  /**
   * Initialize agent awareness for a specific agent in a context
   * @private
   * 
   * @param {string} contextId - Context identifier
   * @param {string} agentId - Agent identifier
   * @param {string[]} allAgentIds - All agent IDs in the context
   */
  _initializeAgentAwareness(contextId, agentId, allAgentIds) {
    const agentAwarenessKey = `${contextId}:${agentId}`;
    
    const awareness = {
      contextId,
      agentId,
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      lastReadMessageIndex: -1,
      lastSeenAgents: {},
      knownAgents: allAgentIds.filter(id => id !== agentId)
    };
    
    // Initialize last seen for other agents
    allAgentIds.forEach(otherId => {
      if (otherId !== agentId) {
        awareness.lastSeenAgents[otherId] = null;
      }
    });
    
    this.agentAwareness.set(agentAwarenessKey, awareness);
  }
  
  /**
   * Update agent awareness when a new message is added
   * @private
   * 
   * @param {string} contextId - Context identifier
   * @param {string} fromAgentId - ID of the agent who sent the message
   * @param {Object} message - The message that was added
   */
  _updateAgentAwareness(contextId, fromAgentId, message) {
    const context = this.contexts.get(contextId);
    
    // Update awareness for all agents in the context
    context.agentIds.forEach(agentId => {
      const agentAwarenessKey = `${contextId}:${agentId}`;
      const awareness = this.agentAwareness.get(agentAwarenessKey);
      
      if (awareness) {
        // Update last seen for the agent who sent the message
        if (agentId !== fromAgentId) {
          awareness.lastSeenAgents[fromAgentId] = message.timestamp;
        }
      }
    });
  }
  
  /**
   * Get messages visible to a specific agent based on collaboration model
   * @private
   * 
   * @param {string} contextId - Context identifier
   * @param {string} agentId - Agent identifier
   * @returns {Array} Visible messages
   */
  _getVisibleMessages(contextId, agentId) {
    const context = this.contexts.get(contextId);
    const conversation = this.conversations.get(contextId);
    
    // For shared context model, all agents see all messages
    if (context.collaborationModel === 'shared_context') {
      return [...conversation.messages];
    }
    
    // For other models, implement specific visibility rules
    // This is where different collaboration models would have different logic
    return [...conversation.messages];
  }
  
  /**
   * Check if an agent is currently active in a context
   * @private
   * 
   * @param {string} contextId - Context identifier
   * @param {string} agentId - Agent identifier
   * @returns {boolean} Whether the agent is active
   */
  _isAgentActive(contextId, agentId) {
    const agentAwarenessKey = `${contextId}:${agentId}`;
    const awareness = this.agentAwareness.get(agentAwarenessKey);
    
    if (!awareness) return false;
    
    // Consider agent active if they've been seen in the last 5 minutes
    const lastSeenTime = new Date(awareness.lastSeen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return lastSeenTime > fiveMinutesAgo;
  }
  
  /**
   * Get unread message count for an agent
   * @private
   * 
   * @param {string} contextId - Context identifier
   * @param {string} agentId - Agent identifier
   * @returns {number} Unread message count
   */
  _getUnreadCount(contextId, agentId) {
    const agentAwarenessKey = `${contextId}:${agentId}`;
    const awareness = this.agentAwareness.get(agentAwarenessKey);
    const conversation = this.conversations.get(contextId);
    
    if (!awareness) return 0;
    
    return Math.max(0, conversation.messageCount - 1 - awareness.lastReadMessageIndex);
  }
  
  /**
   * Calculate responsiveness score for an agent
   * @private
   * 
   * @param {string} contextId - Context identifier
   * @param {string} agentId - Agent identifier
   * @returns {number} Responsiveness score (0-1)
   */
  _calculateResponsiveness(contextId, agentId) {
    const conversation = this.conversations.get(contextId);
    const agentMessages = conversation.messages.filter(msg => msg.fromAgentId === agentId);
    
    if (agentMessages.length === 0) return 0;
    
    // Simple responsiveness calculation based on message frequency
    const contextDuration = new Date() - new Date(this.contexts.get(contextId).createdAt);
    const averageResponseTime = contextDuration / agentMessages.length;
    
    // Normalize to 0-1 scale (lower response time = higher responsiveness)
    return Math.max(0, Math.min(1, 1 - (averageResponseTime / (60 * 60 * 1000)))); // 1 hour max
  }
  
  /**
   * Calculate message frequency for a context
   * @private
   * 
   * @param {string} contextId - Context identifier
   * @returns {number} Messages per hour
   */
  _calculateMessageFrequency(contextId) {
    const context = this.contexts.get(contextId);
    const conversation = this.conversations.get(contextId);
    
    const contextDuration = new Date() - new Date(context.createdAt);
    const hours = contextDuration / (60 * 60 * 1000);
    
    return hours > 0 ? conversation.messageCount / hours : 0;
  }
}

module.exports = SharedContextManager;

