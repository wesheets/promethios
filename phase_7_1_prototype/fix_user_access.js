/**
 * Script to fix user access by setting approvalStatus to 'approved' for existing users
 * This will ungate all authenticated users including admin accounts
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./upload/promethios-firebase-adminsdk-fbsvc-938cab4d43.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://promethios-default-rtdb.firebaseio.com/'
});

const db = admin.firestore();

// List of known authenticated users from Firebase Auth
const authenticatedUsers = [
  {
    email: 'wesheets@gmail.com',
    uid: 'HSf4SIwCcRRzAFPuFXlFE9CsQ6W2', // Admin account
    name: 'Wesley Sheets'
  },
  {
    email: 'therrwesheets@gmail.com',
    uid: '59ZRJqD6wYK7xqYDwfwDC', // From Firebase Auth list
    name: 'Wesley Sheets'
  },
  {
    email: 'ted@crownandtic.com',
    uid: 'H8PQCRwrLNJRzd9zRJkMEA', // From Firebase Auth list
    name: 'Ted'
  },
  {
    email: 'ctheolay@gmail.com',
    uid: 'D6RjdHJvdpUd4PnYlbwJgzU', // From Firebase Auth list
    name: 'Chris Theolay'
  },
  {
    email: 'ted@musiclogicpods.com',
    uid: 'XvjZEZDUPKgJEwRddsLJrB', // From Firebase Auth list
    name: 'Ted'
  }
];

async function fixUserAccess() {
  console.log('🔧 Starting user access fix...');
  
  try {
    // First, let's check what users exist in Firestore
    console.log('📋 Checking existing user profiles in Firestore...');
    const usersSnapshot = await db.collection('userProfiles').get();
    
    console.log(`Found ${usersSnapshot.size} user profiles in Firestore`);
    
    const batch = db.batch();
    let updatedCount = 0;
    
    // Update existing profiles
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const userId = doc.id;
      
      console.log(`📝 Checking user: ${userData.email || 'No email'} (${userId})`);
      
      // Update approval status if not already approved
      if (userData.approvalStatus !== 'approved') {
        console.log(`✅ Setting approval status to 'approved' for ${userData.email || userId}`);
        
        const userRef = db.collection('userProfiles').doc(userId);
        batch.update(userRef, {
          approvalStatus: 'approved',
          updatedAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'system_fix_script'
        });
        updatedCount++;
      } else {
        console.log(`✓ User ${userData.email || userId} already approved`);
      }
    });
    
    // Create profiles for authenticated users that don't have Firestore profiles
    for (const user of authenticatedUsers) {
      const userDoc = await db.collection('userProfiles').doc(user.uid).get();
      
      if (!userDoc.exists) {
        console.log(`🆕 Creating profile for authenticated user: ${user.email}`);
        
        const now = new Date().toISOString();
        const userProfile = {
          id: user.uid,
          email: user.email,
          name: user.name,
          displayName: user.name,
          approvalStatus: 'approved',
          signupSource: 'existing_user',
          createdAt: now,
          updatedAt: now,
          approvedAt: now,
          approvedBy: 'system_fix_script',
          emailVerified: true,
          isPublic: false,
          title: 'Platform User',
          bio: 'Existing authenticated user',
          industry: 'Technology',
          // Email tracking
          approvalEmailSent: false,
          welcomeEmailSent: false,
          rejectionEmailSent: false
        };
        
        const userRef = db.collection('userProfiles').doc(user.uid);
        batch.set(userRef, userProfile);
        updatedCount++;
      } else {
        console.log(`✓ Profile already exists for ${user.email}`);
      }
    }
    
    if (updatedCount > 0) {
      console.log(`💾 Committing ${updatedCount} user updates...`);
      await batch.commit();
      console.log('✅ All user access fixes applied successfully!');
    } else {
      console.log('✓ No updates needed - all users already have proper access');
    }
    
    // Verify the fix
    console.log('🔍 Verifying admin user access...');
    const adminDoc = await db.collection('userProfiles').doc('HSf4SIwCcRRzAFPuFXlFE9CsQ6W2').get();
    
    if (adminDoc.exists) {
      const adminData = adminDoc.data();
      console.log(`✅ Admin user (${adminData.email}) approval status: ${adminData.approvalStatus}`);
    } else {
      console.log('❌ Admin user profile not found!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing user access:', error);
  }
}

// Run the fix
fixUserAccess().then(() => {
  console.log('🎉 User access fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

