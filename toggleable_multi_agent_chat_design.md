# Toggleable and Multi-Agent Chat Interfaces Design

## 1. Overview

This document outlines the design for the toggleable and multi-agent chat interfaces in the Promethios system. These interfaces allow users to switch between governance and standard chat modes, and to interact with multiple agents simultaneously with role assignments and context sharing.

## 2. Core Components

### 2.1 ChatModeManager

The `ChatModeManager` manages the different chat modes and transitions between them:

```typescript
class ChatModeManager {
  // Initialize the chat mode manager
  initialize(config: ChatModeConfig): Promise<boolean>;
  
  // Get the current chat mode
  getCurrentMode(): ChatMode;
  
  // Switch to a different chat mode
  switchMode(mode: ChatMode, preserveContext?: boolean): Promise<boolean>;
  
  // Check if a mode is available in the current context
  isModeAvailable(mode: ChatMode, context?: ChatContext): boolean;
  
  // Get all available modes in the current context
  getAvailableModes(context?: ChatContext): ChatMode[];
  
  // Register a mode change listener
  registerModeChangeListener(listener: ModeChangeListener): string;
  
  // Deregister a mode change listener
  deregisterModeChangeListener(listenerId: string): boolean;
}

type ChatMode = 'governance' | 'standard' | 'multi-agent';

interface ChatModeConfig {
  // Default mode to use
  defaultMode: ChatMode;
  
  // Whether to preserve context when switching modes
  preserveContextByDefault: boolean;
  
  // Mode-specific configurations
  modeConfigs: {
    governance?: GovernanceModeConfig;
    standard?: StandardModeConfig;
    multiAgent?: MultiAgentModeConfig;
  };
}

interface ModeChangeListener {
  // Called before mode change
  onBeforeModeChange?: (fromMode: ChatMode, toMode: ChatMode) => Promise<boolean>;
  
  // Called after mode change
  onAfterModeChange?: (fromMode: ChatMode, toMode: ChatMode) => void;
}

interface ChatContext {
  // User context
  userId: string;
  userRole: string;
  
  // Session context
  sessionId: string;
  
  // Current route
  route: string;
  
  // Custom context
  [key: string]: any;
}
```

### 2.2 MultiAgentManager

The `MultiAgentManager` manages multi-agent conversations:

```typescript
class MultiAgentManager {
  // Initialize the multi-agent manager
  initialize(config: MultiAgentConfig): Promise<boolean>;
  
  // Get available agents
  getAvailableAgents(context?: ChatContext): Promise<Agent[]>;
  
  // Get selected agents
  getSelectedAgents(): Agent[];
  
  // Select agents for conversation
  selectAgents(agentIds: string[]): Promise<boolean>;
  
  // Deselect agents from conversation
  deselectAgents(agentIds: string[]): Promise<boolean>;
  
  // Get available roles
  getAvailableRoles(): string[];
  
  // Get agent roles
  getAgentRoles(): Record<string, string>;
  
  // Assign role to agent
  assignRole(agentId: string, role: string): Promise<boolean>;
  
  // Get context sharing settings
  getContextSharingSettings(): ContextSharingSettings;
  
  // Update context sharing settings
  updateContextSharingSettings(settings: Partial<ContextSharingSettings>): Promise<boolean>;
  
  // Send message to agents
  sendMessage(message: ChatMessage): Promise<ChatMessage[]>;
}

interface Agent {
  // Agent ID
  id: string;
  
  // Agent name
  name: string;
  
  // Agent description
  description: string;
  
  // Agent avatar URL
  avatar?: string;
  
  // Agent capabilities
  capabilities: string[];
  
  // Agent provider
  provider: string;
}

interface MultiAgentConfig {
  // Maximum number of agents in a conversation
  maxAgents: number;
  
  // Available roles
  availableRoles: string[];
  
  // Default context sharing settings
  defaultContextSharing: ContextSharingSettings;
}

interface ContextSharingSettings {
  // Whether context sharing is enabled
  enabled: boolean;
  
  // Scope of context sharing
  scope: 'all' | 'selective' | 'none';
  
  // Agent permissions for selective sharing
  agentPermissions: Record<string, string[]>;
}

interface ChatMessage {
  // Message ID
  id: string;
  
  // Sender ID (user or agent ID)
  senderId: string;
  
  // Sender type
  senderType: 'user' | 'agent';
  
  // Message content
  content: string;
  
  // Message timestamp
  timestamp: number;
  
  // Message type
  type: 'text' | 'image' | 'file' | 'system';
  
  // Message metadata
  metadata?: Record<string, any>;
  
  // Recipients (for selective sharing)
  recipients?: string[];
}
```

### 2.3 GovernanceChatService

The `GovernanceChatService` provides governance-specific chat functionality:

```typescript
class GovernanceChatService {
  // Initialize the governance chat service
  initialize(config: GovernanceChatConfig): Promise<boolean>;
  
  // Get active governance rules
  getActiveRules(): GovernanceRule[];
  
  // Check if a message complies with governance rules
  checkCompliance(message: ChatMessage): Promise<ComplianceResult>;
  
  // Get governance metrics for the current session
  getGovernanceMetrics(): Promise<GovernanceMetrics>;
  
  // Get governance suggestions
  getGovernanceSuggestions(context: ChatContext): Promise<GovernanceSuggestion[]>;
}

interface GovernanceChatConfig {
  // Governance rules to apply
  rules: GovernanceRule[];
  
  // Compliance checking mode
  complianceMode: 'strict' | 'advisory';
  
  // Whether to show governance metrics
  showMetrics: boolean;
  
  // Whether to show governance suggestions
  showSuggestions: boolean;
}

interface GovernanceRule {
  // Rule ID
  id: string;
  
  // Rule name
  name: string;
  
  // Rule description
  description: string;
  
  // Rule severity
  severity: 'critical' | 'warning' | 'info';
  
  // Rule check function
  check: (message: ChatMessage, context: ChatContext) => Promise<boolean>;
}

interface ComplianceResult {
  // Whether the message is compliant
  compliant: boolean;
  
  // Violations, if any
  violations: {
    ruleId: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }[];
  
  // Suggestions for compliance
  suggestions?: string[];
}

interface GovernanceMetrics {
  // Compliance rate
  complianceRate: number;
  
  // Rule violation counts
  violationCounts: Record<string, number>;
  
  // Governance score
  governanceScore: number;
}

interface GovernanceSuggestion {
  // Suggestion ID
  id: string;
  
  // Suggestion text
  text: string;
  
  // Related rule ID
  ruleId?: string;
  
  // Suggestion type
  type: 'prompt' | 'correction' | 'information';
}
```

## 3. UI Components

### 3.1 ChatContainer

The main container for the chat interface:

```typescript
interface ChatContainerProps {
  // Initial chat mode
  initialMode?: ChatMode;
  
  // Chat context
  context?: ChatContext;
  
  // Whether to show mode toggle
  showModeToggle?: boolean;
  
  // Whether to show agent selection (in multi-agent mode)
  showAgentSelection?: boolean;
  
  // Whether to show role assignment (in multi-agent mode)
  showRoleAssignment?: boolean;
  
  // Whether to show context sharing settings (in multi-agent mode)
  showContextSharingSettings?: boolean;
}

class ChatContainer extends React.Component<ChatContainerProps, ChatContainerState> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: 'chat-container',
      component: this,
      extensionPoints: ['chat-view']
    });
    
    // Initialize chat mode manager
    this.initializeChatModeManager();
    
    // Initialize multi-agent manager if needed
    if (this.props.initialMode === 'multi-agent') {
      this.initializeMultiAgentManager();
    }
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent('chat-container');
  }
  
  initializeChatModeManager = async () => {
    try {
      const chatModeManager = new ChatModeManager();
      await chatModeManager.initialize({
        defaultMode: this.props.initialMode || 'standard',
        preserveContextByDefault: true,
        modeConfigs: {
          governance: {
            // Governance mode config
          },
          standard: {
            // Standard mode config
          },
          multiAgent: {
            // Multi-agent mode config
          }
        }
      });
      
      // Register mode change listener
      const listenerId = chatModeManager.registerModeChangeListener({
        onBeforeModeChange: this.handleBeforeModeChange,
        onAfterModeChange: this.handleAfterModeChange
      });
      
      this.setState({
        chatModeManager,
        currentMode: chatModeManager.getCurrentMode(),
        modeChangeListenerId: listenerId
      });
    } catch (error) {
      this.setState({
        error: error.message
      });
    }
  };
  
  initializeMultiAgentManager = async () => {
    try {
      const multiAgentManager = new MultiAgentManager();
      await multiAgentManager.initialize({
        maxAgents: 5,
        availableRoles: ['critic', 'creator', 'analyst', 'facilitator'],
        defaultContextSharing: {
          enabled: true,
          scope: 'all',
          agentPermissions: {}
        }
      });
      
      const availableAgents = await multiAgentManager.getAvailableAgents(this.props.context);
      
      this.setState({
        multiAgentManager,
        availableAgents
      });
    } catch (error) {
      this.setState({
        error: error.message
      });
    }
  };
  
  handleBeforeModeChange = async (fromMode: ChatMode, toMode: ChatMode) => {
    // Handle before mode change
    // Return false to cancel mode change
    return true;
  };
  
  handleAfterModeChange = (fromMode: ChatMode, toMode: ChatMode) => {
    // Handle after mode change
    this.setState({ currentMode: toMode });
    
    // Initialize multi-agent manager if switching to multi-agent mode
    if (toMode === 'multi-agent' && !this.state.multiAgentManager) {
      this.initializeMultiAgentManager();
    }
  };
  
  handleModeToggle = async (mode: ChatMode) => {
    const { chatModeManager } = this.state;
    
    if (chatModeManager) {
      await chatModeManager.switchMode(mode);
    }
  };
  
  handleSendMessage = async (message: string) => {
    const { currentMode, chatService, multiAgentManager } = this.state;
    
    if (currentMode === 'multi-agent' && multiAgentManager) {
      const chatMessage: ChatMessage = {
        id: generateId(),
        senderId: this.props.context?.userId || 'user',
        senderType: 'user',
        content: message,
        timestamp: Date.now(),
        type: 'text'
      };
      
      const responses = await multiAgentManager.sendMessage(chatMessage);
      
      this.setState(prevState => ({
        messages: [
          ...prevState.messages,
          chatMessage,
          ...responses
        ]
      }));
    } else {
      // Handle standard or governance mode
      const chatMessage: ChatMessage = {
        id: generateId(),
        senderId: this.props.context?.userId || 'user',
        senderType: 'user',
        content: message,
        timestamp: Date.now(),
        type: 'text'
      };
      
      // Check compliance in governance mode
      if (currentMode === 'governance') {
        const governanceChatService = this.state.governanceChatService;
        
        if (governanceChatService) {
          const complianceResult = await governanceChatService.checkCompliance(chatMessage);
          
          if (!complianceResult.compliant) {
            // Handle non-compliant message
            this.setState({
              complianceViolations: complianceResult.violations
            });
            
            return;
          }
        }
      }
      
      // Send message to chat service
      if (chatService) {
        const response = await chatService.sendMessage(chatMessage);
        
        this.setState(prevState => ({
          messages: [
            ...prevState.messages,
            chatMessage,
            response
          ]
        }));
      }
    }
  };
  
  render() {
    const {
      showModeToggle = true,
      showAgentSelection = true,
      showRoleAssignment = true,
      showContextSharingSettings = true
    } = this.props;
    
    const {
      currentMode,
      chatModeManager,
      multiAgentManager,
      availableAgents,
      selectedAgents,
      agentRoles,
      contextSharingSettings,
      messages,
      error,
      complianceViolations
    } = this.state;
    
    if (error) {
      return <ErrorDisplay message={error} />;
    }
    
    return (
      <div className="chat-container">
        {showModeToggle && chatModeManager && (
          <ChatModeToggle
            currentMode={currentMode}
            availableModes={chatModeManager.getAvailableModes(this.props.context)}
            onModeToggle={this.handleModeToggle}
          />
        )}
        
        {currentMode === 'multi-agent' && multiAgentManager && (
          <div className="multi-agent-controls">
            {showAgentSelection && (
              <AgentSelection
                availableAgents={availableAgents || []}
                selectedAgents={selectedAgents || []}
                onSelectionChange={this.handleAgentSelectionChange}
              />
            )}
            
            {showRoleAssignment && (
              <AgentRoleAssignment
                selectedAgents={selectedAgents || []}
                agentRoles={agentRoles || {}}
                availableRoles={multiAgentManager.getAvailableRoles()}
                onRoleChange={this.handleAgentRoleChange}
              />
            )}
            
            {showContextSharingSettings && (
              <ContextSharingSettings
                settings={contextSharingSettings}
                selectedAgents={selectedAgents || []}
                onSettingsChange={this.handleContextSharingSettingsChange}
              />
            )}
          </div>
        )}
        
        <div className="chat-messages">
          {messages && messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              isUser={message.senderType === 'user'}
              agentName={message.senderType === 'agent' ? this.getAgentName(message.senderId) : undefined}
              agentRole={message.senderType === 'agent' ? this.getAgentRole(message.senderId) : undefined}
            />
          ))}
        </div>
        
        {complianceViolations && complianceViolations.length > 0 && (
          <ComplianceViolationDisplay
            violations={complianceViolations}
            onDismiss={() => this.setState({ complianceViolations: null })}
          />
        )}
        
        <ChatInput
          onSendMessage={this.handleSendMessage}
          disabled={currentMode === 'multi-agent' && (!selectedAgents || selectedAgents.length === 0)}
          mode={currentMode}
        />
      </div>
    );
  }
  
  getAgentName = (agentId: string) => {
    const { selectedAgents } = this.state;
    
    if (!selectedAgents) {
      return agentId;
    }
    
    const agent = selectedAgents.find(a => a.id === agentId);
    
    return agent ? agent.name : agentId;
  };
  
  getAgentRole = (agentId: string) => {
    const { agentRoles } = this.state;
    
    if (!agentRoles) {
      return undefined;
    }
    
    return agentRoles[agentId];
  };
  
  handleAgentSelectionChange = async (agents: Agent[]) => {
    const { multiAgentManager } = this.state;
    
    if (multiAgentManager) {
      // Deselect agents that are no longer selected
      const currentSelectedAgents = this.state.selectedAgents || [];
      const agentsToDeselect = currentSelectedAgents.filter(
        a => !agents.some(b => b.id === a.id)
      );
      
      if (agentsToDeselect.length > 0) {
        await multiAgentManager.deselectAgents(agentsToDeselect.map(a => a.id));
      }
      
      // Select newly selected agents
      const agentsToSelect = agents.filter(
        a => !currentSelectedAgents.some(b => b.id === a.id)
      );
      
      if (agentsToSelect.length > 0) {
        await multiAgentManager.selectAgents(agentsToSelect.map(a => a.id));
      }
      
      this.setState({ selectedAgents: agents });
    }
  };
  
  handleAgentRoleChange = async (agentId: string, role: string) => {
    const { multiAgentManager } = this.state;
    
    if (multiAgentManager) {
      await multiAgentManager.assignRole(agentId, role);
      
      this.setState(prevState => ({
        agentRoles: {
          ...prevState.agentRoles,
          [agentId]: role
        }
      }));
    }
  };
  
  handleContextSharingSettingsChange = async (settings: Partial<ContextSharingSettings>) => {
    const { multiAgentManager } = this.state;
    
    if (multiAgentManager) {
      await multiAgentManager.updateContextSharingSettings(settings);
      
      this.setState({
        contextSharingSettings: {
          ...this.state.contextSharingSettings,
          ...settings
        }
      });
    }
  };
}
```

### 3.2 ChatModeToggle

A component to toggle between chat modes:

```typescript
interface ChatModeToggleProps {
  // Current chat mode
  currentMode: ChatMode;
  
  // Available chat modes
  availableModes: ChatMode[];
  
  // Callback for mode toggle
  onModeToggle: (mode: ChatMode) => void;
}

class ChatModeToggle extends React.Component<ChatModeToggleProps> {
  render() {
    const { currentMode, availableModes, onModeToggle } = this.props;
    
    return (
      <div className="chat-mode-toggle">
        {availableModes.includes('governance') && (
          <button
            className={`mode-button ${currentMode === 'governance' ? 'active' : ''}`}
            onClick={() => onModeToggle('governance')}
          >
            Governance Mode
          </button>
        )}
        
        {availableModes.includes('standard') && (
          <button
            className={`mode-button ${currentMode === 'standard' ? 'active' : ''}`}
            onClick={() => onModeToggle('standard')}
          >
            Standard Mode
          </button>
        )}
        
        {availableModes.includes('multi-agent') && (
          <button
            className={`mode-button ${currentMode === 'multi-agent' ? 'active' : ''}`}
            onClick={() => onModeToggle('multi-agent')}
          >
            Multi-Agent Mode
          </button>
        )}
      </div>
    );
  }
}
```

### 3.3 AgentSelection

A component to select agents for multi-agent conversations:

```typescript
interface AgentSelectionProps {
  // Available agents
  availableAgents: Agent[];
  
  // Selected agents
  selectedAgents: Agent[];
  
  // Callback for selection change
  onSelectionChange: (agents: Agent[]) => void;
}

class AgentSelection extends React.Component<AgentSelectionProps> {
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
    const { availableAgents, selectedAgents } = this.props;
    
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

### 3.4 AgentRoleAssignment

A component to assign roles to agents:

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
}

class AgentRoleAssignment extends React.Component<AgentRoleAssignmentProps> {
  handleRoleChange = (agentId: string, role: string) => {
    const { onRoleChange } = this.props;
    onRoleChange(agentId, role);
  };
  
  render() {
    const { selectedAgents, agentRoles, availableRoles } = this.props;
    
    if (selectedAgents.length === 0) {
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

### 3.5 ContextSharingSettings

A component to configure context sharing between agents:

```typescript
interface ContextSharingSettingsProps {
  // Context sharing settings
  settings: ContextSharingSettings;
  
  // Selected agents
  selectedAgents: Agent[];
  
  // Callback for settings change
  onSettingsChange: (settings: Partial<ContextSharingSettings>) => void;
}

class ContextSharingSettings extends React.Component<ContextSharingSettingsProps> {
  handleEnableChange = (enabled: boolean) => {
    const { onSettingsChange } = this.props;
    onSettingsChange({ enabled });
  };
  
  handleScopeChange = (scope: 'all' | 'selective' | 'none') => {
    const { onSettingsChange } = this.props;
    onSettingsChange({ scope });
  };
  
  handlePermissionChange = (agentId: string, permittedAgentIds: string[]) => {
    const { settings, onSettingsChange } = this.props;
    
    onSettingsChange({
      agentPermissions: {
        ...settings.agentPermissions,
        [agentId]: permittedAgentIds
      }
    });
  };
  
  render() {
    const { settings, selectedAgents } = this.props;
    
    if (selectedAgents.length <= 1) {
      return null;
    }
    
    return (
      <div className="context-sharing-settings">
        <h3>Context Sharing</h3>
        <div className="settings-controls">
          <label>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={e => this.handleEnableChange(e.target.checked)}
            />
            Enable Context Sharing
          </label>
          
          {settings.enabled && (
            <>
              <div className="scope-selection">
                <label>
                  <input
                    type="radio"
                    name="scope"
                    value="all"
                    checked={settings.scope === 'all'}
                    onChange={() => this.handleScopeChange('all')}
                  />
                  Share with All Agents
                </label>
                <label>
                  <input
                    type="radio"
                    name="scope"
                    value="selective"
                    checked={settings.scope === 'selective'}
                    onChange={() => this.handleScopeChange('selective')}
                  />
                  Selective Sharing
                </label>
                <label>
                  <input
                    type="radio"
                    name="scope"
                    value="none"
                    checked={settings.scope === 'none'}
                    onChange={() => this.handleScopeChange('none')}
                  />
                  No Sharing
                </label>
              </div>
              
              {settings.scope === 'selective' && (
                <div className="agent-permissions">
                  {selectedAgents.map(agent => (
                    <div key={agent.id} className="agent-permission-item">
                      <div className="agent-name">{agent.name} can share with:</div>
                      <div className="agent-permission-list">
                        {selectedAgents
                          .filter(a => a.id !== agent.id)
                          .map(otherAgent => (
                            <label key={otherAgent.id}>
                              <input
                                type="checkbox"
                                checked={
                                  settings.agentPermissions[agent.id]?.includes(otherAgent.id) || false
                                }
                                onChange={e => {
                                  const currentPermissions = settings.agentPermissions[agent.id] || [];
                                  const newPermissions = e.target.checked
                                    ? [...currentPermissions, otherAgent.id]
                                    : currentPermissions.filter(id => id !== otherAgent.id);
                                  this.handlePermissionChange(agent.id, newPermissions);
                                }}
                              />
                              {otherAgent.name}
                            </label>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
}
```

## 4. Extension Points

### 4.1 Chat Extension Points

```typescript
// Register a chat mode
ExtensionRegistry.registerExtensionPoint('chat:mode', {
  register: (mode: ChatModeDefinition) => ChatModeRegistry.registerMode(mode),
  deregister: (modeId: string) => ChatModeRegistry.deregisterMode(modeId)
});

// Register a governance rule
ExtensionRegistry.registerExtensionPoint('chat:governanceRule', {
  register: (rule: GovernanceRule) => GovernanceRuleRegistry.registerRule(rule),
  deregister: (ruleId: string) => GovernanceRuleRegistry.deregisterRule(ruleId)
});

// Register an agent provider
ExtensionRegistry.registerExtensionPoint('chat:agentProvider', {
  register: (provider: AgentProvider) => AgentProviderRegistry.registerProvider(provider),
  deregister: (providerId: string) => AgentProviderRegistry.deregisterProvider(providerId)
});

// Register a chat message renderer
ExtensionRegistry.registerExtensionPoint('chat:messageRenderer', {
  register: (renderer: ChatMessageRenderer) => ChatMessageRendererRegistry.registerRenderer(renderer),
  deregister: (rendererId: string) => ChatMessageRendererRegistry.deregisterRenderer(rendererId)
});
```

### 4.2 UI Extension Points

```typescript
// Register a chat control component
ExtensionRegistry.registerExtensionPoint('chat:control', {
  register: (control: ChatControlComponent) => ChatControlRegistry.registerControl(control),
  deregister: (controlId: string) => ChatControlRegistry.deregisterControl(controlId)
});

// Register a chat input enhancement
ExtensionRegistry.registerExtensionPoint('chat:inputEnhancement', {
  register: (enhancement: ChatInputEnhancement) => ChatInputEnhancementRegistry.registerEnhancement(enhancement),
  deregister: (enhancementId: string) => ChatInputEnhancementRegistry.deregisterEnhancement(enhancementId)
});
```

## 5. Integration with Other Systems

### 5.1 Agent Wrapping Integration

The chat interfaces will integrate with the agent wrapping system to:
- Retrieve available agents for multi-agent mode
- Send messages to wrapped agents
- Receive responses from wrapped agents
- Apply governance rules to agent interactions

### 5.2 Observer Integration

The chat interfaces will integrate with the observer agent to:
- Receive suggestions for chat interactions
- Monitor chat activity for governance compliance
- Provide context for observer suggestions

### 5.3 Feature Toggle Integration

The chat interfaces will integrate with the feature toggle framework to:
- Control availability of chat modes based on user role and context
- Toggle features like agent selection, role assignment, and context sharing
- Control visibility of governance-specific UI elements

## 6. State Management

### 6.1 Chat State

```typescript
interface ChatState {
  // Current chat mode
  currentMode: ChatMode;
  
  // Chat messages
  messages: ChatMessage[];
  
  // Selected agents (for multi-agent mode)
  selectedAgents: Agent[];
  
  // Agent roles (for multi-agent mode)
  agentRoles: Record<string, string>;
  
  // Context sharing settings (for multi-agent mode)
  contextSharingSettings: ContextSharingSettings;
  
  // Governance metrics (for governance mode)
  governanceMetrics?: GovernanceMetrics;
  
  // Compliance violations (for governance mode)
  complianceViolations?: {
    ruleId: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }[];
  
  // Chat input state
  inputState: {
    text: string;
    attachments: any[];
    isTyping: boolean;
  };
}
```

### 6.2 Persistence

- Chat history will be persisted to allow resuming conversations
- User preferences for chat modes will be stored
- Agent selection and role assignments can be saved as templates

## 7. API Integration

### 7.1 Chat API

```typescript
// Get available chat modes
GET /api/chat/modes

// Switch chat mode
POST /api/chat/mode
{
  "mode": "governance"
}

// Send message
POST /api/chat/messages
{
  "content": "Hello, how can you help me with governance?",
  "type": "text",
  "recipients": ["agent-1", "agent-2"]
}

// Get chat history
GET /api/chat/history?sessionId=session-123

// Get governance metrics
GET /api/chat/governance/metrics?sessionId=session-123
```

### 7.2 Multi-Agent API

```typescript
// Get available agents
GET /api/chat/agents

// Select agents
POST /api/chat/agents/select
{
  "agentIds": ["agent-1", "agent-2"]
}

// Assign roles
POST /api/chat/agents/roles
{
  "assignments": {
    "agent-1": "critic",
    "agent-2": "creator"
  }
}

// Update context sharing settings
POST /api/chat/agents/context-sharing
{
  "enabled": true,
  "scope": "selective",
  "agentPermissions": {
    "agent-1": ["agent-2"],
    "agent-2": ["agent-1"]
  }
}
```

## 8. Accessibility and Mobile Responsiveness

### 8.1 Accessibility

- All UI components will be keyboard navigable
- ARIA attributes will be used for screen reader support
- Focus management will be implemented for modal dialogs and dynamic content
- Color contrast will meet WCAG standards

### 8.2 Mobile Responsiveness

- The chat interface will adapt to different screen sizes
- Agent selection and role assignment will use a simplified layout on mobile
- Touch-friendly controls will be used
- Multi-column layouts will collapse to single column on small screens

## 9. Implementation Plan

### 9.1 Phase 1: Core Chat Infrastructure

1. Implement `ChatModeManager` and basic mode switching
2. Implement basic chat UI with message display and input
3. Integrate with feature toggle framework for mode availability

### 9.2 Phase 2: Governance Mode

1. Implement `GovernanceChatService` with rule checking
2. Implement governance-specific UI elements (metrics, compliance warnings)
3. Integrate with agent wrapping for governance-compliant interactions

### 9.3 Phase 3: Multi-Agent Mode

1. Implement `MultiAgentManager` for agent selection and role assignment
2. Implement agent selection and role assignment UI
3. Implement context sharing settings UI and logic

### 9.4 Phase 4: Integration and Polish

1. Integrate with observer agent for suggestions
2. Implement persistence for chat history and settings
3. Enhance accessibility and mobile responsiveness
4. Add animations and polish UI

### 9.5 Phase 5: Extension Points and Customization

1. Implement extension points for chat modes, rules, and renderers
2. Create documentation and examples for extending the chat system
3. Implement customization options for chat UI

## 10. Next Steps

1. Begin implementation of `ChatModeManager` and basic chat UI
2. Integrate with feature toggle framework
3. Implement basic message sending and receiving
4. Begin implementation of governance mode features
