/**
 * ChatInvitationModal - Hybrid invitation modal for chat sessions
 * 
 * Provides both team member selection (for connected users) and email invitation
 * (for external users) with chat-specific context
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Badge,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  People,
  Email,
  Chat,
  PersonAdd,
  Circle
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import HumanChatService, { TeamMember } from '../../services/HumanChatService';
import chatInvitationService from '../../services/ChatInvitationService';

interface ChatInvitationModalProps {
  open: boolean;
  onClose: () => void;
  chatSession?: {
    id: string;
    name: string;
    messageCount?: number;
  } | null;
  agentId?: string;
  agentName?: string;
  user?: any; // Firebase user object
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invitation-tabpanel-${index}`}
      aria-labelledby={`invitation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ChatInvitationModal: React.FC<ChatInvitationModalProps> = ({
  open,
  onClose,
  chatSession,
  agentId,
  agentName,
  user
}) => {
  console.log('🔍 [ChatInvitation] Component render - open:', open, 'chatSession:', chatSession);
  console.log('🔍 [ChatInvitation] Component render - user from prop:', user?.uid);
  
  // Fallback to useAuth if user prop is not provided
  const { user: authUser } = useAuth();
  const effectiveUser = user || authUser;
  console.log('🔍 [ChatInvitation] Component render - effective user:', effectiveUser?.uid);
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>([]);
  const [emailInvites, setEmailInvites] = useState<string[]>(['']);
  const [emailAddress, setEmailAddress] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const humanChatService = HumanChatService.getInstance();

  // Load team members when modal opens
  useEffect(() => {
    console.log('🔍 [ChatInvitation] useEffect triggered - open:', open, 'effectiveUser?.uid:', effectiveUser?.uid);
    if (open && effectiveUser?.uid) {
      console.log('🔍 [ChatInvitation] Modal opened, calling loadTeamMembers...');
      loadTeamMembers();
    } else {
      console.log('🔍 [ChatInvitation] Modal not opened or no user - open:', open, 'effectiveUser?.uid:', effectiveUser?.uid);
    }
  }, [open, effectiveUser?.uid]);

  const loadTeamMembers = async () => {
    try {
      console.log('🔍 [ChatInvitation] Starting to load team members...');
      console.log('🔍 [ChatInvitation] Current effectiveUser:', effectiveUser?.uid);
      
      // Initialize the service with current user if not already initialized
      if (effectiveUser?.uid) {
        console.log('🔍 [ChatInvitation] Initializing HumanChatService with user:', effectiveUser.uid);
        await humanChatService.initialize(effectiveUser.uid);
        console.log('✅ [ChatInvitation] HumanChatService initialized');
        
        // Add a small delay to ensure connections are fully loaded
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log('❌ [ChatInvitation] No user available for initialization');
        setError('User not authenticated');
        return;
      }
      
      console.log('🔍 [ChatInvitation] Getting team members from service...');
      let members = humanChatService.getTeamMembers();
      console.log('🔍 [ChatInvitation] Retrieved team members:', members);
      console.log('🔍 [ChatInvitation] Team members count:', members.length);
      
      // If no members found, try reinitializing once more
      if (members.length === 0) {
        console.log('⚠️ [ChatInvitation] No team members found, trying to reinitialize...');
        await humanChatService.initialize(effectiveUser!.uid);
        await new Promise(resolve => setTimeout(resolve, 1000));
        members = humanChatService.getTeamMembers();
        console.log('🔍 [ChatInvitation] After reinitialize - team members count:', members.length);
      }
      
      setTeamMembers(members);
      
      if (members.length === 0) {
        console.log('⚠️ [ChatInvitation] Still no team members found after retry');
      } else {
        console.log('✅ [ChatInvitation] Successfully loaded', members.length, 'team members');
      }
    } catch (error) {
      console.error('❌ [ChatInvitation] Error loading team members:', error);
      setError('Failed to load team members');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSendTeamInvitations = async () => {
    if (selectedTeamMembers.length === 0) {
      setError('Please select at least one team member to invite');
      return;
    }

    if (!chatSession?.id || !user?.uid) {
      setError('Missing chat session or user information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const invitationPromises = selectedTeamMembers.map(async (member) => {
        return await chatInvitationService.createChatInvitation({
          fromUserId: user.uid,
          fromUserName: user.displayName || user.email || 'Unknown User',
          toUserId: member.id,
          toUserName: member.name,
          toEmail: member.email,
          chatSessionId: chatSession.id,
          conversationName: chatSession.name,
          agentId: agentId || '',
          agentName: agentName || 'AI Assistant',
          personalMessage: personalMessage.trim() || undefined,
          invitationType: 'team_member'
        });
      });

      const results = await Promise.all(invitationPromises);
      const successCount = results.filter(r => r !== null).length;

      setSuccess(`Successfully sent ${successCount} invitation${successCount > 1 ? 's' : ''} to team members`);
      setSelectedMembers([]);
      setPersonalMessage('');
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);

    } catch (error) {
      console.error('❌ [ChatInvitation] Error sending team invitations:', error);
      setError('Failed to send invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailInvitation = async () => {
    if (!emailAddress.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!chatSession?.id || !user?.uid) {
      setError('Missing chat session or user information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await chatInvitationService.createChatInvitation({
        fromUserId: user.uid,
        fromUserName: user.displayName || user.email || 'Unknown User',
        toEmail: emailAddress.trim(),
        chatSessionId: chatSession.id,
        conversationName: chatSession.name,
        agentId: agentId || '',
        agentName: agentName || 'AI Assistant',
        personalMessage: personalMessage.trim() || undefined,
        invitationType: 'email'
      });

      setSuccess(`Invitation sent to ${emailAddress}`);
      setEmailAddress('');
      setPersonalMessage('');
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);

    } catch (error) {
      console.error('❌ [ChatInvitation] Error sending email invitation:', error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setEmailAddress('');
    setPersonalMessage('');
    setError(null);
    setSuccess(null);
    setTabValue(0);
    onClose();
  };

  const chatName = chatSession?.name || 'this conversation';
  const messageCount = chatSession?.messageCount || 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { 
          bgcolor: '#1e293b', 
          color: 'white',
          minHeight: '500px'
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd />
          <Typography variant="h6">
            Invite to "{chatName}"
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 1 }}>
          Invite team members to join this chat session. They'll see the conversation history and 
          can participate in the discussion.
        </Typography>
        {messageCount > 0 && (
          <Chip 
            label={`${messageCount} message${messageCount > 1 ? 's' : ''}`}
            size="small"
            sx={{ mt: 1, bgcolor: '#3b82f6', color: 'white' }}
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: '#374151' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': { color: '#9ca3af' },
              '& .Mui-selected': { color: '#3b82f6' },
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
            }}
          >
            <Tab 
              icon={<People />} 
              label="Team Members" 
              sx={{ textTransform: 'none' }}
            />
            <Tab 
              icon={<Email />} 
              label="Email Invitation" 
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: '#dc2626', color: 'white' }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2, bgcolor: '#059669', color: 'white' }}>
              {success}
            </Alert>
          )}

          <TabPanel value={tabValue} index={0}>
            <Typography variant="subtitle2" sx={{ color: '#9ca3af', mb: 2 }}>
              Select team members to invite:
            </Typography>
            
            <Box sx={{ 
              maxHeight: 300, 
              overflowY: 'auto', 
              border: '1px solid #374151', 
              borderRadius: 1,
              mb: 2
            }}>
              {teamMembers.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    No team members found
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {teamMembers.map((member) => (
                    <ListItem
                      key={member.id}
                      button
                      onClick={() => toggleMemberSelection(member.id)}
                      sx={{
                        '&:hover': { bgcolor: '#374151' },
                        borderBottom: '1px solid #374151'
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedTeamMembers.some(selected => selected.id === member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeamMembers(prev => [...prev, member]);
                              } else {
                                setSelectedTeamMembers(prev => prev.filter(selected => selected.id !== member.id));
                              }
                            }}
                            sx={{ color: '#3b82f6' }}
                          />
                        }
                        label=""
                        sx={{ mr: 1 }}
                      />
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            member.isOnline ? (
                              <Circle sx={{ color: '#10b981', fontSize: 12 }} />
                            ) : null
                          }
                        >
                          <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                            {member.name.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {member.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                              {member.email}
                            </Typography>
                            {member.isOnline && (
                              <Chip 
                                label="Online" 
                                size="small" 
                                sx={{ 
                                  bgcolor: '#10b981', 
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  height: 16
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Personal Message (Optional)"
              placeholder="Add a personal message to your invitation..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: '#9ca3af' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' }
              }}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="subtitle2" sx={{ color: '#9ca3af', mb: 2 }}>
              Invite someone by email:
            </Typography>
            
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              placeholder="Enter email address..."
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: '#9ca3af' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' }
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Personal Message (Optional)"
              placeholder="Add a personal message to your invitation..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: '#9ca3af' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' }
              }}
            />
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleClose} 
          sx={{ color: '#9ca3af' }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={tabValue === 0 ? handleSendTeamInvitations : handleSendEmailInvitation}
          variant="contained"
          disabled={loading || (tabValue === 0 ? selectedTeamMembers.length === 0 : !emailAddress.trim())}
          sx={{ 
            bgcolor: '#3b82f6', 
            '&:hover': { bgcolor: '#2563eb' },
            minWidth: 120
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            `Send Invitation${tabValue === 0 && selectedTeamMembers.length > 1 ? 's' : ''}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatInvitationModal;

