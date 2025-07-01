/**
 * Trust Metrics Extension for Promethios
 * 
 * Provides advanced trust monitoring, analytics, and management capabilities
 * for deployed agents with real-time updates and predictive insights.
 */

import { NotificationService } from '../services/NotificationService';
import { notificationExtension } from './NotificationExtension';

export interface TrustMetricsConfig {
  refreshInterval: number;
  enableRealTimeUpdates: boolean;
  enablePredictiveAnalytics: boolean;
  alertThresholds: {
    trustScore: {
      critical: number;
      warning: number;
      degradationRate: number;
    };
    confidence: {
      minimum: number;
      warning: number;
    };
    riskLevel: {
      escalationThreshold: 'medium' | 'high';
      autoRemediation: boolean;
    };
  };
  retentionPeriod: {
    trustEvaluations: number; // days
    trustTrends: number; // days
    riskAssessments: number; // days
  };
  mlModels: {
    enableTrustPrediction: boolean;
    enableAnomalyDetection: boolean;
    enableBehaviorAnalysis: boolean;
    retrainInterval: number; // hours
  };
}

export interface EnhancedTrustMetrics {
  agentId: string;
  agentName: string;
  agentType: 'single' | 'multi_agent_system';
  timestamp: string;
  
  // Core trust dimensions
  trustScores: {
    competence: number;
    reliability: number;
    honesty: number;
    transparency: number;
    aggregate: number;
  };
  
  // Confidence and reliability
  confidence: number;
  reliability: number;
  
  // Trend analysis
  trend: {
    direction: 'up' | 'down' | 'stable';
    velocity: number; // rate of change
    prediction: number; // predicted score in 7 days
    confidence: number; // prediction confidence
  };
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  riskScore: number;
  
  // Performance metrics
  performance: {
    responseTime: number;
    errorRate: number;
    successRate: number;
    uptime: number;
  };
  
  // Governance compliance
  governance: {
    complianceRate: number;
    violationCount: number;
    lastViolation?: string;
    policyAdherence: number;
  };
  
  // Behavioral analysis
  behavior: {
    consistencyScore: number;
    adaptabilityScore: number;
    learningRate: number;
    anomalyScore: number;
  };
  
  // Attestations and verifications
  attestations: {
    total: number;
    recent: number; // last 24 hours
    successRate: number;
    lastAttestation?: string;
  };
  
  // Boundaries and constraints
  boundaries: {
    active: number;
    violated: number;
    effectiveness: number;
  };
}

export interface TrustAlert {
  id: string;
  agentId: string;
  agentName: string;
  type: 'trust_degradation' | 'confidence_drop' | 'risk_escalation' | 'anomaly_detected' | 'threshold_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  timestamp: string;
  threshold?: number;
  currentValue?: number;
  recommendedActions: string[];
  autoRemediation?: {
    available: boolean;
    actions: string[];
    estimatedImpact: string;
  };
}

export interface TrustTrend {
  date: string;
  agentId: string;
  trustScore: number;
  confidence: number;
  riskLevel: string;
  violationCount: number;
  performanceScore: number;
}

export interface TrustBenchmark {
  category: string;
  metric: string;
  industryAverage: number;
  organizationAverage: number;
  bestPractice: number;
  currentValue: number;
  percentile: number;
}

export interface TrustRemediation {
  id: string;
  agentId: string;
  issue: string;
  severity: string;
  recommendedActions: {
    action: string;
    priority: 'low' | 'medium' | 'high';
    estimatedImpact: string;
    estimatedTime: string;
    resources: string[];
  }[];
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface TrustAnalytics {
  overview: {
    totalAgents: number;
    averageTrustScore: number;
    highConfidenceAgents: number;
    atRiskAgents: number;
    criticalAgents: number;
    totalAttestations: number;
    complianceRate: number;
  };
  
  trends: {
    trustScoreTrend: TrustTrend[];
    riskDistribution: { level: string; count: number; percentage: number }[];
    performanceCorrelation: { trustScore: number; performance: number }[];
    violationImpact: { violations: number; trustImpact: number }[];
  };
  
  predictions: {
    trustScoreForecast: { date: string; predicted: number; confidence: number }[];
    riskPrediction: { agentId: string; currentRisk: string; predictedRisk: string; probability: number }[];
    anomalyDetection: { agentId: string; anomalyScore: number; anomalyType: string }[];
  };
  
  benchmarks: TrustBenchmark[];
  
  insights: {
    topPerformers: string[];
    improvementOpportunities: string[];
    riskFactors: string[];
    recommendations: string[];
  };
}

/**
 * Trust Metrics Extension Class
 * Provides comprehensive trust monitoring and management functionality
 */
export class TrustMetricsExtension {
  private static instance: TrustMetricsExtension;
  private initialized = false;
  private config: TrustMetricsConfig;
  private notificationService: NotificationService;
  private realTimeInterval?: NodeJS.Timeout;
  private mlModelsLoaded = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.notificationService = notificationExtension.getNotificationService();
  }

  static getInstance(): TrustMetricsExtension {
    if (!TrustMetricsExtension.instance) {
      TrustMetricsExtension.instance = new TrustMetricsExtension();
    }
    return TrustMetricsExtension.instance;
  }

  private getDefaultConfig(): TrustMetricsConfig {
    return {
      refreshInterval: 30000, // 30 seconds
      enableRealTimeUpdates: true,
      enablePredictiveAnalytics: true,
      alertThresholds: {
        trustScore: {
          critical: 0.6,
          warning: 0.75,
          degradationRate: 0.1 // 10% drop
        },
        confidence: {
          minimum: 0.7,
          warning: 0.8
        },
        riskLevel: {
          escalationThreshold: 'medium',
          autoRemediation: true
        }
      },
      retentionPeriod: {
        trustEvaluations: 90,
        trustTrends: 365,
        riskAssessments: 180
      },
      mlModels: {
        enableTrustPrediction: true,
        enableAnomalyDetection: true,
        enableBehaviorAnalysis: true,
        retrainInterval: 24 // 24 hours
      }
    };
  }

  async initialize(customConfig?: Partial<TrustMetricsConfig>): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      // Merge custom config with defaults
      if (customConfig) {
        this.config = { ...this.config, ...customConfig };
      }

      // Initialize notification extension
      await notificationExtension.initialize();

      // Load ML models if enabled
      if (this.config.mlModels.enableTrustPrediction || 
          this.config.mlModels.enableAnomalyDetection || 
          this.config.mlModels.enableBehaviorAnalysis) {
        await this.loadMLModels();
      }

      // Start real-time updates if enabled
      if (this.config.enableRealTimeUpdates) {
        this.startRealTimeUpdates();
      }

      this.initialized = true;
      console.log('TrustMetricsExtension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize TrustMetricsExtension:', error);
      return false;
    }
  }

  private async loadMLModels(): Promise<void> {
    try {
      // Load ML models for trust prediction and anomaly detection
      const response = await fetch('/api/trust-metrics/ml/load-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        this.mlModelsLoaded = true;
        console.log('Trust ML models loaded successfully');
      } else {
        console.warn('Failed to load trust ML models, continuing without ML features');
      }
    } catch (error) {
      console.warn('ML models not available, continuing without ML features:', error);
    }
  }

  private startRealTimeUpdates(): void {
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
    }

    this.realTimeInterval = setInterval(async () => {
      try {
        await this.checkTrustAlerts();
      } catch (error) {
        console.error('Error in real-time trust monitoring:', error);
      }
    }, this.config.refreshInterval);
  }

  private async checkTrustAlerts(): Promise<void> {
    try {
      const response = await fetch('/api/trust-metrics/alerts/check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const alerts: TrustAlert[] = await response.json();
        
        for (const alert of alerts) {
          await this.handleTrustAlert(alert);
        }
      }
    } catch (error) {
      console.error('Error checking trust alerts:', error);
    }
  }

  private async handleTrustAlert(alert: TrustAlert): Promise<void> {
    // Send notification through the notification system
    await notificationExtension.sendNotification({
      title: `Trust Alert: ${alert.type.replace('_', ' ').toUpperCase()}`,
      message: alert.message,
      type: 'trust_metrics',
      severity: alert.severity,
      source: 'trust_metrics_extension',
      action_url: `/trust-metrics?agent=${alert.agentId}`,
      metadata: {
        agentId: alert.agentId,
        alertType: alert.type,
        currentValue: alert.currentValue,
        threshold: alert.threshold,
        recommendedActions: alert.recommendedActions
      }
    });

    // Auto-remediation if enabled and available
    if (this.config.alertThresholds.riskLevel.autoRemediation && 
        alert.autoRemediation?.available) {
      await this.triggerAutoRemediation(alert);
    }
  }

  private async triggerAutoRemediation(alert: TrustAlert): Promise<void> {
    try {
      const response = await fetch('/api/trust-metrics/remediation/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: alert.agentId,
          alertId: alert.id,
          actions: alert.autoRemediation?.actions
        })
      });

      if (response.ok) {
        await notificationExtension.sendNotification({
          title: 'Auto-Remediation Triggered',
          message: `Automatic remediation started for ${alert.agentName}`,
          type: 'trust_metrics',
          severity: 'info',
          source: 'trust_metrics_extension',
          action_url: `/trust-metrics?agent=${alert.agentId}`,
          metadata: {
            agentId: alert.agentId,
            alertId: alert.id,
            remediationActions: alert.autoRemediation?.actions
          }
        });
      }
    } catch (error) {
      console.error('Error triggering auto-remediation:', error);
    }
  }

  // Public API methods
  async getTrustMetrics(agentId?: string): Promise<EnhancedTrustMetrics[]> {
    const url = agentId 
      ? `/api/trust-metrics/enhanced?agent_id=${agentId}`
      : '/api/trust-metrics/enhanced';
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch trust metrics: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getTrustAnalytics(timeRange = '30d'): Promise<TrustAnalytics> {
    const response = await fetch(`/api/trust-metrics/analytics?range=${timeRange}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch trust analytics: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getTrustTrends(agentId: string, timeRange = '30d'): Promise<TrustTrend[]> {
    const response = await fetch(`/api/trust-metrics/trends?agent_id=${agentId}&range=${timeRange}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch trust trends: ${response.statusText}`);
    }
    
    return response.json();
  }

  async createRemediation(remediation: Omit<TrustRemediation, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrustRemediation> {
    const response = await fetch('/api/trust-metrics/remediation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(remediation)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create remediation: ${response.statusText}`);
    }
    
    const created = await response.json();
    
    // Send notification
    await notificationExtension.sendNotification({
      title: 'Trust Remediation Created',
      message: `New remediation plan created for ${remediation.agentId}`,
      type: 'trust_metrics',
      severity: 'info',
      source: 'trust_metrics_extension',
      action_url: `/trust-metrics/remediation/${created.id}`,
      metadata: {
        remediationId: created.id,
        agentId: remediation.agentId,
        issue: remediation.issue
      }
    });
    
    return created;
  }

  async updateRemediation(id: string, updates: Partial<TrustRemediation>): Promise<TrustRemediation> {
    const response = await fetch(`/api/trust-metrics/remediation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update remediation: ${response.statusText}`);
    }
    
    return response.json();
  }

  async exportTrustReport(format: 'csv' | 'pdf' | 'json' = 'csv', filters?: any): Promise<Blob> {
    const response = await fetch('/api/trust-metrics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format, filters })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export trust report: ${response.statusText}`);
    }
    
    return response.blob();
  }

  // Configuration methods
  updateConfig(updates: Partial<TrustMetricsConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart real-time updates if interval changed
    if (updates.refreshInterval && this.config.enableRealTimeUpdates) {
      this.startRealTimeUpdates();
    }
  }

  getConfig(): TrustMetricsConfig {
    return { ...this.config };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  areMLModelsLoaded(): boolean {
    return this.mlModelsLoaded;
  }

  // Cleanup
  destroy(): void {
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = undefined;
    }
    this.initialized = false;
    console.log('TrustMetricsExtension destroyed');
  }
}

// Export singleton instance
export const trustMetricsExtension = TrustMetricsExtension.getInstance();

