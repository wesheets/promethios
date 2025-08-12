/**
 * Quick Start Setup Component
 * 
 * Two-path chatbot creation wizard:
 * 1. Hosted API - Simple setup with managed models
 * 2. Bring Your Own Key - Advanced setup with custom models
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import ChatbotStorageService from '../../../services/ChatbotStorageService';
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
  Alert,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Rocket as RocketIcon,
  CheckCircle as CheckIcon,
  Cloud as HostedIcon,
  VpnKey as BYOKIcon,
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
  const { user } = useAuth();
  const chatbotService = ChatbotStorageService.getInstance();
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
      // Navigate to existing agent wrapping wizard with chatbot conversion
      navigate('/ui/agents/wrapping?source=chatbot&redirect=/ui/chat/convert');
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
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      // Create hosted chatbot using the storage service
      const chatbot = await chatbotService.createHostedChatbot(
        hostedData.name,
        hostedData.description,
        hostedData.provider,
        hostedData.model,
        hostedData.personality,
        hostedData.useCase,
        user.uid
      );

      console.log('Hosted chatbot created successfully:', chatbot);
      
      // Navigate to My Chatbots page
      navigate('/ui/chat/chatbots');
      
    } catch (error) {
      console.error('Failed to create hosted chatbot:', error);
      // TODO: Show error message to user
      alert('Failed to create chatbot. Please try again.');
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
      </Container>
    );
  }

  // This return should never be reached due to the navigation logic above
  return null;
};

export default QuickStartSetup;

