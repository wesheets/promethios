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
        participantCount: 2, // User + Agent (since ChatSession doesn't have participants array)
        messageCount: chatSession.messages?.length || 0,
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
    userId: string,
    agentId: string,
    userMessage?: string
  ): Promise<{
    agentResponse: string;
    context: ChatContextForAgent | null;
    originalChatId: string | null;
    continuationOptions: Array<{action: string, description: string}>;
  }> {
    try {
      console.log(`🤖 Agent processing chat reference: ${shareableId}`);

      // Get shareable context
      const shareableContext = await this.chatHistoryService.getShareableContext(shareableId);
      if (!shareableContext || shareableContext.contextType !== 'chat_reference') {
        console.warn(`Chat reference not found: ${shareableId}`);
        return {
          agentResponse: "❌ I couldn't find that chat reference. It may have expired or been removed.",
          context: null,
          originalChatId: null,
          continuationOptions: []
        };
      }

      const shareableReference = shareableContext as ShareableChatReference;

      // Verify cryptographic integrity
      const isValid = await this.verifyCryptographicHash(shareableReference);
      if (!isValid) {
        console.error(`Chat reference integrity check failed: ${shareableId}`);
        return {
          agentResponse: "⚠️ This chat reference failed integrity verification. For security reasons, I cannot access this conversation.",
          context: null,
          originalChatId: null,
          continuationOptions: []
        };
      }

      // Load full chat context for agent
      const chatContext = await this.loadChatContextForAgent(
        shareableReference.chatId,
        agentId
      );

      // Analyze user intent from the message containing the chat reference
      const userIntent = this.analyzeUserIntentForChatReference(userMessage || '');
      
      // Generate appropriate response based on user intent
      const agentResponse = await this.generateContextualChatResponse(chatContext, userIntent);

      console.log(`✅ Loaded chat context for agent: ${shareableReference.chatName}`);
      return {
        agentResponse,
        context: chatContext,
        originalChatId: shareableReference.chatId,
        continuationOptions: chatContext.continuationOptions
      };
    } catch (error) {
      console.error('❌ Failed to process chat reference:', error);
      return {
        agentResponse: "❌ I encountered an error while trying to access that chat. Please try sharing it again or contact support if the issue persists.",
        context: null,
        originalChatId: null,
        continuationOptions: []
      };
    }
  }

  /**
   * Analyze user intent when sharing a chat reference
   */
  private analyzeUserIntentForChatReference(userMessage: string): 'continue' | 'summarize' | 'analyze' | 'unclear' {
    const message = userMessage.toLowerCase();
    
    // Check for specific intent keywords
    if (message.includes('continue') || message.includes('pick up') || message.includes('where we left off')) {
      return 'continue';
    }
    
    if (message.includes('summarize') || message.includes('summary') || message.includes('recap')) {
      return 'summarize';
    }
    
    if (message.includes('analyze') || message.includes('review') || message.includes('look at') || message.includes('examine')) {
      return 'analyze';
    }
    
    // If the message only contains the chat reference (auto-generated), intent is unclear
    if (message.includes('🧾') && message.includes('chat reference') && message.split(' ').length < 10) {
      return 'unclear';
    }
    
    return 'unclear';
  }

  /**
   * Generate contextual response based on user intent
   */
  private async generateContextualChatResponse(
    chatContext: ChatContextForAgent,
    userIntent: 'continue' | 'summarize' | 'analyze' | 'unclear'
  ): Promise<string> {
    const timeAgo = this.getTimeAgo(chatContext.lastActivity);
    const messageCount = chatContext.messageHistory.length;
    
    // Perform intelligent search and context extraction
    const searchResults = await this.performIntelligentChatSearch(chatContext);
    
    let response = `✅ **I've loaded our previous conversation!**\n\n`;
    response += `📝 **"${chatContext.chatName}"**\n`;
    response += `💬 ${messageCount} messages • Last active ${timeAgo}\n\n`;
    
    // Add intelligent search insights
    if (searchResults.keyInsights.length > 0) {
      response += `🔍 **Key insights I found**:\n`;
      searchResults.keyInsights.forEach(insight => {
        response += `• ${insight}\n`;
      });
      response += `\n`;
    }
    
    switch (userIntent) {
      case 'continue':
        response += `🚀 **Ready to continue where we left off!**\n\n`;
        if (searchResults.unfinishedTasks.length > 0) {
          response += `📋 **Unfinished items from our conversation**:\n`;
          searchResults.unfinishedTasks.forEach(task => {
            response += `• ${task}\n`;
          });
          response += `\n`;
        }
        if (chatContext.nextSteps.length > 0) {
          response += `📋 **Suggested next steps**:\n`;
          chatContext.nextSteps.forEach(step => {
            response += `• ${step}\n`;
          });
          response += `\n`;
        }
        response += `💡 What would you like to explore further?`;
        break;
        
      case 'summarize':
        response += `📋 **Summary**: ${chatContext.chatSummary}\n\n`;
        if (chatContext.keyTopics.length > 0) {
          response += `🏷️ **Key Topics**: ${chatContext.keyTopics.join(', ')}\n\n`;
        }
        if (searchResults.importantDecisions.length > 0) {
          response += `⚡ **Important decisions made**:\n`;
          searchResults.importantDecisions.forEach(decision => {
            response += `• ${decision}\n`;
          });
          response += `\n`;
        }
        response += `💡 Would you like me to elaborate on any of these topics?`;
        break;
        
      case 'analyze':
        response += `🔍 **Analysis of our conversation**:\n\n`;
        response += `📋 **Summary**: ${chatContext.chatSummary}\n\n`;
        if (chatContext.keyTopics.length > 0) {
          response += `🏷️ **Key Topics Discussed**: ${chatContext.keyTopics.join(', ')}\n\n`;
        }
        if (searchResults.patterns.length > 0) {
          response += `📊 **Patterns I noticed**:\n`;
          searchResults.patterns.forEach(pattern => {
            response += `• ${pattern}\n`;
          });
          response += `\n`;
        }
        if (searchResults.actionableItems.length > 0) {
          response += `📋 **Actionable items identified**:\n`;
          searchResults.actionableItems.forEach(item => {
            response += `• ${item}\n`;
          });
          response += `\n`;
        }
        response += `💡 What specific aspect would you like me to analyze further?`;
        break;
        
      case 'unclear':
      default:
        response += `🤔 **What would you like to do with this conversation?**\n\n`;
        
        // Provide intelligent suggestions based on search results
        const smartSuggestions = this.generateSmartSuggestions(searchResults);
        if (smartSuggestions.length > 0) {
          response += `💡 **Based on what I found, you might want to**:\n`;
          smartSuggestions.forEach(suggestion => {
            response += `• ${suggestion}\n`;
          });
          response += `\n`;
        }
        
        response += `🔧 **I can help you**:\n`;
        chatContext.continuationOptions.forEach(option => {
          response += `• ${option.description}\n`;
        });
        response += `\n📋 **Quick options**:\n`;
        response += `• Type "continue" to pick up where we left off\n`;
        response += `• Type "summarize" for a recap of our discussion\n`;
        response += `• Type "analyze" for a detailed review\n`;
        response += `• Type "search [topic]" to find specific information\n`;
        response += `• Or just tell me what you'd like to explore!\n\n`;
        response += `💡 **What interests you most?**`;
        break;
    }
    
    return response;
  }

  /**
   * Perform intelligent search and context extraction within chat
   */
  private async performIntelligentChatSearch(chatContext: ChatContextForAgent): Promise<{
    keyInsights: string[];
    unfinishedTasks: string[];
    importantDecisions: string[];
    patterns: string[];
    actionableItems: string[];
    questions: string[];
    resources: string[];
  }> {
    const messages = chatContext.messageHistory;
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    
    return {
      keyInsights: this.extractKeyInsights(messages),
      unfinishedTasks: this.extractUnfinishedTasks(messages),
      importantDecisions: this.extractImportantDecisions(messages),
      patterns: this.extractPatterns(messages),
      actionableItems: this.extractActionableItems(messages),
      questions: this.extractUnansweredQuestions(messages),
      resources: this.extractResources(messages)
    };
  }

  /**
   * Extract key insights from conversation
   */
  private extractKeyInsights(messages: any[]): string[] {
    const insights: string[] = [];
    const insightKeywords = ['discovered', 'learned', 'found out', 'realized', 'important', 'key point', 'insight'];
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      insightKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          // Extract sentence containing the keyword
          const sentences = message.content.split(/[.!?]+/);
          const relevantSentence = sentences.find(s => s.toLowerCase().includes(keyword));
          if (relevantSentence && relevantSentence.trim().length > 20) {
            insights.push(relevantSentence.trim());
          }
        }
      });
    });
    
    return insights.slice(0, 3); // Limit to top 3 insights
  }

  /**
   * Extract unfinished tasks or topics
   */
  private extractUnfinishedTasks(messages: any[]): string[] {
    const tasks: string[] = [];
    const taskKeywords = ['need to', 'should', 'will', 'plan to', 'next', 'todo', 'follow up', 'continue'];
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      taskKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          const sentences = message.content.split(/[.!?]+/);
          const relevantSentence = sentences.find(s => s.toLowerCase().includes(keyword));
          if (relevantSentence && relevantSentence.trim().length > 15) {
            tasks.push(relevantSentence.trim());
          }
        }
      });
    });
    
    return tasks.slice(0, 3); // Limit to top 3 tasks
  }

  /**
   * Extract important decisions made
   */
  private extractImportantDecisions(messages: any[]): string[] {
    const decisions: string[] = [];
    const decisionKeywords = ['decided', 'chose', 'selected', 'agreed', 'concluded', 'determined'];
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      decisionKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          const sentences = message.content.split(/[.!?]+/);
          const relevantSentence = sentences.find(s => s.toLowerCase().includes(keyword));
          if (relevantSentence && relevantSentence.trim().length > 20) {
            decisions.push(relevantSentence.trim());
          }
        }
      });
    });
    
    return decisions.slice(0, 3); // Limit to top 3 decisions
  }

  /**
   * Extract conversation patterns
   */
  private extractPatterns(messages: any[]): string[] {
    const patterns: string[] = [];
    
    // Analyze message frequency and topics
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    if (userMessages.length > assistantMessages.length) {
      patterns.push('User-driven conversation with many questions');
    }
    
    // Check for recurring topics
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    const commonTopics = ['policy', 'governance', 'security', 'compliance', 'data', 'ai', 'automation'];
    const mentionedTopics = commonTopics.filter(topic => allText.includes(topic));
    
    if (mentionedTopics.length > 2) {
      patterns.push(`Focus on ${mentionedTopics.slice(0, 3).join(', ')} topics`);
    }
    
    return patterns.slice(0, 2); // Limit to top 2 patterns
  }

  /**
   * Extract actionable items
   */
  private extractActionableItems(messages: any[]): string[] {
    const items: string[] = [];
    const actionKeywords = ['action', 'implement', 'create', 'build', 'develop', 'design', 'review', 'update'];
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      actionKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          const sentences = message.content.split(/[.!?]+/);
          const relevantSentence = sentences.find(s => s.toLowerCase().includes(keyword));
          if (relevantSentence && relevantSentence.trim().length > 15) {
            items.push(relevantSentence.trim());
          }
        }
      });
    });
    
    return items.slice(0, 3); // Limit to top 3 items
  }

  /**
   * Extract unanswered questions
   */
  private extractUnansweredQuestions(messages: any[]): string[] {
    const questions: string[] = [];
    
    messages.forEach(message => {
      if (message.role === 'user' && message.content.includes('?')) {
        const questionSentences = message.content.split(/[.!]+/).filter(s => s.includes('?'));
        questions.push(...questionSentences.map(q => q.trim()));
      }
    });
    
    return questions.slice(0, 3); // Limit to top 3 questions
  }

  /**
   * Extract resources mentioned
   */
  private extractResources(messages: any[]): string[] {
    const resources: string[] = [];
    const allText = messages.map(m => m.content).join(' ');
    
    // Look for URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = allText.match(urlRegex) || [];
    resources.push(...urls);
    
    // Look for file references
    const fileRegex = /\b\w+\.(pdf|doc|docx|txt|csv|xlsx)\b/gi;
    const files = allText.match(fileRegex) || [];
    resources.push(...files);
    
    return resources.slice(0, 3); // Limit to top 3 resources
  }

  /**
   * Generate smart suggestions based on search results
   */
  private generateSmartSuggestions(searchResults: any): string[] {
    const suggestions: string[] = [];
    
    if (searchResults.unfinishedTasks.length > 0) {
      suggestions.push('Continue working on the unfinished tasks we identified');
    }
    
    if (searchResults.questions.length > 0) {
      suggestions.push('Get answers to the questions that came up');
    }
    
    if (searchResults.actionableItems.length > 0) {
      suggestions.push('Create an action plan based on our discussion');
    }
    
    if (searchResults.resources.length > 0) {
      suggestions.push('Review the resources and links we mentioned');
    }
    
    if (searchResults.importantDecisions.length > 0) {
      suggestions.push('Document the decisions we made for future reference');
    }
    
    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  /**
   * Search for specific information within a shared chat
   */
  async searchWithinSharedChat(
    shareableId: string,
    searchQuery: string,
    userId: string,
    agentId: string
  ): Promise<{
    agentResponse: string;
    searchResults: Array<{
      messageId: string;
      content: string;
      sender: string;
      timestamp: Date;
      relevanceScore: number;
    }>;
    suggestions: string[];
  }> {
    try {
      console.log(`🔍 Searching within shared chat: ${shareableId} for: "${searchQuery}"`);

      // Get shareable context
      const shareableContext = await this.chatHistoryService.getShareableContext(shareableId);
      if (!shareableContext || shareableContext.contextType !== 'chat_reference') {
        return {
          agentResponse: "❌ I couldn't find that chat reference to search within.",
          searchResults: [],
          suggestions: []
        };
      }

      const shareableReference = shareableContext as ShareableChatReference;

      // Load full chat context
      const chatContext = await this.loadChatContextForAgent(shareableReference.chatId, agentId);

      // Perform targeted search
      const searchResults = this.performTargetedSearch(chatContext.messageHistory, searchQuery);

      // Generate response with search results
      const agentResponse = this.generateSearchResponse(chatContext, searchQuery, searchResults);

      // Generate follow-up suggestions
      const suggestions = this.generateSearchSuggestions(searchResults, searchQuery);

      return {
        agentResponse,
        searchResults,
        suggestions
      };
    } catch (error) {
      console.error('❌ Failed to search within shared chat:', error);
      return {
        agentResponse: "❌ I encountered an error while searching. Please try again.",
        searchResults: [],
        suggestions: []
      };
    }
  }

  /**
   * Perform targeted search within chat messages
   */
  private performTargetedSearch(messages: any[], searchQuery: string): Array<{
    messageId: string;
    content: string;
    sender: string;
    timestamp: Date;
    relevanceScore: number;
  }> {
    const query = searchQuery.toLowerCase();
    const searchTerms = query.split(' ').filter(term => term.length > 2);
    
    const results = messages.map(message => {
      const content = message.content.toLowerCase();
      let relevanceScore = 0;
      
      // Exact phrase match (highest score)
      if (content.includes(query)) {
        relevanceScore += 10;
      }
      
      // Individual term matches
      searchTerms.forEach(term => {
        if (content.includes(term)) {
          relevanceScore += 3;
        }
      });
      
      // Bonus for keyword density
      const wordCount = content.split(' ').length;
      const matchCount = searchTerms.reduce((count, term) => {
        return count + (content.split(term).length - 1);
      }, 0);
      
      if (wordCount > 0) {
        relevanceScore += (matchCount / wordCount) * 5;
      }
      
      return {
        messageId: message.id,
        content: message.content,
        sender: message.role || message.sender,
        timestamp: message.timestamp,
        relevanceScore
      };
    }).filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Top 5 results
    
    return results;
  }

  /**
   * Generate response for search results
   */
  private generateSearchResponse(
    chatContext: ChatContextForAgent,
    searchQuery: string,
    searchResults: any[]
  ): string {
    let response = `🔍 **Search results for "${searchQuery}" in "${chatContext.chatName}"**\n\n`;
    
    if (searchResults.length === 0) {
      response += `❌ No direct matches found for "${searchQuery}".\n\n`;
      response += `💡 **Try searching for**:\n`;
      response += `• Related terms or synonyms\n`;
      response += `• Key topics: ${chatContext.keyTopics.join(', ')}\n`;
      response += `• Or ask me to summarize the conversation\n\n`;
      response += `🤔 **What specific information are you looking for?**`;
      return response;
    }
    
    response += `✅ **Found ${searchResults.length} relevant message${searchResults.length > 1 ? 's' : ''}**:\n\n`;
    
    searchResults.forEach((result, index) => {
      const timeAgo = this.getTimeAgo(result.timestamp);
      const preview = result.content.length > 150 
        ? result.content.substring(0, 150) + '...'
        : result.content;
      
      response += `**${index + 1}.** *${result.sender}* • ${timeAgo}\n`;
      response += `${preview}\n\n`;
    });
    
    response += `💡 **What would you like to do with this information?**\n`;
    response += `• Ask follow-up questions about these messages\n`;
    response += `• Search for related topics\n`;
    response += `• Continue the conversation from where we left off\n`;
    response += `• Get more context around these messages`;
    
    return response;
  }

  /**
   * Generate search suggestions based on results
   */
  private generateSearchSuggestions(searchResults: any[], originalQuery: string): string[] {
    const suggestions: string[] = [];
    
    if (searchResults.length > 0) {
      suggestions.push(`Tell me more about the context around "${originalQuery}"`);
      suggestions.push(`What decisions were made regarding "${originalQuery}"?`);
      suggestions.push(`What were the next steps for "${originalQuery}"?`);
    } else {
      suggestions.push('Search for related terms or topics');
      suggestions.push('Ask me to summarize the conversation');
      suggestions.push('Continue where we left off in the conversation');
    }
    
    return suggestions;
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
      participants: [chatSession.userId, chatSession.agentId], // Derive participants from userId and agentId
      messageHistory: chatSession.messages.map(msg => ({
        role: msg.sender, // Use sender instead of role
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.governanceData || {} // Use governanceData as metadata fallback
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
    // First try the formatted pattern (for backwards compatibility)
    const formattedPattern = /🧾\s*\*\*Chat Reference\*\*:\s*([a-zA-Z0-9_]+)/;
    const formattedMatch = message.match(formattedPattern);
    if (formattedMatch) {
      return formattedMatch[1];
    }
    
    // Then try to detect bare chat references (chat_XXXXXXXXX_XXXXXXX format)
    const barePattern = /(chat_\d+_[a-zA-Z0-9]+)/;
    const bareMatch = message.match(barePattern);
    if (bareMatch) {
      console.log('🔍 [ChatReference] Detected bare chat reference:', bareMatch[1]);
      return bareMatch[1];
    }
    
    return null;
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

