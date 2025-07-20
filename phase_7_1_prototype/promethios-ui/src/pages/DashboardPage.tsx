import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondary,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard,
  SmartToy,
  Security,
  VerifiedUser,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Add,
  Visibility,
  Settings,
  Help,
  Deploy,
  Assessment,
  Policy,
  Group,
  Chat,
  Notifications,
  ArrowForward,
  Psychology,
  Shield,
  Speed,
  Analytics,
  Timeline,
  AccountTree,
  AdminPanelSettings,
  InfoOutlined,
  PlayCircleOutline,
  GetApp,
  TourOutlined,
} from '@mui/icons-material';
import ObserverAgentProxy from '../proxies/ObserverAgentProxy';
import AgentMetricsWidget from '../components/AgentMetricsWidget';
import { useMultiAgentRealTimeMetrics } from '../hooks/useRealTimeMetrics';
import { userAgentStorageService } from '../services/UserAgentStorageService';
import { useOptimizedGovernanceDashboard } from '../hooks/useOptimizedGovernanceDashboard';
import { useAuth } from '../context/AuthContext';
import { DashboardProgressiveLoader } from '../components/loading/ProgressiveLoader';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Use optimized governance dashboard hook
  const {
    metrics,
    health,
    loading: dashboardLoading,
    error: dashboardError,
    isConnected,
    lastUpdated,
    loadingProgress,
    currentStage,
    refreshMetrics,
    triggerAction
  } = useOptimizedGovernanceDashboard();

  // State for real-time metrics (deferred until after dashboard loads)
  const [userAgents, setUserAgents] = useState<Array<{agentId: string, version: string}>>([]);
  const [realTimeMetricsEnabled, setRealTimeMetricsEnabled] = useState(false);
  
  // Real-time metrics (only enabled after dashboard loads)
  const agentMetrics = useMultiAgentRealTimeMetrics(realTimeMetricsEnabled ? userAgents : []);
  
  // Defer real-time metrics loading until after dashboard data is ready
  useEffect(() => {
    if (metrics?.agents?.total && metrics.agents.total > 0 && !realTimeMetricsEnabled) {
      console.log(`🔄 Dashboard loaded ${metrics.agents.total} agents, enabling real-time metrics after delay`);
      
      // Load actual agent data for real-time metrics
      const loadAgentsForRealTimeMetrics = async () => {
        try {
          if (currentUser?.uid) {
            userAgentStorageService.setCurrentUser(currentUser.uid);
            const agents = await userAgentStorageService.loadUserAgents();
            const agentList = agents.map(agent => ({
              agentId: agent.identity.id,
              version: 'production' as const
            }));
            
            console.log(`🔄 Loaded ${agentList.length} agents for real-time metrics`);
            setUserAgents(agentList);
            
            // Enable real-time metrics after a short delay to let the UI settle
            setTimeout(() => {
              console.log(`🚀 Enabling real-time metrics for ${agentList.length} agents`);
              setRealTimeMetricsEnabled(true);
            }, 2000); // 2 second delay
          }
        } catch (error) {
          console.error('Failed to load agents for real-time metrics:', error);
        }
      };

      loadAgentsForRealTimeMetrics();
    }
  }, [metrics?.agents?.total, currentUser?.uid, realTimeMetricsEnabled]);

  const getHealthColor = (health: 'healthy' | 'warning' | 'critical') => {
    switch (health) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <Error />;
      case 'info': return <Notifications />;
      default: return <Notifications />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <DashboardProgressiveLoader
        isLoading={dashboardLoading}
        error={dashboardError}
        retryAction={refreshMetrics}
      >
      {/* Backend Connection Status */}
      {dashboardError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={refreshMetrics}>
              <Refresh sx={{ mr: 1 }} />
              Retry
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Backend Connection Failed:</strong> {dashboardError}
          </Typography>
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
            Promethios Command Center
          </Typography>
          <Typography variant="body1" sx={{ color: '#718096', mt: 1 }}>
            Monitor, govern, and optimize your AI agents with real-time trust metrics and compliance tracking
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip 
              label="Live Monitoring" 
              color="success" 
              size="small" 
              icon={<Timeline />}
            />
            <Chip 
              label="Real-time Updates" 
              color="info" 
              size="small" 
              icon={<Refresh />}
            />
          </Stack>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton color="primary">
            <InfoOutlined />
          </IconButton>
          <IconButton color="primary">
            <Help />
          </IconButton>
          <IconButton color="primary">
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {/* System Status Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: '#f8fafc' }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: isConnected ? '#10b981' : '#ef4444' 
              }} 
            />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              System Status: {isConnected ? 'Operational' : 'Disconnected'}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {metrics?.agents?.total || 0} Agents Monitored
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <IconButton size="small" onClick={refreshMetrics} disabled={dashboardLoading}>
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Stack>
      </Paper>

      {/* Main Dashboard Grid */}
      <Grid container spacing={3}>
        {/* Agents Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                    <SmartToy />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Agents</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Active Monitoring</Typography>
                  </Box>
                </Box>
              </Box>
               <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2d3748' }}>
                {metrics?.agents?.total || 0}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip 
                  size="small" 
                  label={`${metrics?.agents?.healthy || 0} Healthy`}
                  sx={{ 
                    backgroundColor: 'rgba(16, 185, 129, 0.2)', 
                    color: '#10b981',
                    fontWeight: 500
                  }}
                />
                <Chip 
                  size="small" 
                  label={`${metrics?.agents?.warning || 0} Warning`}
                  sx={{ 
                    backgroundColor: 'rgba(245, 158, 11, 0.2)', 
                    color: '#f59e0b',
                    fontWeight: 500
                  }}
                />
              </Stack>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                sx={{ color: 'white', fontWeight: 500 }}
                endIcon={<ArrowForward />}
                onClick={() => navigate('/ui/agents')}
              >
                VIEW ALL
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Governance Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                    <Security />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Governance</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Compliance Score</Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {metrics?.governance?.score || 0}%
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip 
                  size="small" 
                  label={`${metrics?.governance?.activePolicies || 0} Policies`}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 500
                  }}
                />
                <Chip 
                  size="small" 
                  label={`${metrics?.governance?.violations || 0} Violations`}
                  sx={{ 
                    backgroundColor: metrics?.governance?.violations ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 500
                  }}
                />
              </Stack>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                sx={{ color: 'white', fontWeight: 500 }}
                endIcon={<ArrowForward />}
                onClick={() => navigate('/ui/governance')}
              >
                VIEW DETAILS
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Trust Score Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                    <VerifiedUser />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Trust Score</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Average Rating</Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {metrics?.trust?.averageScore || 0}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip 
                  size="small" 
                  label={`${metrics?.trust?.attestations || 0} Attestations`}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 500
                  }}
                />
                <Chip 
                  size="small" 
                  label={`${metrics?.trust?.boundaries || 0} Boundaries`}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 500
                  }}
                />
              </Stack>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                sx={{ color: 'white', fontWeight: 500 }}
                endIcon={<ArrowForward />}
                onClick={() => navigate('/ui/trust-metrics')}
              >
                VIEW METRICS
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* System Health Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                    <Assessment />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>System Health</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Overall Status</Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#2d3748' }}>
                {health?.status === 'operational' ? 'Needs Review' : health?.status || 'Unknown'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
                Last Check: {health?.lastCheck ? new Date(health.lastCheck).toLocaleTimeString() : '30 min ago'}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={health?.status === 'operational' ? 85 : 60} 
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'rgba(255,255,255,0.8)'
                  }
                }} 
              />
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                sx={{ color: 'white', fontWeight: 500 }}
                endIcon={<ArrowForward />}
                onClick={() => navigate('/ui/system-health')}
              >
                SYSTEM SETTINGS
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Trust Dimensions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#1a202c' }}>
                Trust Dimensions
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>Competence</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e40af' }}>
                      {metrics?.trust?.competence || 75}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>Reliability</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#059669' }}>
                      {metrics?.trust?.reliability || 75}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>Honesty</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#dc2626' }}>
                      {metrics?.trust?.honesty || 75}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>Transparency</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#7c3aed' }}>
                      {metrics?.trust?.transparency || 75}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                  Quick Actions
                </Typography>
                <IconButton size="small">
                  <Help sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Add />}
                    sx={{ py: 1.5, justifyContent: 'flex-start' }}
                    onClick={() => navigate('/ui/agents/create')}
                  >
                    ADD NEW AGENT
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AdminPanelSettings />}
                    sx={{ py: 1.5, justifyContent: 'flex-start' }}
                    onClick={() => navigate('/ui/governance/policies')}
                  >
                    MANAGE POLICIES
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Assessment />}
                    sx={{ py: 1.5, justifyContent: 'flex-start' }}
                    onClick={() => navigate('/ui/trust-metrics/benchmarks')}
                  >
                    RUN BENCHMARKS
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TourOutlined />}
                    sx={{ py: 1.5, justifyContent: 'flex-start' }}
                    onClick={() => navigate('/ui/help/tour')}
                  >
                    TAKE TOUR
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                  Recent Activity
                </Typography>
                <IconButton size="small" onClick={refreshMetrics}>
                  <Refresh sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
              {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                <List>
                  {metrics.recentActivity.slice(0, 5).map((activity, index) => (
                    <ListItem key={activity.id || index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: getSeverityColor(activity.type),
                            color: 'white'
                          }}
                        >
                          {getSeverityIcon(activity.type)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.message}
                        secondary={new Date(activity.timestamp).toLocaleString()}
                        sx={{ ml: 1 }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
                  No recent activity to display
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Agent Performance Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                  Agent Performance Metrics
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {userAgents.length} Agents Monitored
                </Typography>
              </Box>
              
              {realTimeMetricsEnabled ? (
                <Grid container spacing={3}>
                  {userAgents.slice(0, 4).map((agent, index) => (
                    <Grid item xs={12} sm={6} md={3} key={agent.agentId}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          border: '1px solid #e2e8f0',
                          borderRadius: 2
                        }}
                      >
                        <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: '#3b82f6' }}>
                          <SmartToy />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                          {agent.agentId.includes('agent-') ? 
                            agent.agentId.replace('agent-', 'agent-').substring(0, 20) + '...' : 
                            agent.agentId.substring(0, 20) + '...'
                          }
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                          {agent.version === 'production' ? 'Production Agent' : 'Test Agent'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Metrics profile loading...
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={24} sx={{ mb: 2 }} />
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {dashboardLoading ? 'Loading dashboard data...' : 'Preparing real-time metrics...'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </DashboardProgressiveLoader>
    </Container>
  );
};

export default DashboardPage;

