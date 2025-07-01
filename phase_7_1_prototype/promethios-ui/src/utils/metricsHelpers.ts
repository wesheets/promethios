/**
 * Metrics Helper Utilities
 * 
 * Utility functions for working with metrics data, formatting,
 * and common metric calculations.
 */

import { MetricEvent, MetricData } from '../services/MetricsCollectionService';

// Time-based utilities
export const timeUtils = {
  /**
   * Get time range for metrics queries
   */
  getTimeRange(period: 'hour' | 'day' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'hour':
        start.setHours(start.getHours() - 1);
        break;
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  },

  /**
   * Format duration in human-readable format
   */
  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else if (milliseconds < 3600000) {
      return `${(milliseconds / 60000).toFixed(1)}m`;
    } else {
      return `${(milliseconds / 3600000).toFixed(1)}h`;
    }
  },

  /**
   * Get relative time string
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
};

// Data aggregation utilities
export const aggregationUtils = {
  /**
   * Group metrics by time period
   */
  groupByTimePeriod(
    events: MetricEvent[], 
    period: 'hour' | 'day' | 'week' | 'month'
  ): Record<string, MetricEvent[]> {
    const groups: Record<string, MetricEvent[]> = {};

    events.forEach(event => {
      const date = new Date(event.timestamp);
      let key: string;

      switch (period) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth()}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });

    return groups;
  },

  /**
   * Calculate average value from numeric metrics
   */
  calculateAverage(events: MetricEvent[], valueKey: string = 'value'): number {
    if (events.length === 0) return 0;

    const values = events
      .map(event => this.extractNumericValue(event, valueKey))
      .filter(value => value !== null) as number[];

    if (values.length === 0) return 0;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  },

  /**
   * Calculate percentile from numeric metrics
   */
  calculatePercentile(events: MetricEvent[], percentile: number, valueKey: string = 'value'): number {
    if (events.length === 0) return 0;

    const values = events
      .map(event => this.extractNumericValue(event, valueKey))
      .filter(value => value !== null) as number[];

    if (values.length === 0) return 0;

    values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  },

  /**
   * Extract numeric value from metric event
   */
  extractNumericValue(event: MetricEvent, key: string): number | null {
    if ('value' in event.data && typeof event.data.value === 'number') {
      return event.data.value;
    }

    if (event.data.metadata && key in event.data.metadata) {
      const value = event.data.metadata[key];
      return typeof value === 'number' ? value : null;
    }

    return null;
  },

  /**
   * Count events by category
   */
  countByCategory(events: MetricEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};

    events.forEach(event => {
      const category = event.category;
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  },

  /**
   * Count events by type
   */
  countByType(events: MetricEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};

    events.forEach(event => {
      const type = event.data.type;
      counts[type] = (counts[type] || 0) + 1;
    });

    return counts;
  }
};

// Formatting utilities
export const formatUtils = {
  /**
   * Format number with appropriate units
   */
  formatNumber(value: number, decimals: number = 1): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(decimals)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(decimals)}K`;
    } else {
      return value.toFixed(decimals);
    }
  },

  /**
   * Format percentage
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  },

  /**
   * Format bytes
   */
  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  },

  /**
   * Format metric value with appropriate unit
   */
  formatMetricValue(value: number, unit: string): string {
    switch (unit) {
      case 'ms':
        return timeUtils.formatDuration(value);
      case 'bytes':
        return this.formatBytes(value);
      case 'percentage':
        return this.formatPercentage(value);
      case 'count':
        return this.formatNumber(value, 0);
      default:
        return `${this.formatNumber(value)} ${unit}`;
    }
  }
};

// Analysis utilities
export const analysisUtils = {
  /**
   * Calculate trend from time series data
   */
  calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercent > 5) return 'up';
    if (changePercent < -5) return 'down';
    return 'stable';
  },

  /**
   * Detect anomalies in metric data
   */
  detectAnomalies(values: number[], threshold: number = 2): number[] {
    if (values.length < 3) return [];

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return values
      .map((value, index) => ({ value, index }))
      .filter(({ value }) => Math.abs(value - mean) > threshold * stdDev)
      .map(({ index }) => index);
  },

  /**
   * Calculate correlation between two metric series
   */
  calculateCorrelation(series1: number[], series2: number[]): number {
    if (series1.length !== series2.length || series1.length === 0) return 0;

    const n = series1.length;
    const mean1 = series1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = series2.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = series1[i] - mean1;
      const diff2 = series2[i] - mean2;
      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);
    return denominator === 0 ? 0 : numerator / denominator;
  }
};

// Dashboard utilities
export const dashboardUtils = {
  /**
   * Generate dashboard summary from metrics
   */
  generateSummary(events: MetricEvent[]): {
    totalEvents: number;
    uniqueUsers: number;
    uniqueSessions: number;
    timeRange: { start: Date; end: Date };
    topPages: Array<{ page: string; count: number }>;
    topFeatures: Array<{ feature: string; count: number }>;
  } {
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;

    const timestamps = events.map(e => new Date(e.timestamp));
    const timeRange = {
      start: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      end: new Date(Math.max(...timestamps.map(t => t.getTime())))
    };

    // Count page views
    const pageViews: Record<string, number> = {};
    const featureUsage: Record<string, number> = {};

    events.forEach(event => {
      if ('page' in event.data) {
        const page = event.data.page;
        pageViews[page] = (pageViews[page] || 0) + 1;
      }

      if ('element' in event.data && event.data.element) {
        const feature = event.data.element;
        featureUsage[feature] = (featureUsage[feature] || 0) + 1;
      }
    });

    const topPages = Object.entries(pageViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    const topFeatures = Object.entries(featureUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));

    return {
      totalEvents: events.length,
      uniqueUsers,
      uniqueSessions,
      timeRange,
      topPages,
      topFeatures
    };
  },

  /**
   * Calculate key performance indicators
   */
  calculateKPIs(events: MetricEvent[]): {
    averageSessionDuration: number;
    bounceRate: number;
    pageViewsPerSession: number;
    errorRate: number;
    averageLoadTime: number;
  } {
    // Group events by session
    const sessionGroups = aggregationUtils.groupByTimePeriod(events, 'day'); // Simplified grouping

    // Calculate session durations (simplified)
    const sessionDurations: number[] = [];
    const pageViewsPerSession: number[] = [];
    let totalErrors = 0;
    const loadTimes: number[] = [];

    Object.values(sessionGroups).forEach(sessionEvents => {
      if (sessionEvents.length > 0) {
        const timestamps = sessionEvents.map(e => new Date(e.timestamp).getTime());
        const duration = Math.max(...timestamps) - Math.min(...timestamps);
        sessionDurations.push(duration);

        const pageViews = sessionEvents.filter(e => 
          e.data.type === 'page_view'
        ).length;
        pageViewsPerSession.push(pageViews);

        const errors = sessionEvents.filter(e => 
          e.data.type === 'error_rate'
        ).length;
        totalErrors += errors;

        const loadTimeEvents = sessionEvents.filter(e => 
          e.data.type === 'page_load' && 'value' in e.data
        );
        loadTimeEvents.forEach(e => {
          if ('value' in e.data && typeof e.data.value === 'number') {
            loadTimes.push(e.data.value);
          }
        });
      }
    });

    const averageSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;

    const bounceRate = sessionGroups ? 
      (Object.values(sessionGroups).filter(sessions => sessions.length === 1).length / Object.keys(sessionGroups).length) * 100
      : 0;

    const avgPageViewsPerSession = pageViewsPerSession.length > 0
      ? pageViewsPerSession.reduce((sum, views) => sum + views, 0) / pageViewsPerSession.length
      : 0;

    const errorRate = events.length > 0 ? (totalErrors / events.length) * 100 : 0;

    const averageLoadTime = loadTimes.length > 0
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
      : 0;

    return {
      averageSessionDuration,
      bounceRate,
      pageViewsPerSession: avgPageViewsPerSession,
      errorRate,
      averageLoadTime
    };
  }
};

// Export all utilities
export {
  timeUtils,
  aggregationUtils,
  formatUtils,
  analysisUtils,
  dashboardUtils
};

