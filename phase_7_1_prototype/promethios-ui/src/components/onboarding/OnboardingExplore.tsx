import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Onboarding Explore - Step 4: Explore Advanced Features
 * 
 * This component introduces users to advanced features and completes onboarding.
 */
const OnboardingExplore: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Multi-Agent Teams',
      description: 'Create teams of agents that work together on complex tasks',
      icon: '👥',
      route: '/ui/agents',
      color: 'blue'
    },
    {
      title: 'Governance Dashboard',
      description: 'Monitor trust scores, compliance, and governance metrics',
      icon: '📊',
      route: '/ui/dashboard',
      color: 'purple'
    },
    {
      title: 'Live Governance Testing',
      description: 'Test governed vs ungoverned responses in real-time',
      icon: '🔄',
      route: '/ui/governance',
      color: 'green'
    },
    {
      title: 'Production Deployment',
      description: 'Export your governed agents for production use',
      icon: '🚀',
      route: '/ui/deploy',
      color: 'orange'
    }
  ];

  const handleExploreFeature = (route: string) => {
    navigate(route);
  };

  const goToDashboard = () => {
    navigate('/ui/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Success celebration */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Congratulations!
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            You've successfully created your first governed AI agent
          </p>
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-green-200 text-sm">
              🛡️ Your agent is now protected by Promethios governance and ready to use safely
            </p>
          </div>
        </div>

        {/* Feature exploration */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Explore Advanced Features
          </h2>
          <p className="text-gray-300 text-center mb-8">
            Now that you understand the basics, discover what else Promethios can do
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => handleExploreFeature(feature.route)}
                className={`p-6 rounded-lg border-2 border-gray-600 bg-gray-700 hover:border-${feature.color}-400 hover:bg-${feature.color}-900/20 transition-all text-left group`}
              >
                <div className="flex items-start">
                  <div className="text-4xl mr-4">{feature.icon}</div>
                  <div className="flex-1">
                    <h3 className={`text-white font-semibold mb-2 group-hover:text-${feature.color}-400`}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                  <div className={`text-${feature.color}-400 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    →
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Quick start options */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              What would you like to do first?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={goToDashboard}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => handleExploreFeature('/ui/agents')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Manage Agents
              </button>
              <button
                onClick={() => handleExploreFeature('/ui/governance')}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Test Governance
              </button>
            </div>
          </div>
        </div>

        {/* Completion message */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-2">
            🎓 Onboarding Complete • Welcome to Promethios!
          </p>
          <p className="text-gray-500 text-xs">
            You can always return to these features from the main navigation
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingExplore;

