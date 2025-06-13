import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as TrendingFlatIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  GovernanceMetrics,
  RiskLevel,
  ChatMessage
} from '../types';
import { GovernanceMonitoringService } from '../services/GovernanceMonitoringService';

interface MetricsDashboardProps {
  messages: ChatMessage[];
  currentMetrics?: GovernanceMetrics;
  realTimeMode?: boolean;
  compact?: boolean;
  showTrends?: boolean;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  messages,
  currentMetrics,
  realTimeMode = true,
  compact = false,
  showTrends = true
}) => {
  const [sessionMetrics, setSessionMetrics] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(!compact);

  // Calculate session metrics and trends
  useEffect(() => {
    if (messages.length > 0) {
      const metrics = GovernanceMonitoringService.aggregateSessionMetrics(messages);
      setSessionMetrics(metrics);

      // Calculate trend data (last 10 messages)
      if (showTrends) {
        const recentMessages = messages.slice(-10);
        const trends = recentMessages.map((msg, index) => ({
          index,
          compliance: msg.governanceMetrics?.complianceScore || 0,
          trust: msg.governanceMetrics?.trustScore || 0,
          timestamp: msg.timestamp
        }));
        setTrendData(trends);
      }
    }
  }, [messages, showTrends]);

  // Get trend direction
  const getTrendDirection = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'flat';
  };

  // Get trend icon
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUpIcon sx={{ fontSize: 16, color: '#4CAF50' }} />;
      case 'down':
        return <TrendingDownIcon sx={{ fontSize: 16, color: '#F44336' }} />;
      default:
        return <TrendingFlatIcon sx={{ fontSize: 16, color: '#757575' }} />;
    }
  };

  // Metric card component
  const MetricCard = ({ 
    title, 
    value, 
    previousValue, 
    color, 
    icon, 
    subtitle,
    showProgress = false,
    maxValue = 100
  }: any) => {
    const trend = previousValue !== undefined ? getTrendDirection(value, previousValue) : 'flat';
    const trendIcon = getTrendIcon(trend);

    return (
      <Card elevation={1} sx={{ height: '100%' }}>
        <CardContent sx={{ p: compact ? 1.5 : 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ bgcolor: color, width: 32, height: 32, mr: 1 }}>
              {icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {showTrends && trendIcon}
          </Box>
          
          <Typography variant="h6" fontWeight="bold" color={color} sx={{ mb: 1 }}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </Typography>
          
          {showProgress && typeof value === 'number' && (
            <LinearProgress
              variant="determinate"
              value={(value / maxValue) * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: color,
                  borderRadius: 3
                }
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  // Risk distribution component
  const RiskDistribution = ({ distribution }: { distribution: Record<string, number> }) => (
    <Card elevation={1}>
      <CardContent sx={{ p: compact ? 1.5 : 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Risk Distribution
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Object.entries(distribution).map(([level, count]) => {
            const total = Object.values(distribution).reduce((sum, c) => sum + c, 0);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const color = GovernanceMonitoringService.getRiskLevelColor(level as RiskLevel);
            
            return count > 0 && (
              <Box key={level}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                    {level}
                  </Typography>
                  <Typography variant="caption">
                    {count} ({percentage.toFixed(1)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: color,
                      borderRadius: 2
                    }
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );

  // Violation summary component
  const ViolationSummary = ({ violations }: { violations: any[] }) => {
    const violationCounts = violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {});

    return (
      <Card elevation={1}>
        <CardContent sx={{ p: compact ? 1.5 : 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Violations Summary
          </Typography>
          
          {violations.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#4CAF50' }}>
              <CheckCircleIcon sx={{ fontSize: 20, mr: 1 }} />
              <Typography variant="body2">No violations detected</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(violationCounts).map(([severity, count]) => {
                const color = severity === 'critical' ? '#9C27B0' :
                             severity === 'error' ? '#F44336' :
                             severity === 'warning' ? '#FF9800' : '#2196F3';
                
                return (
                  <Chip
                    key={severity}
                    label={`${severity}: ${count}`}
                    size="small"
                    sx={{
                      bgcolor: color,
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!sessionMetrics && !currentMetrics) {
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Waiting for governance data...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: compact ? 1 : 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Governance Metrics
          </Typography>
          {realTimeMode && (
            <Chip
              label="Live"
              size="small"
              color="success"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        
        {compact && (
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      <Collapse in={expanded || !compact}>
        {/* Current Message Metrics */}
        {currentMetrics && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Message
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <MetricCard
                  title="Compliance"
                  value={currentMetrics.complianceScore}
                  color={currentMetrics.complianceScore >= 70 ? '#4CAF50' : '#F44336'}
                  icon={<ShieldIcon sx={{ fontSize: 16 }} />}
                  showProgress={true}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricCard
                  title="Trust Score"
                  value={currentMetrics.trustScore}
                  color={currentMetrics.trustScore >= 70 ? '#4CAF50' : '#F44336'}
                  icon={<SecurityIcon sx={{ fontSize: 16 }} />}
                  showProgress={true}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricCard
                  title="Risk Level"
                  value={currentMetrics.riskLevel.toUpperCase()}
                  color={GovernanceMonitoringService.getRiskLevelColor(currentMetrics.riskLevel)}
                  icon={<WarningIcon sx={{ fontSize: 16 }} />}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricCard
                  title="Violations"
                  value={currentMetrics.violations.length}
                  color={currentMetrics.violations.length === 0 ? '#4CAF50' : '#F44336'}
                  icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Session Overview */}
        {sessionMetrics && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Session Overview ({messages.length} messages)
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <MetricCard
                  title="Avg Compliance"
                  value={sessionMetrics.averageComplianceScore}
                  previousValue={trendData.length > 1 ? trendData[trendData.length - 2]?.compliance : undefined}
                  color={sessionMetrics.averageComplianceScore >= 70 ? '#4CAF50' : '#F44336'}
                  icon={<AssessmentIcon sx={{ fontSize: 16 }} />}
                  showProgress={true}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricCard
                  title="Avg Trust"
                  value={sessionMetrics.averageTrustScore}
                  previousValue={trendData.length > 1 ? trendData[trendData.length - 2]?.trust : undefined}
                  color={sessionMetrics.averageTrustScore >= 70 ? '#4CAF50' : '#F44336'}
                  icon={<SpeedIcon sx={{ fontSize: 16 }} />}
                  showProgress={true}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricCard
                  title="Total Violations"
                  value={sessionMetrics.totalViolations}
                  color={sessionMetrics.totalViolations === 0 ? '#4CAF50' : '#F44336'}
                  icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricCard
                  title="Governance Rate"
                  value={`${((sessionMetrics.governedMessages / messages.length) * 100).toFixed(1)}%`}
                  subtitle={`${sessionMetrics.governedMessages}/${messages.length} governed`}
                  color={sessionMetrics.governedMessages / messages.length >= 0.8 ? '#4CAF50' : '#FF9800'}
                  icon={<TimelineIcon sx={{ fontSize: 16 }} />}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Risk Distribution and Violations */}
        {sessionMetrics && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <RiskDistribution distribution={sessionMetrics.riskDistribution} />
            </Grid>
            <Grid item xs={12} md={6}>
              <ViolationSummary violations={sessionMetrics.allViolations || []} />
            </Grid>
          </Grid>
        )}
      </Collapse>
    </Paper>
  );
};

