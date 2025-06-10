# Observer Agent Extension Design

## 1. Overview

This document outlines the design for the Observer Agent extension in the Promethios system. The Observer Agent provides contextual assistance to users, monitors user interactions and agent behaviors, and offers governance-focused suggestions through a hovering chat bubble UI, leveraging an OpenAI LLM.

## 2. Core Components

### 2.1 ObserverService

The `ObserverService` is the central component managing the observer's lifecycle, event processing, and LLM interaction:

```typescript
class ObserverService {
  // Initialize the observer service
  initialize(config: ObserverConfig): Promise<boolean>;

  // Start observing
  startObserving(): Promise<boolean>;

  // Stop observing
  stopObserving(): Promise<boolean>;

  // Process an observable event
  processEvent(event: ObservableEvent): Promise<void>;

  // Get current suggestions
  getCurrentSuggestions(): Promise<ObserverSuggestion[]>;

  // Get observer state (active, expanded, etc.)
  getObserverState(): Promise<ObserverState>;

  // Update observer state
  updateObserverState(newState: Partial<ObserverState>): Promise<boolean>;

  // Register a suggestion handler
  registerSuggestionHandler(handler: SuggestionHandler): string;

  // Deregister a suggestion handler
  deregisterSuggestionHandler(handlerId: string): boolean;

  // Send a message to the LLM
  sendMessageToLLM(message: string, context: LLMContext): Promise<LLMResponse>;
}

interface ObserverConfig {
  // OpenAI API Key
  openaiApiKey: string;
  // LLM Model ID (e.g., gpt-3.5-turbo)
  llmModelId: string;
  // Initial prompt for the LLM (focused on Promethios governance)
  llmInitialPrompt: string;
  // Debounce time for event processing (ms)
  eventDebounceTime?: number;
  // Max number of suggestions to display
  maxSuggestions?: number;
}

interface LLMContext {
  // Current user information
  userId: string;
  userRole: string;
  // Current UI route
  currentRoute: string;
  // Recent user interactions (summary or list)
  recentInteractions?: string[];
  // Current chat context (if applicable)
  chatContext?: {
    chatId: string;
    mode: string;
    participants: string[];
  };
  // Current agent context (if applicable)
  agentContext?: {
    agentId: string;
    lastAction: string;
    governanceStatus: string;
  };
  // Custom data
  [key: string]: any;
}

interface LLMResponse {
  // Response text from LLM
  responseText: string;
  // Suggested actions or information
  suggestions?: ObserverSuggestion[];
  // Any errors encountered
  error?: string;
}
```

### 2.2 ObservableEvent Interface

Reuses the `ObservableEvent` interface defined in `agent_wrapping_extension_design.md`, including `UserInteractionEvent`, `RouteChangeEvent`, `AgentRequestEvent`, and `AgentResponseEvent`.

### 2.3 ObserverSuggestion Interface

```typescript
interface ObserverSuggestion {
  // Unique identifier for the suggestion
  id: string;
  // Text content of the suggestion
  text: string;
  // Type of suggestion (e.g., info, warning, action_recommendation)
  type: 'info' | 'warning' | 'action_recommendation' | 'governance_alert';
  // Action to perform if the suggestion is selected
  action?: {
    // Type of action (e.g., navigate, call_api, show_modal)
    type: string;
    // Parameters for the action
    params: Record<string, any>;
  };
  // Source of the suggestion (e.g., llm, rule_engine)
  source: string;
  // Relevance score (0-1)
  relevance?: number;
  // Timestamp of creation
  timestamp: number;
}

interface SuggestionHandler {
  // Unique ID for the handler
  id: string;
  // Function to handle a suggestion when selected
  handle: (suggestion: ObserverSuggestion, context: UIContext) => Promise<boolean>;
}

interface UIContext {
  // Current route
  route: string;
  // Active component ID
  componentId?: string;
  // User information
  user: { id: string; role: string };
}
```

### 2.4 ObserverState Interface

Reuses the `ObserverState` interface defined in `feature_toggle_framework_design.md` but with more detail:

```typescript
interface ObserverState {
  // Whether the observer is active and processing events
  isActive: boolean;
  // Whether the chat bubble UI is expanded
  isExpanded: boolean;
  // Current suggestions to display
  suggestions: ObserverSuggestion[];
  // Current message/status displayed in the bubble
  currentMessage?: string;
  // Last error encountered by the observer
  lastError?: string;
  // Context for the observer's current understanding
  observerContext: LLMContext;
  // Loading state for LLM interactions
  isLoadingLLM: boolean;
}
```

## 3. UI Components

### 3.1 ObserverHoverBubble Component

This component implements the hovering chat bubble UI.

```typescript
interface ObserverHoverBubbleProps {
  // Initial state of the observer UI
  initialUiState?: Partial<ObserverState>;
  // Configuration for the observer
  observerConfig: ObserverConfig;
}

class ObserverHoverBubble extends React.Component<ObserverHoverBubbleProps, ObserverState> {
  private observerService: ObserverService;

  constructor(props: ObserverHoverBubbleProps) {
    super(props);
    this.state = {
      isActive: true,
      isExpanded: false,
      suggestions: [],
      currentMessage: 'Observer is active.',
      observerContext: { userId: '', userRole: '', currentRoute: '' }, // Initialize with appropriate defaults
      isLoadingLLM: false,
      ...props.initialUiState,
    };
    this.observerService = new ObserverService();
  }

  async componentDidMount() {
    ExtensionRegistry.registerUIComponent({
      id: 'observer-hover-bubble',
      component: this,
      extensionPoints: ['global-ui'], // To make it appear on all pages
    });
    await this.observerService.initialize(this.props.observerConfig);
    await this.observerService.startObserving();
    // TODO: Subscribe to observerService state updates
    // Example: this.observerService.onStateChange(this.handleObserverStateChange);
    // TODO: Register event listeners for user interactions, route changes etc.
    // Example: document.addEventListener('click', this.handleGlobalClick);
  }

  componentWillUnmount() {
    ExtensionRegistry.unregisterUIComponent('observer-hover-bubble');
    this.observerService.stopObserving();
    // TODO: Unsubscribe from observerService state updates and remove event listeners
  }

  handleObserverStateChange = (newState: ObserverState) => {
    this.setState(newState);
  };

  handleToggleExpand = () => {
    this.setState(prevState => ({ isExpanded: !prevState.isExpanded }), () => {
      this.observerService.updateObserverState({ isExpanded: this.state.isExpanded });
    });
  };

  handleToggleActive = () => {
    this.setState(prevState => ({ isActive: !prevState.isActive }), async () => {
      if (this.state.isActive) {
        await this.observerService.startObserving();
        this.setState({ currentMessage: 'Observer activated.' });
      } else {
        await this.observerService.stopObserving();
        this.setState({ currentMessage: 'Observer deactivated.' });
      }
      this.observerService.updateObserverState({ isActive: this.state.isActive });
    });
  };

  handleSuggestionSelect = async (suggestion: ObserverSuggestion) => {
    // Placeholder: Actual handling will involve registered SuggestionHandlers
    console.log('Suggestion selected:', suggestion);
    if (suggestion.action) {
      // Example: ActionExecutor.execute(suggestion.action);
      this.setState({ currentMessage: `Executing: ${suggestion.text}` });
    }
    // Potentially send feedback to LLM or clear suggestion
  };

  // Example event processing call
  processUserInteraction = (interactionData: any) => {
    const event: UserInteractionEvent = {
      type: 'user:interaction',
      source: 'ui-bubble',
      timestamp: Date.now(),
      data: interactionData,
    };
    this.observerService.processEvent(event);
  };

  render() {
    const { isActive, isExpanded, suggestions, currentMessage, isLoadingLLM } = this.state;

    // Feature toggle check
    if (!FeatureToggleService.isFeatureEnabledInContext('enableObserverChatBubble', this.state.observerContext)) {
      return null;
    }

    return (
      <div className={`observer-hover-bubble ${isExpanded ? 'expanded' : 'collapsed'} ${isActive ? 'active' : 'inactive'}`}>
        {isExpanded ? (
          <div className="observer-expanded-content">
            <div className="observer-header">
              <span className="observer-title">Promethios Observer</span>
              <button onClick={this.handleToggleActive} className="observer-control-button">
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={this.handleToggleExpand} className="observer-control-button">Close</button>
            </div>
            <div className="observer-message-area">
              {isLoadingLLM && <div className="loading-indicator">Thinking...</div>}
              {currentMessage && <div className="observer-status-message">{currentMessage}</div>}
              {suggestions.length > 0 && (
                <ul className="observer-suggestions-list">
                  {suggestions.map(s => (
                    <li key={s.id} onClick={() => this.handleSuggestionSelect(s)} className="suggestion-item">
                      <span className={`suggestion-type-indicator ${s.type}`}></span>
                      {s.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Input area for future direct interaction with observer? */}
          </div>
        ) : (
          <div className="observer-collapsed-icon" onClick={this.handleToggleExpand}>
            {/* Replace with a proper icon */}
            <span>👁️</span>
            {isActive && suggestions.length > 0 && !isLoadingLLM && (
              <span className="suggestion-count-badge">{suggestions.length}</span>
            )}
            {isLoadingLLM && <span className="loading-badge">...</span>}
          </div>
        )}
      </div>
    );
  }
}
```

## 4. OpenAI LLM Integration

- The `ObserverService` will manage interactions with the OpenAI LLM.
- The initial prompt will be configured to focus the LLM on Promethios governance principles, policies, and functionalities, as per knowledge `user_2` (ATLAS OpenAI conversation scope).
- `LLMContext` will provide relevant information to the LLM for generating contextual suggestions.
- LLM responses will be parsed for actionable suggestions and informational messages.
- Error handling and rate limiting for LLM API calls will be implemented.

**Example Initial Prompt Snippet (to be refined):**
`You are an AI assistant embedded in Promethios, an AI governance platform. Your role is to observe user actions and system events, and provide helpful suggestions and insights related to AI governance. Focus strictly on governance aspects as implemented within Promethios. Do not discuss general Promethios architecture or non-governance topics. Your suggestions should help users adhere to governance policies, understand trust metrics, and manage AI systems responsibly within the Promethios framework. Current user role: {userRole}. Current page: {currentRoute}.`

## 5. Integration with Other Systems

### 5.1 Agent Wrapping System
- The Observer Agent will listen to `AgentRequestEvent` and `AgentResponseEvent`.
- It can provide suggestions related to agent behavior, potential policy violations by agents, or insights into agent performance based on governance metrics.

### 5.2 Chat System
- The Observer can be active during chat sessions, providing suggestions based on the conversation context (if `chatContext` is provided to the LLM).
- It can help users formulate governance-compliant queries or interpret agent responses from a governance perspective.

### 5.3 Extension System & Feature Toggles
- The Observer Agent itself will be an extension (`observer-agent-extension`).
- Its UI (hover bubble) and core functionality (event processing, LLM interaction) will be controlled by feature toggles (`enableObserverChatBubble`, `enableObserverLLMProcessing`).
- Extension points will allow other modules to publish `ObservableEvent`s or register custom `SuggestionHandler`s.

## 6. Extension Points

```typescript
// Register an event source that can publish ObservableEvents
ExtensionRegistry.registerExtensionPoint('observer:eventSource', {
  publish: (event: ObservableEvent) => ObserverService.processEvent(event),
});

// Register a custom suggestion handler
ExtensionRegistry.registerExtensionPoint('observer:suggestionHandler', {
  register: (handler: SuggestionHandler) => ObserverService.registerSuggestionHandler(handler),
  deregister: (handlerId: string) => ObserverService.deregisterSuggestionHandler(handlerId),
});

// Allow other components to get current observer suggestions
ExtensionRegistry.registerExtensionPoint('observer:getSuggestionsApi', {
  get: () => ObserverService.getCurrentSuggestions(),
});
```

## 7. State Management

- The `ObserverService` will manage the internal state (`ObserverState`).
- The `ObserverHoverBubble` component will subscribe to state changes from the `ObserverService` to update the UI.
- Relevant parts of the `ObserverState` (e.g., `isActive`, `isExpanded`) can be persisted in user preferences.

## 8. Accessibility and Mobile Responsiveness

- **Accessibility**: The hover bubble will be keyboard navigable (e.g., a global shortcut to focus/expand). Suggestions will be announced by screen readers. ARIA attributes will be used extensively.
- **Mobile Responsiveness**: The hover bubble's position and size will adapt to smaller screens. It might become a less obtrusive icon or a notification-style banner on mobile.

## 9. Implementation Plan

### 9.1 Phase 1: Core Service & LLM Integration
1. Implement `ObserverService` basics (initialize, start/stop, event processing stub).
2. Implement OpenAI LLM interaction (send message, receive response, basic error handling).
3. Define `LLMContext` and initial prompt structure (governance-focused).
4. Implement basic `ObserverState` management.

### 9.2 Phase 2: Hover Bubble UI
1. Implement `ObserverHoverBubble` React component (layout, basic styling).
2. Implement expand/collapse and activate/deactivate functionality.
3. Display static messages and suggestions in the UI.
4. Ensure basic accessibility (keyboard focus) and responsiveness.

### 9.3 Phase 3: Event Processing & Suggestion Generation
1. Implement processing logic for `UserInteractionEvent` and `RouteChangeEvent`.
2. Integrate LLM calls into event processing to generate dynamic suggestions.
3. Implement `ObserverSuggestion` interface and display dynamic suggestions in UI.
4. Develop `SuggestionHandler` mechanism (stub implementation).

### 9.4 Phase 4: Integration with Agent Wrapping & Chat
1. Implement processing for `AgentRequestEvent` and `AgentResponseEvent`.
2. Pass `chatContext` and `agentContext` to LLM where applicable.
3. Test observer interactions within agent wrapping and chat scenarios.

### 9.5 Phase 5: Advanced Features & Refinements
1. Implement full `SuggestionHandler` registration and execution.
2. Enhance accessibility (ARIA, screen reader testing) and mobile responsiveness.
3. Implement persistence for observer state/preferences.
4. Refine LLM prompts and context generation for better suggestion quality.
5. Add comprehensive error handling and user feedback mechanisms.

### 9.6 Phase 6: Extension System Integration & Testing
1. Fully integrate with `ExtensionRegistry` and `FeatureToggleService`.
2. Define and implement all extension points.
3. Write unit and integration tests.
4. Document the Observer Agent extension.

## 10. Next Steps

1. Begin implementation of `ObserverService` core and LLM integration.
2. Develop the initial `ObserverHoverBubble` UI component structure.
3. Define the schema for `ObservableEvent`s relevant to the observer.

