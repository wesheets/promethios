/**
 * Enhanced API client with retry logic, error handling, and caching
 * 
 * This module provides a robust API client for the Promethios UI that includes:
 * - Automatic retry for failed requests
 * - Request cancellation for unmounted components
 * - Response caching
 * - Consistent error handling
 * - Authentication integration
 */

import { GovernanceDomain } from './types';

/**
 * Configuration options for API requests
 */
export interface ApiRequestOptions {
  /**
   * HTTP method for the request
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /**
   * Request headers
   */
  headers?: Record<string, string>;
  
  /**
   * Request body
   */
  body?: any;
  
  /**
   * Whether to cache the response
   */
  cache?: boolean;
  
  /**
   * Cache TTL in milliseconds
   */
  cacheTtl?: number;
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Base delay between retries in milliseconds
   */
  retryDelay?: number;
  
  /**
   * Timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * AbortController signal for cancellation
   */
  signal?: AbortSignal;
}

/**
 * API response with metadata
 */
export interface ApiResponse<T> {
  /**
   * Response data
   */
  data: T;
  
  /**
   * Response status code
   */
  status: number;
  
  /**
   * Response headers
   */
  headers: Headers;
  
  /**
   * Whether the response was from cache
   */
  fromCache: boolean;
  
  /**
   * Timestamp when the response was received
   */
  timestamp: number;
}

/**
 * API error with additional metadata
 */
export class ApiError extends Error {
  /**
   * Response status code
   */
  status: number;
  
  /**
   * Response data
   */
  data?: any;
  
  /**
   * Request URL
   */
  url: string;
  
  /**
   * Request method
   */
  method: string;
  
  /**
   * Whether the error is retryable
   */
  retryable: boolean;
  
  constructor(message: string, status: number, url: string, method: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.url = url;
    this.method = method;
    
    // Determine if error is retryable based on status code
    this.retryable = status >= 500 || status === 429;
  }
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  /**
   * Response data
   */
  data: T;
  
  /**
   * Response status code
   */
  status: number;
  
  /**
   * Response headers
   */
  headers: Headers;
  
  /**
   * Timestamp when the entry was cached
   */
  timestamp: number;
  
  /**
   * TTL in milliseconds
   */
  ttl: number;
}

/**
 * Enhanced API client for the Promethios UI
 */
export class ApiClient {
  /**
   * Base URL for API requests
   */
  private baseUrl: string;
  
  /**
   * Default request options
   */
  private defaultOptions: ApiRequestOptions;
  
  /**
   * Response cache
   */
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Active request AbortControllers
   */
  private activeRequests: Map<string, AbortController> = new Map();
  
  /**
   * Create a new API client
   * 
   * @param baseUrl Base URL for API requests
   * @param defaultOptions Default request options
   */
  constructor(
    baseUrl: string = '/api',
    defaultOptions: ApiRequestOptions = {}
  ) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: true,
      cacheTtl: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      ...defaultOptions
    };
  }
  
  /**
   * Set authentication token
   * 
   * @param token Authentication token
   */
  setAuthToken(token: string): void {
    this.defaultOptions.headers = {
      ...this.defaultOptions.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    const { Authorization, ...headers } = this.defaultOptions.headers || {};
    this.defaultOptions.headers = headers;
  }
  
  /**
   * Generate cache key for a request
   * 
   * @param url Request URL
   * @param options Request options
   * @returns Cache key
   */
  private getCacheKey(url: string, options: ApiRequestOptions): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }
  
  /**
   * Check if a cached response is valid
   * 
   * @param entry Cache entry
   * @returns Whether the entry is valid
   */
  private isCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }
  
  /**
   * Make an API request with retry logic and caching
   * 
   * @param url Request URL
   * @param options Request options
   * @returns Promise resolving to API response
   */
  async request<T>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    // Merge options with defaults
    const mergedOptions: ApiRequestOptions = {
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers
      }
    };
    
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const cacheKey = this.getCacheKey(fullUrl, mergedOptions);
    
    // Cancel any existing request with the same cache key
    if (this.activeRequests.has(cacheKey)) {
      this.activeRequests.get(cacheKey)?.abort();
      this.activeRequests.delete(cacheKey);
    }
    
    // Check cache if enabled
    if (mergedOptions.cache && mergedOptions.method === 'GET') {
      const cachedEntry = this.cache.get(cacheKey);
      if (cachedEntry && this.isCacheValid(cachedEntry)) {
        return {
          data: cachedEntry.data,
          status: cachedEntry.status,
          headers: cachedEntry.headers,
          fromCache: true,
          timestamp: cachedEntry.timestamp
        };
      }
    }
    
    // Create abort controller for this request
    const abortController = new AbortController();
    const signal = mergedOptions.signal || abortController.signal;
    this.activeRequests.set(cacheKey, abortController);
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, mergedOptions.timeout);
    
    try {
      // Make request with retry logic
      return await this.executeWithRetry<T>(
        fullUrl,
        {
          ...mergedOptions,
          signal
        },
        cacheKey
      );
    } finally {
      clearTimeout(timeoutId);
      this.activeRequests.delete(cacheKey);
    }
  }
  
  /**
   * Execute a request with retry logic
   * 
   * @param url Request URL
   * @param options Request options
   * @param cacheKey Cache key
   * @returns Promise resolving to API response
   */
  private async executeWithRetry<T>(
    url: string,
    options: ApiRequestOptions,
    cacheKey: string
  ): Promise<ApiResponse<T>> {
    const { maxRetries = 3, retryDelay = 1000 } = options;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add attempt number to headers for debugging
        const headers = {
          ...options.headers,
          'X-Retry-Attempt': attempt.toString()
        };
        
        // Execute request
        const response = await this.executeRequest<T>(url, { ...options, headers });
        
        // Cache successful GET responses
        if (options.cache && options.method === 'GET') {
          this.cache.set(cacheKey, {
            data: response.data,
            status: response.status,
            headers: response.headers,
            timestamp: response.timestamp,
            ttl: options.cacheTtl || this.defaultOptions.cacheTtl || 300000
          });
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if request was aborted or if error is not retryable
        if (
          error instanceof DOMException && error.name === 'AbortError' ||
          (error instanceof ApiError && !error.retryable) ||
          attempt >= maxRetries
        ) {
          throw error;
        }
        
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }
  
  /**
   * Execute a single request
   * 
   * @param url Request URL
   * @param options Request options
   * @returns Promise resolving to API response
   */
  private async executeRequest<T>(
    url: string,
    options: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', headers, body, signal } = options;
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
      signal
    };
    
    // Add body for non-GET requests
    if (body && method !== 'GET') {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    // Execute request
    const response = await fetch(url, requestOptions);
    const timestamp = Date.now();
    
    // Handle error responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON, use text
        errorData = await response.text();
      }
      
      throw new ApiError(
        errorData?.message || `Request failed with status ${response.status}`,
        response.status,
        url,
        method,
        errorData
      );
    }
    
    // Parse response
    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text() as unknown as T;
    } else {
      data = await response.blob() as unknown as T;
    }
    
    return {
      data,
      status: response.status,
      headers: response.headers,
      fromCache: false,
      timestamp
    };
  }
  
  /**
   * Cancel all active requests
   */
  cancelAll(): void {
    this.activeRequests.forEach(controller => {
      controller.abort();
    });
    this.activeRequests.clear();
  }
  
  /**
   * Clear the cache
   * 
   * @param url Optional URL pattern to clear specific cache entries
   */
  clearCache(url?: string | RegExp): void {
    if (!url) {
      this.cache.clear();
      return;
    }
    
    const pattern = url instanceof RegExp ? url : new RegExp(url);
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Create a hook-friendly request function
   * 
   * @param url Request URL
   * @param options Request options
   * @returns Function to execute the request
   */
  createRequest<T>(url: string, options: ApiRequestOptions = {}) {
    return async (): Promise<ApiResponse<T>> => {
      return this.request<T>(url, options);
    };
  }
}

/**
 * Governance API service using the enhanced API client
 */
export class GovernanceApiService {
  private apiClient: ApiClient;
  
  constructor(baseUrl: string = '/api') {
    this.apiClient = new ApiClient(baseUrl);
  }
  
  /**
   * Fetch all available profiles
   * 
   * @returns Promise resolving to array of profiles
   */
  async fetchProfiles() {
    const response = await this.apiClient.request('/governance/profiles');
    return response.data;
  }
  
  /**
   * Fetch a specific profile by domain and version
   * 
   * @param domain Governance domain
   * @param version Optional version
   * @returns Promise resolving to profile
   */
  async fetchProfile(domain: GovernanceDomain, version?: string) {
    const url = `/governance/profiles/${domain}${version ? `/${version}` : ''}`;
    const response = await this.apiClient.request(url);
    return response.data;
  }
  
  /**
   * Update a profile
   * 
   * @param domain Governance domain
   * @param profile Profile data
   * @returns Promise resolving to updated profile
   */
  async updateProfile(domain: GovernanceDomain, profile: any) {
    const response = await this.apiClient.request(`/governance/profiles/${domain}`, {
      method: 'PUT',
      body: profile,
      cache: false
    });
    
    // Clear cache for this domain
    this.apiClient.clearCache(new RegExp(`/governance/profiles/${domain}`));
    
    return response.data;
  }
  
  /**
   * Create a new profile
   * 
   * @param profile Profile data
   * @returns Promise resolving to created profile
   */
  async createProfile(profile: any) {
    const response = await this.apiClient.request('/governance/profiles', {
      method: 'POST',
      body: profile,
      cache: false
    });
    
    // Clear profiles cache
    this.apiClient.clearCache('/governance/profiles');
    
    return response.data;
  }
  
  /**
   * Delete a profile
   * 
   * @param domain Governance domain
   * @param version Optional version
   * @returns Promise resolving to success status
   */
  async deleteProfile(domain: GovernanceDomain, version?: string) {
    const url = `/governance/profiles/${domain}${version ? `/${version}` : ''}`;
    const response = await this.apiClient.request(url, {
      method: 'DELETE',
      cache: false
    });
    
    // Clear cache for this domain
    this.apiClient.clearCache(new RegExp(`/governance/profiles/${domain}`));
    this.apiClient.clearCache('/governance/profiles');
    
    return response.data;
  }
}
