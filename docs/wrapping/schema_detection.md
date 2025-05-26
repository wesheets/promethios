# Schema Detection Engine Documentation

## Overview

The Schema Detection Engine is a core component of the Promethios Agent Wrapping System. It automatically analyzes agent code to detect input/output schemas, identify integration points for governance hooks, and assess compatibility with the Promethios governance framework.

## Components

### 1. Schema Analyzer

The Schema Analyzer examines agent code and sample data to detect input and output schemas. It can:

- Extract existing schemas if present in the code
- Analyze code structure to infer schema patterns
- Analyze sample inputs/outputs to infer schema structures
- Detect memory schemas for stateful agents
- Identify potential governance hooks
- Validate schemas against governance requirements

### 2. Integration Points Identifier

The Integration Points Identifier locates specific points in agent code where governance hooks can be inserted. It can:

- Identify execution entry points
- Identify memory access points
- Identify decision points
- Assess confidence in each integration point
- Generate required changes for implementing hooks

### 3. Compatibility Checker

The Compatibility Checker assesses how well an agent aligns with Promethios governance requirements. It can:

- Check for framework-specific compatibility issues
- Validate schema completeness and correctness
- Identify governance-specific compatibility issues
- Generate recommendations for improving compatibility
- Calculate an overall compatibility score

## Usage

The Schema Detection Engine is used as the first step in the agent wrapping process:

1. Agent code is submitted for analysis
2. The Schema Analyzer detects input/output schemas
3. The Integration Points Identifier locates governance hook points
4. The Compatibility Checker assesses overall compatibility
5. Results are passed to the Wrapper Generator for code generation

## Integration with Governance Framework

The Schema Detection Engine ensures that wrapped agents conform to Promethios governance requirements:

- All agents must define and link input_schema and output_schema
- Agents must validate that execute() results conform to output_schema
- Minimal placeholder schemas are created if full contract is unknown
- Schemas are placed in the appropriate directory structure
- Memory-tagged schemas are properly stubbed and documented

## Example

```typescript
// Analyze an agent
const analysisResult = await analyzeAgentSchema(
  agentCode,
  sampleInputs,
  sampleOutputs
);

// Identify integration points
const integrationPoints = identifyIntegrationPoints(
  agentCode,
  analysisResult.detectedFramework,
  {
    inputSchema: analysisResult.inputSchema,
    outputSchema: analysisResult.outputSchema,
    memorySchema: analysisResult.memorySchema
  }
);

// Check compatibility
const compatibilityResult = checkCompatibility(
  agentCode,
  analysisResult.detectedFramework,
  {
    inputSchema: analysisResult.inputSchema,
    outputSchema: analysisResult.outputSchema,
    memorySchema: analysisResult.memorySchema
  }
);

// Pass results to wrapper generator
const wrapperConfig = {
  analysisResult,
  integrationPoints,
  compatibilityResult
};
```
