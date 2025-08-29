/**
 * ProfileURLService
 * 
 * Service for automatically generating unique profile URLs for users
 */

export class ProfileURLService {
  
  /**
   * Generate a unique profile URL for a user
   */
  static async generateUniqueURL(displayName: string, email: string, userId: string): Promise<string> {
    try {
      // Convert display name to URL-friendly format
      const baseURL = this.nameToURL(displayName, email);
      
      // Check if URL already exists and generate unique version
      const uniqueURL = await this.ensureUniqueURL(baseURL, userId);
      
      console.log(`🔗 Generated unique URL for ${displayName}: ${uniqueURL}`);
      return uniqueURL;
      
    } catch (error) {
      console.error('❌ Failed to generate unique URL:', error);
      // Fallback to user ID if all else fails
      return `user-${userId.substring(0, 8)}`;
    }
  }

  /**
   * Convert name to URL-friendly format
   */
  private static nameToURL(displayName: string, email: string): string {
    if (!displayName || displayName.trim() === '') {
      // Use email prefix if no display name
      const emailPrefix = email.split('@')[0];
      return emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    return displayName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Ensure URL is unique by checking existing users and adding suffix if needed
   */
  private static async ensureUniqueURL(baseURL: string, currentUserId: string): Promise<string> {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      // Check if base URL is available
      const isAvailable = await this.isURLAvailable(baseURL, currentUserId);
      if (isAvailable) {
        return baseURL;
      }

      // If not available, try with suffixes
      for (let i = 2; i <= 100; i++) {
        const candidateURL = `${baseURL}-${i}`;
        const isAvailable = await this.isURLAvailable(candidateURL, currentUserId);
        if (isAvailable) {
          return candidateURL;
        }
      }

      // If all numbered versions are taken, use timestamp
      const timestamp = Date.now().toString().slice(-6);
      return `${baseURL}-${timestamp}`;
      
    } catch (error) {
      console.error('❌ Error ensuring unique URL:', error);
      // Fallback to timestamp-based URL
      const timestamp = Date.now().toString().slice(-6);
      return `${baseURL}-${timestamp}`;
    }
  }

  /**
   * Check if a URL is available (not used by another user)
   */
  static async isURLAvailable(url: string, currentUserId: string): Promise<boolean> {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      // Query profiles with this profileURL
      const q = query(
        collection(db, 'userProfiles'),
        where('profileURL', '==', url)
      );
      
      const querySnapshot = await getDocs(q);
      
      // URL is available if no documents found, or if the only document is the current user
      if (querySnapshot.empty) {
        return true;
      }
      
      // Check if the only match is the current user (updating their own profile)
      const docs = querySnapshot.docs;
      if (docs.length === 1 && docs[0].id === currentUserId) {
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Error checking URL availability:', error);
      return false;
    }
  }

  /**
   * Get the profile URL for a user (from their profile document)
   */
  static async getProfileURL(userId: string): Promise<string | null> {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const profileRef = doc(db, 'userProfiles', userId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        return data.profileURL || null;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error getting profile URL:', error);
      return null;
    }
  }

  /**
   * Update the profile URL for a user
   */
  static async updateProfileURL(userId: string, profileURL: string): Promise<void> {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const profileRef = doc(db, 'userProfiles', userId);
      await updateDoc(profileRef, { profileURL });
      
      console.log(`✅ Updated profile URL for ${userId}: ${profileURL}`);
      
    } catch (error) {
      console.error('❌ Error updating profile URL:', error);
      throw error;
    }
  }
}

