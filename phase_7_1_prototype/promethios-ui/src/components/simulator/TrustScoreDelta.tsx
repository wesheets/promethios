import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import MetricExplanationModal from './MetricExplanationModal';

interface TrustScoreDeltaProps {
  ungovernedScore: number;
  governedScore: number;
  showGoverned: boolean;
  onShowMetricExplanation: () => void;
}

/**
 * TrustScoreDelta Component
 * 
 * Displays a comparison between governed and ungoverned trust scores
 * with visual indicators and explanations.
 */
const TrustScoreDelta: React.FC<TrustScoreDeltaProps> = ({
  ungovernedScore,
  governedScore,
  showGoverned,
  onShowMetricExplanation
}) => {
  const { isDarkMode } = useTheme();
  
  // Calculate delta safely to avoid NaN when scores are equal
  const scoreDelta = showGoverned ? governedScore - ungovernedScore : 0;
  const isPositive = scoreDelta > 0;
  const displayDelta = showGoverned ? (isPositive ? `+${scoreDelta}` : scoreDelta.toString()) : "0";
  
  // State for explanation modal
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-red-600 dark:text-red-400';
    if (score < 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };
  
  return (
    <div className={`rounded-lg overflow-hidden shadow-md ${
      isDarkMode ? 'bg-navy-800' : 'bg-white'
    }`}>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3">Trust Score Impact</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ungoverned</p>
            <p className={`text-2xl font-bold ${getScoreColor(ungovernedScore)}`}>{Math.round(ungovernedScore)}</p>
            <p className="text-xs text-gray-500 mt-1">Moderate risk - Use with caution</p>
          </div>
          
          {showGoverned && (
            <>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isPositive ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Governed</p>
                <p className={`text-2xl font-bold ${getScoreColor(governedScore)}`}>{Math.round(governedScore)}</p>
                <p className="text-xs text-gray-500 mt-1">{governedScore > 70 ? 'Low risk - Suitable for most applications' : 'Moderate risk - Use with caution'}</p>
              </div>
            </>
          )}
          
          {!showGoverned && (
            <div>
              <button
                onClick={() => onShowMetricExplanation()}
                className={`px-3 py-1 rounded text-sm ${
                  isDarkMode
                    ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                }`}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Learn More
                </span>
              </button>
            </div>
          )}
        </div>
        
        {showGoverned && (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">Trust Score Delta</p>
                <p className={`text-sm font-bold ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {displayDelta}
                </p>
              </div>
              <div className={`h-3 w-full rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                    isPositive ? 'bg-green-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${Math.min(100, Math.max(0, isPositive ? scoreDelta : 0))}%` }}
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
            
            {!isPositive && scoreDelta < 0 && (
              <div className={`p-3 rounded-md ${
                isDarkMode ? 'bg-red-900/30 border border-red-800/50' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>
                      Trust score declining
                    </p>
                    <p className="text-xs mt-1">
                      The agent's trust score has decreased by {Math.abs(scoreDelta)} points due to detected issues.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {scoreDelta === 0 && (
              <div className={`p-3 rounded-md ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-800'}`}>
                      Starting point
                    </p>
                    <p className="text-xs mt-1">
                      Both agents start at the same trust level. Watch how they diverge as you interact with them.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <button
                onClick={() => onShowMetricExplanation()}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center ${
                  isDarkMode 
                    ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-700/50'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See Why This Score Changed
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrustScoreDelta;
