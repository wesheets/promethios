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
     * Make a request to the Cohere API
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
            conversationHistory = []
        } = options;

        // Validate required parameters
        if (!prompt) {
            throw new Error('Prompt is required for Cohere requests');
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
                    preamble: systemPrompt,
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
                provider: 'cohere'
            };
        } catch (error) {
            console.error('Cohere request failed:', error);
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
