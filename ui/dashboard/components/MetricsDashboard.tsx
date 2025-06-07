/**
 * Metrics Dashboard component for the Developer Dashboard
 * 
 * Displays governance metrics and analytics.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React, { useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { LoadingSpinner } from '../../components/loading-state';
import { ErrorBoundary } from '../../components/error-handling';

export const MetricsDashboard: React.FC = () => {
  const { 
    metrics,
    refreshMetrics,
    loading,
    error
  } = useDashboard();
  
  // Refresh metrics on mount
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);
  
  // Render loading state
  if (loading) {
    return <LoadingSpinner message="Loading governance metrics..." />;
  }
  
  // Render error state
  if (error) {
    return (
      <div className="error-message" data-testid="metrics-error">
        {error}
      </div>
    );
  }
  
  // Render empty state
  if (!metrics) {
    return (
      <div className="empty-state">
        <h3>No metrics available</h3>
        <p>Metrics will appear once agents are wrapped and deployed.</p>
      </div>
    );
  }
  
  // Format percentage for display
  const formatPercent = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };
  
  return (
    <div className="metrics-dashboard">
      <h2>Governance Metrics Dashboard</h2>
      
      <div className="metrics-grid">
        {/* Trust Score */}
        <div className="metric-card">
          <h3>Trust Score</h3>
          <div className="metric-value">{formatPercent(metrics.trustScore)}</div>
          <div className="metric-description">
            Overall system trust score based on governance compliance
          </div>
        </div>
        
        {/* Compliance Rate */}
        <div className="metric-card">
          <h3>Compliance Rate</h3>
          <div className="metric-value">{formatPercent(metrics.complianceRate)}</div>
          <div className="metric-description">
            Percentage of governance rules being followed
          </div>
        </div>
        
        {/* Agents Wrapped */}
        <div className="metric-card">
          <h3>Agents Wrapped</h3>
          <div className="metric-value">{metrics.agentsWrapped}</div>
          <div className="metric-description">
            Total number of agents wrapped with governance
          </div>
        </div>
        
        {/* Active Deployments */}
        <div className="metric-card">
          <h3>Active Deployments</h3>
          <div className="metric-value">{metrics.activeDeployments}</div>
          <div className="metric-description">
            Number of wrapped agents currently deployed
          </div>
        </div>
      </div>
      
      <div className="refresh-controls">
        <button onClick={() => refreshMetrics()}>
          Refresh Metrics
        </button>
      </div>
    </div>
  );
};
