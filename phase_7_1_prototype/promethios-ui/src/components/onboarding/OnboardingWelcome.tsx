import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { updateOnboardingStatus } from '../../firebase/userService';

const OnboardingWelcome: React.FC = () => {
  const navigate = useNavigate();

  const handleWorkflowSelect = (workflow: string) => {
    // Navigate to workflow-specific page with the selected workflow
    navigate(`/ui/onboarding/workflow/${workflow}`, { 
      state: { selectedWorkflow: workflow },
      replace: true 
    });
  };

  const handleSkip = () => {
    // Mark onboarding as completed when skipping
    if (auth.currentUser) {
      const cacheKey = `onboarding_${auth.currentUser.uid}`;
      localStorage.setItem(cacheKey, 'true');
      updateOnboardingStatus(auth.currentUser.uid, true).catch(console.error);
    }
    
    // Force navigation to agent wizard
    window.location.href = '/ui/agent-wizard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Promethios
          </h1>
          <p className="text-lg text-gray-300">
            Choose your AI governance workflow to get started
          </p>
        </div>

        {/* Workflow Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quick Start Workflow */}
          <div 
            onClick={() => handleWorkflowSelect('quick-start')}
            className="border-2 border-gray-600 rounded-lg p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group bg-gray-700"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white group-hover:text-blue-400">
                Quick Start
              </h3>
            </div>
            <p className="text-gray-300">
              Get up and running quickly with pre-configured governance settings for common use cases.
            </p>
          </div>

          {/* Custom Setup Workflow */}
          <div 
            onClick={() => handleWorkflowSelect('custom-setup')}
            className="border-2 border-gray-600 rounded-lg p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group bg-gray-700"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white group-hover:text-blue-400">
                Custom Setup
              </h3>
            </div>
            <p className="text-gray-300">
              Configure detailed <span className="text-blue-400 underline cursor-help relative group/tooltip">governance settings<span className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg border border-gray-600 whitespace-nowrap z-10">Rules and policies that ensure AI systems operate safely and ethically</span></span> tailored to your specific requirements and use cases.
            </p>
          </div>

          {/* Enterprise Workflow */}
          <div 
            onClick={() => handleWorkflowSelect('enterprise')}
            className="border-2 border-gray-600 rounded-lg p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group bg-gray-700"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white group-hover:text-blue-400">
                Enterprise
              </h3>
            </div>
            <p className="text-gray-300">
              Advanced governance features for large organizations with complex <span className="text-blue-400 underline cursor-help relative group/tooltip">compliance requirements<span className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg border border-gray-600 whitespace-nowrap z-10">Legal and regulatory standards that organizations must meet</span></span>.
            </p>
          </div>

          {/* Learning Mode Workflow */}
          <div 
            onClick={() => handleWorkflowSelect('learning-mode')}
            className="border-2 border-gray-600 rounded-lg p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group bg-gray-700"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white group-hover:text-blue-400">
                Learning Mode
              </h3>
            </div>
            <p className="text-gray-300">
              Interactive tutorials and guided learning to understand <span className="text-blue-400 underline cursor-help relative group/tooltip">AI governance<span className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg border border-gray-600 whitespace-nowrap z-10">Framework for ensuring AI systems are developed and deployed responsibly</span></span> concepts and best practices.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-200 font-medium"
          >
            Skip for now
          </button>
          <div className="text-sm text-gray-500">
            Step 1 of 3
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome;

