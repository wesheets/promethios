import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UnifiedStorageService } from '../services/UnifiedStorageService';
import { StorageConfig, StoragePolicy } from '../services/storage/types';

// Default storage configuration
const defaultStorageConfig: StorageConfig = {
  defaultProvider: 'localStorage',
  providers: {
    localStorage: { enabled: true },
    memory: { enabled: true },
    firebase: { enabled: true }
  },
  namespaces: {
    // User authentication and profile data
    user: {
      provider: 'firebase',
      fallback: 'localStorage',
      defaultPolicy: {
        allowedProviders: ['firebase', 'localStorage'],
        encryption: 'at-rest',
        syncStrategy: 'immediate',
        gdprCategory: 'essential',
        retentionPeriod: 365 * 24 * 60 * 60 * 1000 // 1 year
      }
    },
    
    // Observer agent state and conversations
    observer: {
      provider: 'firebase',
      fallback: 'localStorage',
      defaultPolicy: {
        allowedProviders: ['firebase', 'localStorage'],
        syncStrategy: 'immediate',
        conflictResolution: 'server-wins',
        encryption: 'at-rest',
        retentionPeriod: 90 * 24 * 60 * 60 * 1000 // 90 days
      }
    },
    
    // Notification system data
    notifications: {
      provider: 'localStorage',
      fallback: 'memory',
      defaultPolicy: {
        allowedProviders: ['localStorage', 'firebase'],
        ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
        syncStrategy: 'batched',
        encryption: 'at-rest'
      }
    },
    
    // User preferences and UI settings
    preferences: {
      provider: 'localStorage',
      fallback: 'memory',
      defaultPolicy: {
        allowedProviders: ['localStorage', 'firebase'],
        syncStrategy: 'immediate',
        conflictResolution: 'client-wins',
        gdprCategory: 'functional'
      }
    },
    
    // Agent management data
    agents: {
      provider: 'firebase',
      fallback: 'localStorage',
      defaultPolicy: {
        allowedProviders: ['firebase', 'localStorage'],
        syncStrategy: 'immediate',
        conflictResolution: 'merge',
        encryption: 'at-rest'
      }
    },
    
    // Governance system data
    governance: {
      provider: 'firebase',
      fallback: 'localStorage',
      defaultPolicy: {
        allowedProviders: ['firebase'],
        forbiddenProviders: ['localStorage'],
        encryption: 'both',
        syncStrategy: 'immediate',
        retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years (compliance)
      }
    },
    
    // UI state and temporary data
    ui: {
      provider: 'localStorage',
      fallback: 'memory',
      defaultPolicy: {
        allowedProviders: ['localStorage', 'memory'],
        forbiddenProviders: ['firebase'],
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        syncStrategy: 'never'
      }
    },
    
    // Cache and temporary data
    cache: {
      provider: 'memory',
      fallback: 'localStorage',
      defaultPolicy: {
        allowedProviders: ['memory', 'localStorage'],
        forbiddenProviders: ['firebase'],
        ttl: 60 * 60 * 1000, // 1 hour
        syncStrategy: 'never'
      }
    }
  }
};

interface StorageContextType {
  storage: UnifiedStorageService | null;
  isHydrated: boolean;
  hydrationError: string | null;
  storageHealth: Record<string, boolean>;
  storageInfo: Record<string, any>;
  refreshHealth: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

interface StorageProviderProps {
  children: ReactNode;
  config?: StorageConfig;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({ 
  children, 
  config = defaultStorageConfig 
}) => {
  const [storage, setStorage] = useState<UnifiedStorageService | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [storageHealth, setStorageHealth] = useState<Record<string, boolean>>({});
  const [storageInfo, setStorageInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    initializeStorage();
    
    return () => {
      if (storage) {
        storage.destroy();
      }
    };
  }, []);

  const initializeStorage = async () => {
    try {
      console.log('StorageProvider: Initializing unified storage...');
      
      // Create storage service
      const storageService = new UnifiedStorageService(config);
      setStorage(storageService);
      
      // Hydrate critical namespaces
      await storageService.hydrate();
      
      // Get initial health and info
      const [health, info] = await Promise.all([
        storageService.getProviderHealth(),
        storageService.getStorageInfo()
      ]);
      
      setStorageHealth(health);
      setStorageInfo(info);
      setIsHydrated(true);
      
      console.log('StorageProvider: Initialization complete', { health, info });
    } catch (error) {
      console.error('StorageProvider: Initialization failed:', error);
      setHydrationError(error instanceof Error ? error.message : 'Unknown error');
      setIsHydrated(true); // Still mark as hydrated to prevent infinite loading
    }
  };

  const refreshHealth = async () => {
    if (!storage) return;
    
    try {
      const [health, info] = await Promise.all([
        storage.getProviderHealth(),
        storage.getStorageInfo()
      ]);
      
      setStorageHealth(health);
      setStorageInfo(info);
    } catch (error) {
      console.error('StorageProvider: Health refresh failed:', error);
    }
  };

  const contextValue: StorageContextType = {
    storage,
    isHydrated,
    hydrationError,
    storageHealth,
    storageInfo,
    refreshHealth
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};

// Convenience hooks for specific namespaces
export const useUserStorage = () => {
  const { storage } = useStorage();
  
  return {
    get: <T>(key: string) => storage?.get<T>(`user.${key}`),
    set: <T>(key: string, value: T, policy?: StoragePolicy) => 
      storage?.set(`user.${key}`, value, policy),
    delete: (key: string) => storage?.delete(`user.${key}`),
    subscribe: (key: string, callback: (value: any) => void) => 
      storage?.subscribe(`user.${key}`, callback),
    clear: () => storage?.clearNamespace('user')
  };
};

export const useObserverStorage = () => {
  const { storage } = useStorage();
  
  return {
    get: <T>(key: string) => storage?.get<T>(`observer.${key}`),
    set: <T>(key: string, value: T, policy?: StoragePolicy) => 
      storage?.set(`observer.${key}`, value, policy),
    delete: (key: string) => storage?.delete(`observer.${key}`),
    subscribe: (key: string, callback: (value: any) => void) => 
      storage?.subscribe(`observer.${key}`, callback),
    clear: () => storage?.clearNamespace('observer')
  };
};

export const useNotificationStorage = () => {
  const { storage } = useStorage();
  
  return {
    get: <T>(key: string) => storage?.get<T>(`notifications.${key}`),
    set: <T>(key: string, value: T, policy?: StoragePolicy) => 
      storage?.set(`notifications.${key}`, value, policy),
    delete: (key: string) => storage?.delete(`notifications.${key}`),
    subscribe: (key: string, callback: (value: any) => void) => 
      storage?.subscribe(`notifications.${key}`, callback),
    clear: () => storage?.clearNamespace('notifications')
  };
};

export const usePreferencesStorage = () => {
  const { storage } = useStorage();
  
  return {
    get: <T>(key: string) => storage?.get<T>(`preferences.${key}`),
    set: <T>(key: string, value: T, policy?: StoragePolicy) => 
      storage?.set(`preferences.${key}`, value, policy),
    delete: (key: string) => storage?.delete(`preferences.${key}`),
    subscribe: (key: string, callback: (value: any) => void) => 
      storage?.subscribe(`preferences.${key}`, callback),
    clear: () => storage?.clearNamespace('preferences')
  };
};

export const useAgentStorage = () => {
  const { storage } = useStorage();
  
  return {
    get: <T>(key: string) => storage?.get<T>(`agents.${key}`),
    set: <T>(key: string, value: T, policy?: StoragePolicy) => 
      storage?.set(`agents.${key}`, value, policy),
    delete: (key: string) => storage?.delete(`agents.${key}`),
    subscribe: (key: string, callback: (value: any) => void) => 
      storage?.subscribe(`agents.${key}`, callback),
    clear: () => storage?.clearNamespace('agents')
  };
};

export const useGovernanceStorage = () => {
  const { storage } = useStorage();
  
  return {
    get: <T>(key: string) => storage?.get<T>(`governance.${key}`),
    set: <T>(key: string, value: T, policy?: StoragePolicy) => 
      storage?.set(`governance.${key}`, value, policy),
    delete: (key: string) => storage?.delete(`governance.${key}`),
    subscribe: (key: string, callback: (value: any) => void) => 
      storage?.subscribe(`governance.${key}`, callback),
    clear: () => storage?.clearNamespace('governance')
  };
};

export const useUIStorage = () => {
  const { storage } = useStorage();
  
  return {
    get: <T>(key: string) => storage?.get<T>(`ui.${key}`),
    set: <T>(key: string, value: T, policy?: StoragePolicy) => 
      storage?.set(`ui.${key}`, value, policy),
    delete: (key: string) => storage?.delete(`ui.${key}`),
    subscribe: (key: string, callback: (value: any) => void) => 
      storage?.subscribe(`ui.${key}`, callback),
    clear: () => storage?.clearNamespace('ui')
  };
};

export const useCacheStorage = () => {
  const { storage } = useStorage();
  
  return {
    get: <T>(key: string) => storage?.get<T>(`cache.${key}`),
    set: <T>(key: string, value: T, policy?: StoragePolicy) => 
      storage?.set(`cache.${key}`, value, policy),
    delete: (key: string) => storage?.delete(`cache.${key}`),
    subscribe: (key: string, callback: (value: any) => void) => 
      storage?.subscribe(`cache.${key}`, callback),
    clear: () => storage?.clearNamespace('cache')
  };
};

