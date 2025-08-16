/**
 * Cross-Agent Memory Extension for Promethios
 * 
 * Enables sharing of patterns and insights across multiple agents with full governance integration.
 * Provides collaborative learning, pattern sharing, and cross-agent knowledge transfer capabilities.
 * Integrates with UniversalGovernanceAdapter for consistent governance and audit trails.
 */

import { Extension } from './Extension';
import { RecursiveMemoryExtension, PatternAnalysis, MemoryContext } from './RecursiveMemoryExtension';
import { UniversalGovernanceAdapter } from '../services/UniversalGovernanceAdapter';
import { multiAgentService } from '../services/multiAgentService';

export interface SharedPattern {
  patternId: string;
  sourceAgentId: string;
  agentIds: string[];
  sharedCount: number;
  effectiveness: number;
  lastShared: Date;
  patternData: PatternAnalysis;
  collaborativeMetrics: {
    adoptionRate: number;
    successRate: number;
    improvementSuggestions: string[];
    trustImpact: number;
    governanceApproved: boolean;
  };
  governanceData: {
    approvalTimestamp: Date;
    approvedBy: string;
    riskAssessment: 'low' | 'medium' | 'high';
    complianceFlags: string[];
  };
}

export interface CrossAgentInsight {
  insightId: string;
  sourceAgentId: string;
  targetAgentIds: string[];
  insightType: 'workflow_optimization' | 'pattern_recognition' | 'best_practice' | 'error_prevention' | 'trust_building';
  description: string;
  confidence: number;
  applicabilityScore: number;
  createdAt: Date;
  appliedAt?: Date;
  governanceValidated: boolean;
  results?: {
    improvementMeasured: boolean;
    performanceGain: number;
    trustScoreImpact: number;
    feedback: string;
    adoptionSuccess: boolean;
  };
  metadata: {
    basedOnReceipts: string[];
    contextFactors: string[];
    prerequisites: string[];
    riskFactors: string[];
  };
}

export interface AgentCollaboration {
  collaborationId: string;
  participantAgentIds: string[];
  collaborationType: 'pattern_sharing' | 'workflow_optimization' | 'knowledge_transfer' | 'problem_solving';
  startedAt: Date;
  status: 'active' | 'completed' | 'paused' | 'terminated';
  sharedPatterns: SharedPattern[];
  insights: CrossAgentInsight[];
  governanceContext: string;
  metrics: {
    totalPatterns: number;
    successfulAdoptions: number;
    averageImprovement: number;
    collaborationScore: number;
    trustScoreChanges: Record<string, number>;
    governanceViolations: number;
  };
  outcomes: {
    knowledgeTransferred: boolean;
    performanceImproved: boolean;
    trustEnhanced: boolean;
    goalAchieved: boolean;
  };
}

export interface CollaborativeLearningSession {
  sessionId: string;
  participantAgents: string[];
  learningObjective: string;
  sessionType: 'pattern_analysis' | 'workflow_optimization' | 'error_analysis' | 'best_practice_sharing';
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed';
  learningOutcomes: {
    patternsDiscovered: number;
    insightsGenerated: number;
    workflowsOptimized: number;
    trustImprovements: Record<string, number>;
  };
  governanceMetrics: {
    complianceScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    interventionsRequired: number;
  };
}

export class CrossAgentMemoryExtension extends Extension {
  private memoryExtension: RecursiveMemoryExtension;
  private universalGovernance: UniversalGovernanceAdapter;
  
  // Cross-agent storage
  private sharedPatterns: Map<string, SharedPattern> = new Map();
  private crossAgentInsights: Map<string, CrossAgentInsight[]> = new Map();
  private activeCollaborations: Map<string, AgentCollaboration> = new Map();
  private learningSessions: Map<string, CollaborativeLearningSession> = new Map();
  
  // Pattern matching and recommendation engines
  private patternMatcher: CrossAgentPatternMatcher;
  private collaborationOrchestrator: CollaborationOrchestrator;
  private insightGenerator: CrossAgentInsightGenerator;

  constructor() {
    super('CrossAgentMemoryExtension', '1.0.0');
    this.memoryExtension = new RecursiveMemoryExtension();
    this.universalGovernance = new UniversalGovernanceAdapter();
    
    this.patternMatcher = new CrossAgentPatternMatcher();
    this.collaborationOrchestrator = new CollaborationOrchestrator();
    this.insightGenerator = new CrossAgentInsightGenerator();
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🤝 [CrossAgent] Initializing Cross-Agent Memory Extension...');
      
      // Initialize dependencies
      await this.memoryExtension.initialize();
      await this.universalGovernance.initialize();
      
      // Initialize pattern matching engine
      await this.patternMatcher.initialize();
      
      // Start collaboration monitoring
      this.startCollaborationMonitoring();
      
      // Load existing collaborations and patterns
      await this.loadExistingCollaborations();
      
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
      
      // Validate pattern sharing through governance
      const governanceApproval = await this.universalGovernance.shareAgentPattern(sourceAgentId, targetAgentIds, pattern);
      
      if (!governanceApproval) {
        throw new Error('Pattern sharing not approved by governance');
      }
      
      const sharedPattern: SharedPattern = {
        patternId: pattern.patternId,
        sourceAgentId,
        agentIds: [sourceAgentId, ...targetAgentIds],
        sharedCount: targetAgentIds.length,
        effectiveness: pattern.confidence,
        lastShared: new Date(),
        patternData: pattern,
        collaborativeMetrics: {
          adoptionRate: 0,
          successRate: 0,
          improvementSuggestions: [],
          trustImpact: 0,
          governanceApproved: true
        },
        governanceData: {
          approvalTimestamp: new Date(),
          approvedBy: 'universal_governance',
          riskAssessment: this.assessPatternRisk(pattern),
          complianceFlags: []
        }
      };
      
      this.sharedPatterns.set(pattern.patternId, sharedPattern);
      
      // Create multi-agent context for pattern sharing if needed
      await this.ensureCollaborationContext(sourceAgentId, targetAgentIds, 'pattern_sharing');
      
      // Notify target agents about new shared pattern
      await this.notifyAgentsOfSharedPattern(sharedPattern);
      
      console.log(`✅ [CrossAgent] Pattern ${pattern.patternId} shared successfully`);
      return sharedPattern;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to share pattern:`, error);
      throw error;
    }
  }

  async getSharedPatterns(agentId: string): Promise<SharedPattern[]> {
    try {
      // Get patterns from UniversalGovernanceAdapter
      const governancePatterns = await this.universalGovernance.getSharedPatterns(agentId);
      
      // Combine with local patterns
      const localPatterns = Array.from(this.sharedPatterns.values())
        .filter(pattern => pattern.agentIds.includes(agentId));
      
      // Merge and deduplicate
      const allPatterns = [...governancePatterns, ...localPatterns];
      const uniquePatterns = allPatterns.reduce((acc, pattern) => {
        acc.set(pattern.patternId, pattern);
        return acc;
      }, new Map());
      
      const patterns = Array.from(uniquePatterns.values());
      
      console.log(`📋 [CrossAgent] Found ${patterns.length} shared patterns for agent ${agentId}`);
      return patterns;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to get shared patterns for agent ${agentId}:`, error);
      return [];
    }
  }

  async createInsight(sourceAgentId: string, targetAgentIds: string[], insight: Omit<CrossAgentInsight, 'insightId' | 'sourceAgentId' | 'targetAgentIds' | 'createdAt' | 'governanceValidated'>): Promise<CrossAgentInsight> {
    try {
      console.log(`💡 [CrossAgent] Creating insight from ${sourceAgentId} for ${targetAgentIds.length} agents`);
      
      // Validate insight through governance
      const governanceValidation = await this.universalGovernance.validateCollaborativeDecision({
        contextId: `insight_${Date.now()}`,
        participatingAgents: [sourceAgentId, ...targetAgentIds],
        decisionType: 'insight_sharing',
        content: insight
      });
      
      const crossAgentInsight: CrossAgentInsight = {
        insightId: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceAgentId,
        targetAgentIds,
        createdAt: new Date(),
        governanceValidated: governanceValidation.approved,
        ...insight
      };
      
      // Store insight for each target agent
      for (const targetAgentId of targetAgentIds) {
        const existingInsights = this.crossAgentInsights.get(targetAgentId) || [];
        existingInsights.push(crossAgentInsight);
        this.crossAgentInsights.set(targetAgentId, existingInsights);
      }
      
      // Update trust scores based on insight sharing
      if (governanceValidation.approved) {
        for (const targetAgentId of targetAgentIds) {
          await this.universalGovernance.updateAgentTrustScore(
            sourceAgentId, 
            targetAgentId, 
            0.05, 
            'Shared valuable insight'
          );
        }
      }
      
      console.log(`💡 [CrossAgent] Created insight ${crossAgentInsight.insightId}`);
      return crossAgentInsight;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to create insight:`, error);
      throw error;
    }
  }

  async getInsights(agentId: string): Promise<CrossAgentInsight[]> {
    try {
      const insights = this.crossAgentInsights.get(agentId) || [];
      
      // Filter by governance validation
      const validatedInsights = insights.filter(insight => insight.governanceValidated);
      
      console.log(`💡 [CrossAgent] Found ${validatedInsights.length} validated insights for agent ${agentId}`);
      return validatedInsights;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to get insights for agent ${agentId}:`, error);
      return [];
    }
  }

  async startCollaboration(agentIds: string[], collaborationType: AgentCollaboration['collaborationType'], objective?: string): Promise<AgentCollaboration> {
    try {
      console.log(`🤝 [CrossAgent] Starting collaboration with ${agentIds.length} agents`);
      
      // Create multi-agent context through governance
      const context = await this.universalGovernance.createMultiAgentContext({
        name: `${collaborationType}_collaboration_${Date.now()}`,
        agentIds,
        collaborationModel: collaborationType,
        governanceEnabled: true
      });
      
      const collaboration: AgentCollaboration = {
        collaborationId: context.context_id,
        participantAgentIds: agentIds,
        collaborationType,
        startedAt: new Date(),
        status: 'active',
        sharedPatterns: [],
        insights: [],
        governanceContext: context.context_id,
        metrics: {
          totalPatterns: 0,
          successfulAdoptions: 0,
          averageImprovement: 0,
          collaborationScore: 0,
          trustScoreChanges: {},
          governanceViolations: 0
        },
        outcomes: {
          knowledgeTransferred: false,
          performanceImproved: false,
          trustEnhanced: false,
          goalAchieved: false
        }
      };
      
      this.activeCollaborations.set(collaboration.collaborationId, collaboration);
      
      // Initialize trust relationships
      await this.initializeTrustRelationships(agentIds);
      
      console.log(`🤝 [CrossAgent] Started collaboration ${collaboration.collaborationId}`);
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

  async updatePatternEffectiveness(patternId: string, effectiveness: number, agentId: string): Promise<boolean> {
    try {
      const pattern = this.sharedPatterns.get(patternId);
      if (pattern) {
        pattern.effectiveness = effectiveness;
        pattern.collaborativeMetrics.successRate = effectiveness;
        
        // Update trust score based on pattern effectiveness
        if (effectiveness > 0.8) {
          await this.universalGovernance.updateAgentTrustScore(
            pattern.sourceAgentId,
            agentId,
            0.1,
            'High-effectiveness pattern adoption'
          );
        }
        
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
      
      // Get agent's memory context
      const memoryContext = await this.memoryExtension.getMemoryContext(agentId, 'current');
      if (!memoryContext) return recommendations;
      
      // Get shared patterns
      const sharedPatterns = await this.getSharedPatterns(agentId);
      const insights = await this.getInsights(agentId);
      
      // Get trust relationships
      const trustRelationships = await this.universalGovernance.getAgentTrustRelationships(agentId);
      
      // Generate recommendations based on patterns
      if (sharedPatterns.length > 0) {
        const highEffectivenessPatterns = sharedPatterns.filter(p => p.effectiveness > 0.8);
        if (highEffectivenessPatterns.length > 0) {
          recommendations.push(`Consider adopting ${highEffectivenessPatterns.length} high-effectiveness patterns from trusted agents`);
        }
      }
      
      // Generate recommendations based on insights
      if (insights.length > 0) {
        const highConfidenceInsights = insights.filter(i => i.confidence > 0.8 && i.governanceValidated);
        if (highConfidenceInsights.length > 0) {
          recommendations.push(`${highConfidenceInsights.length} high-confidence insights available for implementation`);
        }
      }
      
      // Generate recommendations based on trust relationships
      const highTrustAgents = trustRelationships.filter(r => r.trustScore > 0.8);
      if (highTrustAgents.length > 0) {
        recommendations.push(`Collaborate with ${highTrustAgents.length} high-trust agents for knowledge sharing`);
      }
      
      // Generate recommendations based on collaboration opportunities
      const collaborationOpportunities = await this.identifyCollaborationOpportunities(agentId);
      recommendations.push(...collaborationOpportunities);
      
      console.log(`💡 [CrossAgent] Generated ${recommendations.length} recommendations for agent ${agentId}`);
      return recommendations;
    } catch (error) {
      console.error(`❌ [CrossAgent] Failed to generate recommendations for agent ${agentId}:`, error);
      return [];
    }
  }

  // Private helper methods
  private async loadExistingCollaborations(): Promise<void> {
    console.log('📂 [CrossAgent] Loading existing collaborations...');
    // In a real implementation, this would load from persistent storage
  }

  private startCollaborationMonitoring(): void {
    // Monitor collaborations every 5 minutes
    setInterval(async () => {
      for (const [collaborationId, collaboration] of this.activeCollaborations) {
        await this.updateCollaborationMetrics(collaboration);
      }
    }, 300000); // 5 minutes
  }

  private async ensureCollaborationContext(sourceAgentId: string, targetAgentIds: string[], type: string): Promise<string> {
    try {
      // Check if collaboration context already exists
      const existingCollaboration = Array.from(this.activeCollaborations.values())
        .find(collab => 
          collab.participantAgentIds.includes(sourceAgentId) &&
          targetAgentIds.every(id => collab.participantAgentIds.includes(id))
        );
      
      if (existingCollaboration) {
        return existingCollaboration.collaborationId;
      }
      
      // Create new collaboration context
      const collaboration = await this.startCollaboration([sourceAgentId, ...targetAgentIds], 'pattern_sharing');
      return collaboration.collaborationId;
    } catch (error) {
      console.error('❌ [CrossAgent] Failed to ensure collaboration context:', error);
      return '';
    }
  }

  private async notifyAgentsOfSharedPattern(sharedPattern: SharedPattern): Promise<void> {
    try {
      for (const agentId of sharedPattern.agentIds) {
        if (agentId !== sharedPattern.sourceAgentId) {
          await this.universalGovernance.sendMultiAgentMessage({
            contextId: sharedPattern.patternId,
            fromAgentId: sharedPattern.sourceAgentId,
            toAgentIds: [agentId],
            message: {
              type: 'pattern_shared',
              patternId: sharedPattern.patternId,
              description: `New pattern available: ${sharedPattern.patternData.patternType}`,
              effectiveness: sharedPattern.effectiveness
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ [CrossAgent] Failed to notify agents of shared pattern:', error);
    }
  }

  private assessPatternRisk(pattern: PatternAnalysis): 'low' | 'medium' | 'high' {
    if (pattern.metadata.complexity > 7 || pattern.metadata.errorPatterns.length > 0) {
      return 'high';
    } else if (pattern.metadata.complexity > 4 || pattern.confidence < 0.7) {
      return 'medium';
    }
    return 'low';
  }

  private async initializeTrustRelationships(agentIds: string[]): Promise<void> {
    try {
      for (let i = 0; i < agentIds.length; i++) {
        for (let j = i + 1; j < agentIds.length; j++) {
          const agentA = agentIds[i];
          const agentB = agentIds[j];
          
          // Initialize bidirectional trust relationships
          await this.universalGovernance.updateAgentTrustScore(agentA, agentB, 0.5, 'Initial collaboration trust');
          await this.universalGovernance.updateAgentTrustScore(agentB, agentA, 0.5, 'Initial collaboration trust');
        }
      }
    } catch (error) {
      console.error('❌ [CrossAgent] Failed to initialize trust relationships:', error);
    }
  }

  private async updateCollaborationMetrics(collaboration: AgentCollaboration): Promise<void> {
    try {
      // Get latest metrics from governance
      const metrics = await this.universalGovernance.getMultiAgentMetrics(collaboration.governanceContext);
      
      if (metrics) {
        collaboration.metrics.totalPatterns = collaboration.sharedPatterns.length;
        collaboration.metrics.collaborationScore = metrics.collaboration_score || 0;
        collaboration.metrics.governanceViolations = metrics.violation_count || 0;
      }
    } catch (error) {
      console.error('❌ [CrossAgent] Failed to update collaboration metrics:', error);
    }
  }

  private async identifyCollaborationOpportunities(agentId: string): Promise<string[]> {
    const opportunities: string[] = [];
    
    try {
      // Get agent's memory context to understand capabilities
      const memoryContext = await this.memoryExtension.getMemoryContext(agentId, 'current');
      if (!memoryContext) return opportunities;
      
      // Find agents with complementary patterns
      const agentPatterns = await this.memoryExtension.getPatternAnalysis(agentId);
      const complementaryAgents = await this.findComplementaryAgents(agentId, agentPatterns);
      
      if (complementaryAgents.length > 0) {
        opportunities.push(`Potential collaboration with ${complementaryAgents.length} agents with complementary skills`);
      }
      
      // Identify knowledge gaps that could be filled by other agents
      const knowledgeGaps = this.identifyKnowledgeGaps(memoryContext);
      if (knowledgeGaps.length > 0) {
        opportunities.push(`Seek collaboration to address ${knowledgeGaps.length} identified knowledge gaps`);
      }
      
    } catch (error) {
      console.error('❌ [CrossAgent] Failed to identify collaboration opportunities:', error);
    }
    
    return opportunities;
  }

  private async findComplementaryAgents(agentId: string, agentPatterns: PatternAnalysis[]): Promise<string[]> {
    // Simple implementation - in real system would use ML for pattern matching
    const complementaryAgents: string[] = [];
    
    // Find agents with different but related pattern types
    const agentPatternTypes = new Set(agentPatterns.map(p => p.patternType));
    
    for (const [patternId, sharedPattern] of this.sharedPatterns) {
      const hasComplementaryPattern = !agentPatternTypes.has(sharedPattern.patternData.patternType) &&
                                     sharedPattern.effectiveness > 0.7;
      
      if (hasComplementaryPattern && !complementaryAgents.includes(sharedPattern.sourceAgentId)) {
        complementaryAgents.push(sharedPattern.sourceAgentId);
      }
    }
    
    return complementaryAgents.filter(id => id !== agentId);
  }

  private identifyKnowledgeGaps(memoryContext: MemoryContext): string[] {
    const gaps: string[] = [];
    
    // Analyze workflow suggestions for gaps
    const lowConfidenceSuggestions = memoryContext.workflowSuggestions.filter(s => s.confidence < 0.6);
    if (lowConfidenceSuggestions.length > 0) {
      gaps.push('workflow_optimization');
    }
    
    // Analyze error patterns for gaps
    const errorPatterns = memoryContext.learnedPatterns.filter(p => p.category === 'problem_solving');
    if (errorPatterns.length < 2) {
      gaps.push('error_handling');
    }
    
    // Analyze communication patterns for gaps
    const communicationPatterns = memoryContext.learnedPatterns.filter(p => p.category === 'communication');
    if (communicationPatterns.length < 3) {
      gaps.push('communication_skills');
    }
    
    return gaps;
  }
}

// Helper classes for cross-agent functionality
class CrossAgentPatternMatcher {
  async initialize(): Promise<void> {
    console.log('🔍 [PatternMatcher] Cross-Agent Pattern Matcher initialized');
  }

  async findSimilarPatterns(pattern: PatternAnalysis, agentPatterns: Map<string, PatternAnalysis[]>): Promise<PatternAnalysis[]> {
    const similarPatterns: PatternAnalysis[] = [];
    
    for (const [agentId, patterns] of agentPatterns) {
      for (const agentPattern of patterns) {
        if (this.calculatePatternSimilarity(pattern, agentPattern) > 0.7) {
          similarPatterns.push(agentPattern);
        }
      }
    }
    
    return similarPatterns;
  }

  private calculatePatternSimilarity(pattern1: PatternAnalysis, pattern2: PatternAnalysis): number {
    // Simple similarity calculation - in real implementation would use ML
    let similarity = 0;
    
    // Pattern type similarity
    if (pattern1.patternType === pattern2.patternType) similarity += 0.4;
    
    // Tool similarity
    const tools1 = new Set(pattern1.metadata.toolsInvolved);
    const tools2 = new Set(pattern2.metadata.toolsInvolved);
    const intersection = new Set([...tools1].filter(x => tools2.has(x)));
    const union = new Set([...tools1, ...tools2]);
    similarity += (intersection.size / union.size) * 0.3;
    
    // Business impact similarity
    if (pattern1.metadata.businessImpact === pattern2.metadata.businessImpact) similarity += 0.3;
    
    return similarity;
  }
}

class CollaborationOrchestrator {
  async orchestrateCollaboration(collaboration: AgentCollaboration): Promise<void> {
    console.log(`🎭 [Orchestrator] Orchestrating collaboration ${collaboration.collaborationId}`);
    
    // Implement collaboration orchestration logic
    // This would manage the flow of pattern sharing, insight generation, etc.
  }
}

class CrossAgentInsightGenerator {
  async generateInsights(agentId: string, patterns: PatternAnalysis[], collaborationContext?: AgentCollaboration): Promise<CrossAgentInsight[]> {
    const insights: CrossAgentInsight[] = [];
    
    // Generate insights based on pattern analysis
    for (const pattern of patterns) {
      if (pattern.confidence > 0.8 && pattern.frequency > 5) {
        insights.push({
          insightId: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceAgentId: agentId,
          targetAgentIds: collaborationContext?.participantAgentIds.filter(id => id !== agentId) || [],
          insightType: 'pattern_recognition',
          description: `High-confidence pattern identified: ${pattern.patternType}`,
          confidence: pattern.confidence,
          applicabilityScore: 0.8,
          createdAt: new Date(),
          governanceValidated: false,
          metadata: {
            basedOnReceipts: [],
            contextFactors: pattern.metadata.toolsInvolved,
            prerequisites: [],
            riskFactors: pattern.metadata.errorPatterns
          }
        });
      }
    }
    
    return insights;
  }
}

