/**
 * Governance Contrast Visualization Component for Multi-Agent Coordination
 * 
 * This component visualizes the contrast between agents with and without governance identity,
 * showing trust boundaries, verification flows, and performance differences.
 * 
 * @module ui/benchmark/multi_agent_coordination/GovernanceContrastVisualization
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Divider, 
  Chip,
  CircularProgress,
  Button,
  Tooltip
} from '@mui/material';
import { 
  VerifiedUser as VerifiedUserIcon,
  GppBad as GppBadIcon,
  CompareArrows as CompareArrowsIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import * as d3 from 'd3';

/**
 * Governance Contrast Visualization Component
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.coordinationManager - Coordination Manager instance
 * @param {string} props.contextId - Coordination context ID
 * @param {boolean} props.showPerformanceMetrics - Whether to show performance metrics
 * @param {boolean} props.showTrustBoundaries - Whether to show trust boundaries
 * @param {boolean} props.showVerificationFlows - Whether to show verification flows
 * @param {Function} props.onVisualizationReady - Callback when visualization is ready
 */
const GovernanceContrastVisualization = ({
  coordinationManager,
  contextId,
  showPerformanceMetrics = true,
  showTrustBoundaries = true,
  showVerificationFlows = true,
  onVisualizationReady
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visualizationData, setVisualizationData] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const networkRef = useRef(null);
  const metricsRef = useRef(null);
  const verificationRef = useRef(null);
  
  // Fetch visualization data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get governance contrast visualization from coordination manager
        const data = await coordinationManager.getGovernanceContrastVisualization(contextId);
        
        setVisualizationData(data);
        setError(null);
        
        if (onVisualizationReady) {
          onVisualizationReady(data);
        }
      } catch (err) {
        console.error('Error fetching governance contrast visualization:', err);
        setError(`Failed to load visualization: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [coordinationManager, contextId, refreshKey, onVisualizationReady]);
  
  // Render network visualization
  useEffect(() => {
    if (!visualizationData || !networkRef.current) return;
    
    // Clear previous visualization
    d3.select(networkRef.current).selectAll('*').remove();
    
    const { agents, boundaries, connections } = visualizationData;
    
    // Set up SVG
    const width = networkRef.current.clientWidth;
    const height = 400;
    
    const svg = d3.select(networkRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Create force simulation
    const simulation = d3.forceSimulation(agents)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('link', d3.forceLink(connections).id(d => d.id).distance(100))
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .on('tick', ticked);
    
    // Draw boundaries
    const boundaryGroups = svg.selectAll('.boundary')
      .data(boundaries)
      .enter()
      .append('g')
      .attr('class', 'boundary');
    
    boundaryGroups.append('circle')
      .attr('r', d => d.type === 'governed' ? 120 : 100)
      .attr('fill', d => d.type === 'governed' ? 'rgba(0, 128, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)')
      .attr('stroke', d => d.type === 'governed' ? 'green' : 'red')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', d => d.type === 'governed' ? '0' : '5,5');
    
    boundaryGroups.append('text')
      .attr('y', d => d.type === 'governed' ? -130 : -110)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.type === 'governed' ? 'green' : 'red')
      .text(d => d.type === 'governed' ? 'Governed Agents' : 'Non-Governed Agents');
    
    // Draw connections
    const link = svg.selectAll('.link')
      .data(connections)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', d => {
        switch (d.trustLevel) {
          case 'high': return 'green';
          case 'medium': return 'orange';
          case 'low': return 'red';
          default: return 'gray';
        }
      })
      .attr('stroke-width', d => {
        switch (d.trustLevel) {
          case 'high': return 3;
          case 'medium': return 2;
          case 'low': return 1;
          default: return 1;
        }
      });
    
    // Draw agents
    const node = svg.selectAll('.node')
      .data(agents)
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('click', (event, d) => {
        setSelectedAgent(selectedAgent === d.id ? null : d.id);
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    node.append('circle')
      .attr('r', 15)
      .attr('fill', d => d.hasGovernance ? '#4CAF50' : '#F44336')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    node.append('text')
      .attr('dy', 30)
      .attr('text-anchor', 'middle')
      .text(d => d.id.split('_').pop());
    
    // Add icons to nodes
    node.append('text')
      .attr('class', 'icon')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', 'white')
      .text(d => d.hasGovernance ? '\ue8e8' : '\ue8e9'); // Material icons codes
    
    // Tick function for force simulation
    function ticked() {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    }
    
    // Drag functions
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [visualizationData, networkRef, selectedAgent]);
  
  // Render performance metrics
  useEffect(() => {
    if (!visualizationData || !metricsRef.current || !showPerformanceMetrics) return;
    
    // Clear previous visualization
    d3.select(metricsRef.current).selectAll('*').remove();
    
    const { performance } = visualizationData;
    
    // Set up SVG
    const width = metricsRef.current.clientWidth;
    const height = 200;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    
    const svg = d3.select(metricsRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    const metrics = [
      { name: 'Task Completion', governed: performance.governed.averageCompletionRate, nonGoverned: performance.nonGoverned.averageCompletionRate },
      { name: 'Response Time', governed: performance.governed.averageResponseTime / performance.nonGoverned.averageResponseTime, nonGoverned: 1 },
      { name: 'Trust Score', governed: performance.governed.averageTrustScore, nonGoverned: performance.nonGoverned.averageTrustScore }
    ];
    
    const x0 = d3.scaleBand()
      .domain(metrics.map(d => d.name))
      .rangeRound([margin.left, width - margin.right])
      .paddingInner(0.1);
    
    const x1 = d3.scaleBand()
      .domain(['governed', 'nonGoverned'])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(metrics, d => Math.max(d.governed, d.nonGoverned))])
      .nice()
      .rangeRound([height - margin.bottom, margin.top]);
    
    const color = d3.scaleOrdinal()
      .domain(['governed', 'nonGoverned'])
      .range(['#4CAF50', '#F44336']);
    
    svg.append('g')
      .selectAll('g')
      .data(metrics)
      .join('g')
        .attr('transform', d => `translate(${x0(d.name)},0)`)
        .selectAll('rect')
        .data(d => [
          { key: 'governed', value: d.governed },
          { key: 'nonGoverned', value: d.nonGoverned }
        ])
        .join('rect')
          .attr('x', d => x1(d.key))
          .attr('y', d => y(d.value))
          .attr('width', x1.bandwidth())
          .attr('height', d => y(0) - y(d.value))
          .attr('fill', d => color(d.key));
    
    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x0).tickSizeOuter(0));
    
    // Add y-axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(null, 's'))
      .call(g => g.select('.domain').remove())
      .call(g => g.append('text')
        .attr('x', -margin.left)
        .attr('y', 10)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .text('Performance'));
    
    // Add legend
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(['Governed', 'Non-Governed'])
      .join('g')
        .attr('transform', (d, i) => `translate(${width - margin.right},${i * 20 + margin.top})`);
    
    legend.append('rect')
      .attr('x', -19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', (d, i) => color(i === 0 ? 'governed' : 'nonGoverned'));
    
    legend.append('text')
      .attr('x', -24)
      .attr('y', 9.5)
      .attr('dy', '0.35em')
      .text(d => d);
  }, [visualizationData, metricsRef, showPerformanceMetrics]);
  
  // Render verification flows
  useEffect(() => {
    if (!visualizationData || !verificationRef.current || !showVerificationFlows || !selectedAgent) return;
    
    // Clear previous visualization
    d3.select(verificationRef.current).selectAll('*').remove();
    
    const { verificationFlows } = visualizationData;
    
    // Filter flows for selected agent
    const agentFlows = verificationFlows.filter(flow => 
      flow.sourceAgent === selectedAgent || flow.targetAgent === selectedAgent
    );
    
    if (agentFlows.length === 0) {
      d3.select(verificationRef.current)
        .append('div')
        .attr('class', 'no-flows')
        .style('text-align', 'center')
        .style('padding', '20px')
        .text(`No verification flows found for ${selectedAgent}`);
      return;
    }
    
    // Set up SVG
    const width = verificationRef.current.clientWidth;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    
    const svg = d3.select(verificationRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create timeline
    const timeScale = d3.scaleLinear()
      .domain([
        d3.min(agentFlows, d => d.timestamp),
        d3.max(agentFlows, d => d.timestamp)
      ])
      .range([margin.left, width - margin.right]);
    
    // Draw timeline axis
    svg.append('line')
      .attr('x1', margin.left)
      .attr('y1', height / 2)
      .attr('x2', width - margin.right)
      .attr('y2', height / 2)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2);
    
    // Draw verification events
    const events = svg.selectAll('.event')
      .data(agentFlows)
      .enter()
      .append('g')
      .attr('class', 'event')
      .attr('transform', d => `translate(${timeScale(d.timestamp)}, ${height / 2})`);
    
    events.append('circle')
      .attr('r', 8)
      .attr('fill', d => d.verified ? 'green' : 'red');
    
    events.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', d => d.sourceAgent === selectedAgent ? -30 : 30)
      .attr('stroke', '#999')
      .attr('stroke-width', 1);
    
    events.append('text')
      .attr('x', 0)
      .attr('y', d => d.sourceAgent === selectedAgent ? -40 : 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .text(d => d.sourceAgent === selectedAgent ? d.targetAgent : d.sourceAgent);
    
    // Add tooltip
    events.append('title')
      .text(d => `${d.sourceAgent} → ${d.targetAgent}\nVerified: ${d.verified}\nTimestamp: ${new Date(d.timestamp).toLocaleTimeString()}`);
  }, [visualizationData, verificationRef, showVerificationFlows, selectedAgent]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        <Typography variant="h6">Error</Typography>
        <Typography>{error}</Typography>
        <Button variant="outlined" onClick={handleRefresh} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }
  
  if (!visualizationData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No visualization data available</Typography>
        <Button variant="outlined" onClick={handleRefresh} sx={{ mt: 2 }}>
          Refresh
        </Button>
      </Box>
    );
  }
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="div">
            Governance Identity Contrast
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<CompareArrowsIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {/* Trust Boundaries Visualization */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <VerifiedUserIcon sx={{ mr: 1 }} />
              Trust Boundaries
              {selectedAgent && (
                <Chip 
                  label={`Selected: ${selectedAgent}`} 
                  color="primary" 
                  size="small" 
                  onDelete={() => setSelectedAgent(null)}
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            <Box 
              ref={networkRef} 
              sx={{ 
                height: 400, 
                border: '1px solid #eee', 
                borderRadius: 1,
                p: 1
              }}
            />
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              Click on an agent to see its verification flows
            </Typography>
          </Grid>
          
          {/* Performance Metrics */}
          {showPerformanceMetrics && (
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <SpeedIcon sx={{ mr: 1 }} />
                Performance Comparison
              </Typography>
              <Box 
                ref={metricsRef} 
                sx={{ 
                  height: 200, 
                  border: '1px solid #eee', 
                  borderRadius: 1,
                  p: 1
                }}
              />
            </Grid>
          )}
          
          {/* Verification Flows */}
          {showVerificationFlows && (
            <Grid item xs={12} md={showPerformanceMetrics ? 6 : 12}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon sx={{ mr: 1 }} />
                Verification Flows
                {!selectedAgent && (
                  <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                    (Select an agent to view flows)
                  </Typography>
                )}
              </Typography>
              <Box 
                ref={verificationRef} 
                sx={{ 
                  height: 200, 
                  border: '1px solid #eee', 
                  borderRadius: 1,
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {!selectedAgent && (
                  <Typography variant="body2" color="text.secondary">
                    Select an agent in the trust boundaries visualization to view its verification flows
                  </Typography>
                )}
              </Box>
            </Grid>
          )}
          
          {/* Trust Metrics */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Trust Metrics</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Governed to Governed
                    </Typography>
                    <Typography variant="h4" component="div" color="success.main">
                      {visualizationData.trustMetrics.governedToGoverned === 'high' ? 'High' : 
                       visualizationData.trustMetrics.governedToGoverned === 'medium' ? 'Medium' : 'Low'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Trust level between agents with governance identity
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Governed to Non-Governed
                    </Typography>
                    <Typography variant="h4" component="div" color="warning.main">
                      {visualizationData.trustMetrics.governedToNonGoverned === 'high' ? 'High' : 
                       visualizationData.trustMetrics.governedToNonGoverned === 'medium' ? 'Medium' : 'Low'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Trust level from governed to non-governed agents
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Non-Governed to Non-Governed
                    </Typography>
                    <Typography variant="h4" component="div" color="error.main">
                      {visualizationData.trustMetrics.nonGovernedToNonGoverned === 'high' ? 'High' : 
                       visualizationData.trustMetrics.nonGovernedToNonGoverned === 'medium' ? 'Medium' : 'Low'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Trust level between agents without governance identity
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default GovernanceContrastVisualization;
