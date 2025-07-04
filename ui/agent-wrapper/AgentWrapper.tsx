import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Container
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Security as GovernanceIcon,
  Psychology as PsychologyIcon,
  Code as CodeIcon,
  Business as BusinessIcon,
  Science as ScienceIcon
} from '@mui/icons-material';
import { SHARED_DEMO_AGENTS, DemoAgent } from '../shared/DemoAgents';
import { useAgentContext } from '../context/AgentContext';

interface WrapperAgent {
  id: string;
  name: string;
  description: string;
  type: 'assistant' | 'specialist' | 'tool' | 'creative';
  provider: string;
  model: string;
  capabilities: string[];
  governance_enabled: boolean;
  status: 'active' | 'configured' | 'demo';
  api_endpoint?: string;
  system_prompt?: string;
}

interface AgentWrapperProps {
  onAgentWrapped?: (agent: WrapperAgent) => void;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://promethios-phase-7-1-api.onrender.com';

// Demo agents for the Agent Wrapper (subset of shared demo agents)
const DEMO_WRAPPER_AGENTS: WrapperAgent[] = [
  {
    id: 'helpful-assistant',
    name: 'Helpful Assistant',
    description: 'A general-purpose AI assistant that provides helpful, harmless, and honest responses across a wide range of topics.',
    type: 'assistant',
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo',
    capabilities: ['general-assistance', 'question-answering', 'task-planning', 'conversation'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a helpful, harmless, and honest AI assistant. Provide clear, accurate, and useful responses while being respectful and considerate.'
  },
  {
    id: 'code-specialist',
    name: 'Code Specialist',
    description: 'A specialized coding assistant that helps with programming tasks, code review, debugging, and technical documentation.',
    type: 'specialist',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['code-generation', 'debugging', 'code-review', 'technical-documentation'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are an expert programming assistant. Help with code generation, debugging, best practices, and technical explanations. Always prioritize security and maintainability.'
  },
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    description: 'A business-focused AI that helps with strategy, analysis, market research, and business planning.',
    type: 'specialist',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    capabilities: ['business-analysis', 'strategy-planning', 'market-research', 'data-interpretation'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a business analyst AI. Provide strategic insights, market analysis, and business recommendations based on data and best practices.'
  },
  {
    id: 'creative-writer',
    name: 'Creative Writer',
    description: 'A creative AI assistant specialized in writing, storytelling, content creation, and creative ideation.',
    type: 'creative',
    provider: 'Anthropic',
    model: 'claude-3-opus',
    capabilities: ['creative-writing', 'storytelling', 'content-creation', 'ideation'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a creative writing assistant. Help with storytelling, content creation, creative ideation, and writing improvement while maintaining originality and engagement.'
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'A research-focused AI that helps with information gathering, analysis, fact-checking, and academic writing.',
    type: 'specialist',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['research', 'fact-checking', 'analysis', 'academic-writing'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a research assistant AI. Help with information gathering, fact-checking, analysis, and academic writing while ensuring accuracy and proper sourcing.'
  }
];

const AgentWrapper: React.FC<AgentWrapperProps> = ({ onAgentWrapped }) => {
  // State management
  const [agents, setAgents] = useState<WrapperAgent[]>(DEMO_WRAPPER_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<WrapperAgent | null>(null);
  const [isWrapperDialogOpen, setIsWrapperDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Wrapper configuration state
  const [wrapperConfig, setWrapperConfig] = useState({
    name: '',
    description: '',
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo',
    api_endpoint: '',
    api_key: '',
    system_prompt: '',
    governance_enabled: true,
    auto_discovery: true
  });

  // Agent context
  const { addAgent } = useAgentContext();

  // Load agents on component mount
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to load from API, fallback to demo agents
      try {
        const response = await fetch(`${API_BASE_URL}/api/agents`);
        if (response.ok) {
          const apiAgents = await response.json();
          if (apiAgents && apiAgents.length > 0) {
            setAgents([...DEMO_WRAPPER_AGENTS, ...apiAgents]);
          }
        }
      } catch (apiError) {
        console.warn('Could not load agents from API, using demo agents:', apiError);
      }
      
    } catch (error) {
      console.error('Error loading agents:', error);
      setError('Failed to load agents. Using demo agents.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWrapAgent = (agent: WrapperAgent) => {
    setSelectedAgent(agent);
    setWrapperConfig({
      name: agent.name,
      description: agent.description,
      provider: agent.provider,
      model: agent.model,
      api_endpoint: agent.api_endpoint || '',
      api_key: '',
      system_prompt: agent.system_prompt || '',
      governance_enabled: agent.governance_enabled,
      auto_discovery: true
    });
    setIsWrapperDialogOpen(true);
  };

  const handleCreateWrapper = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!wrapperConfig.name.trim()) {
        throw new Error('Agent name is required');
      }
      if (!wrapperConfig.description.trim()) {
        throw new Error('Agent description is required');
      }
      if (!wrapperConfig.provider.trim()) {
        throw new Error('Provider is required');
      }
      if (!wrapperConfig.model.trim()) {
        throw new Error('Model is required');
      }

      // Create wrapped agent
      const wrappedAgent: WrapperAgent = {
        id: `wrapped_${Date.now()}`,
        name: wrapperConfig.name,
        description: wrapperConfig.description,
        type: selectedAgent?.type || 'assistant',
        provider: wrapperConfig.provider,
        model: wrapperConfig.model,
        capabilities: selectedAgent?.capabilities || ['general-assistance'],
        governance_enabled: wrapperConfig.governance_enabled,
        status: 'configured',
        api_endpoint: wrapperConfig.api_endpoint,
        system_prompt: wrapperConfig.system_prompt
      };

      // Try to save to API
      try {
        const response = await fetch(`${API_BASE_URL}/api/agents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(wrappedAgent)
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
      } catch (apiError) {
        console.warn('Could not save to API, proceeding with local storage:', apiError);
      }

      // Add to local state
      setAgents(prev => [...prev, wrappedAgent]);
      
      // Add to agent context
      if (addAgent) {
        addAgent({
          id: wrappedAgent.id,
          name: wrappedAgent.name,
          description: wrappedAgent.description,
          type: wrappedAgent.type,
          status: 'active',
          capabilities: wrappedAgent.capabilities,
          governance_enabled: wrappedAgent.governance_enabled
        });
      }

      // Call callback if provided
      if (onAgentWrapped) {
        onAgentWrapped(wrappedAgent);
      }

      setSuccess(`Successfully wrapped ${wrappedAgent.name}!`);
      setIsWrapperDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Error creating wrapper:', error);
      setError(error instanceof Error ? error.message : 'Failed to create agent wrapper');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsWrapperDialogOpen(false);
    setSelectedAgent(null);
    setError(null);
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'assistant': return <AgentIcon />;
      case 'specialist': return <PsychologyIcon />;
      case 'tool': return <CodeIcon />;
      case 'creative': return <ScienceIcon />;
      default: return <AgentIcon />;
    }
  };

  const getTypeColor = (type: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (type) {
      case 'assistant': return 'primary';
      case 'specialist': return 'secondary';
      case 'tool': return 'info';
      case 'creative': return 'success';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Agent Wrapper
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Wrap your AI agents with governance controls for secure testing and deployment
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && !isWrapperDialogOpen && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Agents Grid */}
      <Grid container spacing={3}>
        {agents.map((agent) => (
          <Grid item xs={12} md={6} lg={4} key={agent.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {getAgentIcon(agent.type)}
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      {agent.name}
                    </Typography>
                    <Chip 
                      label={agent.type} 
                      size="small" 
                      color={getTypeColor(agent.type)}
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {agent.description}
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    Provider: {agent.provider} • Model: {agent.model}
                  </Typography>
                </Box>
                
                <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                  {agent.capabilities.slice(0, 3).map((capability) => (
                    <Chip 
                      key={capability} 
                      label={capability} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Chip 
                      label={`+${agent.capabilities.length - 3} more`} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
                
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <GovernanceIcon fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    Governance: {agent.governance_enabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
              </CardContent>
              
              <Box p={2} pt={0}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleWrapAgent(agent)}
                  disabled={isLoading}
                >
                  Wrap Agent
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Wrapper Configuration Dialog */}
      <Dialog 
        open={isWrapperDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Configure Agent Wrapper
          {selectedAgent && (
            <Typography variant="subtitle2" color="text.secondary">
              Wrapping: {selectedAgent.name}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Agent Name"
                value={wrapperConfig.name}
                onChange={(e) => setWrapperConfig(prev => ({ ...prev, name: e.target.value }))}
                required
                sx={{
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Provider</InputLabel>
                <Select
                  value={wrapperConfig.provider}
                  onChange={(e) => setWrapperConfig(prev => ({ ...prev, provider: e.target.value }))}
                  label="Provider"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' }
                  }}
                >
                  <MenuItem value="OpenAI">OpenAI</MenuItem>
                  <MenuItem value="Anthropic">Anthropic</MenuItem>
                  <MenuItem value="Google">Google</MenuItem>
                  <MenuItem value="Custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model"
                value={wrapperConfig.model}
                onChange={(e) => setWrapperConfig(prev => ({ ...prev, model: e.target.value }))}
                required
                sx={{
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Endpoint (Optional)"
                value={wrapperConfig.api_endpoint}
                onChange={(e) => setWrapperConfig(prev => ({ ...prev, api_endpoint: e.target.value }))}
                placeholder="https://api.example.com/v1"
                sx={{
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={wrapperConfig.description}
                onChange={(e) => setWrapperConfig(prev => ({ ...prev, description: e.target.value }))}
                required
                sx={{
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="System Prompt (Optional)"
                value={wrapperConfig.system_prompt}
                onChange={(e) => setWrapperConfig(prev => ({ ...prev, system_prompt: e.target.value }))}
                placeholder="You are a helpful AI assistant..."
                sx={{
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={wrapperConfig.governance_enabled}
                    onChange={(e) => setWrapperConfig(prev => ({ ...prev, governance_enabled: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Enable Governance Controls"
                sx={{ color: 'white' }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={wrapperConfig.auto_discovery}
                    onChange={(e) => setWrapperConfig(prev => ({ ...prev, auto_discovery: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Auto-Discovery Enabled"
                sx={{ color: 'white' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateWrapper}
            variant="contained"
            disabled={isLoading || !wrapperConfig.name.trim() || !wrapperConfig.description.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {isLoading ? 'Creating...' : 'Create Wrapper'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AgentWrapper;

