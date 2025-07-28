// Enhanced error handling and validation utilities
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ApiValidationConfig {
  provider: string;
  apiKey: string;
  endpoint?: string;
  model?: string;
}

class ApiValidationService {
  validateApiKey(provider: string, apiKey: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!apiKey || apiKey.trim().length === 0) {
      result.isValid = false;
      result.errors.push('API key is required');
      return result;
    }

    switch (provider.toLowerCase()) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          result.isValid = false;
          result.errors.push('OpenAI API keys should start with "sk-"');
        }
        if (apiKey.length < 20) {
          result.isValid = false;
          result.errors.push('OpenAI API key appears to be too short');
        }
        break;

      case 'anthropic':
        if (!apiKey.startsWith('sk-ant-')) {
          result.warnings.push('Anthropic API keys typically start with "sk-ant-"');
        }
        if (apiKey.length < 20) {
          result.isValid = false;
          result.errors.push('Anthropic API key appears to be too short');
        }
        break;

      case 'cohere':
        if (apiKey.length < 20) {
          result.isValid = false;
          result.errors.push('Cohere API key appears to be too short');
        }
        break;

      case 'custom':
        if (apiKey.length < 8) {
          result.warnings.push('API key appears to be very short');
        }
        break;

      default:
        result.warnings.push('Unknown provider - unable to validate API key format');
    }

    return result;
  }

  validateEndpoint(endpoint: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!endpoint || endpoint.trim().length === 0) {
      result.isValid = false;
      result.errors.push('API endpoint is required');
      return result;
    }

    try {
      const url = new URL(endpoint);
      
      if (!['http:', 'https:'].includes(url.protocol)) {
        result.isValid = false;
        result.errors.push('Endpoint must use HTTP or HTTPS protocol');
      }

      if (url.protocol === 'http:') {
        result.warnings.push('Using HTTP instead of HTTPS may not be secure');
      }

      if (!url.hostname) {
        result.isValid = false;
        result.errors.push('Invalid hostname in endpoint URL');
      }

      // Check for common endpoint patterns
      if (url.pathname === '/') {
        result.warnings.push('Endpoint path is just "/", make sure this is correct');
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push('Invalid URL format');
    }

    return result;
  }

  validateModel(provider: string, model: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!model || model.trim().length === 0) {
      result.isValid = false;
      result.errors.push('Model name is required');
      return result;
    }

    const knownModels = {
      openai: [
        'gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-4-0125-preview',
        'gpt-3.5-turbo', 'gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106'
      ],
      anthropic: [
        'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229',
        'claude-2.1', 'claude-2.0', 'claude-instant-1.2'
      ],
      cohere: [
        'command', 'command-light', 'command-nightly', 'command-r', 'command-r-plus'
      ]
    };

    const providerModels = knownModels[provider.toLowerCase() as keyof typeof knownModels];
    if (providerModels && !providerModels.includes(model)) {
      result.warnings.push(`Model "${model}" is not in the list of known ${provider} models`);
    }

    return result;
  }

  validateConfiguration(config: ApiValidationConfig): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate API key
    const apiKeyValidation = this.validateApiKey(config.provider, config.apiKey);
    result.errors.push(...apiKeyValidation.errors);
    result.warnings.push(...apiKeyValidation.warnings);
    if (!apiKeyValidation.isValid) {
      result.isValid = false;
    }

    // Validate endpoint for custom providers or if provided
    if (config.provider === 'custom' || config.endpoint) {
      const endpointValidation = this.validateEndpoint(config.endpoint || '');
      result.errors.push(...endpointValidation.errors);
      result.warnings.push(...endpointValidation.warnings);
      if (!endpointValidation.isValid) {
        result.isValid = false;
      }
    }

    // Validate model
    if (config.model) {
      const modelValidation = this.validateModel(config.provider, config.model);
      result.errors.push(...modelValidation.errors);
      result.warnings.push(...modelValidation.warnings);
      if (!modelValidation.isValid) {
        result.isValid = false;
      }
    }

    return result;
  }

  getConnectionErrorHelp(error: string, provider: string): string {
    const errorHelp: Record<string, string> = {
      'Authentication failed': 'Please check your API key. Make sure it\'s valid and has the necessary permissions.',
      'Invalid API key': 'The API key format appears to be incorrect. Please verify you\'ve copied it correctly.',
      'Rate limit exceeded': 'You\'ve hit the rate limit for your API key. Please wait a moment and try again.',
      'Connection timeout': 'The API didn\'t respond within 10 seconds. This could be a network issue or the service might be down.',
      'Network error': 'Unable to reach the API endpoint. Check your internet connection and the endpoint URL.',
      'Invalid endpoint URL': 'The endpoint URL format is incorrect. Make sure it includes the protocol (https://) and is properly formatted.',
      'Endpoint not found': 'The API endpoint returned a 404 error. Please verify the endpoint URL is correct.',
    };

    const providerSpecificHelp: Record<string, Record<string, string>> = {
      openai: {
        'Authentication failed': 'Check your OpenAI API key at https://platform.openai.com/api-keys',
        'Rate limit exceeded': 'OpenAI rate limits vary by plan. Check your usage at https://platform.openai.com/usage',
      },
      anthropic: {
        'Authentication failed': 'Check your Anthropic API key at https://console.anthropic.com/',
        'Rate limit exceeded': 'Anthropic has rate limits based on your plan. Check your console for details.',
      },
      cohere: {
        'Authentication failed': 'Check your Cohere API key at https://dashboard.cohere.ai/api-keys',
        'Rate limit exceeded': 'Cohere rate limits depend on your plan. Check your dashboard for usage.',
      },
    };

    // Try provider-specific help first
    const providerHelp = providerSpecificHelp[provider.toLowerCase()];
    if (providerHelp && providerHelp[error]) {
      return providerHelp[error];
    }

    // Fall back to general help
    return errorHelp[error] || 'An unexpected error occurred. Please check your configuration and try again.';
  }

  getSecurityRecommendations(config: ApiValidationConfig): string[] {
    const recommendations: string[] = [];

    if (config.endpoint && !config.endpoint.startsWith('https://')) {
      recommendations.push('Use HTTPS endpoints to ensure your API key is transmitted securely');
    }

    if (config.provider === 'custom') {
      recommendations.push('For custom APIs, ensure your endpoint supports proper authentication and rate limiting');
      recommendations.push('Consider implementing request/response logging for debugging purposes');
    }

    recommendations.push('Store your API keys securely and never commit them to version control');
    recommendations.push('Regularly rotate your API keys for better security');
    recommendations.push('Monitor your API usage to detect any unusual activity');

    return recommendations;
  }
}

export const apiValidationService = new ApiValidationService();

