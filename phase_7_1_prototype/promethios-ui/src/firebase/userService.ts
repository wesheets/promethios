import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Store onboarding completion status in user profile
export const updateOnboardingStatus = async (userId: string, completed: boolean, db: any) => {
  try {
    console.log(`userService: Attempting to update onboarding status for user: ${userId}`);
    const userRef = doc(db, 'userProfiles', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log(`userService: User document for ${userId} exists. Updating...`);
      // Update existing user document
      await updateDoc(userRef, {
        onboardingCompleted: completed,
        updatedAt: new Date().toISOString()
      });
      console.log(`userService: Onboarding status updated for user: ${userId}`);
    } else {
      console.log(`userService: User document for ${userId} does not exist. Creating...`);
      // Create new user document
      await setDoc(userRef, {
        onboardingCompleted: completed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`userService: User document created for user: ${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error('userService: Error updating onboarding status:', error);
    throw error;
  }
};

// Store agent configuration from onboarding
export const saveAgentConfiguration = async (userId: string, agentConfig: { name: string; type: string; description?: string; governanceLevel: string; }, db: any) => {
  try {
    console.log(`userService: Attempting to save agent configuration for user: ${userId}`);
    const userRef = doc(db, 'userProfiles', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log(`userService: User document for ${userId} exists. Updating agent config...`);
      // Update existing user document
      await updateDoc(userRef, {
        agentConfig,
        updatedAt: new Date().toISOString()
      });
      console.log(`userService: Agent configuration updated for user: ${userId}`);
    } else {
      console.log(`userService: User document for ${userId} does not exist. Creating with agent config...`);
      // Create new user document
      await setDoc(userRef, {
        agentConfig,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`userService: User document created with agent config for user: ${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error('userService: Error saving agent configuration:', error);
    throw error;
  }
};

// Check if user has completed onboarding - SIMPLIFIED VERSION
export const checkUserOnboardingStatus = async (userId: string): Promise<boolean> => {
  console.log('userService: AUTO-APPROVING all authenticated users - no checks needed');
  return true;
};

