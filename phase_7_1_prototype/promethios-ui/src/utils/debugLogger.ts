// Debug logging utility for the Promethios UI application
// This module provides comprehensive logging capabilities to help diagnose issues

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logLevel: LogLevel = LogLevel.INFO;

  constructor() {
    // Set log level based on environment
    if (process.env.NODE_ENV === 'development') {
      this.logLevel = LogLevel.DEBUG;
    } else if (process.env.NODE_ENV === 'production') {
      this.logLevel = LogLevel.WARN;
    }

    // Enable debug logging if URL parameter is present
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('debug') === 'true') {
        this.logLevel = LogLevel.DEBUG;
        console.log('Debug logging enabled via URL parameter');
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(level: LogLevel, category: string, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    // Add stack trace for errors
    if (level === LogLevel.ERROR) {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console
    const consoleMessage = `[${entry.category}] ${entry.message}`;
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(consoleMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(consoleMessage, entry.data);
        break;
    }
  }

  debug(category: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(this.createLogEntry(LogLevel.DEBUG, category, message, data));
    }
  }

  info(category: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(this.createLogEntry(LogLevel.INFO, category, message, data));
    }
  }

  warn(category: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(this.createLogEntry(LogLevel.WARN, category, message, data));
    }
  }

  error(category: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(this.createLogEntry(LogLevel.ERROR, category, message, data));
    }
  }

  // Component lifecycle logging
  componentMount(componentName: string, props?: any) {
    this.debug('Component', `${componentName} mounted`, props);
  }

  componentUnmount(componentName: string) {
    this.debug('Component', `${componentName} unmounted`);
  }

  componentUpdate(componentName: string, prevProps?: any, nextProps?: any) {
    this.debug('Component', `${componentName} updated`, { prevProps, nextProps });
  }

  componentError(componentName: string, error: Error, errorInfo?: any) {
    this.error('Component', `${componentName} error: ${error.message}`, { error, errorInfo });
  }

  // Authentication logging
  authStateChange(state: string, user?: any) {
    this.info('Auth', `Authentication state changed to: ${state}`, user);
  }

  authError(error: string, details?: any) {
    this.error('Auth', `Authentication error: ${error}`, details);
  }

  // Navigation logging
  routeChange(from: string, to: string) {
    this.info('Navigation', `Route changed from ${from} to ${to}`);
  }

  // API logging
  apiRequest(method: string, url: string, data?: any) {
    this.debug('API', `${method} request to ${url}`, data);
  }

  apiResponse(method: string, url: string, status: number, data?: any) {
    this.debug('API', `${method} response from ${url} (${status})`, data);
  }

  apiError(method: string, url: string, error: any) {
    this.error('API', `${method} error for ${url}`, error);
  }

  // Theme logging
  themeChange(theme: string) {
    this.info('Theme', `Theme changed to: ${theme}`);
  }

  themeError(error: string, details?: any) {
    this.error('Theme', `Theme error: ${error}`, details);
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs by category
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    this.info('Logger', 'Logs cleared');
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Set log level dynamically
  setLogLevel(level: LogLevel) {
    this.logLevel = level;
    this.info('Logger', `Log level set to: ${LogLevel[level]}`);
  }
}

// Create singleton instance
const logger = new DebugLogger();

// Export both the class and the singleton instance
export { DebugLogger };
export default logger;

