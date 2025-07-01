/**
 * @promethios/agent-reporter
 * Main entry point for Promethios Agent Reporter package
 */

// Core classes
export { DeployedGovernanceEngine } from './governance/GovernanceEngine';
export { PrometheiosReportingClient } from './reporting/ReportingClient';
export { MetricsCollector } from './utils/MetricsCollector';
export { PrometheiosLogger } from './utils/Logger';

// Types
export * from './types';

// Main wrapper class for easy integration
import { DeployedGovernanceEngine } from './governance/GovernanceEngine';
import { PrometheiosReportingClient } from './reporting/ReportingClient';
import { MetricsCollector } from './utils/MetricsCollector';
import { PrometheiosLogger } from './utils/Logger';
import { 
  PrometheusConfig, 
  GovernancePolicy, 
  AgentViolation,
  GovernanceMetric,
  PerformanceMetric,
  SystemMetric,
  BusinessMetric
} from './types';

/**
 * Main Promethios Agent Wrapper
 * Provides complete governance and reporting functionality for deployed agents
 */
export class PrometheiosAgentWrapper {
  private config: PrometheusConfig;
  private governanceEngine: DeployedGovernanceEngine;
  private reportingClient: PrometheiosReportingClient;
  private metricsCollector: MetricsCollector;
  private logger: PrometheiosLogger;
  private isInitialized: boolean = false;
  private reportingInterval?: NodeJS.Timeout;

  constructor(config: PrometheusConfig) {
    this.config = config;
    this.governanceEngine = new DeployedGovernanceEngine(config.agentId, config.userId);
    this.reportingClient = new PrometheiosReportingClient(config);
    this.metricsCollector = new MetricsCollector();
    this.logger = new PrometheiosLogger(this.reportingClient);
  }

  /**
   * Initialize the agent wrapper
   */
  async initialize(policies: GovernancePolicy[] = []): Promise<void> {
    try {
      // Initialize governance engine with policies
      await this.governanceEngine.initialize(policies);
      
      // Initialize reporting client
      await this.reportingClient.initialize();
      
      // Set up logger with reporting client
      this.logger.setReportingClient(this.reportingClient);
      
      // Start metrics reporting
      this.startMetricsReporting();
      
      this.isInitialized = true;
      this.logger.info('Promethios Agent Wrapper initialized successfully', 'system', {
        agentId: this.config.agentId,
        userId: this.config.userId,
        policiesLoaded: policies.length
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to initialize Promethios Agent Wrapper', 'system', { error: errorMessage }, error as Error);
      throw error;
    }
  }

  /**
   * Wrap agent response with governance evaluation
   */
  async wrapResponse(input: string, originalResponse: string, context: Record<string, any> = {}): Promise<{
    response: string;
    allowed: boolean;
    violations: AgentViolation[];
    trustImpact: number;
    governanceMetrics: GovernanceMetric;
  }> {
    const startTime = Date.now();
    
    try {
      // Record user interaction
      this.metricsCollector.recordUserInteraction();
      
      // Evaluate response with governance engine
      const governanceResult = await this.governanceEngine.evaluateResponse(input, originalResponse, context);
      
      // Record performance metrics
      const responseTime = Date.now() - startTime;
      this.metricsCollector.recordRequest(responseTime, !governanceResult.allowed);
      
      // Record task completion if response was allowed
      if (governanceResult.allowed) {
        this.metricsCollector.recordTaskCompletion();
      }
      
      // Log governance decision
      if (governanceResult.violations.length > 0) {
        this.logger.governance(`Governance violations detected: ${governanceResult.violations.length}`, {
          violations: governanceResult.violations.map(v => ({ id: v.id, severity: v.severity, policy: v.policyName })),
          trustImpact: governanceResult.trustImpact,
          allowed: governanceResult.allowed
        });
        
        // Send violations to Promethios
        for (const violation of governanceResult.violations) {
          await this.reportingClient.sendViolation(violation);
        }
      }
      
      // Get current governance metrics
      const governanceMetrics = await this.governanceEngine.getGovernanceMetrics();
      
      return {
        response: governanceResult.modifiedResponse || originalResponse,
        allowed: governanceResult.allowed,
        violations: governanceResult.violations,
        trustImpact: governanceResult.trustImpact,
        governanceMetrics
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error in governance evaluation', 'governance', { 
        input: input.substring(0, 100),
        error: errorMessage 
      }, error as Error);
      
      // Record error
      this.metricsCollector.recordRequest(Date.now() - startTime, true);
      
      // Return original response on error (fail-open)
      return {
        response: originalResponse,
        allowed: true,
        violations: [],
        trustImpact: 0,
        governanceMetrics: await this.governanceEngine.getGovernanceMetrics()
      };
    }
  }

  /**
   * Record user satisfaction rating
   */
  recordUserSatisfaction(rating: number): void {
    this.metricsCollector.recordUserSatisfaction(rating);
    this.logger.business(`User satisfaction recorded: ${rating}/5`, { rating });
  }

  /**
   * Start automatic metrics reporting
   */
  private startMetricsReporting(): void {
    const interval = Math.max(30000, this.config.reportingInterval * 1000); // Minimum 30 seconds
    
    this.reportingInterval = setInterval(async () => {
      try {
        // Collect and send governance metrics
        const governanceMetrics = await this.governanceEngine.getGovernanceMetrics();
        await this.reportingClient.sendGovernanceMetrics(governanceMetrics);
        
        // Collect and send performance metrics
        const performanceMetrics = await this.metricsCollector.collectPerformanceMetrics();
        await this.reportingClient.sendPerformanceMetrics(performanceMetrics);
        
        // Collect and send system metrics
        const systemMetrics = await this.metricsCollector.collectSystemMetrics();
        await this.reportingClient.sendSystemMetrics(systemMetrics);
        
        // Collect and send business metrics
        const businessMetrics = await this.metricsCollector.collectBusinessMetrics();
        await this.reportingClient.sendBusinessMetrics(businessMetrics);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error('Error in metrics reporting', 'system', { error: errorMessage }, error as Error);
      }
    }, interval);
    
    this.logger.info(`Metrics reporting started with ${interval/1000}s interval`, 'system');
  }

  /**
   * Get current status
   */
  getStatus(): {
    initialized: boolean;
    governance: any;
    reporting: any;
    metrics: any;
  } {
    return {
      initialized: this.isInitialized,
      governance: this.governanceEngine.getStatus(),
      reporting: this.reportingClient.getConnectionStatus(),
      metrics: this.metricsCollector.getMetricsSummary()
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PrometheusConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.reportingClient.updateConfig(newConfig);
    
    // Restart metrics reporting if interval changed
    if (newConfig.reportingInterval && this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.startMetricsReporting();
    }
  }

  /**
   * Shutdown the agent wrapper
   */
  async shutdown(): Promise<void> {
    try {
      // Stop metrics reporting
      if (this.reportingInterval) {
        clearInterval(this.reportingInterval);
      }
      
      // Shutdown components
      await this.logger.shutdown();
      await this.reportingClient.shutdown();
      
      this.isInitialized = false;
      console.log('Promethios Agent Wrapper shutdown complete');
      
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}

/**
 * Convenience function to create and initialize agent wrapper
 */
export async function createPrometheiosWrapper(
  config: PrometheusConfig, 
  policies: GovernancePolicy[] = []
): Promise<PrometheiosAgentWrapper> {
  const wrapper = new PrometheiosAgentWrapper(config);
  await wrapper.initialize(policies);
  return wrapper;
}

