import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useDashboard } from '../context/DashboardContext';
import { LoadingSpinner } from '../../components/loading-state';
import { ErrorBoundary } from '../../components/error-handling';
import { notifyObserver } from '../../components/observer/ObserverAgent';
import { useObserver } from '../../components/observer/ObserverContext';

// Step components
import { AgentInputStep } from './wizard/AgentInputStep';
import { AnalysisStep } from './wizard/AnalysisStep';
import { WrapperStep } from './wizard/WrapperStep';
import { TestDeployStep } from './wizard/TestDeployStep';
import { MultiAgentConfigStep } from './wizard/MultiAgentConfigStep';

// Styled Components
const WizardContainer = styled.div`
  background-color: #1A2233;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  margin-bottom: 24px;
`;

const WizardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const WizardTitle = styled.h2`
  font-size: 24px;
  color: #FFFFFF;
  margin: 0;
`;

const WizardMode = styled.div`
  display: flex;
  align-items: center;
`;

const ModeToggle = styled.button<{ active: boolean }>`
  background-color: ${props => props.active ? 'rgba(43, 255, 198, 0.1)' : 'transparent'};
  color: ${props => props.active ? '#2BFFC6' : '#B0B8C4'};
  border: 1px solid ${props => props.active ? '#2BFFC6' : '#2A3343'};
  border-radius: 4px;
  padding: 8px 12px;
  margin-left: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.active ? 'rgba(43, 255, 198, 0.2)' : 'rgba(43, 255, 198, 0.05)'};
  }
  
  &:focus {
    outline: 2px solid #2BFFC6;
    outline-offset: 2px;
  }
`;

const ProgressContainer = styled.div`
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #2A3343;
  padding-bottom: 16px;
`;

const ProgressStep = styled.div<{ active: boolean; completed: boolean }>`
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  position: relative;
  color: ${props => props.active ? '#2BFFC6' : props.completed ? '#FFFFFF' : '#B0B8C4'};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  
  &::after {
    content: '';
    position: absolute;
    bottom: -16px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.active ? '#2BFFC6' : props.completed ? '#FFFFFF' : '#2A3343'};
  }
  
  &::before {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 0;
    width: 100%;
    height: 1px;
    background-color: ${props => props.completed ? '#FFFFFF' : '#2A3343'};
  }
  
  &:first-child::before {
    width: 50%;
    left: 50%;
  }
  
  &:last-child::before {
    width: 50%;
    right: 50%;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 76, 76, 0.1);
  border: 1px solid #FF4C4C;
  color: #FF4C4C;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 24px;
`;

const WizardContent = styled.div`
  min-height: 400px;
`;

/**
 * Enhanced AgentWizard Component
 * 
 * Multi-step wizard for wrapping external agents with Promethios governance.
 * Supports both single-agent and multi-agent configurations.
 * Integrates with Observer for contextual guidance.
 * 
 * @returns {JSX.Element} - Rendered component
 */
export const AgentWizard: React.FC = () => {
  // Dashboard context
  const { 
    currentStep,
    setCurrentStep,
    loading,
    error
  } = useDashboard();
  
  // Observer context
  const { updateMessage } = useObserver();
  
  // Local state
  const [wizardMode, setWizardMode] = useState<'single' | 'multi'>('single');
  
  // Single-agent steps
  const singleAgentSteps = [
    { id: 'input', label: 'Input Agent Details' },
    { id: 'analysis', label: 'Analysis Results & Configuration' },
    { id: 'wrapper', label: 'Generated Wrapper Code' },
    { id: 'deploy', label: 'Test & Deploy' }
  ];
  
  // Multi-agent steps
  const multiAgentSteps = [
    { id: 'input', label: 'Input Agent Details' },
    { id: 'analysis', label: 'Analysis Results & Configuration' },
    { id: 'multi-config', label: 'Multi-Agent Configuration' },
    { id: 'wrapper', label: 'Generated Wrapper Code' },
    { id: 'deploy', label: 'Test & Deploy' }
  ];
  
  // Get current steps based on mode
  const steps = wizardMode === 'single' ? singleAgentSteps : multiAgentSteps;
  
  // Toggle wizard mode
  const toggleWizardMode = (mode: 'single' | 'multi') => {
    if (mode !== wizardMode) {
      setWizardMode(mode);
      setCurrentStep(0);
      
      // Notify Observer
      if (mode === 'multi') {
        notifyObserver('info', 'Switching to multi-agent mode. You can configure relationships between multiple agents in this mode.');
      } else {
        notifyObserver('info', 'Switching to single-agent mode. This is perfect for wrapping individual agents with governance.');
      }
    }
  };
  
  // Notify Observer on step change
  useEffect(() => {
    const stepMessages = {
      'input': 'Let\'s start by providing details about your agent. What endpoint does it use?',
      'analysis': 'Great! Now we\'ll analyze your agent to determine the appropriate governance controls.',
      'multi-config': 'Now let\'s configure how your agents will interact with each other.',
      'wrapper': 'Here\'s the generated wrapper code. You can customize it if needed.',
      'deploy': 'Finally, let\'s test and deploy your governed agent!'
    };
    
    const currentStepId = steps[currentStep]?.id;
    if (currentStepId && stepMessages[currentStepId as keyof typeof stepMessages]) {
      notifyObserver('info', stepMessages[currentStepId as keyof typeof stepMessages]);
    }
  }, [currentStep, steps]);
  
  // Render appropriate step based on current step index and mode
  const renderStep = () => {
    if (wizardMode === 'single') {
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
    } else {
      switch (currentStep) {
        case 0:
          return <AgentInputStep onNext={() => setCurrentStep(1)} multiAgent />;
        case 1:
          return <AnalysisStep onNext={() => setCurrentStep(2)} onBack={() => setCurrentStep(0)} multiAgent />;
        case 2:
          return <MultiAgentConfigStep onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />;
        case 3:
          return <WrapperStep onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} multiAgent />;
        case 4:
          return <TestDeployStep onBack={() => setCurrentStep(3)} multiAgent />;
        default:
          return <AgentInputStep onNext={() => setCurrentStep(1)} multiAgent />;
      }
    }
  };

  return (
    <WizardContainer className="agent-wizard" data-testid="agent-wizard">
      <WizardHeader>
        <WizardTitle>Agent Wrapping Wizard</WizardTitle>
        <WizardMode>
          <ModeToggle 
            active={wizardMode === 'single'} 
            onClick={() => toggleWizardMode('single')}
            aria-label="Single Agent Mode"
            data-testid="single-agent-mode"
          >
            Single Agent
          </ModeToggle>
          <ModeToggle 
            active={wizardMode === 'multi'} 
            onClick={() => toggleWizardMode('multi')}
            aria-label="Multi-Agent Mode"
            data-testid="multi-agent-mode"
          >
            Multi-Agent
          </ModeToggle>
        </WizardMode>
      </WizardHeader>
      
      {/* Progress indicator */}
      <ProgressContainer>
        {steps.map((step, index) => (
          <ProgressStep 
            key={step.id}
            active={currentStep === index}
            completed={currentStep > index}
            data-testid={`step-${step.id}`}
          >
            {step.label}
          </ProgressStep>
        ))}
      </ProgressContainer>
      
      {/* Error message */}
      {error && (
        <ErrorMessage data-testid="wizard-error">
          {error}
        </ErrorMessage>
      )}
      
      {/* Loading state or step content */}
      <WizardContent>
        {loading ? (
          <LoadingSpinner message="Processing..." />
        ) : (
          <ErrorBoundary>
            {renderStep()}
          </ErrorBoundary>
        )}
      </WizardContent>
    </WizardContainer>
  );
};

export default AgentWizard;
