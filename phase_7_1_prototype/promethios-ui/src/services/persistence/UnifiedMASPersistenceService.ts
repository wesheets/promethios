/**
 * Unified MAS Persistence Service
 * 
 * Integrates multiple storage backends (local, Firebase, enterprise)
 * with intelligent fallback, synchronization, and conflict resolution.
 */

import { 
  SavedMASConversation, 
  MASWorkflowTemplate, 
  MASAnalytics,
  MASConversationFilter,
  ConversationMessage,
  AuditLogShare
} from './MASPersistenceService';
import { firebaseMASPersistence, RealtimeSubscription } from './FirebaseMASPersistenceService';

export type StorageBackend = 'local' | 'firebase' | 'enterprise';

export interface StorageConfig {
  primaryBackend: StorageBackend;
  fallbackBackends: StorageBackend[];
  syncEnabled: boolean;
  conflictResolution: 'latest' | 'merge' | 'manual';
  offlineMode: boolean;
  encryptionEnabled: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  conflictsDetected: number;
  syncInProgress: boolean;
}

export interface ConversationConflict {
  conversationId: string;
  localVersion: SavedMASConversation;
  remoteVersion: SavedMASConversation;
  conflictType: 'content' | 'metadata' | 'structure';
  timestamp: Date;
}

export class UnifiedMASPersistenceService {
  private static instance: UnifiedMASPersistenceService;
  private config: StorageConfig;
  private syncStatus: SyncStatus;
  private pendingOperations: Map<string, any> = new Map();
  private conflicts: ConversationConflict[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      primaryBackend: 'firebase',
      fallbackBackends: ['local'],
      syncEnabled: true,
      conflictResolution: 'latest',
      offlineMode: false,
      encryptionEnabled: false
    };

    this.syncStatus = {
      isOnline: navigator.onLine,
      lastSync: null,
      pendingOperations: 0,
      conflictsDetected: 0,
      syncInProgress: false
    };

    this.initializeService();
  }

  public static getInstance(): UnifiedMASPersistenceService {
    if (!UnifiedMASPersistenceService.instance) {
      UnifiedMASPersistenceService.instance = new UnifiedMASPersistenceService();
    }
    return UnifiedMASPersistenceService.instance;
  }

  // ==================== INITIALIZATION ====================

  private initializeService(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
    });

    // Start periodic sync
    if (this.config.syncEnabled) {
      this.startPeriodicSync();
    }
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
        this.triggerSync();
      }
    }, 30000); // Sync every 30 seconds
  }

  // ==================== CONFIGURATION ====================

  updateConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.syncEnabled !== undefined) {
      if (newConfig.syncEnabled) {
        this.startPeriodicSync();
      } else if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    }
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // ==================== CONVERSATION MANAGEMENT ====================

  /**
   * Save conversation with unified storage
   */
  async saveConversation(conversation: SavedMASConversation): Promise<void> {
    const operationId = `save_${conversation.conversationId}_${Date.now()}`;
    
    try {
      // Always save to local storage first for immediate availability
      await this.saveToLocalStorage(conversation);

      if (this.syncStatus.isOnline) {
        // Try primary backend
        await this.saveToBackend(conversation, this.config.primaryBackend);
      } else {
        // Queue for later sync
        this.pendingOperations.set(operationId, {
          type: 'save_conversation',
          data: conversation,
          timestamp: new Date()
        });
        this.syncStatus.pendingOperations++;
      }

      console.log('Conversation saved via unified storage:', conversation.conversationId);
    } catch (error) {
      console.error('Error in unified save:', error);
      
      // Try fallback backends
      for (const backend of this.config.fallbackBackends) {
        try {
          await this.saveToBackend(conversation, backend);
          console.log(`Saved to fallback backend: ${backend}`);
          break;
        } catch (fallbackError) {
          console.error(`Fallback ${backend} failed:`, fallbackError);
        }
      }
    }
  }

  /**
   * Load conversation with unified storage
   */
  async loadConversation(conversationId: string): Promise<SavedMASConversation | null> {
    try {
      // Try primary backend first
      if (this.syncStatus.isOnline) {
        const conversation = await this.loadFromBackend(conversationId, this.config.primaryBackend);
        if (conversation) {
          // Cache locally
          await this.saveToLocalStorage(conversation);
          return conversation;
        }
      }

      // Try fallback backends
      for (const backend of this.config.fallbackBackends) {
        try {
          const conversation = await this.loadFromBackend(conversationId, backend);
          if (conversation) {
            return conversation;
          }
        } catch (error) {
          console.error(`Error loading from ${backend}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error('Error in unified load:', error);
      return null;
    }
  }

  /**
   * Get user conversations with unified storage
   */
  async getUserConversations(userId: string, filter?: MASConversationFilter): Promise<SavedMASConversation[]> {
    try {
      let conversations: SavedMASConversation[] = [];

      // Try primary backend first
      if (this.syncStatus.isOnline) {
        try {
          conversations = await this.getUserConversationsFromBackend(userId, this.config.primaryBackend, filter);
          
          // Cache locally
          for (const conversation of conversations) {
            await this.saveToLocalStorage(conversation);
          }
          
          return conversations;
        } catch (error) {
          console.error(`Error loading from primary backend:`, error);
        }
      }

      // Try fallback backends
      for (const backend of this.config.fallbackBackends) {
        try {
          conversations = await this.getUserConversationsFromBackend(userId, backend, filter);
          if (conversations.length > 0) {
            return conversations;
          }
        } catch (error) {
          console.error(`Error loading from ${backend}:`, error);
        }
      }

      return conversations;
    } catch (error) {
      console.error('Error in unified getUserConversations:', error);
      return [];
    }
  }

  /**
   * Update conversation metadata
   */
  async updateConversationMetadata(
    conversationId: string, 
    metadata: { name?: string; description?: string; tags?: string[] }
  ): Promise<void> {
    const operationId = `update_${conversationId}_${Date.now()}`;
    
    try {
      // Update local storage first
      const localConversation = await this.loadFromLocalStorage(conversationId);
      if (localConversation) {
        const updatedConversation = {
          ...localConversation,
          ...metadata,
          updatedAt: new Date()
        };
        await this.saveToLocalStorage(updatedConversation);
      }

      if (this.syncStatus.isOnline) {
        // Update primary backend
        await this.updateMetadataInBackend(conversationId, metadata, this.config.primaryBackend);
      } else {
        // Queue for later sync
        this.pendingOperations.set(operationId, {
          type: 'update_metadata',
          conversationId,
          data: metadata,
          timestamp: new Date()
        });
        this.syncStatus.pendingOperations++;
      }

      console.log('Conversation metadata updated via unified storage:', conversationId);
    } catch (error) {
      console.error('Error in unified update metadata:', error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const operationId = `delete_${conversationId}_${Date.now()}`;
    
    try {
      // Delete from local storage
      await this.deleteFromLocalStorage(conversationId);

      if (this.syncStatus.isOnline) {
        // Delete from primary backend
        await this.deleteFromBackend(conversationId, this.config.primaryBackend);
      } else {
        // Queue for later sync
        this.pendingOperations.set(operationId, {
          type: 'delete_conversation',
          conversationId,
          timestamp: new Date()
        });
        this.syncStatus.pendingOperations++;
      }

      console.log('Conversation deleted via unified storage:', conversationId);
    } catch (error) {
      console.error('Error in unified delete:', error);
      throw error;
    }
  }

  // ==================== BACKEND-SPECIFIC OPERATIONS ====================

  private async saveToBackend(conversation: SavedMASConversation, backend: StorageBackend): Promise<void> {
    switch (backend) {
      case 'firebase':
        await firebaseMASPersistence.saveConversation(conversation);
        break;
      case 'local':
        await this.saveToLocalStorage(conversation);
        break;
      case 'enterprise':
        await this.saveToEnterpriseStorage(conversation);
        break;
      default:
        throw new Error(`Unknown backend: ${backend}`);
    }
  }

  private async loadFromBackend(conversationId: string, backend: StorageBackend): Promise<SavedMASConversation | null> {
    switch (backend) {
      case 'firebase':
        return await firebaseMASPersistence.loadConversation(conversationId);
      case 'local':
        return await this.loadFromLocalStorage(conversationId);
      case 'enterprise':
        return await this.loadFromEnterpriseStorage(conversationId);
      default:
        throw new Error(`Unknown backend: ${backend}`);
    }
  }

  private async getUserConversationsFromBackend(
    userId: string, 
    backend: StorageBackend, 
    filter?: MASConversationFilter
  ): Promise<SavedMASConversation[]> {
    switch (backend) {
      case 'firebase':
        return await firebaseMASPersistence.getUserConversations(userId, filter);
      case 'local':
        return await this.getUserConversationsFromLocalStorage(userId, filter);
      case 'enterprise':
        return await this.getUserConversationsFromEnterpriseStorage(userId, filter);
      default:
        throw new Error(`Unknown backend: ${backend}`);
    }
  }

  private async updateMetadataInBackend(
    conversationId: string, 
    metadata: any, 
    backend: StorageBackend
  ): Promise<void> {
    switch (backend) {
      case 'firebase':
        await firebaseMASPersistence.updateConversationMetadata(conversationId, metadata);
        break;
      case 'local':
        // Local storage update handled in main method
        break;
      case 'enterprise':
        await this.updateMetadataInEnterpriseStorage(conversationId, metadata);
        break;
      default:
        throw new Error(`Unknown backend: ${backend}`);
    }
  }

  private async deleteFromBackend(conversationId: string, backend: StorageBackend): Promise<void> {
    switch (backend) {
      case 'firebase':
        await firebaseMASPersistence.deleteConversation(conversationId);
        break;
      case 'local':
        await this.deleteFromLocalStorage(conversationId);
        break;
      case 'enterprise':
        await this.deleteFromEnterpriseStorage(conversationId);
        break;
      default:
        throw new Error(`Unknown backend: ${backend}`);
    }
  }

  // ==================== LOCAL STORAGE OPERATIONS ====================

  private async saveToLocalStorage(conversation: SavedMASConversation): Promise<void> {
    try {
      const key = `mas_conversation_${conversation.conversationId}`;
      const data = JSON.stringify({
        ...conversation,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString()
      });
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      throw error;
    }
  }

  private async loadFromLocalStorage(conversationId: string): Promise<SavedMASConversation | null> {
    try {
      const key = `mas_conversation_${conversationId}`;
      const data = localStorage.getItem(key);
      
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt)
      };
    } catch (error) {
      console.error('Error loading from local storage:', error);
      return null;
    }
  }

  private async getUserConversationsFromLocalStorage(
    userId: string, 
    filter?: MASConversationFilter
  ): Promise<SavedMASConversation[]> {
    try {
      const conversations: SavedMASConversation[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mas_conversation_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.userId === userId) {
                conversations.push({
                  ...parsed,
                  createdAt: new Date(parsed.createdAt),
                  updatedAt: new Date(parsed.updatedAt)
                });
              }
            } catch (parseError) {
              console.error('Error parsing conversation from local storage:', parseError);
            }
          }
        }
      }

      // Sort by updated date (most recent first)
      conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      // Apply filter if provided
      if (filter?.limit) {
        return conversations.slice(0, filter.limit);
      }

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations from local storage:', error);
      return [];
    }
  }

  private async deleteFromLocalStorage(conversationId: string): Promise<void> {
    try {
      const key = `mas_conversation_${conversationId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting from local storage:', error);
      throw error;
    }
  }

  // ==================== ENTERPRISE STORAGE OPERATIONS ====================

  private async saveToEnterpriseStorage(conversation: SavedMASConversation): Promise<void> {
    // Placeholder for enterprise storage integration
    // This would integrate with systems like:
    // - Microsoft SharePoint
    // - Google Workspace
    // - AWS S3 with enterprise controls
    // - Custom enterprise APIs
    
    console.log('Enterprise storage save not implemented yet:', conversation.conversationId);
    throw new Error('Enterprise storage not configured');
  }

  private async loadFromEnterpriseStorage(conversationId: string): Promise<SavedMASConversation | null> {
    console.log('Enterprise storage load not implemented yet:', conversationId);
    throw new Error('Enterprise storage not configured');
  }

  private async getUserConversationsFromEnterpriseStorage(
    userId: string, 
    filter?: MASConversationFilter
  ): Promise<SavedMASConversation[]> {
    console.log('Enterprise storage getUserConversations not implemented yet:', userId);
    throw new Error('Enterprise storage not configured');
  }

  private async updateMetadataInEnterpriseStorage(
    conversationId: string, 
    metadata: any
  ): Promise<void> {
    console.log('Enterprise storage updateMetadata not implemented yet:', conversationId);
    throw new Error('Enterprise storage not configured');
  }

  private async deleteFromEnterpriseStorage(conversationId: string): Promise<void> {
    console.log('Enterprise storage delete not implemented yet:', conversationId);
    throw new Error('Enterprise storage not configured');
  }

  // ==================== SYNCHRONIZATION ====================

  /**
   * Trigger manual sync
   */
  async triggerSync(): Promise<void> {
    if (this.syncStatus.syncInProgress || !this.syncStatus.isOnline) {
      return;
    }

    this.syncStatus.syncInProgress = true;

    try {
      console.log('Starting sync...');
      
      // Process pending operations
      await this.processPendingOperations();
      
      // Detect and resolve conflicts
      await this.detectAndResolveConflicts();
      
      this.syncStatus.lastSync = new Date();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  private async processPendingOperations(): Promise<void> {
    const operations = Array.from(this.pendingOperations.entries());
    
    for (const [operationId, operation] of operations) {
      try {
        switch (operation.type) {
          case 'save_conversation':
            await this.saveToBackend(operation.data, this.config.primaryBackend);
            break;
          case 'update_metadata':
            await this.updateMetadataInBackend(
              operation.conversationId, 
              operation.data, 
              this.config.primaryBackend
            );
            break;
          case 'delete_conversation':
            await this.deleteFromBackend(operation.conversationId, this.config.primaryBackend);
            break;
        }
        
        this.pendingOperations.delete(operationId);
        this.syncStatus.pendingOperations--;
      } catch (error) {
        console.error(`Error processing operation ${operationId}:`, error);
      }
    }
  }

  private async detectAndResolveConflicts(): Promise<void> {
    // Simplified conflict detection
    // In a real implementation, this would compare timestamps and content hashes
    
    if (this.config.conflictResolution === 'latest') {
      // Automatically resolve conflicts by keeping the latest version
      this.conflicts = [];
      this.syncStatus.conflictsDetected = 0;
    }
  }

  /**
   * Get pending conflicts
   */
  getConflicts(): ConversationConflict[] {
    return [...this.conflicts];
  }

  /**
   * Resolve conflict manually
   */
  async resolveConflict(
    conversationId: string, 
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<void> {
    const conflictIndex = this.conflicts.findIndex(c => c.conversationId === conversationId);
    
    if (conflictIndex === -1) {
      throw new Error('Conflict not found');
    }

    const conflict = this.conflicts[conflictIndex];
    let resolvedConversation: SavedMASConversation;

    switch (resolution) {
      case 'local':
        resolvedConversation = conflict.localVersion;
        break;
      case 'remote':
        resolvedConversation = conflict.remoteVersion;
        break;
      case 'merge':
        resolvedConversation = this.mergeConversations(conflict.localVersion, conflict.remoteVersion);
        break;
      default:
        throw new Error('Invalid resolution type');
    }

    // Save resolved version
    await this.saveConversation(resolvedConversation);
    
    // Remove conflict
    this.conflicts.splice(conflictIndex, 1);
    this.syncStatus.conflictsDetected--;
  }

  private mergeConversations(
    local: SavedMASConversation, 
    remote: SavedMASConversation
  ): SavedMASConversation {
    // Simplified merge logic
    // In a real implementation, this would be more sophisticated
    
    return {
      ...remote,
      name: local.name || remote.name,
      description: local.description || remote.description,
      tags: Array.from(new Set([...local.tags, ...remote.tags])),
      messages: [...local.messages, ...remote.messages]
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      updatedAt: new Date()
    };
  }

  // ==================== WORKFLOW TEMPLATES ====================

  async saveWorkflowTemplate(template: MASWorkflowTemplate): Promise<void> {
    try {
      if (this.syncStatus.isOnline) {
        await firebaseMASPersistence.saveWorkflowTemplate(template);
      }
      // Also save locally for offline access
      await this.saveTemplateToLocalStorage(template);
    } catch (error) {
      console.error('Error saving workflow template:', error);
      throw error;
    }
  }

  async getWorkflowTemplates(filter?: { category?: string; difficulty?: string }): Promise<MASWorkflowTemplate[]> {
    try {
      if (this.syncStatus.isOnline) {
        const templates = await firebaseMASPersistence.getWorkflowTemplates(filter);
        // Cache locally
        for (const template of templates) {
          await this.saveTemplateToLocalStorage(template);
        }
        return templates;
      } else {
        return await this.getTemplatesFromLocalStorage(filter);
      }
    } catch (error) {
      console.error('Error getting workflow templates:', error);
      return [];
    }
  }

  private async saveTemplateToLocalStorage(template: MASWorkflowTemplate): Promise<void> {
    try {
      const key = `mas_template_${template.templateId}`;
      const data = JSON.stringify({
        ...template,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      });
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Error saving template to local storage:', error);
    }
  }

  private async getTemplatesFromLocalStorage(filter?: { category?: string; difficulty?: string }): Promise<MASWorkflowTemplate[]> {
    try {
      const templates: MASWorkflowTemplate[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mas_template_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              
              // Apply filter
              if (filter?.category && parsed.category !== filter.category) continue;
              if (filter?.difficulty && parsed.difficulty !== filter.difficulty) continue;
              
              templates.push({
                ...parsed,
                createdAt: new Date(parsed.createdAt),
                updatedAt: new Date(parsed.updatedAt)
              });
            } catch (parseError) {
              console.error('Error parsing template from local storage:', parseError);
            }
          }
        }
      }

      return templates.sort((a, b) => b.usageStats.timesUsed - a.usageStats.timesUsed);
    } catch (error) {
      console.error('Error getting templates from local storage:', error);
      return [];
    }
  }

  // ==================== ANALYTICS ====================

  async getMASAnalytics(userId: string): Promise<MASAnalytics | null> {
    try {
      if (this.syncStatus.isOnline) {
        return await firebaseMASPersistence.getMASAnalytics(userId);
      } else {
        return await this.getAnalyticsFromLocalStorage(userId);
      }
    } catch (error) {
      console.error('Error getting MAS analytics:', error);
      return null;
    }
  }

  private async getAnalyticsFromLocalStorage(userId: string): Promise<MASAnalytics | null> {
    try {
      const key = `mas_analytics_${userId}`;
      const data = localStorage.getItem(key);
      
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      return {
        ...parsed,
        lastUpdated: new Date(parsed.lastUpdated)
      };
    } catch (error) {
      console.error('Error getting analytics from local storage:', error);
      return null;
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  subscribeToConversation(
    conversationId: string, 
    callback: (conversation: SavedMASConversation | null) => void
  ): RealtimeSubscription {
    if (this.syncStatus.isOnline && this.config.primaryBackend === 'firebase') {
      return firebaseMASPersistence.subscribeToConversation(conversationId, callback);
    } else {
      // Fallback to polling for local storage
      const interval = setInterval(async () => {
        const conversation = await this.loadFromLocalStorage(conversationId);
        callback(conversation);
      }, 5000);

      return {
        unsubscribe: () => clearInterval(interval)
      };
    }
  }

  subscribeToAnalytics(
    userId: string, 
    callback: (analytics: MASAnalytics | null) => void
  ): RealtimeSubscription {
    if (this.syncStatus.isOnline && this.config.primaryBackend === 'firebase') {
      return firebaseMASPersistence.subscribeToAnalytics(userId, callback);
    } else {
      // Fallback to polling for local storage
      const interval = setInterval(async () => {
        const analytics = await this.getAnalyticsFromLocalStorage(userId);
        callback(analytics);
      }, 10000);

      return {
        unsubscribe: () => clearInterval(interval)
      };
    }
  }

  // ==================== CLEANUP ====================

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // Unsubscribe from all subscriptions
    this.pendingOperations.clear();
    this.conflicts = [];
  }
}

// Export singleton instance
export const unifiedMASPersistence = UnifiedMASPersistenceService.getInstance();

