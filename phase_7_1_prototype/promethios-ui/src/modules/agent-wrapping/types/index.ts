/**
 * Core types for the Agent Wrapping module
 */

/**
 * Interface for schema validation
 */
export interface Schema {
  // Schema ID
  id: string;
  
  // Schema version
  version: string;
  
  // Schema definition (JSON Schema format)
  definition: any;
  
  // Validate data against the schema
  validate(data: any): ValidationResult;
}

/**
 * Result of schema validation
 */
export interface ValidationResult {
  // Whether the validation passed
  valid: boolean;
  
  // Validation errors, if any
  errors: ValidationError[];
}

/**
 * Error from schema validation
 */
export interface ValidationError {
  // Path to the error
  path: string;
  
  // Error message
  message: string;
  
  // Error code
  code: string;
}

/**
 * Context for wrapper execution
 */
export interface WrapperContext {
  // User ID
  userId: string;
  
  // Session ID
  sessionId: string;
  
  // Request ID
  requestId: string;
  
  // Timestamp
  timestamp: number;
  
  // Additional context data
  data?: Record<string, any>;
}

/**
 * Interface for agent wrappers
 */
export interface AgentWrapper {
  // Unique identifier for the wrapper
  id: string;
  
  // Name of the wrapper
  name: string;
  
  // Description of the wrapper
  description: string;
  
  // Version of the wrapper
  version: string;
  
  // Supported LLM providers
  supportedProviders: string[];
  
  // Input schema for the wrapper
  inputSchema: Schema;
  
  // Output schema for the wrapper
  outputSchema: Schema;
  
  // Wrap an API call
  wrap(request: any, context: WrapperContext): Promise<any>;
  
  // Unwrap an API response
  unwrap(response: any, context: WrapperContext): Promise<any>;
  
  // Initialize the wrapper
  initialize(): Promise<boolean>;
  
  // Clean up the wrapper
  cleanup(): Promise<boolean>;
}

/**
 * Metrics for agent wrappers
 */
export interface WrapperMetrics {
  // Number of requests processed
  requestCount: number;
  
  // Number of successful responses
  successCount: number;
  
  // Number of errors
  errorCount: number;
  
  // Average response time
  averageResponseTime: number;
}

/**
 * State for agent wrapping
 */
export interface AgentWrappingState {
  // Registered wrappers
  wrappers: {
    [wrapperId: string]: {
      // Wrapper instance
      instance: AgentWrapper;
      
      // Whether the wrapper is enabled
      enabled: boolean;
      
      // Wrapper metrics
      metrics: WrapperMetrics;
    };
  };
  
  // Active requests
  activeRequests: {
    [requestId: string]: {
      // Request data
      request: any;
      
      // Request context
      context: WrapperContext;
      
      // Start time
      startTime: number;
      
      // Wrapper ID
      wrapperId: string;
    };
  };
}

/**
 * Hook for agent wrapping
 */
export interface AgentWrappingHook {
  // Hook ID
  id: string;
  
  // Hook name
  name: string;
  
  // Hook description
  description: string;
  
  // Execute the hook
  execute(data: any, context: any): Promise<any>;
}

/**
 * Pre-request hook
 */
export interface PreRequestHook extends AgentWrappingHook {
  // Hook type
  type: 'preRequest';
}

/**
 * Post-response hook
 */
export interface PostResponseHook extends AgentWrappingHook {
  // Hook type
  type: 'postResponse';
}

/**
 * Error hook
 */
export interface ErrorHook extends AgentWrappingHook {
  // Hook type
  type: 'error';
}
