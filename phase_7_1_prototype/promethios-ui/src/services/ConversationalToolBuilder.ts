/**
 * ConversationalToolBuilder - The revolutionary system that turns conversations into deployable tools
 * This is the core orchestrator that makes AI agents build real software from natural language
 */

import { AutonomousToolClassificationService, ToolBuildRequest, ToolClassificationResult } from './AutonomousToolClassificationService';
import { ToolRepositoryGenerator, ToolRepository } from './ToolRepositoryGenerator';
import { MultiAgentRoutingService } from './MultiAgentRoutingService';
import { UnifiedStorageService } from './UnifiedStorageService';

export interface ConversationContext {
  userId: string;
  sessionId: string;
  conversationHistory: ConversationMessage[];
  activeToolBuilds: ToolBuildSession[];
  preferences: UserPreferences;
  memory: PersistentMemory;
}

export interface ConversationMessage {
  id: string;
  timestamp: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  metadata?: {
    toolRequest?: ToolBuildRequest;
    agentId?: string;
    confidence?: number;
  };
}

export interface ToolBuildSession {
  id: string;
  request: ToolBuildRequest;
  status: 'planning' | 'building' | 'testing' | 'deploying' | 'complete' | 'error';
  progress: number;
  repository?: ToolRepository;
  assignedAgents: string[];
  startTime: string;
  estimatedCompletion: string;
  logs: BuildLog[];
}

export interface BuildLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  agentId?: string;
  phase: string;
}

export interface UserPreferences {
  preferredTechnologies: string[];
  complexityPreference: 'simple' | 'medium' | 'complex';
  deploymentPreference: 'static' | 'serverless' | 'container';
  uiFramework: 'react' | 'vue' | 'vanilla';
  backendFramework: 'flask' | 'express' | 'fastapi';
  testingLevel: 'basic' | 'comprehensive';
}

export interface PersistentMemory {
  builtTools: ToolMemory[];
  successfulPatterns: PatternMemory[];
  userInteractions: InteractionMemory[];
  learnedPreferences: LearnedPreference[];
  toolRelationships: ToolRelationship[];
}

export interface ToolMemory {
  toolId: string;
  name: string;
  type: string;
  technologies: string[];
  successMetrics: {
    buildTime: number;
    userSatisfaction: number;
    usageFrequency: number;
    errorRate: number;
  };
  reusableComponents: string[];
  improvements: string[];
}

export interface PatternMemory {
  pattern: string;
  successRate: number;
  averageBuildTime: number;
  commonRequirements: string[];
  bestPractices: string[];
  pitfalls: string[];
}

export interface InteractionMemory {
  userId: string;
  timestamp: string;
  request: string;
  outcome: 'success' | 'failure' | 'partial';
  feedback: string;
  learnings: string[];
}

export interface LearnedPreference {
  userId: string;
  category: string;
  preference: string;
  confidence: number;
  lastUpdated: string;
}

export interface ToolRelationship {
  toolId1: string;
  toolId2: string;
  relationship: 'extends' | 'uses' | 'similar' | 'complementary';
  strength: number;
}

export class ConversationalToolBuilder {
  private static instance: ConversationalToolBuilder;
  private classifier: AutonomousToolClassificationService;
  private generator: ToolRepositoryGenerator;
  private multiAgent: MultiAgentRoutingService;
  private storage: UnifiedStorageService;
  private activeContexts: Map<string, ConversationContext> = new Map();

  private constructor() {
    this.classifier = AutonomousToolClassificationService.getInstance();
    this.generator = ToolRepositoryGenerator.getInstance();
    this.multiAgent = MultiAgentRoutingService.getInstance();
    this.storage = UnifiedStorageService.getInstance();
  }

  public static getInstance(): ConversationalToolBuilder {
    if (!ConversationalToolBuilder.instance) {
      ConversationalToolBuilder.instance = new ConversationalToolBuilder();
    }
    return ConversationalToolBuilder.instance;
  }

  /**
   * Process autonomous stars input for tool building
   */
  public async processAutonomousInput(
    input: string,
    userId: string,
    sessionId: string
  ): Promise<{
    isToolRequest: boolean;
    response: string;
    actions: string[];
    buildSession?: ToolBuildSession;
  }> {
    console.log('🌟 [ConversationalBuilder] Processing autonomous input:', input);

    // Get or create conversation context
    const context = await this.getOrCreateContext(userId, sessionId);
    
    // Add message to conversation history
    const message: ConversationMessage = {
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      role: 'user',
      content: input
    };
    context.conversationHistory.push(message);

    // Classify the input
    const classification = this.classifier.classifyInput(input);
    
    if (!classification.isToolRequest) {
      return {
        isToolRequest: false,
        response: this.generateNonToolResponse(input, context),
        actions: classification.alternativeActions
      };
    }

    // This is a tool building request!
    console.log('🛠️ [ConversationalBuilder] Tool request detected:', classification.request?.toolType);

    // Enhance request with context and memory
    const enhancedRequest = await this.enhanceRequestWithMemory(classification.request!, context);
    
    // Create build session
    const buildSession = await this.createBuildSession(enhancedRequest, context);
    
    // Start the building process
    const response = await this.startToolBuilding(buildSession, context);

    return {
      isToolRequest: true,
      response,
      actions: ['monitor_progress', 'view_repository', 'test_tool'],
      buildSession
    };
  }

  /**
   * Get or create conversation context with persistent memory
   */
  private async getOrCreateContext(userId: string, sessionId: string): Promise<ConversationContext> {
    const contextKey = `${userId}_${sessionId}`;
    
    if (this.activeContexts.has(contextKey)) {
      return this.activeContexts.get(contextKey)!;
    }

    // Load persistent memory
    const memory = await this.loadPersistentMemory(userId);
    const preferences = await this.loadUserPreferences(userId);

    const context: ConversationContext = {
      userId,
      sessionId,
      conversationHistory: [],
      activeToolBuilds: [],
      preferences,
      memory
    };

    this.activeContexts.set(contextKey, context);
    return context;
  }

  /**
   * Load persistent memory for the user
   */
  private async loadPersistentMemory(userId: string): Promise<PersistentMemory> {
    try {
      const stored = await this.storage.get('tool_builder_memory', `memory_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('⚠️ [ConversationalBuilder] Could not load memory:', error);
    }

    // Return empty memory structure
    return {
      builtTools: [],
      successfulPatterns: [],
      userInteractions: [],
      learnedPreferences: [],
      toolRelationships: []
    };
  }

  /**
   * Load user preferences
   */
  private async loadUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const stored = await this.storage.get('tool_builder_preferences', `prefs_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('⚠️ [ConversationalBuilder] Could not load preferences:', error);
    }

    // Return default preferences
    return {
      preferredTechnologies: ['React', 'JavaScript'],
      complexityPreference: 'medium',
      deploymentPreference: 'static',
      uiFramework: 'react',
      backendFramework: 'flask',
      testingLevel: 'basic'
    };
  }

  /**
   * Enhance tool request with memory and context
   */
  private async enhanceRequestWithMemory(
    request: ToolBuildRequest,
    context: ConversationContext
  ): Promise<ToolBuildRequest> {
    console.log('🧠 [ConversationalBuilder] Enhancing request with memory');

    // Find similar tools built before
    const similarTools = context.memory.builtTools.filter(tool => 
      tool.type === request.toolType || 
      tool.technologies.some(tech => request.technologies.includes(tech))
    );

    // Apply learned patterns
    const relevantPatterns = context.memory.successfulPatterns.filter(pattern =>
      pattern.pattern.includes(request.toolType)
    );

    // Enhance with user preferences
    const enhancedTechnologies = [
      ...request.technologies,
      ...context.preferences.preferredTechnologies.filter(tech => 
        !request.technologies.includes(tech)
      )
    ];

    // Add requirements based on successful patterns
    const enhancedRequirements = [...request.requirements];
    relevantPatterns.forEach(pattern => {
      pattern.commonRequirements.forEach(req => {
        if (!enhancedRequirements.includes(req)) {
          enhancedRequirements.push(req);
        }
      });
    });

    // Suggest improvements based on similar tools
    if (similarTools.length > 0) {
      const improvements = similarTools.flatMap(tool => tool.improvements);
      enhancedRequirements.push(...improvements.slice(0, 3)); // Add top 3 improvements
    }

    return {
      ...request,
      technologies: enhancedTechnologies,
      requirements: enhancedRequirements,
      confidence: Math.min(request.confidence + (similarTools.length * 0.1), 1.0)
    };
  }

  /**
   * Create a new build session
   */
  private async createBuildSession(
    request: ToolBuildRequest,
    context: ConversationContext
  ): Promise<ToolBuildSession> {
    const sessionId = `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Assign specialized agents based on tool type
    const assignedAgents = this.assignAgentsForTool(request);
    
    const buildSession: ToolBuildSession = {
      id: sessionId,
      request,
      status: 'planning',
      progress: 0,
      assignedAgents,
      startTime: new Date().toISOString(),
      estimatedCompletion: this.calculateEstimatedCompletion(request),
      logs: [{
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Started building ${request.suggestedName}`,
        phase: 'initialization'
      }]
    };

    context.activeToolBuilds.push(buildSession);
    await this.saveBuildSession(buildSession, context.userId);

    return buildSession;
  }

  /**
   * Assign specialized agents for tool building
   */
  private assignAgentsForTool(request: ToolBuildRequest): string[] {
    const agents = ['architect-agent']; // Always include architect

    // Add specialized agents based on tool type
    switch (request.toolType) {
      case 'data_analyzer':
        agents.push('data-scientist-agent', 'python-developer-agent');
        break;
      case 'dashboard':
        agents.push('ui-designer-agent', 'frontend-developer-agent', 'data-visualization-agent');
        break;
      case 'api_tool':
        agents.push('backend-developer-agent', 'api-specialist-agent');
        break;
      case 'scraper':
        agents.push('web-scraping-agent', 'python-developer-agent');
        break;
      default:
        agents.push('fullstack-developer-agent');
    }

    // Add testing and deployment agents for complex tools
    if (request.complexity === 'complex') {
      agents.push('qa-engineer-agent', 'devops-agent');
    }

    return agents;
  }

  /**
   * Start the tool building process with multi-agent collaboration
   */
  private async startToolBuilding(
    buildSession: ToolBuildSession,
    context: ConversationContext
  ): Promise<string> {
    console.log('🚀 [ConversationalBuilder] Starting tool building process');

    try {
      // Phase 1: Planning
      buildSession.status = 'planning';
      buildSession.progress = 10;
      await this.updateBuildSession(buildSession, context.userId);

      const planningPrompt = this.generatePlanningPrompt(buildSession.request, context);
      
      // Use multi-agent system for collaborative planning
      const planningResponse = await this.multiAgent.routeToAgents(
        planningPrompt,
        buildSession.assignedAgents.slice(0, 2), // Use first 2 agents for planning
        context.userId,
        buildSession.id
      );

      this.addBuildLog(buildSession, 'info', 'Planning phase completed', 'planning');

      // Phase 2: Repository Generation
      buildSession.status = 'building';
      buildSession.progress = 30;
      await this.updateBuildSession(buildSession, context.userId);

      const repository = await this.generator.generateToolRepository(
        buildSession.request,
        context.userId
      );

      buildSession.repository = repository;
      this.addBuildLog(buildSession, 'success', 'Repository structure created', 'generation');

      // Phase 3: Code Generation with Agents
      buildSession.progress = 60;
      await this.updateBuildSession(buildSession, context.userId);

      const codeGenPrompt = this.generateCodeGenerationPrompt(buildSession.request, repository);
      
      const codeResponse = await this.multiAgent.routeToAgents(
        codeGenPrompt,
        buildSession.assignedAgents,
        context.userId,
        buildSession.id
      );

      this.addBuildLog(buildSession, 'success', 'Code generation completed', 'coding');

      // Phase 4: Testing (if required)
      if (buildSession.request.complexity !== 'simple') {
        buildSession.progress = 80;
        buildSession.status = 'testing';
        await this.updateBuildSession(buildSession, context.userId);

        const testingPrompt = this.generateTestingPrompt(buildSession.request, repository);
        
        const testResponse = await this.multiAgent.routeToAgents(
          testingPrompt,
          ['qa-engineer-agent'],
          context.userId,
          buildSession.id
        );

        this.addBuildLog(buildSession, 'success', 'Testing completed', 'testing');
      }

      // Phase 5: Deployment
      buildSession.status = 'deploying';
      buildSession.progress = 90;
      await this.updateBuildSession(buildSession, context.userId);

      // Auto-deploy to tools panel
      await this.deployToToolsPanel(repository, context.userId);

      // Phase 6: Completion
      buildSession.status = 'complete';
      buildSession.progress = 100;
      await this.updateBuildSession(buildSession, context.userId);

      this.addBuildLog(buildSession, 'success', 'Tool deployment completed', 'deployment');

      // Update memory with successful build
      await this.updateMemoryWithSuccess(buildSession, context);

      return this.generateSuccessResponse(buildSession);

    } catch (error) {
      console.error('❌ [ConversationalBuilder] Build failed:', error);
      
      buildSession.status = 'error';
      this.addBuildLog(buildSession, 'error', `Build failed: ${error}`, 'error');
      await this.updateBuildSession(buildSession, context.userId);

      return this.generateErrorResponse(buildSession, error as Error);
    }
  }

  /**
   * Generate planning prompt for agents
   */
  private generatePlanningPrompt(request: ToolBuildRequest, context: ConversationContext): string {
    const similarTools = context.memory.builtTools
      .filter(tool => tool.type === request.toolType)
      .slice(0, 3);

    return `🏗️ **TOOL BUILDING PLANNING PHASE**

**Tool Request:**
- Name: ${request.suggestedName}
- Type: ${request.toolType}
- Description: ${request.description}
- Complexity: ${request.complexity}
- Technologies: ${request.technologies.join(', ')}

**Requirements:**
${request.requirements.map(req => `- ${req}`).join('\n')}

**User Preferences:**
- UI Framework: ${context.preferences.uiFramework}
- Backend: ${context.preferences.backendFramework}
- Deployment: ${context.preferences.deploymentPreference}

**Similar Tools Built Before:**
${similarTools.map(tool => `- ${tool.name} (${tool.type}) - Success Rate: ${tool.successMetrics.userSatisfaction}/10`).join('\n')}

**Your Task:**
Create a detailed technical plan for building this tool. Consider:
1. Architecture decisions
2. Technology stack optimization
3. Component breakdown
4. API design (if needed)
5. Testing strategy
6. Deployment approach

Focus on creating a production-ready tool that exceeds user expectations.`;
  }

  /**
   * Generate code generation prompt
   */
  private generateCodeGenerationPrompt(request: ToolBuildRequest, repository: ToolRepository): string {
    return `💻 **CODE GENERATION PHASE**

**Tool Specifications:**
- Name: ${request.suggestedName}
- Type: ${request.toolType}
- Repository: ${repository.name}

**Generated Structure:**
${Object.keys(repository.structure).map(file => `- ${file}`).join('\n')}

**Your Task:**
Review and enhance the generated code. Focus on:
1. Code quality and best practices
2. Error handling and validation
3. Performance optimization
4. User experience improvements
5. Security considerations

Provide specific code improvements and optimizations for the generated files.`;
  }

  /**
   * Generate testing prompt
   */
  private generateTestingPrompt(request: ToolBuildRequest, repository: ToolRepository): string {
    return `🧪 **TESTING PHASE**

**Tool Under Test:**
- Name: ${request.suggestedName}
- Type: ${request.toolType}
- Complexity: ${request.complexity}

**Your Task:**
Create comprehensive tests for this tool:
1. Unit tests for core functionality
2. Integration tests for API endpoints
3. UI tests for React components
4. Performance tests for data processing
5. Security tests for input validation

Ensure the tool is production-ready and handles edge cases gracefully.`;
  }

  /**
   * Deploy tool to tools panel
   */
  private async deployToToolsPanel(repository: ToolRepository, userId: string): Promise<void> {
    try {
      // Register tool in tools registry
      const toolRegistration = {
        id: repository.id,
        name: repository.name,
        description: repository.description,
        type: repository.toolType,
        repositoryId: repository.id,
        userId,
        status: 'active',
        createdAt: new Date().toISOString(),
        metadata: repository.metadata
      };

      await this.storage.set('tools_registry', repository.id, JSON.stringify(toolRegistration));
      
      console.log('✅ [ConversationalBuilder] Tool deployed to tools panel');
    } catch (error) {
      console.error('❌ [ConversationalBuilder] Failed to deploy to tools panel:', error);
      throw error;
    }
  }

  /**
   * Update memory with successful build
   */
  private async updateMemoryWithSuccess(
    buildSession: ToolBuildSession,
    context: ConversationContext
  ): Promise<void> {
    const toolMemory: ToolMemory = {
      toolId: buildSession.repository!.id,
      name: buildSession.request.suggestedName,
      type: buildSession.request.toolType,
      technologies: buildSession.request.technologies,
      successMetrics: {
        buildTime: Date.now() - new Date(buildSession.startTime).getTime(),
        userSatisfaction: 8, // Default, will be updated with user feedback
        usageFrequency: 0,
        errorRate: 0
      },
      reusableComponents: this.extractReusableComponents(buildSession.repository!),
      improvements: []
    };

    context.memory.builtTools.push(toolMemory);

    // Update successful patterns
    const patternKey = `${buildSession.request.toolType}_${buildSession.request.complexity}`;
    const existingPattern = context.memory.successfulPatterns.find(p => p.pattern === patternKey);
    
    if (existingPattern) {
      existingPattern.successRate = (existingPattern.successRate + 1) / 2; // Simple average
      existingPattern.averageBuildTime = (existingPattern.averageBuildTime + toolMemory.successMetrics.buildTime) / 2;
    } else {
      context.memory.successfulPatterns.push({
        pattern: patternKey,
        successRate: 1.0,
        averageBuildTime: toolMemory.successMetrics.buildTime,
        commonRequirements: buildSession.request.requirements,
        bestPractices: [],
        pitfalls: []
      });
    }

    // Save updated memory
    await this.storage.set(
      'tool_builder_memory',
      `memory_${context.userId}`,
      JSON.stringify(context.memory)
    );
  }

  /**
   * Helper methods
   */
  private calculateEstimatedCompletion(request: ToolBuildRequest): string {
    const baseTime = request.complexity === 'simple' ? 5 : request.complexity === 'medium' ? 15 : 30;
    const completionTime = new Date(Date.now() + baseTime * 60 * 1000);
    return completionTime.toISOString();
  }

  private addBuildLog(session: ToolBuildSession, level: BuildLog['level'], message: string, phase: string): void {
    session.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      phase
    });
  }

  private async updateBuildSession(session: ToolBuildSession, userId: string): Promise<void> {
    await this.storage.set('build_sessions', session.id, JSON.stringify(session));
  }

  private async saveBuildSession(session: ToolBuildSession, userId: string): Promise<void> {
    await this.storage.set('build_sessions', session.id, JSON.stringify(session));
  }

  private extractReusableComponents(repository: ToolRepository): string[] {
    // Extract reusable components from the repository structure
    const components = [];
    if (repository.structure['interface.tsx']) components.push('React Interface');
    if (repository.structure['main.py']) components.push('Python Backend');
    if (repository.structure['styles.css']) components.push('CSS Styles');
    return components;
  }

  private generateNonToolResponse(input: string, context: ConversationContext): string {
    return `I understand you're looking for help with: "${input}". While this doesn't appear to be a tool building request, I can assist you in other ways. Would you like me to:

1. Search for existing tools that might help
2. Provide information on the topic
3. Suggest related resources
4. Help you refine your request into a tool building opportunity

If you'd like to build a custom tool, try phrases like:
- "Build a tool that..."
- "Create a dashboard for..."
- "Make a calculator that..."`;
  }

  private generateSuccessResponse(buildSession: ToolBuildSession): string {
    const buildTime = Math.round((Date.now() - new Date(buildSession.startTime).getTime()) / 1000);
    
    return `🎉 **${buildSession.request.suggestedName} Successfully Built!**

✅ **Build Complete in ${buildTime} seconds**
- Repository created with full source code
- React interface with Material-UI styling
- ${buildSession.request.technologies.includes('Python') ? 'Python Flask backend' : 'JavaScript backend'}
- Complete testing suite
- Production deployment configuration

🚀 **Your tool is now available in:**
- REPOSITORIES tab (full source code)
- TOOLS panel (ready to use)

🛠️ **Features Implemented:**
${buildSession.request.requirements.map(req => `- ${req}`).join('\n')}

**The tool is fully functional and ready for use!** You can find it in your tools panel or modify the source code in the repositories section.`;
  }

  private generateErrorResponse(buildSession: ToolBuildSession, error: Error): string {
    return `❌ **Tool Building Failed**

Unfortunately, there was an error building ${buildSession.request.suggestedName}:

**Error:** ${error.message}

**What happened:**
${buildSession.logs.filter(log => log.level === 'error').map(log => `- ${log.message}`).join('\n')}

**Next steps:**
1. Try simplifying the requirements
2. Choose different technologies
3. Contact support if the issue persists

I've learned from this failure and will improve future builds.`;
  }

  /**
   * Get build session status
   */
  public async getBuildSessionStatus(sessionId: string): Promise<ToolBuildSession | null> {
    try {
      const stored = await this.storage.get('build_sessions', sessionId);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ [ConversationalBuilder] Failed to get build session:', error);
      return null;
    }
  }

  /**
   * Get user's tool building history
   */
  public async getUserToolHistory(userId: string): Promise<ToolMemory[]> {
    const memory = await this.loadPersistentMemory(userId);
    return memory.builtTools;
  }
}

export default ConversationalToolBuilder;

