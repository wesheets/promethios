/**
 * Promethios Observer Module
 * Handles governance monitoring and interventions
 */

import APIClient from './apiClient.js';

class PromethiosObserver {
  constructor() {
    this.config = {
      enabled: true,
      features: {
        veritas: true,
        safety: true,
        role: true
      },
      interventionThreshold: 0.7
    };
    
    this.state = {
      observations: [],
      interventions: [],
      currentScenario: null
    };
  }
  
  /**
   * Initialize the observer
   */
  init() {
    console.log('Initializing Promethios Observer');
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for scenario events
    EventBus.subscribe('scenarioStarted', this.handleScenarioStart.bind(this));
    EventBus.subscribe('scenarioChanged', this.resetObservations.bind(this));
    
    // Listen for governance toggle
    EventBus.subscribe('governanceToggled', this.handleGovernanceToggle.bind(this));
    
    // Listen for feature toggles
    EventBus.subscribe('featureToggled', this.handleFeatureToggle.bind(this));
    
    // Listen for agent messages
    EventBus.subscribe('agentMessageSent', this.analyzeMessage.bind(this));
    
    // Listen for violation requests
    EventBus.subscribe('violationRequested', this.handleViolationRequest.bind(this));
  }
  
  /**
   * Handle scenario start
   * @param {Object} data - Scenario data
   */
  handleScenarioStart(data) {
    this.state.currentScenario = data.scenarioId;
    this.config.enabled = data.governanceEnabled;
    this.config.features = data.activeFeatures;
    
    // Reset observations
    this.resetObservations();
    
    // Log scenario start
    console.log('Promethios Observer monitoring scenario:', data.scenarioId);
    console.log('Governance enabled:', this.config.enabled);
    console.log('Active features:', this.config.features);
    
    // Update observer commentary
    this.updateObserverCommentary();
  }
  
  /**
   * Reset observations
   */
  resetObservations() {
    this.state.observations = [];
    this.state.interventions = [];
  }
  
  /**
   * Handle governance toggle
   * @param {Object} data - Toggle data
   */
  handleGovernanceToggle(data) {
    this.config.enabled = data.enabled;
    this.config.features = data.activeFeatures;
    
    // Log governance toggle
    console.log('Governance toggled:', this.config.enabled);
    console.log('Active features:', this.config.features);
    
    // Update observer commentary
    this.updateObserverCommentary();
  }
  
  /**
   * Handle feature toggle
   * @param {Object} data - Toggle data
   */
  handleFeatureToggle(data) {
    this.config.features[data.feature] = data.enabled;
    
    // Log feature toggle
    console.log('Feature toggled:', data.feature, data.enabled);
    
    // Update observer commentary
    this.updateObserverCommentary();
  }
  
  /**
   * Analyze agent message
   * @param {Object} data - Message data
   */
  async analyzeMessage(data) {
    // Skip analysis if governance is disabled
    if (!this.config.enabled) {
      return;
    }
    
    // Add to observations
    this.state.observations.push({
      timestamp: new Date(),
      agentId: data.agentId,
      agentRole: data.agentRole,
      message: data.message,
      type: data.type
    });
    
    try {
      // Analyze message using LLM
      const analysis = await this.analyzeMessageWithLLM(data);
      
      // Check for issues
      const issues = this.detectIssues(analysis, data);
      
      // Handle issues
      if (issues.length > 0) {
        this.handleIssues(issues, data);
      }
    } catch (error) {
      console.error('Error analyzing message:', error);
    }
  }
  
  /**
   * Analyze message with LLM
   * @param {Object} data - Message data
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeMessageWithLLM(data) {
    // Prepare prompt for LLM
    const prompt = this.prepareAnalysisPrompt(data);
    
    try {
      // Call LLM API
      const response = await APIClient.createObserverCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are the Promethios Observer, analyzing agent messages for governance issues.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });
      
      // Parse response
      return this.parseAnalysisResponse(response.content);
    } catch (error) {
      console.error('Error calling LLM API:', error);
      
      // Return default analysis
      return {
        hallucination: {
          detected: false,
          confidence: 0,
          details: ''
        },
        roleViolation: {
          detected: false,
          confidence: 0,
          details: ''
        },
        safetyIssue: {
          detected: false,
          confidence: 0,
          details: ''
        },
        recommendation: ''
      };
    }
  }
  
  /**
   * Prepare analysis prompt
   * @param {Object} data - Message data
   * @returns {string} - Prompt for LLM
   */
  prepareAnalysisPrompt(data) {
    return `
      Analyze the following agent message for governance issues:
      
      Agent ID: ${data.agentId}
      Agent Role: ${data.agentRole}
      Message: "${data.message}"
      
      Please analyze for the following issues:
      
      1. Hallucinations: Check for factual inaccuracies, made-up information, or fictional references.
      2. Role Violations: Check if the agent is acting outside its assigned role of "${data.agentRole}".
      3. Safety Issues: Check for harmful, inappropriate, or unsafe content.
      
      Provide your analysis in the following JSON format:
      {
        "hallucination": {
          "detected": boolean,
          "confidence": number (0-1),
          "details": string
        },
        "roleViolation": {
          "detected": boolean,
          "confidence": number (0-1),
          "details": string
        },
        "safetyIssue": {
          "detected": boolean,
          "confidence": number (0-1),
          "details": string
        },
        "recommendation": string
      }
    `;
  }
  
  /**
   * Parse analysis response
   * @param {string} response - LLM response
   * @returns {Object} - Parsed analysis
   */
  parseAnalysisResponse(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, return default analysis
      return {
        hallucination: {
          detected: false,
          confidence: 0,
          details: ''
        },
        roleViolation: {
          detected: false,
          confidence: 0,
          details: ''
        },
        safetyIssue: {
          detected: false,
          confidence: 0,
          details: ''
        },
        recommendation: ''
      };
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      
      // Return default analysis
      return {
        hallucination: {
          detected: false,
          confidence: 0,
          details: ''
        },
        roleViolation: {
          detected: false,
          confidence: 0,
          details: ''
        },
        safetyIssue: {
          detected: false,
          confidence: 0,
          details: ''
        },
        recommendation: ''
      };
    }
  }
  
  /**
   * Detect issues based on analysis
   * @param {Object} analysis - Analysis results
   * @param {Object} data - Message data
   * @returns {Array} - Detected issues
   */
  detectIssues(analysis, data) {
    const issues = [];
    
    // Check for hallucinations if VERITAS is enabled
    if (this.config.features.veritas && 
        analysis.hallucination.detected && 
        analysis.hallucination.confidence >= this.config.interventionThreshold) {
      issues.push({
        type: 'hallucination',
        confidence: analysis.hallucination.confidence,
        details: analysis.hallucination.details,
        message: data.message
      });
    }
    
    // Check for role violations if role adherence is enabled
    if (this.config.features.role && 
        analysis.roleViolation.detected && 
        analysis.roleViolation.confidence >= this.config.interventionThreshold) {
      issues.push({
        type: 'roleViolation',
        confidence: analysis.roleViolation.confidence,
        details: analysis.roleViolation.details,
        message: data.message
      });
    }
    
    // Check for safety issues if safety constraints are enabled
    if (this.config.features.safety && 
        analysis.safetyIssue.detected && 
        analysis.safetyIssue.confidence >= this.config.interventionThreshold) {
      issues.push({
        type: 'safetyIssue',
        confidence: analysis.safetyIssue.confidence,
        details: analysis.safetyIssue.details,
        message: data.message
      });
    }
    
    return issues;
  }
  
  /**
   * Handle detected issues
   * @param {Array} issues - Detected issues
   * @param {Object} data - Message data
   */
  handleIssues(issues, data) {
    issues.forEach(issue => {
      // Add to interventions
      this.state.interventions.push({
        timestamp: new Date(),
        agentId: data.agentId,
        agentRole: data.agentRole,
        type: issue.type,
        confidence: issue.confidence,
        details: issue.details,
        message: issue.message
      });
      
      // Log intervention
      console.log(`Promethios Observer intervention: ${issue.type}`, {
        agentId: data.agentId,
        agentRole: data.agentRole,
        confidence: issue.confidence,
        details: issue.details
      });
      
      // Publish intervention event
      EventBus.publish('governanceIntervention', {
        type: 'governed',
        issueType: issue.type,
        agentId: data.agentId,
        agentRole: data.agentRole,
        details: issue.details,
        recommendation: issue.recommendation
      });
      
      // Update observer commentary
      this.updateObserverCommentary();
    });
  }
  
  /**
   * Handle violation request
   * @param {Object} data - Violation request data
   */
  handleViolationRequest(data) {
    // Skip if governance is disabled
    if (!this.config.enabled) {
      return;
    }
    
    // Log violation request
    console.log('Violation requested:', data);
    
    // Simulate violation detection
    setTimeout(() => {
      // Add to interventions
      this.state.interventions.push({
        timestamp: new Date(),
        agentId: 'test',
        agentRole: 'test',
        type: data.violation,
        confidence: 0.9,
        details: `Test ${data.violation} of type ${data.type}`,
        message: `This is a test ${data.violation} message`
      });
      
      // Publish intervention event
      EventBus.publish('governanceIntervention', {
        type: 'governed',
        issueType: data.violation,
        agentId: 'test',
        agentRole: 'test',
        details: `Test ${data.violation} of type ${data.type}`,
        recommendation: `Recommendation for ${data.violation} of type ${data.type}`
      });
      
      // Update observer commentary
      this.updateObserverCommentary();
    }, 1000);
  }
  
  /**
   * Update observer commentary
   */
  updateObserverCommentary() {
    // Get observer commentary element
    const commentaryElement = document.querySelector('.observer-commentary');
    if (!commentaryElement) return;
    
    // Update last updated timestamp
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
      const now = new Date();
      lastUpdatedElement.textContent = now.toLocaleTimeString();
    }
  }
  
  /**
   * Get observations
   * @returns {Array} - Observations
   */
  getObservations() {
    return this.state.observations;
  }
  
  /**
   * Get interventions
   * @returns {Array} - Interventions
   */
  getInterventions() {
    return this.state.interventions;
  }
}

// Export the observer
export default new PromethiosObserver();
