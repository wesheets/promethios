/**
 * Confidence Visualization Component for CMU Benchmark
 * 
 * This component visualizes confidence scores and evidence maps from the
 * Confidence Scoring module, providing real-time insights into agent decision-making.
 * 
 * @module ui/benchmark/confidence_scoring/ConfidenceVisualization
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Chip,
  Divider,
  Grid,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import { 
  InfoOutlined, 
  ExpandMore, 
  ExpandLess,
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';
import { ForceGraph2D } from 'react-force-graph';
import { useTheme } from '@mui/material/styles';

/**
 * Confidence Indicator component that displays the confidence score
 * with appropriate color coding based on threshold status
 */
const ConfidenceIndicator = ({ score, thresholdType = 'standard' }) => {
  const theme = useTheme();
  
  // Determine color based on threshold status
  const getColor = () => {
    if (!score) return theme.palette.grey[500];
    
    switch (score.thresholdStatus) {
      case 'above':
        return theme.palette.success.main;
      case 'within':
        return theme.palette.warning.main;
      case 'below':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  // Get icon based on threshold status
  const getIcon = () => {
    if (!score) return <InfoOutlined />;
    
    switch (score.thresholdStatus) {
      case 'above':
        return <CheckCircle />;
      case 'within':
        return <Warning />;
      case 'below':
        return <Error />;
      default:
        return <InfoOutlined />;
    }
  };
  
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', m: 1 }}>
      <CircularProgress
        variant="determinate"
        value={score ? score.value * 100 : 0}
        size={80}
        thickness={4}
        sx={{ color: getColor() }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          color="text.secondary"
          sx={{ fontWeight: 'bold' }}
        >
          {score ? `${Math.round(score.value * 100)}%` : 'N/A'}
        </Typography>
      </Box>
      <Tooltip title={`Confidence ${score?.thresholdStatus || 'unknown'} ${thresholdType} threshold`}>
        <Box sx={{ position: 'absolute', bottom: -10, right: -10 }}>
          {getIcon()}
        </Box>
      </Tooltip>
    </Box>
  );
};

/**
 * Evidence Map component that visualizes the relationships between
 * evidence items supporting a decision
 */
const EvidenceMap = ({ evidenceMap }) => {
  const theme = useTheme();
  
  // Prepare graph data
  const graphData = React.useMemo(() => {
    if (!evidenceMap) return { nodes: [], links: [] };
    
    // Create nodes for decision and evidence items
    const nodes = [
      // Decision node
      {
        id: evidenceMap.decisionId,
        name: `Decision ${evidenceMap.decisionId}`,
        val: 20,
        color: theme.palette.primary.main,
        group: 'decision'
      },
      // Evidence nodes
      ...evidenceMap.rootEvidence.map(evidence => ({
        id: evidence.id,
        name: `${evidence.type}: ${evidence.content.text || JSON.stringify(evidence.content).substring(0, 30)}...`,
        val: 10 * evidence.weight,
        color: getEvidenceColor(evidence.type, evidence.quality),
        group: evidence.type,
        quality: evidence.quality
      }))
    ];
    
    // Create links from evidence to decision
    const links = evidenceMap.rootEvidence.map(evidence => ({
      source: evidence.id,
      target: evidenceMap.decisionId,
      value: evidence.weight
    }));
    
    // Add relationship links if any
    if (evidenceMap.relationships && evidenceMap.relationships.length > 0) {
      evidenceMap.relationships.forEach(rel => {
        links.push({
          source: rel.childId,
          target: rel.parentId,
          value: 0.5,
          type: rel.relationshipType
        });
      });
    }
    
    return { nodes, links };
  }, [evidenceMap, theme]);
  
  // Get color based on evidence type and quality
  function getEvidenceColor(type, quality) {
    // Base color by type
    let baseColor;
    switch (type) {
      case 'source':
        baseColor = theme.palette.info.main;
        break;
      case 'reasoning':
        baseColor = theme.palette.warning.main;
        break;
      case 'belief':
        baseColor = theme.palette.success.main;
        break;
      case 'constraint':
        baseColor = theme.palette.error.main;
        break;
      default:
        baseColor = theme.palette.grey[500];
    }
    
    // Adjust opacity based on quality
    return `${baseColor}${Math.round(quality * 255).toString(16).padStart(2, '0')}`;
  }
  
  // If no evidence map, show placeholder
  if (!evidenceMap) {
    return (
      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No evidence map available
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: 300, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeRelSize={6}
        linkWidth={link => link.value * 2}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={link => link.value * 2}
        nodeCanvasObject={(node, ctx, globalScale) => {
          // Draw node
          const label = node.name;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);
          
          // Node background
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
          ctx.fill();
          
          // Node border
          ctx.strokeStyle = theme.palette.background.paper;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // Node label background
          ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
          ctx.fillRect(
            node.x - bckgDimensions[0] / 2,
            node.y + node.val + 2,
            bckgDimensions[0],
            bckgDimensions[1]
          );
          
          // Node label
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = theme.palette.text.primary;
          ctx.fillText(
            label,
            node.x,
            node.y + node.val + 2 + bckgDimensions[1] / 2
          );
        }}
      />
    </Box>
  );
};

/**
 * Evidence List component that displays a detailed list of evidence items
 */
const EvidenceList = ({ evidenceMap }) => {
  const theme = useTheme();
  
  if (!evidenceMap || !evidenceMap.rootEvidence) {
    return (
      <Typography variant="body2" color="text.secondary">
        No evidence available
      </Typography>
    );
  }
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Evidence Details
      </Typography>
      {evidenceMap.rootEvidence.map((evidence, index) => (
        <Card key={evidence.id} sx={{ mb: 1, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {evidence.type.charAt(0).toUpperCase() + evidence.type.slice(1)}
                  <Chip 
                    label={`Quality: ${Math.round(evidence.quality * 100)}%`}
                    size="small"
                    sx={{ ml: 1 }}
                    color={evidence.quality > 0.7 ? 'success' : evidence.quality > 0.4 ? 'warning' : 'error'}
                  />
                  <Chip 
                    label={`Weight: ${Math.round(evidence.weight * 100)}%`}
                    size="small"
                    sx={{ ml: 1 }}
                    variant="outlined"
                  />
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {evidence.content.text || JSON.stringify(evidence.content)}
                </Typography>
              </Grid>
              {evidence.traceId && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Trace ID: {evidence.traceId}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

/**
 * Main Confidence Visualization component
 */
const ConfidenceVisualization = ({ decisionId, confidenceData, onRefresh }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  // Handle expand/collapse
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  // If no confidence data, show loading
  if (!confidenceData) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2">
              Loading confidence data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  const { confidenceScore, evidenceMap } = confidenceData;
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Confidence Analysis
            <Typography variant="caption" sx={{ ml: 1, color: theme.palette.text.secondary }}>
              Decision ID: {decisionId}
            </Typography>
          </Typography>
          <Box>
            <Tooltip title="Refresh confidence data">
              <IconButton size="small" onClick={onRefresh}>
                <InfoOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title={expanded ? "Show less" : "Show more"}>
              <IconButton size="small" onClick={handleExpandClick}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="subtitle2" gutterBottom>
              Confidence Score
            </Typography>
            <ConfidenceIndicator score={confidenceScore} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Algorithm: {confidenceScore?.algorithm || 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Evidence Count: {evidenceMap?.rootEvidence?.length || 0}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle2" gutterBottom>
              Evidence Map
            </Typography>
            <EvidenceMap evidenceMap={evidenceMap} />
          </Grid>
        </Grid>
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <EvidenceList evidenceMap={evidenceMap} />
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ConfidenceVisualization;
