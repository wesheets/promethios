import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Alert,
  Card,
  CardContent,
  Avatar,
  Chip,
  Badge,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Business,
  People,
  Add,
  Settings,
  Security,
  Analytics,
  Public,
  Lock,
  AdminPanelSettings,
  Group,
  TrendingUp,
  AutoAwesome,
  Verified,
} from '@mui/icons-material';

// Import Firebase services
import { FirebaseOrganizationService, Organization } from '../services/FirebaseOrganizationService';
import { useAuth } from '../context/AuthContext';
import CreateOrganizationDialog from '../components/organization/CreateOrganizationDialog';

interface OrganizationActivity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
}

interface Department {
  id: string;
  name: string;
  memberCount: number;
  onlineCount: number;
  aiAgentsUsed: string[];
  isPrivate: boolean;
}

interface OrganizationsPageProps {
  onCreateOrganization?: () => void;
  onViewOrganization?: (orgId: string) => void;
  onJoinOrganization?: (orgId: string) => void;
  onManageOrganization?: (orgId: string) => void;
}

const OrganizationsPage: React.FC<OrganizationsPageProps> = ({
  onCreateOrganization,
  onViewOrganization,
  onJoinOrganization,
  onManageOrganization,
}) => {
  const { currentUser } = useAuth();
  const [myOrganizations, setMyOrganizations] = useState<Organization[]>([]);
  const [publicOrganizations, setPublicOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const organizationService = FirebaseOrganizationService.getInstance();


  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  const loadInitialData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load user's organizations
      const userOrgs = await organizationService.getUserOrganizations(currentUser.uid);
      setMyOrganizations(userOrgs);

      // Load public organizations
      const publicOrgs = await organizationService.getPublicOrganizations(20);
      setPublicOrganizations(publicOrgs);
    } catch (err) {
      console.error('Error loading organizations:', err);
      setError('Failed to load organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrganization = async (orgId: string) => {
    if (!currentUser) return;
    
    try {
      await organizationService.joinOrganization(orgId, currentUser.uid);
      await loadInitialData(); // Refresh data
      if (onJoinOrganization) {
        onJoinOrganization(orgId);
      }
    } catch (err) {
      console.error('Error joining organization:', err);
      setError('Failed to join organization. Please try again.');
    }
  };


  const renderOrganizationCard = (org: Organization, isMember: boolean = false) => (
    <Card key={org.id} sx={{ 
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(49, 130, 206, 0.3)',
        boxShadow: (theme) => theme.palette.mode === 'dark' 
          ? '0 4px 20px rgba(0,0,0,0.3)' 
          : '0 4px 20px rgba(0,0,0,0.1)',
      }
    }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar
            src={org.logo}
            sx={{ width: 56, height: 56 }}
          >
            {org.name.charAt(0)}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {org.name}
              </Typography>
              {org.isVerified && (
                <Verified sx={{ color: '#1976d2', fontSize: 20 }} />
              )}
              <Chip
                label={org.isPublic ? 'Public' : 'Private'}
                size="small"
                icon={org.isPublic ? <Public /> : <Lock />}
                variant="outlined"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {org.industry} • {org.location}
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              {org.description}
            </Typography>
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {org.memberCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Members
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
              {org.onlineCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Online
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {org.collaborationRating.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rating
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {org.totalCollaborations.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Collaborations
            </Typography>
          </Box>
        </Box>

        {/* AI Agents */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            AI Agents Used:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {org.aiAgentsUsed.map((agent) => (
              <Chip key={agent} label={agent} size="small" />
            ))}
          </Box>
        </Box>

        {/* Departments */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Departments ({org.departments.length}):
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {org.departments.slice(0, 3).map((dept) => (
              <Chip
                key={dept.id}
                label={`${dept.name} (${dept.memberCount})`}
                size="small"
                variant="outlined"
                icon={dept.isPrivate ? <Lock /> : <Group />}
              />
            ))}
            {org.departments.length > 3 && (
              <Chip
                label={`+${org.departments.length - 3} more`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {isMember ? (
            <>
              <Button
                variant="contained"
                startIcon={<Settings />}
                onClick={() => onManageOrganization?.(org.id)}
                fullWidth
              >
                Manage
              </Button>
              <Button
                variant="outlined"
                startIcon={<Analytics />}
                onClick={() => onViewOrganization?.(org.id)}
              >
                Analytics
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleJoinOrganization(org.id)}
                fullWidth
              >
                Join Organization
              </Button>
              <Button
                variant="outlined"
                onClick={() => onViewOrganization?.(org.id)}
              >
                View
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Organizations
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your company's AI collaboration and discover other organizations
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* My Organizations */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business />
            My Organizations ({myOrganizations.length})
          </Typography>
          
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Organization
          </Button>
        </Box>
        
        {myOrganizations.length > 0 ? (
          <Grid container spacing={3}>
            {myOrganizations.map((org) => (
              <Grid item xs={12} md={6} lg={4} key={org.id}>
                {renderOrganizationCard(org, true)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No Organizations Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create or join an organization to start collaborating with your team
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Your First Organization
            </Button>
          </Paper>
        )}
      </Box>

      {/* Public Organizations */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Public />
          Discover Organizations ({publicOrganizations.length})
        </Typography>
        
        <Grid container spacing={3}>
          {publicOrganizations.map((org) => (
            <Grid item xs={12} md={6} lg={4} key={org.id}>
              {renderOrganizationCard(org, false)}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Create Organization Dialog */}
      <CreateOrganizationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          setCreateDialogOpen(false);
          loadInitialData();
        }}
      />
    </Container>
  );
};

export default OrganizationsPage;

