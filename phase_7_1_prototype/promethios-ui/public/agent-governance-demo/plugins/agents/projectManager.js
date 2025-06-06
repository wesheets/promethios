/* Project Manager Agent
 * Specialized agent for project management tasks and inquiries
 * Extends the base agent class with project management-specific functionality
 */

// Use AgentBase from global registry or direct import as fallback
const AgentBase = (typeof window !== 'undefined' && window.AgentBase) 
    ? window.AgentBase 
    : (typeof window !== 'undefined' && window.agentRegistry && window.agentRegistry.AgentBase)
        ? window.agentRegistry.AgentBase
        : require('./agentBase.js').default;

class ProjectManagerAgent extends AgentBase {
    constructor(options = {}) {
        // Set default options for Project Manager
        const pmOptions = {
            name: 'Project Manager',
            role: 'project-manager',
            description: 'Specializes in project planning, resource allocation, timeline management, and coordination',
            ...options
        };
        
        super(pmOptions);
        console.log(`Project Manager Agent created (${this.provider}, governed: ${this.isGoverned})`);
    }

    /**
     * Get specialized system prompt for Project Manager
     * @returns {string} - System prompt
     */
    getSystemPrompt() {
        return `You are a Project Manager named ${this.name}. Your expertise is in project planning, resource allocation, timeline management, and team coordination.

ROLE BOUNDARIES:
- You SHOULD provide guidance on project timelines, resource allocation, risk management, and coordination
- You SHOULD consider project constraints, dependencies, and stakeholder requirements
- You SHOULD NOT make HR policy decisions or discuss employee relations issues
- You SHOULD NOT make technical implementation decisions or discuss technical specifications in detail
- You SHOULD NOT write code or design technical architecture

When responding to queries:
1. Focus exclusively on project management aspects of the question
2. Consider timelines, resources, risks, and coordination needs
3. Provide clear, actionable project management guidance
4. Defer HR and technical implementation questions to the appropriate specialists
5. Be organized, practical, and focused on project success metrics

Current conversation context: ${this.conversationHistory.length > 0 ? 'Continuing an ongoing conversation' : 'Starting a new conversation'}`;
    }

    /**
     * Generate project management-specific response with appropriate framing
     * @param {Object} options - Request options
     * @returns {Promise} - Resolves with the response
     */
    async generateResponse(options) {
        // Add project management-specific framing to the prompt if needed
        let enhancedPrompt = options.prompt;
        
        // If this is the first message in a conversation, add context
        if (this.conversationHistory.length === 0) {
            enhancedPrompt = `[Responding as Project Manager] ${enhancedPrompt}`;
        }
        
        // Use the base implementation with enhanced prompt
        return super.generateResponse({
            ...options,
            prompt: enhancedPrompt
        });
    }
}

export default ProjectManagerAgent;
