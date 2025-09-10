/**
 * UnifiedCollaborationWrapper - Main wrapper for unified collaboration features
 * Provides a complete collaborative chat experience while maintaining familiar UI
 */

import React, { useEffect, useState } from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import { UnifiedParticipantProvider } from '../../contexts/UnifiedParticipantContext';
import { UnifiedChatInterface } from './UnifiedChatInterface';
import { SharedConversationHeader } from './SharedConversationHeader';
import { ParticipantManager } from './ParticipantManager';
import { RealTimeStatusIndicator } from './RealTimeStatusIndicator';
import { AgentInfo } from '../AgentAvatarSelector';
import { unifiedParticipantService } from '../../services/UnifiedParticipantService';

export interface UnifiedCollaborationWrapperProps {
  // Required props
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  
  // Chat interface props
  hostAgent: AgentInfo;
  guestAgents?: AgentInfo[];
  selectedAgents: string[];
  onSelectionChange: (selectedAgentIds: string[]) => void;
  
  // Collaboration settings
  isHost?: boolean;
  hostUserName?: string;
  conversationName?: string;
  enableUnifiedSystem?: boolean;
  
  // UI customization
  showHeader?: boolean;
  showRealTimeStatus?: boolean;
  showParticipantManager?: boolean;
  
  // Callbacks
  onAddGuests?: (guests: any[]) => void;
  onParticipantAdded?: (participant: any) => void;
  onParticipantRemoved?: (participantId: string) => void;
  onError?: (error: string) => void;
  
  // Children (chat messages area)
  children?: React.ReactNode;
}

export const UnifiedCollaborationWrapper: React.FC<UnifiedCollaborationWrapperProps> = ({
  conversationId,
  currentUserId,
  currentUserName,
  hostAgent,
  guestAgents = [],
  selectedAgents,
  onSelectionChange,
  isHost = false,
  hostUserName,
  conversationName,
  enableUnifiedSystem = true,
  showHeader = true,
  showRealTimeStatus = true,
  showParticipantManager = true,
  onAddGuests,
  onParticipantAdded,
  onParticipantRemoved,
  onError,
  children
}) => {
  const [participantManagerOpen, setParticipantManagerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize unified participant system for host
  useEffect(() => {
    if (enableUnifiedSystem && isHost && conversationId && !initialized) {
      initializeUnifiedSystem();
    }
  }, [enableUnifiedSystem, isHost, conversationId, initialized]);

  const initializeUnifiedSystem = async () => {
    try {
      console.log('🚀 [UnifiedCollaborationWrapper] Initializing unified system for host');
      
      // Prepare host agents for initialization
      const hostAgents = [hostAgent, ...guestAgents].map(agent => ({
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        color: agent.color,
        hotkey: agent.hotkey,
        provider: 'openai', // Default provider
        model: 'gpt-4', // Default model
        systemPrompt: '' // Default system prompt
      }));

      await unifiedParticipantService.initializeConversationParticipants(
        conversationId,
        currentUserId,
        currentUserName,
        hostAgents
      );

      setInitialized(true);
      console.log('✅ [UnifiedCollaborationWrapper] Unified system initialized');

    } catch (error) {
      console.error('❌ [UnifiedCollaborationWrapper] Failed to initialize unified system:', error);
      const errorMessage = `Failed to initialize collaboration: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Handle adding AI agent
  const handleAddAIAgent = async (agentConfig: {
    id: string;
    name: string;
    provider?: string;
    model?: string;
    systemPrompt?: string;
    color?: string;
    hotkey?: string;
    avatar?: string;
  }) => {
    try {
      console.log('🤖 [UnifiedCollaborationWrapper] Adding AI agent:', agentConfig.name);
      
      // The UnifiedParticipantContext will handle this via the service
      onParticipantAdded?.(agentConfig);
      
    } catch (error) {
      console.error('❌ [UnifiedCollaborationWrapper] Failed to add AI agent:', error);
      const errorMessage = `Failed to add AI agent: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Handle removing participant
  const handleRemoveParticipant = async (participantId: string) => {
    try {
      console.log('🗑️ [UnifiedCollaborationWrapper] Removing participant:', participantId);
      
      // The UnifiedParticipantContext will handle this via the service
      onParticipantRemoved?.(participantId);
      
    } catch (error) {
      console.error('❌ [UnifiedCollaborationWrapper] Failed to remove participant:', error);
      const errorMessage = `Failed to remove participant: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Handle opening participant manager
  const handleOpenParticipantManager = () => {
    setParticipantManagerOpen(true);
  };

  // Determine if we're in shared mode
  const isSharedMode = enableUnifiedSystem && (isHost || !!hostUserName);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Unified Participant Provider */}
      {enableUnifiedSystem ? (
        <UnifiedParticipantProvider
          conversationId={conversationId}
          currentUserId={currentUserId}
          enabled={enableUnifiedSystem}
        >
          {/* Shared Conversation Header */}
          {showHeader && isSharedMode && (
            <SharedConversationHeader
              hostUserName={hostUserName}
              conversationName={conversationName}
              isHost={isHost}
              showParticipantAvatars={true}
              compact={false}
            />
          )}

          {/* Chat Messages Area */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {children}
          </Box>

          {/* Real-Time Status (when not in chat interface) */}
          {showRealTimeStatus && !isSharedMode && (
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
              <RealTimeStatusIndicator compact={false} showDetails={true} />
            </Box>
          )}

          {/* Unified Chat Interface */}
          <Box sx={{ p: 2 }}>
            <UnifiedChatInterface
              hostAgent={hostAgent}
              guestAgents={guestAgents}
              selectedAgents={selectedAgents}
              onSelectionChange={onSelectionChange}
              isSharedMode={isSharedMode}
              hostUserName={hostUserName}
              conversationId={conversationId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              showCollaborationIndicator={true}
              showParticipantCount={true}
              showRealTimeStatus={showRealTimeStatus}
              onAddGuests={onAddGuests}
              onAddAIAgent={handleAddAIAgent}
              onRemoveParticipant={handleRemoveParticipant}
            />
          </Box>

          {/* Participant Manager */}
          {showParticipantManager && (
            <ParticipantManager
              conversationId={conversationId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              open={participantManagerOpen}
              onClose={() => setParticipantManagerOpen(false)}
              onAddHuman={() => {
                setParticipantManagerOpen(false);
                // Trigger guest selector
                onAddGuests?.([]);
              }}
              onAddAIAgent={() => {
                setParticipantManagerOpen(false);
                // This would trigger an AI agent selector
                // For now, we'll use a default agent
                handleAddAIAgent({
                  id: `agent_${Date.now()}`,
                  name: 'New AI Agent',
                  provider: 'openai',
                  model: 'gpt-4',
                  color: '#8b5cf6'
                });
              }}
            />
          )}
        </UnifiedParticipantProvider>
      ) : (
        // Fallback to standard interface when unified system is disabled
        <>
          {/* Chat Messages Area */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {children}
          </Box>

          {/* Standard Chat Interface */}
          <Box sx={{ p: 2 }}>
            <UnifiedChatInterface
              hostAgent={hostAgent}
              guestAgents={guestAgents}
              selectedAgents={selectedAgents}
              onSelectionChange={onSelectionChange}
              isSharedMode={false}
              conversationId={conversationId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              showCollaborationIndicator={false}
              showParticipantCount={false}
              showRealTimeStatus={false}
              onAddGuests={onAddGuests}
              onAddAIAgent={handleAddAIAgent}
              onRemoveParticipant={handleRemoveParticipant}
            />
          </Box>
        </>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UnifiedCollaborationWrapper;

