import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Paper, Tabs, Tab, Grid, TextField, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

// Placeholder components for settings routes
const UserProfile = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>User Profile</Typography>
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Full Name"
            defaultValue="Admin User"
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Email"
            defaultValue="admin@promethios.ai"
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Role"
            defaultValue="Administrator"
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Department"
            defaultValue="AI Governance"
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" sx={{ mt: 2 }}>
            Save Changes
          </Button>
        </Grid>
      </Grid>
    </Paper>
  </Box>
);

const Preferences = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>User Preferences</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography paragraph>
        Configure your personal preferences for the Promethios platform.
        Customize notifications, display settings, and interaction preferences.
      </Typography>
    </Paper>
  </Box>
);

const Organization = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>Organization Settings</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography paragraph>
        Manage organization-wide settings and configurations.
        Configure teams, roles, and permissions for your organization.
      </Typography>
    </Paper>
  </Box>
);

const Integrations = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>Integrations</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography paragraph>
        Configure and manage integrations with external systems and services.
        Connect Promethios with your existing tools and workflows.
      </Typography>
    </Paper>
  </Box>
);

const DataManagement = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>Data Management</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography paragraph>
        Manage data storage, retention, and access policies.
        Configure data export, import, and backup settings.
      </Typography>
    </Paper>
  </Box>
);

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
  marginBottom: theme.spacing(3),
}));

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <StyledPaper>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          aria-label="settings tabs"
        >
          <Tab label="User Profile" />
          <Tab label="Preferences" />
          <Tab label="Organization" />
          <Tab label="Integrations" />
          <Tab label="Data Management" />
        </Tabs>
      </StyledPaper>
      
      <Routes>
        <Route path="/" element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="preferences" element={<Preferences />} />
        <Route path="organization" element={<Organization />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="data" element={<DataManagement />} />
      </Routes>
    </Box>
  );
};

export default SettingsPage;
