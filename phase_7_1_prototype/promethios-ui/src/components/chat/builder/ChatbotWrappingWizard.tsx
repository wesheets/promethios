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
  SmartToy as ChatbotIcon,
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
import ChatbotStorageService from '../../../services/ChatbotStorageService';
import { useAuth } from '../../../context/AuthContext';

const steps = [
  'Chatbot Configuration',
  'Governance Setup',
  'Review & Deploy'
];

export interface ChatbotWizardFormData {
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
  
  // Chatbot-specific configuration
  personality: string;
  useCase: string;
  deploymentChannels: string[];
  
  // Step 4: Review (computed)
  estimatedCost: string;
  securityScore: number;
}

const ChatbotWrappingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [chatbotData, setChatbotData] = useState<any>({
    personality: 'professional',
    useCase: 'customer_support',
    deploymentChannels: ['web']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate chatbot configuration
      console.log('Validating chatbot data:', chatbotData);
      
      const hasName = chatbotData.agentName?.trim() || chatbotData.identity?.name?.trim();
      const hasEndpoint = chatbotData.apiEndpoint?.trim() || chatbotData.endpoint?.trim();
      const hasKey = chatbotData.apiKey?.trim() || chatbotData.key?.trim();
      const hasProvider = chatbotData.provider?.trim();
      
      if (!hasName || !hasEndpoint || !hasKey || !hasProvider) {
        console.log('Validation failed - missing required fields');
        alert('Please complete all required fields: Chatbot Name, API Endpoint, API Key, and Provider');
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
      if (!currentUser) {
        throw new Error('No user authenticated');
      }

      console.log('🚀 Starting governed chatbot creation...');
      console.log('Using user:', currentUser.uid);
      
      // Debug: Check if the method exists
      const chatbotService = ChatbotStorageService.getInstance();
      console.log('🔍 ChatbotStorageService instance:', chatbotService);
      console.log('🔍 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chatbotService)));
      console.log('🔍 createChatbot method exists:', typeof chatbotService.createChatbot === 'function');

      // Create governance policy from wizard data
      const governancePolicy = {
        trustThreshold: chatbotData.trustThreshold || 85,
        securityLevel: chatbotData.securityLevel || 'standard',
        complianceFramework: chatbotData.complianceFramework || 'general',
        enableAuditLogging: chatbotData.enableAuditLogging !== false,
        enableDataRetention: chatbotData.enableDataRetention !== false,
        enableRateLimiting: chatbotData.enableRateLimiting || false,
        enableContentFiltering: chatbotData.enableContentFiltering || false,
        enableRealTimeMonitoring: chatbotData.enableRealTimeMonitoring !== false,
        enableEscalationPolicies: chatbotData.enableEscalationPolicies || false,
        maxRequestsPerMinute: chatbotData.maxRequestsPerMinute || 100,
        policyRules: [],
        complianceControls: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      // Create compliance controls based on framework
      const complianceControls: any[] = [];
      
      if (governancePolicy.complianceFramework === 'healthcare') {
        complianceControls.push(
          {
            id: 'hipaa-164-308',
            frameworkId: 'hipaa',
            controlId: '164.308',
            name: 'Administrative Safeguards',
            description: 'Security management process and access authorization',
            requirements: [
              'Implement security management process',
              'Implement access authorization procedures',
              'Implement workforce training procedures'
            ],
            monitoringLevel: 'alert',
            enabled: true
          }
        );
      }

      governancePolicy.complianceControls = complianceControls;

      // Create policy rules for governance monitoring
      governancePolicy.policyRules = [
        {
          id: 'trust-threshold-check',
          name: 'Trust Threshold Validation',
          description: 'Validates chatbot responses meet minimum trust threshold',
          condition: `trust_score >= ${governancePolicy.trustThreshold}`,
          action: 'allow',
          parameters: { threshold: governancePolicy.trustThreshold },
          priority: 1
        }
      ];

      // Create the governed chatbot
      const chatbotId = `chatbot-${Date.now()}`;
      const chatbotName = chatbotData.identity?.name || chatbotData.agentName || 'Governed Chatbot';
      
      const chatbotProfile = {
        // Base agent structure for compatibility
        identity: {
          id: chatbotId,
          name: chatbotName,
          version: '1.0.0',
          description: chatbotData.identity?.description || chatbotData.description || 'Governed AI Chatbot',
          creationDate: new Date(),
          lastModifiedDate: new Date(),
        },
        agentName: chatbotName,
        apiDetails: {
          endpoint: chatbotData.apiEndpoint || chatbotData.endpoint || 'https://api.openai.com/v1',
          key: chatbotData.apiKey || chatbotData.key || '',
          provider: chatbotData.provider || 'OpenAI',
          selectedModel: chatbotData.selectedModel || chatbotData.model || (chatbotData.provider === 'Anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4'),
          selectedCapabilities: chatbotData.capabilities || [],
          selectedContextLength: chatbotData.contextLength || 4096,
          discoveredInfo: chatbotData.discoveredInfo || null,
        },
        governancePolicy,
        isWrapped: true,
        isDeployed: false,
        healthStatus: 'healthy' as const,
        trustLevel: governancePolicy.trustThreshold >= 90 ? 'high' : 
                   (governancePolicy.trustThreshold >= 75 ? 'medium' : 'low'),
        lastActivity: new Date(),
        
        // Chatbot-specific configuration
        chatbotConfig: {
          personality: chatbotData.personality || 'professional',
          useCase: chatbotData.useCase || 'customer_support',
          deploymentChannels: chatbotData.deploymentChannels || ['web'],
          brandSettings: {
            primaryColor: '#3182ce',
            secondaryColor: '#2d3748',
            fontFamily: 'Inter, sans-serif'
          }
        },
        
        // Business metrics
        businessMetrics: {
          customerSatisfaction: 0,
          averageResponseTime: 0,
          resolutionRate: 0,
          conversationVolume: 0,
          lastUpdated: new Date()
        },
        
        // Metadata
        chatbotMetadata: {
          parentAgentId: null, // This is a standalone chatbot, not converted from agent
          chatbotType: 'governed_byok',
          creationMethod: 'chatbot_wrapping_wizard',
          governanceId: `G-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
        }
      };

      console.log('Creating governed chatbot:', chatbotProfile);

      // Save the chatbot using ChatbotStorageService (reuse existing instance)
      await chatbotService.createChatbot(currentUser.uid, chatbotProfile);

      console.log('🎉 Governed chatbot successfully created');
      setShowSuccessDialog(true);
      
    } catch (error) {
      console.error('❌ Error creating governed chatbot:', error);
      alert('Error creating governed chatbot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    navigate('/ui/chat/chatbots');
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <EnhancedAgentRegistration
              onDataChange={(data) => {
                console.log('Chatbot data changed:', data);
                setChatbotData(data);
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
              Configure governance and compliance settings for your chatbot.
            </Alert>
            
            <Grid container spacing={3}>
              {/* Trust & Security Configuration */}
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                      Trust & Security
                    </Typography>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 2 }}>
                      Configure trust thresholds and security policies
                    </Typography>
                    
                    {/* Trust Threshold Slider */}
                    <Box sx={{ mb: 3 }}>
                      <Typography gutterBottom sx={{ color: 'white' }}>Trust Threshold: {chatbotData.trustThreshold || 85}%</Typography>
                      <Slider
                        value={chatbotData.trustThreshold || 85}
                        onChange={(e, value) => setChatbotData(prev => ({ ...prev, trustThreshold: value }))}
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
                        sx={{
                          color: '#3182ce',
                          '& .MuiSlider-markLabel': { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                      />
                    </Box>
                    
                    {/* Security Level Selection */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Security Level</InputLabel>
                      <Select
                        value={chatbotData.securityLevel || 'standard'}
                        onChange={(e) => setChatbotData(prev => ({ ...prev, securityLevel: e.target.value }))}
                        label="Security Level"
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '& .MuiSvgIcon-root': { color: 'white' }
                        }}
                      >
                        <MenuItem value="lenient">Lenient - Basic security checks</MenuItem>
                        <MenuItem value="standard">Standard - Balanced security</MenuItem>
                        <MenuItem value="strict">Strict - Maximum security</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Compliance Framework */}
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                      Compliance Framework
                    </Typography>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 2 }}>
                      Select applicable compliance requirements
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Compliance Framework</InputLabel>
                      <Select
                        value={chatbotData.complianceFramework || 'general'}
                        onChange={(e) => setChatbotData(prev => ({ ...prev, complianceFramework: e.target.value }))}
                        label="Compliance Framework"
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '& .MuiSvgIcon-root': { color: 'white' }
                        }}
                      >
                        <MenuItem value="general">General Business</MenuItem>
                        <MenuItem value="healthcare">Healthcare (HIPAA)</MenuItem>
                        <MenuItem value="financial">Financial (SOX)</MenuItem>
                        <MenuItem value="gdpr">GDPR Compliance</MenuItem>
                        <MenuItem value="soc2">SOC 2</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Governance Features */}
                    <Box sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={chatbotData.enableAuditLogging !== false}
                            onChange={(e) => setChatbotData(prev => ({ ...prev, enableAuditLogging: e.target.checked }))}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3182ce' } }}
                          />
                        }
                        label={<Typography sx={{ color: 'white' }}>Enable Audit Logging</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={chatbotData.enableRealTimeMonitoring !== false}
                            onChange={(e) => setChatbotData(prev => ({ ...prev, enableRealTimeMonitoring: e.target.checked }))}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3182ce' } }}
                          />
                        }
                        label={<Typography sx={{ color: 'white' }}>Enable Real-time Monitoring</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={chatbotData.enableContentFiltering || false}
                            onChange={(e) => setChatbotData(prev => ({ ...prev, enableContentFiltering: e.target.checked }))}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3182ce' } }}
                          />
                        }
                        label={<Typography sx={{ color: 'white' }}>Enable Content Filtering</Typography>}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Chatbot-specific Configuration */}
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                      Chatbot Configuration
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Personality</InputLabel>
                          <Select
                            value={chatbotData.personality || 'no_modification'}
                            onChange={(e) => setChatbotData(prev => ({ ...prev, personality: e.target.value }))}
                            label="Personality"
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                              '& .MuiSvgIcon-root': { color: 'white' }
                            }}
                          >
                            <MenuItem value="no_modification">No Modification (Keep Original)</MenuItem>
                            <MenuItem value="professional">Professional</MenuItem>
                            <MenuItem value="friendly">Friendly</MenuItem>
                            <MenuItem value="casual">Casual</MenuItem>
                            <MenuItem value="helpful">Helpful</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Use Case</InputLabel>
                          <Select
                            value={chatbotData.useCase || 'no_modification'}
                            onChange={(e) => setChatbotData(prev => ({ ...prev, useCase: e.target.value }))}
                            label="Use Case"
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                              '& .MuiSvgIcon-root': { color: 'white' }
                            }}
                          >
                            <MenuItem value="no_modification">No Modification (Keep Original)</MenuItem>
                            <MenuItem value="customer_support">Customer Support</MenuItem>
                            <MenuItem value="sales">Sales Assistant</MenuItem>
                            <MenuItem value="general">General Assistant</MenuItem>
                            <MenuItem value="technical">Technical Support</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Deployment Channels</InputLabel>
                          <Select
                            multiple
                            value={chatbotData.deploymentChannels || ['governance_only']}
                            onChange={(e) => setChatbotData(prev => ({ ...prev, deploymentChannels: e.target.value }))}
                            label="Deployment Channels"
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                              '& .MuiSvgIcon-root': { color: 'white' }
                            }}
                          >
                            <MenuItem value="governance_only">Governance Only (No Channel Modifications)</MenuItem>
                            <MenuItem value="web">Web Widget</MenuItem>
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="slack">Slack</MenuItem>
                            <MenuItem value="api">API</MenuItem>
                          </Select>
                        </FormControl>
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
              Review & Deploy Governed Chatbot
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              Review your governed chatbot configuration before deployment.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                      Chatbot Details
                    </Typography>
                    <Typography sx={{ color: 'white' }}><strong>Name:</strong> {chatbotData.agentName || 'Governed Chatbot'}</Typography>
                    <Typography sx={{ color: 'white' }}><strong>Provider:</strong> {chatbotData.provider || 'OpenAI'}</Typography>
                    <Typography sx={{ color: 'white' }}><strong>Model:</strong> {chatbotData.model || 'GPT-4'}</Typography>
                    <Typography sx={{ color: 'white' }}><strong>Personality:</strong> {
                      chatbotData.personality === 'no_modification' ? 'No Modification (Keep Original)' : 
                      (chatbotData.personality || 'No Modification')
                    }</Typography>
                    <Typography sx={{ color: 'white' }}><strong>Use Case:</strong> {
                      chatbotData.useCase === 'no_modification' ? 'No Modification (Keep Original)' : 
                      (chatbotData.useCase || 'No Modification')
                    }</Typography>
                    <Typography sx={{ color: 'white' }}><strong>Deployment:</strong> {
                      chatbotData.deploymentChannels?.includes('governance_only') ? 'Governance Only' :
                      (chatbotData.deploymentChannels?.join(', ') || 'Governance Only')
                    }</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                      Governance Settings
                    </Typography>
                    <Typography sx={{ color: 'white' }}><strong>Trust Threshold:</strong> {chatbotData.trustThreshold || 85}%</Typography>
                    <Typography sx={{ color: 'white' }}><strong>Security Level:</strong> {chatbotData.securityLevel || 'Standard'}</Typography>
                    <Typography sx={{ color: 'white' }}><strong>Compliance:</strong> {chatbotData.complianceFramework || 'General'}</Typography>
                    <Typography sx={{ color: 'white' }}><strong>Audit Logging:</strong> {chatbotData.enableAuditLogging !== false ? 'Enabled' : 'Disabled'}</Typography>
                    <Typography sx={{ color: 'white' }}><strong>Real-time Monitoring:</strong> {chatbotData.enableRealTimeMonitoring !== false ? 'Enabled' : 'Disabled'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, backgroundColor: '#1a202c', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <ChatbotIcon sx={{ fontSize: 40, color: '#3182ce', mr: 2 }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Create Governed Chatbot
            </Typography>
            <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
              Create a customer-facing chatbot with enterprise governance controls
            </Typography>
          </Box>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'rgba(255, 255, 255, 0.7)' } }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={{ color: 'white' }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : <ArrowForward />}
            disabled={isSubmitting}
            sx={{
              backgroundColor: '#3182ce',
              '&:hover': { backgroundColor: '#2c5aa0' }
            }}
          >
            {isSubmitting ? 'Creating...' : (activeStep === steps.length - 1 ? 'Create Governed Chatbot' : 'Next')}
          </Button>
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
            backgroundColor: '#1a202c',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircleIcon sx={{ color: '#10b981', mr: 2 }} />
          Governed Chatbot Created Successfully!
        </DialogTitle>
        <DialogContent>
          <Typography>
            Your governed chatbot has been created and is ready for deployment. 
            You can now manage it from the My Chatbots page.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleSuccessClose}
            variant="contained"
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' }
            }}
          >
            Go to My Chatbots
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChatbotWrappingWizard;

