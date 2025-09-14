/**
 * Unified Modern Chat State Management
 * Central hook for managing all modern chat features and state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useModernChatFeature, trackFeatureUsage } from '../config/modernChatConfig';

// Core types for modern chat state
export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: Date;
  type: 'human' | 'ai';
  metadata?: {
    agentId?: string;
    threadId?: string;
    injectionId?: string;
    governanceScore?: number;
  };
}

export interface Thread {
  id: string;
  parentMessageId: string;
  topic: string;
  participants: Set<string>;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  isCollapsed: boolean;
  depth: number;
}

export interface InjectedResponse {
  id: string;
  agentId: string;
  agentName: string;
  targetMessageId: string;
  threadId?: string;
  careerRole: string;
  behavior: string;
  customPrompt?: string;
  response: string;
  timestamp: Date;
  metadata: {
    injectionType: 'drag-drop' | 'hover' | 'auto-suggested';
    userTriggered: boolean;
    responseQuality?: number;
    userRating?: number;
  };
}

export interface DragState {
  isDragging: boolean;
  draggedAgent?: {
    id: string;
    name: string;
    color: string;
    availableRoles: string[];
    availableBehaviors: string[];
  };
  dropTarget?: {
    messageId: string;
    threadId?: string;
  };
}

export interface ConversationInsights {
  participantActivity: Map<string, number>;
  topicProgression: string[];
  threadHealth: Map<string, number>;
  suggestedActions: SmartSuggestion[];
  governanceMetrics: {
    averageScore: number;
    flaggedMessages: string[];
    trustTrends: number[];
  };
}

export interface SmartSuggestion {
  id: string;
  type: 'behavioral-injection' | 'thread-creation' | 'topic-shift' | 'moderation';
  confidence: number;
  reason: string;
  targetMessageId?: string;
  suggestedAgent?: string;
  suggestedRole?: string;
  suggestedBehavior?: string;
  metadata?: any;
}

// Main modern chat state interface
export interface ModernChatState {
  // Core data
  messages: ChatMessage[];
  threads: Map<string, Thread>;
  injectedResponses: Map<string, InjectedResponse>;
  
  // UI state
  dragState: DragState;
  activeThreads: string[];
  collapsedThreads: Set<string>;
  selectedMessage?: string;
  
  // Intelligence
  insights: ConversationInsights;
  suggestions: SmartSuggestion[];
  
  // Performance
  renderingMode: 'standard' | 'virtualized';
  messageCache: Map<string, any>;
}

// Modern chat hook
export const useModernChat = (sessionId: string) => {
  // Feature flags
  const enhancedMessagesEnabled = useModernChatFeature('enhanced-message-wrapper');
  const unifiedStateEnabled = useModernChatFeature('unified-state-management');
  const analyticsEnabled = useModernChatFeature('modern-chat-analytics');
  
  // Core state
  const [state, setState] = useState<ModernChatState>({
    messages: [],
    threads: new Map(),
    injectedResponses: new Map(),
    dragState: { isDragging: false },
    activeThreads: [],
    collapsedThreads: new Set(),
    insights: {
      participantActivity: new Map(),
      topicProgression: [],
      threadHealth: new Map(),
      suggestedActions: [],
      governanceMetrics: {
        averageScore: 0,
        flaggedMessages: [],
        trustTrends: []
      }
    },
    suggestions: [],
    renderingMode: 'standard',
    messageCache: new Map()
  });
  
  // Performance tracking
  const performanceRef = useRef({
    messageRenderTimes: [] as number[],
    stateUpdateTimes: [] as number[],
    lastUpdate: Date.now()
  });
  
  // Message management
  const addMessage = useCallback((message: ChatMessage) => {
    const startTime = performance.now();
    
    setState(prev => {
      const newMessages = [...prev.messages, message];
      
      // Update insights if analytics enabled
      let newInsights = prev.insights;
      if (analyticsEnabled) {
        newInsights = updateInsights(prev.insights, message);
      }
      
      return {
        ...prev,
        messages: newMessages,
        insights: newInsights
      };
    });
    
    // Track performance
    const renderTime = performance.now() - startTime;
    performanceRef.current.messageRenderTimes.push(renderTime);
    
    if (analyticsEnabled) {
      trackFeatureUsage('enhanced-message-wrapper', 'message_added', {
        messageId: message.id,
        renderTime,
        totalMessages: state.messages.length + 1
      });
    }
  }, [analyticsEnabled, state.messages.length]);
  
  // Thread management
  const createThread = useCallback((parentMessageId: string, topic: string) => {
    const threadId = `thread_${parentMessageId}_${Date.now()}`;
    const thread: Thread = {
      id: threadId,
      parentMessageId,
      topic,
      participants: new Set(),
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      isCollapsed: false,
      depth: 1
    };
    
    setState(prev => {
      const newThreads = new Map(prev.threads);
      newThreads.set(threadId, thread);
      
      return {
        ...prev,
        threads: newThreads,
        activeThreads: [...prev.activeThreads, threadId]
      };
    });
    
    if (analyticsEnabled) {
      trackFeatureUsage('smart-threading', 'thread_created', {
        threadId,
        parentMessageId,
        topic
      });
    }
    
    return threadId;
  }, [analyticsEnabled]);
  
  const addMessageToThread = useCallback((threadId: string, message: ChatMessage) => {
    setState(prev => {
      const newThreads = new Map(prev.threads);
      const thread = newThreads.get(threadId);
      
      if (thread) {
        const updatedThread = {
          ...thread,
          messages: [...thread.messages, message],
          participants: new Set([...thread.participants, message.sender]),
          lastActivity: new Date()
        };
        newThreads.set(threadId, updatedThread);
      }
      
      return {
        ...prev,
        threads: newThreads
      };
    });
  }, []);
  
  // Behavioral injection management
  const addInjectedResponse = useCallback((injection: InjectedResponse) => {
    setState(prev => {
      const newInjections = new Map(prev.injectedResponses);
      newInjections.set(injection.id, injection);
      
      return {
        ...prev,
        injectedResponses: newInjections
      };
    });
    
    if (analyticsEnabled) {
      trackFeatureUsage('drag-drop-injection', 'response_injected', {
        injectionId: injection.id,
        agentId: injection.agentId,
        careerRole: injection.careerRole,
        behavior: injection.behavior,
        injectionType: injection.metadata.injectionType
      });
    }
  }, [analyticsEnabled]);
  
  // Drag state management
  const setDragState = useCallback((dragState: Partial<DragState>) => {
    setState(prev => ({
      ...prev,
      dragState: { ...prev.dragState, ...dragState }
    }));
  }, []);
  
  // Thread UI management
  const toggleThreadCollapse = useCallback((threadId: string) => {
    setState(prev => {
      const newCollapsed = new Set(prev.collapsedThreads);
      if (newCollapsed.has(threadId)) {
        newCollapsed.delete(threadId);
      } else {
        newCollapsed.add(threadId);
      }
      
      return {
        ...prev,
        collapsedThreads: newCollapsed
      };
    });
    
    if (analyticsEnabled) {
      trackFeatureUsage('thread-ui-components', 'thread_toggled', {
        threadId,
        action: state.collapsedThreads.has(threadId) ? 'expanded' : 'collapsed'
      });
    }
  }, [analyticsEnabled, state.collapsedThreads]);
  
  // Smart suggestions
  const addSuggestion = useCallback((suggestion: SmartSuggestion) => {
    setState(prev => ({
      ...prev,
      suggestions: [...prev.suggestions, suggestion]
    }));
  }, []);
  
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }));
    
    if (analyticsEnabled) {
      trackFeatureUsage('smart-suggestions', 'suggestion_dismissed', {
        suggestionId
      });
    }
  }, [analyticsEnabled]);
  
  // Performance monitoring
  const getPerformanceMetrics = useCallback(() => {
    const metrics = performanceRef.current;
    return {
      averageMessageRenderTime: metrics.messageRenderTimes.length > 0 
        ? metrics.messageRenderTimes.reduce((a, b) => a + b, 0) / metrics.messageRenderTimes.length 
        : 0,
      totalMessages: state.messages.length,
      activeThreads: state.activeThreads.length,
      injectedResponses: state.injectedResponses.size,
      memoryUsage: {
        messages: state.messages.length,
        threads: state.threads.size,
        injections: state.injectedResponses.size,
        cacheSize: state.messageCache.size
      }
    };
  }, [state]);
  
  // Cleanup and optimization
  useEffect(() => {
    // Cleanup old performance data
    const cleanup = () => {
      const metrics = performanceRef.current;
      if (metrics.messageRenderTimes.length > 100) {
        metrics.messageRenderTimes = metrics.messageRenderTimes.slice(-50);
      }
      if (metrics.stateUpdateTimes.length > 100) {
        metrics.stateUpdateTimes = metrics.stateUpdateTimes.slice(-50);
      }
    };
    
    const interval = setInterval(cleanup, 30000); // Cleanup every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  // Analytics reporting
  useEffect(() => {
    if (analyticsEnabled) {
      const reportMetrics = () => {
        const metrics = getPerformanceMetrics();
        trackFeatureUsage('modern-chat-analytics', 'performance_report', metrics);
      };
      
      const interval = setInterval(reportMetrics, 60000); // Report every minute
      return () => clearInterval(interval);
    }
  }, [analyticsEnabled, getPerformanceMetrics]);
  
  return {
    // State
    state,
    
    // Feature flags
    features: {
      enhancedMessages: enhancedMessagesEnabled,
      unifiedState: unifiedStateEnabled,
      analytics: analyticsEnabled
    },
    
    // Message management
    addMessage,
    
    // Thread management
    createThread,
    addMessageToThread,
    toggleThreadCollapse,
    
    // Behavioral injection
    addInjectedResponse,
    
    // Drag & drop
    setDragState,
    
    // Smart suggestions
    addSuggestion,
    dismissSuggestion,
    
    // Performance
    getPerformanceMetrics,
    
    // Utilities
    isThreadCollapsed: (threadId: string) => state.collapsedThreads.has(threadId),
    getThread: (threadId: string) => state.threads.get(threadId),
    getInjection: (injectionId: string) => state.injectedResponses.get(injectionId),
    getMessagesByThread: (threadId: string) => {
      const thread = state.threads.get(threadId);
      return thread ? thread.messages : [];
    }
  };
};

// Helper function to update insights
const updateInsights = (currentInsights: ConversationInsights, newMessage: ChatMessage): ConversationInsights => {
  const updatedActivity = new Map(currentInsights.participantActivity);
  const currentActivity = updatedActivity.get(newMessage.sender) || 0;
  updatedActivity.set(newMessage.sender, currentActivity + 1);
  
  return {
    ...currentInsights,
    participantActivity: updatedActivity,
    topicProgression: [...currentInsights.topicProgression] // Will be enhanced in Week 4
  };
};

export default useModernChat;

