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

  // Mock metrics for analytics
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

  // Workspace mode management
  const [isWorkspaceMode, setIsWorkspaceMode] = useState(false);
  const [workspaceSelectedTab, setWorkspaceSelectedTab] = useState<string>('analytics');

  // Governance sensitivity controls
  const [governanceSensitivity, setGovernanceSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [trustThreshold, setTrustThreshold] = useState<number>(70);
  const [riskCategories, setRiskCategories] = useState<string[]>(['financial_transactions', 'data_access']);



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

    // Handle chatbot selection for command center
  const handleChatbotSelect = async (chatbot: ChatbotProfile) => {
    setSelectedChatbot(chatbot);
    setIsWorkspaceMode(true); // Enable workspace mode for command center
    setRightPanelType('analytics'); // Default to analytics panel
    setWorkspaceSelectedTab('analytics');
    
    // Initialize chat session with governance
    try {
      setChatLoading(true);
      console.log(`🚀 [Workspace] Initializing Command Center for ${chatbot.identity.name}`);
      
      // Start new chat session with governance
      const session = await chatPanelGovernanceService.startChatSession(chatbot);
      setActiveSession(session);
      setChatMessages([]);
      setMessageInput('');
      
      console.log(`✅ [Workspace] Command Center initialized:`, session.sessionId);
    } catch (error) {
      console.error(`❌ [Workspace] Failed to initialize Command Center:`, error);
      // Create a fallback session for UI testing
      const fallbackSession: ChatSession = {
        sessionId: `fallback_${Date.now()}`,
        agentId: chatbot.identity.id,
        startTime: new Date(),
        messageCount: 0,
        trustScore: 0.75,
        autonomyLevel: 'Supervised',
        governanceMetrics: {
          averageTrustScore: 0.75,
          totalMessages: 0,
          policyViolations: 0,
          riskLevel: 'Low'
        }
      };
      setActiveSession(fallbackSession);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle right panel actions
  const handleRightPanelAction = (type: RightPanelType, chatbot: ChatbotProfile) => {
    setSelectedChatbot(chatbot);
    setRightPanelType(type);
  };

  // Chat functionality - Real Universal Governance Adapter Integration
  const handleSendMessage = async () => {
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
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
        isError: true
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
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
          flex: 1,
          transition: 'flex 0.3s ease-in-out',
          overflow: 'auto',
          height: '100vh'
        }}
      >
        {isWorkspaceMode ? (
          <Box sx={{ height: '100%', width: '100%' }}>
            {/* Command Center Layout - Chat on Left, Panels on Right */}
            <Box sx={{ display: 'flex', height: '100%' }}>
              {/* Left Side - Chat Interface */}
              <Box sx={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', bgcolor: '#1e293b' }}>
                {/* Chat Header */}
              <Box sx={{ p: 3, borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Chat with Your Agent
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {selectedChatbot.identity.name}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsWorkspaceMode(false)}
                  sx={{ color: '#64748b', borderColor: '#64748b' }}
                >
                  ← Back to Agents
                </Button>
              </Box>

              {/* Chat Messages Area */}
              <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
                {chatMessages.length === 0 ? (
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
                      Hello {user?.displayName || user?.email?.split('@')[0] || 'User'}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                          {/* Text Input */}
                          <TextField
                            fullWidth
                            placeholder="Type your message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            variant="standard"
                            disabled={chatLoading}
                            InputProps={{
                              disableUnderline: true,
                              sx: {
                                color: 'white',
                                fontSize: '1rem',
                                px: 2,
                                py: 1.5,
                                '& input::placeholder': {
                                  color: '#9ca3af',
                                  opacity: 1
                                }
                              }
                            }}
                          />
                          
                          {/* Send Button */}
                          <IconButton
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim() || chatLoading}
                            sx={{
                              color: messageInput.trim() ? '#3b82f6' : '#6b7280',
                              '&:hover': { 
                                color: '#2563eb', 
                                bgcolor: 'rgba(59, 130, 246, 0.1)' 
                              },
                              mr: 1
                            }}
                          >
                            {chatLoading ? <CircularProgress size={20} /> : <Send sx={{ fontSize: 20 }} />}
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>

                    {/* Tool Suggestion Buttons */}
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
                  <Stack spacing={3}>
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
                            p: 3,
                            maxWidth: '75%',
                            bgcolor: message.role === 'user' ? '#3b82f6' : '#374151',
                            color: 'white',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="body1">
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
                        <Paper sx={{ p: 3, bgcolor: '#374151', color: 'white', borderRadius: 2 }}>
                          <Typography variant="body1">
                            {selectedChatbot.identity.name} is typing...
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </Stack>
                )}
              </Box>
              
              {/* Chat Input */}
              <Box sx={{ p: 3, borderTop: '1px solid #334155' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    variant="outlined"
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
                      px: 3
                    }}
                  >
                    {chatLoading ? <CircularProgress size={20} /> : <Send />}
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Right Side - Command Panels */}
            <Box sx={{ flex: '0 0 40%', bgcolor: '#1e293b', borderLeft: '1px solid #334155' }}>
              {/* Panel Header */}
              <Box sx={{ p: 3, borderBottom: '1px solid #334155' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#3b82f6' }}>
                    {selectedChatbot.identity.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      {selectedChatbot.identity.name} • Custom
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Live • Enterprise
                    </Typography>
                  </Box>
                </Box>
                
                {/* Command Panel Tabs */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { key: 'analytics', label: 'ANALYTICS' },
                    { key: 'customize', label: 'CUSTOMIZE' },
                    { key: 'personality', label: 'PERSONALITY' },
                    { key: 'knowledge', label: 'AI KNOWLEDGE' },
                    { key: 'tools', label: 'TOOLS' },
                    { key: 'automation', label: 'AUTOMATION' },
                    { key: 'receipts', label: 'RECEIPTS' },
                    { key: 'memory', label: 'MEMORY' },
                    { key: 'sandbox', label: 'SANDBOX' },
                    { key: 'live_agent', label: 'LIVE AGENT' },
                    { key: 'governance', label: 'GOVERNANCE' }
                  ].map((tab) => (
                    <Button
                      key={tab.key}
                      size="small"
                      variant={rightPanelType === tab.key ? 'contained' : 'outlined'}
                      onClick={() => setRightPanelType(tab.key as RightPanelType)}
                      sx={{
                        fontSize: '0.7rem',
                        px: 1.5,
                        py: 0.5,
                        minWidth: 'auto',
                        borderColor: '#374151',
                        color: rightPanelType === tab.key ? 'white' : '#94a3b8',
                        bgcolor: rightPanelType === tab.key ? '#3b82f6' : 'transparent',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          bgcolor: rightPanelType === tab.key ? '#2563eb' : '#374151' 
                        },
                      }}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Panel Content */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                {rightPanelType === 'analytics' && selectedChatbot && (
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

                {rightPanelType === 'tools' && (
                  <ToolConfigurationPanel
                    chatbot={selectedChatbot}
                    onClose={() => setRightPanelType(null)}
                    onSave={async (toolProfile: AgentToolProfile) => {
                      try {
                        console.log('Tool profile saved:', toolProfile);
                        
                        // Save the tool configuration to the backend
                        const chatbotStorageService = ChatbotStorageService.getInstance();
                        const updatedChatbot = await chatbotStorageService.updateChatbot(selectedChatbot.identity.id, {
                          toolProfile: toolProfile
                        });
                        
                        if (updatedChatbot) {
                          // Update local state
                          setChatbots(prev => prev.map(bot => 
                            bot.identity.id === selectedChatbot.identity.id ? updatedChatbot : bot
                          ));
                          setSelectedChatbot(updatedChatbot);
                          console.log('✅ Tool configuration saved successfully');
                        }
                        
                        setRightPanelType(null);
                      } catch (error) {
                        console.error('❌ Failed to save tool configuration:', error);
                      }
                    }}
                  />
                )}
                
                {rightPanelType === 'customize' && (
                  <WidgetCustomizer
                    chatbot={selectedChatbot}
                    onSave={(config) => {
                      console.log('Widget config saved:', config);
                      // Here you would save the configuration to the chatbot profile
                      // For now, we'll just log it
                    }}
                    onClose={() => setRightPanelType(null)}
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
                      } catch (error) {
                        console.error('❌ Failed to save personality settings:', error);
                      }
                    }}
                    onClose={() => setRightPanelType(null)}
                  />
                )}
                
                {rightPanelType === 'knowledge' && (
                  <SimplifiedKnowledgeViewer />
                )}
                
                {rightPanelType === 'receipts' && (
                  <AgentReceiptViewer />
                )}
                
                {rightPanelType === 'memory' && (
                  <AgentMemoryViewer />
                )}
                
                {rightPanelType === 'sandbox' && (
                  <LiveAgentSandbox />
                )}
                
                {rightPanelType === 'live_agent' && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                      Live Agent Computer
                    </Typography>
                    <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          Agent Activity Monitor
                        </Typography>
                        <Typography sx={{ color: '#64748b', mb: 3 }}>
                          Watch what your agent is doing in real-time
                        </Typography>
                        
                        {/* Computer Screen Simulation */}
                        <Box sx={{ 
                          bgcolor: '#000', 
                          border: '2px solid #334155', 
                          borderRadius: 2, 
                          p: 2, 
                          minHeight: '300px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 2
                        }}>
                          <Typography sx={{ color: '#10b981', fontFamily: 'monospace' }}>
                            🖥️ Agent Computer Screen
                          </Typography>
                          <Typography sx={{ color: '#64748b', textAlign: 'center' }}>
                            Live agent activity will appear here when the agent is working
                          </Typography>
                          <Box sx={{ 
                            bgcolor: '#1e293b', 
                            p: 2, 
                            borderRadius: 1, 
                            border: '1px solid #334155',
                            width: '100%'
                          }}>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                              $ agent_status: idle
                            </Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                              $ last_action: waiting_for_user_input
                            </Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                              $ tools_available: {Math.floor(Math.random() * 20) + 15}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}
                
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
                            <Typography variant="body1" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
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
                
                {rightPanelType === 'governance' && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                      Governance Controls
                    </Typography>
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
                  </Box>
                )}
                
                {!rightPanelType && (
                  <Box sx={{ textAlign: 'center', mt: 8 }}>
                    <Typography sx={{ color: '#64748b' }}>
                      Select a panel above to get started
                    </Typography>
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
                  </Box>
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

                        {/* Trust Threshold */}
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                          Trust Threshold: {trustThreshold}%
                        </Typography>
                        <Slider
                          value={trustThreshold}
                          onChange={(_, value) => setTrustThreshold(value as number)}
                          min={0}
                          max={100}
                          sx={{
                            color: '#3b82f6',
                            '& .MuiSlider-thumb': { bgcolor: '#3b82f6' },
                            '& .MuiSlider-track': { bgcolor: '#3b82f6' },
                            '& .MuiSlider-rail': { bgcolor: '#374151' }
                          }}
                        />

                        {/* Risk Categories */}
                        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 3, mb: 2 }}>
                          Monitor these risk categories:
                        </Typography>
                        {['financial_transactions', 'data_access', 'external_communications', 'system_changes'].map(category => (
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
                              75%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>Compliance</Typography>
                            <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                              100%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>Violations</Typography>
                            <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                              0
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>Warnings</Typography>
                            <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                              0
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </Box>
            </Box>
            </Box>
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

                          {/* Action Button - Single Command Center */}
                          <Box sx={{ mt: 'auto' }}>
                            <Button
                              variant="contained"
                              size="medium"
                              startIcon={<Rocket />}
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChatbotSelect(chatbot);
                              }}
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
          </Container>
        )}
      </Box>
    </Box>
  );
};

export default ChatbotProfilesPageEnhanced;

