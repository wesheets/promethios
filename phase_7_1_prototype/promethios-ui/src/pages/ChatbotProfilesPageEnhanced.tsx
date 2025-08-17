import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Slide,
  Stack,
  Divider,
  LinearProgress,
  Tooltip,
  Badge,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Analytics,
  Palette,
  Psychology,
  Settings,
  Close,
  Chat,
  Rocket,
  MoreVert,
  TrendingUp,
  Speed,
  ThumbUp,
  Schedule,
  Group,
  Description,
  CloudUpload,
  AutoAwesome,
  Add,
  Edit,
  Send,
  Api,
  SmartToy,
  CheckCircle,
  Receipt,
  Memory,
  Computer,
  Security,
  AttachFile,
  Mic,
  MicOff,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ChatbotStorageService } from '../services/ChatbotStorageService';
import { AgentReceiptViewer } from '../components/receipts/AgentReceiptViewer';
import { AgentMemoryViewer } from '../components/memory/AgentMemoryViewer';
import { LiveAgentSandbox } from '../components/sandbox/LiveAgentSandbox';
import { SimplifiedKnowledgeViewer } from '../components/knowledge/SimplifiedKnowledgeViewer';
import { ChatbotProfile } from '../types/ChatbotTypes';
import WidgetCustomizer from '../components/chat/customizer/WidgetCustomizer';
import PersonalityEditor from '../components/chat/customizer/PersonalityEditor';
import { WidgetCustomizerProvider, useWidgetCustomizer } from '../context/WidgetCustomizerContext';
import { chatPanelGovernanceService, ChatSession, ChatMessage, ChatResponse } from '../services/ChatPanelGovernanceService';
import ToolConfigurationPanel from '../components/tools/ToolConfigurationPanel';
import { AgentToolProfile } from '../types/ToolTypes';

// Right panel types
type RightPanelType = 'analytics' | 'customize' | 'personality' | 'knowledge' | 'automation' | 'deployment' | 'settings' | 'chat' | 'tools' | 'receipts' | 'memory' | 'sandbox' | 'workspace' | 'ai_knowledge' | 'governance' | null;

interface ChatbotMetrics {
  healthScore: number;
  trustScore: number;
  performanceRating: number;
  messageVolume: number;
  responseTime: number;
  satisfactionScore: number;
  resolutionRate: number;
  lastActive: string;
  governanceAlerts: number;
}

const ChatbotProfilesPageEnhanced: React.FC = () => {
  return (
    <WidgetCustomizerProvider>
      <ChatbotProfilesPageContent />
    </WidgetCustomizerProvider>
  );
};

const ChatbotProfilesPageContent: React.FC = () => {
  console.log('🔍 ChatbotProfilesPageEnhanced component mounting...');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, loading: authLoading } = useAuth();
  const { config: widgetConfig, getChatbotConfig, setActiveChatbotId } = useWidgetCustomizer();
  console.log('🔍 ChatbotProfilesPageEnhanced - user from auth:', user?.uid);
  console.log('🔍 ChatbotProfilesPageEnhanced - auth loading:', authLoading);
  
  const chatbotService = ChatbotStorageService.getInstance();
  
  // State management
  const [chatbotProfiles, setChatbotProfiles] = useState<ChatbotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotProfile | null>(null);
  const [rightPanelType, setRightPanelType] = useState<RightPanelType>(null);
  const [filterTab, setFilterTab] = useState(0); // 0: All, 1: Hosted API, 2: BYOK, 3: Enterprise
  
  // Chat session management
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // File attachment and voice recording states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Workspace mode management
  const [isWorkspaceMode, setIsWorkspaceMode] = useState(false);
  const [workspaceSelectedTab, setWorkspaceSelectedTab] = useState<string>('analytics');

  // Governance sensitivity controls
  const [governanceSensitivity, setGovernanceSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [trustThreshold, setTrustThreshold] = useState<number>(70);
  const [riskCategories, setRiskCategories] = useState<string[]>(['financial_transactions', 'data_access']);

  // Mock metrics data - in real implementation, this would come from analytics service
  const getMockMetrics = (chatbot: ChatbotProfile): ChatbotMetrics => ({
    healthScore: Math.floor(Math.random() * 20) + 80, // 80-100%
    trustScore: Math.floor(Math.random() * 15) + 85, // 85-100%
    performanceRating: Math.floor(Math.random() * 25) + 75, // 75-100%
    messageVolume: Math.floor(Math.random() * 5000) + 100, // 100-5100
    responseTime: Math.random() * 2 + 0.5, // 0.5-2.5 seconds
    satisfactionScore: Math.random() * 1 + 4, // 4.0-5.0
    resolutionRate: Math.floor(Math.random() * 20) + 70, // 70-90%
    lastActive: ['2 minutes ago', '5 minutes ago', '1 hour ago', '30 minutes ago'][Math.floor(Math.random() * 4)],
    governanceAlerts: Math.floor(Math.random() * 3), // 0-2 alerts
  });

  const loadChatbots = useCallback(async () => {
    console.log('🔍 loadChatbots called, user:', user?.uid);
    console.log('🔍 loadChatbots called, authLoading:', authLoading);
    console.log('🔍 ChatbotStorageService instance:', chatbotService);
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('🔍 Auth still loading, waiting...');
      return;
    }
    
    if (!user?.uid) {
      console.log('🔍 No user UID after auth loaded, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Calling chatbotService.getChatbots with user:', user.uid);
      console.log('🔍 About to call getChatbots method...');
      const chatbots = await chatbotService.getChatbots(user.uid);
      console.log('🔍 getChatbots returned:', chatbots.length, 'chatbots');
      console.log('🔍 Chatbot data:', chatbots);
      setChatbotProfiles(chatbots);
      console.log('🔍 setChatbotProfiles called with:', chatbots.length, 'chatbots');
    } catch (error) {
      console.error('❌ Failed to load chatbots:', error);
      setError('Failed to load chatbots. Please try again.');
      setChatbotProfiles([]);
    } finally {
      setLoading(false);
      console.log('🔍 Loading set to false');
    }
  }, [user?.uid, authLoading, chatbotService]);

  // Load chatbots on component mount and when user changes
  useEffect(() => {
    console.log('🔍 ChatbotProfilesPageEnhanced useEffect triggered, user:', user?.uid);
    console.log('🔍 User object:', user);
    console.log('🔍 Auth loading:', authLoading);
    console.log('🔍 About to call loadChatbots...');
    loadChatbots();
  }, [user?.uid, authLoading, loadChatbots]);

  const handleCreateNew = () => {
    navigate('/ui/chat/setup/quick-start');
  };

  const handleRefresh = () => {
    loadChatbots();
  };

  const openRightPanel = async (chatbot: ChatbotProfile, panelType: RightPanelType) => {
    setSelectedChatbot(chatbot);
    setRightPanelType(panelType);
    
    // Set active chatbot for widget customizer
    setActiveChatbotId(chatbot.identity.id);
    
    // If opening workspace mode, enable workspace and initialize chat session
    if (panelType === 'workspace') {
      setIsWorkspaceMode(true);
      try {
        setChatLoading(true);
        console.log(`🚀 [Workspace] Initializing Command Center for ${chatbot.identity.name}`);
        
        // Start new chat session with governance
        const session = await chatPanelGovernanceService.startChatSession(chatbot);
        setActiveSession(session);
        setChatMessages([]);
        setMessageInput('');
        
        console.log(`✅ [Workspace] Command Center initialized:`, session.sessionId);
        console.log(`🎨 [Workspace] Using widget config:`, getChatbotConfig(chatbot.identity.id));
      } catch (error) {
        console.error(`❌ [Workspace] Failed to initialize Command Center:`, error);
        // Create a fallback session for UI testing
        const fallbackSession: ChatSession = {
          sessionId: `fallback_${Date.now()}`,
          agentId: chatbot.identity.id,
          startTime: new Date(),
          messageCount: 0,
          trustScore: 0.75,
          governanceMetrics: {
            violations: 0,
            warnings: 0,
            complianceScore: 1.0
          }
        };
        setActiveSession(fallbackSession);
        setChatMessages([{
          id: '1',
          content: 'Hello! I\'m having trouble connecting to the governance system, but I\'m here to help!',
          sender: 'agent',
          timestamp: new Date(),
          trustScore: 0.75,
          governanceStatus: 'approved'
        }]);
      } finally {
        setChatLoading(false);
      }
    }
    // If opening chat panel, initialize chat session
    else if (panelType === 'chat') {
      setIsWorkspaceMode(false);
      try {
        setChatLoading(true);
        console.log(`💬 [ChatPanel] Initializing chat session for ${chatbot.identity.name}`);
        
        // Start new chat session with governance
        const session = await chatPanelGovernanceService.startChatSession(chatbot);
        setActiveSession(session);
        setChatMessages([]);
        setMessageInput('');
        
        console.log(`✅ [ChatPanel] Chat session initialized:`, session.sessionId);
        console.log(`🎨 [ChatPanel] Using widget config:`, getChatbotConfig(chatbot.identity.id));
      } catch (error) {
        console.error(`❌ [ChatPanel] Failed to initialize chat session:`, error);
        // Create a fallback session for UI testing
        const fallbackSession: ChatSession = {
          sessionId: `fallback_${Date.now()}`,
          agentId: chatbot.identity.id,
          startTime: new Date(),
          messageCount: 0,
          trustScore: 0.75,
          governanceMetrics: {
            violations: 0,
            warnings: 0,
            complianceScore: 1.0
          }
        };
        setActiveSession(fallbackSession);
        setChatMessages([{
          id: '1',
          content: 'Hello! I\'m having trouble connecting to the governance system, but I\'m here to help!',
          sender: 'agent',
          timestamp: new Date(),
          trustScore: 0.75,
          governanceStatus: 'approved'
        }]);
      } finally {
        setChatLoading(false);
      }
    } else {
      // For other panel types, disable workspace mode
      setIsWorkspaceMode(false);
    }
  };

  const closeRightPanel = async () => {
    // Clean up chat session if active
    if (activeSession && (rightPanelType === 'chat' || rightPanelType === 'workspace')) {
      try {
        await chatPanelGovernanceService.endChatSession(activeSession.sessionId);
        setActiveSession(null);
        setChatMessages([]);
        setMessageInput('');
        console.log(`✅ [${rightPanelType === 'workspace' ? 'Workspace' : 'ChatPanel'}] Session ended successfully`);
      } catch (error) {
        console.error(`❌ [${rightPanelType === 'workspace' ? 'Workspace' : 'ChatPanel'}] Failed to end session:`, error);
      }
    }
    
    setSelectedChatbot(null);
    setRightPanelType(null);
    setIsWorkspaceMode(false);
    setWorkspaceSelectedTab('analytics');
  };

  // Chat message handling
  const sendMessage = async () => {
    if (!messageInput.trim() || !activeSession || chatLoading) return;

    try {
      setChatLoading(true);
      setIsTyping(true);
      
      console.log(`📤 [ChatPanel] Sending message: "${messageInput}"`);
      
      // Send message through governance service
      const response = await chatPanelGovernanceService.sendMessage(activeSession.sessionId, messageInput.trim());
      
      // Add user message first
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        content: messageInput.trim(),
        sender: 'user',
        timestamp: new Date()
      };
      
      // Update messages with user message and bot response
      setChatMessages(prev => [...prev, userMessage, response]);
      setMessageInput('');
      
      console.log(`✅ [ChatPanel] Message sent and response received`);
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to send message:`, error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'agent',
        timestamp: new Date(),
        governanceStatus: 'error'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // File attachment functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // You can add file upload logic here
      console.log('File selected:', file.name);
      // For now, just add the file name to the message input
      setMessageInput(prev => prev + `[Attached: ${file.name}] `);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        // You can add audio processing logic here
        console.log('Recording stopped, audio blob created');
        // For now, just add a placeholder to the message input
        setMessageInput(prev => prev + '[Voice message recorded] ');
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      console.log('Recording stopped');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const resetChat = async () => {
    if (!selectedChatbot) return;
    
    try {
      // End current session
      if (activeSession) {
        await chatPanelGovernanceService.endChatSession(activeSession.sessionId);
      }
      
      // Start new session
      const newSession = await chatPanelGovernanceService.startChatSession(selectedChatbot);
      setActiveSession(newSession);
      setChatMessages([]);
      setMessageInput('');
      
      console.log(`🔄 [ChatPanel] Chat reset successfully`);
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to reset chat:`, error);
    }
  };

  const getStatusColor = (isDeployed: boolean, healthScore: number) => {
    if (!isDeployed) return '#6b7280'; // Gray for offline
    if (healthScore >= 90) return '#10b981'; // Green for excellent
    if (healthScore >= 80) return '#f59e0b'; // Yellow for good
    return '#ef4444'; // Red for poor
  };

  const getGovernanceType = (chatbot: ChatbotProfile) => {
    // Determine if BYOK or Hosted based on configuration
    if (chatbot.configuration?.apiKey) return 'BYOK';
    if (chatbot.configuration?.selectedModel?.includes('hosted')) return 'Hosted API';
    return 'Enterprise';
  };

  const getModelProvider = (model: string) => {
    if (model?.includes('gpt')) return 'OpenAI';
    if (model?.includes('claude')) return 'Anthropic';
    if (model?.includes('gemini')) return 'Google';
    if (model?.includes('llama')) return 'Meta';
    return 'Custom';
  };

  const filteredChatbots = chatbotProfiles.filter(chatbot => {
    if (filterTab === 0) return true; // All
    if (filterTab === 1) return getGovernanceType(chatbot) === 'Hosted API';
    if (filterTab === 2) return getGovernanceType(chatbot) === 'BYOK';
    if (filterTab === 3) return getGovernanceType(chatbot) === 'Enterprise';
    return true;
  });

  // Show loading state
  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Box textAlign="center">
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading your chatbots...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRefresh}>
          Try Again
        </Button>
      </Container>
    );
  }

  // Show empty state
  if (chatbotProfiles.length === 0) {
    return (
      <Container sx={{ py: 4 }}>
        <Box textAlign="center" py={8}>
          <SmartToy sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="text.secondary">
            No Chatbots Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Create your first chatbot to get started with AI-powered conversations.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
            size="large"
          >
            CREATE YOUR FIRST CHATBOT
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#0f172a', overflow: 'hidden' }}>
      {/* Main Content Area */}
      <Box 
        sx={{ 
          flex: rightPanelType ? '0 0 60%' : 1,
          transition: 'flex 0.3s ease-in-out',
          overflow: 'auto',
          height: '100vh'
        }}
      >
        {isWorkspaceMode ? (
          <Box sx={{ height: '100%', width: '100%' }}>
        ) : (
          <Container sx={{ py: 2, height: '100%' }}>
        )}
          {/* Chatbot Scorecards Grid - Only show when NOT in workspace mode */}
          {!isWorkspaceMode && (
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <Grid container spacing={3}>
                {filteredChatbots.map((chatbot) => {
                  const metrics = getMockMetrics(chatbot);
                  const governanceType = getGovernanceType(chatbot);
                  const modelProvider = getModelProvider(chatbot.configuration?.selectedModel || '');
                  const isNativeAgent = governanceType === 'BYOK';
                  const isSelected = selectedChatbot?.identity.id === chatbot.identity.id;
              
              return (
                <Grid item xs={12} sm={6} lg={4} key={chatbot.identity.id}>
                  <Card
                    sx={{
                      height: '100%',
                      bgcolor: '#1e293b',
                      color: 'white',
                      border: isSelected 
                        ? '3px solid #3b82f6' 
                        : isNativeAgent 
                          ? '2px solid transparent' 
                          : '1px solid #334155',
                      borderImage: isNativeAgent && !isSelected ? 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4) 1' : 'none',
                      boxShadow: isSelected
                        ? '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4)'
                        : isNativeAgent 
                          ? '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)'
                          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      transform: isSelected ? 'translateY(-4px)' : 'none',
                      '&:hover': {
                        boxShadow: isSelected
                          ? '0 0 40px rgba(59, 130, 246, 1), 0 0 80px rgba(59, 130, 246, 0.6)'
                          : isNativeAgent
                            ? '0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.3)'
                            : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        transform: isSelected ? 'translateY(-4px)' : 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header with Name and Status */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box flex={1}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {chatbot.identity.name}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                            <Chip
                              label={governanceType}
                              size="small"
                              sx={{
                                bgcolor: isNativeAgent ? 'linear-gradient(45deg, #3b82f6, #8b5cf6)' : '#374151',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            />
                            <Chip
                              label={chatbot.isDeployed ? 'Live' : 'Offline'}
                              size="small"
                              sx={{
                                bgcolor: getStatusColor(chatbot.isDeployed, metrics.healthScore),
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                            <Chip
                              label={`${metrics.healthScore}% Health`}
                              size="small"
                              sx={{
                                bgcolor: metrics.healthScore >= 90 ? '#10b981' : metrics.healthScore >= 80 ? '#f59e0b' : '#ef4444',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          </Stack>
                        </Box>
                        <IconButton size="small" sx={{ color: '#64748b' }}>
                          <MoreVert />
                        </IconButton>
                      </Box>

                      {/* Description */}
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, minHeight: '2.5em' }}>
                        {chatbot.identity.description}
                      </Typography>

                      {/* Tools & Capabilities */}
                      <Box mb={2}>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                          Tools & Capabilities
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                          <Chip
                            label={modelProvider}
                            size="small"
                            icon={<Api />}
                            sx={{
                              bgcolor: '#0f172a',
                              color: '#94a3b8',
                              fontSize: '0.75rem',
                            }}
                          />
                          <Chip
                            label={chatbot.configuration?.selectedModel || 'Unknown'}
                            size="small"
                            icon={<SmartToy />}
                            sx={{
                              bgcolor: '#0f172a',
                              color: '#94a3b8',
                              fontSize: '0.75rem',
                            }}
                          />
                          <Chip
                            label={`${Math.floor(Math.random() * 5) + 3} capabilities`}
                            size="small"
                            icon={<AutoAwesome />}
                            sx={{
                              bgcolor: '#0f172a',
                              color: '#94a3b8',
                              fontSize: '0.75rem',
                            }}
                          />
                        </Stack>
                      </Box>

                      {/* Performance Metrics */}
                      <Grid container spacing={1} mb={2}>
                        <Grid item xs={4}>
                          <Box textAlign="center" p={1} bgcolor="#0f172a" borderRadius={1}>
                            <Typography variant="body2" color="#64748b" fontSize="0.75rem">
                              Health
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                              <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                              <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                                {metrics.healthScore}%
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box textAlign="center" p={1} bgcolor="#0f172a" borderRadius={1}>
                            <Typography variant="body2" color="#64748b" fontSize="0.75rem">
                              Trust Score
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                              {metrics.trustScore}/100
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box textAlign="center" p={1} bgcolor="#0f172a" borderRadius={1}>
                            <Typography variant="body2" color="#64748b" fontSize="0.75rem">
                              Messages
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                              {metrics.messageVolume.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Primary Action - Command Center Only */}
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          size="medium"
                          startIcon={<Rocket />}
                          fullWidth
                          onClick={() => openRightPanel(chatbot, 'workspace')}
                          sx={{
                            bgcolor: '#3b82f6',
                            '&:hover': { bgcolor: '#2563eb' },
                            fontWeight: 600,
                            py: 1.5,
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          🚀 Command Center
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
              </Grid>
            </Box>
          )}

          {/* Chat Interface - Only show when IN workspace mode */}
          {isWorkspaceMode && selectedChatbot && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Breadcrumbs */}
              <Box sx={{ mb: 0, p: 0, position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                <Typography variant="body2" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { color: '#3b82f6' }, fontSize: '0.875rem', bgcolor: 'rgba(15, 23, 42, 0.8)', px: 1, py: 0.5, borderRadius: 1 }} onClick={closeRightPanel}>
                  ← Chatbots
                </Typography>
              </Box>

              {/* Chat Interface */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#1e293b', minHeight: 0 }}>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 0.5, fontSize: '1.1rem' }}>
                    Chat with Your Agent
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {selectedChatbot.identity.name}
                  </Typography>
                  {activeSession && (
                    <Typography variant="caption" sx={{ color: '#64748b', float: 'right', fontSize: '0.75rem' }}>
                      Session: {activeSession.sessionId.slice(-8)}
                    </Typography>
                  )}
                </Box>

                {/* Chat Messages */}
                <Box sx={{ flex: 1, p: 3, overflowY: 'auto', minHeight: 0 }}>
                  {chatLoading && chatMessages.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <CircularProgress size={24} />
                    </Box>
                  ) : chatMessages.length === 0 ? (
                    /* Welcome Interface - Manus Style */
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        textAlign: 'center',
                        px: 4
                      }}
                    >
                      {/* Personalized Greeting */}
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          color: 'white', 
                          mb: 1, 
                          fontWeight: 500,
                          fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                        }}
                      >
                        Hello {user?.displayName || user?.email?.split('@')[0] || 'Ted Sheets'}
                      </Typography>
                      
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: '#94a3b8', 
                          mb: 6,
                          fontWeight: 400,
                          fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }
                        }}
                      >
                        What can I do for you?
                      </Typography>

                      {/* Centered Chat Input Box */}
                      <Box 
                        sx={{ 
                          width: '100%',
                          maxWidth: '700px',
                          mb: 4
                        }}
                      >
                        <Box
                          sx={{
                            position: 'relative',
                            bgcolor: '#374151',
                            borderRadius: '24px',
                            border: '1px solid #4b5563',
                            overflow: 'hidden',
                            '&:focus-within': {
                              borderColor: '#3b82f6',
                              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                            }
                          }}
                        >
                          {/* File Upload Input */}
                          <input
                            type="file"
                            id="welcome-file-upload"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                          />
                          
                          {/* Selected File Preview */}
                          {selectedFile && (
                            <Box sx={{ 
                              position: 'absolute', 
                              top: -40, 
                              left: 20, 
                              bgcolor: '#1f2937', 
                              px: 2, 
                              py: 1, 
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              color: '#d1d5db',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              border: '1px solid #374151'
                            }}>
                              📎 {selectedFile.name}
                              <IconButton size="small" onClick={clearSelectedFile} sx={{ color: '#9ca3af', p: 0.5 }}>
                                <Close sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                            {/* Attachment Button */}
                            <Tooltip title="Attach file">
                              <IconButton
                                component="label"
                                htmlFor="welcome-file-upload"
                                sx={{
                                  color: selectedFile ? '#3b82f6' : '#9ca3af',
                                  '&:hover': { 
                                    color: '#3b82f6', 
                                    bgcolor: 'rgba(59, 130, 246, 0.1)' 
                                  },
                                  ml: 1
                                }}
                              >
                                <AttachFile sx={{ fontSize: 20 }} />
                              </IconButton>
                            </Tooltip>

                            {/* Text Input */}
                            <Box
                              component="textarea"
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Assign a task or ask anything..."
                              disabled={chatLoading}
                              sx={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                bgcolor: 'transparent',
                                color: 'white',
                                fontSize: '16px',
                                fontFamily: 'inherit',
                                resize: 'none',
                                minHeight: '24px',
                                maxHeight: '120px',
                                py: 2,
                                px: 2,
                                '&::placeholder': {
                                  color: '#9ca3af',
                                },
                              }}
                              rows={1}
                            />

                            {/* Voice Recording Button */}
                            <Tooltip title={isRecording ? "Stop recording" : "Start voice recording"}>
                              <IconButton
                                onClick={toggleRecording}
                                sx={{
                                  color: isRecording ? '#ef4444' : '#9ca3af',
                                  '&:hover': { 
                                    color: isRecording ? '#dc2626' : '#3b82f6', 
                                    bgcolor: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)' 
                                  },
                                  mr: 1,
                                  animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                                  '@keyframes pulse': {
                                    '0%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                    '100%': { opacity: 1 },
                                  },
                                }}
                              >
                                {isRecording ? <MicOff sx={{ fontSize: 20 }} /> : <Mic sx={{ fontSize: 20 }} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>

                      {/* Refined Suggestion Buttons */}
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 2, 
                          justifyContent: 'center',
                          maxWidth: '700px'
                        }}
                      >
                        {[
                          { icon: '🖼️', label: 'Image', action: () => setMessageInput('Create an image of ') },
                          { icon: '📊', label: 'Slides', action: () => setMessageInput('Create a presentation about ') },
                          { icon: '🌐', label: 'Webpage', action: () => setMessageInput('Build a webpage for ') },
                          { icon: '📈', label: 'Spreadsheet', action: () => setMessageInput('Create a spreadsheet for ') },
                          { icon: '📊', label: 'Visualization', action: () => setMessageInput('Create a data visualization of ') },
                          { icon: '➕', label: 'More', action: () => setMessageInput('Help me with ') }
                        ].map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outlined"
                            onClick={suggestion.action}
                            sx={{
                              borderColor: '#4b5563',
                              color: '#d1d5db',
                              bgcolor: 'rgba(55, 65, 81, 0.5)',
                              '&:hover': {
                                borderColor: '#6b7280',
                                color: 'white',
                                bgcolor: 'rgba(75, 85, 99, 0.8)'
                              },
                              px: 3,
                              py: 1.5,
                              borderRadius: '12px',
                              textTransform: 'none',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              minWidth: 'auto'
                            }}
                          >
                            <Box sx={{ mr: 1.5, fontSize: '1rem' }}>{suggestion.icon}</Box>
                            {suggestion.label}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {chatMessages.map((message) => (
                        <Box
                          key={message.id}
                          sx={{
                            display: 'flex',
                            justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: '70%',
                              p: 2,
                              borderRadius: 2,
                              bgcolor: message.sender === 'user' ? '#3b82f6' : '#374151',
                              color: 'white',
                            }}
                          >
                            <Typography variant="body2">{message.content}</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                              {message.timestamp.toLocaleTimeString()}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      {isTyping && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                          <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#374151' }}>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Agent is typing...
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  )}
                </Box>

                {/* Chat Input */}
                <Box sx={{ p: 3, borderTop: '1px solid #334155' }}>
                  <Box sx={{ position: 'relative' }}>
                    {/* File Upload Input */}
                    <input
                      type="file"
                      id="chat-file-upload"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    />
                    
                    {/* Selected File Preview */}
                    {selectedFile && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -35, 
                        left: 0, 
                        bgcolor: '#1f2937', 
                        px: 2, 
                        py: 1, 
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: '#d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: '1px solid #374151'
                      }}>
                        📎 {selectedFile.name}
                        <IconButton size="small" onClick={clearSelectedFile} sx={{ color: '#9ca3af', p: 0.25 }}>
                          <Close sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    )}

                    {/* Integrated Input Box */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        bgcolor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        '&:focus-within': {
                          borderColor: '#3b82f6',
                        }
                      }}
                    >
                      {/* Attachment Button */}
                      <Tooltip title="Attach file">
                        <IconButton
                          component="label"
                          htmlFor="chat-file-upload"
                          sx={{
                            color: selectedFile ? '#3b82f6' : '#64748b',
                            '&:hover': { 
                              color: '#3b82f6', 
                              bgcolor: 'rgba(59, 130, 246, 0.1)' 
                            },
                            m: 1,
                            p: 1
                          }}
                        >
                          <AttachFile sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>

                      {/* Text Input */}
                      <Box
                        component="textarea"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Type your message..."
                        disabled={chatLoading}
                        sx={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          bgcolor: 'transparent',
                          color: 'white',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'none',
                          minHeight: '20px',
                          maxHeight: '120px',
                          py: 2,
                          px: 1,
                          '&::placeholder': {
                            color: '#64748b',
                          },
                        }}
                        rows={1}
                      />

                      {/* Voice Recording Button */}
                      <Tooltip title={isRecording ? "Stop recording" : "Start voice recording"}>
                        <IconButton
                          onClick={toggleRecording}
                          sx={{
                            color: isRecording ? '#ef4444' : '#64748b',
                            '&:hover': { 
                              color: isRecording ? '#dc2626' : '#3b82f6', 
                              bgcolor: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)' 
                            },
                            m: 1,
                            p: 1,
                            animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                            '@keyframes pulse': {
                              '0%': { opacity: 1 },
                              '50%': { opacity: 0.5 },
                              '100%': { opacity: 1 },
                            },
                          }}
                        >
                          {isRecording ? <MicOff sx={{ fontSize: 18 }} /> : <Mic sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>

                      {/* Send Button */}
                      <Button
                        variant="contained"
                        onClick={sendMessage}
                        disabled={!messageInput.trim() || chatLoading}
                        sx={{
                          minWidth: '40px',
                          height: '40px',
                          bgcolor: '#3b82f6',
                          '&:hover': { bgcolor: '#2563eb' },
                          '&:disabled': { bgcolor: '#374151' },
                          m: 1,
                          borderRadius: '8px'
                        }}
                      >
                        <Send sx={{ fontSize: 18 }} />
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        {isWorkspaceMode ? (
          </Box>
        ) : (
          </Container>
        )}
      </Box>

      {/* Right Panel */}
      <Slide direction="left" in={!!rightPanelType} mountOnEnter unmountOnExit>
        <Paper
          sx={{
            width: '40%',
            height: '100vh',
            bgcolor: '#1e293b',
            color: 'white',
            borderLeft: '1px solid #334155',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {selectedChatbot && (
            <>
              {/* Panel Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid #334155',
                  bgcolor: '#0f172a',
                  flexShrink: 0
                }}
              >
                <Box display="flex" justifyContent="between" alignItems="center">
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={2} mb={0.5}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        🤖 {selectedChatbot.identity.name} • {getModelProvider(selectedChatbot.configuration?.selectedModel || '')}
                      </Typography>
                      {/* Inline Metrics */}
                      <Box display="flex" gap={1}>
                        <Box sx={{ px: 1, py: 0.25, bgcolor: '#1e293b', borderRadius: 0.5, border: '1px solid #334155' }}>
                          <Typography variant="caption" sx={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 600 }}>
                            {getMockMetrics(selectedChatbot).healthScore}% Health
                          </Typography>
                        </Box>
                        <Box sx={{ px: 1, py: 0.25, bgcolor: '#1e293b', borderRadius: 0.5, border: '1px solid #334155' }}>
                          <Typography variant="caption" sx={{ color: '#3b82f6', fontSize: '0.7rem', fontWeight: 600 }}>
                            {getMockMetrics(selectedChatbot).trustScore}/100 Trust
                          </Typography>
                        </Box>
                        <Box sx={{ px: 1, py: 0.25, bgcolor: '#1e293b', borderRadius: 0.5, border: '1px solid #334155' }}>
                          <Typography variant="caption" sx={{ color: '#8b5cf6', fontSize: '0.7rem', fontWeight: 600 }}>
                            {getMockMetrics(selectedChatbot).messageVolume.toLocaleString()} Msgs
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {selectedChatbot.isDeployed ? 'Live' : 'Offline'} • {getGovernanceType(selectedChatbot)}
                    </Typography>
                  </Box>
                  <IconButton onClick={closeRightPanel} sx={{ color: '#64748b' }}>
                    <Close />
                  </IconButton>
                </Box>
              </Box>

              {/* Scorecard Buttons - Only show in workspace mode */}
              {isWorkspaceMode && (
                <Box sx={{ p: 2, borderBottom: '1px solid #334155', bgcolor: '#0f172a', flexShrink: 0 }}>

                  {/* Compact Text Button Navigation */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'analytics' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('analytics');
                        setRightPanelType('analytics');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'analytics' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'analytics' ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'analytics' ? '#2563eb' : '#1e293b' 
                        },
                      }}
                    >
                      Analytics
                    </Button>
                    
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'customize' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('customize');
                        setRightPanelType('customize');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'customize' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'customize' ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'customize' ? '#2563eb' : '#1e293b' 
                        },
                      }}
                    >
                      Customize
                    </Button>
                    
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'personality' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('personality');
                        setRightPanelType('personality');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'personality' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'personality' ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'personality' ? '#2563eb' : '#1e293b' 
                        },
                      }}
                    >
                      Personality
                    </Button>
                    
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'ai_knowledge' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('ai_knowledge');
                        setRightPanelType('ai_knowledge');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'ai_knowledge' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'ai_knowledge' ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'ai_knowledge' ? '#2563eb' : '#1e293b' 
                        },
                      }}
                    >
                      AI Knowledge
                    </Button>
                    
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'tools' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('tools');
                        setRightPanelType('tools');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'tools' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'tools' ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'tools' ? '#2563eb' : '#1e293b' 
                        },
                      }}
                    >
                      Tools
                    </Button>
                    
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'automation' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('automation');
                        setRightPanelType('automation');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'automation' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'automation' ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'automation' ? '#2563eb' : '#1e293b' 
                        },
                      }}
                    >
                      Automation
                    </Button>
                    
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'receipts' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('receipts');
                        setRightPanelType('receipts');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'receipts' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'receipts' ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'receipts' ? '#2563eb' : '#1e293b' 
                        },
                      }}
                    >
                      Receipts
                    </Button>
                    
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'memory' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('memory');
                        setRightPanelType('memory');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'memory' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'memory' ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'memory' ? '#2563eb' : '#1e293b' 
                        },
                      }}
                    >
                      Memory
                    </Button>
                    
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'sandbox' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('sandbox');
                        setRightPanelType('sandbox');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'sandbox' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'sandbox' ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'sandbox' ? '#2563eb' : '#1e293b' 
                        },
                      }}
                    >
                      Sandbox
                    </Button>
                    
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'governance' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('governance');
                        setRightPanelType('governance');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'governance' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'governance' ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'governance' ? '#2563eb' : '#1e293b' 
                        },
                      }}
                    >
                      Governance
                    </Button>
                    
                    <Button
                      size="small"
                      variant={workspaceSelectedTab === 'deploy' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setWorkspaceSelectedTab('deploy');
                        setRightPanelType('deploy');
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: '#374151',
                        color: workspaceSelectedTab === 'deploy' ? 'white' : '#94a3b8',
                        bgcolor: workspaceSelectedTab === 'deploy' ? '#10b981' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: workspaceSelectedTab === 'deploy' ? '#059669' : '#1e293b' 
                        },
                      }}
                    >
                      Deploy
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Panel Content */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {rightPanelType === 'analytics' && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold', fontSize: '1.1rem' }}>
                      Analytics Dashboard
                    </Typography>
                    
                    {/* Key Metrics */}
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.75rem' }}>
                              Response Time
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 'bold', fontSize: '1rem' }}>
                              {getMockMetrics(selectedChatbot).responseTime.toFixed(1)}s
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.75rem' }}>
                              Satisfaction
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1rem' }}>
                              {getMockMetrics(selectedChatbot).satisfactionScore.toFixed(1)}/5
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                              Resolution Rate
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                              {getMockMetrics(selectedChatbot).resolutionRate}%
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                              Last Active
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>
                              {getMockMetrics(selectedChatbot).lastActive}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Performance Trends */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          Performance Trends
                        </Typography>
                        <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            📈 Interactive charts will be displayed here
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Usage Statistics */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          Usage Statistics
                        </Typography>
                        <Stack spacing={2}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Total Conversations
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {getMockMetrics(selectedChatbot).messageVolume.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Governance Alerts
                            </Typography>
                            <Typography variant="body1" sx={{ color: getMockMetrics(selectedChatbot).governanceAlerts > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                              {getMockMetrics(selectedChatbot).governanceAlerts}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Health Score
                            </Typography>
                            <Typography variant="body1" sx={{ color: getMockMetrics(selectedChatbot).healthScore >= 90 ? '#10b981' : getMockMetrics(selectedChatbot).healthScore >= 80 ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>
                              {getMockMetrics(selectedChatbot).healthScore}%
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {rightPanelType === 'customize' && (
                  <WidgetCustomizer
                    chatbot={selectedChatbot}
                    onSave={(config) => {
                      console.log('Widget config saved:', config);
                      // Here you would save the configuration to the chatbot profile
                      // For now, we'll just log it
                    }}
                    onClose={closeRightPanel}
                  />
                )}

                {rightPanelType === 'personality' && (
                  <PersonalityEditor
                    chatbot={selectedChatbot}
                    onSave={async (updates) => {
                      try {
                        console.log('Personality updates:', updates);
                        
                        // Update the chatbot using ChatbotStorageService
                        const chatbotStorageService = ChatbotStorageService.getInstance();
                        const updatedChatbot = await chatbotStorageService.updateChatbot(selectedChatbot.identity.id, updates);
                        
                        if (updatedChatbot) {
                          // Update local state
                          setChatbots(prev => prev.map(bot => 
                            bot.identity.id === selectedChatbot.identity.id ? updatedChatbot : bot
                          ));
                          setSelectedChatbot(updatedChatbot);
                          
                          console.log('✅ Personality settings saved successfully');
                          // You could show a success message here
                        }
                        
                        closeRightPanel();
                      } catch (error) {
                        console.error('❌ Failed to save personality settings:', error);
                        // You could show an error message here
                      }
                    }}
                    onCancel={closeRightPanel}
                  />
                )}

                {rightPanelType === 'knowledge' && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                      Knowledge Management
                    </Typography>
                    
                    {/* Knowledge Base Stats */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={4}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                              {Math.floor(Math.random() * 50) + 10}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              Documents
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={4}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                              {Math.floor(Math.random() * 20) + 80}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              RAG Accuracy
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={4}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                              {(Math.random() * 2 + 0.5).toFixed(1)}s
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              Retrieval Time
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Document Management */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" sx={{ color: 'white' }}>
                            Document Library
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            sx={{ bgcolor: '#3b82f6' }}
                          >
                            Upload
                          </Button>
                        </Box>
                        
                        <Stack spacing={2}>
                          {['Product Manual v2.1.pdf', 'FAQ Database.docx', 'API Documentation.md', 'Training Guidelines.txt'].map((doc, index) => (
                            <Box
                              key={index}
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{
                                p: 2,
                                bgcolor: '#0f172a',
                                borderRadius: 1,
                                border: '1px solid #334155'
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                                  📄
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {doc}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    {Math.floor(Math.random() * 500) + 100} KB • {Math.floor(Math.random() * 30) + 1} days ago
                                  </Typography>
                                </Box>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <Chip
                                  label={Math.random() > 0.5 ? 'Active' : 'Indexed'}
                                  size="small"
                                  sx={{
                                    bgcolor: Math.random() > 0.5 ? '#10b981' : '#374151',
                                    color: 'white',
                                    fontSize: '0.75rem'
                                  }}
                                />
                                <IconButton size="small" sx={{ color: '#64748b' }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* RAG Performance */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          RAG Performance
                        </Typography>
                        
                        <Stack spacing={3}>
                          <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                Retrieval Accuracy
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                                94%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={94}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#334155',
                                '& .MuiLinearProgress-bar': { bgcolor: '#10b981' }
                              }}
                            />
                          </Box>
                          
                          <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                Context Relevance
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                87%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={87}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#334155',
                                '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' }
                              }}
                            />
                          </Box>
                          
                          <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                Response Quality
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                                91%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={91}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#334155',
                                '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' }
                              }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {rightPanelType === 'automation' && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                      Automation & Workflows
                    </Typography>
                    
                    {/* Automation Stats */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                              {Math.floor(Math.random() * 10) + 3}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              Active Workflows
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                              {Math.floor(Math.random() * 30) + 70}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              Automation Rate
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Active Workflows */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" sx={{ color: 'white' }}>
                            Active Workflows
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            sx={{ bgcolor: '#8b5cf6' }}
                          >
                            Create
                          </Button>
                        </Box>
                        
                        <Stack spacing={2}>
                          {[
                            { name: 'Lead Qualification', trigger: 'New conversation', status: 'Active' },
                            { name: 'Escalation to Human', trigger: 'Sentiment < 0.3', status: 'Active' },
                            { name: 'Follow-up Email', trigger: 'Conversation ends', status: 'Paused' },
                            { name: 'Data Collection', trigger: 'User provides email', status: 'Active' }
                          ].map((workflow, index) => (
                            <Box
                              key={index}
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{
                                p: 2,
                                bgcolor: '#0f172a',
                                borderRadius: 1,
                                border: '1px solid #334155'
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}>
                                  ⚡
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {workflow.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    Trigger: {workflow.trigger}
                                  </Typography>
                                </Box>
                              </Box>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label={workflow.status}
                                  size="small"
                                  sx={{
                                    bgcolor: workflow.status === 'Active' ? '#10b981' : '#f59e0b',
                                    color: 'white',
                                    fontSize: '0.75rem'
                                  }}
                                />
                                <IconButton size="small" sx={{ color: '#64748b' }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Automation Rules */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          Automation Rules
                        </Typography>
                        
                        <Stack spacing={2}>
                          {[
                            { rule: 'Auto-escalate after 3 failed responses', enabled: true },
                            { rule: 'Send satisfaction survey after resolution', enabled: true },
                            { rule: 'Collect feedback on negative sentiment', enabled: false },
                            { rule: 'Schedule follow-up for unresolved issues', enabled: true }
                          ].map((rule, index) => (
                            <Box
                              key={index}
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{
                                p: 2,
                                bgcolor: '#0f172a',
                                borderRadius: 1,
                                border: '1px solid #334155'
                              }}
                            >
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {rule.rule}
                              </Typography>
                              <Chip
                                label={rule.enabled ? 'Enabled' : 'Disabled'}
                                size="small"
                                sx={{
                                  bgcolor: rule.enabled ? '#10b981' : '#64748b',
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Human Handoff Settings */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          Human Handoff
                        </Typography>
                        
                        <Stack spacing={2}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Escalation Threshold
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                              3 failed attempts
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Response Time SLA
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                              5 minutes
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Available Agents
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                              {Math.floor(Math.random() * 5) + 2} online
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {rightPanelType === 'deployment' && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                      Deployment Settings
                    </Typography>
                    
                    {/* Deployment Status */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          Deployment Status
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Avatar sx={{ bgcolor: selectedChatbot.isDeployed ? '#10b981' : '#64748b', width: 40, height: 40 }}>
                            {selectedChatbot.isDeployed ? '🚀' : '⏸️'}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {selectedChatbot.isDeployed ? 'Live & Active' : 'Offline'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              {selectedChatbot.isDeployed ? 'Serving requests across all channels' : 'Deployment paused'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{
                            bgcolor: selectedChatbot.isDeployed ? '#ef4444' : '#10b981',
                            '&:hover': {
                              bgcolor: selectedChatbot.isDeployed ? '#dc2626' : '#059669'
                            }
                          }}
                        >
                          {selectedChatbot.isDeployed ? 'Stop Deployment' : 'Deploy Chatbot'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Channel Management */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" sx={{ color: 'white' }}>
                            Active Channels
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            sx={{ bgcolor: '#3b82f6' }}
                          >
                            Add Channel
                          </Button>
                        </Box>
                        
                        <Stack spacing={2}>
                          {[
                            { name: 'Website Widget', status: 'Active', users: 1247, icon: '🌐' },
                            { name: 'WhatsApp Business', status: 'Active', users: 892, icon: '💬' },
                            { name: 'Facebook Messenger', status: 'Inactive', users: 0, icon: '📘' },
                            { name: 'Slack Integration', status: 'Active', users: 156, icon: '💼' }
                          ].map((channel, index) => (
                            <Box
                              key={index}
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{
                                p: 2,
                                bgcolor: '#0f172a',
                                borderRadius: 1,
                                border: '1px solid #334155'
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                                  {channel.icon}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {channel.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    {channel.users.toLocaleString()} active users
                                  </Typography>
                                </Box>
                              </Box>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label={channel.status}
                                  size="small"
                                  sx={{
                                    bgcolor: channel.status === 'Active' ? '#10b981' : '#64748b',
                                    color: 'white',
                                    fontSize: '0.75rem'
                                  }}
                                />
                                <IconButton size="small" sx={{ color: '#64748b' }}>
                                  <Settings fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* API Endpoints */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          API Endpoints
                        </Typography>
                        
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: '#0f172a',
                              borderRadius: 1,
                              border: '1px solid #334155'
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                              REST API Endpoint
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              https://api.promethios.com/v1/chat/{selectedChatbot.identity.id}
                            </Typography>
                          </Box>
                          
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: '#0f172a',
                              borderRadius: 1,
                              border: '1px solid #334155'
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                              WebSocket Endpoint
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              wss://ws.promethios.com/v1/chat/{selectedChatbot.identity.id}
                            </Typography>
                          </Box>
                          
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: '#0f172a',
                              borderRadius: 1,
                              border: '1px solid #334155'
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                              Widget Embed Code
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              &lt;script src="https://widget.promethios.com/embed.js" data-chatbot="{selectedChatbot.identity.id}"&gt;&lt;/script&gt;
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Performance Metrics */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          Deployment Metrics
                        </Typography>
                        
                        <Stack spacing={2}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Uptime
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                              99.9%
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Response Time
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                              {getMockMetrics(selectedChatbot).responseTime.toFixed(1)}s
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Daily Requests
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                              {(getMockMetrics(selectedChatbot).messageVolume / 30).toFixed(0)}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Error Rate
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                              0.1%
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {rightPanelType === 'chat' && (
                  <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
                    {/* Modern Chat Header */}
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: '#1e293b',
                        borderBottom: '1px solid #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                          Chat with Your Agent
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {selectedChatbot?.identity.name || 'Select an agent to start chatting...'}
                        </Typography>
                      </Box>
                      {activeSession && (
                        <Box textAlign="right">
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Session: {activeSession.sessionId.slice(-8)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {chatLoading && !activeSession ? (
                      <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                        <CircularProgress sx={{ color: '#3b82f6' }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8', ml: 2 }}>
                          Initializing chat session...
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        {/* Chat Messages Area */}
                        <Box
                          sx={{
                            flex: 1,
                            p: 2,
                            bgcolor: '#0f172a',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                          }}
                        >
                          {chatMessages.length === 0 ? (
                            <Box
                              display="flex"
                              justifyContent="center"
                              alignItems="center"
                              flex={1}
                              flexDirection="column"
                              gap={2}
                            >
                              <Avatar sx={{ bgcolor: '#3b82f6', width: 48, height: 48 }}>
                                🤖
                              </Avatar>
                              <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
                                {selectedChatbot ? 
                                  `Start a conversation with ${selectedChatbot.identity.name}` :
                                  'Select an agent to start chatting...'
                                }
                              </Typography>
                            </Box>
                          ) : (
                            chatMessages.map((message) => (
                              <Box
                                key={message.id}
                                display="flex"
                                alignItems="flex-start"
                                gap={1.5}
                                justifyContent={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                              >
                                {message.sender !== 'user' && (
                                  <Avatar sx={{ 
                                    bgcolor: message.sender === 'system' ? '#ef4444' : '#3b82f6', 
                                    width: 24, 
                                    height: 24,
                                    fontSize: '0.75rem'
                                  }}>
                                    {message.sender === 'system' ? '⚠️' : '🤖'}
                                  </Avatar>
                                )}
                                
                                <Box
                                  sx={{
                                    bgcolor: message.sender === 'user' ? '#3b82f6' : '#1e293b',
                                    color: 'white',
                                    p: 1.5,
                                    borderRadius: 2,
                                    maxWidth: '85%',
                                    border: message.sender === 'agent' ? '1px solid #334155' : 'none'
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {message.content}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: message.sender === 'user' ? '#bfdbfe' : '#64748b',
                                      display: 'block',
                                      mt: 0.5,
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {message.timestamp.toLocaleTimeString()}
                                  </Typography>
                                </Box>
                                
                                {message.sender === 'user' && (
                                  <Avatar sx={{ bgcolor: '#64748b', width: 24, height: 24, fontSize: '0.75rem' }}>
                                    👤
                                  </Avatar>
                                )}
                              </Box>
                            ))
                          )}

                          {/* Typing Indicator */}
                          {isTyping && (
                            <Box display="flex" alignItems="flex-start" gap={1.5}>
                              <Avatar sx={{ bgcolor: '#3b82f6', width: 24, height: 24, fontSize: '0.75rem' }}>
                                🤖
                              </Avatar>
                              <Box
                                sx={{
                                  bgcolor: '#1e293b',
                                  border: '1px solid #334155',
                                  color: '#94a3b8',
                                  p: 1.5,
                                  borderRadius: '12px 12px 12px 4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                  Thinking...
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {[0, 0.2, 0.4].map((delay, index) => (
                                    <Box
                                      key={index}
                                      sx={{
                                        width: 3,
                                        height: 3,
                                        bgcolor: '#94a3b8',
                                        borderRadius: '50%',
                                        animation: `pulse 1.5s ease-in-out infinite ${delay}s`
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Box>

                        {/* Compact Trust Scores - Horizontal at Bottom */}
                        {activeSession && (
                          <Box
                            sx={{
                              p: 1.5,
                              bgcolor: '#1e293b',
                              borderTop: '1px solid #334155',
                              borderBottom: '1px solid #334155'
                            }}
                          >
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={3}>
                                <Box textAlign="center">
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                    Trust
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                    {Math.round((activeSession.governanceMetrics.averageTrustScore || 0.75) * 100)}%
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={3}>
                                <Box textAlign="center">
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                    Messages
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                    {activeSession.governanceMetrics.totalMessages}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={3}>
                                <Box textAlign="center">
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                    Violations
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    color: activeSession.governanceMetrics.policyViolations > 0 ? '#ef4444' : '#10b981', 
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem'
                                  }}>
                                    {activeSession.governanceMetrics.policyViolations}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={3}>
                                <Box textAlign="center">
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                    Level
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                    {activeSession.autonomyLevel}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        )}

                        {/* Chat Input Area */}
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: '#0f172a',
                            borderTop: '1px solid #334155'
                          }}
                        >
                          <Box display="flex" gap={1} alignItems="flex-end">
                            <Box
                              component="input"
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder={selectedChatbot ? "Type your message..." : "Select an agent first..."}
                              disabled={chatLoading || !selectedChatbot}
                              sx={{
                                flex: 1,
                                p: 1.5,
                                bgcolor: '#1e293b',
                                border: '1px solid #374151',
                                borderRadius: 2,
                                color: 'white',
                                fontSize: '0.875rem',
                                '&:focus': {
                                  outline: 'none',
                                  borderColor: '#3b82f6'
                                },
                                '&::placeholder': {
                                  color: '#64748b'
                                },
                                '&:disabled': {
                                  opacity: 0.5,
                                  cursor: 'not-allowed'
                                }
                              }}
                            />
                            <IconButton
                              size="small"
                              sx={{ color: '#64748b', '&:hover': { color: '#94a3b8' } }}
                            >
                              🎤
                            </IconButton>
                            <IconButton
                              size="small"
                              sx={{ color: '#64748b', '&:hover': { color: '#94a3b8' } }}
                            >
                              📎
                            </IconButton>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={sendMessage}
                              disabled={chatLoading || !messageInput.trim() || !selectedChatbot}
                              startIcon={chatLoading ? <CircularProgress size={14} /> : <Send />}
                              sx={{
                                bgcolor: '#3b82f6',
                                minWidth: 'auto',
                                px: 2,
                                '&:hover': { bgcolor: '#2563eb' },
                                '&:disabled': {
                                  bgcolor: '#374151',
                                  color: '#64748b'
                                }
                              }}
                            >
                              {chatLoading ? 'Sending...' : 'Send'}
                            </Button>
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                )}

                {rightPanelType === 'settings' && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>General Settings</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Basic configuration, model selection, and governance settings will be available here.
                    </Typography>
                  </Box>
                )}

                {rightPanelType === 'receipts' && (
                  <AgentReceiptViewer
                    chatbot={selectedChatbot}
                    onReceiptClick={(receipt) => {
                      // Load receipt context into chat
                      console.log('Loading receipt context:', receipt);
                    }}
                  />
                )}

                {rightPanelType === 'memory' && (
                  <AgentMemoryViewer
                    chatbot={selectedChatbot}
                    onMemoryLoad={(memory) => {
                      // Load memory context into chat
                      console.log('Loading memory context:', memory);
                    }}
                  />
                )}

                {rightPanelType === 'sandbox' && (
                  <LiveAgentSandbox
                    chatbot={selectedChatbot}
                    onDebugAction={(action) => {
                      // Handle debug actions
                      console.log('Debug action:', action);
                    }}
                  />
                )}

                {rightPanelType === 'governance' && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                      Governance Sensitivity
                    </Typography>
                    
                    {/* Governance Sensitivity Controls */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                          Approval Sensitivity
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                          Configure when the agent should ask for approval before taking actions
                        </Typography>
                        
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel sx={{ color: '#94a3b8' }}>Sensitivity Level</InputLabel>
                          <Select
                            value={governanceSensitivity}
                            onChange={(e) => setGovernanceSensitivity(e.target.value as 'low' | 'medium' | 'high')}
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                              '& .MuiSvgIcon-root': { color: '#94a3b8' }
                            }}
                          >
                            <MenuItem value="low">Low - Minimal approvals required</MenuItem>
                            <MenuItem value="medium">Medium - Balanced approach</MenuItem>
                            <MenuItem value="high">High - Frequent approval requests</MenuItem>
                          </Select>
                        </FormControl>

                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                          Current setting: <strong style={{ color: '#3b82f6' }}>{governanceSensitivity.toUpperCase()}</strong>
                        </Typography>

                        {/* Trust Threshold Controls */}
                        <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, fontWeight: 'bold' }}>
                          Trust Threshold: {trustThreshold}%
                        </Typography>
                        <Slider
                          value={trustThreshold}
                          onChange={(_, value) => setTrustThreshold(value as number)}
                          min={0}
                          max={100}
                          step={5}
                          sx={{
                            color: '#3b82f6',
                            '& .MuiSlider-thumb': { bgcolor: '#3b82f6' },
                            '& .MuiSlider-track': { bgcolor: '#3b82f6' },
                            '& .MuiSlider-rail': { bgcolor: '#374151' }
                          }}
                        />
                        <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                          Actions below this trust level will require approval
                        </Typography>

                        {/* Risk Categories */}
                        <Typography variant="subtitle2" sx={{ color: 'white', mt: 3, mb: 2, fontWeight: 'bold' }}>
                          Risk Categories Requiring Approval
                        </Typography>
                        
                        {['financial_transactions', 'data_access', 'external_communications', 'system_changes'].map((category) => (
                          <FormControlLabel
                            key={category}
                            control={
                              <Checkbox
                                checked={riskCategories.includes(category)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRiskCategories([...riskCategories, category]);
                                  } else {
                                    setRiskCategories(riskCategories.filter(c => c !== category));
                                  }
                                }}
                                sx={{ color: '#3b82f6' }}
                              />
                            }
                            label={category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            sx={{ color: '#94a3b8', display: 'block', mb: 1 }}
                          />
                        ))}

                        {/* Apply Button */}
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => {
                            // Apply governance settings
                            console.log('Applying governance settings:', {
                              sensitivity: governanceSensitivity,
                              trustThreshold,
                              riskCategories
                            });
                          }}
                          sx={{
                            mt: 3,
                            bgcolor: '#3b82f6',
                            '&:hover': { bgcolor: '#2563eb' }
                          }}
                        >
                          Apply Governance Settings
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Current Governance Status */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                          Current Governance Status
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>Trust Score</Typography>
                            <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                              {activeSession?.trustScore ? (activeSession.trustScore * 100).toFixed(0) : '75'}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>Compliance</Typography>
                            <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                              {activeSession?.governanceMetrics?.complianceScore ? (activeSession.governanceMetrics.complianceScore * 100).toFixed(0) : '100'}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>Violations</Typography>
                            <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                              {activeSession?.governanceMetrics?.violations || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>Warnings</Typography>
                            <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                              {activeSession?.governanceMetrics?.warnings || 0}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {rightPanelType === 'ai_knowledge' && (
                  <SimplifiedKnowledgeViewer
                    agentId={selectedChatbot.identity.id}
                    onContentLoad={(content) => {
                      // Load content context into chat
                      console.log('Loading knowledge content into chat:', content);
                      
                      // Add the content as a system message to provide context
                      const contextMessage: ChatMessage = {
                        id: `context_${Date.now()}`,
                        content: `Loading context: ${content.title || content.name || 'Knowledge item'}`,
                        sender: 'system',
                        timestamp: new Date(),
                        trustScore: 1.0,
                        governanceStatus: 'approved'
                      };
                      
                      setChatMessages(prev => [...prev, contextMessage]);
                      
                      // Optionally pre-fill the message input with a relevant prompt
                      setMessageInput(`Continue working on: ${content.title || content.name || 'this item'}`);
                    }}
                    onShare={(content) => {
                      // Handle sharing through governance
                      console.log('Sharing knowledge content:', content);
                    }}
                  />
                )}

                {rightPanelType === 'tools' && (
                  <ToolConfigurationPanel
                    chatbot={selectedChatbot}
                    onClose={closeRightPanel}
                    onSave={(toolProfile: AgentToolProfile) => {
                      console.log('Tool profile saved:', toolProfile);
                      // Here you would save the tool configuration to the backend
                      closeRightPanel();
                    }}
                  />
                )}
              </Box>
            </>
          )}
        </Paper>
      </Slide>
    </Box>
  );
};

export default ChatbotProfilesPageEnhanced;

