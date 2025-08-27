/**
 * SmartSuggestionService - Intelligent trigger-based agent suggestion system
 * Provides efficient agent engagement suggestions without constant token monitoring
 */

export interface TriggerPattern {
  id: string;
  name: string;
  keywords: string[];
  patterns: RegExp[];
  agentExpertise: string[];
  confidence: number;
  description: string;
}

export interface AgentSuggestion {
  agentId: string;
  agentName: string;
  reason: string;
  confidence: number;
  triggerType: 'keyword' | 'question' | 'disagreement' | 'expertise' | 'topic';
  suggestedAction: 'interject' | 'clarify' | 'provide_expertise' | 'challenge' | 'collaborate';
  estimatedTokenCost: number;
}

export interface ConversationContext {
  recentMessages: Array<{
    content: string;
    agentId: string;
    timestamp: Date;
  }>;
  currentTopic?: string;
  participantExpertise: { [agentId: string]: string[] };
  conversationTone: 'collaborative' | 'debate' | 'inquiry' | 'problem_solving';
}

export class SmartSuggestionService {
  private static instance: SmartSuggestionService;
  private triggerPatterns: TriggerPattern[] = [];
  private suggestionCallbacks: Array<(suggestions: AgentSuggestion[]) => void> = [];

  public static getInstance(): SmartSuggestionService {
    if (!SmartSuggestionService.instance) {
      SmartSuggestionService.instance = new SmartSuggestionService();
    }
    return SmartSuggestionService.instance;
  }

  constructor() {
    this.initializeDefaultTriggers();
  }

  private initializeDefaultTriggers() {
    this.triggerPatterns = [
      {
        id: 'question_detection',
        name: 'Question Detection',
        keywords: ['what', 'how', 'why', 'when', 'where', 'which', 'who'],
        patterns: [/\?$/, /^(what|how|why|when|where|which|who)\s/i],
        agentExpertise: [],
        confidence: 0.8,
        description: 'Detects questions that might benefit from additional perspectives'
      },
      {
        id: 'disagreement_detection',
        name: 'Disagreement Detection',
        keywords: ['disagree', 'wrong', 'incorrect', 'however', 'but', 'actually', 'no'],
        patterns: [/\b(disagree|wrong|incorrect)\b/i, /^(however|but|actually)\s/i],
        agentExpertise: [],
        confidence: 0.7,
        description: 'Detects potential disagreements that could benefit from mediation'
      },
      {
        id: 'technical_discussion',
        name: 'Technical Discussion',
        keywords: ['algorithm', 'code', 'programming', 'technical', 'implementation', 'architecture'],
        patterns: [/\b(algorithm|implementation|architecture)\b/i],
        agentExpertise: ['programming', 'technical', 'engineering'],
        confidence: 0.9,
        description: 'Detects technical discussions where expert agents could contribute'
      },
      {
        id: 'creative_brainstorming',
        name: 'Creative Brainstorming',
        keywords: ['idea', 'creative', 'brainstorm', 'innovative', 'design', 'concept'],
        patterns: [/\b(brainstorm|innovative|creative)\b/i],
        agentExpertise: ['creative', 'design', 'innovation'],
        confidence: 0.8,
        description: 'Detects creative discussions where creative agents could add value'
      },
      {
        id: 'problem_solving',
        name: 'Problem Solving',
        keywords: ['problem', 'issue', 'challenge', 'solve', 'solution', 'fix'],
        patterns: [/\b(problem|challenge|solve)\b/i],
        agentExpertise: ['analyst', 'problem_solving'],
        confidence: 0.8,
        description: 'Detects problem-solving discussions where analytical agents could help'
      },
      {
        id: 'decision_making',
        name: 'Decision Making',
        keywords: ['decide', 'choice', 'option', 'alternative', 'pros', 'cons'],
        patterns: [/\b(decide|choice|alternative)\b/i],
        agentExpertise: ['facilitator', 'analyst'],
        confidence: 0.7,
        description: 'Detects decision-making discussions where facilitator agents could help'
      }
    ];
  }

  /**
   * Analyze conversation and generate agent suggestions without burning tokens
   */
  public analyzeConversation(
    context: ConversationContext,
    availableAgents: Array<{ id: string; name: string; expertise?: string[]; temporaryRole?: string }>,
    sensitivityLevel: number = 5
  ): AgentSuggestion[] {
    const suggestions: AgentSuggestion[] = [];
    const recentMessage = context.recentMessages[context.recentMessages.length - 1];
    
    if (!recentMessage) return suggestions;

    const messageContent = recentMessage.content.toLowerCase();
    const threshold = (10 - sensitivityLevel) / 10; // Convert 1-10 scale to 0-1 threshold

    // Analyze against each trigger pattern
    for (const pattern of this.triggerPatterns) {
      const matchScore = this.calculatePatternMatch(messageContent, pattern);
      
      if (matchScore >= threshold) {
        // Find agents that could contribute based on expertise or role
        const relevantAgents = availableAgents.filter(agent => {
          // Skip the agent who just sent the message
          if (agent.id === recentMessage.agentId) return false;
          
          // Check expertise match
          const expertiseMatch = pattern.agentExpertise.length === 0 || 
            (agent.expertise && agent.expertise.some(exp => 
              pattern.agentExpertise.includes(exp)
            ));
          
          // Check temporary role match
          const roleMatch = this.isRoleRelevant(agent.temporaryRole, pattern.id);
          
          return expertiseMatch || roleMatch;
        });

        // Generate suggestions for relevant agents
        for (const agent of relevantAgents) {
          const suggestion = this.createAgentSuggestion(
            agent,
            pattern,
            messageContent,
            matchScore,
            context
          );
          
          if (suggestion) {
            suggestions.push(suggestion);
          }
        }
      }
    }

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Limit to top 3 suggestions
  }

  private calculatePatternMatch(message: string, pattern: TriggerPattern): number {
    let score = 0;
    let matches = 0;

    // Check keyword matches
    for (const keyword of pattern.keywords) {
      if (message.includes(keyword)) {
        matches++;
        score += 0.3;
      }
    }

    // Check regex pattern matches
    for (const regex of pattern.patterns) {
      if (regex.test(message)) {
        matches++;
        score += 0.5;
      }
    }

    // Normalize score based on pattern confidence
    return Math.min(score * pattern.confidence, 1.0);
  }

  private isRoleRelevant(temporaryRole: string | undefined, patternId: string): boolean {
    if (!temporaryRole) return false;

    const rolePatternMap: { [role: string]: string[] } = {
      'devils_advocate': ['disagreement_detection', 'decision_making'],
      'expert': ['technical_discussion', 'problem_solving'],
      'facilitator': ['disagreement_detection', 'decision_making'],
      'critic': ['disagreement_detection', 'decision_making'],
      'creative': ['creative_brainstorming'],
      'analyst': ['problem_solving', 'decision_making'],
      'collaborative': ['question_detection', 'creative_brainstorming']
    };

    return rolePatternMap[temporaryRole]?.includes(patternId) || false;
  }

  private createAgentSuggestion(
    agent: { id: string; name: string; expertise?: string[]; temporaryRole?: string },
    pattern: TriggerPattern,
    messageContent: string,
    matchScore: number,
    context: ConversationContext
  ): AgentSuggestion | null {
    const suggestedActions: { [patternId: string]: AgentSuggestion['suggestedAction'] } = {
      'question_detection': 'provide_expertise',
      'disagreement_detection': 'clarify',
      'technical_discussion': 'provide_expertise',
      'creative_brainstorming': 'collaborate',
      'problem_solving': 'provide_expertise',
      'decision_making': 'clarify'
    };

    const reasons: { [patternId: string]: string } = {
      'question_detection': 'Could provide additional insights on this question',
      'disagreement_detection': 'Could help mediate or provide alternative perspective',
      'technical_discussion': 'Has relevant technical expertise',
      'creative_brainstorming': 'Could contribute creative ideas',
      'problem_solving': 'Could help analyze and solve this problem',
      'decision_making': 'Could help evaluate options and facilitate decision'
    };

    // Estimate token cost based on action type
    const tokenCosts: { [action: string]: number } = {
      'interject': 150,
      'clarify': 100,
      'provide_expertise': 200,
      'challenge': 120,
      'collaborate': 180
    };

    const suggestedAction = suggestedActions[pattern.id] || 'collaborate';
    
    return {
      agentId: agent.id,
      agentName: agent.name,
      reason: reasons[pattern.id] || 'Could contribute to this discussion',
      confidence: matchScore,
      triggerType: this.mapPatternToTriggerType(pattern.id),
      suggestedAction,
      estimatedTokenCost: tokenCosts[suggestedAction] || 150
    };
  }

  private mapPatternToTriggerType(patternId: string): AgentSuggestion['triggerType'] {
    const mapping: { [id: string]: AgentSuggestion['triggerType'] } = {
      'question_detection': 'question',
      'disagreement_detection': 'disagreement',
      'technical_discussion': 'expertise',
      'creative_brainstorming': 'topic',
      'problem_solving': 'topic',
      'decision_making': 'topic'
    };
    return mapping[patternId] || 'keyword';
  }

  /**
   * Subscribe to suggestion updates
   */
  public onSuggestions(callback: (suggestions: AgentSuggestion[]) => void) {
    this.suggestionCallbacks.push(callback);
  }

  /**
   * Unsubscribe from suggestion updates
   */
  public offSuggestions(callback: (suggestions: AgentSuggestion[]) => void) {
    this.suggestionCallbacks = this.suggestionCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Manually trigger suggestion analysis
   */
  public triggerAnalysis(context: ConversationContext, availableAgents: any[], sensitivityLevel: number = 5) {
    const suggestions = this.analyzeConversation(context, availableAgents, sensitivityLevel);
    this.suggestionCallbacks.forEach(callback => callback(suggestions));
    return suggestions;
  }

  /**
   * Add custom trigger pattern
   */
  public addTriggerPattern(pattern: TriggerPattern) {
    this.triggerPatterns.push(pattern);
  }

  /**
   * Remove trigger pattern
   */
  public removeTriggerPattern(patternId: string) {
    this.triggerPatterns = this.triggerPatterns.filter(p => p.id !== patternId);
  }

  /**
   * Get all trigger patterns
   */
  public getTriggerPatterns(): TriggerPattern[] {
    return [...this.triggerPatterns];
  }
}

export default SmartSuggestionService;

