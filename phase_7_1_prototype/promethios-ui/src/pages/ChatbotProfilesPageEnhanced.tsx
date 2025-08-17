import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Slide,
  Paper,
  Divider,
  LinearProgress,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search,
  Add,
  FilterList,
  Sort,
  MoreVert,
  Chat,
  Settings,
  Visibility,
  Close,
  Send,
  TrendingUp,
  Security,
  Speed,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  Download,
  Upload,
  Share,
  Delete,
  Edit,
  PlayArrow,
  Pause,
  Stop
} from '@mui/icons-material';

// Import types and services
import { ChatbotProfile } from '../types/ChatbotTypes';
import { UniversalGovernanceAdapter } from '../services/UniversalGovernanceAdapter';

// Mock data for demonstration
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

interface ChatbotProfilesPageEnhancedProps {
  // Add any props if needed
}

const ChatbotProfilesPageEnhanced: React.FC<ChatbotProfilesPageEnhancedProps> = () => {
  // State management
  const [chatbots, setChatbots] = useState<ChatbotProfile[]>(mockChatbots);
  const [filteredChatbots, setFilteredChatbots] = useState<ChatbotProfile[]>(mockChatbots);
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rightPanelType, setRightPanelType] = useState<'chat' | 'configuration' | 'monitoring' | null>(null);
  const [isWorkspaceMode, setIsWorkspaceMode] = useState(false);

  // Mock metrics function
  const getMockMetrics = (chatbot: ChatbotProfile) => ({
    trustScore: Math.floor(Math.random() * 20) + 80,
    responseTime: Math.floor(Math.random() * 200) + 100,
    totalInteractions: Math.floor(Math.random() * 1000) + 500,
    successRate: Math.floor(Math.random() * 15) + 85,
    healthScore: Math.floor(Math.random() * 20) + 80
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

  // Handle chatbot selection
  const handleChatbotSelect = (chatbot: ChatbotProfile) => {
    setSelectedChatbot(chatbot);
    setRightPanelType('chat');
  };

  // Filter chatbots based on search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredChatbots(chatbots);
    } else {
      const filtered = chatbots.filter(chatbot =>
        chatbot.identity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chatbot.identity.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chatbot.identity.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChatbots(filtered);
    }
  }, [searchQuery, chatbots]);

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
            {/* Workspace mode content will go here */}
            <Container sx={{ py: 4 }}>
              <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
                Workspace Mode
              </Typography>
              <Typography sx={{ color: '#64748b' }}>
                Workspace functionality coming soon...
              </Typography>
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

            {/* Search and Filters */}
            <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
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
            </Box>

            {/* Chatbot Grid */}
            <Box sx={{ height: '100%', overflow: 'auto' }}>
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
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                            borderColor: '#3b82f6'
                          }
                        }}
                        onClick={() => handleChatbotSelect(chatbot)}
                      >
                        <CardContent sx={{ p: 3 }}>
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
                              overflow: 'hidden'
                            }}
                          >
                            {chatbot.identity.description}
                          </Typography>

                          {/* Metrics Grid */}
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700 }}>
                                  {metrics.trustScore}%
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  Trust Score
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                                  {metrics.responseTime}ms
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  Avg Response
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 700 }}>
                                  {metrics.totalInteractions}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  Interactions
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 700 }}>
                                  {metrics.successRate}%
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  Success Rate
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
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Chat />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChatbotSelect(chatbot);
                              }}
                              sx={{
                                flex: 1,
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                borderRadius: '8px'
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
                                setRightPanelType('configuration');
                                setSelectedChatbot(chatbot);
                              }}
                              sx={{
                                borderColor: '#64748b',
                                color: '#64748b',
                                '&:hover': {
                                  borderColor: '#3b82f6',
                                  color: '#3b82f6',
                                  bgcolor: 'rgba(59, 130, 246, 0.1)'
                                },
                                borderRadius: '8px'
                              }}
                            >
                              Config
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
              {rightPanelType === 'configuration' && 'Agent Configuration'}
              {rightPanelType === 'monitoring' && 'Live Monitoring'}
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
                  <Typography sx={{ color: '#64748b', textAlign: 'center', mt: 4 }}>
                    Chat interface with {selectedChatbot.identity.name}
                  </Typography>
                </Box>
                
                {/* Chat Input */}
                <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Type your message..."
                      variant="outlined"
                      size="small"
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
                      sx={{
                        bgcolor: '#3b82f6',
                        '&:hover': { bgcolor: '#2563eb' },
                        minWidth: 'auto',
                        px: 2
                      }}
                    >
                      <Send sx={{ fontSize: 18 }} />
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {rightPanelType === 'configuration' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Configuration for {selectedChatbot.identity.name}
                </Typography>
                <Typography sx={{ color: '#64748b' }}>
                  Configuration panel coming soon...
                </Typography>
              </Box>
            )}

            {rightPanelType === 'monitoring' && selectedChatbot && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Live Monitoring - {selectedChatbot.identity.name}
                </Typography>
                
                {/* Status Indicator */}
                <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155', mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: '#10b981',
                          animation: 'pulse 2s infinite'
                        }}
                      />
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                        Agent Status: Online
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                      Last Activity: {new Date().toLocaleTimeString()}
                    </Typography>
                    
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Response Time: 245ms | Memory Usage: 12.4MB
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Paper>
      </Slide>
    </Box>
  );
};

export default ChatbotProfilesPageEnhanced;

