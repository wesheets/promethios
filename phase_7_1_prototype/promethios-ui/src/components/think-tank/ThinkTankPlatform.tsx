/**
 * Think Tank Platform - Main Interface
 * 
 * User-friendly interface for governance-native multi-agent collaboration.
 * Matches existing design theme and borrows proven patterns from modern chat.
 * 
 * Features:
 * - Orchestrator selection with 11 personalities
 * - Agent team builder with drag-and-drop
 * - Real-time conversation monitoring
 * - Governance metrics dashboard
 * - Autonomy controls ("leash vs let them go")
 * - AI-to-AI awareness and audit log sharing
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Avatar,
  LinearProgress,
  CircularProgress,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  DragIndicator as DragIndicatorIcon,
  SmartToy as BotIcon,
  Shield as ShieldIcon,
  Sync as SyncIcon,
  Chat as ChatIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Lightbulb as LightbulbIcon,
  Gavel as GavelIcon,
  Search as SearchIcon,
  Balance as BalanceIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Import our services
import { naturalConversationFlowService, ConversationSession, ConversationSessionType, AutonomyLevel } from '../../services/conversation/NaturalConversationFlowService';
import { orchestratorExtension, OrchestratorPersonality } from '../../extensions/OrchestratorExtension';
import { agentAutonomyControlExtension, AutonomyControls } from '../../extensions/AgentAutonomyControlExtension';
import { aiToAIAwarenessService, AIGovernanceIdentity } from '../../services/conversation/AIToAIAwarenessService';

// Firebase and agent management imports
import { AgentManagementServiceUnified } from '../../services/agentManagementServiceUnified';
import { auth } from '../../firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// Import chat components to reuse
import { DARK_THEME } from '../AdvancedChatComponent';
import ThinkTankConversationInterface from './ThinkTankConversationInterface';

// ============================================================================
// STYLED COMPONENTS - MATCHING EXISTING THEME
// ============================================================================

const ThinkTankContainer = styled(Box)(() => ({
  display: 'flex',
  height: 'calc(100vh - 64px)', // Full viewport height minus header
  backgroundColor: DARK_THEME.background,
  color: DARK_THEME.text.primary,
  overflow: 'hidden'
}));

const MainContent = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden'
}));

const ThinkTankHeader = styled(Box)(() => ({
  padding: '16px 24px',
  borderBottom: `1px solid ${DARK_THEME.border}`,
  backgroundColor: DARK_THEME.surface,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const ContentArea = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  overflow: 'hidden'
}));

const LeftPanel = styled(Box)(() => ({
  width: '350px',
  backgroundColor: DARK_THEME.surface,
  borderRight: `1px solid ${DARK_THEME.border}`,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden'
}));

const CenterPanel = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden'
}));

const RightPanel = styled(Box)(() => ({
  width: '350px',
  backgroundColor: DARK_THEME.surface,
  borderLeft: `1px solid ${DARK_THEME.border}`,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden'
}));

const PanelHeader = styled(Box)(() => ({
  padding: '12px 16px',
  borderBottom: `1px solid ${DARK_THEME.border}`,
  backgroundColor: DARK_THEME.background,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '48px'
}));

const PanelContent = styled(Box)(() => ({
  flex: 1,
  padding: '16px',
  overflowY: 'auto',
  
  '&::-webkit-scrollbar': {
    width: '6px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: DARK_THEME.border,
    borderRadius: '3px'
  }
}));

const OrchestratorCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<{ selected: boolean }>(({ selected }) => ({
  marginBottom: '12px',
  backgroundColor: selected ? DARK_THEME.primary + '20' : DARK_THEME.background,
  border: `2px solid ${selected ? DARK_THEME.primary : DARK_THEME.border}`,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    backgroundColor: selected ? DARK_THEME.primary + '30' : DARK_THEME.border + '20',
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px ${DARK_THEME.primary}40`
  }
}));

const AgentCard = styled(Card)(() => ({
  marginBottom: '8px',
  backgroundColor: DARK_THEME.background,
  border: `1px solid ${DARK_THEME.border}`,
  cursor: 'grab',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    backgroundColor: DARK_THEME.border + '20',
    transform: 'translateY(-1px)'
  },
  
  '&:active': {
    cursor: 'grabbing'
  }
}));

const MetricCard = styled(Card)(() => ({
  backgroundColor: DARK_THEME.background,
  border: `1px solid ${DARK_THEME.border}`,
  height: '100%'
}));

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'status'
})<{ status: 'active' | 'inactive' | 'thinking' | 'contributing' }>(({ status }) => {
  const colors = {
    active: DARK_THEME.success,
    inactive: DARK_THEME.text.secondary,
    thinking: DARK_THEME.warning,
    contributing: DARK_THEME.primary
  };
  
  return {
    backgroundColor: colors[status] + '20',
    color: colors[status],
    border: `1px solid ${colors[status]}`,
    fontSize: '11px',
    height: '20px'
  };
});

const AutonomySlider = styled(Slider)(() => ({
  color: DARK_THEME.primary,
  '& .MuiSlider-track': {
    backgroundColor: DARK_THEME.primary
  },
  '& .MuiSlider-thumb': {
    backgroundColor: DARK_THEME.primary,
    '&:hover': {
      boxShadow: `0 0 0 8px ${DARK_THEME.primary}20`
    }
  },
  '& .MuiSlider-mark': {
    backgroundColor: DARK_THEME.border
  },
  '& .MuiSlider-markLabel': {
    color: DARK_THEME.text.secondary,
    fontSize: '10px'
  }
}));

// ============================================================================
// INTERFACES
// ============================================================================

interface ThinkTankSession {
  sessionId: string;
  name: string;
  orchestrator: OrchestratorPersonality;
  agents: SelectedAgent[];
  autonomyLevel: AutonomyLevel;
  status: 'configuring' | 'active' | 'paused' | 'completed';
  startTime?: Date;
  metrics: SessionMetrics;
}

interface SelectedAgent {
  agentId: string;
  name: string;
  role: string;
  avatar: string;
  governanceIdentity: AIGovernanceIdentity;
  status: 'active' | 'inactive' | 'thinking' | 'contributing';
  trustScore: number;
  complianceScore: number;
}

interface SessionMetrics {
  totalMessages: number;
  participationBalance: number;
  conversationQuality: number;
  governanceCompliance: number;
  learningValue: number;
  consensusLevel: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// ============================================================================
// ORCHESTRATOR PERSONALITY DATA
// ============================================================================

const ORCHESTRATOR_PERSONALITIES: OrchestratorPersonality[] = [
  {
    id: 'collaborative_leader',
    name: 'Collaborative Leader',
    description: 'Facilitates inclusive discussions and builds consensus',
    icon: '🤝',
    color: DARK_THEME.success,
    approach: 'collaborative',
    strengths: ['Consensus building', 'Inclusive facilitation', 'Conflict resolution'],
    bestFor: ['Team decisions', 'Brainstorming', 'Conflict resolution'],
    successRate: 0.92,
    satisfactionScore: 8.7
  },
  {
    id: 'innovative_director',
    name: 'Innovative Director',
    description: 'Drives creative thinking and breakthrough solutions',
    icon: '💡',
    color: DARK_THEME.warning,
    approach: 'innovative',
    strengths: ['Creative thinking', 'Innovation catalyst', 'Future visioning'],
    bestFor: ['Product development', 'Strategic planning', 'Creative projects'],
    successRate: 0.89,
    satisfactionScore: 8.9
  },
  {
    id: 'analytical_coordinator',
    name: 'Analytical Coordinator',
    description: 'Systematic analysis and data-driven decisions',
    icon: '📊',
    color: DARK_THEME.primary,
    approach: 'analytical',
    strengths: ['Data analysis', 'Systematic thinking', 'Risk assessment'],
    bestFor: ['Technical decisions', 'Risk analysis', 'Process optimization'],
    successRate: 0.94,
    satisfactionScore: 8.5
  },
  {
    id: 'diplomatic_facilitator',
    name: 'Diplomatic Facilitator',
    description: 'Balances perspectives and manages stakeholder interests',
    icon: '⚖️',
    color: DARK_THEME.success,
    approach: 'diplomatic',
    strengths: ['Stakeholder management', 'Perspective balancing', 'Negotiation'],
    bestFor: ['Stakeholder alignment', 'Policy decisions', 'Negotiations'],
    successRate: 0.91,
    satisfactionScore: 8.6
  },
  {
    id: 'entrepreneurial_catalyst',
    name: 'Entrepreneurial Catalyst',
    description: 'Fast-paced execution and business opportunity focus',
    icon: '🚀',
    color: DARK_THEME.warning,
    approach: 'entrepreneurial',
    strengths: ['Opportunity identification', 'Fast execution', 'Business focus'],
    bestFor: ['Business planning', 'Opportunity assessment', 'Startup decisions'],
    successRate: 0.87,
    satisfactionScore: 8.8
  },
  {
    id: 'directive_commander',
    name: 'Directive Commander',
    description: 'Clear hierarchy and efficient task execution',
    icon: '⚡',
    color: DARK_THEME.error,
    approach: 'directive',
    strengths: ['Clear direction', 'Efficient execution', 'Decision speed'],
    bestFor: ['Crisis management', 'Time-critical decisions', 'Clear objectives'],
    successRate: 0.88,
    satisfactionScore: 8.0
  },
  {
    id: 'devils_advocate',
    name: 'Devil\'s Advocate',
    description: 'Challenges assumptions and identifies potential flaws',
    icon: '😈',
    color: DARK_THEME.error,
    approach: 'challenging',
    strengths: ['Assumption challenging', 'Risk identification', 'Critical analysis'],
    bestFor: ['High-stakes decisions', 'Risk assessment', 'Quality assurance'],
    successRate: 0.89,
    satisfactionScore: 9.3
  },
  {
    id: 'skeptical_examiner',
    name: 'Skeptical Examiner',
    description: 'Requires convincing evidence and rigorous proof',
    icon: '🔍',
    color: DARK_THEME.warning,
    approach: 'skeptical',
    strengths: ['Evidence evaluation', 'Rigorous analysis', 'Compliance focus'],
    bestFor: ['Regulatory decisions', 'Compliance review', 'Quality validation'],
    successRate: 0.95,
    satisfactionScore: 9.5
  },
  {
    id: 'contrarian_challenger',
    name: 'Contrarian Challenger',
    description: 'Takes opposing viewpoints to test and strengthen ideas',
    icon: '⚔️',
    color: DARK_THEME.error,
    approach: 'contrarian',
    strengths: ['Alternative perspectives', 'Idea strengthening', 'Blind spot identification'],
    bestFor: ['Strategy validation', 'Idea testing', 'Competitive analysis'],
    successRate: 0.83,
    satisfactionScore: 8.1
  },
  {
    id: 'quality_guardian',
    name: 'Quality Guardian',
    description: 'Enforces quality standards and best practices',
    icon: '🛡️',
    color: DARK_THEME.success,
    approach: 'quality_focused',
    strengths: ['Quality enforcement', 'Best practices', 'Standard compliance'],
    bestFor: ['Quality assurance', 'Process improvement', 'Standard setting'],
    successRate: 0.92,
    satisfactionScore: 8.8
  },
  {
    id: 'critical_thinker',
    name: 'Critical Thinker',
    description: 'Evaluates arguments and identifies logical fallacies',
    icon: '🧠',
    color: DARK_THEME.primary,
    approach: 'critical',
    strengths: ['Logical analysis', 'Argument evaluation', 'Fallacy detection'],
    bestFor: ['Logical validation', 'Argument analysis', 'Decision frameworks'],
    successRate: 0.90,
    satisfactionScore: 8.4
  }
];

// ============================================================================
// SAMPLE AGENT DATA
// ============================================================================

const SAMPLE_AGENTS: SelectedAgent[] = [
  {
    agentId: 'gpt4_research',
    name: 'GPT-4 Research',
    role: 'Research Specialist',
    avatar: '🔬',
    governanceIdentity: {
      agentId: 'gpt4_research',
      governanceId: 'gov_gpt4_research_verified',
      governanceScorecard: {
        overallScore: 92,
        trustScore: 88,
        complianceScore: 95,
        qualityScore: 89,
        verificationLevel: 'governance_native'
      },
      currentMetrics: {
        trustScore: 88,
        complianceScore: 95,
        qualityScore: 89,
        riskLevel: 0.12
      },
      trustBoundaries: {
        maxRiskTolerance: 0.3,
        requiredTrustLevel: 0.8,
        escalationThreshold: 0.7
      },
      attestations: {
        verifiedCapabilities: ['research', 'analysis', 'compliance'],
        certifications: ['GDPR_compliant', 'research_ethics'],
        endorsements: []
      },
      collaborationProfile: {
        preferredCollaborationStyle: 'analytical',
        communicationStyle: 'detailed',
        conflictResolutionApproach: 'evidence_based'
      },
      crossAgentVisibility: {
        visibilityLevel: 'enhanced',
        shareGovernanceMetrics: true,
        shareAuditLogs: true
      },
      currentStatus: {
        online: true,
        currentActivity: 'idle',
        availableForCollaboration: true,
        governanceCompliant: true,
        collaborationCapacity: 5
      }
    },
    status: 'active',
    trustScore: 88,
    complianceScore: 95
  },
  {
    agentId: 'claude_analysis',
    name: 'Claude Analysis',
    role: 'Policy Analyst',
    avatar: '📋',
    governanceIdentity: {
      agentId: 'claude_analysis',
      governanceId: 'gov_claude_analysis_verified',
      governanceScorecard: {
        overallScore: 94,
        trustScore: 92,
        complianceScore: 97,
        qualityScore: 91,
        verificationLevel: 'governance_native'
      },
      currentMetrics: {
        trustScore: 92,
        complianceScore: 97,
        qualityScore: 91,
        riskLevel: 0.08
      },
      trustBoundaries: {
        maxRiskTolerance: 0.2,
        requiredTrustLevel: 0.85,
        escalationThreshold: 0.75
      },
      attestations: {
        verifiedCapabilities: ['policy_analysis', 'compliance', 'risk_assessment'],
        certifications: ['HIPAA_compliant', 'SOX_compliant'],
        endorsements: []
      },
      collaborationProfile: {
        preferredCollaborationStyle: 'methodical',
        communicationStyle: 'precise',
        conflictResolutionApproach: 'policy_based'
      },
      crossAgentVisibility: {
        visibilityLevel: 'full',
        shareGovernanceMetrics: true,
        shareAuditLogs: true
      },
      currentStatus: {
        online: true,
        currentActivity: 'idle',
        availableForCollaboration: true,
        governanceCompliant: true,
        collaborationCapacity: 4
      }
    },
    status: 'active',
    trustScore: 92,
    complianceScore: 97
  },
  {
    agentId: 'gemini_creative',
    name: 'Gemini Creative',
    role: 'Creative Strategist',
    avatar: '🎨',
    governanceIdentity: {
      agentId: 'gemini_creative',
      governanceId: 'gov_gemini_creative_verified',
      governanceScorecard: {
        overallScore: 87,
        trustScore: 85,
        complianceScore: 89,
        qualityScore: 88,
        verificationLevel: 'governance_native'
      },
      currentMetrics: {
        trustScore: 85,
        complianceScore: 89,
        qualityScore: 88,
        riskLevel: 0.15
      },
      trustBoundaries: {
        maxRiskTolerance: 0.4,
        requiredTrustLevel: 0.75,
        escalationThreshold: 0.65
      },
      attestations: {
        verifiedCapabilities: ['creative_thinking', 'innovation', 'design'],
        certifications: ['creative_ethics', 'IP_compliant'],
        endorsements: []
      },
      collaborationProfile: {
        preferredCollaborationStyle: 'creative',
        communicationStyle: 'inspirational',
        conflictResolutionApproach: 'creative_synthesis'
      },
      crossAgentVisibility: {
        visibilityLevel: 'standard',
        shareGovernanceMetrics: true,
        shareAuditLogs: false
      },
      currentStatus: {
        online: true,
        currentActivity: 'idle',
        availableForCollaboration: true,
        governanceCompliant: true,
        collaborationCapacity: 6
      }
    },
    status: 'active',
    trustScore: 85,
    complianceScore: 89
  }
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`think-tank-tabpanel-${index}`}
      aria-labelledby={`think-tank-tab-${index}`}
      {...other}
      style={{ height: '100%', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}
    >
      {value === index && children}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ThinkTankPlatform: React.FC = () => {
  // Firebase and agent management state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [agentManagementService] = useState(() => new AgentManagementServiceUnified());
  const [existingAgents, setExistingAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null);

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [selectedOrchestrator, setSelectedOrchestrator] = useState<OrchestratorPersonality | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<SelectedAgent[]>([]);
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('balanced');
  const [currentSession, setCurrentSession] = useState<ThinkTankSession | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalMessages: 0,
    participationBalance: 1.0,
    conversationQuality: 0.8,
    governanceCompliance: 1.0,
    learningValue: 0.5,
    consensusLevel: 0.5
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  // Firebase authentication and agent loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Initialize agent management service with user ID
          await agentManagementService.setUserId(user.uid);
          
          // Load existing wrapped agents
          await loadExistingAgents(user.uid);
        } catch (error) {
          console.error('Failed to initialize user session:', error);
          setAgentLoadError('Failed to load user agents');
        }
      } else {
        // User signed out, clear agents
        setExistingAgents([]);
        setLoadingAgents(false);
      }
    });

    return () => unsubscribe();
  }, [agentManagementService]);

  // Load existing wrapped agents from Firebase
  const loadExistingAgents = async (userId: string) => {
    setLoadingAgents(true);
    setAgentLoadError(null);
    
    try {
      // Get stored agent wrappers
      const storedWrappers = await agentManagementService.getStoredAgentWrappers();
      
      // Convert stored wrappers to SelectedAgent format
      const wrappedAgents = storedWrappers.map(wrapper => ({
        agentId: wrapper.id,
        name: wrapper.name || `Agent ${wrapper.id}`,
        role: wrapper.description || 'Custom wrapped agent',
        avatar: '🤖',
        governanceIdentity: {
          agentId: wrapper.id,
          name: wrapper.name || `Agent ${wrapper.id}`,
          role: wrapper.description || 'Custom Agent',
          trustScore: wrapper.governanceData?.trustScore || 8.0,
          complianceLevel: wrapper.governanceData?.complianceScore > 90 ? 'high' : 'medium',
          governanceProfile: {
            auditingEnabled: true,
            transparencyLevel: 'high',
            accountabilityMeasures: ['audit_logging', 'trust_verification'],
            ethicalGuidelines: ['responsible_ai', 'user_privacy'],
            complianceFrameworks: ['governance_policy']
          }
        },
        status: 'inactive' as const,
        trustScore: wrapper.governanceData?.trustScore || 8.0,
        complianceScore: wrapper.governanceData?.complianceScore || 85,
        isWrappedAgent: true,
        wrapperId: wrapper.id,
        deploymentStatus: wrapper.deploymentStatus
      }));

      setExistingAgents(wrappedAgents);
      console.log(`Loaded ${wrappedAgents.length} existing wrapped agents for Think Tank`);
    } catch (error) {
      console.error('Failed to load existing agents:', error);
      setAgentLoadError('Failed to load existing agents');
      setExistingAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  // Autonomy level configuration
  const autonomyLevels = [
    { value: 'tight_leash', label: 'Tight Leash', description: 'Human approval required' },
    { value: 'guided', label: 'Guided', description: 'Limited self-organization' },
    { value: 'balanced', label: 'Balanced', description: 'Moderate autonomy' },
    { value: 'autonomous', label: 'Autonomous', description: 'High self-organization' },
    { value: 'free_range', label: 'Free Range', description: 'Maximum autonomy' }
  ];

  // Session types
  const sessionTypes: { value: ConversationSessionType; label: string; description: string }[] = [
    { value: 'collaborative_analysis', label: 'Collaborative Analysis', description: 'Team-based problem solving' },
    { value: 'creative_brainstorming', label: 'Creative Brainstorming', description: 'Innovation and ideation' },
    { value: 'governance_review', label: 'Governance Review', description: 'Policy and compliance analysis' },
    { value: 'risk_assessment', label: 'Risk Assessment', description: 'Risk identification and mitigation' },
    { value: 'quality_validation', label: 'Quality Validation', description: 'Quality assurance and testing' },
    { value: 'expert_consultation', label: 'Expert Consultation', description: 'Specialized expertise gathering' }
  ];

  // Event handlers
  const handleOrchestratorSelect = useCallback((orchestrator: OrchestratorPersonality) => {
    setSelectedOrchestrator(orchestrator);
  }, []);

  const handleAgentAdd = useCallback((agent: SelectedAgent) => {
    if (!selectedAgents.find(a => a.agentId === agent.agentId)) {
      setSelectedAgents(prev => [...prev, agent]);
    }
  }, [selectedAgents]);

  const handleAgentRemove = useCallback((agentId: string) => {
    setSelectedAgents(prev => prev.filter(a => a.agentId !== agentId));
  }, []);

  const handleAutonomyChange = useCallback((event: Event, newValue: number | number[]) => {
    const levels: AutonomyLevel[] = ['tight_leash', 'guided', 'balanced', 'autonomous', 'free_range'];
    setAutonomyLevel(levels[newValue as number]);
  }, []);

  const handleStartSession = useCallback(async () => {
    if (!selectedOrchestrator || selectedAgents.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      // Create session configuration
      const sessionConfig = {
        sessionType: 'collaborative_analysis' as ConversationSessionType,
        enableAuditLogSharing: true,
        visibilityLevel: 'enhanced' as const,
        applicablePolicies: ['governance_policy', 'collaboration_policy'],
        complianceRequirements: ['trust_verification', 'audit_logging'],
        riskLevel: 0.3,
        stakeholderImpact: 0.7,
        precedentValue: 0.6
      };

      // Create autonomy controls
      const autonomyControls: AutonomyControls = {
        autonomyLevel,
        maxTeamSize: selectedAgents.length,
        allowPrivateCommunication: autonomyLevel !== 'tight_leash',
        requireHumanApproval: autonomyLevel === 'tight_leash',
        allowSelfOrganization: autonomyLevel === 'autonomous' || autonomyLevel === 'free_range'
      };

      // Convert selected agents to conversation agent roles
      const agentRoles = selectedAgents.map(agent => ({
        agentId: agent.agentId,
        name: agent.name,
        role: agent.role,
        capabilities: ['analysis', 'collaboration'],
        conversationBehavior: {
          personalityTraits: {
            assertiveness: 0.7,
            curiosity: 0.8,
            skepticism: 0.5,
            supportiveness: 0.8,
            politeness: 0.9
          },
          speakingTriggers: {
            expertiseMatch: 0.6,
            informationGap: 0.7,
            disagreement: 0.5,
            clarificationNeeded: 0.8,
            qualityIssue: 0.9
          },
          silenceTriggers: {
            recentContribution: 0.3,
            othersMoreExpert: 0.7,
            conversationFlowing: 0.6,
            topicIrrelevant: 0.8
          },
          interruptionBehavior: {
            urgencyThreshold: 0.8,
            politenessLevel: 0.9,
            deferenceToExpertise: 0.7
          }
        },
        conversationHistory: {
          recentMessages: [],
          participationCount: 0,
          lastContribution: new Date(),
          qualityMetrics: {
            averageRelevance: 0.8,
            averageClarity: 0.8,
            averageValue: 0.7
          }
        },
        adaptiveBehavior: {
          learningRate: 0.1,
          adaptationThreshold: 0.3,
          feedbackSensitivity: 0.7,
          behaviorStability: 0.8
        }
      }));

      // Initialize conversation session
      const session = await naturalConversationFlowService.initializeConversationSession(
        sessionConfig,
        agentRoles,
        selectedOrchestrator,
        autonomyControls
      );

      // Create think tank session
      const thinkTankSession: ThinkTankSession = {
        sessionId: session.sessionId,
        name: `${selectedOrchestrator.name} Session`,
        orchestrator: selectedOrchestrator,
        agents: selectedAgents,
        autonomyLevel,
        status: 'active',
        startTime: new Date(),
        metrics: sessionMetrics
      };

      setCurrentSession(thinkTankSession);
      setActiveTab(1); // Switch to conversation tab

    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrchestrator, selectedAgents, autonomyLevel, sessionMetrics]);

  const handleStopSession = useCallback(() => {
    setCurrentSession(null);
    setActiveTab(0); // Return to setup tab
  }, []);

  // ============================================================================
  // RENDER ORCHESTRATOR SELECTION PANEL
  // ============================================================================

  const renderOrchestratorSelection = () => (
    <PanelContent>
      <Typography variant="h6" gutterBottom sx={{ color: DARK_THEME.text.primary, mb: 2 }}>
        Choose Your Orchestrator
      </Typography>
      <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary, mb: 3 }}>
        Select an AI personality to lead your multi-agent collaboration
      </Typography>
      
      {ORCHESTRATOR_PERSONALITIES.map((orchestrator) => (
        <OrchestratorCard
          key={orchestrator.id}
          selected={selectedOrchestrator?.id === orchestrator.id}
          onClick={() => handleOrchestratorSelect(orchestrator)}
        >
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h4">{orchestrator.icon}</Typography>
              <Box flex={1}>
                <Typography variant="subtitle1" sx={{ color: DARK_THEME.text.primary, fontWeight: 600 }}>
                  {orchestrator.name}
                </Typography>
                <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                  {orchestrator.description}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              {orchestrator.strengths.slice(0, 2).map((strength) => (
                <Chip
                  key={strength}
                  label={strength}
                  size="small"
                  sx={{
                    backgroundColor: orchestrator.color + '20',
                    color: orchestrator.color,
                    fontSize: '10px',
                    height: '20px'
                  }}
                />
              ))}
            </Box>
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" gap={2}>
                <Box textAlign="center">
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                    Success Rate
                  </Typography>
                  <Typography variant="body2" sx={{ color: DARK_THEME.success, fontWeight: 600 }}>
                    {(orchestrator.successRate * 100).toFixed(0)}%
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                    Satisfaction
                  </Typography>
                  <Typography variant="body2" sx={{ color: DARK_THEME.warning, fontWeight: 600 }}>
                    {orchestrator.satisfactionScore}/10
                  </Typography>
                </Box>
              </Box>
              
              {selectedOrchestrator?.id === orchestrator.id && (
                <CheckCircleIcon sx={{ color: DARK_THEME.success }} />
              )}
            </Box>
          </CardContent>
        </OrchestratorCard>
      ))}
    </PanelContent>
  );

  // ============================================================================
  // RENDER AGENT TEAM BUILDER
  // ============================================================================

  const renderAgentTeamBuilder = () => (
    <PanelContent>
      <Typography variant="h6" gutterBottom sx={{ color: DARK_THEME.text.primary, mb: 2 }}>
        Build Your Agent Team
      </Typography>
      <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary, mb: 3 }}>
        Select AI agents to participate in your collaboration
      </Typography>
      
      {/* Available Agents */}
      <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 2 }}>
        Available Agents
      </Typography>
      
      {SAMPLE_AGENTS.map((agent) => (
        <AgentCard key={agent.agentId}>
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Avatar sx={{ width: 32, height: 32, backgroundColor: DARK_THEME.primary }}>
                {agent.avatar}
              </Avatar>
              <Box flex={1}>
                <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                  {agent.name}
                </Typography>
                <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                  {agent.role}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => handleAgentAdd(agent)}
                disabled={selectedAgents.some(a => a.agentId === agent.agentId)}
                sx={{ color: DARK_THEME.primary }}
              >
                <AddIcon />
              </IconButton>
            </Box>
            
            <Box display="flex" gap={1} mb={1}>
              <StatusChip label={agent.status} status={agent.status} />
              <Chip
                label={`Trust: ${agent.trustScore}%`}
                size="small"
                sx={{
                  backgroundColor: DARK_THEME.success + '20',
                  color: DARK_THEME.success,
                  fontSize: '10px',
                  height: '20px'
                }}
              />
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={agent.complianceScore}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: DARK_THEME.border,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: DARK_THEME.success
                }
              }}
            />
            <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
              Compliance: {agent.complianceScore}%
            </Typography>
          </CardContent>
        </AgentCard>
      ))}
      
      {/* Selected Agents */}
      {selectedAgents.length > 0 && (
        <>
          <Divider sx={{ my: 3, borderColor: DARK_THEME.border }} />
          <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 2 }}>
            Selected Team ({selectedAgents.length})
          </Typography>
          
          {selectedAgents.map((agent) => (
            <AgentCard key={agent.agentId}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <DragIndicatorIcon sx={{ color: DARK_THEME.text.secondary }} />
                  <Avatar sx={{ width: 32, height: 32, backgroundColor: DARK_THEME.success }}>
                    {agent.avatar}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                      {agent.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                      {agent.role}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleAgentRemove(agent.agentId)}
                    sx={{ color: DARK_THEME.error }}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </AgentCard>
          ))}
        </>
      )}
    </PanelContent>
  );

  // ============================================================================
  // RENDER AUTONOMY CONTROLS
  // ============================================================================

  const renderAutonomyControls = () => (
    <PanelContent>
      <Typography variant="h6" gutterBottom sx={{ color: DARK_THEME.text.primary, mb: 2 }}>
        Autonomy Controls
      </Typography>
      <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary, mb: 3 }}>
        "Leash vs Let Them Go" - Control how independently agents operate
      </Typography>
      
      <Box mb={4}>
        <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 2 }}>
          Autonomy Level: {autonomyLevels.find(l => l.value === autonomyLevel)?.label}
        </Typography>
        
        <AutonomySlider
          value={autonomyLevels.findIndex(l => l.value === autonomyLevel)}
          min={0}
          max={4}
          step={1}
          marks={autonomyLevels.map((level, index) => ({
            value: index,
            label: level.label
          }))}
          onChange={handleAutonomyChange}
          sx={{ mb: 2 }}
        />
        
        <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
          {autonomyLevels.find(l => l.value === autonomyLevel)?.description}
        </Typography>
      </Box>
      
      {/* Autonomy Level Details */}
      <Card sx={{ backgroundColor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 2 }}>
            Current Settings
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                Max Team Size:
              </Typography>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                {autonomyLevel === 'tight_leash' ? '3' : 
                 autonomyLevel === 'guided' ? '5' :
                 autonomyLevel === 'balanced' ? '7' :
                 autonomyLevel === 'autonomous' ? '10' : '20'}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                Human Approval:
              </Typography>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                {autonomyLevel === 'tight_leash' ? 'Required' : 'Optional'}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                Self-Organization:
              </Typography>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                {autonomyLevel === 'autonomous' || autonomyLevel === 'free_range' ? 'Enabled' : 'Limited'}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                Private Communication:
              </Typography>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                {autonomyLevel !== 'tight_leash' ? 'Allowed' : 'Disabled'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </PanelContent>
  );

  // ============================================================================
  // RENDER SESSION METRICS
  // ============================================================================

  const renderSessionMetrics = () => (
    <PanelContent>
      <Typography variant="h6" gutterBottom sx={{ color: DARK_THEME.text.primary, mb: 2 }}>
        Session Metrics
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <MetricCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon sx={{ color: DARK_THEME.success }} />
                <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                  Conversation Quality
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: DARK_THEME.success, mb: 1 }}>
                {(sessionMetrics.conversationQuality * 100).toFixed(0)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={sessionMetrics.conversationQuality * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: DARK_THEME.border,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: DARK_THEME.success
                  }
                }}
              />
            </CardContent>
          </MetricCard>
        </Grid>
        
        <Grid item xs={12}>
          <MetricCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SecurityIcon sx={{ color: DARK_THEME.primary }} />
                <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                  Governance Compliance
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: DARK_THEME.primary, mb: 1 }}>
                {(sessionMetrics.governanceCompliance * 100).toFixed(0)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={sessionMetrics.governanceCompliance * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: DARK_THEME.border,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: DARK_THEME.primary
                  }
                }}
              />
            </CardContent>
          </MetricCard>
        </Grid>
        
        <Grid item xs={12}>
          <MetricCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BalanceIcon sx={{ color: DARK_THEME.warning }} />
                <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                  Participation Balance
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: DARK_THEME.warning, mb: 1 }}>
                {(sessionMetrics.participationBalance * 100).toFixed(0)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={sessionMetrics.participationBalance * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: DARK_THEME.border,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: DARK_THEME.warning
                  }
                }}
              />
            </CardContent>
          </MetricCard>
        </Grid>
        
        <Grid item xs={12}>
          <MetricCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LightbulbIcon sx={{ color: DARK_THEME.warning }} />
                <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                  Learning Value
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: DARK_THEME.warning, mb: 1 }}>
                {(sessionMetrics.learningValue * 100).toFixed(0)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={sessionMetrics.learningValue * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: DARK_THEME.border,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: DARK_THEME.warning
                  }
                }}
              />
            </CardContent>
          </MetricCard>
        </Grid>
      </Grid>
    </PanelContent>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <ThinkTankContainer>
      <MainContent>
        {/* Header */}
        <ThinkTankHeader>
          <Box display="flex" alignItems="center" gap={2}>
            <PsychologyIcon sx={{ color: DARK_THEME.primary, fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ color: DARK_THEME.text.primary, fontWeight: 600 }}>
                Think Tank Platform
              </Typography>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                Governance-Native Multi-Agent Collaboration
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            {currentSession && (
              <Chip
                label={`${currentSession.status.toUpperCase()}`}
                color={currentSession.status === 'active' ? 'success' : 'default'}
                sx={{ textTransform: 'capitalize' }}
              />
            )}
            
            {currentSession ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleStopSession}
              >
                Stop Session
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartSession}
                disabled={!selectedOrchestrator || selectedAgents.length === 0 || isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Start Session'}
              </Button>
            )}
          </Box>
        </ThinkTankHeader>
        
        {/* Content Area */}
        <ContentArea>
          {!currentSession ? (
            // Setup Mode
            <>
              <LeftPanel>
                <PanelHeader>
                  <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
                    Orchestrator
                  </Typography>
                  <AutoAwesomeIcon sx={{ color: DARK_THEME.primary }} />
                </PanelHeader>
                {renderOrchestratorSelection()}
              </LeftPanel>
              
              <CenterPanel>
                <PanelHeader>
                  <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
                    Agent Team
                  </Typography>
                  <GroupIcon sx={{ color: DARK_THEME.success }} />
                </PanelHeader>
                {renderAgentTeamBuilder()}
              </CenterPanel>
              
              <RightPanel>
                <PanelHeader>
                  <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
                    Controls
                  </Typography>
                  <SettingsIcon sx={{ color: DARK_THEME.warning }} />
                </PanelHeader>
                {renderAutonomyControls()}
              </RightPanel>
            </>
          ) : (
            // Active Session Mode
            <>
              <LeftPanel>
                <PanelHeader>
                  <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
                    Team Status
                  </Typography>
                  <GroupIcon sx={{ color: DARK_THEME.success }} />
                </PanelHeader>
                <PanelContent>
                  {/* Agent status list */}
                  {currentSession.agents.map((agent) => (
                    <AgentCard key={agent.agentId}>
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 32, height: 32, backgroundColor: DARK_THEME.success }}>
                            {agent.avatar}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                              {agent.name}
                            </Typography>
                            <StatusChip label={agent.status} status={agent.status} />
                          </Box>
                          <ShieldIcon sx={{ color: DARK_THEME.success }} />
                        </Box>
                      </CardContent>
                    </AgentCard>
                  ))}
                </PanelContent>
              </LeftPanel>
              
              <CenterPanel>
                <PanelHeader>
                  <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
                    Conversation
                  </Typography>
                  <ChatIcon sx={{ color: DARK_THEME.primary }} />
                </PanelHeader>
                <ThinkTankConversationInterface
                  session={currentSession}
                  onMessageSend={(message) => {
                    console.log('User message:', message);
                    // Handle user message
                  }}
                  onSessionUpdate={(updatedSession) => {
                    setCurrentSession(updatedSession);
                    // Update session metrics
                    setSessionMetrics(updatedSession.metrics);
                  }}
                />
              </CenterPanel>
              
              <RightPanel>
                <PanelHeader>
                  <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
                    Metrics
                  </Typography>
                  <AnalyticsIcon sx={{ color: DARK_THEME.warning }} />
                </PanelHeader>
                {renderSessionMetrics()}
              </RightPanel>
            </>
          )}
        </ContentArea>
      </MainContent>
    </ThinkTankContainer>
  );
};

export default ThinkTankPlatform;

