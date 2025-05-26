/**
 * Dashboard Context Provider
 * 
 * This component provides state management for the Developer Dashboard.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as integration from './integration';

// Create context
const DashboardContext = createContext(null);

// Dashboard provider props interface
interface DashboardProviderProps {
  children: React.ReactNode;
}

// Dashboard context state interface
interface DashboardState {
  metrics: any;
  agentCode: string;
  agentName: string;
  analysisResult: any;
  wrapperResult: any;
  testResult: any;
  deploymentResult: any;
  loading: boolean;
  error: string | null;
  setAgentCode: (code: string) => void;
  setAgentName: (name: string) => void;
  analyzeAgent: () => Promise<void>;
  generateWrapper: () => Promise<void>;
  testWrappedAgent: () => Promise<void>;
  deployWrappedAgent: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
}

/**
 * Dashboard Provider Component
 */
export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  // State
  const [metrics, setMetrics] = useState(null);
  const [agentCode, setAgentCode] = useState('');
  const [agentName, setAgentName] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [wrapperResult, setWrapperResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [deploymentResult, setDeploymentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load metrics on mount
  useEffect(() => {
    refreshMetrics();
  }, []);

  // Refresh metrics
  const refreshMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const governanceMetrics = await integration.getGovernanceMetrics();
      setMetrics(governanceMetrics);
    } catch (err) {
      setError('Failed to load metrics: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Analyze agent
  const analyzeAgent = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await integration.analyzeAgent(agentCode, agentName);
      setAnalysisResult(result);
      return result;
    } catch (err) {
      setError('Analysis failed: ' + (err instanceof Error ? err.message : String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generate wrapper
  const generateWrapper = async () => {
    if (!analysisResult) {
      setError('Must analyze agent before generating wrapper');
      return;
    }

    try {
      setLoading(true);
      setError(null);
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
      return result;
    } catch (err) {
      setError('Wrapper generation failed: ' + (err instanceof Error ? err.message : String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Test wrapped agent
  const testWrappedAgent = async () => {
    if (!wrapperResult) {
      setError('Must generate wrapper before testing');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await integration.testWrappedAgent({
        agentName,
        wrapperFiles: wrapperResult.files
      });
      setTestResult(result);
      return result;
    } catch (err) {
      setError('Testing failed: ' + (err instanceof Error ? err.message : String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deploy wrapped agent
  const deployWrappedAgent = async () => {
    if (!testResult || !testResult.success) {
      setError('Must successfully test wrapper before deploying');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await integration.deployWrappedAgent({
        agentName,
        wrapperFiles: wrapperResult.files
      });
      setDeploymentResult(result);
      await refreshMetrics(); // Refresh metrics after deployment
      return result;
    } catch (err) {
      setError('Deployment failed: ' + (err instanceof Error ? err.message : String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value: DashboardState = {
    metrics,
    agentCode,
    agentName,
    analysisResult,
    wrapperResult,
    testResult,
    deploymentResult,
    loading,
    error,
    setAgentCode,
    setAgentName,
    analyzeAgent,
    generateWrapper,
    testWrappedAgent,
    deployWrappedAgent,
    refreshMetrics
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

/**
 * Use Dashboard Hook
 * 
 * Custom hook to use the dashboard context
 */
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext;
