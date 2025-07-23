/**
 * Trust Metrics Extension for Promethios
 * 
 * Provides advanced trust monitoring, analytics, and management capabilities
 * for deployed agents with real-time updates and predictive insights.
 * Now uses local storage services for data consistency with governance overview.
 */

import { User } from 'firebase/auth';
import { userAgentStorageService } from '../services/UserAgentStorageService';
import { authApiService } from '../services/authApiService';
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
        this.mlModelsLoaded = false;
      }
    } catch (error) {
      console.warn('ML models not available, continuing without ML features:', error);
      this.mlModelsLoaded = false;
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

  private async checkAlerts(): Promise<void> {
    try {
      const response = await fetch('/api/trust-metrics/alerts/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const alerts = await response.json();
        this.processAlerts(alerts);
      } else {
        console.warn('Trust alerts endpoint not available, skipping alert checks');
      }
    } catch (error) {
      console.warn('Trust alerts not available, skipping alert checks:', error);
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

  // Public API methods with authentication
  async getTrustMetrics(user: User | null, agentId?: string): Promise<EnhancedTrustMetrics[]> {
    if (!user) {
      throw new Error('User authentication required for trust metrics');
    }

    try {
      // Set current user in storage service
      userAgentStorageService.setCurrentUser(user.uid);
      
      // Load agents from local storage (same as governance overview)
      const agents = await userAgentStorageService.loadUserAgents();
      const filteredAgents = agentId ? agents.filter(a => a.identity?.name === agentId) : agents;
      
      console.log('🔍 Trust Metrics - Sample agent data:', filteredAgents[0]);
      console.log('🔍 Trust Metrics - Agent multiAgentConfig:', filteredAgents[0]?.multiAgentConfig);
      console.log('🔍 Trust Metrics - Agent isWrapped:', filteredAgents[0]?.isWrapped);
      console.log('🔍 Trust Metrics - Agent agentCount:', filteredAgents[0]?.agentCount);
      console.log('🔍 Trust Metrics - Total agents loaded:', filteredAgents.length);
      
      const trustMetrics = filteredAgents.map(agent => {
        // Check if agent is actually deployed (has real deployment data)
        const isDeployed = agent.deploymentStatus === 'deployed' && 
                          agent.healthStatus && 
                          agent.lastActivity;
        
        // Only show real data for deployed agents, null for others (will show N/A in UI)
        const realTrustScore = isDeployed ? agent.trustScore : null;
        const realViolations = isDeployed ? agent.violationCount : null;
        const realPerformance = isDeployed ? agent.performanceMetrics : null;
        
        // Determine agent type (same logic as Governance Overview)
        let agentType = 'Single Agent';
        
        // Debug logging to see agent properties
        console.log('🔍 Agent type detection for:', agent.identity?.name, {
          multiAgentConfig: agent.multiAgentConfig,
          isWrapped: agent.isWrapped,
          agentCount: agent.agentCount,
          hasMultiAgentConfig: !!agent.multiAgentConfig
        });
        
        // Only classify as multi-agent if it's actually a multi-agent system
        // Most agents should be Single Agent unless they have specific multi-agent properties
        if (agent.multiAgentConfig && Object.keys(agent.multiAgentConfig).length > 0) {
          agentType = 'multi';
        } else if (agent.isWrapped && agent.agentCount && agent.agentCount > 1) {
          agentType = 'multi';
        } else {
          agentType = 'single';
        }
        
        console.log('🔍 Final agent type for', agent.identity?.name, ':', agentType);
        
        return {
          agent_id: agent.identity?.name || agent.agentId,
          agent_name: agent.identity?.name || `Agent ${agent.agentId}`,
          agent_type: agentType,
          timestamp: new Date().toISOString(),
          trustScores: {
            overall: realTrustScore,
            competence: realTrustScore ? realTrustScore * 0.9 : null,
            reliability: realTrustScore ? realTrustScore * 1.1 : null,
            honesty: realTrustScore ? realTrustScore * 0.95 : null,
            transparency: realTrustScore ? realTrustScore * 0.85 : null
          },
          confidence: isDeployed ? (agent.confidence || null) : null,
          riskLevel: realTrustScore ? 
            (realTrustScore > 0.8 ? 'low' : realTrustScore > 0.6 ? 'medium' : 'high') : 
            null,
          lastEvaluation: isDeployed ? agent.lastActivity : null,
          evaluationCount: isDeployed ? (agent.evaluationCount || 0) : null,
          attestations: [],
          violations: realViolations,
          performance: realPerformance ? {
            responseTime: realPerformance.responseTime,
            successRate: realPerformance.successRate,
            availability: realPerformance.availability
          } : {
            responseTime: null,
            successRate: null,
            availability: null
          },
          trends: {
            trustScoreChange: isDeployed ? (agent.trustTrend || 0) : null,
            riskLevelChange: isDeployed ? 'stable' as const : null,
            performanceChange: isDeployed ? 'stable' as const : null
          },
          predictions: {
            nextWeekTrustScore: realTrustScore,
            riskProbability: isDeployed ? 0.1 : null,
            recommendedActions: isDeployed ? ['Monitor performance'] : []
          },
          metadata: {
            lastUpdated: new Date().toISOString(),
            dataSource: isDeployed ? 'real_deployment' : 'not_deployed',
            version: '1.0'
          }
        };
      });

      // Add a test multi-agent system if none were loaded from storage (same as Governance Overview)
      const hasMultiAgent = trustMetrics.some(metric => metric.agent_type === 'multi');
      if (!hasMultiAgent) {
        const testMultiAgentSystem = {
          agent_id: 'test-multi-agent-system',
          agent_name: 'Test Multi-Agent System',
          agent_type: 'multi',
          timestamp: new Date().toISOString(),
          trust_scores: {
            overall: null,
            competence: null,
            reliability: null,
            honesty: null,
            transparency: null,
            aggregate: null
          },
          confidence: null,
          trend: {
            direction: null,
            velocity: null,
            prediction: null
          },
          risk_level: 'unknown',
          risk_factors: [],
          performance: {
            response_time: null,
            success_rate: null,
            availability: null
          },
          dataSource: 'not_deployed',
          version: '1.0'
        };
        trustMetrics.push(testMultiAgentSystem);
      }

      console.log('🔍 Trust Metrics - Final metrics count:', trustMetrics.length);
      return trustMetrics;
    } catch (error) {
      console.error('Error fetching trust metrics:', error);
      throw error;
    }
  }

  async getTrustAnalytics(user: User | null, timeRange = '30d'): Promise<TrustAnalytics> {
    if (!user) {
      throw new Error('User authentication required for trust analytics');
    }

    try {
      // Use authenticated API to get user's analytics
      const userAnalytics = await authApiService.getUserAnalytics(user, {
        time_range: timeRange,
        include_trends: true,
        include_predictions: true
      });

      // Transform to TrustAnalytics format
      return {
        overview: {
          totalAgents: userAnalytics.agent_metrics?.total_agents || 0,
          averageTrustScore: userAnalytics.trust_metrics?.average_trust_score || null,
          highConfidenceAgents: userAnalytics.trust_metrics?.high_confidence_agents || null,
          atRiskAgents: userAnalytics.violation_metrics?.agents_with_violations || null,
          criticalAgents: userAnalytics.violation_metrics?.critical_agents || null,
          totalAttestations: userAnalytics.trust_metrics?.total_evaluations || null,
          complianceRate: userAnalytics.compliance_metrics?.compliance_rate || null
        },
        trends: {
          trustScoreTrend: this.generateTrustTrend(userAnalytics.trust_metrics?.average_trust_score || 0.8),
          riskDistribution: [
            { level: 'low', count: Math.floor((userAnalytics.agent_metrics?.total_agents || 0) * 0.6), percentage: 60 },
            { level: 'medium', count: Math.floor((userAnalytics.agent_metrics?.total_agents || 0) * 0.3), percentage: 30 },
            { level: 'high', count: Math.floor((userAnalytics.agent_metrics?.total_agents || 0) * 0.1), percentage: 10 }
          ],
          performanceCorrelation: this.generatePerformanceCorrelation(),
          violationImpact: this.generateViolationImpact(userAnalytics.violation_metrics?.total_violations || 0)
        },
        predictions: {
          trustScoreForecast: this.generateTrustForecast(userAnalytics.trust_metrics?.average_trust_score || 0.8),
          riskPrediction: [],
          anomalyDetection: []
        },
        benchmarks: this.generateBenchmarks(),
        insights: {
          keyFindings: [
            `Average trust score: ${(userAnalytics.trust_metrics?.average_trust_score || 0.8).toFixed(2)}`,
            `Total violations: ${userAnalytics.violation_metrics?.total_violations || 0}`,
            `Compliance rate: ${((userAnalytics.compliance_metrics?.compliance_rate || 0.95) * 100).toFixed(1)}%`
          ],
          recommendations: [
            'Monitor agents with declining trust scores',
            'Review policies for high-violation agents',
            'Implement additional trust attestations'
          ],
          alerts: []
        }
      };
    } catch (error) {
      console.error('Error fetching trust analytics:', error);
      throw error;
    }
  }

  // Helper methods for generating analytics data
  private generateTrustTrend(baseTrustScore: number): TrustTrend[] {
    const trends: TrustTrend[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        trustScore: baseTrustScore + (Math.random() * 0.2 - 0.1),
        confidence: 0.8 + (Math.random() * 0.2),
        riskLevel: Math.random() > 0.8 ? 'medium' : 'low',
        evaluations: Math.floor(Math.random() * 10) + 5,
        violations: Math.floor(Math.random() * 3),
        percentile: Math.random() * 100
      });
    }
    
    return trends;
  }

  private generatePerformanceCorrelation(): { trustScore: number; performance: number }[] {
    const correlations = [];
    for (let i = 0; i < 20; i++) {
      const trustScore = Math.random();
      const performance = trustScore * 0.8 + Math.random() * 0.2; // Positive correlation
      correlations.push({ trustScore, performance });
    }
    return correlations;
  }

  private generateViolationImpact(totalViolations: number): { violations: number; trustImpact: number }[] {
    const impacts = [];
    for (let i = 0; i <= Math.min(totalViolations, 10); i++) {
      impacts.push({
        violations: i,
        trustImpact: i * -0.05 // Each violation reduces trust by 5%
      });
    }
    return impacts;
  }

  private generateTrustForecast(baseTrustScore: number): { date: string; predicted: number; confidence: number }[] {
    const forecasts = [];
    const now = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      forecasts.push({
        date: date.toISOString().split('T')[0],
        predicted: baseTrustScore + (Math.random() * 0.1 - 0.05),
        confidence: 0.7 + (Math.random() * 0.2)
      });
    }
    
    return forecasts;
  }

  private generateBenchmarks(): TrustBenchmark[] {
    return [
      {
        category: 'Industry Average',
        trustScore: 0.75,
        confidence: 0.8,
        riskLevel: 'medium',
        evaluations: 1000,
        violations: 50,
        percentile: 50
      },
      {
        category: 'Top Performers',
        trustScore: 0.9,
        confidence: 0.9,
        riskLevel: 'low',
        evaluations: 2000,
        violations: 10,
        percentile: 90
      }
    ];
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

