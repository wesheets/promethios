/**
 * Enhanced Governance Overview Page
 * 
 * Comprehensive governance dashboard with real-time metrics, scorecards,
 * and actionable insights using existing notification and UI systems.
 * ALL COMPONENTS HAVE COMPREHENSIVE TOOLTIPS FOR TRANSPARENCY
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePageMetrics } from '../hooks/usePageMetrics';
import { useAnalytics } from '../components/common/AnalyticsProvider';
import { useToast } from '../hooks/use-toast';
import { useNotificationBackend } from '../hooks/useNotificationBackend';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { metricsService } from '../services/MetricsCollectionService';
import { DualAgentWrapperRegistry } from '../modules/agent-wrapping/services/DualAgentWrapperRegistry';
import { DualWrapperStorageService } from '../modules/agent-wrapping/services/DualWrapperStorageService';
import { BasicGovernanceEngine } from '../modules/agent-wrapping/services/governance/BasicGovernanceEngine';
import GovernanceHeatmap from '../components/governance/GovernanceHeatmap';
import PolicyImpactChart from '../components/governance/PolicyImpactChart';
import TrustNetworkGraph from '../components/governance/TrustNetworkGraph';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Button,
  Alert,
  AlertTitle,
  Divider,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Security,
  Shield,
  Warning,
  CheckCircle,
  TrendingUp,
  Assessment,
  Visibility,
  Refresh,
  Download,
  FilterList,
  MoreVert,
  Error,
  Info,
  Timeline,
  Speed,
  Psychology,
  Groups,
  Person,
  Notifications,
  Settings,
  Analytics,
  CloudSync,
  VerifiedUser,
  BugReport,
  Insights,
  AutoFixHigh,
  NotificationsActive
} from '@mui/icons-material';

// Enhanced types for real governance data
interface GovernanceMetrics {
  overallScore: number;
  trustScore: number;
  complianceRate: number;
  violationCount: number;
  criticalViolations: number;
  agentCount: number;
  governedAgents: number;
  lastUpdated: string;
}

interface AgentScorecard {
  agentId: string;
  agentName: string;
  trustScore: number;
  complianceRate: number;
  violationCount: number;
  lastActivity: string;
  governanceIdentity: string;
  status: 'active' | 'inactive' | 'suspended';
  type: 'single' | 'multi-agent';
}

interface GovernanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  agentId?: string;
  timestamp: string;
  actionRequired: boolean;
  actionUrl?: string;
}

const EnhancedGovernanceOverviewPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { createNotification } = useNotificationBackend();
  const { trackEvent } = useAnalytics();
  
  // State management
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [scorecards, setScorecards] = useState<AgentScorecard[]>([]);
  const [alerts, setAlerts] = useState<GovernanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  
  // Services
  const [dualRegistry, setDualRegistry] = useState<DualAgentWrapperRegistry | null>(null);
  const [storageService, setStorageService] = useState<DualWrapperStorageService | null>(null);
  const [governanceEngine, setGovernanceEngine] = useState<BasicGovernanceEngine | null>(null);

  // Initialize services
  const initializeServices = useCallback(async () => {
    if (!currentUser) return;

    try {
      const storage = new DualWrapperStorageService();
      const registry = new DualAgentWrapperRegistry(storage);
      const engine = new BasicGovernanceEngine();

      setStorageService(storage);
      setDualRegistry(registry);
      setGovernanceEngine(engine);

      // Load initial data
      await loadGovernanceData();
      
      toast({
        title: "Governance Dashboard Loaded",
        description: "Real-time governance metrics are now available",
        variant: "default"
      });

    } catch (error) {
      console.error('Failed to initialize governance services:', error);
      setError('Failed to initialize governance services');
      toast({
        title: "Initialization Error",
        description: "Failed to load governance services",
        variant: "destructive"
      });
    }
  }, [currentUser, toast]);

  // Load real governance data from deployed agents (NOT test chat data)
  const loadGovernanceData = useCallback(async () => {
    if (!currentUser || !dualRegistry || !governanceEngine) return;

    try {
      setLoading(true);
      setError(null);

      // Get dual wrappers for the user (DEPLOYED AGENTS ONLY)
      const userWrappers = await dualRegistry.listDualWrappers({
        limit: 100,
        includeInactive: false, // Only active deployed agents
        deploymentOnly: true    // Only deployment wrappers, not test versions
      });

      // Calculate overall metrics from DEPLOYED AGENT DATA
      const totalAgents = userWrappers.wrappers.length;
      const governedAgents = userWrappers.wrappers.filter(w => 
        w.deploymentWrapper && w.deploymentWrapper.status === 'deployed'
      ).length;

      // Get governance metrics from deployed agents via API
      const governanceMetrics = await metricsService.getGovernanceMetrics({
        type: 'trust_score',
        timeRange: timeRange,
        agentId: undefined,
        source: 'deployed_agents' // Only from deployed agents
      });

      const violationMetrics = await metricsService.getGovernanceMetrics({
        type: 'policy_violation',
        timeRange: timeRange,
        agentId: undefined,
        source: 'deployed_agents' // Only from deployed agents
      });

      // Calculate scores from real deployed agent data
      const avgTrustScore = governanceMetrics.length > 0 
        ? governanceMetrics.reduce((sum, m) => sum + m.value, 0) / governanceMetrics.length 
        : 0; // Start at 0 if no deployed agents

      const violationCount = violationMetrics.length;
      const criticalViolations = violationMetrics.filter(v => 
        v.metadata?.severity === 'critical'
      ).length;

      const complianceRate = totalAgents > 0 
        ? ((totalAgents - violationCount) / totalAgents) * 100 
        : 100;

      const overallScore = totalAgents > 0 ? Math.round((avgTrustScore + complianceRate) / 2) : 0;

      setMetrics({
        overallScore,
        trustScore: Math.round(avgTrustScore),
        complianceRate: Math.round(complianceRate),
        violationCount,
        criticalViolations,
        agentCount: totalAgents,
        governedAgents,
        lastUpdated: new Date().toISOString()
      });

      // Create scorecards for each DEPLOYED agent with real governance identities
      const agentScorecards: AgentScorecard[] = userWrappers.wrappers.map(wrapper => {
        const agentMetrics = governanceMetrics.filter(m => m.agentId === wrapper.id);
        const agentViolations = violationMetrics.filter(v => v.agentId === wrapper.id);
        
        const trustScore = agentMetrics.length > 0 
          ? Math.round(agentMetrics.reduce((sum, m) => sum + m.value, 0) / agentMetrics.length)
          : 0; // Start at 0 for new deployed agents

        const complianceRate = agentViolations.length === 0 ? 100 : 
          Math.max(0, 100 - (agentViolations.length * 10));

        return {
          agentId: wrapper.id,
          agentName: wrapper.metadata.name,
          trustScore,
          complianceRate,
          violationCount: agentViolations.length,
          lastActivity: wrapper.metadata.updatedAt,
          governanceIdentity: wrapper.governanceIdentity || `gov-id-${wrapper.id.slice(0, 8)}`,
          status: wrapper.deploymentWrapper?.status === 'deployed' ? 'active' : 'inactive',
          type: wrapper.metadata.multiAgentConfig ? 'multi-agent' : 'single'
        };
      });

      setScorecards(agentScorecards);

      // Create governance notifications for critical issues using existing system
      if (criticalViolations > 0) {
        await createNotification({
          type: 'governance_alert',
          title: 'Critical Governance Violations',
          message: `${criticalViolations} critical violations detected from deployed agents`,
          source: 'deployed_agents',
          severity: 'critical',
          action_required: true,
          action_url: '/governance/violations'
        });
      }

      // Track analytics
      trackEvent('governance_data_loaded', {
        agent_count: totalAgents,
        governed_agents: governedAgents,
        overall_score: overallScore,
        critical_violations: criticalViolations
      });

    } catch (error) {
      console.error('Failed to load governance data:', error);
      setError('Failed to load governance data');
      toast({
        title: "Data Load Error",
        description: "Failed to load governance metrics from deployed agents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, dualRegistry, governanceEngine, timeRange, createNotification, trackEvent, toast]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGovernanceData();
    setRefreshing(false);
    
    toast({
      title: "Data Refreshed",
      description: "Governance metrics updated from deployed agents",
      variant: "default"
    });
  }, [loadGovernanceData, toast]);

  // Export governance report
  const handleExportReport = useCallback(async () => {
    try {
      const reportData = {
        metrics,
        scorecards,
        alerts,
        timestamp: new Date().toISOString(),
        timeRange,
        source: 'deployed_agents_only'
      };

      // Use existing export functionality if available
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `governance-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: "Governance report downloaded successfully",
        variant: "default"
      });

      trackEvent('governance_report_exported', {
        agent_count: metrics?.agentCount || 0,
        time_range: timeRange
      });

    } catch (error) {
      console.error('Failed to export report:', error);
      toast({
        title: "Export Error",
        description: "Failed to export governance report",
        variant: "destructive"
      });
    }
  }, [metrics, scorecards, alerts, timeRange, toast, trackEvent]);

  // Initialize on mount
  useEffect(() => {
    initializeServices();
  }, [initializeServices]);

  // Auto-refresh every 5 minutes for deployed agent data
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        loadGovernanceData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading, refreshing, loadGovernanceData]);

  // Get governance level based on overall score
  const getGovernanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#10B981', icon: <Shield /> };
    if (score >= 80) return { level: 'Good', color: '#3B82F6', icon: <Security /> };
    if (score >= 70) return { level: 'Fair', color: '#F59E0B', icon: <Warning /> };
    return { level: 'Needs Attention', color: '#EF4444', icon: <Error /> };
  };

  const governanceLevel = getGovernanceLevel(metrics?.overallScore || 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2, color: '#a0aec0' }}>
          Loading governance data from deployed agents...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <AlertTitle>Error Loading Governance Data</AlertTitle>
        {error}
        <Button onClick={handleRefresh} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Enhanced Header with Tooltips */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip 
              title="Comprehensive governance dashboard showing real-time metrics from your deployed agents. This data comes from agents running in production, not test chats."
              arrow
              placement="bottom"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'help' }}>
                Governance Overview
                <Info sx={{ fontSize: 20, color: '#6B7280' }} />
              </Box>
            </Tooltip>
            <Chip 
              label="Enhanced" 
              size="small" 
              sx={{ bgcolor: '#3182ce', color: 'white' }}
            />
          </Typography>
          <Typography variant="body1" sx={{ color: '#a0aec0' }}>
            Real-time governance monitoring from deployed agents with dual-wrapping scorecards
          </Typography>
          {metrics?.lastUpdated && (
            <Tooltip title="When the governance data was last updated from deployed agents">
              <Typography variant="caption" sx={{ color: '#718096', cursor: 'help' }}>
                Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
              </Typography>
            </Tooltip>
          )}
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          {/* Use existing NotificationCenter component */}
          <Tooltip title="View governance alerts and notifications from your deployed agents">
            <Box>
              <NotificationCenter />
            </Box>
          </Tooltip>
          
          <Tooltip title="Refresh governance data from all deployed agents">
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ 
                borderColor: '#4a5568',
                color: '#a0aec0',
                '&:hover': { borderColor: '#718096', backgroundColor: '#2d3748' }
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Tooltip>
          
          <Tooltip title="Export comprehensive governance report including all deployed agent metrics">
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportReport}
              sx={{ 
                backgroundColor: '#3182ce',
                '&:hover': { backgroundColor: '#2c5aa0' }
              }}
            >
              Export Report
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Enhanced Key Metrics with Comprehensive Tooltips */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Tooltip 
            title="Overall governance effectiveness calculated from trust scores and compliance rates of all deployed agents. This is a composite score indicating the health of your governance system."
            arrow
            placement="top"
          >
            <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', cursor: 'help' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" sx={{ color: governanceLevel.color }} gutterBottom>
                      {metrics?.overallScore || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Overall Governance Score
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: governanceLevel.color }}>
                    {governanceLevel.icon}
                  </Avatar>
                </Box>
                <Box mt={1} display="flex" alignItems="center" gap={1}>
                  <Chip 
                    label={governanceLevel.level} 
                    size="small" 
                    sx={{ bgcolor: governanceLevel.color, color: 'white' }}
                  />
                  <TrendingUp sx={{ color: '#10B981', fontSize: 16 }} />
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Tooltip 
            title="Number of agents currently deployed with governance enabled. These agents are actively reporting governance metrics back to Promethios."
            arrow
            placement="top"
          >
            <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', cursor: 'help' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="success.main" gutterBottom>
                      {metrics?.governedAgents || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Governed Agents
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <VerifiedUser />
                  </Avatar>
                </Box>
                <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                  {metrics?.agentCount || 0} total deployed agents
                </Typography>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Tooltip 
            title="Average trust score across all deployed agents. Trust scores are calculated based on policy compliance, user feedback, and behavioral analysis from real-world usage."
            arrow
            placement="top"
          >
            <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', cursor: 'help' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="info.main" gutterBottom>
                      {metrics?.trustScore || 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Average Trust Score
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <Psychology />
                  </Avatar>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics?.trustScore || 0} 
                  sx={{ 
                    mt: 1,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#3B82F6'
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Tooltip 
            title="Policy violations detected from deployed agents in the selected time range. Critical violations require immediate attention and may trigger automatic responses."
            arrow
            placement="top"
          >
            <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', cursor: 'help' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="error.main" gutterBottom>
                      {metrics?.violationCount || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Policy Violations
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <BugReport />
                  </Avatar>
                </Box>
                {metrics?.criticalViolations && metrics.criticalViolations > 0 && (
                  <Chip 
                    label={`${metrics.criticalViolations} Critical`}
                    size="small" 
                    sx={{ mt: 1, bgcolor: '#EF4444', color: 'white' }}
                  />
                )}
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>
      </Grid>

      {/* Time Range Selector with Tooltip */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Tooltip title="Select the time range for governance metrics. This affects all charts and statistics on this page.">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4a5568'
                },
                '& .MuiSvgIcon-root': {
                  color: '#a0aec0'
                }
              }}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>

        <Tooltip title="Data source indicator - all metrics come from deployed agents, not test chats">
          <Chip 
            icon={<CloudSync />}
            label="Deployed Agents Data"
            sx={{ 
              bgcolor: '#3182ce', 
              color: 'white',
              cursor: 'help'
            }}
          />
        </Tooltip>
      </Box>

      {/* Enhanced Tabs with Tooltips */}
      <Box mb={3}>
        <Tabs 
          value={selectedTab} 
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: '#a0aec0',
              '&.Mui-selected': {
                color: '#3182ce'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#3182ce'
            }
          }}
        >
          <Tooltip title="Overview of all governance metrics and agent scorecards">
            <Tab label="Overview" />
          </Tooltip>
          <Tooltip title="Visual heatmap showing governance coverage across your agent ecosystem">
            <Tab label="Coverage Heatmap" />
          </Tooltip>
          <Tooltip title="Analysis of how policies impact agent behavior and performance">
            <Tab label="Policy Impact" />
          </Tooltip>
          <Tooltip title="Interactive network showing trust relationships between agents">
            <Tab label="Trust Network" />
          </Tooltip>
        </Tabs>
      </Box>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Agent Scorecards with Enhanced Tooltips */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
              <CardHeader
                title={
                  <Tooltip 
                    title="Individual scorecards for each deployed agent showing their governance performance. Each agent has a unique governance identity for tracking."
                    arrow
                    placement="top"
                  >
                    <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'help' }}>
                      Agent Scorecards
                      <Info sx={{ fontSize: 16, color: '#6B7280' }} />
                    </Box>
                  </Tooltip>
                }
                action={
                  <Tooltip title="Number of deployed agents with governance enabled">
                    <Chip 
                      label={`${scorecards.length} Agents`}
                      sx={{ bgcolor: '#3182ce', color: 'white' }}
                    />
                  </Tooltip>
                }
                sx={{
                  '& .MuiCardHeader-title': {
                    color: 'white'
                  }
                }}
              />
              <CardContent>
                {scorecards.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="h6" sx={{ color: '#a0aec0', mb: 2 }}>
                      No Deployed Agents Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096' }}>
                      Deploy agents with governance enabled to see their scorecards here.
                      Test chat data is not included in these metrics.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <Tooltip title="Agent name and governance identity">
                            <TableCell sx={{ color: '#a0aec0', cursor: 'help' }}>
                              Agent
                            </TableCell>
                          </Tooltip>
                          <Tooltip title="Trust score calculated from real-world usage and policy compliance">
                            <TableCell sx={{ color: '#a0aec0', cursor: 'help' }}>
                              Trust Score
                            </TableCell>
                          </Tooltip>
                          <Tooltip title="Percentage of interactions that comply with governance policies">
                            <TableCell sx={{ color: '#a0aec0', cursor: 'help' }}>
                              Compliance
                            </TableCell>
                          </Tooltip>
                          <Tooltip title="Number of policy violations detected from this agent">
                            <TableCell sx={{ color: '#a0aec0', cursor: 'help' }}>
                              Violations
                            </TableCell>
                          </Tooltip>
                          <Tooltip title="Current deployment status and last activity">
                            <TableCell sx={{ color: '#a0aec0', cursor: 'help' }}>
                              Status
                            </TableCell>
                          </Tooltip>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {scorecards.map((scorecard) => (
                          <TableRow key={scorecard.agentId}>
                            <TableCell>
                              <Tooltip 
                                title={`Governance Identity: ${scorecard.governanceIdentity} - Unique identifier for tracking this agent's governance metrics`}
                                arrow
                                placement="right"
                              >
                                <Box sx={{ cursor: 'help' }}>
                                  <Typography variant="body2" sx={{ color: 'white' }}>
                                    {scorecard.agentName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                                    {scorecard.governanceIdentity}
                                  </Typography>
                                  <Chip 
                                    label={scorecard.type}
                                    size="small"
                                    sx={{ 
                                      ml: 1,
                                      bgcolor: scorecard.type === 'multi-agent' ? '#8B5CF6' : '#3B82F6',
                                      color: 'white'
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip 
                                title={`Trust score: ${scorecard.trustScore}% - Based on policy compliance, user feedback, and behavioral analysis from deployed usage`}
                                arrow
                              >
                                <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'help' }}>
                                  <Typography variant="body2" sx={{ color: 'white' }}>
                                    {scorecard.trustScore}%
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={scorecard.trustScore} 
                                    sx={{ 
                                      width: 60,
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: scorecard.trustScore >= 80 ? '#10B981' : 
                                                       scorecard.trustScore >= 60 ? '#3B82F6' : '#EF4444'
                                      }
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip 
                                title={`Compliance rate: ${scorecard.complianceRate}% - Percentage of interactions that follow governance policies`}
                                arrow
                              >
                                <Typography variant="body2" sx={{ 
                                  color: scorecard.complianceRate >= 90 ? '#10B981' : 
                                         scorecard.complianceRate >= 70 ? '#F59E0B' : '#EF4444',
                                  cursor: 'help'
                                }}>
                                  {scorecard.complianceRate}%
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip 
                                title={`${scorecard.violationCount} policy violations detected from this deployed agent in the selected time range`}
                                arrow
                              >
                                <Chip 
                                  label={scorecard.violationCount}
                                  size="small"
                                  sx={{ 
                                    bgcolor: scorecard.violationCount === 0 ? '#10B981' : 
                                            scorecard.violationCount <= 2 ? '#F59E0B' : '#EF4444',
                                    color: 'white',
                                    cursor: 'help'
                                  }}
                                />
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip 
                                title={`Status: ${scorecard.status} - Last activity: ${new Date(scorecard.lastActivity).toLocaleString()}`}
                                arrow
                              >
                                <Box sx={{ cursor: 'help' }}>
                                  <Chip 
                                    label={scorecard.status}
                                    size="small"
                                    sx={{ 
                                      bgcolor: scorecard.status === 'active' ? '#10B981' : 
                                              scorecard.status === 'inactive' ? '#6B7280' : '#EF4444',
                                      color: 'white'
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                                    {new Date(scorecard.lastActivity).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <GovernanceHeatmap 
          agents={scorecards}
          timeRange={timeRange}
          showTrustBoundaries={true}
          onAgentClick={(agentId) => {
            // Navigate to agent details
            console.log('Navigate to agent:', agentId);
          }}
        />
      )}

      {selectedTab === 2 && (
        <PolicyImpactChart 
          policies={[]} // Will be populated with real policy data
          beforeAfterMetrics={true}
          recommendOptimizations={true}
          timeRange={timeRange}
          onPolicyClick={(policyId) => {
            // Navigate to policy details
            console.log('Navigate to policy:', policyId);
          }}
        />
      )}

      {selectedTab === 3 && (
        <TrustNetworkGraph 
          agents={scorecards.map(s => ({
            id: s.agentId,
            name: s.agentName,
            type: s.type,
            trustScore: s.trustScore,
            status: s.status
          }))}
          showTrustFlow={true}
          highlightWeakLinks={true}
          onNodeClick={(agentId) => {
            // Navigate to agent details
            console.log('Navigate to agent:', agentId);
          }}
        />
      )}

      {/* Data Source Disclaimer */}
      <Box mt={4} p={2} sx={{ backgroundColor: '#2d3748', borderRadius: 1, border: '1px solid #4a5568' }}>
        <Tooltip title="Important: This dashboard shows metrics from deployed agents only. Test chat interactions are tracked separately and do not appear in these governance metrics.">
          <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'help' }}>
            <Info sx={{ color: '#3182ce' }} />
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              <strong>Data Source:</strong> All metrics displayed are from deployed agents reporting back to Promethios. 
              Test chat data is excluded from governance scorecards to ensure production accuracy.
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default EnhancedGovernanceOverviewPage;

