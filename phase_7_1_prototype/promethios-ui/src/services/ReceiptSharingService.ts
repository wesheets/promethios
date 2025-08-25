/**
 * Receipt Sharing Service
 * 
 * Handles sharing of cryptographic receipts with agents for context and analysis.
 * Similar to ChatSharingService but specialized for receipt artifacts.
 */

import { ChatHistoryService } from './ChatHistoryService';
import { universalGovernanceAdapter } from './UniversalGovernanceAdapter';

export interface ShareableReceiptReference {
  receiptId: string;
  receiptTitle: string;
  receiptType: 'tool_execution' | 'research' | 'document' | 'workflow' | 'governance';
  toolName?: string;
  timestamp: Date;
  shareableId: string;
  cryptographicHash: string;
  contextType: 'receipt_reference';
  agentId: string;
  userId: string;
  auditData: any;
}

export interface ReceiptContextForAgent {
  receiptId: string;
  receiptTitle: string;
  receiptType: 'tool_execution' | 'research' | 'document' | 'workflow' | 'governance';
  toolName?: string;
  executionDetails: {
    inputs: any;
    outputs: any;
    status: string;
    duration: number;
    trustScore: number;
  };
  auditTrail: any[];
  relatedReceipts: Array<{
    id: string;
    title: string;
    relationship: string;
  }>;
  insights: {
    keyFindings: string[];
    patterns: string[];
    recommendations: string[];
    nextSteps: string[];
  };
  governanceMetrics: {
    complianceScore: number;
    riskLevel: string;
    policyViolations: string[];
  };
  cryptographicHash: string;
  timestamp: Date;
}

export class ReceiptSharingService {
  private static instance: ReceiptSharingService | null = null;
  private chatHistoryService: ChatHistoryService;

  private constructor() {
    this.chatHistoryService = ChatHistoryService.getInstance();
  }

  public static getInstance(): ReceiptSharingService {
    if (!ReceiptSharingService.instance) {
      ReceiptSharingService.instance = new ReceiptSharingService();
    }
    return ReceiptSharingService.instance;
  }

  /**
   * Generate shareable receipt reference
   */
  async generateReceiptShareReference(
    receiptId: string,
    userId: string,
    agentId: string
  ): Promise<ShareableReceiptReference> {
    try {
      console.log(`🧾 Generating shareable reference for receipt: ${receiptId}`);

      // Get receipt details from audit logs
      const auditLogs = await universalGovernanceAdapter.searchAuditLogs({
        receiptId,
        limit: 1
      });

      if (auditLogs.length === 0) {
        throw new Error(`Receipt not found: ${receiptId}`);
      }

      const receiptData = auditLogs[0];

      // Generate unique shareable ID
      const shareableId = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Determine receipt type based on audit data
      const receiptType = this.determineReceiptType(receiptData);

      // Create cryptographic hash for verification
      const hashData = {
        receiptId,
        timestamp: receiptData.timestamp,
        toolName: receiptData.toolName,
        userId,
        agentId
      };
      const cryptographicHash = await this.generateCryptographicHash(hashData);

      // Create shareable reference
      const shareableReference: ShareableReceiptReference = {
        receiptId,
        receiptTitle: this.generateReceiptTitle(receiptData),
        receiptType,
        toolName: receiptData.toolName,
        timestamp: new Date(receiptData.timestamp),
        shareableId,
        cryptographicHash,
        contextType: 'receipt_reference',
        agentId,
        userId,
        auditData: receiptData
      };

      // Store reference for agent access
      await this.chatHistoryService.createShareableContext(receiptId, shareableReference);

      console.log(`✅ Generated shareable receipt reference: ${shareableId}`);
      return shareableReference;
    } catch (error) {
      console.error('❌ Failed to generate receipt share reference:', error);
      throw error;
    }
  }

  /**
   * Generate user-friendly receipt message for sharing
   */
  generateReceiptShareMessage(shareableReference: ShareableReceiptReference): string {
    const timeAgo = this.getTimeAgo(shareableReference.timestamp);
    const typeIcon = this.getReceiptTypeIcon(shareableReference.receiptType);
    
    return `${typeIcon} **Receipt Artifact**
${shareableReference.receiptTitle}
${shareableReference.toolName ? `Tool: ${shareableReference.toolName} • ` : ''}${timeAgo}
*Click to analyze this execution...*

🧾 **Receipt Reference**: ${shareableReference.shareableId}`;
  }

  /**
   * Process receipt reference when agent detects it in conversation
   */
  async processReceiptReference(
    shareableId: string,
    userId: string,
    agentId: string,
    userMessage?: string
  ): Promise<{
    agentResponse: string;
    context: ReceiptContextForAgent | null;
    originalReceiptId: string | null;
    analysisOptions: Array<{action: string, description: string}>;
  }> {
    try {
      console.log(`🤖 Agent processing receipt reference: ${shareableId}`);

      // Get shareable context
      const shareableContext = await this.chatHistoryService.getShareableContext(shareableId);
      if (!shareableContext || shareableContext.contextType !== 'receipt_reference') {
        console.warn(`Receipt reference not found: ${shareableId}`);
        return {
          agentResponse: "❌ I couldn't find that receipt reference. It may have expired or been removed.",
          context: null,
          originalReceiptId: null,
          analysisOptions: []
        };
      }

      const shareableReference = shareableContext as ShareableReceiptReference;

      // Verify cryptographic integrity
      const isValid = await this.verifyCryptographicHash(shareableReference);
      if (!isValid) {
        console.error(`Receipt reference integrity check failed: ${shareableId}`);
        return {
          agentResponse: "⚠️ This receipt reference failed integrity verification. For security reasons, I cannot access this execution data.",
          context: null,
          originalReceiptId: null,
          analysisOptions: []
        };
      }

      // Load full receipt context for agent
      const receiptContext = await this.loadReceiptContextForAgent(
        shareableReference.receiptId,
        agentId
      );

      // Analyze user intent from the message containing the receipt reference
      const userIntent = this.analyzeUserIntentForReceiptReference(userMessage || '');
      
      // Generate appropriate response based on user intent and receipt type
      const agentResponse = await this.generateContextualReceiptResponse(receiptContext, userIntent);

      console.log(`✅ Loaded receipt context for agent: ${shareableReference.receiptTitle}`);
      return {
        agentResponse,
        context: receiptContext,
        originalReceiptId: shareableReference.receiptId,
        analysisOptions: this.generateAnalysisOptions(receiptContext)
      };
    } catch (error) {
      console.error('❌ Failed to process receipt reference:', error);
      return {
        agentResponse: "❌ I encountered an error while trying to access that receipt. Please try sharing it again or contact support if the issue persists.",
        context: null,
        originalReceiptId: null,
        analysisOptions: []
      };
    }
  }

  /**
   * Detect receipt references in messages (for agent processing)
   */
  detectReceiptReference(message: string): string | null {
    const receiptReferencePattern = /🧾\s*\*\*Receipt Reference\*\*:\s*([a-zA-Z0-9_]+)/;
    const match = message.match(receiptReferencePattern);
    return match ? match[1] : null;
  }

  /**
   * Load full receipt context for agent analysis
   */
  private async loadReceiptContextForAgent(
    receiptId: string,
    agentId: string
  ): Promise<ReceiptContextForAgent> {
    // Get receipt audit data
    const auditLogs = await universalGovernanceAdapter.searchAuditLogs({
      receiptId,
      limit: 1
    });

    if (auditLogs.length === 0) {
      throw new Error(`Receipt not found: ${receiptId}`);
    }

    const receiptData = auditLogs[0];

    // Get related receipts from the same session or tool
    const relatedReceipts = await this.findRelatedReceipts(receiptData);

    // Perform intelligent analysis of the receipt
    const insights = await this.performReceiptAnalysis(receiptData);

    // Get governance metrics
    const governanceMetrics = this.extractGovernanceMetrics(receiptData);

    // Create cryptographic hash for context integrity
    const contextData = {
      receiptId,
      timestamp: receiptData.timestamp,
      toolName: receiptData.toolName,
      agentId
    };
    const cryptographicHash = await this.generateCryptographicHash(contextData);

    return {
      receiptId,
      receiptTitle: this.generateReceiptTitle(receiptData),
      receiptType: this.determineReceiptType(receiptData),
      toolName: receiptData.toolName,
      executionDetails: {
        inputs: receiptData.inputs || {},
        outputs: receiptData.outputs || {},
        status: receiptData.status || 'unknown',
        duration: receiptData.duration || 0,
        trustScore: receiptData.trustScore || 0
      },
      auditTrail: [receiptData],
      relatedReceipts,
      insights,
      governanceMetrics,
      cryptographicHash,
      timestamp: new Date(receiptData.timestamp)
    };
  }

  /**
   * Analyze user intent when sharing a receipt reference
   */
  private analyzeUserIntentForReceiptReference(userMessage: string): 'analyze' | 'explain' | 'retry' | 'continue' | 'unclear' {
    const message = userMessage.toLowerCase();
    
    if (message.includes('analyze') || message.includes('review') || message.includes('examine')) {
      return 'analyze';
    }
    
    if (message.includes('explain') || message.includes('why') || message.includes('how')) {
      return 'explain';
    }
    
    if (message.includes('retry') || message.includes('try again') || message.includes('redo')) {
      return 'retry';
    }
    
    if (message.includes('continue') || message.includes('next') || message.includes('proceed')) {
      return 'continue';
    }
    
    // If the message only contains the receipt reference (auto-generated), intent is unclear
    if (message.includes('🧾') && message.includes('receipt reference') && message.split(' ').length < 10) {
      return 'unclear';
    }
    
    return 'unclear';
  }

  /**
   * Generate contextual response based on user intent and receipt type
   */
  private async generateContextualReceiptResponse(
    receiptContext: ReceiptContextForAgent,
    userIntent: 'analyze' | 'explain' | 'retry' | 'continue' | 'unclear'
  ): Promise<string> {
    const timeAgo = this.getTimeAgo(receiptContext.timestamp);
    const typeIcon = this.getReceiptTypeIcon(receiptContext.receiptType);
    
    let response = `✅ **I've loaded the execution receipt!**\n\n`;
    response += `${typeIcon} **${receiptContext.receiptTitle}**\n`;
    response += `🔧 Tool: ${receiptContext.toolName} • ${timeAgo}\n`;
    response += `📊 Status: ${receiptContext.executionDetails.status} • Trust Score: ${(receiptContext.executionDetails.trustScore * 100).toFixed(0)}%\n\n`;
    
    // Add intelligent insights
    if (receiptContext.insights.keyFindings.length > 0) {
      response += `🔍 **Key findings from this execution**:\n`;
      receiptContext.insights.keyFindings.forEach(finding => {
        response += `• ${finding}\n`;
      });
      response += `\n`;
    }
    
    switch (userIntent) {
      case 'analyze':
        response += `🔍 **Detailed Analysis**:\n\n`;
        if (receiptContext.insights.patterns.length > 0) {
          response += `📊 **Patterns identified**:\n`;
          receiptContext.insights.patterns.forEach(pattern => {
            response += `• ${pattern}\n`;
          });
          response += `\n`;
        }
        if (receiptContext.governanceMetrics.policyViolations.length > 0) {
          response += `⚠️ **Governance issues**:\n`;
          receiptContext.governanceMetrics.policyViolations.forEach(violation => {
            response += `• ${violation}\n`;
          });
          response += `\n`;
        }
        response += `💡 What specific aspect would you like me to analyze further?`;
        break;
        
      case 'explain':
        response += `💡 **Explanation of this execution**:\n\n`;
        response += `🎯 **What happened**: ${this.generateExecutionExplanation(receiptContext)}\n\n`;
        if (receiptContext.executionDetails.status === 'failure') {
          response += `❌ **Why it failed**: ${this.generateFailureExplanation(receiptContext)}\n\n`;
        }
        response += `🔧 **Technical details**: Available in the full audit trail\n\n`;
        response += `❓ **Any specific questions about this execution?**`;
        break;
        
      case 'retry':
        response += `🔄 **Ready to retry this execution!**\n\n`;
        if (receiptContext.insights.recommendations.length > 0) {
          response += `💡 **Recommendations for retry**:\n`;
          receiptContext.insights.recommendations.forEach(rec => {
            response += `• ${rec}\n`;
          });
          response += `\n`;
        }
        response += `🚀 **Would you like me to retry with these improvements?**`;
        break;
        
      case 'continue':
        response += `🚀 **Ready to continue from this execution!**\n\n`;
        if (receiptContext.insights.nextSteps.length > 0) {
          response += `📋 **Suggested next steps**:\n`;
          receiptContext.insights.nextSteps.forEach(step => {
            response += `• ${step}\n`;
          });
          response += `\n`;
        }
        response += `💡 **What would you like to do next?**`;
        break;
        
      case 'unclear':
      default:
        response += `🤔 **What would you like to do with this execution?**\n\n`;
        
        const analysisOptions = this.generateAnalysisOptions(receiptContext);
        if (analysisOptions.length > 0) {
          response += `🔧 **I can help you**:\n`;
          analysisOptions.forEach(option => {
            response += `• ${option.description}\n`;
          });
          response += `\n`;
        }
        
        response += `📋 **Quick options**:\n`;
        response += `• Type "analyze" for detailed analysis\n`;
        response += `• Type "explain" to understand what happened\n`;
        response += `• Type "retry" to run this again with improvements\n`;
        response += `• Type "continue" to proceed with next steps\n\n`;
        response += `💡 **What interests you most?**`;
        break;
    }
    
    return response;
  }

  // Helper methods
  private determineReceiptType(auditData: any): 'tool_execution' | 'research' | 'document' | 'workflow' | 'governance' {
    const toolName = auditData.toolName?.toLowerCase() || '';
    
    if (toolName.includes('search') || toolName.includes('scraping') || toolName.includes('research')) {
      return 'research';
    }
    
    if (toolName.includes('document') || toolName.includes('file') || toolName.includes('generate')) {
      return 'document';
    }
    
    if (toolName.includes('workflow') || toolName.includes('automation')) {
      return 'workflow';
    }
    
    if (toolName.includes('governance') || toolName.includes('compliance') || toolName.includes('audit')) {
      return 'governance';
    }
    
    return 'tool_execution';
  }

  private generateReceiptTitle(auditData: any): string {
    const toolName = auditData.toolName || 'Unknown Tool';
    const action = auditData.actionType || 'execution';
    const timestamp = new Date(auditData.timestamp).toLocaleTimeString();
    
    return `${toolName} ${action} at ${timestamp}`;
  }

  private getReceiptTypeIcon(type: string): string {
    switch (type) {
      case 'research': return '🔍';
      case 'document': return '📄';
      case 'workflow': return '⚙️';
      case 'governance': return '🛡️';
      default: return '🔧';
    }
  }

  private async findRelatedReceipts(receiptData: any): Promise<Array<{id: string, title: string, relationship: string}>> {
    // Find receipts from the same session or using the same tool
    const relatedLogs = await universalGovernanceAdapter.searchAuditLogs({
      sessionId: receiptData.sessionId,
      toolName: receiptData.toolName,
      limit: 5
    });
    
    return relatedLogs
      .filter(log => log.receiptId !== receiptData.receiptId)
      .map(log => ({
        id: log.receiptId,
        title: this.generateReceiptTitle(log),
        relationship: log.sessionId === receiptData.sessionId ? 'Same session' : 'Same tool'
      }));
  }

  private async performReceiptAnalysis(receiptData: any): Promise<{
    keyFindings: string[];
    patterns: string[];
    recommendations: string[];
    nextSteps: string[];
  }> {
    const keyFindings: string[] = [];
    const patterns: string[] = [];
    const recommendations: string[] = [];
    const nextSteps: string[] = [];
    
    // Analyze execution status
    if (receiptData.status === 'success') {
      keyFindings.push('Execution completed successfully');
    } else if (receiptData.status === 'failure') {
      keyFindings.push('Execution failed - requires investigation');
      recommendations.push('Review error logs and retry with corrections');
    }
    
    // Analyze trust score
    const trustScore = receiptData.trustScore || 0;
    if (trustScore > 0.8) {
      keyFindings.push('High confidence execution with strong trust score');
    } else if (trustScore < 0.5) {
      keyFindings.push('Low trust score indicates potential issues');
      recommendations.push('Verify inputs and execution parameters');
    }
    
    // Analyze duration
    if (receiptData.duration > 30000) { // 30 seconds
      patterns.push('Long execution time detected');
      recommendations.push('Consider optimizing for better performance');
    }
    
    // Generate next steps based on tool type
    const toolName = receiptData.toolName?.toLowerCase() || '';
    if (toolName.includes('search')) {
      nextSteps.push('Review search results for relevance');
      nextSteps.push('Consider refining search parameters');
    } else if (toolName.includes('document')) {
      nextSteps.push('Review generated document for accuracy');
      nextSteps.push('Share document with stakeholders');
    }
    
    return { keyFindings, patterns, recommendations, nextSteps };
  }

  private extractGovernanceMetrics(receiptData: any): {
    complianceScore: number;
    riskLevel: string;
    policyViolations: string[];
  } {
    return {
      complianceScore: receiptData.complianceScore || 1.0,
      riskLevel: receiptData.riskLevel || 'low',
      policyViolations: receiptData.policyViolations || []
    };
  }

  private generateAnalysisOptions(receiptContext: ReceiptContextForAgent): Array<{action: string, description: string}> {
    const options = [
      { action: 'analyze_performance', description: 'Analyze execution performance and optimization opportunities' },
      { action: 'review_governance', description: 'Review governance compliance and policy adherence' },
      { action: 'find_patterns', description: 'Find patterns across similar executions' },
      { action: 'generate_report', description: 'Generate detailed execution report' }
    ];
    
    if (receiptContext.executionDetails.status === 'failure') {
      options.unshift({ action: 'debug_failure', description: 'Debug the failure and suggest fixes' });
    }
    
    if (receiptContext.relatedReceipts.length > 0) {
      options.push({ action: 'compare_executions', description: 'Compare with related executions' });
    }
    
    return options.slice(0, 4); // Limit to top 4 options
  }

  private generateExecutionExplanation(receiptContext: ReceiptContextForAgent): string {
    const tool = receiptContext.toolName;
    const status = receiptContext.executionDetails.status;
    
    return `The ${tool} tool was executed and ${status === 'success' ? 'completed successfully' : 'encountered issues'}. The execution processed the provided inputs and generated outputs according to the tool's specifications.`;
  }

  private generateFailureExplanation(receiptContext: ReceiptContextForAgent): string {
    // This would analyze the actual error data in a real implementation
    return 'The execution failed due to one or more issues that prevented successful completion. Common causes include invalid inputs, network connectivity issues, or resource constraints.';
  }

  private async generateCryptographicHash(data: any): Promise<string> {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyCryptographicHash(reference: ShareableReceiptReference): Promise<boolean> {
    try {
      const hashData = {
        receiptId: reference.receiptId,
        timestamp: reference.timestamp,
        toolName: reference.toolName,
        userId: reference.userId,
        agentId: reference.agentId
      };
      const expectedHash = await this.generateCryptographicHash(hashData);
      return expectedHash === reference.cryptographicHash;
    } catch (error) {
      console.error('Hash verification failed:', error);
      return false;
    }
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}

