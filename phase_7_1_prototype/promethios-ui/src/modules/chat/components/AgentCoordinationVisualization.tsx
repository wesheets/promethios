import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Simple styled component for testing
const TestContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 8,
  position: 'relative'
}));

interface AgentCoordinationVisualizationProps {
  agents: any[];
  currentStep?: any;
  isActive?: boolean;
}

const AgentCoordinationVisualization: React.FC<AgentCoordinationVisualizationProps> = ({
  agents = [],
  currentStep,
  isActive = false
}) => {
  return (
    <TestContainer>
      <Typography variant="h6">Agent Coordination</Typography>
      <Typography variant="body2">
        {agents.length} agents active
      </Typography>
    </TestContainer>
  );
};

export default AgentCoordinationVisualization;
export { AgentCoordinationVisualization };

