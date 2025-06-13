/**
 * Main Application Entry Point
 * Initializes and coordinates all modules for CMU Interactive Playground
 */

// Import modules
import runtimeEnvLoader from './modules/runtimeEnvironmentLoader.js';
import AgentConversation from './modules/agentConversation.js';
import RobustAPIClient from './modules/robustApiClient.js';
import EventBus from './modules/eventBus.js';
import EmotionalUX from './modules/emotionalUX.js';
import ScenarioManager from './modules/scenarioManager.js';
import MetricsManager from './modules/metricsManager.js';
import ExportModule from './modules/exportModule.js';
import EnhancedFeatures from './modules/enhancedFeatures.js';
import { featureFlags } from './modules/featureFlags.js';
import { developerPanel } from './modules/developerPanel.js';

// Application state
const AppState = {
    currentScenario: null,
    governanceEnabled: true,
    activeFeatures: {
        veritas: true,
        safety: true,
        role: true
    },
    running: false
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize application with proper error handling
 */
async function initializeApp() {
    try {
        console.log('🚀 Initializing CMU Interactive Playground Application...');
        
        // Check for development mode
        checkDevelopmentMode();
        
        // Load environment variables first
        console.log('🔄 Loading environment variables...');
        await runtimeEnvLoader.loadEnvironmentVariables();
        
        // Initialize EventBus first (required by all modules)
        if (EventBus && typeof EventBus.init === 'function') {
            EventBus.init();
        }
        console.log('✅ EventBus initialized');
        
        // Make EventBus globally available
        window.EventBus = EventBus;
        
        // Initialize RobustAPIClient (handles environment variables gracefully)
        await RobustAPIClient.init();
        console.log('✅ RobustAPIClient initialized');
        
        // Initialize other modules in dependency order
        if (ScenarioManager && typeof ScenarioManager.init === 'function') {
            ScenarioManager.init();
            console.log('✅ ScenarioManager initialized');
        }
        
        if (MetricsManager && typeof MetricsManager.init === 'function') {
            MetricsManager.init();
            console.log('✅ MetricsManager initialized');
        }
        
        if (AgentConversation && typeof AgentConversation.init === 'function') {
            AgentConversation.init();
            console.log('✅ AgentConversation initialized');
        }
        
        if (EmotionalUX && typeof EmotionalUX.init === 'function') {
            EmotionalUX.init();
            console.log('✅ EmotionalUX initialized');
        }
        
        if (ExportModule && typeof ExportModule.init === 'function') {
            ExportModule.init();
            console.log('✅ ExportModule initialized');
        }
        
        if (EnhancedFeatures && typeof EnhancedFeatures.init === 'function') {
            EnhancedFeatures.init();
            console.log('✅ EnhancedFeatures initialized');
        }
        
        // Initialize developer panel
        developerPanel.init();
        console.log('✅ Developer Panel initialized');
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('🎉 Application initialization complete!');
        
        // Publish initialization complete event
        EventBus.publish('app:initialized', {
            timestamp: new Date().toISOString(),
            modules: ['EventBus', 'RobustAPIClient', 'ScenarioManager', 'MetricsManager', 'AgentConversation', 'EmotionalUX', 'ExportModule', 'EnhancedFeatures', 'DeveloperPanel']
        });
        
        // Show API configuration status
        showAPIStatus();
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        showInitializationError(error);
    }
}

/**
 * Check for development mode
 */
function checkDevelopmentMode() {
    // Check URL parameters for dev mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('dev') || urlParams.has('development')) {
        featureFlags.set('SHOW_DEVELOPER_PANEL', true);
        console.log('Development mode enabled via URL parameter');
    }
    
    // Check for localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        featureFlags.set('SHOW_DEVELOPER_PANEL', true);
        console.log('Development mode enabled on localhost');
    }
}

/**
 * Show API configuration status to user
 */
function showAPIStatus() {
    try {
        const config = RobustAPIClient.getConfig();
        console.log('📊 API Configuration:', config);
        
        if (config.fallbackMode) {
            console.log('⚠️ Running in fallback mode - simulated responses will be used');
        } else {
            console.log(`✅ Real API integration active with providers: ${config.availableProviders.join(', ')}`);
        }
    } catch (error) {
        console.warn('Could not retrieve API status:', error);
    }
}

/**
 * Show initialization error to user
 */
function showInitializationError(error) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'alert alert-warning mt-3';
    errorContainer.innerHTML = `
        <h5>⚠️ Initialization Notice</h5>
        <p>The application encountered an issue during startup: <code>${error.message}</code></p>
        <p>The demo will continue in fallback mode with limited functionality.</p>
        <button class="btn btn-primary btn-sm" onclick="location.reload()">Retry Initialization</button>
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(errorContainer, container.firstChild);
}

/**
 * Set up event listeners for UI interactions
 */
function setupEventListeners() {
    // Scenario selection
    const scenarioSelect = document.getElementById('scenarioSelect');
    if (scenarioSelect) {
        scenarioSelect.addEventListener('change', handleScenarioChange);
    }
    
    // Governance toggle
    const governanceToggle = document.getElementById('governanceToggle');
    if (governanceToggle) {
        governanceToggle.addEventListener('change', handleGovernanceToggle);
    }
    
    // Feature toggles
    const veritasToggle = document.getElementById('veritasToggle');
    if (veritasToggle) {
        veritasToggle.addEventListener('change', () => handleFeatureToggle('veritas', veritasToggle.checked));
    }
    
    const safetyToggle = document.getElementById('safetyToggle');
    if (safetyToggle) {
        safetyToggle.addEventListener('change', () => handleFeatureToggle('safety', safetyToggle.checked));
    }
    
    const roleToggle = document.getElementById('roleToggle');
    if (roleToggle) {
        roleToggle.addEventListener('change', () => handleFeatureToggle('role', roleToggle.checked));
    }
    
    // Start scenario button
    const startScenarioBtn = document.getElementById('startScenarioBtn');
    if (startScenarioBtn) {
        startScenarioBtn.addEventListener('click', handleStartScenario);
    }
    
    // Agent logs toggles
    const showUngovernedLogs = document.getElementById('showUngovernedLogs');
    if (showUngovernedLogs) {
        showUngovernedLogs.addEventListener('change', () => toggleAgentLogs('ungoverned', showUngovernedLogs.checked));
    }
    
    const showGovernedLogs = document.getElementById('showGovernedLogs');
    if (showGovernedLogs) {
        showGovernedLogs.addEventListener('change', () => toggleAgentLogs('governed', showGovernedLogs.checked));
    }
    
    // Export report button
    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', handleExportReport);
    }
    
    // Test violation button
    const testViolationBtn = document.getElementById('testViolationBtn');
    if (testViolationBtn) {
        testViolationBtn.addEventListener('click', handleTestViolation);
    }
    
    // Violation options
    const violationOptions = document.querySelectorAll('[data-violation]');
    violationOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const violation = e.target.getAttribute('data-violation');
            const type = e.target.getAttribute('data-type');
            handleViolationOption(violation, type);
        });
    });
    
    // Subscribe to agent message events
    EventBus.subscribe('agentMessage', handleAgentMessage);
    
    // Subscribe to conversation complete event
    EventBus.subscribe('conversationComplete', handleConversationComplete);
    
    // Subscribe to conversation error event
    EventBus.subscribe('conversationError', handleConversationError);
}

/**
 * Handle scenario change
 */
function handleScenarioChange(event) {
    const scenarioId = event.target.value;
    AppState.currentScenario = scenarioId;
    
    // Update scenario description
    updateScenarioDescription(scenarioId);
    
    // Publish event
    EventBus.publish('scenarioChanged', { scenarioId });
}

/**
 * Update scenario description
 */
function updateScenarioDescription(scenarioId) {
    if (!ScenarioManager || typeof ScenarioManager.getScenarioById !== 'function') {
        return;
    }
    
    const scenarioData = ScenarioManager.getScenarioById(scenarioId);
    if (!scenarioData) return;
    
    const titleElement = document.getElementById('scenarioTitle');
    const summaryElement = document.getElementById('scenarioSummary');
    
    if (titleElement) {
        titleElement.textContent = scenarioData.title;
    }
    
    if (summaryElement) {
        summaryElement.textContent = scenarioData.summary;
    }
}

/**
 * Handle governance toggle
 */
function handleGovernanceToggle(event) {
    AppState.governanceEnabled = event.target.checked;
    
    // Update feature toggles availability
    updateFeatureTogglesAvailability();
    
    // Update feature flags
    featureFlags.set('GOVERNANCE_ENABLED', event.target.checked);
    
    // Publish event
    EventBus.publish('governanceToggled', {
        enabled: AppState.governanceEnabled,
        activeFeatures: AppState.activeFeatures
    });
}

/**
 * Update feature toggles availability
 */
function updateFeatureTogglesAvailability() {
    const featureToggles = document.querySelectorAll('.governance-features input');
    featureToggles.forEach(toggle => {
        toggle.disabled = !AppState.governanceEnabled;
    });
}

/**
 * Handle feature toggle
 */
function handleFeatureToggle(feature, enabled) {
    AppState.activeFeatures[feature] = enabled;
    
    // Update feature flags
    switch (feature) {
        case 'veritas':
            featureFlags.set('VERITAS_ENABLED', enabled);
            break;
        case 'safety':
            featureFlags.set('SAFETY_ENABLED', enabled);
            break;
        case 'role':
            featureFlags.set('ROLE_ADHERENCE_ENABLED', enabled);
            break;
    }
    
    // Publish event
    EventBus.publish('featureToggled', {
        feature,
        enabled,
        activeFeatures: AppState.activeFeatures
    });
}

/**
 * Handle start scenario
 */
function handleStartScenario() {
    if (AppState.running) return;
    
    // Update UI
    const startButton = document.getElementById('startScenarioBtn');
    if (startButton) {
        startButton.textContent = 'Running...';
        startButton.disabled = true;
    }
    
    // Clear previous conversation
    clearConversation();
    
    // Set running state
    AppState.running = true;
    
    // Ensure we have a valid scenario ID
    const scenarioId = AppState.currentScenario || 'product_planning';
    console.log(`Starting scenario with ID: ${scenarioId}`);
    
    // Publish event with validated scenario ID
    EventBus.publish('scenarioStarted', {
        scenarioId: scenarioId,
        governanceEnabled: AppState.governanceEnabled,
        activeFeatures: AppState.activeFeatures
    });
}

/**
 * Clear conversation
 */
function clearConversation() {
    const ungovernedChat = document.getElementById('ungoverned-chat');
    const governedChat = document.getElementById('governed-chat');
    
    if (ungovernedChat) {
        ungovernedChat.innerHTML = '';
    }
    
    if (governedChat) {
        governedChat.innerHTML = '';
    }
}

/**
 * Handle agent message
 */
function handleAgentMessage(data) {
    // Determine which chat container to use
    const chatContainer = data.isGoverned ? 
        document.getElementById('governed-chat') : 
        document.getElementById('ungoverned-chat');
    
    if (!chatContainer) return;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    // Get agent color based on ID
    const agentColor = getAgentColor(data.agentId);
    
    // Extract message content, handling both message and content properties
    const messageContent = data.message || data.content || '';
    
    // Create message content
    messageElement.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="agent-icon" style="background-color: ${agentColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <span>${data.agentId.charAt(0).toUpperCase()}</span>
            </div>
            <span class="agent-name">${getAgentName(data.agentId)}</span>
        </div>
        <div class="message-time">${formatTime(data.timestamp)}</div>
        <div class="message-content">${formatMessage(messageContent)}</div>
    `;
    
    // Add governance indicators if applicable
    if (data.isGoverned && data.governanceData) {
        const governanceElement = createGovernanceElement(data.governanceData);
        messageElement.appendChild(governanceElement);
    }
    
    // Add to chat container
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Get agent color based on ID
 */
function getAgentColor(agentId) {
    const colors = {
        'agent1': '#4285F4', // Google Blue
        'agent2': '#EA4335', // Google Red
        'system': '#34A853', // Google Green
        'user': '#FBBC05'    // Google Yellow
    };
    
    return colors[agentId] || '#9AA0A6'; // Google Grey as default
}

/**
 * Get agent name based on ID
 */
function getAgentName(agentId) {
    const names = {
        'agent1': 'Agent 1',
        'agent2': 'Agent 2',
        'system': 'System',
        'user': 'User'
    };
    
    return names[agentId] || agentId;
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format message with markdown
 * @param {string} message - Message to format (may be undefined)
 * @returns {string} - Formatted message
 */
function formatMessage(message) {
    // Handle undefined or null messages
    if (message === undefined || message === null) {
        return '';
    }
    
    // Simple markdown formatting
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

/**
 * Create governance element
 */
function createGovernanceElement(governanceData) {
    const element = document.createElement('div');
    element.className = 'governance-data mt-2';
    
    let content = '<div class="governance-header">Governance Applied</div>';
    
    if (governanceData.veritas) {
        content += `<div class="governance-item">
            <span class="badge bg-info">Veritas</span>
            <span>${governanceData.veritas}</span>
        </div>`;
    }
    
    if (governanceData.safety) {
        content += `<div class="governance-item">
            <span class="badge bg-warning">Safety</span>
            <span>${governanceData.safety}</span>
        </div>`;
    }
    
    if (governanceData.role) {
        content += `<div class="governance-item">
            <span class="badge bg-success">Role</span>
            <span>${governanceData.role}</span>
        </div>`;
    }
    
    element.innerHTML = content;
    return element;
}

/**
 * Toggle agent logs
 */
function toggleAgentLogs(type, show) {
    const logContainer = document.getElementById(`${type}-logs`);
    if (logContainer) {
        logContainer.style.display = show ? 'block' : 'none';
    }
}

/**
 * Handle conversation complete
 */
function handleConversationComplete(data) {
    console.log('Conversation complete:', data);
    
    // Update UI
    const startButton = document.getElementById('startScenarioBtn');
    if (startButton) {
        startButton.textContent = 'Start Scenario';
        startButton.disabled = false;
    }
    
    // Reset running state
    AppState.running = false;
    
    // Update metrics
    if (data.metrics && MetricsManager) {
        MetricsManager.updateMetrics(data.metrics);
    }
    
    // Update enhanced features stats
    if (EnhancedFeatures && typeof EnhancedFeatures.updateStats === 'function') {
        EnhancedFeatures.updateStats(data);
    }
}

/**
 * Handle conversation error
 */
function handleConversationError(data) {
    console.error('Conversation error:', data);
    
    // Update UI
    const startButton = document.getElementById('startScenarioBtn');
    if (startButton) {
        startButton.textContent = 'Start Scenario';
        startButton.disabled = false;
    }
    
    // Reset running state
    AppState.running = false;
    
    // Show error message
    const errorContainer = document.createElement('div');
    errorContainer.className = 'alert alert-danger mt-3';
    errorContainer.innerHTML = `
        <h5>⚠️ Conversation Error</h5>
        <p>${data.error}</p>
        ${data.details ? `<p><small>${data.details}</small></p>` : ''}
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(errorContainer, container.firstChild);
}

/**
 * Handle export report
 */
function handleExportReport() {
    if (!ExportModule || typeof ExportModule.exportReport !== 'function') {
        alert('Export module not available');
        return;
    }
    
    ExportModule.exportReport({
        scenarioId: AppState.currentScenario,
        governanceEnabled: AppState.governanceEnabled,
        activeFeatures: AppState.activeFeatures
    });
}

/**
 * Handle test violation
 */
function handleTestViolation() {
    const violationMenu = document.getElementById('violationMenu');
    if (violationMenu) {
        violationMenu.classList.toggle('show');
    }
}

/**
 * Handle violation option
 */
function handleViolationOption(violation, type) {
    // Hide menu
    const violationMenu = document.getElementById('violationMenu');
    if (violationMenu) {
        violationMenu.classList.remove('show');
    }
    
    // Publish violation event
    EventBus.publish('testViolation', {
        violation,
        type,
        timestamp: new Date().toISOString()
    });
}
