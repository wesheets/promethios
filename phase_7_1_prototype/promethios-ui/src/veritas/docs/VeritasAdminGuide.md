# VERITAS Administrator Guide

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Installation and Setup](#installation-and-setup)
4. [Configuration](#configuration)
5. [Domain-Specific Verification](#domain-specific-verification)
6. [Uncertainty Detection](#uncertainty-detection)
7. [Toggle Functionality](#toggle-functionality)
8. [Metrics and Monitoring](#metrics-and-monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)
11. [API Reference](#api-reference)
12. [Glossary](#glossary)

## Introduction

VERITAS (Verification, Evaluation, and Reliability in Trustworthy AI Systems) is an advanced verification module designed to detect and prevent hallucinations in AI responses. The enhanced VERITAS system introduces domain-specific verification standards and uncertainty expression recognition to provide a more nuanced approach to verification.

### Purpose of This Guide

This administrator guide provides comprehensive information for installing, configuring, and maintaining the enhanced VERITAS system. It is intended for system administrators, governance operators, and technical staff responsible for AI governance within the Promethios platform.

### Key Features of Enhanced VERITAS

- **Domain-Specific Verification**: Apply different verification standards based on content domain
- **Uncertainty Expression Recognition**: Detect and reward appropriate expressions of uncertainty
- **Complete Toggle Functionality**: Enable or disable verification with a simple control
- **Comprehensive Metrics**: Monitor verification performance across different domains
- **Integration with Governance**: Seamless integration with the broader governance system

## System Architecture

The enhanced VERITAS system consists of several interconnected components:

### Core Components

1. **VERITAS Manager**: Central control component that coordinates verification activities
2. **Domain Classifier**: Categorizes content into domains for appropriate verification
3. **Uncertainty Detector**: Identifies expressions of uncertainty in responses
4. **Enhanced Enforcer**: Applies verification results and manages trust adjustments
5. **Metrics System**: Collects and analyzes verification performance data

### Integration Points

1. **Governance Kernel**: Connects VERITAS to the broader governance system
2. **Observer Module**: Provides context for verification decisions
3. **Trust System**: Manages trust adjustments based on verification results
4. **API Layer**: Exposes configuration and control endpoints

### Data Flow

```
User Query → Agent Response → VERITAS Verification Pipeline:
  1. Domain Classification
  2. Claim Extraction
  3. Evidence Retrieval
  4. Uncertainty Detection
  5. Verification Decision
  6. Trust Adjustment
  7. Response Enforcement
```

## Installation and Setup

### Prerequisites

- Promethios Governance Kernel v2.3.0 or higher
- Node.js v14.0.0 or higher
- TypeScript v4.5.0 or higher
- React v17.0.0 or higher (for admin UI)

### Installation Steps

1. **Install the VERITAS package**:
   ```bash
   npm install @promethios/veritas
   ```

2. **Register with Governance Kernel**:
   ```typescript
   import { GovernanceKernel } from '@promethios/governance';
   import { VeritasManager } from '@promethios/veritas';

   const veritasManager = new VeritasManager({
     enabled: true,
     domainSpecificEnabled: true,
     uncertaintyRewardEnabled: true
   });

   const governanceKernel = new GovernanceKernel();
   governanceKernel.registerVerificationProvider(veritasManager);
   ```

3. **Configure API endpoints**:
   ```typescript
   import express from 'express';
   import { veritasApiRouter } from '@promethios/veritas';

   const app = express();
   app.use('/api/veritas', veritasApiRouter);
   ```

4. **Add admin UI components**:
   ```typescript
   import { VeritasAdminPanel, VeritasMetricsDashboard } from '@promethios/veritas/admin';

   // In your React component
   return (
     <div>
       <VeritasAdminPanel />
       <VeritasMetricsDashboard />
     </div>
   );
   ```

## Configuration

### General Configuration

The VERITAS system can be configured through the admin UI or directly via the configuration API:

```typescript
const veritasConfig = {
  enabled: true,                // Master toggle for VERITAS
  domainSpecificEnabled: true,  // Enable domain-specific verification
  uncertaintyRewardEnabled: true, // Enable uncertainty expression reward
  defaultMode: 'balanced',      // 'strict', 'balanced', or 'lenient'
  domains: [                    // Domain configurations
    {
      id: 'legal',
      name: 'Legal',
      riskLevel: 'high',
      confidenceThreshold: 90,
      evidenceRequirement: 80,
      blockingEnabled: true,
      uncertaintyRequired: true,
      keywords: ['court', 'legal', 'law', 'judge', 'attorney', 'lawsuit']
    },
    // Additional domains...
  ]
};

veritasManager.updateConfig(veritasConfig);
```

### Configuration Parameters

| Parameter | Description | Default | Options |
|-----------|-------------|---------|---------|
| `enabled` | Master toggle for VERITAS | `true` | `true`, `false` |
| `domainSpecificEnabled` | Enable domain-specific verification | `true` | `true`, `false` |
| `uncertaintyRewardEnabled` | Enable uncertainty expression reward | `true` | `true`, `false` |
| `defaultMode` | Default verification mode | `'balanced'` | `'strict'`, `'balanced'`, `'lenient'` |

## Domain-Specific Verification

### Available Domains

The enhanced VERITAS system includes several pre-configured domains:

1. **Legal**: High-risk domain for legal content
2. **Medical**: High-risk domain for medical content
3. **Financial**: High-risk domain for financial content
4. **Historical**: Medium-risk domain for historical content
5. **Scientific**: Medium-risk domain for scientific content
6. **Entertainment**: Low-risk domain for entertainment content
7. **General**: Low-risk domain for general content

### Domain Configuration

Each domain can be configured with specific verification parameters:

```typescript
const legalDomain = {
  id: 'legal',
  name: 'Legal',
  riskLevel: 'high',           // 'high', 'medium', or 'low'
  confidenceThreshold: 90,     // 0-100
  evidenceRequirement: 80,     // 0-100
  blockingEnabled: true,       // Whether to block failed verifications
  uncertaintyRequired: true,   // Whether uncertainty is required for unverified claims
  keywords: ['court', 'legal', 'law', 'judge', 'attorney', 'lawsuit']
};

veritasManager.updateDomainConfig('legal', legalDomain);
```

### Adding Custom Domains

Custom domains can be added to address specific verification needs:

```typescript
const customDomain = {
  id: 'custom_domain',
  name: 'Custom Domain',
  riskLevel: 'medium',
  confidenceThreshold: 75,
  evidenceRequirement: 60,
  blockingEnabled: true,
  uncertaintyRequired: false,
  keywords: ['keyword1', 'keyword2', 'keyword3']
};

veritasManager.addDomain(customDomain);
```

## Uncertainty Detection

### Uncertainty Qualifiers

The enhanced VERITAS system recognizes various expressions of uncertainty:

- **Strong qualifiers**: "I'm uncertain about", "It's unclear whether", "There is limited evidence that"
- **Moderate qualifiers**: "Based on available information", "It appears that", "According to sources"
- **Weak qualifiers**: "Likely", "Probably", "May be", "Could be"

### Configuring Uncertainty Detection

Uncertainty detection can be configured through the admin UI or directly via the API:

```typescript
const uncertaintyConfig = {
  enabled: true,
  requiredForUnverifiedClaims: true,
  bonusForAppropriateUncertainty: 2,
  penaltyForMissingUncertainty: -3,
  patterns: [
    {
      pattern: "based on available information",
      strength: "moderate"
    },
    // Additional patterns...
  ]
};

veritasManager.updateUncertaintyConfig(uncertaintyConfig);
```

### Adding Custom Patterns

Custom uncertainty patterns can be added to improve detection:

```typescript
const customPattern = {
  pattern: "current understanding suggests",
  strength: "moderate"
};

veritasManager.addUncertaintyPattern(customPattern);
```

## Toggle Functionality

### Enabling/Disabling VERITAS

The enhanced VERITAS system can be completely enabled or disabled:

```typescript
// Enable VERITAS
veritasManager.enableVeritas();

// Disable VERITAS
veritasManager.disableVeritas();

// Check if VERITAS is enabled
const isEnabled = veritasManager.isEnabled();
```

### Toggle API Endpoints

VERITAS provides API endpoints for toggling functionality:

```
POST /api/veritas/toggle/enable  - Enable VERITAS
POST /api/veritas/toggle/disable - Disable VERITAS
GET  /api/veritas/status         - Get current status
```

### Toggle Impact

When VERITAS is disabled:
- No verification is performed
- No trust adjustments are applied
- No responses are blocked or modified
- The rest of the governance system continues to function normally

## Metrics and Monitoring

### Available Metrics

The enhanced VERITAS system collects comprehensive metrics:

1. **Verification Counts**: Total, blocked, and allowed verifications
2. **Domain Classification**: Accuracy of domain classification
3. **Uncertainty Detection**: Detected, missed, and incorrectly identified uncertainty
4. **Trust Adjustments**: Penalties, bonuses, and net adjustment
5. **Performance**: Processing time by domain and operation
6. **Toggle Operations**: Enable/disable counts and timing

### Accessing Metrics

Metrics can be accessed through the admin UI or directly via the API:

```typescript
// Get all metrics
const metrics = veritasManager.getMetrics();

// Get specific metric category
const verificationCounts = veritasManager.getMetrics('verificationCounts');

// Reset metrics
veritasManager.resetMetrics();
```

### Metrics API Endpoints

VERITAS provides API endpoints for accessing metrics:

```
GET /api/veritas/metrics          - Get all metrics
GET /api/veritas/metrics/:category - Get specific metric category
POST /api/veritas/metrics/reset   - Reset metrics
```

## Troubleshooting

### Common Issues

#### Verification Not Working

**Symptoms**: Responses are not being verified, no trust adjustments are applied

**Possible Causes**:
- VERITAS is disabled
- Domain-specific verification is disabled
- No matching domain found for content

**Solutions**:
- Check if VERITAS is enabled: `veritasManager.isEnabled()`
- Enable domain-specific verification: `veritasManager.updateConfig({ domainSpecificEnabled: true })`
- Add appropriate keywords to domains

#### Incorrect Domain Classification

**Symptoms**: Content is being verified with inappropriate standards

**Possible Causes**:
- Insufficient or incorrect domain keywords
- Content spans multiple domains
- Domain confidence threshold too low

**Solutions**:
- Update domain keywords
- Adjust domain confidence threshold
- Check domain classification results: `veritasManager.classifyContent(text)`

#### Performance Issues

**Symptoms**: Slow response times, high resource utilization

**Possible Causes**:
- Large number of claims to verify
- Complex domain classification
- Inefficient evidence retrieval

**Solutions**:
- Optimize domain keywords
- Implement caching for frequent operations
- Adjust verification thresholds

### Logging

VERITAS provides comprehensive logging for troubleshooting:

```typescript
// Set log level
veritasManager.setLogLevel('debug'); // 'error', 'warn', 'info', 'debug'

// Enable specific log categories
veritasManager.enableLogCategory('domainClassification');
veritasManager.enableLogCategory('uncertaintyDetection');
```

### Diagnostic Tools

VERITAS includes diagnostic tools for troubleshooting:

```typescript
// Test domain classification
const domainResult = veritasManager.testDomainClassification(text);

// Test uncertainty detection
const uncertaintyResult = veritasManager.testUncertaintyDetection(text);

// Test full verification pipeline
const verificationResult = veritasManager.testVerification(text);
```

## Best Practices

### Configuration Best Practices

1. **Domain Configuration**:
   - Set higher thresholds for high-risk domains
   - Use specific keywords for accurate classification
   - Require uncertainty for domains with limited evidence

2. **Uncertainty Detection**:
   - Balance between strict and lenient detection
   - Add domain-specific uncertainty patterns
   - Adjust bonuses and penalties based on domain risk

3. **Toggle Management**:
   - Use toggle sparingly to maintain consistency
   - Document toggle operations for audit purposes
   - Consider partial toggles (domain-specific) instead of full toggle

### Monitoring Best Practices

1. **Regular Metric Review**:
   - Review verification metrics weekly
   - Monitor domain classification accuracy
   - Track trust adjustment trends

2. **Performance Optimization**:
   - Monitor processing time by domain
   - Identify and address performance bottlenecks
   - Optimize resource-intensive operations

3. **Continuous Improvement**:
   - Update domain keywords based on classification results
   - Refine uncertainty patterns based on detection accuracy
   - Adjust verification thresholds based on user feedback

## API Reference

### VERITAS Manager API

```typescript
class VeritasManager {
  // Constructor
  constructor(config: VeritasManagerConfig);
  
  // Core functionality
  async processResponse(text: string, options?: ProcessOptions): Promise<VeritasResult>;
  
  // Toggle functionality
  isEnabled(): boolean;
  enableVeritas(): void;
  disableVeritas(): void;
  
  // Configuration management
  getConfig(): VeritasManagerConfig;
  updateConfig(config: Partial<VeritasManagerConfig>): void;
  updateDomainConfig(domainId: string, config: Partial<DomainConfig>): void;
  addDomain(domain: DomainConfig): void;
  removeDomain(domainId: string): void;
  
  // Uncertainty management
  updateUncertaintyConfig(config: UncertaintyConfig): void;
  addUncertaintyPattern(pattern: UncertaintyPattern): void;
  removeUncertaintyPattern(patternId: string): void;
  
  // Metrics and monitoring
  getMetrics(category?: string): VeritasMetricsData | any;
  resetMetrics(): void;
  setLogLevel(level: LogLevel): void;
  enableLogCategory(category: string): void;
  disableLogCategory(category: string): void;
  
  // Diagnostic tools
  testDomainClassification(text: string): DomainClassificationResult;
  testUncertaintyDetection(text: string): UncertaintyDetectionResult;
  testVerification(text: string): VeritasResult;
}
```

### API Endpoints

```
# Toggle endpoints
POST /api/veritas/toggle/enable  - Enable VERITAS
POST /api/veritas/toggle/disable - Disable VERITAS
GET  /api/veritas/status         - Get current status

# Configuration endpoints
GET  /api/veritas/config         - Get current configuration
POST /api/veritas/config         - Update configuration
GET  /api/veritas/domains        - Get all domains
GET  /api/veritas/domains/:id    - Get specific domain
POST /api/veritas/domains        - Add new domain
PUT  /api/veritas/domains/:id    - Update domain
DELETE /api/veritas/domains/:id  - Remove domain

# Uncertainty endpoints
GET  /api/veritas/uncertainty    - Get uncertainty configuration
POST /api/veritas/uncertainty    - Update uncertainty configuration
POST /api/veritas/uncertainty/patterns - Add uncertainty pattern
DELETE /api/veritas/uncertainty/patterns/:id - Remove uncertainty pattern

# Metrics endpoints
GET  /api/veritas/metrics        - Get all metrics
GET  /api/veritas/metrics/:category - Get specific metric category
POST /api/veritas/metrics/reset  - Reset metrics

# Diagnostic endpoints
POST /api/veritas/test/domain    - Test domain classification
POST /api/veritas/test/uncertainty - Test uncertainty detection
POST /api/veritas/test/verification - Test full verification
```

## Glossary

- **VERITAS**: Verification, Evaluation, and Reliability in Trustworthy AI Systems
- **Domain**: A category of content with specific verification standards
- **Uncertainty Expression**: Language that indicates a lack of complete certainty
- **Verification**: The process of checking claims against available evidence
- **Trust Adjustment**: Changes to trust score based on verification results
- **Toggle**: The ability to enable or disable verification functionality
- **Hallucination**: AI-generated content that is factually incorrect or unverifiable
- **Evidence**: Information used to verify claims
- **Confidence Threshold**: Minimum confidence required for verification
- **Evidence Requirement**: Minimum evidence strength required for verification
