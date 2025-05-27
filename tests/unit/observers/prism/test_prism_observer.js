/**
 * Unit Tests for PRISM Observer
 * 
 * Tests the functionality of the PRISM observer component for
 * monitoring and analyzing system behavior.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const { PrismObserver } = require('../../../../src/observers/prism/index');

describe('PrismObserver', function() {
  let prismObserver;
  let sandbox;
  let mockFs;
  let mockEventEmitter;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock file system operations
    mockFs = {
      mkdirSync: sandbox.stub(fs, 'mkdirSync').returns(true),
      existsSync: sandbox.stub(fs, 'existsSync').returns(true),
      writeFileSync: sandbox.stub(fs, 'writeFileSync').returns(true),
      readFileSync: sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
        observations: [],
        metrics: {}
      }))
    };
    
    // Mock event emitter
    mockEventEmitter = {
      on: sandbox.stub(),
      emit: sandbox.stub(),
      removeListener: sandbox.stub()
    };
    
    // Create test instance
    prismObserver = new PrismObserver({
      dataDir: '/test/data/dir',
      eventEmitter: mockEventEmitter
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
      const observer = new PRISMObserver({
        dataDir: '/test/data/dir',
        eventEmitter: mockEventEmitter
      });
      
      expect(mockFs.mkdirSync.calledOnce).to.be.true;
      expect(mockFs.mkdirSync.calledWith('/test/data/dir', { recursive: true })).to.be.true;
    });
    
    it('should initialize with default settings if not provided', function() {
      const observer = new PRISMObserver({
        eventEmitter: mockEventEmitter
      });
      
      expect(observer.dataDir).to.equal(path.join(process.cwd(), 'data/prism_observer'));
      expect(observer.observations).to.be.an('array');
      expect(observer.metrics).to.be.an('object');
    });
    
    it('should use provided settings if available', function() {
      const observer = new PRISMObserver({
        dataDir: '/custom/data/dir',
        samplingRate: 0.5,
        eventEmitter: mockEventEmitter
      });
      
      expect(observer.dataDir).to.equal('/custom/data/dir');
      expect(observer.samplingRate).to.equal(0.5);
    });
    
    it('should throw error if eventEmitter is not provided', function() {
      expect(() => new PrismObserver({})).to.throw('EventEmitter is required');
    });
    
    it('should register event listeners', function() {
      // Verify event listeners were registered
      expect(mockEventEmitter.on.called).to.be.true;
      
      // Verify specific events were registered
      const registeredEvents = mockEventEmitter.on.args.map(args => args[0]);
      expect(registeredEvents).to.include('tool:execution');
      expect(registeredEvents).to.include('memory:access');
      expect(registeredEvents).to.include('agent:decision');
    });
  });
  
  describe('observeToolExecution', function() {
    it('should record tool execution events', function() {
      const event = {
        tool: 'search_web',
        params: { query: 'test query' },
        timestamp: new Date().toISOString(),
        executionId: '12345'
      };
      
      prismObserver.observeToolExecution(event);
      
      // Verify observation was recorded
      expect(prismObserver.observations).to.be.an('array');
      expect(prismObserver.observations.length).to.equal(1);
      
      const observation = prismObserver.observations[0];
      expect(observation.type).to.equal('tool_execution');
      expect(observation.data).to.deep.equal(event);
      expect(observation).to.have.property('timestamp');
    });
    
    it('should update tool usage metrics', function() {
      const event = {
        tool: 'search_web',
        params: { query: 'test query' },
        timestamp: new Date().toISOString(),
        executionId: '12345'
      };
      
      prismObserver.observeToolExecution(event);
      
      // Verify metrics were updated
      expect(prismObserver.metrics.toolUsage).to.be.an('object');
      expect(prismObserver.metrics.toolUsage['search_web']).to.be.an('object');
      expect(prismObserver.metrics.toolUsage['search_web'].count).to.equal(1);
    });
    
    it('should respect sampling rate', function() {
      // Set sampling rate to 0 to skip all events
      prismObserver.samplingRate = 0;
      
      const event = {
        tool: 'search_web',
        params: { query: 'test query' },
        timestamp: new Date().toISOString(),
        executionId: '12345'
      };
      
      prismObserver.observeToolExecution(event);
      
      // Verify no observation was recorded
      expect(prismObserver.observations.length).to.equal(0);
    });
  });
  
  describe('observeMemoryAccess', function() {
    it('should record memory access events', function() {
      const event = {
        operation: 'read',
        memoryId: 'working_memory',
        key: 'user_query',
        timestamp: new Date().toISOString(),
        accessId: '12345'
      };
      
      prismObserver.observeMemoryAccess(event);
      
      // Verify observation was recorded
      expect(prismObserver.observations).to.be.an('array');
      expect(prismObserver.observations.length).to.equal(1);
      
      const observation = prismObserver.observations[0];
      expect(observation.type).to.equal('memory_access');
      expect(observation.data).to.deep.equal(event);
      expect(observation).to.have.property('timestamp');
    });
    
    it('should update memory access metrics', function() {
      const event = {
        operation: 'read',
        memoryId: 'working_memory',
        key: 'user_query',
        timestamp: new Date().toISOString(),
        accessId: '12345'
      };
      
      prismObserver.observeMemoryAccess(event);
      
      // Verify metrics were updated
      expect(prismObserver.metrics.memoryAccess).to.be.an('object');
      expect(prismObserver.metrics.memoryAccess['working_memory']).to.be.an('object');
      expect(prismObserver.metrics.memoryAccess['working_memory'].readCount).to.equal(1);
    });
  });
  
  describe('observeAgentDecision', function() {
    it('should record agent decision events', function() {
      const event = {
        decisionType: 'tool_selection',
        options: ['search_web', 'browser_navigate'],
        selected: 'search_web',
        reasoning: 'Based on user query',
        timestamp: new Date().toISOString(),
        decisionId: '12345'
      };
      
      prismObserver.observeAgentDecision(event);
      
      // Verify observation was recorded
      expect(prismObserver.observations).to.be.an('array');
      expect(prismObserver.observations.length).to.equal(1);
      
      const observation = prismObserver.observations[0];
      expect(observation.type).to.equal('agent_decision');
      expect(observation.data).to.deep.equal(event);
      expect(observation).to.have.property('timestamp');
    });
    
    it('should update decision metrics', function() {
      const event = {
        decisionType: 'tool_selection',
        options: ['search_web', 'browser_navigate'],
        selected: 'search_web',
        reasoning: 'Based on user query',
        timestamp: new Date().toISOString(),
        decisionId: '12345'
      };
      
      prismObserver.observeAgentDecision(event);
      
      // Verify metrics were updated
      expect(prismObserver.metrics.decisions).to.be.an('object');
      expect(prismObserver.metrics.decisions['tool_selection']).to.be.an('object');
      expect(prismObserver.metrics.decisions['tool_selection'].count).to.equal(1);
    });
  });
  
  describe('getObservations', function() {
    it('should return all observations', function() {
      // Add some test observations
      prismObserver.observations = [
        {
          type: 'tool_execution',
          data: { tool: 'search_web' },
          timestamp: new Date().toISOString()
        },
        {
          type: 'memory_access',
          data: { operation: 'read', memoryId: 'working_memory' },
          timestamp: new Date().toISOString()
        }
      ];
      
      const observations = prismObserver.getObservations();
      
      expect(observations).to.be.an('array');
      expect(observations.length).to.equal(2);
      expect(observations).to.deep.equal(prismObserver.observations);
    });
    
    it('should filter observations by type', function() {
      // Add some test observations
      prismObserver.observations = [
        {
          type: 'tool_execution',
          data: { tool: 'search_web' },
          timestamp: new Date().toISOString()
        },
        {
          type: 'memory_access',
          data: { operation: 'read', memoryId: 'working_memory' },
          timestamp: new Date().toISOString()
        },
        {
          type: 'tool_execution',
          data: { tool: 'browser_navigate' },
          timestamp: new Date().toISOString()
        }
      ];
      
      const observations = prismObserver.getObservations('tool_execution');
      
      expect(observations).to.be.an('array');
      expect(observations.length).to.equal(2);
      expect(observations[0].type).to.equal('tool_execution');
      expect(observations[1].type).to.equal('tool_execution');
    });
    
    it('should return empty array if no observations match', function() {
      // Add some test observations
      prismObserver.observations = [
        {
          type: 'tool_execution',
          data: { tool: 'search_web' },
          timestamp: new Date().toISOString()
        }
      ];
      
      const observations = prismObserver.getObservations('non_existent_type');
      
      expect(observations).to.be.an('array');
      expect(observations.length).to.equal(0);
    });
  });
  
  describe('getMetrics', function() {
    it('should return all metrics', function() {
      // Set up test metrics
      prismObserver.metrics = {
        toolUsage: {
          'search_web': { count: 5 }
        },
        memoryAccess: {
          'working_memory': { readCount: 10, writeCount: 5 }
        },
        decisions: {
          'tool_selection': { count: 8 }
        }
      };
      
      const metrics = prismObserver.getMetrics();
      
      expect(metrics).to.be.an('object');
      expect(metrics).to.deep.equal(prismObserver.metrics);
    });
    
    it('should return specific metric category if specified', function() {
      // Set up test metrics
      prismObserver.metrics = {
        toolUsage: {
          'search_web': { count: 5 }
        },
        memoryAccess: {
          'working_memory': { readCount: 10, writeCount: 5 }
        }
      };
      
      const metrics = prismObserver.getMetrics('toolUsage');
      
      expect(metrics).to.be.an('object');
      expect(metrics).to.deep.equal(prismObserver.metrics.toolUsage);
    });
    
    it('should return empty object if metric category does not exist', function() {
      prismObserver.metrics = {
        toolUsage: {
          'search_web': { count: 5 }
        }
      };
      
      const metrics = prismObserver.getMetrics('nonExistentCategory');
      
      expect(metrics).to.be.an('object');
      expect(Object.keys(metrics).length).to.equal(0);
    });
  });
  
  describe('analyzeObservations', function() {
    it('should analyze observations and generate insights', function() {
      // Set up test observations
      prismObserver.observations = [
        {
          type: 'tool_execution',
          data: { 
            tool: 'search_web',
            params: { query: 'weather forecast' },
            result: { success: true },
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        },
        {
          type: 'tool_execution',
          data: { 
            tool: 'search_web',
            params: { query: 'news today' },
            result: { success: false },
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        },
        {
          type: 'memory_access',
          data: { 
            operation: 'read',
            memoryId: 'working_memory',
            key: 'user_query',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
      ];
      
      const insights = prismObserver.analyzeObservations();
      
      expect(insights).to.be.an('object');
      expect(insights.toolUsagePatterns).to.be.an('object');
      expect(insights.memoryAccessPatterns).to.be.an('object');
      expect(insights.anomalies).to.be.an('array');
    });
    
    it('should identify tool usage patterns', function() {
      // Set up test observations with tool usage patterns
      const observations = [];
      
      // Add 10 search_web executions
      for (let i = 0; i < 10; i++) {
        observations.push({
          type: 'tool_execution',
          data: { 
            tool: 'search_web',
            params: { query: `query ${i}` },
            result: { success: true },
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Add 5 browser_navigate executions
      for (let i = 0; i < 5; i++) {
        observations.push({
          type: 'tool_execution',
          data: { 
            tool: 'browser_navigate',
            params: { url: `example${i}.com` },
            result: { success: true },
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }
      
      prismObserver.observations = observations;
      
      const insights = prismObserver.analyzeObservations();
      
      expect(insights.toolUsagePatterns).to.be.an('object');
      expect(insights.toolUsagePatterns.mostUsedTools).to.be.an('array');
      expect(insights.toolUsagePatterns.mostUsedTools[0].tool).to.equal('search_web');
      expect(insights.toolUsagePatterns.mostUsedTools[0].count).to.equal(10);
    });
    
    it('should identify memory access patterns', function() {
      // Set up test observations with memory access patterns
      const observations = [];
      
      // Add 10 working_memory reads
      for (let i = 0; i < 10; i++) {
        observations.push({
          type: 'memory_access',
          data: { 
            operation: 'read',
            memoryId: 'working_memory',
            key: `key${i % 3}`, // Create some repeated keys
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Add 5 working_memory writes
      for (let i = 0; i < 5; i++) {
        observations.push({
          type: 'memory_access',
          data: { 
            operation: 'write',
            memoryId: 'working_memory',
            key: `key${i % 2}`, // Create some repeated keys
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }
      
      prismObserver.observations = observations;
      
      const insights = prismObserver.analyzeObservations();
      
      expect(insights.memoryAccessPatterns).to.be.an('object');
      expect(insights.memoryAccessPatterns.mostAccessedMemory).to.equal('working_memory');
      expect(insights.memoryAccessPatterns.readWriteRatio).to.be.a('number');
      expect(insights.memoryAccessPatterns.readWriteRatio).to.equal(10 / 5);
    });
    
    it('should identify anomalies', function() {
      // Set up test observations with anomalies
      const observations = [];
      
      // Add normal observations
      for (let i = 0; i < 10; i++) {
        observations.push({
          type: 'tool_execution',
          data: { 
            tool: 'search_web',
            params: { query: `query ${i}` },
            result: { success: true },
            duration_ms: 500,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Add anomalous observation (very long duration)
      observations.push({
        type: 'tool_execution',
        data: { 
          tool: 'search_web',
          params: { query: 'anomalous query' },
          result: { success: true },
          duration_ms: 10000, // Much longer than others
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
      
      prismObserver.observations = observations;
      
      const insights = prismObserver.analyzeObservations();
      
      expect(insights.anomalies).to.be.an('array');
      expect(insights.anomalies.length).to.be.at.least(1);
      
      // Verify anomaly detection
      const durationAnomaly = insights.anomalies.find(
        anomaly => anomaly.type === 'duration_anomaly' && anomaly.tool === 'search_web'
      );
      expect(durationAnomaly).to.exist;
    });
    
    it('should handle empty observations', function() {
      prismObserver.observations = [];
      
      const insights = prismObserver.analyzeObservations();
      
      expect(insights).to.be.an('object');
      expect(insights.toolUsagePatterns).to.be.an('object');
      expect(insights.toolUsagePatterns.mostUsedTools).to.be.an('array');
      expect(insights.toolUsagePatterns.mostUsedTools.length).to.equal(0);
      expect(insights.anomalies).to.be.an('array');
      expect(insights.anomalies.length).to.equal(0);
    });
  });
  
  describe('detectConstitutionalViolations', function() {
    it('should detect constitutional violations', function() {
      // Set up test observations with potential violations
      prismObserver.observations = [
        {
          type: 'tool_execution',
          data: { 
            tool: 'shell_exec',
            params: { command: 'rm -rf /' }, // Dangerous command
            result: { success: false, error: 'Permission denied' },
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        },
        {
          type: 'memory_access',
          data: { 
            operation: 'write',
            memoryId: 'system_memory',
            key: 'protected_setting',
            value: 'modified_value',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
      ];
      
      const violations = prismObserver.detectConstitutionalViolations();
      
      expect(violations).to.be.an('array');
      expect(violations.length).to.be.at.least(1);
      
      // Verify violation detection
      const shellViolation = violations.find(
        violation => violation.type === 'dangerous_command' && violation.tool === 'shell_exec'
      );
      expect(shellViolation).to.exist;
    });
    
    it('should classify violations by severity', function() {
      // Set up test observations with violations of different severity
      prismObserver.observations = [
        {
          type: 'tool_execution',
          data: { 
            tool: 'shell_exec',
            params: { command: 'rm -rf /' }, // Critical violation
            result: { success: false, error: 'Permission denied' },
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        },
        {
          type: 'memory_access',
          data: { 
            operation: 'read',
            memoryId: 'user_memory',
            key: 'sensitive_data',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
      ];
      
      const violations = prismObserver.detectConstitutionalViolations();
      
      expect(violations).to.be.an('array');
      expect(violations.length).to.be.at.least(1);
      
      // Verify severity classification
      const criticalViolation = violations.find(
        violation => violation.severity === 'critical'
      );
      expect(criticalViolation).to.exist;
      
      const minorViolation = violations.find(
        violation => violation.severity === 'minor' || violation.severity === 'warning'
      );
      expect(minorViolation).to.exist;
    });
    
    it('should handle observations with no violations', function() {
      // Set up test observations with no violations
      prismObserver.observations = [
        {
          type: 'tool_execution',
          data: { 
            tool: 'search_web',
            params: { query: 'safe query' },
            result: { success: true },
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        },
        {
          type: 'memory_access',
          data: { 
            operation: 'read',
            memoryId: 'working_memory',
            key: 'user_query',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
      ];
      
      const violations = prismObserver.detectConstitutionalViolations();
      
      expect(violations).to.be.an('array');
      expect(violations.length).to.equal(0);
    });
  });
  
  describe('persistData', function() {
    it('should persist data to storage', function() {
      // Set up test data
      prismObserver.observations = [
        {
          type: 'tool_execution',
          data: { tool: 'search_web' },
          timestamp: new Date().toISOString()
        }
      ];
      
      prismObserver.metrics = {
        toolUsage: {
          'search_web': { count: 1 }
        }
      };
      
      prismObserver.persistData();
      
      expect(mockFs.writeFileSync.calledOnce).to.be.true;
      
      // Verify correct data is being written
      const dataArg = mockFs.writeFileSync.firstCall.args[1];
      const parsedData = JSON.parse(dataArg);
      
      expect(parsedData).to.have.property('observations');
      expect(parsedData).to.have.property('metrics');
      expect(parsedData.observations).to.deep.equal(prismObserver.observations);
      expect(parsedData.metrics).to.deep.equal(prismObserver.metrics);
    });
    
    it('should handle errors during persistence', function() {
      // Make writeFileSync throw an error
      mockFs.writeFileSync.throws(new Error('Test error'));
      
      // This should not throw
      prismObserver.persistData();
      
      // Verify attempt was made
      expect(mockFs.writeFileSync.calledOnce).to.be.true;
    });
  });
  
  describe('loadData', function() {
    it('should load data from storage', function() {
      // Set up test data to be loaded
      const testData = {
        observations: [
          {
            type: 'tool_execution',
            data: { tool: 'search_web' },
            timestamp: new Date().toISOString()
          }
        ],
        metrics: {
          toolUsage: {
            'search_web': { count: 1 }
          }
        }
      };
      
      mockFs.readFileSync.returns(JSON.stringify(testData));
      
      prismObserver.loadData();
      
      expect(mockFs.readFileSync.calledOnce).to.be.true;
      expect(prismObserver.observations).to.deep.equal(testData.observations);
      expect(prismObserver.metrics).to.deep.equal(testData.metrics);
    });
    
    it('should handle non-existent data file', function() {
      // Make existsSync return false for data file
      mockFs.existsSync.returns(false);
      
      prismObserver.loadData();
      
      // Verify readFileSync was not called
      expect(mockFs.readFileSync.called).to.be.false;
      
      // Verify default empty data structures
      expect(prismObserver.observations).to.be.an('array').that.is.empty;
      expect(prismObserver.metrics).to.deep.equal({});
    });
    
    it('should handle errors during loading', function() {
      // Make readFileSync throw an error
      mockFs.readFileSync.throws(new Error('Test error'));
      
      // This should not throw
      prismObserver.loadData();
      
      // Verify attempt was made
      expect(mockFs.readFileSync.calledOnce).to.be.true;
      
      // Verify default empty data structures
      expect(prismObserver.observations).to.be.an('array').that.is.empty;
      expect(prismObserver.metrics).to.deep.equal({});
    });
  });
  
  describe('cleanup', function() {
    it('should clean up resources and remove event listeners', function() {
      prismObserver.cleanup();
      
      // Verify event listeners were removed
      expect(mockEventEmitter.removeListener.called).to.be.true;
      
      // Verify specific events were unregistered
      const unregisteredEvents = mockEventEmitter.removeListener.args.map(args => args[0]);
      expect(unregisteredEvents).to.include('tool:execution');
      expect(unregisteredEvents).to.include('memory:access');
      expect(unregisteredEvents).to.include('agent:decision');
    });
  });
});
