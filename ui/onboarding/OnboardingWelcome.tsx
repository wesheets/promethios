import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useObserver } from '../components/observer/ObserverContext';
import { notifyObserver } from '../components/observer/ObserverAgent';

// Types
interface OnboardingWelcomeProps {
  className?: string;
}

// Styled Components
const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
`;

const Logo = styled.div`
  font-size: 48px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 36px;
  color: #FFFFFF;
  margin: 0 0 16px 0;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #B0B8C4;
  margin: 0 0 40px 0;
  line-height: 1.6;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
  margin-bottom: 40px;
`;

const Card = styled.div`
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 8px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #2A3343;
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
`;

const CardIcon = styled.div`
  font-size: 32px;
  margin-bottom: 16px;
  color: #2BFFC6;
`;

const CardTitle = styled.h3`
  font-size: 20px;
  color: #FFFFFF;
  margin: 0 0 12px 0;
`;

const CardDescription = styled.p`
  font-size: 14px;
  color: #B0B8C4;
  margin: 0;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
`;

const PrimaryButton = styled.button`
  background-color: #2BFFC6;
  color: #0D1117;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #22D6A7;
  }
`;

const SecondaryButton = styled.button`
  background-color: transparent;
  color: #FFFFFF;
  border: 1px solid #2A3343;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

/**
 * OnboardingWelcome Component
 * 
 * First screen of the onboarding flow, similar to LangSmith's "How would you like to start?" page.
 * Presents users with different starting options based on their goals.
 * 
 * @param {OnboardingWelcomeProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({
  className
}) => {
  // Hooks
  const navigate = useNavigate();
  const { addMemoryItem } = useObserver();
  
  // Effect to notify Observer on welcome screen load
  React.useEffect(() => {
    notifyObserver('info', 'Welcome to Promethios! I\'m your Observer agent, and I\'ll guide you through getting started. How would you like to begin?');
    addMemoryItem('Started onboarding flow');
  }, []);
  
  // Options for getting started
  const startOptions = [
    {
      id: 'wrap-agent',
      icon: '🤖',
      title: 'Wrap Your First Agent',
      description: 'Learn how to add governance to an existing AI agent and monitor its behavior.'
    },
    {
      id: 'multi-agent',
      icon: '🔄',
      title: 'Configure Multi-Agent System',
      description: 'Set up governance for multiple agents working together in a system.'
    },
    {
      id: 'explore-governance',
      icon: '📊',
      title: 'Explore Governance',
      description: 'Understand how Promethios governance works and explore metrics and visualizations.'
    },
    {
      id: 'learn-observer',
      icon: '👁️',
      title: 'Meet Your Observer',
      description: 'Learn about the Observer agent and how it helps with governance and transparency.'
    }
  ];
  
  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    addMemoryItem(`Selected "${optionId}" onboarding path`);
    
    // Navigate to appropriate guided step based on selection
    navigate(`/onboarding/guided-steps/${optionId}`);
    
    // Notify Observer
    switch (optionId) {
      case 'wrap-agent':
        notifyObserver('info', 'Great choice! I\'ll guide you through wrapping your first agent with governance controls.');
        break;
      case 'multi-agent':
        notifyObserver('info', 'Excellent! Let\'s explore how to configure governance for multiple agents working together.');
        break;
      case 'explore-governance':
        notifyObserver('info', 'Perfect! I\'ll show you how Promethios governance works and how to interpret the metrics.');
        break;
      case 'learn-observer':
        notifyObserver('info', 'I\'m glad you want to learn more about me! I\'ll explain how I can help you with governance and transparency.');
        break;
    }
  };
  
  // Handle skip onboarding
  const handleSkip = () => {
    addMemoryItem('Skipped onboarding');
    notifyObserver('info', 'You\'ve skipped the onboarding for now. You can always access it later from the dashboard or settings.');
    navigate('/dashboard');
  };
  
  // Render option card
  const renderOptionCard = (option: any) => (
    <Card 
      key={option.id} 
      onClick={() => handleOptionSelect(option.id)}
      data-testid={`option-${option.id}`}
    >
      <CardIcon>{option.icon}</CardIcon>
      <CardTitle>{option.title}</CardTitle>
      <CardDescription>{option.description}</CardDescription>
    </Card>
  );

  return (
    <WelcomeContainer className={className} data-testid="onboarding-welcome">
      <Logo>P</Logo>
      <Title>How would you like to start?</Title>
      <Subtitle>
        Select a workflow to begin exploring Promethios' capabilities.
        I'll guide you through each step of the process.
      </Subtitle>
      
      <CardGrid>
        {startOptions.map(renderOptionCard)}
      </CardGrid>
      
      <ButtonContainer>
        <PrimaryButton 
          onClick={() => handleOptionSelect('wrap-agent')}
          data-testid="get-started-button"
        >
          Get Started
        </PrimaryButton>
        <SecondaryButton 
          onClick={handleSkip}
          data-testid="skip-button"
        >
          Skip for now
        </SecondaryButton>
      </ButtonContainer>
    </WelcomeContainer>
  );
};

export default OnboardingWelcome;
