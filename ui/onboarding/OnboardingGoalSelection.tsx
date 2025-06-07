import React from 'react';
import styled from 'styled-components';
import { useObserver } from '../components/observer/ObserverContext';
import { notifyObserver } from '../components/observer/ObserverAgent';
import { Tooltip } from '../components/common/Tooltip';

// Types
interface OnboardingGoalSelectionProps {
  className?: string;
}

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 32px;
  color: #FFFFFF;
  margin: 0 0 16px 0;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #B0B8C4;
  margin: 0 0 40px 0;
  line-height: 1.6;
`;

const GoalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
  margin-bottom: 40px;
`;

const GoalCard = styled.div<{ selected: boolean }>`
  background-color: ${props => props.selected ? '#2A3343' : '#1A2233'};
  border: 1px solid ${props => props.selected ? '#2BFFC6' : '#2A3343'};
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

const GoalIcon = styled.div`
  font-size: 32px;
  margin-bottom: 16px;
  color: #2BFFC6;
`;

const GoalTitle = styled.h3`
  font-size: 20px;
  color: #FFFFFF;
  margin: 0 0 12px 0;
`;

const GoalDescription = styled.p`
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
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
 * OnboardingGoalSelection Component
 * 
 * Second screen of the onboarding flow where users select their primary goal.
 * 
 * @param {OnboardingGoalSelectionProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const OnboardingGoalSelection: React.FC<OnboardingGoalSelectionProps> = ({
  className
}) => {
  // Hooks
  const { addMemoryItem, logPresence } = useObserver();
  const [selectedGoal, setSelectedGoal] = React.useState<string | null>(null);
  
  // Effect to notify Observer on page load
  React.useEffect(() => {
    // Log Observer presence on this page
    logPresence('OnboardingGoalSelection', true, 'onboarding route');
    
    notifyObserver('info', 'Let\'s personalize your experience. What\'s your primary goal with Promethios?');
    addMemoryItem('Viewed onboarding goal selection');
  }, []);
  
  // Goals data
  const goals = [
    {
      id: 'build',
      icon: '🛠️',
      title: 'Build Governed Agents',
      description: 'I want to create AI agents with built-in governance and safety controls.'
    },
    {
      id: 'monitor',
      icon: '📊',
      title: 'Monitor Agent Behavior',
      description: 'I want to track and analyze how my agents are performing and behaving.'
    },
    {
      id: 'collaborate',
      icon: '👥',
      title: 'Collaborate on Governance',
      description: 'I want to work with my team on defining and implementing governance rules.'
    },
    {
      id: 'learn',
      icon: '🎓',
      title: 'Learn About Governance',
      description: 'I want to understand AI governance principles and best practices.'
    }
  ];
  
  // Handle goal selection
  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    addMemoryItem(`Selected "${goalId}" as primary goal`);
    
    // Notify Observer about goal selection
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      notifyObserver('info', `Great choice! I'll tailor your experience to help you ${goal.title.toLowerCase()}.`);
    }
  };
  
  // Handle continue
  const handleContinue = () => {
    if (selectedGoal) {
      addMemoryItem(`Continued with "${selectedGoal}" goal`);
      
      // In a real implementation, this would save the goal to Firebase
      console.log('Selected goal:', selectedGoal);
      
      // Navigate to next step
      window.location.href = '/onboarding/guided-steps/1';
    }
  };
  
  // Handle back
  const handleBack = () => {
    addMemoryItem('Went back from goal selection');
    window.location.href = '/onboarding/welcome';
  };
  
  // Render goal card
  const renderGoalCard = (goal: any) => (
    <Tooltip
      content="I'll remember your goal to provide personalized guidance throughout your journey."
      placement="top"
    >
      <GoalCard 
        key={goal.id} 
        selected={selectedGoal === goal.id}
        onClick={() => handleGoalSelect(goal.id)}
        data-testid={`goal-${goal.id}`}
      >
        <GoalIcon>{goal.icon}</GoalIcon>
        <GoalTitle>{goal.title}</GoalTitle>
        <GoalDescription>{goal.description}</GoalDescription>
      </GoalCard>
    </Tooltip>
  );

  return (
    <Container className={className} data-testid="onboarding-goal-selection">
      <Title>What's your primary goal?</Title>
      <Subtitle>
        This will help me personalize your experience and provide relevant guidance.
      </Subtitle>
      
      <GoalsGrid>
        {goals.map(renderGoalCard)}
      </GoalsGrid>
      
      <ButtonContainer>
        <SecondaryButton 
          onClick={handleBack}
          data-testid="back-button"
        >
          Back
        </SecondaryButton>
        <PrimaryButton 
          onClick={handleContinue}
          disabled={!selectedGoal}
          data-testid="continue-button"
        >
          Continue
        </PrimaryButton>
      </ButtonContainer>
    </Container>
  );
};

export default OnboardingGoalSelection;
