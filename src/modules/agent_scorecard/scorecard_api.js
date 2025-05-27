/**
 * Scorecard API
 * 
 * Provides RESTful API endpoints for accessing and managing agent scorecards
 * and trust lineage records.
 */

const express = require('express');
const router = express.Router();

class ScorecardAPI {
  constructor(agentScorecard, config = {}) {
    this.agentScorecard = agentScorecard;
    this.config = {
      apiBasePath: '/api/agent/scorecard',
      enablePublicAccess: true,
      ...config
    };
    
    this._setupRoutes();
  }

  /**
   * Set up API routes
   * @private
   */
  _setupRoutes() {
    // Get scorecard for an agent
    router.get('/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const scorecard = await this.agentScorecard.getScorecard(agentId);
        
        if (!scorecard) {
          return res.status(404).json({ error: 'Scorecard not found' });
        }
        
        res.json(scorecard);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get scorecard history for an agent
    router.get('/:agentId/history', async (req, res) => {
      try {
        const { agentId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        
        const history = await this.agentScorecard.scorecardManager.getScorecardHistory(agentId, limit);
        
        res.json(history);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Verify a scorecard
    router.post('/verify', async (req, res) => {
      try {
        const { scorecard } = req.body;
        
        if (!scorecard) {
          return res.status(400).json({ error: 'Scorecard is required' });
        }
        
        const isValid = await this.agentScorecard.verifyScorecard(scorecard);
        
        res.json({ valid: isValid });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get trust lineage for an agent
    router.get('/:agentId/lineage', async (req, res) => {
      try {
        const { agentId } = req.params;
        const lineage = await this.agentScorecard.getTrustLineage(agentId);
        
        res.json(lineage);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Record trust delegation
    router.post('/delegate', async (req, res) => {
      try {
        const { sourceAgentId, targetAgentId, context } = req.body;
        
        if (!sourceAgentId || !targetAgentId) {
          return res.status(400).json({ error: 'Source and target agent IDs are required' });
        }
        
        const lineageRecord = await this.agentScorecard.recordTrustDelegation(
          sourceAgentId,
          targetAgentId,
          context || {}
        );
        
        res.json(lineageRecord);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Register routes with app
    const app = require('../../app');
    app.use(this.config.apiBasePath, router);
  }
}

module.exports = ScorecardAPI;
