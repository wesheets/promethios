const express = require('express');
const router = express.Router();

// Get benchmark metrics
router.get('/metrics', (req, res) => {
  // Mock data for CMU benchmark metrics
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

// Get benchmark comparison data
router.get('/comparison', (req, res) => {
  // Mock data for before/after comparison
  const comparisonData = {
    categories: ['Trust', 'Compliance', 'Error Rate', 'Integration Time'],
    beforeGovernance: [67, 72, 55, 100],
    afterGovernance: [92, 98, 11, 30]
  };
  
  res.status(200).json(comparisonData);
});

// Get benchmark trends data
router.post('/simulate', (req, res) => {
  const { governanceStrictness, verificationDepth } = req.body;
  
  // Calculate simulated metrics based on parameters
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

module.exports = router;
