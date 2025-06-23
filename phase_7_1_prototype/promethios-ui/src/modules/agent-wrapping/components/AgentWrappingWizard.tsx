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
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Security as GovernanceIcon,
  CheckCircle,
  ArrowBack,
  ArrowForward,
  Code as CodeIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EnhancedAgentRegistration from '../../../components/EnhancedAgentRegistration';
import { UserAgentStorageService } from '../../../services/UserAgentStorageService';
import { useDemoAuth } from '../../../hooks/useDemoAuth';

const steps = [
  'Agent Configuration',
  'Governance Setup',
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser: demoUser } = useDemoAuth();
  
  // Check if we're wrapping an existing agent
  const agentId = searchParams.get('agentId');
  const isWrappingExisting = Boolean(agentId);
  
  // Start at step 1 (Governance) if wrapping existing agent, step 0 if new
  const [activeStep, setActiveStep] = useState(isWrappingExisting ? 1 : 0);
  const [agentData, setAgentData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(isWrappingExisting);

  // Load existing agent data if wrapping an existing agent
  useEffect(() => {
    const loadExistingAgent = async () => {
      console.log('Loading agent - agentId:', agentId, 'demoUser:', demoUser);
      
      if (!agentId) {
        console.log('No agentId provided, staying on new agent flow');
        return;
      }
      
      if (!demoUser) {
        console.log('No demoUser available, waiting...');
        return;
      }
      
      setIsLoading(true);
      try {
        const storageService = new UserAgentStorageService();
        storageService.setCurrentUser(demoUser.uid);
        console.log('Created storage service for user:', demoUser.uid);
        
        const existingAgent = await storageService.getAgent(agentId);
        console.log('Storage service returned:', existingAgent);
        
        if (existingAgent) {
          setAgentData(existingAgent);
          console.log('Successfully loaded existing agent for wrapping:', existingAgent);
        } else {
          console.warn('Agent not found in storage');
          // Don't redirect automatically - let user stay and see the error
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error loading existing agent:', error);
        // Don't redirect automatically - let user stay and see the error
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAgent();
  }, [agentId, demoUser, navigate]);

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error submitting agent:', error);
      alert('Error creating agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    navigate('/ui/agents/profiles');
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <EnhancedAgentRegistration
              onAgentAdded={(agent) => {
                setAgentData(agent);
                console.log('Agent configured:', agent);
              }}
              isDialog={false}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Governance Setup
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Configure governance and compliance settings for your agent.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Trust & Security
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configure trust thresholds and security policies
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Chip label="Trust Score: 85%" color="success" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Compliance
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ensure regulatory compliance and audit logging
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Chip label="GDPR Compliant" color="primary" />
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
            <Typography variant="h6" gutterBottom>
              Review & Deploy
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your agent is ready for deployment!
            </Alert>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Agent Summary
                </Typography>
                <Typography><strong>Name:</strong> {agentData.agentName || 'My Agent'}</Typography>
                <Typography><strong>Provider:</strong> {agentData.provider || 'OpenAI'}</Typography>
                <Typography><strong>Model:</strong> {agentData.model || 'GPT-4'}</Typography>
                <Typography><strong>Governance:</strong> Enabled</Typography>
                <Typography><strong>Trust Score:</strong> 85%</Typography>
              </CardContent>
            </Card>
          </Box>
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Agent Wrapping Wizard
      </Typography>
      
      {isWrappingExisting && agentData.agentName && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>Wrapping existing agent:</strong> {agentData.agentName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Skipping configuration step since agent details are already available.
          </Typography>
        </Alert>
      )}
      
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <Typography>Loading agent data...</Typography>
        </Box>
      ) : (
        <Paper sx={{ p: 4, mt: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || (isWrappingExisting && activeStep === 1)}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting}
                endIcon={<CheckCircle />}
              >
                {isSubmitting ? 'Creating Agent...' : 'Deploy Agent'}
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
        </Paper>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={handleSuccessClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            Agent Successfully Created!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Your agent has been successfully wrapped and deployed with governance controls.
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

