/**
 * AgentDocker - Persistent agent avatars with real Firebase integration
 * 
 * Features:
 * - Real-time Firebase data loading with proper error handling
 * - Circuit breaker pattern to prevent duplicate loading calls
 * - Proper loading states and fallback handling
 * - Maintains existing drag & drop functionality
 * - Real-time updates when agents are added/modified
 * - Robust caching and performance optimization
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
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  SmartToy as AgentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChatbotStorageService, { ChatbotProfile } from '../../services/ChatbotStorageService';
import { useAgentDragSource } from '../../hooks/useDragDrop';

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

const AgentDocker: React.FC<AgentDockerProps> = ({
  onAddAgent,
  onAgentClick,
  onBehaviorPrompt,
  maxVisibleAgents = 8,
  showBehaviorPrompts = true
}) => {
  const { currentUser: user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<DockerAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  
  // Circuit breaker to prevent duplicate loading calls
  const loadingAgentsRef = useRef(false);
  const chatbotServiceRef = useRef<ChatbotStorageService | null>(null);

  // Initialize chatbot service
  useEffect(() => {
    if (!chatbotServiceRef.current) {
      chatbotServiceRef.current = ChatbotStorageService.getInstance();
      console.log('🐳 [AgentDocker] ChatbotStorageService initialized');
    }
  }, []);

  // Load agents from Firebase with proper error handling and circuit breaker
  const loadAgents = useCallback(async () => {
    console.log('🐳 [AgentDocker] loadAgents called, user:', user?.uid);
    console.log('🐳 [AgentDocker] authLoading:', authLoading);
    
    // Circuit breaker: prevent multiple simultaneous calls
    if (loadingAgentsRef.current) {
      console.log('🔄 [AgentDocker] Already loading agents, skipping duplicate call');
      return;
    }
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('🔍 [AgentDocker] Auth still loading, waiting...');
      return;
    }
    
    if (!user?.uid) {
      console.log('🔍 [AgentDocker] No user UID after auth loaded, showing demo agents');
      setLoading(false);
      setError(null);
      
      // Show demo agents for unauthenticated users
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
      return;
    }

    if (!chatbotServiceRef.current) {
      console.error('❌ [AgentDocker] ChatbotStorageService not initialized');
      setError('Service not initialized');
      setLoading(false);
      return;
    }

    try {
      // Set circuit breaker
      loadingAgentsRef.current = true;
      
      setLoading(true);
      setError(null);
      console.log('🔍 [AgentDocker] Calling chatbotService.getChatbots with user:', user.uid);
      
      const chatbotProfiles = await chatbotServiceRef.current.getChatbots(user.uid);
      console.log('🔍 [AgentDocker] getChatbots returned:', chatbotProfiles.length, 'chatbots');
      console.log('🔍 [AgentDocker] Chatbot data:', chatbotProfiles);
      
      // Convert chatbot profiles to docker agents
      const dockerAgents: DockerAgent[] = chatbotProfiles
        .filter(profile => profile.status === 'active')
        .map(profile => {
          const agent: DockerAgent = {
            id: profile.identity?.id || profile.id,
            name: profile.identity?.name || 'Unnamed Agent',
            avatar: profile.identity?.avatar,
            color: getAgentColor(profile.identity?.personality || 'professional'),
            status: 'active' as const,
            type: 'ai_agent' as const,
            personality: profile.identity?.personality,
            expertise: profile.identity?.expertise || []
          };
          console.log('🐳 [AgentDocker] Converted agent:', agent.name, agent.id);
          return agent;
        });

      console.log('🐳 [AgentDocker] Final docker agents:', dockerAgents.length);
      setAgents(dockerAgents);
      
      // If no agents found, show helpful message
      if (dockerAgents.length === 0) {
        console.log('🐳 [AgentDocker] No active agents found for user');
        setError(null); // Not an error, just no agents yet
      }
      
    } catch (error) {
      console.error('❌ [AgentDocker] Failed to load agents:', error);
      setError('Failed to load agents. Please try again.');
      setAgents([]);
    } finally {
      setLoading(false);
      // Clear circuit breaker
      loadingAgentsRef.current = false;
      console.log('🔍 [AgentDocker] Loading set to false');
    }
  }, [user?.uid, authLoading]);

  // Load agents on mount and when user changes
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Set up periodic refresh to catch new agents (every 30 seconds)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!loadingAgentsRef.current && user?.uid) {
        console.log('🔄 [AgentDocker] Periodic refresh triggered');
        loadAgents();
      }
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [loadAgents, user?.uid]);

  // Get agent color based on personality
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

  // Determine visible and hidden agents
  const visibleAgents = agents.slice(0, maxVisibleAgents);
  const hiddenAgents = agents.slice(maxVisibleAgents);
  const hasHiddenAgents = hiddenAgents.length > 0;

  // Handle agent click
  const handleAgentClick = (agent: DockerAgent) => {
    onAgentClick?.(agent.id, agent.name);
  };

  // Handle add agent - navigate to Quick Start page
  const handleAddAgent = () => {
    console.log('🐳 [AgentDocker] Navigating to Quick Start page');
    navigate('/ui/chat/setup/quick-start');
    
    // Also call the optional callback if provided
    if (onAddAgent) {
      onAddAgent();
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    console.log('🔄 [AgentDocker] Manual refresh triggered');
    loadAgents();
  };

  // Handle behavior prompt
  const handleBehaviorPrompt = (agentId: string, agentName: string, behavior: string) => {
    onBehaviorPrompt?.(agentId, agentName, behavior);
  };

  // Loading state
  if (loading) {
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
          Loading agents...
        </Typography>
      </Box>
    );
  }

  // Error state with retry option
  if (error) {
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
          {error}
        </Typography>
        <Tooltip title="Retry loading agents">
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
      {/* Main agent row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Visible agents */}
        {visibleAgents.map((agent) => (
          <DraggableAgentAvatar
            key={agent.id}
            agent={agent}
            onClick={() => handleAgentClick(agent)}
            onBehaviorPrompt={showBehaviorPrompts ? handleBehaviorPrompt : undefined}
            showTooltip={hovering}
          />
        ))}

        {/* Expand/Collapse button for hidden agents */}
        {hasHiddenAgents && (
          <Tooltip title={expanded ? 'Show less' : `Show ${hiddenAgents.length} more agents`}>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'rgba(100, 116, 139, 0.3)',
                color: '#94a3b8',
                '&:hover': {
                  bgcolor: 'rgba(100, 116, 139, 0.5)',
                  color: '#e2e8f0'
                }
              }}
            >
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {/* Refresh button */}
        <Tooltip title="Refresh agents">
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'rgba(100, 116, 139, 0.2)',
              color: '#94a3b8',
              '&:hover': {
                bgcolor: 'rgba(100, 116, 139, 0.4)',
                color: '#e2e8f0'
              },
              '&:disabled': {
                opacity: 0.5
              }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Add agent button */}
        <Tooltip title="Create new agent (Quick Start)">
          <IconButton
            size="small"
            onClick={handleAddAgent}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              border: '1px dashed rgba(59, 130, 246, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(59, 130, 246, 0.3)',
                borderColor: 'rgba(59, 130, 246, 0.7)',
                color: '#60a5fa'
              }
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Expanded hidden agents */}
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

      {/* Agent count indicator */}
      {agents.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: 8,
            bgcolor: '#3b82f6',
            color: 'white',
            borderRadius: '50%',
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.6rem',
            fontWeight: 'bold'
          }}
        >
          {agents.length}
        </Box>
      )}

      {/* No agents message */}
      {agents.length === 0 && !loading && !error && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            No agents yet
          </Typography>
          {console.log('🐳 [AgentDocker] Showing "No agents yet" - agents.length:', agents.length, 'loading:', loading, 'error:', error, 'user:', user?.uid)}
          <Tooltip title="Create your first agent">
            <IconButton
              size="small"
              onClick={handleAddAgent}
              sx={{
                width: 24,
                height: 24,
                bgcolor: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa'
                }
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

// Draggable Agent Avatar Component
interface DraggableAgentAvatarProps {
  agent: DockerAgent;
  onClick: () => void;
  onBehaviorPrompt?: (agentId: string, agentName: string, behavior: string) => void;
  showTooltip: boolean;
}

const DraggableAgentAvatar: React.FC<DraggableAgentAvatarProps> = ({
  agent,
  onClick,
  onBehaviorPrompt,
  showTooltip
}) => {
  // Use the existing drag & drop system
  const { dragRef, isDragging, dragHandlers } = useAgentDragSource(
    agent.id,
    {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      color: agent.color,
      avatar: agent.avatar,
      personality: agent.personality,
      expertise: agent.expertise,
    },
    false // isHuman = false (this is an AI agent)
  );

  return (
    <Tooltip
      title={showTooltip ? (
        <Box sx={{ maxWidth: 250 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {agent.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
            AI Agent • {agent.status}
          </Typography>
          {agent.personality && (
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
              Personality: {agent.personality}
            </Typography>
          )}
          {agent.expertise && agent.expertise.length > 0 && (
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                Expertise:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {agent.expertise.slice(0, 3).map((skill, index) => (
                  <Box
                    key={index}
                    sx={{
                      px: 0.5,
                      py: 0.25,
                      bgcolor: 'rgba(59, 130, 246, 0.2)',
                      borderRadius: 0.5,
                      fontSize: '0.6rem',
                      color: '#60a5fa'
                    }}
                  >
                    {skill}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
            💡 Drag onto messages to interact
          </Typography>
          
          {/* Behavioral Prompts */}
          {onBehaviorPrompt && (
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #374151' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                Quick Actions:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {[
                  { behavior: 'collaborate', label: '🤝 Collaborate', color: '#10b981' },
                  { behavior: 'question', label: '❓ Question', color: '#3b82f6' },
                  { behavior: 'expert', label: '🧠 Expert Analysis', color: '#8b5cf6' },
                  { behavior: 'creative', label: '💡 Creative Ideas', color: '#ec4899' }
                ].map((prompt) => (
                  <Box
                    key={prompt.behavior}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBehaviorPrompt?.(agent.id, agent.name, prompt.behavior);
                    }}
                    sx={{
                      px: 1,
                      py: 0.5,
                      bgcolor: 'rgba(55, 65, 81, 0.8)',
                      borderRadius: 1,
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      color: prompt.color,
                      border: `1px solid ${prompt.color}40`,
                      textAlign: 'center',
                      '&:hover': {
                        bgcolor: `${prompt.color}20`,
                        borderColor: `${prompt.color}60`
                      }
                    }}
                  >
                    {prompt.label}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      ) : ''}
      placement="bottom"
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            '& .MuiTooltip-arrow': {
              color: '#1e293b',
            },
          },
        },
      }}
    >
      <Avatar
        ref={dragRef}
        {...dragHandlers}
        onClick={onClick}
        sx={{
          width: 32,
          height: 32,
          bgcolor: agent.color,
          color: 'white',
          fontSize: '0.8rem',
          cursor: 'pointer',
          border: '2px solid transparent',
          transition: 'all 0.2s ease-in-out',
          opacity: isDragging ? 0.5 : 1,
          '&:hover': {
            borderColor: agent.color,
            bgcolor: agent.color,
            transform: 'scale(1.1)',
            boxShadow: `0 4px 12px ${agent.color}40`
          }
        }}
      >
        {agent.avatar || agent.name.charAt(0)}
      </Avatar>
    </Tooltip>
  );
};

export default AgentDocker;

