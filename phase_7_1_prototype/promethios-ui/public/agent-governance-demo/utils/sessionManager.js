/* Session Manager
 * Manages conversation sessions and reporting
 * Tracks interventions, metrics, and generates reports
 */

class SessionManager {
    constructor() {
        this.currentSession = null;
        this.sessionHistory = [];
        this.initialized = false;
        console.log('Session Manager initialized');
    }

    /**
     * Initialize the session manager
     * @param {Object} config - Configuration object
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize(config) {
        if (this.initialized) {
            console.warn('Session Manager already initialized');
            return;
        }

        try {
            // Store reference to event bus
            this.eventBus = config.eventBus;
            
            // Subscribe to relevant events
            this.subscriptions = [
                this.eventBus.subscribe('session.start', this.startSession.bind(this)),
                this.eventBus.subscribe('session.end', this.endSession.bind(this)),
                this.eventBus.subscribe('agent.response', this.recordAgentResponse.bind(this)),
                this.eventBus.subscribe('agent.error', this.recordAgentError.bind(this)),
                this.eventBus.subscribe('governance.intervention', this.recordIntervention.bind(this))
            ];
            
            this.initialized = true;
            console.log('Session Manager fully initialized');
        } catch (error) {
            console.error('Error initializing Session Manager:', error);
            throw error;
        }
    }

    /**
     * Start a new session
     * @param {Object} data - Session data
     * @returns {Object} - Session object
     */
    startSession(data = {}) {
        // End current session if one exists
        if (this.currentSession) {
            this.endSession();
        }
        
        // Create new session
        this.currentSession = {
            id: 'session-' + Date.now(),
            startTime: new Date().toISOString(),
            endTime: null,
            scenario: data.scenario || 'default',
            userPrompts: [],
            agentResponses: [],
            interventions: [],
            errors: [],
            metrics: {
                totalPrompts: 0,
                totalResponses: 0,
                totalInterventions: 0,
                totalErrors: 0,
                responseTimeAvg: 0,
                interventionsByType: {},
                interventionsBySeverity: {}
            }
        };
        
        console.log(`Session started: ${this.currentSession.id}`);
        
        // Publish event
        this.eventBus.publish('session.started', {
            sessionId: this.currentSession.id,
            timestamp: this.currentSession.startTime
        });
        
        return this.currentSession;
    }

    /**
     * End the current session
     * @returns {Object|null} - Completed session object or null if no session
     */
    endSession() {
        if (!this.currentSession) {
            console.warn('No active session to end');
            return null;
        }
        
        // Update session end time
        this.currentSession.endTime = new Date().toISOString();
        
        // Calculate session duration
        const startTime = new Date(this.currentSession.startTime).getTime();
        const endTime = new Date(this.currentSession.endTime).getTime();
        this.currentSession.duration = endTime - startTime;
        
        // Add to session history
        this.sessionHistory.push(this.currentSession);
        
        // Limit history length
        const maxHistoryLength = 10;
        if (this.sessionHistory.length > maxHistoryLength) {
            this.sessionHistory = this.sessionHistory.slice(-maxHistoryLength);
        }
        
        // Store completed session for reporting
        const completedSession = { ...this.currentSession };
        
        // Clear current session
        this.currentSession = null;
        
        console.log(`Session ended: ${completedSession.id}`);
        
        // Publish event
        this.eventBus.publish('session.ended', {
            sessionId: completedSession.id,
            timestamp: completedSession.endTime,
            duration: completedSession.duration,
            metrics: completedSession.metrics
        });
        
        return completedSession;
    }

    /**
     * Record a user prompt
     * @param {Object} data - Prompt data
     */
    recordUserPrompt(data) {
        if (!this.currentSession) {
            console.warn('No active session to record prompt');
            return;
        }
        
        // Add prompt to session
        this.currentSession.userPrompts.push({
            text: data.prompt,
            timestamp: new Date().toISOString()
        });
        
        // Update metrics
        this.currentSession.metrics.totalPrompts++;
    }

    /**
     * Record an agent response
     * @param {Object} data - Response data
     */
    recordAgentResponse(data) {
        if (!this.currentSession) {
            console.warn('No active session to record response');
            return;
        }
        
        // Add response to session
        this.currentSession.agentResponses.push({
            agentId: data.agentId,
            role: data.role,
            provider: data.provider,
            isGoverned: data.isGoverned,
            prompt: data.prompt,
            response: data.response,
            duration: data.duration,
            timestamp: data.timestamp || new Date().toISOString()
        });
        
        // Update metrics
        this.currentSession.metrics.totalResponses++;
        
        // Update average response time
        const totalTime = this.currentSession.agentResponses.reduce((sum, r) => sum + (r.duration || 0), 0);
        this.currentSession.metrics.responseTimeAvg = totalTime / this.currentSession.metrics.totalResponses;
        
        // If this is the first prompt in the session, record it
        if (this.currentSession.userPrompts.length === 0) {
            this.recordUserPrompt({ prompt: data.prompt });
        }
    }

    /**
     * Record an agent error
     * @param {Object} data - Error data
     */
    recordAgentError(data) {
        if (!this.currentSession) {
            console.warn('No active session to record error');
            return;
        }
        
        // Add error to session
        this.currentSession.errors.push({
            agentId: data.agentId,
            role: data.role,
            provider: data.provider,
            isGoverned: data.isGoverned,
            prompt: data.prompt,
            error: data.error,
            timestamp: data.timestamp || new Date().toISOString()
        });
        
        // Update metrics
        this.currentSession.metrics.totalErrors++;
    }

    /**
     * Record a governance intervention
     * @param {Object} data - Intervention data
     */
    recordIntervention(data) {
        if (!this.currentSession) {
            console.warn('No active session to record intervention');
            return;
        }
        
        // Add intervention to session
        this.currentSession.interventions.push({
            type: data.type,
            plugin: data.plugin,
            description: data.description,
            severity: data.severity || 'medium',
            timestamp: data.timestamp || new Date().toISOString()
        });
        
        // Update metrics
        this.currentSession.metrics.totalInterventions++;
        
        // Update interventions by type
        if (!this.currentSession.metrics.interventionsByType[data.type]) {
            this.currentSession.metrics.interventionsByType[data.type] = 0;
        }
        this.currentSession.metrics.interventionsByType[data.type]++;
        
        // Update interventions by severity
        const severity = data.severity || 'medium';
        if (!this.currentSession.metrics.interventionsBySeverity[severity]) {
            this.currentSession.metrics.interventionsBySeverity[severity] = 0;
        }
        this.currentSession.metrics.interventionsBySeverity[severity]++;
    }

    /**
     * Generate a session report
     * @param {string} sessionId - Session ID (defaults to current or last session)
     * @returns {Object} - Session report
     */
    generateReport(sessionId) {
        // Determine which session to report on
        let session;
        
        if (sessionId) {
            // Find session by ID
            session = this.sessionHistory.find(s => s.id === sessionId);
            if (!session && this.currentSession && this.currentSession.id === sessionId) {
                session = this.currentSession;
            }
        } else if (this.currentSession) {
            // Use current session
            session = this.currentSession;
        } else if (this.sessionHistory.length > 0) {
            // Use last completed session
            session = this.sessionHistory[this.sessionHistory.length - 1];
        }
        
        if (!session) {
            console.warn('No session found for report generation');
            return null;
        }
        
        // Generate report
        const report = {
            sessionId: session.id,
            timestamp: new Date().toISOString(),
            sessionStart: session.startTime,
            sessionEnd: session.endTime || 'ongoing',
            duration: session.endTime ? 
                new Date(session.endTime).getTime() - new Date(session.startTime).getTime() : 
                new Date().getTime() - new Date(session.startTime).getTime(),
            
            metrics: { ...session.metrics },
            
            // Conversation summary
            conversation: session.agentResponses.map(r => ({
                role: r.role,
                provider: r.provider,
                isGoverned: r.isGoverned,
                prompt: r.prompt,
                response: r.response,
                duration: r.duration,
                timestamp: r.timestamp
            })),
            
            // Intervention summary
            interventions: session.interventions.map(i => ({
                type: i.type,
                plugin: i.plugin,
                description: i.description,
                severity: i.severity,
                timestamp: i.timestamp
            })),
            
            // Error summary
            errors: session.errors.map(e => ({
                role: e.role,
                provider: e.provider,
                isGoverned: e.isGoverned,
                error: e.error,
                timestamp: e.timestamp
            }))
        };
        
        // Add comparison metrics for governed vs ungoverned
        const governedResponses = session.agentResponses.filter(r => r.isGoverned);
        const ungovernedResponses = session.agentResponses.filter(r => !r.isGoverned);
        
        report.comparison = {
            governed: {
                responseCount: governedResponses.length,
                averageResponseTime: governedResponses.length > 0 ? 
                    governedResponses.reduce((sum, r) => sum + (r.duration || 0), 0) / governedResponses.length : 0,
                interventionCount: session.interventions.length
            },
            ungoverned: {
                responseCount: ungovernedResponses.length,
                averageResponseTime: ungovernedResponses.length > 0 ? 
                    ungovernedResponses.reduce((sum, r) => sum + (r.duration || 0), 0) / ungovernedResponses.length : 0,
                interventionCount: 0 // Ungoverned responses have no interventions by definition
            }
        };
        
        return report;
    }

    /**
     * Export session report as JSON
     * @param {string} sessionId - Session ID
     * @returns {string} - JSON string
     */
    exportReportAsJson(sessionId) {
        const report = this.generateReport(sessionId);
        if (!report) {
            return null;
        }
        
        return JSON.stringify(report, null, 2);
    }

    /**
     * Get current session
     * @returns {Object|null} - Current session or null if none
     */
    getCurrentSession() {
        return this.currentSession;
    }

    /**
     * Get session history
     * @returns {Array} - Session history
     */
    getSessionHistory() {
        return [...this.sessionHistory];
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
        console.log('Session Manager cleaned up');
    }
}

// Create and export singleton instance
const sessionManager = new SessionManager();
export default sessionManager;
