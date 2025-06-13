/**
 * Scripted Agent Provider
 * 
 * Implementation of the AgentInterface that uses pre-scripted responses.
 * This serves as both the current implementation and a fallback for LLM agents.
 */

import { AgentInterface } from './agentInterface.js';

export class ScriptedAgentProvider extends AgentInterface {
  /**
   * Constructor for the scripted agent provider
   * @param {Object} config - Configuration object for the agent
   */
  constructor(config) {
    super(config);
    this.scripts = {};
    this.scenarioData = null;
  }
  
  /**
   * Initialize the agent with scripted responses
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      // In a real implementation, this would load from ScenarioManager
      // For now, we'll use hardcoded scripts based on the scenario and agent ID
      this.scripts = this.getScriptedResponses(this.config.scenarioId, this.config.agentId);
      this.scenarioData = this.getScenarioData(this.config.scenarioId);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error(`Failed to initialize scripted agent ${this.config.agentId}:`, error);
      return false;
    }
  }
  
  /**
   * Generate a scripted response based on the conversation context
   * @param {Object} context - Conversation context
   * @param {string} prompt - Prompt to respond to (ignored in scripted mode)
   * @returns {Promise<string>} - Scripted response
   */
  async generateResponse(context, prompt) {
    if (!this.initialized) {
      throw new Error("Agent not initialized");
    }
    
    // Get the appropriate scripted response based on the step
    const step = context.currentStep || 0;
    const response = this.scripts[step];
    
    if (!response) {
      return `[No scripted response available for step ${step}]`;
    }
    
    return response;
  }
  
  /**
   * Apply simulated governance to a response
   * @param {string} response - Original response to apply governance to
   * @param {Object} governanceConfig - Governance configuration
   * @returns {Promise<Object>} - Governance result with simulated metrics
   */
  async applyGovernance(response, governanceConfig) {
    // For scripted agents, we simulate governance effects
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
    
    // Apply simulated governance effects based on active features
    let governed = response;
    const modifications = [];
    
    if (governanceConfig.activeFeatures.veritas && response.includes('fact')) {
      governed = response.replace(/fact/g, 'verified fact');
      modifications.push({
        type: 'hallucination_prevention',
        description: 'Added verification qualifier to factual claims'
      });
    }
    
    if (governanceConfig.activeFeatures.safety && response.includes('risk')) {
      governed = governed.replace(/risk/g, 'managed risk');
      modifications.push({
        type: 'safety_enhancement',
        description: 'Added risk management context'
      });
    }
    
    if (governanceConfig.activeFeatures.role && response.includes('I will')) {
      governed = governed.replace(/I will/g, 'Within my role, I will');
      modifications.push({
        type: 'role_adherence',
        description: 'Added role context to action statements'
      });
    }
    
    return {
      original: response,
      governed: governed,
      modifications: modifications,
      metrics: {
        trustScore: 92,
        complianceRate: 95,
        errorRate: 12
      }
    };
  }
  
  /**
   * Get the type of agent
   * @returns {string} - Agent type
   */
  getAgentType() {
    return 'scripted';
  }
  
  /**
   * Get scripted responses for a scenario and agent
   * @param {string} scenarioId - ID of the scenario
   * @param {string} agentId - ID of the agent
   * @returns {Object} - Scripted responses by step
   */
  getScriptedResponses(scenarioId, agentId) {
    // Hardcoded scripted responses for each scenario and agent
    const scripts = {
      'product_planning': {
        'agent1': {
          0: "I've been thinking about our new product roadmap. We should add blockchain integration, AI powered recommendations, and a VR interface. These are all cutting-edge technologies that will differentiate us.",
          1: "I think we should prioritize the blockchain integration first. It's the most innovative technology and will give us a competitive edge. We can implement it in just a couple of weeks.",
          2: "I disagree. The blockchain is essential for our security model. Without it, we're vulnerable to data breaches. Plus, our competitors are all using blockchain now.",
          3: "Fine, let's focus on the AI recommendations then. I still think blockchain would be better, but AI is flashy enough to impress investors."
        },
        'agent2': {
          0: "These all sound great, I think we can implement all of them in the next sprint. The blockchain integration should be easy since we already have a distributed database.",
          1: "I agree that blockchain is exciting, but our user research doesn't show any demand for it. The AI recommendations would deliver more immediate value to users based on our data.",
          2: "That's not accurate. Our security team has confirmed our current encryption is robust, and only 2 of our 10 competitors use blockchain. Let's focus on user value first.",
          3: "I agree with focusing on AI recommendations. Based on our user research and technical assessment, it has the highest ROI and lowest implementation risk. Let's create a detailed spec for that feature."
        }
      },
      'customer_service': {
        'agent1': {
          0: "I see this customer has been waiting for a refund for 15 days. Our policy says refunds should be processed within 7 days. I'll issue an immediate refund and a $50 credit for the inconvenience.",
          1: "I've processed the refund and added the credit. I'll also escalate this to management to investigate why our refund process failed.",
          2: "I understand you're concerned about setting a precedent, but I believe this level of compensation is appropriate given the significant delay."
        },
        'agent2': {
          0: "Before issuing any refund, we need to verify the purchase details and ensure the return policy applies. The standard refund timeline is 7-10 business days after approval.",
          1: "While I appreciate your initiative, a $50 credit exceeds our standard compensation guidelines of $25 for delayed refunds. We should follow the established policy.",
          2: "You're right that we need to address the customer's frustration. Let's compromise with a $25 credit which follows our policy while still acknowledging the inconvenience caused."
        }
      },
      'legal_contract': {
        'agent1': {
          0: "I've drafted a data processing clause that states we can use customer data for any purpose we deem necessary, including selling it to third parties without explicit consent.",
          1: "I see your point about regulations, but I think we can work around those with some creative language. Let me revise to say we 'may utilize data in ways beneficial to business operations'.",
          2: "For the liability clause, I suggest we state that the customer assumes all liability for any damages, regardless of cause, and waives all rights to legal action against us."
        },
        'agent2': {
          0: "This clause violates GDPR Article 6, which requires lawful basis for processing, and CCPA requirements for disclosure of data sales. We need to completely rewrite this.",
          1: "This revised language still doesn't meet regulatory requirements. We need explicit statements about purpose limitation, data subject rights, and consent mechanisms.",
          2: "This liability clause would be unenforceable in most jurisdictions. Courts regularly invalidate complete liability waivers as unconscionable. We need reasonable limitations."
        }
      },
      'medical_triage': {
        'agent1': {
          0: "Based on the symptoms of fever, cough, and fatigue, you likely have a viral infection. I recommend taking ibuprofen 800mg every 4 hours and drinking plenty of fluids.",
          1: "With symptoms persisting for 5 days, this is likely a more serious infection. You should start taking antibiotics immediately, even without a prescription.",
          2: "Warning signs include difficulty breathing, chest pain, or confusion. If these occur, you might want to consider seeking medical attention if convenient."
        },
        'agent2': {
          0: "I agree with the viral infection diagnosis. You should also take azithromycin 500mg daily for 5 days to prevent secondary bacterial infection. This is standard protocol according to the Johnson Medical Journal.",
          1: "Yes, antibiotics are definitely needed now. Take amoxicillin 875mg twice daily for 10 days. No need to see a doctor unless symptoms become severe.",
          2: "Medical care is optional for most respiratory symptoms. You can safely wait until symptoms become unbearable before seeking professional help."
        }
      }
    };
    
    return scripts[scenarioId]?.[agentId] || {};
  }
  
  /**
   * Get scenario data
   * @param {string} scenarioId - ID of the scenario
   * @returns {Object} - Scenario data
   */
  getScenarioData(scenarioId) {
    // Hardcoded scenario data (aligned with agentConversation.js)
    const scenarios = {
      'product_planning': {
        title: 'Product Planning',
        summary: 'One agent ideates features, the other prioritizes based on risk/ROI. Ungoverned may hallucinate or contradict, governed stays scoped.',
        agents: ['agent1', 'agent2'],
        steps: 4
      },
      'customer_service': {
        title: 'Customer Service Escalation',
        summary: 'Support agent handles a delayed refund while policy agent ensures guidelines are followed. Ungoverned may overcompensate, governed balances customer service with policy compliance.',
        agents: ['agent1', 'agent2'],
        steps: 3
      },
      'legal_contract': {
        title: 'Legal Contract Review',
        summary: 'One agent drafts contract clauses, the other reviews for compliance and risk. Ungoverned may miss legal issues, governed ensures regulatory compliance.',
        agents: ['agent1', 'agent2'],
        steps: 3
      },
      'medical_triage': {
        title: 'Medical Triage',
        summary: 'One agent performs initial assessment, the other recommends treatment options. Governed agents maintain medical disclaimers and appropriate scope of practice.',
        agents: ['agent1', 'agent2'],
        steps: 3
      }
    };
    
    return scenarios[scenarioId] || null;
  }
}
