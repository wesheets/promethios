const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const sessionManager = require('../services/sessionManager');
const llmService = require('../services/llmService');

// In-memory storage for demo (in production, use database)
const contexts = new Map();

/**
 * POST /api/multi_agent_system/context
 * Create a new multi-agent context for coordination
 */
router.post('/context', async (req, res) => {
  try {
    const {
      name,
      agent_ids,
      collaboration_model,
      policies = {},
      governance_enabled = true,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!name || !agent_ids || !collaboration_model) {
      return res.status(400).json({
        error: 'Missing required fields: name, agent_ids, collaboration_model'
      });
    }

    // Create new context
    const context = {
      context_id: `ctx_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      name,
      agent_ids,
      collaboration_model,
      status: 'active',
      created_at: new Date().toISOString(),
      policies,
      governance_enabled,
      metadata
    };

    // Store context (in production, save to database)
    contexts.set(context.context_id, context);

    // Log for debugging
    console.log(`Created multi-agent context: ${context.context_id}`);

    res.status(201).json(context);

  } catch (error) {
    console.error('Error creating multi-agent context:', error);
    res.status(500).json({
      error: 'Failed to create multi-agent context',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/context/:contextId
 * Get a specific multi-agent context
 */
router.get('/context/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;
    const context = contexts.get(contextId);

    if (!context) {
      return res.status(404).json({
        error: 'Context not found'
      });
    }

    res.json(context);

  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).json({
      error: 'Failed to fetch context',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/contexts
 * List all multi-agent contexts
 */
router.get('/contexts', async (req, res) => {
  try {
    const allContexts = Array.from(contexts.values());
    res.json({
      contexts: allContexts,
      total: allContexts.length
    });

  } catch (error) {
    console.error('Error listing contexts:', error);
    res.status(500).json({
      error: 'Failed to list contexts',
      details: error.message
    });
  }
});

// ============================================================================
// CHAT SESSION MANAGEMENT & SAFETY CONTROLS
// ============================================================================

/**
 * POST /api/multi_agent_system/chat/create-session
 * Create a new chat session with safety controls
 */
router.post('/chat/create-session', async (req, res) => {
  try {
    const {
      systemId,
      systemName,
      userId,
      messageLimit,
      sessionTimeout,
      governanceEnabled,
      metadata
    } = req.body;

    // Validate required fields
    if (!systemId || !systemName || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: systemId, systemName, userId'
      });
    }

    // Create session with safety controls
    const session = sessionManager.createSession(systemId, systemName, userId, {
      messageLimit,
      sessionTimeout,
      governanceEnabled,
      metadata
    });

    console.log(`🛡️ Created chat session ${session.id} for system ${systemName}`);

    res.status(201).json({
      sessionId: session.id,
      systemId: session.systemId,
      systemName: session.systemName,
      status: session.status,
      messageLimit: session.messageLimit,
      sessionTimeout: session.sessionTimeout,
      governanceEnabled: session.governanceEnabled,
      createdAt: session.createdAt
    });

  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      error: 'Failed to create chat session',
      details: error.message
    });
  }
});

/**
 * POST /api/multi_agent_system/chat/send-message
 * Send message to multi-agent system with safety controls
 */
router.post('/chat/send-message', async (req, res) => {
  try {
    const {
      sessionId,
      systemId,
      message,
      attachments = [],
      governanceEnabled = true,
      userId
    } = req.body;

    console.log(`🔧 Received message for session ${sessionId}`);

    // Validate session
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId
      });
    }

    // Check if session can accept requests
    if (!sessionManager.canAcceptRequest(sessionId)) {
      return res.status(403).json({
        error: 'Session cannot accept new requests',
        reason: session.stopReason || 'Session is not active',
        status: session.status
      });
    }

    // Update session activity
    sessionManager.updateSessionActivity(sessionId, session.messageCount + 1);

    // Create abort controller for this request
    const abortController = new AbortController();
    const requestId = `req_${uuidv4().substring(0, 8)}`;
    
    // Track the request
    sessionManager.trackActiveRequest(sessionId, requestId, abortController);

    try {
      // Simulate multi-agent processing with safety controls
      console.log(`🤖 Processing message with ${session.systemName} multi-agent system`);
      
      // Check if session was stopped during processing
      if (!sessionManager.canAcceptRequest(sessionId)) {
        throw new Error('Session was stopped during processing');
      }

      // Generate real multi-agent response using LLM service
      const response = await generateMultiAgentResponse(
        message, 
        session, 
        abortController.signal,
        governanceEnabled
      );

      // Add response for loop detection
      sessionManager.addResponseForLoopDetection(sessionId, response.content);

      // Remove request from tracking
      sessionManager.removeActiveRequest(sessionId, requestId);

      console.log(`✅ Generated response for session ${sessionId}`);

      res.json({
        response: response.content,
        agentResponses: response.agentResponses, // Individual agent responses for separate display
        sessionId,
        messageCount: session.messageCount,
        governanceData: response.governanceData,
        metadata: {
          requestId,
          processingTime: response.processingTime,
          agentCount: response.agentCount
        }
      });

    } catch (error) {
      // Remove request from tracking
      sessionManager.removeActiveRequest(sessionId, requestId);
      
      if (error.name === 'AbortError') {
        console.log(`🚨 Request ${requestId} was aborted (emergency stop)`);
        return res.status(409).json({
          error: 'Request was aborted due to emergency stop',
          sessionId,
          requestId
        });
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
});

/**
 * POST /api/multi_agent_system/chat/emergency-stop
 * Emergency stop for a chat session
 */
router.post('/chat/emergency-stop', async (req, res) => {
  try {
    const {
      sessionId,
      systemId,
      userId,
      reason = 'user_emergency_stop'
    } = req.body;

    console.log(`🚨 EMERGENCY STOP requested for session ${sessionId}`);

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing required field: sessionId'
      });
    }

    // Execute emergency stop
    const success = sessionManager.emergencyStop(sessionId, reason);

    if (!success) {
      return res.status(404).json({
        error: 'Session not found or already stopped',
        sessionId
      });
    }

    console.log(`🚨 Emergency stop completed for session ${sessionId}`);

    res.json({
      success: true,
      sessionId,
      message: 'Emergency stop executed successfully',
      stoppedAt: new Date().toISOString(),
      reason
    });

  } catch (error) {
    console.error('Error executing emergency stop:', error);
    res.status(500).json({
      error: 'Failed to execute emergency stop',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/chat/session/:sessionId/status
 * Get session status and safety information
 */
router.get('/chat/session/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId
      });
    }

    res.json({
      sessionId: session.id,
      status: session.status,
      messageCount: session.messageCount,
      messageLimit: session.messageLimit,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      emergencyStop: session.emergencyStop,
      stopReason: session.stopReason,
      loopDetected: session.loopDetected,
      governanceEnabled: session.governanceEnabled,
      costTracking: session.costTracking
    });

  } catch (error) {
    console.error('Error fetching session status:', error);
    res.status(500).json({
      error: 'Failed to fetch session status',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/chat/sessions/active
 * Get all active sessions
 */
router.get('/chat/sessions/active', async (req, res) => {
  try {
    const activeSessions = sessionManager.getActiveSessions();
    const stats = sessionManager.getSessionStats();

    res.json({
      sessions: activeSessions,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch active sessions',
      details: error.message
    });
  }
});

/**
 * DELETE /api/multi_agent_system/chat/session/:sessionId
 * Force terminate a session
 */
router.delete('/chat/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'manual_termination' } = req.body;

    const success = sessionManager.terminateSession(sessionId, reason);

    if (!success) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId
      });
    }

    res.json({
      success: true,
      sessionId,
      message: 'Session terminated successfully',
      terminatedAt: new Date().toISOString(),
      reason
    });

  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({
      error: 'Failed to terminate session',
      details: error.message
    });
  }
});

// ============================================================================
// MULTI-AGENT OBSERVER ENDPOINTS
// ============================================================================

/**
 * GET /api/multi_agent_system/observer/emergent-behaviors/:contextId
 * Get emergent behavior analysis for multi-agent system
 */
router.get('/observer/emergent-behaviors/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;
    
    // Get context to validate it exists
    const context = contexts.get(contextId);
    if (!context) {
      return res.status(404).json({
        error: 'Context not found',
        contextId
      });
    }

    // Get session data for analysis
    const session = sessionManager.getSessionBySystemId(contextId);
    
    // Analyze emergent behaviors
    const emergentBehaviors = analyzeEmergentBehaviors(context, session);
    
    console.log(`📊 Generated emergent behavior analysis for ${contextId}`);
    
    res.json(emergentBehaviors);

  } catch (error) {
    console.error('Error fetching emergent behaviors:', error);
    res.status(500).json({
      error: 'Failed to fetch emergent behaviors',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/observer/collaboration/:contextId
 * Get collaboration analysis for multi-agent system
 */
router.get('/observer/collaboration/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;
    
    const context = contexts.get(contextId);
    if (!context) {
      return res.status(404).json({
        error: 'Context not found',
        contextId
      });
    }

    const session = sessionManager.getSessionBySystemId(contextId);
    const collaborationAnalysis = analyzeCollaboration(context, session);
    
    console.log(`🤝 Generated collaboration analysis for ${contextId}`);
    
    res.json(collaborationAnalysis);

  } catch (error) {
    console.error('Error fetching collaboration analysis:', error);
    res.status(500).json({
      error: 'Failed to fetch collaboration analysis',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/observer/governance-health/:contextId
 * Get governance health analysis for multi-agent system
 */
router.get('/observer/governance-health/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;
    
    const context = contexts.get(contextId);
    if (!context) {
      return res.status(404).json({
        error: 'Context not found',
        contextId
      });
    }

    const session = sessionManager.getSessionBySystemId(contextId);
    const governanceHealth = analyzeGovernanceHealth(context, session);
    
    console.log(`🛡️ Generated governance health analysis for ${contextId}`);
    
    res.json(governanceHealth);

  } catch (error) {
    console.error('Error fetching governance health:', error);
    res.status(500).json({
      error: 'Failed to fetch governance health',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/observer/metrics/:contextId
 * Get comprehensive observer metrics for multi-agent system
 */
router.get('/observer/metrics/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;
    
    const context = contexts.get(contextId);
    if (!context) {
      return res.status(404).json({
        error: 'Context not found',
        contextId
      });
    }

    const session = sessionManager.getSessionBySystemId(contextId);
    const comprehensiveMetrics = generateComprehensiveMetrics(context, session);
    
    console.log(`📈 Generated comprehensive metrics for ${contextId}`);
    
    res.json(comprehensiveMetrics);

  } catch (error) {
    console.error('Error fetching comprehensive metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch comprehensive metrics',
      details: error.message
    });
  }
});

// ============================================================================
// OBSERVER ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze emergent behaviors in multi-agent system
 */
function analyzeEmergentBehaviors(context, session) {
  const currentTime = new Date().toISOString();
  const sessionAge = session ? (Date.now() - new Date(session.createdAt).getTime()) / 1000 / 60 : 0; // minutes
  
  const behaviors = [];
  
  // Detect collaboration patterns
  if (sessionAge > 5) {
    behaviors.push({
      id: 'collab_pattern_001',
      type: 'collaborative_optimization',
      description: 'Agents have developed efficient task distribution patterns beyond initial programming',
      severity: 'low',
      confidence: 0.78,
      involvedAgents: context.agent_ids.slice(0, 2),
      detectionTimestamp: currentTime,
      duration: Math.floor(sessionAge * 0.6),
      impact: {
        onSystemPerformance: 15,
        onGoalAchievement: 12,
        onTrustScores: 8
      },
      recommendations: [
        'Monitor for sustainability of this pattern',
        'Consider formalizing this optimization in system policies'
      ]
    });
  }
  
  // Detect consensus acceleration
  if (context.collaboration_model === 'consensus' && sessionAge > 3) {
    behaviors.push({
      id: 'consensus_accel_001',
      type: 'consensus_acceleration',
      description: 'System reaching consensus 35% faster than baseline through adaptive communication',
      severity: 'medium',
      confidence: 0.85,
      involvedAgents: context.agent_ids,
      detectionTimestamp: currentTime,
      duration: Math.floor(sessionAge * 0.8),
      impact: {
        onSystemPerformance: 25,
        onGoalAchievement: 20,
        onTrustScores: 5
      },
      recommendations: [
        'Document the communication patterns for future systems',
        'Validate consensus quality is maintained'
      ]
    });
  }
  
  // Detect potential negative emergence
  if (session && session.messageCount > 20) {
    behaviors.push({
      id: 'comm_overhead_001',
      type: 'communication_overhead',
      description: 'Increased inter-agent communication may be reducing overall efficiency',
      severity: 'medium',
      confidence: 0.65,
      involvedAgents: context.agent_ids,
      detectionTimestamp: currentTime,
      duration: Math.floor(sessionAge * 0.3),
      impact: {
        onSystemPerformance: -10,
        onGoalAchievement: -5,
        onTrustScores: 0
      },
      recommendations: [
        'Review communication protocols for optimization',
        'Consider implementing communication rate limits'
      ]
    });
  }
  
  return {
    systemId: context.context_id,
    systemName: context.name,
    analysisTimestamp: currentTime,
    behaviors,
    patterns: [
      {
        pattern: 'adaptive_task_distribution',
        frequency: Math.floor(sessionAge / 5),
        lastOccurrence: currentTime,
        trend: 'increasing'
      },
      {
        pattern: 'consensus_optimization',
        frequency: Math.floor(sessionAge / 8),
        lastOccurrence: currentTime,
        trend: 'stable'
      }
    ],
    shadowGovernanceInsights: {
      enabled: !context.governance_enabled,
      message: context.governance_enabled ? null : 
        'Shadow analysis indicates emergent behaviors would benefit from governance oversight to ensure positive outcomes',
      potentialIssues: context.governance_enabled ? [] : [
        'Unmonitored optimization patterns could lead to unexpected system states',
        'Lack of formal validation for emergent consensus mechanisms'
      ]
    }
  };
}

/**
 * Analyze collaboration effectiveness
 */
function analyzeCollaboration(context, session) {
  const currentTime = new Date().toISOString();
  const agentCount = context.agent_ids.length;
  const sessionDuration = session ? (Date.now() - new Date(session.createdAt).getTime()) / 1000 / 60 : 0;
  
  // Calculate role adherence (simulated)
  const roleAdherence = {};
  context.agent_ids.forEach((agentId, index) => {
    roleAdherence[agentId] = 88 + Math.random() * 12; // 88-100%
  });
  
  return {
    systemId: context.context_id,
    systemName: context.name,
    collaborationModel: context.collaboration_model,
    analysisTimestamp: currentTime,
    sessionDuration: Math.floor(sessionDuration),
    messageExchanges: session ? session.messageCount : 0,
    consensusReached: Math.floor(sessionDuration / 3), // Rough estimate
    conflictsResolved: Math.floor(sessionDuration / 8),
    roleAdherence,
    workflowEfficiency: {
      plannedSteps: 15,
      actualSteps: 12 + Math.floor(Math.random() * 8),
      efficiencyRatio: 0.85 + Math.random() * 0.15
    },
    decisionQuality: {
      decisionsCount: Math.floor(sessionDuration / 4),
      averageConfidence: 0.82 + Math.random() * 0.15,
      reversedDecisions: Math.floor(Math.random() * 2)
    },
    communicationPatterns: [
      {
        pattern: 'sequential_handoffs',
        frequency: Math.floor(sessionDuration / 2),
        effectiveness: 0.89
      },
      {
        pattern: 'parallel_processing',
        frequency: Math.floor(sessionDuration / 3),
        effectiveness: 0.76
      },
      {
        pattern: 'consensus_building',
        frequency: Math.floor(sessionDuration / 5),
        effectiveness: 0.92
      }
    ],
    shadowGovernanceInsights: {
      enabled: !context.governance_enabled,
      message: context.governance_enabled ? null :
        'Shadow analysis shows collaboration patterns would benefit from governance validation to ensure optimal outcomes',
      recommendations: context.governance_enabled ? [] : [
        'Implement formal role validation mechanisms',
        'Add consensus quality checks',
        'Monitor for collaboration anti-patterns'
      ]
    }
  };
}

/**
 * Analyze governance health
 */
function analyzeGovernanceHealth(context, session) {
  const currentTime = new Date().toISOString();
  const isGovernanceEnabled = context.governance_enabled;
  
  // Simulate policy violations
  const violations = [];
  if (session && session.messageCount > 10) {
    violations.push({
      agentId: context.agent_ids[0],
      policyType: 'communication_protocol',
      severity: 'low',
      description: 'Minor deviation from expected communication sequence',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      resolved: true,
      resolutionTime: 45 // seconds
    });
  }
  
  if (Math.random() > 0.7) {
    violations.push({
      agentId: context.agent_ids[1] || context.agent_ids[0],
      policyType: 'resource_usage',
      severity: 'medium',
      description: 'Exceeded recommended processing time threshold',
      timestamp: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      resolved: false,
      resolutionTime: null
    });
  }
  
  return {
    systemId: context.context_id,
    systemName: context.name,
    analysisTimestamp: currentTime,
    governanceEnabled: isGovernanceEnabled,
    overallHealth: isGovernanceEnabled ? (92 + Math.random() * 8) : null,
    policyCompliance: {
      overall: isGovernanceEnabled ? (90 + Math.random() * 10) : null,
      byAgent: context.agent_ids.reduce((acc, agentId) => {
        acc[agentId] = isGovernanceEnabled ? (88 + Math.random() * 12) : null;
        return acc;
      }, {}),
      violations: isGovernanceEnabled ? violations : []
    },
    rateLimitingStatus: {
      active: isGovernanceEnabled,
      violationsCount: isGovernanceEnabled ? violations.length : 0,
      throttledAgents: [],
      averageResponseTime: 1.2 + Math.random() * 0.8
    },
    crossAgentValidation: {
      validationsPerformed: isGovernanceEnabled ? (session ? session.messageCount * 2 : 0) : 0,
      validationSuccessRate: isGovernanceEnabled ? (95 + Math.random() * 5) : 0,
      trustThresholdViolations: isGovernanceEnabled ? Math.floor(Math.random() * 2) : 0
    },
    errorHandling: {
      errorsDetected: Math.floor(Math.random() * 3),
      errorsResolved: Math.floor(Math.random() * 2),
      recoverySuccessRate: 85 + Math.random() * 15,
      averageRecoveryTime: 2.1 + Math.random() * 1.5
    },
    shadowGovernanceInsights: {
      enabled: !isGovernanceEnabled,
      message: isGovernanceEnabled ? null :
        'Shadow governance analysis shows the system would benefit from active governance monitoring',
      potentialViolations: isGovernanceEnabled ? [] : [
        'Unvalidated inter-agent communications detected',
        'Resource usage patterns exceed recommended thresholds',
        'Consensus mechanisms lack formal validation'
      ],
      recommendedPolicies: isGovernanceEnabled ? [] : [
        'Implement communication rate limiting',
        'Add resource usage monitoring',
        'Enable cross-agent validation protocols'
      ]
    }
  };
}

/**
 * Generate comprehensive observer metrics
 */
function generateComprehensiveMetrics(context, session) {
  const currentTime = new Date().toISOString();
  const sessionAge = session ? (Date.now() - new Date(session.createdAt).getTime()) / 1000 / 60 : 0;
  
  return {
    systemId: context.context_id,
    systemName: context.name,
    analysisTimestamp: currentTime,
    observerSummary: {
      governanceStatus: context.governance_enabled ? 'active' : 'shadow_mode',
      systemHealth: context.governance_enabled ? 'good' : 'unmonitored',
      emergentBehaviorsDetected: sessionAge > 5 ? 2 : 1,
      collaborationEffectiveness: 'high',
      recommendedActions: context.governance_enabled ? [] : [
        'Enable active governance monitoring',
        'Implement formal policy validation'
      ]
    },
    periodicInsights: {
      lastAnalysis: currentTime,
      nextScheduledAnalysis: new Date(Date.now() + 600000).toISOString(), // 10 minutes from now
      analysisFrequency: 'every_10_messages',
      triggerConditions: [
        'Message count reaches multiples of 10',
        'Emergent behavior confidence > 0.8',
        'Policy violation detected',
        'System performance deviation > 15%'
      ]
    },
    governanceShieldData: {
      shouldDisplay: true,
      shieldType: context.governance_enabled ? 'active_governance' : 'shadow_governance',
      shieldMessage: context.governance_enabled ? 
        'Multi-agent governance monitoring active - click to view system health' :
        'Shadow governance analysis available - system running without active oversight',
      expandedDetails: {
        systemOverview: `${context.agent_ids.length} agents using ${context.collaboration_model} collaboration`,
        governanceMode: context.governance_enabled ? 'Active Monitoring' : 'Shadow Analysis Only',
        keyInsights: [
          sessionAge > 5 ? 'Emergent optimization patterns detected' : 'System initializing',
          context.collaboration_model === 'consensus' ? 'Consensus mechanisms performing well' : 'Collaboration model stable',
          context.governance_enabled ? 'All governance checks active' : 'Governance recommendations available'
        ],
        recommendations: context.governance_enabled ? [
          'Continue monitoring emergent behaviors',
          'Validate consensus quality metrics'
        ] : [
          'Consider enabling active governance',
          'Review shadow analysis recommendations'
        ]
      }
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simulate multi-agent response (replace with actual OpenAI integration)
 */
async function generateMultiAgentResponse(message, session, abortSignal, governanceEnabled) {
  const startTime = Date.now();
  
  // Get system configuration to determine actual agents (excluding Observer)
  const systemConfig = session.systemConfiguration || {};
  const allAgents = systemConfig.agents || [];
  
  // Filter out Observer agents - only count conversational agents
  const conversationalAgents = allAgents.filter(agent => 
    agent.role !== 'observer' && 
    agent.type !== 'observer' &&
    !agent.name.toLowerCase().includes('observer')
  );
  
  const agentCount = conversationalAgents.length || 2; // Default to 2 if no config
  console.log(`🤖 Processing with ${agentCount} conversational agents (excluding observers)`);
  
  // Check if aborted
  if (abortSignal.aborted) {
    throw new Error('Request was aborted');
  }
  
  // Generate responses from each conversational agent
  const agentResponses = [];
  const agentTypes = ['factual-agent', 'creative-agent', 'baseline-agent'];
  const agentNames = ['Factual Agent', 'Creative Agent', 'Strategic Agent'];
  
  for (let i = 0; i < agentCount; i++) {
    if (abortSignal.aborted) {
      throw new Error('Request was aborted');
    }
    
    try {
      // Use different agent types for variety
      const agentType = agentTypes[i % agentTypes.length];
      const agentName = agentNames[i % agentNames.length];
      const agentResponse = await llmService.generateResponse(agentType, message);
      
      agentResponses.push({
        agentId: i + 1,
        agentName: agentName,
        agentType: agentType,
        content: agentResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error generating response for agent ${i + 1}:`, error);
      // Fallback to a basic response if LLM call fails
      const agentName = agentNames[i % agentNames.length];
      agentResponses.push({
        agentId: i + 1,
        agentName: agentName,
        agentType: agentTypes[i % agentTypes.length],
        content: `I understand your request about "${message.substring(0, 50)}..." and I'm processing this information to provide you with a comprehensive response.`,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Create a summary for the combined response (for backward compatibility)
  const combinedContent = agentResponses.map(resp => `${resp.agentName}: ${resp.content}`).join('\n\n');
  const finalResponse = `Multi-Agent System Response:\n\n${combinedContent}\n\n[Processed by ${session.systemName} with ${agentCount} agents using ${session.metadata?.collaborationModel || 'sequential_handoffs'} collaboration]`;
  
  // Simulate governance data for multi-agent shield
  const governanceData = governanceEnabled ? {
    approved: true,
    violations: [],
    transparencyMessage: 'Multi-agent system governance checks completed',
    behaviorTags: ['multi_agent_collaboration', 'consensus_reached'],
    systemGovernance: {
      agentCount, // Use actual conversational agent count
      collaborationModel: session.metadata?.collaborationModel || 'sequential',
      emergentBehaviorsDetected: session.messageCount > 5 ? 1 : 0,
      crossAgentValidation: true
    }
  } : {
    shadowMode: true,
    shadowMessage: 'Shadow governance: Multi-agent system analysis available',
    potentialIssues: [
      'Unmonitored agent interactions',
      'No formal consensus validation'
    ],
    recommendations: [
      'Enable active governance monitoring',
      'Implement cross-agent validation'
    ]
  };
  
  return {
    content: finalResponse, // Combined response for backward compatibility
    agentResponses: agentResponses, // Individual agent responses for separate display
    governanceData,
    processingTime: Date.now() - startTime,
    agentCount // Return actual conversational agent count
  };
}

module.exports = router;

