# CMU Interactive Playground: Known Good State Documentation

## Overview

This document outlines the critical components and configuration of the CMU Interactive Playground in its known good state. This reference should be used to prevent deployment failures and ensure stability when making future changes.

> **IMPORTANT LIMITATION**: The current "known good state" uses **scripted demo agents** rather than fully functional interactive LLM-backed agents. While stable from a deployment perspective, it does not provide true interactive agent functionality.

## Critical Files and Components

### Core Files

| File | Purpose | Critical Notes |
|------|---------|---------------|
| `/phase_7_1_prototype/promethios-ui/public/cmu-playground/main.js` | Main entry point for the playground | Must not import non-existent modules like `runtimeEnvironmentLoader.js` |
| `/phase_7_1_prototype/promethios-ui/server.js` | Express server for serving the application | Required for deployment; must not be removed during merges |
| `/phase_7_1_prototype/promethios-ui/src/pages/CMUPlaygroundPage.tsx` | React component for the playground page | Integrates with the main.js script |
| `/phase_7_1_prototype/promethios-ui/src/pages/CMUPlaygroundPage.css` | Styling for the playground | Contains critical dark theme variables |
| `/phase_7_1_prototype/promethios-ui/src/components/benchmark/CMUBenchmarkDashboard.tsx` | Dashboard component for displaying metrics | Contains hardcoded benchmark data |

### Module Structure

The playground uses a modular architecture with these key modules:

```
/public/cmu-playground/
├── main.js                  # Main entry point
├── modules/
│   ├── agentConversation.js # Handles agent interactions (CURRENTLY SCRIPTED)
│   ├── emotionalUX.js       # Manages emotional UX elements
│   ├── enhancedFeatures.js  # Contains feature enhancements
│   ├── exportModule.js      # Handles report exports
│   ├── metricsManager.js    # Manages metrics display
│   └── scenarioManager.js   # Manages scenario selection and data
```

## Critical Dependencies

### Import Dependencies

The following imports in `main.js` are required and must be maintained:

```javascript
import AgentConversation from './modules/agentConversation.js';
import EmotionalUX from './modules/emotionalUX.js';
import ScenarioManager from './modules/scenarioManager.js';
import MetricsManager from './modules/metricsManager.js';
import ExportModule from './modules/exportModule.js';
import { applyAllEnhancements } from './modules/enhancedFeatures.js';
```

### External Dependencies

The playground relies on these external dependencies:

1. Bootstrap 5.3.0-alpha1 (loaded via CDN)
2. Bootstrap Icons 1.10.0 (loaded via CDN)
3. Chart.js (for metrics visualization)
4. Framer Motion (for animations in the dashboard)

## Architecture Notes

1. **Event-Driven Communication**: The playground uses an EventBus pattern for module communication
2. **React Integration**: The playground is embedded in a React application but loads its own scripts
3. **Static Demo Mode**: The current working version operates in demo mode with scripted agent interactions rather than real LLM integration

## Known Failure Points

1. **Missing Module Imports**: Importing non-existent modules (e.g., `runtimeEnvironmentLoader.js`) causes deployment failure
2. **Server.js Removal**: Removing or significantly modifying server.js breaks the deployment
3. **Module Path Changes**: Changing the relative paths of modules without updating imports
4. **CSS Variable Dependencies**: The dark theme relies on specific CSS variables that must be maintained

## Deployment Process

1. The application is deployed on Render.com
2. Render is configured to deploy from the `main` branch
3. The deployment process builds the React application and serves it using the Express server in server.js

## Testing Before Deployment

Before deploying changes, verify:

1. All imported modules exist in the correct locations
2. The server.js file is present and unmodified
3. No new dependencies are added without being properly included
4. The playground loads correctly in a local development environment

## Recovery Process

If a deployment fails:

1. Use the Render rollback feature to revert to the last known good deployment
2. Compare the current code with the last working commit (PR #121, commit f22beb5)
3. Identify and fix any differences, particularly focusing on imports and server configuration

## Future Enhancement Path

To move from scripted demo agents to fully functional interactive agents:

1. Maintain the current stable deployment structure
2. Implement LLM backend connections while preserving the existing module architecture
3. Replace scripted agent conversations with real LLM-powered interactions
4. Progressively enhance the playground while ensuring deployment stability at each step
