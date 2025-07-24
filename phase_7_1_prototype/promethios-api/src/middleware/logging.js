/**
 * Logging Middleware
 * 
 * Comprehensive logging system for policy enforcement, violations,
 * and governance activities.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Activity Logger
 * Logs all governance-related activities with structured data
 */
class ActivityLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      await fs.mkdir(path.join(this.logDir, 'violations'), { recursive: true });
      await fs.mkdir(path.join(this.logDir, 'enforcement'), { recursive: true });
      await fs.mkdir(path.join(this.logDir, 'activities'), { recursive: true });
    } catch (error) {
      console.error('Failed to create log directories:', error);
    }
  }

  /**
   * Log activity with structured data
   */
  async logActivity(req, activityType, data = {}) {
    try {
      const timestamp = new Date();
      const logEntry = {
        timestamp: timestamp.toISOString(),
        activityType,
        data,
        request: req ? {
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent'],
          ip: req.ip || req.connection?.remoteAddress,
          userId: req.user?.uid
        } : null,
        id: this.generateLogId(timestamp)
      };

      // Write to daily log file
      const dateStr = timestamp.toISOString().split('T')[0];
      const logFile = path.join(this.logDir, 'activities', `${dateStr}.json`);
      
      await this.appendToLogFile(logFile, logEntry);

      // Also log to console for development
      console.log(`📋 ${activityType}:`, data);

    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Log policy violation with detailed context
   */
  async logViolation(violation, context = {}) {
    try {
      const timestamp = new Date();
      const logEntry = {
        timestamp: timestamp.toISOString(),
        type: 'policy_violation',
        violation: {
          assignmentId: violation.assignmentId,
          policyId: violation.policyId,
          policyName: violation.policyName,
          ruleId: violation.rule?.id,
          ruleName: violation.rule?.name,
          condition: violation.rule?.condition,
          action: violation.rule?.action,
          severity: violation.severity,
          evaluation: violation.evaluation
        },
        context: {
          agentId: context.agentId,
          userId: context.userId,
          request: context.request ? {
            method: context.request.method,
            path: context.request.path,
            contentPreview: context.request.content?.substring(0, 200)
          } : null,
          metrics: context.metrics,
          user: context.user
        },
        id: this.generateLogId(timestamp)
      };

      // Write to violation log
      const dateStr = timestamp.toISOString().split('T')[0];
      const violationFile = path.join(this.logDir, 'violations', `${dateStr}.json`);
      
      await this.appendToLogFile(violationFile, logEntry);

      // Also write to enforcement log for correlation
      const enforcementFile = path.join(this.logDir, 'enforcement', `${dateStr}.json`);
      await this.appendToLogFile(enforcementFile, {
        ...logEntry,
        type: 'enforcement_action'
      });

    } catch (error) {
      console.error('Failed to log violation:', error);
    }
  }

  /**
   * Log enforcement decision
   */
  async logEnforcement(agentId, enforcement, context = {}) {
    try {
      const timestamp = new Date();
      const logEntry = {
        timestamp: timestamp.toISOString(),
        type: 'policy_enforcement',
        agentId,
        enforcement: {
          allowed: enforcement.allowed,
          action: enforcement.action,
          totalPolicies: enforcement.totalPolicies,
          violatedPolicies: enforcement.violatedPolicies,
          violations: enforcement.violations?.map(v => ({
            policyId: v.policyId,
            ruleId: v.rule?.id,
            severity: v.severity,
            action: v.rule?.action
          }))
        },
        context: {
          userId: context.userId,
          request: context.request ? {
            method: context.request.method,
            path: context.request.path
          } : null
        },
        id: this.generateLogId(timestamp)
      };

      // Write to enforcement log
      const dateStr = timestamp.toISOString().split('T')[0];
      const enforcementFile = path.join(this.logDir, 'enforcement', `${dateStr}.json`);
      
      await this.appendToLogFile(enforcementFile, logEntry);

    } catch (error) {
      console.error('Failed to log enforcement:', error);
    }
  }

  /**
   * Append log entry to file
   */
  async appendToLogFile(filePath, logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(filePath, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', filePath, error);
    }
  }

  /**
   * Generate unique log ID
   */
  generateLogId(timestamp) {
    return `${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent violations
   */
  async getRecentViolations(days = 7, limit = 100) {
    try {
      const violations = [];
      const now = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = date.toISOString().split('T')[0];
        const violationFile = path.join(this.logDir, 'violations', `${dateStr}.json`);
        
        try {
          const content = await fs.readFile(violationFile, 'utf8');
          const lines = content.trim().split('\n').filter(line => line);
          
          for (const line of lines) {
            try {
              const violation = JSON.parse(line);
              violations.push(violation);
            } catch (parseError) {
              console.warn('Failed to parse violation log line:', parseError);
            }
          }
        } catch (fileError) {
          // File doesn't exist for this date, skip
          continue;
        }
      }

      // Sort by timestamp and limit
      return violations
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to get recent violations:', error);
      return [];
    }
  }

  /**
   * Get enforcement statistics
   */
  async getEnforcementStats(days = 7) {
    try {
      const stats = {
        totalRequests: 0,
        blockedRequests: 0,
        warnedRequests: 0,
        allowedRequests: 0,
        violationsByPolicy: {},
        violationsBySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        topViolatedRules: {}
      };

      const now = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = date.toISOString().split('T')[0];
        const enforcementFile = path.join(this.logDir, 'enforcement', `${dateStr}.json`);
        
        try {
          const content = await fs.readFile(enforcementFile, 'utf8');
          const lines = content.trim().split('\n').filter(line => line);
          
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              
              if (entry.type === 'policy_enforcement') {
                stats.totalRequests++;
                
                if (!entry.enforcement.allowed) {
                  stats.blockedRequests++;
                } else if (entry.enforcement.violations?.some(v => v.action === 'warn')) {
                  stats.warnedRequests++;
                } else {
                  stats.allowedRequests++;
                }

                // Count violations by policy and severity
                for (const violation of entry.enforcement.violations || []) {
                  const policyId = violation.policyId;
                  const severity = violation.severity || 'medium';
                  const ruleId = violation.ruleId;

                  stats.violationsByPolicy[policyId] = (stats.violationsByPolicy[policyId] || 0) + 1;
                  stats.violationsBySeverity[severity] = (stats.violationsBySeverity[severity] || 0) + 1;
                  stats.topViolatedRules[ruleId] = (stats.topViolatedRules[ruleId] || 0) + 1;
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse enforcement log line:', parseError);
            }
          }
        } catch (fileError) {
          // File doesn't exist for this date, skip
          continue;
        }
      }

      // Convert top violated rules to sorted array
      stats.topViolatedRules = Object.entries(stats.topViolatedRules)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([ruleId, count]) => ({ ruleId, count }));

      return stats;

    } catch (error) {
      console.error('Failed to get enforcement stats:', error);
      return null;
    }
  }

  /**
   * Clean old log files
   */
  async cleanOldLogs(retentionDays = 30) {
    try {
      const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
      const logTypes = ['activities', 'violations', 'enforcement'];

      for (const logType of logTypes) {
        const logTypeDir = path.join(this.logDir, logType);
        
        try {
          const files = await fs.readdir(logTypeDir);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const dateStr = file.replace('.json', '');
              const fileDate = new Date(dateStr);
              
              if (fileDate < cutoffDate) {
                await fs.unlink(path.join(logTypeDir, file));
                console.log(`Cleaned old log file: ${file}`);
              }
            }
          }
        } catch (dirError) {
          console.warn(`Failed to clean logs in ${logType}:`, dirError);
        }
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }
}

// Global logger instance
const activityLogger = new ActivityLogger();

/**
 * Express middleware for request logging
 */
const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  const requestId = activityLogger.generateLogId(new Date());
  req.requestId = requestId;
  
  // Override res.json to capture response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log request completion
    activityLogger.logActivity(req, 'request_completed', {
      requestId,
      duration,
      statusCode: res.statusCode,
      responseSize: JSON.stringify(data).length
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Log activity function (for external use)
 */
const logActivity = async (req, activityType, data = {}) => {
  return activityLogger.logActivity(req, activityType, data);
};

/**
 * Log violation function (for external use)
 */
const logViolation = async (violation, context = {}) => {
  return activityLogger.logViolation(violation, context);
};

/**
 * Log enforcement function (for external use)
 */
const logEnforcement = async (agentId, enforcement, context = {}) => {
  return activityLogger.logEnforcement(agentId, enforcement, context);
};

module.exports = {
  ActivityLogger,
  activityLogger,
  requestLoggingMiddleware,
  logActivity,
  logViolation,
  logEnforcement
};

