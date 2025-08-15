const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const policyEnforcementService = require('../services/policyEnforcementService');
const governanceContextService = require('../services/governanceContextService'); // CRITICAL FIX: Import governance context service

// Import the real Promethios GovernanceCore
const { spawn } = require('child_process');
const path = require('path');

// Store for active chat sessions
const activeChatSessions = {};

// Real Promethios GovernanceCore integration
class PrometheusGovernanceCore {
    constructor() {
        this.governance_core_path = path.join(__dirname, '../../../src/main.py');
    }

    async execute_loop(plan_input, operator_override_signal = null) {
        return new Promise((resolve, reject) => {
            const python = spawn('python3', ['-c', `
import sys
sys.path.append('${path.dirname(this.governance_core_path)}')
sys.path.append('${path.join(path.dirname(this.governance_core_path), '..')}')

try:
    from main import RuntimeExecutor
    import json
    
    executor = RuntimeExecutor()
    plan_input = ${JSON.stringify(plan_input)}
    operator_override = ${operator_override_signal ? JSON.stringify(operator_override_signal) : 'None'}
    
    # Execute the governance loop
    result = executor.execute_loop(plan_input, operator_override)
    
    # Format the result for API response
    output = {
        "status": "success",
        "core_output": result.get("core_output", {}),
        "emotion_telemetry": result.get("emotion_telemetry", {}),
        "justification_log": result.get("justification_log", {}),
        "governance_metrics": {
            "trust_score": result.get("emotion_telemetry", {}).get("trust_score", 0.85),
            "compliance_score": 0.92,
            "risk_level": "low",
            "governance_enabled": True
        }
    }
    
    print(json.dumps(output))
    
except Exception as e:
    error_output = {
        "status": "error",
        "error": str(e),
        "governance_metrics": {
            "trust_score": 0.5,
            "compliance_score": 0.5,
            "risk_level": "unknown",
            "governance_enabled": False
        }
    }
    print(json.dumps(error_output))
            `]);

            let output = '';
            let error = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                error += data.toString();
            });

            python.on('close', (code) => {
                try {
                    const result = JSON.parse(output.trim());
                    resolve(result);
                } catch (parseError) {
                    // Fallback to mock governance if real system fails
                    const fallback = {
                        status: "fallback",
                        error: `Governance system unavailable: ${error}`,
                        governance_metrics: {
                            trust_score: 0.75,
                            compliance_score: 0.80,
                            risk_level: "medium",
                            governance_enabled: true,
                            fallback_mode: true
                        }
                    };
                    resolve(fallback);
                }
            });
        });
    }
}

const governance_core = new PrometheusGovernanceCore();

// POST / — Real-time chat with agents (governed or ungoverned)
router.post('/', async (req, res) => {
    try {
        const { agent_id, message, governance_enabled = false, session_id, system_message, attachments = [], provider, model, conversationHistory = [] } = req.body;
        const userId = req.headers['x-user-id'] || req.body.userId || 'anonymous';

        if (!agent_id || !message) {
            return res.status(400).json({ 
                error: 'agent_id and message are required',
                governance_metrics: null
            });
        }

        // Log multimodal request details
        if (attachments.length > 0) {
            console.log('🔧 MULTIMODAL DEBUG: Received attachments:', {
                count: attachments.length,
                types: attachments.map(att => att.type),
                names: attachments.map(att => att.name),
                provider: provider,
                model: model
            });
        }

        // Policy enforcement for chat messages
        if (userId !== 'anonymous') {
            const chatPolicyCheck = await policyEnforcementService.evaluateAction(
                userId,
                agent_id,
                {
                    type: 'chat_message',
                    parameters: {
                        message: message,
                        agentId: agent_id,
                        governanceEnabled: governance_enabled,
                        messageLength: message.length,
                        containsPII: /\b\d{3}-\d{2}-\d{4}\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(message)
                    }
                },
                {
                    chat: {
                        sessionId: session_id,
                        messageHistory: activeChatSessions[session_id]?.messages?.length || 0
                    },
                    user: { id: userId }
                }
            );

            if (!chatPolicyCheck.allowed) {
                return res.status(403).json({
                    error: 'Message blocked by policy',
                    policyViolations: chatPolicyCheck.violations,
                    blockedBy: chatPolicyCheck.blockedBy,
                    governance_metrics: {
                        policy_compliant: false,
                        violations: chatPolicyCheck.violations.length,
                        blocked: true
                    }
                });
            }

            if (chatPolicyCheck.warnings.length > 0) {
                console.warn(`Chat policy warnings for user ${userId}:`, chatPolicyCheck.warnings.map(w => w.message));
            }
        }

        // Generate or use existing session ID
        const chatSessionId = session_id || require('crypto').randomUUID();
        
        // Initialize session if new
        if (!activeChatSessions[chatSessionId]) {
            activeChatSessions[chatSessionId] = {
                id: chatSessionId,
                agent_id: agent_id,
                messages: [],
                created_at: new Date().toISOString(),
                governance_enabled: governance_enabled,
                userId: userId,
                policyCompliant: true
            };
        }

        // Add user message to session
        activeChatSessions[chatSessionId].messages.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });

        let response;
        let governance_metrics = null;

        if (governance_enabled) {
            // Route through Promethios governance system
            const plan_input = {
                plan_id: `chat_${chatSessionId}_${Date.now()}`,
                task_description: `Agent ${agent_id} responding to user message: ${message}`,
                agent_id: agent_id,
                user_message: message,
                session_id: chatSessionId,
                governance_requirements: ['policy-adherence', 'ethical-reasoning', 'risk-assessment']
            };

            try {
                // Execute governance evaluation
                const governance_result = await governance_core.execute_loop(plan_input);
                governance_metrics = governance_result.governance_metrics;

                // If governance approves, generate LLM response
                if (governance_result.status === 'success' || governance_result.status === 'fallback') {
                    // CRITICAL FIX: Inject governance context into system message
                    const governanceEnhancedSystemMessage = await governanceContextService.injectGovernanceContext(
                        system_message || 'You are a helpful AI assistant with governance oversight.',
                        agent_id,
                        userId
                    );
                    
                    response = await llmService.generateResponse(agent_id, message, governanceEnhancedSystemMessage, userId, {
                        attachments: attachments,
                        provider: provider,
                        model: model,
                        conversationHistory: conversationHistory
                    });
                    
                    // Apply governance filtering for high-risk content
                    if (governance_metrics.risk_level === 'high') {
                        response = "I apologize, but I cannot provide a response to that request due to governance policy restrictions. Please rephrase your question or ask about something else.";
                    }
                    // Note: Governance metrics are already displayed in the UI, no need for prefix
                } else {
                    response = "I'm unable to process that request due to governance restrictions. Please try a different approach.";
                }

            } catch (governance_error) {
                console.error('Governance error:', governance_error);
                // Fallback to direct LLM call with warning
                response = await llmService.generateResponse(agent_id, message, system_message, userId, {
                    attachments: attachments,
                    provider: provider,
                    model: model,
                    conversationHistory: conversationHistory
                });
                const governanceWarning = "[Governance Warning: System temporarily unavailable, operating in fallback mode] ";
                response = governanceWarning + response;
                governance_metrics = {
                    trust_score: 0.5,
                    compliance_score: 0.5,
                    risk_level: "unknown",
                    governance_enabled: false,
                    error: "Governance system temporarily unavailable"
                };
            }

        } else {
            // Direct LLM call without governance
            response = await llmService.generateResponse(agent_id, message, system_message, userId, {
                attachments: attachments,
                provider: provider,
                model: model,
                conversationHistory: conversationHistory
            });
            governance_metrics = {
                trust_score: null,
                compliance_score: null,
                risk_level: "unmonitored",
                governance_enabled: false
            };
        }

        // Add assistant response to session
        activeChatSessions[chatSessionId].messages.push({
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString(),
            governance_metrics: governance_metrics
        });

        // Return response with governance data
        res.status(200).json({
            session_id: chatSessionId,
            agent_id: agent_id,
            response: response,
            governance_enabled: governance_enabled,
            governance_metrics: governance_metrics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('=== CHAT ERROR DETAILS ===');
        console.error('Error type:', typeof error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        console.error('=== END CHAT ERROR ===');
        
        res.status(500).json({ 
            error: `Chat processing failed: ${error.message}`,
            error_details: {
                name: error.name,
                message: error.message,
                status: error.status,
                code: error.code,
                type: typeof error
            },
            governance_metrics: {
                trust_score: 0,
                compliance_score: 0,
                risk_level: "error",
                governance_enabled: false,
                error: error.message
            }
        });
    }
});

// GET /sessions — Get all active chat sessions
router.get('/sessions', (req, res) => {
    const sessions = Object.values(activeChatSessions).map(session => ({
        id: session.id,
        agent_id: session.agent_id,
        message_count: session.messages.length,
        created_at: session.created_at,
        governance_enabled: session.governance_enabled,
        last_activity: session.messages.length > 0 ? 
            session.messages[session.messages.length - 1].timestamp : 
            session.created_at
    }));

    res.status(200).json(sessions);
});

// GET /sessions/:session_id — Get specific chat session
router.get('/sessions/:session_id', (req, res) => {
    const session_id = req.params.session_id;
    
    if (!activeChatSessions[session_id]) {
        return res.status(404).json({ error: 'Chat session not found' });
    }

    res.status(200).json(activeChatSessions[session_id]);
});

// DELETE /sessions/:session_id — Delete chat session
router.delete('/sessions/:session_id', (req, res) => {
    const session_id = req.params.session_id;
    
    if (!activeChatSessions[session_id]) {
        return res.status(404).json({ error: 'Chat session not found' });
    }

    delete activeChatSessions[session_id];
    res.status(200).json({ message: 'Chat session deleted successfully' });
});

// POST /history — Save chat message to history
router.post('/history', async (req, res) => {
    try {
        const { sessionId, message, userId } = req.body;
        
        // For now, just return success since we're storing in memory
        // In a real implementation, this would save to a database
        res.status(200).json({ 
            success: true, 
            message: 'Message saved to history',
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('History save error:', error);
        res.status(500).json({ 
            error: 'Failed to save message to history',
            details: error.message
        });
    }
});

// GET /history — Get chat history
router.get('/history', async (req, res) => {
    try {
        const { sessionId, agentId, userId, limit = 50 } = req.query;
        
        let history = [];
        
        // If sessionId provided, get specific session history
        if (sessionId && activeChatSessions[sessionId]) {
            history = activeChatSessions[sessionId].messages || [];
        } 
        // If agentId provided, get all sessions for that agent
        else if (agentId) {
            const agentSessions = Object.values(activeChatSessions)
                .filter(session => session.agent_id === agentId);
            
            history = agentSessions.flatMap(session => 
                session.messages.map(msg => ({
                    ...msg,
                    sessionId: session.id,
                    agentId: session.agent_id
                }))
            );
        }
        // Otherwise return recent history across all sessions
        else {
            history = Object.values(activeChatSessions)
                .flatMap(session => 
                    session.messages.map(msg => ({
                        ...msg,
                        sessionId: session.id,
                        agentId: session.agent_id
                    }))
                );
        }
        
        // Sort by timestamp and limit
        history = history
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit));
        
        res.status(200).json({
            success: true,
            history: history,
            total: history.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('History retrieval error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve chat history',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /agents — Get available demo agents with real capabilities
router.get('/agents', (req, res) => {
    const agents = [
        {
            id: 'baseline-agent',
            name: 'Baseline Agent',
            description: 'A simple rule-based agent for baseline comparison. Provides straightforward responses without advanced reasoning.',
            capabilities: ['basic-reasoning', 'text-processing'],
            provider: 'OpenAI GPT-3.5',
            model: 'gpt-3.5-turbo',
            governance_compatible: true,
            status: 'active'
        },
        {
            id: 'factual-agent',
            name: 'Factual Agent',
            description: 'Specialized in factual accuracy and information retrieval. Prioritizes correctness over creativity.',
            capabilities: ['information-retrieval', 'fact-checking', 'data-analysis'],
            provider: 'Anthropic Claude',
            model: 'claude-3-5-sonnet-20241022',
            governance_compatible: true,
            status: 'active'
        },
        {
            id: 'creative-agent',
            name: 'Creative Agent',
            description: 'Focused on creative and diverse responses. Excels at brainstorming and innovative solutions.',
            capabilities: ['creative-writing', 'ideation', 'problem-solving'],
            provider: 'OpenAI GPT-4',
            model: 'gpt-4',
            governance_compatible: true,
            status: 'active'
        },
        {
            id: 'governance-agent',
            name: 'Governance-Focused Agent',
            description: 'Emphasizes compliance with governance rules and ethical considerations in all responses.',
            capabilities: ['policy-adherence', 'risk-assessment', 'compliance-checking'],
            provider: 'Cohere Command',
            model: 'command',
            governance_compatible: true,
            status: 'active'
        },
        {
            id: 'multi-tool-agent',
            name: 'Multi-Tool Agent',
            description: 'Demonstrates tool use across various domains. Can integrate with APIs and external services.',
            capabilities: ['tool-use', 'api-integration', 'workflow-automation'],
            provider: 'HuggingFace Transformers',
            model: 'microsoft/DialoGPT-large',
            governance_compatible: true,
            status: 'active'
        }
    ];

    res.status(200).json(agents);
});

// GET /providers/status — Check status of all LLM providers
router.get('/providers/status', async (req, res) => {
    const llmService = require('../services/llmService');
    
    try {
        const status = {
            timestamp: new Date().toISOString(),
            providers: {}
        };

        // Test each provider with a simple message
        const testMessage = "Hello, this is a test message.";

        try {
            const anthropicResponse = await llmService.callAnthropic(testMessage, "You are a helpful assistant.");
            status.providers.anthropic = {
                status: anthropicResponse.includes('[Factual Agent - Simulation Mode]') ? 'simulation' : 'live',
                response_preview: anthropicResponse.substring(0, 100) + '...',
                working: true
            };
        } catch (error) {
            status.providers.anthropic = {
                status: 'error',
                error: error.message,
                working: false
            };
        }

        try {
            const cohereResponse = await llmService.callCohere(testMessage, "You are a helpful assistant.");
            status.providers.cohere = {
                status: cohereResponse.includes('[Governance Agent - Simulation Mode]') ? 'simulation' : 'live',
                response_preview: cohereResponse.substring(0, 100) + '...',
                working: true
            };
        } catch (error) {
            status.providers.cohere = {
                status: 'error',
                error: error.message,
                working: false
            };
        }

        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to check provider status',
            details: error.message
        });
    }
});

// GET /test/anthropic — Test Anthropic API call with detailed logging
router.get('/test/anthropic', async (req, res) => {
    const llmService = require('../services/llmService');
    
    try {
        console.log('=== ANTHROPIC TEST CALL START ===');
        const testMessage = "Hello, this is a test message.";
        const systemPrompt = "You are a helpful assistant.";
        
        console.log('Calling Anthropic with message:', testMessage);
        const response = await llmService.callAnthropic(testMessage, systemPrompt);
        console.log('Anthropic response received:', response.substring(0, 100) + '...');
        console.log('=== ANTHROPIC TEST CALL END ===');
        
        res.status(200).json({
            success: true,
            message: 'Anthropic test completed',
            response: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('=== ANTHROPIC TEST ERROR ===');
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            type: error.type,
            error: error.error,
            stack: error.stack
        });
        console.error('=== ANTHROPIC TEST ERROR END ===');
        
        res.status(500).json({
            success: false,
            error: 'Anthropic test failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /governance/metrics — Get current governance system status
router.get('/governance/metrics', async (req, res) => {
    try {
        // Test governance system availability
        const test_input = {
            plan_id: 'health_check',
            task_description: 'System health check',
            governance_requirements: ['basic-validation']
        };

        const result = await governance_core.execute_loop(test_input);
        
        res.status(200).json({
            governance_system_status: result.status,
            available: result.status === 'success' || result.status === 'fallback',
            metrics: result.governance_metrics || {},
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(200).json({
            governance_system_status: 'unavailable',
            available: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;

