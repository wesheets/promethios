/**
 * Metrics Collection Service
 * 
 * Centralized service for collecting, storing, and managing all types of metrics
 * across the Promethios application. Integrates with Firebase Analytics and Firestore.
 */

import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import app, { db } from '../firebase/config';

// Types for different metric categories
export interface UserInteractionMetric {
  type: 'page_view' | 'button_click' | 'form_submit' | 'navigation' | 'feature_usage';
  page: string;
  element?: string;
  action?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  type: 'page_load' | 'api_response' | 'error_rate' | 'resource_usage';
  metric: string;
  value: number;
  unit: 'ms' | 'bytes' | 'percentage' | 'count';
  metadata?: Record<string, any>;
}

export interface GovernanceMetric {
  type: 'trust_score' | 'compliance_rate' | 'violation_count' | 'agent_activity';
  agentId?: string;
  metric: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface BusinessMetric {
  type: 'user_engagement' | 'feature_adoption' | 'retention' | 'conversion';
  metric: string;
  value: number;
  cohort?: string;
  metadata?: Record<string, any>;
}

export type MetricData = UserInteractionMetric | PerformanceMetric | GovernanceMetric | BusinessMetric;

export interface MetricEvent {
  id?: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  category: 'user_interaction' | 'performance' | 'governance' | 'business';
  data: MetricData;
  environment: 'development' | 'staging' | 'production';
}

export class MetricsCollectionService {
  private analytics;
  private firestore;
  private sessionId: string;
  private userId?: string;
  private environment: 'development' | 'staging' | 'production';
  private isInitialized = false;

  constructor() {
    this.analytics = getAnalytics(app);
    this.firestore = db; // Use the shared db instance configured for promethios-oregon
    this.sessionId = this.generateSessionId();
    this.environment = this.detectEnvironment();
    console.log('🔧 MetricsCollectionService: Using shared Firestore instance (promethios-oregon)');
  }

  /**
   * Initialize the metrics service with user information
   */
  async initialize(userId?: string, userProperties?: Record<string, any>) {
    try {
      if (userId) {
        this.userId = userId;
        setUserId(this.analytics, userId);
      }

      if (userProperties) {
        setUserProperties(this.analytics, userProperties);
      }

      // Log initialization event
      await this.trackEvent('system', {
        type: 'feature_usage',
        page: 'system',
        action: 'metrics_initialized',
        metadata: {
          environment: this.environment,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        }
      } as UserInteractionMetric);

      this.isInitialized = true;
      // Reduced logging - only log once per session
      if (!sessionStorage.getItem('metrics_initialized')) {
        console.log('🎯 Metrics Collection Service initialized');
        sessionStorage.setItem('metrics_initialized', 'true');
      }
    } catch (error) {
      console.error('Failed to initialize metrics service:', error);
    }
  }

  /**
   * Track a user interaction event
   */
  async trackUserInteraction(data: UserInteractionMetric) {
    return this.trackEvent('user_interaction', data);
  }

  /**
   * Track a performance metric
   */
  async trackPerformance(data: PerformanceMetric) {
    return this.trackEvent('performance', data);
  }

  /**
   * Track a governance metric
   */
  async trackGovernance(data: GovernanceMetric) {
    return this.trackEvent('governance', data);
  }

  /**
   * Track a business metric
   */
  async trackBusiness(data: BusinessMetric) {
    return this.trackEvent('business', data);
  }

  /**
   * Generic event tracking method
   */
  private async trackEvent(category: MetricEvent['category'], data: MetricData) {
    try {
      // Skip tracking if userId is not set to prevent Firebase errors
      if (!this.userId) {
        console.warn('⚠️ Skipping metrics tracking - userId not set');
        return null;
      }

      const event: MetricEvent = {
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: new Date(),
        category,
        data,
        environment: this.environment
      };

      // Log to Firebase Analytics for real-time tracking
      await this.logToAnalytics(event);

      // Store in Firestore for detailed analysis
      await this.storeInFirestore(event);

      // Log to console in development (reduced logging)
      if (this.environment === 'development' && Math.random() < 0.1) { // Only log 10% of events
        console.log('📊 Metric tracked:', event);
      }

      return event;
    } catch (error) {
      console.error('Failed to track event:', error);
      throw error;
    }
  }

  /**
   * Log event to Firebase Analytics
   */
  private async logToAnalytics(event: MetricEvent) {
    try {
      const eventName = `${event.category}_${event.data.type}`;
      const eventParams = {
        category: event.category,
        type: event.data.type,
        page: 'page' in event.data ? event.data.page : undefined,
        element: 'element' in event.data ? event.data.element : undefined,
        action: 'action' in event.data ? event.data.action : undefined,
        metric: 'metric' in event.data ? event.data.metric : undefined,
        value: 'value' in event.data ? event.data.value : undefined,
        agent_id: 'agentId' in event.data ? event.data.agentId : undefined,
        session_id: event.sessionId,
        environment: event.environment,
        custom_metadata: JSON.stringify(event.data.metadata || {})
      };

      logEvent(this.analytics, eventName, eventParams);
    } catch (error) {
      console.error('Failed to log to Analytics:', error);
    }
  }

  /**
   * Store event in Firestore for detailed analysis
   */
  private async storeInFirestore(event: MetricEvent) {
    try {
      const metricsCollection = collection(this.firestore, 'metrics');
      const docRef = await addDoc(metricsCollection, {
        ...event,
        timestamp: serverTimestamp()
      });

      event.id = docRef.id;
      return docRef;
    } catch (error) {
      console.error('Failed to store in Firestore:', error);
    }
  }

  /**
   * Get metrics for analysis
   */
  async getMetrics(
    category?: MetricEvent['category'],
    startDate?: Date,
    endDate?: Date,
    limitCount = 100
  ): Promise<MetricEvent[]> {
    try {
      const metricsCollection = collection(this.firestore, 'metrics');
      let q = query(metricsCollection, orderBy('timestamp', 'desc'), limit(limitCount));

      if (category) {
        q = query(q, where('category', '==', category));
      }

      if (startDate) {
        q = query(q, where('timestamp', '>=', startDate));
      }

      if (endDate) {
        q = query(q, where('timestamp', '<=', endDate));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MetricEvent));
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return [];
    }
  }

  /**
   * Track page view
   */
  async trackPageView(page: string, metadata?: Record<string, any>) {
    return this.trackUserInteraction({
      type: 'page_view',
      page,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer
      }
    });
  }

  /**
   * Track button click
   */
  async trackButtonClick(page: string, element: string, metadata?: Record<string, any>) {
    return this.trackUserInteraction({
      type: 'button_click',
      page,
      element,
      action: 'click',
      metadata
    });
  }

  /**
   * Track form submission
   */
  async trackFormSubmit(page: string, formName: string, success: boolean, metadata?: Record<string, any>) {
    return this.trackUserInteraction({
      type: 'form_submit',
      page,
      element: formName,
      action: success ? 'submit_success' : 'submit_error',
      metadata
    });
  }

  /**
   * Track navigation event
   */
  async trackNavigation(fromPage: string, toPage: string, method: 'click' | 'url' | 'back' | 'forward') {
    return this.trackUserInteraction({
      type: 'navigation',
      page: toPage,
      action: method,
      metadata: {
        from_page: fromPage,
        navigation_method: method
      }
    });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(page: string, feature: string, action: string, metadata?: Record<string, any>) {
    return this.trackUserInteraction({
      type: 'feature_usage',
      page,
      element: feature,
      action,
      metadata
    });
  }

  /**
   * Track performance metric
   */
  async trackPageLoadTime(page: string, loadTime: number) {
    return this.trackPerformance({
      type: 'page_load',
      metric: 'load_time',
      value: loadTime,
      unit: 'ms',
      metadata: { page }
    });
  }

  /**
   * Track API response time
   */
  async trackApiResponse(endpoint: string, responseTime: number, status: number) {
    return this.trackPerformance({
      type: 'api_response',
      metric: 'response_time',
      value: responseTime,
      unit: 'ms',
      metadata: {
        endpoint,
        status,
        success: status >= 200 && status < 300
      }
    });
  }

  /**
   * Track error occurrence
   */
  async trackError(page: string, error: Error, metadata?: Record<string, any>) {
    return this.trackPerformance({
      type: 'error_rate',
      metric: 'error_count',
      value: 1,
      unit: 'count',
      metadata: {
        page,
        error_message: error.message,
        error_stack: error.stack,
        ...metadata
      }
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): 'development' | 'staging' | 'production' {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('staging') || hostname.includes('dev')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  /**
   * Get current session information
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      environment: this.environment,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Update user ID (for when user logs in/out)
   */
  setUser(userId?: string, userProperties?: Record<string, any>) {
    this.userId = userId;
    
    if (userId) {
      setUserId(this.analytics, userId);
    }

    if (userProperties) {
      setUserProperties(this.analytics, userProperties);
    }
  }

  /**
   * Start a new session (useful for SPA navigation)
   */
  startNewSession() {
    this.sessionId = this.generateSessionId();
    console.log('🔄 New metrics session started:', this.sessionId);
  }
}

// Export singleton instance
export const metricsService = new MetricsCollectionService();
export default metricsService;

