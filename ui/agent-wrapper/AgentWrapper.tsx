import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
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
  Divider
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
import { darkTheme } from '../theme/darkTheme';

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
    description: 'A creative AI specialized in writing, storytelling, content creation, and artistic expression.',
    type: 'creative',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['creative-writing', 'storytelling', 'content-creation', 'brainstorming'],
    governance_enabled: false,
    status: 'demo',
    system_prompt: 'You are a creative writing assistant. Help with storytelling, creative content, brainstorming, and artistic expression. Be imaginative and inspiring.'
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'A research-focused AI that helps with information gathering, analysis, and academic writing.',
    type: 'specialist',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    capabilities: ['research', 'information-gathering', 'academic-writing', 'fact-checking'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a research assistant. Help with information gathering, analysis, academic writing, and fact-checking. Always cite sources and maintain accuracy.'
  }
];

export const AgentWrapper: React.FC<AgentWrapperProps> = ({ onAgentWrapped }) => {
  const { addWrappedAgent, wrappedAgents } = useAgentContext();
  const [demoAgents, setDemoAgents] = useState<WrapperAgent[]>(DEMO_WRAPPER_AGENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<WrapperAgent | null>(null);
  const [newAgent, setNewAgent] = useState<Partial<WrapperAgent>>({
    name: '',
    description: '',
    type: 'assistant',
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo',
    capabilities: [],
    governance_enabled: true,
    status: 'configured'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assistant': return <PsychologyIcon />;
      case 'specialist': return <ScienceIcon />;
      case 'tool': return <CodeIcon />;
      case 'creative': return <BusinessIcon />;
      default: return <AgentIcon />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assistant': return '#2196f3';
      case 'specialist': return '#9c27b0';
      case 'tool': return '#ff9800';
      case 'creative': return '#e91e63';
      default: return '#757575';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'OpenAI': return '#10a37f';
      case 'Anthropic': return '#d97706';
      case 'Cohere': return '#7c3aed';
      case 'HuggingFace': return '#ff6b35';
      default: return '#6b7280';
    }
  };

  const handleWrapDemoAgent = async (agent: WrapperAgent) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call to wrap the agent
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const wrappedAgent: any = {
        ...agent,
        id: `wrapped_${agent.id}_${Date.now()}`,
        status: 'active',
        api_endpoint: `${API_BASE_URL}/api/chat/chat`,
        role: agent.type === 'assistant' ? 'specialist' : 
              agent.type === 'creative' ? 'specialist' :
              agent.type === 'tool' ? 'executor' : 'specialist',
        collaboration_style: 'parallel'
      };

      // Add to shared context
      addWrappedAgent(wrappedAgent);
      
      if (onAgentWrapped) {
        onAgentWrapped(wrappedAgent);
      }

      setSelectedAgent(null);
      setDialogOpen(false);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to wrap agent');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewAgent = () => {
    setNewAgent({
      name: '',
      description: '',
      type: 'assistant',
      provider: 'OpenAI',
      model: 'gpt-3.5-turbo',
      capabilities: [],
      governance_enabled: true,
      status: 'configured'
    });
    setSelectedAgent(null);
    setDialogOpen(true);
  };

  const handleSaveNewAgent = async () => {
    if (!newAgent.name || !newAgent.description) {
      setError('Name and description are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const agent: any = {
        id: `custom_${Date.now()}`,
        name: newAgent.name!,
        description: newAgent.description!,
        type: newAgent.type as any,
        provider: newAgent.provider!,
        model: newAgent.model!,
        capabilities: newAgent.capabilities || [],
        governance_enabled: newAgent.governance_enabled!,
        status: 'active',
        api_endpoint: `${API_BASE_URL}/api/chat/chat`,
        system_prompt: newAgent.system_prompt,
        role: newAgent.type === 'assistant' ? 'specialist' : 
              newAgent.type === 'creative' ? 'specialist' :
              newAgent.type === 'tool' ? 'executor' : 'specialist',
        collaboration_style: 'parallel'
      };

      // Add to shared context
      addWrappedAgent(agent);
      
      if (onAgentWrapped) {
        onAgentWrapped(agent);
      }

      setDialogOpen(false);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ p: 3, backgroundColor: '#0D1117', minHeight: '100vh', color: 'white' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            Agent Wrapping
          </Typography>
          <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
            Wrap AI agents with Promethios governance to add trust metrics, compliance monitoring, and ethical oversight to any LLM or custom AI API.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
        )}
      </Box>

      {/* Demo Agents Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'white', mb: 3 }}>
          🚀 Demo Agents - Try These First!
        </Typography>
        <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
          These pre-configured demo agents showcase different types of AI assistants you can wrap with Promethios governance.
          Click "Wrap Agent" to see governance in action!
        </Typography>
        
        <Grid container spacing={3}>
          {demoAgents.map(agent => (
            <Grid item xs={12} md={6} lg={4} key={agent.id}>
              <Card 
                sx={{ 
                  backgroundColor: '#2a2a2a', 
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: '2px solid #4caf50',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
                  }
                }}
                onClick={() => {
                  setSelectedAgent(agent);
                  setDialogOpen(true);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getTypeIcon(agent.type)}
                    <Typography variant="h6" sx={{ color: 'white', ml: 1, flex: 1 }}>
                      {agent.name}
                    </Typography>
                    <Chip 
                      label="DEMO" 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#4caf50', 
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 2, minHeight: '60px' }}>
                    {agent.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip 
                        label={agent.type} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getTypeColor(agent.type), 
                          color: 'white'
                        }}
                      />
                      <Chip 
                        label={agent.provider} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getProviderColor(agent.provider), 
                          color: 'white'
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GovernanceIcon sx={{ 
                        color: agent.governance_enabled ? '#4caf50' : '#ccc',
                        fontSize: 16 
                      }} />
                      <Typography variant="caption" sx={{ 
                        color: agent.governance_enabled ? '#4caf50' : '#ccc' 
                      }}>
                        {agent.governance_enabled ? 'Governance Ready' : 'No Governance'}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ 
                      backgroundColor: '#4caf50',
                      '&:hover': { backgroundColor: '#45a049' }
                    }}
                  >
                    Wrap Agent
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 4, backgroundColor: '#555' }} />

      {/* Wrap New Agent Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'white', mb: 3 }}>
          Wrap New Agent
        </Typography>
        <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
          Create and wrap your own custom AI agent with Promethios governance.
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleCreateNewAgent}
          sx={{ 
            color: 'white', 
            borderColor: 'white',
            '&:hover': {
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)'
            }
          }}
        >
          Create New Agent
        </Button>
      </Box>

      {/* Wrapped Agents Section */}
      {wrappedAgents.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'white', mb: 3 }}>
            Your Wrapped Agents ({wrappedAgents.length})
          </Typography>
          
          <Grid container spacing={3}>
            {wrappedAgents.map(agent => (
              <Grid item xs={12} md={6} lg={4} key={agent.id}>
                <Card sx={{ backgroundColor: '#2a2a2a', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getTypeIcon(agent.type)}
                      <Typography variant="h6" sx={{ color: 'white', ml: 1, flex: 1 }}>
                        {agent.name}
                      </Typography>
                      <Chip 
                        label={agent.user_created ? "CUSTOM" : "DEMO"} 
                        size="small" 
                        sx={{ 
                          backgroundColor: agent.user_created ? '#1976d2' : '#4caf50', 
                          color: 'white'
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                      {agent.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip 
                        label={agent.provider} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getProviderColor(agent.provider), 
                          color: 'white'
                        }}
                      />
                      <Chip 
                        label="Governed" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#4caf50', 
                          color: 'white'
                        }}
                      />
                    </Box>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<SettingsIcon />}
                      sx={{ color: 'white', borderColor: 'white' }}
                    >
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Agent Configuration Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2a2a2a', color: 'white' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          {selectedAgent ? `Wrap ${selectedAgent.name}` : 'Create New Agent'}
        </DialogTitle>
        <DialogContent>
          {selectedAgent ? (
            // Demo agent wrapping
            <Box>
              <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                {selectedAgent.description}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Agent Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Type:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>{selectedAgent.type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Provider:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>{selectedAgent.provider}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Model:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>{selectedAgent.model}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Governance:</Typography>
                    <Typography variant="body1" sx={{ 
                      color: selectedAgent.governance_enabled ? '#4caf50' : '#f44336' 
                    }}>
                      {selectedAgent.governance_enabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Alert severity="info" sx={{ backgroundColor: '#1976d2', color: 'white', mb: 2 }}>
                This demo agent will be wrapped with Promethios governance, adding trust metrics, compliance monitoring, and ethical oversight. Once wrapped, it will be available for multi-agent team building.
              </Alert>
            </Box>
          ) : (
            // New agent creation
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Agent Name"
                    value={newAgent.name || ''}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: '#555' },
                        '&:hover fieldset': { borderColor: '#777' },
                        '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                      },
                      '& .MuiInputLabel-root': { color: '#ccc' }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={newAgent.description || ''}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, description: e.target.value }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: '#555' },
                        '&:hover fieldset': { borderColor: '#777' },
                        '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                      },
                      '& .MuiInputLabel-root': { color: '#ccc' }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#ccc' }}>Type</InputLabel>
                    <Select
                      value={newAgent.type || 'assistant'}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, type: e.target.value as any }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#777' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' }
                      }}
                    >
                      <MenuItem value="assistant">Assistant</MenuItem>
                      <MenuItem value="specialist">Specialist</MenuItem>
                      <MenuItem value="tool">Tool</MenuItem>
                      <MenuItem value="creative">Creative</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#ccc' }}>Provider</InputLabel>
                    <Select
                      value={newAgent.provider || 'OpenAI'}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, provider: e.target.value }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#777' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' }
                      }}
                    >
                      <MenuItem value="OpenAI">OpenAI</MenuItem>
                      <MenuItem value="Anthropic">Anthropic</MenuItem>
                      <MenuItem value="Cohere">Cohere</MenuItem>
                      <MenuItem value="HuggingFace">HuggingFace</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newAgent.governance_enabled || false}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, governance_enabled: e.target.checked }))}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#4caf50' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4caf50' }
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GovernanceIcon sx={{ color: newAgent.governance_enabled ? '#4caf50' : '#ccc' }} />
                        <Typography sx={{ color: 'white' }}>
                          Enable Promethios Governance
                        </Typography>
                      </Box>
                    }
                    sx={{ color: 'white' }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{ color: '#ccc' }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={selectedAgent ? () => handleWrapDemoAgent(selectedAgent) : handleSaveNewAgent}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : (selectedAgent ? 'Wrap Agent' : 'Create Agent')}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AgentWrapper;

