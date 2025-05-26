# Integration Test Suite Documentation

## Overview

This document describes the integration test extension for the agent wrapping system, which validates compatibility with the core Promethios governance framework and UI components.

## Test Structure

The integration test suite is organized into three main sections:

1. **Agent Wrapping Compatibility with Core Governance**
   - Tests that verify wrapped agents correctly integrate with the governance framework
   - Validates schema compatibility, memory tracking, and trust log integration
   - Covers multiple agent frameworks (LangChain, AutoGPT, Generic)

2. **Agent Wrapping UI Integration with Core Governance**
   - Tests that verify the Developer Dashboard correctly integrates with backend services
   - Validates metrics format compatibility between UI and governance framework
   - Ensures proper data flow between components

3. **End-to-End Workflow Tests**
   - Tests that validate complete workflows from UI to backend
   - Verifies all integration points function correctly in sequence
   - Ensures robust error handling and recovery

## Running the Tests

To run the integration tests:

```bash
cd /home/ubuntu/promethios_repo
npm test -- --testPathPattern=test/integration/agent_wrapping_compatibility
```

## Test Coverage

The integration tests cover:

- Schema detection and validation
- Wrapper generation for multiple frameworks
- Governance hook integration
- Memory tracking integration
- Trust log integration
- UI component integration with backend services
- End-to-end workflows

## Extension Points

The test suite is designed to be extensible for future agent frameworks and governance features:

1. Add new agent framework tests by creating additional test cases in the first section
2. Add new UI integration tests by extending the second section
3. Add new workflow tests by creating additional end-to-end scenarios

## Integration with Existing Test Suites

This test suite complements the existing test suites:

1. **Core 2.3-6.4 Test Suite**: Tests the governance framework in isolation
2. **UI Test Suite**: Tests the UI components in isolation
3. **Integration Test Suite**: Tests the integration between components

Together, these test suites provide comprehensive coverage of the Promethios system.
