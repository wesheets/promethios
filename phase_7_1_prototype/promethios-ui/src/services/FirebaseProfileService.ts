import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/config';
import { UserProfile } from '../types/profile';

/**
 * FirebaseProfileService - A unified service for managing user profiles in Firebase
 */
export class FirebaseProfileService {
  /**
   * Get a user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(db, 'userProfiles', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Get or create a user profile
   */
  async getOrCreateUserProfile(userId: string, defaultData: Partial<UserProfile> = {}): Promise<UserProfile> {
    try {
      const existingProfile = await this.getUserProfile(userId);
      
      if (existingProfile) {
        return existingProfile;
      }
      
      // Create a new profile if one doesn't exist
      const newProfile: UserProfile = {
        id: userId,
        name: defaultData.name || '',
        displayName: defaultData.displayName || '',
        email: defaultData.email || '',
        avatar: defaultData.avatar || '',
        coverPhoto: defaultData.coverPhoto || '',
        title: defaultData.title || '',
        company: defaultData.company || '',
        location: defaultData.location || '',
        bio: defaultData.bio || '',
        skills: defaultData.skills || [],
        aiAgents: defaultData.aiAgents || [],
        connections: 0,
        rating: 4.0,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...defaultData
      };
      
      await this.saveUserProfile(userId, newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error getting or creating user profile:', error);
      throw error;
    }
  }

  /**
   * Save a user profile
   */
  async saveUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    try {
      const userDocRef = doc(db, 'userProfiles', userId);
      
      // Update the updatedAt timestamp
      const dataToSave = {
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      
      // Check if document exists
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(userDocRef, dataToSave);
      } else {
        // Create new document
        await setDoc(userDocRef, {
          ...dataToSave,
          id: userId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Upload a profile image (avatar or cover photo)
   */
  async uploadProfileImage(userId: string, file: File, type: 'avatar' | 'coverPhoto'): Promise<string> {
    try {
      const storage = getStorage();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}_${type}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `profileImages/${userId}/${fileName}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the user profile with the new image URL
      const userDocRef = doc(db, 'userProfiles', userId);
      await updateDoc(userDocRef, { [type]: downloadURL });
      
      return downloadURL;
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get all user profiles
   */
  async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const profilesCollection = collection(db, 'userProfiles');
      const querySnapshot = await getDocs(profilesCollection);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
    } catch (error) {
      console.error('Error getting all profiles:', error);
      throw error;
    }
  }

  /**
   * Search for user profiles
   */
  async searchProfiles(searchTerm: string): Promise<UserProfile[]> {
    try {
      // Get all profiles (in a real app, you'd use a more efficient search method)
      const allProfiles = await this.getAllProfiles();
      
      // Filter profiles based on search term
      return allProfiles.filter(profile => {
        const searchableFields = [
          profile.name,
          profile.displayName,
          profile.title,
          profile.company,
          profile.location,
          profile.bio,
          ...(profile.skills || [])
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableFields.includes(searchTerm.toLowerCase());
      });
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  }
}

export const firebaseProfileService = new FirebaseProfileService();

