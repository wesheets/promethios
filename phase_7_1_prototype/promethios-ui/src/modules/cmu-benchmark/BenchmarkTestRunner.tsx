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
  Download as DownloadIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { BenchmarkChatPopup } from './BenchmarkChatPopup';

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

export const BenchmarkTestRunner: React.FC = () => {
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
  const [chatPopupOpen, setChatPopupOpen] = useState(false);

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

  const handleRunBenchmark = () => {
    if (selectedAgents.length === 0) {
      setError('Please select at least one agent');
      return;
    }

    // Open the chat popup with selected agents and available scenarios
    setChatPopupOpen(true);
    setError('');
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

      {/* Introduction Section */}
      <Card sx={{ 
        backgroundColor: '#0f172a', 
        border: '1px solid #334155',
        borderRadius: '12px',
        mb: 4,
        overflow: 'hidden'
      }}>
        <Box sx={{
          background: 'linear-gradient(90deg, #1e40af, #7c3aed)',
          height: '4px'
        }} />
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Typography sx={{ fontSize: '24px' }}>🧪</Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ 
                color: 'white',
                fontWeight: 600,
                mb: 2
              }}>
                About CMU Agent Company Benchmark
              </Typography>
              
              <Typography variant="body1" sx={{ 
                color: '#cbd5e1',
                lineHeight: 1.6,
                mb: 3
              }}>
                The CMU Agent Company benchmark is a comprehensive evaluation framework designed to test AI agents' 
                ability to perform complex, multi-step tasks in realistic business scenarios. This interactive test 
                environment allows you to compare different agents' performance across various dimensions.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    p: 3
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#3b82f6',
                      fontWeight: 600,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📊 What We Test
                    </Typography>
                    <Box component="ul" sx={{ 
                      color: '#94a3b8',
                      pl: 2,
                      m: 0,
                      '& li': { mb: 0.5 }
                    }}>
                      <li>Task completion accuracy</li>
                      <li>Multi-step reasoning</li>
                      <li>Tool usage efficiency</li>
                      <li>Error handling & recovery</li>
                      <li>Governance compliance</li>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    p: 3
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#10b981',
                      fontWeight: 600,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📈 Results You'll See
                    </Typography>
                    <Box component="ul" sx={{ 
                      color: '#94a3b8',
                      pl: 2,
                      m: 0,
                      '& li': { mb: 0.5 }
                    }}>
                      <li>Overall performance scores</li>
                      <li>Task-by-task breakdown</li>
                      <li>Response time metrics</li>
                      <li>Trust & safety ratings</li>
                      <li>Comparative analysis</li>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    p: 3
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#f59e0b',
                      fontWeight: 600,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      🎯 How It Works
                    </Typography>
                    <Box component="ul" sx={{ 
                      color: '#94a3b8',
                      pl: 2,
                      m: 0,
                      '& li': { mb: 0.5 }
                    }}>
                      <li>Select agents to test</li>
                      <li>Start interactive session</li>
                      <li>Choose test scenarios</li>
                      <li>Watch real-time execution</li>
                      <li>Review detailed results</li>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </CardContent>
      </Card>

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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Select Demo Agents
                </Typography>
                <Chip 
                  label={`${selectedAgents.length} Selected`}
                  sx={{ 
                    backgroundColor: selectedAgents.length > 0 ? '#10b981' : '#6b7280',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
              </Box>
              <Grid container spacing={2}>
                {demoAgents.map(agent => {
                  const isSelected = selectedAgents.includes(agent.id);
                  return (
                    <Grid item xs={12} key={agent.id}>
                      <Card 
                        sx={{ 
                          backgroundColor: isSelected ? '#1e3a8a' : '#2d3748',
                          cursor: 'pointer',
                          border: isSelected ? '2px solid #3b82f6' : '1px solid #4a5568',
                          borderRadius: '12px',
                          transition: 'all 0.2s ease-in-out',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            backgroundColor: isSelected ? '#1e40af' : '#374151',
                            borderColor: isSelected ? '#60a5fa' : '#6b7280',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                          },
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: isSelected 
                              ? 'linear-gradient(90deg, #3b82f6, #10b981)' 
                              : 'transparent',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}
                        onClick={() => handleAgentSelection(agent.id)}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ 
                                color: 'white',
                                fontWeight: 600,
                                mb: 0.5
                              }}>
                                {agent.name}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: '#a0aec0',
                                lineHeight: 1.5,
                                mb: 2
                              }}>
                                {agent.description}
                              </Typography>
                            </Box>
                            {isSelected && (
                              <Box sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                ml: 2
                              }}>
                                <Typography sx={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                                  ✓
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Typography variant="caption" sx={{ 
                              color: '#6b7280',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Provider:
                            </Typography>
                            <Chip 
                              label={agent.provider || 'OpenAI'}
                              size="small"
                              sx={{ 
                                backgroundColor: '#374151',
                                color: '#d1d5db',
                                fontSize: '0.75rem',
                                height: 20
                              }}
                            />
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" sx={{ 
                              color: '#6b7280',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              display: 'block',
                              mb: 1
                            }}>
                              Capabilities:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {agent.capabilities.map((capability, index) => (
                                <Chip 
                                  key={capability} 
                                  label={capability} 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: isSelected ? '#1e40af' : '#4a5568',
                                    color: isSelected ? '#bfdbfe' : '#d1d5db',
                                    fontSize: '0.75rem',
                                    height: 24,
                                    '&:hover': {
                                      backgroundColor: isSelected ? '#1d4ed8' : '#6b7280'
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Scenario Selection - REMOVED */}
        {/* Scenarios will now be available in the chat popup */}

        {/* Run Test */}
        <Grid item xs={12}>
          <Card sx={{ 
            backgroundColor: '#2a2a2a', 
            color: 'white',
            borderRadius: '12px',
            border: '1px solid #4a5568'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    mb: 1
                  }}>
                    🚀 Run Benchmark Test
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Start an interactive test session with your selected agents
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ChatIcon />}
                  onClick={handleRunBenchmark}
                  disabled={selectedAgents.length === 0}
                  sx={{ 
                    backgroundColor: selectedAgents.length > 0 ? '#10b981' : '#6b7280',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: selectedAgents.length > 0 
                      ? '0 4px 14px 0 rgba(16, 185, 129, 0.3)' 
                      : 'none',
                    '&:hover': {
                      backgroundColor: selectedAgents.length > 0 ? '#059669' : '#6b7280',
                      boxShadow: selectedAgents.length > 0 
                        ? '0 6px 20px 0 rgba(16, 185, 129, 0.4)' 
                        : 'none'
                    },
                    '&:disabled': {
                      backgroundColor: '#6b7280',
                      color: '#9ca3af'
                    }
                  }}
                >
                  Start Interactive Test
                </Button>
              </Box>

              {/* Requirements Check */}
              <Box sx={{ 
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                p: 3,
                mb: 3
              }}>
                <Typography variant="subtitle2" sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Requirements Check:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: selectedAgents.length > 0 ? '#10b981' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography sx={{ 
                        color: 'white', 
                        fontSize: '12px', 
                        fontWeight: 'bold' 
                      }}>
                        {selectedAgents.length > 0 ? '✓' : '○'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: selectedAgents.length > 0 ? '#d1fae5' : '#9ca3af'
                    }}>
                      Select at least one agent ({selectedAgents.length} selected)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography sx={{ 
                        color: 'white', 
                        fontSize: '12px', 
                        fontWeight: 'bold' 
                      }}>
                        ✓
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: '#d1fae5'
                    }}>
                      Test scenarios available in chat popup
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {selectedAgents.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    mb: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Selected Agents:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedAgents.map(agentId => (
                      <Chip 
                        key={agentId} 
                        label={getAgentName(agentId)} 
                        sx={{ 
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: '#2563eb'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {testStatus && (
                <Box sx={{ 
                  backgroundColor: '#1e3a8a',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  p: 3
                }}>
                  <Typography variant="body2" sx={{ 
                    mb: 2, 
                    color: '#bfdbfe',
                    fontWeight: 500
                  }}>
                    Status: {testStatus.status} - {testStatus.currentOperation}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={testStatus.progress} 
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#1e40af', 
                      '& .MuiLinearProgress-bar': { 
                        backgroundColor: '#10b981',
                        borderRadius: 4
                      } 
                    }} 
                  />
                  <Typography variant="caption" sx={{ 
                    color: '#bfdbfe',
                    fontWeight: 500,
                    mt: 1,
                    display: 'block'
                  }}>
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

      {/* Benchmark Chat Popup */}
      <BenchmarkChatPopup
        open={chatPopupOpen}
        onClose={() => setChatPopupOpen(false)}
        selectedAgents={selectedAgents}
        selectedScenario=""
        demoAgents={demoAgents}
        testScenarios={testScenarios}
      />
    </Box>
  );
};

export default BenchmarkTestRunner;

