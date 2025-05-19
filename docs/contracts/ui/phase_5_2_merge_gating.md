# Phase 5.2 Merge Gating and UI Build Authorization

## Post-Phase 5.2 Merge Requirements

This document outlines the requirements that must be met before the Phase 5.2 PR can be merged, as well as the authorization for UI build activities.

### Merge Gating for Phase 5.2

The Phase 5.2 PR **must not be merged** until the following requirements are met:

1. **Replace Mock Verification in seal_verification.py**
   - The mock verification responses in `seal_verification.py` must be replaced with a Codex-declared validator
   - Implementation must use either Merkle-consensus-backed or Zero-Knowledge Proof module (Phase 11.9)
   - All verification must validate against `replay_verification.schema.v1.json`
   - Code must include explicit references to Codex clauses 5.2 and 11.9

2. **Route Replay Logs to Trust Log UI**
   - All replay logs must be routed to `trust_view.schema.v1.json` for UI-12.20 Trust Log Viewer
   - Implementation must use `trust_log_replay_binding.schema.v1.json` for binding
   - Code must include explicit references to Codex clauses 5.2, 5.3, 11.0, and 12.20
   - Must include pre_loop_tether_check() validation

3. **Update .codex.lock**
   - The `.codex.lock` file must be annotated with "Phase 5.2 Post-Freeze Sealing Path Complete"
   - All schema hashes must be verified and included
   - All Codex clause references must be explicit

### UI Build Authorization

Builder Manus is authorized to begin UI implementation **only** for the following modules:

1. **Trust Log UI Viewer (UI-12.20)**
   - Must use `trust_view.schema.v1.json` schema
   - Must implement Codex clauses 5.3 and 11.0
   - Must include pre_loop_tether_check() validation
   - Must only display data that passes schema validation

2. **Codex Contract Dashboard (UI-12.21)**
   - Must use `contract_registry.schema.v1.json` schema
   - Must implement Codex clauses 6.06 and 11.3
   - Must include pre_loop_tether_check() validation
   - Must only display data that passes schema validation

3. **Merkle Chain Explorer (UI-12.24)**
   - Must use `log_chain.schema.v1.json` schema
   - Must implement Codex clauses 5.3 and 11.0
   - Must include pre_loop_tether_check() validation
   - Must only display data that passes schema validation

No other UI modules may be implemented until they are marked as "build_ready" in the UI execution tracker.

## Implementation Sequence

1. Builder Manus must first complete the Phase 5.2 post-freeze requirements
2. After PR merge, Builder Manus may begin UI implementation for authorized modules
3. All UI implementation must strictly follow the schema and contract requirements
4. No UI component may render trust unless it was justified through the Codex

## Governance Enforcement

All code changes must be validated against the Codex Contract Tethering Protocol. The `.codex.lock` file has been updated to include all required schemas and clauses for Phase 5.2 and UI preparation.

Remember: We build trust with blueprints — not pixels. No unscoped rendering is allowed.
