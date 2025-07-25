/**
 * Optimized Chat Loader Component
 * 
 * Provides a professional loading experience with:
 * - Real-time progress tracking
 * - Stage-based loading messages
 * - Performance metrics display
 * - Smooth animations
 */

import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Fade
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Group as GroupIcon,
  Chat as ChatIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { LoadingProgress } from '../../services/OptimizedAgentLoader';
import './OptimizedChatLoader.css';

interface OptimizedChatLoaderProps {
  progress: LoadingProgress;
  showMetrics?: boolean;
}

const DARK_THEME = {
  background: '#1a202c',
  surface: '#2d3748',
  border: '#4a5568',
  text: {
    primary: '#ffffff',
    secondary: '#a0aec0'
  },
  primary: '#3182ce',
  success: '#38a169',
  warning: '#d69e2e',
  error: '#e53e3e'
};

export const OptimizedChatLoader: React.FC<OptimizedChatLoaderProps> = ({
  progress,
  showMetrics = true
}) => {
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'initializing':
        return <SpeedIcon sx={{ color: DARK_THEME.primary }} />;
      case 'loading_agents':
        return <GroupIcon sx={{ color: DARK_THEME.primary }} />;
      case 'migration':
        return <StorageIcon sx={{ color: DARK_THEME.warning }} />;
      case 'chat_history':
        return <ChatIcon sx={{ color: DARK_THEME.primary }} />;
      case 'complete':
        return <CheckCircleIcon sx={{ color: DARK_THEME.success }} />;
      default:
        return <SpeedIcon sx={{ color: DARK_THEME.primary }} />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'migration':
        return DARK_THEME.warning;
      case 'complete':
        return DARK_THEME.success;
      default:
        return DARK_THEME.primary;
    }
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        backgroundColor: DARK_THEME.background,
        padding: 3
      }}
    >
      <Fade in={true} timeout={500}>
        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            backgroundColor: DARK_THEME.surface,
            border: `1px solid ${DARK_THEME.border}`,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <CardContent sx={{ padding: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  color: DARK_THEME.text.primary,
                  fontWeight: 'bold',
                  mb: 1
                }}
              >
                Loading Chat Interface
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: DARK_THEME.text.secondary }}
              >
                Optimizing your agent experience...
              </Typography>
            </Box>

            {/* Progress Section */}
            <Box sx={{ mb: 3 }}>
              {/* Stage Indicator */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2
                }}
              >
                {getStageIcon(progress.stage)}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: DARK_THEME.text.primary,
                      fontWeight: 'medium'
                    }}
                  >
                    {progress.message}
                  </Typography>
                  {progress.agentsLoaded > 0 && (
                    <Typography
                      variant="body2"
                      sx={{ color: DARK_THEME.text.secondary }}
                    >
                      {progress.agentsLoaded} of {progress.totalAgents} agents loaded
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={`${progress.progress}%`}
                  size="small"
                  sx={{
                    backgroundColor: getStageColor(progress.stage) + '20',
                    color: getStageColor(progress.stage),
                    fontWeight: 'bold'
                  }}
                />
              </Box>

              {/* Progress Bar */}
              <LinearProgress
                variant="determinate"
                value={progress.progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: DARK_THEME.border,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getStageColor(progress.stage),
                    borderRadius: 4,
                    transition: 'all 0.3s ease'
                  }
                }}
              />
            </Box>

            {/* Metrics Section */}
            {showMetrics && progress.timeElapsed > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  mt: 3,
                  pt: 3,
                  borderTop: `1px solid ${DARK_THEME.border}`
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: DARK_THEME.text.primary,
                      fontWeight: 'bold'
                    }}
                  >
                    {formatTime(progress.timeElapsed)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: DARK_THEME.text.secondary }}
                  >
                    Elapsed
                  </Typography>
                </Box>

                {progress.agentsLoaded > 0 && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: DARK_THEME.text.primary,
                        fontWeight: 'bold'
                      }}
                    >
                      {progress.agentsLoaded}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: DARK_THEME.text.secondary }}
                    >
                      Agents
                    </Typography>
                  </Box>
                )}

                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: getStageColor(progress.stage),
                      fontWeight: 'bold'
                    }}
                  >
                    {progress.stage === 'complete' ? '✓' : '⚡'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: DARK_THEME.text.secondary }}
                  >
                    Status
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Performance Tips */}
            {progress.stage === 'loading_agents' && progress.progress < 50 && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: DARK_THEME.background,
                  borderRadius: 2,
                  border: `1px solid ${DARK_THEME.border}`
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: DARK_THEME.text.secondary,
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}
                >
                  💡 Tip: Agent data is cached for faster future loading
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default OptimizedChatLoader;

