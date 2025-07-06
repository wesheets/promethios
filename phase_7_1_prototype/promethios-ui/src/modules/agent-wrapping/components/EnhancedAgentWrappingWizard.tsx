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
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Security as GovernanceIcon,
  CheckCircle,
  ArrowBack,
  ArrowForward,
  Code as CodeIcon,
  Business as BusinessIcon,
  CloudUpload as DeployIcon,
  TestTube as TestIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { DualAgentWrapperRegistry } from '../services/DualAgentWrapperRegistry';
import { DualWrapperStorageService } from '../services/DualWrapperStorageService';
import { CreateDualWrapperRequest, DualAgentWrapper } from '../types/dualWrapper';

const steps = [
  'Agent Configuration',
  'Governance Setup', 
  'Dual Deployment'
];

export interface EnhancedWizardFormData {
  // Step 1: Agent Configuration
  agentName: string;
  description: string;
  apiEndpoint: string;
  apiKey: string;
  provider: string;
  
  // Step 2: Governance Setup
  governanceLevel: 'basic' | 'standard' | 'advanced';
  enableContentFiltering: boolean;
  enableBehaviorConstraints: boolean;
  enableOutputValidation: boolean;
  trustThreshold: number;
  
  // Step 3: Dual Deployment
  enableDualDeployment: boolean;
  testingEnvironment: string;
  deploymentEnvironment: string;
  autoPromote: boolean;
}

interface EnhancedAgentWrappingWizardProps {
  onComplete?: (wrapper: DualAgentWrapper) => void;
  onCancel?: () => void;
}

const EnhancedAgentWrappingWizard: React.FC<EnhancedAgentWrappingWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EnhancedWizardFormData>({
    agentName: '',
    description: '',
    apiEndpoint: '',
    apiKey: '',
    provider: 'OpenAI',
    governanceLevel: 'standard',
    enableContentFiltering: true,
    enableBehaviorConstraints: true,
    enableOutputValidation: true,
    trustThreshold: 75,
    enableDualDeployment: true,
    testingEnvironment: 'sandbox',
    deploymentEnvironment: 'production',
    autoPromote: false,
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const [dualRegistry, setDualRegistry] = useState<DualAgentWrapperRegistry | null>(null);

  useEffect(() => {
    // Initialize dual registry
    const initRegistry = async () => {
      try {
        const storage = new DualWrapperStorageService();
        const registry = new DualAgentWrapperRegistry(storage);
        if (user?.uid) {
          registry.setCurrentUser(user.uid);
        }
        setDualRegistry(registry);
      } catch (err) {
        console.error('Failed to initialize dual registry:', err);
        setError('Failed to initialize dual deployment system');
      }
    };

    initRegistry();
  }, [user]);

  const updateFormData = (updates: Partial<EnhancedWizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async () => {
    if (!dualRegistry || !user) {
      setError('Dual deployment system not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: CreateDualWrapperRequest = {
        baseAgent: {
          name: formData.agentName,
          description: formData.description,
          endpoint: formData.apiEndpoint,
          provider: formData.provider,
          capabilities: [], // Will be auto-discovered
        },
        governanceConfig: {
          level: formData.governanceLevel,
          policies: [
            ...(formData.enableContentFiltering ? [{
              id: 'content-filter',
              name: 'Content Filtering',
              description: 'Filter inappropriate content',
              type: 'content_filter' as const,
              rules: [],
              severity: 'medium' as const,
              enabled: true,
            }] : []),
            ...(formData.enableBehaviorConstraints ? [{
              id: 'behavior-constraints',
              name: 'Behavior Constraints',
              description: 'Constrain agent behavior',
              type: 'behavior_constraint' as const,
              rules: [],
              severity: 'high' as const,
              enabled: true,
            }] : []),
            ...(formData.enableOutputValidation ? [{
              id: 'output-validation',
              name: 'Output Validation',
              description: 'Validate agent outputs',
              type: 'output_validation' as const,
              rules: [],
              severity: 'medium' as const,
              enabled: true,
            }] : []),
          ],
          trustConfig: {
            initialScore: formData.trustThreshold,
            minimumThreshold: 50,
            decayRate: 0.1,
            recoveryRate: 0.05,
            factors: [],
            evaluationInterval: 60,
          },
          auditConfig: {
            enabled: true,
            logLevel: 'info',
            retentionDays: 30,
            includePayloads: false,
          },
        },
        deploymentConfig: {
          testingEnvironment: formData.testingEnvironment,
          deploymentEnvironment: formData.deploymentEnvironment,
          autoPromote: formData.autoPromote,
          enableMonitoring: true,
        },
        metadata: {
          description: formData.description,
          tags: ['enhanced', 'dual-deployment'],
        },
      };

      const dualWrapper = await dualRegistry.createDualWrapper(request);
      
      if (onComplete) {
        onComplete(dualWrapper);
      } else {
        navigate('/agent-wrapping', { 
          state: { 
            success: true, 
            wrapperId: dualWrapper.id,
            message: 'Agent successfully wrapped with dual deployment!' 
          } 
        });
      }
    } catch (err) {
      console.error('Failed to create dual wrapper:', err);
      setError(err instanceof Error ? err.message : 'Failed to create dual wrapper');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderAgentConfiguration();
      case 1:
        return renderGovernanceSetup();
      case 2:
        return renderDualDeployment();
      default:
        return null;
    }
  };

  const renderAgentConfiguration = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <AgentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Agent Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure your AI agent with auto-discovery and enhanced settings
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🔍 <strong>Auto-Discovery Enabled</strong><br />
            Select a provider and enter your API key - we'll automatically discover and populate your agent's capabilities, models, and optimal settings!
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Agent Name</InputLabel>
              <Select
                value={formData.agentName}
                onChange={(e) => updateFormData({ agentName: e.target.value })}
                label="Agent Name"
              >
                <MenuItem value="Customer Support Bot">Customer Support Bot</MenuItem>
                <MenuItem value="Content Generator">Content Generator</MenuItem>
                <MenuItem value="Data Analyst">Data Analyst</MenuItem>
                <MenuItem value="Code Assistant">Code Assistant</MenuItem>
                <MenuItem value="Custom Agent">Custom Agent</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Provider</InputLabel>
              <Select
                value={formData.provider}
                onChange={(e) => updateFormData({ provider: e.target.value })}
                label="Provider"
              >
                <MenuItem value="OpenAI">OpenAI</MenuItem>
                <MenuItem value="Anthropic">Anthropic</MenuItem>
                <MenuItem value="Google">Google</MenuItem>
                <MenuItem value="Azure">Azure OpenAI</MenuItem>
                <MenuItem value="Custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Description</InputLabel>
              <Select
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                label="Description"
              >
                <MenuItem value="AI assistant for customer support and help desk operations">Customer Support Assistant</MenuItem>
                <MenuItem value="Content creation and marketing copy generation">Content Creation Assistant</MenuItem>
                <MenuItem value="Data analysis and insights generation">Data Analysis Assistant</MenuItem>
                <MenuItem value="Code review, debugging, and development assistance">Development Assistant</MenuItem>
                <MenuItem value="Custom AI agent for specialized tasks">Custom Assistant</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>API Endpoint</InputLabel>
              <Select
                value={formData.apiEndpoint}
                onChange={(e) => updateFormData({ apiEndpoint: e.target.value })}
                label="API Endpoint"
              >
                <MenuItem value="https://api.openai.com/v1/chat/completions">OpenAI Chat Completions</MenuItem>
                <MenuItem value="https://api.anthropic.com/v1/messages">Anthropic Messages</MenuItem>
                <MenuItem value="https://generativelanguage.googleapis.com/v1/models">Google Generative AI</MenuItem>
                <MenuItem value="custom">Custom Endpoint</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>API Key</InputLabel>
              <Select
                value={formData.apiKey}
                onChange={(e) => updateFormData({ apiKey: e.target.value })}
                label="API Key"
              >
                <MenuItem value="sk-test-key">Test API Key</MenuItem>
                <MenuItem value="sk-prod-key">Production API Key</MenuItem>
                <MenuItem value="custom">Enter Custom Key</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            🔒 Your API credentials are stored securely and will be used to connect to your agent during the wrapping process.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderGovernanceSetup = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <GovernanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Governance Setup
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure governance controls and policies for your agent
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Governance Level</InputLabel>
              <Select
                value={formData.governanceLevel}
                onChange={(e) => updateFormData({ governanceLevel: e.target.value as any })}
                label="Governance Level"
              >
                <MenuItem value="basic">Basic - Essential controls</MenuItem>
                <MenuItem value="standard">Standard - Recommended controls</MenuItem>
                <MenuItem value="advanced">Advanced - Maximum security</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Trust Threshold: {formData.trustThreshold}%</Typography>
            <Slider
              value={formData.trustThreshold}
              onChange={(_, value) => updateFormData({ trustThreshold: value as number })}
              min={0}
              max={100}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' }
              ]}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Policy Controls</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableContentFiltering}
                      onChange={(e) => updateFormData({ enableContentFiltering: e.target.checked })}
                    />
                  }
                  label="Content Filtering"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableBehaviorConstraints}
                      onChange={(e) => updateFormData({ enableBehaviorConstraints: e.target.checked })}
                    />
                  }
                  label="Behavior Constraints"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableOutputValidation}
                      onChange={(e) => updateFormData({ enableOutputValidation: e.target.checked })}
                    />
                  }
                  label="Output Validation"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderDualDeployment = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <DeployIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Dual Deployment Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure testing and deployment environments for your agent
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🎯 <strong>Dual Deployment Enabled</strong><br />
            Your agent will be automatically deployed to both testing and production environments with governance controls.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableDualDeployment}
                  onChange={(e) => updateFormData({ enableDualDeployment: e.target.checked })}
                />
              }
              label="Enable Dual Deployment"
            />
          </Grid>

          {formData.enableDualDeployment && (
            <>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <TestIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Testing Environment</Typography>
                    </Box>
                    <FormControl fullWidth>
                      <InputLabel>Environment</InputLabel>
                      <Select
                        value={formData.testingEnvironment}
                        onChange={(e) => updateFormData({ testingEnvironment: e.target.value })}
                        label="Environment"
                      >
                        <MenuItem value="sandbox">Sandbox</MenuItem>
                        <MenuItem value="staging">Staging</MenuItem>
                        <MenuItem value="development">Development</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      For testing governed vs ungoverned behavior
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <BusinessIcon color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Production Environment</Typography>
                    </Box>
                    <FormControl fullWidth>
                      <InputLabel>Environment</InputLabel>
                      <Select
                        value={formData.deploymentEnvironment}
                        onChange={(e) => updateFormData({ deploymentEnvironment: e.target.value })}
                        label="Environment"
                      >
                        <MenuItem value="production">Production</MenuItem>
                        <MenuItem value="live">Live</MenuItem>
                        <MenuItem value="enterprise">Enterprise</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      For live agents deployed off Promethios
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.autoPromote}
                      onChange={(e) => updateFormData({ autoPromote: e.target.checked })}
                    />
                  }
                  label="Auto-promote from testing to production"
                />
                <Typography variant="body2" color="text.secondary">
                  Automatically promote agents that pass testing validation
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Enhanced Agent Wrapping Wizard
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          Create governed AI agents with dual deployment and enhanced monitoring
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                {label}
                {index === 2 && formData.enableDualDeployment && (
                  <Chip size="small" label="Dual" color="primary" sx={{ ml: 1 }} />
                )}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}

        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            onClick={activeStep === 0 ? onCancel : handleBack}
            startIcon={<ArrowBack />}
            disabled={loading}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              'Create Dual Wrapper'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EnhancedAgentWrappingWizard;

