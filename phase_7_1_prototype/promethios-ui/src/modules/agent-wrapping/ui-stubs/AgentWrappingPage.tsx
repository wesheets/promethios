import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
} from '@chakra-ui/react';
import AgentWrappingWizard from './AgentWrappingWizard';

const AgentWrappingPage: React.FC = () => {
  const [showWizard, setShowWizard] = useState(true);
  
  return (
    <Box>
      {showWizard ? (
        <Box>
          <Button 
            variant="outline" 
            mb={4} 
            onClick={() => setShowWizard(false)}
          >
            ← Back to Agents
          </Button>
          <AgentWrappingWizard />
        </Box>
      ) : (
        <Container maxW="container.xl" py={8}>
          <Box mb={8}>
            <Heading as="h1" size="xl">Agent Wrapping</Heading>
            <Text color="gray.400">Connect your AI agents with governance controls</Text>
          </Box>
          
          <Button 
            colorScheme="blue" 
            size="lg" 
            onClick={() => setShowWizard(true)}
          >
            + Wrap New Agent
          </Button>
        </Container>
      )}
    </Box>
  );
};

export default AgentWrappingPage;
