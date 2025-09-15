/**
 * EnhancedBehavioralPrompts - Advanced behavioral prompting with participant selection
 * Features hover tooltips to select target participants for behavioral injection
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Popper,
  Paper,
  ClickAwayListener,
  Avatar,
  Chip,
  Divider,
  Fade
} from '@mui/material';
import {
  Psychology as CollaborateIcon,
  Help as QuestionIcon,
  Gavel as DevilIcon,
  Analytics as ExpertIcon,
  Lightbulb as CreativeIcon,
  Cloud as PessimistIcon
} from '@mui/icons-material';

interface Participant {
  id: string;
  name: string;
  type: 'ai' | 'human';
  color: string;
  avatar?: string;
  lastMessageTime?: number;
}

interface BehavioralPrompt {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface EnhancedBehavioralPromptsProps {
  participants: Participant[];
  onBehaviorPrompt: (behavior: string, targetId: string, targetName: string) => void;
  recentMessages?: Array<{
    sender: string;
    agentId?: string;
    timestamp: number;
  }>;
}

const behavioralPrompts: BehavioralPrompt[] = [
  {
    id: 'collaborate',
    label: 'Collaborate',
    icon: <CollaborateIcon sx={{ fontSize: 16 }} />,
    color: '#10b981',
    description: 'Work together on this topic'
  },
  {
    id: 'question',
    label: 'Question',
    icon: <QuestionIcon sx={{ fontSize: 16 }} />,
    color: '#3b82f6',
    description: 'Ask for clarification or details'
  },
  {
    id: 'devils_advocate',
    label: "Devil's Advocate",
    icon: <DevilIcon sx={{ fontSize: 16 }} />,
    color: '#ef4444',
    description: 'Challenge this perspective'
  },
  {
    id: 'expert_analysis',
    label: 'Expert Analysis',
    icon: <ExpertIcon sx={{ fontSize: 16 }} />,
    color: '#8b5cf6',
    description: 'Provide expert-level insights'
  },
  {
    id: 'creative_ideas',
    label: 'Creative Ideas',
    icon: <CreativeIcon sx={{ fontSize: 16 }} />,
    color: '#f59e0b',
    description: 'Generate creative solutions'
  },
  {
    id: 'pessimist',
    label: 'Pessimist',
    icon: <PessimistIcon sx={{ fontSize: 16 }} />,
    color: '#64748b',
    description: 'Consider potential problems'
  }
];

const EnhancedBehavioralPrompts: React.FC<EnhancedBehavioralPromptsProps> = ({
  participants,
  onBehaviorPrompt,
  recentMessages = []
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<BehavioralPrompt | null>(null);
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get suggested target based on recent messages
  const getSuggestedTarget = (): Participant | null => {
    if (recentMessages.length === 0) return participants.find(p => p.type === 'ai') || null;
    
    // Find the most recent AI agent who sent a message
    const recentAIMessage = recentMessages
      .filter(msg => msg.agentId && msg.sender === 'assistant')
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (recentAIMessage) {
      return participants.find(p => p.id === recentAIMessage.agentId) || null;
    }
    
    return participants.find(p => p.type === 'ai') || null;
  };

  const handlePromptHover = (event: React.MouseEvent<HTMLElement>, prompt: BehavioralPrompt) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setAnchorEl(event.currentTarget);
    setSelectedPrompt(prompt);
  };

  const handlePromptLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setAnchorEl(null);
      setSelectedPrompt(null);
      setHoveredParticipant(null);
    }, 150); // Small delay to allow moving to tooltip
  };

  const handleTooltipEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleTooltipLeave = () => {
    setAnchorEl(null);
    setSelectedPrompt(null);
    setHoveredParticipant(null);
  };

  const handleParticipantSelect = (participant: Participant) => {
    if (selectedPrompt) {
      onBehaviorPrompt(selectedPrompt.id, participant.id, participant.name);
      setAnchorEl(null);
      setSelectedPrompt(null);
      setHoveredParticipant(null);
    }
  };

  const suggestedTarget = getSuggestedTarget();
  const aiParticipants = participants.filter(p => p.type === 'ai');
  const humanParticipants = participants.filter(p => p.type === 'human');

  return (
    <Box>
      {/* Behavioral Prompt Buttons */}
      <Typography variant="body2" sx={{ 
        color: '#94a3b8', 
        fontSize: '12px', 
        mb: 1,
        fontWeight: 500
      }}>
        Quick Behavior Prompts:
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 0.5 
      }}>
        {behavioralPrompts.map((prompt) => (
          <Button
            key={prompt.id}
            variant="outlined"
            size="small"
            onMouseEnter={(e) => handlePromptHover(e, prompt)}
            onMouseLeave={handlePromptLeave}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              borderColor: prompt.color,
              color: prompt.color,
              bgcolor: 'transparent',
              '&:hover': {
                bgcolor: `${prompt.color}15`,
                borderColor: prompt.color,
              },
              py: 0.75,
              px: 1.5,
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            {prompt.icon}
            <Typography sx={{ ml: 1, fontSize: '12px' }}>
              {prompt.label}
            </Typography>
          </Button>
        ))}
      </Box>

      {/* Participant Selection Tooltip */}
      <Popper
        open={Boolean(anchorEl && selectedPrompt)}
        anchorEl={anchorEl}
        placement="right-start"
        transition
        sx={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper
              onMouseEnter={handleTooltipEnter}
              onMouseLeave={handleTooltipLeave}
              sx={{
                p: 2,
                ml: 1,
                bgcolor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 2,
                minWidth: 280,
                maxWidth: 320
              }}
            >
              {selectedPrompt && (
                <>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ 
                      color: selectedPrompt.color,
                      display: 'flex',
                      alignItems: 'center',
                      mr: 1
                    }}>
                      {selectedPrompt.icon}
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      fontSize: '14px'
                    }}>
                      {selectedPrompt.label}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ 
                    color: '#94a3b8', 
                    fontSize: '12px',
                    mb: 2
                  }}>
                    {selectedPrompt.description}
                  </Typography>

                  {/* Suggested Target */}
                  {suggestedTarget && (
                    <>
                      <Typography variant="body2" sx={{ 
                        color: '#94a3b8', 
                        fontSize: '11px',
                        mb: 1,
                        fontWeight: 500
                      }}>
                        Suggested (last responder):
                      </Typography>
                      
                      <Chip
                        avatar={
                          <Avatar sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: suggestedTarget.color,
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            {suggestedTarget.avatar ? (
                              <img 
                                src={suggestedTarget.avatar} 
                                alt={suggestedTarget.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              suggestedTarget.name.charAt(0).toUpperCase()
                            )}
                          </Avatar>
                        }
                        label={suggestedTarget.name}
                        onClick={() => handleParticipantSelect(suggestedTarget)}
                        onMouseEnter={() => setHoveredParticipant(suggestedTarget.id)}
                        onMouseLeave={() => setHoveredParticipant(null)}
                        sx={{
                          bgcolor: hoveredParticipant === suggestedTarget.id ? `${suggestedTarget.color}20` : 'transparent',
                          border: `1px solid ${suggestedTarget.color}`,
                          color: 'white',
                          fontSize: '12px',
                          height: 28,
                          cursor: 'pointer',
                          mb: 1.5,
                          '&:hover': {
                            bgcolor: `${suggestedTarget.color}20`,
                          }
                        }}
                      />

                      <Divider sx={{ bgcolor: '#334155', mb: 1.5 }} />
                    </>
                  )}

                  {/* All Participants */}
                  <Typography variant="body2" sx={{ 
                    color: '#94a3b8', 
                    fontSize: '11px',
                    mb: 1,
                    fontWeight: 500
                  }}>
                    Send to:
                  </Typography>

                  {/* AI Agents */}
                  {aiParticipants.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" sx={{ 
                        color: '#64748b', 
                        fontSize: '10px',
                        mb: 0.5,
                        fontWeight: 500
                      }}>
                        AI Agents:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {aiParticipants.map((participant) => (
                          <Chip
                            key={participant.id}
                            avatar={
                              <Avatar sx={{
                                width: 18,
                                height: 18,
                                backgroundColor: participant.color,
                                fontSize: '9px',
                                fontWeight: 'bold'
                              }}>
                                {participant.avatar ? (
                                  <img 
                                    src={participant.avatar} 
                                    alt={participant.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  participant.name.charAt(0).toUpperCase()
                                )}
                              </Avatar>
                            }
                            label={participant.name}
                            size="small"
                            onClick={() => handleParticipantSelect(participant)}
                            onMouseEnter={() => setHoveredParticipant(participant.id)}
                            onMouseLeave={() => setHoveredParticipant(null)}
                            sx={{
                              bgcolor: hoveredParticipant === participant.id ? `${participant.color}20` : 'transparent',
                              border: `1px solid ${participant.color}`,
                              color: 'white',
                              fontSize: '11px',
                              height: 24,
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: `${participant.color}20`,
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Humans */}
                  {humanParticipants.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ 
                        color: '#64748b', 
                        fontSize: '10px',
                        mb: 0.5,
                        fontWeight: 500
                      }}>
                        Humans:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {humanParticipants.map((participant) => (
                          <Chip
                            key={participant.id}
                            avatar={
                              <Avatar sx={{
                                width: 18,
                                height: 18,
                                backgroundColor: participant.color,
                                fontSize: '9px',
                                fontWeight: 'bold'
                              }}>
                                {participant.avatar ? (
                                  <img 
                                    src={participant.avatar} 
                                    alt={participant.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  participant.name.charAt(0).toUpperCase()
                                )}
                              </Avatar>
                            }
                            label={participant.name}
                            size="small"
                            onClick={() => handleParticipantSelect(participant)}
                            onMouseEnter={() => setHoveredParticipant(participant.id)}
                            onMouseLeave={() => setHoveredParticipant(null)}
                            sx={{
                              bgcolor: hoveredParticipant === participant.id ? `${participant.color}20` : 'transparent',
                              border: `1px solid ${participant.color}`,
                              color: 'white',
                              fontSize: '11px',
                              height: 24,
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: `${participant.color}20`,
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
};

export default EnhancedBehavioralPrompts;

