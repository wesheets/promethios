import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentWizard } from './AgentWizard';
import { useDashboard } from '../context/DashboardContext';
import { useObserver } from '../../components/observer/ObserverContext';
import { notifyObserver } from '../../components/observer/ObserverAgent';

// Mock the hooks and components
jest.mock('../context/DashboardContext', () => ({
  useDashboard: jest.fn()
}));

jest.mock('../../components/observer/ObserverContext', () => ({
  useObserver: jest.fn()
}));

jest.mock('../../components/observer/ObserverAgent', () => ({
  notifyObserver: jest.fn()
}));

jest.mock('../../components/loading-state', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

jest.mock('../../components/error-handling', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('./wizard/AgentInputStep', () => ({
  AgentInputStep: ({ onNext, multiAgent }: { onNext: () => void, multiAgent?: boolean }) => (
    <div data-testid="agent-input-step">
      Agent Input Step {multiAgent ? '(Multi)' : '(Single)'}
      <button onClick={onNext}>Next</button>
    </div>
  )
}));

jest.mock('./wizard/AnalysisStep', () => ({
  AnalysisStep: ({ onNext, onBack, multiAgent }: { onNext: () => void, onBack: () => void, multiAgent?: boolean }) => (
    <div data-testid="analysis-step">
      Analysis Step {multiAgent ? '(Multi)' : '(Single)'}
      <button onClick={onBack}>Back</button>
      <button onClick={onNext}>Next</button>
    </div>
  )
}));

jest.mock('./wizard/WrapperStep', () => ({
  WrapperStep: ({ onNext, onBack, multiAgent }: { onNext: () => void, onBack: () => void, multiAgent?: boolean }) => (
    <div data-testid="wrapper-step">
      Wrapper Step {multiAgent ? '(Multi)' : '(Single)'}
      <button onClick={onBack}>Back</button>
      <button onClick={onNext}>Next</button>
    </div>
  )
}));

jest.mock('./wizard/TestDeployStep', () => ({
  TestDeployStep: ({ onBack, multiAgent }: { onBack: () => void, multiAgent?: boolean }) => (
    <div data-testid="test-deploy-step">
      Test Deploy Step {multiAgent ? '(Multi)' : '(Single)'}
      <button onClick={onBack}>Back</button>
    </div>
  )
}));

jest.mock('./wizard/MultiAgentConfigStep', () => ({
  MultiAgentConfigStep: ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => (
    <div data-testid="multi-agent-config-step">
      Multi-Agent Config Step
      <button onClick={onBack}>Back</button>
      <button onClick={onNext}>Next</button>
    </div>
  )
}));

describe('AgentWizard', () => {
  const mockSetCurrentStep = jest.fn();
  const mockUpdateMessage = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock dashboard context
    (useDashboard as jest.Mock).mockReturnValue({
      currentStep: 0,
      setCurrentStep: mockSetCurrentStep,
      loading: false,
      error: null
    });
    
    // Mock observer context
    (useObserver as jest.Mock).mockReturnValue({
      updateMessage: mockUpdateMessage
    });
  });

  it('renders in single agent mode by default', () => {
    render(<AgentWizard />);
    
    // Check if wizard container exists
    expect(screen.getByTestId('agent-wizard')).toBeInTheDocument();
    
    // Check if mode toggles exist
    expect(screen.getByTestId('single-agent-mode')).toHaveStyle('background-color: rgba(43, 255, 198, 0.1)');
    expect(screen.getByTestId('multi-agent-mode')).not.toHaveStyle('background-color: rgba(43, 255, 198, 0.1)');
    
    // Check if single agent steps are rendered
    expect(screen.getByTestId('step-input')).toBeInTheDocument();
    expect(screen.getByTestId('step-analysis')).toBeInTheDocument();
    expect(screen.getByTestId('step-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('step-deploy')).toBeInTheDocument();
    
    // Check if first step is active
    expect(screen.getByTestId('step-input')).toHaveStyle('color: rgb(43, 255, 198)');
    
    // Check if agent input step is rendered
    expect(screen.getByTestId('agent-input-step')).toBeInTheDocument();
    expect(screen.getByTestId('agent-input-step')).toHaveTextContent('(Single)');
  });

  it('switches to multi-agent mode when toggle is clicked', () => {
    render(<AgentWizard />);
    
    // Click multi-agent mode toggle
    fireEvent.click(screen.getByTestId('multi-agent-mode'));
    
    // Check if mode toggles are updated
    expect(screen.getByTestId('single-agent-mode')).not.toHaveStyle('background-color: rgba(43, 255, 198, 0.1)');
    expect(screen.getByTestId('multi-agent-mode')).toHaveStyle('background-color: rgba(43, 255, 198, 0.1)');
    
    // Check if multi-agent steps are rendered
    expect(screen.getByTestId('step-input')).toBeInTheDocument();
    expect(screen.getByTestId('step-analysis')).toBeInTheDocument();
    expect(screen.getByTestId('step-multi-config')).toBeInTheDocument();
    expect(screen.getByTestId('step-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('step-deploy')).toBeInTheDocument();
    
    // Check if agent input step is rendered with multi-agent flag
    expect(screen.getByTestId('agent-input-step')).toBeInTheDocument();
    expect(screen.getByTestId('agent-input-step')).toHaveTextContent('(Multi)');
    
    // Check if Observer was notified
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('multi-agent mode'));
  });

  it('navigates through steps in single agent mode', () => {
    (useDashboard as jest.Mock).mockReturnValue({
      currentStep: 0,
      setCurrentStep: mockSetCurrentStep,
      loading: false,
      error: null
    });
    
    render(<AgentWizard />);
    
    // Click next button in agent input step
    fireEvent.click(screen.getByText('Next'));
    
    // Check if setCurrentStep was called with next step
    expect(mockSetCurrentStep).toHaveBeenCalledWith(1);
    
    // Update current step to 1
    (useDashboard as jest.Mock).mockReturnValue({
      currentStep: 1,
      setCurrentStep: mockSetCurrentStep,
      loading: false,
      error: null
    });
    
    render(<AgentWizard />);
    
    // Check if analysis step is rendered
    expect(screen.getByTestId('analysis-step')).toBeInTheDocument();
    
    // Click next button in analysis step
    fireEvent.click(screen.getByText('Next'));
    
    // Check if setCurrentStep was called with next step
    expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
  });

  it('navigates through steps in multi-agent mode', () => {
    (useDashboard as jest.Mock).mockReturnValue({
      currentStep: 0,
      setCurrentStep: mockSetCurrentStep,
      loading: false,
      error: null
    });
    
    render(<AgentWizard />);
    
    // Switch to multi-agent mode
    fireEvent.click(screen.getByTestId('multi-agent-mode'));
    
    // Click next button in agent input step
    fireEvent.click(screen.getByText('Next'));
    
    // Check if setCurrentStep was called with next step
    expect(mockSetCurrentStep).toHaveBeenCalledWith(1);
    
    // Update current step to 1
    (useDashboard as jest.Mock).mockReturnValue({
      currentStep: 1,
      setCurrentStep: mockSetCurrentStep,
      loading: false,
      error: null
    });
    
    render(<AgentWizard />);
    
    // Switch to multi-agent mode
    fireEvent.click(screen.getByTestId('multi-agent-mode'));
    
    // Check if analysis step is rendered
    expect(screen.getByTestId('analysis-step')).toBeInTheDocument();
    
    // Click next button in analysis step
    fireEvent.click(screen.getByText('Next'));
    
    // Check if setCurrentStep was called with next step
    expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
  });

  it('displays error message when error is present', () => {
    (useDashboard as jest.Mock).mockReturnValue({
      currentStep: 0,
      setCurrentStep: mockSetCurrentStep,
      loading: false,
      error: 'Test error message'
    });
    
    render(<AgentWizard />);
    
    // Check if error message is displayed
    expect(screen.getByTestId('wizard-error')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-error')).toHaveTextContent('Test error message');
  });

  it('displays loading spinner when loading', () => {
    (useDashboard as jest.Mock).mockReturnValue({
      currentStep: 0,
      setCurrentStep: mockSetCurrentStep,
      loading: true,
      error: null
    });
    
    render(<AgentWizard />);
    
    // Check if loading spinner is displayed
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Check if step content is not displayed
    expect(screen.queryByTestId('agent-input-step')).not.toBeInTheDocument();
  });

  it('notifies Observer when step changes', () => {
    const { rerender } = render(<AgentWizard />);
    
    // Check if Observer was notified for initial step
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('Let\'s start by providing details'));
    
    // Update current step to 1
    (useDashboard as jest.Mock).mockReturnValue({
      currentStep: 1,
      setCurrentStep: mockSetCurrentStep,
      loading: false,
      error: null
    });
    
    rerender(<AgentWizard />);
    
    // Check if Observer was notified for new step
    expect(notifyObserver).toHaveBeenCalledWith('info', expect.stringContaining('Now we\'ll analyze your agent'));
  });
});
