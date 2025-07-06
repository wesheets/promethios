/**
 * Enhanced Veritas 2 Dashboard
 * 
 * Comprehensive real-time dashboard that integrates all Enhanced Veritas 2 capabilities:
 * - Uncertainty Analysis Visualization
 * - HITL Collaboration Monitoring
 * - Multi-Agent Orchestration Control
 * - Quantum Uncertainty Displays
 * - Performance Analytics
 * - Interactive Controls
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  useTheme
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineDot,
  TimelineSeparator,
  TimelineConnector,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Groups as GroupsIcon,
  Science as ScienceIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Import Enhanced Veritas 2 hooks and services
import { useEnhancedVeritas } from '../hooks/useEnhancedVeritas';
import { useMultiAgentOrchestration } from '../hooks/useMultiAgentOrchestration';

// Import dashboard components
import UncertaintyAnalysisDisplay from './UncertaintyAnalysisDisplay';
import HITLCollaborationMonitor from './HITLCollaborationMonitor';
import MultiAgentOrchestrationPanel from './MultiAgentOrchestrationPanel';
import QuantumUncertaintyVisualization from './QuantumUncertaintyVisualization';
import PerformanceAnalyticsPanel from './PerformanceAnalyticsPanel';
import InteractiveControlsPanel from './InteractiveControlsPanel';

interface DashboardProps {
  sessionId?: string;
  agentId?: string;
  initialTab?: number;
  onConfigurationChange?: (config: any) => void;
}

interface DashboardMetrics {
  uncertaintyReduction: number;
  hitlEffectiveness: number;
  multiAgentPerformance: number;
  quantumUtilization: number;
  overallSystemHealth: number;
  activeCollaborations: number;
  totalSessions: number;
  averageResolutionTime: number;
}

interface SystemStatus {
  uncertaintyEngine: 'healthy' | 'warning' | 'error';
  hitlSystem: 'healthy' | 'warning' | 'error';
  multiAgentOrchestration: 'healthy' | 'warning' | 'error';
  quantumIntegration: 'healthy' | 'warning' | 'error';
  bridgeServices: 'healthy' | 'warning' | 'error';
}

const EnhancedVeritasDashboard: React.FC<DashboardProps> = ({
  sessionId,
  agentId,
  initialTab = 0,
  onConfigurationChange
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced Veritas hooks
  const {
    uncertaintyAnalysis,
    enhancedVeritasConfig,
    updateConfiguration,
    getSystemMetrics,
    isLoading: veritasLoading,
    error: veritasError
  } = useEnhancedVeritas(sessionId);

  const {
    orchestrationState,
    activeCollaborations,
    performanceMetrics,
    controlOrchestration,
    isLoading: orchestrationLoading,
    error: orchestrationError
  } = useMultiAgentOrchestration(agentId);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch system metrics
      const metrics = await getSystemMetrics();
      setDashboardMetrics(metrics);

      // Fetch system status
      const status = await fetchSystemStatus();
      setSystemStatus(status);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [getSystemMetrics]);

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, autoRefresh, refreshInterval]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle configuration changes
  const handleConfigurationChange = useCallback((newConfig: any) => {
    updateConfiguration(newConfig);
    onConfigurationChange?.(newConfig);
  }, [updateConfiguration, onConfigurationChange]);

  // Fetch system status
  const fetchSystemStatus = async (): Promise<SystemStatus> => {
    // This would typically call the Enhanced Veritas Bridge Service
    return {
      uncertaintyEngine: 'healthy',
      hitlSystem: 'healthy',
      multiAgentOrchestration: 'healthy',
      quantumIntegration: 'healthy',
      bridgeServices: 'healthy'
    };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  // Render system health overview
  const renderSystemHealthOverview = () => (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title="System Health Overview"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label="Auto Refresh"
            />
            <IconButton onClick={fetchDashboardData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        {systemStatus && (
          <Grid container spacing={2}>
            {Object.entries(systemStatus).map(([component, status]) => (
              <Grid item xs={12} sm={6} md={2.4} key={component}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 1,
                    border: 1,
                    borderColor: getStatusColor(status),
                    borderRadius: 1,
                    bgcolor: `${getStatusColor(status)}10`
                  }}
                >
                  <Box sx={{ color: getStatusColor(status), mb: 1 }}>
                    {getStatusIcon(status)}
                  </Box>
                  <Typography variant="caption" align="center" sx={{ textTransform: 'capitalize' }}>
                    {component.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Chip
                    label={status}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(status),
                      color: 'white',
                      mt: 0.5
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  // Render key metrics overview
  const renderKeyMetricsOverview = () => (
    <Card sx={{ mb: 2 }}>
      <CardHeader title="Key Performance Metrics" />
      <CardContent>
        {dashboardMetrics && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {(dashboardMetrics.uncertaintyReduction * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Uncertainty Reduction
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardMetrics.uncertaintyReduction * 100}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {(dashboardMetrics.hitlEffectiveness * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  HITL Effectiveness
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardMetrics.hitlEffectiveness * 100}
                  color="secondary"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {dashboardMetrics.activeCollaborations}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Collaborations
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Chip
                    icon={<GroupsIcon />}
                    label={`${dashboardMetrics.totalSessions} Total`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {dashboardMetrics.averageResolutionTime.toFixed(1)}m
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Resolution Time
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Chip
                    icon={<SpeedIcon />}
                    label="Optimized"
                    size="small"
                    color="info"
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  // Render loading state
  if (loading && !dashboardMetrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Enhanced Veritas 2 Dashboard...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="h6">Dashboard Error</Typography>
        <Typography>{error}</Typography>
        <Button onClick={fetchDashboardData} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Dashboard Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Enhanced Veritas 2 Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Real-time monitoring and control for uncertainty analysis, HITL collaboration, 
          multi-agent orchestration, and quantum uncertainty modeling.
        </Typography>
      </Box>

      {/* System Health Overview */}
      {renderSystemHealthOverview()}

      {/* Key Metrics Overview */}
      {renderKeyMetricsOverview()}

      {/* Main Dashboard Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<AnalyticsIcon />}
            label="Uncertainty Analysis"
            iconPosition="start"
          />
          <Tab
            icon={<PsychologyIcon />}
            label="HITL Collaboration"
            iconPosition="start"
          />
          <Tab
            icon={<GroupsIcon />}
            label="Multi-Agent Orchestration"
            iconPosition="start"
          />
          <Tab
            icon={<ScienceIcon />}
            label="Quantum Uncertainty"
            iconPosition="start"
          />
          <Tab
            icon={<TrendingUpIcon />}
            label="Performance Analytics"
            iconPosition="start"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Interactive Controls"
            iconPosition="start"
          />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <UncertaintyAnalysisDisplay
              uncertaintyAnalysis={uncertaintyAnalysis}
              sessionId={sessionId}
              onConfigurationChange={handleConfigurationChange}
            />
          )}
          {activeTab === 1 && (
            <HITLCollaborationMonitor
              sessionId={sessionId}
              onConfigurationChange={handleConfigurationChange}
            />
          )}
          {activeTab === 2 && (
            <MultiAgentOrchestrationPanel
              agentId={agentId}
              orchestrationState={orchestrationState}
              activeCollaborations={activeCollaborations}
              onConfigurationChange={handleConfigurationChange}
            />
          )}
          {activeTab === 3 && (
            <QuantumUncertaintyVisualization
              uncertaintyAnalysis={uncertaintyAnalysis}
              sessionId={sessionId}
              onConfigurationChange={handleConfigurationChange}
            />
          )}
          {activeTab === 4 && (
            <PerformanceAnalyticsPanel
              metrics={dashboardMetrics}
              performanceMetrics={performanceMetrics}
              onConfigurationChange={handleConfigurationChange}
            />
          )}
          {activeTab === 5 && (
            <InteractiveControlsPanel
              configuration={enhancedVeritasConfig}
              onConfigurationChange={handleConfigurationChange}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default EnhancedVeritasDashboard;

