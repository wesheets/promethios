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

      try {
        setLoading(true);
        
        // Search for user by profileURL field
        console.log('🔍 PublicProfileHandler: Searching for profileURL:', username);
        
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../firebase/config');
        
        // Query profiles with matching profileURL
        const q = query(
          collection(db, 'userProfiles'),
          where('profileURL', '==', username)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const profileDoc = querySnapshot.docs[0];
          const profileData = profileDoc.data();
          const userId = profileDoc.id;
          
          console.log('✅ PublicProfileHandler: Found profile by URL:', {
            profileURL: username,
            userId: userId,
            displayName: profileData.displayName
          });
          
          setFirebaseUid(userId);
        } else {
          console.error('❌ PublicProfileHandler: No profile found with URL:', username);
          setError('Profile not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('💥 PublicProfileHandler: Failed to find user by URL:', error);
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

