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
} from '@mui/icons-material';

interface DashboardMetrics {
  agents: {
    total: number;
    individual: number;
    multiAgent: number;
    healthy: number;
    warning: number;
    critical: number;
  };
  governance: {
    score: number;
    activePolicies: number;
    violations: number;
    complianceRate: number;
  };
  trust: {
    averageScore: number;
    competence: number;
    reliability: number;
    honesty: number;
    transparency: number;
    totalAttestations: number;
    activeBoundaries: number;
  };
  activity: {
    recentEvents: Array<{
      id: string;
      type: 'agent' | 'governance' | 'trust' | 'system';
      message: string;
      timestamp: string;
      severity: 'info' | 'warning' | 'error' | 'success';
    }>;
  };
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    agents: {
      total: 3,
      individual: 3,
      multiAgent: 0,
      healthy: 2,
      warning: 1,
      critical: 0,
    },
    governance: {
      score: 78,
      activePolicies: 12,
      violations: 3,
      complianceRate: 87,
    },
    trust: {
      averageScore: 85,
      competence: 92,
      reliability: 88,
      honesty: 82,
      transparency: 79,
      totalAttestations: 5,
      activeBoundaries: 8,
    },
    activity: {
      recentEvents: [
        {
          id: '1',
          type: 'agent',
          message: 'Agent "Assistant" was wrapped with governance',
          timestamp: '2 hours ago',
          severity: 'success',
        },
        {
          id: '2',
          type: 'governance',
          message: 'Governance policy updated',
          timestamp: 'Yesterday',
          severity: 'info',
        },
        {
          id: '3',
          type: 'trust',
          message: 'New agent relationship defined',
          timestamp: '3 days ago',
          severity: 'info',
        },
        {
          id: '4',
          type: 'governance',
          message: 'Policy violation detected in Data Analysis Bot',
          timestamp: '1 week ago',
          severity: 'warning',
        },
      ],
    },
  });

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Promethios Command Center
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#a0aec0' }}>
          AI Governance Dashboard - Real-time insights and control
        </Typography>
      </Box>

      {/* Main Metrics Grid */}
      <Grid container spacing={3} mb={4}>
        {/* Agents Overview */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#3182ce', mr: 2 }}>
                  <SmartToy />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Agents</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Active Monitoring</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics.agents.total}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${metrics.agents.healthy} Healthy`} 
                  size="small" 
                  sx={{ backgroundColor: '#10b981', color: 'white' }}
                />
                <Chip 
                  label={`${metrics.agents.warning} Warning`} 
                  size="small" 
                  sx={{ backgroundColor: '#f59e0b', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(metrics.agents.healthy / metrics.agents.total) * 100}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' }
                }}
              />
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/ui/agents/profiles')}
                sx={{ color: '#3182ce' }}
              >
                View All <ArrowForward fontSize="small" sx={{ ml: 1 }} />
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Governance Score */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#8b5cf6', mr: 2 }}>
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Governance</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Compliance Score</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics.governance.score}%
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${metrics.governance.activePolicies} Policies`} 
                  size="small" 
                  sx={{ backgroundColor: '#4a5568', color: 'white' }}
                />
                <Chip 
                  label={`${metrics.governance.violations} Violations`} 
                  size="small" 
                  sx={{ backgroundColor: '#ef4444', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics.governance.score}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#8b5cf6' }
                }}
              />
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/ui/governance/overview')}
                sx={{ color: '#8b5cf6' }}
              >
                View Details <ArrowForward fontSize="small" sx={{ ml: 1 }} />
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Trust Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#10b981', mr: 2 }}>
                  <VerifiedUser />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Trust Score</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Average Rating</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics.trust.averageScore}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${metrics.trust.totalAttestations} Attestations`} 
                  size="small" 
                  sx={{ backgroundColor: '#4a5568', color: 'white' }}
                />
                <Chip 
                  label={`${metrics.trust.activeBoundaries} Boundaries`} 
                  size="small" 
                  sx={{ backgroundColor: '#4a5568', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics.trust.averageScore}
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
                    <Typography variant="h6" sx={{ color: '#3b82f6' }}>{metrics.trust.competence}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Reliability</Typography>
                    <Typography variant="h6" sx={{ color: '#10b981' }}>{metrics.trust.reliability}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Honesty</Typography>
                    <Typography variant="h6" sx={{ color: '#f59e0b' }}>{metrics.trust.honesty}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Transparency</Typography>
                    <Typography variant="h6" sx={{ color: '#8b5cf6' }}>{metrics.trust.transparency}%</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => navigate('/ui/agents/profiles')}
                    sx={{ 
                      borderColor: '#3182ce', 
                      color: '#3182ce',
                      '&:hover': { borderColor: '#2c5aa0', backgroundColor: '#3182ce20' }
                    }}
                  >
                    Wrap Agent
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
                      '&:hover': { borderColor: '#7c3aed', backgroundColor: '#8b5cf620' }
                    }}
                  >
                    View Policies
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
                      '&:hover': { borderColor: '#059669', backgroundColor: '#10b98120' }
                    }}
                  >
                    Benchmarks
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Help />}
                    onClick={() => navigate('/ui/help/tours')}
                    sx={{ 
                      borderColor: '#f59e0b', 
                      color: '#f59e0b',
                      '&:hover': { borderColor: '#d97706', backgroundColor: '#f59e0b20' }
                    }}
                  >
                    Get Help
                  </Button>
                </Grid>
              </Grid>
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
                {metrics.activity.recentEvents.map((event, index) => (
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
                    {index < metrics.activity.recentEvents.length - 1 && (
                      <Divider sx={{ borderColor: '#4a5568' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Observer Agent */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ backgroundColor: '#10b981', mr: 2 }}>
                  <Psychology />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Observer Agent</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>AI Assistant</Typography>
                </Box>
              </Box>
              <Alert 
                severity="info" 
                sx={{ 
                  backgroundColor: '#1e40af20', 
                  border: '1px solid #3b82f6',
                  color: 'white',
                  mb: 2
                }}
              >
                <Typography variant="body2">
                  Welcome to your Promethios dashboard! I'm here to help you navigate AI governance and provide guidance.
                </Typography>
              </Alert>
              <Box sx={{ backgroundColor: '#1a202c', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#3182ce', fontWeight: 'bold' }}>
                  Governance Tip
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  Regular compliance checks help maintain high governance scores.
                </Typography>
              </Box>
              <Box sx={{ backgroundColor: '#1a202c', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                  Suggested Action
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  Review your agent policies to ensure they meet current standards.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;

