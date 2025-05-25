# Phase 6.4 Migration Guide

## Overview

This guide provides instructions for developers working with the Phase 6.4 implementation, which focuses on UI Cohesion and Preference Insights. The implementation includes the Preference Analyzer, Governance Vocabulary components, and a canonical directory structure.

## Directory Structure Changes

The Phase 6.4 implementation establishes a canonical directory structure with the following key components:

- `/registry/module_registry.json`: Central registry mapping all modules to their purpose, phase, and dependencies
- `/src/preference/`: Contains all preference-related modules
- `/src/ui/governance_vocabulary.py`: Contains the Governance Vocabulary implementation
- `/src/compatibility/`: Contains compatibility layers for backward compatibility

## Import Statement Updates

### Old Import Paths (Deprecated)

```python
# These import paths are now deprecated
import preference_analyzer
import governance_vocabulary
```

### New Canonical Import Paths

```python
# Use these canonical import paths instead
from src.preference.preference_analyzer import PreferenceAnalyzer
from src.ui.governance_vocabulary import GovernanceVocabulary, VocabularyManager
```

## Compatibility Layer

A compatibility layer has been implemented to ensure backward compatibility with existing code. This layer will emit deprecation warnings but allow old import statements to continue working.

The compatibility layer will be maintained for the next two release cycles, after which it will be removed. All code should be updated to use the canonical import paths before that time.

## New Components

### Preference Analyzer

The Preference Analyzer component provides functionality for analyzing user preferences and generating insights. Key features include:

- Collection of explicit and implicit preferences
- Analysis of preference patterns
- Generation of preference profiles
- Integration with the Trust Propagation System

### Governance Vocabulary

The Governance Vocabulary component manages terminology and definitions related to governance. Key features include:

- Term management (add, update, delete)
- Category-based organization
- Search functionality with relevance calculation
- Rendering for both Terminal and Cockpit UIs

## Integration with Phase 6.3.1 Components

The Phase 6.4 components integrate with the following Phase 6.3.1 components:

- **Trust Propagation System**: The Preference Analyzer uses trust scores when analyzing preferences
- **Memory Logging System**: Preference data is logged using the Memory Logging System
- **Governance Lifecycle Framework**: The Governance Vocabulary connects with the Governance Lifecycle Framework

## Known Issues and Workarounds

Currently, there are no known issues with the Phase 6.4 implementation. If you encounter any issues, please report them using the Phase 6.4 Migration Feedback issue template.

## Feedback and Support

If you encounter any issues or have feedback about the Phase 6.4 implementation, please:

1. Create an issue using the Phase 6.4 Migration Feedback template
2. Join the #phase-6-4-integration Slack channel for real-time support
3. Attend the daily integration check-in meetings (10:00 AM EST)

## Next Steps

The next phase of development will be Phase 6.5: UI/UX Repository Restructuring, which will build upon the canonical directory structure established in Phase 6.4.
