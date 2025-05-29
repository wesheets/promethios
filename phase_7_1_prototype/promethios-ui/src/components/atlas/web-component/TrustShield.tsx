/**
 * TrustShield.tsx
 * 
 * Lightweight badge component that shows governance status
 * for Promethios-wrapped agents in the wild
 */

import React, { useState, useEffect } from 'react';
import { GovernanceMetrics } from '../../../services/observers/atlasObserverService';
import { GovernanceIdentity, validateGovernanceIdentity } from './GovernanceIdentity';

interface TrustShieldProps {
  metrics: GovernanceMetrics;
  identity: GovernanceIdentity;
  onExpand?: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * TrustShield - Lightweight badge showing governance status
 * 
 * This component serves as the visible "proof of governance" for
 * Promethios-wrapped agents across the web, while providing a
 * gateway to the full ATLAS experience when needed.
 */
const TrustShield: React.FC<TrustShieldProps> = ({
  metrics,
  identity,
  onExpand,
  size = 'medium',
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // Verify governance identity on mount
  useEffect(() => {
    setIsVerified(validateGovernanceIdentity(identity));
  }, [identity]);
  
  // Get color based on trust score
  const getTrustColor = (score: number): string => {
    if (score >= 90) return 'var(--atlas-trust-high, #10b981)';
    if (score >= 70) return 'var(--atlas-trust-medium, #f59e0b)';
    return 'var(--atlas-trust-low, #ef4444)';
  };
  
  // Format date from timestamp
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  // Handle click to expand to full ATLAS
  const handleClick = () => {
    if (onExpand) {
      onExpand();
    }
  };
  
  return (
    <div 
      className={`trust-shield ${size} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        '--trust-color': getTrustColor(metrics.trustScore)
      } as React.CSSProperties}
    >
      {/* Badge with trust score */}
      <div className="shield-badge">
        <div className="shield-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            {isVerified && (
              <path 
                d="M9 12L11 14L15 10" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
        <div className="trust-score">{metrics.trustScore}</div>
      </div>
      
      {/* Hover panel with more details */}
      {isHovered && (
        <div className="shield-details">
          <div className="shield-header">
            <div className="shield-title">Promethios Governed</div>
            <div className="compliance-level">{identity.complianceLevel}</div>
          </div>
          
          <div className="metrics-summary">
            <div className="metric-item">
              <span className="metric-label">Trust</span>
              <span className="metric-value">{metrics.trustScore}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Compliance</span>
              <span className="metric-value">{metrics.complianceRate}%</span>
            </div>
            {metrics.recentViolations.length > 0 && (
              <div className="metric-item violations">
                <span className="metric-label">Violations</span>
                <span className="metric-value">{metrics.recentViolations.length}</span>
              </div>
            )}
          </div>
          
          <div className="agent-info">
            <div className="agent-name">{identity.name}</div>
            <div className="certification-date">
              Certified: {formatDate(identity.certificationDate)}
            </div>
          </div>
          
          <div className="shield-footer">
            {isVerified ? (
              <div className="verification verified">
                <span className="icon">✓</span>
                <span className="text">Verified</span>
              </div>
            ) : (
              <div className="verification unverified">
                <span className="icon">!</span>
                <span className="text">Unverified</span>
              </div>
            )}
            
            <button className="expand-button" onClick={handleClick}>
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustShield;
