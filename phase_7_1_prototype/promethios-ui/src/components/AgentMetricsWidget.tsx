/**
 * Agent Metrics Widget Component
 * 
 * A reusable component that displays real-time agent metrics
 * with consistent styling across all interfaces.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAgentMetrics } from '../hooks/useAgentMetrics';
import { realGovernanceIntegration, AgentTelemetryData } from '../services/RealGovernanceIntegration';

// Dark theme colors
const DARK_THEME = {
  background: '#1a202c',
  surface: '#2d3748',
  border: '#4a5568',
  text: {
    primary: '#ffffff',
    secondary: '#a0aec0'
  },
  primary: '#3182ce',
  success: '#38a169',
  warning: '#d69e2e',
  error: '#e53e3e'
};

const MetricsCard = styled(Card)(() => ({
  backgroundColor: DARK_THEME.surface,
  border: `1px solid ${DARK_THEME.border}`,
  '& .MuiCardContent-root': {
    padding: '16px'
  }
}));

const MetricItem = styled(Box)(() => ({
  marginBottom: '16px',
  '&:last-child': {
    marginBottom: 0
  }
}));

interface AgentMetricsWidgetProps {
  agentId: string;
  agentName?: string;
  version?: 'test' | 'production';
  compact?: boolean; // For smaller displays
  showTitle?: boolean;
  refreshInterval?: number; // in milliseconds
  onMetricsUpdate?: (metrics: any) => void;
}

export const AgentMetricsWidget: React.FC<AgentMetricsWidgetProps> = ({
  agentId,
  agentName,
  version = 'test',
  compact = false,
  showTitle = true,
  refreshInterval = 30000,
  onMetricsUpdate
}) => {
  const agentMetrics = useAgentMetrics({
    agentId,
    agentName: 'Agent',
    agentType: 'single',
    version: version || 'test',
    autoInitialize: true
  });
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [telemetryData, setTelemetryData] = useState<AgentTelemetryData | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  console.log(`🔧 AgentMetricsWidget: Initialized for agent ${agentId} with version ${version}`);
  console.log(`🔧 AgentMetricsWidget: Metrics hook state:`, {
    isLoading: agentMetrics.isLoading,
    isInitialized: agentMetrics.isInitialized,
    error: agentMetrics.error,
    profile: agentMetrics.profile
  });

  // Load real governance telemetry data
  useEffect(() => {
    const loadTelemetry = async () => {
      setIsLoadingTelemetry(true);
      try {
        const data = await realGovernanceIntegration.getAgentTelemetry(agentId);
        setTelemetryData(data);
      } catch (error) {
        console.warn('Failed to load telemetry data:', error);
      } finally {
        setIsLoadingTelemetry(false);
      }
    };

    loadTelemetry();
    const interval = setInterval(loadTelemetry, refreshInterval);
    return () => clearInterval(interval);
  }, [agentId, refreshInterval]);

  // Trigger callback when metrics update
  useEffect(() => {
    if (agentMetrics.isInitialized && onMetricsUpdate) {
      onMetricsUpdate(agentMetrics);
    }
  }, [agentMetrics, onMetricsUpdate]);

  // Update last update time when metrics change
  useEffect(() => {
    if (agentMetrics.isInitialized) {
      setLastUpdateTime(new Date());
    }
  }, [agentMetrics.trustScore, agentMetrics.complianceRate, agentMetrics.responseTime]);

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatTime = (milliseconds: number): string => {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.9) return DARK_THEME.success;
    if (score >= 0.7) return DARK_THEME.warning;
    return DARK_THEME.error;
  };

  const getVersionChipColor = (ver: string) => {
    return ver === 'production' ? DARK_THEME.success : DARK_THEME.warning;
  };

  // Download functionality for transparency
  const downloadMetricsData = async () => {
    try {
      const governanceData = await realGovernanceIntegration.getGovernanceDataForDownload(agentId);
      const combinedData = {
        basicMetrics: {
          agentId,
          agentName,
          version,
          trustScore: agentMetrics.trustScore,
          complianceRate: agentMetrics.complianceRate,
          responseTime: agentMetrics.responseTime,
          lastUpdated: lastUpdateTime.toISOString()
        },
        governanceData,
        downloadInfo: {
          timestamp: new Date().toISOString(),
          dataType: 'agent_metrics_with_governance',
          format: 'json'
        }
      };

      const blob = new Blob([JSON.stringify(combinedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agentId}_metrics_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download metrics data:', error);
    }
  };

  const downloadTelemetryData = async () => {
    if (!telemetryData) return;
    
    try {
      const fullTelemetryData = {
        telemetryData,
        emotionalState: telemetryData.emotionalState,
        cognitiveMetrics: telemetryData.cognitiveMetrics,
        behavioralPatterns: telemetryData.behavioralPatterns,
        selfAwarenessLevel: telemetryData.selfAwarenessLevel,
        downloadInfo: {
          timestamp: new Date().toISOString(),
          dataType: 'agent_telemetry_and_self_awareness',
          format: 'json',
          notes: 'Emotional, cognitive, and behavioral telemetry data for recursive improvement'
        }
      };

      const blob = new Blob([JSON.stringify(fullTelemetryData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agentId}_telemetry_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download telemetry data:', error);
    }
  };

  const downloadCompleteGovernanceHistory = async () => {
    if (!agentId) return;
    
    try {
      // Get comprehensive governance data
      const governanceData = await realGovernanceIntegration.getGovernanceDataForDownload(agentId);
      
      // 🛡️ Get constitutional governance policy data
      let constitutionalGovernanceData = null;
      try {
        const { useAuth } = await import('../context/AuthContext');
        const currentUser = useAuth().currentUser;
        if (currentUser?.uid) {
          const policyAssignments = await realGovernanceIntegration.getAgentPolicyAssignments(agentId, currentUser.uid);
          constitutionalGovernanceData = {
            activePolicies: policyAssignments.length,
            policyAssignments,
            totalViolations: policyAssignments.reduce((sum, assignment) => sum + (assignment.violationCount || 0), 0),
            averageCompliance: policyAssignments.length > 0 
              ? policyAssignments.reduce((sum, assignment) => sum + (assignment.complianceRate || 1.0), 0) / policyAssignments.length 
              : 1.0,
            lastPolicyCheck: new Date().toISOString()
          };
        }
      } catch (error) {
        console.warn('Could not fetch constitutional governance data for download:', error);
      }
      
      // Get chat history if available
      let chatHistory = null;
      try {
        const chatStorageService = new (await import('../services/ChatStorageService')).ChatStorageService();
        chatHistory = await chatStorageService.loadAgentChatHistory(agentId);
      } catch (error) {
        console.warn('Could not load chat history:', error);
      }

      const completeData = {
        agentProfile: {
          agentId,
          agentName,
          version,
          lastUpdated: lastUpdateTime.toISOString()
        },
        realTimeMetrics: {
          trustScore: agentMetrics.trustScore,
          complianceRate: agentMetrics.complianceRate,
          responseTime: agentMetrics.responseTime,
          sessionIntegrity: agentMetrics.sessionIntegrity,
          policyViolations: agentMetrics.policyViolations
        },
        governanceData,
        constitutionalGovernance: constitutionalGovernanceData,
        chatHistory: chatHistory ? {
          messageCount: chatHistory.messageCount,
          sessionCount: chatHistory.governanceMetrics.sessionCount,
          messages: chatHistory.messages.map(msg => ({
            id: msg.id,
            timestamp: msg.timestamp,
            sender: msg.sender,
            contentLength: msg.content.length,
            governanceData: msg.governanceData,
            shadowGovernanceData: msg.shadowGovernanceData,
            constitutionalEnforcement: msg.governanceData?.constitutionalEnforcement
          }))
        } : null,
        downloadInfo: {
          timestamp: new Date().toISOString(),
          dataType: 'complete_governance_transparency_report',    format: 'json',
          description: 'Complete transparency report including real-time metrics, governance data, telemetry, self-awareness prompts, and chat history',
          dataSource: 'Promethios Governance Backend + Firebase Storage',
          confidenceLevel: governanceData?.transparency?.confidenceLevel || 0.85
        }
      };

      const blob = new Blob([JSON.stringify(completeData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agentId}_complete_governance_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download complete governance history:', error);
    }
  };

  if (agentMetrics.error) {
    return (
      <MetricsCard>
        <CardContent>
          <Alert severity="error" sx={{ backgroundColor: DARK_THEME.error + '20', color: DARK_THEME.error }}>
            Failed to load metrics: {agentMetrics.error}
          </Alert>
        </CardContent>
      </MetricsCard>
    );
  }

  if (!agentMetrics.isInitialized) {
    return (
      <MetricsCard>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress sx={{ color: DARK_THEME.primary }} size={24} />
            <Typography variant="body2" sx={{ ml: 2, color: DARK_THEME.text.secondary }}>
              Loading metrics...
            </Typography>
          </Box>
        </CardContent>
      </MetricsCard>
    );
  }

  return (
    <MetricsCard>
      <CardContent>
        {showTitle && (
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant={compact ? "subtitle2" : "h6"} sx={{ color: DARK_THEME.text.primary, fontWeight: 'bold' }}>
              {agentName || agentId} Metrics
            </Typography>
            <Box display="flex" gap={1}>
              <Chip 
                label={version.toUpperCase()} 
                size="small"
                sx={{ 
                  backgroundColor: getVersionChipColor(version) + '20',
                  color: getVersionChipColor(version),
                  fontWeight: 'bold'
                }}
              />
              {agentMetrics.profile?.deployments && agentMetrics.profile.deployments.length > 0 && (
                <Chip 
                  label="DEPLOYED" 
                  size="small"
                  sx={{ 
                    backgroundColor: DARK_THEME.primary + '20',
                    color: DARK_THEME.primary,
                    fontWeight: 'bold'
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Trust Score */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ShieldIcon sx={{ color: DARK_THEME.primary, fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                TRUST SCORE
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ color: getScoreColor(agentMetrics.trustScore), fontWeight: 'bold', mb: 1 }}>
              {formatPercentage(agentMetrics.trustScore)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={agentMetrics.trustScore * 100}
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: DARK_THEME.border,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getScoreColor(agentMetrics.trustScore),
                  borderRadius: 4
                }
              }} 
            />
          </Box>

          {/* Compliance Rate */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CheckCircleIcon sx={{ color: DARK_THEME.success, fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                COMPLIANCE RATE
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ color: getScoreColor(agentMetrics.complianceRate), fontWeight: 'bold', mb: 1 }}>
              {formatPercentage(agentMetrics.complianceRate)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={agentMetrics.complianceRate * 100}
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: DARK_THEME.border,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getScoreColor(agentMetrics.complianceRate),
                  borderRadius: 4
                }
              }} 
            />
          </Box>

          {/* Response Time */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <SpeedIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                RESPONSE TIME
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ color: '#38bdf8', fontWeight: 'bold' }}>
              {formatTime(agentMetrics.responseTime)}
            </Typography>
          </Box>

          {/* Session Integrity */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <VisibilityIcon sx={{ color: DARK_THEME.warning, fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                SESSION INTEGRITY
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ color: getScoreColor(agentMetrics.sessionIntegrity), fontWeight: 'bold', mb: 1 }}>
              {formatPercentage(agentMetrics.sessionIntegrity)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={agentMetrics.sessionIntegrity * 100}
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: DARK_THEME.border,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getScoreColor(agentMetrics.sessionIntegrity),
                  borderRadius: 4
                }
              }} 
            />
          </Box>

          {/* Policy Violations */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ErrorIcon sx={{ color: DARK_THEME.success, fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                POLICY VIOLATIONS
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ 
              color: agentMetrics.profile?.metrics.governanceMetrics.totalViolations > 0 ? DARK_THEME.error : DARK_THEME.success, 
              fontWeight: 'bold' 
            }}>
              {agentMetrics.profile?.metrics.governanceMetrics.totalViolations || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, display: 'block', mt: 1 }}>
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>

        {/* Download Section for Transparency */}
        <Box mt={3} pt={2} borderTop={`1px solid ${DARK_THEME.border}`}>
          <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, mb: 1, display: 'block' }}>
            Download Data for Transparency
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label="📊 Metrics + Governance"
              size="small"
              onClick={downloadMetricsData}
              sx={{
                backgroundColor: DARK_THEME.primary + '20',
                color: DARK_THEME.primary,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: DARK_THEME.primary + '30'
                }
              }}
            />
            {telemetryData && (
              <Chip
                label="🧠 Telemetry + Self-Awareness"
                size="small"
                onClick={downloadTelemetryData}
                sx={{
                  backgroundColor: DARK_THEME.success + '20',
                  color: DARK_THEME.success,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: DARK_THEME.success + '30'
                  }
                }}
              />
            )}
            <Chip
              label="📋 Complete Governance History"
              size="small"
              onClick={downloadCompleteGovernanceHistory}
              sx={{
                backgroundColor: DARK_THEME.warning + '20',
                color: DARK_THEME.warning,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: DARK_THEME.warning + '30'
                }
              }}
            />
            {isLoadingTelemetry && (
              <Chip
                label="Loading telemetry..."
                size="small"
                sx={{
                  backgroundColor: DARK_THEME.warning + '20',
                  color: DARK_THEME.warning
                }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </MetricsCard>
  );
};

export default AgentMetricsWidget;

