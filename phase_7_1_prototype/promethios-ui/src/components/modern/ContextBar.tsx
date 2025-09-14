/**
 * ContextBar - Conversation intelligence and status bar
 * Shows AI-generated insights, conversation summary, and smart suggestions
 */

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Collapse,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lightbulb as InsightIcon,
  TrendingUp as TrendingIcon,
  Group as GroupIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as SuggestionsIcon
} from '@mui/icons-material';

interface ConversationInsight {
  type: 'summary' | 'trend' | 'suggestion' | 'collaboration' | 'sentiment';
  title: string;
  content: string;
  confidence: number;
  actionable?: boolean;
}

interface ConversationMetrics {
  messageCount: number;
  participantCount: number;
  agentCount: number;
  humanCount: number;
  avgResponseTime: number;
  collaborationScore: number;
  sentimentScore: number;
}

interface ContextBarProps {
  insights: ConversationInsight[];
  metrics: ConversationMetrics;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  height?: string;
}

const ContextBar: React.FC<ContextBarProps> = ({
  insights,
  metrics,
  isExpanded = false,
  onToggleExpanded,
  height = '60px'
}) => {
  const [localExpanded, setLocalExpanded] = useState(isExpanded);

  const handleToggle = () => {
    const newExpanded = !localExpanded;
    setLocalExpanded(newExpanded);
    onToggleExpanded?.();
  };

  const getInsightIcon = (type: ConversationInsight['type']) => {
    switch (type) {
      case 'summary':
        return <PsychologyIcon sx={{ fontSize: 16 }} />;
      case 'trend':
        return <TrendingIcon sx={{ fontSize: 16 }} />;
      case 'suggestion':
        return <SuggestionsIcon sx={{ fontSize: 16 }} />;
      case 'collaboration':
        return <GroupIcon sx={{ fontSize: 16 }} />;
      case 'sentiment':
        return <InsightIcon sx={{ fontSize: 16 }} />;
      default:
        return <InsightIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getInsightColor = (type: ConversationInsight['type']) => {
    switch (type) {
      case 'summary':
        return '#3B82F6';
      case 'trend':
        return '#10B981';
      case 'suggestion':
        return '#F59E0B';
      case 'collaboration':
        return '#8B5CF6';
      case 'sentiment':
        return '#EC4899';
      default:
        return '#64748B';
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.7) return '#10B981'; // Positive - Green
    if (score > 0.3) return '#F59E0B'; // Neutral - Amber
    return '#EF4444'; // Negative - Red
  };

  const getCollaborationColor = (score: number) => {
    if (score > 0.8) return '#10B981'; // Excellent
    if (score > 0.6) return '#3B82F6'; // Good
    if (score > 0.4) return '#F59E0B'; // Fair
    return '#EF4444'; // Poor
  };

  return (
    <Box
      sx={{
        backgroundColor: '#0f172a',
        borderTop: '1px solid #334155',
        borderBottom: '1px solid #334155',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Collapsed Header */}
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          cursor: 'pointer'
        }}
        onClick={handleToggle}
      >
        {/* Conversation Summary */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            Conversation Intelligence
          </Typography>

          {/* Quick Metrics */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${metrics.messageCount} messages`}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                backgroundColor: '#334155',
                color: '#94a3b8'
              }}
            />
            <Chip
              label={`${metrics.participantCount} participants`}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                backgroundColor: '#334155',
                color: '#94a3b8'
              }}
            />
            <Chip
              label={`${Math.round(metrics.collaborationScore * 100)}% collaboration`}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                backgroundColor: `${getCollaborationColor(metrics.collaborationScore)}20`,
                color: getCollaborationColor(metrics.collaborationScore),
                border: `1px solid ${getCollaborationColor(metrics.collaborationScore)}40`
              }}
            />
          </Box>

          {/* Sentiment Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#94a3b8',
                fontSize: '0.7rem'
              }}
            >
              Sentiment:
            </Typography>
            <Box
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#334155',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  width: `${metrics.sentimentScore * 100}%`,
                  height: '100%',
                  backgroundColor: getSentimentColor(metrics.sentimentScore),
                  transition: 'all 0.3s ease'
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Insights Count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<InsightIcon sx={{ fontSize: 14 }} />}
            label={`${insights.length} insights`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              backgroundColor: '#3B82F620',
              color: '#3B82F6',
              border: '1px solid #3B82F640'
            }}
          />
          <IconButton
            size="small"
            sx={{
              color: '#94a3b8',
              '&:hover': { color: '#e2e8f0' }
            }}
          >
            {localExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded Content */}
      <Collapse in={localExpanded}>
        <Box sx={{ p: 2, pt: 0 }}>
          {/* Detailed Metrics */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
              mb: 3
            }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#1e293b',
                border: '1px solid #334155'
              }}
            >
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                Participants
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label={`${metrics.agentCount} AI`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: '#3B82F620',
                    color: '#3B82F6'
                  }}
                />
                <Chip
                  label={`${metrics.humanCount} Human`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: '#F59E0B20',
                    color: '#F59E0B'
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#1e293b',
                border: '1px solid #334155'
              }}
            >
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                Response Time
              </Typography>
              <Typography variant="h6" sx={{ color: '#e2e8f0', fontSize: '1.1rem', mt: 0.5 }}>
                {metrics.avgResponseTime.toFixed(1)}s
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#1e293b',
                border: '1px solid #334155'
              }}
            >
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                Collaboration Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={metrics.collaborationScore * 100}
                  sx={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#334155',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getCollaborationColor(metrics.collaborationScore)
                    }
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: getCollaborationColor(metrics.collaborationScore),
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}
                >
                  {Math.round(metrics.collaborationScore * 100)}%
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Insights */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#e2e8f0',
                fontWeight: 600,
                fontSize: '0.875rem',
                mb: 1.5
              }}
            >
              AI Insights
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {insights.map((insight, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#1e293b',
                    border: `1px solid ${getInsightColor(insight.type)}40`,
                    borderLeft: `4px solid ${getInsightColor(insight.type)}`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ color: getInsightColor(insight.type) }}>
                      {getInsightIcon(insight.type)}
                    </Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: getInsightColor(insight.type),
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}
                    >
                      {insight.title}
                    </Typography>
                    <Chip
                      label={`${Math.round(insight.confidence * 100)}%`}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        backgroundColor: `${getInsightColor(insight.type)}20`,
                        color: getInsightColor(insight.type),
                        ml: 'auto'
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#e2e8f0',
                      fontSize: '0.8rem',
                      lineHeight: 1.4
                    }}
                  >
                    {insight.content}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ContextBar;

