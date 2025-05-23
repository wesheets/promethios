# Client Libraries Overview

## Introduction

The Client Libraries module provides official, well-maintained integration libraries in multiple programming languages to simplify developer interaction with Promethios APIs. These libraries abstract away the complexities of direct API calls, authentication, error handling, and retry logic, enabling developers to focus on their core application logic.

## Supported Languages

Phase 6.3 includes client libraries for the following languages:

1. **Python Client Library**: Primary reference implementation for data science and backend applications
2. **JavaScript Client Library**: For web applications and Node.js environments
3. **Java Client Library**: For enterprise applications and Android development
4. **Go Client Library**: For performance-critical applications and microservices

## Common Features

All client libraries share the following core features:

### 1. Authentication and Authorization

- JWT-based authentication
- Automatic token refresh
- Support for different authentication flows
- Access tier awareness and permissions handling

### 2. API Resource Mapping

- Object-oriented interfaces for all API resources
- Type-safe request and response handling
- Consistent naming conventions across languages
- Comprehensive coverage of all API endpoints

### 3. Error Handling and Resilience

- Standardized error classification
- Automatic retry for transient failures
- Circuit breaking for persistent issues
- Detailed error information and suggestions

### 4. Telemetry and Logging

- Configurable logging levels
- Performance metrics collection
- Distributed tracing support
- Debugging tools and helpers

## Implementation Details

### Python Client Library

```python
from promethios import Client, AuthConfig
from promethios.governance import TrustPolicy, Override

# Initialize client with authentication
client = Client(
    auth_config=AuthConfig(
        api_key="YOUR_API_KEY",
        auth_endpoint="https://api.promethios.ai/auth"
    )
)

# Create a trust policy
policy = TrustPolicy(
    name="example-policy",
    constraints=[
        {"type": "content_safety", "threshold": 0.8},
        {"type": "factual_accuracy", "threshold": 0.9}
    ]
)

# Apply policy to an agent
result = client.governance.apply_policy(
    agent_id="agent-123",
    policy=policy
)

# Monitor trust metrics
trust_metrics = client.metrics.get_trust_metrics(
    agent_id="agent-123",
    time_range="last_24h"
)

# Handle errors with specific exception types
try:
    result = client.agents.execute_task(agent_id="agent-123", task=task_data)
except promethios.exceptions.RateLimitExceeded:
    # Handle rate limiting
    pass
except promethios.exceptions.AuthenticationError:
    # Handle auth issues
    pass
```

### JavaScript Client Library

```javascript
import { PromethiosClient, AuthConfig } from '@promethios/client';
import { TrustPolicy } from '@promethios/governance';

// Initialize client with authentication
const client = new PromethiosClient({
  authConfig: new AuthConfig({
    apiKey: 'YOUR_API_KEY',
    authEndpoint: 'https://api.promethios.ai/auth'
  })
});

// Create a trust policy
const policy = new TrustPolicy({
  name: 'example-policy',
  constraints: [
    { type: 'content_safety', threshold: 0.8 },
    { type: 'factual_accuracy', threshold: 0.9 }
  ]
});

// Apply policy to an agent
client.governance.applyPolicy({
  agentId: 'agent-123',
  policy
})
  .then(result => console.log('Policy applied:', result))
  .catch(error => console.error('Error applying policy:', error));

// Monitor trust metrics with async/await
async function getTrustMetrics() {
  try {
    const metrics = await client.metrics.getTrustMetrics({
      agentId: 'agent-123',
      timeRange: 'last_24h'
    });
    console.log('Trust metrics:', metrics);
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      // Handle rate limiting
    } else if (error instanceof AuthenticationError) {
      // Handle auth issues
    }
  }
}
```

### Java Client Library

```java
import ai.promethios.client.PromethiosClient;
import ai.promethios.client.auth.AuthConfig;
import ai.promethios.governance.TrustPolicy;
import ai.promethios.governance.Constraint;

public class PromethiosExample {
    public static void main(String[] args) {
        // Initialize client with authentication
        PromethiosClient client = PromethiosClient.builder()
            .authConfig(AuthConfig.builder()
                .apiKey("YOUR_API_KEY")
                .authEndpoint("https://api.promethios.ai/auth")
                .build())
            .build();
        
        // Create a trust policy
        TrustPolicy policy = TrustPolicy.builder()
            .name("example-policy")
            .addConstraint(Constraint.builder()
                .type("content_safety")
                .threshold(0.8)
                .build())
            .addConstraint(Constraint.builder()
                .type("factual_accuracy")
                .threshold(0.9)
                .build())
            .build();
        
        try {
            // Apply policy to an agent
            PolicyResult result = client.governance().applyPolicy(
                ApplyPolicyRequest.builder()
                    .agentId("agent-123")
                    .policy(policy)
                    .build()
            );
            
            // Monitor trust metrics
            TrustMetrics metrics = client.metrics().getTrustMetrics(
                GetTrustMetricsRequest.builder()
                    .agentId("agent-123")
                    .timeRange("last_24h")
                    .build()
            );
        } catch (RateLimitExceededException e) {
            // Handle rate limiting
        } catch (AuthenticationException e) {
            // Handle auth issues
        }
    }
}
```

### Go Client Library

```go
package main

import (
    "context"
    "log"
    
    "github.com/promethios/client"
    "github.com/promethios/client/auth"
    "github.com/promethios/governance"
)

func main() {
    // Initialize client with authentication
    cfg := auth.Config{
        APIKey:       "YOUR_API_KEY",
        AuthEndpoint: "https://api.promethios.ai/auth",
    }
    
    client, err := client.NewClient(cfg)
    if err != nil {
        log.Fatalf("Failed to create client: %v", err)
    }
    
    // Create a trust policy
    policy := governance.TrustPolicy{
        Name: "example-policy",
        Constraints: []governance.Constraint{
            {Type: "content_safety", Threshold: 0.8},
            {Type: "factual_accuracy", Threshold: 0.9},
        },
    }
    
    // Apply policy to an agent
    ctx := context.Background()
    result, err := client.Governance.ApplyPolicy(ctx, "agent-123", policy)
    if err != nil {
        switch e := err.(type) {
        case *client.RateLimitExceededError:
            // Handle rate limiting
        case *client.AuthenticationError:
            // Handle auth issues
        default:
            log.Fatalf("Unexpected error: %v", e)
        }
    }
    
    // Monitor trust metrics
    metrics, err := client.Metrics.GetTrustMetrics(ctx, "agent-123", "last_24h")
    if err != nil {
        log.Fatalf("Failed to get metrics: %v", err)
    }
}
```

## Integration Points

The client libraries integrate with:

1. **API Gateway**: For making authenticated API calls
2. **Access Tier Management**: For handling permissions and rate limits
3. **Telemetry System**: For reporting usage and errors
4. **Developer Portal**: For documentation and examples
5. **Sandbox Environment**: For testing and development

## Configuration

Each client library is configured through language-appropriate mechanisms:

### Python Configuration

```python
# Configuration via environment variables
import os
os.environ["PROMETHIOS_API_KEY"] = "YOUR_API_KEY"
os.environ["PROMETHIOS_ENVIRONMENT"] = "sandbox"

# Or via configuration object
from promethios import ClientConfig

config = ClientConfig(
    api_key="YOUR_API_KEY",
    environment="sandbox",
    timeout=30,
    retry_attempts=3,
    log_level="INFO"
)

client = Client(config=config)
```

### JavaScript Configuration

```javascript
// Configuration via environment variables in Node.js
process.env.PROMETHIOS_API_KEY = 'YOUR_API_KEY';
process.env.PROMETHIOS_ENVIRONMENT = 'sandbox';

// Or via configuration object
import { ClientConfig } from '@promethios/client';

const config = new ClientConfig({
  apiKey: 'YOUR_API_KEY',
  environment: 'sandbox',
  timeout: 30,
  retryAttempts: 3,
  logLevel: 'INFO'
});

const client = new PromethiosClient(config);
```

## Security Considerations

The client libraries implement several security measures:

1. **Secure Token Storage**: Appropriate storage mechanisms for each platform
2. **TLS Enforcement**: HTTPS-only communication
3. **API Key Protection**: Best practices for key management
4. **Input Validation**: Validation before sending requests
5. **Minimal Dependencies**: Reduced attack surface through careful dependency management

## Versioning and Compatibility

The client libraries follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes to the API
- **MINOR**: New features in a backward-compatible manner
- **PATCH**: Backward-compatible bug fixes

Each library maintains compatibility with:
- Current API version
- Previous API version (for transition periods)
- Specified minimum language versions

## Future Enhancements

Planned enhancements for future phases include:

1. **Additional Language Support**: Ruby, C#, PHP, and others
2. **Enhanced Offline Capabilities**: Better handling of intermittent connectivity
3. **Advanced Caching**: Intelligent caching of responses
4. **Streaming Support**: Efficient handling of streaming responses
5. **Framework Integrations**: Native integrations with popular frameworks
