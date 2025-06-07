/**
 * Agent Input Step component for the Agent Wizard
 * 
 * First step in the agent wrapping wizard for inputting agent details.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

interface AgentInputStepProps {
  onNext: () => void;
}

export const AgentInputStep: React.FC<AgentInputStepProps> = ({ onNext }) => {
  const { 
    agentName,
    setAgentName,
    agentCode,
    setAgentCode,
    analyzeAgentCode
  } = useDashboard();
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await analyzeAgentCode();
      onNext();
    } catch (err) {
      // Error handling is done by the context
      console.error('Failed to analyze agent:', err);
    }
  };
  
  return (
    <div className="agent-input-step">
      <h3>Input Agent Details</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="agent-name">Agent Name</label>
          <input
            type="text"
            id="agent-name"
            aria-label="Agent Name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="agent-code">Agent Code</label>
          <textarea
            id="agent-code"
            aria-label="Agent Code"
            value={agentCode}
            onChange={(e) => setAgentCode(e.target.value)}
            rows={10}
            required
          />
        </div>
        
        <div className="form-actions">
          <button type="submit">Next</button>
        </div>
      </form>
    </div>
  );
};
