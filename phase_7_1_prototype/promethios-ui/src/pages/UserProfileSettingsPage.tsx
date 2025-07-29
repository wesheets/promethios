import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Tooltip
} from '@mui/material';
import {
  Edit,
  Save,
  PhotoCamera,
  Person,
  Security,
  PrivacyTip,
  Email,
  Phone,
  LocationOn,
  Business,
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
  History
} from '@mui/icons-material';

import { userProfileService, UserProfile as ServiceUserProfile } from '../services/userProfileService';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile extends ServiceUserProfile {
  // Additional UI-specific properties if needed
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  trustedDevices: string[];
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  dataRetention: number;
}

interface PhotoUpload {
  uploading: boolean;
  progress: number;
  dragOver: boolean;
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
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile>({
    userId: '',
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    avatar: '',
    bio: '',
    jobTitle: '',
    organization: '',
    location: '',
    timezone: '',
    website: '',
    linkedIn: '',
    twitter: '',
    github: '',
    emailVerified: false,
    phoneVerified: false,
    dateJoined: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 30,
    trustedDevices: []
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: false,
    dataRetention: 365
  });

  const [photoUpload, setPhotoUpload] = useState<PhotoUpload>({
    uploading: false,
    progress: 0,
    dragOver: false
  });

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userProfile = await userProfileService.getUserProfile(currentUser.uid);
      
      if (userProfile) {
        setProfile(userProfile);
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          userId: currentUser.uid,
          firstName: currentUser.displayName?.split(' ')[0] || '',
          lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          phone: currentUser.phoneNumber || '',
          avatar: currentUser.photoURL || '',
          bio: '',
          jobTitle: '',
          organization: '',
          location: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          website: '',
          linkedIn: '',
          twitter: '',
          github: '',
          emailVerified: currentUser.emailVerified,
          phoneVerified: !!currentUser.phoneNumber,
          dateJoined: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProfile(defaultProfile);
      }

      // Update last login
      await userProfileService.updateLastLogin(currentUser.uid);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      await userProfileService.updateUserProfile(currentUser.uid, profile);
      setSaveSuccess(true);
      setEditMode(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setPhotoUpload(prev => ({ ...prev, uploading: true, progress: 0 }));
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setPhotoUpload(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 100);

      const avatarUrl = await userProfileService.uploadAvatar(currentUser.uid, file);
      
      clearInterval(progressInterval);
      setPhotoUpload(prev => ({ ...prev, progress: 100 }));
      
      setProfile(prev => ({ ...prev, avatar: avatarUrl }));
      
      setTimeout(() => {
        setPhotoUpload({ uploading: false, progress: 0, dragOver: false });
      }, 500);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setPhotoUpload({ uploading: false, progress: 0, dragOver: false });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          User Profile Settings
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
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
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully!
        </Alert>
      )}

      {/* Profile Header Card */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={profile.avatar}
                sx={{ 
                  width: 120, 
                  height: 120,
                  border: '3px solid #4a5568'
                }}
              />
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  '&:hover': { backgroundColor: '#2563eb' },
                  width: 32,
                  height: 32
                }}
              >
                <PhotoCamera sx={{ fontSize: 16 }} />
              </IconButton>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                {profile.displayName || `${profile.firstName} ${profile.lastName}`}
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0', mb: 1 }}>
                {profile.jobTitle} at {profile.organization}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  label={profile.emailVerified ? "EMAIL VERIFIED" : "EMAIL UNVERIFIED"}
                  size="small"
                  sx={{
                    backgroundColor: profile.emailVerified ? '#10b981' : '#f59e0b',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Chip
                  label={profile.phoneVerified ? "PHONE VERIFIED" : "PHONE UNVERIFIED"}
                  size="small"
                  sx={{
                    backgroundColor: profile.phoneVerified ? '#10b981' : '#f59e0b',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
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
                placeholder="First Name"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Person sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Last Name"
                value={profile.lastName}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Person sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Email sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Phone"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Phone sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Job Title"
                value={profile.jobTitle}
                onChange={(e) => setProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Badge sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Organization"
                value={profile.organization}
                onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Business sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                placeholder="Bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!editMode}
                multiline
                rows={4}
                InputProps={{
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  }
                }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <List>
            <ListItem>
              <ListItemIcon>
                <Security sx={{ color: '#3b82f6' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Two-Factor Authentication" 
                secondary="Add an extra layer of security to your account"
                primaryTypographyProps={{ color: 'white' }}
                secondaryTypographyProps={{ color: '#a0aec0' }}
              />
              <Switch
                checked={securitySettings.twoFactorEnabled}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                disabled={!editMode}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Email sx={{ color: '#3b82f6' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Login Notifications" 
                secondary="Get notified when someone logs into your account"
                primaryTypographyProps={{ color: 'white' }}
                secondaryTypographyProps={{ color: '#a0aec0' }}
              />
              <Switch
                checked={securitySettings.loginNotifications}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginNotifications: e.target.checked }))}
                disabled={!editMode}
              />
            </ListItem>
          </List>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel sx={{ color: '#a0aec0' }}>Profile Visibility</InputLabel>
                <Select
                  value={privacySettings.profileVisibility}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value as any }))}
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' } }}
                >
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="contacts">Contacts Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default UserProfileSettingsPage;

