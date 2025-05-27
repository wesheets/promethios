/**
 * Unit Tests for Scorecard Analytics
 * 
 * Tests the functionality of the ScorecardAnalytics class for generating
 * analytics and visualization data for agent scorecards.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const ScorecardAnalytics = require('../../../../src/modules/agent_scorecard/scorecard_analytics');

describe('ScorecardAnalytics', function() {
  let scorecardAnalytics;
  let sandbox;
  let testConfig;
  
  before(function() {
    // Create test directories
    const testDir = path.join(process.cwd(), 'test_data', 'scorecard_analytics_test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    testConfig = {
      dataDir: path.join(testDir, 'analytics')
    };
  });
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Stub fs methods to avoid actual file operations
    sandbox.stub(fs, 'existsSync').returns(false);
    sandbox.stub(fs, 'mkdirSync');
    
    // Create test instance
    scorecardAnalytics = new ScorecardAnalytics(testConfig);
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('generateTrustScoreTrend', function() {
    it('should generate trust score trend data', async function() {
      const agentId = 'test-agent';
      const timeRange = 7;
      
      const trend = await scorecardAnalytics.generateTrustScoreTrend(agentId, timeRange);
      
      expect(trend).to.be.an('object');
      expect(trend.agent_id).to.equal(agentId);
      expect(trend.time_range).to.equal(timeRange);
      expect(trend.trend_data).to.be.an('array');
      expect(trend.trend_data.length).to.equal(timeRange + 1); // +1 for current day
      
      // Verify data structure
      const dataPoint = trend.trend_data[0];
      expect(dataPoint).to.have.property('date');
      expect(dataPoint).to.have.property('score');
      expect(dataPoint.score).to.be.a('number');
      expect(dataPoint.score).to.be.within(0, 1);
    });
    
    it('should use default time range if not specified', async function() {
      const agentId = 'test-agent';
      
      const trend = await scorecardAnalytics.generateTrustScoreTrend(agentId);
      
      expect(trend.time_range).to.equal(30); // Default is 30 days
      expect(trend.trend_data.length).to.equal(31); // +1 for current day
    });
  });
  
  describe('generateTrustNetwork', function() {
    it('should generate trust network visualization data', async function() {
      const agentId = 'test-agent';
      const depth = 2;
      
      const network = await scorecardAnalytics.generateTrustNetwork(agentId, depth);
      
      expect(network).to.be.an('object');
      expect(network.nodes).to.be.an('array');
      expect(network.edges).to.be.an('array');
      
      // Verify central node
      const centralNode = network.nodes.find(n => n.id === agentId);
      expect(centralNode).to.exist;
      expect(centralNode.type).to.equal('central');
      
      // Verify connected nodes
      const connectedNodes = network.nodes.filter(n => n.type === 'connected');
      expect(connectedNodes.length).to.be.greaterThan(0);
      
      // Verify secondary nodes (depth 2)
      const secondaryNodes = network.nodes.filter(n => n.type === 'secondary');
      expect(secondaryNodes.length).to.be.greaterThan(0);
      
      // Verify edges
      expect(network.edges.length).to.be.greaterThan(0);
      const edge = network.edges[0];
      expect(edge).to.have.property('source');
      expect(edge).to.have.property('target');
      expect(edge).to.have.property('delegation_score');
    });
    
    it('should respect depth parameter', async function() {
      // Test with depth 1
      const network1 = await scorecardAnalytics.generateTrustNetwork('test-agent', 1);
      
      // Should not have secondary nodes
      const secondaryNodes1 = network1.nodes.filter(n => n.type === 'secondary');
      expect(secondaryNodes1.length).to.equal(0);
      
      // Test with depth 2
      const network2 = await scorecardAnalytics.generateTrustNetwork('test-agent', 2);
      
      // Should have secondary nodes
      const secondaryNodes2 = network2.nodes.filter(n => n.type === 'secondary');
      expect(secondaryNodes2.length).to.be.greaterThan(0);
    });
  });
  
  describe('generateComplianceReport', function() {
    it('should generate compliance report data', async function() {
      const agentId = 'test-agent';
      
      const report = await scorecardAnalytics.generateComplianceReport(agentId);
      
      expect(report).to.be.an('object');
      expect(report.agent_id).to.equal(agentId);
      expect(report.report_date).to.be.a('string');
      expect(report.compliance_metrics).to.be.an('object');
      expect(report.overall_compliance).to.be.a('number');
      expect(report.risk_assessment).to.be.a('string');
      
      // Verify compliance metrics
      const metrics = report.compliance_metrics;
      expect(metrics.governance_compliance).to.be.an('object');
      expect(metrics.reflection_compliance).to.be.an('object');
      expect(metrics.belief_trace_compliance).to.be.an('object');
      expect(metrics.trust_decay_compliance).to.be.an('object');
      
      // Verify metric structure
      const metric = metrics.governance_compliance;
      expect(metric.score).to.be.a('number');
      expect(metric.issues).to.be.a('number');
      expect(metric.recommendations).to.be.an('array');
    });
  });
  
  describe('compareAgents', function() {
    it('should compare multiple agents', async function() {
      const agentIds = ['agent-1', 'agent-2', 'agent-3'];
      
      const comparison = await scorecardAnalytics.compareAgents(agentIds);
      
      expect(comparison).to.be.an('object');
      expect(comparison.comparison_date).to.be.a('string');
      expect(comparison.agents).to.be.an('array');
      expect(comparison.agents.length).to.equal(agentIds.length);
      
      // Verify agent data
      const agentData = comparison.agents[0];
      expect(agentData.agent_id).to.equal(agentIds[0]);
      expect(agentData.trust_score).to.be.a('number');
      expect(agentData.reflection_compliance).to.be.a('number');
      expect(agentData.belief_trace_integrity).to.be.a('number');
      expect(agentData.violation_count).to.be.a('number');
    });
    
    it('should handle empty agent list', async function() {
      const comparison = await scorecardAnalytics.compareAgents([]);
      
      expect(comparison).to.be.an('object');
      expect(comparison.agents).to.be.an('array');
      expect(comparison.agents.length).to.equal(0);
    });
  });
});
