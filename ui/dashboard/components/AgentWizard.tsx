/**
 * Agent Wizard component for the Developer Dashboard
 * 
 * Multi-step wizard for wrapping external agents with Promethios governance.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { LoadingSpinner } from '../../components/loading-state';
import { ErrorBoundary } from '../../components/error-handling';

// Step components
import { AgentInputStep } from './wizard/AgentInputStep';
import { AnalysisStep } from './wizard/AnalysisStep';
import { WrapperStep } from './wizard/WrapperStep';
import { TestDeployStep } from './wizard/TestDeployStep';

export const AgentWizard: React.FC = () => {
  const { 
    currentStep,
    setCurrentStep,
    loading,
    error
  } = useDashboard();
  
  // Render appropriate step based on current step index
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <AgentInputStep onNext={() => setCurrentStep(1)} />;
      case 1:
        return <AnalysisStep onNext={() => setCurrentStep(2)} onBack={() => setCurrentStep(0)} />;
      case 2:
        return <WrapperStep onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />;
      case 3:
        return <TestDeployStep onBack={() => setCurrentStep(2)} />;
      default:
        return <AgentInputStep onNext={() => setCurrentStep(1)} />;
    }
  };
  
  return (
    <div className="agent-wizard">
      <h2>Agent Wrapping Wizard</h2>
      
      {/* Progress indicator */}
      <div className="wizard-progress">
        <div className={`step ${currentStep >= 0 ? 'active' : ''}`}>Input Agent Details</div>
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>Analysis Results & Configuration</div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>Generated Wrapper Code</div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>Test & Deploy</div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message" data-testid="wizard-error">
          {error}
        </div>
      )}
      
      {/* Loading state or step content */}
      <div className="wizard-content">
        {loading ? (
          <LoadingSpinner message="Processing..." />
        ) : (
          <ErrorBoundary>
            {renderStep()}
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
};
