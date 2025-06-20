/**
 * VERITAS Integration Component
 * 
 * This component demonstrates the integration of VERITAS enforcement
 * with the governance pipeline in a React component.
 */

import React, { useState, useEffect } from 'react';
import useVeritasEnforcement from '../hooks/useVeritasEnforcement';

interface VeritasIntegrationDemoProps {
  initialTrustScore?: number;
  onTrustScoreChange?: (newScore: number) => void;
  onObserverNote?: (note: string) => void;
  onTraceUpdate?: (entry: any) => void;
}

const VeritasIntegrationDemo: React.FC<VeritasIntegrationDemoProps> = ({
  initialTrustScore = 50,
  onTrustScoreChange,
  onObserverNote,
  onTraceUpdate
}) => {
  // State
  const [response, setResponse] = useState<string>('');
  const [trustScore, setTrustScore] = useState<number>(initialTrustScore);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [testCase, setTestCase] = useState<string>('');
  
  // VERITAS enforcement hook
  const veritas = useVeritasEnforcement({
    enabled: true,
    enforcement: {
      blockHallucinations: true,
      trustPenalty: 10,
      warningLevel: 'explicit'
    }
  });
  
  // Handle trust score changes
  const handleTrustScoreChange = (adjustment: number) => {
    const newScore = Math.max(0, Math.min(100, trustScore + adjustment));
    setTrustScore(newScore);
    if (onTrustScoreChange) {
      onTrustScoreChange(newScore);
    }
  };
  
  // Process response with VERITAS
  const processResponse = async () => {
    try {
      const result = await veritas.processResponse(response, trustScore);
      setProcessingResult(result);
      
      // Update trust score
      if (result.trustScoreAdjustment !== 0) {
        handleTrustScoreChange(result.trustScoreAdjustment);
      }
      
      // Add observer note
      if (onObserverNote) {
        onObserverNote(result.observerNotes);
      }
      
      // Add to trace
      if (onTraceUpdate) {
        onTraceUpdate({
          id: Date.now(),
          title: 'Factual Verification',
          module: 'VERITAS',
          status: result.enforcement.blocked ? 'failed' : 'passed',
          violation: result.enforcement.blocked,
          details: result.observerNotes
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error processing response:', error);
      return null;
    }
  };
  
  // Load test case
  const loadTestCase = (caseType: string) => {
    setTestCase(caseType);
    
    switch (caseType) {
      case 'andrews':
        setResponse('In the 2023 Supreme Court case of Andrews v. Synthex AI Corp., a landmark decision was made regarding emotional accountability in artificial intelligence systems.');
        break;
      case 'turner':
        setResponse('Turner v. Cognivault established guidelines for AI systems in 2021.');
        break;
      case 'brown':
        setResponse('In Brown v. Board of Education, the Supreme Court ruled that segregation in public schools is unconstitutional.');
        break;
      case 'factual':
        setResponse('The Earth orbits around the Sun.');
        break;
      default:
        setResponse('');
    }
  };
  
  return (
    <div className="veritas-integration-demo">
      <h2>VERITAS Integration Demo</h2>
      
      <div className="test-cases">
        <h3>Test Cases</h3>
        <div className="test-buttons">
          <button onClick={() => loadTestCase('andrews')} className={testCase === 'andrews' ? 'active' : ''}>
            Andrews v. Synthex AI Corp. (Fictional)
          </button>
          <button onClick={() => loadTestCase('turner')} className={testCase === 'turner' ? 'active' : ''}>
            Turner v. Cognivault (Fictional)
          </button>
          <button onClick={() => loadTestCase('brown')} className={testCase === 'brown' ? 'active' : ''}>
            Brown v. Board of Education (Real)
          </button>
          <button onClick={() => loadTestCase('factual')} className={testCase === 'factual' ? 'active' : ''}>
            Factual Statement
          </button>
        </div>
      </div>
      
      <div className="response-section">
        <h3>Response Text</h3>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={5}
          placeholder="Enter response text to verify..."
        />
      </div>
      
      <div className="trust-score">
        <h3>Trust Score: {trustScore}</h3>
        <div className="score-controls">
          <button onClick={() => handleTrustScoreChange(-5)}>-5</button>
          <button onClick={() => handleTrustScoreChange(-1)}>-1</button>
          <button onClick={() => handleTrustScoreChange(1)}>+1</button>
          <button onClick={() => handleTrustScoreChange(5)}>+5</button>
          <button onClick={() => setTrustScore(initialTrustScore)}>Reset</button>
        </div>
      </div>
      
      <div className="actions">
        <button 
          onClick={processResponse} 
          disabled={veritas.loading || !response.trim()}
          className="primary-button"
        >
          {veritas.loading ? 'Processing...' : 'Process with VERITAS'}
        </button>
      </div>
      
      {veritas.error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{veritas.error.message}</p>
        </div>
      )}
      
      {processingResult && (
        <div className="result-section">
          <h3>VERITAS Results</h3>
          
          <div className="result-card">
            <h4>Verification</h4>
            <p>Claims Analyzed: {processingResult.verification.claims.length}</p>
            <p>Hallucinations Detected: {processingResult.verification.claims.filter((c: any) => c.isHallucination).length}</p>
            <p>Overall Accuracy: {(processingResult.verification.overallScore.accuracy * 100).toFixed(1)}%</p>
            <p>Overall Confidence: {(processingResult.verification.overallScore.confidence * 100).toFixed(1)}%</p>
          </div>
          
          <div className="result-card">
            <h4>Enforcement</h4>
            <p>Response Blocked: <span className={processingResult.enforcement.blocked ? 'blocked' : 'allowed'}>
              {processingResult.enforcement.blocked ? 'Yes' : 'No'}
            </span></p>
            <p>Response Modified: {processingResult.enforcement.modified ? 'Yes' : 'No'}</p>
            <p>Trust Penalty: {processingResult.trustScoreAdjustment}</p>
          </div>
          
          <div className="result-card full-width">
            <h4>Observer Notes</h4>
            <pre>{processingResult.observerNotes}</pre>
          </div>
          
          <div className="result-card full-width">
            <h4>Enforced Response</h4>
            <div className="response-display">
              {processingResult.enforcement.enforcedResponse}
            </div>
          </div>
          
          {processingResult.verification.claims.length > 0 && (
            <div className="result-card full-width">
              <h4>Claim Analysis</h4>
              <table className="claims-table">
                <thead>
                  <tr>
                    <th>Claim</th>
                    <th>Hallucination</th>
                    <th>Verified</th>
                    <th>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {processingResult.verification.claims.map((claim: any, index: number) => (
                    <tr key={index} className={claim.isHallucination ? 'hallucination' : ''}>
                      <td>{claim.claim}</td>
                      <td>{claim.isHallucination ? 'Yes' : 'No'}</td>
                      <td>{claim.verified ? 'Yes' : 'No'}</td>
                      <td>{(claim.score.accuracy * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VeritasIntegrationDemo;
