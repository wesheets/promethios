import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Alert,
  AlertTitle,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Chat,
  Dashboard,
  Assessment,
  Rocket,
  Add,
  DragIndicator,
  PlayArrow,
  Pause,
  Stop,
  Settings,
} from '@mui/icons-material';

// Mock components for the agent composition canvas
const AgentCompositionCanvas: React.FC = () => (
  <Paper 
    sx={{ 
      border: '2px dashed #1976d2', 
      borderRadius: 2, 
      p: 3, 
      minHeight: 400, 
      bgcolor: '#f5f5f5',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <Typography variant="h6" fontWeight="bold" gutterBottom>
      Multi-Agent Composition Canvas
    </Typography>
    
    {/* Input Node */}
    <Paper 
      sx={{ 
        position: 'absolute', 
        top: 180, 
        left: 20, 
        p: 2, 
        borderLeft: '4px solid #4caf50',
        width: 120,
        bgcolor: '#e8f5e8'
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold">Input</Typography>
      <Typography variant="caption">System input data</Typography>
    </Paper>
    
    {/* Agent Nodes */}
    <Paper 
      sx={{ 
        position: 'absolute', 
        top: 80, 
        left: 240, 
        p: 2, 
        borderLeft: '4px solid #1976d2',
        width: 150,
        bgcolor: '#e3f2fd'
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold">Content Generator</Typography>
      <Typography variant="caption">OpenAI GPT-4</Typography>
    </Paper>
    
    <Paper 
      sx={{ 
        position: 'absolute', 
        top: 220, 
        left: 240, 
        p: 2, 
        borderLeft: '4px solid #1976d2',
        width: 150,
        bgcolor: '#e3f2fd'
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold">Sentiment Analyzer</Typography>
      <Typography variant="caption">OpenAI GPT-4</Typography>
    </Paper>
    
    <Paper 
      sx={{ 
        position: 'absolute', 
        top: 150, 
        left: 460, 
        p: 2, 
        borderLeft: '4px solid #1976d2',
        width: 150,
        bgcolor: '#e3f2fd'
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold">Customer Support</Typography>
      <Typography variant="caption">Anthropic Claude</Typography>
    </Paper>
    
    {/* Output Node */}
    <Paper 
      sx={{ 
        position: 'absolute', 
        top: 150, 
        left: 680, 
        p: 2, 
        borderLeft: '4px solid #9c27b0',
        width: 120,
        bgcolor: '#f3e5f5'
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold">Output</Typography>
      <Typography variant="caption">Final response</Typography>
    </Paper>
    
    {/* Connection Lines */}
    <Box sx={{ position: 'absolute', top: 190, left: 140, height: 2, width: 100, bgcolor: '#1976d2' }} />
    <Box sx={{ position: 'absolute', top: 100, left: 390, height: 2, width: 70, bgcolor: '#1976d2', transform: 'rotate(30deg)' }} />
    <Box sx={{ position: 'absolute', top: 230, left: 390, height: 2, width: 70, bgcolor: '#1976d2', transform: 'rotate(-30deg)' }} />
    <Box sx={{ position: 'absolute', top: 160, left: 610, height: 2, width: 70, bgcolor: '#1976d2' }} />
  </Paper>
);

// Mock component for the agent library
const AgentLibrary: React.FC = () => (
  <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
    <Typography variant="h6" gutterBottom>Available Wrapped Agents</Typography>
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Chip label="Content Generator (OpenAI)" color="primary" sx={{ cursor: 'pointer' }} />
      <Chip label="Customer Support (Anthropic)" color="secondary" sx={{ cursor: 'pointer' }} />
      <Chip label="Code Assistant (OpenAI)" color="success" sx={{ cursor: 'pointer' }} />
      <Chip label="Data Analyzer (Custom API)" color="warning" sx={{ cursor: 'pointer' }} />
      <Chip label="Translation Service (Cohere)" color="info" sx={{ cursor: 'pointer' }} />
      <Chip label="Sentiment Analyzer (OpenAI)" color="error" sx={{ cursor: 'pointer' }} />
    </Stack>
  </Paper>
);

// Mock component for the flow configuration
const FlowConfiguration: React.FC = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>Execution Flow</Typography>
    <Stack direction="row" spacing={2} mb={3}>
      <Button variant="outlined" size="small">Sequential</Button>
      <Button variant="contained" size="small">Parallel</Button>
      <Button variant="outlined" size="small">Conditional</Button>
    </Stack>
    
    <Typography variant="h6" gutterBottom>Data Mapping</Typography>
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Source</TableCell>
            <TableCell>Source Field</TableCell>
            <TableCell>Target</TableCell>
            <TableCell>Target Field</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Input</TableCell>
            <TableCell>query</TableCell>
            <TableCell>Content Generator</TableCell>
            <TableCell>prompt</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Input</TableCell>
            <TableCell>query</TableCell>
            <TableCell>Sentiment Analyzer</TableCell>
            <TableCell>text</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Content Generator</TableCell>
            <TableCell>completion</TableCell>
            <TableCell>Customer Support</TableCell>
            <TableCell>context</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Sentiment Analyzer</TableCell>
            <TableCell>sentiment</TableCell>
            <TableCell>Customer Support</TableCell>
            <TableCell>tone</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Customer Support</TableCell>
            <TableCell>response</TableCell>
            <TableCell>Output</TableCell>
            <TableCell>result</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

// Mock component for governance rules
const GovernanceRules: React.FC = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>Governance Controls</Typography>
    
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Governance Policy</InputLabel>
          <Select defaultValue="standard" label="Governance Policy">
            <MenuItem value="standard">Standard Compliance</MenuItem>
            <MenuItem value="strict">Strict Governance</MenuItem>
            <MenuItem value="minimal">Minimal Controls</MenuItem>
            <MenuItem value="custom">Custom Policy</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Cross-Agent Validation</InputLabel>
          <Select defaultValue="enabled" label="Cross-Agent Validation">
            <MenuItem value="enabled">Enabled</MenuItem>
            <MenuItem value="disabled">Disabled</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Error Handling</InputLabel>
          <Select defaultValue="fallback" label="Error Handling">
            <MenuItem value="fallback">Use Fallback Responses</MenuItem>
            <MenuItem value="retry">Retry Failed Agents</MenuItem>
            <MenuItem value="abort">Abort on Failure</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Logging Level</InputLabel>
          <Select defaultValue="detailed" label="Logging Level">
            <MenuItem value="minimal">Minimal</MenuItem>
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="detailed">Detailed</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  </Paper>
);

// Mock component for the review step
const ReviewStep: React.FC = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>Review Configuration</Typography>
    
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" fontWeight="bold">Multi-Agent System Name</Typography>
        <Typography variant="body2" color="text.secondary">Customer Support Pipeline</Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" fontWeight="bold">System Type</Typography>
        <Typography variant="body2" color="text.secondary">Parallel Processing</Typography>
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="subtitle2" fontWeight="bold">Agents</Typography>
        <Typography variant="body2" color="text.secondary">Content Generator, Sentiment Analyzer, Customer Support</Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" fontWeight="bold">Governance Policy</Typography>
        <Typography variant="body2" color="text.secondary">Standard Compliance</Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" fontWeight="bold">Error Handling</Typography>
        <Typography variant="body2" color="text.secondary">Use Fallback Responses</Typography>
      </Grid>
    </Grid>
  </Paper>
);

// Success component with "What You Can Do Next" links
const SuccessStep: React.FC = () => (
  <Box textAlign="center" py={10} px={6}>
    <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
    
    <Typography variant="h4" gutterBottom>
      Multi-Agent System Successfully Created
    </Typography>
    <Typography variant="body1" color="text.secondary" mb={6}>
      Your multi-agent system is now wrapped with governance controls
    </Typography>
    
    <Box maxWidth={400} mx="auto">
      <Typography variant="h6" gutterBottom>
        What You Can Do Next
      </Typography>
      
      <Stack spacing={2}>
        <Button 
          variant="contained" 
          startIcon={<Chat />}
          fullWidth
          size="large"
        >
          Chat with your multi-agent system
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary"
          startIcon={<Assessment />}
          fullWidth
          size="large"
        >
          View governance metrics
        </Button>
        
        <Button 
          variant="contained" 
          color="info"
          startIcon={<Dashboard />}
          fullWidth
          size="large"
        >
          View scorecard
        </Button>
        
        <Button 
          variant="contained" 
          color="success"
          startIcon={<Rocket />}
          fullWidth
          size="large"
        >
          Deploy multi-agent system
        </Button>
        
        <Button 
          variant="outlined" 
          startIcon={<Add />}
          fullWidth
          size="large"
        >
          Create another multi-agent system
        </Button>
      </Stack>
    </Box>
  </Box>
);

// Steps for the wizard
const steps = [
  'Basic Info',
  'Agent Selection', 
  'Flow Configuration',
  'Governance Rules',
  'Review & Create'
];

const MultiAgentWrappingWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>Multi-Agent Wrapping</Typography>
        <Typography variant="body1" color="text.secondary">
          Compose multiple agents into a unified workflow with governance controls
        </Typography>
      </Box>
      
      {!isComplete ? (
        <>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                {activeStep === 0 && "1. Basic Information"}
                {activeStep === 1 && "2. Agent Selection"}
                {activeStep === 2 && "3. Flow Configuration"}
                {activeStep === 3 && "4. Governance Rules"}
                {activeStep === 4 && "5. Review & Create"}
              </Typography>
              
              {activeStep === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Multi-Agent System Name"
                      placeholder="e.g., Customer Support Pipeline, Content Generation Workflow"
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      placeholder="Describe the purpose and function of this multi-agent system"
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>System Type</InputLabel>
                      <Select label="System Type">
                        <MenuItem value="sequential">Sequential Pipeline</MenuItem>
                        <MenuItem value="parallel">Parallel Processing</MenuItem>
                        <MenuItem value="conditional">Conditional Branching</MenuItem>
                        <MenuItem value="custom">Custom Workflow</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
              
              {activeStep === 1 && (
                <Box>
                  <AgentLibrary />
                  <AgentCompositionCanvas />
                  <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                    Drag agents from the library to the canvas and connect them to create your multi-agent workflow
                  </Typography>
                </Box>
              )}
              
              {activeStep === 2 && <FlowConfiguration />}
              
              {activeStep === 3 && <GovernanceRules />}
              
              {activeStep === 4 && <ReviewStep />}
            </CardContent>
          </Card>
          
          <Box display="flex" justifyContent="space-between">
            <Button 
              variant="outlined" 
              onClick={handlePrevious}
              disabled={activeStep === 0}
            >
              Previous
            </Button>
            <Button 
              variant="contained" 
              onClick={handleNext}
            >
              {activeStep === steps.length - 1 ? 'Create Multi-Agent System' : 'Next'}
            </Button>
          </Box>
        </>
      ) : (
        <SuccessStep />
      )}
    </Container>
  );
};

export default MultiAgentWrappingWizard;

