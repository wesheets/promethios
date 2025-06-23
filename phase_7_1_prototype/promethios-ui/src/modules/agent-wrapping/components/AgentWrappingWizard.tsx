import React, { useState } from 'react';
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
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Security as GovernanceIcon,
  CheckCircle,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EnhancedAgentRegistration from '../../../components/EnhancedAgentRegistration';

const steps = [
  'Agent Configuration',
  'Governance Setup',
  'Review & Deploy'
];

const AgentWrappingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [agentData, setAgentData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate agent configuration
      if (!agentData.agentName?.trim() || !agentData.apiEndpoint?.trim() || !agentData.apiKey?.trim()) {
        alert('Please complete the agent configuration before proceeding');
        return;
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDeploy = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSuccessDialog(true);
    } catch (error) {
      alert('Deployment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    navigate('/ui/agents/profiles');
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <EnhancedAgentRegistration
            onDataChange={setAgentData}
            title="Configure Your Agent"
            subtitle="Set up your AI agent with auto-discovery and enhanced settings for governance wrapping."
          />
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
              🛡️ Governance Configuration
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Typography variant="body2">
                <strong>Governance Setup:</strong> Configure how Promethios will monitor and govern your agent's behavior.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: '#374151', border: '2px solid #3b82f6' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <GovernanceIcon sx={{ color: '#10b981', mr: 2 }} />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        Basic Governance
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      Trust scoring, audit logging, basic violation alerts
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label="Trust Scoring" size="small" sx={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }} />
                      <Chip label="Audit Logs" size="small" sx={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }} />
                      <Chip label="Basic Alerts" size="small" sx={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4b5563' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <GovernanceIcon sx={{ color: '#ef4444', mr: 2 }} />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        Strict Governance
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      HIPAA/SOC2 compliance, enhanced monitoring, detailed audit trails
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label="HIPAA Compliance" size="small" sx={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} />
                      <Chip label="Enhanced Monitoring" size="small" sx={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4b5563' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <GovernanceIcon sx={{ color: '#8b5cf6', mr: 2 }} />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        Custom Governance
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      Advanced configuration for power users
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label="Custom Policies" size="small" sx={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }} />
                      <Chip label="Advanced Rules" size="small" sx={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
              📋 Review & Deploy
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Typography variant="body2">
                <strong>Ready to Deploy:</strong> Your agent configuration is complete and ready for governance wrapping.
              </Typography>
            </Alert>

            <Card sx={{ backgroundColor: '#374151', border: '1px solid #4b5563', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Agent Configuration Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Name:</Typography>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {agentData.agentName || 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Provider:</Typography>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {agentData.provider || 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Model:</Typography>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {agentData.selectedModel || 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Capabilities:</Typography>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {agentData.selectedCapabilities?.length || 0} selected
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ backgroundColor: '#374151', border: '1px solid #4b5563' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Governance Configuration
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  Basic Governance will be applied with trust scoring, audit logging, and violation alerts.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ backgroundColor: '#2d3748', color: 'white', p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white' }}>
            Agent Wrapping Wizard
          </Typography>
          <Typography variant="body1" sx={{ color: '#a0aec0' }}>
            Wrap your AI agent with Promethios governance controls and monitoring
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ 
                '& .MuiStepLabel-label': { color: '#a0aec0' },
                '& .MuiStepLabel-label.Mui-active': { color: '#3b82f6' },
                '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' },
              }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={{ color: '#a0aec0' }}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleDeploy}
              disabled={isSubmitting}
              sx={{
                backgroundColor: '#10b981',
                color: 'white',
                '&:hover': { backgroundColor: '#059669' },
              }}
            >
              {isSubmitting ? 'Deploying...' : 'Deploy Agent'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForward />}
              sx={{
                backgroundColor: '#3b82f6',
                color: 'white',
                '&:hover': { backgroundColor: '#2563eb' },
              }}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={handleSuccessClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', textAlign: 'center' }}>
          <CheckCircle sx={{ color: '#10b981', fontSize: 48, mb: 2 }} />
          <Typography variant="h5">Agent Successfully Wrapped!</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#a0aec0', textAlign: 'center', mb: 2 }}>
            Your agent <strong>{agentData.agentName}</strong> has been successfully wrapped with Promethios governance.
          </Typography>
          <Alert severity="success" sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Typography variant="body2">
              ✅ Governance controls activated<br/>
              ✅ Trust scoring enabled<br/>
              ✅ Audit logging configured<br/>
              ✅ Agent ready for use
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleSuccessClose}
            sx={{
              backgroundColor: '#3b82f6',
              color: 'white',
              '&:hover': { backgroundColor: '#2563eb' },
            }}
          >
            View My Agents
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AgentWrappingWizard;

export interface WizardFormData {
  // Step 1: API Endpoint
  agentName: string;
  description: string;
  provider: string;
  apiEndpoint: string;
  authMethod: string;
  apiKey: string;
  model: string;
  
  // Step 2: Schema
  inputSchema: any;
  outputSchema: any;
  
  // Step 3: Governance
  trustThreshold: number;
  complianceLevel: string;
  enableLogging: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  
  // Step 4: Review (computed)
  estimatedCost: string;
  securityScore: number;
}

// Demo agents for quick wrapping demonstration
const DEMO_AGENTS = [
  {
    id: 'helpful-assistant-demo',
    name: 'Helpful Assistant',
    description: 'A general-purpose AI assistant that provides helpful, harmless, and honest responses.',
    type: 'assistant',
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo',
    capabilities: ['general-assistance', 'question-answering', 'conversation'],
    governance_enabled: true,
    icon: <PsychologyIcon />,
    color: '#2196f3'
  },
  {
    id: 'code-specialist-demo',
    name: 'Code Specialist',
    description: 'A specialized coding assistant for programming tasks, debugging, and code review.',
    type: 'specialist',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['code-generation', 'debugging', 'code-review'],
    governance_enabled: true,
    icon: <CodeIcon />,
    color: '#9c27b0'
  },
  {
    id: 'business-analyst-demo',
    name: 'Business Analyst',
    description: 'A business-focused AI for strategy, analysis, and market research.',
    type: 'specialist',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    capabilities: ['business-analysis', 'strategy-planning', 'market-research'],
    governance_enabled: true,
    icon: <BusinessIcon />,
    color: '#ff9800'
  }
];

const AgentWrappingWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdWrapper, setCreatedWrapper] = useState<AgentWrapper | null>(null);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [selectedDemoAgent, setSelectedDemoAgent] = useState<any>(null);
  
  const { registerWrapper } = useAgentWrappers();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<WizardFormData>({
    // Step 1 defaults
    agentName: '',
    description: '',
    provider: 'OpenAI',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    authMethod: 'Bearer Token',
    apiKey: '',
    model: 'gpt-4',
    
    // Step 2 defaults
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'User message' },
        context: { type: 'string', description: 'Additional context' }
      },
      required: ['message']
    },
    outputSchema: {
      type: 'object',
      properties: {
        response: { type: 'string', description: 'Agent response' },
        confidence: { type: 'number', description: 'Response confidence score' }
      },
      required: ['response']
    },
    
    // Step 3 defaults
    trustThreshold: 0.8,
    complianceLevel: 'standard',
    enableLogging: true,
    enableRateLimiting: true,
    maxRequestsPerMinute: 60,
    
    // Step 4 computed
    estimatedCost: '$0.02/request',
    securityScore: 85
  });

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setError(null);
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleWrapDemoAgent = async (demoAgent: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create a simplified wrapper for demo agent
      const wrapper: AgentWrapper = {
        id: `demo_wrapper_${demoAgent.id}_${Date.now()}`,
        name: `${demoAgent.name} (Demo)`,
        description: `${demoAgent.description} - Wrapped with Promethios governance for demonstration.`,
        version: '1.0.0',
        supportedProviders: [demoAgent.provider],
        inputSchema: {
          id: `${demoAgent.id}_input_schema`,
          version: '1.0.0',
          definition: {
            type: 'object',
            properties: {
              message: { type: 'string', description: 'User message' },
              context: { type: 'string', description: 'Additional context' }
            },
            required: ['message']
          },
          validate: (data: any) => ({
            valid: !!data.message,
            errors: !data.message ? [{ path: 'message', message: 'Message is required', code: 'REQUIRED_FIELD_MISSING' }] : []
          })
        },
        outputSchema: {
          id: `${demoAgent.id}_output_schema`,
          version: '1.0.0',
          definition: {
            type: 'object',
            properties: {
              response: { type: 'string', description: 'Agent response' },
              confidence: { type: 'number', description: 'Response confidence score' },
              governance_score: { type: 'number', description: 'Governance trust score' }
            },
            required: ['response']
          },
          validate: (data: any) => ({
            valid: !!data.response,
            errors: !data.response ? [{ path: 'response', message: 'Response is required', code: 'REQUIRED_FIELD_MISSING' }] : []
          })
        },
        wrap: async (request: any, context: any) => {
          console.log(`Demo wrapping request for ${wrapper.name}:`, request);
          
          // Simulate governance checks for demo
          const governanceChecks = {
            trustScore: Math.random() * 0.3 + 0.7, // 0.7-1.0 for demo
            compliancePass: true,
            rateLimitOk: true,
            demo: true
          };
          
          return {
            ...request,
            _governance: governanceChecks,
            _wrapper: {
              id: wrapper.id,
              name: wrapper.name,
              timestamp: Date.now(),
              demo: true
            }
          };
        },
        unwrap: async (response: any, context: any) => {
          console.log(`Demo unwrapping response for ${wrapper.name}:`, response);
          return {
            ...response,
            _validation: { valid: true, errors: [] },
            _unwrapped: true,
            _demo: true
          };
        },
        initialize: async () => {
          console.log(`Initializing demo wrapper ${wrapper.name}`);
          return true;
        },
        cleanup: async () => {
          console.log(`Cleaning up demo wrapper ${wrapper.name}`);
          return true;
        }
      };

      // Register the demo wrapper
      const success = await registerWrapper(wrapper);
      
      if (success) {
        setCreatedWrapper(wrapper);
        setIsComplete(true);
        setShowDemoDialog(false);
      } else {
        throw new Error('Failed to register demo agent wrapper');
      }
    } catch (err) {
      console.error('Error wrapping demo agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to wrap demo agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create AgentWrapper object
      const wrapper: AgentWrapper = {
        id: `wrapper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.agentName,
        description: formData.description,
        version: '1.0.0',
        supportedProviders: [formData.provider],
        inputSchema: {
          id: `${formData.agentName}_input_schema`,
          version: '1.0.0',
          definition: formData.inputSchema,
          validate: (data: any) => {
            // Basic validation - in real implementation this would use a proper JSON schema validator
            const required = formData.inputSchema.required || [];
            const errors = required.filter(field => !data[field]).map(field => ({
              path: field,
              message: `Required field '${field}' is missing`,
              code: 'REQUIRED_FIELD_MISSING'
            }));
            
            return {
              valid: errors.length === 0,
              errors
            };
          }
        },
        outputSchema: {
          id: `${formData.agentName}_output_schema`,
          version: '1.0.0',
          definition: formData.outputSchema,
          validate: (data: any) => {
            const required = formData.outputSchema.required || [];
            const errors = required.filter(field => !data[field]).map(field => ({
              path: field,
              message: `Required field '${field}' is missing`,
              code: 'REQUIRED_FIELD_MISSING'
            }));
            
            return {
              valid: errors.length === 0,
              errors
            };
          }
        },
        wrap: async (request: any, context: any) => {
          // In a real implementation, this would make the actual API call
          console.log(`Wrapping request for ${wrapper.name}:`, request, context);
          
          // Simulate API call with governance checks
          const governanceChecks = {
            trustScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
            compliancePass: Math.random() > 0.1, // 90% pass rate
            rateLimitOk: true
          };
          
          if (governanceChecks.trustScore < formData.trustThreshold) {
            throw new Error(`Trust score ${governanceChecks.trustScore.toFixed(2)} below threshold ${formData.trustThreshold}`);
          }
          
          if (!governanceChecks.compliancePass) {
            throw new Error('Request failed compliance check');
          }
          
          // Simulate wrapped request with additional metadata
          return {
            ...request,
            _governance: governanceChecks,
            _wrapper: {
              id: wrapper.id,
              name: wrapper.name,
              timestamp: Date.now()
            }
          };
        },
        unwrap: async (response: any, context: any) => {
          console.log(`Unwrapping response for ${wrapper.name}:`, response, context);
          
          // Simulate response processing and validation
          const validation = wrapper.outputSchema.validate(response);
          if (!validation.valid) {
            console.warn('Response validation failed:', validation.errors);
          }
          
          return {
            ...response,
            _validation: validation,
            _unwrapped: true
          };
        },
        initialize: async () => {
          console.log(`Initializing wrapper ${wrapper.name}`);
          // In real implementation, this would test the API connection
          return true;
        },
        cleanup: async () => {
          console.log(`Cleaning up wrapper ${wrapper.name}`);
          return true;
        }
      };

      // Register the wrapper
      const success = await registerWrapper(wrapper);
      
      if (success) {
        setCreatedWrapper(wrapper);
        setIsComplete(true);
      } else {
        throw new Error('Failed to register agent wrapper');
      }
    } catch (err) {
      console.error('Error creating agent wrapper:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent wrapper');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <ApiEndpointStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <AutoDiscoveryStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <SchemaStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <GovernanceStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <ReviewStep
            formData={formData}
            onComplete={handleComplete}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  if (isComplete && createdWrapper) {
    return (
      <Fade in={true}>
        <Container maxWidth="md">
          <SuccessStep 
            wrapper={createdWrapper}
            onCreateAnother={() => {
              setIsComplete(false);
              setActiveStep(0);
              setCreatedWrapper(null);
              setFormData({
                agentName: '',
                description: '',
                provider: 'OpenAI',
                apiEndpoint: 'https://api.openai.com/v1/chat/completions',
                authMethod: 'Bearer Token',
                apiKey: '',
                model: 'gpt-4',
                inputSchema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', description: 'User message' },
                    context: { type: 'string', description: 'Additional context' }
                  },
                  required: ['message']
                },
                outputSchema: {
                  type: 'object',
                  properties: {
                    response: { type: 'string', description: 'Agent response' },
                    confidence: { type: 'number', description: 'Response confidence score' }
                  },
                  required: ['response']
                },
                trustThreshold: 0.8,
                complianceLevel: 'standard',
                enableLogging: true,
                enableRateLimiting: true,
                maxRequestsPerMinute: 60,
                estimatedCost: '$0.02/request',
                securityScore: 85
              });
            }}
          />
        </Container>
      </Fade>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Demo Agents Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, backgroundColor: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
        <Box mb={2}>
          <Typography variant="h6" gutterBottom sx={{ color: '#4caf50', fontWeight: 600 }}>
            🚀 Try a Demo Agent First
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click any demo agent below to auto-populate the wizard and see how easy agent wrapping is!
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          {DEMO_AGENTS.map((agent) => (
            <Grid item xs={12} md={4} key={agent.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid rgba(255,255,255,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    borderColor: agent.color
                  }
                }}
                onClick={() => {
                  // Pre-populate wizard with demo agent data
                  setFormData({
                    agentName: agent.name,
                    description: agent.description,
                    provider: agent.provider,
                    apiEndpoint: agent.provider === 'OpenAI' ? 'https://api.openai.com/v1/chat/completions' :
                                agent.provider === 'Anthropic' ? 'https://api.anthropic.com/v1/messages' :
                                'https://api.cohere.ai/v1/generate',
                    authMethod: 'Bearer Token',
                    apiKey: `demo_${agent.provider.toLowerCase()}_key_12345`,
                    model: agent.model,
                    inputSchema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', description: 'User message' },
                        context: { type: 'string', description: 'Additional context' }
                      },
                      required: ['message']
                    },
                    outputSchema: {
                      type: 'object',
                      properties: {
                        response: { type: 'string', description: 'Agent response' },
                        confidence: { type: 'number', description: 'Response confidence score' }
                      },
                      required: ['response']
                    },
                    trustThreshold: 0.8,
                    complianceLevel: 'standard',
                    enableLogging: true,
                    enableRateLimiting: true,
                    maxRequestsPerMinute: 60,
                    estimatedCost: '$0.02/request',
                    securityScore: 85
                  });
                  setError(null);
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ color: agent.color, mr: 1 }}>
                      {agent.icon}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {agent.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {agent.description}
                  </Typography>
                  <Chip 
                    label={agent.provider} 
                    size="small" 
                    sx={{ 
                      backgroundColor: agent.color, 
                      color: 'white',
                      fontSize: '0.7rem',
                      height: 20
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Wrap New Agent
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Connect your AI agent API with governance controls
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            💡 <strong>Pro Tip:</strong> Enter your API key and we'll automatically discover your agent's capabilities, 
            populate the form fields, and detect available tools and models!
          </Alert>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box>
          {renderStepContent(activeStep)}
        </Box>
      </Paper>
    </Container>
  );
};

export default AgentWrappingWizard;

