/**
 * AtlasSettings.tsx
 * 
 * Component for user settings to control ATLAS behavior
 * Includes options to enable/disable "tag along" monitoring
 */

import React, { useState, useEffect } from 'react';
import { AtlasDetector } from './AtlasDetector';

interface AtlasSettingsProps {
  onClose: () => void;
  className?: string;
}

const AtlasSettings: React.FC<AtlasSettingsProps> = ({
  onClose,
  className = '',
}) => {
  const detector = AtlasDetector.getInstance();
  const [isDetectionEnabled, setIsDetectionEnabled] = useState(detector.isDetectionEnabled());
  const [detectedAgents, setDetectedAgents] = useState(detector.getDetectedAgents());
  
  // Subscribe to agent detection updates
  useEffect(() => {
    const unsubscribe = detector.subscribe(agents => {
      setDetectedAgents(agents);
    });
    
    return unsubscribe;
  }, [detector]);
  
  // Toggle detection setting
  const handleToggleDetection = () => {
    const newState = !isDetectionEnabled;
    setIsDetectionEnabled(newState);
    
    if (newState) {
      detector.enable();
    } else {
      detector.disable();
    }
  };
  
  return (
    <div className={`atlas-settings ${className}`}>
      <div className="settings-header">
        <h3>ATLAS Settings</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="settings-content">
        <div className="settings-section">
          <h4>Agent Monitoring</h4>
          
          <div className="setting-item">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isDetectionEnabled} 
                onChange={handleToggleDetection} 
              />
              <span className="toggle-slider"></span>
            </label>
            <div className="setting-description">
              <span className="setting-name">Tag Along Monitoring</span>
              <p className="setting-help">
                When enabled, ATLAS will detect and monitor Promethios-governed agents on any website.
              </p>
            </div>
          </div>
        </div>
        
        {isDetectionEnabled && detectedAgents.length > 0 && (
          <div className="settings-section">
            <h4>Detected Agents ({detectedAgents.length})</h4>
            
            <ul className="detected-agents-list">
              {detectedAgents.map(agent => (
                <li key={agent.id} className="agent-item">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-meta">
                    {agent.governanceIdentity ? (
                      <span className="governance-badge verified">
                        Verified {agent.governanceIdentity.complianceLevel}
                      </span>
                    ) : (
                      <span className="governance-badge unverified">
                        Unverified
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="settings-section">
          <h4>About ATLAS</h4>
          <p className="about-text">
            ATLAS (Accountability, Transparency, and Liaison Agent System) is the constitutional narrator for Promethios governance. It helps you understand and monitor AI governance across the web.
          </p>
          <div className="version-info">
            <span>Version 1.0.0</span>
            <a href="https://promethios.ai/atlas" target="_blank" rel="noopener noreferrer">
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtlasSettings;
