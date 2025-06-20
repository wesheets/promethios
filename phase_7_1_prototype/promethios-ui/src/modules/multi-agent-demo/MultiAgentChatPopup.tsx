import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
  Alert,
  Paper,
  Avatar,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as WorkingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

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

interface AgentStatus {
  id: string;
  status: 'idle' | 'thinking' | 'working' | 'complete' | 'error';
  currentTask: string;
  trustScore: number;
  responseTime: number;
  tasksCompleted: number;
}

interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system' | 'governance';
  trustScore?: number;
  governanceChecks?: string[];
}

interface MultiAgentChatPopupProps {
  open: boolean;
  onClose: () => void;
  selectedAgents: Agent[];
  selectedScenario?: TestScenario;
}

export const MultiAgentChatPopup: React.FC<MultiAgentChatPopupProps> = ({
  open,
  onClose,
  selectedAgents,
  selectedScenario
}) => {
  const [governanceEnabled, setGovernanceEnabled] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (open && selectedAgents.length > 0) {
      initializeAgentStatuses();
      if (selectedScenario) {
        setUserMessage(selectedScenario.prompt);
      }
    }
  }, [open, selectedAgents, selectedScenario]);

  const initializeAgentStatuses = () => {
    const statuses: AgentStatus[] = selectedAgents.map(agent => ({
      id: agent.id,
      status: 'idle',
      currentTask: 'Ready to collaborate',
      trustScore: 0.85,
      responseTime: 0,
      tasksCompleted: 0
    }));
    setAgentStatuses(statuses);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'thinking': return <PsychologyIcon sx={{ color: '#F59E0B' }} />;
      case 'working': return <WorkingIcon sx={{ color: '#3B82F6' }} />;
      case 'complete': return <CheckCircleIcon sx={{ color: '#10B981' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#EF4444' }} />;
      default: return <RadioButtonUnchecked sx={{ color: '#6B7280' }} />;
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() && uploadedFiles.length === 0) return;

    setIsProcessing(true);
    
    // Add user message to chat
    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      agentId: 'user',
      agentName: 'You',
      content: userMessage,
      timestamp: new Date(),
      type: 'message'
    };
    setChatMessages(prev => [...prev, userChatMessage]);

    // Update agent statuses to thinking
    setAgentStatuses(prev => prev.map(status => ({
      ...status,
      status: 'thinking',
      currentTask: 'Analyzing user request...'
    })));

    try {
      // Simulate multi-agent processing
      await simulateMultiAgentCollaboration(userMessage);
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsProcessing(false);
      setUserMessage('');
    }
  };

  const simulateMultiAgentCollaboration = async (message: string) => {
    // Simulate agents working in sequence with shared context
    for (let i = 0; i < selectedAgents.length; i++) {
      const agent = selectedAgents[i];
      
      // Update agent status to working
      setAgentStatuses(prev => prev.map(status => 
        status.id === agent.id 
          ? { ...status, status: 'working', currentTask: `Processing: ${message.slice(0, 30)}...` }
          : status
      ));

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Generate agent response
      const response = await generateAgentResponse(agent, message, governanceEnabled);
      
      // Add agent response to chat
      const agentMessage: ChatMessage = {
        id: Date.now().toString() + agent.id,
        agentId: agent.id,
        agentName: agent.name,
        content: response.content,
        timestamp: new Date(),
        type: governanceEnabled ? 'governance' : 'message',
        trustScore: response.trustScore,
        governanceChecks: response.governanceChecks
      };
      setChatMessages(prev => [...prev, agentMessage]);

      // Update agent status to complete
      setAgentStatuses(prev => prev.map(status => 
        status.id === agent.id 
          ? { 
              ...status, 
              status: 'complete', 
              currentTask: 'Completed contribution',
              trustScore: response.trustScore,
              responseTime: response.responseTime,
              tasksCompleted: status.tasksCompleted + 1
            }
          : status
      ));

      // Small delay before next agent
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const generateAgentResponse = async (agent: Agent, message: string, governed: boolean) => {
    // Simulate different agent behaviors based on governance
    const baseResponse = getAgentSpecificResponse(agent, message);
    
    if (governed) {
      return {
        content: `[GOVERNED] ${baseResponse}\n\n✅ Governance checks passed\n🛡️ Trust score: ${(0.85 + Math.random() * 0.1).toFixed(2)}\n📋 Policy compliance verified`,
        trustScore: 0.85 + Math.random() * 0.1,
        responseTime: 2000 + Math.random() * 2000,
        governanceChecks: ['Policy compliance', 'Trust verification', 'Quality assurance']
      };
    } else {
      return {
        content: `[UNGOVERNED] ${baseResponse}`,
        trustScore: 0.6 + Math.random() * 0.2,
        responseTime: 1500 + Math.random() * 3000,
        governanceChecks: []
      };
    }
  };

  const getAgentSpecificResponse = (agent: Agent, message: string) => {
    switch (agent.id) {
      case 'creative_agent':
        return `I'll brainstorm creative approaches for this task. Here are some innovative ideas and out-of-the-box solutions...`;
      case 'factual_agent':
        return `Let me gather and verify the factual information needed. Based on my analysis of reliable sources...`;
      case 'governance_focused_agent':
        return `I'll ensure we comply with all relevant policies and regulations. Here's my compliance assessment...`;
      case 'multi_tool_agent':
        return `I can coordinate the technical implementation and tool integration. Here's my execution plan...`;
      default:
        return `I'll provide a straightforward analysis of this request. Here's my assessment...`;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const downloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      governanceEnabled,
      selectedAgents: selectedAgents.map(a => a.name),
      agentStatuses,
      chatMessages,
      metrics: {
        averageTrustScore: agentStatuses.reduce((sum, status) => sum + status.trustScore, 0) / agentStatuses.length,
        totalTasksCompleted: agentStatuses.reduce((sum, status) => sum + status.tasksCompleted, 0),
        averageResponseTime: agentStatuses.reduce((sum, status) => sum + status.responseTime, 0) / agentStatuses.length
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promethios-multi-agent-demo-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          backgroundColor: '#0F172A',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderBottom: '1px solid #334155'
      }}>
        <Box display="flex" alignItems="center">
          <GroupIcon sx={{ mr: 1, color: '#10B981' }} />
          <Typography variant="h6">Promethios Multi-Agent Demo</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={governanceEnabled}
                onChange={(e) => setGovernanceEnabled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#10B981',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#10B981',
                  },
                }}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                <SecurityIcon sx={{ mr: 0.5, color: governanceEnabled ? '#10B981' : '#6B7280' }} />
                <Typography variant="body2">
                  Governance {governanceEnabled ? 'ON' : 'OFF'}
                </Typography>
              </Box>
            }
            sx={{ color: 'white' }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={downloadReport}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Download Report
          </Button>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: '#0F172A' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Agent Status Panel */}
          <Grid item xs={4} sx={{ borderRight: '1px solid #334155', p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#10B981' }}>
              Agent Team Status
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              {selectedAgents.map((agent) => {
                const status = agentStatuses.find(s => s.id === agent.id);
                return (
                  <Card key={agent.id} sx={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Avatar sx={{ 
                          backgroundColor: getAgentColor(agent.id), 
                          width: 32, 
                          height: 32, 
                          mr: 1 
                        }}>
                          {agent.name.charAt(0)}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle2" sx={{ color: 'white' }}>
                            {agent.name}
                          </Typography>
                          <Box display="flex" alignItems="center">
                            {getStatusIcon(status?.status || 'idle')}
                            <Typography variant="caption" sx={{ ml: 0.5, color: '#94A3B8' }}>
                              {status?.status || 'idle'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>
                        {status?.currentTask || 'Ready to collaborate'}
                      </Typography>
                      
                      {status && (
                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                              Trust Score
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#10B981' }}>
                              {(status.trustScore * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={status.trustScore * 100}
                            sx={{
                              backgroundColor: '#334155',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#10B981'
                              }
                            }}
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Grid>

          {/* Chat Interface */}
          <Grid item xs={8} sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* Chat Messages */}
            <Box sx={{ flex: 1, p: 2, overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
              {chatMessages.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" sx={{ color: '#94A3B8' }}>
                    Start a conversation with your agent team...
                  </Typography>
                </Box>
              ) : (
                chatMessages.map((message) => (
                  <Box key={message.id} mb={2}>
                    <Paper sx={{ 
                      p: 2, 
                      backgroundColor: message.agentId === 'user' ? '#1E293B' : '#0F172A',
                      border: '1px solid #334155'
                    }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" sx={{ 
                          color: message.agentId === 'user' ? '#3B82F6' : getAgentColor(message.agentId),
                          fontWeight: 'bold'
                        }}>
                          {message.agentName}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 'auto', color: '#94A3B8' }}>
                          {message.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      {message.trustScore && (
                        <Box mt={1}>
                          <Chip 
                            label={`Trust: ${(message.trustScore * 100).toFixed(0)}%`}
                            size="small"
                            sx={{ backgroundColor: '#10B981', color: 'white' }}
                          />
                        </Box>
                      )}
                    </Paper>
                  </Box>
                ))
              )}
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
              {uploadedFiles.length > 0 && (
                <Box mb={1}>
                  {uploadedFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                      size="small"
                      sx={{ mr: 1, backgroundColor: '#334155', color: 'white' }}
                    />
                  ))}
                </Box>
              )}
              
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Enter your task or question for the agent team..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1E293B',
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#10B981' }
                    },
                    '& .MuiInputBase-input::placeholder': { color: '#94A3B8' }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <IconButton component="span" sx={{ color: 'white' }}>
                    <AttachFileIcon />
                  </IconButton>
                </label>
                
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={isProcessing || (!userMessage.trim() && uploadedFiles.length === 0)}
                  sx={{
                    backgroundColor: '#10B981',
                    '&:hover': { backgroundColor: '#059669' }
                  }}
                >
                  <SendIcon />
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

