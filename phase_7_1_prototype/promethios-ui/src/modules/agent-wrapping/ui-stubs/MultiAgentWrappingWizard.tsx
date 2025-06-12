import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Text,
  Textarea,
  useSteps,
  VStack,
  HStack,
  Badge,
  Flex,
  IconButton,
  Link,
} from '@chakra-ui/react';

// Mock components for the agent composition canvas
const AgentCompositionCanvas = () => (
  <Box 
    border="2px dashed" 
    borderColor="blue.400" 
    borderRadius="md" 
    p={4} 
    h="400px" 
    bg="gray.700"
    position="relative"
  >
    <Text fontSize="xl" fontWeight="bold" color="white">Multi-Agent Composition Canvas - Test Content</Text>
    {/* Input Node */}
    <Box 
      position="absolute" 
      top="180px" 
      left="20px" 
      bg="gray.600" 
      p={2} 
      borderRadius="md" 
      borderLeft="4px solid green.400"
      w="120px"
    >
      <Text fontWeight="bold">Input</Text>
      <Text fontSize="xs">System input data</Text>
    </Box>
    
    {/* Agent Nodes */}
    <Box 
      position="absolute" 
      top="80px" 
      left="240px" 
      bg="gray.600" 
      p={2} 
      borderRadius="md" 
      borderLeft="4px solid blue.400"
      w="150px"
    >
      <Text fontWeight="bold">Content Generator</Text>
      <Text fontSize="xs">OpenAI GPT-4</Text>
    </Box>
    
    <Box 
      position="absolute" 
      top="220px" 
      left="240px" 
      bg="gray.600" 
      p={2} 
      borderRadius="md" 
      borderLeft="4px solid blue.400"
      w="150px"
    >
      <Text fontWeight="bold">Sentiment Analyzer</Text>
      <Text fontSize="xs">OpenAI GPT-4</Text>
    </Box>
    
    <Box 
      position="absolute" 
      top="150px" 
      left="460px" 
      bg="gray.600" 
      p={2} 
      borderRadius="md" 
      borderLeft="4px solid blue.400"
      w="150px"
    >
      <Text fontWeight="bold">Customer Support</Text>
      <Text fontSize="xs">Anthropic Claude</Text>
    </Box>
    
    {/* Output Node */}
    <Box 
      position="absolute" 
      top="150px" 
      left="680px" 
      bg="gray.600" 
      p={2} 
      borderRadius="md" 
      borderLeft="4px solid purple.400"
      w="120px"
    >
      <Text fontWeight="bold">Output</Text>
      <Text fontSize="xs">Final response</Text>
    </Box>
    
    {/* Connection Lines (simplified representation) */}
    <Box position="absolute" top="190px" left="140px" h="2px" w="100px" bg="blue.400"></Box>
    <Box position="absolute" top="100px" left="390px" h="2px" w="70px" bg="blue.400" transform="rotate(30deg)"></Box>
    <Box position="absolute" top="230px" left="390px" h="2px" w="70px" bg="blue.400" transform="rotate(-30deg)"></Box>
    <Box position="absolute" top="160px" left="610px" h="2px" w="70px" bg="blue.400"></Box>
  </Box>
);

// Mock component for the agent library
const AgentLibrary = () => (
  <Box bg="gray.700" p={4} borderRadius="md" mb={4}>
    <Heading size="sm" mb={2}>Available Wrapped Agents</Heading>
    <Flex flexWrap="wrap" gap={2}>
      <Badge colorScheme="blue" p={2} borderRadius="md" cursor="pointer">Content Generator (OpenAI)</Badge>
      <Badge colorScheme="purple" p={2} borderRadius="md" cursor="pointer">Customer Support (Anthropic)</Badge>
      <Badge colorScheme="green" p={2} borderRadius="md" cursor="pointer">Code Assistant (OpenAI)</Badge>
      <Badge colorScheme="orange" p={2} borderRadius="md" cursor="pointer">Data Analyzer (Custom API)</Badge>
      <Badge colorScheme="cyan" p={2} borderRadius="md" cursor="pointer">Translation Service (Cohere)</Badge>
      <Badge colorScheme="pink" p={2} borderRadius="md" cursor="pointer">Sentiment Analyzer (OpenAI)</Badge>
    </Flex>
  </Box>
);

// Mock component for the flow configuration
const FlowConfiguration = () => (
  <Box bg="gray.700" p={4} borderRadius="md">
    <Heading size="sm" mb={2}>Execution Flow</Heading>
    <HStack spacing={2} mb={4}>
      <Button size="sm" variant="outline">Sequential</Button>
      <Button size="sm" colorScheme="blue">Parallel</Button>
      <Button size="sm" variant="outline">Conditional</Button>
    </HStack>
    
    <Heading size="sm" mb={2}>Data Mapping</Heading>
    <Box overflowX="auto">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #4A5568' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Source</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Source Field</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Target</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Target Field</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #4A5568' }}>
            <td style={{ padding: '0.5rem' }}>Input</td>
            <td style={{ padding: '0.5rem' }}>query</td>
            <td style={{ padding: '0.5rem' }}>Content Generator</td>
            <td style={{ padding: '0.5rem' }}>prompt</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #4A5568' }}>
            <td style={{ padding: '0.5rem' }}>Input</td>
            <td style={{ padding: '0.5rem' }}>query</td>
            <td style={{ padding: '0.5rem' }}>Sentiment Analyzer</td>
            <td style={{ padding: '0.5rem' }}>text</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #4A5568' }}>
            <td style={{ padding: '0.5rem' }}>Content Generator</td>
            <td style={{ padding: '0.5rem' }}>completion</td>
            <td style={{ padding: '0.5rem' }}>Customer Support</td>
            <td style={{ padding: '0.5rem' }}>context</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #4A5568' }}>
            <td style={{ padding: '0.5rem' }}>Sentiment Analyzer</td>
            <td style={{ padding: '0.5rem' }}>sentiment</td>
            <td style={{ padding: '0.5rem' }}>Customer Support</td>
            <td style={{ padding: '0.5rem' }}>tone</td>
          </tr>
          <tr>
            <td style={{ padding: '0.5rem' }}>Customer Support</td>
            <td style={{ padding: '0.5rem' }}>response</td>
            <td style={{ padding: '0.5rem' }}>Output</td>
            <td style={{ padding: '0.5rem' }}>result</td>
          </tr>
        </tbody>
      </table>
    </Box>
  </Box>
);

// Mock component for governance rules
const GovernanceRules = () => (
  <Box bg="gray.700" p={4} borderRadius="md">
    <Heading size="sm" mb={4}>Governance Controls</Heading>
    
    <FormControl mb={4}>
      <FormLabel>Governance Policy</FormLabel>
      <Select defaultValue="standard">
        <option value="standard">Standard Compliance</option>
        <option value="strict">Strict Governance</option>
        <option value="minimal">Minimal Controls</option>
        <option value="custom">Custom Policy</option>
      </Select>
    </FormControl>
    
    <FormControl mb={4}>
      <FormLabel>Cross-Agent Validation</FormLabel>
      <Select defaultValue="enabled">
        <option value="enabled">Enabled</option>
        <option value="disabled">Disabled</option>
      </Select>
    </FormControl>
    
    <FormControl mb={4}>
      <FormLabel>Error Handling</FormLabel>
      <Select defaultValue="fallback">
        <option value="fallback">Use Fallback Responses</option>
        <option value="retry">Retry Failed Agents</option>
        <option value="abort">Abort on Failure</option>
      </Select>
    </FormControl>
    
    <FormControl mb={4}>
      <FormLabel>Logging Level</FormLabel>
      <Select defaultValue="detailed">
        <option value="minimal">Minimal</option>
        <option value="standard">Standard</option>
        <option value="detailed">Detailed</option>
      </Select>
    </FormControl>
  </Box>
);

// Mock component for the review step
const ReviewStep = () => (
  <Box bg="gray.700" p={4} borderRadius="md">
    <Heading size="sm" mb={4}>Review Configuration</Heading>
    
    <Box mb={4}>
      <Text fontWeight="bold">Multi-Agent System Name</Text>
      <Text>Customer Support Pipeline</Text>
    </Box>
    
    <Box mb={4}>
      <Text fontWeight="bold">System Type</Text>
      <Text>Parallel Processing</Text>
    </Box>
    
    <Box mb={4}>
      <Text fontWeight="bold">Agents</Text>
      <Text>Content Generator, Sentiment Analyzer, Customer Support</Text>
    </Box>
    
    <Box mb={4}>
      <Text fontWeight="bold">Governance Policy</Text>
      <Text>Standard Compliance</Text>
    </Box>
    
    <Box mb={4}>
      <Text fontWeight="bold">Error Handling</Text>
      <Text>Use Fallback Responses</Text>
    </Box>
  </Box>
);

// Success component with "What You Can Do Next" links
const SuccessStep = () => (
  <Box textAlign="center" py={10} px={6}>
    <Box display="inline-block" mb={4}>
      <Box
        as="span"
        fontSize="3xl"
        role="img"
        d="inline-block"
        color="green.400"
        aria-label="Success"
      >
        ✅
      </Box>
    </Box>
    <Heading as="h2" size="xl" mb={2}>
      Multi-Agent System Successfully Created
    </Heading>
    <Text color="gray.400" mb={6}>
      Your multi-agent system is now wrapped with governance controls
    </Text>
    
    <VStack spacing={4} align="stretch" maxW="md" mx="auto">
      <Heading as="h3" size="md" mb={2}>
        What You Can Do Next
      </Heading>
      
      <Button colorScheme="blue" leftIcon={<span>💬</span>}>
        Chat with your multi-agent system
      </Button>
      
      <Button colorScheme="teal" leftIcon={<span>📊</span>}>
        View governance metrics
      </Button>
      
      <Button colorScheme="purple" leftIcon={<span>📋</span>}>
        View scorecard
      </Button>
      
      <Button colorScheme="green" leftIcon={<span>🚀</span>}>
        Deploy multi-agent system
      </Button>
      
      <Button variant="outline" leftIcon={<span>➕</span>}>
        Create another multi-agent system
      </Button>
    </VStack>
  </Box>
);

// Steps for the wizard
const steps = [
  { title: 'Basic Info', description: 'System details' },
  { title: 'Agent Selection', description: 'Choose agents' },
  { title: 'Flow Configuration', description: 'Define connections' },
  { title: 'Governance Rules', description: 'Set policies' },
  { title: 'Review & Create', description: 'Verify settings' },
];

const MultiAgentWrappingWizard: React.FC = () => {
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  
  const [isComplete, setIsComplete] = useState(false);
  
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      setIsComplete(true);
    } else {
      setActiveStep(activeStep + 1);
    }
  };
  
  const handlePrevious = () => {
    setActiveStep(activeStep - 1);
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading as="h1" size="xl">Multi-Agent Wrapping - Test Content</Heading>
        <Text color="gray.400">Compose multiple agents into a unified workflow with governance controls</Text>
      </Box>
      
      {!isComplete ? (
        <>
          <Stepper index={activeStep} mb={8} colorScheme="blue">
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator>
                  <StepStatus
                    complete={<StepIcon />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                  />
                </StepIndicator>
                
                <Box flexShrink={0}>
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </Box>
                
                <StepSeparator />
              </Step>
            ))}
          </Stepper>
          
          <Card bg="gray.800" p={6} mb={6}>
            <Heading size="md" mb={4}>
              {activeStep === 0 && "1. Basic Information"}
              {activeStep === 1 && "2. Agent Selection"}
              {activeStep === 2 && "3. Flow Configuration"}
              {activeStep === 3 && "4. Governance Rules"}
              {activeStep === 4 && "5. Review & Create"}
            </Heading>
            
            {activeStep === 0 && (
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Multi-Agent System Name</FormLabel>
                  <Input placeholder="e.g., Customer Support Pipeline, Content Generation Workflow" />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea placeholder="Describe the purpose and function of this multi-agent system" />
                </FormControl>
                
                <FormControl>
                  <FormLabel>System Type</FormLabel>
                  <Select>
                    <option>Sequential Pipeline</option>
                    <option>Parallel Processing</option>
                    <option>Conditional Branching</option>
                    <option>Custom Workflow</option>
                  </Select>
                </FormControl>
              </VStack>
            )}
            
            {activeStep === 1 && (
              <VStack spacing={4} align="stretch">
                <AgentLibrary />
                <AgentCompositionCanvas />
                <Text fontSize="sm" color="gray.400" textAlign="center">
                  Drag agents from the library to the canvas and connect them to create your multi-agent workflow
                </Text>
              </VStack>
            )}
            
            {activeStep === 2 && (
              <FlowConfiguration />
            )}
            
            {activeStep === 3 && (
              <GovernanceRules />
            )}
            
            {activeStep === 4 && (
              <ReviewStep />
            )}
          </Card>
          
          <Flex justify="space-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              isDisabled={activeStep === 0}
            >
              Previous
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleNext}
            >
              {activeStep === steps.length - 1 ? 'Create Multi-Agent System' : 'Next'}
            </Button>
          </Flex>
        </>
      ) : (
        <SuccessStep />
      )}
    </Container>
  );
};

export default MultiAgentWrappingWizard;


