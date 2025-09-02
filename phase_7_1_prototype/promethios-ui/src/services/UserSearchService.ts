/**
 * User Search Service
 * 
 * Provides functionality to search for users in the system
 * for collaboration invitations, connections, etc.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAt,
  endAt
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface SearchableUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface UserSearchOptions {
  limit?: number;
  excludeUserIds?: string[];
  includeOfflineUsers?: boolean;
}

class UserSearchService {
  private static instance: UserSearchService;
  private readonly USERS_COLLECTION = 'users';

  static getInstance(): UserSearchService {
    if (!UserSearchService.instance) {
      UserSearchService.instance = new UserSearchService();
    }
    return UserSearchService.instance;
  }

  /**
   * Search users by display name or email
   */
  async searchUsers(
    searchQuery: string,
    options: UserSearchOptions = {}
  ): Promise<SearchableUser[]> {
    const {
      limit: searchLimit = 10,
      excludeUserIds = [],
      includeOfflineUsers = true
    } = options;

    if (!searchQuery.trim() || searchQuery.length < 2) {
      return [];
    }

    try {
      console.log('🔍 [UserSearch] Searching for users with query:', searchQuery);

      const results: SearchableUser[] = [];
      const query_lower = searchQuery.toLowerCase();

      // Search by display name (case-insensitive)
      const nameResults = await this.searchByField('displayName', searchQuery, searchLimit);
      results.push(...nameResults);

      // Search by email (case-insensitive)
      const emailResults = await this.searchByField('email', searchQuery, searchLimit);
      results.push(...emailResults);

      // Remove duplicates and excluded users
      const uniqueResults = results.filter((user, index, self) => {
        const isUnique = self.findIndex(u => u.uid === user.uid) === index;
        const isNotExcluded = !excludeUserIds.includes(user.uid);
        return isUnique && isNotExcluded;
      });

      // Sort by relevance (exact matches first, then partial matches)
      const sortedResults = uniqueResults.sort((a, b) => {
        const aNameMatch = a.displayName.toLowerCase().includes(query_lower);
        const bNameMatch = b.displayName.toLowerCase().includes(query_lower);
        const aEmailMatch = a.email.toLowerCase().includes(query_lower);
        const bEmailMatch = b.email.toLowerCase().includes(query_lower);

        // Prioritize exact name matches
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;

        // Then email matches
        if (aEmailMatch && !bEmailMatch) return -1;
        if (!aEmailMatch && bEmailMatch) return 1;

        // Finally alphabetical by name
        return a.displayName.localeCompare(b.displayName);
      });

      console.log(`✅ [UserSearch] Found ${sortedResults.length} users for query: ${searchQuery}`);
      return sortedResults.slice(0, searchLimit);

    } catch (error) {
      console.error('❌ [UserSearch] Error searching users:', error);
      return [];
    }
  }

  /**
   * Get user suggestions based on connections, recent interactions, etc.
   */
  async getUserSuggestions(
    currentUserId: string,
    options: UserSearchOptions = {}
  ): Promise<SearchableUser[]> {
    const { limit: searchLimit = 5 } = options;

    try {
      console.log('💡 [UserSearch] Getting user suggestions for:', currentUserId);

      // For now, get recent users (in a real app, this would be more sophisticated)
      const q = query(
        collection(db, this.USERS_COLLECTION),
        where('uid', '!=', currentUserId),
        orderBy('uid'),
        orderBy('createdAt', 'desc'),
        limit(searchLimit)
      );

      const snapshot = await getDocs(q);
      const suggestions = snapshot.docs.map(doc => this.mapUserDocument(doc.data()));

      console.log(`✅ [UserSearch] Found ${suggestions.length} user suggestions`);
      return suggestions;

    } catch (error) {
      console.error('❌ [UserSearch] Error getting user suggestions:', error);
      return [];
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<SearchableUser | null> {
    try {
      const q = query(
        collection(db, this.USERS_COLLECTION),
        where('uid', '==', userId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      return this.mapUserDocument(snapshot.docs[0].data());
    } catch (error) {
      console.error('❌ [UserSearch] Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Get multiple users by IDs
   */
  async getUsersByIds(userIds: string[]): Promise<SearchableUser[]> {
    if (userIds.length === 0) return [];

    try {
      // Firebase 'in' queries are limited to 10 items, so we need to batch
      const batches = [];
      for (let i = 0; i < userIds.length; i += 10) {
        const batch = userIds.slice(i, i + 10);
        const q = query(
          collection(db, this.USERS_COLLECTION),
          where('uid', 'in', batch)
        );
        batches.push(getDocs(q));
      }

      const snapshots = await Promise.all(batches);
      const users: SearchableUser[] = [];

      snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          users.push(this.mapUserDocument(doc.data()));
        });
      });

      return users;
    } catch (error) {
      console.error('❌ [UserSearch] Error getting users by IDs:', error);
      return [];
    }
  }

  // Private helper methods

  private async searchByField(
    field: string,
    searchQuery: string,
    searchLimit: number
  ): Promise<SearchableUser[]> {
    try {
      // For case-insensitive search, we need to use range queries
      const query_lower = searchQuery.toLowerCase();
      const query_upper = searchQuery.toLowerCase() + '\uf8ff';

      const q = query(
        collection(db, this.USERS_COLLECTION),
        orderBy(field),
        startAt(query_lower),
        endAt(query_upper),
        limit(searchLimit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.mapUserDocument(doc.data()));

    } catch (error) {
      console.error(`❌ [UserSearch] Error searching by ${field}:`, error);
      return [];
    }
  }

  private mapUserDocument(data: any): SearchableUser {
    return {
      uid: data.uid || data.id,
      displayName: data.displayName || data.name || 'Unknown User',
      email: data.email || '',
      photoURL: data.photoURL || null,
      isOnline: data.isOnline || false,
      lastSeen: data.lastSeen ? new Date(data.lastSeen.seconds * 1000) : undefined
    };
  }
}

export const userSearchService = UserSearchService.getInstance();
export default userSearchService;

