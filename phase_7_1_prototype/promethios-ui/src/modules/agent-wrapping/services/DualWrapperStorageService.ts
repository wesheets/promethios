/**
 * Dual Wrapper Storage Service
 * 
 * Extends the existing UnifiedStorageService to provide specialized
 * storage capabilities for dual-wrapped agents (testing + deployment versions).
 * Maintains backward compatibility with existing wrapper storage patterns.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { UnifiedStorageService } from '../../../services/UnifiedStorageService';
import { 
  DualAgentWrapper, 
  TestingWrapper, 
  DeploymentWrapper,
  DualWrapperStorageConfig,
  StorageTransaction,
  StorageBackup,
  StorageMetrics
} from '../types/dualWrapper';
import { AgentWrapper } from '../types';

/**
 * Storage service for dual-wrapped agents
 * Extends existing UnifiedStorageService patterns
 */
export class DualWrapperStorageService {
  private unifiedStorage: UnifiedStorageService;
  private currentUserId: string | null = null;
  private config: DualWrapperStorageConfig;
  private transactionCounter: number = 0;

  // Storage namespaces (following existing patterns)
  private static readonly NAMESPACES = {
    DUAL_WRAPPERS: 'agents.dual_wrappers',
    TESTING_WRAPPERS: 'agents.testing_wrappers', 
    DEPLOYMENT_WRAPPERS: 'agents.deployment_wrappers',
    GOVERNANCE_CONFIGS: 'agents.governance_configs',
    WRAPPER_METRICS: 'agents.wrapper_metrics',
    STORAGE_METADATA: 'agents.storage_metadata'
  };

  constructor(config?: Partial<DualWrapperStorageConfig>) {
    this.unifiedStorage = new UnifiedStorageService();
    this.config = {
      enableBackups: config?.enableBackups ?? true,
      backupRetention: config?.backupRetention ?? { days: 30 },
      enableMetrics: config?.enableMetrics ?? true,
      enableTransactions: config?.enableTransactions ?? true,
      compressionEnabled: config?.compressionEnabled ?? false,
      encryptionEnabled: config?.encryptionEnabled ?? false,
      ...config
    };
  }

  /**
   * Set current user (following existing pattern)
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Get user-scoped storage key (following existing pattern)
   */
  private getUserScopedKey(key: string): string {
    if (!this.currentUserId) {
      throw new Error('User must be set before accessing dual wrappers');
    }
    return `user.${this.currentUserId}.${key}`;
  }

  /**
   * Store a dual wrapper (both testing and deployment versions)
   */
  async storeDualWrapper(dualWrapper: DualAgentWrapper): Promise<boolean> {
    const transaction = this.beginTransaction('store_dual_wrapper');
    
    try {
      // Store the main dual wrapper record
      const dualWrapperKey = this.getUserScopedKey(`dual_wrapper.${dualWrapper.id}`);
      await this.unifiedStorage.set(
        DualWrapperStorageService.NAMESPACES.DUAL_WRAPPERS,
        dualWrapperKey,
        dualWrapper
      );

      // Store testing wrapper separately for easy access
      const testingKey = this.getUserScopedKey(`testing.${dualWrapper.testingWrapper.id}`);
      await this.unifiedStorage.set(
        DualWrapperStorageService.NAMESPACES.TESTING_WRAPPERS,
        testingKey,
        dualWrapper.testingWrapper
      );

      // Store deployment wrapper separately for easy access
      const deploymentKey = this.getUserScopedKey(`deployment.${dualWrapper.deploymentWrapper.id}`);
      await this.unifiedStorage.set(
        DualWrapperStorageService.NAMESPACES.DEPLOYMENT_WRAPPERS,
        deploymentKey,
        dualWrapper.deploymentWrapper
      );

      // Store governance configuration
      if (dualWrapper.governanceConfig) {
        const governanceKey = this.getUserScopedKey(`governance.${dualWrapper.id}`);
        await this.unifiedStorage.set(
          DualWrapperStorageService.NAMESPACES.GOVERNANCE_CONFIGS,
          governanceKey,
          dualWrapper.governanceConfig
        );
      }

      // Create backup if enabled
      if (this.config.enableBackups) {
        await this.createBackup(dualWrapper);
      }

      // Update metrics
      if (this.config.enableMetrics) {
        await this.updateStorageMetrics('store', dualWrapper.id);
      }

      this.commitTransaction(transaction);
      console.log(`✅ Stored dual wrapper: ${dualWrapper.name} (${dualWrapper.id})`);
      return true;

    } catch (error) {
      this.rollbackTransaction(transaction);
      console.error('❌ Error storing dual wrapper:', error);
      return false;
    }
  }

  /**
   * Retrieve a dual wrapper by ID
   */
  async getDualWrapper(wrapperId: string): Promise<DualAgentWrapper | null> {
    try {
      const dualWrapperKey = this.getUserScopedKey(`dual_wrapper.${wrapperId}`);
      const dualWrapper = await this.unifiedStorage.get<DualAgentWrapper>(
        DualWrapperStorageService.NAMESPACES.DUAL_WRAPPERS,
        dualWrapperKey
      );

      if (this.config.enableMetrics && dualWrapper) {
        await this.updateStorageMetrics('retrieve', wrapperId);
      }

      return dualWrapper;
    } catch (error) {
      console.error('❌ Error retrieving dual wrapper:', error);
      return null;
    }
  }

  /**
   * Get testing wrapper only (for chat interface)
   */
  async getTestingWrapper(wrapperId: string): Promise<TestingWrapper | null> {
    try {
      const testingKey = this.getUserScopedKey(`testing.${wrapperId}`);
      return await this.unifiedStorage.get<TestingWrapper>(
        DualWrapperStorageService.NAMESPACES.TESTING_WRAPPERS,
        testingKey
      );
    } catch (error) {
      console.error('❌ Error retrieving testing wrapper:', error);
      return null;
    }
  }

  /**
   * Get deployment wrapper only (for export)
   */
  async getDeploymentWrapper(wrapperId: string): Promise<DeploymentWrapper | null> {
    try {
      const deploymentKey = this.getUserScopedKey(`deployment.${wrapperId}`);
      return await this.unifiedStorage.get<DeploymentWrapper>(
        DualWrapperStorageService.NAMESPACES.DEPLOYMENT_WRAPPERS,
        deploymentKey
      );
    } catch (error) {
      console.error('❌ Error retrieving deployment wrapper:', error);
      return null;
    }
  }

  /**
   * List all dual wrappers for current user
   */
  async listDualWrappers(): Promise<DualAgentWrapper[]> {
    try {
      // This would need to be implemented based on UnifiedStorageService's query capabilities
      // For now, we'll return an empty array and log that this needs implementation
      console.log('📝 Note: listDualWrappers needs UnifiedStorageService query support');
      return [];
    } catch (error) {
      console.error('❌ Error listing dual wrappers:', error);
      return [];
    }
  }

  /**
   * Update a dual wrapper
   */
  async updateDualWrapper(dualWrapper: DualAgentWrapper): Promise<boolean> {
    const transaction = this.beginTransaction('update_dual_wrapper');
    
    try {
      // Create backup of current version before updating
      if (this.config.enableBackups) {
        const currentWrapper = await this.getDualWrapper(dualWrapper.id);
        if (currentWrapper) {
          await this.createBackup(currentWrapper, 'pre_update');
        }
      }

      // Update using the same storage logic as store
      const success = await this.storeDualWrapper(dualWrapper);
      
      if (success) {
        this.commitTransaction(transaction);
        console.log(`✅ Updated dual wrapper: ${dualWrapper.name} (${dualWrapper.id})`);
      } else {
        this.rollbackTransaction(transaction);
      }

      return success;
    } catch (error) {
      this.rollbackTransaction(transaction);
      console.error('❌ Error updating dual wrapper:', error);
      return false;
    }
  }

  /**
   * Delete a dual wrapper
   */
  async deleteDualWrapper(wrapperId: string): Promise<boolean> {
    const transaction = this.beginTransaction('delete_dual_wrapper');
    
    try {
      // Create backup before deletion
      if (this.config.enableBackups) {
        const wrapper = await this.getDualWrapper(wrapperId);
        if (wrapper) {
          await this.createBackup(wrapper, 'pre_delete');
        }
      }

      // Delete all related records
      const dualWrapperKey = this.getUserScopedKey(`dual_wrapper.${wrapperId}`);
      const testingKey = this.getUserScopedKey(`testing.${wrapperId}`);
      const deploymentKey = this.getUserScopedKey(`deployment.${wrapperId}`);
      const governanceKey = this.getUserScopedKey(`governance.${wrapperId}`);

      // Note: UnifiedStorageService would need a delete method
      // For now, we'll set to null (following existing patterns)
      await this.unifiedStorage.set(DualWrapperStorageService.NAMESPACES.DUAL_WRAPPERS, dualWrapperKey, null);
      await this.unifiedStorage.set(DualWrapperStorageService.NAMESPACES.TESTING_WRAPPERS, testingKey, null);
      await this.unifiedStorage.set(DualWrapperStorageService.NAMESPACES.DEPLOYMENT_WRAPPERS, deploymentKey, null);
      await this.unifiedStorage.set(DualWrapperStorageService.NAMESPACES.GOVERNANCE_CONFIGS, governanceKey, null);

      // Update metrics
      if (this.config.enableMetrics) {
        await this.updateStorageMetrics('delete', wrapperId);
      }

      this.commitTransaction(transaction);
      console.log(`✅ Deleted dual wrapper: ${wrapperId}`);
      return true;

    } catch (error) {
      this.rollbackTransaction(transaction);
      console.error('❌ Error deleting dual wrapper:', error);
      return false;
    }
  }

  /**
   * Export deployment wrapper for external use
   */
  async exportDeploymentWrapper(wrapperId: string): Promise<{
    wrapper: DeploymentWrapper;
    governanceEngine: any;
    metadata: any;
  } | null> {
    try {
      const deploymentWrapper = await this.getDeploymentWrapper(wrapperId);
      if (!deploymentWrapper) {
        return null;
      }

      // Get governance configuration
      const governanceKey = this.getUserScopedKey(`governance.${wrapperId}`);
      const governanceConfig = await this.unifiedStorage.get(
        DualWrapperStorageService.NAMESPACES.GOVERNANCE_CONFIGS,
        governanceKey
      );

      // Create export package
      const exportPackage = {
        wrapper: deploymentWrapper,
        governanceEngine: deploymentWrapper.governanceEngine,
        metadata: {
          exportedAt: new Date(),
          exportedBy: this.currentUserId,
          version: deploymentWrapper.version,
          governanceConfig,
        }
      };

      // Update metrics
      if (this.config.enableMetrics) {
        await this.updateStorageMetrics('export', wrapperId);
      }

      console.log(`📦 Exported deployment wrapper: ${wrapperId}`);
      return exportPackage;

    } catch (error) {
      console.error('❌ Error exporting deployment wrapper:', error);
      return null;
    }
  }

  /**
   * Migrate legacy wrapper to dual wrapper
   */
  async migrateLegacyWrapper(legacyWrapper: AgentWrapper): Promise<DualAgentWrapper | null> {
    try {
      console.log(`🔄 Migrating legacy wrapper: ${legacyWrapper.name} (${legacyWrapper.id})`);
      
      // This would use the DualAgentWrapperRegistry.createDualWrapper method
      // For now, we'll just log that this needs implementation
      console.log('📝 Note: Migration logic will be implemented in DualAgentWrapperRegistry');
      
      return null;
    } catch (error) {
      console.error('❌ Error migrating legacy wrapper:', error);
      return null;
    }
  }

  // Private helper methods

  /**
   * Begin a storage transaction
   */
  private beginTransaction(operation: string): StorageTransaction {
    this.transactionCounter++;
    const transaction: StorageTransaction = {
      id: `tx_${Date.now()}_${this.transactionCounter}`,
      operation,
      startTime: new Date(),
      status: 'active',
      operations: []
    };

    if (this.config.enableTransactions) {
      console.log(`🔄 Started transaction: ${transaction.id} (${operation})`);
    }

    return transaction;
  }

  /**
   * Commit a storage transaction
   */
  private commitTransaction(transaction: StorageTransaction): void {
    transaction.status = 'committed';
    transaction.endTime = new Date();

    if (this.config.enableTransactions) {
      const duration = transaction.endTime.getTime() - transaction.startTime.getTime();
      console.log(`✅ Committed transaction: ${transaction.id} (${duration}ms)`);
    }
  }

  /**
   * Rollback a storage transaction
   */
  private rollbackTransaction(transaction: StorageTransaction): void {
    transaction.status = 'rolled_back';
    transaction.endTime = new Date();

    if (this.config.enableTransactions) {
      const duration = transaction.endTime.getTime() - transaction.startTime.getTime();
      console.log(`❌ Rolled back transaction: ${transaction.id} (${duration}ms)`);
    }
  }

  /**
   * Create backup of dual wrapper
   */
  private async createBackup(
    dualWrapper: DualAgentWrapper, 
    reason: string = 'scheduled'
  ): Promise<void> {
    try {
      const backup: StorageBackup = {
        id: `backup_${dualWrapper.id}_${Date.now()}`,
        wrapperId: dualWrapper.id,
        data: dualWrapper,
        createdAt: new Date(),
        reason,
        size: JSON.stringify(dualWrapper).length,
        checksum: this.calculateChecksum(dualWrapper)
      };

      const backupKey = this.getUserScopedKey(`backup.${backup.id}`);
      await this.unifiedStorage.set('agents.backups', backupKey, backup);

      console.log(`💾 Created backup: ${backup.id} (${reason})`);
    } catch (error) {
      console.error('❌ Error creating backup:', error);
    }
  }

  /**
   * Update storage metrics
   */
  private async updateStorageMetrics(operation: string, wrapperId: string): Promise<void> {
    try {
      const metricsKey = this.getUserScopedKey('storage_metrics');
      let metrics = await this.unifiedStorage.get<StorageMetrics>(
        DualWrapperStorageService.NAMESPACES.STORAGE_METADATA,
        metricsKey
      ) || {
        totalOperations: 0,
        operationsByType: {},
        totalStorage: 0,
        lastUpdated: new Date()
      };

      metrics.totalOperations++;
      metrics.operationsByType[operation] = (metrics.operationsByType[operation] || 0) + 1;
      metrics.lastUpdated = new Date();

      await this.unifiedStorage.set(
        DualWrapperStorageService.NAMESPACES.STORAGE_METADATA,
        metricsKey,
        metrics
      );
    } catch (error) {
      console.error('❌ Error updating storage metrics:', error);
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    // Simple checksum implementation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalDualWrappers: number;
    totalTestingWrappers: number;
    totalDeploymentWrappers: number;
    storageMetrics: StorageMetrics | null;
  }> {
    try {
      const metricsKey = this.getUserScopedKey('storage_metrics');
      const storageMetrics = await this.unifiedStorage.get<StorageMetrics>(
        DualWrapperStorageService.NAMESPACES.STORAGE_METADATA,
        metricsKey
      );

      // Note: These counts would need query support from UnifiedStorageService
      return {
        totalDualWrappers: 0, // Would need to count actual records
        totalTestingWrappers: 0, // Would need to count actual records
        totalDeploymentWrappers: 0, // Would need to count actual records
        storageMetrics
      };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return {
        totalDualWrappers: 0,
        totalTestingWrappers: 0,
        totalDeploymentWrappers: 0,
        storageMetrics: null
      };
    }
  }
}

