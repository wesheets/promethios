/**
 * Role Manager Component
 * 
 * Defines and enforces agent roles, permissions, and responsibilities
 * within coordination contexts.
 * 
 * @module src/modules/multi_agent_coordination/role_manager
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Role Manager class
 */
class RoleManager {
  /**
   * Create a new Role Manager instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} options.agentRegistry - Agent Registry instance
   * @param {Object} options.config - Configuration settings
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.agentRegistry = options.agentRegistry;
    this.config = options.config || {};
    
    // Initialize roles map (contextId -> roleDefinitions)
    this.roles = new Map();
    
    // Initialize agent roles map (contextId -> agentId -> roles)
    this.agentRoles = new Map();
    
    this.logger.info('Role Manager initialized');
  }
  
  /**
   * Define roles for a context
   * 
   * @param {string} contextId - Context ID
   * @param {Object} roleDefinitions - Role definitions
   * @returns {boolean} Whether role definition was successful
   */
  defineRoles(contextId, roleDefinitions) {
    // Initialize roles for context if needed
    if (!this.roles.has(contextId)) {
      this.roles.set(contextId, new Map());
      this.agentRoles.set(contextId, new Map());
    }
    
    const contextRoles = this.roles.get(contextId);
    
    // Add each role definition
    for (const [roleName, definition] of Object.entries(roleDefinitions)) {
      contextRoles.set(roleName, {
        name: roleName,
        permissions: definition.permissions || [],
        responsibilities: definition.responsibilities || [],
        governanceRequirements: definition.governanceRequirements || null,
        maxAgents: definition.maxAgents || null,
        minAgents: definition.minAgents || 0
      });
      
      this.logger.info('Role defined', { contextId, roleName });
    }
    
    return true;
  }
  
  /**
   * Assign role to agent
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @param {string} roleName - Role name
   * @returns {boolean} Whether role assignment was successful
   */
  assignRole(contextId, agentId, roleName) {
    // Verify context has roles defined
    if (!this.roles.has(contextId)) {
      throw new Error(`No roles defined for context: ${contextId}`);
    }
    
    const contextRoles = this.roles.get(contextId);
    
    // Verify role exists
    if (!contextRoles.has(roleName)) {
      throw new Error(`Role not defined: ${roleName}`);
    }
    
    const role = contextRoles.get(roleName);
    
    // Verify agent exists
    if (this.agentRegistry && !this.agentRegistry.isAgentRegistered(agentId)) {
      throw new Error(`Agent not registered: ${agentId}`);
    }
    
    // Check governance requirements if specified
    if (role.governanceRequirements && this.agentRegistry) {
      const hasGovernance = this.agentRegistry.hasGovernanceIdentity(agentId);
      
      if (role.governanceRequirements.required && !hasGovernance) {
        throw new Error(`Role ${roleName} requires governance identity, but agent ${agentId} does not have one`);
      }
      
      if (role.governanceRequirements.forbidden && hasGovernance) {
        throw new Error(`Role ${roleName} forbids governance identity, but agent ${agentId} has one`);
      }
    }
    
    // Check max agents constraint
    if (role.maxAgents !== null) {
      const agentsWithRole = this._getAgentsWithRole(contextId, roleName);
      if (agentsWithRole.length >= role.maxAgents) {
        throw new Error(`Role ${roleName} already has maximum number of agents (${role.maxAgents})`);
      }
    }
    
    // Initialize agent roles for context if needed
    if (!this.agentRoles.has(contextId)) {
      this.agentRoles.set(contextId, new Map());
    }
    
    const contextAgentRoles = this.agentRoles.get(contextId);
    
    // Initialize agent roles if needed
    if (!contextAgentRoles.has(agentId)) {
      contextAgentRoles.set(agentId, new Set());
    }
    
    // Assign role to agent
    contextAgentRoles.get(agentId).add(roleName);
    
    this.logger.info('Role assigned', { contextId, agentId, roleName });
    
    return true;
  }
  
  /**
   * Remove role from agent
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @param {string} roleName - Role name
   * @returns {boolean} Whether role removal was successful
   */
  removeRole(contextId, agentId, roleName) {
    // Verify context has agent roles
    if (!this.agentRoles.has(contextId)) {
      return false;
    }
    
    const contextAgentRoles = this.agentRoles.get(contextId);
    
    // Verify agent has roles
    if (!contextAgentRoles.has(agentId)) {
      return false;
    }
    
    // Remove role from agent
    const result = contextAgentRoles.get(agentId).delete(roleName);
    
    if (result) {
      this.logger.info('Role removed', { contextId, agentId, roleName });
      
      // Check min agents constraint
      if (this.roles.has(contextId)) {
        const contextRoles = this.roles.get(contextId);
        if (contextRoles.has(roleName)) {
          const role = contextRoles.get(roleName);
          const agentsWithRole = this._getAgentsWithRole(contextId, roleName);
          
          if (agentsWithRole.length < role.minAgents) {
            this.logger.warn('Role has fewer than minimum required agents', {
              contextId,
              roleName,
              currentAgents: agentsWithRole.length,
              minAgents: role.minAgents
            });
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * Check if agent has role
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @param {string} roleName - Role name
   * @returns {boolean} Whether agent has role
   */
  hasRole(contextId, agentId, roleName) {
    // Verify context has agent roles
    if (!this.agentRoles.has(contextId)) {
      return false;
    }
    
    const contextAgentRoles = this.agentRoles.get(contextId);
    
    // Verify agent has roles
    if (!contextAgentRoles.has(agentId)) {
      return false;
    }
    
    // Check if agent has role
    return contextAgentRoles.get(agentId).has(roleName);
  }
  
  /**
   * Get agent roles
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @returns {string[]} Array of role names
   */
  getAgentRoles(contextId, agentId) {
    // Verify context has agent roles
    if (!this.agentRoles.has(contextId)) {
      return [];
    }
    
    const contextAgentRoles = this.agentRoles.get(contextId);
    
    // Verify agent has roles
    if (!contextAgentRoles.has(agentId)) {
      return [];
    }
    
    // Return agent roles
    return Array.from(contextAgentRoles.get(agentId));
  }
  
  /**
   * Get agents with role
   * 
   * @param {string} contextId - Context ID
   * @param {string} roleName - Role name
   * @returns {string[]} Array of agent IDs
   */
  getAgentsWithRole(contextId, roleName) {
    return this._getAgentsWithRole(contextId, roleName);
  }
  
  /**
   * Check if agent has permission
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @param {string} permission - Permission to check
   * @returns {boolean} Whether agent has permission
   */
  hasPermission(contextId, agentId, permission) {
    // Get agent roles
    const roles = this.getAgentRoles(contextId, agentId);
    
    // Verify context has roles defined
    if (!this.roles.has(contextId)) {
      return false;
    }
    
    const contextRoles = this.roles.get(contextId);
    
    // Check if any role has the permission
    for (const roleName of roles) {
      if (contextRoles.has(roleName)) {
        const role = contextRoles.get(roleName);
        if (role.permissions.includes(permission)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Get agent permissions
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @returns {string[]} Array of permissions
   */
  getAgentPermissions(contextId, agentId) {
    // Get agent roles
    const roles = this.getAgentRoles(contextId, agentId);
    
    // Verify context has roles defined
    if (!this.roles.has(contextId)) {
      return [];
    }
    
    const contextRoles = this.roles.get(contextId);
    
    // Collect permissions from all roles
    const permissions = new Set();
    
    for (const roleName of roles) {
      if (contextRoles.has(roleName)) {
        const role = contextRoles.get(roleName);
        for (const permission of role.permissions) {
          permissions.add(permission);
        }
      }
    }
    
    return Array.from(permissions);
  }
  
  /**
   * Get agent responsibilities
   * 
   * @param {string} contextId - Context ID
   * @param {string} agentId - Agent ID
   * @returns {string[]} Array of responsibilities
   */
  getAgentResponsibilities(contextId, agentId) {
    // Get agent roles
    const roles = this.getAgentRoles(contextId, agentId);
    
    // Verify context has roles defined
    if (!this.roles.has(contextId)) {
      return [];
    }
    
    const contextRoles = this.roles.get(contextId);
    
    // Collect responsibilities from all roles
    const responsibilities = new Set();
    
    for (const roleName of roles) {
      if (contextRoles.has(roleName)) {
        const role = contextRoles.get(roleName);
        for (const responsibility of role.responsibilities) {
          responsibilities.add(responsibility);
        }
      }
    }
    
    return Array.from(responsibilities);
  }
  
  /**
   * Get role definition
   * 
   * @param {string} contextId - Context ID
   * @param {string} roleName - Role name
   * @returns {Object|null} Role definition or null if not found
   */
  getRoleDefinition(contextId, roleName) {
    // Verify context has roles defined
    if (!this.roles.has(contextId)) {
      return null;
    }
    
    const contextRoles = this.roles.get(contextId);
    
    // Verify role exists
    if (!contextRoles.has(roleName)) {
      return null;
    }
    
    // Return role definition
    return { ...contextRoles.get(roleName) };
  }
  
  /**
   * Get all role definitions for a context
   * 
   * @param {string} contextId - Context ID
   * @returns {Object} Map of role definitions
   */
  getAllRoleDefinitions(contextId) {
    // Verify context has roles defined
    if (!this.roles.has(contextId)) {
      return {};
    }
    
    const contextRoles = this.roles.get(contextId);
    const definitions = {};
    
    // Convert Map to Object
    for (const [roleName, definition] of contextRoles.entries()) {
      definitions[roleName] = { ...definition };
    }
    
    return definitions;
  }
  
  /**
   * Shutdown the role manager
   */
  shutdown() {
    this.logger.info('Shutting down Role Manager');
    
    // Clear all data
    this.roles.clear();
    this.agentRoles.clear();
  }
  
  /**
   * Get agents with role (internal implementation)
   * @private
   * 
   * @param {string} contextId - Context ID
   * @param {string} roleName - Role name
   * @returns {string[]} Array of agent IDs
   */
  _getAgentsWithRole(contextId, roleName) {
    // Verify context has agent roles
    if (!this.agentRoles.has(contextId)) {
      return [];
    }
    
    const contextAgentRoles = this.agentRoles.get(contextId);
    const agentsWithRole = [];
    
    // Find agents with role
    for (const [agentId, roles] of contextAgentRoles.entries()) {
      if (roles.has(roleName)) {
        agentsWithRole.push(agentId);
      }
    }
    
    return agentsWithRole;
  }
}

module.exports = RoleManager;
