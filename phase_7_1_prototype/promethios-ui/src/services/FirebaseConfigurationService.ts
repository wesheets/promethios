/**
 * Firebase Configuration Service
 * 
 * Handles persistence of agent configurations to Firebase Firestore
 * with real-time synchronization and offline support.
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  serverTimestamp,
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AgentConfiguration } from '../types/AgentConfigurationTypes';
import { AgentToolProfile } from '../types/ToolTypes';

export interface FirebaseAgentConfiguration extends Omit<AgentConfiguration, 'createdAt' | 'updatedAt'> {
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  userId: string;
  organizationId: string;
}

export class FirebaseConfigurationService {
  private readonly COLLECTION_NAME = 'agent_configurations';
  private readonly VERSIONS_COLLECTION = 'configuration_versions';
  private readonly TEMPLATES_COLLECTION = 'configuration_templates';

  constructor(private userId: string, private organizationId: string = 'default') {}

  // ============================================================================
  // CONFIGURATION PERSISTENCE
  // ============================================================================

  /**
   * Save agent configuration to Firebase
   */
  async saveConfiguration(agentId: string, configuration: AgentConfiguration): Promise<void> {
    try {
      console.log(`🔥 [Firebase] Saving configuration for agent ${agentId}`);

      const docRef = doc(db, this.COLLECTION_NAME, this.getDocumentId(agentId));
      
      const firebaseConfig: FirebaseAgentConfiguration = {
        ...configuration,
        userId: this.userId,
        organizationId: this.organizationId,
        createdAt: configuration.createdAt ? new Date(configuration.createdAt) : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, firebaseConfig, { merge: true });

      // Save version history
      await this.saveConfigurationVersion(agentId, configuration);

      console.log(`✅ [Firebase] Configuration saved successfully for agent ${agentId}`);
    } catch (error) {
      console.error(`❌ [Firebase] Failed to save configuration for agent ${agentId}:`, error);
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Load agent configuration from Firebase
   */
  async loadConfiguration(agentId: string): Promise<AgentConfiguration | null> {
    try {
      console.log(`🔥 [Firebase] Loading configuration for agent ${agentId}`);

      const docRef = doc(db, this.COLLECTION_NAME, this.getDocumentId(agentId));
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as FirebaseAgentConfiguration;
        
        // Convert Firebase timestamps back to ISO strings
        const configuration: AgentConfiguration = {
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };

        console.log(`✅ [Firebase] Configuration loaded successfully for agent ${agentId}`);
        return configuration;
      } else {
        console.log(`ℹ️ [Firebase] No configuration found for agent ${agentId}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ [Firebase] Failed to load configuration for agent ${agentId}:`, error);
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Update tool profile for an agent
   */
  async updateToolProfile(agentId: string, toolProfile: AgentToolProfile): Promise<void> {
    try {
      console.log(`🔥 [Firebase] Updating tool profile for agent ${agentId}`);

      const docRef = doc(db, this.COLLECTION_NAME, this.getDocumentId(agentId));
      
      await updateDoc(docRef, {
        toolProfile: toolProfile,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ [Firebase] Tool profile updated successfully for agent ${agentId}`);
    } catch (error) {
      console.error(`❌ [Firebase] Failed to update tool profile for agent ${agentId}:`, error);
      throw new Error(`Failed to update tool profile: ${error.message}`);
    }
  }

  /**
   * Delete agent configuration
   */
  async deleteConfiguration(agentId: string): Promise<void> {
    try {
      console.log(`🔥 [Firebase] Deleting configuration for agent ${agentId}`);

      const docRef = doc(db, this.COLLECTION_NAME, this.getDocumentId(agentId));
      await deleteDoc(docRef);

      console.log(`✅ [Firebase] Configuration deleted successfully for agent ${agentId}`);
    } catch (error) {
      console.error(`❌ [Firebase] Failed to delete configuration for agent ${agentId}:`, error);
      throw new Error(`Failed to delete configuration: ${error.message}`);
    }
  }

  /**
   * List all configurations for the current user
   */
  async listConfigurations(): Promise<AgentConfiguration[]> {
    try {
      console.log(`🔥 [Firebase] Loading all configurations for user ${this.userId}`);

      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', this.userId),
        where('organizationId', '==', this.organizationId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const configurations: AgentConfiguration[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseAgentConfiguration;
        configurations.push({
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });

      console.log(`✅ [Firebase] Loaded ${configurations.length} configurations`);
      return configurations;
    } catch (error) {
      console.error(`❌ [Firebase] Failed to list configurations:`, error);
      throw new Error(`Failed to list configurations: ${error.message}`);
    }
  }

  // ============================================================================
  // REAL-TIME SYNCHRONIZATION
  // ============================================================================

  /**
   * Subscribe to real-time configuration updates
   */
  subscribeToConfiguration(agentId: string, callback: (config: AgentConfiguration | null) => void): () => void {
    console.log(`🔥 [Firebase] Subscribing to real-time updates for agent ${agentId}`);

    const docRef = doc(db, this.COLLECTION_NAME, this.getDocumentId(agentId));
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as FirebaseAgentConfiguration;
        const configuration: AgentConfiguration = {
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
        callback(configuration);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`❌ [Firebase] Real-time subscription error for agent ${agentId}:`, error);
    });
  }

  /**
   * Subscribe to all user configurations
   */
  subscribeToAllConfigurations(callback: (configs: AgentConfiguration[]) => void): () => void {
    console.log(`🔥 [Firebase] Subscribing to all configurations for user ${this.userId}`);

    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', this.userId),
      where('organizationId', '==', this.organizationId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const configurations: AgentConfiguration[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseAgentConfiguration;
        configurations.push({
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });

      callback(configurations);
    }, (error) => {
      console.error(`❌ [Firebase] Real-time subscription error for all configurations:`, error);
    });
  }

  // ============================================================================
  // VERSION MANAGEMENT
  // ============================================================================

  /**
   * Save configuration version for history tracking
   */
  private async saveConfigurationVersion(agentId: string, configuration: AgentConfiguration): Promise<void> {
    try {
      const versionId = `${agentId}_${Date.now()}`;
      const versionRef = doc(db, this.VERSIONS_COLLECTION, versionId);

      await setDoc(versionRef, {
        agentId,
        userId: this.userId,
        organizationId: this.organizationId,
        configuration,
        version: configuration.version || '1.0.0',
        createdAt: serverTimestamp(),
        author: this.userId
      });

      console.log(`✅ [Firebase] Configuration version saved: ${versionId}`);
    } catch (error) {
      console.error(`❌ [Firebase] Failed to save configuration version:`, error);
      // Don't throw here as this is not critical for the main operation
    }
  }

  /**
   * Get configuration version history
   */
  async getVersionHistory(agentId: string, limitCount: number = 10): Promise<any[]> {
    try {
      const q = query(
        collection(db, this.VERSIONS_COLLECTION),
        where('agentId', '==', agentId),
        where('userId', '==', this.userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const versions: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        versions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });

      return versions;
    } catch (error) {
      console.error(`❌ [Firebase] Failed to get version history for agent ${agentId}:`, error);
      return [];
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Batch update multiple configurations
   */
  async batchUpdateConfigurations(updates: { agentId: string; configuration: Partial<AgentConfiguration> }[]): Promise<void> {
    try {
      console.log(`🔥 [Firebase] Batch updating ${updates.length} configurations`);

      const batch = writeBatch(db);

      for (const update of updates) {
        const docRef = doc(db, this.COLLECTION_NAME, this.getDocumentId(update.agentId));
        batch.update(docRef, {
          ...update.configuration,
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      console.log(`✅ [Firebase] Batch update completed successfully`);
    } catch (error) {
      console.error(`❌ [Firebase] Batch update failed:`, error);
      throw new Error(`Batch update failed: ${error.message}`);
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Generate document ID for agent configuration
   */
  private getDocumentId(agentId: string): string {
    return `${this.userId}_${this.organizationId}_${agentId}`;
  }

  /**
   * Check if configuration exists
   */
  async configurationExists(agentId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, this.getDocumentId(agentId));
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error(`❌ [Firebase] Failed to check if configuration exists:`, error);
      return false;
    }
  }

  /**
   * Get configuration metadata (without full data)
   */
  async getConfigurationMetadata(agentId: string): Promise<{ exists: boolean; lastUpdated?: string; version?: string } | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, this.getDocumentId(agentId));
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as FirebaseAgentConfiguration;
        return {
          exists: true,
          lastUpdated: data.updatedAt?.toDate?.()?.toISOString(),
          version: data.version?.toString()
        };
      } else {
        return { exists: false };
      }
    } catch (error) {
      console.error(`❌ [Firebase] Failed to get configuration metadata:`, error);
      return null;
    }
  }
}

export default FirebaseConfigurationService;

