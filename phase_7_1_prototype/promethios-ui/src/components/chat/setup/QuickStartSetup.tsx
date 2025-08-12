/**
 * Quick Start Setup Component
 * 
 * Simplified chatbot setup flow for users who want to get started quickly
 * with minimal configuration and default settings.
 */

import React, { useState } from 'react';
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
} from '@mui/icons-material';

const QuickStartSetup: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [chatbotName, setChatbotName] = useState('');
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

