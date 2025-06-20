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
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { darkTheme } from '../theme/darkTheme';
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
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
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
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
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

        {/* Demo Team Section */}
        <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="h5" sx={{ mr: 2 }}>🚀 Try a Demo Team First!</Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            Click any demo team below to auto-populate the wizard and see how multi-agent collaboration works!
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                    onClick={() => setShowWizard(true)}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="h6">🛠️ Customer Support Pipeline</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    A complete workflow for handling customer inquiries with sentiment analysis and response generation.
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    <Chip label="sentiment" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                    <Chip label="reasoning" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                    <Chip label="3 agents" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                    onClick={() => setShowWizard(true)}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="h6">🔍 Code Review Team</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    A collaborative team for code review, review, and documentation with governance oversight.
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    <Chip label="python" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                    <Chip label="typescript" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                    <Chip label="3 agents" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                    onClick={() => setShowWizard(true)}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="h6">📊 Business Analysis Consensus</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    A consensus-driven team for strategic business analysis and decision making.
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    <Chip label="analysis" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                    <Chip label="consensus" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                    <Chip label="4 agents" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

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
    </ThemeProvider>
  );
};

export default MultiAgentWrappingPage;

