/**
 * LoadingStates - Collection of loading components for different UI contexts
 * Provides consistent loading experiences across the platform
 */

import React from 'react';
import {
  Box,
  CircularProgress,
  Skeleton,
  Typography,
  LinearProgress,
  Fade,
  Avatar,
  Card,
  CardContent
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  Psychology as BrainIcon
} from '@mui/icons-material';

// Basic loading spinner
export const LoadingSpinner: React.FC<{
  size?: number;
  color?: string;
  message?: string;
}> = ({ size = 40, color = '#3b82f6', message }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: 2,
    p: 3
  }}>
    <CircularProgress size={size} sx={{ color }} />
    {message && (
      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
        {message}
      </Typography>
    )}
  </Box>
);

// AI Agent thinking animation
export const AIThinkingLoader: React.FC<{
  agentName?: string;
  message?: string;
}> = ({ agentName = 'AI Agent', message = 'Thinking...' }) => (
  <Fade in timeout={300}>
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      p: 2,
      bgcolor: '#1e293b',
      borderRadius: 2,
      border: '1px solid #334155'
    }}>
      <Box sx={{ position: 'relative' }}>
        <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}>
          <AIIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <CircularProgress
          size={40}
          sx={{
            color: '#8b5cf6',
            position: 'absolute',
            top: -4,
            left: -4,
            zIndex: 1
          }}
        />
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ color: 'white' }}>
          {agentName}
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          {message}
        </Typography>
      </Box>
      <Box sx={{ ml: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: '#8b5cf6',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
                '@keyframes pulse': {
                  '0%, 80%, 100%': { opacity: 0.3 },
                  '40%': { opacity: 1 }
                }
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  </Fade>
);

// Chat message skeleton
export const ChatMessageSkeleton: React.FC<{
  isUser?: boolean;
  count?: number;
}> = ({ isUser = false, count = 1 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: isUser ? 'flex-end' : 'flex-start'
        }}
      >
        {!isUser && (
          <Skeleton variant="circular" width={32} height={32} />
        )}
        <Box sx={{ 
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Skeleton 
            variant="rectangular" 
            height={60} 
            sx={{ borderRadius: 2 }}
          />
          <Skeleton 
            variant="text" 
            width="60%" 
            height={16}
          />
        </Box>
        {isUser && (
          <Skeleton variant="circular" width={32} height={32} />
        )}
      </Box>
    ))}
  </Box>
);

// Participant list skeleton
export const ParticipantListSkeleton: React.FC<{
  count?: number;
}> = ({ count = 3 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" width="50%" height={16} />
        </Box>
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
      </Box>
    ))}
  </Box>
);

// Conversation list skeleton
export const ConversationListSkeleton: React.FC<{
  count?: number;
}> = ({ count = 5 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="60%" height={16} />
            </Box>
            <Skeleton variant="text" width={40} height={16} />
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
);

// Progress bar with message
export const ProgressLoader: React.FC<{
  progress: number;
  message: string;
  subMessage?: string;
}> = ({ progress, message, subMessage }) => (
  <Box sx={{ width: '100%', p: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <BrainIcon sx={{ color: '#8b5cf6' }} />
      <Typography variant="h6" sx={{ color: 'white' }}>
        {message}
      </Typography>
    </Box>
    
    <LinearProgress
      variant="determinate"
      value={progress}
      sx={{
        height: 8,
        borderRadius: 4,
        bgcolor: '#374151',
        '& .MuiLinearProgress-bar': {
          bgcolor: '#8b5cf6',
          borderRadius: 4
        }
      }}
    />
    
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
        {subMessage || 'Processing...'}
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
        {Math.round(progress)}%
      </Typography>
    </Box>
  </Box>
);

// Full page loading overlay
export const FullPageLoader: React.FC<{
  message?: string;
  subMessage?: string;
}> = ({ message = 'Loading Promethios...', subMessage = 'Initializing AI collaboration platform' }) => (
  <Box sx={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    bgcolor: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Typography variant="h3" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
        Promethios
      </Typography>
      <Typography variant="h6" sx={{ color: '#8b5cf6', mb: 3 }}>
        AI Collaboration Platform
      </Typography>
    </Box>
    
    <Box sx={{ position: 'relative', mb: 3 }}>
      <CircularProgress
        size={60}
        thickness={4}
        sx={{ color: '#8b5cf6' }}
      />
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}>
        <AIIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
      </Box>
    </Box>
    
    <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
      {message}
    </Typography>
    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
      {subMessage}
    </Typography>
  </Box>
);

// Behavioral orchestration loading
export const BehavioralOrchestrationLoader: React.FC<{
  agentName: string;
  behaviorType: string;
}> = ({ agentName, behaviorType }) => (
  <Fade in timeout={300}>
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 2,
      bgcolor: '#1e293b',
      borderRadius: 2,
      border: '1px solid #8b5cf6'
    }}>
      <Box sx={{ position: 'relative' }}>
        <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}>
          <BrainIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <CircularProgress
          size={40}
          sx={{
            color: '#8b5cf6',
            position: 'absolute',
            top: -4,
            left: -4
          }}
        />
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ color: 'white' }}>
          Orchestrating {agentName}
        </Typography>
        <Typography variant="body2" sx={{ color: '#8b5cf6' }}>
          Applying {behaviorType} behavior...
        </Typography>
      </Box>
    </Box>
  </Fade>
);

export default {
  LoadingSpinner,
  AIThinkingLoader,
  ChatMessageSkeleton,
  ParticipantListSkeleton,
  ConversationListSkeleton,
  ProgressLoader,
  FullPageLoader,
  BehavioralOrchestrationLoader
};

