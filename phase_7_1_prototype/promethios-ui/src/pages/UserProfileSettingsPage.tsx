import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApiService } from '../services/authApiService';
import { governanceDashboardBackendService } from '../services/governanceDashboardBackendService';
import { darkThemeStyles } from '../styles/darkThemeStyles';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
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
  LinearProgress,
  Slider,
  Backdrop,
  CircularProgress
} from '@mui/material';
import {
  Edit,
  PhotoCamera,
  Save,
  Cancel,
  Security,
  Notifications,
  Person,
  Email,
  Phone,
  LocationOn,
  Business,
  CalendarToday,
  Language,
  Visibility,
  VisibilityOff,
  Delete,
  Add,
  Verified,
  Warning,
  CloudUpload,
  CropFree,
  RotateLeft,
  RotateRight,
  ZoomIn,
  ZoomOut,
  Check,
  Close
} from '@mui/icons-material';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar: string;
  phone: string;
  location: string;
  organization: string;
  department: string;
  jobTitle: string;
  bio: string;
  timezone: string;
  language: string;
  dateJoined: string;
  lastLogin: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  profileVisibility: 'public' | 'organization' | 'private';
  roles: string[];
  permissions: string[];
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  sessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
  apiKeys: Array<{
    id: string;
    name: string;
    created: string;
    lastUsed: string;
    permissions: string[];
  }>;
}

interface PhotoUploadState {
  uploading: boolean;
  progress: number;
  selectedFile: File | null;
  previewUrl: string | null;
  cropDialogOpen: boolean;
  dragOver: boolean;
}

interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UserProfileSettingsPage: React.FC = () => {
  // Authentication context
  const { currentUser } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileVerificationStatus, setProfileVerificationStatus] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  // Photo upload state
  const [photoUpload, setPhotoUpload] = useState<PhotoUploadState>({
    uploading: false,
    progress: 0,
    selectedFile: null,
    previewUrl: null,
    cropDialogOpen: false,
    dragOver: false
  });

  const [cropSettings, setCropSettings] = useState<CropSettings>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    scale: 1,
    rotation: 0
  });

  // Mock user profile data
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user-001',
    email: 'wesheets@hotmail.com',
    firstName: 'Jake',
    lastName: 'Renken',
    displayName: 'Jake Renken',
    avatar: '/api/placeholder/150/150',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    organization: 'Promethios Corp',
    department: 'AI Governance',
    jobTitle: 'Senior AI Governance Specialist',
    bio: 'Passionate about responsible AI development and governance frameworks. Experienced in building scalable AI systems with strong ethical foundations.',
    timezone: 'America/Los_Angeles',
    language: 'en-US',
    dateJoined: '2024-01-15T10:30:00Z',
    lastLogin: '2025-06-20T14:30:00Z',
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: true,
    profileVisibility: 'organization',
    roles: ['AI Governance Specialist', 'Trust Metrics Analyst'],
    permissions: ['read:agents', 'write:policies', 'read:reports', 'manage:attestations']
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    sessions: [
      {
        id: 'session-001',
        device: 'Chrome on macOS',
        location: 'San Francisco, CA',
        lastActive: '2025-06-20T14:30:00Z',
        current: true
      },
      {
        id: 'session-002',
        device: 'Safari on iPhone',
        location: 'San Francisco, CA',
        lastActive: '2025-06-19T22:15:00Z',
        current: false
      },
      {
        id: 'session-003',
        device: 'Firefox on Windows',
        location: 'New York, NY',
        lastActive: '2025-06-18T16:45:00Z',
        current: false
      }
    ],
    apiKeys: [
      {
        id: 'api-001',
        name: 'CI/CD Pipeline Integration',
        created: '2025-05-15T10:00:00Z',
        lastUsed: '2025-06-20T12:30:00Z',
        permissions: ['read:agents', 'read:policies']
      },
      {
        id: 'api-002',
        name: 'Monitoring Dashboard',
        created: '2025-04-20T14:20:00Z',
        lastUsed: '2025-06-19T18:45:00Z',
        permissions: ['read:metrics', 'read:reports']
      }
    ]
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) {
      setAuthError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);

      // Save user profile data with real API calls
      await authApiService.updateUserProfile(currentUser, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        phone: profile.phone,
        location: profile.location,
        organization: profile.organization,
        department: profile.department,
        jobTitle: profile.jobTitle,
        bio: profile.bio,
        timezone: profile.timezone,
        language: profile.language,
        profileVisibility: profile.profileVisibility
      });

      // Update governance dashboard if needed
      await governanceDashboardBackendService.updateUserProfile(currentUser, profile);

      setSaveSuccess(true);
      setEditMode(false);
      
      // Auto-hide success message
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Failed to save profile:', error);
      setAuthError('Failed to save profile changes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Reset form data if needed
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoUpload(prev => ({
        ...prev,
        selectedFile: file,
        previewUrl: e.target?.result as string,
        cropDialogOpen: true
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setPhotoUpload(prev => ({ ...prev, dragOver: true }));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setPhotoUpload(prev => ({ ...prev, dragOver: false }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPhotoUpload(prev => ({ ...prev, dragOver: false }));
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleCropImage = async () => {
    if (!photoUpload.previewUrl || !cropCanvasRef.current) return;

    setPhotoUpload(prev => ({ ...prev, uploading: true, progress: 0 }));

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setPhotoUpload(prev => {
        if (prev.progress >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, progress: prev.progress + 10 };
      });
    }, 100);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In real implementation, this would:
    // 1. Draw cropped image to canvas
    // 2. Convert canvas to blob
    // 3. Upload to Firebase Storage
    // 4. Get download URL
    // 5. Update profile

    setProfile(prev => ({
      ...prev,
      avatar: photoUpload.previewUrl!
    }));

    setPhotoUpload(prev => ({ 
      ...prev, 
      uploading: false, 
      progress: 100, 
      cropDialogOpen: false,
      selectedFile: null,
      previewUrl: null
    }));

    clearInterval(progressInterval);
  };

  const handleCancelCrop = () => {
    setPhotoUpload(prev => ({
      ...prev,
      cropDialogOpen: false,
      selectedFile: null,
      previewUrl: null
    }));
    setCropSettings({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      scale: 1,
      rotation: 0
    });
  };

  const handleRotateImage = (direction: 'left' | 'right') => {
    setCropSettings(prev => ({
      ...prev,
      rotation: prev.rotation + (direction === 'left' ? -90 : 90)
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRevokeSession = (sessionId: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      sessions: prev.sessions.filter(session => session.id !== sessionId)
    }));
  };

  const handleDeleteApiKey = (apiKeyId: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.filter(key => key.id !== apiKeyId)
    }));
  };

  return (
    <Box sx={darkThemeStyles.pageContainer}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ ...darkThemeStyles.typography.primary, fontWeight: 'bold' }}>
          User Profile Settings
        </Typography>
        <Typography variant="body1" sx={darkThemeStyles.typography.secondary}>
          Manage your account information, security settings, and profile preferences
        </Typography>
      </Box>

      {/* Profile Overview Card */}
      <Card sx={{ ...darkThemeStyles.card, mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box 
              sx={{ 
                position: 'relative', 
                mr: 3,
                border: photoUpload.dragOver ? '2px dashed #3b82f6' : 'none',
                borderRadius: '50%',
                p: photoUpload.dragOver ? 1 : 0,
                transition: 'all 0.3s ease'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Avatar
                src={profile.avatar}
                sx={{ 
                  width: 100, 
                  height: 100,
                  border: photoUpload.dragOver ? '2px solid #3b82f6' : 'none'
                }}
              />
              <input
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarUpload}
              />
              <label htmlFor="avatar-upload">
                <IconButton
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    '&:hover': { backgroundColor: '#2563eb' }
                  }}
                  size="small"
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
              </label>
              {photoUpload.uploading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '50%'
                  }}
                >
                  <CircularProgress 
                    variant="determinate" 
                    value={photoUpload.progress} 
                    sx={{ color: '#3b82f6' }}
                  />
                </Box>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={darkThemeStyles.typography.primary}>
                {profile.displayName}
              </Typography>
              <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                {profile.jobTitle} at {profile.organization}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {profile.emailVerified && (
                  <Chip
                    icon={<Verified />}
                    label="Email Verified"
                    size="small"
                    sx={{ backgroundColor: '#10b981', color: 'white' }}
                  />
                )}
                {profile.twoFactorEnabled && (
                  <Chip
                    icon={<Security />}
                    label="2FA Enabled"
                    size="small"
                    sx={{ backgroundColor: '#3b82f6', color: 'white' }}
                  />
                )}
                {!profile.phoneVerified && (
                  <Chip
                    icon={<Warning />}
                    label="Phone Not Verified"
                    size="small"
                    sx={{ backgroundColor: '#f59e0b', color: 'white' }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                Member since {formatDate(profile.dateJoined)} • Last login {formatDate(profile.lastLogin)}
              </Typography>
            </Box>
            <Box>
              <Button
                variant={editMode ? "outlined" : "contained"}
                startIcon={editMode ? <Cancel /> : <Edit />}
                onClick={editMode ? handleCancelEdit : () => setEditMode(true)}
                sx={{
                  backgroundColor: editMode ? 'transparent' : '#3b82f6',
                  borderColor: '#3b82f6',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: editMode ? '#3b82f6' : '#2563eb'
                  }
                }}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={darkThemeStyles.card}>
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
            <Tab icon={<Person />} label="Personal Information" />
            <Tab icon={<Security />} label="Security" />
            <Tab icon={<Notifications />} label="Privacy" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Personal Information */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={!editMode}
                sx={darkThemeStyles.textField}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profile.lastName}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={!editMode}
                sx={darkThemeStyles.textField}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                value={profile.email}
                disabled
                InputProps={{
                  endAdornment: profile.emailVerified ? <Verified sx={{ color: '#10b981' }} /> : <Warning sx={{ color: '#f59e0b' }} />
                }}
                sx={darkThemeStyles.textField}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  endAdornment: profile.phoneVerified ? <Verified sx={{ color: '#10b981' }} /> : <Warning sx={{ color: '#f59e0b' }} />
                }}
                sx={darkThemeStyles.textField}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={profile.location}
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                disabled={!editMode}
                sx={darkThemeStyles.textField}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Organization"
                value={profile.organization}
                onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
                disabled={!editMode}
                sx={darkThemeStyles.textField}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={profile.jobTitle}
                onChange={(e) => setProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
                disabled={!editMode}
                sx={darkThemeStyles.textField}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!editMode}
                sx={darkThemeStyles.textField}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode} sx={darkThemeStyles.formControl}>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={profile.timezone}
                  onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                  sx={darkThemeStyles.select}
                >
                  <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                  <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                  <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode} sx={darkThemeStyles.formControl}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={profile.language}
                  onChange={(e) => setProfile(prev => ({ ...prev, language: e.target.value }))}
                  sx={darkThemeStyles.select}
                >
                  <MenuItem value="en-US">English (US)</MenuItem>
                  <MenuItem value="en-GB">English (UK)</MenuItem>
                  <MenuItem value="es-ES">Spanish</MenuItem>
                  <MenuItem value="fr-FR">French</MenuItem>
                  <MenuItem value="de-DE">German</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Roles and Permissions */}
            <Grid item xs={12}>
              <Divider sx={{ borderColor: '#4a5568', my: 2 }} />
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Roles and Permissions
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                Current Roles
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {profile.roles.map((role, index) => (
                  <Chip
                    key={index}
                    label={role}
                    sx={{ backgroundColor: '#3b82f6', color: 'white' }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                Permissions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {profile.permissions.map((permission, index) => (
                  <Chip
                    key={index}
                    label={permission}
                    variant="outlined"
                    sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                  />
                ))}
              </Box>
            </Grid>

            {editMode && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                    sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveProfile}
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
          {/* Security Settings */}
          <Grid container spacing={3}>
            {/* Password Change */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Password & Authentication
              </Typography>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                        Password
                      </Typography>
                      <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                        Last changed 30 days ago
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => setShowPasswordDialog(true)}
                      sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                    >
                      Change Password
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                        Two-Factor Authentication
                      </Typography>
                      <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                        Add an extra layer of security to your account
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={profile.twoFactorEnabled}
                          onChange={(e) => setProfile(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      }
                      label=""
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Sessions */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Active Sessions
              </Typography>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <List>
                    {securitySettings.sessions.map((session, index) => (
                      <React.Fragment key={session.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                                  {session.device}
                                </Typography>
                                {session.current && (
                                  <Chip
                                    label="Current"
                                    size="small"
                                    sx={{ backgroundColor: '#10b981', color: 'white' }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                                {session.location} • Last active {formatDate(session.lastActive)}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            {!session.current && (
                              <Button
                                size="small"
                                onClick={() => handleRevokeSession(session.id)}
                                sx={{ color: '#ef4444' }}
                              >
                                Revoke
                              </Button>
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < securitySettings.sessions.length - 1 && (
                          <Divider sx={{ borderColor: '#4a5568' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* API Keys */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                  API Keys
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowApiKeyDialog(true)}
                  sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
                >
                  Generate API Key
                </Button>
              </Box>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <List>
                    {securitySettings.apiKeys.map((apiKey, index) => (
                      <React.Fragment key={apiKey.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                                {apiKey.name}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                                  Created {formatDate(apiKey.created)} • Last used {formatDate(apiKey.lastUsed)}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  {apiKey.permissions.map((permission, idx) => (
                                    <Chip
                                      key={idx}
                                      label={permission}
                                      size="small"
                                      variant="outlined"
                                      sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              onClick={() => handleDeleteApiKey(apiKey.id)}
                              sx={{ color: '#ef4444' }}
                            >
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < securitySettings.apiKeys.length - 1 && (
                          <Divider sx={{ borderColor: '#4a5568' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Privacy Settings */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Profile Visibility
              </Typography>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#a0aec0' }}>Who can see your profile</InputLabel>
                    <Select
                      value={profile.profileVisibility}
                      onChange={(e) => setProfile(prev => ({ ...prev, profileVisibility: e.target.value as any }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                      }}
                    >
                      <MenuItem value="public">Public - Anyone can see your profile</MenuItem>
                      <MenuItem value="organization">Organization - Only members of your organization</MenuItem>
                      <MenuItem value="private">Private - Only you can see your profile</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Data & Privacy
              </Typography>
              <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white', mb: 2 }}>
                <AlertTitle>Privacy Notice</AlertTitle>
                Your data is encrypted and stored securely. We never share your personal information with third parties without your explicit consent.
              </Alert>
              
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Download your data</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Get a copy of all your data</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Button variant="outlined" sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                          Download
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Delete your account</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Permanently delete your account and all data</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Button variant="outlined" sx={{ borderColor: '#ef4444', color: '#ef4444' }}>
                          Delete Account
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Password Change Dialog */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={securitySettings.currentPassword}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                sx={darkThemeStyles.textField}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={securitySettings.newPassword}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, newPassword: e.target.value }))}
                sx={darkThemeStyles.textField}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={securitySettings.confirmPassword}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                sx={darkThemeStyles.textField}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog
        open={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>Generate API Key</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key Name"
                placeholder="e.g., CI/CD Integration"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white !important' }, '& input': { color: 'white !important' }, '& textarea': { color: 'white !important' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                Select permissions for this API key:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['read:agents', 'write:agents', 'read:policies', 'write:policies', 'read:reports', 'read:metrics'].map((permission) => (
                  <Chip
                    key={permission}
                    label={permission}
                    clickable
                    variant="outlined"
                    sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKeyDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            Generate Key
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo Crop Dialog */}
      <Dialog
        open={photoUpload.cropDialogOpen}
        onClose={handleCancelCrop}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Crop Profile Photo</Typography>
            <IconButton onClick={handleCancelCrop} sx={{ color: '#a0aec0' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {photoUpload.previewUrl && (
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-block',
                  maxWidth: '100%',
                  maxHeight: 400,
                  border: '2px solid #4a5568',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <img
                  src={photoUpload.previewUrl}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: 'auto',
                    transform: `scale(${cropSettings.scale}) rotate(${cropSettings.rotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                />
                {/* Crop overlay would go here in real implementation */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 200,
                    height: 200,
                    border: '2px solid #3b82f6',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none'
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Crop Controls */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                Zoom
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ZoomOut />
                <Slider
                  value={cropSettings.scale}
                  onChange={(e, value) => setCropSettings(prev => ({ ...prev, scale: value as number }))}
                  min={0.5}
                  max={3}
                  step={0.1}
                  sx={{
                    color: '#3b82f6',
                    '& .MuiSlider-thumb': { backgroundColor: '#3b82f6' },
                    '& .MuiSlider-track': { backgroundColor: '#3b82f6' }
                  }}
                />
                <ZoomIn />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                Rotation
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<RotateLeft />}
                  onClick={() => handleRotateImage('left')}
                  sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                >
                  Rotate Left
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RotateRight />}
                  onClick={() => handleRotateImage('right')}
                  sx={{ borderColor: '#4a5568', color: '#a0aec0' }}
                >
                  Rotate Right
                </Button>
              </Box>
            </Grid>
          </Grid>

          {photoUpload.uploading && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={darkThemeStyles.typography.primary}>
                Uploading... {photoUpload.progress}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={photoUpload.progress}
                sx={{
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#3b82f6' }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelCrop} 
            disabled={photoUpload.uploading}
            sx={{ color: '#a0aec0' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Check />}
            onClick={handleCropImage}
            disabled={photoUpload.uploading}
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            {photoUpload.uploading ? 'Uploading...' : 'Save Photo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Backdrop */}
      <Backdrop
        open={photoUpload.uploading}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Processing your photo...
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default UserProfileSettingsPage;

