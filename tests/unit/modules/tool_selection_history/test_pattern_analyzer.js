/**
 * Unit Tests for Pattern Analyzer
 * 
 * Tests the functionality of the PatternAnalyzer component for
 * analyzing tool usage patterns and identifying trends.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

// Fix import to use named export instead of default export
const { PatternAnalyzer } = require('../../../../src/modules/tool_selection_history/pattern_analyzer');

describe('PatternAnalyzer', function() {
  let patternAnalyzer;
  let sandbox;
  let mockFs;
  let mockToolUsageTracker;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock file system operations
    mockFs = {
      mkdirSync: sandbox.stub(fs, 'mkdirSync').returns(true),
      existsSync: sandbox.stub(fs, 'existsSync').returns(true),
      writeFileSync: sandbox.stub(fs, 'writeFileSync').returns(true),
      readFileSync: sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
        patterns: {},
        correlations: []
      }))
    };
    
    // Mock ToolUsageTracker
    mockToolUsageTracker = {
      getToolUsageStats: sandbox.stub().returns({
        usage_count: 10,
        success_count: 8,
        success_rate: 0.8,
        avg_duration_ms: 1200
      }),
      getAllToolUsageStats: sandbox.stub().returns({
        'search_web': {
          usage_count: 10,
          success_count: 8,
          success_rate: 0.8,
          avg_duration_ms: 1200
        },
        'browser_navigate': {
          usage_count: 5,
          success_count: 5,
          success_rate: 1.0,
          avg_duration_ms: 800
        }
      }),
      getContextHistory: sandbox.stub().returns([
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
      ]),
      findSimilarContexts: sandbox.stub().returns([
        {
          tool: 'search_web',
          context: { query: 'similar query' },
          outcome: { success: true }
        }
      ])
    };
    
    // Create test instance
    patternAnalyzer = new PatternAnalyzer({
      dataDir: '/test/data/dir',
      toolUsageTracker: mockToolUsageTracker
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
      const analyzer = new PatternAnalyzer({
        dataDir: '/test/data/dir',
        toolUsageTracker: mockToolUsageTracker
      });
      
      expect(mockFs.mkdirSync.calledOnce).to.be.true;
      expect(mockFs.mkdirSync.calledWith('/test/data/dir', { recursive: true })).to.be.true;
    });
    
    it('should initialize with default settings if not provided', function() {
      const analyzer = new PatternAnalyzer({
        toolUsageTracker: mockToolUsageTracker
      });
      
      expect(analyzer.dataDir).to.equal(path.join(process.cwd(), 'data/pattern_analyzer'));
      expect(analyzer.patterns).to.be.an('object');
      expect(analyzer.correlations).to.be.an('array');
    });
    
    it('should use provided settings if available', function() {
      const analyzer = new PatternAnalyzer({
        dataDir: '/custom/data/dir',
        minSampleSize: 20,
        toolUsageTracker: mockToolUsageTracker
      });
      
      expect(analyzer.dataDir).to.equal('/custom/data/dir');
      expect(analyzer.minSampleSize).to.equal(20);
    });
    
    it('should throw error if toolUsageTracker is not provided', function() {
      expect(() => new PatternAnalyzer({})).to.throw('ToolUsageTracker is required');
    });
  });
  
  describe('analyzeToolUsagePatterns', function() {
    it('should analyze tool usage patterns', function() {
      patternAnalyzer.analyzeToolUsagePatterns();
      
      // Verify toolUsageTracker methods were called
      expect(mockToolUsageTracker.getAllToolUsageStats.calledOnce).to.be.true;
      
      // Verify patterns were created
      expect(patternAnalyzer.patterns).to.be.an('object');
      expect(Object.keys(patternAnalyzer.patterns).length).to.be.at.least(1);
    });
    
    it('should identify high-performing tools', function() {
      patternAnalyzer.analyzeToolUsagePatterns();
      
      // Verify high-performing tools are identified
      expect(patternAnalyzer.patterns.highPerformingTools).to.be.an('array');
      expect(patternAnalyzer.patterns.highPerformingTools).to.include('browser_navigate');
    });
    
    it('should identify low-performing tools', function() {
      // Modify mock data to include a low-performing tool
      mockToolUsageTracker.getAllToolUsageStats.returns({
        'search_web': {
          usage_count: 10,
          success_count: 8,
          success_rate: 0.8
        },
        'low_performer': {
          usage_count: 10,
          success_count: 3,
          success_rate: 0.3
        }
      });
      
      patternAnalyzer.analyzeToolUsagePatterns();
      
      // Verify low-performing tools are identified
      expect(patternAnalyzer.patterns.lowPerformingTools).to.be.an('array');
      expect(patternAnalyzer.patterns.lowPerformingTools).to.include('low_performer');
    });
    
    it('should skip analysis if sample size is too small', function() {
      // Set minSampleSize higher than available data
      patternAnalyzer.minSampleSize = 100;
      
      patternAnalyzer.analyzeToolUsagePatterns();
      
      // Verify no patterns were created
      expect(Object.keys(patternAnalyzer.patterns).length).to.equal(0);
    });
  });
  
  describe('analyzeToolSequences', function() {
    it('should analyze tool usage sequences', function() {
      // Set up mock context history with sequential tool usage
      const timestamp1 = new Date('2025-05-26T12:00:00Z').toISOString();
      const timestamp2 = new Date('2025-05-26T12:01:00Z').toISOString();
      const timestamp3 = new Date('2025-05-26T12:02:00Z').toISOString();
      
      mockToolUsageTracker.getContextHistory.returns([
        {
          tool: 'search_web',
          context: { query: 'test query' },
          outcome: { success: true },
          timestamp: timestamp1
        },
        {
          tool: 'browser_navigate',
          context: { url: 'test.com' },
          outcome: { success: true },
          timestamp: timestamp2
        },
        {
          tool: 'file_read',
          context: { file: 'test.txt' },
          outcome: { success: true },
          timestamp: timestamp3
        }
      ]);
      
      patternAnalyzer.analyzeToolSequences();
      
      // Verify context history was retrieved
      expect(mockToolUsageTracker.getContextHistory.calledOnce).to.be.true;
      
      // Verify sequences were analyzed
      expect(patternAnalyzer.patterns.toolSequences).to.be.an('object');
      expect(patternAnalyzer.patterns.toolSequences['search_web']).to.be.an('object');
      expect(patternAnalyzer.patterns.toolSequences['search_web'].nextTools).to.be.an('object');
      expect(patternAnalyzer.patterns.toolSequences['search_web'].nextTools['browser_navigate']).to.equal(1);
    });
    
    it('should identify common tool sequences', function() {
      // Set up mock context history with repeated sequences
      const mockHistory = [];
      
      // Add 5 instances of search_web -> browser_navigate sequence
      for (let i = 0; i < 5; i++) {
        const baseTime = new Date('2025-05-26T12:00:00Z').getTime();
        mockHistory.push(
          {
            tool: 'search_web',
            context: { query: `query ${i}` },
            outcome: { success: true },
            timestamp: new Date(baseTime + i * 120000).toISOString()
          },
          {
            tool: 'browser_navigate',
            context: { url: `example${i}.com` },
            outcome: { success: true },
            timestamp: new Date(baseTime + i * 120000 + 60000).toISOString()
          }
        );
      }
      
      mockToolUsageTracker.getContextHistory.returns(mockHistory);
      
      patternAnalyzer.analyzeToolSequences();
      
      // Verify common sequences were identified
      expect(patternAnalyzer.patterns.commonSequences).to.be.an('array');
      expect(patternAnalyzer.patterns.commonSequences.length).to.be.at.least(1);
      
      // Verify the search_web -> browser_navigate sequence was identified
      const sequence = patternAnalyzer.patterns.commonSequences.find(
        seq => seq.sequence[0] === 'search_web' && seq.sequence[1] === 'browser_navigate'
      );
      expect(sequence).to.exist;
      expect(sequence.count).to.equal(5);
    });
    
    it('should handle empty context history', function() {
      mockToolUsageTracker.getContextHistory.returns([]);
      
      patternAnalyzer.analyzeToolSequences();
      
      // Verify no sequences were created
      expect(patternAnalyzer.patterns.toolSequences).to.be.an('object');
      expect(Object.keys(patternAnalyzer.patterns.toolSequences).length).to.equal(0);
      expect(patternAnalyzer.patterns.commonSequences).to.be.an('array');
      expect(patternAnalyzer.patterns.commonSequences.length).to.equal(0);
    });
  });
  
  describe('analyzeContextCorrelations', function() {
    it('should analyze context correlations with tool selection', function() {
      // Set up mock context history with context patterns
      mockToolUsageTracker.getContextHistory.returns([
        {
          tool: 'search_web',
          context: { 
            query: 'weather forecast',
            user_intent: 'information retrieval',
            environment: { time_of_day: 'morning' }
          },
          outcome: { success: true }
        },
        {
          tool: 'search_web',
          context: { 
            query: 'news today',
            user_intent: 'information retrieval',
            environment: { time_of_day: 'morning' }
          },
          outcome: { success: true }
        },
        {
          tool: 'browser_navigate',
          context: { 
            url: 'example.com',
            user_intent: 'navigation',
            environment: { time_of_day: 'afternoon' }
          },
          outcome: { success: true }
        }
      ]);
      
      patternAnalyzer.analyzeContextCorrelations();
      
      // Verify context history was retrieved
      expect(mockToolUsageTracker.getContextHistory.calledOnce).to.be.true;
      
      // Verify correlations were analyzed
      expect(patternAnalyzer.correlations).to.be.an('array');
      expect(patternAnalyzer.correlations.length).to.be.at.least(1);
      
      // Verify correlation for information retrieval intent
      const infoRetrievalCorrelation = patternAnalyzer.correlations.find(
        corr => corr.contextFactor === 'user_intent' && corr.contextValue === 'information retrieval'
      );
      expect(infoRetrievalCorrelation).to.exist;
      expect(infoRetrievalCorrelation.tools['search_web']).to.equal(2);
    });
    
    it('should identify strong correlations', function() {
      // Set up mock context history with strong correlations
      const mockHistory = [];
      
      // Add 10 instances of morning -> search_web correlation
      for (let i = 0; i < 10; i++) {
        mockHistory.push({
          tool: 'search_web',
          context: { 
            query: `query ${i}`,
            environment: { time_of_day: 'morning' }
          },
          outcome: { success: true }
        });
      }
      
      // Add 10 instances of afternoon -> browser_navigate correlation
      for (let i = 0; i < 10; i++) {
        mockHistory.push({
          tool: 'browser_navigate',
          context: { 
            url: `example${i}.com`,
            environment: { time_of_day: 'afternoon' }
          },
          outcome: { success: true }
        });
      }
      
      mockToolUsageTracker.getContextHistory.returns(mockHistory);
      
      patternAnalyzer.analyzeContextCorrelations();
      
      // Verify strong correlations were identified
      expect(patternAnalyzer.patterns.strongCorrelations).to.be.an('array');
      expect(patternAnalyzer.patterns.strongCorrelations.length).to.be.at.least(2);
      
      // Verify the morning -> search_web correlation
      const morningCorrelation = patternAnalyzer.patterns.strongCorrelations.find(
        corr => corr.contextFactor === 'environment.time_of_day' && corr.contextValue === 'morning'
      );
      expect(morningCorrelation).to.exist;
      expect(morningCorrelation.primaryTool).to.equal('search_web');
      
      // Verify the afternoon -> browser_navigate correlation
      const afternoonCorrelation = patternAnalyzer.patterns.strongCorrelations.find(
        corr => corr.contextFactor === 'environment.time_of_day' && corr.contextValue === 'afternoon'
      );
      expect(afternoonCorrelation).to.exist;
      expect(afternoonCorrelation.primaryTool).to.equal('browser_navigate');
    });
    
    it('should handle nested context properties', function() {
      // Set up mock context history with nested properties
      mockToolUsageTracker.getContextHistory.returns([
        {
          tool: 'search_web',
          context: { 
            query: 'test query',
            metadata: {
              source: 'user',
              priority: 'high',
              tags: ['important', 'urgent']
            }
          },
          outcome: { success: true }
        },
        {
          tool: 'search_web',
          context: { 
            query: 'another query',
            metadata: {
              source: 'user',
              priority: 'medium',
              tags: ['routine']
            }
          },
          outcome: { success: true }
        }
      ]);
      
      patternAnalyzer.analyzeContextCorrelations();
      
      // Verify nested correlations were analyzed
      const sourceCorrelation = patternAnalyzer.correlations.find(
        corr => corr.contextFactor === 'metadata.source' && corr.contextValue === 'user'
      );
      expect(sourceCorrelation).to.exist;
      expect(sourceCorrelation.tools['search_web']).to.equal(2);
    });
    
    it('should handle empty context history', function() {
      mockToolUsageTracker.getContextHistory.returns([]);
      
      patternAnalyzer.analyzeContextCorrelations();
      
      // Verify no correlations were created
      expect(patternAnalyzer.correlations).to.be.an('array');
      expect(patternAnalyzer.correlations.length).to.equal(0);
      expect(patternAnalyzer.patterns.strongCorrelations).to.be.an('array');
      expect(patternAnalyzer.patterns.strongCorrelations.length).to.equal(0);
    });
  });
  
  describe('getPatterns', function() {
    it('should return all identified patterns', function() {
      // Set up some patterns
      patternAnalyzer.patterns = {
        highPerformingTools: ['browser_navigate'],
        lowPerformingTools: ['low_performer'],
        toolSequences: {
          'search_web': {
            nextTools: {
              'browser_navigate': 5
            }
          }
        },
        commonSequences: [
          {
            sequence: ['search_web', 'browser_navigate'],
            count: 5
          }
        ],
        strongCorrelations: [
          {
            contextFactor: 'user_intent',
            contextValue: 'information retrieval',
            primaryTool: 'search_web',
            confidence: 0.9
          }
        ]
      };
      
      const patterns = patternAnalyzer.getPatterns();
      
      expect(patterns).to.be.an('object');
      expect(patterns).to.deep.equal(patternAnalyzer.patterns);
    });
    
    it('should return empty object if no patterns have been analyzed', function() {
      patternAnalyzer.patterns = {};
      
      const patterns = patternAnalyzer.getPatterns();
      
      expect(patterns).to.be.an('object');
      expect(Object.keys(patterns).length).to.equal(0);
    });
  });
  
  describe('getCorrelations', function() {
    it('should return all identified correlations', function() {
      // Set up some correlations
      patternAnalyzer.correlations = [
        {
          contextFactor: 'user_intent',
          contextValue: 'information retrieval',
          tools: {
            'search_web': 10,
            'browser_navigate': 2
          },
          totalOccurrences: 12
        },
        {
          contextFactor: 'environment.time_of_day',
          contextValue: 'morning',
          tools: {
            'search_web': 8,
            'file_read': 3
          },
          totalOccurrences: 11
        }
      ];
      
      const correlations = patternAnalyzer.getCorrelations();
      
      expect(correlations).to.be.an('array');
      expect(correlations).to.deep.equal(patternAnalyzer.correlations);
    });
    
    it('should filter correlations by context factor', function() {
      // Set up some correlations
      patternAnalyzer.correlations = [
        {
          contextFactor: 'user_intent',
          contextValue: 'information retrieval',
          tools: { 'search_web': 10 }
        },
        {
          contextFactor: 'environment.time_of_day',
          contextValue: 'morning',
          tools: { 'search_web': 8 }
        }
      ];
      
      const correlations = patternAnalyzer.getCorrelations('user_intent');
      
      expect(correlations).to.be.an('array');
      expect(correlations.length).to.equal(1);
      expect(correlations[0].contextFactor).to.equal('user_intent');
    });
    
    it('should return empty array if no correlations have been analyzed', function() {
      patternAnalyzer.correlations = [];
      
      const correlations = patternAnalyzer.getCorrelations();
      
      expect(correlations).to.be.an('array');
      expect(correlations.length).to.equal(0);
    });
  });
  
  describe('persistData', function() {
    it('should persist patterns and correlations to storage', function() {
      // Set up some data
      patternAnalyzer.patterns = {
        highPerformingTools: ['browser_navigate']
      };
      
      patternAnalyzer.correlations = [
        {
          contextFactor: 'user_intent',
          contextValue: 'information retrieval',
          tools: { 'search_web': 10 }
        }
      ];
      
      patternAnalyzer.persistData();
      
      expect(mockFs.writeFileSync.calledOnce).to.be.true;
      
      // Verify correct data is being persisted
      const persistedData = JSON.parse(mockFs.writeFileSync.firstCall.args[1]);
      expect(persistedData).to.have.property('patterns');
      expect(persistedData).to.have.property('correlations');
      expect(persistedData.patterns).to.deep.equal(patternAnalyzer.patterns);
      expect(persistedData.correlations).to.deep.equal(patternAnalyzer.correlations);
    });
  });
  
  describe('loadData', function() {
    it('should load patterns and correlations from storage', function() {
      // Set up mock data
      const mockData = {
        patterns: {
          highPerformingTools: ['browser_navigate']
        },
        correlations: [
          {
            contextFactor: 'user_intent',
            contextValue: 'information retrieval',
            tools: { 'search_web': 10 }
          }
        ]
      };
      
      mockFs.readFileSync.returns(JSON.stringify(mockData));
      
      // Reset analyzer data
      patternAnalyzer.patterns = {};
      patternAnalyzer.correlations = [];
      
      // Load data
      patternAnalyzer.loadData();
      
      // Verify data is loaded correctly
      expect(patternAnalyzer.patterns).to.deep.equal(mockData.patterns);
      expect(patternAnalyzer.correlations).to.deep.equal(mockData.correlations);
    });
    
    it('should handle missing or invalid data file', function() {
      // Simulate file not found
      mockFs.readFileSync.throws(new Error('File not found'));
      
      // Set up initial data
      patternAnalyzer.patterns = { test: true };
      patternAnalyzer.correlations = [{ test: true }];
      
      // Attempt to load data
      patternAnalyzer.loadData();
      
      // Verify original data is preserved
      expect(patternAnalyzer.patterns).to.deep.equal({ test: true });
      expect(patternAnalyzer.correlations).to.deep.equal([{ test: true }]);
    });
  });
});
