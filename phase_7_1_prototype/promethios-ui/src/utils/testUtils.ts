/**
 * Test utilities for creating mock users and testing collaboration features
 */

import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

/**
 * Create a temporary mock user in Firebase for testing purposes
 */
export async function createMockUser(userInfo: Partial<MockUser> = {}): Promise<MockUser> {
  const mockUser: MockUser = {
    uid: `mock_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: userInfo.email || `test${Date.now()}@example.com`,
    displayName: userInfo.displayName || `Test User ${Date.now()}`,
    photoURL: userInfo.photoURL || null,
    ...userInfo
  };

  try {
    // Create user document in Firebase
    await setDoc(doc(db, 'users', mockUser.uid), {
      email: mockUser.email,
      displayName: mockUser.displayName,
      photoURL: mockUser.photoURL,
      createdAt: new Date(),
      isTestUser: true, // Mark as test user for cleanup
      approvalStatus: 'approved',
      onboardingCompleted: true,
      profileCompleted: true,
      role: 'user'
    });

    console.log('✅ [TestUtils] Created mock user:', mockUser);
    return mockUser;
  } catch (error) {
    console.error('❌ [TestUtils] Error creating mock user:', error);
    throw error;
  }
}

/**
 * Clean up a mock user from Firebase
 */
export async function deleteMockUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId));
    console.log('✅ [TestUtils] Deleted mock user:', userId);
  } catch (error) {
    console.error('❌ [TestUtils] Error deleting mock user:', error);
  }
}

/**
 * Create multiple mock users for testing
 */
export async function createMockUsers(count: number): Promise<MockUser[]> {
  const users: MockUser[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createMockUser({
      displayName: `Test User ${i + 1}`,
      email: `testuser${i + 1}@example.com`
    });
    users.push(user);
  }
  
  return users;
}

/**
 * Clean up all test users (users marked with isTestUser: true)
 */
export async function cleanupTestUsers(): Promise<void> {
  // This would require a more complex query to find all test users
  // For now, we'll rely on manual cleanup of specific user IDs
  console.log('🧹 [TestUtils] Test user cleanup would happen here');
}

