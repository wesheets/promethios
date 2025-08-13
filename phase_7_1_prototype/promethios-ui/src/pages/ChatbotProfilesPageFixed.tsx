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
  Alert
} from '@mui/material';
import { Add, SmartToy } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ChatbotStorageService } from '../services/ChatbotStorageService';
import { ChatbotProfile } from '../types/ChatbotTypes';

const ChatbotProfilesPageFixed: React.FC = () => {
  console.log('🔍 ChatbotProfilesPageFixed component mounting...');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, loading: authLoading } = useAuth();
  console.log('🔍 ChatbotProfilesPageFixed - user from auth:', user?.uid);
  console.log('🔍 ChatbotProfilesPageFixed - auth loading:', authLoading);
  
  const chatbotService = ChatbotStorageService.getInstance();
  
  // State management
  const [chatbotProfiles, setChatbotProfiles] = useState<ChatbotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    console.log('🔍 ChatbotProfilesPageFixed useEffect triggered, user:', user?.uid);
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

  // Show chatbots
  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          My Chatbots ({chatbotProfiles.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateNew}
        >
          Create New Chatbot
        </Button>
      </Box>

      <Grid container spacing={3}>
        {chatbotProfiles.map((chatbot) => (
          <Grid item xs={12} sm={6} md={4} key={chatbot.identity.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {chatbot.identity.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {chatbot.identity.description}
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <Chip 
                    label={chatbot.isDeployed ? 'Live' : 'Offline'} 
                    color={chatbot.isDeployed ? 'success' : 'default'}
                    size="small"
                  />
                  <Chip 
                    label={chatbot.healthStatus || 'Unknown'} 
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Model: {chatbot.configuration?.selectedModel || 'Unknown'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ChatbotProfilesPageFixed;

