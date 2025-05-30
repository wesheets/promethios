import React, { useState, useEffect } from 'react';
import { useTheme } from "../../context/ThemeContext";

interface ChallengeToggleProps {
  isActive: boolean;
  onChange: (isActive: boolean) => void;
  className?: string;
}

/**
 * ChallengeToggle Component
 * 
 * Toggle switch for enabling "Try to Break It" mode, which presents
 * challenging prompts designed to test governance boundaries.
 */
const ChallengeToggle: React.FC<ChallengeToggleProps> = ({
  isActive,
  onChange,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  const handleToggle = () => {
    onChange(!isActive);
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isActive 
            ? 'bg-red-600' 
            : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={isActive}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`ml-3 text-sm font-medium ${isActive ? 'text-red-500' : 'text-gray-400'}`}>
        {isActive && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        )}
        Try to Break It
      </span>
    </div>
  );
};

export default ChallengeToggle;
