/* Logger Utility
 * Provides logging functionality for the application
 * Supports different log levels and destinations
 */

class Logger {
    constructor() {
        this.logLevel = 'info'; // default log level
        this.logDestination = 'console'; // default destination
        this.logHistory = [];
        this.historyLimit = 1000;
        console.log('Logger initialized');
    }

    /**
     * Set the log level
     * @param {string} level - Log level (debug, info, warn, error)
     */
    setLogLevel(level) {
        const validLevels = ['debug', 'info', 'warn', 'error'];
        if (validLevels.includes(level)) {
            this.logLevel = level;
            this.info(`Log level set to ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}. Using default: info`);
        }
    }

    /**
     * Set the log destination
     * @param {string} destination - Log destination (console, memory, both)
     */
    setLogDestination(destination) {
        const validDestinations = ['console', 'memory', 'both'];
        if (validDestinations.includes(destination)) {
            this.logDestination = destination;
            this.info(`Log destination set to ${destination}`);
        } else {
            this.warn(`Invalid log destination: ${destination}. Using default: console`);
        }
    }

    /**
     * Log a debug message
     * @param {string} message - Message to log
     * @param {*} data - Optional data to include
     */
    debug(message, data = null) {
        if (['debug'].includes(this.logLevel)) {
            this._log('debug', message, data);
        }
    }

    /**
     * Log an info message
     * @param {string} message - Message to log
     * @param {*} data - Optional data to include
     */
    info(message, data = null) {
        if (['debug', 'info'].includes(this.logLevel)) {
            this._log('info', message, data);
        }
    }

    /**
     * Log a warning message
     * @param {string} message - Message to log
     * @param {*} data - Optional data to include
     */
    warn(message, data = null) {
        if (['debug', 'info', 'warn'].includes(this.logLevel)) {
            this._log('warn', message, data);
        }
    }

    /**
     * Log an error message
     * @param {string} message - Message to log
     * @param {*} data - Optional data to include
     */
    error(message, data = null) {
        if (['debug', 'info', 'warn', 'error'].includes(this.logLevel)) {
            this._log('error', message, data);
        }
    }

    /**
     * Internal logging method
     * @param {string} level - Log level
     * @param {string} message - Message to log
     * @param {*} data - Optional data to include
     * @private
     */
    _log(level, message, data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            level,
            message,
            data,
            timestamp
        };

        // Log to console if enabled
        if (['console', 'both'].includes(this.logDestination)) {
            const consoleMethod = level === 'debug' ? 'log' : level;
            if (data) {
                console[consoleMethod](`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
            } else {
                console[consoleMethod](`[${timestamp}] [${level.toUpperCase()}] ${message}`);
            }
        }

        // Log to memory if enabled
        if (['memory', 'both'].includes(this.logDestination)) {
            this.logHistory.push(logEntry);
            
            // Trim history if needed
            if (this.logHistory.length > this.historyLimit) {
                this.logHistory = this.logHistory.slice(-this.historyLimit);
            }
        }
    }

    /**
     * Get log history
     * @param {string} level - Optional level filter
     * @param {number} limit - Maximum number of entries to return
     * @returns {Array} - Log history
     */
    getHistory(level = null, limit = this.historyLimit) {
        if (level) {
            return this.logHistory
                .filter(entry => entry.level === level)
                .slice(-limit);
        }
        return this.logHistory.slice(-limit);
    }

    /**
     * Clear log history
     */
    clearHistory() {
        this.logHistory = [];
        this.info('Log history cleared');
    }
}

// Create and export singleton instance
const logger = new Logger();
export default logger;
