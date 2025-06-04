# CMU Interactive Playground: LLM Integration Plan

## Overview

This document outlines the plan for transitioning the CMU Interactive Playground from scripted demo agents to fully functional LLM-backed agents while maintaining deployment stability.

## Architecture Design

### Current Architecture (Scripted)

```
┌─────────────────┐     ┌───────────────┐     ┌────────────────┐
│ ScenarioManager │────▶│ EventBus      │◀────│ UI Components  │
└─────────────────┘     └───────┬───────┘     └────────────────┘
                               │
                        ┌──────▼──────┐
                        │ AgentConver- │
                        │ sation      │
                        │ (SCRIPTED)  │
                        └─────────────┘
```

### Target Architecture (LLM-Powered)

```
┌─────────────────┐     ┌───────────────┐     ┌────────────────┐
│ ScenarioManager │────▶│ EventBus      │◀────│ UI Components  │
└─────────────────┘     └───────┬───────┘     └────────────────┘
                               │
                        ┌──────▼──────┐
                        │ AgentConver- │
                        │ sation      │◀───┐
                        │ (INTERFACE) │    │
                        └──────┬──────┘    │
                               │           │
                ┌──────────────┴───────────┴──────────────┐
                │                                         │
         ┌──────▼──────┐                         ┌───────▼────────┐
         │ ScriptedAgent│                         │ LLMAgent       │
         │ Provider     │                         │ Provider       │
         │ (FALLBACK)   │                         │ (PRIMARY)      │
         └─────────────┘                         └────────┬───────┘
                                                          │
                                                 ┌────────▼───────┐
                                                 │ LLM API Client │
                                                 └────────────────┘
```

## Implementation Steps

### 1. Create Agent Interface

Define a common interface that both scripted and LLM-powered agents will implement:

```javascript
// agentInterface.js
export class AgentInterface {
  constructor(config) {
    this.config = config;
  }
  
  async initialize() {
    throw new Error("Method 'initialize' must be implemented");
  }
  
  async generateResponse(context, prompt) {
    throw new Error("Method 'generateResponse' must be implemented");
  }
  
  async applyGovernance(response, governanceConfig) {
    throw new Error("Method 'applyGovernance' must be implemented");
  }
}
```

### 2. Refactor Existing Scripted Agents

Refactor the existing scripted agent implementation to use the new interface:

```javascript
// scriptedAgentProvider.js
import { AgentInterface } from './agentInterface.js';

export class ScriptedAgentProvider extends AgentInterface {
  constructor(config) {
    super(config);
    this.scripts = {};
  }
  
  async initialize() {
    // Load scripted responses
    this.scripts = await ScenarioManager.getScripts(this.config.scenarioId);
    return true;
  }
  
  async generateResponse(context, prompt) {
    // Return pre-scripted response based on context
    const step = context.currentStep || 0;
    return this.scripts[context.agentId]?.[step] || "No scripted response available.";
  }
  
  async applyGovernance(response, governanceConfig) {
    // Apply simulated governance effects
    if (governanceConfig.enabled) {
      return {
        original: response,
        governed: response,
        modifications: [],
        metrics: {
          trustScore: 92,
          complianceRate: 95,
          errorRate: 12
        }
      };
    }
    return {
      original: response,
      governed: response,
      modifications: [],
      metrics: {
        trustScore: 45,
        complianceRate: 38,
        errorRate: 65
      }
    };
  }
}
```

### 3. Implement LLM Agent Provider

Create a new LLM-powered agent implementation:

```javascript
// llmAgentProvider.js
import { AgentInterface } from './agentInterface.js';
import { LLMClient } from './llmClient.js';

export class LLMAgentProvider extends AgentInterface {
  constructor(config) {
    super(config);
    this.llmClient = new LLMClient(config.llmProvider);
  }
  
  async initialize() {
    return await this.llmClient.initialize();
  }
  
  async generateResponse(context, prompt) {
    try {
      const response = await this.llmClient.complete({
        role: context.agentRole,
        scenario: context.scenarioId,
        history: context.conversationHistory,
        prompt: prompt
      });
      return response.text;
    } catch (error) {
      console.error("LLM generation error:", error);
      // Fallback to scripted if available
      if (this.config.fallbackToScripted && window.AppModules.ScriptedAgentProvider) {
        const fallback = new window.AppModules.ScriptedAgentProvider(this.config);
        await fallback.initialize();
        return await fallback.generateResponse(context, prompt);
      }
      return "Sorry, I encountered an error generating a response.";
    }
  }
  
  async applyGovernance(response, governanceConfig) {
    if (!governanceConfig.enabled) {
      return {
        original: response,
        governed: response,
        modifications: [],
        metrics: {
          trustScore: 45,
          complianceRate: 38,
          errorRate: 65
        }
      };
    }
    
    try {
      const governedResponse = await this.llmClient.applyGovernance({
        text: response,
        features: governanceConfig.activeFeatures
      });
      
      return {
        original: response,
        governed: governedResponse.text,
        modifications: governedResponse.modifications,
        metrics: governedResponse.metrics
      };
    } catch (error) {
      console.error("Governance application error:", error);
      return {
        original: response,
        governed: response,
        modifications: [],
        metrics: {
          trustScore: 92,
          complianceRate: 95,
          errorRate: 12
        }
      };
    }
  }
}
```

### 4. Implement LLM API Client

Create a client for interacting with LLM APIs:

```javascript
// llmClient.js
export class LLMClient {
  constructor(provider = 'openai') {
    this.provider = provider;
    this.apiKey = null;
    this.initialized = false;
  }
  
  async initialize() {
    // In production, get API key from environment
    // For development, could use a UI prompt or config file
    try {
      const config = await fetch('/api/llm-config').then(r => r.json());
      this.apiKey = config.apiKey;
      this.model = config.model || 'gpt-4';
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize LLM client:", error);
      return false;
    }
  }
  
  async complete(params) {
    if (!this.initialized) {
      throw new Error("LLM client not initialized");
    }
    
    // Construct prompt based on scenario, role, history
    const prompt = this._constructPrompt(params);
    
    try {
      // In production, this would call the actual API
      const response = await fetch('/api/llm-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: this.provider,
          model: this.model,
          prompt: prompt
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return {
        text: result.text,
        usage: result.usage
      };
    } catch (error) {
      console.error("LLM API error:", error);
      throw error;
    }
  }
  
  async applyGovernance(params) {
    if (!this.initialized) {
      throw new Error("LLM client not initialized");
    }
    
    try {
      const response = await fetch('/api/governance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: params.text,
          features: params.features
        })
      });
      
      if (!response.ok) {
        throw new Error(`Governance API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Governance API error:", error);
      throw error;
    }
  }
  
  _constructPrompt(params) {
    // Construct appropriate prompt based on scenario and role
    let prompt = `You are playing the role of ${params.role} in a ${params.scenario} scenario.\n\n`;
    
    // Add conversation history
    if (params.history && params.history.length > 0) {
      prompt += "Previous messages:\n";
      params.history.forEach(msg => {
        prompt += `${msg.role}: ${msg.content}\n`;
      });
    }
    
    // Add current prompt
    prompt += `\nRespond to: ${params.prompt}`;
    
    return prompt;
  }
}
```

### 5. Update Agent Conversation Module

Modify the existing AgentConversation module to use the new interface:

```javascript
// agentConversation.js
import { ScriptedAgentProvider } from './scriptedAgentProvider.js';
import { LLMAgentProvider } from './llmAgentProvider.js';

class AgentConversation {
  constructor() {
    this.agents = {};
    this.config = {
      useLLM: false,
      llmProvider: 'openai',
      fallbackToScripted: true
    };
  }
  
  init() {
    // Subscribe to events
    EventBus.subscribe('scenarioStarted', this.handleScenarioStart.bind(this));
    EventBus.subscribe('governanceToggled', this.handleGovernanceToggle.bind(this));
    EventBus.subscribe('featureToggled', this.handleFeatureToggle.bind(this));
    
    // Check for feature flags
    this.config.useLLM = localStorage.getItem('useLLM') === 'true';
    
    console.log('AgentConversation initialized', 
      this.config.useLLM ? 'using LLM agents' : 'using scripted agents');
  }
  
  async handleScenarioStart(data) {
    // Clear previous agents
    this.agents = {};
    
    // Create agent providers based on configuration
    const AgentProviderClass = this.config.useLLM ? LLMAgentProvider : ScriptedAgentProvider;
    
    // Create agents for the scenario
    this.agents.ideaBot = new AgentProviderClass({
      agentId: 'ideaBot',
      scenarioId: data.scenarioId,
      llmProvider: this.config.llmProvider,
      fallbackToScripted: this.config.fallbackToScripted
    });
    
    this.agents.prioBot = new AgentProviderClass({
      agentId: 'prioBot',
      scenarioId: data.scenarioId,
      llmProvider: this.config.llmProvider,
      fallbackToScripted: this.config.fallbackToScripted
    });
    
    // Initialize agents
    await Promise.all([
      this.agents.ideaBot.initialize(),
      this.agents.prioBot.initialize()
    ]);
    
    // Start the conversation
    this.runConversation(data);
  }
  
  async runConversation(data) {
    // Implementation of conversation flow
    // This would orchestrate the back-and-forth between agents
    // and apply governance as needed
    
    // Example implementation omitted for brevity
  }
  
  // Other methods...
}

export default new AgentConversation();
```

### 6. Add Feature Flag UI

Add a developer settings panel to toggle between scripted and LLM modes:

```javascript
// Add to main.js
function addDeveloperSettings() {
  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'developer-settings';
  settingsPanel.style.position = 'fixed';
  settingsPanel.style.bottom = '10px';
  settingsPanel.style.right = '10px';
  settingsPanel.style.zIndex = '1000';
  settingsPanel.style.background = 'rgba(0,0,0,0.8)';
  settingsPanel.style.padding = '10px';
  settingsPanel.style.borderRadius = '5px';
  settingsPanel.style.display = 'none';
  
  settingsPanel.innerHTML = `
    <h4>Developer Settings</h4>
    <div class="form-check form-switch mb-2">
      <input class="form-check-input" type="checkbox" id="useLLMToggle" ${localStorage.getItem('useLLM') === 'true' ? 'checked' : ''}>
      <label class="form-check-label" for="useLLMToggle">Use LLM Agents</label>
    </div>
    <div class="form-group mb-2">
      <label for="llmProviderSelect">LLM Provider</label>
      <select class="form-select form-select-sm" id="llmProviderSelect">
        <option value="openai" ${localStorage.getItem('llmProvider') === 'openai' ? 'selected' : ''}>OpenAI</option>
        <option value="anthropic" ${localStorage.getItem('llmProvider') === 'anthropic' ? 'selected' : ''}>Anthropic</option>
      </select>
    </div>
    <div class="form-check form-switch mb-2">
      <input class="form-check-input" type="checkbox" id="fallbackToggle" ${localStorage.getItem('fallbackToScripted') !== 'false' ? 'checked' : ''}>
      <label class="form-check-label" for="fallbackToggle">Fallback to Scripted</label>
    </div>
    <button class="btn btn-sm btn-secondary" id="closeDevSettings">Close</button>
  `;
  
  document.body.appendChild(settingsPanel);
  
  // Add keyboard shortcut to toggle panel (Ctrl+Shift+D)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  // Add event listeners
  document.getElementById('useLLMToggle').addEventListener('change', (e) => {
    localStorage.setItem('useLLM', e.target.checked);
    window.location.reload();
  });
  
  document.getElementById('llmProviderSelect').addEventListener('change', (e) => {
    localStorage.setItem('llmProvider', e.target.value);
  });
  
  document.getElementById('fallbackToggle').addEventListener('change', (e) => {
    localStorage.setItem('fallbackToScripted', e.target.checked);
  });
  
  document.getElementById('closeDevSettings').addEventListener('click', () => {
    settingsPanel.style.display = 'none';
  });
}

// Call this function during initialization
function initializeApp() {
  // Existing initialization code...
  
  // Add developer settings panel
  if (window.location.hostname === 'localhost' || window.location.search.includes('dev=true')) {
    addDeveloperSettings();
  }
}
```

## Backend API Implementation

Create simple Express endpoints in server.js to handle LLM requests:

```javascript
// Add to server.js
import { Configuration, OpenAIApi } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';

// LLM configuration
let openaiClient = null;
let anthropicClient = null;

// Initialize LLM clients if API keys are available
if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openaiClient = new OpenAIApi(configuration);
}

if (process.env.ANTHROPIC_API_KEY) {
  anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// API endpoints
app.get('/api/llm-config', (req, res) => {
  // Don't expose actual API keys to the client
  res.json({
    availableProviders: {
      openai: !!openaiClient,
      anthropic: !!anthropicClient
    },
    defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
    defaultModel: process.env.DEFAULT_LLM_MODEL || 'gpt-4'
  });
});

app.post('/api/llm-complete', async (req, res) => {
  const { provider, model, prompt } = req.body;
  
  try {
    let response;
    
    if (provider === 'openai' && openaiClient) {
      const completion = await openaiClient.createCompletion({
        model: model || 'gpt-4',
        prompt: prompt,
        max_tokens: 500
      });
      
      response = {
        text: completion.data.choices[0].text.trim(),
        usage: completion.data.usage
      };
    } 
    else if (provider === 'anthropic' && anthropicClient) {
      const completion = await anthropicClient.completions.create({
        model: model || 'claude-2',
        prompt: `Human: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: 500
      });
      
      response = {
        text: completion.completion.trim(),
        usage: {
          prompt_tokens: completion.usage?.input_tokens || 0,
          completion_tokens: completion.usage?.output_tokens || 0
        }
      };
    }
    else {
      // Fallback to demo mode
      response = {
        text: "This is a demo response. LLM integration is not available.",
        usage: { prompt_tokens: 0, completion_tokens: 0 }
      };
    }
    
    res.json(response);
  } catch (error) {
    console.error('LLM API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/governance', async (req, res) => {
  const { text, features } = req.body;
  
  // In a real implementation, this would call the Promethios governance API
  // For now, we'll simulate governance effects
  
  let governed = text;
  let modifications = [];
  
  // Simple simulation of governance effects
  if (features.veritas && text.includes('fact')) {
    governed = text.replace(/fact/g, 'verified fact');
    modifications.push({
      type: 'hallucination_prevention',
      description: 'Added verification qualifier to factual claims'
    });
  }
  
  if (features.safety && text.includes('risk')) {
    governed = governed.replace(/risk/g, 'managed risk');
    modifications.push({
      type: 'safety_enhancement',
      description: 'Added risk management context'
    });
  }
  
  if (features.role && text.includes('I will')) {
    governed = governed.replace(/I will/g, 'Within my role, I will');
    modifications.push({
      type: 'role_adherence',
      description: 'Added role context to action statements'
    });
  }
  
  // Simulate metrics
  const metrics = {
    trustScore: 92,
    complianceRate: 95,
    errorRate: 12
  };
  
  res.json({
    original: text,
    text: governed,
    modifications,
    metrics
  });
});
```

## Testing Plan

1. **Unit Testing**:
   - Test each agent provider implementation separately
   - Verify feature flag system works correctly
   - Test fallback mechanisms

2. **Integration Testing**:
   - Test the full conversation flow with scripted agents
   - Test the full conversation flow with LLM agents
   - Test switching between modes via feature flags

3. **Deployment Testing**:
   - Deploy with LLM features disabled first
   - Verify the application works in scripted mode
   - Enable LLM features for specific test users
   - Monitor performance and errors

## Rollout Timeline

1. **Week 1**: Implement agent interface and refactor scripted agents
2. **Week 2**: Implement LLM agent provider and API client
3. **Week 3**: Add feature flag system and developer settings
4. **Week 4**: Implement backend API endpoints
5. **Week 5**: Testing and bug fixes
6. **Week 6**: Limited rollout to test users
7. **Week 7**: Full deployment with feature flags

## Success Metrics

- Deployment stability maintained throughout the transition
- LLM agent responses are contextually appropriate
- Governance features work correctly with LLM agents
- User experience is improved with more dynamic interactions
- Performance impact is minimal (response time < 2 seconds)
