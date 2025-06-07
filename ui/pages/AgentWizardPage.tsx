import React from 'react';
import styled from 'styled-components';
import { useObserver } from '../components/observer/ObserverContext';
import { notifyObserver } from '../components/observer/ObserverAgent';
import { Tooltip } from '../components/common/Tooltip';

// Types
interface AgentWizardPageProps {
  className?: string;
}

// Styled Components
const WizardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const WizardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const WizardTitle = styled.h1`
  font-size: 28px;
  color: #FFFFFF;
  margin: 0;
`;

const WizardDescription = styled.p`
  font-size: 16px;
  color: #B0B8C4;
  margin: 8px 0 0 0;
`;

const StepsContainer = styled.div`
  display: flex;
  margin-bottom: 24px;
`;

const Step = styled.div<{ active: boolean; completed: boolean }>`
  display: flex;
  align-items: center;
  margin-right: 24px;
  
  &:last-child {
    margin-right: 0;
  }
`;

const StepNumber = styled.div<{ active: boolean; completed: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 8px;
  background-color: ${props => {
    if (props.completed) return '#2BFFC6';
    if (props.active) return '#2A3343';
    return '#1A2233';
  }};
  color: ${props => {
    if (props.completed) return '#0D1117';
    if (props.active) return '#FFFFFF';
    return '#B0B8C4';
  }};
  border: 1px solid ${props => {
    if (props.completed) return '#2BFFC6';
    if (props.active) return '#2BFFC6';
    return '#2A3343';
  }};
`;

const StepLabel = styled.div<{ active: boolean; completed: boolean }>`
  font-size: 14px;
  color: ${props => {
    if (props.completed || props.active) return '#FFFFFF';
    return '#B0B8C4';
  }};
`;

const StepContent = styled.div`
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 8px;
  padding: 24px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
`;

const Button = styled.button<{ primary?: boolean }>`
  background-color: ${props => props.primary ? '#2BFFC6' : 'transparent'};
  color: ${props => props.primary ? '#0D1117' : '#FFFFFF'};
  border: ${props => props.primary ? 'none' : '1px solid #2A3343'};
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.primary ? '#22D6A7' : 'rgba(255, 255, 255, 0.05)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * AgentWizardPage Component
 * 
 * Wizard for wrapping agents with governance.
 * 
 * @param {AgentWizardPageProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const AgentWizardPage: React.FC<AgentWizardPageProps> = ({
  className
}) => {
  // Hooks
  const { addMemoryItem, logPresence } = useObserver();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [agentType, setAgentType] = React.useState('');
  const [agentName, setAgentName] = React.useState('');
  const [governanceLevel, setGovernanceLevel] = React.useState('');
  
  // Effect to notify Observer on wizard load
  React.useEffect(() => {
    // Log Observer presence on this page
    logPresence('AgentWizard', true, 'governance-relevant route');
    
    notifyObserver('info', 'Welcome to the Agent Wrapping Wizard! I\'ll guide you through the process of adding governance to your agent.');
    addMemoryItem('Started agent wrapping wizard');
  }, []);
  
  // Steps configuration
  const steps = [
    {
      number: 1,
      label: 'Agent Type',
      content: (
        <div>
          <h3>Select Agent Type</h3>
          <p>Choose the type of agent you want to wrap with governance.</p>
          
          <Tooltip
            content="I'll remember your agent type preference for future recommendations."
            placement="top"
          >
            <div>
              <label>
                <input
                  type="radio"
                  name="agentType"
                  value="llm"
                  checked={agentType === 'llm'}
                  onChange={() => setAgentType('llm')}
                />
                LLM Agent
              </label>
            </div>
          </Tooltip>
          
          <div>
            <label>
              <input
                type="radio"
                name="agentType"
                value="custom"
                checked={agentType === 'custom'}
                onChange={() => setAgentType('custom')}
              />
              Custom Agent
            </label>
          </div>
          
          <div>
            <label>
              <input
                type="radio"
                name="agentType"
                value="api"
                checked={agentType === 'api'}
                onChange={() => setAgentType('api')}
              />
              API-based Agent
            </label>
          </div>
        </div>
      )
    },
    {
      number: 2,
      label: 'Agent Details',
      content: (
        <div>
          <h3>Agent Details</h3>
          <p>Provide details about your agent.</p>
          
          <div>
            <label>
              Agent Name:
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Enter agent name"
              />
            </label>
          </div>
          
          {/* Additional agent details fields would go here */}
        </div>
      )
    },
    {
      number: 3,
      label: 'Governance Level',
      content: (
        <div>
          <h3>Governance Level</h3>
          <p>Select the level of governance to apply to your agent.</p>
          
          <Tooltip
            content="I'll track your governance preferences to provide tailored recommendations."
            placement="top"
          >
            <div>
              <label>
                <input
                  type="radio"
                  name="governanceLevel"
                  value="basic"
                  checked={governanceLevel === 'basic'}
                  onChange={() => setGovernanceLevel('basic')}
                />
                Basic Governance
              </label>
            </div>
          </Tooltip>
          
          <div>
            <label>
              <input
                type="radio"
                name="governanceLevel"
                value="standard"
                checked={governanceLevel === 'standard'}
                onChange={() => setGovernanceLevel('standard')}
              />
              Standard Governance
            </label>
          </div>
          
          <div>
            <label>
              <input
                type="radio"
                name="governanceLevel"
                value="advanced"
                checked={governanceLevel === 'advanced'}
                onChange={() => setGovernanceLevel('advanced')}
              />
              Advanced Governance
            </label>
          </div>
        </div>
      )
    },
    {
      number: 4,
      label: 'Review & Confirm',
      content: (
        <div>
          <h3>Review & Confirm</h3>
          <p>Review your agent configuration and confirm to complete the wrapping process.</p>
          
          <div>
            <h4>Agent Type:</h4>
            <p>{agentType || 'Not selected'}</p>
          </div>
          
          <div>
            <h4>Agent Name:</h4>
            <p>{agentName || 'Not provided'}</p>
          </div>
          
          <div>
            <h4>Governance Level:</h4>
            <p>{governanceLevel || 'Not selected'}</p>
          </div>
        </div>
      )
    }
  ];
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      addMemoryItem(`Moved to step ${currentStep + 1} in agent wrapping wizard`);
      
      // Notify Observer about step change
      switch (currentStep + 1) {
        case 2:
          notifyObserver('info', 'Now let\'s provide some details about your agent.');
          break;
        case 3:
          notifyObserver('info', 'Next, choose the level of governance to apply to your agent.');
          break;
        case 4:
          notifyObserver('info', 'Finally, review your configuration and confirm to complete the wrapping process.');
          break;
      }
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      addMemoryItem(`Moved back to step ${currentStep - 1} in agent wrapping wizard`);
    }
  };
  
  // Handle submit
  const handleSubmit = () => {
    addMemoryItem('Completed agent wrapping wizard');
    notifyObserver('success', 'Congratulations! Your agent has been successfully wrapped with governance.');
    
    // In a real implementation, this would save the agent configuration to Firebase
    console.log('Agent configuration:', {
      type: agentType,
      name: agentName,
      governanceLevel: governanceLevel
    });
    
    // Reset form
    setCurrentStep(1);
    setAgentType('');
    setAgentName('');
    setGovernanceLevel('');
  };
  
  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!agentType;
      case 2:
        return !!agentName;
      case 3:
        return !!governanceLevel;
      default:
        return true;
    }
  };

  return (
    <WizardContainer className={className} data-testid="agent-wizard">
      <WizardHeader>
        <div>
          <WizardTitle>Agent Wrapping Wizard</WizardTitle>
          <WizardDescription>Add governance to your agent in a few simple steps</WizardDescription>
        </div>
      </WizardHeader>
      
      <StepsContainer>
        {steps.map((step) => (
          <Step 
            key={step.number} 
            active={currentStep === step.number}
            completed={currentStep > step.number}
          >
            <StepNumber 
              active={currentStep === step.number}
              completed={currentStep > step.number}
            >
              {currentStep > step.number ? '✓' : step.number}
            </StepNumber>
            <StepLabel 
              active={currentStep === step.number}
              completed={currentStep > step.number}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </StepsContainer>
      
      <StepContent>
        {steps.find(step => step.number === currentStep)?.content}
        
        <ButtonContainer>
          <Button 
            onClick={handlePrevious}
            disabled={currentStep === 1}
            data-testid="previous-button"
          >
            Previous
          </Button>
          
          {currentStep < steps.length ? (
            <Button 
              primary
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
              data-testid="next-button"
            >
              Next
            </Button>
          ) : (
            <Button 
              primary
              onClick={handleSubmit}
              disabled={!isCurrentStepValid()}
              data-testid="submit-button"
            >
              Complete
            </Button>
          )}
        </ButtonContainer>
      </StepContent>
    </WizardContainer>
  );
};

export default AgentWizardPage;
