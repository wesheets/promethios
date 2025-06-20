/**
 * Multi-Agent Coordination Framework
 * 
 * Enables multiple agents to work together with defined roles, communication protocols,
 * and coordination mechanisms while maintaining constitutional compliance and governance
 * identity requirements.
 * 
 * @module src/modules/multi_agent_coordination
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');
const { registerWithPhaseChangeTracker } = require('../../tools/phase-change-tracker');
const { GovernanceIdentity } = require('../governance_identity');
const { PrismObserver } = require('../../observers/prism');
const { VigilObserver } = require('../../observers/vigil');
const { AdaptiveLearningLoop } = require('../adaptive_learning_loop');

// Import core components
const CoordinationManager = require('./coordination_manager');
const AgentRegistry = require('./agent_registry');
const MessageBus = require('./message_bus');
const RoleManager = require('./role_manager');
const TaskAllocator = require('./task_allocator');
const GovernanceExchangeProtocol = require('./governance_exchange_protocol');
const SharedContextManager = require('./shared_context_manager');
const AgentCommunicationProtocol = require('./agent_communication_protocol');
const MultiAgentGovernance = require('./multi_agent_governance');

/**
 * Multi-Agent Coordination Framework main class
 */
class MultiAgentCoordination {
  /**
   * Create a new Multi-Agent Coordination Framework instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {GovernanceIdentity} options.governanceIdentity - Governance Identity module instance
   * @param {PrismObserver} options.prismObserver - PRISM Observer instance
   * @param {VigilObserver} options.vigilObserver - VIGIL Observer instance
   * @param {AdaptiveLearningLoop} options.adaptiveLearningLoop - Adaptive Learning Loop instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options = {}) {
    this.id = uuidv4();
    this.logger = options.logger || console;
    this.governanceIdentity = options.governanceIdentity;
    this.prismObserver = options.prismObserver;
    this.vigilObserver = options.vigilObserver;
    this.adaptiveLearningLoop = options.adaptiveLearningLoop;
    this.config = options.config || {};
    
    // Initialize core components
    this.sharedContextManager = new SharedContextManager({
      logger: this.logger,
      config: this.config.sharedContextManager || {}
    });
    
    this.multiAgentGovernance = new MultiAgentGovernance({
      logger: this.logger,
      governanceExchangeProtocol: this.governanceExchangeProtocol,
      governanceIdentity: this.governanceIdentity,
      prismObserver: this.prismObserver,
      vigilObserver: this.vigilObserver,
      config: this.config.multiAgentGovernance || {}
    });
    
    this.agentCommunicationProtocol = new AgentCommunicationProtocol({
      logger: this.logger,
      sharedContextManager: this.sharedContextManager,
      governanceExchangeProtocol: this.multiAgentGovernance,
      config: this.config.agentCommunicationProtocol || {}
    });
    
    this.agentRegistry = new AgentRegistry({
      logger: this.logger,
      governanceIdentity: this.governanceIdentity,
      config: this.config.agentRegistry || {}
    });
    
    this.messageBus = new MessageBus({
      logger: this.logger,
      config: this.config.messageBus || {}
    });
    
    this.roleManager = new RoleManager({
      logger: this.logger,
      agentRegistry: this.agentRegistry,
      config: this.config.roleManager || {}
    });
    
    this.taskAllocator = new TaskAllocator({
      logger: this.logger,
      agentRegistry: this.agentRegistry,
      roleManager: this.roleManager,
      config: this.config.taskAllocator || {}
    });
    
    this.governanceExchangeProtocol = new GovernanceExchangeProtocol({
      logger: this.logger,
      governanceIdentity: this.governanceIdentity,
      prismObserver: this.prismObserver,
      vigilObserver: this.vigilObserver,
      config: this.config.governanceExchangeProtocol || {}
    });
    
    this.coordinationManager = new CoordinationManager({
      logger: this.logger,
      agentRegistry: this.agentRegistry,
      messageBus: this.messageBus,
      roleManager: this.roleManager,
      taskAllocator: this.taskAllocator,
      governanceExchangeProtocol: this.governanceExchangeProtocol,
      sharedContextManager: this.sharedContextManager,
      agentCommunicationProtocol: this.agentCommunicationProtocol,
      multiAgentGovernance: this.multiAgentGovernance,
      adaptiveLearningLoop: this.adaptiveLearningLoop,
      config: this.config.coordinationManager || {}
    });
    
    // Register with Phase Change Tracker
    this._registerWithPhaseChangeTracker();
    
    this.logger.info('Multi-Agent Coordination Framework initialized', { id: this.id });
  }
  
  /**
   * Register agent with the coordination framework
   * 
   * @param {Object} agent - Agent to register
   * @param {string} agent.id - Unique agent identifier
   * @param {Object} agent.capabilities - Agent capabilities
   * @param {Object} agent.governanceIdentity - Agent governance identity (optional)
   * @returns {Object} Registration result
   */
  registerAgent(agent) {
    this.logger.info('Registering agent', { agentId: agent.id });
    
    // Verify agent has required properties
    if (!agent.id) {
      throw new Error('Agent must have an id');
    }
    
    // Check if agent has governance identity
    const hasGovernanceIdentity = !!agent.governanceIdentity;
    
    // Register agent with registry
    const registrationResult = this.agentRegistry.registerAgent(agent);
    
    // If agent has governance identity, verify it
    if (hasGovernanceIdentity) {
      const verificationResult = this.governanceExchangeProtocol.verifyGovernanceIdentity(agent.id, agent.governanceIdentity);
      registrationResult.governanceVerification = verificationResult;
    } else {
      // Create minimal governance record for non-governed agent
      const minimalGovernance = this.governanceExchangeProtocol.createMinimalGovernanceRecord(agent.id);
      registrationResult.governanceVerification = {
        verified: false,
        hasGovernanceIdentity: false,
        minimalGovernance
      };
    }
    
    // Notify observers about new agent
    if (this.prismObserver) {
      this.prismObserver.notifyAgentRegistration(agent.id, hasGovernanceIdentity);
    }
    
    if (this.vigilObserver) {
      this.vigilObserver.notifyAgentRegistration(agent.id, hasGovernanceIdentity);
    }
    
    return registrationResult;
  }
  
  /**
   * Create a new coordination context with governance
   * 
   * @param {Object} options - Context options
   * @param {string} options.name - Context name
   * @param {string[]} options.agentIds - IDs of agents to include
   * @param {Object} options.roles - Agent roles
   * @param {Object} options.policies - Coordination and governance policies
   * @param {Object} options.metadata - Additional metadata
   * @returns {Object} Created context
   */
  createCoordinationContext(options) {
    // Verify all agents are registered
    const unregisteredAgents = options.agentIds.filter(id => !this.agentRegistry.isAgentRegistered(id));
    if (unregisteredAgents.length > 0) {
      throw new Error(`Agents not registered: ${unregisteredAgents.join(', ')}`);
    }
    
    // Create the coordination context
    const context = this.coordinationManager.createContext({
      name: options.name,
      agentIds: options.agentIds,
      policies: options.policies,
      collaborationModel: options.collaborationModel || 'shared_context'
    });
    
    // Initialize governance for the context if enabled
    if (options.policies?.governanceEnabled !== false) {
      const governanceResult = this.multiAgentGovernance.initializeContextGovernance(
        context.id,
        options.agentIds,
        options.policies || {}
      );
      
      context.governance = governanceResult;
    }
    
    // Assign roles
    if (options.roles) {
      Object.entries(options.roles).forEach(([roleName, agentIds]) => {
        agentIds.forEach(agentId => {
          this.roleManager.assignRole(context.id, agentId, roleName);
        });
      });
    }
    
    // Establish governance relationships
    this._establishGovernanceRelationships(context.id, options.agentIds);
    
    return context;
  }
  
  /**
   * Start a coordination task
   * 
   * @param {string} contextId - Coordination context ID
   * @param {Object} task - Task definition
   * @returns {Object} Task execution result
   */
  startCoordinationTask(contextId, task) {
    this.logger.info('Starting coordination task', { contextId, taskId: task.id });
    
    // Verify context exists
    if (!this.coordinationManager.contextExists(contextId)) {
      throw new Error(`Coordination context not found: ${contextId}`);
    }
    
    // Allocate task to agents
    const allocation = this.taskAllocator.allocateTask(contextId, task);
    
    // Start task execution
    const executionResult = this.coordinationManager.executeTask(contextId, task, allocation);
    
    // Collect feedback for adaptive learning
    if (this.adaptiveLearningLoop) {
      this.adaptiveLearningLoop.feedbackCollector.collectCoordinationFeedback({
        contextId,
        taskId: task.id,
        allocation,
        executionResult
      });
    }
    
    return executionResult;
  }
  
  /**
   * Get coordination metrics for visualization
   * 
   * @param {string} contextId - Coordination context ID
   * @returns {Object} Coordination metrics
   */
  getCoordinationMetrics(contextId) {
    // Verify context exists
    if (!this.coordinationManager.contextExists(contextId)) {
      throw new Error(`Coordination context not found: ${contextId}`);
    }
    
    // Get basic metrics
    const basicMetrics = this.coordinationManager.getMetrics(contextId);
    
    // Get governance metrics
    const governanceMetrics = this.governanceExchangeProtocol.getGovernanceMetrics(contextId);
    
    // Get trust metrics
    const trustMetrics = this.vigilObserver ? 
      this.vigilObserver.getMultiAgentTrustMetrics(contextId) : {};
    
    // Get belief trace metrics
    const beliefTraceMetrics = this.prismObserver ?
      this.prismObserver.getMultiAgentBeliefTraceMetrics(contextId) : {};
    
    return {
      ...basicMetrics,
      governance: governanceMetrics,
      trust: trustMetrics,
      beliefTrace: beliefTraceMetrics
    };
  }
  
  /**
   * Get visualization data for governance identity contrast
   * 
   * @param {string} contextId - Coordination context ID
   * @returns {Object} Visualization data
   */
  getGovernanceContrastVisualization(contextId) {
    // Verify context exists
    if (!this.coordinationManager.contextExists(contextId)) {
      throw new Error(`Coordination context not found: ${contextId}`);
    }
    
    // Get agents in context
    const agents = this.agentRegistry.getAgentsInContext(contextId);
    
    // Get governance status for each agent
    const agentGovernanceStatus = agents.map(agent => {
      const hasGovernanceIdentity = this.agentRegistry.hasGovernanceIdentity(agent.id);
      const trustScore = this.vigilObserver ? 
        this.vigilObserver.getAgentTrustScore(agent.id) : 0;
      const beliefTraceScore = this.prismObserver ?
        this.prismObserver.getAgentBeliefTraceScore(agent.id) : 0;
      
      return {
        id: agent.id,
        name: agent.name || agent.id,
        hasGovernanceIdentity,
        governanceLevel: hasGovernanceIdentity ? 
          this.governanceExchangeProtocol.getGovernanceLevel(agent.id) : 'none',
        trustScore,
        beliefTraceScore,
        roles: this.roleManager.getAgentRoles(contextId, agent.id),
        taskCompletion: this.taskAllocator.getAgentTaskCompletionRate(contextId, agent.id),
        trustRelationships: this.governanceExchangeProtocol.getAgentTrustRelationships(contextId, agent.id)
      };
    });
    
    // Get interaction metrics
    const interactionMetrics = this.messageBus.getInteractionMetrics(contextId);
    
    // Get trust boundary visualization data
    const trustBoundaries = this.governanceExchangeProtocol.getTrustBoundaryVisualization(contextId);
    
    return {
      agents: agentGovernanceStatus,
      interactions: interactionMetrics,
      trustBoundaries,
      constitutionalVerification: this.prismObserver ? 
        this.prismObserver.getConstitutionalVerificationVisualization(contextId) : {},
      governanceContrast: {
        withGovernance: {
          averageTrustScore: this._calculateAverageTrustScore(agentGovernanceStatus, true),
          averageTaskCompletion: this._calculateAverageTaskCompletion(agentGovernanceStatus, true),
          verificationRate: this._calculateVerificationRate(contextId, true)
        },
        withoutGovernance: {
          averageTrustScore: this._calculateAverageTrustScore(agentGovernanceStatus, false),
          averageTaskCompletion: this._calculateAverageTaskCompletion(agentGovernanceStatus, false),
          verificationRate: this._calculateVerificationRate(contextId, false)
        }
      }
    };
  }
  
  /**
   * Shutdown the coordination framework
   */
  shutdown() {
    this.logger.info('Shutting down Multi-Agent Coordination Framework', { id: this.id });
    
    // Shutdown components
    this.coordinationManager.shutdown();
    this.messageBus.shutdown();
    this.taskAllocator.shutdown();
    this.roleManager.shutdown();
    this.agentRegistry.shutdown();
    this.governanceExchangeProtocol.shutdown();
  }
  
  /**
   * Register with Phase Change Tracker
   * @private
   */
  _registerWithPhaseChangeTracker() {
    try {
      registerWithPhaseChangeTracker({
        componentType: 'module',
        componentName: 'multi_agent_coordination',
        version: '1.0.0',
        apis: [
          { name: 'registerAgent', version: '1.0.0', description: 'Register agent with coordination framework' },
          { name: 'createCoordinationContext', version: '1.0.0', description: 'Create coordination context for agents' },
          { name: 'startCoordinationTask', version: '1.0.0', description: 'Start coordination task' },
          { name: 'getCoordinationMetrics', version: '1.0.0', description: 'Get coordination metrics' },
          { name: 'getGovernanceContrastVisualization', version: '1.0.0', description: 'Get governance contrast visualization data' }
        ]
      });
    } catch (error) {
      this.logger.error('Failed to register with Phase Change Tracker', { error });
    }
  }
  
  /**
   * Establish governance relationships between agents in a context
   * @private
   * 
   * @param {string} contextId - Coordination context ID
   * @param {string[]} agentIds - Agent IDs
   */
  _establishGovernanceRelationships(contextId, agentIds) {
    // Get governance status for each agent
    const agentGovernanceStatus = agentIds.map(id => ({
      id,
      hasGovernanceIdentity: this.agentRegistry.hasGovernanceIdentity(id)
    }));
    
    // Establish relationships between all agents
    for (const agent1 of agentGovernanceStatus) {
      for (const agent2 of agentGovernanceStatus) {
        if (agent1.id !== agent2.id) {
          this.governanceExchangeProtocol.establishTrustRelationship(
            contextId,
            agent1.id,
            agent2.id,
            agent1.hasGovernanceIdentity,
            agent2.hasGovernanceIdentity
          );
        }
      }
    }
  }
  
  /**
   * Calculate average trust score for agents with or without governance
   * @private
   * 
   * @param {Array} agents - Agent governance status array
   * @param {boolean} withGovernance - Whether to calculate for agents with governance
   * @returns {number} Average trust score
   */
  _calculateAverageTrustScore(agents, withGovernance) {
    const filteredAgents = agents.filter(a => a.hasGovernanceIdentity === withGovernance);
    if (filteredAgents.length === 0) return 0;
    
    const sum = filteredAgents.reduce((acc, agent) => acc + agent.trustScore, 0);
    return sum / filteredAgents.length;
  }
  
  /**
   * Calculate average task completion rate for agents with or without governance
   * @private
   * 
   * @param {Array} agents - Agent governance status array
   * @param {boolean} withGovernance - Whether to calculate for agents with governance
   * @returns {number} Average task completion rate
   */
  _calculateAverageTaskCompletion(agents, withGovernance) {
    const filteredAgents = agents.filter(a => a.hasGovernanceIdentity === withGovernance);
    if (filteredAgents.length === 0) return 0;
    
    const sum = filteredAgents.reduce((acc, agent) => acc + agent.taskCompletion, 0);
    return sum / filteredAgents.length;
  }
  
  /**
   * Calculate verification rate for agents with or without governance
   * @private
   * 
   * @param {string} contextId - Coordination context ID
   * @param {boolean} withGovernance - Whether to calculate for agents with governance
   * @returns {number} Verification rate
   */
  _calculateVerificationRate(contextId, withGovernance) {
    if (!this.prismObserver) return 0;
    
    return this.prismObserver.getVerificationRate(contextId, withGovernance);
  }
}

module.exports = MultiAgentCoordination;
