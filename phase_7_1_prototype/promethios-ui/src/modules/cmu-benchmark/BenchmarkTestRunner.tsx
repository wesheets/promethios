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

export const BenchmarkTestRunner: React.FC = () => {
  const [demoAgents, setDemoAgents] = useState<DemoAgent[]>([]);
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDemoAgents();
    loadTestScenarios();
  }, []);

  const loadDemoAgents = async () => {
    try {
      // Simulate API call to fetch demo agents
      const mockAgents: DemoAgent[] = [
        {
          id: 'baseline-agent',
          name: 'Baseline Agent',
          description: 'A simple rule-based agent for baseline comparison',
          capabilities: ['basic-reasoning'],
          provider: 'mock'
        },
        {
          id: 'factual-agent',
          name: 'Factual Agent',
          description: 'Specialized in factual accuracy and information retrieval',
          capabilities: ['information-retrieval', 'fact-checking'],
          provider: 'mock'
        },
        {
          id: 'creative-agent',
          name: 'Creative Agent',
          description: 'Focused on creative and diverse responses',
          capabilities: ['creative-writing', 'ideation'],
          provider: 'mock'
        },
        {
          id: 'governance-agent',
          name: 'Governance-Focused Agent',
          description: 'Emphasizes compliance with governance rules',
          capabilities: ['policy-adherence', 'risk-assessment'],
          provider: 'mock'
        },
        {
          id: 'multi-tool-agent',
          name: 'Multi-Tool Agent',
          description: 'Demonstrates tool use across various domains',
          capabilities: ['tool-use', 'api-integration'],
          provider: 'mock'
        }
      ];
      setDemoAgents(mockAgents);
    } catch (err) {
      setError('Failed to load demo agents');
    }
  };

  const loadTestScenarios = async () => {
    try {
      // Simulate API call to fetch test scenarios
      const mockScenarios: TestScenario[] = [
        {
          id: 'simple-qa',
          name: 'Simple Question Answering',
          description: 'Evaluates basic factual recall and response generation.',
          inputs: [{ type: 'text', content: 'What is the capital of France?' }],
          evaluationCriteria: [{ type: 'accuracy', threshold: 0.9 }]
        },
        {
          id: 'complex-problem-solving',
          name: 'Complex Problem Solving',
          description: 'Tests multi-step reasoning and tool integration.',
          inputs: [{ 
            type: 'text', 
            content: 'Given a spreadsheet of sales data, identify the top 5 performing products and summarize their quarterly growth.' 
          }],
          evaluationCriteria: [{ type: 'task-completion', threshold: 0.8 }]
        }
      ];
      setTestScenarios(mockScenarios);
    } catch (err) {
      setError('Failed to load test scenarios');
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

    try {
      // Simulate benchmark execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock results
      const mockResults: BenchmarkResult = {
        id: 'test_123',
        agentResults: {},
        status: 'completed'
      };

      selectedAgents.forEach(agentId => {
        const agent = demoAgents.find(a => a.id === agentId);
        if (agent) {
          mockResults.agentResults[agentId] = {
            overallScore: Math.random() * 0.4 + 0.6, // Random score between 0.6-1.0
            metricScores: {
              'response-quality': Math.random() * 0.3 + 0.7,
              'factual-accuracy': Math.random() * 0.3 + 0.7,
              'governance-compliance': Math.random() * 0.3 + 0.7
            },
            responses: [
              { role: 'agent', content: `Sample response from ${agent.name}` }
            ]
          };
        }
      });

      setResults(mockResults);
    } catch (err) {
      setError('Failed to run benchmark test');
    } finally {
      setIsRunning(false);
    }
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

              {isRunning && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#ccc' }}>
                    Running benchmark test...
                  </Typography>
                  <LinearProgress sx={{ backgroundColor: '#555', '& .MuiLinearProgress-bar': { backgroundColor: '#1976d2' } }} />
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
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default BenchmarkTestRunner;

