import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Container,
  Paper,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Psychology as PsychologyIcon,
  Code as CodeIcon,
  Business as BusinessIcon,
  Shield as ShieldIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { MultiAgentChatPopup } from './MultiAgentChatPopup';
import { useMultiAgentCoordination } from '../../hooks/useMultiAgentCoordination';
import { multiAgentService } from '../../services/multiAgentService';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  provider: string;
  model: string;
  icon: string;
  governance_enabled: boolean;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  prompt: string;
  expected_capabilities: string[];
  governance_requirements: string[];
}

export const PrometheusMultiAgentDemo: React.FC = () => {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatPopupOpen, setChatPopupOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentContextId, setCurrentContextId] = useState<string | null>(null);

  // Use real multi-agent coordination
  const [multiAgentState, multiAgentActions] = useMultiAgentCoordination({
    autoStart: false
  });

  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load demo agents (using static data for now, can be moved to API later)
      const demoAgents: Agent[] = [
        {
          id: 'creative_agent',
          name: 'Creative Agent',
          description: 'Specializes in creative writing, brainstorming, and innovative solutions',
          capabilities: ['creative_writing', 'brainstorming', 'storytelling'],
          provider: 'anthropic',
          model: 'claude-3-sonnet',
          icon: 'psychology',
          governance_enabled: true
        },
        {
          id: 'factual_agent',
          name: 'Factual Agent',
          description: 'Focuses on research, fact-checking, and analytical tasks',
          capabilities: ['research', 'fact_checking', 'analysis'],
          provider: 'openai',
          model: 'gpt-4',
          icon: 'analytics',
          governance_enabled: true
        },
        {
          id: 'governance_agent',
          name: 'Governance Agent',
          description: 'Ensures compliance, policy adherence, and ethical considerations',
          capabilities: ['governance', 'compliance', 'ethics'],
          provider: 'anthropic',
          model: 'claude-3-opus',
          icon: 'shield',
          governance_enabled: true
        }
      ];
      
      setAgents(demoAgents);

      // Load test scenarios
      const demoScenarios: TestScenario[] = [
        {
          id: 'customer_support',
          name: 'Customer Support Team',
          description: 'Collaborative customer support with creative and factual agents',
          prompt: 'Help a customer who is having trouble with their account login',
          expected_capabilities: ['problem_solving', 'communication', 'technical_support'],
          governance_requirements: ['data_privacy', 'customer_service_standards']
        },
        {
          id: 'content_creation',
          name: 'Content Creation Team',
          description: 'Create engaging content with fact-checking and governance oversight',
          prompt: 'Create a blog post about sustainable technology trends',
          expected_capabilities: ['creative_writing', 'research', 'fact_checking'],
          governance_requirements: ['accuracy_standards', 'content_guidelines']
        },
        {
          id: 'strategic_planning',
          name: 'Strategic Planning Team',
          description: 'Develop strategic plans with creative input and governance review',
          prompt: 'Develop a strategic plan for expanding into new markets',
          expected_capabilities: ['strategic_thinking', 'market_analysis', 'risk_assessment'],
          governance_requirements: ['business_ethics', 'compliance_review']
        }
      ];
      
      setScenarios(demoScenarios);
      
    } catch (error) {
      console.error('Error loading demo data:', error);
      setError('Failed to load demo data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleStartDemo = async () => {
    if (selectedAgents.length === 0) {
      setError('Please select at least one agent to start the demo.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a real multi-agent context
      const selectedScenarioData = scenarios.find(s => s.id === selectedScenario);
      const contextName = selectedScenarioData?.name || 'Multi-Agent Demo';
      
      const context = await multiAgentActions.createContext({
        name: contextName,
        agent_ids: selectedAgents,
        collaboration_model: 'shared_context',
        policies: {
          trustThreshold: 0.7,
          requireConsensus: false,
          governanceEnabled: true,
          auditLevel: 'standard'
        },
        governance_enabled: true,
        metadata: {
          scenario: selectedScenario,
          demo: true,
          created_by: 'prometheus_demo'
        }
      });

      setCurrentContextId(context.context_id);
      setChatPopupOpen(true);
      
    } catch (error) {
      console.error('Error creating multi-agent context:', error);
      setError('Failed to start demo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentIcon = (iconName: string) => {
    switch (iconName) {
      case '🤖': return <PsychologyIcon />;
      case '📊': return <AnalyticsIcon />;
      case '🎨': return <CodeIcon />;
      case '🛡️': return <ShieldIcon />;
      case '🔧': return <BuildIcon />;
      default: return <GroupIcon />;
    }
  };

  const getAgentColor = (agentId: string) => {
    switch (agentId) {
      case 'baseline_agent': return '#6B7280';
      case 'factual_agent': return '#3B82F6';
      case 'creative_agent': return '#8B5CF6';
      case 'governance_focused_agent': return '#10B981';
      case 'multi_tool_agent': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4} textAlign="center">
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #10B981, #3B82F6)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent'
        }}>
          Promethios Multi-Agent Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Experience real-time multi-agent collaboration with governance controls
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select agents, give them a complex task, and watch how governance enables better teamwork
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Agent Selection */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" component="h2">
                  Select Demo Agents
                </Typography>
                 {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading Display */}
      {isLoading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            {multiAgentState.isLoading ? 'Creating multi-agent context...' : 'Loading demo data...'}
          </Typography>
        </Box>
      )}

      {/* Multi-Agent State Display */}
      {multiAgentState.context && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Multi-agent context created: {multiAgentState.context.name} (ID: {multiAgentState.context.context_id})
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Agent Selection */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" component="h2">
                  Select Agents
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                  {selectedAgents.length} selected
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {agents.map((agent) => (
                  <Grid item xs={12} sm={6} md={4} key={agent.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedAgents.includes(agent.id) ? '2px solid #10B981' : '1px solid #e0e0e0',
                        backgroundColor: selectedAgents.includes(agent.id) ? '#f0fdf4' : 'white',
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onClick={() => handleAgentToggle(agent.id)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          {getAgentIcon(agent.icon)}
                          <Typography variant="h6" sx={{ ml: 1, fontSize: '1rem' }}>
                            {agent.name}
                          </Typography>
                          {agent.governance_enabled && (
                            <Chip 
                              label="Governance" 
                              size="small" 
                              sx={{ ml: 'auto', backgroundColor: '#10B981', color: 'white' }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {agent.description}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {agent.capabilities.slice(0, 3).map((capability) => (
                            <Chip 
                              key={capability}
                              label={capability}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Scenario Selection & Controls */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" component="h2">
                  Demo Scenarios
                </Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Test Scenario</InputLabel>
                <Select
                  value={selectedScenario}
                  label="Test Scenario"
                  onChange={(e) => setSelectedScenario(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Custom Task (Enter Your Own)</em>
                  </MenuItem>
                  {scenarios.map((scenario) => (
                    <MenuItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedScenario && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    {scenarios.find(s => s.id === selectedScenario)?.description}
                  </Typography>
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Selected Team
              </Typography>
              {selectedAgents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No agents selected
                </Typography>
              ) : (
                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  {selectedAgents.map((agentId) => {
                    const agent = agents.find(a => a.id === agentId);
                    return agent ? (
                      <Chip
                        key={agentId}
                        label={agent.name}
                        onDelete={() => handleAgentToggle(agentId)}
                        sx={{ 
                          backgroundColor: getAgentColor(agentId),
                          color: 'white',
                          '& .MuiChip-deleteIcon': { color: 'white' }
                        }}
                      />
                    ) : null;
                  })}
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<ChatIcon />}
                onClick={handleStartDemo}
                disabled={selectedAgents.length === 0}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(45deg, #10B981, #3B82F6)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #059669, #2563EB)',
                  }
                }}
              >
                Start Multi-Agent Demo
              </Button>
            </CardContent>
          </Card>

          {/* Demo Features */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Demo Features
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center">
                  <GroupIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2">Real-time collaboration</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <ShieldIcon sx={{ mr: 1, color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Governance comparison</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <AnalyticsIcon sx={{ mr: 1, color: 'info.main', fontSize: 20 }} />
                  <Typography variant="body2">Live metrics dashboard</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <ChatIcon sx={{ mr: 1, color: 'warning.main', fontSize: 20 }} />
                  <Typography variant="body2">Shared context chat</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Multi-Agent Chat Popup */}
      <MultiAgentChatPopup
        open={chatPopupOpen}
        onClose={() => {
          setChatPopupOpen(false);
          setCurrentContextId(null);
        }}
        selectedAgents={selectedAgents.map(id => agents.find(a => a.id === id)!).filter(Boolean)}
        selectedScenario={scenarios.find(s => s.id === selectedScenario)}
        contextId={currentContextId}
        multiAgentState={multiAgentState}
        multiAgentActions={multiAgentActions}
      />
    </Container>
  );
};

