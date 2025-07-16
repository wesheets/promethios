/**
 * Native LLM Creation Wizard Component
 * 
 * Multi-step wizard for creating Native LLM agents with immediate API access
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  AutoAwesome,
  Security,
  Api,
  CheckCircle,
  Speed,
  Settings,
  Preview,
  Launch
} from '@mui/icons-material';
import { darkThemeStyles } from '../styles/darkThemeStyles';
import { nativeLLMService } from '../services/NativeLLMService';

interface NativeLLMCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onAgentCreated: (agent: any) => void;
}

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

export const NativeLLMCreationWizard: React.FC<NativeLLMCreationWizardProps> = ({
  open,
  onClose,
  onAgentCreated
}) => {
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

  const handleReset = () => {
    setActiveStep(0);
    setCreating(false);
    setError(null);
    setCreatedAgent(null);
    setConfig({
      name: '',
      description: '',
      responseStyle: 'professional',
      complianceMode: 'strict',
      trustThreshold: 0.8,
      maxTokens: 2048,
      temperature: 0.7
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    try {
      const agent = await nativeLLMService.createNativeAgent(
        config.name,
        config.description,
        {
          responseStyle: config.responseStyle,
          complianceMode: config.complianceMode,
          trustThreshold: config.trustThreshold,
          maxTokens: config.maxTokens,
          temperature: config.temperature
        }
      );

      setCreatedAgent(agent);
      onAgentCreated(agent);
      handleNext(); // Move to success step

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
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
              sx={{ ...darkThemeStyles.textField, mb: 3 }}
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
              sx={{ ...darkThemeStyles.textField, mb: 3 }}
              required
            />

            <Alert
              severity="info"
              icon={<AutoAwesome />}
              sx={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#3b82f6'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                🚀 Native LLM Benefits
              </Typography>
              <Typography variant="body2">
                • Built-in governance that cannot be bypassed<br/>
                • Immediate API access upon creation<br/>
                • Lambda 7B performance with 5,000 curated datasets<br/>
                • Constitutional compliance by design
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
              Agent Configuration
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={darkThemeStyles.formControl}>
                  <InputLabel sx={{ color: '#a0aec0' }}>Response Style</InputLabel>
                  <Select
                    value={config.responseStyle}
                    onChange={(e) => setConfig({ ...config, responseStyle: e.target.value })}
                    sx={darkThemeStyles.select}
                  >
                    {responseStyles.map((style) => (
                      <MenuItem key={style.value} value={style.value}>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {style.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                            {style.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={darkThemeStyles.formControl}>
                  <InputLabel sx={{ color: '#a0aec0' }}>Compliance Mode</InputLabel>
                  <Select
                    value={config.complianceMode}
                    onChange={(e) => setConfig({ ...config, complianceMode: e.target.value })}
                    sx={darkThemeStyles.select}
                  >
                    {complianceModes.map((mode) => (
                      <MenuItem key={mode.value} value={mode.value}>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {mode.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                            {mode.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Trust Threshold"
                  value={config.trustThreshold}
                  onChange={(e) => setConfig({ ...config, trustThreshold: parseFloat(e.target.value) })}
                  inputProps={{ min: 0.1, max: 1.0, step: 0.1 }}
                  sx={darkThemeStyles.textField}
                  helperText="Minimum trust score required (0.1 - 1.0)"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Tokens"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                  inputProps={{ min: 256, max: 4096, step: 256 }}
                  sx={darkThemeStyles.textField}
                  helperText="Maximum response length"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                    Temperature: {config.temperature}
                  </Typography>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: '#374151',
                      outline: 'none'
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      More Focused
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      More Creative
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
              Review & Create Agent
            </Typography>

            <Card sx={{ ...darkThemeStyles.card, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  {config.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                  {config.description}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Response Style
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {responseStyles.find(s => s.value === config.responseStyle)?.label}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Compliance Mode
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {complianceModes.find(m => m.value === config.complianceMode)?.label}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Trust Threshold
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {config.trustThreshold}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Max Tokens
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {config.maxTokens}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Alert
              severity="success"
              icon={<Api />}
              sx={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                🚀 Immediate API Access
              </Typography>
              <Typography variant="body2">
                Your agent will have chat and API endpoints available immediately after creation.
                No wrapping or additional deployment steps required!
              </Typography>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
            
            <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
              Agent Created Successfully!
            </Typography>

            <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
              Your Native LLM agent "{createdAgent?.name}" is ready to use.
            </Typography>

            <Card sx={{ ...darkThemeStyles.card, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  🚀 Immediate Access Available
                </Typography>

                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                    Chat Endpoint:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#3b82f6', 
                    fontFamily: 'monospace',
                    backgroundColor: '#1f2937',
                    p: 1,
                    borderRadius: 1,
                    mb: 2
                  }}>
                    {createdAgent?.apiAccess?.immediate?.chatEndpoint}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<Security />}
                      label="Bypass-Proof Governance"
                      size="small"
                      sx={{ backgroundColor: '#065f46', color: '#10b981' }}
                    />
                    <Chip
                      icon={<Speed />}
                      label="Real-time Monitoring"
                      size="small"
                      sx={{ backgroundColor: '#7c2d12', color: '#f97316' }}
                    />
                    <Chip
                      icon={<CheckCircle />}
                      label="Constitutional Compliance"
                      size="small"
                      sx={{ backgroundColor: '#1e3a8a', color: '#3b82f6' }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Typography variant="body2" sx={{ color: '#718096' }}>
              You can now start chatting with your agent or integrate it into your applications.
              Deploy to production when ready for enhanced features.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...darkThemeStyles.card,
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AutoAwesome sx={{ color: '#3b82f6' }} />
          Create Native LLM Agent
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: '#a0aec0',
                      '&.Mui-active': { color: '#3b82f6' },
                      '&.Mui-completed': { color: '#10b981' }
                    },
                    '& .MuiStepIcon-root': {
                      color: '#374151',
                      '&.Mui-active': { color: '#3b82f6' },
                      '&.Mui-completed': { color: '#10b981' }
                    }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {creating && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress sx={{ 
                backgroundColor: '#374151',
                '& .MuiLinearProgress-bar': { backgroundColor: '#3b82f6' }
              }} />
              <Typography variant="body2" sx={{ color: '#a0aec0', mt: 1, textAlign: 'center' }}>
                Creating your Native LLM agent...
              </Typography>
            </Box>
          )}

          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #374151', p: 2 }}>
        {activeStep === steps.length ? (
          // Success step
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button
              onClick={handleClose}
              sx={{ color: '#a0aec0' }}
            >
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<Launch />}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' }
              }}
            >
              Go to Agent
            </Button>
          </Box>
        ) : (
          // Normal steps
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button
              onClick={handleClose}
              sx={{ color: '#a0aec0' }}
            >
              Cancel
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ color: '#a0aec0' }}
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
        )}
      </DialogActions>
    </Dialog>
  );
};

