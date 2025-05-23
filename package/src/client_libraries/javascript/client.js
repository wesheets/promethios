/**
 * JavaScript Client Library for API Access
 * 
 * This module provides a JavaScript client library for accessing the API,
 * with support for authentication, request handling, and response parsing.
 */

/**
 * Main API client class
 */
class ApiClient {
  /**
   * Initialize the API client
   * 
   * @param {string} apiKey - API key for authentication
   * @param {string} baseUrl - Base URL for API requests
   * @param {Object} config - Additional configuration options
   */
  constructor(apiKey = null, baseUrl = null, config = {}) {
    this.apiKey = apiKey || process.env.API_KEY;
    this.baseUrl = baseUrl || process.env.API_BASE_URL || 'https://api.example.com/v1';
    this.config = config;
    
    // Extract configuration values
    this.timeout = this.config.timeout || 30000; // milliseconds
    this.maxRetries = this.config.maxRetries || 3;
    this.retryDelay = this.config.retryDelay || 1000; // milliseconds
    this.retryBackoff = this.config.retryBackoff || 2;
    
    // Set default headers
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'JavaScript-ApiClient/1.0'
    };
    
    // Set API key if provided
    if (this.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    console.log(`Initialized API client with base URL: ${this.baseUrl}`);
  }
  
  /**
   * Send a request to the API
   * 
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} params - Query parameters
   * @param {Object} data - Request body data
   * @param {Object} headers - Additional headers
   * @param {Object} files - Files to upload (not supported in browser)
   * @returns {Promise<Object>} - API response
   * @throws {ApiError} - If the API returns an error
   */
  async request(method, endpoint, params = null, data = null, headers = null, files = null) {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    const requestHeaders = { ...this.headers, ...(headers || {}) };
    
    // Prepare fetch options
    const options = {
      method: method,
      headers: requestHeaders,
      timeout: this.timeout
    };
    
    // Add body if data is provided
    if (data !== null && !files) {
      options.body = JSON.stringify(data);
    }
    
    // Add query parameters to URL if provided
    let fetchUrl = url;
    if (params) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      fetchUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }
    
    // Retry logic
    let retries = 0;
    
    while (true) {
      try {
        // Make the request
        const response = await this._fetchWithTimeout(fetchUrl, options);
        
        // Check for rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || this.retryDelay / 1000, 10);
          console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
          await this._sleep(retryAfter * 1000);
          continue;
        }
        
        // Parse response
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          responseData = { raw_content: text };
        }
        
        // Check for errors
        if (response.status >= 400) {
          const errorMessage = responseData.error?.message || 'Unknown error';
          const errorCode = responseData.error?.code || response.status;
          
          if (response.status >= 500) {
            // Server error, can retry
            if (retries < this.maxRetries) {
              retries++;
              const delay = this.retryDelay * Math.pow(this.retryBackoff, retries);
              console.warn(`Server error: ${errorMessage}. Retrying in ${delay / 1000} seconds.`);
              await this._sleep(delay);
              continue;
            }
          }
          
          // Client error or max retries reached
          throw new ApiError(errorMessage, errorCode, responseData);
        }
        
        // Success
        return responseData;
      } catch (error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          if (retries < this.maxRetries) {
            retries++;
            const delay = this.retryDelay * Math.pow(this.retryBackoff, retries);
            console.warn(`Request timed out. Retrying in ${delay / 1000} seconds.`);
            await this._sleep(delay);
            continue;
          }
          throw new Error(`Request timed out after ${this.maxRetries} retries`);
        }
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          if (retries < this.maxRetries) {
            retries++;
            const delay = this.retryDelay * Math.pow(this.retryBackoff, retries);
            console.warn(`Connection error. Retrying in ${delay / 1000} seconds.`);
            await this._sleep(delay);
            continue;
          }
          throw new Error(`Connection failed after ${this.maxRetries} retries: ${error.message}`);
        }
        
        // Rethrow other errors
        throw error;
      }
    }
  }
  
  /**
   * Fetch with timeout
   * 
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} - Fetch response
   */
  async _fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Sleep for a specified duration
   * 
   * @param {number} ms - Duration in milliseconds
   * @returns {Promise<void>}
   */
  async _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Send a GET request to the API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} - API response
   */
  async get(endpoint, params = null, headers = null) {
    return this.request('GET', endpoint, params, null, headers);
  }
  
  /**
   * Send a POST request to the API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} params - Query parameters
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} - API response
   */
  async post(endpoint, data = null, params = null, headers = null) {
    return this.request('POST', endpoint, params, data, headers);
  }
  
  /**
   * Send a PUT request to the API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} params - Query parameters
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} - API response
   */
  async put(endpoint, data = null, params = null, headers = null) {
    return this.request('PUT', endpoint, params, data, headers);
  }
  
  /**
   * Send a DELETE request to the API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} - API response
   */
  async delete(endpoint, params = null, headers = null) {
    return this.request('DELETE', endpoint, params, null, headers);
  }
  
  /**
   * Send a PATCH request to the API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} params - Query parameters
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} - API response
   */
  async patch(endpoint, data = null, params = null, headers = null) {
    return this.request('PATCH', endpoint, params, data, headers);
  }
  
  /**
   * Set the API key for authentication
   * 
   * @param {string} apiKey - API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.headers['Authorization'] = `Bearer ${apiKey}`;
    console.log('Updated API key');
  }
  
  /**
   * Set the base URL for API requests
   * 
   * @param {string} baseUrl - Base URL
   */
  setBaseUrl(baseUrl) {
    this.baseUrl = baseUrl;
    console.log(`Updated base URL: ${baseUrl}`);
  }
}

/**
 * API Error class
 */
class ApiError extends Error {
  /**
   * Initialize the API error
   * 
   * @param {string} message - Error message
   * @param {number} code - Error code
   * @param {Object} response - Full API response
   */
  constructor(message, code, response = null) {
    super(`API Error ${code}: ${message}`);
    this.name = 'ApiError';
    this.message = message;
    this.code = code;
    this.response = response;
  }
}

/**
 * Base class for API resources
 */
class Resource {
  /**
   * Initialize the resource
   * 
   * @param {ApiClient} client - API client
   * @param {string} baseEndpoint - Base endpoint for this resource
   */
  constructor(client, baseEndpoint) {
    this.client = client;
    this.baseEndpoint = baseEndpoint.replace(/\/$/, '');
  }
  
  /**
   * Get the full endpoint for a path
   * 
   * @param {string} path - Path to append to base endpoint
   * @returns {string} - Full endpoint
   */
  _getEndpoint(path = '') {
    if (!path) {
      return this.baseEndpoint;
    }
    
    return `${this.baseEndpoint}/${path.replace(/^\//, '')}`;
  }
  
  /**
   * List resources
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - API response
   */
  async list(params = null) {
    return this.client.get(this._getEndpoint(), params);
  }
  
  /**
   * Get a resource by ID
   * 
   * @param {string} resourceId - Resource ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - API response
   */
  async get(resourceId, params = null) {
    return this.client.get(this._getEndpoint(resourceId), params);
  }
  
  /**
   * Create a resource
   * 
   * @param {Object} data - Resource data
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - API response
   */
  async create(data, params = null) {
    return this.client.post(this._getEndpoint(), data, params);
  }
  
  /**
   * Update a resource
   * 
   * @param {string} resourceId - Resource ID
   * @param {Object} data - Resource data
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - API response
   */
  async update(resourceId, data, params = null) {
    return this.client.put(this._getEndpoint(resourceId), data, params);
  }
  
  /**
   * Delete a resource
   * 
   * @param {string} resourceId - Resource ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - API response
   */
  async delete(resourceId, params = null) {
    return this.client.delete(this._getEndpoint(resourceId), params);
  }
  
  /**
   * Partially update a resource
   * 
   * @param {string} resourceId - Resource ID
   * @param {Object} data - Resource data
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - API response
   */
  async patch(resourceId, data, params = null) {
    return this.client.patch(this._getEndpoint(resourceId), data, params);
  }
}

/**
 * Access tier resource for the API
 */
class AccessTierResource extends Resource {
  /**
   * Initialize the access tier resource
   * 
   * @param {ApiClient} client - API client
   */
  constructor(client) {
    super(client, 'access-tiers');
  }
  
  /**
   * Get the current user's access tier
   * 
   * @returns {Promise<Object>} - API response
   */
  async getCurrent() {
    return this.client.get(this._getEndpoint('current'));
  }
  
  /**
   * Request an upgrade to a new tier
   * 
   * @param {string} tierId - Target tier ID
   * @returns {Promise<Object>} - API response
   */
  async requestUpgrade(tierId) {
    return this.client.post(this._getEndpoint('request-upgrade'), { tier_id: tierId });
  }
  
  /**
   * Get the status of a tier upgrade request
   * 
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>} - API response
   */
  async getUpgradeStatus(requestId) {
    return this.client.get(this._getEndpoint(`upgrade-status/${requestId}`));
  }
  
  /**
   * Get the current user's quota usage
   * 
   * @returns {Promise<Object>} - API response
   */
  async getQuotaUsage() {
    return this.client.get(this._getEndpoint('quota-usage'));
  }
}

/**
 * API key resource for the API
 */
class ApiKeyResource extends Resource {
  /**
   * Initialize the API key resource
   * 
   * @param {ApiClient} client - API client
   */
  constructor(client) {
    super(client, 'api-keys');
  }
  
  /**
   * Create a new API key
   * 
   * @param {string} name - Key name
   * @param {number} expiryDays - Number of days until expiry
   * @returns {Promise<Object>} - API response
   */
  async createKey(name = null, expiryDays = null) {
    const data = {};
    
    if (name) {
      data.name = name;
    }
    
    if (expiryDays) {
      data.expiry_days = expiryDays;
    }
    
    return this.client.post(this._getEndpoint(), data);
  }
  
  /**
   * Revoke an API key
   * 
   * @param {string} keyId - Key ID
   * @returns {Promise<Object>} - API response
   */
  async revokeKey(keyId) {
    return this.client.delete(this._getEndpoint(keyId));
  }
  
  /**
   * Get the current API key information
   * 
   * @returns {Promise<Object>} - API response
   */
  async getCurrent() {
    return this.client.get(this._getEndpoint('current'));
  }
}

/**
 * User resource for the API
 */
class UserResource extends Resource {
  /**
   * Initialize the user resource
   * 
   * @param {ApiClient} client - API client
   */
  constructor(client) {
    super(client, 'users');
  }
  
  /**
   * Get the current user's profile
   * 
   * @returns {Promise<Object>} - API response
   */
  async getProfile() {
    return this.client.get(this._getEndpoint('profile'));
  }
  
  /**
   * Update the current user's profile
   * 
   * @param {Object} data - Profile data
   * @returns {Promise<Object>} - API response
   */
  async updateProfile(data) {
    return this.client.put(this._getEndpoint('profile'), data);
  }
  
  /**
   * Get the current user's preferences
   * 
   * @returns {Promise<Object>} - API response
   */
  async getPreferences() {
    return this.client.get(this._getEndpoint('preferences'));
  }
  
  /**
   * Update the current user's preferences
   * 
   * @param {Object} data - Preference data
   * @returns {Promise<Object>} - API response
   */
  async updatePreferences(data) {
    return this.client.put(this._getEndpoint('preferences'), data);
  }
}

/**
 * Sandbox resource for the API
 */
class SandboxResource extends Resource {
  /**
   * Initialize the sandbox resource
   * 
   * @param {ApiClient} client - API client
   */
  constructor(client) {
    super(client, 'sandbox');
  }
  
  /**
   * Create a new sandbox environment
   * 
   * @param {string} name - Environment name
   * @param {string} template - Template to use
   * @returns {Promise<Object>} - API response
   */
  async createEnvironment(name = null, template = null) {
    const data = {};
    
    if (name) {
      data.name = name;
    }
    
    if (template) {
      data.template = template;
    }
    
    return this.client.post(this._getEndpoint('environments'), data);
  }
  
  /**
   * Get a sandbox environment
   * 
   * @param {string} environmentId - Environment ID
   * @returns {Promise<Object>} - API response
   */
  async getEnvironment(environmentId) {
    return this.client.get(this._getEndpoint(`environments/${environmentId}`));
  }
  
  /**
   * Delete a sandbox environment
   * 
   * @param {string} environmentId - Environment ID
   * @returns {Promise<Object>} - API response
   */
  async deleteEnvironment(environmentId) {
    return this.client.delete(this._getEndpoint(`environments/${environmentId}`));
  }
  
  /**
   * Execute a request in the sandbox environment
   * 
   * @param {string} environmentId - Environment ID
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - API response
   */
  async executeRequest(environmentId, endpoint, method = 'GET', data = null) {
    const requestData = {
      endpoint: endpoint,
      method: method
    };
    
    if (data) {
      requestData.data = data;
    }
    
    return this.client.post(this._getEndpoint(`environments/${environmentId}/execute`), requestData);
  }
}

/**
 * Feedback resource for the API
 */
class FeedbackResource extends Resource {
  /**
   * Initialize the feedback resource
   * 
   * @param {ApiClient} client - API client
   */
  constructor(client) {
    super(client, 'feedback');
  }
  
  /**
   * Submit feedback
   * 
   * @param {string} feedbackType - Type of feedback
   * @param {string} content - Feedback content
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - API response
   */
  async submit(feedbackType, content, metadata = null) {
    const data = {
      type: feedbackType,
      content: content
    };
    
    if (metadata) {
      data.metadata = metadata;
    }
    
    return this.client.post(this._getEndpoint(), data);
  }
  
  /**
   * Get the current user's feedback submissions
   * 
   * @returns {Promise<Object>} - API response
   */
  async getSubmissions() {
    return this.client.get(this._getEndpoint('submissions'));
  }
  
  /**
   * Get a feedback submission
   * 
   * @param {string} submissionId - Submission ID
   * @returns {Promise<Object>} - API response
   */
  async getSubmission(submissionId) {
    return this.client.get(this._getEndpoint(`submissions/${submissionId}`));
  }
}

/**
 * Main client for the API
 */
class Client {
  /**
   * Initialize the client
   * 
   * @param {string} apiKey - API key for authentication
   * @param {string} baseUrl - Base URL for API requests
   * @param {Object} config - Additional configuration options
   */
  constructor(apiKey = null, baseUrl = null, config = null) {
    this.apiClient = new ApiClient(apiKey, baseUrl, config);
    
    // Initialize resources
    this.accessTiers = new AccessTierResource(this.apiClient);
    this.apiKeys = new ApiKeyResource(this.apiClient);
    this.users = new UserResource(this.apiClient);
    this.sandbox = new SandboxResource(this.apiClient);
    this.feedback = new FeedbackResource(this.apiClient);
  }
  
  /**
   * Set the API key for authentication
   * 
   * @param {string} apiKey - API key
   */
  setApiKey(apiKey) {
    this.apiClient.setApiKey(apiKey);
  }
  
  /**
   * Set the base URL for API requests
   * 
   * @param {string} baseUrl - Base URL
   */
  setBaseUrl(baseUrl) {
    this.apiClient.setBaseUrl(baseUrl);
  }
}

// Export classes for Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ApiClient,
    ApiError,
    Resource,
    AccessTierResource,
    ApiKeyResource,
    UserResource,
    SandboxResource,
    FeedbackResource,
    Client
  };
} else {
  // Browser global
  window.ApiClient = ApiClient;
  window.ApiError = ApiError;
  window.Resource = Resource;
  window.AccessTierResource = AccessTierResource;
  window.ApiKeyResource = ApiKeyResource;
  window.UserResource = UserResource;
  window.SandboxResource = SandboxResource;
  window.FeedbackResource = FeedbackResource;
  window.Client = Client;
}
