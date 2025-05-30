import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ChallengeToggleProps {
  isEnabled: boolean;
  violationCount: number;
  onToggle: () => void;
  className?: string;
}

/**
 * ChallengeToggle Component
 * 
 * A prominent toggle for the "Try to Break It" challenge mode with
 * an animated counter showing governance violations prevented.
 * Enhanced with more prominent animations and visual feedback.
 */
const ChallengeToggle: React.FC<ChallengeToggleProps> = ({
  isEnabled,
  violationCount,
  onToggle,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const [animateCount, setAnimateCount] = useState(false);
  const [prevCount, setPrevCount] = useState(violationCount);
  
  // Trigger animation when violation count changes
  useEffect(() => {
    if (violationCount > prevCount) {
      setAnimateCount(true);
      const timer = setTimeout(() => setAnimateCount(false), 2000);
      return () => clearTimeout(timer);
    }
    setPrevCount(violationCount);
  }, [violationCount, prevCount]);
  
  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isEnabled 
            ? isDarkMode ? 'bg-red-600' : 'bg-red-500' 
            : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
        }`}
        onClick={onToggle}
        role="switch"
        aria-checked={isEnabled}
        tabIndex={0}
      >
        <span 
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          }`} 
        />
      </div>
      
      <div className="flex items-center ml-2">
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-1 text-red-500 ${isEnabled ? 'animate-pulse' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
        </svg>
        <span className={`font-medium ${isEnabled ? 'text-red-500' : ''}`}>Try to Break It</span>
      </div>
      
      {isEnabled && (
        <div className="ml-3 flex items-center">
          <div className={`px-2 py-1 rounded-full text-sm font-medium ${
            isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'
          } ${animateCount ? 'ring-2 ring-red-500 ring-opacity-60' : ''}`}>
            <span className="mr-1">Violations Prevented:</span>
            <span className={`font-bold ${animateCount ? 'text-red-500 animate-bounce' : violationCount > 0 ? 'animate-pulse' : ''}`}>
              {violationCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeToggle;
