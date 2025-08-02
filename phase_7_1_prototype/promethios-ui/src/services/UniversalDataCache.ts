/**
 * Universal Data Cache System
 * Provides intelligent caching for all Promethios UI pages to improve performance
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  version: string; // Cache version for invalidation
}

export class UniversalDataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxSize: 1000,
    version: '1.0.0'
  };

  private configs = new Map<string, CacheConfig>([
    // Agent data - cache longer since it changes less frequently
    ['agents', { ttl: 15 * 60 * 1000, maxSize: 500, version: '1.0.0' }], // Increased from 10min to 15min
    ['agent-scorecards', { ttl: 20 * 60 * 1000, maxSize: 200, version: '1.0.0' }], // Increased from 15min to 20min
    
    // Governance data - optimized cache times for better performance
    ['policies', { ttl: 10 * 60 * 1000, maxSize: 100, version: '1.0.0' }], // Increased from 5min to 10min
    ['violations', { ttl: 5 * 60 * 1000, maxSize: 100, version: '1.0.0' }], // Increased from 2min to 5min
    
    // Metrics - cache for better performance while maintaining reasonable freshness
    ['trust-metrics', { ttl: 3 * 60 * 1000, maxSize: 50, version: '1.0.0' }], // Increased from 1min to 3min
    ['dashboard-metrics', { ttl: 10 * 60 * 1000, maxSize: 10, version: '1.0.0' }], // Increased from 5min to 10min
    
    // Static data - cache longer
    ['system-health', { ttl: 30 * 1000, maxSize: 10, version: '1.0.0' }],
    ['user-preferences', { ttl: 30 * 60 * 1000, maxSize: 50, version: '1.0.0' }]
  ]);

  /**
   * Get data from cache if available and not expired
   */
  get<T>(key: string, category: string = 'default'): T | null {
    const fullKey = `${category}:${key}`;
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      console.log(`🔍 Cache miss: ${fullKey}`);
      return null;
    }

    const now = Date.now();
    const config = this.configs.get(category) || this.defaultConfig;
    
    // Check if expired or version mismatch
    if (now > entry.expiresAt || entry.version !== config.version) {
      console.log(`⏰ Cache expired: ${fullKey}`);
      this.cache.delete(fullKey);
      return null;
    }

    console.log(`✅ Cache hit: ${fullKey}`);
    return entry.data;
  }

  /**
   * Set data in cache with appropriate TTL
   */
  set<T>(key: string, data: T, category: string = 'default'): void {
    const fullKey = `${category}:${key}`;
    const config = this.configs.get(category) || this.defaultConfig;
    const now = Date.now();

    // Enforce max size by removing oldest entries
    if (this.cache.size >= config.maxSize) {
      this.evictOldest(category);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + config.ttl,
      version: config.version
    };

    this.cache.set(fullKey, entry);
    console.log(`💾 Cached: ${fullKey} (expires in ${config.ttl / 1000}s)`);
  }

  /**
   * Invalidate cache entries by category or specific key
   */
  invalidate(category?: string, key?: string): void {
    if (key && category) {
      const fullKey = `${category}:${key}`;
      this.cache.delete(fullKey);
      console.log(`🗑️ Invalidated: ${fullKey}`);
      return;
    }

    if (category) {
      const keysToDelete = Array.from(this.cache.keys()).filter(k => k.startsWith(`${category}:`));
      keysToDelete.forEach(k => this.cache.delete(k));
      console.log(`🗑️ Invalidated category: ${category} (${keysToDelete.length} entries)`);
      return;
    }

    // Clear all cache
    this.cache.clear();
    console.log(`🗑️ Cleared entire cache`);
  }

  /**
   * Get or set pattern - fetch data if not cached
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    category: string = 'default'
  ): Promise<T> {
    const cached = this.get<T>(key, category);
    if (cached !== null) {
      return cached;
    }

    console.log(`🔄 Fetching: ${category}:${key}`);
    const data = await fetcher();
    this.set(key, data, category);
    return data;
  }

  /**
   * Batch get multiple keys
   */
  getBatch<T>(keys: string[], category: string = 'default'): Map<string, T> {
    const results = new Map<string, T>();
    const hits: string[] = [];
    const misses: string[] = [];

    keys.forEach(key => {
      const data = this.get<T>(key, category);
      if (data !== null) {
        results.set(key, data);
        hits.push(key);
      } else {
        misses.push(key);
      }
    });

    console.log(`📊 Batch cache: ${hits.length} hits, ${misses.length} misses`);
    return results;
  }

  /**
   * Batch set multiple key-value pairs
   */
  setBatch<T>(entries: Map<string, T>, category: string = 'default'): void {
    entries.forEach((data, key) => {
      this.set(key, data, category);
    });
    console.log(`📦 Batch cached: ${entries.size} entries in ${category}`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    categoryCounts: Map<string, number>;
    memoryUsage: number;
  } {
    const categoryCounts = new Map<string, number>();
    
    this.cache.forEach((_, key) => {
      const category = key.split(':')[0];
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    return {
      totalEntries: this.cache.size,
      categoryCounts,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  /**
   * Evict oldest entries for a category
   */
  private evictOldest(category: string): void {
    const categoryEntries = Array.from(this.cache.entries())
      .filter(([key]) => key.startsWith(`${category}:`))
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    if (categoryEntries.length > 0) {
      const [oldestKey] = categoryEntries[0];
      this.cache.delete(oldestKey);
      console.log(`🗑️ Evicted oldest: ${oldestKey}`);
    }
  }

  /**
   * Preload data for better performance
   */
  async preload(preloadConfig: Array<{
    key: string;
    category: string;
    fetcher: () => Promise<any>;
  }>): Promise<void> {
    console.log(`🚀 Preloading ${preloadConfig.length} cache entries...`);
    
    const promises = preloadConfig.map(async ({ key, category, fetcher }) => {
      try {
        await this.getOrSet(key, fetcher, category);
      } catch (error) {
        console.error(`❌ Preload failed for ${category}:${key}:`, error);
      }
    });

    await Promise.all(promises);
    console.log(`✅ Preloading complete`);
  }
}

// Global cache instance
export const universalCache = new UniversalDataCache();

// Cache warming utilities
export const cacheWarmers = {
  /**
   * Warm cache with user-specific data
   */
  async warmUserCache(userId: string): Promise<void> {
    console.log(`🔥 Warming cache for user: ${userId}`);
    
    // This will be called when user logs in to preload their data
    await universalCache.preload([
      {
        key: userId,
        category: 'agents',
        fetcher: async () => {
          // Will be implemented with actual agent loading
          return [];
        }
      },
      {
        key: userId,
        category: 'policies',
        fetcher: async () => {
          // Will be implemented with actual policy loading
          return [];
        }
      }
    ]);
  },

  /**
   * Warm cache with system-wide data
   */
  async warmSystemCache(): Promise<void> {
    console.log(`🔥 Warming system cache...`);
    
    await universalCache.preload([
      {
        key: 'current',
        category: 'system-health',
        fetcher: async () => {
          return {
            status: 'operational',
            components: {
              governanceCore: true,
              trustMetrics: true,
              emotionalVeritas: true,
              eventBus: true,
              storage: true
            },
            lastCheck: new Date().toISOString()
          };
        }
      }
    ]);
  }
};

