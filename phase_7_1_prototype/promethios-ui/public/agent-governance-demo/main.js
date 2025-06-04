/* Main Application
 * Initializes and coordinates all components
 * Handles user interactions and application flow
 */

// Import core modules
import pluginRegistry from './core/pluginRegistry.js';
import eventBus from './core/eventBus.js';
import configManager from './core/configManager.js';
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
        logger.info('Agent Governance Demo initializing');
    }

    /**
     * Initialize the application
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize() {
        try {
            logger.info('Starting application initialization');
            
            // Initialize configuration
            await configManager.initialize({
                environmentConfigPath: 'config/environment.json',
                userConfigPath: 'userConfig',
                enableUrlParams: true
            });
            
            // Initialize API client
            await apiClient.initialize(configManager);
            
            // Initialize session manager
            await sessionManager.initialize({
                eventBus
            });
            
            // Register agent plugins
            await this.registerAgentPlugins();
            
            // Register governance plugins
            await this.registerGovernancePlugins();
            
            // Initialize UI components
            await this.initializeUI();
            
            // Initialize plugin registry
            await pluginRegistry.initializePlugins({
                eventBus,
                configManager,
                apiClient
            });
            
            // Set up event handlers
            this.setupEventHandlers();
            
            this.initialized = true;
            logger.info('Application initialization complete');
            
            // Start a new session
            sessionManager.startSession();
            
            return true;
        } catch (error) {
            logger.error('Error initializing application:', error);
            this.handleInitializationError(error);
            return false;
        }
    }

    /**
     * Register agent plugins
     * @returns {Promise} - Resolves when registration is complete
     */
    async registerAgentPlugins() {
        try {
            logger.info('Registering agent plugins');
            
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
            
            logger.info('Agent plugins registered successfully');
        } catch (error) {
            logger.error('Error registering agent plugins:', error);
            throw error;
        }
    }

    /**
     * Register governance plugins
     * @returns {Promise} - Resolves when registration is complete
     */
    async registerGovernancePlugins() {
        try {
            logger.info('Registering governance plugins');
            
            // Import governance plugins
            const RoleEnforcementPlugin = (await import('./plugins/governance/roleEnforcement.js')).default;
            const FactualAccuracyPlugin = (await import('./plugins/governance/factualAccuracy.js')).default;
            const SafetyFiltersPlugin = (await import('./plugins/governance/safetyFilters.js')).default;
            
            // Create and register governance plugins
            const roleEnforcement = new RoleEnforcementPlugin();
            const factualAccuracy = new FactualAccuracyPlugin();
            const safetyFilters = new SafetyFiltersPlugin();
            
            // Register all governance plugins
            pluginRegistry.register('governance', roleEnforcement.id, roleEnforcement);
            pluginRegistry.register('governance', factualAccuracy.id, factualAccuracy);
            pluginRegistry.register('governance', safetyFilters.id, safetyFilters);
            
            logger.info('Governance plugins registered successfully');
        } catch (error) {
            logger.error('Error registering governance plugins:', error);
            throw error;
        }
    }

    /**
     * Initialize UI components
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initializeUI() {
        try {
            logger.info('Initializing UI components');
            
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
            
            logger.info('UI components initialized successfully');
        } catch (error) {
            logger.error('Error initializing UI components:', error);
            throw error;
        }
    }

    /**
     * Set up event handlers
     */
    setupEventHandlers() {
        logger.info('Setting up event handlers');
        
        // DOM event handlers
        document.getElementById('start-demo').addEventListener('click', this.handleStartDemo.bind(this));
        document.getElementById('export-report').addEventListener('click', this.handleExportReport.bind(this));
        document.getElementById('send-prompt').addEventListener('click', this.handleSendPrompt.bind(this));
        
        // Provider tab event handlers
        document.querySelectorAll('.provider-tab').forEach(tab => {
            tab.addEventListener('click', this.handleProviderTabClick.bind(this));
        });
        
        // Modal event handlers
        document.querySelector('.close-button').addEventListener('click', this.handleCloseModal.bind(this));
        document.getElementById('close-report').addEventListener('click', this.handleCloseModal.bind(this));
        document.getElementById('download-report').addEventListener('click', this.handleDownloadReport.bind(this));
        
        // Event bus subscriptions
        eventBus.subscribe('session.ended', this.handleSessionEnded.bind(this));
        
        logger.info('Event handlers set up successfully');
    }

    /**
     * Handle start demo button click
     * @param {Event} event - Click event
     */
    handleStartDemo(event) {
        logger.info('Start demo button clicked');
        
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
        logger.info('Export report button clicked');
        
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
            logger.warn('Empty prompt, ignoring');
            return;
        }
        
        logger.info('Send prompt button clicked', { prompt });
        
        // Record user prompt
        sessionManager.recordUserPrompt({ prompt });
        
        // Clear input
        promptInput.value = '';
        
        // Get current provider
        const provider = document.querySelector('.provider-tab.active').dataset.provider || 'openai';
        
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
            logger.info(`Sending prompt to ${provider} agents`, { prompt });
            
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
            
            logger.info('All agents processed prompt');
        } catch (error) {
            logger.error('Error sending prompt to agents:', error);
            
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
        
        logger.info('Provider tab clicked', { provider, column: column.classList.contains('governed') ? 'governed' : 'ungoverned' });
        
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
        logger.info('Close modal button clicked');
        
        // Hide modal
        document.getElementById('report-modal').style.display = 'none';
    }

    /**
     * Handle download report button click
     * @param {Event} event - Click event
     */
    handleDownloadReport(event) {
        logger.info('Download report button clicked');
        
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
        logger.info('Session ended', data);
        
        // Enable export report button
        document.getElementById('export-report').disabled = false;
    }

    /**
     * Handle initialization error
     * @param {Error} error - Error object
     */
    handleInitializationError(error) {
        logger.error('Initialization error:', error);
        
        // Show error in UI
        const container = document.querySelector('main');
        container.innerHTML = `
            <div class="error-container">
                <h2>Initialization Error</h2>
                <p>There was an error initializing the application:</p>
                <pre>${error.message}</pre>
                <button id="retry-init" class="primary-button">Retry</button>
            </div>
        `;
        
        // Add retry handler
        document.getElementById('retry-init').addEventListener('click', () => {
            window.location.reload();
        });
    }
}

// Create and initialize application
const app = new AgentGovernanceDemo();
window.addEventListener('DOMContentLoaded', () => {
    app.initialize().then(success => {
        if (success) {
            logger.info('Application ready');
        }
    });
});

// Export for testing
export default app;
