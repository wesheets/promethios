/**
 * Enhanced Features Module for CMU Benchmark Interactive Playground
 * 
 * This module provides additional features to enhance the demonstration
 * of collaborative agent capabilities and governance impact.
 */

import EventBus from './eventBus.js';
import { featureFlags } from './featureFlags.js';

const EnhancedFeatures = {
    // Configuration
    config: {
        enableCollaborationMetrics: true,
        enableInterventionTracking: true,
        enableRealTimeAnalytics: true,
        enableComparisonView: true
    },
    
    // State
    state: {
        collaborationMetrics: {
            ungoverned: {
                turnsToAgreement: 0,
                contradictions: 0,
                informationSharing: 0,
                roleAdherence: 0,
                collaborationScore: 0
            },
            governed: {
                turnsToAgreement: 0,
                contradictions: 0,
                informationSharing: 0,
                roleAdherence: 0,
                collaborationScore: 0
            }
        },
        interventions: {
            hallucinations: [],
            roleViolations: [],
            safetyIssues: [],
            contradictions: []
        },
        realTimeData: {
            startTime: null,
            responseLatency: [],
            interventionLatency: [],
            completionTime: {
                ungoverned: null,
                governed: null
            }
        }
    },
    
    /**
     * Initialize the enhanced features module
     */
    init() {
        console.log('Initializing EnhancedFeatures module');
        
        // Subscribe to events
        if (window.EventBus) {
            EventBus.subscribe('scenarioStarted', this.handleScenarioStart.bind(this));
            EventBus.subscribe('agentMessage', this.handleAgentMessage.bind(this));
            EventBus.subscribe('conversationComplete', this.handleConversationComplete.bind(this));
            EventBus.subscribe('governanceApplied', this.handleGovernanceApplied.bind(this));
        }
        
        // Initialize UI elements
        this.initUI();
        
        console.log('EnhancedFeatures module initialized');
    },
    
    /**
     * Initialize UI elements for enhanced features
     */
    initUI() {
        // Create collaboration metrics section if it doesn't exist
        if (!document.getElementById('collaboration-metrics') && this.config.enableCollaborationMetrics) {
            const metricsContainer = document.createElement('div');
            metricsContainer.id = 'collaboration-metrics';
            metricsContainer.className = 'card mt-4';
            metricsContainer.innerHTML = `
                <div class="card-header">
                    <h5>Collaboration Metrics</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Ungoverned</h6>
                            <div>Agreement Efficiency: <span id="ungoverned-agreement">0</span></div>
                            <div>Information Sharing: <span id="ungoverned-sharing">0</span></div>
                            <div>Role Adherence: <span id="ungoverned-role">0</span></div>
                            <div>Contradictions: <span id="ungoverned-contradictions">0</span></div>
                        </div>
                        <div class="col-md-6">
                            <h6>Governed</h6>
                            <div>Agreement Efficiency: <span id="governed-agreement">0</span></div>
                            <div>Information Sharing: <span id="governed-sharing">0</span></div>
                            <div>Role Adherence: <span id="governed-role">0</span></div>
                            <div>Contradictions: <span id="governed-contradictions">0</span></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Append to the container
            const container = document.querySelector('.container-fluid');
            if (container) {
                container.appendChild(metricsContainer);
            }
        }
        
        // Create intervention tracking section if it doesn't exist
        if (!document.getElementById('intervention-tracking') && this.config.enableInterventionTracking) {
            const interventionContainer = document.createElement('div');
            interventionContainer.id = 'intervention-tracking';
            interventionContainer.className = 'card mt-4';
            interventionContainer.innerHTML = `
                <div class="card-header">
                    <h5>Governance Interventions</h5>
                </div>
                <div class="card-body">
                    <div class="intervention-list">
                        <div class="text-center text-muted p-3">
                            <i class="bi bi-shield-check"></i>
                            <p>Interventions will appear here during conversation</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Append to the container
            const container = document.querySelector('.container-fluid');
            if (container) {
                container.appendChild(interventionContainer);
            }
        }
    },
    
    /**
     * Handle scenario start event
     * @param {Object} data - Event data
     */
    handleScenarioStart(data) {
        console.log('Enhanced features: scenario started', data);
        
        // Reset state
        this.resetState();
        
        // Record start time
        this.state.realTimeData.startTime = Date.now();
        
        // Clear UI
        this.clearUI();
    },
    
    /**
     * Handle agent message event
     * @param {Object} data - Event data
     */
    handleAgentMessage(data) {
        // Update collaboration metrics based on message content
        this.updateCollaborationMetrics(data);
        
        // Track any issues in the message
        if (data.issues && data.issues.length > 0) {
            this.trackIssues(data);
        }
        
        // Update real-time metrics
        this.updateRealTimeMetrics(data);
    },
    
    /**
     * Handle conversation complete event
     * @param {Object} data - Event data
     */
    handleConversationComplete(data) {
        console.log('Enhanced features: conversation complete', data);
        
        // Record completion time
        if (data.type) {
            this.state.realTimeData.completionTime[data.type] = Date.now();
        }
        
        // Calculate final collaboration score
        this.calculateCollaborationScores();
        
        // Update UI with final metrics
        this.updateMetricsUI();
    },
    
    /**
     * Handle governance applied event
     * @param {Object} data - Event data
     */
    handleGovernanceApplied(data) {
        console.log('Enhanced features: governance applied', data);
        
        // Track intervention
        if (data.modifications && data.modifications.length > 0) {
            this.trackIntervention(data);
        }
        
        // Update intervention latency
        if (this.state.realTimeData.startTime) {
            this.state.realTimeData.interventionLatency.push(Date.now() - this.state.realTimeData.startTime);
        }
    },
    
    /**
     * Reset state for a new scenario
     */
    resetState() {
        this.state = {
            collaborationMetrics: {
                ungoverned: {
                    turnsToAgreement: 0,
                    contradictions: 0,
                    informationSharing: 0,
                    roleAdherence: 0,
                    collaborationScore: 0
                },
                governed: {
                    turnsToAgreement: 0,
                    contradictions: 0,
                    informationSharing: 0,
                    roleAdherence: 0,
                    collaborationScore: 0
                }
            },
            interventions: {
                hallucinations: [],
                roleViolations: [],
                safetyIssues: [],
                contradictions: []
            },
            realTimeData: {
                startTime: null,
                responseLatency: [],
                interventionLatency: [],
                completionTime: {
                    ungoverned: null,
                    governed: null
                }
            }
        };
    },
    
    /**
     * Clear UI elements
     */
    clearUI() {
        // Clear collaboration metrics
        const ungovAgreement = document.getElementById('ungoverned-agreement');
        if (ungovAgreement) ungovAgreement.textContent = '0';
        
        const ungovSharing = document.getElementById('ungoverned-sharing');
        if (ungovSharing) ungovSharing.textContent = '0';
        
        const ungovRole = document.getElementById('ungoverned-role');
        if (ungovRole) ungovRole.textContent = '0';
        
        const ungovContradictions = document.getElementById('ungoverned-contradictions');
        if (ungovContradictions) ungovContradictions.textContent = '0';
        
        const govAgreement = document.getElementById('governed-agreement');
        if (govAgreement) govAgreement.textContent = '0';
        
        const govSharing = document.getElementById('governed-sharing');
        if (govSharing) govSharing.textContent = '0';
        
        const govRole = document.getElementById('governed-role');
        if (govRole) govRole.textContent = '0';
        
        const govContradictions = document.getElementById('governed-contradictions');
        if (govContradictions) govContradictions.textContent = '0';
        
        // Clear intervention tracking
        const interventionList = document.querySelector('.intervention-list');
        if (interventionList) {
            interventionList.innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="bi bi-shield-check"></i>
                    <p>Interventions will appear here during conversation</p>
                </div>
            `;
        }
    },
    
    /**
     * Update collaboration metrics based on message
     * @param {Object} data - Message data
     */
    updateCollaborationMetrics(data) {
        const type = data.isGoverned ? 'governed' : 'ungoverned';
        const metrics = this.state.collaborationMetrics[type];
        
        // Check for contradictions
        if (data.message && data.message.toLowerCase().includes('disagree')) {
            metrics.contradictions++;
        }
        
        // Check for information sharing
        if (data.message && (data.message.toLowerCase().includes('data') || 
                            data.message.toLowerCase().includes('research') || 
                            data.message.toLowerCase().includes('evidence'))) {
            metrics.informationSharing++;
        }
        
        // Check for role adherence
        if (data.message && data.message.toLowerCase().includes('my role')) {
            metrics.roleAdherence++;
        }
        
        // Update UI
        this.updateMetricsUI();
    },
    
    /**
     * Track issues in messages
     * @param {Object} data - Message data
     */
    trackIssues(data) {
        data.issues.forEach(issue => {
            switch (issue.type) {
                case 'hallucination':
                    this.state.interventions.hallucinations.push({
                        agentId: data.agentId,
                        message: data.message,
                        details: issue.details,
                        timestamp: new Date().toISOString()
                    });
                    break;
                case 'role':
                    this.state.interventions.roleViolations.push({
                        agentId: data.agentId,
                        message: data.message,
                        details: issue.details,
                        timestamp: new Date().toISOString()
                    });
                    break;
                case 'safety':
                    this.state.interventions.safetyIssues.push({
                        agentId: data.agentId,
                        message: data.message,
                        details: issue.details,
                        timestamp: new Date().toISOString()
                    });
                    break;
                case 'contradiction':
                    this.state.interventions.contradictions.push({
                        agentId: data.agentId,
                        message: data.message,
                        details: issue.details,
                        timestamp: new Date().toISOString()
                    });
                    break;
            }
        });
        
        // Update intervention UI
        this.updateInterventionUI();
    },
    
    /**
     * Track governance intervention
     * @param {Object} data - Intervention data
     */
    trackIntervention(data) {
        data.modifications.forEach(mod => {
            switch (mod.type) {
                case 'hallucination_prevention':
                    this.state.interventions.hallucinations.push({
                        agentId: data.agentId,
                        original: data.original,
                        governed: data.governed,
                        details: mod.description,
                        timestamp: new Date().toISOString()
                    });
                    break;
                case 'role_adherence':
                    this.state.interventions.roleViolations.push({
                        agentId: data.agentId,
                        original: data.original,
                        governed: data.governed,
                        details: mod.description,
                        timestamp: new Date().toISOString()
                    });
                    break;
                case 'safety_enhancement':
                    this.state.interventions.safetyIssues.push({
                        agentId: data.agentId,
                        original: data.original,
                        governed: data.governed,
                        details: mod.description,
                        timestamp: new Date().toISOString()
                    });
                    break;
            }
        });
        
        // Update intervention UI
        this.updateInterventionUI();
    },
    
    /**
     * Update real-time metrics
     * @param {Object} data - Message data
     */
    updateRealTimeMetrics(data) {
        // Update response latency
        if (this.state.realTimeData.startTime) {
            this.state.realTimeData.responseLatency.push(Date.now() - this.state.realTimeData.startTime);
        }
    },
    
    /**
     * Calculate final collaboration scores
     */
    calculateCollaborationScores() {
        // Calculate ungoverned score
        const ungoverned = this.state.collaborationMetrics.ungoverned;
        ungoverned.collaborationScore = 
            (ungoverned.informationSharing * 10) + 
            (ungoverned.roleAdherence * 10) - 
            (ungoverned.contradictions * 15);
        
        // Ensure score is not negative
        ungoverned.collaborationScore = Math.max(0, ungoverned.collaborationScore);
        
        // Calculate governed score
        const governed = this.state.collaborationMetrics.governed;
        governed.collaborationScore = 
            (governed.informationSharing * 10) + 
            (governed.roleAdherence * 10) - 
            (governed.contradictions * 15);
        
        // Ensure score is not negative
        governed.collaborationScore = Math.max(0, governed.collaborationScore);
    },
    
    /**
     * Update metrics UI
     */
    updateMetricsUI() {
        // Update ungoverned metrics
        const ungovAgreement = document.getElementById('ungoverned-agreement');
        if (ungovAgreement) {
            ungovAgreement.textContent = this.state.collaborationMetrics.ungoverned.turnsToAgreement || 'N/A';
        }
        
        const ungovSharing = document.getElementById('ungoverned-sharing');
        if (ungovSharing) {
            ungovSharing.textContent = this.state.collaborationMetrics.ungoverned.informationSharing;
        }
        
        const ungovRole = document.getElementById('ungoverned-role');
        if (ungovRole) {
            ungovRole.textContent = this.state.collaborationMetrics.ungoverned.roleAdherence;
        }
        
        const ungovContradictions = document.getElementById('ungoverned-contradictions');
        if (ungovContradictions) {
            ungovContradictions.textContent = this.state.collaborationMetrics.ungoverned.contradictions;
        }
        
        // Update governed metrics
        const govAgreement = document.getElementById('governed-agreement');
        if (govAgreement) {
            govAgreement.textContent = this.state.collaborationMetrics.governed.turnsToAgreement || 'N/A';
        }
        
        const govSharing = document.getElementById('governed-sharing');
        if (govSharing) {
            govSharing.textContent = this.state.collaborationMetrics.governed.informationSharing;
        }
        
        const govRole = document.getElementById('governed-role');
        if (govRole) {
            govRole.textContent = this.state.collaborationMetrics.governed.roleAdherence;
        }
        
        const govContradictions = document.getElementById('governed-contradictions');
        if (govContradictions) {
            govContradictions.textContent = this.state.collaborationMetrics.governed.contradictions;
        }
    },
    
    /**
     * Update intervention UI
     */
    updateInterventionUI() {
        const interventionList = document.querySelector('.intervention-list');
        if (!interventionList) return;
        
        // Clear existing content
        interventionList.innerHTML = '';
        
        // Add hallucinations
        this.state.interventions.hallucinations.forEach(item => {
            const element = document.createElement('div');
            element.className = 'intervention-item mb-2';
            element.innerHTML = `
                <div class="badge bg-warning mb-1">Hallucination</div>
                <div class="small text-muted">${new Date(item.timestamp).toLocaleTimeString()}</div>
                <div class="intervention-detail">${item.details}</div>
            `;
            interventionList.appendChild(element);
        });
        
        // Add role violations
        this.state.interventions.roleViolations.forEach(item => {
            const element = document.createElement('div');
            element.className = 'intervention-item mb-2';
            element.innerHTML = `
                <div class="badge bg-info mb-1">Role Violation</div>
                <div class="small text-muted">${new Date(item.timestamp).toLocaleTimeString()}</div>
                <div class="intervention-detail">${item.details}</div>
            `;
            interventionList.appendChild(element);
        });
        
        // Add safety issues
        this.state.interventions.safetyIssues.forEach(item => {
            const element = document.createElement('div');
            element.className = 'intervention-item mb-2';
            element.innerHTML = `
                <div class="badge bg-danger mb-1">Safety Issue</div>
                <div class="small text-muted">${new Date(item.timestamp).toLocaleTimeString()}</div>
                <div class="intervention-detail">${item.details}</div>
            `;
            interventionList.appendChild(element);
        });
        
        // Add contradictions
        this.state.interventions.contradictions.forEach(item => {
            const element = document.createElement('div');
            element.className = 'intervention-item mb-2';
            element.innerHTML = `
                <div class="badge bg-secondary mb-1">Contradiction</div>
                <div class="small text-muted">${new Date(item.timestamp).toLocaleTimeString()}</div>
                <div class="intervention-detail">${item.details}</div>
            `;
            interventionList.appendChild(element);
        });
        
        // If no interventions, show placeholder
        if (interventionList.children.length === 0) {
            interventionList.innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="bi bi-shield-check"></i>
                    <p>No interventions recorded yet</p>
                </div>
            `;
        }
    },
    
    /**
     * Get collaboration metrics
     * @returns {Object} - Collaboration metrics
     */
    getCollaborationMetrics() {
        return this.state.collaborationMetrics;
    },
    
    /**
     * Get intervention data
     * @returns {Object} - Intervention data
     */
    getInterventions() {
        return this.state.interventions;
    },
    
    /**
     * Get real-time performance data
     * @returns {Object} - Real-time performance data
     */
    getRealTimeData() {
        return this.state.realTimeData;
    }
};

// Export the module
export default EnhancedFeatures;
