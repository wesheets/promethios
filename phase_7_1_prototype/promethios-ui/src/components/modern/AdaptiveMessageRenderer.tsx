/**
 * Adaptive Message Renderer
 * Wraps existing message components with modern features based on chat mode
 * Provides progressive enhancement without breaking existing functionality
 */

import React from 'react';
import { Box } from '@mui/material';
import { EnhancedMessageWrapper } from './EnhancedMessageWrapper';
import { useChatMode } from './ChatModeDetector';
import { useModernChatContext } from './ModernChatProvider';
import { ChatMessage } from '../../hooks/useModernChat';

interface AdaptiveMessageRendererProps {
  message: ChatMessage;
  children: React.ReactNode;
  className?: string;
  sx?: any;
}

export const AdaptiveMessageRenderer: React.FC<AdaptiveMessageRendererProps> = ({
  message,
  children,
  className,
  sx
}) => {
  const { mode, features } = useChatMode();
  const modernChat = useModernChatContext();
  
  // If modern features are disabled, return original children
  if (!modernChat.features.enhancedMessages) {
    return <>{children}</>;
  }
  
  // Handle agent drop for behavioral injection
  const handleAgentDrop = (agentData: any, targetMessage: ChatMessage) => {
    console.log(`🎭 [AdaptiveRenderer] Agent ${agentData.agentName} dropped on message:`, targetMessage.id);
    
    // Create injection response
    const injection = {
      id: `injection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: agentData.agentId,
      agentName: agentData.agentName,
      targetMessageId: targetMessage.id,
      careerRole: agentData.selectedRole || 'general',
      behavior: agentData.selectedBehavior || 'collaborative',
      customPrompt: agentData.customPrompt || '',
      response: '', // Will be filled by the AI response
      timestamp: new Date(),
      metadata: {
        injectionType: 'drag-drop' as const,
        userTriggered: true
      }
    };
    
    modernChat.addInjectedResponse(injection);
    
    // TODO: Trigger actual AI response with behavioral prompt
    // This would integrate with the existing onBehaviorPrompt system
  };
  
  // Handle thread creation
  const handleCreateThread = (targetMessage: ChatMessage) => {
    console.log(`🧵 [AdaptiveRenderer] Creating thread for message:`, targetMessage.id);
    
    const threadId = modernChat.createThread(
      targetMessage.id,
      `Thread: ${targetMessage.content.substring(0, 50)}...`
    );
    
    console.log(`🧵 [AdaptiveRenderer] Thread created:`, threadId);
  };
  
  // Handle message analysis for intelligence features
  const handleAnalyzeMessage = async (targetMessage: ChatMessage) => {
    console.log(`🧠 [AdaptiveRenderer] Analyzing message:`, targetMessage.id);
    
    // TODO: Implement AI-powered message analysis
    // This would generate smart suggestions for behavioral injection
    const suggestion = {
      id: `suggestion_${Date.now()}`,
      type: 'behavioral-injection' as const,
      confidence: 0.8,
      reason: 'Message contains technical content that could benefit from expert analysis',
      targetMessageId: targetMessage.id,
      suggestedAgent: 'technical-expert',
      suggestedRole: 'cto',
      suggestedBehavior: 'expert'
    };
    
    modernChat.addSuggestion(suggestion);
  };
  
  // Get mode-specific styling
  const getModeSpecificStyling = () => {
    const baseStyling = {
      position: 'relative',
      ...sx
    };
    
    switch (mode) {
      case 'single-chat':
        return {
          ...baseStyling,
          // Clean, minimal styling for single chat
          maxWidth: '800px',
          margin: '0 auto'
        };
        
      case 'multi-agent':
        return {
          ...baseStyling,
          // Rich styling for multi-agent orchestration
          border: '1px solid transparent',
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(139, 92, 246, 0.02)',
            borderColor: 'rgba(139, 92, 246, 0.1)'
          }
        };
        
      case 'shared-conversation':
        return {
          ...baseStyling,
          // Collaborative styling with governance indicators
          borderLeft: message.type === 'ai' ? '3px solid #3b82f6' : '3px solid #10b981',
          paddingLeft: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        };
        
      default:
        return baseStyling;
    }
  };
  
  return (
    <Box
      className={className}
      sx={getModeSpecificStyling()}
      data-chat-mode={mode}
      data-message-type={message.type}
    >
      <EnhancedMessageWrapper
        message={message}
        enableDropTarget={features.dragDropInjection}
        onAgentDrop={handleAgentDrop}
        enableThreading={features.threading}
        onCreateThread={handleCreateThread}
        enableIntelligence={features.insightsPanel}
        onAnalyzeMessage={handleAnalyzeMessage}
        suggestions={modernChat.state.suggestions.filter(s => s.targetMessageId === message.id)}
      >
        {children}
      </EnhancedMessageWrapper>
      
      {/* Mode-specific overlays */}
      {mode === 'multi-agent' && <MultiAgentOverlay message={message} />}
      {mode === 'shared-conversation' && <SharedConversationOverlay message={message} />}
    </Box>
  );
};

// Multi-agent specific overlay
const MultiAgentOverlay: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { participants } = useChatMode();
  const agents = participants.filter(p => p.type === 'ai');
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: -8,
        right: 8,
        display: 'flex',
        gap: 0.5,
        opacity: 0,
        transition: 'opacity 0.2s ease',
        '.MuiBox-root:hover &': {
          opacity: 1
        }
      }}
    >
      {agents.slice(0, 3).map(agent => (
        <Box
          key={agent.id}
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: agent.color || '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.1)'
            }
          }}
          title={`Inject ${agent.name} response`}
        >
          {agent.name.charAt(0)}
        </Box>
      ))}
      {agents.length > 3 && (
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: 'rgba(139, 92, 246, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: 'white'
          }}
        >
          +{agents.length - 3}
        </Box>
      )}
    </Box>
  );
};

// Shared conversation specific overlay
const SharedConversationOverlay: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const governanceScore = message.metadata?.governanceScore || 0;
  
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: -4,
        right: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        opacity: 0.7
      }}
    >
      {/* Governance score indicator */}
      {governanceScore > 0 && (
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: governanceScore > 0.8 ? '#10b981' : governanceScore > 0.6 ? '#f59e0b' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: 'white',
            fontWeight: 600
          }}
          title={`Governance Score: ${Math.round(governanceScore * 100)}%`}
        >
          {Math.round(governanceScore * 100)}
        </Box>
      )}
      
      {/* Message type indicator */}
      <Box
        sx={{
          fontSize: '10px',
          color: 'rgba(0, 0, 0, 0.5)',
          fontWeight: 500
        }}
      >
        {message.type === 'ai' ? '🤖' : '👤'}
      </Box>
    </Box>
  );
};

export default AdaptiveMessageRenderer;

