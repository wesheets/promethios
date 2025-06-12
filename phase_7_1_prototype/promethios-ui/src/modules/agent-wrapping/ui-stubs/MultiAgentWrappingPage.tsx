import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardFooter,
  Stack,
  Flex,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import MultiAgentWrappingWizard from './MultiAgentWrappingWizard';

const MultiAgentWrappingPage: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [multiAgentSystems, setMultiAgentSystems] = useState([
    {
      id: '1',
      name: 'Customer Support Pipeline',
      description: 'Handles customer inquiries with content generation and sentiment analysis',
      agents: ['Content Generator', 'Sentiment Analyzer', 'Customer Support'],
      status: 'active',
      environment: 'production',
      requests: 876,
      successRate: 94.7,
    },
    {
      id: '2',
      name: 'Content Creation Workflow',
      description: 'Generates marketing content with brand voice guidelines and compliance checks',
      agents: ['Research Assistant', 'Content Generator', 'Compliance Checker'],
      status: 'active',
      environment: 'production',
      requests: 1245,
      successRate: 98.2,
    },
    {
      id: '3',
      name: 'Code Review Pipeline',
      description: 'Assists with code generation and review with security scanning',
      agents: ['Code Assistant', 'Security Scanner', 'Documentation Generator'],
      status: 'error',
      environment: 'testing',
      requests: 532,
      successRate: 76.3,
    },
    {
      id: '4',
      name: 'Financial Data Analysis',
      description: 'Analyzes financial data with strict confidentiality and accuracy requirements',
      agents: ['Data Analyzer', 'Report Generator', 'Compliance Checker'],
      status: 'inactive',
      environment: 'draft',
      requests: 0,
      successRate: 0,
    },
  ]);

  if (showWizard) {
    return (
      <Box>
        <Button 
          variant="outline" 
          mb={4} 
          onClick={() => setShowWizard(false)}
        >
          ← Back to Multi-Agent Systems
        </Button>
        <MultiAgentWrappingWizard />
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading as="h1" size="xl">Multi-Agent Wrapping</Heading>
            <Text color="gray.400">Compose and manage multi-agent systems with governance controls</Text>
          </Box>
          <Button colorScheme="blue" onClick={() => setShowWizard(true)}>
            + Create Multi-Agent System
          </Button>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
          <Card bg="gray.700">
            <CardBody>
              <Heading size="md" mb={2}>Total Systems</Heading>
              <Heading size="2xl">4</Heading>
              <Text color="green.400">+1 this week</Text>
            </CardBody>
          </Card>
          
          <Card bg="gray.700">
            <CardBody>
              <Heading size="md" mb={2}>Active Systems</Heading>
              <Heading size="2xl">2</Heading>
              <Text color="gray.400">50% of total</Text>
            </CardBody>
          </Card>
          
          <Card bg="gray.700">
            <CardBody>
              <Heading size="md" mb={2}>Governance Violations</Heading>
              <Heading size="2xl">1</Heading>
              <Text color="red.400">Needs attention</Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input placeholder="Search multi-agent systems..." />
          </InputGroup>
          
          <HStack spacing={4}>
            <Select placeholder="All Environments" maxW="200px">
              <option value="production">Production</option>
              <option value="testing">Testing</option>
              <option value="draft">Draft</option>
            </Select>
            
            <Select placeholder="All Status" maxW="200px">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="error">Error</option>
            </Select>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {multiAgentSystems.map((system) => (
            <Card key={system.id} bg="gray.700">
              <CardBody>
                <Flex justify="space-between" mb={2}>
                  <Badge 
                    colorScheme={
                      system.environment === 'production' ? 'blue' : 
                      system.environment === 'testing' ? 'purple' : 
                      'gray'
                    }
                  >
                    {system.environment}
                  </Badge>
                  <Badge 
                    colorScheme={
                      system.status === 'active' ? 'green' : 
                      system.status === 'error' ? 'red' : 
                      'gray'
                    }
                  >
                    {system.status}
                  </Badge>
                </Flex>
                
                <Heading size="md" mb={2}>{system.name}</Heading>
                <Text fontSize="sm" color="gray.400" mb={4}>{system.description}</Text>
                
                <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={1}>AGENTS</Text>
                <HStack spacing={2} mb={4} flexWrap="wrap">
                  {system.agents.map((agent, index) => (
                    <Badge key={index} colorScheme="blue" variant="subtle">
                      {agent}
                    </Badge>
                  ))}
                </HStack>
                
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="xs" color="gray.400">Requests</Text>
                    <Text fontWeight="bold">{system.requests.toLocaleString()}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.400">Success Rate</Text>
                    <Text fontWeight="bold">{system.successRate}%</Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
              
              <CardFooter pt={0}>
                <Stack direction="row" spacing={2} width="100%">
                  <Button variant="ghost" size="sm" flex={1}>Edit</Button>
                  <Button 
                    colorScheme={system.status === 'active' ? 'red' : 'green'} 
                    variant="outline" 
                    size="sm"
                    flex={1}
                  >
                    {system.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                </Stack>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      </Box>
    </Container>
  );
};

export default MultiAgentWrappingPage;
