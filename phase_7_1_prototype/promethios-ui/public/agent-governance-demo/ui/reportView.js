/* Report View
 * Handles rendering of session reports
 * Displays detailed session data and allows export
 */

class ReportView {
    constructor() {
        this.container = null;
        this.contentElement = null;
        this.currentReport = null;
        this.initialized = false;
        console.log('Report View created');
    }

    /**
     * Initialize the report view
     * @param {Object} config - Configuration object
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize(config) {
        if (this.initialized) {
            console.warn('Report View already initialized');
            return;
        }

        try {
            // Store reference to event bus
            this.eventBus = config.eventBus;
            
            // Get container elements
            this.container = document.getElementById(config.containerId);
            this.contentElement = document.getElementById(config.contentId);
            
            if (!this.container || !this.contentElement) {
                throw new Error('Report container or content element not found');
            }
            
            this.initialized = true;
            console.log('Report View initialized');
        } catch (error) {
            console.error('Error initializing Report View:', error);
            throw error;
        }
    }

    /**
     * Display a session report
     * @param {Object} report - Session report
     */
    displayReport(report) {
        if (!report) {
            console.warn('No report data to display');
            this.contentElement.innerHTML = '<div class="error-message">No report data available</div>';
            return;
        }
        
        // Store current report
        this.currentReport = report;
        
        // Create report HTML
        let reportHtml = `
            <div class="report-header">
                <h3>Session Report</h3>
                <div class="report-meta">
                    <div class="meta-item">
                        <span class="meta-label">Session ID:</span>
                        <span class="meta-value">${report.sessionId}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Duration:</span>
                        <span class="meta-value">${this.formatDuration(report.duration)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Generated:</span>
                        <span class="meta-value">${new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h4>Summary Metrics</h4>
                <div class="metrics-summary">
                    <div class="metric-item">
                        <div class="metric-value">${report.metrics.totalResponses}</div>
                        <div class="metric-label">Total Responses</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${report.metrics.totalInterventions}</div>
                        <div class="metric-label">Governance Interventions</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${report.metrics.totalErrors || 0}</div>
                        <div class="metric-label">Errors</div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h4>Governance Comparison</h4>
                <div class="comparison-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Governed</th>
                                <th>Ungoverned</th>
                                <th>Difference</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Response Count</td>
                                <td>${report.comparison.governed.responseCount}</td>
                                <td>${report.comparison.ungoverned.responseCount}</td>
                                <td>-</td>
                            </tr>
                            <tr>
                                <td>Avg. Response Time</td>
                                <td>${this.formatTime(report.comparison.governed.averageResponseTime)}</td>
                                <td>${this.formatTime(report.comparison.ungoverned.averageResponseTime)}</td>
                                <td>${this.formatTimeDifference(
                                    report.comparison.governed.averageResponseTime,
                                    report.comparison.ungoverned.averageResponseTime
                                )}</td>
                            </tr>
                            <tr>
                                <td>Interventions</td>
                                <td>${report.comparison.governed.interventionCount}</td>
                                <td>${report.comparison.ungoverned.interventionCount}</td>
                                <td>+${report.comparison.governed.interventionCount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Add intervention details if there are any
        if (report.interventions && report.interventions.length > 0) {
            reportHtml += `
                <div class="report-section">
                    <h4>Governance Interventions</h4>
                    <div class="interventions-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Severity</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.interventions.map(intervention => `
                                    <tr>
                                        <td>${this.formatInterventionType(intervention.type)}</td>
                                        <td>${intervention.description}</td>
                                        <td>${intervention.severity}</td>
                                        <td>${new Date(intervention.timestamp).toLocaleTimeString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        
        // Add conversation summary
        if (report.conversation && report.conversation.length > 0) {
            reportHtml += `
                <div class="report-section">
                    <h4>Conversation Summary</h4>
                    <div class="conversation-summary">
                        ${report.conversation.map(item => `
                            <div class="conversation-item ${item.isGoverned ? 'governed' : 'ungoverned'}">
                                <div class="conversation-meta">
                                    <span class="role">${this.formatRoleName(item.role)}</span>
                                    <span class="provider">${this.formatProviderName(item.provider)}</span>
                                    <span class="governance">${item.isGoverned ? 'Governed' : 'Ungoverned'}</span>
                                </div>
                                <div class="conversation-prompt">
                                    <strong>Prompt:</strong> ${this.truncateText(item.prompt, 100)}
                                </div>
                                <div class="conversation-response">
                                    <strong>Response:</strong> ${this.truncateText(item.response, 150)}
                                </div>
                                <div class="conversation-time">
                                    <span class="time-label">Response time:</span>
                                    <span class="time-value">${this.formatTime(item.duration)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Set content
        this.contentElement.innerHTML = reportHtml;
    }

    /**
     * Format duration in milliseconds
     * @param {number} ms - Duration in milliseconds
     * @returns {string} - Formatted duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes === 0) {
            return `${seconds} seconds`;
        }
        
        return `${minutes}m ${remainingSeconds}s`;
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
     * Format time difference
     * @param {number} time1 - First time in milliseconds
     * @param {number} time2 - Second time in milliseconds
     * @returns {string} - Formatted time difference
     */
    formatTimeDifference(time1, time2) {
        const diff = time1 - time2;
        
        if (diff === 0) {
            return '0';
        }
        
        const sign = diff > 0 ? '+' : '';
        return `${sign}${this.formatTime(diff)}`;
    }

    /**
     * Format intervention type
     * @param {string} type - Intervention type
     * @returns {string} - Formatted intervention type
     */
    formatInterventionType(type) {
        switch (type) {
            case 'role-enforcement':
                return 'Role Enforcement';
            case 'factual-accuracy':
                return 'Factual Accuracy';
            case 'safety-filters':
                return 'Safety Filters';
            default:
                return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
    }

    /**
     * Format role name
     * @param {string} role - Role ID
     * @returns {string} - Formatted role name
     */
    formatRoleName(role) {
        switch (role) {
            case 'hr-specialist':
                return 'HR Specialist';
            case 'project-manager':
                return 'Project Manager';
            case 'technical-lead':
                return 'Technical Lead';
            default:
                return role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
    }

    /**
     * Format provider name
     * @param {string} provider - Provider ID
     * @returns {string} - Formatted provider name
     */
    formatProviderName(provider) {
        switch (provider) {
            case 'openai':
                return 'OpenAI';
            case 'anthropic':
                return 'Anthropic';
            case 'huggingface':
                return 'HuggingFace';
            case 'cohere':
                return 'Cohere';
            default:
                return provider.charAt(0).toUpperCase() + provider.slice(1);
        }
    }

    /**
     * Truncate text
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated text
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Get current report
     * @returns {Object|null} - Current report
     */
    getCurrentReport() {
        return this.currentReport;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.initialized = false;
        console.log('Report View cleaned up');
    }
}

// Create and export singleton instance
const reportView = new ReportView();
export default reportView;
