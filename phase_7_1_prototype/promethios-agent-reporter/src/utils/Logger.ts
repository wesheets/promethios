/**
 * Logger for Deployed Agents
 * Structured logging with automatic reporting to Promethios
 */

import { AgentLog } from '../types';
import { PrometheiosReportingClient } from '../reporting/ReportingClient';

export class PrometheiosLogger {
  private reportingClient?: PrometheiosReportingClient;
  private logBuffer: AgentLog[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor(reportingClient?: PrometheiosReportingClient, bufferSize: number = 100) {
    this.reportingClient = reportingClient;
    this.bufferSize = bufferSize;
    this.startAutoFlush();
  }

  /**
   * Log debug message
   */
  debug(message: string, category: AgentLog['category'] = 'system', metadata?: Record<string, any>): void {
    this.log('debug', message, category, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, category: AgentLog['category'] = 'system', metadata?: Record<string, any>): void {
    this.log('info', message, category, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, category: AgentLog['category'] = 'system', metadata?: Record<string, any>): void {
    this.log('warn', message, category, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, category: AgentLog['category'] = 'system', metadata?: Record<string, any>, error?: Error): void {
    const logEntry: AgentLog = {
      level: 'error',
      message,
      category,
      source: this.getCallerInfo(),
      timestamp: new Date().toISOString(),
      metadata,
      stackTrace: error?.stack
    };

    this.addToBuffer(logEntry);
    console.error(`[${logEntry.timestamp}] ERROR [${category}]: ${message}`, metadata, error?.stack);
  }

  /**
   * Log critical message (immediately sent to Promethios)
   */
  critical(message: string, category: AgentLog['category'] = 'system', metadata?: Record<string, any>, error?: Error): void {
    const logEntry: AgentLog = {
      level: 'critical',
      message,
      category,
      source: this.getCallerInfo(),
      timestamp: new Date().toISOString(),
      metadata,
      stackTrace: error?.stack
    };

    // Critical logs are sent immediately
    if (this.reportingClient) {
      this.reportingClient.sendLog(logEntry).catch(err => {
        console.error('Failed to send critical log to Promethios:', err);
      });
    }

    this.addToBuffer(logEntry);
    console.error(`[${logEntry.timestamp}] CRITICAL [${category}]: ${message}`, metadata, error?.stack);
  }

  /**
   * Log governance event
   */
  governance(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, 'governance', metadata);
  }

  /**
   * Log performance event
   */
  performance(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, 'performance', metadata);
  }

  /**
   * Log business event
   */
  business(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, 'business', metadata);
  }

  /**
   * Log security event
   */
  security(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, 'security', metadata);
  }

  /**
   * Generic log method
   */
  private log(level: AgentLog['level'], message: string, category: AgentLog['category'], metadata?: Record<string, any>): void {
    const logEntry: AgentLog = {
      level,
      message,
      category,
      source: this.getCallerInfo(),
      timestamp: new Date().toISOString(),
      metadata
    };

    this.addToBuffer(logEntry);
    
    // Console output with color coding
    const colorCode = this.getColorCode(level);
    console.log(`${colorCode}[${logEntry.timestamp}] ${level.toUpperCase()} [${category}]: ${message}\x1b[0m`, metadata || '');
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(logEntry: AgentLog): void {
    this.logBuffer.push(logEntry);
    
    // Flush buffer if it's full
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
  }

  /**
   * Flush log buffer to Promethios
   */
  async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.reportingClient) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.reportingClient.sendLogBatch(logsToSend);
    } catch (error) {
      console.error('Failed to send log batch to Promethios:', error);
      // Re-add logs to buffer for retry (up to buffer size)
      this.logBuffer = [...logsToSend.slice(-this.bufferSize), ...this.logBuffer];
    }
  }

  /**
   * Start automatic buffer flushing
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);
  }

  /**
   * Stop automatic buffer flushing
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Get caller information for source tracking
   */
  private getCallerInfo(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    // Skip the first 3 lines (Error, this method, and the calling log method)
    const callerLine = lines[3] || lines[2] || 'unknown';
    
    // Extract file and line number
    const match = callerLine.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
    if (match) {
      const [, functionName, filePath, lineNumber] = match;
      const fileName = filePath.split('/').pop() || filePath;
      return `${fileName}:${lineNumber} (${functionName})`;
    }
    
    return callerLine.trim();
  }

  /**
   * Get ANSI color code for log level
   */
  private getColorCode(level: AgentLog['level']): string {
    switch (level) {
      case 'debug': return '\x1b[36m'; // Cyan
      case 'info': return '\x1b[32m';  // Green
      case 'warn': return '\x1b[33m';  // Yellow
      case 'error': return '\x1b[31m'; // Red
      case 'critical': return '\x1b[35m'; // Magenta
      default: return '\x1b[0m';       // Reset
    }
  }

  /**
   * Set reporting client
   */
  setReportingClient(reportingClient: PrometheiosReportingClient): void {
    this.reportingClient = reportingClient;
  }

  /**
   * Update configuration
   */
  updateConfig(config: { bufferSize?: number; flushInterval?: number }): void {
    if (config.bufferSize !== undefined) {
      this.bufferSize = config.bufferSize;
    }
    
    if (config.flushInterval !== undefined) {
      this.flushInterval = config.flushInterval;
      
      // Restart auto-flush with new interval
      this.stopAutoFlush();
      this.startAutoFlush();
    }
  }

  /**
   * Get current buffer status
   */
  getBufferStatus(): {
    bufferSize: number;
    currentLogs: number;
    flushInterval: number;
    autoFlushActive: boolean;
  } {
    return {
      bufferSize: this.bufferSize,
      currentLogs: this.logBuffer.length,
      flushInterval: this.flushInterval,
      autoFlushActive: this.flushTimer !== undefined
    };
  }

  /**
   * Shutdown logger and flush remaining logs
   */
  async shutdown(): Promise<void> {
    this.stopAutoFlush();
    await this.flushBuffer();
    console.log('Promethios logger shutdown complete');
  }
}

