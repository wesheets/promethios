import React, { useState } from 'react';
import {
  Box,
  Button,
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
  Card,
  CardBody,
  FormHelperText,
  InputGroup,
  InputRightElement,
  Link,
  Flex,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { ChevronDownIcon, CheckIcon } from '@chakra-ui/icons';

// Mock components for the API endpoint step
const APIEndpointStep = ({ onNext }: { onNext: () => void }) => {
  const [testSuccess, setTestSuccess] = useState(false);
  
  const handleTestConnection = () => {
    // Simulate API connection test
    setTimeout(() => {
      setTestSuccess(true);
    }, 1000);
  };
  
  return (
    <Box>
      <Heading as="h2" size="lg" mb={6}>1. Connect Your Agent API</Heading>
      
      <VStack spacing={6} align="stretch">
        <FormControl isRequired>
          <FormLabel>Agent Name</FormLabel>
          <Input placeholder="e.g., Content Generator, Customer Support Bot" />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>API Provider</FormLabel>
          <Select placeholder="Select provider" defaultValue="OpenAI">
            <option value="OpenAI">OpenAI</option>
            <option value="Anthropic">Anthropic</option>
            <option value="Cohere">Cohere</option>
            <option value="Custom">Custom API</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>API Endpoint URL</FormLabel>
          <Input placeholder="https://api.example.com/v1/chat/completions" />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Authentication</FormLabel>
          <Select placeholder="Select authentication method" defaultValue="API Key">
            <option value="API Key">API Key</option>
            <option value="OAuth">OAuth</option>
            <option value="Bearer Token">Bearer Token</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>API Key</FormLabel>
          <Input type="password" placeholder="Enter your API key" />
          <FormHelperText>Your API key is securely stored and never exposed to end users.</FormHelperText>
        </FormControl>
        
        <Box>
          <Button 
            colorScheme={testSuccess ? "green" : "blue"} 
            onClick={handleTestConnection}
            leftIcon={testSuccess ? <CheckIcon /> : undefined}
          >
            {testSuccess ? "Connection Successful" : "Test Connection"}
          </Button>
        </Box>
      </VStack>
      
      <Box mt={8}>
        <SimpleGrid columns={3} spacing={4}>
          <Card variant="outline" p={4} bg="gray.700">
            <CardBody>
              <Heading size="sm" mb={2}>2. Define Schema</Heading>
              <Text fontSize="sm">Set input/output formats for your agent</Text>
            </CardBody>
          </Card>
          
          <Card variant="outline" p={4} bg="gray.700">
            <CardBody>
              <Heading size="sm" mb={2}>3. Set Governance</Heading>
              <Text fontSize="sm">Apply governance controls and policies</Text>
            </CardBody>
          </Card>
          
          <Card variant="outline" p={4} bg="gray.700">
            <CardBody>
              <Heading size="sm" mb={2}>4. Review & Create</Heading>
              <Text fontSize="sm">Verify settings and activate your agent</Text>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
      
      <Flex justify="space-between" mt={8}>
        <Button variant="outline" isDisabled>Previous</Button>
        <Button 
          colorScheme="blue" 
          onClick={onNext}
          isDisabled={!testSuccess}
        >
          Next: Define Schema
        </Button>
      </Flex>
    </Box>
  );
};

// Mock components for the schema step
const SchemaStep = ({ onNext, onPrevious }: { onNext: () => void, onPrevious: () => void }) => {
  return (
    <Box>
      <Heading as="h2" size="lg" mb={6}>2. Define Schema</Heading>
      
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel>Input Format</FormLabel>
          <Select defaultValue="json">
            <option value="json">JSON</option>
            <option value="text">Plain Text</option>
            <option value="custom">Custom</option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Input Schema</FormLabel>
          <Textarea 
            placeholder="Define your input schema"
            defaultValue={`{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "description": "The user's input prompt"
    },
    "max_tokens": {
      "type": "integer",
      "default": 100
    },
    "temperature": {
      "type": "number",
      "default": 0.7
    }
  },
  "required": ["prompt"]
}`}
            height="200px"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Output Format</FormLabel>
          <Select defaultValue="json">
            <option value="json">JSON</option>
            <option value="text">Plain Text</option>
            <option value="custom">Custom</option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Output Schema</FormLabel>
          <Textarea 
            placeholder="Define your output schema"
            defaultValue={`{
  "type": "object",
  "properties": {
    "completion": {
      "type": "string",
      "description": "The generated text response"
    },
    "usage": {
      "type": "object",
      "properties": {
        "prompt_tokens": { "type": "integer" },
        "completion_tokens": { "type": "integer" },
        "total_tokens": { "type": "integer" }
      }
    }
  },
  "required": ["completion"]
}`}
            height="200px"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Schema Validation</FormLabel>
          <Select defaultValue="strict">
            <option value="strict">Strict (Reject non-conforming requests)</option>
            <option value="flexible">Flexible (Try to process non-conforming requests)</option>
            <option value="none">None (No validation)</option>
          </Select>
        </FormControl>
      </VStack>
      
      <Flex justify="space-between" mt={8}>
        <Button variant="outline" onClick={onPrevious}>Previous</Button>
        <Button colorScheme="blue" onClick={onNext}>Next: Set Governance</Button>
      </Flex>
    </Box>
  );
};

// Mock components for the governance step
const GovernanceStep = ({ onNext, onPrevious }: { onNext: () => void, onPrevious: () => void }) => {
  return (
    <Box>
      <Heading as="h2" size="lg" mb={6}>3. Set Governance</Heading>
      
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel>Governance Policy</FormLabel>
          <Select defaultValue="standard">
            <option value="standard">Standard Compliance</option>
            <option value="strict">Strict Governance</option>
            <option value="minimal">Minimal Controls</option>
            <option value="custom">Custom Policy</option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Content Filtering</FormLabel>
          <Select defaultValue="medium">
            <option value="high">High (Most restrictive)</option>
            <option value="medium">Medium (Balanced)</option>
            <option value="low">Low (Least restrictive)</option>
            <option value="none">None (No filtering)</option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Usage Limits</FormLabel>
          <InputGroup>
            <Input type="number" defaultValue="1000" />
            <InputRightElement width="4.5rem">
              <Text fontSize="sm">/ day</Text>
            </InputRightElement>
          </InputGroup>
          <FormHelperText>Maximum number of requests per day</FormHelperText>
        </FormControl>
        
        <FormControl>
          <FormLabel>Logging Level</FormLabel>
          <Select defaultValue="detailed">
            <option value="minimal">Minimal (Errors only)</option>
            <option value="standard">Standard (Errors and warnings)</option>
            <option value="detailed">Detailed (All requests and responses)</option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Monitoring</FormLabel>
          <Select defaultValue="enabled">
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </Select>
          <FormHelperText>Enable monitoring for this agent</FormHelperText>
        </FormControl>
        
        <FormControl>
          <FormLabel>Approval Workflow</FormLabel>
          <Select defaultValue="none">
            <option value="none">None (No approval required)</option>
            <option value="manual">Manual (Human approval required)</option>
            <option value="automated">Automated (System approval)</option>
          </Select>
        </FormControl>
      </VStack>
      
      <Flex justify="space-between" mt={8}>
        <Button variant="outline" onClick={onPrevious}>Previous</Button>
        <Button colorScheme="blue" onClick={onNext}>Next: Review & Create</Button>
      </Flex>
    </Box>
  );
};

// Mock components for the review step
const ReviewStep = ({ onPrevious, onComplete }: { onPrevious: () => void, onComplete: () => void }) => {
  return (
    <Box>
      <Heading as="h2" size="lg" mb={6}>4. Review & Create</Heading>
      
      <Card bg="gray.700" mb={6}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md" mb={2}>Agent Configuration</Heading>
            
            <Box>
              <Text fontWeight="bold">Agent Name</Text>
              <Text>Content Generator</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">API Provider</Text>
              <Text>OpenAI</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">API Endpoint</Text>
              <Text>https://api.openai.com/v1/chat/completions</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Authentication</Text>
              <Text>API Key (secured)</Text>
            </Box>
            
            <Heading size="md" mt={4} mb={2}>Schema</Heading>
            
            <Box>
              <Text fontWeight="bold">Input Format</Text>
              <Text>JSON</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Output Format</Text>
              <Text>JSON</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Schema Validation</Text>
              <Text>Strict</Text>
            </Box>
            
            <Heading size="md" mt={4} mb={2}>Governance</Heading>
            
            <Box>
              <Text fontWeight="bold">Governance Policy</Text>
              <Text>Standard Compliance</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Content Filtering</Text>
              <Text>Medium</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Usage Limits</Text>
              <Text>1000 requests / day</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Logging Level</Text>
              <Text>Detailed</Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>
      
      <Flex justify="space-between">
        <Button variant="outline" onClick={onPrevious}>Previous</Button>
        <Button colorScheme="green" onClick={onComplete}>Create Agent</Button>
      </Flex>
    </Box>
  );
};

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
      Agent Successfully Wrapped
    </Heading>
    <Text color="gray.400" mb={6}>
      Your agent is now wrapped with governance controls
    </Text>
    
    <VStack spacing={4} align="stretch" maxW="md" mx="auto">
      <Heading as="h3" size="md" mb={2}>
        What You Can Do Next
      </Heading>
      
      <Button colorScheme="blue" leftIcon={<span>💬</span>}>
        Chat with your agent
      </Button>
      
      <Button colorScheme="teal" leftIcon={<span>📊</span>}>
        View governance metrics
      </Button>
      
      <Button colorScheme="purple" leftIcon={<span>📋</span>}>
        View agent scorecard
      </Button>
      
      <Button colorScheme="orange" leftIcon={<span>🔄</span>}>
        Create multi-agent system
      </Button>
      
      <Button variant="outline" leftIcon={<span>➕</span>}>
        Wrap another agent
      </Button>
    </VStack>
  </Box>
);

// Steps for the wizard
const steps = [
  { title: 'API Endpoint', description: 'Connect your agent' },
  { title: 'Schema', description: 'Define formats' },
  { title: 'Governance', description: 'Set policies' },
  { title: 'Review', description: 'Verify settings' },
];

const AgentWrappingWizard: React.FC = () => {
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  
  const [isComplete, setIsComplete] = useState(false);
  
  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };
  
  const handlePrevious = () => {
    setActiveStep(activeStep - 1);
  };
  
  const handleComplete = () => {
    setIsComplete(true);
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading as="h1" size="xl">Wrap New Agent</Heading>
        <Text color="gray.400">Connect your AI agent API with governance controls</Text>
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
            {activeStep === 0 && <APIEndpointStep onNext={handleNext} />}
            {activeStep === 1 && <SchemaStep onNext={handleNext} onPrevious={handlePrevious} />}
            {activeStep === 2 && <GovernanceStep onNext={handleNext} onPrevious={handlePrevious} />}
            {activeStep === 3 && <ReviewStep onPrevious={handlePrevious} onComplete={handleComplete} />}
          </Card>
        </>
      ) : (
        <SuccessStep />
      )}
    </Container>
  );
};

export default AgentWrappingWizard;
