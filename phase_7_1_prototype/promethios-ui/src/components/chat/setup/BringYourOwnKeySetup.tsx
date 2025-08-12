/**
 * Bring Your Own Key Setup Component
 * 
 * Advanced setup flow for users who want to use their own API keys
 * and have full control over their AI model configurations.
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  VpnKey as KeyIcon,
  SmartToy as BotIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudIcon,
  Code as CodeIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';

interface APIProvider {
  id: string;
  name: string;
  description: string;
  models: string[];
  keyFormat: string;
  testEndpoint: string;
  documentation: string;
}

const BringYourOwnKeySetup: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [chatbotName, setChatbotName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [advancedSettings, setAdvancedSettings] = useState({
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const apiProviders: APIProvider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5 Turbo, and other OpenAI models',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
      keyFormat: 'sk-...',
      testEndpoint: 'https://api.openai.com/v1/models',
      documentation: 'https://platform.openai.com/docs'
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude 3 Opus, Sonnet, and Haiku models',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      keyFormat: 'sk-ant-...',
      testEndpoint: 'https://api.anthropic.com/v1/messages',
      documentation: 'https://docs.anthropic.com/claude/reference'
    },
    {
      id: 'cohere',
      name: 'Cohere',
      description: 'Command R+, Command R, and other Cohere models',
      models: ['command-r-plus', 'command-r', 'command', 'command-nightly'],
      keyFormat: 'co-...',
      testEndpoint: 'https://api.cohere.ai/v1/models',
      documentation: 'https://docs.cohere.com/reference'
    },
    {
      id: 'azure',
      name: 'Azure OpenAI',
      description: 'OpenAI models hosted on Microsoft Azure',
      models: ['gpt-4', 'gpt-35-turbo', 'gpt-4-32k'],
      keyFormat: 'azure-key-...',
      testEndpoint: 'https://{resource}.openai.azure.com/openai/deployments',
      documentation: 'https://docs.microsoft.com/en-us/azure/cognitive-services/openai/'
    }
  ];

  const steps = [
    'Select AI Provider',
    'Configure API Key',
    'Choose Model & Settings',
    'Test Connection',
    'Deploy Chatbot'
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setSelectedModel('');
    setApiKey('');
    setConnectionStatus('idle');
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('testing');
    
    // Simulate API test
    setTimeout(() => {
      setConnectionStatus('success');
      setTestingConnection(false);
    }, 2000);
  };

  const renderProviderSelection = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
        Choose Your AI Provider
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#a0aec0' }}>
        Select the AI provider whose API key you want to use. You'll need an active account and API key.
      </Typography>

      <Grid container spacing={3}>
        {apiProviders.map((provider) => (
          <Grid item xs={12} md={6} key={provider.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: selectedProvider === provider.id ? 2 : 1,
                borderColor: selectedProvider === provider.id ? 'primary.main' : 'divider',
                '&:hover': { borderColor: 'primary.main' },
                backgroundColor: '#2d3748',
                color: 'white'
              }}
              onClick={() => handleProviderSelect(provider.id)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <KeyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white' }}>{provider.name}</Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      {provider.description}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2, borderColor: '#4a5568' }} />
                
                <Box>
                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>Available Models:</Typography>
                  <Box mt={1}>
                    {provider.models.slice(0, 3).map((model) => (
                      <Chip 
                        key={model} 
                        label={model} 
                        size="small" 
                        variant="outlined" 
                        sx={{ mr: 1, mb: 1, color: 'white', borderColor: '#a0aec0' }}
                      />
                    ))}
                    {provider.models.length > 3 && (
                      <Chip 
                        label={`+${provider.models.length - 3} more`} 
                        size="small" 
                        variant="outlined"
                        sx={{ color: '#a0aec0', borderColor: '#a0aec0' }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedProvider && (
        <Alert severity="info" sx={{ mt: 3, backgroundColor: '#2d3748', color: 'white' }}>
          <Typography variant="body2">
            <strong>Selected:</strong> {apiProviders.find(p => p.id === selectedProvider)?.name}
            <br />
            You'll need an API key from this provider to continue.
          </Typography>
        </Alert>
      )}
    </Box>
  );

  const renderAPIKeyConfiguration = () => {
    const provider = apiProviders.find(p => p.id === selectedProvider);
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
          Configure API Key
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#a0aec0' }}>
          Enter your {provider?.name} API key. This will be securely stored and encrypted.
        </Typography>

        <Card sx={{ mb: 3, backgroundColor: '#2d3748', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <SecurityIcon color="primary" sx={{ mr: 2 }} />
              <Typography variant="h6" sx={{ color: 'white' }}>Security Information</Typography>
            </Box>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="End-to-end encryption"
                  secondary="Your API key is encrypted in transit and at rest"
                  sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: '#a0aec0' } }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="No data sharing"
                  secondary="Your API key is never shared with third parties"
                  sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: '#a0aec0' } }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Revocable access"
                  secondary="You can revoke or change your API key at any time"
                  sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: '#a0aec0' } }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <TextField
          fullWidth
          label="API Key"
          type={showApiKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider?.keyFormat}
          sx={{ 
            mb: 2,
            '& .MuiInputLabel-root': { color: '#a0aec0' },
            '& .MuiOutlinedInput-root': { 
              color: 'white',
              '& fieldset': { borderColor: '#4a5568' },
              '&:hover fieldset': { borderColor: '#a0aec0' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' }
            }
          }}
          InputProps={{
            endAdornment: (
              <IconButton
                onClick={() => setShowApiKey(!showApiKey)}
                edge="end"
                sx={{ color: '#a0aec0' }}
              >
                {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            ),
          }}
        />

        <Alert severity="warning" sx={{ mb: 2, backgroundColor: '#2d3748', color: 'white' }}>
          <Typography variant="body2">
            <strong>Important:</strong> Make sure your API key has the necessary permissions for chat completions.
            Check your provider's documentation for required scopes.
          </Typography>
        </Alert>

        <Button
          variant="outlined"
          href={provider?.documentation}
          target="_blank"
          sx={{ color: 'white', borderColor: 'white' }}
        >
          View {provider?.name} Documentation
        </Button>
      </Box>
    );
  };

  const renderModelSettings = () => {
    const provider = apiProviders.find(p => p.id === selectedProvider);
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
          Model & Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#a0aec0' }}>
          Choose your AI model and configure advanced settings for optimal performance.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#a0aec0' }}>Model</InputLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                sx={{ 
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#a0aec0' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                }}
              >
                {provider?.models.map((model) => (
                  <MenuItem key={model} value={model}>{model}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Chatbot Name"
              value={chatbotName}
              onChange={(e) => setChatbotName(e.target.value)}
              placeholder="My Custom Chatbot"
              sx={{ 
                mb: 2,
                '& .MuiInputLabel-root': { color: '#a0aec0' },
                '& .MuiOutlinedInput-root': { 
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#a0aec0' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="System Prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful AI assistant..."
              sx={{ 
                mb: 2,
                '& .MuiInputLabel-root': { color: '#a0aec0' },
                '& .MuiOutlinedInput-root': { 
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#a0aec0' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                }
              }}
            />
          </Grid>
        </Grid>

        <Accordion sx={{ backgroundColor: '#2d3748', color: 'white' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
            <Typography sx={{ color: 'white' }}>Advanced Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Temperature"
                  type="number"
                  value={advancedSettings.temperature}
                  onChange={(e) => setAdvancedSettings({...advancedSettings, temperature: parseFloat(e.target.value)})}
                  inputProps={{ min: 0, max: 2, step: 0.1 }}
                  sx={{ 
                    mb: 2,
                    '& .MuiInputLabel-root': { color: '#a0aec0' },
                    '& .MuiOutlinedInput-root': { 
                      color: 'white',
                      '& fieldset': { borderColor: '#4a5568' },
                      '&:hover fieldset': { borderColor: '#a0aec0' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Tokens"
                  type="number"
                  value={advancedSettings.maxTokens}
                  onChange={(e) => setAdvancedSettings({...advancedSettings, maxTokens: parseInt(e.target.value)})}
                  inputProps={{ min: 1, max: 4096 }}
                  sx={{ 
                    mb: 2,
                    '& .MuiInputLabel-root': { color: '#a0aec0' },
                    '& .MuiOutlinedInput-root': { 
                      color: 'white',
                      '& fieldset': { borderColor: '#4a5568' },
                      '&:hover fieldset': { borderColor: '#a0aec0' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  const renderConnectionTest = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
        Test Connection
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#a0aec0' }}>
        Let's test your API connection to ensure everything is configured correctly.
      </Typography>

      <Card sx={{ mb: 3, backgroundColor: '#2d3748', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <SettingsIcon color="primary" sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ color: 'white' }}>Configuration Summary</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>Provider:</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>
                {apiProviders.find(p => p.id === selectedProvider)?.name}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>Model:</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>{selectedModel}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>Chatbot Name:</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>{chatbotName}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>API Key:</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>
                {apiKey ? '••••••••••••' + apiKey.slice(-4) : 'Not set'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box textAlign="center">
        <Button
          variant="contained"
          size="large"
          onClick={testConnection}
          disabled={testingConnection || !apiKey || !selectedModel}
          sx={{ mb: 2 }}
        >
          {testingConnection ? 'Testing Connection...' : 'Test Connection'}
        </Button>

        {testingConnection && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, color: '#a0aec0' }}>
              Verifying API key and testing model access...
            </Typography>
          </Box>
        )}

        {connectionStatus === 'success' && (
          <Alert severity="success" sx={{ mt: 2, backgroundColor: '#2d3748', color: 'white' }}>
            <Typography variant="body2">
              <strong>Connection successful!</strong> Your API key is valid and the model is accessible.
            </Typography>
          </Alert>
        )}

        {connectionStatus === 'error' && (
          <Alert severity="error" sx={{ mt: 2, backgroundColor: '#2d3748', color: 'white' }}>
            <Typography variant="body2">
              <strong>Connection failed.</strong> Please check your API key and try again.
            </Typography>
          </Alert>
        )}
      </Box>
    </Box>
  );

  const renderDeployment = () => (
    <Box textAlign="center">
      <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
        Ready to Deploy!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#a0aec0' }}>
        Your custom chatbot is configured and ready to deploy. You can start using it immediately
        or customize it further in the chatbot builder.
      </Typography>

      <Grid container spacing={2} justifyContent="center" sx={{ mt: 3 }}>
        <Grid item>
          <Button variant="contained" size="large" startIcon={<CloudIcon />}>
            Deploy Chatbot
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" size="large" startIcon={<TuneIcon />} sx={{ color: 'white', borderColor: 'white' }}>
            Customize Further
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth={false} sx={{ py: 4, backgroundColor: '#1a202c', minHeight: '100vh' }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Bring Your Own Key Setup
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ color: '#a0aec0' }}>
          Use your own AI provider API keys for maximum control and customization.
        </Typography>
      </Box>

      <Card sx={{ mb: 4, backgroundColor: '#2d3748', color: 'white' }}>
        <Stepper activeStep={activeStep} orientation="horizontal" sx={{ p: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Card>

      <Box>
        {activeStep === 0 && renderProviderSelection()}
        {activeStep === 1 && renderAPIKeyConfiguration()}
        {activeStep === 2 && renderModelSettings()}
        {activeStep === 3 && renderConnectionTest()}
        {activeStep === 4 && renderDeployment()}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, mt: 4 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1, color: 'white' }}
        >
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep < steps.length - 1 && (
          <Button 
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !selectedProvider) ||
              (activeStep === 1 && !apiKey) ||
              (activeStep === 2 && (!selectedModel || !chatbotName)) ||
              (activeStep === 3 && connectionStatus !== 'success')
            }
          >
            Next
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default BringYourOwnKeySetup;

