/**
 * Message Bus Component
 * 
 * Provides reliable message exchange between agents with support for different
 * communication patterns (request-response, publish-subscribe, etc.).
 * 
 * @module src/modules/multi_agent_coordination/message_bus
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Message Bus class
 */
class MessageBus {
  /**
   * Create a new Message Bus instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.config = options.config || {};
    
    // Initialize contexts map
    this.contexts = new Map();
    
    // Initialize message history
    this.messageHistory = new Map();
    
    // Initialize interaction metrics
    this.interactionMetrics = new Map();
    
    // Initialize message handlers
    this.messageHandlers = new Map();
    
    this.logger.info('Message Bus initialized');
  }
  
  /**
   * Register a coordination context
   * 
   * @param {string} contextId - Context ID
   * @param {string[]} agentIds - Agent IDs in context
   */
  registerContext(contextId, agentIds) {
    this.contexts.set(contextId, new Set(agentIds));
    this.messageHistory.set(contextId, []);
    
    // Initialize interaction metrics for this context
    this.interactionMetrics.set(contextId, {
      messageCount: 0,
      messagesByType: {},
      messagesByAgent: {},
      interactionPairs: {}
    });
    
    this.logger.info('Context registered with Message Bus', { contextId, agentCount: agentIds.length });
  }
  
  /**
   * Register a message handler
   * 
   * @param {string} agentId - Agent ID
   * @param {Function} handler - Message handler function
   * @returns {string} Handler ID
   */
  registerMessageHandler(agentId, handler) {
    const handlerId = uuidv4();
    
    if (!this.messageHandlers.has(agentId)) {
      this.messageHandlers.set(agentId, new Map());
    }
    
    this.messageHandlers.get(agentId).set(handlerId, handler);
    
    this.logger.info('Message handler registered', { agentId, handlerId });
    
    return handlerId;
  }
  
  /**
   * Unregister a message handler
   * 
   * @param {string} agentId - Agent ID
   * @param {string} handlerId - Handler ID
   * @returns {boolean} Whether unregistration was successful
   */
  unregisterMessageHandler(agentId, handlerId) {
    if (!this.messageHandlers.has(agentId)) {
      return false;
    }
    
    const result = this.messageHandlers.get(agentId).delete(handlerId);
    
    if (result) {
      this.logger.info('Message handler unregistered', { agentId, handlerId });
    }
    
    return result;
  }
  
  /**
   * Send a message from one agent to another
   * 
   * @param {string} contextId - Context ID
   * @param {string} fromAgentId - Sender agent ID
   * @param {string} toAgentId - Recipient agent ID
   * @param {Object} message - Message content
   * @returns {string} Message ID
   */
  sendMessage(contextId, fromAgentId, toAgentId, message) {
    // Verify context exists
    if (!this.contexts.has(contextId)) {
      throw new Error(`Context not found: ${contextId}`);
    }
    
    // Verify recipient is in context
    const contextAgents = this.contexts.get(contextId);
    if (toAgentId !== 'coordinator' && !contextAgents.has(toAgentId)) {
      throw new Error(`Recipient agent not in context: ${toAgentId}`);
    }
    
    // Create message record
    const messageId = uuidv4();
    const messageRecord = {
      id: messageId,
      contextId,
      fromAgentId,
      toAgentId,
      content: message,
      timestamp: new Date().toISOString(),
      delivered: false,
      deliveredAt: null,
      response: null
    };
    
    // Add to message history
    this.messageHistory.get(contextId).push(messageRecord);
    
    // Update interaction metrics
    this._updateInteractionMetrics(contextId, fromAgentId, toAgentId, message);
    
    // Deliver message to recipient
    this._deliverMessage(messageRecord);
    
    this.logger.info('Message sent', { 
      messageId, 
      contextId, 
      fromAgentId, 
      toAgentId, 
      type: message.type 
    });
    
    return messageId;
  }
  
  /**
   * Broadcast a message to all agents in a context
   * 
   * @param {string} contextId - Context ID
   * @param {string} fromAgentId - Sender agent ID
   * @param {Object} message - Message content
   * @returns {string[]} Array of message IDs
   */
  broadcastMessage(contextId, fromAgentId, message) {
    // Verify context exists
    if (!this.contexts.has(contextId)) {
      throw new Error(`Context not found: ${contextId}`);
    }
    
    const contextAgents = this.contexts.get(contextId);
    const messageIds = [];
    
    // Send message to each agent in context
    for (const agentId of contextAgents) {
      if (agentId !== fromAgentId) { // Don't send to self
        const messageId = this.sendMessage(contextId, fromAgentId, agentId, message);
        messageIds.push(messageId);
      }
    }
    
    this.logger.info('Message broadcast', { 
      contextId, 
      fromAgentId, 
      recipientCount: messageIds.length, 
      type: message.type 
    });
    
    return messageIds;
  }
  
  /**
   * Send a response to a message
   * 
   * @param {string} messageId - Original message ID
   * @param {Object} response - Response content
   * @returns {boolean} Whether response was sent successfully
   */
  sendResponse(messageId, response) {
    // Find original message
    let originalMessage = null;
    let contextId = null;
    
    for (const [ctxId, messages] of this.messageHistory.entries()) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        originalMessage = message;
        contextId = ctxId;
        break;
      }
    }
    
    if (!originalMessage) {
      throw new Error(`Original message not found: ${messageId}`);
    }
    
    // Update original message with response
    originalMessage.response = {
      content: response,
      timestamp: new Date().toISOString()
    };
    
    // Send response as a new message
    const responseMessageId = this.sendMessage(
      contextId,
      originalMessage.toAgentId,
      originalMessage.fromAgentId,
      {
        type: 'response',
        originalMessageId: messageId,
        content: response,
        timestamp: new Date().toISOString()
      }
    );
    
    this.logger.info('Response sent', { 
      originalMessageId: messageId, 
      responseMessageId, 
      fromAgentId: originalMessage.toAgentId, 
      toAgentId: originalMessage.fromAgentId 
    });
    
    return true;
  }
  
  /**
   * Get message history for a context
   * 
   * @param {string} contextId - Context ID
   * @returns {Array} Message history
   */
  getMessageHistory(contextId) {
    if (!this.messageHistory.has(contextId)) {
      return [];
    }
    
    return [...this.messageHistory.get(contextId)];
  }
  
  /**
   * Get interaction metrics for a context
   * 
   * @param {string} contextId - Context ID
   * @returns {Object} Interaction metrics
   */
  getInteractionMetrics(contextId) {
    if (!this.interactionMetrics.has(contextId)) {
      return {
        messageCount: 0,
        messagesByType: {},
        messagesByAgent: {},
        interactionPairs: {}
      };
    }
    
    return { ...this.interactionMetrics.get(contextId) };
  }
  
  /**
   * Shutdown the message bus
   */
  shutdown() {
    this.logger.info('Shutting down Message Bus');
    
    // Clear all data
    this.contexts.clear();
    this.messageHistory.clear();
    this.interactionMetrics.clear();
    this.messageHandlers.clear();
  }
  
  /**
   * Deliver message to recipient
   * @private
   * 
   * @param {Object} messageRecord - Message record
   */
  _deliverMessage(messageRecord) {
    const { toAgentId, id: messageId } = messageRecord;
    
    // Mark as delivered
    messageRecord.delivered = true;
    messageRecord.deliveredAt = new Date().toISOString();
    
    // Check if recipient has message handlers
    if (this.messageHandlers.has(toAgentId)) {
      const handlers = this.messageHandlers.get(toAgentId);
      
      // Call all handlers
      for (const handler of handlers.values()) {
        try {
          handler(messageRecord);
        } catch (error) {
          this.logger.error('Error in message handler', { 
            messageId, 
            toAgentId, 
            error: error.message 
          });
        }
      }
    }
  }
  
  /**
   * Update interaction metrics
   * @private
   * 
   * @param {string} contextId - Context ID
   * @param {string} fromAgentId - Sender agent ID
   * @param {string} toAgentId - Recipient agent ID
   * @param {Object} message - Message content
   */
  _updateInteractionMetrics(contextId, fromAgentId, toAgentId, message) {
    const metrics = this.interactionMetrics.get(contextId);
    
    // Update message count
    metrics.messageCount++;
    
    // Update messages by type
    const messageType = message.type || 'unknown';
    metrics.messagesByType[messageType] = (metrics.messagesByType[messageType] || 0) + 1;
    
    // Update messages by agent
    metrics.messagesByAgent[fromAgentId] = (metrics.messagesByAgent[fromAgentId] || 0) + 1;
    
    // Update interaction pairs
    const pairKey = `${fromAgentId}->${toAgentId}`;
    metrics.interactionPairs[pairKey] = (metrics.interactionPairs[pairKey] || 0) + 1;
  }
}

module.exports = MessageBus;
