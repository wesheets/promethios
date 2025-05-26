/**
 * Human Resources Domain Profile Component
 * 
 * This component provides specialized governance profile functionality
 * for human resources tasks and workflows.
 */

import React from 'react';
import { useGovernanceProfile } from '../governance';
import { GovernanceDomain } from '../governance/types';

interface HumanResourcesProfileProps {
  showMetrics?: boolean;
}

/**
 * Component for human resources domain governance profile
 */
export const HumanResourcesProfile: React.FC<HumanResourcesProfileProps> = ({
  showMetrics = true
}) => {
  const { currentProfile, selectProfile, currentDomain } = useGovernanceProfile();
  
  // Ensure the human resources domain is selected
  React.useEffect(() => {
    if (currentDomain !== GovernanceDomain.HUMAN_RESOURCES) {
      selectProfile(GovernanceDomain.HUMAN_RESOURCES);
    }
  }, [currentDomain, selectProfile]);

  if (!currentProfile || currentProfile.domain !== GovernanceDomain.HUMAN_RESOURCES) {
    return <div>Loading human resources profile...</div>;
  }

  return (
    <div className="domain-profile human-resources">
      <h2>Human Resources Governance</h2>
      
      <div className="profile-description">
        <p>
          This governance profile is optimized for personnel management, hiring, and HR operations.
          Based on benchmark results, it shows significant trust score improvement (+6.1%) despite
          performance decreases (-10.7%), prioritizing trust and compliance over raw performance.
        </p>
      </div>
      
      {showMetrics && (
        <div className="domain-metrics">
          <h3>Domain-Specific Metrics</h3>
          
          <div className="metrics-container">
            <div className="metric-card">
              <h4>Personnel Trust</h4>
              <div className="metric-value">
                <span className="value">{(currentProfile.trustMetrics.minTrustThreshold * 100).toFixed(0)}%</span>
                <span className="label">Minimum Trust</span>
              </div>
              <p>Minimum trust threshold for personnel operations</p>
            </div>
            
            <div className="metric-card">
              <h4>Compliance Monitoring</h4>
              <div className="metric-value">
                <span className="value">{currentProfile.monitoring.eventGranularity}</span>
                <span className="label">Event Points</span>
              </div>
              <p>Monitoring granularity for compliance processes</p>
            </div>
            
            <div className="metric-card">
              <h4>Data Preservation</h4>
              <div className="metric-value">
                <span className="value">{currentProfile.recovery.statePreservationDepth}</span>
                <span className="label">State Depth</span>
              </div>
              <p>Depth of state preservation for sensitive HR data</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="domain-recommendations">
        <h3>Governance Recommendations</h3>
        <ul>
          <li>
            <strong>Personnel Policy:</strong> Implement strict personnel operations with 
            {(currentProfile.trustMetrics.minTrustThreshold * 100).toFixed(0)}% trust threshold
          </li>
          <li>
            <strong>Compliance Strategy:</strong> Use {currentProfile.monitoring.eventGranularity}-point 
            monitoring for comprehensive compliance tracking
          </li>
          <li>
            <strong>Data Protection:</strong> Configure systems to maintain 
            {currentProfile.recovery.statePreservationDepth} levels of state for sensitive HR data
          </li>
          <li>
            <strong>Trust Management:</strong> Implement slow decay rate of {(currentProfile.trustMetrics.trustDecayRate * 100).toFixed(0)}% 
            with fast recovery rate of {(currentProfile.trustMetrics.trustRecoveryRate * 100).toFixed(0)}%
          </li>
        </ul>
      </div>
    </div>
  );
};
