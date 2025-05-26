/**
 * Adaptation Layer for Promethios Agent Wrapping
 * 
 * This module provides adaptation layers that bridge between different agent
 * frameworks and the Promethios governance framework.
 */

import { Schema } from '../../schemas/types';
import { GovernanceHook } from '../detection/schema_analyzer';

/**
 * Represents an adaptation strategy for a specific agent framework
 */
export interface AdaptationStrategy {
  id: string;
  name: string;
  description: string;
  frameworkIds: string[];
  adaptInput: (input: any, schema: Schema) => any;
  adaptOutput: (output: any, schema: Schema) => any;
  adaptMemory?: (memory: any, schema: Schema) => any;
  adaptGovernanceHooks: (hooks: GovernanceHook[], agentCode: string) => string[];
}

/**
 * Configuration for adaptation layer
 */
export interface AdaptationConfig {
  framework: string;
  inputSchema: Schema;
  outputSchema: Schema;
  memorySchema?: Schema;
  governanceHooks: GovernanceHook[];
  agentCode: string;
  options: Record<string, any>;
}

/**
 * Registry of available adaptation strategies
 */
export const ADAPTATION_STRATEGIES: AdaptationStrategy[] = [
  // LangChain adaptation strategy
  {
    id: 'langchain',
    name: 'LangChain Adaptation',
    description: 'Adaptation layer for LangChain agents and chains',
    frameworkIds: ['langchain'],
    adaptInput: (input, schema) => {
      // LangChain typically expects input as { input: string } or directly as string
      if (typeof input === 'string') {
        return { input };
      }
      
      // If input is already in the right format, return it
      if (input && typeof input === 'object' && 'input' in input) {
        return input;
      }
      
      // If input has a query field, adapt it
      if (input && typeof input === 'object' && 'query' in input) {
        return { input: input.query, ...input };
      }
      
      // Default adaptation
      return { input: JSON.stringify(input) };
    },
    adaptOutput: (output, schema) => {
      // LangChain typically returns { output: string } or directly string
      if (typeof output === 'string') {
        return { result: output };
      }
      
      // If output is already in the right format, return it
      if (output && typeof output === 'object' && 'output' in output) {
        return { result: output.output, metadata: output };
      }
      
      // Default adaptation
      return { result: JSON.stringify(output) };
    },
    adaptMemory: (memory, schema) => {
      // LangChain typically uses chatHistory for memory
      if (memory && 'chatHistory' in memory) {
        return { history: memory.chatHistory };
      }
      
      // Default adaptation
      return { history: memory };
    },
    adaptGovernanceHooks: (hooks, agentCode) => {
      // Generate code snippets for LangChain governance hooks
      return hooks.map(hook => {
        switch (hook.hookType) {
          case 'pre-execution':
            return `
// Add this at the start of your execute/call method
const governanceInput = await GovernanceWrapper.beforeExecution({
  input,
  context: this.getContext(),
  agentId: this.getAgentId()
});
// Use governanceInput.input instead of the original input
`;
          case 'post-execution':
            return `
// Add this before returning from your execute/call method
const governanceResult = await GovernanceWrapper.afterExecution({
  input,
  output: result,
  context: this.getContext(),
  agentId: this.getAgentId()
});
// Return governanceResult.output instead of the original result
`;
          case 'memory-access':
            return `
// Add this after memory operations
await GovernanceWrapper.trackMemoryAccess({
  operation: 'write', // or 'read'
  data: this.memory.chatHistory,
  context: this.getContext(),
  agentId: this.getAgentId()
});
`;
          case 'decision-point':
            return `
// Add this after decision points
await GovernanceWrapper.trackDecisions({
  decisions: intermediateSteps,
  context: this.getContext(),
  agentId: this.getAgentId()
});
`;
          default:
            return '';
        }
      });
    }
  },
  
  // AutoGPT adaptation strategy
  {
    id: 'autogpt',
    name: 'AutoGPT Adaptation',
    description: 'Adaptation layer for AutoGPT agents',
    frameworkIds: ['autogpt'],
    adaptInput: (input, schema) => {
      // AutoGPT typically expects input as { goals: string[] }
      if (Array.isArray(input)) {
        return { goals: input };
      }
      
      // If input is already in the right format, return it
      if (input && typeof input === 'object' && 'goals' in input) {
        return input;
      }
      
      // If input has a query field, adapt it
      if (input && typeof input === 'object' && 'query' in input) {
        return { goals: [input.query], ...input };
      }
      
      // Default adaptation
      return { goals: [JSON.stringify(input)] };
    },
    adaptOutput: (output, schema) => {
      // AutoGPT typically returns complex objects with results
      if (typeof output === 'string') {
        return { result: output };
      }
      
      // If output has a result field, adapt it
      if (output && typeof output === 'object' && 'result' in output) {
        return output;
      }
      
      // If output has a final_answer field (common in AutoGPT)
      if (output && typeof output === 'object' && 'final_answer' in output) {
        return { result: output.final_answer, metadata: output };
      }
      
      // Default adaptation
      return { result: JSON.stringify(output) };
    },
    adaptMemory: (memory, schema) => {
      // AutoGPT typically uses a memory object with get/set methods
      if (memory && typeof memory.getMemorySnapshot === 'function') {
        return { memories: memory.getMemorySnapshot() };
      }
      
      // Default adaptation
      return { memories: memory };
    },
    adaptGovernanceHooks: (hooks, agentCode) => {
      // Generate code snippets for AutoGPT governance hooks
      return hooks.map(hook => {
        switch (hook.hookType) {
          case 'pre-execution':
            return `
// Add this at the start of your run method
const governanceInput = await GovernanceWrapper.beforeExecution({
  input,
  context: this.getContext(),
  agentId: this.getAgentId()
});
// Use governanceInput.input instead of the original input
`;
          case 'post-execution':
            return `
// Add this before returning from your run method
const governanceResult = await GovernanceWrapper.afterExecution({
  input,
  output: result,
  context: this.getContext(),
  agentId: this.getAgentId()
});
// Return governanceResult.output instead of the original result
`;
          case 'memory-access':
            return `
// Add this after memory operations
await GovernanceWrapper.trackMemoryAccess({
  operation: 'write', // or 'read'
  data: this.memory.getMemorySnapshot(),
  context: this.getContext(),
  agentId: this.getAgentId()
});
`;
          case 'decision-point':
            return `
// Add this after decision points
await GovernanceWrapper.trackGoals({
  goals: this.goals,
  progress: this.getGoalProgress(),
  context: this.getContext(),
  agentId: this.getAgentId()
});
`;
          default:
            return '';
        }
      });
    }
  },
  
  // Generic adaptation strategy
  {
    id: 'generic',
    name: 'Generic Adaptation',
    description: 'Adaptation layer for generic agents',
    frameworkIds: ['generic', 'custom', 'unknown'],
    adaptInput: (input, schema) => {
      // For generic agents, try to match the schema
      if (schema && schema.properties) {
        const adapted: Record<string, any> = {};
        
        // Map input fields to schema properties
        for (const [key, prop] of Object.entries(schema.properties)) {
          if (input && typeof input === 'object' && key in input) {
            adapted[key] = input[key];
          } else if (key === 'query' && typeof input === 'string') {
            adapted.query = input;
          }
        }
        
        // If we have at least one required field, return the adapted input
        if (schema.required && schema.required.some(req => req in adapted)) {
          return adapted;
        }
      }
      
      // If input is a string, wrap it in an object
      if (typeof input === 'string') {
        return { query: input };
      }
      
      // Default: return input as is
      return input;
    },
    adaptOutput: (output, schema) => {
      // For generic agents, try to match the schema
      if (schema && schema.properties) {
        const adapted: Record<string, any> = {};
        
        // Map output fields to schema properties
        for (const [key, prop] of Object.entries(schema.properties)) {
          if (output && typeof output === 'object' && key in output) {
            adapted[key] = output[key];
          } else if (key === 'result' && typeof output === 'string') {
            adapted.result = output;
          }
        }
        
        // If we have at least one required field, return the adapted output
        if (schema.required && schema.required.some(req => req in adapted)) {
          return adapted;
        }
      }
      
      // If output is a string, wrap it in an object
      if (typeof output === 'string') {
        return { result: output };
      }
      
      // Default: return output as is
      return output;
    },
    adaptMemory: (memory, schema) => {
      // For generic agents, try to match the schema
      if (schema && schema.properties) {
        const adapted: Record<string, any> = {};
        
        // Map memory fields to schema properties
        for (const [key, prop] of Object.entries(schema.properties)) {
          if (memory && typeof memory === 'object' && key in memory) {
            adapted[key] = memory[key];
          }
        }
        
        // If we have at least one field, return the adapted memory
        if (Object.keys(adapted).length > 0) {
          return adapted;
        }
      }
      
      // Default: wrap memory in a history field
      return { history: memory };
    },
    adaptGovernanceHooks: (hooks, agentCode) => {
      // Generate code snippets for generic governance hooks
      return hooks.map(hook => {
        switch (hook.hookType) {
          case 'pre-execution':
            return `
// Add this at the start of your execution method
const governanceInput = await GovernanceWrapper.beforeExecution({
  input,
  context: { agentType: 'generic' },
  agentId: 'generic-agent'
});
// Use governanceInput.input instead of the original input
`;
          case 'post-execution':
            return `
// Add this before returning from your execution method
const governanceResult = await GovernanceWrapper.afterExecution({
  input,
  output: result,
  context: { agentType: 'generic' },
  agentId: 'generic-agent'
});
// Return governanceResult.output instead of the original result
`;
          case 'memory-access':
            return `
// Add this after memory operations
await GovernanceWrapper.trackMemoryAccess({
  operation: 'write', // or 'read'
  data: memory,
  context: { agentType: 'generic' },
  agentId: 'generic-agent'
});
`;
          case 'decision-point':
            return `
// Add this after decision points
await GovernanceWrapper.trackDecisions({
  decisions: decisions,
  context: { agentType: 'generic' },
  agentId: 'generic-agent'
});
`;
          default:
            return '';
        }
      });
    }
  }
];

/**
 * Gets an adaptation strategy by ID
 * 
 * @param strategyId - ID of the strategy to retrieve
 * @returns The adaptation strategy or undefined if not found
 */
export function getAdaptationStrategy(strategyId: string): AdaptationStrategy | undefined {
  return ADAPTATION_STRATEGIES.find(strategy => strategy.id === strategyId);
}

/**
 * Gets the best adaptation strategy for a given framework
 * 
 * @param framework - The agent framework
 * @returns The best matching adaptation strategy
 */
export function getBestAdaptationStrategy(framework: string): AdaptationStrategy {
  // Try to find an exact match
  const exactMatch = ADAPTATION_STRATEGIES.find(strategy => 
    strategy.frameworkIds.includes(framework.toLowerCase())
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Fall back to generic strategy
  return ADAPTATION_STRATEGIES.find(strategy => 
    strategy.frameworkIds.includes('generic')
  )!;
}

/**
 * Creates an adaptation layer for an agent
 * 
 * @param config - Configuration for the adaptation layer
 * @returns Adapted schemas and governance hook code snippets
 */
export function createAdaptationLayer(config: AdaptationConfig): {
  adaptedInputSchema: Schema;
  adaptedOutputSchema: Schema;
  adaptedMemorySchema?: Schema;
  governanceHookSnippets: string[];
} {
  const strategy = getBestAdaptationStrategy(config.framework);
  
  // Create adapted schemas
  const adaptedInputSchema = {
    ...config.inputSchema,
    'x-adaptation-strategy': strategy.id
  };
  
  const adaptedOutputSchema = {
    ...config.outputSchema,
    'x-adaptation-strategy': strategy.id
  };
  
  let adaptedMemorySchema = undefined;
  if (config.memorySchema && strategy.adaptMemory) {
    adaptedMemorySchema = {
      ...config.memorySchema,
      'x-adaptation-strategy': strategy.id
    };
  }
  
  // Generate governance hook code snippets
  const governanceHookSnippets = strategy.adaptGovernanceHooks(
    config.governanceHooks,
    config.agentCode
  );
  
  return {
    adaptedInputSchema,
    adaptedOutputSchema,
    adaptedMemorySchema,
    governanceHookSnippets
  };
}

/**
 * Adapts input data according to the specified strategy
 * 
 * @param input - The input data to adapt
 * @param schema - The input schema
 * @param framework - The agent framework
 * @returns Adapted input data
 */
export function adaptInput(input: any, schema: Schema, framework: string): any {
  const strategy = getBestAdaptationStrategy(framework);
  return strategy.adaptInput(input, schema);
}

/**
 * Adapts output data according to the specified strategy
 * 
 * @param output - The output data to adapt
 * @param schema - The output schema
 * @param framework - The agent framework
 * @returns Adapted output data
 */
export function adaptOutput(output: any, schema: Schema, framework: string): any {
  const strategy = getBestAdaptationStrategy(framework);
  return strategy.adaptOutput(output, schema);
}

/**
 * Adapts memory data according to the specified strategy
 * 
 * @param memory - The memory data to adapt
 * @param schema - The memory schema
 * @param framework - The agent framework
 * @returns Adapted memory data
 */
export function adaptMemory(memory: any, schema: Schema, framework: string): any {
  const strategy = getBestAdaptationStrategy(framework);
  if (strategy.adaptMemory) {
    return strategy.adaptMemory(memory, schema);
  }
  return memory;
}
