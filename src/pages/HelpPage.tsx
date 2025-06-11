import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Paper, Tabs, Tab, Grid, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

// Placeholder components for help routes
const GuidedTours = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>Guided Tours</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Available Tours</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>Getting Started</Typography>
            <Typography variant="body2" paragraph>
              Learn the basics of Promethios and navigate the platform.
            </Typography>
            <Button variant="contained" color="primary">Start Tour</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>Agent Governance</Typography>
            <Typography variant="body2" paragraph>
              Understand how to implement governance for your agents.
            </Typography>
            <Button variant="contained" color="primary">Start Tour</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>Advanced Features</Typography>
            <Typography variant="body2" paragraph>
              Explore advanced features and capabilities of Promethios.
            </Typography>
            <Button variant="contained" color="primary">Start Tour</Button>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  </Box>
);

const Documentation = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>Documentation</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography paragraph>
        Access comprehensive documentation for the Promethios platform.
        Find guides, tutorials, and reference materials for all features.
      </Typography>
    </Paper>
  </Box>
);

const Support = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>Support</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography paragraph>
        Get help and support for the Promethios platform.
        Contact our support team, submit tickets, and access troubleshooting resources.
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

const HelpPage: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Help & Support
      </Typography>
      
      <StyledPaper>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          aria-label="help tabs"
        >
          <Tab label="Guided Tours" />
          <Tab label="Documentation" />
          <Tab label="Support" />
        </Tabs>
      </StyledPaper>
      
      <Routes>
        <Route path="/" element={<Navigate to="tours" replace />} />
        <Route path="tours" element={<GuidedTours />} />
        <Route path="docs" element={<Documentation />} />
        <Route path="support" element={<Support />} />
      </Routes>
    </Box>
  );
};

export default HelpPage;
