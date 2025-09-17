/**
 * AgentCreationPanel - Embedded Quick Start flow for creating new agents
 * 
 * This panel embeds the entire Quick Start flow within the collaboration panel,
 * allowing users to create agents without leaving the collaboration interface.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Close as CloseIcon,
  Rocket as RocketIcon,
  Cloud as HostedIcon,
  VpnKey as BYOKIcon,
  SmartToy as ChatbotIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import ChatbotStorageService from '../../services/ChatbotStorageService';

interface AgentCreationPanelProps {
  open: boolean;
  onClose: () => void;
  onAgentCreated?: (agentData: {
    id: string;
    name: string;
    type: 'hosted' | 'byok';
  }) => void;
}

const AgentCreationPanel: React.FC<AgentCreationPanelProps> = ({
  open,
  onClose,
  onAgentCreated
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPath, setSelectedPath] = useState<'hosted' | 'byok' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hosted API state
  const [hostedData, setHostedData] = useState({
    plan: '',
    name: '',
    description: '',
    personality: 'professional',
    expertise: [] as string[],
    temperature: 0.7,
    maxTokens: 2000,
    enableMemory: true
  });

  // BYOK state
  const [byokData, setByokData] = useState({
    name: '',
    description: '',
    apiKey: '',
    model: '',
    baseUrl: '',
    personality: 'professional',
    expertise: [] as string[],
    temperature: 0.7,
    maxTokens: 2000,
    enableMemory: true
  });

  const steps = [
    'Choose Setup Type',
    'Select Plan',
    'Configure Agent',
    'Review & Create'
  ];

  const hostedPlans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$0.01 - $0.04 per message',
      features: ['Quick deployment', 'No API key management', 'Automatic scaling', 'Built-in monitoring'],
      recommended: true
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '$0.02 - $0.08 per message',
      features: ['Advanced models', 'Priority support', 'Custom integrations', 'Enhanced analytics'],
      recommended: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom pricing',
      features: ['Dedicated resources', 'SLA guarantees', 'Custom models', 'White-label options'],
      recommended: false
    }
  ];

  const personalities = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'analytical', label: 'Analytical' },
    { value: 'creative', label: 'Creative' },
    { value: 'supportive', label: 'Supportive' }
  ];

  const expertiseOptions = [
    'Customer Support', 'Sales', 'Technical Support', 'Marketing',
    'Data Analysis', 'Content Creation', 'Project Management', 'HR',
    'Finance', 'Legal', 'Healthcare', 'Education'
  ];

  useEffect(() => {
    if (!open) {
      // Reset state when panel closes
      setCurrentStep(0);
      setSelectedPath(null);
      setError(null);
      setHostedData({
        plan: '',
        name: '',
        description: '',
        personality: 'professional',
        expertise: [],
        temperature: 0.7,
        maxTokens: 2000,
        enableMemory: true
      });
      setByokData({
        name: '',
        description: '',
        apiKey: '',
        model: '',
        baseUrl: '',
        personality: 'professional',
        expertise: [],
        temperature: 0.7,
        maxTokens: 2000,
        enableMemory: true
      });
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePathSelect = (path: 'hosted' | 'byok') => {
    setSelectedPath(path);
    handleNext();
  };

  const handlePlanSelect = (planId: string) => {
    setHostedData(prev => ({ ...prev, plan: planId }));
    handleNext();
  };

  const handleCreateAgent = async () => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const chatbotService = ChatbotStorageService.getInstance();
      const currentData = selectedPath === 'hosted' ? hostedData : byokData;

      const agentData = {
        identity: {
          name: currentData.name,
          description: currentData.description,
          personality: currentData.personality,
          expertise: currentData.expertise
        },
        configuration: {
          temperature: currentData.temperature,
          maxTokens: currentData.maxTokens,
          enableMemory: currentData.enableMemory,
          ...(selectedPath === 'hosted' 
            ? { plan: hostedData.plan }
            : { 
                apiKey: byokData.apiKey,
                model: byokData.model,
                baseUrl: byokData.baseUrl
              }
          )
        },
        type: selectedPath,
        status: 'active'
      };

      const newAgent = await chatbotService.createChatbot(user.uid, agentData);
      
      // Notify parent component
      if (onAgentCreated) {
        onAgentCreated({
          id: newAgent.id,
          name: currentData.name,
          type: selectedPath!
        });
      }

      // Navigate to the new agent's chat interface
      navigate(`/ui/chat/chatbots/${newAgent.id}`);
      
      // Close the panel
      onClose();

    } catch (error) {
      console.error('Error creating agent:', error);
      setError('Failed to create agent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ color: '#f8fafc', mb: 1, textAlign: 'center' }}>
              Quick Start
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4, textAlign: 'center' }}>
              Choose how you'd like to create your AI agent
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ 
                    bgcolor: '#1e293b', 
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      border: '1px solid #3b82f6',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handlePathSelect('hosted')}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <HostedIcon sx={{ color: '#3b82f6', fontSize: 32, mr: 2 }} />
                      <Typography variant="h6" sx={{ color: '#f8fafc' }}>
                        Hosted API
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                      Easy setup with managed models
                    </Typography>
                    <Chip label="Perfect for" size="small" sx={{ bgcolor: '#10b981', color: 'white', mb: 2 }} />
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon sx={{ color: '#10b981', fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Quick deployment"
                          primaryTypographyProps={{ fontSize: '0.875rem', color: '#cbd5e1' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon sx={{ color: '#10b981', fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="No API key management"
                          primaryTypographyProps={{ fontSize: '0.875rem', color: '#cbd5e1' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon sx={{ color: '#10b981', fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Automatic scaling"
                          primaryTypographyProps={{ fontSize: '0.875rem', color: '#cbd5e1' }}
                        />
                      </ListItem>
                    </List>
                    <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                      Pricing: $0.01 - $0.04 per message
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ 
                    bgcolor: '#1e293b', 
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      border: '1px solid #f59e0b',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handlePathSelect('byok')}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BYOKIcon sx={{ color: '#f59e0b', fontSize: 32, mr: 2 }} />
                      <Typography variant="h6" sx={{ color: '#f8fafc' }}>
                        Bring Your Own Key
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                      Full control with your API keys
                    </Typography>
                    <Chip label="Perfect for" size="small" sx={{ bgcolor: '#f59e0b', color: 'white', mb: 2 }} />
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon sx={{ color: '#10b981', fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Maximum control"
                          primaryTypographyProps={{ fontSize: '0.875rem', color: '#cbd5e1' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon sx={{ color: '#10b981', fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Custom models"
                          primaryTypographyProps={{ fontSize: '0.875rem', color: '#cbd5e1' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon sx={{ color: '#10b981', fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Direct API costs"
                          primaryTypographyProps={{ fontSize: '0.875rem', color: '#cbd5e1' }}
                        />
                      </ListItem>
                    </List>
                    <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                      Pricing: Your API costs only
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        if (selectedPath === 'hosted') {
          return (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: '#f8fafc', mb: 3 }}>
                Select Your Plan
              </Typography>
              <Grid container spacing={2}>
                {hostedPlans.map((plan) => (
                  <Grid item xs={12} key={plan.id}>
                    <Card 
                      sx={{ 
                        bgcolor: hostedData.plan === plan.id ? '#1e40af' : '#1e293b',
                        border: `1px solid ${hostedData.plan === plan.id ? '#3b82f6' : '#334155'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          border: '1px solid #3b82f6'
                        }
                      }}
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ color: '#f8fafc' }}>
                            {plan.name}
                          </Typography>
                          {plan.recommended && (
                            <Chip label="Recommended" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ color: '#f59e0b', mb: 2, fontWeight: 600 }}>
                          {plan.price}
                        </Typography>
                        <Grid container spacing={1}>
                          {plan.features.map((feature, index) => (
                            <Grid item xs={6} key={index}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CheckIcon sx={{ color: '#10b981', fontSize: 16, mr: 1 }} />
                                <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                                  {feature}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        } else {
          // For BYOK, skip plan selection and go to configuration
          handleNext();
          return null;
        }

      case 2:
        const currentData = selectedPath === 'hosted' ? hostedData : byokData;
        const setCurrentData = selectedPath === 'hosted' ? setHostedData : setByokData;

        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#f8fafc', mb: 3 }}>
              Configure Your Agent
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Agent Name"
                  value={currentData.name}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, name: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#1e293b',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#3b82f6' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                    '& .MuiInputBase-input': { color: '#f8fafc' }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={currentData.description}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, description: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#1e293b',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#3b82f6' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                    '& .MuiInputBase-input': { color: '#f8fafc' }
                  }}
                />
              </Grid>

              {selectedPath === 'byok' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="API Key"
                      type="password"
                      value={byokData.apiKey}
                      onChange={(e) => setByokData(prev => ({ ...prev, apiKey: e.target.value }))}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#1e293b',
                          '& fieldset': { borderColor: '#334155' },
                          '&:hover fieldset': { borderColor: '#3b82f6' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                        },
                        '& .MuiInputLabel-root': { color: '#94a3b8' },
                        '& .MuiInputBase-input': { color: '#f8fafc' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Model"
                      value={byokData.model}
                      onChange={(e) => setByokData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="gpt-4, claude-3, etc."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#1e293b',
                          '& fieldset': { borderColor: '#334155' },
                          '&:hover fieldset': { borderColor: '#3b82f6' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                        },
                        '& .MuiInputLabel-root': { color: '#94a3b8' },
                        '& .MuiInputBase-input': { color: '#f8fafc' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Base URL (Optional)"
                      value={byokData.baseUrl}
                      onChange={(e) => setByokData(prev => ({ ...prev, baseUrl: e.target.value }))}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#1e293b',
                          '& fieldset': { borderColor: '#334155' },
                          '&:hover fieldset': { borderColor: '#3b82f6' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                        },
                        '& .MuiInputLabel-root': { color: '#94a3b8' },
                        '& .MuiInputBase-input': { color: '#f8fafc' }
                      }}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#94a3b8' }}>Personality</InputLabel>
                  <Select
                    value={currentData.personality}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, personality: e.target.value }))}
                    sx={{
                      bgcolor: '#1e293b',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                      '& .MuiSelect-select': { color: '#f8fafc' }
                    }}
                  >
                    {personalities.map((personality) => (
                      <MenuItem key={personality.value} value={personality.value}>
                        {personality.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Temperature: {currentData.temperature}
                </Typography>
                <Slider
                  value={currentData.temperature}
                  onChange={(_, value) => setCurrentData(prev => ({ ...prev, temperature: value as number }))}
                  min={0}
                  max={1}
                  step={0.1}
                  sx={{
                    color: '#3b82f6',
                    '& .MuiSlider-thumb': { bgcolor: '#3b82f6' },
                    '& .MuiSlider-track': { bgcolor: '#3b82f6' },
                    '& .MuiSlider-rail': { bgcolor: '#334155' }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        const reviewData = selectedPath === 'hosted' ? hostedData : byokData;
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#f8fafc', mb: 3 }}>
              Review & Create
            </Typography>
            
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2 }}>
                  {reviewData.name || 'Unnamed Agent'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  {reviewData.description || 'No description provided'}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Setup Type</Typography>
                    <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                      {selectedPath === 'hosted' ? 'Hosted API' : 'Bring Your Own Key'}
                    </Typography>
                  </Grid>
                  
                  {selectedPath === 'hosted' && (
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Plan</Typography>
                      <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                        {hostedPlans.find(p => p.id === hostedData.plan)?.name || 'Not selected'}
                      </Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Personality</Typography>
                    <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                      {personalities.find(p => p.value === reviewData.personality)?.label}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Temperature</Typography>
                    <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                      {reviewData.temperature}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {error && (
              <Alert severity="error" sx={{ mb: 2, bgcolor: '#7f1d1d', color: '#fecaca' }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleCreateAgent}
              disabled={loading || !reviewData.name}
              sx={{
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' },
                '&:disabled': { bgcolor: '#374151' },
                py: 1.5
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Create Agent'
              )}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        height: '100vh',
        bgcolor: '#0f172a',
        borderLeft: '1px solid #334155',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid #334155'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ChatbotIcon sx={{ color: '#3b82f6', mr: 2 }} />
          <Typography variant="h6" sx={{ color: '#f8fafc' }}>
            Create New Agent
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Stepper */}
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{
                '& .MuiStepLabel-label': { color: '#94a3b8', fontSize: '0.75rem' },
                '& .MuiStepLabel-label.Mui-active': { color: '#3b82f6' },
                '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' }
              }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {renderStepContent()}
      </Box>

      {/* Navigation */}
      {currentStep > 0 && currentStep < steps.length - 1 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          p: 2,
          borderTop: '1px solid #334155'
        }}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{ color: '#94a3b8' }}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            endIcon={<ArrowForwardIcon />}
            variant="contained"
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            disabled={
              (currentStep === 1 && selectedPath === 'hosted' && !hostedData.plan) ||
              (currentStep === 2 && !((selectedPath === 'hosted' ? hostedData : byokData).name))
            }
          >
            Next
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default AgentCreationPanel;

