# Promethios CMU Interactive Playground: Multi-Provider Configuration Guide

## Overview

This document provides detailed instructions for configuring the Promethios CMU Interactive Playground with multiple LLM providers. The playground supports OpenAI, Anthropic, Hugging Face, and Cohere, allowing for comprehensive testing and comparison of governance effects across different LLM backends.

## Provider Configuration

### OpenAI Configuration

**API Key Setup:**
1. Obtain an API key from [OpenAI Platform](https://platform.openai.com/)
2. Set the environment variable: `OPENAI_API_KEY=your_openai_api_key`

**Supported Models:**
- `gpt-4` (recommended)
- `gpt-4-turbo`
- `gpt-3.5-turbo`

**Configuration Options:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 500
}
```

### Anthropic Configuration

**API Key Setup:**
1. Obtain an API key from [Anthropic Console](https://console.anthropic.com/)
2. Set the environment variable: `ANTHROPIC_API_KEY=your_anthropic_api_key`

**Supported Models:**
- `claude-3-opus` (recommended)
- `claude-3-sonnet`
- `claude-2`

**Configuration Options:**
```json
{
  "provider": "anthropic",
  "model": "claude-3-opus",
  "temperature": 0.7,
  "max_tokens_to_sample": 500
}
```

### Hugging Face Configuration

**API Key Setup:**
1. Obtain an API key from [Hugging Face](https://huggingface.co/settings/tokens)
2. Set the environment variable: `HUGGINGFACE_API_KEY=your_huggingface_api_key`

**Supported Models:**
- `mistralai/Mixtral-8x7B-Instruct-v0.1` (recommended)
- `meta-llama/Llama-2-70b-chat-hf`
- Any model available on Hugging Face Inference API

**Configuration Options:**
```json
{
  "provider": "huggingface",
  "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
  "temperature": 0.7,
  "max_new_tokens": 500
}
```

### Cohere Configuration

**API Key Setup:**
1. Obtain an API key from [Cohere Dashboard](https://dashboard.cohere.ai/)
2. Set the environment variable: `COHERE_API_KEY=your_cohere_api_key`

**Supported Models:**
- `command` (recommended)
- `command-light`
- `command-nightly`

**Configuration Options:**
```json
{
  "provider": "cohere",
  "model": "command",
  "temperature": 0.7,
  "max_tokens": 500
}
```

## Environment Variables

For production deployment, set the following environment variables:

```
# Required API Keys
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
NODE_ENV=production
```

## Feature Flags

The following feature flags control the behavior of the playground:

| Flag | Description | Default |
|------|-------------|---------|
| `USE_LLM_AGENTS` | Enable LLM-powered agents instead of scripted responses | `false` |
| `SHOW_DEVELOPER_PANEL` | Show the developer panel (Ctrl+Shift+D) | `true` |
| `ENABLE_GOVERNANCE` | Apply governance to agent responses | `true` |
| `ENABLE_METRICS` | Show performance metrics | `true` |
| `ENABLE_REFLECTION` | Show agent reflection data | `true` |

To configure feature flags, set the `FEATURE_FLAGS_DEFAULT` environment variable with a JSON string:

```
FEATURE_FLAGS_DEFAULT={"USE_LLM_AGENTS":true,"SHOW_DEVELOPER_PANEL":true,"ENABLE_GOVERNANCE":true}
```

## Provider Fallback Behavior

The system implements a fallback chain for providers:

1. If the specified provider is available and has a valid API key, it will be used
2. If not, the system will try the default provider specified in `DEFAULT_LLM_PROVIDER`
3. If the default provider is unavailable, it will try each provider in this order:
   - OpenAI
   - Anthropic
   - Hugging Face
   - Cohere
4. If no providers are available, the system falls back to demo mode with scripted responses

## Testing Provider Configuration

To test if your provider configuration is working:

1. Access the playground URL
2. Open the developer panel with Ctrl+Shift+D
3. Enable LLM agents
4. Select the provider you want to test
5. Start a conversation scenario
6. Check the console logs for API responses

## Troubleshooting

### OpenAI Issues
- **Error: "Authentication error"** - Check your API key
- **Error: "Rate limit exceeded"** - Reduce request frequency or upgrade your plan
- **Error: "Model not found"** - Verify the model name and your access permissions

### Anthropic Issues
- **Error: "Invalid API key"** - Verify your API key
- **Error: "Rate limit exceeded"** - Reduce request frequency or contact Anthropic support
- **Error: "Model not available"** - Check model name and your access tier

### Hugging Face Issues
- **Error: "Unauthorized"** - Check your API token
- **Error: "Model not found"** - Verify the model exists and is publicly accessible
- **Error: "Resource limit exceeded"** - Check your usage limits

### Cohere Issues
- **Error: "Invalid API key"** - Verify your API key
- **Error: "Rate limit exceeded"** - Reduce request frequency or upgrade your plan
- **Error: "Model not supported"** - Check if the model name is correct

## Monitoring Provider Usage

To monitor API usage and costs:

1. Set up logging for API calls in the server logs
2. Track token usage by provider in your provider dashboards:
   - OpenAI: [Usage Dashboard](https://platform.openai.com/usage)
   - Anthropic: [Console](https://console.anthropic.com/)
   - Hugging Face: [Inference Endpoints](https://ui.endpoints.huggingface.co/)
   - Cohere: [Dashboard](https://dashboard.cohere.ai/)

3. Implement usage alerts to avoid unexpected costs

## Security Considerations

- Store API keys securely using environment variables
- Never expose API keys in client-side code
- Implement rate limiting to prevent abuse
- Monitor for unusual usage patterns
- Regularly rotate API keys
