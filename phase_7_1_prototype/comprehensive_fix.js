/**
 * Comprehensive fix for approval status issues
 * This will ensure the approval status is properly set and readable
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./upload/promethios-firebase-adminsdk-fbsvc-938cab4d43.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://promethios-default-rtdb.firebaseio.com/'
});

const db = admin.firestore();

async function comprehensiveFix() {
  console.log('🔧 Comprehensive approval status fix...\n');
  
  try {
    const adminUserId = 'HSf4SIwCcRRzAFPuFXlFE9CsQ6W2';
    const adminEmail = 'wesheets@gmail.com';
    
    console.log(`🔍 Comprehensive fix for: ${adminEmail}`);
    
    const userDocRef = db.collection('userProfiles').doc(adminUserId);
    
    // First, delete the document completely and recreate it
    console.log('🗑️ Deleting existing profile to clear any corruption...');
    await userDocRef.delete();
    
    console.log('✅ Profile deleted, creating fresh profile...');
    
    // Create a completely fresh profile with all necessary fields
    const now = new Date().toISOString();
    
    const freshProfile = {
      // Core identity
      id: adminUserId,
      email: adminEmail,
      name: 'Wesley Sheets',
      displayName: 'Wesley Sheets',
      
      // Approval status - using string literal to ensure it's set correctly
      approvalStatus: 'approved',
      
      // Timestamps
      createdAt: now,
      updatedAt: now,
      approvedAt: now,
      approvedBy: 'system_comprehensive_fix',
      
      // Onboarding
      onboardingCompleted: true,
      onboardingCompletedAt: now,
      
      // Profile completion
      profileCompleted: true,
      profileCompletedAt: now,
      
      // Admin privileges
      role: 'admin',
      isAdmin: true,
      permissions: ['admin', 'full_access'],
      
      // Email verification
      emailVerified: true,
      
      // Email tracking
      approvalEmailSent: true,
      welcomeEmailSent: true,
      rejectionEmailSent: false,
      
      // Profile details
      title: 'Platform Administrator',
      bio: 'Platform administrator with full access',
      industry: 'Technology',
      isPublic: false,
      
      // Source tracking
      signupSource: 'comprehensive_fix',
      
      // Cache busting
      lastRefresh: now,
      cacheVersion: Date.now().toString()
    };
    
    // Set the fresh profile
    await userDocRef.set(freshProfile);
    
    console.log('✅ Fresh profile created');
    
    // Verify the profile was created correctly
    const verifyDoc = await userDocRef.get();
    const verifyData = verifyDoc.data();
    
    console.log('\n📋 Fresh profile verification:');
    console.log(`   Document exists: ${verifyDoc.exists}`);
    console.log(`   Email: ${verifyData.email}`);
    console.log(`   Approval Status: "${verifyData.approvalStatus}" (type: ${typeof verifyData.approvalStatus})`);
    console.log(`   Onboarding Completed: ${verifyData.onboardingCompleted}`);
    console.log(`   Profile Completed: ${verifyData.profileCompleted}`);
    console.log(`   Role: ${verifyData.role}`);
    console.log(`   Is Admin: ${verifyData.isAdmin}`);
    console.log(`   Cache Version: ${verifyData.cacheVersion}`);
    
    // Also create a backup in the users collection for compatibility
    console.log('\n🔄 Creating backup profile in users collection...');
    const usersDocRef = db.collection('users').doc(adminUserId);
    await usersDocRef.set(freshProfile);
    console.log('✅ Backup profile created in users collection');
    
    if (verifyData.approvalStatus === 'approved' && verifyData.onboardingCompleted === true) {
      console.log('\n🎉 SUCCESS: Fresh profile created with all correct fields!');
      console.log('\n🔄 NEXT STEPS:');
      console.log('1. Clear ALL browser data (not just cache)');
      console.log('2. Close browser completely');
      console.log('3. Reopen browser and try again');
      console.log('4. Or try this direct URL with cache buster:');
      console.log(`   ${process.env.FRONTEND_URL || 'your-app-url'}?v=${Date.now()}&clearCache=true`);
    } else {
      console.log('\n❌ ERROR: Profile still not set correctly');
    }
    
  } catch (error) {
    console.error('❌ Error in comprehensive fix:', error);
  }
}

// Run the comprehensive fix
comprehensiveFix().then(() => {
  console.log('\n🎉 Comprehensive fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

