import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { updateOnboardingStatus } from '../../firebase/userService';

/**
 * Onboarding First Agent - Step 3: Create Your First Agent
 * 
 * This component guides users through creating their first governed agent
 * in a simple, encouraging way.
 */
const OnboardingFirstAgent: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [agentName, setAgentName] = useState('');
  const [agentPurpose, setAgentPurpose] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const purposes = [
    {
      id: 'assistant',
      title: 'Personal Assistant',
      description: 'Help with daily tasks, scheduling, and organization',
      icon: '🤖'
    },
    {
      id: 'research',
      title: 'Research Helper',
      description: 'Gather information and analyze data',
      icon: '🔍'
    },
    {
      id: 'writing',
      title: 'Writing Assistant',
      description: 'Help with writing, editing, and content creation',
      icon: '✍️'
    },
    {
      id: 'coding',
      title: 'Code Reviewer',
      description: 'Review code for bugs and improvements',
      icon: '💻'
    }
  ];

  const handleCreateAgent = async () => {
    setIsCreating(true);
    
    // Simulate agent creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mark onboarding as completed
    if (auth.currentUser) {
      const cacheKey = `onboarding_${auth.currentUser.uid}`;
      localStorage.setItem(cacheKey, 'true');
      await updateOnboardingStatus(auth.currentUser.uid, true);
    }
    
    setIsCreating(false);
    navigate('/ui/onboarding/explore');
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleCreateAgent();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  stepNum === step 
                    ? 'bg-green-400 w-8' 
                    : stepNum < step 
                      ? 'bg-green-600' 
                      : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main content card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          {step === 1 && (
            <div className="text-center">
              <div className="text-6xl mb-6">🎯</div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Create Your First Agent
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Let's start simple. What would you like your AI agent to help you with?
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {purposes.map((purpose) => (
                  <button
                    key={purpose.id}
                    onClick={() => setAgentPurpose(purpose.id)}
                    className={`p-6 rounded-lg border-2 transition-all text-left ${
                      agentPurpose === purpose.id
                        ? 'border-green-400 bg-green-900/30'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-3xl mb-2">{purpose.icon}</div>
                    <h3 className="text-white font-medium mb-1">{purpose.title}</h3>
                    <p className="text-gray-400 text-sm">{purpose.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="text-6xl mb-6">📝</div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Give Your Agent a Name
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Choose a friendly name that reflects your agent's purpose
              </p>
              
              <div className="mb-8">
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g., Alex, Research Bot, Writing Helper..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                />
              </div>

              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <p className="text-green-200 text-sm">
                  💡 <strong>Tip:</strong> A good name helps you remember what your agent does and makes interactions feel more natural.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="text-6xl mb-6">🛡️</div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Governance Protection
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Your agent will be automatically protected with Promethios governance
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="bg-gray-700 rounded-lg p-4 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-3"></div>
                  <span className="text-gray-200">Constitutional framework active</span>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-3"></div>
                  <span className="text-gray-200">Trust scoring enabled</span>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-3"></div>
                  <span className="text-gray-200">Observer monitoring active</span>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-3"></div>
                  <span className="text-gray-200">Audit trail recording</span>
                </div>
              </div>

              {isCreating && (
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-2"></div>
                  <p className="text-gray-300">Creating your governed agent...</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                step === 1
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Previous
            </button>

            <button
              onClick={nextStep}
              disabled={(step === 1 && !agentPurpose) || (step === 2 && !agentName) || isCreating}
              className={`px-8 py-3 font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${
                (step === 1 && !agentPurpose) || (step === 2 && !agentName) || isCreating
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white'
              }`}
            >
              {step === 3 ? (isCreating ? 'Creating...' : 'Create Agent') : 'Continue'}
            </button>
          </div>
        </div>

        {/* Bottom info */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Step 3 of 4 • Create Your First Agent
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFirstAgent;

