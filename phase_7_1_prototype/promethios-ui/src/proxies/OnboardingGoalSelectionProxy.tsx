import React from 'react';
import OnboardingGoalSelection from '../../../ui/onboarding/OnboardingGoalSelection';

/**
 * OnboardingGoalSelectionProxy Component
 * 
 * This proxy component serves as a bridge to the OnboardingGoalSelection component in the /ui/ directory.
 * It provides the goal selection screen that allows users to personalize their experience.
 */
const OnboardingGoalSelectionProxy: React.FC = () => {
  return <OnboardingGoalSelection />;
};

export default OnboardingGoalSelectionProxy;
