# Phase 7.0 Developer Documentation

## Overview

Phase 7.0 of Promethios introduces the Developer-Centric Agent Wrapping & Governance Visualization system, which enables developers to easily wrap their existing AI agents with Promethios governance. This documentation covers the architecture, components, and usage of the system.

## Architecture

The Phase 7.0 implementation consists of three main components:

1. **Schema Detection Engine**: Analyzes agent code to detect input/output schemas, identify integration points, and assess compatibility with Promethios governance.

2. **Wrapper Generator Framework**: Generates wrapper code for different agent frameworks, adapting them to work with Promethios governance.

3. **Developer Dashboard UI**: Provides a user-friendly interface for developers to wrap agents, monitor governance metrics, and configure governance parameters.

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Developer Dashboard UI                       │
│                                                                 │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────┐  │
│  │ Agent Wrapping │   │    Metrics    │   │   Configuration   │  │
│  │    Workflow    │   │   Dashboard   │   │       Panel       │  │
│  └───────┬───────┘   └───────┬───────┘   └─────────┬─────────┘  │
└─────────────────────────────────────────────────────────────────┘
             │                   │                     │
             ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Integration Layer                           │
└─────────────────────────────────────────────────────────────────┘
             │                   │                     │
             ▼                   ▼                     ▼
┌─────────────────┐   ┌───────────────────┐   ┌─────────────────┐
│ Schema Detection │   │ Wrapper Generator │   │   Governance    │
│      Engine      │   │     Framework     │   │      API        │
└─────────────────┘   └───────────────────┘   └─────────────────┘
```

## Components

### Schema Detection Engine

The Schema Detection Engine analyzes agent code to extract or infer input/output schemas, identify potential integration points for governance hooks, and assess compatibility with Promethios governance.

**Key Features:**
- Automatic schema detection for various agent frameworks
- Integration point identification for governance hooks
- Compatibility assessment with detailed recommendations
- Support for multiple agent frameworks (LangChain, AutoGPT, etc.)

**Directory Structure:**
```
/src/wrapping/detection/
  ├── schema_analyzer.ts    # Core schema analysis functionality
  ├── integration_points.ts # Identifies governance hook points
  ├── compatibility.ts      # Assesses agent compatibility
  └── index.ts              # Exports all detection components
```

### Wrapper Generator Framework

The Wrapper Generator Framework creates wrapper code that integrates agents with Promethios governance, based on the results from the Schema Detection Engine.

**Key Features:**
- Framework-specific wrapper templates
- Adaptation layers for different agent frameworks
- Code generation with customizable options
- Support for multiple output formats and configurations

**Directory Structure:**
```
/src/wrapping/generator/
  ├── wrapper_templates.ts  # Templates for different frameworks
  ├── adaptation_layer.ts   # Adapts agents to governance
  ├── code_generator.ts     # Generates wrapper code
  └── index.ts              # Exports all generator components
```

### Developer Dashboard UI

The Developer Dashboard UI provides a user-friendly interface for developers to wrap their agents, monitor governance metrics, and configure governance parameters.

**Key Features:**
- Step-by-step agent wrapping workflow
- Real-time governance metrics visualization
- Configuration panel for governance parameters
- Integration with backend services

**Directory Structure:**
```
/ui/dashboard/
  ├── DeveloperDashboard.tsx  # Main dashboard component
  ├── DashboardContext.tsx    # State management context
  ├── integration.ts          # Backend integration layer
  ├── index.ts                # Exports all dashboard components
  └── __tests__/              # Integration and unit tests
```

## Developer Onboarding Process

### Prerequisites

Before using the Promethios Agent Wrapping system, ensure you have:

1. An existing AI agent implemented in a supported framework (LangChain, AutoGPT, or custom JavaScript/TypeScript)
2. Basic understanding of your agent's input/output structure
3. Access to the Promethios Developer Dashboard

### Step 1: Prepare Your Agent Code

Ensure your agent code follows these best practices for optimal wrapping:

- Define clear input and output structures
- Use consistent patterns for agent execution
- Document memory usage and decision points
- Avoid dynamic code execution (eval, new Function)

### Step 2: Access the Developer Dashboard

1. Navigate to the Promethios Developer Dashboard
2. Log in with your developer credentials
3. Select the "Agent Wrapping" tab

### Step 3: Upload Your Agent Code

1. Enter your agent's name
2. Paste your agent code or upload a file
3. Click "Next" to analyze your agent

### Step 4: Review Analysis Results

1. Review the detected framework and compatibility score
2. Examine the identified governance hooks
3. Verify the input and output schemas
4. Adjust configuration options if needed
5. Click "Next" to generate the wrapper

### Step 5: Generate and Review Wrapper Code

1. Review the generated wrapper code
2. Examine each generated file
3. Make any necessary adjustments
4. Download the wrapper code
5. Click "Next" to proceed to testing

### Step 6: Test and Deploy

1. Test your wrapped agent with sample inputs
2. Review the test results and governance metrics
3. Deploy your wrapped agent to your desired environment
4. Monitor governance metrics in the dashboard

## Integration Guide

### Integrating with LangChain Agents

```typescript
import { LLMChain } from 'langchain';
import { PromethiosLangChainWrapper } from './wrapper';

// Create your LangChain agent or chain
const chain = new LLMChain({
  llm,
  prompt,
  // ...other options
});

// Wrap it with Promethios governance
const wrappedChain = new PromethiosLangChainWrapper(chain, {
  trackMemory: true,
  trackDecisions: true,
  strictValidation: false
});

// Use the wrapped chain
const result = await wrappedChain.execute({
  input: "User query",
  options: {
    temperature: 0.7
  }
});
```

### Integrating with AutoGPT Agents

```typescript
import { Agent } from 'autogpt';
import { PromethiosAutoGPTWrapper } from './wrapper';

// Create your AutoGPT agent
const agent = new Agent({
  goals: ["Research quantum computing"],
  // ...other options
});

// Wrap it with Promethios governance
const wrappedAgent = new PromethiosAutoGPTWrapper(agent, {
  trackMemory: true,
  trackGoals: true,
  strictValidation: false
});

// Use the wrapped agent
const result = await wrappedAgent.execute({
  goals: ["Research quantum computing"],
  constraints: ["Use reliable sources only"]
});
```

### Integrating with Custom Agents

```typescript
import { PromethiosGenericWrapper } from './wrapper';

// Your existing agent
const agent = {
  execute: async (input) => {
    // Agent logic
    return { result: "Agent response" };
  }
};

// Wrap it with Promethios governance
const wrappedAgent = new PromethiosGenericWrapper(agent, {
  trackMemory: false,
  strictValidation: false
});

// Use the wrapped agent
const result = await wrappedAgent.execute({
  query: "User query"
});
```

## Monitoring and Metrics

The Metrics Dashboard provides real-time visibility into your agents' governance performance:

- **Trust Score**: Overall measure of agent trustworthiness
- **Compliance Rate**: Percentage of governance rules followed
- **Agents Wrapped**: Total number of agents wrapped with Promethios
- **Governance Violations**: List of detected governance issues
- **Performance Metrics**: Time-series data on agent performance

## Configuration Options

The Configuration Panel allows you to customize governance parameters:

- **Trust Threshold**: Minimum trust score required for operation
- **Validation Strictness**: How strictly to validate inputs and outputs
- **Memory Tracking**: Whether to track agent memory operations
- **Notification Settings**: How to receive alerts about governance violations
- **Default Templates**: Customize wrapper templates for different frameworks

## Extension Points

Phase 7.0 provides several extension points for future development:

1. **Custom Wrapper Templates**: Create new templates for additional agent frameworks
2. **Custom Adaptation Strategies**: Develop adaptation strategies for specialized agents
3. **Custom Governance Hooks**: Implement additional governance hook types
4. **Custom Metrics Visualizations**: Create specialized visualizations for specific domains

## Troubleshooting

### Common Issues

1. **Schema Detection Failures**
   - Ensure your agent has clear input/output patterns
   - Add explicit schema definitions if detection fails
   - Check for unusual code patterns that might confuse detection

2. **Wrapper Generation Errors**
   - Verify that your agent follows framework conventions
   - Check for unsupported features or dependencies
   - Try a different wrapper template if needed

3. **Integration Issues**
   - Ensure your agent's execution flow matches expectations
   - Check for compatibility issues with your framework version
   - Verify that all required dependencies are installed

### Getting Help

If you encounter issues not covered in this documentation:

1. Check the Promethios knowledge base for similar issues
2. Review the troubleshooting guide for your specific agent framework
3. Contact Promethios support with details about your agent and the issue

## Next Steps

After successfully wrapping your agent with Promethios governance:

1. **Monitor Performance**: Use the Metrics Dashboard to track governance metrics
2. **Fine-tune Governance**: Adjust parameters to optimize for your use case
3. **Wrap More Agents**: Apply Promethios governance to your entire agent ecosystem
4. **Explore Advanced Features**: Investigate domain-specific governance profiles
