import React from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useObserver } from '../components/observer/ObserverContext';
import { notifyObserver } from '../components/observer/ObserverAgent';
import { Tooltip } from '../components/common/Tooltip';

// Types
interface OnboardingGuidedStepsProps {
  className?: string;
}

interface StepContent {
  title: string;
  description: string;
  content: React.ReactNode;
}

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 32px;
  color: #FFFFFF;
  margin: 0 0 16px 0;
`;

const Description = styled.p`
  font-size: 18px;
  color: #B0B8C4;
  margin: 0;
  line-height: 1.6;
`;

const StepContainer = styled.div`
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 8px;
  padding: 32px;
  margin-bottom: 32px;
`;

const StepContent = styled.div`
  margin-bottom: 32px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: #2A3343;
  border-radius: 4px;
  margin-bottom: 32px;
  overflow: hidden;
`;

const Progress = styled.div<{ percent: number }>`
  height: 100%;
  width: ${props => props.percent}%;
  background-color: #2BFFC6;
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
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

const InteractiveElement = styled.div`
  margin: 24px 0;
  padding: 16px;
  background-color: #0D1117;
  border: 1px solid #2A3343;
  border-radius: 8px;
`;

const QuizContainer = styled.div`
  margin: 24px 0;
`;

const QuizQuestion = styled.div`
  font-size: 18px;
  color: #FFFFFF;
  margin-bottom: 16px;
`;

const QuizOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const QuizOption = styled.div<{ selected: boolean; correct?: boolean; showResult: boolean }>`
  padding: 12px 16px;
  border-radius: 4px;
  border: 1px solid ${props => {
    if (props.showResult) {
      return props.correct ? '#2BFFC6' : props.selected ? '#FF4C4C' : '#2A3343';
    }
    return props.selected ? '#2BFFC6' : '#2A3343';
  }};
  background-color: ${props => {
    if (props.showResult) {
      return props.correct ? 'rgba(43, 255, 198, 0.1)' : props.selected ? 'rgba(255, 76, 76, 0.1)' : 'transparent';
    }
    return props.selected ? 'rgba(43, 255, 198, 0.1)' : 'transparent';
  }};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.showResult ? 'transparent' : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const QuizFeedback = styled.div<{ correct: boolean }>`
  margin-top: 16px;
  padding: 12px;
  border-radius: 4px;
  background-color: ${props => props.correct ? 'rgba(43, 255, 198, 0.1)' : 'rgba(255, 76, 76, 0.1)'};
  border: 1px solid ${props => props.correct ? '#2BFFC6' : '#FF4C4C'};
  color: ${props => props.correct ? '#2BFFC6' : '#FF4C4C'};
`;

/**
 * OnboardingGuidedSteps Component
 * 
 * Guided steps for the onboarding flow, with interactive elements and quizzes.
 * 
 * @param {OnboardingGuidedStepsProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const OnboardingGuidedSteps: React.FC<OnboardingGuidedStepsProps> = ({
  className
}) => {
  // Hooks
  const { stepId } = useParams<{ stepId: string }>();
  const navigate = useNavigate();
  const { addMemoryItem, addExplainedConcept, logPresence } = useObserver();
  
  // State
  const [currentStep, setCurrentStep] = React.useState(1);
  const [totalSteps, setTotalSteps] = React.useState(5);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [showQuizResult, setShowQuizResult] = React.useState(false);
  const [quizCorrect, setQuizCorrect] = React.useState(false);
  
  // Effect to notify Observer on step load
  React.useEffect(() => {
    // Log Observer presence on this page
    logPresence('OnboardingGuidedSteps', true, 'onboarding route');
    
    // Set current step based on URL parameter
    if (stepId) {
      const step = parseInt(stepId);
      if (!isNaN(step)) {
        setCurrentStep(step);
      }
    }
    
    // Notify Observer based on step
    switch (currentStep) {
      case 1:
        notifyObserver('info', 'Let\'s start by understanding what governance means in the context of AI agents.');
        break;
      case 2:
        notifyObserver('info', 'Now let\'s explore how to wrap an agent with governance controls.');
        break;
      case 3:
        notifyObserver('info', 'Let\'s learn about trust scores and how they help measure agent compliance.');
        addExplainedConcept('trust score');
        break;
      case 4:
        notifyObserver('info', 'Now let\'s see how the Observer helps with governance and transparency.');
        break;
      case 5:
        notifyObserver('info', 'Finally, let\'s review what you\'ve learned and check your understanding.');
        break;
    }
    
    addMemoryItem(`Viewed onboarding step ${currentStep}`);
  }, [currentStep, stepId]);
  
  // Get step content based on current step
  const getStepContent = (): StepContent => {
    switch (currentStep) {
      case 1:
        return {
          title: 'Understanding AI Governance',
          description: 'Learn the basics of AI governance and why it matters.',
          content: (
            <>
              <p>AI governance refers to the frameworks, policies, and mechanisms that ensure AI systems operate safely, ethically, and in alignment with human values.</p>
              
              <InteractiveElement>
                <h3>Key Governance Components:</h3>
                <ul>
                  <li><strong>Vigil:</strong> Monitors agent behavior in real-time</li>
                  <li><strong>Prism:</strong> Analyzes and interprets agent actions</li>
                  <li><strong>Critic:</strong> Evaluates compliance with governance rules</li>
                </ul>
              </InteractiveElement>
              
              <p>These components work together to ensure your agents operate within defined boundaries and maintain alignment with your organization's values and requirements.</p>
            </>
          )
        };
      case 2:
        return {
          title: 'Wrapping Agents with Governance',
          description: 'Learn how to add governance controls to your agents.',
          content: (
            <>
              <p>Agent wrapping is the process of adding governance controls to an existing AI agent without modifying its core functionality.</p>
              
              <InteractiveElement>
                <h3>Agent Wrapping Process:</h3>
                <ol>
                  <li>Select the agent to wrap</li>
                  <li>Define governance rules and boundaries</li>
                  <li>Configure monitoring and intervention settings</li>
                  <li>Test the wrapped agent in a sandbox environment</li>
                  <li>Deploy the governed agent to production</li>
                </ol>
              </InteractiveElement>
              
              <p>Promethios makes this process simple with the Agent Wrapping Wizard, which guides you through each step.</p>
            </>
          )
        };
      case 3:
        return {
          title: 'Understanding Trust Scores',
          description: 'Learn how trust scores help measure agent compliance.',
          content: (
            <>
              <p>Trust scores provide a quantitative measure of how well an agent adheres to its governance rules and boundaries.</p>
              
              <InteractiveElement>
                <h3>Trust Score Components:</h3>
                <ul>
                  <li><strong>Compliance:</strong> Adherence to defined rules (40%)</li>
                  <li><strong>Consistency:</strong> Reliability of behavior over time (30%)</li>
                  <li><strong>Transparency:</strong> Explainability of actions (20%)</li>
                  <li><strong>Adaptability:</strong> Response to feedback (10%)</li>
                </ul>
              </InteractiveElement>
              
              <QuizContainer>
                <QuizQuestion>What is the primary purpose of a trust score?</QuizQuestion>
                <QuizOptions>
                  <QuizOption 
                    selected={selectedOption === 'a'}
                    correct={true}
                    showResult={showQuizResult}
                    onClick={() => !showQuizResult && setSelectedOption('a')}
                  >
                    To measure how well an agent adheres to governance rules
                  </QuizOption>
                  <QuizOption 
                    selected={selectedOption === 'b'}
                    correct={false}
                    showResult={showQuizResult}
                    onClick={() => !showQuizResult && setSelectedOption('b')}
                  >
                    To evaluate the technical performance of an agent
                  </QuizOption>
                  <QuizOption 
                    selected={selectedOption === 'c'}
                    correct={false}
                    showResult={showQuizResult}
                    onClick={() => !showQuizResult && setSelectedOption('c')}
                  >
                    To rank agents against each other
                  </QuizOption>
                </QuizOptions>
                
                {!showQuizResult && selectedOption && (
                  <Button 
                    primary 
                    onClick={() => {
                      setShowQuizResult(true);
                      setQuizCorrect(selectedOption === 'a');
                      addMemoryItem(`Answered trust score quiz ${selectedOption === 'a' ? 'correctly' : 'incorrectly'}`);
                      
                      if (selectedOption === 'a') {
                        notifyObserver('success', 'Correct! Trust scores primarily measure governance adherence, not technical performance or competitive ranking.');
                      } else {
                        notifyObserver('info', 'Not quite. Trust scores primarily measure how well an agent adheres to its governance rules, not its technical performance or ranking.');
                      }
                    }}
                    style={{ marginTop: '16px' }}
                  >
                    Check Answer
                  </Button>
                )}
                
                {showQuizResult && (
                  <QuizFeedback correct={quizCorrect}>
                    {quizCorrect 
                      ? 'Correct! Trust scores primarily measure governance adherence, not technical performance or competitive ranking.' 
                      : 'Not quite. Trust scores primarily measure how well an agent adheres to its governance rules, not its technical performance or ranking.'}
                  </QuizFeedback>
                )}
              </QuizContainer>
            </>
          )
        };
      case 4:
        return {
          title: 'Meet Your Observer',
          description: 'Learn how the Observer helps with governance and transparency.',
          content: (
            <>
              <p>The Observer is your governance companion, providing context, explanations, and guidance throughout your Promethios experience.</p>
              
              <InteractiveElement>
                <h3>Observer Capabilities:</h3>
                <ul>
                  <li><strong>Contextual Guidance:</strong> Provides relevant information based on your current task</li>
                  <li><strong>Governance Explanations:</strong> Clarifies why governance decisions were made</li>
                  <li><strong>Memory:</strong> Remembers your preferences and past interactions</li>
                  <li><strong>Expertise Levels:</strong> Adapts guidance based on your experience level</li>
                </ul>
              </InteractiveElement>
              
              <Tooltip
                content="I'll remember your preferences to provide better guidance in the future."
                placement="top"
              >
                <div style={{ marginTop: '24px' }}>
                  <h3>Set Your Observer Preferences:</h3>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px' }}>
                      Expertise Level:
                      <select style={{ marginLeft: '8px', padding: '4px' }}>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px' }}>
                      Guidance Mode:
                      <select style={{ marginLeft: '8px', padding: '4px' }}>
                        <option value="proactive">Proactive</option>
                        <option value="reactive">Reactive</option>
                      </select>
                    </label>
                  </div>
                </div>
              </Tooltip>
            </>
          )
        };
      case 5:
        return {
          title: 'Review & Practice',
          description: 'Review what you\'ve learned and practice with a sandbox environment.',
          content: (
            <>
              <p>Let's review what you've learned about AI governance and Promethios:</p>
              
              <InteractiveElement>
                <h3>Key Concepts:</h3>
                <ul>
                  <li><strong>AI Governance:</strong> Frameworks and mechanisms to ensure AI systems operate safely and ethically</li>
                  <li><strong>Agent Wrapping:</strong> Adding governance controls to existing agents</li>
                  <li><strong>Trust Scores:</strong> Quantitative measures of agent compliance</li>
                  <li><strong>Observer:</strong> Your governance companion providing guidance and explanations</li>
                </ul>
              </InteractiveElement>
              
              <p>Now you're ready to start using Promethios to govern your AI agents!</p>
              
              <div style={{ marginTop: '24px' }}>
                <h3>Success Checklist:</h3>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>
                    <input type="checkbox" checked readOnly /> Understood AI governance concepts
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>
                    <input type="checkbox" checked readOnly /> Learned about agent wrapping
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>
                    <input type="checkbox" checked readOnly /> Explored trust scores
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>
                    <input type="checkbox" checked readOnly /> Met your Observer
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>
                    <input type="checkbox" checked readOnly /> Completed onboarding
                  </label>
                </div>
              </div>
            </>
          )
        };
      default:
        return {
          title: 'Unknown Step',
          description: 'This step does not exist.',
          content: <p>Please navigate to a valid step.</p>
        };
    }
  };
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      navigate(`/onboarding/guided-steps/${nextStep}`);
      addMemoryItem(`Moved to onboarding step ${nextStep}`);
    } else {
      // Complete onboarding
      addMemoryItem('Completed onboarding');
      notifyObserver('success', 'Congratulations! You\'ve completed the onboarding process. You\'re now ready to use Promethios!');
      
      // In a real implementation, this would save onboarding completion to Firebase
      console.log('Onboarding completed');
      
      // Navigate to dashboard
      navigate('/dashboard');
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      navigate(`/onboarding/guided-steps/${prevStep}`);
      addMemoryItem(`Moved back to onboarding step ${prevStep}`);
    } else {
      // Go back to goal selection
      navigate('/onboarding/goals');
      addMemoryItem('Went back to goal selection');
    }
  };
  
  // Get step content
  const stepContent = getStepContent();
  
  // Calculate progress percentage
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <Container className={className} data-testid="onboarding-guided-steps">
      <Header>
        <Title>{stepContent.title}</Title>
        <Description>{stepContent.description}</Description>
      </Header>
      
      <ProgressBar>
        <Progress percent={progressPercent} />
      </ProgressBar>
      
      <StepContainer>
        <StepContent>
          {stepContent.content}
        </StepContent>
        
        <ButtonContainer>
          <Button 
            onClick={handlePrevious}
            data-testid="previous-button"
          >
            {currentStep === 1 ? 'Back to Goals' : 'Previous'}
          </Button>
          
          <Button 
            primary
            onClick={handleNext}
            disabled={currentStep === 3 && selectedOption && !showQuizResult}
            data-testid="next-button"
          >
            {currentStep < totalSteps ? 'Next' : 'Complete Onboarding'}
          </Button>
        </ButtonContainer>
      </StepContainer>
    </Container>
  );
};

export default OnboardingGuidedSteps;
