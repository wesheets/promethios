/**
 * Unit Tests for VIGIL Observer
 * 
 * Tests the functionality of the VIGIL observer component for
 * monitoring and enforcing constitutional compliance.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const { VigilObserver } = require('../../../../src/observers/vigil/index');

describe('VigilObserver', function() {
  let vigilObserver;
  let sandbox;
  let mockFs;
  let mockEventEmitter;
  let mockConstitutionalHooks;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock file system operations
    mockFs = {
      mkdirSync: sandbox.stub(fs, 'mkdirSync').returns(true),
      existsSync: sandbox.stub(fs, 'existsSync').returns(true),
      writeFileSync: sandbox.stub(fs, 'writeFileSync').returns(true),
      readFileSync: sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
        violations: [],
        enforcements: [],
        metrics: {}
      }))
    };
    
    // Mock event emitter
    mockEventEmitter = {
      on: sandbox.stub(),
      emit: sandbox.stub(),
      removeListener: sandbox.stub()
    };
    
    // Mock constitutional hooks
    mockConstitutionalHooks = {
      getConstitutionalRules: sandbox.stub().returns([
        {
          id: 'rule1',
          name: 'No Dangerous Commands',
          description: 'Prevents execution of dangerous system commands',
          severity: 'critical',
          check: sandbox.stub().returns(true)
        },
        {
          id: 'rule2',
          name: 'Memory Protection',
          description: 'Prevents unauthorized memory access',
          severity: 'high',
          check: sandbox.stub().returns(true)
        }
      ]),
      enforceRule: sandbox.stub().returns({
        enforced: true,
        action: 'blocked',
        details: 'Action blocked due to constitutional violation'
      })
    };
    
    // Create test instance
    vigilObserver = new VigilObserver({
      dataDir: '/test/data/dir',
      eventEmitter: mockEventEmitter,
      constitutionalHooks: mockConstitutionalHooks
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
      const observer = new VigilObserver({
        dataDir: '/test/data/dir',
        eventEmitter: mockEventEmitter,
        constitutionalHooks: mockConstitutionalHooks
      });
      
      expect(mockFs.mkdirSync.calledOnce).to.be.true;
      expect(mockFs.mkdirSync.calledWith('/test/data/dir', { recursive: true })).to.be.true;
    });
    
    it('should initialize with default settings if not provided', function() {
      const observer = new VigilObserver({
        eventEmitter: mockEventEmitter,
        constitutionalHooks: mockConstitutionalHooks
      });
      
      expect(observer.dataDir).to.equal(path.join(process.cwd(), 'data/vigil_observer'));
      expect(observer.violations).to.be.an('array');
      expect(observer.enforcements).to.be.an('array');
      expect(observer.metrics).to.be.an('object');
    });
    
    it('should use provided settings if available', function() {
      const observer = new VIGILObserver({
        dataDir: '/custom/data/dir',
        enforcementLevel: 'strict',
        eventEmitter: mockEventEmitter,
        constitutionalHooks: mockConstitutionalHooks
      });
      
      expect(observer.dataDir).to.equal('/custom/data/dir');
      expect(observer.enforcementLevel).to.equal('strict');
    });
    
    it('should throw error if required dependencies are not provided', function() {
      expect(() => new VigilObserver({
        // Missing eventEmitter
        constitutionalHooks: mockConstitutionalHooks
      })).to.throw('EventEmitter is required');
      
      expect(() => new VigilObserver({
        eventEmitter: mockEventEmitter,
        // Missing constitutionalHooks
      })).to.throw('ConstitutionalHooks is required');
    });
    
    it('should register event listeners', function() {
      // Verify event listeners were registered
      expect(mockEventEmitter.on.called).to.be.true;
      
      // Verify specific events were registered
      const registeredEvents = mockEventEmitter.on.args.map(args => args[0]);
      expect(registeredEvents).to.include('tool:pre-execution');
      expect(registeredEvents).to.include('memory:pre-access');
      expect(registeredEvents).to.include('constitutional:violation');
    });
    
    it('should load constitutional rules', function() {
      expect(mockConstitutionalHooks.getConstitutionalRules.calledOnce).to.be.true;
      expect(vigilObserver.constitutionalRules).to.be.an('array');
      expect(vigilObserver.constitutionalRules.length).to.equal(2);
    });
  });
  
  describe('monitorToolExecution', function() {
    it('should check tool execution against constitutional rules', function() {
      const event = {
        tool: 'shell_exec',
        params: { command: 'rm -rf /' },
        executionId: '12345',
        timestamp: new Date().toISOString()
      };
      
      // Set up rule check to detect violation
      const dangerousCommandRule = vigilObserver.constitutionalRules.find(rule => rule.id === 'rule1');
      dangerousCommandRule.check.returns(false);
      
      const result = vigilObserver.monitorToolExecution(event);
      
      // Verify rule was checked
      expect(dangerousCommandRule.check.calledOnce).to.be.true;
      expect(dangerousCommandRule.check.calledWith(event)).to.be.true;
      
      // Verify violation was detected
      expect(result.allowed).to.be.false;
      expect(result.violations).to.be.an('array');
      expect(result.violations.length).to.equal(1);
      expect(result.violations[0].ruleId).to.equal('rule1');
    });
    
    it('should allow execution if no violations are detected', function() {
      const event = {
        tool: 'search_web',
        params: { query: 'safe query' },
        executionId: '12345',
        timestamp: new Date().toISOString()
      };
      
      // Set up all rules to pass
      vigilObserver.constitutionalRules.forEach(rule => {
        rule.check.returns(true);
      });
      
      const result = vigilObserver.monitorToolExecution(event);
      
      // Verify rules were checked
      vigilObserver.constitutionalRules.forEach(rule => {
        expect(rule.check.calledOnce).to.be.true;
      });
      
      // Verify execution was allowed
      expect(result.allowed).to.be.true;
      expect(result.violations).to.be.an('array');
      expect(result.violations.length).to.equal(0);
    });
    
    it('should record violations in history', function() {
      const event = {
        tool: 'shell_exec',
        params: { command: 'rm -rf /' },
        executionId: '12345',
        timestamp: new Date().toISOString()
      };
      
      // Set up rule check to detect violation
      const dangerousCommandRule = vigilObserver.constitutionalRules.find(rule => rule.id === 'rule1');
      dangerousCommandRule.check.returns(false);
      
      vigilObserver.monitorToolExecution(event);
      
      // Verify violation was recorded
      expect(vigilObserver.violations).to.be.an('array');
      expect(vigilObserver.violations.length).to.equal(1);
      
      const violation = vigilObserver.violations[0];
      expect(violation.ruleId).to.equal('rule1');
      expect(violation.tool).to.equal('shell_exec');
      expect(violation.severity).to.equal('critical');
      expect(violation).to.have.property('timestamp');
    });
    
    it('should update violation metrics', function() {
      const event = {
        tool: 'shell_exec',
        params: { command: 'rm -rf /' },
        executionId: '12345',
        timestamp: new Date().toISOString()
      };
      
      // Set up rule check to detect violation
      const dangerousCommandRule = vigilObserver.constitutionalRules.find(rule => rule.id === 'rule1');
      dangerousCommandRule.check.returns(false);
      
      vigilObserver.monitorToolExecution(event);
      
      // Verify metrics were updated
      expect(vigilObserver.metrics.violations).to.be.an('object');
      expect(vigilObserver.metrics.violations.byRule).to.be.an('object');
      expect(vigilObserver.metrics.violations.byRule['rule1']).to.equal(1);
      expect(vigilObserver.metrics.violations.byTool).to.be.an('object');
      expect(vigilObserver.metrics.violations.byTool['shell_exec']).to.equal(1);
    });
  });
  
  describe('monitorMemoryAccess', function() {
    it('should check memory access against constitutional rules', function() {
      const event = {
        operation: 'write',
        memoryId: 'system_memory',
        key: 'protected_setting',
        value: 'modified_value',
        accessId: '12345',
        timestamp: new Date().toISOString()
      };
      
      // Set up rule check to detect violation
      const memoryProtectionRule = vigilObserver.constitutionalRules.find(rule => rule.id === 'rule2');
      memoryProtectionRule.check.returns(false);
      
      const result = vigilObserver.monitorMemoryAccess(event);
      
      // Verify rule was checked
      expect(memoryProtectionRule.check.calledOnce).to.be.true;
      expect(memoryProtectionRule.check.calledWith(event)).to.be.true;
      
      // Verify violation was detected
      expect(result.allowed).to.be.false;
      expect(result.violations).to.be.an('array');
      expect(result.violations.length).to.equal(1);
      expect(result.violations[0].ruleId).to.equal('rule2');
    });
    
    it('should allow access if no violations are detected', function() {
      const event = {
        operation: 'read',
        memoryId: 'working_memory',
        key: 'user_query',
        accessId: '12345',
        timestamp: new Date().toISOString()
      };
      
      // Set up all rules to pass
      vigilObserver.constitutionalRules.forEach(rule => {
        rule.check.returns(true);
      });
      
      const result = vigilObserver.monitorMemoryAccess(event);
      
      // Verify rules were checked
      vigilObserver.constitutionalRules.forEach(rule => {
        expect(rule.check.calledOnce).to.be.true;
      });
      
      // Verify access was allowed
      expect(result.allowed).to.be.true;
      expect(result.violations).to.be.an('array');
      expect(result.violations.length).to.equal(0);
    });
    
    it('should record violations in history', function() {
      const event = {
        operation: 'write',
        memoryId: 'system_memory',
        key: 'protected_setting',
        value: 'modified_value',
        accessId: '12345',
        timestamp: new Date().toISOString()
      };
      
      // Set up rule check to detect violation
      const memoryProtectionRule = vigilObserver.constitutionalRules.find(rule => rule.id === 'rule2');
      memoryProtectionRule.check.returns(false);
      
      vigilObserver.monitorMemoryAccess(event);
      
      // Verify violation was recorded
      expect(vigilObserver.violations).to.be.an('array');
      expect(vigilObserver.violations.length).to.equal(1);
      
      const violation = vigilObserver.violations[0];
      expect(violation.ruleId).to.equal('rule2');
      expect(violation.memoryId).to.equal('system_memory');
      expect(violation.severity).to.equal('high');
      expect(violation).to.have.property('timestamp');
    });
  });
  
  describe('enforceConstitutionalRules', function() {
    it('should enforce rules based on violations', function() {
      const violations = [
        {
          ruleId: 'rule1',
          tool: 'shell_exec',
          params: { command: 'rm -rf /' },
          severity: 'critical',
          timestamp: new Date().toISOString()
        }
      ];
      
      const context = {
        executionId: '12345',
        tool: 'shell_exec',
        params: { command: 'rm -rf /' }
      };
      
      const result = vigilObserver.enforceConstitutionalRules(violations, context);
      
      // Verify enforcement was applied
      expect(result.enforced).to.be.true;
      expect(result.action).to.equal('blocked');
      
      // Verify constitutional hooks were called
      expect(mockConstitutionalHooks.enforceRule.calledOnce).to.be.true;
      expect(mockConstitutionalHooks.enforceRule.calledWith('rule1', context)).to.be.true;
    });
    
    it('should record enforcement actions', function() {
      const violations = [
        {
          ruleId: 'rule1',
          tool: 'shell_exec',
          params: { command: 'rm -rf /' },
          severity: 'critical',
          timestamp: new Date().toISOString()
        }
      ];
      
      const context = {
        executionId: '12345',
        tool: 'shell_exec',
        params: { command: 'rm -rf /' }
      };
      
      vigilObserver.enforceConstitutionalRules(violations, context);
      
      // Verify enforcement was recorded
      expect(vigilObserver.enforcements).to.be.an('array');
      expect(vigilObserver.enforcements.length).to.equal(1);
      
      const enforcement = vigilObserver.enforcements[0];
      expect(enforcement.ruleId).to.equal('rule1');
      expect(enforcement.action).to.equal('blocked');
      expect(enforcement).to.have.property('timestamp');
    });
    
    it('should update enforcement metrics', function() {
      const violations = [
        {
          ruleId: 'rule1',
          tool: 'shell_exec',
          params: { command: 'rm -rf /' },
          severity: 'critical',
          timestamp: new Date().toISOString()
        }
      ];
      
      const context = {
        executionId: '12345',
        tool: 'shell_exec',
        params: { command: 'rm -rf /' }
      };
      
      vigilObserver.enforceConstitutionalRules(violations, context);
      
      // Verify metrics were updated
      expect(vigilObserver.metrics.enforcements).to.be.an('object');
      expect(vigilObserver.metrics.enforcements.byRule).to.be.an('object');
      expect(vigilObserver.metrics.enforcements.byRule['rule1']).to.equal(1);
      expect(vigilObserver.metrics.enforcements.byAction).to.be.an('object');
      expect(vigilObserver.metrics.enforcements.byAction['blocked']).to.equal(1);
    });
    
    it('should handle empty violations array', function() {
      const violations = [];
      
      const context = {
        executionId: '12345',
        tool: 'search_web',
        params: { query: 'safe query' }
      };
      
      const result = vigilObserver.enforceConstitutionalRules(violations, context);
      
      // Verify no enforcement was applied
      expect(result.enforced).to.be.false;
      expect(result.action).to.equal('allowed');
      
      // Verify constitutional hooks were not called
      expect(mockConstitutionalHooks.enforceRule.called).to.be.false;
    });
  });
  
  describe('handleConstitutionalViolation', function() {
    it('should handle external violation reports', function() {
      const violation = {
        ruleId: 'external_rule',
        source: 'external_system',
        severity: 'high',
        details: 'External violation detected',
        timestamp: new Date().toISOString()
      };
      
      vigilObserver.handleConstitutionalViolation(violation);
      
      // Verify violation was recorded
      expect(vigilObserver.violations).to.be.an('array');
      expect(vigilObserver.violations.length).to.equal(1);
      
      const recordedViolation = vigilObserver.violations[0];
      expect(recordedViolation.ruleId).to.equal('external_rule');
      expect(recordedViolation.source).to.equal('external_system');
      expect(recordedViolation).to.have.property('timestamp');
    });
    
    it('should emit enforcement event for external violations', function() {
      const violation = {
        ruleId: 'external_rule',
        source: 'external_system',
        severity: 'high',
        details: 'External violation detected',
        timestamp: new Date().toISOString()
      };
      
      vigilObserver.handleConstitutionalViolation(violation);
      
      // Verify event was emitted
      expect(mockEventEmitter.emit.calledOnce).to.be.true;
      expect(mockEventEmitter.emit.firstCall.args[0]).to.equal('constitutional:enforcement');
    });
  });
  
  describe('getViolations', function() {
    it('should return all violations', function() {
      // Add some test violations
      vigilObserver.violations = [
        {
          ruleId: 'rule1',
          tool: 'shell_exec',
          severity: 'critical',
          timestamp: new Date().toISOString()
        },
        {
          ruleId: 'rule2',
          memoryId: 'system_memory',
          severity: 'high',
          timestamp: new Date().toISOString()
        }
      ];
      
      const violations = vigilObserver.getViolations();
      
      expect(violations).to.be.an('array');
      expect(violations.length).to.equal(2);
      expect(violations).to.deep.equal(vigilObserver.violations);
    });
    
    it('should filter violations by rule ID', function() {
      // Add some test violations
      vigilObserver.violations = [
        {
          ruleId: 'rule1',
          tool: 'shell_exec',
          severity: 'critical',
          timestamp: new Date().toISOString()
        },
        {
          ruleId: 'rule2',
          memoryId: 'system_memory',
          severity: 'high',
          timestamp: new Date().toISOString()
        },
        {
          ruleId: 'rule1',
          tool: 'browser_navigate',
          severity: 'critical',
          timestamp: new Date().toISOString()
        }
      ];
      
      const violations = vigilObserver.getViolations('rule1');
      
      expect(violations).to.be.an('array');
      expect(violations.length).to.equal(2);
      expect(violations[0].ruleId).to.equal('rule1');
      expect(violations[1].ruleId).to.equal('rule1');
    });
    
    it('should filter violations by severity', function() {
      // Add some test violations
      vigilObserver.violations = [
        {
          ruleId: 'rule1',
          tool: 'shell_exec',
          severity: 'critical',
          timestamp: new Date().toISOString()
        },
        {
          ruleId: 'rule2',
          memoryId: 'system_memory',
          severity: 'high',
          timestamp: new Date().toISOString()
        },
        {
          ruleId: 'rule3',
          tool: 'browser_navigate',
          severity: 'critical',
          timestamp: new Date().toISOString()
        }
      ];
      
      const violations = vigilObserver.getViolations(null, 'critical');
      
      expect(violations).to.be.an('array');
      expect(violations.length).to.equal(2);
      expect(violations[0].severity).to.equal('critical');
      expect(violations[1].severity).to.equal('critical');
    });
    
    it('should return empty array if no violations match', function() {
      // Add some test violations
      vigilObserver.violations = [
        {
          ruleId: 'rule1',
          tool: 'shell_exec',
          severity: 'critical',
          timestamp: new Date().toISOString()
        }
      ];
      
      const violations = vigilObserver.getViolations('non_existent_rule');
      
      expect(violations).to.be.an('array');
      expect(violations.length).to.equal(0);
    });
  });
  
  describe('getEnforcements', function() {
    it('should return all enforcements', function() {
      // Add some test enforcements
      vigilObserver.enforcements = [
        {
          ruleId: 'rule1',
          action: 'blocked',
          context: { tool: 'shell_exec' },
          timestamp: new Date().toISOString()
        },
        {
          ruleId: 'rule2',
          action: 'warned',
          context: { memoryId: 'system_memory' },
          timestamp: new Date().toISOString()
        }
      ];
      
      const enforcements = vigilObserver.getEnforcements();
      
      expect(enforcements).to.be.an('array');
      expect(enforcements.length).to.equal(2);
      expect(enforcements).to.deep.equal(vigilObserver.enforcements);
    });
    
    it('should filter enforcements by action', function() {
      // Add some test enforcements
      vigilObserver.enforcements = [
        {
          ruleId: 'rule1',
          action: 'blocked',
          context: { tool: 'shell_exec' },
          timestamp: new Date().toISOString()
        },
        {
          ruleId: 'rule2',
          action: 'warned',
          context: { memoryId: 'system_memory' },
          timestamp: new Date().toISOString()
        },
        {
          ruleId: 'rule3',
          action: 'blocked',
          context: { tool: 'browser_navigate' },
          timestamp: new Date().toISOString()
        }
      ];
      
      const enforcements = vigilObserver.getEnforcements('blocked');
      
      expect(enforcements).to.be.an('array');
      expect(enforcements.length).to.equal(2);
      expect(enforcements[0].action).to.equal('blocked');
      expect(enforcements[1].action).to.equal('blocked');
    });
  });
  
  describe('getMetrics', function() {
    it('should return all metrics', function() {
      // Set up test metrics
      vigilObserver.metrics = {
        violations: {
          byRule: { 'rule1': 5 },
          byTool: { 'shell_exec': 5 },
          bySeverity: { 'critical': 5 }
        },
        enforcements: {
          byRule: { 'rule1': 5 },
          byAction: { 'blocked': 5 }
        }
      };
      
      const metrics = vigilObserver.getMetrics();
      
      expect(metrics).to.be.an('object');
      expect(metrics).to.deep.equal(vigilObserver.metrics);
    });
    
    it('should return specific metric category if specified', function() {
      // Set up test metrics
      vigilObserver.metrics = {
        violations: {
          byRule: { 'rule1': 5 },
          byTool: { 'shell_exec': 5 }
        },
        enforcements: {
          byRule: { 'rule1': 5 },
          byAction: { 'blocked': 5 }
        }
      };
      
      const metrics = vigilObserver.getMetrics('violations');
      
      expect(metrics).to.be.an('object');
      expect(metrics).to.deep.equal(vigilObserver.metrics.violations);
    });
    
    it('should return empty object if metric category does not exist', function() {
      vigilObserver.metrics = {
        violations: {
          byRule: { 'rule1': 5 }
        }
      };
      
      const metrics = vigilObserver.getMetrics('nonExistentCategory');
      
      expect(metrics).to.be.an('object');
      expect(Object.keys(metrics).length).to.equal(0);
    });
  });
  
  describe('analyzeComplianceStatus', function() {
    it('should analyze compliance status', function() {
      // Set up test violations and enforcements
      vigilObserver.violations = [
        {
          ruleId: 'rule1',
          tool: 'shell_exec',
          severity: 'critical',
          timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          ruleId: 'rule2',
          memoryId: 'system_memory',
          severity: 'high',
          timestamp: new Date().toISOString() // Now
        }
      ];
      
      vigilObserver.enforcements = [
        {
          ruleId: 'rule1',
          action: 'blocked',
          context: { tool: 'shell_exec' },
          timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        }
      ];
      
      const status = vigilObserver.analyzeComplianceStatus();
      
      expect(status).to.be.an('object');
      expect(status.compliant).to.be.a('boolean');
      expect(status.violationCount).to.equal(2);
      expect(status.enforcementCount).to.equal(1);
      expect(status.recentViolations).to.be.an('array');
      expect(status.recentViolations.length).to.equal(1); // Only the recent one
      expect(status.criticalViolations).to.be.an('array');
      expect(status.criticalViolations.length).to.equal(1);
    });
    
    it('should calculate compliance score', function() {
      // Set up test violations with different severities
      vigilObserver.violations = [
        {
          ruleId: 'rule1',
          tool: 'shell_exec',
          severity: 'critical',
          timestamp: new Date().toISOString()
        },
        {
          ruleId: 'rule2',
          memoryId: 'system_memory',
          severity: 'high',
          timestamp: new Date().toISOString()
        },
        {
          ruleId: 'rule3',
          tool: 'browser_navigate',
          severity: 'low',
          timestamp: new Date().toISOString()
        }
      ];
      
      const status = vigilObserver.analyzeComplianceStatus();
      
      expect(status.complianceScore).to.be.a('number');
      expect(status.complianceScore).to.be.lessThan(100); // Score should be reduced due to violations
    });
    
    it('should handle empty violations and enforcements', function() {
      vigilObserver.violations = [];
      vigilObserver.enforcements = [];
      
      const status = vigilObserver.analyzeComplianceStatus();
      
      expect(status.compliant).to.be.true;
      expect(status.violationCount).to.equal(0);
      expect(status.enforcementCount).to.equal(0);
      expect(status.complianceScore).to.equal(100); // Perfect score with no violations
    });
  });
  
  describe('persistData', function() {
    it('should persist data to storage', function() {
      // Set up test data
      vigilObserver.violations = [
        {
          ruleId: 'rule1',
          tool: 'shell_exec',
          severity: 'critical',
          timestamp: new Date().toISOString()
        }
      ];
      
      vigilObserver.enforcements = [
        {
          ruleId: 'rule1',
          action: 'blocked',
          context: { tool: 'shell_exec' },
          timestamp: new Date().toISOString()
        }
      ];
      
      vigilObserver.metrics = {
        violations: {
          byRule: { 'rule1': 1 }
        }
      };
      
      vigilObserver.persistData();
      
      expect(mockFs.writeFileSync.calledOnce).to.be.true;
      
      // Verify correct data is being written
      const dataArg = mockFs.writeFileSync.firstCall.args[1];
      const parsedData = JSON.parse(dataArg);
      
      expect(parsedData).to.have.property('violations');
      expect(parsedData).to.have.property('enforcements');
      expect(parsedData).to.have.property('metrics');
      expect(parsedData.violations).to.deep.equal(vigilObserver.violations);
      expect(parsedData.enforcements).to.deep.equal(vigilObserver.enforcements);
      expect(parsedData.metrics).to.deep.equal(vigilObserver.metrics);
    });
    
    it('should handle errors during persistence', function() {
      // Make writeFileSync throw an error
      mockFs.writeFileSync.throws(new Error('Test error'));
      
      // This should not throw
      vigilObserver.persistData();
      
      // Verify attempt was made
      expect(mockFs.writeFileSync.calledOnce).to.be.true;
    });
  });
  
  describe('loadData', function() {
    it('should load data from storage', function() {
      // Set up test data to be loaded
      const testData = {
        violations: [
          {
            ruleId: 'rule1',
            tool: 'shell_exec',
            severity: 'critical',
            timestamp: new Date().toISOString()
          }
        ],
        enforcements: [
          {
            ruleId: 'rule1',
            action: 'blocked',
            context: { tool: 'shell_exec' },
            timestamp: new Date().toISOString()
          }
        ],
        metrics: {
          violations: {
            byRule: { 'rule1': 1 }
          }
        }
      };
      
      mockFs.readFileSync.returns(JSON.stringify(testData));
      
      vigilObserver.loadData();
      
      expect(mockFs.readFileSync.calledOnce).to.be.true;
      expect(vigilObserver.violations).to.deep.equal(testData.violations);
      expect(vigilObserver.enforcements).to.deep.equal(testData.enforcements);
      expect(vigilObserver.metrics).to.deep.equal(testData.metrics);
    });
    
    it('should handle non-existent data file', function() {
      // Make existsSync return false for data file
      mockFs.existsSync.returns(false);
      
      vigilObserver.loadData();
      
      // Verify readFileSync was not called
      expect(mockFs.readFileSync.called).to.be.false;
      
      // Verify default empty data structures
      expect(vigilObserver.violations).to.be.an('array').that.is.empty;
      expect(vigilObserver.enforcements).to.be.an('array').that.is.empty;
      expect(vigilObserver.metrics).to.deep.equal({});
    });
    
    it('should handle errors during loading', function() {
      // Make readFileSync throw an error
      mockFs.readFileSync.throws(new Error('Test error'));
      
      // This should not throw
      vigilObserver.loadData();
      
      // Verify attempt was made
      expect(mockFs.readFileSync.calledOnce).to.be.true;
      
      // Verify default empty data structures
      expect(vigilObserver.violations).to.be.an('array').that.is.empty;
      expect(vigilObserver.enforcements).to.be.an('array').that.is.empty;
      expect(vigilObserver.metrics).to.deep.equal({});
    });
  });
  
  describe('cleanup', function() {
    it('should clean up resources and remove event listeners', function() {
      vigilObserver.cleanup();
      
      // Verify event listeners were removed
      expect(mockEventEmitter.removeListener.called).to.be.true;
      
      // Verify specific events were unregistered
      const unregisteredEvents = mockEventEmitter.removeListener.args.map(args => args[0]);
      expect(unregisteredEvents).to.include('tool:pre-execution');
      expect(unregisteredEvents).to.include('memory:pre-access');
      expect(unregisteredEvents).to.include('constitutional:violation');
    });
  });
});
