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
    <div className="veritas-integration-demo" style={{ backgroundColor: '#1a202c', color: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>VERITAS Integration Demo</h2>
      
      <div className="test-cases" style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'white', marginBottom: '10px' }}>Test Cases</h3>
        <div className="test-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => loadTestCase('andrews')} 
            className={testCase === 'andrews' ? 'active' : ''}
            style={{
              backgroundColor: testCase === 'andrews' ? '#3182ce' : '#4a5568',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Andrews v. Synthex AI Corp. (Fictional)
          </button>
          <button 
            onClick={() => loadTestCase('turner')} 
            className={testCase === 'turner' ? 'active' : ''}
            style={{
              backgroundColor: testCase === 'turner' ? '#3182ce' : '#4a5568',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Turner v. Cognivault (Fictional)
          </button>
          <button 
            onClick={() => loadTestCase('brown')} 
            className={testCase === 'brown' ? 'active' : ''}
            style={{
              backgroundColor: testCase === 'brown' ? '#3182ce' : '#4a5568',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Brown v. Board of Education (Real)
          </button>
          <button 
            onClick={() => loadTestCase('factual')} 
            className={testCase === 'factual' ? 'active' : ''}
            style={{
              backgroundColor: testCase === 'factual' ? '#3182ce' : '#4a5568',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Factual Statement
          </button>
        </div>
      </div>
      
      <div className="response-section" style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'white', marginBottom: '10px' }}>Response Text</h3>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={5}
          placeholder="Enter response text to verify..."
          style={{
            width: '100%',
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568',
            borderRadius: '4px',
            padding: '10px',
            resize: 'vertical'
          }}
        />
      </div>
      
      <div className="trust-score" style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'white', marginBottom: '10px' }}>Trust Score: {trustScore}</h3>
        <div className="score-controls" style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => handleTrustScoreChange(-5)}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >-5</button>
          <button 
            onClick={() => handleTrustScoreChange(-1)}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >-1</button>
          <button 
            onClick={() => handleTrustScoreChange(1)}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >+1</button>
          <button 
            onClick={() => handleTrustScoreChange(5)}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >+5</button>
          <button 
            onClick={() => setTrustScore(initialTrustScore)}
            style={{
              backgroundColor: '#4a5568',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >Reset</button>
        </div>
      </div>
      
      <div className="actions" style={{ marginBottom: '20px' }}>
        <button 
          onClick={processResponse} 
          disabled={veritas.loading || !response.trim()}
          className="primary-button"
          style={{
            backgroundColor: veritas.loading || !response.trim() ? '#4a5568' : '#3182ce',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: veritas.loading || !response.trim() ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {veritas.loading ? 'Processing...' : 'Process with VERITAS'}
        </button>
      </div>
      
      {veritas.error && (
        <div className="error-message" style={{ backgroundColor: '#ef4444', color: 'white', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          <h3 style={{ color: 'white', marginBottom: '10px' }}>Error</h3>
          <p style={{ margin: 0 }}>{veritas.error.message}</p>
        </div>
      )}
      
      {processingResult && (
        <div className="result-section" style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>VERITAS Results</h3>
          
          <div className="result-card" style={{ backgroundColor: '#4a5568', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
            <h4 style={{ color: 'white', marginBottom: '10px' }}>Verification</h4>
            <p style={{ color: '#a0aec0', margin: '5px 0' }}>Claims Analyzed: {processingResult.verification.claims.length}</p>
            <p style={{ color: '#a0aec0', margin: '5px 0' }}>Hallucinations Detected: {processingResult.verification.claims.filter((c: any) => c.isHallucination).length}</p>
            <p style={{ color: '#a0aec0', margin: '5px 0' }}>Overall Accuracy: {(processingResult.verification.overallScore.accuracy * 100).toFixed(1)}%</p>
            <p style={{ color: '#a0aec0', margin: '5px 0' }}>Overall Confidence: {(processingResult.verification.overallScore.confidence * 100).toFixed(1)}%</p>
          </div>
          
          <div className="result-card" style={{ backgroundColor: '#4a5568', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
            <h4 style={{ color: 'white', marginBottom: '10px' }}>Enforcement</h4>
            <p style={{ color: '#a0aec0', margin: '5px 0' }}>Response Blocked: <span className={processingResult.enforcement.blocked ? 'blocked' : 'allowed'} style={{ color: processingResult.enforcement.blocked ? '#ef4444' : '#10b981' }}>
              {processingResult.enforcement.blocked ? 'Yes' : 'No'}
            </span></p>
            <p style={{ color: '#a0aec0', margin: '5px 0' }}>Response Modified: {processingResult.enforcement.modified ? 'Yes' : 'No'}</p>
            <p style={{ color: '#a0aec0', margin: '5px 0' }}>Trust Penalty: {processingResult.trustScoreAdjustment}</p>
          </div>
          
          <div className="result-card full-width" style={{ backgroundColor: '#4a5568', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
            <h4 style={{ color: 'white', marginBottom: '10px' }}>Observer Notes</h4>
            <pre style={{ color: '#a0aec0', backgroundColor: '#1a202c', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>{processingResult.observerNotes}</pre>
          </div>
          
          <div className="result-card full-width" style={{ backgroundColor: '#4a5568', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
            <h4 style={{ color: 'white', marginBottom: '10px' }}>Enforced Response</h4>
            <div className="response-display" style={{ color: '#a0aec0', backgroundColor: '#1a202c', padding: '10px', borderRadius: '4px' }}>
              {processingResult.enforcement.enforcedResponse}
            </div>
          </div>
          
          {processingResult.verification.claims.length > 0 && (
            <div className="result-card full-width" style={{ backgroundColor: '#4a5568', padding: '15px', borderRadius: '4px' }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Claim Analysis</h4>
              <table className="claims-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a202c' }}>
                    <th style={{ color: 'white', padding: '10px', textAlign: 'left', border: '1px solid #4a5568' }}>Claim</th>
                    <th style={{ color: 'white', padding: '10px', textAlign: 'left', border: '1px solid #4a5568' }}>Hallucination</th>
                    <th style={{ color: 'white', padding: '10px', textAlign: 'left', border: '1px solid #4a5568' }}>Verified</th>
                    <th style={{ color: 'white', padding: '10px', textAlign: 'left', border: '1px solid #4a5568' }}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {processingResult.verification.claims.map((claim: any, index: number) => (
                    <tr key={index} className={claim.isHallucination ? 'hallucination' : ''} style={{ backgroundColor: claim.isHallucination ? '#7f1d1d' : 'transparent' }}>
                      <td style={{ color: '#a0aec0', padding: '8px', border: '1px solid #4a5568' }}>{claim.claim}</td>
                      <td style={{ color: claim.isHallucination ? '#ef4444' : '#10b981', padding: '8px', border: '1px solid #4a5568' }}>{claim.isHallucination ? 'Yes' : 'No'}</td>
                      <td style={{ color: claim.verified ? '#10b981' : '#ef4444', padding: '8px', border: '1px solid #4a5568' }}>{claim.verified ? 'Yes' : 'No'}</td>
                      <td style={{ color: '#a0aec0', padding: '8px', border: '1px solid #4a5568' }}>{(claim.score.accuracy * 100).toFixed(1)}%</td>
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
