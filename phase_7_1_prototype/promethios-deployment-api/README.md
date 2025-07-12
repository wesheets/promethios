# Promethios Deployment API

A dedicated microservice for handling agent deployment operations in the Promethios platform.

## Overview

The Promethios Deployment API provides endpoints for:
- Agent deployment and undeployment
- API key generation for deployed agents
- Deployment status monitoring
- System-wide deployment metrics
- Alert management and monitoring
- Agent restart and management operations

## Features

- **Agent Deployment**: Deploy agents to production environments
- **API Key Management**: Generate and manage API keys for deployed agents
- **Health Monitoring**: Real-time health checks and status monitoring
- **Metrics Collection**: Comprehensive deployment analytics and statistics
- **Alert System**: Proactive monitoring with severity-based alerts
- **Agent Management**: Restart, scaling, and operational controls

## API Endpoints

### Core Deployment
- `POST /v1/agents/deploy` - Deploy an agent
- `POST /v1/agents/<agent_id>/undeploy` - Undeploy an agent
- `GET /v1/agents/<agent_id>/deployment-status` - Get deployment status

### API Key Management
- `POST /v1/agents/<agent_id>/api-key` - Generate API key for agent

### User Management
- `GET /v1/users/<user_id>/deployed-agents` - Get user's deployed agents

### Monitoring & Analytics
- `GET /v1/deployments/metrics` - Get system-wide deployment metrics
- `GET /v1/deployments/alerts` - Get active alerts and warnings
- `POST /v1/agents/<agent_id>/restart` - Restart a deployed agent

### Health Check
- `GET /health` - Service health check

## Environment Variables

### Required
- `PORT` - Port to run the service on (default: 5000)
- `HOST` - Host to bind to (default: 0.0.0.0)

### Optional
- `ENVIRONMENT` - Environment name (development/staging/production)
- `DEBUG` - Enable debug mode (true/false)
- `FLASK_ENV` - Flask environment setting

## Deployment

### Local Development
```bash
pip install -r requirements.txt
python app.py
```

### Render Deployment
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `python app.py`
5. Set health check path: `/health`
6. Configure environment variables as needed

## Architecture

This service is designed as a microservice to handle deployment operations separately from the main Promethios API. This separation provides:

- **Scalability**: Independent scaling based on deployment load
- **Security**: Isolated deployment operations
- **Maintainability**: Clear separation of concerns
- **Reliability**: Deployment failures don't affect main application

## CORS Configuration

The service is configured to accept requests from any origin for development purposes. In production, you should configure specific allowed origins for security.

## Error Handling

All endpoints return consistent error responses with:
- `success`: Boolean indicating operation success
- `error`: Error type/category
- `message`: Detailed error message

## Monitoring

The service includes comprehensive monitoring capabilities:
- Health check endpoint for uptime monitoring
- Deployment metrics for performance analysis
- Alert system for proactive issue detection
- Request/response logging for debugging

## Security

- API key generation uses secure random generation
- All endpoints include proper error handling
- CORS is configurable for production security
- Environment-based configuration for sensitive settings

