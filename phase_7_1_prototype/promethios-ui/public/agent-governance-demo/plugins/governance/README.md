# Agent Governance Plugins

This directory contains the governance plugins for the Promethios Agent Governance Demo.

## Architecture

The governance plugins follow a hierarchical structure:

1. `governanceBase.js` - Base class that provides common functionality for all governance types
2. `governanceRegistry.js` - Registry that makes GovernanceBase globally available to resolve module loading issues
3. Specialized governance implementations:
   - `roleEnforcement.js` - Ensures agents stay within their defined roles
   - `factualAccuracy.js` - Ensures agents provide accurate information
   - `safetyFilters.js` - Ensures agents provide safe and appropriate responses

## Module Loading

To prevent "GovernanceBase is not defined" errors, we use a multi-layered approach:

1. The `governanceRegistry.js` module exports GovernanceBase and makes it globally available
2. Each governance implementation tries to access GovernanceBase from:
   - Global window.GovernanceBase
   - Global window.governanceRegistry.GovernanceBase
   - Direct import as fallback

This ensures GovernanceBase is available regardless of module loading order or bundling configuration.

## Usage

Governance plugins are loaded dynamically in `main.js` and instantiated with appropriate configuration.
