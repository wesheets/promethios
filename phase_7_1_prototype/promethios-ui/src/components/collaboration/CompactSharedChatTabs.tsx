import React from 'react';
import { Box, Chip } from '@mui/material';
import { SharedConversation } from './SharedChatTabs';

interface CompactSharedChatTabsProps {
  sharedConversations: SharedConversation[];
  activeConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onConversationClose: (conversationId: string) => void;
  onPrivacyToggle: (conversationId: string) => void;
  currentUserId: string;
  maxVisibleTabs?: number;
}

const CompactSharedChatTabs: React.FC<CompactSharedChatTabsProps> = ({
  sharedConversations,
  activeConversationId,
  onConversationSelect,
  onConversationClose,
  maxVisibleTabs = 2
}) => {
  if (sharedConversations.length === 0) {
    return null;
  }

  const visibleConversations = sharedConversations.slice(0, maxVisibleTabs);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
      {visibleConversations.map(conversation => (
        <Chip
          key={conversation.id}
          label="Shared Chat"
          size="small"
          onClick={() => onConversationSelect(conversation.id)}
          onDelete={() => onConversationClose(conversation.id)}
          sx={{
            maxWidth: 120,
            bgcolor: conversation.id === activeConversationId ? '#3b82f6' : 'transparent',
            color: conversation.id === activeConversationId ? 'white' : '#e2e8f0',
            borderColor: '#3b82f6',
            mr: 1
          }}
        />
      ))}
    </Box>
  );
};

export default CompactSharedChatTabs;

