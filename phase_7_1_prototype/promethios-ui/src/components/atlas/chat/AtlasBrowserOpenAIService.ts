/**
 * AtlasBrowserOpenAIService.ts
 * 
 * Browser-compatible service for handling OpenAI API integration with ATLAS chat functionality.
 * This service uses the openaiProxy to make API calls without requiring the Node.js SDK.
 */

import { 
  sendChatCompletionRequest, 
  createPromethiosSystemMessage, 
  getFallbackResponse,
  ChatMessage
} from '../../../api/openaiProxy';

// Define interfaces
export interface OpenAIServiceConfig {
  debug?: boolean;
}

class AtlasBrowserOpenAIService {
  private isInitialized: boolean = false;
  private debug: boolean = false;
  
  constructor(config: OpenAIServiceConfig = {}) {
    this.debug = config.debug || false;
    this.initialize();
  }
  
  /**
   * Initialize the OpenAI service
   */
  private initialize(): boolean {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        this.logDebug('OpenAI API key not found in environment variables');
        return false;
      }
      
      this.isInitialized = true;
      this.logDebug('Browser OpenAI service initialized successfully');
      return true;
    } catch (error) {
      this.logDebug('Error initializing Browser OpenAI service:', error);
      return false;
    }
  }
  
  /**
   * Generate a response using OpenAI
   */
  async generateResponse(
    message: string, 
    conversationHistory: Array<{role: string, content: string}>,
    mode: 'public' | 'session',
    agentId?: string
  ): Promise<string> {
    if (!this.isInitialized) {
      this.logDebug('Browser OpenAI service not initialized, cannot generate response');
      return getFallbackResponse(message, mode, agentId);
    }
    
    try {
      // Prepare conversation history in OpenAI format
      const formattedHistory = conversationHistory.map(msg => {
        // Map 'atlas' role to 'assistant' for OpenAI
        const role = msg.role === 'atlas' ? 'assistant' : 
                    msg.role === 'system' ? 'system' : 'user';
        return { role, content: msg.content } as ChatMessage;
      });
      
      // Create system message with Promethios-specific knowledge
      const systemMessage = createPromethiosSystemMessage(mode, agentId);
      
      // Prepare the complete messages array for the API call
      const messages = [
        { role: 'system', content: systemMessage } as ChatMessage,
        ...formattedHistory
      ];
      
      this.logDebug('Sending request to OpenAI with messages:', messages);
      
      // Make the API call via the proxy
      const response = await sendChatCompletionRequest({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });
      
      const responseContent = response.choices[0]?.message?.content || '';
      this.logDebug('Received response from OpenAI:', responseContent);
      
      return responseContent;
    } catch (error) {
      this.logDebug('Error generating response with OpenAI:', error);
      return getFallbackResponse(message, mode, agentId);
    }
  }
  
  /**
   * Log debug messages if debug mode is enabled
   */
  private logDebug(...args: any[]): void {
    if (this.debug) {
      console.log('[AtlasBrowserOpenAIService]', ...args);
    }
  }
  
  /**
   * Check if the OpenAI service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

export default AtlasBrowserOpenAIService;
