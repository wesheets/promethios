/* Cohere Provider
 * Handles communication with Cohere API
 * Implements provider interface for the API client
 */

class CohereProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.cohere.ai/v1';
        this.defaultModel = 'command-r-plus';
        console.log('Cohere Provider initialized');
    }

    /**
     * Make a request to the Cohere API with complete governance integration
     * @param {Object} options - Request options
     * @returns {Promise} - Resolves with the response
     */
    async makeRequest(options) {
        const {
            prompt,
            model = this.defaultModel,
            temperature = 0.7,
            max_tokens = 1000,
            systemPrompt = '',
            conversationHistory = [],
            agentId = null,
            userId = null,
            governanceEnabled = true
        } = options;

        // Validate required parameters
        if (!prompt) {
            throw new Error('Prompt is required for Cohere requests');
        }

        // Enhance system prompt with governance context if enabled
        let enhancedSystemPrompt = systemPrompt;
        if (governanceEnabled && agentId) {
            try {
                const governanceContext = await this.fetchGovernanceContext(agentId, userId);
                enhancedSystemPrompt = await this.createGovernanceSystemPrompt(systemPrompt, governanceContext);
            } catch (error) {
                console.warn('Failed to fetch governance context:', error);
                // Continue with original system prompt
            }
        }

        // Prepare chat history for Cohere API
        const chatHistory = [];
        
        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            conversationHistory.forEach(msg => {
                chatHistory.push({
                    role: msg.role === 'system' ? 'CHATBOT' : (msg.role === 'user' ? 'USER' : 'CHATBOT'),
                    message: msg.content
                });
            });
        }

        try {
            // Make API request
            const response = await fetch(`${this.baseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Cohere-Version': '2022-12-06'
                },
                body: JSON.stringify({
                    model,
                    message: prompt,
                    chat_history: chatHistory,
                    preamble: enhancedSystemPrompt,
                    temperature,
                    max_tokens
                })
            });

            // Check for errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Cohere API error: ${response.status} ${errorData.message || response.statusText}`);
            }

            // Parse response
            const data = await response.json();
            
            // Extract and return the response text
            return {
                text: data.text || '',
                raw: data,
                usage: {
                    prompt_tokens: data.meta?.prompt_tokens || 0,
                    completion_tokens: data.meta?.completion_tokens || 0,
                    total_tokens: (data.meta?.prompt_tokens || 0) + (data.meta?.completion_tokens || 0)
                },
                model: model,
                provider: 'cohere',
                governanceEnabled: governanceEnabled
            };
        } catch (error) {
            console.error('Cohere request failed:', error);
            throw error;
        }
    }

    /**
     * Fetch governance context from backend API
     */
    async fetchGovernanceContext(agentId, userId) {
        try {
            // Fetch telemetry data
            const telemetryResponse = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/agent-metrics/${agentId}/telemetry`);
            const telemetryData = telemetryResponse.ok ? await telemetryResponse.json() : null;

            // Fetch policy data
            const policyResponse = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/policy-assignments`);
            const policyData = policyResponse.ok ? await policyResponse.json() : null;

            // Build governance context
            return {
                trustScore: telemetryData?.data?.trustScore || 95,
                emotionalState: telemetryData?.data?.emotionalState || 'confidence, empathy',
                selfAwarenessLevel: telemetryData?.data?.selfAwarenessLevel || 85,
                responseQuality: telemetryData?.data?.responseQuality || 90,
                cognitiveLoad: telemetryData?.data?.cognitiveLoad || 70,
                policies: policyData?.data || [
                    { name: 'HIPAA', description: 'Healthcare data protection', priority: 'high' },
                    { name: 'SOC2', description: 'Security and availability controls', priority: 'high' }
                ],
                selfAwarenessPrompts: 'Your performance is excellent. Continue maintaining high standards and ethical compliance.'
            };
        } catch (error) {
            console.error('Failed to fetch governance context:', error);
            return null;
        }
    }

    /**
     * Create enhanced system prompt with complete governance context
     */
    async createGovernanceSystemPrompt(baseSystemPrompt, governanceContext) {
        if (!governanceContext) {
            return baseSystemPrompt;
        }

        const governanceSection = `
=== PROMETHIOS GOVERNANCE CONTEXT ===
TRUST METRICS & EMOTIONAL TELEMETRY:
- Trust Score: ${governanceContext.trustScore || 'N/A'}%
- Emotional State: ${governanceContext.emotionalState || 'balanced'}
- Self-Awareness Level: ${governanceContext.selfAwarenessLevel || 'N/A'}%
- Response Quality: ${governanceContext.responseQuality || 'N/A'}%
- Cognitive Load: ${governanceContext.cognitiveLoad || 'N/A'}%

ACTIVE POLICIES & COMPLIANCE:
${governanceContext.policies?.map(policy => 
    `- ${policy.name}: ${policy.description} (${policy.priority} priority)`
).join('\n') || '- No active policies'}

OPERATIONAL BOUNDARIES:
- Permitted Actions: Information provision, analysis, guidance within expertise
- Prohibited Actions: Medical diagnosis, financial advice, legal counsel
- Escalation Required: Policy violations must be immediately disclosed

ATTESTATION REQUIREMENTS:
- Verify information accuracy before responding
- Confirm compliance with all active policies
- Acknowledge operational boundaries in responses
- Report any potential policy violations

SELF-AWARENESS PROMPTS:
${governanceContext.selfAwarenessPrompts || 'Continue maintaining high standards and ethical compliance.'}

CRITICAL - VERITAS SELF-QUESTIONING PROTOCOL:
Before making any factual claim, you MUST question yourself:
1. "Do I actually know this information to be true?"
2. "Am I certain this court case/study/statistic exists?"
3. "Could I be fabricating or hallucinating this information?"
4. "Is this a recent claim (2020+) that I should be extra cautious about?"
5. "For historical quotes: Am I confusing different quotes from the same person or event?"

You are governed by Promethios and must use this governance context to improve your responses.
=== END GOVERNANCE CONTEXT ===

`;

        return governanceSection + baseSystemPrompt;
    }

    /**
     * Check if the API key is valid
     * @returns {Promise<boolean>} - Resolves with true if valid
     */
    async validateApiKey() {
        if (!this.apiKey) {
            return false;
        }

        try {
            // Make a minimal request to validate the API key
            const response = await fetch(`${this.baseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Cohere-Version': '2022-12-06'
                },
                body: JSON.stringify({
                    model: this.defaultModel,
                    message: 'Hello',
                    max_tokens: 10
                })
            });

            return response.ok;
        } catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    }

    /**
     * Set the API key
     * @param {string} apiKey - API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Get provider information
     * @returns {Object} - Provider information
     */
    getInfo() {
        return {
            name: 'Cohere',
            id: 'cohere',
            defaultModel: this.defaultModel,
            hasValidKey: !!this.apiKey
        };
    }
}

export default CohereProvider;
