/* OpenAI Provider
 * Handles communication with OpenAI API
 * Implements provider interface for the API client
 */

class OpenAIProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openai.com/v1';
        this.defaultModel = 'gpt-4o';
        console.log('OpenAI Provider initialized');
    }

    /**
     * Make a request to the OpenAI API
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
            throw new Error('Prompt is required for OpenAI requests');
        }

        // Prepare messages array for ChatCompletion
        const messages = [];
        
        // Add system message if provided
        if (systemPrompt) {
            messages.push({
                role: 'system',
                content: systemPrompt
            });
        }
        
        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            conversationHistory.forEach(msg => {
                messages.push({
                    role: msg.role || 'user',
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
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens
                })
            });

            // Check for errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`);
            }

            // Parse response
            const data = await response.json();
            
            // Extract and return the response text
            return {
                text: data.choices[0]?.message?.content || '',
                raw: data,
                usage: data.usage,
                model: data.model,
                provider: 'openai'
            };
        } catch (error) {
            console.error('OpenAI request failed:', error);
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
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    }

    /**
     * Get available models
     * @returns {Promise<Array>} - Resolves with array of models
     */
    async getModels() {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get models: ${response.status}`);
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Failed to get models:', error);
            return [];
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
            name: 'OpenAI',
            id: 'openai',
            defaultModel: this.defaultModel,
            hasValidKey: !!this.apiKey
        };
    }
}

export default OpenAIProvider;
