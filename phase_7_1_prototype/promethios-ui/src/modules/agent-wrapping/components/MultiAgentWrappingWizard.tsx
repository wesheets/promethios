import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Alert,
  AlertTitle,
  Divider,
  IconButton,
  Tooltip,
  Autocomplete,
  FormControlLabel,
  Switch,
  Slider,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Chat,
  Dashboard,
  Assessment,
  Rocket,
  Add,
  DragIndicator,
  PlayArrow,
  Pause,
  Stop,
  Settings,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useAgentWrappers } from '../hooks/useAgentWrappers';
import { useMultiAgentSystems } from '../hooks/useMultiAgentSystems';
import { MultiAgentSystem, AgentRole, AgentConnection, FlowType } from '../types/multiAgent';

// Enhanced Success component with system scorecard and governance details
const SuccessStep: React.FC<{ systemId: string | null }> = ({ systemId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [systemScorecard, setSystemScorecard] = useState<any>(null);
  const [systemAttestations, setSystemAttestations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (systemId) {
      setupSystemGovernance();
    }
  }, [systemId]);

  const setupSystemGovernance = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock system governance setup (would integrate with actual services)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate setup time

      // Mock system scorecard data
      const mockScorecard = {
        overallScore: 87,
        workflowEfficiency: 85,
        crossAgentTrust: 88,
        coordinationScore: 92,
        systemCompliance: 94
      };

      // Mock attestations
      const mockAttestations = [
        { type: 'workflow_compliance', status: 'verified' },
        { type: 'data_flow_validation', status: 'verified' },
        { type: 'cross_agent_security', status: 'verified' }
      ];

      setSystemScorecard(mockScorecard);
      setSystemAttestations(mockAttestations);
      setSetupComplete(true);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to set up system governance. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h5" gutterBottom>
          Setting up multi-agent system governance...
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Creating system identity, scorecard, and attestations
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Setup Error</AlertTitle>
          {error}
        </Alert>
        <Button variant="contained" onClick={setupSystemGovernance}>
          Retry Setup
        </Button>
      </Box>
    );
  }

  return (
    <Box py={6} px={4}>
      <Box textAlign="center" mb={6}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Multi-Agent System Successfully Created
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          Your multi-agent system is now wrapped with governance controls
        </Typography>
        {systemId && (
          <Chip 
            label={`System ID: ${systemId}`} 
            variant="outlined" 
            sx={{ mb: 4 }}
          />
        )}
        {setupComplete && (
          <Chip 
            label="✅ Complete Setup: System identity created, scorecard assigned, and attestations added" 
            color="success" 
            sx={{ mb: 4 }}
          />
        )}
      </Box>

      {/* System Scorecard Preview */}
      {systemScorecard && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom align="center">
              System Governance Scorecard
            </Typography>
          </Grid>
          
          {/* Overall Score */}
          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h3" color="primary" gutterBottom>
                {systemScorecard.overallScore}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Score
              </Typography>
            </Card>
          </Grid>

          {/* System Metrics */}
          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {systemScorecard.workflowEfficiency}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Workflow Efficiency
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="info.main" gutterBottom>
                {systemScorecard.crossAgentTrust}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cross-Agent Trust
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="secondary.main" gutterBottom>
                {systemScorecard.coordinationScore}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Coordination Score
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Governance Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Governance Summary
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Attestations Added:</Typography>
                <Chip 
                  label={`${systemAttestations.length} attestations`} 
                  size="small" 
                  color="success"
                />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Governance Profile:</Typography>
                <Chip label="Enhanced Level" size="small" color="primary" />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Monitoring Status:</Typography>
                <Chip label="Active monitoring enabled" size="small" color="info" />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">System Compliance:</Typography>
                <Chip 
                  label={`${systemScorecard?.systemCompliance || 94}%`} 
                  size="small" 
                  color="success" 
                />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Next Steps
            </Typography>
            <Stack spacing={2}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Your multi-agent system is ready for testing</AlertTitle>
                Check system scorecard in 24 hours for updated metrics based on actual usage.
              </Alert>
              <Typography variant="body2" color="text.secondary">
                <strong>Immediate Actions:</strong>
              </Typography>
              <Typography variant="body2">
                • Test your multi-agent system in the chat interface
              </Typography>
              <Typography variant="body2">
                • Monitor governance metrics and compliance
              </Typography>
              <Typography variant="body2">
                • Review individual agent performance within the system
              </Typography>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box maxWidth={600} mx="auto">
        <Typography variant="h6" gutterBottom align="center">
          What You Can Do Next
        </Typography>
        
        <Stack spacing={2}>
          <Button 
            variant="contained" 
            startIcon={<Chat />}
            fullWidth
            size="large"
          >
            Chat with your multi-agent system
          </Button>
          
          <Button 
            variant="contained" 
            color="secondary"
            startIcon={<Assessment />}
            fullWidth
            size="large"
          >
            View full system scorecard
          </Button>
          
          <Button 
            variant="contained" 
            color="info"
            startIcon={<Dashboard />}
            fullWidth
            size="large"
          >
            View system dashboard
          </Button>
          
          <Button 
            variant="contained" 
            color="success"
            startIcon={<Rocket />}
            fullWidth
            size="large"
          >
            Deploy multi-agent system
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<Add />}
            fullWidth
            size="large"
          >
            Create another multi-agent system
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

// Steps for the wizard
const steps = [
  'Basic Info',
  'Collaboration Model',
  'Agent Selection', 
  'System Type & Flow',
  'Governance Configuration',
  'Testing & Validation',
  'Review & Deploy'
];

// Demo multi-agent team templates for quick setup
const DEMO_TEAM_TEMPLATES = [
  {
    id: 'customer-support-pipeline',
    name: 'Customer Support Pipeline',
    description: 'A sequential workflow for handling customer inquiries with sentiment analysis and response generation.',
    systemType: 'sequential' as FlowType,
    agentIds: ['helpful-assistant-demo', 'business-analyst-demo'],
    agentRoles: {
      'helpful-assistant-demo': 'coordinator' as AgentRole,
      'business-analyst-demo': 'specialist' as AgentRole
    },
    governanceRules: {
      crossAgentValidation: true,
      errorHandling: 'fallback' as const,
      loggingLevel: 'standard' as const,
      governancePolicy: 'standard' as const,
      maxExecutionTime: 300,
      rateLimiting: { requestsPerMinute: 60, burstLimit: 10 }
    },
    color: '#2196f3'
  },
  {
    id: 'code-review-team',
    name: 'Code Review Team',
    description: 'A collaborative team for code generation, review, and documentation with parallel processing.',
    systemType: 'parallel' as FlowType,
    agentIds: ['code-specialist-demo', 'helpful-assistant-demo'],
    agentRoles: {
      'code-specialist-demo': 'specialist' as AgentRole,
      'helpful-assistant-demo': 'validator' as AgentRole
    },
    governanceRules: {
      crossAgentValidation: true,
      errorHandling: 'retry' as const,
      loggingLevel: 'detailed' as const,
      governancePolicy: 'strict' as const,
      maxExecutionTime: 600,
      rateLimiting: { requestsPerMinute: 30, burstLimit: 5 }
    },
    color: '#9c27b0'
  },
  {
    id: 'business-analysis-consensus',
    name: 'Business Analysis Consensus',
    description: 'A consensus-driven team for strategic business analysis and decision making.',
    systemType: 'consensus' as FlowType,
    agentIds: ['business-analyst-demo', 'helpful-assistant-demo'],
    agentRoles: {
      'business-analyst-demo': 'specialist' as AgentRole,
      'helpful-assistant-demo': 'coordinator' as AgentRole
    },
    governanceRules: {
      crossAgentValidation: true,
      errorHandling: 'fallback' as const,
      loggingLevel: 'standard' as const,
      governancePolicy: 'standard' as const,
      maxExecutionTime: 450,
      rateLimiting: { requestsPerMinute: 45, burstLimit: 8 }
    },
    color: '#ff9800'
  }
];

const MultiAgentWrappingWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { createSystem } = useMultiAgentSystems();
  
  // Check for ad hoc configuration from sessionStorage
  const [isFromAdHoc, setIsFromAdHoc] = useState(false);
  const [adHocConfig, setAdHocConfig] = useState<any>(null);
  
  // System configuration state
  const [systemName, setSystemName] = useState('');
  const [systemDescription, setSystemDescription] = useState('');
  const [systemType, setSystemType] = useState<FlowType>('sequential');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentRoles, setAgentRoles] = useState<{ [agentId: string]: AgentRole }>({});
  const [connections, setConnections] = useState<AgentConnection[]>([]);
  const [governanceRules, setGovernanceRules] = useState<MultiAgentSystem['governanceRules']>({
    crossAgentValidation: true,
    errorHandling: 'fallback',
    loggingLevel: 'standard',
    governancePolicy: 'standard',
    maxExecutionTime: 300,
    rateLimiting: {
      requestsPerMinute: 60,
      burstLimit: 10
    }
  });
  
  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [createdSystemId, setCreatedSystemId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const { agentWrappers, loading: loadingAgents } = useAgentWrappers();

  // Load ad hoc configuration if coming from chat
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromAdHoc = urlParams.get('fromAdHoc') === 'true';
    
    if (fromAdHoc) {
      const storedConfig = sessionStorage.getItem('adHocSystemConfig');
      if (storedConfig) {
        try {
          const config = JSON.parse(storedConfig);
          setIsFromAdHoc(true);
          setAdHocConfig(config);
          
          // Pre-populate form fields
          setSystemName(config.name || '');
          setSystemDescription(config.description || '');
          setSystemType(config.systemType || 'sequential');
          setSelectedAgents(config.agentIds || []);
          setAgentRoles(config.agentRoles || {});
          setGovernanceRules(config.governanceRules || governanceRules);
          
          // Clear the stored config
          sessionStorage.removeItem('adHocSystemConfig');
        } catch (error) {
          console.error('Failed to load ad hoc configuration:', error);
        }
      }
    }
  }, []);

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Create the system
      await handleCreateSystem();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCreateSystem = async () => {
    try {
      setIsCreating(true);
      
      const systemData: Partial<MultiAgentSystem> = {
        name: systemName,
        description: systemDescription,
        systemType,
        agentIds: selectedAgents,
        agentRoles,
        connections,
        governanceRules,
        status: 'active'
      };

      const systemId = await createSystem(systemData);
      setCreatedSystemId(systemId);
      setIsComplete(true);
      setActiveStep(steps.length); // Move to success step
    } catch (error) {
      console.error('Failed to create system:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return systemName.trim() && systemDescription.trim() && systemType;
      case 1:
        return selectedAgents.length > 0;
      case 2:
        return true; // Flow configuration is optional
      case 3:
        return true; // Governance rules have defaults
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  const updateRule = (key: string, value: any) => {
    setGovernanceRules(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateRateLimiting = (key: string, value: number) => {
    setGovernanceRules(prev => ({
      ...prev,
      rateLimiting: {
        ...prev.rateLimiting,
        [key]: value
      }
    }));
  };

  const renderStepContent = (step: number) => {
    if (isComplete) {
      return <SuccessStep systemId={createdSystemId} />;
    }

    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Basic System Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="System Name"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={systemDescription}
                  onChange={(e) => setSystemDescription(e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>System Type</InputLabel>
                  <Select
                    value={systemType}
                    label="System Type"
                    onChange={(e) => setSystemType(e.target.value as FlowType)}
                  >
                    <MenuItem value="sequential">Sequential</MenuItem>
                    <MenuItem value="parallel">Parallel</MenuItem>
                    <MenuItem value="conditional">Conditional</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Agents
            </Typography>
            {loadingAgents ? (
              <Box textAlign="center" py={4}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Loading your wrapped agents...
                </Typography>
              </Box>
            ) : agentWrappers.length === 0 ? (
              <Alert severity="info">
                <AlertTitle>No Wrapped Agents Found</AlertTitle>
                You need to wrap individual agents before creating multi-agent systems.
                <Button variant="contained" sx={{ mt: 2 }}>
                  Wrap Your First Agent
                </Button>
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {agentWrappers.map((agent) => (
                  <Grid item xs={12} md={6} key={agent.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedAgents.includes(agent.id) ? 2 : 1,
                        borderColor: selectedAgents.includes(agent.id) ? 'primary.main' : 'divider'
                      }}
                      onClick={() => {
                        setSelectedAgents(prev => 
                          prev.includes(agent.id) 
                            ? prev.filter(id => id !== agent.id)
                            : [...prev, agent.id]
                        );
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6">{agent.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {agent.description}
                        </Typography>
                        <Chip 
                          label={selectedAgents.includes(agent.id) ? 'Selected' : 'Click to select'}
                          color={selectedAgents.includes(agent.id) ? 'primary' : 'default'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Flow Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Define how your selected agents will work together
            </Typography>
            
            {selectedAgents.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Order</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedAgents.map((agentId, index) => {
                      const agent = agentWrappers.find(a => a.id === agentId);
                      return (
                        <TableRow key={agentId}>
                          <TableCell>{agent?.name || agentId}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="e.g., Data Processor"
                              value={agentRoles[agentId]?.name || ''}
                              onChange={(e) => setAgentRoles(prev => ({
                                ...prev,
                                [agentId]: { ...prev[agentId], name: e.target.value }
                              }))}
                            />
                          </TableCell>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <Settings />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="warning">
                Please select agents in the previous step to configure the flow.
              </Alert>
            )}
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Governance Rules
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Configure system-level governance policies
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Governance Policy</InputLabel>
                  <Select
                    value={governanceRules.governancePolicy}
                    label="Governance Policy"
                    onChange={(e) => updateRule('governancePolicy', e.target.value)}
                  >
                    <MenuItem value="minimal">Minimal</MenuItem>
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="strict">Strict</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Error Handling</InputLabel>
                  <Select
                    value={governanceRules.errorHandling}
                    label="Error Handling"
                    onChange={(e) => updateRule('errorHandling', e.target.value)}
                  >
                    <MenuItem value="fallback">Fallback</MenuItem>
                    <MenuItem value="retry">Retry</MenuItem>
                    <MenuItem value="abort">Abort</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Max Execution Time: {governanceRules.maxExecutionTime}s
                </Typography>
                <Slider
                  value={governanceRules.maxExecutionTime}
                  onChange={(_, value) => updateRule('maxExecutionTime', value as number)}
                  min={30}
                  max={600}
                  step={30}
                  marks={[
                    { value: 30, label: '30s' },
                    { value: 300, label: '5m' },
                    { value: 600, label: '10m' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={governanceRules.crossAgentValidation}
                      onChange={(e) => updateRule('crossAgentValidation', e.target.checked)}
                    />
                  }
                  label="Enable Cross-Agent Validation"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rate Limit (requests/minute)"
                  type="number"
                  value={governanceRules.rateLimiting.requestsPerMinute}
                  onChange={(e) => updateRateLimiting('requestsPerMinute', parseInt(e.target.value) || 60)}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Burst Limit"
                  type="number"
                  value={governanceRules.rateLimiting.burstLimit}
                  onChange={(e) => updateRateLimiting('burstLimit', parseInt(e.target.value) || 10)}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Create
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Review your multi-agent system configuration
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>System Details</Typography>
                    <Typography><strong>Name:</strong> {systemName}</Typography>
                    <Typography><strong>Type:</strong> {systemType}</Typography>
                    <Typography><strong>Agents:</strong> {selectedAgents.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Governance</Typography>
                    <Typography><strong>Policy:</strong> {governanceRules.governancePolicy}</Typography>
                    <Typography><strong>Error Handling:</strong> {governanceRules.errorHandling}</Typography>
                    <Typography><strong>Logging:</strong> {governanceRules.loggingLevel}</Typography>
                    <Typography><strong>Max Time:</strong> {governanceRules.maxExecutionTime}s</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return <SuccessStep systemId={createdSystemId} />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Demo Team Templates Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, backgroundColor: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
        <Box mb={2}>
          <Typography variant="h6" gutterBottom sx={{ color: '#4caf50', fontWeight: 600 }}>
            🚀 Try a Demo Team First
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click any demo team below to auto-populate the wizard and see how multi-agent collaboration works!
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          {DEMO_TEAM_TEMPLATES.map((template) => (
            <Grid item xs={12} md={4} key={template.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid rgba(255,255,255,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    borderColor: template.color
                  }
                }}
                onClick={() => {
                  // Pre-populate wizard with demo team data
                  setSystemName(template.name);
                  setSystemDescription(template.description);
                  setSystemType(template.systemType);
                  setSelectedAgents(template.agentIds);
                  setAgentRoles(template.agentRoles);
                  setGovernanceRules(template.governanceRules);
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ color: template.color, mr: 1 }}>
                      <Assessment />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {template.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {template.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip 
                      label={template.systemType} 
                      size="small" 
                      sx={{ 
                        backgroundColor: template.color, 
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                    <Chip 
                      label={`${template.agentIds.length} agents`} 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Ad Hoc Configuration Banner */}
      {isFromAdHoc && adHocConfig && (
        <Alert severity="success" sx={{ mb: 4 }}>
          <AlertTitle>Configuration Loaded from Ad Hoc Conversation</AlertTitle>
          Successfully imported settings from your tested multi-agent conversation. 
          Analysis confidence: {adHocConfig.analysisData?.confidence?.toFixed(1) || 'N/A'}%
        </Alert>
      )}
      
      <Typography variant="h4" gutterBottom align="center">
        Multi-Agent System Wrapper
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" mb={4}>
        {isFromAdHoc 
          ? 'Convert your tested ad hoc configuration into a formal multi-agent system'
          : 'Create governed multi-agent systems from your wrapped agents'
        }
      </Typography>

      <Box maxWidth="lg" mx="auto">
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card>
          <CardContent sx={{ p: 4 }}>
            {renderStepContent(activeStep)}
          </CardContent>
        </Card>

        {activeStep < steps.length && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!canProceed() || isCreating}
            >
              {activeStep === steps.length - 1 ? 
                (isCreating ? 'Creating System...' : 'Create System') : 
                'Next'
              }
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default MultiAgentWrappingWizard;

