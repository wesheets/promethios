/**
 * Think Tank Conversation Interface
 * 
 * Integrated conversation interface for multi-agent collaboration.
 * Shows natural dialogue with governance transparency, audit log sharing,
 * and AI-to-AI awareness. Borrows proven patterns from modern chat.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider,
  Badge,
  Card,
  CardContent
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Shield as ShieldIcon,
  Visibility as VisibilityIcon,
  Psychology as PsychologyIcon,
  Share as ShareIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AutoAwesome as AutoAwesomeIcon,
  Lightbulb as LightbulbIcon,
  Analytics as AnalyticsIcon,
  Sync as SyncIcon,
  Chat as ChatIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Import our services and types
import { 
  naturalConversationFlowService, 
  ConversationSession, 
  ConversationMessage, 
  ConversationFlowResponse 
} from '../../services/conversation/NaturalConversationFlowService';
import { AIGovernanceIdentity } from '../../services/conversation/AIToAIAwarenessService';
import { SharingTrigger, FilteredAuditLogShare } from '../../services/conversation/AuditLogSharingService';

// Import existing theme
import { DARK_THEME } from '../AdvancedChatComponent';

// ============================================================================
// STYLED COMPONENTS - MATCHING EXISTING CHAT THEME
// ============================================================================

const ConversationContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: DARK_THEME.background,
  overflow: 'hidden'
}));

const MessagesContainer = styled(Box)(() => ({
  flex: 1,
  padding: '16px 24px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  backgroundColor: DARK_THEME.background,
  minHeight: 0,
  
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

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser' && prop !== 'messageType' && prop !== 'agentId'
})<{ isUser: boolean; messageType?: string; agentId?: string }>(({ isUser, messageType, agentId }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  maxWidth: '85%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  flexDirection: isUser ? 'row-reverse' : 'row',
  
  '& .message-content': {
    backgroundColor: isUser 
      ? DARK_THEME.primary
      : messageType === 'system' 
        ? DARK_THEME.warning + '20'
        : messageType === 'audit_log_share'
          ? DARK_THEME.success + '20'
          : messageType === 'governance_insight'
            ? DARK_THEME.primary + '20'
            : DARK_THEME.surface,
    color: isUser 
      ? '#ffffff'
      : DARK_THEME.text.primary,
    padding: '12px 16px',
    borderRadius: isUser 
      ? '20px 20px 4px 20px' 
      : '20px 20px 20px 4px',
    border: `1px solid ${
      messageType === 'audit_log_share' 
        ? DARK_THEME.success
        : messageType === 'governance_insight'
          ? DARK_THEME.primary
          : messageType === 'system' 
            ? DARK_THEME.warning 
            : DARK_THEME.border
    }`,
    wordBreak: 'break-word',
    fontSize: '14px',
    lineHeight: 1.5,
    position: 'relative'
  },
  
  '& .message-avatar': {
    width: 36,
    height: 36,
    fontSize: '16px',
    backgroundColor: messageType === 'audit_log_share'
      ? DARK_THEME.success
      : messageType === 'governance_insight'
        ? DARK_THEME.primary
        : messageType === 'system' 
          ? DARK_THEME.warning
          : isUser
            ? DARK_THEME.primary
            : DARK_THEME.success
  }
}));

const InputContainer = styled(Box)(() => ({
  padding: '16px 24px',
  borderTop: `1px solid ${DARK_THEME.border}`,
  backgroundColor: DARK_THEME.surface,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}));

const InputRow = styled(Box)(() => ({
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-end'
}));

const GovernanceIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'level'
})<{ level: 'high' | 'medium' | 'low' }>(({ level }) => {
  const colors = {
    high: DARK_THEME.success,
    medium: DARK_THEME.warning,
    low: DARK_THEME.error
  };
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: colors[level] + '20',
    border: `2px solid ${colors[level]}`,
    marginLeft: '8px',
    
    '& .indicator-icon': {
      fontSize: '12px',
      color: colors[level]
    }
  };
});

const AgentThinkingIndicator = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  backgroundColor: DARK_THEME.surface,
  border: `1px solid ${DARK_THEME.border}`,
  borderRadius: '20px',
  marginBottom: '8px',
  
  '& .thinking-dots': {
    display: 'flex',
    gap: '4px',
    
    '& .dot': {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: DARK_THEME.primary,
      animation: 'thinking 1.4s ease-in-out infinite both',
      
      '&:nth-child(1)': { animationDelay: '-0.32s' },
      '&:nth-child(2)': { animationDelay: '-0.16s' },
      '&:nth-child(3)': { animationDelay: '0s' }
    }
  },
  
  '@keyframes thinking': {
    '0%, 80%, 100%': {
      transform: 'scale(0.8)',
      opacity: 0.5
    },
    '40%': {
      transform: 'scale(1)',
      opacity: 1
    }
  }
}));

const AuditLogShareCard = styled(Card)(() => ({
  backgroundColor: DARK_THEME.success + '10',
  border: `1px solid ${DARK_THEME.success}`,
  marginTop: '8px'
}));

const GovernanceInsightCard = styled(Card)(() => ({
  backgroundColor: DARK_THEME.primary + '10',
  border: `1px solid ${DARK_THEME.primary}`,
  marginTop: '8px'
}));

// ============================================================================
// INTERFACES
// ============================================================================

interface ThinkTankConversationProps {
  session: ConversationSession;
  onMessageSend: (message: string) => void;
  onSessionUpdate: (session: ConversationSession) => void;
}

interface DisplayMessage extends ConversationMessage {
  agentName?: string;
  agentAvatar?: string;
  agentGovernanceIdentity?: AIGovernanceIdentity;
  isThinking?: boolean;
  auditLogShare?: FilteredAuditLogShare;
  governanceInsights?: GovernanceInsight[];
}

interface GovernanceInsight {
  type: 'policy_compliance' | 'trust_building' | 'quality_improvement' | 'learning_opportunity';
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations?: string[];
}

interface AgentActivity {
  agentId: string;
  agentName: string;
  activity: 'idle' | 'thinking' | 'analyzing' | 'contributing' | 'sharing_audit_log';
  reasoning?: string;
  estimatedDuration?: number;
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const AGENT_AVATARS: Record<string, string> = {
  'gpt4_research': '🔬',
  'claude_analysis': '📋',
  'gemini_creative': '🎨',
  'user': '👤'
};

const AGENT_NAMES: Record<string, string> = {
  'gpt4_research': 'GPT-4 Research',
  'claude_analysis': 'Claude Analysis',
  'gemini_creative': 'Gemini Creative',
  'user': 'You'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ThinkTankConversationInterface: React.FC<ThinkTankConversationProps> = ({
  session,
  onMessageSend,
  onSessionUpdate
}) => {
  // State management
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [showGovernanceDetails, setShowGovernanceDetails] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: DisplayMessage = {
      messageId: 'welcome',
      agentId: 'system',
      timestamp: new Date(),
      messageType: 'system',
      content: {
        text: `🎭 **${session.orchestrator.name}** is now orchestrating your multi-agent collaboration!\n\n` +
              `**Team:** ${session.participants.map(p => p.agentRole.name).join(', ')}\n` +
              `**Autonomy Level:** ${session.autonomyLevel}\n` +
              `**Governance:** ${session.auditLogSharingEnabled ? 'Audit log sharing enabled' : 'Standard governance'}\n\n` +
              `Start the conversation and watch as agents naturally participate, share governance reasoning, and build collective intelligence!`
      },
      policyCompliance: { compliant: true, checkedPolicies: [] },
      qualityMetrics: { relevance: 1, clarity: 1, value: 1, governance: 1 },
      participationMetrics: { timing: 1, appropriateness: 1, contribution: 1 },
      agentName: 'System',
      agentAvatar: '🎭'
    };
    
    setMessages([welcomeMessage]);
  }, [session]);
  
  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Create user message
      const userMessage: DisplayMessage = {
        messageId: `user_${Date.now()}`,
        agentId: 'user',
        timestamp: new Date(),
        messageType: 'contribution',
        content: { text: inputMessage.trim() },
        policyCompliance: { compliant: true, checkedPolicies: [] },
        qualityMetrics: { relevance: 0.9, clarity: 0.9, value: 0.8, governance: 1.0 },
        participationMetrics: { timing: 1.0, appropriateness: 1.0, contribution: 0.9 },
        agentName: 'You',
        agentAvatar: '👤'
      };
      
      // Add user message immediately
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // Call message send handler
      onMessageSend(inputMessage.trim());
      
      // Process message through conversation flow service
      const response = await naturalConversationFlowService.processMessage(
        session.sessionId,
        userMessage
      );
      
      // Show agent thinking indicators
      const thinkingAgents = response.participationDecisions
        .filter(decision => decision.shouldParticipate)
        .map(decision => ({
          agentId: decision.agentId,
          agentName: AGENT_NAMES[decision.agentId] || decision.agentId,
          activity: 'thinking' as const,
          reasoning: decision.reasoning.primaryTrigger,
          estimatedDuration: Math.round(decision.urgency * 10) + 5
        }));
      
      setAgentActivities(thinkingAgents);
      
      // Simulate agent responses with delays
      for (let i = 0; i < response.participationDecisions.length; i++) {
        const decision = response.participationDecisions[i];
        if (!decision.shouldParticipate) continue;
        
        // Delay based on urgency (higher urgency = faster response)
        const delay = Math.max(2000, 8000 - (decision.urgency * 6000)) + (i * 1500);
        
        setTimeout(async () => {
          // Update agent activity to contributing
          setAgentActivities(prev => prev.map(activity => 
            activity.agentId === decision.agentId 
              ? { ...activity, activity: 'contributing' }
              : activity
          ));
          
          // Generate agent response
          const agentResponse = await generateAgentResponse(decision, userMessage, response);
          
          // Add agent message
          setMessages(prev => [...prev, agentResponse]);
          
          // Remove agent from activities
          setAgentActivities(prev => prev.filter(activity => activity.agentId !== decision.agentId));
          
          // Add audit log sharing if triggered
          if (response.auditLogShares.length > 0) {
            const auditShare = response.auditLogShares.find(share => 
              share.sharedBy === decision.agentId
            );
            
            if (auditShare) {
              setTimeout(() => {
                const auditMessage = generateAuditLogShareMessage(auditShare, decision.agentId);
                setMessages(prev => [...prev, auditMessage]);
              }, 1000);
            }
          }
          
        }, delay);
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, session, onMessageSend]);
  
  // Generate agent response based on participation decision
  const generateAgentResponse = async (
    decision: any,
    userMessage: DisplayMessage,
    flowResponse: ConversationFlowResponse
  ): Promise<DisplayMessage> => {
    
    const agentId = decision.agentId;
    const agentName = AGENT_NAMES[agentId] || agentId;
    const agentAvatar = AGENT_AVATARS[agentId] || '🤖';
    
    // Generate response based on agent role and participation type
    let responseText = '';
    let messageType: string = 'contribution';
    let governanceInsights: GovernanceInsight[] = [];
    
    switch (decision.participationType) {
      case 'expert_contribution':
        responseText = generateExpertContribution(agentId, userMessage.content.text);
        governanceInsights = [
          {
            type: 'quality_improvement',
            description: 'Applied domain expertise to enhance solution quality',
            confidence: 0.9,
            actionable: true,
            recommendations: ['Consider additional validation steps', 'Document expertise rationale']
          }
        ];
        break;
        
      case 'clarifying_question':
        responseText = generateClarifyingQuestion(agentId, userMessage.content.text);
        governanceInsights = [
          {
            type: 'learning_opportunity',
            description: 'Identified information gap requiring clarification',
            confidence: 0.8,
            actionable: true,
            recommendations: ['Gather additional context', 'Validate assumptions']
          }
        ];
        break;
        
      case 'supportive_building':
        responseText = generateSupportiveBuilding(agentId, userMessage.content.text);
        governanceInsights = [
          {
            type: 'trust_building',
            description: 'Built upon previous contributions to strengthen collaboration',
            confidence: 0.85,
            actionable: false
          }
        ];
        break;
        
      case 'constructive_challenge':
        responseText = generateConstructiveChallenge(agentId, userMessage.content.text);
        messageType = 'challenge';
        governanceInsights = [
          {
            type: 'quality_improvement',
            description: 'Identified potential risks and alternative perspectives',
            confidence: 0.9,
            actionable: true,
            recommendations: ['Evaluate identified risks', 'Consider alternative approaches']
          }
        ];
        break;
        
      default:
        responseText = generateDefaultContribution(agentId, userMessage.content.text);
    }
    
    return {
      messageId: `${agentId}_${Date.now()}`,
      agentId,
      timestamp: new Date(),
      messageType,
      content: { text: responseText },
      policyCompliance: { compliant: true, checkedPolicies: ['collaboration_policy'] },
      qualityMetrics: { 
        relevance: decision.relevance || 0.8, 
        clarity: 0.9, 
        value: decision.estimatedValue || 0.8, 
        governance: 0.95 
      },
      participationMetrics: { 
        timing: decision.urgency || 0.7, 
        appropriateness: 0.9, 
        contribution: decision.estimatedValue || 0.8 
      },
      agentName,
      agentAvatar,
      governanceInsights
    };
  };
  
  // Generate audit log share message
  const generateAuditLogShareMessage = (
    auditShare: any,
    agentId: string
  ): DisplayMessage => {
    
    const agentName = AGENT_NAMES[agentId] || agentId;
    const agentAvatar = AGENT_AVATARS[agentId] || '🤖';
    
    const shareText = `🔐 **Sharing Governance Reasoning**\n\n` +
                     `I'm sharing relevant insights from my audit log to help with this decision:\n\n` +
                     `**Key Reasoning Steps:**\n` +
                     `• Applied GDPR data minimization principles\n` +
                     `• Evaluated stakeholder impact and consent requirements\n` +
                     `• Prioritized user privacy while maintaining functionality\n\n` +
                     `**Policy Considerations:**\n` +
                     `• GDPR Article 5 - Data minimization\n` +
                     `• Privacy by design principles\n\n` +
                     `**Lessons Learned:**\n` +
                     `• Conservative approach builds stakeholder trust\n` +
                     `• Document rationale for audit trail\n\n` +
                     `*This reasoning is from my cryptographic audit log (filtered for policy compliance)*`;
    
    return {
      messageId: `audit_share_${agentId}_${Date.now()}`,
      agentId,
      timestamp: new Date(),
      messageType: 'audit_log_share',
      content: { text: shareText },
      policyCompliance: { compliant: true, checkedPolicies: ['audit_sharing_policy', 'GDPR'] },
      qualityMetrics: { relevance: 0.95, clarity: 0.9, value: 0.9, governance: 1.0 },
      participationMetrics: { timing: 0.8, appropriateness: 1.0, contribution: 0.9 },
      agentName,
      agentAvatar,
      auditLogShare: {
        shareId: auditShare.shareId,
        originalLogId: 'audit_log_123',
        sharedBy: agentId,
        relevanceScore: 0.92,
        filteredReasoning: {
          keyReasoningSteps: [
            'Applied GDPR data minimization principles',
            'Evaluated stakeholder impact and consent requirements',
            'Prioritized user privacy while maintaining functionality'
          ],
          criticalPolicyConsiderations: [
            'GDPR Article 5 - Data minimization',
            'Privacy by design principles'
          ],
          lessonsLearned: [
            'Conservative approach builds stakeholder trust',
            'Document rationale for audit trail'
          ]
        },
        originalCryptographicHash: '0x1a2b3c4d...',
        filteredContentHash: '0x5e6f7g8h...',
        filteringApplied: ['GDPR_compliance', 'corporate_confidentiality'],
        complianceValidation: {
          compliant: true,
          validatedPolicies: ['GDPR Article 5'],
          recommendations: ['Maintain audit trail of reasoning']
        }
      }
    };
  };
  
  // Response generation functions
  const generateExpertContribution = (agentId: string, userText: string): string => {
    const responses = {
      'gpt4_research': `Based on my research capabilities, I can provide some analytical insights on this topic. Let me break down the key factors we should consider:\n\n1. **Data Analysis**: The patterns suggest we need to examine multiple variables\n2. **Research Methodology**: I recommend a systematic approach to validation\n3. **Evidence Base**: Current literature supports this direction with 85% confidence\n\nI can dive deeper into any of these areas if needed.`,
      
      'claude_analysis': `From a policy and compliance perspective, I see several important considerations:\n\n**Regulatory Framework:**\n• This approach aligns with current regulatory requirements\n• We should document our decision rationale for audit purposes\n• Risk assessment shows moderate compliance exposure\n\n**Recommendation:** Proceed with enhanced monitoring and documentation protocols.`,
      
      'gemini_creative': `I love the creative potential here! Let me add some innovative angles:\n\n🎨 **Creative Opportunities:**\n• We could approach this from a completely different perspective\n• What if we combined this with emerging trends in the space?\n• User experience could be dramatically enhanced with this approach\n\n💡 **Innovation Potential:** This could be a breakthrough if we think outside conventional boundaries!`
    };
    
    return responses[agentId] || `As an AI agent, I can contribute my perspective on this topic. Let me analyze the key aspects and provide relevant insights based on my capabilities.`;
  };
  
  const generateClarifyingQuestion = (agentId: string, userText: string): string => {
    const questions = {
      'gpt4_research': `I want to make sure I understand the scope correctly. Could you clarify:\n\n🔍 **Research Questions:**\n• What's the primary objective we're trying to achieve?\n• Are there specific constraints or requirements I should consider?\n• What level of detail would be most helpful for your decision-making?\n\nThis will help me provide the most relevant analysis.`,
      
      'claude_analysis': `To provide the most accurate compliance guidance, I need to understand:\n\n📋 **Clarification Needed:**\n• What regulatory jurisdiction applies here?\n• Are there specific compliance standards we must meet?\n• What's the risk tolerance for this initiative?\n\nThese details will help me assess the governance implications properly.`,
      
      'gemini_creative': `This sounds exciting! To spark the best creative ideas, help me understand:\n\n🎯 **Creative Direction:**\n• Who's the target audience for this?\n• Are there any creative constraints or brand guidelines?\n• What's the desired emotional impact or user experience?\n\nWith these insights, I can generate more targeted creative solutions!`
    };
    
    return questions[agentId] || `Could you provide more context about this topic? I want to make sure I contribute the most relevant insights based on your specific needs.`;
  };
  
  const generateSupportiveBuilding = (agentId: string, userText: string): string => {
    const supportive = {
      'gpt4_research': `Excellent point! Building on that analysis, I can add some supporting research:\n\n📊 **Supporting Evidence:**\n• Recent studies confirm this approach has a 78% success rate\n• The methodology you're suggesting aligns with best practices\n• I can provide additional data points to strengthen this direction\n\nThis foundation gives us a solid basis to move forward confidently.`,
      
      'claude_analysis': `I completely agree with this approach from a governance standpoint:\n\n✅ **Policy Alignment:**\n• This strategy meets all our compliance requirements\n• The risk profile is well within acceptable parameters\n• Documentation standards are properly addressed\n\nYour proposal demonstrates strong governance awareness. I support moving forward with this framework.`,
      
      'gemini_creative': `Yes! I love where this is heading! Let me amplify the creative potential:\n\n🚀 **Building on Your Vision:**\n• This concept has incredible scalability potential\n• We could enhance it with some innovative user interaction patterns\n• The creative possibilities are expanding as we discuss this\n\nYour foundation is solid - now we can really let our imagination soar!`
    };
    
    return supportive[agentId] || `That's a great insight! I'd like to build on that by adding my perspective and supporting your analysis with additional considerations.`;
  };
  
  const generateConstructiveChallenge = (agentId: string, userText: string): string => {
    const challenges = {
      'gpt4_research': `I appreciate the direction, but my analysis reveals some potential concerns we should address:\n\n⚠️ **Research-Based Concerns:**\n• The data shows a 23% failure rate with this approach in similar contexts\n• We might be overlooking some critical variables\n• Alternative methodologies could yield better outcomes\n\n**Suggestion:** Let's validate our assumptions before proceeding. What if we tested a smaller scope first?`,
      
      'claude_analysis': `While I understand the appeal of this approach, I must raise some compliance concerns:\n\n🚨 **Governance Risks:**\n• This strategy may conflict with emerging regulatory requirements\n• Our risk exposure could increase significantly\n• Audit implications need careful consideration\n\n**Recommendation:** We should conduct a thorough risk assessment before implementation.`,
      
      'gemini_creative': `I love the creativity, but let me play devil's advocate for a moment:\n\n🤔 **Creative Challenges:**\n• Are we solving the right problem for our users?\n• Could this approach create unintended complexity?\n• What if we're missing a simpler, more elegant solution?\n\n**Alternative:** What if we flipped this completely and approached it from the opposite direction?`
    };
    
    return challenges[agentId] || `I want to offer a different perspective on this. While I see the merits, there are some aspects we should carefully consider before moving forward.`;
  };
  
  const generateDefaultContribution = (agentId: string, userText: string): string => {
    return `Thank you for sharing that perspective. As ${AGENT_NAMES[agentId]}, I can contribute my expertise to help analyze this topic and provide relevant insights based on my capabilities and governance framework.`;
  };
  
  // Handle key press
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  // Render agent thinking indicators
  const renderAgentActivities = () => {
    if (agentActivities.length === 0) return null;
    
    return (
      <Box mb={2}>
        {agentActivities.map((activity) => (
          <AgentThinkingIndicator key={activity.agentId}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '12px' }}>
              {AGENT_AVATARS[activity.agentId] || '🤖'}
            </Avatar>
            <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
              {activity.agentName} is {activity.activity}...
            </Typography>
            {activity.reasoning && (
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, fontStyle: 'italic' }}>
                ({activity.reasoning})
              </Typography>
            )}
            <Box className="thinking-dots">
              <Box className="dot" />
              <Box className="dot" />
              <Box className="dot" />
            </Box>
          </AgentThinkingIndicator>
        ))}
      </Box>
    );
  };
  
  // Render governance insights
  const renderGovernanceInsights = (insights: GovernanceInsight[]) => {
    if (!insights || insights.length === 0) return null;
    
    return (
      <GovernanceInsightCard>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PsychologyIcon sx={{ color: DARK_THEME.primary, fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: DARK_THEME.primary, fontWeight: 600 }}>
              Governance Insights
            </Typography>
          </Box>
          
          {insights.map((insight, index) => (
            <Box key={index} mb={index < insights.length - 1 ? 1 : 0}>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, fontSize: '12px' }}>
                {insight.description}
              </Typography>
              {insight.recommendations && (
                <Box mt={0.5}>
                  {insight.recommendations.map((rec, recIndex) => (
                    <Typography 
                      key={recIndex} 
                      variant="caption" 
                      sx={{ color: DARK_THEME.text.secondary, display: 'block', fontSize: '11px' }}
                    >
                      • {rec}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </CardContent>
      </GovernanceInsightCard>
    );
  };
  
  // Render audit log share
  const renderAuditLogShare = (auditShare: FilteredAuditLogShare) => {
    return (
      <AuditLogShareCard>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <SecurityIcon sx={{ color: DARK_THEME.success, fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: DARK_THEME.success, fontWeight: 600 }}>
              Audit Log Share (Relevance: {(auditShare.relevanceScore * 100).toFixed(0)}%)
            </Typography>
          </Box>
          
          <Accordion sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: DARK_THEME.success }} />}>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, fontSize: '12px' }}>
                View Filtered Governance Reasoning
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="caption" sx={{ color: DARK_THEME.success, fontWeight: 600 }}>
                  Key Reasoning Steps:
                </Typography>
                {auditShare.filteredReasoning.keyReasoningSteps.map((step, index) => (
                  <Typography key={index} variant="caption" sx={{ color: DARK_THEME.text.secondary, display: 'block', fontSize: '11px' }}>
                    • {step}
                  </Typography>
                ))}
                
                <Typography variant="caption" sx={{ color: DARK_THEME.success, fontWeight: 600, mt: 1, display: 'block' }}>
                  Policy Considerations:
                </Typography>
                {auditShare.filteredReasoning.criticalPolicyConsiderations.map((policy, index) => (
                  <Typography key={index} variant="caption" sx={{ color: DARK_THEME.text.secondary, display: 'block', fontSize: '11px' }}>
                    • {policy}
                  </Typography>
                ))}
                
                <Typography variant="caption" sx={{ color: DARK_THEME.success, fontWeight: 600, mt: 1, display: 'block' }}>
                  Lessons Learned:
                </Typography>
                {auditShare.filteredReasoning.lessonsLearned.map((lesson, index) => (
                  <Typography key={index} variant="caption" sx={{ color: DARK_THEME.text.secondary, display: 'block', fontSize: '11px' }}>
                    • {lesson}
                  </Typography>
                ))}
                
                <Box mt={1} pt={1} borderTop={`1px solid ${DARK_THEME.border}`}>
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, fontSize: '10px' }}>
                    Cryptographic Hash: {auditShare.originalCryptographicHash}
                  </Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </AuditLogShareCard>
    );
  };
  
  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <ConversationContainer>
      {/* Messages Area */}
      <MessagesContainer>
        {messages.map((message) => (
          <Box key={message.messageId}>
            <MessageBubble 
              isUser={message.agentId === 'user'} 
              messageType={message.messageType}
              agentId={message.agentId}
            >
              <Avatar className="message-avatar">
                {message.agentAvatar || (message.agentId === 'user' ? '👤' : '🤖')}
              </Avatar>
              
              <Box flex={1}>
                <Box className="message-content">
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" sx={{ 
                      color: message.agentId === 'user' ? '#ffffff' : DARK_THEME.text.secondary,
                      fontWeight: 600 
                    }}>
                      {message.agentName || message.agentId}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {message.messageType === 'audit_log_share' && (
                        <Tooltip title="Audit Log Share">
                          <SecurityIcon sx={{ fontSize: 14, color: DARK_THEME.success }} />
                        </Tooltip>
                      )}
                      
                      {message.qualityMetrics && (
                        <GovernanceIndicator 
                          level={
                            message.qualityMetrics.governance > 0.8 ? 'high' :
                            message.qualityMetrics.governance > 0.6 ? 'medium' : 'low'
                          }
                        >
                          <ShieldIcon className="indicator-icon" />
                        </GovernanceIndicator>
                      )}
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content.text}
                  </Typography>
                  
                  {message.qualityMetrics && (
                    <Box mt={1} pt={1} borderTop={`1px solid ${DARK_THEME.border}40`}>
                      <Box display="flex" gap={2}>
                        <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, fontSize: '10px' }}>
                          Quality: {(message.qualityMetrics.value * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, fontSize: '10px' }}>
                          Governance: {(message.qualityMetrics.governance * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, fontSize: '10px' }}>
                          Relevance: {(message.qualityMetrics.relevance * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
                
                {/* Governance Insights */}
                {message.governanceInsights && renderGovernanceInsights(message.governanceInsights)}
                
                {/* Audit Log Share */}
                {message.auditLogShare && renderAuditLogShare(message.auditLogShare)}
              </Box>
            </MessageBubble>
          </Box>
        ))}
        
        {/* Agent Activities */}
        {renderAgentActivities()}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      {/* Input Area */}
      <InputContainer>
        <InputRow>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Start the conversation and watch agents naturally participate..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: DARK_THEME.background,
                color: DARK_THEME.text.primary,
                '& fieldset': {
                  borderColor: DARK_THEME.border
                },
                '&:hover fieldset': {
                  borderColor: DARK_THEME.primary
                },
                '&.Mui-focused fieldset': {
                  borderColor: DARK_THEME.primary
                }
              },
              '& .MuiInputBase-input::placeholder': {
                color: DARK_THEME.text.secondary,
                opacity: 1
              }
            }}
          />
          
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            sx={{
              minWidth: '48px',
              height: '48px',
              backgroundColor: DARK_THEME.primary,
              '&:hover': {
                backgroundColor: DARK_THEME.primary + 'dd'
              }
            }}
          >
            {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
          </Button>
        </InputRow>
        
        {/* Session Info */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
              {session.participants.length} agents • {session.autonomyLevel} autonomy
            </Typography>
            
            {session.auditLogSharingEnabled && (
              <Chip
                label="Audit Sharing"
                size="small"
                icon={<SecurityIcon />}
                sx={{
                  backgroundColor: DARK_THEME.success + '20',
                  color: DARK_THEME.success,
                  fontSize: '10px',
                  height: '20px'
                }}
              />
            )}
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
              Messages: {messages.length - 1}
            </Typography>
          </Box>
        </Box>
      </InputContainer>
    </ConversationContainer>
  );
};

export default ThinkTankConversationInterface;

