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
     * Make a request to the HuggingFace API
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
            throw new Error('Prompt is required for HuggingFace requests');
        }

        // Format the input based on the model
        let formattedInput = prompt;
        
        // Add system prompt and conversation history for instruction-tuned models
        if (model.includes('Instruct') || model.includes('Chat')) {
            // Build conversation context
            let conversationText = '';
            
            // Add system prompt if provided
            if (systemPrompt) {
                conversationText += `<s>[INST] ${systemPrompt} [/INST]</s>\n`;
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
                provider: 'huggingface'
            };
        } catch (error) {
            console.error('HuggingFace request failed:', error);
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
