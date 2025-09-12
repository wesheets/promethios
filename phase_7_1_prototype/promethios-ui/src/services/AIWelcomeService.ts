/**
 * AI Welcome Service
 * 
 * Generates context-aware welcome messages when guest humans join chat sessions.
 * Provides personalized greetings with participant introductions and conversation summaries.
 */

import { ChatHistoryService, ChatSession, ChatParticipant } from './ChatHistoryService';
import { ChatMessage } from './ChatStorageService';

export interface WelcomeMessageData {
  guestName: string;
  guestId: string;
  sessionId: string;
  sessionName: string;
  participants: {
    host: ChatParticipant;
    guests: ChatParticipant[];
  };
  conversationSummary: string;
  messageCount: number;
  keyTopics: string[];
}

export interface GeneratedWelcomeMessage {
  content: string;
  mentionedParticipants: string[]; // IDs of participants mentioned for notifications
  timestamp: Date;
}

/**
 * AI Welcome Service for generating context-aware welcome messages
 */
export class AIWelcomeService {
  private static instance: AIWelcomeService;
  private chatHistoryService: ChatHistoryService;

  private constructor() {
    this.chatHistoryService = ChatHistoryService.getInstance();
  }

  static getInstance(): AIWelcomeService {
    if (!AIWelcomeService.instance) {
      AIWelcomeService.instance = new AIWelcomeService();
    }
    return AIWelcomeService.instance;
  }

  /**
   * Generate a context-aware welcome message for a guest human
   */
  async generateWelcomeMessage(
    sessionId: string,
    guestHumanId: string
  ): Promise<GeneratedWelcomeMessage | null> {
    try {
      console.log(`🤖 [AIWelcome] Generating welcome message for guest ${guestHumanId} in session ${sessionId}`);

      // Get the chat session
      const session = await this.chatHistoryService.getChatSessionById(sessionId);
      if (!session) {
        console.error(`❌ [AIWelcome] Session not found: ${sessionId}`);
        return null;
      }

      // Find the guest human
      const guestHuman = session.participants.guests.find(
        g => g.id === guestHumanId && g.type === 'human'
      );
      if (!guestHuman) {
        console.error(`❌ [AIWelcome] Guest human not found: ${guestHumanId}`);
        return null;
      }

      // Prepare welcome message data
      const welcomeData: WelcomeMessageData = {
        guestName: guestHuman.name,
        guestId: guestHuman.id,
        sessionId: session.id,
        sessionName: session.name,
        participants: session.participants,
        conversationSummary: await this.generateConversationSummary(session),
        messageCount: session.messageCount,
        keyTopics: session.metadata.keyTopics || [],
      };

      // Generate the welcome message
      const welcomeMessage = await this.createWelcomeMessage(welcomeData);

      console.log(`✅ [AIWelcome] Generated welcome message for ${guestHuman.name}`);
      return welcomeMessage;

    } catch (error) {
      console.error('❌ [AIWelcome] Error generating welcome message:', error);
      return null;
    }
  }

  /**
   * Create the actual welcome message content
   */
  private async createWelcomeMessage(data: WelcomeMessageData): Promise<GeneratedWelcomeMessage> {
    const { guestName, participants, conversationSummary, messageCount, keyTopics } = data;

    // Build participant list
    const participantList = this.buildParticipantList(participants);
    
    // Create mention for the guest
    const guestMention = `@${guestName}`;
    
    // Generate welcome content
    let welcomeContent = `🎉 Welcome to our conversation, ${guestMention}!\n\n`;
    
    // Add participant introductions
    welcomeContent += `**Current Participants:**\n${participantList}\n\n`;
    
    // Add conversation context if available
    if (messageCount > 0) {
      welcomeContent += `**Conversation Context:**\n`;
      welcomeContent += `We've exchanged ${messageCount} messages so far. `;
      
      if (conversationSummary) {
        welcomeContent += `Here's a brief summary of our discussion:\n\n${conversationSummary}\n\n`;
      }
      
      if (keyTopics.length > 0) {
        welcomeContent += `**Key topics we've covered:** ${keyTopics.join(', ')}\n\n`;
      }
    } else {
      welcomeContent += `**Fresh Start:**\nThis is a new conversation, so you're joining right at the beginning!\n\n`;
    }
    
    // Add engagement invitation
    welcomeContent += `Feel free to jump in with any questions or thoughts. `;
    welcomeContent += `You can mention any of us using @ followed by our names to get our attention. `;
    welcomeContent += `Looking forward to collaborating with you! 🚀`;

    // Collect mentioned participants for notifications
    const mentionedParticipants = [data.guestId]; // Always notify the guest

    return {
      content: welcomeContent,
      mentionedParticipants,
      timestamp: new Date(),
    };
  }

  /**
   * Build a formatted list of participants
   */
  private buildParticipantList(participants: { host: ChatParticipant; guests: ChatParticipant[] }): string {
    const lines: string[] = [];
    
    // Add host
    lines.push(`• **${participants.host.name}** (Host AI Agent) - Leading this conversation`);
    
    // Add guest agents
    const guestAgents = participants.guests.filter(g => g.type === 'ai_agent');
    guestAgents.forEach(agent => {
      lines.push(`• **${agent.name}** (Guest AI Agent) - Collaborating specialist`);
    });
    
    // Add guest humans
    const guestHumans = participants.guests.filter(g => g.type === 'human');
    guestHumans.forEach(human => {
      const status = human.status === 'active' ? 'Active' : 'Joining';
      lines.push(`• **${human.name}** (Human Participant) - ${status}`);
    });
    
    return lines.join('\n');
  }

  /**
   * Generate a conversation summary from recent messages
   */
  private async generateConversationSummary(session: ChatSession): Promise<string> {
    if (session.messages.length === 0) {
      return '';
    }

    // Use existing summary if available
    if (session.metadata.summary) {
      return session.metadata.summary;
    }

    // Generate a simple summary from recent messages
    const recentMessages = session.messages.slice(-5); // Last 5 messages
    const topics = new Set<string>();
    
    recentMessages.forEach(msg => {
      // Extract potential topics from message content
      const words = msg.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 4 && !this.isCommonWord(word)) {
          topics.add(word);
        }
      });
    });

    if (topics.size === 0) {
      return 'We\'ve been having an engaging discussion with various topics.';
    }

    const topicList = Array.from(topics).slice(0, 3).join(', ');
    return `Our conversation has touched on topics including ${topicList} and related areas.`;
  }

  /**
   * Check if a word is too common to be considered a topic
   */
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'
    ]);
    return commonWords.has(word);
  }

  /**
   * Add welcome message to chat session
   */
  async addWelcomeMessageToSession(
    sessionId: string,
    welcomeMessage: GeneratedWelcomeMessage,
    hostAgentId: string,
    hostAgentName: string
  ): Promise<void> {
    try {
      console.log(`🤖 [AIWelcome] Adding welcome message to session ${sessionId}`);

      // Create chat message
      const chatMessage: ChatMessage = {
        id: `welcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: welcomeMessage.content,
        sender: hostAgentName,
        timestamp: welcomeMessage.timestamp,
        isUser: false,
        agentId: hostAgentId,
        messageType: 'welcome', // Special message type for welcome messages
        metadata: {
          isWelcomeMessage: true,
          mentionedParticipants: welcomeMessage.mentionedParticipants,
          generatedAt: welcomeMessage.timestamp.toISOString(),
        },
      };

      // Add message to session
      await this.chatHistoryService.addMessageToSession(sessionId, chatMessage);

      console.log(`✅ [AIWelcome] Welcome message added to session ${sessionId}`);

    } catch (error) {
      console.error('❌ [AIWelcome] Error adding welcome message to session:', error);
      throw error;
    }
  }

  /**
   * Generate and add welcome message when guest accepts invitation
   */
  async handleGuestAcceptance(
    sessionId: string,
    guestHumanId: string,
    hostAgentId: string,
    hostAgentName: string
  ): Promise<void> {
    try {
      console.log(`🤖 [AIWelcome] Handling guest acceptance for ${guestHumanId} in session ${sessionId}`);

      // Generate welcome message
      const welcomeMessage = await this.generateWelcomeMessage(sessionId, guestHumanId);
      if (!welcomeMessage) {
        console.warn(`⚠️ [AIWelcome] Could not generate welcome message for guest ${guestHumanId}`);
        return;
      }

      // Add welcome message to session
      await this.addWelcomeMessageToSession(
        sessionId,
        welcomeMessage,
        hostAgentId,
        hostAgentName
      );

      console.log(`✅ [AIWelcome] Guest acceptance handled successfully for ${guestHumanId}`);

    } catch (error) {
      console.error('❌ [AIWelcome] Error handling guest acceptance:', error);
      // Don't throw - welcome message failure shouldn't break the acceptance flow
    }
  }
}

export default AIWelcomeService;

// Export a singleton instance for easy use
export const aiWelcomeService = new AIWelcomeService();

