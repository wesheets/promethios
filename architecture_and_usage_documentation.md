# Promethios UI Architecture and Usage Documentation

## 1. Introduction

This document provides comprehensive documentation for the Promethios UI architecture and all new features implemented as part of the enhanced UI project. It serves as the primary reference for developers working with the system and for users seeking to understand the capabilities and extension points of the platform.

## 2. System Architecture Overview

### 2.1 Core Architecture

The Promethios UI is built on a modular, extensible architecture centered around the Extension System. This architecture enables:

- **Modularity**: Components can be developed, tested, and deployed independently
- **Extensibility**: New features can be added without modifying core code
- **Configurability**: Features can be toggled on/off based on user roles and preferences
- **Maintainability**: Clear separation of concerns makes the codebase easier to maintain

The high-level architecture consists of:

1. **Core Framework**: Extension system, routing, state management, and Firebase integration
2. **UI Components**: Reusable components for consistent user experience
3. **Feature Modules**: Self-contained modules that implement specific features
4. **Service Layer**: Services for data access, business logic, and external integrations
5. **Navigation System**: Left navigation and header navigation for application routing

### 2.2 Extension System

The Extension System is the foundation of the Promethios UI architecture. It provides a framework for registering and discovering extension points, allowing modules to extend the functionality of the system without tight coupling.

Key components:

- **ExtensionRegistry**: Central registry for all extension points and extensions
- **ModuleRegistry**: Registry for modules and their metadata
- **FeatureToggleService**: Service for enabling/disabling features based on context

```typescript
// Core Extension System interfaces
interface ExtensionRegistry {
  registerExtensionPoint<T>(id: string, config: ExtensionPointConfig<T>): void;
  getExtensionPoint<T>(id: string): ExtensionPoint<T> | null;
  getAllExtensionPoints(): Record<string, ExtensionPoint<any>>;
}

interface ExtensionPoint<T> {
  id: string;
  register(extension: T): void;
  getAll(): T[];
  get(id: string): T | null;
}

interface ModuleRegistry {
  registerModule(module: Module): void;
  getModule(id: string): Module | null;
  getAllModules(): Module[];
}

interface Module {
  id: string;
  name: string;
  version: string;
  dependencies?: string[];
  initialize(): Promise<void>;
  registerExtensions(registry: ExtensionRegistry): void;
}

interface FeatureToggleService {
  isEnabled(featureId: string, context?: any): boolean;
  setEnabled(featureId: string, enabled: boolean, context?: any): void;
  registerFeature(featureId: string, defaultEnabled: boolean): void;
}
```

### 2.3 Navigation System

The Navigation System provides a unified approach to application routing and navigation. It consists of:

- **Left Navigation**: Primary navigation for accessing major sections of the application
- **Header Navigation**: Secondary navigation for user-specific actions and global features
- **NavigationRegistry**: Registry for navigation items and their metadata
- **NavigationStateManager**: Manager for navigation state (active items, collapsed state)

```typescript
// Navigation System interfaces
interface NavigationRegistry {
  registerItem(item: NavigationItem): void;
  getItem(id: string): NavigationItem | null;
  getAllItems(): NavigationItem[];
  getItemsByParent(parentId: string | null): NavigationItem[];
}

interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  parentId?: string | null;
  order?: number;
  permissionRequired?: string;
  children?: NavigationItem[];
}

interface NavigationStateManager {
  getActiveItems(): string[];
  isLeftNavExpanded(): boolean;
  toggleLeftNav(): void;
  setActiveItems(items: string[]): void;
}
```

### 2.4 Firebase Integration

Firebase is integrated throughout the Promethios UI for authentication, data storage, and real-time updates:

- **Authentication**: Firebase Authentication for user identity and role-based access control
- **Firestore**: Cloud Firestore for data storage and real-time updates
- **Cloud Messaging**: Firebase Cloud Messaging for push notifications
- **Security Rules**: Firestore security rules for data access control

```typescript
// Firebase integration services
interface FirebaseAuthService {
  getCurrentUser(): firebase.User | null;
  getUserRoles(): string[];
  hasPermission(permission: string): boolean;
  login(email: string, password: string): Promise<firebase.User>;
  logout(): Promise<void>;
}

interface FirestoreService {
  getDocument<T>(collection: string, id: string): Promise<T | null>;
  queryDocuments<T>(collection: string, query: FirestoreQuery): Promise<T[]>;
  addDocument<T>(collection: string, data: T): Promise<string>;
  updateDocument<T>(collection: string, id: string, data: Partial<T>): Promise<void>;
  deleteDocument(collection: string, id: string): Promise<void>;
  listenToDocument<T>(collection: string, id: string, callback: (data: T | null) => void): () => void;
  listenToQuery<T>(collection: string, query: FirestoreQuery, callback: (data: T[]) => void): () => void;
}
```

## 3. Feature Modules

### 3.1 Extension System

#### 3.1.1 Overview

The Extension System provides the foundation for modularity and extensibility in Promethios. It allows modules to register extension points that other modules can extend, creating a flexible, loosely-coupled architecture.

#### 3.1.2 Key Components

- **ExtensionRegistry**: Central registry for all extension points
- **ModuleRegistry**: Registry for modules and their metadata
- **FeatureToggleService**: Service for enabling/disabling features

#### 3.1.3 Usage

**Registering an Extension Point:**

```typescript
// In a core module
import { ExtensionRegistry } from '@promethios/core';

ExtensionRegistry.registerExtensionPoint('dashboard:widget', {
  register: (widget: DashboardWidget) => {
    // Logic to register a dashboard widget
    DashboardWidgetRegistry.registerWidget(widget);
  }
});
```

**Extending an Extension Point:**

```typescript
// In a feature module
import { ExtensionRegistry } from '@promethios/core';

const governanceWidget: DashboardWidget = {
  id: 'governance-summary',
  title: 'Governance Summary',
  size: { width: 2, height: 1 },
  component: GovernanceSummaryWidget
};

ExtensionRegistry.getExtensionPoint('dashboard:widget')?.register(governanceWidget);
```

**Using Feature Toggles:**

```typescript
// In a component
import { FeatureToggleService } from '@promethios/core';

function MyComponent() {
  const featureEnabled = FeatureToggleService.isEnabled('advanced-analytics');
  
  return (
    <div>
      {featureEnabled && <AdvancedAnalytics />}
    </div>
  );
}
```

### 3.2 Agent Wrapping & Observer

#### 3.2.1 Overview

The Agent Wrapping system provides a framework for wrapping AI agents with governance controls, monitoring, and extension capabilities. The Observer Agent provides contextual assistance and monitoring.

#### 3.2.2 Key Components

- **AgentWrapperRegistry**: Registry for agent wrappers
- **AgentWrapperService**: Service for wrapping and managing agents
- **ObserverService**: Service for the observer agent
- **ObserverHoverBubble**: UI component for the observer

#### 3.2.3 Usage

**Registering an Agent Wrapper:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { AgentWrapper } from '@promethios/agent-wrapping';

const openAIWrapper: AgentWrapper = {
  id: 'openai-wrapper',
  name: 'OpenAI Wrapper',
  supportedModels: ['gpt-4', 'gpt-3.5-turbo'],
  wrapAgent: async (config) => {
    // Logic to wrap an OpenAI agent
    return new OpenAIAgentWrapper(config);
  }
};

ExtensionRegistry.getExtensionPoint('agent:wrapper')?.register(openAIWrapper);
```

**Using the Observer Agent:**

```typescript
// In a component
import { ObserverService } from '@promethios/observer';

function ChatComponent() {
  useEffect(() => {
    // Register for observer suggestions
    const unsubscribe = ObserverService.onSuggestion((suggestion) => {
      // Handle suggestion
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <div>
      {/* Chat UI */}
      <ObserverHoverBubble />
    </div>
  );
}
```

**Multi-Agent Configuration:**

```typescript
// In a component
import { MultiAgentManager } from '@promethios/agent-wrapping';

function MultiAgentChatComponent() {
  const [agents, setAgents] = useState([]);
  
  const setupMultiAgent = async () => {
    const manager = new MultiAgentManager();
    
    // Add agents with roles
    await manager.addAgent('agent1', { role: 'assistant' });
    await manager.addAgent('agent2', { role: 'critic' });
    
    // Configure context sharing
    manager.setContextSharing('agent1', 'agent2', true);
    
    setAgents(manager.getAgents());
  };
  
  // Component implementation
}
```

### 3.3 Chat Interfaces

#### 3.3.1 Overview

The Chat Interfaces provide single-agent and multi-agent chat capabilities with toggleable governance modes, document upload, and integration with the observer agent.

#### 3.3.2 Key Components

- **ChatContainer**: Main container component for chat
- **ChatModeToggle**: Component for toggling between chat modes
- **AgentSelection**: Component for selecting agents in multi-agent mode
- **DocumentUpload**: Component for uploading documents to chat

#### 3.3.3 Usage

**Basic Chat Setup:**

```typescript
// In a component
import { ChatContainer, ChatMode } from '@promethios/chat';

function ChatPage() {
  return (
    <ChatContainer
      mode={ChatMode.GOVERNANCE}
      agentId="default-agent"
      onSendMessage={(message) => {
        // Handle message sending
      }}
    />
  );
}
```

**Multi-Agent Chat:**

```typescript
// In a component
import { ChatContainer, ChatMode, AgentSelection } from '@promethios/chat';

function MultiAgentChatPage() {
  const [selectedAgents, setSelectedAgents] = useState([]);
  
  return (
    <>
      <AgentSelection
        onSelectionChange={setSelectedAgents}
      />
      <ChatContainer
        mode={ChatMode.MULTI_AGENT}
        agents={selectedAgents}
        onSendMessage={(message) => {
          // Handle message sending to multiple agents
        }}
      />
    </>
  );
}
```

**Document Upload:**

```typescript
// In a component
import { DocumentUpload } from '@promethios/chat';

function ChatInputWithUpload() {
  const handleFileUpload = async (file) => {
    // Process uploaded file
    const content = await processFile(file);
    
    // Send to chat
    sendToChat(content);
  };
  
  return (
    <div className="chat-input">
      <textarea />
      <DocumentUpload onUpload={handleFileUpload} />
      <button>Send</button>
    </div>
  );
}
```

### 3.4 Governance Dashboard & Emotional Veritas

#### 3.4.1 Overview

The Governance Dashboard provides a comprehensive view of AI governance status, while Emotional Veritas 2.0 adds emotional impact visualization for governance decisions.

#### 3.4.2 Key Components

- **GovernanceDashboard**: Main dashboard component
- **TrustMetricsVisualizer**: Component for visualizing trust metrics
- **GovernanceHealthReporter**: Component for reporting governance health
- **EmotionalVeritasDashboard**: Dashboard for emotional impact metrics

#### 3.4.3 Usage

**Governance Dashboard:**

```typescript
// In a component
import { GovernanceDashboard } from '@promethios/governance';

function GovernancePage() {
  return (
    <GovernanceDashboard
      timeRange="last-30-days"
      showViolations={true}
      showPolicies={true}
    />
  );
}
```

**Emotional Veritas:**

```typescript
// In a component
import { EmotionalVeritasDashboard } from '@promethios/emotional-veritas';

function EmotionalVeritasPage() {
  return (
    <EmotionalVeritasDashboard
      metrics={['trust', 'transparency', 'satisfaction', 'resonance']}
      timeRange="last-30-days"
    />
  );
}
```

**Custom Emotional Metric:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { EmotionalMetric } from '@promethios/emotional-veritas';

const customMetric: EmotionalMetric = {
  id: 'cultural-sensitivity',
  name: 'Cultural Sensitivity',
  description: 'Measures the cultural sensitivity of AI responses',
  calculate: async (data) => {
    // Logic to calculate metric
    return { score: 0.85, confidence: 0.9 };
  },
  visualize: (data) => <CulturalSensitivityVisualizer data={data} />
};

ExtensionRegistry.getExtensionPoint('emotional-veritas:metric')?.register(customMetric);
```

### 3.5 Agent Scorecard & Governance Identity

#### 3.5.1 Overview

The Agent Scorecard provides comprehensive evaluation of AI agents, while Governance Identity manages agent identities, roles, and attestations.

#### 3.5.2 Key Components

- **AgentScorecard**: Component for displaying agent evaluation metrics
- **ScorecardMetricRegistry**: Registry for scorecard metrics
- **AgentIdentityRegistry**: Registry for agent identities
- **AgentAttestationService**: Service for handling compliance certifications

#### 3.5.3 Usage

**Agent Scorecard:**

```typescript
// In a component
import { AgentScorecard } from '@promethios/agent-scorecard';

function AgentScorecardPage({ agentId }) {
  return (
    <AgentScorecard
      agentId={agentId}
      metrics={['performance', 'fairness', 'robustness', 'compliance']}
      timeRange="last-30-days"
    />
  );
}
```

**Custom Scorecard Metric:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { ScorecardMetric } from '@promethios/agent-scorecard';

const customMetric: ScorecardMetric = {
  id: 'hallucination-rate',
  name: 'Hallucination Rate',
  description: 'Measures the rate of hallucinations in agent responses',
  calculate: async (agentId, timeRange) => {
    // Logic to calculate metric
    return { score: 0.05, trend: 'decreasing' };
  },
  visualize: (data) => <HallucinationRateVisualizer data={data} />
};

ExtensionRegistry.getExtensionPoint('scorecard:metric')?.register(customMetric);
```

**Agent Identity Management:**

```typescript
// In a component
import { AgentIdentityManager } from '@promethios/governance-identity';

function AgentIdentityPage({ agentId }) {
  const [identity, setIdentity] = useState(null);
  
  useEffect(() => {
    // Load agent identity
    AgentIdentityManager.getIdentity(agentId).then(setIdentity);
  }, [agentId]);
  
  const updateIdentity = async (updates) => {
    await AgentIdentityManager.updateIdentity(agentId, updates);
    setIdentity(await AgentIdentityManager.getIdentity(agentId));
  };
  
  // Component implementation
}
```

### 3.6 CMU Benchmark Integration

#### 3.6.1 Overview

The CMU Benchmark integration provides standardized evaluation capabilities for agent systems, with integration into the agent scorecard and governance dashboard.

#### 3.6.2 Key Components

- **BenchmarkDashboard**: Dashboard for running and viewing benchmark tests
- **BenchmarkTestRunner**: Service for executing benchmark tests
- **BenchmarkResultVisualizer**: Component for visualizing benchmark results

#### 3.6.3 Usage

**Running Benchmarks:**

```typescript
// In a component
import { BenchmarkDashboard } from '@promethios/cmu-benchmark';

function BenchmarkPage() {
  return (
    <BenchmarkDashboard
      agentIds={['agent1', 'agent2']}
      benchmarks={['reasoning', 'knowledge', 'safety']}
    />
  );
}
```

**Custom Benchmark:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { Benchmark } from '@promethios/cmu-benchmark';

const customBenchmark: Benchmark = {
  id: 'cultural-awareness',
  name: 'Cultural Awareness',
  description: 'Tests agent awareness of cultural nuances',
  run: async (agent) => {
    // Logic to run benchmark
    return { score: 0.78, details: { ... } };
  },
  visualize: (results) => <CulturalAwarenessVisualizer results={results} />
};

ExtensionRegistry.getExtensionPoint('benchmark:test')?.register(customBenchmark);
```

### 3.7 Unified Notification System

#### 3.7.1 Overview

The Unified Notification System provides consistent, context-aware alerts across the entire Promethios platform, with support for different notification types and delivery methods.

#### 3.7.2 Key Components

- **NotificationService**: Service for managing notification lifecycle
- **NotificationRegistry**: Registry for notification providers and handlers
- **NotificationCenter**: UI component for displaying and managing notifications
- **NotificationToast**: UI component for toast notifications

#### 3.7.3 Usage

**Sending Notifications:**

```typescript
// In a service
import { NotificationService } from '@promethios/notifications';

function governanceViolationDetected(violation) {
  NotificationService.send({
    type: 'governance-violation',
    title: 'Governance Violation Detected',
    message: `Violation of policy "${violation.policy}" detected`,
    severity: 'high',
    data: violation,
    actions: [
      {
        label: 'View Details',
        action: 'view',
        data: { route: `/governance/violations/${violation.id}` }
      },
      {
        label: 'Dismiss',
        action: 'dismiss'
      }
    ]
  });
}
```

**Custom Notification Provider:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { NotificationProvider } from '@promethios/notifications';

const customProvider: NotificationProvider = {
  id: 'integration-alerts',
  name: 'Integration Alerts',
  getNotifications: async () => {
    // Logic to get notifications
    return [
      {
        id: 'integration-1',
        type: 'integration-alert',
        title: 'Integration Failure',
        message: 'Failed to connect to external system',
        severity: 'medium',
        timestamp: new Date(),
        read: false
      }
    ];
  },
  markAsRead: async (notificationId) => {
    // Logic to mark notification as read
  }
};

ExtensionRegistry.getExtensionPoint('notification:provider')?.register(customProvider);
```

**Notification Center:**

```typescript
// In a component
import { NotificationCenter } from '@promethios/notifications';

function HeaderWithNotifications() {
  const [showNotifications, setShowNotifications] = useState(false);
  
  return (
    <header>
      {/* Other header content */}
      <button onClick={() => setShowNotifications(!showNotifications)}>
        Notifications
      </button>
      
      {showNotifications && (
        <NotificationCenter
          onClose={() => setShowNotifications(false)}
          onActionClick={(notification, action) => {
            // Handle notification action
          }}
        />
      )}
    </header>
  );
}
```

### 3.8 User Preference Management

#### 3.8.1 Overview

The User Preference Management module provides granular, role-based customization options for notifications, chat modes, UI layouts, and other user-specific settings.

#### 3.8.2 Key Components

- **UserPreferenceService**: Service for managing user preferences
- **PreferenceRegistry**: Registry for preference definitions
- **UserPreferencesDashboard**: UI component for centralized preference management

#### 3.8.3 Usage

**Managing Preferences:**

```typescript
// In a service
import { UserPreferenceService } from '@promethios/preferences';

async function getUserTheme() {
  return await UserPreferenceService.getPreference('ui.theme', 'light');
}

async function setUserTheme(theme) {
  await UserPreferenceService.setPreference('ui.theme', theme);
}
```

**Registering Preference Category:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { PreferenceCategory } from '@promethios/preferences';

const notificationPreferences: PreferenceCategory = {
  id: 'notifications',
  name: 'Notification Preferences',
  description: 'Configure how you receive notifications',
  preferences: [
    {
      id: 'notifications.email',
      name: 'Email Notifications',
      description: 'Receive notifications via email',
      type: 'boolean',
      default: true
    },
    {
      id: 'notifications.push',
      name: 'Push Notifications',
      description: 'Receive push notifications in browser',
      type: 'boolean',
      default: true
    }
  ]
};

ExtensionRegistry.getExtensionPoint('preferences:category')?.register(notificationPreferences);
```

**Preference Dashboard:**

```typescript
// In a component
import { UserPreferencesDashboard } from '@promethios/preferences';

function PreferencesPage() {
  return (
    <UserPreferencesDashboard
      categories={['general', 'notifications', 'chat', 'governance']}
    />
  );
}
```

### 3.9 Integration Hub

#### 3.9.1 Overview

The Integration Hub provides a centralized module for connecting Promethios with external systems, including CI/CD pipelines, monitoring tools, other AI governance frameworks, and enterprise applications.

#### 3.9.2 Key Components

- **IntegrationHubService**: Service for managing integration lifecycles
- **ConnectorRegistry**: Registry for available connectors
- **ConnectorInstanceService**: Service for managing connector instances
- **WebhookService**: Service for handling incoming webhooks

#### 3.9.3 Usage

**Registering a Connector:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { Connector } from '@promethios/integration-hub';

const gitlabConnector: Connector = {
  id: 'gitlab-ci',
  name: 'GitLab CI',
  description: 'Integration with GitLab CI/CD pipelines',
  type: 'ci_cd',
  configSchema: {
    // JSON schema for configuration
  },
  handleInbound: async (config, data) => {
    // Transform GitLab data to Promethios format
    return transformedData;
  },
  handleOutbound: async (config, promethiosEvent) => {
    // Transform Promethios event to GitLab format
    return gitlabPayload;
  }
};

ExtensionRegistry.getExtensionPoint('integration:connector')?.register(gitlabConnector);
```

**Creating a Connector Instance:**

```typescript
// In a component
import { ConnectorInstanceService } from '@promethios/integration-hub';

async function createConnectorInstance(connectorId, name, config) {
  try {
    const instanceId = await ConnectorInstanceService.createInstance({
      connectorId,
      name,
      config,
      isEnabled: true
    });
    
    return instanceId;
  } catch (error) {
    console.error('Failed to create connector instance:', error);
    throw error;
  }
}
```

**Integration Dashboard:**

```typescript
// In a component
import { IntegrationDashboard } from '@promethios/integration-hub';

function IntegrationsPage() {
  return (
    <IntegrationDashboard
      onCreateInstance={(connectorId) => {
        // Handle instance creation
      }}
      onEditInstance={(instanceId) => {
        // Handle instance editing
      }}
      onDeleteInstance={(instanceId) => {
        // Handle instance deletion
      }}
    />
  );
}
```

### 3.10 Guided Tours & Contextual Help

#### 3.10.1 Overview

The Guided Tours and Contextual Help system provides interactive guidance to users, helping them understand complex governance concepts, learn new features, and navigate the platform efficiently.

#### 3.10.2 Key Components

- **TourService**: Service for managing tour definitions and playback
- **TourRegistry**: Registry for available tours
- **ContextualHelpService**: Service for providing context-aware help
- **HelpContentRegistry**: Registry for help content

#### 3.10.3 Usage

**Registering a Tour:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { Tour } from '@promethios/guided-tours';

const governanceTour: Tour = {
  id: 'governance-overview',
  title: 'Governance Dashboard Overview',
  description: 'Learn about the key features of the Governance Dashboard',
  category: 'governance',
  steps: [
    {
      id: 'intro',
      title: 'Welcome to the Governance Dashboard',
      content: 'This tour will guide you through the key features of the Governance Dashboard.',
      target: '#governance-dashboard',
      position: 'center',
      highlightTarget: true
    },
    // More steps...
  ],
  requiredRoles: ['admin', 'governance_manager'],
  estimatedDuration: 3,
  version: '1.0'
};

ExtensionRegistry.getExtensionPoint('tours:tour')?.register(governanceTour);
```

**Starting a Tour:**

```typescript
// In a component
import { TourService } from '@promethios/guided-tours';

function startTour(tourId) {
  TourService.startTour(tourId);
}
```

**Registering Help Content:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { HelpContent } from '@promethios/contextual-help';

const governanceHelp: HelpContent = {
  id: 'governance-dashboard',
  title: 'Governance Dashboard',
  content: `# Governance Dashboard\n\nThe Governance Dashboard provides a comprehensive view of your AI governance status.`,
  contentType: 'markdown',
  tags: ['governance', 'dashboard'],
  relatedContent: ['governance-policies', 'trust-metrics'],
  lastUpdated: new Date('2025-05-15')
};

ExtensionRegistry.getExtensionPoint('help:content')?.register(governanceHelp);
```

**Accessing Contextual Help:**

```typescript
// In a component
import { ContextualHelpService } from '@promethios/contextual-help';

function GovernancePage() {
  const [helpContent, setHelpContent] = useState(null);
  
  useEffect(() => {
    // Get help for current context
    ContextualHelpService.getHelpForContext({
      route: '/governance/overview',
      section: 'dashboard'
    }).then(content => {
      setHelpContent(content);
    });
  }, []);
  
  // Component implementation
}
```

### 3.11 Export/Import Capabilities

#### 3.11.1 Overview

The Export/Import capabilities enable users to export configurations and reports for backup, sharing, or migration purposes, and import them back into the system.

#### 3.11.2 Key Components

- **ExportService**: Service for exporting data from the system
- **ImportService**: Service for importing data into the system
- **DataTransformerRegistry**: Registry for data transformers
- **ValidationService**: Service for validating imported data

#### 3.11.3 Usage

**Exporting Data:**

```typescript
// In a component
import { ExportService } from '@promethios/export-import';

async function exportGovernancePolicy(policyId) {
  try {
    const result = await ExportService.exportData(
      'governance_policy',
      policyId,
      { id: 'json', name: 'JSON', mimeType: 'application/json', extension: 'json', supportsMultiple: true },
      { includeMetadata: true }
    );
    
    if (result.success && result.data) {
      // Download the file
      downloadFile(result.data, result.filename);
    }
  } catch (error) {
    console.error('Export failed:', error);
  }
}
```

**Importing Data:**

```typescript
// In a component
import { ImportService } from '@promethios/export-import';

async function importGovernancePolicy(file) {
  try {
    // Read file content
    const content = await readFileContent(file);
    
    // Validate import
    const validationResult = await ImportService.validateImport(
      content,
      'governance_policy',
      { dryRun: true }
    );
    
    if (validationResult.valid) {
      // Import data
      const importResult = await ImportService.importData(
        content,
        'governance_policy',
        { overwrite: false }
      );
      
      return importResult;
    } else {
      console.error('Validation failed:', validationResult.errors);
      return null;
    }
  } catch (error) {
    console.error('Import failed:', error);
    return null;
  }
}
```

**Custom Export Format:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { ExportFormat } from '@promethios/export-import';

const customFormat: ExportFormat = {
  id: 'yaml',
  name: 'YAML',
  mimeType: 'application/x-yaml',
  extension: 'yaml',
  supportsMultiple: true
};

ExtensionRegistry.getExtensionPoint('export:format')?.register(customFormat);
```

## 4. Navigation and Routing

### 4.1 Left Navigation

The Left Navigation is the primary navigation system for Promethios. It provides access to all major sections of the application and can be collapsed to maximize content space.

#### 4.1.1 Structure

The Left Navigation is organized into top-level sections with optional sub-items:

- **Dashboard**: Home dashboard
- **Governance**
  - Overview
  - Policies
  - Violations
  - Reports
  - Emotional Veritas
- **Trust Metrics**
  - Overview
  - Boundaries
  - Attestations
- **Agents**
  - Registry
  - Scorecard
  - Identity
  - Benchmarks
  - Chat
- **Settings**
  - User Profile
  - Preferences
  - Organization
  - Integrations
  - Data Management
- **Help & Resources**
  - Guided Tours
  - Help Center
  - Documentation

#### 4.1.2 Usage

**Registering Navigation Items:**

```typescript
// In a module
import { NavigationRegistry } from '@promethios/navigation';

// Register a top-level item
NavigationRegistry.registerItem({
  id: 'governance',
  label: 'Governance',
  icon: 'shield',
  order: 2
});

// Register a child item
NavigationRegistry.registerItem({
  id: 'governance-policies',
  label: 'Policies',
  icon: 'file-text',
  parentId: 'governance',
  route: '/governance/policies',
  order: 2,
  permissionRequired: 'governance.policies.view'
});
```

**Controlling Navigation State:**

```typescript
// In a component
import { NavigationStateManager } from '@promethios/navigation';

function toggleLeftNav() {
  NavigationStateManager.toggleLeftNav();
}

function isLeftNavExpanded() {
  return NavigationStateManager.isLeftNavExpanded();
}
```

### 4.2 Header Navigation

The Header Navigation provides secondary navigation for user-specific actions and global features. It spans the full width of the screen and adapts to different screen sizes.

#### 4.2.1 Components

- **Left Section**: Toggle button for left navigation, breadcrumbs
- **Center Section**: Global search
- **Right Section**: Notification icon, help button, tour button, user profile menu

#### 4.2.2 Usage

**Header Navigation Component:**

```typescript
// In a component
import { HeaderNavigation } from '@promethios/navigation';

function AppLayout({ children }) {
  return (
    <div className="app-container">
      <HeaderNavigation />
      <div className="main-container">
        <LeftNavigation />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Custom Header Action:**

```typescript
// In a module
import { ExtensionRegistry } from '@promethios/core';
import { HeaderAction } from '@promethios/navigation';

const customAction: HeaderAction = {
  id: 'quick-export',
  label: 'Export',
  icon: 'download',
  order: 3,
  onClick: () => {
    // Show export dialog
  },
  permissionRequired: 'export.access'
};

ExtensionRegistry.getExtensionPoint('header:action')?.register(customAction);
```

### 4.3 Routing

Routing in Promethios is handled by React Router with additional wrappers for permission checking and navigation state management.

#### 4.3.1 Route Configuration

Routes are defined with metadata for navigation and permissions:

```typescript
// Route configuration
const routes = [
  {
    path: '/governance/policies',
    component: PoliciesPage,
    exact: true,
    meta: {
      title: 'Governance Policies',
      permissionRequired: 'governance.policies.view',
      navItem: 'governance-policies'
    }
  },
  // More routes...
];
```

#### 4.3.2 Route Registration

Routes can be registered dynamically by modules:

```typescript
// In a module
import { RouterRegistry } from '@promethios/routing';

RouterRegistry.registerRoutes([
  {
    path: '/governance/emotional-veritas',
    component: EmotionalVeritasPage,
    exact: true,
    meta: {
      title: 'Emotional Veritas',
      permissionRequired: 'governance.emotional-veritas.view',
      navItem: 'governance-emotional-veritas'
    }
  }
]);
```

#### 4.3.3 Permission-Based Routing

Routes are protected based on user permissions:

```typescript
// In the router component
import { Route, Redirect } from 'react-router-dom';
import { FirebaseAuthService } from '@promethios/firebase';

function ProtectedRoute({ component: Component, meta, ...rest }) {
  const hasPermission = !meta.permissionRequired || FirebaseAuthService.hasPermission(meta.permissionRequired);
  
  return (
    <Route
      {...rest}
      render={props =>
        hasPermission ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/unauthorized',
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
}
```

## 5. Mobile Responsiveness

### 5.1 Responsive Design Principles

Promethios UI follows a mobile-first approach to responsive design, ensuring that all components work well on devices of all sizes:

- **Fluid Layouts**: Components use percentage-based widths and flex layouts
- **Responsive Breakpoints**: CSS media queries for different screen sizes
- **Touch-Friendly Controls**: Larger touch targets on mobile devices
- **Adaptive Content**: Content adapts to available space
- **Progressive Enhancement**: Core functionality works on all devices, enhanced on larger screens

### 5.2 Breakpoints

The following breakpoints are used throughout the application:

- **Small**: 0-576px (Mobile phones)
- **Medium**: 577-991px (Tablets and small laptops)
- **Large**: 992px+ (Desktops and large laptops)

### 5.3 Implementation

Responsive design is implemented using CSS media queries and responsive components:

```css
/* Example responsive styles */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  
  @media (min-width: 577px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 992px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

```typescript
// Example responsive component
function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 576px)');
  const isTablet = useMediaQuery('(min-width: 577px) and (max-width: 991px)');
  const isDesktop = useMediaQuery('(min-width: 992px)');
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </div>
  );
}
```

## 6. Accessibility

### 6.1 Accessibility Standards

Promethios UI follows WCAG 2.1 Level AA standards for accessibility, ensuring that the application is usable by people with a wide range of abilities and disabilities.

### 6.2 Key Accessibility Features

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: All content is announced correctly by screen readers
- **Color Contrast**: All text meets AA contrast requirements
- **Text Resizing**: Interface works when text is resized up to 200%
- **Focus Indicators**: All interactive elements have visible focus indicators
- **ARIA Attributes**: Proper ARIA roles, states, and properties
- **Form Labels**: All form controls have associated labels
- **Error Identification**: Errors are clearly identified and described

### 6.3 Implementation

Accessibility is implemented through proper HTML semantics, ARIA attributes, and keyboard event handlers:

```typescript
// Example accessible component
function AccessibleButton({ onClick, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      tabIndex={0}
    >
      {label}
    </button>
  );
}
```

```typescript
// Example keyboard navigation
function KeyboardNavigableMenu({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prevIndex) => Math.min(prevIndex + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        items[activeIndex].onClick();
        break;
    }
  };
  
  return (
    <ul
      role="menu"
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          role="menuitem"
          tabIndex={index === activeIndex ? 0 : -1}
          aria-selected={index === activeIndex}
          onClick={item.onClick}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

## 7. Firebase Integration

### 7.1 Authentication

Firebase Authentication is used for user identity and role-based access control:

```typescript
// Example authentication service
import firebase from 'firebase/app';
import 'firebase/auth';

class FirebaseAuthServiceImpl implements FirebaseAuthService {
  private auth: firebase.auth.Auth;
  
  constructor(app: firebase.app.App) {
    this.auth = app.auth();
  }
  
  getCurrentUser(): firebase.User | null {
    return this.auth.currentUser;
  }
  
  async getUserRoles(): Promise<string[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    
    const token = await user.getIdTokenResult();
    return token.claims.roles || [];
  }
  
  async hasPermission(permission: string): Promise<boolean> {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const token = await user.getIdTokenResult();
    
    // Check if user is admin (has all permissions)
    if (token.claims.roles?.includes('admin')) return true;
    
    // Check specific permission
    return token.claims.permissions?.includes(permission) || false;
  }
  
  async login(email: string, password: string): Promise<firebase.User> {
    const result = await this.auth.signInWithEmailAndPassword(email, password);
    return result.user!;
  }
  
  async logout(): Promise<void> {
    await this.auth.signOut();
  }
}
```

### 7.2 Firestore

Cloud Firestore is used for data storage and real-time updates:

```typescript
// Example Firestore service
import firebase from 'firebase/app';
import 'firebase/firestore';

class FirestoreServiceImpl implements FirestoreService {
  private firestore: firebase.firestore.Firestore;
  
  constructor(app: firebase.app.App) {
    this.firestore = app.firestore();
  }
  
  async getDocument<T>(collection: string, id: string): Promise<T | null> {
    const doc = await this.firestore.collection(collection).doc(id).get();
    
    if (!doc.exists) return null;
    
    return { id: doc.id, ...doc.data() } as T;
  }
  
  async queryDocuments<T>(collection: string, query: FirestoreQuery): Promise<T[]> {
    let ref = this.firestore.collection(collection) as firebase.firestore.Query;
    
    // Apply query conditions
    if (query.where) {
      for (const condition of query.where) {
        ref = ref.where(condition.field, condition.operator as any, condition.value);
      }
    }
    
    // Apply ordering
    if (query.orderBy) {
      for (const order of query.orderBy) {
        ref = ref.orderBy(order.field, order.direction);
      }
    }
    
    // Apply limit
    if (query.limit) {
      ref = ref.limit(query.limit);
    }
    
    const snapshot = await ref.get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  }
  
  async addDocument<T>(collection: string, data: T): Promise<string> {
    const doc = await this.firestore.collection(collection).add(data);
    return doc.id;
  }
  
  async updateDocument<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    await this.firestore.collection(collection).doc(id).update(data);
  }
  
  async deleteDocument(collection: string, id: string): Promise<void> {
    await this.firestore.collection(collection).doc(id).delete();
  }
  
  listenToDocument<T>(collection: string, id: string, callback: (data: T | null) => void): () => void {
    return this.firestore.collection(collection).doc(id).onSnapshot(doc => {
      if (!doc.exists) {
        callback(null);
      } else {
        callback({ id: doc.id, ...doc.data() } as T);
      }
    });
  }
  
  listenToQuery<T>(collection: string, query: FirestoreQuery, callback: (data: T[]) => void): () => void {
    let ref = this.firestore.collection(collection) as firebase.firestore.Query;
    
    // Apply query conditions (same as queryDocuments)
    // ...
    
    return ref.onSnapshot(snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
      callback(data);
    });
  }
}
```

### 7.3 Security Rules

Firestore security rules are used to control access to data:

```
// Example security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function hasRole(role) {
      return isAuthenticated() && request.auth.token.roles.hasAny([role, 'admin']);
    }
    
    function hasPermission(permission) {
      return isAuthenticated() && (
        request.auth.token.permissions.hasAny([permission]) || 
        hasRole('admin')
      );
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Governance policies
    match /governancePolicies/{policyId} {
      allow read: if hasPermission('governance.policies.view');
      allow create: if hasPermission('governance.policies.create');
      allow update: if hasPermission('governance.policies.update');
      allow delete: if hasPermission('governance.policies.delete');
    }
    
    // User preferences
    match /userPreferences/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }
    
    // Integration configurations
    match /integrationInstances/{instanceId} {
      allow read: if hasPermission('settings.integrations.view');
      allow create: if hasPermission('settings.integrations.create');
      allow update: if hasPermission('settings.integrations.update');
      allow delete: if hasPermission('settings.integrations.delete');
    }
  }
}
```

## 8. Best Practices

### 8.1 Extension System

- **Register Early**: Register extension points during module initialization
- **Validate Extensions**: Validate extensions before registering them
- **Handle Missing Extensions**: Gracefully handle cases where expected extensions are not available
- **Document Extension Points**: Clearly document the purpose and API of each extension point
- **Version Extensions**: Include version information in extension metadata

### 8.2 Navigation

- **Use Consistent Patterns**: Follow consistent navigation patterns throughout the application
- **Respect Permissions**: Only show navigation items the user has permission to access
- **Preserve State**: Preserve navigation state (active items, collapsed state) across page refreshes
- **Provide Context**: Use breadcrumbs and other contextual cues to help users understand their location
- **Support Keyboard**: Ensure all navigation is accessible via keyboard

### 8.3 Firebase

- **Minimize Reads**: Design queries to minimize the number of Firestore reads
- **Batch Writes**: Use batch operations for multiple writes
- **Secure Rules**: Write comprehensive security rules to protect data
- **Handle Offline**: Design for offline functionality where appropriate
- **Monitor Usage**: Monitor Firebase usage to avoid exceeding quotas

### 8.4 Accessibility

- **Test with Screen Readers**: Regularly test with screen readers like NVDA or VoiceOver
- **Use Semantic HTML**: Use appropriate HTML elements for their semantic meaning
- **Provide Text Alternatives**: Provide text alternatives for non-text content
- **Ensure Keyboard Access**: Ensure all functionality is available via keyboard
- **Test Color Contrast**: Ensure sufficient color contrast for text and UI elements

### 8.5 Mobile Responsiveness

- **Design Mobile-First**: Start with mobile layouts and enhance for larger screens
- **Test on Real Devices**: Test on actual mobile devices, not just emulators
- **Optimize Performance**: Optimize performance for mobile devices with limited resources
- **Consider Touch**: Design for touch interactions on mobile devices
- **Adapt Content**: Adapt content presentation for different screen sizes

## 9. Troubleshooting

### 9.1 Common Issues

#### 9.1.1 Extension Not Registered

**Symptoms**: Extension point not found or extension not working

**Solutions**:
1. Check that the extension point is registered before attempting to use it
2. Verify that the module registering the extension point is initialized
3. Check for console errors during module initialization

#### 9.1.2 Permission Denied

**Symptoms**: User cannot access a route or feature they should have access to

**Solutions**:
1. Check the user's roles and permissions in Firebase Authentication
2. Verify that the permission check is using the correct permission string
3. Check Firestore security rules for the relevant collection

#### 9.1.3 Firebase Connection Issues

**Symptoms**: Data not loading or updates not saving

**Solutions**:
1. Check the Firebase console for service status
2. Verify that the Firebase configuration is correct
3. Check for network connectivity issues
4. Look for quota limitations or restrictions

### 9.2 Debugging Tools

- **Browser Developer Tools**: For inspecting elements, network requests, and JavaScript errors
- **React Developer Tools**: For inspecting React component hierarchy and props
- **Firebase Emulator Suite**: For local development and testing
- **Lighthouse**: For performance, accessibility, and best practices audits

## 10. Conclusion

This documentation provides a comprehensive overview of the Promethios UI architecture and all new features implemented as part of the enhanced UI project. It serves as the primary reference for developers working with the system and for users seeking to understand the capabilities and extension points of the platform.

For specific implementation details, refer to the individual design documents for each feature module.
