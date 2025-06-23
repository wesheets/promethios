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
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Security as GovernanceIcon,
  CheckCircle,
  CheckCircle as CheckCircleIcon,
  ArrowBack,
  ArrowForward,
  Code as CodeIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EnhancedAgentRegistration from '../../../components/EnhancedAgentRegistration';
import { UserAgentStorageService, AgentProfile, GovernancePolicy } from '../../../services/UserAgentStorageService';
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
      if (!demoUser) {
        throw new Error('No user authenticated');
      }

      // Create governance policy from wizard data
      const governancePolicy: GovernancePolicy = {
        trustThreshold: agentData.trustThreshold || 85,
        securityLevel: agentData.securityLevel || 'standard',
        complianceFramework: agentData.complianceFramework || 'general',
        enableAuditLogging: agentData.enableAuditLogging !== false,
        enableDataRetention: agentData.enableDataRetention !== false,
        enableRateLimiting: agentData.enableRateLimiting || false,
        enableContentFiltering: agentData.enableContentFiltering || false,
        enableRealTimeMonitoring: agentData.enableRealTimeMonitoring !== false,
        enableEscalationPolicies: agentData.enableEscalationPolicies || false,
        maxRequestsPerMinute: agentData.maxRequestsPerMinute || 100,
        policyRules: [], // Will be populated by backend policy engine
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      // Update agent with governance policy
      const updatedAgent: AgentProfile = {
        ...agentData,
        identity: agentData.identity || {
          id: agentData.agentId || `agent-${Date.now()}`,
          name: agentData.agentName || agentData.identity?.name || 'Wrapped Agent',
          version: '1.0.0',
          description: agentData.description || agentData.identity?.description || 'Agent wrapped with governance controls',
          ownerId: demoUser.uid,
          creationDate: new Date(),
          lastModifiedDate: new Date(),
          status: 'active',
        },
        governancePolicy,
        isWrapped: true,
        isDeployed: true,
        healthStatus: 'healthy' as const,
        trustLevel: governancePolicy.trustThreshold >= 90 ? 'high' : 
                   governancePolicy.trustThreshold >= 75 ? 'medium' : 'low',
        attestationCount: 0,
        lastActivity: new Date(),
        latestScorecard: null,
      };

      // Save to storage
      const storageService = new UserAgentStorageService();
      storageService.setCurrentUser(demoUser.uid);
      await storageService.saveAgent(updatedAgent);

      console.log('Agent wrapped and deployed with governance policy:', updatedAgent);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error deploying agent:', error);
      alert('Error deploying agent. Please try again.');
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
            
            {/* Show agent being wrapped */}
            {isWrappingExisting && agentData.identity?.name && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Wrapping existing agent:</strong> {agentData.identity.name}
                </Typography>
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {/* Trust & Security Configuration */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Trust & Security
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Configure trust thresholds and security policies
                    </Typography>
                    
                    {/* Trust Threshold Slider */}
                    <Box sx={{ mb: 3 }}>
                      <Typography gutterBottom>Trust Threshold: {agentData.trustThreshold || 85}%</Typography>
                      <Slider
                        value={agentData.trustThreshold || 85}
                        onChange={(e, value) => setAgentData(prev => ({ ...prev, trustThreshold: value }))}
                        min={50}
                        max={100}
                        step={5}
                        marks={[
                          { value: 50, label: '50%' },
                          { value: 75, label: '75%' },
                          { value: 90, label: '90%' },
                          { value: 100, label: '100%' }
                        ]}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    
                    {/* Security Level Selection */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Security Level</InputLabel>
                      <Select
                        value={agentData.securityLevel || 'standard'}
                        onChange={(e) => setAgentData(prev => ({ ...prev, securityLevel: e.target.value }))}
                        label="Security Level"
                      >
                        <MenuItem value="lenient">Lenient - Basic security checks</MenuItem>
                        <MenuItem value="standard">Standard - Balanced security</MenuItem>
                        <MenuItem value="strict">Strict - Maximum security</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {/* Rate Limiting */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={agentData.enableRateLimiting || false}
                          onChange={(e) => setAgentData(prev => ({ ...prev, enableRateLimiting: e.target.checked }))}
                        />
                      }
                      label="Enable Rate Limiting"
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Compliance Configuration */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Compliance
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Ensure regulatory compliance and audit logging
                    </Typography>
                    
                    {/* Compliance Framework Selection */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Compliance Framework</InputLabel>
                      <Select
                        value={agentData.complianceFramework || 'general'}
                        onChange={(e) => setAgentData(prev => ({ ...prev, complianceFramework: e.target.value }))}
                        label="Compliance Framework"
                      >
                        <MenuItem value="general">General - Basic compliance</MenuItem>
                        <MenuItem value="financial">Financial - SOX, PCI DSS</MenuItem>
                        <MenuItem value="healthcare">Healthcare - HIPAA</MenuItem>
                        <MenuItem value="legal">Legal - Attorney-client privilege</MenuItem>
                        <MenuItem value="gdpr">GDPR - EU data protection</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {/* Audit Logging */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={agentData.enableAuditLogging !== false}
                          onChange={(e) => setAgentData(prev => ({ ...prev, enableAuditLogging: e.target.checked }))}
                        />
                      }
                      label="Enable Audit Logging"
                      sx={{ mb: 1 }}
                    />
                    
                    {/* Data Retention */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={agentData.enableDataRetention !== false}
                          onChange={(e) => setAgentData(prev => ({ ...prev, enableDataRetention: e.target.checked }))}
                        />
                      }
                      label="Enable Data Retention Policies"
                      sx={{ mb: 2 }}
                    />
                    
                    {/* Compliance Status Indicator */}
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`${agentData.complianceFramework?.toUpperCase() || 'GENERAL'} Compliant`} 
                        color="primary" 
                        icon={<CheckCircleIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Advanced Governance Options */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Advanced Governance Options
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agentData.enableContentFiltering || false}
                              onChange={(e) => setAgentData(prev => ({ ...prev, enableContentFiltering: e.target.checked }))}
                            />
                          }
                          label="Content Filtering"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agentData.enableRealTimeMonitoring !== false}
                              onChange={(e) => setAgentData(prev => ({ ...prev, enableRealTimeMonitoring: e.target.checked }))}
                            />
                          }
                          label="Real-time Monitoring"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agentData.enableEscalationPolicies || false}
                              onChange={(e) => setAgentData(prev => ({ ...prev, enableEscalationPolicies: e.target.checked }))}
                            />
                          }
                          label="Escalation Policies"
                        />
                      </Grid>
                    </Grid>
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
              Your agent is ready for deployment with governance controls!
            </Alert>
            
            <Grid container spacing={3}>
              {/* Agent Summary */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Agent Summary
                    </Typography>
                    <Typography><strong>Name:</strong> {agentData.identity?.name || agentData.agentName || 'My Agent'}</Typography>
                    <Typography><strong>Provider:</strong> {agentData.apiDetails?.provider || agentData.provider || 'OpenAI'}</Typography>
                    <Typography><strong>Model:</strong> {agentData.apiDetails?.selectedModel || agentData.model || 'GPT-4'}</Typography>
                    <Typography><strong>Status:</strong> Ready for Deployment</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Governance Configuration Summary */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Governance Configuration
                    </Typography>
                    <Typography><strong>Trust Threshold:</strong> {agentData.trustThreshold || 85}%</Typography>
                    <Typography><strong>Security Level:</strong> {(agentData.securityLevel || 'standard').charAt(0).toUpperCase() + (agentData.securityLevel || 'standard').slice(1)}</Typography>
                    <Typography><strong>Compliance Framework:</strong> {(agentData.complianceFramework || 'general').toUpperCase()}</Typography>
                    <Typography><strong>Audit Logging:</strong> {agentData.enableAuditLogging !== false ? 'Enabled' : 'Disabled'}</Typography>
                    <Typography><strong>Rate Limiting:</strong> {agentData.enableRateLimiting ? 'Enabled' : 'Disabled'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Compliance Status */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Compliance & Security Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip 
                        label={`${(agentData.complianceFramework || 'general').toUpperCase()} Compliant`} 
                        color="primary" 
                        icon={<CheckCircleIcon />}
                      />
                      <Chip 
                        label={`Trust Score: ${agentData.trustThreshold || 85}%`} 
                        color="success" 
                        icon={<CheckCircleIcon />}
                      />
                      {agentData.enableAuditLogging !== false && (
                        <Chip label="Audit Logging Enabled" color="info" icon={<CheckCircleIcon />} />
                      )}
                      {agentData.enableRateLimiting && (
                        <Chip label="Rate Limiting Enabled" color="warning" icon={<CheckCircleIcon />} />
                      )}
                      {agentData.enableRealTimeMonitoring !== false && (
                        <Chip label="Real-time Monitoring" color="secondary" icon={<CheckCircleIcon />} />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      Your agent will be deployed with the selected governance controls and compliance framework. 
                      All interactions will be monitored and logged according to your configuration.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
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

