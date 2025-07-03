/**
 * Agent Input Step component for the Agent Wizard
 * 
 * First step in the agent wrapping wizard for inputting agent details.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import styled from 'styled-components';
import { useDashboard } from '../../context/DashboardContext';

interface AgentInputStepProps {
  onNext: () => void;
  multiAgent?: boolean;
}

// Styled Components
const StepContainer = styled.div`
  background-color: #1A2233;
  border-radius: 8px;
  padding: 24px;
  color: #FFFFFF;
`;

const StepTitle = styled.h3`
  font-size: 20px;
  color: #FFFFFF;
  margin: 0 0 16px 0;
`;

const StepDescription = styled.p`
  font-size: 14px;
  color: #B0B8C4;
  margin: 0 0 24px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
`;

const Input = styled.input`
  background-color: #2A3343;
  border: 1px solid #2A3343;
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 14px;
  color: #FFFFFF;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #2BFFC6;
  }
  
  &::placeholder {
    color: #B0B8C4;
  }
`;

const TextArea = styled.textarea`
  background-color: #2A3343;
  border: 1px solid #2A3343;
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 14px;
  color: #FFFFFF;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  
  &:focus {
    outline: none;
    border-color: #2BFFC6;
  }
  
  &::placeholder {
    color: #B0B8C4;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button<{ primary?: boolean }>`
  background-color: ${props => props.primary ? '#2BFFC6' : 'transparent'};
  color: ${props => props.primary ? '#0D1117' : '#FFFFFF'};
  border: ${props => props.primary ? 'none' : '1px solid #2A3343'};
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.primary ? '#22D6A7' : 'rgba(255, 255, 255, 0.05)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: 2px solid #2BFFC6;
    outline-offset: 2px;
  }
`;

const AutoDiscoveryBanner = styled.div`
  background-color: rgba(43, 255, 198, 0.1);
  border: 1px solid #2BFFC6;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AutoDiscoveryIcon = styled.div`
  color: #2BFFC6;
  font-size: 20px;
`;

const AutoDiscoveryText = styled.div`
  color: #FFFFFF;
  font-size: 14px;
  
  strong {
    color: #2BFFC6;
  }
`;

export const AgentInputStep: React.FC<AgentInputStepProps> = ({ onNext, multiAgent = false }) => {
  const { 
    agentName,
    setAgentName,
    agentCode,
    setAgentCode,
    analyzeAgentCode
  } = useDashboard();
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agentName.trim() || !agentCode.trim()) {
      return;
    }
    
    try {
      await analyzeAgentCode();
      onNext();
    } catch (err) {
      // Error handling is done by the context
      console.error('Failed to analyze agent:', err);
    }
  };
  
  return (
    <StepContainer>
      <StepTitle>Agent Configuration</StepTitle>
      <StepDescription>
        Configure your AI agent with auto-discovery and enhanced settings
      </StepDescription>
      
      <AutoDiscoveryBanner>
        <AutoDiscoveryIcon>🔍</AutoDiscoveryIcon>
        <AutoDiscoveryText>
          <strong>Auto-Discovery Enabled</strong><br />
          Select a provider and enter your API key - we'll automatically discover and populate your agent's capabilities, models, and optimal settings!
        </AutoDiscoveryText>
      </AutoDiscoveryBanner>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="agent-name">Agent Name *</Label>
          <Input
            type="text"
            id="agent-name"
            aria-label="Agent Name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Enter a name for your agent"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="agent-description">Description</Label>
          <TextArea
            id="agent-description"
            aria-label="Agent Description"
            placeholder="Describe what your agent does..."
            rows={3}
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="api-endpoint">API Endpoint *</Label>
          <Input
            type="url"
            id="api-endpoint"
            aria-label="API Endpoint"
            placeholder="https://api.example.com/v1/chat"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="api-key">API Key *</Label>
          <Input
            type="password"
            id="api-key"
            aria-label="API Key"
            placeholder="Enter your API key"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="provider">Provider</Label>
          <Input
            type="text"
            id="provider"
            aria-label="Provider"
            placeholder="OpenAI, Anthropic, etc."
          />
        </FormGroup>
        
        <FormActions>
          <Button type="submit" primary disabled={!agentName.trim()}>
            Next
          </Button>
        </FormActions>
      </Form>
    </StepContainer>
  );
};
