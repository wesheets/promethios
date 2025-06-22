// Agent Tool Auto-Discovery System
// Automatically detects agent capabilities through API introspection and runtime analysis

import { AgentTool, TOOL_CATALOG, calculateToolsetRiskScore } from './AgentToolsetService';

export interface AgentAPISpec {
  openapi?: string;
  info?: {
    title: string;
    version: string;
    description?: string;
  };
  paths?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
}

export interface ToolUsagePattern {
  toolId: string;
  frequency: number;
  lastUsed: Date;
  parameters: Record<string, any>[];
  successRate: number;
}

export interface AgentCapabilityProfile {
  agentId: string;
  discoveredTools: AgentTool[];
  usagePatterns: ToolUsagePattern[];
  riskScore: number;
  lastAnalyzed: Date;
  discoveryMethod: 'api_introspection' | 'runtime_analysis' | 'response_parsing' | 'manual';
  confidence: number; // 0-1 scale
}

// Tool detection patterns for API introspection
const TOOL_DETECTION_PATTERNS = {
  file_system: {
    endpoints: ['/files', '/upload', '/download', '/storage'],
    methods: ['POST', 'PUT', 'DELETE'],
    parameters: ['file', 'path', 'filename', 'content'],
    schemas: ['File', 'FileUpload', 'FileContent']
  },
  web_search: {
    endpoints: ['/search', '/query', '/web'],
    methods: ['GET', 'POST'],
    parameters: ['query', 'search', 'term', 'url'],
    schemas: ['SearchResult', 'WebContent']
  },
  browser_automation: {
    endpoints: ['/browser', '/navigate', '/click', '/form'],
    methods: ['POST', 'PUT'],
    parameters: ['url', 'selector', 'element', 'action'],
    schemas: ['BrowserAction', 'WebElement']
  },
  shell_execution: {
    endpoints: ['/execute', '/command', '/shell', '/terminal'],
    methods: ['POST'],
    parameters: ['command', 'script', 'args'],
    schemas: ['CommandResult', 'ExecutionOutput']
  },
  database_access: {
    endpoints: ['/database', '/query', '/sql', '/db'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    parameters: ['query', 'table', 'connection'],
    schemas: ['QueryResult', 'DatabaseConnection']
  },
  email_send: {
    endpoints: ['/email', '/send', '/mail'],
    methods: ['POST'],
    parameters: ['to', 'subject', 'body', 'recipients'],
    schemas: ['Email', 'EmailMessage']
  },
  image_generation: {
    endpoints: ['/generate', '/image', '/create'],
    methods: ['POST'],
    parameters: ['prompt', 'style', 'size', 'format'],
    schemas: ['ImageGeneration', 'GeneratedImage']
  },
  data_analysis: {
    endpoints: ['/analyze', '/data', '/statistics', '/chart'],
    methods: ['POST'],
    parameters: ['data', 'analysis', 'visualization'],
    schemas: ['DataAnalysis', 'Chart', 'Statistics']
  }
};

// Response parsing patterns to detect tool usage
const RESPONSE_PARSING_PATTERNS = {
  file_system: [
    /created file|wrote to|saved file|file uploaded/i,
    /reading file|file content|downloaded/i,
    /deleted file|removed file/i
  ],
  web_search: [
    /searched for|search results|found \d+ results/i,
    /web search|google search|bing search/i
  ],
  browser_automation: [
    /navigated to|clicked on|filled form/i,
    /browser action|web automation/i
  ],
  shell_execution: [
    /executed command|ran script|shell output/i,
    /command result|terminal output/i
  ],
  image_generation: [
    /generated image|created image|image prompt/i,
    /dall-e|midjourney|stable diffusion/i
  ]
};

export class AgentToolDiscovery {
  private discoveredProfiles: Map<string, AgentCapabilityProfile> = new Map();

  /**
   * Analyze agent API specification to detect available tools
   */
  async analyzeAgentAPI(agentId: string, apiSpec: AgentAPISpec): Promise<AgentTool[]> {
    const detectedTools: AgentTool[] = [];
    
    if (!apiSpec.paths) {
      return detectedTools;
    }

    // Analyze API endpoints
    for (const [path, pathSpec] of Object.entries(apiSpec.paths)) {
      for (const [method, methodSpec] of Object.entries(pathSpec)) {
        const toolId = this.detectToolFromEndpoint(path, method, methodSpec);
        if (toolId) {
          const tool = TOOL_CATALOG.find(t => t.id === toolId);
          if (tool && !detectedTools.find(dt => dt.id === toolId)) {
            detectedTools.push(tool);
          }
        }
      }
    }

    // Analyze schemas for additional tool indicators
    if (apiSpec.components?.schemas) {
      for (const [schemaName, schema] of Object.entries(apiSpec.components.schemas)) {
        const toolId = this.detectToolFromSchema(schemaName, schema);
        if (toolId) {
          const tool = TOOL_CATALOG.find(t => t.id === toolId);
          if (tool && !detectedTools.find(dt => dt.id === toolId)) {
            detectedTools.push(tool);
          }
        }
      }
    }

    // Update capability profile
    this.updateCapabilityProfile(agentId, detectedTools, 'api_introspection');

    return detectedTools;
  }

  /**
   * Analyze agent response to detect tool usage
   */
  analyzeAgentResponse(agentId: string, response: string): string[] {
    const detectedTools: string[] = [];

    for (const [toolId, patterns] of Object.entries(RESPONSE_PARSING_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(response)) {
          detectedTools.push(toolId);
          break;
        }
      }
    }

    // Update usage patterns
    this.updateUsagePatterns(agentId, detectedTools);

    return detectedTools;
  }

  /**
   * Monitor real-time tool usage during agent execution
   */
  recordToolUsage(agentId: string, toolId: string, parameters: any, success: boolean): void {
    const profile = this.discoveredProfiles.get(agentId);
    if (!profile) return;

    // Find or create usage pattern
    let pattern = profile.usagePatterns.find(p => p.toolId === toolId);
    if (!pattern) {
      pattern = {
        toolId,
        frequency: 0,
        lastUsed: new Date(),
        parameters: [],
        successRate: 1
      };
      profile.usagePatterns.push(pattern);
    }

    // Update pattern
    pattern.frequency++;
    pattern.lastUsed = new Date();
    pattern.parameters.push(parameters);
    pattern.successRate = (pattern.successRate * (pattern.frequency - 1) + (success ? 1 : 0)) / pattern.frequency;

    // Add tool to discovered tools if not already present
    const tool = TOOL_CATALOG.find(t => t.id === toolId);
    if (tool && !profile.discoveredTools.find(dt => dt.id === toolId)) {
      profile.discoveredTools.push(tool);
      profile.riskScore = calculateToolsetRiskScore(profile.discoveredTools);
    }
  }

  /**
   * Get comprehensive capability profile for an agent
   */
  getAgentCapabilityProfile(agentId: string): AgentCapabilityProfile | null {
    return this.discoveredProfiles.get(agentId) || null;
  }

  /**
   * Generate tool recommendations based on usage patterns
   */
  generateToolRecommendations(agentId: string): string[] {
    const profile = this.discoveredProfiles.get(agentId);
    if (!profile) return [];

    const recommendations: string[] = [];

    // Analyze usage patterns
    const highUsageTools = profile.usagePatterns.filter(p => p.frequency > 10);
    const lowSuccessTools = profile.usagePatterns.filter(p => p.successRate < 0.8);

    if (highUsageTools.length > 0) {
      recommendations.push(`High usage detected for: ${highUsageTools.map(t => t.toolId).join(', ')}`);
    }

    if (lowSuccessTools.length > 0) {
      recommendations.push(`Low success rate for: ${lowSuccessTools.map(t => t.toolId).join(', ')}`);
    }

    if (profile.riskScore > 7) {
      recommendations.push('High-risk tool combination detected - consider additional governance');
    }

    return recommendations;
  }

  /**
   * Auto-discover tools for multiple agents
   */
  async discoverToolsForAgents(agents: Array<{ id: string; apiEndpoint?: string }>): Promise<Map<string, AgentTool[]>> {
    const results = new Map<string, AgentTool[]>();

    for (const agent of agents) {
      try {
        if (agent.apiEndpoint) {
          // Try to fetch API spec
          const apiSpec = await this.fetchAgentAPISpec(agent.apiEndpoint);
          const tools = await this.analyzeAgentAPI(agent.id, apiSpec);
          results.set(agent.id, tools);
        } else {
          // Use runtime analysis only
          results.set(agent.id, []);
        }
      } catch (error) {
        console.warn(`Failed to discover tools for agent ${agent.id}:`, error);
        results.set(agent.id, []);
      }
    }

    return results;
  }

  private detectToolFromEndpoint(path: string, method: string, spec: any): string | null {
    for (const [toolId, pattern] of Object.entries(TOOL_DETECTION_PATTERNS)) {
      // Check endpoint patterns
      if (pattern.endpoints.some(endpoint => path.toLowerCase().includes(endpoint))) {
        return toolId;
      }

      // Check method patterns
      if (pattern.methods.includes(method.toUpperCase())) {
        // Check parameter patterns
        const parameters = spec.parameters || [];
        if (parameters.some((param: any) => 
          pattern.parameters.some(p => param.name?.toLowerCase().includes(p))
        )) {
          return toolId;
        }
      }
    }

    return null;
  }

  private detectToolFromSchema(schemaName: string, schema: any): string | null {
    for (const [toolId, pattern] of Object.entries(TOOL_DETECTION_PATTERNS)) {
      if (pattern.schemas.some(s => schemaName.toLowerCase().includes(s.toLowerCase()))) {
        return toolId;
      }
    }

    return null;
  }

  private updateCapabilityProfile(
    agentId: string, 
    tools: AgentTool[], 
    method: AgentCapabilityProfile['discoveryMethod']
  ): void {
    let profile = this.discoveredProfiles.get(agentId);
    
    if (!profile) {
      profile = {
        agentId,
        discoveredTools: [],
        usagePatterns: [],
        riskScore: 0,
        lastAnalyzed: new Date(),
        discoveryMethod: method,
        confidence: method === 'api_introspection' ? 0.9 : 0.7
      };
      this.discoveredProfiles.set(agentId, profile);
    }

    // Merge tools
    for (const tool of tools) {
      if (!profile.discoveredTools.find(dt => dt.id === tool.id)) {
        profile.discoveredTools.push(tool);
      }
    }

    profile.riskScore = calculateToolsetRiskScore(profile.discoveredTools);
    profile.lastAnalyzed = new Date();
  }

  private updateUsagePatterns(agentId: string, toolIds: string[]): void {
    const profile = this.discoveredProfiles.get(agentId);
    if (!profile) return;

    for (const toolId of toolIds) {
      this.recordToolUsage(agentId, toolId, {}, true);
    }
  }

  private async fetchAgentAPISpec(endpoint: string): Promise<AgentAPISpec> {
    try {
      // Try common API spec endpoints
      const specEndpoints = [
        `${endpoint}/openapi.json`,
        `${endpoint}/swagger.json`,
        `${endpoint}/api-docs`,
        `${endpoint}/docs/json`
      ];

      for (const specEndpoint of specEndpoints) {
        try {
          const response = await fetch(specEndpoint);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          // Continue to next endpoint
        }
      }

      throw new Error('No API specification found');
    } catch (error) {
      console.warn(`Failed to fetch API spec from ${endpoint}:`, error);
      return {};
    }
  }
}

// Global instance
export const agentToolDiscovery = new AgentToolDiscovery();

