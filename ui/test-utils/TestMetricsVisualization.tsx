/**
 * Enhanced test component for MetricsVisualization
 * 
 * A simplified version of the MetricsVisualization component for testing
 * that helps isolate context and provider issues.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { GovernanceDomain } from '../governance/types';
import { useGovernanceProfileForTests } from './test-hooks';

interface TestMetricsVisualizationProps {
  showComparison?: boolean;
  comparisonDomains?: GovernanceDomain[];
  className?: string;
  dataTestId?: string;
}

/**
 * Simplified MetricsVisualization for testing
 * This component uses the debug hooks to help isolate context issues
 */
export const TestMetricsVisualization: React.FC<TestMetricsVisualizationProps> = ({
  showComparison = false,
  comparisonDomains = [],
  className = '',
  dataTestId = 'metrics-visualization',
}) => {
  // Log props for debugging
  console.log('TestMetricsVisualization rendering with props:', {
    showComparison,
    comparisonDomains,
    className,
    dataTestId
  });
  
  // Use the debug hook
  const { 
    currentProfile, 
    availableProfiles, 
    currentDomain,
    loading,
    error
  } = useGovernanceProfileForTests();
  
  // Log what we received from the hook
  console.log('TestMetricsVisualization received from hook:', {
    hasCurrentProfile: !!currentProfile,
    availableProfilesCount: availableProfiles.length,
    currentDomain
  });
  
  if (loading) {
    return (
      <div className={`metrics-visualization loading ${className}`} data-testid={dataTestId}>
        <div data-testid="async-content-loading">Loading metrics...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`metrics-visualization error ${className}`} data-testid={dataTestId}>
        <div data-testid="async-content-error">
          Error loading metrics: {error.toString()}
        </div>
      </div>
    );
  }
  
  if (!currentProfile) {
    return (
      <div className={`metrics-visualization empty ${className}`} data-testid={dataTestId}>
        <div data-testid="async-content-empty">No profile selected</div>
      </div>
    );
  }
  
  return (
    <div className={`metrics-visualization ${className}`} data-testid={dataTestId}>
      <div data-testid="async-content-loaded">
        <h2>Governance Metrics</h2>
        
        <div className="metrics-section">
          <h3>Trust Metrics</h3>
          <div className="metric-item">
            <span className="metric-label">Trust Decay Rate:</span>
            <span className="metric-value">{currentProfile.trustMetrics?.trustDecayRate || 'N/A'}</span>
          </div>
        </div>
        
        {showComparison && (
          <div className="comparison-section">
            <h3>Domain Comparison</h3>
            <div>Current Domain: {currentDomain}</div>
            <div>Comparison Domains: {comparisonDomains.join(', ')}</div>
          </div>
        )}
      </div>
    </div>
  );
};
