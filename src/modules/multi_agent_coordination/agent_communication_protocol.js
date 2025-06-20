/**
 * Agent Communication Protocol Component
 * 
 * Handles agent-to-agent communication, message routing, and protocol enforcement
 * for multi-agent coordination scenarios.
 * 
 * @module src/modules/multi_agent_coordination/agent_communication_protocol
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Agent Communication Protocol class
 */
class AgentCommunicationProtocol {
  /**
   * Create a new Agent Communication Protocol instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.sharedContextManager - Shared Context Manager instance
   * @param {Object} options.governanceExchangeProtocol - Governance Exchange Protocol instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.sharedContextManager = options.sharedContextManager;
    this.governanceExchangeProtocol = options.governanceExchangeProtocol;
    this.config = options.config || {};
    
    // Initialize communication channels
    this.channels = new Map();
    
    // Initialize agent communication states
    this.agentStates = new Map();
    
    // Initialize message queues for each agent
    this.messageQueues = new Map();
    
    // Initialize communication metrics
    this.metrics = new Map();
    
    this.logger.info('Agent Communication Protocol initialized');
  }
  
  /**
   * Register an agent for communication
   * 
   * @param {string} agentId - Agent identifier
   * @param {Object} agentInfo - Agent information
   * @returns {Object} Registration result
   */
  registerAgent(agentId, agentInfo) {
    const agentState = {
      id: agentId,
      name: agentInfo.name || agentId,
      capabilities: agentInfo.capabilities || [],
      status: 'idle',
      lastActivity: new Date().toISOString(),
      currentTask: null,
      communicationPreferences: agentInfo.communicationPreferences || {},
      hasGovernanceIdentity: !!agentInfo.governanceIdentity
    };
    
    this.agentStates.set(agentId, agentState);
    
    // Initialize message queue for this agent
    this.messageQueues.set(agentId, {
      incoming: [],
      outgoing: [],
      processed: []
    });
    
    // Initialize metrics for this agent
    this.metrics.set(agentId, {
      messagesSent: 0,
      messagesReceived: 0,
      averageResponseTime: 0,
      collaborationScore: 0,
      governanceCompliance: agentState.hasGovernanceIdentity ? 1.0 : 0.0
    });
    
    this.logger.info('Registered agent for communication', { 
      agentId, 
      hasGovernance: agentState.hasGovernanceIdentity 
    });
    
    return {
      success: true,
      agentId,
      communicationId: uuidv4(),
      supportedProtocols: this._getSupportedProtocols(agentState)
    };
  }
  
  /**
   * Send a message from one agent to another or to a group
   * 
   * @param {string} fromAgentId - Sender agent ID
   * @param {string|string[]} toAgentIds - Recipient agent ID(s)
   * @param {Object} message - Message content
   * @param {string} contextId - Context identifier
   * @returns {Object} Send result
   */
  sendMessage(fromAgentId, toAgentIds, message, contextId) {
    if (!this.agentStates.has(fromAgentId)) {
      throw new Error(`Sender agent not registered: ${fromAgentId}`);
    }
    
    const recipients = Array.isArray(toAgentIds) ? toAgentIds : [toAgentIds];
    const messageId = uuidv4();
    
    // Verify all recipients are registered
    const unregisteredRecipients = recipients.filter(id => !this.agentStates.has(id));
    if (unregisteredRecipients.length > 0) {
      throw new Error(`Recipient agents not registered: ${unregisteredRecipients.join(', ')}`);
    }
    
    // Create message with metadata
    const messageWithMetadata = {
      id: messageId,
      fromAgentId,
      toAgentIds: recipients,
      content: message,
      contextId,
      timestamp: new Date().toISOString(),
      type: message.type || 'agent_communication',
      priority: message.priority || 'normal',
      requiresResponse: message.requiresResponse || false,
      governanceData: null
    };
    
    // Apply governance if available
    if (this.governanceExchangeProtocol) {
      const governanceResult = this._applyGovernanceToMessage(fromAgentId, messageWithMetadata);
      messageWithMetadata.governanceData = governanceResult;
      
      if (!governanceResult.approved) {
        this.logger.warn('Message blocked by governance', {
          messageId,
          fromAgentId,
          reason: governanceResult.reason
        });
        
        return {
          success: false,
          messageId,
          error: 'Message blocked by governance',
          reason: governanceResult.reason
        };
      }
    }
    
    // Add to shared context if context manager is available
    if (this.sharedContextManager && contextId) {
      this.sharedContextManager.addMessage(contextId, fromAgentId, messageWithMetadata);
    }
    
    // Route message to recipients
    const deliveryResults = recipients.map(recipientId => {
      return this._deliverMessage(recipientId, messageWithMetadata);
    });
    
    // Update sender metrics
    const senderMetrics = this.metrics.get(fromAgentId);
    senderMetrics.messagesSent++;
    
    // Update sender state
    const senderState = this.agentStates.get(fromAgentId);
    senderState.lastActivity = messageWithMetadata.timestamp;
    
    this.logger.info('Message sent', {
      messageId,
      fromAgentId,
      recipientCount: recipients.length,
      contextId
    });
    
    return {
      success: true,
      messageId,
      deliveryResults,
      timestamp: messageWithMetadata.timestamp
    };
  }
  
  /**
   * Get pending messages for an agent
   * 
   * @param {string} agentId - Agent identifier
   * @returns {Array} Pending messages
   */
  getPendingMessages(agentId) {
    if (!this.agentStates.has(agentId)) {
      throw new Error(`Agent not registered: ${agentId}`);
    }
    
    const messageQueue = this.messageQueues.get(agentId);
    const pendingMessages = [...messageQueue.incoming];
    
    // Mark messages as processed
    messageQueue.processed.push(...pendingMessages);
    messageQueue.incoming = [];
    
    // Update agent state
    const agentState = this.agentStates.get(agentId);
    agentState.lastActivity = new Date().toISOString();
    
    // Update metrics
    const agentMetrics = this.metrics.get(agentId);
    agentMetrics.messagesReceived += pendingMessages.length;
    
    return pendingMessages;
  }
  
  /**
   * Update agent status
   * 
   * @param {string} agentId - Agent identifier
   * @param {string} status - New status
   * @param {Object} additionalData - Additional status data
   */
  updateAgentStatus(agentId, status, additionalData = {}) {
    if (!this.agentStates.has(agentId)) {
      throw new Error(`Agent not registered: ${agentId}`);
    }
    
    const agentState = this.agentStates.get(agentId);
    const previousStatus = agentState.status;
    
    agentState.status = status;
    agentState.lastActivity = new Date().toISOString();
    
    // Update additional data
    Object.assign(agentState, additionalData);
    
    // Notify other agents in shared contexts about status change
    this._notifyStatusChange(agentId, previousStatus, status);
    
    this.logger.info('Agent status updated', {
      agentId,
      previousStatus,
      newStatus: status
    });
  }
  
  /**
   * Get communication metrics for an agent or context
   * 
   * @param {string} agentId - Agent identifier
   * @param {string} contextId - Optional context identifier
   * @returns {Object} Communication metrics
   */
  getCommunicationMetrics(agentId, contextId = null) {
    if (!this.agentStates.has(agentId)) {
      throw new Error(`Agent not registered: ${agentId}`);
    }
    
    const agentMetrics = this.metrics.get(agentId);
    const agentState = this.agentStates.get(agentId);
    
    const metrics = {
      agentId,
      ...agentMetrics,
      currentStatus: agentState.status,
      lastActivity: agentState.lastActivity,
      hasGovernanceIdentity: agentState.hasGovernanceIdentity
    };
    
    // Add context-specific metrics if requested
    if (contextId && this.sharedContextManager) {
      const contextMetrics = this.sharedContextManager.getCollaborationMetrics(contextId);
      const agentContextMetrics = contextMetrics.agentMetrics.find(m => m.agentId === agentId);
      
      if (agentContextMetrics) {
        metrics.contextSpecific = agentContextMetrics;
      }
    }
    
    return metrics;
  }
  
  /**
   * Get all active agents and their statuses
   * 
   * @returns {Array} Active agents
   */
  getActiveAgents() {
    const activeAgents = [];
    
    for (const [agentId, agentState] of this.agentStates.entries()) {
      const metrics = this.metrics.get(agentId);
      
      activeAgents.push({
        id: agentId,
        name: agentState.name,
        status: agentState.status,
        lastActivity: agentState.lastActivity,
        capabilities: agentState.capabilities,
        hasGovernanceIdentity: agentState.hasGovernanceIdentity,
        metrics: {
          messagesSent: metrics.messagesSent,
          messagesReceived: metrics.messagesReceived,
          collaborationScore: metrics.collaborationScore,
          governanceCompliance: metrics.governanceCompliance
        }
      });
    }
    
    return activeAgents.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  }
  
  /**
   * Shutdown the communication protocol
   */
  shutdown() {
    this.logger.info('Shutting down Agent Communication Protocol');
    
    // Clear all data
    this.channels.clear();
    this.agentStates.clear();
    this.messageQueues.clear();
    this.metrics.clear();
  }
  
  /**
   * Get supported communication protocols for an agent
   * @private
   * 
   * @param {Object} agentState - Agent state
   * @returns {Array} Supported protocols
   */
  _getSupportedProtocols(agentState) {
    const protocols = ['direct_message', 'broadcast', 'shared_context'];
    
    if (agentState.hasGovernanceIdentity) {
      protocols.push('governed_communication', 'trust_verified');
    }
    
    return protocols;
  }
  
  /**
   * Apply governance to a message
   * @private
   * 
   * @param {string} fromAgentId - Sender agent ID
   * @param {Object} message - Message to govern
   * @returns {Object} Governance result
   */
  _applyGovernanceToMessage(fromAgentId, message) {
    if (!this.governanceExchangeProtocol) {
      return { approved: true, reason: 'No governance protocol available' };
    }
    
    // Check if sender has governance identity
    const senderState = this.agentStates.get(fromAgentId);
    if (!senderState.hasGovernanceIdentity) {
      return {
        approved: true,
        reason: 'Sender has no governance identity',
        trustScore: 0.5,
        complianceLevel: 'basic'
      };
    }
    
    // Apply governance checks
    const governanceResult = this.governanceExchangeProtocol.verifyMessageCompliance(
      fromAgentId,
      message
    );
    
    return {
      approved: governanceResult.compliant,
      reason: governanceResult.reason || 'Governance verification completed',
      trustScore: governanceResult.trustScore || 0.8,
      complianceLevel: governanceResult.complianceLevel || 'standard',
      verificationId: governanceResult.verificationId
    };
  }
  
  /**
   * Deliver a message to a recipient agent
   * @private
   * 
   * @param {string} recipientId - Recipient agent ID
   * @param {Object} message - Message to deliver
   * @returns {Object} Delivery result
   */
  _deliverMessage(recipientId, message) {
    const messageQueue = this.messageQueues.get(recipientId);
    const recipientState = this.agentStates.get(recipientId);
    
    // Add message to recipient's incoming queue
    messageQueue.incoming.push({
      ...message,
      deliveredAt: new Date().toISOString()
    });
    
    // Update recipient metrics
    const recipientMetrics = this.metrics.get(recipientId);
    
    // Calculate collaboration score based on governance alignment
    if (message.governanceData && recipientState.hasGovernanceIdentity) {
      recipientMetrics.collaborationScore = Math.min(1.0, 
        recipientMetrics.collaborationScore + 0.1
      );
    }
    
    return {
      recipientId,
      delivered: true,
      timestamp: new Date().toISOString(),
      queuePosition: messageQueue.incoming.length
    };
  }
  
  /**
   * Notify other agents about status changes
   * @private
   * 
   * @param {string} agentId - Agent whose status changed
   * @param {string} previousStatus - Previous status
   * @param {string} newStatus - New status
   */
  _notifyStatusChange(agentId, previousStatus, newStatus) {
    // In a real implementation, this would notify other agents
    // For now, we'll just log the status change
    this.logger.info('Agent status change notification', {
      agentId,
      previousStatus,
      newStatus,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = AgentCommunicationProtocol;

