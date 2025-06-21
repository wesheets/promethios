// Unified Storage System Types
// Core type definitions for the storage system

export interface StorageProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: StorageOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

export interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
  encrypt?: boolean;
  namespace?: string;
  metadata?: Record<string, any>;
}

export interface StoragePolicy {
  provider: 'localStorage' | 'memory' | 'firebase';
  fallback?: 'localStorage' | 'memory' | 'firebase';
  ttl?: number;
  encrypt?: boolean;
  sync?: 'immediate' | 'batched' | 'manual';
  conflictResolution?: 'client-wins' | 'server-wins' | 'merge';
  retention?: string; // e.g., '1y', '30d', '7y'
  compliance?: string[]; // e.g., ['GDPR', 'HIPAA', 'SOX']
}

export interface StorageNamespace {
  name: string;
  policy: StoragePolicy;
  description?: string;
  schema?: Record<string, any>;
}

export interface StorageEvent {
  type: 'set' | 'delete' | 'clear' | 'sync' | 'error';
  namespace: string;
  key?: string;
  value?: any;
  timestamp: number;
  provider: string;
  metadata?: Record<string, any>;
}

export interface StorageMetrics {
  provider: string;
  namespace: string;
  operations: {
    reads: number;
    writes: number;
    deletes: number;
    errors: number;
  };
  performance: {
    avgReadTime: number;
    avgWriteTime: number;
    avgDeleteTime: number;
  };
  storage: {
    totalKeys: number;
    totalSize: number;
    lastSync?: number;
  };
}

export interface StorageConfig {
  namespaces: Record<string, StorageNamespace>;
  providers: {
    localStorage: {
      enabled: boolean;
      maxSize?: number;
    };
    memory: {
      enabled: boolean;
      maxSize?: number;
      cleanupInterval?: number;
    };
    firebase: {
      enabled: boolean;
      config?: any;
      retryAttempts?: number;
    };
  };
  monitoring: {
    enabled: boolean;
    metricsInterval?: number;
    errorReporting?: boolean;
  };
}

