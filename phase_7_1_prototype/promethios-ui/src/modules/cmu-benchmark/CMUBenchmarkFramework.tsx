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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Chat as ChatIcon,
  Assessment as BenchmarkIcon,
  Security as GovernanceIcon
} from '@mui/icons-material';

interface DemoAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  provider: string;
}

interface CMUBenchmarkFrameworkProps {
  onAgentSelect?: (agent: DemoAgent) => void;
  onBenchmarkStart?: () => void;
}

export const CMUBenchmarkFramework: React.FC<CMUBenchmarkFrameworkProps> = ({
  onAgentSelect,
  onBenchmarkStart
}) => {
  console.log("CMUBenchmarkFramework rendering...");
  const [demoAgents, setDemoAgents] = useState<DemoAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<DemoAgent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadDemoAgents();
  }, []);

  const loadDemoAgents = async () => {
    // Simulate loading demo agents
    const mockAgents: DemoAgent[] = [
      {
        id: 'baseline-agent',
        name: 'Baseline Agent',
        description: 'A simple rule-based agent for baseline comparison. Provides straightforward responses without advanced reasoning.',
        capabilities: ['basic-reasoning', 'text-processing'],
        provider: 'OpenAI GPT-3.5'
      },
      {
        id: 'factual-agent',
        name: 'Factual Agent',
        description: 'Specialized in factual accuracy and information retrieval. Prioritizes correctness over creativity.',
        capabilities: ['information-retrieval', 'fact-checking', 'data-analysis'],
        provider: 'Anthropic Claude'
      },
      {
        id: 'creative-agent',
        name: 'Creative Agent',
        description: 'Focused on creative and diverse responses. Excels at brainstorming and innovative solutions.',
        capabilities: ['creative-writing', 'ideation', 'problem-solving'],
        provider: 'OpenAI GPT-4'
      },
      {
        id: 'governance-agent',
        name: 'Governance-Focused Agent',
        description: 'Emphasizes compliance with governance rules and ethical considerations in all responses.',
        capabilities: ['policy-adherence', 'risk-assessment', 'compliance-checking'],
        provider: 'Cohere Command'
      },
      {
        id: 'multi-tool-agent',
        name: 'Multi-Tool Agent',
        description: 'Demonstrates tool use across various domains. Can integrate with APIs and external services.',
        capabilities: ['tool-use', 'api-integration', 'workflow-automation'],
        provider: 'HuggingFace Transformers'
      }
    ];
    setDemoAgents(mockAgents);
  };

  const handleAgentClick = (agent: DemoAgent) => {
    setSelectedAgent(agent);
    setDialogOpen(true);
  };

  const handleChatWithAgent = () => {
    if (selectedAgent && onAgentSelect) {
      onAgentSelect(selectedAgent);
    }
    setDialogOpen(false);
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      'OpenAI GPT-3.5': '#10a37f',
      'OpenAI GPT-4': '#10a37f',
      'Anthropic Claude': '#d97706',
      'Cohere Command': '#7c3aed',
      'HuggingFace Transformers': '#ff6b35'
    };
    return colors[provider] || '#6b7280';
  };

  const getCapabilityIcon = (capability: string) => {
    const icons: Record<string, React.ReactNode> = {
      'basic-reasoning': <AgentIcon />,
      'information-retrieval': <BenchmarkIcon />,
      'fact-checking': <GovernanceIcon />,
      'creative-writing': <ChatIcon />,
      'policy-adherence': <GovernanceIcon />,
      'tool-use': <AgentIcon />
    };
    return icons[capability] || <AgentIcon />;
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          CMU Benchmark Demo Agents
        </Typography>
        <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
          Explore and interact with demo agents from The Agent Company benchmark. 
          Each agent represents different capabilities and approaches to AI assistance.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<BenchmarkIcon />}
            onClick={onBenchmarkStart}
            sx={{ backgroundColor: '#1976d2' }}
          >
            Run Benchmark Test
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {demoAgents.map(agent => (
          <Grid item xs={12} md={6} lg={4} key={agent.id}>
            <Card 
              sx={{ 
                backgroundColor: '#2a2a2a', 
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                }
              }}
              onClick={() => handleAgentClick(agent)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AgentIcon sx={{ mr: 1, color: getProviderColor(agent.provider) }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    {agent.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ color: '#ccc', mb: 2, minHeight: '60px' }}>
                  {agent.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                    Capabilities:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {agent.capabilities.map(capability => (
                      <Chip 
                        key={capability} 
                        label={capability} 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#555', 
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={agent.provider} 
                    size="small" 
                    sx={{ 
                      backgroundColor: getProviderColor(agent.provider), 
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ChatIcon />}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    Chat
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Agent Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2a2a2a', color: 'white' }
        }}
      >
        {selectedAgent && (
          <>
            <DialogTitle sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AgentIcon sx={{ mr: 1, color: getProviderColor(selectedAgent.provider) }} />
                {selectedAgent.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                {selectedAgent.description}
              </Typography>

              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Capabilities
              </Typography>
              <List>
                {selectedAgent.capabilities.map(capability => (
                  <ListItem key={capability}>
                    <ListItemIcon sx={{ color: 'white' }}>
                      {getCapabilityIcon(capability)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={capability}
                      sx={{ color: 'white' }}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2, backgroundColor: '#555' }} />

              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Provider
              </Typography>
              <Chip 
                label={selectedAgent.provider} 
                sx={{ 
                  backgroundColor: getProviderColor(selectedAgent.provider), 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDialogOpen(false)}
                sx={{ color: '#ccc' }}
              >
                Close
              </Button>
              <Button 
                onClick={handleChatWithAgent}
                variant="contained"
                startIcon={<ChatIcon />}
                sx={{ backgroundColor: '#1976d2' }}
              >
                Start Chat with Agent
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CMUBenchmarkFramework;

