/**
 * Governance Metrics Visualization Component
 * 
 * This component visualizes the governance metrics for the current profile
 * and provides comparisons between domains.
 */

import React from 'react';
import { useGovernanceProfile } from './context';
import { GovernanceProfileConfig, GovernanceDomain } from './types';

interface MetricsVisualizationProps {
  showComparison?: boolean;
  comparisonDomains?: GovernanceDomain[];
}

/**
 * Component for visualizing governance metrics
 */
export const MetricsVisualization: React.FC<MetricsVisualizationProps> = ({
  showComparison = false,
  comparisonDomains = [],
}) => {
  const { currentProfile, availableProfiles } = useGovernanceProfile();

  if (!currentProfile) {
    return <div className="metrics-visualization-empty">No profile selected</div>;
  }

  // Get profiles for comparison if requested
  const comparisonProfiles = showComparison
    ? availableProfiles.filter(
        profile => 
          comparisonDomains.includes(profile.domain) && 
          profile.isDefault && 
          profile.domain !== currentProfile.domain
      )
    : [];

  // Calculate normalized metrics for visualization
  const calculateNormalizedMetrics = (profile: GovernanceProfileConfig) => {
    return {
      trustDecay: profile.trustMetrics.trustDecayRate * 10, // Scale for visualization
      trustRecovery: profile.trustMetrics.trustRecoveryRate * 10,
      eventGranularity: profile.monitoring.eventGranularity / 4, // Normalize to 0-1
      statePreservation: profile.recovery.statePreservationDepth / 4,
      recoveryAttempts: profile.recovery.maxRecoveryAttempts / 4,
    };
  };

  const currentMetrics = calculateNormalizedMetrics(currentProfile);

  return (
    <div className="metrics-visualization">
      <h3>Governance Metrics: {currentProfile.displayName}</h3>
      
      <div className="metrics-grid">
        <div className="metric-item">
          <label>Trust Decay Rate:</label>
          <div className="metric-bar">
            <div 
              className="metric-value" 
              style={{ width: `${currentMetrics.trustDecay * 10}%` }}
            />
          </div>
          <span>{currentProfile.trustMetrics.trustDecayRate.toFixed(2)}</span>
        </div>
        
        <div className="metric-item">
          <label>Trust Recovery Rate:</label>
          <div className="metric-bar">
            <div 
              className="metric-value" 
              style={{ width: `${currentMetrics.trustRecovery * 10}%` }}
            />
          </div>
          <span>{currentProfile.trustMetrics.trustRecoveryRate.toFixed(2)}</span>
        </div>
        
        <div className="metric-item">
          <label>Event Granularity:</label>
          <div className="metric-bar">
            <div 
              className="metric-value" 
              style={{ width: `${currentMetrics.eventGranularity * 100}%` }}
            />
          </div>
          <span>{currentProfile.monitoring.eventGranularity}</span>
        </div>
        
        <div className="metric-item">
          <label>State Preservation:</label>
          <div className="metric-bar">
            <div 
              className="metric-value" 
              style={{ width: `${currentMetrics.statePreservation * 100}%` }}
            />
          </div>
          <span>{currentProfile.recovery.statePreservationDepth}</span>
        </div>
        
        <div className="metric-item">
          <label>Recovery Attempts:</label>
          <div className="metric-bar">
            <div 
              className="metric-value" 
              style={{ width: `${currentMetrics.recoveryAttempts * 100}%` }}
            />
          </div>
          <span>{currentProfile.recovery.maxRecoveryAttempts}</span>
        </div>
      </div>
      
      {showComparison && comparisonProfiles.length > 0 && (
        <div className="comparison-section">
          <h4>Domain Comparison</h4>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>{currentProfile.domain}</th>
                {comparisonProfiles.map(profile => (
                  <th key={profile.domain}>{profile.domain}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Trust Decay</td>
                <td>{currentProfile.trustMetrics.trustDecayRate.toFixed(2)}</td>
                {comparisonProfiles.map(profile => (
                  <td key={profile.domain}>
                    {profile.trustMetrics.trustDecayRate.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Trust Recovery</td>
                <td>{currentProfile.trustMetrics.trustRecoveryRate.toFixed(2)}</td>
                {comparisonProfiles.map(profile => (
                  <td key={profile.domain}>
                    {profile.trustMetrics.trustRecoveryRate.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Event Granularity</td>
                <td>{currentProfile.monitoring.eventGranularity}</td>
                {comparisonProfiles.map(profile => (
                  <td key={profile.domain}>
                    {profile.monitoring.eventGranularity}
                  </td>
                ))}
              </tr>
              <tr>
                <td>State Preservation</td>
                <td>{currentProfile.recovery.statePreservationDepth}</td>
                {comparisonProfiles.map(profile => (
                  <td key={profile.domain}>
                    {profile.recovery.statePreservationDepth}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
