import { NotificationProvider, NotificationType } from '../types/notification';
import { NotificationService } from '../NotificationService';

/**
 * Test notification provider for development and demonstration
 * Generates sample notifications to test the notification system
 */
export class TestNotificationProvider implements NotificationProvider {
  id = 'test-notification-provider';
  name = 'Test Notification Provider';
  description = 'Provides test notifications for development and demonstration';
  supportedTypes: NotificationType[] = [
    'info',
    'success', 
    'warning',
    'error',
    'governance_violation',
    'trust_boundary_breach',
    'observer_suggestion',
    'system_event'
  ];

  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async initialize(): Promise<boolean> {
    console.log('TestNotificationProvider initialized');
    return true;
  }

  async start(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }

    this.isRunning = true;
    console.log('TestNotificationProvider started');

    // Generate a test notification every 30 seconds (for demo purposes)
    this.intervalId = setInterval(() => {
      this.generateRandomNotification();
    }, 30000);

    // Generate an initial notification
    setTimeout(() => {
      this.generateWelcomeNotification();
    }, 2000);

    return true;
  }

  async stop(): Promise<boolean> {
    if (!this.isRunning) {
      return true;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('TestNotificationProvider stopped');
    return true;
  }

  private async generateWelcomeNotification(): Promise<void> {
    try {
      await notificationService.createNotification({
        title: 'Welcome to Promethios!',
        message: 'Your AI governance system is now active and monitoring your agents.',
        type: 'success',
        priority: 'medium',
        source: 'system',
        dismissible: true,
        actions: [
          {
            id: 'view-dashboard',
            label: 'View Dashboard',
            type: 'link',
            url: '/dashboard'
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss'
          }
        ],
        context: {
          module: 'onboarding'
        }
      });
    } catch (error) {
      console.error('Failed to generate welcome notification:', error);
    }
  }

  private async generateRandomNotification(): Promise<void> {
    const notifications = [
      {
        title: 'Governance Violation Detected',
        message: 'Potential bias detected in agent response to user query about hiring practices.',
        type: 'governance_violation' as const,
        priority: 'high' as const,
        source: 'governance' as const,
        actions: [
          {
            id: 'view-violation',
            label: 'Review Violation',
            type: 'link' as const,
            url: '/governance/violations'
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss' as const
          }
        ]
      },
      {
        title: 'Trust Boundary Alert',
        message: 'Agent attempted to access restricted data outside its trust boundary.',
        type: 'trust_boundary_breach' as const,
        priority: 'critical' as const,
        source: 'trust_metrics' as const,
        actions: [
          {
            id: 'view-breach',
            label: 'Investigate',
            type: 'link' as const,
            url: '/trust/boundaries'
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss' as const
          }
        ]
      },
      {
        title: 'Observer Suggestion',
        message: 'Consider adding additional context validation for financial queries.',
        type: 'observer_suggestion' as const,
        priority: 'medium' as const,
        source: 'observer' as const,
        actions: [
          {
            id: 'apply-suggestion',
            label: 'Apply',
            type: 'button' as const,
            handler: () => console.log('Applying observer suggestion...')
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss' as const
          }
        ]
      },
      {
        title: 'System Health Check',
        message: 'All governance systems are operating normally. Trust score: 94%',
        type: 'info' as const,
        priority: 'low' as const,
        source: 'system' as const,
        actions: [
          {
            id: 'view-metrics',
            label: 'View Metrics',
            type: 'link' as const,
            url: '/dashboard'
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss' as const
          }
        ]
      },
      {
        title: 'Policy Update Available',
        message: 'New GDPR compliance policies are available for your review and approval.',
        type: 'warning' as const,
        priority: 'medium' as const,
        source: 'governance' as const,
        actions: [
          {
            id: 'review-policies',
            label: 'Review Policies',
            type: 'link' as const,
            url: '/governance/policies'
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss' as const
          }
        ]
      }
    ];

    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];

    try {
      await notificationService.createNotification({
        ...randomNotification,
        dismissible: true,
        context: {
          module: 'test',
          generated: true
        }
      });
    } catch (error) {
      console.error('Failed to generate random notification:', error);
    }
  }

  /**
   * Manually trigger a specific type of test notification
   */
  async triggerTestNotification(type: 'governance' | 'trust' | 'observer' | 'system' | 'welcome'): Promise<void> {
    switch (type) {
      case 'welcome':
        await this.generateWelcomeNotification();
        break;
      case 'governance':
        await notificationService.createNotification({
          title: 'Manual Test: Governance Violation',
          message: 'This is a test governance violation notification.',
          type: 'governance_violation',
          priority: 'high',
          source: 'governance',
          dismissible: true,
          actions: [
            {
              id: 'view-details',
              label: 'View Details',
              type: 'link',
              url: '/governance/violations'
            },
            {
              id: 'dismiss',
              label: 'Dismiss',
              type: 'dismiss'
            }
          ]
        });
        break;
      case 'trust':
        await notificationService.createNotification({
          title: 'Manual Test: Trust Boundary Breach',
          message: 'This is a test trust boundary breach notification.',
          type: 'trust_boundary_breach',
          priority: 'critical',
          source: 'trust_metrics',
          dismissible: true,
          actions: [
            {
              id: 'investigate',
              label: 'Investigate',
              type: 'link',
              url: '/trust/boundaries'
            },
            {
              id: 'dismiss',
              label: 'Dismiss',
              type: 'dismiss'
            }
          ]
        });
        break;
      case 'observer':
        await notificationService.createNotification({
          title: 'Manual Test: Observer Suggestion',
          message: 'This is a test observer suggestion notification.',
          type: 'observer_suggestion',
          priority: 'medium',
          source: 'observer',
          dismissible: true,
          actions: [
            {
              id: 'apply',
              label: 'Apply Suggestion',
              type: 'button',
              handler: () => console.log('Test suggestion applied')
            },
            {
              id: 'dismiss',
              label: 'Dismiss',
              type: 'dismiss'
            }
          ]
        });
        break;
      case 'system':
        await notificationService.createNotification({
          title: 'Manual Test: System Event',
          message: 'This is a test system event notification.',
          type: 'system_event',
          priority: 'low',
          source: 'system',
          dismissible: true,
          actions: [
            {
              id: 'view-details',
              label: 'View Details',
              type: 'link',
              url: '/dashboard'
            },
            {
              id: 'dismiss',
              label: 'Dismiss',
              type: 'dismiss'
            }
          ]
        });
        break;
    }
  }
}

// Export singleton instance
export const testNotificationProvider = new TestNotificationProvider();

