/**
 * AgentCommandCenterPanel - Embedded Command Center for Collaboration Panel
 * 
 * This component renders the agent's command center within the collaboration panel
 * instead of navigating to a separate page.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  SmartToy as AgentIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ChatbotStorageService, { ChatbotProfile } from '../../services/ChatbotStorageService';
import { useAuth } from '../../context/AuthContext';

interface AgentCommandCenterPanelProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

const AgentCommandCenterPanel: React.FC<AgentCommandCenterPanelProps> = ({
  agentId,
  agentName,
  onClose
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [agent, setAgent] = useState<ChatbotProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load agent details
  useEffect(() => {
    const loadAgent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentUser?.uid) {
          setError('User not authenticated');
          return;
        }

        const chatbotService = ChatbotStorageService.getInstance();
        const agents = await chatbotService.getChatbots(currentUser.uid);
        
        // Find the specific agent
        const foundAgent = agents.find(a => {
          const currentAgentId = a.identity?.id || a.chatbotMetadata?.id || a.name;
          return currentAgentId === agentId;
        });

        if (foundAgent) {
          setAgent(foundAgent);
        } else {
          setError(`Agent "${agentName}" not found`);
        }
      } catch (err) {
        console.error('Error loading agent:', err);
        setError('Failed to load agent details');
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [agentId, agentName, currentUser?.uid]);

  // Handle opening full command center
  const handleOpenFullCommandCenter = () => {
    navigate(`/ui/chat/chatbots/${agentId}/command-center`);
  };

  // Handle starting chat with agent
  const handleStartChat = () => {
    navigate(`/ui/chat/chatbots/${agentId}`);
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#0f172a'
      }}>
        <CircularProgress sx={{ color: '#10b981' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: '#0f172a', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#f8fafc' }}>
            Agent Command Center
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Alert severity="error" sx={{ bgcolor: '#7f1d1d', color: '#fecaca' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!agent) {
    return (
      <Box sx={{ p: 3, bgcolor: '#0f172a', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#f8fafc' }}>
            Agent Command Center
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Alert severity="warning" sx={{ bgcolor: '#92400e', color: '#fde68a' }}>
          Agent not found
        </Alert>
      </Box>
    );
  }

  const agentDisplayName = agent.identity?.name || agent.name || agentName;
  const agentAvatar = agent.identity?.avatar || agent.chatbotMetadata?.avatar;
  const agentStatus = agent.status || 'inactive';
  const agentExpertise = agent.identity?.expertise || [];

  return (
    <Box sx={{ 
      height: '100%', 
      bgcolor: '#0f172a',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={agentAvatar}
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: agent.chatbotMetadata?.color || '#6366f1'
            }}
          >
            {agentDisplayName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600 }}>
              {agentDisplayName}
            </Typography>
            <Chip
              label={agentStatus}
              size="small"
              sx={{
                bgcolor: agentStatus === 'active' ? '#10b981' : '#6b7280',
                color: 'white',
                fontSize: '0.75rem'
              }}
            />
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {/* Expertise */}
        {agentExpertise.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#cbd5e1', mb: 1 }}>
              Expertise
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {agentExpertise.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  sx={{
                    bgcolor: '#334155',
                    color: '#cbd5e1',
                    fontSize: '0.75rem'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ bgcolor: '#334155', my: 2 }} />

        {/* Quick Actions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#cbd5e1', mb: 2 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Paper
              sx={{
                p: 2,
                bgcolor: '#1e293b',
                border: '1px solid #334155',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#334155' }
              }}
              onClick={handleStartChat}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ChatIcon sx={{ color: '#10b981' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 500 }}>
                    Start Chat
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Begin a conversation with {agentDisplayName}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper
              sx={{
                p: 2,
                bgcolor: '#1e293b',
                border: '1px solid #334155',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#334155' }
              }}
              onClick={handleOpenFullCommandCenter}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LaunchIcon sx={{ color: '#6366f1' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 500 }}>
                    Open Full Command Center
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Access advanced agent management features
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Agent Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#cbd5e1', mb: 2 }}>
            Agent Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Status
              </Typography>
              <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                {agentStatus}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Type
              </Typography>
              <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                AI Assistant
              </Typography>
            </Box>
            {agent.chatbotMetadata?.model && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Model
                </Typography>
                <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                  {agent.chatbotMetadata.model}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AgentCommandCenterPanel;

