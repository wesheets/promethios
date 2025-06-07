import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useObserver } from '../components/observer/ObserverContext';
import { notifyObserver } from '../components/observer/ObserverAgent';
import { Tooltip } from '../components/common/Tooltip';

// Types
interface DashboardProps {
  className?: string;
}

// Styled Components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

// Dashboard Component Implementation
const Dashboard: React.FC<DashboardProps> = ({ className }) => {
  const navigate = useNavigate();
  const { 
    addMemoryItem, 
    explainedConcepts, 
    addExplainedConcept,
    logPresence 
  } = useObserver();
  
  // Effect to notify Observer on dashboard load and check for skipped onboarding
  useEffect(() => {
    // Log Observer presence on this page
    logPresence('Dashboard', true, 'governance-relevant route');
    
    // Welcome message
    notifyObserver('info', 'Welcome to your dashboard! Here you can see your governance metrics, recent activity, and quick actions to get started.');
    
    // Add to Observer memory
    addMemoryItem('Viewed dashboard');
    
    // Check if user skipped onboarding and hasn't learned about trust scores
    if (!explainedConcepts.includes('trust score')) {
      notifyObserver('info', 'You skipped onboarding, but we can still walk through key concepts. Want to start with trust scores?');
      // Don't mark as explained yet - wait for user interaction
    }
  }, []);
  
  // Handle quick action with memory confirmation
  const handleQuickAction = (action: string, destination: string) => {
    addMemoryItem(`Clicked "${action}" quick action`);
    navigate(destination);
  };

  return (
    <DashboardContainer className={className} data-testid="dashboard">
      {/* Dashboard content with tooltips for memory confirmation */}
      <Tooltip 
        content="Wrap a new agent with governance. I'll remember this choice for later context."
        placement="top"
      >
        <button 
          onClick={() => handleQuickAction('Wrap New Agent', '/agent-wizard')}
          data-testid="wrap-agent-button"
        >
          Wrap New Agent
        </button>
      </Tooltip>
      
      {/* Additional dashboard content would go here */}
    </DashboardContainer>
  );
};

export default Dashboard;
