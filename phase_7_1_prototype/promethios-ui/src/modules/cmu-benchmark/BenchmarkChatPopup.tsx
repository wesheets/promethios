import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Alert,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Psychology as ThinkingIcon,
  Group as CollaborateIcon,
  CheckCircle as CompleteIcon
} from '@mui/icons-material';

interface BenchmarkChatPopupProps {
  open: boolean;
  onClose: () => void;
  selectedAgents: string[];
  selectedScenario: string;
  demoAgents: any[];
  testScenarios: any[];
}

interface AgentState {
  id: string;
  name: string;
  status: 'idle' | 'thinking' | 'working' | 'complete';
  currentThought?: string;
  response?: string;
  trustScore?: number;
  responseTime?: number;
  governanceStatus?: 'compliant' | 'warning' | 'violation';
  tasksCompleted?: number;
  tasksTotal?: number;
}

interface TaskProgress {
  currentTask: number;
  totalTasks: number;
  completedTasks: number;
  resolvedTasks: number;
  successRate: number;
  averageSteps: number;
  averageCost: number;
  governanceImpact: number;
  currentTaskName: string;
  subCheckpoints: {
    completed: number;
    total: number;
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system' | 'governance' | 'task_update';
  agentId?: string;
  content: string;
  timestamp: Date;
  governanceData?: any;
  taskData?: {
    taskNumber: number;
    taskName: string;
    status: 'started' | 'completed' | 'failed';
  };
}

export const BenchmarkChatPopup: React.FC<BenchmarkChatPopupProps> = ({
  open,
  onClose,
  selectedAgents,
  selectedScenario,
  demoAgents,
  testScenarios
}) => {
  const [governanceEnabled, setGovernanceEnabled] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [testResults, setTestResults] = useState<any>(null);
  const [taskProgress, setTaskProgress] = useState<TaskProgress>({
    currentTask: 0,
    totalTasks: 175, // CMU Agent Company Tasks
    completedTasks: 0,
    resolvedTasks: 0,
    successRate: 0,
    averageSteps: 0,
    averageCost: 0,
    governanceImpact: 0,
    currentTaskName: '',
    subCheckpoints: {
      completed: 0,
      total: 0
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize agent states when popup opens
  useEffect(() => {
    if (open && selectedAgents.length > 0) {
      const initialStates = selectedAgents.map(agentId => {
        const agent = demoAgents.find(a => a.id === agentId);
        return {
          id: agentId,
          name: agent?.name || agentId,
          status: 'idle' as const,
          trustScore: 0,
          responseTime: 0
        };
      });
      setAgentStates(initialStates);
      
      // Pre-populate with scenario prompt if selected
      const scenario = testScenarios.find(s => s.id === selectedScenario);
      if (scenario && scenario.inputs && scenario.inputs.length > 0) {
        setUserInput(scenario.inputs[0].content);
      }
    }
  }, [open, selectedAgents, selectedScenario, demoAgents, testScenarios]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isRunning) return;

    setIsRunning(true);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Start agent processing
    await processAgentResponses(userInput);
    
    setUserInput('');
    setIsRunning(false);
  };

  const processAgentResponses = async (prompt: string) => {
    // Update all agents to thinking state
    setAgentStates(prev => prev.map(agent => ({
      ...agent,
      status: 'thinking',
      currentThought: 'Analyzing your request...'
    })));

    // Simulate agent processing with realistic delays
    for (let i = 0; i < selectedAgents.length; i++) {
      const agentId = selectedAgents[i];
      const agent = demoAgents.find(a => a.id === agentId);
      
      // Update current agent to working
      setAgentStates(prev => prev.map(a => 
        a.id === agentId 
          ? { ...a, status: 'working', currentThought: 'Processing your request...' }
          : a
      ));

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Generate mock response
      const response = generateMockResponse(agent, prompt, governanceEnabled);
      
      // Add agent response to chat
      const agentMessage: ChatMessage = {
        id: `${Date.now()}-${agentId}`,
        type: 'agent',
        agentId: agentId,
        content: response.content,
        timestamp: new Date(),
        governanceData: response.governanceData
      };
      setChatMessages(prev => [...prev, agentMessage]);

      // Update agent to complete state
      setAgentStates(prev => prev.map(a => 
        a.id === agentId 
          ? { 
              ...a, 
              status: 'complete',
              response: response.content,
              trustScore: response.trustScore,
              responseTime: response.responseTime,
              governanceStatus: response.governanceStatus
            }
          : a
      ));

      // Add governance message if enabled
      if (governanceEnabled && response.governanceData) {
        const governanceMessage: ChatMessage = {
          id: `${Date.now()}-gov-${agentId}`,
          type: 'governance',
          content: `✅ Governance Check: Trust Score ${response.trustScore}%, Response approved with ${response.governanceData.policyChecks} policy validations`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, governanceMessage]);
      }
    }
  };

  const generateMockResponse = (agent: any, prompt: string, governed: boolean) => {
    const baseResponses = {
      'baseline_agent': 'I can help you with that. Let me provide a basic response based on the information available.',
      'factual_agent': 'Based on factual analysis, here are the key points you should consider...',
      'creative_agent': 'Let me approach this creatively and explore some innovative solutions...',
      'governance_focused_agent': 'I\'ll ensure my response complies with all relevant policies and guidelines...',
      'multi_tool_agent': 'I can use multiple tools and approaches to address your request comprehensively...'
    };

    const response = baseResponses[agent?.id as keyof typeof baseResponses] || 'I\'ll help you with that request.';
    
    const trustScore = governed ? 85 + Math.random() * 15 : 60 + Math.random() * 25;
    const responseTime = governed ? 1.5 + Math.random() * 1.5 : 2.5 + Math.random() * 2.5;
    
    return {
      content: response,
      trustScore: Math.round(trustScore),
      responseTime: Math.round(responseTime * 10) / 10,
      governanceStatus: governed ? 'compliant' : (Math.random() > 0.7 ? 'warning' : 'compliant'),
      governanceData: governed ? {
        policyChecks: Math.floor(Math.random() * 5) + 3,
        sealGenerated: true,
        complianceScore: Math.round(trustScore)
      } : null
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleDownloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      governanceEnabled,
      selectedAgents: selectedAgents.map(id => demoAgents.find(a => a.id === id)?.name || id),
      selectedScenario,
      agentResults: agentStates.map(agent => ({
        name: agent.name,
        trustScore: agent.trustScore,
        responseTime: agent.responseTime,
        governanceStatus: agent.governanceStatus,
        response: agent.response
      })),
      chatHistory: chatMessages,
      summary: {
        averageTrustScore: agentStates.reduce((sum, a) => sum + (a.trustScore || 0), 0) / agentStates.length,
        averageResponseTime: agentStates.reduce((sum, a) => sum + (a.responseTime || 0), 0) / agentStates.length,
        governanceCompliance: agentStates.filter(a => a.governanceStatus === 'compliant').length / agentStates.length * 100
      }
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `benchmark-report-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'thinking':
        return <CircularProgress size={16} />;
      case 'working':
        return <ThinkingIcon color="primary" />;
      case 'complete':
        return <CompleteIcon color="success" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'thinking':
        return '#ff9800';
      case 'working':
        return '#2196f3';
      case 'complete':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '95vw',
          height: '90vh',
          backgroundColor: '#0f0f0f',
          color: 'white',
          border: '1px solid #333',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        borderRadius: '12px 12px 0 0',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'white' }}>
            🧪 CMU Benchmark Interactive Test
          </Typography>
          <Chip 
            label={`${selectedAgents.length} Agent${selectedAgents.length > 1 ? 's' : ''}`}
            sx={{ 
              backgroundColor: '#2563eb', 
              color: 'white',
              fontWeight: 500
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={governanceEnabled}
                onChange={(e) => setGovernanceEnabled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#10b981',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#10b981',
                  },
                }}
              />
            }
            label={
              <Typography sx={{ 
                color: governanceEnabled ? '#10b981' : '#6b7280',
                fontWeight: 500
              }}>
                Governance {governanceEnabled ? 'ON' : 'OFF'}
              </Typography>
            }
          />
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadReport}
            disabled={agentStates.every(a => a.status === 'idle')}
            sx={{ 
              color: 'white', 
              borderColor: '#374151',
              backgroundColor: '#1f2937',
              '&:hover': {
                borderColor: '#6b7280',
                backgroundColor: '#374151'
              }
            }}
          >
            Download Report
          </Button>
          <IconButton 
            onClick={onClose} 
            sx={{ 
              color: '#9ca3af',
              '&:hover': { 
                color: 'white',
                backgroundColor: '#374151'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%', display: 'flex' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Agent Panel */}
          <Grid item xs={3} sx={{ 
            borderRight: '1px solid #333', 
            p: 3,
            backgroundColor: '#111111'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              color: 'white',
              fontWeight: 600,
              mb: 3
            }}>
              Active Agents
            </Typography>
            
            {/* CMU Benchmark Progress */}
            <Card sx={{ 
              mb: 3, 
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px'
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  mb: 2
                }}>
                  CMU Benchmark Progress
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Tasks Resolved
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#10b981',
                      fontWeight: 600
                    }}>
                      {taskProgress.resolvedTasks}/{taskProgress.totalTasks}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(taskProgress.resolvedTasks / taskProgress.totalTasks) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#374151',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#10b981',
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                      % Score
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                      {Math.round(taskProgress.successRate)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                      Avg Steps
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                      {taskProgress.averageSteps.toFixed(1)}
                    </Typography>
                  </Box>
                </Box>
                
                {taskProgress.currentTaskName && (
                  <Typography variant="caption" sx={{ 
                    color: '#9ca3af',
                    display: 'block',
                    fontStyle: 'italic'
                  }}>
                    Current: {taskProgress.currentTaskName}
                  </Typography>
                )}
              </CardContent>
            </Card>
            {agentStates.map(agent => (
              <Card key={agent.id} sx={{ 
                mb: 2, 
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#4b5563',
                  backgroundColor: '#1f2937'
                }
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32, 
                      mr: 1.5, 
                      backgroundColor: getStatusColor(agent.status),
                      border: '2px solid',
                      borderColor: getStatusColor(agent.status)
                    }}>
                      {getStatusIcon(agent.status)}
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ 
                      color: 'white',
                      fontWeight: 600
                    }}>
                      {agent.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mb: 1.5,
                    p: 1,
                    backgroundColor: '#0f0f0f',
                    borderRadius: '6px',
                    border: '1px solid #333'
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: getStatusColor(agent.status),
                      fontWeight: 500,
                      fontSize: '0.85rem'
                    }}>
                      {agent.status === 'thinking' && '🧠 Thinking...'}
                      {agent.status === 'working' && '⚡ Working...'}
                      {agent.status === 'complete' && '✅ Complete'}
                      {agent.status === 'idle' && '⏸️ Ready'}
                    </Typography>
                  </Box>

                  {agent.currentThought && (
                    <Typography variant="caption" sx={{ 
                      color: '#9ca3af', 
                      display: 'block', 
                      mb: 1.5,
                      fontStyle: 'italic',
                      fontSize: '0.8rem'
                    }}>
                      "{agent.currentThought}"
                    </Typography>
                  )}

                  {agent.status === 'complete' && (
                    <Box sx={{ 
                      p: 1.5,
                      backgroundColor: '#0f0f0f',
                      borderRadius: '6px',
                      border: '1px solid #333'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Trust Score
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: agent.trustScore && agent.trustScore > 80 ? '#10b981' : '#f59e0b',
                          fontWeight: 600
                        }}>
                          {agent.trustScore}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Response Time
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: agent.responseTime && agent.responseTime < 3 ? '#10b981' : '#f59e0b',
                          fontWeight: 600
                        }}>
                          {agent.responseTime}s
                        </Typography>
                      </Box>
                      {governanceEnabled && (
                        <Chip 
                          label={agent.governanceStatus === 'compliant' ? '✅ Compliant' : '⚠️ Warning'}
                          size="small"
                          sx={{
                            backgroundColor: agent.governanceStatus === 'compliant' ? '#065f46' : '#92400e',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            width: '100%'
                          }}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Grid>

          {/* Chat Interface */}
          <Grid item xs={9} sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            backgroundColor: '#0f0f0f'
          }}>
            {/* Chat Messages */}
            <Box sx={{ 
              flex: 1, 
              p: 3, 
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#1a1a1a',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#374151',
                borderRadius: '3px',
              },
            }}>
              <List sx={{ p: 0 }}>
                {chatMessages.map(message => (
                  <ListItem key={message.id} sx={{ 
                    flexDirection: 'column', 
                    alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2,
                    p: 0
                  }}>
                    <Paper sx={{ 
                      p: 2.5, 
                      maxWidth: '80%',
                      backgroundColor: 
                        message.type === 'user' ? '#2563eb' :
                        message.type === 'governance' ? '#059669' :
                        '#1a1a1a',
                      color: 'white',
                      border: '1px solid',
                      borderColor:
                        message.type === 'user' ? '#3b82f6' :
                        message.type === 'governance' ? '#10b981' :
                        '#333',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                      position: 'relative'
                    }}>
                      {message.type === 'agent' && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1.5,
                          pb: 1,
                          borderBottom: '1px solid #333'
                        }}>
                          <Avatar sx={{ 
                            width: 24, 
                            height: 24, 
                            mr: 1,
                            backgroundColor: '#2563eb'
                          }}>
                            🤖
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ 
                            color: '#e5e7eb',
                            fontWeight: 600
                          }}>
                            {demoAgents.find(a => a.id === message.agentId)?.name || 'Agent'}
                          </Typography>
                        </Box>
                      )}
                      {message.type === 'governance' && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1.5,
                          pb: 1,
                          borderBottom: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          <Avatar sx={{ 
                            width: 24, 
                            height: 24, 
                            mr: 1,
                            backgroundColor: '#059669'
                          }}>
                            🛡️
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ 
                            color: '#10b981',
                            fontWeight: 600
                          }}>
                            Governance System
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body1" sx={{ 
                        lineHeight: 1.6,
                        fontSize: '0.95rem'
                      }}>
                        {message.content}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#9ca3af', 
                        display: 'block', 
                        mt: 1.5,
                        fontSize: '0.75rem'
                      }}>
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
              </List>
              <div ref={chatEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ 
              p: 3, 
              borderTop: '1px solid #333',
              backgroundColor: '#111111'
            }}>
              {uploadedFiles.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {uploadedFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                      sx={{ 
                        mr: 1, 
                        mb: 1,
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: '1px solid #333',
                        '& .MuiChip-deleteIcon': {
                          color: '#9ca3af',
                          '&:hover': {
                            color: 'white'
                          }
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
              
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  multiple
                />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ 
                    color: '#9ca3af',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    '&:hover': {
                      color: 'white',
                      backgroundColor: '#374151',
                      borderColor: '#4b5563'
                    }
                  }}
                >
                  <AttachFileIcon />
                </IconButton>
                
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your message or use the pre-populated scenario prompt..."
                  disabled={isRunning}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '12px',
                      '& fieldset': { 
                        borderColor: '#333',
                        borderWidth: '1px'
                      },
                      '&:hover fieldset': { 
                        borderColor: '#4b5563'
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#2563eb',
                        borderWidth: '2px'
                      }
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#6b7280',
                      opacity: 1
                    }
                  }}
                />
                
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isRunning}
                  sx={{ 
                    minWidth: 'auto', 
                    px: 3,
                    py: 1.5,
                    backgroundColor: '#2563eb',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: '#1d4ed8'
                    },
                    '&:disabled': {
                      backgroundColor: '#374151',
                      color: '#6b7280'
                    }
                  }}
                >
                  {isRunning ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default BenchmarkChatPopup;

