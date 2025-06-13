import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Collapse,
  Grid,
  Divider,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as ObserverIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as TrendingFlatIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import {
  GovernanceMetrics,
  RiskLevel,
  ViolationType,
  ViolationSeverity,
  ChatMessage
} from '../types';
import { GovernanceMonitoringService } from '../services/GovernanceMonitoringService';

interface GovernancePanelProps {
  messages: ChatMessage[];
  currentMetrics?: GovernanceMetrics;
  isActive: boolean;
  onToggle?: (active: boolean) => void;
  compact?: boolean;
  realTimeMode?: boolean;
}

export const GovernancePanel: React.FC<GovernancePanelProps> = ({
  messages,
  currentMetrics,
  isActive,
  onToggle,
  compact = false,
  realTimeMode = true
}) => {
  const [expanded, setExpanded] = useState(!compact);
  const [sessionMetrics, setSessionMetrics] = useState<any>(null);
  const [recentViolations, setRecentViolations] = useState<any[]>([]);

  // Calculate session-wide metrics
  useEffect(() => {
    if (messages.length > 0) {
      const metrics = GovernanceMonitoringService.aggregateSessionMetrics(messages);
      setSessionMetrics(metrics);

      // Get recent violations
      const violations = messages
        .filter(m => m.governanceMetrics?.violations.length)
        .flatMap(m => m.governanceMetrics!.violations.map(v => ({ ...v, messageId: m.id, timestamp: m.timestamp })))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
      
      setRecentViolations(violations);
    }
  }, [messages]);

  // Get governance status
  const getGovernanceStatus = () => {
    if (!isActive) {
      return {
        icon: <SecurityIcon />,
        color: '#757575',
        label: 'Governance Disabled',
        description: 'Click to enable real-time monitoring'
      };
    }

    if (!currentMetrics && !sessionMetrics) {
      return {
        icon: <ShieldIcon />,
        color: '#2196F3',
        label: 'Monitoring Active',
        description: 'Waiting for conversation to begin'
      };
    }

    const avgCompliance = sessionMetrics?.averageComplianceScore || currentMetrics?.complianceScore || 0;
    const totalViolations = sessionMetrics?.totalViolations || (currentMetrics?.violations.length || 0);

    if (totalViolations === 0 && avgCompliance >= 90) {
      return {
        icon: <CheckCircleIcon />,
        color: '#4CAF50',
        label: 'Excellent Governance',
        description: 'All interactions are compliant'
      };
    }

    if (totalViolations === 0 && avgCompliance >= 70) {
      return {
        icon: <CheckCircleIcon />,
        color: '#8BC34A',
        label: 'Good Governance',
        description: 'Interactions are generally compliant'
      };
    }

    if (totalViolations > 0) {
      return {
        icon: <WarningIcon />,
        color: '#F44336',
        label: `${totalViolations} Violation${totalViolations > 1 ? 's' : ''}`,
        description: 'Governance issues detected'
      };
    }

    return {
      icon: <ErrorIcon />,
      color: '#FF9800',
      label: 'Needs Attention',
      description: 'Compliance score below threshold'
    };
  };

  const status = getGovernanceStatus();

  // Metric card component
  const MetricCard = ({ title, value, trend, color, icon }: any) => (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: color, width: 32, height: 32, mr: 1 }}>
            {icon}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h6" fontWeight="bold" color={color}>
          {value}
        </Typography>
        
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            {trend > 0 && <TrendingUpIcon sx={{ fontSize: 16, color: '#4CAF50' }} />}
            {trend < 0 && <TrendingDownIcon sx={{ fontSize: 16, color: '#F44336' }} />}
            {trend === 0 && <TrendingFlatIcon sx={{ fontSize: 16, color: '#757575' }} />}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {trend > 0 ? 'Improving' : trend < 0 ? 'Declining' : 'Stable'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Violation item component
  const ViolationItem = ({ violation, timestamp }: any) => (
    <ListItem dense>
      <ListItemIcon>
        {violation.severity === ViolationSeverity.CRITICAL && (
          <ErrorIcon sx={{ color: '#9C27B0', fontSize: 20 }} />
        )}
        {violation.severity === ViolationSeverity.ERROR && (
          <ErrorIcon sx={{ color: '#F44336', fontSize: 20 }} />
        )}
        {violation.severity === ViolationSeverity.WARNING && (
          <WarningIcon sx={{ color: '#FF9800', fontSize: 20 }} />
        )}
        {violation.severity === ViolationSeverity.INFO && (
          <InfoIcon sx={{ color: '#2196F3', fontSize: 20 }} />
        )}
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="body2" fontWeight="bold">
            {violation.type.replace('_', ' ').toUpperCase()}
          </Typography>
        }
        secondary={
          <Box>
            <Typography variant="caption" color="text.secondary">
              {violation.description}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {timestamp.toLocaleTimeString()}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );

  if (compact && !expanded) {
    return (
      <Box sx={{ p: 1 }}>
        <Chip
          icon={status.icon}
          label={status.label}
          onClick={() => setExpanded(true)}
          sx={{
            bgcolor: `${status.color}20`,
            color: status.color,
            border: 1,
            borderColor: `${status.color}40`,
            cursor: 'pointer',
            '& .MuiChip-icon': {
              color: status.color
            }
          }}
        />
      </Box>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        width: compact ? 300 : '100%',
        maxHeight: compact ? 400 : 600,
        overflow: 'auto',
        border: 1,
        borderColor: 'divider'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: status.color, width: 32, height: 32, mr: 1 }}>
            {status.icon}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Governance Monitor
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {status.description}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {realTimeMode && (
            <Tooltip title="Real-time monitoring active">
              <Badge color="success" variant="dot">
                <ObserverIcon sx={{ color: 'text.secondary' }} />
              </Badge>
            </Tooltip>
          )}
          
          {compact && (
            <IconButton size="small" onClick={() => setExpanded(false)}>
              <ExpandLessIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Current Metrics */}
      {currentMetrics && (
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Message
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <MetricCard
                title="Compliance"
                value={GovernanceMonitoringService.formatScore(currentMetrics.complianceScore)}
                color={currentMetrics.complianceScore >= 70 ? '#4CAF50' : '#F44336'}
                icon={<ShieldIcon sx={{ fontSize: 16 }} />}
              />
            </Grid>
            <Grid item xs={6}>
              <MetricCard
                title="Trust Score"
                value={GovernanceMonitoringService.formatScore(currentMetrics.trustScore)}
                color={currentMetrics.trustScore >= 70 ? '#4CAF50' : '#F44336'}
                icon={<SecurityIcon sx={{ fontSize: 16 }} />}
              />
            </Grid>
          </Grid>

          {/* Risk Level */}
          <Box sx={{ mt: 2 }}>
            <Chip
              label={`Risk: ${currentMetrics.riskLevel.toUpperCase()}`}
              size="small"
              sx={{
                bgcolor: GovernanceMonitoringService.getRiskLevelColor(currentMetrics.riskLevel),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>
        </Box>
      )}

      {/* Session Overview */}
      {sessionMetrics && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Session Overview
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <MetricCard
                title="Avg Compliance"
                value={GovernanceMonitoringService.formatScore(sessionMetrics.averageComplianceScore)}
                color={sessionMetrics.averageComplianceScore >= 70 ? '#4CAF50' : '#F44336'}
                icon={<AssessmentIcon sx={{ fontSize: 16 }} />}
              />
            </Grid>
            <Grid item xs={6}>
              <MetricCard
                title="Avg Trust"
                value={GovernanceMonitoringService.formatScore(sessionMetrics.averageTrustScore)}
                color={sessionMetrics.averageTrustScore >= 70 ? '#4CAF50' : '#F44336'}
                icon={<SpeedIcon sx={{ fontSize: 16 }} />}
              />
            </Grid>
          </Grid>

          {/* Risk Distribution */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Risk Distribution
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(sessionMetrics.riskDistribution).map(([level, count]) => (
                count > 0 && (
                  <Chip
                    key={level}
                    label={`${level}: ${count}`}
                    size="small"
                    sx={{
                      bgcolor: GovernanceMonitoringService.getRiskLevelColor(level as RiskLevel),
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                )
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Recent Violations */}
      {recentViolations.length > 0 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            Recent Violations ({recentViolations.length})
          </Typography>
          
          <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
            {recentViolations.map((violation, index) => (
              <ViolationItem
                key={index}
                violation={violation}
                timestamp={violation.timestamp}
              />
            ))}
          </List>
        </Box>
      )}

      {/* No Data State */}
      {!currentMetrics && !sessionMetrics && isActive && (
        <Box
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Governance monitoring is active
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Metrics will appear as you chat
          </Typography>
        </Box>
      )}

      {/* Disabled State */}
      {!isActive && (
        <Box
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <SecurityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Governance monitoring is disabled
          </Typography>
          {onToggle && (
            <Chip
              label="Enable Monitoring"
              onClick={() => onToggle(true)}
              sx={{ mt: 1 }}
              color="primary"
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

