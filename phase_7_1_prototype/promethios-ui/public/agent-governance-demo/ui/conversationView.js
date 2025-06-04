/* Conversation View
 * Handles rendering of conversation UI
 * Manages display of agent responses and user prompts
 */

class ConversationView {
    constructor() {
        this.governedContainer = null;
        this.ungovernedContainer = null;
        this.currentProvider = 'openai';
        this.initialized = false;
        console.log('Conversation View created');
    }

    /**
     * Initialize the conversation view
     * @param {Object} config - Configuration object
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize(config) {
        if (this.initialized) {
            console.warn('Conversation View already initialized');
            return;
        }

        try {
            // Store reference to event bus
            this.eventBus = config.eventBus;
            
            // Get container elements
            this.governedContainer = document.getElementById(config.governedContainerId);
            this.ungovernedContainer = document.getElementById(config.ungovernedContainerId);
            
            if (!this.governedContainer || !this.ungovernedContainer) {
                throw new Error('Conversation containers not found');
            }
            
            // Subscribe to events
            this.subscriptions = [
                this.eventBus.subscribe('agent.response', this.handleAgentResponse.bind(this)),
                this.eventBus.subscribe('agent.error', this.handleAgentError.bind(this)),
                this.eventBus.subscribe('governance.intervention', this.handleGovernanceIntervention.bind(this))
            ];
            
            this.initialized = true;
            console.log('Conversation View initialized');
        } catch (error) {
            console.error('Error initializing Conversation View:', error);
            throw error;
        }
    }

    /**
     * Handle agent response event
     * @param {Object} data - Response data
     */
    handleAgentResponse(data) {
        // Determine which container to use
        const container = data.isGoverned ? this.governedContainer : this.ungovernedContainer;
        
        // Create response element
        const responseElement = this.createResponseElement(data);
        
        // Add to container
        container.appendChild(responseElement);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Handle agent error event
     * @param {Object} data - Error data
     */
    handleAgentError(data) {
        // Determine which container to use
        const container = data.isGoverned ? this.governedContainer : this.ungovernedContainer;
        
        // Create error element
        const errorElement = this.createErrorElement(data);
        
        // Add to container
        container.appendChild(errorElement);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Handle governance intervention event
     * @param {Object} data - Intervention data
     */
    handleGovernanceIntervention(data) {
        // Store intervention for later use
        // (will be displayed alongside agent responses)
        this.latestIntervention = data;
    }

    /**
     * Create response element
     * @param {Object} data - Response data
     * @returns {HTMLElement} - Response element
     */
    createResponseElement(data) {
        const { role, response, provider, isGoverned } = data;
        
        // Create container
        const element = document.createElement('div');
        element.className = `response-container ${role}`;
        element.dataset.provider = provider;
        
        // Create header
        const header = document.createElement('div');
        header.className = 'response-header';
        
        // Create role label
        const roleLabel = document.createElement('div');
        roleLabel.className = 'role-label';
        roleLabel.textContent = this.formatRoleName(role);
        header.appendChild(roleLabel);
        
        // Create provider label
        const providerLabel = document.createElement('div');
        providerLabel.className = 'provider-label';
        providerLabel.textContent = this.formatProviderName(provider);
        header.appendChild(providerLabel);
        
        // Add header to container
        element.appendChild(header);
        
        // Create content
        const content = document.createElement('div');
        content.className = 'response-content';
        content.innerHTML = this.formatResponse(response);
        element.appendChild(content);
        
        // Add governance indicators if applicable
        if (isGoverned && this.latestIntervention) {
            const indicator = this.createGovernanceIndicator(this.latestIntervention);
            element.appendChild(indicator);
            
            // Clear latest intervention
            this.latestIntervention = null;
        }
        
        return element;
    }

    /**
     * Create error element
     * @param {Object} data - Error data
     * @returns {HTMLElement} - Error element
     */
    createErrorElement(data) {
        const { role, error, provider } = data;
        
        // Create container
        const element = document.createElement('div');
        element.className = `error-container ${role}`;
        element.dataset.provider = provider;
        
        // Create header
        const header = document.createElement('div');
        header.className = 'error-header';
        header.textContent = `Error (${this.formatRoleName(role)}):`;
        element.appendChild(header);
        
        // Create content
        const content = document.createElement('div');
        content.className = 'error-content';
        content.textContent = error;
        element.appendChild(content);
        
        return element;
    }

    /**
     * Create governance indicator
     * @param {Object} intervention - Intervention data
     * @returns {HTMLElement} - Governance indicator element
     */
    createGovernanceIndicator(intervention) {
        const { type, description, severity } = intervention;
        
        // Create container
        const element = document.createElement('div');
        element.className = `governance-indicator ${severity}`;
        
        // Create icon
        const icon = document.createElement('div');
        icon.className = 'governance-icon';
        icon.innerHTML = '🛡️';
        element.appendChild(icon);
        
        // Create label
        const label = document.createElement('div');
        label.className = 'governance-label';
        label.textContent = this.formatInterventionType(type);
        element.appendChild(label);
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'governance-tooltip';
        tooltip.textContent = description;
        element.appendChild(tooltip);
        
        return element;
    }

    /**
     * Show loading state
     * @param {boolean} governed - Whether to show loading in governed container
     * @param {boolean} ungoverned - Whether to show loading in ungoverned container
     */
    showLoading(governed, ungoverned) {
        if (governed) {
            this.showLoadingInContainer(this.governedContainer);
        }
        
        if (ungoverned) {
            this.showLoadingInContainer(this.ungovernedContainer);
        }
    }

    /**
     * Show loading in container
     * @param {HTMLElement} container - Container element
     */
    showLoadingInContainer(container) {
        // Check if loading element already exists
        let loadingElement = container.querySelector('.loading-indicator');
        
        if (!loadingElement) {
            // Create loading element
            loadingElement = document.createElement('div');
            loadingElement.className = 'loading-indicator';
            loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Processing...</div>
            `;
            container.appendChild(loadingElement);
            
            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        }
    }

    /**
     * Hide loading state
     * @param {boolean} governed - Whether to hide loading in governed container
     * @param {boolean} ungoverned - Whether to hide loading in ungoverned container
     */
    hideLoading(governed, ungoverned) {
        if (governed) {
            this.hideLoadingInContainer(this.governedContainer);
        }
        
        if (ungoverned) {
            this.hideLoadingInContainer(this.ungovernedContainer);
        }
    }

    /**
     * Hide loading in container
     * @param {HTMLElement} container - Container element
     */
    hideLoadingInContainer(container) {
        // Remove loading element if it exists
        const loadingElement = container.querySelector('.loading-indicator');
        if (loadingElement) {
            container.removeChild(loadingElement);
        }
    }

    /**
     * Show error message
     * @param {string} title - Error title
     * @param {string} message - Error message
     */
    showError(title, message) {
        // Show in both containers
        this.showErrorInContainer(this.governedContainer, title, message);
        this.showErrorInContainer(this.ungovernedContainer, title, message);
    }

    /**
     * Show error in container
     * @param {HTMLElement} container - Container element
     * @param {string} title - Error title
     * @param {string} message - Error message
     */
    showErrorInContainer(container, title, message) {
        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <div class="error-title">${title}</div>
            <div class="error-content">${message}</div>
        `;
        container.appendChild(errorElement);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Switch provider
     * @param {string} provider - Provider ID
     * @param {boolean} governed - Whether this is for the governed container
     */
    switchProvider(provider, governed) {
        this.currentProvider = provider;
        
        // Get container
        const container = governed ? this.governedContainer : this.ungovernedContainer;
        
        // Hide all responses except for this provider
        const responses = container.querySelectorAll('.response-container, .error-container');
        responses.forEach(response => {
            if (response.dataset.provider === provider) {
                response.style.display = 'block';
            } else {
                response.style.display = 'none';
            }
        });
    }

    /**
     * Reset conversation view
     */
    reset() {
        // Clear containers
        if (this.governedContainer) {
            this.governedContainer.innerHTML = '';
        }
        
        if (this.ungovernedContainer) {
            this.ungovernedContainer.innerHTML = '';
        }
        
        // Reset provider
        this.currentProvider = 'openai';
        
        // Reset latest intervention
        this.latestIntervention = null;
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
     * Format response text
     * @param {string} text - Response text
     * @returns {string} - Formatted HTML
     */
    formatResponse(text) {
        // Convert newlines to <br>
        let formatted = text.replace(/\n/g, '<br>');
        
        // Highlight key phrases
        formatted = this.highlightKeyPhrases(formatted);
        
        return formatted;
    }

    /**
     * Highlight key phrases in text
     * @param {string} text - Text to highlight
     * @returns {string} - Text with highlights
     */
    highlightKeyPhrases(text) {
        // Highlight role boundaries
        text = text.replace(
            /(I am not qualified to|This is outside my role as|I should defer to|As a [^,]+, I cannot|I'll defer to)/gi,
            '<span class="highlight role-boundary">$1</span>'
        );
        
        // Highlight factual uncertainty
        text = text.replace(
            /(I'm not certain about|I don't have specific information on|I cannot verify|This may not be accurate|I'm uncertain about)/gi,
            '<span class="highlight factual-uncertainty">$1</span>'
        );
        
        // Highlight safety concerns
        text = text.replace(
            /(I cannot provide|This request is inappropriate|For safety reasons|I'm unable to assist with|This violates)/gi,
            '<span class="highlight safety-concern">$1</span>'
        );
        
        return text;
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
        console.log('Conversation View cleaned up');
    }
}

// Create and export singleton instance
const conversationView = new ConversationView();
export default conversationView;
