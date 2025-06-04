/* Event Bus
 * Provides a centralized event system for component communication
 * Implements pub/sub pattern for loose coupling between components
 */

class EventBus {
    constructor() {
        this.subscribers = {};
        this.eventHistory = [];
        this.historyLimit = 100; // Limit event history to prevent memory issues
        console.log('Event Bus initialized');
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name to subscribe to
     * @param {Function} callback - Function to call when event is published
     * @param {Object} context - Context to bind to the callback
     * @returns {Object} - Subscription object with unsubscribe method
     */
    subscribe(event, callback, context = null) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }

        const subscription = { callback, context };
        this.subscribers[event].push(subscription);

        // Return object with unsubscribe method
        return {
            unsubscribe: () => {
                const index = this.subscribers[event].indexOf(subscription);
                if (index !== -1) {
                    this.subscribers[event].splice(index, 1);
                    return true;
                }
                return false;
            }
        };
    }

    /**
     * Publish an event with data
     * @param {string} event - Event name to publish
     * @param {*} data - Data to pass to subscribers
     * @returns {boolean} - True if event had subscribers
     */
    publish(event, data = null) {
        // Add to event history
        this.eventHistory.push({
            event,
            data,
            timestamp: new Date().toISOString()
        });

        // Trim history if needed
        if (this.eventHistory.length > this.historyLimit) {
            this.eventHistory = this.eventHistory.slice(-this.historyLimit);
        }

        // If no subscribers, return false
        if (!this.subscribers[event] || this.subscribers[event].length === 0) {
            return false;
        }

        // Notify all subscribers
        this.subscribers[event].forEach(subscription => {
            try {
                const { callback, context } = subscription;
                if (context) {
                    callback.call(context, data);
                } else {
                    callback(data);
                }
            } catch (error) {
                console.error(`Error in event subscriber for ${event}:`, error);
            }
        });

        return true;
    }

    /**
     * Get event history
     * @param {string} event - Optional event name to filter history
     * @param {number} limit - Maximum number of events to return
     * @returns {Array} - Array of event objects
     */
    getHistory(event = null, limit = this.historyLimit) {
        if (event) {
            return this.eventHistory
                .filter(item => item.event === event)
                .slice(-limit);
        }
        return this.eventHistory.slice(-limit);
    }

    /**
     * Clear all subscribers
     * @returns {void}
     */
    clearSubscribers() {
        this.subscribers = {};
    }

    /**
     * Clear event history
     * @returns {void}
     */
    clearHistory() {
        this.eventHistory = [];
    }

    /**
     * Get count of subscribers for an event
     * @param {string} event - Event name
     * @returns {number} - Number of subscribers
     */
    subscriberCount(event) {
        if (!this.subscribers[event]) {
            return 0;
        }
        return this.subscribers[event].length;
    }
}

// Create and export singleton instance
const eventBus = new EventBus();
export default eventBus;
