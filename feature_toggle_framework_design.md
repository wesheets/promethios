# Feature Toggle Framework Design for Chat and Modes

## 1. Overview

This document outlines the design for the feature toggle framework specifically focused on chat interfaces and modes within the Promethios system. The framework provides a robust, context-aware mechanism for toggling between different chat modes (governance vs. non-governance) and supports multi-agent functionality.

## 2. Core Components

### 2.1 Enhanced FeatureToggleService

The enhanced `FeatureToggleService` extends the base implementation with context-aware toggling capabilities:

```typescript
class EnhancedFeatureToggleService {
  // Base functionality
  registerFeature(feature: Feature): boolean;
  enableFeature(featureId: string): boolean;
  disableFeature(featureId: string): boolean;
  isFeatureEnabled(featureId: string): boolean;
  
  // Enhanced functionality
  isFeatureEnabledInContext(featureId: string, context: ToggleContext): boolean;
  setContextualOverride(featureId: string, context: ToggleContext, enabled: boolean): boolean;
  clearContextualOverride(featureId: string, context: ToggleContext): boolean;
  getFeatureState(featureId: string, context?: ToggleContext): FeatureState;
}
```

### 2.2 Context-Aware Toggle Types

```typescript
interface ToggleContext {
  // User context
  userId?: string;
  userRole?: string;
  userPreferences?: Record<string, any>;
  
  // Session context
  sessionId?: string;
  sessionType?: string;
  
  // Chat context
  chatId?: string;
  chatMode?: 'governance' | 'standard' | 'multi-agent';
  agentIds?: string[];
  
  // UI context
  route?: string;
  component?: string;
  
  // Custom context
  [key: string]: any;
}

interface FeatureState {
  // Whether the feature is enabled
  enabled: boolean;
  
  // Source of the state (global, contextual, dependency)
  source: 'global' | 'contextual' | 'dependency';
  
  // Reason for the current state
  reason?: string;
  
  // Dependencies affecting the state
  dependencies?: {
    [dependencyId: string]: boolean;
  };
}
```

### 2.3 Feature Definition

```typescript
interface Feature {
  // Unique identifier for the feature
  id: string;
  
  // Display name for the feature
  name: string;
  
  // Description of the feature
  description: string;
  
  // Whether the feature is enabled by default
  defaultEnabled: boolean;
  
  // Feature dependencies
  dependencies?: string[];
  
  // Context-specific rules
  contextRules?: ContextRule[];
  
  // Feature metadata
  metadata?: Record<string, any>;
}

interface ContextRule {
  // Context matcher
  context: Partial<ToggleContext>;
  
  // Whether the feature should be enabled in this context
  enabled: boolean;
  
  // Priority of the rule (higher wins)
  priority: number;
  
  // Description of the rule
  description?: string;
}
```

## 3. Chat Mode Toggle Implementation

### 3.1 Chat Mode Features

```typescript
// Register governance chat mode feature
FeatureToggleService.registerFeature({
  id: 'enableGovernanceMode',
  name: 'Enable Governance Mode',
  description: 'Enables governance-focused chat mode',
  defaultEnabled: true,
  dependencies: ['enableChat'],
  contextRules: [
    {
      context: { userRole: 'governance-admin' },
      enabled: true,
      priority: 100,
      description: 'Always enabled for governance admins'
    },
    {
      context: { userRole: 'guest' },
      enabled: false,
      priority: 90,
      description: 'Disabled for guest users'
    }
  ]
});

// Register standard chat mode feature
FeatureToggleService.registerFeature({
  id: 'enableStandardMode',
  name: 'Enable Standard Mode',
  description: 'Enables standard (non-governance) chat mode',
  defaultEnabled: true,
  dependencies: ['enableChat'],
  contextRules: [
    {
      context: { userRole: 'guest' },
      enabled: true,
      priority: 90,
      description: 'Always enabled for guest users'
    }
  ]
});

// Register multi-agent chat feature
FeatureToggleService.registerFeature({
  id: 'enableMultiAgentChat',
  name: 'Enable Multi-Agent Chat',
  description: 'Enables chat with multiple agents',
  defaultEnabled: false,
  dependencies: ['enableChat'],
  contextRules: [
    {
      context: { userRole: 'developer' },
      enabled: true,
      priority: 80,
      description: 'Enabled for developers'
    },
    {
      context: { userRole: 'governance-admin' },
      enabled: true,
      priority: 80,
      description: 'Enabled for governance admins'
    }
  ]
});
```

### 3.2 Chat Mode Toggle Component

```typescript
interface ChatModeToggleProps {
  // Current chat mode
  currentMode: 'governance' | 'standard' | 'multi-agent';
  
  // Callback for mode change
  onModeChange: (mode: 'governance' | 'standard' | 'multi-agent') => void;
  
  // Toggle context
  context?: ToggleContext;
}

class ChatModeToggle extends React.Component<ChatModeToggleProps> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: 'chat-mode-toggle',
      component: this,
      extensionPoints: ['chat-controls']
    });
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent('chat-mode-toggle');
  }
  
  handleModeChange = (mode: 'governance' | 'standard' | 'multi-agent') => {
    const { onModeChange, context } = this.props;
    
    // Check if mode is enabled in current context
    const isEnabled = mode === 'governance'
      ? FeatureToggleService.isFeatureEnabledInContext('enableGovernanceMode', context)
      : mode === 'standard'
        ? FeatureToggleService.isFeatureEnabledInContext('enableStandardMode', context)
        : FeatureToggleService.isFeatureEnabledInContext('enableMultiAgentChat', context);
    
    if (isEnabled) {
      onModeChange(mode);
    } else {
      // Handle disabled mode
      NotificationService.notify({
        type: 'warning',
        message: `${mode} mode is not available in your current context.`
      });
    }
  };
  
  render() {
    const { currentMode, context } = this.props;
    
    // Check which modes are enabled
    const isGovernanceEnabled = FeatureToggleService.isFeatureEnabledInContext('enableGovernanceMode', context);
    const isStandardEnabled = FeatureToggleService.isFeatureEnabledInContext('enableStandardMode', context);
    const isMultiAgentEnabled = FeatureToggleService.isFeatureEnabledInContext('enableMultiAgentChat', context);
    
    return (
      <div className="chat-mode-toggle">
        {isGovernanceEnabled && (
          <button
            className={`mode-button ${currentMode === 'governance' ? 'active' : ''}`}
            onClick={() => this.handleModeChange('governance')}
          >
            Governance Mode
          </button>
        )}
        
        {isStandardEnabled && (
          <button
            className={`mode-button ${currentMode === 'standard' ? 'active' : ''}`}
            onClick={() => this.handleModeChange('standard')}
          >
            Standard Mode
          </button>
        )}
        
        {isMultiAgentEnabled && (
          <button
            className={`mode-button ${currentMode === 'multi-agent' ? 'active' : ''}`}
            onClick={() => this.handleModeChange('multi-agent')}
          >
            Multi-Agent Mode
          </button>
        )}
      </div>
    );
  }
}
```

## 4. Multi-Agent Support

### 4.1 Multi-Agent Features

```typescript
// Register agent selection feature
FeatureToggleService.registerFeature({
  id: 'enableAgentSelection',
  name: 'Enable Agent Selection',
  description: 'Enables selection of agents for chat',
  defaultEnabled: true,
  dependencies: ['enableMultiAgentChat'],
  contextRules: []
});

// Register agent role assignment feature
FeatureToggleService.registerFeature({
  id: 'enableAgentRoleAssignment',
  name: 'Enable Agent Role Assignment',
  description: 'Enables assignment of roles to agents',
  defaultEnabled: true,
  dependencies: ['enableMultiAgentChat'],
  contextRules: []
});

// Register context sharing feature
FeatureToggleService.registerFeature({
  id: 'enableContextSharing',
  name: 'Enable Context Sharing',
  description: 'Enables sharing of context between agents',
  defaultEnabled: true,
  dependencies: ['enableMultiAgentChat'],
  contextRules: [
    {
      context: { userRole: 'guest' },
      enabled: false,
      priority: 90,
      description: 'Disabled for guest users'
    }
  ]
});
```

### 4.2 Agent Selection Component

```typescript
interface AgentSelectionProps {
  // Available agents
  availableAgents: Agent[];
  
  // Selected agents
  selectedAgents: Agent[];
  
  // Callback for selection change
  onSelectionChange: (agents: Agent[]) => void;
  
  // Toggle context
  context?: ToggleContext;
}

class AgentSelection extends React.Component<AgentSelectionProps> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: 'agent-selection',
      component: this,
      extensionPoints: ['multi-agent-controls']
    });
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent('agent-selection');
  }
  
  handleAgentToggle = (agent: Agent) => {
    const { selectedAgents, onSelectionChange } = this.props;
    
    const isSelected = selectedAgents.some(a => a.id === agent.id);
    
    if (isSelected) {
      onSelectionChange(selectedAgents.filter(a => a.id !== agent.id));
    } else {
      onSelectionChange([...selectedAgents, agent]);
    }
  };
  
  render() {
    const { availableAgents, selectedAgents, context } = this.props;
    
    // Check if agent selection is enabled
    const isAgentSelectionEnabled = FeatureToggleService.isFeatureEnabledInContext('enableAgentSelection', context);
    
    if (!isAgentSelectionEnabled) {
      return null;
    }
    
    return (
      <div className="agent-selection">
        <h3>Select Agents</h3>
        <div className="agent-list">
          {availableAgents.map(agent => (
            <div
              key={agent.id}
              className={`agent-item ${selectedAgents.some(a => a.id === agent.id) ? 'selected' : ''}`}
              onClick={() => this.handleAgentToggle(agent)}
            >
              <div className="agent-avatar">
                {agent.avatar ? <img src={agent.avatar} alt={agent.name} /> : <div className="avatar-placeholder" />}
              </div>
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-description">{agent.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
```

### 4.3 Agent Role Assignment Component

```typescript
interface AgentRoleAssignmentProps {
  // Selected agents
  selectedAgents: Agent[];
  
  // Agent roles
  agentRoles: Record<string, string>;
  
  // Available roles
  availableRoles: string[];
  
  // Callback for role change
  onRoleChange: (agentId: string, role: string) => void;
  
  // Toggle context
  context?: ToggleContext;
}

class AgentRoleAssignment extends React.Component<AgentRoleAssignmentProps> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: 'agent-role-assignment',
      component: this,
      extensionPoints: ['multi-agent-controls']
    });
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent('agent-role-assignment');
  }
  
  handleRoleChange = (agentId: string, role: string) => {
    const { onRoleChange } = this.props;
    onRoleChange(agentId, role);
  };
  
  render() {
    const { selectedAgents, agentRoles, availableRoles, context } = this.props;
    
    // Check if role assignment is enabled
    const isRoleAssignmentEnabled = FeatureToggleService.isFeatureEnabledInContext('enableAgentRoleAssignment', context);
    
    if (!isRoleAssignmentEnabled || selectedAgents.length === 0) {
      return null;
    }
    
    return (
      <div className="agent-role-assignment">
        <h3>Assign Roles</h3>
        <div className="role-assignment-list">
          {selectedAgents.map(agent => (
            <div key={agent.id} className="role-assignment-item">
              <div className="agent-name">{agent.name}</div>
              <select
                value={agentRoles[agent.id] || ''}
                onChange={e => this.handleRoleChange(agent.id, e.target.value)}
              >
                <option value="">Select Role</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
```

## 5. Observer Integration

### 5.1 Observer Features

```typescript
// Register observer feature
FeatureToggleService.registerFeature({
  id: 'enableObserver',
  name: 'Enable Observer',
  description: 'Enables the observer agent',
  defaultEnabled: true,
  dependencies: [],
  contextRules: [
    {
      context: { userRole: 'guest' },
      enabled: false,
      priority: 90,
      description: 'Disabled for guest users'
    }
  ]
});

// Register observer chat bubble feature
FeatureToggleService.registerFeature({
  id: 'enableObserverChatBubble',
  name: 'Enable Observer Chat Bubble',
  description: 'Enables the observer chat bubble UI',
  defaultEnabled: true,
  dependencies: ['enableObserver'],
  contextRules: []
});

// Register observer suggestions feature
FeatureToggleService.registerFeature({
  id: 'enableObserverSuggestions',
  name: 'Enable Observer Suggestions',
  description: 'Enables suggestions from the observer',
  defaultEnabled: true,
  dependencies: ['enableObserver'],
  contextRules: []
});
```

### 5.2 Observer Chat Bubble Component

```typescript
interface ObserverChatBubbleProps {
  // Observer state
  observerState: {
    // Whether the observer is active
    active: boolean;
    
    // Whether the chat bubble is expanded
    expanded: boolean;
    
    // Current suggestions
    suggestions: ObserverSuggestion[];
    
    // Current message
    message?: string;
  };
  
  // Callbacks
  onToggleExpand: () => void;
  onToggleActive: () => void;
  onSuggestionSelect: (suggestion: ObserverSuggestion) => void;
  
  // Toggle context
  context?: ToggleContext;
}

class ObserverChatBubble extends React.Component<ObserverChatBubbleProps> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: 'observer-chat-bubble',
      component: this,
      extensionPoints: ['global-ui']
    });
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent('observer-chat-bubble');
  }
  
  render() {
    const { observerState, onToggleExpand, onToggleActive, onSuggestionSelect, context } = this.props;
    const { active, expanded, suggestions, message } = observerState;
    
    // Check if observer chat bubble is enabled
    const isObserverChatBubbleEnabled = FeatureToggleService.isFeatureEnabledInContext('enableObserverChatBubble', context);
    
    if (!isObserverChatBubbleEnabled) {
      return null;
    }
    
    return (
      <div className={`observer-chat-bubble ${expanded ? 'expanded' : 'collapsed'} ${active ? 'active' : 'inactive'}`}>
        {expanded ? (
          <div className="observer-expanded">
            <div className="observer-header">
              <div className="observer-title">Observer</div>
              <div className="observer-controls">
                <button className="toggle-active" onClick={onToggleActive}>
                  {active ? 'Disable' : 'Enable'}
                </button>
                <button className="toggle-expand" onClick={onToggleExpand}>
                  Collapse
                </button>
              </div>
            </div>
            <div className="observer-content">
              {message && <div className="observer-message">{message}</div>}
              {suggestions.length > 0 && (
                <div className="observer-suggestions">
                  <div className="suggestions-title">Suggestions</div>
                  <div className="suggestions-list">
                    {suggestions.map(suggestion => (
                      <div
                        key={suggestion.id}
                        className="suggestion-item"
                        onClick={() => onSuggestionSelect(suggestion)}
                      >
                        {suggestion.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="observer-collapsed" onClick={onToggleExpand}>
            <div className="observer-icon">👁️</div>
            {active && suggestions.length > 0 && (
              <div className="suggestion-count">{suggestions.length}</div>
            )}
          </div>
        )}
      </div>
    );
  }
}
```

## 6. Integration with Extension System

### 6.1 Registration with ExtensionRegistry

```typescript
// Register feature toggle extension
ExtensionRegistry.register({
  id: 'feature-toggle-extension',
  name: 'Feature Toggle Extension',
  description: 'Provides feature toggling capabilities',
  version: '1.0.0',
  modules: ['feature-toggle-module'],
  features: ['enableFeatureToggle'],
  initialize: () => FeatureToggleExtension.initialize(),
  cleanup: () => FeatureToggleExtension.cleanup()
});
```

### 6.2 Module Registration

```typescript
// Register feature toggle module
ModuleRegistry.register({
  id: 'feature-toggle-module',
  name: 'Feature Toggle Module',
  description: 'Provides feature toggling functionality',
  version: '1.0.0',
  dependencies: ['context-module', 'user-preferences-module'],
  initialize: () => FeatureToggleModule.initialize(),
  cleanup: () => FeatureToggleModule.cleanup()
});
```

### 6.3 Extension Points

```typescript
// Register feature toggle extension points
ExtensionRegistry.registerExtensionPoint('feature:register', {
  register: (feature: Feature) => FeatureToggleService.registerFeature(feature),
  deregister: (featureId: string) => FeatureToggleService.deregisterFeature(featureId)
});

ExtensionRegistry.registerExtensionPoint('feature:contextRule', {
  register: (featureId: string, rule: ContextRule) => FeatureToggleService.addContextRule(featureId, rule),
  deregister: (featureId: string, ruleId: string) => FeatureToggleService.removeContextRule(featureId, ruleId)
});
```

## 7. State Management

### 7.1 Feature Toggle State

```typescript
interface FeatureToggleState {
  // Registered features
  features: {
    [featureId: string]: Feature;
  };
  
  // Global feature state
  globalState: {
    [featureId: string]: boolean;
  };
  
  // Contextual overrides
  contextualOverrides: {
    [featureId: string]: {
      [contextHash: string]: boolean;
    };
  };
  
  // Context rules
  contextRules: {
    [featureId: string]: ContextRule[];
  };
}
```

### 7.2 Chat Mode State

```typescript
interface ChatModeState {
  // Current chat mode
  currentMode: 'governance' | 'standard' | 'multi-agent';
  
  // Previous chat mode
  previousMode?: 'governance' | 'standard' | 'multi-agent';
  
  // Mode-specific state
  governanceModeState: {
    // Governance rules
    rules: GovernanceRule[];
    
    // Compliance status
    complianceStatus: 'compliant' | 'non-compliant' | 'unknown';
  };
  
  standardModeState: {
    // Standard mode settings
    settings: Record<string, any>;
  };
  
  multiAgentModeState: {
    // Selected agents
    selectedAgents: Agent[];
    
    // Agent roles
    agentRoles: Record<string, string>;
    
    // Context sharing settings
    contextSharing: {
      enabled: boolean;
      scope: 'all' | 'selective' | 'none';
      agentPermissions: Record<string, string[]>;
    };
  };
}
```

### 7.3 Observer State

```typescript
interface ObserverState {
  // Whether the observer is active
  active: boolean;
  
  // Whether the chat bubble is expanded
  expanded: boolean;
  
  // Current suggestions
  suggestions: ObserverSuggestion[];
  
  // Current message
  message?: string;
  
  // Observer context
  context: {
    // Current route
    route: string;
    
    // Current user
    user: {
      id: string;
      role: string;
    };
    
    // Current chat
    chat?: {
      id: string;
      mode: 'governance' | 'standard' | 'multi-agent';
    };
  };
}
```

## 8. API Integration

### 8.1 Feature Toggle API

```typescript
// Register a feature
POST /api/feature-toggle/features
{
  "id": "enableGovernanceMode",
  "name": "Enable Governance Mode",
  "description": "Enables governance-focused chat mode",
  "defaultEnabled": true,
  "dependencies": ["enableChat"],
  "contextRules": [
    {
      "context": { "userRole": "governance-admin" },
      "enabled": true,
      "priority": 100,
      "description": "Always enabled for governance admins"
    }
  ]
}

// Get all features
GET /api/feature-toggle/features

// Get a specific feature
GET /api/feature-toggle/features/:featureId

// Update a feature
PUT /api/feature-toggle/features/:featureId
{
  "name": "Updated Governance Mode",
  "description": "Updated description",
  "defaultEnabled": true
}

// Delete a feature
DELETE /api/feature-toggle/features/:featureId

// Enable a feature
POST /api/feature-toggle/features/:featureId/enable

// Disable a feature
POST /api/feature-toggle/features/:featureId/disable

// Add a context rule
POST /api/feature-toggle/features/:featureId/context-rules
{
  "context": { "userRole": "developer" },
  "enabled": true,
  "priority": 90,
  "description": "Enabled for developers"
}

// Check feature state in context
POST /api/feature-toggle/check
{
  "featureId": "enableGovernanceMode",
  "context": {
    "userId": "user-123",
    "userRole": "developer",
    "chatMode": "governance"
  }
}
```

### 8.2 Chat Mode API

```typescript
// Get current chat mode
GET /api/chat/mode

// Set chat mode
POST /api/chat/mode
{
  "mode": "governance"
}

// Get available chat modes
GET /api/chat/available-modes

// Get multi-agent configuration
GET /api/chat/multi-agent/config

// Update multi-agent configuration
POST /api/chat/multi-agent/config
{
  "selectedAgents": ["agent-1", "agent-2"],
  "agentRoles": {
    "agent-1": "critic",
    "agent-2": "creator"
  },
  "contextSharing": {
    "enabled": true,
    "scope": "selective",
    "agentPermissions": {
      "agent-1": ["agent-2"],
      "agent-2": ["agent-1"]
    }
  }
}
```

### 8.3 Observer API

```typescript
// Get observer state
GET /api/observer/state

// Update observer state
POST /api/observer/state
{
  "active": true,
  "expanded": false
}

// Get observer suggestions
GET /api/observer/suggestions

// Act on a suggestion
POST /api/observer/suggestions/:suggestionId/act
{
  "action": "accept"
}
```

## 9. Implementation Plan

### 9.1 Phase 1: Core Framework

1. Implement `EnhancedFeatureToggleService`
2. Define context-aware toggle types
3. Implement feature definition and context rules
4. Create state management for feature toggles

### 9.2 Phase 2: Chat Mode Implementation

1. Implement chat mode features
2. Develop chat mode toggle component
3. Create chat mode state management
4. Implement chat mode API endpoints

### 9.3 Phase 3: Multi-Agent Support

1. Implement multi-agent features
2. Develop agent selection component
3. Create agent role assignment component
4. Implement multi-agent state management
5. Develop multi-agent API endpoints

### 9.4 Phase 4: Observer Integration

1. Implement observer features
2. Develop observer chat bubble component
3. Create observer state management
4. Implement observer API endpoints

### 9.5 Phase 5: Extension System Integration

1. Register with ExtensionRegistry
2. Register modules with ModuleRegistry
3. Define extension points
4. Create integration tests

## 10. Next Steps

1. Implement `EnhancedFeatureToggleService`
2. Define context-aware toggle types
3. Implement feature definition and context rules
4. Create state management for feature toggles
5. Begin chat mode implementation
