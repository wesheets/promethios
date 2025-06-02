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
            console.log('Export button event listener attached');
        } else {
            console.warn('Export button not found by ID, trying alternative selectors');
            // If button doesn't exist by ID, try to find it by class or create it
            const exportBtnByClass = document.querySelector('.export-report-btn');
            if (exportBtnByClass) {
                exportBtnByClass.addEventListener('click', this.generateReport.bind(this));
                console.log('Export button found by class, event listener attached');
            } else {
                // Create export button if it doesn't exist
                console.log('Creating export button as it was not found');
                this.createExportButton();
            }
        }
    },
    
    /**
     * Create export button if it doesn't exist
     */
    createExportButton() {
        const metricsSection = document.querySelector('.card-body');
        if (metricsSection) {
            const exportBtnContainer = document.createElement('div');
            exportBtnContainer.className = 'row mt-4';
            exportBtnContainer.innerHTML = `
                <div class="col-12 text-end">
                    <button id="exportReportBtn" class="btn btn-success export-report-btn">
                        <i class="bi bi-download me-2"></i> Export Governance Report
                    </button>
                </div>
            `;
            
            // Add to metrics section
            metricsSection.appendChild(exportBtnContainer);
            
            // Add event listener
            const exportBtn = document.getElementById('exportReportBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', this.generateReport.bind(this));
                console.log('Export button created and event listener attached');
            }
        }
    },
    
    /**
     * Generate a PDF report of the current session
     */
    generateReport() {
        // In a real implementation, this would generate a PDF using a library like jsPDF
        // For the prototype, we'll simulate the report generation
        
        console.log('Generating PDF report...');
        
        try {
            // Get current scenario
            const currentScenario = window.AppModules?.ScenarioManager?.getCurrentScenario() || {
                title: "Product Planning",
                description: "Evaluating product planning with and without governance"
            };
            
            // Get metrics
            const metrics = window.AppModules?.MetricsManager?.getMetrics() || {
                trust: { ungoverned: "45%", governed: "92%", improvement: "+47%" },
                compliance: { ungoverned: "38%", governed: "95%", improvement: "+57%" },
                error: { ungoverned: "27%", governed: "3%", improvement: "-24%" },
                performance: { ungoverned: "100%", governed: "98%", improvement: "-2%" }
            };
            
            // Get conversation history
            const ungovernedHistory = window.AppModules?.AgentConversation?.getConversationHistory('ungoverned') || [];
            const governedHistory = window.AppModules?.AgentConversation?.getConversationHistory('governed') || [];
            
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
        } catch (error) {
            console.error('Error generating report:', error);
            // Fallback to showing a basic report
            this.showReportPreview({
                title: this.config.reportTitle,
                date: new Date().toLocaleDateString(),
                scenario: {
                    title: "Demo Scenario",
                    description: "Demonstration of Promethios governance capabilities"
                },
                metrics: {
                    trust: { ungoverned: "45%", governed: "92%", improvement: "+47%" },
                    compliance: { ungoverned: "38%", governed: "95%", improvement: "+57%" },
                    error: { ungoverned: "27%", governed: "3%", improvement: "-24%" },
                    performance: { ungoverned: "100%", governed: "98%", improvement: "-2%" }
                },
                conversations: {
                    ungoverned: [],
                    governed: []
                }
            });
        }
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
                        <button type="button" class="btn btn-primary download-pdf-btn">Download PDF</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.appendChild(modal);
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
        
        // Show modal
        modal.classList.add('show');
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Handle close button
        const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modal.classList.remove('show');
                modal.style.display = 'none';
                backdrop.remove();
                document.body.classList.remove('modal-open');
                setTimeout(() => {
                    modal.remove();
                }, 300);
            });
        });
        
        // Handle download button
        const downloadButton = modal.querySelector('.download-pdf-btn');
        if (downloadButton) {
            downloadButton.addEventListener('click', () => {
                this.downloadPDF(reportContent);
                // Close modal after download starts
                setTimeout(() => {
                    modal.classList.remove('show');
                    modal.style.display = 'none';
                    backdrop.remove();
                    document.body.classList.remove('modal-open');
                    setTimeout(() => {
                        modal.remove();
                    }, 300);
                }, 500);
            });
        }
    },
    
    /**
     * Download PDF report
     * @param {Object} reportContent - Report content
     */
    downloadPDF(reportContent) {
        // In a real implementation, this would generate a PDF using a library
        // For the prototype, we'll simulate a download
        
        // Create a blob with text content
        const textContent = `
            ${reportContent.title}
            Generated on ${reportContent.date}
            
            Scenario: ${reportContent.scenario.title}
            ${reportContent.scenario.description}
            
            Metrics Summary:
            
            Trust Score:
            Ungoverned: ${reportContent.metrics.trust.ungoverned}
            Governed: ${reportContent.metrics.trust.governed}
            Improvement: ${reportContent.metrics.trust.improvement}
            
            Compliance Rate:
            Ungoverned: ${reportContent.metrics.compliance.ungoverned}
            Governed: ${reportContent.metrics.compliance.governed}
            Improvement: ${reportContent.metrics.compliance.improvement}
            
            Error Rate:
            Ungoverned: ${reportContent.metrics.error.ungoverned}
            Governed: ${reportContent.metrics.error.governed}
            Reduction: ${reportContent.metrics.error.improvement}
            
            Performance:
            Ungoverned: ${reportContent.metrics.performance.ungoverned}
            Governed: ${reportContent.metrics.performance.governed}
            Impact: ${reportContent.metrics.performance.improvement}
            
            Governance Recommendations:
            - Increased factual accuracy and reduced hallucinations
            - Improved compliance with policies and guidelines
            - Reduced error rates in agent outputs
            - Minimal performance impact with significant trust improvements
        `;
        
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `promethios_governance_report_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        
        // Trigger download
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },
    
    /**
     * Export report (public method for external calls)
     * @param {Object} data - Report data
     */
    exportReport(data) {
        console.log('Export report called with data:', data);
        this.generateReport();
    }
};

// Export the module
export default ExportModule;
