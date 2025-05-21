# Promethios Operator Runbook

## Overview

This operator runbook provides comprehensive guidance for enterprise operators managing the Promethios system with Phase 5.15 (Kernel Lockdown and Enhancement) implementation. It covers installation, configuration, monitoring, troubleshooting, recovery procedures, and compliance management.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Installation and Setup](#installation-and-setup)
3. [Configuration](#configuration)
4. [Monitoring and Alerting](#monitoring-and-alerting)
5. [Routine Operations](#routine-operations)
6. [Troubleshooting](#troubleshooting)
7. [Recovery Procedures](#recovery-procedures)
8. [Security Management](#security-management)
9. [Compliance Management](#compliance-management)
10. [Performance Tuning](#performance-tuning)
11. [Backup and Restore](#backup-and-restore)
12. [Upgrading](#upgrading)
13. [Appendices](#appendices)

## System Architecture

### Core Components

The Promethios system consists of the following core components:

1. **Distributed Consensus Mechanism**: Provides Byzantine fault-tolerant consensus for governance decisions
2. **Governance Recovery Mechanisms**: Enables automated recovery from governance failures
3. **Cryptographic Agility Framework**: Provides flexible cryptographic operations with algorithm agility
4. **Formal Verification Framework**: Verifies governance properties and system integrity
5. **Cross-System Governance Interoperability**: Enables interaction with external governance systems
6. **API Governance Framework**: Provides secure third-party developer access
7. **Meta-Governance Framework**: Enables reflective and adaptive governance

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Promethios System                         │
│                                                                 │
│  ┌───────────────────┐       ┌───────────────────────────────┐  │
│  │                   │       │                               │  │
│  │    Consensus      │◄─────►│       Recovery                │  │
│  │    Mechanism      │       │       Mechanisms              │  │
│  │                   │       │                               │  │
│  └─────────┬─────────┘       └───────────┬───────────────────┘  │
│            │                             │                      │
│            │                             │                      │
│            ▼                             ▼                      │
│  ┌───────────────────┐       ┌───────────────────────────────┐  │
│  │                   │       │                               │  │
│  │   Cryptographic   │◄─────►│       Verification            │  │
│  │   Agility         │       │       Framework               │  │
│  │                   │       │                               │  │
│  └─────────┬─────────┘       └───────────┬───────────────────┘  │
│            │                             │                      │
│            │                             │                      │
│            ▼                             ▼                      │
│  ┌───────────────────┐       ┌───────────────────────────────┐  │
│  │                   │       │                               │  │
│  │   Interoperability│◄─────►│       API Governance          │  │
│  │   Framework       │       │       Framework               │  │
│  │                   │       │                               │  │
│  └─────────┬─────────┘       └───────────┬───────────────────┘  │
│            │                             │                      │
│            │                             │                      │
│            └─────────────┬───────────────┘                      │
│                          │                                      │
│                          ▼                                      │
│            ┌───────────────────────────────┐                    │
│            │                               │                    │
│            │     Meta-Governance           │                    │
│            │     Framework                 │                    │
│            │                               │                    │
│            └───────────────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Installation and Setup

### System Requirements

- **Hardware**:
  - CPU: 8+ cores, 3.0+ GHz
  - RAM: 32+ GB
  - Storage: 500+ GB SSD
  - Network: 1+ Gbps

- **Software**:
  - Operating System: Ubuntu 20.04 LTS or later
  - Java: OpenJDK 17 or later
  - Python: 3.9 or later
  - Docker: 20.10 or later
  - Kubernetes: 1.23 or later

### Installation Steps

1. **Prepare Environment**:
   ```bash
   sudo apt update
   sudo apt upgrade -y
   sudo apt install -y openjdk-17-jdk python3.9 python3.9-venv python3-pip docker.io
   ```

2. **Install Kubernetes**:
   ```bash
   sudo apt install -y apt-transport-https curl
   curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
   echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
   sudo apt update
   sudo apt install -y kubelet kubeadm kubectl
   sudo apt-mark hold kubelet kubeadm kubectl
   ```

3. **Initialize Kubernetes Cluster**:
   ```bash
   sudo kubeadm init --pod-network-cidr=10.244.0.0/16
   mkdir -p $HOME/.kube
   sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
   sudo chown $(id -u):$(id -g) $HOME/.kube/config
   ```

4. **Install Promethios**:
   ```bash
   git clone https://github.com/promethios/promethios.git
   cd promethios
   ./install.sh --enterprise
   ```

5. **Verify Installation**:
   ```bash
   kubectl get pods -n promethios
   ./promethios-cli status
   ```

## Configuration

### Core Configuration

The main configuration file is located at `/etc/promethios/config.yaml`. Key configuration sections include:

#### Consensus Configuration

```yaml
consensus:
  protocol: pbft
  nodes: 5
  timeout_ms: 5000
  max_retries: 3
  quorum_type: majority
```

#### Recovery Configuration

```yaml
recovery:
  failure_detection:
    enabled: true
    check_interval_ms: 1000
  recovery_plans:
    enabled: true
    max_attempts: 3
  audit:
    enabled: true
    log_level: info
```

#### Cryptographic Configuration

```yaml
crypto:
  default_hash: sha256
  default_symmetric: aes256
  default_asymmetric: rsa2048
  default_signature: ecdsa
  key_rotation:
    enabled: true
    interval_days: 90
```

#### Verification Configuration

```yaml
verification:
  consensus:
    enabled: true
    verification_interval_ms: 5000
  trust:
    enabled: true
    verification_interval_ms: 10000
  governance:
    enabled: true
    verification_interval_ms: 15000
  crypto:
    enabled: true
    verification_interval_ms: 20000
  system:
    enabled: true
    verification_interval_ms: 30000
```

#### Interoperability Configuration

```yaml
interoperability:
  enabled: true
  protocols:
    - name: promethios_native
      enabled: true
    - name: governance_exchange
      enabled: true
    - name: open_governance
      enabled: true
    - name: enterprise_governance
      enabled: true
```

#### API Governance Configuration

```yaml
api_governance:
  enabled: true
  authentication:
    methods:
      - api_key
      - oauth2
    token_expiry_hours: 24
  policy_enforcement:
    enabled: true
    default_policy: deny
  compliance_monitoring:
    enabled: true
    frameworks:
      - soc2
      - iso27001
      - gdpr
      - hipaa
```

#### Meta-Governance Configuration

```yaml
meta_governance:
  enabled: true
  reflection_loops:
    enabled: true
    log_level: info
  state_monitoring:
    enabled: true
    check_interval_ms: 1000
  policy_adaptation:
    enabled: true
    adaptation_interval_ms: 60000
  compliance_verification:
    enabled: true
    verification_interval_ms: 3600000
  recovery_triggers:
    enabled: true
    check_interval_ms: 1000
```

### Configuration Management

Use the Promethios CLI to manage configuration:

```bash
# View current configuration
./promethios-cli config show

# Update configuration
./promethios-cli config set consensus.timeout_ms 10000

# Validate configuration
./promethios-cli config validate
```

## Monitoring and Alerting

### Monitoring Components

Promethios exposes metrics through Prometheus endpoints and provides dashboards through Grafana.

#### Key Metrics

- **Consensus Metrics**:
  - Decision throughput
  - Decision latency
  - Quorum formation time
  - Byzantine node detections

- **Recovery Metrics**:
  - Failure detections
  - Recovery operations
  - Recovery success rate
  - Recovery time

- **Cryptographic Metrics**:
  - Operation throughput
  - Key rotation events
  - Algorithm usage distribution
  - Cryptographic errors

- **Verification Metrics**:
  - Verification operations
  - Verification success rate
  - Verification time
  - Property violations

- **Interoperability Metrics**:
  - External system connections
  - Message throughput
  - Protocol distribution
  - Interoperability errors

- **API Governance Metrics**:
  - API requests
  - Authentication operations
  - Policy evaluations
  - Compliance violations

- **Meta-Governance Metrics**:
  - Reflection loops
  - Governance health
  - Policy adaptations
  - Recovery triggers

### Setting Up Monitoring

1. **Access Grafana Dashboard**:
   ```
   http://<promethios-host>:3000
   ```

2. **Configure Alerting**:
   ```bash
   ./promethios-cli alerts setup --email admin@example.com
   ```

3. **Test Alerting**:
   ```bash
   ./promethios-cli alerts test
   ```

## Routine Operations

### Daily Operations

1. **Check System Status**:
   ```bash
   ./promethios-cli status
   ```

2. **Review Logs**:
   ```bash
   ./promethios-cli logs --component all --level warning --last 24h
   ```

3. **Check Alerts**:
   ```bash
   ./promethios-cli alerts list --active
   ```

### Weekly Operations

1. **Review Performance Metrics**:
   ```bash
   ./promethios-cli metrics report --last 7d
   ```

2. **Check Compliance Status**:
   ```bash
   ./promethios-cli compliance status
   ```

3. **Review Security Events**:
   ```bash
   ./promethios-cli security events --last 7d
   ```

### Monthly Operations

1. **Run Full System Verification**:
   ```bash
   ./promethios-cli verify --all
   ```

2. **Generate Compliance Reports**:
   ```bash
   ./promethios-cli compliance report --framework all
   ```

3. **Review and Rotate Access Credentials**:
   ```bash
   ./promethios-cli security credentials --list
   ./promethios-cli security credentials --rotate
   ```

## Troubleshooting

### Common Issues and Resolutions

#### Consensus Failures

**Symptoms**:
- Decision timeouts
- Quorum formation failures
- Byzantine node detections

**Resolution**:
```bash
# Check consensus status
./promethios-cli consensus status

# Identify problematic nodes
./promethios-cli consensus nodes --health

# Restart consensus service
./promethios-cli service restart consensus
```

#### Recovery Failures

**Symptoms**:
- Failed recovery operations
- Persistent component failures
- Recovery timeout errors

**Resolution**:
```bash
# Check recovery status
./promethios-cli recovery status

# View recovery logs
./promethios-cli logs --component recovery --level error

# Manually trigger recovery
./promethios-cli recovery trigger --component <component>
```

#### Cryptographic Failures

**Symptoms**:
- Cryptographic operation errors
- Key rotation failures
- Algorithm selection errors

**Resolution**:
```bash
# Check crypto status
./promethios-cli crypto status

# Verify key availability
./promethios-cli crypto keys --list

# Manually rotate keys
./promethios-cli crypto keys --rotate
```

#### Verification Failures

**Symptoms**:
- Property verification failures
- Verification timeouts
- Inconsistent verification results

**Resolution**:
```bash
# Check verification status
./promethios-cli verify status

# Run specific verification
./promethios-cli verify --component <component>

# Reset verification state
./promethios-cli verify reset
```

#### Interoperability Failures

**Symptoms**:
- Connection failures with external systems
- Protocol errors
- Message exchange failures

**Resolution**:
```bash
# Check interoperability status
./promethios-cli interop status

# Test specific connection
./promethios-cli interop test --system <system>

# Restart interoperability service
./promethios-cli service restart interop
```

#### API Governance Failures

**Symptoms**:
- API authentication failures
- Policy enforcement errors
- Compliance monitoring failures

**Resolution**:
```bash
# Check API governance status
./promethios-cli api status

# Test API authentication
./promethios-cli api auth --test

# Restart API governance service
./promethios-cli service restart api
```

#### Meta-Governance Failures

**Symptoms**:
- Reflection loop failures
- Governance state monitoring errors
- Policy adaptation failures
- Recovery trigger failures

**Resolution**:
```bash
# Check meta-governance status
./promethios-cli meta status

# View meta-governance logs
./promethios-cli logs --component meta --level error

# Restart meta-governance service
./promethios-cli service restart meta
```

### Diagnostic Tools

1. **System Diagnostics**:
   ```bash
   ./promethios-cli diagnostics --all
   ```

2. **Component Health Check**:
   ```bash
   ./promethios-cli health --component <component>
   ```

3. **Log Analysis**:
   ```bash
   ./promethios-cli logs analyze --pattern "error|failure|exception"
   ```

## Recovery Procedures

### Automated Recovery

Promethios includes automated recovery mechanisms for most failure scenarios. These are managed by the Recovery Manager and triggered by the Meta-Governance Framework.

To view active recovery plans:
```bash
./promethios-cli recovery plans --list
```

To view recovery history:
```bash
./promethios-cli recovery history --last 7d
```

### Manual Recovery Procedures

#### Consensus Recovery

1. **Identify Failed Nodes**:
   ```bash
   ./promethios-cli consensus nodes --health
   ```

2. **Remove Failed Nodes**:
   ```bash
   ./promethios-cli consensus nodes --remove <node-id>
   ```

3. **Add Replacement Nodes**:
   ```bash
   ./promethios-cli consensus nodes --add <node-config>
   ```

4. **Verify Consensus Health**:
   ```bash
   ./promethios-cli consensus verify
   ```

#### State Recovery

1. **Identify Corrupted State**:
   ```bash
   ./promethios-cli state verify
   ```

2. **Restore from Backup**:
   ```bash
   ./promethios-cli state restore --backup <backup-id>
   ```

3. **Verify State Integrity**:
   ```bash
   ./promethios-cli state verify
   ```

#### Cryptographic Recovery

1. **Identify Compromised Keys**:
   ```bash
   ./promethios-cli crypto keys --verify
   ```

2. **Revoke Compromised Keys**:
   ```bash
   ./promethios-cli crypto keys --revoke <key-id>
   ```

3. **Generate New Keys**:
   ```bash
   ./promethios-cli crypto keys --generate
   ```

4. **Update Key References**:
   ```bash
   ./promethios-cli crypto keys --update-refs
   ```

#### System-Wide Recovery

1. **Stop All Services**:
   ```bash
   ./promethios-cli service stop --all
   ```

2. **Restore from System Backup**:
   ```bash
   ./promethios-cli system restore --backup <backup-id>
   ```

3. **Start All Services**:
   ```bash
   ./promethios-cli service start --all
   ```

4. **Verify System Health**:
   ```bash
   ./promethios-cli health --all
   ```

## Security Management

### Access Control

Promethios uses role-based access control (RBAC) for administrative access.

To manage roles:
```bash
# List roles
./promethios-cli security roles --list

# Create role
./promethios-cli security roles --create <role-config>

# Assign role to user
./promethios-cli security users --assign-role <user> <role>
```

### Key Management

Cryptographic keys are managed by the Cryptographic Agility Framework.

To manage keys:
```bash
# List keys
./promethios-cli crypto keys --list

# Generate new key
./promethios-cli crypto keys --generate <key-type>

# Rotate keys
./promethios-cli crypto keys --rotate
```

### Audit Logging

All security-relevant operations are logged to secure audit logs.

To view audit logs:
```bash
# View security audit logs
./promethios-cli logs --audit --security --last 24h

# Export audit logs
./promethios-cli logs --audit --export <output-file>
```

## Compliance Management

### Compliance Frameworks

Promethios supports the following compliance frameworks:

- SOC2
- ISO 27001
- GDPR
- HIPAA

### Compliance Verification

To verify compliance:
```bash
# Verify compliance with all frameworks
./promethios-cli compliance verify --all

# Verify compliance with specific framework
./promethios-cli compliance verify --framework <framework>
```

### Compliance Reporting

To generate compliance reports:
```bash
# Generate reports for all frameworks
./promethios-cli compliance report --all

# Generate report for specific framework
./promethios-cli compliance report --framework <framework>
```

## Performance Tuning

### Resource Allocation

Adjust resource allocation based on system load:
```bash
# View current resource allocation
./promethios-cli resources show

# Update resource allocation
./promethios-cli resources update --component <component> --cpu <cpu-units> --memory <memory-units>
```

### Scaling

Scale components based on load:
```bash
# Scale consensus nodes
./promethios-cli scale consensus --nodes <node-count>

# Scale API servers
./promethios-cli scale api --replicas <replica-count>
```

### Performance Optimization

Optimize performance parameters:
```bash
# Run performance optimization
./promethios-cli optimize --auto

# Apply specific optimizations
./promethios-cli optimize --component <component> --param <param> --value <value>
```

## Backup and Restore

### Backup Procedures

Schedule regular backups:
```bash
# Configure backup schedule
./promethios-cli backup schedule --daily 2:00 --retention 30d

# Trigger manual backup
./promethios-cli backup create --full
```

### Restore Procedures

Restore from backup when needed:
```bash
# List available backups
./promethios-cli backup list

# Restore from specific backup
./promethios-cli backup restore --id <backup-id>
```

## Upgrading

### Upgrade Preparation

1. **Check Compatibility**:
   ```bash
   ./promethios-cli upgrade check --version <target-version>
   ```

2. **Create Pre-Upgrade Backup**:
   ```bash
   ./promethios-cli backup create --pre-upgrade
   ```

3. **Review Upgrade Notes**:
   ```bash
   ./promethios-cli upgrade notes --version <target-version>
   ```

### Upgrade Execution

1. **Download Upgrade Package**:
   ```bash
   ./promethios-cli upgrade download --version <target-version>
   ```

2. **Apply Upgrade**:
   ```bash
   ./promethios-cli upgrade apply --version <target-version>
   ```

3. **Verify Upgrade**:
   ```bash
   ./promethios-cli upgrade verify
   ```

## Appendices

### Command Reference

Complete CLI command reference:
```bash
./promethios-cli help
```

### Configuration Reference

Complete configuration reference:
```bash
./promethios-cli config reference
```

### Log Reference

Log format and field reference:
```bash
./promethios-cli logs reference
```

### Metric Reference

Complete metric reference:
```bash
./promethios-cli metrics reference
```

### API Reference

API documentation:
```bash
./promethios-cli api docs
```

### Troubleshooting Reference

Comprehensive troubleshooting guide:
```bash
./promethios-cli troubleshoot guide
```
