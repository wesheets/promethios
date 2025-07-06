import React, { useState } from 'react';
import { Container, Typography, Box, Button, Card, CardContent, Switch, FormControlLabel, Chip, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AutoAwesome, Settings, Psychology } from '@mui/icons-material';
import { darkTheme } from '../../../theme/darkTheme';
import AgentWrappingWizard from '../components/AgentWrappingWizard';
import EnhancedAgentWrappingWizard from '../components/EnhancedAgentWrappingWizard';
import EnhancedVeritas2AgentWrappingWizard from '../components/EnhancedVeritas2AgentWrappingWizard';

type WrapperMode = 'standard' | 'enhanced' | 'veritas2';

const AgentWrappingPage: React.FC = () => {
  const navigate = useNavigate();
  const [wrapperMode, setWrapperMode] = useState<WrapperMode>('enhanced');

  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: WrapperMode | null) => {
    if (newMode !== null) {
      setWrapperMode(newMode);
    }
  };

  const getModeConfig = () => {
    switch (wrapperMode) {
      case 'standard':
        return {
          icon: <Settings color="action" />,
          title: 'Standard Agent Wrapping',
          description: '🔧 Basic agent wrapping with essential governance controls.',
          features: [
            'Basic governance and policy enforcement',
            'Essential monitoring capabilities',
            'Standard deployment options',
            'Core security controls'
          ]
        };
      case 'enhanced':
        return {
          icon: <AutoAwesome color="primary" />,
          title: 'Enhanced Agent Wrapping',
          description: '✨ Advanced governance controls, comprehensive monitoring, and automatic deployment optimization.',
          features: [
            'Advanced governance and policy enforcement',
            'Comprehensive monitoring and analytics',
            'Automatic deployment optimization',
            'Enhanced security and compliance controls'
          ]
        };
      case 'veritas2':
        return {
          icon: <Psychology color="secondary" />,
          title: 'Enhanced Veritas 2 Agent Wrapping',
          description: '🧠 Next-generation emotional intelligence and trust management with quantum uncertainty analysis.',
          features: [
            'Advanced emotional intelligence monitoring',
            'Quantum uncertainty analysis',
            'Human-in-the-loop collaboration',
            'Real-time analytics and predictive modeling',
            'All Enhanced features included'
          ]
        };
    }
  };

  const config = getModeConfig();

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

        {/* Mode Selection */}
        <Card sx={{ mb: 4, border: wrapperMode === 'veritas2' ? '2px solid #9c27b0' : wrapperMode === 'enhanced' ? '2px solid #1976d2' : '1px solid rgba(255,255,255,0.12)' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  {config.icon}
                  <Typography variant="h6">
                    {config.title}
                  </Typography>
                  {wrapperMode === 'enhanced' && (
                    <Chip label="ENHANCED" color="primary" size="small" />
                  )}
                  {wrapperMode === 'veritas2' && (
                    <Chip label="VERITAS 2" color="secondary" size="small" />
                  )}
                </Box>
              </Box>
            </Box>

            <ToggleButtonGroup
              value={wrapperMode}
              exclusive
              onChange={handleModeChange}
              aria-label="wrapper mode"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="standard" aria-label="standard">
                <Settings sx={{ mr: 1 }} />
                Standard
              </ToggleButton>
              <ToggleButton value="enhanced" aria-label="enhanced">
                <AutoAwesome sx={{ mr: 1 }} />
                Enhanced
              </ToggleButton>
              <ToggleButton value="veritas2" aria-label="veritas2">
                <Psychology sx={{ mr: 1 }} />
                Veritas 2
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {config.description}
            </Typography>

            <Alert severity={wrapperMode === 'veritas2' ? 'warning' : 'info'} sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>{wrapperMode === 'veritas2' ? 'Enhanced Veritas 2 Features (BETA):' : 'Features Include:'}</strong>
                {config.features.map((feature, index) => (
                  <React.Fragment key={index}>
                    <br />• {feature}
                  </React.Fragment>
                ))}
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        {/* Render appropriate wizard based on mode */}
        {wrapperMode === 'veritas2' ? (
          <EnhancedVeritas2AgentWrappingWizard 
            onComplete={(wrapper) => {
              console.log('Enhanced Veritas 2 agent wrapper created:', wrapper);
              // Handle completion - could navigate or show success message
            }}
            onCancel={() => setWrapperMode('enhanced')}
          />
        ) : wrapperMode === 'enhanced' ? (
          <EnhancedAgentWrappingWizard 
            onComplete={(wrapper) => {
              console.log('Enhanced agent wrapper created:', wrapper);
              // Handle completion - could navigate or show success message
            }}
            onCancel={() => setWrapperMode('standard')}
          />
        ) : (
          <AgentWrappingWizard />
        )}
      </Container>
    </ThemeProvider>
  );
};

export default AgentWrappingPage;

