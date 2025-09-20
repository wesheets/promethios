/**
 * DraggableParticipantChip - A draggable chip component for displaying participants in the drop zone
 * This component is used in the AgentDockerEnhanced to show agents that can be dragged
 */

import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  Badge,
  IconButton,
  Chip,
  Typography
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Person as PersonIcon,
  Psychology,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAgentDragSource } from '../hooks/useDragDrop';

interface DraggableParticipantChipProps {
  participant: {
    id: string;
    name: string;
    avatar?: string;
    color?: string;
    status?: 'active' | 'inactive';
    type?: 'ai_agent' | 'human' | 'host' | 'guest';
    personality?: string;
    expertise?: string[];
  };
  type: 'ai' | 'human';
  onRemove?: (participantId: string) => void;
  onBehaviorPrompt?: (participantId: string, participantName: string, behavior: string) => void;
  showRemoveButton?: boolean;
  showBehaviorButton?: boolean;
}

const DraggableParticipantChip: React.FC<DraggableParticipantChipProps> = ({
  participant,
  type,
  onRemove,
  onBehaviorPrompt,
  showRemoveButton = false,
  showBehaviorButton = false
}) => {
  const { dragRef, isDragging, dragHandlers } = useAgentDragSource(
    participant.id,
    participant,
    type === 'human'
  );
  const [isHovered, setIsHovered] = useState(false);

  const handleBehaviorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBehaviorPrompt) {
      onBehaviorPrompt(participant.id, participant.name, participant.personality || 'professional');
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(participant.id);
    }
  };

  const isAI = type === 'ai';
  const borderColor = isAI ? (participant.color || '#3b82f6') : '#10b981';

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{participant.name}</Typography>
          {isAI && (
            <>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                Personality: {participant.personality || 'N/A'}
              </Typography>
              {participant.expertise && participant.expertise.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Expertise:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {participant.expertise.map((skill) => (
                      <Chip key={skill} label={skill} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      }
      placement="bottom"
      open={isHovered}
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '8px',
            maxWidth: 300,
          },
          '& .MuiTooltip-arrow': {
            color: 'rgba(30, 41, 59, 0.9)',
          },
        },
      }}
    >
      <Box
        ref={dragRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...dragHandlers}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          opacity: isDragging ? 0.5 : 1,
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: participant.status === 'active' ? '#22c55e' : '#f87171',
                border: '2px solid #1e293b',
              }}
            />
          }
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: borderColor,
              border: `2px solid ${borderColor}`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: '#94a3b8',
              },
            }}
          >
            {participant.avatar ? (
              <img src={participant.avatar} alt={participant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              isAI ? <AgentIcon sx={{ color: '#e2e8f0' }} /> : <PersonIcon sx={{ color: '#e2e8f0' }} />
            )}
          </Avatar>
        </Badge>

        {/* Behavior Button */}
        {showBehaviorButton && isAI && onBehaviorPrompt && (
          <IconButton
            size="small"
            onClick={handleBehaviorClick}
            sx={{
              position: 'absolute',
              bottom: -4,
              left: -4,
              width: 18,
              height: 18,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.9)',
              },
              '.MuiBox-root:hover &': {
                opacity: 1,
              },
            }}
          >
            <Psychology sx={{ fontSize: 12 }} />
          </IconButton>
        )}

        {/* Remove Button */}
        {showRemoveButton && onRemove && (
          <IconButton
            size="small"
            onClick={handleRemoveClick}
            sx={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              bgcolor: 'rgba(239, 68, 68, 0.8)',
              color: '#fff',
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 1)',
              },
              '.MuiBox-root:hover &': {
                opacity: 1,
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 12 }} />
          </IconButton>
        )}
      </Box>
    </Tooltip>
  );
};

export default DraggableParticipantChip;
