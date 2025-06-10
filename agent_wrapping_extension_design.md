# Agent Wrapping Extension System Design

## Overview

This document outlines the design for enhancing the Promethios extension system to support robust agent wrapping and observer capabilities. The design ensures that developers can easily wrap their API-enabled LLM models with Promethios governance controls while maintaining flexibility and extensibility.

## 1. Agent Wrapping Architecture

### 1.1 Core Components

The agent wrapping extension system consists of the following core components:

#### 1.1.1 AgentWrapperRegistry

The `AgentWrapperRegistry` is responsible for managing agent wrappers and their lifecycle:

```typescript
class AgentWrapperRegistry {
  // Register an agent wrapper
  registerWrapper(wrapper: AgentWrapper): boolean;
  
  // Deregister an agent wrapper
  deregisterWrapper(wrapperId: string): boolean;
  
  // Get a wrapper by ID
  getWrapper(wrapperId: string): AgentWrapper | null;
  
  // Get all registered wrappers
  getAllWrappers(): AgentWrapper[];
  
  // Enable a wrapper
  enableWrapper(wrapperId: string): boolean;
  
  // Disable a wrapper
  disableWrapper(wrapperId: string): boolean;
}
```

#### 1.1.2 AgentWrapper Interface

The `AgentWrapper` interface defines the contract for agent wrappers:

```typescript
interface AgentWrapper {
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
```

#### 1.1.3 Schema Validation

The schema validation system ensures that all agent interactions conform to defined schemas:

```typescript
interface Schema {
  // Schema ID
  id: string;
  
  // Schema version
  version: string;
  
  // Schema definition (JSON Schema format)
  definition: any;
  
  // Validate data against the schema
  validate(data: any): ValidationResult;
}

interface ValidationResult {
  // Whether the validation passed
  valid: boolean;
  
  // Validation errors, if any
  errors: ValidationError[];
}

interface ValidationError {
  // Path to the error
  path: string;
  
  // Error message
  message: string;
  
  // Error code
  code: string;
}
```

### 1.2 Extension Points

The agent wrapping extension system provides the following extension points:

#### 1.2.1 Wrapper Extension Points

```typescript
// Register a new agent wrapper
ExtensionRegistry.registerExtensionPoint('agent:wrapper', {
  register: (wrapper: AgentWrapper) => AgentWrapperRegistry.registerWrapper(wrapper),
  deregister: (wrapperId: string) => AgentWrapperRegistry.deregisterWrapper(wrapperId)
});

// Register a schema validator
ExtensionRegistry.registerExtensionPoint('agent:schema', {
  register: (schema: Schema) => SchemaRegistry.registerSchema(schema),
  deregister: (schemaId: string) => SchemaRegistry.deregisterSchema(schemaId)
});

// Register a governance rule
ExtensionRegistry.registerExtensionPoint('agent:governance', {
  register: (rule: GovernanceRule) => GovernanceRuleRegistry.registerRule(rule),
  deregister: (ruleId: string) => GovernanceRuleRegistry.deregisterRule(ruleId)
});

// Register a metric collector
ExtensionRegistry.registerExtensionPoint('agent:metrics', {
  register: (collector: MetricCollector) => MetricCollectorRegistry.registerCollector(collector),
  deregister: (collectorId: string) => MetricCollectorRegistry.deregisterCollector(collectorId)
});
```

#### 1.2.2 Lifecycle Hooks

```typescript
// Pre-request hook
ExtensionRegistry.registerExtensionPoint('agent:preRequest', {
  register: (hook: PreRequestHook) => HookRegistry.registerPreRequestHook(hook),
  deregister: (hookId: string) => HookRegistry.deregisterPreRequestHook(hookId)
});

// Post-response hook
ExtensionRegistry.registerExtensionPoint('agent:postResponse', {
  register: (hook: PostResponseHook) => HookRegistry.registerPostResponseHook(hook),
  deregister: (hookId: string) => HookRegistry.deregisterPostResponseHook(hookId)
});

// Error hook
ExtensionRegistry.registerExtensionPoint('agent:error', {
  register: (hook: ErrorHook) => HookRegistry.registerErrorHook(hook),
  deregister: (hookId: string) => HookRegistry.deregisterErrorHook(hookId)
});
```

### 1.3 Schema Requirements

In accordance with the schema wrapping requirements, all agent wrappers must:

1. Define and link `inputSchema` and `outputSchema`
2. Validate that `execute()` results conform to `outputSchema`
3. Create minimal placeholder schemas if full contract is unknown
4. Place schemas in `/app/schemas/` directory
5. Clearly stub memory-tagged schemas

Example schema implementation:

```typescript
// Input schema for a chat completion agent
const chatCompletionInputSchema: Schema = {
  id: 'chat-completion-input',
  version: '1.0.0',
  definition: {
    type: 'object',
    required: ['messages'],
    properties: {
      messages: {
        type: 'array',
        items: {
          type: 'object',
          required: ['role', 'content'],
          properties: {
            role: {
              type: 'string',
              enum: ['system', 'user', 'assistant']
            },
            content: {
              type: 'string'
            }
          }
        }
      },
      temperature: {
        type: 'number',
        minimum: 0,
        maximum: 2
      },
      max_tokens: {
        type: 'integer',
        minimum: 1
      }
    }
  },
  validate: (data) => SchemaValidator.validate(data, 'chat-completion-input')
};

// Output schema for a chat completion agent
const chatCompletionOutputSchema: Schema = {
  id: 'chat-completion-output',
  version: '1.0.0',
  definition: {
    type: 'object',
    required: ['choices'],
    properties: {
      choices: {
        type: 'array',
        items: {
          type: 'object',
          required: ['message'],
          properties: {
            message: {
              type: 'object',
              required: ['role', 'content'],
              properties: {
                role: {
                  type: 'string',
                  enum: ['assistant']
                },
                content: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    }
  },
  validate: (data) => SchemaValidator.validate(data, 'chat-completion-output')
};
```

## 2. Observer Extension System

### 2.1 Core Components

The observer extension system consists of the following core components:

#### 2.1.1 ObserverRegistry

The `ObserverRegistry` is responsible for managing observers and their lifecycle:

```typescript
class ObserverRegistry {
  // Register an observer
  registerObserver(observer: Observer): boolean;
  
  // Deregister an observer
  deregisterObserver(observerId: string): boolean;
  
  // Get an observer by ID
  getObserver(observerId: string): Observer | null;
  
  // Get all registered observers
  getAllObservers(): Observer[];
  
  // Enable an observer
  enableObserver(observerId: string): boolean;
  
  // Disable an observer
  disableObserver(observerId: string): boolean;
}
```

#### 2.1.2 Observer Interface

The `Observer` interface defines the contract for observers:

```typescript
interface Observer {
  // Unique identifier for the observer
  id: string;
  
  // Name of the observer
  name: string;
  
  // Description of the observer
  description: string;
  
  // Version of the observer
  version: string;
  
  // Observe an event
  observe(event: ObservableEvent, context: ObserverContext): Promise<ObservationResult>;
  
  // Initialize the observer
  initialize(): Promise<boolean>;
  
  // Clean up the observer
  cleanup(): Promise<boolean>;
}
```

#### 2.1.3 Observable Events

The system defines various observable events:

```typescript
interface ObservableEvent {
  // Event type
  type: string;
  
  // Event source
  source: string;
  
  // Event timestamp
  timestamp: number;
  
  // Event data
  data: any;
}

// User interaction event
interface UserInteractionEvent extends ObservableEvent {
  type: 'user:interaction';
  data: {
    // Interaction type (click, input, etc.)
    interactionType: string;
    
    // Element interacted with
    element: string;
    
    // Interaction data
    interactionData: any;
  };
}

// Route change event
interface RouteChangeEvent extends ObservableEvent {
  type: 'route:change';
  data: {
    // Previous route
    previousRoute: string;
    
    // Current route
    currentRoute: string;
    
    // Route parameters
    params: any;
  };
}

// Agent request event
interface AgentRequestEvent extends ObservableEvent {
  type: 'agent:request';
  data: {
    // Agent ID
    agentId: string;
    
    // Request data
    request: any;
    
    // Request context
    context: any;
  };
}

// Agent response event
interface AgentResponseEvent extends ObservableEvent {
  type: 'agent:response';
  data: {
    // Agent ID
    agentId: string;
    
    // Response data
    response: any;
    
    // Response context
    context: any;
  };
}
```

### 2.2 Extension Points

The observer extension system provides the following extension points:

#### 2.2.1 Observer Extension Points

```typescript
// Register a new observer
ExtensionRegistry.registerExtensionPoint('observer:observer', {
  register: (observer: Observer) => ObserverRegistry.registerObserver(observer),
  deregister: (observerId: string) => ObserverRegistry.deregisterObserver(observerId)
});

// Register an event source
ExtensionRegistry.registerExtensionPoint('observer:eventSource', {
  register: (source: EventSource) => EventSourceRegistry.registerEventSource(source),
  deregister: (sourceId: string) => EventSourceRegistry.deregisterEventSource(sourceId)
});

// Register a suggestion provider
ExtensionRegistry.registerExtensionPoint('observer:suggestionProvider', {
  register: (provider: SuggestionProvider) => SuggestionProviderRegistry.registerProvider(provider),
  deregister: (providerId: string) => SuggestionProviderRegistry.deregisterProvider(providerId)
});
```

#### 2.2.2 UI Extension Points

```typescript
// Register an observer avatar
ExtensionRegistry.registerExtensionPoint('observer:avatar', {
  register: (avatar: ObserverAvatar) => ObserverUIRegistry.registerAvatar(avatar),
  deregister: (avatarId: string) => ObserverUIRegistry.deregisterAvatar(avatarId)
});

// Register a suggestion display
ExtensionRegistry.registerExtensionPoint('observer:suggestionDisplay', {
  register: (display: SuggestionDisplay) => ObserverUIRegistry.registerSuggestionDisplay(display),
  deregister: (displayId: string) => ObserverUIRegistry.deregisterSuggestionDisplay(displayId)
});
```

## 3. Integration with Extension System

### 3.1 Registration with ExtensionRegistry

Both the agent wrapping and observer systems register with the main ExtensionRegistry:

```typescript
// Register agent wrapping extension
ExtensionRegistry.register({
  id: 'agent-wrapping-extension',
  name: 'Agent Wrapping Extension',
  description: 'Provides agent wrapping capabilities',
  version: '1.0.0',
  modules: ['agent-wrapper-module'],
  features: ['enableAgentWrapping'],
  initialize: () => AgentWrappingExtension.initialize(),
  cleanup: () => AgentWrappingExtension.cleanup()
});

// Register observer extension
ExtensionRegistry.register({
  id: 'observer-extension',
  name: 'Observer Extension',
  description: 'Provides observer capabilities',
  version: '1.0.0',
  modules: ['observer-module'],
  features: ['enableObserver'],
  initialize: () => ObserverExtension.initialize(),
  cleanup: () => ObserverExtension.cleanup()
});
```

### 3.2 Module Registration

The required modules are registered with the ModuleRegistry:

```typescript
// Register agent wrapper module
ModuleRegistry.register({
  id: 'agent-wrapper-module',
  name: 'Agent Wrapper Module',
  description: 'Provides agent wrapping functionality',
  version: '1.0.0',
  dependencies: ['schema-validation-module', 'governance-module'],
  initialize: () => AgentWrapperModule.initialize(),
  cleanup: () => AgentWrapperModule.cleanup()
});

// Register observer module
ModuleRegistry.register({
  id: 'observer-module',
  name: 'Observer Module',
  description: 'Provides observer functionality',
  version: '1.0.0',
  dependencies: ['event-system-module', 'suggestion-module'],
  initialize: () => ObserverModule.initialize(),
  cleanup: () => ObserverModule.cleanup()
});
```

### 3.3 Feature Toggle Integration

The features are registered with the FeatureToggleService:

```typescript
// Register agent wrapping feature
FeatureToggleService.registerFeature({
  id: 'enableAgentWrapping',
  name: 'Enable Agent Wrapping',
  description: 'Enables agent wrapping capabilities',
  defaultEnabled: true,
  dependencies: []
});

// Register observer feature
FeatureToggleService.registerFeature({
  id: 'enableObserver',
  name: 'Enable Observer',
  description: 'Enables observer capabilities',
  defaultEnabled: true,
  dependencies: []
});
```

## 4. State Management

### 4.1 Agent Wrapping State

The agent wrapping system maintains the following state:

```typescript
interface AgentWrappingState {
  // Registered wrappers
  wrappers: {
    [wrapperId: string]: {
      // Wrapper instance
      instance: AgentWrapper;
      
      // Whether the wrapper is enabled
      enabled: boolean;
      
      // Wrapper metrics
      metrics: {
        // Number of requests processed
        requestCount: number;
        
        // Number of successful responses
        successCount: number;
        
        // Number of errors
        errorCount: number;
        
        // Average response time
        averageResponseTime: number;
      };
    };
  };
  
  // Active requests
  activeRequests: {
    [requestId: string]: {
      // Request data
      request: any;
      
      // Request context
      context: any;
      
      // Start time
      startTime: number;
      
      // Wrapper ID
      wrapperId: string;
    };
  };
}
```

### 4.2 Observer State

The observer system maintains the following state:

```typescript
interface ObserverState {
  // Registered observers
  observers: {
    [observerId: string]: {
      // Observer instance
      instance: Observer;
      
      // Whether the observer is enabled
      enabled: boolean;
      
      // Observer metrics
      metrics: {
        // Number of events observed
        eventCount: number;
        
        // Number of suggestions generated
        suggestionCount: number;
        
        // Number of suggestions accepted
        acceptedSuggestionCount: number;
        
        // Number of suggestions rejected
        rejectedSuggestionCount: number;
      };
    };
  };
  
  // Active observations
  activeObservations: {
    [observationId: string]: {
      // Event being observed
      event: ObservableEvent;
      
      // Observation context
      context: any;
      
      // Start time
      startTime: number;
      
      // Observer ID
      observerId: string;
    };
  };
  
  // Current suggestions
  currentSuggestions: {
    [suggestionId: string]: {
      // Suggestion content
      content: any;
      
      // Suggestion context
      context: any;
      
      // Creation time
      creationTime: number;
      
      // Observer ID
      observerId: string;
      
      // Whether the suggestion has been displayed
      displayed: boolean;
      
      // Whether the suggestion has been acted upon
      actedUpon: boolean;
    };
  };
}
```

## 5. UI Integration

### 5.1 Agent Wrapping UI Components

The agent wrapping system provides the following UI components:

```typescript
// Agent wrapper management component
class AgentWrapperManagement extends React.Component {
  // Component implementation
}

// Agent wrapper detail component
class AgentWrapperDetail extends React.Component {
  // Component implementation
}

// Agent wrapper metrics component
class AgentWrapperMetrics extends React.Component {
  // Component implementation
}

// Agent wrapper configuration component
class AgentWrapperConfiguration extends React.Component {
  // Component implementation
}
```

### 5.2 Observer UI Components

The observer system provides the following UI components:

```typescript
// Observer avatar component
class ObserverAvatar extends React.Component {
  // Component implementation
}

// Observer suggestion display component
class ObserverSuggestionDisplay extends React.Component {
  // Component implementation
}

// Observer configuration component
class ObserverConfiguration extends React.Component {
  // Component implementation
}

// Observer metrics component
class ObserverMetrics extends React.Component {
  // Component implementation
}
```

## 6. API Integration

### 6.1 Agent Wrapping API

The agent wrapping system provides the following API endpoints:

```typescript
// Register a wrapper
POST /api/agent-wrapping/wrappers
{
  "name": "OpenAI Wrapper",
  "description": "Wrapper for OpenAI API",
  "version": "1.0.0",
  "supportedProviders": ["openai"],
  "inputSchema": { ... },
  "outputSchema": { ... }
}

// Get all wrappers
GET /api/agent-wrapping/wrappers

// Get a specific wrapper
GET /api/agent-wrapping/wrappers/:wrapperId

// Update a wrapper
PUT /api/agent-wrapping/wrappers/:wrapperId
{
  "name": "Updated OpenAI Wrapper",
  "description": "Updated wrapper for OpenAI API",
  "version": "1.0.1",
  "supportedProviders": ["openai"],
  "inputSchema": { ... },
  "outputSchema": { ... }
}

// Delete a wrapper
DELETE /api/agent-wrapping/wrappers/:wrapperId

// Enable a wrapper
POST /api/agent-wrapping/wrappers/:wrapperId/enable

// Disable a wrapper
POST /api/agent-wrapping/wrappers/:wrapperId/disable

// Wrap a request
POST /api/agent-wrapping/wrap
{
  "wrapperId": "openai-wrapper",
  "request": {
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ]
  },
  "context": {
    "userId": "user-123",
    "sessionId": "session-456"
  }
}
```

### 6.2 Observer API

The observer system provides the following API endpoints:

```typescript
// Register an observer
POST /api/observer/observers
{
  "name": "User Interaction Observer",
  "description": "Observes user interactions",
  "version": "1.0.0"
}

// Get all observers
GET /api/observer/observers

// Get a specific observer
GET /api/observer/observers/:observerId

// Update an observer
PUT /api/observer/observers/:observerId
{
  "name": "Updated User Interaction Observer",
  "description": "Updated observer for user interactions",
  "version": "1.0.1"
}

// Delete an observer
DELETE /api/observer/observers/:observerId

// Enable an observer
POST /api/observer/observers/:observerId/enable

// Disable an observer
POST /api/observer/observers/:observerId/disable

// Report an event
POST /api/observer/events
{
  "type": "user:interaction",
  "source": "ui",
  "timestamp": 1623456789,
  "data": {
    "interactionType": "click",
    "element": "button",
    "interactionData": {
      "buttonId": "submit-button",
      "buttonText": "Submit"
    }
  }
}

// Get current suggestions
GET /api/observer/suggestions

// Act on a suggestion
POST /api/observer/suggestions/:suggestionId/act
{
  "action": "accept"
}
```

## 7. Implementation Plan

### 7.1 Phase 1: Core Infrastructure

1. Implement `AgentWrapperRegistry` and `ObserverRegistry`
2. Define extension points for agent wrapping and observer systems
3. Implement schema validation system
4. Create state management for agent wrapping and observer systems

### 7.2 Phase 2: API Layer

1. Implement agent wrapping API endpoints
2. Implement observer API endpoints
3. Create API documentation
4. Implement API authentication and authorization

### 7.3 Phase 3: UI Components

1. Implement agent wrapping UI components
2. Implement observer UI components
3. Create component documentation
4. Implement component styling

### 7.4 Phase 4: Integration

1. Integrate with ExtensionRegistry
2. Integrate with ModuleRegistry
3. Integrate with FeatureToggleService
4. Create integration tests

### 7.5 Phase 5: Testing and Documentation

1. Write unit tests for all components
2. Write integration tests for system interactions
3. Create comprehensive documentation
4. Develop example implementations

## 8. Next Steps

1. Implement `AgentWrapperRegistry` and `ObserverRegistry`
2. Define extension points for agent wrapping and observer systems
3. Create schema validation system
4. Develop state management for agent wrapping and observer systems
5. Begin API layer implementation
