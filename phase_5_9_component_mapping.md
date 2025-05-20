# Phase 5.9: Trust Decay Engine - Component Mapping

## Overview
This document maps the Phase 5.9 components to the canonical repository structure, ensuring alignment with Promethios standards and proper integration with previous phases.

## Core Components

### Trust Decay Engine
- **Source File**: `src/core/trust/trust_decay_engine.py`
- **Description**: Implements core decay algorithms and manages trust decay across the system
- **Dependencies**: 
  - `src/core/governance/contract_sealer.py` (Phase 5.8)
  - `src/core/common/schema_validator.py`

### Trust Regeneration Protocol
- **Source File**: `src/core/trust/trust_regeneration_protocol.py`
- **Description**: Implements protocols for trust regeneration after decay
- **Dependencies**:
  - `src/core/governance/contract_sealer.py` (Phase 5.8)
  - `src/core/common/schema_validator.py`

### Trust Metrics Calculator
- **Source File**: `src/core/trust/trust_metrics_calculator.py`
- **Description**: Calculates and manages trust metrics across different dimensions
- **Dependencies**:
  - `src/core/common/schema_validator.py`
  - `src/core/trust/trust_surface_analytics.py` (Phase 5.7)

### Trust Monitoring Service
- **Source File**: `src/core/trust/trust_monitoring_service.py`
- **Description**: Monitors trust levels and generates alerts when thresholds are crossed
- **Dependencies**:
  - `src/core/trust/trust_metrics_calculator.py`
  - `src/core/common/schema_validator.py`

## Integration Components

### Trust Decay API
- **Source File**: `src/integration/trust_decay_api.py`
- **Description**: Provides API endpoints for interacting with the Trust Decay Engine
- **Dependencies**:
  - `src/core/trust/trust_decay_engine.py`
  - `src/core/trust/trust_regeneration_protocol.py`
  - `src/core/trust/trust_metrics_calculator.py`
  - `src/core/trust/trust_monitoring_service.py`

### Trust Decay Visualization Integration
- **Source File**: `src/integration/trust_decay_visualization.py`
- **Description**: Integrates trust decay with visualization components from Phase 5.7
- **Dependencies**:
  - `src/core/trust/trust_metrics_calculator.py`
  - `src/core/visualization/visualization_data_transformer.py` (Phase 5.7)

## Schema Definitions

### Trust Decay Schema
- **Source File**: `schemas/trust/trust_decay.schema.v1.json`
- **Description**: Schema for trust decay configuration and events
- **Used By**:
  - `src/core/trust/trust_decay_engine.py`
  - `src/integration/trust_decay_api.py`

### Trust Regeneration Schema
- **Source File**: `schemas/trust/trust_regeneration.schema.v1.json`
- **Description**: Schema for trust regeneration configuration and events
- **Used By**:
  - `src/core/trust/trust_regeneration_protocol.py`
  - `src/integration/trust_decay_api.py`

### Trust Metrics Schema
- **Source File**: `schemas/trust/trust_metrics.schema.v1.json`
- **Description**: Schema for trust metrics configuration and data
- **Used By**:
  - `src/core/trust/trust_metrics_calculator.py`
  - `src/integration/trust_decay_api.py`

### Trust Monitoring Schema
- **Source File**: `schemas/trust/trust_monitoring.schema.v1.json`
- **Description**: Schema for trust monitoring configuration and alerts
- **Used By**:
  - `src/core/trust/trust_monitoring_service.py`
  - `src/integration/trust_decay_api.py`

## Test Components

### Unit Tests
- **Source Files**:
  - `tests/phase_5_9/unit/test_trust_decay_engine.py`
  - `tests/phase_5_9/unit/test_trust_regeneration_protocol.py`
  - `tests/phase_5_9/unit/test_trust_metrics_calculator.py`
  - `tests/phase_5_9/unit/test_trust_monitoring_service.py`
- **Description**: Tests for individual components in isolation

### Integration Tests
- **Source Files**:
  - `tests/phase_5_9/integration/test_trust_decay_api.py`
  - `tests/phase_5_9/integration/test_decay_visualization_integration.py`
  - `tests/phase_5_9/integration/test_decay_boundary_integration.py`
- **Description**: Tests for component interactions and API functionality

### End-to-End Tests
- **Source Files**:
  - `tests/phase_5_9/end_to_end/test_trust_decay_workflow.py`
  - `tests/phase_5_9/end_to_end/test_trust_monitoring_alerts.py`
- **Description**: Tests for complete workflows and system behavior

### Performance Tests
- **Source Files**:
  - `tests/phase_5_9/performance/test_decay_calculation_performance.py`
  - `tests/phase_5_9/performance/test_metrics_aggregation_performance.py`
- **Description**: Tests for performance characteristics and scalability

### Test Fixtures
- **Source Files**:
  - `tests/phase_5_9/fixtures/decay_test_data.py`
  - `tests/phase_5_9/fixtures/regeneration_test_data.py`
  - `tests/phase_5_9/fixtures/metrics_test_data.py`
  - `tests/phase_5_9/fixtures/monitoring_test_data.py`
- **Description**: Test data and fixtures for consistent testing

## UI Components

### Trust Decay Dashboard Extensions
- **Source File**: `src/ui/trust_surface_dashboard/components/decay_metrics_panel.py`
- **Description**: Extends the trust surface dashboard with decay metrics visualization
- **Dependencies**:
  - `src/ui/trust_surface_dashboard/components/metrics_panel.py` (Phase 5.7)
  - `src/integration/trust_decay_visualization.py`

### Trust Decay Trend Charts
- **Source File**: `src/ui/trust_surface_dashboard/components/decay_trend_charts.py`
- **Description**: Provides trend charts for trust decay visualization
- **Dependencies**:
  - `src/ui/trust_surface_dashboard/components/trend_charts.py` (Phase 5.7)
  - `src/integration/trust_decay_visualization.py`

## Documentation

### Implementation Documentation
- **Source File**: `Phase_5_9_Implementation_Documentation.md`
- **Description**: Comprehensive documentation of the Phase 5.9 implementation

### PR Description
- **Source File**: `pr_description.md`
- **Description**: Pull request description for Phase 5.9 implementation

## Module Registry Update

### Registry Entry
- **Source File**: `registry/module_registry.json`
- **Description**: Update to include Phase 5.9 components in the module registry
- **Changes**:
  - Add Trust Decay Engine module
  - Add Trust Regeneration Protocol module
  - Add Trust Metrics Calculator module
  - Add Trust Monitoring Service module
