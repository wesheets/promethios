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
  Autocomplete,
  FormControlLabel,
  Switch,
  Slider,
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
  Delete,
  Edit,
} from '@mui/icons-material';
import { useAgentWrappers } from '../hooks/useAgentWrappers';
import { useMultiAgentSystems } from '../hooks/useMultiAgentSystems';
import { MultiAgentSystem, AgentRole, AgentConnection, FlowType } from '../types/multiAgent';
import { v4 as uuidv4 } from 'uuid';

// Mock components for the agent composition canvas
const AgentCompositionCanvas: React.FC = () => (
  <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', position: 'relative', height: 300 }}>
    <Typography variant="h6" gutterBottom>Agent Composition Canvas</Typography>
    <Typography variant="body2" color="text.secondary" mb={2}>
      Visual representation of your multi-agent system flow
    </Typography>
    
    {/* Mock agent nodes */}
    <Box sx={{ position: 'absolute', top: 80, left: 50, width: 120, height: 60, bgcolor: '#e3f2fd', border: '2px solid #1976d2', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" fontWeight="bold">Input</Typography>
    </Box>
    
    <Box sx={{ position: 'absolute', top: 160, left: 200, width: 120, height: 60, bgcolor: '#f3e5f5', border: '2px solid #9c27b0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" fontWeight="bold">Content Gen</Typography>
    </Box>
    
    <Box sx={{ position: 'absolute', top: 80, left: 350, width: 120, height: 60, bgcolor: '#e8f5e8', border: '2px solid #4caf50', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" fontWeight="bold">Sentiment</Typography>
    </Box>
    
    <Box sx={{ position: 'absolute', top: 160, left: 500, width: 120, height: 60, bgcolor: '#fff3e0', border: '2px solid #ff9800', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" fontWeight="bold">Support</Typography>
    </Box>
    
    <Box sx={{ position: 'absolute', top: 80, left: 650, width: 120, height: 60, bgcolor: '#fce4ec', border: '2px solid #e91e63', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" fontWeight="bold">Output</Typography>
    </Box>
    
    {/* Mock connection lines */}
    <Box sx={{ position: 'absolute', top: 110, left: 170, height: 2, width: 30, bgcolor: '#1976d2' }} />
    <Box sx={{ position: 'absolute', top: 110, left: 170, height: 70, width: 2, bgcolor: '#1976d2' }} />
    <Box sx={{ position: 'absolute', top: 180, left: 170, height: 2, width: 30, bgcolor: '#1976d2' }} />
    
    <Box sx={{ position: 'absolute', top: 110, left: 470, height: 2, width: 30, bgcolor: '#4caf50' }} />
    <Box sx={{ position: 'absolute', top: 110, left: 470, height: 70, width: 2, bgcolor: '#4caf50' }} />
    <Box sx={{ position: 'absolute', top: 180, left: 470, height: 2, width: 30, bgcolor: '#4caf50' }} />
    
    <Box sx={{ position: 'absolute', top: 190, left: 320, height: 2, width: 180, bgcolor: '#9c27b0' }} />
    <Box sx={{ position: 'absolute', top: 160, left: 610, height: 2, width: 70, bgcolor: '#1976d2' }} />
  </Paper>
);

// Real Agent Library component that loads user's wrapped agents
const AgentLibrary: React.FC<{ 
  onAgentSelect: (agentId: string) => void;
  selectedAgents: string[];
}> = ({ onAgentSelect, selectedAgents }) => {
  const { wrappers, loading } = useAgentWrappers();

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>Available Wrapped Agents</Typography>
        <Typography variant="body2" color="text.secondary">Loading your wrapped agents...</Typography>
      </Paper>
    );
  }

  if (wrappers.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>Available Wrapped Agents</Typography>
        <Alert severity="info">
          <AlertTitle>No Wrapped Agents Found</AlertTitle>
          You need to wrap individual agents first before creating multi-agent systems. 
          Go to the Single Agent Wrapping page to wrap your agents.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
      <Typography variant="h6" gutterBottom>Available Wrapped Agents</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Click on agents to add them to your multi-agent system
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {wrappers.map((wrapper) => (
          <Chip
            key={wrapper.id}
            label={`${wrapper.name} (${wrapper.supportedProviders[0] || 'Custom'})`}
            color={selectedAgents.includes(wrapper.id) ? "primary" : "default"}
            variant={selectedAgents.includes(wrapper.id) ? "filled" : "outlined"}
            onClick={() => onAgentSelect(wrapper.id)}
            sx={{ cursor: 'pointer', mb: 1 }}
          />
        ))}
      </Stack>
    </Paper>
  );
};

// Real Flow Configuration component
const FlowConfiguration: React.FC<{
  flowType: FlowType;
  onFlowTypeChange: (flowType: FlowType) => void;
  connections: AgentConnection[];
  onConnectionsChange: (connections: AgentConnection[]) => void;
  selectedAgents: string[];
}> = ({ flowType, onFlowTypeChange, connections, onConnectionsChange, selectedAgents }) => {
  const { wrappers } = useAgentWrappers();
  
  const getAgentName = (agentId: string) => {
    const wrapper = wrappers.find(w => w.id === agentId);
    return wrapper ? wrapper.name : agentId;
  };

  const addConnection = () => {
    if (selectedAgents.length < 2) return;
    
    const newConnection: AgentConnection = {
      sourceAgentId: selectedAgents[0],
      targetAgentId: selectedAgents[1],
      sourceField: 'output',
      targetField: 'input'
    };
    
    onConnectionsChange([...connections, newConnection]);
  };

  const removeConnection = (index: number) => {
    const newConnections = connections.filter((_, i) => i !== index);
    onConnectionsChange(newConnections);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Execution Flow</Typography>
      <Stack direction="row" spacing={2} mb={3}>
        <Button 
          variant={flowType === 'sequential' ? 'contained' : 'outlined'} 
          size="small"
          onClick={() => onFlowTypeChange('sequential')}
        >
          Sequential
        </Button>
        <Button 
          variant={flowType === 'parallel' ? 'contained' : 'outlined'} 
          size="small"
          onClick={() => onFlowTypeChange('parallel')}
        >
          Parallel
        </Button>
        <Button 
          variant={flowType === 'conditional' ? 'contained' : 'outlined'} 
          size="small"
          onClick={() => onFlowTypeChange('conditional')}
        >
          Conditional
        </Button>
        <Button 
          variant={flowType === 'custom' ? 'contained' : 'outlined'} 
          size="small"
          onClick={() => onFlowTypeChange('custom')}
        >
          Custom
        </Button>
      </Stack>
      
      <Typography variant="h6" gutterBottom>Data Mapping</Typography>
      
      {selectedAgents.length >= 2 && (
        <Box mb={2}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={addConnection}
            startIcon={<Add />}
          >
            Add Connection
          </Button>
        </Box>
      )}
      
      {connections.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Source Agent</TableCell>
                <TableCell>Source Field</TableCell>
                <TableCell>Target Agent</TableCell>
                <TableCell>Target Field</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {connections.map((connection, index) => (
                <TableRow key={index}>
                  <TableCell>{getAgentName(connection.sourceAgentId)}</TableCell>
                  <TableCell>{connection.sourceField}</TableCell>
                  <TableCell>{getAgentName(connection.targetAgentId)}</TableCell>
                  <TableCell>{connection.targetField}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => removeConnection(index)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">
          No connections defined. Add connections to specify how data flows between agents.
        </Alert>
      )}
    </Paper>
  );
};

// Real Governance Rules component
const GovernanceRules: React.FC<{
  governanceRules: MultiAgentSystem['governanceRules'];
  onGovernanceRulesChange: (rules: MultiAgentSystem['governanceRules']) => void;
}> = ({ governanceRules, onGovernanceRulesChange }) => {
  const updateRule = (key: keyof MultiAgentSystem['governanceRules'], value: any) => {
    onGovernanceRulesChange({
      ...governanceRules,
      [key]: value
    });
  };

  const updateRateLimiting = (key: keyof MultiAgentSystem['governanceRules']['rateLimiting'], value: number) => {
    onGovernanceRulesChange({
      ...governanceRules,
      rateLimiting: {
        ...governanceRules.rateLimiting,
        [key]: value
      }
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>System Governance</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Governance Policy</InputLabel>
            <Select
              value={governanceRules.governancePolicy}
              onChange={(e) => updateRule('governancePolicy', e.target.value)}
              label="Governance Policy"
            >
              <MenuItem value="minimal">Minimal - Basic logging only</MenuItem>
              <MenuItem value="standard">Standard - Balanced governance</MenuItem>
              <MenuItem value="strict">Strict - Full compliance monitoring</MenuItem>
              <MenuItem value="custom">Custom - User-defined rules</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Error Handling</InputLabel>
            <Select
              value={governanceRules.errorHandling}
              onChange={(e) => updateRule('errorHandling', e.target.value)}
              label="Error Handling"
            >
              <MenuItem value="fallback">Fallback - Use backup agents</MenuItem>
              <MenuItem value="retry">Retry - Attempt again</MenuItem>
              <MenuItem value="abort">Abort - Stop execution</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Logging Level</InputLabel>
            <Select
              value={governanceRules.loggingLevel}
              onChange={(e) => updateRule('loggingLevel', e.target.value)}
              label="Logging Level"
            >
              <MenuItem value="minimal">Minimal - Errors only</MenuItem>
              <MenuItem value="standard">Standard - Key events</MenuItem>
              <MenuItem value="detailed">Detailed - Full trace</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Max Execution Time (seconds)</Typography>
          <Slider
            value={governanceRules.maxExecutionTime}
            onChange={(_, value) => updateRule('maxExecutionTime', value as number)}
            min={30}
            max={600}
            step={30}
            marks={[
              { value: 30, label: '30s' },
              { value: 300, label: '5m' },
              { value: 600, label: '10m' }
            ]}
            valueLabelDisplay="auto"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={governanceRules.crossAgentValidation}
                onChange={(e) => updateRule('crossAgentValidation', e.target.checked)}
              />
            }
            label="Enable Cross-Agent Validation"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Rate Limit (requests/minute)"
            type="number"
            value={governanceRules.rateLimiting.requestsPerMinute}
            onChange={(e) => updateRateLimiting('requestsPerMinute', parseInt(e.target.value) || 60)}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Burst Limit"
            type="number"
            value={governanceRules.rateLimiting.burstLimit}
            onChange={(e) => updateRateLimiting('burstLimit', parseInt(e.target.value) || 10)}
            margin="normal"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

// Success component with "What You Can Do Next" links
const SuccessStep: React.FC<{ systemId: string | null }> = ({ systemId }) => (
  <Box textAlign="center" py={10} px={6}>
    <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
    
    <Typography variant="h4" gutterBottom>
      Multi-Agent System Successfully Created
    </Typography>
    <Typography variant="body1" color="text.secondary" mb={2}>
      Your multi-agent system is now wrapped with governance controls
    </Typography>
    {systemId && (
      <Typography variant="body2" color="text.secondary" mb={6}>
        System ID: {systemId}
      </Typography>
    )}
    
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
          View system dashboard
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
  const { createSystem } = useMultiAgentSystems();
  
  // System configuration state
  const [systemName, setSystemName] = useState('');
  const [systemDescription, setSystemDescription] = useState('');
  const [systemType, setSystemType] = useState<FlowType>('sequential');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentRoles, setAgentRoles] = useState<{ [agentId: string]: AgentRole }>({});
  const [connections, setConnections] = useState<AgentConnection[]>([]);
  const [governanceRules, setGovernanceRules] = useState<MultiAgentSystem['governanceRules']>({
    crossAgentValidation: true,
    errorHandling: 'fallback',
    loggingLevel: 'standard',
    governancePolicy: 'standard',
    maxExecutionTime: 300,
    rateLimiting: {
      requestsPerMinute: 60,
      burstLimit: 10
    }
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdSystemId, setCreatedSystemId] = useState<string | null>(null);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleCreateSystem();
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleAgentSelect = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      // Remove agent
      setSelectedAgents(prev => prev.filter(id => id !== agentId));
      // Remove agent role
      const newRoles = { ...agentRoles };
      delete newRoles[agentId];
      setAgentRoles(newRoles);
      // Remove connections involving this agent
      setConnections(prev => prev.filter(conn => 
        conn.sourceAgentId !== agentId && conn.targetAgentId !== agentId
      ));
    } else {
      // Add agent
      setSelectedAgents(prev => [...prev, agentId]);
      // Add default role
      setAgentRoles(prev => ({
        ...prev,
        [agentId]: {
          id: uuidv4(),
          name: `Role for ${agentId}`,
          description: 'Default role description',
          responsibilities: ['Process input', 'Generate output'],
          inputTypes: ['text'],
          outputTypes: ['text']
        }
      }));
    }
  };

  const handleCreateSystem = async () => {
    setIsCreating(true);
    
    try {
      const systemId = uuidv4();
      const system: MultiAgentSystem = {
        id: systemId,
        name: systemName,
        description: systemDescription,
        version: '1.0.0',
        flowType: systemType,
        agents: selectedAgents.map((agentId, index) => ({
          agentId,
          role: agentRoles[agentId],
          position: { x: index * 200, y: 100 }
        })),
        connections,
        governanceRules,
        metrics: {
          requestCount: 0,
          successCount: 0,
          errorCount: 0,
          averageResponseTime: 0,
          averageSystemResponseTime: 0,
          agentFailureRates: {},
          systemUptime: 100
        },
        enabled: false,
        environment: 'draft',
        userId: '', // Will be set by the registry
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const success = await createSystem(system);
      if (success) {
        setCreatedSystemId(systemId);
        setActiveStep(steps.length); // Move to success step
      } else {
        throw new Error('Failed to create multi-agent system');
      }
    } catch (error) {
      console.error('Error creating system:', error);
      // Handle error - could show a snackbar or error message
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: // Basic Information
        return systemName.trim() !== '' && systemDescription.trim() !== '';
      case 1: // Agent Selection
        return selectedAgents.length >= 2;
      case 2: // Flow Configuration
        return true; // Always can proceed from flow config
      case 3: // Governance Rules
        return true; // Always can proceed from governance
      default:
        return true;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>System Information</Typography>
            <TextField
              fullWidth
              label="System Name"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={systemDescription}
              onChange={(e) => setSystemDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>System Type</InputLabel>
              <Select
                value={systemType}
                onChange={(e) => setSystemType(e.target.value as FlowType)}
                label="System Type"
              >
                <MenuItem value="sequential">Sequential - Agents execute in order</MenuItem>
                <MenuItem value="parallel">Parallel - Agents execute simultaneously</MenuItem>
                <MenuItem value="conditional">Conditional - Execution based on conditions</MenuItem>
                <MenuItem value="custom">Custom - User-defined flow</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      case 1:
        return (
          <Box>
            <AgentLibrary 
              onAgentSelect={handleAgentSelect}
              selectedAgents={selectedAgents}
            />
            <AgentCompositionCanvas />
          </Box>
        );
      case 2:
        return (
          <FlowConfiguration
            flowType={systemType}
            onFlowTypeChange={setSystemType}
            connections={connections}
            onConnectionsChange={setConnections}
            selectedAgents={selectedAgents}
          />
        );
      case 3:
        return (
          <GovernanceRules
            governanceRules={governanceRules}
            onGovernanceRulesChange={setGovernanceRules}
          />
        );
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Configuration</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>System Details</Typography>
                    <Typography><strong>Name:</strong> {systemName}</Typography>
                    <Typography><strong>Type:</strong> {systemType}</Typography>
                    <Typography><strong>Agents:</strong> {selectedAgents.length}</Typography>
                    <Typography><strong>Connections:</strong> {connections.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Governance</Typography>
                    <Typography><strong>Policy:</strong> {governanceRules.governancePolicy}</Typography>
                    <Typography><strong>Error Handling:</strong> {governanceRules.errorHandling}</Typography>
                    <Typography><strong>Logging:</strong> {governanceRules.loggingLevel}</Typography>
                    <Typography><strong>Max Time:</strong> {governanceRules.maxExecutionTime}s</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return <SuccessStep systemId={createdSystemId} />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Multi-Agent System Wrapper
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" mb={4}>
        Create governed multi-agent systems from your wrapped agents
      </Typography>

      <Box maxWidth="lg" mx="auto">
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card>
          <CardContent sx={{ p: 4 }}>
            {renderStepContent(activeStep)}
          </CardContent>
        </Card>

        {activeStep < steps.length && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!canProceed() || isCreating}
            >
              {activeStep === steps.length - 1 ? 
                (isCreating ? 'Creating System...' : 'Create System') : 
                'Next'
              }
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default MultiAgentWrappingWizard;

