#!/bin/bash
# Deployment script for Phase 6.3 Implementation

# Configuration
ENV=${1:-development}  # Default to development environment if not specified
CONFIG_DIR="./config/environments"
CONFIG_FILE="$CONFIG_DIR/$ENV.json"
DEPLOY_DIR="./deploy"
LOGS_DIR="$DEPLOY_DIR/logs"
BACKUP_DIR="$DEPLOY_DIR/backups"

# Create necessary directories
mkdir -p $LOGS_DIR
mkdir -p $BACKUP_DIR

echo "Starting deployment for $ENV environment..."
echo "Using configuration: $CONFIG_FILE"

# Check if configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Configuration file $CONFIG_FILE not found!"
    exit 1
fi

# Create a backup of the current deployment
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$ENV_$TIMESTAMP.tar.gz"
echo "Creating backup: $BACKUP_FILE"
tar -czf $BACKUP_FILE ./src ./config

# Run tests before deployment
echo "Running tests before deployment..."
./run_tests.py --no-coverage
if [ $? -ne 0 ]; then
    echo "Tests failed! Aborting deployment."
    exit 1
fi

# Deploy components
echo "Deploying components..."

# 1. Access Tier Management System
echo "Deploying Access Tier Management System..."
cp -r ./src/access_tier $DEPLOY_DIR/
echo "Access Tier Management System deployed."

# 2. API Gateway
echo "Deploying API Gateway..."
cp -r ./src/api_gateway $DEPLOY_DIR/
echo "API Gateway deployed."

# 3. Progressive Access Workflow
echo "Deploying Progressive Access Workflow..."
cp -r ./src/progressive_access $DEPLOY_DIR/
echo "Progressive Access Workflow deployed."

# 4. Developer Portal
echo "Deploying Developer Portal..."
cp -r ./src/developer_portal $DEPLOY_DIR/
echo "Developer Portal deployed."

# 5. Developer Sandbox
echo "Deploying Developer Sandbox Environment..."
cp -r ./src/sandbox $DEPLOY_DIR/
echo "Developer Sandbox Environment deployed."

# 6. Feedback and Telemetry System
echo "Deploying Feedback and Telemetry System..."
cp -r ./src/feedback $DEPLOY_DIR/
echo "Feedback and Telemetry System deployed."

# 7. Agent Preference Elicitation
echo "Deploying Agent Preference Elicitation..."
cp -r ./src/agent_preference $DEPLOY_DIR/
echo "Agent Preference Elicitation deployed."

# 8. Client Libraries
echo "Deploying Client Libraries..."
cp -r ./src/client_libraries $DEPLOY_DIR/
echo "Client Libraries deployed."

# 9. Configuration
echo "Deploying Configuration..."
cp -r ./config $DEPLOY_DIR/
echo "Configuration deployed."

# 10. Documentation
echo "Deploying Documentation..."
cp -r ./docs $DEPLOY_DIR/
echo "Documentation deployed."

# Create deployment report
echo "Creating deployment report..."
cat > $DEPLOY_DIR/deployment_report.txt << EOF
Phase 6.3 Deployment Report
==========================
Environment: $ENV
Timestamp: $(date)
Configuration: $CONFIG_FILE
Backup: $BACKUP_FILE

Components Deployed:
- Access Tier Management System
- API Gateway
- Progressive Access Workflow
- Developer Portal
- Developer Sandbox Environment
- Feedback and Telemetry System
- Agent Preference Elicitation
- Client Libraries
- Configuration
- Documentation

Deployment Status: SUCCESS
EOF

echo "Deployment completed successfully!"
echo "Deployment report available at: $DEPLOY_DIR/deployment_report.txt"
