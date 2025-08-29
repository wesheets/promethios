import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { UserProfileService } from '../../services/UserProfileService';
import FirebaseUserProfilePage from '../../pages/FirebaseUserProfilePage';
import { CircularProgress, Box, Alert } from '@mui/material';

const PublicProfileHandler: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const profileService = new UserProfileService();

  useEffect(() => {
    const findUserByUsername = async () => {
      if (!username) {
        setError('Username not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get profiles by searching (since there's no getAllProfiles method)
        // Use an empty search to get all profiles
        const searchResult = await profileService.searchUsers({
          query: '',
          location: [],
          company: [],
          industry: [],
          skills: [],
          aiAgents: [],
          aiSkills: [],
          collaborationStyle: [],
          experienceLevel: '',
          collaborationRating: [0, 5],
          connectionLevel: '',
          isOnline: null,
          hasPublicProfile: null
        }, 1, 100); // Get up to 100 profiles
        
        // Look for a profile where the name matches the username
        // You might want to add a dedicated 'username' field to profiles
        const matchingProfile = searchResult.users.find(profile => {
          const profileUsername = profile.name?.toLowerCase().replace(/\s+/g, '-');
          return profileUsername === username.toLowerCase();
        });
        
        if (matchingProfile) {
          setFirebaseUid(matchingProfile.userId);
        } else {
          setError('Profile not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to find user by username:', error);
        setError('Failed to load profile');
        setLoading(false);
      }
    };

    findUserByUsername();
  }, [username]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (firebaseUid) {
    // Redirect to the internal profile route with the Firebase UID
    return <Navigate to={`/ui/profile/${firebaseUid}`} replace />;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Alert severity="error">
        Profile not found
      </Alert>
    </Box>
  );
};

export default PublicProfileHandler;

