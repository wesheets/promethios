/**
 * MessageIdentityStrip - Color-coded left border for message participant identification
 * Uses strategic color system: cool spectrum for AI agents, warm spectrum for humans
 */

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { SmartToy as BotIcon, Person as PersonIcon } from '@mui/icons-material';

interface Participant {
  id: string;
  name: string;
  type: 'agent' | 'human';
  model?: string;
  role?: string;
  color: string;
  trustScore?: number;
}

interface MessageIdentityStripProps {
  participant: Participant;
  message: string;
  timestamp: Date;
  children?: React.ReactNode;
  isThreaded?: boolean;
  threadLevel?: number;
  showMetadata?: boolean;
}

// Strategic color palettes
const AGENT_COLORS = {
  claude: '#3B82F6',    // Blue
  'gpt-4': '#06B6D4',   // Cyan
  gemini: '#8B5CF6',    // Purple
  custom: '#10B981',    // Emerald
  default: '#64748B'    // Slate
};

const HUMAN_COLORS = {
  host: '#F59E0B',      // Amber
  guest1: '#EF4444',    // Red
  guest2: '#84CC16',    // Lime
  guest3: '#F97316',    // Orange
  collaborator: '#EC4899', // Pink
  default: '#64748B'    // Slate
};

const MessageIdentityStrip: React.FC<MessageIdentityStripProps> = ({
  participant,
  message,
  timestamp,
  children,
  isThreaded = false,
  threadLevel = 0,
  showMetadata = false
}) => {
  const getParticipantColor = (): string => {
    if (participant.type === 'agent') {
      const modelKey = participant.model?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'default';
      return AGENT_COLORS[modelKey as keyof typeof AGENT_COLORS] || participant.color || AGENT_COLORS.default;
    } else {
      const roleKey = participant.role || 'default';
      return HUMAN_COLORS[roleKey as keyof typeof HUMAN_COLORS] || participant.color || HUMAN_COLORS.default;
    }
  };

  const participantColor = getParticipantColor();
  const threadIndent = threadLevel * 16; // 16px per thread level

  return (
    <Box
      sx={{
        position: 'relative',
        ml: threadIndent / 8, // Convert to rem
        mb: 2
      }}
    >
      {/* Threading Lines */}
      {isThreaded && threadLevel > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: -threadIndent,
            top: 0,
            bottom: 0,
            width: threadIndent,
            display: 'flex',
            alignItems: 'stretch'
          }}
        >
          {Array.from({ length: threadLevel }).map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 16,
                borderLeft: index === threadLevel - 1 ? `2px solid ${participantColor}40` : '1px solid #334155',
                borderBottom: index === threadLevel - 1 ? `2px solid ${participantColor}40` : 'none',
                borderBottomLeftRadius: index === threadLevel - 1 ? 8 : 0,
                height: index === threadLevel - 1 ? '50%' : '100%'
              }}
            />
          ))}
        </Box>
      )}

      {/* Main Message Container */}
      <Box
        sx={{
          borderLeft: `4px solid ${participantColor}`,
          borderRadius: '0 8px 8px 0',
          backgroundColor: '#1e293b',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#334155',
            borderLeftColor: participantColor,
            boxShadow: `0 2px 8px ${participantColor}20`
          }
        }}
      >
        {/* Message Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            pb: showMetadata ? 1 : 1.5,
            borderBottom: showMetadata ? '1px solid #334155' : 'none'
          }}
        >
          {/* Participant Icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: participantColor,
              color: 'white'
            }}
          >
            {participant.type === 'agent' ? (
              <BotIcon sx={{ fontSize: 14 }} />
            ) : (
              <PersonIcon sx={{ fontSize: 14 }} />
            )}
          </Box>

          {/* Participant Name */}
          <Typography
            variant="subtitle2"
            sx={{
              color: participantColor,
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            {participant.name}
          </Typography>

          {/* Model/Role Badge */}
          {(participant.model || participant.role) && (
            <Chip
              label={participant.model || participant.role}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                backgroundColor: `${participantColor}20`,
                color: participantColor,
                border: `1px solid ${participantColor}40`
              }}
            />
          )}

          {/* Trust Score */}
          {participant.trustScore && (
            <Chip
              label={`${participant.trustScore}%`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                backgroundColor: participant.trustScore > 80 ? '#10B98120' : '#F59E0B20',
                color: participant.trustScore > 80 ? '#10B981' : '#F59E0B',
                border: `1px solid ${participant.trustScore > 80 ? '#10B981' : '#F59E0B'}40`
              }}
            />
          )}

          {/* Timestamp */}
          <Typography
            variant="caption"
            sx={{
              color: '#94a3b8',
              fontSize: '0.75rem',
              ml: 'auto'
            }}
          >
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>

        {/* Metadata Section */}
        {showMetadata && (
          <Box
            sx={{
              px: 1.5,
              py: 1,
              backgroundColor: '#0f172a',
              borderBottom: '1px solid #334155'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#64748b',
                fontSize: '0.7rem',
                fontFamily: 'monospace'
              }}
            >
              {participant.type === 'agent' ? 'AI Response' : 'Human Message'} • 
              {message.length} chars • 
              {timestamp.toLocaleDateString()}
              {participant.model && ` • Model: ${participant.model}`}
            </Typography>
          </Box>
        )}

        {/* Message Content */}
        <Box
          sx={{
            p: 1.5,
            pt: showMetadata ? 1.5 : 0
          }}
        >
          {children || (
            <Typography
              variant="body1"
              sx={{
                color: '#e2e8f0',
                lineHeight: 1.6,
                fontSize: '0.95rem',
                whiteSpace: 'pre-wrap'
              }}
            >
              {message}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MessageIdentityStrip;

