import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userProfileService, UserProfile } from '../services/userProfileService';
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Business,
  LocationOn,
  Save,
  Edit,
  Visibility,
  VisibilityOff,
  Security,
  PhotoCamera
} from '@mui/icons-material';

const UserProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Profile state with sensible defaults
  const [profile, setProfile] = useState<UserProfile>({
    userId: currentUser?.uid || '',
    firstName: currentUser?.displayName?.split(' ')[0] || '',
    lastName: currentUser?.displayName?.split(' ').slice(1).join(' ') || '',
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phoneNumber || '',
    avatar: currentUser?.photoURL || '',
    bio: '',
    jobTitle: '',
    organization: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    website: '',
    linkedIn: '',
    twitter: '',
    github: '',
    emailVerified: currentUser?.emailVerified || false,
    phoneVerified: !!currentUser?.phoneNumber,
    twoFactorEnabled: false,
    loginNotifications: true,
    dateJoined: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userProfile = await userProfileService.getUserProfile(currentUser.uid);
        
        if (userProfile) {
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  // Save profile changes
  const handleSave = async () => {
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

  // Handle input changes
  const handleChange = (field: keyof UserProfile) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Handle switch changes
  const handleSwitchChange = (field: keyof UserProfile) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#1a202c',
        color: 'white'
      }}>
        <CircularProgress sx={{ color: '#3b82f6' }} />
        <Typography sx={{ ml: 2, color: 'white' }}>Loading Profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a202c', 
      color: 'white',
      p: 3
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
          User Profile
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0' }}>
          Manage your account information and preferences
        </Typography>
      </Box>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3, backgroundColor: '#065f46', color: 'white' }}>
          Profile updated successfully!
        </Alert>
      )}

      {/* Main Profile Card */}
      <Card sx={{ 
        backgroundColor: '#2d3748', 
        color: 'white',
        border: '1px solid #4a5568'
      }}>
        <Box sx={{ p: 4 }}>
          {/* Profile Header with Avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={profile.avatar}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mr: 3,
                  border: '3px solid #3b82f6'
                }}
              >
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </Avatar>
              {editMode && (
                <IconButton
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 20,
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    '&:hover': { backgroundColor: '#2563eb' }
                  }}
                  size="small"
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                {profile.displayName || 'User'}
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0', mb: 1 }}>
                {profile.email}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                {profile.jobTitle && profile.organization 
                  ? `${profile.jobTitle} at ${profile.organization}`
                  : profile.jobTitle || profile.organization || 'No job title specified'
                }
              </Typography>
            </Box>
            <Button
              variant={editMode ? "outlined" : "contained"}
              startIcon={editMode ? <Save /> : <Edit />}
              onClick={editMode ? handleSave : () => setEditMode(true)}
              disabled={saving}
              sx={{
                backgroundColor: editMode ? 'transparent' : '#3b82f6',
                borderColor: '#3b82f6',
                color: 'white',
                '&:hover': { 
                  backgroundColor: editMode ? 'rgba(59, 130, 246, 0.1)' : '#2563eb' 
                }
              }}
            >
              {saving ? <CircularProgress size={20} /> : (editMode ? 'Save Changes' : 'Edit Profile')}
            </Button>
          </Box>

          <Divider sx={{ borderColor: '#4a5568', mb: 4 }} />

          {/* Profile Fields */}
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                Personal Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profile.firstName}
                onChange={handleChange('firstName')}
                disabled={!editMode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profile.lastName}
                onChange={handleChange('lastName')}
                disabled={!editMode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={profile.email}
                onChange={handleChange('email')}
                disabled={!editMode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profile.phone}
                onChange={handleChange('phone')}
                disabled={!editMode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>

            {/* Professional Information */}
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                Professional Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={profile.jobTitle}
                onChange={handleChange('jobTitle')}
                disabled={!editMode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Organization"
                value={profile.organization}
                onChange={handleChange('organization')}
                disabled={!editMode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={profile.location}
                onChange={handleChange('location')}
                disabled={!editMode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Bio"
                value={profile.bio}
                onChange={handleChange('bio')}
                disabled={!editMode}
                placeholder="Tell us about yourself..."
                InputProps={{
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
              />
            </Grid>

            {/* Security Settings */}
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                Security & Notifications
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.twoFactorEnabled}
                    onChange={handleSwitchChange('twoFactorEnabled')}
                    disabled={!editMode}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#3b82f6',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#3b82f6',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Security sx={{ mr: 1, color: '#a0aec0' }} />
                    <Typography sx={{ color: 'white' }}>Two-Factor Authentication</Typography>
                  </Box>
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.loginNotifications}
                    onChange={handleSwitchChange('loginNotifications')}
                    disabled={!editMode}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#3b82f6',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#3b82f6',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: 'white' }}>Login Notifications</Typography>
                }
              />
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Box>
  );
};

export default UserProfilePage;

