import React from 'react';
import { Button } from '@mui/material';
import { notificationService } from '../../services/NotificationService';
import { userInteractionRegistry } from '../../services/UserInteractionRegistry';
import { useAuth } from '../../context/AuthContext';

/**
 * Debug component to test notification system
 * This creates a test notification for the current user to verify the system works
 */
const NotificationTestButton: React.FC = () => {
  const { currentUser } = useAuth();

  const handleTestNotification = async () => {
    if (!currentUser?.uid) {
      console.error('No current user for notification test');
      return;
    }

    console.log('🧪 [NotificationTest] Creating test notification for user:', currentUser.uid);

    try {
      // Method 1: Direct notification service test
      notificationService.createTestNotification('info');
      
      // Method 2: Test via UserInteractionRegistry (simulates real flow)
      await userInteractionRegistry.sendInteraction(
        'collaboration_invitation',
        'test-sender-id',
        currentUser.uid, // Send to current user so we can see it
        {
          conversationName: 'Test AI Collaboration',
          agentName: 'Test Assistant',
          conversationId: 'test-conv-123',
          message: 'This is a test collaboration invitation to verify notifications work!'
        }
      );

      console.log('✅ [NotificationTest] Test notifications created successfully');
    } catch (error) {
      console.error('❌ [NotificationTest] Error creating test notification:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Button
      variant="outlined"
      color="secondary"
      size="small"
      onClick={handleTestNotification}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        '&:hover': {
          backgroundColor: 'rgba(0,0,0,0.9)',
        }
      }}
    >
      🧪 Test Notifications
    </Button>
  );
};

export default NotificationTestButton;

