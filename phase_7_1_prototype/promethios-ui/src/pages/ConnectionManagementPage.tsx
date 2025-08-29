import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tooltip,
} from '@mui/material';
import {
  PersonAdd as ConnectionIcon,
  Check as AcceptIcon,
  Close as DeclineIcon,
  PersonRemove as RemoveIcon,
  Search as SearchIcon,
  Message as MessageIcon,
  MoreVert as MoreIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useConnections } from '../hooks/useConnections';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

/**
 * ConnectionManagementPage - A page for managing connections
 * 
 * Allows users to view and manage their connections, including:
 * - Viewing pending connection requests
 * - Accepting or declining connection requests
 * - Viewing existing connections
 * - Removing connections
 * - Searching for connections
 */
const ConnectionManagementPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const { 
    connections, 
    pendingRequests, 
    sentRequests,
    acceptConnectionRequest, 
    declineConnectionRequest,
    removeConnection,
    cancelConnectionRequest,
    loading 
  } = useConnections();

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle accepting a connection request
  const handleAcceptConnection = async (requestId: string) => {
    try {
      await acceptConnectionRequest(requestId);
    } catch (error) {
      console.error('Failed to accept connection request:', error);
    }
  };

  // Handle declining a connection request
  const handleDeclineConnection = async (requestId: string) => {
    try {
      await declineConnectionRequest(requestId);
    } catch (error) {
      console.error('Failed to decline connection request:', error);
    }
  };

  // Handle removing a connection
  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await removeConnection(connectionId);
    } catch (error) {
      console.error('Failed to remove connection:', error);
    }
  };

  // Handle canceling a sent connection request
  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelConnectionRequest(requestId);
    } catch (error) {
      console.error('Failed to cancel connection request:', error);
    }
  };

  // Handle viewing a user's profile
  const handleViewProfile = (userId: string) => {
    navigate(`/ui/profile/${userId}`);
  };

  // Handle starting a chat with a connection
  const handleStartChat = (userId: string) => {
    navigate(`/ui/chat/${userId}`);
  };

  // Filter connections based on search query
  const filteredConnections = connections.filter(connection => 
    connection.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
          Connection Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your network connections and collaboration partners
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}
        >
          <Tab 
            label="My Connections" 
            icon={<ConnectionIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Pending Requests" 
            icon={
              <Chip 
                label={pendingRequests.length} 
                color="primary" 
                size="small" 
                sx={{ ml: 1, height: 20, minWidth: 20 }}
              />
            } 
            iconPosition="end"
          />
          <Tab 
            label="Sent Requests" 
            icon={
              <Chip 
                label={sentRequests.length} 
                color="secondary" 
                size="small" 
                sx={{ ml: 1, height: 20, minWidth: 20 }}
              />
            } 
            iconPosition="end"
          />
        </Tabs>
      </Paper>

      {/* My Connections Tab */}
      {tabValue === 0 && (
        <>
          {/* Search and Filter */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <TextField
              placeholder="Search connections..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              startIcon={<FilterIcon />}
              variant="outlined"
            >
              Filter
            </Button>
          </Box>

          {/* Connections Grid */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredConnections.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No connections found</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<ConnectionIcon />}
                sx={{ mt: 2 }}
                onClick={() => navigate('/ui/social/discovery')}
              >
                Find Connections
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredConnections.map(connection => (
                <Grid item xs={12} sm={6} md={4} key={connection.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    '&:hover': { boxShadow: 3 }
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          src={connection.avatar} 
                          sx={{ width: 60, height: 60, mr: 2 }}
                        >
                          {connection.name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div">
                            {connection.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {connection.title} {connection.company ? `at ${connection.company}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {connection.skills && connection.skills.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Skills
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {connection.skills.slice(0, 3).map((skill, index) => (
                              <Chip 
                                key={index} 
                                label={skill} 
                                size="small" 
                                variant="outlined"
                              />
                            ))}
                            {connection.skills.length > 3 && (
                              <Chip 
                                label={`+${connection.skills.length - 3}`} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      )}
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Connected since
                        </Typography>
                        <Typography variant="body2">
                          {connection.connectedSince ? 
                            formatDistanceToNow(new Date(connection.connectedSince), { addSuffix: true }) : 
                            'Recently'
                          }
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                      <Button 
                        size="small" 
                        onClick={() => handleViewProfile(connection.id)}
                      >
                        View Profile
                      </Button>
                      <Box>
                        <Tooltip title="Message">
                          <IconButton 
                            size="small"
                            onClick={() => handleStartChat(connection.id)}
                          >
                            <MessageIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Connection">
                          <IconButton 
                            size="small"
                            onClick={() => handleRemoveConnection(connection.id)}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Pending Requests Tab */}
      {tabValue === 1 && (
        <Paper>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : pendingRequests.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No pending connection requests</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {pendingRequests.map(request => (
                <React.Fragment key={request.id}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={request.fromUserPhoto}
                        sx={{ width: 50, height: 50, mr: 1 }}
                      >
                        {request.fromUserName?.charAt(0) || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {request.fromUserName || 'Unknown User'}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {request.message || 'Wants to connect with you'}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {formatDistanceToNow(new Date(request.createdAt.toDate()), { addSuffix: true })}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<AcceptIcon />}
                              onClick={() => handleAcceptConnection(request.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeclineIcon />}
                              onClick={() => handleDeclineConnection(request.id)}
                            >
                              Decline
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleViewProfile(request.fromUserId)}
                            >
                              View Profile
                            </Button>
                          </Box>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Sent Requests Tab */}
      {tabValue === 2 && (
        <Paper>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : sentRequests.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No sent connection requests</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<ConnectionIcon />}
                sx={{ mt: 2 }}
                onClick={() => navigate('/ui/social/discovery')}
              >
                Find Connections
              </Button>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {sentRequests.map(request => (
                <React.Fragment key={request.id}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={request.toUserPhoto}
                        sx={{ width: 50, height: 50, mr: 1 }}
                      >
                        {request.toUserName?.charAt(0) || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {request.toUserName || 'Unknown User'}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {request.message || 'You sent a connection request'}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {formatDistanceToNow(new Date(request.createdAt.toDate()), { addSuffix: true })}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeclineIcon />}
                              onClick={() => handleCancelRequest(request.id)}
                            >
                              Cancel Request
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleViewProfile(request.toUserId)}
                            >
                              View Profile
                            </Button>
                          </Box>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default ConnectionManagementPage;

