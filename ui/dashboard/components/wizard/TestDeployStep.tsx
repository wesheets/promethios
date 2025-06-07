/**
 * Test & Deploy Step component for the Agent Wizard
 * 
 * Final step in the agent wrapping wizard for testing and deploying the wrapped agent.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { LoadingSpinner } from '../../../components/loading-state';

interface TestDeployStepProps {
  onBack: () => void;
}

export const TestDeployStep: React.FC<TestDeployStepProps> = ({ onBack }) => {
  const { 
    agentName,
    testAgent,
    deployAgent
  } = useDashboard();
  
  // Local state
  const [testResult, setTestResult] = useState<any>(null);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [deployLoading, setDeployLoading] = useState<boolean>(false);
  
  // Handle test button click
  const handleTest = async () => {
    try {
      setTestLoading(true);
      const result = await testAgent();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestLoading(false);
    }
  };
  
  // Handle deploy button click
  const handleDeploy = async () => {
    try {
      setDeployLoading(true);
      const result = await deployAgent();
      setDeployResult(result);
    } catch (err: any) {
      setDeployResult({ success: false, error: err.message });
    } finally {
      setDeployLoading(false);
    }
  };
  
  return (
    <div className="test-deploy-step">
      <h3>Test & Deploy Your Wrapped Agent</h3>
      
      <div className="success-message">
        Agent Successfully Wrapped!
      </div>
      
      <div className="agent-summary">
        <div className="summary-item">
          <span className="label">Agent Name:</span>
          <span className="value">{agentName}</span>
        </div>
      </div>
      
      <div className="action-panels">
        {/* Test Panel */}
        <div className="action-panel">
          <h4>Test Your Agent</h4>
          <p>Verify that your wrapped agent works as expected.</p>
          
          <button 
            onClick={handleTest} 
            disabled={testLoading}
          >
            {testLoading ? <LoadingSpinner size="small" /> : 'Test Agent'}
          </button>
          
          {testResult && (
            <div className={`result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.success ? (
                <div>
                  <div className="result-header">Test Successful</div>
                  <div className="result-output">
                    <pre>{testResult.output}</pre>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="result-header">Test Failed</div>
                  <div className="result-error">{testResult.error}</div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Deploy Panel */}
        <div className="action-panel">
          <h4>Deploy to Production</h4>
          <p>Deploy your wrapped agent to the production environment.</p>
          
          <button 
            onClick={handleDeploy} 
            disabled={deployLoading || !testResult?.success}
          >
            {deployLoading ? <LoadingSpinner size="small" /> : 'Deploy to Production'}
          </button>
          
          {deployResult && (
            <div className={`result ${deployResult.success ? 'success' : 'error'}`}>
              {deployResult.success ? (
                <div>
                  <div className="result-header">Deployment Successful</div>
                  <div className="result-id">Deployment ID: {deployResult.deploymentId}</div>
                </div>
              ) : (
                <div>
                  <div className="result-header">Deployment Failed</div>
                  <div className="result-error">{deployResult.error}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="form-actions">
        <button onClick={onBack}>Back</button>
      </div>
    </div>
  );
};
