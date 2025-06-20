import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Divider,
  Badge,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  CloudUpload,
  Refresh,
  MoreVert,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  Error,
  Launch,
  Settings,
  Visibility,
  Stop,
  PlayArrow,
  Assessment,
  Security,
  Speed,
  Api,
  Cloud,
  Build,
  MonitorHeart,
  Timeline,
  AttachMoney,
  Shield,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';

interface DeployedAgent {
  id: string;
  name: string;
  type: 'external' | 'foundry';
  status: 'running' | 'stopped' | 'error' | 'deploying';
  endpoint?: string;
  provider?: string;
  deployedAt: Date;
  lastActivity: Date;
  metrics: {
    uptime: number;
    responseTime: number;
    successRate: number;
    requestsToday: number;
    governanceScore: number;
  };
  governance: {
    policy: string;
    violations: number;
    lastCheck: Date;
  };
  billing: {
    costToday: number;
    requestsIncluded: number;
    overageRate: number;
  };
}

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
      id={`deploy-tabpanel-${index}`}
      aria-labelledby={`deploy-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DeployedAgentCard: React.FC<{ agent: DeployedAgent }> = ({ agent }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#10b981';
      case 'stopped': return '#6b7280';
      case 'error': return '#ef4444';
      case 'deploying': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />;
      case 'stopped': return <Stop sx={{ color: '#6b7280', fontSize: 16 }} />;
      case 'error': return <Error sx={{ color: '#ef4444', fontSize: 16 }} />;
      case 'deploying': return <CloudUpload sx={{ color: '#f59e0b', fontSize: 16 }} />;
      default: return <Stop sx={{ color: '#6b7280', fontSize: 16 }} />;
    }
  };

  return (
    <Card sx={{ 
      backgroundColor: '#2d3748', 
      color: 'white',
      border: '1px solid #4a5568',
      borderRadius: '12px',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: '#718096',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {agent.name}
              </Typography>
              {agent.type === 'foundry' && (
                <Chip 
                  label="Beta" 
                  size="small" 
                  sx={{ 
                    backgroundColor: '#f59e0b', 
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                  }} 
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getStatusIcon(agent.status)}
              <Typography variant="body2" sx={{ 
                color: getStatusColor(agent.status),
                textTransform: 'capitalize',
                fontWeight: 500
              }}>
                {agent.status}
              </Typography>
              <Chip 
                label={agent.type === 'external' ? 'External Wrapped' : 'Foundry Built'}
                size="small"
                sx={{ 
                  backgroundColor: agent.type === 'external' ? '#1e40af' : '#7c3aed',
                  color: 'white',
                  fontSize: '0.75rem',
                  height: 20
                }}
              />
            </Box>
          </Box>
          <IconButton sx={{ color: '#a0aec0' }}>
            <MoreVert />
          </IconButton>
        </Box>

        {/* Metrics Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#1a202c', borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                Uptime
              </Typography>
              <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 600 }}>
                {agent.metrics.uptime}%
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#1a202c', borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                Response Time
              </Typography>
              <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                {agent.metrics.responseTime}ms
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#1a202c', borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                Success Rate
              </Typography>
              <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 600 }}>
                {agent.metrics.successRate}%
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#1a202c', borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                Requests Today
              </Typography>
              <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                {agent.metrics.requestsToday.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Governance & Billing */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
            Governance & Billing
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Policy: {agent.governance.policy}
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Cost Today: ${agent.billing.costToday.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ 
              color: agent.governance.violations > 0 ? '#ef4444' : '#10b981' 
            }}>
              Violations: {agent.governance.violations}
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Score: {agent.metrics.governanceScore}/100
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            sx={{
              borderColor: '#4a5568',
              color: '#a0aec0',
              '&:hover': { borderColor: '#718096', backgroundColor: '#374151' },
            }}
          >
            Monitor
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Settings />}
            sx={{
              borderColor: '#4a5568',
              color: '#a0aec0',
              '&:hover': { borderColor: '#718096', backgroundColor: '#374151' },
            }}
          >
            Configure
          </Button>
          {agent.status === 'running' ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Stop />}
              sx={{
                borderColor: '#ef4444',
                color: '#ef4444',
                '&:hover': { borderColor: '#dc2626', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
              }}
            >
              Stop
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlayArrow />}
              sx={{
                borderColor: '#10b981',
                color: '#10b981',
                '&:hover': { borderColor: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
              }}
            >
              Start
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const DeployPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [deployedAgents, setDeployedAgents] = useState<DeployedAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data loading
    const loadDeployedAgents = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockDeployedAgents: DeployedAgent[] = [
        {
          id: 'deployed-1',
          name: 'Customer Support Assistant',
          type: 'external',
          status: 'running',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          provider: 'OpenAI',
          deployedAt: new Date('2024-06-10'),
          lastActivity: new Date(),
          metrics: {
            uptime: 99.8,
            responseTime: 245,
            successRate: 98.5,
            requestsToday: 1247,
            governanceScore: 94
          },
          governance: {
            policy: 'HIPAA Strict',
            violations: 0,
            lastCheck: new Date()
          },
          billing: {
            costToday: 24.67,
            requestsIncluded: 1000,
            overageRate: 0.02
          }
        },
        {
          id: 'deployed-2',
          name: 'Financial Analysis Bot',
          type: 'external',
          status: 'running',
          endpoint: 'https://api.anthropic.com/v1/messages',
          provider: 'Anthropic',
          deployedAt: new Date('2024-06-12'),
          lastActivity: new Date(),
          metrics: {
            uptime: 99.2,
            responseTime: 189,
            successRate: 99.1,
            requestsToday: 892,
            governanceScore: 97
          },
          governance: {
            policy: 'Financial Services',
            violations: 1,
            lastCheck: new Date()
          },
          billing: {
            costToday: 18.43,
            requestsIncluded: 500,
            overageRate: 0.025
          }
        },
        {
          id: 'deployed-3',
          name: 'Content Generator Pro',
          type: 'foundry',
          status: 'deploying',
          deployedAt: new Date('2024-06-15'),
          lastActivity: new Date(),
          metrics: {
            uptime: 0,
            responseTime: 0,
            successRate: 0,
            requestsToday: 0,
            governanceScore: 100
          },
          governance: {
            policy: 'General Business',
            violations: 0,
            lastCheck: new Date()
          },
          billing: {
            costToday: 0,
            requestsIncluded: 1000,
            overageRate: 0.015
          }
        },
        {
          id: 'deployed-4',
          name: 'Data Analysis Assistant',
          type: 'external',
          status: 'error',
          endpoint: 'https://custom-api.company.com/agent',
          provider: 'Custom',
          deployedAt: new Date('2024-06-08'),
          lastActivity: new Date('2024-06-14'),
          metrics: {
            uptime: 87.3,
            responseTime: 0,
            successRate: 0,
            requestsToday: 0,
            governanceScore: 76
          },
          governance: {
            policy: 'General Business',
            violations: 3,
            lastCheck: new Date()
          },
          billing: {
            costToday: 0,
            requestsIncluded: 2000,
            overageRate: 0.01
          }
        }
      ];

      setDeployedAgents(mockDeployedAgents);
      setLoading(false);
    };

    loadDeployedAgents();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const externalAgents = deployedAgents.filter(agent => agent.type === 'external');
  const foundryAgents = deployedAgents.filter(agent => agent.type === 'foundry');

  const totalRequests = deployedAgents.reduce((sum, agent) => sum + agent.metrics.requestsToday, 0);
  const totalCost = deployedAgents.reduce((sum, agent) => sum + agent.billing.costToday, 0);
  const avgUptime = deployedAgents.length > 0 
    ? deployedAgents.reduce((sum, agent) => sum + agent.metrics.uptime, 0) / deployedAgents.length 
    : 0;
  const runningAgents = deployedAgents.filter(agent => agent.status === 'running').length;

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
          <Container maxWidth="xl">
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <Typography>Loading deployment data...</Typography>
            </Box>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
        <Container maxWidth="xl">
          <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
            Agent Deployments
          </Typography>

          {/* Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 600 }}>
                        {runningAgents}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Running Agents
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ color: '#10b981', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                        {totalRequests.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Requests Today
                      </Typography>
                    </Box>
                    <Assessment sx={{ color: '#3b82f6', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                        ${totalCost.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Cost Today
                      </Typography>
                    </Box>
                    <AttachMoney sx={{ color: '#f59e0b', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 600 }}>
                        {avgUptime.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Avg Uptime
                      </Typography>
                    </Box>
                    <MonitorHeart sx={{ color: '#10b981', fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Deployment Tabs */}
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': { 
                    color: '#a0aec0',
                    '&.Mui-selected': { color: '#3b82f6' }
                  },
                  '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Api />
                      External Wrapped Agents ({externalAgents.length})
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Build />
                      Foundry Built Agents ({foundryAgents.length})
                      <Chip 
                        label="Beta" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#f59e0b', 
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20,
                          ml: 1
                        }} 
                      />
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {externalAgents.length === 0 ? (
                <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <AlertTitle>No External Agents Deployed</AlertTitle>
                  You haven't deployed any external wrapped agents yet. Start by wrapping your existing agents with Promethios governance.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {externalAgents.map((agent) => (
                    <Grid item xs={12} md={6} lg={4} key={agent.id}>
                      <DeployedAgentCard agent={agent} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Alert severity="info" sx={{ backgroundColor: '#7c3aed', color: 'white', mb: 3 }}>
                <AlertTitle>Foundry Built Agents - Beta</AlertTitle>
                Foundry-built agent deployment is currently in beta. These agents are built and hosted entirely within Promethios infrastructure with native governance integration.
              </Alert>
              
              {foundryAgents.length === 0 ? (
                <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <AlertTitle>No Foundry Agents Deployed</AlertTitle>
                  You haven't deployed any Foundry-built agents yet. Create your first agent using the Promethios Foundry to get started.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {foundryAgents.map((agent) => (
                    <Grid item xs={12} md={6} lg={4} key={agent.id}>
                      <DeployedAgentCard agent={agent} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default DeployPage;

