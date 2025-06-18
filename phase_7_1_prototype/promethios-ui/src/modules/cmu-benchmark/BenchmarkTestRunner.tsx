import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Assessment as AssessmentIcon,
  Compare as CompareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

interface DemoAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  provider: string;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  inputs: Array<{ type: string; content: string }>;
  evaluationCriteria: Array<{ type: string; threshold: number }>;
}

interface BenchmarkResult {
  id: string;
  agentResults: Record<string, {
    overallScore: number;
    metricScores: Record<string, number>;
    responses: Array<{ role: string; content: string }>;
  }>;
  status: string;
}

interface TestStatus {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentOperation?: string;
  startTime?: number;
  endTime?: number;
  error?: string;
}

// Configuration for the backend API
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://promethios-phase-7-1-api.onrender.com/api/benchmark' 
  : 'https://promethios-phase-7-1-api.onrender.com/api/benchmark';

const BenchmarkTestRunner: React.FC = () => {
  const [demoAgents, setDemoAgents] = useState<DemoAgent[]>([]);
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string>('');
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null);
  const [currentTestId, setCurrentTestId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDemoAgents();
    loadTestScenarios();
  }, []);

  const loadDemoAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/agents`);
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }
      const agents = await response.json();
      setDemoAgents(agents);
    } catch (err) {
      console.error('Error loading demo agents:', err);
      setError('Failed to load demo agents. Please check if the backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadTestScenarios = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/scenarios`);
      if (!response.ok) {
        throw new Error(`Failed to fetch scenarios: ${response.statusText}`);
      }
      const scenarios = await response.json();
      setTestScenarios(scenarios);
    } catch (err) {
      console.error('Error loading test scenarios:', err);
      setError('Failed to load test scenarios. Please check if the backend service is running.');
    }
  };

  const handleRunBenchmark = async () => {
    if (selectedAgents.length === 0 || !selectedScenario) {
      setError('Please select at least one agent and a test scenario');
      return;
    }

    setIsRunning(true);
    setError('');
    setResults(null);
    setTestStatus(null);

    try {
      const response = await fetch(`${API_BASE_URL}/run-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedAgents,
          selectedScenario,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start benchmark test: ${response.statusText}`);
      }

      const { testId } = await response.json();
      setCurrentTestId(testId);
      
      // Start polling for test status
      pollTestStatus(testId);
    } catch (err) {
      console.error('Error running benchmark:', err);
      setError('Failed to run benchmark test. Please check if the backend service is running.');
      setIsRunning(false);
    }
  };

  const pollTestStatus = async (testId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/test-status/${testId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch test status: ${response.statusText}`);
        }

        const status = await response.json();
        setTestStatus(status);

        if (status.status === 'completed') {
          clearInterval(pollInterval);
          setIsRunning(false);
          
          // Fetch the results
          const resultsResponse = await fetch(`${API_BASE_URL}/test-results/${testId}`);
          if (resultsResponse.ok) {
            const results = await resultsResponse.json();
            setResults(results);
          }
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          setIsRunning(false);
          setError(status.error || 'Test failed');
        }
      } catch (err) {
        console.error('Error polling test status:', err);
        clearInterval(pollInterval);
        setIsRunning(false);
        setError('Failed to get test status');
      }
    }, 1000); // Poll every second

    // Clean up interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isRunning) {
        setIsRunning(false);
        setError('Test timed out');
      }
    }, 300000);
  };

  const handleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const getAgentName = (agentId: string) => {
    return demoAgents.find(agent => agent.id === agentId)?.name || agentId;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
          CMU Benchmark Test Runner
        </Typography>
        <LinearProgress sx={{ backgroundColor: '#555', '& .MuiLinearProgress-bar': { backgroundColor: '#1976d2' } }} />
        <Typography sx={{ mt: 2, color: '#ccc' }}>Loading benchmark data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        CMU Benchmark Test Runner
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: '#d32f2f', color: 'white' }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Agent Selection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2a2a2a', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Demo Agents
              </Typography>
              <Grid container spacing={2}>
                {demoAgents.map(agent => (
                  <Grid item xs={12} key={agent.id}>
                    <Card 
                      sx={{ 
                        backgroundColor: selectedAgents.includes(agent.id) ? '#3a3a3a' : '#333',
                        cursor: 'pointer',
                        border: selectedAgents.includes(agent.id) ? '2px solid #1976d2' : '1px solid #555'
                      }}
                      onClick={() => handleAgentSelection(agent.id)}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ color: 'white' }}>
                          {agent.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                          {agent.description}
                        </Typography>
                        <Box>
                          {agent.capabilities.map(capability => (
                            <Chip 
                              key={capability} 
                              label={capability} 
                              size="small" 
                              sx={{ mr: 0.5, mb: 0.5, backgroundColor: '#555', color: 'white' }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Scenario Selection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2a2a2a', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Test Scenario
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: 'white' }}>Test Scenario</InputLabel>
                <Select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}
                >
                  {testScenarios.map(scenario => (
                    <MenuItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedScenario && (
                <Box>
                  {testScenarios
                    .filter(scenario => scenario.id === selectedScenario)
                    .map(scenario => (
                      <Box key={scenario.id}>
                        <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                          {scenario.description}
                        </Typography>
                        <Accordion sx={{ backgroundColor: '#333' }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                            <Typography sx={{ color: 'white' }}>View Details</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                              Test Input:
                            </Typography>
                            {scenario.inputs.map((input, index) => (
                              <Typography key={index} variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                                {input.content}
                              </Typography>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </Box>
                    ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Run Test */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#2a2a2a', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Run Benchmark Test
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={handleRunBenchmark}
                  disabled={isRunning || selectedAgents.length === 0 || !selectedScenario}
                  sx={{ backgroundColor: '#1976d2' }}
                >
                  {isRunning ? 'Running...' : 'Run Test'}
                </Button>
              </Box>

              {selectedAgents.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Selected Agents:
                  </Typography>
                  {selectedAgents.map(agentId => (
                    <Chip 
                      key={agentId} 
                      label={getAgentName(agentId)} 
                      sx={{ mr: 1, backgroundColor: '#1976d2', color: 'white' }}
                    />
                  ))}
                </Box>
              )}

              {testStatus && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#ccc' }}>
                    Status: {testStatus.status} - {testStatus.currentOperation}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={testStatus.progress} 
                    sx={{ backgroundColor: '#555', '& .MuiLinearProgress-bar': { backgroundColor: '#1976d2' } }} 
                  />
                  <Typography variant="caption" sx={{ color: '#ccc' }}>
                    {testStatus.progress}% complete
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        {results && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#2a2a2a', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssessmentIcon sx={{ mr: 1 }} />
                    Benchmark Results
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    sx={{ color: 'white', borderColor: 'white' }}
                    onClick={() => {
                      const dataStr = JSON.stringify(results, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      const exportFileDefaultName = `benchmark-results-${new Date().toISOString()}.json`;
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    }}
                  >
                    Export Results
                  </Button>
                </Box>

                <TableContainer component={Paper} sx={{ backgroundColor: '#333' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Agent</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Overall Score</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Response Quality</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Factual Accuracy</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Governance Compliance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(results.agentResults).map(([agentId, result]) => (
                        <TableRow key={agentId}>
                          <TableCell sx={{ color: 'white' }}>
                            {getAgentName(agentId)}
                          </TableCell>
                          <TableCell sx={{ color: 'white' }}>
                            {(result.overallScore * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell sx={{ color: 'white' }}>
                            {(result.metricScores['response-quality'] * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell sx={{ color: 'white' }}>
                            {(result.metricScores['factual-accuracy'] * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell sx={{ color: 'white' }}>
                            {(result.metricScores['governance-compliance'] * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Detailed Response Analysis */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Agent Responses
                  </Typography>
                  {Object.entries(results.agentResults).map(([agentId, result]) => (
                    <Accordion key={agentId} sx={{ backgroundColor: '#333', mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                        <Typography sx={{ color: 'white' }}>
                          {getAgentName(agentId)} - {(result.overallScore * 100).toFixed(1)}% Overall Score
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                          {result.responses[0]?.content || 'No response available'}
                        </Typography>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                            Detailed Metrics:
                          </Typography>
                          {Object.entries(result.metricScores).map(([metric, score]) => (
                            <Chip 
                              key={metric}
                              label={`${metric}: ${(score * 100).toFixed(1)}%`}
                              size="small"
                              sx={{ mr: 1, mb: 1, backgroundColor: '#555', color: 'white' }}
                            />
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default BenchmarkTestRunner;

