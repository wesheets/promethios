import React from 'react';

/**
 * OnboardingWelcomeProxy Component
 * 
 * This proxy component serves as a bridge to the OnboardingWelcome component.
 * It provides the LangSmith-style "How would you like to start?" interface with workflow options.
 */
const OnboardingWelcomeProxy: React.FC = () => {
  // Placeholder implementation until proper integration
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Welcome to Promethios</h1>
      <h2 className="text-xl mb-4 text-center">How would you like to start?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all">
          <h3 className="font-semibold text-lg mb-2">Create a Governed Agent</h3>
          <p className="text-gray-600 dark:text-gray-300">Build an AI assistant with built-in governance and safety controls.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all">
          <h3 className="font-semibold text-lg mb-2">Wrap an Existing Agent</h3>
          <p className="text-gray-600 dark:text-gray-300">Add governance to your existing AI systems and models.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all">
          <h3 className="font-semibold text-lg mb-2">Explore Governance Options</h3>
          <p className="text-gray-600 dark:text-gray-300">Learn about different governance levels and their benefits.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all">
          <h3 className="font-semibold text-lg mb-2">View Demos</h3>
          <p className="text-gray-600 dark:text-gray-300">See examples of governed AI in action across different use cases.</p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button className="text-blue-500 hover:text-blue-700 font-medium">
          Skip onboarding and go to dashboard →
        </button>
      </div>
    </div>
  );
};

export default OnboardingWelcomeProxy;
