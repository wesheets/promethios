import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Psychology,
  QuestionAnswer,
  Analytics,
  Handshake,
  ExpandMore,
  RateReview,
  Lightbulb,
  Build,
} from '@mui/icons-material';

interface BehavioralPromptSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (behavior: string) => void;
  agentName: string;
  agentColor?: string;
  targetMessageContent?: string;
  targetMessageSender?: string;
}

const BehavioralPromptSelectorModal: React.FC<BehavioralPromptSelectorModalProps> = ({
  open,
  onClose,
  onSelect,
  agentName,
  agentColor = '#f97316',
  targetMessageContent,
  targetMessageSender,
}) => {
  const behaviorOptions = [
    {
      id: 'collaborate',
      label: 'Collaborate',
      description: 'Work together and build upon the message',
      icon: <Handshake />,
      color: '#10b981',
    },
    {
      id: 'analyze',
      label: 'Analyze',
      description: 'Break down and examine the content',
      icon: <Analytics />,
      color: '#3b82f6',
    },
    {
      id: 'question',
      label: 'Question',
      description: 'Ask clarifying or probing questions',
      icon: <QuestionAnswer />,
      color: '#f59e0b',
    },
    {
      id: 'critique',
      label: 'Critique',
      description: 'Provide constructive feedback and evaluation',
      icon: <RateReview />,
      color: '#ef4444',
    },
    {
      id: 'expand',
      label: 'Expand',
      description: 'Add more detail and context',
      icon: <ExpandMore />,
      color: '#8b5cf6',
    },
    {
      id: 'ideate',
      label: 'Ideate',
      description: 'Generate new ideas and possibilities',
      icon: <Lightbulb />,
      color: '#eab308',
    },
    {
      id: 'solve',
      label: 'Solve',
      description: 'Focus on solutions and next steps',
      icon: <Build />,
      color: '#06b6d4',
    },
    {
      id: 'synthesize',
      label: 'Synthesize',
      description: 'Combine ideas and create connections',
      icon: <Psychology />,
      color: '#ec4899',
    },
  ];

  const handleBehaviorSelect = (behaviorId: string) => {
    onSelect(behaviorId);
    onClose();
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              bgcolor: agentColor,
              width: 40,
              height: 40,
              fontSize: '1.2rem',
            }}
          >
            {agentName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6" component="div">
              {agentName} Interaction
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose how this agent should respond
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {targetMessageContent && (
          <Box mb={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Target Message:
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                borderLeft: `4px solid ${agentColor}`,
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                From: {targetMessageSender || 'Unknown'}
              </Typography>
              <Typography variant="body2">
                {truncateContent(targetMessageContent)}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        <Typography variant="subtitle1" gutterBottom>
          Select Behavioral Prompt:
        </Typography>

        <Grid container spacing={2}>
          {behaviorOptions.map((option) => (
            <Grid item xs={12} sm={6} key={option.id}>
              <Box
                onClick={() => handleBehaviorSelect(option.id)}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: option.color,
                    bgcolor: 'grey.50',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                  <Box
                    sx={{
                      color: option.color,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {option.icon}
                  </Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {option.label}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => handleBehaviorSelect('collaborate')}
          variant="contained"
          sx={{ bgcolor: agentColor }}
        >
          Quick Collaborate
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BehavioralPromptSelectorModal;

