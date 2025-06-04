/**
 * Runtime Environment Variable Loader
 * Loads environment variables from the server at runtime
 */

class RuntimeEnvironmentLoader {
  constructor() {
    this.envVars = {};
    this.loaded = false;
    this.loading = false;
  }

  async loadEnvironmentVariables() {
    if (this.loaded || this.loading) {
      return this.envVars;
    }

    this.loading = true;
    console.log('🔄 Loading environment variables from server...');

    try {
      const response = await fetch('/api/env');
      
      if (!response.ok) {
        throw new Error(`Failed to load environment variables: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.env) {
        this.envVars = data.env;
        this.loaded = true;
        
        // Also set them on window.ENV for compatibility
        window.ENV = { ...window.ENV, ...this.envVars };
        
        console.log('✅ Environment variables loaded successfully:', Object.keys(this.envVars));
        console.log('📊 API providers available:', this.getAvailableProviders());
        
        return this.envVars;
      } else {
        throw new Error('Invalid response format from environment endpoint');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load environment variables:', error.message);
      console.log('🔄 Falling back to demo mode');
      this.loaded = true; // Mark as loaded to prevent retries
      return {};
    } finally {
      this.loading = false;
    }
  }

  getAvailableProviders() {
    const providers = [];
    // Support both VITE_ and VTF_ prefixes for API keys
    if (this.envVars.VITE_OPENAI_API_KEY || this.envVars.VTF_OPENAI_API_KEY) providers.push('OpenAI');
    if (this.envVars.VITE_ANTHROPIC_API_KEY || this.envVars.VTF_ANTHROPIC_API_KEY) providers.push('Anthropic');
    if (this.envVars.VITE_COHERE_API_KEY || this.envVars.VTF_COHERE_API_KEY) providers.push('Cohere');
    if (this.envVars.VITE_HUGGINGFACE_API_KEY || this.envVars.VTF_HUGGINGFACE_API_KEY) providers.push('HuggingFace');
    return providers;
  }

  getEnvironmentVariable(name) {
    return this.envVars[name] || null;
  }

  isLoaded() {
    return this.loaded;
  }

  hasApiKeys() {
    return Object.keys(this.envVars).length > 0;
  }
}

// Create global instance
window.runtimeEnvLoader = new RuntimeEnvironmentLoader();

export default window.runtimeEnvLoader;

