import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface GovernanceBadgeProps {
  isGoverned: boolean;
  trustScore?: number;
  className?: string;
}

/**
 * GovernanceBadge Component
 * 
 * Displays a badge indicating whether an agent is governed by Promethios
 * and shows trust score for governed agents.
 */
const GovernanceBadge: React.FC<GovernanceBadgeProps> = ({ 
  isGoverned, 
  trustScore = 0,
  className = '' 
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${className}`}>
      {isGoverned ? (
        <div className={`flex items-center ${isDarkMode ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-100 text-green-800 border border-green-300'} rounded-full px-3 py-1`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Governed by Promethios</span>
          <span className="mx-1">|</span>
          <span>Trust Score: <span className="font-medium">{trustScore}</span></span>
          <span className="ml-2 text-xs underline cursor-pointer">Belief trace available</span>
        </div>
      ) : (
        <div className={`flex items-center ${isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-100 text-red-800 border border-red-300'} rounded-full px-3 py-1`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Ungoverned</span>
          <span className="mx-1">|</span>
          <span>No trust guarantees</span>
        </div>
      )}
    </div>
  );
};

export default GovernanceBadge;
