/**
 * Compatibility Checker for Promethios Agent Wrapping
 * 
 * This module checks the compatibility of an agent with the Promethios
 * governance framework and identifies potential issues.
 */

import { Schema } from '../../schemas/types';
import { GovernanceRequirement } from '../../core/governance/types';

/**
 * Represents the compatibility status of an agent
 */
export interface CompatibilityResult {
  compatible: boolean;
  score: number; // 0-1 score indicating compatibility level
  issues: CompatibilityIssue[];
  recommendations: CompatibilityRecommendation[];
  frameworkSpecificDetails: Record<string, any>;
}

/**
 * Represents a compatibility issue
 */
export interface CompatibilityIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  location?: string;
}

/**
 * Represents a compatibility recommendation
 */
export interface CompatibilityRecommendation {
  id: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  benefit: 'low' | 'medium' | 'high';
  codeExample?: string;
}

/**
 * Configuration options for compatibility checking
 */
export interface CompatibilityOptions {
  strictMode: boolean;
  requireMemoryTracking: boolean;
  requireDecisionTracking: boolean;
  minCompatibilityScore: number;
}

/**
 * Default options for compatibility checking
 */
const DEFAULT_OPTIONS: CompatibilityOptions = {
  strictMode: false,
  requireMemoryTracking: false,
  requireDecisionTracking: false,
  minCompatibilityScore: 0.6,
};

/**
 * Checks the compatibility of an agent with Promethios governance
 * 
 * @param agentCode - The source code of the agent to analyze
 * @param framework - The detected agent framework
 * @param schemas - The detected input, output, and memory schemas
 * @param options - Configuration options for compatibility checking
 * @returns Compatibility result with issues and recommendations
 */
export function checkCompatibility(
  agentCode: string,
  framework: string,
  schemas: {
    inputSchema: Schema;
    outputSchema: Schema;
    memorySchema?: Schema;
  },
  options: Partial<CompatibilityOptions> = {}
): CompatibilityResult {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Check for framework-specific compatibility issues
  const frameworkIssues = checkFrameworkCompatibility(agentCode, framework);
  
  // Check for schema-related compatibility issues
  const schemaIssues = checkSchemaCompatibility(schemas, mergedOptions);
  
  // Check for governance-specific compatibility issues
  const governanceIssues = checkGovernanceCompatibility(agentCode, framework, mergedOptions);
  
  // Combine all issues
  const allIssues = [...frameworkIssues, ...schemaIssues, ...governanceIssues];
  
  // Generate recommendations based on issues
  const recommendations = generateRecommendations(allIssues, framework);
  
  // Calculate overall compatibility score
  const score = calculateCompatibilityScore(allIssues, mergedOptions);
  
  // Determine if the agent is compatible based on score and critical issues
  const hasCriticalIssues = allIssues.some(issue => issue.severity === 'critical');
  const compatible = score >= mergedOptions.minCompatibilityScore && !hasCriticalIssues;
  
  return {
    compatible,
    score,
    issues: allIssues,
    recommendations,
    frameworkSpecificDetails: getFrameworkSpecificDetails(framework, agentCode),
  };
}

/**
 * Checks for framework-specific compatibility issues
 */
function checkFrameworkCompatibility(
  agentCode: string,
  framework: string
): CompatibilityIssue[] {
  // Implementation would check for issues specific to the detected framework
  
  const issues: CompatibilityIssue[] = [];
  
  // Example framework-specific checks
  switch (framework) {
    case 'langchain':
      if (!agentCode.includes('LLMChain') && !agentCode.includes('AgentExecutor')) {
        issues.push({
          id: 'langchain-missing-core-components',
          severity: 'high',
          description: 'Missing core LangChain components',
          impact: 'Agent may not follow LangChain patterns, making wrapping difficult',
        });
      }
      break;
      
    case 'autogpt':
      if (!agentCode.includes('AutoGPT') && !agentCode.includes('Agent')) {
        issues.push({
          id: 'autogpt-missing-core-components',
          severity: 'high',
          description: 'Missing core AutoGPT components',
          impact: 'Agent may not follow AutoGPT patterns, making wrapping difficult',
        });
      }
      break;
      
    case 'custom':
      issues.push({
        id: 'custom-framework',
        severity: 'medium',
        description: 'Custom agent framework detected',
        impact: 'May require manual adaptation for governance wrapping',
      });
      break;
      
    default:
      // Generic checks for unknown frameworks
      if (!agentCode.includes('function') && !agentCode.includes('class')) {
        issues.push({
          id: 'missing-code-structure',
          severity: 'critical',
          description: 'No recognizable code structure detected',
          impact: 'Cannot identify entry points for governance wrapping',
        });
      }
  }
  
  return issues;
}

/**
 * Checks for schema-related compatibility issues
 */
function checkSchemaCompatibility(
  schemas: {
    inputSchema: Schema;
    outputSchema: Schema;
    memorySchema?: Schema;
  },
  options: CompatibilityOptions
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  
  // Check input schema
  if (!schemas.inputSchema || Object.keys(schemas.inputSchema.properties || {}).length === 0) {
    issues.push({
      id: 'missing-input-schema',
      severity: options.strictMode ? 'critical' : 'high',
      description: 'Missing or empty input schema',
      impact: 'Cannot validate agent inputs against governance requirements',
    });
  }
  
  // Check output schema
  if (!schemas.outputSchema || Object.keys(schemas.outputSchema.properties || {}).length === 0) {
    issues.push({
      id: 'missing-output-schema',
      severity: options.strictMode ? 'critical' : 'high',
      description: 'Missing or empty output schema',
      impact: 'Cannot validate agent outputs against governance requirements',
    });
  }
  
  // Check memory schema if required
  if (options.requireMemoryTracking && !schemas.memorySchema) {
    issues.push({
      id: 'missing-memory-schema',
      severity: 'medium',
      description: 'Missing memory schema',
      impact: 'Cannot track agent memory operations for governance',
    });
  }
  
  return issues;
}

/**
 * Checks for governance-specific compatibility issues
 */
function checkGovernanceCompatibility(
  agentCode: string,
  framework: string,
  options: CompatibilityOptions
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  
  // Check for validation code
  if (!agentCode.includes('validate') && !agentCode.includes('schema')) {
    issues.push({
      id: 'missing-validation',
      severity: 'medium',
      description: 'No input/output validation detected',
      impact: 'Agent may not validate data against schemas',
    });
  }
  
  // Check for decision tracking if required
  if (options.requireDecisionTracking && 
      !agentCode.includes('decision') && 
      !agentCode.includes('reasoning')) {
    issues.push({
      id: 'missing-decision-tracking',
      severity: 'medium',
      description: 'No decision tracking detected',
      impact: 'Cannot audit agent decision-making process',
    });
  }
  
  // Check for potential security issues
  if (agentCode.includes('eval(') || agentCode.includes('new Function(')) {
    issues.push({
      id: 'dynamic-code-execution',
      severity: 'critical',
      description: 'Dynamic code execution detected',
      impact: 'Potential security risk for governance wrapping',
    });
  }
  
  return issues;
}

/**
 * Generates recommendations based on identified issues
 */
function generateRecommendations(
  issues: CompatibilityIssue[],
  framework: string
): CompatibilityRecommendation[] {
  const recommendations: CompatibilityRecommendation[] = [];
  
  // Generate recommendations for each issue type
  issues.forEach(issue => {
    switch (issue.id) {
      case 'missing-input-schema':
        recommendations.push({
          id: 'add-input-schema',
          description: 'Add explicit input schema definition',
          effort: 'medium',
          benefit: 'high',
          codeExample: getSchemaExample('input', framework),
        });
        break;
        
      case 'missing-output-schema':
        recommendations.push({
          id: 'add-output-schema',
          description: 'Add explicit output schema definition',
          effort: 'medium',
          benefit: 'high',
          codeExample: getSchemaExample('output', framework),
        });
        break;
        
      case 'missing-validation':
        recommendations.push({
          id: 'add-validation',
          description: 'Add input/output validation against schemas',
          effort: 'medium',
          benefit: 'high',
          codeExample: getValidationExample(framework),
        });
        break;
        
      case 'dynamic-code-execution':
        recommendations.push({
          id: 'remove-dynamic-execution',
          description: 'Replace dynamic code execution with safer alternatives',
          effort: 'high',
          benefit: 'high',
          codeExample: getSafeExecutionExample(framework),
        });
        break;
        
      // Add more recommendations for other issue types
    }
  });
  
  // Add general recommendations
  recommendations.push({
    id: 'add-governance-hooks',
    description: 'Add explicit governance hook points',
    effort: 'low',
    benefit: 'high',
    codeExample: getGovernanceHookExample(framework),
  });
  
  // Remove duplicates
  return recommendations.filter((rec, index, self) => 
    index === self.findIndex(r => r.id === rec.id)
  );
}

/**
 * Calculates overall compatibility score
 */
function calculateCompatibilityScore(
  issues: CompatibilityIssue[],
  options: CompatibilityOptions
): number {
  // Base score starts at 1.0 (100% compatible)
  let score = 1.0;
  
  // Reduce score based on issue severity
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'critical':
        score -= 0.4;
        break;
      case 'high':
        score -= 0.2;
        break;
      case 'medium':
        score -= 0.1;
        break;
      case 'low':
        score -= 0.05;
        break;
    }
  });
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Gets framework-specific details
 */
function getFrameworkSpecificDetails(
  framework: string,
  agentCode: string
): Record<string, any> {
  // Implementation would extract framework-specific details
  // that might be useful for wrapping
  
  // For now, return placeholder details
  switch (framework) {
    case 'langchain':
      return {
        chainType: 'LLMChain',
        hasAgentExecutor: agentCode.includes('AgentExecutor'),
        hasTools: agentCode.includes('tools'),
      };
      
    case 'autogpt':
      return {
        hasMemory: agentCode.includes('memory'),
        hasGoals: agentCode.includes('goals'),
      };
      
    default:
      return {
        hasClasses: agentCode.includes('class'),
        hasFunctions: agentCode.includes('function'),
      };
  }
}

/**
 * Gets example code for schema definition
 */
function getSchemaExample(type: 'input' | 'output', framework: string): string {
  // Implementation would provide framework-specific examples
  
  // For now, return placeholder examples
  switch (framework) {
    case 'langchain':
      return `
// Define ${type} schema
const ${type}Schema = z.object({
  query: z.string().describe("User query"),
  parameters: z.object({
    temperature: z.number().optional().describe("LLM temperature")
  }).optional()
});

// Apply schema to chain
const chain = new LLMChain({
  llm,
  prompt,
  ${type === 'input' ? 'inputSchema: inputSchema,' : ''}
  ${type === 'output' ? 'outputSchema: outputSchema,' : ''}
});
`;
      
    default:
      return `
// Define ${type} schema
const ${type}Schema = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "User query"
    },
    parameters: {
      type: "object",
      properties: {
        temperature: {
          type: "number",
          description: "LLM temperature"
        }
      }
    }
  },
  required: ["query"]
};

// Export schema for governance
export const ${type === 'input' ? 'inputSchema' : 'outputSchema'} = ${type}Schema;
`;
  }
}

/**
 * Gets example code for validation
 */
function getValidationExample(framework: string): string {
  // Implementation would provide framework-specific examples
  
  // For now, return a placeholder example
  return `
// Validate input against schema
function validateInput(input) {
  const result = inputSchema.safeParse(input);
  if (!result.success) {
    throw new Error(\`Invalid input: \${result.error.message}\`);
  }
  return result.data;
}

// Validate output against schema
function validateOutput(output) {
  const result = outputSchema.safeParse(output);
  if (!result.success) {
    throw new Error(\`Invalid output: \${result.error.message}\`);
  }
  return result.data;
}

// Use in execution
async function execute(input) {
  const validInput = validateInput(input);
  const result = await processInput(validInput);
  return validateOutput(result);
}
`;
}

/**
 * Gets example code for safe execution alternatives
 */
function getSafeExecutionExample(framework: string): string {
  // Implementation would provide framework-specific examples
  
  // For now, return a placeholder example
  return `
// Instead of:
// const result = eval(userInput);

// Use a safer alternative:
const allowedFunctions = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
  // Add more safe functions as needed
};

function safeExecute(functionName, args) {
  if (allowedFunctions.hasOwnProperty(functionName)) {
    return allowedFunctions[functionName](...args);
  }
  throw new Error(\`Function \${functionName} is not allowed\`);
}

// Example usage:
const result = safeExecute('add', [1, 2]); // Returns 3
`;
}

/**
 * Gets example code for governance hooks
 */
function getGovernanceHookExample(framework: string): string {
  // Implementation would provide framework-specific examples
  
  // For now, return a placeholder example
  return `
// Add governance hooks to your agent
import { GovernanceWrapper } from 'promethios';

class MyAgent {
  async execute(input) {
    // Pre-execution governance hook
    await GovernanceWrapper.beforeExecution({
      input,
      context: this.context,
      agentId: this.id
    });
    
    // Process the input
    const result = await this.processInput(input);
    
    // Post-execution governance hook
    const governanceResult = await GovernanceWrapper.afterExecution({
      input,
      output: result,
      context: this.context,
      agentId: this.id
    });
    
    // Return the potentially modified result
    return governanceResult.output;
  }
}
`;
}
