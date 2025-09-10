/**
 * UnifiedChatInterface - Enhanced chat interface for unified collaboration
 * Maintains the familiar single-chat design while adding collaborative features
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Fade,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { AgentAvatarSelector, AgentInfo } from '../AgentAvatarSelector';
import { RealTimeStatusIndicator } from './RealTimeStatusIndicator';
import { useUnifiedParticipantsOptional } from '../../contexts/UnifiedParticipantContext';

export interface UnifiedChatInterfaceProps {
  // Standard chat props
  hostAgent: AgentInfo;
  guestAgents: AgentInfo[];
  selectedAgents: string[];
  onSelectionChange: (selectedAgentIds: string[]) => void;
  
  // Collaboration props
  isSharedMode?: boolean;
  hostUserName?: string;
  conversationId?: string;
  currentUserId?: string;
  currentUserName?: string;
  
  // UI customization
  showCollaborationIndicator?: boolean;
  showParticipantCount?: boolean;
  showRealTimeStatus?: boolean;
  
  // Callbacks
  onAddGuests?: (guests: any[]) => void;
  onAddAIAgent?: (agentConfig: any) => void;
  onRemoveParticipant?: (participantId: string) => void;
}

export const UnifiedChatInterface: React.FC<UnifiedChatInterfaceProps> = ({
  hostAgent,
  guestAgents,
  selectedAgents,
  onSelectionChange,
  isSharedMode = false,
  hostUserName,
  conversationId,
  currentUserId,
  currentUserName,
  showCollaborationIndicator = true,
  showParticipantCount = true,
  showRealTimeStatus = true,
  onAddGuests,
  onAddAIAgent,
  onRemoveParticipant
}) => {
  const participantContext = useUnifiedParticipantsOptional();
  const [showCollaborationBanner, setShowCollaborationBanner] = useState(false);

  // Show collaboration banner when in shared mode
  useEffect(() => {
    if (isSharedMode && showCollaborationIndicator) {
      setShowCollaborationBanner(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowCollaborationBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSharedMode, showCollaborationIndicator]);

  // Get participant counts from context
  const activeParticipants = participantContext?.getActiveParticipants() || [];
  const humanParticipants = participantContext?.getHumanParticipants() || [];
  const aiAgentParticipants = participantContext?.getAIAgentParticipants() || [];

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Collaboration Banner */}
      {showCollaborationBanner && isSharedMode && (
        <Fade in={showCollaborationBanner}>
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              left: 0,
              right: 0,
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                bgcolor: '#1e293b',
                border: '1px solid #3b82f6',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              <ShareIcon sx={{ color: '#3b82f6', fontSize: 16 }} />
              <Typography
                variant="body2"
                sx={{
                  color: '#3b82f6',
                  fontWeight: 500,
                  fontSize: '0.8rem'
                }}
              >
                {hostUserName ? `Shared with ${hostUserName}` : 'Shared Conversation'}
              </Typography>
              <Chip
                label="Collaborative"
                size="small"
                sx={{
                  bgcolor: '#3b82f620',
                  color: '#3b82f6',
                  fontSize: '0.6rem',
                  height: 20
                }}
              />
            </Box>
          </Box>
        </Fade>
      )}

      {/* Main Chat Interface */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 2,
          bgcolor: '#1e293b',
          borderRadius: 2,
          border: isSharedMode ? '1px solid #3b82f640' : '1px solid #334155'
        }}
      >
        {/* Enhanced Avatar Selector */}
        <Box sx={{ flex: 1 }}>
          <AgentAvatarSelector
            hostAgent={hostAgent}
            guestAgents={guestAgents}
            selectedAgents={selectedAgents}
            onSelectionChange={onSelectionChange}
            useUnifiedParticipants={!!participantContext}
            conversationId={conversationId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onAddAIAgent={onAddAIAgent}
            onRemoveParticipant={onRemoveParticipant}
            onAddGuests={onAddGuests}
            isSharedMode={isSharedMode}
          />
        </Box>

        {/* Collaboration Status Section */}
        {isSharedMode && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              pl: 2,
              borderLeft: '1px solid #334155'
            }}
          >
            {/* Participant Count */}
            {showParticipantCount && participantContext && (
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Active Participants
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {humanParticipants.length} humans • {aiAgentParticipants.length} AI agents
                    </Typography>
                  </Box>
                }
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: '#374151',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#4b5563'
                    }
                  }}
                >
                  <PeopleIcon sx={{ color: '#3b82f6', fontSize: 16 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#3b82f6',
                      fontWeight: 600,
                      fontSize: '0.7rem'
                    }}
                  >
                    {activeParticipants.length}
                  </Typography>
                </Box>
              </Tooltip>
            )}

            {/* Real-Time Status */}
            {showRealTimeStatus && (
              <RealTimeStatusIndicator compact={true} showDetails={false} />
            )}

            {/* Shared Mode Indicator */}
            <Tooltip title="This is a shared conversation">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: '#3b82f620',
                  border: '1px solid #3b82f640'
                }}
              >
                <VisibilityIcon sx={{ color: '#3b82f6', fontSize: 14 }} />
              </Box>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Extended Real-Time Status (when not in compact mode) */}
      {showRealTimeStatus && !isSharedMode && participantContext && (
        <Box
          sx={{
            mt: 1,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <RealTimeStatusIndicator compact={false} showDetails={true} />
        </Box>
      )}
    </Box>
  );
};

export default UnifiedChatInterface;

