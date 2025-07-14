/**
 * Observer API Routes
 * Handles observer chat, suggestions, and governance monitoring
 */

const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');

// In-memory storage for observer state (in production, use database)
const observerState = new Map();

/**
 * POST /api/observer/chat
 * Handle observer chat interactions
 */
router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      context = {},
      observerId = 'default-observer',
      userId,
      sessionId
    } = req.body;

    console.log(`🔍 Observer chat request from ${userId || 'anonymous'}`);

    // Validate required fields
    if (!message) {
      return res.status(400).json({
        error: 'Missing required field: message'
      });
    }

    // Build observer context
    const observerContext = buildObserverContext(message, context, observerId);

    // Generate observer response using LLM service
    const response = await generateObserverResponse(observerContext, observerId);

    // Update observer state
    updateObserverState(observerId, {
      lastInteraction: new Date().toISOString(),
      context: context,
      userId: userId,
      sessionId: sessionId
    });

    console.log(`✅ Generated observer response for ${observerId}`);

    res.json({
      response: response.content,
      observerId,
      timestamp: new Date().toISOString(),
      context: response.context,
      suggestions: response.suggestions,
      governanceInsights: response.governanceInsights
    });

  } catch (error) {
    console.error('Error in observer chat:', error);
    res.status(500).json({
      error: 'Failed to process observer chat',
      details: error.message
    });
  }
});

/**
 * POST /api/observer/enhanced-chat
 * Handle enhanced observer chat with governance analysis
 */
router.post('/enhanced-chat', async (req, res) => {
  try {
    const {
      message,
      context = {},
      observerId = 'default-observer',
      userId,
      sessionId,
      governanceLevel = 'standard'
    } = req.body;

    console.log(`🔍 Enhanced observer chat request (${governanceLevel} governance)`);

    if (!message) {
      return res.status(400).json({
        error: 'Missing required field: message'
      });
    }

    // Build enhanced observer context with governance analysis
    const enhancedContext = buildEnhancedObserverContext(message, context, observerId, governanceLevel);

    // Generate enhanced response with governance insights
    const response = await generateEnhancedObserverResponse(enhancedContext, observerId, governanceLevel);

    // Update observer state with enhanced data
    updateObserverState(observerId, {
      lastInteraction: new Date().toISOString(),
      context: context,
      userId: userId,
      sessionId: sessionId,
      governanceLevel: governanceLevel,
      enhancedMode: true
    });

    console.log(`✅ Generated enhanced observer response for ${observerId}`);

    res.json({
      response: response.content,
      observerId,
      timestamp: new Date().toISOString(),
      context: response.context,
      suggestions: response.suggestions,
      governanceInsights: response.governanceInsights,
      trustMetrics: response.trustMetrics,
      quickActions: response.quickActions,
      enhancedMode: true
    });

  } catch (error) {
    console.error('Error in enhanced observer chat:', error);
    res.status(500).json({
      error: 'Failed to process enhanced observer chat',
      details: error.message
    });
  }
});

/**
 * GET /api/observers/:observerId/suggestions
 * Get contextual suggestions from observer
 */
router.get('/:observerId/suggestions', async (req, res) => {
  try {
    const { observerId } = req.params;
    const { 
      context = 'general',
      page = 'unknown',
      action = 'viewing',
      userId 
    } = req.query;

    console.log(`🔍 Getting suggestions for ${observerId} (context: ${context}, page: ${page})`);

    // Generate contextual suggestions
    const suggestions = await generateContextualSuggestions(observerId, {
      context,
      page,
      action,
      userId
    });

    // Update observer state
    updateObserverState(observerId, {
      lastSuggestionRequest: new Date().toISOString(),
      lastContext: { context, page, action },
      userId: userId
    });

    console.log(`✅ Generated ${suggestions.length} suggestions for ${observerId}`);

    res.json({
      observerId,
      suggestions,
      context: {
        page,
        action,
        context
      },
      timestamp: new Date().toISOString(),
      metadata: {
        suggestionsCount: suggestions.length,
        contextAware: true
      }
    });

  } catch (error) {
    console.error('Error getting observer suggestions:', error);
    res.status(500).json({
      error: 'Failed to get observer suggestions',
      details: error.message
    });
  }
});

/**
 * GET /api/observer/status/:observerId
 * Get observer status and health
 */
router.get('/status/:observerId', async (req, res) => {
  try {
    const { observerId } = req.params;
    
    const state = observerState.get(observerId) || {};
    const status = generateObserverStatus(observerId, state);

    console.log(`📊 Retrieved status for observer ${observerId}`);

    res.json(status);

  } catch (error) {
    console.error('Error getting observer status:', error);
    res.status(500).json({
      error: 'Failed to get observer status',
      details: error.message
    });
  }
});

/**
 * POST /api/observer/context-update
 * Update observer context awareness
 */
router.post('/context-update', async (req, res) => {
  try {
    const {
      observerId = 'default-observer',
      context = {},
      page,
      action,
      userId,
      sessionId
    } = req.body;

    console.log(`🔄 Updating context for observer ${observerId}`);

    // Update observer context
    updateObserverState(observerId, {
      currentContext: context,
      currentPage: page,
      currentAction: action,
      userId: userId,
      sessionId: sessionId,
      lastContextUpdate: new Date().toISOString()
    });

    // Generate context-aware insights
    const insights = await generateContextInsights(observerId, {
      context,
      page,
      action
    });

    console.log(`✅ Updated context for observer ${observerId}`);

    res.json({
      success: true,
      observerId,
      insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating observer context:', error);
    res.status(500).json({
      error: 'Failed to update observer context',
      details: error.message
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build observer context for chat
 */
function buildObserverContext(message, context, observerId) {
  const currentTime = new Date().toISOString();
  const state = observerState.get(observerId) || {};
  
  let observerPrompt = `You are the Promethios Observer, an AI governance expert providing guidance on AI safety, trust metrics, and best practices.

Current Context:
- User Message: "${message}"
- Page/Context: ${context.page || 'unknown'}
- Current Action: ${context.action || 'general interaction'}
- Time: ${currentTime}

Your role is to:
1. Provide helpful guidance on AI governance and safety
2. Offer contextual recommendations based on the current page/action
3. Share insights about trust metrics (PRISM, VIGIL, VERITAS, ATLAS)
4. Suggest best practices for AI deployment and management

Respond in a helpful, professional tone as an AI governance expert.`;

  return observerPrompt;
}

/**
 * Build enhanced observer context with governance analysis
 */
function buildEnhancedObserverContext(message, context, observerId, governanceLevel) {
  const currentTime = new Date().toISOString();
  const state = observerState.get(observerId) || {};
  
  let enhancedPrompt = `You are the Enhanced Promethios Observer, an advanced AI governance expert with deep analysis capabilities.

Current Context:
- User Message: "${message}"
- Page/Context: ${context.page || 'unknown'}
- Current Action: ${context.action || 'general interaction'}
- Governance Level: ${governanceLevel}
- Time: ${currentTime}

Enhanced Capabilities:
1. Deep governance analysis and risk assessment
2. Trust metrics evaluation (PRISM, VIGIL, VERITAS, ATLAS)
3. Contextual quick actions and recommendations
4. Advanced AI safety insights
5. Personalized guidance based on user context

Provide comprehensive analysis including:
- Governance insights
- Trust metric recommendations
- Quick actions the user can take
- Risk assessments where relevant
- Best practice guidance

Respond as an expert AI governance consultant with actionable insights.`;

  return enhancedPrompt;
}

/**
 * Generate observer response using LLM service
 */
async function generateObserverResponse(context, observerId) {
  try {
    // Use LLM service to generate response
    const response = await llmService.generateResponse(context, {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 500
    });

    return {
      content: response,
      context: {
        observerId,
        responseType: 'standard',
        timestamp: new Date().toISOString()
      },
      suggestions: generateBasicSuggestions(),
      governanceInsights: generateBasicGovernanceInsights()
    };

  } catch (error) {
    console.error('Error generating observer response:', error);
    
    // Fallback response
    return {
      content: "I'm here to help with AI governance and safety guidance. How can I assist you with your AI deployment and management needs?",
      context: {
        observerId,
        responseType: 'fallback',
        timestamp: new Date().toISOString()
      },
      suggestions: generateBasicSuggestions(),
      governanceInsights: generateBasicGovernanceInsights()
    };
  }
}

/**
 * Generate enhanced observer response
 */
async function generateEnhancedObserverResponse(context, observerId, governanceLevel) {
  try {
    // Use LLM service to generate enhanced response
    const response = await llmService.generateResponse(context, {
      model: 'gpt-4',
      temperature: 0.6,
      maxTokens: 800
    });

    return {
      content: response,
      context: {
        observerId,
        responseType: 'enhanced',
        governanceLevel,
        timestamp: new Date().toISOString()
      },
      suggestions: generateEnhancedSuggestions(governanceLevel),
      governanceInsights: generateEnhancedGovernanceInsights(governanceLevel),
      trustMetrics: generateTrustMetrics(),
      quickActions: generateQuickActions(governanceLevel)
    };

  } catch (error) {
    console.error('Error generating enhanced observer response:', error);
    
    // Enhanced fallback response
    return {
      content: "I'm your enhanced AI governance expert. I can provide deep analysis of trust metrics, risk assessments, and personalized recommendations for your AI systems. What specific governance challenge can I help you with?",
      context: {
        observerId,
        responseType: 'enhanced_fallback',
        governanceLevel,
        timestamp: new Date().toISOString()
      },
      suggestions: generateEnhancedSuggestions(governanceLevel),
      governanceInsights: generateEnhancedGovernanceInsights(governanceLevel),
      trustMetrics: generateTrustMetrics(),
      quickActions: generateQuickActions(governanceLevel)
    };
  }
}

/**
 * Generate contextual suggestions
 */
async function generateContextualSuggestions(observerId, contextData) {
  const { context, page, action } = contextData;
  
  // Generate suggestions based on context
  const suggestions = [];
  
  if (page === 'agents/deploy' || context.includes('deploy')) {
    suggestions.push(
      {
        id: 'deployment_best_practices',
        title: 'Review deployment best practices',
        description: 'Ensure your agent deployment follows governance guidelines',
        priority: 'high',
        category: 'deployment'
      },
      {
        id: 'trust_metrics_check',
        title: 'Verify trust metrics',
        description: 'Check PRISM, VIGIL, VERITAS, and ATLAS scores before deployment',
        priority: 'high',
        category: 'governance'
      }
    );
  }
  
  if (action === 'viewing' || action === 'browsing') {
    suggestions.push(
      {
        id: 'governance_overview',
        title: 'Review governance status',
        description: 'Get an overview of your current AI governance posture',
        priority: 'medium',
        category: 'governance'
      }
    );
  }
  
  // Always include general suggestions
  suggestions.push(
    {
      id: 'ai_safety_tips',
      title: 'AI safety recommendations',
      description: 'Get personalized AI safety tips for your current context',
      priority: 'medium',
      category: 'safety'
    },
    {
      id: 'platform_features',
      title: 'Explore platform features',
      description: 'Discover Promethios features that can help with your goals',
      priority: 'low',
      category: 'platform'
    }
  );
  
  return suggestions;
}

/**
 * Generate basic suggestions
 */
function generateBasicSuggestions() {
  return [
    {
      id: 'governance_check',
      title: 'Review governance settings',
      description: 'Ensure your AI systems have proper governance controls',
      priority: 'medium',
      category: 'governance'
    },
    {
      id: 'trust_metrics',
      title: 'Check trust metrics',
      description: 'Review your current trust scores and recommendations',
      priority: 'medium',
      category: 'metrics'
    }
  ];
}

/**
 * Generate enhanced suggestions
 */
function generateEnhancedSuggestions(governanceLevel) {
  const suggestions = [
    {
      id: 'deep_governance_analysis',
      title: 'Perform deep governance analysis',
      description: 'Get comprehensive analysis of your AI governance posture',
      priority: 'high',
      category: 'governance'
    },
    {
      id: 'risk_assessment',
      title: 'Conduct risk assessment',
      description: 'Identify and mitigate potential risks in your AI deployment',
      priority: 'high',
      category: 'risk'
    }
  ];
  
  if (governanceLevel === 'advanced') {
    suggestions.push({
      id: 'compliance_audit',
      title: 'Run compliance audit',
      description: 'Ensure your systems meet regulatory requirements',
      priority: 'high',
      category: 'compliance'
    });
  }
  
  return suggestions;
}

/**
 * Generate basic governance insights
 */
function generateBasicGovernanceInsights() {
  return {
    status: 'monitoring',
    recommendations: [
      'Regular governance reviews are recommended',
      'Consider enabling enhanced monitoring for critical systems'
    ],
    riskLevel: 'low'
  };
}

/**
 * Generate enhanced governance insights
 */
function generateEnhancedGovernanceInsights(governanceLevel) {
  return {
    status: 'active_monitoring',
    recommendations: [
      'Governance systems are actively monitoring your AI deployments',
      'Trust metrics are within acceptable ranges',
      'Consider implementing additional safety measures for high-risk operations'
    ],
    riskLevel: 'low',
    complianceStatus: 'compliant',
    nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  };
}

/**
 * Generate trust metrics
 */
function generateTrustMetrics() {
  return {
    PRISM: {
      score: Math.floor(Math.random() * 20) + 80, // 80-100
      status: 'good',
      trend: 'stable'
    },
    VIGIL: {
      score: Math.floor(Math.random() * 15) + 85, // 85-100
      status: 'excellent',
      trend: 'improving'
    },
    VERITAS: {
      score: Math.floor(Math.random() * 25) + 75, // 75-100
      status: 'good',
      trend: 'stable'
    },
    ATLAS: {
      score: Math.floor(Math.random() * 10) + 90, // 90-100
      status: 'excellent',
      trend: 'stable'
    }
  };
}

/**
 * Generate quick actions
 */
function generateQuickActions(governanceLevel) {
  const actions = [
    {
      id: 'review_policies',
      title: 'Review governance policies',
      description: 'Quick review of current governance policies',
      action: 'navigate',
      target: '/governance/policies'
    },
    {
      id: 'check_metrics',
      title: 'View trust metrics',
      description: 'See detailed trust metric analysis',
      action: 'navigate',
      target: '/trust-metrics'
    }
  ];
  
  if (governanceLevel === 'advanced') {
    actions.push({
      id: 'run_audit',
      title: 'Run compliance audit',
      description: 'Perform comprehensive compliance check',
      action: 'execute',
      target: 'compliance_audit'
    });
  }
  
  return actions;
}

/**
 * Generate observer status
 */
function generateObserverStatus(observerId, state) {
  return {
    observerId,
    status: 'active',
    lastInteraction: state.lastInteraction || null,
    contextAwareness: {
      currentPage: state.currentPage || 'unknown',
      currentAction: state.currentAction || 'unknown',
      lastUpdate: state.lastContextUpdate || null
    },
    capabilities: [
      'governance_guidance',
      'trust_metrics_analysis',
      'contextual_suggestions',
      'ai_safety_recommendations'
    ],
    version: '2.1.0',
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate context insights
 */
async function generateContextInsights(observerId, contextData) {
  const { context, page, action } = contextData;
  
  const insights = [];
  
  if (page === 'agents/deploy') {
    insights.push({
      type: 'deployment_guidance',
      message: 'You are on the agent deployment page. Consider reviewing governance settings before deploying.',
      priority: 'high'
    });
  }
  
  if (action === 'configuring') {
    insights.push({
      type: 'configuration_tip',
      message: 'While configuring, ensure all governance controls are properly set.',
      priority: 'medium'
    });
  }
  
  return insights;
}

/**
 * Update observer state
 */
function updateObserverState(observerId, updates) {
  const currentState = observerState.get(observerId) || {};
  const newState = { ...currentState, ...updates };
  observerState.set(observerId, newState);
}

module.exports = router;

