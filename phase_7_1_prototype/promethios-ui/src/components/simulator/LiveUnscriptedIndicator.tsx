import React from 'react';
import { useTheme } from "../../context/ThemeContext";

interface LiveUnscriptedIndicatorProps {
  className?: string;
}

/**
 * LiveUnscriptedIndicator Component
 * 
 * A prominent indicator that clearly communicates that agent responses
 * are live and unscripted, not pre-written demonstrations.
 * Enhanced with more prominent animations and visual emphasis.
 */
const LiveUnscriptedIndicator: React.FC<LiveUnscriptedIndicatorProps> = ({
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`rounded-lg overflow-hidden ${className} ${
      isDarkMode ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
    }`}>
      <div className="p-4">
        <div className="flex items-center mb-3">
          {/* Enhanced pulsing live indicator */}
          <div className="relative flex h-4 w-4 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-blue-500"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
          </div>
          <h3 className="text-xl font-bold text-blue-500">LIVE & UNSCRIPTED</h3>
        </div>
        
        <div className="mb-4">
          <p className="text-sm mb-2">
            <strong className="text-blue-500">What you're about to see hasn't been pre-written.</strong> These are live, unscripted responses from OpenAI.
          </p>
          <p className="text-sm">
            We didn't know what would happen either. This is a real-time demonstration of AI governance in action.
          </p>
        </div>
        
        <div className={`flex items-center p-3 rounded ${
          isDarkMode ? 'bg-blue-800/30 border border-blue-700/50' : 'bg-blue-100 border border-blue-200/50'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium">
              <strong>Powered by OpenAI</strong> - Both agents use identical models and settings.
            </p>
            <p className="text-xs mt-1">
              The only difference is Promethios governance. Watch how it transforms AI behavior in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveUnscriptedIndicator;
