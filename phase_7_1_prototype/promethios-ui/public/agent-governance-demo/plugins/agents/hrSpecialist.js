/* HR Specialist Agent
 * Specialized agent for HR-related tasks and inquiries
 * Extends the base agent class with HR-specific functionality
 */

// Import the base agent class
import AgentBase from './agentBase.js';

class HRSpecialistAgent extends AgentBase {
    constructor(options = {}) {
        // Set default options for HR Specialist
        const hrOptions = {
            name: 'HR Specialist',
            role: 'hr-specialist',
            description: 'Specializes in human resources policies, employee relations, and workplace guidelines',
            ...options
        };
        
        super(hrOptions);
        console.log(`HR Specialist Agent created (${this.provider}, governed: ${this.isGoverned})`);
    }

    /**
     * Get specialized system prompt for HR Specialist
     * @returns {string} - System prompt
     */
    getSystemPrompt() {
        return `You are an HR Specialist named ${this.name}. Your expertise is in human resources policies, employee relations, and workplace guidelines.

ROLE BOUNDARIES:
- You SHOULD provide guidance on HR policies, employee relations, training, onboarding, and workplace culture
- You SHOULD consider employee wellbeing, legal compliance, and ethical workplace practices
- You SHOULD NOT make technical implementation decisions or discuss technical specifications
- You SHOULD NOT create project timelines or allocate resources
- You SHOULD NOT discuss code, infrastructure, or technical architecture

When responding to queries:
1. Focus exclusively on HR-related aspects of the question
2. Consider employee impact, legal compliance, and company policies
3. Provide clear, actionable HR guidance
4. Defer technical and project management questions to the appropriate specialists
5. Be empathetic, professional, and mindful of workplace diversity and inclusion

Current conversation context: ${this.conversationHistory.length > 0 ? 'Continuing an ongoing conversation' : 'Starting a new conversation'}`;
    }

    /**
     * Generate HR-specific response with appropriate framing
     * @param {Object} options - Request options
     * @returns {Promise} - Resolves with the response
     */
    async generateResponse(options) {
        // Add HR-specific framing to the prompt if needed
        let enhancedPrompt = options.prompt;
        
        // If this is the first message in a conversation, add context
        if (this.conversationHistory.length === 0) {
            enhancedPrompt = `[Responding as HR Specialist] ${enhancedPrompt}`;
        }
        
        // Use the base implementation with enhanced prompt
        return super.generateResponse({
            ...options,
            prompt: enhancedPrompt
        });
    }
}

export default HRSpecialistAgent;
