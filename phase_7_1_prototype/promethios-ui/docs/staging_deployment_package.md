# Promethios CMU Interactive Playground: Staging Deployment Package

## Overview

This document provides instructions for deploying the Promethios CMU Interactive Playground to a staging environment. The playground demonstrates real-time agent collaboration with and without governance, showcasing the significant performance improvements that Promethios governance provides.

## Package Contents

The deployment package includes:

1. **Frontend Application**
   - React-based UI for the interactive playground
   - Feature-flagged LLM integration
   - Governance visualization components

2. **Backend API**
   - Express server for LLM provider integration
   - Multi-provider support (OpenAI, Anthropic, Hugging Face, Cohere)
   - Governance application endpoints

3. **Configuration Files**
   - Environment variable templates
   - Feature flag configuration
   - Provider-specific settings

## Deployment Prerequisites

Before deploying, ensure you have:

1. **API Keys**
   - OpenAI API key
   - Anthropic API key
   - Hugging Face API key
   - Cohere API key

2. **Render.com Account**
   - Access to the Promethios organization
   - Permissions to deploy web services

3. **Environment Variables**
   - See the Environment Variables section below

## Deployment Steps

### 1. Prepare Environment Variables

Create a `.env` file with the following variables:

```
# LLM Provider API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
COHERE_API_KEY=your_cohere_api_key

# Default Provider Configuration
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4

# Feature Flags
FEATURE_FLAGS_DEFAULT={"USE_LLM_AGENTS":false,"SHOW_DEVELOPER_PANEL":true}

# Environment
NODE_ENV=staging
```

### 2. Deploy to Render.com

1. Log in to the Render.com dashboard
2. Navigate to the Promethios organization
3. Click "New" and select "Web Service"
4. Connect to the GitHub repository
5. Configure the service:
   - Name: `promethios-cmu-playground-staging`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `node server/server.js`
   - Environment Variables: Add all variables from step 1

### 3. Verify Deployment

After deployment completes:

1. Access the provided URL
2. Verify the playground loads correctly
3. Test with scripted agents (default mode)
4. Access the developer panel (Ctrl+Shift+D) to enable LLM agents
5. Test with LLM agents enabled

## Rollback Procedure

If issues are encountered:

1. In the Render.com dashboard, navigate to the deployed service
2. Click "Manual Deploy"
3. Select the last known good deployment
4. Click "Deploy"

## Monitoring

Monitor the following metrics:

1. **API Usage**
   - Track token consumption by provider
   - Monitor rate limits
   - Watch for unexpected costs

2. **Error Rates**
   - API connection failures
   - LLM response errors
   - Governance application issues

3. **Performance**
   - Response times
   - Server load
   - Client-side rendering performance

## Support

For deployment issues, contact:

- Technical Support: tech@promethios.ai
- API Access: api@promethios.ai
- Governance Framework: governance@promethios.ai
