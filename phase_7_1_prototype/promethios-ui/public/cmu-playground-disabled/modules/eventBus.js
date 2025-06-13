/**
 * EventBus Module
 * Simple publish/subscribe event system for CMU playground modules
 * Provides the missing EventBus functionality that all modules depend on
 */

const EventBus = {
  // Store event listeners
  events: {},

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event to listen for
   * @param {function} callback - Function to call when event is published
   */
  subscribe(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    console.log(`EventBus: Subscribed to '${eventName}'`);
  },

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {function} callback - Function to remove
   */
  unsubscribe(eventName, callback) {
    if (!this.events[eventName]) return;
    
    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    console.log(`EventBus: Unsubscribed from '${eventName}'`);
  },

  /**
   * Publish an event to all subscribers
   * @param {string} eventName - Name of the event to publish
   * @param {*} data - Data to pass to event handlers
   */
  publish(eventName, data) {
    if (!this.events[eventName]) {
      console.log(`EventBus: No subscribers for '${eventName}'`);
      return;
    }

    console.log(`EventBus: Publishing '${eventName}' to ${this.events[eventName].length} subscribers`);
    
    this.events[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`EventBus: Error in event handler for '${eventName}':`, error);
      }
    });
  },

  /**
   * Get list of all events with subscriber counts
   * @returns {Object} Event names and subscriber counts
   */
  getEvents() {
    const eventInfo = {};
    Object.keys(this.events).forEach(eventName => {
      eventInfo[eventName] = this.events[eventName].length;
    });
    return eventInfo;
  },

  /**
   * Clear all event listeners
   */
  clear() {
    this.events = {};
    console.log('EventBus: All events cleared');
  }
};

// Make EventBus globally available
window.EventBus = EventBus;

// Export for ES6 modules
export default EventBus;

