/**
 * Metrics Manager Module
 * Handles metrics calculation, visualization, and updates
 */

const MetricsManager = {
    // Configuration
    config: {
        metrics: {
            trustScore: {
                title: "Trust Score",
                ungoverned: 45,
                governed: 92,
                improvement: "+104%",
                description: "Measure of factual accuracy and reliability"
            },
            complianceRate: {
                title: "Compliance Rate",
                ungoverned: 38,
                governed: 95,
                improvement: "+150%",
                description: "Adherence to policies and guidelines"
            },
            errorRate: {
                title: "Error Rate",
                ungoverned: 67,
                governed: 12,
                reduction: "-82%",
                description: "Frequency of factual or procedural errors"
            },
            performance: {
                title: "Performance",
                ungoverned: 89,
                governed: 85,
                impact: "-4%",
                description: "Response time and processing efficiency"
            }
        },
        
        // Chart configuration
        chart: {
            width: 800,
            height: 300,
            barWidth: 60,
            barGap: 20,
            colors: {
                ungoverned: "#adb5bd",
                governed: "#8a2be2"
            }
        }
    },
    
    // State
    state: {
        currentMetrics: null,
        charts: {}
    },
    
    /**
     * Initialize the module
     */
    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize metrics
        this.initializeMetrics();
        
        // Create chart
        this.createChart();
        
        console.log('Metrics Manager module initialized');
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for scenario events
        EventBus.subscribe('scenarioStarted', this.handleScenarioStart.bind(this));
        EventBus.subscribe('scenarioChanged', this.resetMetrics.bind(this));
        
        // Listen for governance toggle
        EventBus.subscribe('governanceToggled', this.updateMetricsDisplay.bind(this));
        
        // Listen for hallucination events
        EventBus.subscribe('hallucinationDetected', this.handleHallucination.bind(this));
        
        // Listen for governance intervention events
        EventBus.subscribe('governanceIntervention', this.handleGovernanceIntervention.bind(this));
        
        // Listen for conversation completion
        EventBus.subscribe('conversationCompleted', this.handleConversationCompleted.bind(this));
    },
    
    /**
     * Initialize metrics
     */
    initializeMetrics() {
        // Set current metrics to default values
        this.state.currentMetrics = JSON.parse(JSON.stringify(this.config.metrics));
        
        // Update metrics display
        this.updateMetricsDisplay();
    },
    
    /**
     * Create chart
     */
    createChart() {
        // Get chart container
        const chartContainer = document.getElementById('metrics-chart');
        
        if (!chartContainer) {
            console.error('Chart container not found');
            return;
        }
        
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.id = 'metricsBarChart';
        canvas.width = this.config.chart.width;
        canvas.height = this.config.chart.height;
        
        // Add canvas to container
        chartContainer.innerHTML = '';
        chartContainer.appendChild(canvas);
        
        // Create chart
        const ctx = canvas.getContext('2d');
        
        // Draw chart background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Draw horizontal grid lines
        for (let i = 0; i <= 10; i++) {
            const y = canvas.height - (i * canvas.height / 10);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
            
            // Add y-axis labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(i * 10, 5, y - 5);
        }
        
        // Draw chart data
        this.updateChart();
    },
    
    /**
     * Update chart
     */
    updateChart() {
        // Get canvas
        const canvas = document.getElementById('metricsBarChart');
        
        if (!canvas) {
            console.error('Chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw chart background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Draw horizontal grid lines
        for (let i = 0; i <= 10; i++) {
            const y = canvas.height - (i * canvas.height / 10);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
            
            // Add y-axis labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(i * 10, 5, y - 5);
        }
        
        // Get metrics data
        const metrics = [
            {
                name: 'Trust Score',
                ungoverned: this.state.currentMetrics.trustScore.ungoverned,
                governed: this.state.currentMetrics.trustScore.governed
            },
            {
                name: 'Compliance',
                ungoverned: this.state.currentMetrics.complianceRate.ungoverned,
                governed: this.state.currentMetrics.complianceRate.governed
            },
            {
                name: 'Error Rate',
                ungoverned: this.state.currentMetrics.errorRate.ungoverned,
                governed: this.state.currentMetrics.errorRate.governed
            },
            {
                name: 'Performance',
                ungoverned: this.state.currentMetrics.performance.ungoverned,
                governed: this.state.currentMetrics.performance.governed
            }
        ];
        
        // Calculate bar positions
        const barWidth = this.config.chart.barWidth;
        const barGap = this.config.chart.barGap;
        const groupWidth = (barWidth * 2) + barGap;
        const groupGap = 60;
        const startX = 50;
        
        // Draw bars
        metrics.forEach((metric, index) => {
            const x = startX + (index * (groupWidth + groupGap));
            
            // Draw ungoverned bar
            const ungovernedHeight = (metric.ungoverned / 100) * (canvas.height - 50);
            ctx.fillStyle = this.config.chart.colors.ungoverned;
            ctx.fillRect(x, canvas.height - ungovernedHeight, barWidth, ungovernedHeight);
            
            // Draw governed bar
            const governedHeight = (metric.governed / 100) * (canvas.height - 50);
            ctx.fillStyle = this.config.chart.colors.governed;
            ctx.fillRect(x + barWidth + barGap, canvas.height - governedHeight, barWidth, governedHeight);
            
            // Add x-axis labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(metric.name, x + (groupWidth / 2), canvas.height - 5);
        });
        
        // Add legend
        const legendX = canvas.width - 200;
        const legendY = 30;
        
        // Ungoverned legend
        ctx.fillStyle = this.config.chart.colors.ungoverned;
        ctx.fillRect(legendX, legendY, 20, 10);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Ungoverned Agent', legendX + 30, legendY + 10);
        
        // Governed legend
        ctx.fillStyle = this.config.chart.colors.governed;
        ctx.fillRect(legendX, legendY + 20, 20, 10);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('Promethios Governed', legendX + 30, legendY + 30);
    },
    
    /**
     * Update metrics display
     */
    updateMetricsDisplay(data = null) {
        // Update metrics based on governance state if data is provided
        if (data) {
            const { enabled, activeFeatures } = data;
            
            // If governance is disabled, use ungoverned values for both
            if (!enabled) {
                Object.keys(this.state.currentMetrics).forEach(key => {
                    this.state.currentMetrics[key].governed = this.state.currentMetrics[key].ungoverned;
                });
            } else {
                // Reset to default values
                Object.keys(this.config.metrics).forEach(key => {
                    this.state.currentMetrics[key].governed = this.config.metrics[key].governed;
                });
                
                // Adjust based on active features
                if (activeFeatures) {
                    if (!activeFeatures.veritas) {
                        // Without VERITAS, trust score is reduced
                        this.state.currentMetrics.trustScore.governed = 60;
                    }
                    
                    if (!activeFeatures.safety) {
                        // Without safety constraints, compliance is reduced
                        this.state.currentMetrics.complianceRate.governed = 70;
                    }
                    
                    if (!activeFeatures.role) {
                        // Without role adherence, error rate is increased
                        this.state.currentMetrics.errorRate.governed = 30;
                    }
                }
            }
        }
        
        // Update metrics display
        Object.keys(this.state.currentMetrics).forEach(key => {
            const metric = this.state.currentMetrics[key];
            
            // Update ungoverned value
            const ungovernedElement = document.getElementById(`${key}Ungoverned`);
            if (ungovernedElement) {
                ungovernedElement.textContent = metric.ungoverned;
            }
            
            // Update governed value
            const governedElement = document.getElementById(`${key}Governed`);
            if (governedElement) {
                governedElement.textContent = metric.governed;
            }
            
            // Update improvement/reduction/impact
            const improvementElement = document.getElementById(`${key}Improvement`);
            if (improvementElement) {
                improvementElement.textContent = metric.improvement || metric.reduction || metric.impact;
            }
        });
        
        // Update chart
        this.updateChart();
    },
    
    /**
     * Handle scenario start event
     * @param {Object} data - Scenario data
     */
    handleScenarioStart(data) {
        // Reset metrics to default values
        this.resetMetrics();
        
        // Update metrics display based on governance state
        this.updateMetricsDisplay({
            enabled: data.governanceEnabled,
            activeFeatures: data.activeFeatures
        });
    },
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        // Reset to default values
        this.state.currentMetrics = JSON.parse(JSON.stringify(this.config.metrics));
        
        // Update metrics display
        this.updateMetricsDisplay();
    },
    
    /**
     * Handle hallucination event
     * @param {Object} data - Hallucination data
     */
    handleHallucination(data) {
        // If ungoverned hallucination, decrease trust score
        if (data.type === 'ungoverned') {
            this.state.currentMetrics.trustScore.ungoverned -= 5;
            this.state.currentMetrics.errorRate.ungoverned += 5;
            
            // Update metrics display
            this.updateMetricsDisplay();
        }
    },
    
    /**
     * Handle governance intervention event
     * @param {Object} data - Intervention data
     */
    handleGovernanceIntervention(data) {
        // If governed intervention, increase trust score
        if (data.type === 'governed') {
            this.state.currentMetrics.trustScore.governed += 2;
            this.state.currentMetrics.complianceRate.governed += 2;
            
            // Update metrics display
            this.updateMetricsDisplay();
        }
    },
    
    /**
     * Handle conversation completed event
     * @param {Object} data - Conversation data
     */
    handleConversationCompleted(data) {
        // If governed conversation completed, update metrics
        if (data.type === 'governed') {
            // Check if completion message exists
            const hasCompletion = data.messages.some(message => message.completion);
            
            if (hasCompletion) {
                this.state.currentMetrics.complianceRate.governed += 3;
            }
            
            // Update metrics display
            this.updateMetricsDisplay();
        }
    },
    
    /**
     * Get metrics data
     * @returns {Object} Metrics data
     */
    getMetricsData() {
        return this.state.currentMetrics;
    }
};

// Export the module
export default MetricsManager;
