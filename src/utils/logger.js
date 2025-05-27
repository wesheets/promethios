/**
 * Logger Utility
 * 
 * Provides standardized logging functionality for Promethios components.
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class Logger {
  constructor(config = {}) {
    this.config = {
      logLevel: process.env.LOG_LEVEL || 'info',
      logToConsole: true,
      logToFile: false,
      logDir: path.join(process.cwd(), 'logs'),
      logFileName: 'promethios.log',
      ...config
    };

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    // Ensure log directory exists if logging to file
    if (this.config.logToFile && !fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    this._log('error', message, meta);
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this._log('warn', message, meta);
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this._log('info', message, meta);
  }

  /**
   * Log a debug message
   * @param {string} message - Message to log
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    this._log('debug', message, meta);
  }

  /**
   * Log a trace message
   * @param {string} message - Message to log
   * @param {Object} meta - Additional metadata
   */
  trace(message, meta = {}) {
    this._log('trace', message, meta);
  }

  /**
   * Internal logging method
   * @private
   */
  _log(level, message, meta) {
    // Check if we should log at this level
    if (this.levels[level] > this.levels[this.config.logLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const formattedMeta = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    
    // Format the log message
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (formattedMeta) {
      logMessage += ` ${formattedMeta}`;
    }

    // Log to console if enabled
    if (this.config.logToConsole) {
      const colorizer = this._getColorizer(level);
      // Handle case where chalk might not be available in test environment
      if (typeof colorizer === 'function') {
        console.log(colorizer(logMessage));
      } else {
        console.log(logMessage);
      }
    }

    // Log to file if enabled
    if (this.config.logToFile) {
      const logFilePath = path.join(this.config.logDir, this.config.logFileName);
      fs.appendFileSync(logFilePath, logMessage + '\n');
    }
  }

  /**
   * Get colorizer function for console output
   * @private
   */
  _getColorizer(level) {
    switch (level) {
      case 'error':
        return chalk.red;
      case 'warn':
        return chalk.yellow;
      case 'info':
        return chalk.blue;
      case 'debug':
        return chalk.green;
      case 'trace':
        return chalk.gray;
      default:
        return (text) => text;
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config) {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }
}

/**
 * Creates a new logger instance with the given configuration
 * @param {Object} config - Logger configuration
 * @returns {Logger} Logger instance
 */
function createLogger(config = {}) {
  return new Logger(config);
}

module.exports = {
  Logger,
  logger: Logger.getInstance(),
  createLogger
};
