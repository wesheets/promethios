/**
 * Main Application Entry Point
 * Initializes and coordinates all modules
 */

// Import modules
import AgentConversation from './modules/agentConversation.js';
import APIClient from './modules/apiClient.js';
import EmotionalUX from './modules/emotionalUX.js';
import ScenarioManager from './modules/scenarioManager.js';
import MetricsManager from './modules/metricsManager.js';
import ExportModule from './modules/exportModule.js';
import { applyAllEnhancements } from './modules/enhancedFeatures.js';

// Event Bus for module communication
const EventBus = {
    events: {},
    
    subscribe(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },
    
    publish(event, data) {
        if (!this.events[event]) {
            return;
        }
        this.events[event].forEach(callback => callback(data));
    }
};

// Make EventBus globally available
window.EventBus = EventBus;

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

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Initialize application
function initializeApp() {
    console.log('Initializing application...');
    
    // Initialize modules
    APIClient.init();
    ScenarioManager.init();
    MetricsManager.init();
    AgentConversation.init();
    EmotionalUX.init();
    ExportModule.init();
    
    // Apply all enhanced features
    applyAllEnhancements();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('Application initialized');
}

// Set up event listeners
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

// Handle scenario change
function handleScenarioChange(event) {
    const scenarioId = event.target.value;
    AppState.currentScenario = scenarioId;
    
    // Update scenario description
    updateScenarioDescription(scenarioId);
    
    // Publish event
    EventBus.publish('scenarioChanged', { scenarioId });
}

// Update scenario description
function updateScenarioDescription(scenarioId) {
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

// Handle governance toggle
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

// Update feature toggles availability
function updateFeatureTogglesAvailability() {
    const featureToggles = document.querySelectorAll('.governance-features input');
    featureToggles.forEach(toggle => {
        toggle.disabled = !AppState.governanceEnabled;
    });
}

// Handle feature toggle
function handleFeatureToggle(feature, enabled) {
    AppState.activeFeatures[feature] = enabled;
    
    // Publish event
    EventBus.publish('featureToggled', {
        feature,
        enabled,
        activeFeatures: AppState.activeFeatures
    });
}

// Handle start scenario
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

// Clear conversation
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

// Toggle agent logs
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

// Handle export report
function handleExportReport() {
    ExportModule.exportReport({
        scenarioId: AppState.currentScenario || 'product_planning',
        governanceEnabled: AppState.governanceEnabled,
        activeFeatures: AppState.activeFeatures,
        metrics: MetricsManager.getMetricsData()
    });
}

// Handle test violation
function handleTestViolation() {
    // This will be handled by the dropdown items
}

// Handle violation option
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
    APIClient,
    ScenarioManager,
    MetricsManager,
    AgentConversation,
    EmotionalUX,
    ExportModule
};
