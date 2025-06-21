/**
 * Observer Agent Service - Unified Storage Version
 * 
 * Core service for Observer Agent functionality with unified storage integration
 * Handles conversation state, insights, governance monitoring, and session persistence
 */

import { UnifiedStorageService } from './UnifiedStorageService';

interface ObserverMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  context?: string;
  metadata?: Record<string, any>;
}

interface ObserverInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'governance_alert' | 'optimization' | 'learning';
  title: string;
  description: string;
  confidence: number; // 0-1
  relevance: number; // 0-1
  timestamp: number;
  source: string;
  action?: {
    type: 'navigate' | 'execute' | 'configure' | 'learn_more';
    params: Record<string, any>;
  };
  dismissed?: boolean;
  applied?: boolean;
}

interface ObserverConversation {
  id: string;
  title: string;
  messages: ObserverMessage[];
  startTime: number;
  lastActivity: number;
  context: string;
  tags: string[];
  archived: boolean;
}

interface ObserverGovernanceEvent {
  id: string;
  type: 'policy_violation' | 'trust_boundary_breach' | 'compliance_alert' | 'security_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  source: string;
  resolved: boolean;
  resolution?: string;
  metadata?: Record<string, any>;
}

interface ObserverState {
  isActive: boolean;
  currentConversationId?: string;
  lastInteraction: number;
  totalInteractions: number;
  sessionsCount: number;
  learningEnabled: boolean;
  governanceMonitoring: boolean;
}

class ObserverAgentServiceUnified {
  private storage: UnifiedStorageService | null = null;
  private initialized = false;
  private eventListeners = new Map<string, Set<Function>>();

  constructor() {
    this.initializeService();
  }

  async initializeService() {
    try {
      // Storage will be injected by the React context
      this.initialized = true;
      console.log('ObserverAgentService: Initialized with unified storage');
    } catch (error) {
      console.error('ObserverAgentService: Initialization failed:', error);
    }
  }

  setStorage(storage: UnifiedStorageService) {
    this.storage = storage;
  }

  // Event system for real-time updates
  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  removeEventListener(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`ObserverAgentService: Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // State management
  async getState(): Promise<ObserverState> {
    if (!this.storage) throw new Error('Storage not available');

    const defaultState: ObserverState = {
      isActive: true,
      lastInteraction: Date.now(),
      totalInteractions: 0,
      sessionsCount: 0,
      learningEnabled: true,
      governanceMonitoring: true
    };

    try {
      const state = await this.storage.get<ObserverState>('observer.state.main');
      return state || defaultState;
    } catch (error) {
      console.error('ObserverAgentService: Error getting state:', error);
      return defaultState;
    }
  }

  async updateState(updates: Partial<ObserverState>): Promise<void> {
    if (!this.storage) throw new Error('Storage not available');

    try {
      const currentState = await this.getState();
      const newState = { ...currentState, ...updates };
      
      await this.storage.set('observer.state.main', newState);
      this.emit('stateChanged', newState);
    } catch (error) {
      console.error('ObserverAgentService: Error updating state:', error);
      throw error;
    }
  }

  // Conversation management
  async getConversations(): Promise<ObserverConversation[]> {
    if (!this.storage) throw new Error('Storage not available');

    try {
      const conversations = await this.storage.get<ObserverConversation[]>('observer.conversations.list');
      return conversations || [];
    } catch (error) {
      console.error('ObserverAgentService: Error getting conversations:', error);
      return [];
    }
  }

  async getConversation(id: string): Promise<ObserverConversation | null> {
    if (!this.storage) throw new Error('Storage not available');

    try {
      return await this.storage.get<ObserverConversation>(`observer.conversations.${id}`);
    } catch (error) {
      console.error('ObserverAgentService: Error getting conversation:', error);
      return null;
    }
  }

  async createConversation(title: string, context: string): Promise<ObserverConversation> {
    if (!this.storage) throw new Error('Storage not available');

    const conversation: ObserverConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      messages: [],
      startTime: Date.now(),
      lastActivity: Date.now(),
      context,
      tags: [],
      archived: false
    };

    try {
      await this.storage.set(`observer.conversations.${conversation.id}`, conversation);
      
      // Update conversations list
      const conversations = await this.getConversations();
      conversations.push(conversation);
      await this.storage.set('observer.conversations.list', conversations);
      
      // Update state
      await this.updateState({ 
        currentConversationId: conversation.id,
        lastInteraction: Date.now()
      });
      
      this.emit('conversationCreated', conversation);
      return conversation;
    } catch (error) {
      console.error('ObserverAgentService: Error creating conversation:', error);
      throw error;
    }
  }

  async addMessage(conversationId: string, content: string, role: 'user' | 'assistant' | 'system', context?: string): Promise<ObserverMessage> {
    if (!this.storage) throw new Error('Storage not available');

    const message: ObserverMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      role,
      timestamp: Date.now(),
      context
    };

    try {
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.messages.push(message);
      conversation.lastActivity = Date.now();

      await this.storage.set(`observer.conversations.${conversationId}`, conversation);
      
      // Update state
      const state = await this.getState();
      await this.updateState({ 
        totalInteractions: state.totalInteractions + 1,
        lastInteraction: Date.now()
      });
      
      this.emit('messageAdded', { conversationId, message });
      return message;
    } catch (error) {
      console.error('ObserverAgentService: Error adding message:', error);
      throw error;
    }
  }

  // Insights management
  async getInsights(): Promise<ObserverInsight[]> {
    if (!this.storage) throw new Error('Storage not available');

    try {
      const insights = await this.storage.get<ObserverInsight[]>('observer.insights.list');
      return (insights || []).filter(insight => !insight.dismissed);
    } catch (error) {
      console.error('ObserverAgentService: Error getting insights:', error);
      return [];
    }
  }

  async addInsight(insight: Omit<ObserverInsight, 'id' | 'timestamp'>): Promise<ObserverInsight> {
    if (!this.storage) throw new Error('Storage not available');

    const fullInsight: ObserverInsight = {
      ...insight,
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    try {
      const insights = await this.getInsights();
      insights.push(fullInsight);
      
      // Keep only the most recent 100 insights
      const recentInsights = insights
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);
      
      await this.storage.set('observer.insights.list', recentInsights);
      
      this.emit('insightAdded', fullInsight);
      return fullInsight;
    } catch (error) {
      console.error('ObserverAgentService: Error adding insight:', error);
      throw error;
    }
  }

  async dismissInsight(insightId: string): Promise<void> {
    if (!this.storage) throw new Error('Storage not available');

    try {
      const insights = await this.storage.get<ObserverInsight[]>('observer.insights.list') || [];
      const updatedInsights = insights.map(insight => 
        insight.id === insightId ? { ...insight, dismissed: true } : insight
      );
      
      await this.storage.set('observer.insights.list', updatedInsights);
      this.emit('insightDismissed', insightId);
    } catch (error) {
      console.error('ObserverAgentService: Error dismissing insight:', error);
      throw error;
    }
  }

  // Governance monitoring
  async getGovernanceEvents(): Promise<ObserverGovernanceEvent[]> {
    if (!this.storage) throw new Error('Storage not available');

    try {
      const events = await this.storage.get<ObserverGovernanceEvent[]>('observer.governance.events');
      return events || [];
    } catch (error) {
      console.error('ObserverAgentService: Error getting governance events:', error);
      return [];
    }
  }

  async addGovernanceEvent(event: Omit<ObserverGovernanceEvent, 'id' | 'timestamp'>): Promise<ObserverGovernanceEvent> {
    if (!this.storage) throw new Error('Storage not available');

    const fullEvent: ObserverGovernanceEvent = {
      ...event,
      id: `gov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    try {
      const events = await this.getGovernanceEvents();
      events.push(fullEvent);
      
      // Keep only the most recent 200 events
      const recentEvents = events
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 200);
      
      await this.storage.set('observer.governance.events', recentEvents);
      
      // Create insight for high severity events
      if (event.severity === 'high' || event.severity === 'critical') {
        await this.addInsight({
          type: 'governance_alert',
          title: `Governance Alert: ${event.title}`,
          description: event.description,
          confidence: 0.9,
          relevance: 1.0,
          source: 'governance_monitor',
          action: {
            type: 'learn_more',
            params: { eventId: fullEvent.id }
          }
        });
      }
      
      this.emit('governanceEventAdded', fullEvent);
      return fullEvent;
    } catch (error) {
      console.error('ObserverAgentService: Error adding governance event:', error);
      throw error;
    }
  }

  // Analytics and reporting
  async getAnalytics(): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalInsights: number;
    totalGovernanceEvents: number;
    averageSessionLength: number;
    topInsightTypes: Array<{ type: string; count: number }>;
  }> {
    if (!this.storage) throw new Error('Storage not available');

    try {
      const [conversations, insights, governanceEvents, state] = await Promise.all([
        this.getConversations(),
        this.storage.get<ObserverInsight[]>('observer.insights.list') || [],
        this.getGovernanceEvents(),
        this.getState()
      ]);

      const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
      
      // Calculate average session length (placeholder - would need session data)
      const averageSessionLength = 0; // TODO: Implement based on session tracking
      
      // Count insight types
      const insightTypeCounts = insights.reduce((acc, insight) => {
        acc[insight.type] = (acc[insight.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topInsightTypes = Object.entries(insightTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalConversations: conversations.length,
        totalMessages,
        totalInsights: insights.length,
        totalGovernanceEvents: governanceEvents.length,
        averageSessionLength,
        topInsightTypes
      };
    } catch (error) {
      console.error('ObserverAgentService: Error getting analytics:', error);
      throw error;
    }
  }

  // Cleanup and maintenance
  async cleanup(): Promise<void> {
    if (!this.storage) return;

    try {
      // Clean up old conversations (older than 90 days)
      const conversations = await this.getConversations();
      const cutoffTime = Date.now() - (90 * 24 * 60 * 60 * 1000);
      
      const activeConversations = conversations.filter(conv => 
        conv.lastActivity > cutoffTime || !conv.archived
      );
      
      await this.storage.set('observer.conversations.list', activeConversations);
      
      // Clean up old insights
      const insights = await this.storage.get<ObserverInsight[]>('observer.insights.list') || [];
      const recentInsights = insights
        .filter(insight => insight.timestamp > cutoffTime)
        .slice(0, 100);
      
      await this.storage.set('observer.insights.list', recentInsights);
      
      console.log('ObserverAgentService: Cleanup completed');
    } catch (error) {
      console.error('ObserverAgentService: Error during cleanup:', error);
    }
  }

  // Export data for backup
  async exportData(): Promise<{
    conversations: ObserverConversation[];
    insights: ObserverInsight[];
    governanceEvents: ObserverGovernanceEvent[];
    state: ObserverState;
    exportedAt: string;
  }> {
    if (!this.storage) throw new Error('Storage not available');

    try {
      const [conversations, insights, governanceEvents, state] = await Promise.all([
        this.getConversations(),
        this.storage.get<ObserverInsight[]>('observer.insights.list') || [],
        this.getGovernanceEvents(),
        this.getState()
      ]);

      return {
        conversations,
        insights,
        governanceEvents,
        state,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('ObserverAgentService: Error exporting data:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const observerAgentServiceUnified = new ObserverAgentServiceUnified();

// Export types
export type {
  ObserverMessage,
  ObserverInsight,
  ObserverConversation,
  ObserverGovernanceEvent,
  ObserverState
};

