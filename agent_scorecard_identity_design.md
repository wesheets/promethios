# Agent Scorecard and Governance Identity Modules Design

## 1. Overview

This document outlines the design for the Agent Scorecard and Governance Identity modules within the Promethios system. The Agent Scorecard provides a framework for evaluating and visualizing AI agent performance against governance metrics. The Governance Identity module establishes a system for managing agent identities, attestations, and roles within the governance framework.

## 2. Agent Scorecard Module

### 2.1 Core Components

#### 2.1.1 ScorecardMetricRegistry
Manages the lifecycle of metrics used in agent scorecards.
```typescript
class ScorecardMetricRegistry {
  registerMetric(metric: ScorecardMetric): boolean;
  deregisterMetric(metricId: string): boolean;
  getMetric(metricId: string): ScorecardMetric | null;
  getAllMetrics(): ScorecardMetric[];
  getMetricsByCategory(category: string): ScorecardMetric[];
}
```

#### 2.1.2 ScorecardMetric Interface
Defines the contract for metrics used in scorecards.
```typescript
interface ScorecardMetric {
  id: string; // Unique metric ID (e.g., "accuracy", "bias-fairness", "response-time")
  name: string; // Display name (e.g., "Accuracy Score", "Fairness Index")
  description: string;
  category: string; // (e.g., "Performance", "Fairness", "Robustness", "Compliance")
  valueType: 'percentage' | 'score' | 'boolean' | 'duration' | 'custom';
  // How to calculate the metric for a given agent and context
  calculate: (agentId: string, context: ScorecardContext) => Promise<number | boolean | string>;
  // How to interpret the value (e.g., higher is better, lower is better, target range)
  interpretationRule?: {
    direction: 'higher_is_better' | 'lower_is_better' | 'target_range';
    targetValue?: number;
    targetRange?: [number, number];
    thresholds?: {
      warning: number | [number, number];
      critical: number | [number, number];
    };
  };
  // How to visualize this metric (e.g., gauge, bar, trend)
  visualizationHint?: string;
  // Weight of this metric in an overall score (0-1)
  weight?: number;
}

interface ScorecardContext {
  timePeriod?: { start: Date; end: Date };
  datasetId?: string; // For evaluations against specific datasets
  useCaseId?: string; // For context-specific evaluations
  customFilters?: Record<string, any>;
}
```

#### 2.1.3 AgentEvaluationService
Orchestrates the evaluation of agents against scorecards.
```typescript
class AgentEvaluationService {
  // Create or update a scorecard template
  saveScorecardTemplate(template: ScorecardTemplate): Promise<string>;
  getScorecardTemplate(templateId: string): Promise<ScorecardTemplate | null>;
  listScorecardTemplates(): Promise<ScorecardTemplate[]>;

  // Evaluate an agent against a scorecard template
  evaluateAgent(agentId: string, templateId: string, context: ScorecardContext): Promise<AgentScorecardResult>;
  // Get historical evaluation results for an agent
  getAgentEvaluationHistory(agentId: string, templateId?: string, timePeriod?: { start: Date; end: Date }): Promise<AgentScorecardResult[]>;
  // Compare multiple agents
  compareAgents(agentIds: string[], templateId: string, context: ScorecardContext): Promise<AgentComparisonResult[]>;
}

interface ScorecardTemplate {
  id: string;
  name: string;
  description: string;
  metricIds: string[]; // List of ScorecardMetric IDs included in this template
  // Custom weights for metrics in this template, overriding default metric weights
  metricWeights?: Record<string, number>; 
}

interface AgentScorecardResult {
  agentId: string;
  templateId: string;
  evaluationTimestamp: Date;
  context: ScorecardContext;
  overallScore?: number; // Calculated based on weighted metrics
  metricValues: Record<string, { value: number | boolean | string; score?: number; status?: 'critical' | 'warning' | 'normal' }>;
  // Qualitative feedback or notes
  notes?: string;
}

interface AgentComparisonResult extends AgentScorecardResult {
  rank?: number;
}
```

### 2.2 UI Components

#### 2.2.1 AgentScorecardDashboard
Displays an overview of agent scores, comparisons, and trends.
- Route: `/agents/:agentId/scorecard` or `/dashboard/agent-scorecards`
- Allows selection of agents, scorecard templates, and time periods.
- Visualizes overall scores and individual metric performance.

#### 2.2.2 ScorecardTemplateEditor
UI for creating and editing scorecard templates.
- Route: `/admin/scorecard-templates`
- Allows selection of metrics, setting weights, and defining template details.

#### 2.2.3 MetricVisualization Widgets
Reusable components for displaying individual metrics (e.g., `GaugeWidget`, `BarChartWidget`, `TrendLineWidget`).

### 2.3 Default Scorecard Metrics
- **Performance**: Accuracy, F1-Score, Response Time, Throughput.
- **Fairness & Bias**: Demographic Parity, Equalized Odds, Counterfactual Fairness.
- **Robustness**: Performance on adversarial inputs, Noise resilience.
- **Compliance**: Adherence to specific governance rules (binary or score).
- **Resource Usage**: CPU/Memory consumption, Cost per inference.

## 3. Governance Identity Module

### 3.1 Core Components

#### 3.1.1 AgentIdentityRegistry
Manages the identities of AI agents.
```typescript
class AgentIdentityRegistry {
  registerAgent(identity: AgentIdentity): Promise<string>; // Returns agentId
  getAgentIdentity(agentId: string): Promise<AgentIdentity | null>;
  updateAgentIdentity(agentId: string, updates: Partial<AgentIdentity>): Promise<boolean>;
  listAgents(filters?: AgentFilter): Promise<AgentIdentity[]>;
  // Link an agent to its underlying model/endpoint
  linkAgentToModel(agentId: string, modelDetails: AgentModelLink): Promise<boolean>;
}

interface AgentIdentity {
  id: string; // Unique system-generated agent ID
  name: string; // Human-readable name
  version: string;
  description?: string;
  ownerId: string; // User or team responsible for the agent
  tags?: string[];
  creationDate: Date;
  lastModifiedDate: Date;
  status: 'active' | 'inactive' | 'deprecated' | 'experimental';
  // Link to the actual model or service endpoint
  modelLink?: AgentModelLink;
  // Governance-specific attributes
  governanceProfileId?: string; // Links to a set of applicable governance rules/policies
  attestations?: AgentAttestation[];
  assignedRoles?: string[]; // Roles within Promethios or specific use cases
}

interface AgentModelLink {
  type: 'api_endpoint' | 'internal_model_id' | 'custom_wrapper_id';
  identifier: string; // URL, model ID, wrapper ID
  credentialsId?: string; // Reference to stored credentials if needed
}

interface AgentFilter {
  ownerId?: string;
  status?: string;
  tagsInclude?: string[];
}
```

#### 3.1.2 AgentAttestationService
Manages attestations for agents (e.g., compliance certifications, security reviews).
```typescript
class AgentAttestationService {
  addAttestation(agentId: string, attestation: AgentAttestation): Promise<string>; // Returns attestationId
  getAttestation(agentId: string, attestationId: string): Promise<AgentAttestation | null>;
  listAttestationsForAgent(agentId: string): Promise<AgentAttestation[]>;
  revokeAttestation(agentId: string, attestationId: string, reason: string): Promise<boolean>;
}

interface AgentAttestation {
  id: string;
  type: string; // e.g., "SecurityAuditPass", "BiasTestCertification", "GDPRCompliant"
  issuer: string; // Who issued the attestation
  issueDate: Date;
  expiryDate?: Date;
  evidenceLink?: string; // URL to supporting documents/reports
  status: 'active' | 'expired' | 'revoked';
  revocationReason?: string;
}
```

#### 3.1.3 AgentRoleService
Manages roles that can be assigned to agents.
```typescript
class AgentRoleService {
  defineRole(role: AgentRoleDefinition): Promise<string>; // Returns roleId
  getRoleDefinition(roleId: string): Promise<AgentRoleDefinition | null>;
  listRoleDefinitions(): Promise<AgentRoleDefinition[]>;
  assignRoleToAgent(agentId: string, roleId: string): Promise<boolean>;
  unassignRoleFromAgent(agentId: string, roleId: string): Promise<boolean>;
}

interface AgentRoleDefinition {
  id: string; // e.g., "customer-support-chatbot", "financial-advisor-bot"
  name: string;
  description: string;
  // Permissions or capabilities associated with this role within Promethios
  permissions?: string[]; 
}
```

### 3.2 UI Components

#### 3.2.1 AgentRegistryDashboard
Displays a list of all registered agents, with filtering and search.
- Route: `/agents` or `/admin/agents`
- Shows key identity details, status, and owner.
- Links to individual agent detail pages.

#### 3.2.2 AgentDetailView
Displays comprehensive information about a single agent.
- Route: `/agents/:agentId`
- Tabs for: Overview (identity details), Scorecards, Attestations, Assigned Roles, Governance Profile, Activity Log.

#### 3.2.3 AgentRegistrationForm
UI for registering new agents or editing existing ones.

#### 3.2.4 AttestationManagerUI
UI for viewing, adding, and revoking attestations for an agent.

## 4. Extension Points

### 4.1 Agent Scorecard Extensions
```typescript
// Register a custom scorecard metric
ExtensionRegistry.registerExtensionPoint("scorecard:metric", {
  register: (metric: ScorecardMetric) => ScorecardMetricRegistry.registerMetric(metric),
  deregister: (metricId: string) => ScorecardMetricRegistry.deregisterMetric(metricId),
});

// Register a custom evaluation step/hook
ExtensionRegistry.registerExtensionPoint("scorecard:evaluationHook", {
  // Types: 'preEvaluation', 'postMetricCalculation', 'postEvaluation'
  register: (hookType: string, hookFn: Function) => EvaluationHookRegistry.register(hookType, hookFn),
});
```

### 4.2 Governance Identity Extensions
```typescript
// Register a custom agent identity attribute type
ExtensionRegistry.registerExtensionPoint("identity:attribute", {
  register: (attributeDefinition: CustomAttribute) => AgentIdentityRegistry.registerCustomAttribute(attributeDefinition),
});

// Register a custom attestation type
ExtensionRegistry.registerExtensionPoint("identity:attestationType", {
  register: (attestationType: AttestationTypeDefinition) => AgentAttestationService.registerAttestationType(attestationType),
});
```

## 5. Integration with Other Systems

- **Agent Wrapping**: Agent identities created here will be linked to wrapped agents. Scorecard metrics can be calculated based on data from wrapped agent interactions.
- **Emotional Veritas**: Agent performance on scorecards (e.g., fairness, compliance) can feed into emotional impact metrics.
- **Observer Agent**: Can monitor agent activity and trigger evaluations or flag identity/attestation issues.
- **UI Route Mapping**: Routes for these modules will be added to `ui_route_mapping_and_compatibility_plan.md`.
- **Feature Toggles**: Features like "EnableAdvancedScorecards" or "EnableAgentRoleManagement" will control visibility.

## 6. State Management

- Vuex/Redux stores for: `scorecardMetrics`, `scorecardTemplates`, `agentIdentities`, `agentAttestations`, `agentRoles`.
- State will be fetched via API calls to backend services implementing the logic of `AgentEvaluationService`, `AgentIdentityRegistry`, etc.

## 7. API Integration

- RESTful APIs for all services:
  - `/api/scorecard/metrics`, `/api/scorecard/templates`, `/api/scorecard/evaluations`
  - `/api/identity/agents`, `/api/identity/agents/:agentId/attestations`, `/api/identity/roles`

## 8. Accessibility and Mobile Responsiveness

- Standard accessibility practices (ARIA, keyboard navigation) will be applied to all UI components.
- Dashboards and forms will be designed with mobile responsiveness in mind, potentially offering simplified views for smaller screens.

## 9. Implementation Plan

### 9.1 Phase 1: Core Identity Infrastructure
1. Implement `AgentIdentityRegistry` and `AgentModelLink` (backend & API).
2. Implement `AgentAttestationService` and `AgentRoleService` (backend & API).
3. Basic UI for agent registration and listing (`AgentRegistryDashboard`, `AgentRegistrationForm`).

### 9.2 Phase 2: Core Scorecard Infrastructure
1. Implement `ScorecardMetricRegistry` (backend & API, with a few default metrics).
2. Implement `AgentEvaluationService` (backend & API for `saveScorecardTemplate`, `evaluateAgent`).
3. Basic UI for template creation (`ScorecardTemplateEditor`) and viewing results (`AgentScorecardDashboard` for single agent).

### 9.3 Phase 3: UI Enhancements & Visualization
1. Develop advanced `AgentScorecardDashboard` features (comparisons, trends).
2. Implement various `MetricVisualizationWidgets`.
3. Refine `AgentDetailView` with tabs for scorecards, attestations, roles.

### 9.4 Phase 4: Extension System Integration
1. Implement defined extension points for scorecard metrics and identity attributes.
2. Integrate with Feature Toggle Service.

### 9.5 Phase 5: Integration with Other Modules
1. Link agent identities with the Agent Wrapping system.
2. Feed scorecard data to Emotional Veritas and Observer Agent where applicable.

### 9.6 Phase 6: Testing and Documentation
1. Unit and integration tests for all components and services.
2. Comprehensive documentation.

## 10. Next Steps

1. Begin backend implementation for `AgentIdentityRegistry` and `ScorecardMetricRegistry`.
2. Design database schemas for storing identities, metrics, templates, and evaluations.
3. Start frontend implementation of basic UI components for agent listing and registration.

