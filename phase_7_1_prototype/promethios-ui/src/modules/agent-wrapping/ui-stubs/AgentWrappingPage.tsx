import React, { useState } from 'react';
import { Container, Typography, Box, Button, Card, CardContent, Switch, FormControlLabel, Chip, Alert } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Rocket, Science } from '@mui/icons-material';
import { darkTheme } from '../../../theme/darkTheme';
import AgentWrappingWizard from '../components/AgentWrappingWizard';
import EnhancedAgentWrappingWizard from '../components/EnhancedAgentWrappingWizard';

const AgentWrappingPage: React.FC = () => {
  const navigate = useNavigate();
  const [useDualDeployment, setUseDualDeployment] = useState(false);

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

        {/* Dual Deployment Toggle */}
        <Card sx={{ mb: 4, border: useDualDeployment ? '2px solid #1976d2' : '1px solid rgba(255,255,255,0.12)' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  {useDualDeployment ? (
                    <Rocket color="primary" />
                  ) : (
                    <Science color="action" />
                  )}
                  <Typography variant="h6">
                    {useDualDeployment ? 'Enhanced Dual Deployment' : 'Standard Wrapping'}
                  </Typography>
                  {useDualDeployment && (
                    <Chip label="BETA" color="primary" size="small" />
                  )}
                </Box>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={useDualDeployment}
                    onChange={(e) => setUseDualDeployment(e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable Dual Deployment"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {useDualDeployment ? (
                <>
                  🎯 <strong>Dual Deployment Mode:</strong> Creates both testing and production versions automatically. 
                  Test governed vs ungoverned behavior in chat screens, then deploy live agents off Promethios.
                </>
              ) : (
                <>
                  🔧 <strong>Standard Mode:</strong> Traditional agent wrapping with basic governance controls.
                </>
              )}
            </Typography>

            {useDualDeployment && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Dual Deployment Benefits:</strong>
                  <br />• Automatic testing and production environment setup
                  <br />• Enhanced governance controls and monitoring
                  <br />• Cross-device synchronization via Firebase
                  <br />• Comprehensive audit logging and compliance
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Render appropriate wizard based on mode */}
        {useDualDeployment ? (
          <EnhancedAgentWrappingWizard 
            onComplete={(wrapper) => {
              console.log('Dual wrapper created:', wrapper);
              // Handle completion - could navigate or show success message
            }}
            onCancel={() => setUseDualDeployment(false)}
          />
        ) : (
          <AgentWrappingWizard />
        )}
      </Container>
    </ThemeProvider>
  );
};

export default AgentWrappingPage;

