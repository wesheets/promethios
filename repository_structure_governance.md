# Repository Structure Governance Plan

This document outlines the repository structure governance for the Promethios project, based on the Codex Contract Tethering Protocol.

## Repository Structure

The Promethios repository follows a structured organization to ensure maintainability, governance compliance, and clear separation of concerns:

```
/promethios_fresh/
├── src/
│   ├── core/           # Core kernel functionality
│   ├── governance/     # Governance-related functionality
│   ├── verification/   # Verification-related functionality
│   └── ui/             # UI-related functionality
├── schemas/
│   ├── core/           # Core schemas
│   ├── governance/     # Governance-related schemas
│   ├── verification/   # Verification-related schemas
│   └── ui/             # UI-related schemas
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── end_to_end/     # End-to-end tests
├── docs/
│   ├── phases/         # Phase documentation
│   ├── architecture/   # Architectural documentation
│   ├── schemas/        # Schema documentation
│   └── api/            # API documentation
├── ui/                 # UI components
├── registry/           # Module registry and dependency maps
├── migrations/         # Migration scripts and logs
└── scripts/            # Utility scripts
```

## File Naming Conventions

- **Python modules**: Snake case (e.g., `trust_boundary_manager.py`)
- **Schema files**: Snake case with version (e.g., `trust_boundary.schema.v1.json`)
- **Test files**: Prefixed with `test_` (e.g., `test_trust_boundary_manager.py`)
- **Documentation files**: Markdown format (e.g., `Phase_5_6_Implementation_Documentation.md`)

## Module Header Requirements

All Python modules must include the following header:

```python
"""
Module description

Codex Contract: v2025.05.18
Phase: 5.6
Clauses: 5.6, 5.5, 5.4, 11.0, 11.1, 5.2.6
"""
```

## Validation Mechanisms

- **Pre-commit hooks**: Structure validation, header validation, registry validation
- **CI checks**: Structure validation, header validation, registry validation, dependency validation, schema validation
- **Code reviews**: Include structure compliance as a review criterion

## Module Registry

All modules must be registered in the module registry (`registry/module_registry.json`) with:
- Path
- Codex contract version
- Phase
- Schemas
- Dependencies
- Purpose

## Branch Protection

The `main` branch is protected with the following rules:
1. Pull request reviews required before merging
2. Status checks must pass before merging
3. No direct pushes to main
4. Branch must be up to date before merging

## Implementation Process

All development must follow the PR governance process outlined in `pr_governance_process.md`, including:
1. Feature branch creation
2. Implementation in the feature branch
3. Testing and validation
4. PR creation with detailed description
5. Review process
6. Merging only after approval
7. Post-merge cleanup

## Exceptions

Exceptions to this governance plan require formal written approval and documentation in a governance deviation record.
