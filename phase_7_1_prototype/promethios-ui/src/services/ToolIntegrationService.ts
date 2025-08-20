/**
 * Tool Integration Service
 * 
 * Bridges the gap between the existing tool system and the chat interface.
 * Converts tool definitions to AI-compatible schemas and handles tool execution.
 */

import { AVAILABLE_TOOLS, DEFAULT_ENABLED_TOOLS, ToolConfiguration } from '../types/ToolTypes';
import { API_BASE_URL } from '../config/api';
import ComprehensiveToolReceiptExtension, { ComprehensiveToolAction } from '../extensions/ComprehensiveToolReceiptExtension';

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string;
}

export interface AIToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

class ToolIntegrationService {
  private enabledTools: ToolConfiguration[] = [];
  private receiptExtension: ComprehensiveToolReceiptExtension;

  constructor() {
    this.initializeDefaultTools();
    this.receiptExtension = new ComprehensiveToolReceiptExtension();
  }

  /**
   * Load available tools from backend
   */
  async loadAvailableTools(): Promise<void> {
    try {
      console.log('🛠️ [ToolIntegration] Loading available tools from backend...');
      
      const response = await fetch(`${API_BASE_URL}/api/tools/available`);
      if (!response.ok) {
        throw new Error(`Failed to load tools: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load tools');
      }
      
      // Convert backend tools to frontend format
      this.enabledTools = result.tools.map((tool: any) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        enabled: tool.enabled,
        tier: 'basic',
        riskLevel: 2,
        permissions: ['execute'],
        governanceRules: {
          requiresApproval: false,
          auditRequired: true,
          restrictedEnvironments: []
        }
      }));
      
      console.log(`✅ [ToolIntegration] Loaded ${this.enabledTools.length} tools from backend`);
      
    } catch (error) {
      console.error('❌ [ToolIntegration] Failed to load tools from backend:', error);
      // Fall back to default tools if backend fails
      this.initializeDefaultTools();
    }
  }

  /**
   * Load tool schemas from backend
   */
  async loadToolSchemas(): Promise<AIToolSchema[]> {
    try {
      console.log('🛠️ [ToolIntegration] Loading tool schemas from backend...');
      
      const response = await fetch(`${API_BASE_URL}/api/tools/schemas`);
      if (!response.ok) {
        throw new Error(`Failed to load schemas: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load schemas');
      }
      
      console.log(`✅ [ToolIntegration] Loaded ${result.schemas.length} tool schemas from backend`);
      return result.schemas;
      
    } catch (error) {
      console.error('❌ [ToolIntegration] Failed to load schemas from backend:', error);
      // Fall back to generated schemas
      return this.generateToolSchemas();
    }
  }

  /**
   * Initialize with default enabled tools (fallback)
   */
  private initializeDefaultTools(): void {
    this.enabledTools = AVAILABLE_TOOLS.filter(tool => 
      DEFAULT_ENABLED_TOOLS.includes(tool.id) || tool.enabled
    );
    console.log(`🛠️ [ToolIntegration] Initialized with ${this.enabledTools.length} default tools`);
  }

  /**
   * Get enabled tools for an agent
   */
  getEnabledTools(agentId?: string): ToolConfiguration[] {
    // TODO: In the future, load agent-specific tool configurations
    return this.enabledTools;
  }

  /**
   * Convert tool definitions to OpenAI function calling schemas
   */
  generateToolSchemas(agentId?: string): AIToolSchema[] {
    const enabledTools = this.getEnabledTools(agentId);
    
    return enabledTools.map(tool => this.convertToolToSchema(tool));
  }

  /**
   * Convert a single tool to AI schema format
   */
  private convertToolToSchema(tool: ToolConfiguration): AIToolSchema {
    const parameters = this.generateToolParameters(tool);
    
    return {
      type: 'function',
      function: {
        name: tool.id,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: parameters.properties,
          required: parameters.required
        }
      }
    };
  }

  /**
   * Generate parameters for each tool type
   */
  private generateToolParameters(tool: ToolConfiguration): {
    properties: Record<string, any>;
    required: string[];
  } {
    switch (tool.id) {
      case 'web_search':
        return {
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

      case 'document_generation':
        return {
          properties: {
            content: {
              type: 'string',
              description: 'The content to include in the document'
            },
            format: {
              type: 'string',
              enum: ['pdf', 'docx', 'txt'],
              description: 'The document format to generate',
              default: 'pdf'
            },
            title: {
              type: 'string',
              description: 'The document title'
            }
          },
          required: ['content']
        };

      case 'data_visualization':
        return {
          properties: {
            data: {
              type: 'array',
              description: 'The data to visualize'
            },
            chart_type: {
              type: 'string',
              enum: ['bar', 'line', 'pie', 'scatter'],
              description: 'The type of chart to create',
              default: 'bar'
            },
            title: {
              type: 'string',
              description: 'The chart title'
            }
          },
          required: ['data', 'chart_type']
        };

      case 'coding_programming':
        return {
          properties: {
            code: {
              type: 'string',
              description: 'The code to execute'
            },
            language: {
              type: 'string',
              enum: ['python', 'javascript', 'typescript', 'html', 'css', 'sql'],
              description: 'The programming language',
              default: 'python'
            },
            description: {
              type: 'string',
              description: 'Description of what the code does'
            }
          },
          required: ['code', 'language']
        };

      default:
        return {
          properties: {
            input: {
              type: 'string',
              description: 'Input for the tool'
            }
          },
          required: ['input']
        };
    }
  }

  /**
   * Execute a tool call via the backend API
   */
  async executeToolCall(toolCall: ToolCall, userMessage: string, governanceContext: any = {}): Promise<ToolResult> {
    const startTime = Date.now();
    let executionResult: any = null;
    let executionError: Error | null = null;
    
    try {
      console.log(`🔧 [ToolIntegration] Executing tool: ${toolCall.function.name}`);
      
      const parameters = JSON.parse(toolCall.function.arguments);
      
      const response = await fetch(`${API_BASE_URL}/api/tools/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool_id: toolCall.function.name,
          parameters: parameters,
          user_message: userMessage,
          governance_context: governanceContext
        })
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Tool execution failed');
      }

      executionResult = result.data;
      console.log(`✅ [ToolIntegration] Tool executed successfully: ${toolCall.function.name}`);
      
      // Generate receipt for successful tool execution
      await this.generateToolExecutionReceipt(toolCall, parameters, executionResult, startTime, governanceContext);
      
      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify(result.data)
      };

    } catch (error) {
      executionError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ [ToolIntegration] Tool execution failed:`, error);
      
      // Generate receipt for failed tool execution
      await this.generateToolExecutionReceipt(toolCall, JSON.parse(toolCall.function.arguments), null, startTime, governanceContext, executionError);
      
      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify({
          error: executionError.message,
          success: false
        })
      };
    }
  }

  /**
   * Generate receipt for tool execution
   */
  private async generateToolExecutionReceipt(
    toolCall: ToolCall, 
    parameters: any, 
    result: any, 
    startTime: number, 
    governanceContext: any = {},
    error?: Error
  ): Promise<void> {
    try {
      console.log(`🧾 [ToolIntegration] Generating receipt for ${toolCall.function.name}`);
      
      // Create comprehensive tool action
      const toolAction: ComprehensiveToolAction = {
        id: toolCall.id,
        toolName: toolCall.function.name,
        actionType: this.getActionType(toolCall.function.name),
        parameters,
        userIntent: this.extractUserIntent(parameters),
        expectedOutcome: this.generateExpectedOutcome(toolCall.function.name, parameters),
        businessContext: {
          department: governanceContext.department || 'operations',
          useCase: this.getUseCase(toolCall.function.name),
          customerImpact: this.assessCustomerImpact(toolCall.function.name),
          dataClassification: governanceContext.dataClassification || 'internal',
          regulatoryScope: this.getRegulatoryScope(toolCall.function.name),
          businessValue: this.calculateBusinessValue(toolCall.function.name, result)
        },
        toolCategory: this.getToolCategory(toolCall.function.name),
        riskLevel: this.assessRiskLevel(toolCall.function.name, parameters),
        complianceRequirements: this.getComplianceRequirements(toolCall.function.name),
        dataClassification: governanceContext.dataClassification || 'internal',
        sessionId: governanceContext.sessionId || 'current-session'
      };

      // Prepare execution result
      const executionResult = error ? {
        error: error.message,
        success: false,
        execution_time: Date.now() - startTime
      } : {
        ...result,
        success: true,
        execution_time: Date.now() - startTime
      };

      // Generate the receipt
      const receipt = await this.receiptExtension.generateEnhancedToolReceipt(
        governanceContext.agentId || 'current-agent',
        toolAction,
        executionResult
      );

      console.log(`✅ [ToolIntegration] Receipt generated: ${receipt.receiptId}`);
      
    } catch (receiptError) {
      console.error(`❌ [ToolIntegration] Failed to generate receipt:`, receiptError);
      // Don't throw - receipt generation failure shouldn't break tool execution
    }
  }

  /**
   * Helper methods for receipt generation
   */
  private getActionType(toolName: string): string {
    const actionMap: Record<string, string> = {
      'web_search': 'web_search',
      'document_generation': 'document_generation',
      'data_visualization': 'data_visualization',
      'coding_programming': 'coding_programming'
    };
    return actionMap[toolName] || toolName;
  }

  private getToolCategory(toolName: string): 'communication' | 'crm' | 'ecommerce' | 'financial' | 'data' | 'file' | 'web' | 'ai' | 'security' | 'integration' | 'collaboration' | 'workflow' | 'governance' | 'learning' {
    const categoryMap: Record<string, any> = {
      // Core tool categories
      'web_search': 'web',
      'document_generation': 'ai',
      'data_visualization': 'data',
      'coding_programming': 'ai',
      
      // Collaboration tools
      'meeting_summary': 'collaboration',
      'team_communication': 'collaboration',
      'stakeholder_interaction': 'collaboration',
      'workflow_handoff': 'collaboration',
      
      // Workflow tools
      'process_completion': 'workflow',
      'automation_trigger': 'workflow',
      'pipeline_execution': 'workflow',
      'scheduled_task': 'workflow',
      
      // Governance tools
      'policy_compliance': 'governance',
      'security_scan': 'governance',
      'audit_trail': 'governance',
      'risk_assessment': 'governance',
      
      // Learning tools
      'model_training': 'learning',
      'knowledge_update': 'learning',
      'pattern_recognition': 'learning',
      'behavior_adaptation': 'learning',
      
      // Integration tools
      'api_call': 'integration',
      'data_sync': 'integration',
      'third_party_service': 'integration',
      'system_health': 'integration'
    };
    return categoryMap[toolName] || 'integration';
  }

  private extractUserIntent(parameters: any): string {
    return parameters.userIntent || parameters.description || parameters.query || 'Execute tool operation';
  }

  private generateExpectedOutcome(toolName: string, parameters: any): string {
    switch (toolName) {
      case 'web_search':
        return `Search for "${parameters.query}" and return relevant results`;
      case 'document_generation':
        return `Generate document: ${parameters.title || 'Untitled Document'}`;
      case 'data_visualization':
        return `Create ${parameters.chart_type || 'chart'} visualization`;
      case 'coding_programming':
        return `Execute ${parameters.language || 'code'} program`;
      default:
        return `Execute ${toolName} with provided parameters`;
    }
  }

  private getUseCase(toolName: string): string {
    const useCaseMap: Record<string, string> = {
      'web_search': 'research',
      'document_generation': 'content_creation',
      'data_visualization': 'data_analysis',
      'coding_programming': 'automation'
    };
    return useCaseMap[toolName] || 'general_operation';
  }

  private assessCustomerImpact(toolName: string): 'low' | 'medium' | 'high' {
    const impactMap: Record<string, any> = {
      'web_search': 'low',
      'document_generation': 'medium',
      'data_visualization': 'medium',
      'coding_programming': 'high'
    };
    return impactMap[toolName] || 'low';
  }

  private getRegulatoryScope(toolName: string): string[] {
    const scopeMap: Record<string, string[]> = {
      'web_search': ['GDPR'],
      'document_generation': ['GDPR', 'HIPAA'],
      'data_visualization': ['GDPR', 'SOX'],
      'coding_programming': ['GDPR', 'SOX', 'HIPAA']
    };
    return scopeMap[toolName] || ['GDPR'];
  }

  private calculateBusinessValue(toolName: string, result: any): number {
    // Simple business value calculation based on tool type and result
    const baseValues: Record<string, number> = {
      'web_search': 0.3,
      'document_generation': 0.7,
      'data_visualization': 0.8,
      'coding_programming': 0.9
    };
    
    const baseValue = baseValues[toolName] || 0.5;
    
    // Adjust based on result quality
    if (result && result.success) {
      return Math.min(1.0, baseValue + 0.2);
    }
    
    return baseValue;
  }

  private assessRiskLevel(toolName: string, parameters: any): number {
    const riskMap: Record<string, number> = {
      'web_search': 2,
      'document_generation': 3,
      'data_visualization': 4,
      'coding_programming': 7
    };
    
    let risk = riskMap[toolName] || 5;
    
    // Adjust based on parameters
    if (parameters.sensitive_data) risk += 2;
    if (parameters.external_access) risk += 1;
    
    return Math.min(10, risk);
  }

  private getComplianceRequirements(toolName: string): string[] {
    const complianceMap: Record<string, string[]> = {
      'web_search': ['GDPR'],
      'document_generation': ['GDPR', 'HIPAA'],
      'data_visualization': ['GDPR', 'SOX'],
      'coding_programming': ['GDPR', 'SOX', 'HIPAA']
    };
    return complianceMap[toolName] || ['GDPR'];
  }

  /**
   * Parse tool calls from AI response
   */
  parseToolCalls(response: string): ToolCall[] {
    // This is a simple implementation - in practice, you'd use the AI model's
    // native tool calling format (like OpenAI's function calling)
    const toolCalls: ToolCall[] = [];
    
    // Look for tool call patterns in the response
    const toolCallRegex = /\[TOOL_CALL:(\w+)\]\s*({[^}]+})/g;
    let match;
    
    while ((match = toolCallRegex.exec(response)) !== null) {
      const toolName = match[1];
      const argumentsStr = match[2];
      
      toolCalls.push({
        id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'function',
        function: {
          name: toolName,
          arguments: argumentsStr
        }
      });
    }
    
    return toolCalls;
  }

  /**
   * Generate tool instructions for system message
   */
  generateToolInstructions(agentId?: string): string {
    const enabledTools = this.getEnabledTools(agentId);
    
    if (enabledTools.length === 0) {
      return '';
    }

    const toolDescriptions = enabledTools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n');

    return `
You have access to the following tools:

${toolDescriptions}

To use a tool, respond with a function call in the standard format. The system will execute the tool and provide you with the results.

Available tools are governed by compliance policies and may require approval for certain operations.
`;
  }
}

// Export the class and singleton instance
export { ToolIntegrationService };
export const toolIntegrationService = new ToolIntegrationService();

