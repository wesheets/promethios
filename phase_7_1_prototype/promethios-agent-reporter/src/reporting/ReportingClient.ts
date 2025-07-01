/**
 * Reporting Client for Deployed Agents
 * Handles communication with Promethios API backend
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as cron from 'node-cron';
import { 
  PrometheusConfig,
  GovernanceMetric,
  PerformanceMetric,
  SystemMetric,
  BusinessMetric,
  AgentViolation,
  AgentLog,
  AgentHeartbeat,
  ReportingResult
} from '../types';

export class PrometheiosReportingClient {
  private config: PrometheusConfig;
  private httpClient: AxiosInstance;
  private heartbeatTask?: cron.ScheduledTask;
  private metricsTask?: cron.ScheduledTask;
  private isConnected: boolean = false;
  private lastHeartbeat: Date = new Date();
  private retryQueue: Array<{ endpoint: string; data: any; retries: number }> = [];

  constructor(config: PrometheusConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': `promethios-agent-reporter/1.0.0`
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for error handling and retries
   */
  private setupInterceptors(): void {
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status >= 500 && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.delay(this.config.retryDelay);
          return this.httpClient(originalRequest);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize the reporting client and start scheduled tasks
   */
  async initialize(): Promise<void> {
    try {
      // Test connection with initial heartbeat
      await this.sendHeartbeat();
      this.isConnected = true;
      
      // Start scheduled reporting
      this.startScheduledReporting();
      
      console.log('Promethios reporting client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Promethios reporting client:', error);
      throw error;
    }
  }

  /**
   * Start scheduled reporting tasks
   */
  private startScheduledReporting(): void {
    // Heartbeat every minute
    this.heartbeatTask = cron.schedule('*/1 * * * *', async () => {
      await this.sendHeartbeat();
    });

    // Metrics reporting based on configured interval
    const metricsInterval = Math.max(30, this.config.reportingInterval); // Minimum 30 seconds
    const cronExpression = `*/${metricsInterval} * * * * *`;
    
    this.metricsTask = cron.schedule(cronExpression, async () => {
      await this.processRetryQueue();
    });

    console.log(`Scheduled reporting started: heartbeat every minute, metrics every ${metricsInterval} seconds`);
  }

  /**
   * Send heartbeat to Promethios API
   */
  async sendHeartbeat(): Promise<ReportingResult> {
    const heartbeat: AgentHeartbeat = {
      status: this.isConnected ? 'healthy' : 'degraded',
      version: '1.0.0',
      uptime: process.uptime(),
      lastActivity: new Date().toISOString(),
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal
        },
        cpu: {
          usage: process.cpuUsage().user / 1000000, // Convert to seconds
          cores: require('os').cpus().length
        }
      },
      governanceStatus: {
        enabled: true, // Would be set by governance engine
        policiesLoaded: 0, // Would be set by governance engine
        lastPolicyUpdate: new Date().toISOString(),
        trustScore: 1.0 // Would be set by governance engine
      },
      timestamp: new Date().toISOString()
    };

    return this.sendData('/api/agents/heartbeat', heartbeat);
  }

  /**
   * Send governance metrics
   */
  async sendGovernanceMetrics(metrics: GovernanceMetric): Promise<ReportingResult> {
    return this.sendData('/api/agents/metrics', {
      type: 'governance',
      ...metrics
    });
  }

  /**
   * Send performance metrics
   */
  async sendPerformanceMetrics(metrics: PerformanceMetric): Promise<ReportingResult> {
    return this.sendData('/api/agents/metrics', {
      type: 'performance',
      ...metrics
    });
  }

  /**
   * Send system metrics
   */
  async sendSystemMetrics(metrics: SystemMetric): Promise<ReportingResult> {
    return this.sendData('/api/agents/metrics', {
      type: 'system',
      ...metrics
    });
  }

  /**
   * Send business metrics
   */
  async sendBusinessMetrics(metrics: BusinessMetric): Promise<ReportingResult> {
    return this.sendData('/api/agents/metrics', {
      type: 'business',
      ...metrics
    });
  }

  /**
   * Send violation report
   */
  async sendViolation(violation: AgentViolation): Promise<ReportingResult> {
    return this.sendData('/api/agents/violations', violation);
  }

  /**
   * Send log entry
   */
  async sendLog(log: AgentLog): Promise<ReportingResult> {
    return this.sendData('/api/agents/logs', log);
  }

  /**
   * Send multiple logs in batch
   */
  async sendLogBatch(logs: AgentLog[]): Promise<ReportingResult> {
    return this.sendData('/api/agents/logs/batch', { logs });
  }

  /**
   * Generic method to send data to Promethios API
   */
  private async sendData(endpoint: string, data: any): Promise<ReportingResult> {
    const timestamp = new Date().toISOString();
    
    try {
      const response: AxiosResponse = await this.httpClient.post(endpoint, {
        agentId: this.config.agentId,
        userId: this.config.userId,
        timestamp,
        ...data
      });

      this.isConnected = true;
      this.lastHeartbeat = new Date();

      return {
        success: true,
        statusCode: response.status,
        message: 'Data sent successfully',
        timestamp
      };
    } catch (error: any) {
      this.isConnected = false;
      
      // Add to retry queue for non-critical errors
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        this.addToRetryQueue(endpoint, data);
      }

      return {
        success: false,
        statusCode: error.response?.status,
        message: error.message,
        timestamp,
        error
      };
    }
  }

  /**
   * Add failed request to retry queue
   */
  private addToRetryQueue(endpoint: string, data: any): void {
    if (this.retryQueue.length < 100) { // Limit queue size
      this.retryQueue.push({
        endpoint,
        data,
        retries: 0
      });
    }
  }

  /**
   * Process retry queue
   */
  private async processRetryQueue(): Promise<void> {
    const itemsToRetry = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of itemsToRetry) {
      if (item.retries < this.config.retryAttempts) {
        const result = await this.sendData(item.endpoint, item.data);
        
        if (!result.success) {
          item.retries++;
          this.retryQueue.push(item);
        }
      } else {
        console.warn(`Dropping item after ${this.config.retryAttempts} failed retries:`, item.endpoint);
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    lastHeartbeat: Date;
    queueSize: number;
    config: Partial<PrometheusConfig>;
  } {
    return {
      connected: this.isConnected,
      lastHeartbeat: this.lastHeartbeat,
      queueSize: this.retryQueue.length,
      config: {
        baseUrl: this.config.baseUrl,
        agentId: this.config.agentId,
        userId: this.config.userId,
        reportingInterval: this.config.reportingInterval,
        enableRealTimeReporting: this.config.enableRealTimeReporting
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PrometheusConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update HTTP client headers if API key changed
    if (newConfig.apiKey) {
      this.httpClient.defaults.headers['Authorization'] = `Bearer ${newConfig.apiKey}`;
    }
    
    // Restart scheduled tasks if interval changed
    if (newConfig.reportingInterval) {
      this.stopScheduledReporting();
      this.startScheduledReporting();
    }
  }

  /**
   * Stop scheduled reporting
   */
  private stopScheduledReporting(): void {
    if (this.heartbeatTask) {
      this.heartbeatTask.stop();
      this.heartbeatTask = undefined;
    }
    
    if (this.metricsTask) {
      this.metricsTask.stop();
      this.metricsTask = undefined;
    }
  }

  /**
   * Shutdown the reporting client
   */
  async shutdown(): Promise<void> {
    this.stopScheduledReporting();
    
    // Send final heartbeat with offline status
    try {
      await this.httpClient.post('/api/agents/heartbeat', {
        agentId: this.config.agentId,
        userId: this.config.userId,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to send final heartbeat:', error);
    }
    
    console.log('Promethios reporting client shutdown complete');
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

