/**
 * VERITAS Enforcement Hook
 * 
 * This hook connects the VERITAS enforcement module to the governance pipeline.
 * It provides a React hook interface for components to use VERITAS enforcement.
 */

import { useState, useEffect, useCallback } from 'react';
import { processWithVeritas, VeritasIntegrationOptions, VeritasIntegrationResult } from '../enforcement/veritasIntegration';
import { isVeritasEnabled } from '../config';

/**
 * Hook to use VERITAS enforcement in components
 * @param options VERITAS integration options
 * @returns Hook interface for VERITAS enforcement
 */
export default function useVeritasEnforcement(options: Partial<VeritasIntegrationOptions> = {}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<VeritasIntegrationResult | null>(null);
  
  /**
   * Process a response through VERITAS
   * @param response Response text to process
   * @param trustScore Current trust score
   */
  const processResponse = useCallback(async (
    response: string,
    trustScore: number = 0
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Skip VERITAS processing if disabled via config
      if (!isVeritasEnabled()) {
        const bypassResult: VeritasIntegrationResult = {
          enforcement: {
            blocked: false,
            enforcedResponse: response,
            warnings: []
          },
          trustScoreAdjustment: 0,
          observerNotes: 'VERITAS: Disabled via configuration',
          claims: [],
          verificationResults: []
        };
        setResult(bypassResult);
        return bypassResult;
      }
      
      const result = await processWithVeritas(response, trustScore, options);
      setResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options]);
  
  /**
   * Check if a response should be blocked based on VERITAS enforcement
   * @param response Response text to check
   * @param trustScore Current trust score
   * @returns Whether the response should be blocked
   */
  const shouldBlockResponse = useCallback(async (
    response: string,
    trustScore: number = 0
  ): Promise<boolean> => {
    // Skip VERITAS processing if disabled via config
    if (!isVeritasEnabled()) {
      return false;
    }
    
    try {
      const result = await processWithVeritas(response, trustScore, options);
      return result.enforcement.blocked;
    } catch (err) {
      console.error('Error checking if response should be blocked:', err);
      return false; // Default to not blocking on error
    }
  }, [options]);
  
  /**
   * Get the enforced response (with warnings or blocked message if needed)
   * @param response Original response text
   * @param trustScore Current trust score
   * @returns Enforced response
   */
  const getEnforcedResponse = useCallback(async (
    response: string,
    trustScore: number = 0
  ): Promise<string> => {
    // Skip VERITAS processing if disabled via config
    if (!isVeritasEnabled()) {
      return response;
    }
    
    try {
      const result = await processWithVeritas(response, trustScore, options);
      return result.enforcement.enforcedResponse;
    } catch (err) {
      console.error('Error getting enforced response:', err);
      return response; // Return original response on error
    }
  }, [options]);
  
  /**
   * Get trust score adjustment based on VERITAS verification
   * @param response Response text to check
   * @param trustScore Current trust score
   * @returns Trust score adjustment
   */
  const getTrustScoreAdjustment = useCallback(async (
    response: string,
    trustScore: number = 0
  ): Promise<number> => {
    // Skip VERITAS processing if disabled via config
    if (!isVeritasEnabled()) {
      return 0;
    }
    
    try {
      const result = await processWithVeritas(response, trustScore, options);
      return result.trustScoreAdjustment;
    } catch (err) {
      console.error('Error getting trust score adjustment:', err);
      return 0; // No adjustment on error
    }
  }, [options]);
  
  /**
   * Get observer notes based on VERITAS verification
   * @param response Response text to check
   * @param trustScore Current trust score
   * @returns Observer notes
   */
  const getObserverNotes = useCallback(async (
    response: string,
    trustScore: number = 0
  ): Promise<string> => {
    // Skip VERITAS processing if disabled via config
    if (!isVeritasEnabled()) {
      return 'VERITAS: Disabled via configuration';
    }
    
    try {
      const result = await processWithVeritas(response, trustScore, options);
      return result.observerNotes;
    } catch (err) {
      console.error('Error getting observer notes:', err);
      return 'VERITAS: Error during processing'; // Default note on error
    }
  }, [options]);
  
  return {
    loading,
    error,
    result,
    processResponse,
    shouldBlockResponse,
    getEnforcedResponse,
    getTrustScoreAdjustment,
    getObserverNotes
  };
}
