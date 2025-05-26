/**
 * Software Engineering Domain Profile Component
 * 
 * This component provides specialized governance profile functionality
 * for software engineering tasks and workflows.
 */

import React from 'react';
import { useGovernanceProfile } from '../governance';
import { GovernanceDomain } from '../governance/types';

interface SoftwareEngineeringProfileProps {
  showMetrics?: boolean;
}

/**
 * Component for software engineering domain governance profile
 */
export const SoftwareEngineeringProfile: React.FC<SoftwareEngineeringProfileProps> = ({
  showMetrics = true
}) => {
  const { currentProfile, selectProfile, currentDomain } = useGovernanceProfile();
  
  // Ensure the software engineering domain is selected
  React.useEffect(() => {
    if (currentDomain !== GovernanceDomain.SOFTWARE_ENGINEERING) {
      selectProfile(GovernanceDomain.SOFTWARE_ENGINEERING);
    }
  }, [currentDomain, selectProfile]);

  if (!currentProfile || currentProfile.domain !== GovernanceDomain.SOFTWARE_ENGINEERING) {
    return <div>Loading software engineering profile...</div>;
  }

  return (
    <div className="domain-profile software-engineering">
      <h2>Software Engineering Governance</h2>
      
      <div className="profile-description">
        <p>
          This governance profile is optimized for code review, development, and technical tasks.
          Based on benchmark results, it maintains trust while providing clear termination states
          and enhanced recovery mechanisms.
        </p>
      </div>
      
      {showMetrics && (
        <div className="domain-metrics">
          <h3>Domain-Specific Metrics</h3>
          
          <div className="metrics-container">
            <div className="metric-card">
              <h4>Code Quality Governance</h4>
              <div className="metric-value">
                <span className="value">{(currentProfile.trustMetrics.minTrustThreshold * 100).toFixed(0)}%</span>
                <span className="label">Minimum Trust</span>
              </div>
              <p>Minimum trust threshold for code operations</p>
            </div>
            
            <div className="metric-card">
              <h4>Technical Debt Management</h4>
              <div className="metric-value">
                <span className="value">{currentProfile.recovery.statePreservationDepth}</span>
                <span className="label">State Preservation</span>
              </div>
              <p>Depth of context preservation during recovery</p>
            </div>
            
            <div className="metric-card">
              <h4>Build Pipeline Governance</h4>
              <div className="metric-value">
                <span className="value">{currentProfile.monitoring.eventGranularity}</span>
                <span className="label">Event Points</span>
              </div>
              <p>Monitoring granularity for build processes</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="domain-recommendations">
        <h3>Governance Recommendations</h3>
        <ul>
          <li>
            <strong>Code Review Policy:</strong> Implement mandatory code reviews with at least 
            {(currentProfile.trustMetrics.minTrustThreshold * 100).toFixed(0)}% trust threshold
          </li>
          <li>
            <strong>Recovery Strategy:</strong> Configure systems to maintain 
            {currentProfile.recovery.statePreservationDepth} levels of state during recovery
          </li>
          <li>
            <strong>Monitoring Setup:</strong> Implement 
            {currentProfile.monitoring.eventGranularity}-point monitoring for critical systems
          </li>
          <li>
            <strong>Loop Management:</strong> Use '{currentProfile.loopState.useAbortedForResourceLimits ? 'aborted' : 'completed'}' 
            state for resource-limited operations
          </li>
        </ul>
      </div>
    </div>
  );
};
