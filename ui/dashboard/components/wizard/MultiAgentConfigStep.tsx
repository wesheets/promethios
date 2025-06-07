import React from 'react';
import styled from 'styled-components';
import { useObserver } from '../../components/observer/ObserverContext';
import { notifyObserver } from '../../components/observer/ObserverAgent';

// Types
interface MultiAgentConfigStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface AgentRelationship {
  sourceId: string;
  targetId: string;
  type: 'calls' | 'monitors' | 'delegates' | 'reports';
  description: string;
}

// Styled Components
const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StepHeader = styled.div`
  margin-bottom: 16px;
`;

const StepTitle = styled.h3`
  font-size: 20px;
  color: #FFFFFF;
  margin: 0 0 8px 0;
`;

const StepDescription = styled.p`
  font-size: 14px;
  color: #B0B8C4;
  margin: 0;
  line-height: 1.5;
`;

const AgentsContainer = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
`;

const AgentsList = styled.div`
  flex: 1;
  background-color: #0D1117;
  border: 1px solid #2A3343;
  border-radius: 8px;
  padding: 16px;
`;

const AgentItem = styled.div<{ selected: boolean }>`
  padding: 12px;
  margin-bottom: 8px;
  background-color: ${props => props.selected ? 'rgba(43, 255, 198, 0.1)' : '#1A2233'};
  border: 1px solid ${props => props.selected ? '#2BFFC6' : '#2A3343'};
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.selected ? 'rgba(43, 255, 198, 0.15)' : '#2A3343'};
  }
`;

const AgentName = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

const AgentType = styled.div`
  font-size: 12px;
  color: #B0B8C4;
`;

const RelationshipContainer = styled.div`
  flex: 2;
  background-color: #0D1117;
  border: 1px solid #2A3343;
  border-radius: 8px;
  padding: 16px;
  position: relative;
`;

const RelationshipCanvas = styled.div`
  width: 100%;
  height: 300px;
  position: relative;
  background-color: #1A2233;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;
`;

const AgentNode = styled.div<{ x: number; y: number; selected: boolean }>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  width: 120px;
  padding: 12px;
  background-color: ${props => props.selected ? 'rgba(43, 255, 198, 0.1)' : '#0D1117'};
  border: 1px solid ${props => props.selected ? '#2BFFC6' : '#2A3343'};
  border-radius: 4px;
  text-align: center;
  cursor: move;
  user-select: none;
  z-index: 2;
`;

const RelationshipControls = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const ControlButton = styled.button`
  background-color: #2A3343;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #3A4353;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RelationshipTypeSelect = styled.select`
  background-color: #0D1117;
  color: #FFFFFF;
  border: 1px solid #2A3343;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  
  &:focus {
    outline: 2px solid #2BFFC6;
    outline-offset: 2px;
  }
`;

const RelationshipList = styled.div`
  margin-top: 16px;
`;

const RelationshipItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #1A2233;
  border: 1px solid #2A3343;
  border-radius: 4px;
  margin-bottom: 8px;
`;

const RelationshipInfo = styled.div`
  flex: 1;
`;

const RelationshipSource = styled.span`
  font-weight: bold;
`;

const RelationshipType = styled.span`
  color: #2BFFC6;
  margin: 0 8px;
`;

const RelationshipTarget = styled.span`
  font-weight: bold;
`;

const RelationshipDescription = styled.div`
  font-size: 12px;
  color: #B0B8C4;
  margin-top: 4px;
`;

const RelationshipActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #B0B8C4;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    color: #FFFFFF;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
`;

const BackButton = styled.button`
  background-color: transparent;
  color: #FFFFFF;
  border: 1px solid #2A3343;
  border-radius: 4px;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const NextButton = styled.button`
  background-color: #2BFFC6;
  color: #0D1117;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  
  &:hover {
    background-color: #22D6A7;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * MultiAgentConfigStep Component
 * 
 * Step for configuring relationships between multiple agents in the Agent Wrapping Wizard.
 * Allows users to define how agents interact with each other.
 * 
 * @param {MultiAgentConfigStepProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const MultiAgentConfigStep: React.FC<MultiAgentConfigStepProps> = ({
  onNext,
  onBack
}) => {
  // Observer context
  const { addMemoryItem } = useObserver();
  
  // Mock data for demonstration
  const mockAgents = [
    { id: 'agent1', name: 'Customer Service Agent', type: 'LLM-based' },
    { id: 'agent2', name: 'Knowledge Base Agent', type: 'Retrieval-based' },
    { id: 'agent3', name: 'Transaction Agent', type: 'Rule-based' },
    { id: 'agent4', name: 'Supervisor Agent', type: 'LLM-based' }
  ];
  
  // State
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = React.useState<string | null>(null);
  const [relationshipType, setRelationshipType] = React.useState<'calls' | 'monitors' | 'delegates' | 'reports'>('calls');
  const [relationships, setRelationships] = React.useState<AgentRelationship[]>([
    { 
      sourceId: 'agent1', 
      targetId: 'agent2', 
      type: 'calls', 
      description: 'Customer Service Agent calls Knowledge Base Agent to retrieve information' 
    },
    { 
      sourceId: 'agent4', 
      targetId: 'agent1', 
      type: 'monitors', 
      description: 'Supervisor Agent monitors Customer Service Agent for quality assurance' 
    }
  ]);
  
  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    setSelectedTarget(null);
    
    // Notify Observer
    notifyObserver('info', `Selected ${mockAgents.find(a => a.id === agentId)?.name}. Now select a target agent to create a relationship.`);
  };
  
  // Handle target selection
  const handleTargetSelect = (agentId: string) => {
    if (agentId === selectedAgent) return;
    setSelectedTarget(agentId);
  };
  
  // Add relationship
  const addRelationship = () => {
    if (!selectedAgent || !selectedTarget) return;
    
    const sourceAgent = mockAgents.find(a => a.id === selectedAgent);
    const targetAgent = mockAgents.find(a => a.id === selectedTarget);
    
    if (!sourceAgent || !targetAgent) return;
    
    const newRelationship: AgentRelationship = {
      sourceId: selectedAgent,
      targetId: selectedTarget,
      type: relationshipType,
      description: `${sourceAgent.name} ${relationshipType} ${targetAgent.name}`
    };
    
    setRelationships([...relationships, newRelationship]);
    
    // Reset selections
    setSelectedTarget(null);
    
    // Add to Observer memory
    addMemoryItem(`Added relationship: ${sourceAgent.name} ${relationshipType} ${targetAgent.name}`);
    
    // Notify Observer
    notifyObserver('info', `Relationship created! ${sourceAgent.name} now ${relationshipType} ${targetAgent.name}.`);
  };
  
  // Remove relationship
  const removeRelationship = (index: number) => {
    const newRelationships = [...relationships];
    newRelationships.splice(index, 1);
    setRelationships(newRelationships);
    
    // Notify Observer
    notifyObserver('info', 'Relationship removed.');
  };
  
  // Handle next button click
  const handleNext = () => {
    // Add to Observer memory
    addMemoryItem(`Configured ${relationships.length} agent relationships`);
    
    // Notify Observer
    notifyObserver('info', `Great! You've configured ${relationships.length} relationships between your agents. Now let's generate the wrapper code.`);
    
    onNext();
  };

  return (
    <StepContainer data-testid="multi-agent-config-step">
      <StepHeader>
        <StepTitle>Multi-Agent Configuration</StepTitle>
        <StepDescription>
          Define how your agents interact with each other. Create relationships between agents to establish a governance hierarchy.
        </StepDescription>
      </StepHeader>
      
      <AgentsContainer>
        <AgentsList>
          <h4>Available Agents</h4>
          {mockAgents.map(agent => (
            <AgentItem 
              key={agent.id}
              selected={agent.id === selectedAgent}
              onClick={() => handleAgentSelect(agent.id)}
              data-testid={`agent-item-${agent.id}`}
            >
              <AgentName>{agent.name}</AgentName>
              <AgentType>{agent.type}</AgentType>
            </AgentItem>
          ))}
        </AgentsList>
        
        <RelationshipContainer>
          <h4>Agent Relationships</h4>
          
          <RelationshipCanvas>
            {mockAgents.map((agent, index) => {
              const x = 100 + (index % 2) * 300;
              const y = 50 + Math.floor(index / 2) * 150;
              
              return (
                <AgentNode 
                  key={agent.id}
                  x={x}
                  y={y}
                  selected={agent.id === selectedAgent || agent.id === selectedTarget}
                  onClick={() => selectedAgent ? handleTargetSelect(agent.id) : handleAgentSelect(agent.id)}
                  data-testid={`agent-node-${agent.id}`}
                >
                  {agent.name}
                </AgentNode>
              );
            })}
            
            {/* SVG for relationship lines would be added here in a production implementation */}
          </RelationshipCanvas>
          
          <RelationshipControls>
            <RelationshipTypeSelect
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value as any)}
              disabled={!selectedAgent || !selectedTarget}
              data-testid="relationship-type-select"
            >
              <option value="calls">Calls</option>
              <option value="monitors">Monitors</option>
              <option value="delegates">Delegates to</option>
              <option value="reports">Reports to</option>
            </RelationshipTypeSelect>
            
            <ControlButton
              onClick={addRelationship}
              disabled={!selectedAgent || !selectedTarget}
              data-testid="add-relationship-button"
            >
              Add Relationship
            </ControlButton>
          </RelationshipControls>
          
          <RelationshipList>
            <h4>Defined Relationships</h4>
            {relationships.map((rel, index) => {
              const sourceAgent = mockAgents.find(a => a.id === rel.sourceId);
              const targetAgent = mockAgents.find(a => a.id === rel.targetId);
              
              if (!sourceAgent || !targetAgent) return null;
              
              return (
                <RelationshipItem key={index} data-testid={`relationship-item-${index}`}>
                  <RelationshipInfo>
                    <div>
                      <RelationshipSource>{sourceAgent.name}</RelationshipSource>
                      <RelationshipType>{rel.type}</RelationshipType>
                      <RelationshipTarget>{targetAgent.name}</RelationshipTarget>
                    </div>
                    <RelationshipDescription>{rel.description}</RelationshipDescription>
                  </RelationshipInfo>
                  <RelationshipActions>
                    <ActionButton 
                      onClick={() => removeRelationship(index)}
                      aria-label="Remove relationship"
                      data-testid={`remove-relationship-${index}`}
                    >
                      ✕
                    </ActionButton>
                  </RelationshipActions>
                </RelationshipItem>
              );
            })}
          </RelationshipList>
        </RelationshipContainer>
      </AgentsContainer>
      
      <ButtonContainer>
        <BackButton onClick={onBack} data-testid="back-button">
          Back
        </BackButton>
        <NextButton 
          onClick={handleNext} 
          disabled={relationships.length === 0}
          data-testid="next-button"
        >
          Generate Wrapper Code
        </NextButton>
      </ButtonContainer>
    </StepContainer>
  );
};

export default MultiAgentConfigStep;
