const express = require('express');
const router = express.Router();

// GET /metrics — returns CMU-style benchmark metrics
router.get('/metrics', (req, res) => {
  const metrics = {
    trustScore: {
      withGovernance: 92,
      withoutGovernance: 67,
      improvement: 37
    },
    complianceRate: {
      withGovernance: 98,
      withoutGovernance: 72,
      improvement: 36
    },
    errorReduction: {
      withGovernance: 89,
      withoutGovernance: 45,
      improvement: 98
    },
    integrationTime: {
      withGovernance: 2.5, // hours
      withoutGovernance: 8.2, // hours
      improvement: 70
    }
  };

  res.status(200).json(metrics);
});

// GET /comparison — returns side-by-side comparison
router.get('/comparison', (req, res) => {
  const comparisonData = {
    categories: ['Trust', 'Compliance', 'Error Rate', 'Integration Time'],
    beforeGovernance: [67, 72, 55, 100],
    afterGovernance: [92, 98, 11, 30]
  };

  res.status(200).json(comparisonData);
});

// POST /simulate — simulates results based on input parameters
router.post('/simulate', (req, res) => {
  const { governanceStrictness, verificationDepth } = req.body;

  const strictnessFactor = governanceStrictness / 100;
  const depthFactor = verificationDepth / 100;

  const simulatedMetrics = {
    trustScore: Math.round(70 + (strictnessFactor * 25) + (depthFactor * 5)),
    complianceRate: Math.round(75 + (strictnessFactor * 20) + (depthFactor * 5)),
    errorReduction: Math.round(50 + (strictnessFactor * 30) + (depthFactor * 20)),
    integrationTime: Math.round(30 + (strictnessFactor * 10) + (depthFactor * 15))
  };

  res.status(200).json(simulatedMetrics);
});

// ✅ POST /compare — dynamically benchmark two agents on a task
router.post('/compare', (req, res) => {
  const { agents, task } = req.body;

  // Simulated benchmark logic
  const scores = {
    [agents[0]]: Math.floor(Math.random() * 100),
    [agents[1]]: Math.floor(Math.random() * 100)
  };

  const winner = scores[agents[0]] > scores[agents[1]] ? agents[0] : agents[1];

  res.status(200).json({
    agentsTested: agents,
    task,
    scores,
    winner
  });
});

module.exports = router;
