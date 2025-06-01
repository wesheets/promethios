/**
 * Claim Card Component
 * 
 * This component displays a single claim validation result.
 * It shows the claim text, verification status, and evidence.
 */

import React from 'react';
import { ClaimValidation, Evidence } from '../types';
import ConfidenceBadge from './ConfidenceBadge';

interface ClaimCardProps {
  /** The claim validation to display */
  claim: ClaimValidation;
  /** Whether the card is expanded to show evidence */
  expanded?: boolean;
  /** Click handler for the card */
  onClick?: () => void;
  /** CSS class name */
  className?: string;
}

/**
 * Claim Card Component
 */
const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  expanded = false,
  onClick,
  className = ''
}) => {
  // Determine status class based on verification and hallucination
  const getStatusClass = () => {
    if (claim.isHallucination) return 'hallucination';
    if (claim.verified) return 'verified';
    return 'unverified';
  };
  
  // Determine status text based on verification and hallucination
  const getStatusText = () => {
    if (claim.isHallucination) return 'Hallucination';
    if (claim.verified) return 'Verified';
    return 'Unverified';
  };
  
  // Render evidence item
  const renderEvidenceItem = (evidence: Evidence, index: number) => (
    <div 
      key={`evidence-${index}`} 
      className={`claim-evidence-item ${evidence.sentiment}`}
    >
      <div className="evidence-text">{evidence.text}</div>
      <div className="evidence-source">
        <span className="source-name">{evidence.source.name}</span>
        {evidence.source.url && (
          <a 
            href={evidence.source.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="source-link"
          >
            Source
          </a>
        )}
        <span className="source-reliability">
          Reliability: {Math.round(evidence.source.reliability * 100)}%
        </span>
      </div>
    </div>
  );
  
  return (
    <div 
      className={`claim-card ${getStatusClass()} ${expanded ? 'expanded' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="claim-header">
        <div className="claim-text">{claim.claim.text}</div>
        <div className="claim-status">
          <span className={`status-badge ${getStatusClass()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>
      
      <div className="claim-scores">
        <ConfidenceBadge 
          score={claim.score.accuracy} 
          type="accuracy" 
          size="sm" 
        />
        <ConfidenceBadge 
          score={claim.score.confidence} 
          type="confidence" 
          size="sm" 
        />
      </div>
      
      {expanded && (
        <div className="claim-evidence">
          {claim.supportingEvidence.length > 0 && (
            <div className="supporting-evidence">
              <h5 className="evidence-title">Supporting Evidence</h5>
              {claim.supportingEvidence.map(renderEvidenceItem)}
            </div>
          )}
          
          {claim.contradictingEvidence.length > 0 && (
            <div className="contradicting-evidence">
              <h5 className="evidence-title">Contradicting Evidence</h5>
              {claim.contradictingEvidence.map(renderEvidenceItem)}
            </div>
          )}
          
          {claim.supportingEvidence.length === 0 && claim.contradictingEvidence.length === 0 && (
            <div className="no-evidence">
              <p>No evidence found for this claim.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaimCard;
