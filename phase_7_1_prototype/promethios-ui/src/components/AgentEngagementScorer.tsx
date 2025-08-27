/**
 * AgentEngagementScorer - Evaluates agent engagement quality and cost-effectiveness
 * Part of the revolutionary token-aware AI collaboration system
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Rating,
  Button,
  Stack,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  TrendingUp,
  TrendingDown,
  Psychology,
  AttachMoney,
  ExpandMore,
  ExpandLess,
  Star,
  Warning
} from '@mui/icons-material';
import { TokenEconomicsService, AgentEngagementMetrics } from '../services/TokenEconomicsService';

export interface AgentEngagementScorerProps {
  agentId: string;
  agentName: string;
  agentResponse: string;
  estimatedCost: number;
  interactionId?: string;
  onScoreSubmitted?: (score: number, feedback: string) => void;
}

export const AgentEngagementScorer: React.FC<AgentEngagementScorerProps> = ({
  agentId,
  agentName,
  agentResponse,
  estimatedCost,
  interactionId,
  onScoreSubmitted
}) => {
  const [valueScore, setValueScore] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [agentMetrics, setAgentMetrics] = useState<AgentEngagementMetrics | null>(null);
  const [hasScored, setHasScored] = useState(false);

  const tokenService = TokenEconomicsService.getInstance();

  // Load agent metrics
  useEffect(() => {
    const metrics = tokenService.getAgentMetrics(agentId);
    setAgentMetrics(metrics);
  }, [agentId]);

  // Handle score submission
  const handleScoreSubmit = async (score: number) => {
    try {
      setValueScore(score);
      setHasScored(true);

      // Update agent metrics with the score
      // This would typically be done through the TokenEconomicsService
      console.log('📊 [AgentScorer] Score submitted:', agentName, score);

      // Provide feedback to parent component
      const feedback = getFeedbackMessage(score);
      onScoreSubmitted?.(score, feedback);

    } catch (error) {
      console.error('❌ [AgentScorer] Error submitting score:', error);
    }
  };

  // Get feedback message based on score
  const getFeedbackMessage = (score: number): string => {
    if (score >= 9) return 'Exceptional value - highly insightful and worth the cost';
    if (score >= 7) return 'Good value - provided useful perspective';
    if (score >= 5) return 'Adequate value - standard response quality';
    if (score >= 3) return 'Limited value - response was basic or redundant';
    return 'Poor value - response did not justify the token cost';
  };

  // Get cost efficiency rating
  const getCostEfficiencyRating = (): {
    rating: 'excellent' | 'good' | 'fair' | 'poor';
    color: string;
    message: string;
  } => {
    if (!agentMetrics) {
      return { rating: 'fair', color: '#64748b', message: 'No historical data' };
    }

    const costPerValue = agentMetrics.averageCost / Math.max(agentMetrics.valueAddScore, 1);
    
    if (costPerValue < 0.001) {
      return { rating: 'excellent', color: '#10b981', message: 'Highly cost-effective' };
    } else if (costPerValue < 0.005) {
      return { rating: 'good', color: '#3b82f6', message: 'Good cost-benefit ratio' };
    } else if (costPerValue < 0.01) {
      return { rating: 'fair', color: '#f59e0b', message: 'Moderate cost efficiency' };
    } else {
      return { rating: 'poor', color: '#ef4444', message: 'High cost, low value' };
    }
  };

  const costEfficiency = getCostEfficiencyRating();

  return (
    <Paper
      sx={{
        bgcolor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 2,
        overflow: 'hidden',
        mt: 1
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: '#3b82f6', fontSize: '0.7rem' }}>
            {agentName.charAt(0)}
          </Avatar>
          
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
            {agentName} Response Quality
          </Typography>

          <Chip
            label={`$${estimatedCost.toFixed(4)}`}
            size="small"
            sx={{
              bgcolor: '#0f172a',
              color: '#94a3b8',
              fontSize: '0.7rem',
              height: 20
            }}
          />

          {agentMetrics && (
            <Chip
              label={`${agentMetrics.valueAddScore.toFixed(1)}/10 avg`}
              size="small"
              sx={{
                bgcolor: costEfficiency.color + '20',
                color: costEfficiency.color,
                fontSize: '0.7rem',
                height: 20
              }}
            />
          )}
        </Box>

        <IconButton size="small" sx={{ color: '#94a3b8' }}>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Expanded Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Value Rating */}
            {!hasScored ? (
              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  How valuable was this response?
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Rating
                    value={valueScore}
                    onChange={(_, newValue) => newValue && handleScoreSubmit(newValue)}
                    max={10}
                    sx={{
                      '& .MuiRating-iconFilled': { color: '#f59e0b' },
                      '& .MuiRating-iconHover': { color: '#fbbf24' }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    (1-10 stars)
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                  Consider: Was it insightful? Did it add unique value? Worth the token cost?
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Your Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Rating
                    value={valueScore}
                    readOnly
                    max={10}
                    sx={{
                      '& .MuiRating-iconFilled': { color: '#f59e0b' }
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 500 }}>
                    {valueScore}/10
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                  {getFeedbackMessage(valueScore || 0)}
                </Typography>
              </Box>
            )}

            {/* Agent Performance Metrics */}
            {agentMetrics && (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: '#0f172a',
                  borderRadius: 1,
                  border: `1px solid ${costEfficiency.color}20`
                }}
              >
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Agent Performance History
                </Typography>
                
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star sx={{ fontSize: 14, color: '#f59e0b' }} />
                    <Typography variant="caption" sx={{ color: 'white' }}>
                      {agentMetrics.valueAddScore.toFixed(1)}/10 avg
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachMoney sx={{ fontSize: 14, color: '#64748b' }} />
                    <Typography variant="caption" sx={{ color: 'white' }}>
                      ${agentMetrics.averageCost.toFixed(4)} avg cost
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Psychology sx={{ fontSize: 14, color: '#3b82f6' }} />
                    <Typography variant="caption" sx={{ color: 'white' }}>
                      {agentMetrics.totalInteractions} interactions
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {costEfficiency.rating === 'excellent' && <TrendingUp sx={{ fontSize: 16, color: costEfficiency.color }} />}
                  {costEfficiency.rating === 'poor' && <TrendingDown sx={{ fontSize: 16, color: costEfficiency.color }} />}
                  <Typography variant="caption" sx={{ color: costEfficiency.color }}>
                    {costEfficiency.message}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Cost Analysis */}
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#0f172a',
                borderRadius: 1
              }}
            >
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                Cost Analysis
              </Typography>
              
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Estimated Cost:
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    ${estimatedCost.toFixed(4)}
                  </Typography>
                </Box>
                
                {agentMetrics && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Cost-Benefit Ratio:
                      </Typography>
                      <Typography variant="caption" sx={{ color: costEfficiency.color }}>
                        {agentMetrics.costBenefitRatio.toFixed(2)}x
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Token Efficiency:
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        ${agentMetrics.tokenEfficiency.toFixed(4)}/interaction
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </Box>

            {/* Quick Actions */}
            {!hasScored && (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<ThumbUp />}
                  onClick={() => handleScoreSubmit(8)}
                  sx={{
                    bgcolor: '#10b98120',
                    color: '#10b981',
                    border: '1px solid #10b98140',
                    '&:hover': { bgcolor: '#10b98130' }
                  }}
                >
                  High Value
                </Button>
                
                <Button
                  size="small"
                  startIcon={<ThumbDown />}
                  onClick={() => handleScoreSubmit(3)}
                  sx={{
                    bgcolor: '#ef444420',
                    color: '#ef4444',
                    border: '1px solid #ef444440',
                    '&:hover': { bgcolor: '#ef444430' }
                  }}
                >
                  Low Value
                </Button>
              </Stack>
            )}

            {/* Warning for poor performers */}
            {agentMetrics && agentMetrics.valueAddScore < 4 && (
              <Alert 
                severity="warning"
                sx={{ 
                  bgcolor: '#f59e0b20', 
                  border: '1px solid #f59e0b40',
                  '& .MuiAlert-message': { color: '#f59e0b' }
                }}
              >
                This agent has a low average value score. Consider limiting their participation 
                to reduce costs.
              </Alert>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AgentEngagementScorer;

