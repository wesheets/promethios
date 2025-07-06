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
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Chat as ChatIcon,
  Assessment as BenchmarkIcon,
  Security as GovernanceIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
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

interface ChatSession {
  [agentId: string]: {
    messages: ChatMessage[];
    sessionId: string | null;
    governanceEnabled: boolean;
  };
}

interface CMUBenchmarkFrameworkProps {
  onAgentSelect?: (agent: DemoAgent) => void;
  onBenchmarkStart?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://promethios-phase-7-1-api.onrender.com';

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
  const [chatSessions, setChatSessions] = useState<ChatSession>({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDemoAgents();
  }, []);

  // Get current chat session for selected agent
  const getCurrentChatSession = () => {
    if (!selectedAgent) return { messages: [], sessionId: null, governanceEnabled: false };
    
    const sessionKey = `${selectedAgent.id}_${governanceEnabled ? 'governed' : 'ungoverned'}`;
    return chatSessions[sessionKey] || { 
      messages: [], 
      sessionId: null, 
      governanceEnabled: governanceEnabled 
    };
  };

  // Update chat session for selected agent
  const updateChatSession = (updates: Partial<ChatSession[string]>) => {
    if (!selectedAgent) return;
    
    const sessionKey = `${selectedAgent.id}_${governanceEnabled ? 'governed' : 'ungoverned'}`;
    setChatSessions(prev => ({
      ...prev,
      [sessionKey]: {
        ...getCurrentChatSession(),
        ...updates
      }
    }));
  };

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
      setChatOpen(true);
      setDialogOpen(false);
      
      // Also call the onAgentSelect callback if provided
      if (onAgentSelect) {
        onAgentSelect({ ...selectedAgent, governanceEnabled });
      }
    }
  };

  const handleGovernanceToggle = (enabled: boolean) => {
    setGovernanceEnabled(enabled);
    // When governance setting changes, we keep the same agent but potentially start a new session
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !selectedAgent || chatLoading) return;

    const currentSession = getCurrentChatSession();
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    // Add user message to current session
    updateChatSession({
      messages: [...currentSession.messages, userMessage]
    });

    const messageToSend = currentMessage;
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
          message: messageToSend,
          governance_enabled: governanceEnabled,
          session_id: currentSession.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        governance_metrics: data.governance_metrics
      };

      // Update session with assistant response and session ID
      const updatedSession = getCurrentChatSession();
      updateChatSession({
        messages: [...updatedSession.messages, assistantMessage],
        sessionId: data.session_id,
        governanceEnabled: governanceEnabled
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };

      const updatedSession = getCurrentChatSession();
      updateChatSession({
        messages: [...updatedSession.messages, errorMessage]
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const clearCurrentChat = () => {
    updateChatSession({
      messages: [],
      sessionId: null
    });
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'OpenAI GPT-3.5':
      case 'OpenAI GPT-4':
        return '#10a37f';
      case 'Anthropic Claude':
        return '#d97706';
      case 'Cohere Command':
        return '#7c3aed';
      case 'HuggingFace Transformers':
        return '#ff6b35';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'fallback':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const currentChatSession = getCurrentChatSession();

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          CMU AI Safety Benchmark
        </Typography>
        <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
          Test and compare AI agents across different providers with optional Promethios governance integration.
          Each agent demonstrates different capabilities and approaches to AI safety and performance.
        </Typography>

        {error && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2, backgroundColor: '#2a2a2a', color: 'white' }}
            action={
              <IconButton size="small" onClick={loadDemoAgents} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            }
          >
            {error} - Using fallback agents for demonstration.
          </Alert>
        )}
      </Box>

      {/* Governance Toggle */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3, backgroundColor: '#2a2a2a', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Promethios Governance
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                Enable governance to add trust metrics, compliance monitoring, and ethical oversight to agent responses.
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={governanceEnabled}
                  onChange={(e) => handleGovernanceToggle(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#4caf50' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4caf50' }
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GovernanceIcon sx={{ color: governanceEnabled ? '#4caf50' : '#ccc' }} />
                  <Typography sx={{ color: 'white' }}>
                    {governanceEnabled ? 'Governance Enabled' : 'Standard Mode'}
                  </Typography>
                </Box>
              }
              sx={{ color: 'white', ml: 2 }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Demo Agents Grid */}
      {agentsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#4caf50' }} />
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
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                  }
                }}
                onClick={() => handleAgentClick(agent)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AgentIcon sx={{ mr: 1, color: '#4caf50' }} />
                    <Typography variant="h6" sx={{ color: 'white', flex: 1 }}>
                      {agent.name}
                    </Typography>
                    <Chip 
                      label={agent.status || 'active'} 
                      size="small" 
                      sx={{ 
                        backgroundColor: getStatusColor(agent.status || 'active'), 
                        color: 'white',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 2, minHeight: '60px' }}>
                    {agent.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={agent.provider} 
                      size="small" 
                      sx={{ 
                        backgroundColor: getProviderColor(agent.provider), 
                        color: 'white',
                        mr: 1,
                        mb: 1
                      }}
                    />
                    {agent.capabilities.slice(0, 2).map(capability => (
                      <Chip 
                        key={capability}
                        label={capability} 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#555', 
                          color: 'white',
                          mr: 1,
                          mb: 1
                        }}
                      />
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<ChatIcon />}
                    sx={{ 
                      backgroundColor: '#4caf50',
                      '&:hover': { backgroundColor: '#45a049' }
                    }}
                  >
                    Chat with Agent
                  </Button>
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
                <AgentIcon sx={{ mr: 1, color: '#4caf50' }} />
                {selectedAgent.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                {selectedAgent.description}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Agent Capabilities
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedAgent.capabilities.map(capability => (
                    <Chip 
                      key={capability}
                      label={capability} 
                      size="small" 
                      sx={{ backgroundColor: '#555', color: 'white' }}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Technical Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Provider:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>{selectedAgent.provider}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Model:</Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>{selectedAgent.model || 'Default'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Status:</Typography>
                    <Typography variant="body1" sx={{ 
                      color: getStatusColor(selectedAgent.status || 'active') 
                    }}>
                      {selectedAgent.status || 'active'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>Governance:</Typography>
                    <Typography variant="body1" sx={{ 
                      color: governanceEnabled ? '#4caf50' : '#f44336' 
                    }}>
                      {governanceEnabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Alert severity="info" sx={{ backgroundColor: '#1976d2', color: 'white' }}>
                This agent will be tested with Promethios governance {governanceEnabled ? 'enabled' : 'disabled'}. 
                You can toggle governance settings and compare responses to evaluate the impact of AI safety measures.
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDialogOpen(false)}
                sx={{ color: '#ccc' }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleChatWithAgent}
                variant="contained"
                startIcon={<ChatIcon />}
                sx={{ 
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#45a049' }
                }}
              >
                Start Chat
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
                  <ChatIcon sx={{ mr: 1, color: '#4caf50' }} />
                  Chat with {selectedAgent.name}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip 
                    label={governanceEnabled ? 'Governed' : 'Standard'} 
                    size="small" 
                    sx={{ 
                      backgroundColor: governanceEnabled ? '#4caf50' : '#f44336', 
                      color: 'white'
                    }}
                  />
                  <IconButton onClick={() => setChatOpen(false)} sx={{ color: 'white' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Chat Messages */}
              <Box sx={{ flex: 1, p: 2, overflow: 'auto', maxHeight: '400px' }}>
                {currentChatSession.messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Start a conversation with {selectedAgent.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      Governance is {governanceEnabled ? 'enabled' : 'disabled'} for this session
                    </Typography>
                  </Box>
                ) : (
                  currentChatSession.messages.map((message, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        mb: 2,
                        display: 'flex',
                        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <Paper 
                        sx={{ 
                          p: 2, 
                          maxWidth: '80%',
                          backgroundColor: message.role === 'user' ? '#1976d2' : '#333',
                          color: 'white'
                        }}
                      >
                        <Typography variant="body2">
                          {message.content}
                        </Typography>
                        {message.governance_metrics && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #555' }}>
                            <Typography variant="caption" sx={{ color: '#ccc' }}>
                              Trust Score: {message.governance_metrics.trust_score || 'N/A'} | 
                              Risk: {message.governance_metrics.risk_level || 'N/A'}
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  ))
                )}
                {chatLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                    <Paper sx={{ p: 2, backgroundColor: '#333', color: 'white' }}>
                      <CircularProgress size={20} sx={{ color: '#4caf50' }} />
                      <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                        {selectedAgent.name} is thinking...
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
              
              {/* Message Input */}
              <Box sx={{ p: 2, borderTop: '1px solid #555' }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button 
                    size="small" 
                    onClick={clearCurrentChat}
                    sx={{ color: '#ccc' }}
                  >
                    Clear Chat
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => handleGovernanceToggle(!governanceEnabled)}
                    sx={{ color: governanceEnabled ? '#4caf50' : '#f44336' }}
                  >
                    {governanceEnabled ? 'Disable' : 'Enable'} Governance
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
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
                    sx={{ 
                      backgroundColor: '#4caf50',
                      '&:hover': { backgroundColor: '#45a049' },
                      minWidth: '60px'
                    }}
                  >
                    <SendIcon />
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

