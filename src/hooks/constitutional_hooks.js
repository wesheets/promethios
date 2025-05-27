/**
 * Constitutional Hooks Manager
 * 
 * Manages the registration and execution of hooks for constitutional observers
 * in the Promethios governance framework. This module ensures that observers
 * can monitor system events without modifying them.
 * 
 * @module hooks/constitutional_hooks
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../utils/logger');
const { registerWithPhaseChangeTracker } = require('../tools/phase-change-tracker');

class ConstitutionalHooksManager {
  /**
   * Creates a new ConstitutionalHooksManager instance
   * @param {Object} config - Configuration object
   */
  constructor(config = {}) {
    this.config = config;
    this.observers = {};
    this.hooks = {};
    this.logger = createLogger({
      name: 'constitutional_hooks',
      level: config.log_level || 'info',
      file: 'logs/constitutional_hooks.json'
    });
    
    // Register with Phase Change Tracker
    this._registerWithPhaseChangeTracker();
    
    this.logger.info('Constitutional Hooks Manager initialized');
  }
  
  /**
   * Registers the Constitutional Hooks Manager with the Phase Change Tracker
   * @private
   */
  _registerWithPhaseChangeTracker() {
    try {
      registerWithPhaseChangeTracker({
        componentType: 'hooks',
        componentName: 'constitutional_hooks',
        version: '1.0.0',
        apis: [
          { name: 'registerObserver', version: '1.0.0', description: 'Registers an observer with the hooks manager' },
          { name: 'registerHook', version: '1.0.0', description: 'Registers a hook for a specific event type' },
          { name: 'triggerHook', version: '1.0.0', description: 'Triggers hooks for a specific event type' }
        ]
      });
    } catch (error) {
      this.logger.error('Failed to register with Phase Change Tracker', { error: error.message });
    }
  }
  
  /**
   * Registers an observer with the hooks manager
   * @param {string} observerId - Unique identifier for the observer
   * @param {Object} observer - Observer instance
   * @param {Array} hooks - Hooks to register for the observer
   * @returns {boolean} Success status
   */
  registerObserver(observerId, observer, hooks = []) {
    try {
      if (!observerId || !observer) {
        this.logger.error('Invalid observer registration', { observerId });
        return false;
      }
      
      this.observers[observerId] = observer;
      
      // Register hooks for the observer
      hooks.forEach(hook => {
        if (hook.type && hook.enabled) {
          this.registerHook(hook.type, observerId, hook.config);
        }
      });
      
      this.logger.info('Observer registered', { 
        observerId, 
        hooks: hooks.filter(h => h.enabled).map(h => h.type)
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error registering observer', { 
        observerId, 
        error: error.message
      });
      
      return false;
    }
  }
  
  /**
   * Registers a hook for a specific event type
   * @param {string} hookType - Type of hook to register
   * @param {string} observerId - Observer to register the hook for
   * @param {Object} config - Hook configuration
   * @returns {boolean} Success status
   */
  registerHook(hookType, observerId, config = {}) {
    try {
      if (!hookType || !observerId) {
        this.logger.error('Invalid hook registration', { hookType, observerId });
        return false;
      }
      
      if (!this.hooks[hookType]) {
        this.hooks[hookType] = [];
      }
      
      // Check if hook already exists
      const existingHook = this.hooks[hookType].find(h => h.observerId === observerId);
      if (existingHook) {
        // Update existing hook
        existingHook.config = config;
      } else {
        // Add new hook
        this.hooks[hookType].push({
          observerId,
          config
        });
      }
      
      this.logger.info('Hook registered', { hookType, observerId });
      
      return true;
    } catch (error) {
      this.logger.error('Error registering hook', { 
        hookType, 
        observerId, 
        error: error.message
      });
      
      return false;
    }
  }
  
  /**
   * Triggers hooks for a specific event type
   * @param {string} hookType - Type of hook to trigger
   * @param {Object} data - Data to pass to the hooks
   * @param {Object} context - Context information
   * @returns {Array} Results from the hooks
   */
  triggerHook(hookType, data, context = {}) {
    try {
      if (!hookType) {
        this.logger.error('Invalid hook trigger', { hookType });
        return [];
      }
      
      const hooks = this.hooks[hookType] || [];
      const results = [];
      
      // Execute hooks
      for (const hook of hooks) {
        const observer = this.observers[hook.observerId];
        if (!observer) {
          this.logger.warn('Observer not found for hook', { 
            hookType, 
            observerId: hook.observerId
          });
          continue;
        }
        
        try {
          let result;
          
          // Call appropriate observer method based on hook type
          switch (hookType) {
            case 'module_registration':
            case 'schema_validation':
            case 'manifest_validation':
              if (typeof observer.observeManifestValidation === 'function') {
                result = observer.observeManifestValidation(data, {
                  ...context,
                  hookType,
                  hookConfig: hook.config
                });
              }
              break;
              
            case 'belief_generation':
            case 'api_call':
              if (typeof observer.observeBeliefTrace === 'function') {
                result = observer.observeBeliefTrace(data, {
                  ...context,
                  hookType,
                  hookConfig: hook.config
                });
              }
              break;
              
            case 'trust_update':
              if (typeof observer.observeTrustUpdate === 'function') {
                result = observer.observeTrustUpdate(data, {
                  ...context,
                  hookType,
                  hookConfig: hook.config
                });
              }
              break;
              
            case 'loop_closure':
            case 'memory_mutation':
            case 'reflection_completion':
              if (typeof observer.observeLoopOutcome === 'function') {
                result = observer.observeLoopOutcome(data, {
                  ...context,
                  hookType,
                  hookConfig: hook.config
                });
              }
              break;
              
            default:
              this.logger.warn('Unknown hook type', { hookType });
              break;
          }
          
          if (result) {
            results.push({
              observerId: hook.observerId,
              result
            });
          }
        } catch (error) {
          this.logger.error('Error executing hook', { 
            hookType, 
            observerId: hook.observerId, 
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      this.logger.error('Error triggering hooks', { 
        hookType, 
        error: error.message
      });
      
      return [];
    }
  }
  
  /**
   * Loads observers from the system manifest
   * @param {string} manifestPath - Path to the system manifest
   * @returns {boolean} Success status
   */
  loadObserversFromManifest(manifestPath) {
    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      if (!manifest.components || !manifest.components.observers) {
        this.logger.warn('No observers found in manifest', { manifestPath });
        return false;
      }
      
      const observers = manifest.components.observers;
      let success = true;
      
      // Load each observer
      for (const [observerId, observerConfig] of Object.entries(observers)) {
        if (!observerConfig.enabled) {
          this.logger.info('Observer disabled, skipping', { observerId });
          continue;
        }
        
        try {
          // Load observer module
          const observerPath = path.resolve(process.cwd(), observerConfig.path);
          const observerModule = require(observerPath);
          
          // Instantiate observer
          let observer;
          if (observerId === 'prism' && observerModule.PrismObserver) {
            observer = new observerModule.PrismObserver(observerConfig);
          } else if (observerId === 'vigil' && observerModule.VigilObserver) {
            observer = new observerModule.VigilObserver(observerConfig);
          } else {
            this.logger.error('Observer class not found', { observerId, observerPath });
            success = false;
            continue;
          }
          
          // Register observer
          const registered = this.registerObserver(observerId, observer, observerConfig.hooks || []);
          if (!registered) {
            success = false;
          }
        } catch (error) {
          this.logger.error('Error loading observer', { 
            observerId, 
            error: error.message
          });
          success = false;
        }
      }
      
      return success;
    } catch (error) {
      this.logger.error('Error loading observers from manifest', { 
        manifestPath, 
        error: error.message
      });
      
      return false;
    }
  }
}

module.exports = {
  ConstitutionalHooksManager
};
