/**
 * AdminBetaSignupsPage
 * 
 * Admin interface for managing Spark beta signups, including approving/rejecting
 * users and viewing signup statistics.
 */

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
  Avatar,
  IconButton,
  Divider,
  Alert,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  AdminPanelSettings,
  People,
  CheckCircle,
  Cancel,
  Email,
  Business,
  Person,
  Schedule,
  Refresh,
  ArrowBack,
  Edit,
  Visibility,
  Phone,
  LinkedIn,
  Computer,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { adminService, PendingSignup, ApprovalAction } from '../services/AdminService';
import { UserProfile } from '../types/profile';
import { BetaSignupData } from '../services/BetaSignupService';

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
      id={`beta-tabpanel-${index}`}
      aria-labelledby={`beta-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminBetaSignupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingSignups, setPendingSignups] = useState<PendingSignup[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserProfile[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    user: PendingSignup | null;
    adminNotes: string;
  }>({
    open: false,
    action: null,
    user: null,
    adminNotes: ''
  });
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    adminNotes: string;
  }>({
    open: false,
    action: null,
    adminNotes: ''
  });

  // Check admin access
  const isAdmin = adminService.isAdmin(currentUser?.email || '');
  
  useEffect(() => {
    if (!isAdmin) {
      navigate('/ui/dashboard');
      return;
    }
    
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 [Admin] Loading beta signup data...');
      
      const [pendingData, approvedData, rejectedData, statsData] = await Promise.all([
        adminService.getPendingSignups(),
        adminService.getApprovedUsers(),
        adminService.getRejectedUsers(),
        adminService.getSignupStats()
      ]);
      
      setPendingSignups(pendingData);
      setApprovedUsers(approvedData);
      setRejectedUsers(rejectedData);
      setStats(statsData);
      
      console.log('✅ [Admin] Data loaded successfully');
    } catch (error) {
      console.error('❌ [Admin] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleAction = async (action: 'approve' | 'reject') => {
    if (!actionDialog.user || !currentUser) return;
    
    try {
      console.log(`🔄 [Admin] ${action}ing user:`, actionDialog.user.email);
      
      const approvalAction: ApprovalAction = {
        userId: actionDialog.user.id,
        action,
        adminNotes: actionDialog.adminNotes,
        adminUserId: currentUser.uid
      };
      
      if (action === 'approve') {
        await adminService.approveUser(approvalAction);
      } else {
        await adminService.rejectUser(approvalAction);
      }
      
      // Refresh data
      await loadData();
      
      // Close dialog
      setActionDialog({ open: false, action: null, user: null, adminNotes: '' });
      
      console.log(`✅ [Admin] User ${action}ed successfully`);
    } catch (error) {
      console.error(`❌ [Admin] Error ${action}ing user:`, error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedUsers.length === 0 || !currentUser) return;
    
    try {
      console.log(`🔄 [Admin] Bulk ${action}ing ${selectedUsers.length} users`);
      
      if (action === 'approve') {
        await adminService.bulkApproveUsers(selectedUsers, currentUser.uid, bulkActionDialog.adminNotes);
      } else {
        await adminService.bulkRejectUsers(selectedUsers, currentUser.uid, bulkActionDialog.adminNotes);
      }
      
      // Refresh data
      await loadData();
      
      // Clear selections and close dialog
      setSelectedUsers([]);
      setBulkActionDialog({ open: false, action: null, adminNotes: '' });
      
      console.log(`✅ [Admin] Bulk ${action} completed successfully`);
    } catch (error) {
      console.error(`❌ [Admin] Error in bulk ${action}:`, error);
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(pendingSignups.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading beta signup data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/ui/admin/dashboard')}>
            <ArrowBack />
          </IconButton>
          <AdminPanelSettings sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Spark Beta Signups
          </Typography>
          <IconButton onClick={loadData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Stack>
        
        <Typography variant="body1" color="text.secondary">
          Manage beta access requests for Spark platform
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.pending}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Review
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.approved}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Cancel />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.rejected}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Signups
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
        >
          <Tab
            label={
              <Badge badgeContent={stats.pending} color="warning">
                Pending ({stats.pending})
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats.approved} color="success">
                Approved ({stats.approved})
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats.rejected} color="error">
                Rejected ({stats.rejected})
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* Pending Signups Tab */}
      <TabPanel value={currentTab} index={0}>
        {pendingSignups.length === 0 ? (
          <Alert severity="info">No pending signups to review.</Alert>
        ) : (
          <>
            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="body1">
                    {selectedUsers.length} user(s) selected
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => setBulkActionDialog({ open: true, action: 'approve', adminNotes: '' })}
                  >
                    Bulk Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => setBulkActionDialog({ open: true, action: 'reject', adminNotes: '' })}
                  >
                    Bulk Reject
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedUsers([])}
                  >
                    Clear Selection
                  </Button>
                </Stack>
              </Paper>
            )}

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.length === pendingSignups.length && pendingSignups.length > 0}
                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < pendingSignups.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Role & Organization</TableCell>
                    <TableCell>Why Spark Access</TableCell>
                    <TableCell>Additional Info</TableCell>
                    <TableCell>Signup Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingSignups.map((signup) => (
                    <TableRow key={signup.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.includes(signup.id)}
                          onChange={(e) => handleUserSelection(signup.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar>
                            {signup.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {signup.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {signup.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={1}>
                          <Chip
                            label={signup.role}
                            size="small"
                            icon={<Person />}
                            variant="outlined"
                          />
                          <Typography variant="body2" color="text.secondary">
                            <Business sx={{ fontSize: 14, mr: 0.5 }} />
                            {signup.organization}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {signup.whyAccess}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={1}>
                          {signup.currentAiTools && (
                            <Typography variant="body2" color="text.secondary">
                              <Computer sx={{ fontSize: 14, mr: 0.5 }} />
                              {signup.currentAiTools}
                            </Typography>
                          )}
                          {signup.socialProfile && (
                            <Typography variant="body2" color="text.secondary">
                              <LinkedIn sx={{ fontSize: 14, mr: 0.5 }} />
                              <a href={signup.socialProfile} target="_blank" rel="noopener noreferrer">
                                Profile
                              </a>
                            </Typography>
                          )}
                          {signup.onboardingCall && (
                            <Chip
                              label="Wants onboarding call"
                              size="small"
                              icon={<Phone />}
                              color="info"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(signup.signupAt)}
                        </Typography>
                        <Chip
                          label={signup.signupSource}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Approve">
                            <IconButton
                              color="success"
                              onClick={() => setActionDialog({
                                open: true,
                                action: 'approve',
                                user: signup,
                                adminNotes: ''
                              })}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              color="error"
                              onClick={() => setActionDialog({
                                open: true,
                                action: 'reject',
                                user: signup,
                                adminNotes: ''
                              })}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </TabPanel>

      {/* Approved Users Tab */}
      <TabPanel value={currentTab} index={1}>
        {approvedUsers.length === 0 ? (
          <Alert severity="info">No approved users yet.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role & Organization</TableCell>
                  <TableCell>Approved By</TableCell>
                  <TableCell>Approved Date</TableCell>
                  <TableCell>Admin Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar src={user.avatar}>
                          {user.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.name || user.displayName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1}>
                        <Chip
                          label={user.role || 'Unknown'}
                          size="small"
                          icon={<Person />}
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          <Business sx={{ fontSize: 14, mr: 0.5 }} />
                          {user.organization || 'Unknown'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.approvedBy || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.approvedAt ? formatDate(user.approvedAt) : 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.adminNotes || 'No notes'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Rejected Users Tab */}
      <TabPanel value={currentTab} index={2}>
        {rejectedUsers.length === 0 ? (
          <Alert severity="info">No rejected users.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role & Organization</TableCell>
                  <TableCell>Rejected By</TableCell>
                  <TableCell>Rejected Date</TableCell>
                  <TableCell>Admin Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rejectedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar src={user.avatar}>
                          {user.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.name || user.displayName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1}>
                        <Chip
                          label={user.role || 'Unknown'}
                          size="small"
                          icon={<Person />}
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          <Business sx={{ fontSize: 14, mr: 0.5 }} />
                          {user.organization || 'Unknown'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.rejectedBy || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.rejectedAt ? formatDate(user.rejectedAt) : 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.adminNotes || 'No notes'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Single Action Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ open: false, action: null, user: null, adminNotes: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.action === 'approve' ? 'Approve' : 'Reject'} User
        </DialogTitle>
        <DialogContent>
          {actionDialog.user && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {actionDialog.user.name} ({actionDialog.user.email})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {actionDialog.user.role} at {actionDialog.user.organization}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Notes (Optional)"
            value={actionDialog.adminNotes}
            onChange={(e) => setActionDialog(prev => ({ ...prev, adminNotes: e.target.value }))}
            placeholder="Add any notes about this decision..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setActionDialog({ open: false, action: null, user: null, adminNotes: '' })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionDialog.action === 'approve' ? 'success' : 'error'}
            onClick={() => handleSingleAction(actionDialog.action!)}
          >
            {actionDialog.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog
        open={bulkActionDialog.open}
        onClose={() => setBulkActionDialog({ open: false, action: null, adminNotes: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bulk {bulkActionDialog.action === 'approve' ? 'Approve' : 'Reject'} Users
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to {bulkActionDialog.action} {selectedUsers.length} user(s)?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Notes (Optional)"
            value={bulkActionDialog.adminNotes}
            onChange={(e) => setBulkActionDialog(prev => ({ ...prev, adminNotes: e.target.value }))}
            placeholder="Add any notes about this bulk action..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBulkActionDialog({ open: false, action: null, adminNotes: '' })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={bulkActionDialog.action === 'approve' ? 'success' : 'error'}
            onClick={() => handleBulkAction(bulkActionDialog.action!)}
          >
            {bulkActionDialog.action === 'approve' ? 'Approve All' : 'Reject All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminBetaSignupsPage;

