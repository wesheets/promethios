import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

// Check if user has been approved for access
export const checkUserInvitation = async (email: string, db: any): Promise<boolean> => {
  try {
    // Check if user exists in waitlist with approved status
    const waitlistRef = collection(db, 'waitlist');
    const emailQuery = query(
      waitlistRef, 
      where('email', '==', email),
      where('status', '==', 'approved')
    );
    const approvedDocs = await getDocs(emailQuery);
    
    if (!approvedDocs.empty) {
      return true;
    }
    
    // Also check for admin users (fallback)
    const adminRef = collection(db, 'admins');
    const adminQuery = query(adminRef, where('email', '==', email));
    const adminDocs = await getDocs(adminQuery);
    
    return !adminDocs.empty;
  } catch (error) {
    console.error('Error checking user invitation:', error);
    return false;
  }
};

// Approve a waitlist user
export const approveWaitlistUser = async (email: string, db: any): Promise<boolean> => {
  try {
    const waitlistRef = collection(db, 'waitlist');
    const emailQuery = query(waitlistRef, where('email', '==', email));
    const docs = await getDocs(emailQuery);
    
    if (!docs.empty) {
      const docRef = docs.docs[0].ref;
      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error approving user:', error);
    return false;
  }
};

// Get user's waitlist status
export const getUserWaitlistStatus = async (email: string, db: any): Promise<string> => {
  try {
    const waitlistRef = collection(db, 'waitlist');
    const emailQuery = query(waitlistRef, where('email', '==', email));
    const docs = await getDocs(emailQuery);
    
    if (!docs.empty) {
      const userData = docs.docs[0].data();
      return userData.status || 'pending';
    }
    
    return 'not-found';
  } catch (error) {
    console.error('Error getting user status:', error);
    return 'error';
  }
};

