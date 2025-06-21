/**
 * Observer Agent Service with Unified Storage Integration
 * 
 * Enhanced service that integrates the existing Observer Agent with the unified storage system
 * for session persistence, chat history, and preferences management.
 */

import { observerAgentService } from './observerAgentService';
import { storageExtension } from '../extensions/StorageExtension';
import { unifiedStorage } from './UnifiedStorageService';

// Enhanced types for storage integration
interface StoredChatMessage {
  type: 'user' | 'agent';
  message: string;
  timestamp: number;
  sessionId: string;
}

interface StoredObserverSession {
  sessionId: string;
  userId: string;
  startTime: number;
  lastActivity: number;
  chatHistory: StoredChatMessage[];
  suggestions: any[];
  contextInsights: string[];
  preferences: {
    pulsingEnabled: boolean;
    autoExpand: boolean;
    notificationLevel: 'all' | 'important' | 'critical';
  };
}

interface ObserverMetrics {
  totalSessions: number;
  totalMessages: number;
  averageSessionLength: number;
  mostUsedFeatures: string[];
  userSatisfactionScore?: number;
}

class ObserverAgentServiceUnified {
  private currentSessionId: string = '';
  private userId: string = '';
  private isStorageReady: boolean = false;

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Wait for storage extension to be ready
      await storageExtension.initialize();
      this.isStorageReady = true;
      console.log('Observer Agent storage integration initialized');
    } catch (error) {
      console.error('Failed to initialize Observer Agent storage:', error);
      this.isStorageReady = false;
    }
  }

  async startSession(userId: string, userRole: string): Promise<string> {
    this.userId = userId;
    this.currentSessionId = `observer_session_${userId}_${Date.now()}`;

    // Initialize the original observer agent service
    await observerAgentService.initialize(userId, userRole);

    // Create new session in storage
    if (this.isStorageReady) {
      const session: StoredObserverSession = {
        sessionId: this.currentSessionId,
        userId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        chatHistory: [],
        suggestions: [],
        contextInsights: [],
        preferences: {
          pulsingEnabled: true,
          autoExpand: false,
          notificationLevel: 'important'
        }
      };

      try {
        await storageExtension.set('observer', `session_${this.currentSessionId}`, session);
        console.log('Observer session created in storage:', this.currentSessionId);
      } catch (error) {
        console.error('Failed to create observer session in storage:', error);
      }
    }

    return this.currentSessionId;
  }

  async sendMessage(message: string): Promise<any> {
    // Use the original service for OpenAI integration
    const response = await observerAgentService.sendMessage(message);

    // Store the conversation in unified storage
    if (this.isStorageReady && this.currentSessionId) {
      try {
        // Store user message
        await this.storeChatMessage({
          type: 'user',
          message,
          timestamp: Date.now(),
          sessionId: this.currentSessionId
        });

        // Store agent response
        await this.storeChatMessage({
          type: 'agent',
          message: response.responseText,
          timestamp: Date.now(),
          sessionId: this.currentSessionId
        });

        // Update session activity
        await this.updateSessionActivity();

      } catch (error) {
        console.error('Failed to store chat message:', error);
      }
    }

    return response;
  }

  private async storeChatMessage(message: StoredChatMessage): Promise<void> {
    if (!this.isStorageReady || !this.currentSessionId) return;

    try {
      // Get current session
      const session = await storageExtension.get<StoredObserverSession>(
        'observer', 
        `session_${this.currentSessionId}`
      );

      if (session) {
        // Add message to chat history
        session.chatHistory.push(message);
        session.lastActivity = Date.now();

        // Keep only last 100 messages to prevent storage bloat
        if (session.chatHistory.length > 100) {
          session.chatHistory = session.chatHistory.slice(-100);
        }

        // Update session in storage
        await storageExtension.set('observer', `session_${this.currentSessionId}`, session);
      }
    } catch (error) {
      console.error('Failed to store chat message:', error);
    }
  }

  private async updateSessionActivity(): Promise<void> {
    if (!this.isStorageReady || !this.currentSessionId) return;

    try {
      const session = await storageExtension.get<StoredObserverSession>(
        'observer', 
        `session_${this.currentSessionId}`
      );

      if (session) {
        session.lastActivity = Date.now();
        await storageExtension.set('observer', `session_${this.currentSessionId}`, session);
      }
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  async getChatHistory(): Promise<StoredChatMessage[]> {
    if (!this.isStorageReady || !this.currentSessionId) return [];

    try {
      const session = await storageExtension.get<StoredObserverSession>(
        'observer', 
        `session_${this.currentSessionId}`
      );

      return session?.chatHistory || [];
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return [];
    }
  }

  async getRecentSessions(limit: number = 10): Promise<StoredObserverSession[]> {
    if (!this.isStorageReady) return [];

    try {
      const keys = await unifiedStorage.keys('observer');
      const sessionKeys = keys.filter(key => key.startsWith('session_'));
      
      const sessions: StoredObserverSession[] = [];
      
      for (const key of sessionKeys.slice(0, limit)) {
        const session = await storageExtension.get<StoredObserverSession>('observer', key);
        if (session && session.userId === this.userId) {
          sessions.push(session);
        }
      }

      // Sort by last activity (most recent first)
      return sessions.sort((a, b) => b.lastActivity - a.lastActivity);
    } catch (error) {
      console.error('Failed to get recent sessions:', error);
      return [];
    }
  }

  async updatePreferences(preferences: Partial<StoredObserverSession['preferences']>): Promise<void> {
    if (!this.isStorageReady || !this.currentSessionId) return;

    try {
      const session = await storageExtension.get<StoredObserverSession>(
        'observer', 
        `session_${this.currentSessionId}`
      );

      if (session) {
        session.preferences = { ...session.preferences, ...preferences };
        await storageExtension.set('observer', `session_${this.currentSessionId}`, session);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }

  async getPreferences(): Promise<StoredObserverSession['preferences'] | null> {
    if (!this.isStorageReady || !this.currentSessionId) return null;

    try {
      const session = await storageExtension.get<StoredObserverSession>(
        'observer', 
        `session_${this.currentSessionId}`
      );

      return session?.preferences || null;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return null;
    }
  }

  async getObserverMetrics(): Promise<ObserverMetrics> {
    if (!this.isStorageReady) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        averageSessionLength: 0,
        mostUsedFeatures: []
      };
    }

    try {
      const keys = await unifiedStorage.keys('observer');
      const sessionKeys = keys.filter(key => key.startsWith('session_'));
      
      let totalMessages = 0;
      let totalSessionLength = 0;
      const sessions: StoredObserverSession[] = [];

      for (const key of sessionKeys) {
        const session = await storageExtension.get<StoredObserverSession>('observer', key);
        if (session && session.userId === this.userId) {
          sessions.push(session);
          totalMessages += session.chatHistory.length;
          totalSessionLength += (session.lastActivity - session.startTime);
        }
      }

      const averageSessionLength = sessions.length > 0 ? totalSessionLength / sessions.length : 0;

      return {
        totalSessions: sessions.length,
        totalMessages,
        averageSessionLength,
        mostUsedFeatures: ['chat', 'suggestions', 'governance_insights'] // Could be calculated from actual usage
      };
    } catch (error) {
      console.error('Failed to get observer metrics:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        averageSessionLength: 0,
        mostUsedFeatures: []
      };
    }
  }

  async clearOldSessions(olderThanDays: number = 30): Promise<number> {
    if (!this.isStorageReady) return 0;

    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      const keys = await unifiedStorage.keys('observer');
      const sessionKeys = keys.filter(key => key.startsWith('session_'));
      
      let deletedCount = 0;

      for (const key of sessionKeys) {
        const session = await storageExtension.get<StoredObserverSession>('observer', key);
        if (session && session.lastActivity < cutoffTime) {
          await storageExtension.delete('observer', key);
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old observer sessions`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to clear old sessions:', error);
      return 0;
    }
  }

  // Delegate other methods to the original service
  async getGovernanceMetrics() {
    return observerAgentService.getGovernanceMetrics();
  }

  async getSuggestions() {
    return observerAgentService.getSuggestions();
  }

  async getContextualHelp(context: string) {
    return observerAgentService.getContextualHelp(context);
  }

  addEventListener(listener: (event: any) => void) {
    return observerAgentService.addEventListener(listener);
  }

  getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  isStorageIntegrationReady(): boolean {
    return this.isStorageReady;
  }
}

// Export singleton instance
export const observerAgentServiceUnified = new ObserverAgentServiceUnified();

