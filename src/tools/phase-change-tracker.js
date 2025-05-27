/**
 * Phase Change Tracker Mock Implementation
 * 
 * This is a mock implementation of the phase-change-tracker module
 * to support testing of the Tool Selection History module.
 * 
 * @module tools/phase-change-tracker
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Mock Phase Change Tracker class
 */
class PhaseChangeTracker {
  /**
   * Constructor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = options;
    this.changes = [];
    this.logger = options.logger || {
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
  }

  /**
   * Track a phase change
   * @param {Object} change - Change details
   * @returns {Object} Tracked change with ID
   */
  trackChange(change) {
    const trackedChange = {
      id: uuidv4(),
      timestamp: Date.now(),
      ...change
    };
    
    this.changes.push(trackedChange);
    this.logger.info(`Tracked phase change: ${trackedChange.id}`);
    
    return trackedChange;
  }

  /**
   * Get all tracked changes
   * @returns {Array} List of tracked changes
   */
  getChanges() {
    return this.changes;
  }

  /**
   * Get a specific change by ID
   * @param {string} id - Change ID
   * @returns {Object|null} Change object or null if not found
   */
  getChangeById(id) {
    return this.changes.find(change => change.id === id) || null;
  }

  /**
   * Attribute a change to a specific source
   * @param {string} changeId - Change ID
   * @param {Object} attribution - Attribution details
   * @returns {Object|null} Updated change or null if not found
   */
  attributeChange(changeId, attribution) {
    const change = this.getChangeById(changeId);
    
    if (!change) {
      this.logger.warn(`Cannot attribute change: ${changeId} not found`);
      return null;
    }
    
    change.attribution = attribution;
    this.logger.info(`Attributed change ${changeId} to ${attribution.source}`);
    
    return change;
  }
}

/**
 * Register a component with the Phase Change Tracker
 * @param {Object} component - Component details
 * @returns {Object} Registration result
 */
function registerWithPhaseChangeTracker(component) {
  console.info(`Registering component with Phase Change Tracker: ${component.componentName}`);
  return {
    success: true,
    registrationId: uuidv4(),
    timestamp: Date.now()
  };
}

module.exports = {
  PhaseChangeTracker,
  registerWithPhaseChangeTracker
};
