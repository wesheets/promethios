/**
 * AgentSuggestionIndicator - Visual indicators for smart agent suggestions
 * Shows "hand raising" and suggestion popups without burning tokens
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Badge,
  Tooltip,
  Popover,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Fade,
  Zoom
} from '@mui/material';
import {
  PanTool as HandIcon,
  Lightbulb as IdeaIcon,
  QuestionAnswer as QuestionIcon,
  Psychology as ExpertiseIcon,
  Group as CollaborateIcon,
  Warning as DisagreeIcon,
  Close as CloseIcon,
  TokenIcon
} from '@mui/icons-material';
import { AgentSuggestion } from '../../services/SmartSuggestionService';

export interface AgentSuggestionIndicatorProps {
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  suggestions: AgentSuggestion[];
  onEngageAgent: (agentId: string, action: string) => void;
  onDismissSuggestion: (agentId: string) => void;
  showHandRaising?: boolean;
  compact?: boolean;
}

const AgentSuggestionIndicator: React.FC<AgentSuggestionIndicatorProps> = ({
  agentId,
  agentName,
  agentAvatar,
  suggestions,
  onEngageAgent,
  onDismissSuggestion,
  showHandRaising = true,
  compact = false
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showHandAnimation, setShowHandAnimation] = useState(false);

  const agentSuggestions = suggestions.filter(s => s.agentId === agentId);
  const hasSuggestions = agentSuggestions.length > 0;
  const topSuggestion = agentSuggestions[0];

  useEffect(() => {
    if (hasSuggestions && showHandRaising) {
      setShowHandAnimation(true);
      // Auto-hide hand animation after 3 seconds
      const timer = setTimeout(() => setShowHandAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasSuggestions, showHandRaising]);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    if (hasSuggestions) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEngageClick = (action: string) => {
    onEngageAgent(agentId, action);
    handleClose();
  };

  const handleDismissClick = () => {
    onDismissSuggestion(agentId);
    handleClose();
  };

  const getTriggerIcon = (triggerType: AgentSuggestion['triggerType']) => {
    switch (triggerType) {
      case 'question': return <QuestionIcon fontSize="small" />;
      case 'expertise': return <ExpertiseIcon fontSize="small" />;
      case 'disagreement': return <DisagreeIcon fontSize="small" />;
      case 'topic': return <CollaborateIcon fontSize="small" />;
      default: return <IdeaIcon fontSize="small" />;
    }
  };

  const getActionColor = (action: AgentSuggestion['suggestedAction']) => {
    switch (action) {
      case 'provide_expertise': return '#2196f3';
      case 'clarify': return '#ff9800';
      case 'challenge': return '#f44336';
      case 'collaborate': return '#4caf50';
      default: return '#9c27b0';
    }
  };

  const getActionLabel = (action: AgentSuggestion['suggestedAction']) => {
    switch (action) {
      case 'provide_expertise': return 'Share Expertise';
      case 'clarify': return 'Clarify';
      case 'challenge': return 'Challenge';
      case 'collaborate': return 'Collaborate';
      case 'interject': return 'Interject';
      default: return 'Contribute';
    }
  };

  return (
    <>
      {/* Agent Avatar with Suggestion Indicators */}
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          badgeContent={
            hasSuggestions ? (
              <Zoom in={true}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: getActionColor(topSuggestion.suggestedAction),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    cursor: 'pointer'
                  }}
                  onClick={handleAvatarClick}
                >
                  {getTriggerIcon(topSuggestion.triggerType)}
                </Box>
              </Zoom>
            ) : null
          }
        >
          <Avatar
            src={agentAvatar}
            sx={{
              width: compact ? 32 : 40,
              height: compact ? 32 : 40,
              cursor: hasSuggestions ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              '&:hover': hasSuggestions ? {
                transform: 'scale(1.1)',
                boxShadow: `0 0 10px ${getActionColor(topSuggestion?.suggestedAction || 'interject')}`
              } : {}
            }}
            onClick={handleAvatarClick}
          >
            {agentName.charAt(0)}
          </Avatar>
        </Badge>

        {/* Hand Raising Animation */}
        {showHandAnimation && showHandRaising && (
          <Fade in={showHandAnimation}>
            <Box
              sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                animation: 'wave 1s ease-in-out infinite',
                '@keyframes wave': {
                  '0%, 100%': { transform: 'rotate(0deg)' },
                  '25%': { transform: 'rotate(-10deg)' },
                  '75%': { transform: 'rotate(10deg)' }
                }
              }}
            >
              <HandIcon 
                sx={{ 
                  color: '#ffc107', 
                  fontSize: 20,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }} 
              />
            </Box>
          </Fade>
        )}
      </Box>

      {/* Suggestion Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { mt: 1, maxWidth: 300 }
        }}
      >
        <Card elevation={0}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {agentName} has suggestions
              </Typography>
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {agentSuggestions.map((suggestion, index) => (
              <Box key={index} sx={{ mb: index < agentSuggestions.length - 1 ? 2 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {getTriggerIcon(suggestion.triggerType)}
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {suggestion.reason}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    label={getActionLabel(suggestion.suggestedAction)}
                    size="small"
                    sx={{
                      bgcolor: getActionColor(suggestion.suggestedAction),
                      color: 'white',
                      fontSize: '11px'
                    }}
                  />
                  <Chip
                    label={`${Math.round(suggestion.confidence * 100)}% confident`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '11px' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TokenIcon sx={{ fontSize: 14, color: '#666' }} />
                  <Typography variant="caption" color="text.secondary">
                    ~{suggestion.estimatedTokenCost} tokens
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleEngageClick(suggestion.suggestedAction)}
                    sx={{
                      bgcolor: getActionColor(suggestion.suggestedAction),
                      '&:hover': {
                        bgcolor: getActionColor(suggestion.suggestedAction),
                        opacity: 0.8
                      },
                      fontSize: '11px',
                      px: 2
                    }}
                  >
                    Engage
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleDismissClick}
                    sx={{ fontSize: '11px', px: 2 }}
                  >
                    Dismiss
                  </Button>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Popover>
    </>
  );
};

export default AgentSuggestionIndicator;

