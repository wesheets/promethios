import React from 'react';
import { Box, Typography } from '@mui/material';

interface VideoConferenceManagerProps {
  participants: any[];
  onMuteParticipant: (participantId: string) => void;
  onToggleVideo: (participantId: string) => void;
  isRecording: boolean;
  activeAI?: string | null;
}

const VideoConferenceManager: React.FC<VideoConferenceManagerProps> = () => {
  return (
    <Box 
      sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#1e293b',
        borderRadius: 2,
        m: 2
      }}
    >
      <Typography variant="h6" sx={{ color: '#94a3b8' }}>
        🎥 Video Conference Interface (Demo Placeholder)
      </Typography>
    </Box>
  );
};

export default VideoConferenceManager;

