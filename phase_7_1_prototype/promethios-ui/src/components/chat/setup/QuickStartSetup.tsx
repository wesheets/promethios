/**
 * Quick Start Setup Component
 * 
 * Two-path chatbot creation wizard:
 * 1. Hosted API - Simple setup with managed models
 * 2. Bring Your Own Key - Advanced setup with custom models
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Rocket as RocketIcon,
  SmartToy as BotIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Chat as ChatIcon,
  Launch as LaunchIcon,
  Cloud as HostedIcon,
  VpnKey as BYOKIcon,
  AttachMoney as PricingIcon,
  Build as CustomIcon,
  AutoAwesome as AIIcon,
  Shield as GovernanceIcon,
} from '@mui/icons-material';

interface HostedChatbotData {
  name: string;
  description: string;
  provider: string;
  model: string;
  personality: string;
  useCase: string;
}

const QuickStartSetup: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState<'hosted' | 'byok' | null>(null);
  const [showHostedWizard, setShowHostedWizard] = useState(false);
  const [hostedStep, setHostedStep] = useState(0);
  const [hostedData, setHostedData] = useState<HostedChatbotData>({
    name: '',
    description: '',
    provider: '',
    model: '',
    personality: 'professional',
    useCase: 'customer_support'
  });
  const [isCreating, setIsCreating] = useState(false);

  // Available hosted models
  const hostedModels = [
    { provider: 'OpenAI', model: 'gpt-4', name: 'GPT-4', description: 'Most capable model for complex tasks', price: '$0.03/message' },
    { provider: 'OpenAI', model: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient for most tasks', price: '$0.01/message' },
    { provider: 'Anthropic', model: 'claude-3-opus', name: 'Claude-3 Opus', description: 'Excellent for analysis and reasoning', price: '$0.04/message' },
    { provider: 'Anthropic', model: 'claude-3-sonnet', name: 'Claude-3 Sonnet', description: 'Balanced performance and speed', price: '$0.02/message' },
    { provider: 'Google', model: 'gemini-pro', name: 'Gemini Pro', description: 'Google\'s advanced multimodal model', price: '$0.02/message' },
  ];

  const personalities = [
    { value: 'professional', label: 'Professional', description: 'Business-focused and formal' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and informal' },
    { value: 'helpful', label: 'Helpful', description: 'Solution-oriented and supportive' },
  ];

  const useCases = [
    { value: 'customer_support', label: 'Customer Support', description: 'Handle inquiries and resolve issues' },
    { value: 'sales', label: 'Sales Assistant', description: 'Qualify leads and provide product info' },
    { value: 'general', label: 'General Assistant', description: 'Multi-purpose conversational AI' },
    { value: 'technical', label: 'Technical Support', description: 'Help with technical questions' },
  ];

  const handlePathSelection = (path: 'hosted' | 'byok') => {
    setSelectedPath(path);
    
    if (path === 'hosted') {
      setShowHostedWizard(true);
    } else {
      // Navigate to existing agent wrapping wizard
      navigate('/ui/agents/wrapping?source=chatbot');
    }
  };

  const handleHostedNext = () => {
    if (hostedStep < 2) {
      setHostedStep(hostedStep + 1);
    } else {
      handleCreateHostedChatbot();
    }
  };

  const handleHostedBack = () => {
    if (hostedStep > 0) {
      setHostedStep(hostedStep - 1);
    } else {
      setShowHostedWizard(false);
      setSelectedPath(null);
    }
  };

  const handleCreateHostedChatbot = async () => {
    setIsCreating(true);
    
    try {
      // TODO: Implement hosted chatbot creation
      // This will create a hosted agent and convert it to a chatbot profile
      console.log('Creating hosted chatbot:', hostedData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to My Chatbots page
      navigate('/ui/chat/chatbots');
      
    } catch (error) {
      console.error('Failed to create hosted chatbot:', error);
      // TODO: Show error message
    } finally {
      setIsCreating(false);
    }
  };

  const isHostedStepValid = () => {
    switch (hostedStep) {
      case 0:
        return hostedData.name.trim() && hostedData.description.trim();
      case 1:
        return hostedData.provider && hostedData.model;
      case 2:
        return hostedData.personality && hostedData.useCase;
      default:
        return false;
    }
  };

  // Path selection view
  if (!selectedPath) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'transparent' }}>
        <Box textAlign="center" mb={6}>
          <RocketIcon sx={{ fontSize: 64, color: '#3182ce', mb: 2 }} />
          <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
            Quick Start
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
            Choose how you'd like to create your AI chatbot
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {/* Hosted API Path */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(49, 130, 206, 0.3)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(49, 130, 206, 0.1)',
                  border: '2px solid rgba(49, 130, 206, 0.5)',
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={() => handlePathSelection('hosted')}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <HostedIcon sx={{ fontSize: 48, color: '#3182ce', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                  🏢 Hosted API
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
                  Easy setup with managed models
                </Typography>

                <Box textAlign="left" mb={3}>
                  <Typography variant="subtitle2" sx={{ color: '#10b981', mb: 2 }}>
                    ✅ Perfect for:
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Quick deployment" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="No API key management" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Automatic scaling" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Built-in monitoring" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                  </List>
                </Box>

                <Box sx={{ backgroundColor: 'rgba(49, 130, 206, 0.1)', p: 2, borderRadius: 2, mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#3182ce', fontWeight: 600 }}>
                    💰 Pricing: $0.01 - $0.04 per message
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Includes hosting, scaling, and monitoring
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: '#3182ce',
                    color: 'white',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#2c5aa0' },
                  }}
                >
                  Get Started - Hosted
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* BYOK Path */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '2px solid rgba(245, 158, 11, 0.5)',
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={() => handlePathSelection('byok')}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <BYOKIcon sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                  🔧 Bring Your Own Key
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
                  Full control with your API keys
                </Typography>

                <Box textAlign="left" mb={3}>
                  <Typography variant="subtitle2" sx={{ color: '#10b981', mb: 2 }}>
                    ✅ Perfect for:
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Maximum control" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Custom models" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Direct API costs" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Enterprise features" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                  </List>
                </Box>

                <Box sx={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', p: 2, borderRadius: 2, mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                    💰 Pricing: Your API costs only
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Plus governance and monitoring features
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#d97706' },
                  }}
                >
                  Get Started - BYOK
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box textAlign="center" mt={6}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Both options include enterprise-grade governance, security, and compliance features
          </Typography>
        </Box>
      </Container>
    );
  }

  // Hosted wizard dialog
  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'transparent' }}>
        {/* Path selection content above */}
      </Container>

      {/* Hosted API Wizard Dialog */}
      <Dialog
        open={showHostedWizard}
        onClose={() => setShowHostedWizard(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a202c',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '600px',
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <HostedIcon sx={{ mr: 2, color: '#3182ce' }} />
            <Box>
              <Typography variant="h6">Create Hosted Chatbot</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Step {hostedStep + 1} of 3
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={(hostedStep + 1) / 3 * 100} 
            sx={{ mb: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          />

          {/* Step 1: Basic Information */}
          {hostedStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Basic Information
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                Tell us about your chatbot
              </Typography>

              <TextField
                fullWidth
                label="Chatbot Name"
                value={hostedData.name}
                onChange={(e) => setHostedData({ ...hostedData, name: e.target.value })}
                placeholder="e.g., Customer Support Bot"
                sx={{ mb: 3 }}
                InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{
                  sx: {
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Description"
                value={hostedData.description}
                onChange={(e) => setHostedData({ ...hostedData, description: e.target.value })}
                placeholder="e.g., Helps customers with inquiries and support tickets"
                multiline
                rows={3}
                InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{
                  sx: {
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  },
                }}
              />
            </Box>
          )}

          {/* Step 2: Model Selection */}
          {hostedStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Choose Your AI Model
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                Select the AI model that best fits your needs
              </Typography>

              <Grid container spacing={2}>
                {hostedModels.map((model) => (
                  <Grid item xs={12} key={`${model.provider}-${model.model}`}>
                    <Card
                      sx={{
                        backgroundColor: hostedData.provider === model.provider && hostedData.model === model.model
                          ? 'rgba(49, 130, 206, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: hostedData.provider === model.provider && hostedData.model === model.model
                          ? '2px solid #3182ce'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(49, 130, 206, 0.1)',
                          border: '1px solid rgba(49, 130, 206, 0.3)',
                        },
                      }}
                      onClick={() => setHostedData({ 
                        ...hostedData, 
                        provider: model.provider, 
                        model: model.model 
                      })}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                              {model.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {model.description}
                            </Typography>
                          </Box>
                          <Chip
                            label={model.price}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Step 3: Configuration */}
          {hostedStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Chatbot Configuration
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                Customize your chatbot's personality and use case
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Personality</InputLabel>
                <Select
                  value={hostedData.personality}
                  onChange={(e) => setHostedData({ ...hostedData, personality: e.target.value })}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  }}
                >
                  {personalities.map((personality) => (
                    <MenuItem key={personality.value} value={personality.value}>
                      <Box>
                        <Typography variant="body1">{personality.label}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          {personality.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Use Case</InputLabel>
                <Select
                  value={hostedData.useCase}
                  onChange={(e) => setHostedData({ ...hostedData, useCase: e.target.value })}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  }}
                >
                  {useCases.map((useCase) => (
                    <MenuItem key={useCase.value} value={useCase.value}>
                      <Box>
                        <Typography variant="body1">{useCase.label}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          {useCase.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleHostedBack}
            disabled={isCreating}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            {hostedStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            variant="contained"
            onClick={handleHostedNext}
            disabled={!isHostedStepValid() || isCreating}
            sx={{
              backgroundColor: '#3182ce',
              color: 'white',
              '&:hover': { backgroundColor: '#2c5aa0' },
              '&:disabled': { backgroundColor: '#6b7280' },
            }}
          >
            {isCreating ? (
              <Box display="flex" alignItems="center">
                <LinearProgress size={16} sx={{ mr: 1 }} />
                Creating...
              </Box>
            ) : hostedStep === 2 ? (
              'Create Chatbot'
            ) : (
              'Next'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickStartSetup;
  const [industry, setIndustry] = useState('');
  const [useCase, setUseCase] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const steps = [
    {
      label: 'Basic Information',
      description: 'Name your chatbot and select your industry',
    },
    {
      label: 'Use Case Selection',
      description: 'Choose what your chatbot will help with',
    },
    {
      label: 'Quick Deploy',
      description: 'Deploy with smart defaults',
    },
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Retail',
    'Education',
    'Real Estate',
    'Legal',
    'Other',
  ];

  const useCases = [
    { id: 'customer-support', name: 'Customer Support', description: 'Help customers with questions and issues' },
    { id: 'lead-generation', name: 'Lead Generation', description: 'Capture and qualify potential customers' },
    { id: 'appointment-booking', name: 'Appointment Booking', description: 'Schedule meetings and appointments' },
    { id: 'faq', name: 'FAQ Assistant', description: 'Answer frequently asked questions' },
    { id: 'product-recommendations', name: 'Product Recommendations', description: 'Suggest products based on customer needs' },
    { id: 'general-assistant', name: 'General Assistant', description: 'Multi-purpose conversational assistant' },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCreateChatbot = async () => {
    setIsCreating(true);
    // Simulate chatbot creation
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsCreating(false);
    handleNext();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chatbot Name"
                  value={chatbotName}
                  onChange={(e) => setChatbotName(e.target.value)}
                  placeholder="e.g., Customer Support Bot"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#4299e1' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiOutlinedInput-input': { color: 'white' },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Industry</InputLabel>
                  <Select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4299e1' },
                      '& .MuiSelect-select': { color: 'white' },
                    }}
                  >
                    {industries.map((ind) => (
                      <MenuItem key={ind} value={ind}>{ind}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Select the primary use case for your chatbot:
            </Typography>
            <Grid container spacing={2}>
              {useCases.map((uc) => (
                <Grid item xs={12} sm={6} key={uc.id}>
                  <Card
                    sx={{
                      backgroundColor: useCase === uc.id ? 'rgba(66, 153, 225, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: useCase === uc.id ? '2px solid #4299e1' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(66, 153, 225, 0.1)',
                        borderColor: '#4299e1',
                      },
                    }}
                    onClick={() => setUseCase(uc.id)}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                        {uc.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {uc.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            {isCreating ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LinearProgress sx={{ mb: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Creating Your Chatbot...
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Setting up governance, configuring AI model, and preparing deployment
                </Typography>
              </Box>
            ) : (
              <Box>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3,
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                    border: '1px solid rgba(66, 153, 225, 0.3)',
                    '& .MuiAlert-message': { color: 'white' },
                  }}
                >
                  Your chatbot will be created with smart defaults optimized for your use case.
                </Alert>
                
                <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                      Configuration Summary
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <BotIcon sx={{ color: '#4299e1' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Chatbot Name" 
                          secondary={chatbotName}
                          primaryTypographyProps={{ color: 'white' }}
                          secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <SettingsIcon sx={{ color: '#4299e1' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Industry" 
                          secondary={industry}
                          primaryTypographyProps={{ color: 'white' }}
                          secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <ChatIcon sx={{ color: '#4299e1' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Use Case" 
                          secondary={useCases.find(uc => uc.id === useCase)?.name}
                          primaryTypographyProps={{ color: 'white' }}
                          secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: '#48bb78', mb: 2 }} />
            <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
              Chatbot Created Successfully!
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
              Your chatbot is ready to start conversations with full governance oversight.
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<LaunchIcon />}
                  sx={{
                    backgroundColor: '#4299e1',
                    '&:hover': { backgroundColor: '#3182ce' },
                  }}
                >
                  Test Chatbot
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                  }}
                >
                  Customize Settings
                </Button>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 3, bgcolor: 'transparent' }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          <RocketIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'white' }} />
          Quick Start Setup
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Get your chatbot up and running in minutes with smart defaults
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Quick Start Benefits
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <SpeedIcon sx={{ color: '#4299e1' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Fast Setup" 
                    secondary="Ready in under 5 minutes"
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon sx={{ color: '#4299e1' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Built-in Governance" 
                    secondary="Automatic compliance and oversight"
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon sx={{ color: '#4299e1' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Smart Defaults" 
                    secondary="Optimized for your industry"
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                        {step.description}
                      </Typography>
                      {renderStepContent(index)}
                      <Box sx={{ mt: 3 }}>
                        <Button
                          variant="contained"
                          onClick={index === steps.length - 1 ? handleCreateChatbot : handleNext}
                          disabled={
                            (index === 0 && (!chatbotName || !industry)) ||
                            (index === 1 && !useCase) ||
                            isCreating
                          }
                          sx={{
                            backgroundColor: '#4299e1',
                            '&:hover': { backgroundColor: '#3182ce' },
                            mr: 1,
                          }}
                        >
                          {index === steps.length - 1 ? 'Create Chatbot' : 'Continue'}
                        </Button>
                        {index > 0 && (
                          <Button
                            onClick={handleBack}
                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            disabled={isCreating}
                          >
                            Back
                          </Button>
                        )}
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default QuickStartSetup;

