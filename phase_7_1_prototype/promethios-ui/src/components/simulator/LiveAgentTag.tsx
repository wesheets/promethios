import React from 'react';
import { useTheme } from "../../context/ThemeContext";

interface LiveAgentTagProps {
  isGoverned: boolean;
  className?: string;
}

/**
 * LiveAgentTag Component
 * 
 * Displays a prominent "Live" tag to indicate that agent responses
 * are unscripted and generated in real-time.
 */
const LiveAgentTag: React.FC<LiveAgentTagProps> = ({
  isGoverned,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className={`flex items-center rounded-full px-2 py-1 ${
        isGoverned
          ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
          : isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
      }`}>
        {/* Pulsing dot animation */}
        <span className="relative flex h-3 w-3 mr-1">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isGoverned ? 'bg-green-500' : 'bg-blue-500'
          }`}></span>
          <span className={`relative inline-flex rounded-full h-3 w-3 ${
            isGoverned ? 'bg-green-500' : 'bg-blue-500'
          }`}></span>
        </span>
        <span className="text-xs font-medium">LIVE</span>
      </div>
      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
        Powered by OpenAI – Responses are unscripted
      </span>
    </div>
  );
};

export default LiveAgentTag;
