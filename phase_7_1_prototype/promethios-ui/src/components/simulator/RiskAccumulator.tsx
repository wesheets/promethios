import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface RiskAccumulatorProps {
  initialRisk: number;
  messageCount: number;
  violationCount: number;
  isGoverned: boolean;
  className?: string;
}

/**
 * RiskAccumulator Component
 * 
 * Visualizes risk accumulation and drift for ungoverned agents over time.
 * Shows how risk increases with each message, especially after violations.
 * Provides clear contrast between governed and ungoverned experiences.
 */
const RiskAccumulator: React.FC<RiskAccumulatorProps> = ({
  initialRisk = 20,
  messageCount = 0,
  violationCount = 0,
  isGoverned = false,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const [currentRisk, setCurrentRisk] = useState(initialRisk);
  const [riskHistory, setRiskHistory] = useState<{time: number, risk: number}[]>([
    { time: Date.now(), risk: initialRisk }
  ]);
  
  // Calculate risk based on message count and violations
  useEffect(() => {
    if (isGoverned) {
      // Governed agents have controlled risk that doesn't accumulate significantly
      const governedRisk = Math.max(5, initialRisk - messageCount * 0.5);
      setCurrentRisk(governedRisk);
      setRiskHistory(prev => [...prev, { time: Date.now(), risk: governedRisk }]);
    } else {
      // Ungoverned agents accumulate risk over time, especially with violations
      const baseIncrease = messageCount * 2;
      const violationIncrease = violationCount * 15;
      const driftFactor = Math.sqrt(messageCount) * 1.5;
      
      const newRisk = Math.min(100, initialRisk + baseIncrease + violationIncrease + driftFactor);
      setCurrentRisk(newRisk);
      setRiskHistory(prev => [...prev, { time: Date.now(), risk: newRisk }]);
    }
  }, [messageCount, violationCount, isGoverned, initialRisk]);
  
  // Get risk level description
  const getRiskLevel = (risk: number) => {
    if (risk < 20) return 'Low';
    if (risk < 40) return 'Moderate';
    if (risk < 60) return 'Significant';
    if (risk < 80) return 'High';
    return 'Critical';
  };
  
  // Get color based on risk
  const getRiskColor = (risk: number) => {
    if (risk < 20) return 'text-green-600 dark:text-green-400';
    if (risk < 40) return 'text-yellow-600 dark:text-yellow-400';
    if (risk < 60) return 'text-orange-600 dark:text-orange-400';
    if (risk < 80) return 'text-red-600 dark:text-red-400';
    return 'text-purple-600 dark:text-purple-400';
  };
  
  // Get background color based on risk
  const getRiskBgColor = (risk: number, isDark: boolean) => {
    if (risk < 20) return isDark ? 'bg-green-900/30' : 'bg-green-50';
    if (risk < 40) return isDark ? 'bg-yellow-900/30' : 'bg-yellow-50';
    if (risk < 60) return isDark ? 'bg-orange-900/30' : 'bg-orange-50';
    if (risk < 80) return isDark ? 'bg-red-900/30' : 'bg-red-50';
    return isDark ? 'bg-purple-900/30' : 'bg-purple-50';
  };
  
  // Get border color based on risk
  const getRiskBorderColor = (risk: number, isDark: boolean) => {
    if (risk < 20) return isDark ? 'border-green-800/50' : 'border-green-200';
    if (risk < 40) return isDark ? 'border-yellow-800/50' : 'border-yellow-200';
    if (risk < 60) return isDark ? 'border-orange-800/50' : 'border-orange-200';
    if (risk < 80) return isDark ? 'border-red-800/50' : 'border-red-200';
    return isDark ? 'border-purple-800/50' : 'border-purple-200';
  };
  
  // Get risk explanation
  const getRiskExplanation = (risk: number, isGoverned: boolean) => {
    if (isGoverned) {
      return 'Governance is actively preventing risk accumulation through constitutional enforcement.';
    } else {
      if (risk < 20) return 'Risk is currently low but will increase with continued use without governance.';
      if (risk < 40) return 'Risk is accumulating as the agent operates without constitutional guardrails.';
      if (risk < 60) return 'Significant risk has accumulated. The agent may produce increasingly unreliable content.';
      if (risk < 80) return 'High risk level detected. Without governance, the agent is becoming increasingly unsafe.';
      return 'Critical risk level. The agent has accumulated substantial drift and is no longer reliable.';
    }
  };
  
  // Calculate risk trend (increasing, decreasing, or stable)
  const getRiskTrend = () => {
    if (riskHistory.length < 2) return 'stable';
    const lastTwo = riskHistory.slice(-2);
    const diff = lastTwo[1].risk - lastTwo[0].risk;
    
    if (diff > 1) return 'increasing';
    if (diff < -1) return 'decreasing';
    return 'stable';
  };
  
  // Get trend icon
  const getTrendIcon = () => {
    const trend = getRiskTrend();
    
    if (trend === 'increasing') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (trend === 'decreasing') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 2a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1h4zm10 0a1 1 0 011 1v14a1 1 0 01-1 1h-4a1 1 0 01-1-1V3a1 1 0 011-1h4z" clipRule="evenodd" />
      </svg>
    );
  };
  
  return (
    <div className={`rounded-lg overflow-hidden ${className} ${
      isDarkMode ? 'bg-navy-800/50' : 'bg-white'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Risk Accumulation</h3>
          <div className="flex items-center">
            {getTrendIcon()}
            <span className={`ml-1 text-sm font-medium ${
              getRiskTrend() === 'increasing' ? 'text-red-500' : 
              getRiskTrend() === 'decreasing' ? 'text-green-500' : 
              'text-gray-500'
            }`}>
              {getRiskTrend() === 'increasing' ? 'Rising' : 
               getRiskTrend() === 'decreasing' ? 'Falling' : 
               'Stable'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Risk Level</p>
            <div className="flex items-center">
              <p className={`text-2xl font-bold ${getRiskColor(currentRisk)}`}>{Math.round(currentRisk)}</p>
              <p className={`ml-2 text-sm font-medium ${getRiskColor(currentRisk)}`}>
                {getRiskLevel(currentRisk)}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Violations</p>
            <p className={`text-2xl font-bold ${violationCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {violationCount}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Drift Factor</p>
            <p className={`text-2xl font-bold ${
              isGoverned ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {isGoverned ? 'Controlled' : 'Active'}
            </p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Risk Meter</p>
            <p className={`text-sm font-bold ${getRiskColor(currentRisk)}`}>
              {Math.round(currentRisk)}%
            </p>
          </div>
          <div className={`h-3 w-full rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                currentRisk < 20 ? 'bg-green-500' : 
                currentRisk < 40 ? 'bg-yellow-500' : 
                currentRisk < 60 ? 'bg-orange-500' : 
                currentRisk < 80 ? 'bg-red-500' : 
                'bg-purple-500'
              }`} 
              style={{ width: `${Math.min(100, currentRisk)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Risk Explanation */}
        <div className={`p-3 rounded-md ${
          getRiskBgColor(currentRisk, isDarkMode)} border ${getRiskBorderColor(currentRisk, isDarkMode)}`}>
          <div className="flex items-start">
            {currentRisk < 40 ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <div>
              <p className={`text-sm font-medium ${
                currentRisk < 20 ? (isDarkMode ? 'text-green-400' : 'text-green-800') : 
                currentRisk < 40 ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-800') : 
                currentRisk < 60 ? (isDarkMode ? 'text-orange-400' : 'text-orange-800') : 
                currentRisk < 80 ? (isDarkMode ? 'text-red-400' : 'text-red-800') : 
                (isDarkMode ? 'text-purple-400' : 'text-purple-800')
              }`}>
                {getRiskLevel(currentRisk)} Risk Level
              </p>
              <p className="text-xs mt-1">
                {getRiskExplanation(currentRisk, isGoverned)}
              </p>
              {!isGoverned && currentRisk > 40 && (
                <p className="text-xs mt-1 font-medium text-red-500">
                  Governance would prevent this risk accumulation.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Risk Factors */}
        {!isGoverned && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Risk Factors</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs">Unverified Claims</p>
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: `${Math.min(100, messageCount * 5)}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs">Drift Accumulation</p>
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, Math.sqrt(messageCount) * 15)}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs">Violation Impact</p>
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${Math.min(100, violationCount * 20)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Governance Status */}
        <div className="mt-4 text-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isGoverned 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {isGoverned ? (
              <>
                <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Governance Active
              </>
            ) : (
              <>
                <svg className="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Ungoverned
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RiskAccumulator;
