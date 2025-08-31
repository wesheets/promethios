/**
 * Final script to ensure admin approval status is properly set with all possible fields
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./upload/promethios-firebase-adminsdk-fbsvc-938cab4d43.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://promethios-default-rtdb.firebaseio.com/'
});

const db = admin.firestore();

async function finalAdminFix() {
  console.log('🔧 Final admin approval fix...\n');
  
  try {
    const adminUserId = 'HSf4SIwCcRRzAFPuFXlFE9CsQ6W2';
    const adminEmail = 'wesheets@gmail.com';
    
    console.log(`🔍 Final fix for: ${adminEmail}`);
    
    const userDocRef = db.collection('userProfiles').doc(adminUserId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.log('❌ User profile does not exist!');
      return;
    }
    
    const userData = userDoc.data();
    console.log(`📋 Current data:`, JSON.stringify(userData, null, 2));
    
    // Complete profile update with all necessary fields
    const now = new Date().toISOString();
    
    const completeUpdate = {
      // Core approval fields
      approvalStatus: 'approved',
      
      // Timestamps
      updatedAt: now,
      lastRefresh: now,
      approvedAt: userData.approvedAt || now,
      approvedBy: 'system_final_fix',
      
      // Onboarding fields
      onboardingCompleted: true,
      onboardingCompletedAt: now,
      
      // Email tracking
      approvalEmailSent: true,
      welcomeEmailSent: true,
      rejectionEmailSent: false,
      
      // Ensure core fields exist
      email: adminEmail,
      name: userData.name || 'Wesley Sheets',
      displayName: userData.displayName || 'Wesley Sheets',
      emailVerified: true,
      
      // Admin privileges
      role: 'admin',
      isAdmin: true,
      permissions: ['admin', 'full_access'],
      
      // Profile completion
      profileCompleted: true,
      profileCompletedAt: now
    };
    
    // Merge with existing data to preserve other fields
    await userDocRef.update(completeUpdate);
    
    console.log('✅ Complete profile update applied');
    
    // Verify the final result
    const verifyDoc = await userDocRef.get();
    const verifyData = verifyDoc.data();
    
    console.log('\n📋 Final profile verification:');
    console.log(`   Email: ${verifyData.email}`);
    console.log(`   Approval Status: ${verifyData.approvalStatus}`);
    console.log(`   Onboarding Completed: ${verifyData.onboardingCompleted}`);
    console.log(`   Role: ${verifyData.role}`);
    console.log(`   Is Admin: ${verifyData.isAdmin}`);
    console.log(`   Profile Completed: ${verifyData.profileCompleted}`);
    console.log(`   Updated At: ${verifyData.updatedAt}`);
    
    if (verifyData.approvalStatus === 'approved' && verifyData.onboardingCompleted === true) {
      console.log('\n🎉 SUCCESS: Admin user is now fully approved and onboarded!');
      console.log('🔄 Please refresh your browser to see the changes.');
    } else {
      console.log('\n❌ ERROR: Some fields still not set correctly');
    }
    
  } catch (error) {
    console.error('❌ Error in final admin fix:', error);
  }
}

// Run the final fix
finalAdminFix().then(() => {
  console.log('\n🎉 Final admin fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

