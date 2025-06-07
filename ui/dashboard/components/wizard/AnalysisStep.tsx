/**
 * Analysis Step component for the Agent Wizard
 * 
 * Second step in the agent wrapping wizard for reviewing analysis results.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

interface AnalysisStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const AnalysisStep: React.FC<AnalysisStepProps> = ({ onNext, onBack }) => {
  const { 
    analysisResults,
    generateAgentWrapper
  } = useDashboard();
  
  // Handle next button click
  const handleNext = async () => {
    try {
      await generateAgentWrapper();
      onNext();
    } catch (err) {
      // Error handling is done by the context
      console.error('Failed to generate wrapper:', err);
    }
  };
  
  return (
    <div className="analysis-step">
      <h3>Analysis Results & Configuration</h3>
      
      <div className="analysis-results">
        <div className="result-item">
          <span className="label">Detected Framework:</span>
          <span className="value">{analysisResults?.framework || 'Unknown'}</span>
        </div>
        
        <div className="result-item">
          <span className="label">Compatibility Score:</span>
          <span className="value">{analysisResults?.compatibility ? `${Math.round(analysisResults.compatibility * 100)}%` : 'N/A'}</span>
        </div>
        
        <div className="result-item">
          <span className="label">Required Adapters:</span>
          <span className="value">
            {analysisResults?.requiredAdapters?.join(', ') || 'None'}
          </span>
        </div>
      </div>
      
      <div className="form-actions">
        <button onClick={onBack}>Back</button>
        <button onClick={handleNext}>Next</button>
      </div>
    </div>
  );
};
