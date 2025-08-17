/**
 * Quick Start Setup Component
 * 
 * Two-path chatbot creation wizard:
 * 1. Hosted API - Simple setup with managed models
 * 2. Bring Your Own Key - Advanced setup with custom models
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../firebase/config';
import ChatbotStorageService from '../../../services/ChatbotStorageService';
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
  Chip,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Rocket as RocketIcon,
  Cloud as HostedIcon,
  VpnKey as BYOKIcon,
  SmartToy as ChatbotIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

interface HostedChatbotData {
  plan: string;
  name: string;
  description: string;
  provider: string;
  model: string;
  personality: string;
  useCase: string;
  // Governance settings
  trustThreshold: number;
  securityLevel: string;
  complianceFramework: string;
  enableAuditLogging: boolean;
  enableRealTimeMonitoring: boolean;
  enableDataRetention: boolean;
  enableRateLimiting: boolean;
  enableContentFiltering: boolean;
}

const QuickStartSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const chatbotService = ChatbotStorageService.getInstance();
  const [selectedPath, setSelectedPath] = useState<'hosted' | 'byok' | null>(null);
  const [showHostedWizard, setShowHostedWizard] = useState(false);
  const [hostedStep, setHostedStep] = useState(0);
  const [hostedData, setHostedData] = useState<HostedChatbotData>({
    plan: '',
    name: '',
    description: '',
    provider: '',
    model: '',
    personality: 'professional',
    useCase: 'customer_support',
    // Governance defaults
    trustThreshold: 85,
    securityLevel: 'standard',
    complianceFramework: 'general',
    enableAuditLogging: true,
    enableRealTimeMonitoring: true,
    enableDataRetention: true,
    enableRateLimiting: false,
    enableContentFiltering: true
  });
  const [isCreating, setIsCreating] = useState(false);

  // Comprehensive hosted models with all supported providers
  const hostedModels = [
    // OpenAI Models
    { 
      provider: 'OpenAI', 
      model: 'gpt-4', 
      name: 'GPT-4', 
      description: 'Most capable model for complex tasks', 
      price: '$0.03/message',
      costEffective: false,
      pros: ['Excellent reasoning', 'Complex problem solving', 'High accuracy'],
      cons: ['Higher cost', 'Slower response time'],
      category: 'Premium'
    },
    { 
      provider: 'OpenAI', 
      model: 'gpt-3.5-turbo', 
      name: 'GPT-3.5 Turbo', 
      description: 'Fast and efficient for most tasks', 
      price: '$0.01/message',
      costEffective: true,
      pros: ['Fast responses', 'Cost-effective', 'Good for general tasks'],
      cons: ['Less capable than GPT-4', 'Limited reasoning'],
      category: 'Balanced'
    },
    
    // Anthropic Models
    { 
      provider: 'Anthropic', 
      model: 'claude-3-opus-20240229', 
      name: 'Claude-3 Opus', 
      description: 'Excellent for analysis and reasoning', 
      price: '$0.04/message',
      costEffective: false,
      pros: ['Superior reasoning', 'Excellent for analysis', 'Long context'],
      cons: ['Most expensive', 'Slower responses'],
      category: 'Premium'
    },
    { 
      provider: 'Anthropic', 
      model: 'claude-3-5-sonnet-20241022', 
      name: 'Claude-3.5 Sonnet', 
      description: 'Latest and most capable Claude model', 
      price: '$0.02/message',
      costEffective: true,
      pros: ['Latest capabilities', 'Excellent reasoning', 'Fast responses'],
      cons: ['Higher cost than Haiku', 'Premium model'],
      category: 'Premium'
    },
    { 
      provider: 'Anthropic', 
      model: 'claude-3-5-haiku-20241022', 
      name: 'Claude-3.5 Haiku', 
      description: 'Fast and economical latest Claude model', 
      price: '$0.005/message',
      costEffective: true,
      pros: ['Very fast', 'Latest Haiku version', 'Good for most tasks'],
      cons: ['Less capable than Sonnet', 'Newer model'],
      category: 'Balanced'
    },
    
    // Google Models
    { 
      provider: 'Google', 
      model: 'gemini-pro', 
      name: 'Gemini Pro', 
      description: 'Google\'s advanced multimodal model', 
      price: '$0.02/message',
      costEffective: true,
      pros: ['Multimodal capabilities', 'Good performance', 'Competitive pricing'],
      cons: ['Newer model', 'Less proven track record'],
      category: 'Balanced'
    },
    { 
      provider: 'Google', 
      model: 'gemini-ultra', 
      name: 'Gemini Ultra', 
      description: 'Google\'s most capable model', 
      price: '$0.035/message',
      costEffective: false,
      pros: ['Highest capability', 'Advanced multimodal', 'Latest technology'],
      cons: ['Premium pricing', 'Limited availability'],
      category: 'Premium'
    },
    
    // Cohere Models
    { 
      provider: 'Cohere', 
      model: 'command-r-plus', 
      name: 'Command R+', 
      description: 'Enterprise-grade conversational AI', 
      price: '$0.025/message',
      costEffective: true,
      pros: ['Enterprise features', 'Good for business', 'Reliable'],
      cons: ['Less known', 'Limited ecosystem'],
      category: 'Business'
    },
    
    // HuggingFace Models
    { 
      provider: 'HuggingFace', 
      model: 'meta-llama/Llama-2-70b-chat-hf', 
      name: 'Llama 2 70B', 
      description: 'Open-source large language model', 
      price: '$0.015/message',
      costEffective: true,
      pros: ['Open source', 'Good performance', 'Cost-effective'],
      cons: ['Requires more setup', 'Less polished'],
      category: 'Open Source'
    },
    { 
      provider: 'HuggingFace', 
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1', 
      name: 'Mixtral 8x7B', 
      description: 'High-performance mixture of experts model', 
      price: '$0.012/message',
      costEffective: true,
      pros: ['Excellent performance', 'Cost-effective', 'Fast inference'],
      cons: ['Complex architecture', 'Newer model'],
      category: 'Open Source'
    },
    
    // Grok (X.AI) Models
    { 
      provider: 'Grok', 
      model: 'grok-beta', 
      name: 'Grok Beta', 
      description: 'X.AI\'s conversational AI with real-time data', 
      price: '$0.03/message',
      costEffective: false,
      pros: ['Real-time data access', 'Unique personality', 'Current events'],
      cons: ['Beta stage', 'Premium pricing', 'Limited availability'],
      category: 'Specialized'
    },
    
    // Perplexity Models
    { 
      provider: 'Perplexity', 
      model: 'llama-3.1-sonar-small-128k-online', 
      name: 'Sonar Small', 
      description: 'Search-augmented AI for current information', 
      price: '$0.018/message',
      costEffective: true,
      pros: ['Search integration', 'Current information', 'Good value'],
      cons: ['Smaller model', 'Limited reasoning'],
      category: 'Search-Enhanced'
    }
  ];

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

  // Pricing tiers based on old UI
  const pricingTiers = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: '/month',
      requests: '10K requests/month',
      recommended: false,
      features: [
        'Basic API access',
        'Standard support',
        '99.9% uptime SLA',
        'Basic monitoring'
      ],
      description: 'Perfect for small projects and testing'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$99',
      period: '/month',
      requests: '100K requests/month',
      recommended: true,
      features: [
        'Advanced API features',
        'Priority support',
        '99.95% uptime SLA',
        'Custom domains',
        'Advanced monitoring'
      ],
      description: 'Ideal for growing businesses and production use'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom pricing',
      period: '',
      requests: 'Unlimited requests',
      recommended: false,
      features: [
        'Full API suite',
        'Dedicated support',
        '99.99% uptime SLA',
        'Custom integrations',
        'On-premise option',
        'Advanced security'
      ],
      description: 'For large organizations with custom requirements'
    }
  ];

  const handlePathSelection = (path: 'hosted' | 'byok') => {
    console.log('🔍 handlePathSelection called with path:', path);
    console.log('🔍 Current showHostedWizard state:', showHostedWizard);
    setSelectedPath(path);
    
    if (path === 'hosted') {
      console.log('🔍 Setting showHostedWizard to true');
      try {
        setShowHostedWizard(true);
        console.log('🔍 showHostedWizard state should now be true');
        // Force a re-render check
        setTimeout(() => {
          console.log('🔍 After timeout, showHostedWizard should be:', true);
        }, 100);
      } catch (error) {
        console.error('🔍 Error setting showHostedWizard:', error);
      }
    } else {
      // Navigate to BYOK governance pricing page first
      navigate('/ui/chat/setup/byok-governance');
    }
  };

  const handleHostedNext = () => {
    if (hostedStep < 3) {
      setHostedStep(hostedStep + 1);
    } else {
      handleCreateHostedChatbot();
    }
  };

  const handleHostedBack = () => {
    if (hostedStep > 0) {
      setHostedStep(hostedStep - 1);
    } else {
      setShowHostedWizard(false);
      setSelectedPath(null);
    }
  };

  const handleCreateHostedChatbot = async () => {
    setIsCreating(true);
    
    try {
      // Use currentUser from auth context for immediate access
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Creating hosted chatbot with user:', currentUser.uid);

      // Create hosted chatbot using the storage service
      const chatbot = await chatbotService.createHostedChatbot(
        hostedData.name,
        hostedData.description,
        hostedData.provider,
        hostedData.model,
        hostedData.personality,
        hostedData.useCase,
        currentUser.uid
      );

      console.log('✅ Hosted chatbot created successfully:', chatbot);
      
      // Navigate to My Chatbots page
      navigate('/ui/chat/chatbots');
      
    } catch (error) {
      console.error('❌ Failed to create hosted chatbot:', error);
      // TODO: Show error message to user
      alert('Failed to create chatbot. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const isHostedStepValid = () => {
    switch (hostedStep) {
      case 0:
        return hostedData.plan.trim() !== '';
      case 1:
        return hostedData.name.trim() && hostedData.description.trim();
      case 2:
        return hostedData.provider && hostedData.model;
      case 3:
        return hostedData.personality && hostedData.useCase;
      default:
        return false;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'transparent' }}>
      {/* Path selection view */}
      {!selectedPath && (
        <>
          <Box textAlign="center" mb={6}>
            <RocketIcon sx={{ fontSize: 64, color: '#3182ce', mb: 2 }} />
            <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
              Quick Start
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
              Choose how you'd like to create your AI chatbot
            </Typography>
          </Box>

        <Grid container spacing={4} justifyContent="center">
          {/* Hosted API Path */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(49, 130, 206, 0.3)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(49, 130, 206, 0.1)',
                  border: '2px solid rgba(49, 130, 206, 0.5)',
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={() => handlePathSelection('hosted')}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <HostedIcon sx={{ fontSize: 48, color: '#3182ce', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                  🏢 Hosted API
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
                  Easy setup with managed models
                </Typography>

                <Box textAlign="left" mb={3}>
                  <Typography variant="subtitle2" sx={{ color: '#10b981', mb: 2 }}>
                    ✅ Perfect for:
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Quick deployment" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="No API key management" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Automatic scaling" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Built-in monitoring" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                  </List>
                </Box>

                <Box sx={{ backgroundColor: 'rgba(49, 130, 206, 0.1)', p: 2, borderRadius: 2, mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#3182ce', fontWeight: 600 }}>
                    💰 Pricing: $0.01 - $0.04 per message
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Includes hosting, scaling, and monitoring
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handlePathSelection('hosted')}
                  sx={{
                    backgroundColor: '#3182ce',
                    color: 'white',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#2c5aa0' },
                  }}
                >
                  Get Started - Hosted
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* BYOK Path */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '2px solid rgba(245, 158, 11, 0.5)',
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={() => handlePathSelection('byok')}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <BYOKIcon sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                  🔧 Bring Your Own Key
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
                  Full control with your API keys
                </Typography>

                <Box textAlign="left" mb={3}>
                  <Typography variant="subtitle2" sx={{ color: '#10b981', mb: 2 }}>
                    ✅ Perfect for:
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Maximum control" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Custom models" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Direct API costs" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Enterprise features" 
                        sx={{ '& .MuiListItemText-primary': { color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' } }}
                      />
                    </ListItem>
                  </List>
                </Box>

                <Box sx={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', p: 2, borderRadius: 2, mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                    💰 Pricing: Your API costs only
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Plus governance and monitoring features
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#d97706' },
                  }}
                >
                  Get Started - BYOK
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box textAlign="center" mt={6}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Both options include enterprise-grade governance, security, and compliance features
          </Typography>
        </Box>
        </>
      )}

      {/* Full-Width Hosted Wizard */}
      {showHostedWizard && (
        <Container 
          maxWidth={false} 
          sx={{ 
            minHeight: '100vh',
            backgroundColor: '#1a202c',
            py: 4,
            px: 4
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <HostedIcon sx={{ mr: 2, color: '#3182ce', fontSize: '2rem' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Create Hosted Chatbot
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Step {hostedStep + 1} of 4
                  </Typography>
                </Box>
              </Box>
              <Button
                onClick={() => setShowHostedWizard(false)}
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Cancel
              </Button>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={(hostedStep + 1) / 4 * 100} 
              sx={{ 
                mt: 3, 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#3182ce'
                }
              }}
            />
          </Box>

          {/* Content */}
          <Container maxWidth={false} sx={{ px: 6 }}>
            <Box sx={{ mb: 4 }}>
            {/* Step 1: Plan Selection */}
            {hostedStep === 0 && (
              <Box>
                {/* Features Overview */}
                <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', mb: 4 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ color: 'white', mr: 2 }}>
                        Hosted API Benefits
                      </Typography>
                      <Chip 
                        label="BETA - FREE" 
                        sx={{ 
                          backgroundColor: '#10b981', 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.75rem'
                        }} 
                      />
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <HostedIcon sx={{ color: '#4299e1', fontSize: '3rem' }} />
                          <Typography variant="h6" sx={{ color: 'white', mt: 1, mb: 1 }}>
                            Managed Infrastructure
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Fully managed cloud infrastructure with automatic scaling and maintenance
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <SecurityIcon sx={{ color: '#4299e1', fontSize: '3rem' }} />
                          <Typography variant="h6" sx={{ color: 'white', mt: 1, mb: 1 }}>
                            Enterprise Security
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            SOC 2 compliant with end-to-end encryption and advanced threat protection
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <CheckIcon sx={{ color: '#4299e1', fontSize: '3rem' }} />
                          <Typography variant="h6" sx={{ color: 'white', mt: 1, mb: 1 }}>
                            Global CDN
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Low-latency access worldwide with edge caching and optimized routing
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <SecurityIcon sx={{ color: '#4299e1', fontSize: '3rem' }} />
                          <Typography variant="h6" sx={{ color: 'white', mt: 1, mb: 1 }}>
                            24/7 Support
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Round-the-clock technical support with dedicated account management
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Plan Selection */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 0, mr: 2 }}>
                    Choose Your Plan
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                  During beta, all plans are free! You only pay for AI model token usage.
                </Typography>

                <Grid container spacing={3}>
                  {pricingTiers.map((tier) => (
                    <Grid item xs={12} md={4} key={tier.id}>
                      <Card
                        sx={{
                          bgcolor: hostedData.plan === tier.id ? 'rgba(49, 130, 206, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: hostedData.plan === tier.id ? '2px solid #3182ce' : '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                          },
                        }}
                        onClick={() => setHostedData({ ...hostedData, plan: tier.id })}
                      >
                        {tier.recommended && (
                          <Chip
                            label="Recommended"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: 16,
                              bgcolor: '#3182ce',
                              color: 'white',
                              fontSize: '0.75rem',
                            }}
                          />
                        )}
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                            {tier.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                            <Typography 
                              variant="h4" 
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.4)', 
                                fontWeight: 'bold',
                                textDecoration: 'line-through',
                                mr: 1
                              }}
                            >
                              {tier.price}
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                              FREE
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', ml: 1 }}>
                              {tier.period}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                            {tier.requests}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2, fontSize: '0.875rem' }}>
                            {tier.description}
                          </Typography>
                          <List dense sx={{ p: 0 }}>
                            {tier.features.map((feature, index) => (
                              <ListItem key={index} sx={{ p: 0, mb: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 24 }}>
                                  <CheckIcon sx={{ color: '#10b981', fontSize: 16 }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={feature}
                                  primaryTypographyProps={{
                                    sx: { color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {hostedStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Basic Information
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                  Tell us about your chatbot
                </Typography>

                <TextField
                  fullWidth
                  label="Chatbot Name"
                  value={hostedData.name}
                  onChange={(e) => setHostedData({ ...hostedData, name: e.target.value })}
                  placeholder="e.g., Customer Support Bot"
                  sx={{ mb: 3 }}
                  InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                  InputProps={{
                    sx: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={hostedData.description}
                  onChange={(e) => setHostedData({ ...hostedData, description: e.target.value })}
                  placeholder="e.g., Helps customers with inquiries and support tickets"
                  multiline
                  rows={3}
                  InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                  InputProps={{
                    sx: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                    },
                  }}
                />
              </Box>
            )}

            {/* Step 2: Model Selection - Enhanced Layout */}
            {hostedStep === 2 && (
              <Box sx={{ maxWidth: '100%', width: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                  Select Your AI Model
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
                  Choose from our comprehensive selection of AI models across multiple providers. Hover over any model for detailed pros and cons.
                </Typography>

                {/* Provider Columns - Full Width Layout */}
                <Grid container spacing={3} sx={{ width: '100%' }}>
                  {Object.entries(
                    hostedModels.reduce((acc, model) => {
                      if (!acc[model.provider]) acc[model.provider] = [];
                      acc[model.provider].push(model);
                      return acc;
                    }, {} as Record<string, typeof hostedModels>)
                  ).map(([provider, models]) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={provider}>
                      <Box sx={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                        borderRadius: 2, 
                        p: 2,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        height: 'fit-content'
                      }}>
                        {/* Provider Header */}
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: 'white', 
                            mb: 2, 
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            pb: 1,
                            borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          {provider}
                        </Typography>
                        
                        {/* Models in this provider */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {models.map((model) => (
                            <Tooltip
                              key={`${model.provider}-${model.model}`}
                              title={
                                <Box sx={{ p: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    {model.name} - {model.category}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Pros:</strong> {model.pros.join(', ')}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Cons:</strong> {model.cons.join(', ')}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Best for:</strong> {model.category} use cases
                                  </Typography>
                                </Box>
                              }
                              arrow
                              placement="right"
                            >
                              <Card
                                sx={{
                                  backgroundColor: hostedData.provider === model.provider && hostedData.model === model.model
                                    ? 'rgba(49, 130, 206, 0.3)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                  border: hostedData.provider === model.provider && hostedData.model === model.model
                                    ? '2px solid #3182ce'
                                    : model.costEffective 
                                      ? '2px solid rgba(16, 185, 129, 0.5)'
                                      : '1px solid rgba(255, 255, 255, 0.1)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  position: 'relative',
                                  '&:hover': {
                                    backgroundColor: 'rgba(49, 130, 206, 0.15)',
                                    border: '2px solid rgba(49, 130, 206, 0.7)',
                                    transform: 'translateY(-2px)',
                                  },
                                }}
                                onClick={() => setHostedData({ 
                                  ...hostedData, 
                                  provider: model.provider, 
                                  model: model.model 
                                })}
                              >
                                {model.costEffective && (
                                  <Chip
                                    label="Best Value"
                                    size="small"
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      fontSize: '0.65rem',
                                      fontWeight: 'bold',
                                      height: '20px',
                                    }}
                                  />
                                )}
                                <CardContent sx={{ p: 2, pb: '16px !important' }}>
                                  <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                      color: 'white', 
                                      fontWeight: 600, 
                                      mb: 0.5,
                                      fontSize: '0.9rem',
                                      pr: model.costEffective ? 7 : 0
                                    }}
                                  >
                                    {model.name}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: 'rgba(255, 255, 255, 0.7)', 
                                      mb: 1, 
                                      fontSize: '0.8rem',
                                      lineHeight: 1.3
                                    }}
                                  >
                                    {model.description}
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Chip
                                      label={model.price}
                                      size="small"
                                      sx={{
                                        backgroundColor: model.costEffective 
                                          ? 'rgba(16, 185, 129, 0.2)' 
                                          : 'rgba(255, 193, 7, 0.2)',
                                        color: model.costEffective ? '#10b981' : '#ffc107',
                                        border: `1px solid ${model.costEffective ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`,
                                        fontSize: '0.7rem',
                                        height: '20px',
                                        width: 'fit-content'
                                      }}
                                    />
                                    <Chip
                                      label={model.category}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'rgba(156, 163, 175, 0.2)',
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        border: '1px solid rgba(156, 163, 175, 0.3)',
                                        fontSize: '0.7rem',
                                        height: '20px',
                                        width: 'fit-content'
                                      }}
                                    />
                                  </Box>
                                </CardContent>
                              </Card>
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )} 

            {/* Step 3: Configuration */}
            {hostedStep === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Configuration & Governance
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                  Customize your chatbot's personality, use case, and governance settings
                </Typography>

                <Grid container spacing={3}>
                  {/* Personality & Use Case Configuration */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                          <ChatbotIcon sx={{ mr: 1, color: '#3182ce' }} />
                          Chatbot Personality
                        </Typography>
                        
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Personality</InputLabel>
                          <Select
                            value={hostedData.personality}
                            onChange={(e) => setHostedData({ ...hostedData, personality: e.target.value })}
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
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

                        <FormControl fullWidth>
                          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Use Case</InputLabel>
                          <Select
                            value={hostedData.useCase}
                            onChange={(e) => setHostedData({ ...hostedData, useCase: e.target.value })}
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
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
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Governance Settings */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                          <SecurityIcon sx={{ mr: 1, color: '#3182ce' }} />
                          Governance Settings
                        </Typography>

                        {/* Trust Threshold */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                            Trust Threshold: {hostedData.trustThreshold}%
                          </Typography>
                          <Slider
                            value={hostedData.trustThreshold}
                            onChange={(_, value) => setHostedData({ ...hostedData, trustThreshold: value as number })}
                            min={50}
                            max={100}
                            step={5}
                            marks={[
                              { value: 50, label: '50%' },
                              { value: 75, label: '75%' },
                              { value: 90, label: '90%' },
                              { value: 100, label: '100%' }
                            ]}
                            valueLabelDisplay="auto"
                            sx={{
                              color: '#3182ce',
                              '& .MuiSlider-markLabel': { color: 'rgba(255, 255, 255, 0.7)' }
                            }}
                          />
                        </Box>

                        {/* Security Level */}
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Security Level</InputLabel>
                          <Select
                            value={hostedData.securityLevel}
                            onChange={(e) => setHostedData({ ...hostedData, securityLevel: e.target.value })}
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                              '& .MuiSvgIcon-root': { color: 'white' }
                            }}
                          >
                            <MenuItem value="lenient">Lenient - Basic security checks</MenuItem>
                            <MenuItem value="standard">Standard - Balanced security</MenuItem>
                            <MenuItem value="strict">Strict - Maximum security</MenuItem>
                          </Select>
                        </FormControl>

                        {/* Compliance Framework */}
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Compliance Framework</InputLabel>
                          <Select
                            value={hostedData.complianceFramework}
                            onChange={(e) => setHostedData({ ...hostedData, complianceFramework: e.target.value })}
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                              '& .MuiSvgIcon-root': { color: 'white' }
                            }}
                          >
                            <MenuItem value="general">General Business</MenuItem>
                            <MenuItem value="healthcare">Healthcare (HIPAA)</MenuItem>
                            <MenuItem value="financial">Financial (SOX)</MenuItem>
                            <MenuItem value="gdpr">GDPR Compliance</MenuItem>
                            <MenuItem value="soc2">SOC 2</MenuItem>
                          </Select>
                        </FormControl>

                        {/* Governance Features */}
                        <Box sx={{ mt: 2 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={hostedData.enableAuditLogging}
                                onChange={(e) => setHostedData({ ...hostedData, enableAuditLogging: e.target.checked })}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3182ce' } }}
                              />
                            }
                            label={<Typography sx={{ color: 'white' }}>Enable Audit Logging</Typography>}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={hostedData.enableRealTimeMonitoring}
                                onChange={(e) => setHostedData({ ...hostedData, enableRealTimeMonitoring: e.target.checked })}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3182ce' } }}
                              />
                            }
                            label={<Typography sx={{ color: 'white' }}>Enable Real-time Monitoring</Typography>}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={hostedData.enableDataRetention}
                                onChange={(e) => setHostedData({ ...hostedData, enableDataRetention: e.target.checked })}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3182ce' } }}
                              />
                            }
                            label={<Typography sx={{ color: 'white' }}>Enable Data Retention</Typography>}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={hostedData.enableContentFiltering}
                                onChange={(e) => setHostedData({ ...hostedData, enableContentFiltering: e.target.checked })}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3182ce' } }}
                              />
                            }
                            label={<Typography sx={{ color: 'white' }}>Enable Content Filtering</Typography>}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={hostedData.enableRateLimiting}
                                onChange={(e) => setHostedData({ ...hostedData, enableRateLimiting: e.target.checked })}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3182ce' } }}
                              />
                            }
                            label={<Typography sx={{ color: 'white' }}>Enable Rate Limiting</Typography>}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
          </Container>

          {/* Navigation */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 6,
            pt: 4,
            px: 4,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Button 
              onClick={handleHostedBack}
              disabled={isCreating}
              size="large"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              {hostedStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              variant="contained"
              onClick={handleHostedNext}
              disabled={!isHostedStepValid() || isCreating}
              size="large"
              sx={{
                backgroundColor: '#3182ce',
                color: 'white',
                px: 6,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                '&:hover': { backgroundColor: '#2c5aa0' },
                '&:disabled': { backgroundColor: '#6b7280' },
              }}
            >
              {isCreating ? (
                <Box display="flex" alignItems="center">
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Creating...
                </Box>
              ) : hostedStep === 3 ? (
                'Create Chatbot'
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </Container>
      )}
    </Container>
  );
};

export default QuickStartSetup;

