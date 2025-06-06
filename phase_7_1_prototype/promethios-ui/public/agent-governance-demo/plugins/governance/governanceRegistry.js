/* Governance Registry
 * Provides global access to the GovernanceBase class
 * Resolves module loading and scope issues
 */

// Import the GovernanceBase class
import GovernanceBase from './governanceBase.js';

// Create a registry to hold governance-related classes and utilities
class GovernanceRegistry {
    constructor() {
        this.GovernanceBase = GovernanceBase;
        this.registeredPlugins = {};
        console.log('Governance Registry initialized with GovernanceBase class');
    }

    /**
     * Register a governance plugin instance
     * @param {string} id - Plugin ID
     * @param {Object} plugin - Plugin instance
     */
    registerPlugin(id, plugin) {
        this.registeredPlugins[id] = plugin;
        console.log(`Governance plugin registered: ${id}`);
        return plugin;
    }

    /**
     * Get a governance plugin instance by ID
     * @param {string} id - Plugin ID
     * @returns {Object} - Plugin instance
     */
    getPlugin(id) {
        return this.registeredPlugins[id];
    }

    /**
     * Get all registered governance plugins
     * @returns {Object} - Map of plugin instances
     */
    getAllPlugins() {
        return this.registeredPlugins;
    }
}

// Create and export a singleton instance
const governanceRegistry = new GovernanceRegistry();

// Make GovernanceBase globally available
if (typeof window !== 'undefined') {
    window.GovernanceBase = GovernanceBase;
    window.governanceRegistry = governanceRegistry;
    console.log('GovernanceBase class made globally available');
}

export default governanceRegistry;
