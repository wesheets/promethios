import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Chip, Fab } from '@mui/material';
import { VideoCall as VideoCallIcon, Chat as ChatIcon } from '@mui/icons-material';
import VideoConferenceManager from '../components/video/VideoConferenceManager';
import SmartWakeWordDetector from '../components/video/SmartWakeWordDetector';
import ContextAwarenessManager from '../components/video/ContextAwarenessManager';
import AliveEnhancedChatPage from './AliveEnhancedChatPage';

// Mock data for demonstration
const mockParticipants = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    type: 'human' as const,
    avatar: '',
    isVideoEnabled: true,
    isAudioEnabled: true,
    isSpeaking: false,
    role: 'Product Manager'
  },
  {
    id: 'user-2',
    name: 'Mike Rodriguez',
    type: 'human' as const,
    avatar: '',
    isVideoEnabled: true,
    isAudioEnabled: true,
    isSpeaking: false,
    role: 'Developer'
  },
  {
    id: 'claude-1',
    name: 'Claude',
    type: 'ai' as const,
    avatar: '',
    isVideoEnabled: false,
    isAudioEnabled: true,
    isSpeaking: false
  },
  {
    id: 'gpt4-1',
    name: 'GPT-4',
    type: 'ai' as const,
    avatar: '',
    isVideoEnabled: false,
    isAudioEnabled: true,
    isSpeaking: false
  },
  {
    id: 'gemini-1',
    name: 'Gemini',
    type: 'ai' as const,
    avatar: '',
    isVideoEnabled: false,
    isAudioEnabled: true,
    isSpeaking: false
  }
];

/**
 * RevolutionaryVideoConferencePage - Complete video + chat + AI collaboration
 * 
 * This revolutionary interface combines:
 * - Multi-participant video conferencing
 * - Real-time AI agent participation via voice
 * - Smart wake word detection for AI activation
 * - Context-aware conversation management
 * - Integrated enhanced chat interface
 * - Professional meeting experience with AI collaboration
 */
const RevolutionaryVideoConferencePage: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const [participants, setParticipants] = useState(mockParticipants);
  const [isRecording, setIsRecording] = useState(false);
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [activeAI, setActiveAI] = useState<string | null>(null);

  // Simulate AI wake word detection
  useEffect(() => {
    if (meetingStarted) {
      const interval = setInterval(() => {
        // Randomly activate AI agents
        if (Math.random() > 0.8) {
          const aiAgents = participants.filter(p => p.type === 'ai');
          const randomAI = aiAgents[Math.floor(Math.random() * aiAgents.length)];
          setActiveAI(randomAI.id);
          
          // Simulate AI speaking
          setParticipants(prev => prev.map(p => 
            p.id === randomAI.id 
              ? { ...p, isSpeaking: true }
              : { ...p, isSpeaking: false }
          ));

          // Stop AI speaking after a few seconds
          setTimeout(() => {
            setActiveAI(null);
            setParticipants(prev => prev.map(p => ({ ...p, isSpeaking: false })));
          }, 3000 + Math.random() * 4000);
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [meetingStarted, participants]);

  const handleStartMeeting = () => {
    setMeetingStarted(true);
  };

  const handleEndMeeting = () => {
    setMeetingStarted(false);
    setIsRecording(false);
    setActiveAI(null);
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleToggleChat = () => {
    setShowChat(!showChat);
  };

  const handleMuteParticipant = (participantId: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { ...p, isAudioEnabled: !p.isAudioEnabled }
        : p
    ));
  };

  const handleToggleVideo = (participantId: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { ...p, isVideoEnabled: !p.isVideoEnabled }
        : p
    ));
  };

  if (showChat) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header with Video Toggle */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #1e293b',
            bgcolor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            🎥 Video Conference Chat
          </Typography>
          <Button
            startIcon={<VideoCallIcon />}
            onClick={handleToggleChat}
            variant="outlined"
            sx={{ color: '#3b82f6', borderColor: '#3b82f6' }}
          >
            Back to Video
          </Button>
        </Box>
        
        {/* Embedded Enhanced Chat */}
        <Box sx={{ flex: 1 }}>
          <AliveEnhancedChatPage />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0f172a',
        color: 'white'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            🎥 Revolutionary Video Conference
          </Typography>
          <Chip
            label="AI-Enhanced Meeting"
            size="small"
            sx={{
              bgcolor: '#059669',
              color: 'white',
              fontWeight: 500
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            label={`${participants.length} Participants`}
            size="small"
            sx={{ bgcolor: '#1e293b', color: '#94a3b8' }}
          />
          {isRecording && (
            <Chip
              label="● Recording"
              size="small"
              sx={{
                bgcolor: '#ef4444',
                color: 'white',
                animation: 'pulse 2s infinite'
              }}
            />
          )}
          {activeAI && (
            <Chip
              label={`🤖 ${participants.find(p => p.id === activeAI)?.name} Speaking`}
              size="small"
              sx={{
                bgcolor: '#3b82f6',
                color: 'white',
                animation: 'pulse 1s infinite'
              }}
            />
          )}
        </Box>
      </Box>

      {/* Main Video Conference Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!meetingStarted ? (
          /* Pre-Meeting Lobby */
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 2 }}>
              Ready to start your AI-enhanced meeting?
            </Typography>
            
            <Typography variant="body1" sx={{ textAlign: 'center', color: '#94a3b8', maxWidth: 600 }}>
              This revolutionary video conference includes AI agents that can participate via voice,
              smart wake word detection, and integrated enhanced chat capabilities.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<VideoCallIcon />}
                onClick={handleStartMeeting}
                sx={{
                  bgcolor: '#059669',
                  '&:hover': { bgcolor: '#047857' },
                  px: 4,
                  py: 1.5
                }}
              >
                Start Meeting
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<ChatIcon />}
                onClick={handleToggleChat}
                sx={{
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' },
                  px: 4,
                  py: 1.5
                }}
              >
                Chat Only
              </Button>
            </Box>

            {/* Feature Highlights */}
            <Box
              sx={{
                mt: 6,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 3,
                maxWidth: 800,
                width: '100%'
              }}
            >
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>🤖 AI Participants</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Claude, GPT-4, and Gemini can join via voice
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>🎙️ Wake Word Detection</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Smart activation of AI agents during conversation
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>💬 Enhanced Chat</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Full multi-agent chat interface integrated
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          /* Active Meeting Interface */
          <>
            {/* Video Conference Manager */}
            <VideoConferenceManager
              participants={participants}
              onMuteParticipant={handleMuteParticipant}
              onToggleVideo={handleToggleVideo}
              isRecording={isRecording}
              activeAI={activeAI}
            />

            {/* Smart Wake Word Detector */}
            <SmartWakeWordDetector
              isActive={meetingStarted}
              onAIActivated={setActiveAI}
              participants={participants}
            />

            {/* Context Awareness Manager */}
            <ContextAwarenessManager
              participants={participants}
              isRecording={isRecording}
              activeAI={activeAI}
            />

            {/* Meeting Controls */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                bgcolor: '#0f172a'
              }}
            >
              <Button
                variant={isRecording ? 'contained' : 'outlined'}
                onClick={handleToggleRecording}
                sx={{
                  bgcolor: isRecording ? '#ef4444' : 'transparent',
                  borderColor: '#ef4444',
                  color: isRecording ? 'white' : '#ef4444',
                  '&:hover': {
                    bgcolor: isRecording ? '#dc2626' : 'rgba(239, 68, 68, 0.1)'
                  }
                }}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>

              <Button
                variant="outlined"
                onClick={handleToggleChat}
                sx={{
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' }
                }}
              >
                Open Chat
              </Button>

              <Button
                variant="contained"
                onClick={handleEndMeeting}
                sx={{
                  bgcolor: '#ef4444',
                  '&:hover': { bgcolor: '#dc2626' }
                }}
              >
                End Meeting
              </Button>
            </Box>
          </>
        )}
      </Box>

      {/* Floating Chat Button */}
      {meetingStarted && (
        <Fab
          color="primary"
          onClick={handleToggleChat}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            bgcolor: '#3b82f6',
            '&:hover': { bgcolor: '#2563eb' }
          }}
        >
          <ChatIcon />
        </Fab>
      )}
    </Box>
  );
};

export default RevolutionaryVideoConferencePage;

