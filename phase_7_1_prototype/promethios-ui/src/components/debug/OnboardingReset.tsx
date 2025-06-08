import React from 'react';
import { auth } from '../../firebase/config';
import { updateOnboardingStatus } from '../../firebase/userService';

const OnboardingReset: React.FC = () => {
  const resetOnboarding = async () => {
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const cacheKey = `onboarding_${userId}`;
      
      // Clear localStorage cache
      localStorage.removeItem(cacheKey);
      
      // Reset Firebase status
      try {
        await updateOnboardingStatus(userId, false);
        console.log('Onboarding status reset successfully');
        
        // Redirect to onboarding
        window.location.href = '/ui/onboarding';
      } catch (error) {
        console.error('Failed to reset onboarding status:', error);
        // Still redirect even if Firebase update fails
        window.location.href = '/ui/onboarding';
      }
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={resetOnboarding}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
        title="Reset onboarding status for testing"
      >
        Reset Onboarding
      </button>
    </div>
  );
};

export default OnboardingReset;

