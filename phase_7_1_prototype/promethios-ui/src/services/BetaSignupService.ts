/**
 * BetaSignupService
 * 
 * Handles beta signup process for Spark access with immediate account creation and approval gates.
 * Users get Firebase Auth accounts and Firestore profiles immediately, but with
 * pending approval status until admin approves them for Spark access.
 */

import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  User,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { UserProfile } from '../types/profile';
import { ProfileURLService } from './ProfileURLService';

export interface BetaSignupData {
  // Step 1 - Essential Info
  email: string;
  name: string;
  role: string;
  organization: string;
  
  // Step 2 - Additional Info
  whyAccess: string;
  currentAiTools?: string;
  socialProfile?: string; // LinkedIn or professional profile
  onboardingCall: boolean;
  
  // System fields
  password?: string; // For email signup
  signupSource: 'waitlist' | 'invitation' | 'direct';
  invitedBy?: string;
}

export interface BetaSignupResult {
  success: boolean;
  user?: User;
  profile?: UserProfile;
  error?: string;
  needsEmailVerification?: boolean;
}

export class BetaSignupService {
  
  /**
   * Sign up user with email and password, creating account with pending approval
   */
  async signupWithEmail(signupData: BetaSignupData): Promise<BetaSignupResult> {
    try {
      console.log('🔐 [BetaSignup] Starting email signup for:', signupData.email);
      
      if (!signupData.password) {
        return { success: false, error: 'Password is required for email signup' };
      }
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        signupData.email, 
        signupData.password
      );
      
      const user = userCredential.user;
      console.log('✅ [BetaSignup] Firebase Auth account created:', user.uid);
      
      // Update display name if provided
      if (signupData.name) {
        await updateProfile(user, { displayName: signupData.name });
      }
      
      // Create Firestore profile with pending status
      const profile = await this.createPendingProfile(user, signupData);
      
      console.log('✅ [BetaSignup] Profile created with pending approval');
      
      return {
        success: true,
        user,
        profile,
        needsEmailVerification: !user.emailVerified
      };
      
    } catch (error: any) {
      console.error('❌ [BetaSignup] Email signup failed:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }
  
  /**
   * Sign up user with Google OAuth, creating account with pending approval
   */
  async signupWithGoogle(signupData: Omit<BetaSignupData, 'email' | 'password'>): Promise<BetaSignupResult> {
    try {
      console.log('🔐 [BetaSignup] Starting Google OAuth signup');
      
      // Google OAuth popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('✅ [BetaSignup] Google OAuth successful:', user.email);
      
      // Check if user already has a profile
      const existingProfile = await this.getUserProfile(user.uid);
      if (existingProfile) {
        console.log('ℹ️ [BetaSignup] User already has profile, returning existing');
        return {
          success: true,
          user,
          profile: existingProfile
        };
      }
      
      // Create Firestore profile with pending status
      const fullSignupData: BetaSignupData = {
        ...signupData,
        email: user.email || '',
        name: user.displayName || undefined
      };
      
      const profile = await this.createPendingProfile(user, fullSignupData);
      
      console.log('✅ [BetaSignup] Google signup complete with pending approval');
      
      return {
        success: true,
        user,
        profile
      };
      
    } catch (error: any) {
      console.error('❌ [BetaSignup] Google signup failed:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }
  
  /**
   * Create a pending user profile in Firestore
   */
  private async createPendingProfile(user: User, signupData: BetaSignupData): Promise<UserProfile> {
    const now = new Date().toISOString();
    
    // Generate unique profile URL
    const displayName = user.displayName || signupData.name || '';
    const email = user.email || signupData.email;
    const profileURL = await ProfileURLService.generateUniqueURL(displayName, email, user.uid);
    
    console.log(`🔗 [BetaSignup] Generated profile URL: ${profileURL}`);
    
    const profile: UserProfile = {
      id: user.uid,
      email: email,
      name: signupData.name || user.displayName || undefined,
      displayName: user.displayName || signupData.name || undefined,
      avatar: user.photoURL || undefined,
      profileURL, // Auto-generated unique profile URL
      
      // Beta signup data
      role: signupData.role,
      organization: signupData.organization,
      whyAccess: signupData.whyAccess,
      currentAiTools: signupData.currentAiTools,
      socialProfile: signupData.socialProfile,
      onboardingCall: signupData.onboardingCall,
      
      // Approval system
      approvalStatus: 'pending',
      signupSource: signupData.signupSource,
      signupAt: now,
      invitedBy: signupData.invitedBy,
      
      // Basic profile setup
      isPublic: false,
      emailVerified: user.emailVerified,
      createdAt: now,
      updatedAt: now,
      
      // Default values
      title: this.getDefaultTitle(signupData.role),
      bio: `Interested in AI collaboration with Spark. ${signupData.whyAccess}`,
      industry: 'Technology',
      
      // Email tracking
      approvalEmailSent: false,
      welcomeEmailSent: false,
      rejectionEmailSent: false
    };
    
    // Save to Firestore
    const userDocRef = doc(db, 'userProfiles', user.uid);
    await setDoc(userDocRef, profile);
    
    // Also log the signup for admin tracking
    await this.logSignupEvent(user.uid, signupData);
    
    console.log('✅ [BetaSignup] Profile saved to Firestore with pending status and profile URL');
    
    return profile;
  }
  
  /**
   * Get user profile from Firestore
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
      console.error('❌ [BetaSignup] Error getting user profile:', error);
      return null;
    }
  }
  
  /**
   * Check if user is approved for access
   */
  async checkApprovalStatus(userId: string): Promise<'pending' | 'approved' | 'rejected' | 'not_found'> {
    try {
      const profile = await this.getUserProfile(userId);
      
      if (!profile) {
        return 'not_found';
      }
      
      return profile.approvalStatus || 'pending';
    } catch (error) {
      console.error('❌ [BetaSignup] Error checking approval status:', error);
      return 'not_found';
    }
  }
  
  /**
   * Log signup event for admin tracking
   */
  private async logSignupEvent(userId: string, signupData: BetaSignupData): Promise<void> {
    try {
      const signupLog = {
        userId,
        email: signupData.email,
        role: signupData.role,
        organization: signupData.organization,
        signupSource: signupData.signupSource,
        timestamp: serverTimestamp(),
        processed: false
      };
      
      await addDoc(collection(db, 'betaSignups'), signupLog);
      console.log('📝 [BetaSignup] Signup event logged for admin review');
    } catch (error) {
      console.error('⚠️ [BetaSignup] Failed to log signup event:', error);
      // Don't fail the signup if logging fails
    }
  }
  
  /**
   * Get default title based on role
   */
  private getDefaultTitle(role: string): string {
    const titleMap: { [key: string]: string } = {
      'Developer': 'Software Developer',
      'Data Scientist': 'Data Scientist',
      'Product Manager': 'Product Manager',
      'Business Analyst': 'Business Analyst',
      'Researcher': 'AI Researcher',
      'Consultant': 'AI Consultant',
      'Executive': 'Technology Executive',
      'Student': 'Student',
      'Other': 'AI Enthusiast'
    };
    
    return titleMap[role] || 'AI Collaboration Partner';
  }
  
  /**
   * Convert Firebase error to user-friendly message
   */
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Sign up was cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Popup was blocked by your browser. Please allow popups and try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

// Export singleton instance
export const betaSignupService = new BetaSignupService();

