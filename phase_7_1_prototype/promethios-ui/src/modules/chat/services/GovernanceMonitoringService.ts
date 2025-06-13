/**
 * Governance Monitoring Service for tracking compliance and violations
 */

export interface GovernanceMetric {
  id: string;
  name: string;
  value: number;
  status: 'compliant' | 'warning' | 'violation';
  description: string;
  lastUpdated: Date;
}

export interface GovernanceAlert {
  id: string;
  type: 'warning' | 'violation';
  message: string;
  timestamp: Date;
  agentId?: string;
}

export class GovernanceMonitoringService {
  private metrics: GovernanceMetric[] = [];
  private alerts: GovernanceAlert[] = [];
  private listeners: ((metrics: GovernanceMetric[], alerts: GovernanceAlert[]) => void)[] = [];

  constructor() {
    this.initializeDefaultMetrics();
  }

  private initializeDefaultMetrics(): void {
    this.metrics = [
      {
        id: 'constitutional_compliance',
        name: 'Constitutional Compliance',
        value: 94,
        status: 'compliant',
        description: 'Adherence to constitutional AI principles',
        lastUpdated: new Date()
      },
      {
        id: 'response_time',
        name: 'Response Time',
        value: 87,
        status: 'compliant',
        description: 'Average response time performance',
        lastUpdated: new Date()
      },
      {
        id: 'bias_fairness',
        name: 'Bias & Fairness',
        value: 92,
        status: 'compliant',
        description: 'Bias detection and fairness metrics',
        lastUpdated: new Date()
      }
    ];
  }

  addListener(callback: (metrics: GovernanceMetric[], alerts: GovernanceAlert[]) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (metrics: GovernanceMetric[], alerts: GovernanceAlert[]) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.metrics], [...this.alerts]));
  }

  updateMetric(metricId: string, value: number): void {
    const metric = this.metrics.find(m => m.id === metricId);
    if (metric) {
      metric.value = value;
      metric.lastUpdated = new Date();
      
      // Update status based on value
      if (value >= 90) {
        metric.status = 'compliant';
      } else if (value >= 70) {
        metric.status = 'warning';
      } else {
        metric.status = 'violation';
      }

      this.notifyListeners();
    }
  }

  addAlert(alert: Omit<GovernanceAlert, 'id' | 'timestamp'>): void {
    const newAlert: GovernanceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.alerts.unshift(newAlert);
    
    // Keep only last 10 alerts
    if (this.alerts.length > 10) {
      this.alerts = this.alerts.slice(0, 10);
    }

    this.notifyListeners();
  }

  getMetrics(): GovernanceMetric[] {
    return [...this.metrics];
  }

  getAlerts(): GovernanceAlert[] {
    return [...this.alerts];
  }

  clearAlerts(): void {
    this.alerts = [];
    this.notifyListeners();
  }
}

export const governanceMonitoringService = new GovernanceMonitoringService();

