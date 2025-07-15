/**
 * Uncertainty Reduction Tracker
 * 
 * Visual tracking component for monitoring uncertainty reduction progress
 * during Enhanced Veritas 2 multi-agent collaboration sessions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import {
  Psychology,
  TrendingDown,
  TrendingUp,
  TimelineIcon as TimelineIcon,
  Speed,
  Target,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  Download
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';

interface UncertaintyDataPoint {
  timestamp: number;
  overall: number;
  epistemic: number;
  aleatoric: number;
  confidence: number;
  contextual: number;
  temporal: number;
  social: number;
  milestone?: string;
  intervention?: string;
}

interface UncertaintyMilestone {
  id: string;
  timestamp: number;
  type: 'target' | 'threshold' | 'intervention' | 'breakthrough';
  value: number;
  description: string;
  achieved: boolean;
}

interface UncertaintyReductionTrackerProps {
  sessionId?: string;
  timeSeriesData?: any[];
  targetReduction?: number;
  onMilestoneReached?: (milestone: UncertaintyMilestone) => void;
  onInterventionNeeded?: (reason: string) => void;
  className?: string;
}

const UncertaintyReductionTracker: React.FC<UncertaintyReductionTrackerProps> = ({
  sessionId,
  timeSeriesData = [],
  targetReduction = 0.7,
  onMilestoneReached,
  onInterventionNeeded,
  className = ''
}) => {
  const [uncertaintyData, setUncertaintyData] = useState<UncertaintyDataPoint[]>([]);
  const [milestones, setMilestones] = useState<UncertaintyMilestone[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');
  const [showProjection, setShowProjection] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [reductionRate, setReductionRate] = useState<number>(0);
  const [estimatedCompletion, setEstimatedCompletion] = useState<Date | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Initialize data and milestones
  useEffect(() => {
    if (timeSeriesData.length > 0) {
      generateUncertaintyData();
      initializeMilestones();
    }
  }, [timeSeriesData, targetReduction]);

  // Calculate metrics when data changes
  useEffect(() => {
    if (uncertaintyData.length > 1) {
      calculateReductionRate();
      estimateCompletion();
      checkForAlerts();
    }
  }, [uncertaintyData]);

  const generateUncertaintyData = () => {
    const data: UncertaintyDataPoint[] = timeSeriesData.map((point, index) => {
      const baseUncertainty = point.uncertainty || 0.8;
      
      return {
        timestamp: point.timestamp || Date.now() - (timeSeriesData.length - index) * 60000,
        overall: baseUncertainty,
        epistemic: baseUncertainty * 0.9 + Math.random() * 0.1,
        aleatoric: baseUncertainty * 0.8 + Math.random() * 0.2,
        confidence: baseUncertainty * 1.1 - Math.random() * 0.1,
        contextual: baseUncertainty * 0.85 + Math.random() * 0.15,
        temporal: baseUncertainty * 0.7 + Math.random() * 0.3,
        social: baseUncertainty * 0.6 + Math.random() * 0.4,
        milestone: index % 5 === 0 ? `Milestone ${Math.floor(index / 5) + 1}` : undefined,
        intervention: Math.random() > 0.9 ? 'HITL Intervention' : undefined
      };
    });

    setUncertaintyData(data);
  };

  const initializeMilestones = () => {
    const now = Date.now();
    const sessionDuration = 30 * 60 * 1000; // 30 minutes
    
    const initialMilestones: UncertaintyMilestone[] = [
      {
        id: 'initial-reduction',
        timestamp: now + 5 * 60 * 1000,
        type: 'threshold',
        value: 0.6,
        description: 'Initial uncertainty reduction (40%)',
        achieved: false
      },
      {
        id: 'halfway-point',
        timestamp: now + 15 * 60 * 1000,
        type: 'target',
        value: 0.4,
        description: 'Halfway to target reduction',
        achieved: false
      },
      {
        id: 'target-achievement',
        timestamp: now + sessionDuration,
        type: 'target',
        value: 1 - targetReduction,
        description: `Target reduction achieved (${(targetReduction * 100).toFixed(0)}%)`,
        achieved: false
      },
      {
        id: 'excellence-threshold',
        timestamp: now + sessionDuration * 1.2,
        type: 'breakthrough',
        value: 0.1,
        description: 'Excellence threshold (90% reduction)',
        achieved: false
      }
    ];

    setMilestones(initialMilestones);
  };

  const calculateReductionRate = () => {
    if (uncertaintyData.length < 2) return;

    const recent = uncertaintyData.slice(-5); // Last 5 data points
    const firstValue = recent[0].overall;
    const lastValue = recent[recent.length - 1].overall;
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    
    if (timeSpan > 0) {
      const rate = (firstValue - lastValue) / (timeSpan / 60000); // Per minute
      setReductionRate(rate);
    }
  };

  const estimateCompletion = () => {
    if (reductionRate <= 0 || uncertaintyData.length === 0) {
      setEstimatedCompletion(null);
      return;
    }

    const currentUncertainty = uncertaintyData[uncertaintyData.length - 1].overall;
    const targetUncertainty = 1 - targetReduction;
    const remainingReduction = currentUncertainty - targetUncertainty;
    
    if (remainingReduction <= 0) {
      setEstimatedCompletion(new Date());
      return;
    }

    const estimatedMinutes = remainingReduction / reductionRate;
    const estimatedTime = new Date(Date.now() + estimatedMinutes * 60000);
    setEstimatedCompletion(estimatedTime);
  };

  const checkForAlerts = () => {
    const newAlerts: string[] = [];
    
    if (uncertaintyData.length < 2) return;

    const currentUncertainty = uncertaintyData[uncertaintyData.length - 1].overall;
    const previousUncertainty = uncertaintyData[uncertaintyData.length - 2].overall;
    
    // Check for stalled reduction
    if (reductionRate < 0.01 && uncertaintyData.length > 10) {
      newAlerts.push('Uncertainty reduction has stalled. Consider intervention.');
    }

    // Check for regression
    if (currentUncertainty > previousUncertainty + 0.05) {
      newAlerts.push('Uncertainty is increasing. Review collaboration strategy.');
    }

    // Check for slow progress
    const sessionDuration = Date.now() - uncertaintyData[0].timestamp;
    const expectedReduction = (sessionDuration / (30 * 60 * 1000)) * targetReduction;
    const actualReduction = uncertaintyData[0].overall - currentUncertainty;
    
    if (actualReduction < expectedReduction * 0.5 && sessionDuration > 5 * 60 * 1000) {
      newAlerts.push('Progress is slower than expected. Consider additional agents.');
    }

    setAlerts(newAlerts);

    // Trigger intervention callback
    if (newAlerts.length > 0 && onInterventionNeeded) {
      onInterventionNeeded(newAlerts[0]);
    }
  };

  const checkMilestones = () => {
    if (uncertaintyData.length === 0) return;

    const currentUncertainty = uncertaintyData[uncertaintyData.length - 1].overall;
    const currentTime = Date.now();

    setMilestones(prev => 
      prev.map(milestone => {
        if (!milestone.achieved && currentUncertainty <= milestone.value) {
          if (onMilestoneReached) {
            onMilestoneReached(milestone);
          }
          return { ...milestone, achieved: true };
        }
        return milestone;
      })
    );
  };

  // Check milestones when data updates
  useEffect(() => {
    checkMilestones();
  }, [uncertaintyData]);

  const filteredData = useMemo(() => {
    const now = Date.now();
    const timeRangeMs = timeRange === '1h' ? 60 * 60 * 1000 :
                       timeRange === '6h' ? 6 * 60 * 60 * 1000 :
                       24 * 60 * 60 * 1000;
    
    return uncertaintyData.filter(point => 
      now - point.timestamp <= timeRangeMs
    );
  }, [uncertaintyData, timeRange]);

  const currentProgress = useMemo(() => {
    if (uncertaintyData.length === 0) return 0;
    
    const initial = uncertaintyData[0].overall;
    const current = uncertaintyData[uncertaintyData.length - 1].overall;
    const target = 1 - targetReduction;
    
    return Math.max(0, Math.min(1, (initial - current) / (initial - target)));
  }, [uncertaintyData, targetReduction]);

  const getMetricColor = (metric: string): string => {
    const colors = {
      overall: '#4299e1',
      epistemic: '#9f7aea',
      aleatoric: '#ed8936',
      confidence: '#48bb78',
      contextual: '#f56565',
      temporal: '#38b2ac',
      social: '#ecc94b'
    };
    return colors[metric as keyof typeof colors] || '#718096';
  };

  const renderProgressIndicator = () => (
    <Card sx={{ backgroundColor: '#4a5568', color: 'white', mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Reduction Progress</Typography>
          <Chip
            label={`${(currentProgress * 100).toFixed(1)}% Complete`}
            color={currentProgress > 0.8 ? 'success' : currentProgress > 0.5 ? 'warning' : 'default'}
          />
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={currentProgress * 100}
          sx={{
            height: 12,
            borderRadius: 6,
            mb: 2,
            '& .MuiLinearProgress-bar': {
              backgroundColor: currentProgress > 0.8 ? '#48bb78' : 
                             currentProgress > 0.5 ? '#ed8936' : '#4299e1'
            }
          }}
        />
        
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
              Current Rate
            </Typography>
            <Typography variant="h6" color={reductionRate > 0 ? 'success.main' : 'error.main'}>
              {reductionRate > 0 ? '-' : '+'}{Math.abs(reductionRate * 100).toFixed(2)}%/min
            </Typography>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
              Target
            </Typography>
            <Typography variant="h6" color="primary.main">
              {(targetReduction * 100).toFixed(0)}%
            </Typography>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
              Estimated Completion
            </Typography>
            <Typography variant="h6" color="info.main">
              {estimatedCompletion ? 
                estimatedCompletion.toLocaleTimeString() : 
                'Calculating...'
              }
            </Typography>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
              Milestones
            </Typography>
            <Typography variant="h6" color="warning.main">
              {milestones.filter(m => m.achieved).length}/{milestones.length}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderChart = () => (
    <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: 400 }}>
      <CardHeader
        title="Uncertainty Reduction Timeline"
        action={
          <Box display="flex" gap={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: 'white' }}>Metric</InputLabel>
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                sx={{ color: 'white' }}
              >
                <MenuItem value="overall">Overall</MenuItem>
                <MenuItem value="epistemic">Epistemic</MenuItem>
                <MenuItem value="aleatoric">Aleatoric</MenuItem>
                <MenuItem value="confidence">Confidence</MenuItem>
                <MenuItem value="contextual">Contextual</MenuItem>
                <MenuItem value="temporal">Temporal</MenuItem>
                <MenuItem value="social">Social</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel sx={{ color: 'white' }}>Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{ color: 'white' }}
              >
                <MenuItem value="1h">1H</MenuItem>
                <MenuItem value="6h">6H</MenuItem>
                <MenuItem value="24h">24H</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={showProjection}
                  onChange={(e) => setShowProjection(e.target.checked)}
                  size="small"
                />
              }
              label="Projection"
              sx={{ color: 'white' }}
            />
          </Box>
        }
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              stroke="#a0aec0"
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              stroke="#a0aec0"
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: '#4a5568',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Uncertainty']}
            />
            <Legend />
            
            {/* Target line */}
            <ReferenceLine
              y={1 - targetReduction}
              stroke="#48bb78"
              strokeDasharray="5 5"
              label="Target"
            />
            
            {/* Main uncertainty area */}
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke={getMetricColor(selectedMetric)}
              fill={getMetricColor(selectedMetric)}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            
            {/* Milestones */}
            {showMilestones && milestones.map(milestone => (
              <ReferenceLine
                key={milestone.id}
                x={milestone.timestamp}
                stroke={milestone.achieved ? '#48bb78' : '#ed8936'}
                strokeDasharray="2 2"
                label={milestone.description}
              />
            ))}
            
            <Brush
              dataKey="timestamp"
              height={30}
              stroke="#4299e1"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderAlerts = () => {
    if (alerts.length === 0) return null;

    return (
      <Box mb={2}>
        {alerts.map((alert, index) => (
          <Alert
            key={index}
            severity="warning"
            sx={{
              backgroundColor: '#744210',
              color: 'white',
              mb: 1
            }}
            action={
              <Button size="small" color="inherit">
                Address
              </Button>
            }
          >
            {alert}
          </Alert>
        ))}
      </Box>
    );
  };

  const renderMilestones = () => (
    <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <Target />
            <Typography variant="h6">Milestones</Typography>
          </Box>
        }
      />
      <CardContent>
        {milestones.map((milestone) => (
          <Box
            key={milestone.id}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            py={1}
            borderBottom="1px solid #4a5568"
          >
            <Box display="flex" alignItems="center" gap={2}>
              {milestone.achieved ? (
                <CheckCircle sx={{ color: 'success.main' }} />
              ) : (
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '2px solid #4a5568',
                    backgroundColor: 'transparent'
                  }}
                />
              )}
              <Box>
                <Typography variant="body2">{milestone.description}</Typography>
                <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                  Target: {(milestone.value * 100).toFixed(0)}% uncertainty
                </Typography>
              </Box>
            </Box>
            
            <Chip
              label={milestone.type}
              size="small"
              color={
                milestone.type === 'breakthrough' ? 'success' :
                milestone.type === 'target' ? 'primary' :
                milestone.type === 'threshold' ? 'warning' : 'default'
              }
              variant="outlined"
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Box className={className}>
      {renderAlerts()}
      {renderProgressIndicator()}
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          {renderChart()}
        </Grid>
        <Grid item xs={12} lg={4}>
          {renderMilestones()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default UncertaintyReductionTracker;

