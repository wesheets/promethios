/**
 * AtlasChatIntegration.tsx
 * 
 * Integration component for ATLAS chat functionality within the main chat interface.
 * This component provides governance explanations and transparency features.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Alert,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import AtlasChatService, { ChatContext } from './AtlasChatService';
import AtlasChatIPProtection from './AtlasChatIPProtection';

interface AtlasChatIntegrationProps {
  agentId?: string;
  sessionId?: string;
  userType?: 'public' | 'authenticated' | 'developer';
  onGovernanceUpdate?: (metrics: GovernanceMetrics) => void;
}

interface GovernanceMetrics {
  trustScore: number;
  constitutionalCompliance: number;
  beliefTraceAccuracy: number;
  responseAlignment: number;
  interventionRate: number;
}

export const AtlasChatIntegration: React.FC<AtlasChatIntegrationProps> = ({
  agentId,
  sessionId,
  userType = 'public',
  onGovernanceUpdate
}) => {
  const [expanded, setExpanded] = useState(false);
  const [atlasService] = useState(() => new AtlasChatService({
    mode: agentId ? 'session' : 'public',
    agentId,
    sessionId,
    userProfile: {
      isLoggedIn: userType !== 'public',
      role: userType
    }
  }));
  const [ipProtection] = useState(() => new AtlasChatIPProtection());
  const [metrics, setMetrics] = useState<GovernanceMetrics>({
    trustScore: 92,
    constitutionalCompliance: 94,
    beliefTraceAccuracy: 89,
    responseAlignment: 96,
    interventionRate: 2.3
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Simulate governance monitoring
    setIsMonitoring(true);
    
    const interval = setInterval(() => {
      // Simulate metric updates
      setMetrics(prev => ({
        trustScore: Math.max(85, Math.min(100, prev.trustScore + (Math.random() - 0.5) * 2)),
        constitutionalCompliance: Math.max(90, Math.min(100, prev.constitutionalCompliance + (Math.random() - 0.5) * 1)),
        beliefTraceAccuracy: Math.max(85, Math.min(95, prev.beliefTraceAccuracy + (Math.random() - 0.5) * 2)),
        responseAlignment: Math.max(90, Math.min(100, prev.responseAlignment + (Math.random() - 0.5) * 1)),
        interventionRate: Math.max(0, Math.min(5, prev.interventionRate + (Math.random() - 0.5) * 0.5))
      }));
    }, 5000);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, []);

  useEffect(() => {
    if (onGovernanceUpdate) {
      onGovernanceUpdate(metrics);
    }
  }, [metrics, onGovernanceUpdate]);

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 95) return 'Excellent';
    if (score >= 90) return 'Good';
    if (score >= 75) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <Paper elevation={1} sx={{ mb: 2, border: '1px solid', borderColor: 'primary.main' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          bgcolor: 'primary.50'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <SecurityIcon color="primary" />
        <Typography variant="subtitle2" fontWeight="medium" sx={{ flex: 1 }}>
          Promethios Observer
        </Typography>
        
        {isMonitoring && (
          <Chip
            icon={<VerifiedIcon />}
            label="Active"
            size="small"
            color="success"
            variant="outlined"
          />
        )}
        
        <Tooltip title="Trust Score">
          <Chip
            label={`${metrics.trustScore}/100`}
            size="small"
            color={getScoreColor(metrics.trustScore)}
            variant="filled"
          />
        </Tooltip>
        
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0 }}>
          {/* Status Alert */}
          <Alert 
            severity={getScoreColor(metrics.trustScore)} 
            sx={{ mb: 2 }}
            icon={<InfoIcon />}
          >
            <Typography variant="body2">
              Governance Status: <strong>{getScoreLabel(metrics.trustScore)}</strong>
              {agentId && ` for Agent ${agentId}`}
              {sessionId && ` (Session: ${sessionId.substring(0, 8)}...)`}
            </Typography>
          </Alert>

          {/* Metrics Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
            {/* Constitutional Compliance */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Constitutional Compliance
                </Typography>
                <Typography variant="caption" fontWeight="medium">
                  {metrics.constitutionalCompliance.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.constitutionalCompliance}
                color={getScoreColor(metrics.constitutionalCompliance)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>

            {/* Belief Trace Accuracy */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Belief Trace Accuracy
                </Typography>
                <Typography variant="caption" fontWeight="medium">
                  {metrics.beliefTraceAccuracy.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.beliefTraceAccuracy}
                color={getScoreColor(metrics.beliefTraceAccuracy)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>

            {/* Response Alignment */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Response Alignment
                </Typography>
                <Typography variant="caption" fontWeight="medium">
                  {metrics.responseAlignment.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.responseAlignment}
                color={getScoreColor(metrics.responseAlignment)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>

            {/* Intervention Rate */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Intervention Rate
                </Typography>
                <Typography variant="caption" fontWeight="medium">
                  {metrics.interventionRate.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, metrics.interventionRate * 20)} // Scale 0-5% to 0-100%
                color={metrics.interventionRate < 3 ? 'success' : metrics.interventionRate < 5 ? 'warning' : 'error'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          </Box>

          {/* User Type Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Access Level:
            </Typography>
            <Chip
              label={userType.charAt(0).toUpperCase() + userType.slice(1)}
              size="small"
              variant="outlined"
              color={userType === 'developer' ? 'primary' : userType === 'authenticated' ? 'secondary' : 'default'}
            />
            <Typography variant="caption" color="text.secondary">
              • {ipProtection.getAllowedExplanationLevels(userType).length} explanation levels available
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AtlasChatIntegration;

