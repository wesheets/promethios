/**
 * Notification Extension Tests
 * 
 * Simplified tests for the notification extension without complex extension framework
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationExtension, notificationExtension } from '../extensions/NotificationExtension';

// Mock the notification service
vi.mock('../services/NotificationService', () => ({
  NotificationService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(true),
    sendNotification: vi.fn().mockResolvedValue(true),
    registerProvider: vi.fn().mockResolvedValue(true)
  }))
}));

describe('NotificationExtension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NotificationExtension.getInstance();
      const instance2 = NotificationExtension.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as the exported singleton', () => {
      const instance = NotificationExtension.getInstance();
      expect(instance).toBe(notificationExtension);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const result = await notificationExtension.initialize();
      expect(result).toBe(true);
      expect(notificationExtension.isInitialized()).toBe(true);
    });

    it('should return true if already initialized', async () => {
      await notificationExtension.initialize();
      const result = await notificationExtension.initialize();
      expect(result).toBe(true);
    });

    it('should handle initialization errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create a new instance to test error handling
      const testExtension = new (NotificationExtension as any)();
      testExtension.notificationService = {
        initialize: vi.fn().mockRejectedValue(new Error('Init failed'))
      };
      
      const result = await testExtension.initialize();
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Extension Points', () => {
    beforeEach(async () => {
      await notificationExtension.initialize();
    });

    it('should execute beforeNotificationSend extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const notification = { id: 'test-notification-1' };
      
      await notificationExtension.beforeNotificationSend(notification);
      
      expect(consoleSpy).toHaveBeenCalledWith('Before notification send:', 'test-notification-1');
      consoleSpy.mockRestore();
    });

    it('should execute afterNotificationSend extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const notification = { id: 'test-notification-2' };
      
      await notificationExtension.afterNotificationSend(notification);
      
      expect(consoleSpy).toHaveBeenCalledWith('After notification send:', 'test-notification-2');
      consoleSpy.mockRestore();
    });

    it('should execute beforeNotificationReceive extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const notification = { id: 'test-notification-3' };
      
      await notificationExtension.beforeNotificationReceive(notification);
      
      expect(consoleSpy).toHaveBeenCalledWith('Before notification receive:', 'test-notification-3');
      consoleSpy.mockRestore();
    });

    it('should execute afterNotificationReceive extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const notification = { id: 'test-notification-4' };
      
      await notificationExtension.afterNotificationReceive(notification);
      
      expect(consoleSpy).toHaveBeenCalledWith('After notification receive:', 'test-notification-4');
      consoleSpy.mockRestore();
    });

    it('should handle errors in onNotificationError extension point', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test notification error');
      
      await notificationExtension.onNotificationError(testError, 'send', 'test-notification-5');
      
      expect(consoleSpy).toHaveBeenCalledWith('Notification error in send for test-notification-5:', testError);
      consoleSpy.mockRestore();
    });
  });

  describe('Notification Operations', () => {
    beforeEach(async () => {
      await notificationExtension.initialize();
    });

    it('should send notification with extension points', async () => {
      const beforeSpy = vi.spyOn(notificationExtension, 'beforeNotificationSend');
      const afterSpy = vi.spyOn(notificationExtension, 'afterNotificationSend');
      const notification = { id: 'test-notification-6', message: 'Test message' };
      
      await notificationExtension.sendNotification(notification);
      
      expect(beforeSpy).toHaveBeenCalledWith(notification);
      expect(afterSpy).toHaveBeenCalledWith(notification);
    });

    it('should handle errors during notification send', async () => {
      const errorSpy = vi.spyOn(notificationExtension, 'onNotificationError');
      const notification = { id: 'test-notification-7', message: 'Test message' };
      
      // Mock the service to throw an error
      const service = notificationExtension.getNotificationService();
      service.sendNotification = vi.fn().mockRejectedValue(new Error('Send failed'));
      
      await expect(notificationExtension.sendNotification(notification)).rejects.toThrow('Send failed');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should register providers', async () => {
      const provider = { id: 'test-provider', name: 'Test Provider' };
      
      await notificationExtension.registerProvider(provider as any);
      
      const service = notificationExtension.getNotificationService();
      expect(service.registerProvider).toHaveBeenCalledWith(provider);
    });
  });

  describe('Utility Methods', () => {
    it('should return the notification service', () => {
      const service = notificationExtension.getNotificationService();
      expect(service).toBeDefined();
    });

    it('should return initialization status', async () => {
      expect(notificationExtension.isInitialized()).toBe(false);
      await notificationExtension.initialize();
      expect(notificationExtension.isInitialized()).toBe(true);
    });
  });
});

