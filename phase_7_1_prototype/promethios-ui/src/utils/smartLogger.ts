/**
 * Smart Logger Utility
 * Controls console logging to prevent performance issues while preserving functionality
 */

interface LogConfig {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug';
  throttleMs: number;
  maxLogsPerSecond: number;
}

class SmartLogger {
  private config: LogConfig = {
    enabled: import.meta.env.MODE === 'development',
    level: 'info',
    throttleMs: 100, // Minimum time between similar logs
    maxLogsPerSecond: 10 // Maximum logs per second
  };

  private logCounts = new Map<string, number>();
  private lastLogTime = new Map<string, number>();
  private logQueue: Array<{message: string, args: any[], type: string}> = [];

  // Throttle similar log messages
  private shouldLog(message: string): boolean {
    if (!this.config.enabled) return false;

    const now = Date.now();
    const lastTime = this.lastLogTime.get(message) || 0;
    
    if (now - lastTime < this.config.throttleMs) {
      return false; // Throttled
    }

    this.lastLogTime.set(message, now);
    return true;
  }

  // Smart console.log replacement
  log(message: string, ...args: any[]): void {
    if (this.shouldLog(message)) {
      console.log(message, ...args);
    }
  }

  // For error logs (always show)
  error(message: string, ...args: any[]): void {
    console.error(message, ...args);
  }

  // For warning logs (show in production)
  warn(message: string, ...args: any[]): void {
    console.warn(message, ...args);
  }

  // Disable specific spam patterns
  isSpamPattern(message: string): boolean {
    const spamPatterns = [
      /🔥.*Retrieved from Firebase/,
      /🔥.*Found.*documents in collection/,
      /🔍.*Loading production agent/,
      /🔍.*Cache miss/,
      /💾.*Cached/,
      /⚡.*Processing chunk/
    ];

    return spamPatterns.some(pattern => pattern.test(message));
  }

  // Smart log that filters spam
  smartLog(message: string, ...args: any[]): void {
    if (this.isSpamPattern(message)) {
      // Only log spam patterns occasionally
      if (Math.random() < 0.1) { // 10% chance
        this.log(`[THROTTLED] ${message}`, ...args);
      }
    } else {
      this.log(message, ...args);
    }
  }

  // Configure logging behavior
  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Disable all logging for production
  disableAll(): void {
    this.config.enabled = false;
  }

  // Enable only essential logging
  productionMode(): void {
    this.config = {
      enabled: true,
      level: 'error',
      throttleMs: 1000,
      maxLogsPerSecond: 5
    };
  }
}

// Global logger instance
export const smartLogger = new SmartLogger();

// Configure for production
if (import.meta.env.MODE === 'production') {
  smartLogger.productionMode();
}

// Export for easy replacement of console.log
export default smartLogger;

