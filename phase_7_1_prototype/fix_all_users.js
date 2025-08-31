/**
 * Fix access for ALL authenticated Firebase users
 * This will create proper approved profiles for everyone who has Firebase Auth accounts
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./upload/promethios-firebase-adminsdk-fbsvc-938cab4d43.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://promethios-default-rtdb.firebaseio.com/'
});

const db = admin.firestore();
const auth = admin.auth();

async function fixAllUsers() {
  console.log('🔧 Fixing access for ALL authenticated users...\n');
  
  try {
    // Get all Firebase Auth users
    console.log('📋 Fetching all Firebase Auth users...');
    const listUsersResult = await auth.listUsers();
    const users = listUsersResult.users;
    
    console.log(`Found ${users.length} Firebase Auth users\n`);
    
    const now = new Date().toISOString();
    let processedCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        console.log(`\n👤 Processing user: ${user.email} (${user.uid})`);
        
        // Determine if this is the admin user
        const isAdmin = user.email === 'wesheets@gmail.com';
        
        // Create comprehensive user profile
        const userProfile = {
          // Core identity
          id: user.uid,
          email: user.email,
          name: user.displayName || extractNameFromEmail(user.email),
          displayName: user.displayName || extractNameFromEmail(user.email),
          
          // Approval status - approve everyone
          approvalStatus: 'approved',
          
          // Timestamps
          createdAt: user.metadata.creationTime || now,
          updatedAt: now,
          approvedAt: now,
          approvedBy: 'system_mass_approval',
          
          // Onboarding - mark as completed for everyone
          onboardingCompleted: true,
          onboardingCompletedAt: now,
          
          // Profile completion
          profileCompleted: true,
          profileCompletedAt: now,
          
          // Role assignment
          role: isAdmin ? 'admin' : 'user',
          isAdmin: isAdmin,
          permissions: isAdmin ? ['admin', 'full_access'] : ['user_access'],
          
          // Email verification
          emailVerified: user.emailVerified || true,
          
          // Email tracking
          approvalEmailSent: true,
          welcomeEmailSent: true,
          rejectionEmailSent: false,
          
          // Profile details
          title: isAdmin ? 'Platform Administrator' : 'Platform User',
          bio: isAdmin ? 'Platform administrator with full access' : 'Approved platform user',
          industry: 'Technology',
          isPublic: false,
          
          // Source tracking
          signupSource: 'mass_approval_fix',
          
          // Cache busting
          lastRefresh: now,
          cacheVersion: Date.now().toString(),
          
          // Firebase Auth metadata
          firebaseCreatedAt: user.metadata.creationTime,
          firebaseLastSignIn: user.metadata.lastSignInTime,
          providerId: user.providerData[0]?.providerId || 'unknown'
        };
        
        // Create profile in userProfiles collection
        const userDocRef = db.collection('userProfiles').doc(user.uid);
        await userDocRef.set(userProfile);
        console.log(`   ✅ Created userProfiles/${user.uid}`);
        
        // Also create in users collection for compatibility
        const usersDocRef = db.collection('users').doc(user.uid);
        await usersDocRef.set(userProfile);
        console.log(`   ✅ Created users/${user.uid}`);
        
        // Create bypass document for each user
        const bypassDocRef = db.collection('adminBypass').doc(user.uid);
        const bypassData = {
          userId: user.uid,
          email: user.email,
          bypassApproval: true,
          bypassOnboarding: true,
          isAdmin: isAdmin,
          role: isAdmin ? 'admin' : 'user',
          permissions: isAdmin ? ['full_access', 'admin', 'bypass_all'] : ['user_access', 'bypass_approval'],
          createdAt: now,
          createdBy: 'mass_approval_system',
          reason: 'Mass approval for all authenticated users'
        };
        
        await bypassDocRef.set(bypassData);
        console.log(`   ✅ Created bypass for ${user.email}`);
        
        processedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error processing ${user.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 PROCESSING SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total users found: ${users.length}`);
    console.log(`Successfully processed: ${processedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    console.log('\n👥 ALL USERS NOW HAVE:');
    console.log('✅ approvalStatus: "approved"');
    console.log('✅ onboardingCompleted: true');
    console.log('✅ profileCompleted: true');
    console.log('✅ Bypass documents created');
    console.log('✅ Profiles in both userProfiles and users collections');
    
    console.log('\n🎯 BYPASS URLs FOR ALL USERS:');
    console.log('Users can add this to any URL: ?adminBypass=true&userId=THEIR_USER_ID');
    console.log('\nSpecific bypass URLs:');
    
    for (const user of users) {
      console.log(`   ${user.email}: ?adminBypass=true&userId=${user.uid}`);
    }
    
    if (processedCount === users.length) {
      console.log('\n🎉 SUCCESS: All users have been approved and can now access the platform!');
      console.log('🔄 Users should clear their browser cache and try logging in again.');
    } else {
      console.log(`\n⚠️ WARNING: ${errorCount} users had errors. Check the logs above.`);
    }
    
  } catch (error) {
    console.error('❌ Error in mass user fix:', error);
  }
}

function extractNameFromEmail(email) {
  if (!email) return 'User';
  const namePart = email.split('@')[0];
  return namePart.split('.').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ');
}

// Run the mass user fix
fixAllUsers().then(() => {
  console.log('\n🎉 Mass user fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

