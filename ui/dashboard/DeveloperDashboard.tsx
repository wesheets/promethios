/**
 * Developer Dashboard UI Component
 * 
 * This component provides a user interface for developers to wrap their agents
 * with Promethios governance.
 */

import React, { useState, useEffect } from 'react';
import { DashboardProvider, useDashboard } from './DashboardContext';
import * as integration from './integration';

/**
 * Developer Dashboard Component
 */
export const DeveloperDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    // Load metrics when the dashboard is mounted
    const loadMetrics = async () => {
      try {
        const governanceMetrics = await integration.getGovernanceMetrics();
        setMetrics(governanceMetrics);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      }
    };
    
    loadMetrics();
  }, []);
  
  return (
    <div className="developer-dashboard">
      <h1>Developer Dashboard</h1>
      
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'upload' ? 'active' : ''} 
          onClick={() => setActiveTab('upload')}
        >
          Upload Agent
        </button>
        <button 
          className={activeTab === 'metrics' ? 'active' : ''} 
          onClick={() => setActiveTab('metrics')}
        >
          Metrics Dashboard
        </button>
        <button 
          className={activeTab === 'agents' ? 'active' : ''} 
          onClick={() => setActiveTab('agents')}
        >
          Wrapped Agents
        </button>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'upload' && <UploadAgentTab />}
        {activeTab === 'metrics' && <MetricsDashboardTab metrics={metrics} />}
        {activeTab === 'agents' && <WrappedAgentsTab metrics={metrics} />}
      </div>
    </div>
  );
};

/**
 * Upload Agent Tab
 */
const UploadAgentTab = () => {
  const [step, setStep] = useState(1);
  const [agentName, setAgentName] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [wrapperResult, setWrapperResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  
  const handleAnalyze = async () => {
    try {
      const result = await integration.analyzeAgent(agentCode, agentName);
      setAnalysisResult(result);
      setStep(2);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };
  
  const handleGenerate = async () => {
    try {
      const result = await integration.generateWrapper({
        agentCode,
        agentName,
        framework: analysisResult.detectedFramework,
        inputSchema: analysisResult.analysisResult.inputSchema,
        outputSchema: analysisResult.analysisResult.outputSchema,
        governanceHooks: analysisResult.integrationPoints,
        configOptions: {
          strictValidation: true,
          trackMemory: true
        }
      });
      setWrapperResult(result);
      setStep(3);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };
  
  const handleTest = async () => {
    try {
      const result = await integration.testWrappedAgent({
        agentName,
        wrapperFiles: wrapperResult.files
      });
      setTestResult(result);
      setStep(4);
    } catch (error) {
      console.error('Testing failed:', error);
    }
  };
  
  return (
    <div className="upload-agent-tab">
      {step === 1 && (
        <div className="step-content">
          <h2>Upload Agent Code</h2>
          <div className="form-group">
            <label htmlFor="agent-name">Agent Name</label>
            <input
              id="agent-name"
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              aria-label="Agent Name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="agent-code">Agent Code</label>
            <textarea
              id="agent-code"
              value={agentCode}
              onChange={(e) => setAgentCode(e.target.value)}
              rows={10}
              aria-label="Agent Code"
            />
          </div>
          <button onClick={handleAnalyze}>Next</button>
        </div>
      )}
      
      {step === 2 && analysisResult && (
        <div className="step-content">
          <h2>Analysis Results & Configuration</h2>
          <div className="analysis-results">
            <h3>Detected Framework: {analysisResult.detectedFramework}</h3>
            <h3>Compatibility Score: {analysisResult.compatibilityResult.score * 100}%</h3>
            <h3>Integration Points: {analysisResult.integrationPoints.length}</h3>
          </div>
          <button onClick={handleGenerate}>Next</button>
        </div>
      )}
      
      {step === 3 && wrapperResult && (
        <div className="step-content">
          <h2>Generated Wrapper Code</h2>
          <div className="wrapper-files">
            {wrapperResult.files.map((file, index) => (
              <div key={index} className="file-preview">
                <h3>{file.path}</h3>
                <pre>{file.content}</pre>
              </div>
            ))}
          </div>
          <button onClick={handleTest}>Test Wrapper</button>
        </div>
      )}
      
      {step === 4 && testResult && (
        <div className="step-content">
          <h2>Test Results</h2>
          <div className="test-results">
            <h3>Status: {testResult.success ? 'Success' : 'Failed'}</h3>
            <h3>Tests Run: {testResult.results.length}</h3>
            <h3>Errors: {testResult.errors.length}</h3>
          </div>
          <button>Deploy Wrapped Agent</button>
        </div>
      )}
    </div>
  );
};

/**
 * Metrics Dashboard Tab
 */
const MetricsDashboardTab = ({ metrics }) => {
  if (!metrics) {
    return <div>Loading metrics...</div>;
  }
  
  return (
    <div className="metrics-dashboard-tab">
      <h2>Governance Metrics Dashboard</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Trust Score</h3>
          <div className="metric-value">{metrics.trustScore}%</div>
        </div>
        <div className="metric-card">
          <h3>Compliance Rate</h3>
          <div className="metric-value">{metrics.complianceRate}%</div>
        </div>
        <div className="metric-card">
          <h3>Agents Wrapped</h3>
          <div className="metric-value">{metrics.agentsWrapped}</div>
        </div>
      </div>
      <div className="violations-section">
        <h3>Recent Violations</h3>
        <table>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Message</th>
              <th>Agent</th>
            </tr>
          </thead>
          <tbody>
            {metrics.violations.map((violation, index) => (
              <tr key={index}>
                <td>{violation.severity}</td>
                <td>{violation.message}</td>
                <td>{violation.agentName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Wrapped Agents Tab
 */
const WrappedAgentsTab = ({ metrics }) => {
  if (!metrics) {
    return <div>Loading agents...</div>;
  }
  
  return (
    <div className="wrapped-agents-tab">
      <h2>Wrapped Agents</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Framework</th>
            <th>Last Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {metrics.wrappedAgents.map((agent, index) => (
            <tr key={index}>
              <td>{agent.name}</td>
              <td>{agent.framework}</td>
              <td>{new Date(agent.lastActive).toLocaleString()}</td>
              <td>
                <button>View</button>
                <button>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeveloperDashboard;
