/**
 * API Endpoints Deployment Component
 * 
 * Dedicated page for API endpoints deployment configuration
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
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Api as ApiIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Code as CodeIcon,
  Key as KeyIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Launch as LaunchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  authentication_required: boolean;
  rate_limit: number;
  enabled: boolean;
}

interface ApiConfig {
  enabled: boolean;
  base_url: string;
  api_version: string;
  authentication: {
    type: 'api_key' | 'bearer_token' | 'oauth2' | 'basic_auth';
    api_key?: string;
    token_expiry: number; // hours
    rate_limiting: boolean;
    cors_enabled: boolean;
    allowed_origins: string[];
  };
  endpoints: ApiEndpoint[];
  documentation: {
    swagger_enabled: boolean;
    interactive_docs: boolean;
    examples_included: boolean;
  };
  monitoring: {
    logging_enabled: boolean;
    analytics_enabled: boolean;
    error_tracking: boolean;
    performance_monitoring: boolean;
  };
}

const ApiEndpointsDeployment: React.FC = () => {
  const [config, setConfig] = useState<ApiConfig>({
    enabled: true,
    base_url: 'https://api.promethios.ai/v1',
    api_version: 'v1',
    authentication: {
      type: 'api_key',
      token_expiry: 24,
      rate_limiting: true,
      cors_enabled: true,
      allowed_origins: []
    },
    endpoints: [
      {
        id: '1',
        name: 'Send Message',
        method: 'POST',
        path: '/chat/message',
        description: 'Send a message to the chatbot and receive a response',
        authentication_required: true,
        rate_limit: 100,
        enabled: true
      },
      {
        id: '2',
        name: 'Get Conversation History',
        method: 'GET',
        path: '/chat/history/{conversation_id}',
        description: 'Retrieve conversation history for a specific conversation',
        authentication_required: true,
        rate_limit: 50,
        enabled: true
      },
      {
        id: '3',
        name: 'Create Conversation',
        method: 'POST',
        path: '/chat/conversation',
        description: 'Start a new conversation session',
        authentication_required: true,
        rate_limit: 20,
        enabled: true
      },
      {
        id: '4',
        name: 'Get Bot Status',
        method: 'GET',
        path: '/bot/status',
        description: 'Check the current status and health of the chatbot',
        authentication_required: false,
        rate_limit: 10,
        enabled: true
      }
    ],
    documentation: {
      swagger_enabled: true,
      interactive_docs: true,
      examples_included: true
    },
    monitoring: {
      logging_enabled: true,
      analytics_enabled: true,
      error_tracking: true,
      performance_monitoring: true
    }
  });

  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [newEndpoint, setNewEndpoint] = useState<Partial<ApiEndpoint>>({});

  const handleTestEndpoint = async (endpointId: string) => {
    setTestingEndpoint(endpointId);
    try {
      // TODO: Test API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Endpoint test failed:', error);
    } finally {
      setTestingEndpoint(null);
    }
  };

  const updateConfig = (section: keyof ApiConfig, updates: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  const addEndpoint = () => {
    if (newEndpoint.name && newEndpoint.method && newEndpoint.path) {
      const endpoint: ApiEndpoint = {
        id: Date.now().toString(),
        name: newEndpoint.name,
        method: newEndpoint.method as any,
        path: newEndpoint.path,
        description: newEndpoint.description || '',
        authentication_required: newEndpoint.authentication_required || true,
        rate_limit: newEndpoint.rate_limit || 100,
        enabled: true
      };
      
      setConfig(prev => ({
        ...prev,
        endpoints: [...prev.endpoints, endpoint]
      }));
      
      setNewEndpoint({});
    }
  };

  const removeEndpoint = (endpointId: string) => {
    setConfig(prev => ({
      ...prev,
      endpoints: prev.endpoints.filter(ep => ep.id !== endpointId)
    }));
  };

  const copyApiKey = () => {
    const apiKey = config.authentication.api_key || 'pk_live_example_api_key_12345';
    navigator.clipboard.writeText(apiKey);
  };

  const generateApiKey = () => {
    const newKey = `pk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    updateConfig('authentication', { api_key: newKey });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          <ApiIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'white' }} />
          API Endpoints Deployment
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Configure and manage API endpoints for programmatic access to your chatbot
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* API Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              API Configuration
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={(e) => updateConfig('enabled', e.target.checked)}
                />
              }
              label={<span style={{ color: 'white' }}>Enable API Access</span>}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Base URL"
              value={config.base_url}
              onChange={(e) => updateConfig('base_url', e.target.value)}
              margin="normal"
              InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& input': { color: 'white' }
                }
              }}
            />
            
            <TextField
              fullWidth
              label="API Version"
              value={config.api_version}
              onChange={(e) => updateConfig('api_version', e.target.value)}
              margin="normal"
              InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& input': { color: 'white' }
                }
              }}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Authentication Type</InputLabel>
              <Select
                value={config.authentication.type}
                onChange={(e) => updateConfig('authentication', { type: e.target.value })}
                label="Authentication Type"
                sx={{ 
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="api_key">API Key</MenuItem>
                <MenuItem value="bearer_token">Bearer Token</MenuItem>
                <MenuItem value="oauth2">OAuth 2.0</MenuItem>
                <MenuItem value="basic_auth">Basic Auth</MenuItem>
              </Select>
            </FormControl>
          </Paper>
          
          {/* Security Settings */}
          <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Security & Authentication
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TextField
                fullWidth
                label="API Key"
                value={config.authentication.api_key || 'pk_live_example_api_key_12345'}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '& input': { color: 'white' }
                  }
                }}
              />
              <Tooltip title="Copy API Key">
                <IconButton onClick={copyApiKey} sx={{ color: 'white' }}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<KeyIcon />}
              onClick={generateApiKey}
              sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)', mb: 2 }}
            >
              Generate New Key
            </Button>
            
            <TextField
              fullWidth
              label="Token Expiry (hours)"
              type="number"
              value={config.authentication.token_expiry}
              onChange={(e) => updateConfig('authentication', { token_expiry: parseInt(e.target.value) })}
              margin="normal"
              InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& input': { color: 'white' }
                }
              }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.authentication.rate_limiting}
                  onChange={(e) => updateConfig('authentication', { rate_limiting: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Enable Rate Limiting</span>}
              sx={{ mt: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.authentication.cors_enabled}
                  onChange={(e) => updateConfig('authentication', { cors_enabled: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Enable CORS</span>}
              sx={{ mt: 1 }}
            />
            
            <TextField
              fullWidth
              label="Allowed Origins (comma separated)"
              value={config.authentication.allowed_origins.join(', ')}
              onChange={(e) => updateConfig('authentication', { 
                allowed_origins: e.target.value.split(',').map(origin => origin.trim()).filter(origin => origin) 
              })}
              margin="normal"
              disabled={!config.authentication.cors_enabled}
              placeholder="https://yourapp.com, https://localhost:3000"
              InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& input': { color: 'white' }
                }
              }}
            />
          </Paper>
        </Grid>
        
        {/* API Endpoints Management */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              API Endpoints
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Method</TableCell>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Endpoint</TableCell>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Rate Limit</TableCell>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {config.endpoints.map((endpoint) => (
                    <TableRow key={endpoint.id}>
                      <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Chip 
                          label={endpoint.method} 
                          size="small"
                          color={endpoint.method === 'GET' ? 'success' : endpoint.method === 'POST' ? 'primary' : 'warning'}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {endpoint.path}
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        {endpoint.rate_limit}/min
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleTestEndpoint(endpoint.id)}
                          disabled={testingEndpoint === endpoint.id}
                          sx={{ color: 'white' }}
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => removeEndpoint(endpoint.id)}
                          sx={{ color: 'white' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
              Add New Endpoint
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Endpoint Name"
                  value={newEndpoint.name || ''}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
                  size="small"
                  InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '& input': { color: 'white' }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Method</InputLabel>
                  <Select
                    value={newEndpoint.method || ''}
                    onChange={(e) => setNewEndpoint(prev => ({ ...prev, method: e.target.value as any }))}
                    label="Method"
                    sx={{ 
                      color: 'white',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '.MuiSvgIcon-root': { color: 'white' }
                    }}
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endpoint Path"
                  value={newEndpoint.path || ''}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, path: e.target.value }))}
                  size="small"
                  placeholder="/api/custom-endpoint"
                  InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '& input': { color: 'white', fontFamily: 'monospace' }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addEndpoint}
                  sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  Add Endpoint
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Documentation & Monitoring */}
          <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Documentation & Monitoring
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.documentation.swagger_enabled}
                  onChange={(e) => updateConfig('documentation', { swagger_enabled: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Enable Swagger Documentation</span>}
              sx={{ mb: 1 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.documentation.interactive_docs}
                  onChange={(e) => updateConfig('documentation', { interactive_docs: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Interactive API Explorer</span>}
              sx={{ mb: 1 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.monitoring.logging_enabled}
                  onChange={(e) => updateConfig('monitoring', { logging_enabled: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>API Request Logging</span>}
              sx={{ mb: 1 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.monitoring.analytics_enabled}
                  onChange={(e) => updateConfig('monitoring', { analytics_enabled: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Usage Analytics</span>}
              sx={{ mb: 1 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.monitoring.error_tracking}
                  onChange={(e) => updateConfig('monitoring', { error_tracking: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Error Tracking</span>}
              sx={{ mb: 1 }}
            />
            
            <Box mt={3}>
              <Button
                variant="outlined"
                startIcon={<LaunchIcon />}
                onClick={() => window.open(`${config.base_url}/docs`, '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)', mr: 2 }}
              >
                View API Docs
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SpeedIcon />}
                onClick={() => window.open(`${config.base_url}/status`, '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
              >
                API Status
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Box mt={4}>
        <Alert 
          severity="info" 
          sx={{ 
            bgcolor: 'rgba(33, 150, 243, 0.1)', 
            border: '1px solid rgba(33, 150, 243, 0.3)',
            '& .MuiAlert-message': { color: 'white' }
          }}
        >
          API endpoints provide programmatic access to your chatbot. Use the generated API key to authenticate requests and integrate with your applications.
        </Alert>
      </Box>
      
      <Box mt={4}>
        <Button
          variant="contained"
          size="large"
          startIcon={<LaunchIcon />}
          onClick={() => window.open('https://docs.promethios.ai/api-reference', '_blank')}
        >
          View API Documentation
        </Button>
      </Box>
    </Container>
  );
};

export default ApiEndpointsDeployment;

