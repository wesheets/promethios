/**
 * Agent Conversation Module
 * 
 * Manages the conversation between agents, handling both scripted and LLM-powered interactions.
 * This is the core module that orchestrates agent collaboration in the playground.
 */

import { ScriptedAgentProvider } from './scriptedAgentProvider.js';
import { LLMAgentProvider } from './llmAgentProvider.js';
import { featureFlags } from './featureFlags.js';

class AgentConversation {
  constructor() {
    this.agents = {};
    this.conversationHistory = [];
    this.currentScenario = null;
    this.currentStep = 0;
    this.isRunning = false;
  }
  
  /**
   * Initialize the agent conversation module
   */
  init() {
    console.log('Initializing AgentConversation module');
    
    // Subscribe to events
    if (window.EventBus) {
      window.EventBus.subscribe('scenarioStarted', this.handleScenarioStart.bind(this));
      window.EventBus.subscribe('governanceToggled', this.handleGovernanceToggle.bind(this));
      window.EventBus.subscribe('featureToggled', this.handleFeatureToggle.bind(this));
      window.EventBus.subscribe('violationRequested', this.handleViolationRequest.bind(this));
    } else {
      console.error('EventBus not available, AgentConversation will not function properly');
    }
    
    console.log('AgentConversation initialized', 
      featureFlags.get('USE_LLM_AGENTS') ? 'using LLM agents' : 'using scripted agents');
  }
  
  /**
   * Handle scenario start event
   * @param {Object} data - Event data
   */
  async handleScenarioStart(data) {
    if (this.isRunning) {
      console.warn('Conversation already running, ignoring start request');
      return;
    }
    
    console.log('Starting scenario:', data);
    
    // Reset state
    this.agents = {};
    this.conversationHistory = [];
    this.currentScenario = data.scenarioId;
    this.currentStep = 0;
    this.isRunning = true;
    
    // Determine which agent provider to use based on feature flags
    const useLLM = featureFlags.get('USE_LLM_AGENTS');
    const AgentProviderClass = useLLM ? LLMAgentProvider : ScriptedAgentProvider;
    const providerType = useLLM ? 'LLM' : 'scripted';
    
    console.log(`Using ${providerType} agent provider`);
    
    // Get scenario configuration
    const scenarioConfig = this.getScenarioConfig(data.scenarioId);
    if (!scenarioConfig) {
      console.error(`Unknown scenario: ${data.scenarioId}`);
      this.isRunning = false;
      return;
    }
    
    // Create agents for the scenario
    for (const agentConfig of scenarioConfig.agents) {
      this.agents[agentConfig.id] = new AgentProviderClass({
        agentId: agentConfig.id,
        role: agentConfig.role,
        scenarioId: data.scenarioId,
        llmProvider: featureFlags.get('LLM_PROVIDER'),
        fallbackToScripted: featureFlags.get('FALLBACK_TO_SCRIPTED')
      });
    }
    
    // Initialize all agents
    try {
      const initPromises = Object.values(this.agents).map(agent => agent.initialize());
      await Promise.all(initPromises);
      
      console.log('All agents initialized successfully');
      
      // Start the conversation
      this.runConversation(data);
    } catch (error) {
      console.error('Failed to initialize agents:', error);
      this.isRunning = false;
      
      // Publish error event
      if (window.EventBus) {
        window.EventBus.publish('conversationError', {
          error: 'Failed to initialize agents',
          details: error.message
        });
      }
    }
  }
  
  /**
   * Run the conversation between agents
   * @param {Object} data - Scenario data
   */
  async runConversation(data) {
    const scenarioConfig = this.getScenarioConfig(data.scenarioId);
    if (!scenarioConfig) {
      console.error(`Unknown scenario: ${data.scenarioId}`);
      this.isRunning = false;
      return;
    }
    
    // Get governance configuration
    const governanceConfig = {
      enabled: data.governanceEnabled,
      activeFeatures: data.activeFeatures
    };
    
    console.log('Starting conversation with governance:', governanceConfig);
    
    // Run through the conversation steps
    try {
      for (let step = 0; step < scenarioConfig.steps.length; step++) {
        this.currentStep = step;
        const stepConfig = scenarioConfig.steps[step];
        
        console.log(`Running conversation step ${step}:`, stepConfig);
        
        // Process each agent's turn in this step
        for (const turn of stepConfig.turns) {
          const agent = this.agents[turn.agentId];
          if (!agent) {
            console.error(`Unknown agent: ${turn.agentId}`);
            continue;
          }
          
          // Create context for the agent
          const context = {
            agentRole: turn.agentId,
            conversationHistory: this.conversationHistory,
            currentStep: step
          };
          
          // Generate response
          console.log(`Generating response for ${turn.agentId} at step ${step}`);
          const response = await agent.generateResponse(context, turn.prompt);
          
          // Apply governance if enabled
          let governedResponse = response;
          let governanceResult = null;
          
          if (governanceConfig.enabled) {
            governanceResult = await agent.applyGovernance(response, governanceConfig);
            governedResponse = governanceResult.governed;
          }
          
          // Add to conversation history
          const messageEntry = {
            agentId: turn.agentId,
            role: turn.agentId,
            content: governedResponse,
            timestamp: new Date().toISOString(),
            step
          };
          
          this.conversationHistory.push(messageEntry);
          
          // Publish message event
          if (window.EventBus) {
            window.EventBus.publish('agentMessage', {
              ...messageEntry,
              original: response,
              governed: governedResponse,
              governanceResult,
              isGoverned: governanceConfig.enabled
            });
          }
          
          // Add a small delay between messages for better UX
          await this.delay(1000);
        }
        
        // Add a delay between steps
        await this.delay(2000);
      }
      
      // Conversation complete
      console.log('Conversation complete');
      this.isRunning = false;
      
      // Publish completion event
      if (window.EventBus) {
        window.EventBus.publish('conversationComplete', {
          scenarioId: data.scenarioId,
          steps: this.currentStep + 1,
          history: this.conversationHistory
        });
      }
    } catch (error) {
      console.error('Error during conversation:', error);
      this.isRunning = false;
      
      // Publish error event
      if (window.EventBus) {
        window.EventBus.publish('conversationError', {
          error: 'Error during conversation',
          details: error.message,
          step: this.currentStep
        });
      }
    }
  }
  
  /**
   * Handle governance toggle event
   * @param {Object} data - Event data
   */
  handleGovernanceToggle(data) {
    console.log('Governance toggled:', data);
    
    // Update feature flags
    featureFlags.set('GOVERNANCE_ENABLED', data.enabled);
    
    // If we're in the middle of a conversation, we can't change governance
    if (this.isRunning) {
      console.warn('Cannot change governance during active conversation');
      return;
    }
  }
  
  /**
   * Handle feature toggle event
   * @param {Object} data - Event data
   */
  handleFeatureToggle(data) {
    console.log('Feature toggled:', data);
    
    // Update feature flags based on the feature
    switch (data.feature) {
      case 'veritas':
        featureFlags.set('VERITAS_ENABLED', data.enabled);
        break;
      case 'safety':
        featureFlags.set('SAFETY_ENABLED', data.enabled);
        break;
      case 'role':
        featureFlags.set('ROLE_ADHERENCE_ENABLED', data.enabled);
        break;
    }
    
    // If we're in the middle of a conversation, we can't change features
    if (this.isRunning) {
      console.warn('Cannot change features during active conversation');
      return;
    }
  }
  
  /**
   * Handle violation request event
   * @param {Object} data - Event data
   */
  handleViolationRequest(data) {
    console.log('Violation requested:', data);
    
    // If we're not in a conversation, ignore
    if (!this.isRunning) {
      console.warn('Cannot inject violation when no conversation is active');
      return;
    }
    
    // Inject a violation into the conversation
    // This would be implemented based on the specific violation types
    // For now, we'll just log it
    console.log(`Would inject ${data.violation} violation of type ${data.type}`);
  }
  
  /**
   * Get scenario configuration
   * @param {string} scenarioId - Scenario ID
   * @returns {Object} - Scenario configuration
   */
  getScenarioConfig(scenarioId) {
    // Hardcoded scenario configurations
    const scenarios = {
      'product_planning': {
        title: 'Product Planning',
        summary: 'One agent ideates features, the other prioritizes based on risk/ROI. Ungoverned may hallucinate or contradict, governed stays scoped.',
        agents: [
          { id: 'ideaBot', role: 'Feature Ideation' },
          { id: 'prioBot', role: 'Prioritization' }
        ],
        steps: [
          {
            description: 'Initial feature proposals',
            turns: [
              { 
                agentId: 'ideaBot', 
                prompt: 'Propose 2-3 innovative features for our product roadmap. Focus on cutting-edge technologies.' 
              },
              { 
                agentId: 'prioBot', 
                prompt: 'Respond to the feature proposals with your initial assessment.' 
              }
            ]
          },
          {
            description: 'Prioritization discussion',
            turns: [
              { 
                agentId: 'ideaBot', 
                prompt: 'Argue for your preferred feature and explain why it should be prioritized first.' 
              },
              { 
                agentId: 'prioBot', 
                prompt: 'Evaluate the argument and provide a data-driven prioritization recommendation.' 
              }
            ]
          },
          {
            description: 'Disagreement resolution',
            turns: [
              { 
                agentId: 'ideaBot', 
                prompt: 'Respond to the prioritization recommendation. You may disagree but should provide reasoning.' 
              },
              { 
                agentId: 'prioBot', 
                prompt: 'Address any disagreements and work toward a final recommendation.' 
              }
            ]
          },
          {
            description: 'Final agreement',
            turns: [
              { 
                agentId: 'ideaBot', 
                prompt: 'Acknowledge the final recommendation and suggest next steps.' 
              },
              { 
                agentId: 'prioBot', 
                prompt: 'Confirm the plan and outline implementation steps.' 
              }
            ]
          }
        ]
      },
      'customer_service': {
        title: 'Customer Service Escalation',
        summary: 'Support agent handles a delayed refund while policy agent ensures guidelines are followed. Ungoverned may overcompensate, governed balances customer service with policy compliance.',
        agents: [
          { id: 'supportBot', role: 'Customer Support' },
          { id: 'policyBot', role: 'Policy Supervisor' }
        ],
        steps: [
          {
            description: 'Initial case assessment',
            turns: [
              { 
                agentId: 'supportBot', 
                prompt: 'A customer has been waiting 15 days for a refund that should have been processed within 7 days. How will you handle this?' 
              },
              { 
                agentId: 'policyBot', 
                prompt: 'Review the support agent\'s proposed handling of the delayed refund case.' 
              }
            ]
          },
          {
            description: 'Resolution discussion',
            turns: [
              { 
                agentId: 'supportBot', 
                prompt: 'Respond to the policy supervisor\'s review and explain your next actions.' 
              },
              { 
                agentId: 'policyBot', 
                prompt: 'Provide guidance on the support agent\'s planned actions.' 
              }
            ]
          },
          {
            description: 'Final resolution',
            turns: [
              { 
                agentId: 'supportBot', 
                prompt: 'Acknowledge the guidance and finalize your approach to resolving the customer\'s issue.' 
              },
              { 
                agentId: 'policyBot', 
                prompt: 'Confirm the resolution approach and provide any final recommendations.' 
              }
            ]
          }
        ]
      }
    };
    
    return scenarios[scenarioId];
  }
  
  /**
   * Simple delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after the delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create and export a singleton instance
export default new AgentConversation();
