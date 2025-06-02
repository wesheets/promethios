# VERITAS Quick Start Guide

## Overview

VERITAS (Verification, Evaluation, and Reliability in Trustworthy AI Systems) is an enhanced verification module designed to detect and prevent hallucinations in AI responses. This quick start guide will help you get up and running with the enhanced VERITAS system.

## Key Features

- **Domain-Specific Verification**: Apply different verification standards based on content domain
- **Uncertainty Expression Recognition**: Detect and reward appropriate expressions of uncertainty
- **Complete Toggle Functionality**: Enable or disable verification with a simple control
- **Comprehensive Metrics**: Monitor verification performance across different domains

## Getting Started

### 1. Installation

```bash
npm install @promethios/veritas
```

### 2. Basic Setup

```typescript
import { GovernanceKernel } from '@promethios/governance';
import { VeritasManager } from '@promethios/veritas';

// Create VERITAS manager with default configuration
const veritasManager = new VeritasManager();

// Register with governance kernel
const governanceKernel = new GovernanceKernel();
governanceKernel.registerVerificationProvider(veritasManager);
```

### 3. Enable/Disable VERITAS

```typescript
// Enable VERITAS
veritasManager.enableVeritas();

// Disable VERITAS
veritasManager.disableVeritas();

// Check if VERITAS is enabled
const isEnabled = veritasManager.isEnabled();
```

### 4. Configure Domains

```typescript
// Update domain configuration
veritasManager.updateDomainConfig('legal', {
  confidenceThreshold: 90,
  evidenceRequirement: 80,
  blockingEnabled: true,
  uncertaintyRequired: true
});
```

### 5. Monitor Performance

```typescript
// Get verification metrics
const metrics = veritasManager.getMetrics();
console.log(`Total verifications: ${metrics.verificationCounts.total}`);
console.log(`Blocked responses: ${metrics.verificationCounts.blocked}`);
console.log(`Allowed responses: ${metrics.verificationCounts.allowed}`);
```

## Admin UI Integration

```typescript
import { VeritasAdminPanel, VeritasMetricsDashboard } from '@promethios/veritas/admin';

// In your React component
return (
  <div>
    <VeritasAdminPanel 
      onConfigChange={handleConfigChange}
      onToggleVeritas={handleToggle}
    />
    <VeritasMetricsDashboard />
  </div>
);
```

## Common Operations

### Toggle VERITAS On/Off

```typescript
// Via API
veritasManager.enableVeritas();
veritasManager.disableVeritas();

// Via HTTP endpoint
fetch('/api/veritas/toggle/enable', { method: 'POST' });
fetch('/api/veritas/toggle/disable', { method: 'POST' });
```

### Update Configuration

```typescript
// Via API
veritasManager.updateConfig({
  domainSpecificEnabled: true,
  uncertaintyRewardEnabled: true
});

// Via HTTP endpoint
fetch('/api/veritas/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domainSpecificEnabled: true,
    uncertaintyRewardEnabled: true
  })
});
```

### Reset Metrics

```typescript
// Via API
veritasManager.resetMetrics();

// Via HTTP endpoint
fetch('/api/veritas/metrics/reset', { method: 'POST' });
```

## Next Steps

- Review the [Administrator Guide](./VeritasAdminGuide.md) for detailed information
- Explore the [API Reference](./VeritasAPIReference.md) for advanced usage
- Check out the [Best Practices Guide](./VeritasBestPractices.md) for optimization tips

## Support

For additional support, please contact the Promethios support team at support@promethios.ai or visit our documentation portal at https://docs.promethios.ai/veritas.
