# CMU Interactive Playground: Staging Deployment Guide

## Overview

This document outlines the steps required to deploy the CMU Interactive Playground with LLM integration to a staging environment for final validation before production release.

## Prerequisites

- Access to the staging environment (Render.com account)
- Environment variables for LLM API keys
- Completed and passed API tests

## Deployment Steps

### 1. Prepare the Environment Variables

Set up the following environment variables in the Render.com dashboard:

```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key (optional)
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4
NODE_ENV=staging
FEATURE_FLAGS_DEFAULT={"USE_LLM_AGENTS":false,"SHOW_DEVELOPER_PANEL":true}
```

### 2. Update package.json

Ensure the package.json file has the correct build and start scripts:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "start": "node server/server.js",
  "test": "node test/api-test.js"
}
```

### 3. Create a Render.com Web Service

1. Log in to the Render.com dashboard
2. Click "New" and select "Web Service"
3. Connect to the GitHub repository
4. Configure the service:
   - Name: `promethios-cmu-playground-staging`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables: Add all variables from step 1

### 4. Deploy and Monitor

1. Click "Create Web Service" to deploy
2. Monitor the build and deployment logs for any errors
3. Once deployed, verify the service is running by accessing the provided URL

### 5. Post-Deployment Validation

After deployment, perform the following validation steps:

1. **Basic Functionality Check**:
   - Access the playground URL
   - Verify the UI loads correctly
   - Test scenario selection
   - Run a basic conversation with scripted agents

2. **Developer Mode Check**:
   - Access the developer panel with Ctrl+Shift+D
   - Enable LLM agents
   - Verify configuration options work

3. **LLM Integration Check**:
   - With LLM agents enabled, start a new scenario
   - Verify real responses are generated
   - Test governance application
   - Verify metrics are updated

4. **Error Handling Check**:
   - Temporarily disable API keys in environment variables
   - Verify fallback to scripted responses works
   - Re-enable API keys

### 6. Performance Monitoring

Set up monitoring for:
- Response times
- Error rates
- API usage and costs
- User engagement metrics

### 7. Rollback Plan

If issues are encountered:
1. Identify the nature of the issue
2. If critical, immediately roll back to the last stable version
3. For non-critical issues, disable problematic features via feature flags
4. Document all issues for resolution before production deployment

## Production Deployment Readiness Checklist

Before proceeding to production deployment, verify:

- [ ] All staging validation tests pass
- [ ] Performance metrics are within acceptable ranges
- [ ] Error rates are below 1%
- [ ] All feature flags are configured correctly for initial production release
- [ ] Documentation is updated for users and developers
- [ ] Monitoring and alerting are configured
- [ ] Cost projections for LLM API usage are approved

## Initial Production Release Strategy

For the initial production release:

1. Deploy with `USE_LLM_AGENTS` set to `false` by default
2. Enable the developer panel for administrators only
3. Provide documentation on how to enable LLM features
4. Gradually enable LLM features for specific user groups
5. Monitor usage and gather feedback
6. Adjust feature flags based on feedback and performance

## Long-term Maintenance

- Schedule regular reviews of LLM API usage and costs
- Plan for updates to LLM models as new versions become available
- Establish a process for adding new scenarios and agent types
- Create a feedback mechanism for users to report issues or suggest improvements
