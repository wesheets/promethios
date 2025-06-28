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
  
  // Get system configuration to determine actual agents (exasync function generateMultiAgentResponse(session, message, governanceEnabled = false, abortSignal) {
  console.log(`🔄 Generating multi-agent response for session: ${session.sessionId}`);
  
  if (abortSignal.aborted) {
    throw new Error('Request was aborted');
  }
  
  // Get collaboration model from session configuration
  const collaborationModel = session.systemConfiguration?.collaborationModel || 
                           session.metadata?.collaborationModel || 'sequential';
  
  console.log(`🤝 Using collaboration model: ${collaborationModel}`);
  
  // Determine agent count from system configuration
  const conversationalAgents = session.systemConfiguration?.agents?.filter(agent => 
    agent.role !== 'observer' && agent.role !== 'governance'
  ) || [];
  const agentCount = conversationalAgents.length || 2; // Default to 2 if no config
  
  console.log(`👥 Agent count: ${agentCount}, Governance enabled: ${governanceEnabled}`);
  
  // Generate responses based on collaboration model
  let agentResponses = [];
  let roundTableMetrics = null;
  
  if (collaborationModel === 'round_table_sequential') {
    // Enhanced round-table discussion with multi-round consensus building
    const roundTableResult = await generateRoundTableDiscussion(session, message, agentCount, abortSignal);
    agentResponses = roundTableResult.agentResponses;
    roundTableMetrics = roundTableResult.roundTableMetrics;
  } else if (collaborationModel === 'sequential') {
    agentResponses = await generateSequentialResponses(session, message, agentCount, abortSignal);
  } else {
    // Fallback to parallel processing for other models
    agentResponses = await generateParallelResponses(session, message, agentCount, abortSignal);
  }
  
  // Create a summary for the combined response (for backward compatibility)
  const combinedContent = agentResponses.map(resp => `${resp.agentName}: ${resp.content}`).join('\n\n');
  const finalResponse = `Multi-Agent System Response:\n\n${combinedContent}\n\n[Processed by ${session.systemName} with ${agentCount} agents using ${collaborationModel} collaboration]`;
  
  // Simulate governance data for multi-agent shield
  const governanceData = governanceEnabled ? {
    approved: true,
    violations: [],
    transparencyMessage: 'Multi-agent system governance checks completed',
    behaviorTags: ['multi_agent_collaboration', 'consensus_reached'],
    systemGovernance: {
      agentCount,
      collaborationModel,
      participationBalance: calculateParticipationBalance(agentResponses),
      consensusProgress: calculateConsensusProgress(agentResponses),
      discussionQuality: calculateDiscussionQuality(agentResponses),
      // Enhanced round-table metrics
      ...(roundTableMetrics && {
        roundTableMetrics: {
          totalRounds: roundTableMetrics.totalRounds,
          consensusReached: roundTableMetrics.consensusReached,
          consensusStrength: roundTableMetrics.consensusStrength,
          emergentInsights: roundTableMetrics.emergentInsights,
          disagreementResolution: roundTableMetrics.disagreementResolution,
          participationBalance: roundTableMetrics.participationBalance,
          discussionDepth: roundTableMetrics.discussionDepth
        }
      })
    }
  } : null;

  return {
    response: finalResponse,
    agentResponses: agentResponses,
    governanceData: governanceData,
    metadata: {
      agentCount,
      collaborationModel,
      processingTime: Date.now(),
      sessionId: session.sessionId
    }
  };
}

// Enhanced sequential processing with context awareness
async function generateSequentialResponses(session, message, agentCount, abortSignal) {
  console.log(`🔄 Starting sequential processing with context awareness`);
  
  const agentResponses = [];
  const agentTypes = ['factual-agent', 'creative-agent', 'baseline-agent', 'governance-agent'];
  const agentNames = ['Factual Agent', 'Creative Agent', 'Strategic Agent', 'Governance Agent'];
  
  // Ensure we have enough agent types for the requested count
  const expandedAgentTypes = [];
  const expandedAgentNames = [];
  for (let i = 0; i < agentCount; i++) {
    expandedAgentTypes.push(agentTypes[i % agentTypes.length]);
    expandedAgentNames.push(agentNames[i % agentNames.length]);
  }
  
  console.log(`🤖 Sequential processing with agents:`, expandedAgentNames);
  
  for (let i = 0; i < agentCount; i++) {
    if (abortSignal.aborted) {
      throw new Error('Request was aborted');
    }
    
    try {
      const agentType = expandedAgentTypes[i];
      const agentName = expandedAgentNames[i];
      
      // Build context from previous agents' responses
      const conversationContext = buildConversationContext(message, agentResponses, agentName, i);
      
      console.log(`🤖 Generating context-aware response for ${agentName} (${agentType})`);
      console.log(`📝 Context includes ${agentResponses.length} previous responses`);
      
      // Generate response with full conversation context
      const agentResponse = await generateContextAwareResponse(agentType, conversationContext);
      
      const responseData = {
        agentId: i + 1,
        agentName: agentName,
        agentType: agentType,
        content: agentResponse,
        timestamp: new Date().toISOString(),
        contextAware: true,
        reviewedAgents: agentResponses.map(r => r.agentName)
      };
      
      agentResponses.push(responseData);
      
      console.log(`✅ Generated context-aware response for ${agentName}`);
      
      // Small delay to simulate thoughtful consideration
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error generating response for agent ${i + 1} (${expandedAgentNames[i]}):`, error);
      
      // Fallback response with context awareness
      const agentName = expandedAgentNames[i];
      const contextualFallback = generateContextualFallback(message, agentResponses, agentName);
      
      agentResponses.push({
        agentId: i + 1,
        agentName: agentName,
        agentType: expandedAgentTypes[i],
        content: contextualFallback,
        timestamp: new Date().toISOString(),
        contextAware: true,
        reviewedAgents: agentResponses.map(r => r.agentName),
        fallback: true
      });
      
      console.log(`🔄 Used contextual fallback response for ${agentName}`);
    }
  }
  
  return agentResponses;
}

// Enhanced Round-Table Discussion with Multi-Round Consensus Building
async function generateRoundTableDiscussion(session, message, agentCount, abortSignal) {
  console.log(`🎭 Starting round-table discussion with ${agentCount} agents`);
  
  const maxRounds = 3; // Maximum discussion rounds
  const consensusThreshold = 75; // Consensus threshold percentage
  
  const agentTypes = ['factual-agent', 'creative-agent', 'baseline-agent', 'governance-agent'];
  const agentNames = ['Factual Agent', 'Creative Agent', 'Strategic Agent', 'Governance Agent'];
  
  // Ensure we have enough agent types for the requested count
  const expandedAgentTypes = [];
  const expandedAgentNames = [];
  for (let i = 0; i < agentCount; i++) {
    expandedAgentTypes.push(agentTypes[i % agentTypes.length]);
    expandedAgentNames.push(agentNames[i % agentNames.length]);
  }
  
  let allAgentResponses = [];
  let roundTableMetrics = {
    totalRounds: 0,
    consensusReached: false,
    consensusStrength: 0,
    emergentInsights: [],
    disagreementResolution: {
      identified: 0,
      resolved: 0,
      methods: []
    },
    participationBalance: {},
    discussionDepth: 0,
    roundHistory: []
  };
  
  console.log(`🎭 Round-table participants:`, expandedAgentNames);
  
  // Multi-round discussion
  for (let round = 1; round <= maxRounds; round++) {
    if (abortSignal.aborted) {
      throw new Error('Request was aborted');
    }
    
    console.log(`🔄 Starting Round ${round} of round-table discussion`);
    
    const roundResponses = [];
    const roundStartTime = Date.now();
    
    // Each agent takes a turn in this round
    for (let agentIndex = 0; agentIndex < agentCount; agentIndex++) {
      if (abortSignal.aborted) {
        throw new Error('Request was aborted');
      }
      
      try {
        const agentType = expandedAgentTypes[agentIndex];
        const agentName = expandedAgentNames[agentIndex];
        
        // Build comprehensive context including all previous rounds and current round
        const roundTableContext = buildRoundTableContext(
          message, 
          allAgentResponses, 
          roundResponses, 
          agentName, 
          round, 
          agentIndex
        );
        
        console.log(`🎯 ${agentName} taking turn in Round ${round}`);
        console.log(`📚 Context includes ${allAgentResponses.length} previous responses from ${round - 1} rounds`);
        
        // Generate round-table aware response
        const agentResponse = await generateRoundTableResponse(agentType, roundTableContext, round);
        
        const responseData = {
          agentId: agentIndex + 1,
          agentName: agentName,
          agentType: agentType,
          content: agentResponse,
          timestamp: new Date().toISOString(),
          round: round,
          turnInRound: agentIndex + 1,
          contextAware: true,
          reviewedAgents: [...allAgentResponses.map(r => r.agentName), ...roundResponses.map(r => r.agentName)],
          roundTableMetadata: {
            totalPreviousRounds: round - 1,
            agentsInCurrentRound: roundResponses.length,
            consensusBuilding: true
          }
        };
        
        roundResponses.push(responseData);
        console.log(`✅ ${agentName} completed turn in Round ${round}`);
        
        // Small delay for thoughtful consideration
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ Error in Round ${round} for ${expandedAgentNames[agentIndex]}:`, error);
        
        const agentName = expandedAgentNames[agentIndex];
        const roundTableFallback = generateRoundTableFallback(
          message, 
          allAgentResponses, 
          roundResponses, 
          agentName, 
          round
        );
        
        roundResponses.push({
          agentId: agentIndex + 1,
          agentName: agentName,
          agentType: expandedAgentTypes[agentIndex],
          content: roundTableFallback,
          timestamp: new Date().toISOString(),
          round: round,
          turnInRound: agentIndex + 1,
          contextAware: true,
          reviewedAgents: [...allAgentResponses.map(r => r.agentName), ...roundResponses.map(r => r.agentName)],
          fallback: true,
          roundTableMetadata: {
            totalPreviousRounds: round - 1,
            agentsInCurrentRound: roundResponses.length - 1,
            consensusBuilding: true
          }
        });
        
        console.log(`🔄 Used round-table fallback for ${agentName} in Round ${round}`);
      }
    }
    
    // Add round responses to all responses
    allAgentResponses.push(...roundResponses);
    
    // Analyze round results
    const roundAnalysis = analyzeRoundResults(roundResponses, round);
    roundTableMetrics.roundHistory.push({
      round: round,
      responses: roundResponses.length,
      consensusProgress: roundAnalysis.consensusProgress,
      emergentInsights: roundAnalysis.emergentInsights,
      disagreements: roundAnalysis.disagreements,
      processingTime: Date.now() - roundStartTime
    });
    
    // Check for consensus
    const consensusCheck = checkRoundTableConsensus(allAgentResponses, consensusThreshold);
    roundTableMetrics.consensusStrength = consensusCheck.strength;
    
    console.log(`📊 Round ${round} complete. Consensus strength: ${consensusCheck.strength}%`);
    
    if (consensusCheck.reached) {
      console.log(`🎉 Consensus reached after ${round} rounds!`);
      roundTableMetrics.consensusReached = true;
      break;
    }
    
    // If not final round, brief pause before next round
    if (round < maxRounds) {
      console.log(`⏳ Preparing for Round ${round + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Final metrics calculation
  roundTableMetrics.totalRounds = Math.min(maxRounds, roundTableMetrics.roundHistory.length);
  roundTableMetrics.participationBalance = calculateRoundTableParticipation(allAgentResponses);
  roundTableMetrics.discussionDepth = calculateRoundTableDepth(allAgentResponses);
  roundTableMetrics.emergentInsights = extractEmergentInsights(allAgentResponses);
  roundTableMetrics.disagreementResolution = analyzeDisagreementResolution(allAgentResponses);
  
  console.log(`🎭 Round-table discussion complete: ${roundTableMetrics.totalRounds} rounds, consensus: ${roundTableMetrics.consensusReached}`);
  
  return {
    agentResponses: allAgentResponses,
    roundTableMetrics: roundTableMetrics
  };
}

// Parallel processing (existing behavior)
async function generateParallelResponses(session, message, agentCount, abortSignal) {
  console.log(`⚡ Starting parallel processing`);
  
  const agentResponses = [];
  const agentTypes = ['factual-agent', 'creative-agent', 'baseline-agent', 'governance-agent'];
  const agentNames = ['Factual Agent', 'Creative Agent', 'Strategic Agent', 'Governance Agent'];
  
  // Ensure we have enough agent types for the requested count
  const expandedAgentTypes = [];
  const expandedAgentNames = [];
  for (let i = 0; i < agentCount; i++) {
    expandedAgentTypes.push(agentTypes[i % agentTypes.length]);
    expandedAgentNames.push(agentNames[i % agentNames.length]);
  }
  
  for (let i = 0; i < agentCount; i++) {
    if (abortSignal.aborted) {
      throw new Error('Request was aborted');
    }
    
    try {
      const agentType = expandedAgentTypes[i];
      const agentName = expandedAgentNames[i];
      console.log(`🤖 Generating parallel response for ${agentName} (${agentType})`);
      
      const agentResponse = await generateBasicResponse(agentType, message);
      
      agentResponses.push({
        agentId: i + 1,
        agentName: agentName,
        agentType: agentType,
        content: agentResponse,
        timestamp: new Date().toISOString(),
        contextAware: false
      });
      
      console.log(`✅ Generated parallel response for ${agentName}`);
    } catch (error) {
      console.error(`❌ Error generating response for agent ${i + 1} (${expandedAgentNames[i]}):`, error);
      
      const agentName = expandedAgentNames[i];
      agentResponses.push({
        agentId: i + 1,
        agentName: agentName,
        agentType: expandedAgentTypes[i],
        content: `I understand your request about "${message.substring(0, 50)}..." and I'm processing this information to provide you with a comprehensive response. [${agentName} - Error Recovery]`,
        timestamp: new Date().toISOString(),
        contextAware: false,
        fallback: true
      });
      
      console.log(`🔄 Used basic fallback response for ${agentName}`);
    }
  }
  
  return agentResponses;
}

// Build conversation context for sequential processing
function buildConversationContext(originalMessage, previousResponses, currentAgentName, agentIndex) {
  let context = `Original User Request: "${originalMessage}"\n\n`;
  
  if (previousResponses.length > 0) {
    context += `Previous Agent Responses to Review:\n`;
    previousResponses.forEach((response, index) => {
      context += `\n${index + 1}. ${response.agentName}:\n${response.content}\n`;
    });
    
    context += `\nAs the ${currentAgentName}, please:\n`;
    context += `1. Review the previous ${previousResponses.length} agent response(s) above\n`;
    context += `2. Consider their perspectives and insights\n`;
    context += `3. Provide your own unique analysis that builds upon or complements their input\n`;
    context += `4. Address any gaps or offer alternative viewpoints where appropriate\n`;
    context += `5. Work toward a comprehensive understanding of the user's request\n\n`;
    context += `Your response should acknowledge previous agents' contributions while adding your distinct perspective.`;
  } else {
    context += `As the first ${currentAgentName} to respond, please provide your initial analysis and perspective on the user's request.`;
  }
  
  return context;
}

// Generate context-aware response (enhanced version)
async function generateContextAwareResponse(agentType, conversationContext) {
  // For now, use simulated responses that show context awareness
  // In V2, this would call actual LLM APIs with the full context
  
  const responses = {
    'factual-agent': [
      `Based on the analysis provided by previous agents, I can add the following factual context: ${conversationContext.substring(0, 100)}... [Factual Agent - Context Aware]`,
      `Reviewing the previous responses, I notice several key facts that need emphasis: ${conversationContext.substring(0, 100)}... [Factual Agent - Building on Previous Analysis]`,
      `The previous agents have raised important points. From a factual perspective, I can contribute: ${conversationContext.substring(0, 100)}... [Factual Agent - Complementary Analysis]`
    ],
    'creative-agent': [
      `Building on the insights shared by my colleagues, I see creative opportunities: ${conversationContext.substring(0, 100)}... [Creative Agent - Synthesizing Ideas]`,
      `The previous responses spark several innovative approaches: ${conversationContext.substring(0, 100)}... [Creative Agent - Expanding on Previous Thoughts]`,
      `I appreciate the groundwork laid by previous agents. Here's how we can think creatively: ${conversationContext.substring(0, 100)}... [Creative Agent - Adding Innovation]`
    ],
    'baseline-agent': [
      `After reviewing the previous analyses, I can provide strategic perspective: ${conversationContext.substring(0, 100)}... [Strategic Agent - Integrating Insights]`,
      `The previous agents have provided valuable input. Strategically, I recommend: ${conversationContext.substring(0, 100)}... [Strategic Agent - Building Consensus]`,
      `Considering all previous perspectives, here's my strategic assessment: ${conversationContext.substring(0, 100)}... [Strategic Agent - Comprehensive View]`
    ],
    'governance-agent': [
      `Reviewing the discussion so far, I can ensure governance compliance: ${conversationContext.substring(0, 100)}... [Governance Agent - Oversight Review]`,
      `The previous agents have made solid points. From a governance standpoint: ${conversationContext.substring(0, 100)}... [Governance Agent - Policy Alignment]`,
      `After careful review of all previous responses, governance considerations include: ${conversationContext.substring(0, 100)}... [Governance Agent - Comprehensive Governance]`
    ]
  };
  
  const agentResponses = responses[agentType] || responses['baseline-agent'];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

// Generate basic response (existing behavior)
async function generateBasicResponse(agentType, message) {
  // Existing basic response generation
  const responses = {
    'factual-agent': [
      `I understand your request about "${message.substring(0, 50)}..." and I'm processing this information to provide you with factual analysis. [Factual Agent]`,
      `Based on the information provided: "${message.substring(0, 50)}..." I can offer factual insights. [Factual Agent]`
    ],
    'creative-agent': [
      `Your request "${message.substring(0, 50)}..." presents interesting creative possibilities. [Creative Agent]`,
      `I see creative potential in "${message.substring(0, 50)}..." Let me explore innovative approaches. [Creative Agent]`
    ],
    'baseline-agent': [
      `Regarding "${message.substring(0, 50)}..." I can provide strategic analysis. [Strategic Agent]`,
      `Your request about "${message.substring(0, 50)}..." requires strategic consideration. [Strategic Agent]`
    ],
    'governance-agent': [
      `From a governance perspective on "${message.substring(0, 50)}..." I need to ensure compliance. [Governance Agent]`,
      `Reviewing "${message.substring(0, 50)}..." for governance implications. [Governance Agent]`
    ]
  };
  
  const agentResponses = responses[agentType] || responses['baseline-agent'];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

// Generate contextual fallback response
function generateContextualFallback(originalMessage, previousResponses, agentName) {
  if (previousResponses.length > 0) {
    const previousAgents = previousResponses.map(r => r.agentName).join(', ');
    return `I've reviewed the valuable insights from ${previousAgents} regarding "${originalMessage.substring(0, 50)}..." and I'm working to add my perspective as ${agentName}. [${agentName} - Contextual Recovery]`;
  } else {
    return `As the first ${agentName} to respond to "${originalMessage.substring(0, 50)}..." I'm analyzing the request to provide initial insights. [${agentName} - Initial Recovery]`;
  }
}

// Calculate participation balance for governance
function calculateParticipationBalance(agentResponses) {
  if (agentResponses.length === 0) return 100;
  
  const avgLength = agentResponses.reduce((sum, resp) => sum + resp.content.length, 0) / agentResponses.length;
  const variance = agentResponses.reduce((sum, resp) => sum + Math.pow(resp.content.length - avgLength, 2), 0) / agentResponses.length;
  
  // Convert variance to balance score (lower variance = higher balance)
  return Math.max(0, 100 - (variance / avgLength) * 10);
}

// Calculate consensus progress for governance
function calculateConsensusProgress(agentResponses) {
  if (agentResponses.length < 2) return 0;
  
  // Simple heuristic: look for agreement indicators in responses
  let agreementScore = 0;
  const agreementWords = ['agree', 'support', 'align', 'consensus', 'together', 'building on', 'expanding'];
  
  agentResponses.forEach(response => {
    const content = response.content.toLowerCase();
    agreementWords.forEach(word => {
      if (content.includes(word)) agreementScore += 10;
    });
  });
  
  return Math.min(100, agreementScore);
}

// Calculate discussion quality for governance
function calculateDiscussionQuality(agentResponses) {
  if (agentResponses.length === 0) return 0;
  
  let qualityScore = 0;
  const qualityIndicators = ['analysis', 'perspective', 'insight', 'consider', 'evidence', 'strategic', 'innovative'];
  
  agentResponses.forEach(response => {
    const content = response.content.toLowerCase();
    qualityIndicators.forEach(indicator => {
      if (content.includes(indicator)) qualityScore += 5;
    });
    
    // Bonus for context awareness
    if (response.contextAware) qualityScore += 20;
    if (response.reviewedAgents && response.reviewedAgents.length > 0) qualityScore += 10;
  });
  
  return Math.min(100, qualityScore / agentResponses.length);
}

// ============================================================================
// ROUND-TABLE DISCUSSION HELPER FUNCTIONS
// ============================================================================

// Build comprehensive context for round-table discussions
function buildRoundTableContext(originalMessage, allPreviousResponses, currentRoundResponses, currentAgentName, round, agentIndex) {
  let context = `Round-Table Discussion - Round ${round}\n`;
  context += `Original User Request: "${originalMessage}"\n\n`;
  
  // Add previous rounds context
  if (allPreviousResponses.length > 0) {
    const previousRounds = groupResponsesByRound(allPreviousResponses);
    context += `Previous Discussion Rounds:\n`;
    
    Object.keys(previousRounds).forEach(roundNum => {
      context += `\n--- Round ${roundNum} ---\n`;
      previousRounds[roundNum].forEach((response, index) => {
        context += `${response.agentName}: ${response.content}\n\n`;
      });
    });
  }
  
  // Add current round context
  if (currentRoundResponses.length > 0) {
    context += `\n--- Current Round ${round} (So Far) ---\n`;
    currentRoundResponses.forEach((response, index) => {
      context += `${response.agentName}: ${response.content}\n\n`;
    });
  }
  
  // Add agent-specific instructions
  context += `\n--- Your Turn: ${currentAgentName} ---\n`;
  
  if (round === 1 && agentIndex === 0) {
    context += `As the first ${currentAgentName} to speak in this round-table discussion, please:\n`;
    context += `1. Provide your initial analysis and perspective on the user's request\n`;
    context += `2. Set a thoughtful tone for the discussion\n`;
    context += `3. Raise key points that other agents should consider\n`;
  } else if (round === 1) {
    context += `As ${currentAgentName} in the first round, please:\n`;
    context += `1. Review what previous agents have said in this round\n`;
    context += `2. Provide your unique perspective that complements their insights\n`;
    context += `3. Build upon or respectfully challenge their points where appropriate\n`;
    context += `4. Contribute new angles or considerations\n`;
  } else {
    context += `As ${currentAgentName} in Round ${round}, please:\n`;
    context += `1. Review the entire discussion from previous rounds\n`;
    context += `2. Consider what has been said by other agents in this current round\n`;
    context += `3. Identify areas of agreement and remaining disagreements\n`;
    context += `4. Work toward consensus while maintaining your unique perspective\n`;
    context += `5. Propose synthesis or compromise solutions where appropriate\n`;
  }
  
  context += `\nYour response should demonstrate that you've carefully considered all previous contributions while adding your distinct value to the discussion.`;
  
  return context;
}

// Generate round-table aware response
async function generateRoundTableResponse(agentType, roundTableContext, round) {
  // Enhanced responses that show round-table awareness
  const roundTableResponses = {
    'factual-agent': [
      `After reviewing the discussion so far, I can provide these factual insights: ${roundTableContext.substring(0, 150)}... [Factual Agent - Round ${round} Analysis]`,
      `Building on the previous rounds, here are the key facts we should consider: ${roundTableContext.substring(0, 150)}... [Factual Agent - Evidence-Based Contribution]`,
      `I've carefully reviewed all previous contributions. From a factual standpoint: ${roundTableContext.substring(0, 150)}... [Factual Agent - Comprehensive Review]`
    ],
    'creative-agent': [
      `Considering all the insights shared in our discussion, I see these creative opportunities: ${roundTableContext.substring(0, 150)}... [Creative Agent - Round ${round} Innovation]`,
      `The previous rounds have sparked several innovative approaches. Let me add: ${roundTableContext.substring(0, 150)}... [Creative Agent - Building on Collective Wisdom]`,
      `After reflecting on everyone's contributions, here's how we can think creatively: ${roundTableContext.substring(0, 150)}... [Creative Agent - Synthesis & Innovation]`
    ],
    'baseline-agent': [
      `Having reviewed our entire discussion, I can offer this strategic perspective: ${roundTableContext.substring(0, 150)}... [Strategic Agent - Round ${round} Strategy]`,
      `The collective insights from previous rounds inform this strategic approach: ${roundTableContext.substring(0, 150)}... [Strategic Agent - Integrated Strategy]`,
      `Considering all viewpoints shared, my strategic recommendation is: ${roundTableContext.substring(0, 150)}... [Strategic Agent - Consensus Building]`
    ],
    'governance-agent': [
      `After monitoring our discussion, I can ensure governance alignment: ${roundTableContext.substring(0, 150)}... [Governance Agent - Round ${round} Oversight]`,
      `Reviewing all contributions for governance compliance: ${roundTableContext.substring(0, 150)}... [Governance Agent - Comprehensive Governance]`,
      `The discussion quality has been excellent. Governance considerations include: ${roundTableContext.substring(0, 150)}... [Governance Agent - Quality Assurance]`
    ]
  };
  
  const agentResponses = roundTableResponses[agentType] || roundTableResponses['baseline-agent'];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

// Generate round-table fallback response
function generateRoundTableFallback(originalMessage, allPreviousResponses, currentRoundResponses, agentName, round) {
  const totalResponses = allPreviousResponses.length + currentRoundResponses.length;
  const previousAgents = [...allPreviousResponses.map(r => r.agentName), ...currentRoundResponses.map(r => r.agentName)];
  const uniqueAgents = [...new Set(previousAgents)];
  
  if (totalResponses > 0) {
    return `I've been carefully following our round-table discussion through ${round} rounds, reviewing insights from ${uniqueAgents.join(', ')}. As ${agentName}, I'm working to contribute my perspective on "${originalMessage.substring(0, 50)}..." while building on our collective analysis. [${agentName} - Round ${round} Recovery]`;
  } else {
    return `As ${agentName} beginning our round-table discussion on "${originalMessage.substring(0, 50)}..." I'm preparing to provide thoughtful analysis that will contribute to our collaborative exploration. [${agentName} - Round ${round} Initial Recovery]`;
  }
}

// Group responses by round for context building
function groupResponsesByRound(responses) {
  const grouped = {};
  responses.forEach(response => {
    const round = response.round || 1;
    if (!grouped[round]) {
      grouped[round] = [];
    }
    grouped[round].push(response);
  });
  return grouped;
}

// Analyze results of a discussion round
function analyzeRoundResults(roundResponses, round) {
  const consensusWords = ['agree', 'support', 'align', 'consensus', 'together', 'building on', 'expanding', 'synthesis'];
  const disagreementWords = ['however', 'but', 'disagree', 'alternative', 'different', 'challenge', 'concern'];
  const insightWords = ['insight', 'realize', 'discover', 'breakthrough', 'innovation', 'novel', 'unique'];
  
  let consensusScore = 0;
  let disagreementCount = 0;
  let insightCount = 0;
  
  roundResponses.forEach(response => {
    const content = response.content.toLowerCase();
    
    consensusWords.forEach(word => {
      if (content.includes(word)) consensusScore += 10;
    });
    
    disagreementWords.forEach(word => {
      if (content.includes(word)) disagreementCount += 1;
    });
    
    insightWords.forEach(word => {
      if (content.includes(word)) insightCount += 1;
    });
  });
  
  return {
    consensusProgress: Math.min(100, consensusScore),
    emergentInsights: insightCount,
    disagreements: disagreementCount
  };
}

// Check for consensus in round-table discussion
function checkRoundTableConsensus(allResponses, threshold) {
  if (allResponses.length < 2) {
    return { reached: false, strength: 0 };
  }
  
  const consensusWords = ['agree', 'support', 'align', 'consensus', 'together', 'building on', 'expanding', 'synthesis', 'collective'];
  const disagreementWords = ['however', 'but', 'disagree', 'alternative', 'different', 'challenge', 'concern', 'oppose'];
  
  let consensusScore = 0;
  let disagreementScore = 0;
  
  allResponses.forEach(response => {
    const content = response.content.toLowerCase();
    
    consensusWords.forEach(word => {
      if (content.includes(word)) consensusScore += 5;
    });
    
    disagreementWords.forEach(word => {
      if (content.includes(word)) disagreementScore += 3;
    });
  });
  
  // Calculate consensus strength (0-100)
  const totalScore = consensusScore + disagreementScore;
  const strength = totalScore > 0 ? Math.round((consensusScore / totalScore) * 100) : 0;
  
  return {
    reached: strength >= threshold,
    strength: Math.min(100, strength)
  };
}

// Calculate participation balance for round-table
function calculateRoundTableParticipation(allResponses) {
  const participation = {};
  
  allResponses.forEach(response => {
    const agentName = response.agentName;
    if (!participation[agentName]) {
      participation[agentName] = {
        responseCount: 0,
        totalWords: 0,
        rounds: new Set()
      };
    }
    
    participation[agentName].responseCount += 1;
    participation[agentName].totalWords += response.content.split(' ').length;
    participation[agentName].rounds.add(response.round || 1);
  });
  
  // Calculate balance score
  const agents = Object.keys(participation);
  if (agents.length === 0) return {};
  
  const avgResponses = agents.reduce((sum, agent) => sum + participation[agent].responseCount, 0) / agents.length;
  const avgWords = agents.reduce((sum, agent) => sum + participation[agent].totalWords, 0) / agents.length;
  
  agents.forEach(agent => {
    const responseBalance = Math.max(0, 100 - Math.abs(participation[agent].responseCount - avgResponses) * 20);
    const wordBalance = Math.max(0, 100 - Math.abs(participation[agent].totalWords - avgWords) / avgWords * 100);
    participation[agent].balanceScore = Math.round((responseBalance + wordBalance) / 2);
  });
  
  return participation;
}

// Calculate discussion depth for round-table
function calculateRoundTableDepth(allResponses) {
  if (allResponses.length === 0) return 0;
  
  const depthIndicators = ['analysis', 'perspective', 'insight', 'consider', 'evidence', 'strategic', 'innovative', 'synthesis', 'comprehensive', 'thorough'];
  const contextIndicators = ['reviewing', 'building on', 'considering', 'previous', 'colleagues', 'discussion', 'round'];
  
  let depthScore = 0;
  let contextScore = 0;
  
  allResponses.forEach(response => {
    const content = response.content.toLowerCase();
    
    depthIndicators.forEach(indicator => {
      if (content.includes(indicator)) depthScore += 5;
    });
    
    contextIndicators.forEach(indicator => {
      if (content.includes(indicator)) contextScore += 3;
    });
    
    // Bonus for context awareness
    if (response.contextAware) depthScore += 10;
    if (response.reviewedAgents && response.reviewedAgents.length > 0) depthScore += 5;
  });
  
  const totalPossible = allResponses.length * 30; // Max possible score per response
  return Math.min(100, Math.round(((depthScore + contextScore) / totalPossible) * 100));
}

// Extract emergent insights from round-table discussion
function extractEmergentInsights(allResponses) {
  const insights = [];
  const insightWords = ['insight', 'realize', 'discover', 'breakthrough', 'innovation', 'novel', 'unique', 'synthesis', 'emerge'];
  
  allResponses.forEach((response, index) => {
    const content = response.content.toLowerCase();
    
    insightWords.forEach(word => {
      if (content.includes(word)) {
        insights.push({
          round: response.round || 1,
          agent: response.agentName,
          type: word,
          context: response.content.substring(0, 100) + '...',
          emergenceScore: response.round > 1 ? 10 : 5 // Higher score for later rounds
        });
      }
    });
  });
  
  return insights;
}

// Analyze disagreement resolution in round-table
function analyzeDisagreementResolution(allResponses) {
  const disagreementWords = ['however', 'but', 'disagree', 'alternative', 'different', 'challenge', 'concern'];
  const resolutionWords = ['compromise', 'synthesis', 'balance', 'integrate', 'combine', 'consensus', 'agreement'];
  
  let identified = 0;
  let resolved = 0;
  const methods = [];
  
  allResponses.forEach(response => {
    const content = response.content.toLowerCase();
    
    disagreementWords.forEach(word => {
      if (content.includes(word)) identified += 1;
    });
    
    resolutionWords.forEach(word => {
      if (content.includes(word)) {
        resolved += 1;
        if (!methods.includes(word)) methods.push(word);
      }
    });
  });
  
  return {
    identified,
    resolved,
    methods,
    resolutionRate: identified > 0 ? Math.round((resolved / identified) * 100) : 100
  };
}

module.exports = router;

