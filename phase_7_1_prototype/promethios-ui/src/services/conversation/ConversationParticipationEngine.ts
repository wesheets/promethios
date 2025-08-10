/**
 * Conversation Participation Engine
 * 
 * Core engine that decides when agents should participate in conversations.
 * Analyzes conversation context, calculates relevance, and applies agent-specific
 * triggers to determine participation decisions.
 */

import { ConversationAgentRole, ConversationBehavior } from './ConversationAgentRole';
import { AutonomyControls } from '../../extensions/AgentAutonomyControlExtension';

// ============================================================================
// CONVERSATION CONTEXT TYPES
// ============================================================================

export interface ConversationContext {
  conversationId: string;
  recentMessages: ConversationMessage[];
  participants: ConversationParticipant[];
  currentTopic: string;
  conversationFlow: ConversationFlow;
  emotionalTone: EmotionalTone;
  urgencyLevel: number; // 0-1
  conflictLevel: number; // 0-1
  consensusLevel: number; // 0-1
  informationGaps: InformationGap[];
  pendingQuestions: PendingQuestion[];
  timestamp: Date;
}

export interface ConversationMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  messageType: 'statement' | 'question' | 'response' | 'challenge' | 'support';
  confidence: number; // 0-1
  relevanceScore: number; // 0-1
  emotionalTone: string;
  topics: string[];
}

export interface ConversationParticipant {
  agentId: string;
  role: ConversationAgentRole;
  lastContribution: Date | null;
  contributionCount: number;
  averageRelevance: number;
  currentStatus: 'listening' | 'thinking' | 'preparing' | 'speaking' | 'silent';
  trustScore: number;
}

export interface ConversationFlow {
  flowType: 'natural' | 'structured' | 'brainstorming' | 'debate' | 'analysis';
  currentPhase: string;
  allowsInterruptions: boolean;
  requiresStructure: boolean;
  timeConstraints: boolean;
  moderationLevel: 'none' | 'light' | 'moderate' | 'strict';
}

export interface EmotionalTone {
  primary: string; // 'collaborative', 'tense', 'excited', 'analytical', etc.
  intensity: number; // 0-1
  stability: number; // 0-1, how stable the tone is
  trends: string[]; // recent emotional trends
}

export interface InformationGap {
  topic: string;
  gapType: 'missing_data' | 'unclear_definition' | 'conflicting_info' | 'needs_expertise';
  severity: number; // 0-1
  relevantAgents: string[]; // agents who could fill this gap
}

export interface PendingQuestion {
  question: string;
  askedBy: string;
  timestamp: Date;
  questionType: 'clarification' | 'information' | 'opinion' | 'decision';
  relevantAgents: string[];
  urgency: number; // 0-1
}

// ============================================================================
// PARTICIPATION DECISION TYPES
// ============================================================================

export interface ParticipationDecision {
  agentId: string;
  shouldParticipate: boolean;
  confidence: number; // 0-1, how confident in this decision
  urgency: number; // 0-1, how urgent the participation is
  participationType: ParticipationType;
  reasoning: ParticipationReasoning;
  estimatedValue: number; // 0-1, estimated value of participation
  timing: ParticipationTiming;
  content: ParticipationContent;
}

export type ParticipationType = 
  | 'answer_question' 
  | 'provide_expertise' 
  | 'challenge_assumption' 
  | 'support_idea' 
  | 'fill_information_gap' 
  | 'redirect_conversation' 
  | 'resolve_conflict' 
  | 'build_consensus'
  | 'stay_silent';

export interface ParticipationReasoning {
  primaryTrigger: string;
  relevanceScore: number;
  expertiseMatch: number;
  valueAddition: number;
  riskFactors: string[];
  supportingFactors: string[];
  conflictingFactors: string[];
}

export interface ParticipationTiming {
  immediateResponse: boolean;
  waitTime: number; // seconds to wait before speaking
  interruptionAllowed: boolean;
  politenessLevel: number; // 0-1
  contextualAppropriate: boolean;
}

export interface ParticipationContent {
  contentType: 'question' | 'statement' | 'challenge' | 'support' | 'information' | 'synthesis';
  estimatedLength: 'brief' | 'moderate' | 'detailed';
  tone: string;
  confidence: number;
  topics: string[];
}

// ============================================================================
// CONTEXT ANALYSIS TYPES
// ============================================================================

export interface ContextAnalysis {
  currentTopic: TopicAnalysis;
  conversationFlow: FlowAnalysis;
  participantActivity: ParticipantAnalysis;
  emotionalTone: EmotionalAnalysis;
  urgencyLevel: number;
  questionsPending: PendingQuestion[];
  conflictLevel: number;
  consensusLevel: number;
  informationGaps: InformationGap[];
  qualityIndicators: QualityIndicator[];
}

export interface TopicAnalysis {
  primaryTopic: string;
  secondaryTopics: string[];
  topicEvolution: TopicEvolution[];
  complexity: number; // 0-1
  clarity: number; // 0-1
  expertiseRequired: string[];
}

export interface FlowAnalysis {
  flowQuality: number; // 0-1
  interruptionFrequency: number;
  participationBalance: number; // 0-1, how balanced participation is
  conversationMomentum: number; // 0-1
  naturalPauses: boolean;
  stagnationRisk: number; // 0-1
}

export interface ParticipantAnalysis {
  activeParticipants: string[];
  quietParticipants: string[];
  dominatingParticipants: string[];
  recentContributors: string[];
  participationPattern: string;
  balanceScore: number; // 0-1
}

export interface EmotionalAnalysis {
  currentTone: string;
  toneStability: number; // 0-1
  conflictIndicators: string[];
  collaborationIndicators: string[];
  energyLevel: number; // 0-1
  stressLevel: number; // 0-1
}

export interface QualityIndicator {
  type: 'high_quality' | 'low_quality' | 'off_topic' | 'repetitive' | 'valuable';
  score: number; // 0-1
  description: string;
  affectedAgents: string[];
}

// ============================================================================
// CONVERSATION PARTICIPATION ENGINE
// ============================================================================

export class ConversationParticipationEngine {
  private contextAnalyzer: ConversationContextAnalyzer;
  private relevanceCalculator: RelevanceCalculator;
  private triggerEvaluator: TriggerEvaluator;
  private autonomyFilter: AutonomyFilter;
  private decisionGenerator: ParticipationDecisionGenerator;
  
  // Storage abstraction - will be implemented with Firebase later
  private storageAdapter: ConversationStorageAdapter;

  constructor(storageAdapter?: ConversationStorageAdapter) {
    this.contextAnalyzer = new ConversationContextAnalyzer();
    this.relevanceCalculator = new RelevanceCalculator();
    this.triggerEvaluator = new TriggerEvaluator();
    this.autonomyFilter = new AutonomyFilter();
    this.decisionGenerator = new ParticipationDecisionGenerator();
    
    // Use provided storage adapter or default in-memory one
    this.storageAdapter = storageAdapter || new InMemoryConversationStorage();
  }

  /**
   * Main method: Decides if an agent should participate in the conversation
   */
  async shouldAgentParticipate(
    agentId: string,
    agentRole: ConversationAgentRole,
    conversationContext: ConversationContext,
    autonomyControls: AutonomyControls
  ): Promise<ParticipationDecision> {
    
    console.log(`🧠 [Participation Engine] Evaluating participation for agent: ${agentId}`);
    
    try {
      // 1. Analyze conversation context
      const contextAnalysis = await this.contextAnalyzer.analyzeContext(conversationContext);
      
      // 2. Calculate relevance score
      const relevanceScore = await this.relevanceCalculator.calculateRelevance(
        agentRole,
        contextAnalysis
      );
      
      // 3. Evaluate speaking triggers
      const triggerAnalysis = await this.triggerEvaluator.evaluateSpeakingTriggers(
        agentRole,
        contextAnalysis,
        relevanceScore
      );
      
      // 4. Evaluate silence triggers
      const silenceAnalysis = await this.triggerEvaluator.evaluateSilenceTriggers(
        agentRole,
        contextAnalysis
      );
      
      // 5. Apply autonomy controls
      const autonomyFiltered = await this.autonomyFilter.applyAutonomyControls(
        triggerAnalysis,
        silenceAnalysis,
        autonomyControls,
        agentId
      );
      
      // 6. Generate final participation decision
      const decision = await this.decisionGenerator.generateDecision(
        agentId,
        agentRole,
        contextAnalysis,
        relevanceScore,
        autonomyFiltered
      );
      
      // 7. Store decision for learning and analysis
      await this.storageAdapter.storeParticipationDecision(decision, conversationContext);
      
      console.log(`✅ [Participation Engine] Decision for ${agentId}: ${decision.shouldParticipate ? 'PARTICIPATE' : 'STAY_SILENT'} (confidence: ${decision.confidence.toFixed(2)})`);
      
      return decision;
      
    } catch (error) {
      console.error(`❌ [Participation Engine] Error evaluating participation for ${agentId}:`, error);
      
      // Return safe default decision
      return {
        agentId,
        shouldParticipate: false,
        confidence: 0,
        urgency: 0,
        participationType: 'stay_silent',
        reasoning: {
          primaryTrigger: 'error_occurred',
          relevanceScore: 0,
          expertiseMatch: 0,
          valueAddition: 0,
          riskFactors: ['evaluation_error'],
          supportingFactors: [],
          conflictingFactors: []
        },
        estimatedValue: 0,
        timing: {
          immediateResponse: false,
          waitTime: 0,
          interruptionAllowed: false,
          politenessLevel: 1,
          contextualAppropriate: false
        },
        content: {
          contentType: 'statement',
          estimatedLength: 'brief',
          tone: 'neutral',
          confidence: 0,
          topics: []
        }
      };
    }
  }

  /**
   * Evaluate participation for multiple agents simultaneously
   */
  async evaluateMultipleAgents(
    agents: { agentId: string; role: ConversationAgentRole }[],
    conversationContext: ConversationContext,
    autonomyControls: AutonomyControls
  ): Promise<ParticipationDecision[]> {
    
    console.log(`🧠 [Participation Engine] Evaluating ${agents.length} agents for participation`);
    
    // Evaluate all agents in parallel
    const decisions = await Promise.all(
      agents.map(({ agentId, role }) =>
        this.shouldAgentParticipate(agentId, role, conversationContext, autonomyControls)
      )
    );
    
    // Apply coordination logic to prevent conflicts
    const coordinatedDecisions = await this.coordinateParticipation(decisions, conversationContext);
    
    return coordinatedDecisions;
  }

  /**
   * Coordinate participation decisions to prevent conflicts
   */
  private async coordinateParticipation(
    decisions: ParticipationDecision[],
    context: ConversationContext
  ): Promise<ParticipationDecision[]> {
    
    const participatingAgents = decisions.filter(d => d.shouldParticipate);
    
    // If too many agents want to participate, prioritize by urgency and value
    if (participatingAgents.length > 3) {
      console.log(`⚖️ [Participation Engine] Coordinating ${participatingAgents.length} agents wanting to participate`);
      
      // Sort by combined urgency and estimated value
      participatingAgents.sort((a, b) => 
        (b.urgency * 0.6 + b.estimatedValue * 0.4) - (a.urgency * 0.6 + a.estimatedValue * 0.4)
      );
      
      // Allow top 2-3 agents to participate, others wait
      const allowedParticipants = participatingAgents.slice(0, 2);
      const waitingParticipants = participatingAgents.slice(2);
      
      // Update waiting participants
      waitingParticipants.forEach(decision => {
        decision.shouldParticipate = false;
        decision.participationType = 'stay_silent';
        decision.timing.waitTime = Math.random() * 30 + 10; // Wait 10-40 seconds
        decision.reasoning.conflictingFactors.push('coordination_delay');
      });
    }
    
    return decisions;
  }

  /**
   * Get participation statistics for analysis
   */
  async getParticipationStatistics(
    conversationId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ParticipationStatistics> {
    return await this.storageAdapter.getParticipationStatistics(conversationId, timeRange);
  }

  /**
   * Update agent behavior based on participation feedback
   */
  async updateAgentBehavior(
    agentId: string,
    feedback: ParticipationFeedback
  ): Promise<void> {
    await this.storageAdapter.storeParticipationFeedback(agentId, feedback);
    
    // Trigger behavior adaptation (will be implemented in ConversationAgentRole)
    console.log(`📈 [Participation Engine] Stored feedback for agent ${agentId}: ${JSON.stringify(feedback)}`);
  }
}

// ============================================================================
// SUPPORTING CLASSES
// ============================================================================

class ConversationContextAnalyzer {
  async analyzeContext(context: ConversationContext): Promise<ContextAnalysis> {
    // Analyze current topic
    const currentTopic = await this.analyzeCurrentTopic(context.recentMessages);
    
    // Analyze conversation flow
    const conversationFlow = await this.analyzeConversationFlow(context);
    
    // Analyze participant activity
    const participantActivity = await this.analyzeParticipantActivity(context.participants);
    
    // Analyze emotional tone
    const emotionalTone = await this.analyzeEmotionalTone(context.recentMessages);
    
    return {
      currentTopic,
      conversationFlow,
      participantActivity,
      emotionalTone,
      urgencyLevel: context.urgencyLevel,
      questionsPending: context.pendingQuestions,
      conflictLevel: context.conflictLevel,
      consensusLevel: context.consensusLevel,
      informationGaps: context.informationGaps,
      qualityIndicators: await this.assessQualityIndicators(context.recentMessages)
    };
  }

  private async analyzeCurrentTopic(messages: ConversationMessage[]): Promise<TopicAnalysis> {
    // Extract topics from recent messages
    const recentTopics = messages.slice(-5).flatMap(m => m.topics);
    const topicCounts = recentTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const primaryTopic = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'general_discussion';
    
    return {
      primaryTopic,
      secondaryTopics: Object.keys(topicCounts).filter(t => t !== primaryTopic),
      topicEvolution: [], // TODO: Implement topic evolution tracking
      complexity: this.calculateTopicComplexity(recentTopics),
      clarity: this.calculateTopicClarity(messages),
      expertiseRequired: this.identifyRequiredExpertise(primaryTopic)
    };
  }

  private async analyzeConversationFlow(context: ConversationContext): Promise<FlowAnalysis> {
    const messages = context.recentMessages;
    
    return {
      flowQuality: this.calculateFlowQuality(messages),
      interruptionFrequency: this.calculateInterruptionFrequency(messages),
      participationBalance: this.calculateParticipationBalance(context.participants),
      conversationMomentum: this.calculateMomentum(messages),
      naturalPauses: this.detectNaturalPauses(messages),
      stagnationRisk: this.assessStagnationRisk(messages)
    };
  }

  private async analyzeParticipantActivity(participants: ConversationParticipant[]): Promise<ParticipantAnalysis> {
    const now = new Date();
    const recentThreshold = 2 * 60 * 1000; // 2 minutes
    
    const recentContributors = participants
      .filter(p => p.lastContribution && (now.getTime() - p.lastContribution.getTime()) < recentThreshold)
      .map(p => p.agentId);
    
    const activeParticipants = participants
      .filter(p => p.contributionCount > 0)
      .map(p => p.agentId);
    
    const quietParticipants = participants
      .filter(p => p.contributionCount === 0)
      .map(p => p.agentId);
    
    return {
      activeParticipants,
      quietParticipants,
      dominatingParticipants: this.identifyDominatingParticipants(participants),
      recentContributors,
      participationPattern: this.identifyParticipationPattern(participants),
      balanceScore: this.calculateParticipationBalance(participants)
    };
  }

  private async analyzeEmotionalTone(messages: ConversationMessage[]): Promise<EmotionalAnalysis> {
    const recentMessages = messages.slice(-5);
    const tones = recentMessages.map(m => m.emotionalTone);
    
    // Simple tone analysis - in production, this would use NLP
    const toneCounts = tones.reduce((acc, tone) => {
      acc[tone] = (acc[tone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const currentTone = Object.entries(toneCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
    
    return {
      currentTone,
      toneStability: this.calculateToneStability(tones),
      conflictIndicators: this.detectConflictIndicators(recentMessages),
      collaborationIndicators: this.detectCollaborationIndicators(recentMessages),
      energyLevel: this.calculateEnergyLevel(recentMessages),
      stressLevel: this.calculateStressLevel(recentMessages)
    };
  }

  // Helper methods (simplified implementations)
  private calculateTopicComplexity(topics: string[]): number {
    return Math.min(topics.length / 10, 1); // Simple complexity based on topic count
  }

  private calculateTopicClarity(messages: ConversationMessage[]): number {
    const avgConfidence = messages.reduce((sum, m) => sum + m.confidence, 0) / messages.length;
    return avgConfidence || 0.5;
  }

  private identifyRequiredExpertise(topic: string): string[] {
    // Simple mapping - in production, this would be more sophisticated
    const expertiseMap: Record<string, string[]> = {
      'technical': ['engineering', 'development'],
      'business': ['strategy', 'finance'],
      'research': ['analysis', 'data'],
      'creative': ['design', 'innovation']
    };
    
    return expertiseMap[topic] || ['general'];
  }

  private calculateFlowQuality(messages: ConversationMessage[]): number {
    // Simple flow quality based on message relevance
    const avgRelevance = messages.reduce((sum, m) => sum + m.relevanceScore, 0) / messages.length;
    return avgRelevance || 0.5;
  }

  private calculateInterruptionFrequency(messages: ConversationMessage[]): number {
    // Count rapid-fire messages as interruptions
    let interruptions = 0;
    for (let i = 1; i < messages.length; i++) {
      const timeDiff = messages[i].timestamp.getTime() - messages[i-1].timestamp.getTime();
      if (timeDiff < 5000) { // Less than 5 seconds
        interruptions++;
      }
    }
    return interruptions / Math.max(messages.length - 1, 1);
  }

  private calculateParticipationBalance(participants: ConversationParticipant[]): number {
    const contributions = participants.map(p => p.contributionCount);
    const total = contributions.reduce((sum, c) => sum + c, 0);
    
    if (total === 0) return 1;
    
    const expected = total / participants.length;
    const variance = contributions.reduce((sum, c) => sum + Math.pow(c - expected, 2), 0) / participants.length;
    
    return Math.max(0, 1 - (variance / (expected * expected)));
  }

  private calculateMomentum(messages: ConversationMessage[]): number {
    if (messages.length < 2) return 0.5;
    
    const recentMessages = messages.slice(-3);
    const timeSpans = [];
    
    for (let i = 1; i < recentMessages.length; i++) {
      const span = recentMessages[i].timestamp.getTime() - recentMessages[i-1].timestamp.getTime();
      timeSpans.push(span);
    }
    
    const avgTimeSpan = timeSpans.reduce((sum, span) => sum + span, 0) / timeSpans.length;
    
    // Faster responses = higher momentum
    return Math.max(0, Math.min(1, 1 - (avgTimeSpan / 60000))); // Normalize to 1 minute
  }

  private detectNaturalPauses(messages: ConversationMessage[]): boolean {
    if (messages.length < 2) return true;
    
    const lastMessage = messages[messages.length - 1];
    const timeSinceLastMessage = Date.now() - lastMessage.timestamp.getTime();
    
    return timeSinceLastMessage > 10000; // 10 seconds is a natural pause
  }

  private assessStagnationRisk(messages: ConversationMessage[]): number {
    const recentMessages = messages.slice(-5);
    
    // Check for repetitive content or declining relevance
    const avgRelevance = recentMessages.reduce((sum, m) => sum + m.relevanceScore, 0) / recentMessages.length;
    const uniqueTopics = new Set(recentMessages.flatMap(m => m.topics)).size;
    
    return Math.max(0, 1 - (avgRelevance * 0.7 + (uniqueTopics / 5) * 0.3));
  }

  private identifyDominatingParticipants(participants: ConversationParticipant[]): string[] {
    const totalContributions = participants.reduce((sum, p) => sum + p.contributionCount, 0);
    const threshold = totalContributions * 0.4; // 40% of contributions
    
    return participants
      .filter(p => p.contributionCount > threshold)
      .map(p => p.agentId);
  }

  private identifyParticipationPattern(participants: ConversationParticipant[]): string {
    const active = participants.filter(p => p.contributionCount > 0).length;
    const total = participants.length;
    
    if (active / total > 0.8) return 'highly_collaborative';
    if (active / total > 0.5) return 'moderately_collaborative';
    if (active / total > 0.2) return 'selective_participation';
    return 'low_participation';
  }

  private calculateToneStability(tones: string[]): number {
    const uniqueTones = new Set(tones).size;
    return Math.max(0, 1 - (uniqueTones / tones.length));
  }

  private detectConflictIndicators(messages: ConversationMessage[]): string[] {
    const indicators: string[] = [];
    
    messages.forEach(message => {
      if (message.messageType === 'challenge') indicators.push('direct_challenge');
      if (message.confidence < 0.3) indicators.push('low_confidence');
      if (message.emotionalTone === 'tense') indicators.push('tense_tone');
    });
    
    return [...new Set(indicators)];
  }

  private detectCollaborationIndicators(messages: ConversationMessage[]): string[] {
    const indicators: string[] = [];
    
    messages.forEach(message => {
      if (message.messageType === 'support') indicators.push('supportive_response');
      if (message.confidence > 0.8) indicators.push('high_confidence');
      if (message.emotionalTone === 'collaborative') indicators.push('collaborative_tone');
    });
    
    return [...new Set(indicators)];
  }

  private calculateEnergyLevel(messages: ConversationMessage[]): number {
    // Simple energy calculation based on message frequency and enthusiasm
    const recentMessages = messages.slice(-5);
    const timeSpan = recentMessages.length > 1 ? 
      recentMessages[recentMessages.length - 1].timestamp.getTime() - recentMessages[0].timestamp.getTime() : 
      60000;
    
    const messageRate = (recentMessages.length / timeSpan) * 60000; // Messages per minute
    return Math.min(1, messageRate / 5); // Normalize to 5 messages per minute = high energy
  }

  private calculateStressLevel(messages: ConversationMessage[]): number {
    const stressIndicators = messages.filter(m => 
      m.emotionalTone === 'tense' || 
      m.messageType === 'challenge' || 
      m.confidence < 0.4
    ).length;
    
    return Math.min(1, stressIndicators / messages.length);
  }

  private async assessQualityIndicators(messages: ConversationMessage[]): Promise<QualityIndicator[]> {
    const indicators: QualityIndicator[] = [];
    
    // High quality indicators
    const highQualityMessages = messages.filter(m => m.relevanceScore > 0.8 && m.confidence > 0.7);
    if (highQualityMessages.length > 0) {
      indicators.push({
        type: 'high_quality',
        score: highQualityMessages.length / messages.length,
        description: 'High relevance and confidence messages',
        affectedAgents: [...new Set(highQualityMessages.map(m => m.agentId))]
      });
    }
    
    // Low quality indicators
    const lowQualityMessages = messages.filter(m => m.relevanceScore < 0.3 || m.confidence < 0.3);
    if (lowQualityMessages.length > 0) {
      indicators.push({
        type: 'low_quality',
        score: lowQualityMessages.length / messages.length,
        description: 'Low relevance or confidence messages',
        affectedAgents: [...new Set(lowQualityMessages.map(m => m.agentId))]
      });
    }
    
    return indicators;
  }
}

class RelevanceCalculator {
  async calculateRelevance(
    agentRole: ConversationAgentRole,
    contextAnalysis: ContextAnalysis
  ): Promise<number> {
    
    // Calculate expertise match
    const expertiseMatch = this.calculateExpertiseMatch(
      agentRole.responsibilities,
      contextAnalysis.currentTopic
    );
    
    // Calculate value addition potential
    const valueAddition = this.calculateValueAddition(
      agentRole,
      contextAnalysis.informationGaps
    );
    
    // Calculate contextual relevance
    const contextualRelevance = this.calculateContextualRelevance(
      agentRole,
      contextAnalysis
    );
    
    // Weighted combination
    return (expertiseMatch * 0.4) + (valueAddition * 0.3) + (contextualRelevance * 0.3);
  }

  private calculateExpertiseMatch(
    responsibilities: string[],
    topicAnalysis: TopicAnalysis
  ): Promise<number> {
    const relevantResponsibilities = responsibilities.filter(resp =>
      topicAnalysis.primaryTopic.includes(resp) ||
      topicAnalysis.secondaryTopics.some(topic => topic.includes(resp)) ||
      topicAnalysis.expertiseRequired.includes(resp)
    );
    
    return Promise.resolve(relevantResponsibilities.length / responsibilities.length);
  }

  private calculateValueAddition(
    agentRole: ConversationAgentRole,
    informationGaps: InformationGap[]
  ): Promise<number> {
    const relevantGaps = informationGaps.filter(gap =>
      gap.relevantAgents.includes(agentRole.id) ||
      agentRole.responsibilities.some(resp => gap.topic.includes(resp))
    );
    
    if (informationGaps.length === 0) return Promise.resolve(0.5);
    
    const totalSeverity = relevantGaps.reduce((sum, gap) => sum + gap.severity, 0);
    const maxPossibleSeverity = informationGaps.length;
    
    return Promise.resolve(totalSeverity / maxPossibleSeverity);
  }

  private calculateContextualRelevance(
    agentRole: ConversationAgentRole,
    contextAnalysis: ContextAnalysis
  ): Promise<number> {
    let relevance = 0.5; // Base relevance
    
    // Adjust based on conversation flow
    if (contextAnalysis.conversationFlow.stagnationRisk > 0.7 && 
        agentRole.conversationBehavior.personalityTraits.enthusiasm > 0.7) {
      relevance += 0.3; // Enthusiastic agents help with stagnation
    }
    
    // Adjust based on conflict level
    if (contextAnalysis.conflictLevel > 0.6 && 
        agentRole.conversationBehavior.personalityTraits.supportiveness > 0.7) {
      relevance += 0.2; // Supportive agents help with conflict
    }
    
    // Adjust based on pending questions
    if (contextAnalysis.questionsPending.length > 0 &&
        agentRole.conversationBehavior.speakingTriggers.questionDetection) {
      relevance += 0.2; // Question-responsive agents help with pending questions
    }
    
    return Promise.resolve(Math.min(1, relevance));
  }
}

class TriggerEvaluator {
  async evaluateSpeakingTriggers(
    agentRole: ConversationAgentRole,
    contextAnalysis: ContextAnalysis,
    relevanceScore: number
  ): Promise<TriggerEvaluation> {
    
    const triggers = agentRole.conversationBehavior.speakingTriggers;
    const evaluations: TriggerResult[] = [];
    
    // Expertise match trigger
    if (relevanceScore >= triggers.expertiseMatch) {
      evaluations.push({
        trigger: 'expertise_match',
        activated: true,
        strength: relevanceScore,
        reason: `Relevance score ${relevanceScore.toFixed(2)} exceeds threshold ${triggers.expertiseMatch}`
      });
    }
    
    // Disagreement trigger
    if (contextAnalysis.conflictLevel >= triggers.disagreementThreshold) {
      evaluations.push({
        trigger: 'disagreement',
        activated: true,
        strength: contextAnalysis.conflictLevel,
        reason: `Conflict level ${contextAnalysis.conflictLevel.toFixed(2)} exceeds threshold ${triggers.disagreementThreshold}`
      });
    }
    
    // Question detection trigger
    if (triggers.questionDetection && contextAnalysis.questionsPending.length > 0) {
      const relevantQuestions = contextAnalysis.questionsPending.filter(q =>
        q.relevantAgents.includes(agentRole.id)
      );
      
      if (relevantQuestions.length > 0) {
        evaluations.push({
          trigger: 'question_detection',
          activated: true,
          strength: relevantQuestions.length / contextAnalysis.questionsPending.length,
          reason: `${relevantQuestions.length} relevant questions pending`
        });
      }
    }
    
    // Error correction trigger
    if (triggers.errorCorrection) {
      const lowQualityIndicators = contextAnalysis.qualityIndicators.filter(qi => 
        qi.type === 'low_quality' && qi.score > 0.3
      );
      
      if (lowQualityIndicators.length > 0) {
        evaluations.push({
          trigger: 'error_correction',
          activated: true,
          strength: lowQualityIndicators[0].score,
          reason: 'Low quality content detected that needs correction'
        });
      }
    }
    
    // Value addition trigger
    if (triggers.valueAddition && contextAnalysis.informationGaps.length > 0) {
      const relevantGaps = contextAnalysis.informationGaps.filter(gap =>
        gap.relevantAgents.includes(agentRole.id)
      );
      
      if (relevantGaps.length > 0) {
        evaluations.push({
          trigger: 'value_addition',
          activated: true,
          strength: relevantGaps.reduce((sum, gap) => sum + gap.severity, 0) / relevantGaps.length,
          reason: `${relevantGaps.length} information gaps that agent can fill`
        });
      }
    }
    
    // Support provision trigger
    if (triggers.supportProvision) {
      const collaborationIndicators = contextAnalysis.emotionalTone.collaborationIndicators;
      if (collaborationIndicators.length > 0 && contextAnalysis.emotionalTone.energyLevel < 0.5) {
        evaluations.push({
          trigger: 'support_provision',
          activated: true,
          strength: 0.7,
          reason: 'Collaborative context with low energy - support needed'
        });
      }
    }
    
    return {
      shouldSpeak: evaluations.some(e => e.activated),
      activatedTriggers: evaluations.filter(e => e.activated),
      overallStrength: evaluations.reduce((sum, e) => sum + (e.activated ? e.strength : 0), 0) / Math.max(evaluations.length, 1),
      primaryTrigger: evaluations.filter(e => e.activated).sort((a, b) => b.strength - a.strength)[0]?.trigger || 'none'
    };
  }

  async evaluateSilenceTriggers(
    agentRole: ConversationAgentRole,
    contextAnalysis: ContextAnalysis
  ): Promise<SilenceEvaluation> {
    
    const triggers = agentRole.conversationBehavior.silenceTriggers;
    const evaluations: TriggerResult[] = [];
    
    // Topic irrelevance trigger
    const topicRelevance = await this.calculateTopicRelevance(agentRole, contextAnalysis.currentTopic);
    if (topicRelevance <= triggers.topicIrrelevance) {
      evaluations.push({
        trigger: 'topic_irrelevance',
        activated: true,
        strength: 1 - topicRelevance,
        reason: `Topic relevance ${topicRelevance.toFixed(2)} below threshold ${triggers.topicIrrelevance}`
      });
    }
    
    // Recent contribution trigger
    const timeSinceLastContribution = this.getTimeSinceLastContribution(agentRole.id, contextAnalysis);
    if (timeSinceLastContribution < triggers.recentContribution * 60 * 1000) { // Convert minutes to milliseconds
      evaluations.push({
        trigger: 'recent_contribution',
        activated: true,
        strength: 1 - (timeSinceLastContribution / (triggers.recentContribution * 60 * 1000)),
        reason: `Only ${Math.round(timeSinceLastContribution / 1000)}s since last contribution, threshold is ${triggers.recentContribution}min`
      });
    }
    
    // Conversation flow trigger
    if (triggers.conversationFlow && contextAnalysis.conversationFlow.flowQuality > 0.7) {
      evaluations.push({
        trigger: 'conversation_flow',
        activated: true,
        strength: contextAnalysis.conversationFlow.flowQuality,
        reason: 'Good conversation flow should not be interrupted'
      });
    }
    
    // Defer to expertise trigger
    if (triggers.deferToExpertise) {
      const moreExpertParticipants = this.findMoreExpertParticipants(agentRole, contextAnalysis);
      if (moreExpertParticipants.length > 0) {
        evaluations.push({
          trigger: 'defer_to_expertise',
          activated: true,
          strength: 0.8,
          reason: `${moreExpertParticipants.length} participants have higher expertise in current topic`
        });
      }
    }
    
    return {
      shouldStayQuiet: evaluations.some(e => e.activated),
      activatedTriggers: evaluations.filter(e => e.activated),
      overallStrength: evaluations.reduce((sum, e) => sum + (e.activated ? e.strength : 0), 0) / Math.max(evaluations.length, 1),
      primaryTrigger: evaluations.filter(e => e.activated).sort((a, b) => b.strength - a.strength)[0]?.trigger || 'none'
    };
  }

  private async calculateTopicRelevance(
    agentRole: ConversationAgentRole,
    topicAnalysis: TopicAnalysis
  ): Promise<number> {
    const relevantResponsibilities = agentRole.responsibilities.filter(resp =>
      topicAnalysis.primaryTopic.includes(resp) ||
      topicAnalysis.secondaryTopics.some(topic => topic.includes(resp))
    );
    
    return relevantResponsibilities.length / agentRole.responsibilities.length;
  }

  private getTimeSinceLastContribution(agentId: string, contextAnalysis: ContextAnalysis): number {
    // This would typically look up the agent's last contribution time
    // For now, return a default value
    return 5 * 60 * 1000; // 5 minutes
  }

  private findMoreExpertParticipants(
    agentRole: ConversationAgentRole,
    contextAnalysis: ContextAnalysis
  ): string[] {
    // This would typically compare expertise levels of participants
    // For now, return empty array
    return [];
  }
}

class AutonomyFilter {
  async applyAutonomyControls(
    triggerAnalysis: TriggerEvaluation,
    silenceAnalysis: SilenceEvaluation,
    autonomyControls: AutonomyControls,
    agentId: string
  ): Promise<AutonomyFilterResult> {
    
    const agentControls = autonomyControls.agentSpecificControls[agentId];
    
    let shouldSpeak = triggerAnalysis.shouldSpeak && !silenceAnalysis.shouldStayQuiet;
    let confidence = triggerAnalysis.overallStrength;
    const restrictions: string[] = [];
    
    // Apply agent-specific permissions
    if (agentControls) {
      if (!agentControls.permissions.canInitiateTasks && triggerAnalysis.primaryTrigger === 'value_addition') {
        shouldSpeak = false;
        restrictions.push('cannot_initiate_tasks');
      }
      
      if (!agentControls.permissions.canMakeDecisions && triggerAnalysis.primaryTrigger === 'disagreement') {
        shouldSpeak = false;
        restrictions.push('cannot_make_decisions');
      }
      
      // Apply behavior controls
      if (agentControls.behaviorControls.allowInterruptions === false) {
        confidence *= 0.5; // Reduce confidence for interruption-like behavior
      }
      
      if (agentControls.behaviorControls.allowDisagreement === false && 
          triggerAnalysis.primaryTrigger === 'disagreement') {
        shouldSpeak = false;
        restrictions.push('disagreement_not_allowed');
      }
    }
    
    // Apply global autonomy level
    switch (autonomyControls.globalAutonomyLevel) {
      case 'tight_leash':
        if (confidence < 0.8) {
          shouldSpeak = false;
          restrictions.push('confidence_too_low_for_tight_leash');
        }
        break;
        
      case 'guided':
        if (confidence < 0.6) {
          shouldSpeak = false;
          restrictions.push('confidence_too_low_for_guided');
        }
        break;
        
      case 'balanced':
        if (confidence < 0.4) {
          shouldSpeak = false;
          restrictions.push('confidence_too_low_for_balanced');
        }
        break;
        
      case 'autonomous':
      case 'free_range':
        // Minimal restrictions
        break;
    }
    
    return {
      shouldSpeak,
      confidence,
      restrictions,
      autonomyLevel: autonomyControls.globalAutonomyLevel,
      appliedControls: agentControls ? Object.keys(agentControls.permissions).filter(
        key => !(agentControls.permissions as any)[key]
      ) : []
    };
  }
}

class ParticipationDecisionGenerator {
  async generateDecision(
    agentId: string,
    agentRole: ConversationAgentRole,
    contextAnalysis: ContextAnalysis,
    relevanceScore: number,
    autonomyResult: AutonomyFilterResult
  ): Promise<ParticipationDecision> {
    
    if (!autonomyResult.shouldSpeak) {
      return this.generateSilenceDecision(agentId, agentRole, autonomyResult);
    }
    
    // Determine participation type
    const participationType = this.determineParticipationType(contextAnalysis, agentRole);
    
    // Calculate urgency
    const urgency = this.calculateUrgency(contextAnalysis, agentRole, participationType);
    
    // Generate timing
    const timing = this.generateTiming(agentRole, contextAnalysis, urgency);
    
    // Generate content plan
    const content = this.generateContentPlan(participationType, agentRole, contextAnalysis);
    
    // Estimate value
    const estimatedValue = this.estimateValue(participationType, relevanceScore, contextAnalysis);
    
    return {
      agentId,
      shouldParticipate: true,
      confidence: autonomyResult.confidence,
      urgency,
      participationType,
      reasoning: {
        primaryTrigger: autonomyResult.appliedControls.length > 0 ? 'autonomy_filtered' : 'trigger_activated',
        relevanceScore,
        expertiseMatch: relevanceScore,
        valueAddition: estimatedValue,
        riskFactors: autonomyResult.restrictions,
        supportingFactors: [`participation_type_${participationType}`, `relevance_${relevanceScore.toFixed(2)}`],
        conflictingFactors: autonomyResult.restrictions
      },
      estimatedValue,
      timing,
      content
    };
  }

  private generateSilenceDecision(
    agentId: string,
    agentRole: ConversationAgentRole,
    autonomyResult: AutonomyFilterResult
  ): ParticipationDecision {
    return {
      agentId,
      shouldParticipate: false,
      confidence: 1 - autonomyResult.confidence,
      urgency: 0,
      participationType: 'stay_silent',
      reasoning: {
        primaryTrigger: 'silence_triggered',
        relevanceScore: 0,
        expertiseMatch: 0,
        valueAddition: 0,
        riskFactors: autonomyResult.restrictions,
        supportingFactors: ['maintaining_conversation_flow'],
        conflictingFactors: autonomyResult.restrictions
      },
      estimatedValue: 0,
      timing: {
        immediateResponse: false,
        waitTime: 0,
        interruptionAllowed: false,
        politenessLevel: 1,
        contextualAppropriate: true
      },
      content: {
        contentType: 'statement',
        estimatedLength: 'brief',
        tone: 'neutral',
        confidence: 0,
        topics: []
      }
    };
  }

  private determineParticipationType(
    contextAnalysis: ContextAnalysis,
    agentRole: ConversationAgentRole
  ): ParticipationType {
    
    // Check for pending questions first
    if (contextAnalysis.questionsPending.length > 0) {
      const relevantQuestions = contextAnalysis.questionsPending.filter(q =>
        q.relevantAgents.includes(agentRole.id)
      );
      if (relevantQuestions.length > 0) {
        return 'answer_question';
      }
    }
    
    // Check for information gaps
    if (contextAnalysis.informationGaps.length > 0) {
      const relevantGaps = contextAnalysis.informationGaps.filter(gap =>
        gap.relevantAgents.includes(agentRole.id)
      );
      if (relevantGaps.length > 0) {
        return 'fill_information_gap';
      }
    }
    
    // Check for conflict
    if (contextAnalysis.conflictLevel > 0.6) {
      if (agentRole.conversationBehavior.personalityTraits.supportiveness > 0.7) {
        return 'resolve_conflict';
      } else if (agentRole.conversationBehavior.personalityTraits.skepticism > 0.7) {
        return 'challenge_assumption';
      }
    }
    
    // Check for consensus building opportunity
    if (contextAnalysis.consensusLevel > 0.7 && contextAnalysis.consensusLevel < 0.9) {
      return 'build_consensus';
    }
    
    // Check for support opportunity
    if (agentRole.conversationBehavior.personalityTraits.supportiveness > 0.7 &&
        contextAnalysis.emotionalTone.collaborationIndicators.length > 0) {
      return 'support_idea';
    }
    
    // Default to providing expertise
    return 'provide_expertise';
  }

  private calculateUrgency(
    contextAnalysis: ContextAnalysis,
    agentRole: ConversationAgentRole,
    participationType: ParticipationType
  ): number {
    let urgency = 0.5; // Base urgency
    
    // Increase urgency based on context
    urgency += contextAnalysis.urgencyLevel * 0.3;
    urgency += contextAnalysis.conflictLevel * 0.2;
    
    // Adjust based on participation type
    switch (participationType) {
      case 'answer_question':
        urgency += 0.3;
        break;
      case 'resolve_conflict':
        urgency += 0.4;
        break;
      case 'challenge_assumption':
        urgency += 0.2;
        break;
      case 'fill_information_gap':
        urgency += 0.25;
        break;
    }
    
    // Adjust based on agent personality
    urgency += agentRole.conversationBehavior.personalityTraits.assertiveness * 0.2;
    
    return Math.min(1, urgency);
  }

  private generateTiming(
    agentRole: ConversationAgentRole,
    contextAnalysis: ContextAnalysis,
    urgency: number
  ): ParticipationTiming {
    
    const interruptionBehavior = agentRole.conversationBehavior.interruptionBehavior;
    
    return {
      immediateResponse: urgency > 0.8,
      waitTime: urgency > 0.6 ? 0 : Math.random() * 10 + 2, // 2-12 seconds
      interruptionAllowed: interruptionBehavior.allowInterruptions && urgency > interruptionBehavior.urgencyThreshold,
      politenessLevel: interruptionBehavior.politenessLevel,
      contextualAppropriate: contextAnalysis.conversationFlow.naturalPauses || urgency > 0.7
    };
  }

  private generateContentPlan(
    participationType: ParticipationType,
    agentRole: ConversationAgentRole,
    contextAnalysis: ContextAnalysis
  ): ParticipationContent {
    
    let contentType: ParticipationContent['contentType'] = 'statement';
    let estimatedLength: ParticipationContent['estimatedLength'] = 'moderate';
    let tone = 'neutral';
    
    switch (participationType) {
      case 'answer_question':
        contentType = 'information';
        estimatedLength = 'detailed';
        tone = 'informative';
        break;
        
      case 'challenge_assumption':
        contentType = 'challenge';
        estimatedLength = 'moderate';
        tone = 'analytical';
        break;
        
      case 'support_idea':
        contentType = 'support';
        estimatedLength = 'brief';
        tone = 'supportive';
        break;
        
      case 'provide_expertise':
        contentType = 'information';
        estimatedLength = 'detailed';
        tone = 'expert';
        break;
        
      case 'fill_information_gap':
        contentType = 'information';
        estimatedLength = 'moderate';
        tone = 'informative';
        break;
    }
    
    return {
      contentType,
      estimatedLength,
      tone,
      confidence: agentRole.conversationBehavior.personalityTraits.assertiveness,
      topics: [contextAnalysis.currentTopic.primaryTopic]
    };
  }

  private estimateValue(
    participationType: ParticipationType,
    relevanceScore: number,
    contextAnalysis: ContextAnalysis
  ): number {
    let baseValue = relevanceScore;
    
    // Adjust based on participation type
    switch (participationType) {
      case 'answer_question':
        baseValue += 0.3;
        break;
      case 'resolve_conflict':
        baseValue += 0.4;
        break;
      case 'fill_information_gap':
        baseValue += 0.35;
        break;
      case 'challenge_assumption':
        baseValue += 0.2;
        break;
      case 'support_idea':
        baseValue += 0.15;
        break;
    }
    
    // Adjust based on context needs
    if (contextAnalysis.conversationFlow.stagnationRisk > 0.7) {
      baseValue += 0.2; // Any participation helps with stagnation
    }
    
    if (contextAnalysis.informationGaps.length > 0) {
      baseValue += 0.1; // Information is valuable
    }
    
    return Math.min(1, baseValue);
  }
}

// ============================================================================
// STORAGE ABSTRACTION (FOR FUTURE FIREBASE INTEGRATION)
// ============================================================================

export interface ConversationStorageAdapter {
  storeParticipationDecision(decision: ParticipationDecision, context: ConversationContext): Promise<void>;
  getParticipationStatistics(conversationId: string, timeRange?: { start: Date; end: Date }): Promise<ParticipationStatistics>;
  storeParticipationFeedback(agentId: string, feedback: ParticipationFeedback): Promise<void>;
  storeConversationContext(context: ConversationContext): Promise<void>;
  getConversationHistory(conversationId: string): Promise<ConversationMessage[]>;
}

// In-memory implementation for now, will be replaced with Firebase
class InMemoryConversationStorage implements ConversationStorageAdapter {
  private decisions: Map<string, ParticipationDecision[]> = new Map();
  private feedback: Map<string, ParticipationFeedback[]> = new Map();
  private contexts: Map<string, ConversationContext[]> = new Map();

  async storeParticipationDecision(decision: ParticipationDecision, context: ConversationContext): Promise<void> {
    const decisions = this.decisions.get(context.conversationId) || [];
    decisions.push(decision);
    this.decisions.set(context.conversationId, decisions);
  }

  async getParticipationStatistics(conversationId: string, timeRange?: { start: Date; end: Date }): Promise<ParticipationStatistics> {
    const decisions = this.decisions.get(conversationId) || [];
    
    return {
      totalDecisions: decisions.length,
      participationRate: decisions.filter(d => d.shouldParticipate).length / decisions.length,
      averageConfidence: decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length,
      averageUrgency: decisions.reduce((sum, d) => sum + d.urgency, 0) / decisions.length,
      participationTypes: this.groupBy(decisions, d => d.participationType),
      agentParticipation: this.groupBy(decisions, d => d.agentId)
    };
  }

  async storeParticipationFeedback(agentId: string, feedback: ParticipationFeedback): Promise<void> {
    const feedbacks = this.feedback.get(agentId) || [];
    feedbacks.push(feedback);
    this.feedback.set(agentId, feedbacks);
  }

  async storeConversationContext(context: ConversationContext): Promise<void> {
    const contexts = this.contexts.get(context.conversationId) || [];
    contexts.push(context);
    this.contexts.set(context.conversationId, contexts);
  }

  async getConversationHistory(conversationId: string): Promise<ConversationMessage[]> {
    const contexts = this.contexts.get(conversationId) || [];
    return contexts.flatMap(c => c.recentMessages);
  }

  private groupBy<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, number> {
    return array.reduce((acc, item) => {
      const key = keyFn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<K, number>);
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

interface TriggerResult {
  trigger: string;
  activated: boolean;
  strength: number;
  reason: string;
}

interface TriggerEvaluation {
  shouldSpeak: boolean;
  activatedTriggers: TriggerResult[];
  overallStrength: number;
  primaryTrigger: string;
}

interface SilenceEvaluation {
  shouldStayQuiet: boolean;
  activatedTriggers: TriggerResult[];
  overallStrength: number;
  primaryTrigger: string;
}

interface AutonomyFilterResult {
  shouldSpeak: boolean;
  confidence: number;
  restrictions: string[];
  autonomyLevel: string;
  appliedControls: string[];
}

interface ParticipationStatistics {
  totalDecisions: number;
  participationRate: number;
  averageConfidence: number;
  averageUrgency: number;
  participationTypes: Record<string, number>;
  agentParticipation: Record<string, number>;
}

interface ParticipationFeedback {
  timestamp: Date;
  quality: number; // 0-1
  relevance: number; // 0-1
  timing: number; // 0-1
  tone: number; // 0-1
  comments?: string;
}

interface TopicEvolution {
  timestamp: Date;
  topic: string;
  confidence: number;
}

// Export the main engine
export const conversationParticipationEngine = new ConversationParticipationEngine();

