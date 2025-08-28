import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userProfileService, UserProfile } from '../services/userProfileService';
import {
  Box,
  Card,
  Typography,
  Grid,
  Button,
  Avatar,
  CircularProgress,
  Divider,
  IconButton,
  Chip,
  Stack,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Business,
  LocationOn,
  Visibility,
  Security,
  Add,
  Work,
  School,
  Language,
  Link as LinkIcon,
  LinkedIn,
  Twitter,
  GitHub,
  Public,
  Analytics,
  VerifiedUser,
  Star,
  TrendingUp,
  Group,
  Message,
  PersonAdd,
  Share,
  MoreVert,
  Report,
  Block,
  Send,
  Close,
  CheckCircle,
  Schedule
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

interface Connection {
  id: string;
  name: string;
  title: string;
  avatar: string;
  mutualConnections: number;
}

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile & {
    headline?: string;
    summary?: string;
    experience?: Experience[];
    education?: Education[];
    skills?: Skill[];
    languages?: string[];
    connections?: number;
    mutualConnections?: number;
    isConnected?: boolean;
    connectionRequestSent?: boolean;
  } | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [connectionRequested, setConnectionRequested] = useState(false);

  // Mock data for demonstration
  const mockProfile = {
    userId: userId || '',
    firstName: 'Sarah',
    lastName: 'Chen',
    displayName: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    avatar: '',
    bio: 'Passionate about AI collaboration and human-machine partnerships.',
    jobTitle: 'AI Research Director',
    organization: 'TechCorp',
    location: 'San Francisco, CA',
    website: 'https://sarahchen.dev',
    linkedIn: 'https://linkedin.com/in/sarahchen',
    twitter: 'https://twitter.com/sarahchen',
    github: 'https://github.com/sarahchen',
    emailVerified: true,
    phoneVerified: true,
    dateJoined: '2023-01-15',
    lastLogin: new Date().toISOString(),
    createdAt: '2023-01-15',
    updatedAt: new Date().toISOString(),
    // LinkedIn-style additions
    headline: 'AI Research Director at TechCorp | Building the future of human-AI collaboration',
    summary: 'Experienced AI researcher with 8+ years in machine learning and human-computer interaction. Led teams that developed breakthrough AI collaboration tools used by Fortune 500 companies. Passionate about ethical AI and creating technology that augments human capabilities.',
    experience: [
      {
        id: '1',
        title: 'AI Research Director',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        startDate: '2022-01',
        current: true,
        description: 'Leading a team of 15 researchers developing next-generation AI collaboration platforms. Increased user engagement by 300% and secured $50M in funding.'
      },
      {
        id: '2',
        title: 'Senior ML Engineer',
        company: 'DataFlow Inc',
        location: 'Seattle, WA',
        startDate: '2019-03',
        endDate: '2021-12',
        current: false,
        description: 'Developed machine learning models for natural language processing and computer vision applications.'
      }
    ],
    education: [
      {
        id: '1',
        school: 'Stanford University',
        degree: 'PhD',
        field: 'Computer Science',
        startDate: '2015',
        endDate: '2019',
        description: 'Dissertation: "Human-AI Collaborative Decision Making in Complex Systems"'
      }
    ],
    skills: [
      { id: '1', name: 'Machine Learning', endorsements: 47 },
      { id: '2', name: 'AI Research', endorsements: 32 },
      { id: '3', name: 'Python', endorsements: 28 },
      { id: '4', name: 'TensorFlow', endorsements: 23 },
      { id: '5', name: 'Research Leadership', endorsements: 19 }
    ],
    languages: ['English', 'Mandarin', 'Spanish'],
    connections: 1247,
    mutualConnections: 23,
    isConnected: false,
    connectionRequestSent: false
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load profile from userProfileService
        const userProfile = await userProfileService.getPublicProfile(userId);
        
        if (userProfile) {
          // Filter data based on privacy settings for public view
          const publicProfile = filterPublicProfileData(userProfile);
          setProfile(publicProfile);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  // Filter profile data based on privacy settings
  const filterPublicProfileData = (profileData: any) => {
    const privacySettings = profileData.privacySettings || {};
    
    return {
      ...profileData,
      // Only include fields that are set to public
      email: privacySettings.showEmail ? profileData.email : undefined,
      phone: privacySettings.showPhone ? profileData.phone : undefined,
      location: privacySettings.showLocation !== false ? profileData.location : undefined,
      // Always show basic info
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      displayName: profileData.displayName,
      avatar: profileData.avatar,
      headline: profileData.headline,
      bio: profileData.bio,
      jobTitle: profileData.jobTitle,
      organization: profileData.organization,
      // Show professional info based on settings
      experience: privacySettings.showExperience !== false ? profileData.experience : [],
      education: privacySettings.showEducation !== false ? profileData.education : [],
      skills: privacySettings.showSkills !== false ? profileData.skills : [],
      // Social links are typically public
      socialLinks: profileData.socialLinks,
      // Connection info
      connections: profileData.connections || 0,
      emailVerified: profileData.emailVerified,
      phoneVerified: profileData.phoneVerified
    };
  };

  const handleConnect = async () => {
    // In a real app, this would send a connection request
    setConnectionRequested(true);
    console.log('Connection request sent to:', profile?.displayName);
  };

  const handleMessage = async () => {
    if (!messageText.trim()) return;
    
    // In a real app, this would send a message
    console.log('Message sent to:', profile?.displayName, messageText);
    setMessageDialogOpen(false);
    setMessageText('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          Profile not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto', 
      p: 3,
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
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
                <MoreVert />
              </IconButton>
            </Box>

            {/* Profile Info */}
            <Box sx={{ p: 3, pt: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2, mt: -8 }}>
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
                
                <Box sx={{ ml: 3, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {profile.displayName}
                    </Typography>
                    {profile.emailVerified && (
                      <Tooltip title="Verified Profile">
                        <VerifiedUser color="primary" />
                      </Tooltip>
                    )}
                  </Box>
                  
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    {profile.headline}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {profile.location} • {profile.connections} connections
                    {profile.mutualConnections && profile.mutualConnections > 0 && (
                      <> • {profile.mutualConnections} mutual connections</>
                    )}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Button 
                      variant="contained" 
                      startIcon={<Message />}
                      onClick={() => setMessageDialogOpen(true)}
                      sx={{ borderRadius: 20 }}
                    >
                      Message
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={connectionRequested ? undefined : <PersonAdd />}
                      onClick={handleConnect}
                      disabled={connectionRequested || profile.isConnected}
                      sx={{ 
                        borderRadius: 20,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      {profile.isConnected ? 'Connected' : 
                       connectionRequested ? 'Request Sent' : 'Connect'}
                    </Button>
                    <IconButton 
                      sx={{ 
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <Share />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>

              {/* Contact Info */}
              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                p: 2, 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {profile.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon fontSize="small" />
                    <Typography variant="body2" color="primary" component="a" href={profile.website} target="_blank">
                      Website
                    </Typography>
                  </Box>
                )}
                {profile.linkedIn && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkedIn fontSize="small" />
                    <Typography variant="body2" color="primary" component="a" href={profile.linkedIn} target="_blank">
                      LinkedIn
                    </Typography>
                  </Box>
                )}
                {profile.twitter && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Twitter fontSize="small" />
                    <Typography variant="body2" color="primary" component="a" href={profile.twitter} target="_blank">
                      Twitter
                    </Typography>
                  </Box>
                )}
                {profile.github && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GitHub fontSize="small" />
                    <Typography variant="body2" color="primary" component="a" href={profile.github} target="_blank">
                      GitHub
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Card>

          {/* About Section */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                About
              </Typography>
              
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {profile.summary}
              </Typography>
            </Box>
          </Card>

          {/* Experience Section */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Experience
              </Typography>
              
              {profile.experience?.map((exp, index) => (
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
              ))}
            </Box>
          </Card>

          {/* Education Section */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Education
              </Typography>
              
              {profile.education?.map((edu, index) => (
                <Box key={edu.id} sx={{ mb: index < profile.education!.length - 1 ? 3 : 0 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ width: 48, height: 48, backgroundColor: 'secondary.main' }}>
                      <School />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {edu.school}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {edu.degree} in {edu.field}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {edu.startDate} - {edu.endDate}
                      </Typography>
                      {edu.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {edu.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {index < profile.education!.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </Box>
          </Card>

          {/* Skills Section */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Skills
              </Typography>
              
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {profile.skills?.map((skill) => (
                  <Chip
                    key={skill.id}
                    label={`${skill.name} • ${skill.endorsements} endorsements`}
                    variant="outlined"
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': { 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
          {/* Mutual Connections */}
          {profile.mutualConnections && profile.mutualConnections > 0 && (
            <Card sx={{ 
              mb: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  {profile.mutualConnections} mutual connections
                </Typography>
                
                <Stack spacing={1}>
                  {[
                    { name: 'John Doe', title: 'Software Engineer' },
                    { name: 'Jane Smith', title: 'Product Manager' },
                    { name: 'Mike Johnson', title: 'Data Scientist' }
                  ].slice(0, 3).map((connection, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {connection.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {connection.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {connection.title}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
                
                <Button size="small" sx={{ mt: 1 }}>
                  View all mutual connections
                </Button>
              </Box>
            </Card>
          )}

          {/* Languages */}
          <Card sx={{ 
            mb: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Languages
              </Typography>
              
              <Stack spacing={1}>
                {profile.languages?.map((language, index) => (
                  <Typography key={index} variant="body2">
                    {language}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </Card>

          {/* People You May Know */}
          <Card sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                People you may know
              </Typography>
              
              {[
                { name: 'Alex Thompson', title: 'AI Researcher', mutualConnections: 5 },
                { name: 'Lisa Wang', title: 'ML Engineer', mutualConnections: 3 },
                { name: 'David Brown', title: 'Tech Lead', mutualConnections: 8 }
              ].map((person, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 40, height: 40 }}>
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {person.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {person.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {person.mutualConnections} mutual connections
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined">
                    Connect
                  </Button>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Message Dialog */}
      <Dialog 
        open={messageDialogOpen} 
        onClose={() => setMessageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <DialogTitle>
          Send message to {profile.displayName}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Message"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleMessage} 
            variant="contained"
            disabled={!messageText.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PublicProfilePage;

