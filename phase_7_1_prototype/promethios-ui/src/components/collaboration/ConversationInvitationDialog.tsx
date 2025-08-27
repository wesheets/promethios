/**
 * ConversationInvitationDialog - Invite humans to shared AI conversations
 * Handles email invitations with history controls and custom messages
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Divider
} from '@mui/material';
import {
  Email as EmailIcon,
  History as HistoryIcon,
  Message as MessageIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Group as GroupIcon,
  SmartToy as AIIcon,
  Person as PersonIcon
} from '@mui/icons-material';

export interface InvitationFormData {
  emails: string[];
  message: string;
  includeHistory: boolean;
  historyDays: number;
}

export interface ConversationInvitationDialogProps {
  open: boolean;
  onClose: () => void;
  onSendInvitations: (invitations: InvitationFormData) => Promise<void>;
  conversationName: string;
  currentParticipants: {
    id: string;
    name: string;
    type: 'human' | 'ai_agent';
    avatar?: string;
  }[];
  isCreator: boolean;
}

export const ConversationInvitationDialog: React.FC<ConversationInvitationDialogProps> = ({
  open,
  onClose,
  onSendInvitations,
  conversationName,
  currentParticipants,
  isCreator
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [includeHistory, setIncludeHistory] = useState(true);
  const [historyDays, setHistoryDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Add email to list
  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase();
    
    if (!trimmedEmail) return;
    
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (emails.includes(trimmedEmail)) {
      setError('Email already added');
      return;
    }
    
    setEmails(prev => [...prev, trimmedEmail]);
    setEmailInput('');
    setError(null);
  };

  // Remove email from list
  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(prev => prev.filter(email => email !== emailToRemove));
  };

  // Handle email input key press
  const handleEmailKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddEmail();
    }
  };

  // Send invitations
  const handleSendInvitations = async () => {
    if (emails.length === 0) {
      setError('Please add at least one email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSendInvitations({
        emails,
        message,
        includeHistory,
        historyDays
      });
      
      // Reset form
      setEmails([]);
      setMessage('');
      setIncludeHistory(true);
      setHistoryDays(7);
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations');
    } finally {
      setIsLoading(false);
    }
  };

  // Get participant summary
  const humanCount = currentParticipants.filter(p => p.type === 'human').length;
  const aiCount = currentParticipants.filter(p => p.type === 'ai_agent').length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { bgcolor: '#1e293b', color: 'white' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <GroupIcon sx={{ color: '#3b82f6' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Invite to "{conversationName}"
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {humanCount} humans, {aiCount} AI agents currently participating
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Current Participants Preview */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>
            Current Participants
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {currentParticipants.slice(0, 6).map((participant) => (
              <Chip
                key={participant.id}
                avatar={
                  <Avatar sx={{ 
                    bgcolor: participant.type === 'human' ? '#3b82f6' : '#8b5cf6',
                    width: 24,
                    height: 24
                  }}>
                    {participant.type === 'human' ? 
                      <PersonIcon sx={{ fontSize: 14 }} /> : 
                      <AIIcon sx={{ fontSize: 14 }} />
                    }
                  </Avatar>
                }
                label={participant.name}
                size="small"
                sx={{
                  bgcolor: '#374151',
                  color: 'white',
                  '& .MuiChip-avatar': { ml: 0.5 }
                }}
              />
            ))}
            {currentParticipants.length > 6 && (
              <Chip
                label={`+${currentParticipants.length - 6} more`}
                size="small"
                sx={{ bgcolor: '#374151', color: '#94a3b8' }}
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ bgcolor: '#334155', my: 2 }} />

        {/* Email Input */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon sx={{ fontSize: 16 }} />
            Email Addresses
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Enter email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={handleEmailKeyPress}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#0f172a',
                  color: 'white',
                  '& fieldset': { borderColor: '#475569' },
                  '&:hover fieldset': { borderColor: '#3b82f6' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                }
              }}
            />
            <Button
              onClick={handleAddEmail}
              variant="outlined"
              sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
            >
              Add
            </Button>
          </Box>

          {/* Email List */}
          {emails.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {emails.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => handleRemoveEmail(email)}
                  deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: '#3b82f6',
                    color: 'white',
                    '& .MuiChip-deleteIcon': { color: 'white' }
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Custom Message */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MessageIcon sx={{ fontSize: 16 }} />
            Custom Message (Optional)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add a personal message to your invitation..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0f172a',
                color: 'white',
                '& fieldset': { borderColor: '#475569' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
              }
            }}
          />
        </Box>

        {/* History Controls */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ fontSize: 16 }} />
            Conversation History Access
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={includeHistory}
                onChange={(e) => setIncludeHistory(e.target.checked)}
                sx={{ color: '#3b82f6' }}
              />
            }
            label="Allow new participants to see conversation history"
            sx={{ color: 'white', mb: 2 }}
          />

          {includeHistory && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: '#94a3b8' }}>History Duration</InputLabel>
              <Select
                value={historyDays}
                onChange={(e) => setHistoryDays(e.target.value as number)}
                label="History Duration"
                sx={{
                  bgcolor: '#0f172a',
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                }}
              >
                <MenuItem value={1}>Last 24 hours</MenuItem>
                <MenuItem value={3}>Last 3 days</MenuItem>
                <MenuItem value={7}>Last week</MenuItem>
                <MenuItem value={30}>Last month</MenuItem>
                <MenuItem value={-1}>Full history</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: '#ef444420', border: '1px solid #ef4444' }}>
            {error}
          </Alert>
        )}

        {/* Preview */}
        {emails.length > 0 && (
          <Alert
            severity="info"
            sx={{ bgcolor: '#3b82f620', border: '1px solid #3b82f6' }}
          >
            Ready to send {emails.length} invitation{emails.length !== 1 ? 's' : ''} to join "{conversationName}"
            {includeHistory && ` with ${historyDays === -1 ? 'full' : `${historyDays} day${historyDays !== 1 ? 's' : ''} of`} conversation history`}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSendInvitations}
          disabled={emails.length === 0 || isLoading}
          variant="contained"
          startIcon={<SendIcon />}
          sx={{
            bgcolor: '#3b82f6',
            '&:hover': { bgcolor: '#2563eb' },
            '&:disabled': { bgcolor: '#374151', color: '#6b7280' }
          }}
        >
          {isLoading ? 'Sending...' : `Send ${emails.length} Invitation${emails.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConversationInvitationDialog;

