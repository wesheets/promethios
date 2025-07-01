/**
 * Core types for Promethios Agent Reporter
 * Used by deployed governance wrappers to report back to Promethios
 */

export interface PrometheusConfig {
  apiKey: string;
  baseUrl: string;
  agentId: string;
  userId: string;
  reportingInterval: number; // seconds
  enableRealTimeReporting: boolean;
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

export interface GovernanceMetric {
  trustScore: number;
  complianceRate: number;
  violationCount: number;
  policyEnforcementRate: number;
  responseTime: number;
  errorRate: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  responseTime: number;
  throughput: number;
  errorRate: number;
  successRate: number;
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemMetric {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface BusinessMetric {
  userInteractions: number;
  taskCompletions: number;
  userSatisfaction: number;
  businessValue: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentViolation {
  id: string;
  policyId: string;
  policyName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: Record<string, any>;
  remediation?: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

export interface AgentLog {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  category: 'governance' | 'performance' | 'system' | 'business' | 'security';
  source: string;
  timestamp: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

export interface AgentHeartbeat {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  version: string;
  uptime: number;
  lastActivity: string;
  systemInfo: {
    platform: string;
    nodeVersion: string;
    memory: {
      used: number;
      total: number;
    };
    cpu: {
      usage: number;
      cores: number;
    };
  };
  governanceStatus: {
    enabled: boolean;
    policiesLoaded: number;
    lastPolicyUpdate: string;
    trustScore: number;
  };
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ReportingResult {
  success: boolean;
  statusCode?: number;
  message?: string;
  timestamp: string;
  retryCount?: number;
  error?: Error;
}

export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rules: GovernanceRule[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface GovernanceRule {
  id: string;
  condition: string;
  action: 'warn' | 'block' | 'modify' | 'log';
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface TrustFactor {
  name: string;
  weight: number;
  value: number;
  description: string;
}

export interface TrustCalculation {
  overallScore: number;
  factors: TrustFactor[];
  timestamp: string;
  metadata?: Record<string, any>;
}

