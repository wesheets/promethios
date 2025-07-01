/**
 * Metrics Collector for Deployed Agents
 * Collects system, performance, and business metrics
 */

import * as os from 'os';
import { 
  PerformanceMetric, 
  SystemMetric, 
  BusinessMetric 
} from '../types';

export class MetricsCollector {
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimeSum: number = 0;
  private userInteractions: number = 0;
  private taskCompletions: number = 0;
  private userSatisfactionSum: number = 0;
  private userSatisfactionCount: number = 0;

  /**
   * Collect current system metrics
   */
  async collectSystemMetrics(): Promise<SystemMetric> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAverage = os.loadavg();
    
    return {
      cpuUsage: loadAverage[0] / os.cpus().length, // Normalized CPU usage
      memoryUsage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      diskUsage: await this.getDiskUsage(),
      networkIn: 0, // Would need network monitoring library
      networkOut: 0, // Would need network monitoring library
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      metadata: {
        totalMemory: memoryUsage.heapTotal,
        usedMemory: memoryUsage.heapUsed,
        externalMemory: memoryUsage.external,
        cpuCores: os.cpus().length,
        platform: os.platform(),
        nodeVersion: process.version
      }
    };
  }

  /**
   * Collect current performance metrics
   */
  async collectPerformanceMetrics(): Promise<PerformanceMetric> {
    const avgResponseTime = this.requestCount > 0 ? this.responseTimeSum / this.requestCount : 0;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    const successRate = 100 - errorRate;
    const throughput = this.requestCount / ((Date.now() - this.startTime) / 1000); // requests per second

    return {
      responseTime: avgResponseTime,
      throughput,
      errorRate,
      successRate,
      cpuUsage: await this.getCpuUsage(),
      memoryUsage: this.getMemoryUsagePercent(),
      networkLatency: 0, // Would need network latency measurement
      timestamp: new Date().toISOString(),
      metadata: {
        totalRequests: this.requestCount,
        totalErrors: this.errorCount,
        uptime: process.uptime(),
        startTime: this.startTime
      }
    };
  }

  /**
   * Collect current business metrics
   */
  async collectBusinessMetrics(): Promise<BusinessMetric> {
    const avgUserSatisfaction = this.userSatisfactionCount > 0 
      ? this.userSatisfactionSum / this.userSatisfactionCount 
      : 0;

    const businessValue = this.calculateBusinessValue();

    return {
      userInteractions: this.userInteractions,
      taskCompletions: this.taskCompletions,
      userSatisfaction: avgUserSatisfaction,
      businessValue,
      timestamp: new Date().toISOString(),
      metadata: {
        satisfactionRatings: this.userSatisfactionCount,
        completionRate: this.userInteractions > 0 ? (this.taskCompletions / this.userInteractions) * 100 : 0,
        avgSatisfaction: avgUserSatisfaction
      }
    };
  }

  /**
   * Record a request for performance tracking
   */
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.responseTimeSum += responseTime;
    
    if (isError) {
      this.errorCount++;
    }
  }

  /**
   * Record user interaction
   */
  recordUserInteraction(): void {
    this.userInteractions++;
  }

  /**
   * Record task completion
   */
  recordTaskCompletion(): void {
    this.taskCompletions++;
  }

  /**
   * Record user satisfaction rating
   */
  recordUserSatisfaction(rating: number): void {
    if (rating >= 1 && rating <= 5) {
      this.userSatisfactionSum += rating;
      this.userSatisfactionCount++;
    }
  }

  /**
   * Reset all metrics counters
   */
  resetMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.userInteractions = 0;
    this.taskCompletions = 0;
    this.userSatisfactionSum = 0;
    this.userSatisfactionCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Get current CPU usage percentage
   */
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const percentage = (totalUsage / 1000000) * 100; // Convert to percentage
        resolve(Math.min(100, percentage));
      }, 100);
    });
  }

  /**
   * Get memory usage percentage
   */
  private getMemoryUsagePercent(): number {
    const memoryUsage = process.memoryUsage();
    return (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  }

  /**
   * Get disk usage (simplified - would need proper disk monitoring in production)
   */
  private async getDiskUsage(): Promise<number> {
    try {
      // This is a simplified implementation
      // In production, you'd use a library like 'node-disk-info' or 'diskusage'
      return 50; // Placeholder value
    } catch (error) {
      console.warn('Could not determine disk usage:', error);
      return 0;
    }
  }

  /**
   * Calculate business value based on metrics
   */
  private calculateBusinessValue(): number {
    // Simple business value calculation
    // In production, this would be more sophisticated
    const completionRate = this.userInteractions > 0 ? this.taskCompletions / this.userInteractions : 0;
    const avgSatisfaction = this.userSatisfactionCount > 0 ? this.userSatisfactionSum / this.userSatisfactionCount : 0;
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    
    // Weighted business value score (0-100)
    const businessValue = (
      (completionRate * 40) + // 40% weight on completion rate
      (avgSatisfaction * 20) + // 20% weight on satisfaction (out of 5, so * 20 = 100)
      ((1 - errorRate) * 40) // 40% weight on reliability (inverse of error rate)
    );
    
    return Math.round(Math.min(100, Math.max(0, businessValue)));
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): {
    requests: number;
    errors: number;
    errorRate: number;
    avgResponseTime: number;
    userInteractions: number;
    taskCompletions: number;
    completionRate: number;
    uptime: number;
  } {
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    const avgResponseTime = this.requestCount > 0 ? this.responseTimeSum / this.requestCount : 0;
    const completionRate = this.userInteractions > 0 ? (this.taskCompletions / this.userInteractions) * 100 : 0;

    return {
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate,
      avgResponseTime,
      userInteractions: this.userInteractions,
      taskCompletions: this.taskCompletions,
      completionRate,
      uptime: process.uptime()
    };
  }
}

