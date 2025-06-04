/* Base Governance Plugin
 * Provides common functionality for all governance plugins
 * Implements the governance plugin interface
 */

class GovernanceBase {
    constructor(options = {}) {
        this.id = options.id || 'governance-' + Math.random().toString(36).substring(2, 9);
        this.name = options.name || 'Generic Governance';
        this.description = options.description || 'A generic governance plugin';
        this.enabled = options.enabled !== false;
        this.initialized = false;
        this.interventions = [];
        
        console.log(`Governance plugin created: ${this.name}`);
    }

    /**
     * Initialize the governance plugin
     * @param {Object} config - Configuration object
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize(config) {
        if (this.initialized) {
            console.warn(`Governance plugin ${this.id} already initialized`);
            return;
        }

        try {
            // Store reference to event bus
            this.eventBus = config.eventBus;
            
            // Subscribe to relevant events
            this.subscriptions = [
                this.eventBus.subscribe('governance.reset', this.resetInterventions.bind(this))
            ];
            
            this.initialized = true;
            console.log(`Governance plugin initialized: ${this.name}`);
        } catch (error) {
            console.error(`Error initializing governance plugin ${this.id}:`, error);
            throw error;
        }
    }

    /**
     * Apply governance to a request
     * @param {Object} options - Request options
     * @param {Object} context - Additional context
     * @returns {Promise<Object>} - Resolves with the governed options
     */
    async applyGovernance(options, context) {
        // Base implementation just passes through
        // Subclasses should override this method
        return options;
    }

    /**
     * Record an intervention
     * @param {Object} intervention - Intervention details
     */
    recordIntervention(intervention) {
        const interventionRecord = {
            ...intervention,
            timestamp: new Date().toISOString(),
            plugin: this.id
        };
        
        this.interventions.push(interventionRecord);
        
        // Publish intervention event
        this.eventBus.publish('governance.intervention', interventionRecord);
        
        return interventionRecord;
    }

    /**
     * Reset interventions
     */
    resetInterventions() {
        this.interventions = [];
        console.log(`Interventions reset for governance plugin ${this.id}`);
    }

    /**
     * Get all interventions
     * @returns {Array} - Array of interventions
     */
    getInterventions() {
        return [...this.interventions];
    }

    /**
     * Get plugin information
     * @returns {Object} - Plugin information
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            enabled: this.enabled,
            interventionCount: this.interventions.length
        };
    }

    /**
     * Enable the plugin
     */
    enable() {
        this.enabled = true;
        console.log(`Governance plugin enabled: ${this.id}`);
    }

    /**
     * Disable the plugin
     */
    disable() {
        this.enabled = false;
        console.log(`Governance plugin disabled: ${this.id}`);
    }

    /**
     * Clean up plugin resources
     */
    cleanup() {
        // Unsubscribe from events
        if (this.subscriptions) {
            this.subscriptions.forEach(subscription => subscription.unsubscribe());
        }
        
        this.initialized = false;
        console.log(`Governance plugin cleaned up: ${this.id}`);
    }
}

export default GovernanceBase;
