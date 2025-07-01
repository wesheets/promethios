import React, { useState, useEffect, useRef } from 'react';
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
  FormControlLabel,
  Button,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  AccountTree,
  Security,
  Warning,
  CheckCircle,
  Info,
  Refresh,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Groups,
  Person,
  Link,
  LinkOff,
  Psychology
} from '@mui/icons-material';

interface AgentNode {
  id: string;
  name: string;
  type: 'single' | 'multi-agent';
  trustScore: number;
  status: 'active' | 'inactive' | 'suspended';
  x?: number;
  y?: number;
}

interface TrustConnection {
  sourceId: string;
  targetId: string;
  trustLevel: number;
  bidirectional: boolean;
  strength: number;
  lastUpdated: string;
}

interface TrustNetworkGraphProps {
  agents: AgentNode[];
  showTrustFlow?: boolean;
  highlightWeakLinks?: boolean;
  minTrustThreshold?: number;
  onNodeClick?: (agentId: string) => void;
  onConnectionClick?: (connection: TrustConnection) => void;
  className?: string;
}

interface NetworkStats {
  totalConnections: number;
  strongConnections: number;
  weakConnections: number;
  isolatedNodes: number;
  averageTrust: number;
  networkDensity: number;
}

/**
 * TrustNetworkGraph Component
 * 
 * Interactive network showing trust relationships between agents
 * with comprehensive tooltips for transparency and education
 */
const TrustNetworkGraph: React.FC<TrustNetworkGraphProps> = ({
  agents,
  showTrustFlow = true,
  highlightWeakLinks = true,
  minTrustThreshold = 50,
  onNodeClick,
  onConnectionClick,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const [connections, setConnections] = useState<TrustConnection[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFlow, setShowFlow] = useState(showTrustFlow);
  const [highlightWeak, setHighlightWeak] = useState(highlightWeakLinks);
  const [trustThreshold, setTrustThreshold] = useState(minTrustThreshold);
  const [nodePositions, setNodePositions] = useState<Map<string, {x: number, y: number}>>(new Map());

  // Generate mock trust connections
  useEffect(() => {
    const mockConnections: TrustConnection[] = [];
    
    agents.forEach((agent, i) => {
      agents.forEach((otherAgent, j) => {
        if (i !== j && Math.random() > 0.6) { // 40% chance of connection
          const trustLevel = 30 + Math.random() * 70; // 30-100 trust level
          const strength = trustLevel / 100;
          
          mockConnections.push({
            sourceId: agent.id,
            targetId: otherAgent.id,
            trustLevel,
            bidirectional: Math.random() > 0.3, // 70% bidirectional
            strength,
            lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      });
    });

    setConnections(mockConnections);
  }, [agents]);

  // Calculate network statistics
  useEffect(() => {
    if (connections.length === 0) return;

    const filteredConnections = connections.filter(c => c.trustLevel >= trustThreshold);
    const strongConnections = filteredConnections.filter(c => c.trustLevel >= 80);
    const weakConnections = filteredConnections.filter(c => c.trustLevel < 60);
    
    const connectedNodes = new Set();
    filteredConnections.forEach(c => {
      connectedNodes.add(c.sourceId);
      connectedNodes.add(c.targetId);
    });
    
    const isolatedNodes = agents.length - connectedNodes.size;
    const averageTrust = filteredConnections.reduce((sum, c) => sum + c.trustLevel, 0) / filteredConnections.length;
    const maxPossibleConnections = agents.length * (agents.length - 1);
    const networkDensity = (filteredConnections.length / maxPossibleConnections) * 100;

    setNetworkStats({
      totalConnections: filteredConnections.length,
      strongConnections: strongConnections.length,
      weakConnections: weakConnections.length,
      isolatedNodes,
      averageTrust: averageTrust || 0,
      networkDensity
    });
  }, [connections, agents, trustThreshold]);

  // Generate node positions using force-directed layout simulation
  useEffect(() => {
    const width = 400;
    const height = 300;
    const positions = new Map();

    // Simple circular layout for demo
    agents.forEach((agent, index) => {
      const angle = (index / agents.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      const x = width / 2 + radius * Math.cos(angle);
      const y = height / 2 + radius * Math.sin(angle);
      
      positions.set(agent.id, { x, y });
    });

    setNodePositions(positions);
  }, [agents]);

  const getTrustColor = (trustLevel: number) => {
    if (trustLevel >= 80) return '#10B981'; // Green
    if (trustLevel >= 60) return '#3B82F6'; // Blue
    if (trustLevel >= 40) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getNodeColor = (agent: AgentNode) => {
    if (agent.status === 'suspended') return '#EF4444';
    if (agent.status === 'inactive') return '#6B7280';
    return agent.type === 'multi-agent' ? '#8B5CF6' : '#3B82F6';
  };

  const getConnectionWidth = (strength: number) => {
    return Math.max(1, strength * 4);
  };

  const handleNodeClick = (agent: AgentNode) => {
    setSelectedNode(selectedNode === agent.id ? null : agent.id);
    onNodeClick?.(agent.id);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setSelectedNode(null);
  };

  const getNodeConnections = (nodeId: string) => {
    return connections.filter(c => 
      (c.sourceId === nodeId || c.targetId === nodeId) && 
      c.trustLevel >= trustThreshold
    );
  };

  const getWeakLinks = () => {
    return connections.filter(c => c.trustLevel < 60 && c.trustLevel >= trustThreshold);
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
          <Tooltip 
            title="Interactive network visualization showing trust relationships between agents. Thicker lines indicate stronger trust. Use this to identify trust clusters, isolated agents, and potential collaboration opportunities."
            arrow
            placement="top"
          >
            <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'help' }}>
              <AccountTree sx={{ color: '#3182ce' }} />
              Trust Network Graph
              <Info sx={{ fontSize: 16, color: '#6B7280' }} />
            </Box>
          </Tooltip>
        }
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Minimum trust level to show connections">
              <Box sx={{ width: 120 }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                  Trust Threshold: {trustThreshold}%
                </Typography>
                <Slider
                  value={trustThreshold}
                  onChange={(_, value) => setTrustThreshold(value as number)}
                  min={0}
                  max={100}
                  size="small"
                  sx={{
                    color: '#3182ce',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#3182ce'
                    }
                  }}
                />
              </Box>
            </Tooltip>

            <Tooltip title="Show trust flow animations">
              <FormControlLabel
                control={
                  <Switch
                    checked={showFlow}
                    onChange={(e) => setShowFlow(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#3182ce'
                      }
                    }}
                  />
                }
                label="Flow"
                sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}
              />
            </Tooltip>

            <Tooltip title="Highlight weak trust connections">
              <FormControlLabel
                control={
                  <Switch
                    checked={highlightWeak}
                    onChange={(e) => setHighlightWeak(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#3182ce'
                      }
                    }}
                  />
                }
                label="Weak Links"
                sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}
              />
            </Tooltip>

            <Box display="flex" gap={1}>
              <Tooltip title="Zoom in">
                <IconButton size="small" onClick={handleZoomIn}>
                  <ZoomIn sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Zoom out">
                <IconButton size="small" onClick={handleZoomOut}>
                  <ZoomOut sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Reset view">
                <IconButton size="small" onClick={handleResetView}>
                  <CenterFocusStrong sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        }
        sx={{
          '& .MuiCardHeader-title': {
            color: isDarkMode ? 'white' : 'black'
          }
        }}
      />
      
      <CardContent>
        <Grid container spacing={3}>
          {/* Network Visualization */}
          <Grid item xs={12} md={8}>
            <Box 
              sx={{ 
                border: `1px solid ${isDarkMode ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: 1,
                overflow: 'hidden',
                backgroundColor: isDarkMode ? '#1a202c' : '#f8fafc'
              }}
            >
              <svg
                ref={svgRef}
                width="100%"
                height="400"
                viewBox={`0 0 400 300`}
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Connection lines */}
                {connections
                  .filter(c => c.trustLevel >= trustThreshold)
                  .map((connection, index) => {
                    const sourcePos = nodePositions.get(connection.sourceId);
                    const targetPos = nodePositions.get(connection.targetId);
                    
                    if (!sourcePos || !targetPos) return null;

                    const isWeak = connection.trustLevel < 60;
                    const isHighlighted = highlightWeak && isWeak;

                    return (
                      <g key={`${connection.sourceId}-${connection.targetId}`}>
                        <Tooltip 
                          title={
                            <Box>
                              <Typography variant="subtitle2">
                                Trust Connection
                              </Typography>
                              <Typography variant="caption">
                                Trust Level: {connection.trustLevel.toFixed(1)}%
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Type: {connection.bidirectional ? 'Bidirectional' : 'Unidirectional'}
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Last Updated: {new Date(connection.lastUpdated).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        >
                          <line
                            x1={sourcePos.x}
                            y1={sourcePos.y}
                            x2={targetPos.x}
                            y2={targetPos.y}
                            stroke={isHighlighted ? '#EF4444' : getTrustColor(connection.trustLevel)}
                            strokeWidth={getConnectionWidth(connection.strength)}
                            strokeDasharray={isWeak ? '5,5' : 'none'}
                            opacity={selectedNode && 
                              selectedNode !== connection.sourceId && 
                              selectedNode !== connection.targetId ? 0.3 : 0.8}
                            style={{ cursor: 'pointer' }}
                            onClick={() => onConnectionClick?.(connection)}
                          />
                        </Tooltip>

                        {/* Trust flow animation */}
                        {showFlow && connection.trustLevel >= 70 && (
                          <motion.circle
                            r="2"
                            fill={getTrustColor(connection.trustLevel)}
                            initial={{ 
                              cx: sourcePos.x, 
                              cy: sourcePos.y,
                              opacity: 0 
                            }}
                            animate={{ 
                              cx: targetPos.x, 
                              cy: targetPos.y,
                              opacity: [0, 1, 0] 
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity,
                              delay: index * 0.2 
                            }}
                          />
                        )}
                      </g>
                    );
                  })}

                {/* Agent nodes */}
                {agents.map((agent) => {
                  const position = nodePositions.get(agent.id);
                  if (!position) return null;

                  const isSelected = selectedNode === agent.id;
                  const nodeConnections = getNodeConnections(agent.id);

                  return (
                    <g key={agent.id}>
                      <Tooltip 
                        title={
                          <Box>
                            <Typography variant="subtitle2">{agent.name}</Typography>
                            <Typography variant="caption">
                              Type: {agent.type}
                            </Typography>
                            <br />
                            <Typography variant="caption">
                              Trust Score: {agent.trustScore}%
                            </Typography>
                            <br />
                            <Typography variant="caption">
                              Status: {agent.status}
                            </Typography>
                            <br />
                            <Typography variant="caption">
                              Connections: {nodeConnections.length}
                            </Typography>
                            <br />
                            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                              Click to highlight connections
                            </Typography>
                          </Box>
                        }
                      >
                        <motion.circle
                          cx={position.x}
                          cy={position.y}
                          r={isSelected ? 20 : 15}
                          fill={getNodeColor(agent)}
                          stroke={isSelected ? '#ffffff' : 'none'}
                          strokeWidth={isSelected ? 2 : 0}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleNodeClick(agent)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        />
                      </Tooltip>

                      {/* Node type indicator */}
                      <circle
                        cx={position.x + 8}
                        cy={position.y - 8}
                        r="4"
                        fill={agent.type === 'multi-agent' ? '#8B5CF6' : '#3B82F6'}
                        stroke="white"
                        strokeWidth="1"
                      />

                      {/* Node label */}
                      <text
                        x={position.x}
                        y={position.y + 30}
                        textAnchor="middle"
                        fontSize="10"
                        fill={isDarkMode ? '#a0aec0' : '#4a5568'}
                      >
                        {agent.name.length > 8 ? `${agent.name.slice(0, 8)}...` : agent.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </Box>
          </Grid>

          {/* Network Statistics */}
          <Grid item xs={12} md={4}>
            <Box>
              <Tooltip title="Network statistics provide insights into the overall health and connectivity of your agent ecosystem">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Network Statistics
                  <Info sx={{ fontSize: 16, color: '#6B7280' }} />
                </Typography>
              </Tooltip>

              {networkStats && (
                <List dense>
                  <Tooltip title="Total number of trust connections above the threshold">
                    <ListItem>
                      <ListItemIcon>
                        <Link sx={{ color: '#3B82F6' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Connections"
                        secondary={networkStats.totalConnections}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isDarkMode ? 'white' : 'black'
                          }
                        }}
                      />
                    </ListItem>
                  </Tooltip>

                  <Tooltip title="Connections with trust level above 80% - these indicate strong collaboration potential">
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: '#10B981' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Strong Connections"
                        secondary={networkStats.strongConnections}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isDarkMode ? 'white' : 'black'
                          }
                        }}
                      />
                    </ListItem>
                  </Tooltip>

                  <Tooltip title="Connections with trust level below 60% - these may need attention or policy adjustments">
                    <ListItem>
                      <ListItemIcon>
                        <Warning sx={{ color: '#F59E0B' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Weak Connections"
                        secondary={networkStats.weakConnections}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isDarkMode ? 'white' : 'black'
                          }
                        }}
                      />
                    </ListItem>
                  </Tooltip>

                  <Tooltip title="Agents with no connections above the threshold - consider reviewing their policies or trust settings">
                    <ListItem>
                      <ListItemIcon>
                        <LinkOff sx={{ color: '#EF4444' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Isolated Nodes"
                        secondary={networkStats.isolatedNodes}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isDarkMode ? 'white' : 'black'
                          }
                        }}
                      />
                    </ListItem>
                  </Tooltip>

                  <Tooltip title="Average trust level across all connections - higher values indicate better overall network health">
                    <ListItem>
                      <ListItemIcon>
                        <Psychology sx={{ color: '#8B5CF6' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Average Trust"
                        secondary={`${networkStats.averageTrust.toFixed(1)}%`}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isDarkMode ? 'white' : 'black'
                          }
                        }}
                      />
                    </ListItem>
                  </Tooltip>

                  <Tooltip title="Percentage of possible connections that exist - higher density indicates more collaborative potential">
                    <ListItem>
                      <ListItemIcon>
                        <AccountTree sx={{ color: '#3182ce' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Network Density"
                        secondary={`${networkStats.networkDensity.toFixed(1)}%`}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isDarkMode ? 'white' : 'black'
                          }
                        }}
                      />
                    </ListItem>
                  </Tooltip>
                </List>
              )}

              {/* Legend */}
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Legend
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Tooltip title="Single agent systems">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: '#3B82F6'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                        Single Agent
                      </Typography>
                    </Box>
                  </Tooltip>

                  <Tooltip title="Multi-agent systems">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: '#8B5CF6'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                        Multi-Agent System
                      </Typography>
                    </Box>
                  </Tooltip>

                  <Tooltip title="Strong trust connections (80%+)">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 20,
                          height: 3,
                          backgroundColor: '#10B981'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                        Strong Trust
                      </Typography>
                    </Box>
                  </Tooltip>

                  <Tooltip title="Weak trust connections (below 60%)">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 20,
                          height: 2,
                          backgroundColor: '#EF4444',
                          borderStyle: 'dashed',
                          borderWidth: '1px 0'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                        Weak Trust
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TrustNetworkGraph;

