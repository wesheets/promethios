# Phase 5.9: Trust Decay Engine - Integration Points

## Overview
This document identifies and documents all integration points between Phase 5.9 (Trust Decay Engine) and previous phases of the Promethios project, focusing on data flows, dependencies, and interaction patterns.

## Integration with Phase 5.8 (Codex Mutation Lock)

### Contract Sealer Integration
- **Components**: `TrustDecayEngine` ↔ `ContractSealer`
- **File Dependencies**: 
  - `src/core/trust/trust_decay_engine.py` → `src/core/governance/contract_sealer.py`
- **Data Flow**:
  - Trust decay engine uses ContractSealer to seal trust state changes
  - Sealed trust states are verified before use
  - Seal verification failures trigger trust decay events
- **Implementation Notes**:
  - Must use the same sealing mechanisms as Phase 5.8
  - Must maintain compatibility with seal verification logic
  - Must handle seal verification failures gracefully

### Mutation Detection Integration
- **Components**: `TrustDecayEngine` ↔ `MutationDetector`
- **File Dependencies**: 
  - `src/core/trust/trust_decay_engine.py` → `src/core/trust/mutation_detector.py`
- **Data Flow**:
  - Mutation detection events trigger trust decay
  - Trust decay engine subscribes to mutation events
  - Mutation severity affects decay factor
- **Implementation Notes**:
  - Must implement event listeners for mutation events
  - Must map mutation types to appropriate decay factors
  - Must log correlation between mutations and decay events

### Evolution Protocol Integration
- **Components**: `TrustRegenerationProtocol` ↔ `EvolutionProtocol`
- **File Dependencies**: 
  - `src/core/trust/trust_regeneration_protocol.py` → `src/core/governance/evolution_protocol.py`
- **Data Flow**:
  - Evolution approvals can trigger trust regeneration
  - Trust regeneration protocol uses evolution history for attestation validation
  - Evolution records include trust impact assessment
- **Implementation Notes**:
  - Must respect evolution protocol governance rules
  - Must track evolution-based attestations
  - Must maintain audit trail of evolution-triggered regeneration

### Codex Lock Integration
- **Components**: `TrustDecayEngine` ↔ `CodexLock`
- **File Dependencies**: 
  - `src/core/trust/trust_decay_engine.py` → `src/core/governance/codex_lock.py`
- **Data Flow**:
  - Codex lock status affects trust decay decisions
  - Trust levels influence lock enforcement
  - Lock violations trigger trust decay events
- **Implementation Notes**:
  - Must respect locked contracts
  - Must implement lock-aware decay logic
  - Must provide trust context for lock decisions

## Integration with Phase 5.7 (Trust Surface Visualization)

### Visualization Data Transformer Integration
- **Components**: `TrustDecayVisualization` ↔ `VisualizationDataTransformer`
- **File Dependencies**: 
  - `src/integration/trust_decay_visualization.py` → `src/core/visualization/visualization_data_transformer.py`
- **Data Flow**:
  - Trust decay metrics are transformed for visualization
  - Visualization components display decay trends
  - Decay alerts are visualized in dashboards
- **Implementation Notes**:
  - Must extend existing visualization components
  - Must maintain visualization format compatibility
  - Must support real-time updates of decay metrics

### Trust Surface Dashboard Integration
- **Components**: `DecayMetricsPanel` ↔ `TrustSurfaceDashboard`
- **File Dependencies**: 
  - `src/ui/trust_surface_dashboard/components/decay_metrics_panel.py` → `src/ui/trust_surface_dashboard/trust_surface_dashboard.py`
- **Data Flow**:
  - Dashboard displays decay metrics
  - Decay trends are shown in trend charts
  - Decay alerts are highlighted in the dashboard
- **Implementation Notes**:
  - Must follow dashboard component architecture
  - Must implement consistent styling and interaction patterns
  - Must support dashboard filtering and drill-down

### Trust Surface Analytics Integration
- **Components**: `TrustMetricsCalculator` ↔ `TrustSurfaceAnalytics`
- **File Dependencies**: 
  - `src/core/trust/trust_metrics_calculator.py` → `src/core/trust/trust_surface_analytics.py`
- **Data Flow**:
  - Trust metrics incorporate decay factors
  - Surface analytics use decay-adjusted trust scores
  - Analytics insights reflect decay patterns
- **Implementation Notes**:
  - Must extend analytics models to include decay
  - Must maintain analytics accuracy with decay factors
  - Must provide decay-aware insights

## Integration with Phase 5.6 (Trust Boundary Definition)

### Trust Boundary Manager Integration
- **Components**: `TrustDecayEngine` ↔ `TrustBoundaryManager`
- **File Dependencies**: 
  - `src/core/trust/trust_decay_engine.py` → `src/core/governance/trust_boundary_manager.py`
- **Data Flow**:
  - Boundary definitions influence context-specific decay rules
  - Boundary crossings trigger context-based decay
  - Trust levels affect boundary enforcement
- **Implementation Notes**:
  - Must implement boundary-aware decay logic
  - Must track boundary crossing events
  - Must support different decay rates per boundary

### Trust Propagation Engine Integration
- **Components**: `TrustRegenerationProtocol` ↔ `TrustPropagationEngine`
- **File Dependencies**: 
  - `src/core/trust/trust_regeneration_protocol.py` → `src/core/governance/trust_propagation_engine.py`
- **Data Flow**:
  - Trust propagation considers decay factors
  - Regeneration events can trigger trust propagation
  - Propagation paths are affected by decay patterns
- **Implementation Notes**:
  - Must implement decay-aware propagation rules
  - Must track propagation of regeneration effects
  - Must maintain consistency in cross-boundary propagation

### Attestation Service Integration
- **Components**: `TrustRegenerationProtocol` ↔ `AttestationService`
- **File Dependencies**: 
  - `src/core/trust/trust_regeneration_protocol.py` → `src/core/governance/attestation_service.py`
- **Data Flow**:
  - Attestations trigger trust regeneration
  - Attestation validity affects regeneration amount
  - Regeneration protocol validates attestation chains
- **Implementation Notes**:
  - Must implement attestation-based regeneration
  - Must verify attestation chain integrity
  - Must track attestation-based regeneration history

## Cross-Cutting Integration Points

### Schema Validation Integration
- **Components**: All Phase 5.9 components ↔ `SchemaValidator`
- **File Dependencies**: 
  - All Phase 5.9 components → `src/core/common/schema_validator.py`
- **Data Flow**:
  - All trust decay schemas are validated
  - All trust regeneration schemas are validated
  - All trust metrics schemas are validated
  - All trust monitoring schemas are validated
- **Implementation Notes**:
  - Must use consistent schema validation approach
  - Must handle validation errors appropriately
  - Must log validation results

### Seal Verification Integration
- **Components**: All Phase 5.9 components ↔ `SealVerificationService`
- **File Dependencies**: 
  - All Phase 5.9 components → `src/core/verification/seal_verification.py`
- **Data Flow**:
  - Trust state changes are verified
  - Configuration changes are verified
  - Decay and regeneration events are verified
- **Implementation Notes**:
  - Must use consistent seal verification approach
  - Must handle verification failures appropriately
  - Must log verification results

### Module Registry Integration
- **Components**: All Phase 5.9 components ↔ `ModuleRegistry`
- **File Dependencies**: 
  - All Phase 5.9 components → `registry/module_registry.json`
- **Data Flow**:
  - Phase 5.9 components are registered
  - Component dependencies are declared
  - Component versions are tracked
- **Implementation Notes**:
  - Must follow registry format conventions
  - Must declare all required dependencies
  - Must include version information

## API Integration Points

### Trust Decay API
- **Endpoints**:
  - `GET /trust/{entity_id}`: Get current trust level
  - `GET /trust/{entity_id}/history`: Get trust history
  - `POST /trust/{entity_id}/decay`: Trigger decay
  - `POST /trust/{entity_id}/regenerate`: Trigger regeneration
  - `GET /alerts`: Get trust alerts
  - `POST /alerts/{alert_id}/resolve`: Resolve alert
  - `GET /config`: Get configuration
  - `PUT /config`: Update configuration
- **Integration Notes**:
  - Must follow API conventions established in previous phases
  - Must implement proper authentication and authorization
  - Must validate all inputs and outputs
  - Must provide comprehensive error handling
  - Must log all API operations

## Data Flow Diagrams

### Trust Decay Flow
```
[MutationDetector] --mutation event--> [TrustDecayEngine] --decay event--> [TrustMetricsCalculator]
                                                                |
                                                                v
[TrustBoundaryManager] --boundary event--> [TrustDecayEngine] --update--> [TrustMonitoringService] --alert--> [Dashboard]
```

### Trust Regeneration Flow
```
[AttestationService] --attestation--> [TrustRegenerationProtocol] --regeneration event--> [TrustMetricsCalculator]
                                                                      |
                                                                      v
[EvolutionProtocol] --evolution approval--> [TrustRegenerationProtocol] --update--> [TrustMonitoringService]
```

### Trust Visualization Flow
```
[TrustMetricsCalculator] --metrics--> [VisualizationDataTransformer] --chart data--> [DecayTrendCharts]
                                                                        |
                                                                        v
[TrustMonitoringService] --alerts--> [VisualizationDataTransformer] --alert data--> [DecayMetricsPanel]
```

## Implementation Sequence

To ensure proper integration, components should be implemented in the following sequence:

1. Core decay and regeneration components
2. Metrics and monitoring components
3. Integration with Phase 5.8 components
4. Integration with Phase 5.6 components
5. Integration with Phase 5.7 visualization
6. API layer implementation
7. UI component extensions

This sequence ensures that dependencies are satisfied and that integration points are properly established before dependent components are implemented.
