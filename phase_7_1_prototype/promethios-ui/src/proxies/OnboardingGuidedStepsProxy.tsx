import React from 'react';
import OnboardingGuidedSteps from '../../../ui/onboarding/OnboardingGuidedSteps';

/**
 * OnboardingGuidedStepsProxy Component
 * 
 * This proxy component serves as a bridge to the OnboardingGuidedSteps component in the /ui/ directory.
 * It provides interactive content to help users understand Promethios with progress tracking,
 * interactive quizzes, and Observer contextual guidance.
 */
const OnboardingGuidedStepsProxy: React.FC = () => {
  return <OnboardingGuidedSteps />;
};

export default OnboardingGuidedStepsProxy;
