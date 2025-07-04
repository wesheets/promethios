/**
 * Quantum Uncertainty Visualization
 * 
 * Advanced visualization dashboard for quantum uncertainty modeling and analysis.
 * Provides real-time quantum state displays, entanglement visualization,
 * temporal evolution tracking, and quantum-enhanced uncertainty insights.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  useTheme
} from '@mui/material';
import {
  Science as ScienceIcon,
  Timeline as TimelineIcon,
  Grain as GrainIcon,
  Waves as WavesIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterPlot,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface QuantumUncertaintyVisualizationProps {
  uncertaintyAnalysis?: any;
  sessionId?: string;
  onConfigurationChange?: (config: any) => void;
}

interface QuantumState {
  stateId: string;
  amplitude: number;
  phase: number;
  coherence: number;
  entanglement: number;
  uncertainty: number;
  timestamp: string;
}

interface QuantumEntanglement {
  entanglementId: string;
  agentPair: [string, string];
  entanglementStrength: number;
  correlationType: 'positive' | 'negative' | 'complex';
  bellState: string;
  fidelity: number;
  decoherenceTime: number;
}

interface QuantumMetrics {
  quantumAdvantage: number;
  coherenceTime: number;
  entanglementCount: number;
  quantumVolume: number;
  uncertaintyReduction: number;
  predictionAccuracy: number;
  quantumEfficiency: number;
  decoherenceRate: number;
}

interface TemporalEvolution {
  time: number;
  quantumState: QuantumState;
  classicalUncertainty: number;
  quantumUncertainty: number;
  coherence: number;
  entanglement: number;
}

const QuantumUncertaintyVisualization: React.FC<QuantumUncertaintyVisualizationProps> = ({
  uncertaintyAnalysis,
  sessionId,
  onConfigurationChange
}) => {
  const theme = useTheme();
  const [quantumStates, setQuantumStates] = useState<QuantumState[]>([]);
  const [quantumEntanglements, setQuantumEntanglements] = useState<QuantumEntanglement[]>([]);
  const [quantumMetrics, setQuantumMetrics] = useState<QuantumMetrics | null>(null);
  const [temporalEvolution, setTemporalEvolution] = useState<TemporalEvolution[]>([]);
  const [quantumConfig, setQuantumConfig] = useState({
    quantumEnabled: true,
    coherenceThreshold: 0.7,
    entanglementDetection: true,
    temporalPrediction: true,
    visualizationMode: 'comprehensive',
    updateFrequency: 1000 // milliseconds
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quantum uncertainty data
  const fetchQuantumData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch quantum states
      const states = await fetchQuantumStates();
      setQuantumStates(states);

      // Fetch quantum entanglements
      const entanglements = await fetchQuantumEntanglements();
      setQuantumEntanglements(entanglements);

      // Fetch quantum metrics
      const metrics = await fetchQuantumMetrics();
      setQuantumMetrics(metrics);

      // Fetch temporal evolution
      const evolution = await fetchTemporalEvolution();
      setTemporalEvolution(evolution);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quantum data');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (quantumConfig.quantumEnabled) {
      fetchQuantumData();
      
      // Auto-refresh based on update frequency
      const interval = setInterval(fetchQuantumData, quantumConfig.updateFrequency);
      return () => clearInterval(interval);
    }
  }, [fetchQuantumData, quantumConfig.quantumEnabled, quantumConfig.updateFrequency]);

  // Mock data fetching functions (would connect to actual Quantum Integration service)
  const fetchQuantumStates = async (): Promise<QuantumState[]> => {
    return [
      {
        stateId: 'state-001',
        amplitude: 0.85,
        phase: 1.2,
        coherence: 0.78,
        entanglement: 0.65,
        uncertainty: 0.42,
        timestamp: new Date().toISOString()
      },
      {
        stateId: 'state-002',
        amplitude: 0.72,
        phase: 2.1,
        coherence: 0.82,
        entanglement: 0.58,
        uncertainty: 0.38,
        timestamp: new Date(Date.now() - 1000).toISOString()
      },
      {
        stateId: 'state-003',
        amplitude: 0.91,
        phase: 0.8,
        coherence: 0.75,
        entanglement: 0.72,
        uncertainty: 0.35,
        timestamp: new Date(Date.now() - 2000).toISOString()
      }
    ];
  };

  const fetchQuantumEntanglements = async (): Promise<QuantumEntanglement[]> => {
    return [
      {
        entanglementId: 'ent-001',
        agentPair: ['agent-001', 'agent-002'],
        entanglementStrength: 0.87,
        correlationType: 'positive',
        bellState: '|Φ+⟩',
        fidelity: 0.92,
        decoherenceTime: 150 // milliseconds
      },
      {
        entanglementId: 'ent-002',
        agentPair: ['agent-002', 'agent-003'],
        entanglementStrength: 0.73,
        correlationType: 'negative',
        bellState: '|Ψ-⟩',
        fidelity: 0.85,
        decoherenceTime: 120
      },
      {
        entanglementId: 'ent-003',
        agentPair: ['agent-001', 'agent-003'],
        entanglementStrength: 0.65,
        correlationType: 'complex',
        bellState: '|GHZ⟩',
        fidelity: 0.78,
        decoherenceTime: 95
      }
    ];
  };

  const fetchQuantumMetrics = async (): Promise<QuantumMetrics> => {
    return {
      quantumAdvantage: 0.82,
      coherenceTime: 125, // milliseconds
      entanglementCount: 3,
      quantumVolume: 64,
      uncertaintyReduction: 0.68,
      predictionAccuracy: 0.89,
      quantumEfficiency: 0.75,
      decoherenceRate: 0.08 // per millisecond
    };
  };

  const fetchTemporalEvolution = async (): Promise<TemporalEvolution[]> => {
    const data = [];
    for (let i = 0; i < 20; i++) {
      const time = i * 5; // 5-second intervals
      const coherence = 0.9 * Math.exp(-time * 0.01); // Exponential decay
      const entanglement = 0.8 * Math.exp(-time * 0.008);
      
      data.push({
        time,
        quantumState: {
          stateId: `state-${i}`,
          amplitude: 0.8 + 0.2 * Math.sin(time * 0.1),
          phase: time * 0.1,
          coherence,
          entanglement,
          uncertainty: 0.5 - 0.3 * coherence,
          timestamp: new Date(Date.now() - (20 - i) * 5000).toISOString()
        },
        classicalUncertainty: 0.7 - 0.2 * Math.exp(-time * 0.005),
        quantumUncertainty: 0.5 - 0.3 * coherence,
        coherence,
        entanglement
      });
    }
    return data;
  };

  // Handle configuration changes
  const handleConfigurationChange = useCallback((key: string, value: any) => {
    const newConfig = { ...quantumConfig, [key]: value };
    setQuantumConfig(newConfig);
    onConfigurationChange?.(newConfig);
  }, [quantumConfig, onConfigurationChange]);

  // Get quantum state color based on coherence
  const getQuantumStateColor = (coherence: number) => {
    if (coherence > 0.8) return theme.palette.success.main;
    if (coherence > 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get entanglement color based on strength
  const getEntanglementColor = (strength: number) => {
    if (strength > 0.8) return theme.palette.primary.main;
    if (strength > 0.6) return theme.palette.secondary.main;
    return theme.palette.info.main;
  };

  // Render quantum metrics overview
  const renderQuantumMetricsOverview = () => (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Quantum Uncertainty Metrics"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={quantumConfig.quantumEnabled}
                  onChange={(e) => handleConfigurationChange('quantumEnabled', e.target.checked)}
                  size="small"
                />
              }
              label="Quantum Mode"
            />
            <IconButton onClick={fetchQuantumData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        {quantumMetrics && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {(quantumMetrics.quantumAdvantage * 100).toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Quantum Advantage
                </Typography>
                <Chip
                  icon={<ScienceIcon />}
                  label="Enhanced"
                  size="small"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {quantumMetrics.coherenceTime}ms
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Coherence Time
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(quantumMetrics.coherenceTime / 200) * 100}
                  color="secondary"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {quantumMetrics.entanglementCount}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Entanglements
                </Typography>
                <Chip
                  icon={<GrainIcon />}
                  label={`Vol: ${quantumMetrics.quantumVolume}`}
                  size="small"
                  color="success"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {(quantumMetrics.predictionAccuracy * 100).toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Prediction Accuracy
                </Typography>
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`${(quantumMetrics.quantumEfficiency * 100).toFixed(0)}% efficient`}
                  size="small"
                  color="info"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  // Render quantum states visualization
  const renderQuantumStatesVisualization = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Quantum State Evolution" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temporalEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[0, 1]} />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="coherence"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  name="Coherence"
                />
                <Line
                  type="monotone"
                  dataKey="entanglement"
                  stroke={theme.palette.secondary.main}
                  strokeWidth={2}
                  name="Entanglement"
                />
                <Line
                  type="monotone"
                  dataKey="quantumUncertainty"
                  stroke={theme.palette.error.main}
                  strokeWidth={2}
                  name="Quantum Uncertainty"
                />
                <Line
                  type="monotone"
                  dataKey="classicalUncertainty"
                  stroke={theme.palette.warning.main}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Classical Uncertainty"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Quantum State Distribution" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={quantumStates.map((state, index) => ({
                state: `State ${index + 1}`,
                amplitude: state.amplitude,
                coherence: state.coherence,
                entanglement: state.entanglement,
                uncertainty: 1 - state.uncertainty // Invert for better visualization
              }))}>
                <PolarGrid />
                <PolarAngleAxis dataKey="state" />
                <PolarRadiusAxis domain={[0, 1]} />
                <Radar
                  name="Amplitude"
                  dataKey="amplitude"
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.primary.main}
                  fillOpacity={0.3}
                />
                <Radar
                  name="Coherence"
                  dataKey="coherence"
                  stroke={theme.palette.secondary.main}
                  fill={theme.palette.secondary.main}
                  fillOpacity={0.3}
                />
                <Radar
                  name="Entanglement"
                  dataKey="entanglement"
                  stroke={theme.palette.success.main}
                  fill={theme.palette.success.main}
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Render quantum entanglements
  const renderQuantumEntanglements = () => (
    <Card sx={{ mt: 3 }}>
      <CardHeader title="Quantum Entanglements" />
      <CardContent>
        <Grid container spacing={2}>
          {quantumEntanglements.map((entanglement) => (
            <Grid item xs={12} sm={6} md={4} key={entanglement.entanglementId}>
              <Paper
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: getEntanglementColor(entanglement.entanglementStrength),
                  bgcolor: `${getEntanglementColor(entanglement.entanglementStrength)}10`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GrainIcon
                    sx={{
                      color: getEntanglementColor(entanglement.entanglementStrength),
                      mr: 1
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                    {entanglement.agentPair[0]} ⟷ {entanglement.agentPair[1]}
                  </Typography>
                  <Chip
                    label={entanglement.bellState}
                    size="small"
                    sx={{
                      bgcolor: getEntanglementColor(entanglement.entanglementStrength),
                      color: 'white',
                      fontFamily: 'monospace'
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Entanglement Strength: {(entanglement.entanglementStrength * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={entanglement.entanglementStrength * 100}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <Typography variant="caption" color="textSecondary">Fidelity</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {(entanglement.fidelity * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <Typography variant="caption" color="textSecondary">Decoherence</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {entanglement.decoherenceTime}ms
                    </Typography>
                  </Box>
                </Box>
                
                <Chip
                  label={entanglement.correlationType}
                  size="small"
                  variant="outlined"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  // Render quantum controls
  const renderQuantumControls = () => (
    <Card sx={{ mt: 3 }}>
      <CardHeader title="Quantum Configuration" />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Coherence Threshold
            </Typography>
            <Slider
              value={quantumConfig.coherenceThreshold}
              onChange={(_, value) => handleConfigurationChange('coherenceThreshold', value)}
              min={0.1}
              max={1.0}
              step={0.1}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Update Frequency
            </Typography>
            <Slider
              value={quantumConfig.updateFrequency}
              onChange={(_, value) => handleConfigurationChange('updateFrequency', value)}
              min={500}
              max={5000}
              step={500}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}ms`}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Visualization Mode</InputLabel>
              <Select
                value={quantumConfig.visualizationMode}
                onChange={(e) => handleConfigurationChange('visualizationMode', e.target.value)}
                label="Visualization Mode"
              >
                <MenuItem value="comprehensive">Comprehensive</MenuItem>
                <MenuItem value="states_only">States Only</MenuItem>
                <MenuItem value="entanglement_only">Entanglement Only</MenuItem>
                <MenuItem value="temporal_only">Temporal Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={quantumConfig.entanglementDetection}
                  onChange={(e) => handleConfigurationChange('entanglementDetection', e.target.checked)}
                />
              }
              label="Entanglement Detection"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={quantumConfig.temporalPrediction}
                  onChange={(e) => handleConfigurationChange('temporalPrediction', e.target.checked)}
                />
              }
              label="Temporal Prediction"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (!quantumConfig.quantumEnabled) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <ScienceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Quantum Uncertainty Visualization
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Enable quantum mode to access advanced quantum uncertainty modeling and visualization.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ScienceIcon />}
          onClick={() => handleConfigurationChange('quantumEnabled', true)}
        >
          Enable Quantum Mode
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading quantum uncertainty data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <Typography variant="h6">Quantum Visualization Error</Typography>
        <Typography>{error}</Typography>
        <Button onClick={fetchQuantumData} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Quantum Uncertainty Visualization
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Advanced quantum mechanical modeling of uncertainty with real-time state evolution, 
        entanglement detection, and quantum-enhanced prediction capabilities.
      </Typography>

      {renderQuantumMetricsOverview()}
      {renderQuantumStatesVisualization()}
      {renderQuantumEntanglements()}
      {renderQuantumControls()}
    </Box>
  );
};

export default QuantumUncertaintyVisualization;

