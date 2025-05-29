/**
 * AtlasChatIPProtection.ts
 * 
 * Service for ensuring intellectual property protection in ATLAS Chat responses,
 * filtering sensitive implementation details while providing informative explanations.
 */

export interface IPProtectionConfig {
  sensitiveTerms: string[];
  sensitivePatterns: RegExp[];
  allowedExplanationLevels: {
    public: string[];
    authenticated: string[];
    developer: string[];
  };
}

class AtlasChatIPProtection {
  private config: IPProtectionConfig;
  
  constructor(config?: Partial<IPProtectionConfig>) {
    // Default configuration with sensitive terms and patterns
    this.config = {
      sensitiveTerms: [
        // Implementation details
        'algorithm implementation',
        'proprietary algorithm',
        'internal architecture',
        'code structure',
        'system architecture details',
        'backend implementation',
        'technical specification',
        'internal API',
        'private endpoint',
        
        // Business logic
        'business logic',
        'pricing model',
        'revenue strategy',
        'partnership details',
        'acquisition strategy',
        
        // Security details
        'security implementation',
        'encryption method',
        'authentication mechanism',
        'security architecture',
        'vulnerability',
        'exploit',
        'penetration test',
        
        // Development roadmap
        'unreleased feature',
        'product roadmap',
        'future release',
        'development timeline',
        'unannounced product',
        
        // Specific Promethios IP
        'PRISM implementation',
        'VIGIL enforcement mechanism',
        'constitutional embedding',
        'belief trace algorithm',
        'governance vector',
        'trust score calculation',
        'intervention mechanism',
        'verification protocol implementation'
      ],
      
      sensitivePatterns: [
        // Code patterns
        /function\s+\w+\s*\([^)]*\)\s*{/,
        /class\s+\w+(\s+extends\s+\w+)?\s*{/,
        /const\s+\w+\s*=\s*require\(/,
        /import\s+.*\s+from\s+/,
        
        // Configuration patterns
        /apiKey\s*:\s*["']/,
        /password\s*:\s*["']/,
        /secret\s*:\s*["']/,
        /token\s*:\s*["']/,
        
        // Internal URL patterns
        /https?:\/\/internal\./,
        /https?:\/\/private\./,
        /https?:\/\/dev\./,
        /https?:\/\/staging\./,
        
        // Version patterns for unreleased versions
        /version\s*:\s*["']0\.\d+\.\d+["']/,
        /v\d+\.\d+\.\d+-alpha/,
        /v\d+\.\d+\.\d+-beta/,
        /v\d+\.\d+\.\d+-rc/
      ],
      
      // Allowed explanation levels for different user types
      allowedExplanationLevels: {
        public: [
          'concept',
          'purpose',
          'benefit',
          'analogy',
          'example',
          'high-level-process'
        ],
        authenticated: [
          'concept',
          'purpose',
          'benefit',
          'analogy',
          'example',
          'high-level-process',
          'metric-explanation',
          'governance-principle',
          'scorecard-interpretation'
        ],
        developer: [
          'concept',
          'purpose',
          'benefit',
          'analogy',
          'example',
          'high-level-process',
          'metric-explanation',
          'governance-principle',
          'scorecard-interpretation',
          'api-usage',
          'integration-guide',
          'public-interface'
        ]
      }
    };
    
    // Override with provided config if any
    if (config) {
      this.config = {
        ...this.config,
        ...config,
        allowedExplanationLevels: {
          ...this.config.allowedExplanationLevels,
          ...(config.allowedExplanationLevels || {})
        }
      };
    }
  }
  
  /**
   * Check if a response contains sensitive information
   */
  containsSensitiveInformation(text: string): boolean {
    // Check for sensitive terms
    for (const term of this.config.sensitiveTerms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        return true;
      }
    }
    
    // Check for sensitive patterns
    for (const pattern of this.config.sensitivePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Filter sensitive information from a response
   */
  filterSensitiveInformation(text: string): string {
    let filteredText = text;
    
    // Replace sensitive terms with appropriate alternatives
    for (const term of this.config.sensitiveTerms) {
      const regex = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '[governance mechanism]');
    }
    
    // Replace sensitive patterns
    for (const pattern of this.config.sensitivePatterns) {
      filteredText = filteredText.replace(pattern, '[protected information]');
    }
    
    return filteredText;
  }
  
  /**
   * Check if an explanation level is allowed for a user type
   */
  isExplanationAllowed(explanationLevel: string, userType: 'public' | 'authenticated' | 'developer'): boolean {
    return this.config.allowedExplanationLevels[userType].includes(explanationLevel);
  }
  
  /**
   * Get allowed explanation levels for a user type
   */
  getAllowedExplanationLevels(userType: 'public' | 'authenticated' | 'developer'): string[] {
    return this.config.allowedExplanationLevels[userType];
  }
  
  /**
   * Generate an appropriate response when sensitive information is requested
   */
  generateProtectedResponse(requestedTopic: string, userType: 'public' | 'authenticated' | 'developer'): string {
    if (userType === 'developer') {
      return `I understand you're interested in ${requestedTopic}. While I can't share specific implementation details as they're proprietary to Promethios, I can explain the general approach, public interfaces, and integration guidelines. What specific aspect would you like to know more about?`;
    } else if (userType === 'authenticated') {
      return `I understand you're interested in ${requestedTopic}. I can explain how this works at a high level and what benefits it provides, but I can't share specific implementation details as they're proprietary to Promethios. Would you like me to explain the concept and its benefits?`;
    } else {
      return `I understand you're interested in ${requestedTopic}. I can explain what this is and why it's important using analogies and examples, but I can't share specific details about how it's implemented. Would you like me to explain the concept in general terms?`;
    }
  }
  
  /**
   * Process a response to ensure IP protection
   */
  processResponse(response: string, userType: 'public' | 'authenticated' | 'developer' = 'public'): string {
    // Check if response contains sensitive information
    if (this.containsSensitiveInformation(response)) {
      // Filter sensitive information
      return this.filterSensitiveInformation(response);
    }
    
    return response;
  }
  
  /**
   * Escape special characters for RegExp
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default AtlasChatIPProtection;
