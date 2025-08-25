/**
 * ActionStatusIndicator.tsx
 * 
 * Real-time action transparency component that shows users exactly what the AI agent is doing.
 * Includes beautiful animations and progress indicators for enhanced user experience.
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import {
  Search as SearchIcon,
  Article as ArticleIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Code as CodeIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  ShoppingCart as ShoppingCartIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

export interface ActionStatus {
  id: string;
  type: 'web_search' | 'web_scraping' | 'article_verification' | 'seo_analysis' | 'document_generation' | 'data_visualization' | 'coding' | 'email_sending' | 'sms_messaging' | 'slack_integration' | 'shopify_integration' | 'stripe_payments' | 'google_calendar' | 'twitter_posting' | 'linkedin_posting' | 'google_analytics' | 'zapier_integration' | 'workflow_automation' | 'woocommerce_integration' | 'salesforce_crm';
  status: 'starting' | 'in_progress' | 'completing' | 'completed' | 'error';
  action: string;
  details?: string;
  progress?: number;
  timestamp: number;
}

interface ActionStatusIndicatorProps {
  actions: ActionStatus[];
  className?: string;
}

const ActionStatusIndicator: React.FC<ActionStatusIndicatorProps> = ({
  actions,
  className = ''
}) => {
  const [visibleActions, setVisibleActions] = useState<ActionStatus[]>([]);

  useEffect(() => {
    // Show only active actions (not completed or error for more than 3 seconds)
    const now = Date.now();
    const filtered = actions.filter(action => {
      if (action.status === 'starting' || action.status === 'in_progress' || action.status === 'completing') {
        return true;
      }
      // Show completed/error actions for 3 seconds
      return (now - action.timestamp) < 3000;
    });
    setVisibleActions(filtered);
  }, [actions]);

  const getActionIcon = (type: ActionStatus['type']) => {
    const iconMap = {
      web_search: SearchIcon,
      web_scraping: ArticleIcon,
      article_verification: SecurityIcon,
      seo_analysis: AnalyticsIcon,
      document_generation: ArticleIcon,
      data_visualization: TrendingUpIcon,
      coding: CodeIcon,
      email_sending: EmailIcon,
      sms_messaging: MessageIcon,
      slack_integration: MessageIcon,
      shopify_integration: ShoppingCartIcon,
      stripe_payments: ShoppingCartIcon,
      google_calendar: BusinessIcon,
      twitter_posting: MessageIcon,
      linkedin_posting: BusinessIcon,
      google_analytics: AnalyticsIcon,
      zapier_integration: BusinessIcon,
      workflow_automation: BusinessIcon,
      woocommerce_integration: ShoppingCartIcon,
      salesforce_crm: BusinessIcon
    };
    return iconMap[type] || InfoIcon;
  };

  const getStatusColor = (status: ActionStatus['status']) => {
    switch (status) {
      case 'starting':
        return '#3b82f6'; // Blue
      case 'in_progress':
        return '#f59e0b'; // Amber
      case 'completing':
        return '#10b981'; // Emerald
      case 'completed':
        return '#10b981'; // Green
      case 'error':
        return '#ef4444'; // Red
      default:
        return '#64748b'; // Gray
    }
  };

  const getStatusIcon = (status: ActionStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <Box
      className={className}
      sx={{
        bgcolor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 2,
        p: 2,
        mb: 2,
        maxWidth: '100%',
        overflow: 'hidden',
        // CSS animations
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        },
        '@keyframes shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' }
        },
        '@keyframes bounce': {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' }
        },
        '@keyframes dot-pulse': {
          '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
          '40%': { opacity: 1, transform: 'scale(1)' }
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: '#3b82f6',
            animation: 'pulse 2s infinite'
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            color: '#e2e8f0',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          AI Agent Activity
        </Typography>
      </Box>

      {/* Action List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {visibleActions.map((action) => {
          const IconComponent = getActionIcon(action.type);
          const statusColor = getStatusColor(action.status);
          const statusIcon = getStatusIcon(action.status);

          return (
            <Box
              key={action.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                bgcolor: 'rgba(59, 130, 246, 0.05)',
                border: `1px solid ${statusColor}20`,
                borderRadius: 1.5,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Shimmer Effect for Active Actions */}
              {(action.status === 'in_progress' || action.status === 'starting') && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                    animation: 'shimmer 2s infinite'
                  }}
                />
              )}

              {/* Tool Icon */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: `${statusColor}20`,
                  flexShrink: 0,
                  animation: action.status === 'in_progress' ? 'bounce 1s infinite' : 'none'
                }}
              >
                <IconComponent sx={{ fontSize: 18, color: statusColor }} />
              </Box>

              {/* Action Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#e2e8f0',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}
                  >
                    {action.action}
                  </Typography>
                  
                  {/* Status Indicator */}
                  {statusIcon || (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {(action.status === 'starting' || action.status === 'in_progress') && (
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                          {[0, 1, 2].map((i) => (
                            <Box
                              key={i}
                              sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                bgcolor: statusColor,
                                animation: `dot-pulse 1.5s infinite ${i * 0.2}s`
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Details */}
                {action.details && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      fontSize: '0.7rem',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {action.details}
                  </Typography>
                )}

                {/* Progress Bar */}
                {action.progress !== undefined && action.status === 'in_progress' && (
                  <LinearProgress
                    variant="determinate"
                    value={action.progress}
                    sx={{
                      mt: 1,
                      height: 3,
                      borderRadius: 1.5,
                      bgcolor: '#334155',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: statusColor,
                        borderRadius: 1.5
                      }
                    }}
                  />
                )}
              </Box>

              {/* Status Chip */}
              <Chip
                label={action.status.replace('_', ' ').toUpperCase()}
                size="small"
                sx={{
                  bgcolor: `${statusColor}20`,
                  color: statusColor,
                  fontSize: '0.6rem',
                  height: 20,
                  fontWeight: 600,
                  '& .MuiChip-label': {
                    px: 0.75
                  }
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ActionStatusIndicator;

