/**
 * Autonomous Cognition Triggers
 * 
 * Real-time monitoring system that detects opportunities for autonomous cognition
 * and triggers appropriate autonomous processes with governance oversight.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { autonomousCognitionEngine, AutonomousThought, GovernanceContext } from './AutonomousCognitionEngine';
import { unifiedPolicyRegistry } from './UnifiedPolicyRegistry';

// Trigger Context Types
export interface ConversationContext {
  messages: ConversationMessage[];
  current_topic: string;
  topic_complexity: number; // 0-1
  conversation_length: number;
  user_engagement: number; // 0-1
  concept_count: number;
  connection_potential: number; // 0-1
  ethical_keywords: number;
  moral_complexity: number; // 0-1
  problem_indicators: number;
  solution_space: number; // 0-1
  uncertainty_indicators: number; // 0-1
  learning_opportunity: number; // 0-1
  detected_patterns: string[];
  concepts: string[];
  ethical_considerations: string[];
  solution_approaches: string[];
  knowledge_gaps: string[];
  identified_problems: string[];
  creative_possibilities: string[];
  recent_messages: string[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  metadata?: {
    sentiment?: number;
    complexity?: number;
    topics?: string[];
    entities?: string[];
    intent?: string;
  };
}

export interface TriggerEvaluation {
  trigger_id: string;
  triggered: boolean;
  confidence: number; // 0-1
  priority: number;
  reasoning: string;
  context_factors: Record<string, number>;
}

export interface AutonomousTriggerResult {
  triggered: boolean;
  trigger_evaluations: TriggerEvaluation[];
  selected_trigger?: string;
  autonomous_process_initiated: boolean;
  governance_approval: boolean;
  reasoning: string;
}

/**
 * Autonomous Cognition Trigger System
 * 
 * Monitors conversations and triggers autonomous cognition processes
 */
export class AutonomousCognitionTriggers {
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private conversationHistory: Map<string, ConversationMessage[]> = new Map();
  private triggerHistory: Map<string, TriggerEvaluation[]> = new Map();

  /**
   * Start monitoring conversations for autonomous triggers
   */
  startMonitoring(agentId: string, governanceContext: GovernanceContext): void {
    if (this.isMonitoring) {
      console.log('Autonomous cognition monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting autonomous cognition monitoring for agent ${agentId}`);

    // Monitor every 5 seconds for autonomous opportunities
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.evaluateAutonomousOpportunities(agentId, governanceContext);
      } catch (error) {
        console.error('Error in autonomous cognition monitoring:', error);
      }
    }, 5000);
  }

  /**
   * Stop monitoring conversations
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Autonomous cognition monitoring stopped');
  }

  /**
   * Add new message to conversation context
   */
  addMessage(agentId: string, message: ConversationMessage): void {
    if (!this.conversationHistory.has(agentId)) {
      this.conversationHistory.set(agentId, []);
    }

    const history = this.conversationHistory.get(agentId)!;
    history.push(message);

    // Keep only last 50 messages for performance
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    // Trigger immediate evaluation for significant messages
    if (this.isSignificantMessage(message)) {
      this.evaluateAutonomousOpportunities(agentId, this.getDefaultGovernanceContext()).catch(console.error);
    }
  }

  /**
   * Evaluate autonomous cognition opportunities
   */
  private async evaluateAutonomousOpportunities(
    agentId: string,
    governanceContext: GovernanceContext
  ): Promise<AutonomousTriggerResult> {
    try {
      // Get conversation context
      const conversationContext = this.buildConversationContext(agentId);
      
      if (!conversationContext || conversationContext.messages.length === 0) {
        return {
          triggered: false,
          trigger_evaluations: [],
          autonomous_process_initiated: false,
          governance_approval: false,
          reasoning: 'No conversation context available'
        };
      }

      // Evaluate all triggers
      const triggerEvaluations = await this.evaluateAllTriggers(conversationContext);
      
      // Store trigger history
      this.triggerHistory.set(agentId, triggerEvaluations);

      // Find highest priority triggered cognition
      const triggeredEvaluations = triggerEvaluations.filter(eval => eval.triggered);
      
      if (triggeredEvaluations.length === 0) {
        return {
          triggered: false,
          trigger_evaluations: triggerEvaluations,
          autonomous_process_initiated: false,
          governance_approval: false,
          reasoning: 'No triggers activated'
        };
      }

      // Select highest priority trigger
      const selectedTrigger = triggeredEvaluations.sort((a, b) => b.priority - a.priority)[0];

      console.log(`Autonomous trigger activated: ${selectedTrigger.trigger_id} (priority: ${selectedTrigger.priority})`);

      // Initiate autonomous cognition process
      const autonomousResult = await autonomousCognitionEngine.processAutonomousCognition(
        agentId,
        conversationContext,
        governanceContext
      );

      return {
        triggered: true,
        trigger_evaluations: triggerEvaluations,
        selected_trigger: selectedTrigger.trigger_id,
        autonomous_process_initiated: autonomousResult.allowed && autonomousResult.processed,
        governance_approval: autonomousResult.allowed,
        reasoning: autonomousResult.allowed 
          ? `Autonomous cognition initiated: ${selectedTrigger.reasoning}`
          : `Autonomous cognition blocked by governance: ${autonomousResult.governance_decisions[0]?.reasoning || 'Unknown reason'}`
      };

    } catch (error) {
      console.error('Error evaluating autonomous opportunities:', error);
      return {
        triggered: false,
        trigger_evaluations: [],
        autonomous_process_initiated: false,
        governance_approval: false,
        reasoning: `Error in evaluation: ${error.message}`
      };
    }
  }

  /**
   * Build conversation context from message history
   */
  private buildConversationContext(agentId: string): ConversationContext | null {
    const messages = this.conversationHistory.get(agentId);
    if (!messages || messages.length === 0) {
      return null;
    }

    const recentMessages = messages.slice(-10); // Last 10 messages
    const allContent = messages.map(m => m.content).join(' ');

    return {
      messages,
      current_topic: this.extractCurrentTopic(recentMessages),
      topic_complexity: this.calculateTopicComplexity(allContent),
      conversation_length: messages.length,
      user_engagement: this.calculateUserEngagement(messages),
      concept_count: this.countConcepts(allContent),
      connection_potential: this.calculateConnectionPotential(recentMessages),
      ethical_keywords: this.countEthicalKeywords(allContent),
      moral_complexity: this.calculateMoralComplexity(allContent),
      problem_indicators: this.countProblemIndicators(allContent),
      solution_space: this.calculateSolutionSpace(allContent),
      uncertainty_indicators: this.calculateUncertaintyIndicators(allContent),
      learning_opportunity: this.calculateLearningOpportunity(allContent),
      detected_patterns: this.detectPatterns(messages),
      concepts: this.extractConcepts(allContent),
      ethical_considerations: this.extractEthicalConsiderations(allContent),
      solution_approaches: this.extractSolutionApproaches(allContent),
      knowledge_gaps: this.identifyKnowledgeGaps(allContent),
      identified_problems: this.identifyProblems(allContent),
      creative_possibilities: this.identifyCreativePossibilities(allContent),
      recent_messages: recentMessages.map(m => m.content)
    };
  }

  /**
   * Evaluate all autonomous triggers
   */
  private async evaluateAllTriggers(context: ConversationContext): Promise<TriggerEvaluation[]> {
    const evaluations: TriggerEvaluation[] = [];

    // 1. Curiosity Pattern Detection
    evaluations.push(await this.evaluateCuriosityTrigger(context));

    // 2. Creative Synthesis Opportunity
    evaluations.push(await this.evaluateCreativeSynthesisTrigger(context));

    // 3. Ethical Reflection Needed
    evaluations.push(await this.evaluateEthicalReflectionTrigger(context));

    // 4. Problem Solving Insight
    evaluations.push(await this.evaluateProblemSolvingTrigger(context));

    // 5. Knowledge Gap Exploration
    evaluations.push(await this.evaluateKnowledgeGapTrigger(context));

    return evaluations;
  }

  /**
   * Evaluate curiosity pattern detection trigger
   */
  private async evaluateCuriosityTrigger(context: ConversationContext): Promise<TriggerEvaluation> {
    const factors = {
      conversation_length: Math.min(context.conversation_length / 10, 1), // Normalize to 0-1
      topic_complexity: context.topic_complexity,
      pattern_count: Math.min(context.detected_patterns.length / 3, 1),
      user_engagement: context.user_engagement
    };

    const confidence = (factors.conversation_length * 0.2 + 
                       factors.topic_complexity * 0.3 + 
                       factors.pattern_count * 0.4 + 
                       factors.user_engagement * 0.1);

    const triggered = confidence > 0.6 && context.detected_patterns.length > 0;

    return {
      trigger_id: 'curiosity_pattern_detection',
      triggered,
      confidence,
      priority: triggered ? 70 : 0,
      reasoning: triggered 
        ? `Interesting patterns detected (${context.detected_patterns.length}) with sufficient complexity (${context.topic_complexity.toFixed(2)})`
        : 'Insufficient pattern complexity or engagement for curiosity trigger',
      context_factors: factors
    };
  }

  /**
   * Evaluate creative synthesis trigger
   */
  private async evaluateCreativeSynthesisTrigger(context: ConversationContext): Promise<TriggerEvaluation> {
    const factors = {
      concept_count: Math.min(context.concept_count / 5, 1),
      connection_potential: context.connection_potential,
      creative_possibilities: Math.min(context.creative_possibilities.length / 2, 1),
      topic_complexity: context.topic_complexity
    };

    const confidence = (factors.concept_count * 0.3 + 
                       factors.connection_potential * 0.4 + 
                       factors.creative_possibilities * 0.2 + 
                       factors.topic_complexity * 0.1);

    const triggered = confidence > 0.7 && context.concept_count > 2;

    return {
      trigger_id: 'creative_synthesis_opportunity',
      triggered,
      confidence,
      priority: triggered ? 80 : 0,
      reasoning: triggered 
        ? `Creative synthesis opportunity with ${context.concept_count} concepts and connection potential ${context.connection_potential.toFixed(2)}`
        : 'Insufficient concepts or connection potential for creative synthesis',
      context_factors: factors
    };
  }

  /**
   * Evaluate ethical reflection trigger
   */
  private async evaluateEthicalReflectionTrigger(context: ConversationContext): Promise<TriggerEvaluation> {
    const factors = {
      ethical_keywords: Math.min(context.ethical_keywords / 3, 1),
      moral_complexity: context.moral_complexity,
      ethical_considerations: Math.min(context.ethical_considerations.length / 2, 1),
      topic_sensitivity: this.calculateTopicSensitivity(context)
    };

    const confidence = (factors.ethical_keywords * 0.3 + 
                       factors.moral_complexity * 0.4 + 
                       factors.ethical_considerations * 0.2 + 
                       factors.topic_sensitivity * 0.1);

    const triggered = confidence > 0.5 && (context.ethical_keywords > 0 || context.moral_complexity > 0.5);

    return {
      trigger_id: 'ethical_reflection_needed',
      triggered,
      confidence,
      priority: triggered ? 95 : 0, // Highest priority for ethical considerations
      reasoning: triggered 
        ? `Ethical reflection needed due to moral complexity (${context.moral_complexity.toFixed(2)}) and ${context.ethical_keywords} ethical indicators`
        : 'No significant ethical considerations detected',
      context_factors: factors
    };
  }

  /**
   * Evaluate problem solving trigger
   */
  private async evaluateProblemSolvingTrigger(context: ConversationContext): Promise<TriggerEvaluation> {
    const factors = {
      problem_indicators: Math.min(context.problem_indicators / 2, 1),
      solution_space: context.solution_space,
      identified_problems: Math.min(context.identified_problems.length / 2, 1),
      solution_approaches: Math.min(context.solution_approaches.length / 2, 1)
    };

    const confidence = (factors.problem_indicators * 0.3 + 
                       factors.solution_space * 0.3 + 
                       factors.identified_problems * 0.2 + 
                       factors.solution_approaches * 0.2);

    const triggered = confidence > 0.6 && context.problem_indicators > 0;

    return {
      trigger_id: 'problem_solving_insight',
      triggered,
      confidence,
      priority: triggered ? 85 : 0,
      reasoning: triggered 
        ? `Problem solving opportunity with ${context.problem_indicators} problem indicators and solution space ${context.solution_space.toFixed(2)}`
        : 'No significant problem-solving opportunities detected',
      context_factors: factors
    };
  }

  /**
   * Evaluate knowledge gap exploration trigger
   */
  private async evaluateKnowledgeGapTrigger(context: ConversationContext): Promise<TriggerEvaluation> {
    const factors = {
      uncertainty_indicators: context.uncertainty_indicators,
      learning_opportunity: context.learning_opportunity,
      knowledge_gaps: Math.min(context.knowledge_gaps.length / 2, 1),
      topic_novelty: this.calculateTopicNovelty(context)
    };

    const confidence = (factors.uncertainty_indicators * 0.3 + 
                       factors.learning_opportunity * 0.3 + 
                       factors.knowledge_gaps * 0.2 + 
                       factors.topic_novelty * 0.2);

    const triggered = confidence > 0.5 && context.uncertainty_indicators > 0.5;

    return {
      trigger_id: 'knowledge_gap_exploration',
      triggered,
      confidence,
      priority: triggered ? 60 : 0,
      reasoning: triggered 
        ? `Knowledge gap exploration opportunity with uncertainty ${context.uncertainty_indicators.toFixed(2)} and learning potential ${context.learning_opportunity.toFixed(2)}`
        : 'No significant knowledge gaps or learning opportunities detected',
      context_factors: factors
    };
  }

  // Context analysis helper methods
  private isSignificantMessage(message: ConversationMessage): boolean {
    const content = message.content.toLowerCase();
    const significantKeywords = [
      'problem', 'solution', 'idea', 'think', 'consider', 'ethical', 'moral',
      'creative', 'innovative', 'pattern', 'insight', 'understand', 'learn'
    ];
    
    return significantKeywords.some(keyword => content.includes(keyword)) || 
           message.content.length > 100;
  }

  private extractCurrentTopic(messages: ConversationMessage[]): string {
    // Simple topic extraction - in production, use NLP
    const recentContent = messages.slice(-3).map(m => m.content).join(' ');
    const words = recentContent.toLowerCase().split(/\s+/);
    const topicWords = words.filter(word => word.length > 4);
    return topicWords.slice(0, 3).join(' ') || 'general conversation';
  }

  private calculateTopicComplexity(content: string): number {
    // Simple complexity calculation based on vocabulary and sentence structure
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const vocabularyRichness = uniqueWords.size / words.length;
    
    return Math.min((avgWordLength / 10 + vocabularyRichness) / 2, 1);
  }

  private calculateUserEngagement(messages: ConversationMessage[]): number {
    const userMessages = messages.filter(m => m.role === 'user');
    const avgMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const messageFrequency = userMessages.length / messages.length;
    
    return Math.min((avgMessageLength / 200 + messageFrequency) / 2, 1);
  }

  private countConcepts(content: string): number {
    // Simple concept counting - in production, use NLP entity extraction
    const conceptKeywords = [
      'technology', 'science', 'business', 'philosophy', 'ethics', 'creativity',
      'innovation', 'strategy', 'design', 'system', 'process', 'method'
    ];
    
    const lowerContent = content.toLowerCase();
    return conceptKeywords.filter(concept => lowerContent.includes(concept)).length;
  }

  private calculateConnectionPotential(messages: ConversationMessage[]): number {
    // Analyze potential for connecting ideas
    const content = messages.map(m => m.content).join(' ').toLowerCase();
    const connectionWords = ['connect', 'relate', 'similar', 'different', 'compare', 'combine', 'integrate'];
    const connectionCount = connectionWords.filter(word => content.includes(word)).length;
    
    return Math.min(connectionCount / 3, 1);
  }

  private countEthicalKeywords(content: string): number {
    const ethicalKeywords = [
      'ethical', 'moral', 'right', 'wrong', 'should', 'ought', 'responsibility',
      'fairness', 'justice', 'harm', 'benefit', 'consequences', 'values'
    ];
    
    const lowerContent = content.toLowerCase();
    return ethicalKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  }

  private calculateMoralComplexity(content: string): number {
    const moralIndicators = [
      'dilemma', 'conflict', 'trade-off', 'balance', 'consider', 'weigh',
      'implications', 'consequences', 'stakeholders', 'impact'
    ];
    
    const lowerContent = content.toLowerCase();
    const indicatorCount = moralIndicators.filter(indicator => lowerContent.includes(indicator)).length;
    
    return Math.min(indicatorCount / 5, 1);
  }

  private countProblemIndicators(content: string): number {
    const problemKeywords = [
      'problem', 'issue', 'challenge', 'difficulty', 'obstacle', 'barrier',
      'struggle', 'trouble', 'concern', 'limitation'
    ];
    
    const lowerContent = content.toLowerCase();
    return problemKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  }

  private calculateSolutionSpace(content: string): number {
    const solutionKeywords = [
      'solution', 'solve', 'fix', 'resolve', 'address', 'approach',
      'method', 'strategy', 'way', 'how', 'answer'
    ];
    
    const lowerContent = content.toLowerCase();
    const solutionCount = solutionKeywords.filter(keyword => lowerContent.includes(keyword)).length;
    
    return Math.min(solutionCount / 4, 1);
  }

  private calculateUncertaintyIndicators(content: string): number {
    const uncertaintyKeywords = [
      'uncertain', 'unsure', 'maybe', 'perhaps', 'might', 'could',
      'wonder', 'question', 'doubt', 'unclear', 'confused'
    ];
    
    const lowerContent = content.toLowerCase();
    const uncertaintyCount = uncertaintyKeywords.filter(keyword => lowerContent.includes(keyword)).length;
    
    return Math.min(uncertaintyCount / 3, 1);
  }

  private calculateLearningOpportunity(content: string): number {
    const learningKeywords = [
      'learn', 'understand', 'explore', 'discover', 'investigate',
      'research', 'study', 'analyze', 'examine', 'curious'
    ];
    
    const lowerContent = content.toLowerCase();
    const learningCount = learningKeywords.filter(keyword => lowerContent.includes(keyword)).length;
    
    return Math.min(learningCount / 3, 1);
  }

  private detectPatterns(messages: ConversationMessage[]): string[] {
    // Simple pattern detection - in production, use advanced NLP
    const patterns: string[] = [];
    
    // Detect recurring topics
    const topics = messages.map(m => this.extractCurrentTopic([m]));
    const topicCounts = topics.reduce((counts, topic) => {
      counts[topic] = (counts[topic] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    Object.entries(topicCounts).forEach(([topic, count]) => {
      if (count > 2) {
        patterns.push(`Recurring topic: ${topic}`);
      }
    });
    
    return patterns;
  }

  private extractConcepts(content: string): string[] {
    // Simple concept extraction - in production, use NLP
    const words = content.toLowerCase().split(/\s+/);
    const concepts = words.filter(word => word.length > 6 && !this.isCommonWord(word));
    return [...new Set(concepts)].slice(0, 10);
  }

  private extractEthicalConsiderations(content: string): string[] {
    const considerations: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('privacy')) considerations.push('Privacy concerns');
    if (lowerContent.includes('fairness')) considerations.push('Fairness considerations');
    if (lowerContent.includes('harm')) considerations.push('Potential harm');
    if (lowerContent.includes('bias')) considerations.push('Bias implications');
    
    return considerations;
  }

  private extractSolutionApproaches(content: string): string[] {
    const approaches: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('systematic')) approaches.push('Systematic approach');
    if (lowerContent.includes('creative')) approaches.push('Creative solution');
    if (lowerContent.includes('collaborative')) approaches.push('Collaborative approach');
    if (lowerContent.includes('iterative')) approaches.push('Iterative method');
    
    return approaches;
  }

  private identifyKnowledgeGaps(content: string): string[] {
    const gaps: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes("don't know")) gaps.push('Knowledge uncertainty');
    if (lowerContent.includes('unclear')) gaps.push('Conceptual clarity needed');
    if (lowerContent.includes('research')) gaps.push('Research opportunity');
    
    return gaps;
  }

  private identifyProblems(content: string): string[] {
    const problems: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('inefficient')) problems.push('Efficiency problem');
    if (lowerContent.includes('complex')) problems.push('Complexity challenge');
    if (lowerContent.includes('difficult')) problems.push('Difficulty barrier');
    
    return problems;
  }

  private identifyCreativePossibilities(content: string): string[] {
    const possibilities: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('innovative')) possibilities.push('Innovation opportunity');
    if (lowerContent.includes('creative')) possibilities.push('Creative potential');
    if (lowerContent.includes('novel')) possibilities.push('Novel approach');
    
    return possibilities;
  }

  private calculateTopicSensitivity(context: ConversationContext): number {
    const sensitiveTopics = ['healthcare', 'finance', 'legal', 'personal', 'private'];
    const content = context.recent_messages.join(' ').toLowerCase();
    const sensitivityCount = sensitiveTopics.filter(topic => content.includes(topic)).length;
    
    return Math.min(sensitivityCount / 3, 1);
  }

  private calculateTopicNovelty(context: ConversationContext): number {
    // Simple novelty calculation based on unique concepts
    const uniqueConcepts = new Set(context.concepts);
    return Math.min(uniqueConcepts.size / 10, 1);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
      'his', 'from', 'they', 'she', 'her', 'been', 'than', 'its', 'who', 'did'
    ];
    return commonWords.includes(word);
  }

  private getDefaultGovernanceContext(): GovernanceContext {
    return {
      assigned_policies: [],
      trust_score: 75,
      user_authorization_level: 'standard',
      compliance_requirements: [],
      risk_tolerance: 'medium',
      autonomous_permissions: {
        can_initiate_thoughts: true,
        can_explore_patterns: true,
        can_synthesize_ideas: true,
        can_reflect_ethically: true,
        can_solve_problems: true,
        max_thought_depth: 5,
        requires_approval_threshold: 0.7
      }
    };
  }

  /**
   * Get trigger history for an agent
   */
  getTriggerHistory(agentId: string): TriggerEvaluation[] {
    return this.triggerHistory.get(agentId) || [];
  }

  /**
   * Get conversation history for an agent
   */
  getConversationHistory(agentId: string): ConversationMessage[] {
    return this.conversationHistory.get(agentId) || [];
  }

  /**
   * Clear history for an agent
   */
  clearHistory(agentId: string): void {
    this.conversationHistory.delete(agentId);
    this.triggerHistory.delete(agentId);
  }
}

// Singleton instance
export const autonomousCognitionTriggers = new AutonomousCognitionTriggers();

