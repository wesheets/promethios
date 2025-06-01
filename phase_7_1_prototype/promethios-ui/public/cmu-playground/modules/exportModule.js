/**
 * Export Module
 * Handles exporting conversation history and metrics to PDF
 */

const ExportModule = {
    // Configuration
    config: {
        reportTitle: "Promethios Governance Report",
        companyName: "Promethios AI Governance",
        logoUrl: "https://example.com/logo.png" // Would be replaced with actual logo
    },
    
    /**
     * Initialize the module
     */
    init() {
        // Set up event listeners
        this.setupEventListeners();
        console.log('Export module initialized');
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Find export button
        const exportButton = document.getElementById('exportReportBtn');
        if (exportButton) {
            exportButton.addEventListener('click', this.generateReport.bind(this));
        }
    },
    
    /**
     * Generate a PDF report of the current session
     */
    generateReport() {
        // In a real implementation, this would generate a PDF using a library like jsPDF
        // For the prototype, we'll simulate the report generation
        
        console.log('Generating PDF report...');
        
        // Get current scenario
        const currentScenario = ScenarioManager.getCurrentScenario();
        
        // Get metrics
        const metrics = MetricsManager.getMetrics();
        
        // Get conversation history
        const ungovernedHistory = AgentConversation.getConversationHistory('ungoverned');
        const governedHistory = AgentConversation.getConversationHistory('governed');
        
        // Create report content
        const reportContent = {
            title: this.config.reportTitle,
            date: new Date().toLocaleDateString(),
            scenario: currentScenario,
            metrics: metrics,
            conversations: {
                ungoverned: ungovernedHistory,
                governed: governedHistory
            }
        };
        
        // In a real implementation, this would generate a PDF
        // For the prototype, we'll show what would be in the report
        this.showReportPreview(reportContent);
    },
    
    /**
     * Show a preview of the report
     * @param {Object} reportContent - Report content
     */
    showReportPreview(reportContent) {
        // Create modal for report preview
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'reportPreviewModal';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'reportPreviewModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        // Create modal content
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content bg-dark text-light">
                    <div class="modal-header">
                        <h5 class="modal-title" id="reportPreviewModalLabel">Report Preview</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="report-preview">
                            <h2 class="text-center">${reportContent.title}</h2>
                            <p class="text-center">Generated on ${reportContent.date}</p>
                            
                            <h3 class="mt-4">Scenario: ${reportContent.scenario.title}</h3>
                            <p>${reportContent.scenario.description}</p>
                            
                            <h3 class="mt-4">Metrics Summary</h3>
                            <div class="row">
                                <div class="col-md-6">
                                    <h5>Trust Score</h5>
                                    <p>Ungoverned: ${reportContent.metrics.trust.ungoverned}</p>
                                    <p>Governed: ${reportContent.metrics.trust.governed}</p>
                                    <p>Improvement: ${reportContent.metrics.trust.improvement}</p>
                                </div>
                                <div class="col-md-6">
                                    <h5>Compliance Rate</h5>
                                    <p>Ungoverned: ${reportContent.metrics.compliance.ungoverned}</p>
                                    <p>Governed: ${reportContent.metrics.compliance.governed}</p>
                                    <p>Improvement: ${reportContent.metrics.compliance.improvement}</p>
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <h5>Error Rate</h5>
                                    <p>Ungoverned: ${reportContent.metrics.error.ungoverned}</p>
                                    <p>Governed: ${reportContent.metrics.error.governed}</p>
                                    <p>Reduction: ${reportContent.metrics.error.improvement}</p>
                                </div>
                                <div class="col-md-6">
                                    <h5>Performance</h5>
                                    <p>Ungoverned: ${reportContent.metrics.performance.ungoverned}</p>
                                    <p>Governed: ${reportContent.metrics.performance.governed}</p>
                                    <p>Impact: ${reportContent.metrics.performance.improvement}</p>
                                </div>
                            </div>
                            
                            <h3 class="mt-4">Conversation Samples</h3>
                            <p>The report would include full conversation transcripts with highlighted governance interventions.</p>
                            
                            <h3 class="mt-4">Governance Recommendations</h3>
                            <p>Based on the observed interactions, Promethios governance would provide the following benefits to your AI systems:</p>
                            <ul>
                                <li>Increased factual accuracy and reduced hallucinations</li>
                                <li>Improved compliance with policies and guidelines</li>
                                <li>Reduced error rates in agent outputs</li>
                                <li>Minimal performance impact with significant trust improvements</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-purple">Download PDF</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.appendChild(modal);
        
        // Show modal
        const modalInstance = new bootstrap.Modal(document.getElementById('reportPreviewModal'));
        modalInstance.show();
        
        // In a real implementation, the "Download PDF" button would trigger the actual PDF generation
    }
};

// Export the module
export default ExportModule;
