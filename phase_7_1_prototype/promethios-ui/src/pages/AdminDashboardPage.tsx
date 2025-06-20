import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  AdminPanelSettings,
  People,
  Business,
  Security,
  Analytics,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Settings,
  Visibility,
  Block,
  Edit,
  Delete,
  Download,
  Upload,
  Notifications,
  TrendingUp,
  TrendingDown,
  Dashboard,
  Storage,
  CloudUpload,
  Shield,
  VerifiedUser,
  Group,
  SupervisorAccount,
} from '@mui/icons-material';

interface AdminMetrics {
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
  };
  organizations: {
    total: number;
    enterprise: number;
    professional: number;
    starter: number;
  };
  system: {
    uptime: string;
    performance: number;
    storage: number;
    apiCalls: number;
  };
  security: {
    threats: number;
    violations: number;
    compliance: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  organization: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    users: {
      total: 1247,
      active: 1156,
      inactive: 91,
      admins: 12,
    },
    organizations: {
      total: 89,
      enterprise: 23,
      professional: 41,
      starter: 25,
    },
    system: {
      uptime: '99.9%',
      performance: 94,
      storage: 67,
      apiCalls: 2847392,
    },
    security: {
      threats: 3,
      violations: 7,
      compliance: 98,
    },
  });

  const [recentUsers, setRecentUsers] = useState<User[]>([
    {
      id: '1',
      email: 'wesheets@hotmail.com',
      name: 'Wesley Sheets',
      role: 'admin',
      organization: 'Promethios',
      status: 'active',
      lastLogin: '2 minutes ago',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      email: 'john.doe@enterprise.com',
      name: 'John Doe',
      role: 'user',
      organization: 'Enterprise Corp',
      status: 'active',
      lastLogin: '1 hour ago',
      createdAt: '2024-06-10',
    },
    {
      id: '3',
      email: 'jane.smith@techcorp.com',
      name: 'Jane Smith',
      role: 'user',
      organization: 'TechCorp',
      status: 'inactive',
      lastLogin: '3 days ago',
      createdAt: '2024-05-22',
    },
  ]);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#f59e0b';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#8b5cf6';
      case 'user': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#a0aec0' }}>
          System administration and user management
        </Typography>
      </Box>

      {/* Main Metrics Grid */}
      <Grid container spacing={3} mb={4}>
        {/* Users Overview */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#3182ce', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Users</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Total Registered</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics.users.total.toLocaleString()}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${metrics.users.active} Active`} 
                  size="small" 
                  sx={{ backgroundColor: '#10b981', color: 'white' }}
                />
                <Chip 
                  label={`${metrics.users.admins} Admins`} 
                  size="small" 
                  sx={{ backgroundColor: '#8b5cf6', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(metrics.users.active / metrics.users.total) * 100}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' }
                }}
              />
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/ui/admin/users')}
                sx={{ color: '#3182ce' }}
              >
                Manage Users
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Organizations */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#10b981', mr: 2 }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Organizations</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Active Accounts</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics.organizations.total}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${metrics.organizations.enterprise} Enterprise`} 
                  size="small" 
                  sx={{ backgroundColor: '#f59e0b', color: 'white' }}
                />
                <Chip 
                  label={`${metrics.organizations.professional} Pro`} 
                  size="small" 
                  sx={{ backgroundColor: '#3b82f6', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={85}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' }
                }}
              />
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/ui/admin/organizations')}
                sx={{ color: '#10b981' }}
              >
                View Organizations
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* System Performance */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#f59e0b', mr: 2 }}>
                  <Analytics />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Performance</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>System Health</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics.system.performance}%
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`Uptime: ${metrics.system.uptime}`} 
                  size="small" 
                  sx={{ backgroundColor: '#4a5568', color: 'white' }}
                />
                <Chip 
                  label={`Storage: ${metrics.system.storage}%`} 
                  size="small" 
                  sx={{ backgroundColor: '#4a5568', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics.system.performance}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#f59e0b' }
                }}
              />
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/ui/admin/system')}
                sx={{ color: '#f59e0b' }}
              >
                System Status
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Security */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#ef4444', mr: 2 }}>
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Security</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Compliance Score</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics.security.compliance}%
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${metrics.security.threats} Threats`} 
                  size="small" 
                  sx={{ backgroundColor: '#ef4444', color: 'white' }}
                />
                <Chip 
                  label={`${metrics.security.violations} Violations`} 
                  size="small" 
                  sx={{ backgroundColor: '#f59e0b', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics.security.compliance}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#ef4444' }
                }}
              />
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/ui/admin/security')}
                sx={{ color: '#ef4444' }}
              >
                Security Center
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Recent Users */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Recent Users
                </Typography>
                <IconButton size="small" sx={{ color: '#a0aec0' }}>
                  <Refresh />
                </IconButton>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>User</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Role</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Organization</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Status</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Last Login</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                              {user.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {user.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderColor: '#4a5568' }}>
                          <Chip 
                            label={user.role} 
                            size="small"
                            sx={{ 
                              backgroundColor: getRoleColor(user.role),
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          {user.organization}
                        </TableCell>
                        <TableCell sx={{ borderColor: '#4a5568' }}>
                          <Chip 
                            label={user.status} 
                            size="small"
                            sx={{ 
                              backgroundColor: getStatusColor(user.status),
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>
                          {user.lastLogin}
                        </TableCell>
                        <TableCell sx={{ borderColor: '#4a5568' }}>
                          <IconButton size="small" sx={{ color: '#3182ce' }}>
                            <Edit />
                          </IconButton>
                          <IconButton size="small" sx={{ color: '#ef4444' }}>
                            <Block />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Admin Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<People />}
                  sx={{ 
                    borderColor: '#3182ce', 
                    color: '#3182ce',
                    '&:hover': { borderColor: '#2c5aa0', backgroundColor: '#3182ce20' }
                  }}
                >
                  Add New User
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Business />}
                  sx={{ 
                    borderColor: '#10b981', 
                    color: '#10b981',
                    '&:hover': { borderColor: '#059669', backgroundColor: '#10b98120' }
                  }}
                >
                  Create Organization
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                  sx={{ 
                    borderColor: '#8b5cf6', 
                    color: '#8b5cf6',
                    '&:hover': { borderColor: '#7c3aed', backgroundColor: '#8b5cf620' }
                  }}
                >
                  Export Data
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Security />}
                  sx={{ 
                    borderColor: '#ef4444', 
                    color: '#ef4444',
                    '&:hover': { borderColor: '#dc2626', backgroundColor: '#ef444420' }
                  }}
                >
                  Security Audit
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Settings />}
                  sx={{ 
                    borderColor: '#f59e0b', 
                    color: '#f59e0b',
                    '&:hover': { borderColor: '#d97706', backgroundColor: '#f59e0b20' }
                  }}
                >
                  System Settings
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboardPage;

