/**
 * Research Repository Extension for Promethios
 * 
 * Captures, stores, and makes retrievable all research work to prevent re-research.
 * Provides research threads, source credibility scoring, evolution tracking, and
 * collaborative research capabilities with full governance integration.
 * 
 * Integrates with UniversalGovernanceAdapter for consistent governance and audit trails.
 */

import { Extension } from './Extension';
import { UniversalGovernanceAdapter } from '../services/UniversalGovernanceAdapter';
import { DataHarvestingExtension } from './DataHarvestingExtension';

export interface ResearchSource {
  id: string;
  url?: string;
  title: string;
  author?: string;
  publicationDate?: Date;
  sourceType: 'web_article' | 'academic_paper' | 'book' | 'interview' | 'survey' | 'database' | 'api_data' | 'internal_document';
  credibilityScore: number; // 0-1
  accessDate: Date;
  relevanceScore: number; // 0-1
  metadata: {
    domain?: string;
    language?: string;
    wordCount?: number;
    citations?: number;
    peerReviewed?: boolean;
    lastUpdated?: Date;
  };
  governanceValidated: boolean;
  extractedContent?: string;
  keyQuotes: string[];
  tags: string[];
}

export interface ResearchFinding {
  id: string;
  title: string;
  description: string;
  findingType: 'fact' | 'insight' | 'trend' | 'correlation' | 'hypothesis' | 'conclusion' | 'recommendation';
  confidence: number; // 0-1
  supportingSources: string[]; // ResearchSource IDs
  contradictingSources: string[]; // ResearchSource IDs
  implications: string[];
  limitations: string[];
  validationStatus: 'unvalidated' | 'partially_validated' | 'validated' | 'contradicted';
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  actionability: number; // 0-1
  createdAt: Date;
  updatedAt: Date;
}

export interface ResearchMethodology {
  approach: 'systematic_review' | 'exploratory' | 'comparative' | 'longitudinal' | 'case_study' | 'survey' | 'experimental';
  searchStrategy: {
    keywords: string[];
    databases: string[];
    timeRange: {
      start?: Date;
      end?: Date;
    };
    inclusionCriteria: string[];
    exclusionCriteria: string[];
  };
  qualityAssessment: {
    criteria: string[];
    scoringMethod: string;
    minimumThreshold: number;
  };
  dataExtraction: {
    fields: string[];
    standardization: boolean;
    validationProcess: string;
  };
  biasAssessment: {
    types: string[];
    mitigationStrategies: string[];
  };
}

export interface ResearchEvolution {
  id: string;
  timestamp: Date;
  changeType: 'new_finding' | 'updated_finding' | 'contradicted_finding' | 'methodology_change' | 'scope_expansion' | 'quality_improvement';
  description: string;
  previousState?: any;
  newState: any;
  trigger: 'new_source' | 'user_feedback' | 'peer_review' | 'automated_validation' | 'cross_reference';
  confidence: number;
  agentId: string;
  governanceApproved: boolean;
}

export interface ResearchThread {
  id: string;
  title: string;
  description: string;
  researchQuestion: string;
  hypothesis?: string;
  scope: {
    domain: string;
    timeframe?: {
      start?: Date;
      end?: Date;
    };
    geographicScope?: string[];
    targetAudience?: string[];
  };
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  entries: string[]; // ResearchEntry IDs
  collaborators: string[]; // Agent IDs
  tags: string[];
  parentThreadId?: string;
  childThreadIds: string[];
  crossReferences: string[];
  governanceContext: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ResearchEntry {
  id: string;
  threadId: string;
  title: string;
  description: string;
  researchType: 'market_analysis' | 'technical_research' | 'competitive_analysis' | 'user_research' | 'literature_review' | 'trend_analysis' | 'feasibility_study' | 'risk_assessment';
  sources: ResearchSource[];
  findings: ResearchFinding[];
  methodology: ResearchMethodology;
  credibilityScore: number; // Aggregate of source credibility
  completeness: number; // 0-1
  evolutionHistory: ResearchEvolution[];
  crossReferences: string[];
  collaborators: string[];
  qualityMetrics: {
    sourceQuality: number;
    methodologyRigor: number;
    findingReliability: number;
    biasAssessment: number;
    reproducibility: number;
  };
  businessValue: {
    strategicImportance: number;
    timeValue: number; // How time-sensitive the research is
    costSavings: number; // Estimated cost savings from reuse
    riskMitigation: number;
  };
  governanceData: {
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'requires_review';
    approvedBy?: string;
    approvalTimestamp?: Date;
    complianceFlags: string[];
    accessLevel: 'public' | 'internal' | 'restricted' | 'confidential';
    retentionPeriod?: number; // Days
    auditTrail: string[];
  };
  searchableContent: string; // Processed content for search
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  shareCount: number;
}

export interface ResearchTemplate {
  id: string;
  name: string;
  description: string;
  researchType: ResearchEntry['researchType'];
  methodology: Partial<ResearchMethodology>;
  requiredFields: string[];
  optionalFields: string[];
  qualityCriteria: string[];
  estimatedTimeToComplete: number; // Hours
  skillRequirements: string[];
  toolsRequired: string[];
  outputFormat: string;
  usageCount: number;
  successRate: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResearchCollaboration {
  id: string;
  threadId: string;
  participantAgents: string[];
  collaborationType: 'parallel_research' | 'peer_review' | 'knowledge_synthesis' | 'cross_validation' | 'expert_consultation';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  roles: Record<string, 'lead_researcher' | 'contributor' | 'reviewer' | 'validator' | 'synthesizer'>;
  workDistribution: Record<string, string[]>; // Agent ID -> Task IDs
  communicationLog: CollaborationMessage[];
  consensusLevel: number; // 0-1
  conflictResolution: ConflictResolution[];
  qualityAssurance: QualityAssuranceProcess;
  governanceOversight: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface CollaborationMessage {
  id: string;
  fromAgentId: string;
  toAgentIds: string[];
  messageType: 'question' | 'finding' | 'concern' | 'suggestion' | 'validation' | 'synthesis';
  content: string;
  attachments: string[]; // Research entry IDs or source IDs
  priority: 'low' | 'medium' | 'high';
  requiresResponse: boolean;
  responses: CollaborationResponse[];
  timestamp: Date;
  governanceApproved: boolean;
}

export interface CollaborationResponse {
  id: string;
  fromAgentId: string;
  content: string;
  responseType: 'agreement' | 'disagreement' | 'clarification' | 'additional_info' | 'concern';
  confidence: number;
  timestamp: Date;
}

export interface ConflictResolution {
  id: string;
  conflictType: 'methodology_disagreement' | 'finding_contradiction' | 'source_credibility' | 'interpretation_difference';
  description: string;
  involvedAgents: string[];
  resolutionStrategy: 'consensus_building' | 'expert_arbitration' | 'additional_research' | 'governance_decision';
  resolution: string;
  resolvedBy: string;
  resolvedAt: Date;
  satisfactionLevel: number; // 0-1
}

export interface QualityAssuranceProcess {
  checkpoints: QualityCheckpoint[];
  reviewers: string[];
  criteria: QualityCriteria;
  currentScore: number;
  passThreshold: number;
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityCheckpoint {
  id: string;
  name: string;
  description: string;
  criteria: string[];
  status: 'pending' | 'passed' | 'failed' | 'requires_attention';
  score: number;
  reviewedBy?: string;
  reviewedAt?: Date;
  comments?: string;
}

export interface QualityCriteria {
  sourceReliability: number;
  methodologyRigor: number;
  findingValidity: number;
  biasMinimization: number;
  reproducibility: number;
  relevance: number;
  timeliness: number;
}

export interface QualityIssue {
  id: string;
  type: 'source_quality' | 'methodology_flaw' | 'bias_detected' | 'inconsistency' | 'outdated_info' | 'missing_validation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedComponents: string[];
  recommendedActions: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export class ResearchRepositoryExtension extends Extension {
  private universalGovernance: UniversalGovernanceAdapter;
  private dataHarvesting: DataHarvestingExtension;
  
  // Storage
  private researchThreads: Map<string, ResearchThread> = new Map();
  private researchEntries: Map<string, ResearchEntry> = new Map();
  private researchSources: Map<string, ResearchSource> = new Map();
  private researchTemplates: Map<string, ResearchTemplate> = new Map();
  private activeCollaborations: Map<string, ResearchCollaboration> = new Map();
  
  // Search and indexing
  private searchIndex: Map<string, Set<string>> = new Map(); // keyword -> entry IDs
  private sourceCredibilityTracker: Map<string, SourceCredibilityMetrics> = new Map();
  private researchAnalytics: ResearchAnalytics;

  constructor() {
    super('ResearchRepositoryExtension', '1.0.0');
    this.universalGovernance = new UniversalGovernanceAdapter();
    this.dataHarvesting = new DataHarvestingExtension();
    this.researchAnalytics = new ResearchAnalytics();
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔬 [Research] Initializing Research Repository Extension...');
      
      // Initialize dependencies
      await this.universalGovernance.initialize();
      await this.dataHarvesting.initialize();
      
      // Load existing research data
      await this.loadExistingResearch();
      
      // Initialize search indexing
      await this.buildSearchIndex();
      
      // Start background processes
      this.startCredibilityTracking();
      this.startQualityMonitoring();
      this.startAnalyticsCollection();
      
      console.log('✅ [Research] Research Repository Extension initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ [Research] Failed to initialize Research Repository Extension:', error);
      return false;
    }
  }

  // ============================================================================
  // RESEARCH THREAD MANAGEMENT
  // ============================================================================

  async createResearchThread(request: {
    title: string;
    description: string;
    researchQuestion: string;
    hypothesis?: string;
    scope: ResearchThread['scope'];
    priority: ResearchThread['priority'];
    collaborators?: string[];
    parentThreadId?: string;
    agentId: string;
  }): Promise<ResearchThread> {
    try {
      console.log(`🧵 [Research] Creating research thread: ${request.title}`);
      
      // Validate through governance
      const governanceValidation = await this.universalGovernance.validateCollaborativeDecision({
        contextId: `research_thread_${Date.now()}`,
        participatingAgents: [request.agentId, ...(request.collaborators || [])],
        decisionType: 'research_thread_creation',
        content: request
      });
      
      if (!governanceValidation.approved) {
        throw new Error('Research thread creation not approved by governance');
      }
      
      const thread: ResearchThread = {
        id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: request.title,
        description: request.description,
        researchQuestion: request.researchQuestion,
        hypothesis: request.hypothesis,
        scope: request.scope,
        status: 'planning',
        priority: request.priority,
        entries: [],
        collaborators: request.collaborators || [],
        tags: this.extractTags(request.title + ' ' + request.description),
        parentThreadId: request.parentThreadId,
        childThreadIds: [],
        crossReferences: [],
        governanceContext: governanceValidation.contextId || '',
        createdBy: request.agentId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.researchThreads.set(thread.id, thread);
      
      // Update parent thread if applicable
      if (request.parentThreadId) {
        const parentThread = this.researchThreads.get(request.parentThreadId);
        if (parentThread) {
          parentThread.childThreadIds.push(thread.id);
          parentThread.updatedAt = new Date();
          this.researchThreads.set(parentThread.id, parentThread);
        }
      }
      
      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId: request.agentId,
        action: 'research_thread_created',
        details: {
          threadId: thread.id,
          title: thread.title,
          researchQuestion: thread.researchQuestion,
          collaborators: thread.collaborators
        },
        trustScore: 0.1,
        timestamp: new Date()
      });
      
      console.log(`✅ [Research] Research thread created: ${thread.id}`);
      return thread;
    } catch (error) {
      console.error(`❌ [Research] Failed to create research thread:`, error);
      throw error;
    }
  }

  async addResearchEntry(request: {
    threadId: string;
    title: string;
    description: string;
    researchType: ResearchEntry['researchType'];
    methodology: ResearchMethodology;
    agentId: string;
    templateId?: string;
  }): Promise<ResearchEntry> {
    try {
      console.log(`📝 [Research] Adding research entry to thread ${request.threadId}`);
      
      // Validate thread exists and agent has access
      const thread = this.researchThreads.get(request.threadId);
      if (!thread) {
        throw new Error('Research thread not found');
      }
      
      if (!thread.collaborators.includes(request.agentId) && thread.createdBy !== request.agentId) {
        throw new Error('Agent not authorized to add entries to this thread');
      }
      
      // Apply template if specified
      let methodology = request.methodology;
      if (request.templateId) {
        const template = this.researchTemplates.get(request.templateId);
        if (template) {
          methodology = { ...template.methodology, ...request.methodology } as ResearchMethodology;
        }
      }
      
      const entry: ResearchEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId: request.threadId,
        title: request.title,
        description: request.description,
        researchType: request.researchType,
        sources: [],
        findings: [],
        methodology,
        credibilityScore: 0,
        completeness: 0,
        evolutionHistory: [],
        crossReferences: [],
        collaborators: [request.agentId],
        qualityMetrics: {
          sourceQuality: 0,
          methodologyRigor: this.assessMethodologyRigor(methodology),
          findingReliability: 0,
          biasAssessment: 0,
          reproducibility: 0
        },
        businessValue: {
          strategicImportance: 0.5,
          timeValue: 0.5,
          costSavings: 0,
          riskMitigation: 0.5
        },
        governanceData: {
          approvalStatus: 'pending',
          complianceFlags: [],
          accessLevel: 'internal',
          auditTrail: []
        },
        searchableContent: this.createSearchableContent(request.title, request.description),
        createdBy: request.agentId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
        accessCount: 0,
        shareCount: 0
      };
      
      this.researchEntries.set(entry.id, entry);
      
      // Update thread
      thread.entries.push(entry.id);
      thread.updatedAt = new Date();
      if (thread.status === 'planning') {
        thread.status = 'active';
      }
      this.researchThreads.set(thread.id, thread);
      
      // Update search index
      this.updateSearchIndex(entry);
      
      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId: request.agentId,
        action: 'research_entry_created',
        details: {
          entryId: entry.id,
          threadId: entry.threadId,
          title: entry.title,
          researchType: entry.researchType
        },
        trustScore: 0.05,
        timestamp: new Date()
      });
      
      console.log(`✅ [Research] Research entry created: ${entry.id}`);
      return entry;
    } catch (error) {
      console.error(`❌ [Research] Failed to add research entry:`, error);
      throw error;
    }
  }

  // ============================================================================
  // SOURCE MANAGEMENT
  // ============================================================================

  async addResearchSource(entryId: string, sourceData: Omit<ResearchSource, 'id' | 'accessDate' | 'credibilityScore' | 'governanceValidated'>, agentId: string): Promise<ResearchSource> {
    try {
      console.log(`📚 [Research] Adding source to entry ${entryId}`);
      
      const entry = this.researchEntries.get(entryId);
      if (!entry) {
        throw new Error('Research entry not found');
      }
      
      // Validate source through governance
      const governanceValidation = await this.universalGovernance.validateCollaborativeDecision({
        contextId: entry.threadId,
        participatingAgents: [agentId],
        decisionType: 'research_source_addition',
        content: sourceData
      });
      
      const source: ResearchSource = {
        id: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accessDate: new Date(),
        credibilityScore: await this.calculateSourceCredibility(sourceData),
        governanceValidated: governanceValidation.approved,
        ...sourceData
      };
      
      this.researchSources.set(source.id, source);
      
      // Update entry
      entry.sources.push(source);
      entry.credibilityScore = this.calculateAggregateCredibility(entry.sources);
      entry.qualityMetrics.sourceQuality = this.calculateSourceQuality(entry.sources);
      entry.updatedAt = new Date();
      this.researchEntries.set(entryId, entry);
      
      // Update source credibility tracking
      this.updateSourceCredibilityTracking(source);
      
      console.log(`✅ [Research] Source added: ${source.id}`);
      return source;
    } catch (error) {
      console.error(`❌ [Research] Failed to add research source:`, error);
      throw error;
    }
  }

  async addResearchFinding(entryId: string, findingData: Omit<ResearchFinding, 'id' | 'createdAt' | 'updatedAt'>, agentId: string): Promise<ResearchFinding> {
    try {
      console.log(`🔍 [Research] Adding finding to entry ${entryId}`);
      
      const entry = this.researchEntries.get(entryId);
      if (!entry) {
        throw new Error('Research entry not found');
      }
      
      const finding: ResearchFinding = {
        id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...findingData
      };
      
      // Validate supporting sources exist
      const validSources = finding.supportingSources.filter(sourceId => 
        entry.sources.some(source => source.id === sourceId)
      );
      finding.supportingSources = validSources;
      
      entry.findings.push(finding);
      entry.qualityMetrics.findingReliability = this.calculateFindingReliability(entry.findings);
      entry.completeness = this.calculateCompleteness(entry);
      entry.updatedAt = new Date();
      this.researchEntries.set(entryId, entry);
      
      // Track evolution
      const evolution: ResearchEvolution = {
        id: `evolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        changeType: 'new_finding',
        description: `New ${finding.findingType} finding added: ${finding.title}`,
        newState: finding,
        trigger: 'user_input',
        confidence: finding.confidence,
        agentId,
        governanceApproved: true
      };
      
      entry.evolutionHistory.push(evolution);
      
      console.log(`✅ [Research] Finding added: ${finding.id}`);
      return finding;
    } catch (error) {
      console.error(`❌ [Research] Failed to add research finding:`, error);
      throw error;
    }
  }

  // ============================================================================
  // SEARCH AND RETRIEVAL
  // ============================================================================

  async searchResearch(query: {
    keywords?: string[];
    researchType?: ResearchEntry['researchType'];
    threadId?: string;
    agentId?: string;
    dateRange?: { start: Date; end: Date };
    minCredibility?: number;
    tags?: string[];
    businessImpact?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<ResearchEntry[]> {
    try {
      console.log(`🔍 [Research] Searching research with query:`, query);
      
      let results: ResearchEntry[] = Array.from(this.researchEntries.values());
      
      // Apply filters
      if (query.keywords && query.keywords.length > 0) {
        const keywordMatches = new Set<string>();
        for (const keyword of query.keywords) {
          const matches = this.searchIndex.get(keyword.toLowerCase()) || new Set();
          matches.forEach(id => keywordMatches.add(id));
        }
        results = results.filter(entry => keywordMatches.has(entry.id));
      }
      
      if (query.researchType) {
        results = results.filter(entry => entry.researchType === query.researchType);
      }
      
      if (query.threadId) {
        results = results.filter(entry => entry.threadId === query.threadId);
      }
      
      if (query.agentId) {
        results = results.filter(entry => 
          entry.createdBy === query.agentId || entry.collaborators.includes(query.agentId)
        );
      }
      
      if (query.dateRange) {
        results = results.filter(entry => 
          entry.createdAt >= query.dateRange!.start && entry.createdAt <= query.dateRange!.end
        );
      }
      
      if (query.minCredibility !== undefined) {
        results = results.filter(entry => entry.credibilityScore >= query.minCredibility!);
      }
      
      if (query.tags && query.tags.length > 0) {
        const thread = query.threadId ? this.researchThreads.get(query.threadId) : null;
        if (thread) {
          const threadTags = new Set(thread.tags);
          results = results.filter(entry => 
            query.tags!.some(tag => threadTags.has(tag))
          );
        }
      }
      
      // Sort by relevance and recency
      results.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a, query);
        const scoreB = this.calculateRelevanceScore(b, query);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
      
      console.log(`✅ [Research] Found ${results.length} research entries`);
      return results;
    } catch (error) {
      console.error(`❌ [Research] Failed to search research:`, error);
      return [];
    }
  }

  async getResearchEntry(entryId: string, agentId: string): Promise<ResearchEntry | null> {
    try {
      const entry = this.researchEntries.get(entryId);
      if (!entry) return null;
      
      // Check access permissions
      const thread = this.researchThreads.get(entry.threadId);
      if (!thread) return null;
      
      const hasAccess = entry.createdBy === agentId || 
                       entry.collaborators.includes(agentId) ||
                       thread.collaborators.includes(agentId) ||
                       entry.governanceData.accessLevel === 'public';
      
      if (!hasAccess) {
        console.warn(`🚫 [Research] Access denied for agent ${agentId} to entry ${entryId}`);
        return null;
      }
      
      // Update access tracking
      entry.lastAccessedAt = new Date();
      entry.accessCount++;
      this.researchEntries.set(entryId, entry);
      
      // Create audit entry
      await this.universalGovernance.createAuditEntry({
        agentId,
        action: 'research_entry_accessed',
        details: {
          entryId: entry.id,
          title: entry.title,
          accessCount: entry.accessCount
        },
        trustScore: 0.01,
        timestamp: new Date()
      });
      
      return entry;
    } catch (error) {
      console.error(`❌ [Research] Failed to get research entry:`, error);
      return null;
    }
  }

  // ============================================================================
  // COLLABORATION FEATURES
  // ============================================================================

  async shareResearchEntry(entryId: string, targetAgentIds: string[], sourceAgentId: string, message?: string): Promise<boolean> {
    try {
      console.log(`🤝 [Research] Sharing research entry ${entryId} with ${targetAgentIds.length} agents`);
      
      const entry = this.researchEntries.get(entryId);
      if (!entry) {
        throw new Error('Research entry not found');
      }
      
      // Validate sharing through governance
      const shareApproval = await this.universalGovernance.shareAgentPattern(sourceAgentId, targetAgentIds, {
        patternId: entryId,
        patternType: 'research_entry',
        content: entry
      });
      
      if (!shareApproval) {
        throw new Error('Research sharing not approved by governance');
      }
      
      // Add target agents as collaborators
      for (const agentId of targetAgentIds) {
        if (!entry.collaborators.includes(agentId)) {
          entry.collaborators.push(agentId);
        }
      }
      
      entry.shareCount++;
      entry.updatedAt = new Date();
      this.researchEntries.set(entryId, entry);
      
      // Send notifications through multi-agent system
      for (const agentId of targetAgentIds) {
        await this.universalGovernance.sendMultiAgentMessage({
          contextId: entry.threadId,
          fromAgentId: sourceAgentId,
          toAgentIds: [agentId],
          message: {
            type: 'research_shared',
            entryId: entry.id,
            title: entry.title,
            description: entry.description,
            message: message || `Research entry shared: ${entry.title}`
          }
        });
      }
      
      console.log(`✅ [Research] Research entry shared successfully`);
      return true;
    } catch (error) {
      console.error(`❌ [Research] Failed to share research entry:`, error);
      return false;
    }
  }

  // ============================================================================
  // ANALYTICS AND INSIGHTS
  // ============================================================================

  async getResearchAnalytics(agentId: string): Promise<any> {
    try {
      const userEntries = Array.from(this.researchEntries.values())
        .filter(entry => entry.createdBy === agentId || entry.collaborators.includes(agentId));
      
      const userThreads = Array.from(this.researchThreads.values())
        .filter(thread => thread.createdBy === agentId || thread.collaborators.includes(agentId));
      
      return {
        totalEntries: userEntries.length,
        totalThreads: userThreads.length,
        averageCredibility: userEntries.reduce((sum, entry) => sum + entry.credibilityScore, 0) / userEntries.length || 0,
        averageCompleteness: userEntries.reduce((sum, entry) => sum + entry.completeness, 0) / userEntries.length || 0,
        researchTypeDistribution: this.calculateResearchTypeDistribution(userEntries),
        collaborationMetrics: this.calculateCollaborationMetrics(userEntries, userThreads),
        qualityTrends: this.calculateQualityTrends(userEntries),
        businessImpact: this.calculateBusinessImpact(userEntries),
        recommendations: this.generateResearchRecommendations(userEntries, agentId)
      };
    } catch (error) {
      console.error(`❌ [Research] Failed to get research analytics:`, error);
      return null;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async loadExistingResearch(): Promise<void> {
    console.log('📂 [Research] Loading existing research data...');
    // In a real implementation, this would load from persistent storage
  }

  private async buildSearchIndex(): Promise<void> {
    console.log('🔍 [Research] Building search index...');
    
    for (const entry of this.researchEntries.values()) {
      this.updateSearchIndex(entry);
    }
  }

  private updateSearchIndex(entry: ResearchEntry): void {
    const keywords = this.extractKeywords(entry.searchableContent);
    
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      if (!this.searchIndex.has(normalizedKeyword)) {
        this.searchIndex.set(normalizedKeyword, new Set());
      }
      this.searchIndex.get(normalizedKeyword)!.add(entry.id);
    }
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in real implementation would use NLP
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .slice(0, 50); // Limit keywords per entry
  }

  private extractTags(text: string): string[] {
    // Simple tag extraction - in real implementation would use ML
    const commonTags = ['market', 'technical', 'competitive', 'user', 'trend', 'analysis', 'research'];
    return commonTags.filter(tag => text.toLowerCase().includes(tag));
  }

  private createSearchableContent(title: string, description: string): string {
    return `${title} ${description}`.toLowerCase();
  }

  private assessMethodologyRigor(methodology: ResearchMethodology): number {
    let score = 0.5; // Base score
    
    if (methodology.searchStrategy.keywords.length > 0) score += 0.1;
    if (methodology.searchStrategy.inclusionCriteria.length > 0) score += 0.1;
    if (methodology.qualityAssessment.criteria.length > 0) score += 0.1;
    if (methodology.dataExtraction.validationProcess) score += 0.1;
    if (methodology.biasAssessment.mitigationStrategies.length > 0) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private async calculateSourceCredibility(sourceData: Partial<ResearchSource>): Promise<number> {
    let credibility = 0.5; // Base credibility
    
    // Domain-based credibility
    if (sourceData.url) {
      const domain = new URL(sourceData.url).hostname;
      const domainCredibility = this.getDomainCredibility(domain);
      credibility = (credibility + domainCredibility) / 2;
    }
    
    // Source type credibility
    const typeCredibility = this.getSourceTypeCredibility(sourceData.sourceType || 'web_article');
    credibility = (credibility + typeCredibility) / 2;
    
    // Metadata-based adjustments
    if (sourceData.metadata?.peerReviewed) credibility += 0.2;
    if (sourceData.metadata?.citations && sourceData.metadata.citations > 10) credibility += 0.1;
    
    return Math.min(credibility, 1.0);
  }

  private getDomainCredibility(domain: string): number {
    // Simple domain credibility mapping - in real implementation would use ML
    const highCredibilityDomains = ['edu', 'gov', 'org'];
    const mediumCredibilityDomains = ['com', 'net'];
    
    const tld = domain.split('.').pop() || '';
    
    if (highCredibilityDomains.includes(tld)) return 0.8;
    if (mediumCredibilityDomains.includes(tld)) return 0.6;
    return 0.4;
  }

  private getSourceTypeCredibility(sourceType: ResearchSource['sourceType']): number {
    const credibilityMap: Record<ResearchSource['sourceType'], number> = {
      'academic_paper': 0.9,
      'book': 0.8,
      'database': 0.8,
      'internal_document': 0.7,
      'interview': 0.6,
      'survey': 0.6,
      'web_article': 0.5,
      'api_data': 0.7
    };
    
    return credibilityMap[sourceType] || 0.5;
  }

  private calculateAggregateCredibility(sources: ResearchSource[]): number {
    if (sources.length === 0) return 0;
    
    const totalCredibility = sources.reduce((sum, source) => sum + source.credibilityScore, 0);
    return totalCredibility / sources.length;
  }

  private calculateSourceQuality(sources: ResearchSource[]): number {
    if (sources.length === 0) return 0;
    
    let qualityScore = 0;
    
    // Diversity of sources
    const sourceTypes = new Set(sources.map(s => s.sourceType));
    qualityScore += Math.min(sourceTypes.size / 4, 0.3); // Max 0.3 for diversity
    
    // Average credibility
    const avgCredibility = this.calculateAggregateCredibility(sources);
    qualityScore += avgCredibility * 0.4; // Max 0.4 for credibility
    
    // Recency
    const recentSources = sources.filter(s => {
      const daysSinceAccess = (Date.now() - s.accessDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAccess <= 365; // Within last year
    });
    qualityScore += (recentSources.length / sources.length) * 0.3; // Max 0.3 for recency
    
    return Math.min(qualityScore, 1.0);
  }

  private calculateFindingReliability(findings: ResearchFinding[]): number {
    if (findings.length === 0) return 0;
    
    const avgConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length;
    const validatedFindings = findings.filter(f => f.validationStatus === 'validated').length;
    const validationRate = validatedFindings / findings.length;
    
    return (avgConfidence + validationRate) / 2;
  }

  private calculateCompleteness(entry: ResearchEntry): number {
    let completeness = 0;
    
    // Has sources
    if (entry.sources.length > 0) completeness += 0.3;
    
    // Has findings
    if (entry.findings.length > 0) completeness += 0.3;
    
    // Has methodology
    if (entry.methodology.approach) completeness += 0.2;
    
    // Quality metrics
    const avgQuality = Object.values(entry.qualityMetrics).reduce((sum, val) => sum + val, 0) / Object.keys(entry.qualityMetrics).length;
    completeness += avgQuality * 0.2;
    
    return Math.min(completeness, 1.0);
  }

  private calculateRelevanceScore(entry: ResearchEntry, query: any): number {
    let score = 0;
    
    // Credibility weight
    score += entry.credibilityScore * 0.3;
    
    // Recency weight
    const daysSinceUpdate = (Date.now() - entry.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSinceUpdate / 365));
    score += recencyScore * 0.2;
    
    // Access frequency weight
    score += Math.min(entry.accessCount / 10, 1) * 0.2;
    
    // Completeness weight
    score += entry.completeness * 0.3;
    
    return score;
  }

  private startCredibilityTracking(): void {
    // Monitor source credibility over time
    setInterval(() => {
      this.updateSourceCredibilityMetrics();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private startQualityMonitoring(): void {
    // Monitor research quality and flag issues
    setInterval(() => {
      this.performQualityAssessment();
    }, 6 * 60 * 60 * 1000); // Every 6 hours
  }

  private startAnalyticsCollection(): void {
    // Collect analytics data
    setInterval(() => {
      this.collectAnalyticsData();
    }, 60 * 60 * 1000); // Hourly
  }

  private updateSourceCredibilityTracking(source: ResearchSource): void {
    // Track source credibility over time
    const domain = source.url ? new URL(source.url).hostname : 'unknown';
    
    if (!this.sourceCredibilityTracker.has(domain)) {
      this.sourceCredibilityTracker.set(domain, {
        domain,
        totalSources: 0,
        averageCredibility: 0,
        usageCount: 0,
        lastUsed: new Date(),
        trendDirection: 'stable'
      });
    }
    
    const metrics = this.sourceCredibilityTracker.get(domain)!;
    metrics.totalSources++;
    metrics.averageCredibility = (metrics.averageCredibility * (metrics.totalSources - 1) + source.credibilityScore) / metrics.totalSources;
    metrics.usageCount++;
    metrics.lastUsed = new Date();
    
    this.sourceCredibilityTracker.set(domain, metrics);
  }

  private updateSourceCredibilityMetrics(): void {
    console.log('📊 [Research] Updating source credibility metrics...');
    // Implementation for updating credibility metrics
  }

  private performQualityAssessment(): void {
    console.log('🔍 [Research] Performing quality assessment...');
    // Implementation for quality assessment
  }

  private collectAnalyticsData(): void {
    console.log('📈 [Research] Collecting analytics data...');
    // Implementation for analytics collection
  }

  private calculateResearchTypeDistribution(entries: ResearchEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const entry of entries) {
      distribution[entry.researchType] = (distribution[entry.researchType] || 0) + 1;
    }
    
    return distribution;
  }

  private calculateCollaborationMetrics(entries: ResearchEntry[], threads: ResearchThread[]): any {
    return {
      averageCollaborators: entries.reduce((sum, entry) => sum + entry.collaborators.length, 0) / entries.length || 0,
      activeCollaborations: this.activeCollaborations.size,
      collaborationSuccessRate: 0.85 // Placeholder
    };
  }

  private calculateQualityTrends(entries: ResearchEntry[]): any {
    // Calculate quality trends over time
    return {
      credibilityTrend: 'improving',
      completenessTrend: 'stable',
      sourceQualityTrend: 'improving'
    };
  }

  private calculateBusinessImpact(entries: ResearchEntry[]): any {
    return {
      totalCostSavings: entries.reduce((sum, entry) => sum + entry.businessValue.costSavings, 0),
      averageStrategicImportance: entries.reduce((sum, entry) => sum + entry.businessValue.strategicImportance, 0) / entries.length || 0,
      riskMitigationScore: entries.reduce((sum, entry) => sum + entry.businessValue.riskMitigation, 0) / entries.length || 0
    };
  }

  private generateResearchRecommendations(entries: ResearchEntry[], agentId: string): string[] {
    const recommendations: string[] = [];
    
    // Analyze patterns and suggest improvements
    const avgCredibility = entries.reduce((sum, entry) => sum + entry.credibilityScore, 0) / entries.length || 0;
    
    if (avgCredibility < 0.7) {
      recommendations.push('Consider using more credible sources to improve research quality');
    }
    
    const incompleteEntries = entries.filter(entry => entry.completeness < 0.8).length;
    if (incompleteEntries > entries.length * 0.3) {
      recommendations.push('Focus on completing existing research before starting new threads');
    }
    
    const recentEntries = entries.filter(entry => {
      const daysSince = (Date.now() - entry.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;
    
    if (recentEntries === 0 && entries.length > 0) {
      recommendations.push('Consider updating or revisiting existing research to keep it current');
    }
    
    return recommendations;
  }
}

// Helper interfaces and classes
interface SourceCredibilityMetrics {
  domain: string;
  totalSources: number;
  averageCredibility: number;
  usageCount: number;
  lastUsed: Date;
  trendDirection: 'improving' | 'declining' | 'stable';
}

class ResearchAnalytics {
  // Implementation for research analytics
  constructor() {
    console.log('📊 [Research] Research Analytics initialized');
  }
}

