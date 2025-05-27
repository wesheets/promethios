/**
 * Integration tests for Constitutional Observers and Governance Modules
 * 
 * These tests verify the integration between observers (PRISM and VIGIL)
 * and governance modules (Belief Trace and Goal-Adherence).
 */

const { expect } = require('chai');
const sinon = require('sinon');
const PrismObserver = require('../../../src/observers/prism/index');
const VigilObserver = require('../../../src/observers/vigil/index');
const BeliefTraceManager = require('../../../src/modules/belief_trace/index');
const GoalAdherenceMonitor = require('../../../src/modules/goal_adherence/index');
const ConstitutionalHooks = require('../../../src/hooks/constitutional_hooks');

describe('Constitutional Observer Integration', () => {
  let prismObserver;
  let vigilObserver;
  let beliefTraceManager;
  let goalAdherenceMonitor;
  let constitutionalHooks;
  let mockLogger;
  
  beforeEach(() => {
    // Mock dependencies
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create instances
    beliefTraceManager = new BeliefTraceManager({
      logger: mockLogger,
      config: {
        verificationLevel: 'standard',
        persistenceInterval: 60000
      }
    });
    
    goalAdherenceMonitor = new GoalAdherenceMonitor({
      logger: mockLogger,
      config: {
        driftThreshold: 0.2,
        checkpointFrequency: 'medium'
      }
    });
    
    prismObserver = new PrismObserver({
      beliefTraceManager: beliefTraceManager,
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
    
    vigilObserver = new VigilObserver({
      logger: mockLogger,
      config: {
        trustDecayThreshold: 0.1,
        unreflectedFailureThreshold: 2,
        memoryMutationTracking: 'comprehensive',
        alertThresholds: {
          trustDecay: 'warning',
          unreflectedFailure: 'error',
          memoryMutation: 'warning'
        }
      }
    });
    
    // Create hooks manager with observers
    constitutionalHooks = new ConstitutionalHooks({
      observers: {
        prism: prismObserver,
        vigil: vigilObserver
      },
      logger: mockLogger
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('Belief Trace and PRISM Integration', () => {
    it('should trigger PRISM observer when belief trace is created', () => {
      const spy = sinon.spy(prismObserver, 'monitorBeliefTrace');
      
      // Create a belief trace
      const belief = {
        id: 'belief-123',
        content: 'This is a test belief'
      };
      
      const trace = beliefTraceManager.createTrace(belief, {
        sourceType: 'user_input',
        sourceId: 'user-123'
      });
      
      // Attach trace to belief
      belief.trace = trace;
      
      // Trigger hook
      constitutionalHooks.triggerHook('beliefGeneration', { belief });
      
      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.deep.equal(belief);
    });
    
    it('should verify trace when requested by PRISM', () => {
      const spy = sinon.spy(beliefTraceManager, 'verifyTrace');
      
      // Create a belief with trace
      const belief = {
        id: 'belief-123',
        content: 'This is a test belief',
        trace: {
          id: 'trace-456',
          sourceType: 'user_input',
          sourceId: 'user-123',
          timestamp: Date.now()
        }
      };
      
      // Configure PRISM to verify traces
      prismObserver.config.verifyTraces = true;
      
      // Trigger hook
      constitutionalHooks.triggerHook('beliefGeneration', { belief });
      
      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.deep.equal(belief.trace);
    });
  });
  
  describe('Goal Adherence and VIGIL Integration', () => {
    it('should trigger VIGIL observer when goal adherence changes', () => {
      const spy = sinon.spy(vigilObserver, 'monitorTrustDecay');
      
      // Register a goal
      const goal = {
        id: 'goal-123',
        description: 'Complete task successfully',
        criteria: [
          { id: 'criteria-1', description: 'Finish all steps', weight: 0.6 },
          { id: 'criteria-2', description: 'Maintain accuracy', weight: 0.4 }
        ],
        constraints: [
          { id: 'constraint-1', description: 'Stay within budget', weight: 0.5 }
        ],
        agentId: 'agent-123'
      };
      
      goalAdherenceMonitor.registerGoal(goal);
      
      // Update goal adherence with a violation
      const adherenceUpdate = goalAdherenceMonitor.updateAdherence(goal.id, {
        criteriaStatus: [
          { id: 'criteria-1', satisfied: true },
          { id: 'criteria-2', satisfied: false }
        ],
        constraintViolations: [
          { id: 'constraint-1', violated: true, severity: 0.7 }
        ]
      });
      
      // This should cause a trust decay
      const trustUpdate = {
        agentId: 'agent-123',
        previousTrust: 0.8,
        currentTrust: 0.65,
        reason: 'Goal adherence violation',
        timestamp: Date.now()
      };
      
      // Trigger hook
      constitutionalHooks.triggerHook('trustUpdate', trustUpdate);
      
      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.deep.equal(trustUpdate);
    });
    
    it('should detect goal drift and trigger appropriate hooks', () => {
      // Register a goal
      const goal = {
        id: 'goal-123',
        description: 'Complete task successfully',
        criteria: [
          { id: 'criteria-1', description: 'Finish all steps', weight: 0.6 },
          { id: 'criteria-2', description: 'Maintain accuracy', weight: 0.4 }
        ],
        agentId: 'agent-123'
      };
      
      goalAdherenceMonitor.registerGoal(goal);
      
      // Create a checkpoint that shows significant drift
      const checkpoint = {
        goalId: 'goal-123',
        timestamp: Date.now(),
        adherenceScore: 0.4, // Below drift threshold
        driftDetected: true,
        driftFactors: [
          { criteriaId: 'criteria-2', contribution: 0.4 }
        ]
      };
      
      const spy = sinon.spy(constitutionalHooks, 'triggerHook');
      
      // Record checkpoint
      goalAdherenceMonitor.recordCheckpoint(goal.id, checkpoint);
      
      // This should trigger a goalDrift hook
      expect(spy.calledWith('goalDrift')).to.be.true;
      
      // The hook data should contain the drift information
      const hookCall = spy.getCalls().find(call => call.args[0] === 'goalDrift');
      expect(hookCall.args[1].goalId).to.equal(goal.id);
      expect(hookCall.args[1].driftDetected).to.be.true;
    });
  });
  
  describe('Cross-Observer Integration', () => {
    it('should coordinate between PRISM and VIGIL for comprehensive monitoring', () => {
      // This test verifies that both observers can work together
      // to provide comprehensive governance monitoring
      
      // Create a belief with missing trace
      const belief = {
        id: 'belief-123',
        content: 'This is a test belief'
        // No trace information
      };
      
      // Trigger belief generation hook
      constitutionalHooks.triggerHook('beliefGeneration', { belief });
      
      // PRISM should detect the missing trace
      expect(prismObserver.analytics.violationCounts.missingTrace).to.equal(1);
      
      // Now simulate a loop failure without reflection
      const loopOutcome = {
        loopId: 'loop-123',
        success: false,
        reflected: false,
        agentId: 'agent-123',
        timestamp: Date.now()
      };
      
      // Trigger loop closure hook
      constitutionalHooks.triggerHook('loopClosure', loopOutcome);
      
      // VIGIL should detect the unreflected failure
      expect(vigilObserver.analytics.unreflectedFailures).to.have.lengthOf(1);
      
      // This should also cause a trust decay
      const trustUpdate = {
        agentId: 'agent-123',
        previousTrust: 0.7,
        currentTrust: 0.5,
        reason: 'Unreflected failure',
        timestamp: Date.now()
      };
      
      // Trigger trust update hook
      constitutionalHooks.triggerHook('trustUpdate', trustUpdate);
      
      // VIGIL should detect the trust decay
      expect(vigilObserver.analytics.trustDecayEvents).to.have.lengthOf(1);
      
      // Verify that both observers have recorded analytics
      const prismAnalytics = prismObserver.getAnalytics();
      const vigilAnalytics = vigilObserver.getAnalytics();
      
      expect(prismAnalytics.violationCounts.missingTrace).to.equal(1);
      expect(vigilAnalytics.unreflectedFailures).to.have.lengthOf(1);
      expect(vigilAnalytics.trustDecayEvents).to.have.lengthOf(1);
    });
  });
});
