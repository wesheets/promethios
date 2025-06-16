import { MultiAgentSystem } from '../types/multiAgent';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

/**
 * Registry for managing multi-agent systems with user-scoped data isolation
 */
class MultiAgentSystemRegistry {
  private systems: Map<string, MultiAgentSystem> = new Map();
  private db: any;
  private auth: any;

  constructor(db: any, auth: any) {
    this.db = db;
    this.auth = auth;
  }

  /**
   * Get the current authenticated user
   */
  private getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Get user-scoped collection reference
   */
  private getUserSystemsCollection(userId: string) {
    return collection(this.db, 'users', userId, 'multiAgentSystems');
  }

  /**
   * Get user-scoped document reference
   */
  private getUserSystemDoc(userId: string, systemId: string) {
    return doc(this.db, 'users', userId, 'multiAgentSystems', systemId);
  }

  /**
   * Create a new multi-agent system
   * @param system The system to create
   * @returns Whether the creation was successful
   */
  async createSystem(system: MultiAgentSystem): Promise<boolean> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        console.error('User must be authenticated to create multi-agent systems');
        return false;
      }

      // Check if system already exists for this user
      if (this.systems.has(system.id)) {
        console.warn(`Multi-agent system with ID ${system.id} already exists for user ${currentUser.uid}`);
        return false;
      }

      // Set user ID and timestamps
      system.userId = currentUser.uid;
      system.createdAt = new Date();
      system.updatedAt = new Date();

      // Add system to registry
      this.systems.set(system.id, system);

      // Persist to Firebase under user's collection
      await this.persistSystem(currentUser.uid, system);

      console.log(`Created multi-agent system: ${system.name} (${system.id}) for user ${currentUser.uid}`);
      return true;
    } catch (error) {
      console.error('Error creating multi-agent system:', error);
      return false;
    }
  }

  /**
   * Update an existing multi-agent system
   * @param systemId The ID of the system to update
   * @param updates The updates to apply
   * @returns Whether the update was successful
   */
  async updateSystem(systemId: string, updates: Partial<MultiAgentSystem>): Promise<boolean> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        console.error('User must be authenticated to update multi-agent systems');
        return false;
      }

      // Check if system exists
      if (!this.systems.has(systemId)) {
        console.warn(`Multi-agent system with ID ${systemId} does not exist`);
        return false;
      }

      // Get current system
      const currentSystem = this.systems.get(systemId)!;

      // Apply updates
      const updatedSystem = {
        ...currentSystem,
        ...updates,
        updatedAt: new Date()
      };

      // Update in registry
      this.systems.set(systemId, updatedSystem);

      // Update in Firebase
      await this.updateSystemInFirebase(currentUser.uid, systemId, updatedSystem);

      console.log(`Updated multi-agent system: ${systemId}`);
      return true;
    } catch (error) {
      console.error('Error updating multi-agent system:', error);
      return false;
    }
  }

  /**
   * Delete a multi-agent system
   * @param systemId The ID of the system to delete
   * @returns Whether the deletion was successful
   */
  async deleteSystem(systemId: string): Promise<boolean> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        console.error('User must be authenticated to delete multi-agent systems');
        return false;
      }

      // Check if system exists
      if (!this.systems.has(systemId)) {
        console.warn(`Multi-agent system with ID ${systemId} does not exist`);
        return false;
      }

      // Remove from registry
      this.systems.delete(systemId);

      // Remove from Firebase
      await this.removeSystemFromFirebase(currentUser.uid, systemId);

      console.log(`Deleted multi-agent system: ${systemId}`);
      return true;
    } catch (error) {
      console.error('Error deleting multi-agent system:', error);
      return false;
    }
  }

  /**
   * Get a system by ID
   * @param systemId The ID of the system to get
   * @returns The system, or null if not found
   */
  getSystem(systemId: string): MultiAgentSystem | null {
    return this.systems.get(systemId) || null;
  }

  /**
   * Get all systems for the current user
   * @returns Array of all systems
   */
  getAllSystems(): MultiAgentSystem[] {
    return Array.from(this.systems.values());
  }

  /**
   * Enable a system
   * @param systemId The ID of the system to enable
   * @returns Whether the operation was successful
   */
  async enableSystem(systemId: string): Promise<boolean> {
    return this.updateSystem(systemId, { enabled: true });
  }

  /**
   * Disable a system
   * @param systemId The ID of the system to disable
   * @returns Whether the operation was successful
   */
  async disableSystem(systemId: string): Promise<boolean> {
    return this.updateSystem(systemId, { enabled: false });
  }

  /**
   * Update system environment
   * @param systemId The ID of the system to update
   * @param environment The new environment
   * @returns Whether the operation was successful
   */
  async updateSystemEnvironment(systemId: string, environment: 'draft' | 'testing' | 'production'): Promise<boolean> {
    return this.updateSystem(systemId, { environment });
  }

  /**
   * Load all systems from Firebase for the current user
   */
  async loadSystems(): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        console.warn('User must be authenticated to load multi-agent systems');
        return;
      }

      const systemsCollection = this.getUserSystemsCollection(currentUser.uid);
      const snapshot = await getDocs(systemsCollection);

      // Clear existing data
      this.systems.clear();

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Create system instance
        const system: MultiAgentSystem = {
          id: doc.id,
          name: data.name,
          description: data.description,
          version: data.version,
          flowType: data.flowType,
          agents: data.agents,
          connections: data.connections,
          governanceRules: data.governanceRules,
          metrics: data.metrics,
          enabled: data.enabled,
          environment: data.environment,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };

        // Add to registry
        this.systems.set(doc.id, system);
      });

      console.log(`Loaded ${this.systems.size} multi-agent systems from Firebase for user ${currentUser.uid}`);
    } catch (error) {
      console.error('Error loading multi-agent systems from Firebase:', error);
    }
  }

  /**
   * Persist a system to Firebase under user's collection
   * @param userId The user ID
   * @param system The system to persist
   */
  private async persistSystem(userId: string, system: MultiAgentSystem): Promise<void> {
    try {
      const systemDoc = this.getUserSystemDoc(userId, system.id);

      await setDoc(systemDoc, {
        name: system.name,
        description: system.description,
        version: system.version,
        flowType: system.flowType,
        agents: system.agents,
        connections: system.connections,
        governanceRules: system.governanceRules,
        metrics: system.metrics,
        enabled: system.enabled,
        environment: system.environment,
        userId: userId,
        createdAt: system.createdAt,
        updatedAt: system.updatedAt
      });
    } catch (error) {
      console.error('Error persisting multi-agent system to Firebase:', error);
      throw error;
    }
  }

  /**
   * Update a system in Firebase for the current user
   * @param userId The user ID
   * @param systemId The ID of the system to update
   * @param system The updated system
   */
  private async updateSystemInFirebase(userId: string, systemId: string, system: MultiAgentSystem): Promise<void> {
    try {
      const systemDoc = this.getUserSystemDoc(userId, systemId);
      await updateDoc(systemDoc, {
        name: system.name,
        description: system.description,
        version: system.version,
        flowType: system.flowType,
        agents: system.agents,
        connections: system.connections,
        governanceRules: system.governanceRules,
        metrics: system.metrics,
        enabled: system.enabled,
        environment: system.environment,
        updatedAt: system.updatedAt
      });
    } catch (error) {
      console.error('Error updating multi-agent system in Firebase:', error);
      throw error;
    }
  }

  /**
   * Remove a system from Firebase for the current user
   * @param userId The user ID
   * @param systemId The ID of the system to remove
   */
  private async removeSystemFromFirebase(userId: string, systemId: string): Promise<void> {
    try {
      const systemDoc = this.getUserSystemDoc(userId, systemId);
      await deleteDoc(systemDoc);
    } catch (error) {
      console.error('Error removing multi-agent system from Firebase:', error);
      throw error;
    }
  }
}

// Export singleton instance
// This will be initialized with db and auth from AuthContext
export const multiAgentSystemRegistry = (db: any, auth: any) => new MultiAgentSystemRegistry(db, auth);
export default MultiAgentSystemRegistry;


