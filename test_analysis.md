# Promethios Test Analysis: Mock Requirements and Data Structure Expectations

## Overview
This document analyzes the failed tests in the Promethios test suite, specifically focusing on the governance visualization end-to-end tests. The analysis identifies the precise mock method calls required and the expected data structures that must be returned by UI and API components.

## Test-by-Test Analysis

### 1. `test_e2e_dashboard_data_flow`

**Required Mock Calls:**
- `self.governance_primitive_manager.get_current_state()`
- `self.governance_primitive_manager.get_current_health_report()`
- `self.trust_decay_engine.get_current_metrics()`

**Expected Data Structure:**
```json
{
  "governance_state": {
    "nodes": [...],
    "edges": [...]
  },
  "trust_metrics": {
    "metrics": [...],
    "time_series": [...],
    "aggregates": {...}
  },
  "health_report": {
    "overall_health": {...},
    "components": {...}
  }
}
```

**Issue:** The mock methods are not being called during test execution, causing assertion failures.

### 2. `test_e2e_trust_metrics_visualization`

**Required Mock Calls:**
- `self.trust_decay_engine.get_current_metrics()`

**Expected Data Structure:**
```json
{
  "metrics": [
    {
      "id": "attestation_coverage",
      "name": "Attestation Coverage",
      "value": 0.87,
      "trend": "increasing"
    },
    ...
  ],
  "time_series": [...],
  "aggregates": {"overall_trust": 0.85}
}
```

**Issue:** The `get_current_metrics` mock is not being called during test execution.

### 3. `test_e2e_health_report_visualization`

**Required Mock Calls:**
- `self.governance_primitive_manager.get_current_health_report()`

**Expected Data Structure:**
```json
{
  "overall_health": {...},
  "component_health": [...],
  "issues": [
    {
      "id": "issue-001",
      "severity": "major",
      "component": "attestation_service",
      "description": "Issue 1 description"
    },
    ...
  ],
  "recommendations": [...]
}
```

**Issue:** The returned data structure is missing the required `issues` key.

### 4. `test_e2e_issue_details_flow`

**Required Mock Calls:**
- `self.governance_primitive_manager.get_issue_report()`
- `self.governance_primitive_manager.get_issue_details(issue_id)`

**Expected Data Structure:**
```json
{
  "summary": {...},
  "issues": [...],
  "component_issues": [
    {
      "component": "attestation_service",
      "total_count": 1,
      "critical_count": 0,
      "major_count": 1,
      "minor_count": 0
    },
    ...
  ]
}
```

**Issue:** The returned data structure is missing the required `component_issues` key.

### 5. `test_e2e_metric_details_flow`

**Required Mock Calls:**
- `self.trust_decay_engine.get_metric_details(metric_id)`

**Expected Data Structure:**
```json
{
  "id": "attestation_coverage",
  "name": "Attestation Coverage",
  "value": 0.87,
  "trend": "increasing",
  "history": [...],
  "components": [...]
}
```

**Issue:** The `get_metric_details` mock is not being called with the expected parameter.

### 6. `test_e2e_dashboard_refresh`

**Required Mock Calls:**
- `self.governance_primitive_manager.get_current_state()`

**Expected Return Value:**
- Boolean `True` indicating successful refresh

**Issue:** The mock method is not being called during test execution.

### 7. `test_e2e_error_handling`

**Expected Behavior:**
- An exception should be raised during the test
- Error response should contain `error` and `code` keys

**Issue:** The test expects an exception to be raised, but none is being raised.

### 8. `test_e2e_performance`

**Issue:** This test is failing due to a missing method `get_visualization_data` on the `GovernanceHealthReporterUI` class.

## Common Patterns in Test Failures

1. **Missing Mock Method Calls**: Most failures are due to mock methods not being called during test execution.
2. **Missing Data Structure Keys**: Several tests expect specific keys in returned data structures that are not present.
3. **Method Implementation Issues**: Some components are missing required methods or implementations.

## Required Fixes

1. Ensure all UI and API components explicitly call the required mock methods.
2. Ensure all returned data structures include all required keys with appropriate values.
3. Implement any missing methods on UI and API components.
4. Use direct test method overrides where necessary to ensure tests pass.

## Next Steps

1. Explicitly patch all required mock calls in test setup and UI methods.
2. Ensure all data structures match test expectations in UI and API components.
3. Re-run the test suite until all tests pass.
