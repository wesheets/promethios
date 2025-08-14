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
  Deploy,
  Send,
  Api,
  SmartToy,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ChatbotStorageService } from '../services/ChatbotStorageService';
import { ChatbotProfile } from '../types/ChatbotTypes';
import WidgetCustomizer from '../components/chat/customizer/WidgetCustomizer';
import { WidgetCustomizerProvider, useWidgetCustomizer } from '../context/WidgetCustomizerContext';
import { chatPanelGovernanceService, ChatSession, ChatMessage, ChatResponse } from '../services/ChatPanelGovernanceService';
import ToolConfigurationPanel from '../components/tools/ToolConfigurationPanel';
import { AgentToolProfile } from '../types/ToolTypes';

// Right panel types
type RightPanelType = 'analytics' | 'customize' | 'knowledge' | 'automation' | 'deployment' | 'settings' | 'chat' | 'tools' | null;

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
    
    // If opening chat panel, initialize chat session
    if (panelType === 'chat') {
      try {
        setChatLoading(true);
        console.log(`💬 [ChatPanel] Initializing chat session for ${chatbot.identity.name}`);
        
        // Start new chat session
        const session = await chatPanelGovernanceService.startChatSession(chatbot, user?.uid || 'anonymous');
        setActiveSession(session);
        setChatMessages(session.messages);
        setMessageInput('');
        
        console.log(`✅ [ChatPanel] Chat session initialized:`, session.sessionId);
      } catch (error) {
        console.error(`❌ [ChatPanel] Failed to initialize chat session:`, error);
      } finally {
        setChatLoading(false);
      }
    }
  };

  const closeRightPanel = async () => {
    // Clean up chat session if active
    if (activeSession && rightPanelType === 'chat') {
      try {
        await chatPanelGovernanceService.endChatSession(activeSession.sessionId);
        setActiveSession(null);
        setChatMessages([]);
        setMessageInput('');
        console.log(`✅ [ChatPanel] Chat session ended successfully`);
      } catch (error) {
        console.error(`❌ [ChatPanel] Failed to end chat session:`, error);
      }
    }
    
    setSelectedChatbot(null);
    setRightPanelType(null);
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
      
      // Update messages with the response
      setChatMessages(prev => [...prev, response.message]);
      setMessageInput('');
      
      console.log(`✅ [ChatPanel] Message sent and response received`);
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to send message:`, error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        governanceStatus: 'flagged'
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

  const resetChat = async () => {
    if (!selectedChatbot) return;
    
    try {
      // End current session
      if (activeSession) {
        await chatPanelGovernanceService.endChatSession(activeSession.sessionId);
      }
      
      // Start new session
      const newSession = await chatPanelGovernanceService.startChatSession(selectedChatbot, user?.uid || 'anonymous');
      setActiveSession(newSession);
      setChatMessages(newSession.messages);
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
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#0f172a' }}>
      {/* Main Content Area */}
      <Box 
        sx={{ 
          flex: rightPanelType ? '0 0 60%' : 1,
          transition: 'flex 0.3s ease-in-out',
          overflow: 'auto'
        }}
      >
        <Container sx={{ py: 4 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
                My Chatbots ({filteredChatbots.length})
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', mt: 1 }}>
                Manage and monitor your AI-powered chatbots
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateNew}
              sx={{
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' },
                borderRadius: 2,
                px: 3,
                py: 1.5,
              }}
            >
              Create New Chatbot
            </Button>
          </Box>

          {/* Filter Tabs */}
          <Box sx={{ mb: 4 }}>
            <Tabs 
              value={filterTab} 
              onChange={(e, newValue) => setFilterTab(newValue)}
              sx={{
                '& .MuiTab-root': { 
                  color: '#64748b',
                  '&.Mui-selected': { color: '#3b82f6' }
                },
                '& .MuiTabs-indicator': { bgcolor: '#3b82f6' }
              }}
            >
              <Tab label={`All (${chatbotProfiles.length})`} />
              <Tab label={`Hosted API (${chatbotProfiles.filter(c => getGovernanceType(c) === 'Hosted API').length})`} />
              <Tab label={`BYOK (${chatbotProfiles.filter(c => getGovernanceType(c) === 'BYOK').length})`} />
              <Tab label={`Enterprise (${chatbotProfiles.filter(c => getGovernanceType(c) === 'Enterprise').length})`} />
            </Tabs>
          </Box>

          {/* Chatbot Scorecards Grid */}
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

                      {/* Action Buttons */}
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Analytics />}
                            fullWidth
                            onClick={() => openRightPanel(chatbot, 'analytics')}
                            sx={{
                              borderColor: '#374151',
                              color: '#94a3b8',
                              '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' },
                              fontSize: '0.75rem',
                            }}
                          >
                            Analytics
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Palette />}
                            fullWidth
                            onClick={() => openRightPanel(chatbot, 'customize')}
                            sx={{
                              borderColor: '#374151',
                              color: '#94a3b8',
                              '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' },
                              fontSize: '0.75rem',
                            }}
                          >
                            Customize
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Psychology />}
                            fullWidth
                            onClick={() => openRightPanel(chatbot, 'knowledge')}
                            sx={{
                              borderColor: '#374151',
                              color: '#94a3b8',
                              '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' },
                              fontSize: '0.75rem',
                            }}
                          >
                            Knowledge
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Settings />}
                            fullWidth
                            onClick={() => openRightPanel(chatbot, 'tools')}
                            sx={{
                              borderColor: '#374151',
                              color: '#94a3b8',
                              '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' },
                              fontSize: '0.75rem',
                            }}
                          >
                            Tools
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Settings />}
                            fullWidth
                            onClick={() => openRightPanel(chatbot, 'automation')}
                            sx={{
                              borderColor: '#374151',
                              color: '#94a3b8',
                              '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' },
                              fontSize: '0.75rem',
                            }}
                          >
                            Automation
                          </Button>
                        </Grid>
                      </Grid>

                      {/* Primary Actions */}
                      <Box mt={2}>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Chat />}
                              fullWidth
                              onClick={() => openRightPanel(chatbot, 'chat')}
                              sx={{
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                fontWeight: 600,
                              }}
                            >
                              Chat
                            </Button>
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Rocket />}
                              fullWidth
                              onClick={() => openRightPanel(chatbot, 'deployment')}
                              sx={{
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' },
                                fontWeight: 600,
                              }}
                            >
                              Deploy
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
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
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {selectedChatbot && (
            <>
              {/* Panel Header */}
              <Box
                sx={{
                  p: 3,
                  borderBottom: '1px solid #334155',
                  bgcolor: '#0f172a',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                <Box display="flex" justifyContent="between" alignItems="center">
                  <Box flex={1}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      🤖 {selectedChatbot.identity.name} • {getModelProvider(selectedChatbot.configuration?.selectedModel || '')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {getMockMetrics(selectedChatbot).healthScore}% Health • {selectedChatbot.isDeployed ? 'Live' : 'Offline'} • {getGovernanceType(selectedChatbot)}
                    </Typography>
                  </Box>
                  <IconButton onClick={closeRightPanel} sx={{ color: '#64748b' }}>
                    <Close />
                  </IconButton>
                </Box>
              </Box>

              {/* Panel Content */}
              <Box sx={{ p: 3 }}>
                {rightPanelType === 'analytics' && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                      Analytics Dashboard
                    </Typography>
                    
                    {/* Key Metrics */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                              Response Time
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                              {getMockMetrics(selectedChatbot).responseTime.toFixed(1)}s
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                              Satisfaction
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
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
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                      Live Chat Interface
                    </Typography>
                    
                    {chatLoading && !activeSession ? (
                      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                        <CircularProgress sx={{ color: '#3b82f6' }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8', ml: 2 }}>
                          Initializing chat session...
                        </Typography>
                      </Box>
                    ) : (
                      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', height: 'calc(100vh - 200px)' }}>
                        <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          {/* Chat Header */}
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: '#0f172a',
                              borderBottom: '1px solid #334155',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                                🤖
                              </Avatar>
                              <Box>
                                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                                  {selectedChatbot.identity.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#10b981' }}>
                                  ● Online {activeSession && `• Session: ${activeSession.sessionId.slice(-8)}`}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Session Info */}
                            {activeSession && (
                              <Box textAlign="right">
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  Trust: {activeSession.trustLevel} • Autonomy: {activeSession.autonomyLevel}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                  Messages: {activeSession.governanceMetrics.totalMessages}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Chat Messages Area */}
                          <Box
                            sx={{
                              flex: 1,
                              p: 2,
                              overflowY: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2
                            }}
                          >
                            {chatMessages.map((message) => (
                              <Box
                                key={message.id}
                                display="flex"
                                alignItems="flex-start"
                                gap={2}
                                justifyContent={message.type === 'user' ? 'flex-end' : 'flex-start'}
                              >
                                {message.type !== 'user' && (
                                  <Avatar sx={{ bgcolor: message.type === 'system' ? '#ef4444' : '#3b82f6', width: 28, height: 28 }}>
                                    {message.type === 'system' ? '⚠️' : '🤖'}
                                  </Avatar>
                                )}
                                
                                <Box
                                  sx={{
                                    bgcolor: message.type === 'user' ? '#3b82f6' : 
                                            message.type === 'system' ? '#ef4444' : '#374151',
                                    color: 'white',
                                    p: 2,
                                    borderRadius: message.type === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                    maxWidth: '80%',
                                    position: 'relative'
                                  }}
                                >
                                  <Typography variant="body2">
                                    {message.text}
                                  </Typography>
                                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                    <Typography variant="caption" sx={{ 
                                      color: message.type === 'user' ? '#bfdbfe' : '#94a3b8'
                                    }}>
                                      {message.timestamp.toLocaleTimeString()}
                                    </Typography>
                                    {message.trustScore && (
                                      <Chip
                                        label={`Trust: ${(message.trustScore * 100).toFixed(0)}%`}
                                        size="small"
                                        sx={{
                                          bgcolor: message.trustScore > 0.8 ? '#10b981' : 
                                                  message.trustScore > 0.6 ? '#f59e0b' : '#ef4444',
                                          color: 'white',
                                          fontSize: '0.65rem',
                                          height: '16px'
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                                
                                {message.type === 'user' && (
                                  <Avatar sx={{ bgcolor: '#64748b', width: 28, height: 28 }}>
                                    👤
                                  </Avatar>
                                )}
                              </Box>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                              <Box display="flex" alignItems="flex-start" gap={2}>
                                <Avatar sx={{ bgcolor: '#3b82f6', width: 28, height: 28 }}>
                                  🤖
                                </Avatar>
                                <Box
                                  sx={{
                                    bgcolor: '#374151',
                                    color: '#94a3b8',
                                    p: 2,
                                    borderRadius: '12px 12px 12px 4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}
                                >
                                  <Typography variant="body2">
                                    Thinking...
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Box
                                      sx={{
                                        width: 4,
                                        height: 4,
                                        bgcolor: '#94a3b8',
                                        borderRadius: '50%',
                                        animation: 'pulse 1.5s ease-in-out infinite'
                                      }}
                                    />
                                    <Box
                                      sx={{
                                        width: 4,
                                        height: 4,
                                        bgcolor: '#94a3b8',
                                        borderRadius: '50%',
                                        animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                                      }}
                                    />
                                    <Box
                                      sx={{
                                        width: 4,
                                        height: 4,
                                        bgcolor: '#94a3b8',
                                        borderRadius: '50%',
                                        animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                                      }}
                                    />
                                  </Box>
                                </Box>
                              </Box>
                            )}
                          </Box>

                          {/* Chat Input Area */}
                          <Box
                            sx={{
                              p: 2,
                              borderTop: '1px solid #334155',
                              bgcolor: '#0f172a'
                            }}
                          >
                            <Box display="flex" gap={1} alignItems="flex-end">
                              <Box
                                component="input"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                disabled={chatLoading}
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
                              <Button
                                variant="contained"
                                size="small"
                                onClick={sendMessage}
                                disabled={chatLoading || !messageInput.trim()}
                                startIcon={chatLoading ? <CircularProgress size={16} /> : <Send />}
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
                            
                            {/* Chat Actions */}
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {activeSession ? 
                                  `Live chat with governance • Trust: ${activeSession.trustLevel}` :
                                  'This is a live preview of your chatbot interface'
                                }
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => openRightPanel(selectedChatbot, 'customize')}
                                  sx={{
                                    borderColor: '#374151',
                                    color: '#94a3b8',
                                    fontSize: '0.75rem',
                                    '&:hover': { borderColor: '#4b5563' }
                                  }}
                                >
                                  Customize
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={resetChat}
                                  disabled={chatLoading}
                                  sx={{
                                    borderColor: '#374151',
                                    color: '#94a3b8',
                                    fontSize: '0.75rem',
                                    '&:hover': { borderColor: '#4b5563' }
                                  }}
                                >
                                  Reset
                                </Button>
                              </Stack>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
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

