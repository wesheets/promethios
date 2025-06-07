/**
 * Dashboard context provider
 * 
 * Provides context for dashboard-related components.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React, { createContext, useContext, useState } from 'react';

// Dashboard context type
interface DashboardContextType {
  agentName: string;
  setAgentName: (name: string) => void;
  agentCode: string;
  setAgentCode: (code: string) => void;
  analyzeAgent: () => Promise<any>;
  generateWrapper: () => Promise<any>;
  testAgent: () => Promise<any>;
  deployAgent: () => Promise<any>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  analysisResults: any;
  setAnalysisResults: (results: any) => void;
  wrapperCode: any;
  setWrapperCode: (code: any) => void;
}

// Create the context with default values
export const DashboardContext = createContext<DashboardContextType>({
  agentName: '',
  setAgentName: () => {},
  agentCode: '',
  setAgentCode: () => {},
  analyzeAgent: async () => ({}),
  generateWrapper: async () => ({}),
  testAgent: async () => ({}),
  deployAgent: async () => ({}),
  currentStep: 0,
  setCurrentStep: () => {},
  analysisResults: null,
  setAnalysisResults: () => {},
  wrapperCode: null,
  setWrapperCode: () => {}
});

// Hook for using the dashboard context
export const useDashboard = () => useContext(DashboardContext);

// Provider component
interface DashboardProviderProps {
  children: React.ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [agentName, setAgentName] = useState<string>('');
  const [agentCode, setAgentCode] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [wrapperCode, setWrapperCode] = useState<any>(null);
  
  // Import services
  const services = require('../services/integration');
  
  // Analyze agent
  const analyzeAgent = async () => {
    const results = await services.analyzeAgent(agentCode, agentName);
    setAnalysisResults(results);
    return results;
  };
  
  // Generate wrapper
  const generateWrapper = async () => {
    const framework = analysisResults?.framework || 'unknown';
    const wrapper = await services.generateWrapper(agentCode, agentName, framework);
    setWrapperCode(wrapper);
    return wrapper;
  };
  
  // Test agent
  const testAgent = async () => {
    return await services.testWrappedAgent(wrapperCode);
  };
  
  // Deploy agent
  const deployAgent = async () => {
    return await services.deployWrappedAgent(wrapperCode);
  };
  
  return (
    <DashboardContext.Provider
      value={{
        agentName,
        setAgentName,
        agentCode,
        setAgentCode,
        analyzeAgent,
        generateWrapper,
        testAgent,
        deployAgent,
        currentStep,
        setCurrentStep,
        analysisResults,
        setAnalysisResults,
        wrapperCode,
        setWrapperCode
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
