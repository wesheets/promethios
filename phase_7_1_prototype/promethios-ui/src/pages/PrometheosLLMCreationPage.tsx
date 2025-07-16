/**
 * Promethios LLM Creation Page
 * 
 * Page wrapper for the Promethios LLM Creation Wizard
 * Handles the wizard as a full page instead of a modal dialog
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  Alert
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Security,
  CheckCircle,
  Warning,
  Speed as SpeedIcon,
  Settings,
  Preview,
  Launch,
  ArrowBack
} from '@mui/icons-material';
import { prometheosLLMService } from '../services/PrometheosLLMService';

interface AgentConfig {
  name: string;
  description: string;
  responseStyle: string;
  complianceMode: string;
  trustThreshold: number;
  maxTokens: number;
  temperature: number;
}

const steps = [
  'Basic Information',
  'Configuration',
  'Review & Create'
];

const responseStyles = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-appropriate responses' },
  { value: 'conversational', label: 'Conversational', description: 'Friendly, natural dialogue style' },
  { value: 'technical', label: 'Technical', description: 'Detailed, precise technical explanations' },
  { value: 'creative', label: 'Creative', description: 'Imaginative, expressive responses' }
];

const complianceModes = [
  { value: 'strict', label: 'Strict', description: 'Maximum governance enforcement' },
  { value: 'balanced', label: 'Balanced', description: 'Optimal balance of flexibility and compliance' },
  { value: 'permissive', label: 'Permissive', description: 'Minimal restrictions, maximum flexibility' }
];

// Improved text field styling for better visibility
const textFieldStyles = {
  mb: 3,
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#2d3748',
    color: '#ffffff',
    '& fieldset': {
      borderColor: '#4a5568',
    },
    '&:hover fieldset': {
      borderColor: '#718096',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#3b82f6',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#e2e8f0',
    '&.Mui-focused': {
      color: '#3b82f6',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#ffffff !important',
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: '#cbd5e0 !important',
    opacity: 1,
  },
  '& .MuiSelect-select': {
    color: '#ffffff !important',
  },
  '& .MuiSelect-icon': {
    color: '#cbd5e0',
  },
};

const PrometheosLLMCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAgent, setCreatedAgent] = useState<any>(null);

  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    responseStyle: 'professional',
    complianceMode: 'strict',
    trustThreshold: 0.8,
    maxTokens: 2048,
    temperature: 0.7
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    try {
      const agent = await prometheosLLMService.createAgent(config);
      setCreatedAgent(agent);
      setActiveStep(steps.length); // Move to success step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return config.name.trim().length > 0 && config.description.trim().length > 0;
      case 1:
        return true; // Configuration step is always valid with defaults
      case 2:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
              Basic Agent Information
            </Typography>

            <TextField
              fullWidth
              label="Agent Name"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="e.g., Customer Support Assistant"
              sx={textFieldStyles}
              required
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Describe what this agent will do and its primary purpose..."
              sx={textFieldStyles}
              required
            />

            <Box sx={{ mt: 3, p: 3, backgroundColor: '#2d3748', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AutoAwesomeIcon sx={{ color: '#3b82f6', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Promethios LLM Advantages
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  icon={<Security />}
                  label="Bypass-Proof Governance"
                  sx={{ backgroundColor: '#1f2937', color: 'white' }}
                />
                <Chip
                  icon={<CheckCircle />}
                  label="Constitutional Compliance"
                  sx={{ backgroundColor: '#1f2937', color: 'white' }}
                />
                <Chip
                  icon={<SpeedIcon />}
                  label="Zero Governance Overhead"
                  sx={{ backgroundColor: '#1f2937', color: 'white' }}
                />
              </Box>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
              Agent Configuration
            </Typography>

            <FormControl fullWidth sx={textFieldStyles}>
              <InputLabel>Response Style</InputLabel>
              <Select
                value={config.responseStyle}
                onChange={(e) => setConfig({ ...config, responseStyle: e.target.value })}
                label="Response Style"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#2d3748',
                      '& .MuiMenuItem-root': {
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#4a5568',
                        },
                      },
                    },
                  },
                }}
              >
                {responseStyles.map((style) => (
                  <MenuItem key={style.value} value={style.value}>
                    <Box>
                      <Typography variant="body1" sx={{ color: '#ffffff' }}>{style.label}</Typography>
                      <Typography variant="caption" sx={{ color: '#cbd5e0' }}>
                        {style.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={textFieldStyles}>
              <InputLabel>Compliance Mode</InputLabel>
              <Select
                value={config.complianceMode}
                onChange={(e) => setConfig({ ...config, complianceMode: e.target.value })}
                label="Compliance Mode"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#2d3748',
                      '& .MuiMenuItem-root': {
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#4a5568',
                        },
                      },
                    },
                  },
                }}
              >
                {complianceModes.map((mode) => (
                  <MenuItem key={mode.value} value={mode.value}>
                    <Box>
                      <Typography variant="body1" sx={{ color: '#ffffff' }}>{mode.label}</Typography>
                      <Typography variant="caption" sx={{ color: '#cbd5e0' }}>
                        {mode.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                Trust Threshold: {config.trustThreshold}
              </Typography>
              <Slider
                value={config.trustThreshold}
                onChange={(_, value) => setConfig({ ...config, trustThreshold: value as number })}
                min={0.1}
                max={1.0}
                step={0.1}
                marks
                sx={{ color: '#3b82f6' }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Max Tokens"
                type="number"
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 2048 })}
                sx={{ ...textFieldStyles, flex: 1, mb: 0 }}
                inputProps={{ min: 100, max: 4096 }}
              />
              
              <TextField
                label="Temperature"
                type="number"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) || 0.7 })}
                sx={{ ...textFieldStyles, flex: 1, mb: 0 }}
                inputProps={{ min: 0.1, max: 2.0, step: 0.1 }}
              />
            </Box>

            <Box sx={{ mt: 3, p: 3, backgroundColor: '#2d3748', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ color: '#10b981', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Performance Benefits
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: '#cbd5e0' }}>
                Promethios LLM delivers 50% faster responses with built-in governance that cannot be bypassed.
                No external governance layer means zero latency overhead and perfect constitutional compliance.
              </Typography>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
              Review & Create
            </Typography>

            <Card sx={{ backgroundColor: '#2d3748', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  {config.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#cbd5e0', mb: 2 }}>
                  {config.description}
                </Typography>
                
                <Divider sx={{ borderColor: '#4a5568', my: 2 }} />
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip 
                    label={`Style: ${config.responseStyle}`} 
                    size="small" 
                    sx={{ backgroundColor: '#4a5568', color: '#ffffff' }}
                  />
                  <Chip 
                    label={`Compliance: ${config.complianceMode}`} 
                    size="small" 
                    sx={{ backgroundColor: '#4a5568', color: '#ffffff' }}
                  />
                  <Chip 
                    label={`Trust: ${config.trustThreshold}`} 
                    size="small" 
                    sx={{ backgroundColor: '#4a5568', color: '#ffffff' }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                '& .MuiAlert-icon': {
                  color: '#60a5fa',
                },
              }}
            >
              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                Your Promethios LLM agent will be created with immediate API access. 
                Deploy to production when ready for enhanced features.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  if (createdAgent) {
    return (
      <Box sx={{ 
        backgroundColor: '#1a202c', 
        minHeight: '100vh',
        py: 4 
      }}>
        <Container maxWidth="md">
          <Paper sx={{ 
            backgroundColor: '#2d3748',
            border: '1px solid #4a5568',
            borderRadius: 2,
            p: 4, 
            textAlign: 'center' 
          }}>
            <AutoAwesomeIcon sx={{ color: '#3b82f6', fontSize: 64, mb: 2 }} />
            
            <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
              Agent Created Successfully!
            </Typography>
            
            <Typography variant="body1" sx={{ color: '#cbd5e0', mb: 4 }}>
              Your Promethios LLM agent "{createdAgent.name}" is ready with immediate API access.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/ui/agents/profiles')}
                sx={{ color: '#cbd5e0', borderColor: '#4a5568' }}
              >
                Back to My Agents
              </Button>
              <Button
                variant="contained"
                startIcon={<Launch />}
                onClick={() => navigate(`/ui/agents/promethios-llm`)}
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': { backgroundColor: '#2563eb' }
                }}
              >
                Manage Agent
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      backgroundColor: '#1a202c', 
      minHeight: '100vh',
      py: 4 
    }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/ui/agents/profiles')}
            sx={{ color: '#cbd5e0', mb: 2 }}
          >
            Back to My Agents
          </Button>
          
          <Typography variant="h4" sx={{ color: 'white', mb: 1 }}>
            Create Promethios LLM Agent
          </Typography>
          <Typography variant="body1" sx={{ color: '#cbd5e0' }}>
            Create a new agent with native governance LLM
          </Typography>
        </Box>

        <Paper sx={{ 
          backgroundColor: '#2d3748',
          border: '1px solid #4a5568',
          borderRadius: 2,
          p: 4 
        }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ 
                  '& .MuiStepLabel-label': { color: '#cbd5e0' },
                  '& .MuiStepLabel-label.Mui-active': { color: '#3b82f6' },
                  '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' }
                }}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                backgroundColor: '#7f1d1d',
                color: '#ffffff',
                '& .MuiAlert-icon': {
                  color: '#f87171',
                },
              }}
            >
              <Typography sx={{ color: '#ffffff' }}>{error}</Typography>
            </Alert>
          )}

          {creating && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress sx={{ backgroundColor: '#4a5568' }} />
              <Typography variant="body2" sx={{ color: '#cbd5e0', mt: 1, textAlign: 'center' }}>
                Creating your Promethios LLM agent...
              </Typography>
            </Box>
          )}

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={() => navigate('/ui/agents/profiles')}
              sx={{ color: '#cbd5e0' }}
            >
              Cancel
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ color: '#cbd5e0' }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={creating || !isStepValid(activeStep)}
                  sx={{
                    backgroundColor: '#10b981',
                    '&:hover': { backgroundColor: '#059669' }
                  }}
                >
                  {creating ? 'Creating...' : 'Create Agent'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepValid(activeStep)}
                  sx={{
                    backgroundColor: '#3b82f6',
                    '&:hover': { backgroundColor: '#2563eb' }
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PrometheosLLMCreationPage;

