import React from 'react';
import { Box, Grid, Paper, Avatar, IconButton, Chip, Typography } from '@mui/material';
import { 
  Mic, 
  MicOff, 
  Videocam, 
  VideocamOff, 
  VolumeUp, 
  VolumeOff 
} from '@mui/icons-material';

interface Participant {
  id: string;
  name: string;
  type: 'human' | 'ai';
  avatar: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking: boolean;
  role?: string;
}

interface VideoConferenceManagerProps {
  participants: Participant[];
  onMuteParticipant: (participantId: string) => void;
  onToggleVideo: (participantId: string) => void;
  isRecording: boolean;
  activeAI?: string | null;
}

const VideoConferenceManager: React.FC<VideoConferenceManagerProps> = ({
  participants,
  onMuteParticipant,
  onToggleVideo,
  isRecording,
  activeAI
}) => {
  return (
    <Box sx={{ flex: 1, p: 2 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {participants.map((participant) => (
          <Grid item xs={12} sm={6} md={4} key={participant.id}>
            <Paper
              sx={{
                p: 2,
                height: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: participant.type === 'ai' ? '#1e293b' : '#0f172a',
                border: participant.isSpeaking ? '2px solid #3b82f6' : '1px solid #334155',
                position: 'relative'
              }}
            >
              {/* Video/Avatar Area */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: participant.isVideoEnabled ? '#334155' : '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                {participant.isVideoEnabled ? (
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    📹 Video
                  </Typography>
                ) : (
                  <Avatar sx={{ width: 60, height: 60, bgcolor: '#3b82f6' }}>
                    {participant.name.charAt(0)}
                  </Avatar>
                )}
              </Box>

              {/* Participant Info */}
              <Typography variant="subtitle2" sx={{ color: 'white', textAlign: 'center' }}>
                {participant.name}
              </Typography>
              
              {participant.role && (
                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1 }}>
                  {participant.role}
                </Typography>
              )}

              {/* Type Badge */}
              <Chip
                label={participant.type === 'ai' ? 'AI Agent' : 'Human'}
                size="small"
                sx={{
                  bgcolor: participant.type === 'ai' ? '#3b82f6' : '#059669',
                  color: 'white',
                  mb: 1
                }}
              />

              {/* Active AI Indicator */}
              {participant.type === 'ai' && activeAI === participant.id && (
                <Chip
                  label="Speaking"
                  size="small"
                  sx={{
                    bgcolor: '#ef4444',
                    color: 'white',
                    animation: 'pulse 1s infinite'
                  }}
                />
              )}

              {/* Controls */}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => onMuteParticipant(participant.id)}
                  sx={{
                    color: participant.isAudioEnabled ? '#059669' : '#ef4444',
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {participant.isAudioEnabled ? <Mic /> : <MicOff />}
                </IconButton>
                
                {participant.type === 'human' && (
                  <IconButton
                    size="small"
                    onClick={() => onToggleVideo(participant.id)}
                    sx={{
                      color: participant.isVideoEnabled ? '#059669' : '#ef4444',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {participant.isVideoEnabled ? <Videocam /> : <VideocamOff />}
                  </IconButton>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VideoConferenceManager;

