/**
 * MessageParser - Utility for parsing @mentions and routing messages in multi-agent chats
 * Part of the revolutionary multi-agent collaboration system
 */

export interface AgentMention {
  agentId: string;
  agentName: string;
  startIndex: number;
  endIndex: number;
  fullMention: string;
}

export interface ParsedMessage {
  originalMessage: string;
  cleanMessage: string; // Message without @mentions
  mentions: AgentMention[];
  hasAgentMentions: boolean;
  shouldRouteToAllAgents: boolean; // For @all mentions
}

export class MessageParser {
  private static instance: MessageParser;

  public static getInstance(): MessageParser {
    if (!MessageParser.instance) {
      MessageParser.instance = new MessageParser();
    }
    return MessageParser.instance;
  }

  /**
   * Parse a message for @mentions of AI agents
   * Supports formats like:
   * - @agent-name
   * - @"Agent Name"
   * - @all (routes to all agents)
   * - @everyone (routes to all agents)
   */
  public parseMessage(message: string, availableAgents: Array<{id: string, name: string}>): ParsedMessage {
    console.log('🔍 [MessageParser] Parsing message for @mentions:', message);
    console.log('🔍 [MessageParser] Available agents:', availableAgents);
    console.log('🔍 [MessageParser] Available agents detailed:', availableAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      idType: typeof agent.id,
      nameType: typeof agent.name
    })));

    const mentions: AgentMention[] = [];
    let cleanMessage = message;
    let shouldRouteToAllAgents = false;

    // Pattern to match @mentions
    // Supports: @agent-name, @"Agent Name", @all, @everyone
    const mentionPattern = /@(?:"([^"]+)"|([a-zA-Z0-9\-_]+)|all|everyone)/gi;
    let match;

    while ((match = mentionPattern.exec(message)) !== null) {
      const fullMention = match[0];
      const quotedName = match[1];
      const simpleName = match[2];
      const mentionText = quotedName || simpleName || fullMention.substring(1);

      console.log('🔍 [MessageParser] Found mention:', fullMention, 'mentionText:', mentionText);

      // Handle @all and @everyone
      if (mentionText.toLowerCase() === 'all' || mentionText.toLowerCase() === 'everyone') {
        shouldRouteToAllAgents = true;
        console.log('🔍 [MessageParser] Found @all/@everyone mention');
        continue;
      }

      // Find matching agent
      const matchingAgent = this.findMatchingAgent(mentionText, availableAgents);
      
      if (matchingAgent) {
        console.log('🔍 [MessageParser] matchingAgent object:', {
          id: matchingAgent.id,
          name: matchingAgent.name,
          fullObject: matchingAgent
        });
        
        mentions.push({
          agentId: matchingAgent.id,
          agentName: matchingAgent.name,
          startIndex: match.index,
          endIndex: match.index + fullMention.length,
          fullMention
        });

        console.log('✅ [MessageParser] Matched agent:', matchingAgent.name, 'for mention:', fullMention);
        console.log('🔍 [MessageParser] Created mention with agentId:', matchingAgent.id);
      } else {
        console.log('❌ [MessageParser] No matching agent found for mention:', fullMention);
      }
    }

    // Remove @mentions from the clean message for agent processing
    // Keep the original message structure but remove the @mentions
    mentions.forEach(mention => {
      cleanMessage = cleanMessage.replace(mention.fullMention, '').trim();
    });

    // Clean up extra spaces
    cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();

    const result: ParsedMessage = {
      originalMessage: message,
      cleanMessage,
      mentions,
      hasAgentMentions: mentions.length > 0 || shouldRouteToAllAgents,
      shouldRouteToAllAgents
    };

    console.log('✅ [MessageParser] Parsing complete:', result);
    return result;
  }

  /**
   * Find matching agent by name (fuzzy matching)
   */
  private findMatchingAgent(mentionText: string, availableAgents: Array<{id: string, name: string}>): {id: string, name: string} | null {
    const normalizedMention = mentionText.toLowerCase().trim();

    // Exact name match (case insensitive)
    let match = availableAgents.find(agent => 
      agent.name.toLowerCase() === normalizedMention
    );
    if (match) return match;

    // Partial name match (starts with)
    match = availableAgents.find(agent => 
      agent.name.toLowerCase().startsWith(normalizedMention)
    );
    if (match) return match;

    // Fuzzy match (contains)
    match = availableAgents.find(agent => 
      agent.name.toLowerCase().includes(normalizedMention)
    );
    if (match) return match;

    // ID match (for technical users)
    match = availableAgents.find(agent => 
      agent.id.toLowerCase() === normalizedMention
    );
    if (match) return match;

    return null;
  }

  /**
   * Extract agent IDs that should receive the message
   */
  public getTargetAgentIds(parsedMessage: ParsedMessage, availableAgents: Array<{id: string, name: string}>): string[] {
    console.log('🔍 [MessageParser] getTargetAgentIds called with:', {
      shouldRouteToAllAgents: parsedMessage.shouldRouteToAllAgents,
      mentions: parsedMessage.mentions,
      availableAgents: availableAgents.map(a => ({ id: a.id, name: a.name }))
    });

    if (parsedMessage.shouldRouteToAllAgents) {
      const allAgentIds = availableAgents.map(agent => agent.id);
      console.log('🔍 [MessageParser] Routing to all agents:', allAgentIds);
      return allAgentIds;
    }

    const targetIds = parsedMessage.mentions.map(mention => {
      console.log('🔍 [MessageParser] Processing mention:', {
        agentId: mention.agentId,
        agentName: mention.agentName,
        fullMention: mention.fullMention,
        startIndex: mention.startIndex,
        endIndex: mention.endIndex
      });
      console.log('🔍 [MessageParser] mention.agentId type:', typeof mention.agentId);
      console.log('🔍 [MessageParser] mention.agentId value:', mention.agentId);
      return mention.agentId;
    });
    
    console.log('🔍 [MessageParser] Final target IDs:', targetIds);
    return targetIds;
  }

  /**
   * Check if a message contains any @mentions
   */
  public hasAgentMentions(message: string): boolean {
    const mentionPattern = /@(?:"[^"]+"|[a-zA-Z0-9\-_]+|all|everyone)/i;
    return mentionPattern.test(message);
  }

  /**
   * Generate autocomplete suggestions for @mentions
   */
  public generateMentionSuggestions(
    partialMention: string, 
    availableAgents: Array<{id: string, name: string}>
  ): Array<{id: string, name: string, suggestion: string}> {
    const normalized = partialMention.toLowerCase().replace('@', '');
    
    if (normalized.length === 0) {
      // Show all agents and special mentions
      return [
        { id: 'all', name: 'All Agents', suggestion: '@all' },
        { id: 'everyone', name: 'Everyone', suggestion: '@everyone' },
        ...availableAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          suggestion: agent.name.includes(' ') ? `@"${agent.name}"` : `@${agent.name}`
        }))
      ];
    }

    const suggestions = [];

    // Add special mentions if they match
    if ('all'.startsWith(normalized)) {
      suggestions.push({ id: 'all', name: 'All Agents', suggestion: '@all' });
    }
    if ('everyone'.startsWith(normalized)) {
      suggestions.push({ id: 'everyone', name: 'Everyone', suggestion: '@everyone' });
    }

    // Add matching agents
    const matchingAgents = availableAgents
      .filter(agent => 
        agent.name.toLowerCase().includes(normalized) ||
        agent.id.toLowerCase().includes(normalized)
      )
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        suggestion: agent.name.includes(' ') ? `@"${agent.name}"` : `@${agent.name}`
      }));

    return [...suggestions, ...matchingAgents];
  }
}

export default MessageParser;

