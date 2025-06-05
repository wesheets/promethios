/* Configuration Manager
 * Manages application configuration and feature flags
 * Supports environment-specific settings and dynamic configuration
 */

// Make sure we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Log module loading for diagnostics
console.log('configManager.js module loading');

class ConfigManager {
    constructor() {
        console.log('ConfigManager constructor called');
        
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
        
        // Make this instance available globally for debugging
        if (isBrowser) {
            window._configManager = this;
        }
    }

    /**
     * Initialize configuration from multiple sources
     * @param {Object} options - Initialization options
     * @returns {Promise} - Resolves when configuration is loaded
     */
    async initialize(options = {}) {
        console.log('ConfigManager.initialize called with options:', options);
        
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
            if (options.enableUrlParams !== false && isBrowser) {
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
            console.log(`Loading environment config from ${path}`);
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
        if (isBrowser && window.localStorage) {
            try {
                console.log(`Checking localStorage for user config at key: ${path}`);
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
            console.log(`Loading user config from file: ${path}`);
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load user config: ${response.status}`);
            }
            this.userConfig = await response.json();
            console.log('Loaded user configuration from file');
        } catch (error) {
            console.warn('Failed to load user config from file:', error);
            this.userConfig = {};
        }
    }

    /**
     * Apply configuration overrides
     * @param {Object} overrides - Configuration overrides
     */
    applyConfigOverrides(overrides) {
        console.log('Applying config overrides:', overrides);
        this.configOverrides = overrides;
    }

    /**
     * Apply URL parameters as configuration overrides
     */
    applyUrlParameters() {
        if (!isBrowser) return;
        
        console.log('Applying URL parameters to config');
        const params = new URLSearchParams(window.location.search);
        const urlConfig = {};

        // Process boolean parameters
        for (const [key, value] of params.entries()) {
            if (value === 'true' || value === 'false') {
                this.setNestedProperty(urlConfig, key, value === 'true');
            } else if (!isNaN(Number(value))) {
                this.setNestedProperty(urlConfig, key, Number(value));
            } else {
                this.setNestedProperty(urlConfig, key, value);
            }
        }

        this.urlConfig = urlConfig;
        console.log('Applied URL parameters:', urlConfig);
    }

    /**
     * Set a nested property in an object
     * @param {Object} obj - Target object
     * @param {string} path - Property path (e.g. 'features.governance')
     * @param {any} value - Property value
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
        console.log('Merging configurations');
        
        // Deep merge function
        const deepMerge = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        };

        // Create a copy of the default config
        const mergedConfig = JSON.parse(JSON.stringify(this.config));

        // Apply configurations in order of priority
        if (this.environmentConfig) deepMerge(mergedConfig, this.environmentConfig);
        if (this.userConfig) deepMerge(mergedConfig, this.userConfig);
        if (this.configOverrides) deepMerge(mergedConfig, this.configOverrides);
        if (this.urlConfig) deepMerge(mergedConfig, this.urlConfig);

        this.config = mergedConfig;
        console.log('Merged configuration:', this.config);
    }

    /**
     * Get a configuration value
     * @param {string} path - Property path (e.g. 'features.governance')
     * @param {any} defaultValue - Default value if property doesn't exist
     * @returns {any} - Configuration value
     */
    get(path, defaultValue) {
        const parts = path.split('.');
        let current = this.config;

        for (const part of parts) {
            if (current[part] === undefined) {
                return defaultValue;
            }
            current = current[part];
        }

        return current;
    }

    /**
     * Set a configuration value
     * @param {string} path - Property path (e.g. 'features.governance')
     * @param {any} value - Property value
     * @returns {boolean} - True if successful
     */
    set(path, value) {
        console.log(`Setting config value: ${path} =`, value);
        this.setNestedProperty(this.config, path, value);
        
        // Save to localStorage if available
        if (isBrowser && window.localStorage) {
            try {
                localStorage.setItem('userConfig', JSON.stringify(this.config));
            } catch (error) {
                console.warn('Failed to save config to localStorage:', error);
            }
        }

        return true;
    }
}

// Create and export singleton instance
console.log('Creating configManager singleton instance');
const configManager = new ConfigManager();

// Make it available globally for debugging
if (isBrowser) {
    console.log('Exposing configManager globally as window.configManager');
    window.configManager = configManager;
}

console.log('Exporting configManager singleton');
export default configManager;
