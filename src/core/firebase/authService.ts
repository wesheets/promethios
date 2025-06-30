/**
 * Firebase Authentication Service for Promethios
 * 
 * DISABLED: This Firebase authentication service has been disabled to prevent conflicts
 * with the main application Firebase instance in /phase_7_1_prototype/
 * 
 * This service provides authentication functionality including user sign-in, sign-out,
 * registration, and role-based access control (RBAC) for the Promethios application.
 */

// FIREBASE DISABLED - Preventing conflicts with main app
console.warn('Firebase authService in /src/ directory has been disabled to prevent conflicts with main app');

// Commented out to prevent Firebase initialization conflicts
/*
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

// ... rest of the original service code would be here but is commented out
*/

// Provide mock exports to prevent import errors
export const authService = {
  signIn: () => Promise.reject(new Error('Firebase authService disabled')),
  signOut: () => Promise.reject(new Error('Firebase authService disabled')),
  signUp: () => Promise.reject(new Error('Firebase authService disabled')),
  getCurrentUser: () => null,
  onAuthStateChanged: () => () => {},
  resetPassword: () => Promise.reject(new Error('Firebase authService disabled'))
};

