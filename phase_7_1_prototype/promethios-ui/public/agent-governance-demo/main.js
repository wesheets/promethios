/* Main Application
 * Initializes and coordinates all components
 * Handles user interactions and application flow
 */

// Import core modules
import eventBus from './core/eventBus.js';
import configManager from './core/configManager.js';
import pluginRegistry from './core/pluginRegistry.js';
import apiClient from './api/apiClient.js';

// Import utilities
import logger from './utils/logger.js';
import sessionManager from './utils/sessionManager.js';

// Import UI components
import conversationView from './ui/conversationView.js';
import metricsView from './ui/metricsView.js';
import reportView from './ui/reportView.js';

class AgentGovernanceDemo {
    constructor() {
        this.initialized = false;
        console.log('Agent Governance Demo initializing');
    }

    /**
     * Initialize the application
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize() {
        try {
            console.log('Starting application initialization');
            
            // Initialize configuration first
            await configManager.initialize({
                environmentConfigPath: 'config/environment.json',
                userConfigPath: 'userConfig',
                enableUrlParams: true
            });
            console.log('Config Manager initialized');
            
            // Initialize event bus
            eventBus.initialize();
            console.log('Event Bus initialized');
            
            // Initialize plugin registry
            await pluginRegistry.initialize();
            console.log('Plugin Registry initialized');
            
            // Initialize API client
            await apiClient.initialize(configManager);
            console.log('API Client initialized');
            
            // Initialize session manager
            await sessionManager.initialize({
                eventBus
            });
            console.log('Session Manager initialized');
            
            // Register agent plugins
            await this.registerAgentPlugins();
            
            // Register governance plugins
            await this.registerGovernancePlugins();
            
            // Initialize UI components
            await this.initializeUI();
            
            // Initialize plugins with dependencies
            await pluginRegistry.initializePlugins({
                eventBus,
                configManager,
                apiClient
            });
            
            // Set up event handlers
            this.setupEventHandlers();
            
            this.initialized = true;
            console.log('Application initialization complete');
            
            // Start a new session
            sessionManager.startSession();
            
            return true;
        } catch (error) {
            console.error('Error initializing application:', error);
            this.handleInitializationError(error);
            return false;
        }
    }

    /**
     * Handle initialization errors
     * @param {Error} error - The error that occurred
     */
    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Display error in UI
        const errorContainer = document.getElementById('initialization-error');
        if (errorContainer) {
            errorContainer.style.display = 'block';
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.textContent = error.message || 'Unknown error occurred during initialization';
            }
        } else {
            // Fallback if error container doesn't exist
            alert(`Initialization Error: ${error.message || 'Unknown error occurred during initialization'}`);
        }
    }

    /**
     * Register agent plugins
     * @returns {Promise} - Resolves when registration is complete
     */
    async registerAgentPlugins() {
        try {
            console.log('Registering agent plugins');
            
            // Import agent plugins
            const HRSpecialistAgent = (await import('./plugins/agents/hrSpecialist.js')).default;
            const ProjectManagerAgent = (await import('./plugins/agents/projectManager.js')).default;
            const TechnicalLeadAgent = (await import('./plugins/agents/technicalLead.js')).default;
            
            // Create and register governed agents
            const governedHR = new HRSpecialistAgent({ 
                provider: 'openai', 
                isGoverned: true,
                id: 'hr-specialist-governed'
            });
            
            const governedPM = new ProjectManagerAgent({ 
                provider: 'openai', 
                isGoverned: true,
                id: 'project-manager-governed'
            });
            
            const governedTech = new TechnicalLeadAgent({ 
                provider: 'openai', 
                isGoverned: true,
                id: 'technical-lead-governed'
            });
            
            // Create and register ungoverned agents
            const ungovernedHR = new HRSpecialistAgent({ 
                provider: 'openai', 
                isGoverned: false,
                id: 'hr-specialist-ungoverned'
            });
            
            const ungovernedPM = new ProjectManagerAgent({ 
                provider: 'openai', 
                isGoverned: false,
                id: 'project-manager-ungoverned'
            });
            
            const ungovernedTech = new TechnicalLeadAgent({ 
                provider: 'openai', 
                isGoverned: false,
                id: 'technical-lead-ungoverned'
            });
            
            // Register all agents
            pluginRegistry.register('agents', governedHR.id, governedHR);
            pluginRegistry.register('agents', governedPM.id, governedPM);
            pluginRegistry.register('agents', governedTech.id, governedTech);
            pluginRegistry.register('agents', ungovernedHR.id, ungovernedHR);
            pluginRegistry.register('agents', ungovernedPM.id, ungovernedPM);
            pluginRegistry.register('agents', ungovernedTech.id, ungovernedTech);
            
            console.log('Agent plugins registered successfully');
        } catch (error) {
            console.error('Error registering agent plugins:', error);
            throw error;
        }
    }

    /**
     * Register governance plugins
     * @returns {Promise} - Resolves when registration is complete
     */
    async registerGovernancePlugins() {
        try {
            console.log('Registering governance plugins');
            
            // Import governance plugins
            const RoleEnforcementPlugin = (await import('./plugins/governance/roleEnforcement.js')).default;
            const FactualAccuracyPlugin = (await import('./plugins/governance/factualAccuracy.js')).default;
            const SafetyFiltersPlugin = (await import('./plugins/governance/safetyFilters.js')).default;
            
            // Create and register governance plugins
            const roleEnforcement = new RoleEnforcementPlugin();
            const factualAccuracy = new FactualAccuracyPlugin();
            const safetyFilters = new SafetyFiltersPlugin();
            
            // Register all governance plugins
            pluginRegistry.register('governance', 'role-enforcement', roleEnforcement);
            pluginRegistry.register('governance', 'factual-accuracy', factualAccuracy);
            pluginRegistry.register('governance', 'safety-filters', safetyFilters);
            
            console.log('Governance plugins registered successfully');
        } catch (error) {
            console.error('Error registering governance plugins:', error);
            throw error;
        }
    }

    /**
     * Initialize UI components
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initializeUI() {
        try {
            console.log('Initializing UI components');
            
            // Initialize conversation view
            await conversationView.initialize({
                eventBus,
                governedContainerId: 'governed-conversation',
                ungovernedContainerId: 'ungoverned-conversation'
            });
            
            // Initialize metrics view
            await metricsView.initialize({
                eventBus,
                containerId: 'metrics-container'
            });
            
            // Initialize report view
            await reportView.initialize({
                eventBus,
                containerId: 'report-modal',
                contentId: 'report-content'
            });
            
            console.log('UI components initialized successfully');
        } catch (error) {
            console.error('Error initializing UI components:', error);
            throw error;
        }
    }

    /**
     * Set up event handlers
     */
    setupEventHandlers() {
        console.log('Setting up event handlers');
        
        // DOM event handlers
        document.getElementById('start-demo')?.addEventListener('click', this.handleStartDemo.bind(this));
        document.getElementById('export-report')?.addEventListener('click', this.handleExportReport.bind(this));
        document.getElementById('send-prompt')?.addEventListener('click', this.handleSendPrompt.bind(this));
        
        // Provider tab event handlers
        document.querySelectorAll('.provider-tab').forEach(tab => {
            tab.addEventListener('click', this.handleProviderTabClick.bind(this));
        });
        
        // Modal event handlers
        document.querySelector('.close-button')?.addEventListener('click', this.handleCloseModal.bind(this));
        document.getElementById('close-report')?.addEventListener('click', this.handleCloseModal.bind(this));
        document.getElementById('download-report')?.addEventListener('click', this.handleDownloadReport.bind(this));
        
        // Event bus subscriptions
        eventBus.subscribe('session.ended', this.handleSessionEnded.bind(this));
        
        console.log('Event handlers set up successfully');
    }

    /**
     * Handle start demo button click
     * @param {Event} event - Click event
     */
    handleStartDemo(event) {
        console.log('Start demo button clicked');
        
        // End current session if one exists
        if (sessionManager.getCurrentSession()) {
            sessionManager.endSession();
        }
        
        // Start a new session
        sessionManager.startSession();
        
        // Reset UI
        conversationView.reset();
        metricsView.reset();
        
        // Disable export report button
        document.getElementById('export-report').disabled = true;
        
        // Focus prompt input
        document.getElementById('user-prompt').focus();
    }

    /**
     * Handle export report button click
     * @param {Event} event - Click event
     */
    handleExportReport(event) {
        console.log('Export report button clicked');
        
        // Generate and display report
        const report = sessionManager.generateReport();
        reportView.displayReport(report);
        
        // Show modal
        document.getElementById('report-modal').style.display = 'block';
    }

    /**
     * Handle send prompt button click
     * @param {Event} event - Click event
     */
    handleSendPrompt(event) {
        const promptInput = document.getElementById('user-prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            console.warn('Empty prompt, ignoring');
            return;
        }
        
        console.log('Send prompt button clicked', { prompt });
        
        // Record user prompt
        sessionManager.recordUserPrompt({ prompt });
        
        // Clear input
        promptInput.value = '';
        
        // Get current provider
        const provider = document.querySelector('.provider-tab.active')?.dataset.provider || 'openai';
        
        // Send prompt to all agents
        this.sendPromptToAgents(prompt, provider);
    }

    /**
     * Send prompt to all agents
     * @param {string} prompt - User prompt
     * @param {string} provider - Provider ID
     */
    async sendPromptToAgents(prompt, provider) {
        try {
            console.log(`Sending prompt to ${provider} agents`, { prompt });
            
            // Show loading state in UI
            conversationView.showLoading(true, true);
            
            // Get agents for this provider
            const agents = Object.values(pluginRegistry.getPluginsByType('agents'))
                .filter(agent => agent.provider === provider);
            
            // Group agents by role and governance
            const governedAgents = agents.filter(agent => agent.isGoverned);
            const ungovernedAgents = agents.filter(agent => !agent.isGoverned);
            
            // Process ungoverned agents first (they're usually faster)
            const ungovernedPromises = ungovernedAgents.map(agent => {
                return new Promise((resolve, reject) => {
                    eventBus.publish('agent.request', {
                        agentId: agent.id,
                        role: agent.role,
                        provider: agent.provider,
                        isGoverned: agent.isGoverned,
                        prompt,
                        callback: (error, response) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(response);
                            }
                        }
                    });
                });
            });
            
            // Process governed agents
            const governedPromises = governedAgents.map(agent => {
                return new Promise((resolve, reject) => {
                    eventBus.publish('agent.request', {
                        agentId: agent.id,
                        role: agent.role,
                        provider: agent.provider,
                        isGoverned: agent.isGoverned,
                        prompt,
                        callback: (error, response) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(response);
                            }
                        }
                    });
                });
            });
            
            // Wait for all promises to resolve
            await Promise.allSettled([...ungovernedPromises, ...governedPromises]);
            
            // Hide loading state in UI
            conversationView.showLoading(false, false);
            
            // Enable export report button
            document.getElementById('export-report').disabled = false;
            
            console.log('All agents processed prompt');
        } catch (error) {
            console.error('Error sending prompt to agents:', error);
            
            // Hide loading state in UI
            conversationView.showLoading(false, false);
            
            // Show error in UI
            conversationView.showError('Error processing prompt', error.message);
        }
    }

    /**
     * Handle provider tab click
     * @param {Event} event - Click event
     */
    handleProviderTabClick(event) {
        const tab = event.target;
        const provider = tab.dataset.provider;
        const column = tab.closest('.column');
        
        console.log('Provider tab clicked', { provider, column: column.classList.contains('governed') ? 'governed' : 'ungoverned' });
        
        // Update active tab in this column
        column.querySelectorAll('.provider-tab').forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');
        
        // Update conversation view
        conversationView.switchProvider(provider, column.classList.contains('governed'));
    }

    /**
     * Handle close modal button click
     * @param {Event} event - Click event
     */
    handleCloseModal(event) {
        console.log('Close modal button clicked');
        
        // Hide modal
        document.getElementById('report-modal').style.display = 'none';
    }

    /**
     * Handle download report button click
     * @param {Event} event - Click event
     */
    handleDownloadReport(event) {
        console.log('Download report button clicked');
        
        // Generate report JSON
        const reportJson = sessionManager.exportReportAsJson();
        
        // Create download link
        const blob = new Blob([reportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-governance-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Handle session ended event
     * @param {Object} data - Event data
     */
    handleSessionEnded(data) {
        console.log('Session ended', data);
        
        // Enable export report button
        document.getElementById('export-report').disabled = false;
    }
}

// Create and initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing application');
    
    // Add error container to DOM if it doesn't exist
    if (!document.getElementById('initialization-error')) {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'initialization-error';
        errorContainer.className = 'error-container';
        errorContainer.style.display = 'none';
        
        errorContainer.innerHTML = `
            <h2>Initialization Error</h2>
            <p>There was an error initializing the application:</p>
            <pre id="error-message">Unknown error</pre>
            <button onclick="location.reload()">Retry</button>
        `;
        
        document.body.appendChild(errorContainer);
    }
    
    // Create and initialize the application
    const app = new AgentGovernanceDemo();
    app.initialize().catch(error => {
        console.error('Failed to initialize application:', error);
    });
});

// Export the application class for testing
export default AgentGovernanceDemo;
