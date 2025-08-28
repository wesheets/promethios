/**
 * GuestSelectorPopup - Smart popup for adding team members and AI agents to conversations
 * Integrates with Team Collaboration panel data with smart filtering and search
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  Chip,
  Checkbox,
  Divider,
  Button,
  DialogActions,
  InputAdornment,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  SmartToy as AIIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import AgentConfigurationPopup from './collaboration/AgentConfigurationPopup';
import { temporaryRoleService, TemporaryRoleAssignment } from '../services/TemporaryRoleService';

interface TeamMember {
  id: string;
  name: string;
  type: 'human' | 'ai_agent';
  role?: string;
  status: 'online' | 'away' | 'offline';
  avatar?: string;
  health?: number; // For AI agents
  provider?: string; // For AI agents
}

interface GuestSelectorPopupProps {
  open: boolean;
  onClose: () => void;
  onAddGuests: (guests: TeamMember[]) => void;
  currentParticipants: string[];
  teamMembers: TeamMember[];
  aiAgents: TeamMember[];
  // New prop to handle humans being added to conversations
  onAddHumans?: (humans: TeamMember[]) => void;
}

const GuestSelectorPopup: React.FC<GuestSelectorPopupProps> = ({
  open,
  onClose,
  onAddGuests,
  currentParticipants,
  teamMembers,
  aiAgents,
  onAddHumans
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [selectedAIAgents, setSelectedAIAgents] = useState<TeamMember[]>([]);

  // Reset selection when popup opens
  useEffect(() => {
    if (open) {
      setSelectedGuests(new Set());
      setSearchQuery('');
      setShowConfigPopup(false);
      setSelectedAIAgents([]);
    }
  }, [open]);

  // Filter members based on search query and exclude current participants
  const filterMembers = (members: TeamMember[]) => {
    return members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           member.role?.toLowerCase().includes(searchQuery.toLowerCase());
      const notCurrentParticipant = !currentParticipants.includes(member.id);
      return matchesSearch && notCurrentParticipant;
    });
  };

  const filteredHumans = filterMembers(teamMembers);
  const filteredAIAgents = filterMembers(aiAgents);

  const handleToggleSelection = (memberId: string) => {
    const newSelection = new Set(selectedGuests);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedGuests(newSelection);
  };

  const handleAddSelected = () => {
    const allMembers = [...teamMembers, ...aiAgents];
    const selectedMembers = allMembers.filter(member => selectedGuests.has(member.id));
    
    // Separate humans and AI agents
    const selectedHumans = selectedMembers.filter(member => member.type === 'human');
    const selectedAIAgents = selectedMembers.filter(member => member.type === 'ai_agent');
    
    if (selectedAIAgents.length > 0) {
      // If AI agents are selected, show configuration popup
      setSelectedAIAgents(selectedAIAgents);
      setShowConfigPopup(true);
    } else {
      // Only humans selected, add them directly
      if (selectedHumans.length > 0 && onAddHumans) {
        onAddHumans(selectedHumans);
      }
      onAddGuests(selectedMembers);
      onClose();
    }
  };

  const handleConfigureAgents = async (configurations: any[]) => {
    try {
      // Use the same session ID format as the multi-agent system
      const sessionId = `conv_${Date.now()}`;
      
      // Convert configurations to temporary role assignments
      const assignments: TemporaryRoleAssignment[] = configurations.map(config => ({
        agentId: config.agentId,
        agentName: config.agentName,
        careerRole: config.careerRole,
        behavior: config.behavior,
        sessionId: sessionId
      }));

      // Assign temporary roles using the service
      await temporaryRoleService.assignTemporaryRoles(sessionId, assignments);
      
      // Add all selected members (humans + configured AI agents)
      const allMembers = [...teamMembers, ...aiAgents];
      const selectedMembers = allMembers.filter(member => selectedGuests.has(member.id));
      onAddGuests(selectedMembers);
      
      // Close both popups
      setShowConfigPopup(false);
      onClose();
      
    } catch (error) {
      console.error('Failed to configure agents:', error);
      // Still add the agents even if configuration fails
      const allMembers = [...teamMembers, ...aiAgents];
      const selectedMembers = allMembers.filter(member => selectedGuests.has(member.id));
      onAddGuests(selectedMembers);
      setShowConfigPopup(false);
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#10b981';
    if (health >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const renderMemberItem = (member: TeamMember) => {
    const isSelected = selectedGuests.has(member.id);
    
    return (
      <ListItem key={member.id} disablePadding>
        <ListItemButton
          onClick={() => handleToggleSelection(member.id)}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
            '&:hover': {
              backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)'
            }
          }}
        >
          <Checkbox
            checked={isSelected}
            sx={{
              color: '#64748b',
              '&.Mui-checked': { color: '#3b82f6' }
            }}
          />
          
          <ListItemAvatar>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: member.type === 'ai_agent' 
                      ? getHealthColor(member.health || 0)
                      : getStatusColor(member.status),
                    border: '2px solid #0f172a'
                  }}
                />
              }
            >
              <Avatar
                sx={{
                  bgcolor: member.type === 'ai_agent' ? '#8b5cf6' : '#3b82f6',
                  width: 40,
                  height: 40
                }}
              >
                {member.type === 'ai_agent' ? (
                  <AIIcon sx={{ fontSize: 20 }} />
                ) : (
                  <PersonIcon sx={{ fontSize: 20 }} />
                )}
              </Avatar>
            </Badge>
          </ListItemAvatar>
          
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" color="white" fontWeight="500">
                  {member.name}
                </Typography>
                {member.type === 'ai_agent' && member.health !== undefined && (
                  <Chip
                    label={`${member.health}%`}
                    size="small"
                    sx={{
                      backgroundColor: `${getHealthColor(member.health)}20`,
                      color: getHealthColor(member.health),
                      fontSize: '0.7rem',
                      height: 20
                    }}
                  />
                )}
              </Box>
            }
            secondary={
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Typography variant="caption" color="#94a3b8">
                  {member.role || (member.type === 'ai_agent' ? 'AI Agent' : 'Team Member')}
                </Typography>
                {member.provider && (
                  <Chip
                    label={member.provider}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(100, 116, 139, 0.2)',
                      color: '#94a3b8',
                      fontSize: '0.65rem',
                      height: 18
                    }}
                  />
                )}
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <AddIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" fontWeight="600">
            Add to Conversation
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#64748b' }} />
              </InputAdornment>
            )
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#0f172a',
              color: 'white',
              '& fieldset': { borderColor: '#334155' },
              '&:hover fieldset': { borderColor: '#3b82f6' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
            }
          }}
        />

        {/* Humans Section */}
        {filteredHumans.length > 0 && (
          <Box mb={3}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PersonIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
              <Typography variant="subtitle1" color="white" fontWeight="600">
                HUMANS ({filteredHumans.length})
              </Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {filteredHumans.map(renderMemberItem)}
            </List>
          </Box>
        )}

        {/* AI Agents Section */}
        {filteredAIAgents.length > 0 && (
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <AIIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
              <Typography variant="subtitle1" color="white" fontWeight="600">
                AI AGENTS ({filteredAIAgents.length})
              </Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {filteredAIAgents.map(renderMemberItem)}
            </List>
          </Box>
        )}

        {/* No Results */}
        {filteredHumans.length === 0 && filteredAIAgents.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="#64748b">
              {searchQuery ? 'No team members found matching your search.' : 'All team members are already in this conversation.'}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          sx={{ color: '#94a3b8' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAddSelected}
          disabled={selectedGuests.size === 0}
          variant="contained"
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' },
            '&:disabled': { backgroundColor: '#374151', color: '#6b7280' }
          }}
        >
          Add {selectedGuests.size > 0 ? `${selectedGuests.size} ` : ''}Guest{selectedGuests.size !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Secondary Agent Configuration Popup */}
    <AgentConfigurationPopup
      open={showConfigPopup}
      onClose={() => setShowConfigPopup(false)}
      selectedAgents={selectedAIAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        provider: agent.provider
      }))}
      onConfigureAgents={handleConfigureAgents}
    />
    </>
  );
};

export default GuestSelectorPopup;

