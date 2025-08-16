/**
 * Learning & Adaptation Repository Extension for Promethios
 * 
 * Captures and manages all learning and adaptation work performed by AI agents including:
 * - User preference learning (communication styles, domain expertise, interaction patterns)
 * - Context understanding (domain knowledge, project background, user mental models)
 * - Successful interaction patterns (what approaches work for specific users/contexts)
 * - Failed approaches (negative learning - what NOT to try again)
 * - Behavioral adaptation (adjusting responses based on user feedback)
 * - Knowledge acquisition (learning new domains, skills, methodologies)
 * - Performance optimization (improving response quality and efficiency)
 * 
 * Integrates with RecursiveMemoryExtension and UniversalGovernanceAdapter for enhanced learning.
 * Provides personalization, adaptation tracking, and continuous improvement capabilities.
 */

import { Extension } from './Extension';
import { UniversalGovernanceAdapter } from '../services/UniversalGovernanceAdapter';
import { RecursiveMemoryExtension } from './RecursiveMemoryExtension';

export interface UserPreference {
  id: string;
  userId: string;
  category: 'communication' | 'content' | 'interaction' | 'domain' | 'workflow' | 'presentation' | 'feedback';
  subcategory: string;
  preference: {
    type: 'style' | 'format' | 'frequency' | 'depth' | 'approach' | 'timing' | 'method';
    value: any;
    confidence: number; // 0-1
    strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
    context?: string; // when this preference applies
    exceptions?: string[]; // when this preference doesn't apply
  };
  evidence: {
    source: 'explicit_feedback' | 'implicit_behavior' | 'interaction_pattern' | 'outcome_analysis' | 'user_statement';
    interactions: string[]; // interaction IDs that support this preference
    feedback: {
      positive: number;
      negative: number;
      neutral: number;
    };
    consistency: number; // 0-1, how consistent this preference is
    recency: number; // 0-1, how recent the evidence is
  };
  adaptation: {
    applied: boolean;
    applicationCount: number;
    successRate: number; // 0-1
    lastApplied?: Date;
    effectiveness: {
      userSatisfaction: number; // 0-5
      taskCompletion: number; // 0-1
      efficiency: number; // 0-1
      qualityImprovement: number; // 0-1
    };
    refinements: {
      date: Date;
      change: string;
      reason: string;
      outcome: string;
    }[];
  };
  metadata: {
    discoveredAt: Date;
    lastUpdated: Date;
    validUntil?: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    stability: 'volatile' | 'stable' | 'very_stable';
    scope: 'global' | 'domain_specific' | 'context_specific' | 'task_specific';
  };
  tags: string[];
}

export interface ContextUnderstanding {
  id: string;
  userId: string;
  contextType: 'domain' | 'project' | 'role' | 'organization' | 'personal' | 'technical' | 'business';
  context: {
    name: string;
    description: string;
    domain: string;
    scope: string;
    complexity: 'low' | 'medium' | 'high' | 'expert';
    importance: 'low' | 'medium' | 'high' | 'critical';
  };
  knowledge: {
    concepts: {
      concept: string;
      understanding: number; // 0-1
      confidence: number; // 0-1
      sources: string[];
      lastValidated?: Date;
    }[];
    relationships: {
      from: string;
      to: string;
      type: 'depends_on' | 'related_to' | 'part_of' | 'influences' | 'conflicts_with';
      strength: number; // 0-1
      confidence: number; // 0-1
    }[];
    expertise: {
      area: string;
      level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
      evidence: string[];
      validated: boolean;
    }[];
    gaps: {
      area: string;
      severity: 'minor' | 'moderate' | 'major' | 'critical';
      impact: string;
      learningPlan?: string;
    }[];
  };
  mentalModel: {
    userGoals: string[];
    userConstraints: string[];
    userAssumptions: string[];
    userBiases: string[];
    decisionFactors: {
      factor: string;
      weight: number; // 0-1
      type: 'cost' | 'time' | 'quality' | 'risk' | 'complexity' | 'strategic';
    }[];
    communicationStyle: {
      formality: 'casual' | 'professional' | 'formal';
      detail: 'high_level' | 'moderate' | 'detailed' | 'exhaustive';
      pace: 'slow' | 'moderate' | 'fast' | 'very_fast';
      feedback: 'minimal' | 'moderate' | 'frequent' | 'continuous';
    };
    workingStyle: {
      approach: 'methodical' | 'iterative' | 'exploratory' | 'results_driven';
      collaboration: 'independent' | 'consultative' | 'collaborative' | 'delegative';
      riskTolerance: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive';
      timeOrientation: 'short_term' | 'medium_term' | 'long_term' | 'strategic';
    };
  };
  evolution: {
    version: string;
    changes: {
      date: Date;
      change: string;
      trigger: string;
      confidence: number;
      validated: boolean;
    }[];
    stability: number; // 0-1, how stable this understanding is
    accuracy: number; // 0-1, how accurate this understanding is
    completeness: number; // 0-1, how complete this understanding is
  };
  validation: {
    lastValidated: Date;
    validationMethod: 'interaction_analysis' | 'explicit_feedback' | 'outcome_tracking' | 'peer_review';
    validationScore: number; // 0-1
    validationNotes: string;
    nextValidation?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface InteractionPattern {
  id: string;
  userId: string;
  patternType: 'communication' | 'problem_solving' | 'decision_making' | 'learning' | 'collaboration' | 'feedback';
  pattern: {
    name: string;
    description: string;
    trigger: {
      conditions: string[];
      context: string;
      userState: string;
      taskType: string;
    };
    approach: {
      strategy: string;
      tactics: string[];
      sequence: string[];
      timing: string;
      adaptation: string[];
    };
    response: {
      style: string;
      format: string;
      depth: string;
      examples: boolean;
      followUp: string;
    };
  };
  effectiveness: {
    successRate: number; // 0-1
    userSatisfaction: number; // 0-5
    taskCompletion: number; // 0-1
    efficiency: number; // 0-1
    qualityScore: number; // 0-1
    repeatUsage: number; // how often user comes back for similar help
  };
  usage: {
    applicationCount: number;
    lastUsed: Date;
    contexts: string[];
    variations: {
      variation: string;
      context: string;
      effectiveness: number;
      usage: number;
    }[];
    combinations: {
      withPattern: string;
      effectiveness: number;
      usage: number;
    }[];
  };
  learning: {
    discoveredFrom: string[];
    refinements: {
      date: Date;
      change: string;
      reason: string;
      outcome: string;
      effectiveness: number;
    }[];
    generalizations: {
      context: string;
      applicability: number; // 0-1
      tested: boolean;
      effectiveness?: number;
    }[];
  };
  validation: {
    validated: boolean;
    validationMethod: string;
    validationScore: number; // 0-1
    lastValidated: Date;
    validationNotes: string;
  };
  metadata: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    stability: 'experimental' | 'emerging' | 'stable' | 'proven';
    scope: 'user_specific' | 'domain_specific' | 'general' | 'universal';
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FailedApproach {
  id: string;
  userId: string;
  approachType: 'communication' | 'problem_solving' | 'technical' | 'process' | 'collaboration' | 'presentation';
  approach: {
    name: string;
    description: string;
    strategy: string;
    tactics: string[];
    context: string;
    assumptions: string[];
  };
  failure: {
    outcome: string;
    userReaction: 'confused' | 'frustrated' | 'disappointed' | 'angry' | 'disengaged';
    specificIssues: string[];
    rootCauses: {
      cause: string;
      category: 'misunderstanding' | 'inappropriate_approach' | 'timing' | 'complexity' | 'cultural' | 'technical';
      severity: 'minor' | 'moderate' | 'major' | 'critical';
    }[];
    impact: {
      taskCompletion: number; // 0-1, negative impact
      userSatisfaction: number; // 0-5, actual score
      relationship: number; // -1 to 1, impact on relationship
      trustScore: number; // -1 to 1, impact on trust
    };
  };
  analysis: {
    whyItFailed: string[];
    whatShouldHaveBeen: string;
    lessonsLearned: string[];
    preventionStrategies: string[];
    alternativeApproaches: {
      approach: string;
      likelihood: number; // 0-1, likelihood of success
      reasoning: string;
    }[];
  };
  prevention: {
    warningSignals: string[];
    avoidanceRules: string[];
    contextualFactors: string[];
    userIndicators: string[];
    situationalTriggers: string[];
  };
  recovery: {
    recoveryActions: string[];
    apologyStrategy?: string;
    relationshipRepair: string[];
    trustRebuilding: string[];
    followUpRequired: boolean;
    recoverySuccess?: number; // 0-1
  };
  generalization: {
    applicableToOtherUsers: boolean;
    applicableToOtherContexts: string[];
    generalPrinciples: string[];
    universalLessons: string[];
  };
  metadata: {
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    frequency: 'rare' | 'occasional' | 'frequent' | 'systematic';
    recency: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BehavioralAdaptation {
  id: string;
  userId: string;
  adaptationType: 'communication' | 'approach' | 'timing' | 'content' | 'interaction' | 'feedback' | 'personalization';
  adaptation: {
    name: string;
    description: string;
    trigger: {
      userFeedback?: string;
      observedBehavior?: string;
      performanceMetric?: string;
      contextChange?: string;
    };
    change: {
      from: string;
      to: string;
      magnitude: 'minor' | 'moderate' | 'major' | 'fundamental';
      scope: 'specific_interaction' | 'task_type' | 'domain' | 'global';
    };
    implementation: {
      strategy: string;
      steps: string[];
      timeline: string;
      monitoring: string[];
      rollbackPlan?: string;
    };
  };
  effectiveness: {
    hypothesis: string;
    expectedOutcome: string;
    actualOutcome?: string;
    successMetrics: {
      metric: string;
      baseline: number;
      target: number;
      actual?: number;
      improvement?: number; // percentage
    }[];
    userFeedback?: {
      explicit: string;
      implicit: string;
      satisfaction: number; // 0-5
    };
    performanceImpact: {
      taskCompletion: number; // change in completion rate
      efficiency: number; // change in efficiency
      quality: number; // change in quality
      userEngagement: number; // change in engagement
    };
  };
  learning: {
    insights: string[];
    surprises: string[];
    confirmations: string[];
    newQuestions: string[];
    futureAdaptations: string[];
  };
  validation: {
    testPeriod: {
      start: Date;
      end?: Date;
      duration: string;
    };
    validationCriteria: string[];
    validationResults: {
      criterion: string;
      met: boolean;
      score: number; // 0-1
      notes: string;
    }[];
    overallSuccess: boolean;
    confidence: number; // 0-1
  };
  persistence: {
    permanent: boolean;
    conditions: string[];
    expirationDate?: Date;
    reviewDate?: Date;
    adaptationHistory: {
      date: Date;
      change: string;
      reason: string;
      outcome: string;
    }[];
  };
  metadata: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    riskLevel: 'low' | 'medium' | 'high' | 'very_high';
    reversible: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeAcquisition {
  id: string;
  userId: string;
  acquisitionType: 'domain_knowledge' | 'skill_development' | 'methodology_learning' | 'tool_mastery' | 'process_understanding';
  knowledge: {
    area: string;
    description: string;
    domain: string;
    complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
    scope: 'narrow' | 'moderate' | 'broad' | 'comprehensive';
    importance: 'nice_to_have' | 'useful' | 'important' | 'critical';
  };
  acquisition: {
    trigger: string;
    motivation: string;
    sources: {
      source: string;
      type: 'interaction' | 'documentation' | 'example' | 'feedback' | 'observation' | 'experimentation';
      quality: number; // 0-1
      reliability: number; // 0-1
      completeness: number; // 0-1
    }[];
    method: 'passive_observation' | 'active_inquiry' | 'experimentation' | 'pattern_recognition' | 'feedback_analysis';
    timeline: {
      started: Date;
      milestones: {
        milestone: string;
        date: Date;
        achievement: string;
      }[];
      completed?: Date;
    };
  };
  mastery: {
    currentLevel: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
    progression: {
      date: Date;
      level: string;
      evidence: string[];
      validation: string;
    }[];
    competencies: {
      competency: string;
      level: number; // 0-1
      confidence: number; // 0-1
      lastDemonstrated?: Date;
    }[];
    gaps: {
      gap: string;
      severity: 'minor' | 'moderate' | 'major' | 'critical';
      learningPlan: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
    }[];
  };
  application: {
    opportunities: string[];
    applications: {
      context: string;
      date: Date;
      success: boolean;
      outcome: string;
      lessons: string[];
    }[];
    effectiveness: {
      successRate: number; // 0-1
      userValue: number; // 0-5
      efficiency: number; // 0-1
      quality: number; // 0-1
    };
    refinements: {
      date: Date;
      refinement: string;
      reason: string;
      outcome: string;
    }[];
  };
  validation: {
    selfAssessment: {
      confidence: number; // 0-1
      competence: number; // 0-1
      readiness: number; // 0-1
    };
    externalValidation: {
      source: string;
      method: string;
      score: number; // 0-1
      feedback: string;
      date: Date;
    }[];
    practicalValidation: {
      taskSuccess: number; // 0-1
      userSatisfaction: number; // 0-5
      efficiency: number; // 0-1
      qualityImprovement: number; // 0-1
    };
  };
  metadata: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    urgency: 'low' | 'medium' | 'high' | 'immediate';
    transferability: 'specific' | 'domain' | 'general' | 'universal';
    durability: 'temporary' | 'stable' | 'permanent';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceOptimization {
  id: string;
  userId: string;
  optimizationType: 'response_quality' | 'efficiency' | 'accuracy' | 'relevance' | 'personalization' | 'user_satisfaction';
  optimization: {
    name: string;
    description: string;
    targetMetric: string;
    baseline: {
      value: number;
      unit: string;
      measurement: string;
      date: Date;
    };
    target: {
      value: number;
      unit: string;
      improvement: number; // percentage
      timeline: string;
    };
    approach: {
      strategy: string;
      techniques: string[];
      implementation: string[];
      monitoring: string[];
    };
  };
  implementation: {
    phases: {
      phase: string;
      description: string;
      duration: string;
      activities: string[];
      milestones: string[];
      success_criteria: string[];
    }[];
    currentPhase: string;
    progress: number; // 0-1
    challenges: {
      challenge: string;
      impact: 'low' | 'medium' | 'high' | 'critical';
      mitigation: string;
      status: 'open' | 'mitigated' | 'resolved';
    }[];
  };
  results: {
    currentValue?: number;
    improvement?: number; // percentage
    trend: 'improving' | 'stable' | 'declining' | 'volatile';
    measurements: {
      date: Date;
      value: number;
      context: string;
      notes?: string;
    }[];
    sideEffects: {
      effect: string;
      impact: 'positive' | 'negative' | 'neutral';
      severity: 'minor' | 'moderate' | 'major';
      mitigation?: string;
    }[];
  };
  learning: {
    insights: string[];
    bestPractices: string[];
    pitfalls: string[];
    recommendations: string[];
    futureOptimizations: string[];
  };
  validation: {
    validated: boolean;
    validationMethod: string;
    validationPeriod: {
      start: Date;
      end?: Date;
    };
    validationCriteria: string[];
    validationResults: {
      criterion: string;
      met: boolean;
      score: number; // 0-1
      evidence: string;
    }[];
    sustainabilityAssessment: {
      sustainable: boolean;
      factors: string[];
      risks: string[];
      maintenance: string[];
    };
  };
  metadata: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    impact: 'local' | 'domain' | 'global' | 'universal';
    reversible: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class LearningAdaptationExtension extends Extension {
  private universalGovernance: UniversalGovernanceAdapter;
  private recursiveMemory: RecursiveMemoryExtension;
  
  // Storage
  private userPreferences: Map<string, UserPreference[]> = new Map(); // userId -> preferences
  private contextUnderstanding: Map<string, ContextUnderstanding[]> = new Map(); // userId -> contexts
  private interactionPatterns: Map<string, InteractionPattern[]> = new Map(); // userId -> patterns
  private failedApproaches: Map<string, FailedApproach[]> = new Map(); // userId -> failures
  private behavioralAdaptations: Map<string, BehavioralAdaptation[]> = new Map(); // userId -> adaptations
  private knowledgeAcquisitions: Map<string, KnowledgeAcquisition[]> = new Map(); // userId -> knowledge
  private performanceOptimizations: Map<string, PerformanceOptimization[]> = new Map(); // userId -> optimizations
  
  // Learning engines
  private preferenceEngine: PreferenceLearningEngine;
  private contextEngine: ContextUnderstandingEngine;
  private patternEngine: PatternRecognitionEngine;
  private adaptationEngine: AdaptationEngine;
  private optimizationEngine: PerformanceOptimizationEngine;
  
  // Analytics and monitoring
  private learningAnalytics: LearningAnalyticsCollector;
  private adaptationMonitor: AdaptationMonitor;
  private performanceTracker: PerformanceTracker;

  constructor() {
    super('LearningAdaptationExtension', '1.0.0');
    this.universalGovernance = new UniversalGovernanceAdapter();
    this.recursiveMemory = new RecursiveMemoryExtension();
    this.preferenceEngine = new PreferenceLearningEngine();
    this.contextEngine = new ContextUnderstandingEngine();
    this.patternEngine = new PatternRecognitionEngine();
    this.adaptationEngine = new AdaptationEngine();
    this.optimizationEngine = new PerformanceOptimizationEngine();
    this.learningAnalytics = new LearningAnalyticsCollector();
    this.adaptationMonitor = new AdaptationMonitor();
    this.performanceTracker = new PerformanceTracker();
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🧠 [Learning] Initializing Learning & Adaptation Extension...');
      
      // Initialize dependencies
      await this.universalGovernance.initialize();
      await this.recursiveMemory.initialize();
      
      // Load existing learning data
      await this.loadExistingLearningData();
      
      // Initialize learning engines
      await this.preferenceEngine.initialize();
      await this.contextEngine.initialize();
      await this.patternEngine.initialize();
      await this.adaptationEngine.initialize();
      await this.optimizationEngine.initialize();
      
      // Start background learning processes
      this.startContinuousLearning();
      this.startAdaptationMonitoring();
      this.startPerformanceTracking();
      
      console.log('✅ [Learning] Learning & Adaptation Extension initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ [Learning] Failed to initialize Learning & Adaptation Extension:', error);
      return false;
    }
  }

  // ============================================================================
  // USER PREFERENCE LEARNING
  // ============================================================================

  async learnUserPreference(userId: string, interaction: {
    interactionId: string;
    userFeedback?: string;
    userBehavior: any;
    context: string;
    outcome: any;
  }): Promise<UserPreference[]> {
    try {
      console.log(`📚 [Learning] Learning user preferences for user: ${userId}`);
      
      // Analyze interaction for preference signals
      const preferenceSignals = await this.preferenceEngine.analyzeInteraction(interaction);
      
      const newPreferences: UserPreference[] = [];
      
      for (const signal of preferenceSignals) {
        // Check if preference already exists
        const existingPreferences = this.userPreferences.get(userId) || [];
        const existingPreference = existingPreferences.find(p => 
          p.category === signal.category && p.subcategory === signal.subcategory
        );
        
        if (existingPreference) {
          // Update existing preference
          await this.updateUserPreference(userId, existingPreference.id, signal);
        } else {
          // Create new preference
          const preference: UserPreference = {
            id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            category: signal.category,
            subcategory: signal.subcategory,
            preference: {
              type: signal.type,
              value: signal.value,
              confidence: signal.confidence,
              strength: signal.strength,
              context: signal.context
            },
            evidence: {
              source: signal.source,
              interactions: [interaction.interactionId],
              feedback: signal.feedback,
              consistency: signal.consistency,
              recency: 1.0
            },
            adaptation: {
              applied: false,
              applicationCount: 0,
              successRate: 0,
              effectiveness: {
                userSatisfaction: 0,
                taskCompletion: 0,
                efficiency: 0,
                qualityImprovement: 0
              },
              refinements: []
            },
            metadata: {
              discoveredAt: new Date(),
              lastUpdated: new Date(),
              priority: signal.priority,
              stability: 'emerging',
              scope: signal.scope
            },
            tags: signal.tags || []
          };
          
          newPreferences.push(preference);
          
          // Store preference
          if (!this.userPreferences.has(userId)) {
            this.userPreferences.set(userId, []);
          }
          this.userPreferences.get(userId)!.push(preference);
        }
      }
      
      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId: userId,
        action: 'user_preferences_learned',
        details: {
          interactionId: interaction.interactionId,
          preferencesLearned: newPreferences.length,
          categories: newPreferences.map(p => p.category)
        },
        trustScore: 0.1,
        timestamp: new Date()
      });
      
      console.log(`✅ [Learning] Learned ${newPreferences.length} user preferences`);
      return newPreferences;
    } catch (error) {
      console.error(`❌ [Learning] Failed to learn user preferences:`, error);
      return [];
    }
  }

  // ============================================================================
  // CONTEXT UNDERSTANDING
  // ============================================================================

  async buildContextUnderstanding(userId: string, context: {
    contextType: ContextUnderstanding['contextType'];
    contextData: any;
    interactions: string[];
    userStatements: string[];
  }): Promise<ContextUnderstanding> {
    try {
      console.log(`🧩 [Learning] Building context understanding for user: ${userId}`);
      
      // Analyze context data
      const contextAnalysis = await this.contextEngine.analyzeContext(context);
      
      const contextUnderstanding: ContextUnderstanding = {
        id: `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        contextType: context.contextType,
        context: contextAnalysis.context,
        knowledge: contextAnalysis.knowledge,
        mentalModel: contextAnalysis.mentalModel,
        evolution: {
          version: '1.0.0',
          changes: [],
          stability: 0.5,
          accuracy: contextAnalysis.confidence,
          completeness: contextAnalysis.completeness
        },
        validation: {
          lastValidated: new Date(),
          validationMethod: 'interaction_analysis',
          validationScore: contextAnalysis.confidence,
          validationNotes: 'Initial context understanding built from interaction analysis'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store context understanding
      if (!this.contextUnderstanding.has(userId)) {
        this.contextUnderstanding.set(userId, []);
      }
      this.contextUnderstanding.get(userId)!.push(contextUnderstanding);
      
      console.log(`✅ [Learning] Context understanding built: ${contextUnderstanding.id}`);
      return contextUnderstanding;
    } catch (error) {
      console.error(`❌ [Learning] Failed to build context understanding:`, error);
      throw error;
    }
  }

  // ============================================================================
  // INTERACTION PATTERN RECOGNITION
  // ============================================================================

  async recognizeInteractionPatterns(userId: string, interactions: any[]): Promise<InteractionPattern[]> {
    try {
      console.log(`🔍 [Learning] Recognizing interaction patterns for user: ${userId}`);
      
      // Analyze interactions for patterns
      const patterns = await this.patternEngine.recognizePatterns(interactions);
      
      const interactionPatterns: InteractionPattern[] = [];
      
      for (const pattern of patterns) {
        const interactionPattern: InteractionPattern = {
          id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          patternType: pattern.type,
          pattern: pattern.pattern,
          effectiveness: pattern.effectiveness,
          usage: pattern.usage,
          learning: pattern.learning,
          validation: {
            validated: pattern.validated,
            validationMethod: pattern.validationMethod,
            validationScore: pattern.validationScore,
            lastValidated: new Date(),
            validationNotes: pattern.validationNotes
          },
          metadata: pattern.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        interactionPatterns.push(interactionPattern);
      }
      
      // Store patterns
      if (!this.interactionPatterns.has(userId)) {
        this.interactionPatterns.set(userId, []);
      }
      this.interactionPatterns.get(userId)!.push(...interactionPatterns);
      
      console.log(`✅ [Learning] Recognized ${interactionPatterns.length} interaction patterns`);
      return interactionPatterns;
    } catch (error) {
      console.error(`❌ [Learning] Failed to recognize interaction patterns:`, error);
      return [];
    }
  }

  // ============================================================================
  // FAILED APPROACH LEARNING
  // ============================================================================

  async recordFailedApproach(userId: string, failure: {
    approach: any;
    outcome: string;
    userReaction: string;
    context: string;
    analysis: any;
  }): Promise<FailedApproach> {
    try {
      console.log(`❌ [Learning] Recording failed approach for user: ${userId}`);
      
      // Analyze failure for learning opportunities
      const failureAnalysis = await this.analyzeFailure(failure);
      
      const failedApproach: FailedApproach = {
        id: `failure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        approachType: failure.approach.type,
        approach: failure.approach,
        failure: {
          outcome: failure.outcome,
          userReaction: failure.userReaction as any,
          specificIssues: failureAnalysis.issues,
          rootCauses: failureAnalysis.rootCauses,
          impact: failureAnalysis.impact
        },
        analysis: failureAnalysis.analysis,
        prevention: failureAnalysis.prevention,
        recovery: failureAnalysis.recovery,
        generalization: failureAnalysis.generalization,
        metadata: {
          severity: failureAnalysis.severity,
          frequency: 'rare',
          recency: new Date(),
          priority: failureAnalysis.priority,
          resolved: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store failed approach
      if (!this.failedApproaches.has(userId)) {
        this.failedApproaches.set(userId, []);
      }
      this.failedApproaches.get(userId)!.push(failedApproach);
      
      // Create governance entry for learning from failure
      await this.universalGovernance.createAuditEntry({
        agentId: userId,
        action: 'failed_approach_recorded',
        details: {
          failureId: failedApproach.id,
          approachType: failedApproach.approachType,
          severity: failedApproach.metadata.severity
        },
        trustScore: 0.05, // Small trust impact for learning from failure
        timestamp: new Date()
      });
      
      console.log(`✅ [Learning] Failed approach recorded: ${failedApproach.id}`);
      return failedApproach;
    } catch (error) {
      console.error(`❌ [Learning] Failed to record failed approach:`, error);
      throw error;
    }
  }

  // ============================================================================
  // BEHAVIORAL ADAPTATION
  // ============================================================================

  async implementBehavioralAdaptation(userId: string, adaptation: {
    type: BehavioralAdaptation['adaptationType'];
    trigger: any;
    change: any;
    implementation: any;
  }): Promise<BehavioralAdaptation> {
    try {
      console.log(`🔄 [Learning] Implementing behavioral adaptation for user: ${userId}`);
      
      // Validate adaptation through governance
      const adaptationValidation = await this.universalGovernance.validateCollaborativeDecision({
        contextId: `adaptation_${Date.now()}`,
        participatingAgents: [userId],
        decisionType: 'behavioral_adaptation',
        content: adaptation
      });
      
      if (!adaptationValidation.approved) {
        throw new Error('Behavioral adaptation not approved by governance');
      }
      
      const behavioralAdaptation: BehavioralAdaptation = {
        id: `adapt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        adaptationType: adaptation.type,
        adaptation: {
          name: adaptation.change.name,
          description: adaptation.change.description,
          trigger: adaptation.trigger,
          change: adaptation.change,
          implementation: adaptation.implementation
        },
        effectiveness: {
          hypothesis: adaptation.implementation.hypothesis,
          expectedOutcome: adaptation.implementation.expectedOutcome,
          successMetrics: adaptation.implementation.successMetrics || [],
          performanceImpact: {
            taskCompletion: 0,
            efficiency: 0,
            quality: 0,
            userEngagement: 0
          }
        },
        learning: {
          insights: [],
          surprises: [],
          confirmations: [],
          newQuestions: [],
          futureAdaptations: []
        },
        validation: {
          testPeriod: {
            start: new Date(),
            duration: adaptation.implementation.testPeriod || '1 week'
          },
          validationCriteria: adaptation.implementation.validationCriteria || [],
          validationResults: [],
          overallSuccess: false,
          confidence: 0
        },
        persistence: {
          permanent: false,
          conditions: adaptation.implementation.conditions || [],
          adaptationHistory: []
        },
        metadata: {
          priority: adaptation.implementation.priority || 'medium',
          complexity: adaptation.implementation.complexity || 'moderate',
          riskLevel: adaptation.implementation.riskLevel || 'medium',
          reversible: adaptation.implementation.reversible !== false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store adaptation
      if (!this.behavioralAdaptations.has(userId)) {
        this.behavioralAdaptations.set(userId, []);
      }
      this.behavioralAdaptations.get(userId)!.push(behavioralAdaptation);
      
      // Start monitoring adaptation
      await this.adaptationMonitor.startMonitoring(behavioralAdaptation);
      
      console.log(`✅ [Learning] Behavioral adaptation implemented: ${behavioralAdaptation.id}`);
      return behavioralAdaptation;
    } catch (error) {
      console.error(`❌ [Learning] Failed to implement behavioral adaptation:`, error);
      throw error;
    }
  }

  // ============================================================================
  // SEARCH AND RETRIEVAL
  // ============================================================================

  async searchLearningData(userId: string, query: {
    type?: string;
    category?: string;
    keywords?: string[];
    dateRange?: { start: Date; end: Date };
  }): Promise<any[]> {
    try {
      console.log(`🔍 [Learning] Searching learning data for user: ${userId}`);
      
      let results: any[] = [];
      
      // Collect all learning data for user
      const preferences = this.userPreferences.get(userId) || [];
      const contexts = this.contextUnderstanding.get(userId) || [];
      const patterns = this.interactionPatterns.get(userId) || [];
      const failures = this.failedApproaches.get(userId) || [];
      const adaptations = this.behavioralAdaptations.get(userId) || [];
      const knowledge = this.knowledgeAcquisitions.get(userId) || [];
      const optimizations = this.performanceOptimizations.get(userId) || [];
      
      results = [
        ...preferences.map(p => ({ ...p, dataType: 'preference' })),
        ...contexts.map(c => ({ ...c, dataType: 'context' })),
        ...patterns.map(p => ({ ...p, dataType: 'pattern' })),
        ...failures.map(f => ({ ...f, dataType: 'failure' })),
        ...adaptations.map(a => ({ ...a, dataType: 'adaptation' })),
        ...knowledge.map(k => ({ ...k, dataType: 'knowledge' })),
        ...optimizations.map(o => ({ ...o, dataType: 'optimization' }))
      ];
      
      // Apply filters
      if (query.type) {
        results = results.filter(item => item.dataType === query.type);
      }
      
      if (query.category) {
        results = results.filter(item => 
          item.category === query.category || 
          item.contextType === query.category ||
          item.patternType === query.category ||
          item.approachType === query.category ||
          item.adaptationType === query.category ||
          item.acquisitionType === query.category ||
          item.optimizationType === query.category
        );
      }
      
      if (query.keywords && query.keywords.length > 0) {
        results = results.filter(item => {
          const searchText = JSON.stringify(item).toLowerCase();
          return query.keywords!.some(keyword => 
            searchText.includes(keyword.toLowerCase())
          );
        });
      }
      
      // Sort by relevance and recency
      results.sort((a, b) => {
        const scoreA = this.calculateLearningRelevanceScore(a, query);
        const scoreB = this.calculateLearningRelevanceScore(b, query);
        return scoreB - scoreA;
      });
      
      console.log(`✅ [Learning] Found ${results.length} learning data items`);
      return results;
    } catch (error) {
      console.error(`❌ [Learning] Failed to search learning data:`, error);
      return [];
    }
  }

  // ============================================================================
  // ANALYTICS AND INSIGHTS
  // ============================================================================

  async getLearningAnalytics(userId: string): Promise<any> {
    try {
      const analytics = await this.learningAnalytics.generateAnalytics(userId, {
        preferences: this.userPreferences.get(userId) || [],
        contexts: this.contextUnderstanding.get(userId) || [],
        patterns: this.interactionPatterns.get(userId) || [],
        failures: this.failedApproaches.get(userId) || [],
        adaptations: this.behavioralAdaptations.get(userId) || [],
        knowledge: this.knowledgeAcquisitions.get(userId) || [],
        optimizations: this.performanceOptimizations.get(userId) || []
      });
      
      return analytics;
    } catch (error) {
      console.error(`❌ [Learning] Failed to get learning analytics:`, error);
      return null;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async loadExistingLearningData(): Promise<void> {
    console.log('📂 [Learning] Loading existing learning data...');
    // In a real implementation, this would load from persistent storage
  }

  private async updateUserPreference(userId: string, preferenceId: string, signal: any): Promise<void> {
    const preferences = this.userPreferences.get(userId) || [];
    const preference = preferences.find(p => p.id === preferenceId);
    
    if (preference) {
      // Update preference with new evidence
      preference.evidence.interactions.push(signal.interactionId);
      preference.evidence.consistency = this.calculateConsistency(preference, signal);
      preference.evidence.recency = 1.0; // Reset recency
      preference.preference.confidence = Math.min(1.0, preference.preference.confidence + 0.1);
      preference.metadata.lastUpdated = new Date();
      
      // Update strength based on consistency and evidence
      if (preference.evidence.consistency > 0.8 && preference.evidence.interactions.length > 5) {
        preference.preference.strength = 'very_strong';
      } else if (preference.evidence.consistency > 0.6 && preference.evidence.interactions.length > 3) {
        preference.preference.strength = 'strong';
      } else if (preference.evidence.consistency > 0.4) {
        preference.preference.strength = 'moderate';
      } else {
        preference.preference.strength = 'weak';
      }
    }
  }

  private calculateConsistency(preference: UserPreference, signal: any): number {
    // Simplified consistency calculation
    return Math.random() * 0.4 + 0.6; // 0.6-1.0 range
  }

  private async analyzeFailure(failure: any): Promise<any> {
    // Simplified failure analysis
    return {
      issues: ['Communication mismatch', 'Inappropriate approach'],
      rootCauses: [
        {
          cause: 'Misunderstood user context',
          category: 'misunderstanding',
          severity: 'moderate'
        }
      ],
      impact: {
        taskCompletion: -0.3,
        userSatisfaction: 2.5,
        relationship: -0.2,
        trustScore: -0.1
      },
      analysis: {
        whyItFailed: ['Wrong approach for user context'],
        whatShouldHaveBeen: 'More contextual approach',
        lessonsLearned: ['Always check user context first'],
        preventionStrategies: ['Context validation before approach'],
        alternativeApproaches: [
          {
            approach: 'Contextual inquiry first',
            likelihood: 0.8,
            reasoning: 'Better understanding leads to better approach'
          }
        ]
      },
      prevention: {
        warningSignals: ['User confusion', 'Lack of engagement'],
        avoidanceRules: ['Avoid generic approaches'],
        contextualFactors: ['User expertise level', 'Domain complexity'],
        userIndicators: ['Feedback patterns', 'Response time'],
        situationalTriggers: ['New domain', 'Complex task']
      },
      recovery: {
        recoveryActions: ['Acknowledge mistake', 'Ask for clarification'],
        relationshipRepair: ['Show understanding', 'Adapt approach'],
        trustRebuilding: ['Demonstrate learning', 'Consistent improvement'],
        followUpRequired: true
      },
      generalization: {
        applicableToOtherUsers: true,
        applicableToOtherContexts: ['Similar domains', 'Similar complexity'],
        generalPrinciples: ['Context matters', 'User-first approach'],
        universalLessons: ['Always validate understanding']
      },
      severity: 'moderate',
      priority: 'medium'
    };
  }

  private calculateLearningRelevanceScore(item: any, query: any): number {
    let score = 0;
    
    // Recency weight
    const createdAt = item.createdAt || new Date();
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSinceCreation / 365));
    score += recencyScore * 0.3;
    
    // Confidence/effectiveness weight
    const confidenceScore = item.confidence || item.effectiveness?.successRate || item.preference?.confidence || 0.5;
    score += confidenceScore * 0.4;
    
    // Usage/application weight
    const usageScore = item.usage?.applicationCount || item.adaptation?.applicationCount || item.evidence?.interactions?.length || 1;
    score += Math.min(1.0, usageScore / 10) * 0.3;
    
    return score;
  }

  private startContinuousLearning(): void {
    setInterval(() => {
      console.log('🧠 [Learning] Running continuous learning processes...');
      // Background learning processes would run here
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  private startAdaptationMonitoring(): void {
    setInterval(() => {
      console.log('🔄 [Learning] Monitoring behavioral adaptations...');
      // Adaptation monitoring would run here
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  private startPerformanceTracking(): void {
    setInterval(() => {
      console.log('📈 [Learning] Tracking performance optimizations...');
      // Performance tracking would run here
    }, 60 * 60 * 1000); // Hourly
  }
}

// Helper classes
class PreferenceLearningEngine {
  async initialize(): Promise<void> {
    console.log('🎯 [Learning] Preference learning engine initialized');
  }

  async analyzeInteraction(interaction: any): Promise<any[]> {
    // Simplified preference signal detection
    return [
      {
        category: 'communication',
        subcategory: 'detail_level',
        type: 'depth',
        value: 'detailed',
        confidence: 0.7,
        strength: 'moderate',
        context: 'technical discussion',
        source: 'implicit_behavior',
        feedback: { positive: 1, negative: 0, neutral: 0 },
        consistency: 0.8,
        priority: 'medium',
        scope: 'domain_specific',
        tags: ['technical', 'detailed']
      }
    ];
  }
}

class ContextUnderstandingEngine {
  async initialize(): Promise<void> {
    console.log('🧩 [Learning] Context understanding engine initialized');
  }

  async analyzeContext(context: any): Promise<any> {
    // Simplified context analysis
    return {
      context: {
        name: context.contextData.name || 'Unknown Context',
        description: context.contextData.description || 'Context description',
        domain: context.contextData.domain || 'general',
        scope: 'project',
        complexity: 'medium',
        importance: 'high'
      },
      knowledge: {
        concepts: [],
        relationships: [],
        expertise: [],
        gaps: []
      },
      mentalModel: {
        userGoals: ['Complete task efficiently', 'Learn new concepts'],
        userConstraints: ['Time limitations', 'Resource constraints'],
        userAssumptions: ['Standard approach will work'],
        userBiases: ['Preference for familiar tools'],
        decisionFactors: [
          { factor: 'time', weight: 0.3, type: 'time' },
          { factor: 'quality', weight: 0.4, type: 'quality' },
          { factor: 'cost', weight: 0.3, type: 'cost' }
        ],
        communicationStyle: {
          formality: 'professional',
          detail: 'moderate',
          pace: 'moderate',
          feedback: 'moderate'
        },
        workingStyle: {
          approach: 'methodical',
          collaboration: 'consultative',
          riskTolerance: 'moderate',
          timeOrientation: 'medium_term'
        }
      },
      confidence: 0.7,
      completeness: 0.6
    };
  }
}

class PatternRecognitionEngine {
  async initialize(): Promise<void> {
    console.log('🔍 [Learning] Pattern recognition engine initialized');
  }

  async recognizePatterns(interactions: any[]): Promise<any[]> {
    // Simplified pattern recognition
    return [
      {
        type: 'communication',
        pattern: {
          name: 'Detailed Technical Explanation',
          description: 'User prefers detailed technical explanations with examples',
          trigger: {
            conditions: ['Technical question', 'Complex topic'],
            context: 'Technical discussion',
            userState: 'Learning mode',
            taskType: 'Problem solving'
          },
          approach: {
            strategy: 'Detailed explanation with examples',
            tactics: ['Step-by-step breakdown', 'Code examples', 'Visual aids'],
            sequence: ['Overview', 'Details', 'Examples', 'Summary'],
            timing: 'Immediate',
            adaptation: ['Adjust detail level based on feedback']
          },
          response: {
            style: 'Technical',
            format: 'Structured',
            depth: 'Detailed',
            examples: true,
            followUp: 'Check understanding'
          }
        },
        effectiveness: {
          successRate: 0.85,
          userSatisfaction: 4.2,
          taskCompletion: 0.9,
          efficiency: 0.8,
          qualityScore: 0.85,
          repeatUsage: 0.7
        },
        usage: {
          applicationCount: 15,
          lastUsed: new Date(),
          contexts: ['Technical support', 'Learning', 'Problem solving'],
          variations: [],
          combinations: []
        },
        learning: {
          discoveredFrom: ['User feedback', 'Interaction analysis'],
          refinements: [],
          generalizations: []
        },
        validated: true,
        validationMethod: 'Outcome analysis',
        validationScore: 0.85,
        validationNotes: 'Consistently positive outcomes',
        metadata: {
          priority: 'high',
          stability: 'stable',
          scope: 'domain_specific',
          complexity: 'moderate'
        }
      }
    ];
  }
}

class AdaptationEngine {
  async initialize(): Promise<void> {
    console.log('🔄 [Learning] Adaptation engine initialized');
  }
}

class PerformanceOptimizationEngine {
  async initialize(): Promise<void> {
    console.log('📈 [Learning] Performance optimization engine initialized');
  }
}

class LearningAnalyticsCollector {
  generateAnalytics(userId: string, data: any): any {
    return {
      totalLearningItems: Object.values(data).reduce((sum: number, arr: any[]) => sum + arr.length, 0),
      preferenceCount: data.preferences.length,
      patternCount: data.patterns.length,
      adaptationCount: data.adaptations.length,
      learningVelocity: 0.8, // items learned per week
      adaptationSuccessRate: 0.75,
      userSatisfactionTrend: 'improving',
      recommendations: [
        'Continue current learning approach',
        'Focus on pattern refinement',
        'Increase adaptation frequency'
      ]
    };
  }
}

class AdaptationMonitor {
  async startMonitoring(adaptation: BehavioralAdaptation): Promise<void> {
    console.log(`🔄 [Learning] Started monitoring adaptation: ${adaptation.id}`);
  }
}

class PerformanceTracker {
  // Performance tracking implementation
}

