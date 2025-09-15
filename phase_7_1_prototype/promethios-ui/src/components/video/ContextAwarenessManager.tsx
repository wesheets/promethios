import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, LinearProgress } from '@mui/material';
import { 
  Psychology, 
  RecordVoiceOver, 
  Insights, 
  TrendingUp 
} from '@mui/icons-material';

interface Participant {
  id: string;
  name: string;
  type: 'human' | 'ai';
}

interface ContextAwarenessManagerProps {
  participants: Participant[];
  isRecording: boolean;
  activeAI?: string | null;
}

const ContextAwarenessManager: React.FC<ContextAwarenessManagerProps> = ({
  participants,
  isRecording,
  activeAI
}) => {
  const [contextScore, setContextScore] = useState(85);
  const [conversationTopic, setConversationTopic] = useState('Authentication System Architecture');
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  // Simulate context awareness updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update context score
      setContextScore(prev => {
        const change = (Math.random() - 0.5) * 10;
        return Math.max(60, Math.min(100, prev + change));
      });

      // Update conversation topics
      const topics = [
        'Authentication System Architecture',
        'Multi-Agent Collaboration Patterns',
        'Security Implementation Strategy',
        'User Experience Optimization',
        'Governance and Compliance',
        'Technical Implementation Details'
      ];
      
      if (Math.random() > 0.7) {
        setConversationTopic(topics[Math.floor(Math.random() * topics.length)]);
      }

      // Add AI insights
      if (activeAI && Math.random() > 0.6) {
        const insights = [
          'High technical complexity detected',
          'Security considerations prioritized',
          'Collaborative decision-making active',
          'Implementation feasibility confirmed',
          'Governance requirements identified',
          'User experience factors considered'
        ];
        
        const newInsight = insights[Math.floor(Math.random() * insights.length)];
        setAiInsights(prev => [newInsight, ...prev.slice(0, 2)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeAI]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 120,
        right: 24,
        width: 300,
        zIndex: 1000
      }}
    >
      <Paper
        sx={{
          p: 2,
          bgcolor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 2
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Psychology sx={{ color: '#3b82f6', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
            Context Awareness
          </Typography>
        </Box>

        {/* Context Score */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Context Understanding
            </Typography>
            <Typography variant="caption" sx={{ color: '#3b82f6' }}>
              {Math.round(contextScore)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={contextScore}
            sx={{
              bgcolor: '#1e293b',
              '& .MuiLinearProgress-bar': {
                bgcolor: contextScore > 80 ? '#059669' : contextScore > 60 ? '#f59e0b' : '#ef4444'
              }
            }}
          />
        </Box>

        {/* Current Topic */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
            Current Topic
          </Typography>
          <Chip
            label={conversationTopic}
            size="small"
            sx={{
              bgcolor: '#1e293b',
              color: '#e2e8f0',
              maxWidth: '100%',
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                lineHeight: 1.2
              }
            }}
          />
        </Box>

        {/* Participants Status */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
            Active Participants
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {participants.map(participant => (
              <Chip
                key={participant.id}
                label={participant.name}
                size="small"
                icon={participant.type === 'ai' ? <Psychology /> : <RecordVoiceOver />}
                sx={{
                  bgcolor: participant.type === 'ai' ? '#3b82f6' : '#059669',
                  color: 'white',
                  fontSize: '0.7rem'
                }}
              />
            ))}
          </Box>
        </Box>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Insights sx={{ color: '#f59e0b', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                AI Insights
              </Typography>
            </Box>
            {aiInsights.map((insight, index) => (
              <Typography
                key={index}
                variant="caption"
                sx={{
                  display: 'block',
                  color: '#e2e8f0',
                  mb: 0.5,
                  fontSize: '0.7rem',
                  opacity: 1 - (index * 0.3)
                }}
              >
                • {insight}
              </Typography>
            ))}
          </Box>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <Box
            sx={{
              mt: 2,
              p: 1,
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#ef4444',
                animation: 'pulse 2s infinite'
              }}
            />
            <Typography variant="caption" sx={{ color: '#ef4444' }}>
              Recording & Analyzing
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ContextAwarenessManager;

