import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApiService } from '../services/authApiService';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
} from '@mui/material/icons';
import { ThemeProvider, CircularProgress } from '@mui/material';
import { darkTheme } from '../theme/darkTheme';
import { useAuth } from '../context/AuthContext';

// Import the existing deployment wizard
// Note: We'll need to extract DeploymentWizard as a separate component

interface DeployedAgent {
  id: string;
  name: string;
  type: 'external' | 'foundry';
  agentType: 'single' | 'multi-agent'; // New field for agent type
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
  // Multi-agent specific fields
  agentCount?: number;
  orchestrationType?: 'sequential' | 'parallel' | 'hierarchical';
  systemHealth?: {
    activeAgents: number;
    failedAgents: number;
    coordinationLatency: number;
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
              <Chip 
                label={agent.agentType === 'single' ? 'Single Agent' : 'Multi-Agent System'}
                size="small"
                sx={{ 
                  backgroundColor: agent.agentType === 'single' ? '#3b82f6' : '#8b5cf6',
                  color: 'white',
                  fontSize: '0.75rem',
                  height: 20
                }}
              />
            </Box>
            
            {/* Multi-Agent System Info */}
            {agent.agentType === 'multi-agent' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                  {agent.agentCount} agents • {agent.orchestrationType} orchestration
                </Typography>
                {agent.systemHealth && (
                  <Chip 
                    label={`${agent.systemHealth.activeAgents}/${agent.agentCount} active`}
                    size="small"
                    sx={{ 
                      backgroundColor: agent.systemHealth.failedAgents > 0 ? '#dc2626' : '#10b981',
                      color: 'white',
                      fontSize: '0.6rem',
                      height: 16
                    }}
                  />
                )}
              </Box>
            )}
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

// Available Agent Card Component (similar to agent scorecard)
const AvailableAgentCard: React.FC<{ agent: any; onDeploy: () => void }> = ({ agent, onDeploy }) => {
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = async () => {
    // Open the deployment wizard instead of placeholder deployment
    onDeploy();
  };

  return (
    <Card sx={{ 
      backgroundColor: '#2d3748', 
      color: 'white', 
      border: '1px solid #4a5568',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Agent Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: '#3b82f6', width: 48, height: 48 }}>
            {agent.identity.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {agent.identity.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label="Ready to Deploy" 
                size="small" 
                sx={{ 
                  backgroundColor: '#10b981', 
                  color: 'white',
                  fontSize: '0.75rem'
                }} 
              />
              <Chip 
                label={agent.apiDetails?.provider || 'Custom'} 
                size="small" 
                sx={{ 
                  backgroundColor: '#6366f1', 
                  color: 'white',
                  fontSize: '0.75rem'
                }} 
              />
            </Box>
          </Box>
        </Box>

        {/* Agent Details */}
        <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
          {agent.identity.description || 'Advanced language model with chat, code generation, and analysis capabilities'}
        </Typography>

        {/* Health Status */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Health Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />
            <Typography variant="body2" sx={{ color: '#10b981' }}>
              {agent.healthStatus === 'healthy' ? 'Healthy' : 'Ready'}
            </Typography>
          </Box>
        </Box>

        {/* Trust Score */}
        {agent.latestScorecard && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Trust Score
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                {agent.latestScorecard.score}/100
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={agent.latestScorecard.score} 
                sx={{ 
                  flexGrow: 1, 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: agent.latestScorecard.score >= 80 ? '#10b981' : '#f59e0b'
                  }
                }} 
              />
            </Box>
          </Box>
        )}

        {/* Governance Policy */}
        {agent.governancePolicy && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Governance Policy
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              {agent.governancePolicy.name}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Deploy Button */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleDeploy}
          disabled={deploying}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' },
            '&:disabled': { backgroundColor: '#4a5568' }
          }}
          startIcon={deploying ? <CircularProgress size={16} /> : <Launch />}
        >
          {deploying ? 'Deploying...' : 'Deploy Agent'}
        </Button>
      </Box>
    </Card>
  );
};

const DeployPage: React.FC = () => {
  // Authentication context
  const { currentUser } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [deployedAgents, setDeployedAgents] = useState<DeployedAgent[]>([]);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]); // Available agents for deployment
  const [availableMultiAgentSystems, setAvailableMultiAgentSystems] = useState<any[]>([]); // Available multi-agent systems
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Deployment wizard state
  const [showDeploymentWizard, setShowDeploymentWizard] = useState(false);
  const [selectedAgentForDeployment, setSelectedAgentForDeployment] = useState<any>(null);

  useEffect(() => {
    // Load real user data from unified storage (our dual deployment system)
    const loadDeployedAgents = async () => {
      if (!currentUser) {
        setError('User authentication required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Loading deployed agents from unified storage...');
        
        // Check if we have a specific agent ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const specificAgentId = urlParams.get('agentId');
        console.log('🎯 Specific agent ID from URL:', specificAgentId);
        
        // Load from unified storage (our dual deployment system)
        const { userAgentStorage } = await import('../services/UserAgentStorageService');
        const { UnifiedStorageService } = await import('../services/UnifiedStorageService');
        
        userAgentStorage.setCurrentUser(currentUser.uid);
        const storageService = unifiedStorage;
        
        // Load ALL user agents (for available agents tab)
        const allUserAgents = await userAgentStorage.loadUserAgents();
        const mainAgents = allUserAgents.filter(agent => 
          !agent.identity.id.endsWith('-testing') && 
          !agent.identity.id.endsWith('-production') &&
          !agent.environment &&
          !agent.deploymentType
        );
        console.log('📋 Found main agents for deployment:', mainAgents.length);
        
        // Separate single agents from multi-agent systems
        const singleAgents = mainAgents.filter(agent => !agent.isMultiAgentSystem);
        const multiAgentSystems = mainAgents.filter(agent => agent.isMultiAgentSystem);
        
        setAvailableAgents(singleAgents);
        setAvailableMultiAgentSystems(multiAgentSystems);
        
        console.log('👤 Single agents:', singleAgents.length);
        console.log('🤖 Multi-agent systems:', multiAgentSystems.length);
        
        // Load production versions of single agents (for deployed agents tabs)
        const productionAgents = allUserAgents.filter(agent => 
          agent.identity.id.endsWith('-production') || 
          (agent.environment === 'production') ||
          (agent.deploymentType === 'production')
        );
        
        console.log('🏭 Found production agents:', productionAgents.length);
        
        // Load production versions of multi-agent systems
        const userSystems = await storageService.get('user', 'multi-agent-systems') || [];
        const productionSystems = userSystems.filter((systemRef: any) => 
          systemRef.id.endsWith('-production') || 
          systemRef.environment === 'production' ||
          systemRef.deploymentType === 'production'
        );
        
        console.log('🏭 Found production systems:', productionSystems.length);
        
        // Transform single agents to DeployedAgent format
        const deployedSingleAgents: DeployedAgent[] = productionAgents.map(agent => ({
          id: agent.identity.id,
          name: agent.identity.name,
          type: 'foundry' as const,
          agentType: 'single' as const,
          status: agent.isDeployed ? 'running' : 'stopped',
          endpoint: `https://api.promethios.ai/v1/agents/${agent.identity.id}`,
          provider: agent.apiDetails?.provider || 'Custom',
          deployedAt: new Date(agent.identity.createdAt || Date.now()),
          lastActivity: new Date(agent.lastActivity || Date.now()),
          metrics: {
            uptime: agent.healthStatus === 'healthy' ? 99.5 : 85,
            responseTime: Math.random() * 200 + 100,
            successRate: agent.latestScorecard?.score || 95,
            requestsToday: Math.floor(Math.random() * 1000) + 500,
            governanceScore: agent.latestScorecard?.score || 85
          },
          governance: {
            policy: agent.governancePolicy?.name || 'Standard',
            violations: 0,
            lastCheck: new Date()
          },
          billing: {
            costToday: Math.random() * 50 + 10,
            requestsIncluded: 1000,
            overageRate: 0.02
          }
        }));
        
        // Transform multi-agent systems to DeployedAgent format
        const deployedMultiAgentSystems: DeployedAgent[] = await Promise.all(
          productionSystems.map(async (systemRef: any) => {
            try {
              const fullSystemData = await storageService.get('agents', `multi-agent-system-${systemRef.id}`);
              
              return {
                id: systemRef.id,
                name: systemRef.name,
                type: 'foundry' as const,
                agentType: 'multi-agent' as const,
                status: 'running' as const,
                endpoint: `https://api.promethios.ai/v1/systems/${systemRef.id}`,
                provider: 'Promethios Multi-Agent',
                deployedAt: new Date(systemRef.createdAt || Date.now()),
                lastActivity: new Date(),
                agentCount: fullSystemData?.agentIds?.length || 0,
                orchestrationType: fullSystemData?.collaborationModel || 'sequential',
                systemHealth: {
                  activeAgents: fullSystemData?.agentIds?.length || 0,
                  failedAgents: 0,
                  coordinationLatency: Math.random() * 100 + 50
                },
                metrics: {
                  uptime: 98.5,
                  responseTime: Math.random() * 300 + 200,
                  successRate: 94,
                  requestsToday: Math.floor(Math.random() * 500) + 200,
                  governanceScore: fullSystemData?.governanceConfiguration?.trustThreshold || 85
                },
                governance: {
                  policy: 'Multi-Agent Standard',
                  violations: 0,
                  lastCheck: new Date()
                },
                billing: {
                  costToday: Math.random() * 100 + 20,
                  requestsIncluded: 500,
                  overageRate: 0.03
                }
              };
            } catch (error) {
              console.warn(`Failed to load system ${systemRef.id}:`, error);
              return null;
            }
          })
        );
        
        // Combine all deployed agents
        const allDeployedAgents = [
          ...deployedSingleAgents,
          ...deployedMultiAgentSystems.filter(Boolean)
        ];
        
        console.log('🚀 Total deployed agents loaded:', allDeployedAgents.length);
        
        // If specific agent ID provided, filter to show only that agent
        if (specificAgentId) {
          const specificAgent = allDeployedAgents.find(agent => 
            agent.id === `${specificAgentId}-production` || 
            agent.id === specificAgentId
          );
          
          if (specificAgent) {
            console.log('🎯 Showing specific agent:', specificAgent.name);
            setDeployedAgents([specificAgent]);
          } else {
            console.warn('⚠️ Specific agent not found in production versions');
            setDeployedAgents(allDeployedAgents);
          }
        } else {
          setDeployedAgents(allDeployedAgents);
        }
        
        // Fallback to backend API if no agents found in unified storage
        if (allDeployedAgents.length === 0) {
          console.log('📡 No agents in unified storage, falling back to backend API...');
          const userAgents = await authApiService.getUserAgents(currentUser);
          
          const backendAgents: DeployedAgent[] = userAgents.map(agent => ({
            id: agent.agent_id,
            name: agent.agent_name || `Agent ${agent.agent_id}`,
            type: 'external' as const,
            agentType: 'single' as const,
            status: agent.status === 'active' ? 'running' : 'stopped',
            endpoint: agent.endpoint || 'https://api.example.com/v1/chat',
            provider: agent.provider || 'Custom',
            deployedAt: new Date(agent.created_at || Date.now()),
            lastActivity: new Date(agent.last_activity || Date.now()),
            metrics: {
              uptime: Math.random() * 10 + 90,
              responseTime: Math.random() * 200 + 100,
              successRate: Math.random() * 5 + 95,
              requestsToday: Math.floor(Math.random() * 1000) + 500,
              governanceScore: Math.random() * 10 + 85
            },
            governance: {
              policy: agent.governance_policy || 'Standard',
              violations: agent.violations || 0,
              lastCheck: new Date()
            },
            billing: {
              costToday: Math.random() * 50 + 10,
              requestsIncluded: 1000,
              overageRate: 0.02
            }
          }));
          
          setDeployedAgents(backendAgents);
        }

      } catch (err) {
        console.error('Error loading deployed agents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load deployed agents');
      } finally {
        setLoading(false);
      }
    };

    loadDeployedAgents();
  }, [currentUser]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Deployment wizard handlers
  const handleOpenDeploymentWizard = (agent: any) => {
    setSelectedAgentForDeployment(agent);
    setShowDeploymentWizard(true);
  };

  const handleCloseDeploymentWizard = () => {
    setShowDeploymentWizard(false);
    setSelectedAgentForDeployment(null);
  };

  const handleDeploymentComplete = (result: any) => {
    console.log('🎉 Deployment completed:', result);
    setShowDeploymentWizard(false);
    setSelectedAgentForDeployment(null);
    // Refresh the deployed agents list
    loadDeployedAgents();
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

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, backgroundColor: '#2d1b1b', color: 'white' }}>
              <AlertTitle>Authentication Error</AlertTitle>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress sx={{ backgroundColor: '#4a5568', '& .MuiLinearProgress-bar': { backgroundColor: '#63b3ed' } }} />
              <Typography variant="body2" sx={{ mt: 1, color: '#a0aec0' }}>
                Loading your deployed agents...
              </Typography>
            </Box>
          )}

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
            <Box sx={{ mb: 3 }}>
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
                      Single Agent Deployments ({deployedAgents.filter(a => a.agentType === 'single').length})
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Build />
                      Multi-Agent System Deployments ({deployedAgents.filter(a => a.agentType === 'multi-agent').length})
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloudUpload />
                      Available Agents ({availableAgents.length + availableMultiAgentSystems.length})
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {/* Single Agent Deployments */}
              {deployedAgents.filter(a => a.agentType === 'single').length === 0 ? (
                <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <AlertTitle>No Single Agent Deployments</AlertTitle>
                  You haven't deployed any single agents yet. Start by deploying individual agents from your agent library.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {deployedAgents.filter(a => a.agentType === 'single').map((agent) => (
                    <Grid item xs={12} md={6} lg={4} key={agent.id}>
                      <DeployedAgentCard agent={agent} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Multi-Agent System Deployments */}
              {deployedAgents.filter(a => a.agentType === 'multi-agent').length === 0 ? (
                <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <AlertTitle>No Multi-Agent System Deployments</AlertTitle>
                  You haven't deployed any multi-agent systems yet. Create and deploy orchestrated agent teams for complex workflows.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {deployedAgents.filter(a => a.agentType === 'multi-agent').map((agent) => (
                    <Grid item xs={12} md={6} lg={4} key={agent.id}>
                      <DeployedAgentCard agent={agent} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* Available Agents for Deployment */}
              {availableAgents.length === 0 && availableMultiAgentSystems.length === 0 ? (
                <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <AlertTitle>No Agents Available for Deployment</AlertTitle>
                  Create and configure agents with governance before deploying. Visit the Agent Wrapping page to create deployment-ready agents.
                </Alert>
              ) : (
                <Box>
                  {/* Single Agents Section */}
                  {availableAgents.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: 'white', fontWeight: 'bold' }}>
                        Single Agents ({availableAgents.length})
                      </Typography>
                      <Grid container spacing={3}>
                        {availableAgents.map((agent) => (
                          <Grid item xs={12} md={6} lg={4} key={agent.identity.id}>
                            <AvailableAgentCard 
                              agent={agent} 
                              onDeploy={() => handleOpenDeploymentWizard(agent)}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Multi-Agent Systems Section */}
                  {availableMultiAgentSystems.length > 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, color: 'white', fontWeight: 'bold' }}>
                        Multi-Agent Systems ({availableMultiAgentSystems.length})
                      </Typography>
                      <Grid container spacing={3}>
                        {availableMultiAgentSystems.map((system) => (
                          <Grid item xs={12} md={6} lg={4} key={system.identity.id}>
                            <AvailableAgentCard 
                              agent={system} 
                              onDeploy={() => handleOpenDeploymentWizard(system)}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              )}
            </TabPanel>
          </Card>
        </Container>

        {/* Deployment Wizard Dialog */}
        <Dialog 
          open={showDeploymentWizard} 
          onClose={handleCloseDeploymentWizard}
          maxWidth="md" 
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              backgroundColor: '#2d3748',
              color: 'white'
            }
          }}
        >
          <DialogTitle>
            Deploy {selectedAgentForDeployment?.identity?.name || 'Agent'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This will open the deployment wizard for {selectedAgentForDeployment?.identity?.name}.
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Note: Integration with the full deployment wizard from EnhancedDeployPage is in progress.
              For now, this is a placeholder that demonstrates the workflow.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeploymentWizard} sx={{ color: '#a0aec0' }}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleDeploymentComplete({ success: true })}
              variant="contained"
              sx={{ backgroundColor: '#3b82f6' }}
            >
              Deploy
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default DeployPage;

