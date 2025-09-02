import React, { useState } from 'react';
import { Button } from '@mui/material';
import { notificationService } from '../../services/NotificationService';
import { userInteractionRegistry } from '../../services/UserInteractionRegistry';
import { useMockAuth } from './MockAuthProvider';
import { createMockUser, deleteMockUser, MockUser } from '../../utils/testUtils';

/**
 * Debug component to test notification system
 * This creates a test notification for the current user to verify the system works
 */
const NotificationTestButton: React.FC = () => {
  const { currentUser } = useMockAuth();
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [createdMockUsers, setCreatedMockUsers] = useState<MockUser[]>([]);

  const handleTestNotification = async () => {
    if (!currentUser?.uid) {
      console.error('No current user for notification test');
      return;
    }

    setIsCreatingTest(true);
    console.log('🧪 [NotificationTest] Creating test notification for user:', currentUser.uid);

    try {
      // Method 1: Direct notification service test
      notificationService.createTestNotification('info');
      
      // Method 2: Test via UserInteractionRegistry with real mock users
      console.log('🧪 [NotificationTest] Creating mock users for realistic testing...');
      
      // Create two mock users for testing
      const mockSender = await createMockUser({
        displayName: 'Alice Collaborator',
        email: 'alice.collaborator@example.com'
      });
      
      const mockRecipient = await createMockUser({
        displayName: 'Bob Partner',
        email: 'bob.partner@example.com'
      });

      // Track created users for cleanup
      setCreatedMockUsers([mockSender, mockRecipient]);
      
      // Test 1: Send collaboration invitation FROM current user TO mock recipient
      await userInteractionRegistry.sendInteraction(
        'collaboration_invitation',
        currentUser.uid, // Real sender ID
        mockRecipient.uid, // Mock recipient
        {
          conversationName: 'AI Strategy Discussion',
          agentName: 'Claude Assistant',
          conversationId: `conv_${Date.now()}`,
          message: 'Would you like to join this AI collaboration session to discuss our project strategy?'
        }
      );

      // Test 2: Simulate receiving a collaboration invitation (FROM mock sender TO current user)
      await userInteractionRegistry.sendInteraction(
        'collaboration_invitation',
        mockSender.uid, // Mock sender
        currentUser.uid, // Real recipient (current user will see this notification)
        {
          conversationName: 'Product Development Chat',
          agentName: 'GPT-4 Assistant',
          conversationId: `conv_incoming_${Date.now()}`,
          message: 'Join me in this AI collaboration session to brainstorm product features!'
        }
      );

      // Test 3: Connection request between mock users
      await userInteractionRegistry.sendInteraction(
        'connection_request',
        mockSender.uid,
        mockRecipient.uid,
        {
          message: 'Hi! I\'d like to connect and explore collaboration opportunities.'
        }
      );

      console.log('✅ [NotificationTest] Test notifications created successfully with real user flow');
      console.log('🧪 [NotificationTest] Created mock users:', { mockSender, mockRecipient });
      
      // Auto-cleanup after 30 seconds
      setTimeout(async () => {
        console.log('🧹 [NotificationTest] Auto-cleaning up mock users...');
        await deleteMockUser(mockSender.uid);
        await deleteMockUser(mockRecipient.uid);
        setCreatedMockUsers([]);
      }, 30000);
      
    } catch (error) {
      console.error('❌ [NotificationTest] Error creating test notification:', error);
    } finally {
      setIsCreatingTest(false);
    }
  };

  const handleCleanupMockUsers = async () => {
    console.log('🧹 [NotificationTest] Manually cleaning up mock users...');
    for (const user of createdMockUsers) {
      await deleteMockUser(user.uid);
    }
    setCreatedMockUsers([]);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        onClick={handleTestNotification}
        disabled={isCreatingTest}
        sx={{
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.9)',
          },
          '&:disabled': {
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'rgba(255,255,255,0.5)',
          }
        }}
      >
        {isCreatingTest ? '🔄 Creating...' : '🧪 Test Notifications'}
      </Button>
      
      {createdMockUsers.length > 0 && (
        <Button
          variant="outlined"
          color="warning"
          size="small"
          onClick={handleCleanupMockUsers}
          sx={{
            backgroundColor: 'rgba(255,165,0,0.8)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255,165,0,0.9)',
            }
          }}
        >
          🧹 Cleanup ({createdMockUsers.length})
        </Button>
      )}
    </div>
  );
};

export default NotificationTestButton;

