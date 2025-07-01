import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Tooltip,
  Grid,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ThermostatOutlined,
  Security,
  Warning,
  CheckCircle,
  Settings,
  Refresh
} from '@mui/icons-material';

interface AgentScorecard {
  agentId: string;
  agentName: string;
  trustScore: number;
  complianceRate: number;
  violationCount: number;
  status: 'active' | 'inactive' | 'suspended';
  type: 'single' | 'multi-agent';
  lastActivity: string;
}

interface GovernanceHeatmapProps {
  agents: AgentScorecard[];
  timeRange?: '1h' | '24h' | '7d' | '30d';
  showTrustBoundaries?: boolean;
  onAgentClick?: (agentId: string) => void;
  className?: string;
}

interface HeatmapCell {
  agentId: string;
  agentName: string;
  score: number;
  status: string;
  type: string;
  violations: number;
  x: number;
  y: number;
}

/**
 * GovernanceHeatmap Component
 * 
 * Visual heatmap showing governance coverage across agent ecosystem
 * following existing UI patterns and using Recharts like other components
 */
const GovernanceHeatmap: React.FC<GovernanceHeatmapProps> = ({
  agents,
  timeRange = '24h',
  showTrustBoundaries = true,
  onAgentClick,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const [selectedMetric, setSelectedMetric] = useState<'trust' | 'compliance' | 'violations'>('trust');
  const [showBoundaries, setShowBoundaries] = useState(showTrustBoundaries);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);

  // Generate heatmap grid layout
  useEffect(() => {
    const gridSize = Math.ceil(Math.sqrt(agents.length));
    const cells: HeatmapCell[] = agents.map((agent, index) => {
      const x = index % gridSize;
      const y = Math.floor(index / gridSize);
      
      let score = 0;
      switch (selectedMetric) {
        case 'trust':
          score = agent.trustScore;
          break;
        case 'compliance':
          score = agent.complianceRate;
          break;
        case 'violations':
          score = Math.max(0, 100 - (agent.violationCount * 10)); // Invert violations
          break;
      }

      return {
        agentId: agent.agentId,
        agentName: agent.agentName,
        score,
        status: agent.status,
        type: agent.type,
        violations: agent.violationCount,
        x,
        y
      };
    });

    setHeatmapData(cells);
  }, [agents, selectedMetric]);

  // Get color based on score and metric
  const getHeatmapColor = (score: number, status: string) => {
    if (status === 'inactive') return isDarkMode ? '#374151' : '#E5E7EB';
    if (status === 'suspended') return '#EF4444';

    // Color gradient based on score
    if (score >= 90) return '#10B981'; // Green
    if (score >= 80) return '#3B82F6'; // Blue
    if (score >= 70) return '#F59E0B'; // Yellow
    if (score >= 60) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  // Get trust boundary color
  const getTrustBoundaryColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const handleCellClick = (cell: HeatmapCell) => {
    if (onAgentClick) {
      onAgentClick(cell.agentId);
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'trust': return 'Trust Score';
      case 'compliance': return 'Compliance Rate';
      case 'violations': return 'Violation Score';
      default: return 'Score';
    }
  };

  const getMetricIcon = () => {
    switch (selectedMetric) {
      case 'trust': return <Security />;
      case 'compliance': return <CheckCircle />;
      case 'violations': return <Warning />;
      default: return <ThermostatOutlined />;
    }
  };

  return (
    <Card 
      className={className}
      sx={{ 
        backgroundColor: isDarkMode ? '#2d3748' : '#ffffff',
        color: isDarkMode ? 'white' : 'black',
        border: `1px solid ${isDarkMode ? '#4a5568' : '#e2e8f0'}`
      }}
    >
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <ThermostatOutlined sx={{ color: '#3182ce' }} />
            Governance Coverage Heatmap
          </Box>
        }
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                Metric
              </InputLabel>
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                sx={{
                  color: isDarkMode ? 'white' : 'black',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode ? '#4a5568' : '#e2e8f0'
                  }
                }}
              >
                <MenuItem value="trust">Trust Score</MenuItem>
                <MenuItem value="compliance">Compliance</MenuItem>
                <MenuItem value="violations">Violations</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={showBoundaries}
                  onChange={(e) => setShowBoundaries(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#3182ce'
                    }
                  }}
                />
              }
              label="Boundaries"
              sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}
            />
            
            <IconButton size="small">
              <Refresh sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }} />
            </IconButton>
          </Box>
        }
        sx={{
          '& .MuiCardHeader-title': {
            color: isDarkMode ? 'white' : 'black'
          }
        }}
      />
      
      <CardContent>
        {/* Legend */}
        <Box mb={3} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <Typography variant="body2" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
            {getMetricLabel()}:
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: '#10B981',
                borderRadius: 1
              }}
            />
            <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
              90-100%
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: '#3B82F6',
                borderRadius: 1
              }}
            />
            <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
              80-89%
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: '#F59E0B',
                borderRadius: 1
              }}
            />
            <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
              70-79%
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: '#EF4444',
                borderRadius: 1
              }}
            />
            <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
              Below 70%
            </Typography>
          </Box>
        </Box>

        {/* Heatmap Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(agents.length))}, 1fr)`,
            gap: 1,
            maxWidth: '100%',
            aspectRatio: '1',
            margin: '0 auto'
          }}
        >
          {heatmapData.map((cell) => (
            <Tooltip
              key={cell.agentId}
              title={
                <Box>
                  <Typography variant="subtitle2">{cell.agentName}</Typography>
                  <Typography variant="caption">
                    {getMetricLabel()}: {cell.score}%
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    Type: {cell.type}
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    Status: {cell.status}
                  </Typography>
                  {cell.violations > 0 && (
                    <>
                      <br />
                      <Typography variant="caption" sx={{ color: '#EF4444' }}>
                        Violations: {cell.violations}
                      </Typography>
                    </>
                  )}
                </Box>
              }
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCellClick(cell)}
                style={{
                  backgroundColor: getHeatmapColor(cell.score, cell.status),
                  borderRadius: 4,
                  cursor: 'pointer',
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  border: showBoundaries && cell.status === 'active' 
                    ? `2px solid ${getTrustBoundaryColor(cell.score)}`
                    : 'none'
                }}
              >
                {/* Agent type indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: cell.type === 'multi-agent' ? '#8B5CF6' : '#3182ce'
                  }}
                />
                
                {/* Score display */}
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    fontSize: '0.7rem'
                  }}
                >
                  {Math.round(cell.score)}
                </Typography>
                
                {/* Violation indicator */}
                {cell.violations > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 2,
                      left: 2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#EF4444',
                      border: '1px solid white'
                    }}
                  />
                )}
              </motion.div>
            </Tooltip>
          ))}
        </Box>

        {/* Summary Stats */}
        <Box mt={3}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ color: '#10B981' }}>
                  {heatmapData.filter(c => c.score >= 90 && c.status === 'active').length}
                </Typography>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                  Excellent
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ color: '#3B82F6' }}>
                  {heatmapData.filter(c => c.score >= 80 && c.score < 90 && c.status === 'active').length}
                </Typography>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                  Good
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ color: '#F59E0B' }}>
                  {heatmapData.filter(c => c.score >= 70 && c.score < 80 && c.status === 'active').length}
                </Typography>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                  Fair
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ color: '#EF4444' }}>
                  {heatmapData.filter(c => c.score < 70 && c.status === 'active').length}
                </Typography>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                  Needs Attention
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GovernanceHeatmap;

