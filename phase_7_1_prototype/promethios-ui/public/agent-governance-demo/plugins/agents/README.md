# Agent Plugins

This directory contains the agent plugins for the Promethios Agent Governance Demo.

## Architecture

The agent plugins follow a hierarchical structure:

1. `agentBase.js` - Base class that provides common functionality for all agent types
2. `agentRegistry.js` - Registry that makes AgentBase globally available to resolve module loading issues
3. Specialized agent implementations:
   - `hrSpecialist.js` - HR Specialist agent
   - `projectManager.js` - Project Manager agent
   - `technicalLead.js` - Technical Lead agent

## Module Loading

To prevent "AgentBase is not defined" errors, we use a multi-layered approach:

1. The `agentRegistry.js` module exports AgentBase and makes it globally available
2. Each agent implementation tries to access AgentBase from:
   - Global window.AgentBase
   - Global window.agentRegistry.AgentBase
   - Direct import as fallback

This ensures AgentBase is available regardless of module loading order or bundling configuration.

## Usage

Agent plugins are loaded dynamically in `main.js` and instantiated with appropriate configuration.
