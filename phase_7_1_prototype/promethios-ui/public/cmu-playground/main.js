/**
 * Main Application Entry Point
 * Initializes and coordinates all modules
 */

// Import modules
import AgentConversation from './modules/agentConversation.js';
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
    // Navigation tabs
    const navTabs = document.querySelectorAll('.nav-tabs .nav-link');
    navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active class from all tabs
            navTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            e.target.classList.add('active');
            
            // Handle tab navigation
            const tabName = e.target.textContent.trim().toLowerCase();
            handleTabNavigation(tabName);
        });
    });
    
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
    } else {
        // Find export button by class or other attributes if ID is not found
        const exportBtn = document.querySelector('.export-report-btn') || document.querySelector('[data-action="export-report"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', handleExportReport);
        }
    }
    
    // Test violation button and dropdown
    const testViolationBtn = document.getElementById('testViolationBtn');
    if (testViolationBtn) {
        testViolationBtn.addEventListener('click', handleTestViolation);
        
        // Initialize Bootstrap dropdown
        try {
            new bootstrap.Dropdown(testViolationBtn);
        } catch (error) {
            console.warn('Bootstrap dropdown initialization failed:', error);
            // Fallback for dropdown functionality
            testViolationBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdown = document.querySelector('.dropdown-menu');
                if (dropdown) {
                    dropdown.classList.toggle('show');
                }
            });
        }
    }
    
    // Violation options
    const violationOptions = document.querySelectorAll('[data-violation]');
    violationOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const violation = e.target.getAttribute('data-violation');
            const type = e.target.getAttribute('data-type');
            handleViolationOption(violation, type);
            
            // Hide dropdown after selection
            const dropdown = document.querySelector('.dropdown-menu');
            if (dropdown) {
                dropdown.classList.remove('show');
            }
        });
    });
    
    // Guided walkthrough button
    const guidedWalkthroughBtn = document.getElementById('guidedWalkthroughBtn');
    if (guidedWalkthroughBtn) {
        guidedWalkthroughBtn.addEventListener('click', handleGuidedWalkthrough);
    }
}

// Handle tab navigation
function handleTabNavigation(tabName) {
    console.log(`Navigating to tab: ${tabName}`);
    
    // Implement tab navigation logic
    // For now, we'll just log the action since this is a demo
    EventBus.publish('tabChanged', { tabName });
    
    // In a real implementation, this would show/hide different content sections
    // or navigate to different pages
}

// Handle guided walkthrough
function handleGuidedWalkthrough() {
    console.log('Starting guided walkthrough');
    
    // Show walkthrough modal
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Guided Walkthrough</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Welcome to the Promethios CMU Benchmark Playground! This guided walkthrough will help you understand how to use this interactive demo.</p>
                    <ol>
                        <li>Select a scenario from the dropdown menu</li>
                        <li>Toggle governance features on/off</li>
                        <li>Click "Start Scenario" to see agents interact</li>
                        <li>Compare the governed vs. ungoverned interactions</li>
                        <li>Try the "Test a Known Issue" button to see how governance handles specific challenges</li>
                    </ol>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary">Start Tutorial</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    document.body.appendChild(backdrop);
    
    // Handle close button
    const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.remove();
            backdrop.remove();
            document.body.classList.remove('modal-open');
        });
    });
    
    // Publish event
    EventBus.publish('guidedWalkthroughStarted', {});
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
    
    // Simulate scenario completion
    setTimeout(() => {
        // Reset UI
        if (startButton) {
            startButton.textContent = 'Start Scenario';
            startButton.disabled = false;
        }
        
        // Set running state
        AppState.running = false;
        
        // Publish event
        EventBus.publish('scenarioCompleted', {
            scenarioId: AppState.currentScenario || 'product_planning',
            governanceEnabled: AppState.governanceEnabled,
            activeFeatures: AppState.activeFeatures
        });
    }, 5000);
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
    ScenarioManager,
    MetricsManager,
    AgentConversation,
    EmotionalUX,
    ExportModule
};
