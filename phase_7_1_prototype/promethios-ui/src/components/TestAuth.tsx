/**
 * Test Authentication Component
 * 
 * Simple component to bypass authentication for testing Observer Agent
 */

import React from 'react';

const TestAuth: React.FC = () => {
  const handleTestLogin = () => {
    // Mock user data for testing
    const mockUser = {
      uid: 'test-user-123',
      email: 'wesheets@hotmail.com',
      displayName: 'Test User',
      isAdmin: true
    };
    
    // Store in localStorage for testing
    localStorage.setItem('testUser', JSON.stringify(mockUser));
    
    // Redirect to dashboard
    window.location.href = '/ui/dashboard';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      background: '#333',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #555'
    }}>
      <button 
        onClick={handleTestLogin}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Login (Observer Agent Demo)
      </button>
    </div>
  );
};

export default TestAuth;

