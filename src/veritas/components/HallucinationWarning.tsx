/**
 * Hallucination Warning Component
 * 
 * This component displays a warning when hallucinations are detected in text.
 * It shows the hallucinated claims and provides visual indicators of severity.
 */

import React from 'react';
import { ClaimValidation } from '../types';

interface HallucinationWarningProps {
  /** Array of hallucinated claims */
  claims: ClaimValidation[];
  /** CSS class name */
  className?: string;
}

/**
 * Hallucination Warning Component
 */
const HallucinationWarning: React.FC<HallucinationWarningProps> = ({
  claims,
  className = ''
}) => {
  // Skip rendering if no hallucinations
  if (!claims || claims.length === 0) {
    return null;
  }
  
  // Determine severity based on number of hallucinations and confidence
  const getSeverity = () => {
    if (claims.length > 3) return 'critical';
    if (claims.length > 1) return 'high';
    
    // Check confidence of the hallucination
    const highConfidence = claims.some(claim => claim.score.confidence > 0.7);
    return highConfidence ? 'high' : 'medium';
  };
  
  // Get severity text
  const getSeverityText = () => {
    switch (getSeverity()) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      default: return 'Medium';
    }
  };
  
  return (
    <div className={`hallucination-warning ${getSeverity()} ${className}`}>
      <div className="warning-header">
        <div className="warning-icon">⚠️</div>
        <h4 className="warning-title">Hallucinations Detected</h4>
        <div className="warning-severity">
          <span className="severity-label">Severity:</span>
          <span className={`severity-value ${getSeverity()}`}>
            {getSeverityText()}
          </span>
        </div>
      </div>
      
      <div className="warning-content">
        <p className="warning-description">
          The following {claims.length === 1 ? 'claim' : 'claims'} could not be verified and may be hallucinated:
        </p>
        
        <ul className="hallucinated-claims">
          {claims.map((claim, index) => (
            <li key={`hallucination-${index}`} className="hallucinated-claim">
              <span className="claim-text">{claim.claim.text}</span>
              {claim.score.confidence > 0.7 && (
                <span className="high-confidence-tag">High Confidence Hallucination</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="warning-footer">
        <p className="warning-guidance">
          Consider reviewing and correcting these statements before proceeding.
        </p>
      </div>
    </div>
  );
};

export default HallucinationWarning;
