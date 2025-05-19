# Codex Lock Update for Phase 5.5

## Codex Contract Reference
- **Contract Version:** v2025.05.18
- **Phase ID:** 5.5
- **Title:** Governance Mesh Integration
- **Description:** Synchronize contract states, policy proposals, and attestation boundaries across Promethios kernels
- **Clauses:** 5.5, 5.4, 11.0, 11.1, 5.2.5

## Repository Structure Lock

As per Codex clause 5.2.5 "Codex Repository Hygiene Freeze", Phase 5.5 shall execute under the current repository structure. Directory normalization is postponed until the reorganization unlock clause is codified.

## Codex Lock Entry

The following entry should be added to the .codex.lock file:

```json
{
  "5.5": {
    "title": "Governance Mesh Integration",
    "description": "Synchronize contract states, policy proposals, and attestation boundaries across Promethios kernels",
    "scope": "multi-node",
    "schemas": [
      "governance_contract_sync.schema.v1.json",
      "governance_proposal.schema.v1.json",
      "governance_mesh_topology.schema.v1.json"
    ],
    "clauses": ["5.5", "5.4", "11.0", "11.1", "5.2.5"],
    "dependencies": ["5.4", "11.0", "11.1"],
    "sealed": false
  }
}
```

## UI Schema Registry Update

The following UI components should be updated in the ui_schema_registry.json file:

```json
{
  "id": "UI-12.21",
  "name": "Codex Contract Dashboard",
  "schema_file": "contract_registry.schema.v1.json",
  "schema_version": "v1",
  "build_ready": true,
  "pending_data": true,
  "contract_clauses": ["5.5", "6.06", "11.3"],
  "depends_on": ["5.5", "6.06", "11.3"]
}
```

```json
{
  "id": "UI-12.33",
  "name": "Schema/Contract Drift Alert",
  "schema_file": "schema_drift.schema.v1.json",
  "schema_version": "v1",
  "build_ready": true,
  "pending_data": true,
  "contract_clauses": ["5.5", "11.0", "5.2.5"],
  "depends_on": ["5.5", "11.0"]
}
```

```json
{
  "id": "UI-12.66",
  "name": "Governance Mesh Visualization",
  "schema_file": "governance_mesh.schema.v1.json",
  "schema_version": "v1",
  "build_ready": false,
  "reason": "Requires Phase 5.5 (Governance Mesh Integration) to be completed",
  "contract_clauses": ["5.5", "11.4"],
  "depends_on": ["5.5", "11.4"]
}
```

## Implementation Notes

1. The Codex lock entry should be added only after the schemas are placed in the appropriate location in the repository.
2. The UI schema registry updates should be applied after the Codex lock entry is added.
3. All components must maintain strict adherence to clause 5.2.5 regarding repository structure.
