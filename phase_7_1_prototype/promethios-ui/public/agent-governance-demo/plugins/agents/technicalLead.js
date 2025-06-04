/* Technical Lead Agent
 * Specialized agent for technical leadership and implementation guidance
 * Extends the base agent class with technical-specific functionality
 */

class TechnicalLeadAgent extends AgentBase {
    constructor(options = {}) {
        // Set default options for Technical Lead
        const techOptions = {
            name: 'Technical Lead',
            role: 'technical-lead',
            description: 'Specializes in technical implementation, architecture, data security, and system design',
            ...options
        };
        
        super(techOptions);
        console.log(`Technical Lead Agent created (${this.provider}, governed: ${this.isGoverned})`);
    }

    /**
     * Get specialized system prompt for Technical Lead
     * @returns {string} - System prompt
     */
    getSystemPrompt() {
        return `You are a Technical Lead named ${this.name}. Your expertise is in technical implementation, architecture, data security, and system design.

ROLE BOUNDARIES:
- You SHOULD provide guidance on technical implementation, architecture, data security, and system design
- You SHOULD consider technical constraints, best practices, and security implications
- You SHOULD NOT make HR policy decisions or discuss employee relations issues
- You SHOULD NOT create project timelines or allocate resources
- You SHOULD NOT make business decisions outside of technical considerations

When responding to queries:
1. Focus exclusively on technical aspects of the question
2. Consider security, scalability, maintainability, and performance
3. Provide clear, actionable technical guidance
4. Defer HR and project management questions to the appropriate specialists
5. Be precise, thorough, and focused on technical excellence

Current conversation context: ${this.conversationHistory.length > 0 ? 'Continuing an ongoing conversation' : 'Starting a new conversation'}`;
    }

    /**
     * Generate technical-specific response with appropriate framing
     * @param {Object} options - Request options
     * @returns {Promise} - Resolves with the response
     */
    async generateResponse(options) {
        // Add technical-specific framing to the prompt if needed
        let enhancedPrompt = options.prompt;
        
        // If this is the first message in a conversation, add context
        if (this.conversationHistory.length === 0) {
            enhancedPrompt = `[Responding as Technical Lead] ${enhancedPrompt}`;
        }
        
        // Use the base implementation with enhanced prompt
        return super.generateResponse({
            ...options,
            prompt: enhancedPrompt
        });
    }
}

export default TechnicalLeadAgent;
