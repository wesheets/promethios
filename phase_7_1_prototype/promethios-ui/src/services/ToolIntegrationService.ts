/**
 * Tool Integration Service
 * 
 * Bridges the gap between the existing tool system and the chat interface.
 * Converts tool definitions to AI-compatible schemas and handles tool execution.
 */

import { AVAILABLE_TOOLS, DEFAULT_ENABLED_TOOLS, ToolConfiguration } from '../types/ToolTypes';
import { API_BASE_URL } from '../config/api';

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

  constructor() {
    this.initializeDefaultTools();
  }

  /**
   * Initialize with default enabled tools
   */
  private initializeDefaultTools(): void {
    this.enabledTools = AVAILABLE_TOOLS.filter(tool => 
      DEFAULT_ENABLED_TOOLS.includes(tool.id) || tool.enabled
    );
    console.log(`🛠️ [ToolIntegration] Initialized with ${this.enabledTools.length} enabled tools`);
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

      console.log(`✅ [ToolIntegration] Tool executed successfully: ${toolCall.function.name}`);
      
      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify(result.data)
      };

    } catch (error) {
      console.error(`❌ [ToolIntegration] Tool execution failed:`, error);
      
      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })
      };
    }
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

// Export singleton instance
export const toolIntegrationService = new ToolIntegrationService();

