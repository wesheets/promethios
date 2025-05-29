/**
 * GovernanceScorecard.tsx
 * 
 * Component for displaying agent governance scorecard
 * Shows trust metrics, compliance status, and recent violations
 */

import React, { useState, useEffect } from 'react';
import { GovernanceMetrics } from '../../../services/observers/atlasObserverService';
import { GovernanceIdentity } from './GovernanceIdentity';

interface GovernanceScorecardProps {
  metrics: GovernanceMetrics;
  identity: GovernanceIdentity;
  isExpanded: boolean;
  className?: string;
}

const GovernanceScorecard: React.FC<GovernanceScorecardProps> = ({
  metrics,
  identity,
  isExpanded,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'violations' | 'identity'>('overview');
  
  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'var(--atlas-trust-high)';
    if (score >= 70) return 'var(--atlas-trust-medium)';
    return 'var(--atlas-trust-low)';
  };
  
  // Format date from timestamp
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Render compact version (when not expanded)
  if (!isExpanded) {
    return (
      <div className={`governance-scorecard-mini ${className}`}>
        <div 
          className="trust-indicator" 
          style={{ backgroundColor: getScoreColor(metrics.trustScore) }}
        >
          <span className="trust-score">{metrics.trustScore}</span>
        </div>
        <div className="mini-metrics">
          <span className="compliance-rate">{metrics.complianceRate}% compliant</span>
          {metrics.recentViolations.length > 0 && (
            <span className="violations-badge">{metrics.recentViolations.length}</span>
          )}
        </div>
      </div>
    );
  }
  
  // Render expanded scorecard
  return (
    <div className={`governance-scorecard ${className}`}>
      <div className="scorecard-header">
        <h3>Governance Scorecard</h3>
        <div className="compliance-badge">{identity.complianceLevel}</div>
      </div>
      
      <div className="scorecard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'violations' ? 'active' : ''} 
          onClick={() => setActiveTab('violations')}
        >
          Violations {metrics.recentViolations.length > 0 && `(${metrics.recentViolations.length})`}
        </button>
        <button 
          className={activeTab === 'identity' ? 'active' : ''} 
          onClick={() => setActiveTab('identity')}
        >
          Identity
        </button>
      </div>
      
      <div className="scorecard-content">
        {activeTab === 'overview' && (
          <div className="metrics-overview">
            <div className="trust-score-display">
              <div 
                className="trust-circle" 
                style={{ 
                  borderColor: getScoreColor(metrics.trustScore),
                  color: getScoreColor(metrics.trustScore)
                }}
              >
                <span className="score-value">{metrics.trustScore}</span>
                <span className="score-label">Trust</span>
              </div>
            </div>
            
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Compliance</span>
                <span className="metric-value">{metrics.complianceRate}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Transparency</span>
                <span className="metric-value">{metrics.transparencyScore}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Drift</span>
                <span className="metric-value">{metrics.driftIndicator}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Belief Traces</span>
                <span className="metric-value">{metrics.beliefTraceCount}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Validation</span>
                <span className="metric-value">{metrics.validationRate}%</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'violations' && (
          <div className="violations-list">
            {metrics.recentViolations.length === 0 ? (
              <div className="no-violations">
                <p>No recent violations detected.</p>
              </div>
            ) : (
              <ul>
                {metrics.recentViolations.map((violation, index) => (
                  <li key={index} className={`violation-item ${violation.severity}`}>
                    <div className="violation-header">
                      <span className="violation-type">{violation.type}</span>
                      <span className="violation-severity">{violation.severity}</span>
                    </div>
                    <p className="violation-description">{violation.description}</p>
                    <span className="violation-time">{formatDate(violation.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {activeTab === 'identity' && (
          <div className="identity-details">
            <div className="identity-field">
              <span className="field-label">Agent ID</span>
              <span className="field-value">{identity.agentId}</span>
            </div>
            <div className="identity-field">
              <span className="field-label">Name</span>
              <span className="field-value">{identity.name}</span>
            </div>
            <div className="identity-field">
              <span className="field-label">Version</span>
              <span className="field-value">{identity.version}</span>
            </div>
            <div className="identity-field">
              <span className="field-label">Signed By</span>
              <span className="field-value">{identity.signedBy}</span>
            </div>
            <div className="identity-field">
              <span className="field-label">Compliance Level</span>
              <span className="field-value compliance-level">{identity.complianceLevel}</span>
            </div>
            <div className="identity-field">
              <span className="field-label">Certified On</span>
              <span className="field-value">{formatDate(identity.certificationDate)}</span>
            </div>
            
            <div className="verification-status">
              <div className="verification-badge verified">
                <span className="icon">✓</span>
                <span className="text">Verified Governance Identity</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernanceScorecard;
