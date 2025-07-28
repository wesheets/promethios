import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Api,
  CheckCircle,
  Error,
  Warning,
  Visibility,
  VisibilityOff,
  Speed,
  Info,
} from '@mui/icons-material';
import { WizardFormData } from '../AgentWrappingWizard';
import { apiConnectionService, ConnectionTestResult } from '../../services/ApiConnectionService';
import { apiValidationService, ValidationResult } from '../../services/ApiValidationService';

interface ApiEndpointStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
}

const ApiEndpointStep: React.FC<ApiEndpointStepProps> = ({
  formData,
  updateFormData,
  onNext,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  const providers = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'] },
    { value: 'cohere', label: 'Cohere', models: ['command', 'command-light', 'command-nightly'] },
    { value: 'custom', label: 'Custom API', models: [] },
  ];

  const selectedProvider = providers.find(p => p.value === formData.provider);

  const getDefaultEndpoint = (provider: string) => {
    const endpoints = {
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      cohere: 'https://api.cohere.ai/v1/generate',
      custom: '',
    };
    return endpoints[provider as keyof typeof endpoints] || '';
  };

  const handleProviderChange = (provider: string) => {
    updateFormData({
      provider,
      apiEndpoint: getDefaultEndpoint(provider),
      model: providers.find(p => p.value === provider)?.models[0] || '',
    });
    setConnectionResult(null);
    setValidationResult(null);
  };

  const validateConfiguration = () => {
    const validation = apiValidationService.validateConfiguration({
      provider: formData.provider,
      apiKey: formData.apiKey,
      endpoint: formData.apiEndpoint,
      model: formData.model,
    });
    
    setValidationResult(validation);
    setShowValidationDetails(validation.errors.length > 0 || validation.warnings.length > 0);
    return validation;
  };

  const handleTestConnection = async () => {
    // First validate the configuration
    const validation = validateConfiguration();
    if (!validation.isValid) {
      setConnectionResult({
        success: false,
        message: 'Configuration validation failed',
        error: validation.errors.join(', '),
      });
      return;
    }

    if (!formData.apiKey) {
      setConnectionResult({
        success: false,
        message: 'API key required',
        error: 'Please enter your API key',
      });
      return;
    }

    if (!formData.apiEndpoint && formData.provider === 'custom') {
      setConnectionResult({
        success: false,
        message: 'Endpoint required',
        error: 'Please enter your custom API endpoint',
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      const result = await apiConnectionService.testConnection({
        provider: formData.provider,
        apiKey: formData.apiKey,
        endpoint: formData.apiEndpoint,
        model: formData.model,
      });

      setConnectionResult(result);
      setShowConnectionDetails(true);

      // Update form data with successful connection
      if (result.success) {
        updateFormData({
          connectionTested: true,
          connectionLatency: result.latency,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionResult({
        success: false,
        message: 'Connection test failed',
        error: errorMessage,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getConnectionStatusColor = () => {
    if (!connectionResult) return 'default';
    return connectionResult.success ? 'success' : 'error';
  };

  const getConnectionStatusIcon = () => {
    if (!connectionResult) return <Api />;
    return connectionResult.success ? <CheckCircle /> : <Error />;
  };

  const isFormValid = () => {
    return (
      formData.agentName &&
      formData.provider &&
      formData.apiKey &&
      (formData.provider !== 'custom' || formData.apiEndpoint) &&
      formData.model
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        1. Configure API Endpoint
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Connect your AI agent by providing the API details and credentials.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader 
              title="Agent Information"
              avatar={<Api color="primary" />}
            />
            <CardContent>
              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Agent Name"
                  value={formData.agentName}
                  onChange={(e) => updateFormData({ agentName: e.target.value })}
                  placeholder="My AI Assistant"
                  helperText="A descriptive name for your agent"
                />
              </Box>

              <Box mb={3}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Describe what your agent does..."
                  helperText="Optional: Brief description of your agent's capabilities"
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={formData.provider}
                  label="Provider"
                  onChange={(e) => handleProviderChange(e.target.value)}
                >
                  {providers.map((provider) => (
                    <MenuItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader 
              title="API Configuration"
              avatar={<Api color="primary" />}
            />
            <CardContent>
              <Box mb={3}>
                <TextField
                  fullWidth
                  label="API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => updateFormData({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  helperText="Your API key from the provider"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowApiKey(!showApiKey)}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
              </Box>

              <Box mb={3}>
                <TextField
                  fullWidth
                  label="API Endpoint"
                  value={formData.apiEndpoint}
                  onChange={(e) => updateFormData({ apiEndpoint: e.target.value })}
                  placeholder="https://api.example.com/v1/chat"
                  helperText={formData.provider === 'custom' ? 'Your custom API endpoint' : 'Default endpoint (can be customized)'}
                  disabled={formData.provider !== 'custom' && !formData.apiEndpoint}
                />
              </Box>

              {selectedProvider && selectedProvider.models.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={formData.model}
                    label="Model"
                    onChange={(e) => updateFormData({ model: e.target.value })}
                  >
                    {selectedProvider.models.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {formData.provider === 'custom' && (
                <Box mt={3}>
                  <TextField
                    fullWidth
                    label="Model Name"
                    value={formData.model}
                    onChange={(e) => updateFormData({ model: e.target.value })}
                    placeholder="your-model-name"
                    helperText="The model identifier for your custom API"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardHeader 
              title="Connection Test"
              avatar={getConnectionStatusIcon()}
            />
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Button
                  variant="contained"
                  onClick={handleTestConnection}
                  disabled={!formData.apiKey || isTestingConnection || !formData.provider}
                  startIcon={isTestingConnection ? <CircularProgress size={20} /> : <Api />}
                >
                  {isTestingConnection ? 'Testing Connection...' : 'Test Connection'}
                </Button>

                {connectionResult && (
                  <Chip
                    label={connectionResult.message}
                    color={getConnectionStatusColor()}
                    icon={getConnectionStatusIcon()}
                  />
                )}

                {connectionResult && connectionResult.latency && (
                  <Tooltip title="Response time">
                    <Chip
                      label={`${connectionResult.latency}ms`}
                      icon={<Speed />}
                      variant="outlined"
                      size="small"
                    />
                  </Tooltip>
                )}
              </Box>

              {connectionResult && (
                <Collapse in={showConnectionDetails}>
                  <Alert 
                    severity={connectionResult.success ? 'success' : 'error'}
                    action={
                      <IconButton
                        size="small"
                        onClick={() => setShowConnectionDetails(!showConnectionDetails)}
                      >
                        <Info />
                      </IconButton>
                    }
                  >
                    <Typography variant="body2">
                      <strong>{connectionResult.message}</strong>
                    </Typography>
                    {connectionResult.error && (
                      <Typography variant="body2" color="text.secondary">
                        {connectionResult.error}
                      </Typography>
                    )}
                    {connectionResult.success && connectionResult.model && (
                      <Typography variant="body2" color="text.secondary">
                        Model: {connectionResult.model}
                      </Typography>
                    )}
                  </Alert>
                </Collapse>
              )}

              {!connectionResult && (
                <Alert severity="info">
                  <Typography variant="body2">
                    Test your API connection to ensure your agent can be reached. 
                    This will make a small test request using your provided credentials.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" mt={4}>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!isFormValid()}
          size="large"
        >
          Next: Define Schemas
        </Button>
      </Box>
    </Box>
  );
};

export default ApiEndpointStep;

