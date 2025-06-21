import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '../context/StorageContext';
import { StoragePolicy } from '../services/storage/types';

/**
 * Hook for managing a single storage value with automatic synchronization
 */
export function useStorageValue<T>(
  key: string,
  defaultValue: T,
  policy?: StoragePolicy
): [T, (value: T) => Promise<void>, boolean, string | null] {
  const { storage } = useStorage();
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial value
  useEffect(() => {
    if (!storage) return;

    const loadValue = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const storedValue = await storage.get<T>(key);
        if (storedValue !== null) {
          setValue(storedValue);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load value');
        console.error(`useStorageValue: Error loading ${key}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [storage, key]);

  // Subscribe to changes
  useEffect(() => {
    if (!storage) return;

    const subscriptionId = storage.subscribe(key, (newValue) => {
      if (newValue !== null) {
        setValue(newValue);
      } else {
        setValue(defaultValue);
      }
    });

    return () => {
      storage.unsubscribe(subscriptionId);
    };
  }, [storage, key, defaultValue]);

  // Update function
  const updateValue = useCallback(async (newValue: T) => {
    if (!storage) {
      throw new Error('Storage not available');
    }

    try {
      setError(null);
      const success = await storage.set(key, newValue, policy);
      if (!success) {
        throw new Error('Failed to save value');
      }
      setValue(newValue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save value';
      setError(errorMessage);
      console.error(`useStorageValue: Error saving ${key}:`, err);
      throw err;
    }
  }, [storage, key, policy]);

  return [value, updateValue, loading, error];
}

/**
 * Hook for managing storage state with optimistic updates
 */
export function useOptimisticStorage<T>(
  key: string,
  defaultValue: T,
  policy?: StoragePolicy
): [T, (value: T) => void, boolean, string | null, () => Promise<void>] {
  const { storage } = useStorage();
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<T[]>([]);

  // Load initial value
  useEffect(() => {
    if (!storage) return;

    const loadValue = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const storedValue = await storage.get<T>(key);
        if (storedValue !== null) {
          setValue(storedValue);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load value');
        console.error(`useOptimisticStorage: Error loading ${key}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [storage, key]);

  // Subscribe to changes
  useEffect(() => {
    if (!storage) return;

    const subscriptionId = storage.subscribe(key, (newValue) => {
      if (newValue !== null) {
        setValue(newValue);
        // Clear pending updates when server confirms
        setPendingUpdates([]);
      }
    });

    return () => {
      storage.unsubscribe(subscriptionId);
    };
  }, [storage, key]);

  // Optimistic update function
  const updateValue = useCallback((newValue: T) => {
    // Immediately update UI
    setValue(newValue);
    
    // Queue for background sync
    setPendingUpdates(prev => [...prev, newValue]);
    
    // Attempt to sync in background
    if (storage) {
      storage.set(key, newValue, policy).catch(err => {
        console.error(`useOptimisticStorage: Background sync failed for ${key}:`, err);
        setError(err instanceof Error ? err.message : 'Sync failed');
      });
    }
  }, [storage, key, policy]);

  // Force sync function
  const forceSync = useCallback(async () => {
    if (!storage || pendingUpdates.length === 0) return;

    try {
      setError(null);
      const latestValue = pendingUpdates[pendingUpdates.length - 1];
      const success = await storage.set(key, latestValue, policy);
      
      if (success) {
        setPendingUpdates([]);
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      console.error(`useOptimisticStorage: Force sync failed for ${key}:`, err);
      throw err;
    }
  }, [storage, key, policy, pendingUpdates]);

  return [value, updateValue, loading, error, forceSync];
}

/**
 * Hook for managing a list of items in storage
 */
export function useStorageList<T>(
  key: string,
  defaultValue: T[] = [],
  policy?: StoragePolicy
): {
  items: T[];
  addItem: (item: T) => Promise<void>;
  removeItem: (index: number) => Promise<void>;
  updateItem: (index: number, item: T) => Promise<void>;
  clearItems: () => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const [items, setItems, loading, error] = useStorageValue<T[]>(key, defaultValue, policy);

  const addItem = useCallback(async (item: T) => {
    const newItems = [...items, item];
    await setItems(newItems);
  }, [items, setItems]);

  const removeItem = useCallback(async (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    await setItems(newItems);
  }, [items, setItems]);

  const updateItem = useCallback(async (index: number, item: T) => {
    const newItems = [...items];
    newItems[index] = item;
    await setItems(newItems);
  }, [items, setItems]);

  const clearItems = useCallback(async () => {
    await setItems([]);
  }, [setItems]);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    clearItems,
    loading,
    error
  };
}

/**
 * Hook for managing storage with automatic persistence
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  policy?: StoragePolicy
): [T, React.Dispatch<React.SetStateAction<T>>, boolean, string | null] {
  const { storage } = useStorage();
  const [state, setState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial value
  useEffect(() => {
    if (!storage) return;

    const loadValue = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const storedValue = await storage.get<T>(key);
        if (storedValue !== null) {
          setState(storedValue);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load value');
        console.error(`usePersistedState: Error loading ${key}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [storage, key]);

  // Persist changes
  useEffect(() => {
    if (!storage || loading) return;

    const persistValue = async () => {
      try {
        setError(null);
        await storage.set(key, state, policy);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to persist value');
        console.error(`usePersistedState: Error persisting ${key}:`, err);
      }
    };

    persistValue();
  }, [storage, key, state, policy, loading]);

  return [state, setState, loading, error];
}

/**
 * Hook for storage health monitoring
 */
export function useStorageHealth() {
  const { storageHealth, storageInfo, refreshHealth } = useStorage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshHealth();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshHealth]);

  return {
    health: storageHealth,
    info: storageInfo,
    refresh,
    isRefreshing
  };
}

/**
 * Hook for namespace operations
 */
export function useStorageNamespace(namespace: string) {
  const { storage } = useStorage();
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNamespace = useCallback(async () => {
    if (!storage) return;

    try {
      setLoading(true);
      setError(null);
      
      const namespaceData = await storage.getNamespace(namespace);
      setData(namespaceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load namespace');
      console.error(`useStorageNamespace: Error loading ${namespace}:`, err);
    } finally {
      setLoading(false);
    }
  }, [storage, namespace]);

  const clearNamespace = useCallback(async () => {
    if (!storage) return;

    try {
      setError(null);
      await storage.clearNamespace(namespace);
      setData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear namespace');
      console.error(`useStorageNamespace: Error clearing ${namespace}:`, err);
      throw err;
    }
  }, [storage, namespace]);

  useEffect(() => {
    loadNamespace();
  }, [loadNamespace]);

  return {
    data,
    loading,
    error,
    reload: loadNamespace,
    clear: clearNamespace
  };
}

