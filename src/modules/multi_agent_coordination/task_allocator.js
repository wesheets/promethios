/**
 * Task Allocator Component
 * 
 * Distributes tasks among agents based on capabilities, roles,
 * and governance requirements.
 * 
 * @module src/modules/multi_agent_coordination/task_allocator
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Task Allocator class
 */
class TaskAllocator {
  /**
   * Create a new Task Allocator instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.agentRegistry - Agent Registry instance
   * @param {Object} options.roleManager - Role Manager instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.agentRegistry = options.agentRegistry;
    this.roleManager = options.roleManager;
    this.config = options.config || {};
    
    // Initialize allocations map (contextId -> taskId -> allocation)
    this.allocations = new Map();
    
    // Initialize agent task completion metrics
    this.taskCompletionMetrics = new Map();
    
    this.logger.info('Task Allocator initialized');
  }
  
  /**
   * Allocate task to agents in a context
   * 
   * @param {string} contextId - Context ID
   * @param {Object} task - Task definition
   * @returns {Object} Task allocation
   */
  allocateTask(contextId, task) {
    this.logger.info('Allocating task', { contextId, taskId: task.id });
    
    // Generate task ID if not provided
    const taskId = task.id || uuidv4();
    
    // Get agents in context
    const agents = this.agentRegistry.getAgentsInContext(contextId);
    
    if (agents.length === 0) {
      throw new Error(`No agents in context: ${contextId}`);
    }
    
    // Determine allocation strategy
    const strategy = task.allocationStrategy || this.config.defaultAllocationStrategy || 'role-based';
    
    // Allocate task based on strategy
    let allocation;
    switch (strategy) {
      case 'role-based':
        allocation = this._allocateByRole(contextId, taskId, task, agents);
        break;
      case 'capability-based':
        allocation = this._allocateByCapability(contextId, taskId, task, agents);
        break;
      case 'governance-based':
        allocation = this._allocateByGovernance(contextId, taskId, task, agents);
        break;
      case 'balanced':
        allocation = this._allocateBalanced(contextId, taskId, task, agents);
        break;
      default:
        allocation = this._allocateByRole(contextId, taskId, task, agents);
    }
    
    // Initialize context allocations if needed
    if (!this.allocations.has(contextId)) {
      this.allocations.set(contextId, new Map());
    }
    
    // Store allocation
    this.allocations.get(contextId).set(taskId, allocation);
    
    this.logger.info('Task allocated', { 
      contextId, 
      taskId, 
      strategy,
      agentCount: Object.keys(allocation.assignments).length 
    });
    
    return allocation;
  }
  
  /**
   * Get task allocation
   * 
   * @param {string} contextId - Context ID
   * @param {string} taskId - Task ID
   * @returns {Object|null} Task allocation or null if not found
   */
  getTaskAllocation(contextId, taskId) {
    // Verify context has allocations
    if (!this.allocations.has(contextId)) {
      return null;
    }
    
    const contextAllocations = this.allocations.get(contextId);
    
    // Verify task has allocation
    if (!contextAllocations.has(taskId)) {
      return null;
    }
    
    // Return allocation
    return { ...contextAllocations.get(taskId) };
  }
  
  /**
   * Record task completion
   * 
   * @param {string} contextId - Context ID
   * @param {string} taskId - Task ID
   * @param {Object} result - Task completion result
   * @returns {boolean} Whether recording was successful
   */
  recordTaskCompletion(contextId, taskId, result) {
    // Verify context has allocations
    if (!this.allocations.has(contextId)) {
      return false;
    }
    
    const contextAllocations = this.allocations.get(contextId);
    
    // Verify task has allocation
    if (!contextAllocations.has(taskId)) {
      return false;
    }
    
    const allocation = contextAllocations.get(taskId);
    
    // Update allocation with result
    allocation.completed = true;
    allocation.completedAt = new Date().toISOString();
    allocation.result = result;
    
    // Update agent task completion metrics
    this._updateTaskCompletionMetrics(contextId, taskId, allocation, result);
    
    this.logger.info('Task completion recorded', { 
      contextId, 
      taskId, 
      success: result.success 
    });
    
    return true;
  }
  
  /**
   * Get agent task completion rate
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @returns {number} Task completion rate (0-1)
   */
  getAgentTaskCompletionRate(contextId, agentId) {
    // Initialize context metrics if needed
    if (!this.taskCompletionMetrics.has(contextId)) {
      return 0;
    }
    
    const contextMetrics = this.taskCompletionMetrics.get(contextId);
    
    // Initialize agent metrics if needed
    if (!contextMetrics.has(agentId)) {
      return 0;
    }
    
    const agentMetrics = contextMetrics.get(agentId);
    
    // Calculate completion rate
    if (agentMetrics.totalTasks === 0) {
      return 0;
    }
    
    return agentMetrics.successfulTasks / agentMetrics.totalTasks;
  }
  
  /**
   * Get agent task metrics
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @returns {Object} Agent task metrics
   */
  getAgentTaskMetrics(contextId, agentId) {
    // Initialize context metrics if needed
    if (!this.taskCompletionMetrics.has(contextId)) {
      return {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        completionRate: 0,
        averageCompletionTime: 0
      };
    }
    
    const contextMetrics = this.taskCompletionMetrics.get(contextId);
    
    // Initialize agent metrics if needed
    if (!contextMetrics.has(agentId)) {
      return {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        completionRate: 0,
        averageCompletionTime: 0
      };
    }
    
    const agentMetrics = contextMetrics.get(agentId);
    
    // Calculate completion rate
    const completionRate = agentMetrics.totalTasks === 0 ? 
      0 : agentMetrics.successfulTasks / agentMetrics.totalTasks;
    
    return {
      totalTasks: agentMetrics.totalTasks,
      successfulTasks: agentMetrics.successfulTasks,
      failedTasks: agentMetrics.failedTasks,
      completionRate,
      averageCompletionTime: agentMetrics.averageCompletionTime
    };
  }
  
  /**
   * Shutdown the task allocator
   */
  shutdown() {
    this.logger.info('Shutting down Task Allocator');
    
    // Clear all data
    this.allocations.clear();
    this.taskCompletionMetrics.clear();
  }
  
  /**
   * Allocate task by role
   * @private
   * 
   * @param {string} contextId - Context ID
   * @param {string} taskId - Task ID
   * @param {Object} task - Task definition
   * @param {Array} agents - Available agents
   * @returns {Object} Task allocation
   */
  _allocateByRole(contextId, taskId, task, agents) {
    const allocation = {
      id: uuidv4(),
      taskId,
      contextId,
      strategy: 'role-based',
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      assignments: {},
      result: null
    };
    
    // Check if task specifies required roles
    if (task.requiredRoles && this.roleManager) {
      for (const [roleName, subtasks] of Object.entries(task.requiredRoles)) {
        // Get agents with this role
        const agentsWithRole = this.roleManager.getAgentsWithRole(contextId, roleName);
        
        if (agentsWithRole.length === 0) {
          throw new Error(`No agents with required role: ${roleName}`);
        }
        
        // Assign subtasks to agents with this role
        for (const agentId of agentsWithRole) {
          allocation.assignments[agentId] = {
            role: roleName,
            subtasks
          };
        }
      }
    } else {
      // If no required roles specified, distribute task evenly
      for (const agent of agents) {
        // Get agent roles
        const roles = this.roleManager ? 
          this.roleManager.getAgentRoles(contextId, agent.id) : [];
        
        allocation.assignments[agent.id] = {
          role: roles.length > 0 ? roles[0] : 'general',
          subtasks: [task]
        };
      }
    }
    
    return allocation;
  }
  
  /**
   * Allocate task by capability
   * @private
   * 
   * @param {string} contextId - Context ID
   * @param {string} taskId - Task ID
   * @param {Object} task - Task definition
   * @param {Array} agents - Available agents
   * @returns {Object} Task allocation
   */
  _allocateByCapability(contextId, taskId, task, agents) {
    const allocation = {
      id: uuidv4(),
      taskId,
      contextId,
      strategy: 'capability-based',
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      assignments: {},
      result: null
    };
    
    // Check if task specifies required capabilities
    if (task.requiredCapabilities) {
      for (const [capability, subtasks] of Object.entries(task.requiredCapabilities)) {
        // Find agents with this capability
        const agentsWithCapability = agents.filter(agent => 
          agent.capabilities && agent.capabilities[capability]
        );
        
        if (agentsWithCapability.length === 0) {
          throw new Error(`No agents with required capability: ${capability}`);
        }
        
        // Assign subtasks to agents with this capability
        for (const agent of agentsWithCapability) {
          allocation.assignments[agent.id] = {
            capability,
            subtasks
          };
        }
      }
    } else {
      // If no required capabilities specified, distribute task evenly
      for (const agent of agents) {
        allocation.assignments[agent.id] = {
          capability: 'general',
          subtasks: [task]
        };
      }
    }
    
    return allocation;
  }
  
  /**
   * Allocate task by governance
   * @private
   * 
   * @param {string} contextId - Context ID
   * @param {string} taskId - Task ID
   * @param {Object} task - Task definition
   * @param {Array} agents - Available agents
   * @returns {Object} Task allocation
   */
  _allocateByGovernance(contextId, taskId, task, agents) {
    const allocation = {
      id: uuidv4(),
      taskId,
      contextId,
      strategy: 'governance-based',
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      assignments: {},
      result: null
    };
    
    // Separate agents by governance status
    const governedAgents = agents.filter(agent => agent.hasGovernanceIdentity);
    const nonGovernedAgents = agents.filter(agent => !agent.hasGovernanceIdentity);
    
    // Check if task requires governance
    if (task.requiresGovernance) {
      if (governedAgents.length === 0) {
        throw new Error('Task requires governance, but no governed agents available');
      }
      
      // Assign task only to governed agents
      for (const agent of governedAgents) {
        allocation.assignments[agent.id] = {
          governance: 'full',
          subtasks: [task]
        };
      }
    } else if (task.forbidsGovernance) {
      if (nonGovernedAgents.length === 0) {
        throw new Error('Task forbids governance, but no non-governed agents available');
      }
      
      // Assign task only to non-governed agents
      for (const agent of nonGovernedAgents) {
        allocation.assignments[agent.id] = {
          governance: 'none',
          subtasks: [task]
        };
      }
    } else {
      // Distribute task based on governance requirements of subtasks
      if (task.subtasks) {
        const governanceSubtasks = task.subtasks.filter(st => st.requiresGovernance);
        const nonGovernanceSubtasks = task.subtasks.filter(st => !st.requiresGovernance);
        
        // Assign governance subtasks to governed agents
        if (governanceSubtasks.length > 0) {
          if (governedAgents.length === 0) {
            throw new Error('Some subtasks require governance, but no governed agents available');
          }
          
          for (const agent of governedAgents) {
            allocation.assignments[agent.id] = {
              governance: 'full',
              subtasks: governanceSubtasks
            };
          }
        }
        
        // Assign non-governance subtasks to non-governed agents
        if (nonGovernanceSubtasks.length > 0) {
          const targetAgents = nonGovernedAgents.length > 0 ? nonGovernedAgents : governedAgents;
          
          for (const agent of targetAgents) {
            if (allocation.assignments[agent.id]) {
              // Agent already has governance subtasks, add non-governance subtasks
              allocation.assignments[agent.id].subtasks = 
                allocation.assignments[agent.id].subtasks.concat(nonGovernanceSubtasks);
            } else {
              allocation.assignments[agent.id] = {
                governance: agent.hasGovernanceIdentity ? 'full' : 'none',
                subtasks: nonGovernanceSubtasks
              };
            }
          }
        }
      } else {
        // No subtasks specified, distribute task to all agents
        for (const agent of agents) {
          allocation.assignments[agent.id] = {
            governance: agent.hasGovernanceIdentity ? 'full' : 'none',
            subtasks: [task]
          };
        }
      }
    }
    
    return allocation;
  }
  
  /**
   * Allocate task with balanced approach
   * @private
   * 
   * @param {string} contextId - Context ID
   * @param {string} taskId - Task ID
   * @param {Object} task - Task definition
   * @param {Array} agents - Available agents
   * @returns {Object} Task allocation
   */
  _allocateBalanced(contextId, taskId, task, agents) {
    const allocation = {
      id: uuidv4(),
      taskId,
      contextId,
      strategy: 'balanced',
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      assignments: {},
      result: null
    };
    
    // Calculate agent scores based on multiple factors
    const agentScores = agents.map(agent => {
      // Get agent task completion rate
      const completionRate = this.getAgentTaskCompletionRate(contextId, agent.id);
      
      // Get agent roles
      const roles = this.roleManager ? 
        this.roleManager.getAgentRoles(contextId, agent.id) : [];
      
      // Calculate role match score
      let roleMatchScore = 0;
      if (task.requiredRoles && roles.length > 0) {
        roleMatchScore = roles.some(role => task.requiredRoles[role]) ? 1 : 0;
      }
      
      // Calculate capability match score
      let capabilityMatchScore = 0;
      if (task.requiredCapabilities && agent.capabilities) {
        const matchingCapabilities = Object.keys(task.requiredCapabilities)
          .filter(cap => agent.capabilities[cap]);
        capabilityMatchScore = matchingCapabilities.length / Object.keys(task.requiredCapabilities).length;
      }
      
      // Calculate governance match score
      let governanceMatchScore = 0;
      if (task.requiresGovernance) {
        governanceMatchScore = agent.hasGovernanceIdentity ? 1 : 0;
      } else if (task.forbidsGovernance) {
        governanceMatchScore = agent.hasGovernanceIdentity ? 0 : 1;
      } else {
        governanceMatchScore = 0.5;
      }
      
      // Calculate final score
      const score = (
        (completionRate * 0.3) + 
        (roleMatchScore * 0.3) + 
        (capabilityMatchScore * 0.2) + 
        (governanceMatchScore * 0.2)
      );
      
      return {
        agent,
        score,
        completionRate,
        roleMatchScore,
        capabilityMatchScore,
        governanceMatchScore
      };
    });
    
    // Sort agents by score (descending)
    agentScores.sort((a, b) => b.score - a.score);
    
    // Determine how many agents to use
    const agentCount = task.agentCount || Math.ceil(agents.length / 2);
    
    // Assign task to top-scoring agents
    for (let i = 0; i < Math.min(agentCount, agentScores.length); i++) {
      const { agent } = agentScores[i];
      
      allocation.assignments[agent.id] = {
        score: agentScores[i].score,
        governance: agent.hasGovernanceIdentity ? 'full' : 'none',
        subtasks: [task]
      };
    }
    
    return allocation;
  }
  
  /**
   * Update task completion metrics
   * @private
   * 
   * @param {string} contextId - Context ID
   * @param {string} taskId - Task ID
   * @param {Object} allocation - Task allocation
   * @param {Object} result - Task completion result
   */
  _updateTaskCompletionMetrics(contextId, taskId, allocation, result) {
    // Initialize context metrics if needed
    if (!this.taskCompletionMetrics.has(contextId)) {
      this.taskCompletionMetrics.set(contextId, new Map());
    }
    
    const contextMetrics = this.taskCompletionMetrics.get(contextId);
    
    // Update metrics for each agent in allocation
    for (const [agentId, assignment] of Object.entries(allocation.assignments)) {
      // Initialize agent metrics if needed
      if (!contextMetrics.has(agentId)) {
        contextMetrics.set(agentId, {
          totalTasks: 0,
          successfulTasks: 0,
          failedTasks: 0,
          averageCompletionTime: 0
        });
      }
      
      const agentMetrics = contextMetrics.get(agentId);
      
      // Update metrics
      agentMetrics.totalTasks++;
      
      // Check if agent was successful
      const agentResult = result.agentResults && result.agentResults[agentId];
      const agentSuccess = agentResult ? agentResult.success : result.success;
      
      if (agentSuccess) {
        agentMetrics.successfulTasks++;
      } else {
        agentMetrics.failedTasks++;
      }
      
      // Update average completion time
      const completionTime = agentResult ? agentResult.completionTime : 0;
      agentMetrics.averageCompletionTime = 
        (agentMetrics.averageCompletionTime * (agentMetrics.totalTasks - 1) + completionTime) / 
        agentMetrics.totalTasks;
    }
  }
}

module.exports = TaskAllocator;
