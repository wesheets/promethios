/**
 * RightPanelContent - Using working components from old interface
 * 
 * Uses the actual working panel components from ChatbotProfilesPageEnhanced.tsx
 * All components maintain their original functionality, data connections, and business logic.
 */
import React from 'react';
import { Box } from '@mui/material';

// Import working panel components from the old interface
import TeamPanel from '../team/TeamPanel';
import OptimizedChatHistoryPanel from '../chat/OptimizedChatHistoryPanel';
import ChatInterfacePanel from '../chat/ChatInterfacePanel';
import DebugPanel from '../DebugPanel';
import GovernancePanel from '../governance/GovernancePanel';
import { RAGPolicyPanel } from '../governance/RAGPolicyPanel';
import ToolConfigurationPanel from '../tools/ToolConfigurationPanel';
import ConnectedAppsPanel from '../tools/ConnectedAppsPanel';
import MASCollaborationPanel from '../collaboration/MASCollaborationPanel';
import TokenEconomicsConfigPanel from '../TokenEconomicsConfigPanel';
interface RightPanelContentProps {
  panelType: string;
  userId?: string;
  userName?: string;
  currentAgentId?: string;
  currentAgentName?: string;
  chatMessages?: any[];
  humanParticipants?: any[];
  sharedConversations?: any[];
  selectedChatbot?: any;
  currentBotState?: any;
  // Chat History Callbacks
  onChatSelect?: (session: any) => void;
  onNewChat?: (session?: any) => void;
  onShareChat?: (contextId: string) => void;
  onClose?: () => void;
  // Additional props for working components
  projects?: any[];
  projectTemplates?: any[];
  repositoryManager?: any;
  versionControl?: any;
  onAddGuestAgent?: (agentId: string) => void;
  onAddHumanToChat?: (humans: any[]) => void;
  guestConversationAccess?: any[];
  onCustomSharedConversationSelect?: (conversationId: string) => void;
  refreshSharedConversations?: () => void;
  masCollaborationSettings?: any;
  availableAgents?: any[];
  currentTokenUsage?: any;
}

const RightPanelContent: React.FC<RightPanelContentProps> = ({
  panelType,
  userId = 'default-user',
  userName = 'User',
  currentAgentId,
  currentAgentName,
  chatMessages = [],
  humanParticipants = [],
  sharedConversations = [],
  selectedChatbot,
  currentBotState,
  // Chat History Callbacks
  onChatSelect,
  onNewChat,
  onShareChat,
  onClose,
  // Additional props for working components
  projects = [],
  projectTemplates = [],
  repositoryManager,
  versionControl,
  onAddGuestAgent,
  onAddHumanToChat,
  guestConversationAccess = [],
  onCustomSharedConversationSelect,
  refreshSharedConversations,
  masCollaborationSettings,
  availableAgents = [],
  currentTokenUsage = {},
}) => {
  // Common props to pass to all panel components
  const commonProps = {
    userId,
    userName,
    currentAgentId,
    currentAgentName,
    chatMessages,
    humanParticipants,
    sharedConversations,
    selectedChatbot,
    currentBotState,
    onClose
  };

  const renderPanelContent = () => {
    switch (panelType) {
      case 'team':
        return (
          <TeamPanel 
            currentUserId={userId} 
            onAddGuestAgent={onAddGuestAgent}
            onAddHumanToChat={onAddHumanToChat}
          />
        );

      case 'mas_collaboration':
        return (
          <MASCollaborationPanel
            settings={masCollaborationSettings || {
              chatFeatures: {
                conversationContextSharing: true,
                crossAgentReferences: true,
                realTimeCollaboration: true,
                visualAgentSelection: true,
                mentionSystemEnabled: true
              },
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
            onSettingsChange={(settings: any) => {
              console.log('🎛️ [MAS] Settings updated:', settings);
            }}
            availableAgents={availableAgents}
            currentTokenUsage={currentTokenUsage}
          />
        );

      case 'chats':
        return (
          <OptimizedChatHistoryPanel
            agentId={currentAgentId || selectedChatbot?.id || ''}
            agentName={currentAgentName || selectedChatbot?.name || `Agent ${currentAgentId}`}
            currentSessionId={currentBotState?.currentChatSession?.id}
            refreshTrigger={currentBotState?.chatHistoryRefreshTrigger || 0}
            sharedConversations={guestConversationAccess.map(access => ({
              id: access.id,
              name: access.conversationName || 'Shared Chat',
              participants: access.participants || [],
              messageCount: access.messageCount || 0,
              createdAt: access.createdAt,
              updatedAt: access.updatedAt,
              isPrivate: false,
              createdBy: access.hostUserId || '',
            }))}
            onSharedConversationSelect={onCustomSharedConversationSelect}
            onDeleteSharedConversation={(conversationId) => {
              console.log(`🗑️ [SharedChat] Deleting conversation: ${conversationId}`);
              refreshSharedConversations?.();
            }}
            onBulkCleanupLegacyConversations={() => {
              console.log(`🧹 [LegacyCleanup] Cleaning up legacy conversations`);
              refreshSharedConversations?.();
            }}
            onDirectMessage={(userId, userName) => {
              console.log(`🔄 [DirectMessage] Opening DM with ${userName} (${userId})`);
            }}
            onViewProfile={(userId) => {
              console.log(`🔄 [Profile] Viewing profile for user ${userId}`);
            }}
            onChatSelect={onChatSelect}
            onNewChat={onNewChat}
            onShareChat={onShareChat}
          />
        );

      case 'chat_interface':
        return (
          <ChatInterfacePanel
            {...commonProps}
          />
        );

      case 'tools':
        return (
          <ToolConfigurationPanel
            {...commonProps}
          />
        );

      case 'integrations':
        return (
          <ConnectedAppsPanel
            {...commonProps}
          />
        );

      case 'rag_policy':
        return (
          <RAGPolicyPanel
            {...commonProps}
          />
        );

      case 'governance':
        return (
          <GovernancePanel
            {...commonProps}
          />
        );

      case 'debug':
        return (
          <DebugPanel
            {...commonProps}
          />
        );

      case 'token_economics':
        return (
          <TokenEconomicsConfigPanel
            {...commonProps}
          />
        );

      // Placeholder panels for components that need to be created/found
      case 'analytics':
        return (
          <Box sx={{ p: 3 }}>
            <div>Analytics Panel - Full functionality to be restored</div>
          </Box>
        );

      case 'customize':
        return (
          <Box sx={{ p: 3 }}>
            <div>Customize Panel - Full functionality to be restored</div>
          </Box>
        );

      case 'personality':
        return (
          <Box sx={{ p: 3 }}>
            <div>Personality Panel - Full functionality to be restored</div>
          </Box>
        );

      case 'ai_knowledge':
        return (
          <Box sx={{ p: 3 }}>
            <div>AI Knowledge Panel - Full functionality to be restored</div>
          </Box>
        );

      case 'automation':
        return (
          <Box sx={{ p: 3 }}>
            <div>Automation Panel - Full functionality to be restored</div>
          </Box>
        );

      case 'receipts':
        return (
          <Box sx={{ p: 3 }}>
            <div>Receipts Panel - Full functionality to be restored</div>
          </Box>
        );

      case 'memory':
        return (
          <Box sx={{ p: 3 }}>
            <div>Memory Panel - Full functionality to be restored</div>
          </Box>
        );

      case 'sandbox':
        return (
          <Box sx={{ p: 3 }}>
            <div>Sandbox Panel - Full functionality to be restored</div>
          </Box>
        );

      case 'repo':
        return (
          <Box sx={{ p: 3 }}>
            <div>Repository Panel - Full functionality to be restored</div>
          </Box>
        );

      default:
        return (
          <Box sx={{ p: 3 }}>
            <div>Panel type "{panelType}" - Full functionality to be restored</div>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto',
      bgcolor: 'background.paper'
    }}>
      {renderPanelContent()}
    </Box>
  );
};

export default RightPanelContent;

