import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import MetricExplanationModal from './MetricExplanationModal';

interface TrustScoreDeltaProps {
  initialScore: number;
  currentScore: number;
  className?: string;
  latestPrompt?: string;
  traceId?: string;
  violationType?: any;
  isGoverned?: boolean; // New prop to differentiate between governed and ungoverned agents
}

/**
 * TrustScoreDelta Component
 * 
 * Displays a dramatic visualization of trust score improvements
 * with animations and visual indicators of positive change.
 * Enhanced with more dramatic before/after effects and educational explanations.
 * Now includes expandable detailed explanations of metric changes.
 * Differentiates between governed and ungoverned agents.
 */
const TrustScoreDelta: React.FC<TrustScoreDeltaProps> = ({
  initialScore,
  currentScore,
  className = '',
  latestPrompt = '',
  traceId = `trace-${Date.now()}`,
  violationType,
  isGoverned = false // Default to ungoverned
}) => {
  const { isDarkMode } = useTheme();
  const scoreDelta = currentScore - initialScore;
  const isPositive = scoreDelta > 0;
  
  // State for explanation modal
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  
  // Calculate percentage for visual representation
  const percentage = Math.min(100, Math.max(0, currentScore));
  
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-red-600 dark:text-red-400';
    if (score < 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };
  
  // Get explanation based on score and governance status
  const getScoreExplanation = (score: number, isGoverned: boolean) => {
    if (isGoverned) {
      if (score < 40) return 'High risk - Not suitable for critical applications';
      if (score < 70) return 'Moderate risk - Use with caution';
      if (score < 90) return 'Low risk - Suitable for most applications';
      return 'Minimal risk - Suitable for critical applications';
    } else {
      // Different explanations for ungoverned agent
      if (score < 40) return 'High risk - Use with extreme caution';
      if (score < 70) return 'Moderate risk - Use with caution';
      return 'Moderate risk - Use with caution';
    }
  };
  
  return (
    <div className={`rounded-lg overflow-hidden ${className} ${
      isDarkMode ? 'bg-navy-800/50' : 'bg-white'
    }`}>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3">Trust Score Impact</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Initial Score</p>
            <p className={`text-2xl font-bold ${getScoreColor(initialScore)}`}>{initialScore}</p>
            <p className="text-xs text-gray-500 mt-1">{getScoreExplanation(initialScore, isGoverned)}</p>
          </div>
          
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isPositive ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Score</p>
            <p className={`text-2xl font-bold ${getScoreColor(currentScore)}`}>{currentScore}</p>
            <p className="text-xs text-gray-500 mt-1">{getScoreExplanation(currentScore, isGoverned)}</p>
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
          <div className={`h-3 w-full rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                isPositive ? 'bg-green-500' : 'bg-red-500'
              }`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Different explanations based on governance status */}
        {isGoverned && isPositive && (
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
                <p className="text-xs mt-1">
                  This means the agent is now {currentScore > 90 ? 'suitable for critical applications' : 'significantly more reliable'} and less likely to produce harmful or misleading content.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isGoverned && !isPositive && scoreDelta < 0 && (
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
                  The agent's trust score has decreased by {Math.abs(scoreDelta)} points due to detected issues like hallucinations or harmful content.
                </p>
                <p className="text-xs mt-1">
                  This demonstrates why governance is essential for maintaining reliable AI systems.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Ungoverned agent explanation */}
        {!isGoverned && isPositive && (
          <div className={`p-3 rounded-md ${
            isDarkMode ? 'bg-yellow-900/30 border border-yellow-800/50' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  Unverified improvement
                </p>
                <p className="text-xs mt-1">
                  Without governance, this score improvement is not backed by constitutional principles or verification.
                </p>
                <p className="text-xs mt-1">
                  The agent may still produce unreliable or potentially harmful content despite the score change.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!isGoverned && !isPositive && scoreDelta < 0 && (
          <div className={`p-3 rounded-md ${
            isDarkMode ? 'bg-red-900/30 border border-red-800/50' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>
                  Reliability concerns
                </p>
                <p className="text-xs mt-1">
                  Without governance, this agent has no constitutional framework to prevent harmful or misleading content.
                </p>
                <p className="text-xs mt-1">
                  This declining score indicates potential issues that would be addressed by proper governance.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* See Why This Score Changed button - different for governed vs ungoverned */}
        <div className="mt-4">
          <button
            onClick={() => setShowExplanationModal(true)}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center ${
              isDarkMode 
                ? isGoverned ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-700/50' 
                             : 'bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 border border-yellow-700/50'
                : isGoverned ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                             : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isGoverned ? 'See Why This Score Changed' : 'View Score Details'}
          </button>
        </div>
      </div>
      
      {/* Metric Explanation Modal */}
      <MetricExplanationModal
        isOpen={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
        metricType="trust"
        scoreChange={scoreDelta}
        violationType={violationType}
        prompt={latestPrompt}
        traceId={traceId}
        isGoverned={isGoverned}
      />
    </div>
  );
};

export default TrustScoreDelta;
