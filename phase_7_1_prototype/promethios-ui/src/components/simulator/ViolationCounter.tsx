import React from 'react';
import { useTheme } from "../../context/ThemeContext";

interface ViolationCounterProps {
  violations: number;
  prevented: number;
  className?: string;
}

/**
 * ViolationCounter Component
 * 
 * Displays a clean, minimal counter showing violations detected and prevented,
 * quantifying the value of governance in a simple metric.
 */
const ViolationCounter: React.FC<ViolationCounterProps> = ({
  violations,
  prevented,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className={`flex flex-col items-center p-3 rounded-lg ${
        isDarkMode ? 'bg-red-900/30 border border-red-800/50' : 'bg-red-50 border border-red-200'
      }`}>
        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Violations Detected</span>
        <span className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{violations}</span>
      </div>
      
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </div>
      
      <div className={`flex flex-col items-center p-3 rounded-lg ${
        isDarkMode ? 'bg-green-900/30 border border-green-800/50' : 'bg-green-50 border border-green-200'
      }`}>
        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Violations Prevented</span>
        <span className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{prevented}</span>
      </div>
    </div>
  );
};

export default ViolationCounter;
