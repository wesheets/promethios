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

  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    setIsLoading(true);
    try {
      // Load demo agents
      const agentsResponse = await fetch('/api/demo-agents');
      const agentsData = await agentsResponse.json();
      setAgents(agentsData);

      // Load test scenarios
      const scenariosResponse = await fetch('/api/test-scenarios');
      const scenariosData = await scenariosResponse.json();
      setScenarios(scenariosData);
    } catch (error) {
      console.error('Error loading demo data:', error);
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

  const handleStartDemo = () => {
    if (selectedAgents.length === 0) {
      alert('Please select at least one agent to start the demo.');
      return;
    }
    setChatPopupOpen(true);
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
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose agents with different specializations to form your team
              </Typography>
              
              <Grid container spacing={2}>
                {agents.map((agent) => (
                  <Grid item xs={12} sm={6} key={agent.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedAgents.includes(agent.id) ? 2 : 1,
                        borderColor: selectedAgents.includes(agent.id) 
                          ? getAgentColor(agent.id) 
                          : 'divider',
                        backgroundColor: selectedAgents.includes(agent.id) 
                          ? `${getAgentColor(agent.id)}10` 
                          : 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: getAgentColor(agent.id),
                          backgroundColor: `${getAgentColor(agent.id)}05`
                        }
                      }}
                      onClick={() => handleAgentToggle(agent.id)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Box sx={{ color: getAgentColor(agent.id), mr: 1 }}>
                            {getAgentIcon(agent.icon)}
                          </Box>
                          <Typography variant="h6" component="h3">
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
        onClose={() => setChatPopupOpen(false)}
        selectedAgents={selectedAgents.map(id => agents.find(a => a.id === id)!).filter(Boolean)}
        selectedScenario={scenarios.find(s => s.id === selectedScenario)}
      />
    </Container>
  );
};

