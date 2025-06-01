/**
 * VERITAS Module Documentation
 * 
 * This document provides comprehensive documentation for the VERITAS
 * (Verification, Evidence Retrieval, and Information Truth Assessment System) module.
 * 
 * VERITAS is designed to detect and prevent hallucinations in AI agent responses
 * by verifying claims against evidence and providing confidence scores.
 */

# VERITAS Module Documentation

## Overview

VERITAS (Verification, Evidence Retrieval, and Information Truth Assessment System) is a verification module for Promethios that detects and prevents hallucinations in AI agent responses. It extracts claims from text, retrieves evidence, validates claims against evidence, and provides confidence scores.

## Architecture

VERITAS follows the established Promethios extension patterns and integrates with the existing architecture through well-defined integration points:

```
/src/veritas/
├── core/               # Core verification engine
├── services/           # Service layer and integrations
├── hooks/              # React hooks for UI
├── components/         # UI components
├── utils/              # Utility functions
├── types.ts            # Type definitions
└── constants.ts        # Constants and configuration
```

## Core Components

### Claim Extraction

The claim extraction module (`claimExtractor.ts`) is responsible for extracting verifiable claims from text. It implements:

- Sentence splitting and normalization
- Key phrase extraction
- Factual statement identification
- Claim ranking by importance

### Evidence Retrieval

The evidence retrieval module (`evidenceRetriever.ts`) is responsible for retrieving evidence for claims from various sources. It implements:

- Multi-source evidence retrieval
- Evidence deduplication
- Evidence sentiment analysis (supporting/contradicting)

### Claim Validation

The claim validation module (`claimValidator.ts`) is responsible for validating claims against evidence. It implements:

- Evidence relevance filtering
- Claim verification logic
- Hallucination detection
- Confidence and accuracy scoring

### Confidence Scoring

The confidence scoring module (`confidenceScorer.ts`) is responsible for calculating confidence scores for claim validations. It implements:

- Confidence calculation based on evidence quality and quantity
- Source quality adjustment
- Trust impact calculation

## Service Layer

### VERITAS Service

The VERITAS service (`veritasService.ts`) provides a clean API for verification functionality:

- `verifyText(text, options)`: Verify text for hallucinations and factual accuracy
- `checkForFictionalCases(text)`: Check if text contains fictional legal cases
- `compareTexts(text1, text2, options)`: Compare two texts and find common claims
- `getVerificationMetrics(result)`: Get verification metrics from a result

### Integration Points

VERITAS integrates with Promethios through several integration points:

- **Observer Integration** (`observerIntegration.ts`): Extends the observer service with verification methods
- **Metric Calculator Integration** (`metricCalculatorIntegration.ts`): Enhances metric calculation with verification results
- **Agent Wrapping Integration** (`agentWrappingIntegration.ts`): Intercepts agent responses for verification
- **CMU Playground Integration** (`cmuPlaygroundIntegration.ts`): Integrates with the CMU Benchmark Interactive Playground

## UI Components

VERITAS provides several UI components for displaying verification results:

- **VeritasPanel**: Main verification panel that displays overall scores, claims, and evidence sources
- **ClaimCard**: Displays a single claim validation with evidence
- **ConfidenceBadge**: Visualizes confidence and accuracy scores
- **SourceList**: Displays evidence sources with reliability scores
- **HallucinationWarning**: Shows warnings for detected hallucinations

## React Hooks

VERITAS provides React hooks for using verification in UI components:

- **useVeritas**: Hook for verifying text and managing verification state
- **useClaimValidation**: Hook for validating individual claims

## Usage Examples

### Verifying Text

```typescript
import veritasService from '../veritas/services/veritasService';

// Verify text
const result = await veritasService.verifyText('According to the Turner v. Cognivault case, AI agents are legally responsible for their actions.');

// Check for hallucinations
const hallucinations = result.claims.filter(claim => claim.isHallucination);

if (hallucinations.length > 0) {
  console.log('Hallucinations detected:', hallucinations.map(h => h.claim.text));
}
```

### Using the VeritasPanel Component

```tsx
import React from 'react';
import VeritasPanel from '../veritas/components/VeritasPanel';

const VerificationExample: React.FC = () => {
  const text = 'According to the Turner v. Cognivault case, AI agents are legally responsible for their actions.';
  
  return (
    <div>
      <h2>Verification Example</h2>
      <p>{text}</p>
      <VeritasPanel text={text} mode="balanced" />
    </div>
  );
};
```

### Using the useVeritas Hook

```tsx
import React from 'react';
import { useVeritas } from '../veritas/hooks/useVeritas';

const VerificationHookExample: React.FC = () => {
  const text = 'According to the Turner v. Cognivault case, AI agents are legally responsible for their actions.';
  const { results, claims, isVerifying, error } = useVeritas(text);
  
  return (
    <div>
      <h2>Verification Hook Example</h2>
      <p>{text}</p>
      
      {isVerifying && <p>Verifying...</p>}
      
      {error && <p>Error: {error.message}</p>}
      
      {results && (
        <div>
          <h3>Verification Results</h3>
          <p>Accuracy: {Math.round(results.overallScore.accuracy * 100)}%</p>
          <p>Confidence: {Math.round(results.overallScore.confidence * 100)}%</p>
          
          <h4>Claims</h4>
          <ul>
            {claims.map((claim, index) => (
              <li key={index}>
                {claim.claim.text}
                {claim.isHallucination && <span> (Hallucination)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

## Configuration Options

VERITAS can be configured with several options:

- **mode**: Verification mode that determines strictness level ('strict', 'balanced', or 'lenient')
- **maxClaims**: Maximum number of claims to extract and verify
- **confidenceThreshold**: Confidence threshold for determining hallucinations
- **retrievalDepth**: Depth of evidence retrieval

Example:

```typescript
const options = {
  mode: 'strict',
  maxClaims: 10,
  confidenceThreshold: 0.8,
  retrievalDepth: 5
};

const result = await veritasService.verifyText(text, options);
```

## Special Features

### Turner v. Cognivault Detection

VERITAS includes special handling for the Turner v. Cognivault test case, which is a fictional legal case used to test hallucination detection. When this case is mentioned in text, VERITAS will automatically flag it as a hallucination with high confidence.

### Hallucination Detection

VERITAS detects hallucinations using several methods:

1. Known fictional case detection
2. Evidence-based verification
3. Confidence scoring

A claim is considered a hallucination if:
- It references a known fictional entity
- It has no supporting evidence
- It has contradicting evidence and low confidence
- It has very low confidence overall

## Integration with Promethios

VERITAS integrates with Promethios through extension functions:

- `extendObserverWithVeritas(observerService)`: Extends the observer service
- `extendMetricCalculatorWithVeritas(metricCalculator)`: Extends the metric calculator
- `extendAgentWrappingWithVeritas(agentWrapping)`: Extends the agent wrapping component

## Performance Considerations

- Claim extraction and validation are computationally intensive
- Evidence retrieval may involve network requests
- Consider caching verification results for repeated text
- Use the `maxClaims` option to limit processing for long texts

## Future Enhancements

- Real evidence retrieval from knowledge bases and web sources
- More sophisticated claim extraction using NLP
- Integration with external fact-checking services
- User feedback loop for verification improvement
- Expanded hallucination detection patterns
