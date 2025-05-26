/**
 * Wrapper Templates for Promethios Agent Wrapping
 * 
 * This module provides templates for generating wrappers for different
 * agent frameworks to integrate with Promethios governance.
 */

import { Schema } from '../../schemas/types';
import { GovernanceHook } from '../detection/schema_analyzer';

/**
 * Represents a wrapper template for a specific agent framework
 */
export interface WrapperTemplate {
  id: string;
  name: string;
  description: string;
  frameworkIds: string[];
  templateFiles: TemplateFile[];
  configOptions: TemplateConfigOption[];
}

/**
 * Represents a template file for code generation
 */
export interface TemplateFile {
  path: string;
  content: string;
  isExecutable: boolean;
  isOptional: boolean;
  description: string;
}

/**
 * Represents a configuration option for a wrapper template
 */
export interface TemplateConfigOption {
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'enum';
  default: any;
  required: boolean;
  options?: string[]; // For enum type
}

/**
 * Configuration for wrapper generation
 */
export interface WrapperGenerationConfig {
  agentCode: string;
  framework: string;
  inputSchema: Schema;
  outputSchema: Schema;
  memorySchema?: Schema;
  governanceHooks: GovernanceHook[];
  templateId: string;
  outputDir: string;
  configOptions: Record<string, any>;
}

/**
 * Registry of available wrapper templates
 */
export const WRAPPER_TEMPLATES: WrapperTemplate[] = [
  // LangChain template
  {
    id: 'langchain-basic',
    name: 'LangChain Basic Wrapper',
    description: 'Basic wrapper for LangChain agents and chains',
    frameworkIds: ['langchain'],
    templateFiles: [
      {
        path: 'wrapper.ts',
        content: getLangChainWrapperTemplate(),
        isExecutable: false,
        isOptional: false,
        description: 'Main wrapper implementation',
      },
      {
        path: 'schemas.ts',
        content: getLangChainSchemasTemplate(),
        isExecutable: false,
        isOptional: false,
        description: 'Schema definitions',
      },
      {
        path: 'README.md',
        content: getLangChainReadmeTemplate(),
        isExecutable: false,
        isOptional: true,
        description: 'Usage documentation',
      },
    ],
    configOptions: [
      {
        id: 'trackMemory',
        name: 'Track Memory',
        description: 'Enable memory tracking for the agent',
        type: 'boolean',
        default: true,
        required: false,
      },
      {
        id: 'trackDecisions',
        name: 'Track Decisions',
        description: 'Enable decision tracking for the agent',
        type: 'boolean',
        default: true,
        required: false,
      },
      {
        id: 'strictValidation',
        name: 'Strict Validation',
        description: 'Enable strict schema validation',
        type: 'boolean',
        default: false,
        required: false,
      },
    ],
  },
  
  // AutoGPT template
  {
    id: 'autogpt-basic',
    name: 'AutoGPT Basic Wrapper',
    description: 'Basic wrapper for AutoGPT agents',
    frameworkIds: ['autogpt'],
    templateFiles: [
      {
        path: 'wrapper.ts',
        content: getAutoGPTWrapperTemplate(),
        isExecutable: false,
        isOptional: false,
        description: 'Main wrapper implementation',
      },
      {
        path: 'schemas.ts',
        content: getAutoGPTSchemasTemplate(),
        isExecutable: false,
        isOptional: false,
        description: 'Schema definitions',
      },
      {
        path: 'README.md',
        content: getAutoGPTReadmeTemplate(),
        isExecutable: false,
        isOptional: true,
        description: 'Usage documentation',
      },
    ],
    configOptions: [
      {
        id: 'trackMemory',
        name: 'Track Memory',
        description: 'Enable memory tracking for the agent',
        type: 'boolean',
        default: true,
        required: false,
      },
      {
        id: 'trackGoals',
        name: 'Track Goals',
        description: 'Enable goal tracking for the agent',
        type: 'boolean',
        default: true,
        required: false,
      },
      {
        id: 'strictValidation',
        name: 'Strict Validation',
        description: 'Enable strict schema validation',
        type: 'boolean',
        default: false,
        required: false,
      },
    ],
  },
  
  // Generic JavaScript/TypeScript template
  {
    id: 'generic-ts',
    name: 'Generic TypeScript Wrapper',
    description: 'Generic wrapper for any TypeScript/JavaScript agent',
    frameworkIds: ['generic', 'custom', 'unknown'],
    templateFiles: [
      {
        path: 'wrapper.ts',
        content: getGenericWrapperTemplate(),
        isExecutable: false,
        isOptional: false,
        description: 'Main wrapper implementation',
      },
      {
        path: 'schemas.ts',
        content: getGenericSchemasTemplate(),
        isExecutable: false,
        isOptional: false,
        description: 'Schema definitions',
      },
      {
        path: 'README.md',
        content: getGenericReadmeTemplate(),
        isExecutable: false,
        isOptional: true,
        description: 'Usage documentation',
      },
    ],
    configOptions: [
      {
        id: 'wrapperType',
        name: 'Wrapper Type',
        description: 'Type of wrapper to generate',
        type: 'enum',
        options: ['class', 'function', 'proxy'],
        default: 'class',
        required: true,
      },
      {
        id: 'trackMemory',
        name: 'Track Memory',
        description: 'Enable memory tracking for the agent',
        type: 'boolean',
        default: false,
        required: false,
      },
      {
        id: 'strictValidation',
        name: 'Strict Validation',
        description: 'Enable strict schema validation',
        type: 'boolean',
        default: false,
        required: false,
      },
    ],
  },
];

/**
 * Gets a wrapper template by ID
 * 
 * @param templateId - ID of the template to retrieve
 * @returns The wrapper template or undefined if not found
 */
export function getWrapperTemplate(templateId: string): WrapperTemplate | undefined {
  return WRAPPER_TEMPLATES.find(template => template.id === templateId);
}

/**
 * Gets the best template for a given framework
 * 
 * @param framework - The agent framework
 * @returns The best matching wrapper template
 */
export function getBestTemplateForFramework(framework: string): WrapperTemplate {
  // Try to find an exact match
  const exactMatch = WRAPPER_TEMPLATES.find(template => 
    template.frameworkIds.includes(framework.toLowerCase())
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Fall back to generic template
  return WRAPPER_TEMPLATES.find(template => 
    template.frameworkIds.includes('generic')
  )!;
}

/**
 * Template for LangChain wrapper
 */
function getLangChainWrapperTemplate(): string {
  return `
import { LLMChain, AgentExecutor } from 'langchain';
import { GovernanceWrapper } from 'promethios';
import { inputSchema, outputSchema, memorySchema } from './schemas';

/**
 * Promethios Governance Wrapper for LangChain
 */
export class PromethiosLangChainWrapper {
  private agent: LLMChain | AgentExecutor;
  private config: any;
  
  /**
   * Creates a new wrapper for a LangChain agent or chain
   * 
   * @param agent - The LangChain agent or chain to wrap
   * @param config - Configuration options
   */
  constructor(agent: LLMChain | AgentExecutor, config: any = {}) {
    this.agent = agent;
    this.config = {
      trackMemory: true,
      trackDecisions: true,
      strictValidation: false,
      ...config
    };
    
    // Register schemas with governance system
    GovernanceWrapper.registerSchemas({
      inputSchema,
      outputSchema,
      memorySchema: this.config.trackMemory ? memorySchema : undefined
    });
  }
  
  /**
   * Executes the wrapped agent with governance hooks
   * 
   * @param input - Input for the agent
   * @returns The agent's output with governance applied
   */
  async execute(input: any): Promise<any> {
    // Pre-execution governance hook
    const governanceInput = await GovernanceWrapper.beforeExecution({
      input,
      context: this.getContext(),
      agentId: this.getAgentId()
    });
    
    // Execute the agent
    let result;
    try {
      result = await this.agent.call(governanceInput.input);
    } catch (error) {
      // Report execution error to governance
      await GovernanceWrapper.onExecutionError({
        input: governanceInput.input,
        error,
        context: this.getContext(),
        agentId: this.getAgentId()
      });
      throw error;
    }
    
    // Track memory if enabled
    if (this.config.trackMemory && this.agent.memory) {
      await GovernanceWrapper.trackMemoryAccess({
        operation: 'write',
        data: this.agent.memory.chatHistory,
        context: this.getContext(),
        agentId: this.getAgentId()
      });
    }
    
    // Track decisions if enabled
    if (this.config.trackDecisions && result.intermediateSteps) {
      await GovernanceWrapper.trackDecisions({
        decisions: result.intermediateSteps,
        context: this.getContext(),
        agentId: this.getAgentId()
      });
    }
    
    // Post-execution governance hook
    const governanceResult = await GovernanceWrapper.afterExecution({
      input: governanceInput.input,
      output: result,
      context: this.getContext(),
      agentId: this.getAgentId()
    });
    
    return governanceResult.output;
  }
  
  /**
   * Gets the agent's context for governance
   */
  private getContext(): any {
    return {
      agentType: 'langchain',
      chainType: this.agent instanceof LLMChain ? 'llm-chain' : 'agent-executor',
      llm: this.agent.llm?.constructor.name,
      hasMemory: !!this.agent.memory,
      hasTools: !!(this.agent as any).tools?.length
    };
  }
  
  /**
   * Gets a unique identifier for the agent
   */
  private getAgentId(): string {
    return this.agent.id || 'langchain-agent';
  }
}
`;
}

/**
 * Template for LangChain schemas
 */
function getLangChainSchemasTemplate(): string {
  return `
/**
 * Input schema for LangChain agent
 */
export const inputSchema = {
  type: "object",
  properties: {
    input: {
      type: "string",
      description: "User input to the agent"
    },
    options: {
      type: "object",
      properties: {
        temperature: {
          type: "number",
          description: "LLM temperature"
        },
        maxTokens: {
          type: "number",
          description: "Maximum tokens to generate"
        }
      }
    }
  },
  required: ["input"]
};

/**
 * Output schema for LangChain agent
 */
export const outputSchema = {
  type: "object",
  properties: {
    output: {
      type: "string",
      description: "Agent response"
    },
    intermediateSteps: {
      type: "array",
      items: {
        type: "object"
      },
      description: "Intermediate reasoning steps"
    }
  },
  required: ["output"]
};

/**
 * Memory schema for LangChain agent
 */
export const memorySchema = {
  type: "object",
  properties: {
    chatHistory: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: {
            type: "string",
            enum: ["user", "assistant", "system"]
          },
          content: {
            type: "string"
          }
        },
        required: ["role", "content"]
      }
    }
  }
};
`;
}

/**
 * Template for LangChain README
 */
function getLangChainReadmeTemplate(): string {
  return `
# Promethios Governance Wrapper for LangChain

This wrapper integrates your LangChain agent or chain with the Promethios governance framework.

## Usage

\`\`\`typescript
import { LLMChain } from 'langchain';
import { PromethiosLangChainWrapper } from './wrapper';

// Create your LangChain agent or chain
const chain = new LLMChain({
  llm,
  prompt,
  // ...other options
});

// Wrap it with Promethios governance
const wrappedChain = new PromethiosLangChainWrapper(chain, {
  trackMemory: true,
  trackDecisions: true,
  strictValidation: false
});

// Use the wrapped chain
const result = await wrappedChain.execute({
  input: "User query",
  options: {
    temperature: 0.7
  }
});
\`\`\`

## Configuration Options

- \`trackMemory\`: Enable memory tracking (default: true)
- \`trackDecisions\`: Enable decision tracking (default: true)
- \`strictValidation\`: Enable strict schema validation (default: false)

## Schemas

The wrapper includes predefined schemas for input, output, and memory that can be customized as needed.
`;
}

/**
 * Template for AutoGPT wrapper
 */
function getAutoGPTWrapperTemplate(): string {
  return `
import { Agent } from 'autogpt';
import { GovernanceWrapper } from 'promethios';
import { inputSchema, outputSchema, memorySchema } from './schemas';

/**
 * Promethios Governance Wrapper for AutoGPT
 */
export class PromethiosAutoGPTWrapper {
  private agent: Agent;
  private config: any;
  
  /**
   * Creates a new wrapper for an AutoGPT agent
   * 
   * @param agent - The AutoGPT agent to wrap
   * @param config - Configuration options
   */
  constructor(agent: Agent, config: any = {}) {
    this.agent = agent;
    this.config = {
      trackMemory: true,
      trackGoals: true,
      strictValidation: false,
      ...config
    };
    
    // Register schemas with governance system
    GovernanceWrapper.registerSchemas({
      inputSchema,
      outputSchema,
      memorySchema: this.config.trackMemory ? memorySchema : undefined
    });
  }
  
  /**
   * Executes the wrapped agent with governance hooks
   * 
   * @param input - Input for the agent
   * @returns The agent's output with governance applied
   */
  async execute(input: any): Promise<any> {
    // Pre-execution governance hook
    const governanceInput = await GovernanceWrapper.beforeExecution({
      input,
      context: this.getContext(),
      agentId: this.getAgentId()
    });
    
    // Execute the agent
    let result;
    try {
      result = await this.agent.run(governanceInput.input);
    } catch (error) {
      // Report execution error to governance
      await GovernanceWrapper.onExecutionError({
        input: governanceInput.input,
        error,
        context: this.getContext(),
        agentId: this.getAgentId()
      });
      throw error;
    }
    
    // Track memory if enabled
    if (this.config.trackMemory && this.agent.memory) {
      await GovernanceWrapper.trackMemoryAccess({
        operation: 'write',
        data: this.agent.memory.getMemorySnapshot(),
        context: this.getContext(),
        agentId: this.getAgentId()
      });
    }
    
    // Track goals if enabled
    if (this.config.trackGoals && this.agent.goals) {
      await GovernanceWrapper.trackGoals({
        goals: this.agent.goals,
        progress: this.agent.getGoalProgress(),
        context: this.getContext(),
        agentId: this.getAgentId()
      });
    }
    
    // Post-execution governance hook
    const governanceResult = await GovernanceWrapper.afterExecution({
      input: governanceInput.input,
      output: result,
      context: this.getContext(),
      agentId: this.getAgentId()
    });
    
    return governanceResult.output;
  }
  
  /**
   * Gets the agent's context for governance
   */
  private getContext(): any {
    return {
      agentType: 'autogpt',
      hasMemory: !!this.agent.memory,
      hasGoals: !!this.agent.goals,
      hasTools: !!(this.agent as any).tools?.length
    };
  }
  
  /**
   * Gets a unique identifier for the agent
   */
  private getAgentId(): string {
    return this.agent.id || 'autogpt-agent';
  }
}
`;
}

/**
 * Template for AutoGPT schemas
 */
function getAutoGPTSchemasTemplate(): string {
  return `
/**
 * Input schema for AutoGPT agent
 */
export const inputSchema = {
  type: "object",
  properties: {
    goals: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Goals for the agent to accomplish"
    },
    constraints: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Constraints for the agent to follow"
    },
    resources: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Resources available to the agent"
    }
  },
  required: ["goals"]
};

/**
 * Output schema for AutoGPT agent
 */
export const outputSchema = {
  type: "object",
  properties: {
    result: {
      type: "string",
      description: "Final result of the agent's execution"
    },
    completedGoals: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Goals that were completed"
    },
    actionHistory: {
      type: "array",
      items: {
        type: "object",
        properties: {
          action: {
            type: "string"
          },
          result: {
            type: "string"
          }
        }
      },
      description: "History of actions taken"
    }
  },
  required: ["result"]
};

/**
 * Memory schema for AutoGPT agent
 */
export const memorySchema = {
  type: "object",
  properties: {
    memories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          content: {
            type: "string"
          },
          importance: {
            type: "number"
          },
          timestamp: {
            type: "string",
            format: "date-time"
          }
        }
      }
    }
  }
};
`;
}

/**
 * Template for AutoGPT README
 */
function getAutoGPTReadmeTemplate(): string {
  return `
# Promethios Governance Wrapper for AutoGPT

This wrapper integrates your AutoGPT agent with the Promethios governance framework.

## Usage

\`\`\`typescript
import { Agent } from 'autogpt';
import { PromethiosAutoGPTWrapper } from './wrapper';

// Create your AutoGPT agent
const agent = new Agent({
  goals: ["Research quantum computing"],
  // ...other options
});

// Wrap it with Promethios governance
const wrappedAgent = new PromethiosAutoGPTWrapper(agent, {
  trackMemory: true,
  trackGoals: true,
  strictValidation: false
});

// Use the wrapped agent
const result = await wrappedAgent.execute({
  goals: ["Research quantum computing"],
  constraints: ["Use reliable sources only"]
});
\`\`\`

## Configuration Options

- \`trackMemory\`: Enable memory tracking (default: true)
- \`trackGoals\`: Enable goal tracking (default: true)
- \`strictValidation\`: Enable strict schema validation (default: false)

## Schemas

The wrapper includes predefined schemas for input, output, and memory that can be customized as needed.
`;
}

/**
 * Template for generic wrapper
 */
function getGenericWrapperTemplate(): string {
  return `
import { GovernanceWrapper } from 'promethios';
import { inputSchema, outputSchema, memorySchema } from './schemas';

/**
 * Promethios Governance Wrapper for generic agents
 */
export class PromethiosGenericWrapper {
  private agent: any;
  private config: any;
  
  /**
   * Creates a new wrapper for a generic agent
   * 
   * @param agent - The agent to wrap
   * @param config - Configuration options
   */
  constructor(agent: any, config: any = {}) {
    this.agent = agent;
    this.config = {
      wrapperType: 'class',
      trackMemory: false,
      strictValidation: false,
      ...config
    };
    
    // Register schemas with governance system
    GovernanceWrapper.registerSchemas({
      inputSchema,
      outputSchema,
      memorySchema: this.config.trackMemory ? memorySchema : undefined
    });
  }
  
  /**
   * Executes the wrapped agent with governance hooks
   * 
   * @param input - Input for the agent
   * @returns The agent's output with governance applied
   */
  async execute(input: any): Promise<any> {
    // Pre-execution governance hook
    const governanceInput = await GovernanceWrapper.beforeExecution({
      input,
      context: this.getContext(),
      agentId: this.getAgentId()
    });
    
    // Execute the agent
    let result;
    try {
      // Determine the execution method based on agent structure
      if (typeof this.agent === 'function') {
        result = await this.agent(governanceInput.input);
      } else if (typeof this.agent.execute === 'function') {
        result = await this.agent.execute(governanceInput.input);
      } else if (typeof this.agent.run === 'function') {
        result = await this.agent.run(governanceInput.input);
      } else if (typeof this.agent.process === 'function') {
        result = await this.agent.process(governanceInput.input);
      } else {
        throw new Error('Unable to determine execution method for agent');
      }
    } catch (error) {
      // Report execution error to governance
      await GovernanceWrapper.onExecutionError({
        input: governanceInput.input,
        error,
        context: this.getContext(),
        agentId: this.getAgentId()
      });
      throw error;
    }
    
    // Track memory if enabled
    if (this.config.trackMemory && this.agent.memory) {
      await GovernanceWrapper.trackMemoryAccess({
        operation: 'write',
        data: this.agent.memory,
        context: this.getContext(),
        agentId: this.getAgentId()
      });
    }
    
    // Post-execution governance hook
    const governanceResult = await GovernanceWrapper.afterExecution({
      input: governanceInput.input,
      output: result,
      context: this.getContext(),
      agentId: this.getAgentId()
    });
    
    return governanceResult.output;
  }
  
  /**
   * Gets the agent's context for governance
   */
  private getContext(): any {
    return {
      agentType: 'generic',
      wrapperType: this.config.wrapperType,
      hasMemory: !!this.agent.memory,
      isFunction: typeof this.agent === 'function',
      isClass: typeof this.agent === 'object'
    };
  }
  
  /**
   * Gets a unique identifier for the agent
   */
  private getAgentId(): string {
    return this.agent.id || 'generic-agent';
  }
}

/**
 * Creates a function wrapper for a generic agent function
 * 
 * @param agentFn - The agent function to wrap
 * @param config - Configuration options
 * @returns A wrapped function with governance
 */
export function createFunctionWrapper(
  agentFn: (input: any) => Promise<any>,
  config: any = {}
): (input: any) => Promise<any> {
  const wrapper = new PromethiosGenericWrapper(agentFn, {
    ...config,
    wrapperType: 'function'
  });
  
  return (input: any) => wrapper.execute(input);
}

/**
 * Creates a proxy wrapper for a generic agent object
 * 
 * @param agent - The agent object to wrap
 * @param config - Configuration options
 * @returns A proxied agent with governance
 */
export function createProxyWrapper(
  agent: any,
  config: any = {}
): any {
  const wrapper = new PromethiosGenericWrapper(agent, {
    ...config,
    wrapperType: 'proxy'
  });
  
  return new Proxy(agent, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      
      // Wrap execution methods
      if (
        prop === 'execute' || 
        prop === 'run' || 
        prop === 'process' || 
        prop === 'call'
      ) {
        return (input: any) => wrapper.execute(input);
      }
      
      return value;
    }
  });
}
`;
}

/**
 * Template for generic schemas
 */
function getGenericSchemasTemplate(): string {
  return `
/**
 * Input schema for generic agent
 */
export const inputSchema = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "User query or input"
    },
    parameters: {
      type: "object",
      description: "Additional parameters for the agent"
    }
  },
  required: ["query"]
};

/**
 * Output schema for generic agent
 */
export const outputSchema = {
  type: "object",
  properties: {
    result: {
      type: "string",
      description: "Agent response or result"
    },
    metadata: {
      type: "object",
      description: "Additional metadata about the result"
    }
  },
  required: ["result"]
};

/**
 * Memory schema for generic agent
 */
export const memorySchema = {
  type: "object",
  properties: {
    history: {
      type: "array",
      items: {
        type: "object"
      },
      description: "Agent interaction history"
    },
    context: {
      type: "object",
      description: "Agent context information"
    }
  }
};
`;
}

/**
 * Template for generic README
 */
function getGenericReadmeTemplate(): string {
  return `
# Promethios Governance Wrapper for Generic Agents

This wrapper integrates any JavaScript/TypeScript agent with the Promethios governance framework.

## Usage

### Class Wrapper

\`\`\`typescript
import { PromethiosGenericWrapper } from './wrapper';

// Your existing agent
const agent = {
  execute: async (input) => {
    // Agent logic
    return { result: "Agent response" };
  }
};

// Wrap it with Promethios governance
const wrappedAgent = new PromethiosGenericWrapper(agent, {
  trackMemory: false,
  strictValidation: false
});

// Use the wrapped agent
const result = await wrappedAgent.execute({
  query: "User query"
});
\`\`\`

### Function Wrapper

\`\`\`typescript
import { createFunctionWrapper } from './wrapper';

// Your existing agent function
async function myAgent(input) {
  // Agent logic
  return { result: "Agent response" };
}

// Wrap it with Promethios governance
const wrappedAgent = createFunctionWrapper(myAgent);

// Use the wrapped agent
const result = await wrappedAgent({
  query: "User query"
});
\`\`\`

### Proxy Wrapper

\`\`\`typescript
import { createProxyWrapper } from './wrapper';

// Your existing agent
const agent = {
  execute: async (input) => {
    // Agent logic
    return { result: "Agent response" };
  }
};

// Wrap it with Promethios governance
const wrappedAgent = createProxyWrapper(agent);

// Use the wrapped agent normally
const result = await wrappedAgent.execute({
  query: "User query"
});
\`\`\`

## Configuration Options

- \`wrapperType\`: Type of wrapper ('class', 'function', or 'proxy')
- \`trackMemory\`: Enable memory tracking (default: false)
- \`strictValidation\`: Enable strict schema validation (default: false)

## Schemas

The wrapper includes predefined schemas for input, output, and memory that can be customized as needed.
`;
}
