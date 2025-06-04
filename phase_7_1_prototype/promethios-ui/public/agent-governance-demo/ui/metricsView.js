/* Metrics View
 * Handles rendering of metrics UI
 * Displays session metrics and comparisons
 */

class MetricsView {
    constructor() {
        this.container = null;
        this.metrics = {
            totalPrompts: 0,
            totalResponses: 0,
            totalInterventions: 0,
            interventionsByType: {},
            responseTimeComparison: {
                governed: 0,
                ungoverned: 0
            }
        };
        this.initialized = false;
        console.log('Metrics View created');
    }

    /**
     * Initialize the metrics view
     * @param {Object} config - Configuration object
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize(config) {
        if (this.initialized) {
            console.warn('Metrics View already initialized');
            return;
        }

        try {
            // Store reference to event bus
            this.eventBus = config.eventBus;
            
            // Get container element
            this.container = document.getElementById(config.containerId);
            
            if (!this.container) {
                throw new Error('Metrics container not found');
            }
            
            // Subscribe to events
            this.subscriptions = [
                this.eventBus.subscribe('agent.response', this.handleAgentResponse.bind(this)),
                this.eventBus.subscribe('governance.intervention', this.handleGovernanceIntervention.bind(this)),
                this.eventBus.subscribe('session.started', this.handleSessionStarted.bind(this)),
                this.eventBus.subscribe('session.ended', this.handleSessionEnded.bind(this))
            ];
            
            // Render initial metrics
            this.renderMetrics();
            
            this.initialized = true;
            console.log('Metrics View initialized');
        } catch (error) {
            console.error('Error initializing Metrics View:', error);
            throw error;
        }
    }

    /**
     * Handle agent response event
     * @param {Object} data - Response data
     */
    handleAgentResponse(data) {
        // Update metrics
        this.metrics.totalResponses++;
        
        // Update response time comparison
        if (data.isGoverned) {
            this.metrics.responseTimeComparison.governed = 
                (this.metrics.responseTimeComparison.governed * (this.metrics.totalResponses - 1) + data.duration) / 
                this.metrics.totalResponses;
        } else {
            this.metrics.responseTimeComparison.ungoverned = 
                (this.metrics.responseTimeComparison.ungoverned * (this.metrics.totalResponses - 1) + data.duration) / 
                this.metrics.totalResponses;
        }
        
        // Re-render metrics
        this.renderMetrics();
    }

    /**
     * Handle governance intervention event
     * @param {Object} data - Intervention data
     */
    handleGovernanceIntervention(data) {
        // Update metrics
        this.metrics.totalInterventions++;
        
        // Update interventions by type
        if (!this.metrics.interventionsByType[data.type]) {
            this.metrics.interventionsByType[data.type] = 0;
        }
        this.metrics.interventionsByType[data.type]++;
        
        // Re-render metrics
        this.renderMetrics();
    }

    /**
     * Handle session started event
     * @param {Object} data - Session data
     */
    handleSessionStarted(data) {
        // Reset metrics
        this.reset();
    }

    /**
     * Handle session ended event
     * @param {Object} data - Session data
     */
    handleSessionEnded(data) {
        // Update metrics with final values from session
        if (data.metrics) {
            this.metrics = { ...data.metrics };
            this.renderMetrics();
        }
    }

    /**
     * Render metrics
     */
    renderMetrics() {
        // Create metrics grid
        const metricsGrid = document.createElement('div');
        metricsGrid.className = 'metrics-grid';
        
        // Add metrics
        metricsGrid.innerHTML = `
            <div class="metric-card">
                <div class="metric-title">Total Responses</div>
                <div class="metric-value">${this.metrics.totalResponses}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Governance Interventions</div>
                <div class="metric-value">${this.metrics.totalInterventions}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Response Time</div>
                <div class="metric-comparison">
                    <div class="comparison-item">
                        <div class="comparison-label">Ungoverned</div>
                        <div class="comparison-value">${this.formatTime(this.metrics.responseTimeComparison.ungoverned)}</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">Governed</div>
                        <div class="comparison-value">${this.formatTime(this.metrics.responseTimeComparison.governed)}</div>
                    </div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Intervention Types</div>
                <div class="metric-chart">
                    ${this.renderInterventionChart()}
                </div>
            </div>
        `;
        
        // Clear container and add new metrics
        this.container.innerHTML = '<h3>Session Metrics</h3>';
        this.container.appendChild(metricsGrid);
    }

    /**
     * Render intervention chart
     * @returns {string} - HTML for intervention chart
     */
    renderInterventionChart() {
        // If no interventions, show message
        if (this.metrics.totalInterventions === 0) {
            return '<div class="empty-chart">No interventions yet</div>';
        }
        
        // Create chart HTML
        let chartHtml = '<div class="intervention-chart">';
        
        // Add bars for each intervention type
        for (const type in this.metrics.interventionsByType) {
            const count = this.metrics.interventionsByType[type];
            const percentage = (count / this.metrics.totalInterventions) * 100;
            
            chartHtml += `
                <div class="chart-item">
                    <div class="chart-label">${this.formatInterventionType(type)}</div>
                    <div class="chart-bar-container">
                        <div class="chart-bar" style="width: ${percentage}%"></div>
                    </div>
                    <div class="chart-value">${count}</div>
                </div>
            `;
        }
        
        chartHtml += '</div>';
        return chartHtml;
    }

    /**
     * Format time in milliseconds
     * @param {number} ms - Time in milliseconds
     * @returns {string} - Formatted time
     */
    formatTime(ms) {
        if (ms === 0) {
            return '0ms';
        }
        
        if (ms < 1000) {
            return `${Math.round(ms)}ms`;
        }
        
        return `${(ms / 1000).toFixed(1)}s`;
    }

    /**
     * Format intervention type
     * @param {string} type - Intervention type
     * @returns {string} - Formatted type
     */
    formatInterventionType(type) {
        switch (type) {
            case 'role-enforcement':
                return 'Role';
            case 'factual-accuracy':
                return 'Factual';
            case 'safety-filters':
                return 'Safety';
            default:
                return type.split('-')[0];
        }
    }

    /**
     * Reset metrics
     */
    reset() {
        this.metrics = {
            totalPrompts: 0,
            totalResponses: 0,
            totalInterventions: 0,
            interventionsByType: {},
            responseTimeComparison: {
                governed: 0,
                ungoverned: 0
            }
        };
        
        this.renderMetrics();
    }

    /**
     * Clean up resources
     */
    cleanup() {
        // Unsubscribe from events
        if (this.subscriptions) {
            this.subscriptions.forEach(subscription => subscription.unsubscribe());
        }
        
        this.initialized = false;
        console.log('Metrics View cleaned up');
    }
}

// Create and export singleton instance
const metricsView = new MetricsView();
export default metricsView;
