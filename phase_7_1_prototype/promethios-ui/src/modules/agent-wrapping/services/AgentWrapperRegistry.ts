import { UnifiedStorageService } from '../../../services/UnifiedStorageService';
import { AgentWrapper, WrapperMetrics } from '../types';

/**
 * Registry for managing agent wrappers with user-scoped data isolation
 * Now uses UnifiedStorageService instead of Firebase directly
 */
class AgentWrapperRegistry {
  private wrappers: Map<string, AgentWrapper> = new Map();
  private enabledWrappers: Set<string> = new Set();
  private metrics: Map<string, WrapperMetrics> = new Map();
  private storageService: UnifiedStorageService;
  private currentUserId: string | null = null;
  
  constructor() {
    this.storageService = new UnifiedStorageService();
  }

  /**
   * Set the current user ID for scoped storage
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Get user-scoped storage key
   */
  private getUserScopedKey(key: string): string {
    if (!this.currentUserId) {
      throw new Error('User must be set before accessing agent wrappers');
    }
    return `user.${this.currentUserId}.${key}`;
  }
  
  /**
   * Register an agent wrapper
   * @param wrapper The wrapper to register
   * @returns Whether the registration was successful
   */
  async registerWrapper(wrapper: AgentWrapper): Promise<boolean> {
    try {
      if (!this.currentUserId) {
        console.error('User must be set to register wrappers');
        return false;
      }
      
      // Check if wrapper already exists for this user
      if (this.wrappers.has(wrapper.id)) {
        console.warn(`Wrapper with ID ${wrapper.id} already exists for user ${this.currentUserId}`);
        return false;
      }
      
      // Add wrapper to registry
      this.wrappers.set(wrapper.id, wrapper);
      this.enabledWrappers.add(wrapper.id);
      this.metrics.set(wrapper.id, {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        averageResponseTime: 0
      });
      
      // Persist to unified storage under agents namespace
      await this.persistWrapper(wrapper);
      
      console.log(`Registered wrapper: ${wrapper.name} (${wrapper.id}) for user ${this.currentUserId}`);
      return true;
    } catch (error) {
      console.error('Error registering wrapper:', error);
      return false;
    }
  }
  
  /**
   * Deregister an agent wrapper
   * @param wrapperId The ID of the wrapper to deregister
   * @returns Whether the deregistration was successful
   */
  async deregisterWrapper(wrapperId: string): Promise<boolean> {
    try {
      // Check if wrapper exists
      if (!this.wrappers.has(wrapperId)) {
        console.warn(`Wrapper with ID ${wrapperId} does not exist`);
        return false;
      }
      
      // Remove wrapper from registry
      this.wrappers.delete(wrapperId);
      this.enabledWrappers.delete(wrapperId);
      this.metrics.delete(wrapperId);
      
      // Remove from unified storage
      await this.removeWrapper(wrapperId);
      
      console.log(`Deregistered wrapper: ${wrapperId}`);
      return true;
    } catch (error) {
      console.error('Error deregistering wrapper:', error);
      return false;
    }
  }
  
  /**
   * Get a wrapper by ID
   * @param wrapperId The ID of the wrapper to get
   * @returns The wrapper, or null if not found
   */
  getWrapper(wrapperId: string): AgentWrapper | null {
    return this.wrappers.get(wrapperId) || null;
  }
  
  /**
   * Get all registered wrappers
   * @returns Array of all registered wrappers
   */
  getAllWrappers(): AgentWrapper[] {
    return Array.from(this.wrappers.values());
  }
  
  /**
   * Enable a wrapper
   * @param wrapperId The ID of the wrapper to enable
   * @returns Whether the operation was successful
   */
  async enableWrapper(db: any, auth: any, wrapperId: string): Promise<boolean> {
    try {
      // Check if wrapper exists
      if (!this.wrappers.has(wrapperId)) {
        console.warn(`Wrapper with ID ${wrapperId} does not exist`);
        return false;
      }
      
      // Enable wrapper
      this.enabledWrappers.add(wrapperId);
      
      // Update in Firebase
      await this.updateWrapperStatus(db, auth, wrapperId, true);
      
      console.log(`Enabled wrapper: ${wrapperId}`);
      return true;
    } catch (error) {
      console.error('Error enabling wrapper:', error);
      return false;
    }
  }
  
  /**
   * Disable a wrapper
   * @param wrapperId The ID of the wrapper to disable
   * @returns Whether the operation was successful
   */
  async disableWrapper(db: any, auth: any, wrapperId: string): Promise<boolean> {
    try {
      // Check if wrapper exists
      if (!this.wrappers.has(wrapperId)) {
        console.warn(`Wrapper with ID ${wrapperId} does not exist`);
        return false;
      }
      
      // Disable wrapper
      this.enabledWrappers.delete(wrapperId);
      
      // Update in Firebase
      await this.updateWrapperStatus(db, auth, wrapperId, false);
      
      console.log(`Disabled wrapper: ${wrapperId}`);
      return true;
    } catch (error) {
      console.error('Error disabling wrapper:', error);
      return false;
    }
  }
  
  /**
   * Check if a wrapper is enabled
   * @param wrapperId The ID of the wrapper to check
   * @returns Whether the wrapper is enabled
   */
  isWrapperEnabled(wrapperId: string): boolean {
    return this.enabledWrappers.has(wrapperId);
  }
  
  /**
   * Get metrics for a wrapper
   * @param wrapperId The ID of the wrapper to get metrics for
   * @returns The metrics, or null if not found
   */
  getWrapperMetrics(wrapperId: string): WrapperMetrics | null {
    return this.metrics.get(wrapperId) || null;
  }
  
  /**
   * Update metrics for a wrapper
   * @param wrapperId The ID of the wrapper to update metrics for
   * @param metrics The new metrics
   */
  async updateWrapperMetrics(db: any, auth: any, wrapperId: string, metrics: Partial<WrapperMetrics>): Promise<boolean> {
    try {
      // Check if wrapper exists
      if (!this.wrappers.has(wrapperId)) {
        console.warn(`Wrapper with ID ${wrapperId} does not exist`);
        return false;
      }
      
      // Get current metrics
      const currentMetrics = this.metrics.get(wrapperId) || {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        averageResponseTime: 0
      };
      
      // Update metrics
      const updatedMetrics = {
        ...currentMetrics,
        ...metrics
      };
      
      this.metrics.set(wrapperId, updatedMetrics);
      
      // Update in Firebase
      await this.updateWrapperMetricsInFirebase(db, auth, wrapperId, updatedMetrics);
      
      return true;
    } catch (error) {
      console.error('Error updating wrapper metrics:', error);
      return false;
    }
  }
  
  /**
   * Load all wrappers from Firebase for the current user
   */
  async loadWrappers(db: any, auth: any): Promise<void> {
    try {
      const currentUser = this.getCurrentUser(auth);
      if (!currentUser) {
        console.warn('User must be authenticated to load wrappers');
        return;
      }
      
      const wrappersCollection = this.getUserWrappersCollection(db, currentUser.uid);
      const snapshot = await getDocs(wrappersCollection);
      
      // Clear existing data
      this.wrappers.clear();
      this.enabledWrappers.clear();
      this.metrics.clear();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Create wrapper instance
        const wrapper: AgentWrapper = {
          id: doc.id,
          name: data.name,
          description: data.description,
          version: data.version,
          supportedProviders: data.supportedProviders,
          inputSchema: data.inputSchema,
          outputSchema: data.outputSchema,
          wrap: async (request, context) => {
            // This is a stub - in a real implementation, this would call the actual wrapper function
            console.log(`Wrapping request for ${doc.id}`, request, context);
            return request;
          },
          unwrap: async (response, context) => {
            // This is a stub - in a real implementation, this would call the actual unwrapper function
            console.log(`Unwrapping response for ${doc.id}`, response, context);
            return response;
          },
          initialize: async () => {
            console.log(`Initializing wrapper ${doc.id}`);
            return true;
          },
          cleanup: async () => {
            console.log(`Cleaning up wrapper ${doc.id}`);
            return true;
          }
        };
        
        // Add to registry
        this.wrappers.set(doc.id, wrapper);
        
        // Set enabled status
        if (data.enabled) {
          this.enabledWrappers.add(doc.id);
        }
        
        // Set metrics
        this.metrics.set(doc.id, data.metrics || {
          requestCount: 0,
          successCount: 0,
          errorCount: 0,
          averageResponseTime: 0
        });
      });
      
      console.log(`Loaded ${this.wrappers.size} wrappers from Firebase for user ${currentUser.uid}`);
    } catch (error) {
      console.error('Error loading wrappers from Firebase:', error);
    }
  }
  
  /**
   * Persist a wrapper to Firebase under user's collection
   * @param userId The user ID
   * @param wrapper The wrapper to persist
   */
  private async persistWrapper(db: any, userId: string, wrapper: AgentWrapper): Promise<void> {
    try {
      const wrapperDoc = this.getUserWrapperDoc(db, userId, wrapper.id);
      
      await setDoc(wrapperDoc, {
        name: wrapper.name,
        description: wrapper.description,
        version: wrapper.version,
        supportedProviders: wrapper.supportedProviders,
        inputSchema: wrapper.inputSchema,
        outputSchema: wrapper.outputSchema,
        enabled: this.enabledWrappers.has(wrapper.id),
        metrics: this.metrics.get(wrapper.id) || {
          requestCount: 0,
          successCount: 0,
          errorCount: 0,
          averageResponseTime: 0
        },
        userId: userId, // Store user ID for additional security
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error persisting wrapper to Firebase:', error);
      throw error;
    }
  }
  
  /**
   * Remove a wrapper from Firebase for the current user
   * @param wrapperId The ID of the wrapper to remove
   */
  private async removeWrapper(db: any, auth: any, wrapperId: string): Promise<void> {
    try {
      const currentUser = this.getCurrentUser(auth);
      if (!currentUser) {
        throw new Error('User must be authenticated to remove wrappers');
      }
      
      const wrapperDoc = this.getUserWrapperDoc(db, currentUser.uid, wrapperId);
      await deleteDoc(wrapperDoc);
    } catch (error) {
      console.error('Error removing wrapper from Firebase:', error);
      throw error;
    }
  }
  
  /**
   * Update wrapper status in Firebase for the current user
   * @param wrapperId The ID of the wrapper to update
   * @param enabled Whether the wrapper is enabled
   */
  private async updateWrapperStatus(db: any, auth: any, wrapperId: string, enabled: boolean): Promise<void> {
    try {
      const currentUser = this.getCurrentUser(auth);
      if (!currentUser) {
        throw new Error('User must be authenticated to update wrappers');
      }
      
      const wrapperDoc = this.getUserWrapperDoc(db, currentUser.uid, wrapperId);
      await updateDoc(wrapperDoc, {
        enabled,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating wrapper status in Firebase:', error);
      throw error;
    }
  }
  
  /**
   * Update wrapper metrics in Firebase for the current user
   * @param wrapperId The ID of the wrapper to update
   * @param metrics The new metrics
   */
  private async updateWrapperMetricsInFirebase(db: any, auth: any, wrapperId: string, metrics: WrapperMetrics): Promise<void> {
    try {
      const currentUser = this.getCurrentUser(auth);
      if (!currentUser) {
        throw new Error('User must be authenticated to update wrapper metrics');
      }
      
      const wrapperDoc = this.getUserWrapperDoc(db, currentUser.uid, wrapperId);
      await updateDoc(wrapperDoc, {
        metrics,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating wrapper metrics in Firebase:', error);
      throw error;
    }
  }

  /**
   * Persist wrapper to unified storage
   */
  private async persistWrapper(wrapper: AgentWrapper): Promise<void> {
    const key = this.getUserScopedKey(`wrappers.${wrapper.id}`);
    await this.storageService.set('agents', key, wrapper);
  }
  
  /**
   * Remove wrapper from unified storage
   */
  private async removeWrapper(wrapperId: string): Promise<void> {
    const key = this.getUserScopedKey(`wrappers.${wrapperId}`);
    await this.storageService.delete('agents', key);
  }
  
  /**
   * Load all wrappers for current user from storage
   */
  async loadUserWrappers(): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User must be set before loading wrappers');
    }
    
    try {
      // Get all keys for this user's wrappers
      const allKeys = await this.storageService.keys('agents');
      const userWrapperPrefix = this.getUserScopedKey('wrappers.');
      const userWrapperKeys = allKeys.filter(key => key.startsWith(userWrapperPrefix));
      
      // Load each wrapper
      for (const key of userWrapperKeys) {
        const wrapper = await this.storageService.get<AgentWrapper>('agents', key);
        if (wrapper) {
          this.wrappers.set(wrapper.id, wrapper);
          this.enabledWrappers.add(wrapper.id);
          
          // Initialize metrics if not present
          if (!this.metrics.has(wrapper.id)) {
            this.metrics.set(wrapper.id, {
              requestCount: 0,
              successCount: 0,
              errorCount: 0,
              averageResponseTime: 0
            });
          }
        }
      }
      
      console.log(`Loaded ${userWrapperKeys.length} wrappers for user ${this.currentUserId}`);
    } catch (error) {
      console.error('Error loading user wrappers:', error);
    }
  }
}

// Export singleton instance
export const agentWrapperRegistry = new AgentWrapperRegistry();
export default AgentWrapperRegistry;