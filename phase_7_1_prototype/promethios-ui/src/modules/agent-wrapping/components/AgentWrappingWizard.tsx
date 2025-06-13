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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAgentWrappers } from '../hooks/useAgentWrappers';
import { AgentWrapper } from '../types';
import ApiEndpointStep from './wizard-steps/ApiEndpointStep';
import SchemaStep from './wizard-steps/SchemaStep';
import GovernanceStep from './wizard-steps/GovernanceStep';
import ReviewStep from './wizard-steps/ReviewStep';
import SuccessStep from './wizard-steps/SuccessStep';

const steps = [
  'API Endpoint',
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

const AgentWrappingWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdWrapper, setCreatedWrapper] = useState<AgentWrapper | null>(null);
  
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

