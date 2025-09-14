/**
 * ParticipantPanelRight - Smart right panel for human participants
 * Shows human participants and invitation controls when 2+ humans are in conversation
 */

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Tooltip, 
  IconButton, 
  Divider,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { 
  PersonAdd as PersonAddIcon, 
  MoreVert as MoreVertIcon,
  Circle as CircleIcon,
  Email as EmailIcon,
  Link as LinkIcon
} from '@mui/icons-material';

interface Human {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  status: 'online' | 'away' | 'offline' | 'typing';
  role?: 'host' | 'guest' | 'collaborator';
  joinedAt?: Date;
}

interface ParticipantPanelRightProps {
  humans: Human[];
  onInviteHuman?: (email: string, message?: string) => void;
  onHumanSettings?: (humanId: string) => void;
  onGenerateInviteLink?: () => string;
  isVisible: boolean;
  width: string;
}

// Strategic color palette for humans (warm spectrum)
const HUMAN_COLORS = {
  host: '#F59E0B',      // Amber
  guest1: '#EF4444',    // Red
  guest2: '#84CC16',    // Lime
  guest3: '#F97316',    // Orange
  collaborator: '#EC4899', // Pink
  default: '#64748B'    // Slate
};

const ParticipantPanelRight: React.FC<ParticipantPanelRightProps> = ({
  humans,
  onInviteHuman,
  onHumanSettings,
  onGenerateInviteLink,
  isVisible,
  width
}) => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const getHumanColor = (human: Human): string => {
    const roleKey = human.role || 'default';
    return HUMAN_COLORS[roleKey as keyof typeof HUMAN_COLORS] || human.color || HUMAN_COLORS.default;
  };

  const getStatusIndicator = (status: Human['status']) => {
    switch (status) {
      case 'online':
        return { color: '#10B981', label: 'Online' };
      case 'typing':
        return { color: '#3B82F6', label: 'Typing...' };
      case 'away':
        return { color: '#F59E0B', label: 'Away' };
      case 'offline':
        return { color: '#6B7280', label: 'Offline' };
      default:
        return { color: '#6B7280', label: 'Unknown' };
    }
  };

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      onInviteHuman?.(inviteEmail.trim(), inviteMessage.trim() || undefined);
      setInviteEmail('');
      setInviteMessage('');
      setInviteDialogOpen(false);
    }
  };

  const handleGenerateLink = () => {
    const link = onGenerateInviteLink?.();
    if (link) {
      navigator.clipboard.writeText(link);
      // Could show a toast notification here
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Box
      sx={{
        width,
        height: '100%',
        backgroundColor: '#1e293b',
        borderLeft: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Panel Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #334155',
          backgroundColor: '#0f172a'
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: '#e2e8f0',
            fontWeight: 600,
            fontSize: '0.875rem',
            mb: 0.5
          }}
        >
          Participants
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#94a3b8',
            fontSize: '0.75rem'
          }}
        >
          {humans.filter(h => h.status === 'online').length} online, {humans.length} total
        </Typography>
      </Box>

      {/* Human List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1
        }}
      >
        {humans.map((human, index) => {
          const humanColor = getHumanColor(human);
          const statusInfo = getStatusIndicator(human.status);

          return (
            <Box key={human.id} sx={{ mb: 1 }}>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {human.name}
                    </Typography>
                    {human.email && (
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {human.email}
                      </Typography>
                    )}
                    {human.role && (
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Role: {human.role}
                      </Typography>
                    )}
                    {human.joinedAt && (
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Joined: {human.joinedAt.toLocaleDateString()}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: statusInfo.color, display: 'block' }}>
                      Status: {statusInfo.label}
                    </Typography>
                  </Box>
                }
                placement="left"
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#334155',
                    border: `2px solid ${humanColor}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#475569',
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${humanColor}20`
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Human Avatar */}
                    <Avatar
                      src={human.avatar}
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: humanColor,
                        border: `2px solid ${humanColor}`,
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {human.name.charAt(0).toUpperCase()}
                    </Avatar>

                    {/* Human Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#e2e8f0',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {human.name}
                        </Typography>
                        {human.role === 'host' && (
                          <Chip
                            label="Host"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.6rem',
                              backgroundColor: humanColor,
                              color: 'white'
                            }}
                          />
                        )}
                      </Box>
                      {human.email && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#94a3b8',
                            fontSize: '0.7rem',
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {human.email}
                        </Typography>
                      )}
                    </Box>

                    {/* Status Indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CircleIcon
                        sx={{
                          fontSize: 8,
                          color: statusInfo.color
                        }}
                      />
                      {human.status === 'typing' && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: statusInfo.color,
                            fontSize: '0.6rem',
                            fontStyle: 'italic'
                          }}
                        >
                          typing...
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Settings Button */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onHumanSettings?.(human.id);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 20,
                      height: 20,
                      color: '#94a3b8',
                      '&:hover': {
                        color: '#e2e8f0',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    <MoreVertIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              </Tooltip>

              {index < humans.length - 1 && (
                <Divider sx={{ bgcolor: '#475569', my: 1 }} />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Invitation Controls */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #334155'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteDialogOpen(true)}
            sx={{
              flex: 1,
              borderColor: '#475569',
              color: '#94a3b8',
              '&:hover': {
                borderColor: '#64748b',
                color: '#e2e8f0',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Invite
          </Button>
          <IconButton
            size="small"
            onClick={handleGenerateLink}
            sx={{
              borderRadius: 1,
              border: '1px solid #475569',
              color: '#94a3b8',
              '&:hover': {
                borderColor: '#64748b',
                color: '#e2e8f0',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            <LinkIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Invite Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Invite Participant
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#475569' },
                '&:hover fieldset': { borderColor: '#64748b' },
                '&.Mui-focused fieldset': { borderColor: '#3B82F6' }
              },
              '& .MuiInputLabel-root': { color: '#94a3b8' }
            }}
          />
          <TextField
            margin="dense"
            label="Personal Message (Optional)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            placeholder="Add a personal message to the invitation..."
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#475569' },
                '&:hover fieldset': { borderColor: '#64748b' },
                '&.Mui-focused fieldset': { borderColor: '#3B82F6' }
              },
              '& .MuiInputLabel-root': { color: '#94a3b8' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setInviteDialogOpen(false)}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={!inviteEmail.trim()}
            sx={{
              backgroundColor: '#3B82F6',
              '&:hover': { backgroundColor: '#2563EB' }
            }}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParticipantPanelRight;

