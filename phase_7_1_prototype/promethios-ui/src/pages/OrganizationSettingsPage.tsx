import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApiService } from '../services/authApiService';
import { governanceDashboardBackendService } from '../services/governanceDashboardBackendService';
import { trustBackendService } from '../services/trustBackendService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Avatar,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Tab,
  Tabs,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Business,
  People,
  Settings,
  Add,
  Edit,
  Delete,
  MoreVert,
  PersonAdd,
  AdminPanelSettings,
  Security,
  Payment,
  Analytics,
  Notifications,
  Email,
  Phone,
  LocationOn,
  Language,
  Public,
  Lock,
  Group,
  SupervisorAccount,
  AccountBalance,
  CreditCard,
  Receipt,
  TrendingUp,
  Warning,
  CheckCircle,
  Cancel,
  Save
} from '@mui/icons-material';

interface Organization {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  description: string;
  logo: string;
  plan: 'starter' | 'professional' | 'enterprise';
  billingEmail: string;
  adminEmail: string;
  createdAt: string;
  settings: {
    allowSelfRegistration: boolean;
    requireEmailVerification: boolean;
    enableSSO: boolean;
    enforcePasswordPolicy: boolean;
    sessionTimeout: number;
    maxUsers: number;
    dataRetentionDays: number;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  joinedAt: string;
  avatar: string;
  permissions: string[];
}

interface BillingInfo {
  plan: string;
  status: 'active' | 'past_due' | 'canceled';
  nextBillingDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    downloadUrl: string;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`organization-tabpanel-${index}`}
      aria-labelledby={`organization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const OrganizationSettingsPage: React.FC = () => {
  // Authentication context
  const { currentUser } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [governanceMetrics, setGovernanceMetrics] = useState<any>(null);

  // Enhanced organization data with real backend integration
  const [organization, setOrganization] = useState<Organization>({
    id: 'org-001',
    name: 'Promethios Corp',
    domain: 'promethios.com',
    industry: 'Technology',
    size: '51-200 employees',
    location: 'San Francisco, CA',
    website: 'https://promethios.com',
    description: 'Leading AI governance and trust platform for enterprise applications.',
    logo: '/api/placeholder/100/100',
    plan: 'professional',
    billingEmail: 'billing@promethios.com',
    adminEmail: 'admin@promethios.com',
    createdAt: '2024-01-15T10:30:00Z',
    settings: {
      allowSelfRegistration: true,
      requireEmailVerification: true,
      enableSSO: false,
      enforcePasswordPolicy: true,
      sessionTimeout: 480, // 8 hours
      maxUsers: 100,
      dataRetentionDays: 365
    }
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 'user-001',
      name: 'Jake Renken',
      email: 'wesheets@hotmail.com',
      role: 'Admin',
      department: 'AI Governance',
      status: 'active',
      lastLogin: '2025-06-20T14:30:00Z',
      joinedAt: '2024-01-15T10:30:00Z',
      avatar: '/api/placeholder/40/40',
      permissions: ['admin', 'read:all', 'write:all', 'delete:all']
    },
    {
      id: 'user-002',
      name: 'Sarah Chen',
      email: 'sarah.chen@promethios.com',
      role: 'Trust Analyst',
      department: 'AI Governance',
      status: 'active',
      lastLogin: '2025-06-20T12:15:00Z',
      joinedAt: '2024-02-01T09:00:00Z',
      avatar: '/api/placeholder/40/40',
      permissions: ['read:metrics', 'write:reports', 'read:agents']
    },
    {
      id: 'user-003',
      name: 'Michael Rodriguez',
      email: 'michael.r@promethios.com',
      role: 'Policy Manager',
      department: 'Compliance',
      status: 'active',
      lastLogin: '2025-06-19T16:45:00Z',
      joinedAt: '2024-03-15T14:20:00Z',
      avatar: '/api/placeholder/40/40',
      permissions: ['read:policies', 'write:policies', 'read:violations']
    },
    {
      id: 'user-004',
      name: 'Emily Watson',
      email: 'emily.watson@promethios.com',
      role: 'Developer',
      department: 'Engineering',
      status: 'pending',
      lastLogin: '',
      joinedAt: '2025-06-18T11:30:00Z',
      avatar: '/api/placeholder/40/40',
      permissions: ['read:agents', 'write:agents']
    }
  ]);

  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    plan: 'Professional',
    status: 'active',
    nextBillingDate: '2025-07-20T00:00:00Z',
    amount: 299,
    currency: 'USD',
    paymentMethod: '**** **** **** 4242',
    invoices: [
      {
        id: 'inv-001',
        date: '2025-06-20T00:00:00Z',
        amount: 299,
        status: 'paid',
        downloadUrl: '#'
      },
      {
        id: 'inv-002',
        date: '2025-05-20T00:00:00Z',
        amount: 299,
        status: 'paid',
        downloadUrl: '#'
      },
      {
        id: 'inv-003',
        date: '2025-04-20T00:00:00Z',
        amount: 299,
        status: 'paid',
        downloadUrl: '#'
      }
    ]
  });

  // Real data loading functions with authentication
  const loadOrganizationData = useCallback(async () => {
    if (!currentUser) {
      setAuthError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);

      // Load organization data, team members, and governance metrics
      const [orgData, teamData, govMetrics] = await Promise.all([
        authApiService.getUserOrganization(currentUser),
        authApiService.getOrganizationMembers(currentUser),
        governanceDashboardBackendService.getOrganizationGovernanceMetrics(currentUser)
      ]);

      if (orgData) {
        setOrganization(prev => ({ ...prev, ...orgData }));
      }
      
      if (teamData) {
        setTeamMembers(teamData);
      }

      if (govMetrics) {
        setGovernanceMetrics(govMetrics);
      }

    } catch (error) {
      console.error('Failed to load organization data:', error);
      setAuthError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load data on component mount and user change
  useEffect(() => {
    loadOrganizationData();
  }, [loadOrganizationData]);

  // Enhanced save function with notifications
  const handleSaveOrganization = async () => {
    if (!currentUser) {
      setAuthError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);

      // Save organization data with governance integration
      await authApiService.updateOrganization(currentUser, organization);
      
      // Trigger governance policy update if needed
      if (governanceMetrics) {
        await governanceDashboardBackendService.updateOrganizationPolicies(currentUser, organization.settings);
      }

      setSaveSuccess(true);
      setEditMode(false);
      
      // Auto-hide success message
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Failed to save organization:', error);
      setAuthError('Failed to save organization settings');
    } finally {
      setLoading(false);
    }
  };

  // Authentication validation
  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <AlertTitle>Authentication Required</AlertTitle>
          Please log in to access organization settings. This page requires admin authentication to manage organization data.
        </Alert>
      </Box>
    );
  }

  if (loading && !organization.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Organization Settings
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInviteMember = () => {
    setShowInviteDialog(true);
  };

  const handleDeleteMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMember = () => {
    if (selectedMember) {
      setTeamMembers(prev => prev.filter(member => member.id !== selectedMember.id));
      setShowDeleteDialog(false);
      setSelectedMember(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return <AdminPanelSettings />;
      case 'manager': return <SupervisorAccount />;
      default: return <Group />;
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Organization Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0' }}>
          Manage your organization profile, team members, billing information, and governance settings
        </Typography>
        
        {/* Success/Error Messages */}
        {saveSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Organization settings saved successfully!
          </Alert>
        )}
        {authError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {authError}
          </Alert>
        )}
      </Box>

      {/* Organization Overview Card */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Tooltip title="Organization logo - click to upload new logo">
              <Avatar
                src={organization.logo}
                sx={{ width: 80, height: 80, mr: 3, cursor: 'pointer' }}
              />
            </Tooltip>
            <Box sx={{ flex: 1 }}>
              <Tooltip title="Organization name and primary identifier">
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  {organization.name}
                </Typography>
              </Tooltip>
              <Tooltip title="Industry classification and organization size">
                <Typography variant="body1" sx={{ color: '#a0aec0', mb: 1 }}>
                  {organization.industry} • {organization.size}
                </Typography>
              </Tooltip>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Tooltip title="Current subscription plan level">
                  <Chip
                    label={organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
                  sx={{ backgroundColor: '#3b82f6', color: 'white' }}
                />
                <Chip
                  label={`${teamMembers.length} members`}
                  variant="outlined"
                  sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Created {formatDate(organization.createdAt)}
              </Typography>
            </Box>
            <Box>
              <Button
                variant={editMode ? "outlined" : "contained"}
                startIcon={editMode ? <Cancel /> : <Edit />}
                onClick={editMode ? () => setEditMode(false) : () => setEditMode(true)}
                sx={{
                  backgroundColor: editMode ? 'transparent' : '#3b82f6',
                  borderColor: '#3b82f6',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: editMode ? '#3b82f6' : '#2563eb'
                  }
                }}
              >
                {editMode ? 'Cancel' : 'Edit Organization'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
              '& .MuiTab-root': { 
                color: '#a0aec0',
                '&.Mui-selected': { color: '#3b82f6' }
              }
            }}
          >
            <Tab icon={<Business />} label="Organization Info" />
            <Tab icon={<People />} label="Team Members" />
            <Tab icon={<Settings />} label="Security & Settings" />
            <Tab icon={<Payment />} label="Billing & Plans" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Organization Information */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Organization Name"
                value={organization.name}
                onChange={(e) => setOrganization(prev => ({ ...prev, name: e.target.value }))}
                disabled={!editMode}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white !important' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Domain"
                value={organization.domain}
                onChange={(e) => setOrganization(prev => ({ ...prev, domain: e.target.value }))}
                disabled={!editMode}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white !important' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel sx={{ color: '#a0aec0' }}>Industry</InputLabel>
                <Select
                  value={organization.industry}
                  onChange={(e) => setOrganization(prev => ({ ...prev, industry: e.target.value }))}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                  }}
                >
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="Healthcare">Healthcare</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Education">Education</MenuItem>
                  <MenuItem value="Government">Government</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel sx={{ color: '#a0aec0' }}>Company Size</InputLabel>
                <Select
                  value={organization.size}
                  onChange={(e) => setOrganization(prev => ({ ...prev, size: e.target.value }))}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                  }}
                >
                  <MenuItem value="1-10 employees">1-10 employees</MenuItem>
                  <MenuItem value="11-50 employees">11-50 employees</MenuItem>
                  <MenuItem value="51-200 employees">51-200 employees</MenuItem>
                  <MenuItem value="201-500 employees">201-500 employees</MenuItem>
                  <MenuItem value="500+ employees">500+ employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={organization.location}
                onChange={(e) => setOrganization(prev => ({ ...prev, location: e.target.value }))}
                disabled={!editMode}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white !important' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                value={organization.website}
                onChange={(e) => setOrganization(prev => ({ ...prev, website: e.target.value }))}
                disabled={!editMode}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white !important' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={organization.description}
                onChange={(e) => setOrganization(prev => ({ ...prev, description: e.target.value }))}
                disabled={!editMode}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white !important' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Billing Email"
                value={organization.billingEmail}
                onChange={(e) => setOrganization(prev => ({ ...prev, billingEmail: e.target.value }))}
                disabled={!editMode}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white !important' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Admin Email"
                value={organization.adminEmail}
                onChange={(e) => setOrganization(prev => ({ ...prev, adminEmail: e.target.value }))}
                disabled={!editMode}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white !important' }
                }}
              />
            </Grid>

            {editMode && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setEditMode(false)}
                    sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveOrganization}
                    disabled={loading}
                    sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Team Members */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              Team Members ({teamMembers.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={handleInviteMember}
              sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
            >
              Invite Member
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Member</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Role</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Department</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Status</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Last Login</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={member.avatar} sx={{ width: 40, height: 40 }} />
                        <Box>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {member.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            {member.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRoleIcon(member.role)}
                        <Typography sx={{ color: 'white' }}>{member.role}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {member.department}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Chip
                        label={member.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(member.status),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>
                      {formatDate(member.lastLogin)}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <IconButton
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ color: '#a0aec0' }}
                      >
                        <MoreVert />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        PaperProps={{
                          sx: { backgroundColor: '#2d3748', color: 'white' }
                        }}
                      >
                        <MenuItem onClick={() => setAnchorEl(null)}>
                          <Edit sx={{ mr: 1 }} /> Edit
                        </MenuItem>
                        <MenuItem 
                          onClick={() => {
                            handleDeleteMember(member);
                            setAnchorEl(null);
                          }}
                          sx={{ color: '#ef4444' }}
                        >
                          <Delete sx={{ mr: 1 }} /> Remove
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Security & Settings */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Security Settings
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'white' }}>Allow self-registration</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: '#a0aec0' }}>Users can register with your organization domain</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={organization.settings.allowSelfRegistration}
                          onChange={(e) => setOrganization(prev => ({
                            ...prev,
                            settings: { ...prev.settings, allowSelfRegistration: e.target.checked }
                          }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'white' }}>Require email verification</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: '#a0aec0' }}>New users must verify their email address</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={organization.settings.requireEmailVerification}
                          onChange={(e) => setOrganization(prev => ({
                            ...prev,
                            settings: { ...prev.settings, requireEmailVerification: e.target.checked }
                          }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'white' }}>Enable Single Sign-On (SSO)</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: '#a0aec0' }}>Allow users to sign in with SAML/OAuth</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={organization.settings.enableSSO}
                          onChange={(e) => setOrganization(prev => ({
                            ...prev,
                            settings: { ...prev.settings, enableSSO: e.target.checked }
                          }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'white' }}>Enforce password policy</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: '#a0aec0' }}>Require strong passwords for all users</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={organization.settings.enforcePasswordPolicy}
                          onChange={(e) => setOrganization(prev => ({
                            ...prev,
                            settings: { ...prev.settings, enforcePasswordPolicy: e.target.checked }
                          }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                    Session Timeout (minutes)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={organization.settings.sessionTimeout}
                    onChange={(e) => setOrganization(prev => ({
                      ...prev,
                      settings: { ...prev.settings, sessionTimeout: parseInt(e.target.value) }
                    }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#4a5568' },
                        '&:hover fieldset': { borderColor: '#3b82f6' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                      },
                      '& .MuiInputLabel-root': { color: '#a0aec0' },
                      '& .MuiInputBase-input': { color: 'white !important' }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                    Data Retention (days)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={organization.settings.dataRetentionDays}
                    onChange={(e) => setOrganization(prev => ({
                      ...prev,
                      settings: { ...prev.settings, dataRetentionDays: parseInt(e.target.value) }
                    }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#4a5568' },
                        '&:hover fieldset': { borderColor: '#3b82f6' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                      },
                      '& .MuiInputLabel-root': { color: '#a0aec0' },
                      '& .MuiInputBase-input': { color: 'white !important' }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Billing & Plans */}
          <Grid container spacing={3}>
            {/* Current Plan */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Current Plan
              </Typography>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {billingInfo.plan}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#a0aec0' }}>
                        ${billingInfo.amount}/{billingInfo.currency} per month
                      </Typography>
                    </Box>
                    <Chip
                      label={billingInfo.status}
                      sx={{
                        backgroundColor: billingInfo.status === 'active' ? '#10b981' : '#f59e0b',
                        color: 'white',
                        textTransform: 'capitalize'
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    Next billing date: {formatDate(billingInfo.nextBillingDate)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    Payment method: {billingInfo.paymentMethod}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                    >
                      Change Plan
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                    >
                      Update Payment
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Usage Stats */}
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Usage This Month
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Active Users
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#3b82f6' }}>
                      {teamMembers.filter(m => m.status === 'active').length}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      API Calls
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#10b981' }}>
                      12.4K
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Storage Used
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#f59e0b' }}>
                      2.1GB
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Billing History */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Billing History
              </Typography>
              <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Invoice</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Date</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Amount</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Status</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billingInfo.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          {invoice.id}
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          {formatDate(invoice.date)}
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          ${invoice.amount}
                        </TableCell>
                        <TableCell sx={{ borderColor: '#4a5568' }}>
                          <Chip
                            label={invoice.status}
                            size="small"
                            sx={{
                              backgroundColor: invoice.status === 'paid' ? '#10b981' : '#f59e0b',
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: '#4a5568' }}>
                          <Button
                            size="small"
                            sx={{ color: '#3b82f6' }}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                placeholder="colleague@company.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white !important' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Role</InputLabel>
                <Select
                  defaultValue="member"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                  }}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department"
                placeholder="e.g., AI Governance"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white !important' }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInviteDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Member Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>Remove Team Member</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
            Are you sure you want to remove {selectedMember?.name} from your organization?
          </Typography>
          <Alert severity="warning" sx={{ backgroundColor: '#92400e', color: 'white' }}>
            <AlertTitle>Warning</AlertTitle>
            This action cannot be undone. The user will lose access to all organization resources.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmDeleteMember}
            sx={{ backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' } }}
          >
            Remove Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationSettingsPage;

