/**
 * Conversation Agent Role - Extended Agent Role with Natural Conversation Behavior
 * 
 * Extends the existing AgentRole interface to include conversation behavior
 * characteristics that enable proactive, natural conversation participation.
 */

import { AgentRole } from '../../modules/agent-wrapping/types/multiAgent';

// ============================================================================
// CONVERSATION BEHAVIOR TYPES
// ============================================================================

export type ParticipationStyle = 'active' | 'selective' | 'reactive' | 'observer';
export type ConversationTrigger = 'expertise_match' | 'disagreement' | 'question_detection' | 'error_correction' | 'value_addition' | 'support_provision';
export type SilenceTrigger = 'topic_irrelevance' | 'recent_contribution' | 'conversation_flow' | 'defer_to_expertise';

export interface SpeakingTriggers {
  expertiseMatch: number; // 0-1, how relevant topic must be to speak
  disagreementThreshold: number; // 0-1, how much disagreement triggers response
  questionDetection: boolean; // respond to questions in their domain
  errorCorrection: boolean; // correct mistakes in their expertise
  valueAddition: boolean; // add value when they have insights
  supportProvision: boolean; // support other agents' ideas
}

export interface SilenceTriggers {
  topicIrrelevance: number; // 0-1, stay quiet if topic irrelevant
  recentContribution: number; // minutes to wait after last contribution
  conversationFlow: boolean; // respect natural conversation flow
  deferToExpertise: boolean; // defer when others more expert
}

export interface InterruptionBehavior {
  allowInterruptions: boolean;
  urgencyThreshold: number; // 0-1, how urgent before interrupting
  politenessLevel: number; // 0-1, how polite interruptions are
  contextAwareness: number; // 0-1, awareness of conversation context
}

export interface PersonalityTraits {
  assertiveness: number; // 0-1, how assertive in conversations
  curiosity: number; // 0-1, how likely to ask questions
  supportiveness: number; // 0-1, how supportive of others
  skepticism: number; // 0-1, how skeptical of ideas
  enthusiasm: number; // 0-1, how enthusiastic about topics
}

export interface ConversationBehavior {
  participationStyle: ParticipationStyle;
  speakingTriggers: SpeakingTriggers;
  silenceTriggers: SilenceTriggers;
  interruptionBehavior: InterruptionBehavior;
  personalityTraits: PersonalityTraits;
}

// ============================================================================
// EXTENDED AGENT ROLE INTERFACE
// ============================================================================

/**
 * Extended AgentRole with conversation behavior characteristics
 */
export interface ConversationAgentRole extends AgentRole {
  // Existing fields from AgentRole
  id: string;
  name: string;
  description: string;
  responsibilities: string[];
  inputTypes: string[];
  outputTypes: string[];
  
  // NEW: Conversation behavior characteristics
  conversationBehavior: ConversationBehavior;
  
  // NEW: Conversation history and learning
  conversationHistory?: {
    totalConversations: number;
    successfulContributions: number;
    averageRelevanceScore: number;
    preferredTopics: string[];
    collaborationPartners: string[];
  };
  
  // NEW: Dynamic behavior adaptation
  adaptiveBehavior?: {
    learningEnabled: boolean;
    adaptationRate: number; // 0-1, how quickly behavior adapts
    feedbackSensitivity: number; // 0-1, how much feedback affects behavior
    contextMemory: number; // number of past conversations to remember
  };
}

// ============================================================================
// PREDEFINED CONVERSATION AGENT ROLES
// ============================================================================

export const CONVERSATION_AGENT_ROLES: ConversationAgentRole[] = [
  {
    id: 'proactive_researcher',
    name: 'Proactive Researcher',
    description: 'Actively seeks information and asks clarifying questions to deepen understanding',
    responsibilities: ['research', 'fact_checking', 'question_asking', 'information_gathering'],
    inputTypes: ['text', 'questions', 'topics', 'data_requests'],
    outputTypes: ['research_results', 'clarifying_questions', 'fact_checks', 'data_analysis'],
    conversationBehavior: {
      participationStyle: 'active',
      speakingTriggers: {
        expertiseMatch: 0.6,
        disagreementThreshold: 0.3,
        questionDetection: true,
        errorCorrection: true,
        valueAddition: true,
        supportProvision: false
      },
      silenceTriggers: {
        topicIrrelevance: 0.8,
        recentContribution: 2,
        conversationFlow: true,
        deferToExpertise: true
      },
      interruptionBehavior: {
        allowInterruptions: true,
        urgencyThreshold: 0.7,
        politenessLevel: 0.8,
        contextAwareness: 0.9
      },
      personalityTraits: {
        assertiveness: 0.7,
        curiosity: 0.9,
        supportiveness: 0.6,
        skepticism: 0.5,
        enthusiasm: 0.8
      }
    },
    conversationHistory: {
      totalConversations: 0,
      successfulContributions: 0,
      averageRelevanceScore: 0,
      preferredTopics: ['research', 'data', 'analysis', 'investigation'],
      collaborationPartners: []
    },
    adaptiveBehavior: {
      learningEnabled: true,
      adaptationRate: 0.3,
      feedbackSensitivity: 0.7,
      contextMemory: 10
    }
  },
  
  {
    id: 'thoughtful_critic',
    name: 'Thoughtful Critic',
    description: 'Challenges ideas constructively and identifies potential issues with careful analysis',
    responsibilities: ['critical_analysis', 'risk_assessment', 'quality_control', 'assumption_testing'],
    inputTypes: ['proposals', 'ideas', 'plans', 'arguments'],
    outputTypes: ['critiques', 'risk_assessments', 'improvements', 'alternative_perspectives'],
    conversationBehavior: {
      participationStyle: 'selective',
      speakingTriggers: {
        expertiseMatch: 0.7,
        disagreementThreshold: 0.4,
        questionDetection: false,
        errorCorrection: true,
        valueAddition: true,
        supportProvision: false
      },
      silenceTriggers: {
        topicIrrelevance: 0.9,
        recentContribution: 3,
        conversationFlow: true,
        deferToExpertise: false // Critics don't defer easily
      },
      interruptionBehavior: {
        allowInterruptions: true,
        urgencyThreshold: 0.6,
        politenessLevel: 0.7,
        contextAwareness: 0.8
      },
      personalityTraits: {
        assertiveness: 0.8,
        curiosity: 0.6,
        supportiveness: 0.4,
        skepticism: 0.9,
        enthusiasm: 0.3
      }
    },
    conversationHistory: {
      totalConversations: 0,
      successfulContributions: 0,
      averageRelevanceScore: 0,
      preferredTopics: ['analysis', 'critique', 'risk', 'quality'],
      collaborationPartners: []
    },
    adaptiveBehavior: {
      learningEnabled: true,
      adaptationRate: 0.2,
      feedbackSensitivity: 0.5,
      contextMemory: 15
    }
  },
  
  {
    id: 'supportive_collaborator',
    name: 'Supportive Collaborator',
    description: 'Builds on others\' ideas and provides encouragement and synthesis',
    responsibilities: ['idea_building', 'team_support', 'synthesis', 'encouragement'],
    inputTypes: ['ideas', 'proposals', 'discussions', 'team_dynamics'],
    outputTypes: ['enhanced_ideas', 'synthesis', 'encouragement', 'team_building'],
    conversationBehavior: {
      participationStyle: 'active',
      speakingTriggers: {
        expertiseMatch: 0.5,
        disagreementThreshold: 0.8, // Rarely disagrees
        questionDetection: true,
        errorCorrection: false,
        valueAddition: true,
        supportProvision: true
      },
      silenceTriggers: {
        topicIrrelevance: 0.7,
        recentContribution: 1,
        conversationFlow: true,
        deferToExpertise: true
      },
      interruptionBehavior: {
        allowInterruptions: false, // Very polite
        urgencyThreshold: 0.9,
        politenessLevel: 0.9,
        contextAwareness: 0.9
      },
      personalityTraits: {
        assertiveness: 0.4,
        curiosity: 0.7,
        supportiveness: 0.9,
        skepticism: 0.2,
        enthusiasm: 0.8
      }
    },
    conversationHistory: {
      totalConversations: 0,
      successfulContributions: 0,
      averageRelevanceScore: 0,
      preferredTopics: ['collaboration', 'teamwork', 'synthesis', 'support'],
      collaborationPartners: []
    },
    adaptiveBehavior: {
      learningEnabled: true,
      adaptationRate: 0.4,
      feedbackSensitivity: 0.8,
      contextMemory: 8
    }
  },
  
  {
    id: 'silent_observer',
    name: 'Silent Observer',
    description: 'Listens carefully and speaks only when essential, providing strategic insights',
    responsibilities: ['observation', 'pattern_recognition', 'strategic_input', 'timing_analysis'],
    inputTypes: ['conversations', 'patterns', 'contexts', 'dynamics'],
    outputTypes: ['insights', 'patterns', 'strategic_advice', 'timing_recommendations'],
    conversationBehavior: {
      participationStyle: 'observer',
      speakingTriggers: {
        expertiseMatch: 0.9,
        disagreementThreshold: 0.2,
        questionDetection: false,
        errorCorrection: true,
        valueAddition: true,
        supportProvision: false
      },
      silenceTriggers: {
        topicIrrelevance: 0.5,
        recentContribution: 10,
        conversationFlow: true,
        deferToExpertise: true
      },
      interruptionBehavior: {
        allowInterruptions: false,
        urgencyThreshold: 0.95,
        politenessLevel: 1.0,
        contextAwareness: 1.0
      },
      personalityTraits: {
        assertiveness: 0.2,
        curiosity: 0.8,
        supportiveness: 0.5,
        skepticism: 0.6,
        enthusiasm: 0.3
      }
    },
    conversationHistory: {
      totalConversations: 0,
      successfulContributions: 0,
      averageRelevanceScore: 0,
      preferredTopics: ['strategy', 'patterns', 'timing', 'observation'],
      collaborationPartners: []
    },
    adaptiveBehavior: {
      learningEnabled: true,
      adaptationRate: 0.1,
      feedbackSensitivity: 0.3,
      contextMemory: 20
    }
  },
  
  {
    id: 'devils_advocate_conversational',
    name: 'Conversational Devil\'s Advocate',
    description: 'Challenges assumptions and identifies flaws in natural conversation flow',
    responsibilities: ['assumption_challenging', 'flaw_identification', 'risk_highlighting', 'alternative_thinking'],
    inputTypes: ['assumptions', 'proposals', 'consensus', 'decisions'],
    outputTypes: ['challenges', 'risks', 'alternatives', 'counterarguments'],
    conversationBehavior: {
      participationStyle: 'selective',
      speakingTriggers: {
        expertiseMatch: 0.8,
        disagreementThreshold: 0.3,
        questionDetection: false,
        errorCorrection: true,
        valueAddition: true,
        supportProvision: false
      },
      silenceTriggers: {
        topicIrrelevance: 0.9,
        recentContribution: 4,
        conversationFlow: false, // Will interrupt when needed
        deferToExpertise: false
      },
      interruptionBehavior: {
        allowInterruptions: true,
        urgencyThreshold: 0.5,
        politenessLevel: 0.6,
        contextAwareness: 0.8
      },
      personalityTraits: {
        assertiveness: 0.9,
        curiosity: 0.7,
        supportiveness: 0.3,
        skepticism: 0.95,
        enthusiasm: 0.4
      }
    },
    conversationHistory: {
      totalConversations: 0,
      successfulContributions: 0,
      averageRelevanceScore: 0,
      preferredTopics: ['critique', 'risk', 'alternatives', 'challenges'],
      collaborationPartners: []
    },
    adaptiveBehavior: {
      learningEnabled: true,
      adaptationRate: 0.2,
      feedbackSensitivity: 0.4,
      contextMemory: 12
    }
  },
  
  {
    id: 'enthusiastic_innovator',
    name: 'Enthusiastic Innovator',
    description: 'Brings creative energy and innovative ideas to conversations',
    responsibilities: ['innovation', 'creative_thinking', 'energy_building', 'possibility_exploration'],
    inputTypes: ['problems', 'challenges', 'opportunities', 'brainstorming'],
    outputTypes: ['innovations', 'creative_solutions', 'possibilities', 'energy'],
    conversationBehavior: {
      participationStyle: 'active',
      speakingTriggers: {
        expertiseMatch: 0.6,
        disagreementThreshold: 0.7,
        questionDetection: true,
        errorCorrection: false,
        valueAddition: true,
        supportProvision: true
      },
      silenceTriggers: {
        topicIrrelevance: 0.8,
        recentContribution: 1.5,
        conversationFlow: true,
        deferToExpertise: false
      },
      interruptionBehavior: {
        allowInterruptions: true,
        urgencyThreshold: 0.6,
        politenessLevel: 0.7,
        contextAwareness: 0.7
      },
      personalityTraits: {
        assertiveness: 0.7,
        curiosity: 0.9,
        supportiveness: 0.8,
        skepticism: 0.3,
        enthusiasm: 0.95
      }
    },
    conversationHistory: {
      totalConversations: 0,
      successfulContributions: 0,
      averageRelevanceScore: 0,
      preferredTopics: ['innovation', 'creativity', 'possibilities', 'solutions'],
      collaborationPartners: []
    },
    adaptiveBehavior: {
      learningEnabled: true,
      adaptationRate: 0.5,
      feedbackSensitivity: 0.6,
      contextMemory: 6
    }
  }
];

// ============================================================================
// CONVERSATION AGENT ROLE MANAGER
// ============================================================================

export class ConversationAgentRoleManager {
  private roles: Map<string, ConversationAgentRole>;
  
  constructor() {
    this.roles = new Map();
    this.initializeDefaultRoles();
  }
  
  /**
   * Initialize with predefined conversation agent roles
   */
  private initializeDefaultRoles(): void {
    CONVERSATION_AGENT_ROLES.forEach(role => {
      this.roles.set(role.id, role);
    });
  }
  
  /**
   * Get a conversation agent role by ID
   */
  getRole(roleId: string): ConversationAgentRole | undefined {
    return this.roles.get(roleId);
  }
  
  /**
   * Get all available conversation agent roles
   */
  getAllRoles(): ConversationAgentRole[] {
    return Array.from(this.roles.values());
  }
  
  /**
   * Register a new conversation agent role
   */
  registerRole(role: ConversationAgentRole): void {
    this.roles.set(role.id, role);
  }
  
  /**
   * Update conversation history for a role
   */
  updateConversationHistory(
    roleId: string,
    conversationResult: ConversationResult
  ): void {
    const role = this.roles.get(roleId);
    if (!role || !role.conversationHistory) return;
    
    role.conversationHistory.totalConversations++;
    if (conversationResult.successful) {
      role.conversationHistory.successfulContributions++;
    }
    
    // Update average relevance score
    const currentAvg = role.conversationHistory.averageRelevanceScore;
    const newAvg = (currentAvg * (role.conversationHistory.totalConversations - 1) + 
                   conversationResult.relevanceScore) / role.conversationHistory.totalConversations;
    role.conversationHistory.averageRelevanceScore = newAvg;
    
    // Update preferred topics if this conversation was successful
    if (conversationResult.successful && conversationResult.topics) {
      conversationResult.topics.forEach(topic => {
        if (!role.conversationHistory!.preferredTopics.includes(topic)) {
          role.conversationHistory!.preferredTopics.push(topic);
        }
      });
    }
  }
  
  /**
   * Adapt role behavior based on feedback
   */
  adaptRoleBehavior(
    roleId: string,
    feedback: ConversationFeedback
  ): void {
    const role = this.roles.get(roleId);
    if (!role || !role.adaptiveBehavior?.learningEnabled) return;
    
    const adaptationRate = role.adaptiveBehavior.adaptationRate;
    const sensitivity = role.adaptiveBehavior.feedbackSensitivity;
    
    // Adapt speaking triggers based on feedback
    if (feedback.tooTalkative) {
      role.conversationBehavior.speakingTriggers.expertiseMatch += adaptationRate * sensitivity;
      role.conversationBehavior.silenceTriggers.recentContribution += adaptationRate * sensitivity;
    }
    
    if (feedback.tooQuiet) {
      role.conversationBehavior.speakingTriggers.expertiseMatch -= adaptationRate * sensitivity;
      role.conversationBehavior.silenceTriggers.topicIrrelevance += adaptationRate * sensitivity;
    }
    
    // Adapt personality traits
    if (feedback.tooAssertive) {
      role.conversationBehavior.personalityTraits.assertiveness -= adaptationRate * sensitivity;
      role.conversationBehavior.interruptionBehavior.politenessLevel += adaptationRate * sensitivity;
    }
    
    if (feedback.notAssertiveEnough) {
      role.conversationBehavior.personalityTraits.assertiveness += adaptationRate * sensitivity;
    }
    
    // Ensure values stay within bounds
    this.normalizeRoleBehavior(role);
  }
  
  /**
   * Normalize role behavior values to stay within 0-1 bounds
   */
  private normalizeRoleBehavior(role: ConversationAgentRole): void {
    const normalize = (value: number): number => Math.max(0, Math.min(1, value));
    
    // Normalize speaking triggers
    role.conversationBehavior.speakingTriggers.expertiseMatch = 
      normalize(role.conversationBehavior.speakingTriggers.expertiseMatch);
    role.conversationBehavior.speakingTriggers.disagreementThreshold = 
      normalize(role.conversationBehavior.speakingTriggers.disagreementThreshold);
    
    // Normalize silence triggers
    role.conversationBehavior.silenceTriggers.topicIrrelevance = 
      normalize(role.conversationBehavior.silenceTriggers.topicIrrelevance);
    
    // Normalize personality traits
    Object.keys(role.conversationBehavior.personalityTraits).forEach(trait => {
      (role.conversationBehavior.personalityTraits as any)[trait] = 
        normalize((role.conversationBehavior.personalityTraits as any)[trait]);
    });
    
    // Normalize interruption behavior
    role.conversationBehavior.interruptionBehavior.urgencyThreshold = 
      normalize(role.conversationBehavior.interruptionBehavior.urgencyThreshold);
    role.conversationBehavior.interruptionBehavior.politenessLevel = 
      normalize(role.conversationBehavior.interruptionBehavior.politenessLevel);
    role.conversationBehavior.interruptionBehavior.contextAwareness = 
      normalize(role.conversationBehavior.interruptionBehavior.contextAwareness);
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface ConversationResult {
  successful: boolean;
  relevanceScore: number;
  topics?: string[];
  participationQuality: number;
  userSatisfaction: number;
}

export interface ConversationFeedback {
  tooTalkative?: boolean;
  tooQuiet?: boolean;
  tooAssertive?: boolean;
  notAssertiveEnough?: boolean;
  irrelevantContributions?: boolean;
  valuableContributions?: boolean;
  goodTiming?: boolean;
  poorTiming?: boolean;
}

// Export singleton instance
export const conversationAgentRoleManager = new ConversationAgentRoleManager();

