import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/material/styles';

// Placeholder components for trust metrics routes
const TrustMetricsOverview = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>Trust Metrics Overview</Typography>
    <Typography paragraph>
      View a comprehensive overview of trust metrics across your agent ecosystem.
      Monitor trust scores, boundaries, and attestations in one place.
    </Typography>
  </Box>
);

const TrustBoundaries = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>Trust Boundaries</Typography>
    <Typography paragraph>
      Define and manage trust boundaries for your agents. Configure limits,
      thresholds, and acceptable ranges for agent behavior and interactions.
    </Typography>
  </Box>
);

const TrustAttestations = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>Trust Attestations</Typography>
    <Typography paragraph>
      Create and manage attestations for your agents. Document compliance,
      certifications, and verification of agent capabilities and behaviors.
    </Typography>
  </Box>
);

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
  marginBottom: theme.spacing(3),
}));

const TrustMetricsPage: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Trust Metrics
      </Typography>
      
      <StyledPaper>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          aria-label="trust metrics tabs"
        >
          <Tab label="Overview" />
          <Tab label="Boundaries" />
          <Tab label="Attestations" />
        </Tabs>
      </StyledPaper>
      
      <Routes>
        <Route path="/" element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<TrustMetricsOverview />} />
        <Route path="boundaries" element={<TrustBoundaries />} />
        <Route path="attestations" element={<TrustAttestations />} />
      </Routes>
    </Box>
  );
};

export default TrustMetricsPage;
