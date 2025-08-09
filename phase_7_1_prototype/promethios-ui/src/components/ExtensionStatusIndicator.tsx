/**
 * Extension Status Indicator Component
 * 
 * Displays the status of all governance extensions in the modern chat interface.
 * Shows real-time status, health, and performance metrics for extensions.
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Tooltip, IconButton, Collapse, LinearProgress } from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  Warning, 
  Info, 
  ExpandMore, 
  ExpandLess,
  Refresh,
  Security,
  Psychology,
  Assessment,
  Policy
} from '@mui/icons-material';
import { AuditLogAccessExtension } from '../extensions/AuditLogAccessExtension';
import { AutonomousCognitionExtension } from '../extensions/AutonomousCognitionExtension';
import { governanceEnhancedLLMService } from '../services/GovernanceEnhancedLLMService';
import { enhancedAuditLoggingService } from '../services/EnhancedAuditLoggingService';
import { UnifiedPolicyRegistry } from '../services/UnifiedPolicyRegistry';

export interface ExtensionStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'loading';
  message: string;
  details?: string;
  metrics?: {
    responseTime?: number;
    successRate?: number;
    lastUpdate?: string;
  };
  icon: React.ReactNode;
}

interface ExtensionStatusIndicatorProps {
  agentId?: string;
  userId?: string;
  compact?: boolean;
  showDetails?: boolean;
  onStatusChange?: (statuses: ExtensionStatus[]) => void;
}

export const ExtensionStatusIndicator: React.FC<ExtensionStatusIndicatorProps> = ({
  agentId,
  userId,
  compact = false,
  showDetails = true,
  onStatusChange
}) => {
  const [extensionStatuses, setExtensionStatuses] = useState<ExtensionStatus[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Initialize extensions
  const auditLogAccess = AuditLogAccessExtension.getInstance();
  const autonomousCognition = AutonomousCognitionExtension.getInstance();
  const policyRegistry = UnifiedPolicyRegistry.getInstance();

  /**
   * Check status of all extensions
   */
  const checkExtensionStatuses = async (): Promise<ExtensionStatus[]> => {
    const statuses: ExtensionStatus[] = [];

    try {
      // Check Audit Log Access Extension
      const auditStatus = await checkAuditLogAccessStatus();
      statuses.push(auditStatus);

      // Check Autonomous Cognition Extension
      const cognitionStatus = await checkAutonomousCognitionStatus();
      statuses.push(cognitionStatus);

      // Check Enhanced Audit Logging Service
      const auditLoggingStatus = await checkEnhancedAuditLoggingStatus();
      statuses.push(auditLoggingStatus);

      // Check Governance Enhanced LLM Service
      const llmServiceStatus = await checkGovernanceEnhancedLLMStatus();
      statuses.push(llmServiceStatus);

      // Check Policy Registry
      const policyStatus = await checkPolicyRegistryStatus();
      statuses.push(policyStatus);

    } catch (error) {
      console.error('❌ Error checking extension statuses:', error);
      statuses.push({
        name: 'System Error',
        status: 'error',
        message: 'Failed to check extension statuses',
        details: error.message,
        icon: <Error />
      });
    }

    return statuses;
  };

  /**
   * Check Audit Log Access Extension status
   */
  const checkAuditLogAccessStatus = async (): Promise<ExtensionStatus> => {
    const startTime = Date.now();
    
    try {
      if (!agentId) {
        return {
          name: 'Audit Log Access',
          status: 'warning',
          message: 'No agent ID provided',
          icon: <Assessment />
        };
      }

      // Test basic functionality
      const auditHistory = await auditLogAccess.getMyAuditHistory(agentId);
      const responseTime = Date.now() - startTime;

      return {
        name: 'Audit Log Access',
        status: 'healthy',
        message: `${auditHistory.length} audit entries available`,
        details: 'Audit log access functioning normally',
        metrics: {
          responseTime,
          successRate: 1.0,
          lastUpdate: new Date().toISOString()
        },
        icon: <Assessment />
      };
    } catch (error) {
      return {
        name: 'Audit Log Access',
        status: 'error',
        message: 'Extension not responding',
        details: error.message,
        metrics: {
          responseTime: Date.now() - startTime,
          successRate: 0.0,
          lastUpdate: new Date().toISOString()
        },
        icon: <Assessment />
      };
    }
  };

  /**
   * Check Autonomous Cognition Extension status
   */
  const checkAutonomousCognitionStatus = async (): Promise<ExtensionStatus> => {
    const startTime = Date.now();
    
    try {
      if (!agentId) {
        return {
          name: 'Autonomous Cognition',
          status: 'warning',
          message: 'No agent ID provided',
          icon: <Psychology />
        };
      }

      // Test basic functionality
      const autonomyLevel = await autonomousCognition.getCurrentAutonomyLevel(agentId);
      const isEnabled = await autonomousCognition.isAutonomyEnabled(agentId);
      const responseTime = Date.now() - startTime;

      return {
        name: 'Autonomous Cognition',
        status: isEnabled ? 'healthy' : 'warning',
        message: `Autonomy: ${autonomyLevel} (${isEnabled ? 'enabled' : 'disabled'})`,
        details: 'Autonomous cognition functioning normally',
        metrics: {
          responseTime,
          successRate: 1.0,
          lastUpdate: new Date().toISOString()
        },
        icon: <Psychology />
      };
    } catch (error) {
      return {
        name: 'Autonomous Cognition',
        status: 'error',
        message: 'Extension not responding',
        details: error.message,
        metrics: {
          responseTime: Date.now() - startTime,
          successRate: 0.0,
          lastUpdate: new Date().toISOString()
        },
        icon: <Psychology />
      };
    }
  };

  /**
   * Check Enhanced Audit Logging Service status
   */
  const checkEnhancedAuditLoggingStatus = async (): Promise<ExtensionStatus> => {
    const startTime = Date.now();
    
    try {
      // Test service availability
      const testContext = {
        agentId: agentId || 'test_agent',
        userId: userId || 'test_user',
        sessionId: `status_check_${Date.now()}`,
        interactionType: 'status_check',
        userMessage: 'Status check message',
        agentResponse: 'Status check response',
        governanceMetrics: {
          trustScore: 0.8,
          complianceRate: 0.9,
          responseTime: 100
        }
      };

      // This would create a test audit entry
      const auditEntry = await enhancedAuditLoggingService.createEnhancedAuditEntry(testContext);
      const responseTime = Date.now() - startTime;

      const fieldCount = Object.keys(auditEntry).length;

      return {
        name: 'Enhanced Audit Logging',
        status: fieldCount >= 47 ? 'healthy' : 'warning',
        message: `${fieldCount} fields logged`,
        details: fieldCount >= 47 ? '47+ field logging active' : 'Incomplete field logging',
        metrics: {
          responseTime,
          successRate: 1.0,
          lastUpdate: new Date().toISOString()
        },
        icon: <Security />
      };
    } catch (error) {
      return {
        name: 'Enhanced Audit Logging',
        status: 'error',
        message: 'Service not responding',
        details: error.message,
        metrics: {
          responseTime: Date.now() - startTime,
          successRate: 0.0,
          lastUpdate: new Date().toISOString()
        },
        icon: <Security />
      };
    }
  };

  /**
   * Check Governance Enhanced LLM Service status
   */
  const checkGovernanceEnhancedLLMStatus = async (): Promise<ExtensionStatus> => {
    const startTime = Date.now();
    
    try {
      // Test service availability
      const service = governanceEnhancedLLMService;
      const responseTime = Date.now() - startTime;

      if (!service) {
        throw new Error('Service not initialized');
      }

      return {
        name: 'Governance Enhanced LLM',
        status: 'healthy',
        message: 'Service ready',
        details: 'Governance enhancement service operational',
        metrics: {
          responseTime,
          successRate: 1.0,
          lastUpdate: new Date().toISOString()
        },
        icon: <Psychology />
      };
    } catch (error) {
      return {
        name: 'Governance Enhanced LLM',
        status: 'error',
        message: 'Service not available',
        details: error.message,
        metrics: {
          responseTime: Date.now() - startTime,
          successRate: 0.0,
          lastUpdate: new Date().toISOString()
        },
        icon: <Psychology />
      };
    }
  };

  /**
   * Check Policy Registry status
   */
  const checkPolicyRegistryStatus = async (): Promise<ExtensionStatus> => {
    const startTime = Date.now();
    
    try {
      if (!agentId) {
        return {
          name: 'Policy Registry',
          status: 'warning',
          message: 'No agent ID provided',
          icon: <Policy />
        };
      }

      // Test policy registry functionality
      const policyAssignments = await policyRegistry.getAgentPolicyAssignments(agentId);
      const responseTime = Date.now() - startTime;

      return {
        name: 'Policy Registry',
        status: 'healthy',
        message: `${policyAssignments.length} policies assigned`,
        details: 'Policy registry functioning normally',
        metrics: {
          responseTime,
          successRate: 1.0,
          lastUpdate: new Date().toISOString()
        },
        icon: <Policy />
      };
    } catch (error) {
      return {
        name: 'Policy Registry',
        status: 'error',
        message: 'Registry not responding',
        details: error.message,
        metrics: {
          responseTime: Date.now() - startTime,
          successRate: 0.0,
          lastUpdate: new Date().toISOString()
        },
        icon: <Policy />
      };
    }
  };

  /**
   * Refresh extension statuses
   */
  const refreshStatuses = async () => {
    setLoading(true);
    try {
      const statuses = await checkExtensionStatuses();
      setExtensionStatuses(statuses);
      setLastRefresh(new Date());
      
      if (onStatusChange) {
        onStatusChange(statuses);
      }
    } catch (error) {
      console.error('❌ Error refreshing extension statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    refreshStatuses();
    
    // Refresh every 30 seconds
    const interval = setInterval(refreshStatuses, 30000);
    
    return () => clearInterval(interval);
  }, [agentId, userId]);

  /**
   * Get status color
   */
  const getStatusColor = (status: ExtensionStatus['status']) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'loading': return 'info';
      default: return 'default';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: ExtensionStatus['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <Error />;
      case 'loading': return <Info />;
      default: return <Info />;
    }
  };

  /**
   * Get overall system status
   */
  const getOverallStatus = () => {
    if (loading) return 'loading';
    if (extensionStatuses.some(s => s.status === 'error')) return 'error';
    if (extensionStatuses.some(s => s.status === 'warning')) return 'warning';
    return 'healthy';
  };

  if (compact) {
    const overallStatus = getOverallStatus();
    return (
      <Tooltip title={`Extensions: ${extensionStatuses.length} loaded, Last refresh: ${lastRefresh.toLocaleTimeString()}`}>
        <Chip
          icon={getStatusIcon(overallStatus)}
          label="Extensions"
          color={getStatusColor(overallStatus) as any}
          size="small"
          onClick={() => setExpanded(!expanded)}
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon(getOverallStatus())}
          Extension Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <IconButton size="small" onClick={refreshStatuses} disabled={loading}>
            <Refresh />
          </IconButton>
          {showDetails && (
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Loading indicator */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Extension status list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {extensionStatuses.map((extension, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
              {extension.icon}
              <Typography variant="body2" fontWeight="medium">
                {extension.name}
              </Typography>
            </Box>
            
            <Chip
              icon={getStatusIcon(extension.status)}
              label={extension.message}
              color={getStatusColor(extension.status) as any}
              size="small"
              sx={{ minWidth: 150 }}
            />
            
            {extension.metrics && (
              <Typography variant="caption" color="text.secondary">
                {extension.metrics.responseTime}ms
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {/* Detailed information */}
      {showDetails && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            {extensionStatuses.map((extension, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {extension.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {extension.details || extension.message}
                </Typography>
                {extension.metrics && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption">
                      Response Time: {extension.metrics.responseTime}ms
                    </Typography>
                    <Typography variant="caption">
                      Success Rate: {(extension.metrics.successRate * 100).toFixed(1)}%
                    </Typography>
                    {extension.metrics.lastUpdate && (
                      <Typography variant="caption">
                        Updated: {new Date(extension.metrics.lastUpdate).toLocaleTimeString()}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default ExtensionStatusIndicator;

