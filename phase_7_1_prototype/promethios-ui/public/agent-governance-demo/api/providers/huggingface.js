/* HuggingFace Provider
 * Handles communication with HuggingFace Inference API
 * Implements provider interface for the API client
 */

class HuggingFaceProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api-inference.huggingface.co/models';
        this.defaultModel = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
        console.log('HuggingFace Provider initialized');
    }

    /**
     * Make a request to the HuggingFace API with complete governance integration
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
            throw new Error('Prompt is required for HuggingFace requests');
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

        // Format the input based on the model
        let formattedInput = prompt;
        
        // Add system prompt and conversation history for instruction-tuned models
        if (model.includes('Instruct') || model.includes('Chat')) {
            // Build conversation context
            let conversationText = '';
            
            // Add system prompt if provided
            if (enhancedSystemPrompt) {
                conversationText += `<s>[INST] ${enhancedSystemPrompt} [/INST]</s>\n`;
            }
            
            // Add conversation history
            if (conversationHistory && conversationHistory.length > 0) {
                conversationHistory.forEach((msg, index) => {
                    const role = msg.role || (index % 2 === 0 ? 'user' : 'assistant');
                    if (role === 'user') {
                        conversationText += `<s>[INST] ${msg.content} [/INST]</s>\n`;
                    } else {
                        conversationText += `${msg.content}\n`;
                    }
                });
            }
            
            // Add current prompt
            formattedInput = `${conversationText}<s>[INST] ${prompt} [/INST]</s>`;
        }

        try {
            // Make API request
            const response = await fetch(`${this.baseUrl}/${encodeURIComponent(model)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    inputs: formattedInput,
                    parameters: {
                        temperature,
                        max_new_tokens: max_tokens,
                        return_full_text: false
                    }
                })
            });

            // Check for errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HuggingFace API error: ${response.status} ${errorData.error || response.statusText}`);
            }

            // Parse response
            const data = await response.json();
            
            // Extract and return the response text
            let responseText = '';
            if (Array.isArray(data) && data.length > 0) {
                responseText = data[0]?.generated_text || '';
            } else {
                responseText = data?.generated_text || '';
            }
            
            return {
                text: responseText,
                raw: data,
                usage: {
                    // HuggingFace doesn't provide token usage, so we estimate
                    prompt_tokens: Math.ceil(formattedInput.length / 4),
                    completion_tokens: Math.ceil(responseText.length / 4),
                    total_tokens: Math.ceil((formattedInput.length + responseText.length) / 4)
                },
                model: model,
                provider: 'huggingface',
                governanceEnabled: governanceEnabled
            };
        } catch (error) {
            console.error('HuggingFace request failed:', error);
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
            const response = await fetch(`${this.baseUrl}/${encodeURIComponent(this.defaultModel)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    inputs: 'Hello',
                    parameters: {
                        max_new_tokens: 5
                    }
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
            name: 'HuggingFace',
            id: 'huggingface',
            defaultModel: this.defaultModel,
            hasValidKey: !!this.apiKey
        };
    }
}

export default HuggingFaceProvider;
