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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [peopleAlsoViewed, setPeopleAlsoViewed] = useState<any[]>([]);
  
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
          setProfile(prev => ({ ...prev, ...userProfile }));
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
    await handleSave();
    setEditingSection(null);
    setEditMode(false);
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
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            {/* Cover Photo Area */}
            <Box sx={{ 
              height: 200, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              >
                <PhotoCamera />
              </IconButton>
            </Box>

            {/* Profile Info */}
            <Box sx={{ p: 3, pt: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2, mt: -8 }}>
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
                    >
                      <PhotoCamera fontSize="small" />
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
                
                <Box sx={{ ml: 3, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
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
                border: '1px solid #e1e5e9'
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
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
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
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Experience
                </Typography>
                <IconButton size="small">
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
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Skills
                </Typography>
                <IconButton size="small">
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
                      backgroundColor: 'white',
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
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
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
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Public Profile URL
              </Typography>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                promethios.ai/in/{profile.username || 'user'}
              </Typography>
            </Box>
          </Card>

          {/* People Also Viewed */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
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
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
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

              <Button 
                fullWidth 
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
    </Box>
  );
};

export default LinkedInStyleProfilePage;

