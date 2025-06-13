/**
 * Emotional UX Module
 * Enhances the user experience with emotional storytelling and visual cues
 * to demonstrate the importance of AI governance
 */

const EmotionalUX = {
    // Configuration
    config: {
        animationDuration: 500,
        highlightColor: 'rgba(138, 43, 226, 0.2)',
        errorColor: 'rgba(255, 0, 0, 0.2)',
        storyElements: {
            product_planning: {
                ungoverned: {
                    risk: "Unrealistic features and timelines lead to project failure, wasting $2.4M in development costs.",
                    impact: "Company loses market position and customer trust due to overpromised, underdelivered product."
                },
                governed: {
                    benefit: "Realistic, prioritized roadmap delivers value incrementally with 94% on-time feature delivery.",
                    impact: "Product achieves market fit with sustainable development pace and high customer satisfaction."
                }
            },
            legal_review: {
                ungoverned: {
                    risk: "Reliance on fictional legal precedent exposes company to significant liability and potential lawsuits.",
                    impact: "Legal challenge costs $1.2M in settlement and damages company reputation in the industry."
                },
                governed: {
                    benefit: "Accurate legal assessment ensures compliant contracts and appropriate risk management.",
                    impact: "Company maintains strong legal position and builds trust with enterprise clients."
                }
            },
            customer_service: {
                ungoverned: {
                    risk: "Inconsistent handoff leads to repeated customer explanations and lost context.",
                    impact: "Customer frustration increases, resulting in 37% higher churn rate for escalated issues."
                },
                governed: {
                    benefit: "Seamless escalation with complete context transfer improves resolution time by 42%.",
                    impact: "Customer satisfaction scores for complex issues increase from 3.2 to 4.7 out of 5."
                }
            },
            medical_triage: {
                ungoverned: {
                    risk: "Missing disclaimers and overconfident medical advice creates dangerous liability.",
                    impact: "Patients may make health decisions based on non-expert AI recommendations."
                },
                governed: {
                    benefit: "Clear medical disclaimers and appropriate confidence levels ensure responsible guidance.",
                    impact: "Patients receive helpful information while being directed to proper medical professionals."
                }
            }
        }
    },
    
    /**
     * Initialize the module
     */
    init() {
        this.setupEventListeners();
        this.createStorytellingElements();
        console.log('Emotional UX module initialized');
    },
    
    /**
     * Set up event listeners for communication with other modules
     */
    setupEventListeners() {
        EventBus.subscribe('scenarioChanged', this.updateStoryElements.bind(this));
        EventBus.subscribe('hallucinationDetected', this.highlightHallucination.bind(this));
        EventBus.subscribe('scenarioCompleted', this.showOutcomeComparison.bind(this));
        EventBus.subscribe('conversationCompleted', this.animateMetricsDifference.bind(this));
    },
    
    /**
     * Create storytelling elements in the UI
     */
    createStorytellingElements() {
        // Create story containers if they don't exist
        if (!document.getElementById('ungoverned-story')) {
            const ungovernedContainer = document.querySelector('.col-md-6:first-child');
            const storyElement = document.createElement('div');
            storyElement.id = 'ungoverned-story';
            storyElement.className = 'story-container mb-3 d-none';
            ungovernedContainer.appendChild(storyElement);
        }
        
        if (!document.getElementById('governed-story')) {
            const governedContainer = document.querySelector('.col-md-6:nth-child(2)');
            const storyElement = document.createElement('div');
            storyElement.id = 'governed-story';
            storyElement.className = 'story-container mb-3 d-none';
            governedContainer.appendChild(storyElement);
        }
        
        // Create outcome comparison container
        if (!document.getElementById('outcome-comparison')) {
            const row = document.querySelector('.row:nth-child(2)');
            const comparisonContainer = document.createElement('div');
            comparisonContainer.className = 'col-12 mb-4 d-none';
            comparisonContainer.id = 'outcome-comparison-container';
            
            comparisonContainer.innerHTML = `
                <div class="card bg-dark-subtle">
                    <div class="card-header">
                        <h5 class="mb-0">Real-World Outcomes Comparison</h5>
                    </div>
                    <div class="card-body" id="outcome-comparison">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="outcome-card negative">
                                    <h6><i class="bi bi-exclamation-triangle"></i> Ungoverned AI Risk</h6>
                                    <p id="ungoverned-risk">Risk description will appear here.</p>
                                    <div class="impact-container">
                                        <h6>Real-world Impact:</h6>
                                        <p id="ungoverned-impact">Impact description will appear here.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="outcome-card positive">
                                    <h6><i class="bi bi-check-circle"></i> Governed AI Benefit</h6>
                                    <p id="governed-benefit">Benefit description will appear here.</p>
                                    <div class="impact-container">
                                        <h6>Real-world Impact:</h6>
                                        <p id="governed-impact">Impact description will appear here.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            row.parentNode.insertBefore(comparisonContainer, row.nextSibling);
        }
    },
    
    /**
     * Update story elements based on selected scenario
     * @param {Object} data - Scenario data
     */
    updateStoryElements(data) {
        const { scenario } = data;
        
        // Hide story elements initially
        document.getElementById('ungoverned-story').classList.add('d-none');
        document.getElementById('governed-story').classList.add('d-none');
        document.getElementById('outcome-comparison-container').classList.add('d-none');
        
        // Update outcome comparison text
        const storyData = this.config.storyElements[scenario.id];
        if (storyData) {
            document.getElementById('ungoverned-risk').textContent = storyData.ungoverned.risk;
            document.getElementById('ungoverned-impact').textContent = storyData.ungoverned.impact;
            document.getElementById('governed-benefit').textContent = storyData.governed.benefit;
            document.getElementById('governed-impact').textContent = storyData.governed.impact;
        }
    },
    
    /**
     * Highlight hallucination in the chat
     * @param {Object} data - Hallucination data
     */
    highlightHallucination(data) {
        const { type, content } = data;
        
        // Find the message containing the hallucination
        const chatElement = document.getElementById(`${type}-chat`);
        const messages = chatElement.querySelectorAll('.chat-message');
        const lastMessage = messages[messages.length - 1];
        
        // Add visual effect
        lastMessage.style.backgroundColor = this.config.errorColor;
        setTimeout(() => {
            lastMessage.style.backgroundColor = '';
        }, this.config.animationDuration * 2);
        
        // Show story element for ungoverned
        if (type === 'ungoverned') {
            const storyElement = document.getElementById('ungoverned-story');
            storyElement.classList.remove('d-none');
            storyElement.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="bi bi-exclamation-triangle"></i> Hallucination Detected</h6>
                    <p>This agent is presenting fictional information as fact, which could lead to serious consequences in real-world applications.</p>
                </div>
            `;
            
            // Animate to draw attention
            storyElement.style.opacity = '0';
            setTimeout(() => {
                storyElement.style.transition = 'opacity 0.5s ease-in-out';
                storyElement.style.opacity = '1';
            }, 100);
        }
        
        // Show story element for governed (VERITAS prevention)
        if (type === 'governed') {
            const storyElement = document.getElementById('governed-story');
            storyElement.classList.remove('d-none');
            storyElement.innerHTML = `
                <div class="alert alert-success">
                    <h6><i class="bi bi-shield-check"></i> Hallucination Prevented</h6>
                    <p>VERITAS governance has prevented the agent from presenting fictional information as fact, ensuring reliable and trustworthy responses.</p>
                </div>
            `;
            
            // Animate to draw attention
            storyElement.style.opacity = '0';
            setTimeout(() => {
                storyElement.style.transition = 'opacity 0.5s ease-in-out';
                storyElement.style.opacity = '1';
            }, 100);
        }
        
        // Update metrics
        this.updateMetricsForHallucination(type);
    },
    
    /**
     * Update metrics when hallucination is detected
     * @param {string} type - 'ungoverned' or 'governed'
     */
    updateMetricsForHallucination(type) {
        if (type === 'ungoverned') {
            // Decrease trust score for ungoverned
            const trustElement = document.getElementById('trustUngoverned');
            const currentTrust = parseInt(trustElement.textContent);
            const newTrust = Math.max(0, currentTrust - 15);
            
            this.animateNumber(trustElement, currentTrust, newTrust);
            
            // Increase error rate for ungoverned
            const errorElement = document.getElementById('errorUngoverned');
            const currentError = parseInt(errorElement.textContent);
            const newError = Math.min(100, currentError + 10);
            
            this.animateNumber(errorElement, currentError, newError);
            
            // Update improvement percentages
            this.updateImprovementPercentages();
        }
    },
    
    /**
     * Show outcome comparison when scenario is completed
     * @param {Object} data - Scenario data
     */
    showOutcomeComparison(data) {
        // Show outcome comparison
        const comparisonContainer = document.getElementById('outcome-comparison-container');
        comparisonContainer.classList.remove('d-none');
        
        // Animate to draw attention
        comparisonContainer.style.opacity = '0';
        setTimeout(() => {
            comparisonContainer.style.transition = 'opacity 1s ease-in-out';
            comparisonContainer.style.opacity = '1';
        }, 500);
        
        // Add observer commentary
        this.updateObserverCommentary(data);
    },
    
    /**
     * Update observer commentary with emotional storytelling
     * @param {Object} data - Scenario data
     */
    updateObserverCommentary(data) {
        const { scenario } = data;
        const storyData = this.config.storyElements[scenario.id];
        
        if (!storyData) return;
        
        const observerElement = document.querySelector('.observer-commentary');
        
        // Add emotional storytelling to observer commentary
        const commentaryElement = document.createElement('div');
        commentaryElement.className = 'mt-3';
        commentaryElement.innerHTML = `
            <h5>Why Governance Matters in ${scenario.title}</h5>
            <p>This scenario demonstrates a critical governance challenge in AI systems:</p>
            <div class="row mt-3">
                <div class="col-md-6">
                    <div class="card bg-danger bg-opacity-10 mb-3">
                        <div class="card-body">
                            <h6 class="text-danger"><i class="bi bi-exclamation-triangle"></i> Without Governance</h6>
                            <p>${storyData.ungoverned.risk}</p>
                            <p><strong>Impact:</strong> ${storyData.ungoverned.impact}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-success bg-opacity-10 mb-3">
                        <div class="card-body">
                            <h6 class="text-success"><i class="bi bi-check-circle"></i> With Promethios Governance</h6>
                            <p>${storyData.governed.benefit}</p>
                            <p><strong>Impact:</strong> ${storyData.governed.impact}</p>
                        </div>
                    </div>
                </div>
            </div>
            <p class="mt-3">This isn't just about better metrics—it's about real-world outcomes that affect businesses, users, and society.</p>
        `;
        
        observerElement.appendChild(commentaryElement);
    },
    
    /**
     * Animate metrics difference when conversation is completed
     * @param {Object} data - Conversation data
     */
    animateMetricsDifference(data) {
        // Get current metric values
        const trustUngoverned = parseInt(document.getElementById('trustUngoverned').textContent);
        const trustGoverned = parseInt(document.getElementById('trustGoverned').textContent);
        const complianceUngoverned = parseInt(document.getElementById('complianceUngoverned').textContent);
        const complianceGoverned = parseInt(document.getElementById('complianceGoverned').textContent);
        const errorUngoverned = parseInt(document.getElementById('errorUngoverned').textContent);
        const errorGoverned = parseInt(document.getElementById('errorGoverned').textContent);
        
        // Calculate improvements
        const trustImprovement = Math.round((trustGoverned - trustUngoverned) / trustUngoverned * 100);
        const complianceImprovement = Math.round((complianceGoverned - complianceUngoverned) / complianceUngoverned * 100);
        const errorReduction = Math.round((errorUngoverned - errorGoverned) / errorUngoverned * 100);
        
        // Update improvement displays
        document.getElementById('trustImprovement').textContent = `+${trustImprovement}%`;
        document.getElementById('complianceImprovement').textContent = `+${complianceImprovement}%`;
        document.getElementById('errorReduction').textContent = `-${errorReduction}%`;
        
        // Highlight the improvements
        this.pulseElement(document.getElementById('trustImprovement'));
        this.pulseElement(document.getElementById('complianceImprovement'));
        this.pulseElement(document.getElementById('errorReduction'));
    },
    
    /**
     * Update improvement percentages based on current metric values
     */
    updateImprovementPercentages() {
        // Get current metric values
        const trustUngoverned = parseInt(document.getElementById('trustUngoverned').textContent);
        const trustGoverned = parseInt(document.getElementById('trustGoverned').textContent);
        const complianceUngoverned = parseInt(document.getElementById('complianceUngoverned').textContent);
        const complianceGoverned = parseInt(document.getElementById('complianceGoverned').textContent);
        const errorUngoverned = parseInt(document.getElementById('errorUngoverned').textContent);
        const errorGoverned = parseInt(document.getElementById('errorGoverned').textContent);
        
        // Calculate improvements
        const trustImprovement = Math.round((trustGoverned - trustUngoverned) / trustUngoverned * 100);
        const complianceImprovement = Math.round((complianceGoverned - complianceUngoverned) / complianceUngoverned * 100);
        const errorReduction = Math.round((errorUngoverned - errorGoverned) / errorUngoverned * 100);
        
        // Update improvement displays
        document.getElementById('trustImprovement').textContent = `+${trustImprovement}%`;
        document.getElementById('complianceImprovement').textContent = `+${complianceImprovement}%`;
        document.getElementById('errorReduction').textContent = `-${errorReduction}%`;
    },
    
    /**
     * Animate a number changing in an element
     * @param {HTMLElement} element - Element to animate
     * @param {number} start - Starting value
     * @param {number} end - Ending value
     */
    animateNumber(element, start, end) {
        let current = start;
        const step = (end - start) / 10;
        const timer = setInterval(() => {
            current += step;
            if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
                clearInterval(timer);
                element.textContent = end;
            } else {
                element.textContent = Math.round(current);
            }
        }, 50);
    },
    
    /**
     * Create a pulse animation on an element
     * @param {HTMLElement} element - Element to animate
     */
    pulseElement(element) {
        element.style.transition = 'transform 0.3s ease-in-out, color 0.3s ease-in-out';
        element.style.color = 'var(--purple-primary)';
        element.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            setTimeout(() => {
                element.style.color = '';
            }, 300);
        }, 300);
    }
};

// Export the module
export default EmotionalUX;
