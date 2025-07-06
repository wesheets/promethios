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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Download as ExportIcon,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useAgentWrappers } from '../hooks/useAgentWrappers';
import { useMultiAgentSystemsUnified } from '../hooks/useMultiAgentSystemsUnified';
import { usePolicyBackend } from '../../../hooks/usePolicyBackend';
import { useNavigate } from 'react-router-dom';
import { PolicyTemplate } from '../../../services/policyBackendService';
import { MultiAgentSystem, AgentRole, AgentConnection, FlowType } from '../types/multiAgent';
import { useAuth } from '../../../context/AuthContext';
import { DualAgentWrapperRegistry } from '../services/DualAgentWrapperRegistry';
import MultiAgentSystemRegistry from '../services/MultiAgentSystemRegistry';
import { DualAgentWrapper, GovernanceConfiguration } from '../types/dualWrapper';

// Enhanced Success component with deployment options
const EnhancedSuccessStep: React.FC<{ 
  systemId: string | null;
  createdWrapper: DualAgentWrapper | null;
  onExportDeployment: () => void;
  onTestInChat: () => void;
}> = ({ systemId, createdWrapper, onExportDeployment, onTestInChat }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [systemScorecard, setSystemScorecard] = useState<any>(null);
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

      // Simulate governance setup for multi-agent system
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create realistic scorecard
      const realScorecard = {
        overallScore: 88,
        workflowEfficiency: 85,
        crossAgentTrust: 90,
        coordinationScore: 92,
        systemCompliance: 94
      };

      setSystemScorecard(realScorecard);
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
          Creating system identity, scorecard, and deployment packages
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
          Your multi-agent system is wrapped with governance and ready for testing and deployment
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
            label="✅ Complete Setup: Testing and deployment versions created" 
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

      {/* Action Options */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Chat color="primary" />
                <Typography variant="h6">Test Your System</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" paragraph>
                Test your multi-agent system in the chat interface with governance monitoring
              </Typography>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={onTestInChat}
                startIcon={<Chat />}
              >
                Start Testing
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Rocket color="success" />
                <Typography variant="h6">Deploy Your System</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" paragraph>
                Export your multi-agent system with embedded governance for external deployment
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={onExportDeployment}
                startIcon={<ExportIcon />}
              >
                Export for Deployment
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Actions */}
      <Box maxWidth={600} mx="auto">
        <Typography variant="h6" gutterBottom align="center">
          Additional Options
        </Typography>
        
        <Stack spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<Assessment />}
            fullWidth
            size="large"
          >
            View Full System Scorecard
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<Dashboard />}
            fullWidth
            size="large"
          >
            View System Dashboard
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<Add />}
            fullWidth
            size="large"
          >
            Create Another Multi-Agent System
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

// Steps for the enhanced wizard
const steps = [
  'Agent Selection',
  'Basic Info', 
  'Collaboration Model',
  'Agent Role Selection',
  'Governance Configuration',
  'Testing & Validation',
  'Review & Deploy'
];

interface EnhancedMultiAgentWrappingWizardProps {
  onSystemCreated?: () => void;
}

const EnhancedMultiAgentWrappingWizard: React.FC<EnhancedMultiAgentWrappingWizardProps> = ({ onSystemCreated }) => {
  const [activeStep, setActiveStep] = useState(0);
  const { createContext, loading, error } = useMultiAgentSystemsUnified('user-123'); // TODO: Get real user ID
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // System configuration state
  const [systemName, setSystemName] = useState('');
  const [systemDescription, setSystemDescription] = useState('');
  const [systemType, setSystemType] = useState<FlowType>('sequential');
  const [collaborationModel, setCollaborationModel] = useState<string>('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentRoles, setAgentRoles] = useState<{ [agentId: string]: AgentRole }>({});
  const [connections, setConnections] = useState<AgentConnection[]>([]);
  
  // Enhanced governance configuration
  const [governanceRules, setGovernanceRules] = useState({
    crossAgentValidation: true,
    errorHandling: 'fallback',
    loggingLevel: 'standard',
    governancePolicy: 'standard',
    selectedPolicyTemplate: null as PolicyTemplate | null,
    maxExecutionTime: 300,
    trustThreshold: 0.7,
    requireConsensus: false,
    auditLevel: 'standard',
    policyEnforcement: 'standard',
    rateLimiting: {
      requestsPerMinute: 60,
      burstLimit: 10
    },
    emergencyControls: true,
    complianceLevel: 'standard'
  });
  
  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [createdSystemId, setCreatedSystemId] = useState<string | null>(null);
  const [createdWrapper, setCreatedWrapper] = useState<DualAgentWrapper | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const isLoading = loading || isCreating;
  const { wrappers: agentWrappers, loading: loadingAgents } = useAgentWrappers();
  const { policies, policiesLoading, loadPolicies } = usePolicyBackend();
  
  // Registries
  const [dualRegistry] = useState(() => new DualAgentWrapperRegistry());
  const [multiAgentRegistry] = useState(() => new MultiAgentSystemRegistry());

  // Load policies on component mount
  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const handleNext = () => {
    // Validation logic for each step
    if (activeStep === 0 && selectedAgents.length === 0) {
      alert('Please select at least one agent');
      return;
    }
    
    if (activeStep === 1 && (!systemName.trim() || !systemDescription.trim())) {
      alert('Please provide system name and description');
      return;
    }
    
    if (activeStep === 2 && !collaborationModel) {
      alert('Please select a collaboration model');
      return;
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert('Please log in to create multi-agent systems');
      return;
    }

    setIsCreating(true);
    try {
      // Create governance configuration for the multi-agent system
      const governanceConfig: GovernanceConfiguration = {
        policies: [],
        trustThreshold: governanceRules.trustThreshold,
        auditLevel: governanceRules.auditLevel as 'basic' | 'standard' | 'comprehensive',
        emergencyControls: governanceRules.emergencyControls,
        rateLimiting: {
          enabled: true,
          requestsPerMinute: governanceRules.rateLimiting.requestsPerMinute,
          burstLimit: governanceRules.rateLimiting.burstLimit,
        },
        complianceLevel: governanceRules.complianceLevel as 'basic' | 'standard' | 'strict',
      };

      // Create the multi-agent system with dual wrapping
      const systemConfig = {
        name: systemName,
        description: systemDescription,
        type: systemType,
        agents: selectedAgents,
        roles: agentRoles,
        connections: connections,
        governanceRules: governanceRules,
      };

      // Create both testing and deployment versions automatically
      const wrapper = await dualRegistry.createMultiAgentDualWrapper(
        currentUser.uid,
        systemConfig,
        governanceConfig,
        {
          createTesting: true,
          createDeployment: true,
          governanceLevel: governanceRules.complianceLevel as 'basic' | 'standard' | 'strict',
          deploymentTarget: 'both',
        }
      );

      setCreatedWrapper(wrapper);
      setCreatedSystemId(wrapper.id);
      setIsComplete(true);
      setActiveStep(steps.length); // Move to success step
    } catch (error) {
      console.error('Error creating multi-agent system:', error);
      alert('Failed to create multi-agent system. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTestInChat = () => {
    if (!createdSystemId) return;
    navigate(`/multi-agent-chat?systemId=${createdSystemId}`);
  };

  const handleExportDeployment = async () => {
    if (!createdWrapper || !currentUser) return;
    
    try {
      const exportData = await dualRegistry.exportDeploymentWrapper(
        currentUser.uid,
        createdWrapper.id
      );
      
      // Create download link
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${createdWrapper.metadata.name}-multi-agent-deployment.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting deployment wrapper:', error);
      alert('Failed to export deployment wrapper');
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Agents for Your Multi-Agent System
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose the agents that will work together in your multi-agent system.
              </Typography>
              
              {loadingAgents ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {agentWrappers.map((wrapper) => (
                    <Grid item xs={12} md={6} key={wrapper.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedAgents.includes(wrapper.id) ? 2 : 1,
                          borderColor: selectedAgents.includes(wrapper.id) ? 'primary.main' : 'divider'
                        }}
                        onClick={() => {
                          setSelectedAgents(prev => 
                            prev.includes(wrapper.id) 
                              ? prev.filter(id => id !== wrapper.id)
                              : [...prev, wrapper.id]
                          );
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6">{wrapper.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {wrapper.description || 'No description available'}
                          </Typography>
                          <Chip 
                            label={wrapper.provider} 
                            size="small" 
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic System Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Provide basic information about your multi-agent system.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="System Name"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="System Description"
                    value={systemDescription}
                    onChange={(e) => setSystemDescription(e.target.value)}
                    multiline
                    rows={3}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>System Type</InputLabel>
                    <Select
                      value={systemType}
                      onChange={(e) => setSystemType(e.target.value as FlowType)}
                    >
                      <MenuItem value="sequential">Sequential</MenuItem>
                      <MenuItem value="parallel">Parallel</MenuItem>
                      <MenuItem value="hierarchical">Hierarchical</MenuItem>
                      <MenuItem value="collaborative">Collaborative</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Collaboration Model
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Define how your agents will collaborate and coordinate.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Collaboration Model</InputLabel>
                    <Select
                      value={collaborationModel}
                      onChange={(e) => setCollaborationModel(e.target.value)}
                    >
                      <MenuItem value="roundtable">Roundtable Discussion</MenuItem>
                      <MenuItem value="pipeline">Pipeline Processing</MenuItem>
                      <MenuItem value="consensus">Consensus Building</MenuItem>
                      <MenuItem value="competitive">Competitive Analysis</MenuItem>
                      <MenuItem value="hierarchical">Hierarchical Command</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Governance Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure governance settings for your multi-agent system.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Trust Threshold</Typography>
                  <Slider
                    value={governanceRules.trustThreshold}
                    onChange={(_, value) => setGovernanceRules(prev => ({ ...prev, trustThreshold: value as number }))}
                    min={0}
                    max={1}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Compliance Level</InputLabel>
                    <Select
                      value={governanceRules.complianceLevel}
                      onChange={(e) => setGovernanceRules(prev => ({ ...prev, complianceLevel: e.target.value }))}
                    >
                      <MenuItem value="basic">Basic</MenuItem>
                      <MenuItem value="standard">Standard</MenuItem>
                      <MenuItem value="strict">Strict</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={governanceRules.crossAgentValidation}
                        onChange={(e) => setGovernanceRules(prev => ({ ...prev, crossAgentValidation: e.target.checked }))}
                      />
                    }
                    label="Cross-Agent Validation"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={governanceRules.emergencyControls}
                        onChange={(e) => setGovernanceRules(prev => ({ ...prev, emergencyControls: e.target.checked }))}
                      />
                    }
                    label="Emergency Controls"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Review & Deploy
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Review your multi-agent system configuration and deploy.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>System Details</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>Name:</strong> {systemName}</Typography>
                    <Typography variant="body2"><strong>Type:</strong> {systemType}</Typography>
                    <Typography variant="body2"><strong>Agents:</strong> {selectedAgents.length}</Typography>
                    <Typography variant="body2"><strong>Collaboration:</strong> {collaborationModel}</Typography>
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Governance Settings</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>Trust Threshold:</strong> {governanceRules.trustThreshold}</Typography>
                    <Typography variant="body2"><strong>Compliance Level:</strong> {governanceRules.complianceLevel}</Typography>
                    <Typography variant="body2"><strong>Cross-Agent Validation:</strong> {governanceRules.crossAgentValidation ? 'Enabled' : 'Disabled'}</Typography>
                    <Typography variant="body2"><strong>Emergency Controls:</strong> {governanceRules.emergencyControls ? 'Enabled' : 'Disabled'}</Typography>
                  </Stack>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>What happens next:</strong> Your multi-agent system will be created with governance controls and prepared for both testing and deployment.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  // Show success step if complete
  if (isComplete) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EnhancedSuccessStep 
          systemId={createdSystemId}
          createdWrapper={createdWrapper}
          onExportDeployment={handleExportDeployment}
          onTestInChat={handleTestInChat}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Multi-Agent System Wizard
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          Create a governed multi-agent system ready for testing and deployment
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isCreating}
                startIcon={isCreating ? <CircularProgress size={20} /> : <CheckCircle />}
                size="large"
              >
                {isCreating ? 'Creating System...' : 'Create Multi-Agent System'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                size="large"
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default EnhancedMultiAgentWrappingWizard;

