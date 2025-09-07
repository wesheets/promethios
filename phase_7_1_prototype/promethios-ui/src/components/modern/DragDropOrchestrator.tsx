/**
 * Drag & Drop Orchestrator
 * Coordinates the entire drag & drop behavioral injection system
 * Integrates with existing chat components and behavior prompt system
 */

import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { DraggableAgentAvatar, AgentData } from './DraggableAgentAvatar';
import { MessageDropTarget } from './MessageDropTarget';
import { BehavioralInjectionModal, BehavioralInjectionConfig } from './BehavioralInjectionModal';
import { useChatMode } from './ChatModeDetector';
import { useModernChatContext } from './ModernChatProvider';
import { trackFeatureUsage } from '../../config/modernChatConfig';

export interface DragDropOrchestratorProps {
  // Agent configuration
  agents: AgentData[];
  
  // Integration with existing system
  onBehaviorPrompt?: (agentId: string, agentName: string, prompt: string) => void;
  onMessageSent?: (message: any) => void;
  
  // Existing hover prompt system
  existingHoverPrompts?: Array<{
    icon: string;
    label: string;
    prompt: string;
  }>;
  
  // Configuration
  enableDragDrop?: boolean;
  debugMode?: boolean;
}

export const DragDropOrchestrator: React.FC<DragDropOrchestratorProps> = ({
  agents,
  onBehaviorPrompt,
  onMessageSent,
  existingHoverPrompts,
  enableDragDrop = true,
  debugMode = false
}) => {
  
  const [modalOpen, setModalOpen] = useState(false);
  const [currentInjection, setCurrentInjection] = useState<{
    agentData: any;
    messageId: string;
    messageContent: string;
    messageType: 'human' | 'ai';
  } | null>(null);
  
  const { mode, features } = useChatMode();
  const modernChat = useModernChatContext();
  
  // Handle agent drop on message
  const handleAgentDrop = useCallback((agentData: any, messageId: string) => {
    if (debugMode) {
      console.log('🎭 [DragDropOrchestrator] Agent dropped:', { agentData, messageId });
    }
    
    // Find the message content from modern chat context
    const message = modernChat.state.messages.find(m => m.id === messageId);
    if (!message) {
      console.error('Message not found:', messageId);
      return;
    }
    
    // Set up injection context and open modal
    setCurrentInjection({
      agentData,
      messageId,
      messageContent: message.content,
      messageType: message.type
    });
    setModalOpen(true);
    
    trackFeatureUsage('drag-drop-injection', 'modal_opened', {
      agentId: agentData.agentId,
      messageId,
      chatMode: mode
    });
    
  }, [debugMode, modernChat.state.messages, mode]);
  
  // Handle behavioral injection confirmation
  const handleInjectionConfirm = useCallback(async (config: BehavioralInjectionConfig) => {
    if (debugMode) {
      console.log('🎭 [DragDropOrchestrator] Injection confirmed:', config);
    }
    
    try {
      // Create the behavioral prompt using existing system
      const behavioralPrompt = config.contextualPrompt;
      
      // Call existing behavior prompt handler
      onBehaviorPrompt?.(config.agentId, config.agentName, behavioralPrompt);
      
      // Add to modern chat state for tracking
      const injectionResponse = {
        id: `injection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: config.agentId,
        agentName: config.agentName,
        targetMessageId: config.targetMessageId,
        careerRole: config.careerRole,
        behavior: config.behavior,
        customPrompt: config.customPrompt,
        response: '', // Will be filled when AI responds
        timestamp: new Date(),
        metadata: {
          ...config.metadata,
          orchestratorGenerated: true
        }
      };
      
      modernChat.addInjectedResponse(injectionResponse);
      
      // Track successful injection
      trackFeatureUsage('drag-drop-injection', 'injection_executed', {
        agentId: config.agentId,
        agentName: config.agentName,
        role: config.careerRole,
        behavior: config.behavior,
        targetMessageId: config.targetMessageId,
        chatMode: mode
      });
      
      if (debugMode) {
        console.log('✅ [DragDropOrchestrator] Injection executed successfully');
      }
      
    } catch (error) {
      console.error('❌ [DragDropOrchestrator] Injection failed:', error);
      
      trackFeatureUsage('drag-drop-injection', 'injection_failed', {
        agentId: config.agentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [debugMode, onBehaviorPrompt, modernChat, mode]);
  
  // Handle modal close
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setCurrentInjection(null);
    
    trackFeatureUsage('drag-drop-injection', 'modal_closed', {
      completed: false
    });
  }, []);
  
  // Handle existing hover prompt (for backward compatibility)
  const handleHoverPrompt = useCallback((agentId: string, prompt: string) => {
    const agent = agents.find(a => a.agentId === agentId);
    if (agent) {
      onBehaviorPrompt?.(agentId, agent.agentName, prompt);
      
      trackFeatureUsage('enhanced-agent-avatars', 'hover_prompt_used', {
        agentId,
        prompt: prompt.substring(0, 50)
      });
    }
  }, [agents, onBehaviorPrompt]);
  
  // Render draggable agent avatars
  const renderAgentAvatars = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        {agents.map((agent) => (
          <DraggableAgentAvatar
            key={agent.agentId}
            agent={agent}
            enableDrag={enableDragDrop && features.dragDropInjection}
            existingHoverPrompts={existingHoverPrompts}
            onHoverPrompt={(prompt) => handleHoverPrompt(agent.agentId, prompt)}
            size="medium"
            showLabel={false}
          />
        ))}
      </Box>
    );
  };
  
  // Create message wrapper that adds drop target functionality
  const createMessageWrapper = useCallback((messageId: string, messageContent: string, messageType: 'human' | 'ai', children: React.ReactNode) => {
    return (
      <MessageDropTarget
        messageId={messageId}
        messageContent={messageContent}
        messageType={messageType}
        onAgentDrop={handleAgentDrop}
        enableDropTarget={enableDragDrop && features.dragDropInjection}
      >
        {children}
      </MessageDropTarget>
    );
  }, [handleAgentDrop, enableDragDrop, features.dragDropInjection]);
  
  return (
    <>
      {/* Debug info */}
      {debugMode && (
        <Box
          sx={{
            position: 'fixed',
            top: 10,
            right: 10,
            p: 1,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: 1,
            fontSize: '10px',
            zIndex: 9999,
            fontFamily: 'monospace'
          }}
        >
          🎭 Drag & Drop: {enableDragDrop && features.dragDropInjection ? 'ON' : 'OFF'} | Mode: {mode}
        </Box>
      )}
      
      {/* Behavioral Injection Modal */}
      {currentInjection && (
        <BehavioralInjectionModal
          open={modalOpen}
          onClose={handleModalClose}
          onConfirm={handleInjectionConfirm}
          agentData={currentInjection.agentData}
          messageContext={{
            messageId: currentInjection.messageId,
            messageContent: currentInjection.messageContent,
            messageType: currentInjection.messageType
          }}
        />
      )}
    </>
  );
};

// Export utilities for integration
export const useDragDropOrchestrator = (
  agents: AgentData[],
  onBehaviorPrompt?: (agentId: string, agentName: string, prompt: string) => void,
  options?: {
    enableDragDrop?: boolean;
    debugMode?: boolean;
    existingHoverPrompts?: Array<{
      icon: string;
      label: string;
      prompt: string;
    }>;
  }
) => {
  const orchestratorRef = React.useRef<any>(null);
  
  const renderAgentAvatars = useCallback(() => {
    return (
      <DragDropOrchestrator
        ref={orchestratorRef}
        agents={agents}
        onBehaviorPrompt={onBehaviorPrompt}
        enableDragDrop={options?.enableDragDrop}
        debugMode={options?.debugMode}
        existingHoverPrompts={options?.existingHoverPrompts}
      />
    );
  }, [agents, onBehaviorPrompt, options]);
  
  const wrapMessage = useCallback((
    messageId: string,
    messageContent: string,
    messageType: 'human' | 'ai',
    children: React.ReactNode
  ) => {
    return (
      <MessageDropTarget
        messageId={messageId}
        messageContent={messageContent}
        messageType={messageType}
        enableDropTarget={options?.enableDragDrop}
      >
        {children}
      </MessageDropTarget>
    );
  }, [options?.enableDragDrop]);
  
  return {
    renderAgentAvatars,
    wrapMessage,
    orchestratorRef
  };
};

export default DragDropOrchestrator;

