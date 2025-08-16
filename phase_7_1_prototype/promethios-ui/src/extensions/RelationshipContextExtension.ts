/**
 * Relationship & Context Repository Extension
 * 
 * Manages user mental models, project context, communication preferences,
 * and relationship development. Captures all relationship and contextual
 * understanding that AI builds over time but typically gets lost between
 * conversations.
 */

import { Extension } from './Extension';
import { UniversalGovernanceAdapter } from '../services/UniversalGovernanceAdapter';

// Core interfaces for relationship and context management
export interface UserMentalModel {
  id: string;
  userId: string;
  name: string;
  description: string;
  modelType: 'cognitive' | 'behavioral' | 'emotional' | 'professional' | 'personal' | 'domain_specific';
  
  // Mental model components
  components: {
    thinkingPatterns: ThinkingPattern[];
    decisionFactors: DecisionFactor[];
    workingStyles: WorkingStyle[];
    learningPreferences: LearningPreference[];
    communicationStyles: CommunicationStyle[];
    motivationalFactors: MotivationalFactor[];
  };
  
  // Model validation
  validation: {
    evidenceCount: number;
    confidenceLevel: number; // 0-1
    consistencyScore: number; // 0-1
    lastValidated: Date;
    validationSources: string[];
    contradictoryEvidence: string[];
  };
  
  // Model evolution
  evolution: {
    originalModel: string;
    modifications: ModelModification[];
    refinements: string[];
    learningEvents: LearningEvent[];
    stabilityScore: number; // 0-1
  };
  
  // Application context
  application: {
    domains: string[];
    contexts: string[];
    effectiveness: number; // 0-1
    usageCount: number;
    successRate: number; // 0-1
    lastUsed: Date;
  };
  
  // Metadata
  metadata: {
    complexity: 'low' | 'medium' | 'high' | 'very_high';
    accuracy: number; // 0-1
    completeness: number; // 0-1
    reliability: number; // 0-1
    scope: 'narrow' | 'moderate' | 'broad' | 'comprehensive';
    tags: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
  status: 'developing' | 'stable' | 'validated' | 'outdated' | 'deprecated';
}

export interface ThinkingPattern {
  id: string;
  name: string;
  description: string;
  patternType: 'analytical' | 'creative' | 'systematic' | 'intuitive' | 'logical' | 'holistic';
  triggers: string[];
  manifestations: string[];
  effectiveness: number; // 0-1
  frequency: number; // 0-1
  confidence: number; // 0-1
  evidence: string[];
}

export interface DecisionFactor {
  id: string;
  name: string;
  description: string;
  factorType: 'rational' | 'emotional' | 'social' | 'practical' | 'ethical' | 'strategic';
  weight: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: string[];
  influence: string;
  evidence: string[];
}

export interface WorkingStyle {
  id: string;
  name: string;
  description: string;
  styleType: 'collaborative' | 'independent' | 'structured' | 'flexible' | 'detail_oriented' | 'big_picture';
  preferences: string[];
  strengths: string[];
  challenges: string[];
  adaptability: number; // 0-1
  effectiveness: number; // 0-1
  contexts: string[];
}

export interface LearningPreference {
  id: string;
  name: string;
  description: string;
  preferenceType: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'experiential' | 'social';
  effectiveness: number; // 0-1
  frequency: number; // 0-1
  contexts: string[];
  methods: string[];
  evidence: string[];
}

export interface CommunicationStyle {
  id: string;
  name: string;
  description: string;
  styleType: 'direct' | 'diplomatic' | 'analytical' | 'expressive' | 'supportive' | 'driving';
  characteristics: string[];
  preferences: string[];
  effectiveness: number; // 0-1
  contexts: string[];
  adaptations: string[];
}

export interface MotivationalFactor {
  id: string;
  name: string;
  description: string;
  factorType: 'achievement' | 'recognition' | 'autonomy' | 'mastery' | 'purpose' | 'social' | 'security';
  strength: number; // 0-1
  stability: number; // 0-1
  triggers: string[];
  manifestations: string[];
  evidence: string[];
}

export interface ModelModification {
  id: string;
  modelId: string;
  modificationType: 'refinement' | 'correction' | 'expansion' | 'simplification' | 'validation' | 'invalidation';
  description: string;
  rationale: string;
  evidence: string[];
  impact: 'minor' | 'moderate' | 'major' | 'fundamental';
  confidence: number; // 0-1
  createdAt: Date;
  createdBy: string;
}

export interface LearningEvent {
  id: string;
  modelId: string;
  eventType: 'observation' | 'interaction' | 'feedback' | 'contradiction' | 'validation' | 'insight';
  description: string;
  context: string;
  impact: string;
  learnings: string[];
  confidence: number; // 0-1
  createdAt: Date;
}

export interface ProjectContext {
  id: string;
  projectId: string;
  name: string;
  description: string;
  contextType: 'business' | 'technical' | 'creative' | 'research' | 'operational' | 'strategic';
  
  // Context components
  components: {
    objectives: ProjectObjective[];
    constraints: ProjectConstraint[];
    assumptions: ProjectAssumption[];
    stakeholders: ProjectStakeholder[];
    requirements: ProjectRequirement[];
    risks: ProjectRisk[];
  };
  
  // Context understanding
  understanding: {
    domainKnowledge: DomainKnowledge[];
    businessLogic: BusinessLogic[];
    technicalContext: TechnicalContext[];
    userContext: UserContext[];
    marketContext: MarketContext[];
    organizationalContext: OrganizationalContext[];
  };
  
  // Context evolution
  evolution: {
    initialContext: string;
    changes: ContextChange[];
    discoveries: ContextDiscovery[];
    clarifications: ContextClarification[];
    validations: ContextValidation[];
  };
  
  // Context quality
  quality: {
    completeness: number; // 0-1
    accuracy: number; // 0-1
    clarity: number; // 0-1
    consistency: number; // 0-1
    relevance: number; // 0-1
    currency: number; // 0-1
  };
  
  // Metadata
  metadata: {
    complexity: 'low' | 'medium' | 'high' | 'very_high';
    stability: 'volatile' | 'changing' | 'stable' | 'fixed';
    confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
    criticality: 'low' | 'medium' | 'high' | 'critical';
    scope: 'narrow' | 'moderate' | 'broad' | 'enterprise';
    tags: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
  status: 'developing' | 'stable' | 'validated' | 'outdated' | 'deprecated';
}

export interface ProjectObjective {
  id: string;
  name: string;
  description: string;
  objectiveType: 'business' | 'technical' | 'user' | 'operational' | 'strategic' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  measurable: boolean;
  metrics: string[];
  timeline: string;
  dependencies: string[];
  status: 'planned' | 'active' | 'achieved' | 'deferred' | 'cancelled';
}

export interface ProjectConstraint {
  id: string;
  name: string;
  description: string;
  constraintType: 'time' | 'budget' | 'resource' | 'technical' | 'regulatory' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  flexibility: 'fixed' | 'negotiable' | 'flexible' | 'variable';
  impact: string;
  mitigations: string[];
  workarounds: string[];
}

export interface ProjectAssumption {
  id: string;
  name: string;
  description: string;
  assumptionType: 'business' | 'technical' | 'user' | 'market' | 'organizational' | 'external';
  confidence: number; // 0-1
  risk: 'low' | 'medium' | 'high' | 'critical';
  validation: string[];
  dependencies: string[];
  contingencies: string[];
}

export interface ProjectStakeholder {
  id: string;
  name: string;
  role: string;
  stakeholderType: 'primary' | 'secondary' | 'key' | 'influencer' | 'user' | 'sponsor';
  influence: 'low' | 'medium' | 'high' | 'critical';
  interest: 'low' | 'medium' | 'high' | 'critical';
  expectations: string[];
  concerns: string[];
  communicationPreferences: string[];
}

export interface ProjectRequirement {
  id: string;
  name: string;
  description: string;
  requirementType: 'functional' | 'non_functional' | 'business' | 'technical' | 'user' | 'compliance';
  priority: 'must_have' | 'should_have' | 'could_have' | 'wont_have';
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  effort: number; // hours
  dependencies: string[];
  acceptance_criteria: string[];
  status: 'draft' | 'approved' | 'implemented' | 'tested' | 'accepted';
}

export interface ProjectRisk {
  id: string;
  name: string;
  description: string;
  riskType: 'technical' | 'business' | 'operational' | 'financial' | 'regulatory' | 'external';
  probability: 'low' | 'medium' | 'high' | 'very_high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  severity: number; // probability * impact
  mitigations: string[];
  contingencies: string[];
  owner: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'closed';
}

export interface DomainKnowledge {
  id: string;
  domain: string;
  knowledge: string;
  knowledgeType: 'factual' | 'procedural' | 'conceptual' | 'metacognitive';
  confidence: number; // 0-1
  source: string;
  validation: string[];
  applications: string[];
  limitations: string[];
}

export interface BusinessLogic {
  id: string;
  name: string;
  description: string;
  logicType: 'rule' | 'process' | 'workflow' | 'calculation' | 'validation' | 'decision';
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  inputs: string[];
  outputs: string[];
  conditions: string[];
  exceptions: string[];
  dependencies: string[];
}

export interface TechnicalContext {
  id: string;
  name: string;
  description: string;
  contextType: 'architecture' | 'infrastructure' | 'platform' | 'framework' | 'integration' | 'security';
  technologies: string[];
  constraints: string[];
  capabilities: string[];
  limitations: string[];
  dependencies: string[];
  considerations: string[];
}

export interface UserContext {
  id: string;
  userType: string;
  description: string;
  characteristics: string[];
  needs: string[];
  goals: string[];
  painPoints: string[];
  behaviors: string[];
  preferences: string[];
  constraints: string[];
  journey: string[];
}

export interface MarketContext {
  id: string;
  name: string;
  description: string;
  contextType: 'competitive' | 'regulatory' | 'economic' | 'technological' | 'social' | 'environmental';
  factors: string[];
  trends: string[];
  opportunities: string[];
  threats: string[];
  implications: string[];
  timeframe: string;
}

export interface OrganizationalContext {
  id: string;
  name: string;
  description: string;
  contextType: 'culture' | 'structure' | 'process' | 'capability' | 'resource' | 'strategic';
  characteristics: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  constraints: string[];
  implications: string[];
}

export interface ContextChange {
  id: string;
  contextId: string;
  changeType: 'addition' | 'modification' | 'removal' | 'clarification' | 'validation' | 'invalidation';
  description: string;
  rationale: string;
  impact: 'minor' | 'moderate' | 'major' | 'fundamental';
  evidence: string[];
  confidence: number; // 0-1
  createdAt: Date;
  createdBy: string;
}

export interface ContextDiscovery {
  id: string;
  contextId: string;
  discoveryType: 'insight' | 'pattern' | 'relationship' | 'constraint' | 'opportunity' | 'risk';
  description: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  implications: string[];
  actions: string[];
  confidence: number; // 0-1
  createdAt: Date;
}

export interface ContextClarification {
  id: string;
  contextId: string;
  clarificationType: 'ambiguity_resolution' | 'detail_addition' | 'relationship_clarification' | 'scope_definition';
  description: string;
  before: string;
  after: string;
  rationale: string;
  impact: string;
  confidence: number; // 0-1
  createdAt: Date;
}

export interface ContextValidation {
  id: string;
  contextId: string;
  validationType: 'stakeholder_confirmation' | 'evidence_verification' | 'assumption_testing' | 'requirement_validation';
  description: string;
  method: string;
  results: string[];
  confidence: number; // 0-1
  validated: boolean;
  issues: string[];
  createdAt: Date;
}

export interface CommunicationPreference {
  id: string;
  userId: string;
  name: string;
  description: string;
  preferenceType: 'style' | 'format' | 'frequency' | 'timing' | 'channel' | 'content';
  
  // Preference details
  details: {
    communicationStyle: string;
    formalityLevel: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';
    detailLevel: 'high' | 'medium' | 'low' | 'summary_only';
    pace: 'fast' | 'moderate' | 'slow' | 'adaptive';
    tone: 'professional' | 'friendly' | 'casual' | 'enthusiastic' | 'calm';
    structure: 'structured' | 'flexible' | 'conversational' | 'bullet_points';
  };
  
  // Content preferences
  content: {
    examplesPreferred: boolean;
    visualAidsPreferred: boolean;
    stepByStepPreferred: boolean;
    summariesPreferred: boolean;
    contextPreferred: boolean;
    rationale: boolean;
  };
  
  // Interaction preferences
  interaction: {
    questioningStyle: 'direct' | 'guided' | 'socratic' | 'exploratory';
    feedbackStyle: 'immediate' | 'periodic' | 'milestone' | 'final';
    collaborationStyle: 'leading' | 'partnering' | 'supporting' | 'following';
    errorHandling: 'correction' | 'guidance' | 'exploration' | 'learning';
  };
  
  // Context sensitivity
  context: {
    domains: string[];
    situations: string[];
    moods: string[];
    timeConstraints: string[];
    complexity: string[];
    urgency: string[];
  };
  
  // Preference validation
  validation: {
    evidenceCount: number;
    confidenceLevel: number; // 0-1
    consistencyScore: number; // 0-1
    lastValidated: Date;
    validationSources: string[];
    contradictoryEvidence: string[];
  };
  
  // Preference evolution
  evolution: {
    originalPreference: string;
    modifications: PreferenceModification[];
    adaptations: PreferenceAdaptation[];
    learningEvents: PreferenceLearningEvent[];
    stabilityScore: number; // 0-1
  };
  
  // Metadata
  metadata: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    flexibility: 'rigid' | 'moderate' | 'flexible' | 'adaptive';
    scope: 'specific' | 'general' | 'universal';
    reliability: number; // 0-1
    tags: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
  status: 'developing' | 'stable' | 'validated' | 'outdated' | 'deprecated';
}

export interface PreferenceModification {
  id: string;
  preferenceId: string;
  modificationType: 'refinement' | 'correction' | 'expansion' | 'adaptation' | 'validation' | 'invalidation';
  description: string;
  rationale: string;
  evidence: string[];
  impact: 'minor' | 'moderate' | 'major' | 'fundamental';
  confidence: number; // 0-1
  createdAt: Date;
  createdBy: string;
}

export interface PreferenceAdaptation {
  id: string;
  preferenceId: string;
  adaptationType: 'context_specific' | 'situational' | 'mood_based' | 'time_sensitive' | 'complexity_driven';
  description: string;
  triggers: string[];
  adaptations: string[];
  effectiveness: number; // 0-1
  frequency: number; // 0-1
  confidence: number; // 0-1
  createdAt: Date;
}

export interface PreferenceLearningEvent {
  id: string;
  preferenceId: string;
  eventType: 'observation' | 'feedback' | 'contradiction' | 'validation' | 'adaptation' | 'insight';
  description: string;
  context: string;
  impact: string;
  learnings: string[];
  confidence: number; // 0-1
  createdAt: Date;
}

export interface RelationshipDevelopment {
  id: string;
  userId: string;
  name: string;
  description: string;
  relationshipType: 'professional' | 'collaborative' | 'mentoring' | 'advisory' | 'supportive' | 'transactional';
  
  // Relationship stages
  stages: {
    currentStage: RelationshipStage;
    stageHistory: RelationshipStage[];
    progression: RelationshipProgression[];
    milestones: RelationshipMilestone[];
  };
  
  // Trust and rapport
  trust: {
    trustLevel: number; // 0-1
    trustFactors: TrustFactor[];
    trustEvents: TrustEvent[];
    trustTrends: TrustTrend[];
    rapportLevel: number; // 0-1
    rapportFactors: RapportFactor[];
  };
  
  // Communication patterns
  communication: {
    patterns: CommunicationPattern[];
    effectiveness: number; // 0-1
    satisfaction: number; // 0-1
    adaptations: CommunicationAdaptation[];
    improvements: CommunicationImprovement[];
  };
  
  // Collaboration dynamics
  collaboration: {
    workingRelationship: WorkingRelationship;
    collaborationStyle: string;
    effectiveness: number; // 0-1
    challenges: CollaborationChallenge[];
    successes: CollaborationSuccess[];
    improvements: CollaborationImprovement[];
  };
  
  // Relationship quality
  quality: {
    overallQuality: number; // 0-1
    satisfaction: number; // 0-1
    effectiveness: number; // 0-1
    sustainability: number; // 0-1
    growth: number; // 0-1
    stability: number; // 0-1
  };
  
  // Metadata
  metadata: {
    duration: number; // days
    interactionCount: number;
    lastInteraction: Date;
    frequency: 'daily' | 'weekly' | 'monthly' | 'occasional' | 'rare';
    intensity: 'low' | 'medium' | 'high' | 'very_high';
    tags: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
  status: 'developing' | 'established' | 'mature' | 'declining' | 'dormant';
}

export interface RelationshipStage {
  id: string;
  name: string;
  description: string;
  stageType: 'initial' | 'building' | 'developing' | 'established' | 'mature' | 'declining';
  characteristics: string[];
  duration: number; // days
  milestones: string[];
  challenges: string[];
  opportunities: string[];
  startDate: Date;
  endDate?: Date;
}

export interface RelationshipProgression {
  id: string;
  relationshipId: string;
  progressionType: 'advancement' | 'regression' | 'stabilization' | 'transformation';
  fromStage: string;
  toStage: string;
  triggers: string[];
  factors: string[];
  impact: string;
  confidence: number; // 0-1
  createdAt: Date;
}

export interface RelationshipMilestone {
  id: string;
  relationshipId: string;
  name: string;
  description: string;
  milestoneType: 'trust_building' | 'collaboration' | 'achievement' | 'challenge_overcome' | 'understanding';
  significance: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  evidence: string[];
  achievedAt: Date;
}

export interface TrustFactor {
  id: string;
  name: string;
  description: string;
  factorType: 'competence' | 'reliability' | 'integrity' | 'benevolence' | 'transparency' | 'consistency';
  weight: number; // 0-1
  score: number; // 0-1
  evidence: string[];
  trends: string[];
}

export interface TrustEvent {
  id: string;
  relationshipId: string;
  eventType: 'trust_building' | 'trust_damaging' | 'trust_testing' | 'trust_recovery';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: 'minor' | 'moderate' | 'major' | 'critical';
  factors: string[];
  outcomes: string[];
  lessons: string[];
  createdAt: Date;
}

export interface TrustTrend {
  id: string;
  relationshipId: string;
  trendType: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  timeframe: string;
  factors: string[];
  implications: string[];
  recommendations: string[];
  confidence: number; // 0-1
  createdAt: Date;
}

export interface RapportFactor {
  id: string;
  name: string;
  description: string;
  factorType: 'similarity' | 'empathy' | 'understanding' | 'shared_experience' | 'mutual_respect' | 'chemistry';
  strength: number; // 0-1
  stability: number; // 0-1
  evidence: string[];
  manifestations: string[];
}

export interface CommunicationPattern {
  id: string;
  relationshipId: string;
  patternType: 'frequency' | 'style' | 'content' | 'timing' | 'channel' | 'effectiveness';
  description: string;
  characteristics: string[];
  effectiveness: number; // 0-1
  satisfaction: number; // 0-1
  trends: string[];
  adaptations: string[];
}

export interface CommunicationAdaptation {
  id: string;
  relationshipId: string;
  adaptationType: 'style_adjustment' | 'content_modification' | 'timing_optimization' | 'channel_selection';
  description: string;
  rationale: string;
  implementation: string[];
  effectiveness: number; // 0-1
  feedback: string[];
  createdAt: Date;
}

export interface CommunicationImprovement {
  id: string;
  relationshipId: string;
  improvementType: 'clarity' | 'responsiveness' | 'empathy' | 'efficiency' | 'engagement' | 'understanding';
  description: string;
  before: string;
  after: string;
  impact: string;
  measurement: string[];
  sustainability: number; // 0-1
  createdAt: Date;
}

export interface WorkingRelationship {
  id: string;
  relationshipType: 'peer' | 'mentor_mentee' | 'advisor_advisee' | 'collaborator' | 'client_service_provider';
  dynamics: string[];
  roles: Record<string, string[]>; // role -> responsibilities
  boundaries: string[];
  expectations: string[];
  agreements: string[];
  effectiveness: number; // 0-1
}

export interface CollaborationChallenge {
  id: string;
  relationshipId: string;
  challengeType: 'communication' | 'coordination' | 'conflict' | 'expectation' | 'resource' | 'process';
  description: string;
  impact: 'minor' | 'moderate' | 'major' | 'critical';
  resolution: string[];
  lessons: string[];
  prevention: string[];
  status: 'identified' | 'addressed' | 'resolved' | 'ongoing';
  createdAt: Date;
}

export interface CollaborationSuccess {
  id: string;
  relationshipId: string;
  successType: 'achievement' | 'breakthrough' | 'efficiency' | 'innovation' | 'problem_solving' | 'learning';
  description: string;
  factors: string[];
  outcomes: string[];
  lessons: string[];
  replication: string[];
  impact: string;
  createdAt: Date;
}

export interface CollaborationImprovement {
  id: string;
  relationshipId: string;
  improvementType: 'process' | 'communication' | 'coordination' | 'efficiency' | 'quality' | 'satisfaction';
  description: string;
  implementation: string[];
  results: string[];
  measurement: string[];
  sustainability: number; // 0-1
  createdAt: Date;
}

export class RelationshipContextExtension extends Extension {
  private universalGovernance: UniversalGovernanceAdapter;
  private userMentalModels: Map<string, UserMentalModel[]> = new Map();
  private projectContexts: Map<string, ProjectContext[]> = new Map();
  private communicationPreferences: Map<string, CommunicationPreference[]> = new Map();
  private relationshipDevelopments: Map<string, RelationshipDevelopment[]> = new Map();

  constructor() {
    super('RelationshipContextExtension');
    this.universalGovernance = new UniversalGovernanceAdapter();
  }

  async initialize(): Promise<void> {
    await super.initialize();
    await this.universalGovernance.initialize();
    
    // Load existing relationship and context data
    await this.loadRelationshipContextData();
    
    this.logger.info('RelationshipContextExtension initialized successfully');
  }

  // User Mental Models
  async createUserMentalModel(
    agentId: string,
    userId: string,
    modelData: Omit<UserMentalModel, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<UserMentalModel> {
    try {
      // Validate model creation through governance
      const validationResult = await this.universalGovernance.validateCollaborativeDecision({
        type: 'mental_model_creation',
        participants: [agentId],
        context: {
          userId,
          modelType: modelData.modelType,
          complexity: modelData.metadata.complexity,
          scope: modelData.metadata.scope
        },
        riskLevel: this.calculateModelRiskLevel(modelData)
      });

      if (!validationResult.approved) {
        throw new Error(`Mental model creation not approved: ${validationResult.reason}`);
      }

      const model: UserMentalModel = {
        ...modelData,
        id: this.generateId(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'developing',
        validation: {
          evidenceCount: 0,
          confidenceLevel: 0.5,
          consistencyScore: 0.5,
          lastValidated: new Date(),
          validationSources: [],
          contradictoryEvidence: []
        },
        evolution: {
          originalModel: '',
          modifications: [],
          refinements: [],
          learningEvents: [],
          stabilityScore: 0.5
        },
        application: {
          domains: [],
          contexts: [],
          effectiveness: 0.5,
          usageCount: 0,
          successRate: 0.5,
          lastUsed: new Date()
        }
      };

      const userModels = this.userMentalModels.get(userId) || [];
      userModels.push(model);
      this.userMentalModels.set(userId, userModels);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'mental_model_created',
        resourceType: 'user_mental_model',
        resourceId: model.id,
        details: {
          userId,
          modelName: model.name,
          modelType: model.modelType,
          complexity: model.metadata.complexity
        },
        riskLevel: this.calculateModelRiskLevel(modelData),
        timestamp: new Date()
      });

      this.logger.info(`Created mental model: ${model.name} for user ${userId}`);
      return model;
    } catch (error) {
      this.logger.error('Failed to create mental model:', error);
      throw error;
    }
  }

  async updateMentalModel(
    agentId: string,
    modelId: string,
    learningEvent: Omit<LearningEvent, 'id' | 'modelId' | 'createdAt'>
  ): Promise<UserMentalModel> {
    try {
      // Find the model
      let targetModel: UserMentalModel | undefined;
      let userId: string | undefined;

      for (const [uid, models] of this.userMentalModels.entries()) {
        const model = models.find(m => m.id === modelId);
        if (model) {
          targetModel = model;
          userId = uid;
          break;
        }
      }

      if (!targetModel || !userId) {
        throw new Error(`Mental model not found: ${modelId}`);
      }

      // Add learning event
      const event: LearningEvent = {
        ...learningEvent,
        id: this.generateId(),
        modelId,
        createdAt: new Date()
      };

      targetModel.evolution.learningEvents.push(event);
      targetModel.updatedAt = new Date();

      // Update model based on learning event
      await this.processLearningEvent(targetModel, event);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'mental_model_updated',
        resourceType: 'user_mental_model',
        resourceId: modelId,
        details: {
          userId,
          eventType: learningEvent.eventType,
          impact: learningEvent.impact,
          confidence: learningEvent.confidence
        },
        riskLevel: 'low',
        timestamp: new Date()
      });

      return targetModel;
    } catch (error) {
      this.logger.error('Failed to update mental model:', error);
      throw error;
    }
  }

  // Project Context
  async createProjectContext(
    agentId: string,
    projectId: string,
    contextData: Omit<ProjectContext, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'validatedAt' | 'status'>
  ): Promise<ProjectContext> {
    try {
      // Validate context creation through governance
      const validationResult = await this.universalGovernance.validateCollaborativeDecision({
        type: 'project_context_creation',
        participants: [agentId],
        context: {
          projectId,
          contextType: contextData.contextType,
          complexity: contextData.metadata.complexity,
          confidentiality: contextData.metadata.confidentiality
        },
        riskLevel: this.calculateContextRiskLevel(contextData)
      });

      if (!validationResult.approved) {
        throw new Error(`Project context creation not approved: ${validationResult.reason}`);
      }

      const context: ProjectContext = {
        ...contextData,
        id: this.generateId(),
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'developing',
        evolution: {
          initialContext: '',
          changes: [],
          discoveries: [],
          clarifications: [],
          validations: []
        },
        quality: {
          completeness: 0.5,
          accuracy: 0.5,
          clarity: 0.5,
          consistency: 0.5,
          relevance: 0.5,
          currency: 1.0
        }
      };

      const projectContexts = this.projectContexts.get(projectId) || [];
      projectContexts.push(context);
      this.projectContexts.set(projectId, projectContexts);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'project_context_created',
        resourceType: 'project_context',
        resourceId: context.id,
        details: {
          projectId,
          contextName: context.name,
          contextType: context.contextType,
          complexity: context.metadata.complexity
        },
        riskLevel: this.calculateContextRiskLevel(contextData),
        timestamp: new Date()
      });

      this.logger.info(`Created project context: ${context.name} for project ${projectId}`);
      return context;
    } catch (error) {
      this.logger.error('Failed to create project context:', error);
      throw error;
    }
  }

  // Communication Preferences
  async createCommunicationPreference(
    agentId: string,
    userId: string,
    preferenceData: Omit<CommunicationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<CommunicationPreference> {
    try {
      const preference: CommunicationPreference = {
        ...preferenceData,
        id: this.generateId(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'developing',
        validation: {
          evidenceCount: 0,
          confidenceLevel: 0.5,
          consistencyScore: 0.5,
          lastValidated: new Date(),
          validationSources: [],
          contradictoryEvidence: []
        },
        evolution: {
          originalPreference: '',
          modifications: [],
          adaptations: [],
          learningEvents: [],
          stabilityScore: 0.5
        }
      };

      const userPreferences = this.communicationPreferences.get(userId) || [];
      userPreferences.push(preference);
      this.communicationPreferences.set(userId, userPreferences);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'communication_preference_created',
        resourceType: 'communication_preference',
        resourceId: preference.id,
        details: {
          userId,
          preferenceName: preference.name,
          preferenceType: preference.preferenceType,
          priority: preference.metadata.priority
        },
        riskLevel: 'low',
        timestamp: new Date()
      });

      return preference;
    } catch (error) {
      this.logger.error('Failed to create communication preference:', error);
      throw error;
    }
  }

  // Relationship Development
  async createRelationshipDevelopment(
    agentId: string,
    userId: string,
    relationshipData: Omit<RelationshipDevelopment, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<RelationshipDevelopment> {
    try {
      const relationship: RelationshipDevelopment = {
        ...relationshipData,
        id: this.generateId(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'developing',
        stages: {
          currentStage: {
            id: this.generateId(),
            name: 'Initial',
            description: 'Initial relationship stage',
            stageType: 'initial',
            characteristics: ['Getting to know each other', 'Building initial trust'],
            duration: 0,
            milestones: [],
            challenges: [],
            opportunities: [],
            startDate: new Date()
          },
          stageHistory: [],
          progression: [],
          milestones: []
        },
        trust: {
          trustLevel: 0.5,
          trustFactors: [],
          trustEvents: [],
          trustTrends: [],
          rapportLevel: 0.5,
          rapportFactors: []
        },
        communication: {
          patterns: [],
          effectiveness: 0.5,
          satisfaction: 0.5,
          adaptations: [],
          improvements: []
        },
        collaboration: {
          workingRelationship: {
            id: this.generateId(),
            relationshipType: 'collaborator',
            dynamics: [],
            roles: {},
            boundaries: [],
            expectations: [],
            agreements: [],
            effectiveness: 0.5
          },
          collaborationStyle: 'adaptive',
          effectiveness: 0.5,
          challenges: [],
          successes: [],
          improvements: []
        },
        quality: {
          overallQuality: 0.5,
          satisfaction: 0.5,
          effectiveness: 0.5,
          sustainability: 0.5,
          growth: 0.5,
          stability: 0.5
        },
        metadata: {
          duration: 0,
          interactionCount: 0,
          lastInteraction: new Date(),
          frequency: 'occasional',
          intensity: 'medium',
          tags: []
        }
      };

      const userRelationships = this.relationshipDevelopments.get(userId) || [];
      userRelationships.push(relationship);
      this.relationshipDevelopments.set(userId, userRelationships);

      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'relationship_development_created',
        resourceType: 'relationship_development',
        resourceId: relationship.id,
        details: {
          userId,
          relationshipName: relationship.name,
          relationshipType: relationship.relationshipType
        },
        riskLevel: 'low',
        timestamp: new Date()
      });

      return relationship;
    } catch (error) {
      this.logger.error('Failed to create relationship development:', error);
      throw error;
    }
  }

  // Search and retrieval
  async searchRelationshipContext(
    agentId: string,
    query: {
      keywords?: string[];
      type?: string;
      userId?: string;
      status?: string;
      complexity?: string;
    }
  ): Promise<any[]> {
    try {
      const results: any[] = [];

      // Search mental models
      const allModels = Array.from(this.userMentalModels.values()).flat();
      const filteredModels = this.filterMentalModels(allModels, query);
      results.push(...filteredModels.map(m => ({ ...m, dataType: 'user_mental_model' })));

      // Search project contexts
      const allContexts = Array.from(this.projectContexts.values()).flat();
      const filteredContexts = this.filterProjectContexts(allContexts, query);
      results.push(...filteredContexts.map(c => ({ ...c, dataType: 'project_context' })));

      // Search communication preferences
      const allPreferences = Array.from(this.communicationPreferences.values()).flat();
      const filteredPreferences = this.filterCommunicationPreferences(allPreferences, query);
      results.push(...filteredPreferences.map(p => ({ ...p, dataType: 'communication_preference' })));

      // Search relationship developments
      const allRelationships = Array.from(this.relationshipDevelopments.values()).flat();
      const filteredRelationships = this.filterRelationshipDevelopments(allRelationships, query);
      results.push(...filteredRelationships.map(r => ({ ...r, dataType: 'relationship_development' })));

      // Sort by relevance and recency
      results.sort((a, b) => {
        // Recency first
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

      return results;
    } catch (error) {
      this.logger.error('Failed to search relationship context:', error);
      return [];
    }
  }

  // Analytics and insights
  async getRelationshipContextAnalytics(agentId: string): Promise<any> {
    try {
      const allModels = Array.from(this.userMentalModels.values()).flat();
      const allContexts = Array.from(this.projectContexts.values()).flat();
      const allPreferences = Array.from(this.communicationPreferences.values()).flat();
      const allRelationships = Array.from(this.relationshipDevelopments.values()).flat();

      return {
        mentalModelMetrics: {
          totalModels: allModels.length,
          stableModels: allModels.filter(m => m.status === 'stable').length,
          validatedModels: allModels.filter(m => m.status === 'validated').length,
          averageConfidence: this.calculateAverageConfidence(allModels),
          averageCompleteness: this.calculateAverageCompleteness(allModels),
          modelTypeDistribution: this.calculateModelTypeDistribution(allModels)
        },
        contextMetrics: {
          totalContexts: allContexts.length,
          stableContexts: allContexts.filter(c => c.status === 'stable').length,
          validatedContexts: allContexts.filter(c => c.status === 'validated').length,
          averageQuality: this.calculateAverageContextQuality(allContexts),
          contextTypeDistribution: this.calculateContextTypeDistribution(allContexts),
          complexityDistribution: this.calculateComplexityDistribution(allContexts)
        },
        preferenceMetrics: {
          totalPreferences: allPreferences.length,
          stablePreferences: allPreferences.filter(p => p.status === 'stable').length,
          validatedPreferences: allPreferences.filter(p => p.status === 'validated').length,
          averageConfidence: this.calculateAveragePreferenceConfidence(allPreferences),
          preferenceTypeDistribution: this.calculatePreferenceTypeDistribution(allPreferences)
        },
        relationshipMetrics: {
          totalRelationships: allRelationships.length,
          establishedRelationships: allRelationships.filter(r => r.status === 'established').length,
          matureRelationships: allRelationships.filter(r => r.status === 'mature').length,
          averageTrustLevel: this.calculateAverageTrustLevel(allRelationships),
          averageQuality: this.calculateAverageRelationshipQuality(allRelationships),
          relationshipTypeDistribution: this.calculateRelationshipTypeDistribution(allRelationships)
        },
        insights: this.generateRelationshipContextInsights(allModels, allContexts, allPreferences, allRelationships),
        recommendations: this.generateRelationshipContextRecommendations(allModels, allContexts, allPreferences, allRelationships)
      };
    } catch (error) {
      this.logger.error('Failed to get relationship context analytics:', error);
      return null;
    }
  }

  // Helper methods
  private async loadRelationshipContextData(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    this.logger.info('Loading relationship context data...');
  }

  private calculateModelRiskLevel(model: Omit<UserMentalModel, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Complexity factor
    const complexityScores = { low: 1, medium: 2, high: 3, very_high: 4 };
    riskScore += complexityScores[model.metadata.complexity];

    // Scope factor
    const scopeScores = { narrow: 1, moderate: 2, broad: 3, comprehensive: 4 };
    riskScore += scopeScores[model.metadata.scope];

    if (riskScore >= 6) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }

  private calculateContextRiskLevel(context: Omit<ProjectContext, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'validatedAt' | 'status'>): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Complexity factor
    const complexityScores = { low: 1, medium: 2, high: 3, very_high: 4 };
    riskScore += complexityScores[context.metadata.complexity];

    // Confidentiality factor
    const confidentialityScores = { public: 1, internal: 2, confidential: 3, restricted: 4 };
    riskScore += confidentialityScores[context.metadata.confidentiality];

    // Criticality factor
    const criticalityScores = { low: 1, medium: 2, high: 3, critical: 4 };
    riskScore += criticalityScores[context.metadata.criticality];

    if (riskScore >= 8) return 'high';
    if (riskScore >= 5) return 'medium';
    return 'low';
  }

  private async processLearningEvent(model: UserMentalModel, event: LearningEvent): Promise<void> {
    // Update model based on learning event
    model.validation.evidenceCount++;
    
    // Adjust confidence based on event type and confidence
    if (event.eventType === 'validation') {
      model.validation.confidenceLevel = Math.min(1, model.validation.confidenceLevel + event.confidence * 0.1);
    } else if (event.eventType === 'contradiction') {
      model.validation.confidenceLevel = Math.max(0, model.validation.confidenceLevel - event.confidence * 0.1);
    }

    // Update consistency score
    model.validation.consistencyScore = this.calculateConsistencyScore(model);

    // Update stability score
    model.evolution.stabilityScore = this.calculateStabilityScore(model);

    // Update application effectiveness
    model.application.usageCount++;
    model.application.lastUsed = new Date();
  }

  private calculateConsistencyScore(model: UserMentalModel): number {
    // Calculate consistency based on contradictory evidence vs supporting evidence
    const totalEvidence = model.validation.evidenceCount;
    const contradictoryCount = model.validation.contradictoryEvidence.length;
    
    if (totalEvidence === 0) return 0.5;
    
    return Math.max(0, 1 - (contradictoryCount / totalEvidence));
  }

  private calculateStabilityScore(model: UserMentalModel): number {
    // Calculate stability based on frequency and magnitude of modifications
    const recentModifications = model.evolution.modifications.filter(
      m => m.createdAt.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    const majorModifications = recentModifications.filter(m => m.impact === 'major' || m.impact === 'fundamental');
    
    if (recentModifications.length === 0) return 1;
    if (majorModifications.length > 2) return 0.2;
    if (majorModifications.length > 0) return 0.5;
    
    return Math.max(0.7, 1 - (recentModifications.length * 0.1));
  }

  private filterMentalModels(models: UserMentalModel[], query: any): UserMentalModel[] {
    let filtered = models;

    if (query.keywords) {
      const keywords = query.keywords.map((k: string) => k.toLowerCase());
      filtered = filtered.filter(model =>
        keywords.some(keyword =>
          model.name.toLowerCase().includes(keyword) ||
          model.description.toLowerCase().includes(keyword)
        )
      );
    }

    if (query.type) {
      filtered = filtered.filter(model => model.modelType === query.type);
    }

    if (query.userId) {
      filtered = filtered.filter(model => model.userId === query.userId);
    }

    if (query.status) {
      filtered = filtered.filter(model => model.status === query.status);
    }

    if (query.complexity) {
      filtered = filtered.filter(model => model.metadata.complexity === query.complexity);
    }

    return filtered;
  }

  private filterProjectContexts(contexts: ProjectContext[], query: any): ProjectContext[] {
    let filtered = contexts;

    if (query.keywords) {
      const keywords = query.keywords.map((k: string) => k.toLowerCase());
      filtered = filtered.filter(context =>
        keywords.some(keyword =>
          context.name.toLowerCase().includes(keyword) ||
          context.description.toLowerCase().includes(keyword)
        )
      );
    }

    if (query.type) {
      filtered = filtered.filter(context => context.contextType === query.type);
    }

    if (query.status) {
      filtered = filtered.filter(context => context.status === query.status);
    }

    if (query.complexity) {
      filtered = filtered.filter(context => context.metadata.complexity === query.complexity);
    }

    return filtered;
  }

  private filterCommunicationPreferences(preferences: CommunicationPreference[], query: any): CommunicationPreference[] {
    let filtered = preferences;

    if (query.keywords) {
      const keywords = query.keywords.map((k: string) => k.toLowerCase());
      filtered = filtered.filter(preference =>
        keywords.some(keyword =>
          preference.name.toLowerCase().includes(keyword) ||
          preference.description.toLowerCase().includes(keyword)
        )
      );
    }

    if (query.type) {
      filtered = filtered.filter(preference => preference.preferenceType === query.type);
    }

    if (query.userId) {
      filtered = filtered.filter(preference => preference.userId === query.userId);
    }

    if (query.status) {
      filtered = filtered.filter(preference => preference.status === query.status);
    }

    return filtered;
  }

  private filterRelationshipDevelopments(relationships: RelationshipDevelopment[], query: any): RelationshipDevelopment[] {
    let filtered = relationships;

    if (query.keywords) {
      const keywords = query.keywords.map((k: string) => k.toLowerCase());
      filtered = filtered.filter(relationship =>
        keywords.some(keyword =>
          relationship.name.toLowerCase().includes(keyword) ||
          relationship.description.toLowerCase().includes(keyword)
        )
      );
    }

    if (query.type) {
      filtered = filtered.filter(relationship => relationship.relationshipType === query.type);
    }

    if (query.userId) {
      filtered = filtered.filter(relationship => relationship.userId === query.userId);
    }

    if (query.status) {
      filtered = filtered.filter(relationship => relationship.status === query.status);
    }

    return filtered;
  }

  private calculateAverageConfidence(models: UserMentalModel[]): number {
    if (models.length === 0) return 0;
    const totalConfidence = models.reduce((sum, model) => sum + model.validation.confidenceLevel, 0);
    return totalConfidence / models.length;
  }

  private calculateAverageCompleteness(models: UserMentalModel[]): number {
    if (models.length === 0) return 0;
    const totalCompleteness = models.reduce((sum, model) => sum + model.metadata.completeness, 0);
    return totalCompleteness / models.length;
  }

  private calculateModelTypeDistribution(models: UserMentalModel[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    models.forEach(model => {
      distribution[model.modelType] = (distribution[model.modelType] || 0) + 1;
    });
    return distribution;
  }

  private calculateAverageContextQuality(contexts: ProjectContext[]): number {
    if (contexts.length === 0) return 0;
    
    const totalQuality = contexts.reduce((sum, context) => {
      const qualityScores = Object.values(context.quality);
      const avgQuality = qualityScores.reduce((qSum, score) => qSum + score, 0) / qualityScores.length;
      return sum + avgQuality;
    }, 0);
    
    return totalQuality / contexts.length;
  }

  private calculateContextTypeDistribution(contexts: ProjectContext[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    contexts.forEach(context => {
      distribution[context.contextType] = (distribution[context.contextType] || 0) + 1;
    });
    return distribution;
  }

  private calculateComplexityDistribution(contexts: ProjectContext[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    contexts.forEach(context => {
      distribution[context.metadata.complexity] = (distribution[context.metadata.complexity] || 0) + 1;
    });
    return distribution;
  }

  private calculateAveragePreferenceConfidence(preferences: CommunicationPreference[]): number {
    if (preferences.length === 0) return 0;
    const totalConfidence = preferences.reduce((sum, preference) => sum + preference.validation.confidenceLevel, 0);
    return totalConfidence / preferences.length;
  }

  private calculatePreferenceTypeDistribution(preferences: CommunicationPreference[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    preferences.forEach(preference => {
      distribution[preference.preferenceType] = (distribution[preference.preferenceType] || 0) + 1;
    });
    return distribution;
  }

  private calculateAverageTrustLevel(relationships: RelationshipDevelopment[]): number {
    if (relationships.length === 0) return 0;
    const totalTrust = relationships.reduce((sum, relationship) => sum + relationship.trust.trustLevel, 0);
    return totalTrust / relationships.length;
  }

  private calculateAverageRelationshipQuality(relationships: RelationshipDevelopment[]): number {
    if (relationships.length === 0) return 0;
    const totalQuality = relationships.reduce((sum, relationship) => sum + relationship.quality.overallQuality, 0);
    return totalQuality / relationships.length;
  }

  private calculateRelationshipTypeDistribution(relationships: RelationshipDevelopment[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    relationships.forEach(relationship => {
      distribution[relationship.relationshipType] = (distribution[relationship.relationshipType] || 0) + 1;
    });
    return distribution;
  }

  private generateRelationshipContextInsights(
    models: UserMentalModel[],
    contexts: ProjectContext[],
    preferences: CommunicationPreference[],
    relationships: RelationshipDevelopment[]
  ): string[] {
    const insights: string[] = [];

    // Mental model insights
    const highConfidenceModels = models.filter(m => m.validation.confidenceLevel > 0.8);
    if (highConfidenceModels.length > 0) {
      insights.push(`${highConfidenceModels.length} mental models have high confidence levels`);
    }

    // Context insights
    const complexContexts = contexts.filter(c => c.metadata.complexity === 'high' || c.metadata.complexity === 'very_high');
    if (complexContexts.length > 0) {
      insights.push(`${complexContexts.length} project contexts are highly complex`);
    }

    // Preference insights
    const stablePreferences = preferences.filter(p => p.evolution.stabilityScore > 0.8);
    if (stablePreferences.length > 0) {
      insights.push(`${stablePreferences.length} communication preferences are stable`);
    }

    // Relationship insights
    const matureRelationships = relationships.filter(r => r.status === 'mature');
    if (matureRelationships.length > 0) {
      insights.push(`${matureRelationships.length} relationships have reached maturity`);
    }

    return insights;
  }

  private generateRelationshipContextRecommendations(
    models: UserMentalModel[],
    contexts: ProjectContext[],
    preferences: CommunicationPreference[],
    relationships: RelationshipDevelopment[]
  ): string[] {
    const recommendations: string[] = [];

    // Mental model recommendations
    const lowConfidenceModels = models.filter(m => m.validation.confidenceLevel < 0.6);
    if (lowConfidenceModels.length > 0) {
      recommendations.push('Gather more evidence to validate low-confidence mental models');
    }

    // Context recommendations
    const outdatedContexts = contexts.filter(c => c.status === 'outdated');
    if (outdatedContexts.length > 0) {
      recommendations.push('Update outdated project contexts to maintain accuracy');
    }

    // Preference recommendations
    const developingPreferences = preferences.filter(p => p.status === 'developing');
    if (developingPreferences.length > 0) {
      recommendations.push('Continue observing user interactions to stabilize developing preferences');
    }

    // Relationship recommendations
    const decliningRelationships = relationships.filter(r => r.status === 'declining');
    if (decliningRelationships.length > 0) {
      recommendations.push('Address issues in declining relationships to prevent further deterioration');
    }

    return recommendations;
  }

  private generateId(): string {
    return `relationship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

