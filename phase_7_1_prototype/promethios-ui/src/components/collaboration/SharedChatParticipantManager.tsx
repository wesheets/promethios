/**
 * SharedChatParticipantManager - Chat creator controls for managing participants
 * Allows adding/removing humans and their AI agents from shared conversations
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Badge,
  Tooltip,
  Divider,
  Alert
} from '@mui/material';
import {
  PersonRemove as RemoveIcon,
  PersonAdd as AddIcon,
  Crown as OwnerIcon,
  SmartToy as AIIcon,
  Warning as WarningIcon,
  Group as GroupIcon
} from '@mui/icons-material';

export interface ChatParticipant {
  id: string;
  name: string;
  type: 'human' | 'ai_agent';
  avatar?: string;
  isOnline?: boolean;
  role: 'creator' | 'participant';
  addedBy?: string; // ID of human who added this participant
  aiAgents?: ChatParticipant[]; // AI agents brought by this human
}

export interface SharedChatParticipantManagerProps {
  conversationId: string;
  participants: ChatParticipant[];
  currentUserId: string;
  isCreator: boolean;
  onAddParticipant: (conversationId: string) => void;
  onRemoveParticipant: (conversationId: string, participantId: string) => void;
  onRemoveHumanWithAgents: (conversationId: string, humanId: string) => void;
}

export const SharedChatParticipantManager: React.FC<SharedChatParticipantManagerProps> = ({
  conversationId,
  participants,
  currentUserId,
  isCreator,
  onAddParticipant,
  onRemoveParticipant,
  onRemoveHumanWithAgents
}) => {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<ChatParticipant | null>(null);

  // Get humans and their AI agents
  const getParticipantGroups = () => {
    const humans = participants.filter(p => p.type === 'human');
    const groups = humans.map(human => {
      const aiAgents = participants.filter(p => 
        p.type === 'ai_agent' && p.addedBy === human.id
      );
      return { human, aiAgents };
    });
    return groups;
  };

  // Handle remove participant with confirmation
  const handleRemoveClick = (participant: ChatParticipant) => {
    setParticipantToRemove(participant);
    setShowRemoveDialog(true);
  };

  const handleConfirmRemove = () => {
    if (!participantToRemove) return;

    if (participantToRemove.type === 'human') {
      // Remove human and all their AI agents
      onRemoveHumanWithAgents(conversationId, participantToRemove.id);
    } else {
      // Remove individual AI agent
      onRemoveParticipant(conversationId, participantToRemove.id);
    }

    setShowRemoveDialog(false);
    setParticipantToRemove(null);
  };

  const participantGroups = getParticipantGroups();
  const totalParticipants = participants.length;
  const humanCount = participants.filter(p => p.type === 'human').length;
  const aiCount = participants.filter(p => p.type === 'ai_agent').length;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Participants ({totalParticipants})
          </Typography>
          <Chip
            label={`${humanCount} humans, ${aiCount} AI agents`}
            size="small"
            sx={{ bgcolor: '#374151', color: '#94a3b8' }}
          />
        </Box>

        {isCreator && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => onAddParticipant(conversationId)}
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#3b82f6',
              color: '#3b82f6',
              '&:hover': { borderColor: '#2563eb', bgcolor: '#3b82f610' }
            }}
          >
            Add Participant
          </Button>
        )}
      </Box>

      {/* Creator Authority Notice */}
      {isCreator && (
        <Alert
          icon={<OwnerIcon />}
          severity="info"
          sx={{
            mb: 2,
            bgcolor: '#1e40af20',
            border: '1px solid #3b82f6',
            '& .MuiAlert-icon': { color: '#3b82f6' },
            '& .MuiAlert-message': { color: '#94a3b8' }
          }}
        >
          You created this chat and can manage all participants
        </Alert>
      )}

      {/* Participant Groups */}
      <List sx={{ p: 0 }}>
        {participantGroups.map(({ human, aiAgents }) => (
          <Box key={human.id}>
            {/* Human Participant */}
            <ListItem
              sx={{
                bgcolor: human.role === 'creator' ? '#1e40af20' : 'transparent',
                borderRadius: 1,
                mb: 1,
                border: human.role === 'creator' ? '1px solid #3b82f6' : '1px solid transparent'
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent=""
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: human.isOnline ? '#10b981' : '#6b7280',
                      width: 8,
                      height: 8
                    }
                  }}
                >
                  <Avatar sx={{ bgcolor: '#3b82f6' }}>
                    {human.avatar || human.name.charAt(0)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                      {human.name}
                    </Typography>
                    {human.role === 'creator' && (
                      <Tooltip title="Chat Creator">
                        <OwnerIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                      </Tooltip>
                    )}
                    {human.id === currentUserId && (
                      <Chip label="You" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {human.isOnline ? 'Online' : 'Offline'} • 
                    {aiAgents.length > 0 ? ` ${aiAgents.length} AI agent${aiAgents.length !== 1 ? 's' : ''}` : ' No AI agents'}
                  </Typography>
                }
              />

              {isCreator && human.id !== currentUserId && (
                <ListItemSecondaryAction>
                  <Tooltip title={`Remove ${human.name} and their AI agents`}>
                    <IconButton
                      onClick={() => handleRemoveClick(human)}
                      sx={{ color: '#ef4444' }}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              )}
            </ListItem>

            {/* AI Agents for this Human */}
            {aiAgents.length > 0 && (
              <Box sx={{ ml: 4, mb: 2 }}>
                {aiAgents.map((agent) => (
                  <ListItem
                    key={agent.id}
                    sx={{
                      bgcolor: '#8b5cf620',
                      borderRadius: 1,
                      mb: 0.5,
                      border: '1px solid #8b5cf640'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}>
                        <AIIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {agent.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          AI Agent • Added by {human.name}
                        </Typography>
                      }
                    />

                    {isCreator && (
                      <ListItemSecondaryAction>
                        <Tooltip title={`Remove ${agent.name}`}>
                          <IconButton
                            onClick={() => handleRemoveClick(agent)}
                            size="small"
                            sx={{ color: '#ef4444' }}
                          >
                            <RemoveIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </Box>
            )}

            <Divider sx={{ bgcolor: '#334155', my: 1 }} />
          </Box>
        ))}
      </List>

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={showRemoveDialog}
        onClose={() => setShowRemoveDialog(false)}
        PaperProps={{
          sx: { bgcolor: '#1e293b', color: 'white' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: '#f59e0b' }} />
          Remove Participant
        </DialogTitle>

        <DialogContent>
          {participantToRemove && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to remove{' '}
                <strong>{participantToRemove.name}</strong>?
              </Typography>

              {participantToRemove.type === 'human' && (
                <Alert
                  severity="warning"
                  sx={{
                    bgcolor: '#f59e0b20',
                    border: '1px solid #f59e0b',
                    '& .MuiAlert-icon': { color: '#f59e0b' },
                    '& .MuiAlert-message': { color: '#94a3b8' }
                  }}
                >
                  This will also remove all AI agents that {participantToRemove.name} added to the conversation.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setShowRemoveDialog(false)}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemove}
            variant="contained"
            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SharedChatParticipantManager;

