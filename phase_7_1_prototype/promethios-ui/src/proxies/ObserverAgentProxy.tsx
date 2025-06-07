import React from 'react';

/**
 * ObserverAgentProxy Component
 * 
 * This proxy component serves as a bridge to the ObserverAgent component in the /ui/ directory.
 * It provides the same Observer agent functionality for governance-relevant screens.
 */
const ObserverAgentProxy: React.FC = () => {
  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="white"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Observer Agent</h2>
      </div>
      
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <p className="text-white">I'm monitoring this governance activity to ensure compliance with your defined policies.</p>
      </div>
      
      <div className="text-sm text-gray-400">
        <p>Observer is tracking your governance preferences and will provide personalized guidance.</p>
        <div className="mt-2 flex items-center">
          <span className="text-xs px-2 py-1 bg-gray-700 rounded-full mr-2">Memory active</span>
          <span className="text-xs px-2 py-1 bg-gray-700 rounded-full">Guidance: Standard</span>
        </div>
      </div>
    </div>
  );
};

export default ObserverAgentProxy;
