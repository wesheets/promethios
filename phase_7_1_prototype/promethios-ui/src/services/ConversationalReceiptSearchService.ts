/**
 * Conversational Receipt Search Service
 * 
 * Handles natural language receipt search queries from users
 * Integrates with 69-field cryptographic audit logs for intelligent search
 */

import { universalGovernanceAdapter } from './UniversalGovernanceAdapter';

export interface ReceiptSearchQuery {
  originalQuery: string;
  keywords: string[];
  timeRange?: {
    start?: Date;
    end?: Date;
    relative?: 'hour' | 'day' | 'week' | 'month' | 'year';
  };
  toolTypes?: string[];
  statusFilter?: 'success' | 'failure' | 'partial' | 'all';
  trustScoreRange?: [number, number];
  categories?: ('operations' | 'research' | 'content')[];
  limit?: number;
}

export interface ReceiptSearchResult {
  receiptId: string;
  title: string;
  summary: string;
  timestamp: Date;
  toolType: string;
  category: string;
  status: 'success' | 'failure' | 'partial';
  trustScore: number;
  clickableLink: string;
  relevanceScore: number;
}

export interface ConversationalSearchResponse {
  success: boolean;
  query: ReceiptSearchQuery;
  results: ReceiptSearchResult[];
  totalFound: number;
  searchTime: number;
  suggestions?: string[];
  userMessage: string;
  agentResponse: string;
}

export class ConversationalReceiptSearchService {
  private static instance: ConversationalReceiptSearchService;

  public static getInstance(): ConversationalReceiptSearchService {
    if (!ConversationalReceiptSearchService.instance) {
      ConversationalReceiptSearchService.instance = new ConversationalReceiptSearchService();
    }
    return ConversationalReceiptSearchService.instance;
  }

  /**
   * Detect if a message contains a receipt search request
   */
  public detectReceiptSearchRequest(message: string): boolean {
    const patterns = [
      /search receipts?\+?\s/i,
      /find receipts?\+?\s/i,
      /look for receipts?\+?\s/i,
      /show me receipts?\+?\s/i,
      /get receipts?\+?\s/i
    ];

    return patterns.some(pattern => pattern.test(message));
  }

  /**
   * Parse natural language query into structured search parameters
   */
  public parseNaturalLanguageQuery(query: string): ReceiptSearchQuery {
    const cleanQuery = query.replace(/search receipts?\+?\s*/i, '').trim();
    
    const searchQuery: ReceiptSearchQuery = {
      originalQuery: query,
      keywords: [],
      limit: 10
    };

    // Extract keywords (remove common stop words)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'];
    const words = cleanQuery.toLowerCase().split(/\s+/).filter(word => 
      word.length > 2 && !stopWords.includes(word) && !/^\d+$/.test(word)
    );
    searchQuery.keywords = [...new Set(words)]; // Remove duplicates

    // Parse time ranges
    const timePatterns = [
      { pattern: /last\s+hour|past\s+hour/i, relative: 'hour' as const },
      { pattern: /today|last\s+day|past\s+day|yesterday/i, relative: 'day' as const },
      { pattern: /last\s+week|past\s+week|this\s+week/i, relative: 'week' as const },
      { pattern: /last\s+month|past\s+month|this\s+month/i, relative: 'month' as const },
      { pattern: /last\s+year|past\s+year|this\s+year/i, relative: 'year' as const }
    ];

    for (const { pattern, relative } of timePatterns) {
      if (pattern.test(cleanQuery)) {
        searchQuery.timeRange = { relative };
        break;
      }
    }

    // Parse tool types
    const toolPatterns = [
      { pattern: /web\s+search|search|research/i, types: ['web_search'] },
      { pattern: /document|file|pdf|doc/i, types: ['document_generation', 'file_operations'] },
      { pattern: /analysis|analyze|data/i, types: ['data_analysis', 'data_visualization'] },
      { pattern: /code|programming|coding/i, types: ['coding_programming'] },
      { pattern: /image|picture|photo/i, types: ['image_generation'] },
      { pattern: /workflow|automation|process/i, types: ['workflow_automation'] }
    ];

    const detectedTypes: string[] = [];
    for (const { pattern, types } of toolPatterns) {
      if (pattern.test(cleanQuery)) {
        detectedTypes.push(...types);
      }
    }
    if (detectedTypes.length > 0) {
      searchQuery.toolTypes = [...new Set(detectedTypes)];
    }

    // Parse status filters
    if (/failed|failure|error|unsuccessful/i.test(cleanQuery)) {
      searchQuery.statusFilter = 'failure';
    } else if (/success|successful|completed|done/i.test(cleanQuery)) {
      searchQuery.statusFilter = 'success';
    } else if (/partial|incomplete|pending/i.test(cleanQuery)) {
      searchQuery.statusFilter = 'partial';
    }

    // Parse trust score ranges
    const trustPatterns = [
      { pattern: /high\s+trust|trusted|reliable/i, range: [0.8, 1.0] as [number, number] },
      { pattern: /low\s+trust|untrusted|unreliable/i, range: [0.0, 0.5] as [number, number] },
      { pattern: /medium\s+trust|moderate/i, range: [0.5, 0.8] as [number, number] }
    ];

    for (const { pattern, range } of trustPatterns) {
      if (pattern.test(cleanQuery)) {
        searchQuery.trustScoreRange = range;
        break;
      }
    }

    // Parse categories
    const categoryPatterns = [
      { pattern: /tool|execution|operation/i, category: 'operations' as const },
      { pattern: /research|search|study|investigate/i, category: 'research' as const },
      { pattern: /document|content|file|create/i, category: 'content' as const }
    ];

    const detectedCategories: ('operations' | 'research' | 'content')[] = [];
    for (const { pattern, category } of categoryPatterns) {
      if (pattern.test(cleanQuery)) {
        detectedCategories.push(category);
      }
    }
    if (detectedCategories.length > 0) {
      searchQuery.categories = [...new Set(detectedCategories)];
    }

    return searchQuery;
  }

  /**
   * Execute the search using the Universal Governance Adapter
   */
  public async executeSearch(
    query: ReceiptSearchQuery, 
    agentId: string, 
    userId: string
  ): Promise<ReceiptSearchResult[]> {
    const startTime = Date.now();

    try {
      // Build search parameters for UGA
      const searchParams: any = {
        agentId,
        userId,
        limit: query.limit || 10,
        includeAllFields: true
      };

      // Add time range filter
      if (query.timeRange?.relative) {
        const now = new Date();
        const start = new Date();
        
        switch (query.timeRange.relative) {
          case 'hour':
            start.setHours(now.getHours() - 1);
            break;
          case 'day':
            start.setDate(now.getDate() - 1);
            break;
          case 'week':
            start.setDate(now.getDate() - 7);
            break;
          case 'month':
            start.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            start.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        searchParams.startTime = start.toISOString();
        searchParams.endTime = now.toISOString();
      }

      // Add tool type filter
      if (query.toolTypes && query.toolTypes.length > 0) {
        searchParams.toolTypes = query.toolTypes;
      }

      // Add status filter
      if (query.statusFilter && query.statusFilter !== 'all') {
        searchParams.status = query.statusFilter;
      }

      // Search audit logs via UGA
      const auditLogs = await universalGovernanceAdapter.searchAuditLogs(searchParams);

      // Convert audit logs to receipt search results
      const results: ReceiptSearchResult[] = auditLogs.map((log: any) => {
        const relevanceScore = this.calculateRelevanceScore(log, query);
        
        return {
          receiptId: log.interactionId || log.receiptId,
          title: this.generateReceiptTitle(log),
          summary: this.generateReceiptSummary(log),
          timestamp: new Date(log.timestamp),
          toolType: log.provider || log.toolName || 'unknown',
          category: this.categorizeReceipt(log),
          status: this.mapStatus(log.success, log.errorMessage),
          trustScore: log.trustScore || 0.5,
          clickableLink: this.generateClickableLink(log),
          relevanceScore
        };
      });

      // Sort by relevance score (highest first)
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return results;

    } catch (error) {
      console.error('❌ Receipt search failed:', error);
      return [];
    }
  }

  /**
   * Generate a conversational response for the user
   */
  public async processConversationalSearch(
    message: string,
    agentId: string,
    userId: string
  ): Promise<ConversationalSearchResponse> {
    const startTime = Date.now();
    
    try {
      // Parse the natural language query
      const query = this.parseNaturalLanguageQuery(message);
      
      // Execute the search
      const results = await this.executeSearch(query, agentId, userId);
      
      const searchTime = Date.now() - startTime;
      
      // Generate user-friendly response
      const userMessage = this.generateUserMessage(query, results);
      const agentResponse = this.generateAgentResponse(query, results);
      
      // Generate search suggestions
      const suggestions = this.generateSearchSuggestions(query, results);

      return {
        success: true,
        query,
        results,
        totalFound: results.length,
        searchTime,
        suggestions,
        userMessage,
        agentResponse
      };

    } catch (error) {
      console.error('❌ Conversational search failed:', error);
      
      return {
        success: false,
        query: { originalQuery: message, keywords: [] },
        results: [],
        totalFound: 0,
        searchTime: Date.now() - startTime,
        userMessage: 'Search failed due to an error.',
        agentResponse: '❌ I encountered an error while searching your receipts. Please try again with a different query.'
      };
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(auditLog: any, query: ReceiptSearchQuery): number {
    let score = 0;
    
    // Keyword matching in various fields
    const searchableText = [
      auditLog.inputMessage || '',
      auditLog.outputResponse || '',
      auditLog.toolName || '',
      auditLog.provider || '',
      JSON.stringify(auditLog.reasoningChain || {}),
      JSON.stringify(auditLog.cognitiveContext || {})
    ].join(' ').toLowerCase();

    // Score based on keyword matches
    const keywordMatches = query.keywords.filter(keyword => 
      searchableText.includes(keyword.toLowerCase())
    ).length;
    score += (keywordMatches / Math.max(query.keywords.length, 1)) * 50;

    // Boost recent items
    const age = Date.now() - new Date(auditLog.timestamp).getTime();
    const dayInMs = 24 * 60 * 60 * 1000;
    if (age < dayInMs) score += 20;
    else if (age < 7 * dayInMs) score += 10;
    else if (age < 30 * dayInMs) score += 5;

    // Boost high trust scores
    const trustScore = auditLog.trustScore || 0.5;
    score += trustScore * 20;

    // Boost successful operations
    if (auditLog.success) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Generate receipt title from audit log
   */
  private generateReceiptTitle(auditLog: any): string {
    const toolName = auditLog.toolName || auditLog.provider || 'Tool Execution';
    const action = auditLog.inputMessage || auditLog.actionType || 'Operation';
    
    // Truncate long actions
    const shortAction = action.length > 50 ? action.substring(0, 47) + '...' : action;
    
    return `${toolName}: ${shortAction}`;
  }

  /**
   * Generate receipt summary from audit log
   */
  private generateReceiptSummary(auditLog: any): string {
    const timestamp = new Date(auditLog.timestamp).toLocaleString();
    const status = auditLog.success ? '✅ Success' : '❌ Failed';
    const trustScore = Math.round((auditLog.trustScore || 0.5) * 100);
    
    return `${timestamp} • ${status} • Trust: ${trustScore}%`;
  }

  /**
   * Categorize receipt based on audit log data
   */
  private categorizeReceipt(auditLog: any): string {
    const toolName = (auditLog.toolName || auditLog.provider || '').toLowerCase();
    
    if (toolName.includes('search') || toolName.includes('research')) {
      return 'research';
    } else if (toolName.includes('document') || toolName.includes('file') || toolName.includes('generate')) {
      return 'content';
    } else {
      return 'operations';
    }
  }

  /**
   * Map audit log success status to receipt status
   */
  private mapStatus(success: boolean | undefined, errorMessage: string | undefined): 'success' | 'failure' | 'partial' {
    if (success === true) return 'success';
    if (success === false) return 'failure';
    if (errorMessage) return 'failure';
    return 'partial';
  }

  /**
   * Generate clickable link for receipt
   */
  private generateClickableLink(auditLog: any): string {
    const receiptId = auditLog.interactionId || auditLog.receiptId;
    return `🔗 **${this.generateReceiptTitle(auditLog)}**\n${this.generateReceiptSummary(auditLog)}\n*Click to continue this work...*`;
  }

  /**
   * Generate user-friendly message
   */
  private generateUserMessage(query: ReceiptSearchQuery, results: ReceiptSearchResult[]): string {
    const count = results.length;
    const timeDesc = query.timeRange?.relative ? `from the last ${query.timeRange.relative}` : '';
    const keywordDesc = query.keywords.length > 0 ? `matching "${query.keywords.join(', ')}"` : '';
    
    let message = `🔍 **Found ${count} receipt${count !== 1 ? 's' : ''}`;
    if (timeDesc) message += ` ${timeDesc}`;
    if (keywordDesc) message += ` ${keywordDesc}`;
    message += ':**\n\n';

    return message;
  }

  /**
   * Generate agent response with clickable receipt links
   */
  private generateAgentResponse(query: ReceiptSearchQuery, results: ReceiptSearchResult[]): string {
    if (results.length === 0) {
      return `🔍 I couldn't find any receipts matching "${query.originalQuery}". Try:\n\n• Using different keywords\n• Expanding the time range\n• Checking for typos\n• Using more general terms`;
    }

    let response = this.generateUserMessage(query, results);
    
    // Add top results as clickable links
    const topResults = results.slice(0, 5);
    topResults.forEach((result, index) => {
      response += `${result.clickableLink}\n\n`;
    });

    if (results.length > 5) {
      response += `*...and ${results.length - 5} more results. Try refining your search for more specific results.*\n\n`;
    }

    response += `💡 **Need help?** Try queries like:\n• "Search Receipts+ web searches about AI last week"\n• "Search Receipts+ failed tool executions yesterday"\n• "Search Receipts+ documents with high trust scores"`;

    return response;
  }

  /**
   * Generate search suggestions
   */
  private generateSearchSuggestions(query: ReceiptSearchQuery, results: ReceiptSearchResult[]): string[] {
    const suggestions: string[] = [];
    
    if (results.length === 0) {
      suggestions.push('Try using broader keywords');
      suggestions.push('Expand your time range');
      suggestions.push('Check for spelling errors');
    } else if (results.length > 20) {
      suggestions.push('Add more specific keywords to narrow results');
      suggestions.push('Specify a shorter time range');
      suggestions.push('Filter by tool type or status');
    }

    // Add contextual suggestions based on query
    if (!query.timeRange) {
      suggestions.push('Add time range like "last week" or "yesterday"');
    }
    
    if (!query.toolTypes || query.toolTypes.length === 0) {
      suggestions.push('Specify tool type like "web search" or "document"');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }
}

export const conversationalReceiptSearchService = ConversationalReceiptSearchService.getInstance();
export default conversationalReceiptSearchService;

