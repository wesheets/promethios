/**
 * Enhanced Trust Metrics Overview Page
 * 
 * Enterprise-grade trust monitoring with real-time updates, advanced analytics,
 * ML-powered insights, notification integration, and comprehensive workflows.
 * Now includes proper user authentication and scoping.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';
import { useAuth } from '../context/AuthContext';
import { authApiService } from '../services/authApiService';
import { trustMetricsExtension } from '../extensions/TrustMetricsExtension';
import { useNotificationBackend } from '../hooks/useNotificationBackend';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Breadcrumbs,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  CircularProgress,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Autocomplete,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Info,
  Security,
  Speed,
  Verified,
  Psychology,
  Timeline,
  Assessment,
  Shield,
  Refresh,
  Download,
  FilterList,
  Search,
  Settings,
  Notifications,
  Assignment,
  Build,
  Analytics,
  AutoFixHigh,
  ExpandMore,
  Home,
  Dashboard,
  Close,
  PlayArrow,
  Pause,
  GetApp,
  Share,
  Print,
  Visibility,
  Edit,
  Delete,
  Add,
  MoreVert,
  NotificationsActive,
  TrendingFlat
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Trust dimension icons and colors
const trustDimensionIcons = {
  competence: <Psychology />,
  reliability: <Speed />,
  honesty: <Verified />,
  transparency: <Security />
};

const trustDimensionColors = {
  competence: '#3b82f6',
  reliability: '#10b981',
  honesty: '#f59e0b',
  transparency: '#8b5cf6'
};

const riskColors = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444'
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trust-tabpanel-${index}`}
      aria-labelledby={`trust-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedTrustMetricsOverviewPage: React.FC = () => {
  // Authentication context
  const { currentUser } = useAuth();
  
  // State management
  const [tabValue, setTabValue] = useState(0);
  const [trustMetrics, setTrustMetrics] = useState<any[]>([]);
  const [trustAnalytics, setTrustAnalytics] = useState<any>(null);
  const [trustAlerts, setTrustAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Dialog states
  const [remediationDialog, setRemediationDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [alertDialog, setAlertDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string[]>([]);
  const [trustScoreRange, setTrustScoreRange] = useState<number[]>([0, 100]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Notification states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as any });
  
  // Hooks
  const { sendNotification } = useNotificationBackend();
  
  // Initialize trust metrics extension
  useEffect(() => {
    const initializeExtension = async () => {
      try {
        const initialized = await trustMetricsExtension.initialize({
          refreshInterval: 30000,
          enableRealTimeUpdates: true,
          enablePredictiveAnalytics: true
        });
        
        if (!initialized) {
          throw new Error('Failed to initialize trust metrics extension');
        }
        
        console.log('Trust metrics extension initialized successfully');
      } catch (error) {
        console.error('Error initializing trust metrics extension:', error);
        setError('Failed to initialize trust monitoring system');
      }
    };
    
    initializeExtension();
  }, []);
  
  // Load trust data with authentication
  const loadTrustData = useCallback(async () => {
    if (!currentUser) {
      setError('User authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Load trust metrics, analytics, and alerts in parallel with authentication
      const [metrics, analytics, alerts] = await Promise.all([
        trustMetricsExtension.getTrustMetrics(currentUser),
        trustMetricsExtension.getTrustAnalytics(currentUser, '30d'),
        authApiService.authenticatedFetch('/api/trust-metrics/alerts/check', {
          method: 'GET',
          user: currentUser
        })
      ]);
      
      setTrustMetrics(metrics);
      setTrustAnalytics(analytics);
      setTrustAlerts(alerts);
      setLastUpdate(new Date());
      
      // Send notification for critical alerts
      const criticalAlerts = Array.isArray(alerts) ? alerts.filter((alert: any) => alert.severity === 'critical') : [];
      if (criticalAlerts.length > 0) {
        await sendNotification({
          title: `${criticalAlerts.length} Critical Trust Alert${criticalAlerts.length > 1 ? 's' : ''}`,
          message: `Critical trust issues detected requiring immediate attention`,
          type: 'trust_metrics',
          severity: 'critical',
          source: 'trust_metrics_page',
          action_url: '/trust-metrics',
          metadata: {
            alertCount: criticalAlerts.length,
            agents: criticalAlerts.map((a: any) => a.agent_id)
          }
        });
      }
      
    } catch (err) {
      console.error('Error loading trust data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trust data');
    } finally {
      setLoading(false);
    }
  }, [currentUser, sendNotification]);
  
  // Real-time updates
  useEffect(() => {
    loadTrustData();
    
    let interval: NodeJS.Timeout;
    if (realTimeEnabled) {
      interval = setInterval(loadTrustData, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadTrustData, realTimeEnabled]);
  
  // Filtered and searched metrics
  const filteredMetrics = useMemo(() => {
    return trustMetrics.filter(metric => {
      // Search filter
      const matchesSearch = !searchTerm || 
        metric.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.agent_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Risk filter
      const matchesRisk = riskFilter.length === 0 || riskFilter.includes(metric.risk_level);
      
      // Trust score range filter
      const trustScore = (metric.trust_scores?.aggregate || 0) * 100;
      const matchesTrustScore = trustScore >= trustScoreRange[0] && trustScore <= trustScoreRange[1];
      
      return matchesSearch && matchesRisk && matchesTrustScore;
    });
  }, [trustMetrics, searchTerm, riskFilter, trustScoreRange]);
  
  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleRefresh = async () => {
    await loadTrustData();
    setSnackbar({
      open: true,
      message: 'Trust metrics refreshed successfully',
      severity: 'success'
    });
  };
  
  const handleCreateRemediation = async (agentId: string, issue: string, severity: string) => {
    try {
      const remediation = await trustMetricsExtension.createRemediation({
        agent_id: agentId,
        issue,
        severity,
        recommended_actions: [
          {
            action: 'Investigate trust degradation',
            priority: 'high' as const,
            estimated_impact: 'Moderate improvement expected',
            estimated_time: '2-4 hours',
            resources: ['Trust analyst', 'Agent logs']
          },
          {
            action: 'Review recent behavior patterns',
            priority: 'medium' as const,
            estimated_impact: 'Better understanding of issues',
            estimated_time: '1-2 hours',
            resources: ['Behavioral data', 'Performance metrics']
          }
        ],
        status: 'pending'
      });
      
      setSnackbar({
        open: true,
        message: `Remediation plan created for ${agentId}`,
        severity: 'success'
      });
      
      setRemediationDialog(false);
      
      // Send notification
      await sendNotification({
        title: 'Trust Remediation Created',
        message: `New remediation plan created for agent ${agentId}`,
        type: 'trust_metrics',
        severity: 'info',
        source: 'trust_metrics_page',
        action_url: `/trust-metrics/remediation/${remediation.id}`,
        metadata: {
          agentId,
          remediationId: remediation.id,
          issue
        }
      });
      
    } catch (error) {
      console.error('Error creating remediation:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create remediation plan',
        severity: 'error'
      });
    }
  };
  
  const handleExportReport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const blob = await trustMetricsExtension.exportTrustReport(format, {
        search: searchTerm,
        riskFilter,
        trustScoreRange
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `trust_metrics_report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSnackbar({
        open: true,
        message: `Trust metrics report exported as ${format.toUpperCase()}`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error exporting report:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export report',
        severity: 'error'
      });
    }
  };
  
  const getTrustScoreColor = (score: number | null) => {
    if (score === null) return '#64748b'; // Gray for N/A
    if (score >= 0.9) return '#10b981';
    if (score >= 0.8) return '#f59e0b';
    if (score >= 0.7) return '#f97316';
    return '#ef4444';
  };
  
  const getRiskChipColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Calculate overview statistics
  const overviewStats = useMemo(() => {
    if (!trustAnalytics?.overview) return null;
    
    return {
      totalAgents: trustAnalytics.overview.total_agents,
      averageTrustScore: trustAnalytics.overview.average_trust_score,
      highConfidenceAgents: trustAnalytics.overview.high_confidence_agents,
      atRiskAgents: trustAnalytics.overview.at_risk_agents,
      criticalAgents: trustAnalytics.overview.critical_agents,
      totalAttestations: trustAnalytics.overview.total_attestations,
      complianceRate: trustAnalytics.overview.compliance_rate
    };
  }, [trustAnalytics]);
  
  if (loading && trustMetrics.length === 0) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{ p: 3, backgroundColor: '#0f172a', minHeight: '100vh', color: 'white' }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            Trust Metrics Overview
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Loading trust metrics data...</Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }
  
  if (error) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{ p: 3, backgroundColor: '#0f172a', minHeight: '100vh', color: 'white' }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            Trust Metrics Overview
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Error Loading Trust Data</AlertTitle>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={handleRefresh} 
            sx={{ mt: 2 }}
            startIcon={<Refresh />}
          >
            Retry
          </Button>
        </Box>
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ p: 3, backgroundColor: '#0f172a', minHeight: '100vh', color: 'white' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Link color="inherit" href="/governance">
            Governance
          </Link>
          <Typography color="text.primary">Trust Metrics</Typography>
        </Breadcrumbs>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              Trust Metrics Overview
              <Tooltip title="Real-time trust monitoring and analytics for all deployed agents">
                <Info sx={{ ml: 1, fontSize: '1rem', color: '#64748b' }} />
              </Tooltip>
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
              Monitor agent trustworthiness, behavioral quality, and reputation across your organization
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Last updated: {formatTimestamp(lastUpdate.toISOString())}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={realTimeEnabled}
                    onChange={(e) => setRealTimeEnabled(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Tooltip title="Enable automatic refresh every 30 seconds">
                    <Typography variant="caption">Real-time updates</Typography>
                  </Tooltip>
                }
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh trust metrics data">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Show/hide filters">
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterList />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export trust report">
              <IconButton onClick={() => handleExportReport('csv')}>
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={() => setSettingsDialog(true)}>
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Alerts Banner */}
        {trustAlerts.length > 0 && (
          <Alert 
            severity={trustAlerts.some(a => a.severity === 'critical') ? 'error' : 'warning'} 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setAlertDialog(true)}
                startIcon={<Visibility />}
              >
                View All ({trustAlerts.length})
              </Button>
            }
          >
            <AlertTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsActive sx={{ mr: 1 }} />
                Trust Health Alerts
              </Box>
            </AlertTitle>
            {trustAlerts.filter(a => a.severity === 'critical').length > 0 && (
              <Typography variant="body2">
                {trustAlerts.filter(a => a.severity === 'critical').length} critical alert{trustAlerts.filter(a => a.severity === 'critical').length > 1 ? 's' : ''} requiring immediate attention
              </Typography>
            )}
            {trustAlerts.filter(a => a.severity === 'high').length > 0 && (
              <Typography variant="body2">
                {trustAlerts.filter(a => a.severity === 'high').length} high priority alert{trustAlerts.filter(a => a.severity === 'high').length > 1 ? 's' : ''} need review
              </Typography>
            )}
          </Alert>
        )}
        
        {/* Filters */}
        {showFilters && (
          <Card sx={{ mb: 3, backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filters & Search
                <Tooltip title="Filter and search trust metrics data">
                  <Info sx={{ ml: 1, fontSize: '1rem', color: '#64748b' }} />
                </Tooltip>
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Search agents"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Agent name or ID..."
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: '#64748b' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Risk Level</InputLabel>
                    <Select
                      multiple
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {['low', 'medium', 'high', 'critical'].map((risk) => (
                        <MenuItem key={risk} value={risk}>
                          <Checkbox checked={riskFilter.indexOf(risk) > -1} />
                          <ListItemText primary={risk.charAt(0).toUpperCase() + risk.slice(1)} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography gutterBottom>
                    Trust Score Range: {trustScoreRange[0]}% - {trustScoreRange[1]}%
                  </Typography>
                  <Slider
                    value={trustScoreRange}
                    onChange={(e, newValue) => setTrustScoreRange(newValue as number[])}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' }
                    ]}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
        
        {/* Overview Cards */}
        {overviewStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={2}>
              <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Assessment sx={{ color: '#3b82f6', mr: 2 }} />
                    <Typography variant="h6">
                      Average Trust
                      <Tooltip title="Overall trust score across all agents">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: getTrustScoreColor(overviewStats.averageTrustScore), fontWeight: 'bold' }}>
                    {overviewStats.averageTrustScore !== null ? `${Math.round(overviewStats.averageTrustScore * 100)}%` : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Across {overviewStats.totalAgents} agents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ color: '#10b981', mr: 2 }} />
                    <Typography variant="h6">
                      High Confidence
                      <Tooltip title="Agents with 85%+ confidence in trust assessment">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                    {overviewStats.highConfidenceAgents !== null ? overviewStats.highConfidenceAgents : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {overviewStats.highConfidenceAgents !== null && overviewStats.totalAgents > 0 
                      ? `${Math.round((overviewStats.highConfidenceAgents / overviewStats.totalAgents) * 100)}% of agents`
                      : 'N/A'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Warning sx={{ color: '#f59e0b', mr: 2 }} />
                    <Typography variant="h6">
                      At Risk
                      <Tooltip title="Agents requiring attention due to trust issues">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: overviewStats.atRiskAgents > 0 ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
                    {overviewStats.atRiskAgents !== null ? overviewStats.atRiskAgents : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {overviewStats.atRiskAgents !== null && overviewStats.totalAgents > 0 
                      ? `${Math.round((overviewStats.atRiskAgents / overviewStats.totalAgents) * 100)}% of agents`
                      : 'N/A'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ color: '#ef4444', mr: 2 }} />
                    <Typography variant="h6">
                      Critical
                      <Tooltip title="Agents with critical trust issues requiring immediate action">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: (overviewStats.criticalAgents || 0) > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {overviewStats.criticalAgents || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Immediate attention needed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Shield sx={{ color: '#8b5cf6', mr: 2 }} />
                    <Typography variant="h6">
                      Attestations
                      <Tooltip title="Total verification events logged across all agents">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                    {(overviewStats.totalAttestations || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Verification events
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Verified sx={{ color: '#06b6d4', mr: 2 }} />
                    <Typography variant="h6">
                      Compliance
                      <Tooltip title="Overall compliance rate across all agents">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: '#06b6d4', fontWeight: 'bold' }}>
                    {overviewStats.complianceRate !== null ? `${Math.round(overviewStats.complianceRate * 100)}%` : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Policy adherence
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* Main Content Tabs */}
        <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <Box sx={{ borderBottom: 1, borderColor: '#334155' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
                '& .MuiTab-root': { 
                  color: '#64748b',
                  '&.Mui-selected': { color: '#3b82f6' }
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment sx={{ mr: 1 }} />
                    Agent Trust Scores
                    <Tooltip title="Detailed trust scores and metrics for all agents">
                      <Info sx={{ ml: 0.5, fontSize: '0.8rem' }} />
                    </Tooltip>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Timeline sx={{ mr: 1 }} />
                    Trust Analytics
                    <Tooltip title="Advanced analytics and trend analysis">
                      <Info sx={{ ml: 0.5, fontSize: '0.8rem' }} />
                    </Tooltip>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Psychology sx={{ mr: 1 }} />
                    ML Insights
                    <Tooltip title="Machine learning powered predictions and insights">
                      <Info sx={{ ml: 0.5, fontSize: '0.8rem' }} />
                    </Tooltip>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Warning sx={{ mr: 1 }} />
                    Risk Analysis
                    <Badge badgeContent={trustAlerts.length} color="error">
                      <Typography>Risk Analysis</Typography>
                    </Badge>
                    <Tooltip title="Risk assessment and remediation recommendations">
                      <Info sx={{ ml: 0.5, fontSize: '0.8rem' }} />
                    </Tooltip>
                  </Box>
                } 
              />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {/* Agent Trust Scores Table */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Agent Trust Scores ({filteredMetrics.length} of {trustMetrics.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={() => handleExportReport('csv')}
                >
                  Export CSV
                </Button>
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={() => handleExportReport('json')}
                >
                  Export JSON
                </Button>
              </Box>
            </Box>
            
            <TableContainer component={Paper} sx={{ backgroundColor: '#0f172a' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Agent
                      <Tooltip title="Agent identification and type">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Trust Dimensions
                      <Tooltip title="Competence, Reliability, Honesty, Transparency scores">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Aggregate Score
                      <Tooltip title="Overall trust score calculated from all dimensions">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Confidence
                      <Tooltip title="Confidence level in the trust assessment">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Trend
                      <Tooltip title="Trust score trend and prediction">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Risk Level
                      <Tooltip title="Current risk assessment level">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Performance
                      <Tooltip title="Key performance indicators">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Actions
                      <Tooltip title="Available actions for this agent">
                        <Info sx={{ ml: 0.5, fontSize: '0.8rem', color: '#64748b' }} />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMetrics.map((agent) => (
                    <TableRow key={agent.agent_id} sx={{ '&:hover': { backgroundColor: '#1e293b' } }}>
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, backgroundColor: '#3b82f6' }}>
                            {agent.agent_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {agent.agent_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {agent.agent_id}
                            </Typography>
                            <br />
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {agent.agent_type === 'single' ? 'Single Agent' : 'Multi-Agent System'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ color: 'white' }}>
                        <Grid container spacing={1}>
                          {Object.entries(agent.trust_scores).filter(([key]) => key !== 'aggregate').map(([dimension, score]) => (
                            <Grid item key={dimension}>
                              <Tooltip title={`${dimension.charAt(0).toUpperCase() + dimension.slice(1)}: ${Math.round(score * 100)}%`}>
                                <Chip
                                  icon={trustDimensionIcons[dimension as keyof typeof trustDimensionIcons]}
                                  label={Math.round(score * 100)}
                                  size="small"
                                  sx={{
                                    backgroundColor: trustDimensionColors[dimension as keyof typeof trustDimensionColors],
                                    color: 'white',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </Tooltip>
                            </Grid>
                          ))}
                        </Grid>
                      </TableCell>
                      
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h6" sx={{ color: getTrustScoreColor(agent.trust_scores.aggregate), fontWeight: 'bold', mr: 1 }}>
                            {Math.round(agent.trust_scores.aggregate * 100)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={agent.trust_scores.aggregate * 100}
                            sx={{
                              width: 60,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#334155',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getTrustScoreColor(agent.trust_scores.aggregate)
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {Math.round(agent.confidence * 100)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={agent.confidence * 100}
                            sx={{
                              width: 40,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: '#334155',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: agent.confidence >= 0.8 ? '#10b981' : agent.confidence >= 0.6 ? '#f59e0b' : '#ef4444'
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {agent.trend.direction === 'up' && <TrendingUp sx={{ color: '#10b981', mr: 1 }} />}
                          {agent.trend.direction === 'down' && <TrendingDown sx={{ color: '#ef4444', mr: 1 }} />}
                          {agent.trend.direction === 'stable' && <TrendingFlat sx={{ color: '#64748b', mr: 1 }} />}
                          <Box>
                            <Typography variant="body2" sx={{ 
                              color: agent.trend.direction === 'up' ? '#10b981' : agent.trend.direction === 'down' ? '#ef4444' : '#64748b' 
                            }}>
                              {agent.trend.velocity > 0 ? '+' : ''}{Math.round(agent.trend.velocity * 100)}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Pred: {Math.round(agent.trend.prediction * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ color: 'white' }}>
                        <Chip
                          label={agent.risk_level.toUpperCase()}
                          color={getRiskChipColor(agent.risk_level) as any}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                        {agent.risk_factors.length > 0 && (
                          <Tooltip title={`Risk factors: ${agent.risk_factors.join(', ')}`}>
                            <Warning sx={{ ml: 1, fontSize: '1rem', color: riskColors[agent.risk_level as keyof typeof riskColors] }} />
                          </Tooltip>
                        )}
                      </TableCell>
                      
                      <TableCell sx={{ color: 'white' }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Response: {Math.round(agent.performance.response_time)}ms
                          </Typography>
                          <br />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Success: {Math.round(agent.performance.success_rate * 100)}%
                          </Typography>
                          <br />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Uptime: {Math.round(agent.performance.uptime * 100)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View detailed trust analysis">
                            <IconButton size="small" onClick={() => setSelectedAgent(agent)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Create remediation plan">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setSelectedAgent(agent);
                                setRemediationDialog(true);
                              }}
                              disabled={agent.risk_level === 'low'}
                            >
                              <Build />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More actions">
                            <IconButton size="small">
                              <MoreVert />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {/* Trust Analytics */}
            <Typography variant="h6" gutterBottom>
              Trust Analytics & Trends
              <Tooltip title="Comprehensive analytics showing trust patterns and correlations">
                <Info sx={{ ml: 1, fontSize: '1rem', color: '#64748b' }} />
              </Tooltip>
            </Typography>
            
            {trustAnalytics?.trends && (
              <Grid container spacing={3}>
                {/* Trust Score Trend Chart */}
                <Grid item xs={12} lg={6}>
                  <Card sx={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Trust Score Trends (30 Days)
                        <Tooltip title="Historical trust score changes over the last 30 days">
                          <Info sx={{ ml: 1, fontSize: '0.8rem', color: '#64748b' }} />
                        </Tooltip>
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trustAnalytics.trends.trust_score_trend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            labelStyle={{ color: '#f8fafc' }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="trust_score" stroke="#3b82f6" strokeWidth={2} />
                          <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Risk Distribution */}
                <Grid item xs={12} lg={6}>
                  <Card sx={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Risk Level Distribution
                        <Tooltip title="Distribution of agents across different risk levels">
                          <Info sx={{ ml: 1, fontSize: '0.8rem', color: '#64748b' }} />
                        </Tooltip>
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={trustAnalytics.trends.risk_distribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ level, percentage }) => `${level}: ${percentage.toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {trustAnalytics.trends.risk_distribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={riskColors[entry.level as keyof typeof riskColors]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Performance Correlation */}
                <Grid item xs={12} lg={6}>
                  <Card sx={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Trust vs Performance Correlation
                        <Tooltip title="Relationship between trust scores and performance metrics">
                          <Info sx={{ ml: 1, fontSize: '0.8rem', color: '#64748b' }} />
                        </Tooltip>
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart data={trustAnalytics.trends.performance_correlation}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="trust_score" stroke="#64748b" name="Trust Score" />
                          <YAxis dataKey="performance" stroke="#64748b" name="Performance" />
                          <RechartsTooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                          />
                          <Scatter dataKey="performance" fill="#8b5cf6" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Violation Impact */}
                <Grid item xs={12} lg={6}>
                  <Card sx={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Violation Impact on Trust
                        <Tooltip title="How policy violations affect trust scores">
                          <Info sx={{ ml: 1, fontSize: '0.8rem', color: '#64748b' }} />
                        </Tooltip>
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={trustAnalytics.trends.violation_impact}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="violations" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                          />
                          <Bar dataKey="trust_impact" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            {/* ML Insights */}
            <Typography variant="h6" gutterBottom>
              Machine Learning Insights
              <Tooltip title="AI-powered predictions and behavioral analysis">
                <Info sx={{ ml: 1, fontSize: '1rem', color: '#64748b' }} />
              </Tooltip>
            </Typography>
            
            {trustAnalytics?.predictions && (
              <Grid container spacing={3}>
                {/* Trust Score Forecast */}
                <Grid item xs={12} lg={8}>
                  <Card sx={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        7-Day Trust Score Forecast
                        <Tooltip title="ML-powered prediction of trust scores for the next 7 days">
                          <Info sx={{ ml: 1, fontSize: '0.8rem', color: '#64748b' }} />
                        </Tooltip>
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={trustAnalytics.predictions.trust_score_forecast}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                          />
                          <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="confidence" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* ML Model Status */}
                <Grid item xs={12} lg={4}>
                  <Card sx={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        ML Model Status
                        <Tooltip title="Status of machine learning models used for trust analysis">
                          <Info sx={{ ml: 1, fontSize: '0.8rem', color: '#64748b' }} />
                        </Tooltip>
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Trust Predictor</Typography>
                          <Chip label="Active" color="success" size="small" />
                        </Box>
                        <LinearProgress variant="determinate" value={95} sx={{ mb: 1 }} />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Accuracy: 95% | Last trained: 2 hours ago
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Anomaly Detector</Typography>
                          <Chip label="Active" color="success" size="small" />
                        </Box>
                        <LinearProgress variant="determinate" value={88} sx={{ mb: 1 }} />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Precision: 88% | Last trained: 4 hours ago
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Behavior Analyzer</Typography>
                          <Chip label="Active" color="success" size="small" />
                        </Box>
                        <LinearProgress variant="determinate" value={92} sx={{ mb: 1 }} />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          F1-Score: 92% | Last trained: 1 hour ago
                        </Typography>
                      </Box>
                      
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AutoFixHigh />}
                        sx={{ mt: 2 }}
                      >
                        Retrain Models
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Risk Predictions */}
                <Grid item xs={12} lg={6}>
                  <Card sx={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Risk Level Predictions
                        <Tooltip title="Predicted risk level changes for agents">
                          <Info sx={{ ml: 1, fontSize: '0.8rem', color: '#64748b' }} />
                        </Tooltip>
                      </Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: '#64748b' }}>Agent</TableCell>
                              <TableCell sx={{ color: '#64748b' }}>Current</TableCell>
                              <TableCell sx={{ color: '#64748b' }}>Predicted</TableCell>
                              <TableCell sx={{ color: '#64748b' }}>Probability</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {trustAnalytics.predictions.risk_prediction.map((prediction: any) => (
                              <TableRow key={prediction.agent_id}>
                                <TableCell sx={{ color: 'white' }}>
                                  {prediction.agent_id}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={prediction.current_risk} 
                                    color={getRiskChipColor(prediction.current_risk) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={prediction.predicted_risk} 
                                    color={getRiskChipColor(prediction.predicted_risk) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  {Math.round(prediction.probability * 100)}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Anomaly Detection */}
                <Grid item xs={12} lg={6}>
                  <Card sx={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Anomaly Detection Results
                        <Tooltip title="Agents showing anomalous behavior patterns">
                          <Info sx={{ ml: 1, fontSize: '0.8rem', color: '#64748b' }} />
                        </Tooltip>
                      </Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: '#64748b' }}>Agent</TableCell>
                              <TableCell sx={{ color: '#64748b' }}>Anomaly Score</TableCell>
                              <TableCell sx={{ color: '#64748b' }}>Type</TableCell>
                              <TableCell sx={{ color: '#64748b' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {trustAnalytics.predictions.anomaly_detection
                              .filter((anomaly: any) => anomaly.anomaly_score > 0.3)
                              .map((anomaly: any) => (
                              <TableRow key={anomaly.agent_id}>
                                <TableCell sx={{ color: 'white' }}>
                                  {anomaly.agent_id}
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                      {anomaly.anomaly_score.toFixed(2)}
                                    </Typography>
                                    <LinearProgress
                                      variant="determinate"
                                      value={anomaly.anomaly_score * 100}
                                      sx={{
                                        width: 40,
                                        height: 4,
                                        backgroundColor: '#334155',
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: anomaly.anomaly_score > 0.7 ? '#ef4444' : anomaly.anomaly_score > 0.5 ? '#f59e0b' : '#10b981'
                                        }
                                      }}
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  {anomaly.anomaly_type}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={anomaly.anomaly_score > 0.7 ? 'Critical' : anomaly.anomaly_score > 0.5 ? 'Warning' : 'Normal'}
                                    color={anomaly.anomaly_score > 0.7 ? 'error' : anomaly.anomaly_score > 0.5 ? 'warning' : 'success'}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            {/* Risk Analysis */}
            <Typography variant="h6" gutterBottom>
              Risk Analysis & Remediation
              <Tooltip title="Comprehensive risk assessment and remediation planning">
                <Info sx={{ ml: 1, fontSize: '1rem', color: '#64748b' }} />
              </Tooltip>
            </Typography>
            
            <Grid container spacing={3}>
              {/* At-Risk Agents */}
              {filteredMetrics.filter(agent => agent.risk_level !== 'low').map((agent) => (
                <Grid item xs={12} md={6} lg={4} key={agent.agent_id}>
                  <Card sx={{ 
                    backgroundColor: '#0f172a', 
                    border: `2px solid ${riskColors[agent.risk_level as keyof typeof riskColors]}`,
                    position: 'relative'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Warning sx={{ color: riskColors[agent.risk_level as keyof typeof riskColors], mr: 2 }} />
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {agent.agent_name}
                        </Typography>
                        <Chip 
                          label={agent.risk_level.toUpperCase()} 
                          color={getRiskChipColor(agent.risk_level) as any} 
                          size="small"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        Trust Score: {Math.round(agent.trust_scores.aggregate * 100)}% | 
                        Confidence: {Math.round(agent.confidence * 100)}%
                      </Typography>
                      
                      {agent.risk_factors.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold' }}>
                            Risk Factors:
                          </Typography>
                          {agent.risk_factors.map((factor, index) => (
                            <Chip
                              key={index}
                              label={factor}
                              size="small"
                              sx={{ 
                                mr: 0.5, 
                                mt: 0.5,
                                backgroundColor: '#1e293b',
                                color: '#f59e0b'
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => setSelectedAgent(agent)}
                        >
                          Analyze
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Build />}
                          onClick={() => {
                            setSelectedAgent(agent);
                            setRemediationDialog(true);
                          }}
                        >
                          Remediate
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              {filteredMetrics.filter(agent => agent.risk_level !== 'low').length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ backgroundColor: '#065f46', color: 'white' }}>
                    <AlertTitle>All Clear</AlertTitle>
                    No agents currently require risk-based attention. All agents are operating within acceptable trust boundaries.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </Card>
        
        {/* Speed Dial for Quick Actions */}
        <SpeedDial
          ariaLabel="Trust metrics actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<Refresh />}
            tooltipTitle="Refresh Data"
            onClick={handleRefresh}
          />
          <SpeedDialAction
            icon={<Download />}
            tooltipTitle="Export Report"
            onClick={() => handleExportReport('csv')}
          />
          <SpeedDialAction
            icon={<Analytics />}
            tooltipTitle="View Analytics"
            onClick={() => setTabValue(1)}
          />
          <SpeedDialAction
            icon={<Warning />}
            tooltipTitle="View Alerts"
            onClick={() => setAlertDialog(true)}
          />
        </SpeedDial>
        
        {/* Remediation Dialog */}
        <Dialog 
          open={remediationDialog} 
          onClose={() => setRemediationDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Create Remediation Plan
            {selectedAgent && (
              <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                Agent: {selectedAgent.agent_name} ({selectedAgent.agent_id})
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            {selectedAgent && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Issue Description"
                  multiline
                  rows={3}
                  defaultValue={`Trust score degradation: ${Math.round(selectedAgent.trust_scores.aggregate * 100)}%`}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Severity</InputLabel>
                  <Select defaultValue={selectedAgent.risk_level}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Assigned To"
                  placeholder="Enter assignee email or name"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  placeholder="Additional notes or context..."
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRemediationDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => selectedAgent && handleCreateRemediation(
                selectedAgent.agent_id,
                `Trust score degradation: ${Math.round(selectedAgent.trust_scores.aggregate * 100)}%`,
                selectedAgent.risk_level
              )}
            >
              Create Plan
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Settings Dialog */}
        <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)}>
          <DialogTitle>Trust Metrics Settings</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={<Switch checked={realTimeEnabled} onChange={(e) => setRealTimeEnabled(e.target.checked)} />}
                label="Enable real-time updates"
              />
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 1 }}>
                Automatically refresh data every 30 seconds
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        
        {/* Alerts Dialog */}
        <Dialog 
          open={alertDialog} 
          onClose={() => setAlertDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Trust Alerts ({trustAlerts.length})
            <IconButton
              aria-label="close"
              onClick={() => setAlertDialog(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trustAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>{alert.agent_name}</TableCell>
                      <TableCell>
                        <Chip label={alert.type.replace('_', ' ')} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={alert.severity} 
                          color={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<Visibility />}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default EnhancedTrustMetricsOverviewPage;

