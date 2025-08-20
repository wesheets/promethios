import { ChatHistoryService } from './ChatHistoryService';

export interface ShareableChatReference {
  chatId: string;
  chatName: string;
  participantCount: number;
  messageCount: number;
  lastActivity: Date;
  shareableId: string;
  cryptographicHash: string;
  contextType: 'chat_reference';
  agentId: string;
  userId: string;
}

export interface ChatContextForAgent {
  chatId: string;
  chatName: string;
  participants: string[];
  messageHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>;
  chatSummary: string;
  keyTopics: string[];
  lastActivity: Date;
  continuationOptions: Array<{
    action: string;
    description: string;
  }>;
  nextSteps: string[];
  cryptographicHash: string;
  auditTrail: any[];
}

export class ChatSharingService {
  private static instance: ChatSharingService | null = null;
  private chatHistoryService: ChatHistoryService;

  private constructor() {
    this.chatHistoryService = ChatHistoryService.getInstance();
    // Removed UGA instantiation to avoid module loading order issues
  }

  public static getInstance(): ChatSharingService {
    if (!ChatSharingService.instance) {
      ChatSharingService.instance = new ChatSharingService();
    }
    return ChatSharingService.instance;
  }

  /**
   * Generate shareable chat reference (mirrors receipt sharing)
   */
  async generateChatShareReference(
    chatId: string,
    userId: string,
    agentId: string
  ): Promise<ShareableChatReference> {
    try {
      console.log(`🔗 Generating shareable reference for chat: ${chatId}`);

      // Get chat session details
      const chatSession = await this.chatHistoryService.getChatSessionById(chatId);
      if (!chatSession) {
        throw new Error(`Chat session not found: ${chatId}`);
      }

      // Generate unique shareable ID
      const shareableId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create cryptographic hash for verification
      const chatData = {
        chatId,
        chatName: chatSession.name,
        messageCount: chatSession.messages.length,
        lastActivity: chatSession.lastUpdated,
        userId,
        agentId
      };
      const cryptographicHash = await this.generateCryptographicHash(chatData);

      // Create shareable reference
      const shareableReference: ShareableChatReference = {
        chatId,
        chatName: chatSession.name,
        participantCount: chatSession.participants.length,
        messageCount: chatSession.messages.length,
        lastActivity: chatSession.lastUpdated,
        shareableId,
        cryptographicHash,
        contextType: 'chat_reference',
        agentId,
        userId
      };

      // Store reference for agent access
      await this.chatHistoryService.createShareableContext(chatId, shareableReference);

      console.log(`✅ Generated shareable chat reference: ${shareableId}`);
      return shareableReference;
    } catch (error) {
      console.error('❌ Failed to generate chat share reference:', error);
      throw error;
    }
  }

  /**
   * Generate user-friendly chat message for sharing
   */
  generateChatShareMessage(shareableReference: ShareableChatReference): string {
    const messageCount = shareableReference.messageCount;
    const timeAgo = this.getTimeAgo(shareableReference.lastActivity);
    
    return `🗨️ **Previous Conversation**
${shareableReference.chatName}
${messageCount} messages • ${timeAgo}
*Click to continue this conversation...*

🧾 **Chat Reference**: ${shareableReference.shareableId}`;
  }

  /**
   * Process chat reference when agent detects it in conversation
   */
  async processChatReference(
    shareableId: string,
    agentId: string
  ): Promise<ChatContextForAgent | null> {
    try {
      console.log(`🤖 Agent processing chat reference: ${shareableId}`);

      // Get shareable context
      const shareableContext = await this.chatHistoryService.getShareableContext(shareableId);
      if (!shareableContext || shareableContext.contextType !== 'chat_reference') {
        console.warn(`Chat reference not found: ${shareableId}`);
        return null;
      }

      const shareableReference = shareableContext as ShareableChatReference;

      // Verify cryptographic integrity
      const isValid = await this.verifyCryptographicHash(shareableReference);
      if (!isValid) {
        console.error(`Chat reference integrity check failed: ${shareableId}`);
        return null;
      }

      // Load full chat context for agent
      const chatContext = await this.loadChatContextForAgent(
        shareableReference.chatId,
        agentId
      );

      console.log(`✅ Loaded chat context for agent: ${shareableReference.chatName}`);
      return chatContext;
    } catch (error) {
      console.error('❌ Failed to process chat reference:', error);
      return null;
    }
  }

  /**
   * Load full chat context for agent continuation
   */
  private async loadChatContextForAgent(
    chatId: string,
    agentId: string
  ): Promise<ChatContextForAgent> {
    // Get chat session
    const chatSession = await this.chatHistoryService.getChatSessionById(chatId);
    if (!chatSession) {
      throw new Error(`Chat session not found: ${chatId}`);
    }

    // Generate chat summary and key topics
    const chatSummary = this.generateChatSummary(chatSession.messages);
    const keyTopics = this.extractKeyTopics(chatSession.messages);

    // Generate continuation options based on chat content
    const continuationOptions = this.generateContinuationOptions(chatSession.messages);
    const nextSteps = this.generateNextSteps(chatSession.messages);

    // Get audit trail from governance adapter using dynamic import
    const { UniversalGovernanceAdapter } = await import('./UniversalGovernanceAdapter');
    const universalGovernanceAdapter = UniversalGovernanceAdapter.getInstance();
    const auditTrail = await universalGovernanceAdapter.searchAuditLogs({
      agentId,
      contextType: 'chat_session',
      contextId: chatId,
      limit: 50
    });

    // Create cryptographic hash for context integrity
    const contextData = {
      chatId,
      messageCount: chatSession.messages.length,
      lastActivity: chatSession.lastUpdated,
      summary: chatSummary
    };
    const cryptographicHash = await this.generateCryptographicHash(contextData);

    return {
      chatId,
      chatName: chatSession.name,
      participants: chatSession.participants,
      messageHistory: chatSession.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata
      })),
      chatSummary,
      keyTopics,
      lastActivity: chatSession.lastUpdated,
      continuationOptions,
      nextSteps,
      cryptographicHash,
      auditTrail
    };
  }

  /**
   * Detect chat references in messages (for agent processing)
   */
  detectChatReference(message: string): string | null {
    const chatReferencePattern = /🧾\s*\*\*Chat Reference\*\*:\s*([a-zA-Z0-9_]+)/;
    const match = message.match(chatReferencePattern);
    return match ? match[1] : null;
  }

  /**
   * Generate agent response when chat reference is detected
   */
  async generateAgentChatResponse(
    chatContext: ChatContextForAgent
  ): Promise<string> {
    const timeAgo = this.getTimeAgo(chatContext.lastActivity);
    const messageCount = chatContext.messageHistory.length;
    
    let response = `✅ **I found our previous conversation!**\n\n`;
    response += `📝 **"${chatContext.chatName}"**\n`;
    response += `💬 ${messageCount} messages • Last active ${timeAgo}\n\n`;
    
    if (chatContext.chatSummary) {
      response += `📋 **Summary**: ${chatContext.chatSummary}\n\n`;
    }
    
    if (chatContext.keyTopics.length > 0) {
      response += `🏷️ **Key Topics**: ${chatContext.keyTopics.join(', ')}\n\n`;
    }
    
    if (chatContext.continuationOptions.length > 0) {
      response += `🚀 **I can help you**:\n`;
      chatContext.continuationOptions.forEach(option => {
        response += `• ${option.description}\n`;
      });
      response += `\n`;
    }
    
    if (chatContext.nextSteps.length > 0) {
      response += `📋 **Suggested next steps**:\n`;
      chatContext.nextSteps.forEach(step => {
        response += `• ${step}\n`;
      });
    }
    
    response += `\n💡 **Ready to continue where we left off!**`;
    
    return response;
  }

  // Helper methods (mirror receipt sharing patterns)

  private async generateCryptographicHash(data: any): Promise<string> {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyCryptographicHash(reference: ShareableChatReference): Promise<boolean> {
    try {
      const chatData = {
        chatId: reference.chatId,
        chatName: reference.chatName,
        messageCount: reference.messageCount,
        lastActivity: reference.lastActivity,
        userId: reference.userId,
        agentId: reference.agentId
      };
      const expectedHash = await this.generateCryptographicHash(chatData);
      return expectedHash === reference.cryptographicHash;
    } catch (error) {
      console.error('Hash verification failed:', error);
      return false;
    }
  }

  private generateChatSummary(messages: any[]): string {
    if (messages.length === 0) return 'Empty conversation';
    
    // Simple summary generation - could be enhanced with AI
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    if (userMessages.length > 0) {
      const firstUserMessage = userMessages[0].content;
      const preview = firstUserMessage.length > 100 
        ? firstUserMessage.substring(0, 100) + '...'
        : firstUserMessage;
      return `Conversation about: ${preview}`;
    }
    
    return `${messages.length} message conversation`;
  }

  private extractKeyTopics(messages: any[]): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    const commonTopics = [
      'ai', 'artificial intelligence', 'governance', 'policy', 'compliance',
      'security', 'privacy', 'data', 'analysis', 'research', 'document',
      'automation', 'workflow', 'integration', 'deployment'
    ];
    
    return commonTopics.filter(topic => allText.includes(topic)).slice(0, 5);
  }

  private generateContinuationOptions(messages: any[]): Array<{action: string, description: string}> {
    const options = [
      { action: 'continue_discussion', description: 'Continue our previous discussion' },
      { action: 'summarize_conversation', description: 'Summarize what we discussed' },
      { action: 'expand_on_topics', description: 'Dive deeper into specific topics' },
      { action: 'create_action_items', description: 'Create action items from our conversation' }
    ];
    
    // Could be enhanced to analyze conversation content for specific options
    return options.slice(0, 3);
  }

  private generateNextSteps(messages: any[]): string[] {
    // Simple next steps generation - could be enhanced with AI analysis
    const steps = [
      'Review the key points from our conversation',
      'Continue exploring the topics we discussed',
      'Take action on any decisions we made'
    ];
    
    return steps.slice(0, 2);
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }
}

export const chatSharingService = ChatSharingService.getInstance();

