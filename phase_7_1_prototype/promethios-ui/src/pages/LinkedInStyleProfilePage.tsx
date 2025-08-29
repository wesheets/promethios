import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userProfileService, UserProfile } from '../services/UserProfileService';
import { FirebaseUserDiscoveryService } from '../services/FirebaseUserDiscoveryService';
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
  InputAdornment,
  Chip,
  Paper,
  Stack,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  PhotoCamera,
  Add,
  Work,
  School,
  Language,
  Link as LinkIcon,
  LinkedIn,
  Twitter,
  GitHub,
  Public,
  Settings,
  Analytics,
  Notifications,
  VerifiedUser,
  Star,
  TrendingUp,
  Group,
  Message
} from '@mui/icons-material';

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description: string;
}

interface Skill {
  id: string;
  name: string;
  endorsements: number;
}

const LinkedInStyleProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [peopleAlsoViewed, setPeopleAlsoViewed] = useState<any[]>([]);

  // Form state for dialogs
  const [experienceForm, setExperienceForm] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    startDate: '',
    endDate: '',
    current: false
  });

  const [skillForm, setSkillForm] = useState({
    name: ''
  });

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoType, setPhotoType] = useState<'profile' | 'header' | null>(null);
  
  // Firebase services
  const discoveryService = new FirebaseUserDiscoveryService();

  // Navigation handler
  const handleViewProfile = (userId: string) => {
    navigate(`/ui/profile/${userId}`);
  };

  // Profile state with LinkedIn-style fields - no stubbed data
  const [profile, setProfile] = useState<UserProfile & {
    headline?: string;
    summary?: string;
    experience?: Experience[];
    education?: Education[];
    skills?: Skill[];
    languages?: string[];
    connections?: number;
    profileViews?: number;
    postImpressions?: number;
    searchAppearances?: number;
  }>({
    userId: currentUser?.uid || '',
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
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    website: '',
    linkedIn: '',
    twitter: '',
    github: '',
    emailVerified: false,
    phoneVerified: false,
    twoFactorEnabled: false,
    loginNotifications: true,
    dateJoined: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // LinkedIn-style additions - will be loaded from Firebase
    headline: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    connections: 0,
    profileViews: 0,
    postImpressions: 0,
    searchAppearances: 0
  });

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        console.log('🚨 No currentUser, skipping profile load');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Loading profile for user:', currentUser.uid);
        const userProfile = await userProfileService.getUserProfile(currentUser.uid);
        
        if (userProfile) {
          // Use real Firebase data
          console.log('✅ Found Firebase profile data:', userProfile);
          console.log('📝 Profile fields:', {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            displayName: userProfile.displayName,
            name: userProfile.name,
            id: userProfile.id
          });
          
          // If name fields are empty, populate from auth data
          const enhancedProfile = {
            ...userProfile,
            firstName: userProfile.firstName || currentUser.displayName?.split(' ')[0] || 'User',
            lastName: userProfile.lastName || currentUser.displayName?.split(' ').slice(1).join(' ') || '',
            displayName: userProfile.displayName || currentUser.displayName || 'User',
            email: userProfile.email || currentUser.email || '',
            avatar: userProfile.avatar || currentUser.photoURL || '',
            emailVerified: userProfile.emailVerified ?? currentUser.emailVerified,
          };
          
          console.log('🔧 Enhanced profile with auth data:', {
            firstName: enhancedProfile.firstName,
            lastName: enhancedProfile.lastName,
            displayName: enhancedProfile.displayName,
            email: enhancedProfile.email
          });
          
          setProfile(prev => ({ ...prev, ...enhancedProfile }));
        } else {
          // If no profile exists, populate with basic auth data only
          console.log('⚠️ No Firebase profile found, using auth data');
          const authProfile = {
            ...prev,
            id: currentUser.uid,
            userId: currentUser.uid,
            firstName: currentUser.displayName?.split(' ')[0] || '',
            lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            phone: currentUser.phoneNumber || '',
            avatar: currentUser.photoURL || '',
            emailVerified: currentUser.emailVerified || false,
            phoneVerified: !!currentUser.phoneNumber
          };
          console.log('📝 Setting auth profile data:', authProfile);
          console.log('📝 Auth profile fields:', {
            firstName: authProfile.firstName,
            lastName: authProfile.lastName,
            displayName: authProfile.displayName,
            currentUserDisplayName: currentUser.displayName
          });
          setProfile(prev => authProfile);
        }
      } catch (error) {
        console.error('❌ Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  // Load people also viewed from Firebase
  useEffect(() => {
    const loadPeopleAlsoViewed = async () => {
      try {
        // Get a few random users from Firebase for "People also viewed"
        const users = await discoveryService.getAllUsers();
        
        // Filter out the current user and take first 3
        const filteredUsers = users
          .filter(user => user.id !== currentUser?.uid)
          .slice(0, 3)
          .map(user => ({
            id: user.id,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User',
            title: user.title || user.jobTitle || 'Professional',
            avatar: user.avatar || user.photoURL || ''
          }));
        
        setPeopleAlsoViewed(filteredUsers);
      } catch (error) {
        console.error('Failed to load people also viewed:', error);
        // Fallback to empty array if Firebase fails
        setPeopleAlsoViewed([]);
      }
    };

    if (currentUser) {
      loadPeopleAlsoViewed();
    }
  }, [currentUser]); // ✅ Removed discoveryService to fix infinite loop

  // Save profile changes
  const handleSave = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setSaving(true);
      
      // Save to userProfileService
      await userProfileService.updateProfile(currentUser.uid, profile);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('✅ Profile saved successfully');
    } catch (error) {
      console.error('❌ Failed to save profile:', error);
      // Show error to user
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Edit handlers
  const handleEditSection = (section: string) => {
    setEditingSection(section);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditMode(false);
  };

  const handleSaveSection = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setSaving(true);
      
      if (editingSection === 'experience') {
        // Add new experience to the profile
        const newExperience = {
          id: Date.now().toString(), // Simple ID generation
          ...experienceForm
        };
        
        const updatedProfile = {
          ...profile,
          experience: [...(profile.experience || []), newExperience]
        };
        
        setProfile(updatedProfile);
        await userProfileService.updateProfile(currentUser.uid, updatedProfile);
        
        // Reset form
        setExperienceForm({
          title: '',
          company: '',
          location: '',
          description: '',
          startDate: '',
          endDate: '',
          current: false
        });
        
      } else if (editingSection === 'skills') {
        // Add new skill to the profile
        const newSkill = {
          id: Date.now().toString(),
          name: skillForm.name,
          endorsements: 0
        };
        
        const updatedProfile = {
          ...profile,
          skills: [...(profile.skills || []), newSkill]
        };
        
        setProfile(updatedProfile);
        await userProfileService.updateProfile(currentUser.uid, updatedProfile);
        
        // Reset form
        setSkillForm({ name: '' });
        
      } else {
        // For other sections (like About), just save the current profile
        await userProfileService.updateProfile(currentUser.uid, profile);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('✅ Profile section saved successfully');
    } catch (error) {
      console.error('❌ Failed to save profile section:', error);
    } finally {
      setSaving(false);
      setEditingSection(null);
      setEditMode(false);
    }
  };

  // Photo upload handlers
  const handlePhotoUpload = (type: 'profile' | 'header') => {
    setPhotoType(type);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadPhoto(file, type);
      }
    };
    input.click();
  };

  const uploadPhoto = async (file: File, type: 'profile' | 'header') => {
    if (!currentUser?.uid) return;
    
    try {
      setUploadingPhoto(true);
      
      // Create a data URL for immediate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        if (type === 'profile') {
          setProfile(prev => ({ ...prev, avatar: dataUrl }));
        } else {
          setProfile(prev => ({ ...prev, headerPhoto: dataUrl }));
        }
      };
      reader.readAsDataURL(file);
      
      // In a real app, you would upload to Firebase Storage here
      // For now, we'll just use the data URL
      console.log(`✅ ${type} photo uploaded successfully`);
      
      // Save the updated profile
      await userProfileService.updateProfile(currentUser.uid, profile);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${type} photo:`, error);
    } finally {
      setUploadingPhoto(false);
      setPhotoType(null);
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
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto', 
      p: 3,
      pt: 5, // Extra top padding to prevent content hiding under header
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Profile updated successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Main Profile Card */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            {/* Cover Photo Area */}
            <Box sx={{ 
              height: 200, 
              background: profile.headerPhoto ? `url(${profile.headerPhoto})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              <IconButton 
                sx={{ 
                  position: 'absolute', 
                  top: 16, 
                  right: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                }}
                onClick={() => handlePhotoUpload('header')}
                disabled={uploadingPhoto && photoType === 'header'}
              >
                {uploadingPhoto && photoType === 'header' ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  <PhotoCamera />
                )}
              </IconButton>
            </Box>

            {/* Profile Info */}
            <Box sx={{ p: 3, pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, mt: -6 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'primary.main',
                        '&:hover': { backgroundColor: 'primary.dark' }
                      }}
                      onClick={() => handlePhotoUpload('profile')}
                      disabled={uploadingPhoto && photoType === 'profile'}
                    >
                      {uploadingPhoto && photoType === 'profile' ? (
                        <CircularProgress size={16} sx={{ color: 'white' }} />
                      ) : (
                        <PhotoCamera fontSize="small" />
                      )}
                    </IconButton>
                  }
                >
                  <Avatar
                    src={profile.avatar}
                    sx={{ 
                      width: 120, 
                      height: 120,
                      border: '4px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '3rem'
                    }}
                  >
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </Avatar>
                </Badge>
                
                <Box sx={{ ml: 3, flex: 1, mt: 8 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography 
                      variant="h4" 
                      fontWeight="bold"
                      sx={{ 
                        color: 'text.primary',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      {profile.displayName || `${profile.firstName} ${profile.lastName}`}
                    </Typography>
                    {profile.emailVerified && (
                      <Tooltip title="Verified Profile">
                        <VerifiedUser color="primary" />
                      </Tooltip>
                    )}
                  </Box>
                  
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    {profile.headline || profile.jobTitle}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {profile.location} • {profile.connections} connections
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    {/* Only show MESSAGE and CONNECT buttons if viewing someone else's profile */}
                    {currentUser?.uid !== profile.userId && (
                      <>
                        <Button 
                          variant="contained" 
                          startIcon={<Message />}
                          sx={{ borderRadius: 20 }}
                        >
                          Message
                        </Button>
                        <Button 
                          variant="outlined" 
                          sx={{ 
                            borderRadius: 20,
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            '&:hover': { borderColor: 'primary.main' }
                          }}
                        >
                          Connect
                        </Button>
                      </>
                    )}
                    <IconButton 
                      sx={{ 
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <Settings />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>

              {/* Quick Stats */}
              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                p: 2, 
                backgroundColor: '#f8f9fa',
                borderRadius: 2,
                border: '1px solid', borderColor: 'divider'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {profile.profileViews}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Profile views
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {profile.postImpressions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Post impressions
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {profile.searchAppearances}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Search appearances
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>

          {/* About Section */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  About
                </Typography>
                <IconButton size="small" onClick={() => handleEditSection('about')}>
                  <Edit />
                </IconButton>
              </Box>
              
              {editingSection === 'about' ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={profile.summary || profile.bio || ''}
                    onChange={(e) => handleFieldChange('summary', e.target.value)}
                    placeholder="Write about yourself..."
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={handleSaveSection}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  {profile.summary || profile.bio || 
                    "Passionate about AI collaboration and human-machine partnerships. Experienced in building innovative solutions that bridge the gap between artificial intelligence and human creativity."}
                </Typography>
              )}
            </Box>
          </Card>

          {/* Experience Section */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Experience
                </Typography>
                <IconButton 
                  size="small"
                  onClick={() => handleEditSection('experience')}
                >
                  <Add />
                </IconButton>
              </Box>
              
              {profile.experience?.length ? (
                profile.experience.map((exp, index) => (
                  <Box key={exp.id} sx={{ mb: index < profile.experience!.length - 1 ? 3 : 0 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Avatar sx={{ width: 48, height: 48, backgroundColor: 'primary.main' }}>
                        <Work />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {exp.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {exp.company} • {exp.location}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                        </Typography>
                        {exp.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {exp.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    {index < profile.experience!.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Work sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Add your work experience to showcase your professional journey
                  </Typography>
                  <Button variant="outlined" startIcon={<Add />} sx={{ mt: 2 }}>
                    Add Experience
                  </Button>
                </Box>
              )}
            </Box>
          </Card>

          {/* Skills Section */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Skills
                </Typography>
                <IconButton 
                  size="small"
                  onClick={() => handleEditSection('skills')}
                >
                  <Add />
                </IconButton>
              </Box>
              
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {profile.skills?.map((skill) => (
                  <Chip
                    key={skill.id}
                    label={`${skill.name} • ${skill.endorsements}`}
                    variant="outlined"
                    sx={{ 
                      backgroundColor: 'background.paper',
                      borderColor: '#e1e5e9',
                      color: '#333',
                      '&:hover': { 
                        backgroundColor: '#f8f9fa',
                        borderColor: 'primary.main'
                      }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Profile Language */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Profile Language
              </Typography>
              <Typography variant="body2" color="text.secondary">
                English
              </Typography>
            </Box>
          </Card>

          {/* Public Profile URL */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Public Profile URL
              </Typography>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                {window.location.origin}/in/{
                  profile.username || 
                  (profile.firstName && profile.lastName 
                    ? `${profile.firstName.toLowerCase()}-${profile.lastName.toLowerCase()}`.replace(/[^a-z0-9-]/g, '')
                    : profile.displayName?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'user'
                  )
                }
              </Typography>
            </Box>
          </Card>

          {/* People Also Viewed */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                People also viewed
              </Typography>
              
              {peopleAlsoViewed.length > 0 ? (
                peopleAlsoViewed.map((person, index) => (
                  <Box 
                    key={person.id || index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      mb: 2,
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    onClick={() => handleViewProfile(person.id)}
                  >
                    <Avatar 
                      src={person.avatar} 
                      sx={{ width: 40, height: 40 }}
                    >
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {person.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {person.title}
                      </Typography>
                    </Box>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when clicking button
                        // TODO: Implement connect functionality
                      }}
                    >
                      Connect
                    </Button>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No users found
                </Typography>
              )}
            </Box>
          </Card>

          {/* Analytics */}
          <Card sx={{ 
            backgroundColor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Analytics
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Visibility fontSize="small" />
                  <Typography variant="body2">
                    {profile.profileViews} profile views
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Discover who's viewed your profile
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingUp fontSize="small" />
                  <Typography variant="body2">
                    {profile.postImpressions} post impressions
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Check out who's engaging with your posts
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Analytics fontSize="small" />
                  <Typography variant="body2">
                    {profile.searchAppearances} search appearances
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  See how often you appear in search results
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Professional Details */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Professional Details
                </Typography>
                <IconButton size="small" onClick={() => handleEditSection('professional')}>
                  <Edit />
                </IconButton>
              </Box>
              
              {editingSection === 'professional' ? (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Industry"
                        value={profile.industry || ''}
                        onChange={(e) => handleFieldChange('industry', e.target.value)}
                        placeholder="e.g., Technology, Healthcare, Finance"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Experience Level"
                        select
                        value={profile.experienceLevel || ''}
                        onChange={(e) => handleFieldChange('experienceLevel', e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{ mb: 2 }}
                      >
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Response Time (minutes)"
                        type="number"
                        value={profile.responseTime || ''}
                        onChange={(e) => handleFieldChange('responseTime', parseInt(e.target.value) || 15)}
                        placeholder="15"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={profile.isOnline || false}
                            onChange={(e) => handleFieldChange('isOnline', e.target.checked)}
                          />
                        }
                        label="Show as Online"
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={handleSaveSection}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Industry</Typography>
                    <Typography variant="body1">{profile.industry || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Experience Level</Typography>
                    <Typography variant="body1">{profile.experienceLevel || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Response Time</Typography>
                    <Typography variant="body1">{profile.responseTime || 15} minutes</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: profile.isOnline ? '#4CAF50' : '#FFA726',
                        }}
                      />
                      <Typography variant="body1">
                        {profile.isOnline ? 'Online' : 'Offline'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Card>

          {/* AI Collaborators */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI Collaborators
                </Typography>
                <IconButton size="small" onClick={() => handleEditSection('aiAgents')}>
                  <Edit />
                </IconButton>
              </Box>
              
              {editingSection === 'aiAgents' ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add AI agents and tools you collaborate with
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Agent Name"
                        value={profile.agentName || ''}
                        onChange={(e) => handleFieldChange('agentName', e.target.value)}
                        placeholder="e.g., Claude, GPT-4, Custom Agent"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Agent Type"
                        select
                        value={profile.agentType || ''}
                        onChange={(e) => handleFieldChange('agentType', e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{ mb: 2 }}
                      >
                        <option value="">Select Type</option>
                        <option value="Assistant">General Assistant</option>
                        <option value="Analyst">Data Analyst</option>
                        <option value="Writer">Content Writer</option>
                        <option value="Developer">Code Developer</option>
                        <option value="Designer">Creative Designer</option>
                        <option value="Researcher">Research Assistant</option>
                        <option value="Custom">Custom Agent</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Specialization Areas"
                        value={profile.agentSpecialization || ''}
                        onChange={(e) => handleFieldChange('agentSpecialization', e.target.value)}
                        placeholder="e.g., Natural Language Processing, Data Analysis, Creative Writing"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={handleSaveSection}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  {(profile.aiAgents && profile.aiAgents.length > 0) ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profile.aiAgents.map((agent: any, index: number) => (
                        <Chip
                          key={index}
                          label={`${agent.name || agent.type || 'AI Agent'} - ${agent.specialization || 'General'}`}
                          variant="outlined"
                          sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No AI collaborators added yet. Add your AI agents and tools to showcase your collaboration experience.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Card>    fullWidth 
                variant="outlined" 
                sx={{ 
                  mt: 2,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': { borderColor: 'primary.main' }
                }}
              >
                Show all analytics
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      {editMode && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 28 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      )}

      {/* Edit Dialogs */}
      {editingSection === 'experience' && (
        <Dialog open={true} onClose={handleCancelEdit} maxWidth="md" fullWidth>
          <DialogTitle>Add Experience</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Job Title"
                margin="normal"
                placeholder="e.g. Software Engineer"
                value={experienceForm.title}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, title: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Company"
                margin="normal"
                placeholder="e.g. Google"
                value={experienceForm.company}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, company: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Location"
                margin="normal"
                placeholder="e.g. San Francisco, CA"
                value={experienceForm.location}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, location: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Description"
                margin="normal"
                multiline
                rows={4}
                placeholder="Describe your role and achievements..."
                value={experienceForm.description}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelEdit}>Cancel</Button>
            <Button 
              onClick={handleSaveSection} 
              variant="contained"
              disabled={!experienceForm.title || !experienceForm.company}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {editingSection === 'skills' && (
        <Dialog open={true} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
          <DialogTitle>Add Skills</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Skill"
                margin="normal"
                placeholder="e.g. JavaScript, Python, React"
                helperText="Add one skill at a time"
                value={skillForm.name}
                onChange={(e) => setSkillForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelEdit}>Cancel</Button>
            <Button 
              onClick={handleSaveSection} 
              variant="contained"
              disabled={!skillForm.name.trim()}
            >
              Add Skill
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default LinkedInStyleProfilePage;

