import React from 'react';
import { Button } from '@mui/material';
import { useMockAuth } from './MockAuthProvider';

/**
 * Debug component to control mock authentication
 */
const MockAuthButton: React.FC = () => {
  const { currentUser, loginWithGoogle, logout, switchUser, availableUsers } = useMockAuth();

  return (
    <div style={{ 
      position: 'fixed', 
      top: 20, 
      right: 20, 
      zIndex: 9999, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 8,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      <div style={{ color: 'white', fontSize: '12px', marginBottom: '8px' }}>
        🧪 Mock Auth Control
      </div>
      
      {currentUser ? (
        <>
          <div style={{ color: 'white', fontSize: '10px', marginBottom: '4px' }}>
            Logged in as: {currentUser.displayName}
          </div>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={logout}
            sx={{
              backgroundColor: 'rgba(255,0,0,0.2)',
              color: 'white',
              fontSize: '10px',
              '&:hover': {
                backgroundColor: 'rgba(255,0,0,0.3)',
              }
            }}
          >
            🚪 Logout
          </Button>
          
          <div style={{ color: 'white', fontSize: '10px', marginTop: '8px' }}>
            Switch User:
          </div>
          {availableUsers.map((user) => (
            <Button
              key={user.uid}
              variant="outlined"
              size="small"
              onClick={() => switchUser(user.uid)}
              disabled={currentUser.uid === user.uid}
              sx={{
                backgroundColor: currentUser.uid === user.uid ? 'rgba(0,255,0,0.2)' : 'rgba(0,0,255,0.2)',
                color: 'white',
                fontSize: '9px',
                '&:hover': {
                  backgroundColor: currentUser.uid === user.uid ? 'rgba(0,255,0,0.2)' : 'rgba(0,0,255,0.3)',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(0,255,0,0.2)',
                  color: 'rgba(255,255,255,0.7)',
                }
              }}
            >
              {user.displayName}
            </Button>
          ))}
        </>
      ) : (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={loginWithGoogle}
          sx={{
            backgroundColor: 'rgba(0,0,255,0.2)',
            color: 'white',
            fontSize: '10px',
            '&:hover': {
              backgroundColor: 'rgba(0,0,255,0.3)',
            }
          }}
        >
          🔑 Mock Login
        </Button>
      )}
    </div>
  );
};

export default MockAuthButton;

