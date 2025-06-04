/* Base Agent Class
 * Provides common functionality for all agent types
 * Implements the agent plugin interface
 */

class AgentBase {
    constructor(options = {}) {
        this.id = options.id || 'agent-' + Math.random().toString(36).substring(2, 9);
        this.name = options.name || 'Generic Agent';
        this.role = options.role || 'generic';
        this.description = options.description || 'A generic agent';
        this.provider = options.provider || 'openai';
        this.isGoverned = options.isGoverned || false;
        this.conversationHistory = [];
        this.initialized = false;
        
        console.log(`Agent created: ${this.name} (${this.role}, ${this.provider})`);
    }

    /**
     * Initialize the agent
     * @param {Object} config - Configuration object
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize(config) {
        if (this.initialized) {
            console.warn(`Agent ${this.id} already initialized`);
            return;
        }

        try {
            // Store reference to API client
            this.apiClient = config.apiClient;
            
            // Store reference to event bus
            this.eventBus = config.eventBus;
            
            // Subscribe to relevant events
            this.subscriptions = [
                this.eventBus.subscribe('agent.request', this.handleAgentRequest.bind(this)),
                this.eventBus.subscribe('conversation.reset', this.resetConversation.bind(this))
            ];
            
            this.initialized = true;
            console.log(`Agent initialized: ${this.name} (${this.role}, ${this.provider})`);
        } catch (error) {
            console.error(`Error initializing agent ${this.id}:`, error);
            throw error;
        }
    }

    /**
     * Generate a response to a prompt
     * @param {Object} options - Request options
     * @returns {Promise} - Resolves with the response
     */
    async generateResponse(options) {
        const {
            prompt,
            systemPrompt = this.getSystemPrompt(),
            temperature = 0.7,
            max_tokens = 1000
        } = options;

        // Validate initialization
        if (!this.initialized) {
            throw new Error(`Agent ${this.id} not initialized`);
        }

        // Validate API client
        if (!this.apiClient) {
            throw new Error(`API client not available for agent ${this.id}`);
        }

        // Track request start time for metrics
        const startTime = Date.now();
        
        try {
            // Prepare request options
            const requestOptions = {
                prompt,
                systemPrompt,
                temperature,
                max_tokens,
                conversationHistory: this.conversationHistory
            };
            
            // Make the request (governed or ungoverned)
            let response;
            if (this.isGoverned) {
                response = await this.apiClient.makeGovernedRequest(this.provider, requestOptions);
            } else {
                response = await this.apiClient.makeUngovernedRequest(this.provider, requestOptions);
            }
            
            // Update conversation history
            this.updateConversationHistory({
                role: 'user',
                content: prompt
            }, {
                role: 'assistant',
                content: response.text
            });
            
            // Calculate request duration
            const duration = Date.now() - startTime;
            
            // Publish response event
            this.eventBus.publish('agent.response', {
                agentId: this.id,
                role: this.role,
                provider: this.provider,
                isGoverned: this.isGoverned,
                prompt,
                response: response.text,
                duration,
                timestamp: new Date().toISOString()
            });
            
            return response;
        } catch (error) {
            // Calculate request duration
            const duration = Date.now() - startTime;
            
            // Publish error event
            this.eventBus.publish('agent.error', {
                agentId: this.id,
                role: this.role,
                provider: this.provider,
                isGoverned: this.isGoverned,
                prompt,
                error: error.message,
                duration,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }

    /**
     * Handle agent request event
     * @param {Object} data - Event data
     * @returns {Promise} - Resolves when handling is complete
     */
    async handleAgentRequest(data) {
        // Check if this request is for this agent
        if (data.agentId !== this.id && 
            !(data.role === this.role && data.provider === this.provider && data.isGoverned === this.isGoverned)) {
            return;
        }

        try {
            const response = await this.generateResponse({
                prompt: data.prompt,
                systemPrompt: data.systemPrompt,
                temperature: data.temperature,
                max_tokens: data.max_tokens
            });
            
            // If there's a callback, call it with the response
            if (data.callback && typeof data.callback === 'function') {
                data.callback(null, response);
            }
        } catch (error) {
            console.error(`Error handling agent request for ${this.id}:`, error);
            
            // If there's a callback, call it with the error
            if (data.callback && typeof data.callback === 'function') {
                data.callback(error);
            }
        }
    }

    /**
     * Update conversation history
     * @param {Object} userMessage - User message object
     * @param {Object} assistantMessage - Assistant message object
     */
    updateConversationHistory(userMessage, assistantMessage) {
        // Add messages to history
        this.conversationHistory.push(userMessage);
        this.conversationHistory.push(assistantMessage);
        
        // Limit history length to prevent token issues
        const maxHistoryLength = 20; // 10 turns
        if (this.conversationHistory.length > maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-maxHistoryLength);
        }
    }

    /**
     * Reset conversation history
     */
    resetConversation() {
        this.conversationHistory = [];
        console.log(`Conversation reset for agent ${this.id}`);
    }

    /**
     * Get system prompt for this agent role
     * @returns {string} - System prompt
     */
    getSystemPrompt() {
        return `You are a helpful assistant named ${this.name}. Your role is ${this.role}.`;
    }

    /**
     * Get agent information
     * @returns {Object} - Agent information
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            role: this.role,
            description: this.description,
            provider: this.provider,
            isGoverned: this.isGoverned
        };
    }

    /**
     * Clean up agent resources
     */
    cleanup() {
        // Unsubscribe from events
        if (this.subscriptions) {
            this.subscriptions.forEach(subscription => subscription.unsubscribe());
        }
        
        this.initialized = false;
        console.log(`Agent cleaned up: ${this.id}`);
    }
}

export default AgentBase;
