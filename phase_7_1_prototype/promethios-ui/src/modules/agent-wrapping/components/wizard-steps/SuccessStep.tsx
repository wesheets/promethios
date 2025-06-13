import React from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Chat,
  Assessment,
  Scorecard,
  GroupWork,
  Add,
  Launch,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AgentWrapper } from '../../types';

interface SuccessStepProps {
  wrapper: AgentWrapper;
  onCreateAnother: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({
  wrapper,
  onCreateAnother,
}) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Chat with your agent',
      description: 'Start a conversation with your newly wrapped agent',
      icon: <Chat />,
      color: 'primary' as const,
      action: () => navigate('/ui/agents/chat'),
    },
    {
      title: 'View governance metrics',
      description: 'Monitor performance and compliance metrics',
      icon: <Assessment />,
      color: 'secondary' as const,
      action: () => navigate('/ui/governance/overview'),
    },
    {
      title: 'View agent scorecard',
      description: 'Check detailed performance analytics',
      icon: <Scorecard />,
      color: 'info' as const,
      action: () => navigate('/ui/agents/scorecard'),
    },
    {
      title: 'Create multi-agent system',
      description: 'Combine multiple agents for complex workflows',
      icon: <GroupWork />,
      color: 'warning' as const,
      action: () => navigate('/ui/agents/multi-wrapping'),
    },
  ];

  return (
    <Box textAlign="center" py={6}>
      <Box mb={4}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Agent Successfully Wrapped!
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          {wrapper.name} is now live with governance controls
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Agent Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Agent ID"
                    secondary={wrapper.id}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Name"
                    secondary={wrapper.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Version"
                    secondary={wrapper.version}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Providers"
                    secondary={
                      <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                        {wrapper.supportedProviders.map((provider) => (
                          <Chip key={provider} label={provider} size="small" />
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Chip label="Active" color="success" size="small" />
                    }
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Alert severity="success" sx={{ mb: 4, textAlign: 'left' }}>
        <Typography variant="body2">
          <strong>What happens next?</strong> Your agent is now registered in the Promethios platform 
          and ready to use. All requests will be monitored for governance compliance, and you can 
          track performance metrics in real-time.
        </Typography>
      </Alert>

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3 }}>
        What would you like to do next?
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              variant="outlined" 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                },
              }}
              onClick={action.action}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box 
                  sx={{ 
                    color: `${action.color}.main`,
                    mb: 2,
                    '& svg': { fontSize: 40 }
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box display="flex" justifyContent="center" gap={2}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={onCreateAnother}
          size="large"
        >
          Wrap Another Agent
        </Button>
        <Button
          variant="contained"
          startIcon={<Launch />}
          onClick={() => navigate('/ui/dashboard')}
          size="large"
        >
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default SuccessStep;

