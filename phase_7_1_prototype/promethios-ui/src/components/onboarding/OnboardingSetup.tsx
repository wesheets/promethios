import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { updateOnboardingStatus } from '../../firebase/userService';

const OnboardingSetup: React.FC = () => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    role: '',
    useCase: '',
    notifications: 'medium'
  });

  const handleComplete = async () => {
    // Mark onboarding as completed
    if (auth.currentUser) {
      const cacheKey = `onboarding_${auth.currentUser.uid}`;
      localStorage.setItem(cacheKey, 'true');
      await updateOnboardingStatus(auth.currentUser.uid, true).catch(console.error);
    }
    
    // Navigate to dashboard
    navigate('/ui/dashboard', { replace: true });
  };

  const handleSkip = () => {
    navigate('/ui/dashboard');
  };

  const handleBack = () => {
    navigate('/ui/onboarding/demo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Progress Bar */}
      <div className="w-full bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">Quick Setup</span>
            <span className="text-gray-400 text-sm">Final Step</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full w-full" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Let's Set Up Your Governance</h1>
          <p className="text-xl text-gray-300">Tell us about your use case to personalize your experience</p>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 space-y-8">
          {/* Role Selection */}
          <div>
            <label className="block text-white font-semibold mb-4">What's your primary role?</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'developer', title: 'Developer', desc: 'Building AI systems' },
                { id: 'admin', title: 'Governance Admin', desc: 'Managing AI policies' },
                { id: 'user', title: 'Business User', desc: 'Using AI systems' }
              ].map(role => (
                <div
                  key={role.id}
                  onClick={() => setPreferences(prev => ({ ...prev, role: role.id }))}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    preferences.role === role.id
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <h3 className="text-white font-medium">{role.title}</h3>
                  <p className="text-gray-400 text-sm">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Use Case Selection */}
          <div>
            <label className="block text-white font-semibold mb-4">Primary use case?</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'compliance', title: 'Regulatory Compliance', desc: 'Meet legal requirements' },
                { id: 'risk', title: 'Risk Management', desc: 'Prevent AI failures' },
                { id: 'transparency', title: 'Transparency', desc: 'Explainable AI decisions' },
                { id: 'trust', title: 'Trust Building', desc: 'Reliable AI systems' }
              ].map(useCase => (
                <div
                  key={useCase.id}
                  onClick={() => setPreferences(prev => ({ ...prev, useCase: useCase.id }))}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    preferences.useCase === useCase.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <h3 className="text-white font-medium">{useCase.title}</h3>
                  <p className="text-gray-400 text-sm">{useCase.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Preferences */}
          <div>
            <label className="block text-white font-semibold mb-4">How often should the Observer Agent notify you?</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'low', title: 'Minimal', desc: 'Only critical issues' },
                { id: 'medium', title: 'Balanced', desc: 'Important updates' },
                { id: 'high', title: 'Detailed', desc: 'All governance events' }
              ].map(level => (
                <div
                  key={level.id}
                  onClick={() => setPreferences(prev => ({ ...prev, notifications: level.id }))}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    preferences.notifications === level.id
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <h3 className="text-white font-medium">{level.title}</h3>
                  <p className="text-gray-400 text-sm">{level.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-gray-200 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-200 font-medium"
          >
            Skip setup
          </button>

          <button
            onClick={handleComplete}
            disabled={!preferences.role || !preferences.useCase}
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Setup
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSetup;

