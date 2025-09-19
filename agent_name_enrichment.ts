// Agent Name Enrichment Strategy
// 
// Problem: Host chat session stores generic agent names like "Agent chatbot-1756857540077"
// instead of proper names like "Claude Assistant"
//
// Solution: Enrich agent names by looking up the original chatbot profile data
//
// Implementation approach:
// 1. After loading host chat session, enrich agent names from chatbot profiles
// 2. Update both chatSession.agentName and participants.guests names
// 3. Add fallback patterns for common agent types

export interface AgentEnrichmentService {
  /**
   * Enrich agent names in a chat session with proper names from chatbot profiles
   */
  enrichAgentNames(chatSession: ChatSession, chatbotProfiles?: any[]): Promise<ChatSession>;
  
  /**
   * Get proper agent name from chatbot ID
   */
  getProperAgentName(agentId: string, chatbotProfiles?: any[]): Promise<string>;
  
  /**
   * Extract chatbot ID from various formats
   */
  extractChatbotId(agentId: string): string;
}

// Example enrichment logic:
// 1. Extract chatbot ID from "chatbot-1756857540077"
// 2. Look up in chatbot profiles for proper name
// 3. Update chatSession.agentName and participants names
// 4. Add fallback patterns for common agents (Claude, GPT, etc.)
