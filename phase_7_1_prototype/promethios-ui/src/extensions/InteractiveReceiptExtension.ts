/**
 * Interactive Receipt Extension for Promethios
 * 
 * Transforms static receipts into interactive conversation starters that enable
 * users to click receipts and populate chat context with full audit trail,
 * cognitive context, and actionable suggestions.
 * 
 * This extension enables the revolutionary "receipt-to-chat" workflow where
 * users can click any receipt to reconstruct the full context and continue
 * the conversation from that point.
 * 
 * Features:
 * - Clickable receipts that populate chat interface
 * - Full context reconstruction from audit logs
 * - Multi-receipt selection for complex workflows
 * - Proactive suggestions based on receipt patterns
 * - Cross-session memory integration
 * 
 * Integration:
 * - Extends ComprehensiveToolReceiptExtension
 * - Integrates with AuditLogAccessExtension for cognitive context
 * - Uses RecursiveMemoryExtension for workflow reconstruction
 * - Maintains backward compatibility with existing receipt system
 */

import { Extension } from './Extension';
import { ComprehensiveToolReceiptExtension, EnhancedToolReceipt } from './ComprehensiveToolReceiptExtension';
import { AuditLogAccessExtension, AuditLogEntry } from './AuditLogAccessExtension';
import { RecursiveMemoryExtension, MemoryContext, AgentWorkflow } from './RecursiveMemoryExtension';
import { PredictiveGovernanceExtension } from './PredictiveGovernanceExtension';

// Interactive receipt context interfaces
export interface InteractiveReceiptContext {
  // Core receipt data
  receipt: EnhancedToolReceipt;
  
  // Cognitive context from audit logs
  cognitiveContext: {
    originalPrompt: string;
    declaredIntent: string;
    agentThinking: {
      alternativesConsidered: string[];
      confidenceLevel: number;
      uncertaintyRating: number;
      emotionalState: any;
      assumptionsMade: string[];
    };
    decisionProcess: {
      chosenPlan: string;
      cognitiveLoad: number;
      attentionFocus: string[];
      knowledgeGaps: string[];
    };
  };
  
  // Workflow and business context
  workflowContext: {
    workflowId?: string;
    currentStep: number;
    relatedReceipts: string[];
    businessObjective: string;
    workflowProgress: number;
    nextSuggestedSteps: string[];
  };
  
  // Verification and trust data
  verificationData: {
    checksum: string;
    integrityProof: string;
    apiTraceUrl?: string;
    complianceStatus: string;
    trustScore: number;
    governanceAlerts: string[];
  };
  
  // Interactive capabilities
  interactionMetadata: {
    clickCount: number;
    lastAccessed: Date;
    userAnnotations: string[];
    conversationReferences: string[];
    userFeedback: UserReceiptFeedback[];
  };
}

export interface UserReceiptFeedback {
  feedbackId: string;
  timestamp: Date;
  feedbackType: 'success' | 'improvement' | 'error' | 'suggestion';
  message: string;
  rating: number; // 1-5 scale
  suggestedAlternative?: string;
}

export interface ReceiptChatContext {
  // Context for populating chat interface
  contextType: 'single_receipt' | 'multi_receipt' | 'workflow_thread';
  
  // Chat message to populate
  chatMessage: {
    content: string;
    metadata: {
      receiptIds: string[];
      contextSummary: string;
      suggestedQuestions: string[];
      actionButtons: ReceiptActionButton[];
    };
  };
  
  // Agent response context
  agentContext: {
    fullContext: InteractiveReceiptContext[];
    responseGuidance: string;
    suggestedActions: string[];
    relatedPatterns: string[];
  };
}

export interface ReceiptActionButton {
  id: string;
  label: string;
  action: 'explain' | 'retry' | 'continue' | 'compare' | 'template' | 'audit';
  description: string;
  requiresConfirmation: boolean;
}

export interface ReceiptInteractionEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  agentId: string;
  sessionId: string;
  interactionType: 'click' | 'multi_select' | 'context_menu' | 'chat_populate';
  receiptIds: string[];
  resultingAction: string;
  userSatisfaction?: number;
}

/**
 * Interactive Receipt Extension
 * Enables clickable receipts that populate chat context with full audit trail
 */
export class InteractiveReceiptExtension extends Extension {
  private static instance: InteractiveReceiptExtension;
  
  private receiptExtension: ComprehensiveToolReceiptExtension;
  private auditLogExtension: AuditLogAccessExtension;
  private memoryExtension: RecursiveMemoryExtension;
  private predictiveExtension: PredictiveGovernanceExtension;
  
  // Event handlers for UI integration
  private receiptClickHandlers: Map<string, (context: ReceiptChatContext) => void> = new Map();
  private contextMenuHandlers: Map<string, (receiptId: string, action: string) => void> = new Map();
  
  // Interaction tracking
  private interactionHistory: ReceiptInteractionEvent[] = [];
  private receiptMetadata: Map<string, InteractiveReceiptContext> = new Map();

  constructor() {
    super('InteractiveReceiptExtension', '1.0.0');
    
    // Initialize dependent extensions
    this.receiptExtension = ComprehensiveToolReceiptExtension.getInstance();
    this.auditLogExtension = new AuditLogAccessExtension();
    this.memoryExtension = new RecursiveMemoryExtension();
    this.predictiveExtension = new PredictiveGovernanceExtension();
  }

  static getInstance(): InteractiveReceiptExtension {
    if (!InteractiveReceiptExtension.instance) {
      InteractiveReceiptExtension.instance = new InteractiveReceiptExtension();
    }
    return InteractiveReceiptExtension.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initializing InteractiveReceiptExtension...');
      
      // Initialize dependent extensions
      await this.receiptExtension.initialize();
      await this.auditLogExtension.initialize();
      await this.memoryExtension.initialize();
      await this.predictiveExtension.initialize();
      
      // Set up event listeners for receipt interactions
      this.setupReceiptInteractionListeners();
      
      console.log('✅ InteractiveReceiptExtension initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize InteractiveReceiptExtension:', error);
      return false;
    }
  }

  /**
   * Core method: Load full interactive context for a receipt
   * This reconstructs the complete context from receipt + audit log + workflow
   */
  async loadReceiptInteractiveContext(receiptId: string): Promise<InteractiveReceiptContext> {
    try {
      // Get the enhanced receipt
      const receipt = await this.receiptExtension.getReceipt(receiptId);
      if (!receipt) {
        throw new Error(`Receipt not found: ${receiptId}`);
      }

      // Get the audit log entry for cognitive context
      const auditEntry = await this.auditLogExtension.getAuditLogEntry(receipt.auditLogEntryId);
      if (!auditEntry) {
        throw new Error(`Audit log entry not found: ${receipt.auditLogEntryId}`);
      }

      // Get workflow context if available
      const workflowContext = receipt.businessContext.workflowId 
        ? await this.memoryExtension.getWorkflowContext(receipt.businessContext.workflowId)
        : null;

      // Get predictive suggestions
      const suggestions = await this.predictiveExtension.generateSuggestions(
        receipt.agentId, 
        [receiptId]
      );

      // Build the complete interactive context
      const interactiveContext: InteractiveReceiptContext = {
        receipt,
        cognitiveContext: {
          originalPrompt: auditEntry.prompt,
          declaredIntent: auditEntry.declaredIntent,
          agentThinking: {
            alternativesConsidered: auditEntry.alternativesConsidered || [],
            confidenceLevel: auditEntry.confidenceLevel || 0,
            uncertaintyRating: auditEntry.uncertaintyRating || 0,
            emotionalState: auditEntry.emotionalState,
            assumptionsMade: auditEntry.assumptionsMade || []
          },
          decisionProcess: {
            chosenPlan: auditEntry.chosenPlan || '',
            cognitiveLoad: auditEntry.cognitiveLoad || 0,
            attentionFocus: auditEntry.attentionFocus || [],
            knowledgeGaps: auditEntry.knowledgeGaps || []
          }
        },
        workflowContext: {
          workflowId: receipt.businessContext.workflowId,
          currentStep: workflowContext?.currentStep || 0,
          relatedReceipts: receipt.relatedReceipts || [],
          businessObjective: receipt.businessContext.objective || '',
          workflowProgress: workflowContext?.progress || 0,
          nextSuggestedSteps: suggestions.map(s => s.suggestedAction) || []
        },
        verificationData: {
          checksum: receipt.checksum,
          integrityProof: receipt.integritySignature,
          apiTraceUrl: receipt.rawApiUrl,
          complianceStatus: receipt.complianceStatus,
          trustScore: auditEntry.trustScore,
          governanceAlerts: receipt.businessContext.governanceAlerts || []
        },
        interactionMetadata: {
          clickCount: 0,
          lastAccessed: new Date(),
          userAnnotations: [],
          conversationReferences: [],
          userFeedback: []
        }
      };

      // Cache the context for future use
      this.receiptMetadata.set(receiptId, interactiveContext);

      return interactiveContext;
    } catch (error) {
      console.error('❌ Failed to load receipt interactive context:', error);
      throw error;
    }
  }

  /**
   * Generate chat context for populating the chat interface
   * This creates the message and context that gets loaded into chat
   */
  async generateChatContext(receiptIds: string[]): Promise<ReceiptChatContext> {
    try {
      const contexts = await Promise.all(
        receiptIds.map(id => this.loadReceiptInteractiveContext(id))
      );

      const contextType = receiptIds.length === 1 ? 'single_receipt' : 'multi_receipt';
      
      // Generate chat message content
      const chatMessage = await this.generateChatMessage(contexts, contextType);
      
      // Generate agent context for response
      const agentContext = await this.generateAgentContext(contexts);

      return {
        contextType,
        chatMessage,
        agentContext
      };
    } catch (error) {
      console.error('❌ Failed to generate chat context:', error);
      throw error;
    }
  }

  /**
   * Handle receipt click - main entry point for UI integration
   */
  async handleReceiptClick(receiptId: string, userId: string, sessionId: string): Promise<ReceiptChatContext> {
    try {
      // Track the interaction
      const interactionEvent: ReceiptInteractionEvent = {
        eventId: `interaction_${Date.now()}`,
        timestamp: new Date(),
        userId,
        agentId: '', // Will be filled from receipt context
        sessionId,
        interactionType: 'click',
        receiptIds: [receiptId],
        resultingAction: 'chat_populate'
      };

      this.interactionHistory.push(interactionEvent);

      // Generate chat context
      const chatContext = await this.generateChatContext([receiptId]);

      // Update interaction metadata
      const context = this.receiptMetadata.get(receiptId);
      if (context) {
        context.interactionMetadata.clickCount++;
        context.interactionMetadata.lastAccessed = new Date();
      }

      // Notify registered handlers
      this.notifyReceiptClickHandlers(receiptId, chatContext);

      return chatContext;
    } catch (error) {
      console.error('❌ Failed to handle receipt click:', error);
      throw error;
    }
  }

  /**
   * Handle multi-receipt selection
   */
  async handleMultiReceiptSelection(receiptIds: string[], userId: string, sessionId: string): Promise<ReceiptChatContext> {
    try {
      const interactionEvent: ReceiptInteractionEvent = {
        eventId: `multi_interaction_${Date.now()}`,
        timestamp: new Date(),
        userId,
        agentId: '',
        sessionId,
        interactionType: 'multi_select',
        receiptIds,
        resultingAction: 'complex_context_populate'
      };

      this.interactionHistory.push(interactionEvent);

      return await this.generateChatContext(receiptIds);
    } catch (error) {
      console.error('❌ Failed to handle multi-receipt selection:', error);
      throw error;
    }
  }

  /**
   * Generate contextual chat message from receipt contexts
   */
  private async generateChatMessage(contexts: InteractiveReceiptContext[], contextType: string): Promise<any> {
    if (contexts.length === 1) {
      const context = contexts[0];
      return {
        content: `Here's the context from your ${context.receipt.toolName} action on ${new Date(context.receipt.timestamp).toLocaleString()}:

🎯 **What you asked:** "${context.cognitiveContext.originalPrompt}"

🔧 **What I did:** ${context.receipt.actionDescription}
   - Tool: ${context.receipt.toolName}
   - Outcome: ${context.receipt.outcome}
   - Confidence: ${context.cognitiveContext.agentThinking.confidenceLevel}%

🧠 **My thinking process:**
   - Intent: ${context.cognitiveContext.declaredIntent}
   - Alternatives considered: ${context.cognitiveContext.agentThinking.alternativesConsidered.join(', ')}
   - Assumptions: ${context.cognitiveContext.agentThinking.assumptionsMade.join(', ')}

🔍 **Verification:**
   - Checksum: ${context.verificationData.checksum.substring(0, 16)}...
   - Trust Score: ${context.verificationData.trustScore}%
   - Status: ${context.verificationData.complianceStatus}

💡 **What would you like to do next?**`,
        metadata: {
          receiptIds: [context.receipt.receiptId],
          contextSummary: `${context.receipt.toolName} action with ${context.receipt.outcome} outcome`,
          suggestedQuestions: [
            "Why did you choose this approach?",
            "Can you try a different method?",
            "What would happen if we changed the parameters?",
            "Continue from where this left off"
          ],
          actionButtons: [
            {
              id: 'explain',
              label: 'Explain Decision',
              action: 'explain' as const,
              description: 'Get detailed explanation of why I chose this approach',
              requiresConfirmation: false
            },
            {
              id: 'retry',
              label: 'Retry with Changes',
              action: 'retry' as const,
              description: 'Modify parameters and re-execute this action',
              requiresConfirmation: true
            },
            {
              id: 'continue',
              label: 'Continue Workflow',
              action: 'continue' as const,
              description: 'Pick up the workflow from this point',
              requiresConfirmation: false
            }
          ]
        }
      };
    } else {
      // Multi-receipt context
      const toolSummary = contexts.map(c => `${c.receipt.toolName} (${c.receipt.outcome})`).join(', ');
      return {
        content: `Here's the context from ${contexts.length} related actions:

📋 **Actions Summary:** ${toolSummary}

🔗 **Workflow Connection:** These actions are part of ${contexts[0].workflowContext.businessObjective}

💡 **What would you like to explore?**`,
        metadata: {
          receiptIds: contexts.map(c => c.receipt.receiptId),
          contextSummary: `${contexts.length} related actions in workflow`,
          suggestedQuestions: [
            "How do these actions relate to each other?",
            "What was the overall outcome?",
            "Can we optimize this workflow?",
            "Show me the decision points"
          ],
          actionButtons: [
            {
              id: 'workflow',
              label: 'Analyze Workflow',
              action: 'compare' as const,
              description: 'Analyze the relationship between these actions',
              requiresConfirmation: false
            }
          ]
        }
      };
    }
  }

  /**
   * Generate agent context for intelligent responses
   */
  private async generateAgentContext(contexts: InteractiveReceiptContext[]): Promise<any> {
    const patterns = await this.predictiveExtension.identifyPatterns(
      contexts.map(c => c.receipt.receiptId)
    );

    return {
      fullContext: contexts,
      responseGuidance: `User is asking about ${contexts.length} receipt(s). Provide detailed, contextual responses based on the cognitive context and workflow data. Reference specific decisions and alternatives considered.`,
      suggestedActions: contexts.flatMap(c => c.workflowContext.nextSuggestedSteps),
      relatedPatterns: patterns.map(p => p.description)
    };
  }

  /**
   * Setup event listeners for UI integration
   */
  private setupReceiptInteractionListeners(): void {
    // These would be called by UI components
    console.log('🔧 Setting up receipt interaction listeners');
  }

  /**
   * Notify registered click handlers
   */
  private notifyReceiptClickHandlers(receiptId: string, context: ReceiptChatContext): void {
    this.receiptClickHandlers.forEach(handler => {
      try {
        handler(context);
      } catch (error) {
        console.error('❌ Error in receipt click handler:', error);
      }
    });
  }

  /**
   * Register UI event handlers
   */
  registerReceiptClickHandler(handlerId: string, handler: (context: ReceiptChatContext) => void): void {
    this.receiptClickHandlers.set(handlerId, handler);
  }

  registerContextMenuHandler(handlerId: string, handler: (receiptId: string, action: string) => void): void {
    this.contextMenuHandlers.set(handlerId, handler);
  }

  /**
   * Get interaction analytics
   */
  getInteractionAnalytics(): {
    totalInteractions: number;
    mostClickedReceipts: string[];
    averageClicksPerReceipt: number;
    userSatisfactionScore: number;
  } {
    const totalInteractions = this.interactionHistory.length;
    const receiptClickCounts = new Map<string, number>();
    
    this.interactionHistory.forEach(event => {
      event.receiptIds.forEach(receiptId => {
        receiptClickCounts.set(receiptId, (receiptClickCounts.get(receiptId) || 0) + 1);
      });
    });

    const mostClickedReceipts = Array.from(receiptClickCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([receiptId]) => receiptId);

    const averageClicksPerReceipt = totalInteractions / Math.max(receiptClickCounts.size, 1);
    
    // Calculate satisfaction from feedback
    const satisfactionScores = Array.from(this.receiptMetadata.values())
      .flatMap(context => context.interactionMetadata.userFeedback)
      .map(feedback => feedback.rating);
    
    const userSatisfactionScore = satisfactionScores.length > 0 
      ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
      : 0;

    return {
      totalInteractions,
      mostClickedReceipts,
      averageClicksPerReceipt,
      userSatisfactionScore
    };
  }

  /**
   * Add user feedback to a receipt
   */
  async addReceiptFeedback(receiptId: string, feedback: Omit<UserReceiptFeedback, 'feedbackId' | 'timestamp'>): Promise<void> {
    const context = this.receiptMetadata.get(receiptId);
    if (context) {
      const fullFeedback: UserReceiptFeedback = {
        ...feedback,
        feedbackId: `feedback_${Date.now()}`,
        timestamp: new Date()
      };
      
      context.interactionMetadata.userFeedback.push(fullFeedback);
      
      // Use feedback for learning
      await this.predictiveExtension.incorporateFeedback(receiptId, fullFeedback);
    }
  }

  /**
   * Get receipt suggestions based on current context
   */
  async getReceiptSuggestions(agentId: string, currentContext: string): Promise<string[]> {
    return await this.predictiveExtension.suggestRelevantReceipts(agentId, currentContext);
  }
}

export default InteractiveReceiptExtension;

