/**
 * Modern Chat Provider
 * Context provider that wraps the chat interface with modern features
 * Provides unified state and feature management
 */

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useModernChat, ModernChatState, ChatMessage, Thread, InjectedResponse, SmartSuggestion } from '../../hooks/useModernChat';
import { useModernChatFeatures, trackFeatureUsage } from '../../config/modernChatConfig';

// Context interface
interface ModernChatContextValue {
  // State
  state: ModernChatState;
  
  // Feature flags
  features: {
    enhancedMessages: boolean;
    unifiedState: boolean;
    analytics: boolean;
    dragDrop: boolean;
    threading: boolean;
    intelligence: boolean;
    virtualization: boolean;
  };
  
  // Message management
  addMessage: (message: ChatMessage) => void;
  
  // Thread management
  createThread: (parentMessageId: string, topic: string) => string;
  addMessageToThread: (threadId: string, message: ChatMessage) => void;
  toggleThreadCollapse: (threadId: string) => void;
  
  // Behavioral injection
  addInjectedResponse: (injection: InjectedResponse) => void;
  
  // Drag & drop
  setDragState: (dragState: any) => void;
  
  // Smart suggestions
  addSuggestion: (suggestion: SmartSuggestion) => void;
  dismissSuggestion: (suggestionId: string) => void;
  
  // Utilities
  isThreadCollapsed: (threadId: string) => boolean;
  getThread: (threadId: string) => Thread | undefined;
  getInjection: (injectionId: string) => InjectedResponse | undefined;
  getMessagesByThread: (threadId: string) => ChatMessage[];
  getPerformanceMetrics: () => any;
}

// Create context
const ModernChatContext = createContext<ModernChatContextValue | null>(null);

// Provider props
interface ModernChatProviderProps {
  children: React.ReactNode;
  sessionId: string;
  
  // Integration with existing chat system
  existingMessages?: ChatMessage[];
  onMessageSent?: (message: ChatMessage) => void;
  onBehaviorPrompt?: (agentId: string, agentName: string, prompt: string) => void;
  
  // Configuration
  enableAnalytics?: boolean;
  debugMode?: boolean;
}

// Provider component
export const ModernChatProvider: React.FC<ModernChatProviderProps> = ({
  children,
  sessionId,
  existingMessages = [],
  onMessageSent,
  onBehaviorPrompt,
  enableAnalytics = true,
  debugMode = false
}) => {
  
  // Get modern chat state and methods
  const modernChat = useModernChat(sessionId);
  
  // Get feature flags
  const featureFlags = useModernChatFeatures([
    'enhanced-message-wrapper',
    'unified-state-management',
    'modern-chat-analytics',
    'drag-drop-injection',
    'smart-threading',
    'conversation-intelligence',
    'virtualized-rendering'
  ]);
  
  // Sync existing messages with modern chat state
  useEffect(() => {
    if (existingMessages.length > 0) {
      existingMessages.forEach(message => {
        modernChat.addMessage(message);
      });
      
      if (enableAnalytics) {
        trackFeatureUsage('unified-state-management', 'messages_synced', {
          messageCount: existingMessages.length,
          sessionId
        });
      }
    }
  }, [existingMessages, modernChat, sessionId, enableAnalytics]);
  
  // Enhanced message sending that integrates with existing system
  const handleMessageSent = useCallback((message: ChatMessage) => {
    // Add to modern chat state
    modernChat.addMessage(message);
    
    // Call existing message handler
    onMessageSent?.(message);
    
    if (enableAnalytics) {
      trackFeatureUsage('enhanced-message-wrapper', 'message_sent', {
        messageId: message.id,
        sender: message.sender,
        type: message.type
      });
    }
  }, [modernChat, onMessageSent, enableAnalytics]);
  
  // Enhanced behavioral injection that integrates with existing system
  const handleBehavioralInjection = useCallback((injection: InjectedResponse) => {
    // Add to modern chat state
    modernChat.addInjectedResponse(injection);
    
    // Generate enhanced prompt for existing system
    const enhancedPrompt = generateEnhancedPrompt(injection);
    
    // Call existing behavior prompt handler
    onBehaviorPrompt?.(injection.agentId, injection.agentName, enhancedPrompt);
    
    if (enableAnalytics) {
      trackFeatureUsage('drag-drop-injection', 'behavioral_injection', {
        injectionId: injection.id,
        agentId: injection.agentId,
        careerRole: injection.careerRole,
        behavior: injection.behavior
      });
    }
  }, [modernChat, onBehaviorPrompt, enableAnalytics]);
  
  // Context value
  const contextValue: ModernChatContextValue = {
    // State
    state: modernChat.state,
    
    // Feature flags
    features: {
      enhancedMessages: featureFlags['enhanced-message-wrapper'],
      unifiedState: featureFlags['unified-state-management'],
      analytics: featureFlags['modern-chat-analytics'] && enableAnalytics,
      dragDrop: featureFlags['drag-drop-injection'],
      threading: featureFlags['smart-threading'],
      intelligence: featureFlags['conversation-intelligence'],
      virtualization: featureFlags['virtualized-rendering']
    },
    
    // Message management
    addMessage: handleMessageSent,
    
    // Thread management
    createThread: modernChat.createThread,
    addMessageToThread: modernChat.addMessageToThread,
    toggleThreadCollapse: modernChat.toggleThreadCollapse,
    
    // Behavioral injection
    addInjectedResponse: handleBehavioralInjection,
    
    // Drag & drop
    setDragState: modernChat.setDragState,
    
    // Smart suggestions
    addSuggestion: modernChat.addSuggestion,
    dismissSuggestion: modernChat.dismissSuggestion,
    
    // Utilities
    isThreadCollapsed: modernChat.isThreadCollapsed,
    getThread: modernChat.getThread,
    getInjection: modernChat.getInjection,
    getMessagesByThread: modernChat.getMessagesByThread,
    getPerformanceMetrics: modernChat.getPerformanceMetrics
  };
  
  // Debug logging
  useEffect(() => {
    if (debugMode) {
      console.log('🎯 [ModernChatProvider] State updated:', {
        messages: modernChat.state.messages.length,
        threads: modernChat.state.threads.size,
        injections: modernChat.state.injectedResponses.size,
        features: contextValue.features
      });
    }
  }, [modernChat.state, contextValue.features, debugMode]);
  
  // Performance monitoring
  useEffect(() => {
    if (enableAnalytics && featureFlags['modern-chat-analytics']) {
      const reportPerformance = () => {
        const metrics = modernChat.getPerformanceMetrics();
        trackFeatureUsage('modern-chat-analytics', 'performance_report', {
          ...metrics,
          sessionId,
          timestamp: new Date().toISOString()
        });
      };
      
      const interval = setInterval(reportPerformance, 60000); // Report every minute
      return () => clearInterval(interval);
    }
  }, [enableAnalytics, featureFlags, modernChat, sessionId]);
  
  return (
    <ModernChatContext.Provider value={contextValue}>
      {children}
    </ModernChatContext.Provider>
  );
};

// Hook to use modern chat context
export const useModernChatContext = (): ModernChatContextValue => {
  const context = useContext(ModernChatContext);
  if (!context) {
    throw new Error('useModernChatContext must be used within a ModernChatProvider');
  }
  return context;
};

// Helper function to generate enhanced prompts
const generateEnhancedPrompt = (injection: InjectedResponse): string => {
  const roleContext = getRoleContext(injection.careerRole);
  const behaviorContext = getBehaviorContext(injection.behavior);
  
  let prompt = `Acting as a ${roleContext.label}, respond with a ${behaviorContext.label.toLowerCase()} approach:

"${injection.response}"

${behaviorContext.description}`;

  if (injection.customPrompt) {
    prompt += `\n\nAdditional instructions: ${injection.customPrompt}`;
  }
  
  if (injection.threadId) {
    prompt += `\n\nThis is part of a threaded discussion. Maintain context and contribute meaningfully to the thread.`;
  }
  
  return prompt;
};

// Helper functions for role and behavior contexts
const getRoleContext = (role: string) => {
  const roleMap: Record<string, { label: string; description: string }> = {
    'legal': { label: 'Legal Counsel', description: 'Focus on legal implications and compliance' },
    'hr': { label: 'HR Specialist', description: 'Consider employee and organizational impact' },
    'cto': { label: 'Chief Technology Officer', description: 'Evaluate technical feasibility and strategy' },
    'cfo': { label: 'Chief Financial Officer', description: 'Analyze financial implications and ROI' },
    // Add more roles as needed
  };
  
  return roleMap[role] || { label: 'Specialist', description: 'Provide expert analysis' };
};

const getBehaviorContext = (behavior: string) => {
  const behaviorMap: Record<string, { label: string; description: string }> = {
    'collaborative': { label: 'Collaborative', description: 'Work cooperatively and build on ideas' },
    'devils_advocate': { label: 'Devil\'s Advocate', description: 'Challenge ideas and ask tough questions' },
    'expert': { label: 'Expert', description: 'Provide deep domain knowledge and expertise' },
    'creative': { label: 'Creative', description: 'Generate innovative ideas and solutions' },
    // Add more behaviors as needed
  };
  
  return behaviorMap[behavior] || { label: 'Professional', description: 'Respond professionally and thoughtfully' };
};

export default ModernChatProvider;

