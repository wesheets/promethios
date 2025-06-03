/**
 * Main Application Entry Point
 * Initializes and coordinates all modules for CMU Playground
 */

// Import modules
import AgentConversation from './modules/agentConversation.js';
import RobustAPIClient from './modules/robustApiClient.js';
import EventBus from './modules/eventBus.js';
import EmotionalUX from './modules/emotionalUX.js';
import ScenarioManager from './modules/scenarioManager.js';
import MetricsManager from './modules/metricsManager.js';
import ExportModule from './modules/exportModule.js';
import EnhancedFeatures from './modules/enhancedFeatures.js';

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
function initializeApp() {
    try {
        console.log('🚀 Initializing CMU Playground Application...');
        
        // Initialize EventBus first (required by all modules)
        if (EventBus && typeof EventBus.init === 'function') {
            EventBus.init();
        }
        console.log('✅ EventBus initialized');
        
        // Make EventBus globally available
        window.EventBus = EventBus;
        
        // Initialize RobustAPIClient (handles environment variables gracefully)
        RobustAPIClient.init();
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
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('🎉 Application initialization complete!');
        
        // Publish initialization complete event
        EventBus.publish('app:initialized', {
            timestamp: new Date().toISOString(),
            modules: ['EventBus', 'RobustAPIClient', 'ScenarioManager', 'MetricsManager', 'AgentConversation', 'EmotionalUX', 'ExportModule', 'EnhancedFeatures']
        });
        
        // Show API configuration status
        showAPIStatus();
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        showInitializationError(error);
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
    
    // Publish event
    EventBus.publish('scenarioStarted', {
        scenarioId: AppState.currentScenario || 'product_planning',
        governanceEnabled: AppState.governanceEnabled,
        activeFeatures: AppState.activeFeatures
    });
    
    // Listen for scenario completion to reset button
    EventBus.subscribe('conversationTerminated', () => {
        if (startButton) {
            startButton.textContent = 'Start Scenario';
            startButton.disabled = false;
        }
        AppState.running = false;
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
 * Toggle agent logs
 */
function toggleAgentLogs(type, show) {
    const logsElement = document.getElementById(`${type}-logs`);
    if (logsElement) {
        if (show) {
            logsElement.classList.remove('d-none');
        } else {
            logsElement.classList.add('d-none');
        }
    }
}

// Make toggleAgentLogs globally accessible
window.toggleAgentLogs = toggleAgentLogs;

/**
 * Handle export report
 */
function handleExportReport() {
    if (ExportModule && typeof ExportModule.exportReport === 'function') {
        ExportModule.exportReport({
            scenarioId: AppState.currentScenario || 'product_planning',
            governanceEnabled: AppState.governanceEnabled,
            activeFeatures: AppState.activeFeatures,
            metrics: MetricsManager && typeof MetricsManager.getMetricsData === 'function' 
                ? MetricsManager.getMetricsData() 
                : {}
        });
    }
}

/**
 * Handle test violation
 */
function handleTestViolation() {
    // This will be handled by the dropdown items
}

/**
 * Handle violation option
 */
function handleViolationOption(violation, type) {
    // Publish event
    EventBus.publish('violationRequested', {
        violation,
        type,
        governanceEnabled: AppState.governanceEnabled
    });
}

// Export modules for global access
window.AppModules = {
    RobustAPIClient,
    EventBus,
    ScenarioManager,
    MetricsManager,
    AgentConversation,
    EmotionalUX,
    ExportModule,
    EnhancedFeatures
};

// Export AppState for debugging
window.AppState = AppState;

