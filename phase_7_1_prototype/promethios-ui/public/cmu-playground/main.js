/**
 * Updated Main Application Entry Point
 * 
 * This is the updated main.js that integrates the new modular architecture
 * while maintaining backward compatibility with the existing UI.
 */

// Import modules
import AgentConversation from './modules/agentConversation.js';
import { featureFlags } from './modules/featureFlags.js';
import { developerPanel } from './modules/developerPanel.js';
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
    
    // Check for development mode
    checkDevelopmentMode();
    
    // Initialize modules
    AgentConversation.init();
    developerPanel.init();
    
    // Apply all enhanced features
    applyAllEnhancements();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('Application initialized');
}

// Check for development mode
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
    
    // Subscribe to agent message events
    EventBus.subscribe('agentMessage', handleAgentMessage);
    
    // Subscribe to conversation complete event
    EventBus.subscribe('conversationComplete', handleConversationComplete);
    
    // Subscribe to conversation error event
    EventBus.subscribe('conversationError', handleConversationError);
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
    // Get scenario data based on ID
    const scenarioData = getScenarioData(scenarioId);
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

// Get scenario data
function getScenarioData(scenarioId) {
    // Hardcoded scenario data
    const scenarios = {
        'product_planning': {
            title: 'Product Planning',
            summary: 'One agent ideates features, the other prioritizes based on risk/ROI. Ungoverned may hallucinate or contradict, governed stays scoped.'
        },
        'customer_service': {
            title: 'Customer Service Escalation',
            summary: 'Support agent handles a delayed refund while policy agent ensures guidelines are followed. Ungoverned may overcompensate, governed balances customer service with policy compliance.'
        },
        'legal_contract': {
            title: 'Legal Contract Review',
            summary: 'One agent drafts contract clauses, the other reviews for compliance and risk. Ungoverned may miss legal issues, governed ensures regulatory compliance.'
        },
        'medical_triage': {
            title: 'Medical Triage',
            summary: 'One agent assesses patient symptoms, the other recommends treatment priorities. Ungoverned may misdiagnose or overprescribe, governed follows clinical guidelines.'
        }
    };
    
    return scenarios[scenarioId];
}

// Handle governance toggle
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

// Handle agent message
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
    
    // Create message content
    messageElement.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="agent-icon" style="background-color: ${agentColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <span>${data.agentId.charAt(0).toUpperCase()}</span>
            </div>
            <span class="agent-name">${getAgentName(data.agentId)}</span>
        </div>
        <div class="message-time">${formatTime(new Date())}</div>
        <div class="message-content">
            ${data.content}
        </div>
    `;
    
    // Add governance information if available
    if (data.isGoverned && data.governanceResult && data.governanceResult.modifications && data.governanceResult.modifications.length > 0) {
        const modificationsElement = document.createElement('div');
        modificationsElement.className = 'governance-modifications';
        modificationsElement.style.marginTop = '8px';
        modificationsElement.style.fontSize = '0.8rem';
        modificationsElement.style.color = '#9c27b0';
        
        modificationsElement.innerHTML = `
            <div><i class="bi bi-shield-check"></i> Governance applied:</div>
            <ul style="margin: 0; padding-left: 20px;">
                ${data.governanceResult.modifications.map(mod => `<li>${mod.description}</li>`).join('')}
            </ul>
        `;
        
        messageElement.appendChild(modificationsElement);
    }
    
    // Add to chat container
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Get agent color based on ID
function getAgentColor(agentId) {
    const colors = {
        'ideaBot': '#ff9800',
        'prioBot': '#2196f3',
        'supportBot': '#4caf50',
        'policyBot': '#9c27b0'
    };
    
    return colors[agentId] || '#555555';
}

// Get agent name based on ID
function getAgentName(agentId) {
    const names = {
        'ideaBot': 'IdeaBot (Feature Ideation)',
        'prioBot': 'PrioBot (Prioritization)',
        'supportBot': 'SupportBot (Customer Support)',
        'policyBot': 'PolicyBot (Policy Supervisor)'
    };
    
    return names[agentId] || agentId;
}

// Format time as MM:SS
function formatTime(date) {
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

// Handle conversation complete
function handleConversationComplete(data) {
    // Reset UI
    const startButton = document.getElementById('startScenarioBtn');
    if (startButton) {
        startButton.textContent = 'Start Scenario';
        startButton.disabled = false;
    }
    
    // Reset running state
    AppState.running = false;
    
    console.log('Conversation complete:', data);
}

// Handle conversation error
function handleConversationError(data) {
    // Reset UI
    const startButton = document.getElementById('startScenarioBtn');
    if (startButton) {
        startButton.textContent = 'Start Scenario';
        startButton.disabled = false;
    }
    
    // Reset running state
    AppState.running = false;
    
    // Show error message
    console.error('Conversation error:', data);
    alert(`Error: ${data.error}\n${data.details || ''}`);
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
    // This would be implemented to export a report
    console.log('Export report requested');
    alert('Report export functionality will be available in a future update.');
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
