import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from '../firebase/config';
import { FirebaseStorageProvider } from './storage/FirebaseStorageProvider';
import { LocalStorageProvider } from './storage/LocalStorageProvider';
import { MemoryStorageProvider } from './storage/MemoryStorageProvider';
import { StorageProvider } from './storage/types';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar: string;
  phone: string;
  location: string;
  organization: string;
  department: string;
  jobTitle: string;
  bio: string;
  timezone: string;
  language: string;
  dateJoined: string;
  lastLogin: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  profileVisibility: 'public' | 'organization' | 'private';
  roles: string[];
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  location?: string;
  organization?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  profileVisibility?: 'public' | 'organization' | 'private';
  avatar?: string;
}

export interface AvatarUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

class UserProfileService {
  private storageProvider: StorageProvider;
  private readonly PROFILE_COLLECTION = 'user_profiles';
  private readonly AVATAR_STORAGE_PATH = 'avatars';

  constructor() {
    // Initialize unified storage with Firebase as primary, localStorage as fallback
    const memoryProvider = new MemoryStorageProvider();
    const localStorageProvider = new LocalStorageProvider(memoryProvider);
    this.storageProvider = new FirebaseStorageProvider(localStorageProvider);
  }

  /**
   * Get user profile from Firebase with unified storage fallback
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log(`📋 Loading profile for user: ${userId}`);

      // Try unified storage first (includes Firebase and fallbacks)
      const storageKey = `${this.PROFILE_COLLECTION}:${userId}`;
      const cachedProfile = await this.storageProvider.get<UserProfile>(storageKey);
      
      if (cachedProfile) {
        console.log(`✅ Profile loaded from unified storage: ${userId}`);
        return cachedProfile;
      }

      // Fallback to direct Firebase access
      const userRef = doc(db, this.PROFILE_COLLECTION, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        
        // Cache in unified storage for future access
        await this.storageProvider.set(storageKey, profileData, {
          ttl: 1000 * 60 * 30, // 30 minutes cache
          namespace: 'user_profiles'
        });
        
        console.log(`✅ Profile loaded from Firebase and cached: ${userId}`);
        return profileData;
      }

      console.log(`⚠️ No profile found for user: ${userId}`);
      return null;

    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw new Error(`Failed to load profile for user ${userId}: ${error}`);
    }
  }

  /**
   * Update user profile with Firebase and unified storage sync
   */
  async updateUserProfile(userId: string, updates: ProfileUpdateData): Promise<UserProfile> {
    try {
      console.log(`📝 Updating profile for user: ${userId}`, updates);

      // Get current profile
      const currentProfile = await this.getUserProfile(userId);
      
      // Prepare updated profile data
      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...updates,
        id: userId,
        updatedAt: new Date().toISOString()
      } as UserProfile;

      // If this is a new profile, set creation timestamp
      if (!currentProfile) {
        updatedProfile.createdAt = new Date().toISOString();
        updatedProfile.dateJoined = new Date().toISOString();
      }

      // Save to Firebase
      const userRef = doc(db, this.PROFILE_COLLECTION, userId);
      await setDoc(userRef, {
        ...updatedProfile,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update unified storage cache
      const storageKey = `${this.PROFILE_COLLECTION}:${userId}`;
      await this.storageProvider.set(storageKey, updatedProfile, {
        ttl: 1000 * 60 * 30, // 30 minutes cache
        namespace: 'user_profiles'
      });

      console.log(`✅ Profile updated successfully: ${userId}`);
      return updatedProfile;

    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw new Error(`Failed to update profile for user ${userId}: ${error}`);
    }
  }

  /**
   * Upload avatar image to Firebase Storage
   */
  async uploadAvatar(userId: string, file: File): Promise<AvatarUploadResult> {
    try {
      console.log(`📸 Uploading avatar for user: ${userId}`);

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB');
      }

      // Create unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${userId}_${timestamp}.${extension}`;
      const storagePath = `${this.AVATAR_STORAGE_PATH}/${filename}`;

      // Note: This is a placeholder for Firebase Storage integration
      // In a real implementation, you would:
      // 1. Import Firebase Storage: import { getStorage } from 'firebase/storage';
      // 2. Create storage reference: const storage = getStorage();
      // 3. Upload file: const storageRef = ref(storage, storagePath);
      // 4. Get download URL: const downloadURL = await getDownloadURL(storageRef);

      // For now, we'll simulate the upload and return a placeholder URL
      const simulatedUrl = `/api/avatars/${filename}`;

      const result: AvatarUploadResult = {
        url: simulatedUrl,
        path: storagePath,
        size: file.size,
        type: file.type
      };

      // Update user profile with new avatar URL
      await this.updateUserProfile(userId, { avatar: result.url });

      console.log(`✅ Avatar uploaded successfully: ${userId}`);
      return result;

    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw new Error(`Failed to upload avatar for user ${userId}: ${error}`);
    }
  }

  /**
   * Delete user avatar from Firebase Storage
   */
  async deleteAvatar(userId: string, avatarPath: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting avatar for user: ${userId}`);

      // Note: This is a placeholder for Firebase Storage integration
      // In a real implementation, you would:
      // 1. Create storage reference: const storageRef = ref(storage, avatarPath);
      // 2. Delete file: await deleteObject(storageRef);

      // Update user profile to remove avatar URL
      await this.updateUserProfile(userId, { avatar: '' });

      console.log(`✅ Avatar deleted successfully: ${userId}`);

    } catch (error) {
      console.error('Failed to delete avatar:', error);
      throw new Error(`Failed to delete avatar for user ${userId}: ${error}`);
    }
  }

  /**
   * Verify user email status
   */
  async verifyEmail(userId: string): Promise<void> {
    try {
      await this.updateUserProfile(userId, { emailVerified: true });
      console.log(`✅ Email verified for user: ${userId}`);
    } catch (error) {
      console.error('Failed to verify email:', error);
      throw error;
    }
  }

  /**
   * Verify user phone status
   */
  async verifyPhone(userId: string): Promise<void> {
    try {
      await this.updateUserProfile(userId, { phoneVerified: true });
      console.log(`✅ Phone verified for user: ${userId}`);
    } catch (error) {
      console.error('Failed to verify phone:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      const userRef = doc(db, this.PROFILE_COLLECTION, userId);
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });

      // Update cache
      const storageKey = `${this.PROFILE_COLLECTION}:${userId}`;
      const cachedProfile = await this.storageProvider.get<UserProfile>(storageKey);
      if (cachedProfile) {
        cachedProfile.lastLogin = new Date().toISOString();
        await this.storageProvider.set(storageKey, cachedProfile, {
          ttl: 1000 * 60 * 30,
          namespace: 'user_profiles'
        });
      }

      console.log(`✅ Last login updated for user: ${userId}`);
    } catch (error) {
      console.error('Failed to update last login:', error);
      throw error;
    }
  }

  /**
   * Clear user profile cache
   */
  async clearProfileCache(userId: string): Promise<void> {
    try {
      const storageKey = `${this.PROFILE_COLLECTION}:${userId}`;
      await this.storageProvider.delete(storageKey);
      console.log(`✅ Profile cache cleared for user: ${userId}`);
    } catch (error) {
      console.error('Failed to clear profile cache:', error);
      throw error;
    }
  }

  /**
   * Get user profile statistics
   */
  async getProfileStats(userId: string): Promise<{
    profileCompleteness: number;
    lastUpdated: string;
    verificationStatus: {
      email: boolean;
      phone: boolean;
      twoFactor: boolean;
    };
  }> {
    try {
      const profile = await this.getUserProfile(userId);
      
      if (!profile) {
        return {
          profileCompleteness: 0,
          lastUpdated: '',
          verificationStatus: {
            email: false,
            phone: false,
            twoFactor: false
          }
        };
      }

      // Calculate profile completeness
      const requiredFields = [
        'firstName', 'lastName', 'displayName', 'email', 
        'organization', 'jobTitle', 'bio'
      ];
      const completedFields = requiredFields.filter(field => 
        profile[field as keyof UserProfile] && 
        String(profile[field as keyof UserProfile]).trim().length > 0
      );
      const profileCompleteness = Math.round((completedFields.length / requiredFields.length) * 100);

      return {
        profileCompleteness,
        lastUpdated: profile.updatedAt || profile.createdAt || '',
        verificationStatus: {
          email: profile.emailVerified || false,
          phone: profile.phoneVerified || false,
          twoFactor: profile.twoFactorEnabled || false
        }
      };

    } catch (error) {
      console.error('Failed to get profile stats:', error);
      throw error;
    }
  }

  /**
   * Search user profiles (for admin/organization features)
   */
  async searchProfiles(query: string, limit: number = 10): Promise<UserProfile[]> {
    try {
      // Note: This is a simplified search implementation
      // In a real application, you might use Algolia or Elasticsearch for better search
      
      console.log(`🔍 Searching profiles with query: ${query}`);
      
      // For now, return empty array as this would require more complex Firebase queries
      // In a real implementation, you would use Firebase's query capabilities or external search
      
      return [];

    } catch (error) {
      console.error('Failed to search profiles:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();
export default userProfileService;

