# @promethios/agent-reporter

Governance wrapper and reporting client for deployed Promethios agents. This package enables deployed AI agents to maintain governance compliance and report metrics back to the Promethios platform.

## Features

- **🛡️ Embedded Governance** - Policy enforcement and trust scoring within deployed agents
- **📊 Real-time Metrics** - Performance, system, and business metrics collection
- **🔍 Comprehensive Logging** - Structured logging with automatic reporting
- **📡 Reliable Reporting** - Robust communication with Promethios API backend
- **⚡ High Performance** - Minimal overhead with configurable reporting intervals
- **🔄 Automatic Retry** - Built-in retry logic for network failures

## Installation

```bash
npm install @promethios/agent-reporter
```

## Quick Start

```typescript
import { createPrometheiosWrapper, GovernancePolicy } from '@promethios/agent-reporter';

// Configuration
const config = {
  apiKey: 'promethios_user123_agent456_1672531200',
  baseUrl: 'https://api.promethios.com',
  agentId: 'agent456',
  userId: 'user123',
  reportingInterval: 60, // seconds
  enableRealTimeReporting: true,
  retryAttempts: 3,
  retryDelay: 5000 // milliseconds
};

// Governance policies
const policies: GovernancePolicy[] = [
  {
    id: 'no-personal-info',
    name: 'No Personal Information',
    description: 'Prevent sharing of personal information',
    enabled: true,
    severity: 'high',
    rules: [
      {
        id: 'detect-pii',
        condition: 'no_personal_info',
        action: 'modify',
        parameters: { redact: true },
        enabled: true
      }
    ]
  }
];

// Initialize wrapper
const wrapper = await createPrometheiosWrapper(config, policies);

// Wrap agent responses
const result = await wrapper.wrapResponse(
  "What's my email address?",
  "Your email is john.doe@example.com",
  { sessionId: 'session123' }
);

console.log('Response:', result.response); // "Your email is [REDACTED-EMAIL]"
console.log('Allowed:', result.allowed); // true
console.log('Violations:', result.violations); // [violation details]
```

## Core Components

### PrometheiosAgentWrapper

Main wrapper class that provides complete governance and reporting functionality.

```typescript
import { PrometheiosAgentWrapper } from '@promethios/agent-reporter';

const wrapper = new PrometheiosAgentWrapper(config);
await wrapper.initialize(policies);

// Wrap responses with governance
const result = await wrapper.wrapResponse(input, response, context);

// Record user satisfaction
wrapper.recordUserSatisfaction(4); // 1-5 rating

// Get status
const status = wrapper.getStatus();

// Shutdown
await wrapper.shutdown();
```

### DeployedGovernanceEngine

Embedded governance engine for policy enforcement and trust scoring.

```typescript
import { DeployedGovernanceEngine } from '@promethios/agent-reporter';

const engine = new DeployedGovernanceEngine('agentId', 'userId');
await engine.initialize(policies);

const result = await engine.evaluateResponse(input, response, context);
const trustScore = await engine.calculateTrustScore();
const metrics = await engine.getGovernanceMetrics();
```

### PrometheiosReportingClient

Handles communication with Promethios API backend.

```typescript
import { PrometheiosReportingClient } from '@promethios/agent-reporter';

const client = new PrometheiosReportingClient(config);
await client.initialize();

// Send different types of data
await client.sendGovernanceMetrics(metrics);
await client.sendViolation(violation);
await client.sendLog(logEntry);
await client.sendHeartbeat();
```

### MetricsCollector

Collects system, performance, and business metrics.

```typescript
import { MetricsCollector } from '@promethios/agent-reporter';

const collector = new MetricsCollector();

// Record events
collector.recordRequest(responseTime, isError);
collector.recordUserInteraction();
collector.recordTaskCompletion();
collector.recordUserSatisfaction(rating);

// Collect metrics
const systemMetrics = await collector.collectSystemMetrics();
const performanceMetrics = await collector.collectPerformanceMetrics();
const businessMetrics = await collector.collectBusinessMetrics();
```

### PrometheiosLogger

Structured logging with automatic reporting to Promethios.

```typescript
import { PrometheiosLogger } from '@promethios/agent-reporter';

const logger = new PrometheiosLogger(reportingClient);

// Log different levels
logger.debug('Debug message', 'system', { key: 'value' });
logger.info('Info message', 'performance');
logger.warn('Warning message', 'governance');
logger.error('Error message', 'system', metadata, error);
logger.critical('Critical message', 'security'); // Sent immediately

// Category-specific logging
logger.governance('Policy violation detected');
logger.performance('Response time: 150ms');
logger.business('Task completed successfully');
logger.security('Unauthorized access attempt');
```

## Configuration

### PrometheusConfig

```typescript
interface PrometheusConfig {
  apiKey: string;              // API key for authentication
  baseUrl: string;             // Promethios API base URL
  agentId: string;             // Unique agent identifier
  userId: string;              // User identifier
  reportingInterval: number;   // Reporting interval in seconds
  enableRealTimeReporting: boolean; // Enable real-time reporting
  retryAttempts: number;       // Number of retry attempts
  retryDelay: number;          // Delay between retries in milliseconds
}
```

### Governance Policies

```typescript
interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rules: GovernanceRule[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface GovernanceRule {
  id: string;
  condition: string;           // Rule condition (e.g., 'no_personal_info')
  action: 'warn' | 'block' | 'modify' | 'log'; // Action to take
  parameters: Record<string, any>; // Rule parameters
  enabled: boolean;
}
```

## Built-in Governance Rules

### Personal Information Protection
- **Condition**: `no_personal_info`
- **Detects**: SSN, credit cards, email addresses
- **Actions**: Redact or block responses containing PII

### Harmful Content Detection
- **Condition**: `no_harmful_content`
- **Detects**: Violence, hate speech, discrimination
- **Actions**: Block or modify harmful responses

### Response Length Limits
- **Condition**: `response_length_limit`
- **Parameters**: `{ maxLength: 1000 }`
- **Actions**: Truncate or warn about long responses

## Metrics and Monitoring

### Governance Metrics
- Trust score (0-1)
- Compliance rate (0-1)
- Violation count
- Policy enforcement rate

### Performance Metrics
- Response time (ms)
- Throughput (requests/sec)
- Error rate (%)
- Success rate (%)
- CPU and memory usage

### System Metrics
- CPU usage (%)
- Memory usage (%)
- Disk usage (%)
- Network I/O
- Uptime

### Business Metrics
- User interactions
- Task completions
- User satisfaction (1-5)
- Business value score (0-100)

## Error Handling

The package includes comprehensive error handling:

- **Network failures**: Automatic retry with exponential backoff
- **API errors**: Proper error codes and messages
- **Governance failures**: Fail-open approach (allow response on error)
- **Logging failures**: Buffer logs and retry sending

## Best Practices

### 1. Configuration
```typescript
// Use environment variables for sensitive data
const config = {
  apiKey: process.env.PROMETHIOS_API_KEY,
  baseUrl: process.env.PROMETHIOS_API_URL || 'https://api.promethios.com',
  agentId: process.env.AGENT_ID,
  userId: process.env.USER_ID,
  reportingInterval: parseInt(process.env.REPORTING_INTERVAL) || 60
};
```

### 2. Error Handling
```typescript
try {
  const result = await wrapper.wrapResponse(input, response);
  // Handle result
} catch (error) {
  logger.error('Governance evaluation failed', 'system', {}, error);
  // Fallback to original response
}
```

### 3. Graceful Shutdown
```typescript
process.on('SIGTERM', async () => {
  await wrapper.shutdown();
  process.exit(0);
});
```

### 4. Performance Monitoring
```typescript
// Monitor wrapper performance
const status = wrapper.getStatus();
if (status.metrics.errorRate > 5) {
  logger.warn('High error rate detected', 'performance', status.metrics);
}
```

## API Reference

See the [TypeScript definitions](./src/types/index.ts) for complete API documentation.

## License

MIT

## Support

For support and questions, please contact the Promethios team or visit our documentation at [docs.promethios.com](https://docs.promethios.com).

