import React, { useState, useEffect, useMemo } from 'react';
import { Box, Chip, Avatar, AvatarGroup, Tooltip, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { MoreHoriz, Chat, Close, People } from '@mui/icons-material';
import { SharedConversation } from '../../services/SharedConversationService';
import { UserProfileService, UserProfile } from '../../services/UserProfileService';

interface CompactSharedChatTabsProps {
  sharedConversations: SharedConversation[];
  activeConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onConversationClose: (conversationId: string) => void;
  onPrivacyToggle: (conversationId: string) => void;
  currentUserId: string;
  maxVisibleTabs?: number;
}

// Color palette for shared chats
const CHAT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
];

const CompactSharedChatTabs: React.FC<CompactSharedChatTabsProps> = ({
  sharedConversations,
  activeConversationId,
  onConversationSelect,
  onConversationClose,
  maxVisibleTabs = 2
}) => {
  const [overflowMenuAnchor, setOverflowMenuAnchor] = useState<null | HTMLElement>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [userProfileService] = useState(() => new UserProfileService());

  // Memoize participant IDs to prevent unnecessary re-fetching
  const allParticipantIds = useMemo(() => {
    const participantIds = new Set<string>();
    sharedConversations.forEach(conversation => {
      conversation.participants?.forEach(participant => {
        if (participant.type === 'human') {
          participantIds.add(participant.id);
        }
      });
    });
    return Array.from(participantIds);
  }, [sharedConversations]);

  // Fetch user profiles for all participants
  useEffect(() => {
    const fetchUserProfiles = async () => {
      // Only fetch profiles we don't already have
      const profilesToFetch = allParticipantIds.filter(id => !userProfiles[id]);
      
      if (profilesToFetch.length === 0) {
        return; // No new profiles to fetch
      }

      console.log(`🔄 Fetching ${profilesToFetch.length} new user profiles...`);
      
      const newProfiles: Record<string, UserProfile> = {};
      for (const participantId of profilesToFetch) {
        try {
          const profile = await userProfileService.getUserProfile(participantId);
          if (profile) {
            newProfiles[participantId] = profile;
          }
        } catch (error) {
          console.error(`Failed to fetch profile for user ${participantId}:`, error);
        }
      }
      
      // Only update state if we have new profiles
      if (Object.keys(newProfiles).length > 0) {
        setUserProfiles(prev => ({ ...prev, ...newProfiles }));
      }
    };

    if (allParticipantIds.length > 0) {
      fetchUserProfiles();
    }
  }, [allParticipantIds, userProfiles, userProfileService]);

  if (sharedConversations.length === 0) {
    return null;
  }

  const visibleConversations = sharedConversations.slice(0, maxVisibleTabs);
  const hiddenConversations = sharedConversations.slice(maxVisibleTabs);

  const getConversationColor = (index: number) => {
    return CHAT_COLORS[index % CHAT_COLORS.length];
  };

  const getParticipantDisplayName = (participant: any) => {
    if (participant.type === 'ai') {
      return participant.name;
    }
    
    // For human participants, try to get real name from profile
    const profile = userProfiles[participant.id];
    return profile?.name || participant.name || 'User';
  };

  const getParticipantAvatar = (participant: any) => {
    if (participant.type === 'ai') {
      return null; // Will use emoji
    }
    
    // For human participants, try to get real avatar from profile
    const profile = userProfiles[participant.id];
    return profile?.avatar || null;
  };

  const getHumanName = (conversation: SharedConversation) => {
    // Extract human participant name (excluding current user)
    const humanParticipant = conversation.participants?.find(p => 
      p.type === 'human' && p.id !== conversation.hostUserId
    );
    
    if (humanParticipant) {
      return getParticipantDisplayName(humanParticipant);
    }
    
    return 'Guest';
  };

  const getParticipantCount = (conversation: SharedConversation) => {
    return conversation.participants?.length || 0;
  };

  const getMessageCount = (conversation: SharedConversation) => {
    return conversation.messageCount || 0;
  };

  const renderTooltipContent = (conversation: SharedConversation) => (
    <Box sx={{ p: 1, maxWidth: 300 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {conversation.name || 'Shared Chat'}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <People sx={{ fontSize: 16 }} />
        <Typography variant="body2">
          {getParticipantCount(conversation)} participants
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chat sx={{ fontSize: 16 }} />
        <Typography variant="body2">
          {getMessageCount(conversation)} messages
        </Typography>
      </Box>

      {conversation.participants && conversation.participants.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#9ca3af', mb: 0.5, display: 'block' }}>
            Participants:
          </Typography>
          {conversation.participants.map((participant, index) => {
            const displayName = getParticipantDisplayName(participant);
            const avatarSrc = getParticipantAvatar(participant);
            
            return (
              <Box key={participant.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Avatar 
                  src={avatarSrc || undefined}
                  sx={{ width: 16, height: 16, fontSize: '0.7rem' }}
                >
                  {participant.type === 'ai' ? '🤖' : displayName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="caption">
                  {displayName} {participant.type === 'ai' ? '(AI)' : ''}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );

  const handleOverflowMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOverflowMenuAnchor(event.currentTarget);
  };

  const handleOverflowMenuClose = () => {
    setOverflowMenuAnchor(null);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
      {visibleConversations.map((conversation, index) => {
        const color = getConversationColor(index);
        const humanName = getHumanName(conversation);
        const isActive = conversation.id === activeConversationId;
        
        return (
          <Tooltip
            key={conversation.id}
            title={renderTooltipContent(conversation)}
            placement="bottom"
            arrow
          >
            <Box
              onClick={() => onConversationSelect(conversation.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: isActive ? color : '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: `1px solid ${color}`,
                '&:hover': {
                  bgcolor: isActive ? color : `${color}40`,
                }
              }}
            >
              {/* Avatar Group - Show up to 3 overlapping avatars */}
              <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                {conversation.participants?.slice(0, 3).map((participant, pIndex) => {
                  const displayName = getParticipantDisplayName(participant);
                  const avatarSrc = getParticipantAvatar(participant);
                  
                  return (
                    <Avatar
                      key={participant.id}
                      src={avatarSrc || undefined}
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: '0.6rem',
                        bgcolor: participant.type === 'ai' ? '#6366f1' : '#10b981',
                        border: '2px solid #1e293b',
                        ml: pIndex > 0 ? -0.75 : 0,
                        zIndex: 3 - pIndex
                      }}
                    >
                      {participant.type === 'ai' ? '🤖' : displayName.charAt(0).toUpperCase()}
                    </Avatar>
                  );
                })}
                
                {/* Show +X count if more than 3 participants */}
                {getParticipantCount(conversation) > 3 && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: isActive ? 'white' : '#94a3b8', 
                      ml: 1, 
                      fontSize: '0.7rem',
                      fontWeight: 500
                    }}
                  >
                    +{getParticipantCount(conversation) - 3}
                  </Typography>
                )}
              </Box>
              
              {/* Close Button */}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onConversationClose(conversation.id);
                }}
                sx={{
                  width: 16,
                  height: 16,
                  color: isActive ? 'rgba(255,255,255,0.8)' : '#94a3b8',
                  ml: 0.5,
                  '&:hover': {
                    color: 'white',
                    bgcolor: '#ef4444'
                  }
                }}
              >
                <Close sx={{ fontSize: 10 }} />
              </IconButton>
            </Box>
          </Tooltip>
        );
      })}

      {/* Overflow menu for hidden conversations */}
      {hiddenConversations.length > 0 && (
        <>
          <IconButton
            size="small"
            onClick={handleOverflowMenuOpen}
            sx={{
              color: '#64748b',
              bgcolor: '#334155',
              width: 28,
              height: 28,
              '&:hover': { bgcolor: '#475569' }
            }}
          >
            <MoreHoriz sx={{ fontSize: 16 }} />
          </IconButton>
          
          <Menu
            anchorEl={overflowMenuAnchor}
            open={Boolean(overflowMenuAnchor)}
            onClose={handleOverflowMenuClose}
            PaperProps={{
              sx: {
                bgcolor: '#1e293b',
                border: '1px solid #334155',
                '& .MuiMenuItem-root': {
                  color: '#e2e8f0',
                  '&:hover': { bgcolor: '#334155' }
                }
              }
            }}
          >
            {hiddenConversations.map((conversation, index) => {
              const color = getConversationColor(maxVisibleTabs + index);
              
              return (
                <MenuItem
                  key={conversation.id}
                  onClick={() => {
                    onConversationSelect(conversation.id);
                    handleOverflowMenuClose();
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minWidth: 200
                  }}
                >
                  {/* Avatar Group for overflow menu */}
                  <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    {conversation.participants?.slice(0, 3).map((participant, pIndex) => {
                      const displayName = getParticipantDisplayName(participant);
                      const avatarSrc = getParticipantAvatar(participant);
                      
                      return (
                        <Avatar
                          key={participant.id}
                          src={avatarSrc || undefined}
                          sx={{
                            width: 20,
                            height: 20,
                            fontSize: '0.6rem',
                            bgcolor: participant.type === 'ai' ? '#6366f1' : '#10b981',
                            border: '1px solid #1e293b',
                            ml: pIndex > 0 ? -0.5 : 0,
                            zIndex: 3 - pIndex
                          }}
                        >
                          {participant.type === 'ai' ? '🤖' : displayName.charAt(0).toUpperCase()}
                        </Avatar>
                      );
                    })}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Shared Chat
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {getParticipantCount(conversation)} participants • {getMessageCount(conversation)} messages
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConversationClose(conversation.id);
                    }}
                    sx={{ color: '#9ca3af', '&:hover': { color: '#ef4444' } }}
                  >
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}
    </Box>
  );
};

export default CompactSharedChatTabs;

