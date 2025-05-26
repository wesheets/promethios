/**
 * Notification System for Phase Change Tracker
 * 
 * This module provides a modular notification framework for the Phase Change Tracker,
 * supporting email notifications and integration with communication platforms.
 */

const path = require('path');
const fs = require('fs');

// Import notification providers
const emailProvider = require('./providers/email');
const slackProvider = require('./providers/slack');
const teamsProvider = require('./providers/teams');
const discordProvider = require('./providers/discord');

// Configuration management
const CONFIG_FILE = path.join(__dirname, 'config.json');

/**
 * Notification Manager class
 */
class NotificationManager {
  constructor() {
    this.config = this.loadConfig();
    this.providers = {
      email: emailProvider,
      slack: slackProvider,
      teams: teamsProvider,
      discord: discordProvider
    };
    this.subscribers = this.loadSubscribers();
  }

  /**
   * Load configuration from file
   */
  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      }
    } catch (error) {
      console.error(`Error loading notification config: ${error.message}`);
    }

    // Default configuration
    return {
      enabled: true,
      providers: {
        email: {
          enabled: true,
          service: 'smtp',
          config: {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: {
              user: 'user@example.com',
              pass: 'password'
            }
          }
        },
        slack: {
          enabled: false,
          webhookUrl: ''
        },
        teams: {
          enabled: false,
          webhookUrl: ''
        },
        discord: {
          enabled: false,
          webhookUrl: ''
        }
      }
    };
  }

  /**
   * Save configuration to file
   */
  saveConfig() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error(`Error saving notification config: ${error.message}`);
    }
  }

  /**
   * Load subscribers from file
   */
  loadSubscribers() {
    const subscribersFile = path.join(__dirname, 'subscribers.json');
    try {
      if (fs.existsSync(subscribersFile)) {
        return JSON.parse(fs.readFileSync(subscribersFile, 'utf8'));
      }
    } catch (error) {
      console.error(`Error loading subscribers: ${error.message}`);
    }

    // Default empty subscribers list
    return [];
  }

  /**
   * Save subscribers to file
   */
  saveSubscribers() {
    const subscribersFile = path.join(__dirname, 'subscribers.json');
    try {
      fs.writeFileSync(subscribersFile, JSON.stringify(this.subscribers, null, 2));
    } catch (error) {
      console.error(`Error saving subscribers: ${error.message}`);
    }
  }

  /**
   * Add a subscriber
   */
  addSubscriber(subscriber) {
    // Validate subscriber
    if (!subscriber.id || !subscriber.name || !subscriber.email) {
      throw new Error('Subscriber must have id, name, and email');
    }

    // Check if subscriber already exists
    const existingIndex = this.subscribers.findIndex(s => s.id === subscriber.id);
    if (existingIndex >= 0) {
      this.subscribers[existingIndex] = {
        ...this.subscribers[existingIndex],
        ...subscriber
      };
    } else {
      this.subscribers.push(subscriber);
    }

    this.saveSubscribers();
    return subscriber;
  }

  /**
   * Remove a subscriber
   */
  removeSubscriber(subscriberId) {
    const initialLength = this.subscribers.length;
    this.subscribers = this.subscribers.filter(s => s.id !== subscriberId);
    
    if (this.subscribers.length !== initialLength) {
      this.saveSubscribers();
      return true;
    }
    
    return false;
  }

  /**
   * Update subscriber preferences
   */
  updateSubscriberPreferences(subscriberId, preferences) {
    const subscriber = this.subscribers.find(s => s.id === subscriberId);
    if (!subscriber) {
      return false;
    }

    subscriber.preferences = {
      ...subscriber.preferences,
      ...preferences
    };

    this.saveSubscribers();
    return true;
  }

  /**
   * Get subscribers for a specific notification
   */
  getSubscribersForNotification(notification) {
    return this.subscribers.filter(subscriber => {
      // If subscriber has no preferences, include them in all notifications
      if (!subscriber.preferences) {
        return true;
      }

      // Check if subscriber wants this type of notification
      if (subscriber.preferences.notificationTypes && 
          !subscriber.preferences.notificationTypes.includes(notification.type)) {
        return false;
      }

      // Check if subscriber is interested in the affected components
      if (subscriber.preferences.components && notification.components) {
        const hasMatchingComponent = notification.components.some(component => 
          subscriber.preferences.components.includes(component)
        );
        if (!hasMatchingComponent) {
          return false;
        }
      }

      // Check if subscriber is interested in the affected directories
      if (subscriber.preferences.directories && notification.directories) {
        const hasMatchingDirectory = notification.directories.some(directory => {
          return subscriber.preferences.directories.some(subscriberDir => {
            // Check if the notification directory starts with the subscriber directory
            // This allows subscribing to parent directories
            return directory.startsWith(subscriberDir);
          });
        });
        if (!hasMatchingDirectory) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Send a notification
   */
  async sendNotification(notification) {
    if (!this.config.enabled) {
      console.log('Notifications are disabled');
      return { success: false, reason: 'Notifications are disabled' };
    }

    // Validate notification
    if (!notification.type || !notification.title || !notification.message) {
      throw new Error('Notification must have type, title, and message');
    }

    // Get subscribers for this notification
    const subscribers = this.getSubscribersForNotification(notification);
    if (subscribers.length === 0) {
      console.log('No subscribers for this notification');
      return { success: true, sent: 0 };
    }

    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: []
    };

    // Send via each enabled provider
    for (const [providerName, provider] of Object.entries(this.providers)) {
      const providerConfig = this.config.providers[providerName];
      
      if (providerConfig && providerConfig.enabled) {
        try {
          const providerResult = await provider.send(notification, subscribers, providerConfig);
          
          results.sent += providerResult.sent || 0;
          results.failed += providerResult.failed || 0;
          
          if (providerResult.errors && providerResult.errors.length > 0) {
            results.errors.push(...providerResult.errors.map(error => ({
              provider: providerName,
              error
            })));
          }
        } catch (error) {
          results.failed += subscribers.length;
          results.errors.push({
            provider: providerName,
            error: error.message
          });
        }
      }
    }

    // Update success flag if any notifications failed
    if (results.failed > 0) {
      results.success = false;
    }

    return results;
  }

  /**
   * Send a phase change notification
   */
  async sendPhaseChangeNotification(report) {
    const notification = {
      type: 'phase-change',
      title: `Phase Change: ${report.previousPhase} to ${report.currentPhase}`,
      message: `A new phase change report has been generated documenting the transition from Phase ${report.previousPhase} to Phase ${report.currentPhase}.`,
      data: {
        report,
        summary: {
          addedDirectories: report.dirChanges.added.length,
          removedDirectories: report.dirChanges.removed.length,
          modifiedDirectories: report.dirChanges.modified.length,
          addedFiles: report.fileChanges.added.length,
          removedFiles: report.fileChanges.removed.length,
          modifiedFiles: report.fileChanges.modified.length
        }
      },
      components: this.extractComponentsFromReport(report),
      directories: this.extractDirectoriesFromReport(report),
      reportUrl: `${this.config.baseUrl || ''}phase_changes/phase_${report.previousPhase}_to_${report.currentPhase}_changes.md`,
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(notification);
  }

  /**
   * Extract affected components from a report
   */
  extractComponentsFromReport(report) {
    const components = new Set();

    // Add components from API changes
    if (report.apiChanges) {
      if (report.apiChanges.components) {
        report.apiChanges.components.added.forEach(comp => components.add(comp.name));
        report.apiChanges.components.removed.forEach(comp => components.add(comp.name));
        report.apiChanges.components.modified.forEach(comp => components.add(comp.name));
      }
    }

    return Array.from(components);
  }

  /**
   * Extract affected directories from a report
   */
  extractDirectoriesFromReport(report) {
    const directories = new Set();

    // Add directories from directory changes
    if (report.dirChanges) {
      report.dirChanges.added.forEach(dir => directories.add(dir));
      report.dirChanges.removed.forEach(dir => directories.add(dir));
      report.dirChanges.modified.forEach(dir => directories.add(dir));
    }

    return Array.from(directories);
  }
}

module.exports = new NotificationManager();
