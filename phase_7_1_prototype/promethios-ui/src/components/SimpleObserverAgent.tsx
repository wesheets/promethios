/**
 * Simple Observer Agent Test Component
 * 
 * A minimal version to test if the component renders at all
 */

import React from 'react';

const SimpleObserverAgent: React.FC = () => {
  return (
    <div 
      style={{
        position: 'fixed',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '60px',
        height: '60px',
        backgroundColor: '#3b82f6',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 1000,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
      }}
      onClick={() => alert('Observer Agent Test - Component is working!')}
    >
      OA
    </div>
  );
};

export default SimpleObserverAgent;

