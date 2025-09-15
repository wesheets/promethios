/**
 * Behavioral Prompt Selector
 * Shows available behavioral prompts when an agent is dropped on a message
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Fade,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close,
  Psychology,
  QuestionMark,
  Lightbulb,
  Analytics,
  CloudQueue,
  Handshake,
  TrendingUp,
  Warning,
  School,
} from '@mui/icons-material';

import { DropAction } from '../../systems/DragDropRegistry';

interface BehavioralPromptSelectorProps {
  isOpen: boolean;
  position: { x: number; y: number };
  agentName: string;
  agentColor: string;
  messagePreview: string;
  availableActions: DropAction[];
  onActionSelect: (actionId: string) => void;
  onClose: () => void;
}

// Action icons mapping
const actionIcons: Record<string, React.ReactNode> = {
  collaborate: <Handshake sx={{ fontSize: '16px' }} />,
  question: <QuestionMark sx={{ fontSize: '16px' }} />,
  devils_advocate: <Psychology sx={{ fontSize: '16px' }} />,
  expert_analysis: <Analytics sx={{ fontSize: '16px' }} />,
  creative_ideas: <Lightbulb sx={{ fontSize: '16px' }} />,
  pessimist: <CloudQueue sx={{ fontSize: '16px' }} />,
  summarize: <TrendingUp sx={{ fontSize: '16px' }} />,
  analyze_insights: <School sx={{ fontSize: '16px' }} />,
  visualize_data: <Analytics sx={{ fontSize: '16px' }} />,
  build_rag: <School sx={{ fontSize: '16px' }} />,
  create_policy: <Warning sx={{ fontSize: '16px' }} />,
  train_agent: <Psychology sx={{ fontSize: '16px' }} />,
};

// Action colors mapping
const actionColors: Record<string, string> = {
  collaborate: '#22c55e',
  question: '#3b82f6',
  devils_advocate: '#ef4444',
  expert_analysis: '#8b5cf6',
  creative_ideas: '#eab308',
  pessimist: '#64748b',
  summarize: '#06b6d4',
  analyze_insights: '#f97316',
  visualize_data: '#ec4899',
  build_rag: '#10b981',
  create_policy: '#f59e0b',
  train_agent: '#6366f1',
};

const BehavioralPromptSelector: React.FC<BehavioralPromptSelectorProps> = ({
  isOpen,
  position,
  agentName,
  agentColor,
  messagePreview,
  availableActions,
  onActionSelect,
  onClose,
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Group actions by category
  const groupedActions = availableActions.reduce((groups, action) => {
    const category = action.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(action);
    return groups;
  }, {} as Record<string, DropAction[]>);

  const handleActionClick = (actionId: string) => {
    setSelectedAction(actionId);
    // Add a small delay for visual feedback
    setTimeout(() => {
      onActionSelect(actionId);
      setSelectedAction(null);
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        }}
        onClick={onClose}
      />

      {/* Selector Panel */}
      <Fade in={isOpen}>
        <Paper
          sx={{
            position: 'fixed',
            top: Math.min(position.y, window.innerHeight - 400),
            left: Math.min(position.x, window.innerWidth - 350),
            width: 320,
            maxHeight: 400,
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 2,
            zIndex: 1001,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box sx={{
            p: 2,
            bgcolor: '#334155',
            borderBottom: '1px solid #475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 12,
                height: 12,
                bgcolor: agentColor,
                borderRadius: '50%',
              }} />
              <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                {agentName} Interaction
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}
            >
              <Close sx={{ fontSize: '16px' }} />
            </IconButton>
          </Box>

          {/* Message Preview */}
          <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: '11px', mb: 0.5 }}>
              Responding to:
            </Typography>
            <Typography sx={{
              color: 'white',
              fontSize: '12px',
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              "{messagePreview}"
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ p: 2, maxHeight: 280, overflowY: 'auto' }}>
            <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '13px', mb: 2 }}>
              Choose Behavioral Prompt:
            </Typography>

            {Object.entries(groupedActions).map(([category, actions]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography sx={{
                  color: '#64748b',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  mb: 1,
                }}>
                  {category.replace('_', ' ')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {actions.map((action) => (
                    <Button
                      key={action.id}
                      onClick={() => handleActionClick(action.id)}
                      disabled={selectedAction === action.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 1.5,
                        p: 1.5,
                        bgcolor: selectedAction === action.id ? '#22c55e' : '#334155',
                        color: 'white',
                        borderRadius: 1,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: selectedAction === action.id ? '#22c55e' : '#475569',
                        },
                        '&:disabled': {
                          color: 'white',
                        },
                        border: `1px solid ${actionColors[action.id] || '#475569'}`,
                        borderLeft: `4px solid ${actionColors[action.id] || '#475569'}`,
                      }}
                    >
                      <Box sx={{ color: actionColors[action.id] || '#94a3b8' }}>
                        {actionIcons[action.id] || <Handshake sx={{ fontSize: '16px' }} />}
                      </Box>
                      <Box sx={{ flex: 1, textAlign: 'left' }}>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                          {action.label}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#94a3b8', mt: 0.25 }}>
                          {action.description}
                        </Typography>
                      </Box>
                      {selectedAction === action.id && (
                        <Typography sx={{ fontSize: '12px', color: 'white' }}>
                          ✓
                        </Typography>
                      )}
                    </Button>
                  ))}
                </Box>

                {Object.keys(groupedActions).indexOf(category) < Object.keys(groupedActions).length - 1 && (
                  <Divider sx={{ mt: 2, bgcolor: '#334155' }} />
                )}
              </Box>
            ))}
          </Box>

          {/* Footer */}
          <Box sx={{
            p: 2,
            bgcolor: '#334155',
            borderTop: '1px solid #475569',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Typography sx={{ color: '#64748b', fontSize: '11px' }}>
              {availableActions.length} actions available
            </Typography>
            <Button
              size="small"
              onClick={onClose}
              sx={{
                color: '#94a3b8',
                fontSize: '11px',
                textTransform: 'none',
                '&:hover': { color: 'white' },
              }}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default BehavioralPromptSelector;

