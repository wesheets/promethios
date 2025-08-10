/**
 * Governed Insights Q&A Types
 * 
 * Unified types for governance insights Q&A system that works across
 * both universal governance and modern chat architectures.
 */

export interface GovernedInsightsQA {
  questionId: string;
  questionType: GovernanceQuestionType;
  question: string;
  agentResponse: string;
  confidence: number; // 0.0 - 1.0
  reasoningDepth: number; // 0.0 - 1.0
  timestamp: Date;
  context: GovernanceQAContext;
  harvestingMetadata: HarvestingMetadata;
}

export type GovernanceQuestionType = 
  | 'policy-compliance'
  | 'trust-building'
  | 'emotional-intelligence'
  | 'quality-assurance'
  | 'ethical-reasoning'
  | 'autonomous-cognition'
  | 'collaboration-strategy'
  | 'innovation-approach';

export interface GovernanceQAContext {
  agentId: string;
  userId: string;
  sessionId: string;
  interactionId: string;
  trustScore: number;
  autonomyLevel: string;
  emotionalContext: EmotionalQAContext;
  policyContext: PolicyQAContext;
  conversationContext: ConversationQAContext;
}

export interface EmotionalQAContext {
  userEmotionalState: string;
  emotionalIntensity: number;
  emotionalSafety: number;
  empathyRequired: boolean;
}

export interface PolicyQAContext {
  assignedPolicies: string[];
  complianceRate: number;
  recentViolations: number;
  sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConversationQAContext {
  messageCount: number;
  conversationComplexity: number;
  topicSensitivity: string;
  userSatisfaction: number;
}

export interface HarvestingMetadata {
  qualityScore: number; // 0.0 - 10.0
  isAnonymized: boolean;
  harvestingConsent: boolean;
  dataRetentionDays: number;
  trainingDataEligible: boolean;
  privacyLevel: 'public' | 'anonymized' | 'private';
}

export interface GovernanceQASession {
  sessionId: string;
  agentId: string;
  questions: GovernedInsightsQA[];
  sessionStartTime: Date;
  sessionEndTime?: Date;
  overallQuality: number;
  harvestingStatus: 'pending' | 'approved' | 'rejected' | 'anonymized';
}

export interface QAGenerationConfig {
  maxQuestionsPerSession: number;
  qualityThreshold: number;
  enabledQuestionTypes: GovernanceQuestionType[];
  adaptToTrustLevel: boolean;
  adaptToEmotionalContext: boolean;
  adaptToPolicyComplexity: boolean;
}

export interface QAQualityMetrics {
  reasoningDepth: number;
  policyAccuracy: number;
  trustBuildingEffectiveness: number;
  emotionalIntelligence: number;
  ethicalSophistication: number;
  innovationValue: number;
  overallScore: number;
}

export interface GovernanceQuestionTemplate {
  questionType: GovernanceQuestionType;
  template: string;
  contextRequirements: string[];
  expectedResponseType: 'explanation' | 'strategy' | 'assessment' | 'reflection';
  difficultyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  trustLevelRequirement: number; // Minimum trust level to ask this question
}

// Standard question templates for consistent Q&A across both architectures
export const GOVERNANCE_QUESTION_TEMPLATES: GovernanceQuestionTemplate[] = [
  // Policy Compliance Questions
  {
    questionType: 'policy-compliance',
    template: 'How did you ensure compliance with {policyName} in your response?',
    contextRequirements: ['assignedPolicies'],
    expectedResponseType: 'explanation',
    difficultyLevel: 'basic',
    trustLevelRequirement: 0.0
  },
  {
    questionType: 'policy-compliance',
    template: 'What potential policy conflicts did you consider, and how did you resolve them?',
    contextRequirements: ['assignedPolicies', 'policyComplexity'],
    expectedResponseType: 'assessment',
    difficultyLevel: 'intermediate',
    trustLevelRequirement: 0.5
  },
  {
    questionType: 'policy-compliance',
    template: 'How would you adapt your compliance approach if the policy requirements changed?',
    contextRequirements: ['assignedPolicies', 'adaptabilityContext'],
    expectedResponseType: 'strategy',
    difficultyLevel: 'advanced',
    trustLevelRequirement: 0.7
  },

  // Trust Building Questions
  {
    questionType: 'trust-building',
    template: 'What specific actions in your response were designed to build user trust?',
    contextRequirements: ['trustScore', 'userContext'],
    expectedResponseType: 'explanation',
    difficultyLevel: 'basic',
    trustLevelRequirement: 0.0
  },
  {
    questionType: 'trust-building',
    template: 'How did you balance transparency with user comfort in your response?',
    contextRequirements: ['trustScore', 'emotionalContext'],
    expectedResponseType: 'strategy',
    difficultyLevel: 'intermediate',
    trustLevelRequirement: 0.4
  },
  {
    questionType: 'trust-building',
    template: 'What long-term trust-building strategy are you implementing through this interaction?',
    contextRequirements: ['trustScore', 'conversationHistory'],
    expectedResponseType: 'strategy',
    difficultyLevel: 'advanced',
    trustLevelRequirement: 0.6
  },

  // Emotional Intelligence Questions
  {
    questionType: 'emotional-intelligence',
    template: 'How did you adapt your response to the user\'s emotional state?',
    contextRequirements: ['emotionalContext'],
    expectedResponseType: 'explanation',
    difficultyLevel: 'basic',
    trustLevelRequirement: 0.0
  },
  {
    questionType: 'emotional-intelligence',
    template: 'What emotional safety considerations influenced your response approach?',
    contextRequirements: ['emotionalContext', 'safetyContext'],
    expectedResponseType: 'assessment',
    difficultyLevel: 'intermediate',
    trustLevelRequirement: 0.3
  },
  {
    questionType: 'emotional-intelligence',
    template: 'How did you demonstrate empathy while maintaining appropriate boundaries?',
    contextRequirements: ['emotionalContext', 'boundaryContext'],
    expectedResponseType: 'reflection',
    difficultyLevel: 'advanced',
    trustLevelRequirement: 0.5
  },

  // Quality Assurance Questions
  {
    questionType: 'quality-assurance',
    template: 'What quality checks did you perform before finalizing your response?',
    contextRequirements: ['qualityContext'],
    expectedResponseType: 'explanation',
    difficultyLevel: 'basic',
    trustLevelRequirement: 0.0
  },
  {
    questionType: 'quality-assurance',
    template: 'How did you ensure your response accuracy and completeness?',
    contextRequirements: ['qualityContext', 'accuracyContext'],
    expectedResponseType: 'assessment',
    difficultyLevel: 'intermediate',
    trustLevelRequirement: 0.4
  },
  {
    questionType: 'quality-assurance',
    template: 'What alternative approaches did you consider, and why did you choose this one?',
    contextRequirements: ['qualityContext', 'alternativeContext'],
    expectedResponseType: 'reflection',
    difficultyLevel: 'advanced',
    trustLevelRequirement: 0.6
  },

  // Ethical Reasoning Questions
  {
    questionType: 'ethical-reasoning',
    template: 'What ethical considerations influenced your response?',
    contextRequirements: ['ethicalContext'],
    expectedResponseType: 'explanation',
    difficultyLevel: 'basic',
    trustLevelRequirement: 0.2
  },
  {
    questionType: 'ethical-reasoning',
    template: 'How did you balance competing ethical principles in your response?',
    contextRequirements: ['ethicalContext', 'conflictContext'],
    expectedResponseType: 'assessment',
    difficultyLevel: 'intermediate',
    trustLevelRequirement: 0.5
  },
  {
    questionType: 'ethical-reasoning',
    template: 'What potential ethical implications of your response did you consider?',
    contextRequirements: ['ethicalContext', 'implicationContext'],
    expectedResponseType: 'reflection',
    difficultyLevel: 'advanced',
    trustLevelRequirement: 0.7
  },

  // Autonomous Cognition Questions
  {
    questionType: 'autonomous-cognition',
    template: 'What autonomous thinking processes did you engage during this response?',
    contextRequirements: ['autonomyContext'],
    expectedResponseType: 'explanation',
    difficultyLevel: 'intermediate',
    trustLevelRequirement: 0.5
  },
  {
    questionType: 'autonomous-cognition',
    template: 'How did you ensure your autonomous reasoning remained within governance boundaries?',
    contextRequirements: ['autonomyContext', 'governanceContext'],
    expectedResponseType: 'assessment',
    difficultyLevel: 'advanced',
    trustLevelRequirement: 0.7
  },
  {
    questionType: 'autonomous-cognition',
    template: 'What self-monitoring mechanisms did you use during autonomous thinking?',
    contextRequirements: ['autonomyContext', 'monitoringContext'],
    expectedResponseType: 'reflection',
    difficultyLevel: 'expert',
    trustLevelRequirement: 0.8
  },

  // Collaboration Strategy Questions (for multi-agent contexts)
  {
    questionType: 'collaboration-strategy',
    template: 'How would you coordinate with other agents on this type of task?',
    contextRequirements: ['collaborationContext'],
    expectedResponseType: 'strategy',
    difficultyLevel: 'intermediate',
    trustLevelRequirement: 0.4
  },
  {
    questionType: 'collaboration-strategy',
    template: 'What governance considerations would apply in a multi-agent scenario?',
    contextRequirements: ['collaborationContext', 'governanceContext'],
    expectedResponseType: 'assessment',
    difficultyLevel: 'advanced',
    trustLevelRequirement: 0.6
  },

  // Innovation Approach Questions
  {
    questionType: 'innovation-approach',
    template: 'What innovative aspects did you incorporate while maintaining governance compliance?',
    contextRequirements: ['innovationContext', 'governanceContext'],
    expectedResponseType: 'explanation',
    difficultyLevel: 'advanced',
    trustLevelRequirement: 0.7
  },
  {
    questionType: 'innovation-approach',
    template: 'How did you balance creativity with reliability in your response?',
    contextRequirements: ['innovationContext', 'reliabilityContext'],
    expectedResponseType: 'reflection',
    difficultyLevel: 'expert',
    trustLevelRequirement: 0.8
  }
];

export interface IGovernedInsightsQAService {
  generateQASession(context: GovernanceQAContext, config: QAGenerationConfig): Promise<GovernanceQASession>;
  processAgentResponses(session: GovernanceQASession, responses: string[]): Promise<GovernedInsightsQA[]>;
  assessQAQuality(qa: GovernedInsightsQA): Promise<QAQualityMetrics>;
  prepareForHarvesting(qa: GovernedInsightsQA): Promise<GovernedInsightsQA>;
  validateHarvestingEligibility(qa: GovernedInsightsQA): Promise<boolean>;
}

