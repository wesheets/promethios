/**
 * Collaboration Network Visualization
 * 
 * Real-time network diagram showing agent interactions, communication flows,
 * and emergent collaboration patterns in Enhanced Veritas 2 multi-agent sessions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  PlayArrow,
  Pause,
  Refresh,
  Settings,
  FilterList,
  Timeline,
  Group
} from '@mui/icons-material';
import { EnhancedWrapperAgent } from '../multiAgent/enhancedAgentWrapper';

interface NetworkNode {
  id: string;
  name: string;
  type: 'agent' | 'human' | 'system';
  role: string;
  status: 'active' | 'idle' | 'processing';
  position: { x: number; y: number };
  size: number;
  color: string;
  metrics: {
    interactions: number;
    influence: number;
    responsiveness: number;
    quality: number;
  };
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: 'communication' | 'collaboration' | 'influence' | 'feedback';
  strength: number;
  direction: 'bidirectional' | 'source-to-target' | 'target-to-source';
  activity: number; // Recent activity level
  quality: number;
  metadata: {
    messageCount: number;
    lastInteraction: Date;
    averageResponseTime: number;
  };
}

interface CollaborationPattern {
  id: string;
  name: string;
  nodes: string[];
  strength: number;
  type: 'consensus' | 'hierarchy' | 'peer-to-peer' | 'hub-and-spoke';
  emergent: boolean;
}

interface CollaborationNetworkVisualizationProps {
  sessionId?: string;
  agents: EnhancedWrapperAgent[];
  realTime?: boolean;
  onNodeSelect?: (nodeId: string) => void;
  onPatternDetected?: (pattern: CollaborationPattern) => void;
  className?: string;
}

const CollaborationNetworkVisualization: React.FC<CollaborationNetworkVisualizationProps> = ({
  sessionId,
  agents,
  realTime = true,
  onNodeSelect,
  onPatternDetected,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [patterns, setPatterns] = useState<CollaborationPattern[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showMetrics, setShowMetrics] = useState(true);
  const [showPatterns, setShowPatterns] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(realTime);
  const [loading, setLoading] = useState(false);

  // Initialize network data
  useEffect(() => {
    if (agents.length > 0) {
      initializeNetwork();
    }
  }, [agents]);

  // Real-time updates
  useEffect(() => {
    if (realTime && isPlaying && sessionId) {
      const interval = setInterval(() => {
        updateNetworkData();
      }, 2000 / animationSpeed);

      return () => clearInterval(interval);
    }
  }, [realTime, isPlaying, sessionId, animationSpeed]);

  // Canvas rendering
  useEffect(() => {
    if (canvasRef.current) {
      renderNetwork();
    }
  }, [nodes, edges, patterns, zoomLevel, panOffset, showMetrics, showPatterns, selectedNode]);

  const initializeNetwork = useCallback(() => {
    setLoading(true);

    // Create nodes from agents
    const networkNodes: NetworkNode[] = agents.map((agent, index) => ({
      id: agent.id,
      name: agent.name,
      type: 'agent',
      role: agent.role || 'participant',
      status: agent.status === 'active' ? 'active' : 'idle',
      position: {
        x: 300 + Math.cos((index * 2 * Math.PI) / agents.length) * 150,
        y: 300 + Math.sin((index * 2 * Math.PI) / agents.length) * 150
      },
      size: 40 + (agent.performanceMetrics?.collaborationEffectiveness || 0) * 20,
      color: getAgentColor(agent.type),
      metrics: {
        interactions: agent.performanceMetrics?.verificationCount || 0,
        influence: agent.performanceMetrics?.collaborationEffectiveness || 0.5,
        responsiveness: 1 - (agent.performanceMetrics?.responseTime || 2) / 10,
        quality: agent.performanceMetrics?.accuracyScore || 0.8
      }
    }));

    // Add human node if HITL is active
    if (sessionId) {
      networkNodes.push({
        id: 'human',
        name: 'Human Expert',
        type: 'human',
        role: 'supervisor',
        status: 'active',
        position: { x: 300, y: 150 },
        size: 50,
        color: '#4299e1',
        metrics: {
          interactions: 0,
          influence: 0.9,
          responsiveness: 0.7,
          quality: 0.95
        }
      });
    }

    // Create initial edges (collaboration connections)
    const networkEdges: NetworkEdge[] = [];
    for (let i = 0; i < networkNodes.length; i++) {
      for (let j = i + 1; j < networkNodes.length; j++) {
        const node1 = networkNodes[i];
        const node2 = networkNodes[j];
        
        // Create edge if agents are likely to collaborate
        if (shouldCreateEdge(node1, node2)) {
          networkEdges.push({
            id: `${node1.id}-${node2.id}`,
            source: node1.id,
            target: node2.id,
            type: 'collaboration',
            strength: Math.random() * 0.5 + 0.3,
            direction: 'bidirectional',
            activity: Math.random(),
            quality: Math.random() * 0.4 + 0.6,
            metadata: {
              messageCount: Math.floor(Math.random() * 20),
              lastInteraction: new Date(),
              averageResponseTime: Math.random() * 5 + 1
            }
          });
        }
      }
    }

    setNodes(networkNodes);
    setEdges(networkEdges);
    setLoading(false);

    // Detect initial patterns
    setTimeout(() => {
      detectCollaborationPatterns(networkNodes, networkEdges);
    }, 1000);
  }, [agents, sessionId]);

  const updateNetworkData = useCallback(() => {
    // Simulate real-time updates
    setNodes(prevNodes => 
      prevNodes.map(node => ({
        ...node,
        status: Math.random() > 0.7 ? 'processing' : 'active',
        metrics: {
          ...node.metrics,
          interactions: node.metrics.interactions + Math.floor(Math.random() * 3),
          influence: Math.max(0, Math.min(1, node.metrics.influence + (Math.random() - 0.5) * 0.1)),
          responsiveness: Math.max(0, Math.min(1, node.metrics.responsiveness + (Math.random() - 0.5) * 0.05))
        }
      }))
    );

    setEdges(prevEdges =>
      prevEdges.map(edge => ({
        ...edge,
        activity: Math.max(0, Math.min(1, edge.activity + (Math.random() - 0.5) * 0.3)),
        strength: Math.max(0.1, Math.min(1, edge.strength + (Math.random() - 0.5) * 0.1)),
        metadata: {
          ...edge.metadata,
          messageCount: edge.metadata.messageCount + Math.floor(Math.random() * 2),
          lastInteraction: Math.random() > 0.7 ? new Date() : edge.metadata.lastInteraction
        }
      }))
    );

    // Occasionally detect new patterns
    if (Math.random() > 0.8) {
      detectCollaborationPatterns(nodes, edges);
    }
  }, [nodes, edges]);

  const detectCollaborationPatterns = useCallback((networkNodes: NetworkNode[], networkEdges: NetworkEdge[]) => {
    const detectedPatterns: CollaborationPattern[] = [];

    // Detect hub-and-spoke pattern
    networkNodes.forEach(node => {
      const connections = networkEdges.filter(edge => 
        edge.source === node.id || edge.target === node.id
      );
      
      if (connections.length >= 3) {
        const avgStrength = connections.reduce((sum, edge) => sum + edge.strength, 0) / connections.length;
        
        if (avgStrength > 0.6) {
          detectedPatterns.push({
            id: `hub-${node.id}`,
            name: `Hub: ${node.name}`,
            nodes: [node.id, ...connections.map(edge => 
              edge.source === node.id ? edge.target : edge.source
            )],
            strength: avgStrength,
            type: 'hub-and-spoke',
            emergent: true
          });
        }
      }
    });

    // Detect consensus patterns (high interconnectivity)
    const highActivityNodes = networkNodes.filter(node => node.metrics.interactions > 5);
    if (highActivityNodes.length >= 3) {
      const consensusEdges = networkEdges.filter(edge =>
        highActivityNodes.some(node => node.id === edge.source) &&
        highActivityNodes.some(node => node.id === edge.target) &&
        edge.strength > 0.7
      );

      if (consensusEdges.length >= highActivityNodes.length) {
        detectedPatterns.push({
          id: 'consensus-group',
          name: 'Consensus Formation',
          nodes: highActivityNodes.map(node => node.id),
          strength: consensusEdges.reduce((sum, edge) => sum + edge.strength, 0) / consensusEdges.length,
          type: 'consensus',
          emergent: true
        });
      }
    }

    setPatterns(detectedPatterns);

    // Notify parent component
    detectedPatterns.forEach(pattern => {
      if (onPatternDetected) {
        onPatternDetected(pattern);
      }
    });
  }, [onPatternDetected]);

  const renderNetwork = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(panOffset.x, panOffset.y);

    // Render patterns first (background)
    if (showPatterns) {
      patterns.forEach(pattern => {
        renderPattern(ctx, pattern);
      });
    }

    // Render edges
    edges.forEach(edge => {
      if (filterType === 'all' || edge.type === filterType) {
        renderEdge(ctx, edge);
      }
    });

    // Render nodes
    nodes.forEach(node => {
      renderNode(ctx, node);
    });

    // Render metrics overlay
    if (showMetrics) {
      renderMetricsOverlay(ctx);
    }

    ctx.restore();
  }, [nodes, edges, patterns, zoomLevel, panOffset, showMetrics, showPatterns, filterType, selectedNode]);

  const renderNode = (ctx: CanvasRenderingContext2D, node: NetworkNode) => {
    const { x, y } = node.position;
    const radius = node.size / 2;

    // Node background
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Status indicator
    if (node.status === 'processing') {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (node.status === 'active') {
      ctx.strokeStyle = '#48bb78';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Selection highlight
    if (selectedNode === node.id) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = '#3182ce';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Node label
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, x, y + radius + 15);

    // Role indicator
    ctx.font = '10px Arial';
    ctx.fillStyle = '#a0aec0';
    ctx.fillText(node.role, x, y + radius + 28);
  };

  const renderEdge = (ctx: CanvasRenderingContext2D, edge: NetworkEdge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;

    const { x: x1, y: y1 } = sourceNode.position;
    const { x: x2, y: y2 } = targetNode.position;

    // Edge line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    // Color based on activity and strength
    const alpha = edge.activity * edge.strength;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = edge.strength * 4;
    ctx.stroke();

    // Activity animation
    if (edge.activity > 0.7) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      ctx.beginPath();
      ctx.arc(midX, midY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
    }
  };

  const renderPattern = (ctx: CanvasRenderingContext2D, pattern: CollaborationPattern) => {
    const patternNodes = nodes.filter(node => pattern.nodes.includes(node.id));
    if (patternNodes.length < 2) return;

    // Calculate bounding box
    const minX = Math.min(...patternNodes.map(n => n.position.x));
    const maxX = Math.max(...patternNodes.map(n => n.position.x));
    const minY = Math.min(...patternNodes.map(n => n.position.y));
    const maxY = Math.max(...patternNodes.map(n => n.position.y));

    // Draw pattern background
    ctx.beginPath();
    ctx.roundRect(minX - 30, minY - 30, maxX - minX + 60, maxY - minY + 60, 10);
    ctx.fillStyle = `rgba(66, 153, 225, ${pattern.strength * 0.2})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(66, 153, 225, ${pattern.strength * 0.5})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pattern label
    ctx.fillStyle = '#4299e1';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(pattern.name, (minX + maxX) / 2, minY - 10);
  };

  const renderMetricsOverlay = (ctx: CanvasRenderingContext2D) => {
    // Render metrics for selected node
    if (selectedNode) {
      const node = nodes.find(n => n.id === selectedNode);
      if (node) {
        const { x, y } = node.position;
        const metrics = node.metrics;

        // Metrics background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x + 60, y - 40, 150, 80);

        // Metrics text
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Interactions: ${metrics.interactions}`, x + 65, y - 25);
        ctx.fillText(`Influence: ${(metrics.influence * 100).toFixed(0)}%`, x + 65, y - 10);
        ctx.fillText(`Responsiveness: ${(metrics.responsiveness * 100).toFixed(0)}%`, x + 65, y + 5);
        ctx.fillText(`Quality: ${(metrics.quality * 100).toFixed(0)}%`, x + 65, y + 20);
      }
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (event.clientY - rect.top - panOffset.y) / zoomLevel;

    // Check if click is on a node
    const clickedNode = nodes.find(node => {
      const dx = x - node.position.x;
      const dy = y - node.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= node.size / 2;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      if (onNodeSelect) {
        onNodeSelect(clickedNode.id);
      }
    } else {
      setSelectedNode(null);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  const handleCenter = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const getAgentColor = (type: string): string => {
    switch (type) {
      case 'assistant': return '#4299e1';
      case 'specialist': return '#9f7aea';
      case 'tool': return '#ed8936';
      case 'creative': return '#f56565';
      default: return '#718096';
    }
  };

  const shouldCreateEdge = (node1: NetworkNode, node2: NetworkNode): boolean => {
    // Create edges based on agent compatibility and roles
    if (node1.type === 'human' || node2.type === 'human') return true;
    if (node1.role === 'moderator' || node2.role === 'moderator') return true;
    return Math.random() > 0.4; // Random collaboration probability
  };

  if (loading) {
    return (
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: 600 }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height={500}>
            <CircularProgress size={60} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: 600 }} className={className}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <Group />
            <Typography variant="h6">Collaboration Network</Typography>
            <Chip
              label={`${nodes.length} nodes, ${edges.length} connections`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        }
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel sx={{ color: 'white' }}>Filter</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                sx={{ color: 'white' }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="communication">Communication</MenuItem>
                <MenuItem value="collaboration">Collaboration</MenuItem>
                <MenuItem value="influence">Influence</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={showMetrics}
                  onChange={(e) => setShowMetrics(e.target.checked)}
                  size="small"
                />
              }
              label="Metrics"
              sx={{ color: 'white' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showPatterns}
                  onChange={(e) => setShowPatterns(e.target.checked)}
                  size="small"
                />
              }
              label="Patterns"
              sx={{ color: 'white' }}
            />
            <IconButton
              onClick={() => setIsPlaying(!isPlaying)}
              sx={{ color: 'white' }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Box>
        }
      />
      <CardContent sx={{ p: 1 }}>
        {/* Controls */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" gap={1}>
            <Tooltip title="Zoom in">
              <IconButton onClick={handleZoomIn} sx={{ color: 'white' }}>
                <ZoomIn />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom out">
              <IconButton onClick={handleZoomOut} sx={{ color: 'white' }}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="Center view">
              <IconButton onClick={handleCenter} sx={{ color: 'white' }}>
                <CenterFocusStrong />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
              Animation Speed:
            </Typography>
            <Slider
              value={animationSpeed}
              onChange={(e, value) => setAnimationSpeed(value as number)}
              min={0.5}
              max={3}
              step={0.5}
              sx={{ width: 100, color: 'primary.main' }}
            />
          </Box>
        </Box>

        {/* Network Canvas */}
        <Box position="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onClick={handleCanvasClick}
            style={{
              border: '1px solid #4a5568',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: '#1a202c'
            }}
          />
          
          {/* Patterns Legend */}
          {patterns.length > 0 && (
            <Box
              position="absolute"
              top={10}
              right={10}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                p: 2,
                borderRadius: 1,
                minWidth: 200
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                Detected Patterns
              </Typography>
              {patterns.map((pattern) => (
                <Box key={pattern.id} display="flex" alignItems="center" gap={1} mb={1}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: '#4299e1',
                      borderRadius: '50%',
                      opacity: pattern.strength
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    {pattern.name} ({(pattern.strength * 100).toFixed(0)}%)
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Status Bar */}
        <Box mt={2} display="flex" justifyContent="between" alignItems="center">
          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
            Zoom: {(zoomLevel * 100).toFixed(0)}% | 
            Patterns: {patterns.length} | 
            Active Connections: {edges.filter(e => e.activity > 0.5).length}
          </Typography>
          
          {selectedNode && (
            <Chip
              label={`Selected: ${nodes.find(n => n.id === selectedNode)?.name}`}
              onDelete={() => setSelectedNode(null)}
              size="small"
              color="primary"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CollaborationNetworkVisualization;

