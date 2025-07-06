import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { darkTheme } from '../../../theme/darkTheme';
import AgentWrappingWizard from '../components/AgentWrappingWizard';

const AgentWrappingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Agent Wrapping
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Wrap your AI agents with governance controls and monitoring
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/ui/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>

        <AgentWrappingWizard />
      </Container>
    </ThemeProvider>
  );
};

export default AgentWrappingPage;

