# Extension Points and Module Interfaces Design

This document defines the detailed extension points and module interfaces for each advanced feature in the Promethios system.

## 1. Onboarding Flow

### 1.1 OnboardingExtension Interface

```typescript
interface OnboardingExtension extends Extension {
  // Core extension properties
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Onboarding-specific properties
  steps: OnboardingStep[];
  defaultStartStep: string;
  completionCriteria: CompletionCriteria;
  
  // Lifecycle methods
  initialize(): Promise<void>;
  getStep(stepId: string): OnboardingStep | null;
  getNextStep(currentStepId: string): OnboardingStep | null;
  getPreviousStep(currentStepId: string): OnboardingStep | null;
  markStepComplete(stepId: string): Promise<void>;
  isOnboardingComplete(): boolean;
  resetOnboarding(): Promise<void>;
}
```

### 1.2 OnboardingStep Interface

```typescript
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  component: React.ComponentType<OnboardingStepProps>;
  validationRules?: ValidationRule[];
  dependencies?: string[]; // IDs of steps that must be completed first
}

interface OnboardingStepProps {
  step: OnboardingStep;
  onComplete: (data?: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isLastStep: boolean;
  stepData?: any;
}
```

### 1.3 OnboardingRegistry

```typescript
class OnboardingRegistry {
  registerStep(step: OnboardingStep): void;
  unregisterStep(stepId: string): void;
  getSteps(): OnboardingStep[];
  getStepById(stepId: string): OnboardingStep | null;
  getOrderedSteps(): OnboardingStep[];
}
```

### 1.4 OnboardingService

```typescript
class OnboardingService {
  initialize(): Promise<void>;
  startOnboarding(userId: string, startStepId?: string): Promise<void>;
  completeStep(userId: string, stepId: string, data?: any): Promise<void>;
  skipStep(userId: string, stepId: string): Promise<void>;
  getOnboardingState(userId: string): Promise<OnboardingState>;
  isOnboardingComplete(userId: string): Promise<boolean>;
  resetOnboarding(userId: string): Promise<void>;
}

interface OnboardingState {
  userId: string;
  currentStepId: string;
  completedSteps: {
    [stepId: string]: {
      completedAt: Date;
      data?: any;
    }
  };
  skippedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
}
```

### 1.5 OnboardingUIComponents

```typescript
// Main onboarding container
const OnboardingContainer: React.FC<{
  userId: string;
  onComplete: () => void;
}>;

// Progress indicator
const OnboardingProgress: React.FC<{
  currentStepIndex: number;
  totalSteps: number;
  completedSteps: string[];
}>;

// Navigation controls
const OnboardingNavigation: React.FC<{
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  canGoBack: boolean;
  canSkip: boolean;
  isLastStep: boolean;
}>;
```

## 2. Emotional Veritas 2.0 System and Dashboard

### 2.1 EmotionalVeritasExtension Interface

```typescript
interface EmotionalVeritasExtension extends Extension {
  // Core extension properties
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Emotional Veritas specific properties
  metrics: EmotionalMetric[];
  dashboards: EmotionalDashboard[];
  
  // Lifecycle methods
  initialize(): Promise<void>;
  getMetric(metricId: string): EmotionalMetric | null;
  getDashboard(dashboardId: string): EmotionalDashboard | null;
  calculateMetric(metricId: string, input: any): Promise<number>;
  generateReport(dashboardId: string, timeRange: TimeRange): Promise<EmotionalReport>;
}
```

### 2.2 EmotionalMetric Interface

```typescript
interface EmotionalMetric {
  id: string;
  name: string;
  description: string;
  category: EmotionalCategory;
  range: {
    min: number;
    max: number;
  };
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
  calculate: (input: any) => Promise<number>;
  visualize: (value: number, options?: VisualizationOptions) => React.ReactNode;
}

enum EmotionalCategory {
  TRUST = 'trust',
  EMPATHY = 'empathy',
  TRANSPARENCY = 'transparency',
  ACCOUNTABILITY = 'accountability',
  FAIRNESS = 'fairness',
}
```

### 2.3 EmotionalDashboard Interface

```typescript
interface EmotionalDashboard {
  id: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  widgets: EmotionalWidget[];
  defaultTimeRange: TimeRange;
}

interface EmotionalWidget {
  id: string;
  type: WidgetType;
  title: string;
  metricIds: string[];
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings: any;
}

enum WidgetType {
  GAUGE = 'gauge',
  TREND = 'trend',
  COMPARISON = 'comparison',
  HEATMAP = 'heatmap',
  RADAR = 'radar',
}
```

### 2.4 EmotionalVeritasService

```typescript
class EmotionalVeritasService {
  initialize(): Promise<void>;
  registerMetric(metric: EmotionalMetric): void;
  unregisterMetric(metricId: string): void;
  registerDashboard(dashboard: EmotionalDashboard): void;
  unregisterDashboard(dashboardId: string): void;
  getMetrics(): EmotionalMetric[];
  getDashboards(): EmotionalDashboard[];
  calculateMetrics(input: any): Promise<Map<string, number>>;
  generateReport(dashboardId: string, timeRange: TimeRange): Promise<EmotionalReport>;
}

interface EmotionalReport {
  dashboardId: string;
  timeRange: TimeRange;
  generatedAt: Date;
  metrics: {
    [metricId: string]: {
      current: number;
      previous: number;
      trend: number;
      history: Array<{
        timestamp: Date;
        value: number;
      }>;
    }
  };
}
```

### 2.5 EmotionalVeritasUIComponents

```typescript
// Main dashboard container
const EmotionalDashboardContainer: React.FC<{
  dashboardId: string;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
}>;

// Widget components
const EmotionalGaugeWidget: React.FC<{
  metric: EmotionalMetric;
  value: number;
}>;

const EmotionalTrendWidget: React.FC<{
  metric: EmotionalMetric;
  history: Array<{
    timestamp: Date;
    value: number;
  }>;
}>;

const EmotionalComparisonWidget: React.FC<{
  metrics: EmotionalMetric[];
  values: Map<string, number>;
}>;
```

## 3. Observer Agent AI Bot

### 3.1 ObserverAgentExtension Interface

```typescript
interface ObserverAgentExtension extends Extension {
  // Core extension properties
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Observer Agent specific properties
  observationRules: ObservationRule[];
  suggestionTypes: SuggestionType[];
  
  // Lifecycle methods
  initialize(): Promise<void>;
  startObserving(): Promise<void>;
  stopObserving(): Promise<void>;
  isObserving(): boolean;
  getSuggestion(context: UserContext): Promise<Suggestion | null>;
}
```

### 3.2 ObservationRule Interface

```typescript
interface ObservationRule {
  id: string;
  name: string;
  description: string;
  eventTypes: string[];
  conditions: (context: UserContext, event: UserEvent) => boolean;
  priority: number;
  action: (context: UserContext, event: UserEvent) => Promise<void>;
}

interface UserContext {
  userId: string;
  currentRoute: string;
  recentEvents: UserEvent[];
  sessionDuration: number;
  preferences: UserPreferences;
  knowledgeLevel: {
    [topic: string]: number; // 0-1 scale
  };
}

interface UserEvent {
  type: string;
  timestamp: Date;
  route: string;
  target?: string;
  data?: any;
}
```

### 3.3 Suggestion Interface

```typescript
interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  content: string;
  priority: number;
  actions: SuggestionAction[];
  expiresAt?: Date;
  dismissible: boolean;
}

interface SuggestionType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface SuggestionAction {
  id: string;
  label: string;
  action: () => void;
  primary: boolean;
}
```

### 3.4 ObserverAgentService

```typescript
class ObserverAgentService {
  initialize(): Promise<void>;
  registerObservationRule(rule: ObservationRule): void;
  unregisterObservationRule(ruleId: string): void;
  registerSuggestionType(type: SuggestionType): void;
  unregisterSuggestionType(typeId: string): void;
  startObserving(userId: string): Promise<void>;
  stopObserving(userId: string): Promise<void>;
  recordEvent(userId: string, event: UserEvent): Promise<void>;
  getSuggestions(userId: string): Promise<Suggestion[]>;
  dismissSuggestion(userId: string, suggestionId: string): Promise<void>;
  getUserContext(userId: string): Promise<UserContext>;
}
```

### 3.5 ObserverAgentUIComponents

```typescript
// Main observer container
const ObserverAgentContainer: React.FC<{
  userId: string;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}>;

// Observer avatar
const ObserverAvatar: React.FC<{
  state: 'idle' | 'thinking' | 'suggesting';
  onClick: () => void;
}>;

// Suggestion display
const SuggestionDisplay: React.FC<{
  suggestion: Suggestion;
  onDismiss: () => void;
  onActionClick: (actionId: string) => void;
}>;
```

## 4. Agent Scorecard and Governance Identity Modules

### 4.1 AgentScorecardExtension Interface

```typescript
interface AgentScorecardExtension extends Extension {
  // Core extension properties
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Agent Scorecard specific properties
  metrics: ScorecardMetric[];
  categories: ScorecardCategory[];
  
  // Lifecycle methods
  initialize(): Promise<void>;
  getAgentScorecard(agentId: string): Promise<AgentScorecard>;
  calculateMetric(agentId: string, metricId: string): Promise<number>;
  getGovernanceIdentity(agentId: string): Promise<GovernanceIdentity>;
  verifyGovernanceIdentity(agentId: string): Promise<VerificationResult>;
}
```

### 4.2 ScorecardMetric Interface

```typescript
interface ScorecardMetric {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
  range: {
    min: number;
    max: number;
  };
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
  calculate: (agentId: string, context?: any) => Promise<number>;
  visualize: (value: number, options?: VisualizationOptions) => React.ReactNode;
}

interface ScorecardCategory {
  id: string;
  name: string;
  description: string;
  weight: number;
  metricIds: string[];
}
```

### 4.3 AgentScorecard Interface

```typescript
interface AgentScorecard {
  agentId: string;
  overallScore: number;
  categoryScores: {
    [categoryId: string]: number;
  };
  metricScores: {
    [metricId: string]: number;
  };
  timestamp: Date;
  history: Array<{
    timestamp: Date;
    overallScore: number;
    categoryScores: {
      [categoryId: string]: number;
    };
  }>;
}
```

### 4.4 GovernanceIdentity Interface

```typescript
interface GovernanceIdentity {
  agentId: string;
  name: string;
  version: string;
  provider: string;
  capabilities: string[];
  governanceLevel: GovernanceLevel;
  certifications: Certification[];
  attestations: Attestation[];
  lastVerified: Date;
}

enum GovernanceLevel {
  NONE = 'none',
  BASIC = 'basic',
  STANDARD = 'standard',
  ADVANCED = 'advanced',
  CERTIFIED = 'certified',
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issuedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'revoked';
  verificationUrl: string;
}

interface Attestation {
  id: string;
  claim: string;
  attestor: string;
  attestedAt: Date;
  evidence: string;
  confidence: number;
}

interface VerificationResult {
  verified: boolean;
  timestamp: Date;
  issues: VerificationIssue[];
}

interface VerificationIssue {
  severity: 'info' | 'warning' | 'error';
  message: string;
  relatedTo?: string;
}
```

### 4.5 AgentScorecardService

```typescript
class AgentScorecardService {
  initialize(): Promise<void>;
  registerMetric(metric: ScorecardMetric): void;
  unregisterMetric(metricId: string): void;
  registerCategory(category: ScorecardCategory): void;
  unregisterCategory(categoryId: string): void;
  getAgentScorecard(agentId: string): Promise<AgentScorecard>;
  calculateMetrics(agentId: string): Promise<Map<string, number>>;
  getGovernanceIdentity(agentId: string): Promise<GovernanceIdentity>;
  verifyGovernanceIdentity(agentId: string): Promise<VerificationResult>;
  compareAgents(agentIds: string[]): Promise<AgentComparison>;
}

interface AgentComparison {
  agentIds: string[];
  timestamp: Date;
  overallScores: {
    [agentId: string]: number;
  };
  categoryScores: {
    [categoryId: string]: {
      [agentId: string]: number;
    };
  };
  metricScores: {
    [metricId: string]: {
      [agentId: string]: number;
    };
  };
}
```

### 4.6 AgentScorecardUIComponents

```typescript
// Main scorecard container
const AgentScorecardContainer: React.FC<{
  agentId: string;
}>;

// Governance identity display
const GovernanceIdentityDisplay: React.FC<{
  identity: GovernanceIdentity;
  verificationResult?: VerificationResult;
}>;

// Scorecard visualization
const ScorecardVisualization: React.FC<{
  scorecard: AgentScorecard;
  highlightedCategory?: string;
}>;

// Agent comparison
const AgentComparisonView: React.FC<{
  comparison: AgentComparison;
  highlightedMetrics?: string[];
}>;
```

## 5. Toggleable Chat Interface (Governance vs. Non-Governance)

### 5.1 ToggleableChatExtension Interface

```typescript
interface ToggleableChatExtension extends Extension {
  // Core extension properties
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Toggleable Chat specific properties
  modes: ChatMode[];
  defaultMode: string;
  
  // Lifecycle methods
  initialize(): Promise<void>;
  getMode(modeId: string): ChatMode | null;
  switchMode(modeId: string): Promise<void>;
  getCurrentMode(): ChatMode;
  sendMessage(message: ChatMessage): Promise<void>;
  getMessages(): ChatMessage[];
}
```

### 5.2 ChatMode Interface

```typescript
interface ChatMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  messageHandler: (message: ChatMessage) => Promise<ChatMessage>;
  messageFormatter: (message: ChatMessage) => React.ReactNode;
}

interface ChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
    type: 'user' | 'agent' | 'system';
  };
  content: string;
  timestamp: Date;
  mode: string;
  metadata?: any;
  attachments?: ChatAttachment[];
  replyTo?: string;
}

interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'link';
  name: string;
  url: string;
  size?: number;
  metadata?: any;
}
```

### 5.3 ChatService

```typescript
class ChatService {
  initialize(): Promise<void>;
  registerMode(mode: ChatMode): void;
  unregisterMode(modeId: string): void;
  getModes(): ChatMode[];
  getCurrentMode(): ChatMode;
  switchMode(modeId: string): Promise<void>;
  sendMessage(userId: string, content: string, attachments?: ChatAttachment[]): Promise<ChatMessage>;
  getMessages(limit?: number, before?: Date): Promise<ChatMessage[]>;
  getMessageById(messageId: string): Promise<ChatMessage | null>;
  deleteMessage(messageId: string): Promise<void>;
  editMessage(messageId: string, newContent: string): Promise<ChatMessage>;
}
```

### 5.4 ChatUIComponents

```typescript
// Main chat container
const ChatContainer: React.FC<{
  userId: string;
  initialMode?: string;
}>;

// Mode toggle
const ChatModeToggle: React.FC<{
  modes: ChatMode[];
  currentMode: string;
  onModeChange: (modeId: string) => void;
}>;

// Message list
const ChatMessageList: React.FC<{
  messages: ChatMessage[];
  onMessageAction: (messageId: string, action: string) => void;
}>;

// Message input
const ChatMessageInput: React.FC<{
  onSend: (content: string, attachments?: ChatAttachment[]) => void;
  mode: ChatMode;
  disabled?: boolean;
}>;
```

## 6. Multi-Agent Chat Interface

### 6.1 MultiAgentChatExtension Interface

```typescript
interface MultiAgentChatExtension extends Extension {
  // Core extension properties
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Multi-Agent Chat specific properties
  agents: ChatAgent[];
  
  // Lifecycle methods
  initialize(): Promise<void>;
  getAgent(agentId: string): ChatAgent | null;
  addAgent(agent: ChatAgent): Promise<void>;
  removeAgent(agentId: string): Promise<void>;
  startConversation(agentIds: string[]): Promise<string>;
  sendMessage(conversationId: string, message: ChatMessage): Promise<void>;
  getMessages(conversationId: string): ChatMessage[];
}
```

### 6.2 ChatAgent Interface

```typescript
interface ChatAgent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  capabilities: string[];
  metadata: any;
  handleMessage: (message: ChatMessage, conversation: Conversation) => Promise<ChatMessage>;
}

interface Conversation {
  id: string;
  name?: string;
  agentIds: string[];
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  metadata: any;
}
```

### 6.3 MultiAgentChatService

```typescript
class MultiAgentChatService {
  initialize(): Promise<void>;
  registerAgent(agent: ChatAgent): void;
  unregisterAgent(agentId: string): void;
  getAgents(): ChatAgent[];
  getAgentById(agentId: string): ChatAgent | null;
  createConversation(userId: string, agentIds: string[], name?: string): Promise<Conversation>;
  getConversations(userId: string): Promise<Conversation[]>;
  getConversationById(conversationId: string): Promise<Conversation | null>;
  sendMessage(conversationId: string, userId: string, content: string, attachments?: ChatAttachment[]): Promise<ChatMessage>;
  getMessages(conversationId: string, limit?: number, before?: Date): Promise<ChatMessage[]>;
}
```

### 6.4 MultiAgentChatUIComponents

```typescript
// Main multi-agent chat container
const MultiAgentChatContainer: React.FC<{
  userId: string;
  initialConversationId?: string;
}>;

// Agent selection
const AgentSelectionPanel: React.FC<{
  agents: ChatAgent[];
  selectedAgents: string[];
  onAgentToggle: (agentId: string) => void;
  onCreateConversation: () => void;
}>;

// Conversation list
const ConversationList: React.FC<{
  conversations: Conversation[];
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onCreateConversation: () => void;
}>;

// Agent message display
const AgentMessageDisplay: React.FC<{
  message: ChatMessage;
  agent: ChatAgent;
  onMessageAction: (messageId: string, action: string) => void;
}>;
```

## 7. CMU Benchmark Demo Agents and APIs

### 7.1 BenchmarkExtension Interface

```typescript
interface BenchmarkExtension extends Extension {
  // Core extension properties
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Benchmark specific properties
  benchmarkAgents: BenchmarkAgent[];
  benchmarkScenarios: BenchmarkScenario[];
  
  // Lifecycle methods
  initialize(): Promise<void>;
  getAgent(agentId: string): BenchmarkAgent | null;
  getScenario(scenarioId: string): BenchmarkScenario | null;
  runBenchmark(scenarioId: string, agentIds: string[]): Promise<BenchmarkResult>;
  compareBenchmarkResults(resultIds: string[]): Promise<BenchmarkComparison>;
}
```

### 7.2 BenchmarkAgent Interface

```typescript
interface BenchmarkAgent {
  id: string;
  name: string;
  description: string;
  provider: string;
  version: string;
  capabilities: string[];
  parameters: {
    [key: string]: any;
  };
  handlePrompt: (prompt: string, context: any) => Promise<string>;
}
```

### 7.3 BenchmarkScenario Interface

```typescript
interface BenchmarkScenario {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  prompts: BenchmarkPrompt[];
  evaluationCriteria: EvaluationCriterion[];
  expectedOutputs?: {
    [promptId: string]: string;
  };
}

interface BenchmarkPrompt {
  id: string;
  text: string;
  context?: any;
  order: number;
}

interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  evaluate: (prompt: string, response: string, expectedOutput?: string) => Promise<number>;
}
```

### 7.4 BenchmarkResult Interface

```typescript
interface BenchmarkResult {
  id: string;
  scenarioId: string;
  agentIds: string[];
  startedAt: Date;
  completedAt: Date;
  overallScores: {
    [agentId: string]: number;
  };
  criteriaScores: {
    [criterionId: string]: {
      [agentId: string]: number;
    };
  };
  promptResponses: {
    [promptId: string]: {
      [agentId: string]: {
        response: string;
        score: number;
        evaluations: {
          [criterionId: string]: number;
        };
      };
    };
  };
}

interface BenchmarkComparison {
  resultIds: string[];
  scenarioId: string;
  agentIds: string[];
  overallScores: {
    [agentId: string]: number;
  };
  criteriaScores: {
    [criterionId: string]: {
      [agentId: string]: number;
    };
  };
  strengths: {
    [agentId: string]: string[];
  };
  weaknesses: {
    [agentId: string]: string[];
  };
}
```

### 7.5 BenchmarkService

```typescript
class BenchmarkService {
  initialize(): Promise<void>;
  registerAgent(agent: BenchmarkAgent): void;
  unregisterAgent(agentId: string): void;
  registerScenario(scenario: BenchmarkScenario): void;
  unregisterScenario(scenarioId: string): void;
  getAgents(): BenchmarkAgent[];
  getScenarios(): BenchmarkScenario[];
  runBenchmark(scenarioId: string, agentIds: string[]): Promise<BenchmarkResult>;
  getBenchmarkResults(): Promise<BenchmarkResult[]>;
  getBenchmarkResultById(resultId: string): Promise<BenchmarkResult | null>;
  compareBenchmarkResults(resultIds: string[]): Promise<BenchmarkComparison>;
}
```

### 7.6 BenchmarkUIComponents

```typescript
// Main benchmark container
const BenchmarkContainer: React.FC<{
  initialScenarioId?: string;
  initialAgentIds?: string[];
}>;

// Agent selection
const BenchmarkAgentSelection: React.FC<{
  agents: BenchmarkAgent[];
  selectedAgents: string[];
  onAgentToggle: (agentId: string) => void;
}>;

// Scenario selection
const BenchmarkScenarioSelection: React.FC<{
  scenarios: BenchmarkScenario[];
  selectedScenario?: string;
  onScenarioSelect: (scenarioId: string) => void;
}>;

// Results visualization
const BenchmarkResultsVisualization: React.FC<{
  result: BenchmarkResult;
  highlightedCriteria?: string[];
}>;

// Comparison visualization
const BenchmarkComparisonVisualization: React.FC<{
  comparison: BenchmarkComparison;
  highlightedCriteria?: string[];
}>;
```

## Integration Strategy

Each feature's extension points and module interfaces are designed to integrate seamlessly with the Promethios extension system. The integration strategy follows these principles:

1. **Consistent Interface Design**: All extensions follow a consistent pattern with core properties and lifecycle methods
2. **Clear Component Boundaries**: Each UI component has well-defined props and responsibilities
3. **Service-Based Architecture**: Services provide the business logic for each feature
4. **Extensible Data Models**: Data models are designed to be extensible for future enhancements
5. **Type Safety**: TypeScript interfaces ensure type safety across the system

The next step is to update the UI implementation plan to reflect the integration of these features, ensuring that all UI components and routes are properly mapped and preserved.
