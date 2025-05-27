# Agent Scorecard Operator Guide

## Introduction

This operator guide provides comprehensive instructions for deploying, configuring, and managing the Agent Scorecard and Trust Lineage system in Promethios. This system provides cryptographically verifiable trust metrics for agents, enabling objective evaluation of agent reliability, compliance, and governance adherence.

## Deployment Requirements

- Promethios version 7.4 or higher
- Node.js 16.x or higher
- Access to the Promethios configuration system
- Cryptographic key management infrastructure

## Installation

The Agent Scorecard system is included in Promethios 8.0 and higher. If you're upgrading from an earlier version, follow these steps:

1. **Update Promethios**:
   ```bash
   git pull origin main
   npm install
   ```

2. **Initialize the Agent Scorecard system**:
   ```bash
   ./promethios-cli module init agent-scorecard
   ```

3. **Generate cryptographic keys**:
   ```bash
   ./promethios-cli crypto generate-keys --module agent-scorecard
   ```

4. **Verify installation**:
   ```bash
   ./promethios-cli module status agent-scorecard
   ```

## Configuration

### Core Configuration

The main configuration file is located at `/etc/promethios/modules/agent_scorecard/config.yaml`. Key configuration sections include:

```yaml
agent_scorecard:
  enabled: true
  storage:
    dir: /var/lib/promethios/data/scorecards
    history_limit: 100
  crypto:
    algorithm: ed25519
    key_dir: /var/lib/promethios/data/keys
    merkle_verification: true
  api:
    enabled: true
    base_path: /api/agent/scorecard
    public_access: true
  thresholds:
    warning: 0.6
    minimum_delegation: 0.7
  observers:
    prism_integration: true
    vigil_integration: true
```

### Configuration Management

Use the Promethios CLI to manage configuration:

```bash
# View current configuration
./promethios-cli config show agent-scorecard

# Update configuration
./promethios-cli config set agent-scorecard.thresholds.warning 0.7

# Validate configuration
./promethios-cli config validate agent-scorecard
```

## Monitoring

### Key Metrics

Monitor the following metrics to ensure proper operation:

- **Scorecard Generation Rate**: Number of scorecards generated per minute
- **Verification Success Rate**: Percentage of successful verifications
- **Trust Delegation Rate**: Number of trust delegations per hour
- **API Request Rate**: Number of API requests per minute
- **Storage Usage**: Disk space used by scorecard storage

### Setting Up Monitoring

1. **Configure Prometheus metrics**:
   ```bash
   ./promethios-cli metrics enable agent-scorecard
   ```

2. **Import Grafana dashboard**:
   ```bash
   ./promethios-cli dashboard import agent-scorecard
   ```

3. **Set up alerts**:
   ```bash
   ./promethios-cli alerts setup agent-scorecard
   ```

## Routine Operations

### Daily Operations

1. **Check system status**:
   ```bash
   ./promethios-cli module status agent-scorecard
   ```

2. **Review verification failures**:
   ```bash
   ./promethios-cli agent-scorecard verification-failures --last 24h
   ```

3. **Monitor warning states**:
   ```bash
   ./promethios-cli agent-scorecard warnings --active
   ```

### Weekly Operations

1. **Review trust metrics**:
   ```bash
   ./promethios-cli agent-scorecard metrics --last 7d
   ```

2. **Check storage usage**:
   ```bash
   ./promethios-cli agent-scorecard storage-usage
   ```

3. **Verify cryptographic integrity**:
   ```bash
   ./promethios-cli agent-scorecard verify-integrity
   ```

### Monthly Operations

1. **Rotate cryptographic keys**:
   ```bash
   ./promethios-cli crypto rotate-keys --module agent-scorecard
   ```

2. **Generate trust reports**:
   ```bash
   ./promethios-cli agent-scorecard report --monthly
   ```

3. **Prune historical data**:
   ```bash
   ./promethios-cli agent-scorecard prune-history --older-than 90d
   ```

## Troubleshooting

### Common Issues and Resolutions

#### Scorecard Generation Failures

**Symptoms**:
- Failed scorecard generation
- Missing scorecard data
- Incomplete metrics

**Resolution**:
```bash
# Check scorecard generation logs
./promethios-cli logs --component agent-scorecard --level error

# Verify observer connections
./promethios-cli agent-scorecard check-observers

# Restart scorecard service
./promethios-cli service restart agent-scorecard
```

#### Verification Failures

**Symptoms**:
- Cryptographic verification errors
- Invalid signatures
- Merkle root mismatches

**Resolution**:
```bash
# Check cryptographic verifier logs
./promethios-cli logs --component agent-scorecard.crypto --level error

# Verify key integrity
./promethios-cli crypto verify-keys --module agent-scorecard

# Regenerate problematic scorecards
./promethios-cli agent-scorecard regenerate --agent <agent-id>
```

#### Trust Delegation Issues

**Symptoms**:
- Failed trust delegations
- Missing lineage records
- Delegation permission errors

**Resolution**:
```bash
# Check trust lineage logs
./promethios-cli logs --component agent-scorecard.lineage --level error

# Verify delegation requirements
./promethios-cli agent-scorecard check-delegation --source <source-id> --target <target-id>

# Manually record delegation if needed
./promethios-cli agent-scorecard record-delegation --source <source-id> --target <target-id>
```

#### API Access Issues

**Symptoms**:
- API endpoint errors
- Authentication failures
- Rate limiting errors

**Resolution**:
```bash
# Check API logs
./promethios-cli logs --component agent-scorecard.api --level error

# Verify API configuration
./promethios-cli config show agent-scorecard.api

# Restart API service
./promethios-cli service restart agent-scorecard.api
```

### Diagnostic Tools

1. **Scorecard validator**:
   ```bash
   ./promethios-cli agent-scorecard validate --agent <agent-id>
   ```

2. **Cryptographic verifier**:
   ```bash
   ./promethios-cli agent-scorecard verify --agent <agent-id>
   ```

3. **Trust lineage explorer**:
   ```bash
   ./promethios-cli agent-scorecard lineage --agent <agent-id>
   ```

## Backup and Recovery

### Backup Procedures

1. **Backup scorecard data**:
   ```bash
   ./promethios-cli backup create --module agent-scorecard
   ```

2. **Backup cryptographic keys**:
   ```bash
   ./promethios-cli crypto backup-keys --module agent-scorecard
   ```

3. **Schedule regular backups**:
   ```bash
   ./promethios-cli backup schedule --module agent-scorecard --interval daily
   ```

### Recovery Procedures

1. **Restore from backup**:
   ```bash
   ./promethios-cli backup restore --module agent-scorecard --backup <backup-id>
   ```

2. **Restore cryptographic keys**:
   ```bash
   ./promethios-cli crypto restore-keys --module agent-scorecard --backup <backup-id>
   ```

3. **Verify restoration**:
   ```bash
   ./promethios-cli agent-scorecard verify-integrity
   ```

## Security Best Practices

1. **Protect cryptographic keys**:
   - Store keys in a secure location
   - Implement proper access controls
   - Regularly rotate keys

2. **Secure API endpoints**:
   - Enable authentication for sensitive operations
   - Implement rate limiting
   - Use HTTPS for all communications

3. **Monitor for tampering**:
   - Set up alerts for verification failures
   - Regularly verify cryptographic integrity
   - Log all scorecard operations

4. **Implement access controls**:
   - Restrict scorecard modification to authorized users
   - Implement role-based access control
   - Audit all access to scorecard data

## Compliance and Auditing

1. **Generate compliance reports**:
   ```bash
   ./promethios-cli agent-scorecard compliance-report
   ```

2. **Audit scorecard operations**:
   ```bash
   ./promethios-cli agent-scorecard audit-log --last 30d
   ```

3. **Verify governance compliance**:
   ```bash
   ./promethios-cli agent-scorecard governance-check
   ```

## Upgrading

When upgrading the Agent Scorecard system, follow these steps:

1. **Backup current data**:
   ```bash
   ./promethios-cli backup create --module agent-scorecard
   ```

2. **Update Promethios**:
   ```bash
   git pull origin main
   npm install
   ```

3. **Run migrations**:
   ```bash
   ./promethios-cli migrate --module agent-scorecard
   ```

4. **Verify upgrade**:
   ```bash
   ./promethios-cli module status agent-scorecard
   ```

## Conclusion

The Agent Scorecard and Trust Lineage system provides a robust, verifiable, and objective framework for evaluating agent trust in the Promethios ecosystem. By following this operator guide, you can ensure proper deployment, configuration, and management of this critical system.

For additional assistance, refer to the comprehensive documentation or contact Promethios support.
