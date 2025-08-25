/**
 * Parallel Firebase Manager
 * Optimizes Firebase queries by batching and parallelizing requests
 */

import { universalCache } from './UniversalDataCache';

export interface FirebaseQuery {
  id: string;
  path: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BatchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache: boolean;
  duration: number;
}

export class ParallelFirebaseManager {
  private pendingQueries = new Map<string, Promise<any>>();
  private queryQueue: FirebaseQuery[] = [];
  private isProcessing = false;
  private maxConcurrent = 3; // Reduced from 5 to prevent Firebase throttling
  private batchSize = 6; // Reduced from 10 for faster processing

  /**
   * Execute multiple Firebase queries in parallel with caching
   */
  async batchQuery<T>(queries: FirebaseQuery[]): Promise<Map<string, BatchResult<T>>> {
    console.log(`🚀 ParallelFirebaseManager: Batching ${queries.length} queries`);
    const startTime = Date.now();
    const results = new Map<string, BatchResult<T>>();

    // Check cache first for all queries
    const cacheResults = this.checkCacheForQueries<T>(queries);
    cacheResults.forEach((result, id) => {
      results.set(id, result);
    });

    // Filter out cached queries
    const uncachedQueries = queries.filter(q => !results.has(q.id));
    
    if (uncachedQueries.length === 0) {
      console.log(`✅ All ${queries.length} queries served from cache`);
      return results;
    }

    console.log(`🔄 Fetching ${uncachedQueries.length} queries from Firebase (${cacheResults.size} from cache)`);

    // Simplified processing - execute in smaller chunks for better performance
    const chunks = this.chunkQueries(uncachedQueries, this.batchSize);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      smartLogger.smartLog(`⚡ Processing chunk ${i + 1}: ${chunk.length} queries`);
      const chunkResults = await this.executeQueriesInParallel<T>(chunk);
      chunkResults.forEach((result, id) => {
        results.set(id, result);
      });
      
      // Small delay between chunks to prevent Firebase rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Batch query complete: ${results.size} results in ${totalTime}ms`);
    
    return results;
  }

  /**
   * Chunk queries into smaller groups for better performance
   */
  private chunkQueries(queries: FirebaseQuery[], chunkSize: number): FirebaseQuery[][] {
    const chunks: FirebaseQuery[][] = [];
    for (let i = 0; i < queries.length; i += chunkSize) {
      chunks.push(queries.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Smart query deduplication - if same query is requested multiple times, return same promise
   */
  async smartQuery<T>(query: FirebaseQuery): Promise<BatchResult<T>> {
    const cacheKey = `${query.category}:${query.path}`;
    
    // Check if query is already pending
    if (this.pendingQueries.has(cacheKey)) {
      console.log(`⏳ Deduplicating query: ${cacheKey}`);
      const data = await this.pendingQueries.get(cacheKey);
      return {
        success: true,
        data,
        fromCache: false,
        duration: 0
      };
    }

    // Check cache first
    const cached = universalCache.get<T>(query.path, query.category);
    if (cached !== null) {
      return {
        success: true,
        data: cached,
        fromCache: true,
        duration: 0
      };
    }

    // Execute query and store promise for deduplication
    const queryPromise = this.executeFirebaseQuery<T>(query);
    this.pendingQueries.set(cacheKey, queryPromise);

    try {
      const result = await queryPromise;
      this.pendingQueries.delete(cacheKey);
      return result;
    } catch (error) {
      this.pendingQueries.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Preload critical data for faster page loads
   */
  async preloadCriticalData(userId: string): Promise<void> {
    smartLogger.smartLog(`🔥 Preloading critical data for user: ${userId}`);
    
    const criticalQueries: FirebaseQuery[] = [
      {
        id: 'user-agents',
        path: userId,
        category: 'agents',
        priority: 'high'
      },
      {
        id: 'user-policies',
        path: userId,
        category: 'policies',
        priority: 'high'
      },
      {
        id: 'system-health',
        path: 'current',
        category: 'system-health',
        priority: 'medium'
      },
      {
        id: 'trust-metrics',
        path: userId,
        category: 'trust-metrics',
        priority: 'medium'
      }
    ];

    await this.batchQuery(criticalQueries);
    console.log(`✅ Critical data preloaded for user: ${userId}`);
  }

  /**
   * Check cache for multiple queries
   */
  private checkCacheForQueries<T>(queries: FirebaseQuery[]): Map<string, BatchResult<T>> {
    const results = new Map<string, BatchResult<T>>();
    
    queries.forEach(query => {
      const cached = universalCache.get<T>(query.path, query.category);
      if (cached !== null) {
        results.set(query.id, {
          success: true,
          data: cached,
          fromCache: true,
          duration: 0
        });
      }
    });

    return results;
  }

  /**
   * Group queries by priority for optimal execution order
   */
  private groupQueriesByPriority(queries: FirebaseQuery[]): Map<string, FirebaseQuery[]> {
    const groups = new Map<string, FirebaseQuery[]>();
    
    queries.forEach(query => {
      const priority = query.priority;
      if (!groups.has(priority)) {
        groups.set(priority, []);
      }
      groups.get(priority)!.push(query);
    });

    // Return in priority order
    const orderedGroups = new Map<string, FirebaseQuery[]>();
    ['high', 'medium', 'low'].forEach(priority => {
      if (groups.has(priority)) {
        orderedGroups.set(priority, groups.get(priority)!);
      }
    });

    return orderedGroups;
  }

  /**
   * Execute queries in parallel with concurrency control
   */
  private async executeQueriesInParallel<T>(queries: FirebaseQuery[]): Promise<Map<string, BatchResult<T>>> {
    const results = new Map<string, BatchResult<T>>();
    
    // Process queries in chunks to respect concurrency limits
    for (let i = 0; i < queries.length; i += this.maxConcurrent) {
      const chunk = queries.slice(i, i + this.maxConcurrent);
      smartLogger.smartLog(`⚡ Processing chunk ${Math.floor(i / this.maxConcurrent) + 1}: ${chunk.length} queries`);
      
      const chunkPromises = chunk.map(async query => {
        try {
          const result = await this.executeFirebaseQuery<T>(query);
          return { query, result };
        } catch (error) {
          console.error(`❌ Query failed: ${query.id}`, error);
          return {
            query,
            result: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              fromCache: false,
              duration: 0
            } as BatchResult<T>
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      chunkResults.forEach(({ query, result }) => {
        results.set(query.id, result);
      });
    }

    return results;
  }

  /**
   * Execute a single Firebase query with timing and caching
   */
  private async executeFirebaseQuery<T>(query: FirebaseQuery): Promise<BatchResult<T>> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Executing Firebase query: ${query.category}:${query.path}`);
      
      // Simulate Firebase query - replace with actual Firebase calls
      const data = await this.simulateFirebaseQuery<T>(query);
      
      const duration = Date.now() - startTime;
      
      // Cache the result
      universalCache.set(query.path, data, query.category);
      
      console.log(`✅ Firebase query complete: ${query.id} (${duration}ms)`);
      
      return {
        success: true,
        data,
        fromCache: false,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Firebase query failed: ${query.id} (${duration}ms)`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fromCache: false,
        duration
      };
    }
  }

  /**
   * Simulate Firebase query - replace with actual Firebase implementation
   */
  private async simulateFirebaseQuery<T>(query: FirebaseQuery): Promise<T> {
    // Add realistic delay to simulate network latency
    const delay = Math.random() * 200 + 100; // 100-300ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Return mock data based on query category
    switch (query.category) {
      case 'agents':
        return [] as unknown as T; // Will be replaced with actual agent loading
      case 'policies':
        return [] as unknown as T; // Will be replaced with actual policy loading
      case 'trust-metrics':
        return { score: 85, dimensions: {} } as unknown as T;
      case 'system-health':
        return {
          status: 'operational',
          components: {
            governanceCore: true,
            trustMetrics: true,
            emotionalVeritas: true
          }
        } as unknown as T;
      default:
        return {} as unknown as T;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    pendingQueries: number;
    queuedQueries: number;
    cacheStats: any;
  } {
    return {
      pendingQueries: this.pendingQueries.size,
      queuedQueries: this.queryQueue.length,
      cacheStats: universalCache.getStats()
    };
  }

  /**
   * Clear all pending queries and cache
   */
  reset(): void {
    this.pendingQueries.clear();
    this.queryQueue = [];
    universalCache.invalidate();
    console.log(`🔄 ParallelFirebaseManager reset`);
  }
}

// Global instance
export const parallelFirebaseManager = new ParallelFirebaseManager();

