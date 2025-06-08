import { db } from '../firebase/config';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

/**
 * Agent Configuration Interface
 */
export interface AgentConfiguration {
  id?: string;
  userId: string;
  name: string;
  description: string;
  agentType: 'llm' | 'multimodal' | 'custom';
  apiEndpoint?: string;
  governanceLevel: 'basic' | 'standard' | 'advanced';
  trustScore?: number;
  complianceScore?: number;
  status: 'draft' | 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
}

/**
 * Agent Wizard Data Interface (for in-progress wizard sessions)
 */
export interface AgentWizardData {
  userId: string;
  currentStep: number;
  agentType?: string;
  agentName?: string;
  agentDescription?: string;
  apiEndpoint?: string;
  governanceLevel?: string;
  lastUpdated: string;
}

/**
 * Firebase service for managing agent configurations and wizard data
 */
export class AgentFirebaseService {
  private static readonly AGENTS_COLLECTION = 'agents';
  private static readonly WIZARD_DATA_COLLECTION = 'agentWizardData';

  /**
   * Save agent wizard progress (auto-save functionality)
   */
  static async saveWizardProgress(userId: string, wizardData: Partial<AgentWizardData>): Promise<void> {
    try {
      const wizardDocRef = doc(db, this.WIZARD_DATA_COLLECTION, userId);
      const dataToSave: AgentWizardData = {
        userId,
        currentStep: wizardData.currentStep || 1,
        agentType: wizardData.agentType,
        agentName: wizardData.agentName,
        agentDescription: wizardData.agentDescription,
        apiEndpoint: wizardData.apiEndpoint,
        governanceLevel: wizardData.governanceLevel,
        lastUpdated: new Date().toISOString()
      };

      await setDoc(wizardDocRef, dataToSave, { merge: true });
      console.log('Agent wizard progress saved successfully');
    } catch (error) {
      console.error('Error saving wizard progress:', error);
      throw error;
    }
  }

  /**
   * Load agent wizard progress
   */
  static async loadWizardProgress(userId: string): Promise<AgentWizardData | null> {
    try {
      const wizardDocRef = doc(db, this.WIZARD_DATA_COLLECTION, userId);
      const wizardDoc = await getDoc(wizardDocRef);
      
      if (wizardDoc.exists()) {
        return wizardDoc.data() as AgentWizardData;
      }
      return null;
    } catch (error) {
      console.error('Error loading wizard progress:', error);
      return null;
    }
  }

  /**
   * Clear wizard progress (after completion or cancellation)
   */
  static async clearWizardProgress(userId: string): Promise<void> {
    try {
      const wizardDocRef = doc(db, this.WIZARD_DATA_COLLECTION, userId);
      await deleteDoc(wizardDocRef);
      console.log('Agent wizard progress cleared');
    } catch (error) {
      console.error('Error clearing wizard progress:', error);
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Save completed agent configuration
   */
  static async saveAgentConfiguration(agentConfig: Omit<AgentConfiguration, 'id'>): Promise<string> {
    try {
      const agentsCollectionRef = collection(db, this.AGENTS_COLLECTION);
      const agentDocRef = doc(agentsCollectionRef);
      
      const configToSave: AgentConfiguration = {
        ...agentConfig,
        id: agentDocRef.id,
        trustScore: agentConfig.trustScore || this.calculateInitialTrustScore(agentConfig.governanceLevel),
        complianceScore: agentConfig.complianceScore || this.calculateInitialComplianceScore(agentConfig.governanceLevel),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(agentDocRef, configToSave);
      console.log('Agent configuration saved successfully with ID:', agentDocRef.id);
      
      // Clear wizard progress after successful save
      await this.clearWizardProgress(agentConfig.userId);
      
      return agentDocRef.id;
    } catch (error) {
      console.error('Error saving agent configuration:', error);
      throw error;
    }
  }

  /**
   * Get user's agent configurations
   */
  static async getUserAgents(userId: string): Promise<AgentConfiguration[]> {
    try {
      const agentsQuery = query(
        collection(db, this.AGENTS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(agentsQuery);
      const agents: AgentConfiguration[] = [];
      
      querySnapshot.forEach((doc) => {
        agents.push({ id: doc.id, ...doc.data() } as AgentConfiguration);
      });
      
      return agents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching user agents:', error);
      return [];
    }
  }

  /**
   * Get specific agent configuration
   */
  static async getAgentConfiguration(agentId: string): Promise<AgentConfiguration | null> {
    try {
      const agentDocRef = doc(db, this.AGENTS_COLLECTION, agentId);
      const agentDoc = await getDoc(agentDocRef);
      
      if (agentDoc.exists()) {
        return { id: agentDoc.id, ...agentDoc.data() } as AgentConfiguration;
      }
      return null;
    } catch (error) {
      console.error('Error fetching agent configuration:', error);
      return null;
    }
  }

  /**
   * Update agent configuration
   */
  static async updateAgentConfiguration(agentId: string, updates: Partial<AgentConfiguration>): Promise<void> {
    try {
      const agentDocRef = doc(db, this.AGENTS_COLLECTION, agentId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(agentDocRef, updateData);
      console.log('Agent configuration updated successfully');
    } catch (error) {
      console.error('Error updating agent configuration:', error);
      throw error;
    }
  }

  /**
   * Delete agent configuration
   */
  static async deleteAgentConfiguration(agentId: string): Promise<void> {
    try {
      const agentDocRef = doc(db, this.AGENTS_COLLECTION, agentId);
      await deleteDoc(agentDocRef);
      console.log('Agent configuration deleted successfully');
    } catch (error) {
      console.error('Error deleting agent configuration:', error);
      throw error;
    }
  }

  /**
   * Update agent activity timestamp
   */
  static async updateAgentActivity(agentId: string): Promise<void> {
    try {
      await this.updateAgentConfiguration(agentId, {
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating agent activity:', error);
      // Don't throw error for activity updates
    }
  }

  /**
   * Calculate initial trust score based on governance level
   */
  private static calculateInitialTrustScore(governanceLevel: string): number {
    switch (governanceLevel) {
      case 'basic': return 75 + Math.floor(Math.random() * 10); // 75-84
      case 'standard': return 85 + Math.floor(Math.random() * 10); // 85-94
      case 'advanced': return 90 + Math.floor(Math.random() * 8); // 90-97
      default: return 80;
    }
  }

  /**
   * Calculate initial compliance score based on governance level
   */
  private static calculateInitialComplianceScore(governanceLevel: string): number {
    switch (governanceLevel) {
      case 'basic': return 85 + Math.floor(Math.random() * 10); // 85-94
      case 'standard': return 92 + Math.floor(Math.random() * 6); // 92-97
      case 'advanced': return 96 + Math.floor(Math.random() * 4); // 96-99
      default: return 90;
    }
  }
}

export default AgentFirebaseService;

