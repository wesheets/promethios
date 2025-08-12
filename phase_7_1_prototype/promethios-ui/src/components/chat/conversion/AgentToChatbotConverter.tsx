/**
 * Agent to Chatbot Converter Component
 * 
 * Allows users to convert existing wrapped agents into chatbots
 * with chatbot-specific configuration.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import ChatbotStorageService from '../../../services/ChatbotStorageService';
import { UserAgentStorageService, AgentProfile } from '../../../services/UserAgentStorageService';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  SmartToy as ChatbotIcon,
  Security as GovernanceIcon,
  CheckCircle as CheckIcon,
  Transform as ConvertIcon,
} from '@mui/icons-material';

interface ChatbotConfigData {
  name: string;
  personality: string;
  useCase: string;
  deploymentChannels: string[];
}

const AgentToChatbotConverter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const chatbotService = ChatbotStorageService.getInstance();
  const agentService = UserAgentStorageService.getInstance();

  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [availableAgents, setAvailableAgents] = useState<AgentProfile[]>([]);
  const [showConverter, setShowConverter] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [configData, setConfigData] = useState<ChatbotConfigData>({
    name: '',
    personality: 'professional',
    useCase: 'customer_support',
    deploymentChannels: ['web'],
  });

  // Check if we're coming from agent wrapping with a specific agent
  const sourceAgentId = searchParams.get('agentId');
  const source = searchParams.get('source');

  const personalities = [
    { value: 'professional', label: 'Professional', description: 'Business-focused and formal' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and informal' },
    { value: 'helpful', label: 'Helpful', description: 'Solution-oriented and supportive' },
  ];

  const useCases = [
    { value: 'customer_support', label: 'Customer Support', description: 'Handle inquiries and resolve issues' },
    { value: 'sales', label: 'Sales Assistant', description: 'Qualify leads and provide product info' },
    { value: 'general', label: 'General Assistant', description: 'Multi-purpose conversational AI' },
    { value: 'technical', label: 'Technical Support', description: 'Help with technical questions' },
  ];

  const deploymentChannels = [
    { value: 'web', label: 'Web Widget', description: 'Embed on your website' },
    { value: 'email', label: 'Email Support', description: 'Handle email inquiries' },
    { value: 'api', label: 'API Endpoints', description: 'Integrate via REST API' },
    { value: 'slack', label: 'Slack Bot', description: 'Deploy to Slack workspace' },
  ];

  useEffect(() => {
    loadAvailableAgents();
  }, [user]);

  useEffect(() => {
    if (sourceAgentId && availableAgents.length > 0) {
      const agent = availableAgents.find(a => a.identity.id === sourceAgentId);
      if (agent) {
        setSelectedAgent(agent);
        setConfigData(prev => ({ ...prev, name: `${agent.identity.name} Chatbot` }));
        setShowConverter(true);
      }
    }
  }, [sourceAgentId, availableAgents]);

  const loadAvailableAgents = async () => {
    if (!user?.uid) return;

    try {
      const agents = await agentService.getAgentProfiles(user.uid);
      // Filter to only wrapped agents that aren't already chatbots
      const wrappedAgents = agents.filter(agent => 
        agent.isWrapped && 
        agent.healthStatus === 'healthy'
      );
      setAvailableAgents(wrappedAgents);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const handleAgentSelect = (agent: AgentProfile) => {
    setSelectedAgent(agent);
    setConfigData(prev => ({ ...prev, name: `${agent.identity.name} Chatbot` }));
    setShowConverter(true);
  };

  const handleConvertToChatbot = async () => {
    if (!selectedAgent || !user?.uid) return;

    setIsConverting(true);

    try {
      // Convert agent to chatbot
      const chatbot = await chatbotService.createChatbotFromAgent(
        selectedAgent,
        {
          personality: configData.personality as any,
          useCase: configData.useCase as any,
          brandSettings: {
            name: configData.name,
          },
          deploymentChannels: configData.deploymentChannels.map(channel => ({
            type: channel as any,
            isActive: true,
            configuration: {},
            deployedAt: new Date(),
          })),
        },
        selectedAgent.apiDetails?.key === 'hosted-managed' ? 'hosted' : 'byok'
      );

      console.log('Agent converted to chatbot successfully:', chatbot);

      // Navigate to My Chatbots page
      navigate('/ui/chat/chatbots');

    } catch (error) {
      console.error('Failed to convert agent to chatbot:', error);
      alert('Failed to convert agent to chatbot. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const getModelDisplayName = (agent: AgentProfile): string => {
    return chatbotService.getModelDisplayName(
      agent.apiDetails?.provider,
      agent.apiDetails?.selectedModel
    );
  };

  // Agent selection view
  if (!showConverter) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'transparent' }}>
        <Box textAlign="center" mb={6}>
          <ConvertIcon sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
          <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
            Convert Agent to Chatbot
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
            Transform your wrapped agents into customer-facing chatbots
          </Typography>
        </Box>

        {availableAgents.length === 0 ? (
          <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                No Wrapped Agents Available
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
                You need to wrap an agent first before converting it to a chatbot.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/ui/agents/wrapping')}
                sx={{
                  backgroundColor: '#3182ce',
                  color: 'white',
                  '&:hover': { backgroundColor: '#2c5aa0' },
                }}
              >
                Wrap an Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {availableAgents.map((agent) => (
              <Grid item xs={12} md={6} lg={4} key={agent.identity.id}>
                <Card
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => handleAgentSelect(agent)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <GovernanceIcon sx={{ color: '#10b981', mr: 1 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Governed Agent: {getModelDisplayName(agent)}
                      </Typography>
                    </Box>

                    <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                      {agent.identity.name}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                      {agent.identity.description}
                    </Typography>

                    <Box display="flex" gap={1} mb={3}>
                      <Chip
                        label={`Trust: ${agent.trustLevel}`}
                        size="small"
                        sx={{
                          backgroundColor: agent.trustLevel === 'high' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: agent.trustLevel === 'high' ? '#10b981' : '#f59e0b',
                          border: `1px solid ${agent.trustLevel === 'high' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        }}
                      />
                      <Chip
                        label={agent.healthStatus}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      />
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        '&:hover': { backgroundColor: '#059669' },
                      }}
                    >
                      Convert to Chatbot
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    );
  }

  // Conversion configuration dialog
  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'transparent' }}>
      <Dialog
        open={showConverter}
        onClose={() => setShowConverter(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a202c',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '600px',
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <ChatbotIcon sx={{ mr: 2, color: '#10b981' }} />
            <Box>
              <Typography variant="h6">Convert Agent to Chatbot</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Configure your chatbot settings
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          {selectedAgent && (
            <Box>
              {/* Agent Information */}
              <Card sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', mb: 4 }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="subtitle1" sx={{ color: '#10b981', fontWeight: 600, mb: 1 }}>
                    Source Agent: {selectedAgent.identity.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Model: {getModelDisplayName(selectedAgent)} • Trust Level: {selectedAgent.trustLevel}
                  </Typography>
                </CardContent>
              </Card>

              {/* Chatbot Configuration */}
              <TextField
                fullWidth
                label="Chatbot Name"
                value={configData.name}
                onChange={(e) => setConfigData({ ...configData, name: e.target.value })}
                sx={{ mb: 3 }}
                InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{
                  sx: {
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
                  },
                }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Personality</InputLabel>
                <Select
                  value={configData.personality}
                  onChange={(e) => setConfigData({ ...configData, personality: e.target.value })}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
                  }}
                >
                  {personalities.map((personality) => (
                    <MenuItem key={personality.value} value={personality.value}>
                      <Box>
                        <Typography variant="body1">{personality.label}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          {personality.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Use Case</InputLabel>
                <Select
                  value={configData.useCase}
                  onChange={(e) => setConfigData({ ...configData, useCase: e.target.value })}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
                  }}
                >
                  {useCases.map((useCase) => (
                    <MenuItem key={useCase.value} value={useCase.value}>
                      <Box>
                        <Typography variant="body1">{useCase.label}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          {useCase.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                Deployment Channels
              </Typography>
              <List dense>
                {deploymentChannels.map((channel) => (
                  <ListItem
                    key={channel.value}
                    sx={{
                      backgroundColor: configData.deploymentChannels.includes(channel.value)
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: configData.deploymentChannels.includes(channel.value)
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const channels = configData.deploymentChannels.includes(channel.value)
                        ? configData.deploymentChannels.filter(c => c !== channel.value)
                        : [...configData.deploymentChannels, channel.value];
                      setConfigData({ ...configData, deploymentChannels: channels });
                    }}
                  >
                    <ListItemIcon>
                      <CheckIcon
                        sx={{
                          color: configData.deploymentChannels.includes(channel.value) ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={channel.label}
                      secondary={channel.description}
                      sx={{
                        '& .MuiListItemText-primary': { color: 'white' },
                        '& .MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.6)' },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setShowConverter(false)}
            disabled={isConverting}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConvertToChatbot}
            disabled={!configData.name.trim() || isConverting}
            sx={{
              backgroundColor: '#10b981',
              color: 'white',
              '&:hover': { backgroundColor: '#059669' },
              '&:disabled': { backgroundColor: '#6b7280' },
            }}
          >
            {isConverting ? (
              <Box display="flex" alignItems="center">
                <LinearProgress size={16} sx={{ mr: 1 }} />
                Converting...
              </Box>
            ) : (
              'Convert to Chatbot'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AgentToChatbotConverter;

