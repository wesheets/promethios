/**
 * Unit tests for PRISM Observer (Belief Trace Auditor)
 * 
 * These tests verify the core functionality of the PRISM observer,
 * including belief trace compliance monitoring and manifest validation.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { PrismObserver } = require('../../../src/observers/prism/index');
const BeliefTraceManager = require('../../../src/modules/belief_trace/index');

describe('PRISM Observer', () => {
  let prismObserver;
  let mockBeliefTraceManager;
  let mockLogger;
  
  beforeEach(() => {
    // Mock dependencies
    mockBeliefTraceManager = {
      verifyTrace: sinon.stub().returns({ verified: true, confidence: 0.95 }),
      createTrace: sinon.stub().returns({ id: 'trace-123', sourceType: 'test' })
    };
    
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create PRISM observer instance with mocked dependencies
    prismObserver = new PrismObserver({
      beliefTraceManager: mockBeliefTraceManager,
      logger: mockLogger,
      config: {
        validationLevel: 'standard',
        samplingRate: 1.0,
        alertThresholds: {
          missingTrace: 'warning',
          invalidManifest: 'error',
          undeclaredRoute: 'warning'
        }
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('initialization', () => {
    it('should initialize with correct default settings', () => {
      expect(prismObserver).to.be.an('object');
      expect(prismObserver.mode).to.equal('passive');
      expect(prismObserver.status).to.equal('active');
      expect(prismObserver.validationLevel).to.equal('standard');
    });
    
    it('should initialize analytics storage', () => {
      expect(prismObserver.analytics).to.be.an('object');
      expect(prismObserver.analytics.violationCounts).to.be.an('object');
      expect(prismObserver.analytics.validationResults).to.be.an('array');
    });
  });
  
  describe('monitorBeliefTrace', () => {
    it('should detect missing trace information', () => {
      const belief = {
        id: 'belief-123',
        content: 'This is a test belief',
        // No trace information
      };
      
      const result = prismObserver.monitorBeliefTrace(belief);
      
      expect(result.status).to.equal('warning');
      expect(result.violations).to.have.lengthOf(1);
      expect(result.violations[0].type).to.equal('missingTrace');
      expect(prismObserver.analytics.violationCounts.missingTrace).to.equal(1);
    });
    
    it('should validate belief with proper trace', () => {
      const belief = {
        id: 'belief-123',
        content: 'This is a test belief',
        trace: {
          id: 'trace-456',
          sourceType: 'user_input',
          timestamp: Date.now()
        }
      };
      
      const result = prismObserver.monitorBeliefTrace(belief);
      
      expect(result.status).to.equal('success');
      expect(result.violations).to.have.lengthOf(0);
    });
    
    it('should verify trace when verification is enabled', () => {
      const belief = {
        id: 'belief-123',
        content: 'This is a test belief',
        trace: {
          id: 'trace-456',
          sourceType: 'user_input',
          timestamp: Date.now()
        }
      };
      
      prismObserver.config.verifyTraces = true;
      const result = prismObserver.monitorBeliefTrace(belief);
      
      expect(mockBeliefTraceManager.verifyTrace.calledOnce).to.be.true;
      expect(result.status).to.equal('success');
      expect(result.verification).to.be.an('object');
      expect(result.verification.verified).to.be.true;
    });
  });
  
  describe('validateManifest', () => {
    it('should detect invalid manifest schema', () => {
      const manifest = {
        name: 'test-manifest',
        // Missing required fields
      };
      
      const schema = {
        type: 'object',
        required: ['name', 'version', 'description'],
        properties: {
          name: { type: 'string' },
          version: { type: 'string' },
          description: { type: 'string' }
        }
      };
      
      const result = prismObserver.validateManifest(manifest, schema);
      
      expect(result.status).to.equal('error');
      expect(result.violations).to.have.lengthOf(2); // Missing version and description
      expect(prismObserver.analytics.violationCounts.invalidManifest).to.equal(2);
    });
    
    it('should validate compliant manifest', () => {
      const manifest = {
        name: 'test-manifest',
        version: '1.0.0',
        description: 'Test manifest for PRISM observer'
      };
      
      const schema = {
        type: 'object',
        required: ['name', 'version', 'description'],
        properties: {
          name: { type: 'string' },
          version: { type: 'string' },
          description: { type: 'string' }
        }
      };
      
      const result = prismObserver.validateManifest(manifest, schema);
      
      expect(result.status).to.equal('success');
      expect(result.violations).to.have.lengthOf(0);
    });
  });
  
  describe('detectUndeclaredRoutes', () => {
    it('should detect undeclared API routes', () => {
      const declaredRoutes = ['/api/v1/users', '/api/v1/posts'];
      const actualRoutes = ['/api/v1/users', '/api/v1/posts', '/api/v1/comments'];
      
      const result = prismObserver.detectUndeclaredRoutes(declaredRoutes, actualRoutes);
      
      expect(result.status).to.equal('warning');
      expect(result.violations).to.have.lengthOf(1);
      expect(result.violations[0].route).to.equal('/api/v1/comments');
      expect(prismObserver.analytics.violationCounts.undeclaredRoute).to.equal(1);
    });
    
    it('should validate when all routes are declared', () => {
      const declaredRoutes = ['/api/v1/users', '/api/v1/posts', '/api/v1/comments'];
      const actualRoutes = ['/api/v1/users', '/api/v1/posts'];
      
      const result = prismObserver.detectUndeclaredRoutes(declaredRoutes, actualRoutes);
      
      expect(result.status).to.equal('success');
      expect(result.violations).to.have.lengthOf(0);
    });
  });
  
  describe('getAnalytics', () => {
    it('should return analytics data', () => {
      // Generate some test data
      prismObserver.analytics.violationCounts.missingTrace = 3;
      prismObserver.analytics.violationCounts.invalidManifest = 1;
      prismObserver.analytics.validationResults.push({
        timestamp: Date.now(),
        type: 'beliefTrace',
        status: 'warning'
      });
      
      const analytics = prismObserver.getAnalytics();
      
      expect(analytics).to.be.an('object');
      expect(analytics.violationCounts.missingTrace).to.equal(3);
      expect(analytics.violationCounts.invalidManifest).to.equal(1);
      expect(analytics.validationResults).to.have.lengthOf(1);
    });
  });
  
  describe('handleHook', () => {
    it('should process belief generation hook', () => {
      const hookData = {
        type: 'beliefGeneration',
        data: {
          belief: {
            id: 'belief-123',
            content: 'This is a test belief',
            trace: {
              id: 'trace-456',
              sourceType: 'user_input',
              timestamp: Date.now()
            }
          }
        }
      };
      
      const spy = sinon.spy(prismObserver, 'monitorBeliefTrace');
      prismObserver.handleHook(hookData);
      
      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.deep.equal(hookData.data.belief);
    });
    
    it('should process manifest validation hook', () => {
      const hookData = {
        type: 'manifestValidation',
        data: {
          manifest: {
            name: 'test-manifest',
            version: '1.0.0',
            description: 'Test manifest for PRISM observer'
          },
          schema: {
            type: 'object',
            required: ['name', 'version', 'description'],
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      };
      
      const spy = sinon.spy(prismObserver, 'validateManifest');
      prismObserver.handleHook(hookData);
      
      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.deep.equal(hookData.data.manifest);
      expect(spy.firstCall.args[1]).to.deep.equal(hookData.data.schema);
    });
  });
});
