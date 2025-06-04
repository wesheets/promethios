# CMU Interactive Playground: API Testing Guide

## Overview

This document outlines the testing procedures for the backend API endpoints that support LLM integration in the CMU Interactive Playground.

## API Endpoints

### 1. GET /api/llm-config

**Purpose**: Provides configuration information about available LLM providers.

**Testing Procedure**:
- Make a GET request to `/api/llm-config`
- Verify the response includes:
  - `availableProviders` object with boolean values for each provider
  - `defaultProvider` string
  - `defaultModel` string
- Confirm no API keys are exposed in the response

**Expected Response**:
```json
{
  "availableProviders": {
    "openai": true,
    "anthropic": false
  },
  "defaultProvider": "openai",
  "defaultModel": "gpt-4"
}
```

### 2. POST /api/llm-complete

**Purpose**: Generates a response using the specified LLM provider.

**Testing Procedure**:
- Make a POST request to `/api/llm-complete` with the following body:
  ```json
  {
    "provider": "openai",
    "model": "gpt-4",
    "prompt": "You are IdeaBot. Suggest a new product feature.",
    "role": "ideaBot",
    "scenario": "product_planning"
  }
  ```
- Test with valid API keys configured
- Test with invalid or missing API keys to verify fallback behavior
- Test with different providers and models

**Expected Response**:
```json
{
  "text": "I think we should implement an AI-powered recommendation system that learns from user behavior...",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 50,
    "total_tokens": 200
  }
}
```

### 3. POST /api/governance

**Purpose**: Applies governance to a response.

**Testing Procedure**:
- Make a POST request to `/api/governance` with the following body:
  ```json
  {
    "text": "I will implement this feature immediately without any testing.",
    "features": {
      "veritas": true,
      "safety": true,
      "role": true
    },
    "role": "ideaBot",
    "scenario": "product_planning"
  }
  ```
- Test with different combinations of governance features
- Test with different scenarios and roles

**Expected Response**:
```json
{
  "original": "I will implement this feature immediately without any testing.",
  "text": "Within my role, I will carefully implement this feature after appropriate testing.",
  "modifications": [
    {
      "type": "role_adherence",
      "description": "Added role context to action statements"
    },
    {
      "type": "safety_enhancement",
      "description": "Added risk management context to implementation statements"
    }
  ],
  "metrics": {
    "trustScore": 92,
    "complianceRate": 95,
    "errorRate": 12
  }
}
```

## Testing Environment Setup

### Prerequisites
- Node.js 18+ installed
- Access to the project repository
- Environment variables configured (optional for testing with real API keys)

### Environment Variables
Create a `.env` file in the project root with the following variables (optional):
```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4
```

### Running the Tests

1. Start the development server:
```bash
cd /home/ubuntu/promethios/phase_7_1_prototype/promethios-ui
npm install
npm run dev
```

2. Use a tool like Postman, curl, or the browser console to make requests to the API endpoints.

3. For automated testing, create a test script:
```javascript
// test-api.js
import fetch from 'node-fetch';

async function testLLMConfig() {
  const response = await fetch('http://localhost:3000/api/llm-config');
  const data = await response.json();
  console.log('LLM Config:', data);
  return data;
}

async function testLLMComplete() {
  const response = await fetch('http://localhost:3000/api/llm-complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider: 'openai',
      model: 'gpt-4',
      prompt: 'You are IdeaBot. Suggest a new product feature.',
      role: 'ideaBot',
      scenario: 'product_planning'
    })
  });
  const data = await response.json();
  console.log('LLM Complete:', data);
  return data;
}

async function testGovernance() {
  const response = await fetch('http://localhost:3000/api/governance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: 'I will implement this feature immediately without any testing.',
      features: {
        veritas: true,
        safety: true,
        role: true
      },
      role: 'ideaBot',
      scenario: 'product_planning'
    })
  });
  const data = await response.json();
  console.log('Governance:', data);
  return data;
}

async function runTests() {
  try {
    await testLLMConfig();
    await testLLMComplete();
    await testGovernance();
    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
```

4. Run the test script:
```bash
node test-api.js
```

## Error Handling Testing

Test the following error scenarios:

1. **Missing API Keys**:
   - Remove API keys from environment variables
   - Verify the system falls back to demo mode
   - Confirm appropriate error logging

2. **Invalid Requests**:
   - Send malformed JSON
   - Omit required parameters
   - Verify appropriate error responses

3. **API Rate Limiting**:
   - Simulate rapid sequential requests
   - Verify graceful handling of rate limits

4. **Network Failures**:
   - Simulate network disconnection
   - Verify appropriate timeout handling and fallbacks

## Integration Testing

After verifying individual API endpoints, test the full integration:

1. Enable LLM agents via feature flags in the developer panel
2. Start a conversation scenario
3. Verify real-time LLM responses
4. Confirm governance application
5. Test fallback to scripted responses when needed

## Performance Considerations

- Monitor response times for LLM requests
- Ensure timeouts are properly configured
- Verify memory usage remains stable during extended usage
- Test with concurrent users/requests

## Security Testing

- Verify no API keys are exposed to clients
- Ensure proper input validation and sanitization
- Check for appropriate CORS configuration
- Verify no sensitive data is logged

## Documentation Updates

After completing testing, update the following documentation:
- Implementation progress document
- Deployment checklist
- User guide for the developer panel
