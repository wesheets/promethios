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
  Tooltip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  DataObject as DataObjectIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAgentMetrics } from '../hooks/useAgentMetrics';

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
  const agentMetrics = useAgentMetrics(agentId, version, true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const downloadMenuOpen = Boolean(downloadMenuAnchor);

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

  // Download functionality
  const handleDownloadMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  const downloadJSON = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    handleDownloadMenuClose();
  };

  const handleDownloadCurrentMetrics = () => {
    const metricsData = {
      agentId,
      agentName,
      version,
      timestamp: new Date().toISOString(),
      metrics: {
        trustScore: agentMetrics.trustScore,
        complianceRate: agentMetrics.complianceRate,
        responseTime: agentMetrics.responseTime,
        sessionIntegrity: agentMetrics.sessionIntegrity
      },
      profile: agentMetrics.profile,
      rawData: agentMetrics
    };
    downloadJSON(metricsData, `${agentId}_metrics_${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleDownloadFullProfile = () => {
    if (agentMetrics.profile) {
      downloadJSON(agentMetrics.profile, `${agentId}_full_profile_${new Date().toISOString().split('T')[0]}.json`);
    }
  };

  const handleDownloadGovernanceHistory = () => {
    const governanceData = {
      agentId,
      timestamp: new Date().toISOString(),
      governanceMetrics: agentMetrics.profile?.metrics?.governanceMetrics,
      interactions: agentMetrics.profile?.metrics?.interactions || [],
      violations: agentMetrics.profile?.metrics?.violations || [],
      trustHistory: agentMetrics.profile?.metrics?.trustHistory || []
    };
    downloadJSON(governanceData, `${agentId}_governance_history_${new Date().toISOString().split('T')[0]}.json`);
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
            <Box display="flex" gap={1} alignItems="center">
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
              {!compact && (
                <Tooltip title="Download Backend Data">
                  <IconButton
                    onClick={handleDownloadMenuOpen}
                    size="small"
                    sx={{ 
                      color: DARK_THEME.text.secondary,
                      '&:hover': { 
                        color: DARK_THEME.primary,
                        backgroundColor: DARK_THEME.primary + '10'
                      }
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}

        <Grid container spacing={compact ? 1 : 2}>
          {/* Trust Score */}
          <Grid item xs={compact ? 6 : 12} sm={compact ? 6 : 6} md={compact ? 6 : 3}>
            <MetricItem>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ShieldIcon sx={{ color: DARK_THEME.primary, fontSize: compact ? 16 : 20 }} />
                <Typography variant={compact ? "caption" : "subtitle2"} sx={{ color: DARK_THEME.text.primary }}>
                  TRUST SCORE
                </Typography>
              </Box>
              <Typography variant={compact ? "h6" : "h4"} sx={{ color: getScoreColor(agentMetrics.trustScore), fontWeight: 'bold' }}>
                {formatPercentage(agentMetrics.trustScore)}
              </Typography>
              {!compact && (
                <LinearProgress 
                  variant="determinate" 
                  value={agentMetrics.trustScore * 100}
                  sx={{ 
                    mt: 1,
                    backgroundColor: DARK_THEME.border,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(agentMetrics.trustScore)
                    }
                  }} 
                />
              )}
            </MetricItem>
          </Grid>

          {/* Compliance Rate */}
          <Grid item xs={compact ? 6 : 12} sm={compact ? 6 : 6} md={compact ? 6 : 3}>
            <MetricItem>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckCircleIcon sx={{ color: DARK_THEME.success, fontSize: compact ? 16 : 20 }} />
                <Typography variant={compact ? "caption" : "subtitle2"} sx={{ color: DARK_THEME.text.primary }}>
                  COMPLIANCE
                </Typography>
              </Box>
              <Typography variant={compact ? "h6" : "h4"} sx={{ color: getScoreColor(agentMetrics.complianceRate), fontWeight: 'bold' }}>
                {formatPercentage(agentMetrics.complianceRate)}
              </Typography>
              {!compact && (
                <LinearProgress 
                  variant="determinate" 
                  value={agentMetrics.complianceRate * 100}
                  sx={{ 
                    mt: 1,
                    backgroundColor: DARK_THEME.border,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(agentMetrics.complianceRate)
                    }
                  }} 
                />
              )}
            </MetricItem>
          </Grid>

          {/* Response Time */}
          <Grid item xs={compact ? 6 : 12} sm={compact ? 6 : 6} md={compact ? 6 : 3}>
            <MetricItem>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SpeedIcon sx={{ color: DARK_THEME.primary, fontSize: compact ? 16 : 20 }} />
                <Typography variant={compact ? "caption" : "subtitle2"} sx={{ color: DARK_THEME.text.primary }}>
                  RESPONSE TIME
                </Typography>
              </Box>
              <Typography variant={compact ? "h6" : "h4"} sx={{ color: DARK_THEME.primary, fontWeight: 'bold' }}>
                {formatTime(agentMetrics.responseTime)}
              </Typography>
            </MetricItem>
          </Grid>

          {/* Session Integrity */}
          <Grid item xs={compact ? 6 : 12} sm={compact ? 6 : 6} md={compact ? 6 : 3}>
            <MetricItem>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <VisibilityIcon sx={{ color: DARK_THEME.warning, fontSize: compact ? 16 : 20 }} />
                <Typography variant={compact ? "caption" : "subtitle2"} sx={{ color: DARK_THEME.text.primary }}>
                  INTEGRITY
                </Typography>
              </Box>
              <Typography variant={compact ? "h6" : "h4"} sx={{ color: getScoreColor(agentMetrics.sessionIntegrity), fontWeight: 'bold' }}>
                {formatPercentage(agentMetrics.sessionIntegrity)}
              </Typography>
              {!compact && (
                <LinearProgress 
                  variant="determinate" 
                  value={agentMetrics.sessionIntegrity * 100}
                  sx={{ 
                    mt: 1,
                    backgroundColor: DARK_THEME.border,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(agentMetrics.sessionIntegrity)
                    }
                  }} 
                />
              )}
            </MetricItem>
          </Grid>
        </Grid>

        {/* Additional Stats for non-compact view */}
        {!compact && agentMetrics.profile && (
          <Box mt={2} pt={2} borderTop={`1px solid ${DARK_THEME.border}`}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                  Total Interactions
                </Typography>
                <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, fontWeight: 'bold' }}>
                  {agentMetrics.profile.metrics.governanceMetrics.totalInteractions}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                  Violations
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: agentMetrics.profile.metrics.governanceMetrics.totalViolations > 0 ? DARK_THEME.error : DARK_THEME.success, 
                  fontWeight: 'bold' 
                }}>
                  {agentMetrics.profile.metrics.governanceMetrics.totalViolations}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                  {lastUpdateTime.toLocaleTimeString()}
                </Typography>
              </Grid>
              {version === 'production' && agentMetrics.profile.deployments.length > 0 && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                    Deployments
                  </Typography>
                  <Typography variant="body2" sx={{ color: DARK_THEME.primary, fontWeight: 'bold' }}>
                    {agentMetrics.profile.deployments.length}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Download Menu */}
        <Menu
          anchorEl={downloadMenuAnchor}
          open={downloadMenuOpen}
          onClose={handleDownloadMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: DARK_THEME.surface,
              border: `1px solid ${DARK_THEME.border}`,
              '& .MuiMenuItem-root': {
                color: DARK_THEME.text.primary,
                '&:hover': {
                  backgroundColor: DARK_THEME.primary + '20'
                }
              }
            }
          }}
        >
          <MenuItem onClick={handleDownloadCurrentMetrics}>
            <DataObjectIcon sx={{ mr: 1, fontSize: 18 }} />
            Current Metrics JSON
          </MenuItem>
          <MenuItem onClick={handleDownloadFullProfile}>
            <DataObjectIcon sx={{ mr: 1, fontSize: 18 }} />
            Full Agent Profile
          </MenuItem>
          <Divider sx={{ backgroundColor: DARK_THEME.border }} />
          <MenuItem onClick={handleDownloadGovernanceHistory}>
            <HistoryIcon sx={{ mr: 1, fontSize: 18 }} />
            Governance History
          </MenuItem>
        </Menu>
      </CardContent>
    </MetricsCard>
  );
};

export default AgentMetricsWidget;

