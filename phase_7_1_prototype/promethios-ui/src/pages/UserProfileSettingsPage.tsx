import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApiService } from '../services/authApiService';
import { governanceDashboardBackendService } from '../services/governanceDashboardBackendService';
import { userProfileService, UserProfile as ServiceUserProfile, ProfileUpdateData } from '../services/userProfileService';
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
  CircularProgress,
  Tooltip
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
  Close,
  Badge,
  AccountTree,
  History,
  PrivacyTip
} from '@mui/icons-material';

interface UserProfile extends ServiceUserProfile {
  // Additional UI-specific properties if needed
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
  const [saving, setSaving] = useState(false);
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

  // User profile data with Firebase integration
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

  // Load user profile from Firebase on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setAuthError(null);

        // Use the unified storage service
        const profileData = await userProfileService.getUserProfile(currentUser.uid);
        
        if (profileData) {
          setProfile(profileData);
        } else {
          // Initialize with default profile if none exists
          const defaultProfile: UserProfile = {
            id: currentUser.uid,
            email: currentUser.email || '',
            firstName: currentUser.displayName?.split(' ')[0] || '',
            lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
            displayName: currentUser.displayName || '',
            avatar: currentUser.photoURL || '/api/placeholder/150/150',
            phone: '',
            location: '',
            organization: 'Promethios Corp',
            department: 'AI Governance',
            jobTitle: 'AI Governance Specialist',
            bio: '',
            timezone: 'America/Los_Angeles',
            language: 'en-US',
            dateJoined: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            emailVerified: currentUser.emailVerified || false,
            phoneVerified: false,
            twoFactorEnabled: false,
            profileVisibility: 'organization',
            roles: ['AI Governance Specialist'],
            permissions: ['read:agents', 'read:policies']
          };
          
          setProfile(defaultProfile);
          
          // Save the default profile
          await userProfileService.updateUserProfile(currentUser.uid, defaultProfile);
        }

        // Update last login
        await userProfileService.updateLastLogin(currentUser.uid);

      } catch (error) {
        console.error('Failed to load user profile:', error);
        setAuthError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [currentUser]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) {
      setAuthError('Authentication required');
      return;
    }

    try {
      setSaving(true);
      setAuthError(null);

      // Prepare update data
      const updateData: ProfileUpdateData = {
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
      };

      // Save using unified storage service
      const updatedProfile = await userProfileService.updateUserProfile(currentUser.uid, updateData);
      setProfile(updatedProfile);

      // Also save to backend services if available (for compatibility)
      try {
        await authApiService.updateUserProfile(currentUser, updateData);
        await governanceDashboardBackendService.updateUserProfile(currentUser, updatedProfile);
      } catch (backendError) {
        console.warn('Backend update failed, but unified storage save succeeded:', backendError);
      }

      setSaveSuccess(true);
      setEditMode(false);
      
      // Auto-hide success message
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Failed to save profile:', error);
      setAuthError('Failed to save profile changes');
    } finally {
      setSaving(false);
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
    if (!photoUpload.previewUrl || !photoUpload.selectedFile || !currentUser) return;

    setPhotoUpload(prev => ({ ...prev, uploading: true, progress: 0 }));

    try {
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

      // Upload avatar using the service
      const uploadResult = await userProfileService.uploadAvatar(currentUser.uid, photoUpload.selectedFile);
      
      // Update profile with new avatar URL
      setProfile(prev => ({
        ...prev,
        avatar: uploadResult.url
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

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setAuthError('Failed to upload avatar');
      
      setPhotoUpload(prev => ({ 
        ...prev, 
        uploading: false, 
        progress: 0, 
        cropDialogOpen: false,
        selectedFile: null,
        previewUrl: null
      }));
    }
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

  // Authentication validation
  if (!currentUser) {
    return (
      <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
        <Alert severity="warning" sx={{ backgroundColor: '#78350f', color: '#fed7aa' }}>
          <AlertTitle>Authentication Required</AlertTitle>
          Please log in to access your profile settings. This page requires user authentication to display and manage your profile data.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          User Profile Settings
        </Typography>
        <LinearProgress sx={{ mt: 2, backgroundColor: '#4a5568', '& .MuiLinearProgress-bar': { backgroundColor: '#3b82f6' } }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
            User Profile Settings
          </Typography>
          <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
            Manage your account information, security settings, and profile preferences
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={editMode ? <Save /> : <Edit />}
          onClick={editMode ? handleSaveProfile : () => setEditMode(true)}
          disabled={saving}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' },
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          {editMode ? (saving ? 'SAVING...' : 'SAVE PROFILE') : 'EDIT PROFILE'}
        </Button>
      </Box>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3, backgroundColor: '#14532d', color: '#bbf7d0' }}>
          <AlertTitle>Profile Updated</AlertTitle>
          Your profile changes have been saved successfully.
        </Alert>
      )}

      {/* Error Alert */}
      {authError && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: '#7f1d1d', color: '#fecaca' }}>
          <AlertTitle>Error</AlertTitle>
          {authError}
        </Alert>
      )}

      {/* Profile Overview Card */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', mb: 4 }}>
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
                  disabled={!editMode}
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
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                {profile.displayName}
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0', mb: 1 }}>
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
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Member since {formatDate(profile.dateJoined)} • Last login {formatDate(profile.lastLogin)}
              </Typography>
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
            <Tab 
              icon={<Person />} 
              label="Personal Information" 
              sx={{ textTransform: 'none' }}
            />
            <Tab 
              icon={<Security />} 
              label="Security" 
              sx={{ textTransform: 'none' }}
            />
            <Tab 
              icon={<PrivacyTip />} 
              label="Privacy" 
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Box>

        {/* Personal Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  sx: { 
                    color: 'white !important',
                    '& input': { color: 'white !important' }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: '#a0aec0 !important',
                    '&.Mui-focused': { color: '#3b82f6 !important' }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    '& input': { color: 'white !important' },
                    '& input::placeholder': { color: '#a0aec0 !important' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0 !important' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6 !important' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profile.lastName}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  sx: { 
                    color: 'white !important',
                    '& input': { color: 'white !important' }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: '#a0aec0 !important',
                    '&.Mui-focused': { color: '#3b82f6 !important' }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    '& input': { color: 'white !important' },
                    '& input::placeholder': { color: '#a0aec0 !important' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0 !important' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6 !important' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Display Name"
                value={profile.displayName}
                onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  sx: { 
                    color: 'white !important',
                    '& input': { color: 'white !important' }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: '#a0aec0 !important',
                    '&.Mui-focused': { color: '#3b82f6 !important' }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    '& input': { color: 'white !important' },
                    '& input::placeholder': { color: '#a0aec0 !important' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0 !important' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6 !important' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={profile.email}
                disabled={true}
                InputProps={{
                  startAdornment: <Email sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: '#718096' }
                }}
                InputLabelProps={{
                  sx: { color: '#a0aec0' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Phone sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: 'white' }
                }}
                InputLabelProps={{
                  sx: { color: '#a0aec0' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={profile.location}
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <LocationOn sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: 'white' }
                }}
                InputLabelProps={{
                  sx: { color: '#a0aec0' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Organization"
                value={profile.organization}
                onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Business sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: 'white' }
                }}
                InputLabelProps={{
                  sx: { color: '#a0aec0' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={profile.jobTitle}
                onChange={(e) => setProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  sx: { 
                    color: 'white !important',
                    '& input': { color: 'white !important' }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: '#a0aec0 !important',
                    '&.Mui-focused': { color: '#3b82f6 !important' }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    '& input': { color: 'white !important' },
                    '& input::placeholder': { color: '#a0aec0 !important' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0 !important' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6 !important' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!editMode}
                multiline
                rows={4}
                InputProps={{
                  sx: { 
                    color: 'white !important',
                    '& textarea': { color: 'white !important' }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: '#a0aec0 !important',
                    '&.Mui-focused': { color: '#3b82f6 !important' }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    '& textarea': { color: 'white !important' },
                    '& textarea::placeholder': { color: '#a0aec0 !important' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0 !important' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6 !important' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel sx={{ color: '#a0aec0 !important', '&.Mui-focused': { color: '#3b82f6 !important' } }}>Timezone</InputLabel>
                <Select
                  value={profile.timezone}
                  onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                  sx={{ 
                    color: 'white !important', 
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '& .MuiSelect-select': { color: 'white !important' },
                    '& .MuiSvgIcon-root': { color: 'white !important' }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#2d3748',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#4a5568'
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  <MenuItem value="America/Denver">Mountain Time</MenuItem>
                  <MenuItem value="America/Chicago">Central Time</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel sx={{ color: '#a0aec0' }}>Language</InputLabel>
                <Select
                  value={profile.language}
                  onChange={(e) => setProfile(prev => ({ ...prev, language: e.target.value }))}
                  sx={{ 
                    color: 'white', 
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#2d3748',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#4a5568'
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="en-US">English (US)</MenuItem>
                  <MenuItem value="en-GB">English (UK)</MenuItem>
                  <MenuItem value="es-ES">Spanish</MenuItem>
                  <MenuItem value="fr-FR">French</MenuItem>
                  <MenuItem value="de-DE">German</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Active Sessions
              </Typography>
              <List>
                {securitySettings.sessions.map((session) => (
                  <ListItem
                    key={session.id}
                    sx={{
                      backgroundColor: '#1a202c',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid #4a5568'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ color: 'white' }}>{session.device}</Typography>
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
                        <Typography sx={{ color: '#a0aec0' }}>
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
                ))}
              </List>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ borderColor: '#4a5568', my: 2 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                API Keys
              </Typography>
              <List>
                {securitySettings.apiKeys.map((apiKey) => (
                  <ListItem
                    key={apiKey.id}
                    sx={{
                      backgroundColor: '#1a202c',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid #4a5568'
                    }}
                  >
                    <ListItemText
                      primary={<Typography sx={{ color: 'white' }}>{apiKey.name}</Typography>}
                      secondary={
                        <Box>
                          <Typography sx={{ color: '#a0aec0' }}>
                            Created {formatDate(apiKey.created)} • Last used {formatDate(apiKey.lastUsed)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {apiKey.permissions.map((permission) => (
                              <Chip
                                key={permission}
                                label={permission}
                                size="small"
                                sx={{ backgroundColor: '#4a5568', color: 'white' }}
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
                ))}
              </List>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setShowApiKeyDialog(true)}
                sx={{
                  mt: 2,
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  '&:hover': { borderColor: '#2563eb', backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                }}
              >
                Create New API Key
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Profile Visibility
              </Typography>
              <FormControl fullWidth disabled={!editMode}>
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
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#2d3748',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#4a5568'
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="public">Public - Anyone can see your profile</MenuItem>
                  <MenuItem value="organization">Organization - Only members of your organization</MenuItem>
                  <MenuItem value="private">Private - Only you can see your profile</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Roles and Permissions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {profile.roles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    sx={{ backgroundColor: '#3b82f6', color: 'white' }}
                  />
                ))}
              </Box>
              <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                Current Permissions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.permissions.map((permission) => (
                  <Chip
                    key={permission}
                    label={permission}
                    size="small"
                    sx={{ backgroundColor: '#4a5568', color: 'white' }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Photo Crop Dialog */}
      <Dialog
        open={photoUpload.cropDialogOpen}
        onClose={handleCancelCrop}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#2d3748',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Crop Profile Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {photoUpload.previewUrl && (
              <Box
                component="img"
                src={photoUpload.previewUrl}
                sx={{
                  maxWidth: '100%',
                  maxHeight: 400,
                  border: '1px solid #4a5568',
                  borderRadius: 1
                }}
              />
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={() => handleRotateImage('left')} sx={{ color: 'white' }}>
                <RotateLeft />
              </IconButton>
              <IconButton onClick={() => handleRotateImage('right')} sx={{ color: 'white' }}>
                <RotateRight />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCrop} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCropImage}
            variant="contained"
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            Save Photo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfileSettingsPage;

