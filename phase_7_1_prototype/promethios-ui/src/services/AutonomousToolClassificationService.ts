/**
 * AutonomousToolClassificationService - Intelligent classification of tool building requests
 * Part of the revolutionary conversational tool builder system
 */

export interface ToolBuildRequest {
  type: 'TOOL_BUILD_REQUEST';
  toolType: string;
  description: string;
  requirements: string[];
  suggestedName: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: string;
  technologies: string[];
  confidence: number;
}

export interface ToolClassificationResult {
  isToolRequest: boolean;
  request?: ToolBuildRequest;
  suggestions: string[];
  alternativeActions: string[];
}

export class AutonomousToolClassificationService {
  private static instance: AutonomousToolClassificationService;

  // Tool building patterns and keywords
  private readonly TOOL_PATTERNS = [
    // Direct tool requests
    /build\s+(a\s+)?tool\s+(that|to|for)/i,
    /create\s+(a\s+)?tool\s+(that|to|for)/i,
    /make\s+(a\s+)?tool\s+(that|to|for)/i,
    /develop\s+(a\s+)?tool\s+(that|to|for)/i,
    
    // Specific tool types
    /build\s+(a\s+)?(tracker|analyzer|dashboard|monitor|converter|calculator)/i,
    /create\s+(a\s+)?(tracker|analyzer|dashboard|monitor|converter|calculator)/i,
    /make\s+(a\s+)?(tracker|analyzer|dashboard|monitor|converter|calculator)/i,
    
    // Functional requests that imply tools
    /i\s+need\s+(something|a\s+way)\s+to\s+(track|analyze|monitor|convert|calculate)/i,
    /can\s+you\s+(build|create|make)\s+(something|a\s+tool)\s+to/i,
    /help\s+me\s+(build|create|make)\s+(a\s+tool|something)\s+to/i,
  ];

  private readonly TOOL_TYPES = {
    'data_analyzer': {
      keywords: ['analyze', 'analysis', 'data', 'csv', 'excel', 'statistics', 'insights'],
      description: 'Data Analysis Tool',
      complexity: 'medium' as const,
      technologies: ['Python', 'Pandas', 'React', 'Charts.js']
    },
    'tracker': {
      keywords: ['track', 'tracking', 'monitor', 'monitoring', 'portfolio', 'progress'],
      description: 'Tracking Tool',
      complexity: 'simple' as const,
      technologies: ['React', 'LocalStorage', 'Charts.js']
    },
    'converter': {
      keywords: ['convert', 'conversion', 'transform', 'format', 'translate'],
      description: 'Conversion Tool',
      complexity: 'simple' as const,
      technologies: ['JavaScript', 'React']
    },
    'dashboard': {
      keywords: ['dashboard', 'overview', 'summary', 'metrics', 'kpi', 'visualization'],
      description: 'Dashboard Tool',
      complexity: 'complex' as const,
      technologies: ['React', 'D3.js', 'API Integration', 'Real-time Updates']
    },
    'calculator': {
      keywords: ['calculate', 'calculator', 'compute', 'math', 'formula'],
      description: 'Calculator Tool',
      complexity: 'simple' as const,
      technologies: ['JavaScript', 'React', 'Math.js']
    },
    'scraper': {
      keywords: ['scrape', 'scraping', 'extract', 'crawl', 'web data', 'harvest'],
      description: 'Web Scraping Tool',
      complexity: 'complex' as const,
      technologies: ['Python', 'BeautifulSoup', 'Selenium', 'API']
    },
    'api_tool': {
      keywords: ['api', 'integration', 'connect', 'fetch', 'service', 'endpoint'],
      description: 'API Integration Tool',
      complexity: 'medium' as const,
      technologies: ['JavaScript', 'React', 'Axios', 'API Keys']
    },
    'automation': {
      keywords: ['automate', 'automation', 'schedule', 'workflow', 'batch', 'process'],
      description: 'Automation Tool',
      complexity: 'complex' as const,
      technologies: ['Python', 'Cron', 'Webhooks', 'Task Queue']
    }
  };

  private constructor() {}

  public static getInstance(): AutonomousToolClassificationService {
    if (!AutonomousToolClassificationService.instance) {
      AutonomousToolClassificationService.instance = new AutonomousToolClassificationService();
    }
    return AutonomousToolClassificationService.instance;
  }

  /**
   * Classify user input to determine if it's a tool building request
   */
  public classifyInput(input: string): ToolClassificationResult {
    console.log('🔍 [ToolClassification] Analyzing input:', input);

    const isToolRequest = this.isToolBuildingRequest(input);
    
    if (!isToolRequest) {
      return {
        isToolRequest: false,
        suggestions: this.generateGeneralSuggestions(input),
        alternativeActions: this.generateAlternativeActions(input)
      };
    }

    const toolRequest = this.extractToolRequest(input);
    const suggestions = this.generateToolSuggestions(toolRequest);

    console.log('✅ [ToolClassification] Tool request detected:', toolRequest.toolType);

    return {
      isToolRequest: true,
      request: toolRequest,
      suggestions,
      alternativeActions: []
    };
  }

  /**
   * Check if input matches tool building patterns
   */
  private isToolBuildingRequest(input: string): boolean {
    return this.TOOL_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Extract detailed tool request information
   */
  private extractToolRequest(input: string): ToolBuildRequest {
    const toolType = this.identifyToolType(input);
    const requirements = this.extractRequirements(input);
    const suggestedName = this.generateToolName(input, toolType);
    const complexity = this.TOOL_TYPES[toolType]?.complexity || 'medium';
    const technologies = this.TOOL_TYPES[toolType]?.technologies || ['JavaScript', 'React'];

    return {
      type: 'TOOL_BUILD_REQUEST',
      toolType,
      description: input.trim(),
      requirements,
      suggestedName,
      complexity,
      estimatedTime: this.estimateTime(complexity),
      technologies,
      confidence: this.calculateConfidence(input, toolType)
    };
  }

  /**
   * Identify the type of tool being requested
   */
  private identifyToolType(input: string): string {
    const inputLower = input.toLowerCase();
    
    // Find the tool type with the highest keyword match score
    let bestMatch = 'api_tool'; // Default
    let bestScore = 0;

    for (const [type, config] of Object.entries(this.TOOL_TYPES)) {
      const score = config.keywords.reduce((acc, keyword) => {
        return acc + (inputLower.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = type;
      }
    }

    return bestMatch;
  }

  /**
   * Extract specific requirements from the input
   */
  private extractRequirements(input: string): string[] {
    const requirements: string[] = [];
    const inputLower = input.toLowerCase();

    // Common requirement patterns
    const requirementPatterns = [
      { pattern: /real[- ]?time/i, requirement: 'Real-time updates' },
      { pattern: /dashboard|visualization/i, requirement: 'Visual dashboard' },
      { pattern: /api|integration/i, requirement: 'API integration' },
      { pattern: /export|download/i, requirement: 'Export functionality' },
      { pattern: /alert|notification/i, requirement: 'Alert system' },
      { pattern: /schedule|cron/i, requirement: 'Scheduled execution' },
      { pattern: /database|storage/i, requirement: 'Data persistence' },
      { pattern: /mobile|responsive/i, requirement: 'Mobile-friendly interface' },
      { pattern: /chart|graph|plot/i, requirement: 'Data visualization' },
      { pattern: /csv|excel|spreadsheet/i, requirement: 'Spreadsheet support' }
    ];

    requirementPatterns.forEach(({ pattern, requirement }) => {
      if (pattern.test(input)) {
        requirements.push(requirement);
      }
    });

    // If no specific requirements found, add basic ones
    if (requirements.length === 0) {
      requirements.push('User-friendly interface', 'Basic functionality');
    }

    return requirements;
  }

  /**
   * Generate a suggested tool name
   */
  private generateToolName(input: string, toolType: string): string {
    const inputWords = input.toLowerCase().split(/\s+/);
    const toolConfig = this.TOOL_TYPES[toolType];
    
    // Extract key subject words
    const subjectWords = inputWords.filter(word => 
      !['build', 'create', 'make', 'tool', 'that', 'to', 'for', 'a', 'an', 'the'].includes(word) &&
      word.length > 2
    );

    if (subjectWords.length > 0) {
      const subject = subjectWords[0];
      return `${subject.charAt(0).toUpperCase() + subject.slice(1)} ${toolConfig?.description || 'Tool'}`;
    }

    return toolConfig?.description || 'Custom Tool';
  }

  /**
   * Estimate development time based on complexity
   */
  private estimateTime(complexity: 'simple' | 'medium' | 'complex'): string {
    switch (complexity) {
      case 'simple': return '5-10 minutes';
      case 'medium': return '10-20 minutes';
      case 'complex': return '20-30 minutes';
      default: return '10-15 minutes';
    }
  }

  /**
   * Calculate confidence score for tool classification
   */
  private calculateConfidence(input: string, toolType: string): number {
    const inputLower = input.toLowerCase();
    const toolConfig = this.TOOL_TYPES[toolType];
    
    let confidence = 0.5; // Base confidence

    // Boost confidence for direct tool patterns
    if (this.TOOL_PATTERNS.some(pattern => pattern.test(input))) {
      confidence += 0.3;
    }

    // Boost confidence for keyword matches
    const keywordMatches = toolConfig?.keywords.filter(keyword => 
      inputLower.includes(keyword)
    ).length || 0;
    
    confidence += (keywordMatches / (toolConfig?.keywords.length || 1)) * 0.2;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate tool-specific suggestions
   */
  private generateToolSuggestions(request: ToolBuildRequest): string[] {
    const suggestions = [
      `Create ${request.suggestedName} with ${request.technologies.join(', ')}`,
      `Build repository structure for ${request.toolType}`,
      `Generate UI components for ${request.suggestedName}`,
      `Add testing framework for tool validation`,
      `Create documentation for ${request.suggestedName}`
    ];

    // Add complexity-specific suggestions
    if (request.complexity === 'complex') {
      suggestions.push(
        `Set up advanced architecture for ${request.suggestedName}`,
        `Implement error handling and logging`,
        `Add configuration management`
      );
    }

    return suggestions;
  }

  /**
   * Generate general suggestions for non-tool requests
   */
  private generateGeneralSuggestions(input: string): string[] {
    return [
      'Continue with current conversation',
      'Ask for clarification',
      'Provide information on the topic',
      'Suggest related resources'
    ];
  }

  /**
   * Generate alternative actions for non-tool requests
   */
  private generateAlternativeActions(input: string): string[] {
    return [
      'Search for existing tools',
      'Provide tutorial or guide',
      'Suggest workflow improvements',
      'Connect to relevant services'
    ];
  }

  /**
   * Get available tool types for suggestions
   */
  public getAvailableToolTypes(): Array<{type: string, description: string, complexity: string}> {
    return Object.entries(this.TOOL_TYPES).map(([type, config]) => ({
      type,
      description: config.description,
      complexity: config.complexity
    }));
  }
}

export default AutonomousToolClassificationService;

