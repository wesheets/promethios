/**
 * Basic Observer Hover Bubble Component
 * 
 * This component implements a simplified version of the Observer Agent chat bubble
 * that appears in the bottom-right corner of the screen.
 */

import React, { useState } from 'react';

const ObserverHoverBubble: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleToggleActive = () => {
    setIsActive(!isActive);
  };
  
  // Styles for the component
  const bubbleStyles = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    backgroundColor: '#1e293b',
    borderRadius: isExpanded ? '8px' : '50%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease',
    width: isExpanded ? '300px' : '50px',
    height: isExpanded ? '400px' : '50px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  } as React.CSSProperties;
  
  const headerStyles = {
    padding: '12px',
    borderBottom: '1px solid #2d3748',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  } as React.CSSProperties;
  
  const contentStyles = {
    flex: 1,
    padding: '12px',
    overflowY: 'auto',
    color: '#e2e8f0'
  } as React.CSSProperties;
  
  const buttonStyles = {
    background: 'none',
    border: 'none',
    color: '#a0aec0',
    cursor: 'pointer'
  } as React.CSSProperties;
  
  const tipBoxStyles = {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#2d3748',
    borderRadius: '4px'
  } as React.CSSProperties;
  
  const collapsedIconStyles = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#e2e8f0',
    fontSize: '24px',
    cursor: 'pointer'
  } as React.CSSProperties;
  
  return (
    <div style={bubbleStyles}>
      {isExpanded ? (
        <>
          <div style={headerStyles}>
            <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>Promethios Observer</span>
            <div>
              <button 
                onClick={handleToggleActive} 
                style={{ ...buttonStyles, marginRight: '8px' }}
              >
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button 
                onClick={handleToggleExpand} 
                style={buttonStyles}
              >
                Close
              </button>
            </div>
          </div>
          <div style={contentStyles}>
            <p>Welcome to Promethios Observer!</p>
            <p style={{ marginTop: '12px' }}>I'm here to help you navigate the governance dashboard and provide insights about your AI systems.</p>
            <div style={tipBoxStyles}>
              <p style={{ fontWeight: 'bold' }}>Governance Tip:</p>
              <p>Regular compliance checks help maintain high governance scores.</p>
            </div>
          </div>
        </>
      ) : (
        <div onClick={handleToggleExpand} style={collapsedIconStyles}>
          👁️
        </div>
      )}
    </div>
  );
};

export default ObserverHoverBubble;
