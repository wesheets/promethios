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

export default AgentWrappingWizard;
