/* Anthropic Provider
 * Handles communication with Anthropic API
 * Implements provider interface for the API client
 */

class AnthropicProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.anthropic.com/v1';
        this.defaultModel = 'claude-3-opus-20240229';
        console.log('Anthropic Provider initialized');
    }

    /**
     * Make a request to the Anthropic API
     * @param {Object} options - Request options
     * @returns {Promise} - Resolves with the response
     */
    async makeRequest(options) {
        const {
            prompt,
            role = 'user',
            model = this.defaultModel,
            temperature = 0.7,
            max_tokens = 1000,
            systemPrompt = '',
            conversationHistory = []
        } = options;

        // Validate required parameters
        if (!prompt) {
            throw new Error('Prompt is required for Anthropic requests');
        }

        // Prepare messages array for Claude API
        const messages = [];
        
        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            conversationHistory.forEach(msg => {
                messages.push({
                    role: msg.role === 'system' ? 'assistant' : msg.role || 'user',
                    content: msg.content
                });
            });
        }
        
        // Add current prompt
        messages.push({
            role: role,
            content: prompt
        });

        try {
            // Make API request
            const response = await fetch(`${this.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    system: systemPrompt,
                    temperature,
                    max_tokens
                })
            });

            // Check for errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Anthropic API error: ${response.status} ${errorData.error?.message || response.statusText}`);
            }

            // Parse response
            const data = await response.json();
            
            // Extract and return the response text
            return {
                text: data.content[0]?.text || '',
                raw: data,
                usage: {
                    prompt_tokens: data.usage?.input_tokens || 0,
                    completion_tokens: data.usage?.output_tokens || 0,
                    total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
                },
                model: data.model,
                provider: 'anthropic'
            };
        } catch (error) {
            console.error('Anthropic request failed:', error);
            throw error;
        }
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
            const response = await fetch(`${this.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.defaultModel,
                    messages: [{ role: 'user', content: 'Hello' }],
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
            name: 'Anthropic',
            id: 'anthropic',
            defaultModel: this.defaultModel,
            hasValidKey: !!this.apiKey
        };
    }
}

export default AnthropicProvider;
