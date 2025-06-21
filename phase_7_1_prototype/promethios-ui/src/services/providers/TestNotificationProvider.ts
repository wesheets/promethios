import { Notification, NotificationProvider, NotificationFilter } from '../types/notification';

/**
 * Test Notification Provider
 * Provides mock notifications for development and testing
 */
export class TestNotificationProvider implements NotificationProvider {
  name = 'test';
  private notifications: Notification[] = [];
  private subscribers: ((notification: Notification) => void)[] = [];

  constructor() {
    // Initialize with sample notifications
    this.initializeSampleNotifications();
  }

  private initializeSampleNotifications() {
    const sampleNotifications: Omit<Notification, 'id' | 'timestamp'>[] = [
      {
        type: 'governance',
        title: 'Policy Violation Detected',
        message: 'Agent "Assistant" attempted to access restricted data without proper authorization.',
        read: false,
        priority: 'critical',
        category: 'security',
        actions: [
          { label: 'Review Details', url: '/ui/governance/violations' },
          { label: 'Update Policy', url: '/ui/governance/policies' }
        ],
        source: 'governance-engine'
      },
      {
        type: 'trust_boundary',
        title: 'Trust Score Updated',
        message: 'Agent trust score increased to 85% after successful compliance check.',
        read: false,
        priority: 'medium',
        category: 'trust',
        actions: [
          { label: 'View Trust Metrics', url: '/ui/trust-metrics' }
        ],
        source: 'trust-engine'
      },
      {
        type: 'observer',
        title: 'New Session Started',
        message: 'Observer Agent has initiated a new monitoring session for user interactions.',
        read: true,
        priority: 'low',
        category: 'monitoring',
        actions: [
          { label: 'View Session', url: '/ui/observer/sessions' }
        ],
        source: 'observer-agent'
      },
      {
        type: 'system',
        title: 'System Health Check',
        message: 'All systems operational. Last check completed successfully.',
        read: true,
        priority: 'low',
        category: 'health',
        actions: [
          { label: 'View Details', url: '/ui/system/health' }
        ],
        source: 'health-monitor'
      },
      {
        type: 'governance',
        title: 'New Policy Available',
        message: 'Updated data privacy policy requires review and acknowledgment.',
        read: false,
        priority: 'high',
        category: 'policy',
        actions: [
          { label: 'Review Policy', url: '/ui/governance/policies/new' },
          { label: 'Acknowledge', url: '/ui/governance/acknowledge' }
        ],
        source: 'policy-manager'
      }
    ];

    // Create notifications with IDs and timestamps
    sampleNotifications.forEach((notif, index) => {
      const notification: Notification = {
        ...notif,
        id: `test-${index + 1}`,
        timestamp: new Date(Date.now() - (index * 3600000)).toISOString() // Spread over last few hours
      };
      this.notifications.push(notification);
    });

    // Sort by timestamp (newest first)
    this.notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  subscribe(callback: (notification: Notification) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      // Notify subscribers of the update
      this.subscribers.forEach(callback => callback(notification));
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        // Notify subscribers of each update
        this.subscribers.forEach(callback => callback(notification));
      }
    });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      this.notifications.splice(index, 1);
    }
  }

  async getNotifications(filter?: NotificationFilter): Promise<Notification[]> {
    let filtered = [...this.notifications];

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(n => filter.type!.includes(n.type));
      }
      if (filter.priority) {
        filtered = filtered.filter(n => filter.priority!.includes(n.priority));
      }
      if (filter.category) {
        filtered = filtered.filter(n => n.category && filter.category!.includes(n.category));
      }
      if (filter.unreadOnly) {
        filtered = filtered.filter(n => !n.read);
      }
      if (filter.since) {
        const sinceDate = new Date(filter.since);
        filtered = filtered.filter(n => new Date(n.timestamp) >= sinceDate);
      }
      if (filter.offset) {
        filtered = filtered.slice(filter.offset);
      }
      if (filter.limit) {
        filtered = filtered.slice(0, filter.limit);
      }
    }

    return filtered;
  }

  async createNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Promise<string> {
    const id = `test-${Date.now()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date().toISOString()
    };

    this.notifications.unshift(newNotification); // Add to beginning (newest first)
    
    // Notify subscribers
    this.subscribers.forEach(callback => callback(newNotification));
    
    return id;
  }

  // Helper method to simulate real-time notifications
  simulateNotification(type: Notification['type'], priority: Notification['priority'] = 'medium') {
    const templates = {
      governance: {
        title: 'Governance Alert',
        message: 'New governance event requires attention.',
        category: 'governance'
      },
      trust_boundary: {
        title: 'Trust Boundary Event',
        message: 'Trust boundary validation completed.',
        category: 'trust'
      },
      observer: {
        title: 'Observer Update',
        message: 'Observer agent has new insights available.',
        category: 'monitoring'
      },
      system: {
        title: 'System Notification',
        message: 'System status update available.',
        category: 'system'
      },
      info: {
        title: 'Information',
        message: 'General information notification.',
        category: 'info'
      },
      success: {
        title: 'Success',
        message: 'Operation completed successfully.',
        category: 'success'
      },
      warning: {
        title: 'Warning',
        message: 'Warning notification requires attention.',
        category: 'warning'
      },
      error: {
        title: 'Error',
        message: 'Error notification requires immediate attention.',
        category: 'error'
      }
    };

    const template = templates[type];
    this.createNotification({
      type,
      title: template.title,
      message: template.message,
      read: false,
      priority,
      category: template.category,
      source: 'test-provider'
    });
  }
}

