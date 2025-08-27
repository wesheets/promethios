/**
 * HoverOrchestrationTrigger - Hover system that triggers behavioral orchestration controls
 * Provides intuitive hover interactions for real-time AI behavior adjustment
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  Fade,
  Typography,
  Chip,
  IconButton
} from '@mui/material';
import {
  Psychology as BehaviorIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Tune as TuneIcon,
  AutoAwesome as MagicIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import BehavioralOrchestrationControls, { AIAgent, BehavioralSettings } from './BehavioralOrchestrationControls';

export interface ParticipantData {
  id: string;
  name: string;
  type: 'human' | 'ai';
  avatar?: string;
  isOnline?: boolean;
  aiAgents?: AIAgent[];
  currentBehavior?: BehavioralSettings;
  ownerId?: string;
  ownerName?: string;
}

export interface HoverOrchestrationTriggerProps {
  participants: ParticipantData[];
  onBehaviorChange: (agentId: string, settings: BehavioralSettings) => void;
  onQuickBehaviorTrigger: (agentId: string, trigger: string) => void;
  currentUserId: string;
  showBehavioralControls?: boolean;
  className?: string;
}

export const HoverOrchestrationTrigger: React.FC<HoverOrchestrationTriggerProps> = ({
  participants,
  onBehaviorChange,
  onQuickBehaviorTrigger,
  currentUserId,
  showBehavioralControls = true,
  className
}) => {
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
  const [showOrchestration, setShowOrchestration] = useState(false);
  const [orchestrationAnchor, setOrchestrationAnchor] = useState<HTMLElement | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const participantRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Get AI agents from participants
  const aiAgents: AIAgent[] = participants
    .filter(p => p.type === 'ai')
    .map(p => ({
      id: p.id,
      name: p.name,
      type: 'ai',
      avatar: p.avatar,
      currentBehavior: p.currentBehavior || {
        responseStyle: 'balanced',
        creativity: 50,
        assertiveness: 50,
        collaboration: 70,
        verbosity: 60,
        formality: 60,
        proactivity: 60,
        interactionMode: 'active',
        focusAreas: ['general']
      },
      isActive: p.isOnline || false,
      ownerId: p.ownerId || '',
      ownerName: p.ownerName || 'Unknown'
    }));

  const handleParticipantHover = (participantId: string, element: HTMLElement) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    setHoveredParticipant(participantId);
    
    // Set timeout to show orchestration controls after 500ms hover
    const timeout = setTimeout(() => {
      const participant = participants.find(p => p.id === participantId);
      if (participant && (participant.type === 'ai' || (participant.aiAgents && participant.aiAgents.length > 0))) {
        setOrchestrationAnchor(element);
        setShowOrchestration(true);
      }
    }, 500);

    setHoverTimeout(timeout);
  };

  const handleParticipantLeave = () => {
    // Clear timeout when leaving
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    // Delay hiding to allow moving to orchestration controls
    setTimeout(() => {
      setHoveredParticipant(null);
    }, 100);
  };

  const handleOrchestrationClose = () => {
    setShowOrchestration(false);
    setOrchestrationAnchor(null);
    setHoveredParticipant(null);
  };

  const getParticipantIcon = (participant: ParticipantData) => {
    if (participant.type === 'ai') {
      return <AIIcon sx={{ fontSize: 16 }} />;
    }
    return <PersonIcon sx={{ fontSize: 16 }} />;
  };

  const getParticipantColor = (participant: ParticipantData) => {
    if (participant.type === 'ai') {
      return '#8b5cf6';
    }
    return '#3b82f6';
  };

  const getBehaviorIndicator = (participant: ParticipantData) => {
    if (participant.type === 'ai' && participant.currentBehavior) {
      const behavior = participant.currentBehavior;
      const styleColors = {
        analytical: '#3b82f6',
        creative: '#8b5cf6',
        supportive: '#10b981',
        critical: '#ef4444',
        balanced: '#6b7280'
      };
      return styleColors[behavior.responseStyle] || '#6b7280';
    }
    return null;
  };

  const hasAIAgents = (participant: ParticipantData) => {
    return participant.type === 'ai' || (participant.aiAgents && participant.aiAgents.length > 0);
  };

  return (
    <Box className={className}>
      {/* Participant Avatars with Hover Triggers */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {participants.map((participant) => {
          const isHovered = hoveredParticipant === participant.id;
          const behaviorColor = getBehaviorIndicator(participant);
          const canOrchestrate = hasAIAgents(participant) && showBehavioralControls;

          return (
            <Box
              key={participant.id}
              ref={(el) => (participantRefs.current[participant.id] = el)}
              onMouseEnter={(e) => canOrchestrate && handleParticipantHover(participant.id, e.currentTarget)}
              onMouseLeave={handleParticipantLeave}
              sx={{
                position: 'relative',
                cursor: canOrchestrate ? 'pointer' : 'default',
                transition: 'all 0.2s ease-in-out',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                zIndex: isHovered ? 10 : 1
              }}
            >
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {participant.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {participant.type === 'ai' ? 'AI Agent' : 'Human'}
                      {participant.ownerName && ` • ${participant.ownerName}`}
                    </Typography>
                    {canOrchestrate && (
                      <Typography variant="caption" sx={{ color: '#8b5cf6', display: 'block', mt: 0.5 }}>
                        Hover to orchestrate behavior
                      </Typography>
                    )}
                  </Box>
                }
                placement="top"
                arrow
              >
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    sx={{
                      bgcolor: getParticipantColor(participant),
                      width: 40,
                      height: 40,
                      border: isHovered ? `2px solid ${canOrchestrate ? '#8b5cf6' : '#3b82f6'}` : '2px solid transparent',
                      boxShadow: isHovered && canOrchestrate ? '0 0 20px rgba(139, 92, 246, 0.3)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    src={participant.avatar}
                  >
                    {getParticipantIcon(participant)}
                  </Avatar>

                  {/* Online Status Indicator */}
                  {participant.isOnline && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 12,
                        height: 12,
                        bgcolor: '#10b981',
                        border: '2px solid #1e293b',
                        borderRadius: '50%'
                      }}
                    />
                  )}

                  {/* Behavior Indicator for AI Agents */}
                  {behaviorColor && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 16,
                        height: 16,
                        bgcolor: behaviorColor,
                        border: '2px solid #1e293b',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <BehaviorIcon sx={{ fontSize: 8, color: 'white' }} />
                    </Box>
                  )}

                  {/* Orchestration Available Indicator */}
                  {canOrchestrate && isHovered && (
                    <Fade in={true} timeout={200}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          bgcolor: '#8b5cf6',
                          color: 'white',
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid #8b5cf6'
                          }
                        }}
                      >
                        <MagicIcon sx={{ fontSize: 10, mr: 0.5 }} />
                        Orchestrate
                      </Box>
                    </Fade>
                  )}
                </Box>
              </Tooltip>

              {/* AI Agent Count for Humans */}
              {participant.type === 'human' && participant.aiAgents && participant.aiAgents.length > 0 && (
                <Chip
                  label={`${participant.aiAgents.length} AI`}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#334155',
                    color: '#94a3b8',
                    height: 16,
                    fontSize: '0.6rem',
                    '& .MuiChip-label': { px: 0.5 }
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Behavioral Orchestration Controls */}
      {showBehavioralControls && (
        <BehavioralOrchestrationControls
          aiAgents={aiAgents}
          onBehaviorChange={onBehaviorChange}
          onQuickBehaviorTrigger={onQuickBehaviorTrigger}
          currentUserId={currentUserId}
          isVisible={showOrchestration}
          anchorEl={orchestrationAnchor}
          onClose={handleOrchestrationClose}
        />
      )}
    </Box>
  );
};

export default HoverOrchestrationTrigger;

