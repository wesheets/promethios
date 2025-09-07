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
  Badge,
  CircularProgress,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  SmartToy as AIIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import AgentConfigurationPopup from './collaboration/AgentConfigurationPopup';
import { temporaryRoleService, TemporaryRoleAssignment } from '../services/TemporaryRoleService';
import { useUserInteractions } from '../hooks/useUserInteractions';
import HumanChatService, { TeamMember as RealTeamMember } from '../services/HumanChatService';
import aiCollaborationInvitationService from '../services/ChatInvitationService';

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
  // Props needed for AI collaboration invitations
  currentUserId?: string;
  currentUserName?: string;
  conversationId?: string;
  conversationName?: string;
  agentName?: string;
  // Loading state for connections
  connectionsLoading?: boolean;
  // New props for unified functionality
  chatSession?: {
    id: string;
    name: string;
    messageCount?: number;
  };
  agentId?: string;
  user?: any; // Firebase user object
}

const GuestSelectorPopup: React.FC<GuestSelectorPopupProps> = ({
  open,
  onClose,
  onAddGuests,
  currentParticipants,
  teamMembers,
  aiAgents,
  onAddHumans,
  currentUserId,
  currentUserName,
  conversationId,
  conversationName,
  agentName,
  connectionsLoading = false,
  chatSession,
  agentId,
  user
}) => {
  // Use unified notification system for sending invitations
  const { sendInteraction } = useUserInteractions();
  
  // Existing state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [selectedAIAgents, setSelectedAIAgents] = useState<TeamMember[]>([]);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [selectedHumansForInvitation, setSelectedHumansForInvitation] = useState<TeamMember[]>([]);

  // New state for unified functionality
  const [tabValue, setTabValue] = useState(0);
  const [realTeamMembers, setRealTeamMembers] = useState<RealTeamMember[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<RealTeamMember[]>([]);
  const [emailAddress, setEmailAddress] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Service instances
  const humanChatService = HumanChatService.getInstance();

  // Reset selection when popup opens
  useEffect(() => {
    if (open) {
      setSelectedGuests(new Set());
      setSearchQuery('');
      setShowConfigPopup(false);
      setSelectedAIAgents([]);
      setShowInvitationDialog(false);
      setSelectedHumansForInvitation([]);
      // Reset new state
      setTabValue(0);
      setSelectedTeamMembers([]);
      setEmailAddress('');
      setPersonalMessage('');
      setError(null);
    }
  }, [open]);

  // Load real team members when popup opens
  useEffect(() => {
    if (open && currentUserId) {
      loadRealTeamMembers();
    }
  }, [open, currentUserId]);

  const loadRealTeamMembers = async () => {
    try {
      console.log('🔍 [GuestSelector] Loading real team members...');
      await humanChatService.initialize(currentUserId!);
      const members = humanChatService.getTeamMembers();
      setRealTeamMembers(members);
      console.log('✅ [GuestSelector] Loaded', members.length, 'real team members');
    } catch (error) {
      console.error('❌ [GuestSelector] Error loading team members:', error);
      setError('Failed to load team members');
    }
  };

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

  // Debug logging
  console.log('🔍 [GuestSelectorPopup] teamMembers prop:', teamMembers);
  console.log('🔍 [GuestSelectorPopup] teamMembers length:', teamMembers?.length || 0);
  console.log('🔍 [GuestSelectorPopup] aiAgents prop:', aiAgents);
  console.log('🔍 [GuestSelectorPopup] aiAgents length:', aiAgents?.length || 0);
  console.log('🔍 [GuestSelectorPopup] currentParticipants:', currentParticipants);
  console.log('🔍 [GuestSelectorPopup] searchQuery:', searchQuery);
  console.log('🔍 [GuestSelectorPopup] filteredHumans:', filteredHumans);
  console.log('🔍 [GuestSelectorPopup] filteredHumans length:', filteredHumans.length);
  console.log('🔍 [GuestSelectorPopup] filteredAIAgents:', filteredAIAgents);
  console.log('🔍 [GuestSelectorPopup] filteredAIAgents length:', filteredAIAgents.length);
  
  // Debug each team member filtering
  if (teamMembers && teamMembers.length > 0) {
    console.log('🔍 [GuestSelectorPopup] Debugging team member filtering:');
    teamMembers.forEach((member, index) => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           member.role?.toLowerCase().includes(searchQuery.toLowerCase());
      const notCurrentParticipant = !currentParticipants.includes(member.id);
      console.log(`  Member ${index}: ${member.name} (${member.id})`);
      console.log(`    - matchesSearch: ${matchesSearch}`);
      console.log(`    - notCurrentParticipant: ${notCurrentParticipant}`);
      console.log(`    - included in filtered: ${matchesSearch && notCurrentParticipant}`);
    });
  }

  const handleToggleSelection = (memberId: string) => {
    const newSelection = new Set(selectedGuests);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedGuests(newSelection);
  };

  const handleAddSelected = async () => {
    const allMembers = [...teamMembers, ...aiAgents];
    const selectedMembers = allMembers.filter(member => selectedGuests.has(member.id));
    
    // Separate humans and AI agents
    const selectedHumans = selectedMembers.filter(member => member.type === 'human');
    const selectedAIAgents = selectedMembers.filter(member => member.type === 'ai_agent');
    
    if (selectedAIAgents.length > 0) {
      // If AI agents are selected, show configuration popup
      setSelectedAIAgents(selectedAIAgents);
      setShowConfigPopup(true);
    } else if (selectedHumans.length > 0) {
      // Show invitation dialog for humans
      setSelectedHumansForInvitation(selectedHumans);
      setShowInvitationDialog(true);
    } else {
      // No selections, just close
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

  const handleSendInvitations = async () => {
    if (!currentUserId || !currentUserName) {
      console.error('❌ Missing user information for sending invitations');
      return;
    }

    try {
      console.log('🤖 [GuestSelectorPopup] Sending collaboration invitations via unified system');
      
      for (const human of selectedHumansForInvitation) {
        await sendInteraction('collaboration_invitation', human.id, {
          conversationId: conversationId || `conv_${Date.now()}`,
          conversationName: conversationName || 'AI Collaboration',
          agentName: agentName,
          message: `Join me in an AI collaboration session with ${agentName || 'AI Assistant'}`,
          sessionType: 'ai_collaboration',
          priority: 'medium'
        });
      }
      
      console.log(`✅ Sent AI collaboration invitations to ${selectedHumansForInvitation.length} humans`);
      
      // Add humans to conversation (they'll appear as pending)
      if (onAddHumans) {
        onAddHumans(selectedHumansForInvitation);
      }
      onAddGuests(selectedHumansForInvitation);
      
      // Close all dialogs
      setShowInvitationDialog(false);
      onClose();
      
    } catch (error) {
      console.error('❌ Failed to send collaboration invitations:', error);
    }
  };

  // New handler functions for unified functionality
  const ensureChatSession = async () => {
    if (chatSession?.id) {
      return chatSession;
    }
    
    // Create new session if none exists
    const { ChatHistoryService } = await import('../services/ChatHistoryService');
    const chatHistoryService = ChatHistoryService.getInstance();
    
    const newSession = await chatHistoryService.createChatSession(
      currentUserId!,
      agentId!,
      `Chat with ${agentName}`,
      agentName || 'AI Assistant'
    );
    
    return {
      id: newSession.id,
      name: newSession.name,
      messageCount: 0
    };
  };

  const toggleTeamMemberSelection = (memberId: string) => {
    setSelectedTeamMembers(prev => {
      const member = realTeamMembers.find(m => m.id === memberId);
      if (!member) return prev;
      
      const isSelected = prev.some(selected => selected.id === memberId);
      if (isSelected) {
        return prev.filter(selected => selected.id !== memberId);
      } else {
        return [...prev, member];
      }
    });
  };

  const handleSendTeamInvitations = async () => {
    if (selectedTeamMembers.length === 0) {
      setError('Please select at least one team member to invite');
      return;
    }

    if (!currentUserId) {
      setError('Missing user information');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📨 [GuestSelector] Sending team invitations to:', selectedTeamMembers);
      
      const session = await ensureChatSession();
      
      for (const member of selectedTeamMembers) {
        // Use the correct method name and parameters
        const result = await aiCollaborationInvitationService.sendCollaborationInvitation({
          fromUserId: currentUserId,
          fromUserName: currentUserName || user?.displayName || user?.email || 'User',
          toUserId: member.id,
          toUserName: member.name,
          conversationId: session.id,
          conversationName: session.name,
          agentName: agentName || 'AI Assistant',
          message: personalMessage || `Join me in my chat "${session.name}" with ${agentName || 'AI Assistant'}`
        });

        if (!result.success) {
          console.error('❌ [GuestSelector] Failed to send invitation to:', member.name, result.error);
        } else {
          console.log('✅ [GuestSelector] Invitation sent to:', member.name);
        }
      }
      
      console.log('✅ [GuestSelector] Team invitations sent successfully');
      onClose();
    } catch (error) {
      console.error('❌ [GuestSelector] Failed to send team invitations:', error);
      setError('Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailInvitation = async () => {
    if (!emailAddress.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!currentUserId) {
      setError('Missing user information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📧 [GuestSelector] Sending email invitation to:', emailAddress);
      
      const session = await ensureChatSession();
      
      await aiCollaborationInvitationService.createInvitation({
        fromUserId: currentUserId,
        fromUserName: currentUserName || user?.displayName || user?.email || 'User',
        toEmail: emailAddress,
        conversationId: session.id,
        conversationName: session.name,
        agentName: agentName || 'AI Assistant',
        message: personalMessage || `Join me in my chat "${session.name}" with ${agentName || 'AI Assistant'}`,
        includeHistory: true
      });
      
      console.log('✅ [GuestSelector] Email invitation sent successfully');
      onClose();
    } catch (error) {
      console.error('❌ [GuestSelector] Failed to send email invitation:', error);
      setError('Failed to send email invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
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
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AddIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" fontWeight="600">
            Add to Conversation
          </Typography>
        </Box>
        
        {/* Tabbed Interface */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
            '& .MuiTab-root': { 
              color: '#64748b',
              '&.Mui-selected': { color: '#3b82f6' }
            }
          }}
        >
          <Tab 
            icon={<AIIcon />} 
            label="AI Agents" 
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<PeopleIcon />} 
            label="Team Members" 
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<EmailIcon />} 
            label="Email Invitation" 
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tab Panel 0: AI Agents (Existing functionality) */}
        {tabValue === 0 && (
          <>
            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search AI agents..."
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
          </>
        )}

        {/* Tab Panel 1: Team Members */}
        {tabValue === 1 && (
          <>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Select team members to invite to this conversation:
            </Typography>
          </>
        )}

        {/* Tab Panel 2: Email Invitation */}
        {tabValue === 2 && (
          <>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Invite someone by email to join this conversation:
            </Typography>
            
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              placeholder="colleague@company.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#0f172a',
                  color: '#e2e8f0',
                  '& fieldset': { borderColor: '#334155' },
                  '&:hover fieldset': { borderColor: '#3b82f6' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                },
                '& .MuiInputLabel-root': { color: '#94a3b8' }
              }}
            />
            
            <TextField
              fullWidth
              label="Personal Message (Optional)"
              variant="outlined"
              multiline
              rows={3}
              placeholder="Add a personal message to your invitation..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#0f172a',
                  color: '#e2e8f0',
                  '& fieldset': { borderColor: '#334155' },
                  '&:hover fieldset': { borderColor: '#3b82f6' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                },
                '& .MuiInputLabel-root': { color: '#94a3b8' }
              }}
            />
          </>
        )}

        {/* Tab Panel 0: AI Agents Content */}
        {tabValue === 0 && (
          <>
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

            {/* No Results or Loading for AI Agents */}
            {filteredAIAgents.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="#64748b">
                  {searchQuery ? 'No AI agents found matching your search.' : 'All AI agents are already in this conversation.'}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Tab Panel 1: Team Members Content */}
        {tabValue === 1 && (
          <>
            {realTeamMembers.length > 0 ? (
              <List sx={{ p: 0 }}>
                {realTeamMembers.map((member) => {
                  const isSelected = selectedTeamMembers.some(selected => selected.id === member.id);
                  return (
                    <ListItem key={member.id} disablePadding>
                      <ListItemButton
                        onClick={() => toggleTeamMemberSelection(member.id)}
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
                          <Avatar
                            src={member.profilePhoto}
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: '#3b82f6',
                              color: 'white',
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <Typography variant="body1" color="white" fontWeight="500">
                              {member.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="#94a3b8">
                              {member.role || 'Team Member'}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="#64748b">
                  No team members available to invite.
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Tab Panel 2: Email Invitation Content */}
        {tabValue === 2 && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="#94a3b8" sx={{ mb: 2 }}>
                Invite external users to join this chat session via email.
              </Typography>
              
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Enter email address"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0f172a',
                    color: 'white',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#475569' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#94a3b8' }
                }}
              />
              
              <TextField
                fullWidth
                label="Personal Message (Optional)"
                multiline
                rows={3}
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Add a personal message to the invitation..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0f172a',
                    color: 'white',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#475569' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#94a3b8' }
                }}
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          sx={{ color: '#94a3b8' }}
        >
          Cancel
        </Button>
        
        {/* AI Agents Tab Actions */}
        {tabValue === 0 && (
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
            Add {selectedGuests.size > 0 ? `${selectedGuests.size} ` : ''}Agent{selectedGuests.size !== 1 ? 's' : ''}
          </Button>
        )}
        
        {/* Team Members Tab Actions */}
        {tabValue === 1 && (
          <Button
            onClick={handleSendTeamInvitations}
            disabled={selectedTeamMembers.length === 0 || loading}
            variant="contained"
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              '&:disabled': { backgroundColor: '#374151', color: '#6b7280' }
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Sending...
              </>
            ) : (
              `Send Invitation${selectedTeamMembers.length !== 1 ? 's' : ''} (${selectedTeamMembers.length})`
            )}
          </Button>
        )}
        
        {/* Email Invitation Tab Actions */}
        {tabValue === 2 && (
          <Button
            onClick={handleSendEmailInvitation}
            disabled={!emailAddress.trim() || loading}
            variant="contained"
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              '&:disabled': { backgroundColor: '#374151', color: '#6b7280' }
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </Button>
        )}
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

    {/* Human Invitation Dialog */}
    <Dialog
      open={showInvitationDialog}
      onClose={() => setShowInvitationDialog(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" fontWeight="600">
            Send Chat Invitation?
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body1" color="white" mb={2}>
          You're about to invite {selectedHumansForInvitation.length} team member{selectedHumansForInvitation.length !== 1 ? 's' : ''} to join this conversation:
        </Typography>
        
        {selectedHumansForInvitation.map((human) => (
          <Box key={human.id} display="flex" alignItems="center" gap={2} mb={1}>
            <Avatar
              src={human.avatar || human.profilePhoto}
              sx={{
                bgcolor: '#3b82f6',
                width: 32,
                height: 32,
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              {human.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body1" color="white" fontWeight="500">
                {human.name}
              </Typography>
              <Typography variant="caption" color="#94a3b8">
                {human.role || 'Team Member'}
              </Typography>
            </Box>
          </Box>
        ))}

        <Typography variant="body2" color="#94a3b8" mt={2}>
          They will receive a notification and can choose to accept or decline the invitation.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={() => setShowInvitationDialog(false)}
          sx={{ color: '#94a3b8' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSendInvitations}
          variant="contained"
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' }
          }}
        >
          Send Invitation{selectedHumansForInvitation.length !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default GuestSelectorPopup;

