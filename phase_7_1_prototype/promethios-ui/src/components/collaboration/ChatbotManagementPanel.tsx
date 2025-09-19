/**
 * ChatbotManagementPanel - Slide-out panel for managing AI chatbots
 * 
 * Features:
 * - Slides from right side with smooth animations
 * - Embeds the full chatbots management interface
 * - Consistent with other slide-out panels (command center, social, workflow)
 * - Full-featured chatbot creation, editing, and management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Slide,
  IconButton,
  Typography,
  Paper,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  SmartToy as ChatbotIcon
} from '@mui/icons-material';
import ChatbotProfilesPageEnhanced from '../../pages/ChatbotProfilesPageEnhanced';

interface ChatbotManagementPanelProps {
  open: boolean;
  onClose: () => void;
  width: string;
}

const ChatbotManagementPanel: React.FC<ChatbotManagementPanelProps> = ({
  open,
  onClose,
  width
}) => {
  console.log('🤖 [ChatbotManagementPanel] Rendered with props:', { open, width });

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: width,
          height: '100vh',
          bgcolor: '#0f172a',
          borderLeft: '1px solid #334155',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: '#1e293b',
            borderBottom: '1px solid #334155',
            borderRadius: 0,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ChatbotIcon sx={{ color: '#8b5cf6', fontSize: '1.5rem' }} />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: '#f8fafc',
                  fontWeight: 600,
                  fontSize: '1.1rem'
                }}
              >
                Chatbot Management
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#94a3b8',
                  fontSize: '0.85rem'
                }}
              >
                Create, configure, and manage your AI agents
              </Typography>
            </Box>
          </Box>
          
          <IconButton
            onClick={onClose}
            sx={{
              color: '#94a3b8',
              '&:hover': {
                color: '#f8fafc',
                bgcolor: '#374151'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Paper>

        {/* Embedded Chatbots Interface */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Full ChatbotProfilesPageEnhanced embedded */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              bgcolor: '#0f172a',
              '& .MuiContainer-root': {
                maxWidth: 'none !important',
                padding: '0 !important'
              },
              '& .MuiPaper-root': {
                bgcolor: '#1e293b',
                borderColor: '#334155'
              },
              '& .MuiTextField-root': {
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#0f172a',
                  '& fieldset': {
                    borderColor: '#475569'
                  },
                  '&:hover fieldset': {
                    borderColor: '#64748b'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b5cf6'
                  }
                }
              },
              '& .MuiButton-root': {
                '&.MuiButton-contained': {
                  bgcolor: '#8b5cf6',
                  '&:hover': {
                    bgcolor: '#7c3aed'
                  }
                }
              }
            }}
          >
            <ChatbotProfilesPageEnhanced />
          </Box>
        </Box>
      </Box>
    </Slide>
  );
};

export default ChatbotManagementPanel;
