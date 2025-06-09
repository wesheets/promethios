const express = require('express');
const router = express.Router();

/**
 * Governance API Routes
 * 
 * These endpoints provide governance analysis, comparison, and metrics functionality.
 */

/**
 * POST /api/governance
 * 
 * Analyze text for governance compliance
 * 
 * Request Body:
 * {
 *   "text": "Text to analyze",
 *   "features": {
 *     "veritas": true,
 *     "safety": true,
 *     "role": true
 *   },
 *   "role": "agent_role",
 *   "scenario": "use_case_scenario"
 * }
 */
router.post('/governance', async (req, res) => {
  try {
    const { text, features, role, scenario } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text'
      });
    }

    const GovernanceService = require('../services/governanceService');
    const governanceService = new GovernanceService();
    
    // Initialize with standard governance level
    await governanceService.initialize('standard');

    // Analyze the text
    const analysis = await governanceService.analyzeResponse('', text, {
      agentType: role || 'custom',
      scenario: scenario
    });

    res.json({
      originalText: text,
      modifiedText: analysis.modifiedResponse || text,
      trustScore: analysis.trustScore,
      violations: analysis.violations,
      complianceRate: analysis.complianceRate,
      governanceApplied: true
    });

  } catch (error) {
    console.error('Governance analysis error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/governance/compare
 * 
 * Compare governed vs ungoverned agent responses
 * 
 * Request Body:
 * {
 *   "prompt": "User prompt to test",
 *   "agentId": "Agent ID to use",
 *   "governanceLevel": "basic|standard|strict|maximum"
 * }
 */
router.post('/governance/compare', async (req, res) => {
  try {
    const { prompt, agentId, governanceLevel = 'standard' } = req.body;

    if (!prompt || !agentId) {
      return res.status(400).json({
        error: 'Missing required fields: prompt and agentId'
      });
    }

    const AgentWrapperService = require('../services/agentWrapperService');

    // Execute with governance enabled
    const governedWrapper = new AgentWrapperService();
    await governedWrapper.configure({
      agentId,
      agentType: 'openai', // Default to OpenAI for comparison
      governanceEnabled: true,
      governanceLevel
    });

    const governedResult = await governedWrapper.complete(prompt);

    // Execute without governance
    const ungovernedWrapper = new AgentWrapperService();
    await ungovernedWrapper.configure({
      agentId,
      agentType: 'openai',
      governanceEnabled: false,
      governanceLevel: 'basic'
    });

    const ungovernedResult = await ungovernedWrapper.complete(prompt);

    // Calculate comparison metrics
    const comparison = {
      trustDifference: governedResult.trustScore || 0,
      violationsPrevented: governedResult.violations?.length || 0,
      safetyImprovement: governedResult.violations?.length > 0 ? 25 : 15 // Estimated improvement
    };

    res.json({
      governed: {
        response: governedResult.response,
        trustScore: governedResult.trustScore,
        violations: governedResult.violations,
        processingTime: governedResult.processingTime
      },
      ungoverned: {
        response: ungovernedResult.response,
        processingTime: ungovernedResult.processingTime
      },
      comparison
    });

  } catch (error) {
    console.error('Governance comparison error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/governance/metrics/:agentId
 * 
 * Get governance metrics for a specific agent
 * 
 * Query Parameters:
 * - range: Time range (1h, 24h, 7d, 30d)
 */
router.get('/governance/metrics/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { range = '24h' } = req.query;

    // In production, this would query a metrics database
    // For now, return mock metrics
    const mockMetrics = {
      agentId,
      timeRange: range,
      averageTrustScore: 87,
      totalInteractions: 156,
      totalViolations: 8,
      complianceRate: 95,
      violationsByType: {
        'safety': 3,
        'role_adherence': 2,
        'overconfidence': 3
      },
      trustTrend: [85, 86, 87, 88, 87], // Last 5 data points
      topViolations: [
        {
          type: 'overconfidence',
          count: 3,
          severity: 'low',
          description: 'Agent responses showing overconfidence'
        },
        {
          type: 'safety',
          count: 3,
          severity: 'medium',
          description: 'Potential safety concerns detected'
        }
      ],
      governanceInterventions: 5,
      responseModifications: 2
    };

    res.json(mockMetrics);

  } catch (error) {
    console.error('Governance metrics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/governance/status
 * 
 * Get overall governance system status
 */
router.get('/governance/status', async (req, res) => {
  try {
    const GovernanceService = require('../services/governanceService');
    const governanceService = new GovernanceService();
    
    await governanceService.initialize('standard');
    const status = governanceService.getStatus();

    res.json({
      status: 'operational',
      version: '1.0.0',
      governance: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Governance status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

