/**
 * AgentNegotiationService - Inter-agent negotiation and collaboration management
 * Part of the revolutionary multi-agent autonomous research system
 */

import { UnifiedStorageService } from './UnifiedStorageService';
import { TokenEconomicsService } from './TokenEconomicsService';
import { ModelPricingService } from './ModelPricingService';

export interface NegotiationProposal {
  proposalId: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
  proposal: {
    taskAllocation: {
      primaryResponsibility: string;
      supportingTasks: string[];
      estimatedEffort: number; // 0-1
    };
    resourceRequirements: {
      estimatedTokens: number;
      estimatedCost: number;
      maxResponseTime: number; // seconds
      qualityGuarantee: number; // 1-10
    };
    collaboration: {
      willingToLead: boolean;
      preferredPartners: string[];
      communicationStyle: 'direct' | 'collaborative' | 'supportive';
      conflictResolution: 'defer' | 'negotiate' | 'compete';
    };
    valueProposition: {
      uniqueContribution: string;
      expectedOutcome: string;
      riskMitigation: string[];
      successMetrics: string[];
    };
  };
  conditions: {
    mustHavePartners: string[];
    cannotWorkWith: string[];
    requiresMinBudget: number;
    requiresMaxLatency: number;
  };
  flexibility: {
    costFlexibility: number; // 0-1, how much cost can vary
    timeFlexibility: number; // 0-1, how much time can vary
    qualityFlexibility: number; // 0-1, how much quality can vary
    taskFlexibility: number; // 0-1, how flexible on task allocation
  };
}

export interface NegotiationRound {
  roundId: string;
  roundNumber: number;
  timestamp: Date;
  proposals: NegotiationProposal[];
  conflicts: Array<{
    conflictId: string;
    type: 'resource' | 'responsibility' | 'quality' | 'timeline';
    description: string;
    involvedAgents: string[];
    severity: 'low' | 'medium' | 'high';
    suggestedResolution: string;
  }>;
  consensus: {
    agreedPoints: string[];
    disputedPoints: string[];
    compromiseNeeded: string[];
  };
  nextActions: Array<{
    action: 'revise_proposal' | 'accept_terms' | 'escalate' | 'withdraw';
    agentId: string;
    reasoning: string;
    deadline: Date;
  }>;
}

export interface NegotiationOutcome {
  outcomeId: string;
  negotiationId: string;
  status: 'success' | 'partial_success' | 'failure' | 'timeout';
  finalAgreement?: {
    participatingAgents: Array<{
      agentId: string;
      agentName: string;
      role: 'lead' | 'support' | 'specialist';
      responsibilities: string[];
      resourceAllocation: {
        budgetShare: number; // percentage
        tokenAllocation: number;
        timeAllocation: number; // minutes
      };
      qualityCommitment: number; // 1-10
      deliverables: string[];
    }>;
    totalBudget: number;
    totalTimeEstimate: number;
    qualityTarget: number;
    successCriteria: string[];
    contingencyPlans: Array<{
      scenario: string;
      response: string;
      responsibleAgent: string;
    }>;
    reviewMilestones: Array<{
      milestone: string;
      deadline: Date;
      reviewCriteria: string[];
    }>;
  };
  negotiationMetrics: {
    totalRounds: number;
    totalDuration: number; // minutes
    consensusReached: number; // percentage
    compromisesRequired: number;
    agentSatisfaction: Record<string, number>; // 1-10 per agent
  };
  lessonsLearned: {
    successFactors: string[];
    challenges: string[];
    improvements: string[];
  };
}

export interface AgentNegotiationCapabilities {
  agentId: string;
  agentName: string;
  negotiationStyle: {
    assertiveness: number; // 0-1
    cooperativeness: number; // 0-1
    flexibility: number; // 0-1
    riskTolerance: number; // 0-1
  };
  specializations: string[];
  preferredRoles: Array<'lead' | 'support' | 'specialist' | 'mediator'>;
  collaborationHistory: Array<{
    partnerId: string;
    successRate: number; // 0-1
    avgSatisfaction: number; // 1-10
    commonTasks: string[];
  }>;
  negotiationHistory: {
    totalNegotiations: number;
    successRate: number;
    avgRounds: number;
    avgSatisfaction: number;
    strongestSkills: string[];
    improvementAreas: string[];
  };
}

export class AgentNegotiationService {
  private static instance: AgentNegotiationService;
  private storage: UnifiedStorageService;
  private tokenEconomics: TokenEconomicsService;
  private modelPricing: ModelPricingService;
  private activeNegotiations = new Map<string, {
    negotiationId: string;
    topic: string;
    participants: string[];
    rounds: NegotiationRound[];
    status: 'active' | 'completed' | 'failed';
    startTime: Date;
    deadline?: Date;
  }>();
  private agentCapabilities = new Map<string, AgentNegotiationCapabilities>();

  private constructor() {
    this.storage = UnifiedStorageService.getInstance();
    this.tokenEconomics = TokenEconomicsService.getInstance();
    this.modelPricing = ModelPricingService.getInstance();
    this.initializeService();
  }

  public static getInstance(): AgentNegotiationService {
    if (!AgentNegotiationService.instance) {
      AgentNegotiationService.instance = new AgentNegotiationService();
    }
    return AgentNegotiationService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('🤝 [AgentNegotiation] Initializing Agent Negotiation Service');
      
      // Load agent capabilities and negotiation history
      await this.loadAgentCapabilities();
      await this.loadActiveNegotiations();
      
      console.log('✅ [AgentNegotiation] Service initialized successfully');
    } catch (error) {
      console.error('❌ [AgentNegotiation] Error initializing service:', error);
    }
  }

  /**
   * Start a new negotiation between agents
   */
  public async startNegotiation(
    topic: string,
    participantAgents: Array<{
      agentId: string;
      agentName: string;
      model: string;
      specialization: string[];
    }>,
    constraints: {
      maxBudget: number;
      maxTime: number; // minutes
      qualityRequirement: number; // 1-10
      deadline?: Date;
    },
    context: {
      sessionId: string;
      userId: string;
      originalMessage: string;
      priority: 'low' | 'medium' | 'high';
    }
  ): Promise<string> {
    const negotiationId = `negotiation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🤝 [AgentNegotiation] Starting negotiation:', negotiationId, 'with', participantAgents.length, 'agents');

    // Generate initial proposals from each agent
    const initialProposals: NegotiationProposal[] = [];
    
    for (const agent of participantAgents) {
      const proposal = await this.generateInitialProposal(agent, topic, constraints, context);
      initialProposals.push(proposal);
    }

    // Create first negotiation round
    const firstRound: NegotiationRound = {
      roundId: `round_${negotiationId}_1`,
      roundNumber: 1,
      timestamp: new Date(),
      proposals: initialProposals,
      conflicts: await this.identifyConflicts(initialProposals),
      consensus: await this.analyzeConsensus(initialProposals),
      nextActions: await this.determineNextActions(initialProposals, constraints)
    };

    // Store negotiation
    const negotiation = {
      negotiationId,
      topic,
      participants: participantAgents.map(a => a.agentId),
      rounds: [firstRound],
      status: 'active' as const,
      startTime: new Date(),
      deadline: constraints.deadline
    };

    this.activeNegotiations.set(negotiationId, negotiation);
    await this.storage.set('agent_negotiations', negotiationId, negotiation);

    console.log('✅ [AgentNegotiation] Negotiation started with', firstRound.conflicts.length, 'conflicts identified');
    return negotiationId;
  }

  /**
   * Process a negotiation round
   */
  public async processNegotiationRound(
    negotiationId: string,
    agentResponses: Array<{
      agentId: string;
      action: 'revise_proposal' | 'accept_terms' | 'escalate' | 'withdraw';
      revisedProposal?: Partial<NegotiationProposal>;
      reasoning: string;
    }>
  ): Promise<{
    roundComplete: boolean;
    negotiationComplete: boolean;
    outcome?: NegotiationOutcome;
    nextRound?: NegotiationRound;
  }> {
    const negotiation = this.activeNegotiations.get(negotiationId);
    if (!negotiation) {
      throw new Error(`Negotiation not found: ${negotiationId}`);
    }

    console.log('🔄 [AgentNegotiation] Processing round', negotiation.rounds.length + 1, 'for negotiation:', negotiationId);

    // Check if any agents withdrew
    const withdrawnAgents = agentResponses.filter(r => r.action === 'withdraw');
    if (withdrawnAgents.length > 0) {
      console.log('⚠️ [AgentNegotiation] Agents withdrew:', withdrawnAgents.map(a => a.agentId));
      
      // If too many agents withdrew, fail the negotiation
      if (withdrawnAgents.length >= negotiation.participants.length - 1) {
        const outcome = await this.createFailureOutcome(negotiationId, 'insufficient_participants');
        return { roundComplete: true, negotiationComplete: true, outcome };
      }
    }

    // Process revised proposals
    const activeResponses = agentResponses.filter(r => r.action !== 'withdraw');
    const newProposals: NegotiationProposal[] = [];

    for (const response of activeResponses) {
      if (response.action === 'revise_proposal' && response.revisedProposal) {
        const existingProposal = negotiation.rounds[negotiation.rounds.length - 1].proposals
          .find(p => p.agentId === response.agentId);
        
        if (existingProposal) {
          const revisedProposal: NegotiationProposal = {
            ...existingProposal,
            ...response.revisedProposal,
            proposalId: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
          };
          newProposals.push(revisedProposal);
        }
      } else if (response.action === 'accept_terms') {
        // Keep existing proposal
        const existingProposal = negotiation.rounds[negotiation.rounds.length - 1].proposals
          .find(p => p.agentId === response.agentId);
        if (existingProposal) {
          newProposals.push(existingProposal);
        }
      }
    }

    // Create new round
    const newRound: NegotiationRound = {
      roundId: `round_${negotiationId}_${negotiation.rounds.length + 1}`,
      roundNumber: negotiation.rounds.length + 1,
      timestamp: new Date(),
      proposals: newProposals,
      conflicts: await this.identifyConflicts(newProposals),
      consensus: await this.analyzeConsensus(newProposals),
      nextActions: await this.determineNextActions(newProposals, { maxBudget: 0, maxTime: 0, qualityRequirement: 0 }) // Simplified
    };

    negotiation.rounds.push(newRound);

    // Check if negotiation is complete
    const allAccepted = activeResponses.every(r => r.action === 'accept_terms');
    const consensusReached = newRound.consensus.disputedPoints.length === 0;
    const maxRoundsReached = negotiation.rounds.length >= 5; // Max 5 rounds

    if (allAccepted && consensusReached) {
      // Success!
      const outcome = await this.createSuccessOutcome(negotiationId, newRound);
      negotiation.status = 'completed';
      await this.storage.set('agent_negotiations', negotiationId, negotiation);
      
      console.log('🎉 [AgentNegotiation] Negotiation successful:', negotiationId);
      return { roundComplete: true, negotiationComplete: true, outcome };
    } else if (maxRoundsReached || (negotiation.deadline && new Date() > negotiation.deadline)) {
      // Timeout or max rounds
      const outcome = await this.createTimeoutOutcome(negotiationId);
      negotiation.status = 'failed';
      await this.storage.set('agent_negotiations', negotiationId, negotiation);
      
      console.log('⏰ [AgentNegotiation] Negotiation timed out:', negotiationId);
      return { roundComplete: true, negotiationComplete: true, outcome };
    } else {
      // Continue negotiation
      await this.storage.set('agent_negotiations', negotiationId, negotiation);
      
      console.log('🔄 [AgentNegotiation] Negotiation continues, round', newRound.roundNumber, 'complete');
      return { roundComplete: true, negotiationComplete: false, nextRound: newRound };
    }
  }

  /**
   * Get negotiation status and recommendations
   */
  public async getNegotiationStatus(negotiationId: string): Promise<{
    negotiation: any;
    currentRound: NegotiationRound;
    recommendations: Array<{
      type: 'mediation' | 'compromise' | 'escalation' | 'timeout';
      description: string;
      suggestedAction: string;
      urgency: 'low' | 'medium' | 'high';
    }>;
    predictedOutcome: {
      successProbability: number;
      estimatedRounds: number;
      keyRisks: string[];
      successFactors: string[];
    };
  }> {
    const negotiation = this.activeNegotiations.get(negotiationId);
    if (!negotiation) {
      throw new Error(`Negotiation not found: ${negotiationId}`);
    }

    const currentRound = negotiation.rounds[negotiation.rounds.length - 1];
    const recommendations = await this.generateRecommendations(negotiation, currentRound);
    const predictedOutcome = await this.predictNegotiationOutcome(negotiation);

    return {
      negotiation,
      currentRound,
      recommendations,
      predictedOutcome
    };
  }

  /**
   * Mediate conflicts between agents
   */
  public async mediateConflict(
    negotiationId: string,
    conflictId: string,
    mediationStrategy: 'compromise' | 'priority_based' | 'resource_reallocation' | 'task_redistribution'
  ): Promise<{
    mediationResult: {
      success: boolean;
      proposedSolution: string;
      affectedAgents: string[];
      tradeoffs: string[];
    };
    updatedProposals: NegotiationProposal[];
  }> {
    console.log('⚖️ [AgentNegotiation] Mediating conflict:', conflictId, 'with strategy:', mediationStrategy);

    const negotiation = this.activeNegotiations.get(negotiationId);
    if (!negotiation) {
      throw new Error(`Negotiation not found: ${negotiationId}`);
    }

    const currentRound = negotiation.rounds[negotiation.rounds.length - 1];
    const conflict = currentRound.conflicts.find(c => c.conflictId === conflictId);
    
    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    // Apply mediation strategy
    const mediationResult = await this.applyMediationStrategy(conflict, mediationStrategy, currentRound.proposals);
    
    // Generate updated proposals based on mediation
    const updatedProposals = await this.generateMediatedProposals(
      currentRound.proposals,
      conflict,
      mediationResult
    );

    console.log('✅ [AgentNegotiation] Mediation', mediationResult.success ? 'successful' : 'failed');
    return { mediationResult, updatedProposals };
  }

  // Private helper methods

  private async generateInitialProposal(
    agent: { agentId: string; agentName: string; model: string; specialization: string[] },
    topic: string,
    constraints: any,
    context: any
  ): Promise<NegotiationProposal> {
    const capabilities = this.agentCapabilities.get(agent.agentId);
    const estimatedCost = this.modelPricing.estimateMessageCost(agent.model, context.originalMessage).totalCost;

    return {
      proposalId: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: agent.agentId,
      agentName: agent.agentName,
      timestamp: new Date(),
      proposal: {
        taskAllocation: {
          primaryResponsibility: this.determinePrimaryResponsibility(agent, topic),
          supportingTasks: this.determineSupportingTasks(agent, topic),
          estimatedEffort: this.estimateEffort(agent, topic, constraints)
        },
        resourceRequirements: {
          estimatedTokens: Math.ceil(context.originalMessage.length / 4) * 2,
          estimatedCost: estimatedCost * 1.5, // Add buffer
          maxResponseTime: capabilities?.negotiationStyle.flexibility || 0.5 > 0.7 ? 30 : 60,
          qualityGuarantee: Math.min(10, (capabilities?.negotiationHistory.avgSatisfaction || 7) + 1)
        },
        collaboration: {
          willingToLead: capabilities?.preferredRoles.includes('lead') || false,
          preferredPartners: this.getPreferredPartners(agent.agentId),
          communicationStyle: this.determineCommunicationStyle(capabilities),
          conflictResolution: this.determineConflictResolution(capabilities)
        },
        valueProposition: {
          uniqueContribution: `Specialized ${agent.specialization.join(', ')} expertise`,
          expectedOutcome: `High-quality analysis with ${agent.specialization[0] || 'general'} focus`,
          riskMitigation: ['Quality assurance', 'Timely delivery', 'Cost control'],
          successMetrics: ['User satisfaction > 8/10', 'Response time < 60s', 'Cost within budget']
        }
      },
      conditions: {
        mustHavePartners: [],
        cannotWorkWith: [],
        requiresMinBudget: estimatedCost,
        requiresMaxLatency: 120
      },
      flexibility: {
        costFlexibility: capabilities?.negotiationStyle.flexibility || 0.5,
        timeFlexibility: capabilities?.negotiationStyle.flexibility || 0.5,
        qualityFlexibility: Math.max(0.1, (capabilities?.negotiationStyle.flexibility || 0.5) - 0.2),
        taskFlexibility: capabilities?.negotiationStyle.cooperativeness || 0.6
      }
    };
  }

  private async identifyConflicts(proposals: NegotiationProposal[]): Promise<any[]> {
    const conflicts = [];
    
    // Check for resource conflicts
    const totalCost = proposals.reduce((sum, p) => sum + p.proposal.resourceRequirements.estimatedCost, 0);
    if (totalCost > 0.1) { // Simplified budget check
      conflicts.push({
        conflictId: `conflict_${Date.now()}_cost`,
        type: 'resource',
        description: `Total estimated cost ($${totalCost.toFixed(4)}) may exceed budget`,
        involvedAgents: proposals.map(p => p.agentId),
        severity: 'medium',
        suggestedResolution: 'Reduce scope or negotiate cost sharing'
      });
    }

    // Check for responsibility overlaps
    const responsibilities = proposals.map(p => p.proposal.taskAllocation.primaryResponsibility);
    const duplicates = responsibilities.filter((item, index) => responsibilities.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      conflicts.push({
        conflictId: `conflict_${Date.now()}_responsibility`,
        type: 'responsibility',
        description: `Multiple agents claiming same primary responsibility: ${duplicates.join(', ')}`,
        involvedAgents: proposals.filter(p => duplicates.includes(p.proposal.taskAllocation.primaryResponsibility)).map(p => p.agentId),
        severity: 'high',
        suggestedResolution: 'Clarify role boundaries and specialization areas'
      });
    }

    return conflicts;
  }

  private async analyzeConsensus(proposals: NegotiationProposal[]): Promise<any> {
    const agreedPoints = [];
    const disputedPoints = [];
    const compromiseNeeded = [];

    // Analyze quality guarantees
    const qualityGuarantees = proposals.map(p => p.proposal.resourceRequirements.qualityGuarantee);
    const avgQuality = qualityGuarantees.reduce((sum, q) => sum + q, 0) / qualityGuarantees.length;
    const qualityVariance = Math.max(...qualityGuarantees) - Math.min(...qualityGuarantees);

    if (qualityVariance <= 1) {
      agreedPoints.push(`Quality targets aligned (avg: ${avgQuality.toFixed(1)})`);
    } else {
      disputedPoints.push(`Quality expectations vary significantly (${Math.min(...qualityGuarantees)}-${Math.max(...qualityGuarantees)})`);
      compromiseNeeded.push('Standardize quality expectations');
    }

    // Analyze cost expectations
    const costs = proposals.map(p => p.proposal.resourceRequirements.estimatedCost);
    const totalCost = costs.reduce((sum, c) => sum + c, 0);
    
    if (totalCost <= 0.05) { // Simplified budget check
      agreedPoints.push('Cost expectations within reasonable range');
    } else {
      disputedPoints.push('Total cost may be too high');
      compromiseNeeded.push('Optimize cost allocation');
    }

    return { agreedPoints, disputedPoints, compromiseNeeded };
  }

  private async determineNextActions(proposals: NegotiationProposal[], constraints: any): Promise<any[]> {
    const actions = [];

    for (const proposal of proposals) {
      if (proposal.proposal.resourceRequirements.estimatedCost > constraints.maxBudget * 0.4) {
        actions.push({
          action: 'revise_proposal',
          agentId: proposal.agentId,
          reasoning: 'Cost too high, need to optimize',
          deadline: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        });
      } else {
        actions.push({
          action: 'accept_terms',
          agentId: proposal.agentId,
          reasoning: 'Proposal within acceptable parameters',
          deadline: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });
      }
    }

    return actions;
  }

  private async createSuccessOutcome(negotiationId: string, finalRound: NegotiationRound): Promise<NegotiationOutcome> {
    const negotiation = this.activeNegotiations.get(negotiationId);
    if (!negotiation) throw new Error('Negotiation not found');

    return {
      outcomeId: `outcome_${negotiationId}`,
      negotiationId,
      status: 'success',
      finalAgreement: {
        participatingAgents: finalRound.proposals.map((proposal, index) => ({
          agentId: proposal.agentId,
          agentName: proposal.agentName,
          role: index === 0 ? 'lead' : 'support',
          responsibilities: [proposal.proposal.taskAllocation.primaryResponsibility, ...proposal.proposal.taskAllocation.supportingTasks],
          resourceAllocation: {
            budgetShare: (proposal.proposal.resourceRequirements.estimatedCost / finalRound.proposals.reduce((sum, p) => sum + p.proposal.resourceRequirements.estimatedCost, 0)) * 100,
            tokenAllocation: proposal.proposal.resourceRequirements.estimatedTokens,
            timeAllocation: proposal.proposal.resourceRequirements.maxResponseTime
          },
          qualityCommitment: proposal.proposal.resourceRequirements.qualityGuarantee,
          deliverables: proposal.proposal.valueProposition.successMetrics
        })),
        totalBudget: finalRound.proposals.reduce((sum, p) => sum + p.proposal.resourceRequirements.estimatedCost, 0),
        totalTimeEstimate: Math.max(...finalRound.proposals.map(p => p.proposal.resourceRequirements.maxResponseTime)),
        qualityTarget: finalRound.proposals.reduce((sum, p) => sum + p.proposal.resourceRequirements.qualityGuarantee, 0) / finalRound.proposals.length,
        successCriteria: ['All agents deliver on commitments', 'Quality targets met', 'Budget not exceeded'],
        contingencyPlans: [{
          scenario: 'Agent unavailable',
          response: 'Redistribute workload among remaining agents',
          responsibleAgent: finalRound.proposals[0].agentId
        }],
        reviewMilestones: [{
          milestone: 'Initial response delivered',
          deadline: new Date(Date.now() + 5 * 60 * 1000),
          reviewCriteria: ['Response quality', 'Timeliness', 'Cost efficiency']
        }]
      },
      negotiationMetrics: {
        totalRounds: negotiation.rounds.length,
        totalDuration: (new Date().getTime() - negotiation.startTime.getTime()) / (1000 * 60),
        consensusReached: 100,
        compromisesRequired: negotiation.rounds.reduce((sum, r) => sum + r.consensus.compromiseNeeded.length, 0),
        agentSatisfaction: Object.fromEntries(finalRound.proposals.map(p => [p.agentId, 8])) // Simplified
      },
      lessonsLearned: {
        successFactors: ['Clear communication', 'Flexible proposals', 'Reasonable expectations'],
        challenges: ['Resource allocation', 'Quality alignment'],
        improvements: ['Better initial proposals', 'Faster consensus building']
      }
    };
  }

  private async createFailureOutcome(negotiationId: string, reason: string): Promise<NegotiationOutcome> {
    const negotiation = this.activeNegotiations.get(negotiationId);
    if (!negotiation) throw new Error('Negotiation not found');

    return {
      outcomeId: `outcome_${negotiationId}`,
      negotiationId,
      status: 'failure',
      negotiationMetrics: {
        totalRounds: negotiation.rounds.length,
        totalDuration: (new Date().getTime() - negotiation.startTime.getTime()) / (1000 * 60),
        consensusReached: 0,
        compromisesRequired: 0,
        agentSatisfaction: {}
      },
      lessonsLearned: {
        successFactors: [],
        challenges: [reason, 'Insufficient collaboration'],
        improvements: ['Better agent selection', 'Clearer initial requirements']
      }
    };
  }

  private async createTimeoutOutcome(negotiationId: string): Promise<NegotiationOutcome> {
    return this.createFailureOutcome(negotiationId, 'Negotiation timeout');
  }

  private async generateRecommendations(negotiation: any, currentRound: NegotiationRound): Promise<any[]> {
    const recommendations = [];

    if (currentRound.conflicts.length > 2) {
      recommendations.push({
        type: 'mediation',
        description: 'Multiple conflicts detected',
        suggestedAction: 'Consider automated mediation',
        urgency: 'high'
      });
    }

    if (negotiation.rounds.length >= 3) {
      recommendations.push({
        type: 'compromise',
        description: 'Negotiation taking too long',
        suggestedAction: 'Suggest compromise solutions',
        urgency: 'medium'
      });
    }

    return recommendations;
  }

  private async predictNegotiationOutcome(negotiation: any): Promise<any> {
    const conflictCount = negotiation.rounds[negotiation.rounds.length - 1].conflicts.length;
    const roundCount = negotiation.rounds.length;
    
    let successProbability = 0.8;
    if (conflictCount > 2) successProbability -= 0.3;
    if (roundCount > 3) successProbability -= 0.2;

    return {
      successProbability: Math.max(0.1, successProbability),
      estimatedRounds: Math.max(1, 5 - roundCount),
      keyRisks: conflictCount > 0 ? ['Resource conflicts', 'Timeline pressure'] : ['Minor disagreements'],
      successFactors: ['Agent flexibility', 'Clear communication']
    };
  }

  private async applyMediationStrategy(conflict: any, strategy: string, proposals: NegotiationProposal[]): Promise<any> {
    return {
      success: true,
      proposedSolution: `Apply ${strategy} to resolve ${conflict.type} conflict`,
      affectedAgents: conflict.involvedAgents,
      tradeoffs: ['Reduced individual autonomy', 'Faster resolution']
    };
  }

  private async generateMediatedProposals(
    originalProposals: NegotiationProposal[],
    conflict: any,
    mediationResult: any
  ): Promise<NegotiationProposal[]> {
    // Simplified: return original proposals with minor adjustments
    return originalProposals.map(proposal => ({
      ...proposal,
      proposalId: `mediated_${proposal.proposalId}`,
      timestamp: new Date(),
      flexibility: {
        ...proposal.flexibility,
        costFlexibility: Math.min(1, proposal.flexibility.costFlexibility + 0.1),
        taskFlexibility: Math.min(1, proposal.flexibility.taskFlexibility + 0.1)
      }
    }));
  }

  // Helper methods for proposal generation
  private determinePrimaryResponsibility(agent: any, topic: string): string {
    if (agent.specialization.includes('analysis')) return 'Data analysis and insights';
    if (agent.specialization.includes('creative')) return 'Creative content generation';
    if (agent.specialization.includes('technical')) return 'Technical implementation';
    return 'General research and analysis';
  }

  private determineSupportingTasks(agent: any, topic: string): string[] {
    return ['Quality review', 'Documentation', 'User communication'];
  }

  private estimateEffort(agent: any, topic: string, constraints: any): number {
    return Math.random() * 0.4 + 0.3; // 30-70% effort
  }

  private getPreferredPartners(agentId: string): string[] {
    const capabilities = this.agentCapabilities.get(agentId);
    return capabilities?.collaborationHistory
      .filter(h => h.successRate > 0.7)
      .map(h => h.partnerId) || [];
  }

  private determineCommunicationStyle(capabilities?: AgentNegotiationCapabilities): 'direct' | 'collaborative' | 'supportive' {
    if (!capabilities) return 'collaborative';
    
    if (capabilities.negotiationStyle.assertiveness > 0.7) return 'direct';
    if (capabilities.negotiationStyle.cooperativeness > 0.7) return 'supportive';
    return 'collaborative';
  }

  private determineConflictResolution(capabilities?: AgentNegotiationCapabilities): 'defer' | 'negotiate' | 'compete' {
    if (!capabilities) return 'negotiate';
    
    if (capabilities.negotiationStyle.assertiveness > 0.8) return 'compete';
    if (capabilities.negotiationStyle.cooperativeness > 0.8) return 'defer';
    return 'negotiate';
  }

  private async loadAgentCapabilities(): Promise<void> {
    try {
      console.log('🤝 [AgentNegotiation] Loading agent capabilities...');
      // In production, load from storage
    } catch (error) {
      console.error('❌ [AgentNegotiation] Error loading capabilities:', error);
    }
  }

  private async loadActiveNegotiations(): Promise<void> {
    try {
      console.log('🤝 [AgentNegotiation] Loading active negotiations...');
      // In production, load from storage
    } catch (error) {
      console.error('❌ [AgentNegotiation] Error loading negotiations:', error);
    }
  }
}

export default AgentNegotiationService;

