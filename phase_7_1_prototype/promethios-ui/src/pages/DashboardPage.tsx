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
  const { currentUser } = useAuth(); // Get current authenticated user
  const [userAgents, setUserAgents] = useState<Array<{ agentId: string; version: 'test' | 'production' }>>([]);
  
  // Real-time metrics for all user agents
  const agentMetrics = useMultiAgentRealTimeMetrics(userAgents);
  
  // Real governance dashboar  // Use optimized governance dashboard hook for better performance
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

  useEffect(() => {
    // Load user agents for real-time metrics
    const loadUserAgents = async () => {
      try {
        // CRITICAL: Set the current user in the storage service
        if (currentUser?.uid) {
          console.log('🔧 Setting current user in UserAgentStorageService:', currentUser.uid);
          userAgentStorageService.setCurrentUser(currentUser.uid);
        } else {
          console.warn('⚠️ No current user available for UserAgentStorageService');
          return;
        }

        // Use the correct method from UserAgentStorageService
        const agents = await userAgentStorageService.loadUserAgents();
        const agentList = agents.map(agent => ({
          agentId: agent.identity.id,
          version: 'production' as const // Focus on production agents for dashboard
        }));
        setUserAgents(agentList);
        console.log(`✅ Loaded ${agents.length} user agents for dashboard:`, agents.map(a => a.identity.name));
      } catch (error) {
        console.error('Failed to load user agents:', error);
      }
    };

    loadUserAgents();
  }, [currentUser]); // Re-run when currentUser changes

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
          severity="warning" 
          sx={{ mb: 3, backgroundColor: '#f59e0b20', color: '#f59e0b' }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={refreshMetrics}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          }
        >
          Backend connection issue: {dashboardError}. Using fallback data.
        </Alert>
      )}

      {/* Enhanced Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
              Promethios Command Center
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#a0aec0', mb: 1 }}>
              Monitor, govern, and optimize your AI agents with real-time trust metrics and compliance tracking
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip 
                label={isConnected ? "Live Monitoring" : "Offline Mode"} 
                size="small" 
                sx={{ 
                  backgroundColor: isConnected ? '#10b98120' : '#f59e0b20', 
                  color: isConnected ? '#10b981' : '#f59e0b', 
                  border: `1px solid ${isConnected ? '#10b981' : '#f59e0b'}` 
                }}
              />
              <Chip 
                label="Real-time Updates" 
                size="small" 
                sx={{ backgroundColor: '#3182ce20', color: '#3182ce', border: '1px solid #3182ce' }}
              />
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Take a guided tour of the dashboard">
              <IconButton 
                sx={{ color: '#a0aec0', '&:hover': { color: '#3182ce' } }}
                onClick={() => {/* TODO: Implement guided tour */}}
              >
                <TourOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="View help documentation">
              <IconButton 
                sx={{ color: '#a0aec0', '&:hover': { color: '#3182ce' } }}
                onClick={() => navigate('/ui/help/documentation')}
              >
                <Help />
              </IconButton>
            </Tooltip>
            <Tooltip title="System settings">
              <IconButton 
                sx={{ color: '#a0aec0', '&:hover': { color: '#3182ce' } }}
                onClick={() => navigate('/ui/settings/organization')}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Real-time Status Bar */}
        <Box 
          display="flex" 
          alignItems="center" 
          gap={2} 
          p={2} 
          sx={{ 
            backgroundColor: '#1a202c', 
            borderRadius: 2, 
            border: '1px solid #2d3748' 
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: health?.status === 'operational' ? '#10b981' : health?.status === 'degraded' ? '#f59e0b' : '#ef4444',
                animation: isConnected ? 'pulse 2s infinite' : 'none'
              }} 
            />
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              System Status: {health?.status === 'operational' ? 'Operational' : health?.status === 'degraded' ? 'Degraded' : health?.status === 'down' ? 'Down' : 'Unknown'}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ borderColor: '#4a5568' }} />
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ borderColor: '#4a5568' }} />
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            {metrics?.agents?.total || 0} Agents Monitored
          </Typography>
          {isConnected && (
            <>
              <Divider orientation="vertical" flexItem sx={{ borderColor: '#4a5568' }} />
              <Tooltip title="Refresh dashboard data">
                <IconButton 
                  size="small" 
                  onClick={refreshMetrics}
                  sx={{ color: '#a0aec0', '&:hover': { color: '#3182ce' } }}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {/* Main Metrics Grid */}
      <Grid container spacing={3} mb={4}>
        {/* Enhanced Agents Overview */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ backgroundColor: '#3182ce', mr: 2 }}>
                    <SmartToy />
                  </Avatar>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" sx={{ color: 'white' }}>Agents</Typography>
                      <Tooltip title="AI agents under governance monitoring. Healthy agents are operating within policy boundaries.">
                        <InfoOutlined sx={{ fontSize: 16, color: '#a0aec0', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Active Monitoring</Typography>
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
                    backgroundColor: '#d4edda', 
                    color: '#155724',
                    fontSize: '0.75rem'
                  }} 
                />
                <Chip 
                  size="small" 
                  label={`${metrics?.agents?.warning || 0} Warning`} 
                  sx={{ 
                    backgroundColor: '#fff3cd', 
                    color: '#856404',
                    fontSize: '0.75rem'
                  }} 
                />
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.agents?.total > 0 ? ((metrics?.agents?.healthy || 0) / metrics.agents.total) * 100 : 0}
                sx={{ 
                  mt: 2, 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#10b981'
                  }
                }} 
              />
              {(metrics?.agents?.total || 0) === 0 ? (
                <Button 
                  size="small" 
                  startIcon={<Add />}
                  onClick={() => navigate('/ui/agents/wrapping')}
                  sx={{ color: '#3182ce', fontWeight: 'bold' }}
                >
                  Add First Agent
                </Button>
              ) : (
                <Button 
                  size="small" 
                  onClick={() => navigate('/ui/agents/profiles')}
                  sx={{ color: '#3182ce' }}
                >
                  View All <ArrowForward fontSize="small" sx={{ ml: 1 }} />
                </Button>
              )}
            </CardContent>
            <CardActions>
            </CardActions>
          </Card>
        </Grid>

        {/* Enhanced Governance Score */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ backgroundColor: '#8b5cf6', mr: 2 }}>
                    <Security />
                  </Avatar>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" sx={{ color: 'white' }}>Governance</Typography>
                      <Tooltip title="Overall policy compliance rate across all monitored agents. Higher scores indicate better adherence to governance policies.">
                        <InfoOutlined sx={{ fontSize: 16, color: '#a0aec0', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Compliance Score</Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics?.governance?.score}%
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Tooltip title="Active governance policies monitoring agent behavior">
                  <Chip 
                    label={`${metrics?.governance?.activePolicies} Policies`} 
                    size="small" 
                    sx={{ backgroundColor: '#4a5568', color: 'white', cursor: 'help' }}
                  />
                </Tooltip>
                <Tooltip title="Policy violations detected across all agents">
                  <Chip 
                    label={`${metrics?.governance?.violations} Violations`} 
                    size="small" 
                    sx={{ backgroundColor: '#ef4444', color: 'white', cursor: 'help' }}
                  />
                </Tooltip>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.governance?.score}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#8b5cf6' }
                }}
              />
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between' }}>
              <Button 
                size="small" 
                onClick={() => navigate('/ui/governance/overview')}
                sx={{ color: '#8b5cf6' }}
              >
                View Details <ArrowForward fontSize="small" sx={{ ml: 1 }} />
              </Button>
              {metrics?.governance?.violations > 0 && (
                <Button 
                  size="small" 
                  startIcon={<Warning />}
                  onClick={() => navigate('/ui/governance/violations')}
                  sx={{ color: '#ef4444' }}
                >
                  Resolve Issues
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Enhanced Trust Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ backgroundColor: '#10b981', mr: 2 }}>
                    <VerifiedUser />
                  </Avatar>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" sx={{ color: 'white' }}>Trust Score</Typography>
                      <Tooltip title="Composite trust rating based on competence, reliability, honesty, and transparency metrics across all agents.">
                        <InfoOutlined sx={{ fontSize: 16, color: '#a0aec0', cursor: 'help' }} />
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Average Rating</Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics?.trust?.averageScore}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Tooltip title="Verified trust relationships between agents and systems">
                  <Chip 
                    label={`${metrics?.trust?.totalAttestations} Attestations`} 
                    size="small" 
                    sx={{ backgroundColor: '#4a5568', color: 'white', cursor: 'help' }}
                  />
                </Tooltip>
                <Tooltip title="Active trust boundaries defining agent interaction limits">
                  <Chip 
                    label={`${metrics?.trust?.activeBoundaries} Boundaries`} 
                    size="small" 
                    sx={{ backgroundColor: '#4a5568', color: 'white', cursor: 'help' }}
                  />
                </Tooltip>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.trust?.averageScore}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' }
                }}
              />
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/ui/trust/overview')}
                sx={{ color: '#10b981' }}
              >
                View Metrics <ArrowForward fontSize="small" sx={{ ml: 1 }} />
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#f59e0b', mr: 2 }}>
                  <Dashboard />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>System Health</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Overall Status</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: '#f59e0b', mb: 1 }}>
                Needs Review
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label="Last Check: 30 min ago" 
                  size="small" 
                  sx={{ backgroundColor: '#4a5568', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={75}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#f59e0b' }
                }}
              />
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/ui/settings/organization')}
                sx={{ color: '#f59e0b' }}
              >
                System Settings <ArrowForward fontSize="small" sx={{ ml: 1 }} />
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Secondary Metrics Row */}
      <Grid container spacing={3} mb={4}>
        {/* Trust Dimensions Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Trust Dimensions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Competence</Typography>
                    <Typography variant="h6" sx={{ color: '#3b82f6' }}>{metrics?.trust?.competence}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Reliability</Typography>
                    <Typography variant="h6" sx={{ color: '#10b981' }}>{metrics?.trust?.reliability}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Honesty</Typography>
                    <Typography variant="h6" sx={{ color: '#f59e0b' }}>{metrics?.trust?.honesty}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Transparency</Typography>
                    <Typography variant="h6" sx={{ color: '#8b5cf6' }}>{metrics?.trust?.transparency}%</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Quick Actions
                </Typography>
                <Tooltip title="Common tasks and workflows for managing your AI governance">
                  <InfoOutlined sx={{ fontSize: 16, color: '#a0aec0', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => navigate('/ui/agents/wrapping')}
                    sx={{ 
                      borderColor: '#3182ce', 
                      color: '#3182ce',
                      '&:hover': { borderColor: '#2c5aa0', backgroundColor: '#3182ce20' },
                      py: 1.5
                    }}
                  >
                    Add New Agent
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Policy />}
                    onClick={() => navigate('/ui/governance/policies')}
                    sx={{ 
                      borderColor: '#8b5cf6', 
                      color: '#8b5cf6',
                      '&:hover': { borderColor: '#7c3aed', backgroundColor: '#8b5cf620' },
                      py: 1.5
                    }}
                  >
                    Manage Policies
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={() => navigate('/ui/agents/benchmarks')}
                    sx={{ 
                      borderColor: '#10b981', 
                      color: '#10b981',
                      '&:hover': { borderColor: '#059669', backgroundColor: '#10b98120' },
                      py: 1.5
                    }}
                  >
                    Run Benchmarks
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TourOutlined />}
                    onClick={() => navigate('/ui/help/tours')}
                    sx={{ 
                      borderColor: '#f59e0b', 
                      color: '#f59e0b',
                      '&:hover': { borderColor: '#d97706', backgroundColor: '#f59e0b20' },
                      py: 1.5
                    }}
                  >
                    Take Tour
                  </Button>
                </Grid>
              </Grid>
              
              {/* New User Getting Started */}
              {userAgents.length === 0 && (
                <Box mt={3} p={2} sx={{ backgroundColor: '#1a202c', borderRadius: 2, border: '1px solid #3182ce' }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <PlayCircleOutline sx={{ color: '#3182ce' }} />
                    <Typography variant="subtitle1" sx={{ color: '#3182ce', fontWeight: 'bold' }}>
                      Get Started with Promethios
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    Welcome! Start by adding your first AI agent to begin governance monitoring.
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/ui/agents/wrapping')}
                      sx={{ backgroundColor: '#3182ce', '&:hover': { backgroundColor: '#2c5aa0' } }}
                    >
                      Add First Agent
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<GetApp />}
                      onClick={() => {/* TODO: Demo data */}}
                      sx={{ borderColor: '#a0aec0', color: '#a0aec0' }}
                    >
                      Load Demo Data
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Recent Activity
                </Typography>
                <IconButton size="small" sx={{ color: '#a0aec0' }}>
                  <Refresh />
                </IconButton>
              </Box>
              <List>
                {(metrics?.activity?.recentEvents || []).map((event, index) => (
                  <React.Fragment key={event.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Box sx={{ color: getSeverityColor(event.severity) }}>
                          {getSeverityIcon(event.severity)}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={event.message}
                        secondary={event.timestamp}
                        primaryTypographyProps={{ sx: { color: 'white' } }}
                        secondaryTypographyProps={{ sx: { color: '#a0aec0' } }}
                      />
                    </ListItem>
                    {index < (metrics?.activity?.recentEvents || []).length - 1 && (
                      <Divider sx={{ borderColor: '#4a5568' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Real-time Agent Metrics */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Agent Performance Metrics
                </Typography>
                <Chip 
                  label={`${userAgents.length} Agents Monitored`}
                  size="small"
                  sx={{ backgroundColor: '#3182ce20', color: '#3182ce' }}
                />
              </Box>
              
              {agentMetrics.isLoading && userAgents.length > 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress sx={{ color: '#3182ce' }} />
                  <Typography variant="body2" sx={{ ml: 2, color: '#a0aec0' }}>
                    Loading agent metrics...
                  </Typography>
                </Box>
              ) : userAgents.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <SmartToy sx={{ fontSize: 48, color: '#4a5568', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#a0aec0', mb: 1 }}>
                    No Agents Found
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
                    Create your first agent to see real-time metrics
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/ui/agents/wrapping')}
                    sx={{ backgroundColor: '#3182ce', '&:hover': { backgroundColor: '#2c5aa0' } }}
                  >
                    Wrap Your First Agent
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {userAgents.slice(0, 4).map(({ agentId, version }) => {
                    const profile = agentMetrics.getProfile(agentId, version);
                    const error = agentMetrics.getError(agentId, version);
                    
                    // Show placeholder for agents without metrics profiles (Enhanced Veritas incomplete)
                    if (error && !error.includes('Enhanced Veritas')) {
                      return (
                        <Grid item xs={12} sm={6} key={`${agentId}_${version}`}>
                          <Alert severity="warning" sx={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                            Failed to load metrics for {agentId}
                          </Alert>
                        </Grid>
                      );
                    }
                    
                    // Show basic agent info even without full metrics profile
                    if (!profile) {
                      return (
                        <Grid item xs={12} sm={6} key={`${agentId}_${version}`}>
                          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                            <CardContent>
                              <Box display="flex" alignItems="center" mb={2}>
                                <Avatar sx={{ backgroundColor: '#3182ce', mr: 2 }}>
                                  <SmartToy />
                                </Avatar>
                                <Box>
                                  <Typography variant="h6" sx={{ color: 'white' }}>
                                    {agentId}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                                    {version === 'production' ? 'Production Agent' : 'Test Agent'}
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                                Metrics profile loading...
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    }
                    
                    return (
                      <Grid item xs={12} sm={6} key={`${agentId}_${version}`}>
                        <AgentMetricsWidget
                          agentId={agentId}
                          agentName={profile.agentName}
                          version={version}
                          compact={true}
                          showTitle={true}
                        />
                      </Grid>
                    );
                  })}
                  
                  {userAgents.length > 4 && (
                    <Grid item xs={12}>
                      <Box textAlign="center" pt={2}>
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/ui/agents/lifecycle')}
                          sx={{ 
                            borderColor: '#3182ce', 
                            color: '#3182ce',
                            '&:hover': { borderColor: '#2c5aa0', backgroundColor: '#3182ce20' }
                          }}
                        >
                          View All {userAgents.length} Agents <ArrowForward fontSize="small" sx={{ ml: 1 }} />
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Observer Agent */}
        <Grid item xs={12} md={4}>
          {/* Observer Agent removed - now using FloatingObserverAgent globally */}
          <div style={{ display: 'none' }}>
            Observer Agent moved to floating sidebar
          </div>
        </Grid>
      </Grid>
      </DashboardProgressiveLoader>
    </Container>
  );
};
export default DashboardPage;

