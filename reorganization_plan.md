# Repository Reorganization Plan

## Overview
This document outlines the plan for reorganizing the Promethios repository to follow canonical structure principles. The goal is to move files from the root directory to their appropriate subdirectories, making the repository more maintainable and easier to navigate.

## File Categorization and Destination

### Source Code Files (to be moved to src/)
- `merkle_tree.py` → `src/core/merkle/`
- `merkle_sealing.py` → `src/core/merkle/`
- `runtime_executor.py` → `src/main/`
- `runtime_executor_integration.py` → `src/integration/`
- `seal_verification.py` → `src/core/verification/`
- `seal_distribution_service.py` → `src/core/verification/`
- `trust_aggregation_service.py` → `src/core/verification/`
- `network_topology_manager.py` → `src/core/verification/`
- `verification_node_manager.py` → `src/core/verification/`
- `trust_log_writer.py` → `src/core/trust/`
- `trust_log_integration.py` → `src/integration/`
- `deterministic_execution.py` → `src/replay/`
- `replay_sealing.py` → `src/replay/`
- `governance_contract_sync.py` → `src/governance/`
- `governance_core.py` → `src/governance/`
- `governance_mesh_integration.py` → `src/governance/`
- `governance_proposal_protocol.py` → `src/governance/`
- `governance_mesh_ui.py` → `src/ui/`
- `saas_connector.py` → `src/utils/`
- `output_capture.py` → `src/utils/`
- `schema_validator.py` → `src/core/common/`
- `main.py` → `src/main/`

### Test Files (to be moved to tests/)
- `test_api.py` → `tests/utils/`
- `test_deterministic_replay.py` → `tests/replay/`
- `test_external_trigger.py` → `tests/integration/`
- `test_phase_5_2.py` → `tests/phase_5_2/integration/`
- `test_schema_validation.py` → `tests/utils/`
- `test_seal_verification.py` → `tests/core/verification/`
- `test_trust_log_writer.py` → `tests/core/trust/`
- `test_data_generator.py` → `tests/utils/`
- `loop_runtime_test_harness.py` → `tests/utils/`

### Documentation Files (to be moved to docs/)
- `phase_5_4_architecture.md` → `docs/architecture/`
- `phase_5_4_implementation_guidance.md` → `docs/implementation/`
- `phase_5_5_architecture.md` → `docs/architecture/`
- `governance_deviation_record.md` → `docs/governance/`
- `hash_embedding_test_report.md` → `docs/reports/`
- `schema_validation_report.md` → `docs/reports/`
- `ui_cleanup_verification_report.md` → `docs/reports/`
- `ui_cleanup_verification_report_final.md` → `docs/reports/`

### Utility Scripts (to be moved to scripts/)
- `validate_schema.py` → `scripts/`
- `validate_schema_compliance.py` → `scripts/`
- `repository_hygiene_validator.py` → `scripts/`
- `package_logs.py` → `scripts/`
- `generate_emotion_trigger_logs.py` → `scripts/`
- `generate_rejected_plan_logs.py` → `scripts/`
- `verify_log_hashes.py` → `scripts/`
- `view_logs.py` → `scripts/`
- `debug_distribute_contract.py` → `scripts/`

### Log Files (to be moved to logs/)
- `server.log` → `logs/`

## Import Path Updates
After moving files, we'll need to update import statements in all affected files to reflect their new locations. This includes:
1. Updating relative imports to absolute imports where appropriate
2. Ensuring all module references use the correct paths
3. Updating any hardcoded file paths to reflect the new structure

## Testing Strategy
After completing the reorganization:
1. Run the full test suite to verify functionality
2. Address any import errors or path issues that arise
3. Ensure all tests pass before proceeding with Phase 5.7 branch creation

## Documentation Updates
- Update README.md to reflect the new structure
- Update any documentation that references file paths
- Update todo.md to include the completed reorganization

## Next Steps After Reorganization
Once the reorganization is complete and all tests pass:
1. Create the phase-5.7-canonical branch
2. Open a pull request with proper title and description
3. Merge the PR and proceed with Phase 5.7 implementation
