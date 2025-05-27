# Agent Scorecard and Trust Lineage Documentation

## Overview

The Agent Scorecard and Trust Lineage system provides a cryptographically verifiable, schema-bound, and objective trust framework for agents in the Promethios ecosystem. This system transforms trust from a subjective measure into an objective, verifiable metric that can be used to evaluate agent reliability, compliance, and governance adherence.

## Key Features

- **Schema-bound Scorecards**: All agent scorecards follow a strict schema that ensures consistency and prevents subjective ratings
- **Cryptographic Verification**: Scorecards are cryptographically signed and include Merkle proofs for tamper resistance
- **Objective Metrics**: Trust scores are derived from runtime data, not subjective evaluations
- **Trust Lineage Tracking**: Records and verifies trust delegation between agents
- **Governance Identity Integration**: Links agent scorecards to their governance identity
- **Public API Access**: Provides RESTful API endpoints for accessing and verifying scorecards
- **Visualization Tools**: Includes UI components for visualizing trust scores and relationships

## Architecture

The Agent Scorecard system consists of the following components:

1. **Scorecard Manager**: Creates, stores, and retrieves agent scorecards
2. **Trust Lineage Tracker**: Manages trust delegation between agents
3. **Cryptographic Verifier**: Signs and verifies scorecards and lineage records
4. **Scorecard Analytics**: Provides analytics and visualization capabilities
5. **Scorecard API**: Exposes RESTful endpoints for accessing scorecards
6. **UI Components**: Visualizes scorecard data and trust relationships

## Scorecard Schema

Agent scorecards follow a strict schema defined in `schemas/agent_scorecard/agent_scorecard.schema.v1.json`. Key fields include:

- **agent_id**: Unique identifier for the agent
- **governance_identity**: Information about the agent's governance framework
- **trust_score**: Composite trust score (0.0-1.0) or null for unknown governance
- **reflection_compliance**: Metrics on reflection compliance
- **belief_trace_integrity**: Metrics on belief trace integrity
- **violation_history**: Record of governance violations
- **trust_lineage**: Information about trust delegation
- **arbitration_history**: Record of CRITIC arbitrations
- **cryptographic_proof**: Cryptographic signature and verification data

## Trust Lineage Schema

Trust lineage records follow the schema defined in `schemas/agent_scorecard/trust_lineage.schema.v1.json`. Key fields include:

- **source_agent**: Agent delegating trust
- **target_agent**: Agent receiving trust delegation
- **delegation_type**: Type of trust delegation
- **trust_context**: Context in which trust is delegated
- **trust_metrics**: Metrics associated with the delegation
- **cryptographic_proof**: Cryptographic signature and verification data

## API Endpoints

The Scorecard API provides the following endpoints:

- **GET /api/agent/scorecard/{agentId}**: Get the latest scorecard for an agent
- **GET /api/agent/scorecard/{agentId}/history**: Get scorecard history for an agent
- **POST /api/agent/scorecard/verify**: Verify a scorecard's cryptographic integrity
- **GET /api/agent/scorecard/{agentId}/lineage**: Get trust lineage for an agent
- **POST /api/agent/scorecard/delegate**: Record trust delegation between agents

## Integration with Observers

The Agent Scorecard system integrates with the following constitutional observers:

- **PRISM**: Provides belief trace verification and reflection compliance metrics
- **VIGIL**: Provides trust decay monitoring and violation tracking

## Usage Examples

### Retrieving an Agent Scorecard

```javascript
// Fetch the latest scorecard for an agent
const response = await fetch(`/api/agent/scorecard/agent-123`);
const scorecard = await response.json();

// Check trust score
if (scorecard.trust_score === null) {
  console.log('Agent has unknown governance');
} else if (scorecard.trust_score < 0.6) {
  console.log('Agent has low trust score');
} else {
  console.log(`Agent has trust score of ${scorecard.trust_score}`);
}
```

### Verifying a Scorecard

```javascript
// Verify a scorecard's cryptographic integrity
const response = await fetch('/api/agent/scorecard/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ scorecard })
});

const result = await response.json();
if (result.valid) {
  console.log('Scorecard is valid');
} else {
  console.log('Scorecard verification failed');
}
```

### Recording Trust Delegation

```javascript
// Record trust delegation between agents
const response = await fetch('/api/agent/scorecard/delegate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sourceAgentId: 'agent-123',
    targetAgentId: 'agent-456',
    context: {
      domain: 'data-processing',
      scope: ['read', 'process'],
      expiration: '2025-12-31T23:59:59Z'
    }
  })
});

const lineageRecord = await response.json();
console.log(`Trust delegation recorded with ID: ${lineageRecord.lineage_id}`);
```

## Best Practices

1. **Never Edit Scorecards Manually**: Scorecards are cryptographically signed and should never be manually edited
2. **Verify Before Trusting**: Always verify a scorecard's cryptographic integrity before trusting it
3. **Check Warning States**: Pay attention to warning states for agents with unknown governance
4. **Monitor Trust Trends**: Regularly monitor trust score trends to detect degradation
5. **Enforce Minimum Trust Thresholds**: Set minimum trust thresholds for critical operations

## Security Considerations

1. **Key Management**: Protect the cryptographic keys used for signing scorecards
2. **Verification Endpoint Security**: Secure the verification endpoints to prevent tampering
3. **Delegation Controls**: Implement controls to prevent unauthorized trust delegation
4. **Audit Logging**: Maintain audit logs of all scorecard and lineage operations

## Troubleshooting

### Common Issues

1. **Verification Failures**: If scorecard verification fails, check for tampering or data corruption
2. **Missing Scorecards**: If a scorecard is missing, ensure the agent has been registered with the system
3. **Trust Delegation Errors**: If trust delegation fails, check that both agents have valid governance identities
4. **API Access Issues**: Ensure proper authentication and authorization for API access

### Diagnostic Tools

1. **Scorecard Validator**: Use the validator tool to check scorecard schema compliance
2. **Cryptographic Verifier**: Use the verifier tool to check cryptographic integrity
3. **Trust Lineage Explorer**: Use the explorer to visualize trust relationships

## Conclusion

The Agent Scorecard and Trust Lineage system provides a robust, verifiable, and objective framework for evaluating agent trust in the Promethios ecosystem. By implementing this system, Promethios establishes itself as a standard-setter for agent governance and interoperability, ensuring that trust is earned, verified, and transparently communicated.
