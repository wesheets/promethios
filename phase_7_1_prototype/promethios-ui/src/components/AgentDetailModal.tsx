/**
 * Agent Detail Modal Component
 * 
 * Displays comprehensive information about a selected agent
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Close,
  Psychology,
  Api,
  Groups,
  Person,
  Security,
  Shield,
  Warning,
  CheckCircle,
  Error,
  Info,
  Schedule,
  TrendingUp,
  Assessment,
  VerifiedUser,
  Settings,
  Code,
  Cloud,
  Storage,
} from '@mui/icons-material';

interface AgentScorecard {
  agentId: string;
  agentName: string;
  agentDescription: string;
  trustScore: number;
  complianceRate: number;
  violationCount: number;
  status: 'active' | 'inactive' | 'suspended';
  type: 'single' | 'multi-agent' | 'native-llm' | 'api-wrapped';
  healthStatus: 'healthy' | 'warning' | 'critical';
  trustLevel: 'low' | 'medium' | 'high';
  provider?: string;
  lastActivity?: Date;
}

interface AgentDetailModalProps {
  open: boolean;
  onClose: () => void;
  agent: AgentScorecard | null;
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({ open, onClose, agent }) => {
  if (!agent) return null;

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'native-llm': return <Psychology sx={{ color: '#8B5CF6' }} />;
      case 'api-wrapped': return <Api sx={{ color: '#3B82F6' }} />;
      case 'multi-agent': return <Groups sx={{ color: '#10B981' }} />;
      default: return <Person sx={{ color: '#6B7280' }} />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'high': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'low': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'suspended': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a202c',
          color: 'white',
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            {getAgentTypeIcon(agent.type)}
            <Typography variant="h5" sx={{ ml: 2, fontWeight: 'bold' }}>
              {agent.agentName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ color: '#a0aec0', mt: 1 }}>
          Agent ID: {agent.agentId}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Status Overview */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Assessment sx={{ mr: 1 }} />
                  Status Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" sx={{ color: getStatusColor(agent.status) }}>
                        {agent.status.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        Agent Status
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" sx={{ color: getHealthStatusColor(agent.healthStatus) }}>
                        {agent.healthStatus.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        Health Status
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" sx={{ color: getTrustLevelColor(agent.trustLevel) }}>
                        {agent.trustLevel.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        Trust Level
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" sx={{ color: '#3B82F6' }}>
                        {agent.type.replace('-', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        Agent Type
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  Performance Metrics
                </Typography>
                
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Trust Score</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {agent.trustScore}/100
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={agent.trustScore}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#4a5568',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: agent.trustScore >= 80 ? '#10B981' : 
                                       agent.trustScore >= 60 ? '#F59E0B' : '#EF4444',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Compliance Rate</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {agent.complianceRate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={agent.complianceRate}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#4a5568',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: agent.complianceRate >= 95 ? '#10B981' : 
                                       agent.complianceRate >= 85 ? '#F59E0B' : '#EF4444',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Violations</Typography>
                  <Chip
                    label={agent.violationCount}
                    size="small"
                    sx={{
                      backgroundColor: agent.violationCount === 0 ? '#10B981' : '#EF4444',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Agent Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Info sx={{ mr: 1 }} />
                  Agent Information
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Code sx={{ color: '#a0aec0' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Description"
                      secondary={agent.agentDescription}
                      sx={{ 
                        '& .MuiListItemText-primary': { color: 'white' },
                        '& .MuiListItemText-secondary': { color: '#a0aec0' }
                      }}
                    />
                  </ListItem>
                  
                  {agent.provider && (
                    <ListItem>
                      <ListItemIcon>
                        <Cloud sx={{ color: '#a0aec0' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Provider"
                        secondary={agent.provider}
                        sx={{ 
                          '& .MuiListItemText-primary': { color: 'white' },
                          '& .MuiListItemText-secondary': { color: '#a0aec0' }
                        }}
                      />
                    </ListItem>
                  )}
                  
                  {agent.lastActivity && (
                    <ListItem>
                      <ListItemIcon>
                        <Schedule sx={{ color: '#a0aec0' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Last Activity"
                        secondary={agent.lastActivity.toLocaleString()}
                        sx={{ 
                          '& .MuiListItemText-primary': { color: 'white' },
                          '& .MuiListItemText-secondary': { color: '#a0aec0' }
                        }}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Governance Details */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Shield sx={{ mr: 1 }} />
                  Governance & Compliance
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2} sx={{ backgroundColor: '#1a202c', borderRadius: 1 }}>
                      <Security sx={{ fontSize: 40, color: '#3B82F6', mb: 1 }} />
                      <Typography variant="h6">Security Score</Typography>
                      <Typography variant="h4" sx={{ color: '#3B82F6' }}>
                        {Math.round(agent.trustScore * 0.9)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2} sx={{ backgroundColor: '#1a202c', borderRadius: 1 }}>
                      <VerifiedUser sx={{ fontSize: 40, color: '#10B981', mb: 1 }} />
                      <Typography variant="h6">Compliance</Typography>
                      <Typography variant="h4" sx={{ color: '#10B981' }}>
                        {agent.complianceRate}%
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2} sx={{ backgroundColor: '#1a202c', borderRadius: 1 }}>
                      <Warning sx={{ fontSize: 40, color: agent.violationCount > 0 ? '#EF4444' : '#10B981', mb: 1 }} />
                      <Typography variant="h6">Violations</Typography>
                      <Typography variant="h4" sx={{ color: agent.violationCount > 0 ? '#EF4444' : '#10B981' }}>
                        {agent.violationCount}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ 
            color: 'white', 
            borderColor: '#4a5568',
            '&:hover': {
              borderColor: '#718096',
              backgroundColor: 'rgba(113, 128, 150, 0.1)'
            }
          }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          sx={{ 
            backgroundColor: '#3182ce',
            '&:hover': {
              backgroundColor: '#2c5aa0'
            }
          }}
        >
          Manage Agent
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgentDetailModal;

