/**
 * Unit Tests for Tool Usage Tracker
 * 
 * Tests the functionality of the ToolUsageTracker component for
 * tracking tool usage patterns and history.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

// Fix import to use named export instead of default export
const { ToolUsageTracker } = require('../../../../src/modules/tool_selection_history/tool_usage_tracker');

describe('ToolUsageTracker', function() {
  let toolUsageTracker;
  let sandbox;
  let mockFs;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock file system operations
    mockFs = {
      mkdirSync: sandbox.stub(fs, 'mkdirSync').returns(true),
      existsSync: sandbox.stub(fs, 'existsSync').returns(true),
      writeFileSync: sandbox.stub(fs, 'writeFileSync').returns(true),
      readFileSync: sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
        toolUsage: {},
        contextHistory: []
      }))
    };
    
    // Create test instance
    toolUsageTracker = new ToolUsageTracker({
      dataDir: '/test/data/dir'
    });
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('constructor', function() {
    it('should create data directory if it does not exist', function() {
      // Set existsSync to return false to simulate directory not existing
      mockFs.existsSync.returns(false);
      
      // Create new instance to trigger directory creation
      const tracker = new ToolUsageTracker({
        dataDir: '/test/data/dir'
      });
      
      expect(mockFs.mkdirSync.calledOnce).to.be.true;
      expect(mockFs.mkdirSync.calledWith('/test/data/dir', { recursive: true })).to.be.true;
    });
    
    it('should initialize with default settings if not provided', function() {
      const tracker = new ToolUsageTracker();
      
      expect(tracker.dataDir).to.equal(path.join(process.cwd(), 'data/tool_selection_history'));
      expect(tracker.toolUsage).to.be.an('object');
      expect(tracker.contextHistory).to.be.an('array');
    });
    
    it('should use provided settings if available', function() {
      const tracker = new ToolUsageTracker({
        dataDir: '/custom/data/dir',
        maxHistoryItems: 200
      });
      
      expect(tracker.dataDir).to.equal('/custom/data/dir');
      expect(tracker.maxHistoryItems).to.equal(200);
    });
  });
  
  describe('trackToolUsage', function() {
    it('should track tool usage with context', function() {
      const context = {
        query: 'test query',
        user_intent: 'information retrieval',
        environment: {
          time_of_day: 'morning',
          device: 'desktop'
        }
      };
      
      const toolName = 'search_web';
      const outcome = {
        success: true,
        duration_ms: 1200,
        result_quality: 'high'
      };
      
      toolUsageTracker.trackToolUsage(toolName, context, outcome);
      
      // Verify tool usage is tracked
      expect(toolUsageTracker.toolUsage[toolName]).to.exist;
      expect(toolUsageTracker.toolUsage[toolName].usage_count).to.equal(1);
      expect(toolUsageTracker.toolUsage[toolName].success_count).to.equal(1);
      expect(toolUsageTracker.toolUsage[toolName].contexts).to.be.an('array');
      expect(toolUsageTracker.toolUsage[toolName].contexts.length).to.equal(1);
      
      // Verify context history is updated
      expect(toolUsageTracker.contextHistory).to.be.an('array');
      expect(toolUsageTracker.contextHistory.length).to.equal(1);
      expect(toolUsageTracker.contextHistory[0].tool).to.equal(toolName);
      expect(toolUsageTracker.contextHistory[0].context).to.deep.equal(context);
      expect(toolUsageTracker.contextHistory[0].outcome).to.deep.equal(outcome);
    });
    
    it('should update existing tool usage data', function() {
      // Set up existing data
      toolUsageTracker.toolUsage = {
        'search_web': {
          usage_count: 5,
          success_count: 4,
          avg_duration_ms: 1000,
          contexts: [
            { query: 'previous query', outcome: { success: true } }
          ]
        }
      };
      
      const context = {
        query: 'new query',
        user_intent: 'information retrieval'
      };
      
      const toolName = 'search_web';
      const outcome = {
        success: true,
        duration_ms: 1500,
        result_quality: 'high'
      };
      
      toolUsageTracker.trackToolUsage(toolName, context, outcome);
      
      // Verify tool usage is updated
      expect(toolUsageTracker.toolUsage[toolName].usage_count).to.equal(6);
      expect(toolUsageTracker.toolUsage[toolName].success_count).to.equal(5);
      expect(toolUsageTracker.toolUsage[toolName].contexts.length).to.equal(2);
      
      // Verify average duration is updated
      const expectedAvgDuration = (1000 * 5 + 1500) / 6;
      expect(toolUsageTracker.toolUsage[toolName].avg_duration_ms).to.be.closeTo(expectedAvgDuration, 0.01);
    });
    
    it('should handle failed outcomes correctly', function() {
      const context = {
        query: 'test query'
      };
      
      const toolName = 'search_web';
      const outcome = {
        success: false,
        error: 'Connection timeout',
        duration_ms: 3000
      };
      
      toolUsageTracker.trackToolUsage(toolName, context, outcome);
      
      // Verify tool usage is tracked
      expect(toolUsageTracker.toolUsage[toolName].usage_count).to.equal(1);
      expect(toolUsageTracker.toolUsage[toolName].success_count).to.equal(0);
      expect(toolUsageTracker.toolUsage[toolName].failure_reasons).to.be.an('array');
      expect(toolUsageTracker.toolUsage[toolName].failure_reasons[0]).to.equal('Connection timeout');
    });
    
    it('should limit context history to maxHistoryItems', function() {
      // Set a small maxHistoryItems for testing
      toolUsageTracker.maxHistoryItems = 3;
      
      // Add 4 items (exceeding the limit)
      for (let i = 0; i < 4; i++) {
        toolUsageTracker.trackToolUsage('test_tool', { query: `query ${i}` }, { success: true });
      }
      
      // Verify history is limited to 3 items
      expect(toolUsageTracker.contextHistory.length).to.equal(3);
      
      // Verify the oldest item was removed (FIFO)
      expect(toolUsageTracker.contextHistory[0].context.query).to.equal('query 1');
      expect(toolUsageTracker.contextHistory[2].context.query).to.equal('query 3');
    });
  });
  
  describe('getToolUsageStats', function() {
    it('should return usage statistics for a specific tool', function() {
      // Set up test data
      toolUsageTracker.toolUsage = {
        'search_web': {
          usage_count: 10,
          success_count: 8,
          avg_duration_ms: 1200,
          contexts: Array(10).fill({ query: 'test' }),
          failure_reasons: ['timeout', 'error']
        },
        'browser_navigate': {
          usage_count: 5,
          success_count: 5,
          avg_duration_ms: 800,
          contexts: Array(5).fill({ url: 'test.com' })
        }
      };
      
      const stats = toolUsageTracker.getToolUsageStats('search_web');
      
      expect(stats).to.be.an('object');
      expect(stats.usage_count).to.equal(10);
      expect(stats.success_count).to.equal(8);
      expect(stats.success_rate).to.equal(0.8);
      expect(stats.avg_duration_ms).to.equal(1200);
      expect(stats.failure_reasons).to.deep.equal(['timeout', 'error']);
    });
    
    it('should return null for non-existent tool', function() {
      const stats = toolUsageTracker.getToolUsageStats('non_existent_tool');
      expect(stats).to.be.null;
    });
    
    it('should calculate derived metrics correctly', function() {
      // Set up test data
      toolUsageTracker.toolUsage = {
        'test_tool': {
          usage_count: 20,
          success_count: 15,
          avg_duration_ms: 1000,
          contexts: Array(20).fill({ query: 'test' })
        }
      };
      
      const stats = toolUsageTracker.getToolUsageStats('test_tool');
      
      expect(stats.success_rate).to.equal(0.75);
      expect(stats.failure_rate).to.equal(0.25);
    });
  });
  
  describe('getAllToolUsageStats', function() {
    it('should return usage statistics for all tools', function() {
      // Set up test data
      toolUsageTracker.toolUsage = {
        'search_web': {
          usage_count: 10,
          success_count: 8,
          avg_duration_ms: 1200
        },
        'browser_navigate': {
          usage_count: 5,
          success_count: 5,
          avg_duration_ms: 800
        }
      };
      
      const allStats = toolUsageTracker.getAllToolUsageStats();
      
      expect(allStats).to.be.an('object');
      expect(Object.keys(allStats).length).to.equal(2);
      expect(allStats.search_web.usage_count).to.equal(10);
      expect(allStats.browser_navigate.success_rate).to.equal(1.0);
    });
    
    it('should return empty object if no tools have been used', function() {
      toolUsageTracker.toolUsage = {};
      
      const allStats = toolUsageTracker.getAllToolUsageStats();
      
      expect(allStats).to.be.an('object');
      expect(Object.keys(allStats).length).to.equal(0);
    });
  });
  
  describe('getContextHistory', function() {
    it('should return full context history', function() {
      // Set up test data
      toolUsageTracker.contextHistory = [
        {
          tool: 'search_web',
          context: { query: 'test query 1' },
          outcome: { success: true },
          timestamp: new Date().toISOString()
        },
        {
          tool: 'browser_navigate',
          context: { url: 'test.com' },
          outcome: { success: true },
          timestamp: new Date().toISOString()
        }
      ];
      
      const history = toolUsageTracker.getContextHistory();
      
      expect(history).to.be.an('array');
      expect(history.length).to.equal(2);
      expect(history[0].tool).to.equal('search_web');
      expect(history[1].tool).to.equal('browser_navigate');
    });
    
    it('should return filtered history for specific tool', function() {
      // Set up test data
      toolUsageTracker.contextHistory = [
        {
          tool: 'search_web',
          context: { query: 'test query 1' },
          outcome: { success: true }
        },
        {
          tool: 'browser_navigate',
          context: { url: 'test.com' },
          outcome: { success: true }
        },
        {
          tool: 'search_web',
          context: { query: 'test query 2' },
          outcome: { success: false }
        }
      ];
      
      const history = toolUsageTracker.getContextHistory('search_web');
      
      expect(history).to.be.an('array');
      expect(history.length).to.equal(2);
      expect(history[0].tool).to.equal('search_web');
      expect(history[1].tool).to.equal('search_web');
      expect(history[0].context.query).to.equal('test query 1');
      expect(history[1].context.query).to.equal('test query 2');
    });
    
    it('should return empty array if no history exists', function() {
      toolUsageTracker.contextHistory = [];
      
      const history = toolUsageTracker.getContextHistory();
      
      expect(history).to.be.an('array');
      expect(history.length).to.equal(0);
    });
    
    it('should return empty array if no history exists for specific tool', function() {
      toolUsageTracker.contextHistory = [
        {
          tool: 'search_web',
          context: { query: 'test query' },
          outcome: { success: true }
        }
      ];
      
      const history = toolUsageTracker.getContextHistory('non_existent_tool');
      
      expect(history).to.be.an('array');
      expect(history.length).to.equal(0);
    });
  });
  
  describe('getContextSimilarity', function() {
    it('should calculate similarity between contexts', function() {
      const context1 = {
        query: 'weather in new york',
        user_intent: 'information retrieval',
        environment: {
          time_of_day: 'morning',
          device: 'desktop'
        }
      };
      
      const context2 = {
        query: 'weather in boston',
        user_intent: 'information retrieval',
        environment: {
          time_of_day: 'afternoon',
          device: 'desktop'
        }
      };
      
      const similarity = toolUsageTracker.getContextSimilarity(context1, context2);
      
      expect(similarity).to.be.a('number');
      expect(similarity).to.be.within(0, 1);
      expect(similarity).to.be.greaterThan(0.5); // Contexts are fairly similar
    });
    
    it('should return 1.0 for identical contexts', function() {
      const context = {
        query: 'test query',
        user_intent: 'test intent'
      };
      
      const similarity = toolUsageTracker.getContextSimilarity(context, context);
      
      expect(similarity).to.equal(1.0);
    });
    
    it('should return 0.0 for completely different contexts', function() {
      const context1 = {
        query: 'weather in new york',
        user_intent: 'information retrieval'
      };
      
      const context2 = {
        action: 'create document',
        format: 'markdown',
        topic: 'artificial intelligence'
      };
      
      const similarity = toolUsageTracker.getContextSimilarity(context1, context2);
      
      expect(similarity).to.be.closeTo(0.0, 0.2); // Allow small margin due to implementation details
    });
    
    it('should handle nested objects in contexts', function() {
      const context1 = {
        query: 'test query',
        metadata: {
          source: 'user',
          priority: 'high',
          tags: ['important', 'urgent']
        }
      };
      
      const context2 = {
        query: 'test query',
        metadata: {
          source: 'system',
          priority: 'high',
          tags: ['important', 'routine']
        }
      };
      
      const similarity = toolUsageTracker.getContextSimilarity(context1, context2);
      
      expect(similarity).to.be.a('number');
      expect(similarity).to.be.within(0, 1);
      expect(similarity).to.be.greaterThan(0.5); // Contexts are fairly similar
    });
  });
  
  describe('findSimilarContexts', function() {
    it('should find contexts similar to the provided context', function() {
      // Set up test data
      toolUsageTracker.contextHistory = [
        {
          tool: 'search_web',
          context: {
            query: 'weather in new york',
            user_intent: 'information retrieval'
          },
          outcome: { success: true }
        },
        {
          tool: 'search_web',
          context: {
            query: 'weather in boston',
            user_intent: 'information retrieval'
          },
          outcome: { success: true }
        },
        {
          tool: 'browser_navigate',
          context: {
            url: 'example.com',
            user_intent: 'navigation'
          },
          outcome: { success: true }
        }
      ];
      
      const currentContext = {
        query: 'weather in chicago',
        user_intent: 'information retrieval'
      };
      
      const similarContexts = toolUsageTracker.findSimilarContexts(currentContext, 0.6);
      
      expect(similarContexts).to.be.an('array');
      expect(similarContexts.length).to.equal(2);
      expect(similarContexts[0].context.query).to.include('weather');
      expect(similarContexts[1].context.query).to.include('weather');
    });
    
    it('should return empty array if no similar contexts found', function() {
      // Set up test data
      toolUsageTracker.contextHistory = [
        {
          tool: 'search_web',
          context: {
            query: 'weather in new york',
            user_intent: 'information retrieval'
          },
          outcome: { success: true }
        }
      ];
      
      const currentContext = {
        action: 'create document',
        format: 'markdown',
        topic: 'artificial intelligence'
      };
      
      const similarContexts = toolUsageTracker.findSimilarContexts(currentContext, 0.6);
      
      expect(similarContexts).to.be.an('array');
      expect(similarContexts.length).to.equal(0);
    });
  });
  
  describe('persistData', function() {
    it('should persist data to storage', function() {
      // Set up test data
      toolUsageTracker.toolUsage = {
        'search_web': {
          usage_count: 10,
          success_count: 8
        }
      };
      
      toolUsageTracker.contextHistory = [
        {
          tool: 'search_web',
          context: { query: 'test query' },
          outcome: { success: true }
        }
      ];
      
      toolUsageTracker.persistData();
      
      expect(mockFs.writeFileSync.calledOnce).to.be.true;
      
      // Verify correct data is being persisted
      const persistedData = JSON.parse(mockFs.writeFileSync.firstCall.args[1]);
      expect(persistedData).to.have.property('toolUsage');
      expect(persistedData).to.have.property('contextHistory');
      expect(persistedData.toolUsage).to.deep.equal(toolUsageTracker.toolUsage);
      expect(persistedData.contextHistory).to.deep.equal(toolUsageTracker.contextHistory);
    });
  });
  
  describe('loadData', function() {
    it('should load data from storage', function() {
      // Set up mock data
      const mockData = {
        toolUsage: {
          'search_web': {
            usage_count: 5,
            success_count: 4
          }
        },
        contextHistory: [
          {
            tool: 'search_web',
            context: { query: 'loaded query' },
            outcome: { success: true }
          }
        ]
      };
      
      mockFs.readFileSync.returns(JSON.stringify(mockData));
      
      // Reset tracker data
      toolUsageTracker.toolUsage = {};
      toolUsageTracker.contextHistory = [];
      
      // Load data
      toolUsageTracker.loadData();
      
      // Verify data is loaded correctly
      expect(toolUsageTracker.toolUsage).to.deep.equal(mockData.toolUsage);
      expect(toolUsageTracker.contextHistory).to.deep.equal(mockData.contextHistory);
    });
    
    it('should handle missing or invalid data file', function() {
      // Simulate file not found
      mockFs.readFileSync.throws(new Error('File not found'));
      
      // Set up initial data
      toolUsageTracker.toolUsage = { 'test': { usage_count: 1 } };
      toolUsageTracker.contextHistory = [{ tool: 'test' }];
      
      // Attempt to load data
      toolUsageTracker.loadData();
      
      // Verify original data is preserved
      expect(toolUsageTracker.toolUsage).to.deep.equal({ 'test': { usage_count: 1 } });
      expect(toolUsageTracker.contextHistory).to.deep.equal([{ tool: 'test' }]);
    });
  });
});
