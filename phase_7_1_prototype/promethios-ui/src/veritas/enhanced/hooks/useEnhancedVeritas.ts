/**
 * Enhanced Veritas React Hook
 * 
 * React hook for managing Enhanced Veritas 2 functionality including uncertainty analysis,
 * HITL collaboration, and enhanced verification workflows.
 */

import { useState, useCallback, useRef } from 'react';
import {
  EnhancedVerificationResult,
  EnhancedVeritasOptions,
  HITLSession,
  HITLSessionConfig,
  HITLResponse,
  HITLResolution,
  UncertaintyAnalysis
} from '../types';
import { enhancedVeritasService } from '../enhancedVeritasService';

interface UseEnhancedVeritasReturn {
  // State
  result: EnhancedVerificationResult | null;
  loading: boolean;
  error: string | null;
  hitlSession: HITLSession | null;
  
  // Actions
  verifyTextEnhanced: (text: string, options?: EnhancedVeritasOptions) => Promise<void>;
  startHITLSession: (config: HITLSessionConfig) => Promise<void>;
  processHumanFeedback: (sessionId: string, questionId: string, response: HITLResponse) => Promise<void>;
  completeHITLSession: (sessionId: string) => Promise<HITLResolution>;
  analyzeUncertainty: (text: string, options?: EnhancedVeritasOptions) => Promise<UncertaintyAnalysis>;
  
  // Utilities
  clearResults: () => void;
  getMetrics: () => any;
  shouldTriggerHITL: (threshold?: number) => boolean;
}

export const useEnhancedVeritas = (): UseEnhancedVeritasReturn => {
  const [result, setResult] = useState<EnhancedVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hitlSession, setHitlSession] = useState<HITLSession | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Perform enhanced text verification
   */
  const verifyTextEnhanced = useCallback(async (
    text: string, 
    options: EnhancedVeritasOptions = {}
  ): Promise<void> => {
    // Cancel any ongoing verification
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const enhancedResult = await enhancedVeritasService.verifyTextEnhanced(text, options);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setResult(enhancedResult);

      // Auto-trigger HITL if configured and uncertainty is high
      if (options.hitlCollaboration && 
          enhancedResult.uncertaintyAnalysis &&
          enhancedVeritasService.shouldTriggerHITL(
            enhancedResult.uncertaintyAnalysis, 
            options.hitlThreshold
          )) {
        
        const sessionConfig: HITLSessionConfig = {
          uncertaintyAnalysis: enhancedResult.uncertaintyAnalysis,
          context: options.context || {},
          strategy: options.clarificationStrategy,
          priority: determineSessionPriority(enhancedResult.uncertaintyAnalysis)
        };

        await startHITLSession(sessionConfig);
      }

    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return; // Don't set error for aborted requests
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Enhanced verification failed:', err);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Start HITL collaboration session
   */
  const startHITLSession = useCallback(async (config: HITLSessionConfig): Promise<void> => {
    try {
      setError(null);
      const session = await enhancedVeritasService.initiateHITLSession(config);
      setHitlSession(session);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start HITL session';
      setError(errorMessage);
      console.error('HITL session start failed:', err);
    }
  }, []);

  /**
   * Process human feedback in HITL session
   */
  const processHumanFeedback = useCallback(async (
    sessionId: string,
    questionId: string,
    response: HITLResponse
  ): Promise<void> => {
    try {
      setError(null);
      const updatedSession = await enhancedVeritasService.processHumanFeedback(
        sessionId,
        questionId,
        response
      );
      setHitlSession(updatedSession);

      // Update result with new uncertainty analysis if available
      if (result && updatedSession.config.uncertaintyAnalysis) {
        setResult(prev => prev ? {
          ...prev,
          uncertaintyAnalysis: updatedSession.config.uncertaintyAnalysis,
          hitlSession: updatedSession
        } : null);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process feedback';
      setError(errorMessage);
      console.error('Human feedback processing failed:', err);
    }
  }, [result]);

  /**
   * Complete HITL session
   */
  const completeHITLSession = useCallback(async (sessionId: string): Promise<HITLResolution> => {
    try {
      setError(null);
      const resolution = await enhancedVeritasService.completeHITLSession(sessionId);
      
      // Update session status
      if (hitlSession && hitlSession.id === sessionId) {
        setHitlSession(prev => prev ? {
          ...prev,
          status: 'completed',
          endTime: new Date(),
          resolution
        } : null);
      }

      // Update result with enhanced verification result
      if (result && resolution.enhancedResult) {
        setResult(resolution.enhancedResult);
      }

      return resolution;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete session';
      setError(errorMessage);
      console.error('HITL session completion failed:', err);
      throw err;
    }
  }, [hitlSession, result]);

  /**
   * Analyze uncertainty for existing text
   */
  const analyzeUncertainty = useCallback(async (
    text: string,
    options: EnhancedVeritasOptions = {}
  ): Promise<UncertaintyAnalysis> => {
    try {
      setError(null);
      
      // If we have a current result, use it for uncertainty analysis
      if (result) {
        return await enhancedVeritasService.analyzeUncertaintyForResult(
          text,
          result,
          options.context
        );
      }

      // Otherwise, perform a full verification first
      await verifyTextEnhanced(text, { ...options, uncertaintyAnalysis: true });
      
      if (result?.uncertaintyAnalysis) {
        return result.uncertaintyAnalysis;
      }

      throw new Error('Failed to generate uncertainty analysis');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Uncertainty analysis failed';
      setError(errorMessage);
      console.error('Uncertainty analysis failed:', err);
      throw err;
    }
  }, [result, verifyTextEnhanced]);

  /**
   * Clear all results and reset state
   */
  const clearResults = useCallback(() => {
    // Cancel any ongoing verification
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setResult(null);
    setError(null);
    setHitlSession(null);
    setLoading(false);
  }, []);

  /**
   * Get enhanced verification metrics
   */
  const getMetrics = useCallback(() => {
    if (!result) return null;
    
    return enhancedVeritasService.getEnhancedMetrics(result);
  }, [result]);

  /**
   * Check if HITL should be triggered
   */
  const shouldTriggerHITL = useCallback((threshold?: number): boolean => {
    if (!result?.uncertaintyAnalysis) return false;
    
    return enhancedVeritasService.shouldTriggerHITL(result.uncertaintyAnalysis, threshold);
  }, [result]);

  /**
   * Helper function to determine session priority
   */
  const determineSessionPriority = (uncertainty: UncertaintyAnalysis): 'low' | 'medium' | 'high' | 'critical' => {
    if (uncertainty.overallUncertainty > 0.9) return 'critical';
    if (uncertainty.overallUncertainty > 0.7) return 'high';
    if (uncertainty.overallUncertainty > 0.4) return 'medium';
    return 'low';
  };

  return {
    // State
    result,
    loading,
    error,
    hitlSession,
    
    // Actions
    verifyTextEnhanced,
    startHITLSession,
    processHumanFeedback,
    completeHITLSession,
    analyzeUncertainty,
    
    // Utilities
    clearResults,
    getMetrics,
    shouldTriggerHITL
  };
};

/**
 * Hook for managing multiple HITL sessions
 */
export const useMultipleHITLSessions = () => {
  const [sessions, setSessions] = useState<Map<string, HITLSession>>(new Map());
  const [activeSessions, setActiveSessions] = useState<HITLSession[]>([]);

  const addSession = useCallback((session: HITLSession) => {
    setSessions(prev => new Map(prev).set(session.id, session));
    setActiveSessions(prev => [...prev.filter(s => s.id !== session.id), session]);
  }, []);

  const updateSession = useCallback((sessionId: string, updatedSession: HITLSession) => {
    setSessions(prev => new Map(prev).set(sessionId, updatedSession));
    setActiveSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
  }, []);

  const removeSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const newMap = new Map(prev);
      newMap.delete(sessionId);
      return newMap;
    });
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const getSession = useCallback((sessionId: string): HITLSession | undefined => {
    return sessions.get(sessionId);
  }, [sessions]);

  const getActiveSessionCount = useCallback((): number => {
    return activeSessions.filter(s => s.status === 'active').length;
  }, [activeSessions]);

  return {
    sessions: Array.from(sessions.values()),
    activeSessions,
    addSession,
    updateSession,
    removeSession,
    getSession,
    getActiveSessionCount
  };
};

/**
 * Hook for uncertainty analysis only
 */
export const useUncertaintyAnalysis = () => {
  const [analysis, setAnalysis] = useState<UncertaintyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeUncertainty = useCallback(async (
    text: string,
    baseResult?: any,
    context?: any
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      let uncertaintyAnalysis: UncertaintyAnalysis;

      if (baseResult) {
        uncertaintyAnalysis = await enhancedVeritasService.analyzeUncertaintyForResult(
          text,
          baseResult,
          context
        );
      } else {
        // Perform basic verification first
        const result = await enhancedVeritasService.verifyTextEnhanced(text, {
          uncertaintyAnalysis: true,
          context
        });
        uncertaintyAnalysis = result.uncertaintyAnalysis;
      }

      setAnalysis(uncertaintyAnalysis);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Uncertainty analysis failed';
      setError(errorMessage);
      console.error('Uncertainty analysis failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    analyzeUncertainty,
    clearAnalysis
  };
};

