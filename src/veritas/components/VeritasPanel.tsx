/**
 * VERITAS Panel Component
 * 
 * This component displays verification results for a text.
 * It shows overall scores, claims, and evidence sources.
 */

import React, { useState } from 'react';
import { VerificationResult, ClaimValidation, VeritasOptions } from '../types';
import { useVeritas } from '../hooks/useVeritas';
import ClaimCard from './ClaimCard';
import ConfidenceBadge from './ConfidenceBadge';
import SourceList from './SourceList';
import HallucinationWarning from './HallucinationWarning';

interface VeritasPanelProps {
  /** Text to verify */
  text: string;
  /** Verification mode */
  mode?: 'strict' | 'balanced' | 'lenient';
  /** Whether to auto-verify on mount */
  autoVerify?: boolean;
  /** Additional verification options */
  options?: VeritasOptions;
  /** CSS class name */
  className?: string;
}

/**
 * VERITAS Panel Component
 */
const VeritasPanel: React.FC<VeritasPanelProps> = ({
  text,
  mode = 'balanced',
  autoVerify = true,
  options = {},
  className = ''
}) => {
  // State for expanded claims
  const [expandedClaimIndex, setExpandedClaimIndex] = useState<number | null>(null);
  
  // Use VERITAS hook for verification
  const {
    results,
    claims,
    isVerifying,
    error,
    verify
  } = useVeritas(autoVerify ? text : null, { mode, ...options });
  
  // Handle claim expansion
  const handleClaimClick = (index: number) => {
    setExpandedClaimIndex(expandedClaimIndex === index ? null : index);
  };
  
  // Handle manual verification
  const handleVerify = () => {
    verify(text);
  };
  
  // Get hallucinations
  const hallucinations = claims.filter(claim => claim.isHallucination);
  
  return (
    <div className={`veritas-panel ${className}`}>
      <div className="veritas-panel-header">
        <h3 className="veritas-panel-title">VERITAS Verification</h3>
        
        {!autoVerify && (
          <button 
            className="veritas-verify-button"
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        )}
      </div>
      
      {isVerifying && (
        <div className="veritas-loading">
          <div className="veritas-spinner"></div>
          <p>Verifying content...</p>
        </div>
      )}
      
      {error && (
        <div className="veritas-error">
          <p>Error: {error.message}</p>
        </div>
      )}
      
      {results && !isVerifying && (
        <div className="veritas-results">
          <div className="veritas-scores">
            <div className="veritas-score">
              <span className="veritas-score-label">Accuracy</span>
              <ConfidenceBadge 
                score={results.overallScore.accuracy} 
                type="accuracy"
              />
            </div>
            <div className="veritas-score">
              <span className="veritas-score-label">Confidence</span>
              <ConfidenceBadge 
                score={results.overallScore.confidence} 
                type="confidence"
              />
            </div>
          </div>
          
          {hallucinations.length > 0 && (
            <HallucinationWarning 
              claims={hallucinations} 
              className="veritas-hallucination-warning"
            />
          )}
          
          <div className="veritas-claims">
            <h4 className="veritas-section-title">Claims</h4>
            {claims.length === 0 ? (
              <p className="veritas-no-claims">No claims detected</p>
            ) : (
              claims.map((claim, index) => (
                <ClaimCard
                  key={`claim-${index}`}
                  claim={claim}
                  expanded={expandedClaimIndex === index}
                  onClick={() => handleClaimClick(index)}
                />
              ))
            )}
          </div>
          
          {results.sources.length > 0 && (
            <div className="veritas-sources">
              <h4 className="veritas-section-title">Sources</h4>
              <SourceList sources={results.sources} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VeritasPanel;
