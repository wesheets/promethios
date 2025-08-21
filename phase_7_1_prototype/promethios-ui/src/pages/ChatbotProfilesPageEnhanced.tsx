import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  Menu,
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
  Stop,
  Image as ImageIcon,
  Code as CodeIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ChatbotStorageService } from '../services/ChatbotStorageService';
import { connectedAppsService, ConnectedApp } from '../services/ConnectedAppsService';
import ConnectedAppsPanel from '../components/tools/ConnectedAppsPanel';
import ChatHistoryPanel from '../components/chat/ChatHistoryPanel';
import { chatHistoryService, ChatSession as ChatHistorySession } from '../services/ChatHistoryService';
import { AgentReceiptViewer } from '../components/receipts/AgentReceiptViewer';
import { AgentMemoryViewer } from '../components/memory/AgentMemoryViewer';
import { LiveAgentSandbox } from '../components/sandbox/LiveAgentSandbox';
import { SimplifiedKnowledgeViewer } from '../components/knowledge/SimplifiedKnowledgeViewer';
import { ChatbotProfile } from '../types/ChatbotTypes';
import WidgetCustomizer from '../components/chat/customizer/WidgetCustomizer';
import PersonalityEditor from '../components/chat/customizer/PersonalityEditor';
import { WidgetCustomizerProvider, useWidgetCustomizer } from '../context/WidgetCustomizerContext';
import { chatPanelGovernanceService, ChatSession, ChatMessage, ChatResponse } from '../services/ChatPanelGovernanceService';
import { ChatSharingService } from '../services/ChatSharingService';
import ToolConfigurationPanel from '../components/tools/ToolConfigurationPanel';
import { RAGPolicyPanel } from '../components/governance/RAGPolicyPanel';
import { AgentToolProfile } from '../types/ToolTypes';
import { conversationalReceiptSearchService } from '../services/ConversationalReceiptSearchService';
import AgentManageModal from '../components/AgentManageModal';
import DebugPanel from '../components/DebugPanel';

// Right panel types
type RightPanelType = 'chats' | 'analytics' | 'customize' | 'personality' | 'knowledge' | 'automation' | 'deployment' | 'settings' | 'chat' | 'tools' | 'integrations' | 'receipts' | 'memory' | 'sandbox' | 'workspace' | 'ai_knowledge' | 'governance' | 'rag_policy' | 'debug' | null;

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

// Bot-specific state interface for persistence
interface BotState {
  rightPanelType: RightPanelType;
  chatMessages: any[];
  currentChatSession: any;
  currentChatName: string;
  activeSession: any;
  isWorkspaceMode: boolean;
  chatHistoryRefreshTrigger: number;
}

// Global mounting guard to prevent multiple instances across the entire app
let globalMountGuard = false;
let globalComponentInstance: string | null = null;

const ChatbotProfilesPageEnhanced: React.FC = () => {
  // Mounting guard to prevent multiple instances
  const mountedRef = useRef(false);
  const componentId = useRef(`chatbot-page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    if (mountedRef.current || globalMountGuard) {
      console.warn(`🚨 ChatbotProfilesPageEnhanced: Preventing duplicate mount. Current: ${componentId.current}, Global: ${globalComponentInstance}`);
      return;
    }
    
    mountedRef.current = true;
    globalMountGuard = true;
    globalComponentInstance = componentId.current;
    console.log(`🔍 ChatbotProfilesPageEnhanced component mounting... (${componentId.current})`);
    
    return () => {
      mountedRef.current = false;
      if (globalComponentInstance === componentId.current) {
        globalMountGuard = false;
        globalComponentInstance = null;
      }
      console.log(`🔍 ChatbotProfilesPageEnhanced component unmounting... (${componentId.current})`);
    };
  }, []);
  
  // If this is a duplicate mount, return null to prevent rendering
  if (globalMountGuard && globalComponentInstance !== componentId.current) {
    console.warn(`🚨 Blocking duplicate render of ChatbotProfilesPageEnhanced (${componentId.current})`);
    return null;
  }

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser: user, loading: authLoading } = useAuth();
  
  // Debug counter to track re-renders
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  
  // Circuit breaker to prevent infinite re-renders
  const MAX_RENDERS = 20;
  if (renderCountRef.current > MAX_RENDERS) {
    console.error(`🚨 [CIRCUIT BREAKER] Component has rendered ${renderCountRef.current} times - stopping to prevent infinite loop`);
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f172a' }}>
        <Typography sx={{ color: '#ef4444' }}>
          Error: Infinite re-render detected. Please refresh the page.
        </Typography>
      </Box>
    );
  }
  
  // Remove useWidgetCustomizer for now to test if this fixes the context issue
  // const { config: widgetConfig, getChatbotConfig, setActiveChatbotId } = useWidgetCustomizer();
  console.log(`🔍 [DEBUG] ChatbotProfilesPageEnhanced RENDER #${renderCountRef.current}`);
  console.log('🔍 [DEBUG] - user from auth:', user?.uid);
  console.log('🔍 [DEBUG] - auth loading:', authLoading);
  console.log('🔍 [DEBUG] - location:', location.pathname + location.search);
  
  const chatbotService = ChatbotStorageService.getInstance();
  
  // Bot-specific state management
  const [botStates, setBotStates] = useState<Map<string, BotState>>(new Map());
  
  // State management
  const [chatbotProfiles, setChatbotProfiles] = useState<ChatbotProfile[]>([]);
  const [filteredChatbots, setFilteredChatbots] = useState<ChatbotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotProfile | null>(null);
  const [filterTab, setFilterTab] = useState(0); // 0: All, 1: Hosted API, 2: BYOK, 3: Enterprise
  const [searchQuery, setSearchQuery] = useState('');
  
  // Current bot state (derived from botStates map)
  const selectedChatbotId = selectedChatbot ? (selectedChatbot.identity?.id || selectedChatbot.key || selectedChatbot.id) : null;
  const currentBotState = selectedChatbotId ? botStates.get(selectedChatbotId) : null;
  const rightPanelType = currentBotState?.rightPanelType || null;
  const chatMessages = currentBotState?.chatMessages || [];
  const activeSession = currentBotState?.activeSession || null;
  const isWorkspaceMode = currentBotState?.isWorkspaceMode || false;
  
  // Remaining global state (not bot-specific)
  const [isTyping, setIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Chat enhancements
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [connectedAppsMenuOpen, setConnectedAppsMenuOpen] = useState(false);
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  const [selectedConnectedApps, setSelectedConnectedApps] = useState<ConnectedApp[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File attachment and voice recording states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Bot state helper functions
  const initializeBotState = (botId: string): BotState => {
    return {
      rightPanelType: null,
      chatMessages: [],
      currentChatSession: null,
      currentChatName: '',
      activeSession: null,
      isWorkspaceMode: false,
      chatHistoryRefreshTrigger: 0,
    };
  };

  const updateBotState = (botId: string, updates: Partial<BotState>) => {
    setBotStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(botId) || initializeBotState(botId);
      newStates.set(botId, { ...currentState, ...updates });
      return newStates;
    });
  };

  // Helper function to update chat history refresh trigger
  const setChatHistoryRefreshTrigger = (updater: (prev: number) => number) => {
    if (selectedChatbotId) {
      const currentState = botStates.get(selectedChatbotId) || initializeBotState(selectedChatbotId);
      const newTrigger = updater(currentState.chatHistoryRefreshTrigger);
      updateBotState(selectedChatbotId, { chatHistoryRefreshTrigger: newTrigger });
    }
  };

  // Get real metrics from chatbot data and governance service (memoized to prevent flickering)
  const getRealMetrics = useCallback(async (chatbot: ChatbotProfile): Promise<ChatbotMetrics> => {
    try {
      // Try to get real metrics from governance service first
      const agentId = chatbot.identity?.id || chatbot.key || chatbot.id;
      console.log(`🔍 [Metrics] Loading metrics for agent: ${agentId}`);
      
      // Get trust score from governance service
      const trustData = await chatPanelGovernanceService.getTrustScore(agentId);
      const trustScore = trustData?.currentScore ? Math.round(trustData.currentScore * 100) : null;
      console.log(`🔍 [Metrics] Trust score for ${agentId}:`, trustScore);
      
      // Get session metrics if available
      const sessionMetrics = chatPanelGovernanceService.getSessionMetrics?.(agentId);
      console.log(`🔍 [Metrics] Session metrics for ${agentId}:`, sessionMetrics);
      
      // Get chat history for message volume and response time calculations
      // Note: getUserChatHistory expects user ID, not agent ID
      const chatHistory = user?.uid ? await chatHistoryService.getUserChatHistory(user.uid, { agentId }) : [];
      const messageVolume = chatHistory?.length || 0;
      console.log(`🔍 [Metrics] Message volume for ${agentId}:`, messageVolume);
      
      // Calculate average response time from recent messages (if available)
      let averageResponseTime = 1.2; // Default fallback
      if (chatHistory && chatHistory.length > 0) {
        // Get the most recent session
        const recentSession = chatHistory[0];
        if (recentSession?.messages && recentSession.messages.length > 0) {
          const recentMessages = recentSession.messages.slice(-10); // Last 10 messages
          const responseTimes = recentMessages
            .filter(msg => msg.sender === 'agent' && msg.responseTime)
            .map(msg => msg.responseTime || 1.2);
          
          if (responseTimes.length > 0) {
            averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
          }
        }
      }
      
      // Calculate real metrics based on actual data
      const realMetrics = {
        healthScore: trustScore ? Math.min(trustScore + 10, 100) : 85, // Health slightly higher than trust
        trustScore: trustScore || 85, // Real trust score from governance
        performanceRating: trustScore ? Math.min(trustScore + 5, 100) : 85, // Performance based on trust
        messageVolume: messageVolume, // Real message count
        responseTime: averageResponseTime, // Real or calculated response time
        satisfactionScore: trustScore ? (trustScore / 100) * 5 : 4.5, // Satisfaction derived from trust
        resolutionRate: trustScore ? Math.min(trustScore + 15, 100) : 85, // Resolution rate based on trust
        lastActive: messageVolume > 0 ? 'Recently' : 'No activity', // Based on actual activity
        governanceAlerts: sessionMetrics?.violations || 0, // Real violation count
      };
      
      console.log(`✅ [Metrics] Calculated metrics for ${agentId}:`, realMetrics);
      return realMetrics;
      
    } catch (error) {
      console.warn('⚠️ Failed to fetch real metrics, using fallbacks:', error);
      
      // Fallback to reasonable defaults if real data fails
      return {
        healthScore: 85, // Default healthy score
        trustScore: 85, // Default trust score
        performanceRating: 85, // Default performance
        messageVolume: 0, // No messages yet
        responseTime: 1.2, // Default response time
        satisfactionScore: 4.5, // Default satisfaction
        resolutionRate: 85, // Default resolution rate
        lastActive: 'Recently', // Default activity
        governanceAlerts: 0, // No alerts by default
      };
    }
  }, [user]);

  // Synchronous version for analytics panels (uses cached data)
  const getRealMetricsSync = useCallback((chatbot: ChatbotProfile): ChatbotMetrics => {
    // Try to get real metrics from latestScorecard if available
    if (chatbot.latestScorecard) {
      return {
        healthScore: chatbot.latestScorecard.healthScore || 85,
        trustScore: chatbot.latestScorecard.score || 85,
        performanceRating: chatbot.latestScorecard.performanceRating || 85,
        messageVolume: chatbot.latestScorecard.messageVolume || 0,
        responseTime: chatbot.latestScorecard.responseTime || 1.2,
        satisfactionScore: chatbot.latestScorecard.satisfactionScore || 4.5,
        resolutionRate: chatbot.latestScorecard.resolutionRate || 85,
        lastActive: chatbot.latestScorecard.lastActive || 'Recently',
        governanceAlerts: chatbot.latestScorecard.governanceAlerts || 0,
      };
    }
    
    // Fallback to reasonable defaults (not random)
    return {
      healthScore: 85, // Default healthy score
      trustScore: 85, // Default trust score
      performanceRating: 85, // Default performance
      messageVolume: 0, // No messages yet
      responseTime: 1.2, // Default response time
      satisfactionScore: 4.5, // Default satisfaction
      resolutionRate: 85, // Default resolution rate
      lastActive: 'Recently', // Default activity
      governanceAlerts: 0, // No alerts by default
    };
  }, []);

  // Modal state for chatbot management
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [manageChatbotId, setManageChatbotId] = useState<string | null>(null);

  const handleManageChatbot = (chatbotId: string) => {
    console.log('🔧 handleManageChatbot called with ID:', chatbotId);
    
    // Find the chatbot to check if it's real or mock data
    const chatbot = chatbotProfiles.find(c => c.id === chatbotId);
    console.log('🔧 Found chatbot:', chatbot);
    
    if (!chatbot) {
      console.warn('🔧 Chatbot not found with ID:', chatbotId);
      return;
    }
    
    // Check if this is mock data (mock IDs start with 'agent-')
    if (chatbotId.startsWith('agent-') && !user?.uid) {
      console.log('🔧 Mock chatbot detected, showing mock management');
      alert('This is a demo chatbot. Please log in to manage real chatbots.');
      return;
    }
    
    // For real chatbots, open the manage modal
    setManageChatbotId(chatbotId);
    setManageModalOpen(true);
  };

  // Workspace mode management (now managed per-bot in botStates)
  const [workspaceSelectedTab, setWorkspaceSelectedTab] = useState<string>('analytics');

  // Governance sensitivity controls
  const [governanceSensitivity, setGovernanceSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [trustThreshold, setTrustThreshold] = useState<number>(70);
  const [riskCategories, setRiskCategories] = useState<string[]>(['financial_transactions', 'data_access']);

  // Function to update right panel type for the current chatbot
  const setRightPanelType = (panelType: RightPanelType) => {
    if (selectedChatbotId) {
      updateBotState(selectedChatbotId, { rightPanelType: panelType });
      
      // Update URL parameters to keep them in sync with state
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('panel', panelType);
      setSearchParams(newSearchParams, { replace: true });
    }
  };



  // Mock governance type function
  const getGovernanceType = (chatbot: ChatbotProfile) => {
    const types = ['BYOK', 'Hosted API', 'Enterprise'];
    return types[Math.floor(Math.random() * types.length)];
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
        setAttachedFiles(prev => [...prev, audioFile]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = Array.from(event.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    imageItems.forEach(item => {
      const file = item.getAsFile();
      if (file) {
        setAttachedFiles(prev => [...prev, file]);
      }
    });
  };

  const handleSearchReceiptsClick = () => {
    // Add "Search Receipts+" to the message input
    setMessageInput('Search Receipts+ ');
    setAddMenuAnchor(null);
    
    // Focus on the message input for user to continue typing
    setTimeout(() => {
      const messageInput = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
      if (messageInput) {
        messageInput.focus();
        // Position cursor at the end
        messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
      }
    }, 100);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get real model provider from chatbot configuration - only show working providers
  const getModelProvider = (chatbot: ChatbotProfile) => {
    // Use real provider from apiDetails if available
    const realProvider = chatbot.apiDetails?.provider;
    const realModel = chatbot.apiDetails?.selectedModel || chatbot.configuration?.selectedModel;
    
    console.log('🔍 CHATBOT PROVIDER DEBUG:', {
      chatbotId: chatbot.id,
      realProvider,
      realModel,
      apiDetails: chatbot.apiDetails,
      configuration: chatbot.configuration
    });
    
    if (realProvider) {
      // Only map providers that are actually working (based on startup logs)
      const workingProviderMap: { [key: string]: { name: string, color: string } } = {
        'openai': { name: 'OpenAI', color: '#10b981' },
        'anthropic': { name: 'Anthropic', color: '#f59e0b' },
        'cohere': { name: 'Cohere', color: '#8b5cf6' },
        'google': { name: 'Google', color: '#3b82f6' },
        'gemini': { name: 'Google', color: '#3b82f6' }
      };
      
      const provider = workingProviderMap[realProvider.toLowerCase()];
      if (provider) {
        return provider;
      }
    }
    
    // Fallback: try to infer from model name - only for working providers
    if (realModel) {
      if (realModel.includes('gpt') || realModel.includes('openai')) {
        return { name: 'OpenAI', color: '#10b981' };
      }
      if (realModel.includes('claude') || realModel.includes('anthropic')) {
        return { name: 'Anthropic', color: '#f59e0b' };
      }
      if (realModel.includes('gemini') || realModel.includes('google')) {
        return { name: 'Google', color: '#3b82f6' };
      }
      if (realModel.includes('cohere')) {
        return { name: 'Cohere', color: '#8b5cf6' };
      }
    }
    
    // Final fallback - show as unknown instead of defaulting to a working provider
    return { name: 'Unknown', color: '#6b7280' };
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

  const loadConnectedApps = async () => {
    try {
      const apps = await connectedAppsService.getAllApps();
      setConnectedApps(apps);
      
      // Set initially connected apps
      const connected = apps.filter(app => app.status === 'connected');
      setSelectedConnectedApps(connected);
    } catch (error) {
      console.error('Failed to load connected apps:', error);
    }
  };

  // Load chatbots on component mount and when user changes
  useEffect(() => {
    console.log(`🔍 [DEBUG] useEffect[loadChatbots] triggered - RENDER #${renderCountRef.current}`);
    console.log('🔍 [DEBUG] - user?.uid:', user?.uid);
    console.log('🔍 [DEBUG] - authLoading:', authLoading);
    console.log('🔍 [DEBUG] - About to call loadChatbots...');
    loadChatbots();
    loadConnectedApps();
  }, [user?.uid, authLoading]); // Removed loadChatbots to prevent infinite loop

   // URL restoration effect - restore state from URL parameters
  const agentParam = useMemo(() => searchParams.get('agent'), [searchParams]);
  const panelParam = useMemo(() => searchParams.get('panel'), [searchParams]);
  
  // Add a flag to prevent circular updates during URL restoration
  const [isRestoringFromURL, setIsRestoringFromURL] = useState(false);
  
  // TEMPORARILY DISABLED: URL restoration useEffect causing infinite loops
  // TODO: Fix the circular dependency in URL restoration logic
  /*
  useEffect(() => {
    console.log(`🔍 [DEBUG] useEffect[URL restoration] triggered - RENDER #${renderCountRef.current}`);
    console.log('🔍 [DEBUG] - agentParam:', agentParam);
    console.log('🔍 [DEBUG] - panelParam:', panelParam);
    console.log('🔍 [DEBUG] - isRestoringFromURL:', isRestoringFromURL);
    console.log('🔍 [DEBUG] - chatbotProfiles.length:', chatbotProfiles.length);
    
    // Prevent circular updates
    if (isRestoringFromURL) {
      console.log('🔍 [DEBUG] - SKIPPING: isRestoringFromURL is true');
      return;
    }
    
    if (agentParam && chatbotProfiles.length > 0) {
      const chatbot = chatbotProfiles.find(bot => 
        bot.identity?.id === agentParam || bot.key === agentParam || bot.id === agentParam
      );
      if (chatbot) {
        console.log(`🔄 Restoring state for agent: ${agentParam}, panel: ${panelParam}`);
        
        // Check current state to avoid unnecessary updates
        const existingState = botStates.get(agentParam);
        const isAlreadySelected = selectedChatbot?.identity?.id === agentParam;
        const isAlreadyInWorkspace = existingState?.isWorkspaceMode;
        const hasCorrectPanel = existingState?.rightPanelType === panelParam;
        
        // Only update if something actually needs to change
        if (!isAlreadySelected || !isAlreadyInWorkspace || !hasCorrectPanel) {
          setIsRestoringFromURL(true);
          
          // Batch all state updates together to prevent multiple re-renders
          const updates: Array<() => void> = [];
          
          // Initialize bot state if it doesn't exist or needs updates
          if (!botStates.has(agentParam) || !isAlreadyInWorkspace || !hasCorrectPanel) {
            updates.push(() => {
              setBotStates(prev => {
                const newMap = new Map(prev);
                const currentState = newMap.get(agentParam) || initializeBotState(agentParam);
                const updatedState = {
                  ...currentState,
                  rightPanelType: panelParam as RightPanelType || currentState.rightPanelType,
                  isWorkspaceMode: true
                };
                newMap.set(agentParam, updatedState);
                return newMap;
              });
            });
          }
          
          // Set selected chatbot if needed
          if (!isAlreadySelected) {
            updates.push(() => setSelectedChatbot(chatbot));
          }
          
          // Execute all updates
          updates.forEach(update => update());
          
          // Reset flag after a brief delay to allow state to settle
          setTimeout(() => setIsRestoringFromURL(false), 100);
        }
      }
    }
  }, [chatbotProfiles.length, agentParam, panelParam, isRestoringFromURL]); // Include isRestoringFromURL in deps
  */

  // State to store metrics for all chatbots
  const [chatbotMetrics, setChatbotMetrics] = useState<Map<string, ChatbotMetrics>>(new Map());

  // Load metrics for all chatbots when they change
  const metricsLoadingRef = useRef(false);
  useEffect(() => {
    console.log(`🔍 [DEBUG] useEffect[loadAllMetrics] triggered - RENDER #${renderCountRef.current}`);
    console.log('🔍 [DEBUG] - filteredChatbots.length:', filteredChatbots.length);
    console.log('🔍 [DEBUG] - metricsLoadingRef.current:', metricsLoadingRef.current);
    
    // Circuit breaker for metrics loading
    if (metricsLoadingRef.current) {
      console.log('🔍 [DEBUG] - SKIPPING: metrics already loading');
      return;
    }
    
    const loadAllMetrics = async () => {
      if (filteredChatbots.length === 0) return;
      
      metricsLoadingRef.current = true;
      console.log('🔍 [DEBUG] - Starting metrics loading...');
      
      const metricsMap = new Map<string, ChatbotMetrics>();
      
      for (const chatbot of filteredChatbots) {
        try {
          const metrics = await getRealMetrics(chatbot);
          const chatbotId = chatbot.identity?.id || chatbot.key || chatbot.id;
          metricsMap.set(chatbotId, metrics);
        } catch (error) {
          console.warn('Failed to load metrics for chatbot:', chatbot.identity.name, error);
          // Set fallback metrics
          const chatbotId = chatbot.identity?.id || chatbot.key || chatbot.id;
          metricsMap.set(chatbotId, {
            healthScore: 85,
            trustScore: 85,
            performanceRating: 85,
            messageVolume: 0,
            responseTime: 1.2,
            satisfactionScore: 4.5,
            resolutionRate: 85,
            lastActive: 'Recently',
            governanceAlerts: 0,
          });
        }
      }
      
      setChatbotMetrics(metricsMap);
      console.log('🔍 [DEBUG] - Metrics loading completed');
      metricsLoadingRef.current = false; // Reset circuit breaker
    };

    loadAllMetrics().catch(error => {
      console.error('Failed to load metrics:', error);
      metricsLoadingRef.current = false; // Reset circuit breaker on error
    });
  }, [filteredChatbots]); // Removed getRealMetrics to prevent infinite loop

  // Get metrics for a specific chatbot
  const getMetricsForChatbot = (chatbot: ChatbotProfile): ChatbotMetrics => {
    const chatbotId = chatbot.identity?.id || chatbot.key || chatbot.id;
    return chatbotMetrics.get(chatbotId) || {
      healthScore: 85,
      trustScore: 85,
      performanceRating: 85,
      messageVolume: 0,
      responseTime: 1.2,
      satisfactionScore: 4.5,
      resolutionRate: 85,
      lastActive: 'Loading...',
      governanceAlerts: 0,
    };
  };

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
    const chatbotId = chatbot.identity?.id || chatbot.key || chatbot.id;
    console.log(`🎯 [Command Center] Selecting chatbot: ${chatbot.identity.name} (ID: ${chatbotId})`);
    
    setSelectedChatbot(chatbot);
    
    // Initialize bot state if it doesn't exist
    if (!botStates.has(chatbotId)) {
      const newState = initializeBotState(chatbotId);
      newState.isWorkspaceMode = true;
      newState.rightPanelType = 'analytics'; // Default to analytics panel
      setBotStates(prev => new Map(prev).set(chatbotId, newState));
    } else {
      // Update existing state to workspace mode
      updateBotState(chatbotId, { 
        isWorkspaceMode: true,
        rightPanelType: botStates.get(chatbotId)?.rightPanelType || 'analytics'
      });
    }
    
    // Update URL parameters for deep linking (only if not currently restoring from URL)
    if (!isRestoringFromURL) {
      setSearchParams({ 
        agent: chatbotId, 
        panel: botStates.get(chatbotId)?.rightPanelType || 'analytics' 
      });
    }
    
    setWorkspaceSelectedTab('analytics');
    
    // Initialize chat session with governance
    try {
      setChatLoading(true);
      console.log(`🚀 [Workspace] Initializing Command Center for ${chatbot.identity.name}`);
      
      // Start new chat session with governance
      const session = await chatPanelGovernanceService.startChatSession(chatbot);
      updateBotState(chatbotId, { 
        activeSession: session,
        chatMessages: []
      });
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
      updateBotState(chatbot.identity?.id || chatbot.key || chatbot.id, { activeSession: fallbackSession });
    } finally {
      setChatLoading(false);
    }
  };

  // Handle right panel actions
  const handleRightPanelAction = (type: RightPanelType, chatbot: ChatbotProfile) => {
    setSelectedChatbot(chatbot);
    
    // Update bot state with new panel type
    updateBotState(chatbot.id, { 
      rightPanelType: type,
      isWorkspaceMode: true 
    });
    
    // Update URL parameters for deep linking (only if not currently restoring from URL)
    if (!isRestoringFromURL) {
      setSearchParams({ 
        agent: chatbot.identity?.id || chatbot.key || chatbot.id, 
        panel: type || 'analytics' 
      });
    }
  };

  // Chat functionality - Real Universal Governance Adapter Integration
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeSession || chatLoading) return;

    try {
      setChatLoading(true);
      setIsTyping(true);
      
      console.log(`📤 [ChatPanel] Sending message: "${messageInput}"`);
      
      // Check if this is a receipt search query
      const isReceiptSearch = conversationalReceiptSearchService.detectReceiptSearchRequest(messageInput.trim());
      
      // Check if this is a chat reference (for agent processing)
      const chatSharingService = ChatSharingService.getInstance();
      const chatReferenceId = chatSharingService.detectChatReference(messageInput.trim());
      
      if (isReceiptSearch && selectedChatbot && user?.uid) {
        console.log('🔍 [ReceiptSearch] Detected receipt search query');
        
        // Process conversational receipt search
        const searchResponse = await conversationalReceiptSearchService.processConversationalSearch(
          messageInput.trim(),
          selectedChatbot.id,
          user.uid
        );
        
        // Add user message
        const userMessage: ChatMessage = {
          id: `user_${Date.now()}`,
          content: messageInput.trim(),
          sender: 'user',
          timestamp: new Date(),
          attachments: attachedFiles.length > 0 ? attachedFiles : undefined
        };
        
        // Create agent response with search results
        const agentResponse: ChatMessage = {
          id: `agent_${Date.now()}`,
          content: searchResponse.agentResponse,
          sender: 'assistant',
          timestamp: new Date(),
          metadata: {
            searchResults: searchResponse.results,
            searchQuery: searchResponse.query,
            searchTime: searchResponse.searchTime
          }
        };
        
        // Update chat messages in bot state
        if (selectedChatbot) {
          updateBotState(selectedChatbot.id, {
            chatMessages: [...chatMessages, userMessage, agentResponse]
          });
        }
        
        // Save to chat history
        if (currentBotState?.currentChatSession) {
          try {
            await chatHistoryService.addMessageToSession(currentBotState.currentChatSession.id, {
              id: userMessage.id,
              content: userMessage.content,
              sender: userMessage.sender,
              timestamp: userMessage.timestamp,
              agentId: selectedChatbot.id,
              agentName: selectedChatbot.name,
            });
            
            await chatHistoryService.addMessageToSession(currentBotState.currentChatSession.id, {
              id: agentResponse.id,
              content: agentResponse.content,
              sender: agentResponse.sender,
              timestamp: agentResponse.timestamp,
              agentId: selectedChatbot.id,
              agentName: selectedChatbot.name,
              metadata: agentResponse.metadata
            });
          } catch (historyError) {
            console.warn('Failed to save receipt search to chat history:', historyError);
          }
        }
        
        // Clear input and attachments
        setMessageInput('');
        setAttachedFiles([]);
        setChatLoading(false);
        setIsTyping(false);
        
        return;
      } else if (chatReferenceId && selectedChatbot && user?.uid) {
        console.log('🗨️ [ChatReference] Detected chat reference:', chatReferenceId);
        
        // Process chat reference for agent context loading
        const chatContext = await chatSharingService.processChatReference(
          chatReferenceId,
          user.uid,
          selectedChatbot.id
        );
        
        // Add user message
        const userMessage: ChatMessage = {
          id: `user_${Date.now()}`,
          content: messageInput.trim(),
          sender: 'user',
          timestamp: new Date(),
          attachments: attachedFiles.length > 0 ? attachedFiles : undefined
        };
        
        // Create agent response with chat context
        const agentResponse: ChatMessage = {
          id: `agent_${Date.now()}`,
          content: chatContext.agentResponse,
          sender: 'assistant',
          timestamp: new Date(),
          metadata: {
            chatContext: chatContext.context,
            originalChatId: chatContext.originalChatId,
            continuationOptions: chatContext.continuationOptions
          }
        };
        
        // Update chat messages in bot state
        if (selectedChatbot) {
          updateBotState(selectedChatbot.id, {
            chatMessages: [...chatMessages, userMessage, agentResponse]
          });
        }
        
        // Save to chat history
        if (currentBotState?.currentChatSession) {
          try {
            await chatHistoryService.addMessageToSession(currentBotState.currentChatSession.id, {
              id: userMessage.id,
              content: userMessage.content,
              sender: userMessage.sender,
              timestamp: userMessage.timestamp,
              agentId: selectedChatbot.id,
              agentName: selectedChatbot.name,
            });
            
            await chatHistoryService.addMessageToSession(currentBotState.currentChatSession.id, {
              id: agentResponse.id,
              content: agentResponse.content,
              sender: agentResponse.sender,
              timestamp: agentResponse.timestamp,
              agentId: selectedChatbot.id,
              agentName: selectedChatbot.name,
            });
          } catch (historyError) {
            console.warn('Failed to save chat reference to chat history:', historyError);
          }
        }
        
        // Clear input and attachments
        setMessageInput('');
        setAttachedFiles([]);
        setChatLoading(false);
        setIsTyping(false);
        
        return;
      }
      
      // Regular message processing (existing logic)
      const response = await chatPanelGovernanceService.sendMessage(activeSession.sessionId, messageInput.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
      
      // Add user message first
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        content: messageInput.trim(),
        sender: 'user',
        timestamp: new Date(),
        attachments: attachedFiles.length > 0 ? attachedFiles : undefined
      };
      
      // Update messages with user message and bot response in bot state
      if (selectedChatbot) {
        updateBotState(selectedChatbot.id, {
          chatMessages: [...chatMessages, userMessage, response]
        });
      }
      
      // Save messages to chat history if we have a current session
      if (currentBotState?.currentChatSession && selectedChatbot && user?.uid) {
        try {
          // Add user message to chat history
          await chatHistoryService.addMessageToSession(currentBotState.currentChatSession.id, {
            id: userMessage.id,
            content: userMessage.content,
            sender: userMessage.sender,
            timestamp: userMessage.timestamp,
            agentId: selectedChatbot.id,
            agentName: selectedChatbot.name,
          });
          
          // Add agent response to chat history
          await chatHistoryService.addMessageToSession(currentBotState.currentChatSession.id, {
            id: response.id,
            content: response.content,
            sender: response.sender,
            timestamp: response.timestamp,
            agentId: selectedChatbot.id,
            agentName: selectedChatbot.name,
            governanceData: response.governanceData,
            shadowGovernanceData: response.shadowGovernanceData,
          });
        } catch (historyError) {
          console.warn('Failed to save to chat history:', historyError);
          // Don't break the chat flow if history fails
        }
      } else if (!currentBotState?.currentChatSession && selectedChatbot && user?.uid) {
        // Auto-create a new chat session if none exists
        try {
          const newSession = await chatHistoryService.createChatSession(
            selectedChatbot.id,
            selectedChatbot.name,
            user.uid
          );
          updateBotState(selectedChatbot.id, { currentChatSession: newSession });
          
          // Trigger chat history panel refresh
          setChatHistoryRefreshTrigger(prev => prev + 1);
          
          // Add both messages to the new session
          await chatHistoryService.addMessageToSession(newSession.id, {
            id: userMessage.id,
            content: userMessage.content,
            sender: userMessage.sender,
            timestamp: userMessage.timestamp,
            agentId: selectedChatbot.id,
            agentName: selectedChatbot.name,
          });
          
          await chatHistoryService.addMessageToSession(newSession.id, {
            id: response.id,
            content: response.content,
            sender: response.sender,
            timestamp: response.timestamp,
            agentId: selectedChatbot.id,
            agentName: selectedChatbot.name,
            governanceData: response.governanceData,
            shadowGovernanceData: response.shadowGovernanceData,
          });
        } catch (sessionError) {
          console.warn('Failed to create chat session:', sessionError);
        }
      }
      
      setMessageInput('');
      setAttachedFiles([]); // Clear attached files after sending
      
      console.log(`✅ [ChatPanel] Message sent and response received`);
    } catch (error) {
      console.error(`❌ [ChatPanel] Failed to send message:`, error);
      
      // Don't add a generic error message here since the service layer
      // now provides proper fallback responses. The error is already logged.
      // The service will return a proper response even in error conditions.
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
                    Chat with Your Agent{currentBotState?.currentChatName ? ` - ${currentBotState.currentChatName}` : ''}
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
                          justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '75%',
                            textAlign: message.sender === 'user' ? 'right' : 'left'
                          }}
                        >
                          {/* Message Content */}
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.9rem',
                            color: 'white',
                            mb: 0.5
                          }}>
                            {message.content}
                          </Typography>
                          
                          {/* Attachments Display */}
                          {message.attachments && message.attachments.length > 0 && (
                            <Box sx={{ mt: 1, mb: 1 }}>
                              {message.attachments.map((file, index) => {
                                const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
                                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                                
                                if (isImage) {
                                  // Display image preview
                                  const imageUrl = URL.createObjectURL(file);
                                  return (
                                    <Box key={index} sx={{ mt: 1 }}>
                                      <img
                                        src={imageUrl}
                                        alt={file.name}
                                        style={{
                                          maxWidth: '200px',
                                          maxHeight: '200px',
                                          borderRadius: '8px',
                                          cursor: 'pointer'
                                        }}
                                        onClick={() => window.open(imageUrl, '_blank')}
                                      />
                                    </Box>
                                  );
                                } else {
                                  // Display file as downloadable link
                                  const fileUrl = URL.createObjectURL(file);
                                  return (
                                    <Box key={index} sx={{ mt: 1 }}>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                          const a = document.createElement('a');
                                          a.href = fileUrl;
                                          a.download = file.name;
                                          a.click();
                                        }}
                                        sx={{
                                          color: '#3b82f6',
                                          borderColor: '#3b82f6',
                                          '&:hover': {
                                            borderColor: '#2563eb',
                                            bgcolor: 'rgba(59, 130, 246, 0.1)'
                                          }
                                        }}
                                      >
                                        📎 {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                                      </Button>
                                    </Box>
                                  );
                                }
                              })}
                            </Box>
                          )}
                          
                          {/* Timestamp */}
                          <Typography variant="caption" sx={{ 
                            color: '#94a3b8', 
                            fontSize: '0.75rem'
                          }}>
                            {message.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
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
                {/* Connected Apps Preview */}
                {selectedConnectedApps.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block' }}>
                      Connected Apps:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selectedConnectedApps.map((app) => (
                        <Chip
                          key={app.id}
                          avatar={<Avatar sx={{ bgcolor: 'transparent', fontSize: '0.7rem' }}>{app.icon}</Avatar>}
                          label={app.name}
                          onDelete={() => setSelectedConnectedApps(prev => prev.filter(a => a.id !== app.id))}
                          size="small"
                          sx={{ 
                            bgcolor: '#3b82f6', 
                            color: 'white',
                            '& .MuiChip-deleteIcon': { color: 'white' }
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
                
                {/* Attached Files Preview */}
                {attachedFiles.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block' }}>
                      Attached Files:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {attachedFiles.map((file, index) => {
                        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
                        const getFileIcon = (ext: string) => {
                          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
                          if (['pdf'].includes(ext)) return '📄';
                          if (['doc', 'docx'].includes(ext)) return '📝';
                          if (['xls', 'xlsx'].includes(ext)) return '📊';
                          if (['mp3', 'wav', 'ogg'].includes(ext)) return '🎵';
                          if (['mp4', 'avi', 'mov'].includes(ext)) return '🎥';
                          return '📎';
                        };
                        
                        return (
                          <Chip
                            key={index}
                            avatar={<span style={{ fontSize: '14px' }}>{getFileIcon(fileExtension)}</span>}
                            label={file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                            onDelete={() => removeAttachedFile(index)}
                            size="small"
                            sx={{ 
                              bgcolor: '#374151', 
                              color: 'white',
                              '& .MuiChip-deleteIcon': { color: 'white' }
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  {/* Add Menu Button */}
                  <IconButton
                    onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                    sx={{ color: '#94a3b8', mb: 0.5 }}
                  >
                    <Add />
                  </IconButton>
                  
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    onPaste={handlePaste}
                    variant="outlined"
                    disabled={chatLoading}
                    multiline
                    maxRows={4}
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
                  
                  {/* Voice Recording Button */}
                  <IconButton
                    onClick={isRecording ? stopRecording : startRecording}
                    sx={{ 
                      color: isRecording ? '#ef4444' : '#94a3b8',
                      mb: 0.5,
                      '&:hover': { color: isRecording ? '#dc2626' : '#3b82f6' }
                    }}
                  >
                    {isRecording ? <MicOff /> : <Mic />}
                  </IconButton>
                  
                  <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={(!messageInput.trim() && attachedFiles.length === 0) || chatLoading}
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
                
                {/* Add Menu */}
                <Menu
                  anchorEl={addMenuAnchor}
                  open={Boolean(addMenuAnchor)}
                  onClose={() => setAddMenuAnchor(null)}
                  PaperProps={{
                    sx: {
                      bgcolor: '#1e293b',
                      border: '1px solid #334155',
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        '&:hover': { bgcolor: '#374151' }
                      }
                    }
                  }}
                >
                  <MenuItem onClick={() => { fileInputRef.current?.click(); setAddMenuAnchor(null); }}>
                    <AttachFile sx={{ mr: 2 }} />
                    Add photos & files
                  </MenuItem>
                  <MenuItem onClick={() => setAddMenuAnchor(null)}>
                    <SmartToy sx={{ mr: 2 }} />
                    Agent mode
                  </MenuItem>
                  <MenuItem onClick={() => handleSearchReceiptsClick()}>
                    <Receipt sx={{ mr: 2 }} />
                    Search Receipts
                  </MenuItem>
                  <MenuItem onClick={() => setAddMenuAnchor(null)}>
                    <Search sx={{ mr: 2 }} />
                    Deep research
                  </MenuItem>
                  <MenuItem onClick={() => setAddMenuAnchor(null)}>
                    <ImageIcon sx={{ mr: 2 }} />
                    Create image
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      setConnectedAppsMenuOpen(true);
                      setAddMenuAnchor(null);
                    }}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CodeIcon sx={{ mr: 2 }} />
                      Connected apps
                    </Box>
                    {selectedConnectedApps.length > 0 && (
                      <Chip
                        label={selectedConnectedApps.length}
                        size="small"
                        sx={{
                          bgcolor: '#3b82f6',
                          color: 'white',
                          height: 20,
                          fontSize: '0.7rem'
                        }}
                      />
                    )}
                  </MenuItem>
                </Menu>

                {/* Connected Apps Submenu */}
                <Menu
                  anchorEl={addMenuAnchor}
                  open={connectedAppsMenuOpen}
                  onClose={() => setConnectedAppsMenuOpen(false)}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{
                    sx: {
                      bgcolor: '#1e293b',
                      border: '1px solid #334155',
                      minWidth: 300,
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        '&:hover': { bgcolor: '#374151' }
                      }
                    }
                  }}
                >
                  <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                      Connected Apps
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Select apps to use in this conversation
                    </Typography>
                  </Box>
                  
                  {connectedApps.filter(app => app.status === 'connected').length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                        No connected apps available
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setConnectedAppsMenuOpen(false);
                          setRightPanelType('integrations');
                        }}
                        sx={{
                          borderColor: '#3b82f6',
                          color: '#3b82f6',
                          '&:hover': {
                            borderColor: '#2563eb',
                            bgcolor: 'rgba(59, 130, 246, 0.1)'
                          }
                        }}
                      >
                        Connect Apps
                      </Button>
                    </Box>
                  ) : (
                    <>
                      {connectedApps
                        .filter(app => app.status === 'connected')
                        .map((app) => {
                          const isSelected = selectedConnectedApps.some(selected => selected.id === app.id);
                          return (
                            <MenuItem
                              key={app.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedConnectedApps(prev => prev.filter(a => a.id !== app.id));
                                } else {
                                  setSelectedConnectedApps(prev => [...prev, app]);
                                }
                              }}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                bgcolor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                              }}
                            >
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                                {app.icon}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {app.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                  {app.description.slice(0, 40)}...
                                </Typography>
                              </Box>
                              {isSelected && (
                                <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />
                              )}
                            </MenuItem>
                          );
                        })}
                      
                      <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setConnectedAppsMenuOpen(false);
                            setRightPanelType('integrations');
                          }}
                          sx={{
                            borderColor: '#475569',
                            color: '#94a3b8',
                            '&:hover': {
                              borderColor: '#64748b',
                              bgcolor: 'rgba(148, 163, 184, 0.1)'
                            }
                          }}
                        >
                          Manage Connections
                        </Button>
                      </Box>
                    </>
                  )}
                </Menu>
                
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
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
                    { key: 'chats', label: 'CHATS' },
                    { key: 'analytics', label: 'ANALYTICS' },
                    { key: 'customize', label: 'CUSTOMIZE' },
                    { key: 'personality', label: 'PERSONALITY' },
                    { key: 'knowledge', label: 'AI KNOWLEDGE' },
                    { key: 'tools', label: 'TOOLS' },
                    { key: 'integrations', label: 'INTEGRATIONS' },
                    { key: 'rag_policy', label: 'RAG + POLICY' },
                    { key: 'automation', label: 'AUTOMATION' },
                    { key: 'receipts', label: 'RECEIPTS' },
                    { key: 'memory', label: 'MEMORY' },
                    { key: 'sandbox', label: 'SANDBOX' },
                    { key: 'live_agent', label: 'LIVE AGENT' },
                    { key: 'governance', label: 'GOVERNANCE' },
                    { key: 'debug', label: 'DEBUG' }
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
                {rightPanelType === 'chats' && selectedChatbot && (
                  <ChatHistoryPanel
                    agentId={selectedChatbot.id}
                    agentName={selectedChatbot.name}
                    currentSessionId={currentBotState?.currentChatSession?.id}
                    refreshTrigger={currentBotState?.chatHistoryRefreshTrigger || 0} // Use bot state refresh trigger
                    onChatSelect={(session) => {
                      if (selectedChatbotId) {
                        updateBotState(selectedChatbotId, { 
                          currentChatSession: session,
                          currentChatName: session.name || `Chat ${session.id.slice(-8)}`
                        });
                      }
                      // Load the chat messages into the current chat interface
                      const newMessages = session.messages.map(msg => ({
                        id: msg.id,
                        content: msg.content,
                        sender: msg.sender,
                        timestamp: msg.timestamp,
                        agentName: msg.agentName,
                        agentId: msg.agentId,
                        attachments: msg.attachments,
                        governanceData: msg.governanceData,
                        shadowGovernanceData: msg.shadowGovernanceData,
                      }));
                      if (selectedChatbotId) {
                        updateBotState(selectedChatbotId, { chatMessages: newMessages });
                      }
                    }}
                    onNewChat={(session) => {
                      if (selectedChatbotId) {
                        if (session) {
                          // New chat created - set the session and name
                          updateBotState(selectedChatbotId, {
                            currentChatSession: session,
                            currentChatName: session.name || `Chat ${session.id.slice(-8)}`,
                            chatMessages: []
                          });
                          // Trigger chat history panel refresh
                          setChatHistoryRefreshTrigger(prev => prev + 1);
                        } else {
                          // Clear current chat and start fresh
                          updateBotState(selectedChatbotId, {
                            currentChatSession: null,
                            currentChatName: '',
                            chatMessages: []
                          });
                        }
                      }
                      setMessageInput('');
                      setAttachedFiles([]);
                    }}
                    onShareChat={(contextId) => {
                      setSharedChatContext(contextId);
                      // Show success message or notification
                      console.log('Chat shared with agent:', contextId);
                    }}
                  />
                )}

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
                              {getRealMetricsSync(selectedChatbot).responseTime.toFixed(1)}s
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
                              {getRealMetricsSync(selectedChatbot).satisfactionScore.toFixed(1)}/5
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
                              {getRealMetricsSync(selectedChatbot).resolutionRate}%
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
                              {getRealMetricsSync(selectedChatbot).lastActive}
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
                              {getRealMetricsSync(selectedChatbot).messageVolume.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Governance Alerts
                            </Typography>
                            <Typography variant="body1" sx={{ color: getRealMetricsSync(selectedChatbot).governanceAlerts > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                              {getRealMetricsSync(selectedChatbot).governanceAlerts}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Health Score
                            </Typography>
                            <Typography variant="body1" sx={{ color: getRealMetricsSync(selectedChatbot).healthScore >= 90 ? '#10b981' : getRealMetricsSync(selectedChatbot).healthScore >= 80 ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>
                              {getRealMetricsSync(selectedChatbot).healthScore}%
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
                
                {rightPanelType === 'integrations' && (
                  <ConnectedAppsPanel
                    onClose={() => setRightPanelType(null)}
                    onAppConnect={(app: ConnectedApp) => {
                      console.log('✅ App connected:', app.name);
                      // You could update the chatbot's connected apps here
                    }}
                    onAppDisconnect={(app: ConnectedApp) => {
                      console.log('✅ App disconnected:', app.name);
                      // You could update the chatbot's connected apps here
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
                              {getRealMetricsSync(selectedChatbot).responseTime.toFixed(1)}s
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
                              {getRealMetricsSync(selectedChatbot).satisfactionScore.toFixed(1)}/5
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
                              {getRealMetricsSync(selectedChatbot).resolutionRate}%
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
                              {getRealMetricsSync(selectedChatbot).lastActive}
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
                              {getRealMetricsSync(selectedChatbot).messageVolume.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Governance Alerts
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                              {getRealMetricsSync(selectedChatbot).governanceAlerts}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Health Score
                            </Typography>
                            <Typography variant="body1" sx={{ color: getRealMetricsSync(selectedChatbot).healthScore >= 90 ? '#10b981' : getRealMetricsSync(selectedChatbot).healthScore >= 80 ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>
                              {getRealMetricsSync(selectedChatbot).healthScore}%
                            </Typography>
                          </Box>
                        </Stack>
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

                {rightPanelType === 'debug' && (
                  <DebugPanel darkTheme={{
                    background: '#1e293b',
                    border: '#334155',
                    text: {
                      primary: 'white',
                      secondary: '#94a3b8'
                    },
                    primary: '#3b82f6',
                    success: '#10b981',
                    warning: '#f59e0b',
                    error: '#ef4444',
                    hover: '#334155'
                  }} />
                )}

                {rightPanelType === 'rag_policy' && (
                  <RAGPolicyPanel
                    agentId={selectedChatbot?.id || ''}
                    onClose={() => setRightPanelType(null)}
                  />
                )}

                {rightPanelType === 'policies' && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                      Policy Management
                    </Typography>

                    {/* Policy Management Section */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ color: 'white', mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                          🛡️ Policy Management
                        </Typography>

                        {/* Standard Policies */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                            Standard Compliance Policies:
                          </Typography>
                          {['HIPAA', 'SOC2', 'GDPR', 'PCI DSS'].map((policy) => (
                            <FormControlLabel
                              key={policy}
                              control={
                                <Checkbox
                                  defaultChecked={policy === 'SOC2'}
                                  sx={{ color: '#3b82f6' }}
                                />
                              }
                              label={policy}
                              sx={{ color: '#94a3b8', display: 'block', mb: 1 }}
                            />
                          ))}
                        </Box>

                        {/* Custom Policy Upload */}
                        <Button
                          variant="outlined"
                          fullWidth
                          component="label"
                          sx={{
                            mb: 2,
                            borderColor: '#f59e0b',
                            color: '#f59e0b',
                            '&:hover': { borderColor: '#d97706', bgcolor: 'rgba(245, 158, 11, 0.1)' }
                          }}
                        >
                          📋 Upload Custom Policies
                          <input
                            type="file"
                            hidden
                            multiple
                            accept=".json,.yaml,.yml,.txt"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              console.log('🛡️ [Policy] Uploading custom policies:', files.map(f => f.name));
                              // TODO: Integrate with PolicyExtension
                            }}
                          />
                        </Button>

                        {/* Policy Status */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                            Active Policies: 3 | Custom Policies: 1
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={85} 
                            sx={{ 
                              bgcolor: '#374151',
                              '& .MuiLinearProgress-bar': { bgcolor: '#10b981' }
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#10b981', mt: 1, display: 'block' }}>
                            85% Policy Compliance
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>

                    {/* RAG + Policy Integration */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ color: 'white', mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                          🔗 RAG + Policy Integration
                        </Typography>

                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                          Governance-aware knowledge retrieval ensures all RAG responses comply with active policies.
                        </Typography>

                        {/* Integration Settings */}
                        <Box sx={{ mb: 2 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                defaultChecked
                                sx={{ color: '#3b82f6' }}
                              />
                            }
                            label="Filter knowledge by policy compliance"
                            sx={{ color: '#94a3b8', display: 'block', mb: 1 }}
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                defaultChecked
                                sx={{ color: '#3b82f6' }}
                              />
                            }
                            label="Log all RAG retrievals for audit"
                            sx={{ color: '#94a3b8', display: 'block', mb: 1 }}
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                sx={{ color: '#3b82f6' }}
                              />
                            }
                            label="Require approval for sensitive knowledge"
                            sx={{ color: '#94a3b8', display: 'block' }}
                          />
                        </Box>

                        {/* Apply Settings */}
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => {
                            console.log('🔗 [RAG+Policy] Applying integration settings');
                            // TODO: Integrate with UniversalGovernanceAdapter
                          }}
                          sx={{
                            bgcolor: '#3b82f6',
                            '&:hover': { bgcolor: '#2563eb' }
                          }}
                        >
                          Apply RAG + Policy Settings
                        </Button>
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
                  const metrics = getMetricsForChatbot(chatbot);
                  const governanceType = getGovernanceType(chatbot);
                  const modelProvider = getModelProvider(chatbot);
                  const isNativeAgent = governanceType === 'BYOK';
                  const isSelected = selectedChatbot?.identity.id === chatbot.identity.id;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={chatbot.id}>
                      <Card
                        sx={{
                          bgcolor: isSelected ? '#2563eb' : '#1e293b',
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
                                  bgcolor: modelProvider.color,
                                  border: '2px solid',
                                  borderColor: modelProvider.color
                                }}
                              >
                                {chatbot.identity.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
                                  {chatbot.identity.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                                  {chatbot.identity.role}
                                </Typography>
                              </Box>
                            </Box>
                            <IconButton
                              size="small"
                              sx={{ color: '#6b7280', '&:hover': { color: '#9ca3af' } }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add menu functionality here
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Box>

                          {/* Agent Type and Health Chips */}
                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip
                              label={governanceType}
                              size="small"
                              sx={{
                                bgcolor: governanceType === 'BYOK' ? '#10b981' : governanceType === 'Enterprise' ? '#3b82f6' : '#f59e0b',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                            <Chip
                              label={`${metrics.healthScore}% Health`}
                              size="small"
                              sx={{
                                bgcolor: metrics.healthScore >= 90 ? '#065f46' : metrics.healthScore >= 70 ? '#ca8a04' : '#dc2626',
                                color: 'white',
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>

                          {/* Description */}
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#d1d5db',
                              mb: 2,
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              flex: 1,
                              fontSize: '0.875rem'
                            }}
                          >
                            {chatbot.identity.description}
                          </Typography>

                          {/* Governance ID */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.75rem', mb: 0.5 }}>
                              Gov ID
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#d1d5db', 
                                fontFamily: 'monospace',
                                fontWeight: 500,
                                fontSize: '0.875rem'
                              }}
                            >
                              {(() => {
                                // Generate governance ID like My Agents
                                if (chatbot.governanceId) return chatbot.governanceId;
                                const numericPart = chatbot.identity?.id?.replace(/[^0-9]/g, '')?.slice(-8) || '00000000';
                                const namePart = chatbot.identity?.name?.replace(/[^A-Z]/g, '')?.slice(0, 4) || 'UNKN';
                                return `GID-${numericPart}-${namePart}`;
                              })()}
                            </Typography>
                          </Box>

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
                                  {Math.round(metrics.responseTime * 1000)}ms
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
                                fontSize: '0.75rem'
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                              {chatbot.apiDetails?.selectedModel || chatbot.configuration?.selectedModel || 'Model not specified'}
                            </Typography>
                          </Box>

                          {/* Action Buttons */}
                          <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Settings />}
                              sx={{
                                borderColor: '#4a5568',
                                color: '#d1d5db',
                                fontSize: '0.75rem',
                                '&:hover': { 
                                  borderColor: '#6b7280', 
                                  backgroundColor: '#374151' 
                                },
                                flex: 1
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleManageChatbot(chatbot.id);
                              }}
                            >
                              Manage
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Rocket />}
                              sx={{
                                backgroundColor: '#4b5563',
                                color: 'white',
                                fontSize: '0.75rem',
                                '&:hover': { backgroundColor: '#6b7280' },
                                flex: 1
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChatbotSelect(chatbot);
                              }}
                            >
                              Command Center
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

        {/* Chatbot Management Modal - Only show for real chatbots */}
        {manageModalOpen && manageChatbotId && user?.uid && (
          <AgentManageModal
            open={manageModalOpen}
            onClose={() => {
              setManageModalOpen(false);
              setManageChatbotId(null);
            }}
            agentId={manageChatbotId}
            onAgentUpdated={async (updatedAgent) => {
              // Refresh the chatbots list to show updated data
              await loadChatbots();
            }}
            onAgentDeleted={async (deletedAgentId) => {
              // Refresh the chatbots list to remove deleted agent
              await loadChatbots();
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ChatbotProfilesPageEnhanced;

