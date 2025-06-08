import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

// Store onboarding completion status in user profile
export const updateOnboardingStatus = async (userId: string, completed: boolean) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user document
      await updateDoc(userRef, {
        onboardingCompleted: completed,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new user document
      await setDoc(userRef, {
        onboardingCompleted: completed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    throw error;
  }
};

// Store agent configuration from onboarding
export const saveAgentConfiguration = async (
  userId: string, 
  agentConfig: {
    name: string;
    type: string;
    description?: string;
    governanceLevel: string;
  }
) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user document
      await updateDoc(userRef, {
        agentConfig,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new user document
      await setDoc(userRef, {
        agentConfig,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error saving agent configuration:', error);
    throw error;
  }
};

// Check if user has completed onboarding
export const checkOnboardingStatus = async (userId: string) => {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Onboarding check timeout')), 5000)
    );
    
    const checkPromise = (async () => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.onboardingCompleted === true;
      }
      
      return false;
    })();
    
    return await Promise.race([checkPromise, timeoutPromise]) as boolean;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // Return false on error to allow user to proceed to onboarding
    return false;
  }
};
