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
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Chat as ChatIcon,
  Assessment as BenchmarkIcon,
  Security as GovernanceIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface DemoAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  provider: string;
  model?: string;
  governance_compatible?: boolean;
  status?: string;
  governanceEnabled?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  governance_metrics?: any;
}

interface CMUBenchmarkFrameworkProps {
  onAgentSelect?: (agent: DemoAgent) => void;
  onBenchmarkStart?: () => void;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://promethios-phase-7-1-api.onrender.com';

export const CMUBenchmarkFramework: React.FC<CMUBenchmarkFrameworkProps> = ({
  onAgentSelect,
  onBenchmarkStart
}) => {
  console.log("CMUBenchmarkFramework rendering...");
  const [demoAgents, setDemoAgents] = useState<DemoAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<DemoAgent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [governanceEnabled, setGovernanceEnabled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDemoAgents();
  }, []);

  const loadDemoAgents = async () => {
    try {
      setAgentsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/chat/agents`);
      if (!response.ok) {
        throw new Error(`Failed to load agents: ${response.statusText}`);
      }
      
      const agents = await response.json();
      setDemoAgents(agents);
    } catch (error) {
      console.error('Error loading agents:', error);
      setError(error instanceof Error ? error.message : 'Failed to load agents');
      
      // Fallback to mock agents if API fails
      const mockAgents: DemoAgent[] = [
        {
          id: 'baseline-agent',
          name: 'Baseline Agent',
          description: 'A simple rule-based agent for baseline comparison. Provides straightforward responses without advanced reasoning.',
          capabilities: ['basic-reasoning', 'text-processing'],
          provider: 'OpenAI GPT-3.5',
          status: 'fallback'
        },
        {
          id: 'factual-agent',
          name: 'Factual Agent',
          description: 'Specialized in factual accuracy and information retrieval. Prioritizes correctness over creativity.',
          capabilities: ['information-retrieval', 'fact-checking', 'data-analysis'],
          provider: 'Anthropic Claude',
          status: 'fallback'
        },
        {
          id: 'creative-agent',
          name: 'Creative Agent',
          description: 'Focused on creative and diverse responses. Excels at brainstorming and innovative solutions.',
          capabilities: ['creative-writing', 'ideation', 'problem-solving'],
          provider: 'OpenAI GPT-4',
          status: 'fallback'
        },
        {
          id: 'governance-agent',
          name: 'Governance-Focused Agent',
          description: 'Emphasizes compliance with governance rules and ethical considerations in all responses.',
          capabilities: ['policy-adherence', 'risk-assessment', 'compliance-checking'],
          provider: 'Cohere Command',
          status: 'fallback'
        },
        {
          id: 'multi-tool-agent',
          name: 'Multi-Tool Agent',
          description: 'Demonstrates tool use across various domains. Can integrate with APIs and external services.',
          capabilities: ['tool-use', 'api-integration', 'workflow-automation'],
          provider: 'HuggingFace Transformers',
          status: 'fallback'
        }
      ];
      setDemoAgents(mockAgents);
    } finally {
      setAgentsLoading(false);
    }
  };

  const handleAgentClick = (agent: DemoAgent) => {
    setSelectedAgent(agent);
    setDialogOpen(true);
  };

  const handleChatWithAgent = () => {
    if (selectedAgent) {
      setChatMessages([]);
      setSessionId(null);
      setChatOpen(true);
      setDialogOpen(false);
      
      // Also call the onAgentSelect callback if provided
      if (onAgentSelect) {
        onAgentSelect({ ...selectedAgent, governanceEnabled });
      }
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !selectedAgent || chatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          message: currentMessage,
          governance_enabled: governanceEnabled,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update session ID if new
      if (result.session_id && !sessionId) {
        setSessionId(result.session_id);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.response,
        timestamp: result.timestamp,
        governance_metrics: result.governance_metrics
      };

      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        governance_metrics: {
          trust_score: 0,
          compliance_score: 0,
          risk_level: 'error',
          governance_enabled: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
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

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <SuccessIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
      case 'fallback':
        return <ErrorIcon sx={{ color: '#ff9800', fontSize: 16 }} />;
      default:
        return <AgentIcon sx={{ color: '#ccc', fontSize: 16 }} />;
    }
  };

  const getTrustScoreColor = (score: number | null) => {
    if (score === null) return '#ccc';
    if (score >= 0.8) return '#4caf50';
    if (score >= 0.6) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          CMU Benchmark Demo Agents
        </Typography>
        <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
          Explore and interact with real demo agents from The Agent Company benchmark. 
          Each agent connects to live LLM APIs and can be tested with or without Promethios governance.
        </Typography>
        
        {error && (
          <Alert severity="warning" sx={{ mb: 2, backgroundColor: '#2a2a2a', color: 'white' }}>
            API Connection Issue: {error}. Using fallback mode.
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<BenchmarkIcon />}
            onClick={onBenchmarkStart}
            sx={{ backgroundColor: '#1976d2' }}
          >
            Run Benchmark Test
          </Button>
          
          <FormControlLabel
            control={
              <Switch
                checked={governanceEnabled}
                onChange={(e) => setGovernanceEnabled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4caf50',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4caf50',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GovernanceIcon sx={{ color: governanceEnabled ? '#4caf50' : '#ccc' }} />
                <Typography sx={{ color: 'white' }}>
                  Enable Governance for Chat
                </Typography>
              </Box>
            }
            sx={{ color: 'white' }}
          />
        </Box>
      </Box>

      {agentsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      ) : (
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
                    <Typography variant="h6" sx={{ color: 'white', flex: 1 }}>
                      {agent.name}
                    </Typography>
                    {getStatusIcon(agent.status)}
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
      )}

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
                <Box sx={{ ml: 'auto' }}>
                  {getStatusIcon(selectedAgent.status)}
                </Box>
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
                Provider & Model
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  label={selectedAgent.provider} 
                  sx={{ 
                    backgroundColor: getProviderColor(selectedAgent.provider), 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                {selectedAgent.model && (
                  <Chip 
                    label={selectedAgent.model} 
                    sx={{ 
                      backgroundColor: '#555', 
                      color: 'white'
                    }}
                  />
                )}
              </Box>
              
              <Divider sx={{ my: 2, backgroundColor: '#555' }} />
              
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Chat Configuration
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={governanceEnabled}
                    onChange={(e) => setGovernanceEnabled(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4caf50',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4caf50',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GovernanceIcon sx={{ color: governanceEnabled ? '#4caf50' : '#ccc' }} />
                    <Typography sx={{ color: 'white' }}>
                      Enable Governance
                    </Typography>
                  </Box>
                }
                sx={{ color: 'white' }}
              />
              <Typography variant="body2" sx={{ color: '#ccc', mt: 1, ml: 4 }}>
                {governanceEnabled 
                  ? "Chat with Promethios governance monitoring, trust scores, and compliance checks"
                  : "Direct chat without governance - ungoverned agent behavior"
                }
              </Typography>
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
                sx={{ 
                  backgroundColor: governanceEnabled ? '#4caf50' : '#1976d2',
                  '&:hover': {
                    backgroundColor: governanceEnabled ? '#45a049' : '#1565c0'
                  }
                }}
              >
                Start Chat {governanceEnabled ? '(Governed)' : '(Ungoverned)'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Chat Dialog */}
      <Dialog 
        open={chatOpen} 
        onClose={() => setChatOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2a2a2a', color: 'white', height: '80vh' }
        }}
      >
        {selectedAgent && (
          <>
            <DialogTitle sx={{ color: 'white', borderBottom: '1px solid #555' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AgentIcon sx={{ mr: 1, color: getProviderColor(selectedAgent.provider) }} />
                  Chat with {selectedAgent.name}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GovernanceIcon sx={{ color: governanceEnabled ? '#4caf50' : '#ccc' }} />
                  <Typography variant="body2" sx={{ color: governanceEnabled ? '#4caf50' : '#ccc' }}>
                    {governanceEnabled ? 'Governed' : 'Ungoverned'}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0, height: '100%' }}>
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {chatMessages.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#ccc', textAlign: 'center', mt: 4 }}>
                    Start a conversation with {selectedAgent.name}
                  </Typography>
                ) : (
                  chatMessages.map((message, index) => (
                    <Paper 
                      key={index}
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        backgroundColor: message.role === 'user' ? '#1976d2' : '#333',
                        color: 'white',
                        ml: message.role === 'user' ? 4 : 0,
                        mr: message.role === 'user' ? 0 : 4
                      }}
                    >
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {message.content}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Typography>
                        {message.governance_metrics && (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {message.governance_metrics.trust_score !== null && (
                              <Chip 
                                label={`Trust: ${(message.governance_metrics.trust_score * 100).toFixed(0)}%`}
                                size="small"
                                sx={{ 
                                  backgroundColor: getTrustScoreColor(message.governance_metrics.trust_score),
                                  color: 'white',
                                  fontSize: '0.7rem'
                                }}
                              />
                            )}
                            <Chip 
                              label={message.governance_metrics.risk_level}
                              size="small"
                              sx={{ 
                                backgroundColor: message.governance_metrics.risk_level === 'low' ? '#4caf50' : 
                                               message.governance_metrics.risk_level === 'medium' ? '#ff9800' : '#f44336',
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  ))
                )}
                {chatLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  </Box>
                )}
              </Box>
              <Box sx={{ p: 2, borderTop: '1px solid #555' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type your message..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={chatLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: '#555' },
                        '&:hover fieldset': { borderColor: '#777' },
                        '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || chatLoading}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <SendIcon />
                  </Button>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setChatOpen(false)}
                sx={{ color: '#ccc' }}
              >
                Close Chat
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CMUBenchmarkFramework;

