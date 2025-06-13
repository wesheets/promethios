import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  PlayArrow,
  Pause,
  Stop,
  Settings,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import MultiAgentWrappingWizard from '../modules/agent-wrapping/components/MultiAgentWrappingWizard';

const MultiAgentWrappingPage: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [multiAgentSystems] = useState([
    {
      id: '1',
      name: 'Customer Support Pipeline',
      description: 'Handles customer inquiries with content generation and sentiment analysis',
      agents: ['Content Generator', 'Sentiment Analyzer', 'Customer Support'],
      status: 'active',
      environment: 'production',
      requests: 876,
      successRate: 94.7,
    },
    {
      id: '2',
      name: 'Content Creation Workflow',
      description: 'Generates marketing content with brand voice guidelines and compliance checks',
      agents: ['Research Assistant', 'Content Generator', 'Compliance Checker'],
      status: 'active',
      environment: 'production',
      requests: 1245,
      successRate: 98.2,
    },
    {
      id: '3',
      name: 'Code Review Pipeline',
      description: 'Assists with code generation and review with security scanning',
      agents: ['Code Assistant', 'Security Scanner', 'Documentation Generator'],
      status: 'error',
      environment: 'testing',
      requests: 532,
      successRate: 76.3,
    },
    {
      id: '4',
      name: 'Financial Data Analysis',
      description: 'Analyzes financial data with strict confidentiality and accuracy requirements',
      agents: ['Data Analyzer', 'Report Generator', 'Compliance Checker'],
      status: 'inactive',
      environment: 'draft',
      requests: 0,
      successRate: 0,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'error': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production': return 'primary';
      case 'testing': return 'secondary';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'error': return <Warning />;
      case 'inactive': return <Pause />;
      default: return <Pause />;
    }
  };

  if (showWizard) {
    return (
      <Box>
        <Button 
          variant="outlined" 
          sx={{ mb: 2 }}
          onClick={() => setShowWizard(false)}
        >
          ← Back to Multi-Agent Systems
        </Button>
        <MultiAgentWrappingWizard />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>Multi-Agent Wrapping</Typography>
            <Typography variant="body1" color="text.secondary">
              Compose and manage multi-agent systems with governance controls
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setShowWizard(true)}
            size="large"
          >
            Create Multi-Agent System
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Systems</Typography>
                <Typography variant="h3" color="primary">4</Typography>
                <Typography variant="body2" color="success.main">
                  <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                  +1 this week
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Systems</Typography>
                <Typography variant="h3" color="primary">2</Typography>
                <Typography variant="body2" color="text.secondary">50% of total</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Governance Violations</Typography>
                <Typography variant="h3" color="error">1</Typography>
                <Typography variant="body2" color="error.main">
                  <Warning sx={{ fontSize: 16, mr: 0.5 }} />
                  Needs attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search multi-agent systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={environmentFilter}
                  label="Environment"
                  onChange={(e) => setEnvironmentFilter(e.target.value)}
                >
                  <MenuItem value="">All Environments</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                  <MenuItem value="testing">Testing</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Multi-Agent Systems Grid */}
        <Grid container spacing={3}>
          {multiAgentSystems.map((system) => (
            <Grid item xs={12} md={6} lg={4} key={system.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Chip 
                      label={system.environment}
                      color={getEnvironmentColor(system.environment) as any}
                      size="small"
                    />
                    <Chip 
                      label={system.status}
                      color={getStatusColor(system.status) as any}
                      icon={getStatusIcon(system.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>{system.name}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {system.description}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    AGENTS
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
                    {system.agents.map((agent, index) => (
                      <Chip 
                        key={index} 
                        label={agent} 
                        variant="outlined" 
                        size="small"
                        color="primary"
                      />
                    ))}
                  </Stack>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Requests</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {system.requests.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Success Rate</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {system.successRate}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<Edit />}
                    sx={{ flex: 1 }}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small"
                    variant="outlined"
                    color={system.status === 'active' ? 'error' : 'success'}
                    startIcon={system.status === 'active' ? <Stop /> : <PlayArrow />}
                    sx={{ flex: 1 }}
                  >
                    {system.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default MultiAgentWrappingPage;

