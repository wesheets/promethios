/**
 * Governance Dashboard Service
 * Connects the enhanced Dashboard UI to the 100% connected backend infrastructure
 */

interface DashboardMetrics {
  agents: {
    total: number;
    individual: number;
    multiAgent: number;
    healthy: number;
    warning: number;
    critical: number;
  };
  governance: {
    score: number;
    activePolicies: number;
    violations: number;
    complianceRate: number;
  };
  trust: {
    averageScore: number;
    competence: number;
    reliability: number;
    honesty: number;
    transparency: number;
    totalAttestations: number;
    activeBoundaries: number;
  };
  activity: {
    recentEvents: Array<{
      id: string;
      type: 'agent' | 'governance' | 'trust' | 'system';
      message: string;
      timestamp: string;
      severity: 'info' | 'warning' | 'error' | 'success';
    }>;
  };
}

interface BackendHealthStatus {
  status: 'operational' | 'degraded' | 'down';
  lastCheck: string;
  components: {
    trustMetricsCalculator: boolean;
    enhancedVeritas: boolean;
    emotionTelemetry: boolean;
    governanceCore: boolean;
    eventBus: boolean;
    storage: boolean;
  };
}

class GovernanceDashboardService {
  private baseUrl: string;
  private wsConnection: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    // Use environment variable or default to local development
    this.baseUrl = import.meta.env.VITE_GOVERNANCE_API_URL || 'http://localhost:5000/api';
    this.initializeWebSocket();
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  private initializeWebSocket() {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws/dashboard';
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        console.log('Dashboard WebSocket connected');
        this.emit('connection', { status: 'connected' });
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('metrics_update', data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('Dashboard WebSocket disconnected');
        this.emit('connection', { status: 'disconnected' });
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.wsConnection.onerror = (error) => {
        console.error('Dashboard WebSocket error:', error);
        this.emit('connection', { status: 'error', error });
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Event listener management
   */
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Fetch real-time dashboard metrics from our 100% connected backend
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformBackendMetrics(data);
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      // Return fallback metrics with real backend connection attempt
      return this.getFallbackMetrics();
    }
  }

  /**
   * Transform backend metrics to Dashboard format
   */
  private transformBackendMetrics(backendData: any): DashboardMetrics {
    return {
      agents: {
        total: backendData.agents?.total || 0,
        individual: backendData.agents?.individual || 0,
        multiAgent: backendData.agents?.multiAgent || 0,
        healthy: backendData.agents?.healthy || 0,
        warning: backendData.agents?.warning || 0,
        critical: backendData.agents?.critical || 0,
      },
      governance: {
        score: Math.round(backendData.governance?.complianceRate || 0),
        activePolicies: backendData.governance?.activePolicies || 0,
        violations: backendData.governance?.violations || 0,
        complianceRate: backendData.governance?.complianceRate || 0,
      },
      trust: {
        averageScore: Math.round(backendData.trust?.averageScore || 0),
        competence: Math.round(backendData.trust?.dimensions?.competence || 0),
        reliability: Math.round(backendData.trust?.dimensions?.reliability || 0),
        honesty: Math.round(backendData.trust?.dimensions?.honesty || 0),
        transparency: Math.round(backendData.trust?.dimensions?.transparency || 0),
        totalAttestations: backendData.trust?.totalAttestations || 0,
        activeBoundaries: backendData.trust?.activeBoundaries || 0,
      },
      activity: {
        recentEvents: (backendData.activity?.recentEvents || []).map((event: any) => ({
          id: event.id || Math.random().toString(36).substr(2, 9),
          type: event.type || 'system',
          message: event.message || 'Unknown event',
          timestamp: event.timestamp || new Date().toISOString(),
          severity: event.severity || 'info',
        })),
      },
    };
  }

  /**
   * Get backend health status
   */
  async getBackendHealth(): Promise<BackendHealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        status: data.status || 'operational',
        lastCheck: data.lastCheck || new Date().toISOString(),
        components: {
          trustMetricsCalculator: data.components?.trustMetricsCalculator || false,
          enhancedVeritas: data.components?.enhancedVeritas || false,
          emotionTelemetry: data.components?.emotionTelemetry || false,
          governanceCore: data.components?.governanceCore || false,
          eventBus: data.components?.eventBus || false,
          storage: data.components?.storage || false,
        },
      };
    } catch (error) {
      console.error('Failed to fetch backend health:', error);
      return {
        status: 'down',
        lastCheck: new Date().toISOString(),
        components: {
          trustMetricsCalculator: false,
          enhancedVeritas: false,
          emotionTelemetry: false,
          governanceCore: false,
          eventBus: false,
          storage: false,
        },
      };
    }
  }

  /**
   * Trigger governance action (e.g., resolve violations, run benchmarks)
   */
  async triggerGovernanceAction(action: string, params: any = {}): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/governance/actions/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to trigger governance action ${action}:`, error);
      throw error;
    }
  }

  /**
   * Get trust metrics details for specific entity
   */
  async getTrustMetricsDetails(entityId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/trust/metrics/${entityId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch trust metrics for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Fallback metrics when backend is unavailable
   */
  private getFallbackMetrics(): DashboardMetrics {
    return {
      agents: {
        total: 0,
        individual: 0,
        multiAgent: 0,
        healthy: 0,
        warning: 0,
        critical: 0,
      },
      governance: {
        score: 0,
        activePolicies: 0,
        violations: 0,
        complianceRate: 0,
      },
      trust: {
        averageScore: 0,
        competence: 0,
        reliability: 0,
        honesty: 0,
        transparency: 0,
        totalAttestations: 0,
        activeBoundaries: 0,
      },
      activity: {
        recentEvents: [
          {
            id: 'fallback-1',
            type: 'system',
            message: 'Backend connection unavailable - using fallback data',
            timestamp: new Date().toISOString(),
            severity: 'warning',
          },
        ],
      },
    };
  }

  /**
   * Cleanup WebSocket connection
   */
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const governanceDashboardService = new GovernanceDashboardService();
export default governanceDashboardService;
export type { DashboardMetrics, BackendHealthStatus };

