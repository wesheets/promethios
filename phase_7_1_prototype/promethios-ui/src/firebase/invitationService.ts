import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';

// Check if user has been approved for access or is an existing user
export const checkUserInvitation = async (email: string, db: any): Promise<{ hasAccess: boolean; isExistingUser: boolean; reason?: string }> => {
  try {
    // First, check if this is an existing user by looking for any previous activity
    const isExisting = await checkIfExistingUser(email, db);
    
    if (isExisting) {
      // Existing users get automatic access
      console.log(`Allowing access for existing user: ${email}`);
      return { hasAccess: true, isExistingUser: true };
    }
    
    // For new users, check waitlist approval status
    const waitlistRef = collection(db, 'waitlist');
    const emailQuery = query(
      waitlistRef, 
      where('email', '==', email),
      where('status', '==', 'approved')
    );
    const approvedDocs = await getDocs(emailQuery);
    
    if (!approvedDocs.empty) {
      console.log(`Allowing access for approved new user: ${email}`);
      return { hasAccess: true, isExistingUser: false };
    }
    
    // Check if user is in waitlist but not approved
    const pendingQuery = query(waitlistRef, where('email', '==', email));
    const pendingDocs = await getDocs(pendingQuery);
    
    if (!pendingDocs.empty) {
      return { 
        hasAccess: false, 
        isExistingUser: false, 
        reason: 'Your application is pending approval. You will be notified when approved.' 
      };
    }
    
    // Also check for admin users (fallback)
    const adminRef = collection(db, 'admins');
    const adminQuery = query(adminRef, where('email', '==', email));
    const adminDocs = await getDocs(adminQuery);
    
    if (!adminDocs.empty) {
      console.log(`Allowing access for admin user: ${email}`);
      return { hasAccess: true, isExistingUser: true };
    }
    
    return { 
      hasAccess: false, 
      isExistingUser: false, 
      reason: 'No invitation found. Please request access through the waitlist.' 
    };
    
  } catch (error) {
    console.error('Error checking user invitation:', error);
    // In case of error, allow access to prevent blocking existing users
    console.log(`Allowing access due to error for: ${email}`);
    return { hasAccess: true, isExistingUser: true, reason: 'Unable to verify invitation status' };
  }
};

// Check if user is an existing user by looking for previous activity
const checkIfExistingUser = async (email: string, db: any): Promise<boolean> => {
  try {
    // Check multiple collections for existing user activity
    const collections = [
      'userProfiles',
      'trustBoundaries', 
      'agentConfigurations',
      'userSettings',
      'users' // Common user collection name
    ];
    
    for (const collectionName of collections) {
      try {
        // Try different field names that might contain the user email
        const fieldNames = ['userEmail', 'email', 'createdBy', 'owner'];
        
        for (const fieldName of fieldNames) {
          const q = query(
            collection(db, collectionName),
            where(fieldName, '==', email)
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            console.log(`Found existing user activity in ${collectionName}.${fieldName}`);
            return true;
          }
        }
      } catch (collectionError) {
        // Collection might not exist or have different structure, continue checking
        console.log(`Could not check ${collectionName}:`, collectionError);
        continue;
      }
    }
    
    // Also check for any documents where the user might be referenced by email as document ID
    try {
      const userProfileRef = doc(db, 'userProfiles', email);
      const userProfileSnap = await getDoc(userProfileRef);
      
      if (userProfileSnap.exists()) {
        console.log('Found existing user profile by document ID');
        return true;
      }
    } catch (error) {
      console.log('Could not check user profile by ID:', error);
    }
    
    // Check for users collection with email as document ID
    try {
      const userRef = doc(db, 'users', email);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        console.log('Found existing user in users collection');
        return true;
      }
    } catch (error) {
      console.log('Could not check users collection:', error);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if existing user:', error);
    // In case of error, assume existing user to prevent blocking
    return true;
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

// Mark user as existing (for migration purposes)
export const markAsExistingUser = async (email: string, db: any): Promise<void> => {
  try {
    const userRef = doc(db, 'users', email);
    await setDoc(userRef, {
      email,
      isExistingUser: true,
      migratedAt: new Date().toISOString(),
      status: 'active'
    }, { merge: true });
    console.log(`Marked ${email} as existing user`);
  } catch (error) {
    console.error('Error marking as existing user:', error);
    throw error;
  }
};

