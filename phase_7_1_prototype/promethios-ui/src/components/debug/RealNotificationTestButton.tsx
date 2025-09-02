import React, { useState } from 'react';
import { UserInteractionRegistry } from '../../services/UserInteractionRegistry';
import { auth } from '../../firebase/config';

const RealNotificationTestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  const runRealNotificationTest = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      console.log('🧪 [RealNotificationTest] Starting real notification test...');
      
      // Check authentication first
      const currentUser = auth.currentUser;
      console.log('🧪 [RealNotificationTest] Current user:', {
        isAuthenticated: !!currentUser,
        uid: currentUser?.uid,
        email: currentUser?.email,
        displayName: currentUser?.displayName
      });
      
      if (!currentUser) {
        setTestResult('❌ FAILED: No authenticated user. Please sign in first.');
        return;
      }
      
      // Initialize the real UserInteractionRegistry
      const userRegistry = UserInteractionRegistry.getInstance();
      
      // Test with real user IDs from your Firebase console
      // Use the currently logged in user as sender, and another real user as recipient
      const currentUserId = currentUser.uid; // HSf4SIwCcRRzAFPuFXlFE9CsQ6W2 (wesheets@gmail.com)
      const recipientUserId = 'XyKZE2QUPKgIEwK8ddqAJrBs67B3'; // ted@majestickgoods.com (CONFIRMED EXISTS)
      
      console.log('🧪 [RealNotificationTest] Testing with real user IDs:', {
        sender: currentUserId,
        recipient: recipientUserId
      });
      
      // Try to send a collaboration invitation between real users
      const result = await userRegistry.sendInteraction(
        'collaboration_invitation',
        currentUserId, // From current logged in user (wesheets@gmail.com)
        recipientUserId, // To ted@majestickgoods.com (CONFIRMED EXISTS)
        {
          conversationName: 'Test AI Collaboration Session',
          agentName: 'Claude Assistant',
          conversationId: `test_conv_${Date.now()}`,
          message: 'This is a test collaboration invitation to verify the notification system is working.'
        }
      );
      
      console.log('🧪 [RealNotificationTest] Send interaction result:', result);
      
      if (result.success) {
        setTestResult(`✅ SUCCESS: Real notification sent successfully! Interaction ID: ${result.interactionId}`);
      } else {
        setTestResult(`❌ FAILED: ${result.error}`);
      }
      
    } catch (error) {
      console.error('🧪 [RealNotificationTest] Test failed:', error);
      setTestResult(`❌ ERROR: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 10000,
      backgroundColor: '#007bff',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      maxWidth: '400px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🧪 Real Notification Test</h4>
      
      <button
        onClick={runRealNotificationTest}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          marginBottom: '10px'
        }}
      >
        {isLoading ? 'Testing...' : 'Test Real Notifications'}
      </button>
      
      {testResult && (
        <div style={{
          fontSize: '11px',
          padding: '8px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          marginTop: '8px',
          wordBreak: 'break-word'
        }}>
          {testResult}
        </div>
      )}
      
      <div style={{ fontSize: '10px', marginTop: '8px', opacity: 0.8 }}>
        This tests the real Firebase notification system with actual user accounts.
      </div>
    </div>
  );
};

export default RealNotificationTestButton;

