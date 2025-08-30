/**
 * AdminService
 * 
 * Handles admin operations for beta signup management, including
 * approving/rejecting users and managing admin access control.
 */

import { 
  doc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile } from '../types/profile';

export interface PendingSignup {
  id: string;
  email: string;
  name: string;
  role: string;
  organization: string;
  whyAccess: string;
  currentAiTools?: string;
  socialProfile?: string;
  onboardingCall: boolean;
  signupAt: string;
  signupSource: string;
}

export interface ApprovalAction {
  userId: string;
  action: 'approve' | 'reject';
  adminNotes?: string;
  adminUserId: string;
}

export class AdminService {
  private readonly ADMIN_EMAILS = ['wesheets@gmail.com', 'admin@promethios.com'];
  
  /**
   * Check if user is admin
   */
  isAdmin(userEmail: string): boolean {
    return this.ADMIN_EMAILS.includes(userEmail.toLowerCase());
  }
  
  /**
   * Get all pending beta signups
   */
  async getPendingSignups(): Promise<PendingSignup[]> {
    try {
      console.log('🔍 [Admin] Fetching pending signups...');
      
      const usersRef = collection(db, 'userProfiles');
      const q = query(
        usersRef,
        where('approvalStatus', '==', 'pending'),
        orderBy('signupAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const pendingSignups: PendingSignup[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        pendingSignups.push({
          id: doc.id,
          email: data.email || '',
          name: data.name || data.displayName || 'Unknown',
          role: data.role || 'Unknown',
          organization: data.organization || 'Unknown',
          whyAccess: data.whyAccess || '',
          currentAiTools: data.currentAiTools,
          socialProfile: data.socialProfile,
          onboardingCall: data.onboardingCall || false,
          signupAt: data.signupAt || '',
          signupSource: data.signupSource || 'unknown'
        });
      });
      
      console.log(`✅ [Admin] Found ${pendingSignups.length} pending signups`);
      return pendingSignups;
      
    } catch (error) {
      console.error('❌ [Admin] Error fetching pending signups:', error);
      throw error;
    }
  }
  
  /**
   * Get all approved users
   */
  async getApprovedUsers(): Promise<UserProfile[]> {
    try {
      console.log('🔍 [Admin] Fetching approved users...');
      
      const usersRef = collection(db, 'userProfiles');
      const q = query(
        usersRef,
        where('approvalStatus', '==', 'approved'),
        orderBy('approvedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const approvedUsers: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        approvedUsers.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      
      console.log(`✅ [Admin] Found ${approvedUsers.length} approved users`);
      return approvedUsers;
      
    } catch (error) {
      console.error('❌ [Admin] Error fetching approved users:', error);
      throw error;
    }
  }
  
  /**
   * Get all rejected users
   */
  async getRejectedUsers(): Promise<UserProfile[]> {
    try {
      console.log('🔍 [Admin] Fetching rejected users...');
      
      const usersRef = collection(db, 'userProfiles');
      const q = query(
        usersRef,
        where('approvalStatus', '==', 'rejected'),
        orderBy('rejectedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const rejectedUsers: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        rejectedUsers.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      
      console.log(`✅ [Admin] Found ${rejectedUsers.length} rejected users`);
      return rejectedUsers;
      
    } catch (error) {
      console.error('❌ [Admin] Error fetching rejected users:', error);
      throw error;
    }
  }
  
  /**
   * Approve a beta signup
   */
  async approveUser(approvalAction: ApprovalAction): Promise<void> {
    try {
      console.log('✅ [Admin] Approving user:', approvalAction.userId);
      
      const userDocRef = doc(db, 'userProfiles', approvalAction.userId);
      
      // Check if user exists
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const updateData = {
        approvalStatus: 'approved',
        approvedBy: approvalAction.adminUserId,
        approvedAt: new Date().toISOString(),
        adminNotes: approvalAction.adminNotes || '',
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userDocRef, updateData);
      
      console.log('✅ [Admin] User approved successfully');
      
      // TODO: Trigger approval email notification
      
    } catch (error) {
      console.error('❌ [Admin] Error approving user:', error);
      throw error;
    }
  }
  
  /**
   * Reject a beta signup
   */
  async rejectUser(approvalAction: ApprovalAction): Promise<void> {
    try {
      console.log('❌ [Admin] Rejecting user:', approvalAction.userId);
      
      const userDocRef = doc(db, 'userProfiles', approvalAction.userId);
      
      // Check if user exists
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const updateData = {
        approvalStatus: 'rejected',
        rejectedBy: approvalAction.adminUserId,
        rejectedAt: new Date().toISOString(),
        adminNotes: approvalAction.adminNotes || '',
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userDocRef, updateData);
      
      console.log('✅ [Admin] User rejected successfully');
      
      // TODO: Trigger rejection email notification
      
    } catch (error) {
      console.error('❌ [Admin] Error rejecting user:', error);
      throw error;
    }
  }
  
  /**
   * Get signup statistics
   */
  async getSignupStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    try {
      console.log('📊 [Admin] Fetching signup statistics...');
      
      const usersRef = collection(db, 'userProfiles');
      
      // Get all users with approval status
      const allUsersQuery = query(usersRef, where('approvalStatus', 'in', ['pending', 'approved', 'rejected']));
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      let pending = 0;
      let approved = 0;
      let rejected = 0;
      
      allUsersSnapshot.forEach((doc) => {
        const data = doc.data();
        switch (data.approvalStatus) {
          case 'pending':
            pending++;
            break;
          case 'approved':
            approved++;
            break;
          case 'rejected':
            rejected++;
            break;
        }
      });
      
      const total = pending + approved + rejected;
      
      console.log(`📊 [Admin] Stats - Pending: ${pending}, Approved: ${approved}, Rejected: ${rejected}, Total: ${total}`);
      
      return { pending, approved, rejected, total };
      
    } catch (error) {
      console.error('❌ [Admin] Error fetching signup stats:', error);
      throw error;
    }
  }
  
  /**
   * Bulk approve users
   */
  async bulkApproveUsers(userIds: string[], adminUserId: string, adminNotes?: string): Promise<void> {
    try {
      console.log(`✅ [Admin] Bulk approving ${userIds.length} users`);
      
      const promises = userIds.map(userId => 
        this.approveUser({
          userId,
          action: 'approve',
          adminNotes,
          adminUserId
        })
      );
      
      await Promise.all(promises);
      
      console.log('✅ [Admin] Bulk approval completed');
      
    } catch (error) {
      console.error('❌ [Admin] Error in bulk approval:', error);
      throw error;
    }
  }
  
  /**
   * Bulk reject users
   */
  async bulkRejectUsers(userIds: string[], adminUserId: string, adminNotes?: string): Promise<void> {
    try {
      console.log(`❌ [Admin] Bulk rejecting ${userIds.length} users`);
      
      const promises = userIds.map(userId => 
        this.rejectUser({
          userId,
          action: 'reject',
          adminNotes,
          adminUserId
        })
      );
      
      await Promise.all(promises);
      
      console.log('✅ [Admin] Bulk rejection completed');
      
    } catch (error) {
      console.error('❌ [Admin] Error in bulk rejection:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();

