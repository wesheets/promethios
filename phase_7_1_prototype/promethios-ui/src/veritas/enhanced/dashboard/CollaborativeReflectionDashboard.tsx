/**
 * Collaborative Reflection Dashboard
 * 
 * Real-time visualization dashboard for Enhanced Veritas 2 multi-agent collaboration,
 * providing live insights, uncertainty tracking, and interactive performance analytics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  IconButton,
  Chip,
  Alert,
  AlertTitle,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  LinearProgress,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import {
  Dashboard,
  Timeline,
  Analytics,
  Group,
  Psychology,
  TrendingUp,
  TrendingDown,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Settings,
  Fullscreen,
  Download,
  Share,
  Notifications,
  Warning,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterPlot,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { CollaborationNetworkVisualization } from './CollaborationNetworkVisualization';
import { UncertaintyReductionTracker } from './UncertaintyReductionTracker';
import { PerformanceAnalyticsPanel } from './PerformanceAnalyticsPanel';
import { RealTimeMetricsDisplay } from './RealTimeMetricsDisplay';
import { InteractiveControlsPanel } from './InteractiveControlsPanel';
import {
  CollaborationSession,
  UncertaintyAnalysis,
  AgentInteraction,
  EmergentBehavior
} from '../types';
import { useMultiAgentOrchestration } from '../hooks/useMultiAgentOrchestration';
import { intelligentMultiAgentOrchestrator } from '../multiAgent/intelligentOrchestration';

interface CollaborativeReflectionDashboardProps {
  sessionId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  fullscreen?: boolean;
  onSessionSelect?: (sessionId: string) => void;
  onExportData?: (data: any) => void;
  className?: string;
}

interface DashboardMetrics {
  collaborationEffectiveness: number;
  uncertaintyReduction: number;
  agentParticipation: number;
  emergentBehaviors: number;
  timeToResolution: number;
  qualityScore: number;
}

interface TimeSeriesData {
  timestamp: number;
  uncertainty: number;
  collaboration: number;
  performance: number;
  emergent: number;
}

const CollaborativeReflectionDashboard: React.FC<CollaborativeReflectionDashboardProps> = ({
  sessionId,
  autoRefresh = true,
  refreshInterval = 2000,
  fullscreen = false,
  onSessionSelect,
  onExportData,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    collaborationEffectiveness: 0,
    uncertaintyReduction: 0,
    agentParticipation: 0,
    emergentBehaviors: 0,
    timeToResolution: 0,
    qualityScore: 0
  });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [activeSession, setActiveSession] = useState<CollaborationSession | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orchestrationState, orchestrationActions] = useMultiAgentOrchestration({
    autoRefresh,
    refreshInterval,
    enableRealTimeMonitoring: realTimeMode,
    enableIntelligentSuggestions: true
  });

  // Real-time data refresh effect
  useEffect(() => {
    if (sessionId && realTimeMode) {
      const interval = setInterval(() => {
        refreshDashboardData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [sessionId, realTimeMode, refreshInterval]);

  // Initialize dashboard with session data
  useEffect(() => {
    if (sessionId) {
      loadSessionData(sessionId);
    }
  }, [sessionId]);

  const loadSessionData = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get collaboration metrics
      const metrics = orchestrationActions.getCollaborationMetrics(sessionId);
      
      if (metrics) {
        updateDashboardMetrics(metrics);
        generateTimeSeriesData(metrics);
        checkForAlerts(metrics);
      }

      // Get session details
      const session = orchestrationState.activeCollaboration;
      if (session && session.id === sessionId) {
        setActiveSession(session);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, [orchestrationActions, orchestrationState.activeCollaboration]);

  const refreshDashboardData = useCallback(async () => {
    if (!sessionId) return;

    try {
      const metrics = orchestrationActions.getCollaborationMetrics(sessionId);
      
      if (metrics) {
        updateDashboardMetrics(metrics);
        appendTimeSeriesData(metrics);
        checkForAlerts(metrics);
      }
    } catch (err) {
      console.error('Failed to refresh dashboard data:', err);
    }
  }, [sessionId, orchestrationActions]);

  const updateDashboardMetrics = (metrics: any) => {
    setDashboardMetrics({
      collaborationEffectiveness: metrics.collaborationEffectiveness || 0,
      uncertaintyReduction: metrics.uncertaintyReduction || 0,
      agentParticipation: metrics.participantCount / Math.max(metrics.participantCount, 1),
      emergentBehaviors: metrics.emergentBehaviorCount || 0,
      timeToResolution: metrics.duration / 1000 / 60, // Convert to minutes
      qualityScore: calculateQualityScore(metrics)
    });
  };

  const generateTimeSeriesData = (metrics: any) => {
    const now = Date.now();
    const data: TimeSeriesData[] = [];

    // Generate sample time series data (in real implementation, this would come from stored metrics)
    for (let i = 0; i < 20; i++) {
      data.push({
        timestamp: now - (19 - i) * 60000, // 1 minute intervals
        uncertainty: Math.max(0, 1 - (i * 0.05) + (Math.random() - 0.5) * 0.1),
        collaboration: Math.min(1, i * 0.05 + (Math.random() - 0.5) * 0.1),
        performance: Math.min(1, i * 0.04 + (Math.random() - 0.5) * 0.08),
        emergent: Math.random() * 0.3
      });
    }

    setTimeSeriesData(data);
  };

  const appendTimeSeriesData = (metrics: any) => {
    const newDataPoint: TimeSeriesData = {
      timestamp: Date.now(),
      uncertainty: 1 - (metrics.uncertaintyReduction || 0),
      collaboration: metrics.collaborationEffectiveness || 0,
      performance: calculateQualityScore(metrics),
      emergent: (metrics.emergentBehaviorCount || 0) / 10 // Normalize
    };

    setTimeSeriesData(prev => {
      const updated = [...prev, newDataPoint];
      // Keep only last 50 data points
      return updated.slice(-50);
    });
  };

  const calculateQualityScore = (metrics: any): number => {
    const effectiveness = metrics.collaborationEffectiveness || 0;
    const reduction = metrics.uncertaintyReduction || 0;
    const participation = metrics.participantCount > 0 ? 1 : 0;
    
    return (effectiveness * 0.4 + reduction * 0.4 + participation * 0.2);
  };

  const checkForAlerts = (metrics: any) => {
    const newAlerts: DashboardAlert[] = [];

    // Check for low collaboration effectiveness
    if (metrics.collaborationEffectiveness < 0.3) {
      newAlerts.push({
        id: 'low_collaboration',
        type: 'warning',
        title: 'Low Collaboration Effectiveness',
        message: 'Collaboration effectiveness is below optimal threshold',
        timestamp: new Date(),
        actionable: true
      });
    }

    // Check for stalled uncertainty reduction
    if (metrics.uncertaintyReduction < 0.1 && metrics.duration > 300000) { // 5 minutes
      newAlerts.push({
        id: 'stalled_reduction',
        type: 'error',
        title: 'Stalled Uncertainty Reduction',
        message: 'Uncertainty reduction has stalled. Consider intervention.',
        timestamp: new Date(),
        actionable: true
      });
    }

    // Check for emergent behaviors
    if (metrics.emergentBehaviorCount > 3) {
      newAlerts.push({
        id: 'emergent_behaviors',
        type: 'info',
        title: 'Emergent Behaviors Detected',
        message: `${metrics.emergentBehaviorCount} emergent behaviors detected`,
        timestamp: new Date(),
        actionable: false
      });
    }

    setAlerts(newAlerts);
  };

  const handleExportData = () => {
    const exportData = {
      sessionId,
      metrics: dashboardMetrics,
      timeSeriesData,
      alerts,
      timestamp: new Date().toISOString()
    };

    if (onExportData) {
      onExportData(exportData);
    } else {
      // Default export as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `collaboration-dashboard-${sessionId}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Metrics Cards */}
      <Grid item xs={12} md={6} lg={3}>
        <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="primary.main">
                  {(dashboardMetrics.collaborationEffectiveness * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  Collaboration Effectiveness
                </Typography>
              </Box>
              <Group sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
            <Box mt={1}>
              <LinearProgress
                variant="determinate"
                value={dashboardMetrics.collaborationEffectiveness * 100}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  '& .MuiLinearProgress-bar': { backgroundColor: 'primary.main' }
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="success.main">
                  {(dashboardMetrics.uncertaintyReduction * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  Uncertainty Reduction
                </Typography>
              </Box>
              <Psychology sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
            <Box mt={1}>
              <LinearProgress
                variant="determinate"
                value={dashboardMetrics.uncertaintyReduction * 100}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  '& .MuiLinearProgress-bar': { backgroundColor: 'success.main' }
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="info.main">
                  {dashboardMetrics.emergentBehaviors}
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  Emergent Behaviors
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, color: 'info.main' }} />
            </Box>
            <Box mt={1}>
              <Chip
                label={dashboardMetrics.emergentBehaviors > 0 ? 'Active' : 'None'}
                color={dashboardMetrics.emergentBehaviors > 0 ? 'info' : 'default'}
                size="small"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="warning.main">
                  {dashboardMetrics.timeToResolution.toFixed(1)}m
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  Session Duration
                </Typography>
              </Box>
              <Timeline sx={{ fontSize: 40, color: 'warning.main' }} />
            </Box>
            <Box mt={1}>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Quality Score: {(dashboardMetrics.qualityScore * 100).toFixed(0)}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Time Series Chart */}
      <Grid item xs={12} lg={8}>
        <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: 400 }}>
          <CardHeader
            title="Real-Time Collaboration Metrics"
            action={
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant={selectedTimeRange === '1h' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedTimeRange('1h')}
                >
                  1H
                </Button>
                <Button
                  size="small"
                  variant={selectedTimeRange === '6h' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedTimeRange('6h')}
                >
                  6H
                </Button>
                <Button
                  size="small"
                  variant={selectedTimeRange === '24h' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedTimeRange('24h')}
                >
                  24H
                </Button>
              </Box>
            }
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  stroke="#a0aec0"
                />
                <YAxis stroke="#a0aec0" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#4a5568',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="uncertainty"
                  stroke="#f56565"
                  strokeWidth={2}
                  name="Uncertainty"
                />
                <Line
                  type="monotone"
                  dataKey="collaboration"
                  stroke="#4299e1"
                  strokeWidth={2}
                  name="Collaboration"
                />
                <Line
                  type="monotone"
                  dataKey="performance"
                  stroke="#48bb78"
                  strokeWidth={2}
                  name="Performance"
                />
                <Line
                  type="monotone"
                  dataKey="emergent"
                  stroke="#ed8936"
                  strokeWidth={2}
                  name="Emergent"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Alerts Panel */}
      <Grid item xs={12} lg={4}>
        <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: 400 }}>
          <CardHeader
            title={
              <Box display="flex" alignItems="center" gap={2}>
                <Notifications />
                <Typography variant="h6">Alerts</Typography>
                <Badge badgeContent={alerts.length} color="error">
                  <Box />
                </Badge>
              </Box>
            }
            action={
              <FormControlLabel
                control={
                  <Switch
                    checked={showAlerts}
                    onChange={(e) => setShowAlerts(e.target.checked)}
                    size="small"
                  />
                }
                label="Enable"
                sx={{ color: 'white' }}
              />
            }
          />
          <CardContent sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {alerts.length === 0 ? (
              <Box textAlign="center" py={4}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  No alerts - collaboration running smoothly
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {alerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    severity={alert.type}
                    sx={{
                      backgroundColor: alert.type === 'error' ? '#742a2a' :
                                     alert.type === 'warning' ? '#744210' :
                                     '#2a4365',
                      color: 'white'
                    }}
                    action={
                      alert.actionable && (
                        <Button size="small" color="inherit">
                          Action
                        </Button>
                      )
                    }
                  >
                    <AlertTitle>{alert.title}</AlertTitle>
                    {alert.message}
                  </Alert>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderNetworkTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <CollaborationNetworkVisualization
          sessionId={sessionId}
          agents={orchestrationState.agents}
          realTime={realTimeMode}
        />
      </Grid>
    </Grid>
  );

  const renderAnalyticsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <UncertaintyReductionTracker
          sessionId={sessionId}
          timeSeriesData={timeSeriesData}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <PerformanceAnalyticsPanel
          metrics={dashboardMetrics}
          agents={orchestrationState.agents}
        />
      </Grid>
    </Grid>
  );

  const renderControlsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <InteractiveControlsPanel
          sessionId={sessionId}
          onParameterChange={(parameter, value) => {
            console.log('Parameter changed:', parameter, value);
          }}
          onActionTrigger={(action) => {
            console.log('Action triggered:', action);
          }}
        />
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box className={`collaborative-reflection-dashboard ${className}`}>
      {/* Dashboard Header */}
      <Card sx={{ mb: 3, backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <Dashboard />
              <Typography variant="h5">Collaborative Reflection Dashboard</Typography>
              {sessionId && (
                <Chip
                  label={`Session: ${sessionId.slice(-8)}`}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          }
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={realTimeMode}
                    onChange={(e) => setRealTimeMode(e.target.checked)}
                    color="primary"
                  />
                }
                label="Real-time"
                sx={{ color: 'white' }}
              />
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={refreshDashboardData}
                  disabled={loading}
                  sx={{ color: 'white' }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export data">
                <IconButton
                  onClick={handleExportData}
                  sx={{ color: 'white' }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Fullscreen">
                <IconButton sx={{ color: 'white' }}>
                  <Fullscreen />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Dashboard Tabs */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': { color: 'white' },
              '& .Mui-selected': { color: '#3182ce !important' }
            }}
          >
            <Tab label="Overview" icon={<Dashboard />} />
            <Tab label="Network" icon={<Group />} />
            <Tab label="Analytics" icon={<Analytics />} />
            <Tab label="Controls" icon={<Settings />} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {activeTab === 0 && renderOverviewTab()}
          {activeTab === 1 && renderNetworkTab()}
          {activeTab === 2 && renderAnalyticsTab()}
          {activeTab === 3 && renderControlsTab()}
        </CardContent>
      </Card>

      {/* Real-time Status Indicator */}
      {realTimeMode && (
        <Box
          position="fixed"
          bottom={20}
          right={20}
          sx={{
            backgroundColor: 'success.main',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'white',
              animation: 'pulse 2s infinite'
            }}
          />
          <Typography variant="caption">Live</Typography>
        </Box>
      )}
    </Box>
  );
};

// Supporting interfaces
interface DashboardAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  actionable: boolean;
}

export default CollaborativeReflectionDashboard;

