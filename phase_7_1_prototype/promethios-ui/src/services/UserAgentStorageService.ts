import { unifiedStorage } from './UnifiedStorageService';
import { useAuth } from '../context/AuthContext';

export interface AgentProfile {
  identity: {
    id: string;
    name: string;
    version: string;
    description: string;
    ownerId: string;
    creationDate: Date;
    lastModifiedDate: Date;
    status: string;
  };
  latestScorecard: any | null;
  attestationCount: number;
  lastActivity: Date | null;
  healthStatus: 'healthy' | 'warning' | 'critical';
  trustLevel: 'low' | 'medium' | 'high';
  isWrapped: boolean;
  governancePolicy: GovernancePolicy | null;
  isDeployed: boolean;
  apiDetails?: {
    endpoint: string;
    key: string;
    provider: string;
    selectedModel?: string;
    selectedCapabilities?: string[];
    selectedContextLength?: number;
    discoveredInfo?: any;
  };
}

export interface GovernancePolicy {
  trustThreshold: number;
  securityLevel: 'lenient' | 'standard' | 'strict';
  complianceFramework: 'general' | 'financial' | 'healthcare' | 'legal' | 'gdpr' | 'soc2';
  enforcementLevel: 'governance' | 'monitoring' | 'strict_compliance';
  enableAuditLogging: boolean;
  enableDataRetention: boolean;
  enableRateLimiting: boolean;
  enableContentFiltering: boolean;
  enableRealTimeMonitoring: boolean;
  enableEscalationPolicies: boolean;
  maxRequestsPerMinute?: number;
  policyRules: PolicyRule[];
  complianceControls?: ComplianceControl[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface ComplianceControl {
  id: string;
  frameworkId: string;
  controlId: string;
  name: string;
  description: string;
  requirements: string[];
  monitoringLevel: 'log' | 'alert' | 'escalate';
  enabled: boolean;
}

export interface PolicyRule {
  id: string;
  name: string;
  type: 'trust_threshold' | 'content_filter' | 'rate_limit' | 'data_retention' | 'audit_requirement';
  condition: string;
  action: 'allow' | 'deny' | 'warn' | 'escalate';
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface AgentScorecard {
  agentId: string;
  userId: string;
  score: number;
  metrics: {
    reliability: number;
    performance: number;
    security: number;
    compliance: number;
    governance: number;
    trustScore: number;
  };
  governanceMetrics: {
    policyCompliance: number;
    securityScore: number;
    auditScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    violationCount: number;
    lastPolicyCheck: Date;
  };
  lastUpdated: Date;
  violations: PolicyViolation[];
  recommendations: string[];
}

export interface PolicyViolation {
  id: string;
  agentId: string;
  policyRuleId: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * User-scoped agent storage service with privacy isolation
 */
export class UserAgentStorageService {
  private currentUserId: string | null = null;

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  private getUserKey(key: string): string {
    if (!this.currentUserId) {
      throw new Error('No user set for agent storage service');
    }
    return `${this.currentUserId}.${key}`;
  }

  /**
   * Save an agent to user-scoped storage
   */
  async saveAgent(agent: AgentProfile): Promise<void> {
    try {
      const userKey = this.getUserKey(agent.identity.id);
      
      // Serialize dates for storage with safe null checks
      const serializedAgent = {
        ...agent,
        identity: {
          ...agent.identity,
          creationDate: agent.identity?.creationDate?.toISOString() || new Date().toISOString(),
          lastModifiedDate: agent.identity?.lastModifiedDate?.toISOString() || new Date().toISOString(),
        },
        lastActivity: agent.lastActivity?.toISOString() || null,
        // Only include governance policy if it exists
        ...(agent.governancePolicy && {
          governancePolicy: {
            ...agent.governancePolicy,
            createdAt: agent.governancePolicy.createdAt?.toISOString() || new Date().toISOString(),
            lastUpdated: agent.governancePolicy.lastUpdated?.toISOString() || new Date().toISOString(),
          }
        }),
      };

      await unifiedStorage.set('agents', userKey, serializedAgent);
      
      // Also create initial scorecard
      await this.createInitialScorecard(agent);
      
      console.log(`Agent ${agent.identity.name} saved to user storage`);
    } catch (error) {
      console.error('Error saving agent:', error);
      throw error;
    }
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<AgentProfile | null> {
    try {
      if (!this.currentUserId) {
        console.warn('No user set, cannot get agent');
        return null;
      }

      const userKey = this.getUserKey(agentId);
      console.log(`Looking for agent with key: ${userKey}`);
      
      const agentData = await unifiedStorage.get<any>('agents', userKey);
      
      if (!agentData) {
        console.log(`No agent found with key: ${userKey}`);
        return null;
      }

      console.log('Raw agent data from storage:', agentData);

      // Safely deserialize dates with fallbacks
      const agent: AgentProfile = {
        ...agentData,
        identity: {
          ...agentData.identity,
          creationDate: agentData.identity?.creationDate 
            ? new Date(agentData.identity.creationDate) 
            : new Date(),
          lastModifiedDate: agentData.identity?.lastModifiedDate 
            ? new Date(agentData.identity.lastModifiedDate) 
            : new Date(),
        },
        lastActivity: agentData.lastActivity ? new Date(agentData.lastActivity) : null,
      };

      console.log('Processed agent data:', agent);
      return agent;
    } catch (error) {
      console.error(`Error getting agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Load all production agents for the current user (for management and deployment)
   */
  async loadUserAgents(): Promise<AgentProfile[]> {
    try {
      if (!this.currentUserId) {
        console.warn('No user set, returning empty agents list');
        return [];
      }

      const allKeys = await unifiedStorage.keys('agents');
      console.log('🔍 All keys from unified storage:', allKeys);
      console.log('🔍 Sample keys for analysis:', allKeys.slice(0, 10));
      
      // Extract just the key part after 'agents/' prefix
      const keyParts = allKeys.map(key => key.replace('agents/', ''));
      console.log('🔍 Key parts after removing agents/ prefix:', keyParts);
      
      // Check what suffixes exist in the keys
      const testingKeys = keyParts.filter(key => key.includes('-testing'));
      const productionKeys = keyParts.filter(key => key.includes('-production'));
      const otherKeys = keyParts.filter(key => !key.includes('-testing') && !key.includes('-production'));
      
      console.log('🔍 Testing keys found:', testingKeys.length, testingKeys.slice(0, 3));
      console.log('🔍 Production keys found:', productionKeys.length, productionKeys.slice(0, 3));
      console.log('🔍 Other keys found:', otherKeys.length, otherKeys.slice(0, 3));
      
      // Filter for production agents only (for management and deployment)
      const userPrefix = `${this.currentUserId}_`;
      console.log('🔍 Looking for production agents with prefix:', userPrefix);
      console.log('🔍 Sample key analysis:');
      keyParts.slice(0, 5).forEach(key => {
        console.log(`  Key: "${key}" | Starts with prefix: ${key.startsWith(userPrefix)} | Has -production: ${key.includes('-production')}`);
      });
      
      const userKeyParts = keyParts.filter(keyPart => 
        keyPart.startsWith(userPrefix) && 
        !keyPart.includes('scorecard') &&
        keyPart.includes('-production') // Only load production agents for management
      );
      console.log('🔍 Filtered production agent key parts:', userKeyParts);
      
      // Fallback: If no production agents found, load any user agents (for debugging)
      let fallbackKeyParts = [];
      if (userKeyParts.length === 0) {
        console.log('⚠️ No production agents found, checking for any user agents...');
        fallbackKeyParts = keyParts.filter(keyPart => 
          keyPart.startsWith(userPrefix) && 
          !keyPart.includes('scorecard')
        );
        console.log('🔍 Fallback: Found user agent key parts:', fallbackKeyParts);
      }
      
      // Use production agents if available, otherwise use fallback
      const finalKeyParts = userKeyParts.length > 0 ? userKeyParts : fallbackKeyParts;
      
      // Reconstruct full keys for loading
      const userKeys = finalKeyParts.map(keyPart => `agents/${keyPart}`);
      console.log('🔍 Final agent keys for loading:', userKeys);
      console.log('🔍 Loading strategy:', userKeyParts.length > 0 ? 'production agents' : 'fallback to any user agents');

      const agents: AgentProfile[] = [];

      for (const key of userKeys) {
        try {
          console.log('🔍 Loading production agent with key:', key);
          // Extract the key part after 'agents/' for the get() call
          const keyPart = key.replace('agents/', '');
          const agentData = await unifiedStorage.get<any>('agents', keyPart);
          if (agentData) {
            console.log('🔍 Loaded production agent data:', agentData.identity?.name || 'Unknown');
            
            // Migrate legacy agents that don't have apiDetails
            if (!agentData.apiDetails && (agentData.apiKey || agentData.apiEndpoint || agentData.provider)) {
              console.log('🔧 Migrating legacy agent to include apiDetails:', agentData.identity?.name);
              agentData.apiDetails = {
                endpoint: agentData.apiEndpoint || agentData.endpoint || 'https://api.openai.com/v1',
                key: agentData.apiKey || agentData.key || '',
                provider: agentData.provider || 'OpenAI',
                selectedModel: agentData.model || 'gpt-4',
                selectedCapabilities: agentData.capabilities || [],
                selectedContextLength: agentData.contextLength || 4096,
                discoveredInfo: agentData.discoveredInfo || null,
              };
              
              // Save the migrated agent back to storage
              try {
                await unifiedStorage.store('agents', key.replace('agents/', ''), agentData);
                console.log('✅ Successfully migrated agent with apiDetails:', agentData.identity?.name);
              } catch (migrationError) {
                console.error('❌ Failed to save migrated agent:', migrationError);
              }
            }
            
            // Safely deserialize dates with fallbacks
            const agent: AgentProfile = {
              ...agentData,
              identity: {
                ...agentData.identity,
                creationDate: agentData.identity?.creationDate 
                  ? new Date(agentData.identity.creationDate) 
                  : new Date(),
                lastModifiedDate: agentData.identity?.lastModifiedDate 
                  ? new Date(agentData.identity.lastModifiedDate) 
                  : new Date(),
              },
              lastActivity: agentData.lastActivity ? new Date(agentData.lastActivity) : null,
            };
            agents.push(agent);
          } else {
            console.log('🔍 No data found for production agent key:', key);
          }
        } catch (error) {
          console.error(`Error loading production agent with key ${key}:`, error);
        }
      }

      console.log(`Loaded ${agents.length} agents for user ${this.currentUserId} using strategy: ${userKeyParts.length > 0 ? 'production agents' : 'fallback to any user agents'}`);
      return agents;
    } catch (error) {
      console.error('Error loading user production agents:', error);
      return [];
    }
  }

  /**
   * Delete an agent from user storage
   */
  async deleteAgent(agentId: string): Promise<void> {
    try {
      const userKey = this.getUserKey(agentId);
      await unifiedStorage.delete('agents', userKey);
      
      // Also delete scorecard
      await this.deleteScorecard(agentId);
      
      console.log(`Agent ${agentId} deleted from user storage`);
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }

  /**
   * Create initial scorecard for a new agent
   */
  private async createInitialScorecard(agent: AgentProfile): Promise<void> {
    try {
      // Calculate initial governance metrics based on agent's governance policy
      const governancePolicy = agent.governancePolicy;
      const hasGovernancePolicy = !!governancePolicy;
      
      const scorecard: AgentScorecard = {
        agentId: agent.identity.id,
        userId: this.currentUserId!,
        score: hasGovernancePolicy ? 90 : 75, // Higher score if governance is configured
        metrics: {
          reliability: 90,
          performance: 85,
          security: hasGovernancePolicy ? this.calculateSecurityScore(governancePolicy) : 70,
          compliance: hasGovernancePolicy ? this.calculateComplianceScore(governancePolicy) : 60,
          governance: hasGovernancePolicy ? 95 : 50,
          trustScore: governancePolicy?.trustThreshold || 85,
        },
        governanceMetrics: {
          policyCompliance: hasGovernancePolicy ? 95 : 50,
          securityScore: hasGovernancePolicy ? this.calculateSecurityScore(governancePolicy) : 70,
          auditScore: governancePolicy?.enableAuditLogging ? 100 : 0,
          riskLevel: this.calculateRiskLevel(governancePolicy),
          violationCount: 0,
          lastPolicyCheck: new Date(),
        },
        lastUpdated: new Date(),
        violations: [],
        recommendations: this.generateRecommendations(agent),
      };

      const scorecardKey = this.getUserKey(`scorecard.${agent.identity.id}`);
      
      // Serialize dates
      const serializedScorecard = {
        ...scorecard,
        lastUpdated: scorecard.lastUpdated.toISOString(),
        governanceMetrics: {
          ...scorecard.governanceMetrics,
          lastPolicyCheck: scorecard.governanceMetrics.lastPolicyCheck.toISOString(),
        },
      };

      await unifiedStorage.set('agents', scorecardKey, serializedScorecard);
      console.log(`Initial scorecard created for agent ${agent.identity.name} with governance metrics`);
    } catch (error) {
      console.error('Error creating initial scorecard:', error);
    }
  }

  /**
   * Calculate security score based on governance policy
   */
  private calculateSecurityScore(policy: GovernancePolicy | null): number {
    if (!policy) return 70;
    
    let score = 70; // Base score
    
    // Security level bonus
    if (policy.securityLevel === 'strict') score += 20;
    else if (policy.securityLevel === 'standard') score += 10;
    
    // Feature bonuses
    if (policy.enableAuditLogging) score += 5;
    if (policy.enableRealTimeMonitoring) score += 5;
    if (policy.enableContentFiltering) score += 3;
    if (policy.enableRateLimiting) score += 2;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate compliance score based on governance policy
   */
  private calculateComplianceScore(policy: GovernancePolicy | null): number {
    if (!policy) return 60;
    
    let score = 60; // Base score
    
    // Compliance framework bonus
    switch (policy.complianceFramework) {
      case 'financial': score += 25; break;
      case 'healthcare': score += 25; break;
      case 'legal': score += 20; break;
      case 'gdpr': score += 30; break;
      case 'general': score += 15; break;
    }
    
    // Feature bonuses
    if (policy.enableAuditLogging) score += 10;
    if (policy.enableDataRetention) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate risk level based on governance policy
   */
  private calculateRiskLevel(policy: GovernancePolicy | null): 'low' | 'medium' | 'high' {
    if (!policy) return 'high';
    
    let riskScore = 0;
    
    // Lower risk for stricter security
    if (policy.securityLevel === 'strict') riskScore += 3;
    else if (policy.securityLevel === 'standard') riskScore += 2;
    else riskScore += 1;
    
    // Lower risk for compliance frameworks
    if (['financial', 'healthcare', 'gdpr'].includes(policy.complianceFramework)) riskScore += 2;
    else if (policy.complianceFramework === 'legal') riskScore += 1;
    
    // Lower risk for monitoring features
    if (policy.enableAuditLogging) riskScore += 1;
    if (policy.enableRealTimeMonitoring) riskScore += 1;
    if (policy.enableContentFiltering) riskScore += 1;
    
    if (riskScore >= 6) return 'low';
    if (riskScore >= 4) return 'medium';
    return 'high';
  }

  /**
   * Generate recommendations based on agent configuration
   */
  private generateRecommendations(agent: AgentProfile): string[] {
    const recommendations: string[] = [];
    const policy = agent.governancePolicy;
    
    if (!policy) {
      recommendations.push('Configure governance policy for enhanced security');
      recommendations.push('Enable audit logging for compliance tracking');
      recommendations.push('Set up real-time monitoring for better oversight');
      return recommendations;
    }
    
    if (!policy.enableAuditLogging) {
      recommendations.push('Enable audit logging for compliance requirements');
    }
    
    if (!policy.enableRealTimeMonitoring) {
      recommendations.push('Enable real-time monitoring for proactive issue detection');
    }
    
    if (policy.securityLevel === 'lenient') {
      recommendations.push('Consider upgrading to standard or strict security level');
    }
    
    if (!policy.enableContentFiltering) {
      recommendations.push('Enable content filtering for additional safety measures');
    }
    
    if (policy.trustThreshold < 80) {
      recommendations.push('Consider raising trust threshold for enhanced security');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Governance configuration is optimal');
      recommendations.push('Monitor agent performance and adjust policies as needed');
    }
    
    return recommendations;
  }

  /**
   * Load scorecard for an agent
   */
  async loadScorecard(agentId: string): Promise<AgentScorecard | null> {
    try {
      const scorecardKey = this.getUserKey(`scorecard.${agentId}`);
      const scorecardData = await unifiedStorage.get<any>('agents', scorecardKey);
      
      if (scorecardData) {
        return {
          ...scorecardData,
          lastUpdated: new Date(scorecardData.lastUpdated),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading scorecard:', error);
      return null;
    }
  }

  /**
   * Update scorecard for an agent
   */
  async updateScorecard(scorecard: AgentScorecard): Promise<void> {
    try {
      const scorecardKey = this.getUserKey(`scorecard.${scorecard.agentId}`);
      
      const serializedScorecard = {
        ...scorecard,
        lastUpdated: scorecard.lastUpdated.toISOString(),
      };

      await unifiedStorage.set('agents', scorecardKey, serializedScorecard);
      console.log(`Scorecard updated for agent ${scorecard.agentId}`);
    } catch (error) {
      console.error('Error updating scorecard:', error);
      throw error;
    }
  }

  /**
   * Delete scorecard for an agent
   */
  private async deleteScorecard(agentId: string): Promise<void> {
    try {
      const scorecardKey = this.getUserKey(`scorecard.${agentId}`);
      await unifiedStorage.delete('agents', scorecardKey);
    } catch (error) {
      console.error('Error deleting scorecard:', error);
    }
  }

  /**
   * Get storage statistics for the current user
   */
  async getUserStorageStats(): Promise<{
    agentCount: number;
    scorecardCount: number;
    totalSize: number;
  }> {
    try {
      if (!this.currentUserId) {
        return { agentCount: 0, scorecardCount: 0, totalSize: 0 };
      }

      const allKeys = await unifiedStorage.keys('agents');
      const userPrefix = `${this.currentUserId}.`;
      const userKeys = allKeys.filter(key => key.startsWith(userPrefix));

      const agentKeys = userKeys.filter(key => !key.includes('scorecard.'));
      const scorecardKeys = userKeys.filter(key => key.includes('scorecard.'));

      return {
        agentCount: agentKeys.length,
        scorecardCount: scorecardKeys.length,
        totalSize: userKeys.length,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { agentCount: 0, scorecardCount: 0, totalSize: 0 };
    }
  }
}

// Singleton instance
export const userAgentStorage = new UserAgentStorageService();

