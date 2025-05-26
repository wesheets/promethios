/**
 * Administrative Domain Profile Component
 * 
 * This component provides specialized governance profile functionality
 * for administrative tasks and workflows.
 */

import React from 'react';
import { useGovernanceProfile } from '../governance';
import { GovernanceDomain } from '../governance/types';

interface AdministrativeProfileProps {
  showMetrics?: boolean;
}

/**
 * Component for administrative domain governance profile
 */
export const AdministrativeProfile: React.FC<AdministrativeProfileProps> = ({
  showMetrics = true
}) => {
  const { currentProfile, selectProfile, currentDomain } = useGovernanceProfile();
  
  // Ensure the administrative domain is selected
  React.useEffect(() => {
    if (currentDomain !== GovernanceDomain.ADMINISTRATIVE) {
      selectProfile(GovernanceDomain.ADMINISTRATIVE);
    }
  }, [currentDomain, selectProfile]);

  if (!currentProfile || currentProfile.domain !== GovernanceDomain.ADMINISTRATIVE) {
    return <div>Loading administrative profile...</div>;
  }

  return (
    <div className="domain-profile administrative">
      <h2>Administrative Governance</h2>
      
      <div className="profile-description">
        <p>
          This governance profile is optimized for document processing, scheduling, and administrative tasks.
          Based on benchmark results, it shows both performance improvement (+5.0%) and trust improvement (+3.7%),
          making it highly effective for administrative workflows.
        </p>
      </div>
      
      {showMetrics && (
        <div className="domain-metrics">
          <h3>Domain-Specific Metrics</h3>
          
          <div className="metrics-container">
            <div className="metric-card">
              <h4>Document Processing Trust</h4>
              <div className="metric-value">
                <span className="value">{(currentProfile.trustMetrics.minTrustThreshold * 100).toFixed(0)}%</span>
                <span className="label">Minimum Trust</span>
              </div>
              <p>Minimum trust threshold for document operations</p>
            </div>
            
            <div className="metric-card">
              <h4>Process Efficiency</h4>
              <div className="metric-value">
                <span className="value">{currentProfile.monitoring.eventGranularity}</span>
                <span className="label">Event Points</span>
              </div>
              <p>Streamlined monitoring for administrative processes</p>
            </div>
            
            <div className="metric-card">
              <h4>Recovery Simplicity</h4>
              <div className="metric-value">
                <span className="value">{currentProfile.recovery.maxRecoveryAttempts}</span>
                <span className="label">Recovery Attempts</span>
              </div>
              <p>Optimized recovery attempts for administrative tasks</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="domain-recommendations">
        <h3>Governance Recommendations</h3>
        <ul>
          <li>
            <strong>Document Processing:</strong> Implement streamlined document workflows with 
            {(currentProfile.trustMetrics.minTrustThreshold * 100).toFixed(0)}% trust threshold
          </li>
          <li>
            <strong>Monitoring Strategy:</strong> Use reduced {currentProfile.monitoring.eventGranularity}-point 
            monitoring for improved performance
          </li>
          <li>
            <strong>Recovery Approach:</strong> Configure systems for {currentProfile.recovery.maxRecoveryAttempts} 
            recovery attempts with {currentProfile.recovery.recoveryDelayMs}ms delay
          </li>
          <li>
            <strong>Trust Management:</strong> Implement {(currentProfile.trustMetrics.trustDecayRate * 100).toFixed(0)}% 
            decay rate with {(currentProfile.trustMetrics.trustRecoveryRate * 100).toFixed(0)}% recovery rate
          </li>
        </ul>
      </div>
    </div>
  );
};
