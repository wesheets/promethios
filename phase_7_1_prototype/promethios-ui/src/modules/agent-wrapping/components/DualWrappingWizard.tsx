import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Stack,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Security as GovernanceIcon,
  CheckCircle,
  ArrowBack,
  ArrowForward,
  Code as CodeIcon,
  Business as BusinessIcon,
  Download as ExportIcon,
  TestTube as TestIcon,
  Rocket as DeployIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EnhancedAgentRegistration from '../../../components/EnhancedAgentRegistration';
import { UserAgentStorageService, AgentProfile, GovernancePolicy, ComplianceControl, PolicyRule } from '../../../services/UserAgentStorageService';
import { useAuth } from '../../../context/AuthContext';
import { DualAgentWrapperRegistry } from '../services/DualAgentWrapperRegistry';
import { DualAgentWrapper, GovernanceConfiguration, PolicyDefinition } from '../types/dualWrapper';

const steps = [
  'Agent Configuration',
  'Governance Setup',
  'Dual Wrapping Options',
  'Review & Deploy'
];

export interface DualWizardFormData {
  // Step 1: Agent Configuration
  agentName: string;
  description: string;
  provider: string;
  apiEndpoint: string;
  authMethod: string;
  apiKey: string;
  model: string;
  inputSchema: any;
  outputSchema: any;
  
  // Step 2: Governance Configuration
  trustThreshold: number;
  complianceLevel: string;
  enableLogging: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  policies: PolicyDefinition[];
  emergencyControls: boolean;
  auditLevel: 'basic' | 'standard' | 'comprehensive';
  
  // Step 3: Dual Wrapping Options
  createTestingVersion: boolean;
  createDeploymentVersion: boolean;
  governanceLevel: 'basic' | 'standard' | 'strict';
  deploymentTarget: 'internal' | 'external' | 'both';
  
  // Computed
  estimatedCost: string;
  securityScore: number;
}

const DualWrappingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  // Check if we're wrapping an existing agent
  const agentId = searchParams.get('agentId');
  const isWrappingExisting = Boolean(agentId);
  
  // Start at step 1 (Governance) if wrapping existing agent, step 0 if new
  const [activeStep, setActiveStep] = useState(isWrappingExisting ? 1 : 0);
  const [formData, setFormData] = useState<DualWizardFormData>({
    // Agent Configuration
    agentName: '',
    description: '',
    provider: '',
    apiEndpoint: '',
    authMethod: '',
    apiKey: '',
    model: '',
    inputSchema: {},
    outputSchema: {},
    
    // Governance Configuration
    trustThreshold: 0.7,
    complianceLevel: 'standard',
    enableLogging: true,
    enableRateLimiting: true,
    maxRequestsPerMinute: 60,
    policies: [],
    emergencyControls: true,
    auditLevel: 'standard',
    
    // Dual Wrapping Options
    createTestingVersion: true,
    createDeploymentVersion: true,
    governanceLevel: 'standard',
    deploymentTarget: 'both',
    
    // Computed
    estimatedCost: '$0.00',
    securityScore: 85,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(isWrappingExisting);
  const [createdWrapper, setCreatedWrapper] = useState<DualAgentWrapper | null>(null);
  const [dualRegistry] = useState(() => new DualAgentWrapperRegistry());

  // Load existing agent data if wrapping an existing agent
  useEffect(() => {
    const loadExistingAgent = async () => {
      if (!agentId || !currentUser) return;
      
      setIsLoading(true);
      try {
        const storageService = new UserAgentStorageService();
        storageService.setCurrentUser(currentUser.uid);
        
        const existingAgent = await storageService.getAgent(agentId);
        if (existingAgent) {
          setFormData(prev => ({
            ...prev,
            agentName: existingAgent.agentName || existingAgent.identity?.name || '',
            description: existingAgent.description || '',
            provider: existingAgent.provider || '',
            apiEndpoint: existingAgent.apiEndpoint || existingAgent.endpoint || '',
            apiKey: existingAgent.apiKey || existingAgent.key || '',
            model: existingAgent.model || '',
            inputSchema: existingAgent.inputSchema || {},
            outputSchema: existingAgent.outputSchema || {},
          }));
        }
      } catch (error) {
        console.error('Error loading existing agent:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAgent();
  }, [agentId, currentUser]);

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate agent configuration
      const hasName = formData.agentName?.trim();
      const hasEndpoint = formData.apiEndpoint?.trim();
      const hasKey = formData.apiKey?.trim();
      const hasProvider = formData.provider?.trim();
      
      if (!hasName || !hasEndpoint || !hasKey || !hasProvider) {
        alert('Please fill in all required agent configuration fields');
        return;
      }
    }
    
    if (activeStep === 1) {
      // Validate governance setup
      if (formData.trustThreshold < 0 || formData.trustThreshold > 1) {
        alert('Trust threshold must be between 0 and 1');
        return;
      }
    }
    
    if (activeStep === 2) {
      // Validate dual wrapping options
      if (!formData.createTestingVersion && !formData.createDeploymentVersion) {
        alert('You must create at least one version (testing or deployment)');
        return;
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert('Please log in to create agent wrappers');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create governance configuration
      const governanceConfig: GovernanceConfiguration = {
        policies: formData.policies,
        trustThreshold: formData.trustThreshold,
        auditLevel: formData.auditLevel,
        emergencyControls: formData.emergencyControls,
        rateLimiting: {
          enabled: formData.enableRateLimiting,
          requestsPerMinute: formData.maxRequestsPerMinute,
          burstLimit: Math.floor(formData.maxRequestsPerMinute / 6), // 10-second burst
        },
        complianceLevel: formData.complianceLevel as 'basic' | 'standard' | 'strict',
      };

      // Create the dual wrapper
      const wrapper = await dualRegistry.createDualWrapper(
        currentUser.uid,
        {
          name: formData.agentName,
          description: formData.description,
          provider: formData.provider,
          endpoint: formData.apiEndpoint,
          apiKey: formData.apiKey,
          model: formData.model,
          inputSchema: formData.inputSchema,
          outputSchema: formData.outputSchema,
        },
        governanceConfig,
        {
          createTesting: formData.createTestingVersion,
          createDeployment: formData.createDeploymentVersion,
          governanceLevel: formData.governanceLevel,
          deploymentTarget: formData.deploymentTarget,
        }
      );

      setCreatedWrapper(wrapper);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error creating dual wrapper:', error);
      alert('Failed to create agent wrapper. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      link.download = `${createdWrapper.metadata.name}-deployment.json`;
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
                Agent Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure your agent's basic settings and API connection details.
              </Typography>
              <EnhancedAgentRegistration
                onAgentDataChange={(data) => {
                  setFormData(prev => ({
                    ...prev,
                    agentName: data.agentName || data.identity?.name || '',
                    description: data.description || '',
                    provider: data.provider || '',
                    apiEndpoint: data.apiEndpoint || data.endpoint || '',
                    apiKey: data.apiKey || data.key || '',
                    model: data.model || '',
                    inputSchema: data.inputSchema || {},
                    outputSchema: data.outputSchema || {},
                  }));
                }}
                initialData={formData}
                isWrappingMode={true}
              />
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Governance Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Set up governance policies and compliance controls for your agent.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Trust Threshold</Typography>
                  <Slider
                    value={formData.trustThreshold}
                    onChange={(_, value) => setFormData(prev => ({ ...prev, trustThreshold: value as number }))}
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
                      value={formData.complianceLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, complianceLevel: e.target.value }))}
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
                        checked={formData.enableLogging}
                        onChange={(e) => setFormData(prev => ({ ...prev, enableLogging: e.target.checked }))}
                      />
                    }
                    label="Enable Audit Logging"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.enableRateLimiting}
                        onChange={(e) => setFormData(prev => ({ ...prev, enableRateLimiting: e.target.checked }))}
                      />
                    }
                    label="Enable Rate Limiting"
                  />
                </Grid>
                
                {formData.enableRateLimiting && (
                  <Grid item xs={12} md={6}>
                    <Typography gutterBottom>Max Requests Per Minute</Typography>
                    <Slider
                      value={formData.maxRequestsPerMinute}
                      onChange={(_, value) => setFormData(prev => ({ ...prev, maxRequestsPerMinute: value as number }))}
                      min={10}
                      max={300}
                      step={10}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Audit Level</InputLabel>
                    <Select
                      value={formData.auditLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, auditLevel: e.target.value as any }))}
                    >
                      <MenuItem value="basic">Basic</MenuItem>
                      <MenuItem value="standard">Standard</MenuItem>
                      <MenuItem value="comprehensive">Comprehensive</MenuItem>
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
                Dual Wrapping Options
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose which versions of your agent to create and their deployment targets.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Dual Wrapping</strong> creates two versions of your agent:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      • <strong>Testing Version:</strong> For chat testing with governance toggle
                    </Typography>
                    <Typography variant="body2">
                      • <strong>Deployment Version:</strong> With embedded governance for external use
                    </Typography>
                  </Alert>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <TestIcon color="primary" />
                      <Box flex={1}>
                        <Typography variant="subtitle1">Testing Version</Typography>
                        <Typography variant="body2" color="text.secondary">
                          For internal testing with governance toggle
                        </Typography>
                      </Box>
                      <Switch
                        checked={formData.createTestingVersion}
                        onChange={(e) => setFormData(prev => ({ ...prev, createTestingVersion: e.target.checked }))}
                      />
                    </Stack>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <DeployIcon color="success" />
                      <Box flex={1}>
                        <Typography variant="subtitle1">Deployment Version</Typography>
                        <Typography variant="body2" color="text.secondary">
                          With embedded governance for external deployment
                        </Typography>
                      </Box>
                      <Switch
                        checked={formData.createDeploymentVersion}
                        onChange={(e) => setFormData(prev => ({ ...prev, createDeploymentVersion: e.target.checked }))}
                      />
                    </Stack>
                  </Card>
                </Grid>
                
                {formData.createDeploymentVersion && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Governance Level</InputLabel>
                        <Select
                          value={formData.governanceLevel}
                          onChange={(e) => setFormData(prev => ({ ...prev, governanceLevel: e.target.value as any }))}
                        >
                          <MenuItem value="basic">Basic - Minimal governance</MenuItem>
                          <MenuItem value="standard">Standard - Balanced governance</MenuItem>
                          <MenuItem value="strict">Strict - Maximum governance</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Deployment Target</InputLabel>
                        <Select
                          value={formData.deploymentTarget}
                          onChange={(e) => setFormData(prev => ({ ...prev, deploymentTarget: e.target.value as any }))}
                        >
                          <MenuItem value="internal">Internal Use Only</MenuItem>
                          <MenuItem value="external">External Deployment</MenuItem>
                          <MenuItem value="both">Both Internal & External</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Review & Deploy
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Review your configuration and deploy your dual-wrapped agent.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Agent Details</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>Name:</strong> {formData.agentName}</Typography>
                    <Typography variant="body2"><strong>Provider:</strong> {formData.provider}</Typography>
                    <Typography variant="body2"><strong>Model:</strong> {formData.model}</Typography>
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Governance Settings</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>Trust Threshold:</strong> {formData.trustThreshold}</Typography>
                    <Typography variant="body2"><strong>Compliance Level:</strong> {formData.complianceLevel}</Typography>
                    <Typography variant="body2"><strong>Audit Level:</strong> {formData.auditLevel}</Typography>
                  </Stack>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Wrapper Configuration</Typography>
                  <Stack direction="row" spacing={2}>
                    {formData.createTestingVersion && (
                      <Chip icon={<TestIcon />} label="Testing Version" color="primary" />
                    )}
                    {formData.createDeploymentVersion && (
                      <Chip icon={<DeployIcon />} label="Deployment Version" color="success" />
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Dual Agent Wrapping Wizard
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          Create both testing and deployment versions of your agent with embedded governance
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
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {isSubmitting ? 'Creating...' : 'Create Dual Wrapper'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <CheckCircle color="success" />
            Dual Wrapper Created Successfully!
          </Box>
        </DialogTitle>
        <DialogContent>
          {createdWrapper && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="success">
                  Your agent has been successfully wrapped with dual versions!
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                      <TestIcon color="primary" />
                      <Typography variant="h6">Testing Version</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Ready for chat testing with governance toggle
                    </Typography>
                    <Button variant="outlined" fullWidth>
                      Test in Chat
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                      <DeployIcon color="success" />
                      <Typography variant="h6">Deployment Version</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Ready for external deployment with embedded governance
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      startIcon={<ExportIcon />}
                      onClick={handleExportDeployment}
                    >
                      Export for Deployment
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/registry')}>
            View in Registry
          </Button>
          <Button onClick={() => setShowSuccessDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DualWrappingWizard;

