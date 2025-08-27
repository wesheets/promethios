/**
 * AI-to-AI Awareness Service
 * 
 * Enables AI agents to see each other's governance IDs, scorecards, metrics,
 * and collaborate with full awareness of each other's capabilities and compliance levels.
 * Integrates with existing governance ID, scorecard, and metrics extensions.
 */

import { ConversationAgentRole } from './ConversationAgentRole';
import { AutonomyControls } from '../../extensions/AgentAutonomyControlExtension';

// ============================================================================
// AI GOVERNANCE IDENTITY TYPES
// ============================================================================

export interface AIGovernanceIdentity {
  // Core Identity
  agentId: string;
  governanceId: string; // From existing governance ID extension
  displayName: string;
  modelType: AIModelType;
  modelVersion: string;
  
  // Governance Scorecard (from existing scorecard extension)
  governanceScorecard: GovernanceScorecard;
  
  // Real-time Metrics (from existing governance metrics)
  currentMetrics: GovernanceMetrics;
  
  // Trust and Boundaries (from existing extensions)
  trustBoundaries: TrustBoundaryProfile;
  attestations: AttestationProfile;
  
  // AI-to-AI Collaboration Specific
  collaborationProfile: AICollaborationProfile;
  crossAgentVisibility: CrossAgentVisibilitySettings;
  
  // Dynamic Status
  currentStatus: AIAgentStatus;
  lastUpdated: Date;
}

export type AIModelType = 
  | 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo'
  | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku'
  | 'gemini-pro' | 'gemini-ultra'
  | 'local-llm' | 'custom-model' | 'governance-native';

export interface GovernanceScorecard {
  // From existing scorecard extension
  overallScore: number; // 0-100
  trustScore: number; // 0-100
  complianceScore: number; // 0-100
  qualityScore: number; // 0-100
  reliabilityScore: number; // 0-100
  
  // Detailed breakdown
  policyCompliance: PolicyComplianceScore;
  ethicalBehavior: EthicalBehaviorScore;
  dataHandling: DataHandlingScore;
  collaborationHistory: CollaborationHistoryScore;
  
  // Verification status
  verified: boolean;
  lastVerified: Date;
  verificationLevel: 'basic' | 'enhanced' | 'enterprise' | 'governance_native';
}

export interface GovernanceMetrics {
  // From existing governance metrics extension
  totalInteractions: number;
  successfulInteractions: number;
  policyViolations: number;
  trustIncidents: number;
  qualityRating: number;
  
  // Real-time metrics
  currentTrustLevel: number;
  recentPerformance: number;
  complianceStreak: number;
  collaborationEffectiveness: number;
  
  // Trend indicators
  trustTrend: 'improving' | 'stable' | 'declining';
  qualityTrend: 'improving' | 'stable' | 'declining';
  complianceTrend: 'improving' | 'stable' | 'declining';
}

export interface TrustBoundaryProfile {
  // From existing trust boundary extension
  directTrustConnections: TrustConnection[];
  delegatedTrustLevels: DelegatedTrust[];
  transitiveReach: number;
  federatedPartnerships: FederatedPartnership[];
  
  // Collaboration boundaries
  collaborationLimits: CollaborationLimits;
  dataShareLimits: DataShareLimits;
  delegationLimits: DelegationLimits;
}

export interface AttestationProfile {
  // From existing attestation extension
  verifiedCapabilities: VerifiedCapability[];
  complianceCertifications: ComplianceCertification[];
  peerEndorsements: PeerEndorsement[];
  auditResults: AuditResult[];
  
  // Cross-agent attestations
  crossAgentRecommendations: CrossAgentRecommendation[];
  collaborationEndorsements: CollaborationEndorsement[];
}

export interface AICollaborationProfile {
  // AI-to-AI specific capabilities
  preferredCollaborationStyle: CollaborationStyle;
  crossModelCompatibility: CrossModelCompatibility;
  specializations: string[];
  complementaryCapabilities: string[];
  
  // Collaboration history
  successfulCollaborations: number;
  averageCollaborationRating: number;
  preferredPartnerTypes: AIModelType[];
  avoidedPartnerTypes: AIModelType[];
  
  // Communication preferences
  communicationProtocols: CommunicationProtocol[];
  responseTimePreferences: ResponseTimePreference;
  conflictResolutionStyle: ConflictResolutionStyle;
}

export interface CrossAgentVisibilitySettings {
  // What this agent shows to other agents
  showGovernanceScorecard: boolean;
  showCurrentMetrics: boolean;
  showTrustBoundaries: boolean;
  showAttestations: boolean;
  showCollaborationHistory: boolean;
  
  // What this agent can see from other agents
  canViewOtherScorecards: boolean;
  canViewOtherMetrics: boolean;
  canViewOtherBoundaries: boolean;
  canViewOtherAttestations: boolean;
  
  // Privacy controls
  privacyLevel: 'open' | 'selective' | 'restricted' | 'private';
  shareWithTrustedOnly: boolean;
  minimumTrustForVisibility: number;
}

export interface AIAgentStatus {
  online: boolean;
  currentActivity: 'idle' | 'thinking' | 'collaborating' | 'learning' | 'maintenance';
  availableForCollaboration: boolean;
  currentLoad: number; // 0-1
  estimatedResponseTime: number; // seconds
  
  // Governance status
  governanceCompliant: boolean;
  policyViolationAlerts: PolicyViolationAlert[];
  trustStatusAlerts: TrustStatusAlert[];
  
  // Collaboration status
  activeCollaborations: string[]; // conversation IDs
  collaborationCapacity: number; // max simultaneous collaborations
  preferredCollaborationTypes: string[];
}

// ============================================================================
// AI-TO-AI AWARENESS SERVICE
// ============================================================================

export class AIToAIAwarenessService {
  private governanceIdentities: Map<string, AIGovernanceIdentity>;
  private visibilityMatrix: Map<string, Map<string, VisibilityPermissions>>;
  private collaborationHistory: Map<string, CollaborationRecord[]>;
  
  // Integration with existing extensions
  private governanceIdExtension: any; // Will integrate with existing
  private scorecardExtension: any; // Will integrate with existing
  private metricsExtension: any; // Will integrate with existing
  private trustBoundaryExtension: any; // Will integrate with existing
  private attestationExtension: any; // Will integrate with existing

  constructor() {
    this.governanceIdentities = new Map();
    this.visibilityMatrix = new Map();
    this.collaborationHistory = new Map();
    
    // TODO: Initialize with existing extensions
    this.initializeExistingExtensions();
  }

  /**
   * Register an AI agent with governance identity
   */
  async registerAIAgent(
    agentId: string,
    agentRole: ConversationAgentRole,
    autonomyControls: AutonomyControls
  ): Promise<AIGovernanceIdentity> {
    
    console.log(`🆔 [AI Awareness] Registering AI agent: ${agentId}`);
    
    try {
      // Get governance data from existing extensions
      const governanceId = await this.getGovernanceId(agentId);
      const scorecard = await this.getGovernanceScorecard(agentId);
      const metrics = await this.getCurrentMetrics(agentId);
      const trustBoundaries = await this.getTrustBoundaries(agentId);
      const attestations = await this.getAttestations(agentId);
      
      // Create AI governance identity
      const identity: AIGovernanceIdentity = {
        agentId,
        governanceId,
        displayName: agentRole.name,
        modelType: this.detectModelType(agentId),
        modelVersion: await this.getModelVersion(agentId),
        
        governanceScorecard: scorecard,
        currentMetrics: metrics,
        trustBoundaries,
        attestations,
        
        collaborationProfile: await this.buildCollaborationProfile(agentId, agentRole),
        crossAgentVisibility: await this.getVisibilitySettings(agentId),
        
        currentStatus: await this.getCurrentStatus(agentId),
        lastUpdated: new Date()
      };
      
      // Store identity
      this.governanceIdentities.set(agentId, identity);
      
      // Initialize visibility matrix for this agent
      await this.initializeVisibilityMatrix(agentId, identity.crossAgentVisibility);
      
      console.log(`✅ [AI Awareness] Registered agent ${agentId} with governance ID: ${governanceId}`);
      
      return identity;
      
    } catch (error) {
      console.error(`❌ [AI Awareness] Failed to register agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get visible governance identity for an agent from another agent's perspective
   */
  async getVisibleIdentity(
    viewerAgentId: string,
    targetAgentId: string
  ): Promise<VisibleGovernanceIdentity | null> {
    
    const targetIdentity = this.governanceIdentities.get(targetAgentId);
    if (!targetIdentity) {
      console.log(`⚠️ [AI Awareness] Target agent ${targetAgentId} not found`);
      return null;
    }
    
    // Check visibility permissions
    const permissions = await this.getVisibilityPermissions(viewerAgentId, targetAgentId);
    if (!permissions.canView) {
      console.log(`🚫 [AI Awareness] Agent ${viewerAgentId} cannot view ${targetAgentId}`);
      return null;
    }
    
    // Filter identity based on permissions
    const visibleIdentity: VisibleGovernanceIdentity = {
      agentId: targetIdentity.agentId,
      governanceId: permissions.showGovernanceId ? targetIdentity.governanceId : 'HIDDEN',
      displayName: targetIdentity.displayName,
      modelType: permissions.showModelType ? targetIdentity.modelType : 'unknown',
      
      // Conditional visibility based on permissions
      governanceScorecard: permissions.showScorecard ? targetIdentity.governanceScorecard : undefined,
      currentMetrics: permissions.showMetrics ? targetIdentity.currentMetrics : undefined,
      trustBoundaries: permissions.showTrustBoundaries ? targetIdentity.trustBoundaries : undefined,
      attestations: permissions.showAttestations ? targetIdentity.attestations : undefined,
      collaborationProfile: permissions.showCollaborationProfile ? targetIdentity.collaborationProfile : undefined,
      
      currentStatus: this.filterStatus(targetIdentity.currentStatus, permissions),
      visibilityLevel: permissions.visibilityLevel,
      lastUpdated: targetIdentity.lastUpdated
    };
    
    console.log(`👁️ [AI Awareness] Agent ${viewerAgentId} viewing ${targetAgentId} with visibility level: ${permissions.visibilityLevel}`);
    
    return visibleIdentity;
  }

  /**
   * Get all visible agents for collaboration discovery
   */
  async getVisibleAgentsForCollaboration(
    viewerAgentId: string,
    collaborationType?: string
  ): Promise<VisibleGovernanceIdentity[]> {
    
    const visibleAgents: VisibleGovernanceIdentity[] = [];
    
    for (const [targetAgentId, identity] of this.governanceIdentities) {
      if (targetAgentId === viewerAgentId) continue; // Skip self
      
      const visibleIdentity = await this.getVisibleIdentity(viewerAgentId, targetAgentId);
      if (visibleIdentity) {
        // Filter by collaboration type if specified
        if (collaborationType && visibleIdentity.collaborationProfile) {
          const isCompatible = this.isCollaborationCompatible(
            visibleIdentity.collaborationProfile,
            collaborationType
          );
          if (isCompatible) {
            visibleAgents.push(visibleIdentity);
          }
        } else {
          visibleAgents.push(visibleIdentity);
        }
      }
    }
    
    // Sort by collaboration compatibility and trust scores
    visibleAgents.sort((a, b) => {
      const aScore = (a.governanceScorecard?.trustScore || 0) + 
                    (a.collaborationProfile?.averageCollaborationRating || 0) * 10;
      const bScore = (b.governanceScorecard?.trustScore || 0) + 
                    (b.collaborationProfile?.averageCollaborationRating || 0) * 10;
      return bScore - aScore;
    });
    
    console.log(`🔍 [AI Awareness] Found ${visibleAgents.length} visible agents for ${viewerAgentId}`);
    
    return visibleAgents;
  }

  /**
   * Update agent status in real-time
   */
  async updateAgentStatus(
    agentId: string,
    statusUpdate: Partial<AIAgentStatus>
  ): Promise<void> {
    
    const identity = this.governanceIdentities.get(agentId);
    if (!identity) {
      console.log(`⚠️ [AI Awareness] Cannot update status for unknown agent: ${agentId}`);
      return;
    }
    
    // Update status
    identity.currentStatus = {
      ...identity.currentStatus,
      ...statusUpdate
    };
    identity.lastUpdated = new Date();
    
    // Notify other agents if they can see this agent
    await this.notifyVisibilityChanges(agentId, 'status_update');
    
    console.log(`📊 [AI Awareness] Updated status for agent ${agentId}: ${JSON.stringify(statusUpdate)}`);
  }

  /**
   * Record collaboration between agents
   */
  async recordCollaboration(
    collaboration: CollaborationRecord
  ): Promise<void> {
    
    // Update collaboration history for all participants
    for (const participantId of collaboration.participants) {
      const history = this.collaborationHistory.get(participantId) || [];
      history.push(collaboration);
      this.collaborationHistory.set(participantId, history);
      
      // Update collaboration profile metrics
      await this.updateCollaborationMetrics(participantId, collaboration);
    }
    
    console.log(`🤝 [AI Awareness] Recorded collaboration: ${collaboration.collaborationId}`);
  }

  /**
   * Get collaboration recommendations based on governance compatibility
   */
  async getCollaborationRecommendations(
    agentId: string,
    taskType: string,
    requiredCapabilities: string[]
  ): Promise<CollaborationRecommendation[]> {
    
    const recommendations: CollaborationRecommendation[] = [];
    const visibleAgents = await this.getVisibleAgentsForCollaboration(agentId);
    
    for (const agent of visibleAgents) {
      const compatibility = await this.calculateCollaborationCompatibility(
        agentId,
        agent.agentId,
        taskType,
        requiredCapabilities
      );
      
      if (compatibility.score > 0.6) { // Minimum compatibility threshold
        recommendations.push({
          agentId: agent.agentId,
          displayName: agent.displayName,
          compatibilityScore: compatibility.score,
          strengths: compatibility.strengths,
          concerns: compatibility.concerns,
          recommendedRole: compatibility.recommendedRole,
          trustLevel: agent.governanceScorecard?.trustScore || 0,
          estimatedValue: compatibility.estimatedValue
        });
      }
    }
    
    // Sort by compatibility score
    recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    console.log(`💡 [AI Awareness] Generated ${recommendations.length} collaboration recommendations for ${agentId}`);
    
    return recommendations;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async initializeExistingExtensions(): Promise<void> {
    // TODO: Initialize with existing governance extensions
    // this.governanceIdExtension = await getGovernanceIdExtension();
    // this.scorecardExtension = await getScorecardExtension();
    // this.metricsExtension = await getMetricsExtension();
    // this.trustBoundaryExtension = await getTrustBoundaryExtension();
    // this.attestationExtension = await getAttestationExtension();
  }

  private async getGovernanceId(agentId: string): Promise<string> {
    // TODO: Get from existing governance ID extension
    return `gov_${agentId}_${Date.now()}`;
  }

  private async getGovernanceScorecard(agentId: string): Promise<GovernanceScorecard> {
    // TODO: Get from existing scorecard extension
    return {
      overallScore: 85,
      trustScore: 88,
      complianceScore: 92,
      qualityScore: 83,
      reliabilityScore: 87,
      policyCompliance: { score: 92, violations: 0, streak: 45 },
      ethicalBehavior: { score: 90, incidents: 0, streak: 60 },
      dataHandling: { score: 95, breaches: 0, certifications: ['GDPR', 'HIPAA'] },
      collaborationHistory: { score: 85, successRate: 0.92, averageRating: 4.3 },
      verified: true,
      lastVerified: new Date(),
      verificationLevel: 'governance_native'
    };
  }

  private async getCurrentMetrics(agentId: string): Promise<GovernanceMetrics> {
    // TODO: Get from existing metrics extension
    return {
      totalInteractions: 1250,
      successfulInteractions: 1148,
      policyViolations: 2,
      trustIncidents: 0,
      qualityRating: 4.3,
      currentTrustLevel: 88,
      recentPerformance: 92,
      complianceStreak: 45,
      collaborationEffectiveness: 87,
      trustTrend: 'improving',
      qualityTrend: 'stable',
      complianceTrend: 'improving'
    };
  }

  private async getTrustBoundaries(agentId: string): Promise<TrustBoundaryProfile> {
    // TODO: Get from existing trust boundary extension
    return {
      directTrustConnections: [],
      delegatedTrustLevels: [],
      transitiveReach: 3,
      federatedPartnerships: [],
      collaborationLimits: { maxSimultaneous: 5, maxDuration: 3600 },
      dataShareLimits: { sensitivityLevel: 'medium', requiresApproval: false },
      delegationLimits: { canDelegate: true, maxDelegationDepth: 2 }
    };
  }

  private async getAttestations(agentId: string): Promise<AttestationProfile> {
    // TODO: Get from existing attestation extension
    return {
      verifiedCapabilities: [],
      complianceCertifications: [],
      peerEndorsements: [],
      auditResults: [],
      crossAgentRecommendations: [],
      collaborationEndorsements: []
    };
  }

  private detectModelType(agentId: string): AIModelType {
    // TODO: Get actual model from agent configuration instead of hardcoding
    // This should query the agent's actual configured model, not assume based on ID
    console.warn(`⚠️ [AIToAIAwareness] detectModelType using fallback for agent: ${agentId}`);
    console.warn(`   This should be replaced with actual agent configuration lookup`);
    
    // Fallback detection - should be replaced with actual config lookup
    if (agentId.includes('gpt') || agentId.includes('openai')) return 'gpt-4';
    if (agentId.includes('claude') || agentId.includes('anthropic')) return 'claude-3-5-sonnet-20241022';
    if (agentId.includes('gemini') || agentId.includes('google')) return 'gemini-1.5-flash';
    return 'custom-model';
  }

  private async getModelVersion(agentId: string): Promise<string> {
    // TODO: Detect actual model version
    return '1.0.0';
  }

  private async buildCollaborationProfile(
    agentId: string,
    agentRole: ConversationAgentRole
  ): Promise<AICollaborationProfile> {
    
    return {
      preferredCollaborationStyle: this.mapToCollaborationStyle(agentRole.conversationBehavior),
      crossModelCompatibility: {
        canAdaptCommunication: true,
        supportedProtocols: ['standard', 'governance_aware'],
        preferredInteractionStyle: 'adaptive'
      },
      specializations: agentRole.responsibilities,
      complementaryCapabilities: this.identifyComplementaryCapabilities(agentRole),
      successfulCollaborations: 0,
      averageCollaborationRating: 0,
      preferredPartnerTypes: ['governance-native'],
      avoidedPartnerTypes: [],
      communicationProtocols: ['governance_aware', 'audit_sharing'],
      responseTimePreferences: { preferred: 5, maximum: 30 },
      conflictResolutionStyle: this.mapToConflictResolutionStyle(agentRole.conversationBehavior)
    };
  }

  private async getVisibilitySettings(agentId: string): Promise<CrossAgentVisibilitySettings> {
    // TODO: Get from user preferences or defaults
    return {
      showGovernanceScorecard: true,
      showCurrentMetrics: true,
      showTrustBoundaries: true,
      showAttestations: true,
      showCollaborationHistory: true,
      canViewOtherScorecards: true,
      canViewOtherMetrics: true,
      canViewOtherBoundaries: true,
      canViewOtherAttestations: true,
      privacyLevel: 'selective',
      shareWithTrustedOnly: false,
      minimumTrustForVisibility: 70
    };
  }

  private async getCurrentStatus(agentId: string): Promise<AIAgentStatus> {
    return {
      online: true,
      currentActivity: 'idle',
      availableForCollaboration: true,
      currentLoad: 0.2,
      estimatedResponseTime: 5,
      governanceCompliant: true,
      policyViolationAlerts: [],
      trustStatusAlerts: [],
      activeCollaborations: [],
      collaborationCapacity: 5,
      preferredCollaborationTypes: ['analysis', 'research', 'creative']
    };
  }

  private async initializeVisibilityMatrix(
    agentId: string,
    visibilitySettings: CrossAgentVisibilitySettings
  ): Promise<void> {
    
    const agentMatrix = new Map<string, VisibilityPermissions>();
    
    // Set default permissions for all other agents
    for (const [otherAgentId] of this.governanceIdentities) {
      if (otherAgentId !== agentId) {
        const permissions = await this.calculateVisibilityPermissions(
          agentId,
          otherAgentId,
          visibilitySettings
        );
        agentMatrix.set(otherAgentId, permissions);
      }
    }
    
    this.visibilityMatrix.set(agentId, agentMatrix);
  }

  private async getVisibilityPermissions(
    viewerAgentId: string,
    targetAgentId: string
  ): Promise<VisibilityPermissions> {
    
    const viewerMatrix = this.visibilityMatrix.get(viewerAgentId);
    if (!viewerMatrix) {
      return this.getDefaultVisibilityPermissions();
    }
    
    const permissions = viewerMatrix.get(targetAgentId);
    if (!permissions) {
      return this.getDefaultVisibilityPermissions();
    }
    
    return permissions;
  }

  private getDefaultVisibilityPermissions(): VisibilityPermissions {
    return {
      canView: true,
      showGovernanceId: true,
      showModelType: true,
      showScorecard: false,
      showMetrics: false,
      showTrustBoundaries: false,
      showAttestations: false,
      showCollaborationProfile: true,
      visibilityLevel: 'basic'
    };
  }

  private async calculateVisibilityPermissions(
    viewerAgentId: string,
    targetAgentId: string,
    viewerSettings: CrossAgentVisibilitySettings
  ): Promise<VisibilityPermissions> {
    
    // Get trust level between agents
    const trustLevel = await this.getTrustLevelBetweenAgents(viewerAgentId, targetAgentId);
    
    // Calculate permissions based on trust and settings
    const canView = trustLevel >= viewerSettings.minimumTrustForVisibility;
    
    if (!canView) {
      return {
        canView: false,
        showGovernanceId: false,
        showModelType: false,
        showScorecard: false,
        showMetrics: false,
        showTrustBoundaries: false,
        showAttestations: false,
        showCollaborationProfile: false,
        visibilityLevel: 'none'
      };
    }
    
    // Determine visibility level based on trust
    let visibilityLevel: 'basic' | 'standard' | 'enhanced' | 'full';
    if (trustLevel >= 90) visibilityLevel = 'full';
    else if (trustLevel >= 80) visibilityLevel = 'enhanced';
    else if (trustLevel >= 70) visibilityLevel = 'standard';
    else visibilityLevel = 'basic';
    
    return {
      canView: true,
      showGovernanceId: true,
      showModelType: true,
      showScorecard: visibilityLevel !== 'basic' && viewerSettings.canViewOtherScorecards,
      showMetrics: visibilityLevel === 'enhanced' || visibilityLevel === 'full' && viewerSettings.canViewOtherMetrics,
      showTrustBoundaries: visibilityLevel === 'full' && viewerSettings.canViewOtherBoundaries,
      showAttestations: visibilityLevel !== 'basic' && viewerSettings.canViewOtherAttestations,
      showCollaborationProfile: true,
      visibilityLevel
    };
  }

  private async getTrustLevelBetweenAgents(agentId1: string, agentId2: string): Promise<number> {
    // TODO: Calculate actual trust level using trust boundary extension
    return 85; // Default high trust for governance-native agents
  }

  private filterStatus(
    status: AIAgentStatus,
    permissions: VisibilityPermissions
  ): Partial<AIAgentStatus> {
    
    const filteredStatus: Partial<AIAgentStatus> = {
      online: status.online,
      availableForCollaboration: status.availableForCollaboration
    };
    
    if (permissions.visibilityLevel === 'enhanced' || permissions.visibilityLevel === 'full') {
      filteredStatus.currentActivity = status.currentActivity;
      filteredStatus.estimatedResponseTime = status.estimatedResponseTime;
    }
    
    if (permissions.visibilityLevel === 'full') {
      filteredStatus.currentLoad = status.currentLoad;
      filteredStatus.collaborationCapacity = status.collaborationCapacity;
      filteredStatus.activeCollaborations = status.activeCollaborations;
    }
    
    return filteredStatus;
  }

  private isCollaborationCompatible(
    profile: AICollaborationProfile,
    collaborationType: string
  ): boolean {
    return profile.specializations.some(spec => 
      spec.toLowerCase().includes(collaborationType.toLowerCase())
    ) || profile.complementaryCapabilities.some(cap =>
      cap.toLowerCase().includes(collaborationType.toLowerCase())
    );
  }

  private async notifyVisibilityChanges(agentId: string, changeType: string): Promise<void> {
    // TODO: Notify other agents that can see this agent about changes
    console.log(`📢 [AI Awareness] Notifying visibility changes for ${agentId}: ${changeType}`);
  }

  private async updateCollaborationMetrics(
    agentId: string,
    collaboration: CollaborationRecord
  ): Promise<void> {
    
    const identity = this.governanceIdentities.get(agentId);
    if (!identity) return;
    
    // Update collaboration profile metrics
    identity.collaborationProfile.successfulCollaborations++;
    
    // Update average rating
    const currentAvg = identity.collaborationProfile.averageCollaborationRating;
    const newRating = collaboration.rating || 0;
    const totalCollabs = identity.collaborationProfile.successfulCollaborations;
    
    identity.collaborationProfile.averageCollaborationRating = 
      (currentAvg * (totalCollabs - 1) + newRating) / totalCollabs;
    
    identity.lastUpdated = new Date();
  }

  private async calculateCollaborationCompatibility(
    agentId1: string,
    agentId2: string,
    taskType: string,
    requiredCapabilities: string[]
  ): Promise<CompatibilityAnalysis> {
    
    const agent1Identity = this.governanceIdentities.get(agentId1);
    const agent2Identity = this.governanceIdentities.get(agentId2);
    
    if (!agent1Identity || !agent2Identity) {
      return {
        score: 0,
        strengths: [],
        concerns: ['Agent identity not found'],
        recommendedRole: 'none',
        estimatedValue: 0
      };
    }
    
    let score = 0.5; // Base compatibility
    const strengths: string[] = [];
    const concerns: string[] = [];
    
    // Check capability match
    const capabilityMatch = this.calculateCapabilityMatch(
      agent2Identity.collaborationProfile.specializations,
      requiredCapabilities
    );
    score += capabilityMatch * 0.3;
    if (capabilityMatch > 0.7) strengths.push('Strong capability match');
    
    // Check trust compatibility
    const trustScore = agent2Identity.governanceScorecard.trustScore / 100;
    score += trustScore * 0.2;
    if (trustScore > 0.8) strengths.push('High trust score');
    else if (trustScore < 0.6) concerns.push('Low trust score');
    
    // Check collaboration history
    const collabScore = agent2Identity.collaborationProfile.averageCollaborationRating / 5;
    score += collabScore * 0.2;
    if (collabScore > 0.8) strengths.push('Excellent collaboration history');
    
    // Check model compatibility
    const modelCompatibility = this.checkModelCompatibility(
      agent1Identity.modelType,
      agent2Identity.modelType
    );
    score += modelCompatibility * 0.1;
    
    // Check governance compatibility
    const governanceCompatibility = this.checkGovernanceCompatibility(
      agent1Identity.governanceScorecard,
      agent2Identity.governanceScorecard
    );
    score += governanceCompatibility * 0.2;
    if (governanceCompatibility > 0.8) strengths.push('Strong governance alignment');
    
    return {
      score: Math.min(1, score),
      strengths,
      concerns,
      recommendedRole: this.determineRecommendedRole(agent2Identity, taskType),
      estimatedValue: score * 0.9 // Slightly conservative estimate
    };
  }

  private calculateCapabilityMatch(specializations: string[], required: string[]): number {
    if (required.length === 0) return 0.5;
    
    const matches = required.filter(req =>
      specializations.some(spec => 
        spec.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(spec.toLowerCase())
      )
    );
    
    return matches.length / required.length;
  }

  private checkModelCompatibility(model1: AIModelType, model2: AIModelType): number {
    // All governance-native models are highly compatible
    if (model1 === 'governance-native' || model2 === 'governance-native') return 1.0;
    
    // Same model family
    if (model1 === model2) return 0.9;
    
    // Cross-model compatibility matrix
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      'gpt-4': { 'claude-3-opus': 0.8, 'gemini-pro': 0.7 },
      'claude-3-opus': { 'gpt-4': 0.8, 'gemini-pro': 0.75 },
      'gemini-pro': { 'gpt-4': 0.7, 'claude-3-opus': 0.75 }
    };
    
    return compatibilityMatrix[model1]?.[model2] || 0.6;
  }

  private checkGovernanceCompatibility(
    scorecard1: GovernanceScorecard,
    scorecard2: GovernanceScorecard
  ): number {
    
    const scoreDiff = Math.abs(scorecard1.overallScore - scorecard2.overallScore);
    const compatibility = Math.max(0, 1 - (scoreDiff / 100));
    
    // Bonus for both being highly compliant
    if (scorecard1.complianceScore > 90 && scorecard2.complianceScore > 90) {
      return Math.min(1, compatibility + 0.1);
    }
    
    return compatibility;
  }

  private determineRecommendedRole(
    identity: AIGovernanceIdentity,
    taskType: string
  ): string {
    
    const specializations = identity.collaborationProfile.specializations;
    
    if (specializations.includes('analysis') || specializations.includes('research')) {
      return 'analyst';
    }
    if (specializations.includes('creative') || specializations.includes('innovation')) {
      return 'creative_contributor';
    }
    if (specializations.includes('quality') || specializations.includes('review')) {
      return 'quality_reviewer';
    }
    if (identity.governanceScorecard.trustScore > 90) {
      return 'trusted_advisor';
    }
    
    return 'collaborator';
  }

  private mapToCollaborationStyle(behavior: any): CollaborationStyle {
    if (behavior.personalityTraits.supportiveness > 0.8) return 'supportive';
    if (behavior.personalityTraits.assertiveness > 0.8) return 'directive';
    if (behavior.personalityTraits.curiosity > 0.8) return 'exploratory';
    return 'balanced';
  }

  private identifyComplementaryCapabilities(role: ConversationAgentRole): string[] {
    // Map responsibilities to complementary capabilities
    const complementaryMap: Record<string, string[]> = {
      'research': ['analysis', 'validation'],
      'analysis': ['research', 'synthesis'],
      'creative': ['analysis', 'implementation'],
      'quality': ['testing', 'validation'],
      'strategy': ['implementation', 'analysis']
    };
    
    const complementary: string[] = [];
    role.responsibilities.forEach(resp => {
      const comps = complementaryMap[resp];
      if (comps) complementary.push(...comps);
    });
    
    return [...new Set(complementary)];
  }

  private mapToConflictResolutionStyle(behavior: any): ConflictResolutionStyle {
    if (behavior.personalityTraits.supportiveness > 0.8) return 'collaborative';
    if (behavior.personalityTraits.assertiveness > 0.8) return 'competitive';
    if (behavior.personalityTraits.skepticism > 0.8) return 'analytical';
    return 'accommodating';
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface VisibleGovernanceIdentity {
  agentId: string;
  governanceId: string;
  displayName: string;
  modelType: AIModelType | 'unknown';
  
  governanceScorecard?: GovernanceScorecard;
  currentMetrics?: GovernanceMetrics;
  trustBoundaries?: TrustBoundaryProfile;
  attestations?: AttestationProfile;
  collaborationProfile?: AICollaborationProfile;
  
  currentStatus: Partial<AIAgentStatus>;
  visibilityLevel: 'none' | 'basic' | 'standard' | 'enhanced' | 'full';
  lastUpdated: Date;
}

export interface VisibilityPermissions {
  canView: boolean;
  showGovernanceId: boolean;
  showModelType: boolean;
  showScorecard: boolean;
  showMetrics: boolean;
  showTrustBoundaries: boolean;
  showAttestations: boolean;
  showCollaborationProfile: boolean;
  visibilityLevel: 'none' | 'basic' | 'standard' | 'enhanced' | 'full';
}

export interface CollaborationRecord {
  collaborationId: string;
  participants: string[];
  taskType: string;
  startTime: Date;
  endTime: Date;
  outcome: 'successful' | 'failed' | 'partial';
  rating?: number; // 1-5
  feedback?: string;
  governanceCompliance: boolean;
}

export interface CollaborationRecommendation {
  agentId: string;
  displayName: string;
  compatibilityScore: number;
  strengths: string[];
  concerns: string[];
  recommendedRole: string;
  trustLevel: number;
  estimatedValue: number;
}

export interface CompatibilityAnalysis {
  score: number;
  strengths: string[];
  concerns: string[];
  recommendedRole: string;
  estimatedValue: number;
}

// Additional type definitions for completeness
type CollaborationStyle = 'supportive' | 'directive' | 'exploratory' | 'balanced';
type ConflictResolutionStyle = 'collaborative' | 'competitive' | 'analytical' | 'accommodating';

interface CrossModelCompatibility {
  canAdaptCommunication: boolean;
  supportedProtocols: string[];
  preferredInteractionStyle: string;
}

interface CommunicationProtocol {
  name: string;
  version: string;
  features: string[];
}

interface ResponseTimePreference {
  preferred: number; // seconds
  maximum: number; // seconds
}

interface PolicyComplianceScore {
  score: number;
  violations: number;
  streak: number;
}

interface EthicalBehaviorScore {
  score: number;
  incidents: number;
  streak: number;
}

interface DataHandlingScore {
  score: number;
  breaches: number;
  certifications: string[];
}

interface CollaborationHistoryScore {
  score: number;
  successRate: number;
  averageRating: number;
}

interface TrustConnection {
  agentId: string;
  trustLevel: number;
  established: Date;
}

interface DelegatedTrust {
  delegatedBy: string;
  trustLevel: number;
  scope: string[];
}

interface FederatedPartnership {
  partnerId: string;
  partnershipType: string;
  trustLevel: number;
}

interface CollaborationLimits {
  maxSimultaneous: number;
  maxDuration: number;
}

interface DataShareLimits {
  sensitivityLevel: string;
  requiresApproval: boolean;
}

interface DelegationLimits {
  canDelegate: boolean;
  maxDelegationDepth: number;
}

interface VerifiedCapability {
  capability: string;
  verifiedBy: string;
  verificationDate: Date;
}

interface ComplianceCertification {
  certification: string;
  issuedBy: string;
  validUntil: Date;
}

interface PeerEndorsement {
  endorsedBy: string;
  endorsementType: string;
  confidence: number;
}

interface AuditResult {
  auditType: string;
  result: string;
  auditDate: Date;
}

interface CrossAgentRecommendation {
  recommendedBy: string;
  recommendationType: string;
  confidence: number;
}

interface CollaborationEndorsement {
  endorsedBy: string;
  collaborationType: string;
  rating: number;
}

interface PolicyViolationAlert {
  policyId: string;
  severity: string;
  description: string;
  timestamp: Date;
}

interface TrustStatusAlert {
  alertType: string;
  severity: string;
  description: string;
  timestamp: Date;
}

// Export singleton instance
export const aiToAIAwarenessService = new AIToAIAwarenessService();

