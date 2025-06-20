import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Chip,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  AutoAwesome,
  CheckCircle,
  ArrowBack,
  Extension,
  Security,
  Launch,
  Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface GeminiWrapperStubProps {
  onComplete?: (agentData: any) => void;
  onCancel?: () => void;
}

const GeminiWrapperStub: React.FC<GeminiWrapperStubProps> = ({ onComplete, onCancel }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedGovernance, setSelectedGovernance] = useState('basic');

  const steps = ['Install Extension', 'Choose Protection', 'Start Using'];

  const governanceLevels = [
    {
      value: 'basic',
      label: 'Keep Me Safe',
      description: 'Basic protection for everyday use',
      color: '#f59e0b',
      features: ['Trust Scoring', 'Safety Alerts', 'Basic Logging'],
      recommended: true
    },
    {
      value: 'strict',
      label: 'Enterprise Protection',
      description: 'Full compliance for business use',
      color: '#ef4444',
      features: ['HIPAA Compliance', 'Advanced Monitoring', 'Detailed Audits', 'Policy Enforcement']
    }
  ];

  const handleInstallExtension = async () => {
    setIsInstalling(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsInstalling(false);
    setActiveStep(1);
  };

  const handleSelectGovernance = (level: string) => {
    setSelectedGovernance(level);
    setActiveStep(2);
  };

  const handleComplete = async () => {
    setIsDeploying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const agentData = {
      id: `gemini-wrapped-${Date.now()}`,
      name: 'Gemini (Governed)',
      type: 'gemini-wrapped',
      provider: 'Google',
      governanceLevel: selectedGovernance,
      description: 'Your existing Gemini account with Promethios governance',
      isWrapped: true,
      status: 'active',
      setupMethod: 'browser-extension'
    };

    if (onComplete) {
      onComplete(agentData);
    } else {
      navigate('/ui/agents/profiles');
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
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Extension sx={{ fontSize: 80, color: '#f59e0b', mb: 3 }} />
            <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
              Install Promethios Extension
            </Typography>
            <Typography variant="body1" sx={{ color: '#a0aec0', mb: 4, maxWidth: 600, mx: 'auto' }}>
              Add governance to your existing Gemini account with one simple browser extension. 
              Continue using Gemini exactly as you do now, but with enterprise-grade protection.
            </Typography>

            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', mb: 4, textAlign: 'left', maxWidth: 500, mx: 'auto' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <AutoAwesome sx={{ mr: 2, color: '#f59e0b' }} />
                  What You'll Get
                </Typography>
                <Box sx={{ pl: 3 }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1, display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ fontSize: 16, mr: 1, color: '#f59e0b' }} />
                    Same Gemini interface you love
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1, display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ fontSize: 16, mr: 1, color: '#f59e0b' }} />
                    Real-time trust scores and safety alerts
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1, display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ fontSize: 16, mr: 1, color: '#f59e0b' }} />
                    Complete conversation audit trails
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ fontSize: 16, mr: 1, color: '#f59e0b' }} />
                    Enterprise compliance (HIPAA, SOC2)
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {isInstalling ? (
              <Box>
                <LinearProgress sx={{ mb: 2, maxWidth: 400, mx: 'auto' }} />
                <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
                  Installing Promethios Extension...
                </Typography>
              </Box>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleInstallExtension}
                startIcon={<Download />}
                sx={{
                  backgroundColor: '#f59e0b',
                  '&:hover': { backgroundColor: '#d97706' },
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                Install Extension (Free)
              </Button>
            )}

            <Typography variant="caption" sx={{ color: '#6b7280', mt: 2, display: 'block' }}>
              Works with Chrome, Firefox, Safari, and Edge
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Security sx={{ fontSize: 64, color: '#f59e0b', mb: 2 }} />
              <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
                Choose Your Protection Level
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0', maxWidth: 600, mx: 'auto' }}>
                Select the level of governance that fits your needs. You can change this anytime.
              </Typography>
            </Box>

            <Grid container spacing={3} sx={{ maxWidth: 800, mx: 'auto' }}>
              {governanceLevels.map((level) => (
                <Grid item xs={12} md={6} key={level.value}>
                  <Card
                    sx={{
                      backgroundColor: selectedGovernance === level.value ? 'rgba(245, 158, 11, 0.1)' : '#2d3748',
                      border: `2px solid ${selectedGovernance === level.value ? '#f59e0b' : '#4a5568'}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: level.color },
                      position: 'relative'
                    }}
                    onClick={() => setSelectedGovernance(level.value)}
                  >
                    {level.recommended && (
                      <Chip
                        label="Recommended"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: 16,
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: level.color,
                            mr: 2
                          }}
                        />
                        <Typography variant="h5" sx={{ color: 'white' }}>
                          {level.label}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
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

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                onClick={() => handleSelectGovernance(selectedGovernance)}
                sx={{
                  backgroundColor: '#f59e0b',
                  '&:hover': { backgroundColor: '#d97706' },
                  px: 4,
                  py: 1.5
                }}
              >
                Continue with {governanceLevels.find(l => l.value === selectedGovernance)?.label}
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: '#f59e0b', mb: 3 }} />
            <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
              You're All Set!
            </Typography>
            <Typography variant="body1" sx={{ color: '#a0aec0', mb: 4, maxWidth: 600, mx: 'auto' }}>
              Gemini is now protected with Promethios governance. Visit gemini.google.com and start using it normally - 
              you'll see trust scores and safety alerts right in the interface.
            </Typography>

            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', mb: 4, textAlign: 'left', maxWidth: 500, mx: 'auto' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Setup Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Service:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>Gemini</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Protection:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      {governanceLevels.find(l => l.value === selectedGovernance)?.label}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Status:</Typography>
                    <Typography variant="body1" sx={{ color: '#f59e0b' }}>Active</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Method:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>Browser Extension</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => window.open('https://gemini.google.com', '_blank')}
                startIcon={<Launch />}
                sx={{
                  borderColor: '#f59e0b',
                  color: '#f59e0b',
                  '&:hover': { borderColor: '#d97706', backgroundColor: 'rgba(245, 158, 11, 0.1)' }
                }}
              >
                Open Gemini
              </Button>
              <Button
                variant="contained"
                onClick={handleComplete}
                disabled={isDeploying}
                sx={{
                  backgroundColor: '#f59e0b',
                  '&:hover': { backgroundColor: '#d97706' },
                  px: 4,
                  py: 1.5
                }}
              >
                {isDeploying ? 'Finishing Setup...' : 'Complete Setup'}
              </Button>
            </Box>
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
            <AutoAwesome sx={{ fontSize: 32, color: '#f59e0b', mr: 2 }} />
            <Box>
              <Typography variant="h4" sx={{ color: 'white' }}>
                Wrap Gemini
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0' }}>
                Add governance to your existing Gemini account
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
                  '& .MuiStepLabel-label.Mui-active': { color: '#f59e0b' },
                  '& .MuiStepLabel-label.Mui-completed': { color: '#f59e0b' }
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
        {activeStep > 0 && activeStep < 2 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              sx={{ color: '#a0aec0' }}
            >
              Back
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default GeminiWrapperStub;

