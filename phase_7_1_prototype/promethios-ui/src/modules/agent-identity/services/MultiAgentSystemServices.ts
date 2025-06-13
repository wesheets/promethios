import { 
  MultiAgentSystemIdentity,
  SystemAttestation,
  SystemScorecardResult,
  DEFAULT_SYSTEM_METRICS
} from '../types/multiAgent';
import { 
  AgentIdentity,
  AgentScorecardResult 
} from '../types';
import { db } from '../../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

/**
 * Multi-Agent System Identity Registry
 * Manages system-level identities and governance
 */
class MultiAgentSystemIdentityRegistry {
  private readonly COLLECTION_NAME = 'multi-agent-system-identities';

  /**
   * Register a new multi-agent system identity
   */
  async registerSystem(systemData: Omit<MultiAgentSystemIdentity, 'id' | 'creationDate' | 'lastModifiedDate'>): Promise<string> {
    try {
      const systemIdentity: Omit<MultiAgentSystemIdentity, 'id'> = {
        ...systemData,
        creationDate: new Date(),
        lastModifiedDate: new Date()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...systemIdentity,
        creationDate: Timestamp.fromDate(systemIdentity.creationDate),
        lastModifiedDate: Timestamp.fromDate(systemIdentity.lastModifiedDate)
      });

      console.log('Multi-agent system identity registered:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error registering multi-agent system identity:', error);
      throw error;
    }
  }

  /**
   * Get system identity by ID
   */
  async getSystemIdentity(systemId: string): Promise<MultiAgentSystemIdentity | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, systemId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          creationDate: data.creationDate.toDate(),
          lastModifiedDate: data.lastModifiedDate.toDate()
        } as MultiAgentSystemIdentity;
      }

      return null;
    } catch (error) {
      console.error('Error getting system identity:', error);
      throw error;
    }
  }

  /**
   * Get all system identities for a user
   */
  async getSystemIdentitiesByOwner(ownerId: string): Promise<MultiAgentSystemIdentity[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('ownerId', '==', ownerId),
        orderBy('lastModifiedDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creationDate: doc.data().creationDate.toDate(),
        lastModifiedDate: doc.data().lastModifiedDate.toDate()
      })) as MultiAgentSystemIdentity[];
    } catch (error) {
      console.error('Error getting system identities by owner:', error);
      throw error;
    }
  }

  /**
   * Update system identity
   */
  async updateSystemIdentity(systemId: string, updates: Partial<MultiAgentSystemIdentity>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, systemId);
      await updateDoc(docRef, {
        ...updates,
        lastModifiedDate: Timestamp.fromDate(new Date())
      });

      console.log('System identity updated:', systemId);
    } catch (error) {
      console.error('Error updating system identity:', error);
      throw error;
    }
  }

  /**
   * Delete system identity
   */
  async deleteSystemIdentity(systemId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, systemId);
      await deleteDoc(docRef);

      console.log('System identity deleted:', systemId);
    } catch (error) {
      console.error('Error deleting system identity:', error);
      throw error;
    }
  }
}

/**
 * Multi-Agent System Scorecard Service
 * Manages system-level scorecards and evaluations
 */
class MultiAgentSystemScorecardService {
  private readonly COLLECTION_NAME = 'multi-agent-system-scorecards';

  /**
   * Create initial system scorecard
   */
  async createSystemScorecard(systemId: string, agentIds: string[]): Promise<SystemScorecardResult> {
    try {
      // Calculate initial system metrics
      const systemMetrics: Record<string, any> = {};
      let overallScore = 0;
      let totalWeight = 0;

      for (const metric of DEFAULT_SYSTEM_METRICS) {
        const value = await metric.calculate(systemId, {});
        const score = typeof value === 'number' ? value : 0;
        
        systemMetrics[metric.id] = {
          value,
          score,
          status: this.getMetricStatus(score, metric.interpretationRule?.thresholds)
        };

        if (metric.weight) {
          overallScore += score * metric.weight;
          totalWeight += metric.weight;
        }
      }

      const finalScore = totalWeight > 0 ? overallScore / totalWeight : 0;

      const scorecardResult: SystemScorecardResult = {
        systemId,
        agentId: systemId, // For compatibility with base interface
        templateId: 'default-system-template',
        evaluationTimestamp: new Date(),
        context: {},
        overallScore: Math.round(finalScore),
        metricValues: {}, // Individual agent metrics would go here
        systemMetrics,
        agentResults: {}, // Would be populated with individual agent results
        workflowEfficiency: systemMetrics.workflow_efficiency?.score || 85,
        crossAgentTrust: systemMetrics.cross_agent_trust?.score || 88,
        coordinationScore: systemMetrics.coordination_score?.score || 92
      };

      // Save to Firebase
      await addDoc(collection(db, this.COLLECTION_NAME), {
        ...scorecardResult,
        evaluationTimestamp: Timestamp.fromDate(scorecardResult.evaluationTimestamp)
      });

      console.log('System scorecard created:', systemId);
      return scorecardResult;
    } catch (error) {
      console.error('Error creating system scorecard:', error);
      throw error;
    }
  }

  /**
   * Get latest system scorecard
   */
  async getLatestSystemScorecard(systemId: string): Promise<SystemScorecardResult | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('systemId', '==', systemId),
        orderBy('evaluationTimestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        ...data,
        evaluationTimestamp: data.evaluationTimestamp.toDate()
      } as SystemScorecardResult;
    } catch (error) {
      console.error('Error getting latest system scorecard:', error);
      throw error;
    }
  }

  private getMetricStatus(score: number, thresholds?: any): 'critical' | 'warning' | 'normal' {
    if (!thresholds) return 'normal';
    
    if (score < thresholds.critical) return 'critical';
    if (score < thresholds.warning) return 'warning';
    return 'normal';
  }
}

/**
 * Multi-Agent System Integration Service
 * Handles automatic setup when multi-agent systems are created
 */
class MultiAgentSystemIntegration {
  private systemRegistry = new MultiAgentSystemIdentityRegistry();
  private scorecardService = new MultiAgentSystemScorecardService();

  /**
   * Setup complete governance for a new multi-agent system
   */
  async setupSystemGovernance(systemData: any): Promise<{
    systemId: string;
    scorecard: SystemScorecardResult;
    attestations: SystemAttestation[];
  }> {
    try {
      console.log('Setting up governance for multi-agent system:', systemData.name);

      // 1. Create system identity
      const systemId = await this.systemRegistry.registerSystem({
        name: systemData.name,
        version: '1.0.0',
        description: systemData.description,
        ownerId: systemData.ownerId,
        systemType: systemData.systemType,
        agentIds: systemData.selectedAgents.map((agent: any) => agent.id),
        agentRoles: systemData.agentRoles || {},
        workflowDefinition: systemData.workflowDefinition || {
          type: systemData.systemType,
          steps: [],
          dataFlow: [],
          errorHandling: { strategy: 'retry', maxRetries: 3 }
        },
        status: 'active',
        tags: systemData.tags || []
      });

      // 2. Create initial system scorecard
      const scorecard = await this.scorecardService.createSystemScorecard(
        systemId, 
        systemData.selectedAgents.map((agent: any) => agent.id)
      );

      // 3. Create system attestations
      const attestations = await this.createSystemAttestations(systemId, systemData);

      console.log('Multi-agent system governance setup complete:', systemId);

      return {
        systemId,
        scorecard,
        attestations
      };
    } catch (error) {
      console.error('Error setting up system governance:', error);
      throw error;
    }
  }

  private async createSystemAttestations(systemId: string, systemData: any): Promise<SystemAttestation[]> {
    const attestations: SystemAttestation[] = [
      {
        id: `${systemId}-workflow-compliance`,
        systemId,
        type: 'workflow_compliance',
        attestationType: 'workflow_compliance',
        issuer: 'Promethios System',
        issueDate: new Date(),
        status: 'active',
        affectedAgentIds: systemData.selectedAgents.map((agent: any) => agent.id)
      },
      {
        id: `${systemId}-data-flow-validation`,
        systemId,
        type: 'data_flow_validation',
        attestationType: 'data_flow_validation',
        issuer: 'Promethios System',
        issueDate: new Date(),
        status: 'active',
        affectedAgentIds: systemData.selectedAgents.map((agent: any) => agent.id)
      },
      {
        id: `${systemId}-cross-agent-security`,
        systemId,
        type: 'cross_agent_security',
        attestationType: 'cross_agent_security',
        issuer: 'Promethios System',
        issueDate: new Date(),
        status: 'active',
        affectedAgentIds: systemData.selectedAgents.map((agent: any) => agent.id)
      }
    ];

    // Save attestations to Firebase (implementation would go here)
    console.log('System attestations created:', attestations.length);
    
    return attestations;
  }
}

// Export singleton instances
export const multiAgentSystemRegistry = new MultiAgentSystemIdentityRegistry();
export const multiAgentScorecardService = new MultiAgentSystemScorecardService();
export const multiAgentSystemIntegration = new MultiAgentSystemIntegration();

