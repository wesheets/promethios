/**
 * Storage Types for Dual-Wrapping System
 * 
 * This module defines types and interfaces for storing and managing
 * dual-wrapped agents in Firebase and other storage systems.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { DualAgentWrapper, DeploymentPackage, GovernanceConfiguration } from './dualWrapper';
import { GovernanceEngineState, AuditLogEntry } from './governance';

/**
 * Storage service interface for dual wrappers
 */
export interface DualWrapperStorage {
  // Wrapper CRUD operations
  createWrapper(wrapper: DualAgentWrapper): Promise<string>;
  getWrapper(wrapperId: string): Promise<DualAgentWrapper | null>;
  updateWrapper(wrapperId: string, updates: Partial<DualAgentWrapper>): Promise<void>;
  deleteWrapper(wrapperId: string): Promise<void>;
  
  // Query operations
  listWrappers(userId: string, filters?: WrapperStorageFilters): Promise<DualAgentWrapper[]>;
  searchWrappers(query: WrapperSearchQuery): Promise<WrapperSearchResult>;
  
  // Deployment package operations
  storePackage(wrapperId: string, packageData: DeploymentPackageData): Promise<string>;
  getPackage(packageId: string): Promise<DeploymentPackageData | null>;
  deletePackage(packageId: string): Promise<void>;
  
  // Governance state operations
  saveGovernanceState(agentId: string, state: GovernanceEngineState): Promise<void>;
  getGovernanceState(agentId: string): Promise<GovernanceEngineState | null>;
  
  // Audit log operations
  storeAuditLog(entry: AuditLogEntry): Promise<string>;
  queryAuditLogs(query: AuditLogStorageQuery): Promise<AuditLogEntry[]>;
  
  // Batch operations
  batchCreateWrappers(wrappers: DualAgentWrapper[]): Promise<string[]>;
  batchUpdateWrappers(updates: BatchWrapperUpdate[]): Promise<void>;
  
  // Storage management
  getStorageUsage(userId: string): Promise<StorageUsageInfo>;
  cleanupExpiredData(beforeDate: Date): Promise<CleanupResult>;
}

/**
 * Wrapper storage filters
 */
export interface WrapperStorageFilters {
  status?: 'active' | 'inactive' | 'error';
  provider?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  hasDeployment?: boolean;
  complianceLevel?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Wrapper search query
 */
export interface WrapperSearchQuery {
  userId: string;
  searchTerm?: string;
  filters?: WrapperStorageFilters;
  includeContent?: boolean;
  fuzzyMatch?: boolean;
}

/**
 * Wrapper search result
 */
export interface WrapperSearchResult {
  wrappers: DualAgentWrapper[];
  total: number;
  searchTime: number; // milliseconds
  suggestions?: string[];
}

/**
 * Deployment package data for storage
 */
export interface DeploymentPackageData {
  id: string;
  wrapperId: string;
  packageInfo: DeploymentPackage['packageInfo'];
  binaryData: Buffer | Uint8Array;
  metadata: DeploymentPackage['metadata'];
  validation: DeploymentPackage['validation'];
}

/**
 * Audit log storage query
 */
export interface AuditLogStorageQuery {
  agentIds?: string[];
  userIds?: string[];
  types?: string[];
  severities?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Batch wrapper update operation
 */
export interface BatchWrapperUpdate {
  wrapperId: string;
  updates: Partial<DualAgentWrapper>;
}

/**
 * Storage usage information
 */
export interface StorageUsageInfo {
  userId: string;
  totalWrappers: number;
  totalPackages: number;
  totalAuditLogs: number;
  storageUsed: number; // bytes
  storageLimit: number; // bytes
  breakdown: {
    wrappers: number;
    packages: number;
    auditLogs: number;
    governance: number;
  };
  lastCalculated: Date;
}

/**
 * Cleanup operation result
 */
export interface CleanupResult {
  wrappersDeleted: number;
  packagesDeleted: number;
  auditLogsDeleted: number;
  spaceFreed: number; // bytes
  errors: string[];
  duration: number; // milliseconds
}

/**
 * Firebase-specific storage paths
 */
export interface FirebaseStoragePaths {
  wrappers: (userId: string) => string;
  wrapper: (userId: string, wrapperId: string) => string;
  packages: (userId: string) => string;
  package: (userId: string, packageId: string) => string;
  governanceStates: (userId: string) => string;
  governanceState: (userId: string, agentId: string) => string;
  auditLogs: (userId: string) => string;
  auditLog: (userId: string, logId: string) => string;
  userMetadata: (userId: string) => string;
}

/**
 * Storage configuration
 */
export interface StorageConfiguration {
  provider: 'firebase' | 'local' | 'hybrid';
  firebase?: {
    projectId: string;
    databaseURL: string;
    storageBucket: string;
    collections: {
      wrappers: string;
      packages: string;
      governanceStates: string;
      auditLogs: string;
      userMetadata: string;
    };
  };
  local?: {
    dataDirectory: string;
    backupDirectory?: string;
    compression: boolean;
  };
  caching: {
    enabled: boolean;
    ttl: number; // seconds
    maxSize: number; // number of items
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number; // days
    destination: string;
  };
}

/**
 * Storage transaction interface
 */
export interface StorageTransaction {
  id: string;
  operations: StorageOperation[];
  status: 'pending' | 'committed' | 'rolled_back' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Individual storage operation
 */
export interface StorageOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data?: any;
  conditions?: Record<string, any>;
}

/**
 * Storage event for real-time updates
 */
export interface StorageEvent {
  type: 'created' | 'updated' | 'deleted';
  collection: string;
  documentId: string;
  userId: string;
  data?: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Storage event listener
 */
export interface StorageEventListener {
  id: string;
  userId: string;
  collections: string[];
  callback: (event: StorageEvent) => void;
  filters?: Record<string, any>;
  active: boolean;
}

/**
 * Storage migration interface
 */
export interface StorageMigration {
  version: string;
  description: string;
  up: (storage: DualWrapperStorage) => Promise<void>;
  down: (storage: DualWrapperStorage) => Promise<void>;
  validate: (storage: DualWrapperStorage) => Promise<boolean>;
}

/**
 * Storage health check result
 */
export interface StorageHealthCheck {
  healthy: boolean;
  latency: number; // milliseconds
  availability: number; // 0-1
  errors: string[];
  warnings: string[];
  lastChecked: Date;
  details: {
    firebase?: {
      connected: boolean;
      readLatency: number;
      writeLatency: number;
    };
    local?: {
      diskSpace: number; // bytes available
      permissions: boolean;
    };
    cache?: {
      hitRate: number; // 0-1
      size: number; // current items
    };
  };
}

/**
 * Storage metrics
 */
export interface StorageMetrics {
  operations: {
    reads: number;
    writes: number;
    deletes: number;
    errors: number;
  };
  performance: {
    averageReadTime: number;
    averageWriteTime: number;
    averageDeleteTime: number;
  };
  usage: {
    totalDocuments: number;
    totalSize: number; // bytes
    activeConnections: number;
  };
  cache: {
    hits: number;
    misses: number;
    evictions: number;
    hitRate: number; // 0-1
  };
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Storage backup information
 */
export interface StorageBackup {
  id: string;
  userId?: string; // null for full backup
  type: 'full' | 'incremental' | 'user';
  status: 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  size: number; // bytes
  location: string;
  checksum: string;
  metadata: {
    wrappersCount: number;
    packagesCount: number;
    auditLogsCount: number;
    version: string;
  };
  error?: string;
}

/**
 * Storage restore operation
 */
export interface StorageRestore {
  id: string;
  backupId: string;
  targetUserId?: string;
  status: 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  restoredItems: {
    wrappers: number;
    packages: number;
    auditLogs: number;
  };
  conflicts: StorageConflict[];
  error?: string;
}

/**
 * Storage conflict during restore
 */
export interface StorageConflict {
  type: 'wrapper' | 'package' | 'audit_log';
  id: string;
  resolution: 'skip' | 'overwrite' | 'merge' | 'rename';
  details: string;
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  userId: string;
  limits: {
    maxWrappers: number;
    maxPackages: number;
    maxStorageSize: number; // bytes
    maxAuditLogRetention: number; // days
  };
  current: {
    wrappers: number;
    packages: number;
    storageSize: number; // bytes
    oldestAuditLog?: Date;
  };
  warnings: {
    nearWrapperLimit: boolean;
    nearPackageLimit: boolean;
    nearStorageLimit: boolean;
    auditLogRetentionExceeded: boolean;
  };
}

/**
 * Storage service factory
 */
export interface StorageServiceFactory {
  createStorage(config: StorageConfiguration): Promise<DualWrapperStorage>;
  validateConfiguration(config: StorageConfiguration): Promise<ConfigValidationResult>;
  getDefaultConfiguration(): StorageConfiguration;
  getSupportedProviders(): string[];
  migrateStorage(from: DualWrapperStorage, to: DualWrapperStorage): Promise<StorageMigrationResult>;
}

/**
 * Storage migration result
 */
export interface StorageMigrationResult {
  success: boolean;
  itemsMigrated: {
    wrappers: number;
    packages: number;
    auditLogs: number;
    governanceStates: number;
  };
  errors: string[];
  warnings: string[];
  duration: number; // milliseconds
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export default {
  // Export all interfaces for easy importing
  DualWrapperStorage,
  WrapperStorageFilters,
  WrapperSearchQuery,
  WrapperSearchResult,
  DeploymentPackageData,
  AuditLogStorageQuery,
  BatchWrapperUpdate,
  StorageUsageInfo,
  CleanupResult,
  FirebaseStoragePaths,
  StorageConfiguration,
  StorageTransaction,
  StorageOperation,
  StorageEvent,
  StorageEventListener,
  StorageMigration,
  StorageHealthCheck,
  StorageMetrics,
  StorageBackup,
  StorageRestore,
  StorageConflict,
  StorageQuota,
  StorageServiceFactory,
  StorageMigrationResult,
  ConfigValidationResult
};

