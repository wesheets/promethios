/**
 * CollaborationManagementPanel - Advanced interface for managing multi-human multi-AI collaborations
 * Provides participant management, AI orchestration, governance controls, and collaboration analytics
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  AvatarGroup,
  Chip,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Grid,
  LinearProgress,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Badge
} from '@mui/material';
import {
  Group as GroupIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  Crown as CreatorIcon,
  AdminPanelSettings as AdminIcon,
  PersonOutline as MemberIcon,
  Visibility as ObserverIcon,
  Online as OnlineIcon,
  Offline as OfflineIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Psychology as BehaviorIcon
} from '@mui/icons-material';
import MultiHumanCollaborationService, { 
  CollaborationSession, 
  CollaborationParticipant, 
  AIAgentCollaboration 
} from '../../services/MultiHumanCollaborationService';

export interface CollaborationManagementPanelProps {
  sessionId: string;
  currentUserId: string;
  onClose: () => void;
}

export const CollaborationManagementPanel: React.FC<CollaborationManagementPanelProps> = ({
  sessionId,
  currentUserId,
  onClose
}) => {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Participants, 1: AI Agents, 2: Governance, 3: Analytics
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; participantId: string } | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showGovernanceDialog, setShowGovernanceDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaborationParticipant['role']>('member');
  const [aiCollaborations, setAiCollaborations] = useState<AIAgentCollaboration[]>([]);

  const collaborationService = MultiHumanCollaborationService.getInstance();

  // Load collaboration session
  useEffect(() => {
    const loadSession = () => {
      const sessionData = collaborationService.getCollaborationSession(sessionId);
      if (sessionData) {
        setSession(sessionData);
        const aiData = collaborationService.getAICollaborations(sessionId);
        setAiCollaborations(aiData);
      }
    };

    loadSession();
    const interval = setInterval(loadSession, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [sessionId]);

  const currentParticipant = session?.participants.find(p => p.id === currentUserId);
  const canManageParticipants = currentParticipant?.permissions.canRemoveParticipants || false;
  const canInviteHumans = currentParticipant?.permissions.canInviteHumans || false;
  const canManageGovernance = currentParticipant?.permissions.canManageGovernance || false;

  const handleInviteHuman = async () => {
    if (!session || !inviteEmail || !inviteName) return;

    try {
      await collaborationService.inviteHumanToCollaboration(
        sessionId,
        currentUserId,
        inviteEmail,
        inviteName,
        inviteRole,
        `You've been invited to collaborate in "${session.name}"`
      );
      
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('member');
      
      // Refresh session data
      const updatedSession = collaborationService.getCollaborationSession(sessionId);
      if (updatedSession) setSession(updatedSession);
    } catch (error) {
      console.error('Failed to invite human:', error);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!session) return;

    try {
      await collaborationService.removeParticipantFromCollaboration(
        sessionId,
        currentUserId,
        participantId
      );
      
      // Refresh session data
      const updatedSession = collaborationService.getCollaborationSession(sessionId);
      if (updatedSession) setSession(updatedSession);
      
      setMenuAnchor(null);
    } catch (error) {
      console.error('Failed to remove participant:', error);
    }
  };

  const getRoleIcon = (role: CollaborationParticipant['role']) => {
    switch (role) {
      case 'creator': return <CreatorIcon sx={{ color: '#f59e0b', fontSize: 16 }} />;
      case 'admin': return <AdminIcon sx={{ color: '#3b82f6', fontSize: 16 }} />;
      case 'member': return <MemberIcon sx={{ color: '#10b981', fontSize: 16 }} />;
      case 'observer': return <ObserverIcon sx={{ color: '#6b7280', fontSize: 16 }} />;
    }
  };

  const getRoleColor = (role: CollaborationParticipant['role']) => {
    switch (role) {
      case 'creator': return '#f59e0b';
      case 'admin': return '#3b82f6';
      case 'member': return '#10b981';
      case 'observer': return '#6b7280';
    }
  };

  const formatCollaborationScore = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: '#10b981' };
    if (score >= 70) return { label: 'Good', color: '#3b82f6' };
    if (score >= 50) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Needs Improvement', color: '#ef4444' };
  };

  if (!session) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          Loading collaboration session...
        </Typography>
      </Box>
    );
  }

  const scoreInfo = formatCollaborationScore(session.collaborationMetrics.collaborationScore);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#8b5cf6', width: 48, height: 48 }}>
              <GroupIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {session.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                {session.description || 'Multi-human AI collaboration'}
              </Typography>
            </Box>
          </Box>
          <Button onClick={onClose} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                  {session.participants.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Humans
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                  {session.activeAIAgents}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  AI Agents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 600 }}>
                  {session.collaborationMetrics.totalMessages}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Messages
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: scoreInfo.color, fontWeight: 600 }}>
                  {session.collaborationMetrics.collaborationScore}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #334155' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: '#94a3b8',
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': { color: '#3b82f6' }
            },
            '& .MuiTabs-indicator': { bgcolor: '#3b82f6' }
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: 16 }} />
                Participants
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AIIcon sx={{ fontSize: 16 }} />
                AI Agents
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon sx={{ fontSize: 16 }} />
                Governance
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon sx={{ fontSize: 16 }} />
                Analytics
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Participants Tab */}
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                Human Participants ({session.participants.length})
              </Typography>
              {canInviteHumans && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setShowInviteDialog(true)}
                  variant="contained"
                  size="small"
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Invite Human
                </Button>
              )}
            </Box>

            <List sx={{ py: 0 }}>
              {session.participants.map((participant) => (
                <ListItem
                  key={participant.id}
                  sx={{
                    bgcolor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={participant.isOnline ? <OnlineIcon sx={{ fontSize: 12 }} /> : <OfflineIcon sx={{ fontSize: 12 }} />}
                      color={participant.isOnline ? 'success' : 'default'}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar sx={{ bgcolor: getRoleColor(participant.role) }}>
                        <PersonIcon />
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                          {participant.name}
                        </Typography>
                        {getRoleIcon(participant.role)}
                        <Chip
                          label={participant.role}
                          size="small"
                          sx={{
                            bgcolor: `${getRoleColor(participant.role)}20`,
                            color: getRoleColor(participant.role),
                            height: 20,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {participant.email} • {participant.aiAgents.length} AI agents
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                          Joined {participant.joinedAt.toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />

                  {canManageParticipants && participant.id !== currentUserId && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => setMenuAnchor({ element: e.currentTarget, participantId: participant.id })}
                        sx={{ color: '#94a3b8' }}
                      >
                        <MoreIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* AI Agents Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              AI Agents ({session.activeAIAgents} active)
            </Typography>

            {aiCollaborations.map((aiCollab) => {
              const owner = session.participants.find(p => p.id === aiCollab.ownerId);
              const agent = owner?.aiAgents.find(a => a.id === aiCollab.agentId);
              
              if (!owner || !agent) return null;

              return (
                <Card key={aiCollab.agentId} sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 2 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#8b5cf6' }}>
                        <AIIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                          {agent.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Owned by {owner.name} • {agent.type}
                        </Typography>
                      </Box>
                      <Chip
                        label={agent.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          bgcolor: agent.isActive ? '#10b98120' : '#6b728020',
                          color: agent.isActive ? '#10b981' : '#6b7280'
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<BehaviorIcon sx={{ fontSize: 12 }} />}
                        label={aiCollab.behavioralSettings.responseStyle}
                        size="small"
                        sx={{ bgcolor: '#334155', color: '#94a3b8' }}
                      />
                      <Chip
                        label={aiCollab.behavioralSettings.collaborationMode}
                        size="small"
                        sx={{ bgcolor: '#334155', color: '#94a3b8' }}
                      />
                      <Chip
                        label={`${aiCollab.behavioralSettings.interactionLevel} interaction`}
                        size="small"
                        sx={{ bgcolor: '#334155', color: '#94a3b8' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Governance Tab */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                Governance Settings
              </Typography>
              {canManageGovernance && (
                <Button
                  startIcon={<SettingsIcon />}
                  onClick={() => setShowGovernanceDialog(true)}
                  variant="outlined"
                  size="small"
                  sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                >
                  Update Settings
                </Button>
              )}
            </Box>

            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <CardContent>
                <List sx={{ py: 0 }}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="AI Agent Approval Required"
                      secondary="New AI agents need creator approval"
                    />
                    <Switch
                      checked={session.governanceSettings.requireApprovalForAI}
                      disabled={!canManageGovernance}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                    />
                  </ListItem>
                  <Divider sx={{ bgcolor: '#334155' }} />
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Private Segments Allowed"
                      secondary="Participants can have private conversations"
                    />
                    <Switch
                      checked={session.governanceSettings.allowPrivateSegments}
                      disabled={!canManageGovernance}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                    />
                  </ListItem>
                  <Divider sx={{ bgcolor: '#334155' }} />
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Behavioral Controls Enabled"
                      secondary="Advanced AI behavioral orchestration"
                    />
                    <Switch
                      checked={session.governanceSettings.enableBehavioralControls}
                      disabled={!canManageGovernance}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                    />
                  </ListItem>
                  <Divider sx={{ bgcolor: '#334155' }} />
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Consensus Required"
                      secondary="Major decisions require group consensus"
                    />
                    <Switch
                      checked={session.governanceSettings.consensusRequired}
                      disabled={!canManageGovernance}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Analytics Tab */}
        {activeTab === 3 && (
          <Box>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Collaboration Analytics
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingIcon sx={{ color: scoreInfo.color }} />
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          Collaboration Score: {session.collaborationMetrics.collaborationScore}
                        </Typography>
                        <Chip
                          label={scoreInfo.label}
                          size="small"
                          sx={{ bgcolor: `${scoreInfo.color}20`, color: scoreInfo.color }}
                        />
                      </Box>
                    }
                  />
                  <CardContent>
                    <LinearProgress
                      variant="determinate"
                      value={session.collaborationMetrics.collaborationScore}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#334155',
                        '& .MuiLinearProgress-bar': { bgcolor: scoreInfo.color }
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>
                      Message Distribution
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        Human: {session.collaborationMetrics.humanMessages}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8b5cf6' }}>
                        AI: {session.collaborationMetrics.aiMessages}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(session.collaborationMetrics.humanMessages / session.collaborationMetrics.totalMessages) * 100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#8b5cf620',
                        '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' }
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>
                      Governance Activity
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#10b981', mb: 1 }}>
                      {session.collaborationMetrics.governanceEvents}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      governance events
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      {/* Participant Context Menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{
          sx: { bgcolor: '#1e293b', color: 'white', border: '1px solid #334155' }
        }}
      >
        <MenuItem onClick={() => menuAnchor && handleRemoveParticipant(menuAnchor.participantId)}>
          <RemoveIcon sx={{ mr: 1, fontSize: 16 }} />
          Remove from Collaboration
        </MenuItem>
      </Menu>

      {/* Invite Human Dialog */}
      <Dialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', border: '1px solid #334155' } }}
      >
        <DialogTitle>Invite Human to Collaboration</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as CollaborationParticipant['role'])}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="observer">Observer</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInviteDialog(false)}>Cancel</Button>
          <Button onClick={handleInviteHuman} variant="contained">Send Invitation</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CollaborationManagementPanel;

