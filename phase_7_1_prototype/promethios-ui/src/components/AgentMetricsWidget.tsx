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
  // NEW: Audit log access integration
  showAuditAccess?: boolean;
  auditLogAccess?: any; // AuditLogAccessExtension instance
  autonomousCognition?: any; // AutonomousCognitionExtension instance
}

export const AgentMetricsWidget: React.FC<AgentMetricsWidgetProps> = ({
  agentId,
  agentName,
  version = 'test',
  compact = false,
  showTitle = true,
  refreshInterval = 30000,
  onMetricsUpdate,
  // NEW: Audit log access props
  showAuditAccess = false,
  auditLogAccess,
  autonomousCognition
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

  // NEW: Audit log access state
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [policyCompliance, setPolicyCompliance] = useState<any>(null);
  const [assignedPolicies, setAssignedPolicies] = useState<any[]>([]);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);
  const [autonomyLevel, setAutonomyLevel] = useState<string>('standard');

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

  // NEW: Load audit log access data when extensions are available
  useEffect(() => {
    const loadAuditData = async () => {
      if (auditLogAccess && agentId) {
        try {
          console.log('🔧 Loading audit data for agent:', agentId);
          
          // Load audit history
          const history = await auditLogAccess.getMyAuditHistory(agentId);
          setAuditHistory(history);
          
          // Load policy compliance analysis
          const compliance = await auditLogAccess.analyzeMyPolicyCompliance(agentId);
          setPolicyCompliance(compliance);
          
          // Load assigned policies
          const policies = await auditLogAccess.getMyAssignedPolicies(agentId);
          setAssignedPolicies(policies);
          
          console.log('✅ Audit data loaded successfully');
        } catch (error) {
          console.error('❌ Failed to load audit data:', error);
        }
      }
    };
    
    loadAuditData();
  }, [auditLogAccess, agentId]);

  // NEW: Load autonomous cognition level
  useEffect(() => {
    const loadAutonomyLevel = async () => {
      if (autonomousCognition && agentId) {
        try {
          const level = await autonomousCognition.getCurrentAutonomyLevel(agentId);
          setAutonomyLevel(level);
        } catch (error) {
          console.error('❌ Failed to load autonomy level:', error);
        }
      }
    };
    
    loadAutonomyLevel();
  }, [autonomousCognition, agentId]);

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined) return '--';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatTime = (milliseconds: number | undefined): string => {
    if (milliseconds === undefined) return '--';
    return `${(milliseconds / 1000).toFixed(1)}s`;
  };

  const getScoreColor = (score: number | undefined): string => {
    if (score === undefined) return DARK_THEME.text.secondary;
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
              variant={agentMetrics.trustScore === undefined ? "indeterminate" : "determinate"}
              value={agentMetrics.trustScore === undefined ? 0 : agentMetrics.trustScore * 100}
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
              variant={agentMetrics.complianceRate === undefined ? "indeterminate" : "determinate"}
              value={agentMetrics.complianceRate === undefined ? 0 : agentMetrics.complianceRate * 100}
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
              variant={agentMetrics.sessionIntegrity === undefined ? "indeterminate" : "determinate"}
              value={agentMetrics.sessionIntegrity === undefined ? 0 : agentMetrics.sessionIntegrity * 100}
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

        {/* NEW: Audit Log Access Section */}
        {showAuditAccess && auditLogAccess && (
          <Box mt={3}>
            <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, fontWeight: 'bold', mb: 2 }}>
              🔍 Audit Log Access
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box 
                  onClick={() => setShowAuditPanel(!showAuditPanel)}
                  sx={{ 
                    p: 2, 
                    border: `1px solid ${DARK_THEME.border}`, 
                    borderRadius: 1, 
                    cursor: 'pointer',
                    backgroundColor: showAuditPanel ? DARK_THEME.primary + '20' : 'transparent',
                    '&:hover': { backgroundColor: DARK_THEME.primary + '10' }
                  }}
                >
                  <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, fontWeight: 'bold' }}>
                    📋 My Audit History
                  </Typography>
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                    {auditHistory.length} entries • Click to {showAuditPanel ? 'hide' : 'view'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box 
                  onClick={() => setShowPolicyDetails(!showPolicyDetails)}
                  sx={{ 
                    p: 2, 
                    border: `1px solid ${DARK_THEME.border}`, 
                    borderRadius: 1, 
                    cursor: 'pointer',
                    backgroundColor: showPolicyDetails ? DARK_THEME.primary + '20' : 'transparent',
                    '&:hover': { backgroundColor: DARK_THEME.primary + '10' }
                  }}
                >
                  <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, fontWeight: 'bold' }}>
                    📜 Policy Compliance
                  </Typography>
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                    {assignedPolicies.length} policies • {((policyCompliance?.overallComplianceRate || 0.8) * 100).toFixed(1)}% compliance
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Audit History Panel */}
            {showAuditPanel && (
              <Box mt={2} p={2} sx={{ border: `1px solid ${DARK_THEME.border}`, borderRadius: 1, backgroundColor: DARK_THEME.background }}>
                <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
                  Recent Audit Entries
                </Typography>
                {auditHistory.slice(0, 5).map((entry, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: DARK_THEME.surface, borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                      {entry.interaction_type}: {entry.user_message?.substring(0, 50)}...
                    </Typography>
                    <Typography variant="caption" sx={{ color: getScoreColor(entry.trust_impact) }}>
                      Trust Impact: {entry.trust_impact?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Policy Details Panel */}
            {showPolicyDetails && (
              <Box mt={2} p={2} sx={{ border: `1px solid ${DARK_THEME.border}`, borderRadius: 1, backgroundColor: DARK_THEME.background }}>
                <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
                  Assigned Policies
                </Typography>
                {assignedPolicies.map((policy, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: DARK_THEME.surface, borderRadius: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, fontWeight: 'bold' }}>
                        {policy.policyName}
                      </Typography>
                      <Chip 
                        label={`${(policy.complianceRate * 100).toFixed(1)}%`}
                        size="small"
                        sx={{ 
                          backgroundColor: getScoreColor(policy.complianceRate) + '20',
                          color: getScoreColor(policy.complianceRate)
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                      Violations: {policy.violationCount || 0} • Rules: {policy.policyContent?.rules?.length || 0}
                    </Typography>
                    {policy.policyContent?.rules?.slice(0, 2).map((rule: any, ruleIndex: number) => (
                      <Typography key={ruleIndex} variant="caption" sx={{ display: 'block', color: DARK_THEME.text.secondary, mt: 0.5 }}>
                        • {rule.name}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* NEW: Autonomous Cognition Section */}
        {showAuditAccess && autonomousCognition && (
          <Box mt={3}>
            <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, fontWeight: 'bold', mb: 2 }}>
              🧠 Autonomous Cognition
            </Typography>
            
            <Box p={2} sx={{ border: `1px solid ${DARK_THEME.border}`, borderRadius: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                  Current Autonomy Level
                </Typography>
                <Chip 
                  label={autonomyLevel.toUpperCase()}
                  size="small"
                  sx={{ 
                    backgroundColor: DARK_THEME.primary + '20',
                    color: DARK_THEME.primary
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                Based on trust score and governance compliance
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </MetricsCard>
  );
};

export default AgentMetricsWidget;

