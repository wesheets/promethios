/**
 * Multi-Agent System Persistence Service
 * 
 * Handles saving and loading of MAS conversations, workflows, and configurations.
 * Integrates with unified storage and Firebase for complete data persistence.
 */

import { 
  ConversationSession, 
  ConversationMessage, 
  ConversationFlowResponse 
} from '../conversation/NaturalConversationFlowService';
import { OrchestratorPersonality } from '../../extensions/OrchestratorExtension';
import { AutonomyControls } from '../../extensions/AgentAutonomyControlExtension';
import { AIGovernanceIdentity } from '../conversation/AIToAIAwarenessService';
import { FilteredAuditLogShare } from '../conversation/AuditLogSharingService';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SavedMASConversation {
  conversationId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  
  // Session Configuration
  sessionConfig: {
    orchestrator: OrchestratorPersonality;
    participants: SavedAgentParticipant[];
    autonomyLevel: string;
    sessionType: string;
    auditLogSharingEnabled: boolean;
  };
  
  // Conversation Data
  messages: SavedConversationMessage[];
  auditLogShares: SavedAuditLogShare[];
  governanceInsights: SavedGovernanceInsight[];
  
  // Metrics and Analytics
  sessionMetrics: {
    totalMessages: number;
    participationBalance: number;
    conversationQuality: number;
    governanceCompliance: number;
    learningValue: number;
    consensusLevel: number;
    duration: number; // in minutes
  };
  
  // Metadata
  tags: string[];
  isTemplate: boolean;
  isPublic: boolean;
  shareableLink?: string;
}

export interface SavedAgentParticipant {
  agentId: string;
  agentName: string;
  agentRole: string;
  agentAvatar: string;
  governanceIdentity: AIGovernanceIdentity;
  participationStats: {
    messageCount: number;
    averageQuality: number;
    averageRelevance: number;
    auditLogShareCount: number;
  };
}

export interface SavedConversationMessage {
  messageId: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
  messageType: string;
  content: {
    text: string;
    attachments?: string[];
  };
  qualityMetrics: {
    relevance: number;
    clarity: number;
    value: number;
    governance: number;
  };
  governanceInsights?: SavedGovernanceInsight[];
}

export interface SavedAuditLogShare {
  shareId: string;
  sharedBy: string;
  sharedWith: string[];
  timestamp: Date;
  trigger: string;
  relevanceScore: number;
  filteredReasoning: {
    keyReasoningSteps: string[];
    criticalPolicyConsiderations: string[];
    lessonsLearned: string[];
  };
  originalCryptographicHash: string;
  filteredContentHash: string;
  complianceValidation: {
    compliant: boolean;
    validatedPolicies: string[];
    recommendations: string[];
  };
}

export interface SavedGovernanceInsight {
  insightId: string;
  type: 'policy_compliance' | 'trust_building' | 'quality_improvement' | 'learning_opportunity';
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations?: string[];
  timestamp: Date;
  agentId: string;
}

export interface MASWorkflowTemplate {
  templateId: string;
  name: string;
  description: string;
  category: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Template Configuration
  orchestratorType: string;
  recommendedAgents: {
    role: string;
    capabilities: string[];
    minTrustScore: number;
    minComplianceScore: number;
  }[];
  autonomyLevel: string;
  sessionType: string;
  
  // Workflow Steps
  workflowSteps: WorkflowStep[];
  
  // Success Metrics
  expectedOutcomes: string[];
  successCriteria: {
    minQualityScore: number;
    minGovernanceCompliance: number;
    maxDuration: number; // in minutes
  };
  
  // Usage Statistics
  usageStats: {
    timesUsed: number;
    averageSuccessRate: number;
    averageQualityScore: number;
    averageDuration: number;
  };
  
  // Metadata
  tags: string[];
  isPublic: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
}

export interface WorkflowStep {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  expectedAgentActions: string[];
  successCriteria: string[];
  governanceCheckpoints: string[];
  estimatedDuration: number; // in minutes
}

export interface MASConversationFilter {
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  orchestratorType?: string;
  sessionType?: string;
  tags?: string[];
  minQualityScore?: number;
  minGovernanceCompliance?: number;
  isTemplate?: boolean;
  isPublic?: boolean;
}

export interface MASAnalytics {
  totalConversations: number;
  totalMessages: number;
  totalAuditLogShares: number;
  averageQualityScore: number;
  averageGovernanceCompliance: number;
  averageConversationDuration: number;
  
  // Orchestrator Performance
  orchestratorStats: {
    [orchestratorType: string]: {
      usageCount: number;
      averageQualityScore: number;
      averageSuccessRate: number;
      averageDuration: number;
    };
  };
  
  // Agent Performance
  agentStats: {
    [agentType: string]: {
      participationCount: number;
      averageQualityScore: number;
      averageRelevanceScore: number;
      auditLogShareCount: number;
    };
  };
  
  // Governance Insights
  governanceStats: {
    totalInsights: number;
    insightsByType: {
      [type: string]: number;
    };
    averageActionableRate: number;
    topRecommendations: string[];
  };
  
  // Learning Progress
  learningStats: {
    totalLearningValue: number;
    improvementTrends: {
      qualityImprovement: number;
      governanceImprovement: number;
      efficiencyImprovement: number;
    };
    knowledgeAreas: {
      [area: string]: {
        conversationCount: number;
        averageQuality: number;
        improvementRate: number;
      };
    };
  };
}

// ============================================================================
// MAS PERSISTENCE SERVICE
// ============================================================================

class MASPersistenceService {
  private storageKey = 'mas_conversations';
  private templatesKey = 'mas_workflow_templates';
  private analyticsKey = 'mas_analytics';
  
  // ============================================================================
  // CONVERSATION PERSISTENCE
  // ============================================================================
  
  /**
   * Save a MAS conversation
   */
  async saveConversation(conversation: SavedMASConversation): Promise<void> {
    try {
      // Save to local storage first (immediate)
      await this.saveToLocalStorage(conversation);
      
      // TODO: Save to unified storage and Firebase (persistent)
      // await this.saveToUnifiedStorage(conversation);
      // await this.saveToFirebase(conversation);
      
      console.log('✅ MAS conversation saved:', conversation.conversationId);
    } catch (error) {
      console.error('❌ Error saving MAS conversation:', error);
      throw error;
    }
  }
  
  /**
   * Load a specific MAS conversation
   */
  async loadConversation(conversationId: string): Promise<SavedMASConversation | null> {
    try {
      // Try local storage first
      const conversation = await this.loadFromLocalStorage(conversationId);
      if (conversation) {
        return conversation;
      }
      
      // TODO: Try unified storage and Firebase
      // const unifiedConversation = await this.loadFromUnifiedStorage(conversationId);
      // if (unifiedConversation) return unifiedConversation;
      
      // const firebaseConversation = await this.loadFromFirebase(conversationId);
      // return firebaseConversation;
      
      return null;
    } catch (error) {
      console.error('❌ Error loading MAS conversation:', error);
      return null;
    }
  }
  
  /**
   * Get all conversations for a user
   */
  async getUserConversations(
    userId: string, 
    filter?: MASConversationFilter
  ): Promise<SavedMASConversation[]> {
    try {
      // Get from local storage
      const conversations = await this.getAllFromLocalStorage();
      
      // Filter by user
      let userConversations = conversations.filter(conv => conv.userId === userId);
      
      // Apply additional filters
      if (filter) {
        userConversations = this.applyFilters(userConversations, filter);
      }
      
      // Sort by most recent first
      userConversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      return userConversations;
    } catch (error) {
      console.error('❌ Error getting user conversations:', error);
      return [];
    }
  }
  
  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Delete from local storage
      await this.deleteFromLocalStorage(conversationId);
      
      // TODO: Delete from unified storage and Firebase
      // await this.deleteFromUnifiedStorage(conversationId);
      // await this.deleteFromFirebase(conversationId);
      
      console.log('✅ MAS conversation deleted:', conversationId);
    } catch (error) {
      console.error('❌ Error deleting MAS conversation:', error);
      throw error;
    }
  }
  
  /**
   * Update conversation metadata (name, description, tags)
   */
  async updateConversationMetadata(
    conversationId: string, 
    updates: Partial<Pick<SavedMASConversation, 'name' | 'description' | 'tags' | 'isTemplate' | 'isPublic'>>
  ): Promise<void> {
    try {
      const conversation = await this.loadConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      // Apply updates
      const updatedConversation: SavedMASConversation = {
        ...conversation,
        ...updates,
        updatedAt: new Date()
      };
      
      await this.saveConversation(updatedConversation);
      console.log('✅ Conversation metadata updated:', conversationId);
    } catch (error) {
      console.error('❌ Error updating conversation metadata:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // WORKFLOW TEMPLATE PERSISTENCE
  // ============================================================================
  
  /**
   * Save a workflow template
   */
  async saveWorkflowTemplate(template: MASWorkflowTemplate): Promise<void> {
    try {
      const templates = await this.getWorkflowTemplates();
      const existingIndex = templates.findIndex(t => t.templateId === template.templateId);
      
      if (existingIndex >= 0) {
        templates[existingIndex] = { ...template, updatedAt: new Date() };
      } else {
        templates.push(template);
      }
      
      localStorage.setItem(this.templatesKey, JSON.stringify(templates));
      console.log('✅ Workflow template saved:', template.templateId);
    } catch (error) {
      console.error('❌ Error saving workflow template:', error);
      throw error;
    }
  }
  
  /**
   * Get all workflow templates
   */
  async getWorkflowTemplates(category?: string): Promise<MASWorkflowTemplate[]> {
    try {
      const stored = localStorage.getItem(this.templatesKey);
      let templates: MASWorkflowTemplate[] = stored ? JSON.parse(stored) : [];
      
      // Convert date strings back to Date objects
      templates = templates.map(template => ({
        ...template,
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt)
      }));
      
      // Filter by category if specified
      if (category) {
        templates = templates.filter(template => template.category === category);
      }
      
      // Sort by usage stats and creation date
      templates.sort((a, b) => {
        // First by usage count (more used = higher priority)
        if (a.usageStats.timesUsed !== b.usageStats.timesUsed) {
          return b.usageStats.timesUsed - a.usageStats.timesUsed;
        }
        // Then by creation date (newer = higher priority)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      return templates;
    } catch (error) {
      console.error('❌ Error getting workflow templates:', error);
      return [];
    }
  }
  
  /**
   * Create conversation from template
   */
  async createConversationFromTemplate(
    templateId: string, 
    userId: string,
    customizations?: {
      name?: string;
      description?: string;
      selectedAgents?: string[];
      autonomyLevel?: string;
    }
  ): Promise<SavedMASConversation> {
    try {
      const templates = await this.getWorkflowTemplates();
      const template = templates.find(t => t.templateId === templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Create conversation from template
      const conversation: SavedMASConversation = {
        conversationId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: customizations?.name || `${template.name} - ${new Date().toLocaleDateString()}`,
        description: customizations?.description || template.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        
        sessionConfig: {
          orchestrator: {
            id: template.orchestratorType,
            name: template.orchestratorType,
            description: '',
            icon: '🎭',
            color: '#3182ce',
            approach: 'collaborative',
            strengths: [],
            bestFor: [],
            successRate: 0.9,
            satisfactionScore: 8.5
          },
          participants: [], // Will be populated when agents are selected
          autonomyLevel: customizations?.autonomyLevel || template.autonomyLevel,
          sessionType: template.sessionType,
          auditLogSharingEnabled: true
        },
        
        messages: [],
        auditLogShares: [],
        governanceInsights: [],
        
        sessionMetrics: {
          totalMessages: 0,
          participationBalance: 1.0,
          conversationQuality: 0.0,
          governanceCompliance: 1.0,
          learningValue: 0.0,
          consensusLevel: 0.0,
          duration: 0
        },
        
        tags: [...template.tags, 'from-template'],
        isTemplate: false,
        isPublic: false
      };
      
      // Update template usage stats
      template.usageStats.timesUsed += 1;
      await this.saveWorkflowTemplate(template);
      
      return conversation;
    } catch (error) {
      console.error('❌ Error creating conversation from template:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // ANALYTICS AND INSIGHTS
  // ============================================================================
  
  /**
   * Get MAS analytics for a user
   */
  async getMASAnalytics(userId: string): Promise<MASAnalytics> {
    try {
      const conversations = await this.getUserConversations(userId);
      
      // Calculate analytics
      const analytics: MASAnalytics = {
        totalConversations: conversations.length,
        totalMessages: conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
        totalAuditLogShares: conversations.reduce((sum, conv) => sum + conv.auditLogShares.length, 0),
        averageQualityScore: this.calculateAverageQuality(conversations),
        averageGovernanceCompliance: this.calculateAverageGovernance(conversations),
        averageConversationDuration: this.calculateAverageDuration(conversations),
        
        orchestratorStats: this.calculateOrchestratorStats(conversations),
        agentStats: this.calculateAgentStats(conversations),
        governanceStats: this.calculateGovernanceStats(conversations),
        learningStats: this.calculateLearningStats(conversations)
      };
      
      return analytics;
    } catch (error) {
      console.error('❌ Error getting MAS analytics:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  private async saveToLocalStorage(conversation: SavedMASConversation): Promise<void> {
    const conversations = await this.getAllFromLocalStorage();
    const existingIndex = conversations.findIndex(c => c.conversationId === conversation.conversationId);
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(conversations));
  }
  
  private async loadFromLocalStorage(conversationId: string): Promise<SavedMASConversation | null> {
    const conversations = await this.getAllFromLocalStorage();
    const conversation = conversations.find(c => c.conversationId === conversationId);
    return conversation || null;
  }
  
  private async getAllFromLocalStorage(): Promise<SavedMASConversation[]> {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];
    
    const conversations = JSON.parse(stored);
    
    // Convert date strings back to Date objects
    return conversations.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })),
      auditLogShares: conv.auditLogShares.map((share: any) => ({
        ...share,
        timestamp: new Date(share.timestamp)
      })),
      governanceInsights: conv.governanceInsights.map((insight: any) => ({
        ...insight,
        timestamp: new Date(insight.timestamp)
      }))
    }));
  }
  
  private async deleteFromLocalStorage(conversationId: string): Promise<void> {
    const conversations = await this.getAllFromLocalStorage();
    const filtered = conversations.filter(c => c.conversationId !== conversationId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }
  
  private applyFilters(
    conversations: SavedMASConversation[], 
    filter: MASConversationFilter
  ): SavedMASConversation[] {
    return conversations.filter(conv => {
      // Date range filter
      if (filter.dateRange) {
        const convDate = conv.createdAt;
        if (convDate < filter.dateRange.start || convDate > filter.dateRange.end) {
          return false;
        }
      }
      
      // Orchestrator type filter
      if (filter.orchestratorType && conv.sessionConfig.orchestrator.id !== filter.orchestratorType) {
        return false;
      }
      
      // Session type filter
      if (filter.sessionType && conv.sessionConfig.sessionType !== filter.sessionType) {
        return false;
      }
      
      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => conv.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      // Quality score filter
      if (filter.minQualityScore && conv.sessionMetrics.conversationQuality < filter.minQualityScore) {
        return false;
      }
      
      // Governance compliance filter
      if (filter.minGovernanceCompliance && conv.sessionMetrics.governanceCompliance < filter.minGovernanceCompliance) {
        return false;
      }
      
      // Template filter
      if (filter.isTemplate !== undefined && conv.isTemplate !== filter.isTemplate) {
        return false;
      }
      
      // Public filter
      if (filter.isPublic !== undefined && conv.isPublic !== filter.isPublic) {
        return false;
      }
      
      return true;
    });
  }
  
  private calculateAverageQuality(conversations: SavedMASConversation[]): number {
    if (conversations.length === 0) return 0;
    const sum = conversations.reduce((acc, conv) => acc + conv.sessionMetrics.conversationQuality, 0);
    return sum / conversations.length;
  }
  
  private calculateAverageGovernance(conversations: SavedMASConversation[]): number {
    if (conversations.length === 0) return 0;
    const sum = conversations.reduce((acc, conv) => acc + conv.sessionMetrics.governanceCompliance, 0);
    return sum / conversations.length;
  }
  
  private calculateAverageDuration(conversations: SavedMASConversation[]): number {
    if (conversations.length === 0) return 0;
    const sum = conversations.reduce((acc, conv) => acc + conv.sessionMetrics.duration, 0);
    return sum / conversations.length;
  }
  
  private calculateOrchestratorStats(conversations: SavedMASConversation[]): any {
    const stats: any = {};
    
    conversations.forEach(conv => {
      const orchestratorType = conv.sessionConfig.orchestrator.id;
      if (!stats[orchestratorType]) {
        stats[orchestratorType] = {
          usageCount: 0,
          averageQualityScore: 0,
          averageSuccessRate: 0,
          averageDuration: 0,
          totalQuality: 0,
          totalDuration: 0
        };
      }
      
      stats[orchestratorType].usageCount += 1;
      stats[orchestratorType].totalQuality += conv.sessionMetrics.conversationQuality;
      stats[orchestratorType].totalDuration += conv.sessionMetrics.duration;
    });
    
    // Calculate averages
    Object.keys(stats).forEach(orchestratorType => {
      const stat = stats[orchestratorType];
      stat.averageQualityScore = stat.totalQuality / stat.usageCount;
      stat.averageDuration = stat.totalDuration / stat.usageCount;
      stat.averageSuccessRate = stat.averageQualityScore; // Simplified for now
      
      // Clean up temporary fields
      delete stat.totalQuality;
      delete stat.totalDuration;
    });
    
    return stats;
  }
  
  private calculateAgentStats(conversations: SavedMASConversation[]): any {
    const stats: any = {};
    
    conversations.forEach(conv => {
      conv.sessionConfig.participants.forEach(participant => {
        const agentType = participant.agentRole;
        if (!stats[agentType]) {
          stats[agentType] = {
            participationCount: 0,
            averageQualityScore: 0,
            averageRelevanceScore: 0,
            auditLogShareCount: 0,
            totalQuality: 0,
            totalRelevance: 0
          };
        }
        
        stats[agentType].participationCount += 1;
        stats[agentType].totalQuality += participant.participationStats.averageQuality;
        stats[agentType].totalRelevance += participant.participationStats.averageRelevance;
        stats[agentType].auditLogShareCount += participant.participationStats.auditLogShareCount;
      });
    });
    
    // Calculate averages
    Object.keys(stats).forEach(agentType => {
      const stat = stats[agentType];
      stat.averageQualityScore = stat.totalQuality / stat.participationCount;
      stat.averageRelevanceScore = stat.totalRelevance / stat.participationCount;
      
      // Clean up temporary fields
      delete stat.totalQuality;
      delete stat.totalRelevance;
    });
    
    return stats;
  }
  
  private calculateGovernanceStats(conversations: SavedMASConversation[]): any {
    const allInsights = conversations.flatMap(conv => conv.governanceInsights);
    
    const insightsByType: any = {};
    let actionableCount = 0;
    const recommendations: string[] = [];
    
    allInsights.forEach(insight => {
      // Count by type
      if (!insightsByType[insight.type]) {
        insightsByType[insight.type] = 0;
      }
      insightsByType[insight.type] += 1;
      
      // Count actionable insights
      if (insight.actionable) {
        actionableCount += 1;
      }
      
      // Collect recommendations
      if (insight.recommendations) {
        recommendations.push(...insight.recommendations);
      }
    });
    
    // Get top recommendations (most frequent)
    const recommendationCounts: any = {};
    recommendations.forEach(rec => {
      recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
    });
    
    const topRecommendations = Object.entries(recommendationCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([rec]) => rec);
    
    return {
      totalInsights: allInsights.length,
      insightsByType,
      averageActionableRate: allInsights.length > 0 ? actionableCount / allInsights.length : 0,
      topRecommendations
    };
  }
  
  private calculateLearningStats(conversations: SavedMASConversation[]): any {
    const totalLearningValue = conversations.reduce((sum, conv) => sum + conv.sessionMetrics.learningValue, 0);
    
    // Calculate improvement trends (simplified - would need historical data for real trends)
    const averageQuality = this.calculateAverageQuality(conversations);
    const averageGovernance = this.calculateAverageGovernance(conversations);
    const averageDuration = this.calculateAverageDuration(conversations);
    
    // Group conversations by knowledge areas (based on tags)
    const knowledgeAreas: any = {};
    conversations.forEach(conv => {
      conv.tags.forEach(tag => {
        if (!knowledgeAreas[tag]) {
          knowledgeAreas[tag] = {
            conversationCount: 0,
            totalQuality: 0,
            averageQuality: 0,
            improvementRate: 0 // Would need historical data
          };
        }
        
        knowledgeAreas[tag].conversationCount += 1;
        knowledgeAreas[tag].totalQuality += conv.sessionMetrics.conversationQuality;
      });
    });
    
    // Calculate averages for knowledge areas
    Object.keys(knowledgeAreas).forEach(area => {
      const areaStats = knowledgeAreas[area];
      areaStats.averageQuality = areaStats.totalQuality / areaStats.conversationCount;
      delete areaStats.totalQuality;
    });
    
    return {
      totalLearningValue,
      improvementTrends: {
        qualityImprovement: 0.05, // Placeholder - would calculate from historical data
        governanceImprovement: 0.03,
        efficiencyImprovement: 0.02
      },
      knowledgeAreas
    };
  }
}

// Export singleton instance
export const masPersistenceService = new MASPersistenceService();
export default masPersistenceService;

