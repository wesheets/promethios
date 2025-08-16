/**
 * Cross-Agent Memory Extension for Promethios
 * 
 * Enables sharing of patterns and insights across multiple agents.
 * Provides collaborative learning and pattern sharing capabilities.
 */

import { Extension } from './Extension';
import { RecursiveMemoryExtension, PatternAnalysis } from './RecursiveMemoryExtension';

export interface SharedPattern {
  patternId: string;
  agentIds: string[];
  sharedCount: number;
  effectiveness: number;
  lastShared: Date;
  patternData: PatternAnalysis;
  collaborativeMetrics: {
    adoptionRate: number;
    successRate: number;
    improvementSuggestions: string[];
  };
}

export interface CrossAgentInsight {
  insightId: string;
  sourceAgentId: string;
  targetAgentIds: string[];
  insightType: 'workflow_optimization' | 'pattern_recognition' | 'best_practice' | 'error_prevention';
  description: string;
  confidence: number;
  applicabilityScore: number;
  createdAt: Date;
  appliedAt?: Date;
  results?: {
    improvementMeasured: boolean;
    performanceGain: number;
    feedback: string;
  };
}

export interface AgentCollaboration {
  collaborationId: string;
  participantAgentIds: string[];
  collaborationType: 'pattern_sharing' | 'workflow_optimization' | 'knowledge_transfer';
  startedAt: Date;
  status: 'active' | 'completed' | 'paused';
  sharedPatterns: SharedPattern[];
  insights: CrossAgentInsight[];
  metrics: {
    totalPatterns: number;
    successfulAdoptions: number;
    averageImprovement: number;
    collaborationScore: number;
  };
}

export class CrossAgentMemoryExtension extends Extension {
  private memoryExtension: RecursiveMemoryExtension;
  private sharedPatterns: Map<string, SharedPattern> = new Map();
  private crossAgentInsights: Map<string, CrossAgentInsight[]> = new Map();
  private activeCollaborations: Map<string, AgentCollaboration> = new Map();

  constructor() {
    super('CrossAgentMemoryExtension', '1.0.0');
    this.memoryExtension = new RecursiveMemoryExtension();
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🤝 [CrossAgent] Initializing Cross-Agent Memory Extension...');
      
      // Initialize memory extension
      await this.memoryExtension.initialize();
      
      console.log('✅ [CrossAgent] Cross-Agent Memory Extension initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ [CrossAgent] Failed to initialize Cross-Agent Memory Extension:', error);
      return false;
    }
  }

  async sharePattern(sourceAgentId: string, pattern: PatternAnalysis, targetAgentIds: string[]): Promise<SharedPattern> {
    try {
      console.log(`🔄 [CrossAgent] Sharing pattern ${pattern.patternId} from ${sourceAgentId} to ${targetAgentIds.length} agents`);
      
      const sharedPattern: SharedPattern = {
        patternId: pattern.patternId,
        agentIds: [sourceAgentId, ...targetAgentIds],
        sharedCount: targetAgentIds.length,
        effectiveness: pattern.confidence,
        lastShared: new Date(),
        patternData: pattern,
        collaborativeMetrics: {
          adoptionRate: 0,
          successRate: 0,
          improvementSuggestions: []
        }
      };
      
      this.sharedPatterns.set(pattern.patternId, sharedPattern);
      
      console.log(`✅ [CrossAgent] Pattern ${pattern.patternId} shared successfully`);
      return sharedPattern;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to share pattern:`, error);
      throw error;
    }
  }

  async getSharedPatterns(agentId: string): Promise<SharedPattern[]> {
    try {
      const patterns = Array.from(this.sharedPatterns.values())
        .filter(pattern => pattern.agentIds.includes(agentId));
      
      console.log(`📋 [CrossAgent] Found ${patterns.length} shared patterns for agent ${agentId}`);
      return patterns;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to get shared patterns for agent ${agentId}:`, error);
      return [];
    }
  }

  async createInsight(sourceAgentId: string, targetAgentIds: string[], insight: Omit<CrossAgentInsight, 'insightId' | 'sourceAgentId' | 'targetAgentIds' | 'createdAt'>): Promise<CrossAgentInsight> {
    try {
      const crossAgentInsight: CrossAgentInsight = {
        insightId: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceAgentId,
        targetAgentIds,
        createdAt: new Date(),
        ...insight
      };
      
      // Store insight for each target agent
      for (const targetAgentId of targetAgentIds) {
        const existingInsights = this.crossAgentInsights.get(targetAgentId) || [];
        existingInsights.push(crossAgentInsight);
        this.crossAgentInsights.set(targetAgentId, existingInsights);
      }
      
      console.log(`💡 [CrossAgent] Created insight ${crossAgentInsight.insightId} from ${sourceAgentId} for ${targetAgentIds.length} agents`);
      return crossAgentInsight;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to create insight:`, error);
      throw error;
    }
  }

  async getInsights(agentId: string): Promise<CrossAgentInsight[]> {
    try {
      const insights = this.crossAgentInsights.get(agentId) || [];
      console.log(`💡 [CrossAgent] Found ${insights.length} insights for agent ${agentId}`);
      return insights;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to get insights for agent ${agentId}:`, error);
      return [];
    }
  }

  async startCollaboration(agentIds: string[], collaborationType: AgentCollaboration['collaborationType']): Promise<AgentCollaboration> {
    try {
      const collaboration: AgentCollaboration = {
        collaborationId: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participantAgentIds: agentIds,
        collaborationType,
        startedAt: new Date(),
        status: 'active',
        sharedPatterns: [],
        insights: [],
        metrics: {
          totalPatterns: 0,
          successfulAdoptions: 0,
          averageImprovement: 0,
          collaborationScore: 0
        }
      };
      
      this.activeCollaborations.set(collaboration.collaborationId, collaboration);
      
      console.log(`🤝 [CrossAgent] Started collaboration ${collaboration.collaborationId} with ${agentIds.length} agents`);
      return collaboration;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to start collaboration:`, error);
      throw error;
    }
  }

  async getActiveCollaborations(agentId: string): Promise<AgentCollaboration[]> {
    try {
      const collaborations = Array.from(this.activeCollaborations.values())
        .filter(collab => collab.participantAgentIds.includes(agentId) && collab.status === 'active');
      
      console.log(`🤝 [CrossAgent] Found ${collaborations.length} active collaborations for agent ${agentId}`);
      return collaborations;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to get active collaborations for agent ${agentId}:`, error);
      return [];
    }
  }

  async updatePatternEffectiveness(patternId: string, effectiveness: number): Promise<boolean> {
    try {
      const pattern = this.sharedPatterns.get(patternId);
      if (pattern) {
        pattern.effectiveness = effectiveness;
        pattern.collaborativeMetrics.successRate = effectiveness;
        this.sharedPatterns.set(patternId, pattern);
        
        console.log(`📈 [CrossAgent] Updated effectiveness for pattern ${patternId}: ${effectiveness}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to update pattern effectiveness:`, error);
      return false;
    }
  }

  async generateCollaborativeRecommendations(agentId: string): Promise<string[]> {
    try {
      const recommendations: string[] = [];
      
      // Get shared patterns for this agent
      const sharedPatterns = await this.getSharedPatterns(agentId);
      const insights = await this.getInsights(agentId);
      
      if (sharedPatterns.length > 0) {
        recommendations.push(`Consider adopting ${sharedPatterns.length} shared patterns from other agents`);
      }
      
      if (insights.length > 0) {
        const highConfidenceInsights = insights.filter(i => i.confidence > 0.8);
        if (highConfidenceInsights.length > 0) {
          recommendations.push(`${highConfidenceInsights.length} high-confidence insights available for implementation`);
        }
      }
      
      recommendations.push('Collaborate with other agents to share successful patterns');
      recommendations.push('Contribute your successful workflows to help other agents');
      
      console.log(`💡 [CrossAgent] Generated ${recommendations.length} recommendations for agent ${agentId}`);
      return recommendations;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to generate recommendations for agent ${agentId}:`, error);
      return [];
    }
  }
}

