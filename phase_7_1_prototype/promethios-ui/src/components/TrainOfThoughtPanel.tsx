/**
 * Train of Thought Panel Component
 * 
 * Displays the agent's reasoning process step-by-step, providing transparency
 * into how the agent analyzed the prompt, formed intentions, and reached conclusions.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  ExpandMore,
  Psychology,
  Lightbulb,
  Warning,
  CheckCircle,
  Error,
  Info,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import type { EnhancedAuditLogEntry } from '../extensions/EnhancedAuditLogEntry';

interface TrainOfThoughtPanelProps {
  auditEntry: EnhancedAuditLogEntry;
  showDetails?: boolean;
  compact?: boolean;
  onReasoningStepClick?: (step: string, details: any) => void;
}

interface ReasoningStep {
  id: string;
  title: string;
  content: string | string[];
  type: 'analysis' | 'planning' | 'evaluation' | 'decision' | 'reflection';
  confidence?: number;
  importance: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  timestamp?: string;
}

export const TrainOfThoughtPanel: React.FC<TrainOfThoughtPanelProps> = ({
  auditEntry,
  showDetails = true,
  compact = false,
  onReasoningStepClick
}) => {
  const [expanded, setExpanded] = useState(!compact);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  /**
   * Convert audit entry data into structured reasoning steps
   */
  const getReasoningSteps = (): ReasoningStep[] => {
    const steps: ReasoningStep[] = [];

    // Step 1: Prompt Analysis
    if (auditEntry.promptAnalysis) {
      steps.push({
        id: 'prompt_analysis',
        title: 'Prompt Analysis',
        content: typeof auditEntry.promptAnalysis === 'string' 
          ? auditEntry.promptAnalysis 
          : JSON.stringify(auditEntry.promptAnalysis, null, 2),
        type: 'analysis',
        importance: 'high',
        icon: <Psychology />,
        confidence: auditEntry.confidenceLevel
      });
    }

    // Step 2: Declared Intent
    if (auditEntry.declaredIntent) {
      steps.push({
        id: 'declared_intent',
        title: 'Declared Intent',
        content: auditEntry.declaredIntent,
        type: 'planning',
        importance: 'high',
        icon: <Lightbulb />
      });
    }

    // Step 3: Chosen Plan
    if (auditEntry.chosenPlan) {
      steps.push({
        id: 'chosen_plan',
        title: 'Chosen Approach',
        content: auditEntry.chosenPlan,
        type: 'planning',
        importance: 'high',
        icon: <CheckCircle />
      });
    }

    // Step 4: Attention Focus
    if (auditEntry.attentionFocus && auditEntry.attentionFocus.length > 0) {
      steps.push({
        id: 'attention_focus',
        title: 'Focus Areas',
        content: auditEntry.attentionFocus,
        type: 'analysis',
        importance: 'medium',
        icon: <Visibility />
      });
    }

    // Step 5: Knowledge Gaps
    if (auditEntry.knowledgeGaps && auditEntry.knowledgeGaps.length > 0) {
      steps.push({
        id: 'knowledge_gaps',
        title: 'Knowledge Limitations',
        content: auditEntry.knowledgeGaps,
        type: 'reflection',
        importance: 'medium',
        icon: <Warning />
      });
    }

    // Step 6: Assumptions Made
    if (auditEntry.assumptionsMade && auditEntry.assumptionsMade.length > 0) {
      steps.push({
        id: 'assumptions',
        title: 'Assumptions Made',
        content: auditEntry.assumptionsMade,
        type: 'reflection',
        importance: 'high',
        icon: <Info />
      });
    }

    // Step 7: Alternatives Considered
    if (auditEntry.alternativesConsidered && auditEntry.alternativesConsidered.length > 0) {
      steps.push({
        id: 'alternatives',
        title: 'Alternatives Considered',
        content: auditEntry.alternativesConsidered,
        type: 'evaluation',
        importance: 'medium',
        icon: <Lightbulb />
      });
    }

    // Step 8: Bias Detection
    if (auditEntry.biasDetection && auditEntry.biasDetection.length > 0) {
      steps.push({
        id: 'bias_detection',
        title: 'Bias Detection',
        content: auditEntry.biasDetection.map(bias => 
          typeof bias === 'string' ? bias : JSON.stringify(bias)
        ),
        type: 'reflection',
        importance: 'high',
        icon: <Warning />
      });
    }

    return steps;
  };

  const reasoningSteps = getReasoningSteps();

  /**
   * Get step type color
   */
  const getStepTypeColor = (type: ReasoningStep['type']) => {
    switch (type) {
      case 'analysis': return '#2196F3';
      case 'planning': return '#4CAF50';
      case 'evaluation': return '#FF9800';
      case 'decision': return '#9C27B0';
      case 'reflection': return '#607D8B';
      default: return '#757575';
    }
  };

  /**
   * Get importance indicator
   */
  const getImportanceIndicator = (importance: ReasoningStep['importance']) => {
    switch (importance) {
      case 'high': return <TimelineDot color="primary" />;
      case 'medium': return <TimelineDot color="secondary" />;
      case 'low': return <TimelineDot variant="outlined" />;
      default: return <TimelineDot />;
    }
  };

  /**
   * Render step content
   */
  const renderStepContent = (content: string | string[]) => {
    if (Array.isArray(content)) {
      return (
        <Box>
          {content.map((item, index) => (
            <Chip
              key={index}
              label={item}
              size="small"
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>
      );
    }
    
    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {content}
      </Typography>
    );
  };

  /**
   * Handle step click
   */
  const handleStepClick = (step: ReasoningStep) => {
    setSelectedStep(selectedStep === step.id ? null : step.id);
    
    if (onReasoningStepClick) {
      onReasoningStepClick(step.id, {
        title: step.title,
        content: step.content,
        type: step.type,
        confidence: step.confidence
      });
    }
  };

  if (reasoningSteps.length === 0) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No reasoning process data available for this interaction.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology />
              Reasoning Process ({reasoningSteps.length} steps)
            </Typography>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Box>
          
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              {reasoningSteps.slice(0, 3).map((step, index) => (
                <Box key={step.id} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {step.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Array.isArray(step.content) 
                      ? step.content.slice(0, 2).join(', ') + (step.content.length > 2 ? '...' : '')
                      : step.content.substring(0, 100) + (step.content.length > 100 ? '...' : '')
                    }
                  </Typography>
                </Box>
              ))}
              {reasoningSteps.length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  +{reasoningSteps.length - 3} more steps...
                </Typography>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology />
            Agent Reasoning Process
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${reasoningSteps.length} steps`}
              size="small"
              color="primary"
              variant="outlined"
            />
            {auditEntry.confidenceLevel && (
              <Tooltip title={`Overall confidence: ${(auditEntry.confidenceLevel * 100).toFixed(1)}%`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                  <Typography variant="caption">Confidence:</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={auditEntry.confidenceLevel * 100}
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Tooltip>
            )}
            <IconButton size="small" onClick={() => setShowAdvanced(!showAdvanced)}>
              <ExpandMore sx={{ transform: showAdvanced ? 'rotate(180deg)' : 'none' }} />
            </IconButton>
          </Box>
        </Box>

        {/* Reasoning Timeline */}
        <Timeline position="left">
          {reasoningSteps.map((step, index) => (
            <TimelineItem key={step.id}>
              <TimelineOppositeContent sx={{ flex: 0.3 }}>
                <Typography variant="caption" color="text.secondary">
                  Step {index + 1}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {step.title}
                </Typography>
              </TimelineOppositeContent>
              
              <TimelineSeparator>
                {getImportanceIndicator(step.importance)}
                {index < reasoningSteps.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              
              <TimelineContent>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    borderLeft: `4px solid ${getStepTypeColor(step.type)}`
                  }}
                  onClick={() => handleStepClick(step)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {step.icon}
                      <Chip
                        label={step.type}
                        size="small"
                        sx={{ 
                          bgcolor: getStepTypeColor(step.type),
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                      {step.confidence && (
                        <Chip
                          label={`${(step.confidence * 100).toFixed(0)}%`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Collapse in={selectedStep === step.id || !showDetails}>
                      {renderStepContent(step.content)}
                    </Collapse>
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>

        {/* Advanced Details */}
        {showAdvanced && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2">Advanced Reasoning Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {auditEntry.uncertaintyRating !== undefined && (
                  <Box>
                    <Typography variant="body2" fontWeight="medium">Uncertainty Rating:</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={auditEntry.uncertaintyRating * 100}
                      color="warning"
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption">
                      {(auditEntry.uncertaintyRating * 100).toFixed(1)}% uncertain
                    </Typography>
                  </Box>
                )}
                
                {auditEntry.cognitiveLoad !== undefined && (
                  <Box>
                    <Typography variant="body2" fontWeight="medium">Cognitive Load:</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={auditEntry.cognitiveLoad * 100}
                      color="info"
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption">
                      {(auditEntry.cognitiveLoad * 100).toFixed(1)}% processing complexity
                    </Typography>
                  </Box>
                )}

                {auditEntry.personaMode && (
                  <Box>
                    <Typography variant="body2" fontWeight="medium">Persona Mode:</Typography>
                    <Chip label={auditEntry.personaMode} size="small" sx={{ mt: 1 }} />
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainOfThoughtPanel;

