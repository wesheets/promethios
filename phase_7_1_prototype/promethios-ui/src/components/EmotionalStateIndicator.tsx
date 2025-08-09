/**
 * Emotional State Indicator Component
 * 
 * Displays the agent's emotional state and safety checks from Emotional Veritas,
 * providing transparency into emotional intelligence and safety assessments.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import {
  Favorite,
  Psychology,
  Security,
  Warning,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  Mood,
  MoodBad,
  SentimentSatisfied,
  SentimentDissatisfied,
  SentimentNeutral
} from '@mui/icons-material';
import type { EmotionalVeritasAuditData } from '../extensions/EnhancedAuditLogEntry';

interface EmotionalStateIndicatorProps {
  emotionalData: EmotionalVeritasAuditData;
  showDetails?: boolean;
  compact?: boolean;
  onEmotionalStateClick?: (emotion: string, details: any) => void;
}

interface EmotionalMetric {
  label: string;
  value: number;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  icon: React.ReactNode;
  description: string;
}

export const EmotionalStateIndicator: React.FC<EmotionalStateIndicatorProps> = ({
  emotionalData,
  showDetails = true,
  compact = false,
  onEmotionalStateClick
}) => {
  const [expanded, setExpanded] = useState(!compact);

  /**
   * Get emotion icon based on primary emotion
   */
  const getEmotionIcon = (emotion: string) => {
    const emotionLower = emotion.toLowerCase();
    
    if (emotionLower.includes('happy') || emotionLower.includes('joy') || emotionLower.includes('excited')) {
      return <SentimentSatisfied color="success" />;
    }
    if (emotionLower.includes('sad') || emotionLower.includes('disappointed') || emotionLower.includes('frustrated')) {
      return <SentimentDissatisfied color="error" />;
    }
    if (emotionLower.includes('angry') || emotionLower.includes('irritated')) {
      return <MoodBad color="error" />;
    }
    if (emotionLower.includes('calm') || emotionLower.includes('neutral') || emotionLower.includes('balanced')) {
      return <SentimentNeutral color="primary" />;
    }
    if (emotionLower.includes('curious') || emotionLower.includes('interested')) {
      return <Psychology color="info" />;
    }
    
    return <Mood color="primary" />;
  };

  /**
   * Get safety status color and icon
   */
  const getSafetyStatus = () => {
    if (emotionalData.safety_checks_passed) {
      return {
        color: 'success' as const,
        icon: <CheckCircle />,
        label: 'Safe',
        description: 'All emotional safety checks passed'
      };
    } else {
      return {
        color: 'error' as const,
        icon: <Error />,
        label: 'Risk Detected',
        description: 'Emotional safety concerns identified'
      };
    }
  };

  /**
   * Get risk level color
   */
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'info';
    }
  };

  /**
   * Get emotional metrics for display
   */
  const getEmotionalMetrics = (): EmotionalMetric[] => {
    const metrics: EmotionalMetric[] = [];

    // Legacy emotional metrics (if available)
    if (emotionalData.confidence !== undefined) {
      metrics.push({
        label: 'Confidence',
        value: emotionalData.confidence,
        color: emotionalData.confidence > 0.7 ? 'success' : emotionalData.confidence > 0.4 ? 'warning' : 'error',
        icon: <CheckCircle />,
        description: 'Agent confidence in response'
      });
    }

    if (emotionalData.curiosity !== undefined) {
      metrics.push({
        label: 'Curiosity',
        value: emotionalData.curiosity,
        color: 'info',
        icon: <Psychology />,
        description: 'Level of intellectual curiosity'
      });
    }

    if (emotionalData.concern !== undefined) {
      metrics.push({
        label: 'Concern',
        value: emotionalData.concern,
        color: emotionalData.concern > 0.6 ? 'warning' : 'success',
        icon: <Warning />,
        description: 'Level of concern about response'
      });
    }

    if (emotionalData.excitement !== undefined) {
      metrics.push({
        label: 'Excitement',
        value: emotionalData.excitement,
        color: 'secondary',
        icon: <Favorite />,
        description: 'Enthusiasm about the topic'
      });
    }

    if (emotionalData.clarity !== undefined) {
      metrics.push({
        label: 'Clarity',
        value: emotionalData.clarity,
        color: emotionalData.clarity > 0.7 ? 'success' : 'warning',
        icon: <Info />,
        description: 'Clarity of understanding'
      });
    }

    if (emotionalData.alignment !== undefined) {
      metrics.push({
        label: 'Alignment',
        value: emotionalData.alignment,
        color: emotionalData.alignment > 0.8 ? 'success' : 'warning',
        icon: <Security />,
        description: 'Alignment with user values'
      });
    }

    return metrics;
  };

  const safetyStatus = getSafetyStatus();
  const emotionalMetrics = getEmotionalMetrics();

  /**
   * Handle emotion click
   */
  const handleEmotionClick = (emotion: string) => {
    if (onEmotionalStateClick) {
      onEmotionalStateClick(emotion, {
        primary_emotion: emotionalData.primary_emotion,
        secondary_emotions: emotionalData.secondary_emotions,
        emotional_intensity: emotionalData.emotional_intensity,
        emotional_reasoning: emotionalData.emotional_reasoning
      });
    }
  };

  if (compact) {
    return (
      <Card sx={{ mb: 1 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {emotionalData.primary_emotion && getEmotionIcon(emotionalData.primary_emotion)}
              <Typography variant="body2" fontWeight="medium">
                {emotionalData.primary_emotion || 'Neutral'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={safetyStatus.icon}
                label={safetyStatus.label}
                color={safetyStatus.color}
                size="small"
              />
              {emotionalData.emotional_risk_level && (
                <Chip
                  label={emotionalData.emotional_risk_level}
                  color={getRiskLevelColor(emotionalData.emotional_risk_level) as any}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
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
            Emotional Intelligence
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={safetyStatus.icon}
              label={safetyStatus.label}
              color={safetyStatus.color}
              size="small"
            />
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              <ExpandMore sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
            </IconButton>
          </Box>
        </Box>

        {/* Safety Alert */}
        {!emotionalData.safety_checks_passed && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Emotional safety concerns detected. Review recommended before proceeding.
            </Typography>
          </Alert>
        )}

        {/* Primary Emotional State */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Emotional State
          </Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              p: 2, 
              bgcolor: 'action.hover', 
              borderRadius: 1,
              cursor: 'pointer'
            }}
            onClick={() => emotionalData.primary_emotion && handleEmotionClick(emotionalData.primary_emotion)}
          >
            {emotionalData.primary_emotion && getEmotionIcon(emotionalData.primary_emotion)}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                {emotionalData.primary_emotion || 'Neutral'}
              </Typography>
              {emotionalData.emotional_intensity !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="caption">Intensity:</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={emotionalData.emotional_intensity * 100}
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption">
                    {(emotionalData.emotional_intensity * 100).toFixed(0)}%
                  </Typography>
                </Box>
              )}
            </Box>
            {emotionalData.emotional_risk_level && (
              <Chip
                label={emotionalData.emotional_risk_level}
                color={getRiskLevelColor(emotionalData.emotional_risk_level) as any}
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* Secondary Emotions */}
        {emotionalData.secondary_emotions && emotionalData.secondary_emotions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Secondary Emotions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {emotionalData.secondary_emotions.map((emotion, index) => (
                <Chip
                  key={index}
                  label={emotion}
                  size="small"
                  variant="outlined"
                  onClick={() => handleEmotionClick(emotion)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Emotional Metrics */}
        {emotionalMetrics.length > 0 && (
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Emotional Metrics
            </Typography>
            <Grid container spacing={2}>
              {emotionalMetrics.map((metric, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {metric.icon}
                      <Typography variant="body2" fontWeight="medium">
                        {metric.label}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metric.value * 100}
                      color={metric.color}
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {metric.description}
                      </Typography>
                      <Typography variant="caption" fontWeight="medium">
                        {(metric.value * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        )}

        {/* Emotional Reasoning */}
        {emotionalData.emotional_reasoning && (
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Emotional Analysis
            </Typography>
            <Typography variant="body2" sx={{ 
              p: 2, 
              bgcolor: 'action.hover', 
              borderRadius: 1,
              fontStyle: 'italic'
            }}>
              "{emotionalData.emotional_reasoning}"
            </Typography>
          </Collapse>
        )}

        {/* Emotional Stability */}
        {emotionalData.emotional_stability !== undefined && (
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Emotional Stability
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={emotionalData.emotional_stability * 100}
                  color={emotionalData.emotional_stability > 0.7 ? 'success' : 'warning'}
                  sx={{ flexGrow: 1 }}
                />
                <Typography variant="caption">
                  {(emotionalData.emotional_stability * 100).toFixed(0)}%
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Measures emotional consistency and predictability
              </Typography>
            </Box>
          </Collapse>
        )}

        {/* Analysis Type */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
            <Chip
              label={emotionalData.emotional_analysis_type || 'Unknown'}
              size="small"
              color={emotionalData.emotional_veritas_available ? 'success' : 'warning'}
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              {emotionalData.emotional_veritas_available 
                ? 'Emotional Veritas analysis available'
                : 'Fallback emotional analysis'
              }
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EmotionalStateIndicator;

