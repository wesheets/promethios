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
  TextField,
  InputAdornment,
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
  Search,
  FilterList,
  Sort,
  Visibility,
  Warning,
  Error as ErrorIcon,
  Refresh,
  Download,
  Upload,
  Share,
  Delete,
  PlayArrow,
  Pause,
  Stop
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
  const [filteredChatbots, setFilteredChatbots] = useState<ChatbotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotProfile | null>(null);
  const [rightPanelType, setRightPanelType] = useState<RightPanelType>(null);
  const [filterTab, setFilterTab] = useState(0); // 0: All, 1: Hosted API, 2: BYOK, 3: Enterprise
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Mock governance type function
  const getGovernanceType = (chatbot: ChatbotProfile) => {
    const types = ['BYOK', 'Hosted API', 'Enterprise'];
    return types[Math.floor(Math.random() * types.length)];
  };

  // Mock model provider function
  const getModelProvider = (model: string) => {
    const providers = {
      'gpt-4-turbo': { name: 'OpenAI', color: '#10b981' },
      'claude-3': { name: 'Anthropic', color: '#f59e0b' },
      'gemini-pro': { name: 'Google', color: '#3b82f6' }
    };
    return providers[model as keyof typeof providers] || { name: 'OpenAI', color: '#10b981' };
  };

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
      // Set mock data for demo purposes
      const mockChatbots: ChatbotProfile[] = [
        {
          id: 'agent-001',
          identity: {
            id: 'agent-001',
            name: 'Sarah Analytics',
            role: 'Data Analysis Specialist',
            description: 'Expert in data visualization, statistical analysis, and business intelligence reporting.',
            avatar: '/avatars/sarah.jpg',
            personality: 'analytical',
            expertise: ['Data Analysis', 'Visualization', 'Statistics']
          },
          configuration: {
            selectedModel: 'gpt-4-turbo',
            temperature: 0.3,
            maxTokens: 4096,
            systemPrompt: 'You are a data analysis expert...'
          },
          status: 'active',
          createdAt: new Date('2024-01-15'),
          lastActive: new Date()
        },
        {
          id: 'agent-002',
          identity: {
            id: 'agent-002',
            name: 'Marcus Creative',
            role: 'Content Creator',
            description: 'Specialized in creative writing, marketing copy, and brand storytelling.',
            avatar: '/avatars/marcus.jpg',
            personality: 'creative',
            expertise: ['Creative Writing', 'Marketing', 'Branding']
          },
          configuration: {
            selectedModel: 'gpt-4-turbo',
            temperature: 0.8,
            maxTokens: 4096,
            systemPrompt: 'You are a creative writing expert...'
          },
          status: 'active',
          createdAt: new Date('2024-01-20'),
          lastActive: new Date()
        }
      ];
      setChatbotProfiles(mockChatbots);
      setFilteredChatbots(mockChatbots);
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
      setFilteredChatbots(chatbots);
      console.log('🔍 setChatbotProfiles called with:', chatbots.length, 'chatbots');
    } catch (error) {
      console.error('❌ Failed to load chatbots:', error);
      setError('Failed to load chatbots. Please try again.');
      setChatbotProfiles([]);
      setFilteredChatbots([]);
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

  // Filter chatbots based on search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredChatbots(chatbotProfiles);
    } else {
      const filtered = chatbotProfiles.filter(chatbot =>
        chatbot.identity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chatbot.identity.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chatbot.identity.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChatbots(filtered);
    }
  }, [searchQuery, chatbotProfiles]);

  // Handle chatbot selection
  const handleChatbotSelect = (chatbot: ChatbotProfile) => {
    setSelectedChatbot(chatbot);
    setRightPanelType('chat');
  };

  // Handle right panel actions
  const handleRightPanelAction = (type: RightPanelType, chatbot: ChatbotProfile) => {
    setSelectedChatbot(chatbot);
    setRightPanelType(type);
  };

  // Chat functionality
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChatbot || chatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageInput,
      role: 'user',
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setChatLoading(true);
    setIsTyping(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Hello! I'm ${selectedChatbot.identity.name}. I received your message: "${userMessage.content}". How can I help you today?`,
        role: 'assistant',
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setChatLoading(false);
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f172a' }}>
        <CircularProgress sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f172a' }}>
        <Typography sx={{ color: '#ef4444' }}>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#0f172a' }}>
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
            {/* Workspace Mode Content */}
            <Container sx={{ py: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                  Agent Workspace
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setIsWorkspaceMode(false)}
                  sx={{ color: '#64748b', borderColor: '#64748b' }}
                >
                  Exit Workspace
                </Button>
              </Box>

              {/* Workspace Tabs */}
              <Tabs
                value={workspaceSelectedTab}
                onChange={(_, newValue) => setWorkspaceSelectedTab(newValue)}
                sx={{
                  mb: 4,
                  '& .MuiTab-root': { color: '#64748b' },
                  '& .Mui-selected': { color: '#3b82f6' },
                  '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
                }}
              >
                <Tab label="Analytics" value="analytics" />
                <Tab label="Collaboration" value="collaboration" />
                <Tab label="Deployment" value="deployment" />
              </Tabs>

              {/* Workspace Content */}
              <Box sx={{ bgcolor: '#1e293b', borderRadius: 2, p: 4 }}>
                <Typography sx={{ color: '#64748b', textAlign: 'center' }}>
                  Workspace functionality for {workspaceSelectedTab} coming soon...
                </Typography>
              </Box>
            </Container>
          </Box>
        ) : (
          <Container sx={{ py: 2, height: '100%' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                Agent Command Center
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Manage and interact with your AI agents
              </Typography>
            </Box>

            {/* Controls */}
            <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#1e293b',
                    color: 'white',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  }
                }}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                sx={{
                  bgcolor: '#3b82f6',
                  '&:hover': { bgcolor: '#2563eb' },
                  whiteSpace: 'nowrap'
                }}
              >
                New Agent
              </Button>
              <Button
                variant="outlined"
                startIcon={<Computer />}
                onClick={() => setIsWorkspaceMode(true)}
                sx={{
                  borderColor: '#64748b',
                  color: '#64748b',
                  '&:hover': { borderColor: '#3b82f6', color: '#3b82f6' },
                  whiteSpace: 'nowrap'
                }}
              >
                Workspace
              </Button>
            </Box>

            {/* Filter Tabs */}
            <Tabs
              value={filterTab}
              onChange={(_, newValue) => setFilterTab(newValue)}
              sx={{
                mb: 4,
                '& .MuiTab-root': { color: '#64748b' },
                '& .Mui-selected': { color: '#3b82f6' },
                '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
              }}
            >
              <Tab label="All Agents" />
              <Tab label="Hosted API" />
              <Tab label="BYOK" />
              <Tab label="Enterprise" />
            </Tabs>

            {/* Chatbot Grid */}
            <Box sx={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
              <Grid container spacing={3}>
                {filteredChatbots.map((chatbot) => {
                  const metrics = getMockMetrics(chatbot);
                  const governanceType = getGovernanceType(chatbot);
                  const modelProvider = getModelProvider(chatbot.configuration?.selectedModel || '');
                  const isNativeAgent = governanceType === 'BYOK';
                  const isSelected = selectedChatbot?.identity.id === chatbot.identity.id;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={chatbot.id}>
                      <Card
                        sx={{
                          bgcolor: isSelected ? '#1e40af' : '#1e293b',
                          border: isSelected ? '2px solid #3b82f6' : '1px solid #334155',
                          borderRadius: '12px',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                            borderColor: '#3b82f6'
                          }
                        }}
                        onClick={() => handleChatbotSelect(chatbot)}
                      >
                        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={chatbot.identity.avatar}
                                sx={{
                                  width: 48,
                                  height: 48,
                                  bgcolor: isNativeAgent ? '#10b981' : '#3b82f6',
                                  border: '2px solid',
                                  borderColor: isNativeAgent ? '#10b981' : '#3b82f6'
                                }}
                              >
                                {chatbot.identity.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                                  {chatbot.identity.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                  {chatbot.identity.role}
                                </Typography>
                              </Box>
                            </Box>
                            <IconButton
                              size="small"
                              sx={{ color: '#64748b', '&:hover': { color: 'white' } }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add menu functionality here
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Box>

                          {/* Governance and Health Chips */}
                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip
                              label={governanceType}
                              size="small"
                              sx={{
                                bgcolor: isNativeAgent ? '#10b981' : '#3b82f6',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            />
                            <Chip
                              label={`${metrics.healthScore}% Health`}
                              size="small"
                              sx={{
                                bgcolor: metrics.healthScore >= 90 ? '#065f46' : metrics.healthScore >= 70 ? '#ca8a04' : '#dc2626',
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>

                          {/* Description */}
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#cbd5e1',
                              mb: 3,
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              flex: 1
                            }}
                          >
                            {chatbot.identity.description}
                          </Typography>

                          {/* Metrics Grid */}
                          <Grid container spacing={1} sx={{ mb: 2 }}>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#0f172a', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                  Trust
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 'bold', fontSize: '1rem' }}>
                                  {metrics.trustScore}%
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#0f172a', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                  Response
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1rem' }}>
                                  {Math.round(metrics.responseTime * 100)}ms
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#0f172a', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                  Success
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '1rem' }}>
                                  {metrics.resolutionRate}%
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          {/* Model Provider */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Chip
                              label={modelProvider.name}
                              size="small"
                              sx={{
                                bgcolor: modelProvider.color,
                                color: 'white',
                                fontWeight: 500,
                                fontSize: '0.7rem'
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {chatbot.configuration?.selectedModel || 'Default Model'}
                            </Typography>
                          </Box>

                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Chat />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRightPanelAction('chat', chatbot);
                              }}
                              sx={{
                                flex: 1,
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                fontSize: '0.75rem',
                                py: 0.5,
                              }}
                            >
                              Chat
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Settings />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRightPanelAction('settings', chatbot);
                              }}
                              sx={{
                                borderColor: '#64748b',
                                color: '#64748b',
                                fontSize: '0.75rem',
                                py: 0.5,
                                '&:hover': {
                                  borderColor: '#3b82f6',
                                  color: '#3b82f6',
                                  bgcolor: 'rgba(59, 130, 246, 0.1)'
                                }
                              }}
                            >
                              Config
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Api />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRightPanelAction('tools', chatbot);
                              }}
                              sx={{
                                borderColor: '#64748b',
                                color: '#64748b',
                                fontSize: '0.75rem',
                                py: 0.5,
                                '&:hover': {
                                  borderColor: '#10b981',
                                  color: '#10b981',
                                  bgcolor: 'rgba(16, 185, 129, 0.1)'
                                }
                              }}
                            >
                              Tools
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
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
            borderLeft: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            right: 0,
            top: 0,
            zIndex: 1200,
            overflow: 'hidden'
          }}
        >
          {/* Panel Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              {rightPanelType === 'chat' && 'Agent Chat'}
              {rightPanelType === 'analytics' && 'Analytics Dashboard'}
              {rightPanelType === 'customize' && 'Widget Customizer'}
              {rightPanelType === 'personality' && 'Personality Editor'}
              {rightPanelType === 'knowledge' && 'Knowledge Base'}
              {rightPanelType === 'tools' && 'Tool Configuration'}
              {rightPanelType === 'settings' && 'Agent Settings'}
              {rightPanelType === 'receipts' && 'Agent Receipts'}
              {rightPanelType === 'memory' && 'Agent Memory'}
              {rightPanelType === 'sandbox' && 'Live Sandbox'}
              {rightPanelType === 'governance' && 'Governance Controls'}
            </Typography>
            <IconButton
              onClick={() => setRightPanelType(null)}
              sx={{ color: '#64748b', '&:hover': { color: 'white' } }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Panel Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {rightPanelType === 'chat' && selectedChatbot && (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Chat Interface */}
                <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                  {chatMessages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                      <Avatar
                        src={selectedChatbot.identity.avatar}
                        sx={{ width: 64, height: 64, mx: 'auto', mb: 2 }}
                      >
                        {selectedChatbot.identity.name.charAt(0)}
                      </Avatar>
                      <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                        {selectedChatbot.identity.name}
                      </Typography>
                      <Typography sx={{ color: '#64748b', mb: 3 }}>
                        {selectedChatbot.identity.description}
                      </Typography>
                      <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Start a conversation with your AI agent
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {chatMessages.map((message) => (
                        <Box
                          key={message.id}
                          sx={{
                            display: 'flex',
                            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <Paper
                            sx={{
                              p: 2,
                              maxWidth: '80%',
                              bgcolor: message.role === 'user' ? '#3b82f6' : '#374151',
                              color: 'white'
                            }}
                          >
                            <Typography variant="body2">
                              {message.content}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                              {message.timestamp.toLocaleTimeString()}
                            </Typography>
                          </Paper>
                        </Box>
                      ))}
                      {isTyping && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                          <Paper sx={{ p: 2, bgcolor: '#374151', color: 'white' }}>
                            <Typography variant="body2">
                              {selectedChatbot.identity.name} is typing...
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Stack>
                  )}
                </Box>
                
                {/* Chat Input */}
                <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      variant="outlined"
                      size="small"
                      disabled={chatLoading}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#0f172a',
                          color: 'white',
                          '& fieldset': { borderColor: '#334155' },
                          '&:hover fieldset': { borderColor: '#3b82f6' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || chatLoading}
                      sx={{
                        bgcolor: '#3b82f6',
                        '&:hover': { bgcolor: '#2563eb' },
                        minWidth: 'auto',
                        px: 2
                      }}
                    >
                      {chatLoading ? <CircularProgress size={18} /> : <Send sx={{ fontSize: 18 }} />}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {rightPanelType === 'tools' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <ToolConfigurationPanel />
              </Box>
            )}

            {rightPanelType === 'customize' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <WidgetCustomizer />
              </Box>
            )}

            {rightPanelType === 'personality' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <PersonalityEditor />
              </Box>
            )}

            {rightPanelType === 'knowledge' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <SimplifiedKnowledgeViewer />
              </Box>
            )}

            {rightPanelType === 'receipts' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <AgentReceiptViewer />
              </Box>
            )}

            {rightPanelType === 'memory' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <AgentMemoryViewer />
              </Box>
            )}

            {rightPanelType === 'sandbox' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <LiveAgentSandbox />
              </Box>
            )}

            {rightPanelType === 'analytics' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                  Analytics Dashboard - {selectedChatbot.identity.name}
                </Typography>
                
                {/* Analytics content */}
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          Performance Metrics
                        </Typography>
                        <Typography sx={{ color: '#64748b' }}>
                          Detailed analytics coming soon...
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {rightPanelType === 'settings' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                  Agent Settings - {selectedChatbot.identity.name}
                </Typography>
                
                {/* Settings content */}
                <Stack spacing={3}>
                  <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Model Configuration
                      </Typography>
                      <Typography sx={{ color: '#64748b', mb: 2 }}>
                        Current Model: {selectedChatbot.configuration?.selectedModel || 'gpt-4-turbo'}
                      </Typography>
                      <Typography sx={{ color: '#64748b' }}>
                        Configuration options coming soon...
                      </Typography>
                    </CardContent>
                  </Card>
                </Stack>
              </Box>
            )}

            {rightPanelType === 'governance' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                  Governance Controls
                </Typography>
                
                {/* Governance content */}
                <Stack spacing={3}>
                  <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Trust & Safety
                      </Typography>
                      <Typography sx={{ color: '#64748b' }}>
                        Governance controls coming soon...
                      </Typography>
                    </CardContent>
                  </Card>
                </Stack>
              </Box>
            )}
          </Box>
        </Paper>
      </Slide>
    </Box>
  );
};

export default ChatbotProfilesPageEnhanced;

