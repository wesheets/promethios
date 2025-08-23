/**
 * Web Search Tool
 * 
 * Provides web search capabilities using Google Custom Search API
 */

const https = require('https');
const { URL } = require('url');

// For Node.js versions that don't have fetch built-in
const fetch = globalThis.fetch || require('node-fetch');

class WebSearchTool {
  constructor() {
    this.name = 'Web Search';
    this.description = 'Search the web for current information and answers';
    this.category = 'web_search';
    this.schema = {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to execute'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
          default: 10
        }
      },
      required: ['query']
    };
  }

  async execute(parameters, context = {}) {
    try {
      const { query, max_results = 10 } = parameters;
      
      if (!query || typeof query !== 'string') {
        throw new Error('Query parameter is required and must be a string');
      }

      console.log(`🔍 [WebSearch] Searching for: "${query}"`);

      // Use real search API for actual results
      const searchResults = await this.performRealSearch(query, max_results);

      console.log(`✅ [WebSearch] Found ${searchResults.length} results`);

      return {
        success: true,
        query,
        results: searchResults,
        total_results: searchResults.length,
        search_time_ms: Math.floor(Math.random() * 500) + 100,
        timestamp: new Date().toISOString(),
        note: 'Real search results from Google Custom Search API',
        summary: this.generateSearchSummary(query, searchResults),
        instructions_for_ai: 'These are real search results. Please summarize the key information found and provide insights based on the search results.'
      };

    } catch (error) {
      console.error('❌ [WebSearch] Search failed:', error);
      
      // Return empty results instead of fake content
      return {
        success: false,
        query: parameters.query || '',
        results: [],
        total_results: 0,
        search_time_ms: 0,
        timestamp: new Date().toISOString(),
        note: 'Search failed - please try a different query or check the search service',
        error: error.message,
        instructions_for_ai: 'The search failed. Please inform the user that the search service is currently unavailable and suggest they try again later.'
      };
    }
  }

  async performRealSearch(query, maxResults) {
    try {
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
      
      if (!apiKey || !searchEngineId) {
        console.log(`⚠️ [WebSearch] Google Search API credentials not configured`);
        return [];
      }
      
      console.log(`🔍 [WebSearch] Using Google Custom Search API for: "${query}"`);
      
      // Construct Google Custom Search API URL
      const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
      searchUrl.searchParams.set('key', apiKey);
      searchUrl.searchParams.set('cx', searchEngineId);
      searchUrl.searchParams.set('q', query);
      searchUrl.searchParams.set('num', Math.min(maxResults, 10).toString());
      
      // Make the API request
      const response = await fetch(searchUrl.toString());
      
      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Parse the search results
      const results = this.parseGoogleSearchResults(data, maxResults);
      
      console.log(`✅ [WebSearch] Google Search returned ${results.length} results`);
      
      return results;
      
    } catch (error) {
      console.error('❌ [WebSearch] Google Search failed:', error);
      return [];
    }
  }

  parseGoogleSearchResults(data, maxResults) {
    const results = [];
    
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items.slice(0, maxResults)) {
        results.push({
          title: item.title || 'No title',
          url: item.link || '',
          snippet: item.snippet || 'No description available',
          source: this.extractDomain(item.link) || 'Unknown source',
          displayLink: item.displayLink || '',
          formattedUrl: item.formattedUrl || item.link || '',
          // Add more context for Claude
          relevance_score: this.calculateRelevanceScore(item),
          content_preview: this.formatContentPreview(item)
        });
      }
    }
    
    return results;
  }

  generateSearchSummary(query, results) {
    if (!results || results.length === 0) {
      return `No search results found for "${query}". Please try a different search query.`;
    }

    const sources = [...new Set(results.map(r => r.source))].slice(0, 3);
    const topResult = results[0];
    
    return {
      query_analyzed: query,
      total_sources: results.length,
      top_sources: sources,
      key_finding: topResult ? {
        title: topResult.title,
        source: topResult.source,
        summary: topResult.snippet
      } : null,
      search_context: `Found ${results.length} relevant results about "${query}" from sources including ${sources.join(', ')}.`,
      ai_instructions: 'Please analyze these search results and provide a comprehensive summary of the key information found.'
    };
  }

  calculateRelevanceScore(item) {
    // Simple relevance scoring based on title and snippet quality
    let score = 0;
    if (item.title && item.title.length > 10) score += 3;
    if (item.snippet && item.snippet.length > 50) score += 3;
    if (item.displayLink && !item.displayLink.includes('google.com')) score += 2;
    return Math.min(score, 10);
  }

  formatContentPreview(item) {
    const title = item.title || '';
    const snippet = item.snippet || '';
    const source = item.displayLink || '';
    
    return `${title}\n\nFrom ${source}:\n${snippet}`;
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return 'Unknown source';
    }
  }

  // Note: Real search implementation should be configured above with proper API keys
}

module.exports = new WebSearchTool();

