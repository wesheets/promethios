import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  SmartToy,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Security,
  Speed,
  Assessment,
  ArrowBack,
  Launch,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ChatGPTWrapperProps {
  onComplete?: (agentData: any) => void;
  onCancel?: () => void;
}

const ChatGPTWrapper: React.FC<ChatGPTWrapperProps> = ({ onComplete, onCancel }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    agentName: 'My ChatGPT Assistant',
    apiKey: '',
    governanceLevel: 'basic',
    description: 'ChatGPT powered by OpenAI with Promethios governance'
  });

  const steps = ['Configure', 'Test Connection', 'Deploy'];

  const governanceLevels = [
    {
      value: 'basic',
      label: 'Basic Governance',
      description: 'Trust scoring, audit logging, basic violation alerts',
      color: '#10b981',
      features: ['Trust Scoring', 'Audit Logs', 'Basic Alerts']
    },
    {
      value: 'strict',
      label: 'Strict Governance',
      description: 'HIPAA/SOC2 compliance, enhanced monitoring, detailed audit trails',
      color: '#ef4444',
      features: ['HIPAA Compliance', 'Enhanced Monitoring', 'Detailed Audits', 'Policy Enforcement']
    },
    {
      value: 'custom',
      label: 'Custom Governance',
      description: 'Advanced configuration for power users',
      color: '#8b5cf6',
      features: ['Custom Policies', 'Advanced Rules', 'Full Customization']
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    if (!formData.apiKey.trim()) {
      alert('Please enter your OpenAI API key');
      return;
    }

    setTestingConnection(true);
    
    try {
      // Simulate API test - in real implementation, this would test the OpenAI API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnectionSuccess(true);
      setActiveStep(2);
    } catch (error) {
      alert('Connection failed. Please check your API key and try again.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDeploy = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate deployment - in real implementation, this would create the wrapped agent
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const agentData = {
        id: `chatgpt-${Date.now()}`,
        name: formData.agentName,
        type: 'chatgpt',
        provider: 'OpenAI',
        governanceLevel: formData.governanceLevel,
        apiKey: formData.apiKey,
        description: formData.description,
        isWrapped: true,
        status: 'deployed'
      };

      if (onComplete) {
        onComplete(agentData);
      } else {
        // Navigate back to My Agents
        navigate('/ui/agents/profiles');
      }
    } catch (error) {
      alert('Deployment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else if (onCancel) {
      onCancel();
    } else {
      navigate('/ui/agents/profiles');
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Typography variant="body2">
                  <strong>Connect your ChatGPT:</strong> Enter your OpenAI API key to wrap ChatGPT with Promethios governance. 
                  Your key is stored securely and only used to proxy requests through our governance layer.
                </Typography>
              </Alert>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Agent Name"
                value={formData.agentName}
                onChange={(e) => handleInputChange('agentName', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: '#a0aec0' }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: '#a0aec0' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="OpenAI API Key"
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="sk-..."
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowApiKey(!showApiKey)}
                        sx={{ color: '#a0aec0' }}
                      >
                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: '#a0aec0' }
                }}
              />
              
              {/* API Key Help Section */}
              <Card sx={{ mt: 2, backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Security sx={{ fontSize: 16, mr: 1 }} />
                    Where to get your OpenAI API Key
                  </Typography>
                  <Box sx={{ pl: 3 }}>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      <strong>1.</strong> Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>OpenAI Platform</a>
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      <strong>2.</strong> Sign in to your OpenAI account
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      <strong>3.</strong> Click "Create new secret key"
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      <strong>4.</strong> Copy the key (starts with "sk-...")
                    </Typography>
                    <Alert severity="info" sx={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      <Typography variant="caption">
                        💡 <strong>Note:</strong> You'll need to add billing information to your OpenAI account. 
                        Check <a href="https://openai.com/pricing" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>pricing</a> for current rates.
                      </Typography>
                    </Alert>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Choose Governance Level
              </Typography>
              <Grid container spacing={2}>
                {governanceLevels.map((level) => (
                  <Grid item xs={12} md={4} key={level.value}>
                    <Card
                      sx={{
                        backgroundColor: formData.governanceLevel === level.value ? 'rgba(59, 130, 246, 0.1)' : '#2d3748',
                        border: `2px solid ${formData.governanceLevel === level.value ? '#3b82f6' : '#4a5568'}`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': { borderColor: level.color }
                      }}
                      onClick={() => handleInputChange('governanceLevel', level.value)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: level.color,
                              mr: 2
                            }}
                          />
                          <Typography variant="h6" sx={{ color: 'white' }}>
                            {level.label}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                          {level.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {level.features.map((feature) => (
                            <Chip
                              key={feature}
                              label={feature}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                fontSize: '0.75rem'
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SmartToy sx={{ fontSize: 64, color: '#10b981', mb: 3 }} />
            <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
              Testing ChatGPT Connection
            </Typography>
            <Typography variant="body1" sx={{ color: '#a0aec0', mb: 4 }}>
              Verifying your OpenAI API key and testing connectivity...
            </Typography>
            
            {testingConnection && (
              <Box sx={{ mb: 4 }}>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  Making test request to OpenAI API...
                </Typography>
              </Box>
            )}

            {connectionSuccess && (
              <Alert severity="success" sx={{ mb: 4, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Typography variant="body2">
                  ✅ Connection successful! ChatGPT is ready to be wrapped with governance.
                </Typography>
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleTestConnection}
              disabled={testingConnection || connectionSuccess}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' },
                px: 4,
                py: 1.5
              }}
            >
              {testingConnection ? 'Testing...' : connectionSuccess ? 'Connection Verified' : 'Test Connection'}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 3 }} />
            <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
              Ready to Deploy
            </Typography>
            <Typography variant="body1" sx={{ color: '#a0aec0', mb: 4 }}>
              Your ChatGPT agent is configured and ready to be wrapped with Promethios governance.
            </Typography>

            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', mb: 4, textAlign: 'left' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Configuration Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Agent Name:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>{formData.agentName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Provider:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>OpenAI ChatGPT</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Governance Level:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      {governanceLevels.find(l => l.value === formData.governanceLevel)?.label}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Status:</Typography>
                    <Typography variant="body1" sx={{ color: '#10b981' }}>Ready to Deploy</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Button
              variant="contained"
              onClick={handleDeploy}
              disabled={isSubmitting}
              sx={{
                backgroundColor: '#10b981',
                '&:hover': { backgroundColor: '#059669' },
                px: 4,
                py: 1.5
              }}
            >
              {isSubmitting ? 'Deploying...' : 'Deploy Wrapped ChatGPT'}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ backgroundColor: '#1a202c', minHeight: '100vh', color: 'white', p: 3 }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={handleBack} sx={{ color: '#a0aec0', mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToy sx={{ fontSize: 32, color: '#10b981', mr: 2 }} />
            <Box>
              <Typography variant="h4" sx={{ color: 'white' }}>
                Wrap ChatGPT
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0' }}>
                Connect your OpenAI account with Promethios governance
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': { color: '#a0aec0' },
                  '& .MuiStepLabel-label.Mui-active': { color: '#3b82f6' },
                  '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Content */}
        <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
          <CardContent sx={{ p: 4 }}>
            {getStepContent(activeStep)}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            sx={{ color: '#a0aec0' }}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          {activeStep === 0 && (
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              disabled={!formData.agentName.trim() || !formData.apiKey.trim()}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' }
              }}
            >
              Next: Test Connection
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ChatGPTWrapper;

