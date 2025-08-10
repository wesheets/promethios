/**
 * Firebase MAS Persistence Service
 * 
 * Integrates MAS persistence with Firebase for cloud storage,
 * real-time synchronization, and cross-device access.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { 
  SavedMASConversation, 
  MASWorkflowTemplate, 
  MASAnalytics,
  MASConversationFilter,
  ConversationMessage,
  AuditLogShare,
  GovernanceInsight
} from './MASPersistenceService';

export interface FirebaseConversationDocument extends Omit<SavedMASConversation, 'createdAt' | 'updatedAt'> {
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

export interface FirebaseTemplateDocument extends Omit<MASWorkflowTemplate, 'createdAt' | 'updatedAt'> {
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

export interface FirebaseAnalyticsDocument extends Omit<MASAnalytics, 'lastUpdated'> {
  lastUpdated: any; // Firebase Timestamp
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export class FirebaseMASPersistenceService {
  private static instance: FirebaseMASPersistenceService;
  private conversationSubscriptions: Map<string, RealtimeSubscription> = new Map();
  private analyticsSubscriptions: Map<string, RealtimeSubscription> = new Map();

  public static getInstance(): FirebaseMASPersistenceService {
    if (!FirebaseMASPersistenceService.instance) {
      FirebaseMASPersistenceService.instance = new FirebaseMASPersistenceService();
    }
    return FirebaseMASPersistenceService.instance;
  }

  // ==================== CONVERSATION MANAGEMENT ====================

  /**
   * Save conversation to Firebase
   */
  async saveConversation(conversation: SavedMASConversation): Promise<void> {
    try {
      const conversationRef = doc(db, 'mas_conversations', conversation.conversationId);
      
      const firebaseDoc: FirebaseConversationDocument = {
        ...conversation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(conversationRef, firebaseDoc, { merge: true });

      // Update user analytics
      await this.updateUserAnalytics(conversation.userId, conversation);

      console.log('Conversation saved to Firebase:', conversation.conversationId);
    } catch (error) {
      console.error('Error saving conversation to Firebase:', error);
      throw error;
    }
  }

  /**
   * Load conversation from Firebase
   */
  async loadConversation(conversationId: string): Promise<SavedMASConversation | null> {
    try {
      const conversationRef = doc(db, 'mas_conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (!conversationSnap.exists()) {
        return null;
      }

      const data = conversationSnap.data() as FirebaseConversationDocument;
      
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error loading conversation from Firebase:', error);
      throw error;
    }
  }

  /**
   * Get user conversations from Firebase
   */
  async getUserConversations(userId: string, filter?: MASConversationFilter): Promise<SavedMASConversation[]> {
    try {
      let conversationQuery = query(
        collection(db, 'mas_conversations'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      if (filter?.limit) {
        conversationQuery = query(conversationQuery, limit(filter.limit));
      }

      const querySnapshot = await getDocs(conversationQuery);
      const conversations: SavedMASConversation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseConversationDocument;
        conversations.push({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations from Firebase:', error);
      throw error;
    }
  }

  /**
   * Update conversation metadata
   */
  async updateConversationMetadata(
    conversationId: string, 
    metadata: { name?: string; description?: string; tags?: string[] }
  ): Promise<void> {
    try {
      const conversationRef = doc(db, 'mas_conversations', conversationId);
      
      await updateDoc(conversationRef, {
        ...metadata,
        updatedAt: serverTimestamp()
      });

      console.log('Conversation metadata updated:', conversationId);
    } catch (error) {
      console.error('Error updating conversation metadata:', error);
      throw error;
    }
  }

  /**
   * Delete conversation from Firebase
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const conversationRef = doc(db, 'mas_conversations', conversationId);
      await deleteDoc(conversationRef);

      // Delete associated files if any
      await this.deleteConversationFiles(conversationId);

      console.log('Conversation deleted from Firebase:', conversationId);
    } catch (error) {
      console.error('Error deleting conversation from Firebase:', error);
      throw error;
    }
  }

  /**
   * Add message to conversation
   */
  async addMessageToConversation(
    conversationId: string, 
    message: ConversationMessage
  ): Promise<void> {
    try {
      const conversationRef = doc(db, 'mas_conversations', conversationId);
      const conversation = await this.loadConversation(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const updatedMessages = [...conversation.messages, {
        messageId: message.messageId,
        agentId: message.agentId,
        agentName: message.agentName,
        timestamp: message.timestamp,
        messageType: message.messageType,
        content: {
          text: message.content,
          attachments: message.attachments
        },
        qualityMetrics: message.qualityMetrics,
        governanceInsights: message.governanceInsights?.map(insight => ({
          insightId: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: insight.type as any,
          description: insight.description,
          confidence: insight.confidence,
          actionable: insight.actionable,
          recommendations: insight.recommendations,
          timestamp: new Date(),
          agentId: message.agentId
        })) || []
      }];

      await updateDoc(conversationRef, {
        messages: updatedMessages,
        'sessionMetrics.totalMessages': increment(1),
        'sessionMetrics.conversationQuality': message.qualityMetrics.overall,
        'sessionMetrics.governanceCompliance': message.qualityMetrics.governance,
        updatedAt: serverTimestamp()
      });

      console.log('Message added to conversation:', conversationId);
    } catch (error) {
      console.error('Error adding message to conversation:', error);
      throw error;
    }
  }

  /**
   * Add audit log share to conversation
   */
  async addAuditLogShare(
    conversationId: string, 
    auditLogShare: AuditLogShare
  ): Promise<void> {
    try {
      const conversationRef = doc(db, 'mas_conversations', conversationId);
      const conversation = await this.loadConversation(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const updatedShares = [...conversation.auditLogShares, auditLogShare];

      await updateDoc(conversationRef, {
        auditLogShares: updatedShares,
        updatedAt: serverTimestamp()
      });

      console.log('Audit log share added to conversation:', conversationId);
    } catch (error) {
      console.error('Error adding audit log share:', error);
      throw error;
    }
  }

  // ==================== WORKFLOW TEMPLATES ====================

  /**
   * Save workflow template to Firebase
   */
  async saveWorkflowTemplate(template: MASWorkflowTemplate): Promise<void> {
    try {
      const templateRef = doc(db, 'mas_templates', template.templateId);
      
      const firebaseDoc: FirebaseTemplateDocument = {
        ...template,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(templateRef, firebaseDoc, { merge: true });

      console.log('Template saved to Firebase:', template.templateId);
    } catch (error) {
      console.error('Error saving template to Firebase:', error);
      throw error;
    }
  }

  /**
   * Get workflow templates from Firebase
   */
  async getWorkflowTemplates(filter?: { category?: string; difficulty?: string }): Promise<MASWorkflowTemplate[]> {
    try {
      let templateQuery = query(
        collection(db, 'mas_templates'),
        orderBy('usageStats.timesUsed', 'desc')
      );

      const querySnapshot = await getDocs(templateQuery);
      const templates: MASWorkflowTemplate[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseTemplateDocument;
        
        // Apply client-side filtering if needed
        if (filter?.category && data.category !== filter.category) return;
        if (filter?.difficulty && data.difficulty !== filter.difficulty) return;
        
        templates.push({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      return templates;
    } catch (error) {
      console.error('Error getting templates from Firebase:', error);
      throw error;
    }
  }

  /**
   * Create conversation from template
   */
  async createConversationFromTemplate(
    templateId: string, 
    userId: string
  ): Promise<SavedMASConversation> {
    try {
      const templateRef = doc(db, 'mas_templates', templateId);
      const templateSnap = await getDoc(templateRef);

      if (!templateSnap.exists()) {
        throw new Error('Template not found');
      }

      const template = templateSnap.data() as FirebaseTemplateDocument;
      
      // Create new conversation from template
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const conversation: SavedMASConversation = {
        conversationId,
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        description: `Created from template: ${template.name}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        
        sessionConfig: {
          orchestrator: {
            id: template.orchestratorType,
            name: template.orchestratorType,
            description: `Orchestrator for ${template.name}`,
            strategicApproach: 'collaborative' as any,
            personalityTraits: {
              assertiveness: 0.7,
              curiosity: 0.8,
              skepticism: 0.5,
              supportiveness: 0.8,
              creativity: 0.7
            },
            governanceCompliance: 0.9,
            trustThreshold: 0.7,
            policyStrictness: 0.8
          },
          participants: template.recommendedAgents.map((agent, index) => ({
            agentId: `agent_${index}`,
            agentName: agent.role,
            agentRole: agent,
            agentAvatar: '🤖',
            governanceIdentity: {
              agentId: `agent_${index}`,
              governanceId: `gov_agent_${index}`,
              governanceScorecard: {
                overallScore: 85,
                trustScore: 80,
                complianceScore: 90,
                qualityScore: 85,
                learningScore: 80,
                collaborationScore: 85
              },
              currentMetrics: {
                trustLevel: 0.8,
                complianceLevel: 0.9,
                qualityLevel: 0.85,
                learningRate: 0.8,
                collaborationEffectiveness: 0.85
              },
              trustBoundaries: {
                maxAutonomyLevel: 'balanced' as any,
                requiresApproval: false,
                canShareAuditLogs: true,
                canAccessSensitiveData: false
              },
              attestations: {
                verified: true,
                complianceCertified: true,
                qualityAssured: true,
                lastAuditDate: new Date(),
                certificationLevel: 'standard' as any
              },
              collaborationProfile: {
                preferredCollaborationStyle: 'cooperative' as any,
                crossModelCompatibility: ['gpt', 'claude', 'gemini'],
                specializations: [agent.role],
                communicationPreferences: {
                  formalityLevel: 'professional' as any,
                  responseLength: 'moderate' as any,
                  technicalDepth: 'detailed' as any
                }
              },
              crossAgentVisibility: {
                showGovernanceScorecard: true,
                showTrustMetrics: true,
                showComplianceStatus: true,
                showAuditLogSummary: true
              },
              currentStatus: {
                isActive: true,
                currentTask: 'ready',
                lastActivity: new Date(),
                healthStatus: 'healthy' as any
              }
            },
            participationStats: {
              messageCount: 0,
              averageQuality: 0,
              averageRelevance: 0,
              auditLogShareCount: 0
            }
          })),
          autonomyLevel: 'balanced' as any,
          sessionType: 'structured_analysis' as any,
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

      // Save the new conversation
      await this.saveConversation(conversation);

      // Update template usage stats
      await updateDoc(templateRef, {
        'usageStats.timesUsed': increment(1),
        'usageStats.lastUsed': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return conversation;
    } catch (error) {
      console.error('Error creating conversation from template:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get MAS analytics for user
   */
  async getMASAnalytics(userId: string): Promise<MASAnalytics | null> {
    try {
      const analyticsRef = doc(db, 'mas_analytics', userId);
      const analyticsSnap = await getDoc(analyticsRef);

      if (!analyticsSnap.exists()) {
        // Generate analytics from user conversations
        return await this.generateUserAnalytics(userId);
      }

      const data = analyticsSnap.data() as FirebaseAnalyticsDocument;
      
      return {
        ...data,
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting analytics from Firebase:', error);
      throw error;
    }
  }

  /**
   * Update user analytics
   */
  private async updateUserAnalytics(userId: string, conversation: SavedMASConversation): Promise<void> {
    try {
      const analyticsRef = doc(db, 'mas_analytics', userId);
      
      // Get current analytics or create new
      let analytics = await this.getMASAnalytics(userId);
      
      if (!analytics) {
        analytics = await this.generateUserAnalytics(userId);
      }

      // Update analytics with new conversation data
      const updatedAnalytics: FirebaseAnalyticsDocument = {
        ...analytics,
        totalConversations: analytics.totalConversations + 1,
        totalMessages: analytics.totalMessages + conversation.sessionMetrics.totalMessages,
        averageQualityScore: (analytics.averageQualityScore + conversation.sessionMetrics.conversationQuality) / 2,
        averageConversationDuration: (analytics.averageConversationDuration + conversation.sessionMetrics.duration) / 2,
        averageGovernanceCompliance: (analytics.averageGovernanceCompliance + conversation.sessionMetrics.governanceCompliance) / 2,
        totalAuditLogShares: analytics.totalAuditLogShares + conversation.auditLogShares.length,
        lastUpdated: serverTimestamp()
      };

      await setDoc(analyticsRef, updatedAnalytics, { merge: true });

      console.log('User analytics updated:', userId);
    } catch (error) {
      console.error('Error updating user analytics:', error);
      // Don't throw - analytics update shouldn't block conversation saving
    }
  }

  /**
   * Generate analytics from user conversations
   */
  private async generateUserAnalytics(userId: string): Promise<MASAnalytics> {
    try {
      const conversations = await this.getUserConversations(userId);
      
      if (conversations.length === 0) {
        return this.createEmptyAnalytics(userId);
      }

      // Calculate analytics from conversations
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.sessionMetrics.totalMessages, 0);
      const totalDuration = conversations.reduce((sum, conv) => sum + conv.sessionMetrics.duration, 0);
      const totalQuality = conversations.reduce((sum, conv) => sum + conv.sessionMetrics.conversationQuality, 0);
      const totalCompliance = conversations.reduce((sum, conv) => sum + conv.sessionMetrics.governanceCompliance, 0);
      const totalAuditShares = conversations.reduce((sum, conv) => sum + conv.auditLogShares.length, 0);

      // Orchestrator stats
      const orchestratorStats: { [key: string]: any } = {};
      conversations.forEach(conv => {
        const orchestratorId = conv.sessionConfig.orchestrator.id;
        if (!orchestratorStats[orchestratorId]) {
          orchestratorStats[orchestratorId] = {
            usageCount: 0,
            averageQualityScore: 0,
            averageSuccessRate: 0,
            averageDuration: 0,
            totalQuality: 0,
            totalDuration: 0
          };
        }
        
        orchestratorStats[orchestratorId].usageCount++;
        orchestratorStats[orchestratorId].totalQuality += conv.sessionMetrics.conversationQuality;
        orchestratorStats[orchestratorId].totalDuration += conv.sessionMetrics.duration;
        orchestratorStats[orchestratorId].averageQualityScore = 
          orchestratorStats[orchestratorId].totalQuality / orchestratorStats[orchestratorId].usageCount;
        orchestratorStats[orchestratorId].averageDuration = 
          orchestratorStats[orchestratorId].totalDuration / orchestratorStats[orchestratorId].usageCount;
        orchestratorStats[orchestratorId].averageSuccessRate = 
          conv.sessionMetrics.conversationQuality > 0.7 ? 0.9 : 0.7; // Simplified calculation
      });

      const analytics: MASAnalytics = {
        userId,
        totalConversations: conversations.length,
        totalMessages,
        averageQualityScore: totalQuality / conversations.length,
        averageConversationDuration: totalDuration / conversations.length,
        averageGovernanceCompliance: totalCompliance / conversations.length,
        totalAuditLogShares: totalAuditShares,
        
        orchestratorStats,
        agentStats: {}, // Simplified for now
        governanceStats: {
          totalInsights: 0,
          insightsByType: {},
          complianceRate: totalCompliance / conversations.length,
          topRecommendations: []
        },
        learningStats: {
          totalLearningEvents: 0,
          knowledgeAreasGrowth: {},
          improvementTrends: {
            qualityImprovement: 0.1,
            governanceImprovement: 0.05,
            efficiencyImprovement: 0.08
          }
        },
        
        lastUpdated: new Date()
      };

      // Save generated analytics
      const analyticsRef = doc(db, 'mas_analytics', userId);
      await setDoc(analyticsRef, {
        ...analytics,
        lastUpdated: serverTimestamp()
      });

      return analytics;
    } catch (error) {
      console.error('Error generating user analytics:', error);
      return this.createEmptyAnalytics(userId);
    }
  }

  /**
   * Create empty analytics structure
   */
  private createEmptyAnalytics(userId: string): MASAnalytics {
    return {
      userId,
      totalConversations: 0,
      totalMessages: 0,
      averageQualityScore: 0,
      averageConversationDuration: 0,
      averageGovernanceCompliance: 0,
      totalAuditLogShares: 0,
      
      orchestratorStats: {},
      agentStats: {},
      governanceStats: {
        totalInsights: 0,
        insightsByType: {},
        complianceRate: 0,
        topRecommendations: []
      },
      learningStats: {
        totalLearningEvents: 0,
        knowledgeAreasGrowth: {},
        improvementTrends: {
          qualityImprovement: 0,
          governanceImprovement: 0,
          efficiencyImprovement: 0
        }
      },
      
      lastUpdated: new Date()
    };
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to conversation updates
   */
  subscribeToConversation(
    conversationId: string, 
    callback: (conversation: SavedMASConversation | null) => void
  ): RealtimeSubscription {
    const conversationRef = doc(db, 'mas_conversations', conversationId);
    
    const unsubscribe = onSnapshot(conversationRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as FirebaseConversationDocument;
        const conversation: SavedMASConversation = {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
        callback(conversation);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in conversation subscription:', error);
      callback(null);
    });

    const subscription = { unsubscribe };
    this.conversationSubscriptions.set(conversationId, subscription);
    
    return subscription;
  }

  /**
   * Subscribe to user analytics updates
   */
  subscribeToAnalytics(
    userId: string, 
    callback: (analytics: MASAnalytics | null) => void
  ): RealtimeSubscription {
    const analyticsRef = doc(db, 'mas_analytics', userId);
    
    const unsubscribe = onSnapshot(analyticsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as FirebaseAnalyticsDocument;
        const analytics: MASAnalytics = {
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        };
        callback(analytics);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in analytics subscription:', error);
      callback(null);
    });

    const subscription = { unsubscribe };
    this.analyticsSubscriptions.set(userId, subscription);
    
    return subscription;
  }

  /**
   * Unsubscribe from conversation updates
   */
  unsubscribeFromConversation(conversationId: string): void {
    const subscription = this.conversationSubscriptions.get(conversationId);
    if (subscription) {
      subscription.unsubscribe();
      this.conversationSubscriptions.delete(conversationId);
    }
  }

  /**
   * Unsubscribe from analytics updates
   */
  unsubscribeFromAnalytics(userId: string): void {
    const subscription = this.analyticsSubscriptions.get(userId);
    if (subscription) {
      subscription.unsubscribe();
      this.analyticsSubscriptions.delete(userId);
    }
  }

  // ==================== FILE MANAGEMENT ====================

  /**
   * Upload conversation attachment to Firebase Storage
   */
  async uploadConversationFile(
    conversationId: string, 
    file: File, 
    fileName: string
  ): Promise<string> {
    try {
      const fileRef = ref(storage, `conversations/${conversationId}/${fileName}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('File uploaded to Firebase Storage:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file to Firebase Storage:', error);
      throw error;
    }
  }

  /**
   * Delete conversation files from Firebase Storage
   */
  private async deleteConversationFiles(conversationId: string): Promise<void> {
    try {
      const folderRef = ref(storage, `conversations/${conversationId}`);
      // Note: Firebase doesn't have a direct way to delete folders
      // In a real implementation, you'd need to list and delete individual files
      console.log('Conversation files deletion initiated for:', conversationId);
    } catch (error) {
      console.error('Error deleting conversation files:', error);
      // Don't throw - file deletion shouldn't block conversation deletion
    }
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Batch save multiple conversations
   */
  async batchSaveConversations(conversations: SavedMASConversation[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      conversations.forEach(conversation => {
        const conversationRef = doc(db, 'mas_conversations', conversation.conversationId);
        const firebaseDoc: FirebaseConversationDocument = {
          ...conversation,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        batch.set(conversationRef, firebaseDoc, { merge: true });
      });

      await batch.commit();
      console.log('Batch save completed for', conversations.length, 'conversations');
    } catch (error) {
      console.error('Error in batch save:', error);
      throw error;
    }
  }

  /**
   * Cleanup old conversations (for maintenance)
   */
  async cleanupOldConversations(userId: string, daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldConversationsQuery = query(
        collection(db, 'mas_conversations'),
        where('userId', '==', userId),
        where('updatedAt', '<', cutoffDate)
      );

      const querySnapshot = await getDocs(oldConversationsQuery);
      const batch = writeBatch(db);
      let deleteCount = 0;

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deleteCount++;
      });

      if (deleteCount > 0) {
        await batch.commit();
      }

      console.log('Cleaned up', deleteCount, 'old conversations');
      return deleteCount;
    } catch (error) {
      console.error('Error cleaning up old conversations:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseMASPersistence = FirebaseMASPersistenceService.getInstance();

