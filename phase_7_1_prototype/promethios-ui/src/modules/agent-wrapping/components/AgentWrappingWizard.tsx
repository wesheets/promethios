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
  CircularProgress,
  Fade,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Security as GovernanceIcon,
  Psychology as PsychologyIcon,
  Code as CodeIcon,
  Business as BusinessIcon,
  Science as ScienceIcon,
  AutoAwesome as DiscoveryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useEnhancedAgentWrappers } from '../hooks/useEnhancedAgentWrappers';
import { ExtendedWizardFormData } from '../types/introspection';
import ApiEndpointStep from './wizard-steps/ApiEndpointStep';
import { AutoDiscoveryStep } from './wizard-steps/AutoDiscoveryStep';
import SchemaStep from './wizard-steps/SchemaStep';
import GovernanceStep from './wizard-steps/GovernanceStep';
import ReviewStep from './wizard-steps/ReviewStep';
import SuccessStep from './wizard-steps/SuccessStep';

const steps = [
  'API Endpoint',
  'Auto-Discovery',
  'Schema Definition',
  'Governance Rules',
  'Review & Deploy'
];

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
          <SchemaStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <GovernanceStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
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
          <Typography variant="body1" color="text.secondary">
            Connect your AI agent API with governance controls
          </Typography>
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

