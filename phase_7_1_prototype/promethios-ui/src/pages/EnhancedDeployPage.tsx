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
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  Refresh,
  MoreVert,
  CheckCircle,
  Warning,
  Error,
  Launch,
  Settings,
  Visibility,
  Stop,
  PlayArrow,
  Api,
  Cloud,
  Build,
  MonitorHeart,
  ExpandMore,
  Download,
  ContentCopy,
  Security,
  Speed,
  Assessment,
  Timeline,
  AttachMoney,
  Shield,
  Add,
  Code,
  Storage,
  NetworkCheck,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { enhancedDeploymentService, RealDeploymentResult, DeploymentMethod } from '../modules/agent-wrapping/services/EnhancedDeploymentService';
import { DualAgentWrapperRegistry } from '../modules/agent-wrapping/services/DualAgentWrapperRegistry';
import { MultiAgentSystemRegistry } from '../modules/agent-wrapping/services/MultiAgentSystemRegistry';

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

const RealDeployedAgentCard: React.FC<{ deployment: RealDeploymentResult }> = ({ deployment }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return '#10b981';
      case 'stopped': return '#6b7280';
      case 'failed': return '#ef4444';
      case 'deploying': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed': return <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />;
      case 'stopped': return <Stop sx={{ color: '#6b7280', fontSize: 16 }} />;
      case 'failed': return <Error sx={{ color: '#ef4444', fontSize: 16 }} />;
      case 'deploying': return <CloudUpload sx={{ color: '#f59e0b', fontSize: 16 }} />;
      default: return <Stop sx={{ color: '#6b7280', fontSize: 16 }} />;
    }
  };

  const getDataFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'live': return '#10b981';
      case 'recent': return '#3b82f6';
      case 'stale': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
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
                Agent {deployment.deploymentId.split('-').pop()}
              </Typography>
              <Tooltip title={`Governance Identity: ${deployment.governanceIdentity}`}>
                <Chip 
                  label={deployment.governanceIdentity?.substring(0, 12) + '...'} 
                  size="small" 
                  sx={{ 
                    backgroundColor: '#7c3aed', 
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                  }} 
                />
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getStatusIcon(deployment.status)}
              <Typography variant="body2" sx={{ 
                color: getStatusColor(deployment.status),
                textTransform: 'capitalize',
                fontWeight: 500
              }}>
                {deployment.status}
              </Typography>
              <Chip 
                label={`Reporting: ${deployment.reportingStatus}`}
                size="small"
                sx={{ 
                  backgroundColor: deployment.reportingStatus === 'active' ? '#10b981' : 
                                  deployment.reportingStatus === 'degraded' ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  fontSize: '0.75rem',
                  height: 20
                }}
              />
              <Chip 
                label={`Data: ${deployment.dataFreshness}`}
                size="small"
                sx={{ 
                  backgroundColor: getDataFreshnessColor(deployment.dataFreshness),
                  color: 'white',
                  fontSize: '0.75rem',
                  height: 20
                }}
              />
            </Box>
            
            {/* Real Data Indicators */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Last heartbeat: {deployment.lastHeartbeat ? new Date(deployment.lastHeartbeat).toLocaleTimeString() : 'Never'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                • Violations: {deployment.violationsReported}
              </Typography>
            </Box>
          </Box>
          <IconButton sx={{ color: '#a0aec0' }}>
            <MoreVert />
          </IconButton>
        </Box>

        {/* Real Metrics Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#1a202c', borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                Health Status
              </Typography>
              <Typography variant="h6" sx={{ 
                color: deployment.metrics?.healthStatus === 'healthy' ? '#10b981' : '#ef4444', 
                fontWeight: 600 
              }}>
                {deployment.metrics?.healthStatus || 'Unknown'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#1a202c', borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                Metrics Received
              </Typography>
              <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                {deployment.metricsReceived}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#1a202c', borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                Violations Today
              </Typography>
              <Typography variant="h6" sx={{ 
                color: deployment.violationsReported > 0 ? '#ef4444' : '#10b981', 
                fontWeight: 600 
              }}>
                {deployment.violationsReported}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: '#1a202c', borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                Deployment Time
              </Typography>
              <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                {deployment.metrics?.deploymentTime ? `${Math.round(deployment.metrics.deploymentTime / 1000)}s` : 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Real Endpoint & API Key */}
        {deployment.endpoint && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
              Deployment Details
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Endpoint: {deployment.endpoint}
              </Typography>
              <IconButton size="small" sx={{ color: '#3b82f6' }}>
                <Launch fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                API Key: {deployment.apiKey ? `${deployment.apiKey.substring(0, 20)}...` : 'Not available'}
              </Typography>
              <IconButton size="small" sx={{ color: '#3b82f6' }}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}

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
            View Logs
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Assessment />}
            sx={{
              borderColor: '#4a5568',
              color: '#a0aec0',
              '&:hover': { borderColor: '#718096', backgroundColor: '#374151' },
            }}
          >
            Metrics
          </Button>
          {deployment.status === 'deployed' ? (
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
              Restart
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const DeploymentWizard: React.FC<{ open: boolean; onClose: () => void; onDeploy: (result: RealDeploymentResult) => void }> = ({ 
  open, 
  onClose, 
  onDeploy 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deploymentMethod, setDeploymentMethod] = useState<DeploymentMethod>({ type: 'api_package' });
  const [targetEnvironment, setTargetEnvironment] = useState('production');
  const [targetPlatform, setTargetPlatform] = useState('docker');
  const [isDeploying, setIsDeploying] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [availableMultiAgentSystems, setAvailableMultiAgentSystems] = useState<any[]>([]);
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAvailableAgents();
    }
  }, [open]);

  const loadAvailableAgents = async () => {
    try {
      // Load real agents from registries - no mock data
      const dualWrappers = await DualAgentWrapperRegistry.getDualWrappers(currentUser?.uid || 'anonymous');
      const multiAgentSystems = await MultiAgentSystemRegistry.getMultiAgentSystems(currentUser?.uid || 'anonymous');
      
      setAvailableAgents(dualWrappers.filter(wrapper => wrapper.deploymentWrapper)); // Only agents ready for deployment
      setAvailableMultiAgentSystems(multiAgentSystems.filter(system => system.deploymentSystem)); // Only systems ready for deployment
    } catch (error) {
      console.error('Failed to load available agents:', error);
      toast({
        title: "Error",
        description: "Failed to load available agents for deployment",
        variant: "destructive"
      });
    }
  };

  const handleDeploy = async () => {
    if (!selectedAgent || !currentUser) {
      toast({
        title: "Error",
        description: "Please select an agent and ensure you're logged in",
        variant: "destructive"
      });
      return;
    }

    setIsDeploying(true);

    try {
      // Find selected agent/system
      const selectedWrapper = availableAgents.find(agent => agent.id === selectedAgent) ||
                             availableMultiAgentSystems.find(system => system.id === selectedAgent);

      if (!selectedWrapper) {
        throw new Error('Selected agent not found');
      }

      // Create deployment target
      const target = {
        type: targetPlatform as any,
        environment: targetEnvironment as any,
        platform: deploymentMethod.provider || 'local' as any,
        configuration: {}
      };

      // Create enhanced deployment package
      let enhancedPackage;
      if (availableAgents.find(agent => agent.id === selectedAgent)) {
        // Single agent deployment
        enhancedPackage = await enhancedDeploymentService.createEnhancedSingleAgentPackage(
          selectedWrapper,
          target,
          currentUser.uid,
          deploymentMethod
        );
      } else {
        // Multi-agent system deployment
        enhancedPackage = await enhancedDeploymentService.createEnhancedMultiAgentPackage(
          selectedWrapper,
          target,
          currentUser.uid,
          deploymentMethod
        );
      }

      // Deploy the package
      const deploymentResult = await enhancedDeploymentService.deployEnhancedPackage(
        enhancedPackage.id,
        target,
        deploymentMethod
      );

      toast({
        title: "Deployment Started",
        description: `Agent deployment initiated successfully. Deployment ID: ${deploymentResult.deploymentId}`,
        variant: "default"
      });

      onDeploy(deploymentResult);
      onClose();
      setActiveStep(0);
      setSelectedAgent('');

    } catch (error) {
      console.error('Deployment failed:', error);
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy agent",
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const steps = [
    'Select Agent',
    'Choose Deployment Method',
    'Configure Target',
    'Review & Deploy'
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#2d3748',
          color: 'white',
          border: '1px solid #4a5568'
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', borderBottom: '1px solid #4a5568' }}>
        Deploy Agent
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Select Agent */}
          <Step>
            <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
              Select Agent or Multi-Agent System
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {availableAgents.length === 0 && availableMultiAgentSystems.length === 0 ? (
                  <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                    <AlertTitle>No Agents Ready for Deployment</AlertTitle>
                    Create and configure agents with governance before deploying. 
                    Visit the Agent Wrapping page to create deployment-ready agents.
                  </Alert>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      Select an agent or multi-agent system that's ready for deployment:
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel sx={{ color: '#a0aec0' }}>Agent/System</InputLabel>
                      <Select
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        sx={{ 
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' }
                        }}
                      >
                        {availableAgents.map((agent) => (
                          <MenuItem key={agent.id} value={agent.id}>
                            {agent.metadata.name} (Single Agent)
                          </MenuItem>
                        ))}
                        {availableMultiAgentSystems.map((system) => (
                          <MenuItem key={system.id} value={system.id}>
                            {system.metadata.name} (Multi-Agent System)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}
              </Box>
              <Box>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(1)}
                  disabled={!selectedAgent}
                  sx={{ mr: 1 }}
                >
                  Continue
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Choose Deployment Method */}
          <Step>
            <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
              Choose Deployment Method
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                  How would you like to deploy your agent?
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card 
                      sx={{ 
                        backgroundColor: deploymentMethod.type === 'api_package' ? '#1e40af' : '#374151',
                        border: '1px solid #4a5568',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setDeploymentMethod({ type: 'api_package' })}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Api sx={{ fontSize: 40, color: 'white', mb: 1 }} />
                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                          API Package
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Download deployment package for manual deployment
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card 
                      sx={{ 
                        backgroundColor: deploymentMethod.type === 'integration' ? '#1e40af' : '#374151',
                        border: '1px solid #4a5568',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setDeploymentMethod({ type: 'integration' })}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Cloud sx={{ fontSize: 40, color: 'white', mb: 1 }} />
                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                          Cloud Integration
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Deploy directly via cloud provider integration
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {deploymentMethod.type === 'integration' && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel sx={{ color: '#a0aec0' }}>Cloud Provider</InputLabel>
                    <Select
                      value={deploymentMethod.provider || ''}
                      onChange={(e) => setDeploymentMethod({ ...deploymentMethod, provider: e.target.value as any })}
                      sx={{ 
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' }
                      }}
                    >
                      <MenuItem value="aws">Amazon Web Services</MenuItem>
                      <MenuItem value="gcp">Google Cloud Platform</MenuItem>
                      <MenuItem value="azure">Microsoft Azure</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
              <Box>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(2)}
                  sx={{ mr: 1 }}
                >
                  Continue
                </Button>
                <Button onClick={() => setActiveStep(0)}>
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Configure Target */}
          <Step>
            <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
              Configure Target Environment
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#a0aec0' }}>Environment</InputLabel>
                      <Select
                        value={targetEnvironment}
                        onChange={(e) => setTargetEnvironment(e.target.value)}
                        sx={{ 
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' }
                        }}
                      >
                        <MenuItem value="development">Development</MenuItem>
                        <MenuItem value="staging">Staging</MenuItem>
                        <MenuItem value="production">Production</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#a0aec0' }}>Platform</InputLabel>
                      <Select
                        value={targetPlatform}
                        onChange={(e) => setTargetPlatform(e.target.value)}
                        sx={{ 
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' }
                        }}
                      >
                        <MenuItem value="docker">Docker</MenuItem>
                        <MenuItem value="kubernetes">Kubernetes</MenuItem>
                        <MenuItem value="serverless">Serverless</MenuItem>
                        <MenuItem value="api">API</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(3)}
                  sx={{ mr: 1 }}
                >
                  Continue
                </Button>
                <Button onClick={() => setActiveStep(1)}>
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 4: Review & Deploy */}
          <Step>
            <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
              Review & Deploy
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Deployment Summary
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Build sx={{ color: '#3b82f6' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Agent/System" 
                      secondary={availableAgents.find(a => a.id === selectedAgent)?.metadata.name || 
                                availableMultiAgentSystems.find(s => s.id === selectedAgent)?.metadata.name}
                      sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: '#a0aec0' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Cloud sx={{ color: '#3b82f6' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Deployment Method" 
                      secondary={deploymentMethod.type === 'api_package' ? 'API Package (Manual)' : `Cloud Integration (${deploymentMethod.provider})`}
                      sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: '#a0aec0' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Settings sx={{ color: '#3b82f6' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Target" 
                      secondary={`${targetEnvironment} environment on ${targetPlatform}`}
                      sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: '#a0aec0' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Security sx={{ color: '#10b981' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Governance" 
                      secondary="Embedded governance engine with automatic reporting to Promethios"
                      sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: '#a0aec0' } }}
                    />
                  </ListItem>
                </List>

                <Alert severity="info" sx={{ mt: 2, backgroundColor: '#1e3a8a', color: 'white' }}>
                  <AlertTitle>Deployment Process</AlertTitle>
                  {deploymentMethod.type === 'api_package' 
                    ? 'A deployment package will be created with all necessary artifacts and Promethios reporting configuration. You can then deploy manually using the provided instructions.'
                    : 'The agent will be deployed directly to your selected cloud provider with automatic Promethios integration configured.'
                  }
                </Alert>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  sx={{ mr: 1 }}
                  startIcon={isDeploying ? <CircularProgress size={16} /> : <CloudUpload />}
                >
                  {isDeploying ? 'Deploying...' : 'Deploy Agent'}
                </Button>
                <Button onClick={() => setActiveStep(2)} disabled={isDeploying}>
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
};

const EnhancedDeployPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [realDeployments, setRealDeployments] = useState<RealDeploymentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadRealDeployments();
  }, [currentUser]);

  const loadRealDeployments = async () => {
    if (!currentUser) {
      setRealDeployments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load real deployments - no mock data
      const deployments = await enhancedDeploymentService.listRealDeployments(currentUser.uid);
      setRealDeployments(deployments);
    } catch (error) {
      console.error('Failed to load deployments:', error);
      toast({
        title: "Error",
        description: "Failed to load deployment data",
        variant: "destructive"
      });
      setRealDeployments([]); // Empty array instead of mock data
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRealDeployments();
    setRefreshing(false);
    
    toast({
      title: "Refreshed",
      description: "Deployment data updated",
      variant: "default"
    });
  };

  const handleNewDeployment = (result: RealDeploymentResult) => {
    setRealDeployments(prev => [result, ...prev]);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
              Agent Deployments
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  borderColor: '#4a5568',
                  color: '#a0aec0',
                  '&:hover': { borderColor: '#718096', backgroundColor: '#374151' },
                }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setWizardOpen(true)}
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': { backgroundColor: '#2563eb' },
                }}
              >
                Deploy Agent
              </Button>
            </Stack>
          </Box>
          
          <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
            Monitor and manage your deployed agents with real-time governance data and metrics.
          </Typography>

          {/* Real Data Status */}
          <Alert 
            severity={realDeployments.length > 0 ? "success" : "info"} 
            sx={{ 
              backgroundColor: realDeployments.length > 0 ? '#065f46' : '#1e3a8a', 
              color: 'white',
              mb: 3
            }}
          >
            <AlertTitle>
              {realDeployments.length > 0 ? 'Live Deployment Data' : 'No Deployed Agents'}
            </AlertTitle>
            {realDeployments.length > 0 
              ? `Showing ${realDeployments.length} real deployed agent${realDeployments.length === 1 ? '' : 's'} with live governance monitoring.`
              : 'Deploy agents to see real-time governance metrics and monitoring data here. No mock data is shown.'
            }
          </Alert>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': { color: '#a0aec0' },
              '& .Mui-selected': { color: '#3b82f6' },
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
            }}
          >
            <Tab label="Active Deployments" />
            <Tab label="Deployment History" />
            <Tab label="Performance Analytics" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : realDeployments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CloudUpload sx={{ fontSize: 64, color: '#4a5568', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#a0aec0', mb: 1 }}>
                No Deployed Agents
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
                Deploy your first agent to start monitoring governance metrics and performance.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setWizardOpen(true)}
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': { backgroundColor: '#2563eb' },
                }}
              >
                Deploy Agent
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {realDeployments.map((deployment) => (
                <Grid item xs={12} md={6} lg={4} key={deployment.deploymentId}>
                  <RealDeployedAgentCard deployment={deployment} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Deployment History
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            {realDeployments.length === 0 
              ? 'No deployment history available. Deploy agents to see historical data.'
              : 'Historical deployment data will be shown here as more deployments are created.'
            }
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Performance Analytics
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            {realDeployments.length === 0 
              ? 'No performance data available. Deploy agents to see analytics.'
              : 'Performance analytics and trends will be displayed here based on real deployment data.'
            }
          </Typography>
        </TabPanel>

        {/* Deployment Wizard */}
        <DeploymentWizard 
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onDeploy={handleNewDeployment}
        />
      </Container>
    </ThemeProvider>
  );
};

export default EnhancedDeployPage;

