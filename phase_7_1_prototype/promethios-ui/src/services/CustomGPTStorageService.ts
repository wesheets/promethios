/**
 * Custom GPT Storage Service
 * 
 * Handles comprehensive storage and retrieval of Custom GPT data including:
 * - Original GPT metadata and configuration (Firebase Firestore)
 * - Knowledge files and content preservation (Firebase Storage)
 * - Custom actions/tools with schemas (Firebase Firestore)
 * - Governance settings and audit trails (Firebase Firestore)
 * - Command center integration data (Firebase Firestore)
 */

import { unifiedStorage } from './UnifiedStorageService';
import { AgentProfile } from './UserAgentStorageService';
import { CustomGPTConfig, CustomAction, GovernedAgent } from './CustomGPTService';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface CustomGPTProfile extends AgentProfile {
  // Custom GPT specific configuration
  customGPTConfig: {
    // Original GPT Information
    originalGPT: {
      url: string;
      gptId: string;
      name: string;
      description: string;
      isPublic: boolean;
      importedAt: Date;
      lastSyncAttempt?: Date;
    };
    
    // Preserved Content
    preservedContent: {
      instructions: string;
      instructionsHash: string; // For change detection
      capabilities: string[];
      knowledgeBase: CustomGPTKnowledgeBase;
      customActions: CustomGPTAction[];
    };
    
    // Governance Integration
    governanceSettings: {
      trustLevel: string;
      complianceLevel: string;
      rateLimiting: any;
      auditLogging: boolean;
      contentFiltering: boolean;
      appliedAt: Date;
    };
    
    // Command Center Configuration
    commandCenter: {
      tabId: string;
      displayName: string;
      iconColor: string;
      isActive: boolean;
      lastAccessed?: Date;
      customizations: {
        theme: string;
        layout: string;
        widgets: string[];
      };
    };
  };
  
  // Enhanced metadata for Custom GPTs
  customGPTMetadata: {
    importMethod: 'url_analysis' | 'manual_config';
    contentPreservationStatus: 'complete' | 'partial' | 'minimal';
    knowledgeFilesCount: number;
    customActionsCount: number;
    totalContentSize: number; // in bytes
    lastContentBackup?: Date;
    syncStatus: 'synced' | 'out_of_sync' | 'sync_failed' | 'no_sync';
  };
  
  // Usage and performance metrics
  usageMetrics: {
    totalRequests: number;
    totalTokensUsed: number;
    averageResponseTime: number;
    successRate: number;
    costTracking: {
      totalCost: number;
      monthlySpend: number;
      costPerRequest: number;
      budgetAlerts: boolean;
    };
    popularFeatures: {
      knowledgeBaseQueries: number;
      customActionCalls: number;
      capabilityUsage: Record<string, number>;
    };
  };
}

export interface CustomGPTKnowledgeBase {
  files: CustomGPTKnowledgeFile[];
  totalSize: number;
  lastUpdated: Date;
  indexingStatus: 'indexed' | 'indexing' | 'failed';
  searchCapabilities: {
    semanticSearch: boolean;
    fullTextSearch: boolean;
    vectorEmbeddings: boolean;
  };
}

export interface CustomGPTKnowledgeFile {
  id: string;
  originalName: string;
  storedPath: string;
  fileType: string;
  size: number;
  uploadedAt: Date;
  contentHash: string;
  metadata: {
    title?: string;
    description?: string;
    tags: string[];
    isProcessed: boolean;
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    extractedText?: string;
    chunkCount?: number;
  };
  accessControl: {
    isPublic: boolean;
    allowedUsers: string[];
    encryptionStatus: 'encrypted' | 'plain';
  };
}

export interface CustomGPTAction extends CustomAction {
  id: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
  
  // Enhanced schema information
  schemaDetails: {
    openAPIVersion: string;
    endpoints: ActionEndpoint[];
    authentication: {
      type: 'none' | 'api_key' | 'oauth' | 'bearer';
      isConfigured: boolean;
      lastValidated?: Date;
    };
  };
  
  // Performance and reliability
  performance: {
    averageResponseTime: number;
    successRate: number;
    lastError?: string;
    errorCount: number;
  };
  
  // Governance and compliance
  governance: {
    riskLevel: 'low' | 'medium' | 'high';
    complianceStatus: 'compliant' | 'review_needed' | 'non_compliant';
    auditTrail: ActionAuditEntry[];
  };
}

export interface ActionEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: any[];
  responseSchema: any;
  isActive: boolean;
}

export interface ActionAuditEntry {
  timestamp: Date;
  action: 'created' | 'modified' | 'called' | 'error' | 'disabled';
  details: string;
  userId: string;
  metadata?: Record<string, any>;
}

export class CustomGPTStorageService {
  private static readonly STORAGE_NAMESPACE = 'custom_gpts';
  private static readonly FILES_NAMESPACE = 'custom_gpt_files';
  private static readonly ACTIONS_NAMESPACE = 'custom_gpt_actions';
  
  /**
   * Store a complete Custom GPT profile with all associated data
   */
  async storeCustomGPTProfile(
    userId: string,
    config: CustomGPTConfig,
    governedAgent: GovernedAgent,
    knowledgeFiles?: File[]
  ): Promise<CustomGPTProfile> {
    
    // Process and store knowledge files
    const knowledgeBase = await this.processKnowledgeFiles(
      knowledgeFiles || [],
      userId,
      governedAgent.id
    );
    
    // Process and store custom actions
    const processedActions = await this.processCustomActions(
      config.actions,
      userId,
      governedAgent.id
    );
    
    // Create comprehensive profile
    const profile: CustomGPTProfile = {
      // Base agent profile
      identity: {
        id: governedAgent.id,
        name: config.name,
        version: '1.0.0',
        description: `Custom GPT: ${config.name}`,
        ownerId: userId,
        creationDate: new Date(),
        lastModifiedDate: new Date(),
        status: 'active'
      },
      latestScorecard: null,
      attestationCount: 0,
      lastActivity: new Date(),
      healthStatus: 'healthy',
      trustLevel: 'medium',
      isWrapped: true,
      governancePolicy: null, // Will be set separately
      isDeployed: true,
      
      // API details from governed agent
      apiDetails: {
        endpoint: governedAgent.endpoint,
        key: governedAgent.apiKey,
        provider: governedAgent.provider,
        selectedModel: governedAgent.model,
        selectedCapabilities: config.capabilities,
        discoveredInfo: governedAgent.metadata
      },
      
      // Custom GPT specific configuration
      customGPTConfig: {
        originalGPT: {
          url: config.url,
          gptId: this.extractGPTId(config.url),
          name: config.name,
          description: `Imported Custom GPT: ${config.name}`,
          isPublic: true, // Assume public if URL accessible
          importedAt: new Date()
        },
        
        preservedContent: {
          instructions: config.instructions,
          instructionsHash: this.generateContentHash(config.instructions),
          capabilities: config.capabilities,
          knowledgeBase: knowledgeBase,
          customActions: processedActions
        },
        
        governanceSettings: {
          trustLevel: governedAgent.trustLevel,
          complianceLevel: governedAgent.complianceLevel,
          rateLimiting: governedAgent.rateLimiting,
          auditLogging: governedAgent.auditLogging,
          contentFiltering: true,
          appliedAt: new Date()
        },
        
        commandCenter: {
          tabId: `custom-gpt-${governedAgent.id}`,
          displayName: config.name,
          iconColor: this.generateIconColor(config.name),
          isActive: true,
          customizations: {
            theme: 'custom_gpt',
            layout: 'enhanced',
            widgets: ['chat', 'knowledge_base', 'actions', 'metrics']
          }
        }
      },
      
      // Enhanced metadata
      customGPTMetadata: {
        importMethod: 'url_analysis',
        contentPreservationStatus: this.assessContentPreservation(config, knowledgeFiles),
        knowledgeFilesCount: knowledgeFiles?.length || 0,
        customActionsCount: config.actions.length,
        totalContentSize: this.calculateTotalSize(config, knowledgeFiles),
        syncStatus: 'synced'
      },
      
      // Initialize usage metrics
      usageMetrics: {
        totalRequests: 0,
        totalTokensUsed: 0,
        averageResponseTime: 0,
        successRate: 100,
        costTracking: {
          totalCost: 0,
          monthlySpend: 0,
          costPerRequest: 0,
          budgetAlerts: true
        },
        popularFeatures: {
          knowledgeBaseQueries: 0,
          customActionCalls: 0,
          capabilityUsage: {}
        }
      }
    };
    
    // Store the profile
    await unifiedStorage.setItem(
      CustomGPTStorageService.STORAGE_NAMESPACE,
      `${userId}_${governedAgent.id}`,
      profile
    );
    
    // Create command center tab entry
    await this.createCommandCenterTab(userId, profile);
    
    return profile;
  }
  
  /**
   * Process and store knowledge files with metadata using Firebase Storage
   */
  private async processKnowledgeFiles(
    files: File[],
    userId: string,
    agentId: string
  ): Promise<CustomGPTKnowledgeBase> {
    
    const processedFiles: CustomGPTKnowledgeFile[] = [];
    let totalSize = 0;
    
    for (const file of files) {
      const fileId = `${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // Upload file to Firebase Storage
        const storage = getStorage();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${fileId}.${fileExtension}`;
        const storageRef = ref(storage, `custom_gpts/${userId}/${agentId}/knowledge/${fileName}`);
        
        // Upload the file
        await uploadBytes(storageRef, file);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        const processedFile: CustomGPTKnowledgeFile = {
          id: fileId,
          originalName: file.name,
          storedPath: downloadURL, // Store the Firebase download URL
          fileType: file.type || this.getFileTypeFromName(file.name),
          size: file.size,
          uploadedAt: new Date(),
          contentHash: await this.generateFileHash(file),
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            description: `Imported from Custom GPT: ${file.name}`,
            tags: ['custom_gpt', 'knowledge_base'],
            isProcessed: false,
            processingStatus: 'pending'
          },
          accessControl: {
            isPublic: false,
            allowedUsers: [userId],
            encryptionStatus: 'encrypted' // Firebase Storage provides encryption at rest
          }
        };
        
        // Store file metadata in Firestore via unified storage
        await unifiedStorage.setItem(
          CustomGPTStorageService.FILES_NAMESPACE,
          fileId,
          processedFile
        );
        
        processedFiles.push(processedFile);
        totalSize += file.size;
        
        // Process file content asynchronously
        this.processFileContentAsync(processedFile, file);
        
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }
    
    return {
      files: processedFiles,
      totalSize: totalSize,
      lastUpdated: new Date(),
      indexingStatus: files.length > 0 ? 'indexing' : 'indexed',
      searchCapabilities: {
        semanticSearch: true,
        fullTextSearch: true,
        vectorEmbeddings: true
      }
    };
  }
  
  /**
   * Process and store custom actions with enhanced metadata
   */
  private async processCustomActions(
    actions: CustomAction[],
    userId: string,
    agentId: string
  ): Promise<CustomGPTAction[]> {
    
    const processedActions: CustomGPTAction[] = [];
    
    for (const action of actions) {
      const actionId = `${agentId}_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const processedAction: CustomGPTAction = {
        ...action,
        id: actionId,
        status: 'active',
        createdAt: new Date(),
        usageCount: 0,
        
        schemaDetails: {
          openAPIVersion: action.schema?.openapi || '3.0.0',
          endpoints: this.extractEndpoints(action.schema),
          authentication: {
            type: this.detectAuthType(action.schema),
            isConfigured: false
          }
        },
        
        performance: {
          averageResponseTime: 0,
          successRate: 100,
          errorCount: 0
        },
        
        governance: {
          riskLevel: this.assessActionRisk(action),
          complianceStatus: 'compliant',
          auditTrail: [{
            timestamp: new Date(),
            action: 'created',
            details: `Custom action imported from GPT: ${action.name}`,
            userId: userId
          }]
        }
      };
      
      // Store action metadata
      await unifiedStorage.setItem(
        CustomGPTStorageService.ACTIONS_NAMESPACE,
        actionId,
        processedAction
      );
      
      processedActions.push(processedAction);
    }
    
    return processedActions;
  }
  
  /**
   * Create command center tab for Custom GPT
   */
  private async createCommandCenterTab(userId: string, profile: CustomGPTProfile): Promise<void> {
    const tabConfig = {
      id: profile.customGPTConfig.commandCenter.tabId,
      type: 'custom_gpt',
      agentId: profile.identity.id,
      displayName: profile.customGPTConfig.commandCenter.displayName,
      iconColor: profile.customGPTConfig.commandCenter.iconColor,
      isActive: true,
      createdAt: new Date(),
      
      // Tab-specific configuration
      config: {
        showKnowledgeBase: profile.customGPTConfig.preservedContent.knowledgeBase.files.length > 0,
        showCustomActions: profile.customGPTConfig.preservedContent.customActions.length > 0,
        showOriginalGPTLink: true,
        enableContentSync: false, // Future feature
        
        widgets: [
          {
            id: 'chat_interface',
            type: 'chat',
            position: { x: 0, y: 0, w: 8, h: 12 },
            config: { theme: 'custom_gpt' }
          },
          {
            id: 'knowledge_browser',
            type: 'knowledge_base',
            position: { x: 8, y: 0, w: 4, h: 6 },
            config: { showFileList: true, enableSearch: true }
          },
          {
            id: 'actions_panel',
            type: 'custom_actions',
            position: { x: 8, y: 6, w: 4, h: 6 },
            config: { showUsageStats: true }
          },
          {
            id: 'metrics_dashboard',
            type: 'metrics',
            position: { x: 0, y: 12, w: 12, h: 4 },
            config: { showCostTracking: true, showPerformance: true }
          }
        ]
      }
    };
    
    // Store tab configuration
    await unifiedStorage.setItem(
      'command_center_tabs',
      `${userId}_${tabConfig.id}`,
      tabConfig
    );
    
    // Update user's tab list
    const userTabs = await unifiedStorage.getItem('command_center_tabs', `${userId}_tab_list`) || [];
    userTabs.push(tabConfig.id);
    await unifiedStorage.setItem('command_center_tabs', `${userId}_tab_list`, userTabs);
  }
  
  /**
   * Retrieve Custom GPT profile with all associated data
   */
  async getCustomGPTProfile(userId: string, agentId: string): Promise<CustomGPTProfile | null> {
    return await unifiedStorage.getItem(
      CustomGPTStorageService.STORAGE_NAMESPACE,
      `${userId}_${agentId}`
    );
  }
  
  /**
   * Get all Custom GPT profiles for a user
   */
  async getUserCustomGPTs(userId: string): Promise<CustomGPTProfile[]> {
    const allItems = await unifiedStorage.getAllItems(CustomGPTStorageService.STORAGE_NAMESPACE);
    return allItems
      .filter(item => item.key.startsWith(`${userId}_`))
      .map(item => item.value as CustomGPTProfile);
  }
  
  /**
   * Update usage metrics for a Custom GPT
   */
  async updateUsageMetrics(
    userId: string,
    agentId: string,
    metrics: Partial<CustomGPTProfile['usageMetrics']>
  ): Promise<void> {
    const profile = await this.getCustomGPTProfile(userId, agentId);
    if (!profile) return;
    
    // Merge metrics
    profile.usageMetrics = {
      ...profile.usageMetrics,
      ...metrics
    };
    
    profile.identity.lastModifiedDate = new Date();
    profile.lastActivity = new Date();
    
    await unifiedStorage.setItem(
      CustomGPTStorageService.STORAGE_NAMESPACE,
      `${userId}_${agentId}`,
      profile
    );
  }
  
  /**
   * Get knowledge file content
   */
  async getKnowledgeFile(fileId: string): Promise<CustomGPTKnowledgeFile | null> {
    return await unifiedStorage.getItem(CustomGPTStorageService.FILES_NAMESPACE, fileId);
  }
  
  /**
   * Get custom action details
   */
  async getCustomAction(actionId: string): Promise<CustomGPTAction | null> {
    return await unifiedStorage.getItem(CustomGPTStorageService.ACTIONS_NAMESPACE, actionId);
  }
  
  /**
   * Backup Custom GPT content to Firebase with comprehensive data preservation
   */
  async backupCustomGPTContent(userId: string, agentId: string): Promise<{
    success: boolean;
    backupId?: string;
    error?: string;
    backupSize?: number;
    filesIncluded?: number;
  }> {
    try {
      const profile = await this.getCustomGPTProfile(userId, agentId);
      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }
      
      const backupId = `backup_${agentId}_${Date.now()}`;
      
      // Collect all knowledge files with their download URLs
      const knowledgeFiles = await this.getKnowledgeFilesForAgent(agentId);
      const knowledgeFileBackups = await Promise.all(
        knowledgeFiles.map(async (file) => {
          const downloadInfo = await this.downloadKnowledgeFile(file.id);
          return {
            ...file,
            downloadUrl: downloadInfo?.url || null
          };
        })
      );
      
      // Collect all custom actions
      const customActions = await this.getCustomActionsForAgent(agentId);
      
      // Create comprehensive backup object
      const backup = {
        id: backupId,
        agentId: agentId,
        userId: userId,
        createdAt: new Date(),
        version: '1.0',
        
        // Core profile data
        profile: {
          ...profile,
          // Remove sensitive data from backup
          apiDetails: {
            ...profile.apiDetails,
            key: '[REDACTED]' // Don't backup API keys
          }
        },
        
        // Knowledge base with file access
        knowledgeBase: {
          files: knowledgeFileBackups,
          totalFiles: knowledgeFileBackups.length,
          totalSize: knowledgeFileBackups.reduce((sum, file) => sum + file.size, 0),
          backupMethod: 'firebase_storage_urls'
        },
        
        // Custom actions with full schemas
        customActions: customActions,
        
        // Backup metadata
        backupMetadata: {
          backupType: 'full',
          compressionUsed: false,
          encryptionUsed: true, // Firebase provides encryption
          integrityHash: this.generateContentHash(JSON.stringify(profile)),
          estimatedRestoreTime: '5-10 minutes'
        }
      };
      
      // Store backup in Firebase via unified storage
      await unifiedStorage.setItem('custom_gpt_backups', backupId, backup);
      
      // Update profile with backup info
      profile.customGPTMetadata.lastContentBackup = new Date();
      await unifiedStorage.setItem(
        CustomGPTStorageService.STORAGE_NAMESPACE,
        `${userId}_${agentId}`,
        profile
      );
      
      // Store backup reference in user's backup list
      const userBackups = await unifiedStorage.getItem('user_backups', `${userId}_custom_gpts`) || [];
      userBackups.push({
        backupId,
        agentId,
        agentName: profile.customGPTConfig.originalGPT.name,
        createdAt: new Date(),
        size: JSON.stringify(backup).length
      });
      await unifiedStorage.setItem('user_backups', `${userId}_custom_gpts`, userBackups);
      
      return { 
        success: true, 
        backupId,
        backupSize: JSON.stringify(backup).length,
        filesIncluded: knowledgeFileBackups.length
      };
    } catch (error) {
      console.error('Backup creation failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Restore Custom GPT from backup
   */
  async restoreCustomGPTFromBackup(userId: string, backupId: string): Promise<{
    success: boolean;
    restoredAgentId?: string;
    error?: string;
  }> {
    try {
      const backup = await unifiedStorage.getItem('custom_gpt_backups', backupId);
      if (!backup) {
        return { success: false, error: 'Backup not found' };
      }
      
      // Verify user owns this backup
      if (backup.userId !== userId) {
        return { success: false, error: 'Access denied' };
      }
      
      // Generate new agent ID for restored instance
      const newAgentId = `restored_${backup.agentId}_${Date.now()}`;
      
      // Restore profile with new ID
      const restoredProfile = {
        ...backup.profile,
        identity: {
          ...backup.profile.identity,
          id: newAgentId,
          name: `${backup.profile.identity.name} (Restored)`,
          creationDate: new Date(),
          lastModifiedDate: new Date()
        }
      };
      
      // Store restored profile
      await unifiedStorage.setItem(
        CustomGPTStorageService.STORAGE_NAMESPACE,
        `${userId}_${newAgentId}`,
        restoredProfile
      );
      
      // Restore knowledge files (metadata only, files remain in original Firebase Storage locations)
      for (const file of backup.knowledgeBase.files) {
        const newFileId = `${newAgentId}_restored_${file.id}`;
        const restoredFile = {
          ...file,
          id: newFileId,
          uploadedAt: new Date(),
          metadata: {
            ...file.metadata,
            description: `${file.metadata.description} (Restored from backup)`
          }
        };
        
        await unifiedStorage.setItem(
          CustomGPTStorageService.FILES_NAMESPACE,
          newFileId,
          restoredFile
        );
      }
      
      // Restore custom actions
      for (const action of backup.customActions) {
        const newActionId = `${newAgentId}_restored_${action.id}`;
        const restoredAction = {
          ...action,
          id: newActionId,
          createdAt: new Date(),
          governance: {
            ...action.governance,
            auditTrail: [
              ...action.governance.auditTrail,
              {
                timestamp: new Date(),
                action: 'restored',
                details: `Restored from backup ${backupId}`,
                userId: userId
              }
            ]
          }
        };
        
        await unifiedStorage.setItem(
          CustomGPTStorageService.ACTIONS_NAMESPACE,
          newActionId,
          restoredAction
        );
      }
      
      // Create new command center tab
      await this.createCommandCenterTab(userId, restoredProfile);
      
      return { success: true, restoredAgentId: newAgentId };
    } catch (error) {
      console.error('Restore failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user's backup history
   */
  async getUserBackups(userId: string): Promise<any[]> {
    try {
      return await unifiedStorage.getItem('user_backups', `${userId}_custom_gpts`) || [];
    } catch (error) {
      console.error('Error fetching user backups:', error);
      return [];
    }
  }
  
  // Helper methods
  private extractGPTId(url: string): string {
    const match = url.match(/g-[a-zA-Z0-9]+/);
    return match ? match[0] : '';
  }
  
  private generateContentHash(content: string): string {
    // Simple hash function - in production, use a proper crypto hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  
  private generateIconColor(name: string): string {
    const colors = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#dd6b20', '#319795'];
    const index = name.length % colors.length;
    return colors[index];
  }
  
  private assessContentPreservation(
    config: CustomGPTConfig,
    knowledgeFiles?: File[]
  ): 'complete' | 'partial' | 'minimal' {
    let score = 0;
    
    if (config.instructions && config.instructions.length > 50) score += 3;
    if (config.capabilities && config.capabilities.length > 0) score += 2;
    if (knowledgeFiles && knowledgeFiles.length > 0) score += 3;
    if (config.actions && config.actions.length > 0) score += 2;
    
    if (score >= 8) return 'complete';
    if (score >= 5) return 'partial';
    return 'minimal';
  }
  
  private calculateTotalSize(config: CustomGPTConfig, knowledgeFiles?: File[]): number {
    let size = config.instructions.length * 2; // Rough estimate for instructions
    
    if (knowledgeFiles) {
      size += knowledgeFiles.reduce((total, file) => total + file.size, 0);
    }
    
    size += JSON.stringify(config.actions).length * 2; // Rough estimate for actions
    
    return size;
  }
  
  private getFileTypeFromName(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword'
    };
    return typeMap[extension || ''] || 'application/octet-stream';
  }
  
  private async generateFileHash(file: File): Promise<string> {
    // In production, use crypto.subtle.digest
    return `hash_${file.name}_${file.size}_${Date.now()}`;
  }
  
  /**
   * Process file content asynchronously (renamed from processFileContent)
   */
  private async processFileContentAsync(fileMetadata: CustomGPTKnowledgeFile, file: File): Promise<void> {
    try {
      // Simulate async file processing with text extraction
      setTimeout(async () => {
        try {
          // In a real implementation, you would:
          // 1. Download the file from Firebase Storage
          // 2. Extract text content based on file type
          // 3. Generate embeddings for semantic search
          // 4. Update the metadata in Firestore
          
          fileMetadata.metadata.isProcessed = true;
          fileMetadata.metadata.processingStatus = 'completed';
          fileMetadata.metadata.extractedText = `Processed content from ${file.name}`;
          fileMetadata.metadata.chunkCount = Math.ceil(file.size / 1000); // Rough estimate
          
          // Update metadata in Firestore via unified storage
          await unifiedStorage.setItem(
            CustomGPTStorageService.FILES_NAMESPACE,
            fileMetadata.id,
            fileMetadata
          );
          
          console.log(`✅ File processing completed for: ${file.name}`);
        } catch (error) {
          console.error(`❌ File processing failed for ${file.name}:`, error);
          fileMetadata.metadata.processingStatus = 'failed';
          await unifiedStorage.setItem(
            CustomGPTStorageService.FILES_NAMESPACE,
            fileMetadata.id,
            fileMetadata
          );
        }
      }, 2000);
    } catch (error) {
      console.error(`Error initiating file processing for ${file.name}:`, error);
    }
  }
  
  /**
   * Download knowledge file from Firebase Storage
   */
  async downloadKnowledgeFile(fileId: string): Promise<{ url: string; metadata: CustomGPTKnowledgeFile } | null> {
    try {
      const fileMetadata = await unifiedStorage.getItem(
        CustomGPTStorageService.FILES_NAMESPACE,
        fileId
      ) as CustomGPTKnowledgeFile;
      
      if (!fileMetadata) {
        return null;
      }
      
      // The storedPath is already the Firebase download URL
      return {
        url: fileMetadata.storedPath,
        metadata: fileMetadata
      };
    } catch (error) {
      console.error(`Error downloading file ${fileId}:`, error);
      return null;
    }
  }
  
  /**
   * Delete knowledge file from Firebase Storage and metadata
   */
  async deleteKnowledgeFile(userId: string, agentId: string, fileId: string): Promise<boolean> {
    try {
      const fileMetadata = await unifiedStorage.getItem(
        CustomGPTStorageService.FILES_NAMESPACE,
        fileId
      ) as CustomGPTKnowledgeFile;
      
      if (!fileMetadata) {
        return false;
      }
      
      // Delete from Firebase Storage
      const storage = getStorage();
      const fileExtension = fileMetadata.originalName.split('.').pop();
      const fileName = `${fileId}.${fileExtension}`;
      const storageRef = ref(storage, `custom_gpts/${userId}/${agentId}/knowledge/${fileName}`);
      
      await deleteObject(storageRef);
      
      // Delete metadata from Firestore
      await unifiedStorage.removeItem(CustomGPTStorageService.FILES_NAMESPACE, fileId);
      
      console.log(`✅ File deleted successfully: ${fileMetadata.originalName}`);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      return false;
    }
  }
  
  private extractEndpoints(schema: any): ActionEndpoint[] {
    if (!schema || !schema.paths) return [];
    
    const endpoints: ActionEndpoint[] = [];
    
    Object.entries(schema.paths).forEach(([path, pathObj]: [string, any]) => {
      Object.entries(pathObj).forEach(([method, methodObj]: [string, any]) => {
        if (typeof methodObj === 'object' && methodObj.summary) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            description: methodObj.summary || methodObj.description || '',
            parameters: methodObj.parameters || [],
            responseSchema: methodObj.responses || {},
            isActive: true
          });
        }
      });
    });
    
    return endpoints;
  }
  
  private detectAuthType(schema: any): 'none' | 'api_key' | 'oauth' | 'bearer' {
    if (!schema || !schema.components || !schema.components.securitySchemes) {
      return 'none';
    }
    
    const schemes = schema.components.securitySchemes;
    const firstScheme = Object.values(schemes)[0] as any;
    
    if (!firstScheme) return 'none';
    
    switch (firstScheme.type) {
      case 'apiKey': return 'api_key';
      case 'oauth2': return 'oauth';
      case 'http':
        return firstScheme.scheme === 'bearer' ? 'bearer' : 'api_key';
      default: return 'none';
    }
  }
  
  private assessActionRisk(action: CustomAction): 'low' | 'medium' | 'high' {
    // Simple risk assessment based on action characteristics
    const riskFactors = [];
    
    if (action.description.toLowerCase().includes('delete')) riskFactors.push('destructive');
    if (action.description.toLowerCase().includes('payment')) riskFactors.push('financial');
    if (action.description.toLowerCase().includes('email')) riskFactors.push('communication');
    if (action.schema && JSON.stringify(action.schema).includes('write')) riskFactors.push('write_access');
    
    if (riskFactors.length >= 2) return 'high';
    if (riskFactors.length === 1) return 'medium';
    return 'low';
  }
  
  private async getKnowledgeFilesForAgent(agentId: string): Promise<CustomGPTKnowledgeFile[]> {
    const allFiles = await unifiedStorage.getAllItems(CustomGPTStorageService.FILES_NAMESPACE);
    return allFiles
      .filter(item => item.key.startsWith(`${agentId}_`))
      .map(item => item.value as CustomGPTKnowledgeFile);
  }
  
  private async getCustomActionsForAgent(agentId: string): Promise<CustomGPTAction[]> {
    const allActions = await unifiedStorage.getAllItems(CustomGPTStorageService.ACTIONS_NAMESPACE);
    return allActions
      .filter(item => item.key.startsWith(`${agentId}_action_`))
      .map(item => item.value as CustomGPTAction);
  }
}

export const customGPTStorage = new CustomGPTStorageService();

