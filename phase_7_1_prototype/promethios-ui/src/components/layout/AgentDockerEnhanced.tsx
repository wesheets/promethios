/**
 * AgentDockerEnhanced - A more advanced version of the AgentDocker
 * with dedicated sections for AI and Human collaborators.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  Badge,
  IconButton,
  Collapse,
  Typography,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  SmartToy as AgentIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Psychology
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChatbotStorageService, { ChatbotProfile } from '../../services/ChatbotStorageService';
import { useAgentDragSource } from '../../hooks/useDragDrop';
import { usePinnedCollaborators, PinnedCollaborator } from '../../hooks/usePinnedCollaborators';

interface AgentDockerProps {
  onAddAgent?: () => void;
  onAgentClick?: (agentId: string, agentName: string) => void;
  onBehaviorPrompt?: (agentId: string, agentName: string, behavior: string) => void;
  maxVisibleAgents?: number;
  showBehaviorPrompts?: boolean;
}

interface DockerAgent {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  status: 'active' | 'inactive';
  type: 'ai_agent';
  personality?: string;
  expertise?: string[];
}

interface DockerHuman {
    id: string;
    name: string;
    avatar?: string;
    status: 'active' | 'inactive';
    type: 'human';
}

const AgentDockerEnhanced: React.FC<AgentDockerProps> = ({
  onAddAgent,
  onAgentClick,
  onBehaviorPrompt,
  maxVisibleAgents = 8,
  showBehaviorPrompts = true
}) => {
  const { currentUser: user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<DockerAgent[]>([]);
  const { collaborators: humans, loading: humansLoading, error: humansError } = usePinnedCollaborators();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  
  const loadingAgentsRef = useRef(false);
  const chatbotServiceRef = useRef<ChatbotStorageService | null>(null);

  useEffect(() => {
    if (!chatbotServiceRef.current) {
      chatbotServiceRef.current = ChatbotStorageService.getInstance();
      console.log('🐳 [AgentDocker] ChatbotStorageService initialized');
    }
  }, []);

  const loadAgents = useCallback(async () => {
    if (loadingAgentsRef.current) {
      return;
    }
    if (authLoading) {
      return;
    }
    if (!user?.uid) {
      const demoAgents: DockerAgent[] = [
        {
          id: 'demo-sarah',
          name: 'Sarah Analytics',
          avatar: undefined,
          color: '#3b82f6',
          status: 'active',
          type: 'ai_agent',
          personality: 'analytical',
          expertise: ['Data Analysis', 'Visualization', 'Statistics']
        },
        {
          id: 'demo-marcus',
          name: 'Marcus Creative',
          avatar: undefined,
          color: '#10b981',
          status: 'active',
          type: 'ai_agent',
          personality: 'creative',
          expertise: ['Creative Writing', 'Marketing', 'Branding']
        },
        {
          id: 'demo-alex',
          name: 'Alex Technical',
          avatar: undefined,
          color: '#f59e0b',
          status: 'active',
          type: 'ai_agent',
          personality: 'professional',
          expertise: ['Software Development', 'Architecture', 'DevOps']
        }
      ];
      setAgents(demoAgents);
      setLoading(false);
      return;
    }

    if (!chatbotServiceRef.current) {
      setError('Service not initialized');
      setLoading(false);
      return;
    }

    try {
      loadingAgentsRef.current = true;
      setLoading(true);
      setError(null);
      const chatbotProfiles = await chatbotServiceRef.current.getChatbots(user.uid);
      const dockerAgents: DockerAgent[] = chatbotProfiles
        .map(profile => ({
            id: profile.identity?.id || profile.id,
            name: profile.identity?.name || 'Unnamed Agent',
            avatar: profile.identity?.avatar,
            color: getAgentColor(profile.identity?.personality || 'professional'),
            status: 'active' as const,
            type: 'ai_agent' as const,
            personality: profile.identity?.personality,
            expertise: profile.identity?.expertise || []
        }));

      setAgents(dockerAgents);
      if (dockerAgents.length === 0) {
        setError(null);
      }
    } catch (error) {
      console.error('❌ [AgentDocker] Failed to load agents:', error);
      setError('Failed to load agents. Please try again.');
      setAgents([]);
    } finally {
      setLoading(false);
      loadingAgentsRef.current = false;
    }
  }, [user?.uid, authLoading]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const getAgentColor = (personality: string): string => {
    const colorMap: Record<string, string> = {
      professional: '#3b82f6',
      friendly: '#10b981',
      casual: '#f59e0b',
      helpful: '#8b5cf6',
      analytical: '#06b6d4',
      creative: '#ec4899'
    };
    return colorMap[personality] || '#64748b';
  };

  const visibleAgents = agents.slice(0, maxVisibleAgents);
  const hiddenAgents = agents.slice(maxVisibleAgents);
  const hasHiddenAgents = hiddenAgents.length > 0;

  const handleAgentClick = (agent: DockerAgent) => {
    onAgentClick?.(agent.id, agent.name);
  };

  const handleAddAgent = () => {
    navigate('/ui/chat/setup/quick-start');
    if (onAddAgent) {
      onAddAgent();
    }
  };

  const handleRefresh = () => {
    loadAgents();
  };

  const handleBehaviorPrompt = (agentId: string, agentName: string, behavior: string) => {
    onBehaviorPrompt?.(agentId, agentName, behavior);
  };

  if (loading || humansLoading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          bgcolor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: '0 0 12px 12px',
          px: 2,
          py: 1,
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderTop: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <CircularProgress size={16} sx={{ color: '#94a3b8' }} />
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (error || humansError) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          bgcolor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: '0 0 12px 12px',
          px: 2,
          py: 1,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderTop: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Typography variant="caption" sx={{ color: '#ef4444' }}>
          {error || humansError}
        </Typography>
        <Tooltip title="Retry">
          <IconButton
            size="small"
            onClick={handleRefresh}
            sx={{
              width: 20,
              height: 20,
              color: '#ef4444',
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 0.1)'
              }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      sx={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1300,
        bgcolor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: '0 0 16px 16px',
        px: 2,
        py: 1.5,
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderTop: 'none',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          bgcolor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(148, 163, 184, 0.5)',
          transform: 'translateX(-50%) translateY(2px)',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.75rem', minWidth: '20px' }}>
            AI
          </Typography>
          
          {visibleAgents.map((agent) => (
            <DraggableAgentAvatar
              key={agent.id}
              agent={agent}
              onClick={() => handleAgentClick(agent)}
              onBehaviorPrompt={showBehaviorPrompts ? handleBehaviorPrompt : undefined}
              showTooltip={hovering}
            />
          ))}

          {hasHiddenAgents && (
            <Tooltip title={expanded ? 'Show less' : `Show ${hiddenAgents.length} more agents`}>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{ width: 32, height: 32, bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.3)', color: '#60a5fa' } }}
              >
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Create new AI agent">
            <IconButton
              size="small"
              onClick={handleAddAgent}
              sx={{ width: 32, height: 32, bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px dashed rgba(59, 130, 246, 0.5)', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.3)', borderColor: 'rgba(59, 130, 246, 0.7)', color: '#60a5fa' } }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ width: '1px', height: '24px', bgcolor: 'rgba(148, 163, 184, 0.3)' }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.75rem', minWidth: '12px' }}>
            H
          </Typography>
          
          {humans.map(human => (
              <CollaboratorAvatar key={human.id} collaborator={human} showTooltip={hovering} />
          ))}

          <Tooltip title="Add human collaborator">
            <IconButton
              size="small"
              onClick={() => console.log('Add human collaborator')}
              sx={{ width: 32, height: 32, bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px dashed rgba(16, 185, 129, 0.5)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.3)', borderColor: 'rgba(16, 185, 129, 0.7)', color: '#34d399' } }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, pt: 1, borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
          {hiddenAgents.map((agent) => (
            <DraggableAgentAvatar
              key={agent.id}
              agent={agent}
              onClick={() => handleAgentClick(agent)}
              onBehaviorPrompt={showBehaviorPrompts ? handleBehaviorPrompt : undefined}
              showTooltip={hovering}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

interface DraggableAgentAvatarProps {
  agent: DockerAgent;
  onClick: () => void;
  onBehaviorPrompt?: (agentId: string, agentName: string, behavior: string) => void;
  showTooltip: boolean;
}

const DraggableAgentAvatar: React.FC<DraggableAgentAvatarProps> = ({ agent, onClick, onBehaviorPrompt, showTooltip }) => {
  const [{ isDragging }, drag] = useAgentDragSource(agent.id, agent.name);

  const handleBehaviorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBehaviorPrompt) {
      onBehaviorPrompt(agent.id, agent.name, agent.personality || 'professional');
    }
  };

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{agent.name}</Typography>
          <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
            Personality: {agent.personality || 'N/A'}
          </Typography>
          {agent.expertise && agent.expertise.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Expertise:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {agent.expertise.map((skill) => (
                  <Chip key={skill} label={skill} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      }
      placement="bottom"
      open={showTooltip}
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
        ref={drag}
        onClick={onClick}
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
                bgcolor: agent.status === 'active' ? '#22c55e' : '#f87171',
                border: '2px solid #1e293b',
              }}
            />
          }
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: agent.color,
              border: `2px solid ${agent.color}`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: '#94a3b8',
              },
            }}
          >
            {agent.avatar ? (
              <img src={agent.avatar} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <AgentIcon sx={{ color: '#e2e8f0' }} />
            )}
          </Avatar>
        </Badge>
        {onBehaviorPrompt && (
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
      </Box>
    </Tooltip>
  );
};

interface CollaboratorAvatarProps {
    collaborator: PinnedCollaborator;
    showTooltip: boolean;
}

const CollaboratorAvatar: React.FC<CollaboratorAvatarProps> = ({ collaborator, showTooltip }) => {
    return (
        <Tooltip
            title={
                <Box sx={{ p: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{collaborator.name}</Typography>
                </Box>
            }
            placement="bottom"
            open={showTooltip}
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
                sx={{
                    position: 'relative',
                    cursor: 'pointer',
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
                                bgcolor: collaborator.status === 'active' ? '#22c55e' : '#f87171',
                                border: '2px solid #1e293b',
                            }}
                        />
                    }
                >
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            bgcolor: '#64748b',
                            border: `2px solid #64748b`,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                borderColor: '#94a3b8',
                            },
                        }}
                    >
                        {collaborator.avatar ? (
                            <img src={collaborator.avatar} alt={collaborator.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <PersonIcon sx={{ color: '#e2e8f0' }} />
                        )}
                    </Avatar>
                </Badge>
            </Box>
        </Tooltip>
    );
};

export default AgentDockerEnhanced;

