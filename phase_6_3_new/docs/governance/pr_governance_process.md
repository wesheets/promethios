# Pull Request Governance Process

## Overview

This document outlines the required process for all future Promethios phases (Phase 5.6 and beyond) to ensure proper governance, code quality, and compliance with the Codex Contract. All contributors must follow this process without exception.

## Process Requirements

### 1. Branch Creation

- Create a feature branch named after the phase (e.g., `phase-5.6`, `phase-6.1`)
- Branch must be created from the latest version of the `main` branch
- Branch name must follow the format: `phase-X.Y` where X.Y is the phase number

```bash
git checkout main
git pull
git checkout -b phase-5.6
```

### 2. Implementation

- All implementation work must be done in the feature branch
- Commit messages must reference the Codex Contract and relevant clauses
- Regular commits with descriptive messages are encouraged
- Implementation must include:
  - All required code files
  - Updated schema files
  - Comprehensive tests
  - Documentation
  - UI schema registry updates (if applicable)
  - Codex lock file updates

### 3. Testing and Validation

- All tests must pass before creating a pull request
- Schema validation must be performed and documented
- Codex compliance must be verified
- UI components must be tested if applicable

### 4. Pull Request Creation

- Create a PR with a detailed description that includes:
  - Phase number and title
  - Codex Contract version reference
  - List of implemented components
  - Schema changes
  - UI schema registry updates (if applicable)
  - Testing methodology and results
  - Documentation overview
  - Codex compliance statement

```markdown
# Phase X.Y: [Phase Title]

## Overview

This PR implements Phase X.Y of the Promethios project.

**Codex Contract:** [version]
**Phase ID:** X.Y
**Clauses:** [list of clauses]

## Components Implemented

[List of components]

## Schema Changes

[Description of schema changes]

## Testing

[Testing methodology and results]

## Documentation

[Documentation overview]

## Codex Compliance

[Compliance statement]
```

### 5. Review Process

- At least one reviewer must approve the PR
- All review comments must be addressed
- Status checks must pass, including:
  - CI/CD pipeline
  - Test suite
  - Schema validation
  - Codex compliance checks

### 6. Merging

- PR can only be merged after:
  - Required reviews are approved
  - All status checks pass
  - No merge conflicts exist
- Squash and merge is the preferred merge strategy to maintain a clean history
- The PR description should be used as the squash commit message

### 7. Post-Merge

- The feature branch should be deleted after successful merge
- Deployment should follow the established release process
- Any issues discovered post-merge should be addressed in a new PR

## Branch Protection Rules

The `main` branch is protected with the following rules:

1. Pull request reviews required before merging
2. Status checks must pass before merging
3. No direct pushes to main
4. Branch must be up to date before merging

## Governance Enforcement

Compliance with this process is enforced through:

1. Technical controls (branch protection rules)
2. Process documentation (this document)
3. Governance reviews
4. Automated compliance checks

## Exceptions

Exceptions to this process require:

1. Formal written approval from the Project Governance Officer
2. Documentation in a governance deviation record
3. Implementation of compensating controls

## References

- Codex Contract: v2025.05.18
- Governance Deviation Record for Phase 5.5
- Promethios Repository Structure Guidelines

---

This document is effective immediately for all future phases (Phase 5.6 and beyond) and may only be modified through the same PR process described herein.
