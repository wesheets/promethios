/* Core Plugin Registry
 * Manages registration and retrieval of all plugins in the system
 * Provides a standardized interface for plugin discovery and initialization
 */

class PluginRegistry {
    constructor() {
        this.plugins = {
            agents: {},
            governance: {},
            ui: {},
            scenarios: {}
        };
        this.initialized = false;
        console.log('Plugin Registry initialized');
    }

    /**
     * Initialize the plugin registry
     * This method exists for API consistency with other modules
     * @param {Object} options - Initialization options
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize(options = {}) {
        console.log('PluginRegistry initialize method called', options);
        // Already initialized in constructor, but method provided for API consistency
        return Promise.resolve(true);
    }

    /**
     * Register a plugin with the registry
     * @param {string} type - The plugin type (agents, governance, ui, scenarios)
     * @param {string} id - Unique identifier for the plugin
     * @param {Object} plugin - The plugin object or class
     * @returns {boolean} - Success status
     */
    register(type, id, plugin) {
        if (!this.plugins[type]) {
            console.error(`Invalid plugin type: ${type}`);
            return false;
        }

        if (this.plugins[type][id]) {
            console.warn(`Plugin ${id} of type ${type} already registered. Overwriting.`);
        }

        this.plugins[type][id] = plugin;
        console.log(`Registered plugin: ${type}.${id}`);
        return true;
    }

    /**
     * Get a plugin by type and id
     * @param {string} type - The plugin type
     * @param {string} id - The plugin id
     * @returns {Object|null} - The plugin or null if not found
     */
    getPlugin(type, id) {
        if (!this.plugins[type] || !this.plugins[type][id]) {
            console.warn(`Plugin not found: ${type}.${id}`);
            return null;
        }
        return this.plugins[type][id];
    }

    /**
     * Get all plugins of a specific type
     * @param {string} type - The plugin type
     * @returns {Object} - Object containing all plugins of the specified type
     */
    getPluginsByType(type) {
        if (!this.plugins[type]) {
            console.warn(`Invalid plugin type: ${type}`);
            return {};
        }
        return this.plugins[type];
    }

    /**
     * Initialize all registered plugins
     * @param {Object} config - Configuration object to pass to plugins
     * @returns {Promise} - Resolves when all plugins are initialized
     */
    async initializePlugins(config) {
        if (this.initialized) {
            console.warn('Plugins already initialized');
            return;
        }

        const initPromises = [];

        // Initialize each plugin type
        for (const type in this.plugins) {
            for (const id in this.plugins[type]) {
                const plugin = this.plugins[type][id];
                if (plugin && typeof plugin.initialize === 'function') {
                    console.log(`Initializing plugin: ${type}.${id}`);
                    initPromises.push(plugin.initialize(config));
                }
            }
        }

        await Promise.all(initPromises);
        this.initialized = true;
        console.log('All plugins initialized');
    }

    /**
     * Check if a plugin exists
     * @param {string} type - The plugin type
     * @param {string} id - The plugin id
     * @returns {boolean} - True if the plugin exists
     */
    hasPlugin(type, id) {
        return !!(this.plugins[type] && this.plugins[type][id]);
    }

    /**
     * Unregister a plugin
     * @param {string} type - The plugin type
     * @param {string} id - The plugin id
     * @returns {boolean} - Success status
     */
    unregister(type, id) {
        if (!this.plugins[type] || !this.plugins[type][id]) {
            console.warn(`Plugin not found: ${type}.${id}`);
            return false;
        }

        delete this.plugins[type][id];
        console.log(`Unregistered plugin: ${type}.${id}`);
        return true;
    }
}

// Create and export singleton instance
const pluginRegistry = new PluginRegistry();
export default pluginRegistry;
