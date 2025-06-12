import { AgentWrapper, WrapperMetrics } from '../types';
import { firestore } from '../../../firebase/config';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';

/**
 * Registry for managing agent wrappers
 */
class AgentWrapperRegistry {
  private wrappers: Map<string, AgentWrapper> = new Map();
  private enabledWrappers: Set<string> = new Set();
  private metrics: Map<string, WrapperMetrics> = new Map();
  
  /**
   * Register an agent wrapper
   * @param wrapper The wrapper to register
   * @returns Whether the registration was successful
   */
  async registerWrapper(wrapper: AgentWrapper): Promise<boolean> {
    try {
      // Check if wrapper already exists
      if (this.wrappers.has(wrapper.id)) {
        console.warn(`Wrapper with ID ${wrapper.id} already exists`);
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
      
      // Persist to Firebase
      await this.persistWrapper(wrapper);
      
      console.log(`Registered wrapper: ${wrapper.name} (${wrapper.id})`);
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
      
      // Remove from Firebase
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
  async enableWrapper(wrapperId: string): Promise<boolean> {
    try {
      // Check if wrapper exists
      if (!this.wrappers.has(wrapperId)) {
        console.warn(`Wrapper with ID ${wrapperId} does not exist`);
        return false;
      }
      
      // Enable wrapper
      this.enabledWrappers.add(wrapperId);
      
      // Update in Firebase
      await this.updateWrapperStatus(wrapperId, true);
      
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
  async disableWrapper(wrapperId: string): Promise<boolean> {
    try {
      // Check if wrapper exists
      if (!this.wrappers.has(wrapperId)) {
        console.warn(`Wrapper with ID ${wrapperId} does not exist`);
        return false;
      }
      
      // Disable wrapper
      this.enabledWrappers.delete(wrapperId);
      
      // Update in Firebase
      await this.updateWrapperStatus(wrapperId, false);
      
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
  async updateWrapperMetrics(wrapperId: string, metrics: Partial<WrapperMetrics>): Promise<boolean> {
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
      await this.updateWrapperMetricsInFirebase(wrapperId, updatedMetrics);
      
      return true;
    } catch (error) {
      console.error('Error updating wrapper metrics:', error);
      return false;
    }
  }
  
  /**
   * Load all wrappers from Firebase
   */
  async loadWrappers(): Promise<void> {
    try {
      const wrappersCollection = collection(firestore, 'agentWrappers');
      const snapshot = await getDocs(wrappersCollection);
      
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
      
      console.log(`Loaded ${this.wrappers.size} wrappers from Firebase`);
    } catch (error) {
      console.error('Error loading wrappers from Firebase:', error);
    }
  }
  
  /**
   * Persist a wrapper to Firebase
   * @param wrapper The wrapper to persist
   */
  private async persistWrapper(wrapper: AgentWrapper): Promise<void> {
    try {
      const wrapperDoc = doc(firestore, 'agentWrappers', wrapper.id);
      
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
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error persisting wrapper to Firebase:', error);
      throw error;
    }
  }
  
  /**
   * Remove a wrapper from Firebase
   * @param wrapperId The ID of the wrapper to remove
   */
  private async removeWrapper(wrapperId: string): Promise<void> {
    try {
      const wrapperDoc = doc(firestore, 'agentWrappers', wrapperId);
      await deleteDoc(wrapperDoc);
    } catch (error) {
      console.error('Error removing wrapper from Firebase:', error);
      throw error;
    }
  }
  
  /**
   * Update wrapper status in Firebase
   * @param wrapperId The ID of the wrapper to update
   * @param enabled Whether the wrapper is enabled
   */
  private async updateWrapperStatus(wrapperId: string, enabled: boolean): Promise<void> {
    try {
      const wrapperDoc = doc(firestore, 'agentWrappers', wrapperId);
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
   * Update wrapper metrics in Firebase
   * @param wrapperId The ID of the wrapper to update
   * @param metrics The new metrics
   */
  private async updateWrapperMetricsInFirebase(wrapperId: string, metrics: WrapperMetrics): Promise<void> {
    try {
      const wrapperDoc = doc(firestore, 'agentWrappers', wrapperId);
      await updateDoc(wrapperDoc, {
        metrics,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating wrapper metrics in Firebase:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const agentWrapperRegistry = new AgentWrapperRegistry();
export default AgentWrapperRegistry;
