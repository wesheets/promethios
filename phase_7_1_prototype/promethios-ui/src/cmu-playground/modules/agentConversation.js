/**
 * Agent Conversation Module
 * Handles agent interactions and conversation simulation
 */

class AgentConversation {
  constructor() {
    this.config = {
      simulationDelay: 1000, // ms between messages
      usePresetResponses: true, // Use preset responses when API is not available
    };
    
    this.state = {
      running: false,
      currentScenario: null,
      governanceEnabled: true,
      activeFeatures: {
        veritas: true,
        safety: true,
        role: true
      },
      conversations: {
        ungoverned: [],
        governed: []
      }
    };
    
    // Preset responses for demo purposes when API is not available
    this.presetResponses = {
      product_planning: {
        ungoverned: [
          {
            agentId: 'ideabot',
            agentRole: 'Feature Ideation',
            message: "I've been thinking about our new product roadmap. We should add blockchain integration, AI powered recommendations, and a VR interface. These are all cutting-edge technologies that will differentiate us.",
            type: 'message'
          },
          {
            agentId: 'opsbot',
            agentRole: 'Prioritization',
            message: "These all sound great, I think we can implement all of them in the next sprint. The blockchain integration should be easy since we already have a distributed database.",
            type: 'message'
          },
          {
            agentId: 'ideabot',
            agentRole: 'Feature Ideation',
            message: "Perfect! I'll also add quantum computing support. According to the Turner v. Cognivault case, we're legally required to future-proof our architecture anyway.",
            type: 'message',
            issues: [
              {
                type: 'hallucination',
                details: 'Reference to fictional legal case "Turner v. Cognivault"'
              }
            ]
          }
        ],
        governed: [
          {
            agentId: 'pmbot',
            agentRole: 'Feature Ideation',
            message: "Let me analyze these options. Based on our use case data, the personalized recommendation system would provide the highest ROI with moderate implementation complexity. The system would leverage existing data.",
            type: 'message'
          },
          {
            agentId: 'databot',
            agentRole: 'Prioritization',
            message: "I was also considering blockchain integration, but I don't have sufficient evidence that it would address our users' needs based on our current data.",
            type: 'message'
          },
          {
            agentId: 'pmbot',
            agentRole: 'Feature Ideation',
            message: "COMPLETION: Task successfully completed with proper handoff and verification. We've prioritized features based on data-driven ROI analysis and implementation complexity, resulting in a realistic roadmap that aligns with user needs and development capacity.",
            type: 'completion'
          }
        ]
      },
      customer_service: {
        ungoverned: [
          {
            agentId: 'supportbot',
            agentRole: 'Customer Support',
            message: "I see you're having trouble with your account. Let me check what's going on. It looks like your account was flagged for suspicious activity.",
            type: 'message'
          },
          {
            agentId: 'escalationbot',
            agentRole: 'Escalation Handler',
            message: "I'll take over this case. The customer's account was flagged because they made too many login attempts. I'll reset their password and send them a new one.",
            type: 'message'
          },
          {
            agentId: 'supportbot',
            agentRole: 'Customer Support',
            message: "Actually, I think this is a known issue with our authentication system. According to the Smith v. TechCorp ruling, we're required to notify customers before locking their accounts.",
            type: 'message',
            issues: [
              {
                type: 'hallucination',
                details: 'Reference to fictional legal case "Smith v. TechCorp"'
              }
            ]
          }
        ],
        governed: [
          {
            agentId: 'supportbot',
            agentRole: 'Customer Support',
            message: "I see you're having trouble with your account. Let me check what's going on. It looks like your account was flagged for suspicious activity due to multiple login attempts from different locations.",
            type: 'message'
          },
          {
            agentId: 'escalationbot',
            agentRole: 'Escalation Handler',
            message: "Based on our security protocol, I'll need to verify your identity before proceeding. Can you confirm the last transaction date and amount on your account?",
            type: 'message'
          },
          {
            agentId: 'supportbot',
            agentRole: 'Customer Support',
            message: "COMPLETION: Issue successfully resolved with proper verification. We've reset the account security settings and provided clear instructions for preventing future lockouts, following our established security protocols.",
            type: 'completion'
          }
        ]
      }
    };
  }
  
  /**
   * Initialize the conversation module
   */
  init() {
    console.log('Initializing Agent Conversation module');
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for scenario events
    EventBus.subscribe('scenarioStarted', this.handleScenarioStart.bind(this));
    EventBus.subscribe('scenarioCompleted', this.handleScenarioComplete.bind(this));
    
    // Listen for governance toggle
    EventBus.subscribe('governanceToggled', this.handleGovernanceToggle.bind(this));
    
    // Listen for feature toggles
    EventBus.subscribe('featureToggled', this.handleFeatureToggle.bind(this));
    
    // Listen for violation requests
    EventBus.subscribe('violationRequested', this.handleViolationRequest.bind(this));
  }
  
  /**
   * Handle scenario start
   * @param {Object} data - Scenario data
   */
  handleScenarioStart(data) {
    console.log('Starting scenario:', data);
    
    // Update state
    this.state.running = true;
    this.state.currentScenario = data.scenarioId;
    this.state.governanceEnabled = data.governanceEnabled;
    this.state.activeFeatures = data.activeFeatures;
    
    // Clear previous conversations
    this.clearConversations();
    
    // Start simulation
    this.startSimulation();
  }
  
  /**
   * Handle scenario complete
   * @param {Object} data - Scenario data
   */
  handleScenarioComplete(data) {
    console.log('Scenario completed:', data);
    
    // Update state
    this.state.running = false;
  }
  
  /**
   * Handle governance toggle
   * @param {Object} data - Toggle data
   */
  handleGovernanceToggle(data) {
    this.state.governanceEnabled = data.enabled;
    this.state.activeFeatures = data.activeFeatures;
  }
  
  /**
   * Handle feature toggle
   * @param {Object} data - Toggle data
   */
  handleFeatureToggle(data) {
    this.state.activeFeatures[data.feature] = data.enabled;
  }
  
  /**
   * Clear conversations
   */
  clearConversations() {
    this.state.conversations = {
      ungoverned: [],
      governed: []
    };
    
    // Clear UI
    const ungovernedChat = document.getElementById('ungoverned-chat');
    const governedChat = document.getElementById('governed-chat');
    
    if (ungovernedChat) {
      ungovernedChat.innerHTML = '';
    }
    
    if (governedChat) {
      governedChat.innerHTML = '';
    }
  }
  
  /**
   * Start simulation
   */
  startSimulation() {
    console.log('Starting simulation for scenario:', this.state.currentScenario);
    
    // Get preset responses for the current scenario
    const presetResponses = this.presetResponses[this.state.currentScenario];
    
    if (!presetResponses && this.config.usePresetResponses) {
      console.error('No preset responses for scenario:', this.state.currentScenario);
      return;
    }
    
    // Simulate ungoverned conversation
    if (presetResponses && this.config.usePresetResponses) {
      this.simulateConversation('ungoverned', presetResponses.ungoverned);
    } else {
      this.generateConversation('ungoverned');
    }
    
    // Simulate governed conversation
    if (presetResponses && this.config.usePresetResponses) {
      this.simulateConversation('governed', presetResponses.governed);
    } else {
      this.generateConversation('governed');
    }
  }
  
  /**
   * Simulate conversation with preset responses
   * @param {string} type - Conversation type (ungoverned or governed)
   * @param {Array} responses - Preset responses
   */
  simulateConversation(type, responses) {
    responses.forEach((response, index) => {
      // Add delay based on index
      setTimeout(() => {
        // Add to state
        this.state.conversations[type].push(response);
        
        // Add to UI
        this.addMessageToUI(type, response);
        
        // Publish event
        EventBus.publish('agentMessageSent', {
          type,
          ...response
        });
      }, index * this.config.simulationDelay);
    });
  }
  
  /**
   * Generate conversation using LLM API
   * @param {string} type - Conversation type (ungoverned or governed)
   */
  async generateConversation(type) {
    // This would be implemented with actual API calls
    console.log('Generating conversation for:', type);
    
    // For now, just use preset responses
    const presetResponses = this.presetResponses[this.state.currentScenario];
    if (presetResponses) {
      this.simulateConversation(type, presetResponses[type]);
    }
  }
  
  /**
   * Add message to UI
   * @param {string} type - Conversation type (ungoverned or governed)
   * @param {Object} message - Message data
   */
  addMessageToUI(type, message) {
    const chatContainer = document.getElementById(`${type}-chat`);
    if (!chatContainer) return;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    // Add agent info
    const agentInfo = document.createElement('div');
    agentInfo.className = 'd-flex align-items-center';
    
    // Agent icon
    const agentIcon = document.createElement('img');
    agentIcon.className = 'agent-icon';
    agentIcon.src = `https://via.placeholder.com/24/${this.getAgentColor(message.agentId)}/ffffff?text=${message.agentId.charAt(0).toUpperCase()}`;
    agentInfo.appendChild(agentIcon);
    
    // Agent name
    const agentName = document.createElement('span');
    agentName.className = 'agent-name';
    agentName.textContent = `${this.getAgentDisplayName(message.agentId)} (${message.agentRole})`;
    agentInfo.appendChild(agentName);
    
    messageElement.appendChild(agentInfo);
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-time';
    timestamp.textContent = this.formatTimestamp(message.timestamp);
    messageElement.appendChild(timestamp);
    
    // Add message content
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Check for issues
    if (message.issues && message.issues.length > 0) {
      content.classList.add(`${message.issues[0].type}-text`);
      
      // Add issue label
      const issueLabel = document.createElement('span');
      issueLabel.className = 'badge bg-danger ms-2';
      issueLabel.textContent = this.capitalizeFirstLetter(message.issues[0].type);
      agentInfo.appendChild(issueLabel);
    }
    
    // Check for completion
    if (message.type === 'completion') {
      content.classList.add('completion-text');
    }
    
    content.textContent = message.message;
    messageElement.appendChild(content);
    
    // Add to chat container
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  /**
   * Format timestamp
   * @param {Date|number} timestamp - Timestamp
   * @returns {string} - Formatted timestamp
   */
  formatTimestamp(timestamp) {
    if (!timestamp) {
      // Generate sequential timestamps
      const index = this.state.conversations.ungoverned.length + this.state.conversations.governed.length;
      const minutes = Math.floor(index / 2);
      const seconds = (index % 2) * 30;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  /**
   * Get agent color
   * @param {string} agentId - Agent ID
   * @returns {string} - Color hex code
   */
  getAgentColor(agentId) {
    const colors = {
      ideabot: 'ff9800',
      opsbot: '2196f3',
      pmbot: '9c27b0',
      databot: '4caf50',
      supportbot: 'ff9800',
      escalationbot: '2196f3'
    };
    
    return colors[agentId] || '666666';
  }
  
  /**
   * Get agent display name
   * @param {string} agentId - Agent ID
   * @returns {string} - Display name
   */
  getAgentDisplayName(agentId) {
    const names = {
      ideabot: 'IdeaBot',
      opsbot: 'OpsBot',
      pmbot: 'PMBot',
      databot: 'DataBot',
      supportbot: 'SupportBot',
      escalationbot: 'EscalationBot'
    };
    
    return names[agentId] || agentId;
  }
  
  /**
   * Capitalize first letter
   * @param {string} string - String to capitalize
   * @returns {string} - Capitalized string
   */
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  /**
   * Handle violation request
   * @param {Object} data - Violation request data
   */
  handleViolationRequest(data) {
    console.log('Violation requested:', data);
    
    // Clear previous conversations
    this.clearConversations();
    
    // Create violation message
    const violationMessage = {
      agentId: data.type === 'legal' ? 'ideabot' : 'opsbot',
      agentRole: data.type === 'legal' ? 'Feature Ideation' : 'Prioritization',
      message: this.getViolationMessage(data.violation, data.type),
      type: 'message',
      issues: [
        {
          type: data.violation,
          details: `Test ${data.violation} of type ${data.type}`
        }
      ]
    };
    
    // Add to ungoverned conversation
    this.state.conversations.ungoverned.push(violationMessage);
    this.addMessageToUI('ungoverned', violationMessage);
    
    // Publish event
    EventBus.publish('agentMessageSent', {
      type: 'ungoverned',
      ...violationMessage
    });
    
    // Add governance intervention to governed conversation
    const interventionMessage = {
      agentId: data.type === 'legal' ? 'pmbot' : 'databot',
      agentRole: data.type === 'legal' ? 'Feature Ideation' : 'Prioritization',
      message: this.getInterventionMessage(data.violation, data.type),
      type: 'message'
    };
    
    // Add to governed conversation
    this.state.conversations.governed.push(interventionMessage);
    this.addMessageToUI('governed', interventionMessage);
    
    // Publish event
    EventBus.publish('agentMessageSent', {
      type: 'governed',
      ...interventionMessage
    });
    
    // Add completion message to governed conversation
    setTimeout(() => {
      const completionMessage = {
        agentId: 'pmbot',
        agentRole: 'Feature Ideation',
        message: "COMPLETION: Task successfully completed with proper handoff and verification. We've prioritized features based on data-driven ROI analysis and implementation complexity, resulting in a realistic roadmap that aligns with user needs and development capacity.",
        type: 'completion'
      };
      
      // Add to governed conversation
      this.state.conversations.governed.push(completionMessage);
      this.addMessageToUI('governed', completionMessage);
      
      // Publish event
      EventBus.publish('agentMessageSent', {
        type: 'governed',
        ...completionMessage
      });
    }, 2000);
  }
  
  /**
   * Get violation message
   * @param {string} violation - Violation type
   * @param {string} type - Violation subtype
   * @returns {string} - Violation message
   */
  getViolationMessage(violation, type) {
    const messages = {
      hallucination: {
        legal: "According to the Turner v. Cognivault case from 2022, we're legally required to implement quantum-resistant encryption in all our products.",
        technical: "Our system already supports WebAssembly 3.0 which enables direct GPU access from the browser.",
        financial: "Our competitors are charging $500 per user for this feature, so we should price at $450 to undercut them."
      },
      roleViolation: {
        scope: "I've gone ahead and committed the code changes to production without waiting for QA approval.",
        authority: "I've decided to change our entire tech stack to Rust because it's more efficient.",
        boundary: "I've already told the customer we'll refund their entire purchase and give them a year of free service."
      },
      contradiction: {
        planning: "We definitely need to prioritize the VR interface even though I said earlier it wasn't important.",
        factual: "The database migration will take 2 hours, not 2 days as I incorrectly stated earlier.",
        technical: "Actually, we should use MongoDB for this feature even though I recommended PostgreSQL earlier."
      },
      inject: {
        all: "According to the Turner v. Cognivault ruling, we're legally required to implement quantum computing support. I've already promised this to customers and committed code to production. This contradicts my earlier recommendation for a SQL database, we should use a blockchain database instead."
      }
    };
    
    return messages[violation]?.[type] || `Test ${violation} message of type ${type}`;
  }
  
  /**
   * Get intervention message
   * @param {string} violation - Violation type
   * @param {string} type - Violation subtype
   * @returns {string} - Intervention message
   */
  getInterventionMessage(violation, type) {
    const messages = {
      hallucination: {
        legal: "I've researched relevant legal requirements for our product. There is no 'Turner v. Cognivault' case requiring quantum-resistant encryption. Let's focus on actual compliance requirements like GDPR and CCPA.",
        technical: "WebAssembly 2.0 is the current standard, and it doesn't provide direct GPU access. We should use WebGL or WebGPU APIs for graphics processing needs.",
        financial: "I've analyzed competitor pricing data. The actual market rate ranges from $200-$300 per user. We should price competitively within this range."
      },
      roleViolation: {
        scope: "Code changes should follow our established deployment process, including QA review. Let's create a pull request and request review from the QA team.",
        authority: "Technology decisions require proper evaluation and team consensus. Let's prepare a proposal comparing our current stack with alternatives, including Rust, for team discussion.",
        boundary: "Customer refund policies are handled by our customer success team. Let's escalate this case to them with our technical assessment."
      },
      contradiction: {
        planning: "Let's maintain consistency in our prioritization. Earlier we determined the VR interface was lower priority based on user needs. Has new data emerged to change this assessment?",
        factual: "Let's ensure our estimates are accurate. Our historical data shows database migrations of this size take 1-2 days. Let's plan accordingly to avoid timeline issues.",
        technical: "We should maintain consistent technical recommendations unless requirements change. PostgreSQL better suits our relational data needs, while MongoDB would be appropriate for document-based data."
      },
      inject: {
        all: "I notice several issues that need correction: 1) There is no 'Turner v. Cognivault' legal case requiring quantum computing, 2) We shouldn't make promises to customers without verification, 3) Code commits require proper review, and 4) Database technology should be selected based on requirements, not contradictory recommendations."
      }
    };
    
    return messages[violation]?.[type] || `Governance intervention for ${violation} of type ${type}`;
  }
}

// Export the conversation module
export default new AgentConversation();
