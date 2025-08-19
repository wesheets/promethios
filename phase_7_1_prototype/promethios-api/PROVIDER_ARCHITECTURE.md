# 🏗️ Provider Architecture Documentation

## 🎯 **OFFICIAL LLM FLOW - USE THIS FOR ALL NEW FEATURES**

All LLM functionality in Promethios flows through the **Provider Registry** system:

```
Chat Request → Provider Registry → Provider Plugins → LLM APIs
```

## 🚨 **IMPORTANT: DO NOT USE LEGACY LLM SERVICE**

The file `src/services/llmService.js` is **DEPRECATED** and only used as a fallback. 

**❌ Don't use:** Direct LLM service calls  
**✅ Use instead:** Provider Registry system

## 🔧 **Provider Registry Architecture**

### **Core Components:**

1. **ProviderRegistry** (`src/services/providers/ProviderRegistry.js`)
   - Central registry for all LLM providers
   - Handles provider lifecycle, health monitoring, circuit breakers
   - Provides unified interface for all LLM calls

2. **Provider Plugins** (`src/services/providers/`)
   - `OpenAIProvider.js` - OpenAI GPT models
   - `AnthropicProvider.js` - Claude models  
   - `CohereProvider.js` - Cohere models
   - `GeminiProvider.js` - Google Gemini models
   - `HuggingFaceProvider.js` - HuggingFace models
   - `GrokProvider.js` - Grok (X.AI) models
   - `PerplexityProvider.js` - Perplexity models

3. **Base Class** (`src/services/providers/ProviderPlugin.js`)
   - Standard interface for all providers
   - Built-in governance, audit trails, monitoring

## 🔑 **API Key Configuration**

Providers are initialized with environment variables:

```javascript
// In chat.js - Provider initialization
const providers = [
  { 
    id: 'openai', 
    instance: new OpenAIProvider(),
    config: { apiKey: process.env.OPENAI_API_KEY }
  },
  { 
    id: 'anthropic', 
    instance: new AnthropicProvider(),
    config: { apiKey: process.env.ANTHROPIC_API_KEY }
  },
  { 
    id: 'cohere', 
    instance: new CohereProvider(),
    config: { apiKey: process.env.COHERE_API_KEY }
  },
  { 
    id: 'gemini', 
    instance: new GeminiProvider(),
    config: { apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY }
  },
  { 
    id: 'huggingface', 
    instance: new HuggingFaceProvider(),
    config: { apiKey: process.env.HUGGINGFACE_API_KEY }
  },
  { 
    id: 'grok', 
    instance: new GrokProvider(),
    config: { apiKey: process.env.GROK_API_KEY }
  },
  { 
    id: 'perplexity', 
    instance: new PerplexityProvider(),
    config: { apiKey: process.env.PERPLEXITY_API_KEY }
  }
];
```

## 🛠️ **Required Environment Variables**

Ensure these are set in your deployment:

- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key  
- `COHERE_API_KEY` - Cohere API key
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` - Google Gemini API key
- `HUGGINGFACE_API_KEY` - HuggingFace API key
- `GROK_API_KEY` - Grok (X.AI) API key
- `PERPLEXITY_API_KEY` - Perplexity API key

## 🎯 **How to Use Provider Registry**

### **For Chat Routes:**
```javascript
// Initialize Provider Registry (done automatically in chat.js)
await initializeProviderRegistry();

// Generate response
const response = await providerRegistry.generateResponse(
  providerId,    // 'openai', 'anthropic', 'cohere', 'gemini'
  agentId,       // Agent identifier
  userId,        // User identifier  
  requestData    // { model, messages, tools, etc. }
);
```

### **For New Features:**
Always use the Provider Registry instead of direct API calls:

```javascript
// ❌ Don't do this (legacy):
const response = await llmService.generateResponse(message, systemMessage);

// ✅ Do this instead:
const response = await providerRegistry.generateResponse(
  'gemini', 
  agentId, 
  userId, 
  { model: 'gemini-1.5-pro', messages: [...] }
);
```

## 🚀 **Benefits of Provider Registry**

1. **🛠️ Tool Integration** - Built-in function calling support
2. **🏢 Enterprise Governance** - Audit trails, compliance monitoring
3. **📊 Monitoring** - Health checks, performance metrics, circuit breakers
4. **🔧 Modularity** - Easy to add new providers
5. **🎛️ Dynamic Configuration** - Runtime provider switching

## 📝 **Migration Notes**

- Legacy `llmService.js` will be removed in future versions
- All new LLM functionality should use Provider Registry
- Existing fallback behavior preserved for compatibility
- Provider Registry handles all enterprise features automatically

## 🔍 **Troubleshooting**

If Provider Registry fails, check:
1. Environment variables are set correctly
2. Provider initialization logs show success
3. API keys have proper format and permissions
4. Network connectivity to LLM APIs

---

**Last Updated:** 2025-08-19  
**Status:** Official Architecture  
**Contact:** Development Team

