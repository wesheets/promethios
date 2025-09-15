import React, { useState, useRef } from 'react';
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

const mockAgents = [
  {
    id: 'claude-1',
    name: 'Claude',
    color: '#ff6b35',
    isActive: false
  },
  {
    id: 'gpt4-1',
    name: 'GPT-4',
    color: '#10a37f',
    isActive: false
  },
  {
    id: 'gemini-1',
    name: 'Gemini',
    color: '#4285f4',
    isActive: false
  }
];

const RevolutionaryVideoConferencePage: React.FC = () => {
  const [isVideoConferenceActive, setIsVideoConferenceActive] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(true);
  const [isContextAwarenessEnabled, setIsContextAwarenessEnabled] = useState(true);
  const [participants, setParticipants] = useState(mockParticipants);
  const [agents, setAgents] = useState(mockAgents);

  const contextManagerRef = useRef<any>(null);

  // Handle wake word detection
  const handleWakeWordDetected = (agentId: string, transcript: string) => {
    console.log(`Wake word detected for ${agentId}:`, transcript);
    
    // Update agent state to active
    setAgents(prev => prev.map(agent => 
      agent.id === agentId || agentId === 'all'
        ? { ...agent, isActive: true }
        : agent
    ));

    // Add to context manager
    if (contextManagerRef.current) {
      contextManagerRef.current.addTranscriptEntry('Human Speaker', transcript, 'human', 0.9);
    }

    // Auto-deactivate after 30 seconds if not mentioned again
    setTimeout(() => {
      setAgents(prev => prev.map(agent => 
        agent.id === agentId || agentId === 'all'
          ? { ...agent, isActive: false }
          : agent
      ));
    }, 30000);
  };

  // Handle transcription updates
  const handleTranscriptionUpdate = (transcript: string, speaker: string) => {
    console.log(`Transcription from ${speaker}:`, transcript);
    
    // Add to context manager
    if (contextManagerRef.current) {
      contextManagerRef.current.addTranscriptEntry(speaker, transcript, 'human', 0.8);
    }
  };

  // Handle context updates
  const handleContextUpdate = (agentId: string, context: string) => {
    console.log(`Context update for ${agentId}:`, context);
    // Here you would typically send the context to the AI agent
  };

  // Handle agent state changes
  const handleAgentStateChange = (agentId: string, state: string) => {
    console.log(`Agent ${agentId} state changed to:`, state);
    
    setAgents(prev => prev.map(agent => 
      agent.id === agentId
        ? { ...agent, isActive: state === 'ACTIVE' }
        : agent
    ));
  };

  // Start video conference
  const startVideoConference = () => {
    setIsVideoConferenceActive(true);
    setIsChatVisible(false); // Hide chat when video starts
  };

  // End video conference
  const endVideoConference = () => {
    setIsVideoConferenceActive(false);
    setIsChatVisible(true); // Show chat when video ends
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0f172a',
        position: 'relative'
      }}
    >
      {/* Video Conference Interface */}
      {isVideoConferenceActive && (
        <VideoConferenceManager
          conversationId="demo-video-conference"
          participants={participants}
          onCallEnd={endVideoConference}
          isVisible={isVideoConferenceActive}
        />
      )}

      {/* Chat Interface (when video is not active) */}
      {isChatVisible && !isVideoConferenceActive && (
        <Box sx={{ flex: 1, position: 'relative' }}>
          <AliveEnhancedChatPage />
          
          {/* Video Call Start Button */}
          <Fab
            color="primary"
            onClick={startVideoConference}
            sx={{
              position: 'fixed',
              top: 20,
              right: 20,
              backgroundColor: '#10b981',
              '&:hover': {
                backgroundColor: '#059669'
              },
              zIndex: 1000
            }}
          >
            <VideoCallIcon />
          </Fab>
        </Box>
      )}

      {/* Demo Interface (when no video conference) */}
      {!isVideoConferenceActive && !isChatVisible && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            textAlign: 'center'
          }}
        >
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
            🎥 Revolutionary Video Conference
          </Typography>
          
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 4, maxWidth: 600 }}>
            The world's first video conference platform where humans and AI agents collaborate 
            in the same room with intelligent wake-word detection and context awareness.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, justifyContent: 'center' }}>
            <Chip label="🎯 Smart Wake-Word Detection" sx={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }} />
            <Chip label="🧠 Context Awareness" sx={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }} />
            <Chip label="🎥 Human Video Tiles" sx={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }} />
            <Chip label="🔊 AI Voice Tiles" sx={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }} />
            <Chip label="⚖️ Live Governance" sx={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }} />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={startVideoConference}
              startIcon={<VideoCallIcon />}
              sx={{
                backgroundColor: '#10b981',
                '&:hover': { backgroundColor: '#059669' },
                px: 4,
                py: 1.5
              }}
            >
              Start Video Conference
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => setIsChatVisible(true)}
              startIcon={<ChatIcon />}
              sx={{
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': { borderColor: '#2563eb', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                px: 4,
                py: 1.5
              }}
            >
              Open Chat Interface
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 4, textAlign: 'left' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#f59e0b', fontWeight: 600, mb: 1 }}>
                👥 Human Participants
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                • Traditional video tiles<br/>
                • Familiar Zoom/Meet experience<br/>
                • Screen sharing & controls
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#3b82f6', fontWeight: 600, mb: 1 }}>
                🤖 AI Agents
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                • Voice waveform tiles<br/>
                • Wake-word activation<br/>
                • Context-aware responses
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Smart Wake-Word Detector */}
      <SmartWakeWordDetector
        agents={agents}
        onWakeWordDetected={handleWakeWordDetected}
        onTranscriptionUpdate={handleTranscriptionUpdate}
        isEnabled={isWakeWordEnabled && isVideoConferenceActive}
      />

      {/* Context Awareness Manager */}
      <ContextAwarenessManager
        ref={contextManagerRef}
        agents={agents}
        onContextUpdate={handleContextUpdate}
        onAgentStateChange={handleAgentStateChange}
        isEnabled={isContextAwarenessEnabled && isVideoConferenceActive}
      />

      {/* Feature Toggle Controls (Demo) */}
      {!isVideoConferenceActive && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 1000
          }}
        >
          <Chip
            label={`Wake-Word: ${isWakeWordEnabled ? 'ON' : 'OFF'}`}
            onClick={() => setIsWakeWordEnabled(!isWakeWordEnabled)}
            sx={{
              backgroundColor: isWakeWordEnabled ? '#10b981' : '#6b7280',
              color: 'white',
              cursor: 'pointer'
            }}
          />
          <Chip
            label={`Context Awareness: ${isContextAwarenessEnabled ? 'ON' : 'OFF'}`}
            onClick={() => setIsContextAwarenessEnabled(!isContextAwarenessEnabled)}
            sx={{
              backgroundColor: isContextAwarenessEnabled ? '#10b981' : '#6b7280',
              color: 'white',
              cursor: 'pointer'
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default RevolutionaryVideoConferencePage;

