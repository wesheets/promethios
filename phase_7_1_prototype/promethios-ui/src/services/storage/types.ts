/**
 * Storage System Types
 * Core type definitions for the unified storage system
 */

// Storage Provider Interface
export interface StorageProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, policy?: StoragePolicy): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
  subscribe?(key: string, callback: (value: any) => void): () => void;
}

// Storage Policy Configuration
export interface StoragePolicy {
  // Provider constraints
  allowedProviders?: string[];
  forbiddenProviders?: string[];
  
  // Sync behavior
  syncStrategy?: 'immediate' | 'batched' | 'never';
  conflictResolution?: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  
  // Security
  encryption?: 'none' | 'at-rest' | 'in-transit' | 'both';
  
  // Lifecycle
  ttl?: number; // Time to live in milliseconds
  
  // Compliance
  gdprCategory?: 'essential' | 'functional' | 'analytics' | 'marketing';
  retentionPeriod?: number; // In milliseconds
  
  // Performance
  cacheStrategy?: 'memory' | 'persistent' | 'hybrid';
  compressionEnabled?: boolean;
}

// Namespace Configuration
export interface NamespaceConfig {
  provider: string;
  fallback?: string;
  defaultPolicy?: StoragePolicy;
}

// Storage Configuration
export interface StorageConfig {
  defaultProvider: string;
  providers: Record<string, { enabled: boolean; config?: any }>;
  namespaces: Record<string, NamespaceConfig>;
}

// Storage Events
export interface StorageEvent {
  type: 'set' | 'delete' | 'clear' | 'sync' | 'error';
  key?: string;
  namespace?: string;
  provider?: string;
  timestamp: number;
  data?: any;
  error?: Error;
}

// Storage Metrics
export interface StorageMetrics {
  totalKeys: number;
  totalSize: number;
  providerHealth: Record<string, 'healthy' | 'degraded' | 'failed'>;
  namespaceUsage: Record<string, { keys: number; size: number }>;
  lastSync: Record<string, number>;
  errors: string[];
}

// Storage Operation Result
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  provider?: string;
  fromCache?: boolean;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

