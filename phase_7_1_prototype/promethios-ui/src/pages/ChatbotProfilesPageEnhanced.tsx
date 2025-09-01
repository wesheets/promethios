import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AttachmentRenderer from '../components/AttachmentRenderer';
// Enhanced team collaboration imports
import { TeamCollaborationIntegrationService, TeamCollaborationState, CollaborationNotification } from '../services/TeamCollaborationIntegrationService';
import { OrganizationManagementService, Organization } from '../services/OrganizationManagementService';
import HumanChatService, { TeamMember, TeamConversation, HumanMessage } from '../services/HumanChatService';
// Multi-agent collaboration imports
import { MultiAgentRoutingService, AgentResponse } from '../services/MultiAgentRoutingService';
import HumanParticipantService, { HumanParticipant } from '../services/HumanParticipantService';
import { MultiAgentAuditLogger } from '../services/MultiAgentAuditLogger';
import { MessageParser, ParsedMessage } from '../utils/MessageParser';
import MultiAgentMentionInput from '../components/MultiAgentMentionInput';
import AgentAvatarSelector from '../components/AgentAvatarSelector';
import MASCollaborationPanel, { MASCollaborationSettings } from '../components/collaboration/MASCollaborationPanel';
import SmartSuggestionService, { AgentSuggestion } from '../services/SmartSuggestionService';
import AgentSuggestionIndicator from '../components/collaboration/AgentSuggestionIndicator';
// Shared conversation imports
import SharedChatTabs, { SharedConversation } from '../components/collaboration/SharedChatTabs';
import SharedConversationService from '../services/SharedConversationService';
import { useSharedConversations } from '../contexts/SharedConversationContext';
// Notification and invitation imports
import ConversationInvitationDialog, { InvitationFormData } from '../components/collaboration/ConversationInvitationDialog';
import UserDiscoveryDialog, { PromethiosUser } from '../components/collaboration/UserDiscoveryDialog';
import InAppNotificationPopup, { ConversationInvitationNotification } from '../components/collaboration/InAppNotificationPopup';
import ConversationNotificationService from '../services/ConversationNotificationService';
import aiCollaborationInvitationService, { AICollaborationInvitationRequest } from '../services/ChatInvitationService';
import { useConnections } from '../hooks/useConnections';
// Removed MultiAgentResponseIndicator - intrusive orange popup
// Real-time collaboration imports
import RealTimeConversationSync from '../services/RealTimeConversationSync';
import AgentPermissionService, { PermissionNotification } from '../services/AgentPermissionService';
import AgentPermissionRequestPopup from '../components/collaboration/AgentPermissionRequestPopup';
import AIObservationService, { AIObservationState } from '../services/AIObservationService';
import AIObservationToggle from '../components/collaboration/AIObservationToggle';
// Token economics imports
import { TokenEconomicsService } from '../services/TokenEconomicsService';
import TokenBudgetWidget from '../components/TokenBudgetWidget';
import TokenResponseIcon from '../components/TokenResponseIcon';
import TokenEconomicsConfigPanel from '../components/TokenEconomicsConfigPanel';
import TokenBudgetPopup from '../components/TokenBudgetPopup';
// Autonomous systems imports
import { AutonomousGovernanceExtension, AutonomousTaskPlan, AutonomousPhase, AutonomousExecutionState } from '../services/AutonomousGovernanceExtension';
import { AutonomousTaskPlanningEngine } from '../services/AutonomousTaskPlanningEngine';
import { AutonomousComplianceMonitor } from '../services/AutonomousComplianceMonitor';
import { AutonomousRiskAssessment } from '../services/AutonomousRiskAssessment';
import { AutonomousApprovalWorkflow } from '../services/AutonomousApprovalWorkflow';
// Repository and workflow imports
import { WorkflowRepositoryManager, WorkflowProject, ProjectTemplate } from '../services/WorkflowRepositoryManager';
import { RepositoryVersionControl } from '../services/RepositoryVersionControl';
import { RepositoryExtensionService } from '../services/RepositoryExtensionService';
import RepositoryBrowser from '../components/workflow/RepositoryBrowser';
// Behavioral orchestration imports
import HoverOrchestrationTrigger, { ParticipantData } from '../components/collaboration/HoverOrchestrationTrigger';
import { BehavioralSettings } from '../components/collaboration/BehavioralOrchestrationControls';
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
  AvatarGroup,
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Analytics,
  Palette,
  Psychology,
  Settings,
  Close as CloseIcon,
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
  AccountBalanceWallet as WalletIcon,
  Add,
  PersonAdd,
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
import ChatbotStorageService, { ChatbotProfile } from '../services/ChatbotStorageService';
import { connectedAppsService, ConnectedApp } from '../services/ConnectedAppsService';
import ConnectedAppsPanel from '../components/tools/ConnectedAppsPanel';
import ChatHistoryPanel from '../components/chat/ChatHistoryPanel';
import ChatReferencePreview from '../components/chat/ChatReferencePreview';
import { chatHistoryService, ChatSession as ChatHistorySession } from '../services/ChatHistoryService';
import { AgentReceiptViewer } from '../components/receipts/AgentReceiptViewer';
import { AgentMemoryViewer } from '../components/memory/AgentMemoryViewer';
import { LiveAgentSandbox } from '../components/sandbox/LiveAgentSandbox';
import { SimplifiedKnowledgeViewer } from '../components/knowledge/SimplifiedKnowledgeViewer';
import WidgetCustomizer from '../components/chat/customizer/WidgetCustomizer';
import PersonalityEditor from '../components/chat/customizer/PersonalityEditor';
import { WidgetCustomizerProvider, useWidgetCustomizer } from '../context/WidgetCustomizerContext';
import { chatPanelGovernanceService, ChatSession, ChatMessage, ChatResponse } from '../services/ChatPanelGovernanceService';
import { ChatSharingService } from '../services/ChatSharingService';
import { ReceiptSharingService } from '../services/ReceiptSharingService';
import ToolConfigurationPanel from '../components/tools/ToolConfigurationPanel';
import ChatInterfacePanel from '../components/chat/ChatInterfacePanel';
import { RAGPolicyPanel } from '../components/governance/RAGPolicyPanel';
import { AgentToolProfile } from '../types/ToolTypes';
import { conversationalReceiptSearchService } from '../services/ConversationalReceiptSearchService';
import AgentManageModal from '../components/AgentManageModal';
import DebugPanel from '../components/DebugPanel';
import TeamPanel from '../components/team/TeamPanel';

// Right panel types
type RightPanelType = 'team' | 'chats' | 'analytics' | 'customize' | 'personality' | 'knowledge' | 'automation' | 'deployment' | 'settings' | 'chat' | 'tools' | 'integrations' | 'receipts' | 'memory' | 'sandbox' | 'workspace' | 'ai_knowledge' | 'governance' | 'rag_policy' | 'debug' | 'token_economics' | null;

// Multi-chat context types
type ChatContextType = 'ai_agent' | 'human_chat' | 'team_channel';

interface ChatContext {
  id: string;
  type: ChatContextType;
  name: string;
  avatar?: string;
  isActive: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  canClose: boolean; // AI agent can't be closed, humans/channels can
  // Multi-agent support
  hostAgentId?: string; // The main agent (command center owner)
  guestAgents?: Array<{
    agentId: string;
    name: string;
    avatar?: string;
    addedAt: Date;
  }>;
}

interface MultiChatState {
  activeContextId: string;
  contexts: ChatContext[];
  sidePanel: {
    isOpen: boolean;
    selectedContactId?: string;
  };
}

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
    
    // Initialize autonomous systems
    const initializeAutonomousSystems = async () => {
      try {
        console.log('🤖 [Autonomous] Initializing autonomous systems...');
        
        // Initialize autonomous governance
        const governance = new AutonomousGovernanceExtension();
        setAutonomousGovernance(governance);
        
        // Set up autonomous event listeners
        governance.onTaskPlanCreated((taskPlan: AutonomousTaskPlan) => {
          console.log('🤖 [Autonomous] Task plan created:', taskPlan);
          setCurrentTaskPlan(taskPlan);
          setAutonomousMode(true);
          setLiveAgentPanelOpen(true); // Auto-open Live Agent panel
        });
        
        governance.onExecutionStateChanged((state: AutonomousExecutionState) => {
          console.log('🤖 [Autonomous] Execution state changed:', state);
          setAutonomousExecutionState(state);
        });
        
        governance.onTaskCompleted((taskPlan: AutonomousTaskPlan) => {
          console.log('🤖 [Autonomous] Task completed:', taskPlan);
          setAutonomousMode(false);
          // Keep Live Agent panel open to show completion status
        });
        
        console.log('✅ [Autonomous] Autonomous systems initialized successfully');
      } catch (error) {
        console.error('❌ [Autonomous] Failed to initialize autonomous systems:', error);
      }
    };

    // Initialize repository systems
    const initializeRepositorySystems = async () => {
      try {
        console.log('📁 [Repository] Initializing repository systems...');
        
        // Load project templates
        const templates = await repositoryManager.getProjectTemplates();
        setProjectTemplates(templates);
        
        // Load user projects
        const userProjects = await repositoryManager.getUserProjects(user?.uid || 'anonymous');
        setProjects(userProjects);
        
        console.log('✅ [Repository] Repository systems initialized successfully');
      } catch (error) {
        console.error('❌ [Repository] Failed to initialize repository systems:', error);
      }
    };
    
    initializeAutonomousSystems();
    initializeRepositorySystems();
    
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
  const { connections, loading: connectionsLoading } = useConnections();
  
  // Debug counter to track re-renders
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  
  // Circuit breaker to prevent infinite re-renders (DISABLED for tool calling debugging)
  const MAX_RENDERS = 1000; // Temporarily disabled - increased to very high number
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
  
  // Enhanced team collaboration services
  const [collaborationService] = useState(() => TeamCollaborationIntegrationService.getInstance());
  const [orgService] = useState(() => OrganizationManagementService.getInstance());
  const [humanChatService] = useState(() => HumanChatService.getInstance());
  
  // Multi-agent collaboration services
  const [multiAgentRoutingService] = useState(() => MultiAgentRoutingService.getInstance());
  const [multiAgentAuditLogger] = useState(() => MultiAgentAuditLogger.getInstance());
  const [messageParser] = useState(() => MessageParser.getInstance());
  
  // Token economics service
  const [tokenEconomicsService] = useState(() => TokenEconomicsService.getInstance());
  
  // Multi-agent state
  const [isMultiAgentMode, setIsMultiAgentMode] = useState(false);
  const [multiAgentResponses, setMultiAgentResponses] = useState<AgentResponse[]>([]);
  const [isProcessingMultiAgent, setIsProcessingMultiAgent] = useState(false);
  const [targetAgents, setTargetAgents] = useState<string[]>([]);
  const [currentMultiAgentSession, setCurrentMultiAgentSession] = useState<string | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]); // For avatar selector
  
  // Enhanced smart thinking indicator state
  const [currentRespondingAgent, setCurrentRespondingAgent] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  const [currentActivity, setCurrentActivity] = useState('');
  const [thinkingAgents, setThinkingAgents] = useState<Array<{
    id: string;
    name: string;
    avatar?: string;
    activity: string;
    startTime: number;
  }>>([]);
  const [behaviorPromptActive, setBehaviorPromptActive] = useState<{
    agentId: string;
    behavior: string;
    timestamp: number;
  } | null>(null);
  
  // Human participants state
  const [humanParticipants, setHumanParticipants] = useState<HumanParticipant[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showHumanInviteConfirmDialog, setShowHumanInviteConfirmDialog] = useState(false);
  const [humansToInvite, setHumansToInvite] = useState<any[]>([]);
  const [pendingHumanInvites, setPendingHumanInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>(''); // Current messaging target (human or agent ID)
  const humanParticipantService = HumanParticipantService.getInstance();
  
  // Shared conversation state (now global)
  const {
    sharedConversations,
    activeSharedConversation,
    isInSharedMode,
    handleSharedConversationSelect,
    handleSharedConversationClose,
    handlePrivacyToggle,
    refreshSharedConversations
  } = useSharedConversations();
  const sharedConversationService = SharedConversationService.getInstance();
  
  // Notification and invitation state
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [showUserDiscoveryDialog, setShowUserDiscoveryDialog] = useState(false);
  const [activeNotifications, setActiveNotifications] = useState<ConversationInvitationNotification[]>([]);
  const [currentConversationForInvite, setCurrentConversationForInvite] = useState<string | null>(null);
  const conversationNotificationService = ConversationNotificationService.getInstance();
  
  // Real-time collaboration state
  const [permissionNotifications, setPermissionNotifications] = useState<PermissionNotification[]>([]);
  const [typingIndicators, setTypingIndicators] = useState<Map<string, any[]>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const realTimeSync = RealTimeConversationSync.getInstance();
  const agentPermissionService = AgentPermissionService.getInstance();
  
  // AI observation and privacy state
  const [observationState, setObservationState] = useState<AIObservationState | null>(null);
  const [showPrivacyControls, setShowPrivacyControls] = useState(false);
  const aiObservationService = AIObservationService.getInstance();
  
  // Behavioral orchestration state
  const [participantData, setParticipantData] = useState<ParticipantData[]>([]);
  const [behavioralSettings, setBehavioralSettings] = useState<Map<string, BehavioralSettings>>(new Map());
  
  // @Mention system state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{
    type: 'agent' | 'human';
    id: string;
    name: string;
    avatar?: string;
  }>>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  
  // Token economics state
  const [showTokenBudget, setShowTokenBudget] = useState(false);
  const [budgetExceeded, setBudgetExceeded] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState(false);
  
  // Repository and workflow services
  const [repositoryManager] = useState(() => new WorkflowRepositoryManager());
  const [versionControl] = useState(() => new RepositoryVersionControl());
  const [repositoryExtensions] = useState(() => new RepositoryExtensionService());
  const [projects, setProjects] = useState<WorkflowProject[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  
  // Bot-specific state management
  const [botStates, setBotStates] = useState<Map<string, BotState>>(new Map());
  
  // Multi-chat state management
  const [multiChatState, setMultiChatState] = useState<MultiChatState>({
    activeContextId: 'ai_agent',
    contexts: [],
    sidePanel: {
      isOpen: false
    }
  });
  
  // Enhanced team collaboration state
  const [collaborationState, setCollaborationState] = useState<TeamCollaborationState | null>(null);
  const [notifications, setNotifications] = useState<CollaborationNotification[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [unreadTeamCount, setUnreadTeamCount] = useState(0);
  
  // Autonomous systems state
  const [autonomousGovernance, setAutonomousGovernance] = useState<AutonomousGovernanceExtension | null>(null);
  const [currentTaskPlan, setCurrentTaskPlan] = useState<AutonomousTaskPlan | null>(null);
  const [autonomousExecutionState, setAutonomousExecutionState] = useState<AutonomousExecutionState | null>(null);
  const [liveAgentPanelOpen, setLiveAgentPanelOpen] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [autonomousStarsActive, setAutonomousStarsActive] = useState(false);
  
  // Autonomous Stars state
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [contextPredictions, setContextPredictions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [proactiveAssistance, setProactiveAssistance] = useState<string | null>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add metrics caching to prevent repeated calculations
  const metricsCache = useRef<Map<string, { metrics: ChatbotMetrics; timestamp: number }>>(new Map());
  const metricsLoadingPromises = useRef<Map<string, Promise<ChatbotMetrics>>>(new Map());
  const METRICS_CACHE_DURATION = 30000; // 30 seconds cache
  
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
  
  // Debug workspace mode
  console.log(`🔍 [WORKSPACE DEBUG] selectedChatbotId: ${selectedChatbotId}`);
  console.log(`🔍 [WORKSPACE DEBUG] currentBotState:`, currentBotState);
  console.log(`🔍 [WORKSPACE DEBUG] isWorkspaceMode: ${isWorkspaceMode}`);
  
  // Debug logging for chat state
  if (renderCountRef.current <= 5 || renderCountRef.current % 5 === 0) {
    console.log(`🔍 [ChatState] RENDER #${renderCountRef.current} - selectedChatbotId: ${selectedChatbotId}`);
    console.log(`🔍 [ChatState] RENDER #${renderCountRef.current} - currentBotState exists: ${!!currentBotState}`);
    console.log(`🔍 [ChatState] RENDER #${renderCountRef.current} - chatMessages.length: ${chatMessages.length}`);
    if (chatMessages.length > 0) {
      console.log(`🔍 [ChatState] RENDER #${renderCountRef.current} - Last message: ${chatMessages[chatMessages.length - 1]?.content?.substring(0, 50)}...`);
    }
  }
  
  // Remaining global state (not bot-specific)
  const [messageInput, setMessageInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Chat enhancements
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [connectedAppsMenuOpen, setConnectedAppsMenuOpen] = useState(false);
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  
  // Chat reference preview state
  const [activeChatReference, setActiveChatReference] = useState<{
    id: string;
    name: string;
    preview: string;
    messageCount: number;
    lastUpdated: Date;
    topics?: string[];
  } | null>(null);
  const [selectedConnectedApps, setSelectedConnectedApps] = useState<ConnectedApp[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File attachment and voice recording states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [sharedChatContext, setSharedChatContext] = useState<string | null>(null);
  
  // Enhanced action indicators
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [actionStartTime, setActionStartTime] = useState<Date | null>(null);

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

  // Multi-chat context management functions
  const initializeMultiChatContexts = (selectedChatbot: ChatbotProfile | null) => {
    const aiContext: ChatContext = {
      id: 'ai_agent',
      type: 'ai_agent',
      name: selectedChatbot?.identity?.name || 'AI Agent',
      avatar: selectedChatbot?.identity?.avatar,
      isActive: true,
      unreadCount: 0,
      canClose: false,
      // Multi-agent support
      hostAgentId: selectedChatbot?.identity?.id || selectedChatbot?.key || selectedChatbot?.id,
      guestAgents: []
    };

    setMultiChatState(prev => ({
      ...prev,
      activeContextId: 'ai_agent',
      contexts: [aiContext]
    }));
  };

  const addChatContext = (context: Omit<ChatContext, 'isActive'>) => {
    setMultiChatState(prev => {
      const existingContext = prev.contexts.find(c => c.id === context.id);
      if (existingContext) {
        // Switch to existing context
        return {
          ...prev,
          activeContextId: context.id,
          contexts: prev.contexts.map(c => ({
            ...c,
            isActive: c.id === context.id
          }))
        };
      }

      // Add new context
      const newContext: ChatContext = {
        ...context,
        isActive: true
      };

      return {
        ...prev,
        activeContextId: context.id,
        contexts: prev.contexts.map(c => ({ ...c, isActive: false })).concat(newContext)
      };
    });
  };

  const removeChatContext = (contextId: string) => {
    setMultiChatState(prev => {
      const filteredContexts = prev.contexts.filter(c => c.id !== contextId);
      const wasActive = prev.activeContextId === contextId;
      
      // If removing active context, switch to AI agent
      const newActiveId = wasActive ? 'ai_agent' : prev.activeContextId;
      
      return {
        ...prev,
        activeContextId: newActiveId,
        contexts: filteredContexts.map(c => ({
          ...c,
          isActive: c.id === newActiveId
        }))
      };
    });
  };

  const switchChatContext = (contextId: string) => {
    setMultiChatState(prev => ({
      ...prev,
      activeContextId: contextId,
      contexts: prev.contexts.map(c => ({
        ...c,
        isActive: c.id === contextId
      }))
    }));
  };

  const toggleSidePanel = () => {
    setMultiChatState(prev => ({
      ...prev,
      sidePanel: {
        ...prev.sidePanel,
        isOpen: !prev.sidePanel.isOpen
      }
    }));
  };

  // Multi-agent management functions
  const addGuestAgent = (agentId: string, agentName: string, agentAvatar?: string) => {
    console.log(`🤖 [Multi-Agent] Adding guest agent: ${agentName} (${agentId})`);
    
    setMultiChatState(prev => {
      const activeContext = prev.contexts.find(c => c.isActive);
      if (!activeContext || activeContext.type !== 'ai_agent') {
        console.warn('❌ [Multi-Agent] Can only add guest agents to AI agent contexts');
        return prev;
      }

      // Check if agent is already a guest
      const isAlreadyGuest = activeContext.guestAgents?.some(g => g.agentId === agentId);
      if (isAlreadyGuest) {
        console.warn('❌ [Multi-Agent] Agent is already a guest in this chat');
        return prev;
      }

      const updatedContexts = prev.contexts.map(context => {
        if (context.id === activeContext.id) {
          return {
            ...context,
            guestAgents: [
              ...(context.guestAgents || []),
              {
                agentId,
                name: agentName,
                avatar: agentAvatar,
                addedAt: new Date()
              }
            ]
          };
        }
        return context;
      });

      return {
        ...prev,
        contexts: updatedContexts
      };
    });
  };

  const removeGuestAgent = (agentId: string) => {
    console.log(`🗑️ [Multi-Agent] Removing guest agent: ${agentId}`);
    
    setMultiChatState(prev => {
      const activeContext = prev.contexts.find(c => c.isActive);
      if (!activeContext || activeContext.type !== 'ai_agent') {
        return prev;
      }

      const updatedContexts = prev.contexts.map(context => {
        if (context.id === activeContext.id) {
          return {
            ...context,
            guestAgents: context.guestAgents?.filter(g => g.agentId !== agentId) || []
          };
        }
        return context;
      });

      return {
        ...prev,
        contexts: updatedContexts
      };
    });
  };

  // Live Agent panel control functions
  const toggleLiveAgentPanel = () => {
    setLiveAgentPanelOpen(prev => !prev);
  };

  const handleLiveAgentTabClick = () => {
    toggleLiveAgentPanel();
  };

  const startAutonomousMode = async (goal: string) => {
    if (!autonomousGovernance) {
      console.error('❌ [Autonomous] Governance system not initialized');
      return;
    }

    try {
      console.log('🤖 [Autonomous] Starting autonomous mode with goal:', goal);
      setAutonomousStarsActive(true);
      
      // Create task plan
      const taskPlan = await autonomousGovernance.createTaskPlan({
        goal,
        description: `Autonomous task: ${goal}`,
        agentId: selectedChatbotId || 'default',
        userId: user?.uid || 'anonymous'
      });
      
      // Auto-open Live Agent panel
      setLiveAgentPanelOpen(true);
      
      console.log('✅ [Autonomous] Autonomous mode started successfully');
    } catch (error) {
      console.error('❌ [Autonomous] Failed to start autonomous mode:', error);
    }
  };

  const stopAutonomousMode = () => {
    if (autonomousGovernance && currentTaskPlan) {
      autonomousGovernance.pauseExecution(currentTaskPlan.id);
    }
    setAutonomousMode(false);
    setAutonomousStarsActive(false);
  };

  // Helper function to update chat history refresh trigger
  const setChatHistoryRefreshTrigger = (updater: (prev: number) => number) => {
    if (selectedChatbotId) {
      const currentState = botStates.get(selectedChatbotId) || initializeBotState(selectedChatbotId);
      const newTrigger = updater(currentState.chatHistoryRefreshTrigger);
      updateBotState(selectedChatbotId, { chatHistoryRefreshTrigger: newTrigger });
    }
  };

  // Get real metrics from chatbot data and governance service (cached to prevent repeated calls)
  const getRealMetrics = useCallback(async (chatbot: ChatbotProfile): Promise<ChatbotMetrics> => {
    const agentId = chatbot.identity?.id || chatbot.key || chatbot.id;
    
    // Check cache first
    const cached = metricsCache.current.get(agentId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < METRICS_CACHE_DURATION) {
      console.log(`🎯 [Metrics] Using cached metrics for agent: ${agentId}`);
      return cached.metrics;
    }
    
    // Check if already loading
    const existingPromise = metricsLoadingPromises.current.get(agentId);
    if (existingPromise) {
      console.log(`🔄 [Metrics] Already loading metrics for agent, waiting: ${agentId}`);
      return await existingPromise;
    }
    
    // Create new loading promise
    const loadingPromise = loadMetricsFromServices(chatbot, agentId, now);
    metricsLoadingPromises.current.set(agentId, loadingPromise);
    
    try {
      const result = await loadingPromise;
      return result;
    } finally {
      metricsLoadingPromises.current.delete(agentId);
    }
  }, [user?.uid]);

  const loadMetricsFromServices = async (chatbot: ChatbotProfile, agentId: string, now: number): Promise<ChatbotMetrics> => {
    try {
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
      
      // Cache the results
      metricsCache.current.set(agentId, { metrics: realMetrics, timestamp: now });
      
      return realMetrics;
    } catch (error) {
      console.error(`❌ [Metrics] Error loading metrics for ${agentId}:`, error);
      
      // Return fallback metrics on error
      const fallbackMetrics = {
        healthScore: 85,
        trustScore: 85,
        performanceRating: 85,
        messageVolume: 0,
        responseTime: 1.2,
        satisfactionScore: 4.5,
        resolutionRate: 85,
        lastActive: 'Unknown',
        governanceAlerts: 0,
      };
      
      // Cache fallback metrics for a shorter duration
      metricsCache.current.set(agentId, { metrics: fallbackMetrics, timestamp: now - (METRICS_CACHE_DURATION / 2) });
      
      return fallbackMetrics;
    }
  };

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

  // Add loading circuit breaker
  const loadingChatbotsRef = useRef(false);

  const loadChatbots = useCallback(async () => {
    console.log('🔍 loadChatbots called, user:', user?.uid);
    console.log('🔍 loadChatbots called, authLoading:', authLoading);
    console.log('🔍 ChatbotStorageService instance:', chatbotService);
    
    // Circuit breaker: prevent multiple simultaneous calls
    if (loadingChatbotsRef.current) {
      console.log('🔄 Already loading chatbots, skipping duplicate call');
      return;
    }
    
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
      // Set loading circuit breaker
      loadingChatbotsRef.current = true;
      
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
      // Clear loading circuit breaker
      loadingChatbotsRef.current = false;
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

  // Visual Threading System for Behavior Prompt Responses
  const getMessageType = (message, index, messages) => {
    // Check if this message is a behavior prompt response
    if (isBehaviorPromptResponse(message, messages, index)) {
      return 'behavior-response';
    }
    // Check if this is responding to a behavior response
    if (isFollowUpToBehaviorResponse(message, messages, index)) {
      return 'behavior-followup';
    }
    return 'regular';
  };

  const isBehaviorPromptResponse = (message, messages, index) => {
    if (message.sender === 'user' || index === 0) return false;
    
    // Check if we have an active behavior prompt that matches this message
    if (behaviorPromptActive) {
      const timeDiff = message.timestamp.getTime() - behaviorPromptActive.timestamp;
      // If this message is from the expected agent and within 30 seconds of the behavior prompt
      if (timeDiff > 0 && timeDiff < 30000) {
        // Check if this message is from the agent we sent the behavior prompt to
        const messageAgentId = getAgentIdFromMessage(message);
        if (messageAgentId === behaviorPromptActive.agentId) {
          // Clear the active behavior prompt since we found the response
          setBehaviorPromptActive(null);
          return true;
        }
      }
    }
    
    // Fallback: Check if the message content suggests it's responding to a behavior prompt
    const behaviorIndicators = [
      'Please ask thoughtful, clarifying questions',
      'Please collaborate with',
      'Please play devil\'s advocate',
      'Please provide an expert analysis',
      'Please add creative ideas',
      'Please provide a pessimistic perspective',
      '❓', '🤝', '😈', '🎯', '💡', '🌧️'
    ];
    
    return behaviorIndicators.some(indicator => 
      message.content.toLowerCase().includes(indicator.toLowerCase())
    );
  };

  const isFollowUpToBehaviorResponse = (message, messages, index) => {
    if (message.sender === 'user' || index < 2) return false;
    
    // Look back to see if there was a behavior response that this might be following up on
    for (let i = index - 1; i >= Math.max(0, index - 3); i--) {
      const prevMessage = messages[i];
      if (isBehaviorPromptResponse(prevMessage, messages, i)) {
        // Check if this message is responding to that behavior response
        const timeDiff = message.timestamp.getTime() - prevMessage.timestamp.getTime();
        return timeDiff < 30000 && message.sender !== prevMessage.sender; // Within 30 seconds and different sender
      }
    }
    
    return false;
  };

  const getMessageIndentation = (messageType) => {
    switch (messageType) {
      case 'behavior-response':
        return 48; // Increased indent for behavior responses (was 24px)
      case 'behavior-followup':
        return 48; // Keep follow-ups indented too for conversation thread
      default:
        return 0; // Regular messages
    }
  };

  const shouldShowConnectingLine = (messageType) => {
    return messageType === 'behavior-response' || messageType === 'behavior-followup';
  };

  // Load chatbots on component mount and when user changes
  useEffect(() => {
    console.log(`🔍 [DEBUG] useEffect[loadChatbots] triggered - RENDER #${renderCountRef.current}`);
    console.log('🔍 [DEBUG] - user?.uid:', user?.uid);
    console.log('🔍 [DEBUG] - authLoading:', authLoading);
    console.log('🔍 [DEBUG] - About to call loadChatbots...');
    loadChatbots();
    loadConnectedApps();
    
    // Initialize team collaboration services
    if (user?.uid && !authLoading) {
      initializeTeamCollaboration();
    }
  }, [user?.uid, authLoading]); // Removed loadChatbots to prevent infinite loop

  // Team collaboration initialization
  const initializeTeamCollaboration = async () => {
    try {
      console.log('🤝 [Team] Initializing team collaboration services...');
      
      // Initialize all services
      await collaborationService.initializeUserCollaboration(user?.uid || '', user?.displayName || user?.email || 'User');
      await orgService.initialize(user?.uid || '');
      await humanChatService.initialize(user?.uid || '');
      
      // Load initial data
      await loadTeamCollaborationData();
      
      // Set up real-time listeners
      setupTeamCollaborationListeners();
      
      console.log('✅ [Team] Team collaboration initialized successfully');
    } catch (error) {
      console.error('❌ [Team] Failed to initialize team collaboration:', error);
    }
  };

  const loadTeamCollaborationData = async () => {
    try {
      // Initialize collaboration service and get team data
      console.log('🔍 [Team] Loading team collaboration data...');
      const collabState = await collaborationService.initializeUserCollaboration(user?.uid || '', user?.displayName || user?.email || 'User');
      console.log('✅ [Team] TeamCollaborationIntegrationService initialized');
      console.log('🔍 [Team] Collaboration state team members:', collabState.teamMembers.length);
      
      setCollaborationState(collabState);
      setUnreadTeamCount(collabState.unreadMessages);
      
      // Load notifications
      const notifs = await collaborationService.getNotifications();
      setNotifications(notifs);
      
      // Use team members from collaboration state instead of humanChatService
      console.log('🔍 [Team] Using team members from collaboration state:', collabState.teamMembers);
      setTeamMembers(collabState.teamMembers);
      console.log('✅ [Team] Loaded team members from collaboration state:', collabState.teamMembers.length);
      
      // Load organizations
      const orgs = await orgService.getUserOrganizations(user?.uid || '');
      setOrganizations(orgs);
      
      console.log('✅ [Team] Team collaboration data loaded');
    } catch (error) {
      console.error('❌ [Team] Failed to load team collaboration data:', error);
    }
  };

  const setupTeamCollaborationListeners = () => {
    // Listen for new notifications
    collaborationService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadTeamCount(prev => prev + 1);
      }
    });

    // Listen for team updates
    collaborationService.onTeamUpdate(() => {
      loadTeamCollaborationData();
    });

    // Listen for new human messages
    humanChatService.onMessage((message) => {
      // Update unread count for human chats
      setMultiChatState(prev => ({
        ...prev,
        contexts: prev.contexts.map(context => {
          if (context.type === 'human_chat' && context.id === message.senderId) {
            return {
              ...context,
              unreadCount: context.isActive ? 0 : context.unreadCount + 1,
              lastMessage: message.content,
              lastMessageTime: message.timestamp
            };
          }
          return context;
        })
      }));
    });
  };

   // URL restoration effect - restore state from URL parameters
  const agentParam = useMemo(() => searchParams.get('agent'), [searchParams]);
  const panelParam = useMemo(() => searchParams.get('panel'), [searchParams]);
  
  // Use refs for tracking to prevent circular dependencies
  const isRestoringFromURLRef = useRef(false);
  const lastProcessedParamsRef = useRef({ agent: '', panel: '' });
  
  // URL restoration with proper circular dependency prevention
  useEffect(() => {
    console.log(`🔍 [DEBUG] useEffect[URL restoration] triggered - RENDER #${renderCountRef.current}`);
    console.log('🔍 [DEBUG] - agentParam:', agentParam);
    console.log('🔍 [DEBUG] - panelParam:', panelParam);
    console.log('🔍 [DEBUG] - isRestoringFromURLRef.current:', isRestoringFromURLRef.current);
    console.log('🔍 [DEBUG] - chatbotProfiles.length:', chatbotProfiles.length);
    
    // Prevent circular updates using ref (doesn't cause re-renders)
    if (isRestoringFromURLRef.current) {
      console.log('🔍 [DEBUG] - SKIPPING: Currently restoring from URL');
      return;
    }
    
    // Check if params actually changed to prevent unnecessary processing
    const currentParams = { agent: agentParam || '', panel: panelParam || '' };
    const lastParams = lastProcessedParamsRef.current;
    
    if (currentParams.agent === lastParams.agent && currentParams.panel === lastParams.panel) {
      console.log('🔍 [DEBUG] - SKIPPING: URL params unchanged');
      return;
    }
    
    // Only process if we have valid params and chatbots are loaded
    if (!agentParam || chatbotProfiles.length === 0) {
      console.log('🔍 [DEBUG] - SKIPPING: No agent param or chatbots not loaded');
      return;
    }
    
    const chatbot = chatbotProfiles.find(bot => 
      bot.identity?.id === agentParam || bot.key === agentParam || bot.id === agentParam
    );
    
    if (!chatbot) {
      console.log('🔍 [DEBUG] - SKIPPING: Chatbot not found for agent:', agentParam);
      return;
    }
    
    console.log(`🔄 Restoring state for agent: ${agentParam}, panel: ${panelParam}`);
    
    // Check current state to avoid unnecessary updates
    const existingState = botStates.get(agentParam);
    const isAlreadySelected = selectedChatbot?.identity?.id === agentParam;
    const isAlreadyInWorkspace = existingState?.isWorkspaceMode;
    const hasCorrectPanel = existingState?.rightPanelType === panelParam;
    
    // Only update if something actually needs to change
    if (isAlreadySelected && isAlreadyInWorkspace && hasCorrectPanel) {
      console.log('🔍 [DEBUG] - SKIPPING: State already matches URL params');
      lastProcessedParamsRef.current = currentParams;
      return;
    }
    
    // Set restoration flag to prevent circular updates
    isRestoringFromURLRef.current = true;
    
    // Use handleChatbotSelect to properly initialize session
    if (!isAlreadySelected) {
      console.log('🔄 [URL Restoration] Calling handleChatbotSelect for proper session initialization');
      handleChatbotSelect(chatbot);
    } else {
      // Just update the panel if chatbot is already selected
      setBotStates(prev => {
        const newMap = new Map(prev);
        const currentState = newMap.get(agentParam) || initializeBotState(agentParam);
        const updatedState = {
          ...currentState,
          rightPanelType: (panelParam as RightPanelType) || currentState.rightPanelType,
          isWorkspaceMode: true,
          chatHistoryRefreshTrigger: currentState.chatHistoryRefreshTrigger + 1
        };
        newMap.set(agentParam, updatedState);
        return newMap;
      });
    }
    
    // Update last processed params
    lastProcessedParamsRef.current = currentParams;
    
    // Reset restoration flag after a brief delay
    setTimeout(() => {
      isRestoringFromURLRef.current = false;
      console.log('🔍 [DEBUG] - URL restoration completed');
    }, 100);
     }, [agentParam, panelParam, chatbotProfiles]);

  // Load human participants for the current conversation
  useEffect(() => {
    const loadHumanParticipants = async () => {
      try {
        if (selectedChatbot?.id) {
          console.log('👥 [Human Participants] Loading participants for conversation:', selectedChatbot.id);
          const participants = await humanParticipantService.getConversationParticipants(selectedChatbot.id);
          setHumanParticipants(participants);
          console.log('👥 [Human Participants] Loaded', participants.length, 'participants');
        }
      } catch (error) {
        console.error('👥 [Human Participants] Error loading participants:', error);
      }
    };

    loadHumanParticipants();
  }, [selectedChatbot?.id]);

  // Update human presence status periodically
  useEffect(() => {
    const updatePresence = async () => {
      try {
        const updatedParticipants = await Promise.all(
          humanParticipants.map(async (participant) => {
            const isOnline = await humanParticipantService.getUserPresence(participant.userId);
            return { ...participant, isOnline };
          })
        );
        setHumanParticipants(updatedParticipants);
      } catch (error) {
        console.error('👥 [Human Participants] Error updating presence:', error);
      }
    };

    if (humanParticipants.length > 0) {
      const interval = setInterval(updatePresence, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [humanParticipants.length]);

  // Shared conversations are now loaded globally via SharedConversationContext

  // Subscribe to conversation notifications
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = conversationNotificationService.subscribeToNotifications((notifications) => {
      setActiveNotifications(notifications);
    });

    // Load initial notifications
    const initialNotifications = conversationNotificationService.getActiveNotifications(user.uid);
    setActiveNotifications(initialNotifications);

    return unsubscribe;
  }, [user?.uid]);

  // Subscribe to agent permission notifications
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = agentPermissionService.subscribeToNotifications((notification) => {
      setPermissionNotifications(prev => [...prev, notification]);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Subscribe to real-time sync for active shared conversation
  useEffect(() => {
    if (!activeSharedConversation || !user?.uid) return;

    // Join conversation for real-time sync
    realTimeSync.joinConversation(activeSharedConversation, user.uid);

    // Subscribe to typing indicators
    const unsubscribeTyping = realTimeSync.subscribeToTyping(activeSharedConversation, (typing) => {
      setTypingIndicators(prev => {
        const newMap = new Map(prev);
        newMap.set(activeSharedConversation, typing);
        return newMap;
      });
    });

    // Subscribe to messages (would integrate with existing message system)
    const unsubscribeMessages = realTimeSync.subscribeToMessages(activeSharedConversation, (message) => {
      // This would integrate with the existing message handling system
      console.log('📨 Real-time message received:', message);
    });

    return () => {
      unsubscribeTyping();
      unsubscribeMessages();
      realTimeSync.leaveConversation(activeSharedConversation, user.uid);
    };
  }, [activeSharedConversation, user?.uid]);

  // Update participant data for behavioral orchestration
  useEffect(() => {
    const participants: ParticipantData[] = [];

    // Add human participants
    humanParticipants.forEach(human => {
      participants.push({
        id: human.id,
        name: human.name,
        type: 'human',
        avatar: human.avatar,
        isOnline: human.isOnline,
        aiAgents: human.aiAgents?.map(agent => ({
          id: agent.id,
          name: agent.name,
          type: agent.type || 'AI Agent',
          avatar: agent.avatar,
          currentBehavior: behavioralSettings.get(agent.id) || {
            responseStyle: 'balanced',
            creativity: 50,
            assertiveness: 50,
            collaboration: 70,
            verbosity: 60,
            formality: 60,
            proactivity: 60,
            interactionMode: 'active',
            focusAreas: ['general']
          },
          isActive: agent.isActive || false,
          ownerId: human.id,
          ownerName: human.name
        })) || []
      });
    });

    // Add AI agents from selected agents
    selectedAgents.forEach(agentId => {
      const agent = chatbotProfiles.find(bot => bot.id === agentId);
      if (agent) {
        participants.push({
          id: agent.id,
          name: agent.name,
          type: 'ai',
          avatar: agent.avatar,
          isOnline: true,
          currentBehavior: behavioralSettings.get(agent.id) || {
            responseStyle: 'balanced',
            creativity: 50,
            assertiveness: 50,
            collaboration: 70,
            verbosity: 60,
            formality: 60,
            proactivity: 60,
            interactionMode: 'active',
            focusAreas: ['general']
          },
          ownerId: user?.uid || '',
          ownerName: user?.displayName || 'You'
        });
      }
    });

    setParticipantData(participants);
  }, [humanParticipants, selectedAgents, chatbotProfiles, behavioralSettings, user]);

  // Subscribe to AI observation changes for active shared conversation
  useEffect(() => {
    if (!activeSharedConversation) return;

    const initialState = aiObservationService.getObservationState(activeSharedConversation);
    setObservationState(initialState);

    const unsubscribe = aiObservationService.subscribeToObservationChanges((state) => {
      if (state.conversationId === activeSharedConversation) {
        setObservationState(state);
      }
    });

    return unsubscribe;
  }, [activeSharedConversation]);

  // State to store metrics for all chatbots
  const [chatbotMetrics, setChatbotMetrics] = useState<Map<string, ChatbotMetrics>>(new Map());

  // Load metrics for all chatbots when they change
  const metricsLoadingRef = useRef(false);
  useEffect(() => {
    console.log(`🔍 [DEBUG] useEffect[loadAllMetrics] triggered - RENDER #${renderCountRef.current}`);
    console.log('🔍 [DEBUG] - chatbotProfiles.length:', chatbotProfiles.length);
    console.log('🔍 [DEBUG] - metricsLoadingRef.current:', metricsLoadingRef.current);
    
    // Circuit breaker for metrics loading
    if (metricsLoadingRef.current) {
      console.log('🔍 [DEBUG] - SKIPPING: metrics already loading');
      return;
    }
    
    const loadAllMetrics = async () => {
      if (chatbotProfiles.length === 0) return;
      
      metricsLoadingRef.current = true;
      console.log('🔍 [DEBUG] - Starting metrics loading...');
      
      const metricsMap = new Map<string, ChatbotMetrics>();
      
      for (const chatbot of chatbotProfiles) {
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
  }, [chatbotProfiles.length]); // Use chatbotProfiles.length instead of filteredChatbots to prevent dependency loops

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
    
    // Initialize multi-chat contexts for this chatbot
    initializeMultiChatContexts(chatbot);
    
    // Initialize bot state if it doesn't exist
    if (!botStates.has(chatbotId)) {
      const newState = initializeBotState(chatbotId);
      newState.isWorkspaceMode = true;
      newState.rightPanelType = 'chats'; // Default to chats panel
      setBotStates(prev => new Map(prev).set(chatbotId, newState));
    } else {
      // Update existing state to workspace mode
      updateBotState(chatbotId, { 
        isWorkspaceMode: true,
        rightPanelType: botStates.get(chatbotId)?.rightPanelType || 'chats'
      });
    }
    
    // Update URL parameters for deep linking (only if not currently restoring from URL)
    if (!isRestoringFromURLRef.current) {
      setSearchParams({ 
        agent: chatbotId, 
        panel: botStates.get(chatbotId)?.rightPanelType || 'chats' 
      });
    }
    
    setWorkspaceSelectedTab('analytics');
    
    // Initialize chat session with governance
    try {
      setChatLoading(true);
      console.log(`🚀 [Workspace] Initializing Command Center for ${chatbot.identity.name}`);
      console.log(`🔍 [Debug] chatPanelGovernanceService:`, chatPanelGovernanceService);
      console.log(`🔍 [Debug] chatbot object:`, chatbot);
      
      // Start new chat session with governance
      const session = await chatPanelGovernanceService.startChatSession(chatbot);
      console.log(`🔍 [Debug] Session created:`, session);
      
      updateBotState(chatbotId, { 
        activeSession: session,
        chatMessages: []
      });
      setMessageInput('');
      
      console.log(`✅ [Workspace] Command Center initialized:`, session.sessionId);
    } catch (error) {
      console.error(`❌ [Workspace] Failed to initialize Command Center:`, error);
      console.error(`❌ [Workspace] Error details:`, error.message, error.stack);
      
      // Create a fallback session for UI testing
      const fallbackSession: ChatSession = {
        sessionId: `fallback_${Date.now()}`,
        agentId: chatbot.identity.id,
        startTime: new Date(),
        messageCount: 0,
        trustScore: 0.75,
        governanceMetrics: {
          violations: 0,
          warnings: 0,
          complianceScore: 1.0
        }
      };
      console.log(`🔧 [Workspace] Using fallback session:`, fallbackSession);
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
    if (!isRestoringFromURLRef.current) {
      setSearchParams({ 
        agent: chatbot.identity?.id || chatbot.key || chatbot.id, 
        panel: type || 'analytics' 
      });
    }
  };

  // Handle receipt sharing with agent
  const handleReceiptShare = async (receiptId: string, context: any) => {
    if (!selectedChatbot || !activeSession) return;

    try {
      console.log('🧾 Handling receipt share:', receiptId, context);

      // Check if this is a receipt share context
      if (context.type === 'receipt_share') {
        // Add the receipt share message to the current chat
        const shareMessage = context.shareMessage;
        
        // Add user message to chat history
        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}_user`,
          role: 'user',
          content: shareMessage,
          timestamp: new Date(),
          sessionId: activeSession.sessionId,
          agentId: selectedChatbot.id,
          userId: user?.uid || '',
          metadata: {
            type: 'receipt_share',
            receiptId,
            shareableId: context.shareableId
          }
        };

        // Update bot state with new message
        updateBotState(selectedChatbot.id, {
          messages: [...(botStates[selectedChatbot.id]?.messages || []), userMessage]
        });

        // Save message to chat history
        await chatHistoryService.addMessage(activeSession.sessionId, userMessage);

        // Trigger chat history refresh
        setChatHistoryRefreshTrigger(prev => prev + 1);

        console.log('✅ Receipt share message added to chat');
      }
    } catch (error) {
      console.error('❌ Failed to handle receipt share:', error);
    }
  };

  // Helper functions for Agent Avatar Selector
  const getAgentColor = (agentName: string) => {
    if (agentName.toLowerCase().includes('claude')) return '#3b82f6';    // Blue
    if (agentName.toLowerCase().includes('openai') || agentName.toLowerCase().includes('gpt')) return '#10b981';    // Green
    if (agentName.toLowerCase().includes('gemini') || agentName.toLowerCase().includes('bard')) return '#8b5cf6';   // Purple
    if (agentName.toLowerCase().includes('anthropic')) return '#06b6d4';  // Cyan
    if (agentName.toLowerCase().includes('mistral')) return '#f59e0b';    // Orange
    if (agentName.toLowerCase().includes('llama')) return '#ef4444';      // Red
    return '#64748b'; // Default gray
  };

  const getHostAgent = () => {
    if (!selectedChatbot) return null;
    return {
      id: selectedChatbot.identity?.id || selectedChatbot.id || '',
      name: selectedChatbot.identity?.name || selectedChatbot.name || 'Host Agent',
      color: getAgentColor(selectedChatbot.identity?.name || selectedChatbot.name || ''),
      hotkey: 'C' // Claude hotkey
    };
  };

  const getGuestAgents = () => {
    const activeContext = multiChatState.contexts.find(c => c.isActive);
    if (!activeContext?.guestAgents) return [];
    
    return activeContext.guestAgents.map((guest, index) => ({
      id: guest.agentId,
      name: guest.name,
      color: getAgentColor(guest.name),
      hotkey: guest.name.charAt(0).toUpperCase() // First letter as hotkey
    }));
  };

  // Get team members for guest selector - using connected users from Firebase
  const getTeamMembers = () => {
    console.log('🔍 [Team Members] Using connected users from Firebase');
    console.log('🔍 [Team Members] Connections array:', connections);
    console.log('🔍 [Team Members] Connections length:', connections.length);
    
    // Convert connections to team member format for the popup
    const connectedUsers = connections.map(connection => ({
      id: connection.userId,
      name: connection.displayName || connection.email || 'Connected User',
      type: 'human' as const,
      role: connection.role || 'Team Member',
      status: connection.isOnline ? 'online' as const : 'offline' as const,
      avatar: connection.photoURL || connection.displayName?.charAt(0) || 'U'
    }));

    console.log('🔍 [Team Members] Converted connected users:', connectedUsers);
    console.log('✅ [Team Members] Returning', connectedUsers.length, 'connected users');
    
    return connectedUsers;
  };

  // Get AI agents for guest selector
  const getAIAgents = () => {
    // Get available chatbots excluding the current host
    const hostId = selectedChatbot?.identity?.id || selectedChatbot?.id;
    
    return chatbotProfiles
      .filter(bot => (bot.identity?.id || bot.id) !== hostId)
      .map(bot => ({
        id: bot.identity?.id || bot.id || '',
        name: bot.identity?.name || bot.name || 'AI Agent',
        type: 'ai_agent' as const,
        role: 'AI Agent',
        status: 'online' as const,
        health: Math.floor(Math.random() * 100), // Mock health percentage
        provider: bot.apiDetails?.provider || 'Unknown',
        avatar: (bot.identity?.name || bot.name || 'A').charAt(0)
      }));
  };

  // Handle adding guests from the selector popup
  const handleAddGuests = (guests: any[]) => {
    console.log('🤖 Adding guests to conversation:', guests);
    
    // Add AI agents to the conversation
    const aiGuests = guests.filter(guest => guest.type === 'ai_agent');
    const humanGuests = guests.filter(guest => guest.type === 'human');
    
    if (aiGuests.length > 0) {
      // Add AI agents to multi-agent context immediately (no confirmation needed)
      setMultiChatState(prev => {
        const activeContext = prev.contexts.find(c => c.isActive);
        if (!activeContext) return prev;
        
        const newGuestAgents = aiGuests.map(guest => ({
          agentId: guest.id,
          name: guest.name,
          status: 'active' as const
        }));
        
        return {
          ...prev,
          contexts: prev.contexts.map(context => 
            context.isActive 
              ? {
                  ...context,
                  guestAgents: [...(context.guestAgents || []), ...newGuestAgents]
                }
              : context
          )
        };
      });
      
      // Update selected agents to include new AI guests
      const newAgentIds = aiGuests.map(guest => guest.id);
      setSelectedAgents(prev => [...prev, ...newAgentIds]);
      setTargetAgents(prev => [...prev, ...newAgentIds]);
    }
    
    if (humanGuests.length > 0) {
      // Show confirmation dialog for human invitations
      console.log('👥 Requesting confirmation to invite human guests:', humanGuests);
      setPendingHumanInvites(humanGuests);
      setShowHumanInviteConfirmDialog(true);
    }
  };

  // Handle adding humans to conversation
  const handleAddHumans = async (humans: any[]) => {
    try {
      if (!selectedChatbot?.id) return;
      
      for (const human of humans) {
        await humanParticipantService.addParticipant(selectedChatbot.id, {
          userId: human.id,
          name: human.name,
          role: human.role || 'participant',
          avatar: human.avatar,
          permissions: ['read', 'write']
        });
      }
      
      // Refresh human participants list
      const updatedParticipants = await humanParticipantService.getConversationParticipants(selectedChatbot.id);
      setHumanParticipants(updatedParticipants);
      
      console.log('✅ Successfully added human participants to conversation');
    } catch (error) {
      console.error('❌ Failed to add human participants:', error);
    }
  };

  // Handle target change for messaging
  const handleTargetChange = (targetId: string) => {
    setSelectedTarget(targetId);
    console.log('🎯 Messaging target changed to:', targetId);
  };

  // Shared conversation handlers are now provided by global context

  const handleCreateSharedConversation = async (name: string, participants: string[] = []) => {
    try {
      if (!user?.uid) return;
      
      const conversation = await sharedConversationService.createSharedConversation(
        user.uid,
        user.displayName || 'User',
        name,
        participants
      );
      
      setSharedConversations(prev => [...prev, conversation]);
      setActiveSharedConversation(conversation.id);
      setIsInSharedMode(true);
      
      console.log('✅ Created shared conversation:', conversation.id);
    } catch (error) {
      console.error('❌ Failed to create shared conversation:', error);
    }
  };

  // Invitation and notification handlers
  const handleOpenInvitationDialog = (conversationId?: string) => {
    if (conversationId) {
      setCurrentConversationForInvite(conversationId);
      setShowInvitationDialog(true);
    } else if (activeSharedConversation) {
      setCurrentConversationForInvite(activeSharedConversation);
      setShowInvitationDialog(true);
    }
  };

  const handleOpenUserDiscoveryDialog = (conversationId?: string) => {
    if (conversationId) {
      setCurrentConversationForInvite(conversationId);
      setShowUserDiscoveryDialog(true);
    } else if (activeSharedConversation) {
      setCurrentConversationForInvite(activeSharedConversation);
      setShowUserDiscoveryDialog(true);
    }
  };

  const handleSendEmailInvitations = async (invitationData: InvitationFormData) => {
    if (!currentConversationForInvite || !user?.uid) return;

    try {
      await conversationNotificationService.sendConversationInvitation(
        currentConversationForInvite,
        user.uid,
        invitationData.emails,
        invitationData.message,
        invitationData.includeHistory,
        invitationData.historyDays
      );

      console.log('✅ Sent email invitations successfully');
    } catch (error) {
      console.error('❌ Failed to send email invitations:', error);
      throw error;
    }
  };

  const handleInvitePromethiosUsers = async (users: PromethiosUser[]) => {
    if (!currentConversationForInvite || !user?.uid) return;

    try {
      // Add users directly to conversation (they're already Promethios users)
      for (const promethiosUser of users) {
        await sharedConversationService.addParticipant(
          currentConversationForInvite,
          promethiosUser.id,
          user.uid,
          promethiosUser.name
        );
      }

      // Refresh shared conversations
      await refreshSharedConversations();

      console.log('✅ Added Promethios users to conversation successfully');
    } catch (error) {
      console.error('❌ Failed to add Promethios users:', error);
      throw error;
    }
  };

  const handleAcceptInvitation = async (notificationId: string) => {
    if (!user?.uid) return;

    try {
      await conversationNotificationService.acceptInvitation(
        notificationId,
        user.uid,
        user.displayName || 'User'
      );

      // Refresh shared conversations
      await refreshSharedConversations();

      console.log('✅ Accepted invitation successfully');
    } catch (error) {
      console.error('❌ Failed to accept invitation:', error);
      throw error;
    }
  };

  const handleDeclineInvitation = async (notificationId: string) => {
    try {
      await conversationNotificationService.declineInvitation(notificationId);
      console.log('❌ Declined invitation');
    } catch (error) {
      console.error('❌ Failed to decline invitation:', error);
      throw error;
    }
  };

  const handleDismissNotification = (notificationId: string) => {
    conversationNotificationService.dismissNotification(notificationId);
  };

  // Permission request handlers
  const handleRequestAgentPermission = async (agentId: string, agentName: string, agentType: string, message?: string) => {
    if (!activeSharedConversation || !user?.uid) return;

    try {
      await agentPermissionService.requestAgentPermission(
        activeSharedConversation,
        user.uid,
        user.displayName || 'User',
        agentId,
        agentName,
        agentType,
        message
      );

      console.log('🔒 Requested permission to add agent:', agentName);
    } catch (error) {
      console.error('❌ Failed to request agent permission:', error);
    }
  };

  const handleApproveAgentRequest = async (requestId: string, reason?: string) => {
    if (!user?.uid) return;

    try {
      await agentPermissionService.approveAgentRequest(
        requestId,
        user.uid,
        user.displayName || 'User'
      );

      console.log('✅ Approved agent permission request:', requestId);
    } catch (error) {
      console.error('❌ Failed to approve agent request:', error);
      throw error;
    }
  };

  const handleDenyAgentRequest = async (requestId: string, reason?: string) => {
    if (!user?.uid) return;

    try {
      await agentPermissionService.denyAgentRequest(
        requestId,
        user.uid,
        user.displayName || 'User',
        reason
      );

      console.log('❌ Denied agent permission request:', requestId);
    } catch (error) {
      console.error('❌ Failed to deny agent request:', error);
      throw error;
    }
  };

  const handleDismissPermissionNotification = (notificationId: string) => {
    setPermissionNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Typing indicator handlers
  const handleStartTyping = () => {
    if (activeSharedConversation && user?.uid && !isTyping) {
      setIsTyping(true);
      realTimeSync.startTyping(activeSharedConversation, user.uid, user.displayName || 'User');
    }
  };

  const handleStopTyping = () => {
    if (activeSharedConversation && user?.uid && isTyping) {
      setIsTyping(false);
      realTimeSync.stopTyping(activeSharedConversation, user.uid);
    }
  };

  // Privacy control handlers
  const handlePrivacyChange = (isPrivate: boolean) => {
    console.log('🔒 Privacy mode changed:', isPrivate ? 'Private' : 'Public');
    // Additional privacy change handling can be added here
  };

  // Behavioral orchestration handlers
  const handleBehaviorChange = (agentId: string, settings: BehavioralSettings) => {
    setBehavioralSettings(prev => new Map(prev.set(agentId, settings)));
    console.log('🎭 Behavior changed for agent:', agentId, settings);
    
    // Apply behavioral changes to the agent
    // This would integrate with the agent's configuration system
  };

  const handleQuickBehaviorTrigger = async (agentId: string, trigger: string) => {
    console.log('⚡ Quick behavior trigger:', trigger, 'for agent:', agentId);
    
    // Find the agent
    const agent = selectedAgents.find(id => id === agentId) || 
                  humanParticipants.flatMap(h => h.aiAgents || []).find(a => a.id === agentId);
    
    if (!agent) return;

    // Create behavioral prompt based on trigger
    const behavioralPrompts = {
      encourage: "Please provide encouragement and motivation based on the current conversation.",
      analyze: "Please provide a deep analytical response to the current discussion.",
      brainstorm: "Please generate creative ideas and suggestions for the current topic.",
      critique: "Please provide constructive criticism and areas for improvement.",
      summarize: "Please summarize the key points of this conversation so far.",
      question: "Please ask probing questions to deepen the discussion.",
      pessimist: "Please provide a pessimistic perspective on the current discussion. Identify potential risks, downsides, and what could realistically go wrong. Focus on practical concerns and worst-case scenarios."
    };

    const prompt = behavioralPrompts[trigger as keyof typeof behavioralPrompts] || 
                   `Please respond with a ${trigger} approach to the current conversation.`;

    // Trigger the agent response with behavioral context
    await handleHoverTriggeredResponse(agentId, agent.name || agentId, trigger, prompt);
  };

  // Initialize selected agents with host agent
  useEffect(() => {
    const hostAgent = getHostAgent();
    if (hostAgent && selectedAgents.length === 0) {
      setSelectedAgents([hostAgent.id]);
    }
  }, [selectedChatbot]);

  // Handle agent selection change
  const handleAgentSelectionChange = (selectedAgentIds: string[]) => {
    setSelectedAgents(selectedAgentIds);
    setTargetAgents(selectedAgentIds); // Update target agents for routing
  };

  // 🚀 NEW: Handle hover-triggered agent responses with behavioral prompts
  const handleHoverTriggeredResponse = async (agentId: string, agentName: string, behaviorType?: string) => {
    console.log('🖱️ [Hover-Triggered] Triggering response from agent:', agentName, 'with behavior:', behaviorType);
    
    // Find the last message in the conversation
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (!lastMessage) {
      console.warn('🖱️ [Hover-Triggered] No messages found to respond to');
      return;
    }

    // Create behavioral prompt templates
    const behaviorPrompts = {
      collaborate: `🤝 Please collaborate with the previous response. Build upon the ideas presented and work together to develop a more comprehensive solution or perspective.`,
      question: `❓ Please ask thoughtful, clarifying questions about the previous response. Help deepen the understanding by identifying areas that need more explanation or exploration.`,
      devils_advocate: `😈 Please play devil's advocate to the previous response. Challenge the assumptions, point out potential weaknesses, and present alternative viewpoints or counterarguments.`,
      expert: `🎯 Please provide an expert analysis of the previous response. Draw upon specialized knowledge to evaluate the accuracy, completeness, and implications of what was discussed.`,
      critic: `🔍 Please provide a critical review of the previous response. Evaluate the strengths and weaknesses, identify gaps, and suggest improvements while maintaining a constructive tone.`,
      creative: `💡 Please add creative ideas and innovative perspectives to the previous response. Think outside the box and suggest novel approaches or creative solutions.`,
      analyst: `📊 Please provide an analytical response to the previous message. Break down the key components, analyze the logic, data, or reasoning presented, and provide structured insights.`,
      pessimist: `🌧️ Please provide a pessimistic perspective on the previous response. Identify potential risks, downsides, and what could realistically go wrong. Focus on practical concerns, worst-case scenarios, and cautionary considerations that should be taken into account.`
    };

    // Create the behavioral trigger message
    const triggerMessage = behaviorType && behaviorPrompts[behaviorType as keyof typeof behaviorPrompts]
      ? behaviorPrompts[behaviorType as keyof typeof behaviorPrompts]
      : `Please respond to the last message from ${lastMessage.sender === 'user' ? 'the user' : 'another agent'}.`;
    
    try {
      // Send the behavioral trigger message to the specific agent
      await handleSendMessage(triggerMessage, [agentId]);
      console.log('🖱️ [Hover-Triggered] Successfully triggered', behaviorType || 'generic', 'response from:', agentName);
    } catch (error) {
      console.error('🖱️ [Hover-Triggered] Error triggering response:', error);
    }
  };

  // Handle behavior prompt clicks from agent avatars
  const handleBehaviorPrompt = async (agentId: string, agentName: string, behavior: string) => {
    console.log('🎭 [Behavior Prompt] Triggered:', behavior, 'for agent:', agentName);
    
    // Check if we're in single-agent or multi-agent mode
    const activeContext = multiChatState.contexts.find(c => c.isActive);
    const hasGuestAgents = activeContext?.guestAgents && activeContext.guestAgents.length > 0;
    const isSingleAgentMode = !hasGuestAgents;
    
    // Get the last message to check who responded last
    const lastMessage = chatMessages[chatMessages.length - 1];
    
    // In multi-agent mode, don't allow behavior prompts if this agent was the last responder
    if (!isSingleAgentMode && lastMessage) {
      const lastResponderAgentId = getAgentIdFromMessage(lastMessage);
      if (lastResponderAgentId === agentId) {
        console.log('🎭 [Behavior Prompt] Skipping - agent was last responder in multi-agent mode');
        return;
      }
    }
    
    if (!lastMessage) {
      console.warn('🎭 [Behavior Prompt] No messages found to respond to');
      return;
    }

    // Get the name of who should be mentioned (who made the last message)
    const getMentionTarget = () => {
      if (lastMessage.sender === 'user') {
        return '@user'; // Mention the user
      } else {
        // Find the agent who made the last message with improved detection
        console.log('🎭 [getMentionTarget] Analyzing last message:', {
          sender: lastMessage.sender,
          content: lastMessage.content?.substring(0, 100),
          metadata: lastMessage.metadata
        });
        
        // First try to get agent ID from metadata
        let lastResponderAgentId = lastMessage.metadata?.agentId;
        
        // If no metadata, try to parse from message
        if (!lastResponderAgentId) {
          lastResponderAgentId = getAgentIdFromMessage(lastMessage);
        }
        
        console.log('🎭 [getMentionTarget] Last responder agent ID:', lastResponderAgentId);
        
        if (lastResponderAgentId) {
          const hostAgent = getHostAgent();
          const guestAgents = getGuestAgents();
          
          console.log('🎭 [getMentionTarget] Available agents:', {
            host: hostAgent?.name,
            guests: guestAgents.map(g => g.name)
          });
          
          if (hostAgent && lastResponderAgentId === hostAgent.id) {
            console.log('🎭 [getMentionTarget] Found host agent:', hostAgent.name);
            return `@${hostAgent.name}`;
          }
          
          const guestAgent = guestAgents.find(agent => agent.id === lastResponderAgentId);
          if (guestAgent) {
            console.log('🎭 [getMentionTarget] Found guest agent:', guestAgent.name);
            return `@${guestAgent.name}`;
          }
        }
        
        // Enhanced fallback: try to extract agent name from sender field
        if (lastMessage.sender && lastMessage.sender !== 'assistant') {
          // If sender contains agent name, use it
          const hostAgent = getHostAgent();
          const guestAgents = getGuestAgents();
          
          // Check if sender matches any agent name
          const allAgents = [hostAgent, ...guestAgents].filter(Boolean);
          const matchingAgent = allAgents.find(agent => 
            lastMessage.sender.includes(agent.name) || 
            agent.name.includes(lastMessage.sender)
          );
          
          if (matchingAgent) {
            console.log('🎭 [getMentionTarget] Found agent via sender field:', matchingAgent.name);
            return `@${matchingAgent.name}`;
          }
        }
        
        console.warn('🎭 [getMentionTarget] Could not identify last responder, using fallback');
        return '@assistant'; // Better fallback than @previous-agent
      }
    };

    const mentionTarget = getMentionTarget();

    // Create behavioral prompt templates - include @mention to trigger original agent response
    const behaviorPrompts = {
      collaborate: `🤝 Please collaborate with the previous response. Build upon the ideas presented and work together to develop a more comprehensive solution or perspective. ${mentionTarget}, please respond to my collaboration points.`,
      question: `❓ Please ask thoughtful, clarifying questions about the previous response. Help deepen the understanding by identifying areas that need more explanation or exploration. ${mentionTarget}, please address these questions.`,
      devils_advocate: `😈 Please play devil's advocate to the previous response. Challenge the assumptions, point out potential weaknesses, and present alternative viewpoints or counterarguments. ${mentionTarget}, please respond to these challenges.`,
      expert: `🎯 Please provide an expert analysis of the previous response. Draw upon specialized knowledge to evaluate the accuracy, completeness, and implications of what was discussed. ${mentionTarget}, please respond to this analysis.`,
      creative: `💡 Please add creative ideas and innovative perspectives to the previous response. Think outside the box and suggest novel approaches or creative solutions. ${mentionTarget}, please build on these creative ideas.`,
      pessimist: `🌧️ Please provide a pessimistic perspective on the previous response. Identify potential risks, downsides, and what could realistically go wrong. Focus on practical concerns, worst-case scenarios, and cautionary considerations that should be taken into account. ${mentionTarget}, please address these concerns.`
    };

    // Create the behavioral trigger message - send directly to the clicked agent with @mention
    const triggerMessage = behaviorPrompts[behavior as keyof typeof behaviorPrompts] || 
      `Please respond to the last message with a ${behavior} approach. ${mentionTarget}, please respond.`;
    
    try {
      // Set smart thinking indicator
      setSmartThinkingIndicator(agentId, agentName, behavior);
      
      // Send the behavioral trigger message to the specific agent (includes @mention for automatic response)
      await handleSendMessage(triggerMessage, [agentId]);
      console.log('🎭 [Behavior Prompt] Successfully triggered', behavior, 'response from:', agentName, 'with mention:', mentionTarget);
      
      // Mark that we're expecting a behavior prompt response
      setBehaviorPromptActive({
        agentId,
        behavior,
        timestamp: Date.now()
      });
      
      // Note: The @mention in the response will automatically trigger the original agent
      // No need for automated setTimeout logic - let the mention system handle it
      
    } catch (error) {
      console.error('🎭 [Behavior Prompt] Error triggering response:', error);
      clearSmartThinkingIndicator();
    }
  };

  // Helper function to get agent ID from message
  const getAgentIdFromMessage = (message: any): string | null => {
    // Check if message has agent information
    if (message.agentId) return message.agentId;
    if (message.sender && message.sender !== 'user') {
      // Try to match sender name to agent
      const hostAgent = getHostAgent();
      if (hostAgent && message.sender.includes(hostAgent.name)) return hostAgent.id;
      
      const guestAgent = getGuestAgents().find(agent => message.sender.includes(agent.name));
      if (guestAgent) return guestAgent.id;
    }
    return null;
  };

  // Handle hover-triggered AI responses to humans
  const handleHoverTriggeredResponseToHuman = async (humanId: string, humanName: string, behaviorType: string) => {
    console.log('🖱️ [AI-Human Interaction] Triggering AI response to human:', humanName, 'with behavior:', behaviorType);
    
    // Find the last message from the human or in the conversation
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (!lastMessage) {
      console.warn('🖱️ [AI-Human Interaction] No messages found to respond to');
      return;
    }

    // Create AI-to-human behavioral prompt templates
    const aiToHumanPrompts = {
      collaborate: `🤝 Please collaborate with ${humanName} on their recent contribution. Work together to build upon their ideas and develop a more comprehensive solution.`,
      question: `❓ Please ask ${humanName} thoughtful, clarifying questions about their recent input. Help deepen the understanding by identifying areas that need more explanation.`,
      devils_advocate: `😈 Please respectfully challenge ${humanName}'s recent statement. Play devil's advocate by questioning assumptions and presenting alternative viewpoints.`,
      expert_analysis: `🎯 Please provide expert analysis of ${humanName}'s recent contribution. Evaluate their ideas with specialized knowledge and offer professional insights.`,
      critical_review: `🔍 Please provide a constructive critical review of ${humanName}'s recent input. Identify strengths, potential improvements, and areas for development.`,
      creative_ideas: `💡 Please brainstorm creative ideas with ${humanName} based on their recent contribution. Think outside the box and suggest innovative approaches.`,
      analytical_response: `📊 Please provide analytical insights on ${humanName}'s recent input. Break down the key components and offer structured analysis.`
    };

    // Create the AI-to-human behavioral trigger message
    const triggerMessage = aiToHumanPrompts[behaviorType as keyof typeof aiToHumanPrompts] || 
      `Please respond to ${humanName}'s recent contribution in the conversation.`;
    
    try {
      // Send the behavioral trigger message to the host agent (or selected AI agent)
      const hostAgentId = selectedChatbot?.id;
      if (hostAgentId) {
        await handleSendMessage(triggerMessage, [hostAgentId]);
        console.log('🖱️ [AI-Human Interaction] Successfully triggered', behaviorType, 'response to human:', humanName);
      } else {
        console.warn('🖱️ [AI-Human Interaction] No host agent available to respond to human');
      }
    } catch (error) {
      console.error('🖱️ [AI-Human Interaction] Error triggering AI response to human:', error);
    }
  };

  // Autonomous Stars functionality
  const generateSmartSuggestions = useCallback(async (input: string, context: any) => {
    if (!autonomousStarsActive || !input.trim()) {
      setSmartSuggestions([]);
      return;
    }

    try {
      const suggestions: string[] = [];
      
      // Context-aware suggestions based on current state
      if (projects.length > 0) {
        suggestions.push(`Continue working on ${projects[0].name}`);
        suggestions.push(`Create a new feature for ${projects[0].name}`);
      }
      
      if (teamMembers.length > 0) {
        suggestions.push(`Share this with ${teamMembers[0].name}`);
        suggestions.push(`Ask team for feedback on this`);
      }
      
      if (autonomousMode && currentTaskPlan) {
        suggestions.push(`Show me the current task progress`);
        suggestions.push(`What's the next step in this task?`);
      }
      
      // Input-based suggestions
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('create') || lowerInput.includes('build')) {
        suggestions.push('Create a new React application');
        suggestions.push('Build a REST API with Flask');
        suggestions.push('Set up a database schema');
      }
      
      if (lowerInput.includes('help') || lowerInput.includes('how')) {
        suggestions.push('Show me available project templates');
        suggestions.push('Explain the autonomous workflow');
        suggestions.push('Guide me through team collaboration');
      }
      
      setSmartSuggestions(suggestions.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('❌ [AutonomousStars] Failed to generate suggestions:', error);
    }
  }, [autonomousStarsActive, projects, teamMembers, autonomousMode, currentTaskPlan]);

  const handleInputChange = useCallback((value: string) => {
    setMessageInput(value);
    
    // Check for @mentions (both agents and humans)
    const mentionMatch = value.match(/@(\w+)$/);
    if (mentionMatch) {
      const mentionQuery = mentionMatch[1].toLowerCase();
      
      // Get available agents
      const availableAgents = getGuestAgents().map(agent => ({
        type: 'agent' as const,
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar
      }));
      
      // Add host agent
      if (selectedChatbot) {
        availableAgents.unshift({
          type: 'agent' as const,
          id: selectedChatbot.id,
          name: selectedChatbot.name,
          avatar: selectedChatbot.avatar
        });
      }
      
      // Get available humans
      const availableHumans = humanParticipants.map(human => ({
        type: 'human' as const,
        id: human.userId,
        name: human.name,
        avatar: human.avatar
      }));
      
      // Filter and combine suggestions
      const allMentionSuggestions = [...availableAgents, ...availableHumans]
        .filter(item => item.name.toLowerCase().includes(mentionQuery))
        .slice(0, 5);
      
      if (allMentionSuggestions.length > 0) {
        setMentionSuggestions(allMentionSuggestions);
        setShowMentionSuggestions(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
    
    // Only generate suggestions when autonomous stars are active and user pauses typing
    if (autonomousStarsActive) {
      // Clear existing timeout
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      
      // Hide suggestions while typing
      setShowSuggestions(false);
      
      // Only show suggestions if input has meaningful content or specific triggers
      const shouldShowSuggestions = value.trim().length > 2 || 
        ['create', 'build', 'help', 'show', 'what'].some(trigger => 
          value.toLowerCase().includes(trigger)
        );
      
      if (shouldShowSuggestions) {
        // Show suggestions after user stops typing (Amazon-style delay)
        suggestionTimeoutRef.current = setTimeout(() => {
          generateSmartSuggestions(value, {
            selectedChatbot,
            projects,
            teamMembers,
            autonomousMode,
            currentTaskPlan
          });
        }, 800); // Longer delay to be less intrusive
      }
    }
  }, [autonomousStarsActive, generateSmartSuggestions, selectedChatbot, projects, teamMembers, autonomousMode, currentTaskPlan]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setMessageInput(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }, []);

  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || smartSuggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < smartSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : smartSuggestions.length - 1
      );
    } else if (e.key === 'Tab' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(smartSuggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [showSuggestions, smartSuggestions, selectedSuggestionIndex, handleSuggestionSelect]);

  // Proactive assistance based on context
  useEffect(() => {
    if (!autonomousStarsActive) return;
    
    const checkProactiveAssistance = () => {
      if (projects.length === 0 && !messageInput.trim()) {
        setProactiveAssistance("💡 Start by creating a new project from our templates!");
      } else if (autonomousMode && !liveAgentPanelOpen) {
        setProactiveAssistance("🤖 Your agent is working autonomously. Click LIVE AGENT to monitor progress.");
      } else if (unreadTeamCount > 0) {
        setProactiveAssistance(`👥 You have ${unreadTeamCount} unread team messages.`);
      } else {
        setProactiveAssistance(null);
      }
    };
    
    const timeoutId = setTimeout(checkProactiveAssistance, 2000);
    return () => clearTimeout(timeoutId);
  }, [autonomousStarsActive, projects.length, messageInput, autonomousMode, liveAgentPanelOpen, unreadTeamCount]);

  // Smart thinking indicator helper functions
  const getRespondingAgent = () => {
    // In multi-agent mode, determine which agent is actually responding
    const activeContext = multiChatState.contexts.find(c => c.isActive);
    const hasGuestAgents = activeContext?.guestAgents && activeContext.guestAgents.length > 0;
    
    if (hasGuestAgents) {
      // Check if we have selected specific agents for this message
      if (selectedAgents && selectedAgents.length > 0) {
        // Find the first selected agent that's not the host
        const selectedGuestId = selectedAgents.find(id => id !== selectedChatbot?.id);
        if (selectedGuestId) {
          const selectedGuest = activeContext.guestAgents.find(g => g.agentId === selectedGuestId);
          if (selectedGuest) {
            return {
              id: selectedGuest.agentId,
              name: selectedGuest.name,
              avatar: selectedGuest.avatar
            };
          }
        }
        
        // If the selected agent is the host, return host info
        if (selectedAgents.includes(selectedChatbot?.id || '')) {
          return {
            id: selectedChatbot?.id || 'host',
            name: selectedChatbot?.identity?.name || selectedChatbot?.name || 'Agent',
            avatar: selectedChatbot?.identity?.avatar
          };
        }
      }
      
      // If no specific selection, check which agent should respond based on context
      // For now, default to the first guest agent if we're in multi-agent processing
      if (isProcessingMultiAgent) {
        const firstGuest = activeContext.guestAgents[0];
        return {
          id: firstGuest.agentId,
          name: firstGuest.name,
          avatar: firstGuest.avatar
        };
      }
    }
    
    // Default to the selected chatbot (host agent)
    return {
      id: selectedChatbot?.id || 'host',
      name: selectedChatbot?.identity?.name || selectedChatbot?.name || 'Agent',
      avatar: selectedChatbot?.identity?.avatar
    };
  };

  const getActivityStatus = (messageContent: string = '') => {
    // Ensure messageContent is a string and handle null/undefined cases
    const safeContent = typeof messageContent === 'string' ? messageContent : String(messageContent || '');
    const content = safeContent.toLowerCase();
    
    // Determine activity based on message content and context
    if (content.includes('search') || content.includes('find') || content.includes('lookup')) {
      return 'researching...';
    } else if (content.includes('analyze') || content.includes('review') || content.includes('examine')) {
      return 'analyzing...';
    } else if (content.includes('create') || content.includes('generate') || content.includes('build')) {
      return 'creating...';
    } else if (content.includes('calculate') || content.includes('compute') || content.includes('math')) {
      return 'calculating...';
    } else if (content.includes('image') || content.includes('picture') || content.includes('photo')) {
      return 'generating image...';
    } else if (content.includes('code') || content.includes('program') || content.includes('script')) {
      return 'coding...';
    } else if (content.includes('write') || content.includes('draft') || content.includes('compose')) {
      return 'writing...';
    } else if (isProcessingMultiAgent) {
      return 'coordinating response...';
    } else {
      return 'thinking...';
    }
  };

  const clearSmartThinkingIndicator = () => {
    setCurrentRespondingAgent(null);
    setCurrentActivity('');
    setThinkingAgents([]);
  };

  const setSmartThinkingIndicator = (agentId: string, agentName: string, activity?: string) => {
    const agentAvatar = getAgentAvatar(agentId, agentName);
    
    setCurrentRespondingAgent({
      id: agentId,
      name: agentName,
      avatar: agentAvatar
    });
    setCurrentActivity(activity || 'thinking...');
    
    // Add to thinking agents array for multi-agent visualization
    setThinkingAgents(prev => {
      const filtered = prev.filter(agent => agent.id !== agentId);
      return [...filtered, {
        id: agentId,
        name: agentName,
        avatar: agentAvatar,
        activity: activity || 'thinking...',
        startTime: Date.now()
      }];
    });
  };

  const removeThinkingAgent = (agentId: string) => {
    setThinkingAgents(prev => prev.filter(agent => agent.id !== agentId));
    if (currentRespondingAgent?.id === agentId) {
      setCurrentRespondingAgent(null);
      setCurrentActivity('');
    }
  };

  // Helper function to get agent avatar
  const getAgentAvatar = (agentId: string, agentName: string): string => {
    // Try to find avatar from chatbots
    const chatbot = chatbots.find(bot => bot.id === agentId || bot.identity?.name === agentName);
    if (chatbot?.identity?.avatar) return chatbot.identity.avatar;
    
    // Try to find from guest agents
    const guestAgent = getGuestAgents().find(agent => agent.id === agentId || agent.name === agentName);
    if (guestAgent?.avatar) return guestAgent.avatar;
    
    // Default avatar based on agent name
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName)}&background=3b82f6&color=fff&size=32`;
  };

  // Helper function to get activity-based styling
  const getActivityStyle = (activity: string) => {
    if (activity.includes('analyzing') || activity.includes('analysis')) {
      return { bgcolor: '#f59e0b', animation: 'slow-pulse 2s infinite' };
    }
    if (activity.includes('searching') || activity.includes('research')) {
      return { bgcolor: '#10b981', animation: 'search-pulse 1.8s infinite' };
    }
    if (activity.includes('deep') || activity.includes('complex')) {
      return { bgcolor: '#8b5cf6', animation: 'deep-pulse 2.5s infinite' };
    }
    return { bgcolor: '#3b82f6', animation: 'pulse 1.5s infinite' };
  };

  // Enhanced multi-agent message handling
  const handleSendMessage = async (customMessage?: string, targetAgentIds?: string[]) => {
    const messageToSend = customMessage || messageInput.trim();
    if (!messageToSend || !activeSession || chatLoading) return;

    try {
      // Always add user message to chat for immediate feedback (unless it's an internal system message)
      if (!customMessage || (typeof customMessage === 'string' && !customMessage.startsWith('🤝') && !customMessage.startsWith('❓') && !customMessage.startsWith('😈') && !customMessage.startsWith('🎯') && !customMessage.startsWith('💡') && !customMessage.startsWith('🌧️'))) {
        const userMessage: ChatMessage = {
          id: `user_${Date.now()}`,
          content: messageToSend,
          sender: 'user',
          timestamp: new Date(),
          attachments: attachedFiles.length > 0 ? attachedFiles : undefined
        };

        // Add user message immediately to provide instant feedback
        if (selectedChatbot) {
          const botId = selectedChatbot.identity?.id || selectedChatbot.key || selectedChatbot.id;
          setBotStates(prev => {
            const newStates = new Map(prev);
            const currentState = newStates.get(botId) || initializeBotState(botId);
            const updatedMessages = [...(currentState.chatMessages || []), userMessage];
            const updatedState = { ...currentState, chatMessages: updatedMessages };
            newStates.set(botId, updatedState);
            return newStates;
          });
        }

        // Clear input and attachments immediately
        setMessageInput('');
        setAttachedFiles([]);
      }

      setChatLoading(true);
      setIsTyping(true);
      
      // Set smart thinking indicator
      const respondingAgent = getRespondingAgent();
      const activityStatus = getActivityStatus(messageToSend);
      setCurrentRespondingAgent(respondingAgent);
      setCurrentActivity(activityStatus);
      
      // Check if we're in multi-agent mode or have specific target agents
      const activeContext = multiChatState.contexts.find(c => c.isActive);
      const hasGuestAgents = activeContext?.guestAgents && activeContext.guestAgents.length > 0;
      
      if ((hasGuestAgents || targetAgentIds) && selectedChatbot && user?.uid) {
        console.log('🤖 [MultiAgent] Processing multi-agent message');
        await handleMultiAgentMessage(messageToSend, targetAgentIds);
        return;
      }
      
      // Original single-agent message handling
      await handleSingleAgentMessage(messageToSend);
      
    } catch (error) {
      console.error('❌ [ChatPanel] Error sending message:', error);
      setChatLoading(false);
      setIsTyping(false);
      clearSmartThinkingIndicator();
    }
  };

  // Multi-agent message handling
  const handleMultiAgentMessage = async (message: string, targetAgentIds?: string[]) => {
    // Type safety check - ensure message is a string
    if (typeof message !== 'string') {
      console.error('❌ [ChatPanel] Invalid message type in handleMultiAgentMessage:', typeof message, 'Expected string, got:', message);
      message = String(message || '');
    }

    if (!selectedChatbot || !user?.uid) return;

    try {
      setIsProcessingMultiAgent(true);
      setMultiAgentResponses([]);

      // Get active context
      const activeContext = multiChatState.contexts.find(c => c.isActive);
      if (!activeContext || !activeContext.guestAgents) return;

      // 🔧 CRITICAL FIX: Build conversation history for multi-agent context sharing
      console.log('📚 [MultiAgent] Building conversation history for agent context sharing...');
      
      let conversationHistory: Array<{
        role: 'user' | 'assistant';
        content: string;
        agentId?: string;
        agentName?: string;
        timestamp?: Date;
      }> = [];

      // Get current chat messages to build conversation history
      if (selectedChatbot) {
        const botId = selectedChatbot.identity?.id || selectedChatbot.key || selectedChatbot.id;
        const currentBotState = botStates.get(botId);
        
        if (currentBotState?.chatMessages) {
          conversationHistory = currentBotState.chatMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content,
            agentId: msg.metadata?.agentId,
            agentName: msg.metadata?.agentName,
            timestamp: msg.timestamp
          }));
          
          console.log('📚 [MultiAgent] Built conversation history with', conversationHistory.length, 'messages');
          console.log('📝 [MultiAgent] Recent messages preview:', 
            conversationHistory.slice(-3).map(m => `${m.role}: ${m.content.substring(0, 50)}...`));
        }
      }

      // Create or use existing multi-agent session ID
      let sessionId = currentMultiAgentSession;
      if (!sessionId) {
        sessionId = `conv_${Date.now()}`;
        setCurrentMultiAgentSession(sessionId);
        console.log('🆕 [MultiAgent] Created new session ID:', sessionId);
      }

      // Create routing context with conversation history
      const routingContext = {
        hostAgentId: activeContext.hostAgentId,
        guestAgents: activeContext.guestAgents,
        userId: user.uid,
        conversationId: sessionId,
        conversationHistory: conversationHistory, // 🔧 CRITICAL: Include full conversation history
        selectedAgents: selectedAgents // 🔧 CRITICAL: Include avatar-selected agents
      };

      // Process message with multi-agent routing
      const result = await multiAgentRoutingService.processUserMessage(message, routingContext);
      
      console.log('🤖 [MultiAgent] Routing result:', result);
      
      setTargetAgents(result.targetAgents);

      // User message already added in handleSendMessage for instant feedback
      // No need to add it again here to avoid duplicates

      // Handle responses
      if (result.responses && result.responses.length > 0) {
        setMultiAgentResponses(result.responses);
        
        // Add agent responses to chat
        const agentMessages: ChatMessage[] = result.responses.map(response => ({
          id: `agent_${response.agentId}_${Date.now()}`,
          content: response.response,
          sender: 'assistant',
          timestamp: response.timestamp,
          metadata: {
            agentId: response.agentId,
            agentName: response.agentName,
            processingTime: response.processingTime,
            isMultiAgent: true
          }
        }));

        // Update chat with agent responses
        if (selectedChatbot) {
          const botId = selectedChatbot.identity?.id || selectedChatbot.key || selectedChatbot.id;
          setBotStates(prev => {
            const newStates = new Map(prev);
            const currentState = newStates.get(botId) || initializeBotState(botId);
            const updatedMessages = [...(currentState.chatMessages || []), ...agentMessages];
            newStates.set(botId, { ...currentState, chatMessages: updatedMessages });
            return newStates;
          });
        }

        // Log the interaction
        await multiAgentAuditLogger.logMultiAgentInteraction(
          routingContext.conversationId,
          user.uid,
          message,
          result.parsedMessage,
          result.responses,
          routingContext.guestAgents.map(g => ({
            agentId: g.agentId,
            agentName: g.name,
            role: 'guest' as const,
            addedAt: g.addedAt,
            addedBy: user.uid,
            responseCount: 1,
            totalCost: 0
          }))
        );
      }

      // Clear input
      setMessageInput('');
      setAttachedFiles([]);
      
    } catch (error) {
      console.error('❌ [MultiAgent] Error processing multi-agent message:', error);
    } finally {
      setIsProcessingMultiAgent(false);
      setChatLoading(false);
      setIsTyping(false);
      clearSmartThinkingIndicator();
    }
  };

  // Original single-agent message handling
  const handleSingleAgentMessage = async (message?: string) => {
    try {
      // Prepare the final message content - ensure it's always a string
      let finalMessageContent = typeof message === 'string' ? message : (message ? String(message) : messageInput.trim());
    
    // If there's an active chat reference, combine it with the user's message
    if (activeChatReference) {
      console.log('🔗 [ChatReference] Combining chat reference with user message');
      console.log('🔗 [ChatReference] Reference ID:', activeChatReference.id);
      console.log('🔗 [ChatReference] User message:', finalMessageContent);
      
      // Combine the chat reference ID with the user's instruction
      finalMessageContent = `${activeChatReference.id} ${finalMessageContent}`;
      
      // Clear the active chat reference after using it
      setActiveChatReference(null);
      
      console.log('🔗 [ChatReference] Final combined message:', finalMessageContent);
    }
    
    console.log(`📤 [ChatPanel] Sending message: "${finalMessageContent}"`);
    
    // Get fresh bot state to avoid stale closure issues
    const freshBotState = selectedChatbotId ? botStates.get(selectedChatbotId) : null;
    
    // Auto-create ChatHistoryService session if none exists (proactive creation)
    // Check both freshBotState and ChatHistoryService to ensure proper session management
    const hasHistorySession = freshBotState?.currentChatSession;
    
    console.log('🔍 [AutoChat] Checking session state:');
    console.log('🔍 [AutoChat] selectedChatbotId:', selectedChatbotId);
    console.log('🔍 [AutoChat] freshBotState exists:', !!freshBotState);
    console.log('🔍 [AutoChat] hasHistorySession:', !!hasHistorySession);
    console.log('🔍 [AutoChat] hasHistorySession details:', hasHistorySession);
    
    if (!hasHistorySession && selectedChatbot && user?.uid) {
      console.log('🆕 [AutoChat] No ChatHistoryService session, creating new chat session...');
      console.log('🔍 [AutoChat] Fresh bot state:', freshBotState);
      console.log('🔍 [AutoChat] Has history session:', hasHistorySession);
      try {
        // Generate a smart chat name based on the first message (use original messageInput, not combined)
        const smartChatName = messageInput.trim().length > 50 
          ? `${messageInput.trim().substring(0, 47)}...`
          : messageInput.trim();
        
        const newSession = await chatHistoryService.createChatSession(
          selectedChatbot.id,
          selectedChatbot.name,
          user.uid,
          smartChatName || `Chat with ${selectedChatbot.name}`,
          getGuestAgents().length > 0 // Mark as multi-agent if there are guest agents
        );
        
        updateBotState(selectedChatbot.id, {
          currentChatSession: newSession,
          currentChatName: newSession.name
        });
        
        // Trigger chat history panel refresh immediately
        setChatHistoryRefreshTrigger(prev => prev + 1);
        
        console.log(`✅ [AutoChat] Created new ChatHistoryService session: ${newSession.name} (${newSession.id})`);
      } catch (sessionError) {
        console.error('❌ [AutoChat] Failed to create chat session:', sessionError);
        // Continue with the message even if session creation fails
      }
    }
    
    // Check if this is a receipt search query
    const isReceiptSearch = conversationalReceiptSearchService.detectReceiptSearchRequest(finalMessageContent);
    
    // Check if this is a chat reference (for agent processing)
    const chatSharingService = ChatSharingService.getInstance();
    const chatReferenceId = chatSharingService.detectChatReference(finalMessageContent);
    
    // Check if this is a receipt reference (for agent processing)
    const receiptSharingService = ReceiptSharingService.getInstance();
    const receiptReferenceId = receiptSharingService.detectReceiptReference(finalMessageContent);
    
    if (isReceiptSearch && selectedChatbot && user?.uid) {
      console.log('🔍 [ReceiptSearch] Detected receipt search query');
      
      // Process conversational receipt search
      const searchResponse = await conversationalReceiptSearchService.processConversationalSearch(
        messageInput.trim(),
        selectedChatbot.id,
        user.uid
      );
      
      // Create agent response with search results (user message already added immediately)
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
      
      // Update chat messages in bot state using functional update to avoid stale closure
      if (selectedChatbot) {
        const botId = selectedChatbot.identity?.id || selectedChatbot.key || selectedChatbot.id;
        console.log(`🔄 [ReceiptSearch] Updating chat messages for bot: ${botId}`);
        
        setBotStates(prev => {
          const newStates = new Map(prev);
          const currentState = newStates.get(botId) || initializeBotState(botId);
          
          // Use the latest state from the Map, not the potentially stale closure variable
          const latestMessages = currentState.chatMessages || [];
          const updatedMessages = [...latestMessages, agentResponse]; // Only add agent response
          
          console.log(`🔄 [ReceiptSearch] Latest messages length: ${latestMessages.length}`);
          console.log(`🔄 [ReceiptSearch] Updated messages length: ${updatedMessages.length}`);
          
          const updatedState = { ...currentState, chatMessages: updatedMessages };
          newStates.set(botId, updatedState);
          
          console.log(`✅ [ReceiptSearch] State updated successfully`);
          return newStates;
        });
      }
      
      // Save to chat history
      const currentFreshBotState = selectedChatbotId ? botStates.get(selectedChatbotId) : null;
      if (currentFreshBotState?.currentChatSession) {
        try {
          await chatHistoryService.addMessageToSession(currentFreshBotState.currentChatSession.id, {
            id: userMessage.id,
            content: userMessage.content,
            sender: userMessage.sender,
            timestamp: userMessage.timestamp,
            agentId: selectedChatbot.id,
            agentName: selectedChatbot.name,
          });
          
          await chatHistoryService.addMessageToSession(currentFreshBotState.currentChatSession.id, {
            id: agentResponse.id,
            content: agentResponse.content,
            sender: agentResponse.sender,
            timestamp: agentResponse.timestamp,
            agentId: selectedChatbot.id,
            agentName: selectedChatbot.name,
            metadata: agentResponse.metadata
          });
          
          // Update bot state with new message count immediately
          const updatedSession = await chatHistoryService.getChatSessionById(currentFreshBotState.currentChatSession.id);
          if (updatedSession) {
            updateBotState(selectedChatbot.id, {
              currentChatSession: updatedSession,
              currentChatName: updatedSession.name
            });
          }
          
          // Trigger chat history panel refresh after adding messages
          setChatHistoryRefreshTrigger(prev => prev + 1);
        } catch (historyError) {
          console.warn('Failed to save receipt search to chat history:', historyError);
        }
      }
      
      // Clear input and attachments
      setMessageInput('');
      setAttachedFiles([]);
      setChatLoading(false);
      setIsTyping(false);
      clearSmartThinkingIndicator();
      
      return;
    } else if (chatReferenceId && selectedChatbot && user?.uid) {
        console.log('🗨️ [ChatReference] Detected chat reference:', chatReferenceId);
        
        // Process chat reference for agent context loading
        const chatReferenceResult = await chatSharingService.processChatReference(
          chatReferenceId,
          user.uid,
          selectedChatbot.id,
          messageInput.trim()
        );
        
        // Create agent response with chat context (user message already added immediately)
        const agentResponse: ChatMessage = {
          id: `agent_${Date.now()}`,
          content: chatReferenceResult.agentResponse,
          sender: 'assistant',
          timestamp: new Date(),
          metadata: {
            chatContext: chatReferenceResult.context,
            originalChatId: chatReferenceResult.originalChatId,
            continuationOptions: chatReferenceResult.continuationOptions
          }
        };
        
        // Update chat messages in bot state using functional update to avoid stale closure
        if (selectedChatbot) {
          const botId = selectedChatbot.identity?.id || selectedChatbot.key || selectedChatbot.id;
          console.log(`🔄 [ChatReference] Updating chat messages for bot: ${botId}`);
          
          setBotStates(prev => {
            const newStates = new Map(prev);
            const currentState = newStates.get(botId) || initializeBotState(botId);
            
            // Use the latest state from the Map, not the potentially stale closure variable
            const latestMessages = currentState.chatMessages || [];
            const updatedMessages = [...latestMessages, agentResponse]; // Only add agent response
            
            console.log(`🔄 [ChatReference] Latest messages length: ${latestMessages.length}`);
            console.log(`🔄 [ChatReference] Updated messages length: ${updatedMessages.length}`);
            
            const updatedState = { ...currentState, chatMessages: updatedMessages };
            newStates.set(botId, updatedState);
            
            console.log(`✅ [ChatReference] State updated successfully`);
            return newStates;
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
        clearSmartThinkingIndicator();
        
        return;
      } else if (receiptReferenceId && selectedChatbot && user?.uid) {
        console.log('🧾 [ReceiptReference] Detected receipt reference:', receiptReferenceId);
        
        // Process receipt reference for agent context loading
        const receiptReferenceResult = await receiptSharingService.processReceiptReference(
          receiptReferenceId,
          user.uid,
          selectedChatbot.id,
          messageInput.trim()
        );
        
        // Create agent response with receipt analysis (user message already added immediately)
        const agentResponse: ChatMessage = {
          id: `agent_${Date.now()}`,
          content: receiptReferenceResult.agentResponse,
          sender: 'assistant',
          timestamp: new Date(),
          metadata: {
            receiptContext: receiptReferenceResult.context,
            originalReceiptId: receiptReferenceResult.originalReceiptId,
            analysisOptions: receiptReferenceResult.analysisOptions
          }
        };
        
        // Update chat messages in bot state
        if (selectedChatbot) {
          const botId = selectedChatbot.identity?.id || selectedChatbot.key || selectedChatbot.id;
          console.log(`🔄 [ReceiptReference] Updating chat messages for bot: ${botId}`);
          
          setBotStates(prev => {
            const newStates = new Map(prev);
            const currentState = newStates.get(botId) || initializeBotState(botId);
            
            const latestMessages = currentState.chatMessages || [];
            const updatedMessages = [...latestMessages, agentResponse]; // Only add agent response
            
            const updatedState = { ...currentState, chatMessages: updatedMessages };
            newStates.set(botId, updatedState);
            
            console.log(`✅ [ReceiptReference] State updated successfully`);
            return newStates;
          });
        }
        
        // Save to chat history
        const receiptRefFreshBotState = selectedChatbotId ? botStates.get(selectedChatbotId) : null;
        if (receiptRefFreshBotState?.currentChatSession) {
          try {
            await chatHistoryService.addMessageToSession(receiptRefFreshBotState.currentChatSession.id, {
              id: userMessage.id,
              content: userMessage.content,
              sender: userMessage.sender,
              timestamp: userMessage.timestamp,
              agentId: selectedChatbot.id,
              agentName: selectedChatbot.name,
            });
            
            await chatHistoryService.addMessageToSession(receiptRefFreshBotState.currentChatSession.id, {
              id: agentResponse.id,
              content: agentResponse.content,
              sender: agentResponse.sender,
              timestamp: agentResponse.timestamp,
              agentId: selectedChatbot.id,
              agentName: selectedChatbot.name,
              metadata: agentResponse.metadata
            });
            
            // Update bot state with new message count immediately
            const updatedSession = await chatHistoryService.getChatSessionById(receiptRefFreshBotState.currentChatSession.id);
            if (updatedSession) {
              updateBotState(selectedChatbot.id, {
                currentChatSession: updatedSession,
                currentChatName: updatedSession.name
              });
            }
            
            // Trigger chat history panel refresh
            setChatHistoryRefreshTrigger(prev => prev + 1);
          } catch (historyError) {
            console.warn('Failed to save receipt reference to chat history:', historyError);
          }
        }
        
        // Clear input and attachments
        setMessageInput('');
        setAttachedFiles([]);
        setChatLoading(false);
        setIsTyping(false);
        clearSmartThinkingIndicator();
        
        return;
      }
      
      // Regular message processing (existing logic)
      
      // Set dynamic action indicator based on message content
      const messageContent = messageInput.trim().toLowerCase();
      let actionText = "Agent is thinking...";
      
      if (messageContent.includes('research') || messageContent.includes('find') || messageContent.includes('search')) {
        actionText = `Agent is researching "${messageInput.trim().substring(0, 30)}${messageInput.trim().length > 30 ? '...' : ''}"`;
      } else if (messageContent.includes('analyze') || messageContent.includes('data') || messageContent.includes('report')) {
        actionText = "Agent is analyzing data...";
      } else if (messageContent.includes('code') || messageContent.includes('program') || messageContent.includes('script')) {
        actionText = "Agent is writing code...";
      } else if (messageContent.includes('image') || messageContent.includes('picture') || messageContent.includes('photo')) {
        actionText = "Agent is processing images...";
      } else if (messageContent.includes('web') || messageContent.includes('website') || messageContent.includes('url')) {
        actionText = "Agent is browsing the web...";
      } else if (messageContent.includes('calculate') || messageContent.includes('math') || messageContent.includes('number')) {
        actionText = "Agent is calculating...";
      } else if (messageContent.includes('write') || messageContent.includes('create') || messageContent.includes('generate')) {
        actionText = "Agent is creating content...";
      }
      
      setCurrentAction(actionText);
      setActionStartTime(new Date());
      
      // Ensure we have an active session before sending message
      if (!activeSession) {
        console.error('❌ [ChatPanel] No active session found, cannot send message');
        throw new Error('No active chat session. Please try refreshing the page.');
      }
      
      const response = await chatPanelGovernanceService.sendMessage(activeSession.sessionId, messageInput.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
      
      // Update messages with bot response only (user message already added immediately)
      // Fix stale closure issue by using functional update to get latest state
      if (selectedChatbot) {
        const botId = selectedChatbot.identity?.id || selectedChatbot.key || selectedChatbot.id;
        console.log(`🔄 [ChatState] Updating chat messages for bot: ${botId}`);
        console.log(`🔄 [ChatState] Current chatMessages length: ${chatMessages.length}`);
        
        setBotStates(prev => {
          const newStates = new Map(prev);
          const currentState = newStates.get(botId) || initializeBotState(botId);
          
          // Use the latest state from the Map, not the potentially stale closure variable
          const latestMessages = currentState.chatMessages || [];
          const updatedMessages = [...latestMessages, response]; // Only add agent response
          
          console.log(`🔄 [ChatState] Latest messages length: ${latestMessages.length}`);
          console.log(`🔄 [ChatState] Updated messages length: ${updatedMessages.length}`);
          
          const updatedState = { ...currentState, chatMessages: updatedMessages };
          newStates.set(botId, updatedState);
          
          console.log(`✅ [ChatState] State updated successfully`);
          return newStates;
        });
      }
      
      // Save to chat history
      const mainFreshBotState = selectedChatbotId ? botStates.get(selectedChatbotId) : null;
      if (mainFreshBotState?.currentChatSession) {
        try {
          await chatHistoryService.addMessageToSession(mainFreshBotState.currentChatSession.id, {
            id: userMessage.id,
            content: userMessage.content,
            sender: userMessage.sender,
            timestamp: userMessage.timestamp,
            agentId: selectedChatbot.id,
            agentName: selectedChatbot.name,
          });
          
          await chatHistoryService.addMessageToSession(mainFreshBotState.currentChatSession.id, {
            id: response.id,
            content: response.content,
            sender: response.sender,
            timestamp: response.timestamp,
            agentId: selectedChatbot.id,
            agentName: selectedChatbot.name,
            governanceData: response.governanceData,
            shadowGovernanceData: response.shadowGovernanceData,
          });
          
          // Update bot state with new message count immediately
          const updatedSession = await chatHistoryService.getChatSessionById(mainFreshBotState.currentChatSession.id);
          if (updatedSession) {
            updateBotState(selectedChatbot.id, {
              currentChatSession: updatedSession,
              currentChatName: updatedSession.name
            });
          }
          
          // Trigger chat history panel refresh after adding messages
          setChatHistoryRefreshTrigger(prev => prev + 1);
        } catch (historyError) {
          console.warn('Failed to save to chat history:', historyError);
          // Don't break the chat flow if history fails
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
      setCurrentAction(null);
      setActionStartTime(null);
      clearSmartThinkingIndicator();
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
              <Box sx={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
                {/* Shared Conversation Tabs */}
                {sharedConversations.length > 0 && (
                  <SharedChatTabs
                    sharedConversations={sharedConversations}
                    activeConversation={activeSharedConversation}
                    onConversationSelect={handleSharedConversationSelect}
                    onConversationClose={handleSharedConversationClose}
                    onPrivacyToggle={handlePrivacyToggle}
                    isInPrivacyMode={observationState?.isPrivateMode || false}
                  />
                )}

              {/* AI Observation Privacy Controls - Integrated into command center */}
              {activeSharedConversation && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 2,
                  p: 1,
                  bgcolor: observationState?.isPrivateMode ? '#ef444410' : '#10b98110',
                  border: `1px solid ${observationState?.isPrivateMode ? '#ef4444' : '#10b981'}`,
                  borderRadius: 1
                }}>
                  <AIObservationToggle
                    conversationId={activeSharedConversation}
                    currentUserId={user?.uid || ''}
                    currentUserName={user?.displayName || 'User'}
                    participatingAgents={selectedAgents.map(agent => ({
                      id: agent.id,
                      name: agent.name,
                      type: agent.type || 'AI Agent'
                    }))}
                    onPrivacyChange={handlePrivacyChange}
                    position="inline" // Special inline mode for command center integration
                  />
                  
                  {/* Privacy Status Indicator */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ 
                      color: observationState?.isPrivateMode ? '#ef4444' : '#10b981',
                      fontWeight: 600 
                    }}>
                      {observationState?.isPrivateMode ? (
                        '🔒 Private Mode Active - AI agents cannot observe'
                      ) : (
                        '👁️ AI agents are observing this conversation'
                      )}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Multi-Tab Chat Header */}
              <Box sx={{ borderBottom: '1px solid #334155' }}>
                {/* Tab Bar */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  px: 3, 
                  py: 1,
                  bgcolor: '#1e293b',
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': { height: 4 },
                  '&::-webkit-scrollbar-track': { bgcolor: '#334155' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#64748b', borderRadius: 2 }
                }}>
                  {multiChatState.contexts.map((context) => (
                    <Box
                      key={context.id}
                      onClick={() => switchChatContext(context.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        mr: 1,
                        minWidth: 'fit-content',
                        bgcolor: context.isActive ? '#3b82f6' : '#334155',
                        color: context.isActive ? 'white' : '#94a3b8',
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: context.isActive ? '#2563eb' : '#475569'
                        }
                      }}
                    >
                      {context.avatar && (
                        <Avatar 
                          src={context.avatar} 
                          sx={{ width: 20, height: 20, mr: 1 }}
                        />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {context.name}
                      </Typography>
                      {context.unreadCount > 0 && (
                        <Badge 
                          badgeContent={context.unreadCount} 
                          color="error" 
                          sx={{ ml: 1 }}
                        />
                      )}
                      {context.canClose && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeChatContext(context.id);
                          }}
                          sx={{ 
                            ml: 1, 
                            p: 0.5, 
                            color: 'inherit',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                          }}
                        >
                          <Close sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  
                  {/* Add Contact Button */}
                  <IconButton
                    onClick={toggleSidePanel}
                    sx={{
                      ml: 1,
                      color: '#64748b',
                      bgcolor: multiChatState.sidePanel.isOpen ? '#3b82f6' : '#334155',
                      '&:hover': { bgcolor: multiChatState.sidePanel.isOpen ? '#2563eb' : '#475569' }
                    }}
                  >
                    <Group />
                  </IconButton>
                </Box>

                {/* Context Header */}
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      {multiChatState.contexts.find(c => c.isActive)?.name || 'Chat'}
                      {currentBotState?.currentChatName ? ` - ${currentBotState.currentChatName}` : ''}
                    </Typography>
                    
                    {/* Simple Participants Display */}
                    {(() => {
                      const activeContext = multiChatState.contexts.find(c => c.isActive);
                      const hasGuestAgents = activeContext?.guestAgents && activeContext.guestAgents.length > 0;
                      
                      if (multiChatState.activeContextId === 'ai_agent') {
                        return (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '12px', fontWeight: 500 }}>
                              💬 Conversation Participants:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              {/* Host Agent */}
                              <Chip
                                avatar={<Avatar src={selectedChatbot?.identity?.avatar} sx={{ width: 20, height: 20 }} />}
                                label={`${selectedChatbot?.identity?.name || 'Host Agent'} (Host)`}
                                size="small"
                                sx={{
                                  bgcolor: '#3b82f6',
                                  color: 'white',
                                  '& .MuiChip-avatar': { color: 'white' },
                                  opacity: 0.9,
                                  fontSize: '11px'
                                }}
                              />
                              
                              {/* Guest Agents */}
                              {hasGuestAgents && activeContext.guestAgents.map((guest) => (
                                <Chip
                                  key={guest.agentId}
                                  avatar={<Avatar src={guest.avatar} sx={{ width: 20, height: 20 }} />}
                                  label={guest.name}
                                  size="small"
                                  onDelete={() => removeGuestAgent(guest.agentId)}
                                  sx={{
                                    bgcolor: '#10b981',
                                    color: 'white',
                                    '& .MuiChip-avatar': { color: 'white' },
                                    '& .MuiChip-deleteIcon': { 
                                      color: 'white',
                                      '&:hover': { color: '#fecaca' }
                                    },
                                    opacity: 0.9,
                                    fontSize: '11px'
                                  }}
                                />
                              ))}
                              
                              {/* Human Participants */}
                              {humanParticipants.map((human) => (
                                <Chip
                                  key={human.userId}
                                  avatar={
                                    <Box sx={{ position: 'relative' }}>
                                      <Avatar
                                        src={human.avatar}
                                        sx={{ 
                                          width: 20, 
                                          height: 20,
                                          bgcolor: '#3b82f6'
                                        }}
                                      >
                                        {human.displayName.charAt(0)}
                                      </Avatar>
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          bottom: -2,
                                          right: -2,
                                          width: 6,
                                          height: 6,
                                          borderRadius: '50%',
                                          bgcolor: human.isOnline ? '#10b981' : '#6b7280',
                                          border: '1px solid #1e293b'
                                        }}
                                      />
                                    </Box>
                                  }
                                  label={human.displayName}
                                  size="small"
                                  sx={{
                                    bgcolor: '#1e293b',
                                    color: '#e2e8f0',
                                    border: '1px solid #334155',
                                    fontSize: '11px'
                                  }}
                                />
                              ))}
                              
                              {/* Add Human Participant Button */}
                              <Tooltip title="Invite human to conversation" placement="top" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => setShowInviteDialog(true)}
                                  sx={{
                                    bgcolor: '#1e293b',
                                    color: '#64748b',
                                    border: '1px solid #334155',
                                    width: 28,
                                    height: 28,
                                    '&:hover': { bgcolor: '#334155', color: '#e2e8f0' }
                                  }}
                                >
                                  <PersonAdd sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        );
                      } else {
                        return (
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {multiChatState.activeContextId === 'ai_agent' 
                              ? selectedChatbot?.identity?.name || 'Agent'
                              : 'Team Member'
                            }
                          </Typography>
                        );
                      }
                    })()}
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      if (selectedChatbotId) {
                        updateBotState(selectedChatbotId, { isWorkspaceMode: false });
                      }
                    }}
                    sx={{ color: '#64748b', borderColor: '#64748b' }}
                  >
                    ← Back to Agents
                  </Button>
                </Box>
              </Box>

              {/* Chat Messages Area */}
              <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
                {chatMessages.length === 0 && !currentBotState?.currentChatSession ? (
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

                    {/* Chat Reference Preview */}
                    {activeChatReference && (
                      <Box sx={{ width: '100%', maxWidth: '700px', mb: 2 }}>
                        <ChatReferencePreview
                          chatReference={activeChatReference}
                          onDismiss={() => setActiveChatReference(null)}
                        />
                      </Box>
                    )}

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
                  <Stack 
                    spacing={3}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column-reverse', // Reverse direction for bottom-up flow
                      justifyContent: 'flex-start', // Start from bottom
                      minHeight: '100%',
                      paddingBottom: 2
                    }}
                  >
                    {/* Multi-Agent Response Indicator */}
                    {/* Removed intrusive Multi-Agent Response Status box - let conversation flow naturally */}
                    
                    {[...chatMessages].reverse().map((message, index) => {
                      const messageType = getMessageType(message, index, [...chatMessages].reverse());
                      const indentation = getMessageIndentation(messageType);
                      const showConnectingLine = shouldShowConnectingLine(messageType);
                      
                      return (
                        <Box
                          key={message.id}
                          sx={{
                            display: 'flex',
                            justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                            position: 'relative',
                            marginLeft: `${indentation}px`,
                            transition: 'margin-left 0.2s ease'
                          }}
                        >
                          {/* Enhanced Connecting Lines for Behavior Prompt Conversations */}
                          {showConnectingLine && (
                            <>
                              {/* Vertical connecting line */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: -24,
                                  top: messageType === 'behavior-response' ? '50%' : 0,
                                  width: 2,
                                  height: messageType === 'behavior-response' ? '50%' : '100%',
                                  bgcolor: messageType === 'behavior-response' ? '#64748b' : '#10b981',
                                  opacity: 0.4,
                                  zIndex: 1
                                }}
                              />
                              
                              {/* Horizontal connecting line */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: -24,
                                  top: '50%',
                                  width: 20,
                                  height: 2,
                                  bgcolor: messageType === 'behavior-response' ? '#64748b' : '#10b981',
                                  borderRadius: 1,
                                  transform: 'translateY(-50%)',
                                  opacity: 0.6,
                                  zIndex: 2
                                }}
                              />
                              
                              {/* Connection dot */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: -28,
                                  top: '50%',
                                  width: 6,
                                  height: 6,
                                  bgcolor: messageType === 'behavior-response' ? '#64748b' : '#10b981',
                                  borderRadius: '50%',
                                  transform: 'translateY(-50%)',
                                  opacity: 0.8,
                                  zIndex: 3
                                }}
                              />
                            </>
                          )}
                          
                          <Box
                            sx={{
                              maxWidth: '75%',
                              textAlign: message.sender === 'user' ? 'right' : 'left',
                              // Enhanced styling for behavior prompt conversations
                              ...(messageType === 'behavior-response' && {
                                bgcolor: 'rgba(100, 116, 139, 0.08)',
                                borderRadius: 2,
                                p: 1.5,
                                border: '1px solid rgba(100, 116, 139, 0.15)',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                              }),
                              ...(messageType === 'behavior-followup' && {
                                bgcolor: 'rgba(16, 185, 129, 0.08)',
                                borderRadius: 2,
                                p: 1.5,
                                border: '1px solid rgba(16, 185, 129, 0.15)',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                              })
                            }}
                          >
                            {/* Message Type Indicator */}
                            {messageType !== 'regular' && (
                              <Box sx={{ mb: 0.5 }}>
                                <Chip
                                  label={
                                    messageType === 'behavior-response' ? '🎭 Behavior Response' : 
                                    messageType === 'behavior-followup' ? '💬 Follow-up' : ''
                                  }
                                  size="small"
                                  sx={{
                                    bgcolor: messageType === 'behavior-response' ? '#64748b' : '#10b981',
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    height: 20
                                  }}
                                />
                              </Box>
                            )}
                            
                            {/* Multi-Agent Message Header */}
                            {message.metadata?.isMultiAgent && (
                              <Box sx={{ mb: 1 }}>
                                <Chip
                                  label={`${message.metadata.agentName} (${Math.floor(message.metadata.processingTime / 1000)}s)`}
                                  size="small"
                                  sx={{
                                    bgcolor: getAgentColor(message.metadata.agentId, message.metadata.agentName),
                                    color: 'white',
                                    fontSize: '0.7rem'
                                  }}
                                />
                              </Box>
                            )}
                            
                            {/* Recipient Indicator for User Messages in Multi-Agent Mode */}
                            {message.sender === 'user' && (selectedAgents.length > 1 || humanParticipants.length > 0) && (
                              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: '#64748b',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                  }}
                                >
                                  {user?.displayName || user?.email || 'You'}
                                  <Box component="span" sx={{ color: '#94a3b8', mx: 0.5 }}>→</Box>
                                  {(() => {
                                    const recipients = [];
                                    
                                    // Add selected AI agents
                                    selectedAgents.forEach(agentId => {
                                      const agent = chatbotProfiles.find(p => p.id === agentId || p.key === agentId);
                                      if (agent) {
                                        recipients.push(agent.name || agent.identity?.name || 'AI Agent');
                                      }
                                    });
                                    
                                    // Add human participants
                                    humanParticipants.forEach(participant => {
                                      recipients.push(participant.name || participant.email || 'Human');
                                    });
                                    
                                    // If no specific recipients, show current agent
                                    if (recipients.length === 0 && selectedChatbot) {
                                      recipients.push(selectedChatbot.name || selectedChatbot.identity?.name || 'AI Agent');
                                    }
                                    
                                    return recipients.length > 0 ? recipients.join(', ') : 'All Participants';
                                  })()}
                                </Typography>
                              </Box>
                            )}
                            
                            {/* Message Content */}
                            <MarkdownRenderer 
                              content={message.content}
                              sx={{ 
                                fontSize: '0.9rem',
                                mb: 0.5
                              }}
                            />
                            
                            {/* Attachments Display */}
                            <AttachmentRenderer 
                              attachments={message.attachments || []}
                              sx={{ mt: 1 }}
                            />
                            
                            {/* Timestamp */}
                            <Typography variant="caption" sx={{ 
                              color: '#94a3b8', 
                              fontSize: '0.75rem'
                            }}>
                              {message.timestamp.toLocaleTimeString()}
                            </Typography>

                            {/* Small token response icon for multi-agent responses */}
                            {message.metadata?.isMultiAgent && message.sender === 'assistant' && (
                              <TokenResponseIcon
                                agentId={message.metadata.agentId}
                                cost={tokenEconomicsService.estimateMessageCost(message.content)}
                                quality={8} // Default quality, could be dynamic
                                value="high" // Could be calculated based on response
                                onRate={(rating) => {
                                  console.log('📊 [TokenIcon] Rating submitted:', message.metadata.agentName, rating);
                                  // This could trigger updates to agent metrics
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
              
              {/* Chat Input */}
              <Box sx={{ p: 3, borderTop: '1px solid #334155' }}>
                {/* Token Economics Widgets */}
                {/* Removed intrusive Multi-Agent Response Status - let conversation flow naturally */}

                {/* Budget Alerts */}
                {budgetExceeded && (
                  <Alert 
                    severity="error" 
                    sx={{ mb: 2, bgcolor: '#ef444420', border: '1px solid #ef444440' }}
                    onClose={() => setBudgetExceeded(false)}
                  >
                    Budget exceeded! Consider increasing your budget or ending the conversation.
                  </Alert>
                )}

                {budgetWarning && !budgetExceeded && (
                  <Alert 
                    severity="warning" 
                    sx={{ mb: 2, bgcolor: '#f59e0b20', border: '1px solid #f59e0b40' }}
                    onClose={() => setBudgetWarning(false)}
                  >
                    Budget warning: You're approaching your spending limit.
                  </Alert>
                )}
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
                
                {/* Chat Reference Preview */}
                {activeChatReference && (
                  <Box sx={{ mb: 2 }}>
                    <ChatReferencePreview
                      chatReference={activeChatReference}
                      onDismiss={() => setActiveChatReference(null)}
                    />
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, position: 'relative' }}>
                  {/* Autonomous Stars Toggle */}
                  <Tooltip title={autonomousStarsActive ? "Disable Autonomous Stars" : "Enable Autonomous Stars"}>
                    <IconButton
                      onClick={() => setAutonomousStarsActive(!autonomousStarsActive)}
                      sx={{ 
                        color: autonomousStarsActive ? '#f59e0b' : '#94a3b8',
                        mb: 0.5,
                        '&:hover': { color: autonomousStarsActive ? '#d97706' : '#3b82f6' }
                      }}
                    >
                      {autonomousStarsActive ? (
                        <Badge badgeContent="⭐" color="warning">
                          <AutoAwesome />
                        </Badge>
                      ) : (
                        <AutoAwesome />
                      )}
                    </IconButton>
                  </Tooltip>

                  {/* Token Budget Button */}
                  <Tooltip title="Token Budget Tracker">
                    <IconButton
                      onClick={() => setShowTokenBudget(true)}
                      sx={{ 
                        color: '#10b981',
                        mb: 0.5,
                        '&:hover': { color: '#059669' }
                      }}
                    >
                      <WalletIcon />
                    </IconButton>
                  </Tooltip>

                  {/* Add Menu Button */}
                  <IconButton
                    onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                    sx={{ color: '#94a3b8', mb: 0.5 }}
                  >
                    <Add />
                  </IconButton>
                  
                  {/* Enhanced Multi-Agent Text Input with Avatar Selector */}
                  <Box sx={{ flex: 1, position: 'relative' }}>
                    {/* Always use AgentAvatarSelector for intuitive multi-agent interaction */}
                    {(() => {
                      // Always use the new avatar-based system with integrated input design
                      return (
                          <>
                            {/* Smart Thinking Indicator - Right Above Input */}
                            {(isTyping || currentAction || currentActivity) && (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1, px: 1 }}>
                                <Box 
                                  sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 2, 
                                    py: 0.75,
                                    bgcolor: 'rgba(55, 65, 81, 0.9)', 
                                    color: '#d1d5db', 
                                    borderRadius: '16px',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(75, 85, 99, 0.4)',
                                    maxWidth: 'fit-content',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {/* Progress indicator for thinking duration */}
                                  <LinearProgress 
                                    variant="indeterminate" 
                                    sx={{ 
                                      position: 'absolute',
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      height: 2,
                                      bgcolor: 'transparent',
                                      '& .MuiLinearProgress-bar': { 
                                        bgcolor: currentActivity.includes('analyzing') ? '#f59e0b' : 
                                                currentActivity.includes('searching') ? '#10b981' : '#3b82f6',
                                        opacity: 0.6
                                      }
                                    }} 
                                  />

                                  {/* Multi-agent avatars or single agent avatar */}
                                  {thinkingAgents.length > 1 ? (
                                    <AvatarGroup 
                                      max={3} 
                                      sx={{ 
                                        '& .MuiAvatar-root': { 
                                          width: 20, 
                                          height: 20,
                                          border: '2px solid #3b82f6',
                                          animation: 'pulse-border 2s infinite',
                                          '@keyframes pulse-border': {
                                            '0%, 100%': { borderColor: '#3b82f6', transform: 'scale(1)' },
                                            '50%': { borderColor: '#60a5fa', transform: 'scale(1.05)' }
                                          }
                                        }
                                      }}
                                    >
                                      {thinkingAgents.map(agent => (
                                        <Avatar 
                                          key={agent.id} 
                                          src={agent.avatar}
                                          sx={{ fontSize: '0.75rem' }}
                                        >
                                          {agent.name.charAt(0)}
                                        </Avatar>
                                      ))}
                                    </AvatarGroup>
                                  ) : currentRespondingAgent?.avatar && (
                                    <Avatar 
                                      src={currentRespondingAgent.avatar} 
                                      sx={{ 
                                        width: 20, 
                                        height: 20,
                                        border: '2px solid #3b82f6',
                                        animation: 'pulse-border 2s infinite',
                                        fontSize: '0.75rem',
                                        '@keyframes pulse-border': {
                                          '0%, 100%': { borderColor: '#3b82f6', transform: 'scale(1)' },
                                          '50%': { borderColor: '#60a5fa', transform: 'scale(1.05)' }
                                        }
                                      }}
                                    >
                                      {currentRespondingAgent.name.charAt(0)}
                                    </Avatar>
                                  )}

                                  {/* Enhanced animated dots with activity-based colors */}
                                  <Box sx={{ display: 'flex', gap: 0.3, alignItems: 'center' }}>
                                    {[0, 1, 2].map((i) => (
                                      <Box
                                        key={i}
                                        sx={{
                                          width: 4,
                                          height: 4,
                                          borderRadius: '50%',
                                          ...getActivityStyle(currentActivity),
                                          animationDelay: `${i * 0.2}s`,
                                          '@keyframes pulse': {
                                            '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                                            '40%': { opacity: 1, transform: 'scale(1.2)' }
                                          },
                                          '@keyframes slow-pulse': {
                                            '0%, 80%, 100%': { opacity: 0.2, transform: 'scale(0.7)' },
                                            '40%': { opacity: 1, transform: 'scale(1.3)' }
                                          },
                                          '@keyframes search-pulse': {
                                            '0%, 100%': { opacity: 0.4, transform: 'scale(0.9)' },
                                            '50%': { opacity: 1, transform: 'scale(1.1)' }
                                          },
                                          '@keyframes deep-pulse': {
                                            '0%, 90%, 100%': { opacity: 0.2, transform: 'scale(0.6)' },
                                            '45%': { opacity: 1, transform: 'scale(1.4)' }
                                          }
                                        }}
                                      />
                                    ))}
                                  </Box>
                                  
                                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                    {thinkingAgents.length > 1 
                                      ? `${thinkingAgents.length} agents are collaborating...`
                                      : currentRespondingAgent 
                                        ? `${currentRespondingAgent.name} is ${currentActivity || 'thinking...'}` 
                                        : `${selectedChatbot?.identity?.name || 'Agent'} is ${currentActivity || 'thinking...'}`}
                                  </Typography>
                                </Box>
                              </Box>
                            )}

                            {/* Integrated Input with Avatar Selection Inside */}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              p: 1,
                              bgcolor: '#1e293b',
                              borderRadius: 2,
                              border: '1px solid #334155',
                              mb: 1
                            }}>
                              {/* Text Input with Integrated Avatar Selector */}
                              <TextField
                                fullWidth
                                placeholder="Type your message... (or use @agent-name or @human-name)"
                                value={messageInput}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyNavigation}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    if (showSuggestions && selectedSuggestionIndex >= 0) {
                                      e.preventDefault();
                                      handleSuggestionSelect(smartSuggestions[selectedSuggestionIndex]);
                                    } else {
                                      handleSendMessage();
                                    }
                                  }
                                }}
                                onPaste={handlePaste}
                                onFocus={() => {
                                  if (autonomousStarsActive && messageInput.trim()) {
                                    setShowSuggestions(true);
                                  }
                                }}
                                onBlur={() => {
                                // Delay hiding suggestions to allow clicking
                                setTimeout(() => setShowSuggestions(false), 200);
                              }}
                              variant="outlined"
                              disabled={chatLoading}
                              multiline
                              maxRows={4}
                              InputProps={{
                                startAdornment: (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 0.5, 
                                    mr: 1,
                                    flexShrink: 0
                                  }}>
                                    {/* Agent Avatar Selector - Inside Input */}
                                    <AgentAvatarSelector
                                      hostAgent={getHostAgent()}
                                      guestAgents={getGuestAgents()}
                                      selectedAgents={selectedAgents}
                                      onSelectionChange={handleAgentSelectionChange}
                                      teamMembers={getTeamMembers()}
                                      aiAgents={getAIAgents()}
                                      onAddGuests={handleAddGuests}
                                      humanParticipants={humanParticipants.map(h => ({
                                        id: h.userId,
                                        name: h.name,
                                        type: 'human' as const,
                                        role: h.role,
                                        status: h.isOnline ? 'online' as const : 'offline' as const,
                                        avatar: h.avatar
                                      }))}
                                      selectedTarget={selectedTarget}
                                      onTargetChange={handleTargetChange}
                                      onBehaviorPrompt={handleBehaviorPrompt}
                                      currentUserId={user?.uid}
                                      currentUserName={user?.displayName || 'User'}
                                      conversationId={`conv_${selectedChatbot?.id || 'default'}`}
                                      conversationName={`${selectedChatbot?.name || 'AI'} Collaboration`}
                                    />
                                    
                                    {/* Behavioral Orchestration Hover Triggers */}
                                    <HoverOrchestrationTrigger
                                      participants={participantData}
                                      onBehaviorChange={handleBehaviorChange}
                                      onQuickBehaviorTrigger={handleQuickBehaviorTrigger}
                                      currentUserId={user?.uid || ''}
                                      showBehavioralControls={isInSharedMode || selectedAgents.length > 1}
                                    />
                                  </Box>
                                )
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  bgcolor: '#0f172a',
                                  color: 'white',
                                  '& fieldset': { 
                                    borderColor: autonomousStarsActive ? '#f59e0b' : '#475569',
                                    borderWidth: 1
                                  },
                                  '&:hover fieldset': { borderColor: '#3b82f6' },
                                  '&.Mui-focused fieldset': { 
                                    borderColor: autonomousStarsActive ? '#f59e0b' : '#3b82f6',
                                    borderWidth: 2
                                  },
                                  '& input::placeholder': {
                                    color: '#9ca3af',
                                    opacity: 1
                                  }
                                }
                              }}
                            />
                            </Box>
                            
                            {/* Amazon-Style Smart Suggestions Dropdown (Below Input) */}
                            {showSuggestions && smartSuggestions.length > 0 && (
                              <Paper
                                sx={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  zIndex: 1000,
                                  bgcolor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 1,
                                  mt: 0.5,
                                  maxHeight: 200,
                                  overflow: 'auto',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                              >
                                {smartSuggestions.map((suggestion, index) => (
                                  <Box
                                    key={index}
                                    onClick={() => handleSuggestionSelect(suggestion)}
                                    sx={{
                                      p: 1.5,
                                      cursor: 'pointer',
                                      bgcolor: selectedSuggestionIndex === index ? '#f3f4f6' : 'transparent',
                                      '&:hover': { bgcolor: '#f9fafb' },
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1.5,
                                      borderBottom: index < smartSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none'
                                    }}
                                  >
                                    <Box sx={{ color: '#6b7280', fontSize: '16px', minWidth: '20px' }}>
                                      {suggestion.includes('Create') ? '💡' : 
                                       suggestion.includes('team') ? '👥' : 
                                       suggestion.includes('project') ? '📁' : 
                                       suggestion.includes('task') ? '🚀' : 
                                       suggestion.includes('Continue') ? '▶️' : 
                                       suggestion.includes('Check') ? '📬' : '⭐'}
                                    </Box>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        color: '#374151', 
                                        flex: 1,
                                        fontSize: '14px',
                                        fontWeight: selectedSuggestionIndex === index ? 500 : 400
                                      }}
                                    >
                                      {suggestion}
                                    </Typography>
                                  </Box>
                                ))}
                              </Paper>
                            )}
                          </>
                      );
                    })()}
                  </Box>
                  
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
            <Box sx={{ 
              flex: '0 0 40%', 
              bgcolor: '#1e293b', 
              borderLeft: '1px solid #334155',
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Panel Header */}
              <Box sx={{ p: 3, borderBottom: '1px solid #334155', flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#3b82f6' }}>
                    {selectedChatbot?.identity?.name?.charAt(0) || 'A'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      {selectedChatbot?.identity?.name || 'Agent'} • Custom
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Live • Enterprise
                    </Typography>
                  </Box>
                </Box>
                
                {/* Command Panel Tabs */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { key: 'team', label: 'TEAM', badge: unreadTeamCount },
                    { key: 'chats', label: 'CHATS' },
                    { key: 'repo', label: 'REPO', badge: projects.length },
                    { key: 'analytics', label: 'ANALYTICS' },
                    { key: 'mas_collaboration', label: 'MAS COLLABORATION', badge: 0 },
                    { key: 'token_economics', label: 'TOKEN ECONOMICS', badge: budgetWarning || budgetExceeded ? 1 : 0 },
                    { key: 'customize', label: 'CUSTOMIZE' },
                    { key: 'personality', label: 'PERSONALITY' },
                    { key: 'knowledge', label: 'AI KNOWLEDGE' },
                    { key: 'tools', label: 'TOOLS' },
                    { key: 'chat_interface', label: 'CHAT INTERFACE' },
                    { key: 'integrations', label: 'INTEGRATIONS' },
                    { key: 'rag_policy', label: 'RAG + POLICY' },
                    { key: 'automation', label: 'AUTOMATION' },
                    { key: 'receipts', label: 'RECEIPTS' },
                    { key: 'memory', label: 'MEMORY' },
                    { key: 'sandbox', label: 'SANDBOX' },
                    { key: 'live_agent', label: 'LIVE AGENT', badge: autonomousMode ? 1 : 0, isLiveAgent: true },
                    { key: 'governance', label: 'GOVERNANCE' },
                    { key: 'debug', label: 'DEBUG' }
                  ].map((tab) => (
                    <Badge
                      key={tab.key}
                      badgeContent={tab.badge || 0}
                      color={tab.isLiveAgent && autonomousMode ? "success" : "error"}
                      invisible={!tab.badge || tab.badge === 0}
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.6rem',
                          height: 16,
                          minWidth: 16
                        }
                      }}
                    >
                      <Button
                        size="small"
                        variant={rightPanelType === tab.key ? 'contained' : 'outlined'}
                        onClick={() => {
                          if (tab.key === 'live_agent') {
                            handleLiveAgentTabClick();
                          } else {
                            setRightPanelType(tab.key as RightPanelType);
                          }
                        }}
                        sx={{
                          fontSize: '0.7rem',
                          px: 1.5,
                          py: 0.5,
                          minWidth: 'auto',
                          borderColor: '#374151',
                          color: (rightPanelType === tab.key || (tab.key === 'live_agent' && liveAgentPanelOpen)) ? 'white' : '#94a3b8',
                          bgcolor: (rightPanelType === tab.key || (tab.key === 'live_agent' && liveAgentPanelOpen)) ? '#3b82f6' : 'transparent',
                          '&:hover': { 
                            borderColor: '#4b5563', 
                            bgcolor: (rightPanelType === tab.key || (tab.key === 'live_agent' && liveAgentPanelOpen)) ? '#2563eb' : '#374151' 
                          },
                        }}
                      >
                        {tab.label}
                      </Button>
                    </Badge>
                  ))}
                </Box>
              </Box>

              {/* Panel Content */}
              <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {rightPanelType === 'team' && (
                  <TeamPanel 
                    currentUserId={user?.uid} 
                    onAddGuestAgent={addGuestAgent}
                    onAddHumanToChat={(humans) => {
                      setPendingHumanInvites(humans);
                      setShowHumanInviteConfirmDialog(true);
                    }}
                  />
                )}
                
                {rightPanelType === 'repo' && (
                  <RepositoryBrowser
                    projects={projects}
                    templates={projectTemplates}
                    onProjectCreate={async (template: ProjectTemplate, projectName: string) => {
                      try {
                        console.log('📁 [Repository] Creating project from template:', template.name);
                        
                        // Create new project
                        const newProject = await repositoryManager.createProjectFromTemplate(
                          template,
                          projectName,
                          user?.uid || 'anonymous'
                        );
                        
                        // Update projects list
                        setProjects(prev => [...prev, newProject]);
                        
                        // Start autonomous mode for project setup
                        if (autonomousGovernance) {
                          const taskPlan = await autonomousGovernance.createTaskPlan({
                            goal: `Set up ${projectName} project using ${template.name} template`,
                            context: {
                              projectId: newProject.id,
                              templateId: template.id,
                              projectName,
                              templateName: template.name
                            }
                          });
                          
                          console.log('🤖 [Autonomous] Starting project setup task:', taskPlan);
                        }
                        
                        console.log('✅ [Repository] Project created successfully:', newProject);
                      } catch (error) {
                        console.error('❌ [Repository] Failed to create project:', error);
                      }
                    }}
                    onProjectSelect={(project: WorkflowProject) => {
                      console.log('📁 [Repository] Project selected:', project.name);
                      // Could integrate with Live Agent to show project status
                    }}
                    repositoryManager={repositoryManager}
                    versionControl={versionControl}
                    currentUserId={user?.uid || 'anonymous'}
                  />
                )}
                
                {rightPanelType === 'mas_collaboration' && (
                  <MASCollaborationPanel
                    settings={{
                      chatFeatures: {
                        conversationContextSharing: true,
                        crossAgentReferences: true,
                        realTimeCollaboration: true,
                        visualAgentSelection: true,
                        mentionSystemEnabled: true
                      },
                      // 🔧 CRITICAL FIX: Add missing agentToAgentCommunication property
                      agentToAgentCommunication: {
                        enabled: true,
                        allowDirectTagging: true,
                        hoverTriggeredResponses: false,
                        autoResponseToMentions: true,
                        crossAgentConversations: true,
                        responseDelay: 2,
                        maxChainLength: 3
                      },
                      autonomousBehaviors: {
                        proactiveInterjection: false,
                        smartSuggestions: true,
                        contextualHandRaising: true,
                        triggerBasedEngagement: true,
                        collaborativeFiltering: true
                      },
                      temporaryRoles: {},
                      tokenEconomics: {
                        maxTokensPerAgent: 1000,
                        suggestionThreshold: 70,
                        monitoringBudget: 100,
                        interjectionCost: 150,
                        enableSmartBudgeting: true
                      },
                      triggerSettings: {
                        keywordTriggers: ['question', 'problem', 'help', 'idea'],
                        topicTriggers: ['technical', 'creative', 'analysis'],
                        questionTriggers: true,
                        disagreementTriggers: true,
                        expertiseTriggers: true,
                        sensitivityLevel: 5
                      }
                    }}
                    onSettingsChange={(settings: MASCollaborationSettings) => {
                      console.log('🎛️ [MAS] Settings updated:', settings);
                      // TODO: Persist settings and apply to multi-agent system
                    }}
                    availableAgents={[
                      ...(selectedChatbot ? [{
                        id: selectedChatbot.id,
                        name: selectedChatbot.identity?.name || 'Host Agent',
                        avatar: selectedChatbot.identity?.avatar,
                        expertise: selectedChatbot.expertise || []
                      }] : []),
                      ...(multiChatState.contexts.find(c => c.isActive)?.guestAgents || []).map(guest => ({
                        id: guest.agentId,
                        name: guest.name,
                        avatar: guest.avatar,
                        expertise: []
                      }))
                    ]}
                    currentTokenUsage={{
                      ...(selectedChatbot ? {
                        [selectedChatbot.id]: {
                          used: 450,
                          budget: 1000,
                          efficiency: 0.85
                        }
                      } : {}),
                      ...(multiChatState.contexts.find(c => c.isActive)?.guestAgents || []).reduce((acc, guest) => ({
                        ...acc,
                        [guest.agentId]: {
                          used: 320,
                          budget: 1000,
                          efficiency: 0.92
                        }
                      }), {})
                    }}
                  />
                )}
                
                {rightPanelType === 'chats' && selectedChatbot && (
                  <ChatHistoryPanel
                    agentId={selectedChatbot.id}
                    agentName={selectedChatbot.name}
                    currentSessionId={currentBotState?.currentChatSession?.id}
                    refreshTrigger={currentBotState?.chatHistoryRefreshTrigger || 0} // Use bot state refresh trigger
                    onChatSelect={(session) => {
                      console.log(`🔄 [ChatHistory] Chat selected:`, session);
                      console.log(`🔄 [ChatHistory] Session has ${session.messages?.length || 0} messages`);
                      console.log(`🔄 [ChatHistory] Selected chatbot ID: ${selectedChatbotId}`);
                      
                      if (selectedChatbotId) {
                        updateBotState(selectedChatbotId, { 
                          currentChatSession: session,
                          currentChatName: session.name || `Chat ${session.id.slice(-8)}`
                        });
                        console.log(`🔄 [ChatHistory] Updated bot state with session: ${session.name}`);
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
                      
                      console.log(`🔄 [ChatHistory] Mapped ${newMessages.length} messages:`, newMessages);
                      
                      if (selectedChatbotId) {
                        console.log(`🔄 [ChatHistory] Loading ${newMessages.length} messages for bot: ${selectedChatbotId}`);
                        
                        // Use direct state update to avoid any potential stale closure issues
                        setBotStates(prev => {
                          const newStates = new Map(prev);
                          const currentState = newStates.get(selectedChatbotId) || initializeBotState(selectedChatbotId);
                          console.log(`🔄 [ChatHistory] Current state before update:`, currentState);
                          
                          const updatedState = { ...currentState, chatMessages: newMessages };
                          console.log(`🔄 [ChatHistory] Updated state:`, updatedState);
                          
                          newStates.set(selectedChatbotId, updatedState);
                          
                          console.log(`✅ [ChatHistory] Loaded ${newMessages.length} messages successfully`);
                          console.log(`✅ [ChatHistory] Bot state updated for: ${selectedChatbotId}`);
                          return newStates;
                        });
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
                    onShareChat={async (shareableId: string) => {
                      console.log('🔗 [ShareChat] onShareChat callback triggered with shareableId:', shareableId);
                      
                      if (selectedChatbotId && user?.uid) {
                        console.log('🔗 [ShareChat] selectedChatbotId found:', selectedChatbotId);
                        
                        try {
                          // Extract the session ID from the shareable ID (format: chat_timestamp_randomId)
                          const sessionId = shareableId;
                          console.log('🔗 [ShareChat] Attempting to get session data for:', sessionId);
                          
                          // Get the session data from ChatHistoryService
                          const session = await chatHistoryService.getChatSessionById(sessionId);
                          
                          if (session) {
                            console.log('🔗 [ShareChat] Session data retrieved:', session);
                            
                            // Extract preview text from the first few messages
                            const previewText = session.messages
                              .slice(0, 2)
                              .map(msg => msg.content)
                              .join(' ')
                              .substring(0, 150) + (session.messages.length > 2 || session.messages.join(' ').length > 150 ? '...' : '');
                            
                            // Extract topics from message content (simple keyword extraction)
                            const allText = session.messages.map(msg => msg.content).join(' ').toLowerCase();
                            const commonTopics = ['audit', 'governance', 'compliance', 'security', 'data', 'policy', 'risk', 'logs', 'monitoring'];
                            const detectedTopics = commonTopics.filter(topic => allText.includes(topic));
                            
                            // Set the active chat reference for visual preview
                            setActiveChatReference({
                              id: sessionId,
                              name: session.name || `Chat ${sessionId.slice(-8)}`,
                              preview: previewText,
                              messageCount: session.messageCount || session.messages.length,
                              lastUpdated: session.lastUpdated || new Date(),
                              topics: detectedTopics.length > 0 ? detectedTopics : undefined
                            });
                            
                            console.log('✅ Chat reference preview created for:', sessionId);
                          } else {
                            console.error('❌ [ShareChat] Session not found for ID:', sessionId);
                            // Fallback: create a basic preview with just the ID
                            setActiveChatReference({
                              id: sessionId,
                              name: `Chat ${sessionId.slice(-8)}`,
                              preview: 'Chat content preview not available',
                              messageCount: 0,
                              lastUpdated: new Date()
                            });
                          }
                        } catch (error) {
                          console.error('❌ [ShareChat] Error retrieving session data:', error);
                          // Fallback: create a basic preview
                          setActiveChatReference({
                            id: shareableId,
                            name: `Chat ${shareableId.slice(-8)}`,
                            preview: 'Chat content preview not available',
                            messageCount: 0,
                            lastUpdated: new Date()
                          });
                        }
                      } else {
                        console.error('❌ [ShareChat] No selectedChatbotId or user found');
                      }
                    }}                />
                )}

                {rightPanelType === 'analytics' && selectedChatbot && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold', fontSize: '1.1rem' }}>
                      Enhanced Analytics Dashboard
                    </Typography>
                    
                    {/* Real-time Status */}
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: autonomousMode ? '#10b981' : '#6b7280',
                            animation: autonomousMode ? 'pulse 2s infinite' : 'none'
                          }} />
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                            Agent Status: {autonomousMode ? 'Autonomous Mode Active' : 'Interactive Mode'}
                          </Typography>
                        </Box>
                        {currentTaskPlan && (
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Current Task: {currentTaskPlan.goal}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Enhanced Key Metrics */}
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
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                              Avg last 24h
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
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                              User feedback
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.75rem' }}>
                              Autonomous Tasks
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1rem' }}>
                              {projects.length}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                              Active projects
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.75rem' }}>
                              Team Collaboration
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '1rem' }}>
                              {unreadTeamCount}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                              Unread messages
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Autonomous Mode Analytics */}
                    {autonomousMode && currentTaskPlan && (
                      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="body1" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                            Autonomous Execution Analytics
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                Progress
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#10b981' }}>
                                {Math.round((currentTaskPlan.currentPhaseId / currentTaskPlan.phases.length) * 100)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(currentTaskPlan.currentPhaseId / currentTaskPlan.phases.length) * 100}
                              sx={{ 
                                bgcolor: '#334155',
                                '& .MuiLinearProgress-bar': { bgcolor: '#10b981' }
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Phase {currentTaskPlan.currentPhaseId} of {currentTaskPlan.phases.length}: {
                              currentTaskPlan.phases.find(p => p.id === currentTaskPlan.currentPhaseId)?.title || 'Unknown'
                            }
                          </Typography>
                        </CardContent>
                      </Card>
                    )}

                    {/* Team Collaboration Analytics */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="body1" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                              Team Collaboration Metrics
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                                    {teamMembers.length}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    Team Members
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                    {teamConversations.length}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    Active Chats
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
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
                
                {rightPanelType === 'chat_interface' && (
                  <ChatInterfacePanel />
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
                  <AgentReceiptViewer 
                    agentId={selectedChatbot?.id || ''}
                    agentName={selectedChatbot?.name || 'Agent'}
                    onClose={() => {
                      if (selectedChatbotId) {
                        updateBotState(selectedChatbotId, { rightPanelType: null });
                      }
                    }}
                    onReceiptClick={handleReceiptShare}
                    enableInteractiveMode={true}
                    currentUserId={user?.uid || ''}
                    currentSessionId={currentBotState?.currentSessionId || ''}
                  />
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

                {rightPanelType === 'token_economics' && user?.uid && (
                  <Box>
                    <TokenEconomicsConfigPanel
                      sessionId={currentMultiAgentSession || `session_${selectedChatbot?.identity?.id || selectedChatbot?.id}_${Date.now()}`}
                      userId={user.uid}
                      onConfigChange={(config) => {
                        console.log('💰 [TokenEconomics] Configuration updated:', config);
                        // Update local state based on config changes
                        setBudgetWarning(false);
                        setBudgetExceeded(false);
                      }}
                    />
                  </Box>
                )}

                {rightPanelType === 'debug' && (
                  <DebugPanel />
                )}
              </Box>
            </Box>
            
            {/* Sliding Contact Panel */}
            <Slide direction="left" in={multiChatState.sidePanel.isOpen} mountOnEnter unmountOnExit>
              <Box sx={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: 320,
                height: '100vh',
                bgcolor: '#0f172a',
                borderLeft: '1px solid #334155',
                zIndex: 1300,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.3)'
              }}>
                {/* Contact Panel Header */}
                <Box sx={{ 
                  p: 3, 
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Team Contacts
                  </Typography>
                  <IconButton
                    onClick={toggleSidePanel}
                    sx={{ color: '#64748b' }}
                  >
                    <Close />
                  </IconButton>
                </Box>

                {/* Contact Search */}
                <Box sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search team members..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#64748b', fontSize: 18 }} />
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
                </Box>

                {/* Online Members */}
                <Box sx={{ px: 2, pb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    ONLINE NOW ({teamMembers.filter(m => m.isOnline).length})
                  </Typography>
                </Box>

                {/* Contact List */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {teamMembers.map((member) => (
                    <Box
                      key={member.id}
                      onClick={() => {
                        addChatContext({
                          id: `human_${member.id}`,
                          type: 'human_chat',
                          name: member.name,
                          avatar: member.avatar,
                          unreadCount: 0,
                          canClose: true
                        });
                        toggleSidePanel();
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        mx: 2,
                        mb: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: '#1e293b'
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', mr: 2 }}>
                        <Avatar 
                          src={member.avatar} 
                          sx={{ width: 36, height: 36 }}
                        >
                          {member.name.charAt(0)}
                        </Avatar>
                        {member.isOnline && (
                          <Box sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 12,
                            height: 12,
                            bgcolor: '#10b981',
                            borderRadius: '50%',
                            border: '2px solid #0f172a'
                          }} />
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                          {member.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {member.role} • {member.isOnline ? 'Online' : 'Offline'}
                        </Typography>
                      </Box>
                      {member.unreadCount > 0 && (
                        <Badge 
                          badgeContent={member.unreadCount} 
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.6rem',
                              height: 16,
                              minWidth: 16
                            }
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>

                {/* Quick Actions */}
                <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Group />}
                    sx={{
                      borderColor: '#334155',
                      color: '#94a3b8',
                      '&:hover': {
                        borderColor: '#3b82f6',
                        bgcolor: '#1e293b'
                      }
                    }}
                  >
                    Create Team Channel
                  </Button>
                </Box>
              </Box>
            </Slide>
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
                                {chatbot?.identity?.name?.charAt(0) || 'A'}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
                                  {chatbot?.identity?.name || 'Agent'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                                  {chatbot?.identity?.role || 'Assistant'}
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

      {/* Live Agent Panel - Slides out from right */}
      <Slide direction="left" in={liveAgentPanelOpen} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: { xs: '100%', md: '400px', lg: '450px' },
            height: '100vh',
            bgcolor: '#1e293b',
            borderLeft: '1px solid #334155',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Live Agent Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid #334155', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: autonomousMode ? '#10b981' : '#6b7280',
                  animation: autonomousMode ? 'pulse 2s infinite' : 'none'
                }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Live Agent Monitor
                </Typography>
              </Box>
              <IconButton 
                onClick={toggleLiveAgentPanel}
                sx={{ color: '#64748b', '&:hover': { color: 'white' } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {autonomousMode ? 'Agent is working autonomously' : 'Agent is idle'}
            </Typography>
          </Box>

          {/* Live Agent Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {currentTaskPlan ? (
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Current Task: {currentTaskPlan.goal}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                    Progress
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(currentTaskPlan.currentPhaseId / currentTaskPlan.phases.length) * 100}
                    sx={{ 
                      bgcolor: '#334155',
                      '& .MuiLinearProgress-bar': { bgcolor: '#10b981' }
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    Phases
                  </Typography>
                  {currentTaskPlan.phases.map((phase, index) => (
                    <Box key={phase.id} sx={{ mb: 2, p: 2, bgcolor: '#0f172a', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: phase.status === 'completed' ? '#10b981' : 
                                   phase.status === 'in_progress' ? '#f59e0b' : '#6b7280'
                        }} />
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                          {phase.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                        {phase.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
                  No active autonomous tasks
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Start an autonomous task to see live monitoring here
                </Typography>
              </Box>
            )}
          </Box>

          {/* Live Agent Controls */}
          {autonomousMode && currentTaskPlan && (
            <Box sx={{ p: 3, borderTop: '1px solid #334155', flexShrink: 0 }}>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={stopAutonomousMode}
                sx={{ mb: 1 }}
              >
                Stop Autonomous Mode
              </Button>
            </Box>
          )}
        </Box>
      </Slide>

      {/* Token Budget Popup */}
      <TokenBudgetPopup
        open={showTokenBudget}
        onClose={() => setShowTokenBudget(false)}
        sessionId={currentMultiAgentSession || (selectedChatbot ? `session_${selectedChatbot.identity?.id || selectedChatbot.id}_${Date.now()}` : undefined)}
      />

      {/* Human Invitation Dialog */}
      <Dialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ color: '#e2e8f0', borderBottom: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAdd sx={{ color: '#3b82f6' }} />
            <Typography variant="h6">Invite Human to Conversation</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
            Invite a human participant to join this AI conversation. They'll be able to interact with AI agents and receive behavioral responses.
          </Typography>
          
          <TextField
            fullWidth
            label="Email Address"
            variant="outlined"
            placeholder="colleague@company.com"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0f172a',
                color: '#e2e8f0',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#475569' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
              },
              '& .MuiInputLabel-root': { color: '#94a3b8' }
            }}
          />
          
          <TextField
            fullWidth
            label="Personal Message (Optional)"
            variant="outlined"
            multiline
            rows={3}
            placeholder="Join me for an AI-powered collaboration session..."
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0f172a',
                color: '#e2e8f0',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#475569' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
              },
              '& .MuiInputLabel-root': { color: '#94a3b8' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #334155' }}>
          <Button
            onClick={() => setShowInviteDialog(false)}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              // TODO: Implement invitation sending
              console.log('👥 [Human Invitation] Sending invitation...');
              setShowInviteDialog(false);
            }}
            sx={{
              bgcolor: '#3b82f6',
              color: 'white',
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Human Invitation Confirmation Dialog */}
      <Dialog
        open={showHumanInviteConfirmDialog}
        onClose={() => {
          setShowHumanInviteConfirmDialog(false);
          setPendingHumanInvites([]);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ color: '#e2e8f0', borderBottom: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAdd sx={{ color: '#3b82f6' }} />
            <Typography variant="h6">Send Chat Invitation?</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#e2e8f0', mb: 2 }}>
            You're about to invite {pendingHumanInvites.length} team member{pendingHumanInvites.length !== 1 ? 's' : ''} to join this conversation:
          </Typography>
          
          {pendingHumanInvites.map((human, index) => (
            <Box key={human.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, p: 1, bgcolor: '#0f172a', borderRadius: 1 }}>
              <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                {human.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                  {human.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {human.role || 'Team Member'}
                </Typography>
              </Box>
            </Box>
          ))}
          
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 2 }}>
            They will receive a notification and can choose to accept or decline the invitation.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #334155' }}>
          <Button
            onClick={() => {
              setShowHumanInviteConfirmDialog(false);
              setPendingHumanInvites([]);
            }}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              console.log('📨 Sending invitations to:', pendingHumanInvites);
              
              try {
                // Get current conversation info
                const currentConversationId = selectedChatbot?.id || 'default-conversation';
                const currentConversationName = selectedChatbot?.identity?.name || 'AI Conversation';
                const currentUserId = user?.uid || 'unknown-user'; // Use real authenticated user ID
                const currentUserName = user?.displayName || user?.email || 'Current User'; // Use real user name
                
                // Create invitation requests for each pending human
                const invitationRequests: AICollaborationInvitationRequest[] = pendingHumanInvites.map(human => ({
                  fromUserId: currentUserId,
                  fromUserName: currentUserName,
                  toUserId: human.id,
                  toUserName: human.name,
                  conversationId: currentConversationId,
                  conversationName: currentConversationName,
                  agentName: selectedChatbot?.identity?.name,
                  message: `Join me in collaborating with ${selectedChatbot?.identity?.name || 'AI'}`
                }));
                
                // Send invitations through the notification system
                const userIds = invitationRequests.map(req => req.toUserId);
                await aiCollaborationInvitationService.sendInvitationToMultipleUsers(
                  user?.uid || '',
                  user?.displayName || user?.email || 'User',
                  userIds,
                  conversationId,
                  conversationName,
                  selectedChatbot?.identity?.name,
                  `Join me in collaborating with ${selectedChatbot?.identity?.name || 'AI'}`
                );
                
                console.log(`✅ Successfully sent ${invitationRequests.length} collaboration invitations`);
                
                // For now, also add them directly (in real implementation, wait for acceptance)
                await handleAddHumans(pendingHumanInvites);
                
              } catch (error) {
                console.error('❌ Error sending invitations:', error);
                // Still add them directly as fallback
                await handleAddHumans(pendingHumanInvites);
              }
              
              setShowHumanInviteConfirmDialog(false);
              setPendingHumanInvites([]);
            }}
            sx={{
              bgcolor: '#3b82f6',
              color: 'white',
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            Send Invitation{pendingHumanInvites.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conversation Invitation Dialog */}
      <ConversationInvitationDialog
        open={showInvitationDialog}
        onClose={() => {
          setShowInvitationDialog(false);
          setCurrentConversationForInvite(null);
        }}
        onSendInvitations={handleSendEmailInvitations}
        conversationName={
          currentConversationForInvite 
            ? sharedConversations.find(conv => conv.id === currentConversationForInvite)?.name || 'AI Conversation'
            : 'AI Conversation'
        }
        currentParticipants={
          currentConversationForInvite 
            ? sharedConversations.find(conv => conv.id === currentConversationForInvite)?.participants || []
            : []
        }
        isCreator={true}
      />

      {/* User Discovery Dialog */}
      <UserDiscoveryDialog
        open={showUserDiscoveryDialog}
        onClose={() => {
          setShowUserDiscoveryDialog(false);
          setCurrentConversationForInvite(null);
        }}
        onInviteUsers={handleInvitePromethiosUsers}
        conversationName={
          currentConversationForInvite 
            ? sharedConversations.find(conv => conv.id === currentConversationForInvite)?.name || 'AI Conversation'
            : 'AI Conversation'
        }
        currentParticipantIds={
          currentConversationForInvite 
            ? sharedConversations.find(conv => conv.id === currentConversationForInvite)?.participants.map(p => p.id) || []
            : []
        }
      />

      {/* In-App Notification Popup */}
      <InAppNotificationPopup
        notifications={activeNotifications}
        onAcceptInvitation={handleAcceptInvitation}
        onDeclineInvitation={handleDeclineInvitation}
        onDismissNotification={handleDismissNotification}
        position="top-right"
      />

      {/* Agent Permission Request Popup */}
      <AgentPermissionRequestPopup
        notifications={permissionNotifications}
        onApproveRequest={handleApproveAgentRequest}
        onDenyRequest={handleDenyAgentRequest}
        onDismissNotification={handleDismissPermissionNotification}
        position="top-right"
      />
    </Box>
  );
};

export default ChatbotProfilesPageEnhanced;

