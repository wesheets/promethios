import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  Badge,
  Slide,
  Paper,
  Divider,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add,
  SmartToy,
  Analytics,
  Palette,
  Psychology,
  Settings,
  Rocket,
  Chat,
  Close,
  TrendingUp,
  Security,
  Speed,
  CheckCircle,
  Warning,
  Api,
  AutoAwesome,
  Shield,
  Visibility,
  Edit,
  Deploy,
  MoreVert
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ChatbotStorageService } from '../services/ChatbotStorageService';
import { ChatbotProfile } from '../types/ChatbotTypes';
import WidgetCustomizer from '../components/chat/customizer/WidgetCustomizer';

// Right panel types
type RightPanelType = 'analytics' | 'customize' | 'knowledge' | 'automation' | 'deployment' | 'settings' | null;

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

  const openRightPanel = (chatbot: ChatbotProfile, panelType: RightPanelType) => {
    setSelectedChatbot(chatbot);
    setRightPanelType(panelType);
  };

  const closeRightPanel = () => {
    setSelectedChatbot(null);
    setRightPanelType(null);
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
                              onClick={() => window.open(`/ui/chat?agent=${chatbot.identity.id}`, '_blank')}
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
                    <Typography variant="h6" sx={{ mb: 2 }}>Analytics Dashboard</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Real-time performance metrics and analytics will be displayed here.
                    </Typography>
                  </Box>
                )}

                {rightPanelType === 'customize' && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Widget Customizer</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Live chat interface customization with colors, fonts, borders, and branding will be available here.
                    </Typography>
                  </Box>
                )}

                {rightPanelType === 'knowledge' && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Knowledge Management</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Document management, knowledge base linking, and RAG performance will be shown here.
                    </Typography>
                  </Box>
                )}

                {rightPanelType === 'automation' && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Automation & Workflows</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Workflow builder, automation rules, and human handoff settings will be configured here.
                    </Typography>
                  </Box>
                )}

                {rightPanelType === 'deployment' && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Deployment Settings</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Channel management, API endpoints, and integration status will be managed here.
                    </Typography>
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
              </Box>
            </>
          )}
        </Paper>
      </Slide>
    </Box>
  );
};

export default ChatbotProfilesPageEnhanced;

