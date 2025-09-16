/**
 * Simple Org Chart
 * 
 * Auto-discovers users from Firebase connections and allows easy mapping
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  People,
  Add,
  Edit,
  Download,
  Upload,
  PersonAdd,
  Business,
  Search,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { firebaseUserDiscoveryService, type FirebaseUser } from '../../services/FirebaseUserDiscoveryService';
import { orgChartRAGService, type OrgChartUser } from '../../services/OrgChartRAGService';

interface SimpleOrgChartProps {
  agentId: string;
}

export const SimpleOrgChart: React.FC<SimpleOrgChartProps> = ({ agentId }) => {
  const [users, setUsers] = useState<OrgChartUser[]>([]);
  const [discoveredUsers, setDiscoveredUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    title: '',
    department: '',
    level: 3
  });

  useEffect(() => {
    loadOrgChart();
    discoverFirebaseUsers();
  }, []);

  const loadOrgChart = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId') || 'demo_user';
      const organizationId = localStorage.getItem('organizationId') || 'demo_org';
      
      const orgUsers = await orgChartRAGService.searchOrgChart(organizationId, '', {});
      setUsers(orgUsers);
    } catch (error) {
      console.error('Failed to load org chart:', error);
    } finally {
      setLoading(false);
    }
  };

  const discoverFirebaseUsers = async () => {
    try {
      setLoading(true);
      const currentUserId = localStorage.getItem('userId');
      
      // Use the existing FirebaseUserDiscoveryService to get real users
      const realUsers = await firebaseUserDiscoveryService.getAllUsers(currentUserId);
      
      console.log('Discovered Firebase users:', realUsers);
      setDiscoveredUsers(realUsers);
    } catch (error) {
      console.error('Failed to discover users:', error);
    } finally {
      setLoading(false);
    }
  };

  const addUserToOrgChart = async (discoveredUser: FirebaseUser) => {
    try {
      const userId = localStorage.getItem('userId') || 'demo_user';
      const organizationId = localStorage.getItem('organizationId') || 'demo_org';
      
      const orgUser: OrgChartUser = {
        userId: discoveredUser.id,
        name: discoveredUser.displayName || discoveredUser.email.split('@')[0],
        email: discoveredUser.email,
        title: discoveredUser.profile?.title || 'Team Member',
        department: discoveredUser.profile?.company || 'General',
        level: 4, // Default level
        location: discoveredUser.profile?.location || 'Remote',
        timezone: 'UTC',
        startDate: new Date().toISOString(),
        skills: discoveredUser.profile?.skills || [],
        status: 'active'
      };

      await orgChartRAGService.addUser(organizationId, orgUser);
      await loadOrgChart();
      
      // Remove from discovered list
      setDiscoveredUsers(prev => prev.filter(u => u.id !== discoveredUser.id));
    } catch (error) {
      console.error('Failed to add user to org chart:', error);
    }
  };

  const createNewUser = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'demo_user';
      const organizationId = localStorage.getItem('organizationId') || 'demo_org';
      
      const orgUser: OrgChartUser = {
        userId: `manual_${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        title: newUser.title,
        department: newUser.department,
        level: newUser.level,
        location: 'Office',
        timezone: 'UTC',
        startDate: new Date().toISOString(),
        skills: [],
        status: 'active'
      };

      await orgChartRAGService.addUser(organizationId, orgUser);
      await loadOrgChart();
      
      setShowAddUser(false);
      setNewUser({ name: '', email: '', title: '', department: '', level: 3 });
    } catch (error) {
      console.error('Failed to create new user:', error);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `userId,name,email,title,department,level,reportsTo,location,timezone,startDate,skills,status
user001,John Smith,john.smith@company.com,CEO,Executive,1,,New York,EST,2020-01-15,"leadership,strategy",active
user002,Sarah Johnson,sarah.johnson@company.com,VP Engineering,Engineering,2,user001,San Francisco,PST,2020-03-01,"engineering,management",active
user003,Mike Chen,mike.chen@company.com,Senior Developer,Engineering,4,user002,San Francisco,PST,2021-06-15,"javascript,react,node",active`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'org_chart_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Organization Chart
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>What is this?</AlertTitle>
        Your agent uses the org chart to understand who people are, their roles, and how to communicate appropriately with different team members.
      </Alert>

      {/* Stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} sx={{ textAlign: 'center' }}>
          <Grid item xs={4}>
            <Typography variant="h4" color="primary">
              {users.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Team Members
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="h4" color="success.main">
              {discoveredUsers.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Discovered Users
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="h4" color="warning.main">
              {new Set(users.map(u => u.department)).size}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Departments
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Discovered Users */}
      {discoveredUsers.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search />
            Auto-Discovered Users
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These users were found in your Firebase connections. Add them to your org chart:
          </Typography>
          
          <List>
            {discoveredUsers.map((user) => (
              <ListItem key={user.id} sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 1 }}>
                <ListItemAvatar>
                  <Avatar src={user.photoURL || undefined}>
                    {(user.displayName || user.email).charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.displayName || user.email.split('@')[0]}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {user.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.profile?.title || 'Professional'} • {user.profile?.company || 'Company'}
                      </Typography>
                      {user.isOnline && (
                        <Typography variant="caption" color="success.main" display="block">
                          • Online
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonAdd />}
                  onClick={() => addUserToOrgChart(user)}
                >
                  Add to Org Chart
                </Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Current Org Chart */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <People />
          Current Organization Chart
        </Typography>
        
        {users.length > 0 ? (
          <List>
            {users.map((user) => (
              <ListItem key={user.userId}>
                <ListItemAvatar>
                  <Avatar>{user.name.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip label={user.title} size="small" />
                      <Chip label={user.department} size="small" variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        Level {user.level}
                      </Typography>
                    </Box>
                  }
                />
                <IconButton size="small">
                  <Edit />
                </IconButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="warning">
            <AlertTitle>No team members added yet</AlertTitle>
            Add discovered users above or create new entries manually.
          </Alert>
        )}
      </Paper>

      {/* Actions */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Add />}
            onClick={() => setShowAddUser(true)}
            sx={{ p: 2 }}
          >
            Add Team Member
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Download />}
            onClick={downloadTemplate}
            sx={{ p: 2 }}
          >
            Download Template
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Upload />}
            sx={{ p: 2 }}
          >
            Import CSV
          </Button>
        </Grid>
      </Grid>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onClose={() => setShowAddUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={newUser.title}
                onChange={(e) => setNewUser(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={newUser.department}
                onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={newUser.level}
                  onChange={(e) => setNewUser(prev => ({ ...prev, level: e.target.value as number }))}
                >
                  <MenuItem value={1}>1 - Executive (CEO, President)</MenuItem>
                  <MenuItem value={2}>2 - VP/Director</MenuItem>
                  <MenuItem value={3}>3 - Manager</MenuItem>
                  <MenuItem value={4}>4 - Senior Individual Contributor</MenuItem>
                  <MenuItem value={5}>5 - Individual Contributor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddUser(false)}>Cancel</Button>
          <Button 
            onClick={createNewUser} 
            variant="contained"
            disabled={!newUser.name || !newUser.email}
          >
            Add Member
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help */}
      {users.length === 0 && discoveredUsers.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <AlertTitle>Get Started</AlertTitle>
          Add team members so your agent knows who it's talking to and can adjust its responses appropriately. You can add discovered users, create new entries, or import a CSV file.
        </Alert>
      )}
    </Box>
  );
};

export default SimpleOrgChart;

