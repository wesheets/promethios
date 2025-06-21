import { Notification, NotificationProvider } from '../types/notification';

/**
 * Test Notification Provider
 * Generates test notifications for development and demonstration
 */
export class TestNotificationProvider implements NotificationProvider {
  name = 'test';
  private callbacks = new Set<(notification: Notification) => void>();
  private interval: NodeJS.Timeout | null = null;

  subscribe(callback: (notification: Notification) => void): () => void {
    this.callbacks.add(callback);
    
    // Start generating test notifications if this is the first subscriber
    if (this.callbacks.size === 1) {
      this.startTestNotifications();
    }
    
    return () => {
      this.callbacks.delete(callback);
      
      // Stop generating notifications if no more subscribers
      if (this.callbacks.size === 0) {
        this.stopTestNotifications();
      }
    };
  }

  async markAsRead(notificationId: string): Promise<void> {
    // Test provider doesn't need to persist read status
    console.log(`Test provider: Marked notification ${notificationId} as read`);
  }

  async markAllAsRead(): Promise<void> {
    console.log('Test provider: Marked all notifications as read');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    console.log(`Test provider: Deleted notification ${notificationId}`);
  }

  async getNotifications(): Promise<Notification[]> {
    // Test provider doesn't store notifications
    return [];
  }

  private startTestNotifications(): void {
    // Generate a test notification every 30 seconds
    this.interval = setInterval(() => {
      this.generateTestNotification();
    }, 30000);

    // Generate initial notification
    setTimeout(() => {
      this.generateTestNotification();
    }, 2000);
  }

  private stopTestNotifications(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private generateTestNotification(): void {
    const notifications = [
      {
        type: 'governance' as const,
        title: 'Policy Violation Detected',
        message: 'Agent attempted to access restricted data without proper authorization',
        priority: 'high' as const,
        category: 'security'
      },
      {
        type: 'agent' as const,
        title: 'Agent Task Completed',
        message: 'Data analysis task completed successfully with 95% confidence',
        priority: 'medium' as const,
        category: 'agent-activity'
      },
      {
        type: 'info' as const,
        title: 'System Update Available',
        message: 'New governance framework version 2.1.0 is available',
        priority: 'low' as const,
        category: 'system'
      },
      {
        type: 'warning' as const,
        title: 'Trust Score Declining',
        message: 'Agent trust score has dropped below 80% threshold',
        priority: 'medium' as const,
        category: 'trust'
      },
      {
        type: 'success' as const,
        title: 'Compliance Check Passed',
        message: 'All agents passed the latest compliance verification',
        priority: 'low' as const,
        category: 'compliance'
      }
    ];

    const template = notifications[Math.floor(Math.random() * notifications.length)];
    
    const notification: Notification = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      title: template.title,
      message: template.message,
      timestamp: Date.now(),
      read: false,
      priority: template.priority,
      category: template.category,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // Expire in 24 hours
    };

    // Notify all subscribers
    this.callbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Test notification provider callback error:', error);
      }
    });
  }

  /**
   * Manually trigger a test notification
   */
  triggerTestNotification(type?: Notification['type']): void {
    const notifications = [
      {
        type: type || 'info' as const,
        title: 'Manual Test Notification',
        message: `This is a manually triggered ${type || 'info'} notification`,
        priority: 'medium' as const,
        category: 'test'
      }
    ];

    const template = notifications[0];
    
    const notification: Notification = {
      id: `manual-test-${Date.now()}`,
      type: template.type,
      title: template.title,
      message: template.message,
      timestamp: Date.now(),
      read: false,
      priority: template.priority,
      category: template.category
    };

    this.callbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Manual test notification callback error:', error);
      }
    });
  }
}

