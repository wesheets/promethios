/**
 * Firebase Authentication Service for Promethios
 * 
 * This service provides authentication functionality including user sign-in, sign-out,
 * registration, and role-based access control (RBAC) for the Promethios application.
 */

import { 
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  getIdTokenResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from './firebaseConfig';

// User role types
export type UserRole = 'admin' | 'user' | 'viewer';

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  roles: UserRole[];
  createdAt: Date;
  lastLogin: Date;
}

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 * @returns UserCredential
 */
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

/**
 * Register a new user
 * @param email User email
 * @param password User password
 * @param displayName User display name
 * @returns UserCredential
 */
export const register = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update profile if display name is provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  
  // Create user profile in Firestore
  if (userCredential.user) {
    const userProfile: UserProfile = {
      uid: userCredential.user.uid,
      email: email,
      displayName: displayName || '',
      roles: ['user'], // Default role
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    await setDoc(doc(firestore, 'users', userCredential.user.uid), userProfile);
  }
  
  return userCredential;
};

/**
 * Send password reset email
 * @param email User email
 */
export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * Check if user has admin role
 * @param user Firebase User
 * @returns Promise<boolean>
 */
export const isAdmin = async (user: User): Promise<boolean> => {
  // First check Firebase custom claims
  const tokenResult = await user.getIdTokenResult();
  if (tokenResult.claims.admin === true) {
    return true;
  }
  
  // If not in custom claims, check Firestore
  const userDoc = await getDoc(doc(firestore, 'users', user.uid));
  if (userDoc.exists()) {
    const userData = userDoc.data() as UserProfile;
    return userData.roles.includes('admin');
  }
  
  return false;
};

/**
 * Get user roles
 * @param user Firebase User
 * @returns Promise<UserRole[]>
 */
export const getUserRoles = async (user: User): Promise<UserRole[]> => {
  // First check Firebase custom claims
  const tokenResult = await user.getIdTokenResult();
  if (tokenResult.claims.roles) {
    return tokenResult.claims.roles as UserRole[];
  }
  
  // If not in custom claims, check Firestore
  const userDoc = await getDoc(doc(firestore, 'users', user.uid));
  if (userDoc.exists()) {
    const userData = userDoc.data() as UserProfile;
    return userData.roles;
  }
  
  return ['user']; // Default role
};

/**
 * Authentication state observer
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChange = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get current user profile from Firestore
 * @param uid User ID
 * @returns Promise<UserProfile | null>
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(firestore, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
};

export default {
  signIn,
  signOut,
  register,
  resetPassword,
  isAdmin,
  getUserRoles,
  onAuthStateChange,
  getUserProfile
};
