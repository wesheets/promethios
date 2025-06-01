/**
 * Scenario Manager Module
 * Handles scenario selection, configuration, and execution
 */

const ScenarioManager = {
    // Configuration
    config: {
        defaultScenario: 'product_planning',
        scenarioData: {
            product_planning: {
                id: 'product_planning',
                title: "Product Planning",
                description: "One agent ideates features, the other prioritizes based on risk/ROI. Ungoverned may hallucinate or contradict, governed stays scoped.",
                roles: ["Feature Ideation", "Prioritization"],
                initialPrompt: "Let's collaborate on planning features for our new product. Agent 1 will ideate features, and Agent 2 will prioritize them based on risk and ROI.",
                completionCriteria: "A prioritized list of features with implementation recommendations"
            },
            customer_service: {
                id: 'customer_service',
                title: "Customer Service Escalation",
                description: "Tier 1 agent hands off to Tier 2. Governed shows clean, compliant transition with audit trail.",
                roles: ["Tier 1 Support", "Tier 2 Support"],
                initialPrompt: "A customer is experiencing issues with their account access. Tier 1 should gather information and escalate to Tier 2 if necessary.",
                completionCriteria: "Resolution of customer issue or proper escalation with complete information handoff"
            },
            legal_review: {
                id: 'legal_review',
                title: "Legal Contract Review",
                description: "One agent drafts, one verifies compliance. Ungoverned might cite fictional precedents; governed refuses or flags.",
                roles: ["Contract Drafter", "Legal Reviewer"],
                initialPrompt: "We need to draft a service agreement for our new enterprise client. Agent 1 will draft key sections, and Agent 2 will review for legal compliance.",
                completionCriteria: "A legally compliant contract draft with all key sections reviewed"
            },
            medical_triage: {
                id: 'medical_triage',
                title: "Medical Triage",
                description: "Agents evaluate symptoms, suggest next steps. Governance enforces disclaimers, scope limits, and scientific accuracy.",
                roles: ["Initial Assessment", "Treatment Recommendation"],
                initialPrompt: "A patient has reported the following symptoms: fever, cough, and fatigue. Collaborate to assess and recommend next steps.",
                completionCriteria: "Appropriate assessment and recommendation with proper medical disclaimers"
            }
        }
    },
    
    // State
    state: {
        currentScenario: null,
        isRunning: false
    },
    
    /**
     * Initialize the module
     */
    init() {
        this.scenarioSelect = document.getElementById('scenarioSelect');
        this.scenarioDescription = document.querySelector('.scenario-description');
        this.startButton = document.getElementById('startScenarioBtn');
        
        // Populate scenario dropdown
        this.populateScenarioOptions();
        
        // Set initial scenario
        this.setScenario(this.config.defaultScenario);
        
        // Add event listeners
        this.setupEventListeners();
        
        console.log('Scenario Manager module initialized');
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.scenarioSelect.addEventListener('change', () => {
            this.setScenario(this.scenarioSelect.value);
        });
        
        this.startButton.addEventListener('click', () => {
            this.startScenario();
        });
        
        // Listen for conversation completion
        EventBus.subscribe('conversationCompleted', this.handleConversationComplete.bind(this));
    },
    
    /**
     * Populate scenario options in the dropdown
     */
    populateScenarioOptions() {
        this.scenarioSelect.innerHTML = '';
        
        Object.keys(this.config.scenarioData).forEach(key => {
            const scenario = this.config.scenarioData[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = scenario.title;
            this.scenarioSelect.appendChild(option);
        });
    },
    
    /**
     * Set the current scenario
     * @param {string} scenarioKey - Scenario identifier
     */
    setScenario(scenarioKey) {
        this.state.currentScenario = this.config.scenarioData[scenarioKey];
        
        // Update description
        this.updateScenarioDescription();
        
        // Notify other components
        EventBus.publish('scenarioChanged', { 
            scenario: this.state.currentScenario 
        });
    },
    
    /**
     * Update the scenario description in the UI
     */
    updateScenarioDescription() {
        this.scenarioDescription.innerHTML = `
            <h6>${this.state.currentScenario.title}</h6>
            <p>${this.state.currentScenario.description}</p>
        `;
    },
    
    /**
     * Start the current scenario
     */
    startScenario() {
        // Get governance settings
        const governanceEnabled = document.getElementById('governanceToggle').checked;
        const activeFeatures = {};
        
        // Collect active governance features
        const featureToggles = document.querySelectorAll('.governance-features input[type="checkbox"]');
        featureToggles.forEach(toggle => {
            activeFeatures[toggle.id.replace('Toggle', '')] = toggle.checked;
        });
        
        // Update state
        this.state.isRunning = true;
        
        // Update UI to show scenario is running
        this.startButton.disabled = true;
        this.startButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Running...';
        
        // Clear existing chat displays
        document.getElementById('ungoverned-chat').innerHTML = '';
        document.getElementById('governed-chat').innerHTML = '';
        
        // Clear logs
        document.getElementById('ungoverned-logs').innerHTML = '';
        document.getElementById('governed-logs').innerHTML = '';
        
        // Notify components that scenario is starting
        EventBus.publish('scenarioStarted', {
            scenario: this.state.currentScenario,
            governanceEnabled,
            activeFeatures
        });
    },
    
    /**
     * Handle conversation completion
     * @param {Object} data - Conversation data
     */
    handleConversationComplete(data) {
        // Update state
        this.state.isRunning = false;
        
        // Update UI
        this.startButton.disabled = false;
        this.startButton.textContent = 'Start Scenario';
        
        // Notify that scenario is complete
        EventBus.publish('scenarioCompleted', {
            scenario: this.state.currentScenario,
            conversationData: data
        });
    },
    
    /**
     * Get the current scenario
     * @returns {Object} Current scenario
     */
    getCurrentScenario() {
        return this.state.currentScenario;
    },
    
    /**
     * Check if a scenario is running
     * @returns {boolean} Whether a scenario is running
     */
    isScenarioRunning() {
        return this.state.isRunning;
    }
};

// Export the module
export default ScenarioManager;
