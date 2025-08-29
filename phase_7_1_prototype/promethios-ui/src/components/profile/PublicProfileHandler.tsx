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
        console.error('❌ PublicProfileHandler: Username not provided');
        setError('Username not provided');
        setLoading(false);
        return;
      }

      console.log('🔍 PublicProfileHandler: Looking for username:', username);

      // Direct mapping for known users (using real Firebase UIDs from Auth console)
      const directMappings: Record<string, string> = {
        // Ted Sheets (original user)
        'ted-sheets': 'HSf4SIwCcRRzAFPuFXlFE9CsQ6W2',
        
        // Ted Sheets (new user - ted@crownavellc.com)
        'ted-crownavellc': 't8RZC8wnUNURzSQohLtvMEA8hqw1',
        
        // Real Firebase Auth users from the authentication console
        'oldecboy': 'OkYBqbJvqpGUdRYHKw.jaqJ...',  // oldecboy@gmail.com
        'therma-sheets': 'VzlnRmqJyb92fezqzFqQD5B...',  // thermawesheets@gmail.com  
        'ted-crowell': 'fuezlnvJOYgutPWZRJBVX7...',  // ted@crowellville.com
        'wesley-sheets': '4Hf4FmpcdlnrSaFSGqLdW2',  // wesheets@hotmail.com
        'ted-majestic': 'XKZCZOLPKqBwKbSdpLKjB...'  // ted@majesticgoods.com
      };

      if (directMappings[username.toLowerCase()]) {
        console.log('✅ PublicProfileHandler: Found direct mapping for:', username);
        setFirebaseUid(directMappings[username.toLowerCase()]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 PublicProfileHandler: Searching profiles for username:', username);
        
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
        
        console.log('📊 PublicProfileHandler: Found profiles:', searchResult.users.length);
        
        // Look for a profile where the name matches the username
        // You might want to add a dedicated 'username' field to profiles
        const matchingProfile = searchResult.users.find(profile => {
          const profileUsername = profile.name?.toLowerCase().replace(/\s+/g, '-');
          console.log('🔍 PublicProfileHandler: Comparing', profileUsername, 'with', username.toLowerCase());
          return profileUsername === username.toLowerCase();
        });
        
        if (matchingProfile) {
          console.log('✅ PublicProfileHandler: Found matching profile:', matchingProfile);
          setFirebaseUid(matchingProfile.userId);
        } else {
          console.error('❌ PublicProfileHandler: No matching profile found for username:', username);
          setError('Profile not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('💥 PublicProfileHandler: Failed to find user by username:', error);
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

