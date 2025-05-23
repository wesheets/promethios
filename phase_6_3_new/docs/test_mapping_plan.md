# Phase 5.2.6.2: Test Validation Layer - Test Mapping Plan

## Directory Structure
```
tests/
├── common/                 # Common test utilities and fixtures
├── phase_5_1/             # Tests for Phase 5.1
│   ├── unit/              # Unit tests for Phase 5.1
│   └── integration/       # Integration tests for Phase 5.1
├── phase_5_2/             # Tests for Phase 5.2
│   ├── unit/              # Unit tests for Phase 5.2
│   └── integration/       # Integration tests for Phase 5.2
├── phase_5_3/             # Tests for Phase 5.3
│   ├── unit/              # Unit tests for Phase 5.3
│   └── integration/       # Integration tests for Phase 5.3
├── phase_5_4/             # Tests for Phase 5.4
│   ├── unit/              # Unit tests for Phase 5.4
│   └── integration/       # Integration tests for Phase 5.4
├── phase_5_5/             # Tests for Phase 5.5
│   ├── unit/              # Unit tests for Phase 5.5
│   └── integration/       # Integration tests for Phase 5.5
└── end_to_end/            # End-to-end tests across phases
```

## Test Mapping

### Phase 5.1 (Core Functionality)
- `tests/test_utils.py` → `tests/phase_5_1/unit/test_utils.py`
- `tests/test_repository_hygiene_validator.py` → `tests/phase_5_1/unit/test_repository_hygiene_validator.py`

### Phase 5.2 (Replay Reproducibility Seal)
- `tests/end_to_end/test_phase_5_2.py` → `tests/phase_5_2/integration/test_phase_5_2.py`
- `tests/end_to_end/test_deterministic_replay.py` → `tests/phase_5_2/integration/test_deterministic_replay.py`
- `tests/end_to_end/test_seal_verification.py` → `tests/phase_5_2/integration/test_seal_verification.py`

### Phase 5.3 (Merkle Sealing of Output + Conflict Metadata)
- `tests/test_merkle_tree.py` → `tests/phase_5_3/unit/test_merkle_tree.py`
- `tests/test_merkle_sealing.py` → `tests/phase_5_3/unit/test_merkle_sealing.py`
- `tests/test_conflict_detection.py` → `tests/phase_5_3/unit/test_conflict_detection.py`
- `tests/test_output_capture.py` → `tests/phase_5_3/unit/test_output_capture.py`
- `tests/test_phase_5_3.py` → `tests/phase_5_3/integration/test_phase_5_3.py`
- `tests/integration/test_phase_5_3.py` → `tests/phase_5_3/integration/test_integration_phase_5_3.py`

### Phase 5.4 (Distributed Verification Network)
- `tests/test_network_topology_manager.py` → `tests/phase_5_4/unit/test_network_topology_manager.py`
- `tests/test_verification_node_manager.py` → `tests/phase_5_4/unit/test_verification_node_manager.py`
- `tests/test_consensus_service.py` → `tests/phase_5_4/unit/test_consensus_service.py`
- `tests/test_seal_distribution_service.py` → `tests/phase_5_4/unit/test_seal_distribution_service.py`
- `tests/test_trust_aggregation_service.py` → `tests/phase_5_4/unit/test_trust_aggregation_service.py`
- `tests/test_distributed_verification_integration.py` → `tests/phase_5_4/integration/test_distributed_verification_integration.py`

### Phase 5.5 (Governance Mesh)
- `tests/test_governance_contract_sync.py` → `tests/phase_5_5/unit/test_governance_contract_sync.py`
- `tests/test_governance_mesh_integration.py` → `tests/phase_5_5/unit/test_governance_mesh_integration.py`
- `tests/test_governance_proposal_protocol.py` → `tests/phase_5_5/unit/test_governance_proposal_protocol.py`
- `tests/test_mesh_topology_manager.py` → `tests/phase_5_5/unit/test_mesh_topology_manager.py`
- `tests/test_trust_log_integration.py` → `tests/phase_5_5/integration/test_trust_log_integration.py`

### End-to-End Tests (Cross-Phase)
- `tests/end_to_end/test_api.py` → `tests/end_to_end/test_api.py` (remains in place)
- `tests/end_to_end/test_external_trigger.py` → `tests/end_to_end/test_external_trigger.py` (remains in place)

## Test Registry Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Test Registry Schema",
  "description": "Schema for the test registry that maps tests to phases and dependencies",
  "type": "object",
  "properties": {
    "registry_version": {
      "type": "string",
      "description": "Version of the test registry schema"
    },
    "last_updated": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp of the last update to the registry"
    },
    "phases": {
      "type": "object",
      "description": "Map of phase IDs to their test configurations",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "phase_id": {
            "type": "string",
            "description": "Identifier for the phase"
          },
          "description": {
            "type": "string",
            "description": "Description of the phase"
          },
          "tests": {
            "type": "array",
            "description": "List of tests for this phase",
            "items": {
              "type": "object",
              "properties": {
                "test_id": {
                  "type": "string",
                  "description": "Unique identifier for the test"
                },
                "path": {
                  "type": "string",
                  "description": "Path to the test file relative to the repository root"
                },
                "type": {
                  "type": "string",
                  "enum": ["unit", "integration", "end_to_end"],
                  "description": "Type of test"
                },
                "dependencies": {
                  "type": "array",
                  "description": "List of test IDs that this test depends on",
                  "items": {
                    "type": "string"
                  }
                },
                "required_modules": {
                  "type": "array",
                  "description": "List of module IDs that this test requires",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "required": ["test_id", "path", "type"]
            }
          }
        },
        "required": ["phase_id", "description", "tests"]
      }
    }
  },
  "required": ["registry_version", "last_updated", "phases"]
}
```
