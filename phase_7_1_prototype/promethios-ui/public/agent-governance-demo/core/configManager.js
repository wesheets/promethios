/* Configuration Manager
 * Manages application configuration and feature flags
 * Supports environment-specific settings and dynamic configuration
 */

class ConfigManager {
    constructor() {
        this.config = {
            // Default configuration
            api: {
                baseUrl: '',
                timeout: 30000,
                retries: 2
            },
            features: {
                governance: true,
                reporting: true,
                tracing: true
            },
            providers: {
                openai: { enabled: true },
                anthropic: { enabled: true },
                huggingface: { enabled: true },
                cohere: { enabled: true }
            },
            roles: {
                hrSpecialist: { enabled: true },
                projectManager: { enabled: true },
                technicalLead: { enabled: true }
            },
            ui: {
                theme: 'dark',
                animationSpeed: 'normal',
                showDebugInfo: false
            }
        };
        
        this.environmentConfig = {};
        this.userConfig = {};
        this.initialized = false;
    }

    /**
     * Initialize configuration from multiple sources
     * @param {Object} options - Initialization options
     * @returns {Promise} - Resolves when configuration is loaded
     */
    async initialize(options = {}) {
        if (this.initialized) {
            console.warn('Config Manager already initialized');
            return this.config;
        }

        try {
            console.log('Initializing Config Manager...');
            
            // Load environment config if specified
            if (options.environmentConfigPath) {
                try {
                    await this.loadEnvironmentConfig(options.environmentConfigPath);
                } catch (error) {
                    console.warn('Failed to load environment config, using defaults:', error);
                }
            }

            // Load user config if specified
            if (options.userConfigPath) {
                try {
                    await this.loadUserConfig(options.userConfigPath);
                } catch (error) {
                    console.warn('Failed to load user config, using defaults:', error);
                }
            }

            // Apply any direct config overrides
            if (options.configOverrides) {
                this.applyConfigOverrides(options.configOverrides);
            }

            // Apply URL parameters if enabled
            if (options.enableUrlParams !== false && typeof window !== 'undefined') {
                try {
                    this.applyUrlParameters();
                } catch (error) {
                    console.warn('Failed to apply URL parameters:', error);
                }
            }

            // Merge all configs with priority: defaults < environment < user < overrides < URL params
            this.mergeConfigurations();
            
            this.initialized = true;
            console.log('Config Manager fully initialized');
            return this.config;
        } catch (error) {
            console.error('Error initializing Config Manager:', error);
            // Fall back to defaults on error
            this.mergeConfigurations();
            this.initialized = true;
            return this.config;
        }
    }

    /**
     * Load environment configuration from a JSON file
     * @param {string} path - Path to the configuration file
     * @returns {Promise} - Resolves when configuration is loaded
     */
    async loadEnvironmentConfig(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load environment config: ${response.status}`);
            }
            this.environmentConfig = await response.json();
            console.log('Loaded environment configuration');
        } catch (error) {
            console.warn('Failed to load environment config, using defaults:', error);
            this.environmentConfig = {};
        }
    }

    /**
     * Load user configuration from a JSON file or localStorage
     * @param {string} path - Path to the configuration file or localStorage key
     * @returns {Promise} - Resolves when configuration is loaded
     */
    async loadUserConfig(path) {
        // First try localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const localConfig = localStorage.getItem(path);
                if (localConfig) {
                    this.userConfig = JSON.parse(localConfig);
                    console.log('Loaded user configuration from localStorage');
                    return;
                }
            } catch (error) {
                console.warn('Failed to load user config from localStorage:', error);
            }
        }

        // Fall back to file
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load user config: ${response.status}`);
            }
            this.userConfig = await response.json();
            console.log('Loaded user configuration from file');
        } catch (error) {
            console.warn('Failed to load user config from file, using defaults:', error);
            this.userConfig = {};
        }
    }

    /**
     * Apply configuration overrides
     * @param {Object} overrides - Configuration overrides
     */
    applyConfigOverrides(overrides) {
        this.configOverrides = overrides;
        console.log('Applied configuration overrides');
    }

    /**
     * Apply URL parameters as configuration overrides
     */
    applyUrlParameters() {
        if (typeof window === 'undefined') return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const urlConfig = {};

        // Process boolean parameters
        for (const [key, value] of urlParams.entries()) {
            if (value === 'true' || value === 'false') {
                this.setNestedProperty(urlConfig, key, value === 'true');
            } else if (!isNaN(Number(value))) {
                this.setNestedProperty(urlConfig, key, Number(value));
            } else {
                this.setNestedProperty(urlConfig, key, value);
            }
        }

        this.urlConfig = urlConfig;
        console.log('Applied URL parameters to configuration');
    }

    /**
     * Set a nested property in an object using dot notation
     * @param {Object} obj - Target object
     * @param {string} path - Property path in dot notation
     * @param {*} value - Value to set
     */
    setNestedProperty(obj, path, value) {
        const parts = path.split('.');
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }

        current[parts[parts.length - 1]] = value;
    }

    /**
     * Merge all configuration sources
     */
    mergeConfigurations() {
        // Deep merge with priority: defaults < environment < user < overrides < URL params
        this.config = this.deepMerge(
            this.config,
            this.environmentConfig || {},
            this.userConfig || {},
            this.configOverrides || {},
            this.urlConfig || {}
        );
    }

    /**
     * Deep merge multiple objects
     * @param {...Object} objects - Objects to merge
     * @returns {Object} - Merged object
     */
    deepMerge(...objects) {
        const result = {};

        for (const obj of objects) {
            if (!obj) continue;
            
            for (const key in obj) {
                if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    result[key] = this.deepMerge(result[key] || {}, obj[key]);
                } else {
                    result[key] = obj[key];
                }
            }
        }

        return result;
    }

    /**
     * Get a configuration value
     * @param {string} path - Configuration path in dot notation
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} - Configuration value
     */
    get(path, defaultValue = null) {
        const parts = path.split('.');
        let current = this.config;

        for (const part of parts) {
            if (current === undefined || current === null || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[part];
        }

        return current !== undefined ? current : defaultValue;
    }

    /**
     * Set a configuration value
     * @param {string} path - Configuration path in dot notation
     * @param {*} value - Value to set
     * @param {boolean} persist - Whether to persist to localStorage
     * @returns {boolean} - Success status
     */
    set(path, value, persist = false) {
        this.setNestedProperty(this.config, path, value);

        if (persist && typeof window !== 'undefined' && window.localStorage) {
            try {
                // Update user config
                this.setNestedProperty(this.userConfig, path, value);
                
                // Persist to localStorage
                localStorage.setItem('userConfig', JSON.stringify(this.userConfig));
                console.log(`Persisted config change: ${path}`);
                return true;
            } catch (error) {
                console.error(`Failed to persist config change: ${path}`, error);
                return false;
            }
        }

        return true;
    }

    /**
     * Check if a feature is enabled
     * @param {string} feature - Feature name
     * @returns {boolean} - True if feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.get(`features.${feature}`, false);
    }

    /**
     * Get the entire configuration object
     * @returns {Object} - Configuration object
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Reset configuration to defaults
     * @param {boolean} persist - Whether to persist to localStorage
     * @returns {boolean} - Success status
     */
    reset(persist = false) {
        this.config = { ...this.defaultConfig };
        
        if (persist && typeof window !== 'undefined' && window.localStorage) {
            try {
                localStorage.removeItem('userConfig');
                this.userConfig = {};
                console.log('Reset and persisted configuration');
                return true;
            } catch (error) {
                console.error('Failed to persist configuration reset', error);
                return false;
            }
        }

        return true;
    }
}

// Create and export singleton instance
const configManager = new ConfigManager();
export default configManager;
