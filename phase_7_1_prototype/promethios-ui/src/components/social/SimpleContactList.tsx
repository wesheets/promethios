import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
  CircularProgress,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Close,
  Minimize,
  Person,
  Circle,
} from '@mui/icons-material';
import { useConnections } from '../../hooks/useConnections';

interface SimpleContactListProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFloatingChat: (userId: string, userName: string) => void;
  connections?: any[]; // Legacy prop, will use useConnections instead
}

const SimpleContactList: React.FC<SimpleContactListProps> = ({
  isOpen,
  onClose,
  onOpenFloatingChat,
}) => {
  const { connections, loading: connectionsLoading } = useConnections();
  const [isMinimized, setIsMinimized] = useState(false);

  console.log('🔍 [SimpleContactList] Connections from Firebase:', connections);
  console.log('🔍 [SimpleContactList] Loading state:', connectionsLoading);

  const handleContactClick = (connection: any) => {
    console.log('📞 [SimpleContactList] Opening chat with:', connection);
    onOpenFloatingChat(connection.userId, connection.displayName || connection.email || 'Connected User');
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? '#10b981' : '#6b7280'; // Green for online, gray for offline
  };

  const getStatusText = (isOnline: boolean) => {
    return isOnline ? 'Online' : 'Offline';
  };

  if (!isOpen) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        top: 60, // Below the top navigation
        right: 20,
        width: 320,
        maxHeight: isMinimized ? 'auto' : 500,
        backgroundColor: '#0f172a', // Dark background to match Direct Messages
        border: '1px solid #1e293b',
        borderRadius: 2,
        overflow: 'hidden',
        zIndex: 1300,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Messages
          </Typography>
          {connectionsLoading && (
            <CircularProgress size={16} sx={{ color: '#3b82f6' }} />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => setIsMinimized(!isMinimized)}
            sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}
          >
            <Minimize />
          </IconButton>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}
          >
            <Close />
          </IconButton>
        </Box>
      </Box>

      {/* Contact List */}
      <Collapse in={!isMinimized}>
        <Box
          sx={{
            maxHeight: 400,
            overflowY: 'auto',
            backgroundColor: '#0f172a',
          }}
        >
          {connectionsLoading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <CircularProgress size={24} sx={{ color: '#3b82f6' }} />
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Loading connections...
              </Typography>
            </Box>
          ) : connections.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                color: '#94a3b8',
              }}
            >
              <Typography variant="body2" textAlign="center">
                No connections yet.{'\n'}
                Connect with team members to start chatting.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {connections.map((connection, index) => (
                <React.Fragment key={connection.userId || index}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleContactClick(connection)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          backgroundColor: '#1e293b',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar
                            src={connection.photoURL}
                            sx={{
                              width: 40,
                              height: 40,
                              backgroundColor: '#3b82f6',
                              color: 'white',
                            }}
                          >
                            {(connection.displayName || connection.email || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                          {/* Online status indicator */}
                          <Circle
                            sx={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              fontSize: 12,
                              color: getStatusColor(connection.isOnline),
                            }}
                          />
                        </Box>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: 'white',
                                fontWeight: 500,
                                flex: 1,
                              }}
                            >
                              {connection.displayName || connection.email || 'Connected User'}
                            </Typography>
                            <Chip
                              label={getStatusText(connection.isOnline)}
                              size="small"
                              sx={{
                                backgroundColor: connection.isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                                color: getStatusColor(connection.isOnline),
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#94a3b8',
                              display: 'block',
                              mt: 0.5,
                            }}
                          >
                            {connection.role || 'Team Member'} • Click to chat
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < connections.length - 1 && (
                    <Divider sx={{ backgroundColor: '#1e293b' }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SimpleContactList;

