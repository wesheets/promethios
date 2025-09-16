/**
 * ThreadResolutionDialog - Dialog for resolving threads and integrating them back to main chat
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  useTheme
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  AutoAwesome as AutoAwesomeIcon,
  Edit as EditIcon,
  Message as MessageIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { ThreadMessage, ResolveThreadRequest } from '../../types/Thread';

interface ThreadResolutionDialogProps {
  open: boolean;
  onClose: () => void;
  threadId: string;
  threadMessages: ThreadMessage[];
  currentUserId: string;
  onResolve: (request: ResolveThreadRequest) => Promise<void>;
}

export const ThreadResolutionDialog: React.FC<ThreadResolutionDialogProps> = ({
  open,
  onClose,
  threadId,
  threadMessages,
  currentUserId,
  onResolve
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [summary, setSummary] = useState('');
  const [keyOutcomes, setKeyOutcomes] = useState<string[]>([]);
  const [newOutcome, setNewOutcome] = useState('');
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [integrateToMainChat, setIntegrateToMainChat] = useState(true);
  const [includeKeyMessages, setIncludeKeyMessages] = useState(true);
  const [generateAISummary, setGenerateAISummary] = useState(true);
  const [loading, setLoading] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate AI summary
  const handleGenerateAISummary = async () => {
    setAiSummaryLoading(true);
    setError(null);
    
    try {
      // Simulate AI summary generation (replace with actual AI service call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiSummary = generateMockSummary(threadMessages);
      setSummary(aiSummary.summary);
      setKeyOutcomes(aiSummary.keyOutcomes);
      
    } catch (err) {
      console.error('Error generating AI summary:', err);
      setError('Failed to generate AI summary. Please write one manually.');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  // Mock AI summary generation (replace with actual AI service)
  const generateMockSummary = (messages: ThreadMessage[]) => {
    const participantCount = new Set(messages.map(m => m.senderId)).size;
    const messageCount = messages.length;
    
    return {
      summary: `This thread involved ${participantCount} participants discussing the topic over ${messageCount} messages. Key decisions were made regarding implementation approach and next steps were identified.`,
      keyOutcomes: [
        'Agreed on implementation approach',
        'Identified next steps and responsibilities',
        'Resolved technical concerns raised'
      ]
    };
  };

  // Add key outcome
  const handleAddOutcome = () => {
    if (newOutcome.trim() && !keyOutcomes.includes(newOutcome.trim())) {
      setKeyOutcomes([...keyOutcomes, newOutcome.trim()]);
      setNewOutcome('');
    }
  };

  // Remove key outcome
  const handleRemoveOutcome = (outcome: string) => {
    setKeyOutcomes(keyOutcomes.filter(o => o !== outcome));
  };

  // Toggle message selection
  const handleToggleMessage = (messageId: string) => {
    setSelectedMessageIds(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Handle resolution
  const handleResolve = async () => {
    if (!summary.trim()) {
      setError('Please provide a summary of the thread discussion.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: ResolveThreadRequest = {
        threadId,
        resolvedBy: currentUserId,
        resolution: {
          summary: summary.trim(),
          keyOutcomes,
          keyMessageIds: selectedMessageIds
        },
        integrateToMainChat,
        integrationOptions: {
          includeKeyMessages,
          generateAISummary
        }
      };

      await onResolve(request);
      onClose();
      
    } catch (err) {
      console.error('Error resolving thread:', err);
      setError('Failed to resolve thread. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSummary('');
      setKeyOutcomes([]);
      setSelectedMessageIds([]);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? '#1e293b' : '#ffffff',
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: '#10b981' }} />
          <Typography variant="h6">Resolve Thread</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* AI Summary Generation */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Thread Summary
            </Typography>
            <Button
              startIcon={aiSummaryLoading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
              onClick={handleGenerateAISummary}
              disabled={aiSummaryLoading}
              size="small"
              sx={{ color: '#3b82f6' }}
            >
              {aiSummaryLoading ? 'Generating...' : 'Generate AI Summary'}
            </Button>
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Provide a summary of the thread discussion, key decisions made, and outcomes reached..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              }
            }}
          />
        </Box>

        {/* Key Outcomes */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Key Outcomes & Decisions
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add a key outcome or decision..."
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddOutcome()}
            />
            <Button onClick={handleAddOutcome} disabled={!newOutcome.trim()}>
              Add
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {keyOutcomes.map((outcome, index) => (
              <Chip
                key={index}
                label={outcome}
                onDelete={() => handleRemoveOutcome(outcome)}
                sx={{
                  bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Key Messages Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Important Messages to Highlight
          </Typography>
          
          <List sx={{ maxHeight: 200, overflow: 'auto', bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
            {threadMessages.map((message) => (
              <ListItem
                key={message.id}
                button
                onClick={() => handleToggleMessage(message.id)}
                sx={{
                  bgcolor: selectedMessageIds.includes(message.id) 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'transparent',
                  border: selectedMessageIds.includes(message.id)
                    ? '1px solid rgba(59, 130, 246, 0.3)'
                    : '1px solid transparent',
                  borderRadius: 1,
                  mb: 0.5
                }}
              >
                <ListItemIcon>
                  <MessageIcon sx={{ 
                    color: selectedMessageIds.includes(message.id) ? '#3b82f6' : theme.palette.text.secondary 
                  }} />
                </ListItemIcon>
                <ListItemText
                  primary={message.senderName}
                  secondary={message.content.length > 100 ? `${message.content.substring(0, 100)}...` : message.content}
                  primaryTypographyProps={{
                    sx: { fontSize: '14px', fontWeight: 600 }
                  }}
                  secondaryTypographyProps={{
                    sx: { fontSize: '12px' }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Integration Options */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Integration Options
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={integrateToMainChat}
                onChange={(e) => setIntegrateToMainChat(e.target.checked)}
              />
            }
            label="Integrate thread summary into main chat"
          />
          
          {integrateToMainChat && (
            <Box sx={{ ml: 4, mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeKeyMessages}
                    onChange={(e) => setIncludeKeyMessages(e.target.checked)}
                  />
                }
                label="Include selected key messages"
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleResolve}
          variant="contained"
          disabled={loading || !summary.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          sx={{
            bgcolor: '#10b981',
            '&:hover': { bgcolor: '#059669' }
          }}
        >
          {loading ? 'Resolving...' : 'Resolve Thread'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThreadResolutionDialog;

