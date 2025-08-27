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

interface Organization {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  description: string;
  memberCount: number;
  onlineCount: number;
  isVerified: boolean;
  isPublic: boolean;
  industry: string;
  location: string;
  aiAgentsUsed: string[];
  collaborationRating: number;
  totalCollaborations: number;
  departments: Department[];
  recentActivity: string[];
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
  onViewOrganization?: (orgId: string) => void;
  onJoinOrganization?: (orgId: string) => void;
  onManageOrganization?: (orgId: string) => void;
  currentUserId?: string;
}

const OrganizationsPage: React.FC<OrganizationsPageProps> = ({
  onViewOrganization,
  onJoinOrganization,
  onManageOrganization,
  currentUserId = 'current-user',
}) => {
  const [myOrganizations, setMyOrganizations] = useState<Organization[]>([]);
  const [publicOrganizations, setPublicOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data
  const mockMyOrganizations: Organization[] = [
    {
      id: '1',
      name: 'Promethios',
      domain: 'promethios.com',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150',
      description: 'AI collaboration platform revolutionizing human-AI partnerships',
      memberCount: 47,
      onlineCount: 12,
      isVerified: true,
      isPublic: false,
      industry: 'Technology',
      location: 'San Francisco, CA',
      aiAgentsUsed: ['Claude', 'OpenAI', 'Gemini'],
      collaborationRating: 4.8,
      totalCollaborations: 1247,
      departments: [
        { id: '1', name: 'Engineering', memberCount: 15, onlineCount: 5, aiAgentsUsed: ['OpenAI', 'Claude'], isPrivate: false },
        { id: '2', name: 'Product', memberCount: 8, onlineCount: 3, aiAgentsUsed: ['Claude', 'Gemini'], isPrivate: false },
        { id: '3', name: 'Marketing', memberCount: 12, onlineCount: 2, aiAgentsUsed: ['Claude', 'OpenAI'], isPrivate: false },
        { id: '4', name: 'Executive', memberCount: 5, onlineCount: 1, aiAgentsUsed: ['Claude'], isPrivate: true },
      ],
      recentActivity: [
        'Sarah Chen shared AI strategy session results',
        'Engineering team completed code review with GPT-4',
        'Marketing launched new AI-powered campaign',
      ],
    },
  ];

  const mockPublicOrganizations: Organization[] = [
    {
      id: '2',
      name: 'TechCorp',
      domain: 'techcorp.com',
      logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150',
      description: 'Leading technology company embracing AI collaboration',
      memberCount: 234,
      onlineCount: 45,
      isVerified: true,
      isPublic: true,
      industry: 'Technology',
      location: 'Seattle, WA',
      aiAgentsUsed: ['OpenAI', 'Claude'],
      collaborationRating: 4.6,
      totalCollaborations: 5678,
      departments: [
        { id: '1', name: 'Engineering', memberCount: 89, onlineCount: 23, aiAgentsUsed: ['OpenAI'], isPrivate: false },
        { id: '2', name: 'Product', memberCount: 34, onlineCount: 8, aiAgentsUsed: ['Claude'], isPrivate: false },
        { id: '3', name: 'Marketing', memberCount: 45, onlineCount: 7, aiAgentsUsed: ['OpenAI', 'Claude'], isPrivate: false },
      ],
      recentActivity: [
        'Launched new AI product features',
        'Engineering team achieved 95% AI collaboration adoption',
        'Product team completed AI-assisted roadmap planning',
      ],
    },
    {
      id: '3',
      name: 'Creative Studio',
      domain: 'creativestudio.com',
      logo: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=150',
      description: 'Design agency pioneering AI-human creative collaboration',
      memberCount: 67,
      onlineCount: 18,
      isVerified: false,
      isPublic: true,
      industry: 'Design',
      location: 'New York, NY',
      aiAgentsUsed: ['Claude', 'Gemini'],
      collaborationRating: 4.9,
      totalCollaborations: 892,
      departments: [
        { id: '1', name: 'Design', memberCount: 23, onlineCount: 8, aiAgentsUsed: ['Claude'], isPrivate: false },
        { id: '2', name: 'Strategy', memberCount: 12, onlineCount: 4, aiAgentsUsed: ['Claude', 'Gemini'], isPrivate: false },
        { id: '3', name: 'Client Services', memberCount: 15, onlineCount: 3, aiAgentsUsed: ['Claude'], isPrivate: false },
      ],
      recentActivity: [
        'Won award for AI-assisted brand campaign',
        'Design team showcased AI collaboration workflow',
        'Strategy team published AI creativity research',
      ],
    },
    {
      id: '4',
      name: 'Research Institute',
      domain: 'research.edu',
      logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      description: 'Academic institution advancing AI research and collaboration',
      memberCount: 156,
      onlineCount: 34,
      isVerified: true,
      isPublic: true,
      industry: 'Education',
      location: 'Boston, MA',
      aiAgentsUsed: ['Gemini', 'Claude', 'OpenAI'],
      collaborationRating: 4.7,
      totalCollaborations: 2341,
      departments: [
        { id: '1', name: 'AI Research', memberCount: 45, onlineCount: 12, aiAgentsUsed: ['Gemini', 'OpenAI'], isPrivate: false },
        { id: '2', name: 'Data Science', memberCount: 38, onlineCount: 9, aiAgentsUsed: ['Gemini'], isPrivate: false },
        { id: '3', name: 'Ethics', memberCount: 23, onlineCount: 6, aiAgentsUsed: ['Claude'], isPrivate: false },
      ],
      recentActivity: [
        'Published breakthrough AI collaboration study',
        'AI Research team achieved new performance benchmarks',
        'Ethics team released AI collaboration guidelines',
      ],
    },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 800));
      setMyOrganizations(mockMyOrganizations);
      setPublicOrganizations(mockPublicOrganizations);
    } catch (err) {
      setError('Failed to load organizations');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrganization = (orgId: string) => {
    console.log('Joining organization:', orgId);
    onJoinOrganization?.(orgId);
  };

  const renderOrganizationCard = (org: Organization, isMember: boolean = false) => (
    <Card key={org.id} sx={{ 
      height: '100%',
      backgroundColor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      '&:hover': {
        borderColor: 'primary.main',
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
          
          <Button variant="contained" startIcon={<Add />}>
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
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No Organizations Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create or join an organization to start collaborating with your team
            </Typography>
            <Button variant="contained" startIcon={<Add />}>
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
    </Container>
  );
};

export default OrganizationsPage;

