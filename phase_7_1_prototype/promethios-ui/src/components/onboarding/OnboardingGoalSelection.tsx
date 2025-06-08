import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
  selectedWorkflow?: string;
}

const OnboardingGoalSelection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const [selectedGoal, setSelectedGoal] = useState<string>('');

  const goals = [
    {
      id: 'compliance',
      title: 'Ensure Compliance',
      description: 'Meet regulatory requirements and industry standards for AI governance',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      id: 'risk-management',
      title: 'Manage AI Risks',
      description: 'Identify, assess, and mitigate potential risks in AI systems',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: 'red'
    },
    {
      id: 'transparency',
      title: 'Improve Transparency',
      description: 'Make AI decision-making processes more explainable and accountable',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'green'
    },
    {
      id: 'performance',
      title: 'Optimize Performance',
      description: 'Enhance AI system performance while maintaining ethical standards',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'purple'
    }
  ];

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
  };

  const handleContinue = () => {
    if (selectedGoal) {
      navigate('/ui/onboarding/guided-steps', { 
        state: { 
          selectedWorkflow: state?.selectedWorkflow,
          selectedGoal: selectedGoal 
        },
        replace: true 
      });
    }
  };

  const handleBack = () => {
    navigate('/ui/onboarding', { replace: true });
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseClasses = "border-2 rounded-lg p-6 transition-all cursor-pointer bg-gray-700";
    
    if (isSelected) {
      switch (color) {
        case 'blue': return `${baseClasses} border-blue-400 bg-blue-900/30`;
        case 'red': return `${baseClasses} border-red-400 bg-red-900/30`;
        case 'green': return `${baseClasses} border-green-400 bg-green-900/30`;
        case 'purple': return `${baseClasses} border-purple-400 bg-purple-900/30`;
        default: return `${baseClasses} border-gray-400 bg-gray-600`;
      }
    } else {
      return `${baseClasses} border-gray-600 hover:border-gray-500 hover:shadow-md`;
    }
  };

  const getIconColorClasses = (color: string, isSelected: boolean) => {
    if (isSelected) {
      switch (color) {
        case 'blue': return 'text-blue-400 bg-blue-900';
        case 'red': return 'text-red-400 bg-red-900';
        case 'green': return 'text-green-400 bg-green-900';
        case 'purple': return 'text-purple-400 bg-purple-900';
        default: return 'text-gray-400 bg-gray-700';
      }
    } else {
      return 'text-gray-400 bg-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            What's your primary goal?
          </h1>
          <p className="text-lg text-gray-300">
            Help us personalize your Promethios experience
          </p>
          {state?.selectedWorkflow && (
            <div className="mt-2 text-sm text-blue-400">
              Selected workflow: {state.selectedWorkflow.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          )}
        </div>

        {/* Goal Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {goals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => handleGoalSelect(goal.id)}
              className={getColorClasses(goal.color, selectedGoal === goal.id)}
            >
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${getIconColorClasses(goal.color, selectedGoal === goal.id)}`}>
                  {goal.icon}
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {goal.title}
                </h3>
              </div>
              <p className="text-gray-300">
                {goal.description}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-200 font-medium"
          >
            ← Back
          </button>
          <div className="text-sm text-gray-500">
            Step 2 of 3
          </div>
          <button
            onClick={handleContinue}
            disabled={!selectedGoal}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedGoal
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGoalSelection;

