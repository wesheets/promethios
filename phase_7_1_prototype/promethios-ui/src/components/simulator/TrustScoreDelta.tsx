import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface TrustScoreDeltaProps {
  initialScore: number;
  currentScore: number;
  className?: string;
}

/**
 * TrustScoreDelta Component
 * 
 * Displays a dramatic visualization of trust score improvements
 * with animations and visual indicators of positive change.
 */
const TrustScoreDelta: React.FC<TrustScoreDeltaProps> = ({
  initialScore,
  currentScore,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const scoreDelta = currentScore - initialScore;
  const isPositive = scoreDelta > 0;
  
  return (
    <div className={`rounded-lg overflow-hidden ${className} ${
      isDarkMode ? 'bg-navy-800/50' : 'bg-white'
    }`}>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3">Trust Score Impact</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Initial Score</p>
            <p className="text-2xl font-bold">{initialScore}</p>
          </div>
          
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Score</p>
            <p className={`text-2xl font-bold ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>{currentScore}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Trust Score Delta</p>
            <p className={`text-sm font-bold ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? '+' : ''}{scoreDelta}
            </p>
          </div>
          <div className={`h-2 w-full rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                isPositive ? 'bg-green-500' : 'bg-red-500'
              }`} 
              style={{ width: `${currentScore}%` }}
            ></div>
          </div>
        </div>
        
        {isPositive && (
          <div className={`p-3 rounded-md ${
            isDarkMode ? 'bg-green-900/30 border border-green-800/50' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>
                  Governance is working!
                </p>
                <p className="text-xs mt-1">
                  Promethios governance has improved trust by {scoreDelta} points through active monitoring and constitutional enforcement.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustScoreDelta;
