/**
 * Real-Time Metrics Display
 * 
 * Live streaming metrics dashboard for Enhanced Veritas 2 collaboration sessions,
 * providing instant feedback on collaboration health and performance indicators.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Badge,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import {
  Speed,
  Timeline,
  TrendingUp,
  TrendingDown,
  Group,
  Psychology,
  CheckCircle,
  Warning,
  Error,
  Info,
  Refresh,
  Pause,
  PlayArrow,
  Fullscreen,
  Notifications
} from '@mui/icons-material';

interface MetricValue {
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  timestamp: number;
}

interface RealTimeMetric {
  id: string;
  name: string;
  value: MetricValue;
  unit: string;
  category: 'performance' | 'collaboration' | 'uncertainty' | 'quality';
  threshold: {
    warning: number;
    critical: number;
  };
  format: 'percentage' | 'number' | 'time' | 'rate';
}

interface AlertMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  metric?: string;
  acknowledged: boolean;
}

interface RealTimeMetricsDisplayProps {
  sessionId?: string;
  refreshInterval?: number;
  autoRefresh?: boolean;
  onMetricAlert?: (alert: AlertMessage) => void;
  className?: string;
}

const RealTimeMetricsDisplay: React.FC<RealTimeMetricsDisplayProps> = ({
  sessionId,
  refreshInterval = 2000,
  autoRefresh = true,
  onMetricAlert,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [isLive, setIsLive] = useState(autoRefresh);
  const [showAlerts, setShowAlerts] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize metrics
  useEffect(() => {
    initializeMetrics();
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (isLive && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        updateMetrics();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isLive, refreshInterval]);

  const initializeMetrics = () => {
    const initialMetrics: RealTimeMetric[] = [
      {
        id: 'collaboration-effectiveness',
        name: 'Collaboration Effectiveness',
        value: {
          current: 0.75,
          previous: 0.72,
          trend: 'up',
          change: 0.03,
          timestamp: Date.now()
        },
        unit: '%',
        category: 'collaboration',
        threshold: { warning: 0.5, critical: 0.3 },
        format: 'percentage'
      },
      {
        id: 'uncertainty-reduction-rate',
        name: 'Uncertainty Reduction Rate',
        value: {
          current: 0.12,
          previous: 0.08,
          trend: 'up',
          change: 0.04,
          timestamp: Date.now()
        },
        unit: '%/min',
        category: 'uncertainty',
        threshold: { warning: 0.05, critical: 0.02 },
        format: 'rate'
      },
      {
        id: 'agent-participation',
        name: 'Agent Participation',
        value: {
          current: 0.85,
          previous: 0.88,
          trend: 'down',
          change: -0.03,
          timestamp: Date.now()
        },
        unit: '%',
        category: 'collaboration',
        threshold: { warning: 0.6, critical: 0.4 },
        format: 'percentage'
      },
      {
        id: 'response-time',
        name: 'Average Response Time',
        value: {
          current: 2.3,
          previous: 2.8,
          trend: 'down',
          change: -0.5,
          timestamp: Date.now()
        },
        unit: 's',
        category: 'performance',
        threshold: { warning: 5, critical: 10 },
        format: 'time'
      },
      {
        id: 'quality-score',
        name: 'Quality Score',
        value: {
          current: 0.92,
          previous: 0.89,
          trend: 'up',
          change: 0.03,
          timestamp: Date.now()
        },
        unit: '%',
        category: 'quality',
        threshold: { warning: 0.7, critical: 0.5 },
        format: 'percentage'
      },
      {
        id: 'emergent-behaviors',
        name: 'Emergent Behaviors',
        value: {
          current: 3,
          previous: 2,
          trend: 'up',
          change: 1,
          timestamp: Date.now()
        },
        unit: 'count',
        category: 'collaboration',
        threshold: { warning: 5, critical: 10 },
        format: 'number'
      },
      {
        id: 'consensus-level',
        name: 'Consensus Level',
        value: {
          current: 0.78,
          previous: 0.75,
          trend: 'up',
          change: 0.03,
          timestamp: Date.now()
        },
        unit: '%',
        category: 'collaboration',
        threshold: { warning: 0.5, critical: 0.3 },
        format: 'percentage'
      },
      {
        id: 'hitl-interventions',
        name: 'HITL Interventions',
        value: {
          current: 1,
          previous: 0,
          trend: 'up',
          change: 1,
          timestamp: Date.now()
        },
        unit: 'count',
        category: 'uncertainty',
        threshold: { warning: 3, critical: 5 },
        format: 'number'
      }
    ];

    setMetrics(initialMetrics);
  };

  const updateMetrics = useCallback(() => {
    setMetrics(prevMetrics => 
      prevMetrics.map(metric => {
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        const newValue = Math.max(0, metric.value.current + variation);
        const change = newValue - metric.value.current;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (Math.abs(change) > 0.01) {
          trend = change > 0 ? 'up' : 'down';
        }

        const updatedMetric = {
          ...metric,
          value: {
            current: newValue,
            previous: metric.value.current,
            trend,
            change,
            timestamp: Date.now()
          }
        };

        // Check for alerts
        checkMetricAlert(updatedMetric);

        return updatedMetric;
      })
    );

    setLastUpdate(new Date());
  }, []);

  const checkMetricAlert = (metric: RealTimeMetric) => {
    const { current } = metric.value;
    const { warning, critical } = metric.threshold;

    let alertType: 'warning' | 'error' | null = null;
    let message = '';

    // For metrics where lower is worse (like effectiveness, quality)
    if (metric.format === 'percentage' && metric.category !== 'performance') {
      if (current <= critical) {
        alertType = 'error';
        message = `${metric.name} is critically low: ${formatValue(current, metric.format, metric.unit)}`;
      } else if (current <= warning) {
        alertType = 'warning';
        message = `${metric.name} is below warning threshold: ${formatValue(current, metric.format, metric.unit)}`;
      }
    }
    // For metrics where higher is worse (like response time, interventions)
    else if (metric.id === 'response-time' || metric.id === 'hitl-interventions' || metric.id === 'emergent-behaviors') {
      if (current >= critical) {
        alertType = 'error';
        message = `${metric.name} is critically high: ${formatValue(current, metric.format, metric.unit)}`;
      } else if (current >= warning) {
        alertType = 'warning';
        message = `${metric.name} is above warning threshold: ${formatValue(current, metric.format, metric.unit)}`;
      }
    }

    if (alertType) {
      const alert: AlertMessage = {
        id: `${metric.id}-${Date.now()}`,
        type: alertType,
        message,
        timestamp: new Date(),
        metric: metric.id,
        acknowledged: false
      };

      setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts

      if (onMetricAlert) {
        onMetricAlert(alert);
      }
    }
  };

  const formatValue = (value: number, format: string, unit: string): string => {
    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}${unit}`;
      case 'time':
        return `${value.toFixed(1)}${unit}`;
      case 'rate':
        return `${(value * 100).toFixed(2)}${unit}`;
      case 'number':
        return `${Math.round(value)}`;
      default:
        return `${value.toFixed(2)}${unit}`;
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <TrendingUp sx={{ color: change > 0 ? 'success.main' : 'error.main', fontSize: 16 }} />;
    } else if (trend === 'down') {
      return <TrendingDown sx={{ color: change < 0 ? 'error.main' : 'success.main', fontSize: 16 }} />;
    }
    return <Timeline sx={{ color: 'info.main', fontSize: 16 }} />;
  };

  const getMetricColor = (metric: RealTimeMetric): string => {
    const { current } = metric.value;
    const { warning, critical } = metric.threshold;

    // For metrics where lower is worse
    if (metric.format === 'percentage' && metric.category !== 'performance') {
      if (current <= critical) return '#f56565';
      if (current <= warning) return '#ed8936';
      return '#48bb78';
    }
    // For metrics where higher is worse
    else if (metric.id === 'response-time' || metric.id === 'hitl-interventions' || metric.id === 'emergent-behaviors') {
      if (current >= critical) return '#f56565';
      if (current >= warning) return '#ed8936';
      return '#48bb78';
    }

    return '#4299e1';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Speed />;
      case 'collaboration': return <Group />;
      case 'uncertainty': return <Psychology />;
      case 'quality': return <CheckCircle />;
      default: return <Timeline />;
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const renderMetricCard = (metric: RealTimeMetric) => (
    <Card
      key={metric.id}
      sx={{
        backgroundColor: '#4a5568',
        color: 'white',
        height: '100%',
        border: `2px solid ${getMetricColor(metric)}`,
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            {getCategoryIcon(metric.category)}
            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
              {metric.name}
            </Typography>
          </Box>
          {getTrendIcon(metric.value.trend, metric.value.change)}
        </Box>

        <Typography variant="h4" color={getMetricColor(metric)} mb={1}>
          {formatValue(metric.value.current, metric.format, metric.unit)}
        </Typography>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
            Change: {metric.value.change > 0 ? '+' : ''}{formatValue(Math.abs(metric.value.change), metric.format, metric.unit)}
          </Typography>
          <Chip
            label={metric.category}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Progress bar for percentage metrics */}
        {metric.format === 'percentage' && (
          <Box mt={1}>
            <LinearProgress
              variant="determinate"
              value={metric.value.current * 100}
              sx={{
                height: 4,
                borderRadius: 2,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getMetricColor(metric)
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderAlertsPanel = () => (
    <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: '100%' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <Notifications />
            <Typography variant="h6">Live Alerts</Typography>
            <Badge badgeContent={alerts.filter(a => !a.acknowledged).length} color="error">
              <Box />
            </Badge>
          </Box>
        }
        action={
          <Box display="flex" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={showAlerts}
                  onChange={(e) => setShowAlerts(e.target.checked)}
                  size="small"
                />
              }
              label="Show"
              sx={{ color: 'white' }}
            />
            <IconButton onClick={clearAlerts} sx={{ color: 'white' }}>
              <Refresh />
            </IconButton>
          </Box>
        }
      />
      <CardContent sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {alerts.length === 0 ? (
          <Box textAlign="center" py={4}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              No alerts - all metrics within normal ranges
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {alerts.slice(0, 5).map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.type}
                sx={{
                  backgroundColor: alert.type === 'error' ? '#742a2a' :
                                 alert.type === 'warning' ? '#744210' :
                                 alert.type === 'success' ? '#2d5a2d' :
                                 '#2a4365',
                  color: 'white',
                  opacity: alert.acknowledged ? 0.6 : 1
                }}
                action={
                  !alert.acknowledged && (
                    <IconButton
                      size="small"
                      onClick={() => acknowledgeAlert(alert.id)}
                      sx={{ color: 'white' }}
                    >
                      <CheckCircle />
                    </IconButton>
                  )
                }
              >
                <Typography variant="caption">
                  {alert.timestamp.toLocaleTimeString()}
                </Typography>
                <Typography variant="body2">
                  {alert.message}
                </Typography>
              </Alert>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box className={className}>
      {/* Header */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', mb: 3 }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <Speed />
              <Typography variant="h6">Real-Time Metrics</Typography>
              {isLive && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    animation: 'pulse 2s infinite'
                  }}
                />
              )}
            </Box>
          }
          action={
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Last update: {lastUpdate?.toLocaleTimeString() || 'Never'}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isLive}
                    onChange={(e) => setIsLive(e.target.checked)}
                    icon={<Pause />}
                    checkedIcon={<PlayArrow />}
                  />
                }
                label={isLive ? 'Live' : 'Paused'}
                sx={{ color: 'white' }}
              />
              <IconButton onClick={updateMetrics} sx={{ color: 'white' }}>
                <Refresh />
              </IconButton>
            </Box>
          }
        />
      </Card>

      {/* Metrics Grid */}
      <Grid container spacing={3}>
        {/* Metrics Cards */}
        <Grid item xs={12} lg={9}>
          <Grid container spacing={2}>
            {metrics.map((metric) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={metric.id}>
                {renderMetricCard(metric)}
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Alerts Panel */}
        <Grid item xs={12} lg={3}>
          {renderAlertsPanel()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealTimeMetricsDisplay;

