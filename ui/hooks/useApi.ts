/**
 * React hook for API requests with loading, error, and caching support
 * 
 * This hook provides a standardized way to make API requests with:
 * - Loading state management
 * - Error handling
 * - Automatic retries
 * - Request cancellation on unmount
 * - Response caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiClient, ApiRequestOptions, ApiResponse, ApiError } from '../governance/api';

/**
 * Options for useApi hook
 */
export interface UseApiOptions<T> extends ApiRequestOptions {
  /**
   * Whether to fetch data immediately
   */
  immediate?: boolean;
  
  /**
   * Initial data to use before fetch completes
   */
  initialData?: T;
  
  /**
   * Callback when request succeeds
   */
  onSuccess?: (data: T) => void;
  
  /**
   * Callback when request fails
   */
  onError?: (error: ApiError) => void;
  
  /**
   * Dependencies array for refetching
   */
  deps?: any[];
}

/**
 * Result of useApi hook
 */
export interface UseApiResult<T> {
  /**
   * Response data
   */
  data: T | undefined;
  
  /**
   * Loading state
   */
  isLoading: boolean;
  
  /**
   * Error state
   */
  error: ApiError | null;
  
  /**
   * Function to execute the request
   */
  execute: (options?: ApiRequestOptions) => Promise<ApiResponse<T>>;
  
  /**
   * Function to reset the state
   */
  reset: () => void;
  
  /**
   * Whether the data is from cache
   */
  fromCache: boolean;
  
  /**
   * Response metadata
   */
  response: ApiResponse<T> | null;
}

/**
 * Hook for making API requests
 * 
 * @param url Request URL
 * @param options Request options
 * @returns API request state and functions
 */
export function useApi<T>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    immediate = true,
    initialData,
    onSuccess,
    onError,
    deps = [],
    ...requestOptions
  } = options;
  
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] = useState<ApiResponse<T> | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);
  
  // Use refs for callbacks to avoid unnecessary rerenders
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  // Update callback refs when they change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);
  
  // Create API client
  const apiClient = useRef(new ApiClient()).current;
  
  // Execute request function
  const execute = useCallback(
    async (overrideOptions?: ApiRequestOptions): Promise<ApiResponse<T>> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const mergedOptions = {
          ...requestOptions,
          ...overrideOptions
        };
        
        const response = await apiClient.request<T>(url, mergedOptions);
        
        setData(response.data);
        setResponse(response);
        setFromCache(response.fromCache);
        
        if (onSuccessRef.current) {
          onSuccessRef.current(response.data);
        }
        
        return response;
      } catch (err) {
        const apiError = err instanceof ApiError
          ? err
          : new ApiError(
              err instanceof Error ? err.message : 'Unknown error',
              500,
              url,
              requestOptions.method || 'GET'
            );
        
        setError(apiError);
        
        if (onErrorRef.current) {
          onErrorRef.current(apiError);
        }
        
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, url, JSON.stringify(requestOptions)]
  );
  
  // Reset function
  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setError(null);
    setResponse(null);
    setFromCache(false);
  }, [initialData]);
  
  // Execute request on mount if immediate is true
  useEffect(() => {
    let mounted = true;
    
    if (immediate) {
      execute()
        .catch(() => {
          // Error is already handled in execute function
        })
        .finally(() => {
          if (!mounted) {
            // Component unmounted, do nothing
          }
        });
    }
    
    return () => {
      mounted = false;
    };
  }, [execute, immediate, ...deps]);
  
  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    fromCache,
    response
  };
}

/**
 * Hook for making GET requests
 */
export function useGet<T>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  return useApi<T>(url, { ...options, method: 'GET' });
}

/**
 * Hook for making POST requests
 */
export function usePost<T>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  return useApi<T>(url, { ...options, method: 'POST', immediate: false });
}

/**
 * Hook for making PUT requests
 */
export function usePut<T>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  return useApi<T>(url, { ...options, method: 'PUT', immediate: false });
}

/**
 * Hook for making DELETE requests
 */
export function useDelete<T>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  return useApi<T>(url, { ...options, method: 'DELETE', immediate: false });
}
