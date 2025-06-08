import React from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingWelcome: React.FC = () => {
  const navigate = useNavigate();

  const handleWorkflowSelect = (workflow: string) => {
    // Navigate to goal selection with the selected workflow
    navigate('/ui/onboarding/goal-selection', { 
      state: { selectedWorkflow: workflow },
      replace: true 
    });
  };

  const handleSkip = () => {
    // Skip to agent wizard
    navigate('/ui/agent-wizard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Promethios
          </h1>
          <p className="text-lg text-gray-600">
            Choose your AI governance workflow to get started
          </p>
        </div>

        {/* Workflow Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quick Start Workflow */}
          <div 
            onClick={() => handleWorkflowSelect('quick-start')}
            className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                Quick Start
              </h3>
            </div>
            <p className="text-gray-600">
              Get up and running quickly with pre-configured governance settings for common use cases.
            </p>
          </div>

          {/* Custom Setup Workflow */}
          <div 
            onClick={() => handleWorkflowSelect('custom-setup')}
            className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                Custom Setup
              </h3>
            </div>
            <p className="text-gray-600">
              Configure detailed governance settings tailored to your specific requirements and use cases.
            </p>
          </div>

          {/* Enterprise Workflow */}
          <div 
            onClick={() => handleWorkflowSelect('enterprise')}
            className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                Enterprise
              </h3>
            </div>
            <p className="text-gray-600">
              Advanced governance features for large organizations with complex compliance requirements.
            </p>
          </div>

          {/* Learning Mode Workflow */}
          <div 
            onClick={() => handleWorkflowSelect('learning-mode')}
            className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                Learning Mode
              </h3>
            </div>
            <p className="text-gray-600">
              Interactive tutorials and guided learning to understand AI governance concepts and best practices.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Skip for now
          </button>
          <div className="text-sm text-gray-400">
            Step 1 of 3
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome;

