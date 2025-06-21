/**
 * Test Suite for NotificationService
 * Following Promethios test patterns and ensuring comprehensive coverage
 */

import { NotificationService } from '../services/NotificationService';
import { Notification, NotificationConfig, NotificationFilter } from '../types/notification';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        })
      },
      writable: true
    });

    notificationService = new NotificationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', async () => {
      const result = await notificationService.initialize();
      expect(result).toBe(true);
    });

    test('should initialize with custom configuration', async () => {
      const config: NotificationConfig = {
        maxNotifications: 50,
        defaultExpiryTime: 24 * 60 * 60 * 1000, // 1 day
        defaultPriority: 'high',
        autoMarkAsRead: false,
        storage: {
          type: 'localStorage'
        }
      };

      const result = await notificationService.initialize(config);
      expect(result).toBe(true);
    });

    test('should handle initialization errors gracefully', async () => {
      // Mock localStorage to throw an error
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await notificationService.initialize();
      expect(result).toBe(true); // Should still succeed with fallback
    });
  });

  describe('Notification Creation', () => {
    beforeEach(async () => {
      await notificationService.initialize();
    });

    test('should create a notification with all required fields', async () => {
      const notification: Omit<Notification, 'id' | 'createdAt' | 'read'> = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      };

      const notificationId = await notificationService.createNotification(notification);
      expect(notificationId).toBeDefined();
      expect(typeof notificationId).toBe('string');
    });

    test('should auto-generate ID if not provided', async () => {
      const notification: Omit<Notification, 'id' | 'createdAt' | 'read'> = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      };

      const notificationId = await notificationService.createNotification(notification);
      const notifications = await notificationService.getNotifications();
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe(notificationId);
    });

    test('should set default values for optional fields', async () => {
      const notification: Omit<Notification, 'id' | 'createdAt' | 'read'> = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      };

      await notificationService.createNotification(notification);
      const notifications = await notificationService.getNotifications();
      
      expect(notifications[0].read).toBe(false);
      expect(notifications[0].createdAt).toBeDefined();
      expect(typeof notifications[0].createdAt).toBe('number');
    });

    test('should handle governance violation notifications', async () => {
      const notification: Omit<Notification, 'id' | 'createdAt' | 'read'> = {
        title: 'Governance Violation',
        message: 'A governance rule has been violated',
        type: 'governance_violation',
        priority: 'high',
        source: 'governance',
        dismissible: true,
        actions: [
          {
            id: 'view-details',
            label: 'View Details',
            type: 'link',
            url: '/governance/violations/123'
          }
        ],
        data: {
          violationId: '123',
          ruleId: '456'
        },
        context: {
          userId: '789',
          module: 'governance'
        }
      };

      const notificationId = await notificationService.createNotification(notification);
      const notifications = await notificationService.getNotifications();
      
      expect(notifications[0].type).toBe('governance_violation');
      expect(notifications[0].actions).toHaveLength(1);
      expect(notifications[0].data?.violationId).toBe('123');
    });
  });

  describe('Notification Retrieval', () => {
    beforeEach(async () => {
      await notificationService.initialize();
    });

    test('should retrieve all notifications', async () => {
      // Create test notifications
      await notificationService.createNotification({
        title: 'Test 1',
        message: 'Message 1',
        type: 'info',
        priority: 'low',
        source: 'system',
        dismissible: true
      });

      await notificationService.createNotification({
        title: 'Test 2',
        message: 'Message 2',
        type: 'warning',
        priority: 'medium',
        source: 'governance',
        dismissible: true
      });

      const notifications = await notificationService.getNotifications();
      expect(notifications).toHaveLength(2);
    });

    test('should filter notifications by type', async () => {
      await notificationService.createNotification({
        title: 'Info Notification',
        message: 'Info message',
        type: 'info',
        priority: 'low',
        source: 'system',
        dismissible: true
      });

      await notificationService.createNotification({
        title: 'Warning Notification',
        message: 'Warning message',
        type: 'warning',
        priority: 'medium',
        source: 'governance',
        dismissible: true
      });

      const filter: NotificationFilter = { type: ['info'] };
      const notifications = await notificationService.getNotifications(filter);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('info');
    });

    test('should filter notifications by priority', async () => {
      await notificationService.createNotification({
        title: 'Low Priority',
        message: 'Low priority message',
        type: 'info',
        priority: 'low',
        source: 'system',
        dismissible: true
      });

      await notificationService.createNotification({
        title: 'High Priority',
        message: 'High priority message',
        type: 'error',
        priority: 'high',
        source: 'system',
        dismissible: true
      });

      const filter: NotificationFilter = { priority: ['high'] };
      const notifications = await notificationService.getNotifications(filter);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].priority).toBe('high');
    });

    test('should filter notifications by read status', async () => {
      const notificationId = await notificationService.createNotification({
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      await notificationService.markAsRead(notificationId);

      await notificationService.createNotification({
        title: 'Unread Notification',
        message: 'Unread message',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      const unreadFilter: NotificationFilter = { read: false };
      const unreadNotifications = await notificationService.getNotifications(unreadFilter);
      
      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].title).toBe('Unread Notification');
    });
  });

  describe('Notification Management', () => {
    beforeEach(async () => {
      await notificationService.initialize();
    });

    test('should mark notification as read', async () => {
      const notificationId = await notificationService.createNotification({
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      const result = await notificationService.markAsRead(notificationId);
      expect(result).toBe(true);

      const notifications = await notificationService.getNotifications();
      expect(notifications[0].read).toBe(true);
    });

    test('should mark all notifications as read', async () => {
      await notificationService.createNotification({
        title: 'Test 1',
        message: 'Message 1',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      await notificationService.createNotification({
        title: 'Test 2',
        message: 'Message 2',
        type: 'warning',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      const result = await notificationService.markAllAsRead();
      expect(result).toBe(true);

      const notifications = await notificationService.getNotifications();
      expect(notifications.every(n => n.read)).toBe(true);
    });

    test('should delete notification', async () => {
      const notificationId = await notificationService.createNotification({
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      const result = await notificationService.deleteNotification(notificationId);
      expect(result).toBe(true);

      const notifications = await notificationService.getNotifications();
      expect(notifications).toHaveLength(0);
    });

    test('should update notification', async () => {
      const notificationId = await notificationService.createNotification({
        title: 'Original Title',
        message: 'Original message',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      const updates = {
        title: 'Updated Title',
        message: 'Updated message',
        priority: 'high' as const
      };

      const result = await notificationService.updateNotification(notificationId, updates);
      expect(result).toBe(true);

      const notifications = await notificationService.getNotifications();
      expect(notifications[0].title).toBe('Updated Title');
      expect(notifications[0].message).toBe('Updated message');
      expect(notifications[0].priority).toBe('high');
    });
  });

  describe('Notification Count', () => {
    beforeEach(async () => {
      await notificationService.initialize();
    });

    test('should get total notification count', async () => {
      await notificationService.createNotification({
        title: 'Test 1',
        message: 'Message 1',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      await notificationService.createNotification({
        title: 'Test 2',
        message: 'Message 2',
        type: 'warning',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      const count = await notificationService.getNotificationCount();
      expect(count).toBe(2);
    });

    test('should get unread notification count', async () => {
      const notificationId1 = await notificationService.createNotification({
        title: 'Test 1',
        message: 'Message 1',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      await notificationService.createNotification({
        title: 'Test 2',
        message: 'Message 2',
        type: 'warning',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      await notificationService.markAsRead(notificationId1);

      const unreadCount = await notificationService.getNotificationCount({ read: false });
      expect(unreadCount).toBe(1);
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      await notificationService.initialize();
    });

    test('should subscribe to notifications', () => {
      const callback = jest.fn();
      const subscriptionId = notificationService.subscribeToNotifications(callback);
      
      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe('string');
      expect(callback).toHaveBeenCalledWith([]);
    });

    test('should notify subscribers when notification is created', async () => {
      const callback = jest.fn();
      notificationService.subscribeToNotifications(callback);

      await notificationService.createNotification({
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      expect(callback).toHaveBeenCalledTimes(2); // Initial call + notification created
    });

    test('should unsubscribe from notifications', async () => {
      const callback = jest.fn();
      const subscriptionId = notificationService.subscribeToNotifications(callback);
      
      const result = notificationService.unsubscribeFromNotifications(subscriptionId);
      expect(result).toBe(true);

      await notificationService.createNotification({
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      expect(callback).toHaveBeenCalledTimes(1); // Only initial call
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await notificationService.initialize();
    });

    test('should handle invalid notification ID gracefully', async () => {
      const result = await notificationService.markAsRead('invalid-id');
      expect(result).toBe(false);
    });

    test('should handle storage errors gracefully', async () => {
      // Mock localStorage to throw an error
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const notificationId = await notificationService.createNotification({
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      expect(notificationId).toBeDefined(); // Should still work with in-memory fallback
    });
  });

  describe('Expiry Management', () => {
    beforeEach(async () => {
      await notificationService.initialize({
        defaultExpiryTime: 1000 // 1 second for testing
      });
    });

    test('should handle expired notifications', async () => {
      const notification: Omit<Notification, 'id' | 'createdAt' | 'read'> = {
        title: 'Expiring Notification',
        message: 'This notification will expire',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true,
        expiresAt: Date.now() + 500 // Expires in 500ms
      };

      await notificationService.createNotification(notification);

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 600));

      // Trigger cleanup by creating another notification
      await notificationService.createNotification({
        title: 'New Notification',
        message: 'New message',
        type: 'info',
        priority: 'medium',
        source: 'system',
        dismissible: true
      });

      const notifications = await notificationService.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('New Notification');
    });
  });
});

