import React, { useEffect, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { Mic, Psychology } from '@mui/icons-material';

interface Participant {
  id: string;
  name: string;
  type: 'human' | 'ai';
}

interface SmartWakeWordDetectorProps {
  isActive: boolean;
  onAIActivated: (aiId: string) => void;
  participants: Participant[];
}

const SmartWakeWordDetector: React.FC<SmartWakeWordDetectorProps> = ({
  isActive,
  onAIActivated,
  participants
}) => {
  const [isListening, setIsListening] = useState(false);
  const [detectedWakeWord, setDetectedWakeWord] = useState<string | null>(null);

  // Simulate wake word detection
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Simulate random wake word detection
      if (Math.random() > 0.85) {
        const aiParticipants = participants.filter(p => p.type === 'ai');
        if (aiParticipants.length > 0) {
          const randomAI = aiParticipants[Math.floor(Math.random() * aiParticipants.length)];
          const wakeWords = ['Hey Claude', 'GPT-4', 'Gemini', 'AI assistant'];
          const randomWakeWord = wakeWords[Math.floor(Math.random() * wakeWords.length)];
          
          setDetectedWakeWord(randomWakeWord);
          setIsListening(true);
          onAIActivated(randomAI.id);
          
          // Clear detection after a few seconds
          setTimeout(() => {
            setDetectedWakeWord(null);
            setIsListening(false);
          }, 3000);
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isActive, participants, onAIActivated]);

  if (!isActive) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 24,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      {/* Wake Word Detector Status */}
      <Chip
        icon={<Psychology />}
        label="Smart Wake Word Detection"
        size="small"
        sx={{
          bgcolor: isListening ? '#3b82f6' : '#1e293b',
          color: 'white',
          animation: isListening ? 'pulse 1s infinite' : 'none'
        }}
      />

      {/* Detected Wake Word */}
      {detectedWakeWord && (
        <Box
          sx={{
            p: 2,
            bgcolor: '#0f172a',
            border: '1px solid #3b82f6',
            borderRadius: 2,
            minWidth: 200
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Mic sx={{ color: '#3b82f6', fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600 }}>
              Wake Word Detected
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'white' }}>
            "{detectedWakeWord}"
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Activating AI agent...
          </Typography>
        </Box>
      )}

      {/* Listening Indicator */}
      {isListening && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            bgcolor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 1,
            border: '1px solid #3b82f6'
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#3b82f6',
              animation: 'pulse 1s infinite'
            }}
          />
          <Typography variant="caption" sx={{ color: '#3b82f6' }}>
            Listening...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SmartWakeWordDetector;

