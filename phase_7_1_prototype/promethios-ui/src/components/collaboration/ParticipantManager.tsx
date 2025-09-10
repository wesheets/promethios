/**
 * ParticipantManager - Enhanced participant management with proper permissions
 * Provides a dedicated interface for managing conversation participants
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  SmartToy as SmartToyIcon,
  Crown as CrownIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { unifiedParticipantService, UnifiedParticipant } from '../../services/UnifiedParticipantService';

export interface ParticipantManagerProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  open: boolean;
  onClose: () => void;
  onAddHuman?: () => void;
  onAddAIAgent?: () => void;
}

export const ParticipantManager: React.FC<ParticipantManagerProps> = ({
  conversationId,
  currentUserId,
  currentUserName,
  open,
  onClose,
  onAddHuman,
  onAddAIAgent
}) => {
  const [participants, setParticipants] = useState<UnifiedParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<UnifiedParticipant | null>(null);

  // Load participants with permissions
  useEffect(() => {
    if (open && conversationId) {
      loadParticipants();
    }
  }, [open, conversationId]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      console.log('📋 [ParticipantManager] Loading participants with permissions');
      
      const participantsWithPermissions = await unifiedParticipantService.getParticipantsWithPermissions(
        conversationId,
        currentUserId
      );
      
      console.log('📋 [ParticipantManager] Loaded participants:', participantsWithPermissions);
      setParticipants(participantsWithPermissions);
      
    } catch (error) {
      console.error('❌ [ParticipantManager] Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle remove participant
  const handleRemoveClick = (participant: UnifiedParticipant) => {
    setParticipantToRemove(participant);
    setRemoveConfirmOpen(true);
  };

  const confirmRemoveParticipant = async () => {
    if (!participantToRemove) return;

    try {
      console.log('🗑️ [ParticipantManager] Removing participant:', participantToRemove.id);
      
      await unifiedParticipantService.removeParticipant(
        conversationId,
        participantToRemove.id,
        currentUserId
      );
      
      console.log('✅ [ParticipantManager] Participant removed successfully');
      
      // Reload participants
      await loadParticipants();
      
    } catch (error) {
      console.error('❌ [ParticipantManager] Error removing participant:', error);
    } finally {
      setRemoveConfirmOpen(false);
      setParticipantToRemove(null);
    }
  };

  // Get participant type icon
  const getParticipantIcon = (participant: UnifiedParticipant) => {
    if (participant.permissions.isHost) {
      return <CrownIcon sx={{ color: '#fbbf24' }} />;
    } else if (participant.type === 'human') {
      return <PersonAddIcon sx={{ color: '#3b82f6' }} />;
    } else {
      return <SmartToyIcon sx={{ color: '#8b5cf6' }} />;
    }
  };

  // Get status chip
  const getStatusChip = (participant: UnifiedParticipant) => {
    const statusConfig = {
      active: { label: 'Active', color: '#10b981' },
      pending: { label: 'Pending', color: '#f59e0b' },
      declined: { label: 'Declined', color: '#ef4444' }
    };

    const config = statusConfig[participant.status];
    
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          bgcolor: `${config.color}20`,
          color: config.color,
          border: `1px solid ${config.color}40`,
          fontSize: '0.7rem'
        }}
      />
    );
  };

  // Group participants by type
  const hostParticipants = participants.filter(p => p.permissions.isHost);
  const humanParticipants = participants.filter(p => p.type === 'human' && !p.permissions.isHost);
  const aiAgentParticipants = participants.filter(p => p.type === 'ai_agent');

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: 'white',
            border: '1px solid #334155'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Manage Participants</Typography>
            <Chip
              label={`${participants.length} total`}
              size="small"
              sx={{ bgcolor: '#374151', color: 'white' }}
            />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Loading participants...</Typography>
            </Box>
          ) : (
            <Box>
              {/* Host Section */}
              {hostParticipants.length > 0 && (
                <Box>
                  <Box sx={{ p: 2, bgcolor: '#374151' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      👑 Host
                    </Typography>
                  </Box>
                  <List sx={{ py: 0 }}>
                    {hostParticipants.map((participant) => (
                      <ListItem key={participant.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#fbbf24' }}>
                            {getParticipantIcon(participant)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={participant.name}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              {getStatusChip(participant)}
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Host • Added {participant.addedAt.toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Human Participants Section */}
              {humanParticipants.length > 0 && (
                <Box>
                  <Divider sx={{ borderColor: '#334155' }} />
                  <Box sx={{ p: 2, bgcolor: '#374151' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      👤 Human Participants ({humanParticipants.length})
                    </Typography>
                  </Box>
                  <List sx={{ py: 0 }}>
                    {humanParticipants.map((participant) => (
                      <ListItem key={participant.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#3b82f6' }}>
                            {participant.avatar || participant.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={participant.name}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              {getStatusChip(participant)}
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Added {participant.addedAt.toLocaleDateString()}
                                {participant.status === 'pending' && (
                                  <> • <ScheduleIcon sx={{ fontSize: 12, ml: 0.5 }} /> Invitation pending</>
                                )}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          {participant.permissions.canRemove && (
                            <Tooltip title="Remove participant">
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveClick(participant)}
                                sx={{ color: '#ef4444' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* AI Agent Participants Section */}
              {aiAgentParticipants.length > 0 && (
                <Box>
                  <Divider sx={{ borderColor: '#334155' }} />
                  <Box sx={{ p: 2, bgcolor: '#374151' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      🤖 AI Agents ({aiAgentParticipants.length})
                    </Typography>
                  </Box>
                  <List sx={{ py: 0 }}>
                    {aiAgentParticipants.map((participant) => (
                      <ListItem key={participant.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: participant.agentConfig?.color || '#8b5cf6' }}>
                            {participant.avatar || participant.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={participant.name}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              {getStatusChip(participant)}
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {participant.agentConfig?.provider || 'AI Agent'} • 
                                Added {participant.addedAt.toLocaleDateString()}
                                {participant.agentConfig?.hotkey && (
                                  <> • Hotkey: {participant.agentConfig.hotkey.toUpperCase()}</>
                                )}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          {participant.permissions.canRemove && (
                            <Tooltip title="Remove agent">
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveClick(participant)}
                                sx={{ color: '#ef4444' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Empty State */}
              {participants.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography sx={{ color: '#94a3b8' }}>
                    No participants found
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #334155', p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mr: 'auto' }}>
            {onAddHuman && (
              <Button
                startIcon={<PersonAddIcon />}
                onClick={onAddHuman}
                sx={{ color: '#3b82f6' }}
              >
                Add Human
              </Button>
            )}
            {onAddAIAgent && (
              <Button
                startIcon={<SmartToyIcon />}
                onClick={onAddAIAgent}
                sx={{ color: '#8b5cf6' }}
              >
                Add AI Agent
              </Button>
            )}
          </Box>
          <Button onClick={onClose} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={removeConfirmOpen}
        onClose={() => setRemoveConfirmOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: 'white',
            border: '1px solid #334155'
          }
        }}
      >
        <DialogTitle>Remove Participant</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove{' '}
            <strong>{participantToRemove?.name}</strong> from this conversation?
          </Typography>
          {participantToRemove?.type === 'human' && (
            <Typography variant="body2" sx={{ mt: 1, color: '#94a3b8' }}>
              They will lose access to this conversation and its history.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveConfirmOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            onClick={confirmRemoveParticipant}
            sx={{ color: '#ef4444' }}
            variant="contained"
            color="error"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ParticipantManager;

