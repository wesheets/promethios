import React from 'react';
import styled from 'styled-components';
import { useObserver } from '../components/observer/ObserverContext';
import { notifyObserver } from '../components/observer/ObserverAgent';
import { Tooltip } from '../components/common/Tooltip';

// Types
interface MultiAgentPageProps {
  className?: string;
}

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  color: #FFFFFF;
  margin: 0;
`;

const PageDescription = styled.p`
  font-size: 16px;
  color: #B0B8C4;
  margin: 8px 0 0 0;
`;

const ConfigContainer = styled.div`
  display: flex;
  gap: 24px;
`;

const AgentsList = styled.div`
  width: 300px;
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 8px;
  padding: 16px;
`;

const AgentsListTitle = styled.h3`
  font-size: 18px;
  color: #FFFFFF;
  margin: 0 0 16px 0;
`;

const AgentItem = styled.div<{ selected: boolean }>`
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: ${props => props.selected ? '#2A3343' : 'transparent'};
  border: 1px solid ${props => props.selected ? '#2BFFC6' : '#2A3343'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #2A3343;
  }
`;

const AgentName = styled.div`
  font-size: 16px;
  color: #FFFFFF;
  margin-bottom: 4px;
`;

const AgentType = styled.div`
  font-size: 12px;
  color: #B0B8C4;
`;

const RelationshipEditor = styled.div`
  flex: 1;
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 8px;
  padding: 16px;
  min-height: 500px;
`;

const EditorTitle = styled.h3`
  font-size: 18px;
  color: #FFFFFF;
  margin: 0 0 16px 0;
`;

const EditorDescription = styled.p`
  font-size: 14px;
  color: #B0B8C4;
  margin: 0 0 24px 0;
`;

const EditorCanvas = styled.div`
  background-color: #0D1117;
  border: 1px dashed #2A3343;
  border-radius: 4px;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const CanvasPlaceholder = styled.div`
  color: #B0B8C4;
  font-size: 16px;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
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
`;

/**
 * MultiAgentPage Component
 * 
 * Page for configuring multi-agent systems and their governance relationships.
 * 
 * @param {MultiAgentPageProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const MultiAgentPage: React.FC<MultiAgentPageProps> = ({
  className
}) => {
  // Hooks
  const { addMemoryItem, logPresence } = useObserver();
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);
  
  // Effect to notify Observer on page load
  React.useEffect(() => {
    // Log Observer presence on this page
    logPresence('MultiAgentPage', true, 'governance-relevant route');
    
    notifyObserver('info', 'Welcome to the Multi-Agent Configuration page! Here you can define governance relationships between your agents.');
    addMemoryItem('Viewed multi-agent configuration page');
  }, []);
  
  // Mock agents data
  const agents = [
    {
      id: 'agent1',
      name: 'Customer Service Agent',
      type: 'LLM Agent'
    },
    {
      id: 'agent2',
      name: 'Knowledge Base Agent',
      type: 'Custom Agent'
    },
    {
      id: 'agent3',
      name: 'Transaction Agent',
      type: 'API-based Agent'
    },
    {
      id: 'agent4',
      name: 'Data Analysis Agent',
      type: 'LLM Agent'
    }
  ];
  
  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    addMemoryItem(`Selected agent ${agentId} in multi-agent configuration`);
    
    // Notify Observer about agent selection
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      notifyObserver('info', `You've selected ${agent.name}. Now you can define its governance relationships with other agents.`);
    }
  };
  
  // Handle save configuration
  const handleSaveConfiguration = () => {
    addMemoryItem('Saved multi-agent configuration');
    notifyObserver('success', 'Multi-agent configuration saved successfully!');
  };
  
  // Render agent item
  const renderAgentItem = (agent: any) => (
    <Tooltip
      content="I'll remember which agents you configure together to provide better governance recommendations."
      placement="right"
    >
      <AgentItem 
        key={agent.id} 
        selected={selectedAgent === agent.id}
        onClick={() => handleAgentSelect(agent.id)}
        data-testid={`agent-${agent.id}`}
      >
        <AgentName>{agent.name}</AgentName>
        <AgentType>{agent.type}</AgentType>
      </AgentItem>
    </Tooltip>
  );

  return (
    <PageContainer className={className} data-testid="multi-agent-page">
      <PageHeader>
        <div>
          <PageTitle>Multi-Agent Configuration</PageTitle>
          <PageDescription>Define governance relationships between your agents</PageDescription>
        </div>
      </PageHeader>
      
      <ConfigContainer>
        <AgentsList>
          <AgentsListTitle>Your Agents</AgentsListTitle>
          {agents.map(renderAgentItem)}
        </AgentsList>
        
        <RelationshipEditor>
          <EditorTitle>Governance Relationship Editor</EditorTitle>
          <EditorDescription>
            Define how your agents interact and govern each other by creating connections between them.
          </EditorDescription>
          
          <EditorCanvas>
            {selectedAgent ? (
              <CanvasPlaceholder>
                Relationship editor for {agents.find(a => a.id === selectedAgent)?.name}
              </CanvasPlaceholder>
            ) : (
              <CanvasPlaceholder>
                Select an agent from the list to start defining relationships
              </CanvasPlaceholder>
            )}
          </EditorCanvas>
        </RelationshipEditor>
      </ConfigContainer>
      
      <ButtonContainer>
        <Button data-testid="cancel-button">
          Cancel
        </Button>
        <Button 
          primary
          onClick={handleSaveConfiguration}
          data-testid="save-button"
        >
          Save Configuration
        </Button>
      </ButtonContainer>
    </PageContainer>
  );
};

export default MultiAgentPage;
