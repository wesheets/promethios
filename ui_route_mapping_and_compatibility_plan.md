# Promethios UI Route Mapping and Compatibility Plan

## 1. Overview

This document provides a comprehensive mapping of all UI routes in the Promethios system, detailing their corresponding components, extension points, and compatibility strategies. The plan ensures backward compatibility with legacy routes while enabling integration with the new extension system.

## 2. Current UI Structure Analysis

### 2.1 UI Component Hierarchy

Based on the current codebase, the Promethios UI is organized into several key areas:

```
Promethios UI
├── Governance Dashboard
│   ├── Governance Dashboard Components
│   │   ├── Governance Health Reporter UI
│   │   └── Trust Metrics Visualizer
│   └── Governance Mesh UI
├── Trust Surface Dashboard
│   ├── Components
│   │   ├── Attestation Dashboard
│   │   ├── Audit Trail Explorer
│   │   ├── Boundary Alerts
│   │   ├── Metrics Panel
│   │   ├── Surface View
│   │   ├── Trend Charts
│   │   └── Trust Decay Dashboard
│   ├── Integration
│   │   └── Trust Decay Integration
│   └── Layouts
│       └── Dashboard Layout
└── Governance Visualization Dashboard
    └── Components
        └── Governance Visualization Dashboard
```

### 2.2 Current Route Structure

| Route | Component | Description | Dependencies |
|-------|-----------|-------------|--------------|
| `/dashboard` | Trust Surface Dashboard | Main dashboard view | Authentication |
| `/dashboard/governance` | Governance Dashboard | Governance overview | Authentication, Trust Metrics |
| `/dashboard/trust` | Trust Surface Dashboard | Trust metrics view | Authentication, Trust Metrics |
| `/dashboard/attestation` | Attestation Dashboard | Attestation management | Authentication, Attestation Service |
| `/dashboard/audit` | Audit Trail Explorer | Audit log viewer | Authentication, Audit Service |
| `/dashboard/visualization` | Governance Visualization Dashboard | Governance visualization | Authentication, Visualization Service |
| `/dashboard/metrics` | Metrics Panel | Detailed metrics view | Authentication, Metrics Service |
| `/dashboard/alerts` | Boundary Alerts | Trust boundary alerts | Authentication, Alert Service |
| `/dashboard/trends` | Trend Charts | Historical trend analysis | Authentication, Analytics Service |
| `/dashboard/decay` | Trust Decay Dashboard | Trust decay visualization | Authentication, Trust Decay Service |

## 3. Extension System Integration

### 3.1 Component Registration Strategy

Each UI component will be registered with the extension system using the following pattern:

```typescript
// Example component registration
class DashboardComponent extends React.Component<Props, State> {
  componentDidMount() {
    ExtensionRegistry.registerUIComponent({
      id: 'dashboard-component',
      component: this,
      extensionPoints: ['main-dashboard', 'governance-view'],
      featureFlag: 'enableDashboard'
    });
  }
  
  componentWillUnmount() {
    ExtensionRegistry.unregisterUIComponent('dashboard-component');
  }
  
  // Component implementation
}
```

### 3.2 Route Registration Strategy

All routes will be registered with the extension system's route registry:

```typescript
// Example route registration
RouteRegistry.registerRoute({
  path: '/dashboard/governance',
  component: 'governance-dashboard',
  title: 'Governance Dashboard',
  requiredPermissions: ['view:governance'],
  featureFlag: 'enableGovernanceDashboard'
});
```

### 3.3 Extension Points

The following extension points are defined for UI components:

| Extension Point | Description | Available Slots |
|-----------------|-------------|----------------|
| `main-dashboard` | Main dashboard area | Header, Sidebar, Content, Footer |
| `governance-view` | Governance dashboard area | Metrics, Visualizations, Controls, Reports |
| `trust-surface` | Trust surface visualization | Surface, Controls, Legend, Details |
| `attestation-view` | Attestation management | List, Details, Actions, History |
| `audit-view` | Audit trail explorer | Filters, Timeline, Details, Export |
| `metrics-panel` | Metrics visualization | Charts, Tables, Controls, Exports |
| `alerts-panel` | Alert management | List, Details, Actions, Settings |
| `trends-view` | Trend analysis | Charts, Filters, Timeframe, Export |

## 4. Route Mapping

### 4.1 Legacy to Extension-Based Route Mapping

| Legacy Route | Extension-Based Route | Component ID | Extension Points |
|--------------|------------------------|-------------|------------------|
| `/dashboard` | `/dashboard` | `main-dashboard` | `main-dashboard` |
| `/dashboard/governance` | `/dashboard/governance` | `governance-dashboard` | `governance-view` |
| `/dashboard/trust` | `/dashboard/trust` | `trust-surface-dashboard` | `trust-surface` |
| `/dashboard/attestation` | `/dashboard/attestation` | `attestation-dashboard` | `attestation-view` |
| `/dashboard/audit` | `/dashboard/audit` | `audit-trail-explorer` | `audit-view` |
| `/dashboard/visualization` | `/dashboard/visualization` | `governance-visualization-dashboard` | `governance-view` |
| `/dashboard/metrics` | `/dashboard/metrics` | `metrics-panel` | `metrics-panel` |
| `/dashboard/alerts` | `/dashboard/alerts` | `boundary-alerts` | `alerts-panel` |
| `/dashboard/trends` | `/dashboard/trends` | `trend-charts` | `trends-view` |
| `/dashboard/decay` | `/dashboard/decay` | `trust-decay-dashboard` | `trust-surface` |

### 4.2 New Routes for Advanced Features

| Route | Component ID | Extension Points | Feature Flag |
|-------|-------------|------------------|--------------|
| `/onboarding` | `onboarding-container` | `onboarding-flow` | `enableOnboarding` |
| `/onboarding/:step` | `onboarding-step` | `onboarding-flow` | `enableOnboarding` |
| `/dashboard/emotional` | `emotional-veritas-dashboard` | `governance-view`, `veritas-dashboard` | `enableEmotionalVeritas` |
| `/dashboard/emotional/:metric` | `emotional-metric-detail` | `veritas-dashboard` | `enableEmotionalVeritas` |
| `/agents` | `agent-management` | `agent-view` | `enableAgentScorecard` |
| `/agents/:agentId` | `agent-detail` | `agent-view` | `enableAgentScorecard` |
| `/agents/:agentId/scorecard` | `agent-scorecard` | `agent-view`, `scorecard-view` | `enableAgentScorecard` |
| `/agents/:agentId/governance` | `governance-identity` | `agent-view`, `governance-view` | `enableGovernanceIdentity` |
| `/chat` | `chat-container` | `chat-view` | `enableToggleableChat` |
| `/chat/governance` | `governance-chat` | `chat-view`, `governance-view` | `enableToggleableChat` |
| `/chat/standard` | `standard-chat` | `chat-view` | `enableToggleableChat` |
| `/chat/multi` | `multi-agent-chat` | `chat-view`, `multi-agent-view` | `enableMultiAgentChat` |
| `/benchmark` | `benchmark-container` | `benchmark-view` | `enableCMUBenchmark` |
| `/benchmark/results` | `benchmark-results` | `benchmark-view`, `results-view` | `enableCMUBenchmark` |

## 5. Component Mapping

### 5.1 Governance Dashboard Components

| Component | File Path | Extension Points | Dependencies |
|-----------|-----------|------------------|--------------|
| Governance Dashboard | `governance_dashboard/components/governance_dashboard.py` | `governance-view` | Trust Metrics, Governance Health |
| Governance Health Reporter UI | `governance_dashboard/components/governance_health_reporter_ui.py` | `governance-view` | Governance Health Service |
| Trust Metrics Visualizer | `governance_dashboard/components/trust_metrics_visualizer.py` | `governance-view`, `metrics-panel` | Trust Metrics Service |

### 5.2 Trust Surface Dashboard Components

| Component | File Path | Extension Points | Dependencies |
|-----------|-----------|------------------|--------------|
| Trust Surface Dashboard | `trust_surface_dashboard/trust_surface_dashboard.py` | `trust-surface` | Trust Surface Service |
| Attestation Dashboard | `trust_surface_dashboard/components/attestation_dashboard.py` | `attestation-view` | Attestation Service |
| Audit Trail Explorer | `trust_surface_dashboard/components/audit_trail_explorer.py` | `audit-view` | Audit Service |
| Boundary Alerts | `trust_surface_dashboard/components/boundary_alerts.py` | `alerts-panel` | Alert Service |
| Metrics Panel | `trust_surface_dashboard/components/metrics_panel.py` | `metrics-panel` | Metrics Service |
| Surface View | `trust_surface_dashboard/components/surface_view.py` | `trust-surface` | Trust Surface Service |
| Trend Charts | `trust_surface_dashboard/components/trend_charts.py` | `trends-view` | Analytics Service |
| Trust Decay Dashboard | `trust_surface_dashboard/components/trust_decay_dashboard.py` | `trust-surface` | Trust Decay Service |

### 5.3 Governance Visualization Dashboard Components

| Component | File Path | Extension Points | Dependencies |
|-----------|-----------|------------------|--------------|
| Governance Visualization Dashboard | `governance_visualization_dashboard/components/governance_visualization_dashboard.jsx` | `governance-view` | Visualization Service |

## 6. State Management

### 6.1 Current State Management

The current UI components use a mix of state management approaches:

- Redux for global state
- Component state for local state
- Context API for shared state within component trees

### 6.2 Extension-Based State Management

The extension system will provide a consistent state management approach:

```typescript
// Example state management
class DashboardComponent extends React.Component<Props, State> {
  componentDidMount() {
    // Register with state management
    StateRegistry.registerStateConsumer('dashboard', this.handleStateChange);
    
    // Initialize state
    StateRegistry.setState('dashboard', {
      activeView: 'governance',
      metrics: [],
      loading: false
    });
  }
  
  componentWillUnmount() {
    // Unregister from state management
    StateRegistry.unregisterStateConsumer('dashboard', this.handleStateChange);
  }
  
  handleStateChange = (newState) => {
    this.setState({ ...newState });
  }
  
  // Component implementation
}
```

### 6.3 State Migration Strategy

To ensure backward compatibility, a state adapter will be implemented:

```typescript
// State adapter example
class StateAdapter {
  constructor(private legacyState, private extensionState) {}
  
  getState(key) {
    return this.extensionState.hasState(key)
      ? this.extensionState.getState(key)
      : this.legacyState.getState()[key];
  }
  
  setState(key, value) {
    this.legacyState.setState({ [key]: value });
    this.extensionState.setState(key, value);
  }
}
```

## 7. Route Compatibility

### 7.1 Route Preservation

All existing routes will be preserved through:

1. **Route Registry**: All legacy routes are registered in the extension system
2. **Route Aliases**: New routes can alias to legacy routes for backward compatibility
3. **Route Guards**: Ensure proper permissions and feature flags are checked
4. **Route Fallbacks**: Provide fallback routes if a route is not found

### 7.2 Route Facade

A route facade will handle both legacy and extension-based routing:

```typescript
// Route facade example
class RouteFacade {
  navigate(route, params) {
    // Check if route exists in extension system
    if (RouteRegistry.hasRoute(route)) {
      return RouteRegistry.navigate(route, params);
    }
    
    // Fall back to legacy routing
    return LegacyRouter.navigate(route, params);
  }
  
  registerRoute(route, component, options) {
    RouteRegistry.registerRoute(route, component, options);
  }
}
```

### 7.3 Deep Linking

All routes will support deep linking through:

1. **URL Parameters**: Support for query parameters and path parameters
2. **State Preservation**: State is preserved in URL when appropriate
3. **Shareable URLs**: All routes generate shareable URLs

## 8. Feature-Specific Integration

### 8.1 Veritas 2.0 Integration

The Veritas 2.0 system will be integrated through:

1. **Component Registration**: Register Veritas UI components with extension system
2. **Route Registration**: Register Veritas routes with route registry
3. **State Integration**: Integrate Veritas state with extension state management
4. **Extension Points**: Define Veritas-specific extension points

Veritas 2.0 components will be mapped as follows:

| Component | Extension Points | Routes |
|-----------|------------------|--------|
| VeritasPanel | `veritas-dashboard`, `governance-view` | `/dashboard/veritas` |
| ClaimCard | `veritas-dashboard` | `/dashboard/veritas/claim/:claimId` |
| ConfidenceBadge | `veritas-dashboard`, `metrics-panel` | N/A (Component only) |
| SourceList | `veritas-dashboard` | `/dashboard/veritas/sources` |
| HallucinationWarning | `veritas-dashboard`, `alerts-panel` | N/A (Component only) |

### 8.2 Emotional Veritas 2.0 Integration

The Emotional Veritas 2.0 system will extend the Veritas 2.0 integration with:

1. **Emotional Metrics**: Register emotional metric components
2. **Dashboard Integration**: Integrate with dashboard layout
3. **Visualization Components**: Register visualization components

Emotional Veritas 2.0 components will be mapped as follows:

| Component | Extension Points | Routes |
|-----------|------------------|--------|
| EmotionalVeritasDashboard | `veritas-dashboard`, `emotional-dashboard` | `/dashboard/emotional` |
| EmotionalGaugeWidget | `emotional-dashboard`, `metrics-panel` | `/dashboard/emotional/gauge/:metricId` |
| EmotionalTrendWidget | `emotional-dashboard`, `trends-view` | `/dashboard/emotional/trends/:metricId` |
| EmotionalComparisonWidget | `emotional-dashboard` | `/dashboard/emotional/compare` |

### 8.3 Observer Agent Integration

The Observer Agent will be integrated through:

1. **Global Component**: Register observer as a global UI component
2. **Event Listeners**: Add event listeners for user interactions
3. **Suggestion Display**: Register suggestion display components

Observer Agent components will be mapped as follows:

| Component | Extension Points | Routes |
|-----------|------------------|--------|
| ObserverAgentContainer | `global` | N/A (Global component) |
| ObserverAvatar | `global` | N/A (Global component) |
| SuggestionDisplay | `global` | N/A (Global component) |

## 9. Testing Strategy

### 9.1 Route Testing

Each route will be tested for:

1. **Accessibility**: Ensure routes are accessible with proper permissions
2. **Navigation**: Verify navigation between routes
3. **Deep Linking**: Test deep linking functionality
4. **State Preservation**: Verify state is preserved during navigation

### 9.2 Component Testing

Each component will be tested for:

1. **Rendering**: Verify component renders correctly
2. **Interaction**: Test user interactions
3. **State Management**: Verify state updates correctly
4. **Extension Integration**: Test integration with extension system

### 9.3 Integration Testing

Integration tests will verify:

1. **Component Interactions**: Test interactions between components
2. **Route Transitions**: Verify transitions between routes
3. **State Synchronization**: Test state synchronization between components
4. **Feature Flag Behavior**: Verify feature flags control visibility correctly

## 10. Implementation Plan

### 10.1 Phase 1: Route Registry (Week 1)

1. Implement route registry
2. Register all legacy routes
3. Create route facade
4. Test route preservation

### 10.2 Phase 2: Component Registry (Week 2)

1. Implement component registry
2. Register core UI components
3. Define extension points
4. Test component registration

### 10.3 Phase 3: State Management (Week 3)

1. Implement state registry
2. Create state adapters
3. Migrate core state to extension state
4. Test state synchronization

### 10.4 Phase 4: Feature Integration (Weeks 4-8)

1. Integrate Veritas 2.0 components
2. Implement Emotional Veritas 2.0 dashboard
3. Develop Observer Agent integration
4. Create Agent Scorecard components
5. Implement Chat Interface components
6. Develop Benchmark components

### 10.5 Phase 5: Testing and Refinement (Weeks 9-10)

1. Execute comprehensive testing
2. Refine component implementations
3. Optimize performance
4. Finalize documentation

## 11. Next Steps

1. Implement route registry and component registry
2. Register all legacy routes and components
3. Create state adapters for backward compatibility
4. Begin integration of Veritas 2.0 components
5. Develop Emotional Veritas 2.0 dashboard
