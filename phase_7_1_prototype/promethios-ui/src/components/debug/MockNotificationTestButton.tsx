import React, { useState } from 'react';
import { Button } from '@mui/material';
import { mockUserInteractionRegistry } from '../../services/MockUserInteractionRegistry';
import { mockFirebaseService } from '../../services/MockFirebaseService';

/**
 * Debug component to test notification system using mock services
 * This bypasses Firebase authentication and uses in-memory storage
 */
const MockNotificationTestButton: React.FC = () => {
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const handleTestNotification = async () => {
    setIsCreatingTest(true);
    setTestResults([]);
    
    console.log('🧪 [MockNotificationTest] Starting comprehensive notification test...');

    try {
      const results: string[] = [];
      
      // Step 1: Create mock users
      console.log('🧪 [MockNotificationTest] Creating mock users...');
      const mockSender = await mockFirebaseService.createMockUser({
        displayName: 'Alice Collaborator',
        email: 'alice.collaborator@example.com'
      });
      
      const mockRecipient = await mockFirebaseService.createMockUser({
        displayName: 'Bob Partner',
        email: 'bob.partner@example.com'
      });
      
      results.push(`✅ Created mock users: ${mockSender.displayName} and ${mockRecipient.displayName}`);

      // Step 2: Test collaboration invitation
      console.log('🧪 [MockNotificationTest] Testing collaboration invitation...');
      const collaborationResult = await mockUserInteractionRegistry.sendInteraction(
        'collaboration_invitation',
        mockSender.uid,
        mockRecipient.uid,
        {
          conversationName: 'AI Strategy Discussion',
          agentName: 'Claude Assistant',
          conversationId: `conv_${Date.now()}`,
          message: 'Would you like to join this AI collaboration session to discuss our project strategy?'
        }
      );
      
      if (collaborationResult.success) {
        results.push(`✅ Collaboration invitation sent: ${collaborationResult.interactionId}`);
      } else {
        results.push(`❌ Collaboration invitation failed: ${collaborationResult.error}`);
      }

      // Step 3: Test connection request
      console.log('🧪 [MockNotificationTest] Testing connection request...');
      const connectionResult = await mockUserInteractionRegistry.sendInteraction(
        'connection_request',
        mockSender.uid,
        mockRecipient.uid,
        {
          message: 'Hi! I\'d like to connect and explore collaboration opportunities.'
        }
      );
      
      if (connectionResult.success) {
        results.push(`✅ Connection request sent: ${connectionResult.interactionId}`);
      } else {
        results.push(`❌ Connection request failed: ${connectionResult.error}`);
      }

      // Step 4: Test chat invitation
      console.log('🧪 [MockNotificationTest] Testing chat invitation...');
      const chatResult = await mockUserInteractionRegistry.sendInteraction(
        'chat_invitation',
        mockRecipient.uid,
        mockSender.uid,
        {
          message: 'Join me for a quick chat about the project!'
        }
      );
      
      if (chatResult.success) {
        results.push(`✅ Chat invitation sent: ${chatResult.interactionId}`);
      } else {
        results.push(`❌ Chat invitation failed: ${chatResult.error}`);
      }

      // Step 5: Check stored data
      console.log('🧪 [MockNotificationTest] Checking stored data...');
      const storedNotifications = mockUserInteractionRegistry.getStoredNotifications();
      const storedInteractions = mockUserInteractionRegistry.getStoredInteractions();
      
      results.push(`📊 Stored notifications: ${storedNotifications.length}`);
      results.push(`📊 Stored interactions: ${storedInteractions.length}`);
      
      // Log detailed results
      console.log('🧪 [MockNotificationTest] Stored notifications:', storedNotifications);
      console.log('🧪 [MockNotificationTest] Stored interactions:', storedInteractions);
      
      results.push(`🎉 Test completed successfully! Check console for detailed logs.`);
      
      setTestResults(results);
      
    } catch (error) {
      console.error('❌ [MockNotificationTest] Error during test:', error);
      setTestResults([`❌ Test failed: ${error.message}`]);
    } finally {
      setIsCreatingTest(false);
    }
  };

  const handleClearData = () => {
    mockUserInteractionRegistry.clearAllData();
    setTestResults(['🧹 All mock data cleared']);
    console.log('🧹 [MockNotificationTest] All data cleared');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      left: 20, 
      zIndex: 9999, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 8,
      backgroundColor: 'rgba(0,0,0,0.9)',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.2)',
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto'
    }}>
      <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
        🧪 Mock Notification Test
      </div>
      
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={handleTestNotification}
        disabled={isCreatingTest}
        sx={{
          backgroundColor: 'rgba(0,100,255,0.2)',
          color: 'white',
          fontSize: '12px',
          '&:hover': {
            backgroundColor: 'rgba(0,100,255,0.3)',
          },
          '&:disabled': {
            backgroundColor: 'rgba(0,100,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
          }
        }}
      >
        {isCreatingTest ? '🔄 Testing...' : '🧪 Run Notification Test'}
      </Button>
      
      <Button
        variant="outlined"
        color="warning"
        size="small"
        onClick={handleClearData}
        sx={{
          backgroundColor: 'rgba(255,165,0,0.2)',
          color: 'white',
          fontSize: '12px',
          '&:hover': {
            backgroundColor: 'rgba(255,165,0,0.3)',
          }
        }}
      >
        🧹 Clear Data
      </Button>
      
      {testResults.length > 0 && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: '4px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            Test Results:
          </div>
          {testResults.map((result, index) => (
            <div key={index} style={{ 
              color: result.startsWith('❌') ? '#ff6b6b' : result.startsWith('✅') ? '#51cf66' : 'white', 
              fontSize: '11px', 
              marginBottom: '2px' 
            }}>
              {result}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MockNotificationTestButton;

