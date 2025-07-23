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
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  Close,
  Security,
  Policy,
  Schedule,
  TrendingUp,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import { TrustBoundary } from '../services/TrustBoundariesStorageService';

interface BoundaryDetailsModalProps {
  open: boolean;
  onClose: () => void;
  boundary: TrustBoundary | null;
}

const BoundaryDetailsModal: React.FC<BoundaryDetailsModalProps> = ({
  open,
  onClose,
  boundary
}) => {
  if (!boundary) return null;

  const getTrustLevelColor = (level: number) => {
    if (level >= 90) return '#10b981'; // Green
    if (level >= 70) return '#3b82f6'; // Blue
    if (level >= 50) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getBoundaryTypeColor = (type: string) => {
    switch (type) {
      case 'direct': return '#3b82f6';
      case 'delegated': return '#10b981';
      case 'transitive': return '#f59e0b';
      case 'federated': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'expired': return 'error';
      case 'pending_deployment': return 'info';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTrustLevelDescription = (level: number) => {
    if (level >= 95) return 'Maximum Trust - Full access to all operations and sensitive data';
    if (level >= 85) return 'High Trust - Access to most operations with minimal restrictions';
    if (level >= 70) return 'Standard Trust - Balanced access with moderate restrictions';
    if (level >= 50) return 'Limited Trust - Restricted access to basic operations only';
    return 'Minimal Trust - Highly restricted access, monitoring required';
  };

  const getBoundaryTypeDescription = (type: string) => {
    switch (type) {
      case 'direct':
        return 'Point-to-point trust relationship between two specific agents with no intermediaries.';
      case 'delegated':
        return 'Trust relationship established through a trusted intermediary agent or authority.';
      case 'transitive':
        return 'Trust relationship that can be extended through a chain of trusted connections.';
      case 'federated':
        return 'Cross-organizational trust relationship enabling collaboration between different systems.';
      default:
        return 'Unknown boundary type configuration.';
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
          border: '1px solid #4a5568',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Trust Boundary Details
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ color: 'white' }}>
        {/* Agent Information */}
        <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
              <Security sx={{ mr: 1 }} />
              Agent Relationship
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={5}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      backgroundColor: '#3b82f6', 
                      mx: 'auto', 
                      mb: 1,
                      fontSize: '1.5rem'
                    }}
                  >
                    {boundary.source_name.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {boundary.source_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Source Agent
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096', display: 'block', mt: 1 }}>
                    ID: {boundary.source_instance_id}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 40, color: getTrustLevelColor(boundary.trust_level) }} />
                  <Typography variant="body2" sx={{ color: '#a0aec0', mt: 1 }}>
                    Trusts
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={5}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      backgroundColor: '#10b981', 
                      mx: 'auto', 
                      mb: 1,
                      fontSize: '1.5rem'
                    }}
                  >
                    {boundary.target_name.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {boundary.target_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Target Agent
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096', display: 'block', mt: 1 }}>
                    ID: {boundary.target_instance_id}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Trust Metrics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Trust Level
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h3" sx={{ color: getTrustLevelColor(boundary.trust_level), fontWeight: 'bold' }}>
                    {boundary.trust_level}%
                  </Typography>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: getTrustLevelColor(boundary.trust_level),
                      ml: 2
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  {getTrustLevelDescription(boundary.trust_level)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Boundary Type
                </Typography>
                <Chip
                  label={boundary.boundary_type}
                  sx={{
                    backgroundColor: getBoundaryTypeColor(boundary.boundary_type),
                    color: 'white',
                    textTransform: 'capitalize',
                    fontSize: '1rem',
                    height: 32,
                    mb: 2
                  }}
                />
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  {getBoundaryTypeDescription(boundary.boundary_type)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Status and Timeline */}
        <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
              <Schedule sx={{ mr: 1 }} />
              Status & Timeline
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                    Current Status
                  </Typography>
                  <Chip
                    label={boundary.status}
                    color={getStatusColor(boundary.status) as any}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    {formatTimestamp(boundary.created_at)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                    Boundary ID
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {boundary.boundary_id}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Policies */}
        <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
              <Policy sx={{ mr: 1 }} />
              Attached Policies ({boundary.policies.length})
            </Typography>
            
            {boundary.policies.length > 0 ? (
              <List>
                {boundary.policies.map((policy, index) => (
                  <ListItem key={policy.policy_id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: '#10b981' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ color: 'white', textTransform: 'capitalize' }}>
                          {policy.policy_type} Policy
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Policy ID: {policy.policy_id}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Warning sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#a0aec0' }}>
                  No policies attached to this boundary
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096' }}>
                  Consider adding governance policies for enhanced security
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Attestations */}
        {boundary.attestations && boundary.attestations.length > 0 && (
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                <Info sx={{ mr: 1 }} />
                Attestations ({boundary.attestations.length})
              </Typography>
              
              <List>
                {boundary.attestations.map((attestation, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: '#3b82f6' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: 'white', fontFamily: 'monospace' }}>
                          {attestation}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderColor: '#4a5568', 
            color: 'white',
            '&:hover': { borderColor: '#718096', backgroundColor: '#2d3748' }
          }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          sx={{ 
            backgroundColor: '#3b82f6', 
            '&:hover': { backgroundColor: '#2563eb' }
          }}
        >
          Edit Boundary
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoundaryDetailsModal;

