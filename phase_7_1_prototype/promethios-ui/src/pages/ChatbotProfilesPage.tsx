import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatbotStorageService, { ChatbotProfile } from '../services/ChatbotStorageService';
import TeamPanel from '../components/team/TeamPanel';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Drawer,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  MoreVert,
  Chat,
  Assessment,
  Settings,
  Security,
  Add,
  SmartToy,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  Error,
  Launch,
  Web,
  Email,
  Phone,
  Facebook,
  Api,
  Chat as Slack,
  Microsoft,
  Group,
  History,
  Analytics,
  Close,
} from '@mui/icons-material';

const ChatbotProfilesPage: React.FC = () => {
  console.log('🔍 ChatbotProfilesPage component mounting...');
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, loading: authLoading } = useAuth();
  console.log('🔍 ChatbotProfilesPage - user from auth:', user?.uid);
  console.log('🔍 ChatbotProfilesPage - auth loading:', authLoading);
  const chatbotService = ChatbotStorageService.getInstance();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [chatbotProfiles, setChatbotProfiles] = useState<ChatbotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Right panel state
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState(0);

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
      console.log('🔍 Calling chatbotService.getChatbots with user:', user.uid);
      console.log('🔍 About to call getChatbots method...');
      const chatbots = await chatbotService.getChatbots(user.uid);
      console.log('🔍 getChatbots returned:', chatbots.length, 'chatbots');
      console.log('🔍 Chatbot data:', chatbots);
      setChatbotProfiles(chatbots);
      console.log('🔍 setChatbotProfiles called with:', chatbots.length, 'chatbots');
    } catch (error) {
      console.error('❌ Failed to load chatbots:', error);
      console.error('❌ Error details:', error);
      setChatbotProfiles([]);
    } finally {
      setLoading(false);
      console.log('🔍 Loading set to false');
    }
  }, [user?.uid, authLoading, chatbotService]);

  // Load chatbots on component mount and when user changes
  useEffect(() => {
    console.log('🔍 ChatbotProfilesPage useEffect triggered, user:', user?.uid);
    console.log('🔍 User object:', user);
    console.log('🔍 Auth loading:', authLoading);
    console.log('🔍 About to call loadChatbots...');
    loadChatbots();
  }, [user?.uid, authLoading, loadChatbots]); // Include authLoading in dependencies

  // Dynamic model display function using service
  const getModelDisplayName = (provider?: string, selectedModel?: string): string => {
    return chatbotService.getModelDisplayName(provider, selectedModel);
  };

  // Get health status styling
  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'healthy':
        return { color: '#10b981', icon: <CheckCircle />, text: 'Healthy' };
      case 'warning':
        return { color: '#f59e0b', icon: <Warning />, text: 'Warning' };
      case 'critical':
        return { color: '#ef4444', icon: <Error />, text: 'Critical' };
      default:
        return { color: '#6b7280', icon: <Error />, text: 'Unknown' };
    }
  };

  // Get deployment channel icons
  const getDeploymentChannels = (chatbot: ChatbotProfile) => {
    const channels = [];
    const deploymentStatus = chatbot.deploymentStatus;

    if (deploymentStatus?.web) channels.push({ icon: <Web />, label: 'Web' });
    if (deploymentStatus?.email) channels.push({ icon: <Email />, label: 'Email' });
    if (deploymentStatus?.phone) channels.push({ icon: <Phone />, label: 'Phone' });
    if (deploymentStatus?.slack) channels.push({ icon: <Slack />, label: 'Slack' });
    if (deploymentStatus?.teams) channels.push({ icon: <Microsoft />, label: 'Teams' });
    if (deploymentStatus?.api) channels.push({ icon: <Api />, label: 'API' });

    return channels;
  };

  // Filter chatbots based on search and filters
  const filteredChatbots = chatbotProfiles.filter(chatbot => {
    const matchesSearch = chatbot.identity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chatbot.identity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'live' && chatbot.isDeployed) ||
                         (statusFilter === 'offline' && !chatbot.isDeployed);
    
    const matchesHealth = healthFilter === 'all' || chatbot.healthStatus === healthFilter;
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  // Handle actions
  const handleTestChat = (chatbotId: string) => {
    navigate(`/ui/chat/chatbots?agent=chatbot_${chatbotId}`);
  };

  const handleViewAnalytics = (chatbotId: string) => {
    navigate(`/ui/chat/analytics?chatbot=${chatbotId}`);
  };

  const handleEditSettings = (chatbotId: string) => {
    navigate(`/ui/chat/settings?chatbot=${chatbotId}`);
  };

  const handleCreateNew = () => {
    navigate('/ui/chat/setup/quick-start');
  };

  const handleRefresh = () => {
    loadChatbots();
  };

  // Right panel handlers
  const handleOpenRightPanel = (tab: number = 0) => {
    setRightPanelTab(tab);
    setRightPanelOpen(true);
  };

  const handleCloseRightPanel = () => {
    setRightPanelOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setRightPanelTab(newValue);
  };

  // Empty state - only show when user is available and no chatbots found
  if (!loading && user?.uid && chatbotProfiles.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" py={8}>
          <SmartToy sx={{ fontSize: 64, color: '#6b7280', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            No Chatbots Yet
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
            Create your first chatbot to get started with AI-powered conversations.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleCreateNew}
            sx={{
              backgroundColor: '#3182ce',
              '&:hover': { backgroundColor: '#2c5aa0' }
            }}
          >
            Create Your First Chatbot
          </Button>
        </Box>
      </Container>
    );
  }

  // Loading state - show while waiting for user or chatbots
  if (loading || !user?.uid) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" py={8}>
          <LinearProgress sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>
            Loading your chatbots...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
            My Chatbots
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Manage and monitor your AI-powered chatbots
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Group />}
            onClick={() => handleOpenRightPanel(0)}
            sx={{ 
              color: 'white', 
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)' }
            }}
          >
            Team
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
            sx={{
              backgroundColor: '#3182ce',
              '&:hover': { backgroundColor: '#2c5aa0' }
            }}
          >
            Create New Chatbot
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search chatbots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="live">Live</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Health</InputLabel>
                <Select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  }}
                >
                  <MenuItem value="all">All Health</MenuItem>
                  <MenuItem value="healthy">Healthy</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {filteredChatbots.length} chatbot{filteredChatbots.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Box mb={4}>
          <LinearProgress sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        </Box>
      )}

      {/* Chatbot Cards */}
      <Grid container spacing={3}>
        {filteredChatbots.map((chatbot) => {
          const healthStatus = getHealthStatus(chatbot.healthStatus);
          const deploymentChannels = getDeploymentChannels(chatbot);
          const modelName = getModelDisplayName(chatbot.apiDetails?.provider, chatbot.apiDetails?.selectedModel);

          return (
            <Grid item xs={12} md={6} lg={4} key={chatbot.identity.id}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{
                          backgroundColor: chatbot.isDeployed ? '#10b981' : '#6b7280',
                          mr: 2,
                          width: 40,
                          height: 40,
                        }}
                      >
                        <SmartToy />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                          {chatbot.identity.name}
                        </Typography>
                        <Box display="flex" alignItems="center">
                          <Chip
                            size="small"
                            label={chatbot.isDeployed ? 'Live' : 'Offline'}
                            sx={{
                              backgroundColor: chatbot.isDeployed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                              color: chatbot.isDeployed ? '#10b981' : '#6b7280',
                              fontSize: '0.75rem',
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', ml: 1 }}>
                            {chatbot.businessMetrics?.conversationsToday || 0} conversations today
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      <MoreVert />
                    </IconButton>
                  </Box>

                  {/* Governance Info */}
                  <Box display="flex" alignItems="center" mb={2}>
                    <Security sx={{ color: '#10b981', mr: 1, fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Governed Agent: {modelName} • Gov ID: {chatbot.governanceId || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Performance Metrics */}
                  <Box mb={3}>
                    <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                      Today's Performance:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Typography variant="h6" sx={{ color: '#10b981' }}>
                            {chatbot.businessMetrics?.customerSatisfaction || 0}%
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            Customer Satisfaction
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Typography variant="h6" sx={{ color: '#3182ce' }}>
                            {chatbot.businessMetrics?.avgResponseTime || 0}s
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            Avg Response Time
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Deployment Channels */}
                  <Box mb={3}>
                    <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                      Deployed Channels:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {deploymentChannels.length > 0 ? (
                        deploymentChannels.map((channel, index) => (
                          <Chip
                            key={index}
                            icon={channel.icon}
                            label={channel.label}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(49, 130, 206, 0.2)',
                              color: '#3182ce',
                              fontSize: '0.75rem',
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          No active deployments
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Chat />}
                      onClick={() => handleTestChat(chatbot.identity.id)}
                      sx={{
                        backgroundColor: '#3182ce',
                        '&:hover': { backgroundColor: '#2c5aa0' },
                        fontSize: '0.75rem',
                      }}
                    >
                      Command Center
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Assessment />}
                      onClick={() => handleViewAnalytics(chatbot.identity.id)}
                      sx={{
                        color: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        fontSize: '0.75rem',
                      }}
                    >
                      Analytics
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Settings />}
                      onClick={() => handleEditSettings(chatbot.identity.id)}
                      sx={{
                        color: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        fontSize: '0.75rem',
                      }}
                    >
                      Settings
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Right Panel Drawer */}
      <Drawer
        anchor="right"
        open={rightPanelOpen}
        onClose={handleCloseRightPanel}
        PaperProps={{
          sx: {
            width: 400,
            backgroundColor: '#1e293b',
            color: 'white',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Collaboration Hub
            </Typography>
            <IconButton
              onClick={handleCloseRightPanel}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Tabs
              value={rightPanelTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#3182ce',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#3182ce',
                },
              }}
            >
              <Tab 
                icon={<Group />} 
                label="Team" 
                sx={{ minHeight: 48 }}
              />
              <Tab 
                icon={<History />} 
                label="History" 
                sx={{ minHeight: 48 }}
              />
              <Tab 
                icon={<Analytics />} 
                label="Analytics" 
                sx={{ minHeight: 48 }}
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {rightPanelTab === 0 && (
              <TeamPanel currentUserId={user?.uid} />
            )}
            {rightPanelTab === 1 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Chat history will be implemented here.
                </Typography>
              </Box>
            )}
            {rightPanelTab === 2 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Analytics dashboard will be implemented here.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    </Container>
  );
};

export default ChatbotProfilesPage;

