/**
 * Uncertainty Analysis Display Component
 * 
 * Displays multidimensional uncertainty analysis with interactive visualizations
 * and clarification recommendations.
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  Help,
  Warning,
  Info,
  CheckCircle,
  Error,
  Psychology,
  QuestionAnswer,
  TrendingUp,
  AccessTime,
  Group,
  Lightbulb
} from '@mui/icons-material';
import { UncertaintyAnalysis, UncertaintyDimensions } from '../types';

interface UncertaintyAnalysisDisplayProps {
  analysis: UncertaintyAnalysis;
  onHITLTrigger?: () => void;
  onActionSelect?: (actionType: string) => void;
  className?: string;
}

const UncertaintyAnalysisDisplay: React.FC<UncertaintyAnalysisDisplayProps> = ({
  analysis,
  onHITLTrigger,
  onActionSelect,
  className = ''
}) => {
  const [expandedSection, setExpandedSection] = useState<string | false>('overview');

  const getUncertaintyColor = (level: number): string => {
    if (level <= 0.3) return '#10B981'; // Green
    if (level <= 0.6) return '#F59E0B'; // Yellow
    if (level <= 0.8) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getUncertaintyLevel = (level: number): string => {
    if (level <= 0.3) return 'Low';
    if (level <= 0.6) return 'Medium';
    if (level <= 0.8) return 'High';
    return 'Critical';
  };

  const getDimensionIcon = (dimension: keyof UncertaintyDimensions) => {
    switch (dimension) {
      case 'epistemic': return <Psychology />;
      case 'aleatoric': return <TrendingUp />;
      case 'confidence': return <CheckCircle />;
      case 'contextual': return <Info />;
      case 'temporal': return <AccessTime />;
      case 'social': return <Group />;
      default: return <Help />;
    }
  };

  const getDimensionDescription = (dimension: keyof UncertaintyDimensions): string => {
    switch (dimension) {
      case 'epistemic': return 'Knowledge gaps and missing information';
      case 'aleatoric': return 'Inherent randomness and variability';
      case 'confidence': return 'Model confidence in predictions';
      case 'contextual': return 'Context-dependent ambiguity';
      case 'temporal': return 'Time-sensitive factors';
      case 'social': return 'Human and social considerations';
      default: return 'Unknown uncertainty dimension';
    }
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'knowledge_gap': return <Psychology color="warning" />;
      case 'ambiguous_context': return <Info color="info" />;
      case 'conflicting_evidence': return <Error color="error" />;
      case 'temporal_dependency': return <AccessTime color="primary" />;
      case 'social_factors': return <Group color="secondary" />;
      default: return <Help color="disabled" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'initiate_hitl': return <QuestionAnswer color="primary" />;
      case 'gather_evidence': return <Psychology color="info" />;
      case 'consult_expert': return <Group color="secondary" />;
      case 'wait_for_context': return <AccessTime color="warning" />;
      case 'proceed_with_caution': return <Warning color="error" />;
      default: return <Lightbulb color="disabled" />;
    }
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  return (
    <Box className={`uncertainty-analysis-display ${className}`}>
      {/* Overall Uncertainty Header */}
      <Card sx={{ mb: 2, backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <Psychology />
              <Typography variant="h6">Uncertainty Analysis</Typography>
              <Chip
                label={`${getUncertaintyLevel(analysis.overallUncertainty)} (${(analysis.overallUncertainty * 100).toFixed(1)}%)`}
                sx={{
                  backgroundColor: getUncertaintyColor(analysis.overallUncertainty),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          }
          action={
            analysis.overallUncertainty > 0.7 && onHITLTrigger && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<QuestionAnswer />}
                onClick={onHITLTrigger}
                sx={{ backgroundColor: '#3182ce' }}
              >
                Start Collaboration
              </Button>
            )
          }
        />
        <CardContent>
          <Box mb={2}>
            <LinearProgress
              variant="determinate"
              value={analysis.overallUncertainty * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getUncertaintyColor(analysis.overallUncertainty)
                }
              }}
            />
          </Box>
          
          {analysis.overallUncertainty > 0.7 && (
            <Alert 
              severity="warning" 
              sx={{ backgroundColor: '#4a5568', color: 'white', '& .MuiAlert-icon': { color: '#F59E0B' } }}
            >
              High uncertainty detected. Human collaboration recommended for optimal results.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Uncertainty Dimensions */}
      <Accordion 
        expanded={expandedSection === 'dimensions'} 
        onChange={handleAccordionChange('dimensions')}
        sx={{ backgroundColor: '#2d3748', color: 'white', mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Typography variant="h6">Uncertainty Dimensions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {Object.entries(analysis.dimensions).map(([dimension, value]) => (
              <Grid item xs={12} md={6} key={dimension}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Tooltip title={getDimensionDescription(dimension as keyof UncertaintyDimensions)}>
                    <IconButton size="small" sx={{ color: 'white' }}>
                      {getDimensionIcon(dimension as keyof UncertaintyDimensions)}
                    </IconButton>
                  </Tooltip>
                  <Box flex={1}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize', mb: 0.5 }}>
                      {dimension}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={value * 100}
                        sx={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getUncertaintyColor(value)
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 40 }}>
                        {(value * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Uncertainty Sources */}
      <Accordion 
        expanded={expandedSection === 'sources'} 
        onChange={handleAccordionChange('sources')}
        sx={{ backgroundColor: '#2d3748', color: 'white', mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Typography variant="h6">
            Uncertainty Sources ({analysis.sources.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {analysis.sources.map((source, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon>
                  {getSourceTypeIcon(source.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {source.type.replace(/_/g, ' ')}
                      </Typography>
                      <Chip
                        label={`${(source.severity * 100).toFixed(0)}% severity`}
                        size="small"
                        sx={{
                          backgroundColor: getUncertaintyColor(source.severity),
                          color: 'white'
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        {source.description}
                      </Typography>
                      {source.relatedClaim && (
                        <Typography variant="caption" sx={{ color: '#718096' }}>
                          Related: "{source.relatedClaim}"
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: '#4299e1', display: 'block', mt: 0.5 }}>
                        Resolution: {source.resolutionApproach.replace(/_/g, ' ')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Clarification Needs */}
      <Accordion 
        expanded={expandedSection === 'clarification'} 
        onChange={handleAccordionChange('clarification')}
        sx={{ backgroundColor: '#2d3748', color: 'white', mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Typography variant="h6">
            Clarification Needs ({analysis.clarificationNeeds.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {analysis.clarificationNeeds.map((need, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon>
                  <QuestionAnswer color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {need.question}
                      </Typography>
                      <Chip
                        label={`Priority ${need.priority}`}
                        size="small"
                        color={need.priority >= 4 ? 'error' : need.priority >= 3 ? 'warning' : 'info'}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Type: {need.type.replace(/_/g, ' ')} | 
                        Expected: {need.expectedResponseType} |
                        Uncertainty reduction: {(need.uncertaintyReduction * 100).toFixed(0)}%
                      </Typography>
                      {need.responseOptions && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#718096' }}>
                            Options: {need.responseOptions.join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Recommended Actions */}
      <Accordion 
        expanded={expandedSection === 'actions'} 
        onChange={handleAccordionChange('actions')}
        sx={{ backgroundColor: '#2d3748', color: 'white', mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Typography variant="h6">
            Recommended Actions ({analysis.recommendedActions.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {analysis.recommendedActions.map((action, index) => (
              <ListItem 
                key={index} 
                sx={{ px: 0 }}
                secondaryAction={
                  onActionSelect && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onActionSelect(action.type)}
                      sx={{ color: 'white', borderColor: 'white' }}
                    >
                      Execute
                    </Button>
                  )
                }
              >
                <ListItemIcon>
                  {getActionIcon(action.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {action.type.replace(/_/g, ' ')}
                      </Typography>
                      <Chip
                        label={`${(action.effectiveness * 100).toFixed(0)}% effective`}
                        size="small"
                        sx={{
                          backgroundColor: getUncertaintyColor(1 - action.effectiveness),
                          color: 'white'
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        {action.description}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Estimated time: {action.estimatedTime} minutes | 
                        Resources: {action.resourcesRequired.join(', ')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Analysis Metadata */}
      <Card sx={{ backgroundColor: '#4a5568', color: 'white' }}>
        <CardContent>
          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
            Analysis completed at {new Date(analysis.timestamp).toLocaleString()}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UncertaintyAnalysisDisplay;

