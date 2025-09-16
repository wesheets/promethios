/**
 * Theme-Aware Behavioral Prompt Popup
 * Integrates with the application's theme system for consistent styling
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Fade,
  Chip,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Psychology,
  QuestionAnswer,
  Analytics,
  Handshake,
  RateReview,
  Lightbulb,
  Build,
  CloudQueue,
} from '@mui/icons-material';

interface ThemeAwareBehavioralPromptPopupProps {
  isVisible: boolean;
  position: { x: number; y: number };
  agentName: string;
  agentColor?: string;
  targetMessageContent?: string;
  onBehaviorSelect: (behavior: string) => void;
  onClose: () => void;
}

const ThemeAwareBehavioralPromptPopup: React.FC<ThemeAwareBehavioralPromptPopupProps> = ({
  isVisible,
  position,
  agentName,
  agentColor = '#f97316',
  targetMessageContent,
  onBehaviorSelect,
  onClose,
}) => {
  const theme = useTheme();
  const [selectedBehavior, setSelectedBehavior] = useState<string | null>(null);

  // Theme-aware colors
  const isDarkMode = theme.palette.mode === 'dark';
  const backgroundColor = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const headerBg = isDarkMode ? '#0f172a' : '#f8fafc';
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const chipBg = isDarkMode ? 'rgba(55, 65, 81, 0.8)' : 'rgba(248, 250, 252, 0.9)';
  const chipBorder = isDarkMode ? '#374151' : '#cbd5e1';

  const behaviorOptions = [
    {
      id: 'collaborate',
      label: 'Collaborate',
      icon: <Handshake sx={{ fontSize: 14 }} />,
      color: '#10b981',
      description: 'Work together',
    },
    {
      id: 'analyze',
      label: 'Analyze',
      icon: <Analytics sx={{ fontSize: 14 }} />,
      color: '#3b82f6',
      description: 'Break down content',
    },
    {
      id: 'question',
      label: 'Question',
      icon: <QuestionAnswer sx={{ fontSize: 14 }} />,
      color: '#f59e0b',
      description: 'Ask questions',
    },
    {
      id: 'critique',
      label: 'Critique',
      icon: <RateReview sx={{ fontSize: 14 }} />,
      color: '#ef4444',
      description: 'Provide feedback',
    },
    {
      id: 'expand',
      label: 'Expand',
      icon: <Lightbulb sx={{ fontSize: 14 }} />,
      color: '#8b5cf6',
      description: 'Add details',
    },
    {
      id: 'solve',
      label: 'Solve',
      icon: <Build sx={{ fontSize: 14 }} />,
      color: '#06b6d4',
      description: 'Find solutions',
    },
  ];

  // Auto-close after 10 seconds of inactivity
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  // Handle behavior selection
  const handleBehaviorClick = (behaviorId: string) => {
    setSelectedBehavior(behaviorId);
    
    // Brief visual feedback before executing
    setTimeout(() => {
      onBehaviorSelect(behaviorId);
      setSelectedBehavior(null);
    }, 150);
  };

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: 'auto',
        // Theme-aware backdrop
        backgroundColor: isDarkMode 
          ? 'rgba(0, 0, 0, 0.4)' 
          : 'rgba(0, 0, 0, 0.2)',
      }}
      onClick={handleBackdropClick}
    >
      <Fade in={isVisible} timeout={200}>
        <Paper
          elevation={isDarkMode ? 8 : 12}
          sx={{
            position: 'absolute',
            left: Math.min(position.x, window.innerWidth - 320),
            top: Math.min(position.y, window.innerHeight - 280),
            width: 300,
            maxHeight: 260,
            bgcolor: backgroundColor,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            boxShadow: isDarkMode 
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            pb: 1,
            borderBottom: `1px solid ${borderColor}`,
            bgcolor: headerBg
          }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar
                sx={{
                  bgcolor: agentColor,
                  width: 24,
                  height: 24,
                  fontSize: '0.75rem',
                }}
              >
                {agentName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ color: textPrimary, fontWeight: 600 }}>
                  {agentName}
                </Typography>
                <Typography variant="caption" sx={{ color: textSecondary }}>
                  Choose behavior
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Target Message Preview */}
          {targetMessageContent && (
            <Box sx={{ 
              px: 2, 
              py: 1, 
              bgcolor: headerBg,
              borderBottom: `1px solid ${borderColor}`
            }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontSize: '10px' }}>
                Target message:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: textSecondary, 
                  fontSize: '11px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mt: 0.5
                }}
              >
                {targetMessageContent.length > 60 
                  ? `${targetMessageContent.substring(0, 60)}...` 
                  : targetMessageContent
                }
              </Typography>
            </Box>
          )}

          {/* Behavior Options */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: 1
            }}>
              {behaviorOptions.map((option) => (
                <Chip
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  onClick={() => handleBehaviorClick(option.id)}
                  sx={{
                    bgcolor: selectedBehavior === option.id 
                      ? `${option.color}40` 
                      : chipBg,
                    color: selectedBehavior === option.id ? option.color : textPrimary,
                    border: `1px solid ${selectedBehavior === option.id ? option.color : chipBorder}`,
                    fontSize: '11px',
                    height: 28,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '& .MuiChip-icon': { 
                      color: selectedBehavior === option.id ? option.color : textSecondary
                    },
                    '&:hover': {
                      bgcolor: `${option.color}20`,
                      borderColor: option.color,
                      color: option.color,
                      '& .MuiChip-icon': { color: option.color },
                      transform: 'scale(1.02)',
                    },
                  }}
                />
              ))}
            </Box>

            {/* Quick Actions */}
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${borderColor}` }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontSize: '10px', mb: 1, display: 'block' }}>
                Quick actions:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Chip
                  label="Default"
                  size="small"
                  onClick={() => handleBehaviorClick('collaborate')}
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    fontSize: '10px',
                    height: 20,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.3)' },
                  }}
                />
                <Chip
                  label="Cancel"
                  size="small"
                  onClick={onClose}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                    color: textSecondary,
                    border: `1px solid ${textSecondary}`,
                    fontSize: '10px',
                    height: 20,
                    cursor: 'pointer',
                    '&:hover': { 
                      bgcolor: isDarkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(148, 163, 184, 0.3)' 
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};

export default ThemeAwareBehavioralPromptPopup;

