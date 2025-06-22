# Policy Management Module

A comprehensive policy management system for the Promethios framework, enabling governance policy creation, management, and enforcement for AI agent actions.

## Features

### 🏛️ **Core Policy Management**
- **Policy CRUD Operations**: Create, read, update, and delete governance policies
- **Policy Types**: SECURITY, COMPLIANCE, OPERATIONAL, ETHICAL, LEGAL
- **Enforcement Levels**: STRICT (deny), MODERATE (modify/log), ADVISORY (log only)
- **Policy Statuses**: DRAFT, ACTIVE, DEPRECATED, ARCHIVED

### 🛡️ **Advanced Enforcement Engine**
- **Real-time Policy Enforcement**: Evaluate agent actions against active policies
- **Rule Evaluation**: Flexible rule matching and evaluation system
- **Sensitive Data Detection**: Automatic detection of SSN, credit cards, emails
- **Data Redaction**: Automatic redaction in modify decisions
- **Decision Logging**: Complete audit trail of all policy decisions

### 🔧 **Extension Design Pattern**
- **Constitutional Hooks Integration**: beforeAgentAction, afterAgentAction, beforeAgentInteraction, beforeAgentDelegation
- **Backwards Compatibility**: Graceful degradation and fallback schemas
- **Extensible Configuration**: All features can be enabled/disabled via config
- **Modular Architecture**: Clean separation of concerns

### 📊 **Exemption Management**
- **Exemption Workflows**: Create, approve, reject, and expire exemptions
- **Approval Process**: Configurable approval workflows
- **Automatic Expiry**: Time-based exemption expiration
- **Audit Trail**: Complete logging of exemption lifecycle

### 💾 **Data Persistence**
- **File-based Storage**: Organized storage in policies/, exemptions/, decisions/ subdirectories
- **Backup & Recovery**: Automated backup with configurable retention
- **Data Loading**: Automatic loading of persisted data on initialization
- **Error Handling**: Graceful handling of corrupted or missing files

## Installation

```bash
npm install @promethios/policy-management
```

## Quick Start

```javascript
const { PolicyManagement } = require('@promethios/policy-management');

// Initialize with basic configuration
const policyManager = new PolicyManagement({
  logger: console,
  config: {
    dataPath: './data/policies',
    enablePolicyEnforcement: true,
    defaultEnforcementLevel: 'MODERATE'
  }
});

// Create a security policy
const securityPolicy = policyManager.createPolicy({
  name: 'File Access Security Policy',
  description: 'Restricts file deletion operations',
  policy_type: 'SECURITY',
  status: 'ACTIVE',
  enforcement_level: 'STRICT',
  rules: [
    {
      condition: 'deny_all',
      action_type: 'file_delete'
    }
  ]
});

// Enforce policy on an agent action
const decision = policyManager.enforcePolicy({
  agent_id: 'agent_123',
  action_type: 'file_delete',
  filename: 'important.txt'
});

console.log(decision);
// Output: { action: 'deny', reason: 'Strict policy violations: policy_abc123' }
```

## Configuration Options

```javascript
const config = {
  // Data storage path
  dataPath: './data/policy_management',
  
  // Default enforcement level for new policies
  defaultEnforcementLevel: 'MODERATE', // 'STRICT', 'MODERATE', 'ADVISORY'
  
  // Enable/disable policy enforcement
  enablePolicyEnforcement: true,
  
  // Exemption expiry in days
  exemptionExpiryDays: 30,
  
  // Backup retention in days
  backupRetentionDays: 90
};
```

## Policy Types

### Security Policies
```javascript
const securityPolicy = {
  name: 'Data Access Control',
  policy_type: 'SECURITY',
  enforcement_level: 'STRICT',
  rules: [
    {
      condition: 'require_approval',
      action_type: 'data_access',
      agent_pattern: '^external_.*'
    }
  ]
};
```

### Compliance Policies
```javascript
const compliancePolicy = {
  name: 'GDPR Data Protection',
  policy_type: 'COMPLIANCE',
  enforcement_level: 'MODERATE',
  rules: [
    {
      condition: 'sensitive_data_check',
      action_type: 'data_export'
    }
  ]
};
```

### Operational Policies
```javascript
const operationalPolicy = {
  name: 'Resource Usage Limits',
  policy_type: 'OPERATIONAL',
  enforcement_level: 'ADVISORY',
  rules: [
    {
      condition: 'resource_check',
      action_type: 'compute_intensive'
    }
  ]
};
```

## Rule Conditions

### Built-in Conditions
- **`deny_all`**: Denies all matching actions
- **`require_approval`**: Requires explicit approval
- **`sensitive_data_check`**: Checks for sensitive data patterns
- **`resource_check`**: Validates resource usage

### Custom Conditions
```javascript
// Extend the evaluateRule method for custom conditions
policyManager.evaluateRule = function(rule, actionData) {
  if (rule.condition === 'custom_business_logic') {
    // Implement your custom logic here
    return { passed: true/false, reason: 'explanation' };
  }
  
  // Fall back to default evaluation
  return this.constructor.prototype.evaluateRule.call(this, rule, actionData);
};
```

## Constitutional Hooks Integration

```javascript
const hooksManager = {
  register: (hookName, callback) => {
    // Register hook with your constitutional framework
  }
};

const policyManager = new PolicyManagement({
  hooks: hooksManager,
  config: { /* ... */ }
});

// Hooks are automatically registered:
// - beforeAgentAction: Policy enforcement
// - afterAgentAction: Decision logging
// - beforeAgentInteraction: Interaction policies
// - beforeAgentDelegation: Delegation policies
```

## Exemption Management

```javascript
// Create an exemption
const exemption = policyManager.createExemption({
  policy_id: 'policy_abc123',
  agent_id: 'trusted_agent_456',
  reason: 'Emergency maintenance operation',
  expires_at: '2024-12-31T23:59:59Z'
});

// Approve exemption
const approvedExemption = policyManager.updateExemption(exemption.exemption_id, {
  status: 'APPROVED',
  approved_by: 'admin_user'
});
```

## Statistics and Monitoring

```javascript
const stats = policyManager.getStatistics();
console.log(stats);
// Output:
// {
//   total_policies: 15,
//   active_policies: 12,
//   draft_policies: 3,
//   total_exemptions: 5,
//   pending_exemptions: 2,
//   total_decisions: 1247,
//   recent_decisions: 23
// }
```

## Backup and Recovery

```javascript
// Create backup
const backupSuccess = policyManager.backupData();

// Backups are stored in: {dataPath}/backups/{timestamp}/
// - policies.json
// - exemptions.json  
// - decisions.json
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:enforcement
npm run test:compatibility

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## API Reference

### PolicyManagement Class

#### Constructor
```javascript
new PolicyManagement({ logger, config, hooks })
```

#### Policy Methods
- `createPolicy(policyData)` - Create a new policy
- `getPolicy(policyId)` - Retrieve a policy by ID
- `listPolicies(filters)` - List policies with optional filtering
- `updatePolicy(policyId, updates)` - Update an existing policy
- `deletePolicy(policyId)` - Archive a policy

#### Enforcement Methods
- `enforcePolicy(actionData)` - Enforce policies on an action
- `evaluateRule(rule, actionData)` - Evaluate a single rule
- `getApplicablePolicies(actionData)` - Get policies that apply to an action

#### Exemption Methods
- `createExemption(exemptionData)` - Create a policy exemption
- `updateExemption(exemptionId, updates)` - Update an exemption
- `listExemptions(filters)` - List exemptions with filtering

#### Utility Methods
- `getStatistics()` - Get policy system statistics
- `backupData()` - Create a backup of all data
- `loadData()` - Load data from files

## Error Handling

The module uses a consistent error handling pattern:

```javascript
const result = policyManager.createPolicy(policyData);

if (result.success) {
  console.log('Policy created:', result.policy_id);
  console.log('Policy data:', result.policy);
} else {
  console.error('Error creating policy:', result.error);
}
```

## Backwards Compatibility

The module is designed for backwards compatibility:

- **Fallback Schemas**: Works without external schema files
- **Graceful Degradation**: Handles missing dependencies
- **Configuration Flexibility**: All features can be disabled
- **Error Resilience**: Never throws exceptions, always returns error objects

## Performance Considerations

- **Memory Efficient**: Policies are loaded on-demand
- **File-based Storage**: No database dependencies
- **Configurable Caching**: Policies cached in memory for fast access
- **Batch Operations**: Efficient handling of multiple policies

## Security Features

- **Input Validation**: All inputs validated against schemas
- **Sensitive Data Detection**: Automatic detection of PII
- **Data Redaction**: Automatic redaction capabilities
- **Audit Trail**: Complete logging of all operations
- **Access Control**: Policy-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: https://github.com/wesheets/promethios/issues
- Documentation: https://github.com/wesheets/promethios#readme

