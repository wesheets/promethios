import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';
import { useAuth } from '../context/AuthContext';
import { useDemoAuth } from '../hooks/useDemoAuth';

// Extend AgentProfile for chatbot-specific data
interface ChatbotProfile {
  identity: {
    id: string;
    name: string;
    version: string;
    description: string;
    ownerId: string;
    creationDate: Date;
    lastModifiedDate: Date;
    status: string;
  };
  // Core agent data
  apiDetails?: {
    endpoint: string;
    key: string;
    provider: string;
    selectedModel?: string;
    selectedCapabilities?: string[];
  };
  governanceId?: string;
  isDeployed: boolean;
  healthStatus: 'healthy' | 'warning' | 'critical';
  trustLevel: 'high' | 'medium' | 'low';
  
  // Chatbot-specific data
  chatbotConfig?: {
    personality?: string;
    responseStyle?: string;
    brandSettings?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      companyName?: string;
    };
    deploymentChannels?: string[];
    knowledgeBases?: string[];
  };
  
  // Business metrics
  metrics?: {
    conversationsToday: number;
    customerSatisfaction: number; // CSAT score 0-100
    avgResponseTime: number; // in seconds
    resolutionRate: number; // percentage 0-100
    totalConversations: number;
  };
  
  // Deployment status
  deploymentStatus?: {
    web?: boolean;
    email?: boolean;
    phone?: boolean;
    slack?: boolean;
    teams?: boolean;
    api?: boolean;
  };
}

const ChatbotProfilesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [chatbotProfiles, setChatbotProfiles] = useState<ChatbotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [testChatOpen, setTestChatOpen] = useState(false);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null);

  const { currentUser } = useAuth();
  const { currentUser: demoUser } = useDemoAuth();
  const effectiveUser = currentUser || demoUser;

  // Dynamic model display function
  const getModelDisplayName = (provider?: string, selectedModel?: string): string => {
    if (!provider) return 'Unknown Model';
    
    if (provider === 'OpenAI') {
      if (selectedModel?.includes('gpt-4')) return 'GPT-4';
      if (selectedModel?.includes('gpt-3.5')) return 'GPT-3.5';
      return 'OpenAI Model';
    }
    
    if (provider === 'Anthropic') {
      if (selectedModel?.includes('claude-3')) return 'Claude-3';
      if (selectedModel?.includes('claude-2')) return 'Claude-2';
      return 'Claude';
    }
    
    if (provider === 'Google') {
      if (selectedModel?.includes('gemini-pro')) return 'Gemini Pro';
      if (selectedModel?.includes('gemini')) return 'Gemini';
      return 'Google Model';
    }
    
    // Fallback for any provider/model combination
    return selectedModel || provider || 'Custom Model';
  };

  // Get deployment channel icons
  const getDeploymentChannels = (deploymentStatus?: ChatbotProfile['deploymentStatus']) => {
    const channels = [];
    if (deploymentStatus?.web) channels.push({ icon: <Web />, name: 'Web' });
    if (deploymentStatus?.email) channels.push({ icon: <Email />, name: 'Email' });
    if (deploymentStatus?.phone) channels.push({ icon: <Phone />, name: 'Phone' });
    if (deploymentStatus?.slack) channels.push({ icon: <Facebook />, name: 'Slack' });
    if (deploymentStatus?.api) channels.push({ icon: <Api />, name: 'API' });
    return channels;
  };

  // Get status color and icon
  const getStatusDisplay = (healthStatus: string, isDeployed: boolean) => {
    if (!isDeployed) {
      return { color: '#6b7280', icon: <Error />, text: 'Offline' };
    }
    
    switch (healthStatus) {
      case 'healthy':
        return { color: '#10b981', icon: <CheckCircle />, text: 'Live' };
      case 'warning':
        return { color: '#f59e0b', icon: <Warning />, text: 'Warning' };
      case 'critical':
        return { color: '#ef4444', icon: <Error />, text: 'Critical' };
      default:
        return { color: '#6b7280', icon: <Error />, text: 'Unknown' };
    }
  };

  // Load chatbot profiles (for now, we'll use mock data)
  useEffect(() => {
    const loadChatbotProfiles = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call to get chatbot profiles
        // For now, using mock data to demonstrate the UI
        const mockChatbots: ChatbotProfile[] = [
          {
            identity: {
              id: 'chatbot-1',
              name: 'Customer Support Bot',
              version: '1.0.0',
              description: 'Handles customer inquiries and support tickets',
              ownerId: effectiveUser?.uid || 'demo-user',
              creationDate: new Date('2024-01-15'),
              lastModifiedDate: new Date('2024-01-20'),
              status: 'active'
            },
            apiDetails: {
              endpoint: 'https://api.openai.com/v1/chat/completions',
              key: 'sk-***',
              provider: 'OpenAI',
              selectedModel: 'gpt-4'
            },
            governanceId: 'G-2024-001',
            isDeployed: true,
            healthStatus: 'healthy',
            trustLevel: 'high',
            metrics: {
              conversationsToday: 1247,
              customerSatisfaction: 94,
              avgResponseTime: 2.3,
              resolutionRate: 87,
              totalConversations: 15420
            },
            deploymentStatus: {
              web: true,
              email: true,
              slack: true,
              api: false,
              phone: false,
              teams: false
            }
          },
          {
            identity: {
              id: 'chatbot-2',
              name: 'Sales Assistant',
              version: '1.2.0',
              description: 'Helps with product inquiries and lead qualification',
              ownerId: effectiveUser?.uid || 'demo-user',
              creationDate: new Date('2024-01-10'),
              lastModifiedDate: new Date('2024-01-18'),
              status: 'active'
            },
            apiDetails: {
              endpoint: 'https://api.anthropic.com/v1/messages',
              key: 'sk-***',
              provider: 'Anthropic',
              selectedModel: 'claude-3-opus'
            },
            governanceId: 'G-2024-002',
            isDeployed: true,
            healthStatus: 'healthy',
            trustLevel: 'high',
            metrics: {
              conversationsToday: 892,
              customerSatisfaction: 91,
              avgResponseTime: 1.8,
              resolutionRate: 76,
              totalConversations: 8934
            },
            deploymentStatus: {
              web: true,
              email: false,
              slack: false,
              api: true,
              phone: false,
              teams: true
            }
          }
        ];
        
        setChatbotProfiles(mockChatbots);
      } catch (error) {
        console.error('Failed to load chatbot profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (effectiveUser) {
      loadChatbotProfiles();
    }
  }, [effectiveUser]);

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

  const handleTestChat = (chatbotId: string) => {
    setSelectedChatbotId(chatbotId);
    setTestChatOpen(true);
  };

  const handleViewAnalytics = (chatbotId: string) => {
    navigate(`/ui/chat/analytics/chatbot/${chatbotId}`);
  };

  const handleEditSettings = (chatbotId: string) => {
    navigate(`/ui/chat/chatbots/${chatbotId}/settings`);
  };

  const handleCreateChatbot = () => {
    navigate('/ui/chat/setup/quick-start');
  };

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <LinearProgress sx={{ width: '300px' }} />
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white' }}>
              My Chatbots
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Manage and monitor your AI chatbots with enterprise governance
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateChatbot}
            sx={{
              backgroundColor: '#3182ce',
              color: 'white',
              '&:hover': { backgroundColor: '#2c5aa0' },
              px: 3,
              py: 1.5,
            }}
          >
            Create New Chatbot
          </Button>
        </Box>

        {/* Filters */}
        <Box display="flex" gap={2} mb={4} flexWrap="wrap">
          <TextField
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
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' },
              },
            }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="live">Live</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Health</InputLabel>
            <Select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
              }}
            >
              <MenuItem value="all">All Health</MenuItem>
              <MenuItem value="healthy">Healthy</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>

          <IconButton
            onClick={() => window.location.reload()}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            <Refresh />
          </IconButton>
        </Box>

        {/* Chatbot Cards */}
        {filteredChatbots.length === 0 ? (
          <Box textAlign="center" py={8}>
            <SmartToy sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
              {searchTerm || statusFilter !== 'all' || healthFilter !== 'all' 
                ? 'No chatbots match your filters' 
                : 'No chatbots created yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 3 }}>
              {searchTerm || statusFilter !== 'all' || healthFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first AI chatbot to get started'}
            </Typography>
            {(!searchTerm && statusFilter === 'all' && healthFilter === 'all') && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateChatbot}
                sx={{
                  backgroundColor: '#3182ce',
                  color: 'white',
                  '&:hover': { backgroundColor: '#2c5aa0' },
                }}
              >
                Create Your First Chatbot
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredChatbots.map((chatbot) => {
              const statusDisplay = getStatusDisplay(chatbot.healthStatus, chatbot.isDeployed);
              const deploymentChannels = getDeploymentChannels(chatbot.deploymentStatus);
              const modelDisplayName = getModelDisplayName(chatbot.apiDetails?.provider, chatbot.apiDetails?.selectedModel);

              return (
                <Grid item xs={12} md={6} lg={4} key={chatbot.identity.id}>
                  <Card
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Box display="flex" justifyContent="between" alignItems="flex-start" mb={2}>
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <SmartToy sx={{ color: '#3182ce', mr: 1 }} />
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                              {chatbot.identity.name}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            {statusDisplay.icon}
                            <Typography 
                              variant="body2" 
                              sx={{ color: statusDisplay.color, fontWeight: 500 }}
                            >
                              {statusDisplay.text}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              • {chatbot.metrics?.conversationsToday || 0} conversations today
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          <MoreVert />
                        </IconButton>
                      </Box>

                      {/* Governance Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Security sx={{ color: '#10b981', mr: 1, fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Governed Agent: {modelDisplayName} • Gov ID: {chatbot.governanceId}
                        </Typography>
                      </Box>

                      {/* Performance Metrics */}
                      <Box mb={3}>
                        <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                          📊 Today's Performance:
                        </Typography>
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Customer Satisfaction
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                              {chatbot.metrics?.customerSatisfaction || 0}%
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Avg Response Time
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#3182ce', fontWeight: 600 }}>
                              {chatbot.metrics?.avgResponseTime || 0}s
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Issues Resolved
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                              {chatbot.metrics?.resolutionRate || 0}%
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* Deployment Channels */}
                      <Box mb={3}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                          🚀 Deployed:
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {deploymentChannels.map((channel, index) => (
                            <Chip
                              key={index}
                              icon={channel.icon}
                              label={channel.name}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(49, 130, 206, 0.2)',
                                color: '#3182ce',
                                border: '1px solid rgba(49, 130, 206, 0.3)',
                              }}
                            />
                          ))}
                          {deploymentChannels.length === 0 && (
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              Not deployed
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Action Buttons */}
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Chat />}
                          onClick={() => handleTestChat(chatbot.identity.id)}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            '&:hover': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                        >
                          Test Chat
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Assessment />}
                          onClick={() => handleViewAnalytics(chatbot.identity.id)}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            '&:hover': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                        >
                          Analytics
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Settings />}
                          onClick={() => handleEditSettings(chatbot.identity.id)}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            '&:hover': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                        >
                          Settings
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Test Chat Dialog */}
        <Dialog
          open={testChatOpen}
          onClose={() => setTestChatOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1a202c',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Chat sx={{ mr: 1 }} />
              Test Chatbot
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                height: 400,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 1,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Chat interface will be implemented here
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTestChatOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
};

export default ChatbotProfilesPage;

