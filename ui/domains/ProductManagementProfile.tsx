/**
 * Product Management Domain Profile Component
 * 
 * This component provides specialized governance profile functionality
 * for product management tasks and workflows.
 */

import React from 'react';
import { useGovernanceProfile } from '../governance';
import { GovernanceDomain } from '../governance/types';

interface ProductManagementProfileProps {
  showMetrics?: boolean;
}

/**
 * Component for product management domain governance profile
 */
export const ProductManagementProfile: React.FC<ProductManagementProfileProps> = ({
  showMetrics = true
}) => {
  const { currentProfile, selectProfile, currentDomain } = useGovernanceProfile();
  
  // Ensure the product management domain is selected
  React.useEffect(() => {
    if (currentDomain !== GovernanceDomain.PRODUCT_MANAGEMENT) {
      selectProfile(GovernanceDomain.PRODUCT_MANAGEMENT);
    }
  }, [currentDomain, selectProfile]);

  if (!currentProfile || currentProfile.domain !== GovernanceDomain.PRODUCT_MANAGEMENT) {
    return <div>Loading product management profile...</div>;
  }

  return (
    <div className="domain-profile product-management">
      <h2>Product Management Governance</h2>
      
      <div className="profile-description">
        <p>
          This governance profile is optimized for market analysis, product planning, and roadmapping.
          Based on benchmark results, it provides performance improvements (+9.3%) with only minor
          quality impact (-5.7%) and slight trust adjustments.
        </p>
      </div>
      
      {showMetrics && (
        <div className="domain-metrics">
          <h3>Domain-Specific Metrics</h3>
          
          <div className="metrics-container">
            <div className="metric-card">
              <h4>Market Analysis Trust</h4>
              <div className="metric-value">
                <span className="value">{(currentProfile.trustMetrics.minTrustThreshold * 100).toFixed(0)}%</span>
                <span className="label">Minimum Trust</span>
              </div>
              <p>Minimum trust threshold for market analysis</p>
            </div>
            
            <div className="metric-card">
              <h4>Planning Efficiency</h4>
              <div className="metric-value">
                <span className="value">{currentProfile.monitoring.eventGranularity}</span>
                <span className="label">Event Points</span>
              </div>
              <p>Monitoring granularity for planning processes</p>
            </div>
            
            <div className="metric-card">
              <h4>Decision Recovery</h4>
              <div className="metric-value">
                <span className="value">{currentProfile.recovery.maxRecoveryAttempts}</span>
                <span className="label">Recovery Attempts</span>
              </div>
              <p>Maximum recovery attempts for decision processes</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="domain-recommendations">
        <h3>Governance Recommendations</h3>
        <ul>
          <li>
            <strong>Market Analysis Policy:</strong> Implement streamlined analysis with 
            {(currentProfile.trustMetrics.minTrustThreshold * 100).toFixed(0)}% trust threshold
          </li>
          <li>
            <strong>Planning Strategy:</strong> Use {currentProfile.monitoring.eventGranularity}-point 
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
