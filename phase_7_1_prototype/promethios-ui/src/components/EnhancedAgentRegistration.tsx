import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Slider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Security,
  AutoAwesome,
  Speed,
  Assessment,
  AttachMoney,
} from '@mui/icons-material';

interface EnhancedAgentRegistrationProps {
  initialData?: {
    agentName?: string;
    description?: string;
    apiEndpoint?: string;
    apiKey?: string;
    provider?: string;
  };
  onDataChange?: (data: any) => void;
  showGovernanceOptions?: boolean;
  title?: string;
  subtitle?: string;
}

const EnhancedAgentRegistration: React.FC<EnhancedAgentRegistrationProps> = ({
  initialData = {},
  onDataChange,
  showGovernanceOptions = false,
  title = "Agent Configuration",
  subtitle = "Configure your AI agent with auto-discovery and enhanced settings"
}) => {
  const [agentName, setAgentName] = useState(initialData.agentName || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [apiEndpoint, setApiEndpoint] = useState(initialData.apiEndpoint || '');
  const [apiKey, setApiKey] = useState(initialData.apiKey || '');
  const [provider, setProvider] = useState(initialData.provider || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredInfo, setDiscoveredInfo] = useState<any>(null);
  
  // Enhanced state for model and capability selection
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [selectedContextLength, setSelectedContextLength] = useState<number>(4096);
  const [governanceLevel, setGovernanceLevel] = useState('basic');

  // Auto-discovery function with enhanced provider support
  const discoverAgentInfo = async () => {
    if (!apiKey.trim() || !provider) return;
    
    setIsDiscovering(true);
    try {
      // Simulate auto-discovery based on provider
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let discoveredData: any = {};
      
      switch (provider) {
        case 'OpenAI':
          discoveredData = {
            name: agentName || 'OpenAI Assistant',
            description: 'Advanced language model with chat, code generation, and analysis capabilities',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            capabilities: ['chat', 'code_generation', 'data_analysis', 'function_calling', 'image_analysis', 'text_to_speech'],
            models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
            contextLength: 128000,
            supportsFunctions: true,
            pricing: {
              'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
              'gpt-4': { input: 0.03, output: 0.06 },
              'gpt-4-turbo': { input: 0.01, output: 0.03 },
              'gpt-4o': { input: 0.005, output: 0.015 },
              'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
            }
          };
          break;
        case 'Anthropic':
          discoveredData = {
            name: agentName || 'Claude Assistant',
            description: 'Constitutional AI with strong reasoning and safety features',
            endpoint: 'https://api.anthropic.com/v1/messages',
            capabilities: ['chat', 'reasoning', 'analysis', 'constitutional_ai', 'document_analysis', 'creative_writing'],
            models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus', 'claude-3.5-sonnet'],
            contextLength: 200000,
            supportsFunctions: false,
            pricing: {
              'claude-3-haiku': { input: 0.00025, output: 0.00125 },
              'claude-3-sonnet': { input: 0.003, output: 0.015 },
              'claude-3-opus': { input: 0.015, output: 0.075 },
              'claude-3.5-sonnet': { input: 0.003, output: 0.015 }
            }
          };
          break;
        case 'Google':
          discoveredData = {
            name: agentName || 'Gemini Assistant',
            description: 'Multimodal AI with text, image, and code capabilities',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            capabilities: ['chat', 'multimodal', 'code_generation', 'image_understanding', 'video_analysis'],
            models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-pro-vision'],
            contextLength: 1000000,
            supportsFunctions: true,
            pricing: {
              'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
              'gemini-1.5-flash': { input: 0.00035, output: 0.00105 }
            }
          };
          break;
        case 'Hugging Face':
          discoveredData = {
            name: agentName || 'Hugging Face Model',
            description: 'Open-source models from the Hugging Face Hub',
            endpoint: 'https://api-inference.huggingface.co/models/',
            capabilities: ['chat', 'text_generation', 'summarization', 'translation', 'question_answering'],
            models: ['meta-llama/Llama-2-70b-chat-hf', 'microsoft/DialoGPT-large', 'facebook/blenderbot-400M-distill'],
            contextLength: 4096,
            supportsFunctions: false,
            pricing: { 'inference-api': { input: 0.0002, output: 0.0002 } }
          };
          break;
        case 'Cohere':
          discoveredData = {
            name: agentName || 'Cohere Assistant',
            description: 'Enterprise-focused language models for business applications',
            endpoint: 'https://api.cohere.ai/v1/generate',
            capabilities: ['chat', 'text_generation', 'summarization', 'classification', 'semantic_search'],
            models: ['command', 'command-light', 'command-nightly', 'command-r', 'command-r-plus'],
            contextLength: 128000,
            supportsFunctions: true,
            pricing: {
              'command': { input: 0.0015, output: 0.002 },
              'command-r': { input: 0.0005, output: 0.0015 }
            }
          };
          break;
        case 'Azure':
          discoveredData = {
            name: agentName || 'Azure Microsoft Assistant',
            description: 'Enterprise OpenAI models hosted on Azure with enhanced security',
            endpoint: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-12-01-preview',
            capabilities: ['chat', 'code_generation', 'data_analysis', 'function_calling', 'enterprise_security'],
            models: ['gpt-35-turbo', 'gpt-4', 'gpt-4-32k', 'gpt-4-turbo'],
            contextLength: 32000,
            supportsFunctions: true,
            pricing: {
              'gpt-35-turbo': { input: 0.0015, output: 0.002 },
              'gpt-4': { input: 0.03, output: 0.06 }
            }
          };
          break;
        case 'Grok':
          discoveredData = {
            name: agentName || 'Grok Assistant',
            description: 'X.AI\'s conversational AI with real-time information and humor',
            endpoint: 'https://api.x.ai/v1/chat/completions',
            capabilities: ['chat', 'real_time_info', 'humor', 'reasoning', 'current_events'],
            models: ['grok-beta', 'grok-vision-beta'],
            contextLength: 131072,
            supportsFunctions: true,
            pricing: {
              'grok-beta': { input: 0.005, output: 0.015 },
              'grok-vision-beta': { input: 0.01, output: 0.03 }
            }
          };
          break;
        case 'Mistral':
          discoveredData = {
            name: agentName || 'Mistral Assistant',
            description: 'European AI with strong reasoning and multilingual capabilities',
            endpoint: 'https://api.mistral.ai/v1/chat/completions',
            capabilities: ['chat', 'reasoning', 'multilingual', 'code_generation', 'function_calling'],
            models: ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large-latest'],
            contextLength: 32768,
            supportsFunctions: true,
            pricing: {
              'mistral-tiny': { input: 0.00025, output: 0.00025 },
              'mistral-small': { input: 0.002, output: 0.006 },
              'mistral-medium': { input: 0.0027, output: 0.0081 },
              'mistral-large-latest': { input: 0.008, output: 0.024 }
            }
          };
          break;
        case 'Perplexity':
          discoveredData = {
            name: agentName || 'Perplexity Assistant',
            description: 'AI-powered search and reasoning with real-time web access',
            endpoint: 'https://api.perplexity.ai/chat/completions',
            capabilities: ['chat', 'web_search', 'real_time_info', 'reasoning', 'citations'],
            models: ['llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-huge-128k-online'],
            contextLength: 127072,
            supportsFunctions: false,
            pricing: {
              'llama-3.1-sonar-small-128k-online': { input: 0.0002, output: 0.0002 },
              'llama-3.1-sonar-large-128k-online': { input: 0.001, output: 0.001 },
              'llama-3.1-sonar-huge-128k-online': { input: 0.005, output: 0.005 }
            }
          };
          break;
        case 'Together':
          discoveredData = {
            name: agentName || 'Together AI Assistant',
            description: 'Open-source models with fast inference and competitive pricing',
            endpoint: 'https://api.together.xyz/v1/chat/completions',
            capabilities: ['chat', 'code_generation', 'reasoning', 'open_source', 'fast_inference'],
            models: ['meta-llama/Llama-2-70b-chat-hf', 'meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
            contextLength: 4096,
            supportsFunctions: true,
            pricing: {
              'meta-llama/Llama-2-70b-chat-hf': { input: 0.0009, output: 0.0009 },
              'meta-llama/Llama-3-70b-chat-hf': { input: 0.0009, output: 0.0009 },
              'mistralai/Mixtral-8x7B-Instruct-v0.1': { input: 0.0006, output: 0.0006 }
            }
          };
          break;
        case 'Replicate':
          discoveredData = {
            name: agentName || 'Replicate Assistant',
            description: 'Run open-source models in the cloud with easy deployment',
            endpoint: 'https://api.replicate.com/v1/predictions',
            capabilities: ['chat', 'image_generation', 'code_generation', 'open_source', 'custom_models'],
            models: ['meta/llama-2-70b-chat', 'mistralai/mixtral-8x7b-instruct-v0.1', 'meta/codellama-34b-instruct'],
            contextLength: 4096,
            supportsFunctions: false,
            pricing: {
              'meta/llama-2-70b-chat': { input: 0.00065, output: 0.00275 },
              'mistralai/mixtral-8x7b-instruct-v0.1': { input: 0.0003, output: 0.001 },
              'meta/codellama-34b-instruct': { input: 0.0005, output: 0.0025 }
            }
          };
          break;
        default:
          discoveredData = {
            name: agentName || 'Custom Agent',
            description: 'Custom AI agent with configurable capabilities',
            endpoint: '',
            capabilities: ['chat'],
            models: ['custom-model'],
            contextLength: 4096,
            supportsFunctions: false
          };
      }
      
      // Add model characteristics for better user selection
      if (discoveredData.models) {
        discoveredData.modelCharacteristics = {};
        discoveredData.models.forEach((model: string) => {
          // Define characteristics for each model
          if (model.includes('gpt-3.5') || model.includes('command-light') || model.includes('haiku') || model.includes('flash') || model.includes('mistral-tiny') || model.includes('sonar-small')) {
            discoveredData.modelCharacteristics[model] = {
              speed: '⚡ Fastest',
              accuracy: '🎯 Standard',
              cost: '💰 Lowest cost'
            };
          } else if (model.includes('gpt-4o-mini') || model.includes('command-r') || model.includes('gemini-pro') || model.includes('mistral-small') || model.includes('llama-2') || model.includes('mixtral')) {
            discoveredData.modelCharacteristics[model] = {
              speed: '⚡ Fast',
              accuracy: '🎯 High Accuracy',
              cost: '💰 Budget-friendly'
            };
          } else if (model.includes('gpt-4-turbo') || model.includes('sonnet') || model.includes('gemini-1.5-pro') || model.includes('mistral-medium') || model.includes('grok-beta') || model.includes('sonar-large')) {
            discoveredData.modelCharacteristics[model] = {
              speed: '⚡ Standard',
              accuracy: '🎯 Most Reliable',
              cost: '💰 Premium'
            };
          } else if (model.includes('gpt-4o') || model.includes('opus') || model.includes('command-r-plus') || model.includes('mistral-large') || model.includes('grok-vision') || model.includes('sonar-huge')) {
            discoveredData.modelCharacteristics[model] = {
              speed: '⚡ Standard',
              accuracy: '🎯 Highest Quality',
              cost: '💰 Premium+'
            };
          } else {
            discoveredData.modelCharacteristics[model] = {
              speed: '⚡ Standard',
              accuracy: '🎯 Standard',
              cost: '💰 Variable'
            };
          }
        });
      }
      
      setDiscoveredInfo(discoveredData);
      
      // Explicitly preserve the provider value to prevent corruption
      setProvider(provider);
      
      // Auto-populate fields if they're empty
      if (!agentName.trim()) setAgentName(discoveredData.name);
      if (!description.trim()) setDescription(discoveredData.description);
      if (!apiEndpoint.trim()) setApiEndpoint(discoveredData.endpoint);
      
      // Set default selections for model and capabilities
      if (discoveredData.models && discoveredData.models.length > 0) {
        setSelectedModel(discoveredData.models[0]); // Select first model by default
      }
      if (discoveredData.capabilities && discoveredData.capabilities.length > 0) {
        setSelectedCapabilities([...discoveredData.capabilities]); // Select all capabilities by default
      }
      if (discoveredData.contextLength) {
        setSelectedContextLength(discoveredData.contextLength);
      }
      
    } catch (error) {
      console.error('Auto-discovery failed:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Trigger auto-discovery when provider or API key changes (skip for Custom providers)
  useEffect(() => {
    if (provider && provider !== 'Custom' && apiKey.trim().length > 10) {
      const timer = setTimeout(() => {
        discoverAgentInfo();
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timer);
    }
  }, [provider, apiKey]); // Only depend on provider and apiKey

  // Notify parent component of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        agentName,
        description,
        apiEndpoint,
        apiKey,
        provider,
        selectedModel,
        selectedCapabilities,
        selectedContextLength,
        governanceLevel,
        discoveredInfo
      });
    }
  }, [agentName, description, apiEndpoint, apiKey, provider, selectedModel, selectedCapabilities, selectedContextLength, governanceLevel, discoveredInfo]);

  const governanceLevels = [
    {
      value: 'basic',
      label: 'Basic Governance',
      description: 'Trust scoring, audit logging, basic violation alerts',
      color: '#10b981',
      features: ['Trust Scoring', 'Audit Logs', 'Basic Alerts']
    },
    {
      value: 'strict',
      label: 'Strict Governance',
      description: 'HIPAA/SOC2 compliance, enhanced monitoring, detailed audit trails',
      color: '#ef4444',
      features: ['HIPAA Compliance', 'Enhanced Monitoring', 'Detailed Audits', 'Policy Enforcement']
    },
    {
      value: 'custom',
      label: 'Custom Governance',
      description: 'Advanced configuration for power users',
      color: '#8b5cf6',
      features: ['Custom Policies', 'Advanced Rules', 'Full Customization']
    }
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
        {subtitle}
      </Typography>

      {/* Auto-Discovery Alert - Different message for Custom providers */}
      {provider === 'Custom' ? (
        <Alert 
          severity="warning" 
          sx={{ 
            backgroundColor: '#92400e', 
            color: 'white',
            mb: 3,
            '& .MuiAlert-icon': { color: 'white' },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            ⚙️ Manual Configuration Required
          </Typography>
          <Typography variant="body2">
            For Custom/Other APIs, please manually enter the API Endpoint, capabilities, and models. 
            Auto-discovery is not available for custom providers.
          </Typography>
        </Alert>
      ) : (
        <Alert 
          severity="info" 
          sx={{ 
            backgroundColor: '#1e3a8a', 
            color: 'white',
            mb: 3,
            '& .MuiAlert-icon': { color: 'white' },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            💡 Auto-Discovery Enabled
          </Typography>
          <Typography variant="body2">
            Select a provider and enter your API key - we'll automatically discover and populate 
            your agent's capabilities, models, and optimal settings!
          </Typography>
        </Alert>
      )}

      {isDiscovering && (
        <Alert 
          severity="info" 
          sx={{ 
            backgroundColor: '#065f46', 
            color: 'white',
            mb: 3,
            '& .MuiAlert-icon': { color: 'white' },
          }}
        >
          <Typography variant="body2">
            🔍 Discovering agent capabilities... This may take a moment.
          </Typography>
        </Alert>
      )}

      {discoveredInfo && (
        <Alert 
          severity="success" 
          sx={{ 
            backgroundColor: '#166534', 
            color: 'white',
            mb: 3,
            '& .MuiAlert-icon': { color: 'white' },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            ✅ Discovery Complete!
          </Typography>
          <Typography variant="body2">
            Found {discoveredInfo.models?.length || 0} models, {discoveredInfo.capabilities?.length || 0} capabilities. 
            Context length: {discoveredInfo.contextLength?.toLocaleString() || 'Unknown'} tokens.
          </Typography>
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Agent Name *"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="e.g., Customer Support Bot"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a202c',
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#718096' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' },
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' },
            }}
          />
          
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your agent's capabilities"
            multiline
            rows={3}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a202c',
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#718096' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' },
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' },
            }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Provider</InputLabel>
            <Select
              value={provider}
              label="Provider"
              onChange={(e) => setProvider(e.target.value)}
              sx={{
                backgroundColor: '#1a202c',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
              }}
            >
              <MenuItem value="">Select Provider</MenuItem>
              <MenuItem value="OpenAI">OpenAI</MenuItem>
              <MenuItem value="Anthropic">Anthropic</MenuItem>
              <MenuItem value="Google">Google</MenuItem>
              <MenuItem value="Hugging Face">Hugging Face</MenuItem>
              <MenuItem value="Cohere">Cohere</MenuItem>
              <MenuItem value="Azure">Azure Microsoft</MenuItem>
              <MenuItem value="Grok">Grok (X.AI)</MenuItem>
              <MenuItem value="Mistral">Mistral AI</MenuItem>
              <MenuItem value="Perplexity">Perplexity</MenuItem>
              <MenuItem value="Together">Together AI</MenuItem>
              <MenuItem value="Replicate">Replicate</MenuItem>
              <MenuItem value="Custom">Custom/Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="API Endpoint *"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="https://api.openai.com/v1/chat/completions"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a202c',
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#718096' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' },
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' },
            }}
          />
          
          <TextField
            fullWidth
            label="API Key *"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your API key from the provider"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowApiKey(!showApiKey)}
                    edge="end"
                    sx={{ color: '#a0aec0' }}
                  >
                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a202c',
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#718096' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' },
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' },
            }}
          />
          
          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: '#1e3a8a', 
              color: 'white',
              '& .MuiAlert-icon': { color: 'white' },
            }}
          >
            <Typography variant="body2">
              Your API credentials are stored securely and will be used to connect 
              to your agent during the wrapping process.
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Enhanced Model Selection - Only show after discovery */}
      {discoveredInfo && discoveredInfo.models && discoveredInfo.models.length > 0 && (
        <Box sx={{ mt: 3, mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2, fontWeight: 'bold' }}>
            🤖 Select Model
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Choose Model</InputLabel>
            <Select
              value={selectedModel}
              label="Choose Model"
              onChange={(e) => setSelectedModel(e.target.value)}
              sx={{
                backgroundColor: '#1a202c',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#2d3748',
                    color: 'white',
                    border: '1px solid #4a5568',
                    maxHeight: 400,
                  },
                },
              }}
            >
              {discoveredInfo.models.map((model: string) => {
                const characteristics = discoveredInfo.modelCharacteristics?.[model];
                const pricing = discoveredInfo.pricing?.[model];
                return (
                  <MenuItem 
                    key={model} 
                    value={model}
                    sx={{ 
                      py: 2, 
                      borderBottom: '1px solid #4a5568',
                      '&:hover': { backgroundColor: '#374151' },
                      '&.Mui-selected': { backgroundColor: '#1e3a8a' },
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'white' }}>
                          {model}
                        </Typography>
                        {selectedModel === model && (
                          <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />
                        )}
                      </Box>
                      
                      {characteristics && (
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={characteristics.speed}
                            size="small"
                            sx={{
                              backgroundColor: '#065f46',
                              color: '#10b981',
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                          <Chip
                            label={characteristics.accuracy}
                            size="small"
                            sx={{
                              backgroundColor: '#1e3a8a',
                              color: '#3b82f6',
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                          <Chip
                            label={characteristics.cost}
                            size="small"
                            sx={{
                              backgroundColor: '#92400e',
                              color: '#f59e0b',
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        </Box>
                      )}
                      
                      {pricing && (
                        <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                          💰 Input: ${pricing.input}/1K tokens • Output: ${pricing.output}/1K tokens
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          
          {/* Model Details Card */}
          {selectedModel && discoveredInfo.modelCharacteristics?.[selectedModel] && (
            <Card sx={{ backgroundColor: '#374151', border: '1px solid #4b5563', mb: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ color: '#d1d5db', mb: 1, fontWeight: 'bold' }}>
                  📊 {selectedModel} Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                        Speed
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                        {discoveredInfo.modelCharacteristics[selectedModel].speed}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                        Accuracy
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                        {discoveredInfo.modelCharacteristics[selectedModel].accuracy}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                        Cost
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                        {discoveredInfo.modelCharacteristics[selectedModel].cost}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Enhanced Capabilities Selection - Only show after discovery */}
      {discoveredInfo && discoveredInfo.capabilities && discoveredInfo.capabilities.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2, fontWeight: 'bold' }}>
            ⚡ Select Capabilities
          </Typography>
          <Card sx={{ backgroundColor: '#374151', border: '1px solid #4b5563' }}>
            <CardContent>
              <FormGroup>
                <Grid container spacing={1}>
                  {discoveredInfo.capabilities.map((capability: string) => (
                    <Grid item xs={12} sm={6} md={4} key={capability}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedCapabilities.includes(capability)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCapabilities(prev => [...prev, capability]);
                              } else {
                                setSelectedCapabilities(prev => prev.filter(c => c !== capability));
                              }
                            }}
                            sx={{
                              color: '#a0aec0',
                              '&.Mui-checked': { color: '#3182ce' },
                            }}
                          />
                        }
                        label={capability.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        sx={{ color: '#a0aec0' }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Advanced Settings */}
      {discoveredInfo && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2, fontWeight: 'bold' }}>
            ⚙️ Advanced Settings
          </Typography>
          <Card sx={{ backgroundColor: '#374151', border: '1px solid #4b5563' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: '#d1d5db', mb: 2 }}>
                Context Length: {selectedContextLength.toLocaleString()} tokens
              </Typography>
              <Slider
                value={selectedContextLength}
                onChange={(_, value) => setSelectedContextLength(value as number)}
                min={1024}
                max={discoveredInfo.contextLength || 128000}
                step={1024}
                marks={[
                  { value: 1024, label: '1K' },
                  { value: 4096, label: '4K' },
                  { value: 16384, label: '16K' },
                  { value: 32768, label: '32K' },
                  { value: 128000, label: '128K' },
                ]}
                sx={{
                  color: '#3182ce',
                  '& .MuiSlider-markLabel': { color: '#9ca3af', fontSize: '0.75rem' },
                }}
              />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Governance Level Selection - Only show if enabled */}
      {showGovernanceOptions && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2, fontWeight: 'bold' }}>
            🛡️ Choose Governance Level
          </Typography>
          <Grid container spacing={2}>
            {governanceLevels.map((level) => (
              <Grid item xs={12} md={4} key={level.value}>
                <Card
                  sx={{
                    backgroundColor: governanceLevel === level.value ? 'rgba(59, 130, 246, 0.1)' : '#374151',
                    border: `2px solid ${governanceLevel === level.value ? '#3b82f6' : '#4b5563'}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': { borderColor: level.color }
                  }}
                  onClick={() => setGovernanceLevel(level.value)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: level.color,
                          mr: 2
                        }}
                      />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        {level.label}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      {level.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {level.features.map((feature) => (
                        <Chip
                          key={feature}
                          label={feature}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            fontSize: '0.7rem',
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default EnhancedAgentRegistration;

