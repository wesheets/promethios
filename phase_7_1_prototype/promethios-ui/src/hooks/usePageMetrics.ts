/**
 * Page Metrics Hook
 * 
 * React hook for tracking page-level metrics including page views,
 * user interactions, performance metrics, and feature usage.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { metricsService } from '../services/MetricsCollectionService';

interface UsePageMetricsOptions {
  pageName?: string;
  trackPageView?: boolean;
  trackPerformance?: boolean;
  trackUserInteractions?: boolean;
  metadata?: Record<string, any>;
}

interface PageMetricsReturn {
  trackButtonClick: (element: string, metadata?: Record<string, any>) => Promise<void>;
  trackFormSubmit: (formName: string, success: boolean, metadata?: Record<string, any>) => Promise<void>;
  trackFeatureUsage: (feature: string, action: string, metadata?: Record<string, any>) => Promise<void>;
  trackCustomEvent: (eventType: string, data: Record<string, any>) => Promise<void>;
  trackError: (error: Error, metadata?: Record<string, any>) => Promise<void>;
  getPageName: () => string;
}

export const usePageMetrics = (options: UsePageMetricsOptions = {}): PageMetricsReturn => {
  const location = useLocation();
  const pageLoadTimeRef = useRef<number>(Date.now());
  const hasTrackedPageViewRef = useRef<boolean>(false);

  const {
    pageName,
    trackPageView = true,
    trackPerformance = true,
    trackUserInteractions = true,
    metadata = {}
  } = options;

  // Determine page name from route or provided name
  const getPageName = useCallback((): string => {
    if (pageName) return pageName;
    
    const path = location.pathname;
    
    // Map common routes to readable names
    const routeMap: Record<string, string> = {
      '/': 'landing',
      '/ui/dashboard': 'dashboard',
      '/ui/governance': 'governance',
      '/ui/governance/overview': 'governance_overview',
      '/ui/governance/policies': 'governance_policies',
      '/ui/governance/violations': 'governance_violations',
      '/ui/governance/reports': 'governance_reports',
      '/ui/agents': 'agents',
      '/ui/agents/manage': 'agent_management',
      '/ui/agents/profiles': 'agent_profiles',
      '/ui/trust': 'trust',
      '/ui/trust/overview': 'trust_overview',
      '/ui/settings': 'settings',
      '/ui/settings/profile': 'user_profile',
      '/ui/help': 'help',
      '/ui/onboarding': 'onboarding',
      '/login': 'login',
      '/signup': 'signup'
    };

    return routeMap[path] || path.replace(/^\//, '').replace(/\//g, '_') || 'unknown';
  }, [location.pathname, pageName]);

  // Track page view when component mounts or route changes
  useEffect(() => {
    const currentPageName = getPageName();
    
    if (trackPageView && !hasTrackedPageViewRef.current) {
      const pageViewMetadata = {
        ...metadata,
        route: location.pathname,
        search: location.search,
        hash: location.hash,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        timestamp: new Date().toISOString()
      };

      metricsService.trackPageView(currentPageName, pageViewMetadata);
      hasTrackedPageViewRef.current = true;
      
      console.log(`📄 Page view tracked: ${currentPageName}`);
    }

    // Reset page load time for new page
    pageLoadTimeRef.current = Date.now();
  }, [location, trackPageView, metadata, getPageName]);

  // Track page load performance
  useEffect(() => {
    if (!trackPerformance) return;

    const handleLoad = () => {
      const loadTime = Date.now() - pageLoadTimeRef.current;
      const currentPageName = getPageName();
      
      metricsService.trackPageLoadTime(currentPageName, loadTime);
      console.log(`⚡ Page load time tracked: ${currentPageName} - ${loadTime}ms`);
    };

    // Track load time when page is fully loaded
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [trackPerformance, getPageName]);

  // Track page visibility changes
  useEffect(() => {
    if (!trackUserInteractions) return;

    const handleVisibilityChange = () => {
      const currentPageName = getPageName();
      const isVisible = !document.hidden;
      
      metricsService.trackFeatureUsage(
        currentPageName,
        'page_visibility',
        isVisible ? 'visible' : 'hidden',
        {
          timestamp: new Date().toISOString(),
          visibility_state: document.visibilityState
        }
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [trackUserInteractions, getPageName]);

  // Track button clicks
  const trackButtonClick = useCallback(async (element: string, eventMetadata?: Record<string, any>) => {
    if (!trackUserInteractions) return;
    
    const currentPageName = getPageName();
    await metricsService.trackButtonClick(currentPageName, element, {
      ...metadata,
      ...eventMetadata,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🖱️ Button click tracked: ${currentPageName} - ${element}`);
  }, [trackUserInteractions, metadata, getPageName]);

  // Track form submissions
  const trackFormSubmit = useCallback(async (formName: string, success: boolean, eventMetadata?: Record<string, any>) => {
    if (!trackUserInteractions) return;
    
    const currentPageName = getPageName();
    await metricsService.trackFormSubmit(currentPageName, formName, success, {
      ...metadata,
      ...eventMetadata,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📝 Form submit tracked: ${currentPageName} - ${formName} - ${success ? 'success' : 'error'}`);
  }, [trackUserInteractions, metadata, getPageName]);

  // Track feature usage
  const trackFeatureUsage = useCallback(async (feature: string, action: string, eventMetadata?: Record<string, any>) => {
    if (!trackUserInteractions) return;
    
    const currentPageName = getPageName();
    await metricsService.trackFeatureUsage(currentPageName, feature, action, {
      ...metadata,
      ...eventMetadata,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🎯 Feature usage tracked: ${currentPageName} - ${feature} - ${action}`);
  }, [trackUserInteractions, metadata, getPageName]);

  // Track custom events
  const trackCustomEvent = useCallback(async (eventType: string, data: Record<string, any>) => {
    const currentPageName = getPageName();
    
    await metricsService.trackUserInteraction({
      type: 'feature_usage',
      page: currentPageName,
      element: eventType,
      action: 'custom_event',
      metadata: {
        ...metadata,
        ...data,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(`🔧 Custom event tracked: ${currentPageName} - ${eventType}`);
  }, [metadata, getPageName]);

  // Track errors
  const trackError = useCallback(async (error: Error, eventMetadata?: Record<string, any>) => {
    const currentPageName = getPageName();
    await metricsService.trackError(currentPageName, error, {
      ...metadata,
      ...eventMetadata,
      timestamp: new Date().toISOString()
    });
    
    console.error(`❌ Error tracked: ${currentPageName} - ${error.message}`);
  }, [metadata, getPageName]);

  // Reset page view tracking when route changes
  useEffect(() => {
    hasTrackedPageViewRef.current = false;
  }, [location.pathname]);

  return {
    trackButtonClick,
    trackFormSubmit,
    trackFeatureUsage,
    trackCustomEvent,
    trackError,
    getPageName
  };
};

export default usePageMetrics;

