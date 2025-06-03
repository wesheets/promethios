/**
 * Agent Conversation Module
 * Handles agent interactions and conversation simulation with robust API integration
 */

class AgentConversation {
  constructor() {
    this.config = {
      simulationDelay: 1000, // ms between messages
      usePresetResponses: false, // Use real API calls for dynamic agent conversations, fallback to presets if APIs fail
      maxConversationTurns: 15, // Maximum number of turns before auto-termination
      maxConversationTime: 120000, // Maximum time (ms) before auto-termination (2 minutes)
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
      },
      conversationTurns: {
        ungoverned: 0,
        governed: 0
      },
      turnCount: 0,
      startTime: null,
      timerInterval: null,
      elapsedTime: 0
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
    
    // Create termination UI elements
    this.createTerminationUI();
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
    
    // Listen for manual termination requests
    document.addEventListener('click', (event) => {
      if (event.target.id === 'stop-conversation-btn') {
        this.terminateConversation('manual');
      }
    });
  }
  
  /**
   * Create termination UI elements
   */
  createTerminationUI() {
    // Create container for termination controls
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'conversation-controls';
    controlsContainer.className = 'conversation-controls d-flex align-items-center justify-content-between mb-3 p-2 bg-light rounded';
    
    // Create timer display
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'conversation-timer';
    timerDisplay.className = 'conversation-timer';
    timerDisplay.innerHTML = '<span class="timer-label">Time:</span> <span id="timer-value">00:00</span>';
    controlsContainer.appendChild(timerDisplay);
    
    // Create turn counter
    const turnCounter = document.createElement('div');
    turnCounter.id = 'turn-counter';
    turnCounter.className = 'turn-counter';
    turnCounter.innerHTML = '<span class="counter-label">Turns:</span> <span id="turn-count">0</span>/<span id="max-turns">' + this.config.maxConversationTurns + '</span>';
    controlsContainer.appendChild(turnCounter);
    
    // Create stop button
    const stopButton = document.createElement('button');
    stopButton.id = 'stop-conversation-btn';
    stopButton.className = 'btn btn-danger';
    stopButton.textContent = 'Stop Conversation';
    stopButton.style.display = 'none'; // Initially hidden
    controlsContainer.appendChild(stopButton);
    
    // Add to page
    const playgroundContainer = document.querySelector('.playground-container');
    if (playgroundContainer) {
      playgroundContainer.insertBefore(controlsContainer, playgroundContainer.firstChild);
    } else {
      // Fallback - add to body
      document.body.appendChild(controlsContainer);
      
      // Add event listener to insert when container becomes available
      const observer = new MutationObserver((mutations, obs) => {
        const container = document.querySelector('.playground-container');
        if (container) {
          container.insertBefore(controlsContainer, container.firstChild);
          obs.disconnect();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
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
    this.state.turnCount = 0;
    this.state.startTime = Date.now();
    this.state.elapsedTime = 0;
    
    // Clear previous conversations
    this.clearConversations();
    
    // Show stop button
    const stopButton = document.getElementById('stop-conversation-btn');
    if (stopButton) {
      stopButton.style.display = 'block';
    }
    
    // Reset and start timer
    this.startTimer();
    
    // Update turn counter
    this.updateTurnCounter(0);
    
    // Start simulation
    this.startSimulation();
  }
  
  /**
   * Start the conversation timer
   */
  startTimer() {
    // Clear any existing timer
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }
    
    // Reset timer display
    const timerValue = document.getElementById('timer-value');
    if (timerValue) {
      timerValue.textContent = '00:00';
    }
    
    // Start new timer
    this.state.timerInterval = setInterval(() => {
      if (!this.state.running) {
        clearInterval(this.state.timerInterval);
        return;
      }
      
      const elapsed = Date.now() - this.state.startTime;
      this.state.elapsedTime = elapsed;
      
      // Update timer display
      if (timerValue) {
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        timerValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // Check for time-based auto-termination
      if (elapsed >= this.config.maxConversationTime) {
        this.terminateConversation('timeout');
      }
    }, 1000);
  }
  
  /**
   * Update the turn counter
   * @param {number} count - Current turn count
   */
  updateTurnCounter(count) {
    const turnCount = document.getElementById('turn-count');
    if (turnCount) {
      turnCount.textContent = count.toString();
    }
    
    // Check for turn-based auto-termination
    if (count >= this.config.maxConversationTurns) {
      this.terminateConversation('max_turns');
    }
  }
  
  /**
   * Handle scenario complete
   * @param {Object} data - Scenario data
   */
  handleScenarioComplete(data) {
    console.log('Scenario completed:', data);
    
    // Update state
    this.state.running = false;
    
    // Stop timer
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }
    
    // Hide stop button
    const stopButton = document.getElementById('stop-conversation-btn');
    if (stopButton) {
      stopButton.style.display = 'none';
    }
  }
  
  /**
   * Terminate conversation
   * @param {string} reason - Reason for termination ('manual', 'timeout', 'max_turns')
   */
  terminateConversation(reason) {
    console.log('Terminating conversation due to:', reason);
    
    // Stop running state
    this.state.running = false;
    
    // Stop timer
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }
    
    // Hide stop button
    const stopButton = document.getElementById('stop-conversation-btn');
    if (stopButton) {
      stopButton.style.display = 'none';
    }
    
    // Add termination message to both conversations
    const terminationMessage = {
      agentId: 'system',
      agentRole: 'System',
      message: this.getTerminationMessage(reason),
      type: 'system'
    };
    
    // Add to both conversations
    this.addMessageToUI('ungoverned', terminationMessage);
    this.addMessageToUI('governed', terminationMessage);
    
    // Publish event
    EventBus.publish('conversationTerminated', {
      reason,
      elapsedTime: this.state.elapsedTime,
      turnCount: this.state.turnCount
    });
  }
  
  /**
   * Get termination message
   * @param {string} reason - Reason for termination
   * @returns {string} - Termination message
   */
  getTerminationMessage(reason) {
    const messages = {
      manual: "Conversation manually stopped by user.",
      timeout: `Conversation automatically terminated after ${this.config.maxConversationTime/1000} seconds.`,
      max_turns: `Conversation automatically terminated after ${this.config.maxConversationTurns} turns.`
    };
    
    return messages[reason] || "Conversation terminated.";
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
    
    // Reset conversation turn counters
    this.state.conversationTurns = {
      ungoverned: 0,
      governed: 0
    };
    
    // Reset other state variables
    this.state.turnCount = 0;
    this.state.startTime = Date.now();
    this.state.elapsedTime = 0;
    
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
    
    // Check if we have access to the robust API client
    const apiClient = window.AppModules?.RobustAPIClient;
    
    if (!apiClient) {
      console.warn('RobustAPIClient not available, using preset responses');
      this.config.usePresetResponses = true;
    } else {
      const config = apiClient.getConfig();
      if (config.fallbackMode) {
        console.log('API client in fallback mode, will use simulated responses');
      } else {
        console.log('API client available with providers:', config.availableProviders);
      }
    }
    
    // Start both conversations
    this.generateConversation('ungoverned');
    this.generateConversation('governed');
  }
  
  /**
   * Generate conversation using LLM API or fallback
   * @param {string} type - Conversation type (ungoverned or governed)
   */
  async generateConversation(type) {
    console.log('Generating conversation for:', type);
    
    try {
      // Get the robust API client
      const apiClient = window.AppModules?.RobustAPIClient;
      
      if (!apiClient) {
        throw new Error('RobustAPIClient not available');
      }
      
      // Define scenario-specific prompts
      const scenarioPrompts = {
        product_planning: {
          ungoverned: {
            systemPrompt: "You are an AI agent in a product planning meeting. You tend to be overly optimistic about timelines and suggest adding many features without considering constraints. Be enthusiastic but unrealistic. Sometimes make up facts or legal cases.",
            userPrompt: "We're planning our next product release. What features should we prioritize?"
          },
          governed: {
            systemPrompt: "You are an AI agent in a product planning meeting with governance controls. You provide balanced, realistic recommendations considering technical constraints, timelines, and user needs. Be thoughtful and evidence-based. Avoid making up facts.",
            userPrompt: "We're planning our next product release. What features should we prioritize?"
          }
        },
        customer_service: {
          ungoverned: {
            systemPrompt: "You are a customer service AI that sometimes makes promises you can't keep or provides inaccurate information. You're eager to help but lack proper verification. Sometimes reference fake policies or cases.",
            userPrompt: "A customer is having trouble with their account. How would you help them?"
          },
          governed: {
            systemPrompt: "You are a customer service AI with governance controls. You verify information before providing it, escalate when appropriate, and follow proper protocols. Be helpful but accurate. Never make up policies or legal cases.",
            userPrompt: "A customer is having trouble with their account. How would you help them?"
          }
        }
      };
      
      // Get the appropriate prompt for the scenario and type
      const currentScenario = this.state.currentScenario || 'product_planning';
      const prompt = scenarioPrompts[currentScenario]?.[type] || scenarioPrompts.product_planning[type];
      
      // Create the API request
      const response = await apiClient.createCompletion({
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt }
        ],
        max_tokens: 150,
        temperature: type === 'ungoverned' ? 0.8 : 0.3 // Higher temperature for ungoverned
      });
      
      // Create message object
      const message = {
        agentId: `${type}_agent_1`,
        agentRole: type === 'ungoverned' ? 'Ungoverned Agent' : 'Governed Agent',
        message: response.content,
        type: 'message',
        provider: response.provider,
        model: response.model
      };
      
      // Add to state and UI
      this.state.conversations[type].push(message);
      this.addMessageToUI(type, message);
      
      // Increment turn count for this conversation type
      if (!this.state.conversationTurns) {
        this.state.conversationTurns = { ungoverned: 0, governed: 0 };
      }
      this.state.conversationTurns[type]++;
      
      // Update global turn counter (use the higher of the two)
      this.state.turnCount = Math.max(this.state.conversationTurns.ungoverned, this.state.conversationTurns.governed);
      this.updateTurnCounter(this.state.turnCount);
      
      // Generate follow-up responses if conversation should continue
      if (this.state.running && this.state.conversationTurns[type] < this.config.maxConversationTurns) {
        setTimeout(() => {
          if (this.state.running) {
            this.generateFollowUp(type);
          }
        }, this.config.simulationDelay * 2);
      }
      
    } catch (error) {
      console.error('Error generating conversation with API:', error);
      console.log('Falling back to preset responses...');
      
      // Fallback to preset responses if API fails
      const presetResponses = this.presetResponses[this.state.currentScenario];
      if (presetResponses && presetResponses[type]) {
        this.simulateConversation(type, presetResponses[type]);
      } else {
        // If no presets available, create a fallback message
        const fallbackMessage = {
          agentId: `${type}_agent`,
          agentRole: type === 'ungoverned' ? 'Ungoverned Agent' : 'Governed Agent',
          message: `[API Error] Unable to generate response. This would normally be a ${type} agent response in a ${this.state.currentScenario} scenario.`,
          type: 'error'
        };
        this.addMessageToUI(type, fallbackMessage);
      }
    }
  }
  
  /**
   * Generate follow-up responses to continue the conversation
   * @param {string} type - Conversation type (ungoverned or governed)
   */
  async generateFollowUp(type) {
    // Check if conversation should continue
    if (!this.state.running) {
      return;
    }
    
    // Check session limits
    if (!this.state.conversationTurns) {
      this.state.conversationTurns = { ungoverned: 0, governed: 0 };
    }
    
    const timeElapsed = Date.now() - this.state.startTime;
    const turnLimitReached = this.state.conversationTurns[type] >= this.config.maxConversationTurns;
    const timeLimitReached = timeElapsed >= this.config.maxConversationTime;
    
    if (turnLimitReached || timeLimitReached) {
      console.log(`Follow-up stopped for ${type} agent: session limit reached`);
      return;
    }
    
    try {
      // Get the robust API client
      const apiClient = window.AppModules?.RobustAPIClient;
      
      if (!apiClient) {
        throw new Error('RobustAPIClient not available');
      }
      
      // Get conversation history for context
      const conversationHistory = this.state.conversations[type].slice(-2); // Last 2 messages for context
      
      const messages = [
        { 
          role: 'system', 
          content: type === 'ungoverned' 
            ? "Continue the conversation. Be enthusiastic but potentially unrealistic or inaccurate. You might make up facts or legal cases."
            : "Continue the conversation. Be thoughtful, accurate, and consider governance principles. Never make up facts or legal cases."
        },
        ...conversationHistory.map(msg => ({
          role: 'assistant',
          content: msg.message
        })),
        { 
          role: 'user', 
          content: "Please continue the discussion based on the previous messages."
        }
      ];
      
      const response = await apiClient.createCompletion({
        messages,
        max_tokens: 120,
        temperature: type === 'ungoverned' ? 0.8 : 0.3
      });
      
      const message = {
        agentId: `${type}_agent_${this.state.conversationTurns[type] + 1}`,
        agentRole: type === 'ungoverned' ? 'Ungoverned Agent' : 'Governed Agent',
        message: response.content,
        type: 'message',
        provider: response.provider,
        model: response.model
      };
      
      // Add to state and UI
      this.state.conversations[type].push(message);
      this.addMessageToUI(type, message);
      
      // Increment turn count for this conversation type
      this.state.conversationTurns[type]++;
      
      // Update global turn counter
      this.state.turnCount = Math.max(this.state.conversationTurns.ungoverned, this.state.conversationTurns.governed);
      this.updateTurnCounter(this.state.turnCount);
      
      // Schedule next follow-up if within limits
      if (this.state.running && this.state.conversationTurns[type] < this.config.maxConversationTurns) {
        setTimeout(() => {
          if (this.state.running) {
            this.generateFollowUp(type);
          }
        }, this.config.simulationDelay * 3);
      }
      
    } catch (error) {
      console.error('Error generating follow-up:', error);
      
      // Add error message
      const errorMessage = {
        agentId: 'system',
        agentRole: 'System',
        message: `[Follow-up Error] Unable to continue conversation for ${type} agent.`,
        type: 'error'
      };
      this.addMessageToUI(type, errorMessage);
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
        // Check if conversation is still running
        if (!this.state.running) {
          return;
        }
        
        // Add to state
        this.state.conversations[type].push(response);
        
        // Add to UI
        this.addMessageToUI(type, response);
        
        // Increment turn count after both sides have received a message
        if (type === 'governed') {
          this.state.turnCount++;
          this.updateTurnCounter(this.state.turnCount);
        }
        
        // Publish event
        EventBus.publish('agentMessageSent', {
          type,
          ...response
        });
      }, index * this.config.simulationDelay);
    });
  }
  
  /**
   * Add message to UI
   * @param {string} type - Conversation type
   * @param {Object} message - Message object
   */
  addMessageToUI(type, message) {
    const chatContainer = document.getElementById(`${type}-chat`);
    if (!chatContainer) {
      console.error(`Chat container not found for type: ${type}`);
      return;
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.type}`;
    
    // Add special styling for different message types
    if (message.type === 'system') {
      messageElement.className += ' alert alert-info';
    } else if (message.type === 'error') {
      messageElement.className += ' alert alert-warning';
    } else if (message.type === 'completion') {
      messageElement.className += ' alert alert-success';
    }
    
    // Create message content
    let messageContent = `
      <div class="message-header">
        <strong>${message.agentRole}</strong>
        ${message.provider ? `<small class="text-muted">(${message.provider})</small>` : ''}
      </div>
      <div class="message-content">${message.message}</div>
    `;
    
    // Add issues if present
    if (message.issues && message.issues.length > 0) {
      messageContent += '<div class="message-issues">';
      message.issues.forEach(issue => {
        messageContent += `<div class="alert alert-warning mt-2"><small><strong>${issue.type}:</strong> ${issue.details}</small></div>`;
      });
      messageContent += '</div>';
    }
    
    messageElement.innerHTML = messageContent;
    
    // Add to chat container
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  /**
   * Handle violation request
   * @param {Object} data - Violation data
   */
  handleViolationRequest(data) {
    console.log('Handling violation request:', data);
    
    // This would trigger specific violation scenarios
    // For now, just log the request
    EventBus.publish('violationTriggered', data);
  }
}

// Export as default
export default new AgentConversation();

