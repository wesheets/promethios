/**
 * Test Suite for NotificationExtension
 * Tests the integration with Promethios extension system
 */

import { NotificationExtension } from '../extensions/NotificationExtension';
import { ExtensionPointFramework } from '../../../phase_6_3_new/src/core/governance/extension_point_framework';

// Mock the ExtensionPointFramework
jest.mock('../../../phase_6_3_new/src/core/governance/extension_point_framework');

describe('NotificationExtension', () => {
  let mockExtensionPointFramework: jest.Mocked<ExtensionPointFramework>;
  let notificationExtension: NotificationExtension;

  beforeEach(() => {
    // Create mock extension point framework
    mockExtensionPointFramework = {
      register_extension_point: jest.fn().mockReturnValue(true),
      register_implementation: jest.fn().mockReturnValue(true),
      unregister_extension_point: jest.fn().mockReturnValue(true),
      unregister_implementation: jest.fn().mockReturnValue(true),
      invoke_extension_point: jest.fn(),
      get_extension_point: jest.fn(),
      get_implementation: jest.fn(),
      list_extension_points: jest.fn(),
      list_implementations: jest.fn()
    } as any;

    notificationExtension = new NotificationExtension(mockExtensionPointFramework);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Extension Registration', () => {
    test('should register extension point and implementation successfully', async () => {
      const result = await notificationExtension.register();
      
      expect(result).toBe(true);
      expect(mockExtensionPointFramework.register_extension_point).toHaveBeenCalledWith(
        expect.objectContaining({
          extension_point_id: 'promethios.notification.system',
          name: 'Unified Notification System',
          description: 'Provides unified notifications across all Promethios modules'
        })
      );
      expect(mockExtensionPointFramework.register_implementation).toHaveBeenCalledWith(
        'promethios.notification.system',
        expect.objectContaining({
          implementation_id: 'promethios.notification.system.default',
          name: 'Default Notification Implementation'
        })
      );
    });

    test('should handle extension point registration failure', async () => {
      mockExtensionPointFramework.register_extension_point.mockReturnValue(false);
      
      const result = await notificationExtension.register();
      
      expect(result).toBe(false);
      expect(mockExtensionPointFramework.register_implementation).not.toHaveBeenCalled();
    });

    test('should handle implementation registration failure', async () => {
      mockExtensionPointFramework.register_implementation.mockReturnValue(false);
      
      const result = await notificationExtension.register();
      
      expect(result).toBe(false);
    });

    test('should handle registration errors gracefully', async () => {
      mockExtensionPointFramework.register_extension_point.mockImplementation(() => {
        throw new Error('Registration error');
      });
      
      const result = await notificationExtension.register();
      
      expect(result).toBe(false);
    });
  });

  describe('Extension Unregistration', () => {
    beforeEach(async () => {
      await notificationExtension.register();
    });

    test('should unregister implementation and extension point successfully', async () => {
      const result = await notificationExtension.unregister();
      
      expect(result).toBe(true);
      expect(mockExtensionPointFramework.unregister_implementation).toHaveBeenCalledWith(
        'promethios.notification.system',
        'promethios.notification.system.default'
      );
      expect(mockExtensionPointFramework.unregister_extension_point).toHaveBeenCalledWith(
        'promethios.notification.system'
      );
    });

    test('should handle implementation unregistration failure', async () => {
      mockExtensionPointFramework.unregister_implementation.mockReturnValue(false);
      
      const result = await notificationExtension.unregister();
      
      expect(result).toBe(false);
    });

    test('should handle extension point unregistration failure', async () => {
      mockExtensionPointFramework.unregister_extension_point.mockReturnValue(false);
      
      const result = await notificationExtension.unregister();
      
      expect(result).toBe(false);
    });
  });

  describe('Service Access', () => {
    beforeEach(async () => {
      await notificationExtension.register();
    });

    test('should provide access to notification service', () => {
      const notificationService = notificationExtension.getNotificationService();
      expect(notificationService).toBeDefined();
    });

    test('should provide access to notification registry', () => {
      const notificationRegistry = notificationExtension.getNotificationRegistry();
      expect(notificationRegistry).toBeDefined();
    });

    test('should provide access to notification hub', () => {
      const notificationHub = notificationExtension.getNotificationHub();
      expect(notificationHub).toBeDefined();
    });
  });

  describe('Extension Point Execution', () => {
    beforeEach(async () => {
      await notificationExtension.register();
    });

    test('should execute create notification action', async () => {
      const input = {
        action: 'create',
        notification: {
          title: 'Test Notification',
          message: 'Test message',
          type: 'info',
          priority: 'medium',
          source: 'system'
        }
      };

      const result = await notificationExtension.execute(input);
      
      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
    });

    test('should execute get notifications action', async () => {
      const input = {
        action: 'getNotifications',
        filter: { type: ['info'] }
      };

      const result = await notificationExtension.execute(input);
      
      expect(result.success).toBe(true);
      expect(result.notifications).toBeDefined();
      expect(Array.isArray(result.notifications)).toBe(true);
    });

    test('should execute mark as read action', async () => {
      // First create a notification
      const createInput = {
        action: 'create',
        notification: {
          title: 'Test Notification',
          message: 'Test message',
          type: 'info',
          priority: 'medium',
          source: 'system'
        }
      };

      const createResult = await notificationExtension.execute(createInput);
      const notificationId = createResult.notificationId;

      // Then mark it as read
      const markInput = {
        action: 'markAsRead',
        notificationId
      };

      const result = await notificationExtension.execute(markInput);
      
      expect(result.success).toBe(true);
    });

    test('should execute delete notification action', async () => {
      // First create a notification
      const createInput = {
        action: 'create',
        notification: {
          title: 'Test Notification',
          message: 'Test message',
          type: 'info',
          priority: 'medium',
          source: 'system'
        }
      };

      const createResult = await notificationExtension.execute(createInput);
      const notificationId = createResult.notificationId;

      // Then delete it
      const deleteInput = {
        action: 'delete',
        notificationId
      };

      const result = await notificationExtension.execute(deleteInput);
      
      expect(result.success).toBe(true);
    });

    test('should execute get count action', async () => {
      const input = {
        action: 'getCount',
        filter: { read: false }
      };

      const result = await notificationExtension.execute(input);
      
      expect(result.success).toBe(true);
      expect(typeof result.count).toBe('number');
    });

    test('should handle unknown action', async () => {
      const input = {
        action: 'unknownAction'
      };

      const result = await notificationExtension.execute(input);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });

    test('should handle missing required parameters', async () => {
      const input = {
        action: 'create'
        // Missing notification data
      };

      const result = await notificationExtension.execute(input);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should handle execution errors gracefully', async () => {
      // Mock the notification service to throw an error
      const notificationService = notificationExtension.getNotificationService();
      jest.spyOn(notificationService, 'createNotification').mockRejectedValue(new Error('Service error'));

      const input = {
        action: 'create',
        notification: {
          title: 'Test Notification',
          message: 'Test message',
          type: 'info',
          priority: 'medium',
          source: 'system'
        }
      };

      const result = await notificationExtension.execute(input);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Service error');
    });
  });

  describe('Schema Validation', () => {
    test('should define proper input schema', async () => {
      await notificationExtension.register();
      
      const extensionPointCall = mockExtensionPointFramework.register_extension_point.mock.calls[0][0];
      const inputSchema = extensionPointCall.input_schema;
      
      expect(inputSchema.type).toBe('object');
      expect(inputSchema.properties.action).toBeDefined();
      expect(inputSchema.properties.notification).toBeDefined();
      expect(inputSchema.properties.filter).toBeDefined();
      expect(inputSchema.required).toContain('action');
    });

    test('should define proper output schema', async () => {
      await notificationExtension.register();
      
      const extensionPointCall = mockExtensionPointFramework.register_extension_point.mock.calls[0][0];
      const outputSchema = extensionPointCall.output_schema;
      
      expect(outputSchema.type).toBe('object');
      expect(outputSchema.properties.success).toBeDefined();
      expect(outputSchema.properties.data).toBeDefined();
      expect(outputSchema.properties.error).toBeDefined();
      expect(outputSchema.properties.notificationId).toBeDefined();
      expect(outputSchema.properties.notifications).toBeDefined();
      expect(outputSchema.properties.count).toBeDefined();
    });
  });

  describe('Metadata and Configuration', () => {
    test('should provide proper metadata', async () => {
      await notificationExtension.register();
      
      const extensionPointCall = mockExtensionPointFramework.register_extension_point.mock.calls[0][0];
      const metadata = extensionPointCall.metadata;
      
      expect(metadata.category).toBe('notification');
      expect(metadata.tags).toContain('notification');
      expect(metadata.tags).toContain('unified');
      expect(metadata.tags).toContain('system');
      expect(metadata.version).toBeDefined();
    });

    test('should provide proper implementation configuration', async () => {
      await notificationExtension.register();
      
      const implementationCall = mockExtensionPointFramework.register_implementation.mock.calls[0][1];
      const configuration = implementationCall.configuration;
      
      expect(configuration.maxNotifications).toBe(100);
      expect(configuration.defaultExpiryTime).toBeDefined();
      expect(configuration.defaultPriority).toBe('medium');
      expect(configuration.autoMarkAsRead).toBe(true);
      expect(configuration.storage.type).toBe('localStorage');
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain backward compatibility with existing notification interfaces', async () => {
      await notificationExtension.register();
      
      // Test that the extension can handle legacy notification formats
      const legacyInput = {
        action: 'create',
        notification: {
          title: 'Legacy Notification',
          message: 'Legacy message',
          type: 'info',
          priority: 'medium',
          source: 'system',
          // Legacy fields that might exist
          timestamp: Date.now(),
          category: 'legacy'
        }
      };

      const result = await notificationExtension.execute(legacyInput);
      expect(result.success).toBe(true);
    });

    test('should handle missing optional fields gracefully', async () => {
      await notificationExtension.register();
      
      const minimalInput = {
        action: 'create',
        notification: {
          title: 'Minimal Notification',
          message: 'Minimal message',
          type: 'info',
          priority: 'medium',
          source: 'system'
          // No optional fields
        }
      };

      const result = await notificationExtension.execute(minimalInput);
      expect(result.success).toBe(true);
    });
  });
});

