/* Agent Registry
 * Provides global access to the AgentBase class
 * Resolves module loading and scope issues
 */

// Import the AgentBase class
import AgentBase from './agentBase.js';

// Create a registry to hold agent-related classes and utilities
class AgentRegistry {
    constructor() {
        this.AgentBase = AgentBase;
        this.registeredAgents = {};
        console.log('Agent Registry initialized with AgentBase class');
    }

    /**
     * Register an agent instance
     * @param {string} id - Agent ID
     * @param {Object} agent - Agent instance
     */
    registerAgent(id, agent) {
        this.registeredAgents[id] = agent;
        console.log(`Agent registered: ${id}`);
        return agent;
    }

    /**
     * Get an agent instance by ID
     * @param {string} id - Agent ID
     * @returns {Object} - Agent instance
     */
    getAgent(id) {
        return this.registeredAgents[id];
    }

    /**
     * Get all registered agents
     * @returns {Object} - Map of agent instances
     */
    getAllAgents() {
        return this.registeredAgents;
    }
}

// Create and export a singleton instance
const agentRegistry = new AgentRegistry();

// Make AgentBase globally available
if (typeof window !== 'undefined') {
    window.AgentBase = AgentBase;
    window.agentRegistry = agentRegistry;
    console.log('AgentBase class made globally available');
}

export default agentRegistry;
