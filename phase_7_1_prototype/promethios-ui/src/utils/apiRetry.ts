/**
 * API Retry Utility
 * Handles retries for API calls, especially useful for services that may be sleeping (cold starts)
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

/**
 * Default retry condition - retry on network errors, 5xx errors, and 404s (for cold starts)
 */
const defaultRetryCondition = (error: any): boolean => {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // HTTP errors
  if (error.status) {
    // Retry on server errors (5xx)
    if (error.status >= 500) {
      return true;
    }
    
    // Retry on 404 (service might be cold starting)
    if (error.status === 404) {
      return true;
    }
    
    // Retry on 503 (service unavailable)
    if (error.status === 503) {
      return true;
    }
  }
  
  return false;
};

/**
 * Retry an async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = defaultRetryCondition
  } = options;

  const startTime = Date.now();
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 API call attempt ${attempt + 1}/${maxRetries + 1}`);
      const result = await fn();
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ API call succeeded on attempt ${attempt + 1} (${totalTime}ms)`);
      
      return {
        success: true,
        data: result,
        attempts: attempt + 1,
        totalTime
      };
    } catch (error) {
      lastError = error;
      console.log(`❌ API call failed on attempt ${attempt + 1}:`, error);
      
      // Don't retry if this is the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry if the error doesn't meet retry conditions
      if (!retryCondition(error)) {
        console.log(`🚫 Error doesn't meet retry conditions, stopping retries`);
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`💥 All API call attempts failed (${totalTime}ms)`);
  
  return {
    success: false,
    error: lastError,
    attempts: maxRetries + 1,
    totalTime
  };
}

/**
 * Retry a fetch request with specific handling for deployment API
 */
export async function retryFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const result = await retryWithBackoff(async () => {
    const response = await fetch(url, options);
    
    // Check if response is ok
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).response = response;
      throw error;
    }
    
    return response;
  }, {
    maxRetries: 5, // More retries for deployment API
    baseDelay: 2000, // Longer initial delay for cold starts
    maxDelay: 15000, // Allow longer delays
    ...retryOptions
  });
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data!;
}

/**
 * Retry a JSON API call
 */
export async function retryJsonFetch<T>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const response = await retryFetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }, retryOptions);
  
  return await response.json();
}

/**
 * Specific retry function for deployment API calls
 */
export async function retryDeploymentAPI<T>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  console.log(`🚀 Making deployment API call to: ${url}`);
  
  return await retryJsonFetch<T>(url, options, {
    maxRetries: 5,
    baseDelay: 3000, // 3 second initial delay for cold starts
    maxDelay: 20000, // Up to 20 seconds for deployment API
    retryCondition: (error) => {
      // Always retry deployment API errors that might be cold starts
      if (error.status === 404 || error.status === 503 || error.status >= 500) {
        console.log(`🔄 Retrying deployment API call due to ${error.status} error (likely cold start)`);
        return true;
      }
      return defaultRetryCondition(error);
    },
    ...retryOptions
  });
}

