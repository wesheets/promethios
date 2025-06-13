// API Connection Testing Service
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  model?: string;
  error?: string;
}

export interface ApiCredentials {
  provider: string;
  apiKey: string;
  endpoint?: string;
  model?: string;
}

class ApiConnectionService {
  private async makeTestRequest(
    url: string,
    headers: Record<string, string>,
    body: any,
    timeout: number = 10000
  ): Promise<{ response: Response; startTime: number }> {
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return { response, startTime };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async testOpenAIConnection(credentials: ApiCredentials): Promise<ConnectionTestResult> {
    try {
      const { response, startTime } = await this.makeTestRequest(
        credentials.endpoint || 'https://api.openai.com/v1/chat/completions',
        {
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        {
          model: credentials.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 1,
        }
      );

      const latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Connection successful',
          latency,
          model: credentials.model || 'gpt-3.5-turbo',
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'Invalid API key',
          error: 'Authentication failed',
        };
      } else if (response.status === 429) {
        return {
          success: false,
          message: 'Rate limit exceeded',
          error: 'Too many requests',
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `API error: ${response.status}`,
          error: errorData.error?.message || 'Unknown error',
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timeout',
          error: 'Request timed out after 10 seconds',
        };
      }
      return {
        success: false,
        message: 'Connection failed',
        error: error.message || 'Network error',
      };
    }
  }

  async testAnthropicConnection(credentials: ApiCredentials): Promise<ConnectionTestResult> {
    try {
      const { response, startTime } = await this.makeTestRequest(
        credentials.endpoint || 'https://api.anthropic.com/v1/messages',
        {
          'x-api-key': credentials.apiKey,
          'anthropic-version': '2023-06-01',
        },
        {
          model: credentials.model || 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Test connection' }],
        }
      );

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'Connection successful',
          latency,
          model: credentials.model || 'claude-3-haiku-20240307',
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'Invalid API key',
          error: 'Authentication failed',
        };
      } else if (response.status === 429) {
        return {
          success: false,
          message: 'Rate limit exceeded',
          error: 'Too many requests',
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `API error: ${response.status}`,
          error: errorData.error?.message || 'Unknown error',
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timeout',
          error: 'Request timed out after 10 seconds',
        };
      }
      return {
        success: false,
        message: 'Connection failed',
        error: error.message || 'Network error',
      };
    }
  }

  async testCohereConnection(credentials: ApiCredentials): Promise<ConnectionTestResult> {
    try {
      const { response, startTime } = await this.makeTestRequest(
        credentials.endpoint || 'https://api.cohere.ai/v1/generate',
        {
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        {
          model: credentials.model || 'command',
          prompt: 'Test connection',
          max_tokens: 1,
        }
      );

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'Connection successful',
          latency,
          model: credentials.model || 'command',
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'Invalid API key',
          error: 'Authentication failed',
        };
      } else if (response.status === 429) {
        return {
          success: false,
          message: 'Rate limit exceeded',
          error: 'Too many requests',
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `API error: ${response.status}`,
          error: errorData.message || 'Unknown error',
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timeout',
          error: 'Request timed out after 10 seconds',
        };
      }
      return {
        success: false,
        message: 'Connection failed',
        error: error.message || 'Network error',
      };
    }
  }

  async testCustomConnection(credentials: ApiCredentials): Promise<ConnectionTestResult> {
    if (!credentials.endpoint) {
      return {
        success: false,
        message: 'Custom endpoint required',
        error: 'No endpoint provided',
      };
    }

    try {
      const { response, startTime } = await this.makeTestRequest(
        credentials.endpoint,
        {
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        {
          message: 'Test connection',
          model: credentials.model,
        }
      );

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'Connection successful',
          latency,
          model: credentials.model || 'custom',
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'Invalid API key',
          error: 'Authentication failed',
        };
      } else if (response.status === 404) {
        return {
          success: false,
          message: 'Endpoint not found',
          error: 'Invalid endpoint URL',
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `API error: ${response.status}`,
          error: errorData.error || errorData.message || 'Unknown error',
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timeout',
          error: 'Request timed out after 10 seconds',
        };
      }
      return {
        success: false,
        message: 'Connection failed',
        error: error.message || 'Network error',
      };
    }
  }

  async testConnection(credentials: ApiCredentials): Promise<ConnectionTestResult> {
    switch (credentials.provider.toLowerCase()) {
      case 'openai':
        return this.testOpenAIConnection(credentials);
      case 'anthropic':
        return this.testAnthropicConnection(credentials);
      case 'cohere':
        return this.testCohereConnection(credentials);
      case 'custom':
        return this.testCustomConnection(credentials);
      default:
        return {
          success: false,
          message: 'Unsupported provider',
          error: `Provider ${credentials.provider} is not supported`,
        };
    }
  }
}

export const apiConnectionService = new ApiConnectionService();

