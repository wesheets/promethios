/**
 * Enhanced Analytics Provider
 * 
 * Provides comprehensive analytics and metrics tracking throughout the application.
 * Integrates with Firebase Analytics and the centralized metrics collection service.
 */

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { metricsService } from '../../services/MetricsCollectionService';

interface AnalyticsContextType {
  // Legacy method for backward compatibility
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  
  // Enhanced metrics methods
  trackUserInteraction: (type: string, page: string, element?: string, action?: string, metadata?: Record<string, any>) => Promise<void>;
  trackPerformance: (metric: string, value: number, unit: string, metadata?: Record<string, any>) => Promise<void>;
  trackGovernance: (metric: string, value: number, agentId?: string, metadata?: Record<string, any>) => Promise<void>;
  trackBusiness: (metric: string, value: number, cohort?: string, metadata?: Record<string, any>) => Promise<void>;
  
  // Convenience methods
  trackPageView: (page: string, metadata?: Record<string, any>) => Promise<void>;
  trackButtonClick: (page: string, element: string, metadata?: Record<string, any>) => Promise<void>;
  trackFormSubmit: (page: string, formName: string, success: boolean, metadata?: Record<string, any>) => Promise<void>;
  trackFeatureUsage: (page: string, feature: string, action: string, metadata?: Record<string, any>) => Promise<void>;
  trackError: (page: string, error: Error, metadata?: Record<string, any>) => Promise<void>;
  
  // Service information
  isInitialized: boolean;
  sessionInfo: {
    sessionId: string;
    userId?: string;
    environment: string;
    isInitialized: boolean;
  };
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize metrics service when user changes
  useEffect(() => {
    const initializeMetrics = async () => {
      try {
        const userId = currentUser?.uid;
        const userProperties = currentUser ? {
          user_id: currentUser.uid,
          email: currentUser.email,
          display_name: currentUser.displayName,
          email_verified: currentUser.emailVerified,
          creation_time: currentUser.metadata.creationTime,
          last_sign_in_time: currentUser.metadata.lastSignInTime
        } : undefined;

        await metricsService.initialize(userId, userProperties);
        setIsInitialized(true);
        
        // Reduced logging - only log once per session per user
        const logKey = `analytics_initialized_${userId || 'anonymous'}`;
        if (!sessionStorage.getItem(logKey)) {
          console.log('🎯 Analytics Provider initialized with user:', userId);
          sessionStorage.setItem(logKey, 'true');
        }
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    };

    initializeMetrics();
  }, [currentUser]);

  // Update user when authentication state changes
  useEffect(() => {
    if (isInitialized) {
      const userId = currentUser?.uid;
      const userProperties = currentUser ? {
        user_id: currentUser.uid,
        email: currentUser.email,
        display_name: currentUser.displayName,
        email_verified: currentUser.emailVerified
      } : undefined;

      metricsService.setUser(userId, userProperties);
    }
  }, [currentUser, isInitialized]);

  // Legacy trackEvent method for backward compatibility
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    console.log('📊 Legacy event tracked:', eventName, properties);
    
    // Convert legacy events to new format
    metricsService.trackUserInteraction({
      type: 'feature_usage',
      page: 'legacy',
      element: eventName,
      action: 'legacy_event',
      metadata: properties
    }).catch(error => {
      console.error('Failed to track legacy event:', error);
    });
  };

  // Enhanced metrics methods
  const trackUserInteraction = async (
    type: string, 
    page: string, 
    element?: string, 
    action?: string, 
    metadata?: Record<string, any>
  ) => {
    await metricsService.trackUserInteraction({
      type: type as any,
      page,
      element,
      action,
      metadata
    });
  };

  const trackPerformance = async (
    metric: string, 
    value: number, 
    unit: string, 
    metadata?: Record<string, any>
  ) => {
    await metricsService.trackPerformance({
      type: 'page_load',
      metric,
      value,
      unit: unit as any,
      metadata
    });
  };

  const trackGovernance = async (
    metric: string, 
    value: number, 
    agentId?: string, 
    metadata?: Record<string, any>
  ) => {
    await metricsService.trackGovernance({
      type: 'trust_score',
      metric,
      value,
      agentId,
      metadata
    });
  };

  const trackBusiness = async (
    metric: string, 
    value: number, 
    cohort?: string, 
    metadata?: Record<string, any>
  ) => {
    await metricsService.trackBusiness({
      type: 'user_engagement',
      metric,
      value,
      cohort,
      metadata
    });
  };

  // Convenience methods that delegate to metrics service
  const trackPageView = async (page: string, metadata?: Record<string, any>) => {
    await metricsService.trackPageView(page, metadata);
  };

  const trackButtonClick = async (page: string, element: string, metadata?: Record<string, any>) => {
    await metricsService.trackButtonClick(page, element, metadata);
  };

  const trackFormSubmit = async (page: string, formName: string, success: boolean, metadata?: Record<string, any>) => {
    await metricsService.trackFormSubmit(page, formName, success, metadata);
  };

  const trackFeatureUsage = async (page: string, feature: string, action: string, metadata?: Record<string, any>) => {
    await metricsService.trackFeatureUsage(page, feature, action, metadata);
  };

  const trackError = async (page: string, error: Error, metadata?: Record<string, any>) => {
    await metricsService.trackError(page, error, metadata);
  };

  // Get session information
  const sessionInfo = metricsService.getSessionInfo();

  const contextValue: AnalyticsContextType = {
    // Legacy
    trackEvent,
    
    // Enhanced methods
    trackUserInteraction,
    trackPerformance,
    trackGovernance,
    trackBusiness,
    
    // Convenience methods
    trackPageView,
    trackButtonClick,
    trackFormSubmit,
    trackFeatureUsage,
    trackError,
    
    // Service info
    isInitialized,
    sessionInfo
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsProvider;
